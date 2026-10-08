import { designTokens, HALO_UI_DEFAULTS, deepMerge, rgba, clampNumber } from "./halo-core.js";

function signature(value) {
  try { return JSON.stringify(value); } catch { return String(value); }
}

const CARD_COMPAT_PROPERTIES = [
  "--primary-text-color",
  "--secondary-text-color",
  "--state-icon-active-color",
  "--accent-color",
  "--mdc-theme-primary",
  "--paper-slider-active-color",
  "--paper-slider-knob-color",
  "--paper-slider-pin-color",
  "--control-slider-color",
  "--control-slider-background",
  "--ha-control-slider-active-color",
  "--ha-control-slider-inactive-color",
  "--slider-color",
  "--slider-track-color",
  "--slider-bar-color",
  "--shape-color",
  "--badge-color"
];

const TOKEN_PROPERTIES = [
  "--halo-accent",
  "--halo-text-color",
  "--halo-secondary-text-color",
  "--halo-radius",
  "--halo-blur",
  "--halo-surface-background",
  "--halo-surface-border",
  "--halo-surface-shadow",
  "--primary-color",
  "--ha-card-background",
  "--card-background-color",
  "--ha-card-border-radius",
  "--ha-card-border-color",
  "--ha-card-border-width",
  "--ha-card-box-shadow",
  "--state-media_player-active-color",
  "--state-light-active-color",
  "--state-switch-active-color",
  "--state-vacuum-active-color",
  "--halo-card-gap",
  "--halo-section-gap",
  "--grid-card-gap",
  "--grid-gap",
  "--section-gap",
  "--sections-column-gap",
  "--ha-sections-column-gap",
  "--ha-view-sections-column-gap"
];

function walkOpenTree(root, onRoot, onElement) {
  if (!root) return;

  const visitRoot = (currentRoot) => {
    onRoot?.(currentRoot);

    const nodes = currentRoot instanceof ShadowRoot
      ? currentRoot.querySelectorAll("*")
      : currentRoot.querySelectorAll?.("*") || [];

    for (const node of nodes) {
      if (!(node instanceof Element)) continue;
      onElement?.(node);
      if (node.shadowRoot) visitRoot(node.shadowRoot);
    }
  };

  if (root instanceof Element) {
    onElement?.(root);
    if (root.shadowRoot) visitRoot(root.shadowRoot);
  }
  visitRoot(root);
}

export class HaloDesignManager {
  constructor(owner) {
    this.owner = owner;
    this.targetView = null;
    this.design = deepMerge(HALO_UI_DEFAULTS.design, {});
    this._previousVars = new Map();
    this._previousCards = new Map();
    this._styledCards = new Set();
    this._observers = new Map();
    this._scanQueued = false;
    this._designSig = "";
    this._hass = null;
    this._onResize = () => {
      if (!this.targetView || this.design?.responsive_spacing === false) return;
      this._applyVariables();
    };
  }

  mount(targetView, design) {
    if (!targetView) return;

    const next = deepMerge(HALO_UI_DEFAULTS.design, design || {});
    const nextSig = signature(next);
    const targetChanged = this.targetView !== targetView;

    if (targetChanged) {
      this.destroy();
      this.targetView = targetView;
      this._rememberVariables();
      window.addEventListener("resize", this._onResize, { passive: true });
    }

    const designChanged = nextSig !== this._designSig;
    this.design = next;
    this._designSig = nextSig;

    if (targetChanged || designChanged) {
      this._applyVariables();
      this._scanAndStyle();
    }
  }

  update(design) {
    const next = deepMerge(HALO_UI_DEFAULTS.design, design || {});
    const nextSig = signature(next);

    if (nextSig === this._designSig) return;

    this.design = next;
    this._designSig = nextSig;

    if (!this.targetView) return;
    this._applyVariables();
    this._scanAndStyle();
  }

  _rememberVariables() {
    if (!this.targetView) return;
    for (const key of TOKEN_PROPERTIES) {
      this._previousVars.set(key, {
        value: this.targetView.style.getPropertyValue(key),
        priority: this.targetView.style.getPropertyPriority(key)
      });
    }
  }

