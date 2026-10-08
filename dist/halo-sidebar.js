import { localizeHaloDom, translateHaloText, haloWeatherLabel, haloPresenceLabel } from "./halo-i18n.js";

const HALO_VERSION = "0.7.5";

const DEFAULTS = {
  type: "custom:halo-sidebar",
  layout: {
    preset: "dashboard",
    position: "left",
    width: "320px",
    collapsed_width: "72px",
    gap: "14px",
    padding: "18px",
    fixed: false
  },
  appearance: {
    preset: "gradient",
    accent: "#00b8e6",
    text_color: "#ffffff",
    secondary_text_color: "rgba(255,255,255,.58)",
    background: ["#210443", "#8a2be2", "#ff8ad4"],
    gradient_angle: 135,
    animation_speed: 30,
    glass: true,
    blur: 18,
    radius: 0
  },
  clock: {
    enabled: true,
    format: "24h",
    show_seconds: false
  },
  date: {
    enabled: true,
    locale: "auto",
    format: {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  },
  weather: {
    enabled: false,
    entity: null,
    show_temperature: true,
    show_condition: true
  },
  background: {
    type: "animated-gradient",
    opacity: 1,
    video: null,
    image: null,
    weather_entity: null,
    weather_mode: "css",
    weather_effects: false,
    weather_condition: "auto",
    effect_intensity: 0.55,
    effect_speed: 1,
    reduce_motion: true,

    // Weather Video Engine v1
    weather_video_default: "/local/halo-ui/halo_weather/cloudy.mp4",
    weather_videos: {
      sunny: "/local/halo-ui/halo_weather/sunny.mp4",
      "clear-night": "/local/halo-ui/halo_weather/clear-night.mp4",
      partlycloudy: "/local/halo-ui/halo_weather/partlycloudy.mp4",
      cloudy: "/local/halo-ui/halo_weather/cloudy.mp4",
      rainy: "/local/halo-ui/halo_weather/rainy.mp4",
      pouring: "/local/halo-ui/halo_weather/pouring.mp4",
      lightning: "/local/halo-ui/halo_weather/lightning.mp4",
      "lightning-rainy": "/local/halo-ui/halo_weather/lightning-rainy.mp4",
      snowy: "/local/halo-ui/halo_weather/snowy.mp4",
      fog: "/local/halo-ui/halo_weather/fog.mp4",
      windy: "/local/halo-ui/halo_weather/windy.mp4"
    },
    weather_video_fallback_css: true,
    weather_video_opacity: 0.82,
    weather_video_overlay: 0.18,
    weather_video_fit: "cover",

    // Performance mode: when a video is active, Halo stops all other
    // background animations so the browser only has to animate the video.
    video_performance_mode: true,
    video_allow_css_weather_fx: false,

    // v0.7 Tablet & Performance
    performance_profile: "auto",
    pause_when_hidden: true,
    pause_when_offscreen: true
  },
  navigation: {
    show_labels: true,
    style: "auto",
    items: []
  },
  presence: {
    enabled: false,
    layout: "cards",
    show_status: true,
    show_status_icon: true,
    click_more_info: true,
    entities: []
  },
  debug: {
    show_version: false
  }
};

const PRESETS = {
  dashboard: {
    clockSize: "clamp(54px, 5vw, 96px)",
    navStyle: "list",
    weatherLarge: true,
    presenceLarge: true
  },
  classic: {
    clockSize: "52px",
    navStyle: "list",
    weatherLarge: false,
    presenceLarge: false
  },
  compact: {
    clockSize: "34px",
    navStyle: "icons-only",
    weatherLarge: false,
    presenceLarge: false
  },
  glass: {
    clockSize: "48px",
    navStyle: "cards",
    weatherLarge: false,
    presenceLarge: false
  },
  floating: {
    clockSize: "58px",
    navStyle: "floating",
    weatherLarge: false,
    presenceLarge: false
  }
};

function deepMerge(base, extra) {
  if (Array.isArray(extra)) return [...extra];
  if (!extra || typeof extra !== "object") return extra ?? base;
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(extra)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge(base?.[k] || {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function esc(v = "") {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function haloClamp(v, min, max, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function haloGradient(app = {}) {
  const legacy = Array.isArray(app.background) && app.background.length ? app.background : ["#210443","#8a2be2","#ff8ad4"];
  const raw = app.gradient || {};
  let stops = Array.isArray(raw.stops) ? raw.stops.map((st,i)=>({
    color:String(st?.color || legacy[i % legacy.length] || "#000000"),
    position:haloClamp(st?.position,0,100,i*100/Math.max(1,raw.stops.length-1))
  })).filter(st=>/^#[0-9a-f]{6}$/i.test(st.color)) : [];
  if(stops.length<2){ const last=Math.max(1,legacy.length-1); stops=legacy.map((color,i)=>({color:String(color),position:i/last*100})); }
  stops.sort((a,b)=>a.position-b.position);
  return {type:["linear","radial","conic"].includes(raw.type)?raw.type:"linear",angle:haloClamp(raw.angle??app.gradient_angle,0,360,135),center_x:haloClamp(raw.center_x,0,100,50),center_y:haloClamp(raw.center_y,0,100,50),interpolation:raw.interpolation==="srgb"?"srgb":"oklab",stops};
}
function haloGradientCss(app = {}) {
  const g=haloGradient(app); const interp=g.interpolation==="oklab"?" in oklab":""; const stops=g.stops.map(st=>`${st.color} ${Number(st.position).toFixed(2)}%`).join(",");
  if(g.type==="radial") return `radial-gradient(circle at ${g.center_x}% ${g.center_y}%${interp},${stops})`;
  if(g.type==="conic") return `conic-gradient(from ${g.angle}deg at ${g.center_x}% ${g.center_y}%${interp},${stops})`;
  return `linear-gradient(${g.angle}deg${interp},${stops})`;
}

function stateLabel(stateObj) {
  if (!stateObj) return "Nicht verfügbar";
  return stateObj.attributes?.friendly_name || stateObj.state || "";
}

function weatherEmoji(state) {
  const map = {
    sunny: "☀️",
    "clear-night": "🌙",
    cloudy: "☁️",
    partlycloudy: "⛅",
    rainy: "🌧️",
    pouring: "🌧️",
    lightning: "⛈️",
    "lightning-rainy": "⛈️",
    snowy: "❄️",
    fog: "🌫️",
    windy: "💨",
    hail: "🌨️"
  };
  return map[state] || "🌤️";
}

function weatherLabel(state, locale = "de-DE") {
  const de = {
    sunny: "Sonnig", "clear-night": "Klare Nacht", cloudy: "Bewölkt",
    partlycloudy: "Teilweise bewölkt", rainy: "Regen", pouring: "Starker Regen",
    lightning: "Gewitter", "lightning-rainy": "Gewitter & Regen", snowy: "Schnee",
    "snowy-rainy": "Schneeregen", fog: "Nebel", windy: "Windig",
    "windy-variant": "Sehr windig", hail: "Hagel", exceptional: "Unwetter"
  };
  if (String(locale || "").toLowerCase().startsWith("de")) return de[state] || String(state || "").replace(/[-_]/g, " ");
  return String(state || "").replace(/[-_]/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

function personStateLabel(stateObj, hass) {
  if (!stateObj) return "Nicht verfügbar";
  const state = String(stateObj.state || "").trim();
  const lower = state.toLowerCase();
  if (lower === "home") return "Zuhause";
  if (lower === "not_home") return "Unterwegs";
  if (["unknown", "unavailable", ""].includes(lower)) return "Nicht verfügbar";

  // A person state may contain the slug/name of a HA zone. Prefer the actual
  // zone friendly name. Do not fall back to the person's own friendly_name,
  // because that produced duplicated labels such as "SebHandy / SebHandy".
  const zoneKey = state.toLowerCase().replace(/\s+/g, "_");
  const zone = hass?.states?.[`zone.${zoneKey}`];
  if (zone?.attributes?.friendly_name) return zone.attributes.friendly_name;

  const ownName = String(stateObj.attributes?.friendly_name || "").trim().toLowerCase();
  if (ownName && lower === ownName) return "Unterwegs";

  return state.replace(/[_-]+/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

class HaloSidebar extends HTMLElement {
  static getConfigElement() {
    return document.createElement("halo-sidebar-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:halo-sidebar",
      layout: { preset: "dashboard", width: "320px" },
      appearance: { preset: "gradient" },
      background: { type: "animated-gradient" },
      clock: { enabled: true },
      date: { enabled: true },
      navigation: {
        items: [
          { name: "Zuhause", icon: "mdi:home", path: "/lovelace/0" }
        ]
      }
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = deepMerge(DEFAULTS, {});
    this._hass = null;
    this._timer = null;
    this._route = window.location.pathname;
    this._routeListener = () => {
      this._route = window.location.pathname;
      this._render();
    };
    this._videoResumeState = null;
    this._isIntersecting = true;
    this._intersectionObserver = null;
    this._onVisibilityChange = () => this._syncVideoPlayback();
    this._onPageShow = () => this._syncVideoPlayback();
    this._onPageHide = () => this._syncVideoPlayback(true);
  }

  setConfig(config) {
    if (!config) throw new Error("Halo Sidebar: config missing");
    this._config = deepMerge(DEFAULTS, config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;

    const root = this.shadowRoot?.querySelector(".halo");
    if (!root) {
      this._render();
      return;
    }

    // A weather-dependent video must only rebuild when its actual source
    // changes. Everything else is patched in place.
    if (this._videoBackgroundActive()) {
      const current = this.shadowRoot?.querySelector(".bg-video");
      const currentSource =
        current?.getAttribute("data-halo-video-source") || "";
      const nextSource =
        this._config.background?.type === "video"
          ? String(this._config.background?.video || "").trim()
          : this._weatherVideoSource();

      if (currentSource !== nextSource) {
        this._render();
        return;
      }
    }

    this._patchLiveValues();
  }

  getCardSize() {
    return 8;
  }

  connectedCallback() {
    this._startClock();
    window.addEventListener("location-changed", this._routeListener);
    window.addEventListener("popstate", this._routeListener);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    window.addEventListener("pageshow", this._onPageShow);
    window.addEventListener("pagehide", this._onPageHide);

    if (typeof IntersectionObserver !== "undefined") {
      this._intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries?.[0];
        this._isIntersecting = entry ? entry.isIntersecting : true;
        this._syncVideoPlayback();
      }, { threshold: 0.01 });
      this._intersectionObserver.observe(this);
    }

    this._render();
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    window.removeEventListener("location-changed", this._routeListener);
    window.removeEventListener("popstate", this._routeListener);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    window.removeEventListener("pageshow", this._onPageShow);
    window.removeEventListener("pagehide", this._onPageHide);
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;

    const video = this.shadowRoot?.querySelector(".bg-video");
    video?.pause?.();
  }

  _startClock() {
    clearInterval(this._timer);
    this._timer = setInterval(() => this._updateClockOnly(), 1000);
  }

  _updateClockOnly() {
    const t = this.shadowRoot?.querySelector("[data-halo-clock]");
    const d = this.shadowRoot?.querySelector("[data-halo-date]");
    if (t) t.textContent = this._clockText();
    if (d) d.textContent = this._dateText();
  }

  _patchLiveValues() {
    this._updateClockOnly();

    const weather = this._weatherState();
    if (weather) {
      const tempEl = this.shadowRoot?.querySelector("[data-halo-weather-temp]");
      const condEl = this.shadowRoot?.querySelector("[data-halo-weather-condition]");

      if (tempEl) {
        const temp = weather.attributes?.temperature;
        const unit = weather.attributes?.temperature_unit || "°C";
        tempEl.textContent = `${temp ?? "–"} ${unit}`;
      }
      if (condEl) condEl.textContent = weatherLabel(weather.state, (this._config.date?.locale && this._config.date.locale !== "auto") ? this._config.date.locale : (this._hass?.locale?.language || this._hass?.language || navigator.language || "en"));

      const iconEl = this.shadowRoot?.querySelector("[data-halo-weather-icon]");
      if (iconEl) iconEl.textContent = weatherEmoji(weather.state);
    }

    this.shadowRoot?.querySelectorAll("[data-halo-person-state]").forEach((el) => {
      const entity = el.getAttribute("data-halo-person-state");
      const state = this._hass?.states?.[entity];
      if (state) el.textContent = personStateLabel(state, this._hass);
    });

    this.shadowRoot?.querySelectorAll("[data-halo-person-image]").forEach((img) => {
      const entity = img.getAttribute("data-halo-person-image");
      const state = this._hass?.states?.[entity];
      if (!state) return;

      const isHome = ["home","zu hause","zuhause"].includes(
        String(state.state || "").toLowerCase()
      );

      const next = isHome
        ? img.getAttribute("data-home-image")
        : img.getAttribute("data-away-image");

      if (next && img.getAttribute("src") !== next) img.setAttribute("src", next);
    });
  }

  _clockText() {
    const now = new Date();
    const cfg = this._config.clock || {};
    const opts = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: cfg.format === "12h"
    };
    if (cfg.show_seconds) opts.second = "2-digit";
    return new Intl.DateTimeFormat(undefined, opts).format(now);
  }

  _dateText() {
    const cfg = this._config.date || {};
    try {
      const locale = cfg.locale && cfg.locale !== "auto" ? cfg.locale : (this._hass?.locale?.language || this._hass?.language || navigator.language || undefined);
      return new Intl.DateTimeFormat(locale, cfg.format || {}).format(new Date());
    } catch {
      return new Date().toLocaleDateString();
    }
  }

  _navigate(path) {
    if (!path) return;
    history.pushState(null, "", path);
    window.dispatchEvent(new Event("location-changed"));
  }

  _active(item) {
    if (!item?.path) return false;
    return window.location.pathname === item.path ||
      (item.match === "prefix" && window.location.pathname.startsWith(item.path));
  }

  _backgroundStyle() {
    const cfg = this._config;
    const bg = cfg.background || {};
    const app = cfg.appearance || {};
    const colors = app.background || ["#210443", "#8a2be2", "#ff8ad4"];
    const angle = Number(app.gradient_angle ?? 135);
    const opacity = Number(bg.opacity ?? 1);

    if (bg.type === "image" && bg.image) {
      return `background-image:linear-gradient(rgba(0,0,0,${1-opacity}),rgba(0,0,0,${1-opacity})),url("${bg.image}");background-size:cover;background-position:center;`;
    }

    if (bg.type === "glass") {
      const accent = app.accent || "#00b8e6";
      const mode = String(app.surface_style || "glass");
      const rawBlur = Math.max(0, Number(app.surface_blur ?? app.blur ?? 18));
      const blur = mode === "clear" || mode === "solid" ? 0 : rawBlur;
      const saturation = mode === "clear" || mode === "solid"
        ? 100
        : Math.max(80, Number(app.surface_saturation ?? 125));
      let surfaceOpacity = Math.max(0, Math.min(1, Number(app.surface_opacity ?? .34)));
      if (mode === "clear") surfaceOpacity *= .62;
      if (mode === "soft") surfaceOpacity = Math.min(.82, surfaceOpacity * 1.22);
      if (mode === "solid") surfaceOpacity = Math.max(.82, surfaceOpacity);
      const tint = app.surface_tint || "#14141a";
      const rgb = /^#([0-9a-f]{6})$/i.exec(String(tint));
      const tr = rgb ? parseInt(rgb[1].slice(0,2),16) : 20;
      const tg = rgb ? parseInt(rgb[1].slice(2,4),16) : 20;
      const tb = rgb ? parseInt(rgb[1].slice(4,6),16) : 26;
      const filter = blur > 0 ? `blur(${blur}px) saturate(${saturation}%)` : "none";
      return `background:
        radial-gradient(circle at 12% 8%, color-mix(in srgb, ${accent} 10%, transparent), transparent 30%),
        radial-gradient(circle at 94% 92%, color-mix(in srgb, ${colors[2] || accent} 8%, transparent), transparent 34%),
        linear-gradient(180deg, rgba(${tr},${tg},${tb},${Math.min(1,surfaceOpacity+.03)}), rgba(${tr},${tg},${tb},${surfaceOpacity}));
        -webkit-backdrop-filter:${filter};
        backdrop-filter:${filter};`;
    }

    if (bg.type === "video" && bg.video) {
      return `background:${haloGradientCss(app)};`;
    }

    if (this._weatherVideoMode()) {
      return `background:${haloGradientCss(app)};`;
    }

    return `background:${haloGradientCss(app)};`;
  }

  _weatherState() {
    let id = this._config.weather?.entity || this._config.background?.weather_entity;
    if (!id && this._hass?.states) {
      id = Object.keys(this._hass.states).find((entityId) => entityId.startsWith("weather."));
    }
    return id ? this._hass?.states?.[id] : null;
  }

  _weatherCondition() {
    const override = this._config.background?.weather_condition;
    return (
      override && override !== "auto"
        ? override
        : (this._weatherState()?.state || "")
    );
  }

  _weatherClass() {
    return `weather-${String(this._weatherCondition()).replace(/[^a-z0-9_-]/gi, "-")}`;
  }

  _weatherVideoSource() {
    const bg = this._config.background || {};
    const rawCondition = this._weatherCondition();

    const aliases = {
      exceptional: "cloudy",
      hail: "rainy",
      "snowy-rainy": "snowy",
      "windy-variant": "windy"
    };

    const condition = aliases[rawCondition] || rawCondition;
    const videos = bg.weather_videos || {};

    return String(
      videos?.[condition] ||
      videos?.[rawCondition] ||
      bg.weather_video_default ||
      ""
    ).trim();
  }

  _weatherVideoMode() {
    const bg = this._config.background || {};
    return bg.type === "weather-video" ||
      (bg.type === "weather" && bg.weather_mode === "video");
  }

  _videoBackgroundActive() {
    const bg = this._config.background || {};
    return (
      (bg.type === "video" && !!String(bg.video || "").trim()) ||
      (this._weatherVideoMode() && !!this._weatherVideoSource())
    );
  }

  _performanceProfile() {
    const requested = String(this._config.background?.performance_profile || "auto").toLowerCase();
    if (["high", "balanced", "eco"].includes(requested)) return requested;

    // Auto intentionally errs on the conservative side for wall tablets.
    try {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return "eco";
    } catch {}

    const cores = Number(navigator.hardwareConcurrency || 0);
    const memory = Number(navigator.deviceMemory || 0);
    let coarsePointer = false;
    try {
      coarsePointer = !!window.matchMedia?.("(pointer: coarse)")?.matches;
    } catch {}

    if ((cores && cores <= 2) || (memory && memory <= 2)) return "eco";
    if (
      coarsePointer ||
      window.innerWidth < 1400 ||
      (cores && cores <= 4) ||
      (memory && memory <= 4)
    ) {
      return "balanced";
    }
    return "high";
  }

  _shouldPauseVideo(forcePause = false) {
    if (forcePause) return true;
    const bg = this._config.background || {};
    const profile = this._performanceProfile();

    if (profile === "eco") return true;
    if (bg.pause_when_hidden !== false && document.visibilityState === "hidden") return true;
    if (bg.pause_when_offscreen !== false && this._isIntersecting === false) return true;
    return false;
  }

  _syncVideoPlayback(forcePause = false) {
    const video = this.shadowRoot?.querySelector(".bg-video");
    if (!video) return;

    const profile = this._performanceProfile();
    video.dataset.haloPerformance = profile;

    if (this._shouldPauseVideo(forcePause)) {
      // Eco mode keeps one decoded frame as a static background.
      if (profile === "eco" && video.readyState >= 1 && !video.dataset.haloEcoFrame) {
        video.dataset.haloEcoFrame = "1";
        try {
          if (video.currentTime < 0.03) video.currentTime = 0.05;
        } catch {}
      }
      video.pause?.();
      return;
    }

    video.playbackRate = 1;
    video.play?.().catch?.(() => {});
  }

  _weatherFxEnabled() {
    const bg = this._config.background || {};

    // Video performance mode intentionally prevents CSS weather animation
    // from running on top of an already animated video.
    if (
      this._videoBackgroundActive() &&
      bg.video_performance_mode !== false &&
      bg.video_allow_css_weather_fx !== true
    ) {
      return false;
    }

    return (
      bg.type === "weather" ||
      bg.weather_effects === true ||
      (this._weatherVideoMode() && bg.weather_video_fallback_css !== false)
    );
  }

  _renderWeatherFx() {
    if (!this._weatherFxEnabled()) return "";
    return `
      <div class="weather-fx" aria-hidden="true">
        <span class="fx-sun"></span>
        <span class="fx-stars"></span>
        <span class="fx-cloud fx-cloud-1"></span>
        <span class="fx-cloud fx-cloud-2"></span>
        <span class="fx-rain"></span>
        <span class="fx-snow"></span>
        <span class="fx-fog fx-fog-1"></span>
        <span class="fx-fog fx-fog-2"></span>
        <span class="fx-flash"></span>
      </div>
    `;
  }

  _renderNavigation() {
    const cfg = this._config.navigation || {};
    const preset = this._config.layout?.preset || "dashboard";
    const items = cfg.items || [];
    const requestedStyle = String(cfg.style || "auto");
    const navStyle = requestedStyle === "auto"
      ? (PRESETS[preset]?.navStyle || "list")
      : requestedStyle;

    return `
      <nav class="nav nav-${esc(navStyle)}">
        ${items.map((item, i) => {
          const active = this._active(item);
          const badgeState = item.badge?.entity ? this._hass?.states?.[item.badge.entity] : null;
          let badge = "";
          if (badgeState) {
            const value = item.badge.attribute
              ? badgeState.attributes?.[item.badge.attribute]
              : badgeState.state;
            if (value !== undefined && value !== null && value !== "" && value !== "0" && value !== "off") {
              badge = `<span class="badge">${esc(value)}</span>`;
            }
          }

          return `
            <button class="nav-item ${active ? "active" : ""}" data-nav="${i}" title="${esc(item.name || "")}">
              <ha-icon icon="${esc(item.icon || "mdi:circle-small")}"></ha-icon>
              ${cfg.show_labels !== false ? `<span class="nav-label">${esc(item.name || "")}</span>` : ""}
              ${badge}
            </button>
          `;
        }).join("")}
      </nav>
    `;
  }

  _renderWeather() {
    const cfg = this._config.weather || {};
    if (!cfg.enabled) return "";
    const state = this._weatherState();
    if (!state) return `<section class="weather panel"><div>Wetter nicht verfügbar</div></section>`;

    const temp = state.attributes?.temperature;
    const unit = state.attributes?.temperature_unit || "°C";
    return `
      <section class="weather panel">
        <div class="weather-icon" data-halo-weather-icon>${weatherEmoji(state.state)}</div>
        <div class="weather-main">
          ${cfg.show_temperature !== false ? `<div class="weather-temp" data-halo-weather-temp>${esc(temp ?? "–")} ${esc(unit)}</div>` : ""}
          ${cfg.show_condition !== false ? `<div class="weather-condition" data-halo-weather-condition>${esc(weatherLabel(state.state, (this._config.date?.locale && this._config.date.locale !== "auto") ? this._config.date.locale : (this._hass?.locale?.language || this._hass?.language || navigator.language || "en")))}</div>` : ""}
        </div>
      </section>
    `;
  }

  _renderPresence() {
    const cfg = this._config.presence || {};
    if (!cfg.enabled) return "";
    const entities = cfg.entities || [];
    return `
      <section class="presence">
        ${entities.map((p) => {
          const s = this._hass?.states?.[p.entity];
          const isHome = ["home", "zu hause", "zuhause"].includes(String(s?.state || "").toLowerCase());
          const configuredImage = isHome ? p.home_image : (p.away_image || p.home_image);
          const image = configuredImage || s?.attributes?.entity_picture || "";
          const configuredName = String(p.name || "").trim();
          const name = (!configuredName || configuredName.toLowerCase() === "person")
            ? (s?.attributes?.friendly_name || p.entity || "Person")
            : configuredName;
          let status = personStateLabel(s, this._hass);
          if (String(status || "").trim().toLowerCase() === String(name || "").trim().toLowerCase()) {
            status = isHome ? "Zuhause" : "Unterwegs";
          }
          const showStatus = cfg.show_status !== false;
          const showStatusIcon = cfg.show_status_icon !== false;
          const rawState = String(s?.state || "").toLowerCase();
          const statusIcon = isHome ? "mdi:home" : (["unknown","unavailable",""] .includes(rawState) ? "mdi:help-circle-outline" : (rawState === "not_home" ? "mdi:account-arrow-right" : "mdi:map-marker"));
          return `
            <div class="person panel ${isHome ? "is-home" : "is-away"}" data-person-entity="${esc(p.entity || "")}" data-person-clickable="${cfg.click_more_info !== false ? "true" : "false"}" tabindex="${cfg.click_more_info !== false ? "0" : "-1"}" role="${cfg.click_more_info !== false ? "button" : "group"}">
              <div class="person-media">
                ${image ? `<img data-halo-person-image="${esc(p.entity || "")}" data-home-image="${esc(p.home_image || image || "")}" data-away-image="${esc(p.away_image || p.home_image || image || "")}" src="${esc(image)}" alt="${esc(name)}">` : `<div class="person-avatar"><ha-icon icon="mdi:account-circle"></ha-icon></div>`}
                <span class="person-dot" aria-hidden="true"></span>
              </div>
              <div class="person-copy">
                <div class="person-name">${esc(name)}</div>
                ${showStatus ? `<div class="person-state" data-halo-person-state="${esc(p.entity || "")}">${showStatusIcon ? `<ha-icon icon="${statusIcon}"></ha-icon>` : ""}<span>${esc(status)}</span></div>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </section>
    `;
  }

  _renderVideoBackground() {
    const bg = this._config.background || {};

    let source = "";
    let weatherVideo = false;

    if (bg.type === "video") {
      source = String(bg.video || "").trim();
    } else if (this._weatherVideoMode()) {
      source = this._weatherVideoSource();
      weatherVideo = true;
    }

    if (!source) return "";

    const opacity = Math.max(
      0,
      Math.min(
        1,
        Number(
          weatherVideo
            ? (bg.weather_video_opacity ?? 0.82)
            : (bg.opacity ?? 1)
        )
      )
    );

    const overlay = Math.max(
      0,
      Math.min(
        0.9,
        Number(weatherVideo ? (bg.weather_video_overlay ?? 0.18) : 0)
      )
    );

    const fit = ["cover", "contain", "fill"].includes(bg.weather_video_fit)
      ? bg.weather_video_fit
      : "cover";

    const profile = this._performanceProfile();
    const preload = profile === "balanced" ? "metadata" : "auto";
    const autoplay = profile === "eco" ? "" : " autoplay";

    return `
      <video
        class="bg-video"
        data-halo-video-source="${esc(source)}"
        data-halo-performance="${esc(profile)}"${autoplay}
        muted
        loop
        playsinline
        preload="${preload}"
        src="${esc(source)}"
        style="opacity:${opacity};object-fit:${fit};"
      ></video>
      ${overlay > 0 ? `<div class="bg-video-overlay" style="background:rgba(0,0,0,${overlay})"></div>` : ""}
    `;
  }

  _captureVideoState() {
    const video = this.shadowRoot?.querySelector(".bg-video");
    if (!video) {
      this._videoResumeState = null;
      return;
    }

    const source = video.getAttribute("data-halo-video-source") || video.currentSrc || "";
    this._videoResumeState = {
      source,
      currentTime: Number.isFinite(video.currentTime) ? video.currentTime : 0,
      paused: video.paused
    };
  }

  _wireVideoBackground() {
    const video = this.shadowRoot?.querySelector(".bg-video");
    const halo = this.shadowRoot?.querySelector(".halo");
    if (!video || !halo) return;

    const source = video.getAttribute("data-halo-video-source") || "";

    const resume = this._videoResumeState;
    const restore = () => {
      if (resume && resume.source === source && resume.currentTime > 0) {
        try {
          if (Math.abs(video.currentTime - resume.currentTime) > 0.75) {
            video.currentTime = resume.currentTime;
          }
        } catch {}
      }
      this._syncVideoPlayback();
    };

    video.addEventListener("loadedmetadata", restore, { once: true });
    video.addEventListener("canplay", () => {
      halo.classList.remove("halo-video-error");
      this._syncVideoPlayback();
    }, { once: true });

    video.addEventListener("error", () => {
      const bg = this._config.background || {};
      const fallback = String(
        bg.weather_video_default ||
        bg.weather_videos?.cloudy ||
        ""
      ).trim();

      if (
        this._weatherVideoMode() &&
        fallback &&
        fallback !== source &&
        !video.dataset.haloFallbackTried
      ) {
        video.dataset.haloFallbackTried = "1";
        video.setAttribute("data-halo-video-source", fallback);
        video.src = fallback;
        video.load?.();
        this._syncVideoPlayback();
        return;
      }

      halo.classList.add("halo-video-error");
      console.warn(
        "[Halo Sidebar] Video konnte nicht geladen werden:",
        source
      );
    });

    // Cached videos can already be ready before the listeners were attached.
    if (video.readyState >= 1) restore();
  }

  _render() {
    if (!this.shadowRoot) return;
    this._captureVideoState();
    const c = this._config;
    const presetName = c.layout?.preset || "dashboard";
    const preset = PRESETS[presetName] || PRESETS.dashboard;
    const app = c.appearance || {};
    const fixed = !!c.layout?.fixed;
    const _g = Array.isArray(app.background) && app.background.length ? app.background : ["#210443","#8a2be2","#ff8ad4"];
    const _g1 = _g[0] || "#210443";
    const _g2 = _g[1] || _g1;
    const _g3 = _g[2] || _g2;
    const _gAngle = Number(app.gradient_angle ?? 135);
    const _gradient = haloGradient(app);
    const _gradientCss = haloGradientCss(app);
    const _gradientRad = _gradient.angle * Math.PI / 180;
    const _gradientDx = (Math.sin(_gradientRad) * 7).toFixed(2);
    const _gradientDy = (-Math.cos(_gradientRad) * 7).toFixed(2);
    const _animatedGradient = ["animated-gradient","weather"].includes(c.background?.type) && !this._videoBackgroundActive();
    const _surfaceMode = String(app.surface_style || "glass");
    let _surfaceOpacity = Math.max(0, Math.min(1, Number(app.surface_opacity ?? .34)));
    let _surfaceBlur = Math.max(0, Number(app.surface_blur ?? app.blur ?? 18));
    let _surfaceSaturation = Math.max(80, Number(app.surface_saturation ?? 125));
    let _surfaceShadowStrength = Math.max(0, Math.min(.8, Number(app.surface_shadow_strength ?? .28)));
    if (_surfaceMode === "clear") { _surfaceOpacity *= .62; _surfaceBlur = 0; _surfaceSaturation = 100; _surfaceShadowStrength *= .72; }
    else if (_surfaceMode === "soft") { _surfaceOpacity = Math.min(.82, _surfaceOpacity * 1.22); _surfaceBlur = Math.max(8, _surfaceBlur - 2); _surfaceSaturation = Math.max(100, _surfaceSaturation - 8); }
    else if (_surfaceMode === "solid") { _surfaceOpacity = Math.max(.82, _surfaceOpacity); _surfaceBlur = 0; _surfaceSaturation = 100; }
    const _surfaceTint = app.surface_tint || "#14141a";
    const _surfaceTintMatch = /^#([0-9a-f]{6})$/i.exec(String(_surfaceTint));
    const _surfaceRgb = _surfaceTintMatch ? [0,2,4].map(i=>parseInt(_surfaceTintMatch[1].slice(i,i+2),16)) : [20,20,26];
    const _surfaceBorderColor = app.surface_border_color || "#ffffff";
    const _surfaceBorderMatch = /^#([0-9a-f]{6})$/i.exec(String(_surfaceBorderColor));
    const _surfaceBorderRgb = _surfaceBorderMatch ? [0,2,4].map(i=>parseInt(_surfaceBorderMatch[1].slice(i,i+2),16)) : [255,255,255];
    const _surfaceBorderOpacity = Math.max(0, Math.min(1, Number(app.surface_border_opacity ?? .14)));
    const _surfaceBorderWidth = Math.max(0, Number(app.surface_border_width ?? 1));
    const _surfaceHighlight = Math.max(0, Math.min(.24, Number(app.surface_highlight_opacity ?? .08)));
    const _surfaceShadowBlur = Math.max(0, Number(app.surface_shadow_blur ?? 26));
    const _surfaceBg = `linear-gradient(145deg,rgba(255,255,255,${_surfaceHighlight}) 0%,rgba(255,255,255,0) 42%),rgba(${_surfaceRgb.join(",")},${_surfaceOpacity})`;
    const _surfaceBorder = `rgba(${_surfaceBorderRgb.join(",")},${_surfaceBorderOpacity})`;
    const _surfaceFilter = _surfaceBlur > 0 ? `blur(${_surfaceBlur}px) saturate(${_surfaceSaturation}%)` : "none";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display:block;
          width:100%;
          height:100%;
          min-height:420px;
          box-sizing:border-box;
          --halo-accent:${app.accent || "#00b8e6"};
          --halo-text:${app.text_color || "#fff"};
          --halo-secondary:${app.secondary_text_color || "rgba(255,255,255,.58)"};
          --halo-radius:${Number(app.radius ?? 0)}px;
          color:var(--halo-text);
        }

        .halo {
          position:${fixed ? "fixed" : "relative"};
          ${fixed ? `${c.layout?.position === "right" ? "right" : "left"}:0;top:0;bottom:0;z-index:4;` : ""}
          width:100%;
          max-width:100%;
          min-height:100%;
          box-sizing:border-box;
          padding:${c.layout?.padding || "18px"};
          display:flex;
          flex-direction:column;
          gap:${c.layout?.gap || "14px"};
          overflow:hidden;
          border-radius:var(--halo-radius);
          ${this._backgroundStyle()}
          background-size:100% 100%;
          animation:none;
          isolation:isolate;
          --halo-fx-opacity:${Math.max(0, Math.min(1, Number(c.background?.effect_intensity ?? .55)))};
          --halo-fx-speed:${Math.max(.2, Number(c.background?.effect_speed ?? 1))};
        }

        .halo::before {
          content:"";
          position:absolute;
          inset:${_gradient.type === "radial" ? "-24%" : "-14%"};
          z-index:-2;
          pointer-events:none;
          display:${_animatedGradient ? "block" : "none"};
          background:${_gradientCss};
          transform-origin:${_gradient.center_x}% ${_gradient.center_y}%;
          --halo-gx:${_gradientDx}%;--halo-gy:${_gradientDy}%;
          animation:${_animatedGradient ? (_gradient.type === "conic" ? `haloGradientSpin ${Number(app.animation_speed ?? 30)}s linear infinite` : _gradient.type === "radial" ? `haloGradientDrift ${Number(app.animation_speed ?? 30)}s ease-in-out infinite` : `haloGradientLinear ${Number(app.animation_speed ?? 30)}s ease-in-out infinite`) : "none"};
          will-change:transform;
        }

        .halo.halo-video-active::before { display:none !important; }

        .halo::after {
          content:"";
          position:absolute;
          inset:0;
          z-index:-1;
          pointer-events:none;
          background:
            radial-gradient(circle at 75% 18%, rgba(255,255,255,.10), transparent 22%),
            radial-gradient(circle at 25% 80%, rgba(0,184,230,.08), transparent 26%);
        }

        .bg-video {
          position:absolute;
          inset:0;
          width:100%;
          height:100%;
          object-fit:cover;
          z-index:-3;
          background:transparent;

          /* Keep the video on its own compositor layer. */
          transform:translateZ(0);
          backface-visibility:hidden;
          will-change:auto;
        }

        .halo.halo-video-active[data-video-performance="true"] {
          /* No animated gradient / extra filter animation behind video. */
          animation:none !important;
        }

        .halo.halo-video-active[data-video-performance="true"] .weather-fx {
          display:none !important;
        }

        .halo[data-performance-profile="balanced"].halo-video-active .panel {
          -webkit-backdrop-filter:none;
          backdrop-filter:none;
        }

        .halo[data-performance-profile="eco"].halo-video-active .panel {
          -webkit-backdrop-filter:none;
          backdrop-filter:none;
        }

        .bg-video-overlay {
          position:absolute;
          inset:0;
          z-index:-2;
          pointer-events:none;
        }

        .halo.halo-video-error .bg-video {
          display:none;
        }

        .panel {
          background:${app.glass !== false ? _surfaceBg : "transparent"};
          border:${_surfaceBorderWidth}px solid ${app.glass !== false ? _surfaceBorder : "transparent"};
          box-shadow:${app.glass !== false ? `0 10px ${_surfaceShadowBlur}px rgba(0,0,0,${_surfaceShadowStrength}), inset 0 1px 0 rgba(255,255,255,${Math.min(.18,_surfaceHighlight*.85)})` : "none"};
          -webkit-backdrop-filter:${app.glass !== false ? _surfaceFilter : "none"};
          backdrop-filter:${app.glass !== false ? _surfaceFilter : "none"};
          border-radius:var(--halo-radius);
        }
        .halo[data-bg-type="glass"] {
          border-right:${_surfaceBorderWidth}px solid ${_surfaceBorder};
          box-shadow:inset -1px 0 0 rgba(255,255,255,${Math.min(.08,_surfaceHighlight*.4)}), 10px 0 ${Math.max(18,_surfaceShadowBlur)}px rgba(0,0,0,${Math.min(.24,_surfaceShadowStrength*.55)});
        }
        .halo[data-bg-type="glass"] .panel {
          background:${app.glass !== false ? _surfaceBg : "transparent"};
          border-color:${app.glass !== false ? _surfaceBorder : "transparent"};
        }

        .clock {
          padding:8px 8px 0;
          text-align:center;
        }
        .clock-time {
          font-size:${preset.clockSize};
          font-weight:200;
          line-height:1;
          letter-spacing:-.055em;
        }
        .clock-date {
          margin-top:8px;
          color:var(--halo-secondary);
          font-size:clamp(13px,1.1vw,18px);
          font-weight:300;
        }

        .weather {
          min-height:${preset.weatherLarge ? "96px" : "74px"};
          display:flex;
          align-items:center;
          justify-content:flex-start;
          gap:16px;
          padding:16px 18px;
        }
        .weather-icon { font-size:${preset.weatherLarge ? "42px" : "34px"}; filter:drop-shadow(0 4px 12px rgba(0,0,0,.18)); }
        .weather-temp { font-size:${preset.weatherLarge ? "28px" : "23px"}; font-weight:500; letter-spacing:-.03em; }
        .weather-condition { color:var(--halo-secondary); font-size:13px; margin-top:3px; }

        .nav {
          display:grid;
          gap:7px;
        }
        .nav-icons { grid-template-columns:repeat(5,1fr); }
        .nav-icons-only { grid-template-columns:1fr; width:58px; margin:auto; }
        .nav-list { grid-template-columns:1fr; }
        .nav-cards { grid-template-columns:1fr; }
        .nav-floating { grid-template-columns:repeat(4,1fr); }

        .nav-item {
          position:relative;
          min-height:46px;
          border:1px solid transparent;
          color:var(--halo-text);
          background:transparent;
          border-radius:14px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          padding:9px 11px;
          transition:transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease;
        }
        .nav-item:hover { background:rgba(255,255,255,.095); transform:translateY(-1px); }
        .nav-item ha-icon { transition:transform .18s ease,color .18s ease; flex:0 0 auto; }
        .nav-item:hover ha-icon { transform:scale(1.08); }
        .nav-item.active {
          background:linear-gradient(90deg,color-mix(in srgb,var(--halo-accent) 20%,rgba(255,255,255,.10)),rgba(255,255,255,.08));
          border-color:color-mix(in srgb,var(--halo-accent) 36%,rgba(255,255,255,.10));
          box-shadow:0 8px 24px rgba(0,0,0,.12), inset 3px 0 0 var(--halo-accent);
          color:white;
        }
        .nav-item.active ha-icon { color:var(--halo-accent); }
        .nav-label { overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600; }
        .nav-icons .nav-label, .nav-icons-only .nav-label { display:none; }
        .nav-list .nav-item, .nav-cards .nav-item { justify-content:flex-start; }
        .nav-list .nav-item { min-height:44px; }
        .nav-cards .nav-item { background:rgba(255,255,255,.065); border-color:rgba(255,255,255,.06); }
        .nav-cards .nav-item.active { background:linear-gradient(90deg,color-mix(in srgb,var(--halo-accent) 22%,rgba(255,255,255,.11)),rgba(255,255,255,.08)); }
        .badge {
          position:absolute;
          top:4px;
          right:5px;
          min-width:18px;
          height:18px;
          padding:0 5px;
          border-radius:999px;
          background:#ff9800;
          color:#111;
          font-size:10px;
          font-weight:800;
          display:grid;
          place-items:center;
        }

        .presence {
          margin-top:auto;
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(112px,1fr));
          gap:10px;
        }
        .halo[data-presence-layout="compact"] .presence { grid-template-columns:1fr; }
        .halo[data-presence-layout="compact"] .person { display:flex; align-items:center; text-align:left; padding:9px 10px; gap:10px; }
        .halo[data-presence-layout="compact"] .person-media { width:44px; height:44px; margin:0; flex:0 0 44px; }
        .halo[data-presence-layout="compact"] .person-copy { margin-top:0; min-width:0; }
        .halo[data-presence-layout="avatars"] .person { background:transparent!important; border-color:transparent!important; box-shadow:none!important; padding:8px 4px; }
        .halo[data-presence-layout="avatars"] .person-media { width:66px; height:66px; }
        .person[data-person-clickable="true"] { cursor:pointer; }
        .person[data-person-clickable="true"]:focus-visible { outline:2px solid var(--halo-accent); outline-offset:2px; }
        .person {
          text-align:center;
          padding:12px 9px 11px;
          overflow:hidden;
          position:relative;
          transition:transform .18s ease, background .18s ease, border-color .18s ease;
        }
        .person:hover { transform:translateY(-2px); background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.14); }
        .person-media {
          width:${preset.presenceLarge ? "86px" : "58px"};
          height:${preset.presenceLarge ? "86px" : "58px"};
          margin:0 auto;
          position:relative;
        }
        .person-dot {
          position:absolute; right:-2px; top:-2px; width:10px; height:10px; border-radius:50%;
          background:rgba(255,255,255,.34); border:2px solid rgba(22,22,28,.58);
          box-shadow:0 0 0 1px rgba(255,255,255,.06);
        }
        .person.is-home .person-dot { background:#55e28a; box-shadow:0 0 12px rgba(85,226,138,.58),0 0 0 1px rgba(255,255,255,.08); }
        .person-avatar { width:100%; height:100%; margin:0; display:grid; place-items:center; border-radius:20px; background:rgba(255,255,255,.08); }
        .person-avatar ha-icon { width:60%; height:60%; color:var(--halo-text); }
        .person img {
          width:100%;
          height:100%;
          object-fit:cover;
          border-radius:20px;
          box-shadow:0 7px 18px rgba(0,0,0,.15);
        }
        .person-copy { min-width:0; margin-top:7px; }
        .person-name { font-weight:750; line-height:1.15; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .person-state { color:var(--halo-secondary); font-size:11px; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; justify-content:center; gap:4px; }
        .person-state ha-icon { width:13px; height:13px; flex:0 0 auto; }
        .halo[data-presence-layout="compact"] .person-state { justify-content:flex-start; }
        .person.is-home .person-state { color:color-mix(in srgb,#55e28a 76%,white); }
        .person.is-away .person-state ha-icon { color:color-mix(in srgb,var(--halo-accent) 70%,white); }

        .version {
          position:absolute;
          right:8px;
          bottom:6px;
          font-size:9px;
          opacity:.38;
        }

        @keyframes haloGradientLinear{0%,100%{transform:scale(1.12) translate3d(calc(var(--halo-gx) * -1),calc(var(--halo-gy) * -1),0)}50%{transform:scale(1.12) translate3d(var(--halo-gx),var(--halo-gy),0)}}
        @keyframes haloGradientDrift{0%,100%{transform:scale(1.20) translate3d(-7%,-5%,0)}20%{transform:scale(1.30) translate3d(6%,-8%,0)}45%{transform:scale(1.17) translate3d(9%,5%,0)}70%{transform:scale(1.27) translate3d(-4%,9%,0)}85%{transform:scale(1.22) translate3d(-9%,2%,0)}}
        @keyframes haloGradientSpin{from{transform:scale(1.22) rotate(0deg)}to{transform:scale(1.22) rotate(360deg)}}

        /* Halo Background Engine v1 */
        .weather-fx {
          position:absolute;
          inset:0;
          z-index:-1;
          overflow:hidden;
          pointer-events:none;
          opacity:var(--halo-fx-opacity);
        }

        .weather-fx > span {
          position:absolute;
          display:none;
          pointer-events:none;
        }

        /* Sunny */
        .weather-sunny .fx-sun {
          display:block;
          width:210px;
          height:210px;
          right:-64px;
          top:-54px;
          border-radius:50%;
          background:
            radial-gradient(circle,
              rgba(255,244,166,.88) 0 10%,
              rgba(255,204,77,.44) 28%,
              rgba(255,174,0,.16) 48%,
              transparent 72%);
          filter:blur(1px);
          animation:haloSunPulse calc(7s / var(--halo-fx-speed)) ease-in-out infinite;
        }

        /* Stars / night */
        .weather-clear-night .fx-stars {
          display:block;
          inset:-20%;
          background-image:
            radial-gradient(circle at 15% 22%, rgba(255,255,255,.9) 0 1px, transparent 1.5px),
            radial-gradient(circle at 64% 31%, rgba(255,255,255,.75) 0 1px, transparent 1.4px),
            radial-gradient(circle at 37% 72%, rgba(255,255,255,.8) 0 1.2px, transparent 1.7px),
            radial-gradient(circle at 82% 68%, rgba(255,255,255,.7) 0 1px, transparent 1.5px);
          background-size:92px 92px, 125px 125px, 148px 148px, 176px 176px;
          animation:haloStars calc(32s / var(--halo-fx-speed)) linear infinite;
        }

        /* Clouds */
        .weather-cloudy .fx-cloud,
        .weather-partlycloudy .fx-cloud,
        .weather-windy .fx-cloud,
        .weather-rainy .fx-cloud,
        .weather-pouring .fx-cloud,
        .weather-lightning .fx-cloud,
        .weather-lightning-rainy .fx-cloud,
        .weather-snowy .fx-cloud {
          display:block;
          width:170px;
          height:58px;
          border-radius:999px;
          background:rgba(255,255,255,.18);
          filter:blur(8px);
        }
        .fx-cloud::before,
        .fx-cloud::after {
          content:"";
          position:absolute;
          border-radius:50%;
          background:inherit;
        }
        .fx-cloud::before { width:76px;height:76px;left:25px;top:-28px; }
        .fx-cloud::after  { width:98px;height:98px;right:22px;top:-42px; }

        .fx-cloud-1 {
          top:17%;
          left:-190px;
          animation:haloCloudA calc(24s / var(--halo-fx-speed)) linear infinite;
        }
        .fx-cloud-2 {
          top:42%;
          left:-230px;
          transform:scale(.78);
          opacity:.58;
          animation:haloCloudB calc(33s / var(--halo-fx-speed)) linear infinite;
          animation-delay:-11s;
        }

        /* Rain */
        .weather-rainy .fx-rain,
        .weather-pouring .fx-rain,
        .weather-lightning-rainy .fx-rain {
          display:block;
          inset:-30%;
          background-image:
            repeating-linear-gradient(
              108deg,
              transparent 0 15px,
              rgba(220,240,255,.68) 16px 17px,
              transparent 18px 34px
            );
          background-size:42px 58px;
          --halo-rain-x:-42px;
          --halo-rain-y:116px;
          opacity:.55;
          animation:haloRain calc(.65s / var(--halo-fx-speed)) linear infinite;
        }
        .weather-pouring .fx-rain {
          opacity:.82;
          background-size:31px 46px;
          --halo-rain-x:-31px;
          --halo-rain-y:92px;
        }

        /* Snow */
        .weather-snowy .fx-snow {
          display:block;
          inset:-15%;
          background-image:
            radial-gradient(circle, rgba(255,255,255,.92) 0 2px, transparent 2.8px),
            radial-gradient(circle, rgba(255,255,255,.7) 0 1.5px, transparent 2.3px),
            radial-gradient(circle, rgba(255,255,255,.78) 0 1px, transparent 1.8px);
          background-size:46px 46px, 67px 67px, 89px 89px;
          background-position:0 0, 22px 12px, 9px 31px;
          animation:haloSnow calc(9s / var(--halo-fx-speed)) linear infinite;
        }

        /* Fog */
        .weather-fog .fx-fog,
        .weather-windy .fx-fog {
          display:block;
          width:145%;
          height:100px;
          left:-22%;
          border-radius:50%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),rgba(255,255,255,.28),transparent);
          filter:blur(16px);
        }
        .fx-fog-1 {
          top:31%;
          animation:haloFog calc(14s / var(--halo-fx-speed)) ease-in-out infinite alternate;
        }
        .fx-fog-2 {
          top:58%;
          opacity:.55;
          animation:haloFog calc(19s / var(--halo-fx-speed)) ease-in-out infinite alternate-reverse;
        }

        /* Lightning */
        .weather-lightning .fx-flash,
        .weather-lightning-rainy .fx-flash {
          display:block;
          inset:0;
          background:rgba(255,255,255,.88);
          opacity:0;
          animation:haloLightning calc(7s / var(--halo-fx-speed)) linear infinite;
        }

        @keyframes haloSunPulse {
          0%,100% { transform:scale(.92); opacity:.7; }
          50% { transform:scale(1.08); opacity:1; }
        }
        @keyframes haloCloudA {
          from { transform:translateX(0) scale(1); }
          to { transform:translateX(560px) scale(1); }
        }
        @keyframes haloCloudB {
          from { transform:translateX(0) scale(.78); }
          to { transform:translateX(620px) scale(.78); }
        }
        @keyframes haloRain {
          to { background-position:var(--halo-rain-x,-42px) var(--halo-rain-y,116px); }
        }
        @keyframes haloSnow {
          to { background-position:46px 184px, -45px 146px, 98px 209px; }
        }
        @keyframes haloFog {
          from { transform:translateX(-6%); }
          to { transform:translateX(8%); }
        }
        @keyframes haloStars {
          to { background-position:92px 92px, -125px 125px, 148px 148px, -176px 176px; }
        }
        @keyframes haloLightning {
          0%, 88%, 92%, 96%, 100% { opacity:0; }
          89% { opacity:.62; }
          90% { opacity:.08; }
          93% { opacity:.38; }
          94% { opacity:0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .halo[data-reduce-motion="true"] .weather-fx > span {
            animation:none !important;
          }
          .halo[data-reduce-motion="true"] {
            animation:none !important;
          }
        }

        @media (max-width: 900px) {
          .halo { width:100%; min-height:auto; }
        }
      </style>

      <aside
        class="halo ${esc(presetName)} ${this._weatherClass()} ${this._videoBackgroundActive() ? "halo-video-active" : ""}"
        data-bg-type="${esc(c.background?.type || "animated-gradient")}"
        data-reduce-motion="${c.background?.reduce_motion !== false ? "true" : "false"}"
        data-video-performance="${c.background?.video_performance_mode !== false ? "true" : "false"}"
        data-performance-profile="${esc(this._performanceProfile())}"
        data-presence-layout="${esc(c.presence?.layout || "cards")}"
      >
        ${this._renderVideoBackground()}
        ${this._renderWeatherFx()}
        ${c.clock?.enabled !== false ? `
          <header class="clock">
            <div class="clock-time" data-halo-clock>${esc(this._clockText())}</div>
            ${c.date?.enabled !== false ? `<div class="clock-date" data-halo-date>${esc(this._dateText())}</div>` : ""}
          </header>
        ` : ""}
        ${this._renderWeather()}
        ${this._renderNavigation()}
        ${this._renderPresence()}
        ${c.debug?.show_version ? `<div class="version">Halo Sidebar v${HALO_VERSION} · ${esc(this._performanceProfile())}</div>` : ""}
      </aside>
    `;

    localizeHaloDom(this.shadowRoot, this._hass);

    this.shadowRoot.querySelectorAll("[data-nav]").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-nav"));
        this._navigate(this._config.navigation?.items?.[idx]?.path);
      });
    });

    const openPerson = (el) => {
      if (el?.getAttribute("data-person-clickable") !== "true") return;
      const entityId = el.getAttribute("data-person-entity");
      if (!entityId) return;
      const ev = new CustomEvent("hass-more-info", { bubbles:true, composed:true, detail:{ entityId } });
      this.dispatchEvent(ev);
    };
    this.shadowRoot.querySelectorAll("[data-person-entity]").forEach((el) => {
      el.addEventListener("click", () => openPerson(el));
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openPerson(el); }
      });
    });

    this._wireVideoBackground();
  }
}

class HaloSidebarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = deepMerge(DEFAULTS, config || {});
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _emit(next) {
    this._config = next;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: next },
      bubbles: true,
      composed: true
    }));
  }

  _update(path, value) {
    const next = structuredClone(this._config);
    let obj = next;
    const keys = path.split(".");
    while (keys.length > 1) {
      const k = keys.shift();
      obj[k] ??= {};
      obj = obj[k];
    }
    obj[keys[0]] = value;
    this._emit(next);
  }

  _render() {
    const c = this._config;
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;padding:12px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        label{display:grid;gap:5px;font-size:12px;color:var(--secondary-text-color)}
        select,input{padding:9px;border-radius:8px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color)}
        h3{margin:10px 0 2px}
        .full{grid-column:1/-1}
      </style>
      <h3>Halo Sidebar</h3>
      <div class="grid">
        <label>
          Layout
          <select data-path="layout.preset">
            ${["dashboard","classic","compact","glass","floating"].map(v => `<option value="${v}" ${c.layout?.preset===v?"selected":""}>${v}</option>`).join("")}
          </select>
        </label>
        <label>
          Breite
          <input data-path="layout.width" value="${esc(c.layout?.width || "320px")}">
        </label>
        <label>
          Hintergrund
          <select data-path="background.type">
            ${["animated-gradient","gradient","image","video","weather"].map(v => `<option value="${v}" ${c.background?.type===v?"selected":""}>${v}</option>`).join("")}
          </select>
        </label>
        <label>
          Akzentfarbe
          <input data-path="appearance.accent" type="color" value="${esc(c.appearance?.accent || "#00b8e6")}">
        </label>
        <label class="full">
          Wetter-Entity
          <input data-path="weather.entity" value="${esc(c.weather?.entity || "")}" placeholder="weather.forecast_home">
        </label>
        <label>
          Wetter anzeigen
          <select data-path="weather.enabled">
            <option value="true" ${c.weather?.enabled===true?"selected":""}>Ja</option>
            <option value="false" ${c.weather?.enabled!==true?"selected":""}>Nein</option>
          </select>
        </label>
        <label>
          Version anzeigen
          <select data-path="debug.show_version">
            <option value="true" ${c.debug?.show_version===true?"selected":""}>Ja</option>
            <option value="false" ${c.debug?.show_version!==true?"selected":""}>Nein</option>
          </select>
        </label>
      </div>
    `;

    this.shadowRoot.querySelectorAll("[data-path]").forEach((el) => {
      el.addEventListener("change", () => {
        let value = el.value;
        if (value === "true") value = true;
        if (value === "false") value = false;
        this._update(el.getAttribute("data-path"), value);
      });
    });
  }
}

if (!customElements.get("halo-sidebar")) customElements.define("halo-sidebar", HaloSidebar);
if (!customElements.get("halo-sidebar-editor")) customElements.define("halo-sidebar-editor", HaloSidebarEditor);

// Legacy/internal Halo elements remain registered for backwards compatibility,
// but are intentionally NOT exposed as separate cards in Home Assistant's card picker.


console.info(
  `%c HALO SIDEBAR %c v${HALO_VERSION} `,
  "background:#8a2be2;color:white;font-weight:bold;padding:4px 7px;border-radius:6px 0 0 6px",
  "background:#210443;color:#ff8ad4;font-weight:bold;padding:4px 7px;border-radius:0 6px 6px 0"
);


// ---------------------------------------------------------------------------
// Halo Layout: a true two-column Lovelace content layout.
// Place one custom:halo-layout as the ONLY card in a panel view.
// This does not attempt to modify Home Assistant's native navigation drawer.
// The whole view opts into the sidebar simply by using this layout card.
// ---------------------------------------------------------------------------
const HALO_LAYOUT_DEFAULTS = {
  type: "custom:halo-layout",
  sidebar: {},
  layout: {
    width: "320px",
    position: "left",
    gap: "0px",
    min_height: "calc(100dvh - 56px)",
    mobile_breakpoint: 800,
    mobile_mode: "top",
    content_padding: "24px",
    content_background: "transparent",
    content_columns: 1
  },
  cards: []
};

function haloCssLength(value, fallback) {
  const v = String(value ?? fallback).trim();
  return /^(?:\d+(?:\.\d+)?(?:px|rem|em|vw|vh|dvh|%)|calc\([\w\d.\s%+*\-/()]+\)|auto)$/.test(v)
    ? v : fallback;
}

class HaloLayout extends HTMLElement {
  static getConfigElement() {
    return document.createElement("halo-layout-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:halo-layout",
      layout: {
        width: "320px",
        position: "left",
        mobile_mode: "top",
        content_padding: "24px"
      },
      sidebar: {
        layout: { preset: "dashboard" },
        appearance: { preset: "gradient" },
        background: { type: "animated-gradient" },
        weather: { enabled: false },
        navigation: { items: [{ name: "Zuhause", icon: "mdi:home", path: "/lovelace/0" }] }
      },
      cards: [{ type: "markdown", content: "# Halo UI\nDein Dashboard-Inhalt erscheint hier." }]
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = deepMerge(HALO_LAYOUT_DEFAULTS, {});
    this._hass = null;
    this._sidebar = null;
    this._cards = [];
    this._configGeneration = 0;
    this._connected = false;
    this._mobile = false;
    this._resizeObserver = null;
    this._resizeHandler = () => this._applyResponsive();
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.cards)) {
      throw new Error("Halo Layout: 'cards' muss eine Liste sein.");
    }
    if (config.sidebar && typeof config.sidebar !== "object") {
      throw new Error("Halo Layout: 'sidebar' muss ein Objekt sein.");
    }
    this._config = deepMerge(HALO_LAYOUT_DEFAULTS, config);
    this._configGeneration++;
    this._drawLayout();
    this._loadCards(this._configGeneration);
  }

  set hass(hass) {
    this._hass = hass;
    if (this._sidebar) this._sidebar.hass = hass;
    for (const card of this._cards) card.hass = hass;
  }

  getCardSize() { return 12; }

  connectedCallback() {
    this._connected = true;
    this._applyResponsive();
    if (typeof ResizeObserver !== "undefined") {
      this._resizeObserver?.disconnect();
      this._resizeObserver = new ResizeObserver(() => this._applyResponsive());
      this._resizeObserver.observe(this);
    } else {
      window.addEventListener("resize", this._resizeHandler);
    }
  }

  disconnectedCallback() {
    this._connected = false;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    window.removeEventListener("resize", this._resizeHandler);
  }

  _drawLayout() {
    const c = this._config;
    const l = c.layout || {};
    const width = haloCssLength(l.width, "320px");
    const gap = haloCssLength(l.gap, "0px");
    const padding = haloCssLength(l.content_padding, "24px");
    const minHeight = haloCssLength(l.min_height, "calc(100dvh - 56px)");
    const isRight = l.position === "right";
    const cols = Math.max(1, Math.min(6, Math.floor(Number(l.content_columns) || 1)));

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display:block;
          width:100%;
          min-width:0;
          --halo-sidebar-width:${width};
          --halo-gap:${gap};
          --halo-content-padding:${padding};
          --halo-content-columns:${cols};
        }
        .halo-view {
          box-sizing:border-box;
          display:grid;
          grid-template-columns: ${isRight ? `minmax(0,1fr) var(--halo-sidebar-width)` : `var(--halo-sidebar-width) minmax(0,1fr)`};
          gap:var(--halo-gap);
          min-height:${minHeight};
          width:100%;
          align-items:stretch;
        }
        .halo-rail {
          min-width:0;
          min-height:100%;
          display:flex;
          grid-column:${isRight ? "2" : "1"};
          grid-row:1;
          position:relative;
        }
        .halo-rail > halo-sidebar { width:100%; flex:1; }
        .halo-content {
          min-width:0;
          box-sizing:border-box;
          grid-column:${isRight ? "1" : "2"};
          grid-row:1;
          padding:var(--halo-content-padding);
          background:${l.content_background || "transparent"};
        }
        .halo-cards {
          min-width:0;
          display:grid;
          grid-template-columns:repeat(var(--halo-content-columns), minmax(0,1fr));
          gap:16px;
          align-items:start;
        }
        .halo-card-slot { min-width:0; }
        .halo-card-slot > * { display:block; width:100%; box-sizing:border-box; }
        .halo-view.mobile { display:flex; flex-direction:column; min-height:auto; }
        .halo-view.mobile .halo-rail { min-height:0; width:100%; }
        .halo-view.mobile .halo-content { width:100%; padding:16px; }
        .halo-view.mobile.hide-rail .halo-rail { display:none; }
        .halo-view.mobile .halo-cards { grid-template-columns:minmax(0,1fr); }
        .halo-view.mobile.bottom { flex-direction:column-reverse; }
        .halo-error { padding:18px; color:var(--error-color,#d32f2f); }
      </style>
      <div class="halo-view">
        <div class="halo-rail" part="sidebar"></div>
        <main class="halo-content" part="content"><div class="halo-cards"></div></main>
      </div>`;

    this._sidebar = document.createElement("halo-sidebar");
    // Force the sidebar's internal layout to fill the dedicated rail.
    const sidebarConfig = deepMerge(c.sidebar || {}, { type: "custom:halo-sidebar" });
    sidebarConfig.layout = {
      ...(sidebarConfig.layout || {}),
      fixed: false,
      width: "100%"
    };
    this._sidebar.setConfig(sidebarConfig);
    if (this._hass) this._sidebar.hass = this._hass;
    this.shadowRoot.querySelector(".halo-rail").appendChild(this._sidebar);
    this._cards = [];
    this._applyResponsive();
  }

  async _loadCards(generation) {
    let helpers;
    try {
      helpers = await window.loadCardHelpers();
    } catch (error) {
      if (generation === this._configGeneration) this._showError(error);
      return;
    }
    if (generation !== this._configGeneration) return;
    const mount = this.shadowRoot.querySelector(".halo-cards");
    if (!mount) return;

    for (const cardConfig of this._config.cards) {
      try {
        const card = helpers.createCardElement(cardConfig);
        const slot = document.createElement("div");
        slot.className = "halo-card-slot";
        slot.appendChild(card);
        mount.appendChild(slot);
        this._cards.push(card);
        if (this._hass) card.hass = this._hass;
      } catch (error) {
        const message = document.createElement("div");
        message.className = "halo-error";
        message.textContent = `Karte konnte nicht geladen werden: ${error.message}`;
        mount.appendChild(message);
      }
    }
  }

  _showError(error) {
    const mount = this.shadowRoot.querySelector(".halo-cards");
    if (!mount) return;
    const message = document.createElement("div");
    message.className = "halo-error";
    message.textContent = `Home Assistant Card Helpers nicht verfügbar: ${error?.message || error}`;
    mount.appendChild(message);
  }

  _applyResponsive() {
    const view = this.shadowRoot.querySelector(".halo-view");
    if (!view) return;
    const l = this._config.layout || {};
    const threshold = Math.max(320, Number(l.mobile_breakpoint) || 800);
    const width = this.getBoundingClientRect().width || window.innerWidth;
    const mobile = width < threshold;
    view.classList.toggle("mobile", mobile);
    view.classList.toggle("hide-rail", mobile && l.mobile_mode === "hide");
    view.classList.toggle("bottom", mobile && l.mobile_mode === "bottom");
    this._mobile = mobile;
  }
}

class HaloLayoutEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = HaloLayout.getStubConfig();
  }

  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = deepMerge(HALO_LAYOUT_DEFAULTS, config); this._render(); }

  _change(path, value) {
    const next = structuredClone(this._config);
    let node = next;
    const parts = path.split(".");
    while (parts.length > 1) node = (node[parts.shift()] ||= {});
    node[parts[0]] = value;
    this._config = next;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: next }, bubbles: true, composed: true
    }));
  }

  _render() {
    const l = this._config.layout || {};
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; padding:12px; }
        .form { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
        label { display:grid;gap:5px;font-size:12px;color:var(--secondary-text-color); }
        input,select { background:var(--card-background-color); color:var(--primary-text-color); border:1px solid var(--divider-color); border-radius:8px;padding:9px; }
        .help { margin-top:12px; color:var(--secondary-text-color);line-height:1.5; font-size:13px; }
      </style>
      <h3>Halo Layout v${HALO_VERSION}</h3>
      <div class="form">
        <label>Seitenleiste
          <select data-path="layout.position">
            <option value="left" ${l.position !== "right" ? "selected" : ""}>Links</option>
            <option value="right" ${l.position === "right" ? "selected" : ""}>Rechts</option>
          </select>
        </label>
        <label>Breite
          <input data-path="layout.width" value="${esc(l.width || "320px")}">
        </label>
        <label>Mobil
          <select data-path="layout.mobile_mode">
            ${["top","bottom","hide"].map(v => `<option value="${v}" ${l.mobile_mode === v ? "selected" : ""}>${v}</option>`).join("")}
          </select>
        </label>
        <label>Breakpoint (px)
          <input type="number" data-path="layout.mobile_breakpoint" value="${Number(l.mobile_breakpoint || 800)}">
        </label>
        <label>Inhalt-Abstand
          <input data-path="layout.content_padding" value="${esc(l.content_padding || "24px")}">
        </label>
        <label>Inhalt-Spalten
          <input type="number" min="1" max="6" data-path="layout.content_columns" value="${Number(l.content_columns || 1)}">
        </label>
      </div>
      <p class="help">Die Sidebar und die Inhalte unter <code>cards:</code> sind vollständig über YAML anpassbar. Der visuelle Editor wird schrittweise erweitert.</p>`;
    localizeHaloDom(this.shadowRoot, this._hass);

    this.shadowRoot.querySelectorAll("[data-path]").forEach(el => {
      el.addEventListener("change", () => {
        let value = el.value;
        if (el.type === "number") value = Number(value);
        this._change(el.getAttribute("data-path"), value);
      });
    });
  }
}

if (!customElements.get("halo-layout")) customElements.define("halo-layout", HaloLayout);
if (!customElements.get("halo-layout-editor")) customElements.define("halo-layout-editor", HaloLayoutEditor);


// ===========================================================================
// EXPERIMENTAL: Halo View Sidebar for normal HA Sections / Masonry views.
// This lightweight controller is inserted as a regular card. The original
// Lovelace layout, cards and HA visual editor remain HA-owned.
// ===========================================================================
const HALO_VIEW_DEFAULTS = {
  type: "custom:halo-view-sidebar",
  enabled: true,
  layout: {
    width: "320px",
    position: "left",
    mobile_breakpoint: 850,
    mobile_mode: "hide",
    tablet_breakpoint: 1400,
    tablet_width: "280px",
    tablet_preset: "keep",
    top_offset: 0,
    bottom_offset: 0
  },
  sidebar: {},
  debug: { show_placeholder: false }
};

function haloComposedAncestor(start, selector) {
  let node = start;
  for (let i = 0; i < 45 && node; i++) {
    if (node instanceof Element && node.matches(selector)) return node;
    node = node.parentElement || (node.getRootNode()?.host || null);
  }
  return null;
}

// Do not modify HA global CSS; keep the layout change on one view element.
// The view must be the ancestor that actually contains the normal HA cards.
const HALO_SUPPORTED_VIEWS = "hui-sections-view, hui-masonry-view, hui-sidebar-view";

class HaloViewSidebar extends HTMLElement {
  static getConfigElement() { return document.createElement("halo-view-sidebar-editor"); }
  static getStubConfig() {
    return {
      type: "custom:halo-view-sidebar",
      layout: { width: "320px", position: "left", mobile_mode: "hide" },
      sidebar: HaloSidebar.getStubConfig()
    };
  }

  constructor() {
    super();
    this._config = deepMerge(HALO_VIEW_DEFAULTS, {});
    this._hass = null;
    this._portal = null;
    this._view = null;
    this._cardShell = null;
    this._previous = null;
    this._resizeObserver = null;
    this._raf = null;
    this._pending = [];
    this._onResize = () => this._syncGeometry();
    this._onRoute = () => this._scheduleMount();
    this._connected = false;
    this._editModeTimer = null;
    this._lastDashboardEditMode = null;
    this._previewSidebar = null;
    this._lastResponsiveState = null;
  }

  setConfig(config) {
    if (!config || (config.sidebar && typeof config.sidebar !== "object")) {
      throw new Error("Halo View Sidebar: 'sidebar' muss ein Objekt sein.");
    }
    this._config = deepMerge(HALO_VIEW_DEFAULTS, config);
    this._renderPlaceholder();
    if (this._portal) {
      this._portal.sidebar.setConfig(this._sidebarConfig());
      if (this._hass) this._portal.sidebar.hass = this._hass;
    }
    this._scheduleMount();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._portal) this._portal.sidebar.hass = hass;
    if (this._previewSidebar) this._previewSidebar.hass = hass;
  }

  getCardSize() { return 1; }

  connectedCallback() {
    this._connected = true;
    this._renderPlaceholder();
    window.addEventListener("resize", this._onResize);
    window.addEventListener("location-changed", this._onRoute);
    window.addEventListener("popstate", this._onRoute);
    this._scheduleMount();

    // Edit mode is owned by Lovelace, not by hass state. Poll lightly so the
    // gear appears/disappears immediately when the user enters/leaves edit mode.
    this._editModeTimer = setInterval(() => this._syncEditControl(), 250);

    // HA constructs some cards before attaching their view to the DOM.
    this._pending.push(setTimeout(() => this._scheduleMount(), 300));
    this._pending.push(setTimeout(() => this._scheduleMount(), 1200));
  }

  disconnectedCallback() {
    this._connected = false;
    clearInterval(this._editModeTimer);
    this._editModeTimer = null;
    if (this._raf !== null) cancelAnimationFrame(this._raf);
    this._raf = null;
    this._pending.forEach(clearTimeout);
    this._pending = [];
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("location-changed", this._onRoute);
    window.removeEventListener("popstate", this._onRoute);
    this._teardown();
  }

  _responsiveState() {
    const l = this._config.layout || {};
    const width = window.innerWidth;
    const mobileBreakpoint = Math.max(320, Number(l.mobile_breakpoint) || 850);
    const tabletBreakpoint = Math.max(mobileBreakpoint + 1, Number(l.tablet_breakpoint) || 1400);

    if (width < mobileBreakpoint) return "mobile";
    if (width < tabletBreakpoint) return "tablet";
    return "desktop";
  }

  _sidebarConfig() {
    const cfg = deepMerge(DEFAULTS, this._config.sidebar || {});
    cfg.type = "custom:halo-sidebar";
    cfg.layout.fixed = false;
    cfg.layout.width = "100%";

    const state = this._responsiveState();
    const tabletPreset = this._config.layout?.tablet_preset || "keep";
    if (state === "tablet" && tabletPreset !== "keep") {
      cfg.layout.preset = tabletPreset;
    }

    return cfg;
  }

  _inEditor() {
    return !!haloComposedAncestor(this, "hui-card-preview, hui-card-element-editor, hui-dialog-edit-card");
  }

  _dashboardEditMode() {
    // Best path for a controller stored as a view footer/header card.
    const footer = haloComposedAncestor(this, "hui-view-footer");
    if (footer?.lovelace) return !!footer.lovelace.editMode;

    const header = haloComposedAncestor(this, "hui-view-header");
    if (header?.lovelace) return !!header.lovelace.editMode;

    // Normal cards in sections/masonry also sit below elements carrying the
    // Lovelace object. Walk the composed ancestor chain and use the first one.
    let node = this;
    for (let i = 0; i < 30 && node; i++) {
      if (node?.lovelace && typeof node.lovelace.editMode !== "undefined") {
        return !!node.lovelace.editMode;
      }
      const root = node.getRootNode?.();
      node = node.parentElement || root?.host || null;
    }

    return false;
  }

  _openHaloEditor() {
    // Home Assistant wraps cards in hui-card-edit-mode while the dashboard is
    // being edited. `ll-edit-card` is HA's native edit event. Dispatching it
    // from the actual controller card means the footer/header/section wrapper
    // opens the normal card editor with our own getConfigElement().
    this.dispatchEvent(
      new CustomEvent("ll-edit-card", {
        bubbles: true,
        composed: true,
        detail: { path: [0] },
      })
    );
  }

  _ensureEditButton() {
    if (!this._portal) return null;

    let button = this._portal.querySelector(".halo-sidebar-edit-button");
    if (button) return button;

    button = document.createElement("button");
    button.type = "button";
    button.className = "halo-sidebar-edit-button";
    button.title = "Halo Sidebar bearbeiten";
    button.setAttribute("aria-label", "Halo Sidebar bearbeiten");
    button.style.cssText = `
      position:absolute;
      top:14px;
      right:14px;
      z-index:100;
      width:38px;
      height:38px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(18,18,22,.58);
      color:#fff;
      display:none;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      box-shadow:0 8px 22px rgba(0,0,0,.24);
      padding:0;
      transition:transform .16s ease, background .16s ease, opacity .16s ease;
    `;

    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", "mdi:cog");
    icon.style.cssText = "width:21px;height:21px;color:#fff;";
    button.appendChild(icon);

    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.06)";
      button.style.background = "rgba(0,184,230,.72)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
      button.style.background = "rgba(18,18,22,.58)";
    });
    button.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this._openHaloEditor();
    });

    this._portal.appendChild(button);
    return button;
  }

  _syncEditControl() {
    if (!this._portal || !this._connected) return;

    const editMode = this._dashboardEditMode();
    if (editMode === this._lastDashboardEditMode &&
        this._portal.querySelector(".halo-sidebar-edit-button")) {
      return;
    }

    this._lastDashboardEditMode = editMode;
    const button = this._ensureEditButton();
    if (!button) return;
    button.style.display = editMode ? "flex" : "none";
  }

  _renderPlaceholder(message = "") {
    const inEditor = this._inEditor();
    this.textContent = "";
    this._previewSidebar = null;

    // In Home Assistant's card editor the controller becomes a real live
    // preview. Every config-changed event recreates/updates this preview, so
    // users see presets, colours, weather, navigation and presence immediately.
    if (inEditor && !message) {
      const stage = document.createElement("div");
      stage.className = "halo-editor-live-preview";
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
      header.innerHTML = `<span>Live-Vorschau</span><span>Halo v${HALO_VERSION}</span>`;
      stage.appendChild(header);

      const viewport = document.createElement("div");
      viewport.style.cssText = `
        flex:1;
        min-height:0;
        display:flex;
        ${this._config.layout?.position === "right" ? "justify-content:flex-end;" : "justify-content:flex-start;"}
        overflow:auto;
        border:1px solid var(--divider-color,#444);
        border-radius:14px;
        background:var(--lovelace-background,var(--primary-background-color,#111));
        padding:12px;
        box-sizing:border-box;
      `;

      const frame = document.createElement("div");
      frame.style.cssText = `
        width:min(${haloCssLength(this._config.layout?.width, "320px")},100%);
        height:100%;
        min-height:520px;
        overflow:hidden;
        border-radius:12px;
        box-sizing:border-box;
      `;

      const sidebar = document.createElement("halo-sidebar");
      sidebar.setConfig(this._sidebarConfig());
      if (this._hass) sidebar.hass = this._hass;
      frame.appendChild(sidebar);
      viewport.appendChild(frame);
      stage.appendChild(viewport);
      this.appendChild(stage);
      this._previewSidebar = sidebar;

      this.style.display = "block";
      this.style.height = "auto";
      this.style.minHeight = "0";
      this.style.overflow = "visible";
      this.style.margin = "0";
      return;
    }

    // Outside the card editor the controller occupies no layout space. A
    // diagnostic message remains available for unsupported modes/debugging.
    const show = this._config.debug?.show_placeholder || !!message;
    if (show) {
      const el = document.createElement("div");
      el.style.cssText = "padding:10px 14px;border:1px dashed var(--primary-color,#00b8e6);border-radius:10px;color:var(--secondary-text-color,#999);font:12px sans-serif;";
      el.textContent = message || `Halo View Sidebar v${HALO_VERSION} · Ansichtskonfiguration`;
      this.appendChild(el);
    }
    this.style.display = "block";
    this.style.height = show ? "auto" : "0px";
    this.style.minHeight = "0";
    this.style.overflow = "hidden";
    this.style.margin = "0";
  }

  _scheduleMount() {
    if (!this._connected || this._raf !== null) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = null;
      this._mount();
    });
  }

  _mount() {
    if (!this._connected) return;
    if (this._config.enabled === false || this._inEditor()) {
      this._teardown();
      this._renderPlaceholder();
      return;
    }
    const view = haloComposedAncestor(this, HALO_SUPPORTED_VIEWS);
    if (!view) {
      this._teardown();
      this._renderPlaceholder("Halo: Für diesen Modus bitte eine Abschnitte-, Kacheln- oder Seitenleisten-Ansicht verwenden.");
      return;
    }
    if (this._view !== view) this._teardown();
    if (!this._portal) {
      this._view = view;
      this._previous = {
        paddingLeft: view.style.getPropertyValue("padding-left"),
        paddingLeftPriority: view.style.getPropertyPriority("padding-left"),
        paddingRight: view.style.getPropertyValue("padding-right"),
        paddingRightPriority: view.style.getPropertyPriority("padding-right"),
        boxSizing: view.style.boxSizing,
        shellDisplay: null
      };
      const portal = document.createElement("div");
      portal.className = "halo-view-sidebar-portal";
      portal.dataset.haloVersion = HALO_VERSION;
      portal.style.cssText = "position:fixed;z-index:3;overflow:hidden;pointer-events:auto;box-sizing:border-box;";
      const sidebar = document.createElement("halo-sidebar");
      sidebar.setConfig(this._sidebarConfig());
      if (this._hass) sidebar.hass = this._hass;
      portal.appendChild(sidebar);
      portal.sidebar = sidebar;
      document.body.appendChild(portal);
      this._portal = portal;
      this._ensureEditButton();
      this._syncEditControl();
      // Hide only the controller card's nearest Lovelace wrapper, not its view.
      // HA's section/grid then does not reserve a blank card cell.
      const shell = haloComposedAncestor(this, "hui-card");
      if (shell && shell !== view) {
        this._cardShell = shell;
        this._previous.shellDisplay = shell.style.display;
        shell.style.display = "none";
      }
      if (typeof ResizeObserver !== "undefined") {
        this._resizeObserver = new ResizeObserver(() => this._syncGeometry());
        this._resizeObserver.observe(view);
      }
    }
    this._syncGeometry();
  }

  _syncGeometry() {
    if (!this._view || !this._portal || !this._connected) return;
    const settings = this._config.layout || {};
    const viewportWidth = window.innerWidth;
    const responsiveState = this._responsiveState();
    const mobile = responsiveState === "mobile";
    const tablet = responsiveState === "tablet";
    const rawWidth = haloCssLength(
      tablet ? settings.tablet_width : settings.width,
      tablet ? "280px" : "320px"
    );
    const mode = mobile ? (settings.mobile_mode || "hide") : "side";
    const right = settings.position === "right";

    if (responsiveState !== this._lastResponsiveState) {
      this._lastResponsiveState = responsiveState;
      this._portal.dataset.haloResponsive = responsiveState;
      this._portal.sidebar?.setConfig(this._sidebarConfig());
      if (this._hass && this._portal.sidebar) this._portal.sidebar.hass = this._hass;
    }

    // Use computed width so both sidebar and view reserve precisely the same width.
    const measure = document.createElement("div");
    measure.style.cssText = `position:absolute;visibility:hidden;width:${rawWidth};max-width:100vw;pointer-events:none;`;
    document.body.appendChild(measure);
    const px = Math.min(Math.max(90, measure.getBoundingClientRect().width || 320), viewportWidth * 0.75);
    measure.remove();

    const view = this._view;
    // Undo any padding set by this component before calculating view bounds.
    if (mode === "side") {
      view.style.setProperty(right ? "padding-right" : "padding-left", `${px}px`, "important");
      view.style.boxSizing = "border-box";
    } else {
      this._restorePadding();
    }

    if (mode === "hide") {
      this._portal.style.display = "none";
      return;
    }

    const rect = view.getBoundingClientRect();
    const top = Math.max(0, rect.top + (Number(settings.top_offset) || 0));
    const bottom = Math.max(0, Number(settings.bottom_offset) || 0);
    this._portal.style.display = "block";
    this._portal.style.width = `${px}px`;
    this._portal.style.height = `${Math.max(180, window.innerHeight - top - bottom)}px`;
    this._portal.style.top = `${top}px`;
    this._portal.style.left = right ? `${Math.max(0,rect.right-px)}px` : `${Math.max(0,rect.left)}px`;
    this._portal.style.right = "auto";
    this._portal.style.overflowY = "auto";
    this._portal.style.background = "transparent";
    this._portal.style.pointerEvents = "auto";

    if (mode === "top") {
      // Mobile mode 'top' is deliberately deferred to a later release.
      // Avoid accidental overlap: hide rather than overlaying content.
      this._portal.style.display = "none";
    }

    this._syncEditControl();
  }

  _restorePadding() {
    if (!this._view || !this._previous) return;
    const v = this._view;
    for (const [name, val, prio] of [
      ["padding-left", this._previous.paddingLeft, this._previous.paddingLeftPriority],
      ["padding-right", this._previous.paddingRight, this._previous.paddingRightPriority]
    ]) {
      if (val) v.style.setProperty(name, val, prio);
      else v.style.removeProperty(name);
    }
    v.style.boxSizing = this._previous.boxSizing;
  }

  _teardown() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._restorePadding();
    if (this._cardShell && this._previous) {
      this._cardShell.style.display = this._previous.shellDisplay ?? "";
    }
    this._portal?.remove();
    this._portal = null;
    this._view = null;
    this._cardShell = null;
    this._previous = null;
    this._lastDashboardEditMode = null;
    this._lastResponsiveState = null;
  }
}

class HaloViewSidebarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this._config = deepMerge(HALO_VIEW_DEFAULTS, {});

    // Home Assistant can destroy/recreate the complete card editor after a
    // committed config change (most visibly after SELECT/dropdown changes).
    // Keep the active Sidebar sub-tab outside the element instance so a new
    // editor resumes exactly where the user was instead of jumping to
    // "Allgemein".
    const validTabs = new Set(["general", "design", "background", "navigation", "presence"]);
    const savedTab = window.__haloSidebarEditorState?.activeTab;
    this._activeTab = validTabs.has(savedTab) ? savedTab : "general";
  }

  _persistActiveTab() {
    window.__haloSidebarEditorState = {
      ...(window.__haloSidebarEditorState || {}),
      activeTab: this._activeTab
    };
  }

  set hass(value) {
    this._hass = value;
  }

  setConfig(config) {
    this._config = deepMerge(HALO_VIEW_DEFAULTS, config || {});
    this._config.sidebar = deepMerge(DEFAULTS, this._config.sidebar || {});
    this._render();
  }

  _emit(next, commit = true) {
    this._config = next;
    // Persist before dispatch: the parent/Home Assistant may synchronously
    // rebuild the editor as a consequence of this event.
    this._persistActiveTab();
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail:{config:next, commit},
      bubbles:true,
      composed:true
    }));
  }

  _setPath(path, value, render = true, commit = true) {
    const cfg = structuredClone(this._config);
    const keys = path.split(".");
    let obj = cfg;
    while (keys.length > 1) {
      const key = keys.shift();
      obj[key] ??= {};
      obj = obj[key];
    }
    obj[keys[0]] = value;
    this._emit(cfg, commit);
    if (render) this._render();
  }

  _setArrayItem(path, index, key, value) {
    const cfg = structuredClone(this._config);
    const keys = path.split(".");
    let obj = cfg;
    while (keys.length) {
      const k = keys.shift();
      obj[k] ??= keys.length ? {} : [];
      obj = obj[k];
    }
    obj[index] ??= {};
    obj[index][key] = value;
    this._emit(cfg);
    this._render();
  }

  _addArrayItem(path, item) {
    const cfg = structuredClone(this._config);
    const keys = path.split(".");
    let obj = cfg;
    while (keys.length > 1) {
      const k = keys.shift();
      obj[k] ??= {};
      obj = obj[k];
    }
    const last = keys[0];
    obj[last] = Array.isArray(obj[last]) ? obj[last] : [];
    obj[last].push(item);
    this._emit(cfg);
    this._render();
  }

  _removeArrayItem(path, index) {
    const cfg = structuredClone(this._config);
    const keys = path.split(".");
    let obj = cfg;
    while (keys.length > 1) {
      obj = obj[keys.shift()];
      if (!obj) return;
    }
    const list = obj[keys[0]];
    if (!Array.isArray(list)) return;
    list.splice(index,1);
    this._emit(cfg);
    this._render();
  }

  _moveArrayItem(path, index, delta) {
    const cfg = structuredClone(this._config);
    const keys = path.split(".");
    let obj = cfg;
    while (keys.length > 1) {
      obj = obj[keys.shift()];
      if (!obj) return;
    }
    const list = obj[keys[0]];
    if (!Array.isArray(list)) return;
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this._emit(cfg);
    this._render();
  }

  _bool(v) {
    return v === true || v === "true";
  }

  _num(v, fallback=0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  _renderNavItems() {
    const items = this._config.sidebar?.navigation?.items || [];
    if (!items.length) {
      return `<div class="empty">Noch keine Navigationspunkte. Über „Hinzufügen“ kannst du den ersten anlegen.</div>`;
    }
    return items.map((item, i) => `
      <div class="list-card">
        <div class="list-head">
          <div class="item-title">
            <span class="item-preview icon-preview"><ha-icon icon="${esc(item.icon || "mdi:home")}"></ha-icon></span>
            <strong>${esc(item.name || `Navigation ${i+1}`)}</strong>
          </div>
          <div class="row-actions">
            <button class="move" data-move-nav="${i}" data-delta="-1" ${i===0?"disabled":""} title="Nach oben">↑</button>
            <button class="move" data-move-nav="${i}" data-delta="1" ${i===items.length-1?"disabled":""} title="Nach unten">↓</button>
            <button class="danger" data-remove-nav="${i}" title="Entfernen">✕</button>
          </div>
        </div>
        <div class="grid">
          <label>Name<input data-nav-index="${i}" data-nav-key="name" value="${esc(item.name || "")}"></label>
          <label>Icon<div class="ha-selector-host" data-selector-kind="icon" data-selector-scope="nav" data-selector-index="${i}" data-selector-key="icon" data-selector-value="${esc(item.icon || "mdi:home")}"></div></label>
          <label class="full">Pfad<input data-nav-index="${i}" data-nav-key="path" value="${esc(item.path || "")}" placeholder="/dashboard-x/home"></label>
          <label>Pfadvergleich
            <select data-nav-index="${i}" data-nav-key="match">
              <option value="exact" ${item.match !== "prefix" ? "selected":""}>Exakt</option>
              <option value="prefix" ${item.match === "prefix" ? "selected":""}>Prefix</option>
            </select>
          </label>
          <label>Badge Entity<div class="ha-selector-host" data-selector-kind="entity" data-selector-scope="nav" data-selector-index="${i}" data-selector-key="badge.entity" data-selector-value="${esc(item.badge?.entity || "")}"></div></label>
        </div>
      </div>
    `).join("");
  }

  _renderPresenceItems() {
    const items = this._config.sidebar?.presence?.entities || [];
    if (!items.length) {
      return `<div class="empty">Noch keine Personen. Über „Hinzufügen“ kannst du eine Presence-Kachel anlegen.</div>`;
    }
    return items.map((item, i) => {
      const preview = item.home_image || item.away_image;
      return `
        <div class="list-card">
          <div class="list-head">
            <div class="item-title">
              <span class="item-preview person-preview">
                ${preview ? `<img src="${esc(preview)}" alt="">` : `<ha-icon icon="mdi:account"></ha-icon>`}
              </span>
              <strong>${esc(item.name || item.entity || `Person ${i+1}`)}</strong>
            </div>
            <div class="row-actions">
              <button class="move" data-move-person="${i}" data-delta="-1" ${i===0?"disabled":""} title="Nach oben">↑</button>
              <button class="move" data-move-person="${i}" data-delta="1" ${i===items.length-1?"disabled":""} title="Nach unten">↓</button>
              <button class="danger" data-remove-person="${i}" title="Entfernen">✕</button>
            </div>
          </div>
          <div class="grid">
            <label>Entity<div class="ha-selector-host" data-selector-kind="entity" data-selector-domain="person" data-selector-scope="person" data-selector-index="${i}" data-selector-key="entity" data-selector-value="${esc(item.entity || "")}"></div></label>
            <label>Name<input data-person-index="${i}" data-person-key="name" value="${esc(item.name || "")}"></label>
            <label class="full">Bild Zuhause<input data-person-index="${i}" data-person-key="home_image" value="${esc(item.home_image || "")}" placeholder="/local/...png"></label>
            <label class="full">Bild Abwesend<input data-person-index="${i}" data-person-key="away_image" value="${esc(item.away_image || "")}" placeholder="/local/...png"></label>
          </div>
        </div>
      `;
    }).join("");
  }

  _tabGeneral() {
    const l = this._config.layout || {};
    const s = this._config.sidebar || {};
    return `
      <section class="panel">
        <h3>Ansicht</h3>
        <div class="grid">
          <label>Aktivieren
            <select data-path="enabled">
              <option value="true" ${this._config.enabled !== false ? "selected":""}>Ja</option>
              <option value="false" ${this._config.enabled === false ? "selected":""}>Nein</option>
            </select>
          </label>
          <label>Position
            <select data-path="layout.position">
              <option value="left" ${l.position !== "right" ? "selected":""}>Links</option>
              <option value="right" ${l.position === "right" ? "selected":""}>Rechts</option>
            </select>
          </label>
          <label>Breite<input data-path="layout.width" value="${esc(l.width || "320px")}"></label>
          <label>Mobile Breakpoint (px)<input type="number" data-path="layout.mobile_breakpoint" value="${this._num(l.mobile_breakpoint,850)}"></label>
          <label>Mobile Verhalten
            <select data-path="layout.mobile_mode">
              <option value="hide" ${l.mobile_mode !== "top" ? "selected":""}>Ausblenden</option>
              <option value="top" ${l.mobile_mode === "top" ? "selected":""}>Oben (experimentell)</option>
            </select>
          </label>
          <label>Tablet Breakpoint (px)<input type="number" data-path="layout.tablet_breakpoint" value="${this._num(l.tablet_breakpoint,1400)}"></label>
          <label>Tablet-Breite<input data-path="layout.tablet_width" value="${esc(l.tablet_width || "280px")}"></label>
          <label>Tablet Layout
            <select data-path="layout.tablet_preset">
              ${["keep","dashboard","classic","compact","glass","floating"].map(v =>
                `<option value="${v}" ${(l.tablet_preset || "keep")===v?"selected":""}>${v === "keep" ? "Beibehalten" : v}</option>`
              ).join("")}
            </select>
          </label>
          <label>Halo Layout
            <select data-path="sidebar.layout.preset">
              ${["dashboard","classic","compact","glass","floating"].map(v =>
                `<option value="${v}" ${s.layout?.preset===v?"selected":""}>${v}</option>`
              ).join("")}
            </select>
          </label>
        </div>
        <div class="hint">
          Desktop nutzt „Breite“. Zwischen Mobile- und Tablet-Breakpoint nutzt Halo automatisch die Tablet-Breite.
          Das Tablet-Layout kann optional auf „compact“ wechseln.
        </div>
      </section>

      <section class="panel">
        <h3>Anzeige</h3>
        <div class="grid">
          <label>Uhr
            <select data-path="sidebar.clock.enabled">
              <option value="true" ${s.clock?.enabled !== false ? "selected":""}>An</option>
              <option value="false" ${s.clock?.enabled === false ? "selected":""}>Aus</option>
            </select>
          </label>
          <label>Uhrformat
            <select data-path="sidebar.clock.format">
              <option value="24h" ${s.clock?.format !== "12h" ? "selected":""}>24 Stunden</option>
              <option value="12h" ${s.clock?.format === "12h" ? "selected":""}>12 Stunden</option>
            </select>
          </label>
          <label>Datum
            <select data-path="sidebar.date.enabled">
              <option value="true" ${s.date?.enabled !== false ? "selected":""}>An</option>
              <option value="false" ${s.date?.enabled === false ? "selected":""}>Aus</option>
            </select>
          </label>
          <label>Sprache<input data-path="sidebar.date.locale" value="${esc(s.date?.locale || "auto")}"></label>
          <label>Version anzeigen
            <select data-path="sidebar.debug.show_version">
              <option value="true" ${s.debug?.show_version === true ? "selected":""}>Ja</option>
              <option value="false" ${s.debug?.show_version !== true ? "selected":""}>Nein</option>
            </select>
          </label>
        </div>
      </section>
    `;
  }

  _tabDesign() {
    const a = this._config.sidebar?.appearance || {};
    const inheritGlobal = a.inherit_global !== false;
    const disabled = inheritGlobal ? "disabled" : "";
    const g = haloGradient(a);
    const bg = haloGradientCss(a);
    const gradientDesigner = inheritGlobal ? `
      <section class="panel">
        <div class="list-head"><div><h3>Gradient Designer</h3><div class="hint">Die Sidebar übernimmt Gradient, Stops, Richtung und Animation aktuell vollständig aus dem globalen Design.</div></div></div>
        <div class="gradient-preview" style="background:${bg}"></div>
        <div class="hint">Zum eigenen Bearbeiten oben „Nein – Sidebar separat gestalten“ wählen.</div>
      </section>` : `
      <section class="panel gradient-designer">
        <div class="list-head"><div><h3>Gradient Designer</h3><div class="hint">Bis zu 12 Farb-Stops frei positionieren. Die Sidebar-Animation verwendet exakt diesen Gradient.</div></div><button type="button" class="primary" data-sg-add>+ Farbe</button></div>
        <div class="gradient-preview" style="background:${bg}"></div>
        <div class="gradient-track" style="background:${bg}" data-sg-track>
          ${g.stops.map((st,i)=>`<button type="button" class="gradient-stop" data-sg-stop="${i}" style="left:${st.position}%;--stop-color:${st.color}" title="${Math.round(st.position)}%"></button>`).join("")}
        </div>
        <div class="gradient-actions"><button type="button" class="secondary" data-sg-even>Gleichmäßig verteilen</button><button type="button" class="secondary" data-sg-reverse>Umkehren</button></div>
        <div class="grid" style="margin-top:10px">
          <label>Typ<select data-sg-field="type"><option value="linear" ${g.type==="linear"?"selected":""}>Linear</option><option value="radial" ${g.type==="radial"?"selected":""}>Radial</option><option value="conic" ${g.type==="conic"?"selected":""}>Conic / Kreis</option></select></label>
          <label>Farbmischung<select data-sg-field="interpolation"><option value="oklab" ${g.interpolation==="oklab"?"selected":""}>Smooth / OKLab</option><option value="srgb" ${g.interpolation==="srgb"?"selected":""}>Standard / sRGB</option></select></label>
        </div>
        <div class="gradient-geometry">
          <div class="angle-wrap ${g.type==="radial"?"muted":""}"><span class="field-note">Richtung / Startwinkel</span><div class="angle-dial" data-sg-dial style="--halo-angle:${g.angle}"><div class="dial-ring"></div><div class="dial-hand"></div><div class="dial-center"></div><span class="dial-value">${Math.round(g.angle)}°</span></div><input type="range" min="0" max="360" step="1" value="${g.angle}" data-sg-angle></div>
          <div class="center-controls ${g.type==="linear"?"muted":""}"><label>Mittelpunkt X <input type="range" min="0" max="100" step="1" value="${g.center_x}" data-sg-center="x"><span>${Math.round(g.center_x)}%</span></label><label>Mittelpunkt Y <input type="range" min="0" max="100" step="1" value="${g.center_y}" data-sg-center="y"><span>${Math.round(g.center_y)}%</span></label></div>
        </div>
        <div class="gradient-stop-list">${g.stops.map((st,i)=>`<div class="gradient-stop-row"><input type="color" value="${esc(st.color)}" data-sg-color="${i}"><label>Position <input type="range" min="0" max="100" step="1" value="${st.position}" data-sg-position="${i}"><span data-sg-position-label="${i}">${Math.round(st.position)}%</span></label><button type="button" class="danger" data-sg-delete="${i}" ${g.stops.length<=2?"disabled":""}>×</button></div>`).join("")}</div>
        <div class="hint"><strong>Animation:</strong> Linear wandert in der gewählten Richtung, Radial kreist sichtbar um den Mittelpunkt und pulsiert, Conic rotiert nahtlos. „Animationsdauer“ oben bestimmt die Geschwindigkeit.</div>
      </section>`;
    return `
      <section class="panel">
        <h3>Design</h3>
        <div class="grid">
          <label class="full">Globale Halo Designsprache übernehmen
            <select data-path="sidebar.appearance.inherit_global">
              <option value="true" ${inheritGlobal ? "selected":""}>Ja (empfohlen)</option>
              <option value="false" ${!inheritGlobal ? "selected":""}>Nein – Sidebar separat gestalten</option>
            </select>
          </label>
        </div>
        <div class="hint">Wenn aktiv, übernimmt die Sidebar Preset, Akzent, Textfarbe, Radius, Glass-Effekt sowie den kompletten Gradient Designer inklusive Animation direkt aus dem globalen Design-Tab.</div>
        <div class="grid" style="margin-top:12px">
          <label>Design-Preset
            <select data-path="sidebar.appearance.preset" ${disabled}>
              ${["gradient","glass","minimal"].map(v =>
                `<option value="${v}" ${a.preset===v?"selected":""}>${v}</option>`
              ).join("")}
            </select>
          </label>
          <label>Akzentfarbe<input type="color" data-path="sidebar.appearance.accent" value="${esc(a.accent || "#00b8e6")}" ${disabled}></label>
          <label>Textfarbe<input type="color" data-path="sidebar.appearance.text_color" value="${esc(a.text_color || "#ffffff")}" ${disabled}></label>
          <label>Radius (px)<input type="number" data-path="sidebar.appearance.radius" value="${this._num(a.radius,0)}" ${disabled}></label>
          <label>Glass-Effekt
            <select data-path="sidebar.appearance.glass" ${disabled}>
              <option value="true" ${a.glass !== false ? "selected":""}>An</option>
              <option value="false" ${a.glass === false ? "selected":""}>Aus</option>
            </select>
          </label>
          <label>Blur (px)<input type="number" data-path="sidebar.appearance.blur" value="${this._num(a.blur,18)}" ${disabled}></label>
          <label>Animationsdauer (s)<input type="number" min="1" step="1" data-path="sidebar.appearance.animation_speed" value="${this._num(a.animation_speed,30)}" ${disabled}></label>
        </div>
      </section>
      ${gradientDesigner}
    `;
  }

  _tabBackground() {
    const b = this._config.sidebar?.background || {};
    const w = this._config.sidebar?.weather || {};
    const videos = b.weather_videos || {};
    const videoFields = [
      ["sunny","☀️ Sonnig"],
      ["clear-night","🌙 Klare Nacht"],
      ["partlycloudy","⛅ Teilweise bewölkt"],
      ["cloudy","☁️ Bewölkt"],
      ["rainy","🌧️ Regen"],
      ["pouring","🌧️ Starkregen"],
      ["lightning","⚡ Gewitter"],
      ["lightning-rainy","⛈️ Gewitter + Regen"],
      ["snowy","❄️ Schnee"],
      ["fog","🌫️ Nebel"],
      ["windy","💨 Windig"]
    ];

    return `
      <section class="panel">
        <h3>Hintergrund</h3>
        <div class="grid">
          <label>Typ
            <select data-path="sidebar.background.type">
              ${["glass","animated-gradient","gradient","weather","weather-video","image","video"].map(v =>
                `<option value="${v}" ${b.type===v?"selected":""}>${v}</option>`
              ).join("")}
            </select>
          </label>
          <label>Deckkraft<input type="number" step="0.05" min="0" max="1" data-path="sidebar.background.opacity" value="${Number(b.opacity ?? 1)}"></label>
          <label class="full">Bild<input data-path="sidebar.background.image" value="${esc(b.image || "")}" placeholder="/local/halo/background.jpg oder https://..."></label>
          <label class="full">Einzelnes Video<input data-path="sidebar.background.video" value="${esc(b.video || "")}" placeholder="/local/halo/video.webm oder https://example.com/video.mp4"></label>
        </div>
        <div class="hint">„glass“ nutzt einen transparenten, weichgezeichneten Hintergrund mit dezenten Akzent-Glows. So bleibt der Dashboard-Hintergrund sichtbar und die Sidebar wirkt weniger dominant.</div>
      </section>

      <section class="panel">
        <div class="list-head">
          <div>
            <h3>Halo Weather Background Engine</h3>
            <div class="hint">Animierte CSS-Effekte direkt aus dem Wetterstatus.</div>
          </div>
          <span class="engine-badge">CSS v1</span>
        </div>
        <div class="weather-testbar">
          <span>Schnelltest:</span>
          ${[
            ["auto","Auto"],
            ["sunny","☀️"],
            ["clear-night","🌙"],
            ["partlycloudy","⛅"],
            ["rainy","🌧️"],
            ["lightning-rainy","⛈️"],
            ["snowy","❄️"],
            ["fog","🌫️"]
          ].map(([value,label]) =>
            `<button type="button" data-weather-test="${value}" class="${String(b.weather_condition||"auto")===value?"active":""}" title="${value}">${label}</button>`
          ).join("")}
        </div>
        <div class="grid">
          <label>Wettereffekte
            <select data-path="sidebar.background.weather_effects">
              <option value="true" ${b.weather_effects===true?"selected":""}>Immer zusätzlich aktiv</option>
              <option value="false" ${b.weather_effects!==true?"selected":""}>Nur bei Wetter-Hintergrund</option>
            </select>
          </label>
          <label>Wetterzustand
            <select data-path="sidebar.background.weather_condition">
              ${[
                ["auto","Automatisch"],
                ["sunny","Sonnig"],
                ["clear-night","Klare Nacht"],
                ["partlycloudy","Teilweise bewölkt"],
                ["cloudy","Bewölkt"],
                ["rainy","Regen"],
                ["pouring","Starkregen"],
                ["lightning","Gewitter"],
                ["lightning-rainy","Gewitter + Regen"],
                ["snowy","Schnee"],
                ["fog","Nebel"],
                ["windy","Windig"]
              ].map(([v,label]) => `<option value="${v}" ${String(b.weather_condition||"auto")===v?"selected":""}>${label}</option>`).join("")}
            </select>
          </label>
          <label>Effektstärke
            <input type="range" min="0" max="1" step="0.05" data-path="sidebar.background.effect_intensity" value="${Number(b.effect_intensity ?? .55)}">
          </label>
          <label>Geschwindigkeit
            <input type="range" min="0.25" max="2.5" step="0.05" data-path="sidebar.background.effect_speed" value="${Number(b.effect_speed ?? 1)}">
          </label>
          <label>„Bewegung reduzieren“ beachten
            <select data-path="sidebar.background.reduce_motion">
              <option value="true" ${b.reduce_motion!==false?"selected":""}>Ja</option>
              <option value="false" ${b.reduce_motion===false?"selected":""}>Nein</option>
            </select>
          </label>
          <label>Wetter-Modus
            <select data-path="sidebar.background.weather_mode">
              <option value="css" ${b.weather_mode !== "video" ? "selected":""}>CSS Engine</option>
              <option value="video" ${b.weather_mode === "video" ? "selected":""}>Weather Video</option>
            </select>
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="list-head">
          <div>
            <h3>Weather Video Engine</h3>
            <div class="hint">Lokale Dateien und direkte Internet-Adressen werden gleich behandelt.</div>
          </div>
          <span class="engine-badge">VIDEO v1</span>
        </div>

        <div class="grid">
          <label class="full">Standard-/Fallback-Video
            <input
              data-path="sidebar.background.weather_video_default"
              value="${esc(b.weather_video_default || "")}"
              placeholder="https://.../default.webm oder /local/halo/weather/default.webm"
            >
          </label>

          <label>Video-Deckkraft
            <input type="range" min="0" max="1" step="0.05"
              data-path="sidebar.background.weather_video_opacity"
              value="${Number(b.weather_video_opacity ?? .82)}">
          </label>

          <label>Dunkles Overlay
            <input type="range" min="0" max="0.8" step="0.05"
              data-path="sidebar.background.weather_video_overlay"
              value="${Number(b.weather_video_overlay ?? .18)}">
          </label>

          <label>Video-Füllung
            <select data-path="sidebar.background.weather_video_fit">
              <option value="cover" ${b.weather_video_fit!=="contain" && b.weather_video_fit!=="fill" ? "selected":""}>Cover</option>
              <option value="contain" ${b.weather_video_fit==="contain" ? "selected":""}>Contain</option>
              <option value="fill" ${b.weather_video_fit==="fill" ? "selected":""}>Fill</option>
            </select>
          </label>

          <label>CSS-Fallback bei Video-Fehler
            <select data-path="sidebar.background.weather_video_fallback_css">
              <option value="true" ${b.weather_video_fallback_css!==false?"selected":""}>Ja</option>
              <option value="false" ${b.weather_video_fallback_css===false?"selected":""}>Nein</option>
            </select>
          </label>

          <label>Performance-Profil
            <select data-path="sidebar.background.performance_profile">
              <option value="auto" ${(b.performance_profile || "auto")==="auto"?"selected":""}>Auto (empfohlen)</option>
              <option value="high" ${b.performance_profile==="high"?"selected":""}>High</option>
              <option value="balanced" ${b.performance_profile==="balanced"?"selected":""}>Balanced</option>
              <option value="eco" ${b.performance_profile==="eco"?"selected":""}>Eco / Standbild</option>
            </select>
          </label>

          <label>Video Performance Mode
            <select data-path="sidebar.background.video_performance_mode">
              <option value="true" ${b.video_performance_mode!==false?"selected":""}>An (empfohlen)</option>
              <option value="false" ${b.video_performance_mode===false?"selected":""}>Aus</option>
            </select>
          </label>

          <label>Video pausieren wenn Seite unsichtbar
            <select data-path="sidebar.background.pause_when_hidden">
              <option value="true" ${b.pause_when_hidden!==false?"selected":""}>Ja</option>
              <option value="false" ${b.pause_when_hidden===false?"selected":""}>Nein</option>
            </select>
          </label>

          <label>Video pausieren außerhalb Sichtbereich
            <select data-path="sidebar.background.pause_when_offscreen">
              <option value="true" ${b.pause_when_offscreen!==false?"selected":""}>Ja</option>
              <option value="false" ${b.pause_when_offscreen===false?"selected":""}>Nein</option>
            </select>
          </label>

          <label>CSS-Wettereffekte zusätzlich
            <select data-path="sidebar.background.video_allow_css_weather_fx">
              <option value="false" ${b.video_allow_css_weather_fx!==true?"selected":""}>Nein (empfohlen)</option>
              <option value="true" ${b.video_allow_css_weather_fx===true?"selected":""}>Ja</option>
            </select>
          </label>
        </div>

        <div class="notice">
          <strong>Performance v0.7:</strong> „Auto“ erkennt grob Touch-Geräte, Displaybreite,
          CPU-Kerne, verfügbaren Browser-Speicher und Reduced-Motion. Auf typischen Tablets wird
          dadurch „Balanced“ gewählt. „Eco“ zeigt nur ein Videoframe. Unsichtbare Seiten werden
          automatisch pausiert.
        </div>

        <div class="video-map">
          ${videoFields.map(([key,label]) => `
            <label class="video-url-row">
              <span>${label}</span>
              <input
                data-video-condition="${key}"
                value="${esc(videos[key] || "")}"
                placeholder="https://... oder /local/..."
              >
            </label>
          `).join("")}
        </div>

        <div class="notice">
          <strong>Internet-URL:</strong> Am besten eine direkte <code>https://</code>-Adresse zu
          <code>.webm</code> oder <code>.mp4</code>. Webseiten-URLs wie YouTube-Seiten sind keine
          direkten Videodateien. Wenn ein externer Server Wiedergabe/Hotlinking blockiert,
          fällt Halo optional auf den CSS-Wettereffekt zurück.
        </div>
      </section>

      <section class="panel">
        <h3>Wetterdaten</h3>
        <div class="grid">
          <label>Wetter anzeigen
            <select data-path="sidebar.weather.enabled">
              <option value="true" ${w.enabled===true?"selected":""}>Ja</option>
              <option value="false" ${w.enabled!==true?"selected":""}>Nein</option>
            </select>
          </label>
          <label>Temperatur anzeigen
            <select data-path="sidebar.weather.show_temperature">
              <option value="true" ${w.show_temperature!==false?"selected":""}>Ja</option>
              <option value="false" ${w.show_temperature===false?"selected":""}>Nein</option>
            </select>
          </label>
          <label class="full">Wetter-Entity<div class="ha-selector-host" data-selector-kind="entity" data-selector-domain="weather" data-selector-scope="path" data-selector-path="sidebar.weather.entity" data-selector-value="${esc(w.entity || "")}"></div><span class="field-note">Leer = automatisch erste weather.* Entity verwenden</span></label>
          <label>Bedingung anzeigen
            <select data-path="sidebar.weather.show_condition">
              <option value="true" ${w.show_condition!==false?"selected":""}>Ja</option>
              <option value="false" ${w.show_condition===false?"selected":""}>Nein</option>
            </select>
          </label>
        </div>
        <div class="hint">Zum Testen kannst du oben einen festen Wetterzustand auswählen. Bei „Automatisch“ folgt Halo wieder der Wetter-Entity.</div>
      </section>
    `;
  }

  _tabNavigation() {
    const n = this._config.sidebar?.navigation || {};
    return `
      <section class="panel">
        <div class="list-head">
          <div>
            <h3>Navigation</h3>
            <div class="hint">Jeder Punkt kann Pfad, Icon und optional ein Entity-Badge besitzen.</div>
          </div>
          <button class="primary" data-add-nav>+ Hinzufügen</button>
        </div>
        <div class="grid">
          <label>Darstellung
            <select data-path="sidebar.navigation.style">
              <option value="auto" ${(n.style || "auto")==="auto"?"selected":""}>Automatisch</option>
              <option value="list" ${n.style==="list"?"selected":""}>Liste</option>
              <option value="cards" ${n.style==="cards"?"selected":""}>Glass-Karten</option>
              <option value="icons" ${n.style==="icons"?"selected":""}>Icon-Leiste</option>
              <option value="icons-only" ${n.style==="icons-only"?"selected":""}>Icons vertikal</option>
              <option value="floating" ${n.style==="floating"?"selected":""}>Floating Icons</option>
            </select>
          </label>
          <label>Beschriftungen anzeigen
            <select data-path="sidebar.navigation.show_labels">
              <option value="true" ${n.show_labels!==false?"selected":""}>Ja</option>
              <option value="false" ${n.show_labels===false?"selected":""}>Nein</option>
            </select>
          </label>
        </div>
        <div class="hint">Im Dashboard-Preset verwendet „Automatisch“ jetzt eine lesbare Liste mit deutlich markierter aktiver Seite. Für eine reine Icon-Navigation kannst du jederzeit „Icon-Leiste“ wählen.</div>
        <div class="list">${this._renderNavItems()}</div>
      </section>
    `;
  }

  _tabPresence() {
    const p = this._config.sidebar?.presence || {};
    return `
      <section class="panel">
        <div class="list-head">
          <div>
            <h3>Personen / Presence</h3>
            <div class="hint">Eigene Bilder für Zuhause und Abwesend sind optional.</div>
          </div>
          <button class="primary" data-add-person>+ Hinzufügen</button>
        </div>
        <div class="grid">
          <label>Presence anzeigen
            <select data-path="sidebar.presence.enabled">
              <option value="true" ${p.enabled===true?"selected":""}>Ja</option>
              <option value="false" ${p.enabled!==true?"selected":""}>Nein</option>
            </select>
          </label>
          <label>Darstellung
            <select data-path="sidebar.presence.layout">
              <option value="cards" ${(p.layout||"cards")==="cards"?"selected":""}>Karten</option>
              <option value="compact" ${p.layout==="compact"?"selected":""}>Kompakt</option>
              <option value="avatars" ${p.layout==="avatars"?"selected":""}>Avatare</option>
            </select>
          </label>
          <label>Status anzeigen
            <select data-path="sidebar.presence.show_status">
              <option value="true" ${p.show_status!==false?"selected":""}>Ja</option>
              <option value="false" ${p.show_status===false?"selected":""}>Nein</option>
            </select>
          </label>
          <label>Status-Icon
            <select data-path="sidebar.presence.show_status_icon">
              <option value="true" ${p.show_status_icon!==false?"selected":""}>Ja</option>
              <option value="false" ${p.show_status_icon===false?"selected":""}>Nein</option>
            </select>
          </label>
          <label>Klick öffnet Person
            <select data-path="sidebar.presence.click_more_info">
              <option value="true" ${p.click_more_info!==false?"selected":""}>Ja</option>
              <option value="false" ${p.click_more_info===false?"selected":""}>Nein</option>
            </select>
          </label>
        </div>
        <div class="hint">Status: „Zuhause“, „Unterwegs“ oder der aktuelle Zonenname. Ein Klick kann direkt den Home-Assistant-Mehr-Info-Dialog der Person öffnen.</div>
        <div class="list">${this._renderPresenceItems()}</div>
      </section>
    `;
  }

  _content() {
    switch (this._activeTab) {
      case "design": return this._tabDesign();
      case "background": return this._tabBackground();
      case "navigation": return this._tabNavigation();
      case "presence": return this._tabPresence();
      default: return this._tabGeneral();
    }
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
          const scope = host.dataset.selectorScope;
          const cfg = structuredClone(this._config);
          if (scope === "nav") {
            const i = Number(host.dataset.selectorIndex);
            const item = cfg.sidebar.navigation.items[i];
            if (!item) return;
            const key = host.dataset.selectorKey;
            if (key === "badge.entity") {
              item.badge ??= {};
              if (value) item.badge.entity = value; else delete item.badge;
            } else item[key] = value;
            this._emit(cfg, true);
          } else if (scope === "person") {
            const i = Number(host.dataset.selectorIndex);
            const item = cfg.sidebar.presence.entities[i];
            if (!item) return;
            item.entity = value;
            if (!item.name || item.name === "Person") {
              item.name = this._hass?.states?.[value]?.attributes?.friendly_name || "";
            }
            this._emit(cfg, true);
          } else {
            this._setPath(host.dataset.selectorPath, value || null, false, true);
          }
        });
        host.replaceChildren(selector);
      }
    });
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{
          display:block;
          padding:4px 8px 16px;
          font-family:var(--primary-font-family,Arial);
          color:var(--primary-text-color,#fff)
        }
        .top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
        .title{font-size:18px;font-weight:700}
        .version{font-size:11px;color:var(--secondary-text-color,#999)}
        .tabs{
          display:flex;gap:6px;overflow-x:auto;padding:4px 0 12px;
          border-bottom:1px solid var(--divider-color,#444);margin-bottom:14px
        }
        .tab{
          border:0;background:transparent;color:var(--secondary-text-color,#aaa);
          padding:8px 10px;border-radius:9px;cursor:pointer;white-space:nowrap;font-weight:600
        }
        .tab.active{background:color-mix(in srgb,var(--primary-color,#03a9f4) 18%,transparent);color:var(--primary-color,#03a9f4)}
        .panel{
          border:1px solid var(--divider-color,#444);
          border-radius:14px;padding:14px;margin:0 0 14px;
          background:color-mix(in srgb,var(--card-background-color,#222) 93%,transparent)
        }
        h3{margin:0 0 12px;font-size:15px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .full{grid-column:1/-1}
        label{display:grid;gap:6px;font-size:12px;color:var(--secondary-text-color,#aaa)}
        input,select{
          min-width:0;padding:9px 10px;border-radius:9px;
          border:1px solid var(--divider-color,#555);
          background:var(--card-background-color,#222);
          color:var(--primary-text-color,#fff);
          box-sizing:border-box
        }
        input[type="color"]{padding:3px;height:38px}
        .list{display:grid;gap:10px;margin-top:12px}
        .list-card{
          border:1px solid var(--divider-color,#444);border-radius:12px;
          padding:12px;background:rgba(255,255,255,.025)
        }
        .list-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
        .list-head h3{margin:0}
        button{font:inherit;cursor:pointer}
        .primary{
          background:var(--primary-color,#03a9f4);color:#081014;border:0;
          border-radius:9px;padding:8px 11px;font-weight:700
        }
        .danger{
          border:0;background:rgba(229,57,53,.16);color:#ff6b67;
          width:30px;height:30px;border-radius:9px
        }
        .row-actions{display:flex;gap:5px;align-items:center}
        .move{
          border:1px solid var(--divider-color,#555);
          background:rgba(255,255,255,.04);
          color:var(--primary-text-color,#fff);
          width:30px;height:30px;border-radius:9px
        }
        .move:disabled{opacity:.25;cursor:not-allowed}
        .item-title{display:flex;align-items:center;gap:9px;min-width:0}
        .item-preview{
          width:34px;height:34px;border-radius:10px;
          display:grid;place-items:center;
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.08);
          flex:0 0 auto
        }
        .icon-preview ha-icon{color:var(--primary-color,#03a9f4)}
        .person-preview img{width:30px;height:30px;object-fit:contain;border-radius:8px}
        .engine-badge{
          padding:4px 8px;border-radius:999px;
          background:color-mix(in srgb,var(--primary-color,#03a9f4) 18%,transparent);
          color:var(--primary-color,#03a9f4);font-size:11px;font-weight:800
        }
        input[type="range"]{padding:0;accent-color:var(--primary-color,#03a9f4)}
        .weather-testbar{
          display:flex;
          align-items:center;
          gap:6px;
          flex-wrap:wrap;
          margin:10px 0 14px
        }
        .weather-testbar span{
          font-size:11px;
          color:var(--secondary-text-color,#999);
          margin-right:2px
        }
        .weather-testbar button{
          border:1px solid var(--divider-color,#555);
          background:rgba(255,255,255,.04);
          color:var(--primary-text-color,#fff);
          min-width:34px;
          height:30px;
          border-radius:9px;
          cursor:pointer
        }
        .weather-testbar button.active{
          border-color:var(--primary-color,#03a9f4);
          background:color-mix(in srgb,var(--primary-color,#03a9f4) 22%,transparent)
        }
        .video-map{
          display:grid;
          gap:8px;
          margin-top:14px;
          padding-top:14px;
          border-top:1px solid var(--divider-color,#444)
        }
        .video-url-row{
          display:grid;
          grid-template-columns:150px minmax(0,1fr);
          align-items:center;
          gap:10px
        }
        .video-url-row span{color:var(--primary-text-color,#fff);font-size:12px}
        .notice{
          margin-top:14px;
          padding:10px 12px;
          border-radius:10px;
          border:1px solid color-mix(in srgb,var(--primary-color,#03a9f4) 25%,var(--divider-color,#444));
          background:color-mix(in srgb,var(--primary-color,#03a9f4) 7%,transparent);
          font-size:11px;
          line-height:1.5;
          color:var(--secondary-text-color,#aaa)
        }
        .notice code{color:var(--primary-text-color,#fff)}
        .hint{font-size:11px;color:var(--secondary-text-color,#999);line-height:1.45}
        .empty{
          padding:18px;border:1px dashed var(--divider-color,#555);border-radius:10px;
          color:var(--secondary-text-color,#999);font-size:12px;text-align:center
        }
        .colors{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .inline-toggle{
          display:grid;grid-template-columns:1fr 140px;align-items:center;gap:12px
        }
        .ha-selector-host{min-height:38px}
        .ha-selector-host ha-selector{display:block;width:100%}
        .field-note{font-size:10px;color:var(--secondary-text-color,#999)}
        .gradient-designer{overflow:hidden}
        .gradient-preview{height:138px;border-radius:12px;border:1px solid rgba(255,255,255,.14);margin:12px 0 16px;box-shadow:inset 0 1px rgba(255,255,255,.08)}
        .gradient-track{position:relative;height:18px;border-radius:999px;margin:0 10px 22px;border:1px solid rgba(255,255,255,.16)}
        .gradient-stop{position:absolute;top:50%;width:22px;height:28px;transform:translate(-50%,-50%);border:2px solid #fff;border-radius:7px;background:var(--stop-color);box-shadow:0 2px 9px rgba(0,0,0,.5);cursor:ew-resize;padding:0}
        .gradient-stop:after{content:"";position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #fff}
        .gradient-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
        .secondary{border:1px solid var(--divider-color,#555);background:rgba(255,255,255,.04);color:var(--primary-text-color,#fff);border-radius:9px;padding:8px 10px;cursor:pointer}
        .gradient-geometry{display:grid;grid-template-columns:180px 1fr;gap:18px;align-items:center;margin:14px 0}
        .angle-wrap{display:grid;gap:7px;justify-items:center}.angle-wrap>input{width:170px}
        .angle-dial{position:relative;width:138px;height:138px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.06) 0 46%,transparent 47%),conic-gradient(from -90deg,rgba(255,255,255,.22),rgba(255,255,255,.04),rgba(255,255,255,.22));border:1px solid rgba(255,255,255,.16);cursor:crosshair;touch-action:none}
        .dial-ring{position:absolute;inset:11px;border:1px dashed rgba(255,255,255,.17);border-radius:50%}.dial-center{position:absolute;left:50%;top:50%;width:9px;height:9px;border-radius:50%;background:var(--primary-color,#03a9f4);transform:translate(-50%,-50%);box-shadow:0 0 12px var(--primary-color,#03a9f4)}
        .dial-hand{position:absolute;left:50%;top:50%;width:3px;height:43%;background:linear-gradient(to top,var(--primary-color,#03a9f4),#fff);transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(calc(var(--halo-angle,0) * 1deg))}.dial-hand:after{content:"";position:absolute;left:50%;top:-4px;width:10px;height:10px;border-radius:50%;background:#fff;transform:translateX(-50%)}
        .dial-value{position:absolute;left:50%;top:50%;transform:translate(-50%,16px);font-size:11px;font-weight:800}.angle-dial::before{content:"0°";position:absolute;top:3px;left:50%;transform:translateX(-50%);font-size:8px;color:var(--secondary-text-color,#999)}
        .center-controls{display:grid;gap:14px}.center-controls label{grid-template-columns:96px 1fr 42px;align-items:center}.center-controls label input{min-height:22px}.center-controls label span{text-align:right;font-size:10px}.muted{opacity:.38}
        .gradient-stop-list{display:grid;gap:7px}.gradient-stop-row{display:grid;grid-template-columns:52px minmax(0,1fr) 34px;gap:8px;align-items:center;padding:7px;border:1px solid var(--divider-color,#444);border-radius:10px;background:rgba(255,255,255,.02)}.gradient-stop-row>input[type=color]{height:36px}.gradient-stop-row label{grid-template-columns:58px 1fr 40px;align-items:center}.gradient-stop-row label input{min-height:22px}.gradient-stop-row label span{text-align:right;font-size:10px}.gradient-stop-row .danger:disabled{opacity:.25}
        @media(max-width:650px){
          .grid,.colors{grid-template-columns:1fr}
          .full{grid-column:auto}
          .inline-toggle{grid-template-columns:1fr}
          .video-url-row{grid-template-columns:1fr}
        }
      </style>

      <div class="top">
        <div>
          <div class="title">Halo Sidebar</div>
          <div class="version">Visual Editor 2.3 · v${HALO_VERSION}</div>
        </div>
      </div>

      <div class="tabs">
        ${[
          ["general","Allgemein"],
          ["design","Design"],
          ["background","Wetter & Hintergrund"],
          ["navigation","Navigation"],
          ["presence","Personen"]
        ].map(([id,label]) => `<button class="tab ${this._activeTab===id?"active":""}" data-tab="${id}">${label}</button>`).join("")}
      </div>

      ${this._content()}
    `;

    localizeHaloDom(this.shadowRoot, this._hass);
    this._initHaSelectors();

    this.shadowRoot.querySelectorAll("[data-tab]").forEach(el => {
      el.addEventListener("click", () => {
        this._activeTab = el.dataset.tab;
        this._persistActiveTab();
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-path]").forEach(el => {
      const readValue = () => {
        let value = el.value;
        if (value === "true") value = true;
        else if (value === "false") value = false;
        else if (el.type === "number") value = Number(value);
        return value;
      };

      if (el.tagName === "SELECT") {
        el.addEventListener("change", () => {
          this._setPath(el.dataset.path, readValue(), true, true);
        });
      } else {
        // Stage locally while typing/sliding. The outer Halo editor only
        // notifies Home Assistant on change/blur, so focus and caret remain.
        el.addEventListener("input", () => {
          this._setPath(el.dataset.path, readValue(), false, false);
        });
        el.addEventListener("change", () => {
          this._setPath(el.dataset.path, readValue(), false, true);
        });
      }
    });

    this.shadowRoot.querySelectorAll("[data-color-index]").forEach(el => {
      const updateColor = (commit) => {
        const cfg = structuredClone(this._config);
        cfg.sidebar ??= {};
        cfg.sidebar.appearance ??= {};
        cfg.sidebar.appearance.background = Array.isArray(cfg.sidebar.appearance.background)
          ? [...cfg.sidebar.appearance.background]
          : ["#210443","#8a2be2","#ff8ad4"];
        cfg.sidebar.appearance.background[Number(el.dataset.colorIndex)] = el.value;
        this._emit(cfg, commit);
      };
      el.addEventListener("input", () => updateColor(false));
      el.addEventListener("change", () => updateColor(true));
    });

    // Sidebar Gradient Designer ------------------------------------------------
    const sgRead = () => haloGradient(this._config.sidebar?.appearance || {});
    const sgWrite = (g, commit = true, rerender = false) => {
      const cfg = structuredClone(this._config);
      cfg.sidebar ??= {};
      cfg.sidebar.appearance ??= {};
      const gradient = structuredClone(g);
      gradient.stops = [...gradient.stops].sort((a,b)=>Number(a.position)-Number(b.position));
      cfg.sidebar.appearance.gradient = gradient;
      cfg.sidebar.appearance.gradient_angle = gradient.angle;
      // Keep legacy colors in sync for backwards compatibility and presets.
      cfg.sidebar.appearance.background = gradient.stops.map(st=>st.color);
      this._emit(cfg, commit);
      if (rerender) this._render();
    };
    const sgStage = (g) => sgWrite(g, false, false);
    const sgRefresh = (g) => {
      const css = haloGradientCss({gradient:g,background:g.stops.map(st=>st.color),gradient_angle:g.angle});
      const preview = this.shadowRoot.querySelector(".gradient-preview"); if (preview) preview.style.background = css;
      const track = this.shadowRoot.querySelector("[data-sg-track]"); if (track) track.style.background = css;
      const dial = this.shadowRoot.querySelector("[data-sg-dial]"); if (dial) dial.style.setProperty("--halo-angle", String(g.angle));
      const val = this.shadowRoot.querySelector(".dial-value"); if (val) val.textContent = `${Math.round(g.angle)}°`;
    };
    this.shadowRoot.querySelectorAll("[data-sg-field]").forEach(el => el.addEventListener("change", () => {
      const g = sgRead(); g[el.dataset.sgField] = el.value; sgWrite(g, true, true);
    }));
    this.shadowRoot.querySelector("[data-sg-add]")?.addEventListener("click", () => {
      const g = sgRead(); if (g.stops.length >= 12) return;
      let pos = 50, bestGap = -1;
      for (let i=0;i<g.stops.length-1;i++) { const gap=g.stops[i+1].position-g.stops[i].position; if(gap>bestGap){bestGap=gap;pos=(g.stops[i].position+g.stops[i+1].position)/2;} }
      const base = g.stops[Math.floor(g.stops.length/2)]?.color || "#ffffff";
      g.stops.push({color:base,position:pos}); sgWrite(g,true,true);
    });
    this.shadowRoot.querySelectorAll("[data-sg-delete]").forEach(btn => btn.addEventListener("click", () => {
      const g=sgRead(); if(g.stops.length<=2)return; g.stops.splice(Number(btn.dataset.sgDelete),1); sgWrite(g,true,true);
    }));
    this.shadowRoot.querySelector("[data-sg-even]")?.addEventListener("click", () => {
      const g=sgRead(), last=Math.max(1,g.stops.length-1); g.stops.forEach((st,i)=>st.position=i/last*100); sgWrite(g,true,true);
    });
    this.shadowRoot.querySelector("[data-sg-reverse]")?.addEventListener("click", () => {
      const g=sgRead(); g.stops=g.stops.map(st=>({color:st.color,position:100-st.position})).reverse(); sgWrite(g,true,true);
    });
    this.shadowRoot.querySelectorAll("[data-sg-color]").forEach(el => {
      const idx=Number(el.dataset.sgColor);
      el.addEventListener("input",()=>{const g=sgRead();if(g.stops[idx])g.stops[idx].color=el.value;sgStage(g);sgRefresh(g);});
      el.addEventListener("change",()=>{const g=sgRead();if(g.stops[idx])g.stops[idx].color=el.value;sgWrite(g,true,false);});
    });
    this.shadowRoot.querySelectorAll("[data-sg-position]").forEach(el => {
      const idx=Number(el.dataset.sgPosition);
      const update=(commit=false)=>{const g=sgRead();if(!g.stops[idx])return;g.stops[idx].position=Number(el.value);if(commit)sgWrite(g,true,true);else{sgStage(g);sgRefresh(g);const lab=this.shadowRoot.querySelector(`[data-sg-position-label="${idx}"]`);if(lab)lab.textContent=`${Math.round(Number(el.value))}%`;}};
      el.addEventListener("input",()=>update(false)); el.addEventListener("change",()=>update(true));
    });
    const sgAngle=this.shadowRoot.querySelector("[data-sg-angle]");
    const sgSetAngle=(value,commit=false)=>{const g=sgRead();g.angle=Math.max(0,Math.min(360,Number(value)||0));if(sgAngle)sgAngle.value=String(g.angle);if(commit)sgWrite(g,true,false);else{sgStage(g);sgRefresh(g);}};
    sgAngle?.addEventListener("input",()=>sgSetAngle(sgAngle.value,false)); sgAngle?.addEventListener("change",()=>sgSetAngle(sgAngle.value,true));
    const sgDial=this.shadowRoot.querySelector("[data-sg-dial]"); if(sgDial){let dragging=false;const point=(ev,commit=false)=>{const r=sgDial.getBoundingClientRect();const dx=ev.clientX-(r.left+r.width/2),dy=ev.clientY-(r.top+r.height/2);const deg=(Math.atan2(dy,dx)*180/Math.PI+90+360)%360;sgSetAngle(Math.round(deg),commit);};sgDial.addEventListener("pointerdown",ev=>{dragging=true;sgDial.setPointerCapture?.(ev.pointerId);point(ev,false);ev.preventDefault();});sgDial.addEventListener("pointermove",ev=>{if(dragging)point(ev,false);});sgDial.addEventListener("pointerup",ev=>{if(!dragging)return;dragging=false;point(ev,true);});}
    this.shadowRoot.querySelectorAll("[data-sg-center]").forEach(el => {const axis=el.dataset.sgCenter;const update=(commit=false)=>{const g=sgRead();g[axis==="x"?"center_x":"center_y"]=Number(el.value);if(commit)sgWrite(g,true,false);else{sgStage(g);sgRefresh(g);const sp=el.parentElement?.querySelector("span");if(sp)sp.textContent=`${Math.round(Number(el.value))}%`;}};el.addEventListener("input",()=>update(false));el.addEventListener("change",()=>update(true));});
    this.shadowRoot.querySelectorAll("[data-sg-stop]").forEach(handle => {let dragging=false;const idx=Number(handle.dataset.sgStop);const move=(ev,commit=false)=>{const track=this.shadowRoot.querySelector("[data-sg-track]");if(!track)return;const r=track.getBoundingClientRect();const pos=Math.max(0,Math.min(100,((ev.clientX-r.left)/r.width)*100));const g=sgRead();if(!g.stops[idx])return;g.stops[idx].position=pos;handle.style.left=`${pos}%`;if(commit)sgWrite(g,true,true);else{sgStage(g);sgRefresh(g);}};handle.addEventListener("pointerdown",ev=>{dragging=true;handle.setPointerCapture?.(ev.pointerId);ev.preventDefault();});handle.addEventListener("pointermove",ev=>{if(dragging)move(ev,false);});handle.addEventListener("pointerup",ev=>{if(!dragging)return;dragging=false;move(ev,true);});});

    this.shadowRoot.querySelectorAll("[data-weather-test]").forEach(el => {
      el.addEventListener("click", () => {
        this._setPath("sidebar.background.weather_condition", el.dataset.weatherTest, true);
      });
    });

    this.shadowRoot.querySelectorAll("[data-video-condition]").forEach(el => {
      const updateVideo = (commit) => {
        const cfg = structuredClone(this._config);
        cfg.sidebar ??= {};
        cfg.sidebar.background ??= {};
        cfg.sidebar.background.weather_videos ??= {};
        cfg.sidebar.background.weather_videos[el.dataset.videoCondition] = el.value.trim();
        this._emit(cfg, commit);
      };
      el.addEventListener("input", () => updateVideo(false));
      el.addEventListener("change", () => updateVideo(true));
    });

    this.shadowRoot.querySelectorAll("[data-nav-index]").forEach(el => {
      const update = (commit) => {
        const index = Number(el.dataset.navIndex);
        const key = el.dataset.navKey;
        const cfg = structuredClone(this._config);
        const item = cfg.sidebar.navigation.items[index];

        if (key === "badge.entity") {
          item.badge ??= {};
          if (el.value) item.badge.entity = el.value;
          else delete item.badge;
        } else {
          item[key] = el.value;
        }

        this._emit(cfg, commit);
      };
      if (el.tagName === "SELECT") {
        el.addEventListener("change", () => update(true));
      } else {
        el.addEventListener("input", () => update(false));
        el.addEventListener("change", () => update(true));
      }
    });

    this.shadowRoot.querySelectorAll("[data-person-index]").forEach(el => {
      const update = (commit) => {
        const index = Number(el.dataset.personIndex);
        const key = el.dataset.personKey;
        const cfg = structuredClone(this._config);
        cfg.sidebar.presence.entities[index][key] = el.value;
        this._emit(cfg, commit);
      };
      el.addEventListener("input", () => update(false));
      el.addEventListener("change", () => update(true));
    });

    this.shadowRoot.querySelector("[data-add-nav]")?.addEventListener("click", () => {
      this._addArrayItem("sidebar.navigation.items", {
        name:"Neue Seite",
        icon:"mdi:home",
        path:"/dashboard-x/home",
        match:"exact"
      });
    });

    this.shadowRoot.querySelectorAll("[data-remove-nav]").forEach(el => {
      el.addEventListener("click", () => {
        this._removeArrayItem("sidebar.navigation.items", Number(el.dataset.removeNav));
      });
    });

    this.shadowRoot.querySelectorAll("[data-move-nav]").forEach(el => {
      el.addEventListener("click", () => {
        this._moveArrayItem(
          "sidebar.navigation.items",
          Number(el.dataset.moveNav),
          Number(el.dataset.delta)
        );
      });
    });

    this.shadowRoot.querySelector("[data-add-person]")?.addEventListener("click", () => {
      this._addArrayItem("sidebar.presence.entities", {
        entity:"person.",
        name:"Person",
        home_image:"",
        away_image:""
      });
    });

    this.shadowRoot.querySelectorAll("[data-remove-person]").forEach(el => {
      el.addEventListener("click", () => {
        this._removeArrayItem("sidebar.presence.entities", Number(el.dataset.removePerson));
      });
    });

    this.shadowRoot.querySelectorAll("[data-move-person]").forEach(el => {
      el.addEventListener("click", () => {
        this._moveArrayItem(
          "sidebar.presence.entities",
          Number(el.dataset.movePerson),
          Number(el.dataset.delta)
        );
      });
    });
  }
}

if (!customElements.get("halo-view-sidebar")) customElements.define("halo-view-sidebar", HaloViewSidebar);
if (!customElements.get("halo-view-sidebar-editor")) customElements.define("halo-view-sidebar-editor", HaloViewSidebarEditor);
