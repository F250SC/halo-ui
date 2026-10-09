import { normalizeConfig, resolveViewConfig, currentViewKey, applyPerformanceTuning, resolvePerformanceProfile } from "./halo-core.js";
import { HaloBackgroundManager } from "./halo-background.js";
import { HaloDesignManager } from "./halo-design.js";
import { localizeHaloDom, translateHaloText } from "./halo-i18n.js";
import { HaloDashboardSidebarManager } from "./halo-dashboard-sidebar.js";
import { HaloHeaderManager } from "./halo-dashboard-header.js";

const SUPPORTED_VIEWS = "hui-sections-view, hui-masonry-view, hui-sidebar-view";

function composedAncestorMatches(element, selector) {
  let node = element;
  for (let i = 0; i < 40 && node; i++) {
    if (node instanceof Element && node.matches(selector)) return true;
    node = node.parentElement || node.getRootNode?.()?.host || null;
  }
  return false;
}

function walkOpenRoots(root, callback) {
  if (!root) return;
  const all = root.querySelectorAll?.("*") || [];
  for (const el of all) {
    if (!(el instanceof Element)) continue;
    if (callback(el) === false) return false;
    if (el.shadowRoot && walkOpenRoots(el.shadowRoot, callback) === false) return false;
  }
}

function activeView() {
  const candidates = [];
  walkOpenRoots(document, el => {
    if (el.matches?.(SUPPORTED_VIEWS)) candidates.push(el);
  });

  let best = null;
  let bestScore = -1;

  for (const view of candidates) {
    if (!view.isConnected) continue;
    if (composedAncestorMatches(view, "hui-dialog-edit-card, ha-dialog, dialog")) continue;

    const rect = view.getBoundingClientRect();
    if (rect.width < 180 || rect.height < 160) continue;

    const style = getComputedStyle(view);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const visibleWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    const score = visibleWidth * visibleHeight;

    if (score > bestScore) {
      best = view;
      bestScore = score;
    }
  }

  return best;
}

function currentHass() {
  return document.querySelector("home-assistant")?.hass || null;
}

function currentViewTitle() {
  const config = findLovelaceConfig();
  const key = currentViewKey();
  const view = config?.views?.find(v =>
    String(v?.path || "").replace(/^\/+|\/+$/g, "") === key
  );
  return view?.title || view?.name || key || "Übersicht";
}

function findLovelace() {
  const cached = window.__haloUiLovelace;
  if (cached?.config && Array.isArray(cached.config.views)) return cached;

  let found = null;

  walkOpenRoots(document, el => {
    const lovelace = el?.lovelace;
    if (lovelace?.config && Array.isArray(lovelace.config.views)) {
      found = lovelace;
      window.__haloUiLovelace = lovelace;
      return false;
    }
  });

  return found;
}

function findHuiRootForView(targetView = null) {
  let node = targetView || activeView();
  for (let i = 0; i < 50 && node; i++) {
    if (node.localName === "hui-root") return node;
    const root = node.getRootNode?.();
    node = node.parentElement || root?.host || null;
  }

  let best = null;
  let bestScore = -1;
  walkOpenRoots(document, el => {
    if (el.localName !== "hui-root" || !el.isConnected) return;
    const rect = el.getBoundingClientRect?.();
    if (!rect) return;
    const visibleWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    const score = visibleWidth * visibleHeight;
    if (score > bestScore) {
      best = el;
      bestScore = score;
    }
  });
  return best;
}

function dashboardEditMode(targetView = null) {
  // Home Assistant's hui-root is the source of truth. Its public Lovelace
  // object carries editMode, and in edit mode hui-root renders the
  // .exit-edit-mode button ("Fertig") plus an .edit-mode wrapper.
  const root = findHuiRootForView(targetView);
  if (!root?.isConnected) return false;

  if (root.lovelace?.editMode === true) return true;

  const shadow = root.shadowRoot;
  if (shadow?.querySelector?.(".exit-edit-mode")) return true;
  if (shadow?.querySelector?.("div.edit-mode")) return true;

  return false;
}