  _applyVariables() {
    if (!this.targetView) return;
    const d = this.design;
    const t = designTokens(d);

    const width = window.innerWidth || 1920;
    const responsive = d.responsive_spacing !== false;
    const tabletBp = 1400;
    const mobileBp = 850;
    const cardGap = responsive && width < mobileBp
      ? clampNumber(d.mobile_card_gap, 0, 48, 8)
      : responsive && width < tabletBp
        ? clampNumber(d.tablet_card_gap, 0, 48, 10)
        : clampNumber(d.card_gap, 0, 48, 12);
    const sectionGap = responsive && width < mobileBp
      ? clampNumber(d.mobile_section_gap, 0, 64, 10)
      : responsive && width < tabletBp
        ? clampNumber(d.tablet_section_gap, 0, 64, 14)
        : clampNumber(d.section_gap, 0, 64, 18);

    const vars = {
      "--halo-accent": t.accent,
      "--halo-text-color": t.text,
      "--halo-secondary-text-color": t.secondaryText,
      "--halo-radius": `${t.radius}px`,
      "--halo-blur": `${t.blur}px`,
      "--halo-surface-background": t.surface,
      "--halo-surface-border": t.surfaceBorder,
      "--halo-surface-shadow": t.shadow,
      "--halo-card-gap": `${cardGap}px`,
      "--halo-section-gap": `${sectionGap}px`,

      // Home Assistant has changed the exact Sections variable names more than
      // once. Supplying the common variants is harmless when unused and keeps
      // Halo compatible across frontend revisions.
      "--grid-card-gap": `${cardGap}px`,
      "--grid-gap": `${cardGap}px`,
      "--section-gap": `${sectionGap}px`,
      "--sections-column-gap": `${sectionGap}px`,
      "--ha-sections-column-gap": `${sectionGap}px`,
      "--ha-view-sections-column-gap": `${sectionGap}px`,

      // Native HA variables: inherited through open/closed component boundaries.
      "--ha-card-background": t.surface,
      "--card-background-color": t.surface,
      "--ha-card-border-radius": `${t.radius}px`,
      "--ha-card-border-color": t.surfaceBorder,
      "--ha-card-border-width": `${t.borderWidth}px`,
      "--ha-card-box-shadow": t.shadow,

      // Active-state colors are scoped per card in _styleCard().
      // Keeping them off the whole view avoids one entity affecting unrelated UI.
    };

    if (d.apply_accent_to_ha !== false) vars["--primary-color"] = t.accent;

    for (const [key, value] of Object.entries(vars)) {
      this.targetView.style.setProperty(key, value);
    }
  }

  _rememberCard(card) {
    if (this._previousCards.has(card)) return;
    this._previousCards.set(card, card.getAttribute("style"));
  }


  _cardHostChain(card) {
    const names = [];
    let node = card;
    let guard = 0;
    while (node && guard++ < 10) {
      const root = node.getRootNode?.();
      const host = root instanceof ShadowRoot ? root.host : null;
      if (!(host instanceof Element)) break;
      names.push(String(host.localName || "").toLowerCase());
      node = host;
    }
    return names;
  }

  _cardKind(card) {
    const chain = this._cardHostChain(card);
    const joined = chain.join(" ");
    if (joined.includes("mova-z60-card")) return "custom-complex";
    if (joined.includes("heading")) return "heading";
    if (joined.includes("media-control")) return "media";
    if (joined.includes("big-slider-card")) return "slider";
    if (joined.includes("mushroom")) return "mushroom";
    if (joined.includes("rgb-light-card")) return "rgb";
    if (joined.includes("light-card") || joined.includes("hui-light")) return "light";
    if (joined.includes("gauge")) return "gauge";
    if (joined.includes("tile")) return "tile";
    if (joined.includes("entity") || joined.includes("entities")) return "entity";
    return "generic";
  }

  setHass(hass) {
    this._hass = hass || null;
    if (!this.targetView) return;
    // HA calls the card hass setter on every relevant state update. Re-apply
    // only already discovered cards so active-state visuals follow entities
    // live without rebuilding the dashboard.
    for (const card of this._styledCards) {
      if (card?.isConnected) this._styleCard(card);
    }
  }

