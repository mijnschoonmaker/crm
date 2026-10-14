/* ---------- Werkgebieden: op de kaart tekenen waar de website-calculator aanvragen aanneemt ---------- */
const WG_SOORT={beide:"Particulier en zakelijk",particulier:"Alleen particulier",zakelijk:"Alleen zakelijk"};
function wgInPoly(lat,lng,pts){let binnen=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const yi=pts[i][0],xi=pts[i][1],yj=pts[j][0],xj=pts[j][1];
  if(((yi>lat)!==(yj>lat))&&(lng<(xj-xi)*(lat-yi)/(yj-yi)+xi))binnen=!binnen}return binnen}
function wgActief(){return (S().webGebieden||[]).filter(g=>g&&g.aan!==false&&Array.isArray(g.pts)&&g.pts.length>=3)}
/* postcodes (4 cijfers) van klanten die al in het crm staan: daar werk je dus al */
function wgKlantPc(){const z=new Set();(state.klanten||[]).forEach(k=>{[k.postcode,(jobAddrObj(k)||{}).postcode].forEach(p=>{const m=String(p||"").match(/^\s*(\d{4})/);if(m)z.add(m[1])})});return [...z].sort()}
const wgKlantPcAan=()=>S().webKlantPc!==false;
/* compact voor de calculator: alleen wat nodig is om te testen */
function wgVoorCalc(){return wgActief().map(g=>({s:g.soort||"beide",p:g.pts.map(p=>[Math.round(p[0]*1e5)/1e5,Math.round(p[1]*1e5)/1e5])}))}

