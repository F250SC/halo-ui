import { localizeHaloDom, haloLanguage, haloWeatherLabel } from "./halo-i18n.js";
import { deepMerge, HALO_UI_DEFAULTS, esc, designTokens } from "./halo-core.js";

function signature(value) {
  try { return JSON.stringify(value); } catch { return String(value); }
}

function conditionIcon(state) {
  const map = {
    sunny: "mdi:weather-sunny",
    "clear-night": "mdi:weather-night",
    cloudy: "mdi:weather-cloudy",
    partlycloudy: "mdi:weather-partly-cloudy",
    rainy: "mdi:weather-rainy",
    pouring: "mdi:weather-pouring",
    lightning: "mdi:weather-lightning",
    "lightning-rainy": "mdi:weather-lightning-rainy",
    snowy: "mdi:weather-snowy",
    "snowy-rainy": "mdi:weather-snowy-rainy",
    fog: "mdi:weather-fog",
    windy: "mdi:weather-windy",
    "windy-variant": "mdi:weather-windy-variant",
    hail: "mdi:weather-hail",
    exceptional: "mdi:alert-circle-outline"
  };
  return map[state] || "mdi:weather-cloudy";
}

function conditionLabel(state, language = "de") {
  const de = {
    sunny: "Sonnig",
    "clear-night": "Klare Nacht",
    cloudy: "Bewölkt",
    partlycloudy: "Teilweise bewölkt",
    rainy: "Regen",
    pouring: "Starker Regen",
    lightning: "Gewitter",
    "lightning-rainy": "Gewitter & Regen",
    snowy: "Schnee",
    "snowy-rainy": "Schneeregen",
    fog: "Nebel",
    windy: "Windig",
    "windy-variant": "Sehr windig",
    hail: "Hagel",
    exceptional: "Unwetter"
  };
  const en = {
    sunny: "Sunny",
    "clear-night": "Clear night",
    cloudy: "Cloudy",
    partlycloudy: "Partly cloudy",
    rainy: "Rainy",
    pouring: "Pouring",
    lightning: "Lightning",
    "lightning-rainy": "Thunderstorms",
    snowy: "Snowy",
    "snowy-rainy": "Snowy rain",
    fog: "Fog",
    windy: "Windy",
    "windy-variant": "Very windy",
    hail: "Hail",
    exceptional: "Exceptional"
  };
  const table = String(language || "de").toLowerCase().startsWith("de") ? de : en;
  return table[state] || String(state || "").replace(/[-_]/g, " ");
}

