/* ---------- Meten op de luchtfoto (zoals Perceelloep) ----------
   PDOK-luchtfoto (recht van boven, vaste schaal). Elk aangeklikt punt heeft echte coördinaten; de lengte is de afstand
   tussen die punten. Voor goten en daklijsten die je van boven ziet. Lijnen met meerdere punten (om hoeken heen).
   maten: [{s:soortId, p:[[lat,lng],...]}] */
const LUCHT_CSS=`.lm{position:fixed;inset:0;z-index:1400;background:#0b0f12;color:#fff;display:flex;flex-direction:column;font-family:var(--f-ui,Inter,system-ui,sans-serif)}
dialog.lm{width:auto;height:auto;max-width:none!important;max-height:none!important;margin:0!important;padding:0;border:0;border-radius:0!important;clip-path:none!important;inset:0!important;position:fixed!important;transform:none!important;animation:none!important}
dialog.lm::backdrop{background:#0b0f12}
.lm-top{display:flex;align-items:center;gap:12px;padding:calc(12px + env(safe-area-inset-top)) 16px 12px}
.lm-top div{flex:1;min-width:0}.lm-top b{display:block;font-size:15px}.lm-top span{font-size:12.5px;color:#aab2b8}
.lm-x{width:40px;height:40px;border-radius:50%;border:0;background:rgb(255 255 255 / .1);color:#fff;display:grid;place-items:center;cursor:pointer}.lm-x svg{width:18px;height:18px}
.lm-map{flex:1;min-height:0;position:relative;background:#1a2026}
.lm-map .leaflet-container{background:#1a2026;cursor:crosshair}
.lm-tip{position:absolute;z-index:500;left:50%;top:12px;transform:translateX(-50%);background:rgb(11 15 18 / .82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgb(255 255 255 / .16);padding:8px 14px;border-radius:99px;font-size:12.5px;font-weight:600;white-space:nowrap;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.lm-live{background:#fff;color:#14181f;border-radius:10px;padding:6px 10px;font:700 13px/1.25 var(--f-ui,Inter,system-ui,sans-serif);box-shadow:0 8px 22px rgb(0 0 0 / .35);white-space:nowrap;font-variant-numeric:tabular-nums;border:0}
.lm-live small{display:block;font-weight:700;font-size:12px;color:#2f9e63}
.leaflet-tooltip.lm-live:before{display:none}
.lm-lab{background:rgb(11 15 18 / .86);color:#fff;border:1px solid rgb(255 255 255 / .25);border-radius:99px;padding:4px 10px 4px 7px;font:700 12px/1 var(--f-ui,Inter,system-ui,sans-serif);box-shadow:0 4px 14px rgb(0 0 0 / .35);white-space:nowrap;font-variant-numeric:tabular-nums;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.lm-lab i{width:9px;height:9px;border-radius:50%;background:var(--c);box-shadow:0 0 0 2px #fff}
.leaflet-tooltip.lm-lab:before{display:none}
.lm-pt{width:14px!important;height:14px!important;margin:-7px 0 0 -7px!important;border-radius:50%;background:var(--c);border:2.5px solid #fff;box-shadow:0 1px 4px rgb(0 0 0 / .5)}
.lm-pt.eerste{width:16px!important;height:16px!important;margin:-8px 0 0 -8px!important}
.lm-onder{padding:12px 16px calc(14px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;align-items:center}
.lm-bar{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:900px}
.lm-bar button{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 12px 0 6px;border-radius:99px;border:1px solid rgb(255 255 255 / .16);background:rgb(255 255 255 / .06);color:#dfe4e8;font:700 12.5px/1 var(--f-ui,Inter,system-ui,sans-serif);cursor:pointer}
.lm-bar button i{width:22px;height:22px;border-radius:50%;background:var(--c);border:2px solid #fff}
.lm-bar button b{padding:0 7px;height:20px;border-radius:99px;display:inline-grid;place-items:center;background:color-mix(in srgb,var(--c) 32%,transparent);color:#fff;font-size:11px;font-variant-numeric:tabular-nums}
.lm-bar button[aria-checked="true"]{background:#fff;color:#0b0f12;border-color:#fff;box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 45%,transparent)}
.lm-bar button[aria-checked="true"] b{background:var(--c)}
.lm-knop{display:flex;gap:8px;width:100%}.lm-knop button{flex:1;height:46px;border-radius:12px;border:1px solid rgb(255 255 255 / .15);background:rgb(255 255 255 / .1);color:#fff;font:700 14px var(--f-ui,Inter,system-ui,sans-serif);cursor:pointer}
.lm-knop button:disabled{opacity:.4;cursor:default}.lm-knop .ok{background:#fff;color:#0b0f12;border-color:#fff}
.lm-ondergrond{position:absolute;z-index:500;right:12px;bottom:12px;display:flex;flex-direction:column;gap:6px}
.lm-ondergrond button{height:34px;padding:0 12px;border-radius:10px;border:1px solid rgb(255 255 255 / .2);background:rgb(11 15 18 / .82);color:#fff;font:700 12px var(--f-ui,Inter,system-ui,sans-serif);cursor:pointer}
.lm-ondergrond button[aria-pressed="true"]{background:#fff;color:#0b0f12}`;
const lmFmt=v=>(Math.round(v*100)/100).toFixed(2).replace(".",",");
function luchtLengte(p){const L=window.L;let t=0;for(let i=1;i<(p||[]).length;i++)t+=L.latLng(p[i-1]).distanceTo(L.latLng(p[i]));return t}
function luchtTotalen(maten){const t={};if(!window.L)return t;(maten||[]).forEach(x=>{if(x&&x.p&&x.p.length>1)t[x.s]=(t[x.s]||0)+luchtLengte(x.p)});Object.keys(t).forEach(k=>t[k]=Math.round(t[k]*100)/100);return t}
async function luchtGeo(q){try{const r=await fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&fl=centroide_ll,weergavenaam&q="+encodeURIComponent(q));const j=await r.json(),d=((j.response||{}).docs||[])[0],m=d&&/POINT\(([-\d.]+) ([-\d.]+)\)/.exec(d.centroide_ll||"");return m?{ll:[+m[2],+m[1]],naam:d.weergavenaam}:null}catch(e){return null}}
async function openLuchtMeten({adres,soorten,maten,onKlaar}){
  soorten=(soorten||[]).filter(s=>s.eenheid==="m");if(!soorten.length){toast("Geen diensten per strekkende meter in Uitvoering › Diensten");return}
  if(!document.getElementById("lm-css")){const st=document.createElement("style");st.id="lm-css";st.textContent=LUCHT_CSS;document.head.appendChild(st)}
  try{await pkLaadLeaflet()}catch(e){toast("De kaart kon niet laden. Controleer je internet.");return}
  const L=window.L,lijst=(maten||[]).map(x=>({s:x.s,p:(x.p||[]).map(q=>[q[0],q[1]])}));let cur=soorten[0].id,actief=null,sat=true;
  const ov=document.createElement("dialog");ov.className="lm";document.body.appendChild(ov);
  ov.innerHTML=`<div class="lm-top"><div><b>Meten op de luchtfoto</b><span id="lmAdr">${esc(adres||"Adres zoeken…")}</span></div><button type="button" class="lm-x" aria-label="Sluiten">${I.x}</button></div>
    <div class="lm-map"><div id="lmMap" style="position:absolute;inset:0"></div><div class="lm-tip" id="lmTip"></div>
      <div class="lm-ondergrond"><button type="button" data-og="kad" aria-pressed="false">Kadastergrenzen</button></div></div>
    <div class="lm-onder"><div class="lm-bar" id="lmBar" role="radiogroup" aria-label="Wat meet u"></div>
      <div class="lm-knop"><button type="button" id="lmUndo">Punt terug</button><button type="button" id="lmEind">Lijn klaar</button><button type="button" id="lmWis">Alles wissen</button><button type="button" class="ok" id="lmOk">Klaar</button></div></div>`;
  try{ov.showModal()}catch(e){ov.setAttribute("open","")}ov.addEventListener("cancel",e=>{e.preventDefault();if(actief)eind();else sluit(false)});
  const map=L.map(ov.querySelector("#lmMap"),{zoomControl:true,attributionControl:true,zoomSnap:.25,maxZoom:22,doubleClickZoom:false,center:[52.2,5.3],zoom:8});
  const pd="https://service.pdok.nl/",tl=L.tileLayer(pd+"hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg",{maxZoom:22,maxNativeZoom:19,attribution:"Luchtfoto PDOK"}).addTo(map);
  let kad=null;const kadLaag=()=>kad||(kad=L.tileLayer.wms(pd+"kadaster/kadastralekaart/wms/v5_0",{layers:"Perceel",format:"image/png",transparent:true,maxZoom:22,attribution:"Kadaster"}));
  const kl=s=>(soorten.find(x=>x.id===s)||{}).kleur||"#ffc53d",nm=s=>(soorten.find(x=>x.id===s)||{}).kort||"Meting";
  const laag=L.layerGroup().addTo(map);let live=null,liveTip=null;
  function tip(){const t=ov.querySelector("#lmTip");t.textContent=actief?(actief.p.length?"Klik het volgende punt · dubbelklik of Lijn klaar om te stoppen":"Klik het beginpunt van de "+nm(cur).toLowerCase()):"Kies hieronder wat u meet en klik op de luchtfoto het beginpunt"}
  function bar(){const t=luchtTotalen(lijst.concat(actief&&actief.p.length>1?[actief]:[]));
    ov.querySelector("#lmBar").innerHTML=soorten.map(s=>`<button type="button" role="radio" data-s="${esc(s.id)}" aria-checked="${s.id===cur}" style="--c:${s.kleur}"><i></i>${esc(s.kort)}${t[s.id]?`<b>${lmFmt(t[s.id])} m</b>`:""}</button>`).join("");
    ov.querySelector("#lmUndo").disabled=!(actief&&actief.p.length)&&!lijst.length;ov.querySelector("#lmEind").disabled=!(actief&&actief.p.length>1);ov.querySelector("#lmWis").disabled=!lijst.length&&!actief;tip()}
  function teken(){laag.clearLayers();
    const een=(x,j,bezig)=>{const c=kl(x.s);if(x.p.length>1){L.polyline(x.p,{color:"#0b0f12",weight:8,opacity:.5,interactive:false}).addTo(laag);L.polyline(x.p,{color:c,weight:4,opacity:1,interactive:false}).addTo(laag)}
      x.p.forEach((q,i)=>L.marker(q,{interactive:false,icon:L.divIcon({className:"lm-pt"+(i===0?" eerste":""),html:"",iconSize:null})}).addTo(laag).getElement()?.style.setProperty("--c",c));
      if(!bezig&&x.p.length>1){const m=L.marker(x.p[x.p.length-1],{opacity:0,icon:L.divIcon({className:"",html:"",iconSize:[1,1]})}).addTo(laag);
        m.bindTooltip(`<i style="--c:${c}"></i>${esc(nm(x.s))} ${lmFmt(luchtLengte(x.p))} m`,{permanent:true,direction:"top",offset:[0,-10],className:"lm-lab",interactive:true});
        const el=m.getTooltip().getElement();if(el)el.onclick=ev=>{L.DomEvent.stop(ev);if(confirm(`${nm(x.s)} van ${lmFmt(luchtLengte(x.p))} m wissen?`)){lijst.splice(j,1);teken();bar()}}}};
    lijst.forEach((x,j)=>een(x,j,false));if(actief)een(actief,-1,true);bar()}
  function eind(){if(actief&&actief.p.length>1)lijst.push(actief);actief=null;if(live){map.removeLayer(live);live=null}teken()}
  map.on("click",e=>{if(map.getZoom()<17.5){map.setView(e.latlng,Math.min(20,map.getZoom()+4));const t=ov.querySelector("#lmTip");t.textContent="Zoom verder in tot u de dakrand goed ziet, dan meten";return}if(!actief)actief={s:cur,p:[]};actief.p.push([e.latlng.lat,e.latlng.lng]);teken()});
  map.on("dblclick",e=>{L.DomEvent.stop(e);if(actief&&actief.p.length>1){/* de klik vóór de dubbelklik heeft het laatste punt al gezet */const p=actief.p;if(p.length>2&&L.latLng(p[p.length-1]).distanceTo(L.latLng(p[p.length-2]))<.05)p.pop();eind()}});
  map.on("mousemove",e=>{if(!actief||!actief.p.length){if(live){map.removeLayer(live);live=null}return}const a=actief.p[actief.p.length-1],seg=L.latLng(a).distanceTo(e.latlng),tot=luchtLengte(actief.p)+seg;
    if(!live){live=L.polyline([a,e.latlng],{color:kl(actief.s),weight:3,dashArray:"8 7",interactive:false}).addTo(map);live.bindTooltip("",{permanent:true,direction:"right",offset:[14,0],className:"lm-live"})}
    live.setLatLngs([a,e.latlng]);live.setTooltipContent(`<small>+ ${lmFmt(seg)} m</small>${lmFmt(tot)} m`);live.openTooltip(e.latlng)});
  ov.querySelector("#lmBar").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;cur=b.dataset.s;if(actief&&!actief.p.length)actief.s=cur;else if(actief)eind();bar()});
  ov.querySelector("#lmUndo").onclick=()=>{if(actief&&actief.p.length){actief.p.pop();if(!actief.p.length){actief=null;if(live){map.removeLayer(live);live=null}}}else if(lijst.length){actief=lijst.pop();actief.p.pop()}teken()};
  ov.querySelector("#lmEind").onclick=eind;
  ov.querySelector("#lmWis").onclick=()=>{if(!confirm("Alle metingen op de luchtfoto wissen?"))return;lijst.length=0;actief=null;if(live){map.removeLayer(live);live=null}teken()};
  ov.querySelectorAll("[data-og]").forEach(b=>b.onclick=()=>{if(b.dataset.og==="kad"){const on=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",on);if(on)kadLaag().addTo(map);else if(kad)map.removeLayer(kad)}});
  const sluit=ok=>{if(ok&&actief)eind();try{ov.close()}catch(e){}map.remove();ov.remove();if(ok&&onKlaar)onKlaar(lijst.filter(x=>x.p.length>1).map(x=>({s:x.s,p:x.p.map(q=>[Math.round(q[0]*1e7)/1e7,Math.round(q[1]*1e7)/1e7])})))};
  ov.querySelector(".lm-x").onclick=()=>sluit(false);ov.querySelector("#lmOk").onclick=()=>sluit(true);
  teken();setTimeout(()=>map.invalidateSize(),50);
  if(lijst.length){const b=L.latLngBounds(lijst.flatMap(x=>x.p));map.fitBounds(b,{padding:[60,60],maxZoom:21})}
  else{const g=adres?await luchtGeo(adres):null;if(g){map.setView(g.ll,20.5);ov.querySelector("#lmAdr").textContent=g.naam}else{ov.querySelector("#lmAdr").textContent=adres?"Adres niet gevonden, zoom zelf in":"Geen adres: zoom zelf in"}}}
