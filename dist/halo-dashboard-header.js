import { normalizeConfig } from "./halo-core.js";

function findSidebarPortal() {
  for (const selector of [".halo-dashboard-sidebar-portal", ".halo-view-sidebar-portal"]) {
    const el = document.querySelector(selector);
    if (el && el.isConnected && getComputedStyle(el).display !== "none") return el;
  }
  return null;
}

export class HaloHeaderManager {
  constructor() {
    this.targetView = null;
    this.portal = null;
    this.header = null;
    this.config = null;
    this.hass = null;
    this.viewTitle = "";
    this.previous = null;
    this.resizeObserver = null;
    this._onResize = () => {
      this._applyHeaderConfig();
      this._syncGeometry();
    };
  }

  mount(targetView, config, hass, viewTitle = "") {
    if (!targetView || !config) return;

    if (this.targetView !== targetView) {
      this.destroy();
      this.targetView = targetView;
      const computed = getComputedStyle(targetView);
      this.previous = {
        paddingTop: targetView.style.getPropertyValue("padding-top"),
        paddingTopPriority: targetView.style.getPropertyPriority("padding-top"),
        boxSizing: targetView.style.boxSizing,
        basePaddingTop: parseFloat(computed.paddingTop) || 0
      };
    }

    this.config = normalizeConfig(config);
    this.hass = hass;
    this.viewTitle = viewTitle || "";

    if (!this.portal) {
      this.portal = document.createElement("div");
      this.portal.className = "halo-dashboard-header-portal";
      this.portal.style.cssText = `
        position:fixed;z-index:4;pointer-events:auto;box-sizing:border-box;
      `;

      this.header = document.createElement("halo-header");
      this.portal.appendChild(this.header);
      document.body.appendChild(this.portal);

      window.addEventListener("resize", this._onResize, { passive: true });

      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => this._syncGeometry());
        this.resizeObserver.observe(targetView);
      }
    }

    this.update(config, hass, viewTitle);
  }

  update(config, hass, viewTitle = this.viewTitle) {
    if (config) this.config = normalizeConfig(config);
    if (hass) this.hass = hass;
    this.viewTitle = viewTitle || this.viewTitle || "";

    this._applyHeaderConfig();
    this._syncGeometry();
  }

  _responsiveState() {
    const l = this.config?.layout || {};
    const width = window.innerWidth || 1920;
    const mobileBreakpoint = Math.max(320, Number(l.mobile_breakpoint) || 850);
    const tabletBreakpoint = Math.max(mobileBreakpoint + 1, Number(l.tablet_breakpoint) || 1400);
    if (width < mobileBreakpoint) return "mobile";
    if (width < tabletBreakpoint) return "tablet";
    return "desktop";
  }

  _applyHeaderConfig() {
    if (!this.header || !this.config) return;
    const headerConfig = { ...(this.config.header || {}) };
    const state = this._responsiveState();
    const l = this.config.layout || {};
    const mode = state === "mobile" ? (l.mobile_header_mode || "compact")
      : state === "tablet" ? (l.tablet_header_mode || "compact") : "keep";

    if (mode === "compact") {
      headerConfig.show_subtitle = false;
      headerConfig.navigation = { ...(headerConfig.navigation || {}), show_labels: false };
      if (state === "mobile") headerConfig.show_condition = false;
    }

    if (headerConfig.show_weather && !String(headerConfig.weather_entity || "").trim()) {
      const candidates = [this.config.background?.weather_entity, this.config.sidebar?.weather?.entity];
      let resolved = candidates.find(id => typeof id === "string" && id.trim());
      if (!resolved && this.hass?.states) resolved = Object.keys(this.hass.states).find(id => id.startsWith("weather."));
      if (resolved) headerConfig.weather_entity = resolved;
    }

    this.header.config = headerConfig;
    this.header.design = this.config.design || {};
    this.header.hass = this.hass;
    this.header.viewTitle = this.viewTitle;
  }

  _restorePadding() {
    if (!this.targetView || !this.previous) return;

    if (this.previous.paddingTop) {
      this.targetView.style.setProperty(
        "padding-top",
        this.previous.paddingTop,
        this.previous.paddingTopPriority || ""
      );
    } else {
      this.targetView.style.removeProperty("padding-top");
    }

    this.targetView.style.boxSizing = this.previous.boxSizing || "";
  }

  _syncGeometry() {
    if (!this.targetView || !this.portal || !this.config) return;

    const h = this.config.header || {};
    const l = this.config.layout || {};
    const state = this._responsiveState();
    const mode = state === "mobile" ? (l.mobile_header_mode || "compact")
      : state === "tablet" ? (l.tablet_header_mode || "compact") : "keep";

    if (mode === "hide") {
      this.portal.style.display = "none";
      this._restorePadding();
      return;
    }

    const height = Math.max(44, Number(
      state === "mobile" ? l.mobile_header_height
        : state === "tablet" ? l.tablet_header_height
        : h.height
    ) || Number(h.height) || 64);
    const margin = Math.max(0, Number(
      state === "mobile" ? l.mobile_header_margin
        : state === "tablet" ? l.tablet_header_margin
        : h.margin
    ) || 0);
    const reserve = height + margin;

    const viewRect = this.targetView.getBoundingClientRect();
    let left = Math.max(0, viewRect.left + margin);
    let right = Math.min(window.innerWidth, viewRect.right - margin);

    const sidebarPortal = findSidebarPortal();
    if (sidebarPortal) {
      const rect = sidebarPortal.getBoundingClientRect();
      if ((this.config.layout?.position || "left") === "right") {
        right = Math.min(right, rect.left - margin);
      } else {
        left = Math.max(left, rect.right + margin);
      }
    }

    const top = Math.max(0, viewRect.top + margin);

    Object.assign(this.portal.style, {
      display: "block",
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.max(180, right - left)}px`,
      height: `${height}px`
    });

    this._restorePadding();
    const base = this.previous?.basePaddingTop || 0;
    this.targetView.style.setProperty(
      "padding-top",
      `${base + reserve}px`,
      "important"
    );
    this.targetView.style.boxSizing = "border-box";
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this._restorePadding();

    this.portal?.remove();
    this.portal = null;
    this.header = null;
    this.targetView = null;
    this.config = null;
    this.hass = null;
    this.viewTitle = "";
    this.previous = null;
  }
}
