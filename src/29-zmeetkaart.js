/* ---------- Meten op de luchtfoto (zoals Perceelloep, maar in het CRM) ----------
   Naast elke regel per strekkende meter, per m² of per paneel een knop "Meten". Er opent een scherpe luchtfoto (PDOK) van het adres
   met de kadastrale kaart (woningen en perceelgrenzen). Tik punten aan: de lengte (of oppervlakte) loopt mee,
   per stuk staat de maat erbij. "Overnemen" zet het getal meteen in het vak. Panelen tel je door op elk paneel te tikken. */
const MKT={};
const mktModus=e=>e==="per m²"?"vlak":e==="per paneel"?"tel":/meter/.test(String(e||""))?"lijn":"";
const mktKnop=(key,j,it,k)=>{const m=mktModus(it.eenheid);if(!m)return"";
  const adr=k?[k.adres,k.postcode,k.plaats].filter(Boolean).join(" "):"",ll=k&&k.lat&&k.lng?k.lat+","+k.lng:"";
  return `<button type="button" class="ge-meet" data-mkt="${esc(key)}:${j}" data-mktm="${m}" data-mktn="${esc(it.naam||"")}" data-mkta="${esc(adr)}" data-mktl="${esc(ll)}" title="${m==="tel"?"Tellen":"Meten"} op de luchtfoto">${I.ruler||""}<span>${m==="tel"?"Tellen":"Meten"}</span></button>`};
const mktFmt=(v,m)=>m==="tel"?String(v):(Math.round(v*10)/10).toString().replace(".",",");
const mktEenh=m=>m==="vlak"?"m²":m==="tel"?"st":"m";
async function mktGeo(q){if(!q)return null;try{const r=await fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?rows=1&fq=type:adres&q="+encodeURIComponent(q)).then(x=>x.json());
  const d=r&&r.response&&r.response.docs&&r.response.docs[0],p=d&&String(d.centroide_ll||"").match(/POINT\(([\d.]+) ([\d.]+)\)/);return p?{lat:+p[2],lng:+p[1],naam:d.weergavenaam||q}:null}catch(e){return null}}
