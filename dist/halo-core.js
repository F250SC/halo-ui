export const HALO_UI_VERSION = "0.10.44";

export const HALO_UI_DEFAULTS = {
  type: "custom:halo-ui",
  enabled: true,

  // Halo UI ownership / activation scope.
  // current_view = only the view containing this controller
  // dashboard    = every current and future view in this dashboard
  target: {
    mode: "current_view"
  },

  // Dashboard mode: all views inherit the root configuration.
  // Only differences are stored here, keyed by Lovelace view path.
  view_overrides: {},

  modules: {
    sidebar: true,
    background: false,
    surfaces: false,
    header: false,
    cards: false
  },
  layout: {
    position: "left",
    width: "320px",
    tablet_breakpoint: 1400,
    tablet_width: "280px",
    tablet_preset: "keep",
    tablet_header_mode: "compact",
    tablet_header_height: 58,
    tablet_header_margin: 10,
    mobile_breakpoint: 850,
    mobile_mode: "hide",
    mobile_header_mode: "compact",
    mobile_header_height: 52,
    mobile_header_margin: 8
  },

  // Global Performance Engine.
  // auto tries to identify lower-power clients such as Raspberry Pi browsers.
  performance: {
    profile: "auto"
  },
  design: {
    preset: "glass",
    look_preset: "custom",
    accent: "#00b8e6",
    text_color: "#ffffff",
    secondary_text_color: "rgba(255,255,255,.58)",
    colors: ["#210443", "#8a2be2", "#ff8ad4"],
    gradient_angle: 135,
    animation_speed: 30,
    // Gradient Designer v2. Legacy colors/gradient_angle stay mirrored for
    // backwards compatibility, while this object is the source of truth.
    gradient: {
      type: "linear",
      angle: 135,
      center_x: 50,
      center_y: 50,
      interpolation: "oklab",
      stops: [
        { color: "#210443", position: 0 },
        { color: "#8a2be2", position: 50 },
        { color: "#ff8ad4", position: 100 }
      ]
    },
    glass: true,
    blur: 18,
    radius: 18,

    // Halo Design Engine v1
    apply_accent_to_ha: true,
    surface_tint: "#14141a",
    surface_opacity: 0.34,
    surface_border_color: "#ffffff",
    surface_border_opacity: 0.14,
    surface_border_width: 1,
    surface_blur: 18,
    surface_saturation: 125,
    surface_shadow_strength: 0.28,
    surface_shadow_blur: 26,
    surface_style: "glass",
    surface_highlight_opacity: 0.08,

    // Semantic active-state colors. Halo keeps its own accent independent
    // from entity states, so a blue UI can still show lights as warm yellow.
    state_colors_enabled: true,
    state_light: "#ffd400",
    state_switch: "#22c55e",
    state_media_player: "#00b8e6",
    state_climate_heating: "#ff7a00",
    state_climate_cooling: "#4fc3f7",
    state_vacuum: "#00c8ff",
    state_warning: "#ff3b30",
    active_surface_tint: 0.08,
    active_glow_strength: 0.20,
    active_border_opacity: 0.78,
    active_border_width: 1,

    // Card compatibility layer. Halo keeps this variable-based and conservative:
    // native/custom card internals are not rewritten, but common control/text
    // tokens inherit the Halo design language where the card supports them.
    card_compatibility: true,
    card_compatibility_level: "balanced",
    card_inner_accent: true,
    card_control_tint: 0.22,
    card_complex_frame_only: true,

    // Dashboard layout / Sections integration. These values deliberately do
    // not force equal card heights; Halo only normalizes spacing and heading
    // presentation so native HA layouts keep their responsive behaviour.
    section_style: "accent-line",
    card_gap: 12,
    section_gap: 18,
    section_heading_size: 15,
    section_heading_weight: 600,
    section_heading_opacity: 0.92,

    // Responsive density. Native HA still owns column wrapping; Halo only
    // adjusts visual density so cards do not feel desktop-sized on tablets/phones.
    responsive_spacing: true,
    tablet_card_gap: 10,
    tablet_section_gap: 14,
    mobile_card_gap: 8,
    mobile_section_gap: 10
  },
  background: {
    // Which physical area the background covers:
    // view   = only the active Lovelace view area
    // screen = full browser viewport
    scope: "view",
    type: "animated-gradient",
    weather_entity: null,
    weather_condition: "auto",
    image: "",
    video: "",
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
    video_opacity: 1,
    overlay: 0.15,
    fit: "cover",
    // Optional dedicated media for narrow/mobile displays. The visual fit
    // stays identical to desktop; if a portrait/9:16 video is configured,
    // mobile gets that source instead of zooming a 16:9 desktop clip.
    mobile_breakpoint: 850,
    mobile_video: "",
    mobile_weather_video_default: "",
    mobile_weather_videos: {},
    performance_profile: "auto",
    pause_when_hidden: true,
    seamless_motion: true,
    video_loop_mode: "crossfade",
    video_crossfade: 0.65
  },
  sidebar: {
    layout: { preset: "dashboard" },
    // By default the sidebar follows the global Halo design language. Set
    // inherit_global:false in the Sidebar > Design tab to customize it independently.
    appearance: { inherit_global: true },
    background: {},
    clock: { enabled: true },
    date: { enabled: true, locale: "auto" },
    weather: { enabled: false, entity: null },
    navigation: { show_labels: false, items: [] },
    presence: { enabled: false, entities: [] },
    debug: { show_version: true }
  },
  header: {
    enabled: true,
    preset: "glass",
    height: 64,
    margin: 12,
    padding: 12,
    align: "left",
    show_title: true,
    title_mode: "view",
    custom_title: "",
    show_title_icon: true,
    title_icon: "mdi:home-assistant",
    show_subtitle: false,
    subtitle: "Halo UI",
    info_style: "chips",
    corner_radius: 0,
    show_back_button: false,
    show_home_button: false,
    home_path: "",
    show_clock: false,
    clock_24h: true,
    show_date: true,
    show_weather: false,
    weather_entity: null,
    show_temperature: true,
    show_condition: false,
    navigation: {
      show_labels: false,
      items: []
    }
  },
  debug: { show_version: true }
};

