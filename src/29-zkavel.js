/* ---------- Kavel 10 (Vision 10): obliek luchtfoto's onder 45°, 2D en 3D, met meten ----------
   Werkt met de API-sleutel van Kavel 10 (Instellingen › Bedrijf). Zonder sleutel blijft alles zoals het was.
   De viewer is de PlexMap-viewer van Kavel 10 (dezelfde als in hun ArcGIS-widget): plexmap-api.js + PlexMap.Viewer.
   Metingen komen als GeoJSON in RD (EPSG:28992), dus lengtes en oppervlaktes rekenen we in meters uit. */
const KV_API="https://ndp.vision10.nl/static/api/plexmap-api.js",KV_VIEW="https://ndp.vision10.nl/viewer/view/NDP/";
const kavelKey=()=>{try{return String((S()||{}).kavel10Key||"").trim()}catch(e){return""}};
const kavelAan=()=>!!kavelKey();
let KV_LAADT=null;
function kavelLaad(){if(window.PlexMap)return Promise.resolve();if(!KV_LAADT)KV_LAADT=new Promise((ok,nee)=>{const s=document.createElement("script");s.src=KV_API;s.async=true;s.onload=()=>ok();s.onerror=()=>{KV_LAADT=null;nee(new Error("Kavel 10 laadt niet"))};document.head.appendChild(s)});return KV_LAADT}
/* RD (EPSG:28992) naar WGS84, benadering van Schreutelkamp & Strang van Hees (op ~1 m nauwkeurig) */
function rdNaarLL(x,y){const dX=(x-155000)*1e-5,dY=(y-463000)*1e-5;
  const K=[[0,1,3235.65389],[2,0,-32.58297],[0,2,-0.2475],[2,1,-0.84978],[0,3,-0.0655],[2,2,-0.01709],[1,0,-0.00738],[4,0,0.0053],[2,3,-0.00039],[4,1,0.00033],[1,1,-0.00012]];
  const L=[[1,0,5260.52916],[1,1,105.94684],[1,2,2.45656],[3,0,-0.81885],[1,3,0.05594],[3,1,-0.05607],[0,1,0.01199],[3,2,-0.00256],[1,4,0.00128],[0,2,0.00022],[2,0,-0.00022],[5,0,0.00026]];
  let la=0,lo=0;K.forEach(([p,q,k])=>la+=k*Math.pow(dX,p)*Math.pow(dY,q));L.forEach(([p,q,l])=>lo+=l*Math.pow(dX,p)*Math.pow(dY,q));
  return [Math.round((52.15517440+la/3600)*1e7)/1e7,Math.round((5.38720621+lo/3600)*1e7)/1e7]}
const kvD=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1],(b[2]!=null&&a[2]!=null)?b[2]-a[2]:0);
const kvLengte=c=>{let t=0;for(let i=1;i<c.length;i++)t+=kvD(c[i-1],c[i]);return t};
const kvOpp=r=>{let a=0;for(let i=0,j=r.length-1;i<r.length;j=i++)a+=(r[j][0]+r[i][0])*(r[j][1]-r[i][1]);return Math.abs(a/2)};
/* metingen van de viewer omzetten naar {soort:"m"|"m2", waarde, p:[[lat,lng],...]} */
function kavelMetingen(gj){const out=[];((gj&&gj.features)||[]).forEach((f,i)=>{const g=f&&f.geometry;if(!g||!g.coordinates)return;const pr=f.properties||{};
  const getal=k=>{const v=Number(pr[k]);return isFinite(v)&&v>0?v:null};
  if(g.type==="LineString"){const v=getal("length")||getal("lengte")||kvLengte(g.coordinates);if(v>0)out.push({i,soort:"m",waarde:Math.round(v*100)/100,p:g.coordinates.map(c=>rdNaarLL(c[0],c[1]))})}
  else if(g.type==="Polygon"&&g.coordinates[0]){const ring=g.coordinates[0],v=getal("area")||getal("oppervlakte")||kvOpp(ring);if(v>0)out.push({i,soort:"m2",waarde:Math.round(v*100)/100,omtrek:Math.round(kvLengte(ring)*100)/100,p:ring.map(c=>rdNaarLL(c[0],c[1]))})}});return out}