function findDashboardHaloObject(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);

  if (
    !Array.isArray(value) &&
    (value.type === "custom:halo-ui" || value.type === "halo-ui") &&
    value.target?.mode === "dashboard"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findDashboardHaloObject(item, seen);
      if (result) return result;
    }
  } else {
    for (const item of Object.values(value)) {
      const result = findDashboardHaloObject(item, seen);
      if (result) return result;
    }
  }

  return null;
}

function replaceDashboardHaloObject(value, replacement, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (
    !Array.isArray(value) &&
    (value.type === "custom:halo-ui" || value.type === "halo-ui") &&
    value.target?.mode === "dashboard"
  ) {
    return structuredClone(replacement);
  }

  if (Array.isArray(value)) {
    return value.map(item => replaceDashboardHaloObject(item, replacement, seen));
  }

  const out = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = replaceDashboardHaloObject(item, replacement, seen);
  }
  return out;
}

function findLovelaceConfig() {
  const lovelace = findLovelace();
  const cfg = lovelace?.config;

  if (cfg && Array.isArray(cfg.views)) {
    window.__haloUiDashboardViews = cfg.views.map((view, index) => ({
      path: String(view?.path ?? "").replace(/^\/+|\/+$/g, ""),
      title: view?.title || view?.name || view?.path || `Ansicht ${index + 1}`
    })).filter(view => view.path);
    return cfg;
  }

  return null;
}

function findHaloObjects(value, out = [], seen = new WeakSet()) {
  if (!value || typeof value !== "object") return out;
  if (seen.has(value)) return out;
  seen.add(value);

  if (
    !Array.isArray(value) &&
    (value.type === "custom:halo-ui" || value.type === "halo-ui")
  ) {
    out.push(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) findHaloObjects(item, out, seen);
  } else {
    for (const item of Object.values(value)) findHaloObjects(item, out, seen);
  }

  return out;
}

function discoverDashboardHaloConfig(lovelaceConfig = findLovelaceConfig()) {
  if (!lovelaceConfig) return null;

  const matches = findHaloObjects(lovelaceConfig)
    .map(config => normalizeConfig(config))
    .filter(config =>
      config.enabled !== false &&
      config.target?.mode === "dashboard"
    );

  if (matches.length > 1) {
    console.warn(
      "[Halo UI] Multiple dashboard-wide Halo UI controllers found. " +
      "The first one is used. Keep only one dashboard-wide Halo UI owner."
    );
  }

  return matches[0] || null;
}

function hasLocalHaloOwner(targetView) {
  let found = false;
  walkOpenRoots(targetView, el => {
    if (el.localName !== "halo-ui") return;
    if (el._inEditor?.()) return;
    const config = el._haloUiConfig;
    if (config?.enabled !== false && config?.target?.mode === "dashboard") {
      found = true;
      return false;
    }
  });
  return found;
}