export function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge(base, override) {
  if (!isPlainObject(base)) return structuredClone(override);
  const out = structuredClone(base);
  if (!isPlainObject(override)) return out;
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(out[key])) out[key] = deepMerge(out[key], value);
    else out[key] = structuredClone(value);
  }
  return out;
}

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function asBool(value) {
  if (typeof value === "boolean") return value;
  return String(value) === "true";
}

export function setPathImmutable(config, path, value) {
  const next = structuredClone(config || {});
  const keys = path.split(".");
  let obj = next;
  while (keys.length > 1) {
    const key = keys.shift();
    if (!isPlainObject(obj[key])) obj[key] = {};
    obj = obj[key];
  }
  obj[keys[0]] = value;
  return next;
}

export function emitConfigChanged(el, config) {
  el.dispatchEvent(new CustomEvent("config-changed", {
    detail: { config }, bubbles: true, composed: true
  }));
}

const HALO_WEATHER_FOLDER = "/local/halo-ui/halo_weather/";

function migrateHaloWeatherPath(value) {
  const path = String(value || "").trim();
  if (!path) return path;

  const prefixes = [
    "/local/halo/weather/",
    "/local/halo-ui/weather/",
    "/local/halo-ui/halo-weather/"
  ];

  for (const prefix of prefixes) {
    if (path.startsWith(prefix)) {
      return HALO_WEATHER_FOLDER + path.slice(prefix.length);
    }
  }

  return path;
}

function migrateWeatherBlock(block) {
  if (!block || typeof block !== "object") return;

  if ("weather_video_default" in block) {
    block.weather_video_default = migrateHaloWeatherPath(block.weather_video_default);
  }

  if (block.weather_videos && typeof block.weather_videos === "object") {
    for (const key of Object.keys(block.weather_videos)) {
      block.weather_videos[key] = migrateHaloWeatherPath(block.weather_videos[key]);
    }
  }
}