async function werkgebiedEditor(onKlaar){
  const L0=JSON.parse(JSON.stringify(S().webGebieden||[]));let G=L0.map((g,i)=>({id:g.id||newId("wg"),naam:g.naam||"Gebied "+(i+1),soort:g.soort||"beide",aan:g.aan!==false,pts:(g.pts||[]).map(p=>[+p[0],+p[1]])}));
  let sel=G.length?G[0].id:null,teken=null,map=null,laag=null,gewijzigd=false;
  const o=document.createElement("dialog");o.className="wcv-ov wg-ov";
  o.innerHTML=`<div class="wcv wg"><div class="wcv-h"><span class="objic">${I.map||I.pin}</span><div style="min-width:0;flex:1"><b>Werkgebieden</b><small>De postcodes van je klanten tellen automatisch mee. Teken daarnaast zelf gebieden erbij. Alleen adressen hierbinnen kunnen op je website een prijs berekenen en aanvragen.</small></div><button type="button" class="iconbtn" data-wgx aria-label="Sluiten">${I.x}</button></div>
    <div class="wg-b"><div class="wg-kaart"><div id="wgMap"></div><div class="wg-band" id="wgBand" hidden></div></div>
      <aside class="wg-side"><div class="wg-kp" id="wgKp"></div><span class="eyebrow wg-eb">Zelf getekend</span><div class="wg-lijst" id="wgLijst"></div>
        <button type="button" class="wg-nieuw" id="wgNieuw">${I.plus}Nieuw gebied tekenen</button>
        <div class="wg-test"><span class="eyebrow">Test een adres</span><div class="wg-tr"><input id="wgQ" placeholder="Postcode en huisnummer, bijv. 9861 AB 10" autocomplete="off"><button type="button" class="small" id="wgT">Testen</button></div><div id="wgTr" class="wg-res"></div></div>
        <small class="help">Tik op een gebied om het te bewerken. Sleep de punten om de rand te verschuiven, tik op de kaart om een punt toe te voegen en tik op een punt om het weg te halen. Een adres mag een prijs berekenen als het binnen een getekend gebied ligt, de postcode al bij een klant in je CRM staat, of in je postcodelijst staat.</small></aside></div>
    <div class="wg-f"><span class="sp"></span><button type="button" data-wgx>Annuleren</button><button type="button" class="primary" id="wgOk">${I.check}Opslaan</button></div></div>`;
  document.body.appendChild(o);o.showModal();
  const $o=q=>o.querySelector(q),sluit=async(vraagEerst)=>{if(vraagEerst&&gewijzigd&&!await vraag("Wijzigingen weggooien?","Je hebt werkgebieden aangepast die nog niet zijn opgeslagen.","Weggooien","Terug"))return;try{map&&map.remove()}catch(_){}o.close();o.remove()};
  o.addEventListener("cancel",e=>{e.preventDefault();sluit(true)});
  o.querySelectorAll("[data-wgx]").forEach(b=>b.onclick=()=>sluit(true));
  const huidig=()=>G.find(g=>g.id===sel);
  function lijst(){const el=$o("#wgLijst");
    el.innerHTML=G.length?G.map(g=>`<div class="wg-it${g.id===sel?" sel":""}${g.aan?"":" uit"}" data-wgi="${esc(g.id)}">
      <div class="wg-r1"><span class="wg-kl"></span><input value="${esc(g.naam)}" data-wgn aria-label="Naam van het gebied"><label class="wg-sw" title="${g.aan?"Staat aan":"Staat uit"}"><input type="checkbox" data-wga ${g.aan?"checked":""}><i></i></label></div>
      <div class="wg-r2"><select data-wgs>${Object.entries(WG_SOORT).map(([k,v])=>`<option value="${k}"${g.soort===k?" selected":""}>${v}</option>`).join("")}</select><small>${g.pts.length} punten</small><button type="button" class="iconbtn sm" data-wgd aria-label="Gebied verwijderen" title="Verwijderen">${I.trash}</button></div></div>`).join("")
      :`<div class="wg-leeg">${I.map||I.pin}<b>Nog geen werkgebieden</b><small>Teken je eerste gebied, bijvoorbeeld Westerkwartier.</small></div>`;
    $o("#wgNieuw").hidden=!!teken}
  function band(){const b=$o("#wgBand");b.hidden=!teken;if(!teken)return;
    b.innerHTML=`<span>${teken.pts.length<3?`Tik ${3-teken.pts.length===1?"nog 1 punt":"nog "+(3-teken.pts.length)+" punten"} op de kaart`:`${teken.pts.length} punten · tik verder of rond af`}</span><button type="button" class="small" data-wgu ${teken.pts.length?"":"disabled"}>Ongedaan</button><button type="button" class="small" data-wgc>Stop</button><button type="button" class="small primary" data-wgk ${teken.pts.length<3?"disabled":""}>Klaar</button>`}
  function teken_(){if(!map)return;laag.clearLayers();const Lf=window.L;
    G.forEach(g=>{if(g.pts.length<3)return;const s=g.id===sel&&!teken;
      const p=Lf.polygon(g.pts,{color:g.aan?"#137a8a":"#8a979d",weight:s?3:2,opacity:g.aan?.95:.6,fillColor:g.aan?"#1fa3b5":"#9aa7ad",fillOpacity:s?.28:.16,dashArray:g.aan?null:"6 6",bubblingMouseEvents:false}).addTo(laag);
      p.on("click",e=>{if(teken){teken.pts.push([e.latlng.lat,e.latlng.lng]);band();teken_();return}if(g.id===sel){voegIn(g,e.latlng);gewijzigd=true;teken_();lijst();return}sel=g.id;lijst();teken_()});
      if(!s)p.bindTooltip(esc(g.naam),{sticky:true,direction:"top"});
      if(s)g.pts.forEach((pt,i)=>{const m=Lf.marker(pt,{draggable:true,icon:Lf.divIcon({className:"wg-pt",iconSize:[16,16],iconAnchor:[8,8]})}).addTo(laag);
        m.on("drag",e=>{const ll=e.target.getLatLng();g.pts[i]=[ll.lat,ll.lng];p.setLatLngs(g.pts)});m.on("dragend",()=>{gewijzigd=true;teken_()});
        m.on("click",e=>{Lf.DomEvent.stopPropagation(e);if(g.pts.length<=3){toast("Een gebied heeft minstens 3 punten");return}g.pts.splice(i,1);gewijzigd=true;teken_();lijst()})})});
    if(teken&&teken.pts.length){Lf.polyline(teken.pts.length>=3?[...teken.pts,teken.pts[0]]:teken.pts,{color:"#137a8a",weight:2.5,dashArray:"6 6",interactive:false}).addTo(laag);
      if(teken.pts.length>=3)Lf.polygon(teken.pts,{stroke:false,fillColor:"#1fa3b5",fillOpacity:.2,interactive:false}).addTo(laag);
      teken.pts.forEach((pt,i)=>Lf.marker(pt,{icon:Lf.divIcon({className:"wg-pt"+(i===0?" eerste":""),iconSize:[16,16],iconAnchor:[8,8]})}).on("click",e=>{Lf.DomEvent.stopPropagation(e);if(i===0&&teken.pts.length>=3)klaar()}).addTo(laag))}}
  function klaar(){if(!teken||teken.pts.length<3)return;const g={id:newId("wg"),naam:teken.naam,soort:"beide",aan:true,pts:teken.pts};G.push(g);sel=g.id;teken=null;gewijzigd=true;band();lijst();teken_();
    setTimeout(()=>{const i=o.querySelector(`[data-wgi="${g.id}"] [data-wgn]`);if(i){i.focus();i.select()}},50)}
  /* invoegen op de dichtstbijzijnde rand */
  function voegIn(g,ll){let best=0,bd=Infinity;const P=g.pts.map(p=>map.latLngToLayerPoint(p)),q=map.latLngToLayerPoint(ll);
    for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/((dx*dx+dy*dy)||1))),d=Math.hypot(a.x+t*dx-q.x,a.y+t*dy-q.y);if(d<bd){bd=d;best=i}}
    g.pts.splice(best+1,0,[ll.lat,ll.lng])}
  let kpAan=wgKlantPcAan();const KP=wgKlantPc();
  const kp=()=>{$o("#wgKp").innerHTML=`<div class="wg-r1"><span class="wg-kpi">${I.users||I.user||I.pin}</span><div class="wg-kpt"><b>Postcodes uit je CRM</b><small>${KP.length?plural(KP.length,"postcode","postcodes")+" van je klanten tellen automatisch mee":"Nog geen klanten met een postcode"}</small></div><label class="wg-sw" title="${kpAan?"Telt mee":"Telt niet mee"}"><input type="checkbox" id="wgKpA" ${kpAan?"checked":""} ${KP.length?"":"disabled"}><i></i></label></div>${KP.length?`<div class="wg-chips${kpAan?"":" uit"}">${KP.slice(0,40).map(p=>`<span>${p}</span>`).join("")}${KP.length>40?`<span>+${KP.length-40}</span>`:""}</div>`:""}`;
    const t=$o("#wgKpA");if(t)t.onchange=()=>{kpAan=t.checked;gewijzigd=true;kp()}};
  kp();lijst();
  $o("#wgNieuw").onclick=()=>{teken={naam:"Gebied "+(G.length+1),pts:[]};sel=null;band();lijst();teken_()};
  $o("#wgBand").addEventListener("click",e=>{if(e.target.closest("[data-wgu]")){teken.pts.pop();band();teken_()}else if(e.target.closest("[data-wgc]")){teken=null;sel=G.length?G[G.length-1].id:null;band();lijst();teken_()}else if(e.target.closest("[data-wgk]"))klaar()});
  $o("#wgLijst").addEventListener("click",e=>{const it=e.target.closest("[data-wgi]");if(!it||teken)return;const g=G.find(x=>x.id===it.dataset.wgi);if(!g)return;
    if(e.target.closest("[data-wgd]")){vraag("Gebied verwijderen?",`<b>${esc(g.naam)}</b> wordt verwijderd.`,"Verwijderen").then(ja=>{if(!ja)return;G=G.filter(x=>x!==g);if(sel===g.id)sel=G.length?G[0].id:null;gewijzigd=true;lijst();teken_()});return}
    if(e.target.closest("input,select,label"))return;
    sel=g.id;lijst();teken_();try{map.fitBounds(window.L.polygon(g.pts).getBounds(),{padding:[40,40],maxZoom:13})}catch(_){}});
  $o("#wgLijst").addEventListener("input",e=>{const it=e.target.closest("[data-wgi]");const g=it&&G.find(x=>x.id===it.dataset.wgi);if(!g)return;gewijzigd=true;
    if(e.target.matches("[data-wgn]"))g.naam=e.target.value;
    if(e.target.matches("[data-wgs]"))g.soort=e.target.value;
    if(e.target.matches("[data-wga]")){g.aan=e.target.checked;it.classList.toggle("uit",!g.aan);teken_()}});
  /* adres testen */
  const test=async()=>{const q=$o("#wgQ").value.trim(),r=$o("#wgTr");if(!q)return;r.innerHTML=`<span class="subt">Zoeken…</span>`;
    try{const j=await (await fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&fl=centroide_ll,weergavenaam&q="+encodeURIComponent(q))).json(),d=((j.response||{}).docs||[])[0],m=d&&/POINT\(([-\d.]+) ([-\d.]+)\)/.exec(d.centroide_ll||"");
      if(!m){r.innerHTML=`<span class="subt">Adres niet gevonden.</span>`;return}const lat=+m[2],lng=+m[1],act=G.filter(g=>g.aan&&g.pts.length>=3),bin=act.filter(g=>wgInPoly(lat,lng,g.pts));
      const pc4=((d.weergavenaam||"").match(/\b(\d{4})\s?[A-Z]{2}\b/)||[])[1]||"",viaKp=kpAan&&KP.includes(pc4),lijst=String(S().webPostcodes||"").trim();
      r.innerHTML=!act.length&&!(kpAan&&KP.length)&&!lijst?`<span class="wg-ok">${I.check}Niets ingesteld: overal welkom</span>`:viaKp&&!bin.length?`<span class="wg-ok">${I.check}${esc(d.weergavenaam)}<br>Binnen: postcode ${pc4} staat al in je CRM</span>`:bin.length?`<span class="wg-ok">${I.check}${esc(d.weergavenaam)}<br>Binnen ${bin.map(g=>esc(g.naam)).join(", ")}${bin.every(g=>g.soort!=="beide")?" ("+bin.map(g=>WG_SOORT[g.soort].toLowerCase()).join(", ")+")":""}</span>`:`<span class="wg-no">${I.x}${esc(d.weergavenaam)}<br>Buiten je werkgebied${lijst?" (behalve als de postcode in je postcodelijst staat)":""}</span>`;
      if(map){if(laag._test)map.removeLayer(laag._test);laag._test=window.L.circleMarker([lat,lng],{radius:8,color:"#fff",weight:3,fillColor:bin.length||viaKp||(!act.length&&!(kpAan&&KP.length))?"#22a46c":"#d64545",fillOpacity:1}).addTo(map);map.setView([lat,lng],Math.max(map.getZoom(),11))}}
    catch(_){r.innerHTML=`<span class="subt">Zoeken lukt nu niet.</span>`}};
  $o("#wgT").onclick=test;$o("#wgQ").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();test()}});
  $o("#wgOk").onclick=async()=>{if(teken&&teken.pts.length>=3)klaar();const b=$o("#wgOk");b.disabled=true;
    const L=G.filter(g=>g.pts.length>=3).map(g=>({id:g.id,naam:(g.naam||"").trim()||"Gebied",soort:g.soort,aan:g.aan,pts:g.pts.map(p=>[Math.round(p[0]*1e6)/1e6,Math.round(p[1]*1e6)/1e6])}));
    if(await saveSettings({webGebieden:L,webKlantPc:kpAan},L.length?plural(L.length,"werkgebied","werkgebieden")+" opgeslagen":"Werkgebieden verwijderd")){gewijzigd=false;sluit(false);if(onKlaar)onKlaar()}else b.disabled=false};
  /* kaart */
  try{await pkLaadLeaflet()}catch(e){$o("#wgMap").innerHTML=`<p class="subt" style="padding:40px;text-align:center">De kaart kon niet laden. Controleer je internetverbinding.</p>`;return}
  const Lf=window.L;map=Lf.map($o("#wgMap"),{zoomControl:true,attributionControl:true,doubleClickZoom:false}).setView([53.2,6.35],10);
  Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap-bijdragers"}).addTo(map);laag=Lf.layerGroup().addTo(map);
  map.on("click",e=>{if(teken){teken.pts.push([e.latlng.lat,e.latlng.lng]);band();teken_();return}const g=huidig();if(g&&g.pts.length>=3){voegIn(g,e.latlng);gewijzigd=true;teken_();lijst()}});
  const alle=G.flatMap(g=>g.pts);if(alle.length)map.fitBounds(alle,{padding:[30,30]});
  else{const kl=state.klanten.map(k=>k.lat&&k.lng?[+k.lat,+k.lng]:null).filter(Boolean);if(kl.length>1)map.fitBounds(kl,{padding:[40,40],maxZoom:12})}
  setTimeout(()=>map.invalidateSize(),120);teken_()}

/* kaartje in Instellingen › Website-calculator */
function wgKaartje(){const A=S().webGebieden||[],aan=A.filter(g=>g.aan!==false),kp=wgKlantPcAan()?wgKlantPc():[];
  const delen=[kp.length?plural(kp.length,"postcode","postcodes")+" uit je CRM":"",aan.length?plural(aan.length,"getekend gebied","getekende gebieden")+" ("+aan.map(g=>esc(g.naam)).join(", ")+")":""].filter(Boolean);
  return `<span class="objic">${I.map||I.pin}</span><div><b>Werkgebied</b><small>${delen.length?delen.join(" + ")+". Alleen adressen hierbinnen kunnen op je website een prijs berekenen en aanvragen.":"Nog niets ingesteld: iedereen kan een prijs berekenen. De postcodes van je klanten tellen automatisch mee zodra ze in je CRM staan."}</small></div><button type="button" class="${A.length?"":"primary"}" data-wgopen>${A.length?"Bewerken":"Op de kaart tekenen"}</button>`}
