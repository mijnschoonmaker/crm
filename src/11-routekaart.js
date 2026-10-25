/* ---------- Dagkaart: tik op de weg → alle stops van vandaag op een kaart (gedaan = groen, volgende groot, jouw positie erbij) ---------- */
state.rvMap=(()=>{try{return localStorage.getItem("ms.rvmap")==="1"}catch(e){return false}})();
function rvMapHtml(){return state.rvMap?`<div class="rv-map" id="rvMap"><div class="rv-map-l">Kaart laden…</div></div>`:""}
function rvMapToggle(){state.rvMap=!state.rvMap;try{localStorage.setItem("ms.rvmap",state.rvMap?"1":"0")}catch(e){}render()}
async function rvMapTeken(){const el=document.getElementById("rvMap");if(!el||!state.rvMap||typeof pkLaadLeaflet!=="function")return;
  const day=state.routeDay||iso(today()),stops=typeof rvStopFilter==="function"?rvStopFilter(routeStops(day)):routeStops(day),bk=rtBedrijf();
  const lijst=[...stops.map(s=>s.k),...(pkHeeftAdres(bk)?[bk]:[])];
  if(pkOpen(lijst).length){try{await pkGeocode(lijst)}catch(e){}}
  try{await pkLaadLeaflet()}catch(e){el.innerHTML='<div class="rv-map-l">Kaart niet beschikbaar</div>';return}
  if(!document.body.contains(el))return;const L=window.L;
  if(!el._map){el.innerHTML="";el._map=L.map(el,{zoomControl:false,attributionControl:false});rvOndergrond(el);el._laag=L.layerGroup().addTo(el._map);rvLaagKnop(el);rvVolgKnop(el)}
  const m=el._map;el._laag.clearLayers();const pts=[];let nx=stops.find(s=>!s.done);
  const lijn=[];
  stops.forEach((s,i)=>{const c=pkCoord(s.k);if(!c)return;pts.push(c);lijn.push(c);const nu=nx&&s.k.id===nx.k.id;
    L.marker(c,{icon:L.divIcon({className:"rvm",html:`<i class="${s.done?"af":nu?"nu":""}"${(()=>{const kc=typeof rvStopKleur==="function"&&rvStopKleur(s.k);return kc?` style="box-shadow:0 0 0 3px ${kc}"`:""})()}>${s.done?"✓":i+1}</i>`,iconSize:nu?[30,30]:[24,24],iconAnchor:nu?[15,15]:[12,12]}),zIndexOffset:nu?500:s.done?0:100})
      .bindTooltip(`${esc(jobAddrObj(s.k).adres||cleanName(s.k.naam))}${s.k.tijd?" · "+esc(s.k.tijd):""}`).addTo(el._laag)});
  if(lijn.length>1)L.polyline(lijn,{color:"#137a8a",weight:3,opacity:.55,dashArray:"6 8"}).addTo(el._laag);
  const lo=pkHeeftAdres(bk)&&pkCoord(bk);if(lo){pts.push(lo);L.marker(lo,{icon:L.divIcon({className:"rvm",html:`<i class="loods">${I.truck||"L"}</i>`,iconSize:[26,26],iconAnchor:[13,13]})}).bindTooltip("Loods").addTo(el._laag)}
  el._bus=null;cancelAnimationFrame(RVB.anim);const ploeg=typeof rvPloeg==="function"&&rvPloeg(el,pts);if(!ploeg)rvEigenStart();const mp=ploeg?null:rvEigenPos(),ik=mp&&[mp.lat,mp.lng];if(ploeg){}else if(ik){pts.push(ik);rvMapLive()}
  else if(!LIVE&&day===iso(today())&&!nx){const eind=lo||[...stops].reverse().map(s=>pkCoord(s.k)).find(Boolean);if(eind){el._demoF=eind;rvMapLive(eind)}}
  else if(!LIVE&&day===iso(today())&&nx){/* demo: laat het busje onderweg zien naar de volgende stop */
    const vi=stops.indexOf(nx),vorig=[...stops.slice(0,vi)].reverse().map(s=>pkCoord(s.k)).find(Boolean)||lo,naar=pkCoord(nx.k);
    if(naar&&vorig){el._demoF=[(vorig[0]+naar[0])/2,(vorig[1]+naar[1])/2];rvDemoRit(vorig,naar)}else if(naar)rvMapLive(naar)}
  if(!pts.length){el.innerHTML='<div class="rv-map-l">Nog geen adressen gevonden op de kaart</div>';el._map=null;return}
  rvMapMaat(el);m.invalidateSize();
  /* eerste keer: ingezoomd op het busje; daarna de stand van de gebruiker houden */
  if(!el._gezet){el._gezet=1;const f=(el._bus&&el._bus.getLatLng())||ik||el._demoF;rvProg(m,()=>{if(f)m.setView(f,16);else m.fitBounds(pts,{padding:[22,22],maxZoom:15})})}
}
/* ---------- Live busje op de dagkaart ----------
   Zelfde gevoel als het klantportaal: het busje rijdt over de echte weg (route via OSRM) van de vorige naar de nieuwe GPS-plek,
   kijkt de kant op waar het heen rijdt (kantelt mee met de weg) en schaalt mee met in- en uitzoomen. */