function migrateLegacyWeatherPaths(config) {
  if (!config || typeof config !== "object") return config;

  migrateWeatherBlock(config.background);
  migrateWeatherBlock(config.sidebar?.background);

  const overrides = config.view_overrides;
  if (overrides && typeof overrides === "object") {
    for (const override of Object.values(overrides)) {
      migrateWeatherBlock(override?.background);
      migrateWeatherBlock(override?.sidebar?.background);
    }
  }

  return config;
}

export function normalizeConfig(config) {
  const raw = config || {};
  const merged = deepMerge(HALO_UI_DEFAULTS, raw);

  // v0.9.1 compatibility: background.apply_to used to carry what is now the
  // global Halo UI scope. Migrate it in memory without requiring YAML changes.
  if (!raw?.target?.mode && raw?.background?.apply_to) {
    merged.target.mode =
      raw.background.apply_to === "dashboard" ? "dashboard" : "current_view";
  }

  if (!["current_view", "dashboard"].includes(merged.target?.mode)) {
    merged.target.mode = "current_view";
  }

  // v0.10.9: older Halo builds used /local/halo/weather/.
  // Migrate those known standard paths in memory to the canonical package folder.
  migrateLegacyWeatherPaths(merged);

  // v0.10.42: migrate legacy 2/3-color gradients in memory. We intentionally
  // inspect raw.design.gradient here: deepMerge already injects defaults, so
  // checking merged alone could hide an older user's colors.
  if (!raw?.design?.gradient) {
    const legacyColors = Array.isArray(raw?.design?.colors) && raw.design.colors.length
      ? raw.design.colors
      : (Array.isArray(merged.design?.colors) ? merged.design.colors : ["#210443","#8a2be2","#ff8ad4"]);
    const last = Math.max(1, legacyColors.length - 1);
    merged.design.gradient = {
      type: "linear",
      angle: Number(raw?.design?.gradient_angle ?? merged.design?.gradient_angle ?? 135),
      center_x: 50,
      center_y: 50,
      interpolation: "oklab",
      stops: legacyColors.map((color, i) => ({ color, position: Math.round((i / last) * 100) }))
    };
  }

  return merged;
}


export function currentViewKey(pathname = window.location.pathname) {
  const parts = String(pathname || "/")
    .split("/")
    .filter(Boolean)
    .map(part => {
      try { return decodeURIComponent(part); } catch { return part; }
    });
  return parts.length > 1 ? parts.slice(1).join("/") : "";
}

export function resolveViewConfig(config, viewKey = currentViewKey()) {
  const normalized = normalizeConfig(config || {});
  const base = structuredClone(normalized);
  const overrides = base.view_overrides || {};
  delete base.view_overrides;

  const key = String(viewKey || "").replace(/^\/+|\/+$/g, "");
  const override = key ? overrides[key] : null;

  if (!override || !isPlainObject(override)) {
    base.view_overrides = overrides;
    return base;
  }

  const safeOverride = structuredClone(override);
  delete safeOverride.target;
  delete safeOverride.type;
  delete safeOverride.view_overrides;

  const resolved = deepMerge(base, safeOverride);
  resolved.target = structuredClone(normalized.target);
  resolved.type = normalized.type;
  resolved.view_overrides = overrides;
  return resolved;
}

export function setViewOverridePath(config, viewKey, path, value) {
  const next = structuredClone(config || {});
  const key = String(viewKey || "").replace(/^\/+|\/+$/g, "");
  if (!key) return next;

  if (!isPlainObject(next.view_overrides)) next.view_overrides = {};
  const override = isPlainObject(next.view_overrides[key]) ? next.view_overrides[key] : {};
  next.view_overrides[key] = setPathImmutable(override, path, value);
  return next;
}

