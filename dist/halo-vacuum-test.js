// Halo Vacuum Signature — isolated beta card, no dependency on halo-cards.js.
// Uses existing background assets in /hacsfiles/halo-ui/.
// This file intentionally registers only "halo-vacuum-test".
(() => {
  const TAG="halo-vacuum-test";
  if(customElements.get(TAG))return;
  const safe=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const defaults={entity:"vacuum.z60_ultra_roller_complete",name:"Z60",navigation_path:"/dashboard-x/vacuum",image_base:"/hacsfiles/halo-ui"};
  const css=String.raw`
:host{display:block;container-type:inline-size;min-width:0}
ha-card{background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible}
.shell{position:relative;display:block;box-sizing:border-box;isolation:isolate;overflow:hidden;cursor:pointer;
 min-height:182px;width:100%;border-radius:22px;
 background-color:#131026;
 background-image:linear-gradient(90deg,rgba(7,8,25,.04),rgba(8,7,28,.04) 42%,rgba(9,7,25,.70) 100%),var(--scene);
 background-size:cover;background-position:center center;
 border:1px solid rgba(190,147,255,.78);
 box-shadow:0 13px 29px rgba(10,4,30,.34),0 0 22px rgba(142,82,240,.24),inset 0 0 1px rgba(255,255,255,.5);
 color:#fff;font-family:inherit;transition:box-shadow .2s,border-color .2s}
.shell:hover{border-color:#dfc0ff;box-shadow:0 13px 34px rgba(10,4,30,.40),0 0 27px rgba(164,104,253,.43)}
.shell:focus-visible{outline:3px solid #d8b8ff;outline-offset:3px}
.shell::before{content:"";position:absolute;inset:-16%;pointer-events:none;z-index:0;
 background:radial-gradient(ellipse at 27% 77%,rgba(156,92,255,.24),transparent 38%);opacity:.26}
.shell.cleaning::before{background:radial-gradient(ellipse at 27% 70%,rgba(60,158,255,.31),transparent 39%);animation:halo-vac-sweep 3s ease-in-out infinite alternate}
.shell.returning::before{animation:halo-vac-sweep 3.3s ease-in-out infinite alternate}
.shell.docked.charging::before{animation:halo-vac-pulse 3.5s ease-in-out infinite}
.shell.docked.drying::before{background:radial-gradient(ellipse at 25% 72%,rgba(241,130,212,.27),transparent 42%);animation:halo-vac-pulse 4s ease-in-out infinite}
.shell::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.05),transparent 28%,rgba(5,3,23,.1) 100%)}
.battery{position:absolute;right:13px;top:12px;z-index:2;padding:5px 10px;border:1px solid rgba(222,204,255,.25);border-radius:99px;
 background:rgba(14,11,30,.63);backdrop-filter:blur(8px);font-weight:700;font-size:11px;letter-spacing:.01em;display:flex;align-items:center;gap:6px}
.battery svg{height:13px;width:20px;overflow:visible}
.battery .fill{fill:#bd8dff}
.battery.charging .fill{fill:#bda2ff}
.details{position:absolute;right:15px;left:45%;bottom:28px;z-index:2;display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.title{font-weight:750;font-size:clamp(17px,2vw,22px);line-height:1.1;text-shadow:0 2px 9px rgba(0,0,0,.8)}
.state{display:flex;align-items:center;gap:7px;color:#f1eafb;font-size:12px;font-weight:530;text-shadow:0 2px 7px rgba(0,0,0,.9);white-space:nowrap}
.dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--dot);box-shadow:0 0 10px var(--dot)}
.cleaning .dot,.returning .dot,.docked.charging .dot{animation:halo-vac-dot 2s ease-in-out infinite}
.sub{display:block;max-width:100%;font-size:10px;color:#decfec;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 5px #090617}
.chevron{position:absolute;right:12px;bottom:9px;z-index:2;font-size:22px;color:#e7ccff;opacity:.8}
@keyframes halo-vac-sweep{0%{transform:translateX(-14px);opacity:.2}100%{transform:translateX(25px);opacity:1}}
@keyframes halo-vac-pulse{0%,100%{opacity:.12}50%{opacity:.85}}
@keyframes halo-vac-dot{0%,100%{box-shadow:0 0 4px var(--dot)}50%{box-shadow:0 0 15px var(--dot)}}
@container(max-width:270px){.shell{min-height:160px}.details{left:44%;bottom:20px;gap:5px}.title{font-size:16px}.state{font-size:11px}}
@media(prefers-reduced-motion:reduce){.shell::before,.dot{animation:none!important}}
`;
  class HaloVacuumTest extends HTMLElement{
    constructor(){super();this.attachShadow({mode:"open"});this._config={...defaults};this._hass=null;}
    static getStubConfig(){return {type:"custom:halo-vacuum-test",entity:defaults.entity,name:"Z60"};}
    getCardSize(){return 3;}
    getGridOptions(){return {columns:9,rows:4,min_columns:5,min_rows:3};}
    setConfig(config){
      if(!config||typeof config!=="object")throw Error("Halo Vacuum: Ungültige Konfiguration");
      this._config={...defaults,...config};
      if(!/^vacuum\.[a-z0-9_]+$/.test(this._config.entity))throw Error("Halo Vacuum benötigt eine vacuum.* Entität");
      const url=String(this._config.navigation_path);
      if(!/^\/[a-zA-Z0-9/_-]*$/.test(url))this._config.navigation_path=defaults.navigation_path;
      const base=String(this._config.image_base);
      if(!/^\/(hacsfiles|local)\/[a-zA-Z0-9/_-]+$/.test(base))this._config.image_base=defaults.image_base;
      this._render();
    }
    set hass(hass){this._hass=hass;this._render();}
    _render(){
      const cfg=this._config,states=this._hass?.states||{},vac=states[cfg.entity];
      const get=(id)=>states[id]?.state;
      const preview=get("input_boolean.z60_preview")==="on";
      let state=vac?.state||"unknown";
      const pstate=get("input_select.z60_preview_state");
      if(preview&&pstate&&pstate!=="real")state=pstate;
      let battery=Number(vac?.attributes?.battery_level);
      if(!Number.isFinite(battery))battery=Number(get("sensor.z60_ultra_roller_complete_battery_level"));
      const pbat=Number(get("input_number.z60_preview_battery"));
      if(preview&&Number.isFinite(pbat))battery=pbat;
      battery=Number.isFinite(battery)?Math.max(0,Math.min(100,Math.round(battery))):null;
      const chargingState=String(get("sensor.z60_ultra_roller_complete_charging_state")||"").toLowerCase();
      const chargingStatus=String(get("sensor.z60_ultra_roller_complete_charging_status")||"").toLowerCase();
      const baseStatus=String(get("sensor.z60_ultra_roller_complete_self_wash_base_status")||"").toLowerCase();
      const dryingProgress=String(get("sensor.z60_ultra_roller_complete_drying_progress")||"").toLowerCase();
      let drying=/dry|trock/.test(baseStatus+" "+dryingProgress);
      let charging=/charg|lad/.test(chargingState)||(state==="docked"&&(battery===null||battery<99)&&!chargingStatus.includes("abgeschlossen"));
      const pdock=get("input_select.z60_preview_dockmode");
      if(preview&&pdock&&pdock!=="auto"){drying=pdock==="drying";charging=pdock==="charging";}
      const scene=state==="cleaning"?"cleaning":state==="returning"?"returning":state==="paused"?"paused":state==="docked"?"docked":"paused";
      const label=state==="cleaning"?"Reinigt":state==="returning"?"Kehrt zurück":state==="paused"?"Pausiert":state==="docked"?(drying?"Trocknet":charging?"Lädt":"Angedockt"):state==="unavailable"?"Nicht verfügbar":"Bereit";
      const colors={cleaning:"#66b7ff",returning:"#c58aff",paused:"#aba4be",docked:drying?"#f1a2df":charging?"#b58aff":"#88dcc7"};
      const color=colors[scene];
      const sceneUrl=cfg.image_base+"/halo-vacuum-"+scene+".webp";
      const pct=battery===null?"–":battery+" %";
      const displayName=safe(cfg.name||vac?.attributes?.friendly_name||"Z60");
      const sub=state==="cleaning"?String(get("sensor.z60_ultra_roller_complete_current_room")||""):"";
      const chargingClass=state==="docked"?(drying?" drying":charging?" charging":""):"";
      this.shadowRoot.innerHTML='<style>'+css+'</style><ha-card><div class="shell '+scene+chargingClass+'" tabindex="0" role="link" style="--scene:url(&quot;'+safe(sceneUrl)+'&quot;);--dot:'+color+'" aria-label="'+displayName+', '+safe(label)+', '+safe(pct)+'. Dashboard öffnen">'+
        '<div class="battery '+(charging?"charging":"")+'"><svg viewBox="0 0 24 16" aria-hidden="true"><rect x="1" y="2" width="19" height="12" rx="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="21" y="6" width="2" height="4" rx="1" fill="currentColor"/><rect class="fill" x="3.2" y="4.2" width="'+(battery===null?0:14.5*battery/100)+'" height="7.6" rx="1"/></svg>'+safe(pct)+'</div>'+
        '<div class="details"><div class="title">'+displayName+'</div><div class="state"><span class="dot"></span>'+safe(label)+'</div>'+(sub?'<div class="sub">'+safe(sub)+'</div>':'')+'</div><span class="chevron" aria-hidden="true">›</span></div></ha-card>';
      const surface=this.shadowRoot.querySelector(".shell");
      if(!surface)return;
      const navigate=()=>{
        const path=cfg.navigation_path;
        history.pushState(null,"",path);
        window.dispatchEvent(new Event("location-changed"));
      };
      surface.addEventListener("click",navigate);
      surface.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();navigate();}});
      let holdTimer,held=false;
      const moreInfo=()=>{held=true;surface.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:true,composed:true,detail:{entityId:cfg.entity}}));};
      surface.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse"){held=false;holdTimer=setTimeout(moreInfo,550);}});
      for(const ev of ["pointerup","pointerleave","pointercancel"])surface.addEventListener(ev,()=>clearTimeout(holdTimer));
      surface.addEventListener("contextmenu",e=>{e.preventDefault();moreInfo();});
    }
  }
  customElements.define(TAG,HaloVacuumTest);
  window.customCards=window.customCards||[];
  if(!window.customCards.some(x=>x.type===TAG))window.customCards.push({type:TAG,name:"Halo Vacuum (Test)",description:"Eigenständige bildbasierte MOVA-Statuskarte; berührt Halo Cards nicht.",preview:true});
})();
