// Halo Vacuum Signature — isolated beta card, no dependency on halo-cards.js.
// Uses existing background assets in /hacsfiles/halo-ui/.
// This file intentionally registers only "halo-vacuum-test".
(() => {
  const TAG="halo-vacuum-test";
  if(customElements.get(TAG))return;
  const safe=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const defaults={entity:"vacuum.z60_ultra_roller_complete",name:"Z60",navigation_path:"/dashboard-x/vacuum",image_base:"/hacsfiles/halo-ui",demo_controls:true};
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


/* Distinct visible status animations; overlays never block dashboard navigation. */
.fx{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}
.fx>span{position:absolute;display:block;pointer-events:none}
.fx-orbit{left:12%;top:27%;width:42%;aspect-ratio:1;border-radius:50%;border:2px solid transparent;opacity:0}
.docked.charging .fx-orbit{border-color:rgba(204,128,255,.76);box-shadow:0 0 18px rgba(187,93,255,.5),inset 0 0 15px rgba(187,93,255,.28);animation:hv-charge 2.5s ease-out infinite}
.docked.drying .fx-orbit{border-color:rgba(255,155,204,.7);animation:hv-charge 3.2s ease-out infinite}
.fx-spark{left:31%;bottom:19%;width:4px;height:4px;border-radius:50%;opacity:0}
.docked.charging .fx-spark{background:#f7d4ff;box-shadow:0 0 10px 5px rgba(177,85,250,.85);animation:hv-spark 1.2s ease-in-out infinite alternate}
.fx-scan{left:-28%;bottom:15%;width:75%;height:32%;opacity:0;transform:skewX(-25deg);background:linear-gradient(90deg,transparent,rgba(85,172,255,.0) 25%,rgba(94,171,255,.25) 58%,rgba(157,219,255,.51) 64%,transparent 72%);filter:blur(3px)}
.cleaning .fx-scan{animation:hv-scan 3s linear infinite}
.fx-path{left:4%;right:48%;bottom:10%;height:4px;transform:rotate(-15deg);opacity:0;border-radius:15px;background:repeating-linear-gradient(90deg,transparent 0 12px,#cd8dff 12px 24px,transparent 24px 36px);filter:drop-shadow(0 0 6px #b75aff)}
.returning .fx-path{animation:hv-route 1.6s linear infinite}
.returning .fx-orbit{border:2px dashed rgba(185,122,255,.6);animation:hv-charge 3s ease-out infinite}
.demo-toolbar{position:absolute;z-index:5;left:9px;top:9px;display:flex;gap:5px;align-items:center}
.demo-toolbar button{appearance:none;cursor:pointer;border:1px solid rgba(202,174,255,.62);color:#fff;background:rgba(21,15,44,.82);backdrop-filter:blur(8px);border-radius:20px;padding:5px 9px;font:600 10px/1.3 inherit;box-shadow:0 0 10px rgba(114,53,218,.22)}
.demo-toolbar button:hover{background:rgba(94,52,163,.95);border-color:#d9baff}
@keyframes hv-charge{0%{transform:scale(.55);opacity:0}35%{opacity:.75}100%{transform:scale(1.38);opacity:0}}
@keyframes hv-spark{from{opacity:.2;transform:scale(.8)}to{opacity:1;transform:scale(2)}}
@keyframes hv-scan{0%{transform:translateX(-50%) skewX(-25deg);opacity:0}18%{opacity:.8}80%{opacity:.8}100%{transform:translateX(195%) skewX(-25deg);opacity:0}}
@keyframes hv-route{from{background-position:0 0;opacity:.25}50%{opacity:.95}to{background-position:108px 0;opacity:.35}}
@media(prefers-reduced-motion:reduce){.fx>span{animation:none!important;opacity:.18!important}}
`;
  // Photo-specific animation overrides
  const photoEffects=String.raw`
/* v3: effects anchored to the actual four scene compositions, rather than a generic card overlay. */
.shell{--motion-color:#a970ff}
.fx{inset:0;z-index:1;isolation:isolate}
.fx-beam{position:absolute;pointer-events:none;opacity:0}
.fx-halo{position:absolute;pointer-events:none;opacity:0}
.fx-dock-light{position:absolute;pointer-events:none;opacity:0}
.fx-floor{position:absolute;pointer-events:none;opacity:0}
.docked .fx-dock-light{display:block;left:14%;top:52%;width:26%;height:32%;
 background:radial-gradient(ellipse at 50% 65%,rgba(193,89,255,.55),rgba(129,40,255,.25) 32%,transparent 72%);
 filter:blur(9px);mix-blend-mode:screen;animation:hv3-dockglow 2.6s ease-in-out infinite}
.docked .fx-halo{display:block;left:18%;top:49%;width:22%;height:23%;border-radius:50%;
 border:1.5px solid rgba(210,119,255,.70);box-shadow:0 0 13px rgba(161,58,255,.5),inset 0 0 13px rgba(161,58,255,.3);
 animation:hv3-dockring 2.6s ease-out infinite}
.cleaning .fx-beam{display:block;left:-18%;top:29%;width:72%;height:57%;
 transform:skewX(-20deg);
 background:linear-gradient(90deg,transparent 22%,rgba(42,138,255,.03) 40%,rgba(115,190,255,.38) 48%,rgba(195,236,255,.68) 51%,rgba(42,138,255,.11) 59%,transparent 72%);
 filter:blur(2px);mix-blend-mode:screen;animation:hv3-scan 3.1s linear infinite}
.cleaning .fx-floor{display:block;left:8%;bottom:5%;width:48%;height:15%;
 background:radial-gradient(ellipse at 50% 50%,rgba(36,135,255,.53),transparent 69%);
 filter:blur(9px);animation:hv3-floor 1.8s ease-in-out infinite}
.returning .fx-floor{display:block;left:12%;bottom:13%;width:58%;height:8px;transform:rotate(-16deg);transform-origin:left center;
 background:repeating-linear-gradient(90deg,transparent 0 11px,rgba(233,154,255,.98) 11px 23px,transparent 23px 34px);
 filter:drop-shadow(0 0 5px rgba(217,82,255,.96));animation:hv3-route 1.3s linear infinite}
.returning .fx-beam{display:block;left:24%;bottom:12%;height:24%;width:47%;
 background:radial-gradient(ellipse at 50% 100%,rgba(207,89,255,.24),transparent 70%);
 filter:blur(7px);animation:hv3-floor 2s ease-in-out infinite}
.paused .fx-halo{display:block;left:23%;bottom:14%;width:35%;height:18%;
 background:radial-gradient(ellipse at center,rgba(139,80,228,.13),transparent 75%);opacity:.36}
.docked .fx-spark,.docked .fx-orbit,.cleaning .fx-scan,.returning .fx-path,.returning .fx-orbit{display:none}
@keyframes hv3-dockglow{0%,100%{opacity:.3;transform:scale(.92)}50%{opacity:.95;transform:scale(1.1)}}
@keyframes hv3-dockring{0%{opacity:0;transform:scale(.64)}30%{opacity:.85}100%{opacity:0;transform:scale(1.42)}}
@keyframes hv3-scan{0%{transform:translateX(-42%) skewX(-20deg);opacity:0}15%,80%{opacity:.96}100%{transform:translateX(150%) skewX(-20deg);opacity:0}}
@keyframes hv3-floor{0%,100%{opacity:.2}50%{opacity:.85}}
@keyframes hv3-route{0%{background-position:0 0;opacity:.28}50%{opacity:.95}100%{background-position:-136px 0;opacity:.35}}
@media(prefers-reduced-motion:reduce){.fx-beam,.fx-halo,.fx-dock-light,.fx-floor{animation:none!important;opacity:.3!important}}
`;
  class HaloVacuumTest extends HTMLElement{
    constructor(){super();this.attachShadow({mode:"open"});this._config={...defaults};this._hass=null;this._demoState=null;}
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
      if(this._demoState)state=this._demoState;
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
      if(this._demoState){drying=false;charging=this._demoState==="docked";}
      const scene=state==="cleaning"?"cleaning":state==="returning"?"returning":state==="paused"?"paused":state==="docked"?"docked":"paused";
      const label=state==="cleaning"?"Reinigt":state==="returning"?"Kehrt zurück":state==="paused"?"Pausiert":state==="docked"?(drying?"Trocknet":charging?"Lädt":"Angedockt"):state==="unavailable"?"Nicht verfügbar":"Bereit";
      const colors={cleaning:"#66b7ff",returning:"#c58aff",paused:"#aba4be",docked:drying?"#f1a2df":charging?"#b58aff":"#88dcc7"};
      const color=colors[scene];
      const sceneUrl=cfg.image_base+"/halo-vacuum-"+scene+".webp";
      const demo=Boolean(cfg.demo_controls);
      const statesCycle=["docked","cleaning","returning","paused"];
      const demoNames={docked:"Lädt",cleaning:"Reinigt",returning:"Kehrt zurück",paused:"Pausiert"};
      const pct=battery===null?"–":battery+" %";
      const displayName=safe(cfg.name||vac?.attributes?.friendly_name||"Z60");
      const sub=state==="cleaning"?String(get("sensor.z60_ultra_roller_complete_current_room")||""):"";
      const chargingClass=state==="docked"?(drying?" drying":charging?" charging":""):"";
      this.shadowRoot.innerHTML='<style>'+css+photoEffects+'</style><ha-card><div class="shell '+scene+chargingClass+'" tabindex="0" role="link" style="--scene:url(&quot;'+safe(sceneUrl)+'&quot;);--dot:'+color+'" aria-label="'+displayName+', '+safe(label)+', '+safe(pct)+'. Dashboard öffnen">'+
        '<div class="fx fx-'+scene+'"><span class="fx-orbit"></span><span class="fx-scan"></span><span class="fx-path"></span><span class="fx-spark"></span><span class="fx-beam"></span><span class="fx-halo"></span><span class="fx-dock-light"></span><span class="fx-floor"></span></div>'+
        (demo?'<div class="demo-toolbar"><button class="demo-next" type="button" title="Nächsten Status anzeigen">◀  '+safe(this._demoState?demoNames[this._demoState]:'LIVE')+'  ▶</button>'+(this._demoState?'<button class="demo-real" type="button" title="Echtzustand anzeigen">Live</button>':'')+'</div>':'')+
        '<div class="battery '+(charging?"charging":"")+'"><svg viewBox="0 0 24 16" aria-hidden="true"><rect x="1" y="2" width="19" height="12" rx="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="21" y="6" width="2" height="4" rx="1" fill="currentColor"/><rect class="fill" x="3.2" y="4.2" width="'+(battery===null?0:14.5*battery/100)+'" height="7.6" rx="1"/></svg>'+safe(pct)+'</div>'+
        '<div class="details"><div class="title">'+displayName+'</div><div class="state"><span class="dot"></span>'+safe(label)+'</div>'+(sub?'<div class="sub">'+safe(sub)+'</div>':'')+'</div><span class="chevron" aria-hidden="true">›</span></div></ha-card>';
      const surface=this.shadowRoot.querySelector(".shell");
      if(!surface)return;
      if(demo){
        surface.querySelector(".demo-next")?.addEventListener("click",e=>{e.stopPropagation();const i=statesCycle.indexOf(this._demoState);this._demoState=statesCycle[(i+1)%statesCycle.length];this._render();});
        surface.querySelector(".demo-real")?.addEventListener("click",e=>{e.stopPropagation();this._demoState=null;this._render();});
      }
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