const RVB={anim:0,route:{},laatst:0,doel:null,r:0,f:1};
function rvBusB(z){return Math.round(Math.max(18,Math.min(110,44*Math.pow(1.45,z-16))))}
function rvBusSchaal(el){if(el&&el._map)el.style.setProperty("--busw",rvBusB(el._map.getZoom())+"px")}
function rvBusIcon(){return window.L.divIcon({className:"rvm-bus",html:`<span class="rvb"><i class="rvb-puls"></i><img src="/img/mansard-bus.png" alt=""></span>`,iconSize:[0,0],iconAnchor:[0,0]})}
/* richting op het scherm: rechts = 0°, omlaag = 90°. Zijaanzicht: naar rechts gewoon, naar links gespiegeld, kantelen tot ±80° */
function rvBusRicht(el,a,b,direct){if(!el._bus||!el._map)return;const m=el._map,p=m.latLngToLayerPoint(a),q=m.latLngToLayerPoint(b),dx=q.x-p.x,dy=q.y-p.y;if(Math.hypot(dx,dy)<.5)return;
  let h=Math.atan2(dy,dx)*180/Math.PI,f=1,r=h;if(dx<0){f=-1;r=h>0?h-180:h+180}r=Math.max(-80,Math.min(80,r));
  if(f!==RVB.f){RVB.f=f;RVB.r=r}else RVB.r=direct?r:RVB.r+(r-RVB.r)*.18;
  const sp=el._bus.getElement&&el._bus.getElement();const b2=sp&&sp.querySelector(".rvb");if(b2){b2.style.setProperty("--r",RVB.r.toFixed(1)+"deg");b2.style.setProperty("--f",f)}}
function rvAfstM(a,b){const R=6371000,t=Math.PI/180,x=(b[1]-a[1])*t*Math.cos((a[0]+b[0])*t/2),y=(b[0]-a[0])*t;return Math.hypot(x,y)*R}
async function rvWeg(a,b){const k=a.map(v=>v.toFixed(5))+">"+b.map(v=>v.toFixed(5));if(RVB.route[k])return RVB.route[k];
  try{const c=new AbortController(),t=setTimeout(()=>c.abort(),5000);
    const r=await fetch(`https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`,{signal:c.signal});clearTimeout(t);
    const j=await r.json(),g=j&&j.routes&&j.routes[0]&&j.routes[0].geometry.coordinates.map(x=>[x[1],x[0]]);
    if(g&&g.length>1){RVB.route[k]=g;return g}}catch(e){}
  return [a,b]}
function rvLangs(pad){const d=[0];for(let i=1;i<pad.length;i++)d.push(d[i-1]+rvAfstM(pad[i-1],pad[i]));return d}
function rvOpPad(pad,d,s){let i=1;while(i<pad.length-1&&d[i]<s)i++;const a=pad[i-1],b=pad[i],f=d[i]>d[i-1]?Math.min(1,Math.max(0,(s-d[i-1])/(d[i]-d[i-1]))):1;return{p:[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],a,b}}
function rvBusZet(el,p){const L=window.L;if(!el._map._loaded)rvProg(el._map,()=>el._map.setView(p,16));
  if(!el._bus||!el._laag.hasLayer(el._bus)){el._bus=L.marker(p,{icon:rvBusIcon(),zIndexOffset:1000,keyboard:false,interactive:false}).addTo(el._laag);
    if(!el._busZoom){el._busZoom=1;el._map.on("zoom zoomend",()=>rvBusSchaal(el))}rvBusSchaal(el);
    const b2=el._bus.getElement().querySelector(".rvb");b2.style.setProperty("--r",RVB.r+"deg");b2.style.setProperty("--f",RVB.f)}
  else el._bus.setLatLng(p);
  /* de kaart rijdt mee: het busje blijft in het midden (tot je zelf schuift of zoomt; dan verschijnt "Centreren") */
  try{const m=el._map;if(el._volg!==false&&!m._rvProgN)m.setView(p,m.getZoom(),{animate:false});rvVolgToon(el)}catch(e){}}
