import { deepMerge, esc, HALO_UI_DEFAULTS } from "./halo-core.js";

const BG_DEFAULTS = HALO_UI_DEFAULTS.background;

function signature(value) {
  try { return JSON.stringify(value); } catch { return String(value); }
}

function clamp(v, min, max, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function normalizeGradient(design = {}) {
  const legacy = Array.isArray(design.colors) && design.colors.length ? design.colors : ["#210443","#8a2be2","#ff8ad4"];
  const raw = design.gradient || {};
  let stops = Array.isArray(raw.stops) ? raw.stops
    .map((s, i) => ({ color: String(s?.color || legacy[i % legacy.length] || "#000000"), position: clamp(s?.position, 0, 100, i * 100 / Math.max(1, raw.stops.length - 1)) }))
    .filter(s => /^#[0-9a-f]{6}$/i.test(s.color)) : [];
  if (stops.length < 2) {
    const last = Math.max(1, legacy.length - 1);
    stops = legacy.map((color,i)=>({ color:String(color), position:(i/last)*100 }));
  }
  stops.sort((a,b)=>a.position-b.position);
  return {
    type: ["linear","radial","conic"].includes(raw.type) ? raw.type : "linear",
    angle: clamp(raw.angle ?? design.gradient_angle, 0, 360, 135),
    center_x: clamp(raw.center_x, 0, 100, 50),
    center_y: clamp(raw.center_y, 0, 100, 50),
    interpolation: raw.interpolation === "srgb" ? "srgb" : "oklab",
    stops
  };
}

function gradientCss(g) {
  const interp = g.interpolation === "oklab" ? " in oklab" : "";
  const stops = g.stops.map(s=>`${esc(s.color)} ${Number(s.position).toFixed(2)}%`).join(",");
  if (g.type === "radial") return `radial-gradient(circle at ${g.center_x}% ${g.center_y}%${interp},${stops})`;
  if (g.type === "conic") return `conic-gradient(from ${g.angle}deg at ${g.center_x}% ${g.center_y}%${interp},${stops})`;
  return `linear-gradient(${g.angle}deg${interp},${stops})`;
}

function animationForGradient(g, speed) {
  const rad = g.angle * Math.PI / 180;
  const dx = (Math.sin(rad) * 7).toFixed(2);
  const dy = (-Math.cos(rad) * 7).toFixed(2);
  if (g.type === "conic") return { name:"haloUiGradientSpin", css:`animation:haloUiGradientSpin ${speed}s linear infinite;` };
  if (g.type === "radial") return { name:"haloUiGradientDrift", css:`animation:haloUiGradientDrift ${speed}s ease-in-out infinite;` };
  return { name:"haloUiGradientLinear", css:`--halo-gx:${dx}%;--halo-gy:${dy}%;animation:haloUiGradientLinear ${speed}s ease-in-out infinite;` };
}
export class HaloBackgroundLayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = deepMerge(BG_DEFAULTS, {});
    this._design = deepMerge(HALO_UI_DEFAULTS.design, {});
    this._configSig = signature(this._config);
    this._designSig = signature(this._design);
    this._hass = null;
    this._activeSource = "";
    this._activeVideo = 0;
    this._crossfading = false;
    this._crossfadeTimer = null;
    this._failedVideoSources = new Set();
    this._visibilityHandler = () => this._syncPlayback();
    this._mobileMedia = null;
    this._resizeHandler = () => {
      const mobile = this._isMobileMedia();
      if (mobile === this._mobileMedia) return;
      this._mobileMedia = mobile;
      this._failedVideoSources.clear();
      this._render();
    };
  }

  connectedCallback() {
    document.addEventListener("visibilitychange", this._visibilityHandler);
    window.addEventListener("resize", this._resizeHandler, { passive:true });
    this._mobileMedia = this._isMobileMedia();
    this._render();
  }

  disconnectedCallback() {
    document.removeEventListener("visibilitychange", this._visibilityHandler);
    window.removeEventListener("resize", this._resizeHandler);
    clearTimeout(this._crossfadeTimer);
    this.shadowRoot?.querySelectorAll("video")?.forEach(v => v.pause?.());
  }

  set config(value) {
    const next = deepMerge(BG_DEFAULTS, value || {});
    const sig = signature(next);
    if (sig === this._configSig) return;
    this._config = next;
    this._configSig = sig;
    this._failedVideoSources.clear();
    this._render();
  }

  set design(value) {
    const next = deepMerge(HALO_UI_DEFAULTS.design, value || {});
    const sig = signature(next);
    if (sig === this._designSig) return;
    this._design = next;
    this._designSig = sig;
    this._render();
  }

  set hass(value) {
    this._hass = value;
    const next = this._resolveVideoSource();
    if (next !== this._activeSource) this._render();
  }

  _condition() {
    const fixed = this._config.weather_condition;
    if (fixed && fixed !== "auto") return fixed;
    const entity = this._config.weather_entity;
    return entity ? (this._hass?.states?.[entity]?.state || "") : "";
  }

  _isMobileMedia() {
    const breakpoint = Math.max(320, Number(this._config?.mobile_breakpoint) || 850);
    return window.innerWidth <= breakpoint;
  }

  _resolveVideoCandidates() {
    const c = this._config;
    const mobile = this._isMobileMedia();

    if (c.type === "video") {
      return [
        ...(mobile ? [c.mobile_video] : []),
        c.video
      ].map(v => String(v || "").trim()).filter(Boolean);
    }

    if (c.type === "weather-video") {
      const rawState = this._condition();
      const aliases = {
        exceptional: "cloudy",
        hail: "rainy",
        "snowy-rainy": "snowy",
        "windy-variant": "windy"
      };
      const state = aliases[rawState] || rawState;
      const candidates = [];

      if (mobile) {
        candidates.push(
          c.mobile_weather_videos?.[state],
          c.mobile_weather_videos?.[rawState],
          c.mobile_weather_video_default,
          c.mobile_weather_videos?.cloudy
        );
      }

      candidates.push(
        c.weather_videos?.[state],
        c.weather_videos?.[rawState],
        c.weather_video_default,
        c.weather_videos?.cloudy
      );

      return candidates.map(v => String(v || "").trim()).filter(Boolean);
    }

    return [];
  }

  _resolveVideoSource() {
    const candidates = this._resolveVideoCandidates();
    return candidates.find(source => !this._failedVideoSources.has(source)) || candidates[0] || "";
  }

  _handleVideoError(source) {
    const failed = String(source || "").trim();
    if (!failed) return;

    this._failedVideoSources.add(failed);

    const fallback = this._resolveVideoSource();

    console.warn("[Halo UI] Background video could not be loaded:", failed);

    if (fallback && fallback !== failed) {
      queueMicrotask(() => this._render());
    }
  }

  _profile() {
    const p = String(this._config.performance_profile || "auto");
    if (["high","balanced","eco"].includes(p)) return p;
    let coarse = false;
    try { coarse = !!window.matchMedia?.("(pointer: coarse)")?.matches; } catch {}
    const cores = Number(navigator.hardwareConcurrency || 0);
    const memory = Number(navigator.deviceMemory || 0);
    if ((cores && cores <= 2) || (memory && memory <= 2)) return "eco";
    if (coarse || window.innerWidth < 1400 || (cores && cores <= 4) || (memory && memory <= 4)) return "balanced";
    return "high";
  }

  _videos() {
    return Array.from(this.shadowRoot?.querySelectorAll("video.video") || []);
  }

  _syncPlayback() {
    const videos = this._videos();
    if (!videos.length) return;
    if (this._profile() === "eco" || (this._config.pause_when_hidden !== false && document.hidden)) {
      videos.forEach(v => v.pause?.());
      return;
    }
    const active = videos[this._activeVideo] || videos[0];
    active?.play?.().catch?.(() => {});
  }

  _beginCrossfade() {
    const videos = this._videos();
    if (videos.length < 2 || this._crossfading || document.hidden) return;

    const fromIndex = this._activeVideo;
    const toIndex = fromIndex === 0 ? 1 : 0;
    const from = videos[fromIndex];
    const to = videos[toIndex];
    if (!from || !to || !Number.isFinite(from.duration) || from.duration <= 0) return;

    const requested = Math.max(.15, Number(this._config.video_crossfade ?? .65));
    const duration = Math.min(requested, Math.max(.15, from.duration * .25));
    const remaining = from.duration - from.currentTime;
    if (remaining > duration + .18) return;

    this._crossfading = true;
    clearTimeout(this._crossfadeTimer);

    try { to.currentTime = 0; } catch {}
    to.play?.().catch?.(() => {});

    // Let the browser paint opacity 0 once before fading up.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      to.classList.add("active");
      from.classList.remove("active");
    }));

    this._crossfadeTimer = setTimeout(() => {
      from.pause?.();
      try { from.currentTime = 0; } catch {}
      this._activeVideo = toIndex;
      this._crossfading = false;
      this._syncPlayback();
    }, Math.ceil(duration * 1000) + 80);
  }

  _wireVideoLoop(profile) {
    const videos = this._videos();
    if (!videos.length) return;
    const source = this._activeSource;

    this._activeVideo = 0;
    this._crossfading = false;
    clearTimeout(this._crossfadeTimer);

    const crossfade =
      this._config.seamless_motion !== false &&
      this._config.video_loop_mode !== "native" &&
      profile !== "eco" &&
      videos.length > 1;

    if (!crossfade) {
      const video = videos[0];
      video.loop = true;
      video.classList.add("active");
      video.addEventListener("loadedmetadata", () => {
        if (profile === "eco") {
          try { video.currentTime = .05; } catch {}
          video.pause?.();
        } else this._syncPlayback();
      }, { once:true });
      video.addEventListener("error", () => this._handleVideoError(source), { once:true });
      if (profile !== "eco") this._syncPlayback();
      return;
    }

    videos.forEach((video, index) => {
      video.loop = false;
      if (index === 0) video.classList.add("active");
      else video.classList.remove("active");
      video.addEventListener("timeupdate", () => {
        if (index === this._activeVideo) this._beginCrossfade();
      });
      video.addEventListener("ended", () => {
        // Fallback if timeupdate arrived too late on a slow device.
        if (index !== this._activeVideo || this._crossfading) return;
        const next = videos[index === 0 ? 1 : 0];
        if (!next) return;
        try { next.currentTime = 0; } catch {}
        next.classList.add("active");
        video.classList.remove("active");
        next.play?.().catch?.(() => {});
        this._activeVideo = index === 0 ? 1 : 0;
      });
      video.addEventListener("error", () => this._handleVideoError(source), { once:true });
    });

    const first = videos[0];
    first.addEventListener("loadedmetadata", () => this._syncPlayback(), { once:true });
    this._syncPlayback();
  }

  _render() {
    if (!this.shadowRoot) return;
    clearTimeout(this._crossfadeTimer);
    this._crossfading = false;

    const c = this._config;
    const d = this._design;
    const gradient = normalizeGradient(d);
    const gradientBackground = gradientCss(gradient);
    const speed = Math.max(5, Number(d.animation_speed ?? 30));
    const source = this._resolveVideoSource();
    this._activeSource = source;
    const type = c.type || "animated-gradient";
    const opacity = Math.max(0, Math.min(1, Number(c.video_opacity ?? 1)));
    const overlay = Math.max(0, Math.min(.9, Number(c.overlay ?? .15)));
    const fit = ["cover","contain","fill"].includes(c.fit) ? c.fit : "cover";
    const image = String(c.image || "").trim();
    const profile = this._profile();
    const animateGradient = type === "animated-gradient" && profile !== "eco" && c.seamless_motion !== false;
    const gradientAnimation = animationForGradient(gradient, speed);
    const animatedInset = animateGradient ? (gradient.type === "radial" ? "-24%" : "-14%") : "0";
    const crossfade = Math.max(.15, Number(c.video_crossfade ?? .65));
    const useDualVideo =
      !!source &&
      (type === "video" || type === "weather-video") &&
      c.seamless_motion !== false &&
      c.video_loop_mode !== "native" &&
      profile !== "eco";

    this.shadowRoot.innerHTML = `
      <style>
        :host{position:absolute;inset:0;display:block;overflow:hidden;pointer-events:none;background:#12051f}
        .base{position:absolute;inset:${animatedInset};background:${gradientBackground};background-size:100% 100%;transform-origin:${gradient.center_x}% ${gradient.center_y}%;${animateGradient ? `${gradientAnimation.css}will-change:transform;` : ""}}
        .image,.video{position:absolute;inset:0;width:100%;height:100%;object-fit:${fit};object-position:50% 50%}
        .image{background-position:center;background-size:${fit === "fill" ? "100% 100%" : fit};background-repeat:no-repeat}
        .video{opacity:0;transform:translateZ(0);backface-visibility:hidden;transition:opacity ${crossfade}s linear}
        .video.active{opacity:${opacity}}
        .overlay{position:absolute;inset:0;background:rgba(0,0,0,${overlay})}
        @keyframes haloUiGradientLinear{0%,100%{transform:scale(1.12) translate3d(calc(var(--halo-gx) * -1),calc(var(--halo-gy) * -1),0)}50%{transform:scale(1.12) translate3d(var(--halo-gx),var(--halo-gy),0)}}
        @keyframes haloUiGradientDrift{0%,100%{transform:scale(1.20) translate3d(-7%,-5%,0)}20%{transform:scale(1.30) translate3d(6%,-8%,0)}45%{transform:scale(1.17) translate3d(9%,5%,0)}70%{transform:scale(1.27) translate3d(-4%,9%,0)}85%{transform:scale(1.22) translate3d(-9%,2%,0)}}
        @keyframes haloUiGradientSpin{from{transform:scale(1.22) rotate(0deg)}to{transform:scale(1.22) rotate(360deg)}}
        @media(prefers-reduced-motion:reduce){.base{animation:none!important}}
      </style>
      <div class="base"></div>
      ${type === "image" && image ? `<div class="image" style="background-image:url('${esc(image)}')"></div>` : ""}
      ${(type === "video" || type === "weather-video") && source ? (
        useDualVideo
          ? `<video class="video video-a" muted playsinline preload="auto" src="${esc(source)}"></video><video class="video video-b" muted playsinline preload="auto" src="${esc(source)}"></video>`
          : `<video class="video video-a" muted playsinline preload="${profile === "balanced" ? "metadata" : "auto"}" src="${esc(source)}"></video>`
      ) : ""}
      ${overlay > 0 ? `<div class="overlay"></div>` : ""}
    `;

    this._wireVideoLoop(profile);
  }
}