  _entityForCard(card) {
    let node = card;
    let guard = 0;
    while (node && guard++ < 12) {
      const candidates = [
        node.config?.entity,
        node._config?.entity,
        node.entity,
        node.getAttribute?.("entity")
      ];
      for (const value of candidates) {
        if (typeof value === "string" && value.includes(".")) return value;
      }
      const root = node.getRootNode?.();
      const host = root instanceof ShadowRoot ? root.host : null;
      if (!(host instanceof Element)) break;
      node = host;
    }
    return null;
  }

  _activeState(entityId) {
    if (!entityId || !this._hass?.states) return { active: false, state: null, domain: null, entity: null, subtype: null };
    const entity = this._hass.states[entityId];
    if (!entity) return { active: false, state: null, domain: entityId.split(".")[0] || null, entity: null, subtype: null };
    const domain = entityId.split(".")[0];
    const state = String(entity.state ?? "").toLowerCase();
    let active = false;
    let subtype = null;
    if (["light", "switch", "input_boolean", "fan"].includes(domain)) active = state === "on";
    else if (domain === "media_player") active = !["off", "idle", "standby", "unavailable", "unknown"].includes(state);
    else if (domain === "vacuum") active = ["cleaning", "returning", "paused"].includes(state);
    else if (domain === "climate") {
      active = !["off", "unavailable", "unknown"].includes(state);
      const action = String(entity.attributes?.hvac_action ?? "").toLowerCase();
      if (action === "heating" || state === "heat") subtype = "heating";
      else if (action === "cooling" || state === "cool") subtype = "cooling";
    } else if (domain === "lock") active = state === "unlocked";
    return { active, state, domain, entity, subtype };
  }

  _stateColor(activeInfo, tokens) {
    const d = this.design || {};
    if (d.state_colors_enabled === false) return tokens.accent;
    const domain = activeInfo?.domain;
    if (domain === "light") return d.state_light || "#ffd400";
    if (["switch", "input_boolean", "fan"].includes(domain)) return d.state_switch || "#22c55e";
    if (domain === "media_player") return d.state_media_player || tokens.accent;
    if (domain === "vacuum") return d.state_vacuum || tokens.accent;
    if (domain === "climate" && activeInfo?.subtype === "heating") return d.state_climate_heating || "#ff7a00";
    if (domain === "climate" && activeInfo?.subtype === "cooling") return d.state_climate_cooling || "#4fc3f7";
    return tokens.accent;
  }

  _applyCompatibility(card, kind, activeInfo, stateColor, tokens) {
    for (const prop of CARD_COMPAT_PROPERTIES) card.style.removeProperty(prop);

    const d = this.design || {};
    if (d.card_compatibility === false) return;
    const level = String(d.card_compatibility_level || "balanced");
    const innerAccent = d.card_inner_accent !== false;
    const tint = clampNumber(d.card_control_tint, 0, .6, .22);
    const activeColor = activeInfo?.active ? stateColor : tokens.accent;

    // Safe baseline: typography/control tokens only. These variables are widely
    // supported and do not mutate a card's DOM or internal layout.
    card.style.setProperty("--primary-text-color", tokens.text, "important");
    card.style.setProperty("--secondary-text-color", tokens.secondaryText, "important");
    if (innerAccent) {
      card.style.setProperty("--state-icon-active-color", activeColor, "important");
      card.style.setProperty("--accent-color", activeColor, "important");
    }

    if (level === "safe") return;

    // Common HA controls and several popular custom cards consume one or more
    // of these variables. Unsupported variables are simply ignored by CSS.
    if (innerAccent) {
      card.style.setProperty("--mdc-theme-primary", activeColor, "important");
      card.style.setProperty("--paper-slider-active-color", activeColor, "important");
      card.style.setProperty("--paper-slider-knob-color", activeColor, "important");
      card.style.setProperty("--paper-slider-pin-color", activeColor, "important");
      card.style.setProperty("--control-slider-color", activeColor, "important");
      card.style.setProperty("--ha-control-slider-active-color", activeColor, "important");
      card.style.setProperty("--slider-color", activeColor, "important");
      card.style.setProperty("--slider-bar-color", activeColor, "important");
      card.style.setProperty("--badge-color", activeColor, "important");
    }
    card.style.setProperty("--control-slider-background", rgba(activeColor, tint), "important");
    card.style.setProperty("--ha-control-slider-inactive-color", rgba(tokens.text, Math.min(.28, tint)), "important");
    card.style.setProperty("--slider-track-color", rgba(activeColor, tint), "important");

    if (kind === "mushroom") {
      card.style.setProperty("--shape-color", rgba(activeColor, activeInfo?.active ? Math.min(.32, tint + .08) : Math.min(.18, tint)), "important");
    }

    if (level !== "strong") return;

    // Strong mode intentionally remains CSS-variable-only, but gives controls
    // more visible Halo/state tinting. Complex app-like cards are excluded.
    if (kind !== "custom-complex" && innerAccent) {
      card.style.setProperty("--control-slider-background", rgba(activeColor, Math.min(.5, tint + .14)), "important");
      card.style.setProperty("--slider-track-color", rgba(activeColor, Math.min(.5, tint + .14)), "important");
      if (kind === "mushroom") card.style.setProperty("--shape-color", rgba(activeColor, activeInfo?.active ? .30 : .22), "important");
    }
  }

