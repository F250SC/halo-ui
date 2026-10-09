import {
  HALO_UI_VERSION, HALO_UI_DEFAULTS, normalizeConfig, esc, asBool, setPathImmutable,
  emitConfigChanged, toLegacySidebarConfig, resolveViewConfig,
  setViewOverridePath, clearViewOverride, resolvePerformanceProfile
} from "./halo-core.js";
import "./halo-background.js";
import { localizeHaloDom, translateHaloText } from "./halo-i18n.js";

const HALO_LOOK_PRESETS = {
  "halo-glass": {
    name: "Halo Glass",
    description: "Ausgewogenes Halo-Glass mit Cyan-Akzent und weichen Flächen.",
    values: {
      preset:"glass", accent:"#00b8e6", text_color:"#ffffff",
      colors:["#210443","#8a2be2","#ff8ad4"], gradient_angle:135, animation_speed:30,
      radius:18, blur:18, surface_style:"glass", surface_tint:"#14141a", surface_opacity:.34,
      surface_border_color:"#ffffff", surface_border_opacity:.14, surface_border_width:1,
      surface_blur:18, surface_saturation:125, surface_shadow_strength:.28, surface_shadow_blur:26,
      surface_highlight_opacity:.08, section_style:"accent-line", card_gap:12, section_gap:18
    }
  },
  "clear-glass": {
    name: "Clear Glass",
    description: "Scharfes Klarglas ohne Blur – ideal für Foto- und Video-Hintergründe.",
    values: {
      preset:"glass", accent:"#00b8e6", text_color:"#ffffff",
      colors:["#132238","#006f87","#00b8e6"], gradient_angle:145, animation_speed:34,
      radius:18, blur:0, surface_style:"clear", surface_tint:"#000000", surface_opacity:.24,
      surface_border_color:"#ffffff", surface_border_opacity:.16, surface_border_width:1,
      surface_blur:0, surface_saturation:100, surface_shadow_strength:.24, surface_shadow_blur:22,
      surface_highlight_opacity:.10, section_style:"accent-line", card_gap:12, section_gap:18
    }
  },
  "dark-glass": {
    name: "Dark Glass",
    description: "Dunkler, kontrastreicher Glass-Look für helle Hintergründe.",
    values: {
      preset:"glass", accent:"#7dd3fc", text_color:"#ffffff",
      colors:["#05070b","#101827","#16243d"], gradient_angle:135, animation_speed:38,
      radius:20, blur:16, surface_style:"soft", surface_tint:"#05070b", surface_opacity:.56,
      surface_border_color:"#dbeafe", surface_border_opacity:.12, surface_border_width:1,
      surface_blur:12, surface_saturation:115, surface_shadow_strength:.42, surface_shadow_blur:30,
      surface_highlight_opacity:.07, section_style:"clean", card_gap:12, section_gap:20
    }
  },
  "neon": {
    name: "Neon",
    description: "Kräftiger Akzent, dunkle Flächen und sichtbarer Glow.",
    values: {
      preset:"gradient", accent:"#00f0ff", text_color:"#ffffff",
      colors:["#070018","#31006b","#a100ff"], gradient_angle:125, animation_speed:22,
      radius:20, blur:10, surface_style:"glass", surface_tint:"#070018", surface_opacity:.46,
      surface_border_color:"#00f0ff", surface_border_opacity:.28, surface_border_width:1,
      surface_blur:10, surface_saturation:150, surface_shadow_strength:.52, surface_shadow_blur:34,
      surface_highlight_opacity:.14, section_style:"accent-line", card_gap:13, section_gap:20,
      active_glow_strength:.34, active_border_opacity:.92
    }
  },
  "minimal": {
    name: "Minimal",
    description: "Ruhig, wenig Effekt, kleine Radien und reduzierte Schatten.",
    values: {
      preset:"minimal", accent:"#60a5fa", text_color:"#ffffff",
      colors:["#171717","#242424","#333333"], gradient_angle:135, animation_speed:60,
      radius:10, blur:0, surface_style:"clear", surface_tint:"#111111", surface_opacity:.30,
      surface_border_color:"#ffffff", surface_border_opacity:.08, surface_border_width:1,
      surface_blur:0, surface_saturation:100, surface_shadow_strength:.10, surface_shadow_blur:12,
      surface_highlight_opacity:.03, section_style:"minimal", card_gap:10, section_gap:16,
      active_glow_strength:.10, active_border_opacity:.65
    }
  },
  "tropical": {
    name: "Tropical",
    description: "Türkis, Violett und Pink – auf lebendige Foto-/Video-Hintergründe abgestimmt.",
    values: {
      preset:"glass", accent:"#00d4c7", text_color:"#ffffff",
      colors:["#042f3e","#5b21b6","#ff72c6"], gradient_angle:140, animation_speed:32,
      radius:20, blur:0, surface_style:"clear", surface_tint:"#00171a", surface_opacity:.28,
      surface_border_color:"#bffcf4", surface_border_opacity:.16, surface_border_width:1,
      surface_blur:0, surface_saturation:110, surface_shadow_strength:.30, surface_shadow_blur:24,
      surface_highlight_opacity:.11, section_style:"accent-line", card_gap:12, section_gap:18
    }
  }
};

function normalizeDesignerGradient(design = {}) {
  const legacy = Array.isArray(design.colors) && design.colors.length ? design.colors : ["#210443","#8a2be2","#ff8ad4"];
  const raw = design.gradient || {};
  const clamp=(v,min,max,f)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):f;};
  let stops=Array.isArray(raw.stops)?raw.stops.map((st,i)=>({color:String(st?.color||legacy[i%legacy.length]||"#000000"),position:clamp(st?.position,0,100,i*100/Math.max(1,raw.stops.length-1))})).filter(st=>/^#[0-9a-f]{6}$/i.test(st.color)):[];
  if(stops.length<2){const last=Math.max(1,legacy.length-1);stops=legacy.map((color,i)=>({color:String(color),position:i/last*100}));}
  stops.sort((a,b)=>a.position-b.position);
  return {type:["linear","radial","conic"].includes(raw.type)?raw.type:"linear",angle:clamp(raw.angle??design.gradient_angle,0,360,135),center_x:clamp(raw.center_x,0,100,50),center_y:clamp(raw.center_y,0,100,50),interpolation:raw.interpolation==="srgb"?"srgb":"oklab",stops};
}
function designerGradientCss(g){
  const interp=g.interpolation==="oklab"?" in oklab":"";const stops=g.stops.map(st=>`${st.color} ${Number(st.position).toFixed(1)}%`).join(",");
  if(g.type==="radial")return `radial-gradient(circle at ${g.center_x}% ${g.center_y}%${interp},${stops})`;
  if(g.type==="conic")return `conic-gradient(from ${g.angle}deg at ${g.center_x}% ${g.center_y}%${interp},${stops})`;
  return `linear-gradient(${g.angle}deg${interp},${stops})`;
}

