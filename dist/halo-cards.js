// Halo Cards — independent Lovelace card family. Preview version: Halo Light.
const CARD_TYPES = [
  { id: "light", label: "Licht", icon: "mdi:lightbulb-outline" },
  { id: "vacuum", label: "Staubsauger", icon: "mdi:robot-vacuum" },
  { id: "climate", label: "Klima", icon: "mdi:thermostat", soon: true },
  { id: "room", label: "Raum", icon: "mdi:home-outline", soon: true },
  { id: "media", label: "Medien", icon: "mdi:play-box-outline", soon: true },
  { id: "status", label: "Status", icon: "mdi:chart-line", soon: true }
];
const STYLES = ["minimal", "balanced", "signature"];
const SIZES = ["compact", "standard", "expanded"];
const LAMP_PRESETS = {
  living: { label: "Tischlampe / Wohnzimmer", prefix: "halo-light" },
  stick: { label: "Stablampe", prefix: "halo-light-stick" },
  pendant: { label: "Pendellampe", prefix: "halo-light-pendant" }
};
const DEFAULTS = {
  type: "custom:halo-cards", card_type: "light", entity: "",
  name: "", style: "balanced", size: "standard",
  accent: "#a178ff", background: "", show_brightness: true, show_status: true,
  glow_strength: 70, scene: "warm", lamp_type: "living", navigation_path: "/dashboard-x/vacuum"
};
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const cleanAccent = v => /^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : DEFAULTS.accent;
const normalize = config => {
  const c = { ...DEFAULTS, ...(config || {}) };
  c.card_type = CARD_TYPES.some(t => t.id === c.card_type) ? c.card_type : "light";
  c.style = STYLES.includes(c.style) ? c.style : "balanced";
  c.size = SIZES.includes(c.size) ? c.size : "standard";
  c.accent = cleanAccent(c.accent);
  c.glow_strength = Math.min(100,Math.max(0,Number(c.glow_strength)||0));
  c.scene = ["warm","cool","custom"].includes(c.scene) ? c.scene : "warm";
  c.lamp_type = Object.hasOwn(LAMP_PRESETS,c.lamp_type) ? c.lamp_type : "living";
  c.navigation_path = /^\/[a-zA-Z0-9_\-/]*$/.test(String(c.navigation_path||"")) ? String(c.navigation_path) : "/dashboard-x/vacuum";
  c.background = String(c.background||"").trim();
  if (!/^(https?:\/\/|\/local\/)/i.test(c.background) || /[\x00-\x1f"\x27<>]/.test(c.background)) c.background="";
  return c;
};
let cardCss = String.raw`
:host{display:block;min-width:0}ha-card{background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible}
.halo-card{--halo-accent:#a178ff;--glow:.7;--level:65%;--light-color:#ffcc91;position:relative;isolation:isolate;overflow:hidden;box-sizing:border-box;min-height:170px;padding:18px;border-radius:23px;
color:#fff;background:linear-gradient(120deg,#292a3c,#131a2b);border:1px solid rgba(255,255,255,.17);box-shadow:0 16px 33px rgba(0,0,0,.28);font-family:inherit}
.halo-card:before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:var(--glow);background:radial-gradient(ellipse at 13% 67%,color-mix(in srgb,var(--light-color) 34%,transparent),transparent 59%),radial-gradient(ellipse at 100% 100%,color-mix(in srgb,var(--halo-accent) 40%,transparent),transparent 75%)}
.is-off:before{opacity:.04}.minimal{background:linear-gradient(130deg,#282b36,#1b1e2a);box-shadow:none}.minimal:before{opacity:0}
.signature{border-color:color-mix(in srgb,var(--halo-accent) 48%,#39415a);box-shadow:0 15px 36px rgba(0,0,0,.3),0 0 20px color-mix(in srgb,var(--halo-accent) 14%,transparent)}
.scene-cool{--light-color:#78cbff;background:linear-gradient(130deg,#172d46,#13172e)}.has-image{background-image:linear-gradient(90deg,rgba(10,13,29,.82),rgba(10,13,29,.5)),var(--halo-image);background-position:center;background-size:cover}
.frame{display:grid;grid-template-columns:minmax(65px,105px) minmax(0,1fr);gap:17px;min-width:0}
.object{display:grid;place-items:center;position:relative;overflow:hidden;min-height:128px;border-radius:17px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(140deg,rgba(255,255,255,.11),rgba(255,255,255,.02));box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
.object:before{content:"";position:absolute;bottom:3px;width:65%;height:25px;background:var(--light-color);filter:blur(16px);opacity:var(--glow)}.is-off .object:before,.minimal .object:before{opacity:0}
.lamp-svg{height:115px;max-width:90%;filter:drop-shadow(0 5px 7px rgba(0,0,0,.3))}
.lamp-shade{fill:var(--light-color)}.is-off .lamp-shade{fill:#a5a4b5}.lamp-metal{fill:#ded6dc}
.lamp-glow{fill:var(--light-color);opacity:calc(var(--glow) * .36)}.is-off .lamp-glow,.minimal .lamp-glow{opacity:0}
.info{display:flex;flex-direction:column;justify-content:space-between;min-width:0;gap:17px;padding:7px 0}
.heading{display:flex;justify-content:space-between;gap:10px}.title{font-weight:650;font-size:16px;overflow-wrap:anywhere;line-height:1.35}
.status{display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.72);font-size:12px;margin-top:9px}.dot{height:8px;width:8px;border-radius:50%;background:var(--halo-accent);box-shadow:0 0 9px var(--halo-accent)}
.is-off .dot{background:#9195a5;box-shadow:none}.percent{font-size:13px;white-space:nowrap;padding-top:3px}
.controls{display:flex;align-items:center;gap:15px}.slider-wrap{flex:1;min-width:0}
.brightness{appearance:none;-webkit-appearance:none;width:100%;height:9px;margin:0;border-radius:20px;cursor:pointer;background:linear-gradient(90deg,var(--halo-accent) 0%,#c9a9ff var(--level),rgba(200,200,230,.22) var(--level),rgba(200,200,230,.22) 100%)}
.brightness::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:20px;height:20px;background:#fafaff;border-radius:50%;box-shadow:0 0 13px rgba(239,212,255,.6)}
.brightness::-moz-range-thumb{width:20px;height:20px;background:#fafaff;border:0;border-radius:50%;box-shadow:0 0 13px rgba(239,212,255,.6)}
.brightness:disabled{opacity:.35;cursor:not-allowed}.power{flex:none;display:grid;place-items:center;width:51px;height:51px;border-radius:50%;border:1px solid rgba(255,255,255,.26);background:#292d43;color:white;cursor:pointer}
.is-on .power{border-color:color-mix(in srgb,var(--halo-accent) 70%,white);background:color-mix(in srgb,var(--halo-accent) 42%,#252748);box-shadow:0 0 20px color-mix(in srgb,var(--halo-accent) 50%,transparent)}
.power ha-icon{--mdc-icon-size:26px}.power:disabled{opacity:.45;cursor:not-allowed}.power:focus-visible,.brightness:focus-visible{outline:2px solid white;outline-offset:3px}
.compact{padding:12px;min-height:117px}.compact .frame{grid-template-columns:60px minmax(0,1fr);gap:10px}.compact .object{min-height:89px}.compact .lamp-svg{height:83px}
.compact .info{padding:0;gap:6px}.compact .title{font-size:14px}.compact .status{margin-top:3px}.compact .power{height:37px;width:37px}.compact .power ha-icon{--mdc-icon-size:21px}
.expanded{padding:22px;min-height:210px}.expanded .frame{grid-template-columns:132px minmax(0,1fr);gap:22px}.expanded .object{min-height:164px}.expanded .lamp-svg{height:145px}.expanded .title{font-size:19px}
@media(max-width:420px){.halo-card{padding:12px}.frame{grid-template-columns:70px minmax(0,1fr);gap:11px}.object{min-height:103px}.lamp-svg{height:96px}.info{gap:7px}.title{font-size:14px}.controls{gap:8px}.power{width:39px;height:39px}.power ha-icon{--mdc-icon-size:21px}.expanded .frame{grid-template-columns:88px minmax(0,1fr)}}
@media(prefers-reduced-motion:no-preference){.halo-card,.power{transition:box-shadow .2s,background .2s}}
`;

const vacuumCss=String.raw`
.halo-vacuum{position:relative;isolation:isolate;height:100%;min-height:181px;box-sizing:border-box;overflow:hidden;border-radius:23px;color:#fff;cursor:pointer;
background:radial-gradient(ellipse at 70% 8%,rgba(86,47,139,.30),transparent 75%),linear-gradient(122deg,#151023 5%,#181326 56%,#101426 100%);
border:1px solid rgba(189,144,255,.65);box-shadow:0 14px 34px rgba(0,0,0,.34),0 0 20px rgba(131,77,239,.15),inset 0 0 1px rgba(255,255,255,.5);font-family:inherit}
.halo-vacuum:focus-visible{outline:3px solid #c1a0ff;outline-offset:3px}
.halo-vacuum:hover{border-color:rgba(221,190,255,.95);box-shadow:0 14px 37px rgba(0,0,0,.38),0 0 28px rgba(171,96,255,.34)}
.halo-vacuum .vac-aura{position:absolute;inset:0;background:radial-gradient(ellipse at 35% 93%,rgba(166,73,237,.27),transparent 58%);pointer-events:none}
.halo-vacuum .vac-art-wrap{position:relative;display:flex;align-items:center;justify-content:center;height:72%;padding:4px 17px 0;box-sizing:border-box}
.halo-vacuum .vac-art{max-width:100%;max-height:100%;filter:drop-shadow(0 12px 11px rgba(0,0,0,.22));overflow:visible}
.halo-vacuum .vac-text{position:absolute;bottom:13px;left:20px;right:70px;display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.halo-vacuum .vac-title{font-size:17px;font-weight:720;letter-spacing:.01em;text-shadow:0 1px 6px #08060d}
.halo-vacuum .vac-status{font-size:12px;color:#e1d8ed;display:flex;align-items:center;gap:6px;white-space:nowrap}
.halo-vacuum .vac-status i{width:6px;height:6px;border-radius:50%;display:inline-block;box-shadow:0 0 8px currentColor}
.halo-vacuum .vac-sep{opacity:.45}
.halo-vacuum .vac-battery{position:absolute;right:14px;top:12px;display:flex;align-items:center;gap:5px;color:#e4d7ff;font-size:11px;background:rgba(15,13,31,.48);border-radius:18px;padding:5px 8px}
.halo-vacuum .vac-battery-icon{color:#a976ff;font-size:15px;line-height:1}
.halo-vacuum .vac-chevron{position:absolute;bottom:12px;right:16px;color:#d2b5ff;font-size:28px;line-height:1;opacity:.7}
.halo-vacuum .vac-robot{transform-origin:102px 102px}
.halo-vacuum.is-cleaning .vac-robot{animation:vac-drive 5.5s ease-in-out infinite alternate}
.halo-vacuum.is-returning .vac-robot{animation:vac-return 3.8s ease-in-out infinite alternate}
.halo-vacuum.is-cleaning .vac-ring,.halo-vacuum.is-returning .vac-ring{animation:vac-pulse 1.3s ease-in-out infinite}
.halo-vacuum.is-docked .vac-energy{animation:vac-flow 1.5s linear infinite}
.halo-vacuum.is-cleaning .vac-clean-wave{animation:vac-flow 1s linear infinite}
@keyframes vac-drive{to{transform:translateX(75px) rotate(10deg)}}
@keyframes vac-return{to{transform:translateX(29px)}}
@keyframes vac-pulse{50%{opacity:.9;stroke-width:5px}}
@keyframes vac-flow{to{stroke-dashoffset:-44}}
@media(prefers-reduced-motion:reduce){.halo-vacuum *{animation:none!important}}
@container (max-width:340px){.halo-vacuum .vac-art-wrap{height:70%}.halo-vacuum .vac-text{bottom:10px;left:13px}.halo-vacuum .vac-title{font-size:15px}}
`;


/* Halo Vacuum Signature: photos are pure backgrounds, status overlays remain live. */
vacuumCss += String.raw`
.halo-vacuum{
  background-image:linear-gradient(90deg,rgba(7,8,22,.02) 0%,rgba(12,9,29,.10) 42%,rgba(12,9,31,.70) 100%),var(--vac-photo);
  background-position:center;
  background-size:cover;
  border-color:rgba(181,143,255,.78);
  box-shadow:0 12px 34px rgba(0,0,0,.34),0 0 24px rgba(160,93,244,.30),inset 0 0 1px rgba(255,255,255,.40);
  min-height:181px;
}
.halo-vacuum .vac-art-wrap{display:none}
.halo-vacuum .vac-aura{
 background:radial-gradient(ellipse at 22% 87%,rgba(141,74,239,.18),transparent 60%);
 opacity:.85;
}
.halo-vacuum .vac-text{
 left:45%;right:16px;bottom:29px;gap:7px;
 text-shadow:0 2px 12px rgba(0,0,0,.78);
}
.halo-vacuum .vac-title{font-size:clamp(17px,1.5vw,22px);font-weight:650}
.halo-vacuum .vac-status{font-size:12px}
.halo-vacuum .vac-battery{top:14px;right:14px}
.halo-vacuum .vac-chevron{bottom:8px;right:14px;font-size:24px}
.halo-vacuum.is-cleaning:before,.halo-vacuum.is-returning:before,.halo-vacuum.is-docked:before{
 content:"";position:absolute;inset:-30%;pointer-events:none;
 background:radial-gradient(ellipse at 31% 65%,rgba(166,103,255,.15),transparent 33%);
 animation:vac-photo-breathe 4.5s ease-in-out infinite alternate;
}
.halo-vacuum.is-cleaning:before{animation-duration:2.8s;background:radial-gradient(ellipse at 26% 77%,rgba(87,156,255,.22),transparent 38%)}
.halo-vacuum.is-returning:before{animation-duration:3.3s;background:radial-gradient(ellipse at 27% 76%,rgba(185,92,255,.20),transparent 38%)}
@keyframes vac-photo-breathe{from{opacity:.20;transform:translateX(-10px)}to{opacity:1;transform:translateX(12px)}}
@container (max-width:350px){.halo-vacuum .vac-text{left:45%;bottom:17px}.halo-vacuum .vac-title{font-size:16px}.halo-vacuum .vac-status{font-size:10px}}
@media(prefers-reduced-motion:reduce){.halo-vacuum:before{animation:none!important}}
`;

class HaloCards extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this._config = normalize();
    this._hass = null;
    this._busy = false;
  }
  static getConfigElement() { return document.createElement("halo-cards-editor"); }
  static getStubConfig() { return {type:"custom:halo-cards",card_type:"light",style:"balanced",size:"standard"}; }
  getCardSize() { return this._config.style === "signature" ? 3 : this._config.size === "expanded" ? 3 : this._config.size === "compact" ? 1 : 2; }
  // Ask HA Sections for the full row; unlike CSS width this respects the
  // dashboard's own layout and works without absolute positioning.
  getGridOptions() {
    return this._config.card_type === "vacuum" ? {columns: 9, rows: 4, min_columns: 6, min_rows: 3} : this._config.style === "signature"
      ? { columns: 12, rows: 3, min_columns: 6, min_rows: 3 }
      : { columns: 6, rows: 2, min_columns: 3, min_rows: 2 };
  }
  setConfig(config) { this._config=normalize(config); this._render(); }
  set hass(value) { this._hass=value; this._render(); }
  _state() { return this._hass?.states?.[this._config.entity]; }
  async _call(service, data) {
    const entity=this._config.entity;
    if (this._busy || !entity || !this._hass?.callService) return;
    this._busy=true;
    try { await this._hass.callService("light",service,{entity_id:entity,...data}); }
    catch(error){ console.error("[Halo Cards] Light action failed",error); }
    finally { this._busy=false; }
  }
  _render() {
    if(this._config.card_type==="vacuum"){this._renderVacuum();return;}
    const c=this._config,state=this._state(),valid=!!state&&c.entity.startsWith("light.");
    const available=valid&&!["unavailable","unknown"].includes(state.state),on=available&&state.state==="on";
    const dimmable=available&&(Array.isArray(state.attributes?.supported_color_modes)
      ? state.attributes.supported_color_modes.some(mode=>mode!=="onoff"):state.attributes?.brightness!==undefined);
    const level=on?Math.round((Number(state.attributes?.brightness)||255)/255*100):0;
    const title=c.name||state?.attributes?.friendly_name||"Halo Light";
    const unsupported=c.card_type!=="light";
    const status=unsupported?"Demnächst":!c.entity?"Bitte Licht-Entität wählen":!valid?"Entität nicht gefunden":!available?"Nicht verfügbar":on?"Eingeschaltet":"Ausgeschaltet";
    const preset=LAMP_PRESETS[c.lamp_type] || LAMP_PRESETS.living;
    const image=c.style==="signature"&&(c.scene==="custom" ? c.background : "/hacsfiles/halo-ui/"+preset.prefix+"-"+(on?"on":"off")+".webp");
    const safeImage=image?encodeURI(image).replace(/"/g,"%22").replace(/\x27/g,"%27"):"";
    const vars='--halo-accent:'+c.accent+';--glow:'+(c.glow_strength/100)+';--level:'+level+'%;'+(image?'--halo-image:url(&quot;'+esc(safeImage)+'&quot;);':'');
    const classes=[c.style,c.size,on?"is-on":"is-off","scene-"+c.scene,image?"has-image":"","signature-photo",!dimmable?"no-dimmer":""].join(" ");
    const lamp='<svg class="lamp-svg" viewBox="0 0 100 126" role="img" aria-label="Lampe"><ellipse class="lamp-glow" cx="50" cy="50" rx="43" ry="39"/><path class="lamp-shade" d="M18 50C20 23 31 15 50 15S80 23 82 50Z"/><rect class="lamp-metal" x="48" y="50" width="4" height="52" rx="2"/><ellipse class="lamp-metal" cx="50" cy="105" rx="23" ry="5"/><path fill="rgba(255,255,255,.25)" d="M28 44C32 26 40 22 49 21C37 28 35 36 33 44Z"/></svg>';
    this.shadowRoot.innerHTML='<style>'+cardCss+'</style><ha-card><div class="halo-card '+classes+'" style="'+vars+'"><div class="frame"><div class="object">'+(unsupported?'<ha-icon icon="mdi:layers-outline"></ha-icon>':lamp)+'</div><div class="info"><div class="heading"><div><div class="title">'+esc(title)+'</div>'+(c.show_status?'<div class="status"><span class="dot"></span>'+esc(status)+'</div>':'')+'</div><span class="percent">'+(unsupported?'':available?(dimmable?level+' %':on?'An':'Aus'):'–')+'</span></div>'+
    (unsupported?'<div class="status">Weitere Kartentypen folgen.</div>':'<div class="controls">'+(c.show_brightness&&dimmable?'<div class="slider-wrap"><input class="brightness" type="range" min="1" max="100" value="'+(level||1)+'" aria-label="Helligkeit" '+(!available?'disabled':'')+'></div>':'<div class="slider-wrap"></div>')+'<button class="power" type="button" aria-label="Licht schalten" '+(!available?'disabled':'')+'><ha-icon icon="mdi:power"></ha-icon></button></div>')+'</div></div></div></ha-card>';
    this.shadowRoot.querySelector('.power')?.addEventListener('click',()=>this._call(on?'turn_off':'turn_on',{}));
    const slider=this.shadowRoot.querySelector('.brightness');
    slider?.addEventListener('input',event=>event.target.style.setProperty('--level',event.target.value+'%'));
    slider?.addEventListener('change',event=>this._call('turn_on',{brightness_pct:Number(event.target.value)}));
  }

  _renderVacuum(){
    const c=this._config,h=this._hass,states=h?.states||{},entity=states[c.entity],preview=states["input_boolean.z60_preview"]?.state==="on";
    const pick=(id)=>states[id]?.state;
    let mode=entity?.state||"unknown";
    const previewState=pick("input_select.z60_preview_state");
    if(preview && previewState && previewState!=="real")mode=previewState;
    let battery=Number(entity?.attributes?.battery_level);
    if(!Number.isFinite(battery))battery=Number(pick("sensor.z60_ultra_roller_complete_battery_level"));
    const pb=Number(pick("input_number.z60_preview_battery"));
    if(preview&&Number.isFinite(pb))battery=pb;
    battery=Number.isFinite(battery)?Math.min(100,Math.max(0,Math.round(battery))):null;
    const active=mode==="cleaning",returning=mode==="returning",docked=mode==="docked",paused=mode==="paused";
    const charging=String(pick("sensor.z60_ultra_roller_complete_charging_state")||"").toLowerCase();
    const base=String(pick("sensor.z60_ultra_roller_complete_self_wash_base_status")||"").toLowerCase();
    const drying=String(pick("sensor.z60_ultra_roller_complete_drying_progress")||"").toLowerCase();
    const pdock=pick("input_select.z60_preview_dockmode");
    let isDrying=drying.includes("dry")||drying.includes("trock")||base.includes("dry")||base.includes("trock");
    let isCharging=charging.includes("charg")||charging.includes("lad")||(docked&&battery!==null&&battery<99);
    if(preview&&pdock&&pdock!=="auto"){isDrying=pdock==="drying";isCharging=pdock==="charging";}
    const label=!entity?"Entität nicht gefunden":mode==="unavailable"?"Nicht verfügbar":active?"Reinigt":returning?"Kehrt zurück":paused?"Pausiert":docked?(isDrying?"Trocknet":isCharging?"Lädt":"Angedockt"):"Bereit";
    const name=c.name||entity?.attributes?.friendly_name||"Staubsauger";
    const level=battery===null?"–":battery+" %";
    const robot=String.raw`<g class="vac-robot">
      <ellipse cx="102" cy="160" rx="55" ry="10" fill="#000" opacity=".36"/>
      <circle cx="102" cy="102" r="57" fill="url(#vac-body)" stroke="#9e93c8" stroke-opacity=".5" stroke-width="2"/>
      <circle cx="102" cy="102" r="50" fill="none" stroke="#e5ceff" stroke-opacity=".10" stroke-width="4"/>
      <circle cx="102" cy="74" r="18" fill="#111423" stroke="#cfbafa" stroke-opacity=".65" stroke-width="3"/>
      <circle cx="102" cy="74" r="11" fill="#28273e"/>
      <path d="M95 77 L102 69 L109 77 M97 76 V82 H107 V76" fill="none" stroke="#e8dcff" stroke-width="2" stroke-linejoin="round"/>
      <text x="102" y="134" text-anchor="middle" fill="#f8ecff" opacity=".58" font-size="11" font-weight="700" letter-spacing="1.5">MOVA</text>
      <circle class="vac-ring" cx="102" cy="102" r="58" fill="none" stroke="#bd72ff" stroke-width="3" opacity=".25"/>
    </g>`;
    const dock=String.raw`<g class="vac-dock">
      <rect x="209" y="25" width="114" height="148" rx="19" fill="url(#vac-dock)" stroke="#a18bc2" stroke-opacity=".32" stroke-width="2"/>
      <rect x="220" y="36" width="92" height="24" rx="11" fill="#0d1020"/>
      <text x="266" y="52" text-anchor="middle" fill="#b7a7dd" opacity=".7" font-size="10" letter-spacing="2">MOVA</text>
      <rect x="221" y="70" width="90" height="35" rx="11" fill="#343348" stroke="#b8a9da" stroke-opacity=".14"/>
      <rect x="221" y="112" width="90" height="45" rx="10" fill="#151728" stroke="#b8a9da" stroke-opacity=".3"/>
      <path d="M231 117 H301" stroke="#d5c2f0" stroke-opacity=".16" stroke-width="3"/>
    </g>`;
    const svg='<svg class="vac-art" viewBox="0 0 355 198" role="img" aria-label="MOVA Staubsauger und Station"><defs>'+
      '<radialGradient id="vac-body"><stop stop-color="#414055"/><stop offset=".64" stop-color="#171a29"/><stop offset="1" stop-color="#090b15"/></radialGradient>'+
      '<linearGradient id="vac-dock" x2="0" y2="1"><stop stop-color="#343044"/><stop offset="1" stop-color="#0d101f"/></linearGradient>'+
      '<linearGradient id="vac-wire"><stop stop-color="#fc99e2"/><stop offset="1" stop-color="#8a4cf9"/></linearGradient>'+
      '</defs><ellipse cx="178" cy="184" rx="167" ry="9" fill="#050516" opacity=".3"/>'+
      (active||paused?robot:(returning?dock+robot:robot+dock))+
      (docked?'<path class="vac-energy" d="M162 122 Q188 134 208 127" fill="none" stroke="url(#vac-wire)" stroke-width="5" stroke-dasharray="9 13" stroke-linecap="round"/>':'')+
      (active?'<path class="vac-clean-wave" d="M48 111 Q6 76 51 49 M157 108 Q202 73 159 48" fill="none" stroke="#ae7aff" stroke-opacity=".6" stroke-width="5" stroke-dasharray="8 14"/>':'')+
      '</svg>';
    const statusColor=active?"#d8a4ff":docked?"#83dec2":returning?"#bca4ff":"#aba4bf";
    const classes=(active?"is-cleaning ":returning?"is-returning ":paused?"is-paused ":"")+(docked?"is-docked":"");
    const visualState=active?"cleaning":returning?"returning":paused?"paused":docked?"docked":"paused";
    const sceneUrl="/hacsfiles/halo-ui/halo-vacuum-"+visualState+".webp";
    this.shadowRoot.innerHTML='<style>'+cardCss+vacuumCss+'</style><ha-card><article class="halo-vacuum '+classes+'" style="--vac-photo:url(&quot;'+sceneUrl+'&quot;)" tabindex="0" role="link" aria-label="'+esc(name)+' – '+esc(label)+'. Staubsauger-Dashboard öffnen">'+
      '<div class="vac-aura"></div><div class="vac-art-wrap">'+svg+'</div><div class="vac-text"><span class="vac-title">'+esc(name)+'</span>'+
      '<span class="vac-status"><i style="background:'+statusColor+'"></i>'+esc(label)+' <span class="vac-sep">·</span> '+esc(level)+'</span></div>'+
      '<div class="vac-battery" style="--bat:'+(battery??0)+'%"><span class="vac-battery-icon">ϟ</span><span>'+esc(level)+'</span></div>'+
      '<span class="vac-chevron" aria-hidden="true">›</span></article></ha-card>';
    const root=this.shadowRoot.querySelector(".halo-vacuum");
    const navigate=()=>{if(!c.navigation_path)return;history.pushState(null,"",c.navigation_path);window.dispatchEvent(new Event("location-changed"));};
    root?.addEventListener("click",navigate);
    root?.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();navigate();}});
    root?.addEventListener("contextmenu",e=>{e.preventDefault();root.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:c.entity},bubbles:true,composed:true}));});
  }
}
// additional signature styles appended to card CSS
cardCss += "\n/* Halo Light Signature photo composition — asset contains NO static interface text. */\n.halo-card.signature.signature-photo{min-height:181px;padding:21px 23px;border-radius:23px}\n.halo-card.signature.signature-photo.has-image{\n  background-image:linear-gradient(90deg,transparent 0%,rgba(17,13,38,.08) 35%,rgba(11,15,39,.14) 100%),var(--halo-image);\n  background-position:center;background-size:cover;\n}\n.halo-card.signature.signature-photo:before{background:radial-gradient(ellipse at 91% 99%,color-mix(in srgb,var(--halo-accent) 50%,transparent),transparent 48%);opacity:calc(var(--glow) * .8)}\n.halo-card.signature.signature-photo .frame{display:block;margin-left:40%;min-height:136px}\n.halo-card.signature.signature-photo .object{display:none}\n.halo-card.signature.signature-photo .info{min-height:137px;padding:8px 0 1px;gap:12px}\n.halo-card.signature.signature-photo .title{font-size:clamp(16px,1.4vw,22px);font-weight:520;letter-spacing:.01em;text-shadow:0 1px 10px rgba(4,5,19,.7)}\n.halo-card.signature.signature-photo .status{font-size:13px;margin-top:11px}\n.halo-card.signature.signature-photo .dot{background:#b18cff;box-shadow:0 0 11px #b18cff}\n.halo-card.signature.signature-photo.is-off .dot{background:#9292a8;box-shadow:none}\n.halo-card.signature.signature-photo .controls{gap:15px;justify-content:flex-end}\n.halo-card.signature.signature-photo .slider-wrap{min-height:40px}\n.halo-card.signature.signature-photo .power{width:63px;height:63px;\n border:2px solid #d0aaff;background:linear-gradient(145deg,#8556d4,#613b95);\n box-shadow:0 0 14px rgba(172,102,255,.75),0 0 27px rgba(159,87,250,.46),inset 0 0 16px rgba(255,255,255,.16)}\n.halo-card.signature.signature-photo.is-off .power{background:rgba(33,32,53,.62);border-color:rgba(222,206,255,.58);box-shadow:0 0 10px rgba(129,103,183,.18)}\n.halo-card.signature.signature-photo .brightness{height:10px;background:linear-gradient(90deg,#9858ff,#83afff var(--level),rgba(215,205,255,.24) var(--level),rgba(215,205,255,.24))}\n.halo-card.signature.signature-photo.is-off.has-image{background-image:linear-gradient(90deg,rgba(8,12,29,.48),rgba(8,12,29,.39)),var(--halo-image)}\n.halo-card.signature.signature-photo.compact{min-height:145px;padding:14px}\n.halo-card.signature.signature-photo.compact .frame{min-height:115px}\n.halo-card.signature.signature-photo.compact .info{min-height:111px}\n.halo-card.signature.signature-photo.compact .power{width:43px;height:43px}\n.halo-card.signature.signature-photo.expanded{min-height:236px;padding:25px}\n.halo-card.signature.signature-photo.expanded .frame{min-height:182px}\n.halo-card.signature.signature-photo.expanded .info{min-height:180px}\n@media(max-width:420px){\n .halo-card.signature.signature-photo{padding:13px;min-height:163px}\n .halo-card.signature.signature-photo .frame{margin-left:39%;min-height:132px}\n .halo-card.signature.signature-photo .info{min-height:132px}\n .halo-card.signature.signature-photo .power{width:43px;height:43px}\n .halo-card.signature.signature-photo .controls{gap:7px}\n .halo-card.signature.signature-photo .title{font-size:14px}\n}\n";
cardCss += "\n/* Responsive sizing is based on the real card width, not viewport width. */\n:host{container-type:inline-size}\n.halo-card.signature.signature-photo{min-height:205px;border:1px solid rgba(191,147,255,.7);box-shadow:0 15px 43px rgba(0,0,0,.34),0 0 23px rgba(115,87,235,.24)}\n.halo-card.signature.signature-photo.has-image{background-position:center left}\n.halo-card.signature.signature-photo.is-off.has-image{background-image:linear-gradient(90deg,rgba(6,8,24,.58),rgba(9,12,30,.48)),var(--halo-image);filter:none}\n.halo-card.signature.signature-photo .frame{margin-left:38%;min-height:160px}\n.halo-card.signature.signature-photo .info{min-height:160px}\n.halo-card.signature.signature-photo .power{width:68px;height:68px}\n@container (min-width:620px){\n .halo-card.signature.signature-photo{min-height:244px;padding:25px 33px}\n .halo-card.signature.signature-photo .frame{margin-left:39%;min-height:192px}\n .halo-card.signature.signature-photo .info{min-height:192px}\n .halo-card.signature.signature-photo .title{font-size:clamp(21px,3.2cqw,30px)}\n .halo-card.signature.signature-photo .status{font-size:15px}\n .halo-card.signature.signature-photo .percent{font-size:17px}\n .halo-card.signature.signature-photo .power{width:78px;height:78px}\n}\n@container (max-width:460px){\n .halo-card.signature.signature-photo{min-height:153px;padding:13px}\n .halo-card.signature.signature-photo .frame{margin-left:38%;min-height:125px}\n .halo-card.signature.signature-photo .info{min-height:125px;gap:9px}\n .halo-card.signature.signature-photo .title{font-size:15px}\n .halo-card.signature.signature-photo .power{width:44px;height:44px}\n .halo-card.signature.signature-photo .controls{gap:9px}\n}\n";
cardCss += "\n/* V3: composition matched to original Halo Light Signature reference. */\n.halo-card.signature.signature-photo {\n --halo-accent:#a27bff;\n position:relative;\n min-height:228px;\n padding:22px 25px;\n border:1.5px solid rgba(173,143,255,.85);\n border-radius:25px;\n box-shadow:0 12px 36px rgba(0,0,0,.36),0 0 14px rgba(109,95,250,.26),inset 0 0 1px rgba(255,255,255,.55);\n}\n.halo-card.signature.signature-photo.has-image {\n background-position:25% center;\n background-size:cover;\n}\n.halo-card.signature.signature-photo:after {\n background:linear-gradient(90deg,rgba(10,11,28,.00) 0%,rgba(12,10,31,.20) 35%,rgba(13,12,37,.14) 73%,rgba(11,14,38,.16) 100%);\n}\n.halo-card.signature.signature-photo:before {\n background:radial-gradient(ellipse at 98% 95%,rgba(149,108,255,.25),transparent 39%);\n opacity:var(--glow);\n}\n.halo-card.signature.signature-photo .frame {\n margin-left:39%;\n min-height:180px;\n}\n.halo-card.signature.signature-photo .info {\n min-height:180px;\n gap:22px;\n padding:8px 0 4px;\n}\n.halo-card.signature.signature-photo .title {\n font-size:clamp(20px,3.9cqw,31px);\n font-weight:510;\n letter-spacing:.01em;\n line-height:1.18;\n text-shadow:0 2px 12px rgba(7,7,18,.9);\n}\n.halo-card.signature.signature-photo .status {\n margin-top:15px;\n font-size:14px;\n color:#ddd6ee;\n text-shadow:0 1px 10px rgba(0,0,0,.85);\n}\n.halo-card.signature.signature-photo .dot {\n width:10px;height:10px;\n background:#ba91ff;\n box-shadow:0 0 8px 3px rgba(159,93,255,.58);\n}\n.halo-card.signature.signature-photo .percent {\n font-size:14px;\n color:#efe8ff;\n font-weight:500;\n text-shadow:0 1px 10px #080819;\n}\n.halo-card.signature.signature-photo .power {\n width:77px;height:77px;\n border:2px solid #deb4ff;\n background:radial-gradient(circle at 35% 25%,#a579fd,#6c40ba 68%,#4c2d93);\n color:#fff;\n box-shadow:0 0 12px rgba(187,117,255,.75),0 0 27px rgba(145,89,255,.54),inset 0 2px 14px rgba(255,255,255,.23);\n}\n.halo-card.signature.signature-photo .power ha-icon {--mdc-icon-size:34px}\n.halo-card.signature.signature-photo.is-off .power {\n background:radial-gradient(circle at 35% 25%,rgba(98,73,152,.7),rgba(33,30,67,.88));\n border-color:rgba(214,171,255,.85);\n box-shadow:0 0 11px rgba(153,106,222,.46),0 0 23px rgba(131,86,215,.22),inset 0 1px 12px rgba(203,167,255,.09);\n}\n.halo-card.signature.signature-photo.is-off.has-image {\n background-image:linear-gradient(90deg,rgba(4,6,22,.52),rgba(9,9,29,.43)),var(--halo-image);\n}\n.halo-card.signature.signature-photo.is-off .dot {background:#9694ab;box-shadow:none}\n.halo-card.signature.signature-photo .controls {margin-top:auto;justify-content:flex-end;gap:20px}\n.halo-card.signature.signature-photo.no-dimmer .slider-wrap {display:none}\n.halo-card.signature.signature-photo.no-dimmer .power {margin-right:5px}\n.halo-card.signature.signature-photo .brightness {\n background:linear-gradient(90deg,#a474ff,#93b5ff var(--level),rgba(200,189,239,.22) var(--level),rgba(200,189,239,.22));\n box-shadow:0 0 7px rgba(151,115,255,.38);\n}\n@container (min-width:760px) {\n .halo-card.signature.signature-photo {min-height:275px;padding:30px 38px}\n .halo-card.signature.signature-photo .frame {min-height:213px;margin-left:40%}\n .halo-card.signature.signature-photo .info {min-height:213px}\n .halo-card.signature.signature-photo .title {font-size:clamp(29px,3.3cqw,40px)}\n .halo-card.signature.signature-photo .power {width:91px;height:91px}\n .halo-card.signature.signature-photo .power ha-icon {--mdc-icon-size:40px}\n}\n@container (max-width:610px) {\n .halo-card.signature.signature-photo {min-height:208px;padding:18px 19px}\n .halo-card.signature.signature-photo .frame {margin-left:39%;min-height:169px}\n .halo-card.signature.signature-photo .info {min-height:169px}\n .halo-card.signature.signature-photo .title {font-size:clamp(17px,4.2cqw,25px)}\n .halo-card.signature.signature-photo .status {font-size:12px;margin-top:12px}\n .halo-card.signature.signature-photo .power {width:65px;height:65px}\n .halo-card.signature.signature-photo .power ha-icon {--mdc-icon-size:28px}\n}\n@container (max-width:400px) {\n .halo-card.signature.signature-photo {min-height:170px;padding:13px}\n .halo-card.signature.signature-photo .frame {margin-left:39%;min-height:140px}\n .halo-card.signature.signature-photo .info {min-height:140px}\n .halo-card.signature.signature-photo .title {font-size:15px}\n .halo-card.signature.signature-photo .heading {gap:6px}\n .halo-card.signature.signature-photo .percent {font-size:11px}\n .halo-card.signature.signature-photo .power {width:50px;height:50px}\n .halo-card.signature.signature-photo .power ha-icon {--mdc-icon-size:24px}\n .halo-card.signature.signature-photo .status {font-size:11px}\n}\n";
cardCss += "\n/* OFF is a dedicated unlit room image: do not darken it twice. */\n.halo-card.signature.signature-photo.is-off.has-image{\n background-image:linear-gradient(90deg,rgba(7,9,25,.05),rgba(8,10,29,.12)),var(--halo-image);\n}\n";
const editorCss=String.raw`
  :host { display:block; color:var(--primary-text-color); font-family:inherit; }
  .editor { border-radius:18px; background:var(--card-background-color,#1c2130); padding:16px; }
  h3 { margin:0 0 5px; font-size:21px; } .subtitle { opacity:.65; font-size:12px; margin:0 0 18px; }
  .tabs { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:18px; }
  .tabs button { padding:9px 12px; border:1px solid var(--divider-color,#475063); border-radius:10px;
    background:transparent; color:inherit; cursor:pointer; }
  .tabs button.selected { border-color:var(--primary-color,#a178ff); background:color-mix(in srgb,var(--primary-color,#a178ff) 17%,transparent); }
  .choices { display:grid; grid-template-columns:repeat(auto-fit,minmax(115px,1fr)); gap:9px; }
  .choice { text-align:left; cursor:pointer; padding:14px 9px; min-height:78px; border-radius:13px; border:1px solid var(--divider-color,#475063);
    background:rgba(120,120,145,.06); color:inherit; }
  .choice ha-icon { display:block; margin-bottom:9px; color:var(--primary-color,#a178ff); }
  .choice.selected { border:2px solid var(--primary-color,#a178ff); background:color-mix(in srgb,var(--primary-color,#a178ff) 15%,transparent); }
  .choice small { display:block; opacity:.65; margin-top:5px; } .choice:disabled { cursor:not-allowed; opacity:.48; }
  .fields { display:grid; grid-template-columns:1fr; gap:12px; } label.field { display:grid; gap:5px; font-size:13px; }
  input[type=text],select,input[type=color] { min-height:40px; box-sizing:border-box; width:100%; border-radius:10px; border:1px solid var(--divider-color,#475063);
    background:var(--secondary-background-color,#222635); color:var(--primary-text-color,#fff); padding:8px 10px; font:inherit; }
  input[type=color] { padding:4px; }
  .preview { margin-top:20px; border-top:1px solid var(--divider-color,#475063); padding-top:16px; }
  .preview h4 { margin:0 0 10px; font-size:13px; }
  .note { font-size:12px; opacity:.7; line-height:1.5; margin-top:10px; }
  button:focus-visible,input:focus-visible,select:focus-visible { outline:2px solid var(--primary-color,#a178ff); outline-offset:2px; }
`;
class HaloCardsEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:"open"}); this._config=normalize(); this._step="type"; this._hass=null; }
  set hass(value) { this._hass=value; this._updatePreview(); }
  setConfig(config) { this._config=normalize(config); this._render(); }
  _change(key,value) {
    this._config={...this._config,[key]:value};
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));
    this._render();
  }
  _render() {
    const c=this._config,steps=[["type","Kartentyp"],["entity","Entität"],["design","Design"],["media","Medien"],["actions","Aktionen"]];
    const buttons=steps.map(([id,label])=>'<button type="button" data-step="'+id+'" class="'+(this._step===id?'selected':'')+'">'+label+'</button>').join('');
    const choices=CARD_TYPES.map(t=>'<button type="button" class="choice '+(t.id===c.card_type?'selected':'')+'" data-type="'+t.id+'" '+(t.soon?'disabled':'')+'><ha-icon icon="'+t.icon+'"></ha-icon>'+t.label+(t.soon?'<small>Demnächst</small>':'<small>Jetzt verfügbar</small>')+'</button>').join('');
    const styles=STYLES.map(s=>'<button type="button" class="choice '+(s===c.style?'selected':'')+'" data-style="'+s+'"><ha-icon icon="mdi:palette-outline"></ha-icon>'+s[0].toUpperCase()+s.slice(1)+'</button>').join('');
    const sizes=SIZES.map(s=>'<button type="button" class="choice '+(s===c.size?'selected':'')+'" data-size="'+s+'">'+({compact:"Kompakt",standard:"Standard",expanded:"Erweitert"}[s])+'</button>').join('');
    const isVac=c.card_type==='vacuum';
    const entities=Object.keys(this._hass?.states||{}).filter(key=>key.startsWith(isVac?'vacuum.':'light.')).sort();
    const options='<option value="">'+(isVac?'Staubsauger auswählen…':'Licht auswählen…')+'</option>'+entities.map(id=>'<option value="'+esc(id)+'" '+(id===c.entity?'selected':'')+'>'+esc(this._hass.states[id]?.attributes?.friendly_name||id)+' ('+esc(id)+')</option>').join('');
    let body='';
    if(this._step==='type')body='<div class="choices">'+choices+'</div><p class="note">Halo Light und Halo Vacuum verfügbar – alles über denselben Karten-Eintrag.</p>'; 
    if(this._step==='entity')body='<div class="fields"><label class="field">'+(isVac?'Staubsauger':'Licht')+'-Entität<select data-field="entity">'+options+'</select></label><label class="field">Anzeigename<input type="text" data-field="name" value="'+esc(c.name)+'" placeholder="Name der Entität übernehmen"></label></div>'; 
    if(this._step==='design')body='<div class="fields"><label>Halo Adaptive</label><div class="choices">'+styles+'</div><label>Kartengröße</label><div class="choices">'+sizes+'</div><label class="field">Akzentfarbe<input type="color" data-field="accent" value="'+c.accent+'"></label><label class="field">Glow-Intensität: '+c.glow_strength+' %<input type="range" min="0" max="100" data-field="glow_strength" value="'+c.glow_strength+'"></label></div>';
    if(isVac&&this._step==='media')body='<p class="note">Halo Vacuum verwendet die animierte MOVA-Darstellung und benötigt keine Bilddateien. Status und Akku kommen von Home Assistant.</p>';
    if(!isVac&&this._step==='media')body='<div class="fields"><label class="field">Lampentyp<select data-field="lamp_type">'+Object.entries(LAMP_PRESETS).map(([id,p])=>'<option value="'+id+'" '+(c.lamp_type===id?'selected':'')+'>'+p.label+'</option>').join('')+'</select></label><label class="field">Signature-Lichtstimmung<select data-field="scene"><option value="warm" '+(c.scene==='warm'?'selected':'')+'>Automatische AN/AUS-Bilder</option><option value="cool" '+(c.scene==='cool'?'selected':'')+'>Kühle Farbwirkung (gleiche Bilder)</option><option value="custom" '+(c.scene==='custom'?'selected':'')+'>Eigenes Hintergrundbild</option></select></label><label class="field">Eigenes Hintergrundbild (nur bei „Eigenes Bild“)<input type="text" data-field="background" value="'+esc(c.background)+'" placeholder="/local/wohnzimmer.jpg"></label><p class="note">Bei den mitgelieferten Lampenmotiven wechselt das Bild automatisch bei AN/AUS. Für benutzerdefinierte Bilder wird derzeit dieselbe Bildadresse verwendet.</p></div>';
    if(isVac&&this._step==='actions')body='<div class="fields"><label class="field">Dashboard beim Antippen öffnen<input type="text" data-field="navigation_path" value="'+esc(c.navigation_path)+'" placeholder="/dashboard-x/vacuum"></label><p class="note">Antippen öffnet das Dashboard. Rechtsklick zeigt Entitätsdetails. Keine Start-, Pause- oder Docking-Buttons.</p></div>';
    if(!isVac&&this._step==='actions')body='<div class="fields"><label><input type="checkbox" data-field="show_brightness" '+(c.show_brightness?'checked':'')+'> Helligkeitsregler anzeigen</label><label><input type="checkbox" data-field="show_status" '+(c.show_status?'checked':'')+'> Status anzeigen</label><p class="note">Licht schalten über Power-Button, Dimmen beim Loslassen.</p></div>';
    this.shadowRoot.innerHTML='<style>'+editorCss+'</style><section class="editor"><h3>Halo Cards</h3><p class="subtitle">Eine Karte. Viele Möglichkeiten. · Entwicklungs-Vorschau</p><nav class="tabs">'+buttons+'</nav>'+body+'<p class="note">Die Live-Vorschau wird rechts im Home-Assistant-Karteneditor angezeigt.</p></section>';
    this.shadowRoot.querySelectorAll('[data-step]').forEach(el=>el.addEventListener('click',()=>{this._step=el.dataset.step;this._render();}));
    for(const key of ['type','style','size'])this.shadowRoot.querySelectorAll('[data-'+key+']').forEach(el=>
      el.addEventListener('click',()=>this._change(key==='type'?'card_type':key,el.dataset[key])));
    this.shadowRoot.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('change',()=>{
      this._change(el.dataset.field,el.type==='checkbox'?el.checked:el.dataset.field==='glow_strength'?Number(el.value):el.value);
    }));
    this._updatePreview();
  }
  _updatePreview() {
    const preview=this.shadowRoot?.querySelector('halo-cards');
    if(preview){ preview.setConfig(this._config);if(this._hass)preview.hass=this._hass; }
  }
}
if(!customElements.get('halo-cards'))customElements.define('halo-cards',HaloCards);
if(!customElements.get('halo-cards-editor'))customElements.define('halo-cards-editor',HaloCardsEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='halo-cards')){
  window.customCards.push({type:'halo-cards',name:'Halo Cards',description:'Halo Adaptive – eigene Smart-Home-Karten mit visuellem Konfigurator',preview:true});
}