  _styleCard(card) {
    if (!(card instanceof HTMLElement)) return;
    this._rememberCard(card);

    const d = this.design || {};
    const t = designTokens(d);
    const mode = String(d.surface_style || "glass");
    let opacity = clampNumber(d.surface_opacity, 0, 1, .34);
    let blur = clampNumber(d.surface_blur ?? d.blur, 0, 60, 18);
    let saturation = clampNumber(d.surface_saturation, 80, 200, 125);
    let shadowStrength = clampNumber(d.surface_shadow_strength, 0, .8, .28);

    if (mode === "clear") {
      // Clear Glass = transparent glass without backdrop blur.  This keeps the
      // background sharp while retaining tint, border and highlight.
      opacity *= .62;
      blur = 0;
      saturation = 100;
      shadowStrength *= .72;
    } else if (mode === "soft") {
      opacity = Math.min(.82, opacity * 1.22);
      blur = Math.max(8, blur - 2);
      saturation = Math.max(100, saturation - 8);
    } else if (mode === "solid") {
      opacity = Math.max(.82, opacity);
      blur = 0;
      saturation = 100;
    }

    const base = rgba(d.surface_tint || "#14141a", opacity);
    const highlight = clampNumber(d.surface_highlight_opacity, 0, .24, .08);
    const sheen = highlight > 0
      ? `linear-gradient(145deg, rgba(255,255,255,${highlight}) 0%, rgba(255,255,255,0) 42%), ${base}`
      : base;

    const kind = this._cardKind(card);
    const entityId = this._entityForCard(card);
    const activeInfo = this._activeState(entityId);
    const protectComplex = kind === "custom-complex" && d.card_complex_frame_only !== false;
    card.dataset.haloSurface = "true";
    card.dataset.haloSurfaceStyle = mode;
    card.dataset.haloCardKind = kind;
    if (entityId) card.dataset.haloEntity = entityId; else delete card.dataset.haloEntity;
    card.dataset.haloActive = activeInfo.active ? "true" : "false";
    card.dataset.haloCompatibility = d.card_compatibility === false ? "off" : String(d.card_compatibility_level || "balanced");

    // Section headings are layout chrome, not content cards. Keep their native
    // typography/controls but remove the normal glass-card treatment and apply
    // one of Halo's lightweight section styles. This also keeps HA edit-mode
    // drag/menu controls fully functional.
    if (kind === "heading") {
      const sectionStyle = String(d.section_style || "accent-line");
      const headingSize = clampNumber(d.section_heading_size, 11, 28, 15);
      const headingWeight = clampNumber(d.section_heading_weight, 300, 900, 600);
      const headingOpacity = clampNumber(d.section_heading_opacity, .3, 1, .92);
      card.style.setProperty("background", sectionStyle === "glass" ? rgba(d.surface_tint || "#14141a", Math.min(.26, opacity * .7)) : "transparent", "important");
      card.style.setProperty("box-shadow", sectionStyle === "glass" ? `inset 0 1px 0 rgba(255,255,255,${Math.min(.12, highlight)})` : "none", "important");
      card.style.setProperty("backdrop-filter", sectionStyle === "glass" && blur > 0 ? `blur(${Math.min(blur, 10)}px) saturate(${saturation}%)` : "none", "important");
      card.style.setProperty("-webkit-backdrop-filter", sectionStyle === "glass" && blur > 0 ? `blur(${Math.min(blur, 10)}px) saturate(${saturation}%)` : "none", "important");
      card.style.setProperty("border", "none", "important");
      card.style.setProperty("border-radius", sectionStyle === "glass" ? `${Math.max(6, Math.round(t.radius * .65))}px` : "0", "important");
      card.style.setProperty("font-size", `${headingSize}px`, "important");
      card.style.setProperty("font-weight", String(headingWeight), "important");
      card.style.setProperty("color", rgba(d.text_color || "#ffffff", headingOpacity), "important");
      card.style.setProperty("--primary-text-color", rgba(d.text_color || "#ffffff", headingOpacity), "important");
      if (sectionStyle === "accent-line") {
        card.style.setProperty("border-bottom", `1px solid ${rgba(d.accent || "#00b8e6", .55)}`, "important");
      } else {
        card.style.removeProperty("border-bottom");
      }
      if (sectionStyle === "minimal") card.style.setProperty("opacity", String(headingOpacity), "important");
      else card.style.removeProperty("opacity");
      this._styledCards.add(card);
      return;
    }

    // Compatibility policy: complex third-party cards keep their own internal
    // design. Halo only frames their outer ha-card instead of trying to repaint
    // nested application UIs such as vacuum maps.
    if (protectComplex) {
      opacity = Math.min(opacity, .20);
      blur = 0;
      shadowStrength *= .65;
    }
    let finalBackground = sheen;
    let finalBorder = t.surfaceBorder;
    let finalShadow = `${t.shadow}, inset 0 1px 0 rgba(255,255,255,${Math.min(.18, highlight * .85)})`;

    // Active entities use semantic colors that are independent from Halo's
    // global accent. Example: Halo can stay cyan while active lights are yellow.
    const stateColor = this._stateColor(activeInfo, t);
    this._applyCompatibility(card, kind, activeInfo, stateColor, t);
    if (activeInfo.active && !protectComplex) {
      const borderOpacity = clampNumber(d.active_border_opacity, 0, 1, .78);
      const glow = clampNumber(d.active_glow_strength, 0, .8, .20);
      const tint = clampNumber(d.active_surface_tint, 0, .5, .08);
      finalBorder = rgba(stateColor, borderOpacity);
      if (tint > 0) {
        finalBackground = `linear-gradient(145deg, ${rgba(stateColor, tint)} 0%, rgba(255,255,255,${highlight}) 32%, rgba(255,255,255,0) 58%), ${base}`;
      }
      finalShadow = `0 0 0 1px ${rgba(stateColor, Math.min(.55, borderOpacity * .36))}, 0 0 ${Math.round(10 + glow * 45)}px ${rgba(stateColor, glow)}, ${t.shadow}, inset 0 1px 0 rgba(255,255,255,${Math.min(.20, highlight)})`;
    }

    // Some native/custom HA cards ship their own high-specificity active
    // background. Use inline !important only for the outer ha-card surface so
    // Halo never turns an entire media/light card into a solid state color.
    card.style.setProperty("background", finalBackground, "important");
    const activeBorderWidth = activeInfo.active && !protectComplex ? Math.max(t.borderWidth, clampNumber(d.active_border_width, 0, 6, 1)) : t.borderWidth;
    card.style.setProperty("border", `${activeBorderWidth}px solid ${finalBorder}`, "important");
    card.style.setProperty("border-radius", `${t.radius}px`, "important");
    card.style.setProperty("box-shadow", finalShadow, "important");
    card.style.setProperty("backdrop-filter", blur > 0 ? `blur(${blur}px) saturate(${saturation}%)` : "none", "important");
    card.style.setProperty("-webkit-backdrop-filter", blur > 0 ? `blur(${blur}px) saturate(${saturation}%)` : "none", "important");

    // Scope active-state colors to the card itself. This prevents one active
    // light/media entity from bleeding its own color into unrelated Halo UI.
    if (activeInfo.active && !protectComplex) {
      card.style.setProperty("--primary-color", stateColor, "important");
      card.style.setProperty("--state-light-active-color", activeInfo.domain === "light" ? stateColor : (d.state_light || "#ffd400"), "important");
      card.style.setProperty("--state-switch-active-color", ["switch","input_boolean","fan"].includes(activeInfo.domain) ? stateColor : (d.state_switch || "#22c55e"), "important");
      card.style.setProperty("--state-media_player-active-color", activeInfo.domain === "media_player" ? stateColor : (d.state_media_player || t.accent), "important");
      card.style.setProperty("--state-vacuum-active-color", activeInfo.domain === "vacuum" ? stateColor : (d.state_vacuum || t.accent), "important");
    } else {
      card.style.removeProperty("--primary-color");
      card.style.removeProperty("--state-light-active-color");
      card.style.removeProperty("--state-switch-active-color");
      card.style.removeProperty("--state-media_player-active-color");
      card.style.removeProperty("--state-vacuum-active-color");
    }
    this._styledCards.add(card);
  }

