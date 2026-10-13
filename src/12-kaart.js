/* ---------- Kaartplannen ----------
   Een kaart boven de planning: waar wonen de klanten die ingepland moeten worden, en waar werk je al.
   Tik op een oranje speld om hem te selecteren; de selectie staat dan rechts bij Te plannen en sleep je zo in de planning.
   Coördinaten komen van de openbare adresservice van PDOK en worden op dit apparaat bewaard. */
const PK={map:null,el:null,laag:null,geo:null,busy:false,fail:new Set(),sig:"",fit:false,laadt:null,data:null,mk:{},fout:""};
state.pkaart=(()=>{try{return localStorage.getItem("ms.pk")==="1"}catch(e){return false}})();
state.ksel=state.ksel||new Set();
function pkGeoCache(){if(!PK.geo){try{PK.geo=JSON.parse(localStorage.getItem("ms.geo")||"{}")||{}}catch(e){PK.geo={}}}return PK.geo}
const pkAdr=k=>{const a=jobAddrObj(k);return{adres:String(a.adres||"").trim(),pc:String(a.postcode||"").replace(/\s+/g,"").toUpperCase(),plaats:String(a.plaats||"").trim()}};
const pkKey=k=>{const a=pkAdr(k);return (a.adres+"|"+a.pc+"|"+a.plaats).toLowerCase().replace(/\s+/g," ")};
const pkHeeftAdres=k=>{const a=pkAdr(k);return !!(a.adres&&(a.pc||a.plaats))};
function pkCoord(k){const c=pkGeoCache()[pkKey(k)];return Array.isArray(c)?c:null}
function pkOpen(list){const G=pkGeoCache();return list.filter(k=>pkHeeftAdres(k)&&!(pkKey(k) in G)&&!PK.fail.has(pkKey(k)))}
async function pkGeocode(list){
  if(PK.busy)return;const need=[...new Map(pkOpen(list).map(k=>[pkKey(k),k])).values()];if(!need.length)return;
  PK.busy=true;PK.totaal=need.length;PK.klaar=0;pkStatus();const G=pkGeoCache();
  const one=async k=>{const key=pkKey(k),a=pkAdr(k);
    try{const r=await fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&fl=centroide_ll,weergavenaam&q="+encodeURIComponent([a.adres,a.pc,a.plaats].filter(Boolean).join(" ")));
      if(!r.ok)throw new Error("pdok");const j=await r.json(),d=((j.response||{}).docs||[])[0],m=d&&/POINT\(([-\d.]+) ([-\d.]+)\)/.exec(d.centroide_ll||"");
      G[key]=m?[+m[2],+m[1]]:0}
    catch(e){PK.fail.add(key)}
    PK.klaar++;if(PK.klaar%6===0){pkStatus();pkTeken()}};
  const q=[...need];while(q.length)await Promise.all(q.splice(0,5).map(one));
  try{localStorage.setItem("ms.geo",JSON.stringify(G))}catch(e){}
  PK.busy=false;if(!PK.zelf)PK.fit=false;PK.sig="";pkStatus();pkTeken();
  if(pkOpen(PK.data?PK.data.alle:[]).length)pkGeocode(PK.data.alle)}

function pkLaadLeaflet(){if(window.L&&window.L.map)return Promise.resolve();if(PK.laadt)return PK.laadt;
  PK.laadt=new Promise((res,rej)=>{const B="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";
    const c=document.createElement("link");c.rel="stylesheet";c.href=B+"leaflet.css";document.head.appendChild(c);
    const s=document.createElement("script");s.src=B+"leaflet.js";
    s.onload=()=>{let i=0;const w=()=>window.L&&window.L.map?res():++i>120?rej(new Error("leaflet")):setTimeout(w,50);w()};
    s.onerror=()=>{PK.laadt=null;s.remove();rej(new Error("leaflet"))};document.head.appendChild(s)});
  return PK.laadt}

/* ---- markup in de planning ---- */
function pkPlanned(days){const out=[];days.forEach((d,di)=>{const it=dayItems(d);
  [...it.js,...it.done].sort((a,b)=>(toMin(a.k.tijd)??9999)-(toMin(b.k.tijd)??9999)).forEach((x,i)=>{if(x.k&&x.k.naam!=null)out.push({k:x.k,d,di,n:i+1,klaar:x.st==="afgerond"})})});return out}