export class HaloUIEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode:"open" });
    this._config = {};
    this._hass = null;
    const preview = window.__haloUiPreviewContext;
    const validTabs = new Set(["modules", "design", "background", "sidebar", "header", "system"]);
    this._tab =
      typeof preview === "object" && validTabs.has(preview?.tab)
        ? preview.tab
        : "modules";
    this._editingView =
      typeof preview === "object" && preview?.viewKey
        ? preview.viewKey
        : "__dashboard__";
  }

  connectedCallback() {
    this._onExternalPreviewContext = (event) => {
      const viewKey = event?.detail?.viewKey;
      const tab = event?.detail?.tab;

      if (
        this._rootConfig()?.target?.mode === "dashboard" &&
        viewKey &&
        viewKey !== "__dashboard__" &&
        viewKey !== this._editingView
      ) {
        this._editingView = viewKey;
        if (tab) this._tab = tab;
        this._render();
      }
    };

    window.addEventListener(
      "halo-ui-preview-context",
      this._onExternalPreviewContext
    );

    queueMicrotask(() => {
      const context = window.__haloUiPreviewContext;
      if (
        this._rootConfig()?.target?.mode === "dashboard" &&
        typeof context === "object" &&
        context?.viewKey
      ) {
        this._editingView = context.viewKey;
      }
      this._broadcastPreviewContext();
      this._render();
    });
  }

  disconnectedCallback() {
    if (this._onExternalPreviewContext) {
      window.removeEventListener(
        "halo-ui-preview-context",
        this._onExternalPreviewContext
      );
    }
    this._onExternalPreviewContext = null;
  }

  setConfig(config) {
    // Persisted config stays raw. Defaults/inheritance are resolved only
    // for rendering and runtime, never written back automatically.
    this._config = structuredClone(config || {});
    const root = this._rootConfig();

    const preview = window.__haloUiPreviewContext;
    if (root.target?.mode === "dashboard") {
      if (
        typeof preview === "object" &&
        preview?.viewKey &&
        preview.viewKey !== "__dashboard__"
      ) {
        this._editingView = preview.viewKey;
      } else {
        const parts = String(window.location.pathname || "/")
          .split("/")
          .filter(Boolean)
          .map(part => {
            try { return decodeURIComponent(part); }
            catch { return part; }
          });

        this._editingView =
          parts.length > 1
            ? parts.slice(1).join("/")
            : "__dashboard__";
      }
    }

    this._render();
  }
  set hass(hass) { const prevLang=this._hass?.locale?.language||this._hass?.language; this._hass = hass; this._syncPreviewHass(); this._syncSidebarEditorHass(); const nextLang=hass?.locale?.language||hass?.language; if(prevLang && nextLang && prevLang!==nextLang) this._render(); }

  _broadcastPreviewContext() {
    const context = { tab: this._tab, viewKey: this._editingView || "__dashboard__" };
    window.__haloUiPreviewContext = context;
    window.dispatchEvent(new CustomEvent("halo-ui-preview-context", { detail: context }));
  }

  _walkOpenRoots(root, callback) {
    if (!root) return;
    const all = root.querySelectorAll?.("*") || [];
    for (const el of all) {
      if (!(el instanceof Element)) continue;
      if (callback(el) === false) return false;
      if (el.shadowRoot && this._walkOpenRoots(el.shadowRoot, callback) === false) return false;
    }
  }

  _lovelaceConfig() {
    let node = this;
    for (let i = 0; i < 35 && node; i++) {
      const cfg = node?.lovelace?.config;
      if (cfg && Array.isArray(cfg.views)) return cfg;
      node = node.parentElement || node.getRootNode?.()?.host || null;
    }
    let found = null;
    this._walkOpenRoots(document, el => {
      const cfg = el?.lovelace?.config;
      if (cfg && Array.isArray(cfg.views)) { found = cfg; return false; }
    });
    return found;
  }

  _rootConfig() {
    return normalizeConfig(this._config || {});
  }

  _dashboardViews() {
    const out = [];
    const seen = new Set();
    const add = (path, title) => {
      const key = String(path || "").replace(/^\/+|\/+$/g, "");
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push({ path:key, title:title || key });
    };

    const cfg = this._lovelaceConfig();
    cfg?.views?.forEach((view, index) => add(view?.path, view?.title || view?.name || `Ansicht ${index+1}`));
    (window.__haloUiDashboardViews || []).forEach(view => add(view?.path, view?.title));
    Object.keys(this._config.view_overrides || {}).forEach(path => add(path, path));
    return out;
  }

  _isViewEditing() {
    return this._rootConfig().target?.mode === "dashboard" &&
      this._editingView &&
      this._editingView !== "__dashboard__";
  }

  _editingConfig() {
    return this._isViewEditing()
      ? resolveViewConfig(this._config, this._editingView)
      : this._rootConfig();
  }

  _hasViewOverride(viewKey = this._editingView) {
    return !!(viewKey && viewKey !== "__dashboard__" && this._config.view_overrides?.[viewKey] && Object.keys(this._config.view_overrides[viewKey]).length);
  }

  _scopeBar() {
    if (this._rootConfig().target?.mode !== "dashboard") return "";
    const views = this._dashboardViews();
    const selected = this._editingView || "__dashboard__";
    const hasOverride = this._hasViewOverride(selected);
    const title = views.find(v => v.path === selected)?.title || selected;
    return `
      <section class="scope-bar">
        <div><span class="scope-label">Bearbeiten</span><select data-edit-view>
          <option value="__dashboard__" ${selected==="__dashboard__"?"selected":""}>Dashboard-Standard</option>
          ${views.map(view=>`<option value="${esc(view.path)}" ${selected===view.path?"selected":""}>${esc(view.title)}${this._hasViewOverride(view.path)?" • angepasst":""}</option>`).join("")}
        </select></div>
        <div class="scope-info">${selected==="__dashboard__"?"<strong>Standard:</strong> gilt automatisch für alle Ansichten ohne eigene Anpassung – auch für neu angelegte.":`<strong>${esc(title)}:</strong> du bearbeitest nur die Abweichungen dieser Ansicht vom Dashboard-Standard.`}</div>
        ${selected!=="__dashboard__"?`<button type="button" class="reset-view" data-reset-view ${hasOverride?"":"disabled"}>Anpassungen zurücksetzen</button>`:""}
      </section>`;
  }

  _emit(config, rerender = true) {
    this._config = structuredClone(config || {});
    // Home Assistant may destroy and recreate the whole card editor after a
    // config-changed event. Persist the active Halo tab immediately before
    // emitting so a fresh editor instance resumes exactly where the user was.
    this._broadcastPreviewContext();
    emitConfigChanged(this, this._config);
    if (rerender) this._render();
    else { this._syncPreview(); this._syncSidebarEditor(); }
  }

  _readValue(el) {
    if (el.type === "number" || el.type === "range") return Number(el.value);
    if (el.dataset.kind === "boolean") return asBool(el.value);
    return el.value;
  }

  _set(path, value, rerender = true) {
    if (this._isViewEditing()) {
      this._emit(setViewOverridePath(this._config, this._editingView, path, value), rerender);
      return;
    }
    this._emit(setPathImmutable(this._config, path, value), rerender);
  }

  // Update Halo's local editor/preview state without notifying Home Assistant.
  // HA may recreate the complete card editor after every config-changed event,
  // so text/number/range/color inputs are staged while the user is editing and
  // committed only on the native `change` event (blur/release/confirmation).
  _stage(path, value) {
    const next = this._isViewEditing()
      ? setViewOverridePath(this._config, this._editingView, path, value)
      : setPathImmutable(this._config, path, value);
    this._config = structuredClone(next || {});
    this._syncPreview();
  }

  _moduleTab() {
    const effective = this._editingConfig();
    const root = this._rootConfig();
    const m = effective.modules || {};
    const moduleRow = (key, title, text, available=true) => `
      <div class="module-row ${available ? "" : "future"}">
        <div><strong>${title}</strong><span>${text}</span></div>
        ${available ? `<select data-path="modules.${key}" data-kind="boolean"><option value="true" ${m[key]!==false?"selected":""}>An</option><option value="false" ${m[key]===false?"selected":""}>Aus</option></select>` : `<span class="soon">geplant</span>`}
      </div>`;
    return `
      <section class="panel hero">
        <div><div class="eyebrow">HALO UI ${HALO_UI_VERSION}</div><h2>Ein Paket. Module nach Bedarf.</h2>
        <p>Halo gestaltet Home Assistant. Deine normalen HA-Karten und Kacheln bleiben davon unabhängig.</p></div>
      </section>

      <section class="panel">
        <h3>${this._isViewEditing() ? "Diese Ansicht" : "Halo UI aktivieren"}</h3>
        <div class="grid">
          <label>${this._isViewEditing() ? "Halo UI in dieser Ansicht" : "Halo UI"}
            <select data-path="enabled" data-kind="boolean">
              <option value="true" ${effective.enabled!==false?"selected":""}>An</option>
              <option value="false" ${effective.enabled===false?"selected":""}>Aus</option>
            </select>
          </label>
          ${!this._isViewEditing()?`<label>Geltungsbereich<select data-global-path="target.mode"><option value="current_view" ${String(root.target?.mode||"current_view")==="current_view"?"selected":""}>Nur diese Ansicht</option><option value="dashboard" ${root.target?.mode==="dashboard"?"selected":""}>Gesamtes Dashboard</option></select></label>`:`<label>Vererbung<input value="Dashboard-Standard + diese Abweichungen" disabled></label>`}
        </div>
        <div class="scope-explain ${root.target?.mode==="dashboard" ? "dashboard" : ""}">
          ${this._isViewEditing()?"<strong>Ansichts-Override:</strong> Nur Werte, die du hier änderst, werden für diese Ansicht gespeichert. Alles andere bleibt vom Dashboard-Standard geerbt.":root.target?.mode==="dashboard"?"<strong>Gesamtes Dashboard:</strong> Alle vorhandenen und später neu angelegten Ansichten übernehmen automatisch den Dashboard-Standard. Einzelne Ansichten kannst du oben bei „Bearbeiten“ überschreiben.":"<strong>Nur diese Ansicht:</strong> Halo wirkt ausschließlich auf die Ansicht, in der diese Halo-UI-Konfiguration liegt."}
        </div>
      </section>

      <section class="panel">
        <h3>Module</h3>
        ${moduleRow("sidebar","Halo Sidebar","Navigation, Uhr, Wetter, Presence und Widgets.")}
        ${moduleRow("background","Halo Background","View-Hintergrund mit Gradient, Bild oder Wettervideo.")}
        ${moduleRow("surfaces","Halo Glass Surfaces","Gestaltet deine normalen HA-Karten als Halo-Glass-Flächen.")}
        ${moduleRow("header","Halo Header","Topbar mit Titel, Uhr, Wetter und Navigation.")}
        ${moduleRow("cards","Halo Cards","Eigene optionale Kartenfamilie.",false)}
      </section>`;
  }

  _applyLookPreset(id) {
    const preset = HALO_LOOK_PRESETS[id];
    if (!preset) return;
    let next = structuredClone(this._config || {});
    const values = structuredClone(preset.values || {});
    if (Array.isArray(values.colors) && values.colors.length) {
      const last=Math.max(1,values.colors.length-1);
      values.gradient={type:"linear",angle:Number(values.gradient_angle??135),center_x:50,center_y:50,interpolation:"oklab",stops:values.colors.map((color,i)=>({color,position:i/last*100}))};
    }
    const entries = Object.entries(values);
    if (this._isViewEditing()) {
      for (const [key,value] of entries) {
        next = setViewOverridePath(next, this._editingView, `design.${key}`, structuredClone(value));
      }
      next = setViewOverridePath(next, this._editingView, "design.look_preset", id);
    } else {
      for (const [key,value] of entries) {
        next = setPathImmutable(next, `design.${key}`, structuredClone(value));
      }
      next = setPathImmutable(next, "design.look_preset", id);
    }
    this._emit(next, true);
  }

  _gradientDesigner(d) {
    const g=normalizeDesignerGradient(d);
    const bg=designerGradientCss(g);
    const angleRad=(g.angle-90)*Math.PI/180;
    const handX=50+Math.cos(angleRad)*34, handY=50+Math.sin(angleRad)*34;
    return `<section class="panel gradient-designer">
      <div class="list-head"><div><h3>Gradient Designer</h3><div class="field-note">Beliebig viele Farb-Stops, frei positionierbar. Animation nutzt exakt diesen Gradient – ohne harten Loop-Sprung.</div></div><button type="button" class="add-btn" data-gradient-add>+ Farbe</button></div>
      <div class="gradient-preview" style="background:${bg}"></div>
      <div class="gradient-track" style="background:${bg}" data-gradient-track>
        ${g.stops.map((st,i)=>`<button type="button" class="gradient-stop" data-gradient-stop="${i}" style="left:${st.position}%;--stop-color:${st.color}" title="${Math.round(st.position)}%"></button>`).join("")}
      </div>
      <div class="gradient-actions"><button type="button" class="add-btn" data-gradient-even>Gleichmäßig verteilen</button><button type="button" class="add-btn" data-gradient-reverse>Umkehren</button></div>
      <div class="grid gradient-main-grid">
        <label>Typ<select data-gradient-field="type"><option value="linear" ${g.type==="linear"?"selected":""}>Linear</option><option value="radial" ${g.type==="radial"?"selected":""}>Radial</option><option value="conic" ${g.type==="conic"?"selected":""}>Conic / Kreis</option></select></label>
        <label>Farbmischung<select data-gradient-field="interpolation"><option value="oklab" ${g.interpolation==="oklab"?"selected":""}>Smooth / OKLab</option><option value="srgb" ${g.interpolation==="srgb"?"selected":""}>Standard / sRGB</option></select></label>
      </div>
      <div class="gradient-geometry">
        <div class="angle-wrap ${g.type==="radial"?"muted":""}"><span class="field-note">Richtung / Startwinkel</span><div class="angle-dial" data-angle-dial style="--halo-angle:${g.angle}"><div class="dial-ring"></div><div class="dial-hand"></div><div class="dial-center"></div><span class="dial-value">${Math.round(g.angle)}°</span></div><input type="range" min="0" max="360" step="1" value="${g.angle}" data-gradient-angle></div>
        <div class="center-controls ${g.type==="linear"?"muted":""}"><label>Mittelpunkt X <input type="range" min="0" max="100" step="1" value="${g.center_x}" data-gradient-center="x"><span>${Math.round(g.center_x)}%</span></label><label>Mittelpunkt Y <input type="range" min="0" max="100" step="1" value="${g.center_y}" data-gradient-center="y"><span>${Math.round(g.center_y)}%</span></label></div>
      </div>
      <div class="gradient-stop-list">${g.stops.map((st,i)=>`<div class="gradient-stop-row" data-gradient-row="${i}"><input type="color" value="${esc(st.color)}" data-gradient-color="${i}"><label>Position <input type="range" min="0" max="100" step="1" value="${st.position}" data-gradient-position="${i}"><span data-gradient-position-label="${i}">${Math.round(st.position)}%</span></label><button type="button" class="danger" data-gradient-delete="${i}" ${g.stops.length<=2?"disabled":""}>×</button></div>`).join("")}</div>
      <div class="hint"><strong>Animation:</strong> Linear wandert weich entlang der gewählten Richtung, Radial kreist sichtbar um den Mittelpunkt und pulsiert, Conic rotiert nahtlos. Die Animationsdauer oben gilt für alle drei Typen.</div>
    </section>`;
  }

  _gradientNextConfig(gradient) {
    const g = structuredClone(gradient);
    const colors = g.stops.map(st=>st.color);
    if (this._isViewEditing()) {
      let next=setViewOverridePath(this._config,this._editingView,"design.gradient",g);
      next=setViewOverridePath(next,this._editingView,"design.colors",colors);
      next=setViewOverridePath(next,this._editingView,"design.gradient_angle",g.angle);
      next=setViewOverridePath(next,this._editingView,"sidebar.appearance.background",colors);
      next=setViewOverridePath(next,this._editingView,"sidebar.appearance.gradient",g);
      return next;
    }
    let next=setPathImmutable(this._config,"design.gradient",g);
    next=setPathImmutable(next,"design.colors",colors);
    next=setPathImmutable(next,"design.gradient_angle",g.angle);
    next=setPathImmutable(next,"sidebar.appearance.background",colors);
    next=setPathImmutable(next,"sidebar.appearance.gradient",g);
    return next;
  }

  _stageGradient(gradient) {
    this._config=structuredClone(this._gradientNextConfig(gradient));
    this._syncPreview();
  }

  _commitGradient(gradient, rerender=false) {
    this._emit(this._gradientNextConfig(gradient), rerender);
  }

  _designTab() {
    const effective = this._editingConfig();
    const d = effective.design || {};
    const colors = d.colors || ["#210443","#8a2be2","#ff8ad4"];
    const currentLook = String(d.look_preset || "custom");
    return `
    <section class="panel preset-panel">
      <h3>Halo Look Presets</h3>
      <div class="preset-picker">
        <label>Komplett-Look
          <select data-look-preset>
            <option value="custom" ${currentLook==="custom"?"selected":""}>Individuell / aktueller Stand</option>
            ${Object.entries(HALO_LOOK_PRESETS).map(([id,p])=>`<option value="${id}" ${currentLook===id?"selected":""}>${p.name}</option>`).join("")}
          </select>
        </label>
        <button class="apply-preset" type="button" data-apply-look>Preset anwenden</button>
      </div>
      <div class="preset-grid">
        ${Object.entries(HALO_LOOK_PRESETS).map(([id,p])=>`<button type="button" class="preset-card ${currentLook===id?"active":""}" data-quick-look="${id}"><span class="preset-swatch swatch-${id}"></span><strong>${p.name}</strong><small>${p.description}</small></button>`).join("")}
      </div>
      <div class="hint">Ein Komplett-Look ändert nur die globale Halo-Designsprache: Farben, Glass-Flächen, Radius, Schatten und Layout-Abstände. Hintergrundquelle, Wettervideos, Sidebar-Inhalte, Header-Inhalte und deine Karten bleiben unangetastet. Danach kannst du jeden Wert weiter individuell verändern.</div>
    </section>

    <section class="panel">
      <h3>Globale Halo Designsprache</h3>
      <div class="grid">
        <label>Preset<select data-path="design.preset">${["gradient","glass","minimal"].map(v=>`<option value="${v}" ${d.preset===v?"selected":""}>${v}</option>`).join("")}</select></label>
        <label>Akzent<input type="color" data-path="design.accent" value="${esc(d.accent||"#00b8e6")}"></label>
        <label>Text<input type="color" data-path="design.text_color" value="${esc(d.text_color||"#ffffff")}"></label>
        <label>HA-Akzent übernehmen<select data-path="design.apply_accent_to_ha" data-kind="boolean"><option value="true" ${d.apply_accent_to_ha!==false?"selected":""}>Ja</option><option value="false" ${d.apply_accent_to_ha===false?"selected":""}>Nein</option></select></label>
        <label>Radius<input type="number" min="0" max="60" data-path="design.radius" value="${Number(d.radius??18)}"></label>
        <label>Grund-Blur<input type="number" min="0" max="60" data-path="design.blur" value="${Number(d.blur??18)}"></label>
        <label>Animation s<input type="number" min="5" max="120" data-path="design.animation_speed" value="${Number(d.animation_speed??30)}"></label>
      </div>
      <div class="hint">Diese Werte sind die gemeinsamen Tokens für Background, Sidebar, Glass Surfaces und später Header/Cards.</div>
    </section>

    ${this._gradientDesigner(d)}

    <section class="panel">
      <h3>Glass Surface System</h3>
      <div class="grid">
        <label>Surface-Stil<select data-path="design.surface_style">
          <option value="glass" ${(d.surface_style||"glass")==="glass"?"selected":""}>Glass</option>
          <option value="clear" ${d.surface_style==="clear"?"selected":""}>Klarglas (ohne Blur)</option>
          <option value="soft" ${d.surface_style==="soft"?"selected":""}>Soft Glass</option>
          <option value="solid" ${d.surface_style==="solid"?"selected":""}>Solid</option>
        </select></label>
        <label>Glanzkante<input type="range" min="0" max="0.24" step="0.01" data-path="design.surface_highlight_opacity" value="${Number(d.surface_highlight_opacity??.08)}"></label>
        <label>Flächenfarbe<input type="color" data-path="design.surface_tint" value="${esc(d.surface_tint||"#14141a")}"></label>
        <label>Flächen-Deckkraft<input type="range" min="0" max="1" step="0.02" data-path="design.surface_opacity" value="${Number(d.surface_opacity??.34)}"></label>
        <label>Glass Blur<input type="range" min="0" max="60" step="1" data-path="design.surface_blur" value="${Number(d.surface_blur??d.blur??18)}"></label>
        <label>Sättigung<input type="range" min="80" max="200" step="5" data-path="design.surface_saturation" value="${Number(d.surface_saturation??125)}"></label>
        <label>Rahmenfarbe<input type="color" data-path="design.surface_border_color" value="${esc(d.surface_border_color||"#ffffff")}"></label>
        <label>Rahmen-Deckkraft<input type="range" min="0" max="0.6" step="0.02" data-path="design.surface_border_opacity" value="${Number(d.surface_border_opacity??.14)}"></label>
        <label>Rahmenbreite<input type="number" min="0" max="6" step="1" data-path="design.surface_border_width" value="${Number(d.surface_border_width??1)}"></label>
        <label>Schattenstärke<input type="range" min="0" max="0.8" step="0.02" data-path="design.surface_shadow_strength" value="${Number(d.surface_shadow_strength??.28)}"></label>
        <label>Schatten-Blur<input type="range" min="0" max="80" step="1" data-path="design.surface_shadow_blur" value="${Number(d.surface_shadow_blur??26)}"></label>
      </div>
      <div class="hint">
        Wenn <strong>Halo Glass Surfaces</strong> unter Module aktiv ist, werden normale <code>ha-card</code>-Flächen der aktuellen View automatisch mit diesen Werten gestaltet. <strong>Klarglas</strong> bleibt transparent und scharf ohne Backdrop-Blur, <strong>Soft Glass</strong> ist etwas ruhiger und <strong>Solid</strong> nahezu deckend. Deine Kartenkonfiguration selbst bleibt unverändert.
      </div>
    </section>

    <section class="panel">
      <h3>Card Compatibility</h3>
      <div class="grid">
        <label>Kompatibilitäts-Layer<select data-path="design.card_compatibility" data-kind="boolean"><option value="true" ${d.card_compatibility!==false?"selected":""}>An</option><option value="false" ${d.card_compatibility===false?"selected":""}>Aus</option></select></label>
        <label>Stärke<select data-path="design.card_compatibility_level">
          <option value="safe" ${String(d.card_compatibility_level||"balanced")==="safe"?"selected":""}>Schonend</option>
          <option value="balanced" ${String(d.card_compatibility_level||"balanced")==="balanced"?"selected":""}>Ausgewogen</option>
          <option value="strong" ${String(d.card_compatibility_level||"balanced")==="strong"?"selected":""}>Stärker</option>
        </select></label>
        <label>Controls mit State-/Akzentfarbe<select data-path="design.card_inner_accent" data-kind="boolean"><option value="true" ${d.card_inner_accent!==false?"selected":""}>Ja</option><option value="false" ${d.card_inner_accent===false?"selected":""}>Nein</option></select></label>
        <label>Control-Tönung<input type="range" min="0" max="0.6" step="0.02" data-path="design.card_control_tint" value="${Number(d.card_control_tint??.22)}"></label>
        <label>Komplexe Custom Cards<select data-path="design.card_complex_frame_only" data-kind="boolean"><option value="true" ${d.card_complex_frame_only!==false?"selected":""}>Nur Außenrahmen</option><option value="false" ${d.card_complex_frame_only===false?"selected":""}>Normal behandeln</option></select></label>
      </div>
      <div class="hint">
        Halo passt unterstützte Karten über CSS-Variablen an, ohne deren interne DOM-Struktur umzubauen. <strong>Ausgewogen</strong> ist für native HA-Karten, Mushroom und Slider empfohlen. App-artige Karten wie deine MOVA-Map bleiben standardmäßig innen unangetastet und bekommen nur den Halo-Rahmen.
      </div>
    </section>

    <section class="panel">
      <h3>Dashboard Layout</h3>
      <div class="grid">
        <label>Section-Titel
          <select data-path="design.section_style">
            <option value="accent-line" ${(d.section_style||"accent-line")==="accent-line"?"selected":""}>Accent Line</option>
            <option value="glass" ${d.section_style==="glass"?"selected":""}>Glass</option>
            <option value="clean" ${d.section_style==="clean"?"selected":""}>Clean</option>
            <option value="minimal" ${d.section_style==="minimal"?"selected":""}>Minimal</option>
          </select>
        </label>
        <label>Kartenabstand (px)<input type="number" min="0" max="48" step="1" data-path="design.card_gap" value="${Number(d.card_gap??12)}"></label>
        <label>Section-Abstand (px)<input type="number" min="0" max="64" step="1" data-path="design.section_gap" value="${Number(d.section_gap??18)}"></label>
        <label>Titelgröße (px)<input type="number" min="11" max="28" step="1" data-path="design.section_heading_size" value="${Number(d.section_heading_size??15)}"></label>
        <label>Titelgewicht
          <select data-path="design.section_heading_weight">
            ${[[400,"Normal"],[500,"Medium"],[600,"Semi Bold"],[700,"Bold"]].map(([v,n])=>`<option value="${v}" ${Number(d.section_heading_weight??600)===v?"selected":""}>${n}</option>`).join("")}
          </select>
        </label>
        <label>Titel-Deckkraft<input type="range" min="0.3" max="1" step="0.02" data-path="design.section_heading_opacity" value="${Number(d.section_heading_opacity??.92)}"></label>
      </div>
      <div class="hint">
        Halo lässt die natürliche Höhe jeder Karte bewusst erhalten. Große Karten wie eine Staubsauger-Map dürfen groß bleiben; kleine Sensoren bleiben kompakt. Dieses System vereinheitlicht nur Section-Titel und Abstände und greift nicht in Home Assistants Drag-&-Drop- oder Edit-Funktionen ein.
      </div>
    </section>

    <section class="panel">
      <h3>Active States</h3>
      <div class="grid">
        <label>Eigene State-Farben<select data-path="design.state_colors_enabled" data-kind="boolean"><option value="true" ${d.state_colors_enabled!==false?"selected":""}>An</option><option value="false" ${d.state_colors_enabled===false?"selected":""}>Aus – Halo-Akzent verwenden</option></select></label>
        <label>Licht an 💡<input type="color" data-path="design.state_light" value="${esc(d.state_light||"#ffd400")}"></label>
        <label>Switch / Fan an<input type="color" data-path="design.state_switch" value="${esc(d.state_switch||"#22c55e")}"></label>
        <label>Media aktiv<input type="color" data-path="design.state_media_player" value="${esc(d.state_media_player||d.accent||"#00b8e6")}"></label>
        <label>Heizen 🔥<input type="color" data-path="design.state_climate_heating" value="${esc(d.state_climate_heating||"#ff7a00")}"></label>
        <label>Kühlen ❄️<input type="color" data-path="design.state_climate_cooling" value="${esc(d.state_climate_cooling||"#4fc3f7")}"></label>
        <label>Staubsauger aktiv<input type="color" data-path="design.state_vacuum" value="${esc(d.state_vacuum||d.accent||"#00c8ff")}"></label>
        <label>Warnung / Problem<input type="color" data-path="design.state_warning" value="${esc(d.state_warning||"#ff3b30")}"></label>
        <label>Flächen-Tönung<input type="range" min="0" max="0.5" step="0.01" data-path="design.active_surface_tint" value="${Number(d.active_surface_tint??.08)}"></label>
        <label>Glow-Stärke<input type="range" min="0" max="0.8" step="0.02" data-path="design.active_glow_strength" value="${Number(d.active_glow_strength??.20)}"></label>
        <label>Rand-Deckkraft<input type="range" min="0" max="1" step="0.02" data-path="design.active_border_opacity" value="${Number(d.active_border_opacity??.78)}"></label>
        <label>Randbreite<input type="number" min="0" max="6" step="1" data-path="design.active_border_width" value="${Number(d.active_border_width??1)}"></label>
      </div>
      <div class="hint">
        State-Farben sind unabhängig von der globalen Halo-Akzentfarbe. Damit kann Halo z. B. blau bleiben, während ein eingeschaltetes Licht gelb, Heizen orange und Kühlen hellblau dargestellt wird. Nicht separat definierte aktive Zustände verwenden weiterhin die Halo-Akzentfarbe.
      </div>
    </section>`;
  }

  _backgroundTab() {
    const effective = this._editingConfig();
    const b = effective.background || {};
    const v = b.weather_videos || {};
    const mv = b.mobile_weather_videos || {};
    const states = [["sunny","☀️ Sonnig"],["clear-night","🌙 Klare Nacht"],["partlycloudy","⛅ Teilweise bewölkt"],["cloudy","☁️ Bewölkt"],["rainy","🌧️ Regen"],["pouring","🌧️ Starkregen"],["lightning","⚡ Gewitter"],["lightning-rainy","⛈️ Gewitter + Regen"],["snowy","❄️ Schnee"],["fog","🌫️ Nebel"],["windy","💨 Windig"]];
    return `<section class="panel"><h3>Halo Background</h3>
      <div class="grid">
        <label>Hintergrundfläche
          <select data-path="background.scope">
            <option value="view" ${String(b.scope||"view")==="view"?"selected":""}>Nur Dashboard-View</option>
            <option value="screen" ${b.scope==="screen"?"selected":""}>Gesamter Bildschirm</option>
          </select>
        </label>
        <label>Typ<select data-path="background.type">${["animated-gradient","gradient","image","video","weather-video"].map(x=>`<option value="${x}" ${b.type===x?"selected":""}>${x}</option>`).join("")}</select></label>
        <label>Performance<select data-path="background.performance_profile">${["auto","high","balanced","eco"].map(x=>`<option value="${x}" ${b.performance_profile===x?"selected":""}>${x}</option>`).join("")}</select></label>
        <label>Bewegungen<select data-path="background.seamless_motion" data-kind="boolean"><option value="true" ${b.seamless_motion!==false?"selected":""}>Nahtlos</option><option value="false" ${b.seamless_motion===false?"selected":""}>Standard</option></select></label>
        <label>Video-Loop<select data-path="background.video_loop_mode"><option value="crossfade" ${b.video_loop_mode!=="native"?"selected":""}>Crossfade (nahtlos)</option><option value="native" ${b.video_loop_mode==="native"?"selected":""}>Native Loop</option></select></label>
        <label>Crossfade Sekunden<input type="number" min="0.15" max="2" step="0.05" data-path="background.video_crossfade" value="${Number(b.video_crossfade??.65)}"></label>
        <label class="full">Wetter-Entity<div class="ha-selector-host" data-selector-kind="entity" data-selector-domain="weather" data-selector-path="background.weather_entity" data-selector-value="${esc(b.weather_entity||"")}"></div></label>
        <label>Wetterzustand<select data-path="background.weather_condition">${[["auto","Automatisch"],...states.map(([a,b])=>[a,b])].map(([x,n])=>`<option value="${x}" ${String(b.weather_condition||"auto")===x?"selected":""}>${n}</option>`).join("")}</select></label>
        <label>Füllung<select data-path="background.fit">${["cover","contain","fill"].map(x=>`<option value="${x}" ${b.fit===x?"selected":""}>${x}</option>`).join("")}</select></label>
        <label>Handy-Breite bis<input type="number" min="320" step="10" data-path="background.mobile_breakpoint" value="${Number(b.mobile_breakpoint||850)}"></label>
        <label>Video-Deckkraft<input type="range" min="0" max="1" step="0.05" data-path="background.video_opacity" value="${Number(b.video_opacity??1)}"></label>
        <label>Dunkles Overlay<input type="range" min="0" max="0.8" step="0.05" data-path="background.overlay" value="${Number(b.overlay??.15)}"></label>
        <label class="full">Bild<input data-path="background.image" value="${esc(b.image||"")}" placeholder="/local/... oder https://..."></label>
        <label class="full">Einzelnes Video (Desktop/Standard)<input data-path="background.video" value="${esc(b.video||"")}" placeholder="/local/...mp4"></label>
        <label class="full">Einzelnes Video (Handy 9:16, optional)<input data-path="background.mobile_video" value="${esc(b.mobile_video||"")}" placeholder="/local/halo-ui/halo_weather_mobile/mobile.mp4"></label>
        <label class="full">Fallback-Wettervideo (Desktop/Standard)<input data-path="background.weather_video_default" value="${esc(b.weather_video_default||"")}" placeholder="/local/halo-ui/halo_weather/cloudy.mp4"></label>
        <label class="full">Fallback-Wettervideo (Handy 9:16, optional)<input data-path="background.mobile_weather_video_default" value="${esc(b.mobile_weather_video_default||"")}" placeholder="/local/halo-ui/halo_weather_mobile/cloudy.mp4"></label>
      </div>
      <div class="hint">
        Der <strong>Geltungsbereich von Halo UI</strong> wird jetzt zentral im Tab „Module“ festgelegt.
        <strong>Hintergrundfläche</strong> bestimmt hier nur noch, ob der Background auf die Dashboard-View begrenzt bleibt oder den kompletten Bildschirm füllt.
        <strong>Handy-Videos:</strong> Die Füllung bleibt auch mobil auf <code>cover</code>. Statt das Querformat-Video extrem zu vergrößern, kann Halo auf schmalen Displays automatisch ein eigenes 9:16/Portrait-Video verwenden. Bleibt das Handy-Feld leer, wird das normale Video benutzt.<br>
        <strong>Nahtlos:</strong> Gradients laufen zyklisch ohne sichtbaren Neustart; Videos können am Loop-Punkt überblenden.
      </div>
      <h4>Wettervideos Desktop / Standard</h4>
      <div class="weather-grid">${states.map(([key,label])=>`<label><span>${label}</span><input data-weather-video="${key}" value="${esc(v[key]||"")}" placeholder="/local/halo-ui/halo_weather/${key}.mp4"></label>`).join("")}</div>
      <h4>Wettervideos Handy 9:16 (optional)</h4>
      <div class="weather-grid">${states.map(([key,label])=>`<label><span>${label}</span><input data-mobile-weather-video="${key}" value="${esc(mv[key]||"")}" placeholder="/local/halo-ui/halo_weather_mobile/${key}.mp4"></label>`).join("")}</div>
    </section>`;
  }

  _sidebarTab() {
    return `<section class="panel embedded"><h3>Halo Sidebar</h3><div class="hint">Der bewährte Sidebar-Editor aus v0.7 bleibt vollständig erhalten.</div><halo-view-sidebar-editor></halo-view-sidebar-editor></section>`;
  }

  _headerTab() {
    const effective = this._editingConfig();
    const h = effective.header || {};
    const nav = h.navigation || {};
    const items = nav.items || [];

    return `
      <section class="panel">
        <h3>Halo Header</h3>
        <div class="grid">
          <label>Preset
            <select data-path="header.preset">
              ${["glass","floating","minimal","transparent"].map(v=>`<option value="${v}" ${String(h.preset||"glass")===v?"selected":""}>${v}</option>`).join("")}
            </select>
          </label>
          <label>Höhe (px)<input type="number" min="44" max="140" data-path="header.height" value="${Number(h.height??64)}"></label>
          <label>Außenabstand (px)<input type="number" min="0" max="40" data-path="header.margin" value="${Number(h.margin??12)}"></label>
          <label>Innenabstand (px)<input type="number" min="0" max="40" data-path="header.padding" value="${Number(h.padding??12)}"></label>
          <label>Titel-Ausrichtung
            <select data-path="header.align">
              <option value="left" ${h.align!=="center"&&h.align!=="right"?"selected":""}>Links</option>
              <option value="center" ${h.align==="center"?"selected":""}>Mitte</option>
              <option value="right" ${h.align==="right"?"selected":""}>Rechts</option>
            </select>
          </label>
          <label>Titel anzeigen<select data-path="header.show_title" data-kind="boolean"><option value="true" ${h.show_title!==false?"selected":""}>Ja</option><option value="false" ${h.show_title===false?"selected":""}>Nein</option></select></label>
          <label>Titelquelle<select data-path="header.title_mode"><option value="view" ${h.title_mode!=="custom"?"selected":""}>Ansichtstitel</option><option value="custom" ${h.title_mode==="custom"?"selected":""}>Eigener Titel</option></select></label>
          <label>Eigener Titel<input data-path="header.custom_title" value="${esc(h.custom_title||"")}" placeholder="Hallo {user}"></label>
          <label>Titel-Icon<select data-path="header.show_title_icon" data-kind="boolean"><option value="true" ${h.show_title_icon!==false?"selected":""}>An</option><option value="false" ${h.show_title_icon===false?"selected":""}>Aus</option></select></label>
          <label>Icon<div class="ha-selector-host" data-selector-kind="icon" data-selector-path="header.title_icon" data-selector-value="${esc(h.title_icon||"mdi:home-assistant")}"></div></label>
          <label>Untertitel<select data-path="header.show_subtitle" data-kind="boolean"><option value="true" ${h.show_subtitle===true?"selected":""}>An</option><option value="false" ${h.show_subtitle!==true?"selected":""}>Aus</option></select></label>
          <label>Untertitel-Text<input data-path="header.subtitle" value="${esc(h.subtitle||"Halo UI")}" placeholder="Zuhause"></label>
        </div>
        <div class="hint">Für eine persönliche Begrüßung kannst du im eigenen Titel <code>{user}</code> verwenden, z. B. <code>Hallo {user}</code>.</div>
      </section>

      <section class="panel">
        <h3>Informationen & Aktionen</h3>
        <div class="grid">
          <label>Zurück-Button<select data-path="header.show_back_button" data-kind="boolean"><option value="true" ${h.show_back_button===true?"selected":""}>An</option><option value="false" ${h.show_back_button!==true?"selected":""}>Aus</option></select></label>
          <label>Home-Button<select data-path="header.show_home_button" data-kind="boolean"><option value="true" ${h.show_home_button===true?"selected":""}>An</option><option value="false" ${h.show_home_button!==true?"selected":""}>Aus</option></select></label>
          <label class="full">Home-Pfad<input data-path="header.home_path" value="${esc(h.home_path||"")}" placeholder="/dashboard-x/home"></label>
          <label>Uhr anzeigen<select data-path="header.show_clock" data-kind="boolean"><option value="true" ${h.show_clock===true?"selected":""}>An</option><option value="false" ${h.show_clock!==true?"selected":""}>Aus</option></select></label>
          <label>24 Stunden<select data-path="header.clock_24h" data-kind="boolean"><option value="true" ${h.clock_24h!==false?"selected":""}>Ja</option><option value="false" ${h.clock_24h===false?"selected":""}>Nein</option></select></label>
          <label>Datum anzeigen<select data-path="header.show_date" data-kind="boolean"><option value="true" ${h.show_date!==false?"selected":""}>An</option><option value="false" ${h.show_date===false?"selected":""}>Aus</option></select></label>
          <label>Info-Darstellung<select data-path="header.info_style"><option value="chips" ${h.info_style!=="plain"?"selected":""}>Chips</option><option value="plain" ${h.info_style==="plain"?"selected":""}>Schlicht</option></select></label>
          <label>Wetter anzeigen<select data-path="header.show_weather" data-kind="boolean"><option value="true" ${h.show_weather===true?"selected":""}>An</option><option value="false" ${h.show_weather!==true?"selected":""}>Aus</option></select></label>
          <label>Temperatur<select data-path="header.show_temperature" data-kind="boolean"><option value="true" ${h.show_temperature!==false?"selected":""}>An</option><option value="false" ${h.show_temperature===false?"selected":""}>Aus</option></select></label>
          <label>Bedingung<select data-path="header.show_condition" data-kind="boolean"><option value="true" ${h.show_condition===true?"selected":""}>An</option><option value="false" ${h.show_condition!==true?"selected":""}>Aus</option></select></label>
          <label class="full">Wetter-Entity<div class="ha-selector-host" data-selector-kind="entity" data-selector-domain="weather" data-selector-path="header.weather_entity" data-selector-value="${esc(h.weather_entity||"")}"></div><span class="field-note">Leer = automatisch erkennen</span></label>
          <div class="hint full">Leer lassen: Halo verwendet zuerst die Wetter-Entity aus Background/Sidebar und sonst automatisch die erste <code>weather.*</code>-Entity.</div>
        </div>
      </section>

      <section class="panel">
        <div class="list-head">
          <div>
            <h3>Header Navigation</h3>
            <div class="hint">Optionale Schnellzugriffe im Header.</div>
          </div>
          <button type="button" class="add-btn" data-add-header-nav>+ Hinzufügen</button>
        </div>

        <div class="header-nav-list">
          ${items.length ? items.map((item,i)=>`
            <div class="header-nav-item">
              <div class="list-head">
                <div class="item-title">
                  <ha-icon icon="${esc(item.icon||"mdi:circle-small")}"></ha-icon>
                  <strong>${esc(item.name||`Navigation ${i+1}`)}</strong>
                </div>
                <div class="row-actions">
                  <button type="button" class="move" data-header-nav-move="${i}" data-delta="-1" ${i===0?"disabled":""}>↑</button>
                  <button type="button" class="move" data-header-nav-move="${i}" data-delta="1" ${i===items.length-1?"disabled":""}>↓</button>
                  <button type="button" class="danger" data-header-nav-remove="${i}">✕</button>
                </div>
              </div>
              <div class="grid">
                <label>Name<input data-header-nav="${i}" data-key="name" value="${esc(item.name||"")}"></label>
                <label>Icon<div class="ha-selector-host" data-selector-kind="icon" data-selector-scope="header-nav" data-selector-index="${i}" data-selector-key="icon" data-selector-value="${esc(item.icon||"mdi:circle-small")}"></div></label>
                <label class="full">Pfad<input data-header-nav="${i}" data-key="path" value="${esc(item.path||"")}"></label>
              </div>
            </div>
          `).join("") : `<div class="hint">Noch keine Header-Navigation angelegt.</div>`}
        </div>

        <label style="margin-top:12px">Beschriftungen anzeigen
          <select data-path="header.navigation.show_labels" data-kind="boolean">
            <option value="true" ${nav.show_labels===true?"selected":""}>Ja</option>
            <option value="false" ${nav.show_labels!==true?"selected":""}>Nein</option>
          </select>
        </label>
      </section>
    `;
  }

  _findLovelaceForDelete() {
    let found = null;

    const walk = (root) => {
      const all = root?.querySelectorAll?.("*") || [];
      for (const el of all) {
        const lovelace = el?.lovelace;
        if (lovelace?.config && Array.isArray(lovelace.config.views)) {
          found = lovelace;
          return true;
        }
        if (el.shadowRoot && walk(el.shadowRoot)) return true;
      }
      return false;
    };

    walk(document);
    return found;
  }

  _removeHaloFromConfig(value, state = { count: 0 }, seen = new WeakSet()) {
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return value;
    seen.add(value);

    if (Array.isArray(value)) {
      const result = [];
      for (const item of value) {
        if (
          item &&
          typeof item === "object" &&
          (item.type === "custom:halo-ui" || item.type === "halo-ui")
        ) {
          state.count += 1;
          continue;
        }
        result.push(this._removeHaloFromConfig(item, state, seen));
      }
      return result;
    }

    if (value.type === "custom:halo-ui" || value.type === "halo-ui") {
      state.count += 1;
      return null;
    }

    const result = {};
    for (const [key, item] of Object.entries(value)) {
      const next = this._removeHaloFromConfig(item, state, seen);
      if (next !== null) result[key] = next;
    }
    return result;
  }

  _clearLegacyHaloCache() {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("halo-ui:dashboard:")) localStorage.removeItem(key);
      }
    } catch {}
  }

  async _deleteHaloUi() {
    const confirmed = window.confirm(
      "Halo UI wirklich aus diesem Dashboard löschen?\n\n" +
      "Entfernt werden Halo Background, Sidebar, Header, Glass Surfaces, " +
      "Performance-Einstellungen und alle Halo-View-Overrides.\n\n" +
      "Deine normalen Home-Assistant-Ansichten, Karten und Entitäten bleiben erhalten."
    );

    if (!confirmed) return;

    const lovelace = this._findLovelaceForDelete();

    if (!lovelace?.config || typeof lovelace.saveConfig !== "function") {
      window.alert(translateHaloText("Halo UI konnte die Lovelace-Dashboard-Konfiguration nicht finden. Bitte die Seite neu laden und erneut versuchen.", this._hass));
      return;
    }

    const removed = { count: 0 };
    const nextConfig = this._removeHaloFromConfig(
      structuredClone(lovelace.config),
      removed
    );

    if (!removed.count) {
      // Recovery from an older zombie runtime.
      this._clearLegacyHaloCache();
      window.__haloUiDashboardRuntime?.shutdown?.();
      window.location.reload();
      return;
    }

    try {
      await lovelace.saveConfig(nextConfig);

      this._clearLegacyHaloCache();
      window.__haloUiDashboardRuntime?.shutdown?.();

      setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      console.error("[Halo UI] Delete failed.", error);
      window.alert(translateHaloText("Halo UI konnte nicht gelöscht werden. Details stehen in der Browser-Konsole.", this._hass));
    }
  }

  _detectResourceVersion() {
    try {
      const urls = [
        ...[...document.querySelectorAll('script[src]')].map(el => el.src),
        ...performance.getEntriesByType('resource').map(entry => entry.name)
      ];
      const hit = urls.find(url => String(url).includes('/halo-ui/halo-ui.js'));
      if (!hit) return { version: null, url: null };
      const parsed = new URL(hit, window.location.href);
      return { version: parsed.searchParams.get('v'), url: parsed.href };
    } catch { return { version: null, url: null }; }
  }

  _diagnostics() {
    const effective = this._editingConfig();
    const states = this._hass?.states || {};
    const weatherIds = Object.keys(states).filter(id => id.startsWith('weather.'));
    const personIds = Object.keys(states).filter(id => id.startsWith('person.'));
    const configuredWeather =
      effective.header?.weather_entity ||
      effective.background?.weather_entity ||
      effective.sidebar?.weather?.entity ||
      weatherIds[0] || null;
    const modules = Object.entries(effective.modules || {}).filter(([,v]) => v === true).map(([k]) => k);
    const resource = this._detectResourceVersion();
    const warnings = [];

    const missingEntity = (id, label) => {
      if (id && !states[id]) warnings.push(`${label}: Entity ${id} wurde nicht gefunden.`);
    };
    missingEntity(effective.header?.weather_entity, 'Header-Wetter');
    missingEntity(effective.background?.weather_entity, 'Background-Wetter');
    missingEntity(effective.sidebar?.weather?.entity, 'Sidebar-Wetter');
    for (const p of effective.sidebar?.presence?.entities || []) missingEntity(p?.entity, 'Person');
    for (const item of effective.sidebar?.navigation?.items || []) missingEntity(item?.badge?.entity, 'Navigation-Badge');

    const nav = effective.sidebar?.navigation?.items || [];
    const seen = new Map();
    nav.forEach((item, i) => {
      const key = `${String(item?.path||'').trim()}|${String(item?.name||'').trim()}`;
      if (!key || key === '|') return;
      if (seen.has(key)) warnings.push(`Sidebar-Navigation: Eintrag ${i+1} ist doppelt (wie Eintrag ${seen.get(key)+1}).`);
      else seen.set(key, i);
    });

    if (effective.modules?.background && effective.background?.type === 'weather-video') {
      const videos = effective.background?.weather_videos || {};
      const configured = Object.values(videos).filter(Boolean).length;
      if (!configured && !effective.background?.weather_video_default) warnings.push('Weather-Video ist aktiv, aber es ist kein Wettervideo konfiguriert.');
    }
    if ((effective.header?.show_weather || effective.sidebar?.weather?.enabled || effective.background?.type === 'weather-video') && !configuredWeather) {
      warnings.push('Wetter ist aktiviert, aber Home Assistant stellt keine weather.* Entity bereit.');
    }
    if (resource.version && resource.version !== HALO_UI_VERSION) warnings.push(`Resource-Version ${resource.version} passt nicht zur geladenen Halo-Version ${HALO_UI_VERSION}.`);

    let cardCount = 0;
    try {
      const cards = new Set();
      this._walkOpenRoots(document, el => { if (el.localName === 'ha-card') cards.add(el); });
      cardCount = cards.size;
    } catch {}

    return {
      configuredWeather, weatherCount: weatherIds.length, personCount: personIds.length,
      modules, resource, warnings, cardCount,
      performance: resolvePerformanceProfile(effective),
      preset: effective.design?.look_preset || effective.design?.preset || 'custom',
      scope: this._rootConfig().target?.mode || 'current_view',
      editScope: this._isViewEditing() ? this._editingView : '__dashboard__'
    };
  }

  _resetModule(key) {
    const allowed = new Set(['design','background','sidebar','header','layout','performance']);
    if (!allowed.has(key)) return;
    if (!window.confirm(translateHaloText(`Modul „${key}“ wirklich zurücksetzen?`, this._hass))) return;
    let next = structuredClone(this._config || {});
    if (this._isViewEditing()) {
      next = this._setOverrideBranch(next, this._editingView, key, undefined);
    } else {
      next = setPathImmutable(next, key, structuredClone(HALO_UI_DEFAULTS[key] || {}));
    }
    this._emit(next, true);
  }

  _resetAll() {
    const viewMode = this._isViewEditing();
    const text = viewMode
      ? 'Alle Anpassungen dieser Ansicht entfernen und wieder Dashboard-Standard erben?'
      : 'Halo UI wirklich vollständig auf Werkseinstellungen zurücksetzen? Inhalte deiner normalen HA-Karten bleiben erhalten.';
    if (!window.confirm(text)) return;
    if (viewMode) {
      this._emit(clearViewOverride(this._config, this._editingView), true);
      return;
    }
    const fresh = structuredClone(HALO_UI_DEFAULTS);
    this._emit(fresh, true);
  }

  async _copyExport() {
    const area = this.shadowRoot?.querySelector('[data-config-transfer]');
    if (!area) return;
    area.value = JSON.stringify(this._config || {}, null, 2);
    try {
      await navigator.clipboard.writeText(area.value);
      const status = this.shadowRoot?.querySelector('[data-transfer-status]');
      if (status) status.textContent = 'Konfiguration wurde in die Zwischenablage kopiert.';
    } catch {
      area.focus(); area.select();
      const status = this.shadowRoot?.querySelector('[data-transfer-status]');
      if (status) status.textContent = 'Automatisches Kopieren nicht möglich – Text ist markiert.';
    }
  }

  _importConfig() {
    const area = this.shadowRoot?.querySelector('[data-config-transfer]');
    const status = this.shadowRoot?.querySelector('[data-transfer-status]');
    if (!area) return;
    try {
      const parsed = JSON.parse(area.value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON muss ein Objekt sein.');
      if (parsed.type && parsed.type !== 'custom:halo-ui') throw new Error('Das ist keine Halo-UI-Konfiguration.');
      parsed.type = 'custom:halo-ui';
      if (!window.confirm(translateHaloText('Diese Halo-Konfiguration importieren und die aktuelle Konfiguration ersetzen?', this._hass))) return;
      this._emit(parsed, true);
    } catch (error) {
      if (status) status.textContent = `Import fehlgeschlagen: ${error?.message || error}`;
    }
  }

  _systemTab() {
    const effective = this._editingConfig();
    const l = effective.layout || {};
    const resolvedProfile = resolvePerformanceProfile(effective);
    const diag = this._diagnostics();
    const resourceVersion = diag.resource.version || 'nicht ermittelbar';
    const versionOk = !diag.resource.version || diag.resource.version === HALO_UI_VERSION;
    const diagRows = [
      ['Halo-Version', HALO_UI_VERSION],
      ['Resource-Version', resourceVersion],
      ['Resource-Status', versionOk ? 'OK' : 'VERSION ABWEICHEND'],
      ['Geltungsbereich', diag.scope],
      ['Bearbeiteter Scope', diag.editScope === '__dashboard__' ? 'Dashboard-Standard' : diag.editScope],
      ['Aktive Module', diag.modules.join(', ') || 'keine'],
      ['Look-Preset', diag.preset],
      ['Performance', diag.performance],
      ['Wetter-Entity', diag.configuredWeather || 'keine erkannt'],
      ['weather.* gefunden', String(diag.weatherCount)],
      ['person.* gefunden', String(diag.personCount)],
      ['ha-card im DOM', String(diag.cardCount)]
    ];

    return `
    <section class="panel">
      <h3>Performance</h3>
      <div class="grid">
        <label>Leistungsprofil
          <select data-path="performance.profile">
            <option value="auto" ${String(effective.performance?.profile||"auto")==="auto"?"selected":""}>Auto (empfohlen)</option>
            <option value="high" ${effective.performance?.profile==="high"?"selected":""}>High</option>
            <option value="balanced" ${effective.performance?.profile==="balanced"?"selected":""}>Balanced</option>
            <option value="pi" ${effective.performance?.profile==="pi"?"selected":""}>Raspberry Pi / Low Power</option>
            <option value="eco" ${effective.performance?.profile==="eco"?"selected":""}>Eco / maximale Schonung</option>
          </select>
        </label>
        <label>Aktiv erkannt<input value="${esc(resolvedProfile)}" disabled></label>
      </div>
      <div class="hint"><strong>Pi:</strong> Video läuft weiter, aber ohne teuren Glass-Blur. <strong>Eco:</strong> Video wird zum Standbild und Animationen werden weitgehend gestoppt.</div>
    </section>

    <section class="panel"><h3>Responsive & System</h3><div class="grid">
      <label>Position<select data-path="layout.position"><option value="left" ${l.position!=="right"?"selected":""}>Links</option><option value="right" ${l.position==="right"?"selected":""}>Rechts</option></select></label>
      <label>Desktop-Breite<input data-path="layout.width" value="${esc(l.width||"320px")}"></label>
      <label>Tablet Breakpoint<input type="number" data-path="layout.tablet_breakpoint" value="${Number(l.tablet_breakpoint||1400)}"></label>
      <label>Tablet-Breite<input data-path="layout.tablet_width" value="${esc(l.tablet_width||"280px")}"></label>
      <label>Tablet Header<select data-path="layout.tablet_header_mode"><option value="keep" ${l.tablet_header_mode==="keep"?"selected":""}>Wie Desktop</option><option value="compact" ${l.tablet_header_mode!=="keep"&&l.tablet_header_mode!=="hide"?"selected":""}>Kompakt</option><option value="hide" ${l.tablet_header_mode==="hide"?"selected":""}>Ausblenden</option></select></label>
      <label>Tablet Header-Höhe<input type="number" min="44" max="100" data-path="layout.tablet_header_height" value="${Number(l.tablet_header_height||58)}"></label>
      <label>Mobile Breakpoint<input type="number" data-path="layout.mobile_breakpoint" value="${Number(l.mobile_breakpoint||850)}"></label>
      <label>Mobile Sidebar<select data-path="layout.mobile_mode"><option value="hide" ${l.mobile_mode!=="top"?"selected":""}>Ausblenden</option><option value="top" ${l.mobile_mode==="top"?"selected":""}>Oben (experimentell)</option></select></label>
      <label>Mobile Header<select data-path="layout.mobile_header_mode"><option value="keep" ${l.mobile_header_mode==="keep"?"selected":""}>Wie Desktop</option><option value="compact" ${l.mobile_header_mode!=="keep"&&l.mobile_header_mode!=="hide"?"selected":""}>Kompakt</option><option value="hide" ${l.mobile_header_mode==="hide"?"selected":""}>Ausblenden</option></select></label>
      <label>Mobile Header-Höhe<input type="number" min="44" max="90" data-path="layout.mobile_header_height" value="${Number(l.mobile_header_height||52)}"></label>
    </div>
    <div class="hint">Die Breakpoints steuern nur Halo. Home Assistant darf seine Sections weiterhin selbst umbrechen. „Kompakt“ entfernt auf kleineren Displays Untertitel/Labels und reduziert beim Handy die Wetterdetails.</div>
    </section>

    <section class="panel"><h3>Home Assistant Dashboard-Ausrichtung</h3>
      <div class="hint">Richtet den gesamten nativen Dashboard-Inhalt aus (Sections, Masonry und Sidebar-Views), nicht die einzelnen Karten. „HA-Standard“ verändert das ursprüngliche Layout nicht. Desktop, Tablet und Handy sind unabhängig einstellbar.</div>
      <div class="grid">
        <label>Desktop-Ausrichtung<select data-path="layout.dashboard_alignment">${[["native","HA-Standard"],["left","Links"],["center","Mittig"],["right","Rechts"]].map(([v,t])=>`<option value="${v}" ${l.dashboard_alignment===v?"selected":""}>${t}</option>`).join("")}</select></label>
        <label>Maximale Inhaltsbreite (px)<input type="number" min="320" max="3000" step="10" data-path="layout.dashboard_max_width" value="${Number(l.dashboard_max_width??1400)}"></label>
        <label>Tablet-Ausrichtung<select data-path="layout.dashboard_tablet_alignment">${[["native","HA-Standard"],["left","Links"],["center","Mittig"],["right","Rechts"]].map(([v,t])=>`<option value="${v}" ${l.dashboard_tablet_alignment===v?"selected":""}>${t}</option>`).join("")}</select></label>
        <label>Handy-Ausrichtung<select data-path="layout.dashboard_mobile_alignment">${[["native","HA-Standard"],["left","Links"],["center","Mittig"],["right","Rechts"]].map(([v,t])=>`<option value="${v}" ${l.dashboard_mobile_alignment===v?"selected":""}>${t}</option>`).join("")}</select></label>
      </div>
      <div class="hint">Verwendet die Tablet-/Handy-Breakpoints von oben. HA bestimmt weiterhin selbst die Zahl der Spalten und das Umbrechen der Karten.</div>
    </section>

    <section class="panel"><h3>Responsive Abstände</h3><div class="grid">
      <label>Automatisch<select data-path="design.responsive_spacing"><option value="true" ${effective.design?.responsive_spacing!==false?"selected":""}>An</option><option value="false" ${effective.design?.responsive_spacing===false?"selected":""}>Aus</option></select></label>
      <label>Tablet Kartenabstand<input type="number" min="0" max="48" data-path="design.tablet_card_gap" value="${Number(effective.design?.tablet_card_gap??10)}"></label>
      <label>Tablet Section-Abstand<input type="number" min="0" max="64" data-path="design.tablet_section_gap" value="${Number(effective.design?.tablet_section_gap??14)}"></label>
      <label>Mobile Kartenabstand<input type="number" min="0" max="48" data-path="design.mobile_card_gap" value="${Number(effective.design?.mobile_card_gap??8)}"></label>
      <label>Mobile Section-Abstand<input type="number" min="0" max="64" data-path="design.mobile_section_gap" value="${Number(effective.design?.mobile_section_gap??10)}"></label>
    </div></section>

    <section class="panel">
      <div class="list-head"><h3>Diagnose</h3><button type="button" class="add-btn" data-refresh-diagnostics>Neu prüfen</button></div>
      <div class="diagnostic-grid">${diagRows.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>
      ${diag.warnings.length ? `<div class="diagnostic-warnings"><strong>${diag.warnings.length} Hinweis${diag.warnings.length===1?'':'e'}</strong>${diag.warnings.map(w=>`<div>⚠ ${esc(w)}</div>`).join('')}</div>` : `<div class="diagnostic-ok">✓ Keine offensichtlichen Konfigurationsprobleme gefunden.</div>`}
      <div class="hint">Medienpfade werden hier nur auf Konfiguration geprüft, nicht per Netzwerk geladen. Die Diagnose verändert keine Einstellungen.</div>
    </section>

    <section class="panel">
      <h3>Sichern & Übertragen</h3>
      <div class="hint">Exportiert die komplette rohe Halo-Konfiguration als JSON – inklusive Dashboard-Overrides. So kannst du einen Stand sichern oder auf ein anderes Dashboard übertragen.</div>
      <textarea class="config-transfer" data-config-transfer spellcheck="false" placeholder="Hier erscheint der Export oder du fügst eine Halo-JSON-Konfiguration zum Import ein."></textarea>
      <div class="system-actions"><button type="button" class="add-btn" data-export-config>Exportieren & kopieren</button><button type="button" class="add-btn" data-import-config>JSON importieren</button></div>
      <div class="hint" data-transfer-status></div>
    </section>

    <section class="panel">
      <h3>Zurücksetzen</h3>
      <div class="hint">${this._isViewEditing() ? 'Bei einer Ansichts-Anpassung entfernt „Modul zurücksetzen“ nur den jeweiligen Override; danach wird wieder der Dashboard-Standard geerbt.' : 'Setzt nur das gewählte Halo-Modul auf seine Werkseinstellungen zurück. Deine normalen Home-Assistant-Karten bleiben unangetastet.'}</div>
      <div class="reset-grid">
        ${[['design','Design'],['background','Background'],['sidebar','Sidebar'],['header','Header'],['layout','Responsive/Layout'],['performance','Performance']].map(([k,n])=>`<button type="button" class="reset-module" data-reset-module="${k}">${n} zurücksetzen</button>`).join('')}
      </div>
      <button type="button" class="reset-all" data-reset-all>${this._isViewEditing() ? 'Alle Overrides dieser Ansicht entfernen' : 'Halo UI auf Werkseinstellungen zurücksetzen'}</button>
    </section>

    <section class="panel"><h3>Kompatibilität</h3><p class="copy"><code>custom:halo-view-sidebar</code> bleibt enthalten. Dein aktuelles Dashboard kann also zunächst unverändert weiterlaufen, obwohl die Resource <code>halo-ui.js</code> heißt.</p></section>

    <section class="panel danger-zone">
      <h3>Gefahrenzone</h3>
      <div class="hint">Entfernt Halo UI vollständig aus diesem Dashboard. Deine normalen Home-Assistant-Karten, Ansichten und Entitäten werden nicht gelöscht.</div>
      <button type="button" class="delete-halo" data-delete-halo-ui>Halo UI aus diesem Dashboard löschen</button>
    </section>`;
  }

  _content() {
    if (this._tab === "design") return this._designTab();
    if (this._tab === "background") return this._backgroundTab();
    if (this._tab === "sidebar") return this._sidebarTab();
    if (this._tab === "header") return this._headerTab();
    if (this._tab === "system") return this._systemTab();
    return this._moduleTab();
  }

  _initHaSelectors() {
    const hosts = [...(this.shadowRoot?.querySelectorAll(".ha-selector-host") || [])];
    if (!hosts.length) return;
    customElements.whenDefined("ha-selector").then(() => {
      for (const host of hosts) {
        if (!host.isConnected || host.dataset.selectorReady === "1") continue;
        host.dataset.selectorReady = "1";
        const selector = document.createElement("ha-selector");
        selector.hass = this._hass;
        const kind = host.dataset.selectorKind;
        if (kind === "icon") selector.selector = { icon: {} };
        else {
          const domain = host.dataset.selectorDomain;
          selector.selector = { entity: domain ? { domain } : {} };
        }
        selector.value = host.dataset.selectorValue || "";
        selector.addEventListener("value-changed", (ev) => {
          const value = ev.detail?.value ?? "";
          if (host.dataset.selectorScope === "header-nav") {
            const items = structuredClone(this._editingConfig().header?.navigation?.items || []);
            const i = Number(host.dataset.selectorIndex);
            if (!items[i]) return;
            items[i][host.dataset.selectorKey || "icon"] = value;
            this._set("header.navigation.items", items, true);
          } else {
            this._set(host.dataset.selectorPath, value || null, true);
          }
        });
        host.replaceChildren(selector);
      }
    });
  }

  _render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color,#fff);font-family:var(--paper-font-body1_-_font-family,system-ui,sans-serif)}
      .tabs{display:flex;gap:4px;overflow:auto;padding:0 0 10px}.tabs button{border:0;border-radius:10px;padding:9px 12px;background:transparent;color:var(--secondary-text-color,#aaa);cursor:pointer;white-space:nowrap}.tabs button.active{background:color-mix(in srgb,var(--primary-color,#03a9f4) 18%,transparent);color:var(--primary-text-color,#fff)}
      .panel{border:1px solid var(--divider-color,#444);border-radius:14px;padding:14px;margin-bottom:12px;background:var(--ha-card-background,var(--card-background-color,#1c1c1c))}.panel h2,.panel h3{margin:0 0 12px}.hero{background:linear-gradient(135deg,rgba(33,4,67,.75),rgba(138,43,226,.25));}.eyebrow{font-size:10px;letter-spacing:.16em;color:var(--primary-color,#03a9f4);font-weight:800}.hero p,.copy{color:var(--secondary-text-color,#aaa);line-height:1.5}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.full{grid-column:1/-1}label{display:grid;gap:5px;font-size:11px;color:var(--secondary-text-color,#aaa)}input,select{box-sizing:border-box;width:100%;min-height:38px;border:1px solid var(--divider-color,#555);border-radius:9px;padding:7px 9px;background:var(--input-fill-color,rgba(255,255,255,.04));color:var(--primary-text-color,#fff)}input[type=color]{padding:3px}input[type=range]{padding:0;accent-color:var(--primary-color,#03a9f4)}
      .colors{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}.hint{font-size:11px;color:var(--secondary-text-color,#999);line-height:1.45;margin-top:9px}.scope-explain{margin-top:12px;padding:11px 12px;border-radius:11px;border:1px solid var(--divider-color,#444);background:rgba(255,255,255,.035);color:var(--secondary-text-color,#aaa);font-size:11px;line-height:1.5}.scope-explain.dashboard{border-color:color-mix(in srgb,var(--primary-color,#03a9f4) 45%,var(--divider-color,#444));background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}
      .scope-bar{display:grid;grid-template-columns:minmax(170px,1fr) minmax(180px,1.45fr) auto;align-items:end;gap:10px;margin:0 0 12px;padding:11px 12px;border:1px solid color-mix(in srgb,var(--primary-color,#03a9f4) 30%,var(--divider-color,#444));border-radius:12px;background:color-mix(in srgb,var(--primary-color,#03a9f4) 5%,var(--ha-card-background,#1c1c1c))}
      .scope-bar>div:first-child{display:grid;gap:5px}.scope-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--secondary-text-color,#999)}.scope-info{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#aaa);align-self:center}.reset-view{min-height:38px;border:1px solid var(--divider-color,#555);border-radius:9px;padding:7px 10px;background:rgba(255,255,255,.04);color:var(--primary-text-color,#fff);cursor:pointer}.reset-view:disabled{opacity:.35;cursor:not-allowed}
      .module-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--divider-color,#444)}.module-row:last-child{border-bottom:0}.module-row div{display:grid;gap:3px}.module-row span{font-size:11px;color:var(--secondary-text-color,#999)}.module-row select{width:100px}.future{opacity:.55}.soon{padding:5px 8px;border:1px solid var(--divider-color,#555);border-radius:999px}
      .weather-grid{display:grid;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--divider-color,#444)}.weather-grid label{grid-template-columns:150px 1fr;align-items:center}.weather-grid label span{font-size:12px;color:var(--primary-text-color,#fff)}
      .embedded halo-view-sidebar-editor{display:block;margin-top:10px}code{color:var(--primary-color,#03a9f4)}
      .list-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.item-title{display:flex;align-items:center;gap:8px}.row-actions{display:flex;gap:5px}.add-btn,.move,.danger{min-height:32px;border:1px solid var(--divider-color,#555);border-radius:8px;background:rgba(255,255,255,.04);color:var(--primary-text-color,#fff);cursor:pointer}.add-btn{padding:0 10px}.move,.danger{width:32px;padding:0}.danger{color:#ff7474}.move:disabled{opacity:.3;cursor:not-allowed}.header-nav-list{display:grid;gap:10px;margin-top:12px}.header-nav-item{border:1px solid var(--divider-color,#444);border-radius:12px;padding:11px;background:rgba(255,255,255,.025)}
      .danger-zone{border-color:rgba(244,67,54,.45)!important;background:rgba(244,67,54,.035)!important}
      .delete-halo{margin-top:12px;min-height:42px;padding:0 14px;border-radius:10px;border:1px solid rgba(244,67,54,.72);background:rgba(244,67,54,.12);color:#ff8a80;font-weight:700;cursor:pointer}
      .delete-halo:hover{background:rgba(244,67,54,.22)}.ha-selector-host{min-height:38px}.ha-selector-host ha-selector{display:block;width:100%}.field-note{font-size:10px;color:var(--secondary-text-color,#999)}
      .preset-picker{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.apply-preset{min-height:38px;padding:0 14px;border:1px solid color-mix(in srgb,var(--primary-color,#03a9f4) 55%,var(--divider-color,#555));border-radius:9px;background:color-mix(in srgb,var(--primary-color,#03a9f4) 16%,transparent);color:var(--primary-text-color,#fff);font-weight:700;cursor:pointer}.preset-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.preset-card{display:grid;grid-template-columns:28px 1fr;grid-template-rows:auto auto;column-gap:9px;text-align:left;align-items:center;padding:9px;border:1px solid var(--divider-color,#444);border-radius:11px;background:rgba(255,255,255,.025);color:var(--primary-text-color,#fff);cursor:pointer}.preset-card.active{border-color:color-mix(in srgb,var(--primary-color,#03a9f4) 70%,#fff 12%);background:color-mix(in srgb,var(--primary-color,#03a9f4) 10%,transparent)}.preset-card strong{font-size:12px}.preset-card small{grid-column:2;font-size:9px;line-height:1.3;color:var(--secondary-text-color,#999)}.preset-swatch{grid-row:1/3;width:28px;height:38px;border-radius:8px;border:1px solid rgba(255,255,255,.16)}.swatch-halo-glass{background:linear-gradient(135deg,#210443,#8a2be2,#ff8ad4)}.swatch-clear-glass{background:linear-gradient(135deg,#132238,#006f87,#00b8e6)}.swatch-dark-glass{background:linear-gradient(135deg,#05070b,#101827,#16243d)}.swatch-neon{background:linear-gradient(135deg,#070018,#31006b,#00f0ff)}.swatch-minimal{background:linear-gradient(135deg,#171717,#242424,#60a5fa)}.swatch-tropical{background:linear-gradient(135deg,#042f3e,#5b21b6,#ff72c6)}


      .gradient-designer{overflow:hidden}.gradient-preview{height:150px;border-radius:12px;border:1px solid rgba(255,255,255,.14);margin:12px 0 16px;box-shadow:inset 0 1px rgba(255,255,255,.08)}.gradient-track{position:relative;height:18px;border-radius:999px;margin:0 10px 22px;border:1px solid rgba(255,255,255,.16)}.gradient-stop{position:absolute;top:50%;width:22px;height:28px;transform:translate(-50%,-50%);border:2px solid #fff;border-radius:7px;background:var(--stop-color);box-shadow:0 2px 9px rgba(0,0,0,.5);cursor:ew-resize;padding:0}.gradient-stop:after{content:"";position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #fff}.gradient-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.gradient-main-grid{margin-top:4px}.gradient-geometry{display:grid;grid-template-columns:180px 1fr;gap:18px;align-items:center;margin:14px 0}.angle-wrap{display:grid;gap:7px;justify-items:center}.angle-wrap>input{width:170px}.angle-dial{position:relative;width:138px;height:138px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.06) 0 46%,transparent 47%),conic-gradient(from -90deg,rgba(255,255,255,.22),rgba(255,255,255,.04),rgba(255,255,255,.22));border:1px solid rgba(255,255,255,.16);cursor:crosshair;touch-action:none}.dial-ring{position:absolute;inset:11px;border:1px dashed rgba(255,255,255,.17);border-radius:50%}.dial-center{position:absolute;left:50%;top:50%;width:9px;height:9px;border-radius:50%;background:var(--primary-color,#03a9f4);transform:translate(-50%,-50%);box-shadow:0 0 12px var(--primary-color,#03a9f4)}.dial-hand{position:absolute;left:50%;top:50%;width:3px;height:43%;background:linear-gradient(to top,var(--primary-color,#03a9f4),#fff);transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(calc(var(--halo-angle,0) * 1deg));display:block}.dial-hand:after{content:"";position:absolute;left:50%;top:-4px;width:10px;height:10px;border-radius:50%;background:#fff;transform:translateX(-50%)}.dial-value{position:absolute;left:50%;top:50%;transform:translate(-50%,16px);font-size:11px;font-weight:800}.center-controls{display:grid;gap:14px}.center-controls label{grid-template-columns:96px 1fr 42px;align-items:center}.center-controls label input{min-height:22px}.center-controls label span{text-align:right;font-size:10px}.muted{opacity:.38}.gradient-stop-list{display:grid;gap:7px}.gradient-stop-row{display:grid;grid-template-columns:52px minmax(0,1fr) 34px;gap:8px;align-items:center;padding:7px;border:1px solid var(--divider-color,#444);border-radius:10px;background:rgba(255,255,255,.02)}.gradient-stop-row>input[type=color]{height:36px}.gradient-stop-row label{grid-template-columns:58px 1fr 40px;align-items:center}.gradient-stop-row label input{min-height:22px}.gradient-stop-row label span{text-align:right;font-size:10px}.gradient-stop-row .danger:disabled{opacity:.25}.angle-dial::before{content:"0°";position:absolute;top:3px;left:50%;transform:translateX(-50%);font-size:8px;color:var(--secondary-text-color,#999)}
      .diagnostic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px}.diagnostic-grid>div{display:flex;justify-content:space-between;gap:10px;padding:8px 9px;border:1px solid var(--divider-color,#444);border-radius:9px;background:rgba(255,255,255,.025);font-size:10px}.diagnostic-grid span{color:var(--secondary-text-color,#999)}.diagnostic-grid strong{text-align:right;font-weight:700}.diagnostic-warnings,.diagnostic-ok{margin-top:10px;padding:10px 11px;border-radius:10px;font-size:10px;line-height:1.45}.diagnostic-warnings{border:1px solid rgba(255,193,7,.35);background:rgba(255,193,7,.07);color:#ffd76a}.diagnostic-warnings>div{margin-top:5px}.diagnostic-ok{border:1px solid rgba(76,175,80,.3);background:rgba(76,175,80,.06);color:#8ed993}.config-transfer{box-sizing:border-box;width:100%;min-height:190px;margin-top:10px;resize:vertical;border:1px solid var(--divider-color,#555);border-radius:10px;padding:10px;background:rgba(0,0,0,.18);color:var(--primary-text-color,#fff);font:10px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace}.system-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.reset-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.reset-module,.reset-all{min-height:38px;border:1px solid var(--divider-color,#555);border-radius:9px;padding:7px 9px;background:rgba(255,255,255,.035);color:var(--primary-text-color,#fff);cursor:pointer}.reset-module:hover{border-color:color-mix(in srgb,var(--primary-color,#03a9f4) 55%,var(--divider-color,#555))}.reset-all{width:100%;margin-top:10px;border-color:rgba(255,152,0,.48);color:#ffcc80;background:rgba(255,152,0,.07)}
      @media(max-width:650px){.grid,.colors,.preset-grid,.diagnostic-grid,.reset-grid,.gradient-geometry{grid-template-columns:1fr}.preset-picker{grid-template-columns:1fr}.full{grid-column:auto}.weather-grid label{grid-template-columns:1fr}.scope-bar{grid-template-columns:1fr}}
    </style>
    <div class="tabs">${[["modules","Module"],["design","Design"],["background","Background"],["sidebar","Sidebar"],["header","Header"],["system","System"]].map(([id,label])=>`<button data-tab="${id}" class="${this._tab===id?"active":""}">${label}</button>`).join("")}</div>
    ${this._scopeBar()}
    ${this._content()}`;

    localizeHaloDom(this.shadowRoot, this._hass);

    this.shadowRoot.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{
      this._tab=btn.dataset.tab;
      this._broadcastPreviewContext();
      this._render();
    }));
    this.shadowRoot.querySelector("[data-delete-halo-ui]")?.addEventListener("click",()=>{
      this._deleteHaloUi();
    });
    this.shadowRoot.querySelector("[data-refresh-diagnostics]")?.addEventListener("click",()=>this._render());
    this.shadowRoot.querySelector("[data-export-config]")?.addEventListener("click",()=>this._copyExport());
    this.shadowRoot.querySelector("[data-import-config]")?.addEventListener("click",()=>this._importConfig());
    this.shadowRoot.querySelector("[data-reset-all]")?.addEventListener("click",()=>this._resetAll());
    this.shadowRoot.querySelectorAll("[data-reset-module]").forEach(btn=>btn.addEventListener("click",()=>this._resetModule(btn.dataset.resetModule)));
    this.shadowRoot.querySelector("[data-apply-look]")?.addEventListener("click",()=>{
      const select=this.shadowRoot.querySelector("[data-look-preset]");
      const id=select?.value;
      if(id && id!=="custom") this._applyLookPreset(id);
    });
    this.shadowRoot.querySelectorAll("[data-quick-look]").forEach(btn=>btn.addEventListener("click",()=>{
      this._applyLookPreset(btn.dataset.quickLook);
    }));

    this.shadowRoot.querySelector("[data-edit-view]")?.addEventListener("change",ev=>{this._editingView=ev.target.value||"__dashboard__";this._broadcastPreviewContext();this._render();});
    this.shadowRoot.querySelector("[data-reset-view]")?.addEventListener("click",()=>{if(!this._isViewEditing())return;this._emit(clearViewOverride(this._config,this._editingView),true);this._broadcastPreviewContext();});
    this.shadowRoot.querySelectorAll("[data-global-path]").forEach(el=>el.addEventListener("change",()=>{const value=this._readValue(el);if(el.dataset.globalPath==="target.mode"&&value!=="dashboard")this._editingView="__dashboard__";this._emit(setPathImmutable(this._config,el.dataset.globalPath,value),true);this._broadcastPreviewContext();}));
    this.shadowRoot.querySelectorAll("[data-path]").forEach(el=>{
      const path=el.dataset.path;
      if(el.tagName==="SELECT"){
        // Selects have no typing/caret to preserve, so commit immediately.
        el.addEventListener("change",()=>this._set(path,this._readValue(el),true));
        return;
      }

      // Stage all editable input types locally while the user is interacting.
      // This keeps the live preview responsive but does NOT fire HA's
      // config-changed event, therefore the field keeps its focus/caret.
      el.addEventListener("input",()=>this._stage(path,this._readValue(el)));
      // Native change fires on blur for text/number and on release/confirm for
      // range/color. Commit once, after the interaction is finished.
      el.addEventListener("change",()=>this._set(path,this._readValue(el),false));
    });
    this.shadowRoot.querySelectorAll("[data-color]").forEach(el=>{
      const buildNext=()=>{
        const effective=this._editingConfig();
        const colors=[...(effective.design?.colors||["#210443","#8a2be2","#ff8ad4"])];
        colors[Number(el.dataset.color)]=el.value;
        if(this._isViewEditing()){
          let next=setViewOverridePath(this._config,this._editingView,"design.colors",colors);
          next=setViewOverridePath(next,this._editingView,"sidebar.appearance.background",colors);
          return next;
        }
        let next=setPathImmutable(this._config,"design.colors",colors);
        next=setPathImmutable(next,"sidebar.appearance.background",colors);
        return next;
      };
      el.addEventListener("input",()=>{this._config=structuredClone(buildNext());this._syncPreview();});
      el.addEventListener("change",()=>this._emit(buildNext(),false));
    });

    // Gradient Designer v2 ---------------------------------------------------
    const gradientRead=()=>normalizeDesignerGradient(this._editingConfig().design||{});
    const gradientStage=(g)=>this._stageGradient(g);
    const gradientCommit=(g,rerender=false)=>this._commitGradient(g,rerender);
    const refreshGradientVisual=(g)=>{
      const css=designerGradientCss(g);
      const preview=this.shadowRoot.querySelector(".gradient-preview"); if(preview) preview.style.background=css;
      const track=this.shadowRoot.querySelector(".gradient-track"); if(track) track.style.background=css;
    };
    this.shadowRoot.querySelectorAll("[data-gradient-field]").forEach(el=>el.addEventListener("change",()=>{const g=gradientRead();g[el.dataset.gradientField]=el.value;gradientCommit(g,true);}));
    this.shadowRoot.querySelector("[data-gradient-add]")?.addEventListener("click",()=>{const g=gradientRead();if(g.stops.length>=12)return;let pos=50;if(g.stops.length){let bestGap=-1;for(let i=0;i<g.stops.length-1;i++){const gap=g.stops[i+1].position-g.stops[i].position;if(gap>bestGap){bestGap=gap;pos=(g.stops[i].position+g.stops[i+1].position)/2;}}}g.stops.push({color:g.stops[Math.floor(g.stops.length/2)]?.color||"#ffffff",position:pos});g.stops.sort((a,b)=>a.position-b.position);gradientCommit(g,true);});
    this.shadowRoot.querySelectorAll("[data-gradient-delete]").forEach(btn=>btn.addEventListener("click",()=>{const g=gradientRead();if(g.stops.length<=2)return;g.stops.splice(Number(btn.dataset.gradientDelete),1);gradientCommit(g,true);}));
    this.shadowRoot.querySelector("[data-gradient-even]")?.addEventListener("click",()=>{const g=gradientRead(),last=Math.max(1,g.stops.length-1);g.stops.forEach((st,i)=>st.position=i/last*100);gradientCommit(g,true);});
    this.shadowRoot.querySelector("[data-gradient-reverse]")?.addEventListener("click",()=>{const g=gradientRead();g.stops=g.stops.map(st=>({color:st.color,position:100-st.position})).reverse();gradientCommit(g,true);});
    this.shadowRoot.querySelectorAll("[data-gradient-color]").forEach(el=>{const idx=Number(el.dataset.gradientColor);el.addEventListener("input",()=>{const g=gradientRead();if(g.stops[idx])g.stops[idx].color=el.value;gradientStage(g);refreshGradientVisual(g);});el.addEventListener("change",()=>{const g=gradientRead();if(g.stops[idx])g.stops[idx].color=el.value;gradientCommit(g,false);});});
    this.shadowRoot.querySelectorAll("[data-gradient-position]").forEach(el=>{const idx=Number(el.dataset.gradientPosition);const update=(commit=false)=>{const g=gradientRead();if(!g.stops[idx])return;g.stops[idx].position=Number(el.value);g.stops.sort((a,b)=>a.position-b.position);if(commit)gradientCommit(g,true);else{gradientStage(g);refreshGradientVisual(g);const lab=this.shadowRoot.querySelector(`[data-gradient-position-label="${idx}"]`);if(lab)lab.textContent=`${Math.round(Number(el.value))}%`;}};el.addEventListener("input",()=>update(false));el.addEventListener("change",()=>update(true));});
    const angleInput=this.shadowRoot.querySelector("[data-gradient-angle]");
    const setAngle=(value,commit=false)=>{const g=gradientRead();g.angle=Math.max(0,Math.min(360,Number(value)||0));if(angleInput)angleInput.value=String(g.angle);if(commit)gradientCommit(g,false);else{gradientStage(g);refreshGradientVisual(g);const val=this.shadowRoot.querySelector(".dial-value");if(val)val.textContent=`${Math.round(g.angle)}°`;}};
    angleInput?.addEventListener("input",()=>setAngle(angleInput.value,false)); angleInput?.addEventListener("change",()=>setAngle(angleInput.value,true));
    const dial=this.shadowRoot.querySelector("[data-angle-dial]"); if(dial){let dragging=false;const point=(ev,commit=false)=>{const r=dial.getBoundingClientRect();const dx=ev.clientX-(r.left+r.width/2),dy=ev.clientY-(r.top+r.height/2);let deg=(Math.atan2(dy,dx)*180/Math.PI+90+360)%360;setAngle(Math.round(deg),commit);};dial.addEventListener("pointerdown",ev=>{dragging=true;dial.setPointerCapture?.(ev.pointerId);point(ev,false);});dial.addEventListener("pointermove",ev=>{if(dragging)point(ev,false);});dial.addEventListener("pointerup",ev=>{if(!dragging)return;dragging=false;point(ev,true);});}
    this.shadowRoot.querySelectorAll("[data-gradient-center]").forEach(el=>{const axis=el.dataset.gradientCenter;const update=(commit=false)=>{const g=gradientRead();g[axis==="x"?"center_x":"center_y"]=Number(el.value);if(commit)gradientCommit(g,false);else{gradientStage(g);refreshGradientVisual(g);el.parentElement?.querySelector("span") && (el.parentElement.querySelector("span").textContent=`${Math.round(Number(el.value))}%`);}};el.addEventListener("input",()=>update(false));el.addEventListener("change",()=>update(true));});
    // Drag the stop handles directly on the gradient bar.
    this.shadowRoot.querySelectorAll("[data-gradient-stop]").forEach(handle=>{let dragging=false;const idx=Number(handle.dataset.gradientStop);const move=(ev,commit=false)=>{const track=this.shadowRoot.querySelector("[data-gradient-track]");if(!track)return;const r=track.getBoundingClientRect();const pos=Math.max(0,Math.min(100,((ev.clientX-r.left)/r.width)*100));const g=gradientRead();if(!g.stops[idx])return;g.stops[idx].position=pos;handle.style.left=`${pos}%`;if(commit)gradientCommit(g,true);else{gradientStage(g);refreshGradientVisual(g);}};handle.addEventListener("pointerdown",ev=>{dragging=true;handle.setPointerCapture?.(ev.pointerId);ev.preventDefault();});handle.addEventListener("pointermove",ev=>{if(dragging)move(ev,false);});handle.addEventListener("pointerup",ev=>{if(!dragging)return;dragging=false;move(ev,true);});});

    this.shadowRoot.querySelectorAll("[data-weather-video]").forEach(el=>{
      const value=()=>{const videos={...(this._editingConfig().background?.weather_videos||{})};videos[el.dataset.weatherVideo]=el.value.trim();return videos;};
      el.addEventListener("input",()=>this._stage("background.weather_videos",value()));
      el.addEventListener("change",()=>this._set("background.weather_videos",value(),false));
    });
    this.shadowRoot.querySelectorAll("[data-mobile-weather-video]").forEach(el=>{
      const value=()=>{const videos={...(this._editingConfig().background?.mobile_weather_videos||{})};videos[el.dataset.mobileWeatherVideo]=el.value.trim();return videos;};
      el.addEventListener("input",()=>this._stage("background.mobile_weather_videos",value()));
      el.addEventListener("change",()=>this._set("background.mobile_weather_videos",value(),false));
    });

    this.shadowRoot.querySelector("[data-add-header-nav]")?.addEventListener("click",()=>{
      const items=[...(this._editingConfig().header?.navigation?.items||[])];
      items.push({name:"Neu",icon:"mdi:circle-small",path:""});
      this._set("header.navigation.items",items,true);
    });

    this.shadowRoot.querySelectorAll("[data-header-nav]").forEach(el=>{
      const value=()=>{
        const items=structuredClone(this._editingConfig().header?.navigation?.items||[]);
        const i=Number(el.dataset.headerNav);
        if(!items[i])return null;
        items[i][el.dataset.key]=el.value;
        return items;
      };
      if(el.tagName==="SELECT"){
        el.addEventListener("change",()=>{const items=value();if(items)this._set("header.navigation.items",items,false);});
      }else{
        el.addEventListener("input",()=>{const items=value();if(items)this._stage("header.navigation.items",items);});
        el.addEventListener("change",()=>{const items=value();if(items)this._set("header.navigation.items",items,false);});
      }
    });

    this.shadowRoot.querySelectorAll("[data-header-nav-remove]").forEach(el=>el.addEventListener("click",()=>{
      const items=[...(this._editingConfig().header?.navigation?.items||[])];
      items.splice(Number(el.dataset.headerNavRemove),1);
      this._set("header.navigation.items",items,true);
    }));

    this.shadowRoot.querySelectorAll("[data-header-nav-move]").forEach(el=>el.addEventListener("click",()=>{
      const items=[...(this._editingConfig().header?.navigation?.items||[])];
      const i=Number(el.dataset.headerNavMove);
      const j=i+Number(el.dataset.delta);
      if(j<0||j>=items.length)return;
      [items[i],items[j]]=[items[j],items[i]];
      this._set("header.navigation.items",items,true);
    }));

    this._initHaSelectors();
    this._syncPreview();
    this._syncSidebarEditor();
  }

  _syncPreview() {
    const p=this.shadowRoot?.querySelector("halo-background-layer");if(!p)return;const c=this._editingConfig();p.config=c.background;p.design=c.design;p.hass=this._hass;
  }
  _syncPreviewHass(){const p=this.shadowRoot?.querySelector("halo-background-layer");if(p)p.hass=this._hass;}
  _deepEqual(a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); }
    catch { return a === b; }
  }

  _deepDiff(base, value) {
    if (this._deepEqual(base, value)) return undefined;

    if (
      !base || !value ||
      typeof base !== "object" ||
      typeof value !== "object" ||
      Array.isArray(base) ||
      Array.isArray(value)
    ) {
      return structuredClone(value);
    }

    const out = {};
    for (const key of Object.keys(value)) {
      const diff = this._deepDiff(base?.[key], value[key]);
      if (diff !== undefined) out[key] = diff;
    }
    return Object.keys(out).length ? out : undefined;
  }

  _setOverrideBranch(config, viewKey, key, value) {
    const next = structuredClone(config || {});
    next.view_overrides ||= {};
    next.view_overrides[viewKey] ||= {};

    if (
      value === undefined ||
      (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length)
    ) {
      delete next.view_overrides[viewKey][key];
    } else {
      next.view_overrides[viewKey][key] = structuredClone(value);
    }

    if (!Object.keys(next.view_overrides[viewKey]).length) {
      delete next.view_overrides[viewKey];
    }
    if (!Object.keys(next.view_overrides).length) delete next.view_overrides;

    return next;
  }

  _syncSidebarEditor(){
    const e=this.shadowRoot?.querySelector("halo-view-sidebar-editor");if(!e)return;
    const effective=this._editingConfig();e.setConfig(toLegacySidebarConfig(effective));e.hass=this._hass;
    if(!e.__haloBound){e.__haloBound=true;e.addEventListener("config-changed",ev=>{
      ev.stopPropagation();
      const legacy=ev.detail?.config;
      if(!legacy)return;
      const commit=ev.detail?.commit !== false;
      let next;

      if(this._isViewEditing()){
        const baseLegacy=toLegacySidebarConfig(this._rootConfig());
        const layoutDiff=this._deepDiff(baseLegacy.layout||{},legacy.layout||{});
        const sidebarDiff=this._deepDiff(baseLegacy.sidebar||{},legacy.sidebar||{});

        next=this._setOverrideBranch(this._config,this._editingView,"layout",layoutDiff);
        next=this._setOverrideBranch(next,this._editingView,"sidebar",sidebarDiff);
      }else{
        next=structuredClone(this._config);
        next.layout=structuredClone(legacy.layout||{});
        next.sidebar=structuredClone(legacy.sidebar||{});
      }

      if(commit){
        this._emit(next,false);
      }else{
        // Keep typing/sliding entirely local. Refeeding setConfig() into the
        // embedded sidebar editor here would rebuild it and steal focus.
        this._config=structuredClone(next||{});
        this._syncPreview();
      }
    });}
  }
  _syncSidebarEditorHass(){const e=this.shadowRoot?.querySelector("halo-view-sidebar-editor");if(e)e.hass=this._hass;}
}

if(!customElements.get("halo-ui-editor"))customElements.define("halo-ui-editor",HaloUIEditor);