if (!customElements.get("halo-background-layer")) customElements.define("halo-background-layer", HaloBackgroundLayer);

export class HaloBackgroundManager {
  constructor(owner) {
    this.owner = owner;
    this.portal = null;
    this.layer = null;
    this.targetView = null;
    this.previous = null;
    this.config = null;
    this.design = null;
    this.hass = null;
    this._resizeObserver = null;
    this._syncGeometryBound = () => this._syncGeometry();
  }

  _syncGeometry() {
    if (!this.portal || !this.targetView) return;
    const scope = String(this.config?.scope || "view");

    if (scope === "screen") {
      Object.assign(this.portal.style, {
        left: "0px",
        top: "0px",
        width: "100vw",
        height: "100vh"
      });
      return;
    }

    const rect = this.targetView.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(window.innerWidth, rect.right);

    // A view-scoped background is a viewport backdrop, not a snapshot of the
    // current sections height. Pin it to the bottom of the viewport so sparse
    // dashboards and long/scrolling section layouts never reveal HA's base
    // background below Halo.
    Object.assign(this.portal.style, {
      left: `${left}px`,
      top: `${top}px`,
      right: `${Math.max(0, window.innerWidth - right)}px`,
      bottom: "0px",
      width: "auto",
      height: "auto"
    });
  }