export class HaloHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = deepMerge(HALO_UI_DEFAULTS.header, {});
    this._design = deepMerge(HALO_UI_DEFAULTS.design, {});
    this._hass = null;
    this._viewTitle = "";
    this._timer = null;
    this._configSig = signature(this._config);
    this._designSig = signature(this._design);
    this._weatherSig = "";
    this._userSig = "";
  }

  set config(value) {
    const next = deepMerge(HALO_UI_DEFAULTS.header, value || {});
    const sig = signature(next);
    if (sig === this._configSig) return;
    this._config = next;
    this._configSig = sig;
    this._weatherSig = "";
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

    const userSig = `${this._hass?.user?.name || ""}|${this._hass?.language || ""}`;
    const weather = this._config.show_weather ? this._weatherState() : null;
    const weatherSig = weather
      ? `${weather.state}|${weather.attributes?.temperature}|${weather.attributes?.temperature_unit}`
      : "";

    if (weatherSig === this._weatherSig && userSig === this._userSig) return;
    this._weatherSig = weatherSig;
    this._userSig = userSig;
    this._render();
  }

  set viewTitle(value) {
    const next = String(value || "");
    if (next === this._viewTitle) return;
    this._viewTitle = next;
    this._render();
  }

  connectedCallback() {
    this._startClock();
    this._render();
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._timer = null;
  }

  _startClock() {
    clearInterval(this._timer);
    this._timer = setInterval(() => this._updateClock(), 1000);
  }

  _locale() {
    return this._hass?.locale?.language || this._hass?.language || undefined;
  }

  _timeText() {
    return new Intl.DateTimeFormat(this._locale(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: this._config.clock_24h === false
    }).format(new Date());
  }

  _dateText() {
    return new Intl.DateTimeFormat(this._locale(), {
      weekday: "short",
      day: "2-digit",
      month: "short"
    }).format(new Date());
  }

  _updateClock() {
    const clock = this.shadowRoot?.querySelector("[data-halo-header-clock]");
    if (clock) clock.textContent = this._timeText();
    const date = this.shadowRoot?.querySelector("[data-halo-header-date]");
    if (date) date.textContent = this._dateText();
  }

  _title() {
    if (this._config.title_mode === "custom" && this._config.custom_title) {
      const user = String(this._hass?.user?.name || "").trim();
      return String(this._config.custom_title).replace(/\{user\}/gi, user || "Benutzer");
    }
    return this._viewTitle || "Home Assistant";
  }

  _weatherState() {
    const entity = this._config.weather_entity;
    return entity ? this._hass?.states?.[entity] : null;
  }

  _navigate(path) {
    if (!path) return;
    history.pushState(null, "", path);
    window.dispatchEvent(new Event("location-changed"));
  }

  _renderNavItems() {
    const nav = this._config.navigation || {};
    const items = nav.items || [];

    return items.map((item, i) => `
      <button class="nav-btn" data-nav="${i}" title="${esc(item.name || item.path || "")}">
        <ha-icon icon="${esc(item.icon || "mdi:circle-small")}"></ha-icon>
        ${nav.show_labels ? `<span>${esc(item.name || "")}</span>` : ""}
      </button>
    `).join("");
  }

  _render() {
    if (!this.shadowRoot) return;

    const c = this._config;
    const t = designTokens(this._design);
    const weather = this._weatherState();
    const temp = weather?.attributes?.temperature;
    const tempUnit = weather?.attributes?.temperature_unit || "°C";
    const condition = weather?.state || "";
    const conditionText = haloWeatherLabel(condition, this._hass);

    const preset = c.preset || "glass";
    const isTransparent = preset === "transparent";
    const isMinimal = preset === "minimal";
    const isFloating = preset === "floating";
    const background = isTransparent
      ? "transparent"
      : isMinimal
        ? "rgba(10,12,16,.24)"
        : t.surface;

    const radius = isFloating ? Math.max(14, Number(t.radius || 18)) : Math.max(0, Number(c.corner_radius ?? 0));
    const showTitleIcon = c.show_title_icon !== false;
    const titleIcon = c.title_icon || "mdi:home-assistant";
    const infoStyle = c.info_style || "chips";
    const chipClass = infoStyle === "plain" ? "info plain" : "info";

    this.shadowRoot.innerHTML = `
      <style>
        :host{
          display:block;width:100%;height:100%;
          font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:${t.text}
        }
        .header{
          position:relative;width:100%;height:100%;box-sizing:border-box;
          display:grid;grid-template-columns:minmax(0,1fr) auto;
          align-items:center;gap:14px;
          padding:0 ${Number(c.padding ?? 12)}px;
          border-radius:${radius}px;
          background:${background};
          border:${isTransparent ? 0 : t.borderWidth}px solid ${t.surfaceBorder};
          box-shadow:${isFloating ? t.shadow : "none"};
          backdrop-filter:${isTransparent ? "none" : `blur(${t.blur}px) saturate(${t.saturation}%)`};
          -webkit-backdrop-filter:${isTransparent ? "none" : `blur(${t.blur}px) saturate(${t.saturation}%)`};
          overflow:hidden;
        }
        .header::before{
          content:"";position:absolute;inset:-120% 45% auto -15%;height:260%;
          background:radial-gradient(circle, color-mix(in srgb,${t.accent} 22%,transparent) 0%, transparent 68%);
          opacity:${isTransparent || isMinimal ? .32 : .72};pointer-events:none;
        }
        .header::after{
          content:"";position:absolute;left:0;right:0;bottom:0;height:1px;
          background:linear-gradient(90deg,transparent,color-mix(in srgb,${t.accent} 55%,transparent),transparent);
          opacity:${isTransparent ? 0 : .6};pointer-events:none;
        }
        .primary,.right,.nav,.title-row,.info{display:flex;align-items:center;min-width:0}
        .primary{gap:10px;position:relative;z-index:1}
        .title-area{min-width:0;display:grid;gap:1px;text-align:${c.align === "center" ? "center" : c.align === "right" ? "right" : "left"}}
        .title-row{gap:9px;min-width:0;justify-content:${c.align === "center" ? "center" : c.align === "right" ? "flex-end" : "flex-start"}}
        .title-icon{
          width:34px;height:34px;flex:0 0 34px;border-radius:11px;
          display:grid;place-items:center;
          background:color-mix(in srgb,${t.accent} 17%,rgba(255,255,255,.06));
          border:1px solid color-mix(in srgb,${t.accent} 28%,rgba(255,255,255,.08));
          box-shadow:inset 0 1px 0 rgba(255,255,255,.08);
        }
        .title-icon ha-icon{color:${t.accent};width:19px;height:19px}
        .title{font-size:18px;font-weight:750;letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .subtitle{font-size:10px;color:${t.secondaryText};letter-spacing:.035em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .right{gap:8px;justify-content:flex-end;position:relative;z-index:1}
        .nav{gap:6px;flex:0 1 auto;overflow:hidden}
        button,.info{
          min-height:40px;border-radius:13px;
          border:1px solid rgba(255,255,255,.10);
          background:rgba(255,255,255,.065);color:${t.text};
          box-shadow:inset 0 1px 0 rgba(255,255,255,.055);
          box-sizing:border-box;
        }
        button{
          min-width:40px;height:40px;display:flex;align-items:center;justify-content:center;gap:6px;
          cursor:pointer;padding:0 9px;font:600 11px/1 system-ui;
        }
        button:hover{background:color-mix(in srgb,${t.accent} 20%,rgba(255,255,255,.08));border-color:color-mix(in srgb,${t.accent} 28%,rgba(255,255,255,.12))}
        .nav-btn span{font-size:11px;white-space:nowrap}
        ha-icon{width:19px;height:19px}
        .info{gap:9px;padding:0 13px;white-space:nowrap;min-width:84px}
        .info.plain{background:transparent;border-color:transparent;box-shadow:none;padding-left:4px;padding-right:4px}
        .info-icon{color:${t.accent};width:21px;height:21px;flex:0 0 auto}
        .info-copy{display:grid;gap:0;line-height:1.05}
        .info-main{font-size:14px;font-weight:760;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
        .info-sub{font-size:10px;color:${t.secondaryText};margin-top:3px;max-width:150px;overflow:hidden;text-overflow:ellipsis}
        .clock .info-main{font-size:16px;letter-spacing:.015em}
        .weather-temp{font-variant-numeric:tabular-nums}
        .separator{width:1px;height:24px;background:rgba(255,255,255,.11);margin:0 1px}
        @media(max-width:900px){
          .title{font-size:16px}.nav-btn span{display:none}.info-sub{display:none}.info{padding:0 10px;min-width:auto}.right{gap:6px}
        }
        @media(max-width:650px){
          .header{gap:8px;padding-left:${Math.max(8, Number(c.padding ?? 12) - 3)}px;padding-right:${Math.max(8, Number(c.padding ?? 12) - 3)}px}
          .title-icon{width:30px;height:30px;flex-basis:30px;border-radius:10px}.title-icon ha-icon{width:17px;height:17px}
          .title{font-size:14px}.subtitle{display:none}.nav{display:none}.info{min-height:34px;padding:0 8px;border-radius:10px;min-width:auto}.clock .info-main,.info-main{font-size:12px}
          .weather .info-sub,.clock .info-sub{display:none}
        }
        @media(max-width:430px){
          .title-icon{display:none}.weather .condition-only{display:none}.info{padding:0 7px}.right{gap:4px}
        }
      </style>

      <div class="header ${esc(preset)}">
        <div class="primary">
          ${c.show_back_button ? `<button data-back title="Zurück"><ha-icon icon="mdi:arrow-left"></ha-icon></button>` : ""}
          ${c.show_home_button ? `<button data-home title="Home"><ha-icon icon="mdi:home"></ha-icon></button>` : ""}
          <div class="nav">${this._renderNavItems()}</div>
          ${c.show_title !== false ? `
            <div class="title-area">
              <div class="title-row">
                ${showTitleIcon ? `<div class="title-icon"><ha-icon icon="${esc(titleIcon)}"></ha-icon></div>` : ""}
                <div style="min-width:0">
                  <div class="title">${esc(this._title())}</div>
                  ${c.show_subtitle ? `<div class="subtitle">${esc(c.subtitle || "Halo UI")}</div>` : ""}
                </div>
              </div>
            </div>` : ""}
        </div>

        <div class="right">
          ${c.show_weather && weather ? `
            <div class="${chipClass} weather" title="${esc(conditionText)}">
              <ha-icon class="info-icon" icon="${conditionIcon(condition)}"></ha-icon>
              <div class="info-copy">
                <div class="info-main">
                  ${c.show_temperature !== false && temp != null ? `<span class="weather-temp">${esc(temp)} ${esc(tempUnit)}</span>` : `<span class="condition-only">${esc(conditionText)}</span>`}
                </div>
                ${c.show_condition && c.show_temperature !== false && temp != null ? `<div class="info-sub">${esc(conditionText)}</div>` : ""}
              </div>
            </div>` : ""}
          ${c.show_clock ? `
            <div class="${chipClass} clock">
              <ha-icon class="info-icon" icon="mdi:clock-outline"></ha-icon>
              <div class="info-copy">
                <div class="info-main" data-halo-header-clock>${esc(this._timeText())}</div>
                ${c.show_date ? `<div class="info-sub" data-halo-header-date>${esc(this._dateText())}</div>` : ""}
              </div>
            </div>` : ""}
        </div>
      </div>
    `;

    localizeHaloDom(this.shadowRoot, this._hass);

    this.shadowRoot.querySelector("[data-back]")?.addEventListener("click", () => history.back());
    this.shadowRoot.querySelector("[data-home]")?.addEventListener("click", () => this._navigate(c.home_path));

    this.shadowRoot.querySelectorAll("[data-nav]").forEach(el => {
      el.addEventListener("click", () => {
        const idx = Number(el.dataset.nav);
        this._navigate(c.navigation?.items?.[idx]?.path);
      });
    });
  }
}

if (!customElements.get("halo-header")) {
  customElements.define("halo-header", HaloHeader);
}
