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
  if(!el._map){el.innerHTML="";el._map=L.map(el,{zoomControl:false,attributionControl:false});rvOndergrond(el);el._laag=L.layerGroup().addTo(el._map);rvLaagKnop(el)}
  const m=el._map;el._laag.clearLayers();const pts=[];let nx=stops.find(s=>!s.done);
  const lijn=[];
  stops.forEach((s,i)=>{const c=pkCoord(s.k);if(!c)return;pts.push(c);lijn.push(c);const nu=nx&&s.k.id===nx.k.id;
    L.marker(c,{icon:L.divIcon({className:"rvm",html:`<i class="${s.done?"af":nu?"nu":""}">${s.done?"✓":i+1}</i>`,iconSize:nu?[30,30]:[24,24],iconAnchor:nu?[15,15]:[12,12]}),zIndexOffset:nu?500:s.done?0:100})
      .bindTooltip(`${esc(jobAddrObj(s.k).adres||cleanName(s.k.naam))}${s.k.tijd?" · "+esc(s.k.tijd):""}`).addTo(el._laag)});
  if(lijn.length>1)L.polyline(lijn,{color:"#137a8a",weight:3,opacity:.55,dashArray:"6 8"}).addTo(el._laag);
  const lo=pkHeeftAdres(bk)&&pkCoord(bk);if(lo){pts.push(lo);L.marker(lo,{icon:L.divIcon({className:"rvm",html:`<i class="loods">${I.truck||"L"}</i>`,iconSize:[26,26],iconAnchor:[13,13]})}).bindTooltip("Loods").addTo(el._laag)}
  el._bus=null;cancelAnimationFrame(RVB.anim);rvEigenStart();const mp=rvEigenPos(),ik=mp&&[mp.lat,mp.lng];if(ik){pts.push(ik);rvMapLive()}
  else if(!LIVE&&day===iso(today())&&!nx){const eind=lo||[...stops].reverse().map(s=>pkCoord(s.k)).find(Boolean);if(eind)rvMapLive(eind)}
  else if(!LIVE&&day===iso(today())&&nx){/* demo: laat het busje onderweg zien naar de volgende stop */
    const vi=stops.indexOf(nx),vorig=[...stops.slice(0,vi)].reverse().map(s=>pkCoord(s.k)).find(Boolean)||lo,naar=pkCoord(nx.k);
    if(naar&&vorig)rvDemoRit(vorig,naar);else if(naar)rvMapLive(naar)}
  if(!pts.length){el.innerHTML='<div class="rv-map-l">Nog geen adressen gevonden op de kaart</div>';el._map=null;return}
  m.invalidateSize();m.fitBounds(pts,{padding:[22,22],maxZoom:15});
}
/* ---------- Live busje op de dagkaart ----------
   Zelfde gevoel als het klantportaal: het busje rijdt over de echte weg (route via OSRM) van de vorige naar de nieuwe GPS-plek,
   kijkt de kant op waar het heen rijdt (kantelt mee met de weg) en schaalt mee met in- en uitzoomen. */
const RVB={anim:0,route:{},laatst:0,doel:null,r:0,f:1};
function rvBusB(z){return Math.round(Math.max(18,Math.min(110,44*Math.pow(1.45,z-14))))}
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
function rvBusZet(el,p){const L=window.L;
  if(!el._bus||!el._laag.hasLayer(el._bus)){el._bus=L.marker(p,{icon:rvBusIcon(),zIndexOffset:1000,keyboard:false,interactive:false}).addTo(el._laag);
    if(!el._busZoom){el._busZoom=1;el._map.on("zoom zoomend",()=>rvBusSchaal(el))}rvBusSchaal(el);
    const b2=el._bus.getElement().querySelector(".rvb");b2.style.setProperty("--r",RVB.r+"deg");b2.style.setProperty("--f",RVB.f)}
  else el._bus.setLatLng(p)}
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
function rvEigenPos(){return RVP.pos||(typeof LV!=="undefined"&&LV.pos)||null}
function rvEigenStart(){if(!LIVE||RVP.watch!=null||!navigator.geolocation)return;
  RVP.watch=navigator.geolocation.watchPosition(p=>{
    if(!document.getElementById("rvMap")){navigator.geolocation.clearWatch(RVP.watch);RVP.watch=null;return}
    const eerst=!RVP.pos;RVP.pos={lat:p.coords.latitude,lng:p.coords.longitude};rvMapLive();
    if(eerst){const el=document.getElementById("rvMap");try{el._map.fitBounds(el._map.getBounds().extend([RVP.pos.lat,RVP.pos.lng]),{padding:[22,22],maxZoom:15})}catch(e){}}},
    ()=>{},{enableHighAccuracy:true,maximumAge:5000,timeout:30000})}
/* ondergrond: luchtfoto (PDOK, haarscherp voor heel Nederland) met straatnamen erover, of een rustige stratenkaart */
state.rvSat=(()=>{try{return localStorage.getItem("ms.rvsat")!=="0"}catch(e){return true}})();
function rvOndergrond(el){const L=window.L,m=el._map;(el._tegels||[]).forEach(t=>m.removeLayer(t));
  el._tegels=state.rvSat?[
    L.tileLayer("https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg",{maxZoom:20,maxNativeZoom:19}),
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",{maxZoom:20,subdomains:"abcd",opacity:.95})
  ]:[L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:20,subdomains:"abcd"})];
  el._tegels.forEach(t=>t.addTo(m));el.classList.toggle("sat",state.rvSat)}
function rvLaagKnop(el){const b=document.createElement("button");b.type="button";b.className="rv-laag";
  const zet=()=>{b.innerHTML=state.rvSat?"<span>Kaart</span>":"<span>Satelliet</span>";b.setAttribute("aria-label",state.rvSat?"Toon stratenkaart":"Toon luchtfoto")};zet();
  b.addEventListener("click",e=>{e.stopPropagation();state.rvSat=!state.rvSat;try{localStorage.setItem("ms.rvsat",state.rvSat?"1":"0")}catch(er){}rvOndergrond(el);zet()});
  ["mousedown","touchstart","dblclick","wheel"].forEach(t=>b.addEventListener(t,e=>e.stopPropagation(),{passive:true}));el.appendChild(b)}