/* programmatisch bewegen telt niet als "zelf geschoven" */
function rvProg(m,f){m._rvProgN=(m._rvProgN||0)+1;try{f()}finally{setTimeout(()=>{m._rvProgN=Math.max(0,(m._rvProgN||1)-1)},450)}}
function rvVolgToon(el){const b=el._volgKnop;if(b)b.hidden=!(el._bus&&el._volg===false)}
function rvVolgKnop(el){const m=el._map,b=document.createElement("button");b.type="button";b.className="rv-laag rv-centreer";b.hidden=true;
  b.innerHTML=`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7.5"/></svg><span>Centreren</span>`;
  b.setAttribute("aria-label","Kaart weer op het busje centreren");el._volgKnop=b;
  b.addEventListener("click",e=>{e.stopPropagation();el._volg=true;rvVolgToon(el);if(el._bus)rvProg(m,()=>m.setView(el._bus.getLatLng(),Math.max(m.getZoom(),15),{animate:true}))});
  ["mousedown","touchstart","dblclick","wheel"].forEach(t=>b.addEventListener(t,ev=>ev.stopPropagation(),{passive:true}));el.appendChild(b);
  m.on("dragstart zoomstart",()=>{if(m._rvProgN)return;el._volg=false;rvVolgToon(el)})}
/* rij langs een pad in dur ms */
function rvRij(el,pad,dur,klaar){cancelAnimationFrame(RVB.anim);const d=rvLangs(pad),tot=d[d.length-1],t0=performance.now();
  const stap=n=>{if(!document.body.contains(el)||!el._map)return;const f=Math.min(1,(n-t0)/dur),o=rvOpPad(pad,d,tot*f);rvBusZet(el,o.p);rvBusRicht(el,o.a,o.b);
    if(f<1)RVB.anim=requestAnimationFrame(stap);else klaar&&klaar()};RVB.anim=requestAnimationFrame(stap)}
/* echte GPS-positie */
async function rvMapLive(nep){const el=document.getElementById("rvMap");if(!el||!el._map||!window.L)return;const echt=rvEigenPos();
  if(!echt){if(nep){cancelAnimationFrame(RVB.anim);rvBusZet(el,nep)}return}
  const doel=[echt.lat,echt.lng],nu=Date.now();
  if(!el._bus||!el._laag.hasLayer(el._bus)){cancelAnimationFrame(RVB.anim);rvBusZet(el,RVB.doel||doel);if(!RVB.doel){RVB.doel=doel;RVB.laatst=nu;return}}
  if(RVB.doel&&rvAfstM(RVB.doel,doel)<8)return;
  const van=el._bus.getLatLng(),a=[van.lat,van.lng],tussen=nu-(RVB.laatst||nu);RVB.doel=doel;RVB.laatst=nu;
  const afst=rvAfstM(a,doel);let pad=[a,doel];
  if(afst>25&&afst<5000){const w=await rvWeg(a,doel);if(rvLangs(w).pop()<afst*3.5)pad=[a,...w,doel];if(RVB.doel!==doel)return}
  rvRij(el,pad,Math.max(1200,Math.min(11000,tussen*.9||2000)))}
/* demo: busje rijdt over de weg van de vorige stop naar de volgende, steeds opnieuw */
async function rvDemoRit(a,b){const el=document.getElementById("rvMap");if(!el||!el._map)return;const pad=await rvWeg(a,b);if(!document.body.contains(el))return;
  const d=rvLangs(pad),tot=d[d.length-1],cyc=42000;rvBusZet(el,pad[0]);cancelAnimationFrame(RVB.anim);
  const stap=()=>{if(!document.body.contains(el)||!el._map)return;const t=(Date.now()%(cyc+3000))/cyc,f=Math.min(1,t)*.92,o=rvOpPad(pad,d,tot*f);
    rvBusZet(el,o.p);rvBusRicht(el,o.a,o.b,t<.01);RVB.anim=requestAnimationFrame(stap)};RVB.anim=requestAnimationFrame(stap)}