  _startGeometryWatch() {
    this._stopGeometryWatch();
    window.addEventListener("resize", this._syncGeometryBound, { passive:true });
    window.addEventListener("scroll", this._syncGeometryBound, { passive:true });
    if (typeof ResizeObserver !== "undefined" && this.targetView) {
      this._resizeObserver = new ResizeObserver(this._syncGeometryBound);
      this._resizeObserver.observe(this.targetView);
    }
    this._syncGeometry();
  }

  _stopGeometryWatch() {
    window.removeEventListener("resize", this._syncGeometryBound);
    window.removeEventListener("scroll", this._syncGeometryBound);
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  mount(targetView, config, design, hass) {
    this.config = config;
    this.design = design;
    this.hass = hass;
    if (!targetView) return;

    if (this.targetView !== targetView) {
      this.destroy();
      this.targetView = targetView;
      this.previous = {
        background: targetView.style.background,
        backgroundColor: targetView.style.backgroundColor,
        position: targetView.style.position,
        zIndex: targetView.style.zIndex,
        lovelaceBackground: targetView.style.getPropertyValue("--lovelace-background")
      };
      targetView.style.background = "transparent";
      targetView.style.backgroundColor = "transparent";
      targetView.style.setProperty("--lovelace-background", "transparent");
      if (!targetView.style.position) targetView.style.position = "relative";
      targetView.style.zIndex = "1";
      this._startGeometryWatch();
    }

    if (!this.portal) {
      this.portal = document.createElement("div");
      this.portal.className = "halo-ui-background-portal";
      Object.assign(this.portal.style, {
        position:"fixed", left:"0", top:"0", width:"100vw", height:"100vh",
        zIndex:"0", pointerEvents:"none", overflow:"hidden"
      });
      this.layer = document.createElement("halo-background-layer");
      this.portal.appendChild(this.layer);
      document.body.appendChild(this.portal);
    }

    this.layer.config = config || {};
    this.layer.design = design || {};
    this.layer.hass = hass;
    this._syncGeometry();
  }

  update(config, design, hass) {
    this.config = config || this.config;
    this.design = design || this.design;
    this.hass = hass || this.hass;
    if (!this.layer) return;

    // The layer setters are signature-aware. Normal HA state updates therefore
    // no longer rebuild the DOM/video unless the actual config/source changed.
    this.layer.config = this.config;
    this.layer.design = this.design;
    this.layer.hass = this.hass;
    this._syncGeometry();
  }

  destroy() {
    this._stopGeometryWatch();
    this.portal?.remove();
    this.portal = null;
    this.layer = null;
    if (this.targetView && this.previous) {
      this.targetView.style.background = this.previous.background;
      this.targetView.style.backgroundColor = this.previous.backgroundColor;
      this.targetView.style.position = this.previous.position;
      this.targetView.style.zIndex = this.previous.zIndex;
      if (!this.previous.lovelaceBackground) this.targetView.style.removeProperty("--lovelace-background");
      else this.targetView.style.setProperty("--lovelace-background", this.previous.lovelaceBackground);
    }
    this.targetView = null;
    this.previous = null;
  }
}
