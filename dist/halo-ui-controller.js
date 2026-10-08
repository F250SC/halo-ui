import { HALO_UI_VERSION, normalizeConfig, toLegacySidebarConfig, resolveViewConfig, currentViewKey, applyPerformanceTuning } from "./halo-core.js";
import { localizeHaloDom, translateHaloText } from "./halo-i18n.js";
import { HaloBackgroundManager } from "./halo-background.js";
import { HaloDesignManager } from "./halo-design.js";
import { HaloHeaderManager } from "./halo-dashboard-header.js";
import { publishDashboardConfig } from "./halo-dashboard-runtime.js";
import "./halo-ui-editor.js";

const LegacyViewSidebar = customElements.get("halo-view-sidebar");
if (!LegacyViewSidebar) throw new Error("Halo UI: legacy halo-view-sidebar module was not loaded.");

const HALO_UI_SUPPORTED_VIEWS = "hui-sections-view, hui-masonry-view, hui-sidebar-view";
function findHaloView(start) {
  let node = start;
  for (let i = 0; i < 45 && node; i++) {
    if (node instanceof Element && node.matches(HALO_UI_SUPPORTED_VIEWS)) return node;
    node = node.parentElement || (node.getRootNode?.()?.host || null);
  }
  return null;
}

export class HaloUI extends LegacyViewSidebar {
  constructor() {
    super();
    this._haloUiConfig = normalizeConfig({});
    this._backgroundManager = new HaloBackgroundManager(this);
    this._designManager = new HaloDesignManager(this);
    this._headerManager = new HaloHeaderManager();
    const initialPreview = window.__haloUiPreviewContext;
    this._haloPreviewTab = typeof initialPreview === "object" ? (initialPreview.tab || "modules") : (initialPreview || "modules");
    this._haloPreviewViewKey = typeof initialPreview === "object" ? (initialPreview.viewKey || "__dashboard__") : "__dashboard__";
    this._previewBackgroundLayer = null;
    this._ownerEditButton = null;

    this._onHaloPreviewContext = (event) => {
      const tab = event?.detail?.tab;
      if (!["modules","design","background","sidebar","header","system"].includes(tab)) return;
      this._haloPreviewTab = tab;
      this._haloPreviewViewKey = event?.detail?.viewKey || "__dashboard__";
      if (this._inEditor?.()) {
        this._config = toLegacySidebarConfig(this._previewConfig());
        this._renderPlaceholder();
      }
    };
  }

  static getConfigElement() { return document.createElement("halo-ui-editor"); }
  static getStubConfig() { return normalizeConfig({}); }

  _inEditor() {
    if (super._inEditor?.()) return true;

    let node = this;
    for (let i = 0; i < 30 && node; i++) {
      if (
        node instanceof Element &&
        node.classList?.contains("halo-runtime-editor-preview")
      ) {
        return true;
      }
      node = node.parentElement || node.getRootNode?.()?.host || null;
    }

    return false;
  }

  _globalEditModeFallback() {
    let found = false;

    const walk = (root) => {
      const all = root?.querySelectorAll?.("*") || [];

      for (const el of all) {
        if (
          el.localName === "hui-card-edit-mode" ||
          el.localName === "hui-view-header-edit-mode" ||
          el.localName === "hui-view-footer-edit-mode"
        ) {
          found = true;
          return true;
        }

        if (el.shadowRoot && walk(el.shadowRoot)) return true;
      }

      return false;
    };

    walk(document);
    return found;
  }

  _removeOwnerEditButton() {
    this._ownerEditButton?.remove();
    this._ownerEditButton = null;
  }