/* eigen positie op de kaart, ook als Live delen uit staat (alleen op dit toestel, gaat niet naar klanten) */
const RVP={watch:null,pos:null};
function rvEigenPos(){const pb=typeof plBusPos==="function"?plBusPos():undefined;if(pb!==undefined)return pb;return RVP.pos||(typeof LV!=="undefined"&&LV.pos)||null}
function rvEigenStart(){if(!LIVE||RVP.watch!=null||!navigator.geolocation)return;
  RVP.watch=navigator.geolocation.watchPosition(p=>{
    if(!document.getElementById("rvMap")){navigator.geolocation.clearWatch(RVP.watch);RVP.watch=null;return}
    const eerst=!RVP.pos;RVP.pos={lat:p.coords.latitude,lng:p.coords.longitude};rvMapLive();
    if(eerst){const el=document.getElementById("rvMap");try{el._map.setView([RVP.pos.lat,RVP.pos.lng],16)}catch(e){}}},
    ()=>{},{enableHighAccuracy:true,maximumAge:5000,timeout:30000})}
/* ondergrond: luchtfoto (PDOK, haarscherp voor heel Nederland) met PDOK-straatnamen erover, of de PDOK-stratenkaart. Geen API-sleutel nodig. */
state.rvSat=(()=>{try{return localStorage.getItem("ms.rvsat2")!=="0"}catch(e){return true}})();
function rvOndergrond(el,mp){const L=window.L,m=mp||el._map;(el._tegels||[]).forEach(t=>m.removeLayer(t));
  const pd="https://service.pdok.nl/",o={maxZoom:20,maxNativeZoom:19};
  el._tegels=state.rvSat?[
    L.tileLayer(pd+"hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg",o),
    L.tileLayer(pd+"bzk/luchtfotolabels/wmts/v1_0/lufolabels/EPSG:3857/{z}/{x}/{y}.png",o)
  ]:[L.tileLayer(pd+"brt/achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png",o)];
  /* valt een PDOK-laag weg, dan terug naar OpenStreetMap zodat de kaart nooit leeg is */
  el._tegels.forEach((t,i)=>{let fout=0;t.on("tileerror",()=>{if(++fout===6&&m.hasLayer(t)){m.removeLayer(t);if(i===0)el._tegels.push(L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(m).bringToBack())}})});
  el._tegels.forEach(t=>t.addTo(m).bringToBack());el._tegels.slice().reverse().forEach(t=>t.bringToBack());el.classList.toggle("sat",state.rvSat)}
function rvLaagKnop(el,mp){const b=document.createElement("button");b.type="button";b.className="rv-laag";
  const zet=()=>{b.innerHTML=state.rvSat?"<span>Kaart</span>":"<span>Satelliet</span>";b.setAttribute("aria-label",state.rvSat?"Toon stratenkaart":"Toon luchtfoto")};zet();
  b.addEventListener("click",e=>{e.stopPropagation();state.rvSat=!state.rvSat;try{localStorage.setItem("ms.rvsat2",state.rvSat?"1":"0")}catch(er){}rvOndergrond(el,mp);zet()});
  ["mousedown","touchstart","dblclick","wheel"].forEach(t=>b.addEventListener(t,e=>e.stopPropagation(),{passive:true}));el.appendChild(b)}
/* tablet/desktop liggend: kaart precies zo hoog dat het hele blok in beeld past */
function rvMapMaat(el){el=el||document.getElementById("rvMap");if(!el)return;const rv=el.closest(".rv");
  const cs=rv&&getComputedStyle(rv),pl=cs?parseFloat(cs.paddingLeft)||26:26;if(rv)rv.style.setProperty("--rvpad",pl+"px");
  if(innerWidth<=700||innerHeight>innerWidth){el.style.height="";return}
  const top=el.getBoundingClientRect().top+scrollY,h=Math.round(innerHeight-top-pl-14);
  el.style.height=Math.max(200,Math.min(620,h))+"px";if(el._map)el._map.invalidateSize()}
addEventListener("resize",()=>{clearTimeout(rvMapMaat._t);rvMapMaat._t=setTimeout(()=>rvMapMaat(),150)});
