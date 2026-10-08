import {
  normalizeConfig,
  toLegacySidebarConfig
} from "./halo-core.js";

function cssLength(value, fallback = "320px") {
  if (typeof value === "number") return `${value}px`;
  const s = String(value || "").trim();
  return s || fallback;
}

export class HaloDashboardSidebarManager {
  constructor() {
    this.targetView = null;
    this.portal = null;
    this.sidebar = null;
    this.config = null;
    this.hass = null;
    this.previous = null;
    this.resizeObserver = null;
    this._onResize = () => this._syncGeometry();
  }

  _responsiveState() {
    const l = this.config?.layout || {};
    const width = window.innerWidth;
    const mobileBreakpoint = Math.max(320, Number(l.mobile_breakpoint) || 850);
    const tabletBreakpoint = Math.max(
      mobileBreakpoint + 1,
      Number(l.tablet_breakpoint) || 1400
    );

    if (width < mobileBreakpoint) return "mobile";
    if (width < tabletBreakpoint) return "tablet";
    return "desktop";
  }

  _sidebarConfig() {
    const c = normalizeConfig(this.config || {});
    const legacy = toLegacySidebarConfig({
      ...c,
      target: { mode: "current_view" }
    });

    const sidebar = structuredClone(legacy.sidebar || {});
    sidebar.type = "custom:halo-sidebar";
    sidebar.layout = {
      ...(sidebar.layout || {}),
      fixed: false,
      width: "100%"
    };

    const state = this._responsiveState();
    const tabletPreset = c.layout?.tablet_preset || "keep";
    if (state === "tablet" && tabletPreset !== "keep") {
      sidebar.layout.preset = tabletPreset;
    }

    return sidebar;
  }

  mount(targetView, config, hass) {
    if (!targetView || !config) return;

    if (this.targetView !== targetView) {
      this.destroy();
      this.targetView = targetView;
      this.previous = {
        paddingLeft: targetView.style.getPropertyValue("padding-left"),
        paddingLeftPriority: targetView.style.getPropertyPriority("padding-left"),
        paddingRight: targetView.style.getPropertyValue("padding-right"),
        paddingRightPriority: targetView.style.getPropertyPriority("padding-right"),
        boxSizing: targetView.style.boxSizing
      };
    }

    this.config = normalizeConfig(config);
    this.hass = hass;

    if (!this.portal) {
      const portal = document.createElement("div");
      portal.className = "halo-dashboard-sidebar-portal";
      portal.style.cssText =
        "position:fixed;z-index:3;overflow:hidden;pointer-events:auto;box-sizing:border-box;";

      const sidebar = document.createElement("halo-sidebar");
      portal.appendChild(sidebar);

      document.body.appendChild(portal);
      this.portal = portal;
      this.sidebar = sidebar;

      window.addEventListener("resize", this._onResize, { passive: true });

      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => this._syncGeometry());
        this.resizeObserver.observe(targetView);
      }
    }

    this.sidebar.setConfig(this._sidebarConfig());
    if (hass) this.sidebar.hass = hass;
    this._syncGeometry();
  }

  update(config, hass) {
    if (config) this.config = normalizeConfig(config);
    if (hass) this.hass = hass;

    if (this.sidebar && this.config) {
      this.sidebar.setConfig(this._sidebarConfig());
      if (this.hass) this.sidebar.hass = this.hass;
    }
    this._syncGeometry();
  }

  _restorePadding() {
    if (!this.targetView || !this.previous) return;
    const view = this.targetView;

    for (const [name, value, priority] of [
      ["padding-left", this.previous.paddingLeft, this.previous.paddingLeftPriority],
      ["padding-right", this.previous.paddingRight, this.previous.paddingRightPriority]
    ]) {
      if (value) view.style.setProperty(name, value, priority || "");
      else view.style.removeProperty(name);
    }

    view.style.boxSizing = this.previous.boxSizing || "";
  }

  _syncGeometry() {
    if (!this.targetView || !this.portal || !this.config) return;

    const l = this.config.layout || {};
    const state = this._responsiveState();
    const mobile = state === "mobile";
    const tablet = state === "tablet";
    const mode = mobile ? (l.mobile_mode || "hide") : "side";
    const right = l.position === "right";

    if (mode !== "side") {
      this._restorePadding();
      this.portal.style.display = "none";
      return;
    }

    const rawWidth = cssLength(
      tablet ? l.tablet_width : l.width,
      tablet ? "280px" : "320px"
    );

    const measure = document.createElement("div");
    measure.style.cssText =
      `position:absolute;visibility:hidden;width:${rawWidth};max-width:100vw;pointer-events:none;`;
    document.body.appendChild(measure);
    const px = Math.min(
      Math.max(90, measure.getBoundingClientRect().width || 320),
      window.innerWidth * 0.75
    );
    measure.remove();

    const view = this.targetView;
    this._restorePadding();
    view.style.setProperty(
      right ? "padding-right" : "padding-left",
      `${px}px`,
      "important"
    );
    view.style.boxSizing = "border-box";

    const rect = view.getBoundingClientRect();
    const top = Math.max(0, rect.top + (Number(l.top_offset) || 0));
    const bottom = Math.max(0, Number(l.bottom_offset) || 0);

    Object.assign(this.portal.style, {
      display: "block",
      width: `${px}px`,
      height: `${Math.max(180, window.innerHeight - top - bottom)}px`,
      top: `${top}px`,
      left: right
        ? `${Math.max(0, rect.right - px)}px`
        : `${Math.max(0, rect.left)}px`,
      right: "auto",
      overflowY: "auto",
      background: "transparent",
      pointerEvents: "auto"
    });
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this._restorePadding();
    this.portal?.remove();
    this.portal = null;
    this.sidebar = null;
    this.targetView = null;
    this.previous = null;
    this.config = null;
    this.hass = null;
  }
}