// Apply only to the active view's own shadow root. No user card is rewritten.
export class HaloDashboardAlignment {
  constructor() { this.view = null; this.style = null; }
  destroy() {
    this.style?.remove();
    this.style = null;
    this.view = null;
  }
  mount(view, layout = {}) {
    // Keep styling scoped to the currently active Lovelace view.
    if (this.view !== view || !this.style?.isConnected) {
      this.destroy();
      if (!view?.shadowRoot) return;
      this.view = view;
      this.style = document.createElement("style");
      this.style.setAttribute("data-halo-dashboard-alignment", "");
      view.shadowRoot.appendChild(this.style);
    }
    const normalize = value => ["left", "center", "right"].includes(value) ? value : "native";
    const desktop = normalize(layout.dashboard_alignment);
    const tablet = normalize(layout.dashboard_tablet_alignment);
    const mobile = normalize(layout.dashboard_mobile_alignment);
    if ([desktop, tablet, mobile].every(value => value === "native")) {
      this.style.textContent = "";
      return;
    }
    const tabletBreakpoint = Math.max(600, Number(layout.tablet_breakpoint) || 1400);
    const mobileBreakpoint = Math.max(320, Math.min(tabletBreakpoint - 1, Number(layout.mobile_breakpoint) || 850));
    const maxWidth = Math.max(320, Math.min(3000, Number(layout.dashboard_max_width) || 1400));
    // Sections uses .wrapper for overall content width. Restricting .container
    // instead can unintentionally alter Home Assistant's internal grid.
    // Masonry uses #columns for the native flex layout.
    const selector = view.localName === "hui-sections-view"
      ? ".wrapper"
      : view.localName === "hui-masonry-view"
        ? "#columns"
        : ".wrapper, #columns";
    const rule = mode => mode === "native"
      ? `${selector} { max-width: revert-layer !important; margin-left: revert-layer !important; margin-right: revert-layer !important; }`
      : `${selector} { box-sizing: border-box !important; width: auto !important; max-width: min(100%, ${maxWidth}px) !important; margin-left: ${mode === "left" ? "0" : "auto"} !important; margin-right: ${mode === "right" ? "0" : "auto"} !important; }`;
    // Mobile first, then tablet, then desktop with nonoverlapping ranges:
    // native responsive options inherit HA styles rather than a prior override.
    this.style.textContent = `
      @media (min-width: ${tabletBreakpoint + 1}px) { ${desktop === "native" ? "" : rule(desktop)} }
      @media (min-width: ${mobileBreakpoint + 1}px) and (max-width: ${tabletBreakpoint}px) { ${tablet === "native" ? "" : rule(tablet)} }
      @media (max-width: ${mobileBreakpoint}px) { ${mobile === "native" ? "" : rule(mobile)} }
    `;
  }
}