  _ensureOwnerEditButton() {
    // Dashboard-wide Halo UI has exactly one edit control, owned by the
    // persistent dashboard runtime. Keeping a second owner-card button caused
    // races when Sidebar was disabled or the physical owner card was hidden.
    if (
      this._haloPreviewOnly ||
      !this.isConnected ||
      this._haloUiConfig?.target?.mode === "dashboard"
    ) return null;

    let button = this._ownerEditButton;

    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "halo-ui-owner-edit-button";
      button.title = "Halo UI bearbeiten";
      button.setAttribute("aria-label", "Halo UI bearbeiten");

      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", "mdi:cog");
      icon.style.cssText = "width:21px;height:21px;color:#fff;";
      button.appendChild(icon);

      button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.07)";
        button.style.background = "rgba(0,184,230,.92)";
        button.style.opacity = "1";
      });

      button.addEventListener("mouseleave", () => {
        const editMode =
          super._dashboardEditMode?.() === true ||
          this._globalEditModeFallback();

        button.style.transform = "scale(1)";
        button.style.background = editMode
          ? "rgba(0,184,230,.82)"
          : "rgba(18,18,24,.62)";
        button.style.opacity = editMode ? "1" : ".70";
      });

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const editMode =
          super._dashboardEditMode?.() === true ||
          this._globalEditModeFallback();

        // Dashboard mode also has a runtime editor that can work without HA's
        // native edit wrapper. Prefer native owner editing while edit mode is
        // active, otherwise use the runtime editor as a safe fallback.
        if (
          !editMode &&
          this._haloUiConfig?.target?.mode === "dashboard" &&
          window.__haloUiDashboardRuntime?._openRuntimeEditor
        ) {
          window.__haloUiDashboardRuntime._openRuntimeEditor();
          return;
        }

        this._openHaloEditor();
      });

      document.body.appendChild(button);
      this._ownerEditButton = button;
    }

    if (button.parentElement !== document.body) {
      document.body.appendChild(button);
    }

    return button;
  }

  // Overrides HaloViewSidebar._syncEditControl().
  // The superclass timer calls this polymorphically, so no second timer is
  // needed. This button never depends on a Sidebar portal.
  _syncEditControl() {
    if (this._haloPreviewOnly || !this.isConnected) {
      this._removeOwnerEditButton();
      return;
    }

    // Dashboard mode is edited exclusively through the persistent runtime
    // control. This makes the gear independent from Sidebar, Header and the
    // physical controller card's position/visibility.
    if (this._haloUiConfig?.target?.mode === "dashboard") {
      this._removeOwnerEditButton();
      window.__haloUiDashboardRuntime?._syncEditButton?.();
      return;
    }

    const target = this._view || findHaloView(this);
    if (!target?.isConnected) {
      this._removeOwnerEditButton();
      return;
    }

    const editMode =
      super._dashboardEditMode?.() === true ||
      this._globalEditModeFallback();

    // The owner-view gear must follow the exact same rule as the dashboard
    // runtime gear: it exists ONLY while Home Assistant is actually in
    // Lovelace edit mode. Previous versions always rendered this button for
    // current_view mode and only changed its appearance/click behavior, which
    // is why the cog stayed visible after pressing "Fertig".
    if (!editMode) {
      this._removeOwnerEditButton();
      return;
    }

    const button = this._ensureOwnerEditButton();
    if (!button) return;

    const rect = target.getBoundingClientRect();

    // Keep clear of HA's own edit pencil in the upper-right corner.
    const top = Math.max(102, rect.top + 16);
    const right = Math.max(
      66,
      window.innerWidth - Math.min(window.innerWidth, rect.right) + 66
    );

    button.style.cssText = `
      position:fixed;
      top:${top}px;
      right:${right}px;
      left:auto;
      z-index:100001;
      width:40px;
      height:40px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:12px;
      border:1px solid ${editMode ? "rgba(0,184,230,.78)" : "rgba(255,255,255,.22)"};
      background:${editMode ? "rgba(0,184,230,.82)" : "rgba(18,18,24,.62)"};
      color:#fff;
      opacity:${editMode ? "1" : ".70"};
      box-shadow:0 8px 24px rgba(0,0,0,.32);
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      cursor:pointer;
      padding:0;
      transition:
        transform .16s ease,
        background .16s ease,
        opacity .16s ease,
        border-color .16s ease;
    `;
  }

  _openHaloEditor() {
    // Always open Halo for the view the user is currently looking at.
    // This makes the owner-view gear behave exactly like the dashboard
    // runtime gear on inherited views.
    const viewKey =
      this._haloUiConfig?.target?.mode === "dashboard"
        ? (currentViewKey() || "__dashboard__")
        : "__dashboard__";

    const context = {
      tab: this._haloPreviewTab || "modules",
      viewKey
    };

    this._haloPreviewViewKey = viewKey;
    window.__haloUiPreviewContext = context;
    window.dispatchEvent(new CustomEvent("halo-ui-preview-context", {
      detail: context
    }));

    if (super._openHaloEditor) {
      super._openHaloEditor();
      return;
    }

    this.dispatchEvent(new CustomEvent("ll-edit-card", {
      bubbles: true,
      composed: true
    }));
  }

  setConfig(config) {
    if (!config) throw new Error("Halo UI configuration is required.");
    this._haloUiConfig = normalizeConfig(config);
    const ownerViewConfig = this._haloUiConfig.target?.mode === "dashboard"
      ? resolveViewConfig(this._haloUiConfig, currentViewKey())
      : this._haloUiConfig;

    this._runtimeOwnerConfig = applyPerformanceTuning(ownerViewConfig);
    super.setConfig(toLegacySidebarConfig(this._runtimeOwnerConfig));
    if (!this._haloPreviewOnly) {
      publishDashboardConfig(this._haloUiConfig);
    }
    queueMicrotask(() => this._syncHaloModules());
  }

  set hass(hass) {
    super.hass = hass;
    this._haloHass = hass;
    const runtimeConfig =
      this._runtimeOwnerConfig ||
      applyPerformanceTuning(this._haloUiConfig);

    this._backgroundManager.update(runtimeConfig.background, runtimeConfig.design, hass);
    this._designManager.update(runtimeConfig.design);
    this._designManager.setHass(hass);
    this._headerManager.update(runtimeConfig, hass);
    if (this._previewBackgroundLayer) this._previewBackgroundLayer.hass = hass;
    if (this._previewHeaderElement) {
      const previewConfig = this._previewConfig();
      this._previewHeaderElement.config = this._resolvedPreviewHeaderConfig(previewConfig);
      this._previewHeaderElement.hass = hass;
    }
  }

  connectedCallback() {
    window.addEventListener("halo-ui-preview-context", this._onHaloPreviewContext);
    {
      const preview = window.__haloUiPreviewContext;
      if (typeof preview === "object" && preview) {
        this._haloPreviewTab = preview.tab || this._haloPreviewTab || "modules";
        this._haloPreviewViewKey = preview.viewKey || this._haloPreviewViewKey || "__dashboard__";
      } else {
        this._haloPreviewTab = preview || this._haloPreviewTab || "modules";
      }
    }
    super.connectedCallback();
    if (!this._haloPreviewOnly) {
      publishDashboardConfig(this._haloUiConfig);
    }
    queueMicrotask(() => {
      this._syncHaloModules();
      this._syncEditControl();
    });
  }

  disconnectedCallback() {
    window.removeEventListener("halo-ui-preview-context", this._onHaloPreviewContext);
    this._removeOwnerEditButton();
    this._backgroundManager.destroy();
    this._designManager.destroy();
    this._headerManager.destroy();
    this._previewBackgroundLayer = null;
    this._previewHeaderElement = null;
    super.disconnectedCallback();
  }

  _syncHaloModules() {
    const raw = this._haloUiConfig;
    const c = applyPerformanceTuning(raw);

    if (
      this._haloPreviewOnly ||
      !this.isConnected ||
      c.enabled === false ||
      this._inEditor?.()
    ) {
      this._backgroundManager.destroy();
      this._designManager.destroy();
      this._headerManager.destroy();
      return;
    }

    // Dashboard mode is owned by the persistent Halo dashboard runtime.
    // It follows the active Lovelace view and automatically includes views
    // that are created later.
    if (raw.target?.mode === "dashboard") {
      this._backgroundManager.destroy();
      this._designManager.destroy();
      this._headerManager.destroy();
      publishDashboardConfig(raw);
      return;
    }

    const target = this._view || findHaloView(this);
    if (!target) return;

    if (c.modules?.background === true) {
      this._backgroundManager.mount(target, c.background, c.design, this._haloHass);
    } else {
      this._backgroundManager.destroy();
    }

    if (c.modules?.surfaces === true) {
      this._designManager.mount(target, c.design);
    } else {
      this._designManager.destroy();
    }

    if (c.modules?.header === true) {
      this._headerManager.mount(
        target,
        c,
        this._haloHass,
        currentViewKey() || "Übersicht"
      );
    } else {
      this._headerManager.destroy();
    }
  }

  _previewConfig() {
    const key = this._haloPreviewViewKey;
    if (!key || key === "__dashboard__") return this._haloUiConfig;
    return resolveViewConfig(this._haloUiConfig, key);
  }

  _resolvedPreviewHeaderConfig(previewConfig) {
    const headerConfig = { ...(previewConfig?.header || {}) };

    if (headerConfig.show_weather && !String(headerConfig.weather_entity || "").trim()) {
      const candidates = [
        previewConfig?.background?.weather_entity,
        previewConfig?.sidebar?.weather?.entity
      ];
      let resolved = candidates.find(id => typeof id === "string" && id.trim());
      if (!resolved && this._haloHass?.states) {
        resolved = Object.keys(this._haloHass.states).find(id => id.startsWith("weather."));
      }
      if (resolved) headerConfig.weather_entity = resolved;
    }

    return headerConfig;
  }

  _previewHeader(title) {
    const header = document.createElement("div");
    header.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:0 2px 8px;
      color:var(--secondary-text-color,#9aa0a6);
      font:600 11px/1.2 sans-serif;
    `;
    const left = document.createElement("span");
    left.textContent = `Live-Vorschau · ${title}`;
    const right = document.createElement("span");
    right.textContent = `Halo UI v${HALO_UI_VERSION}`;
    header.append(left, right);
    return header;
  }

  _previewStage(title) {
    const stage = document.createElement("div");
    stage.className = "halo-ui-context-live-preview";
    stage.style.cssText = `
      min-height:560px;
      height:min(68vh,720px);
      width:100%;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      overflow:hidden;
      background:transparent;
    `;
    stage.appendChild(this._previewHeader(title));

    const viewport = document.createElement("div");
    viewport.className = "halo-ui-context-viewport";
    viewport.style.cssText = `
      position:relative;
      flex:1;
      min-height:0;
      overflow:hidden;
      border:1px solid var(--divider-color,#444);
      border-radius:14px;
      background:var(--lovelace-background,var(--primary-background-color,#111));
      box-sizing:border-box;
    `;
    stage.appendChild(viewport);
    return { stage, viewport };
  }

  _renderBackgroundPreview() {
    this.textContent = "";
    this._previewSidebar = null;
    this._previewBackgroundLayer = null;

    const { stage, viewport } = this._previewStage("Background");
    const layer = document.createElement("halo-background-layer");
    layer.style.cssText = "position:absolute;inset:0;display:block;";
    const previewConfig = this._previewConfig();
    layer.config = previewConfig.background || {};
    layer.design = previewConfig.design || {};
    if (this._haloHass) layer.hass = this._haloHass;
    viewport.appendChild(layer);

    const badge = document.createElement("div");
    badge.textContent = "Halo Background";
    badge.style.cssText = `
      position:absolute;
      left:18px;
      bottom:16px;
      z-index:2;
      padding:8px 11px;
      border-radius:10px;
      background:rgba(0,0,0,.26);
      border:1px solid rgba(255,255,255,.14);
      color:#fff;
      font:700 13px/1 sans-serif;
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      text-shadow:0 2px 14px rgba(0,0,0,.55);
    `;
    viewport.appendChild(badge);

    this.appendChild(stage);
    this._previewBackgroundLayer = layer;
    this.style.display = "block";
    this.style.height = "auto";
    this.style.minHeight = "0";
    this.style.overflow = "visible";
    this.style.margin = "0";
  }

  _renderDesignPreview(title = "Design") {
    this.textContent = "";
    this._previewSidebar = null;
    this._previewBackgroundLayer = null;

    const { stage, viewport } = this._previewStage(title);
    const layer = document.createElement("halo-background-layer");
    layer.style.cssText = "position:absolute;inset:0;display:block;";
    const previewConfig = this._previewConfig();
    layer.config = previewConfig.background || {};
    layer.design = previewConfig.design || {};
    if (this._haloHass) layer.hass = this._haloHass;
    viewport.appendChild(layer);

    const d = previewConfig.design || {};
    const modules = previewConfig.modules || {};
    const radius = Number(d.radius ?? 18);
    const blur = Number(d.surface_blur ?? d.blur ?? 18);
    const tint = d.surface_tint || "#14141a";
    const opacity = Number(d.surface_opacity ?? .34);
    const borderOpacity = Number(d.surface_border_opacity ?? .14);
    const shadow = Number(d.surface_shadow_strength ?? .28);
    const accent = d.accent || "#00b8e6";
    const surfaceStyle = String(d.surface_style || "glass");
    let previewOpacity = opacity;
    let previewBlur = blur;
    if (surfaceStyle === "clear") { previewOpacity *= .62; previewBlur = Math.min(60, blur + 8); }
    else if (surfaceStyle === "soft") { previewOpacity = Math.min(.82, opacity * 1.22); previewBlur = Math.max(8, blur - 2); }
    else if (surfaceStyle === "solid") { previewOpacity = Math.max(.82, opacity); previewBlur = 0; }
    const highlight = Number(d.surface_highlight_opacity ?? .08);
    const surfaceBase = `color-mix(in srgb, ${tint} ${Math.round(previewOpacity*100)}%, transparent)`;
    const surface = highlight > 0
      ? `linear-gradient(145deg, rgba(255,255,255,${highlight}) 0%, rgba(255,255,255,0) 42%), ${surfaceBase}`
      : surfaceBase;

    const shell = document.createElement("div");
    shell.style.cssText = `
      position:absolute;inset:0;z-index:2;display:grid;
      grid-template-columns:${modules.sidebar !== false ? "31% 1fr" : "1fr"};
      color:${d.text_color || "#fff"};
      font-family:system-ui,sans-serif;
    `;

    if (modules.sidebar !== false) {
      const side = document.createElement("div");
      side.style.cssText = `
        padding:18px 12px;display:grid;grid-template-rows:auto auto 1fr auto;gap:14px;
        background:${surface};
        border-right:1px solid rgba(255,255,255,${borderOpacity});
        backdrop-filter:${previewBlur > 0 ? `blur(${previewBlur}px) saturate(${Number(d.surface_saturation ?? 125)}%)` : "none"};
        -webkit-backdrop-filter:${previewBlur > 0 ? `blur(${previewBlur}px) saturate(${Number(d.surface_saturation ?? 125)}%)` : "none"};
      `;
      side.innerHTML = `
        <div style="font-size:30px;font-weight:250;text-align:center">14:32</div>
        <div style="font-size:10px;opacity:.68;text-align:center">Dienstag, 06. Oktober</div>
        <div style="display:grid;align-content:start;gap:8px;padding-top:10px">
          <div style="padding:10px;border-radius:${radius}px;background:rgba(255,255,255,.08)">☀️ &nbsp; 21.4 °C</div>
          <div style="padding:8px 6px;border-radius:10px;border-left:3px solid ${accent}">⌂ &nbsp; Startseite</div>
          <div style="padding:8px 6px">◉ &nbsp; MOVA</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
          <div style="padding:10px 4px;text-align:center;border-radius:${radius}px;background:rgba(255,255,255,.08)">👤<br><small>Sebastian</small></div>
          <div style="padding:10px 4px;text-align:center;border-radius:${radius}px;background:rgba(255,255,255,.08)">👤<br><small>Zoe</small></div>
        </div>
      `;
      shell.appendChild(side);
    }

    const content = document.createElement("div");
    content.style.cssText = "padding:18px;display:grid;grid-template-rows:auto 1fr;gap:14px;min-width:0;";
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:10px;opacity:.65;letter-spacing:.12em">HALO UI</div>
          <div style="font-size:22px;font-weight:700">Übersicht</div>
        </div>
        <div style="width:36px;height:4px;border-radius:999px;background:${accent}"></div>
      </div>
      <div class="halo-preview-cards" style="display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(90px,1fr);gap:12px"></div>
    `;

    const cards = content.querySelector(".halo-preview-cards");
    for (const [icon, label, value] of [
      ["💡","Licht","6 aktiv"],
      ["🌡️","Klima","21.6 °C"],
      ["🔋","Energie","2.4 kW"],
      ["🏠","Status","Alles okay"]
    ]) {
      const card = document.createElement("div");
      card.style.cssText = `
        padding:14px;border-radius:${radius}px;
        background:${surface};
        border:${Number(d.surface_border_width ?? 1)}px solid rgba(255,255,255,${borderOpacity});
        box-shadow:0 10px ${Number(d.surface_shadow_blur ?? 26)}px rgba(0,0,0,${shadow});
        backdrop-filter:${previewBlur > 0 ? `blur(${previewBlur}px) saturate(${Number(d.surface_saturation ?? 125)}%)` : "none"};
        -webkit-backdrop-filter:${previewBlur > 0 ? `blur(${previewBlur}px) saturate(${Number(d.surface_saturation ?? 125)}%)` : "none"};
        display:grid;align-content:space-between;min-width:0;
      `;
      card.innerHTML = `
        <div style="font-size:21px">${icon}</div>
        <div>
          <div style="font-size:11px;opacity:.68">${label}</div>
          <div style="font-size:17px;font-weight:700">${value}</div>
        </div>
      `;
      cards.appendChild(card);
    }

    shell.appendChild(content);
    viewport.appendChild(shell);
    this.appendChild(stage);
    this._previewBackgroundLayer = layer;

    this.style.display = "block";
    this.style.height = "auto";
    this.style.minHeight = "0";
    this.style.overflow = "visible";
    this.style.margin = "0";
  }

  _renderHeaderPreview() {
    this.textContent = "";
    this._previewSidebar = null;
    this._previewBackgroundLayer = null;
    this._previewHeaderElement = null;

    const { stage, viewport } = this._previewStage("Header");
    const previewConfig = this._previewConfig();

    const layer = document.createElement("halo-background-layer");
    layer.style.cssText = "position:absolute;inset:0;display:block;";
    layer.config = previewConfig.background || {};
    layer.design = previewConfig.design || {};
    if (this._haloHass) layer.hass = this._haloHass;
    viewport.appendChild(layer);

    const header = document.createElement("halo-header");
    header.style.cssText = `position:absolute;left:14px;right:14px;top:14px;height:${Math.max(44, Number(previewConfig.header?.height) || 64)}px;z-index:3;`;
    header.config = this._resolvedPreviewHeaderConfig(previewConfig);
    header.design = previewConfig.design || {};
    header.viewTitle =
      this._haloPreviewViewKey === "__dashboard__"
        ? "Übersicht"
        : this._haloPreviewViewKey;
    if (this._haloHass) header.hass = this._haloHass;
    viewport.appendChild(header);

    const content = document.createElement("div");
    content.style.cssText = `
      position:absolute;left:22px;right:22px;top:${Math.max(92, (Math.max(44, Number(previewConfig.header?.height) || 64) + 40))}px;bottom:20px;
      display:grid;grid-template-columns:1fr 1fr;gap:12px;
      align-content:start;z-index:2;
    `;

    for (const label of ["Licht","Klima","Energie","Status"]) {
      const card = document.createElement("div");
      card.textContent = label;
      card.style.cssText = `
        min-height:78px;padding:14px;
        border-radius:${Number(previewConfig.design?.radius ?? 18)}px;
        background:rgba(20,20,26,.30);
        border:1px solid rgba(255,255,255,.14);
        backdrop-filter:blur(${Number(previewConfig.design?.surface_blur ?? 18)}px);
        -webkit-backdrop-filter:blur(${Number(previewConfig.design?.surface_blur ?? 18)}px);
        color:#fff;font:700 13px/1.2 system-ui,sans-serif;
      `;
      content.appendChild(card);
    }

    viewport.appendChild(content);
    this.appendChild(stage);
    this._previewBackgroundLayer = layer;
    this._previewHeaderElement = header;
    this.style.display = "block";
    this.style.height = "auto";
    this.style.minHeight = "0";
    this.style.overflow = "visible";
    this.style.margin = "0";
  }

  _renderOverviewPreview() {
    this._renderDesignPreview(this._haloPreviewTab === "system" ? "System" : "Halo UI");
  }

  _renderPlaceholder(message = "") {
    // Unsupported-view/debug messages should retain the proven legacy handling.
    if (message || !this._inEditor?.()) {
      this._previewBackgroundLayer = null;
      super._renderPlaceholder(message);
      return;
    }

    const storedPreview = window.__haloUiPreviewContext;
    const tab = this._haloPreviewTab || (typeof storedPreview === "object" ? storedPreview.tab : storedPreview) || "modules";

    if (tab === "background") {
      this._renderBackgroundPreview();
      return;
    }

    if (tab === "design") {
      this._renderDesignPreview();
      return;
    }

    if (tab === "header") {
      this._renderHeaderPreview();
      return;
    }

    if (tab === "modules" || tab === "system") {
      this._renderOverviewPreview();
      return;
    }

    // Sidebar tab: use the mature real sidebar preview from v0.7.
    this._previewBackgroundLayer = null;
    super._renderPlaceholder();

    const stage = this.querySelector?.(".halo-editor-live-preview");
    const header = stage?.firstElementChild;
    const spans = header?.querySelectorAll?.("span");
    if (spans?.[0]) spans[0].textContent = "Live-Vorschau · Sidebar";
    if (spans?.[1]) spans[1].textContent = `Halo UI v${HALO_UI_VERSION}`;
  }
}

if (!customElements.get("halo-ui")) customElements.define("halo-ui", HaloUI);

window.customCards = window.customCards || [];
// Halo UI is the single public card entry. Older/internal Halo cards stay usable
// in existing YAML, but are removed from the Home Assistant card picker.
const HALO_INTERNAL_CARD_TYPES = new Set(["halo-sidebar", "halo-layout", "halo-view-sidebar"]);
for (let i = window.customCards.length - 1; i >= 0; i--) {
  if (HALO_INTERNAL_CARD_TYPES.has(window.customCards[i]?.type)) window.customCards.splice(i, 1);
}
if (!window.customCards.some(c => c.type === "halo-ui")) {
  window.customCards.push({
    type: "halo-ui",
    name: "Halo UI",
    description: "Modular UI layer for Home Assistant: Sidebar, Background and future Halo modules.",
    preview: false,
    documentationURL: "https://github.com/F250SC/halo-ui"
  });
}