export function clearViewOverride(config, viewKey) {
  const next = structuredClone(config || {});
  const key = String(viewKey || "").replace(/^\/+|\/+$/g, "");
  if (!key || !isPlainObject(next.view_overrides)) return next;
  delete next.view_overrides[key];
  return next;
}

export function resolvePerformanceProfile(config = {}) {
  const requested = String(
    config?.performance?.profile ??
    config?.profile ??
    "auto"
  ).toLowerCase();

  if (["high", "balanced", "pi", "eco"].includes(requested)) {
    return requested;
  }

  let reducedMotion = false;
  let coarsePointer = false;

  try {
    reducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    coarsePointer = !!window.matchMedia?.("(pointer: coarse)")?.matches;
  } catch {}

  const cores = Number(navigator.hardwareConcurrency || 0);
  const memory = Number(navigator.deviceMemory || 0);
  const ua = String(navigator.userAgent || "").toLowerCase();
  const armClient = /raspberry|aarch64|armv7|armv8|arm64/.test(ua);

  if (reducedMotion) return "eco";

  // Raspberry Pi / ARM kiosk browsers should prefer the dedicated low-power
  // profile even when they expose four or more CPU cores.
  if (
    armClient ||
    (cores && cores <= 2) ||
    (memory && memory <= 2)
  ) {
    return "pi";
  }

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

export function applyPerformanceTuning(config = {}) {
  const c = structuredClone(config || {});
  const profile = resolvePerformanceProfile(c);

  c.performance = {
    ...(c.performance || {}),
    resolved_profile: profile
  };

  if (profile === "high") return c;

  c.design ??= {};
  c.background ??= {};
  c.sidebar ??= {};
  c.sidebar.appearance ??= {};
  c.sidebar.background ??= {};

  // Expensive double-video looping is reserved for High.
  c.background.video_loop_mode = "native";

  if (profile === "balanced") {
    c.background.performance_profile = "balanced";

    c.design.surface_blur = Math.min(
      Number(c.design.surface_blur ?? c.design.blur ?? 18), 8
    );
    c.design.blur = Math.min(Number(c.design.blur ?? 18), 10);
    c.design.surface_shadow_blur = Math.min(
      Number(c.design.surface_shadow_blur ?? 26), 18
    );

    c.sidebar.appearance.blur = Math.min(
      Number(c.sidebar.appearance.blur ?? c.design.blur ?? 10), 8
    );
    c.sidebar.background.performance_profile = "balanced";
    c.sidebar.background.video_performance_mode = true;
    c.sidebar.background.video_allow_css_weather_fx = false;

    return c;
  }

  if (profile === "pi") {
    // Pi mode keeps videos moving, but avoids the most expensive compositing.
    c.background.performance_profile = "balanced";

    c.design.surface_blur = 0;
    c.design.blur = 0;
    c.design.surface_saturation = 100;
    c.design.surface_shadow_blur = Math.min(
      Number(c.design.surface_shadow_blur ?? 26), 10
    );

    c.sidebar.appearance.blur = 0;
    c.sidebar.background.performance_profile = "balanced";
    c.sidebar.background.video_performance_mode = true;
    c.sidebar.background.video_allow_css_weather_fx = false;
    c.sidebar.background.reduce_motion = true;

    return c;
  }

  // Eco uses a static video frame and removes GPU-heavy glass blur.
  c.background.performance_profile = "eco";

  c.design.surface_blur = 0;
  c.design.blur = 0;
  c.design.surface_saturation = 100;
  c.design.surface_shadow_blur = 0;
  c.design.surface_shadow_strength = Math.min(
    Number(c.design.surface_shadow_strength ?? .28), .12
  );

  c.sidebar.appearance.blur = 0;
  c.sidebar.background.performance_profile = "eco";
  c.sidebar.background.video_performance_mode = true;
  c.sidebar.background.video_allow_css_weather_fx = false;
  c.sidebar.background.reduce_motion = true;

  return c;
}

export function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex, fallback = [20, 20, 26]) {
  const value = String(hex || "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return value.split("").map(ch => parseInt(ch + ch, 16));
  }
  if (/^[0-9a-f]{6}$/i.test(value)) {
    return [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16));
  }
  return fallback;
}

