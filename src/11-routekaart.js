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
  const ik=typeof LV!=="undefined"&&LV.pos&&[LV.pos.lat,LV.pos.lng];if(ik){pts.push(ik);L.circleMarker(ik,{radius:7,color:"#fff",weight:3,fillColor:"#2f6fdd",fillOpacity:1}).bindTooltip("Jij").addTo(el._laag)}
  if(!pts.length){el.innerHTML='<div class="rv-map-l">Nog geen adressen gevonden op de kaart</div>';el._map=null;return}
  m.invalidateSize();m.fitBounds(pts,{padding:[22,22],maxZoom:15});
}