const KV_CSS=`dialog.kv{position:fixed!important;inset:0!important;width:auto;height:auto;max-width:none!important;max-height:none!important;margin:0!important;padding:0;border:0;border-radius:0!important;transform:none!important;animation:none!important;background:#0b0f12;color:#fff;display:flex;flex-direction:column;font-family:var(--f-ui,Inter,system-ui,sans-serif);z-index:1400}
dialog.kv::backdrop{background:#0b0f12}
.kv-top{display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px}
.kv-top div{flex:1;min-width:0}.kv-top b{display:block;font-size:15px}.kv-top span{font-size:12.5px;color:#aab2b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.kv-x{all:unset;width:40px;height:40px;border-radius:50%;background:rgb(255 255 255 / .1);display:grid;place-items:center;cursor:pointer}
.kv-main{flex:1;display:flex;min-height:0}
.kv-view{flex:1;position:relative;min-width:0;background:#15191d}
.kv-view>div:first-child{position:absolute;inset:0}
.kv-knop{position:absolute;z-index:5;display:flex;gap:6px}
.kv-knop button{all:unset;cursor:pointer;height:36px;min-width:36px;padding:0 12px;box-sizing:border-box;border-radius:999px;background:rgb(255 255 255 / .94);color:#0e1117;font:600 12px/36px system-ui,sans-serif;text-align:center;box-shadow:0 6px 18px -10px rgb(0 0 0 / .6)}
.kv-knop button[aria-pressed=true]{background:#0e1117;color:#fff}
.kv-st{top:12px;left:12px}.kv-rt{bottom:14px;left:12px}.kv-mt{top:12px;right:12px}
.kv-p{width:340px;flex:none;background:#fff;color:#0e1117;display:flex;flex-direction:column;min-height:0}
.kv-p h3{margin:0;padding:16px 18px 6px;font-size:13px;letter-spacing:.12em;text-transform:uppercase}
.kv-p p{margin:0;padding:0 18px 10px;font-size:13px;color:#5b6370;line-height:1.5}
.kv-l{flex:1;overflow:auto;padding:0 12px}
.kv-r{border:1px solid #e6e8eb;border-radius:12px;padding:10px 12px;margin:0 0 8px;display:grid;gap:8px}
.kv-r b{font-size:15px}.kv-r small{color:#5b6370}
.kv-r select{width:100%;height:38px;border:1px solid #d5d9de;border-radius:8px;padding:0 8px;font:inherit;background:#fff}
.kv-o{padding:12px 18px calc(12px + env(safe-area-inset-bottom));border-top:1px solid #eef0f2;display:flex;gap:8px}
.kv-o button{flex:1;height:44px;border-radius:10px;border:1px solid #d5d9de;background:#fff;font:600 13px system-ui,sans-serif;cursor:pointer}
.kv-o button.primary{background:#0e1117;color:#fff;border-color:#0e1117}
.kv-o button:disabled{opacity:.45;cursor:default}
.kv-fout{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;color:#cfd5da;font-size:14px;line-height:1.6}
@media (max-width:820px){.kv-main{flex-direction:column}.kv-p{width:auto;max-height:42vh}}`;
/* opent Kavel 10 op een adres of punt. soorten (optioneel): diensten waar gemeten maten in de prijs komen; onOvernemen(rijen) */
async function kavelOpen({adres="",ll=null,soorten=[],onOvernemen=null}={}){
  const key=kavelKey();if(!key){toast("Zet eerst je Kavel 10 API-sleutel bij Instellingen › Bedrijf");return}
  if(!document.getElementById("kv-css")){const s=document.createElement("style");s.id="kv-css";s.textContent=KV_CSS;document.head.appendChild(s)}
  const MS=(soorten||[]).filter(s=>s.eenheid==="m"||s.eenheid==="m2"),metPaneel=!!(onOvernemen&&MS.length);
  const ov=document.createElement("dialog");ov.className="kv";const vid="kvv"+Date.now();
  ov.innerHTML=`<div class="kv-top"><div><b>Kavel 10 · obliek luchtfoto</b><span id="kvAdr">${esc(adres||"Locatie opzoeken…")}</span></div><button type="button" class="kv-x" aria-label="Sluiten">${I.x}</button></div>
    <div class="kv-main"><div class="kv-view"><div id="${vid}"></div>
      <div class="kv-knop kv-st" role="group" aria-label="Weergave"><button type="button" data-st="oblique" aria-pressed="true">45°</button><button type="button" data-st="map" aria-pressed="false">2D</button><button type="button" data-st="cesium" aria-pressed="false">3D</button></div>
      <div class="kv-knop kv-rt"><button type="button" data-rot="-90" aria-label="Draai naar links">↺</button><button type="button" data-rot="90" aria-label="Draai naar rechts">↻</button></div>
      <div class="kv-knop kv-mt"><button type="button" data-meet="1">Meten</button></div></div>
    ${metPaneel?`<aside class="kv-p"><h3>Maten</h3><p>Klik op <b>Meten</b>, meet de goot, het zonnepaneelveld of de gevel en kies hieronder voor welke dienst de maat is.</p><div class="kv-l" id="kvL"><p>Nog niets gemeten.</p></div>
      <div class="kv-o"><button type="button" data-ver="1">Vernieuwen</button><button type="button" class="primary" data-neem="1" disabled>In de prijs</button></div></aside>`:""}</div>`;
  document.body.appendChild(ov);ov.showModal();let V=null,dicht=false,poll=null,rijen=[],keuze={};
  const sluit=()=>{dicht=true;clearTimeout(poll);try{V&&V.destroy&&V.destroy()}catch(e){}ov.close();ov.remove()};
  ov.querySelector(".kv-x").onclick=sluit;ov.addEventListener("cancel",e=>{e.preventDefault();sluit()});
  const fout=t=>{const el=ov.querySelector(".kv-view");el.insertAdjacentHTML("beforeend",`<div class="kv-fout">${t}</div>`)};
  if(!ll&&adres&&typeof luchtGeo==="function"){const r=await luchtGeo(adres);if(r){ll=r.ll;const a=ov.querySelector("#kvAdr");if(a&&r.naam)a.textContent=r.naam}}
  if(!ll){fout("Dit adres is niet gevonden. Controleer het adres van de klant.");return}
  try{await kavelLaad()}catch(e){fout("Kavel 10 is nu niet bereikbaar. Probeer het straks opnieuw.");return}
  if(dicht)return;
  try{V=new window.PlexMap.Viewer({viewSrc:KV_VIEW,targetElemId:vid,layout:"minimal",state:"oblique",apiKey:key});
    try{await V.setCoordinateSystem("EPSG:4326")}catch(e){}
    try{await V.jumpTo({lat:ll[0],lon:ll[1],elevation:100,yaw:0})}catch(e){}
    try{await V.setViewerState("oblique")}catch(e){}
  }catch(e){fout("Kavel 10 kon niet openen. Klopt de API-sleutel bij Instellingen › Bedrijf, en is je licentie actief?");return}
  ov.querySelectorAll("[data-st]").forEach(b=>b.onclick=async()=>{try{await V.setViewerState(b.dataset.st);ov.querySelectorAll("[data-st]").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"))}catch(e){toast("Deze weergave is hier niet beschikbaar")}});
  ov.querySelectorAll("[data-rot]").forEach(b=>b.onclick=async()=>{try{const h=Number(await V.getHeading())||0;await V.setHeading(((h+Number(b.dataset.rot))%360+360)%360)}catch(e){}});
  const naam=s=>s.kort||s.naam||s.id,eh=r=>r.soort==="m2"?"m²":"m",fm=v=>String(v).replace(".",",");
  const teken=()=>{const L=ov.querySelector("#kvL");if(!L)return;const neem=ov.querySelector("[data-neem]");
    if(!rijen.length){L.innerHTML="<p>Nog niets gemeten.</p>";neem.disabled=true;return}
    L.innerHTML=rijen.map((r,n)=>{const opt=MS.filter(s=>s.eenheid===r.soort);return `<div class="kv-r"><div><b>${fm(r.waarde)} ${eh(r)}</b> <small>${r.soort==="m2"?"oppervlakte"+(r.omtrek?" · omtrek "+fm(r.omtrek)+" m":""):"lengte"}</small></div>
      ${opt.length?`<select data-r="${n}" aria-label="Voor welke dienst"><option value="">Niet meenemen</option>${opt.map(s=>`<option value="${esc(s.id)}"${keuze[n]===s.id?" selected":""}>${esc(naam(s))}</option>`).join("")}</select>`:`<small>Geen dienst per ${eh(r)} in Uitvoering › Diensten</small>`}</div>`}).join("");
    L.querySelectorAll("select").forEach(s=>s.onchange=()=>{keuze[s.dataset.r]=s.value;neem.disabled=!Object.values(keuze).some(Boolean)});neem.disabled=!Object.values(keuze).some(Boolean)};
  const lees=async()=>{if(!V||!V.getMeasurements)return;try{try{await V.setCoordinateSystem("EPSG:28992")}catch(e){}const gj=await V.getMeasurements();const nw=kavelMetingen(gj);
      if(JSON.stringify(nw.map(r=>[r.soort,r.waarde]))!==JSON.stringify(rijen.map(r=>[r.soort,r.waarde]))){rijen=nw;keuze={};rijen.forEach((r,n)=>{const opt=MS.filter(s=>s.eenheid===r.soort);if(opt.length===1)keuze[n]=opt[0].id});teken()}}catch(e){}};
  const meet=ov.querySelector("[data-meet]");meet.onclick=async()=>{try{if(V.toolbox&&V.toolbox.openTool)await V.toolbox.openTool("measure");else if(V.openTool)await V.openTool("measure");else{toast("Meten is in deze viewer niet beschikbaar");return}
      meet.setAttribute("aria-pressed","true");if(metPaneel){const loop=async()=>{if(dicht)return;await lees();poll=setTimeout(loop,1000)};clearTimeout(poll);loop()}}catch(e){toast("Meten starten lukte niet")}};
  if(metPaneel){ov.querySelector("[data-ver]").onclick=lees;
    ov.querySelector("[data-neem]").onclick=()=>{const uit=rijen.map((r,n)=>keuze[n]?{s:keuze[n],soort:r.soort,v:r.waarde,p:r.p}:null).filter(Boolean);if(!uit.length)return;try{onOvernemen(uit)}catch(e){}toast("Maten van Kavel 10 staan in de prijs");sluit()}}}
