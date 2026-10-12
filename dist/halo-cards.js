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
  accent: "#a178ff", background: "", show_brightness: true
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
  return c;
};
const cardCss = String.raw`
  :host { display:block; min-width:0; }
  ha-card { background:transparent !important; border:0 !important; box-shadow:none !important; overflow:visible; }
  .halo-card { --halo-accent:#a178ff; color:var(--primary-text-color,#fff); min-height:145px; padding:19px;
    position:relative; overflow:hidden; border-radius:23px; box-sizing:border-box;
    background:linear-gradient(140deg,rgba(43,43,63,.9),rgba(17,24,41,.94));
    border:1px solid rgba(255,255,255,.13); box-shadow:0 16px 36px rgba(0,0,0,.24);
    font-family:inherit; isolation:isolate; }
  .halo-card:before { content:""; pointer-events:none; position:absolute; inset:0; border-radius:inherit;
    background:radial-gradient(circle at 8% 5%,color-mix(in srgb,var(--halo-accent) 19%,transparent),transparent 60%);
    opacity:.62; z-index:-1; }
  .halo-card.minimal { background:var(--ha-card-background,var(--card-background-color,#222630));
    border-color:var(--divider-color,rgba(255,255,255,.13)); box-shadow:none; }
  .halo-card.minimal:before { opacity:0; }
  .halo-card.signature { background:linear-gradient(125deg,rgba(27,22,47,.92),rgba(11,29,48,.93));
    border-color:color-mix(in srgb,var(--halo-accent) 46%,transparent);
    box-shadow:0 18px 48px rgba(0,0,0,.35),0 0 23px color-mix(in srgb,var(--halo-accent) 14%,transparent); }
  .halo-card.signature:before { opacity:1; }
  .halo-card.is-off:before { opacity:.07; }
  .halo-card.compact { min-height:112px; padding:14px; border-radius:18px; }
  .halo-card.expanded { min-height:193px; padding:24px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
  .identity { display:flex; align-items:center; min-width:0; gap:14px; }
  .lamp { flex:none; display:grid; place-items:center; width:54px; height:54px; border-radius:17px;
    background:color-mix(in srgb,var(--halo-accent) 16%,transparent); color:var(--halo-accent); }
  .lamp ha-icon { --mdc-icon-size:30px; }
  .is-on .lamp { filter:drop-shadow(0 0 9px color-mix(in srgb,var(--halo-accent) 60%,transparent)); }
  .name { font-weight:650; font-size:16px; line-height:1.4; overflow-wrap:anywhere; }
  .status { margin-top:4px; opacity:.75; font-size:12px; }
  .right { display:flex; align-items:center; gap:12px; }
  .value { font-size:14px; font-weight:650; white-space:nowrap; }
  .power { width:44px; height:44px; flex:none; border-radius:50%; border:1px solid rgba(255,255,255,.2);
    background:rgba(255,255,255,.07); color:inherit; cursor:pointer; display:grid; place-items:center; }
  .is-on .power { background:color-mix(in srgb,var(--halo-accent) 26%,#202036);
    box-shadow:0 0 17px color-mix(in srgb,var(--halo-accent) 38%,transparent); }
  .power:focus-visible, input:focus-visible { outline:2px solid var(--halo-accent); outline-offset:3px; }
  .power:disabled, input:disabled { opacity:.45; cursor:not-allowed; }
  .brightness { display:block; margin-top:20px; }
  input[type=range] { accent-color:var(--halo-accent); width:100%; margin:0; height:24px; cursor:pointer; }
  .compact .lamp { width:42px; height:42px; border-radius:12px; }
  .compact .lamp ha-icon { --mdc-icon-size:24px; }
  .compact .brightness { margin-top:9px; }
  .expanded .lamp { width:70px; height:70px; }
  .expanded .brightness { margin-top:34px; }
  .empty { font-size:13px; opacity:.75; line-height:1.6; }
  @media (prefers-reduced-motion:no-preference) { .halo-card, .power, .lamp { transition:background .2s,box-shadow .2s,filter .2s; } }
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
    const c=this._config, state=this._state(), valid=state && c.entity.startsWith("light.");
    const available=valid && !["unavailable","unknown"].includes(state.state);
    const on=available && state.state==="on";
    const level=on ? Math.round((Number(state.attributes?.brightness)||0)/255*100) : 0;
    const title=c.name || state?.attributes?.friendly_name || "Halo Light";
    const unsupported=c.card_type!=="light";
    this.shadowRoot.innerHTML='<style>'+cardCss+'</style><ha-card><div class="halo-card '+esc(c.style)+' '+esc(c.size)+(on?' is-on':' is-off')+'" style="--halo-accent:'+c.accent+'">'+
      '<div class="head"><div class="identity"><div class="lamp"><ha-icon icon="'+(unsupported?'mdi:layers-outline':'mdi:lamp')+'"></ha-icon></div>'+
      '<div><div class="name">'+esc(title)+'</div><div class="status">'+esc(unsupported?'Dieser Kartentyp ist in Vorbereitung':!c.entity?'Bitte eine Licht-Entität wählen':!valid?'Entität nicht gefunden':!available?'Nicht verfügbar':on?'Eingeschaltet':'Ausgeschaltet')+'</div></div></div>'+
      (unsupported?'':'<div class="right"><span class="value">'+(available?level+' %':'–')+'</span><button class="power" type="button" title="Licht schalten" aria-label="Licht schalten" '+(!available?'disabled':'')+'><ha-icon icon="mdi:power"></ha-icon></button></div>')+
      '</div>'+(!unsupported && c.show_brightness?'<label class="brightness"><input type="range" min="1" max="100" value="'+(level||1)+'" aria-label="Helligkeit" '+(!available?'disabled':'')+'></label>':'')+
      (unsupported?'<p class="empty">Du kannst das Design bereits auswählen. Die Funktion folgt in einer späteren Entwicklungsstufe.</p>':'')+
      '</div></ha-card>';
    const button=this.shadowRoot.querySelector('.power');
    button?.addEventListener('click',()=>this._call(on?'turn_off':'turn_on',{}));
    const slider=this.shadowRoot.querySelector('input[type=range]');
    slider?.addEventListener('change',event=>this._call('turn_on',{brightness_pct:Number(event.target.value)}));
  }
}
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
    const c=this._config,steps=[["type","Kartentyp"],["entity","Entität"],["design","Design"],["actions","Aktionen"]];
    const buttons=steps.map(([id,label])=>'<button type="button" data-step="'+id+'" class="'+(this._step===id?'selected':'')+'">'+label+'</button>').join('');
    const choices=CARD_TYPES.map(t=>'<button type="button" class="choice '+(t.id===c.card_type?'selected':'')+'" data-type="'+t.id+'" '+(t.soon?'disabled':'')+'><ha-icon icon="'+t.icon+'"></ha-icon>'+t.label+(t.soon?'<small>Demnächst</small>':'<small>Jetzt verfügbar</small>')+'</button>').join('');
    const styles=STYLES.map(s=>'<button type="button" class="choice '+(s===c.style?'selected':'')+'" data-style="'+s+'"><ha-icon icon="mdi:palette-outline"></ha-icon>'+s[0].toUpperCase()+s.slice(1)+'</button>').join('');
    const sizes=SIZES.map(s=>'<button type="button" class="choice '+(s===c.size?'selected':'')+'" data-size="'+s+'">'+({compact:"Kompakt",standard:"Standard",expanded:"Erweitert"}[s])+'</button>').join('');
    const entities=Object.keys(this._hass?.states||{}).filter(key=>key.startsWith('light.')).sort();
    const options='<option value="">Licht auswählen…</option>'+entities.map(id=>'<option value="'+esc(id)+'" '+(id===c.entity?'selected':'')+'>'+esc(this._hass.states[id]?.attributes?.friendly_name||id)+' ('+esc(id)+')</option>').join('');
    let body='';
    if(this._step==='type')body='<div class="choices">'+choices+'</div><p class="note">Nur eine Halo-Cards-Karte in Home Assistant. Weitere Kartentypen folgen nach Halo Light.</p>';
    if(this._step==='entity')body='<div class="fields"><label class="field">Licht-Entität<select data-field="entity">'+options+'</select></label><label class="field">Anzeigename<input type="text" data-field="name" value="'+esc(c.name)+'" placeholder="Name der Entität übernehmen"></label></div>';
    if(this._step==='design')body='<div class="fields"><label>Halo Adaptive</label><div class="choices">'+styles+'</div><label>Kartengröße</label><div class="choices">'+sizes+'</div><label class="field">Akzentfarbe<input type="color" data-field="accent" value="'+c.accent+'"></label></div>';
    if(this._step==='actions')body='<label><input type="checkbox" data-field="show_brightness" '+(c.show_brightness?'checked':'')+'> Helligkeitsregler anzeigen</label><p class="note">Ein-/Ausschalten per Power-Button; Helligkeit beim Loslassen des Reglers senden.</p>';
    this.shadowRoot.innerHTML='<style>'+editorCss+'</style><section class="editor"><h3>Halo Cards</h3><p class="subtitle">Eine Karte. Viele Möglichkeiten. · Entwicklungs-Vorschau</p><nav class="tabs">'+buttons+'</nav>'+body+'<div class="preview"><h4>Live-Vorschau</h4><halo-cards></halo-cards><p class="note">Bei echter Verwendung wird die Vorschau mit deinen Home-Assistant-Daten aktualisiert.</p></div></section>';
    this.shadowRoot.querySelectorAll('[data-step]').forEach(el=>el.addEventListener('click',()=>{this._step=el.dataset.step;this._render();}));
    for(const key of ['type','style','size'])this.shadowRoot.querySelectorAll('[data-'+key+']').forEach(el=>
      el.addEventListener('click',()=>this._change(key==='type'?'card_type':key,el.dataset[key])));
    this.shadowRoot.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('change',()=>{
      this._change(el.dataset.field,el.type==='checkbox'?el.checked:el.value);
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