function mktOpen(btn){
  const [key,j]=btn.dataset.mkt.split(":"),modus=btn.dataset.mktm,naam=btn.dataset.mktn,box=btn.closest("[data-ge]");
  const inp=box&&box.querySelector(`input[data-gk="${CSS.escape(key)}"][data-gi="${j}"][data-gf="aantal"]`);if(!inp)return;
  /* geen klantadres op de knop (bv. nieuwe offerte): het adres uit het formulier */
  if(!btn.dataset.mkta){const v=id=>{const e=document.getElementById(id);return e&&e.value?e.value.trim():""};const a=["ow-adres","ow-postcode","ow-plaats"].map(v).filter(Boolean).join(" ");if(a)btn.dataset.mkta=a}
  let d=document.getElementById("mktDlg");if(d)d.remove();d=document.createElement("dialog");d.id="mktDlg";d.className="mkt";
  d.innerHTML=`<div class="mkt-kop"><div><b>${esc(naam)}</b><small>${modus==="vlak"?"Tik de hoeken van het vlak aan":modus==="tel"?"Tik op elk paneel":"Tik punten aan langs de goot, daklijst of windveer"}</small></div>
    <form class="mkt-zoek"><input type="search" placeholder="Adres zoeken…" value="${esc(btn.dataset.mkta||MKT.adres||"")}" aria-label="Adres"><button type="submit" class="small">Zoek</button></form>
    <button type="button" class="ghost mkt-x" aria-label="Sluiten">${I.x||"×"}</button></div>
    <div class="mkt-map"></div>
    <div class="mkt-balk"><div class="mkt-tot"><span>0</span> ${mktEenh(modus)}</div>
      <div class="mkt-kn">${modus==="tel"?"":`<button type="button" class="small" data-m="nieuw" title="Begin een losse lijn; de lengtes tellen op">${modus==="vlak"?"Nieuw vlak":"Nieuwe lijn"}</button>`}
      <button type="button" class="small" data-m="terug">Ongedaan</button><button type="button" class="small" data-m="wis">Wissen</button>
      <a class="small mkt-pl" href="https://www.perceelloep.nl/" target="_blank" rel="noopener">Perceelloep</a>
      <button type="button" class="small primary" data-m="ok">Overnemen</button></div></div>`;
  document.body.appendChild(d);d.showModal();
  const sluit=()=>{try{d.close()}catch(e){}d.remove()};d.querySelector(".mkt-x").onclick=sluit;d.addEventListener("cancel",e=>{e.preventDefault();sluit()});
  pkLaadLeaflet().then(async()=>{const L=window.L,el=d.querySelector(".mkt-map");
    const map=L.map(el,{zoomControl:true,attributionControl:false,maxZoom:22,doubleClickZoom:false});
    const pd="https://service.pdok.nl/";
    L.tileLayer(pd+"hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg",{maxZoom:22,maxNativeZoom:19}).addTo(map);
    L.tileLayer.wms(pd+"kadaster/kadastralekaart/wms/v5_0",{layers:"Kadastralekaart",format:"image/png",transparent:true,maxZoom:22,minZoom:16,opacity:.9}).addTo(map);
    const gaNaar=(p,z)=>{map.setView([p.lat,p.lng],z||20)};
    const ll=btn.dataset.mktl?btn.dataset.mktl.split(",").map(Number):null;
    if(ll&&ll[0])gaNaar({lat:ll[0],lng:ll[1]});else{const g=await mktGeo(btn.dataset.mkta||MKT.adres);if(g)gaNaar(g);else map.setView([52.15,5.4],8)}
    setTimeout(()=>map.invalidateSize(),150);
    d.querySelector(".mkt-zoek").onsubmit=async e=>{e.preventDefault();const q=e.target.querySelector("input").value.trim();const g=await mktGeo(q);if(g){MKT.adres=q;gaNaar(g)}else toast("Adres niet gevonden")};
    /* tekenen */
    let delen=[[]];const laag=L.layerGroup().addTo(map),kleur="#ff2bd6";
    const afst=(a,b)=>map.distance(a,b);
    const opp=pts=>{if(pts.length<3)return 0;const la0=pts.reduce((s,p)=>s+p[0],0)/pts.length*Math.PI/180,X=p=>p[1]*111320*Math.cos(la0),Y=p=>p[0]*110540;
      let s=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];s+=X(a)*Y(b)-X(b)*Y(a)}return Math.abs(s)/2};
    const lijnLen=pts=>pts.slice(1).reduce((s,p,i)=>s+afst(pts[i],p),0);
    const totaal=()=>modus==="tel"?delen[0].length:modus==="vlak"?delen.reduce((s,p)=>s+opp(p),0):delen.reduce((s,p)=>s+lijnLen(p),0);
    const lab=(p,t,cl)=>L.marker(p,{icon:L.divIcon({className:"mkt-lab"+(cl?" "+cl:""),html:t,iconSize:null}),interactive:false}).addTo(laag);
    const teken=()=>{laag.clearLayers();
      delen.forEach((pts,di)=>{if(modus==="tel"){pts.forEach((p,i)=>lab(p,String(i+1),"tel"));return}
        if(pts.length>1)(modus==="vlak"&&pts.length>2?L.polygon(pts,{color:kleur,weight:3,fillOpacity:.18}):L.polyline(pts,{color:kleur,weight:4})).addTo(laag);
        if(modus==="lijn")pts.slice(1).forEach((p,i)=>{const a=pts[i],m=[(a[0]+p[0])/2,(a[1]+p[1])/2];lab(m,mktFmt(afst(a,p),"lijn")+" m")});
        if(modus==="vlak"&&pts.length>2){const c=[pts.reduce((s,p)=>s+p[0],0)/pts.length,pts.reduce((s,p)=>s+p[1],0)/pts.length];lab(c,mktFmt(opp(pts),"vlak")+" m²","groot")}
        pts.forEach((p,i)=>L.circleMarker(p,{radius:6,color:"#fff",weight:2,fillColor:i===pts.length-1&&di===delen.length-1?"#33c24d":kleur,fillOpacity:1,interactive:false}).addTo(laag))});
      d.querySelector(".mkt-tot span").textContent=mktFmt(totaal(),modus)};
    map.on("click",e=>{delen[delen.length-1].push([e.latlng.lat,e.latlng.lng]);teken()});
    d.querySelector(".mkt-balk").addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(!b)return;const w=b.dataset.m;
      if(w==="nieuw"){if(delen[delen.length-1].length)delen.push([])}
      else if(w==="terug"){const l=delen[delen.length-1];if(l.length)l.pop();else if(delen.length>1){delen.pop();delen[delen.length-1].pop()}}
      else if(w==="wis")delen=[[]];
      else if(w==="ok"){const v=totaal();if(!(v>0)){toast("Nog niets gemeten");return}
        inp.value=modus==="tel"?String(v):String(Math.round(v*10)/10);inp.dispatchEvent(new Event("change",{bubbles:true}));sluit();toast(naam+": "+mktFmt(v,modus)+" "+mktEenh(modus)+" overgenomen");return}
      teken()});
    teken();
  }).catch(()=>{toast("De kaart kon niet laden");sluit()});
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-mkt]");if(!b)return;e.preventDefault();e.stopPropagation();mktOpen(b)},true);