function pkSlot(offerAll,days){
  const planned=pkPlanned(state.pview==="maand"?[]:days);
  PK.data={offer:offerAll,planned,days,alle:[...offerAll,...planned.map(p=>p.k)]};
  const sel=[...state.ksel].filter(id=>offerAll.some(k=>k.id===id)).length;
  const WD=["zo","ma","di","wo","do","vr","za"];
  return `<section class="pk">
    <div class="pk-h"><div class="pk-tt"><b>${I.map}Kaartplannen</b><small id="pkStat">${pkStatTxt()}</small></div>
      <div class="pk-leg"><span><i class="pk-d of"></i>Te plannen</span><span><i class="pk-d late"></i>Te laat</span><span><i class="pk-d sel"></i>Geselecteerd</span>${planned.length?`<span><i class="pk-d pl"></i>Ingepland</span>`:""}</div>
      <div class="pk-acts"><button type="button" class="small" data-act="pkinbeeld">${I.checksq||I.check}Selecteer in beeld</button>${sel?`<button type="button" class="small" data-act="pkwis">${I.x}Wis selectie (${sel})</button>`:""}<button type="button" class="iconbtn sm" data-act="pkfit" title="Alles in beeld" aria-label="Alles in beeld">${I.expand||I.search}</button><button type="button" class="iconbtn sm" data-act="pkaart" title="Kaart verbergen" aria-label="Kaart verbergen">${I.x}</button></div></div>
    ${state.pview==="week"||state.pview==="multi"?`<div class="pk-days">${days.map((d,i)=>{const n=planned.filter(p=>p.d===d).length;return n?`<span style="--pkc:${pkDagKleur(i)}"><i></i>${WD[parse(d).getDay()]} ${parse(d).getDate()} · ${n}</span>`:""}).join("")}</div>`:""}
    <div class="pk-slot" id="pkSlot"></div></section>`}
const pkDagKleur=i=>["#1f6f8b","#7a4fd0","#c2410c","#0f8a5f","#b4236b","#2c5bd6","#8a6d12"][i%7];
function pkStatTxt(){if(!PK.data)return"";const o=PK.data.offer,G=pkGeoCache(),op=o.filter(k=>pkCoord(k)).length,zonder=o.filter(k=>!pkHeeftAdres(k)||G[pkKey(k)]===0).length;
  if(PK.fout)return esc(PK.fout);
  if(PK.busy)return `Adressen op de kaart zetten… ${PK.klaar}/${PK.totaal}`;
  return `${plural(op,"adres","adressen")} te plannen op de kaart`+(zonder?` · ${zonder} zonder vindbaar adres`:"")}
function pkStatus(){const s=$("#pkStat");if(s)s.innerHTML=pkStatTxt()}

