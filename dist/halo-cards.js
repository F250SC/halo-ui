// Halo Cards — independent Lovelace card family. Preview version: Halo Light.
const CARD_TYPES = [
  { id: "light", label: "Licht", icon: "mdi:lightbulb-outline" },
  { id: "climate", label: "Klima", icon: "mdi:thermostat", soon: true },
  { id: "room", label: "Raum", icon: "mdi:home-outline", soon: true },
  { id: "media", label: "Medien", icon: "mdi:play-box-outline", soon: true },
  { id: "status", label: "Status", icon: "mdi:chart-line", soon: true }
];
const STYLES = ["minimal", "balanced", "signature"];
const SIZES = ["compact", "standard", "expanded"];
const DEFAULTS = {
  type: "custom:halo-cards", card_type: "light", entity: "",
  name: "", style: "balanced", size: "standard",
  accent: "#a178ff", background: "", show_brightness: true, show_status: true,
  glow_strength: 70, scene: "warm"
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
  getCardSize() { return this._config.size === "expanded" ? 3 : this._config.size === "compact" ? 1 : 2; }
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
    const c=this._config,state=this._state(),valid=!!state&&c.entity.startsWith("light.");
    const available=valid&&!["unavailable","unknown"].includes(state.state),on=available&&state.state==="on";
    const dimmable=available&&(Array.isArray(state.attributes?.supported_color_modes)
      ? state.attributes.supported_color_modes.some(mode=>mode!=="onoff"):state.attributes?.brightness!==undefined);
    const level=on?Math.round((Number(state.attributes?.brightness)||255)/255*100):0;
    const title=c.name||state?.attributes?.friendly_name||"Halo Light";
    const unsupported=c.card_type!=="light";
    const status=unsupported?"Demnächst":!c.entity?"Bitte Licht-Entität wählen":!valid?"Entität nicht gefunden":!available?"Nicht verfügbar":on?"Eingeschaltet":"Ausgeschaltet";
    const image=c.style==="signature"&&(c.scene==="custom"?c.background:"/hacsfiles/halo-ui/halo-light-signature.webp");
    const safeImage=image?encodeURI(image).replace(/"/g,"%22").replace(/\x27/g,"%27"):"";
    const vars='--halo-accent:'+c.accent+';--glow:'+(c.glow_strength/100)+';--level:'+level+'%;'+(image?'--halo-image:url(&quot;'+esc(safeImage)+'&quot;);':'');
    const classes=[c.style,c.size,on?"is-on":"is-off","scene-"+c.scene,image?"has-image":"","signature-photo"].join(" ");
    const lamp='<svg class="lamp-svg" viewBox="0 0 100 126" role="img" aria-label="Lampe"><ellipse class="lamp-glow" cx="50" cy="50" rx="43" ry="39"/><path class="lamp-shade" d="M18 50C20 23 31 15 50 15S80 23 82 50Z"/><rect class="lamp-metal" x="48" y="50" width="4" height="52" rx="2"/><ellipse class="lamp-metal" cx="50" cy="105" rx="23" ry="5"/><path fill="rgba(255,255,255,.25)" d="M28 44C32 26 40 22 49 21C37 28 35 36 33 44Z"/></svg>';
    this.shadowRoot.innerHTML='<style>'+cardCss+'</style><ha-card><div class="halo-card '+classes+'" style="'+vars+'"><div class="frame"><div class="object">'+(unsupported?'<ha-icon icon="mdi:layers-outline"></ha-icon>':lamp)+'</div><div class="info"><div class="heading"><div><div class="title">'+esc(title)+'</div>'+(c.show_status?'<div class="status"><span class="dot"></span>'+esc(status)+'</div>':'')+'</div><span class="percent">'+(unsupported?'':available?(dimmable?level+' %':on?'An':'Aus'):'–')+'</span></div>'+
    (unsupported?'<div class="status">Weitere Kartentypen folgen.</div>':'<div class="controls">'+(c.show_brightness&&dimmable?'<div class="slider-wrap"><input class="brightness" type="range" min="1" max="100" value="'+(level||1)+'" aria-label="Helligkeit" '+(!available?'disabled':'')+'></div>':'<div class="slider-wrap"></div>')+'<button class="power" type="button" aria-label="Licht schalten" '+(!available?'disabled':'')+'><ha-icon icon="mdi:power"></ha-icon></button></div>')+'</div></div></div></ha-card>';
    this.shadowRoot.querySelector('.power')?.addEventListener('click',()=>this._call(on?'turn_off':'turn_on',{}));
    const slider=this.shadowRoot.querySelector('.brightness');
    slider?.addEventListener('input',event=>event.target.style.setProperty('--level',event.target.value+'%'));
    slider?.addEventListener('change',event=>this._call('turn_on',{brightness_pct:Number(event.target.value)}));
  }
}
// additional signature styles appended to card CSS
cardCss += "\n/* Halo Light Signature photo composition — asset contains NO static interface text. */\n.halo-card.signature.signature-photo{min-height:181px;padding:21px 23px;border-radius:23px}\n.halo-card.signature.signature-photo.has-image{\n  background-image:linear-gradient(90deg,transparent 0%,rgba(17,13,38,.08) 35%,rgba(11,15,39,.14) 100%),var(--halo-image);\n  background-position:center;background-size:cover;\n}\n.halo-card.signature.signature-photo:before{background:radial-gradient(ellipse at 91% 99%,color-mix(in srgb,var(--halo-accent) 50%,transparent),transparent 48%);opacity:calc(var(--glow) * .8)}\n.halo-card.signature.signature-photo .frame{display:block;margin-left:40%;min-height:136px}\n.halo-card.signature.signature-photo .object{display:none}\n.halo-card.signature.signature-photo .info{min-height:137px;padding:8px 0 1px;gap:12px}\n.halo-card.signature.signature-photo .title{font-size:clamp(16px,1.4vw,22px);font-weight:520;letter-spacing:.01em;text-shadow:0 1px 10px rgba(4,5,19,.7)}\n.halo-card.signature.signature-photo .status{font-size:13px;margin-top:11px}\n.halo-card.signature.signature-photo .dot{background:#b18cff;box-shadow:0 0 11px #b18cff}\n.halo-card.signature.signature-photo.is-off .dot{background:#9292a8;box-shadow:none}\n.halo-card.signature.signature-photo .controls{gap:15px;justify-content:flex-end}\n.halo-card.signature.signature-photo .slider-wrap{min-height:40px}\n.halo-card.signature.signature-photo .power{width:63px;height:63px;\n border:2px solid #d0aaff;background:linear-gradient(145deg,#8556d4,#613b95);\n box-shadow:0 0 14px rgba(172,102,255,.75),0 0 27px rgba(159,87,250,.46),inset 0 0 16px rgba(255,255,255,.16)}\n.halo-card.signature.signature-photo.is-off .power{background:rgba(33,32,53,.62);border-color:rgba(222,206,255,.58);box-shadow:0 0 10px rgba(129,103,183,.18)}\n.halo-card.signature.signature-photo .brightness{height:10px;background:linear-gradient(90deg,#9858ff,#83afff var(--level),rgba(215,205,255,.24) var(--level),rgba(215,205,255,.24))}\n.halo-card.signature.signature-photo.is-off.has-image{background-image:linear-gradient(90deg,rgba(8,12,29,.48),rgba(8,12,29,.39)),var(--halo-image)}\n.halo-card.signature.signature-photo.compact{min-height:145px;padding:14px}\n.halo-card.signature.signature-photo.compact .frame{min-height:115px}\n.halo-card.signature.signature-photo.compact .info{min-height:111px}\n.halo-card.signature.signature-photo.compact .power{width:43px;height:43px}\n.halo-card.signature.signature-photo.expanded{min-height:236px;padding:25px}\n.halo-card.signature.signature-photo.expanded .frame{min-height:182px}\n.halo-card.signature.signature-photo.expanded .info{min-height:180px}\n@media(max-width:420px){\n .halo-card.signature.signature-photo{padding:13px;min-height:163px}\n .halo-card.signature.signature-photo .frame{margin-left:39%;min-height:132px}\n .halo-card.signature.signature-photo .info{min-height:132px}\n .halo-card.signature.signature-photo .power{width:43px;height:43px}\n .halo-card.signature.signature-photo .controls{gap:7px}\n .halo-card.signature.signature-photo .title{font-size:14px}\n}\n";
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
    const entities=Object.keys(this._hass?.states||{}).filter(key=>key.startsWith('light.')).sort();
    const options='<option value="">Licht auswählen…</option>'+entities.map(id=>'<option value="'+esc(id)+'" '+(id===c.entity?'selected':'')+'>'+esc(this._hass.states[id]?.attributes?.friendly_name||id)+' ('+esc(id)+')</option>').join('');
    let body='';
    if(this._step==='type')body='<div class="choices">'+choices+'</div><p class="note">Nur eine Halo-Cards-Karte in Home Assistant. Weitere Kartentypen folgen nach Halo Light.</p>';
    if(this._step==='entity')body='<div class="fields"><label class="field">Licht-Entität<select data-field="entity">'+options+'</select></label><label class="field">Anzeigename<input type="text" data-field="name" value="'+esc(c.name)+'" placeholder="Name der Entität übernehmen"></label></div>';
    if(this._step==='design')body='<div class="fields"><label>Halo Adaptive</label><div class="choices">'+styles+'</div><label>Kartengröße</label><div class="choices">'+sizes+'</div><label class="field">Akzentfarbe<input type="color" data-field="accent" value="'+c.accent+'"></label><label class="field">Glow-Intensität: '+c.glow_strength+' %<input type="range" min="0" max="100" data-field="glow_strength" value="'+c.glow_strength+'"></label></div>';
    if(this._step==='media')body='<div class="fields"><label class="field">Signature-Lichtstimmung<select data-field="scene"><option value="warm" '+(c.scene==='warm'?'selected':'')+'>Warm</option><option value="cool" '+(c.scene==='cool'?'selected':'')+'>Cool</option><option value="custom" '+(c.scene==='custom'?'selected':'')+'>Eigenes Bild</option></select></label><label class="field">Hintergrundbild-URL<input type="text" data-field="background" value="'+esc(c.background)+'" placeholder="/local/wohnzimmer.jpg"></label><p class="note">Hintergrundbild wird im Signature-Modus bei „Eigenes Bild“ verwendet. Unterstützt /local/ und HTTPS.</p></div>';
    if(this._step==='actions')body='<div class="fields"><label><input type="checkbox" data-field="show_brightness" '+(c.show_brightness?'checked':'')+'> Helligkeitsregler anzeigen</label><label><input type="checkbox" data-field="show_status" '+(c.show_status?'checked':'')+'> Status anzeigen</label><p class="note">Licht schalten über Power-Button, Dimmen beim Loslassen.</p></div>';
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