export function rgba(hex, alpha = 1) {
  const [r, g, b] = hexToRgb(hex);
  const a = clampNumber(alpha, 0, 1, 1);
  return `rgba(${r},${g},${b},${a})`;
}

export function designTokens(design = {}) {
  const d = deepMerge(HALO_UI_DEFAULTS.design, design || {});
  const radius = clampNumber(d.radius, 0, 60, 18);
  const blur = clampNumber(d.surface_blur ?? d.blur, 0, 60, 18);
  const saturation = clampNumber(d.surface_saturation, 80, 200, 125);
  const borderWidth = clampNumber(d.surface_border_width, 0, 6, 1);
  const shadowBlur = clampNumber(d.surface_shadow_blur, 0, 80, 26);

  return {
    accent: d.accent || "#00b8e6",
    text: d.text_color || "#ffffff",
    secondaryText: d.secondary_text_color || "rgba(255,255,255,.58)",
    radius,
    blur,
    saturation,
    surface: rgba(d.surface_tint || "#14141a", d.surface_opacity ?? .34),
    surfaceBorder: rgba(d.surface_border_color || "#ffffff", d.surface_border_opacity ?? .14),
    borderWidth,
    shadow: `0 12px ${shadowBlur}px rgba(0,0,0,${clampNumber(d.surface_shadow_strength, 0, .8, .28)})`
  };
}

export function designToSidebarAppearance(design = {}) {
  return {
    preset: design.preset || "glass",
    accent: design.accent,
    text_color: design.text_color,
    secondary_text_color: design.secondary_text_color,
    background: Array.isArray(design.colors) ? [...design.colors] : undefined,
    gradient_angle: design.gradient_angle,
    animation_speed: design.animation_speed,
    gradient: design.gradient ? structuredClone(design.gradient) : undefined,
    glass: design.glass,
    blur: design.blur,
    radius: design.radius,

    // Surface tokens are part of the global design language as well.  The
    // sidebar used to inherit only the old v0.7 appearance values, which meant
    // changes in the global Glass Surface System did not reach it.
    surface_style: design.surface_style,
    surface_tint: design.surface_tint,
    surface_opacity: design.surface_opacity,
    surface_border_color: design.surface_border_color,
    surface_border_opacity: design.surface_border_opacity,
    surface_border_width: design.surface_border_width,
    surface_blur: design.surface_blur,
    surface_saturation: design.surface_saturation,
    surface_shadow_strength: design.surface_shadow_strength,
    surface_shadow_blur: design.surface_shadow_blur,
    surface_highlight_opacity: design.surface_highlight_opacity
  };
}

export function toLegacySidebarConfig(config, viewKey = null) {
  const c = viewKey === null ? normalizeConfig(config) : resolveViewConfig(config, viewKey);
  const localAppearance = structuredClone(c.sidebar?.appearance || {});
  const inheritGlobal = localAppearance.inherit_global !== false;
  const globalAppearance = designToSidebarAppearance(c.design);

  // The global design language is the source of truth by default. Older Halo
  // configurations already contain a full sidebar.appearance snapshot, which
  // previously masked later changes made in the global Design tab. While
  // inheritance is enabled, overwrite every matching visual token with the
  // current global value and keep only sidebar-specific values locally.
  const appearance = inheritGlobal
    ? { ...localAppearance, ...globalAppearance, inherit_global: true }
    : { ...globalAppearance, ...localAppearance, inherit_global: false };

  return {
    type: "custom:halo-view-sidebar",
    enabled: c.enabled !== false && c.modules?.sidebar !== false,
    layout: deepMerge(c.layout, {}),
    sidebar: deepMerge(c.sidebar, { appearance }),
    debug: c.debug
  };
}