/* ---- na elke render: de kaart (die blijft bestaan) terug in de pagina hangen ---- */
function pkNaRender(){
  if(state.tab!=="planning"||!state.pkaart)return;const slot=$("#pkSlot");if(!slot)return;
  if(!PK.el){PK.el=document.createElement("div");PK.el.className="pk-map";PK.el.innerHTML=`<div class="pk-laad">${I.map}<span>Kaart laden…</span></div>`}
  slot.appendChild(PK.el);
  pkLaadLeaflet().then(()=>{
    if(!PK.map){PK.el.innerHTML="";const L=window.L;
      PK.map=L.map(PK.el,{zoomControl:false,attributionControl:true,scrollWheelZoom:true,zoomSnap:.5}).setView([53.2,6.3],11);PK.map.attributionControl.setPrefix(false);
      L.control.zoom({position:"bottomright"}).addTo(PK.map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© OpenStreetMap-bijdragers'}).addTo(PK.map);
      PK.laag=L.layerGroup().addTo(PK.map);PK.sig="";
      PK.map.on("dragstart",()=>{PK.zelf=true});PK.el.addEventListener("wheel",()=>{PK.zelf=true},{passive:true})}
    PK.map.invalidateSize();PK.fout="";pkTeken();pkStatus();
    if(PK.data)pkGeocode(PK.data.alle)
  }).catch(()=>{PK.fout="De kaart kon niet worden geladen. Controleer je internetverbinding.";PK.el.innerHTML=`<div class="pk-laad">${I.alert}<span>${esc(PK.fout)}</span><button type="button" class="small" data-act="pkretry">Opnieuw</button></div>`;pkStatus()})}

function pkIcon(cls,inhoud,kleur){return window.L.divIcon({className:"pk-ic",html:`<span class="pk-pin ${cls}"${kleur?` style="--pkc:${kleur}"`:""}><b>${inhoud||""}</b></span>`,iconSize:[28,36],iconAnchor:[14,34],tooltipAnchor:[0,-30]})}
function pkTip(k,extra){const a=jobAddrObj(k);return `<div class="pk-tip"><b>${esc(a.adres||cleanName(k.naam))}</b><span>${esc(cleanName(k.naam))}${a.plaats?" · "+esc(a.plaats):""}</span>${extra?`<em>${extra}</em>`:""}</div>`}
function pkTeken(){if(!PK.map||!PK.data||!window.L)return;const L=window.L,{offer,planned,days}=PK.data,t=today();
  const sig=[state.pview,[...state.ksel].join(","),offer.map(k=>k.id+(pkCoord(k)||"")).join(";"),planned.map(p=>p.k.id+p.d+p.n+(pkCoord(p.k)||"")).join(";")].join("|");
  if(sig===PK.sig)return;PK.sig=sig;PK.laag.clearLayers();PK.mk={};const pts=[];
  const multi=days.length>1;
  planned.forEach(p=>{const c=pkCoord(p.k);if(!c)return;pts.push(c);
    const m=L.marker(c,{icon:pkIcon("pl"+(p.klaar?" klaar":""),multi?["zo","ma","di","wo","do","vr","za"][parse(p.d).getDay()]:p.n,multi?pkDagKleur(p.di):""),zIndexOffset:-200,riseOnHover:true});
    m.bindTooltip(pkTip(p.k,(multi?fmtD(p.d)+" · ":"")+(p.k.tijd?esc(p.k.tijd)+" · ":"")+(p.klaar?"afgerond":"ingepland")),{direction:"top",className:"pk-tt-w",opacity:1});
    m.on("click",()=>{if(!p.klaar)openJob(p.k.id,p.d)});m.addTo(PK.laag)});
  offer.forEach(k=>{const c=pkCoord(k);if(!c)return;pts.push(c);
    const gp=parse(k.gepland),late=(gp&&gp<t)||dueOf(k)<t,sel=state.ksel.has(k.id);
    const m=L.marker(c,{icon:pkIcon((sel?"sel":late?"late":"of")),zIndexOffset:sel?600:late?300:0,riseOnHover:true});
    m.bindTooltip(pkTip(k,esc(dueTxt(k))+" · "+duur(k)+" min"+(sel?" · <b>geselecteerd</b>":"")),{direction:"top",className:"pk-tt-w",opacity:1});
    m.on("click",()=>{state.ksel.has(k.id)?state.ksel.delete(k.id):state.ksel.add(k.id);render()});
    m.addTo(PK.laag);PK.mk[k.id]=m});
  if(!PK.fit&&pts.length){PK.fit=true;pkFit(pts)}}
function pkFit(pts){if(!PK.map)return;pts=pts||PK.laag.getLayers().map(m=>m.getLatLng());if(!pts.length)return;PK.map.fitBounds(window.L.latLngBounds(pts),{padding:[36,36],maxZoom:15})}
function pkInBeeld(){if(!PK.map||!PK.data)return;const b=PK.map.getBounds();let n=0;PK.data.offer.forEach(k=>{const c=pkCoord(k);if(c&&b.contains(c)&&!state.ksel.has(k.id)){state.ksel.add(k.id);n++}});
  toast(n?plural(n,"adres","adressen")+" geselecteerd":"Geen nieuwe adressen in beeld");render()}
/* kaart oplichten als je over een kaartje bij Te plannen beweegt */
document.addEventListener("mouseover",e=>{if(!PK.map)return;const c=e.target.closest&&e.target.closest(".offercol [data-drag]"),id=c&&c.dataset.drag;
  if(id===PK.hl)return;if(PK.hl&&PK.mk[PK.hl]){const el=PK.mk[PK.hl].getElement();if(el)el.classList.remove("pk-hl")}PK.hl=id||"";
  if(id&&PK.mk[id]){const el=PK.mk[id].getElement();if(el)el.classList.add("pk-hl")}});