class HaloDashboardRuntime {
  constructor() {
    // v0.10.8: remove persistent owner caches created by older versions.
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("halo-ui:dashboard:")) localStorage.removeItem(key);
      }
    } catch {}

    this._ownerMissingSince = 0;
    this.config = null;
    this.backgroundManager = new HaloBackgroundManager(this);
    this.designManager = new HaloDesignManager(this);
    this.sidebarManager = new HaloDashboardSidebarManager();
    this.headerManager = new HaloHeaderManager();
    this.alignmentManager = new HaloDashboardAlignment();

    this._observer = null;
    this._applyQueued = false;
    this._stateTimer = null;
    this._configPollTimer = null;
    this._editPollTimer = null;
    this._editButton = null;
    this._editorModal = null;
    this._lastActiveView = null;

    this._onConfig = event =>
      this.setConfig(event?.detail?.config, event?.detail?.persist !== false);

    this._onRoute = () => {
      this._lastActiveView = null;

      requestAnimationFrame(() => {
        this.restoreOrDiscover();
        if (this.config) this.queueApply();
        else this._suspendVisualModules();
      });
    };

    window.addEventListener("halo-ui-dashboard-config", this._onConfig);
    window.addEventListener("location-changed", this._onRoute);
    window.addEventListener("popstate", this._onRoute);

    this.restoreOrDiscover();

    // v0.10.2: no permanent full-document MutationObserver.
    // Route/config events handle structural changes immediately. A slow
    // fallback discovery remains for external dashboard edits.
    this._observer = null;

    this._configPollTimer = window.setInterval(() => {
      if (document.hidden) return;

      const changed = this.restoreOrDiscover();
      if (changed && this.config) this.queueApply();
    }, 5000);

    // Edit-mode polling stays responsive, but is cheap because Lovelace is
    // cached and no module tree is rebuilt here.
    this._editPollTimer = window.setInterval(() => {
      if (!document.hidden) this._syncEditButton();
    }, 350);

    this._scheduleStateRefresh();
  }

  _stateRefreshMs() {
    const profile = resolvePerformanceProfile(this.config || {});
    if (profile === "high") return 1800;
    if (profile === "balanced") return 3500;
    if (profile === "pi") return 6000;
    return 10000;
  }

  _scheduleStateRefresh() {
    clearTimeout(this._stateTimer);

    this._stateTimer = setTimeout(() => {
      if (!document.hidden) this._refreshLiveState();
      this._scheduleStateRefresh();
    }, this._stateRefreshMs());
  }

  _refreshLiveState() {
    if (!this.config || !this._lastActiveView?.isConnected) return;

    const resolved = resolveViewConfig(this.config, currentViewKey());
    const c = applyPerformanceTuning(resolved);
    const hass = currentHass();

    if (c.modules?.background === true) {
      this.backgroundManager.update(c.background, c.design, hass);
    }

    if (c.modules?.sidebar !== false && this.sidebarManager?.portal) {
      this.sidebarManager.update(c, hass);
    }

    if (c.modules?.header === true && this.headerManager?.portal) {
      this.headerManager.update(c, hass, currentViewTitle());
    }
  }

  shutdown() {
    this.config = null;
    this._ownerMissingSince = 0;
    this._suspendVisualModules();
    this._closeRuntimeEditor();
  }

  _removeEditButton() {
    this._editButton?.remove();
    this._editButton = null;
  }

  _suspendVisualModules() {
    this.alignmentManager.destroy();
    // Halo UI is a Lovelace/dashboard layer. Nothing may remain mounted when
    // there is no active Lovelace view (Settings, Apps, HACS, etc.).
    this.backgroundManager.destroy();
    this.designManager.destroy();
    this.sidebarManager.destroy();
    this.headerManager.destroy();
    this._removeEditButton();
    this._lastActiveView = null;
  }

  _syncEditButton() {
    // There is exactly one dashboard-wide Halo edit control and it belongs to
    // this persistent runtime. It must not depend on the physical owner card,
    // Sidebar, Header or any portal.
    if (!this.config || this.config.target?.mode !== "dashboard") {
      this._removeEditButton();
      return;
    }

    // Prefer the currently visible Lovelace view. HA may keep an old view
    // connected briefly during route/edit transitions, so relying only on the
    // cached node can leave the gear positioned on a stale view.
    const visibleView = activeView();
    const target = visibleView || (this._lastActiveView?.isConnected ? this._lastActiveView : null);

    if (!target?.isConnected) {
      this._removeEditButton();
      return;
    }

    this._lastActiveView = target;

    // Halo's editor control must only be visible while Home Assistant itself
    // is in dashboard edit mode. v0.10.11 intentionally kept it permanently
    // visible as a recovery fallback; that fixed reachability but leaked the
    // gear into normal dashboard use. The runtime is now the sole owner, so
    // we can safely gate the button by the live HA edit-mode signal.
    const haEditMode = dashboardEditMode(target);
    if (!haEditMode) {
      this._removeEditButton();
      return;
    }

    // IMPORTANT:
    // The Halo edit control belongs to the dashboard runtime itself.
    // It must NEVER live inside Sidebar/Header portals because those modules
    // can be disabled or rebuilt independently.
    if (!this._editButton) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "halo-dashboard-edit-button";
      button.title = translateHaloText("Halo UI für diese Ansicht bearbeiten", this.hass);
      button.setAttribute("aria-label", translateHaloText("Halo UI für diese Ansicht bearbeiten", this.hass));

      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", "mdi:cog");
      icon.style.cssText = "width:20px;height:20px;color:#fff;";
      button.appendChild(icon);

      button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.06)";
        button.style.background = "rgba(0,184,230,.88)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.background = "rgba(18,18,24,.78)";
      });

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openRuntimeEditor();
      });

      this._editButton = button;
    }

    const button = this._editButton;

    // Always keep the control directly on document.body.
    if (button.parentElement !== document.body) {
      document.body.appendChild(button);
    }

    const viewRect = target.getBoundingClientRect();
    const c = applyPerformanceTuning(
      resolveViewConfig(this.config, currentViewKey())
    );

    // When Sidebar exists, place the gear visually in its upper-right corner,
    // but still keep it owned by document.body.
    let left = null;
    let right = null;
    let top = Math.max(12, viewRect.top + 12);

    const mobileBreakpoint = Number(c.layout?.mobile_breakpoint || 850);
    const sidebarHiddenForMobile = window.innerWidth < mobileBreakpoint && (c.layout?.mobile_mode || "hide") === "hide";
    const sidebarEnabled = c.modules?.sidebar !== false && !sidebarHiddenForMobile;
    const sidebarPosition = c.layout?.position || "left";

    if (sidebarEnabled) {
      const sidebarWidthRaw =
        window.innerWidth < Number(c.layout?.tablet_breakpoint || 1400)
          ? (c.layout?.tablet_width || 280)
          : (c.layout?.width || 320);

      const sidebarWidth =
        typeof sidebarWidthRaw === "number"
          ? sidebarWidthRaw
          : parseFloat(String(sidebarWidthRaw)) || 320;

      if (sidebarPosition === "right") {
        right = Math.max(
          14,
          window.innerWidth - Math.min(viewRect.right, window.innerWidth) + 14
        );
      } else {
        left = Math.max(14, viewRect.left + sidebarWidth - 52);
      }
    } else {
      // With background-only setups the very top of the view can be occupied
      // by Halo/header/status overlays. Place the gear below that strip so it
      // stays visibly reachable instead of being covered in the corner.
      top = Math.max(72, viewRect.top + 72);
      right = Math.max(
        18,
        window.innerWidth - Math.min(viewRect.right, window.innerWidth) + 18
      );
    }

    button.style.cssText = `
      position:fixed;
      top:${top}px;
      ${left !== null ? `left:${left}px;right:auto;` : `right:${right}px;left:auto;`}
      z-index:99999;
      width:38px;
      height:38px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.20);
      background:rgba(0,184,230,.82);
      color:#fff;
      opacity:1;
      box-shadow:0 8px 24px rgba(0,0,0,.30);
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      cursor:pointer;
      padding:0;
      transition:transform .16s ease, background .16s ease;
    `;
  }

  _closeRuntimeEditor() {
    this._editorModal?.remove();
    this._editorModal = null;
  }

  _openRuntimeEditor() {
    this._closeRuntimeEditor();

    const lovelace = findLovelace();
    const rawOwner = findDashboardHaloObject(lovelace?.config);
    const initialConfig = structuredClone(rawOwner || this.config || {});
    const viewKey = currentViewKey() || "__dashboard__";

    const context = { tab: "modules", viewKey };
    window.__haloUiPreviewContext = context;
    window.dispatchEvent(new CustomEvent("halo-ui-preview-context", {
      detail: context
    }));

    let draft = structuredClone(initialConfig);

    const backdrop = document.createElement("div");
    backdrop.className = "halo-runtime-editor-modal";
    backdrop.style.cssText = `
      position:fixed;
      inset:0;
      z-index:100000;
      background:rgba(0,0,0,.58);
      display:grid;
      place-items:center;
      padding:22px;
      box-sizing:border-box;
      backdrop-filter:blur(4px);
      -webkit-backdrop-filter:blur(4px);
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
      width:min(1180px,96vw);
      height:min(790px,92vh);
      min-height:520px;
      overflow:hidden;
      display:grid;
      grid-template-rows:auto 1fr auto;
      border-radius:18px;
      border:1px solid var(--divider-color,rgba(255,255,255,.16));
      background:var(--card-background-color,var(--ha-card-background,#202124));
      color:var(--primary-text-color,#fff);
      box-shadow:0 24px 80px rgba(0,0,0,.46);
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      padding:14px 18px;
      border-bottom:1px solid var(--divider-color,rgba(255,255,255,.12));
    `;
    header.innerHTML = `
      <div>
        <div style="font-size:17px;font-weight:700">Halo UI</div>
        <div style="font-size:11px;color:var(--secondary-text-color,#aaa)">
          Ansicht: ${viewKey === "__dashboard__" ? "Dashboard-Standard" : viewKey}
        </div>
      </div>
    `;

    const close = document.createElement("button");
    close.type = "button";
    close.title = "Schließen";
    close.innerHTML = "✕";
    close.style.cssText = `
      width:34px;height:34px;border-radius:9px;border:1px solid var(--divider-color,#555);
      background:transparent;color:inherit;cursor:pointer;font-size:17px;
    `;
    close.addEventListener("click", () => this._closeRuntimeEditor());
    header.appendChild(close);

    const content = document.createElement("div");
    content.style.cssText = `
      min-height:0;
      display:grid;
      grid-template-columns:minmax(440px,1fr) minmax(360px,.92fr);
      gap:14px;
      padding:14px;
      overflow:hidden;
    `;

    const editorPane = document.createElement("div");
    editorPane.style.cssText = "min-width:0;min-height:0;overflow:auto;padding-right:3px;";

    const editor = document.createElement("halo-ui-editor");
    editor.hass = currentHass();
    editor.setConfig(draft);
    editor._editingView = viewKey;
    editor._render?.();
    editorPane.appendChild(editor);

    const previewPane = document.createElement("div");
    previewPane.className = "halo-runtime-editor-preview";
    previewPane.style.cssText = `
      min-width:0;
      min-height:0;
      overflow:auto;
      border-left:1px solid var(--divider-color,rgba(255,255,255,.10));
      padding-left:14px;
    `;

    const preview = document.createElement("halo-ui");
    preview._haloPreviewOnly = true;
    previewPane.appendChild(preview);
    preview.hass = currentHass();
    preview.setConfig(draft);

    editor.addEventListener("config-changed", event => {
      event.stopPropagation();
      draft = structuredClone(event.detail?.config || draft);
      preview.setConfig(draft);
      preview.hass = currentHass();
    });

    content.append(editorPane, previewPane);

    const footer = document.createElement("div");
    footer.style.cssText = `
      display:flex;
      justify-content:flex-end;
      gap:9px;
      padding:12px 16px;
      border-top:1px solid var(--divider-color,rgba(255,255,255,.12));
    `;

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = translateHaloText("Abbrechen", this.hass);
    cancel.style.cssText = `
      min-height:38px;padding:0 16px;border-radius:9px;
      border:1px solid var(--divider-color,#555);
      background:transparent;color:inherit;cursor:pointer;
    `;
    cancel.addEventListener("click", () => this._closeRuntimeEditor());

    const save = document.createElement("button");
    save.type = "button";
    save.textContent = translateHaloText("Speichern", this.hass);
    save.style.cssText = `
      min-height:38px;padding:0 18px;border-radius:9px;border:0;
      background:var(--primary-color,#03a9f4);color:#fff;
      font-weight:700;cursor:pointer;
    `;

    save.addEventListener("click", async () => {
      if (!lovelace?.saveConfig || !lovelace?.config) {
        console.error("[Halo UI] Lovelace saveConfig is not available.");
        return;
      }

      save.disabled = true;
      save.textContent = translateHaloText("Speichere…", this.hass);

      try {
        const nextDashboard = replaceDashboardHaloObject(
          structuredClone(lovelace.config),
          draft
        );

        await lovelace.saveConfig(nextDashboard);

        this.config = normalizeConfig(draft);
        this._ownerMissingSince = 0;
        this.queueApply();
        this._closeRuntimeEditor();
      } catch (error) {
        console.error("[Halo UI] Saving dashboard config failed.", error);
        save.disabled = false;
        save.textContent = translateHaloText("Speichern", this.hass);
      }
    });

    footer.append(cancel, save);
    dialog.append(header, content, footer);
    localizeHaloDom(dialog, this.hass);
    backdrop.appendChild(dialog);

    backdrop.addEventListener("mousedown", event => {
      if (event.target === backdrop) this._closeRuntimeEditor();
    });

    document.body.appendChild(backdrop);
    this._editorModal = backdrop;
  }

  restoreOrDiscover() {
    const lovelaceConfig = findLovelaceConfig();

    // HA can briefly expose no complete Lovelace config during transitions.
    if (!lovelaceConfig) return false;

    const discovered = discoverDashboardHaloConfig(lovelaceConfig);

    if (discovered) {
      this.config = discovered;
      this._ownerMissingSince = 0;
      return true;
    }

    // Protect against one transient partial config snapshot.
    const now = performance.now();

    if (!this._ownerMissingSince) {
      this._ownerMissingSince = now;
      return false;
    }

    if (now - this._ownerMissingSince < 1500) return false;

    // A valid dashboard config has continuously contained no Halo owner:
    // Halo is really deleted.
    this.shutdown();
    return true;
  }

  setConfig(rawConfig, persist = true) {
    if (!rawConfig) {
      this.shutdown();
      return;
    }

    const config = normalizeConfig(rawConfig);

    if (config.enabled === false || config.target?.mode !== "dashboard") {
      this.shutdown();
      return;
    }

    this.config = config;
    this._ownerMissingSince = 0;
    this._scheduleStateRefresh();
    this.queueApply();
  }

  queueApply() {
    if (this._applyQueued) return;
    this._applyQueued = true;

    requestAnimationFrame(() => {
      this._applyQueued = false;
      this.apply();
    });
  }

  apply() {
    if (!this.config || this.config.enabled === false) {
      this._suspendVisualModules();
      return;
    }

    const target =
      this._lastActiveView?.isConnected
        ? this._lastActiveView
        : activeView();

    if (!target) {
      this._suspendVisualModules();
      return;
    }

    this._lastActiveView = target;

    const hass = currentHass();
    const resolved = resolveViewConfig(this.config, currentViewKey());
    const c = applyPerformanceTuning(resolved);

    if (c.enabled === false) {
      this.alignmentManager.destroy();
      this.backgroundManager.destroy();
      this.designManager.destroy();
      this.sidebarManager.destroy();
      this.headerManager.destroy();
      this._removeEditButton();
      return;
    }

    this.alignmentManager.mount(target, c.layout);

    if (c.modules?.background === true) {
      this.backgroundManager.mount(target, c.background, c.design, hass);
    } else {
      this.backgroundManager.destroy();
    }

    if (c.modules?.surfaces === true) {
      this.designManager.mount(target, c.design);
    } else {
      this.designManager.destroy();
    }

    if (c.modules?.sidebar !== false) {
      // On the owner view, the real controller keeps managing the sidebar.
      // This preserves its edit-mode gear button. Other views are handled by
      // the persistent dashboard sidebar manager.
      if (hasLocalHaloOwner(target)) this.sidebarManager.destroy();
      else this.sidebarManager.mount(target, c, hass);
    } else {
      this.sidebarManager.destroy();
    }

    if (c.modules?.header === true) {
      this.headerManager.mount(target, c, hass, currentViewTitle());
    } else {
      this.headerManager.destroy();
    }

    // Run this last so optional module teardown can never remove the control.
    this._syncEditButton();
  }
}

if (!window.__haloUiDashboardRuntime) {
  window.__haloUiDashboardRuntime = new HaloDashboardRuntime();
}

export function publishDashboardConfig(config, persist = true) {
  window.dispatchEvent(new CustomEvent("halo-ui-dashboard-config", {
    detail: { config, persist }
  }));
}