  _observeRoot(root) {
    if (!root || this._observers.has(root) || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes || []) {
          if (node instanceof Element) this._scanAddedNode(node);
        }
      }
    });

    try {
      observer.observe(root, { childList: true, subtree: true });
      this._observers.set(root, observer);
    } catch {}
  }

  _scanAddedNode(node) {
    if (!(node instanceof Element)) return;

    if (node.localName === "ha-card") this._styleCard(node);

    if (node.shadowRoot) {
      this._observeRoot(node.shadowRoot);
      walkOpenTree(
        node.shadowRoot,
        root => this._observeRoot(root),
        el => {
          if (el.localName === "ha-card") this._styleCard(el);
        }
      );
    }

    // Only inspect the newly added subtree, not the entire dashboard.
    node.querySelectorAll?.("ha-card")?.forEach(card => this._styleCard(card));

    node.querySelectorAll?.("*")?.forEach(el => {
      if (el.shadowRoot) {
        this._observeRoot(el.shadowRoot);
        walkOpenTree(
          el.shadowRoot,
          root => this._observeRoot(root),
          child => {
            if (child.localName === "ha-card") this._styleCard(child);
          }
        );
      }
    });
  }

  _queueScan() {
    if (this._scanQueued) return;
    this._scanQueued = true;
    requestAnimationFrame(() => {
      this._scanQueued = false;
      this._scanAndStyle();
    });
  }

  _scanAndStyle() {
    if (!this.targetView) return;

    walkOpenTree(
      this.targetView,
      root => this._observeRoot(root),
      el => {
        if (el.localName === "ha-card") this._styleCard(el);
      }
    );
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
    for (const observer of this._observers.values()) observer.disconnect();
    this._observers.clear();

    for (const card of this._styledCards) {
      const previous = this._previousCards.get(card);
      try {
        if (previous == null) card.removeAttribute("style");
        else card.setAttribute("style", previous);
        delete card.dataset.haloSurface;
        delete card.dataset.haloSurfaceStyle;
        delete card.dataset.haloCardKind;
        delete card.dataset.haloEntity;
        delete card.dataset.haloActive;
        delete card.dataset.haloCompatibility;
      } catch {}
    }
    this._styledCards.clear();
    this._previousCards.clear();

    if (this.targetView) {
      for (const key of TOKEN_PROPERTIES) {
        const previous = this._previousVars.get(key);
        if (!previous || !previous.value) this.targetView.style.removeProperty(key);
        else this.targetView.style.setProperty(key, previous.value, previous.priority || "");
      }
    }

    this._previousVars.clear();
    this._designSig = "";
    this._hass = null;
    this.targetView = null;
  }
}
