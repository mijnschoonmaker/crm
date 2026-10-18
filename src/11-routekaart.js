/* ---------- Dagkaart: tik op de weg → alle stops van vandaag op een kaart (gedaan = groen, volgende groot, jouw positie erbij) ---------- */
state.rvMap=(()=>{try{return localStorage.getItem("ms.rvmap")==="1"}catch(e){return false}})();
function rvMapHtml(){return state.rvMap?`<div class="rv-map" id="rvMap"><div class="rv-map-l">Kaart laden…</div></div>`:""}
function rvMapToggle(){state.rvMap=!state.rvMap;try{localStorage.setItem("ms.rvmap",state.rvMap?"1":"0")}catch(e){}render()}
async function rvMapTeken(){const el=document.getElementById("rvMap");if(!el||!state.rvMap||typeof pkLaadLeaflet!=="function")return;
  const day=state.routeDay||iso(today()),stops=routeStops(day),bk=rtBedrijf();
  const lijst=[...stops.map(s=>s.k),...(pkHeeftAdres(bk)?[bk]:[])];
  if(pkOpen(lijst).length){try{await pkGeocode(lijst)}catch(e){}}
  try{await pkLaadLeaflet()}catch(e){el.innerHTML='<div class="rv-map-l">Kaart niet beschikbaar</div>';return}
  if(!document.body.contains(el))return;const L=window.L;
  if(!el._map){el.innerHTML="";el._map=L.map(el,{zoomControl:false,attributionControl:false});L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(el._map);el._laag=L.layerGroup().addTo(el._map)}
  const m=el._map;el._laag.clearLayers();const pts=[];let nx=stops.find(s=>!s.done);
  const lijn=[];
  stops.forEach((s,i)=>{const c=pkCoord(s.k);if(!c)return;pts.push(c);lijn.push(c);const nu=nx&&s.k.id===nx.k.id;
    L.marker(c,{icon:L.divIcon({className:"rvm",html:`<i class="${s.done?"af":nu?"nu":""}">${s.done?"✓":i+1}</i>`,iconSize:nu?[30,30]:[24,24],iconAnchor:nu?[15,15]:[12,12]}),zIndexOffset:nu?500:s.done?0:100})
      .bindTooltip(`${esc(jobAddrObj(s.k).adres||cleanName(s.k.naam))}${s.k.tijd?" · "+esc(s.k.tijd):""}`).addTo(el._laag)});
  if(lijn.length>1)L.polyline(lijn,{color:"#137a8a",weight:3,opacity:.55,dashArray:"6 8"}).addTo(el._laag);
  const lo=pkHeeftAdres(bk)&&pkCoord(bk);if(lo){pts.push(lo);L.marker(lo,{icon:L.divIcon({className:"rvm",html:`<i class="loods">${I.truck||"L"}</i>`,iconSize:[26,26],iconAnchor:[13,13]})}).bindTooltip("Loods").addTo(el._laag)}
  el._bus=null;rvEigenStart();const mp=rvEigenPos(),ik=mp&&[mp.lat,mp.lng];if(ik){pts.push(ik);rvMapLive()}
  else if(!LIVE&&day===iso(today())&&!nx){const eind=lo||[...stops].reverse().map(s=>pkCoord(s.k)).find(Boolean);if(eind)rvMapLive(eind,270)}
  else if(!LIVE&&day===iso(today())&&nx){/* demo: laat het busje onderweg zien naar de volgende stop */
    const vi=stops.indexOf(nx),vorig=[...stops.slice(0,vi)].reverse().map(s=>pkCoord(s.k)).find(Boolean)||lo,naar=pkCoord(nx.k);
    if(naar){const a=vorig||naar;rvMapLive([a[0]+(naar[0]-a[0])*.62,a[1]+(naar[1]-a[1])*.62],a[1]>naar[1]?270:90)}}
  if(!pts.length){el.innerHTML='<div class="rv-map-l">Nog geen adressen gevonden op de kaart</div>';el._map=null;return}
  m.invalidateSize();m.fitBounds(pts,{padding:[22,22],maxZoom:15});
}
/* live busje op de dagkaart: zelfde gevoel als het klantportaal — rijdt mee met je GPS */
function rvBusIcon(kk){const L=window.L,k=Number.isFinite(kk)?kk:typeof LV!=="undefined"&&Number.isFinite(LV.koers)?LV.koers:90,links=k>180&&k<360;
  return L.divIcon({className:"rvm-bus",html:`<span class="rvb${links?" l":""}"><i class="rvb-puls"></i><img src="/img/mansard-bus.png" alt=""></span>`,iconSize:[44,12],iconAnchor:[22,11]})}
function rvMapLive(nep,nk){const el=document.getElementById("rvMap");if(!el||!el._map||!window.L)return;const echt=rvEigenPos();if(!echt&&!nep)return;
  const L=window.L,doel=echt?[echt.lat,echt.lng]:nep;
  if(!el._bus||!el._laag.hasLayer(el._bus)){el._bus=L.marker(doel,{icon:rvBusIcon(echt?null:nk),zIndexOffset:1000,keyboard:false}).bindTooltip("Jij · live",{direction:"top",offset:[0,-30]}).addTo(el._laag);return}
  el._bus.setIcon(rvBusIcon(echt?null:nk));
  /* zacht verschuiven naar de nieuwe plek i.p.v. springen */
  const van=el._bus.getLatLng(),t0=performance.now(),dur=1600;cancelAnimationFrame(el._busAnim);
  const stap=n=>{const f=Math.min(1,(n-t0)/dur),e=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;
    el._bus.setLatLng([van.lat+(doel[0]-van.lat)*e,van.lng+(doel[1]-van.lng)*e]);if(f<1)el._busAnim=requestAnimationFrame(stap)};
  el._busAnim=requestAnimationFrame(stap)}
/* eigen positie op de kaart, ook als Live delen uit staat (alleen op dit toestel, gaat niet naar klanten) */
const RVP={watch:null,pos:null,koers:null};
function rvEigenPos(){return typeof LV!=="undefined"&&LV.pos?LV.pos:RVP.pos}
function rvEigenStart(){if(!LIVE||RVP.watch!=null||!navigator.geolocation)return;
  RVP.watch=navigator.geolocation.watchPosition(p=>{
    if(!document.getElementById("rvMap")){navigator.geolocation.clearWatch(RVP.watch);RVP.watch=null;return}
    const c={lat:p.coords.latitude,lng:p.coords.longitude},o=RVP.pos;
    if(Number.isFinite(p.coords.heading))RVP.koers=p.coords.heading;else if(o&&Math.abs(c.lng-o.lng)>.0002)RVP.koers=c.lng<o.lng?270:90;
    if(typeof LV!=="undefined"&&RVP.koers!=null&&!LV.pos)LV.koers=RVP.koers;
    const eerst=!o;RVP.pos=c;if(typeof LV!=="undefined"&&LV.pos)return;
    if(eerst){const el=document.getElementById("rvMap");if(el&&el._map){rvMapLive();try{el._map.fitBounds(el._map.getBounds().extend([c.lat,c.lng]),{padding:[22,22],maxZoom:15})}catch(e){}}}else rvMapLive()},
    ()=>{},{enableHighAccuracy:true,maximumAge:10000,timeout:30000})}
