/* ---------- Kilometerregistratie ----------
   Zo weinig mogelijk werk voor de glazenwasser: bij Start werkdag tik je de auto aan en bevestig je de
   kilometerstand (staat al ingevuld met de laatste stand). Bij Terug bij de loods staat de eindstand al
   geschat via GPS en de route (loods, klanten van vandaag, loods) wordt vanzelf ingevuld.
   Losse ritten (privé of tussendoor) voeg je toe in het rittenoverzicht. Export als CSV of afdrukken
   voor de Belastingdienst. Ritten staan per dag in routes/<datum>.ritten. */
I.auto=I.auto||'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16.5V12l1.8-4.6A2 2 0 0 1 8.7 6h6.6a2 2 0 0 1 1.9 1.4L19 12v4.5"/><path d="M3.5 12h17v4.5h-17z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/></svg>';
const KM_TYPE=[["zakelijk","Zakelijk"],["prive","Privé"],["beide","Beide"]];
const kmN=n=>Number.isFinite(+n)&&n!==""&&n!=null?Math.round(+n).toLocaleString("nl-NL"):"–";
const kmFmt=v=>{const s=String(v||"").toUpperCase().replace(/[^A-Z0-9-]/g,"");if(s.includes("-"))return s;const g=s.match(/[A-Z]+|[0-9]+/g)||[];
  if(g.length===2){const[a,b]=g;if(a.length===4)return a.slice(0,2)+"-"+a.slice(2)+"-"+b;if(b.length===4)return a+"-"+b.slice(0,2)+"-"+b.slice(2)}return g.join("-")};
const kmPlaat=(k,cls="")=>`<span class="kmplaat ${cls}"><i>NL</i><b>${esc(kmFmt(k))}</b></span>`;
const kmAutos=()=>(S().voertuigen||[]).filter(v=>v&&v.kenteken);
const kmAan=()=>S().kmAan!==false&&kmAutos().length>0;
const kmMij=()=>(state.me&&state.me.email)||"";
const kmVan=()=>{const s=S();return s.startadres||[s.adres,s.plaats].filter(Boolean).join(", ")||"Loods"};
function kmRitten(){const o=[];Object.keys(state.routes||{}).forEach(d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;(state.routes[d].ritten||[]).forEach(r=>o.push({...r,datum:d}))});
  return o.sort((a,b)=>(a.datum+String(a.startTs||"")+String(a.nr||0)).localeCompare(b.datum+String(b.startTs||"")+String(b.nr||0)))}
const kmAfst=r=>r.eind!==""&&r.eind!=null&&r.begin!==""&&r.begin!=null?Math.max(0,+r.eind-+r.begin):null;
function kmLaatste(auto){let m=null;kmRitten().forEach(r=>{if(r.auto!==auto)return;[r.begin,r.eind].forEach(v=>{if(v!==""&&v!=null&&Number.isFinite(+v)&&(m==null||+v>m))m=+v})});
  const v=kmAutos().find(x=>x.kenteken===auto);if(v&&v.stand&&(m==null||+v.stand>m))m=+v.stand;return m}
const kmVolgNr=(auto,d)=>kmRitten().filter(r=>r.auto===auto&&r.datum.slice(0,4)===d.slice(0,4)).length+1;
const kmOpen=()=>{const d=iso(today());return(((state.routes[d]||{}).ritten)||[]).find(r=>!r.stopTs&&r.bron==="werkdag"&&(!r.door||r.door===kmMij()))};
async function kmZet(d,ritten){const r=state.routes[d]||{};state.routes[d]={...r,ritten};schedule();await save("routes",d,{...strip(r),ritten})}
async function kmBewaar(d,rit){const l=[...(((state.routes[d]||{}).ritten)||[])],i=l.findIndex(x=>x.id===rit.id),c={...rit};delete c.datum;if(i>=0)l[i]=c;else l.push(c);await kmZet(d,l)}
async function kmWeg(d,id){await kmZet(d,(((state.routes[d]||{}).ritten)||[]).filter(x=>x.id!==id))}
/* route van de dag: de stops die deze medewerker tijdens de rit heeft afgemeld, in volgorde */
function kmRoute(rit,d){const van=rit.startTs?new Date(rit.startTs).getTime()-6e4:0,naam=doorNaam();
  return state.beurten.filter(b=>b.datum===d&&(!b.door||!naam||b.door===naam)&&(!b.op||new Date(b.op).getTime()>=van)).sort((a,b)=>String(a.op||"").localeCompare(String(b.op||"")))
    .map(b=>{const k=state.klanten.find(x=>x.id===b.klantId),a=k?jobAddrObj(k):null;return a&&a.adres?[a.adres,a.plaats].filter(Boolean).join(" "):cleanName(b.klantNaam||"")}).filter(Boolean)}
/* GPS: afstand optellen terwijl live delen loopt (aangeroepen vanuit 29-zlivegps) */
function kmTik(a,b,nauw){try{const r=kmOpen();if(!r||!a||!b||(nauw&&nauw>60))return;const m=lvAfst(a,b);if(m<15||m>5000)return;const k="ms.kmgps."+r.id;localStorage.setItem(k,String((Number(localStorage.getItem(k))||0)+m))}catch(e){}}
const kmGps=id=>{try{return(Number(localStorage.getItem("ms.kmgps."+id))||0)/1000}catch(e){return 0}};

/* ---------- sheet (eigen venster, bovenste laag) ---------- */
function kmSheet(html,bind){return new Promise(res=>{const d=document.createElement("dialog");d.className="vraag-dlg";const o=document.createElement("div");o.className="vraag-ov";d.appendChild(o);
  const weg=v=>{try{d.close()}catch(_){}d.remove();res(v)};d.addEventListener("cancel",e=>{e.preventDefault();weg(null)});o.innerHTML=`<div class="km-sh" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(d);d.showModal();bind(o,weg)})}
function kmPlaten(sel){const a=kmAutos();return a.length>1?`<div class="km-pl">${a.map(v=>`<button type="button" class="km-pb${v.kenteken===sel?" on":""}" data-kmauto="${esc(v.kenteken)}">${kmPlaat(v.kenteken)}${v.naam?`<small>${esc(v.naam)}</small>`:""}</button>`).join("")}</div>`:`<div class="km-pl een">${kmPlaat(a[0].kenteken,"groot")}${a[0].naam?`<small>${esc(a[0].naam)}</small>`:""}</div>`}
async function kmVertrek(){const a=kmAutos();let auto=(()=>{try{const v=localStorage.getItem("ms.kmauto");return a.some(x=>x.kenteken===v)?v:a[0].kenteken}catch(e){return a[0].kenteken}})();
  return kmSheet("",(o,weg)=>{const teken=()=>{const l=kmLaatste(auto);o.firstChild.innerHTML=`<div class="km-k"><span class="km-ic">${I.auto}</span><div><small>Kilometerregistratie</small><b>Vertrek</b></div></div>
    ${kmPlaten(auto)}
    <label class="km-in"><span>Kilometerstand bij vertrek</span><input type="number" inputmode="numeric" min="0" step="1" data-kmbegin value="${l!=null?l:""}" placeholder="Bijv. 40715"><em>${l!=null?"Laatste bekende stand, klopt hij niet? Pas hem aan.":"Kijk één keer op je teller. Daarna onthouden we de stand."}</em></label>
    <div class="km-f"><button type="button" class="ghost" data-kmskip>Zonder km</button><button type="button" class="primary" data-kmok>${I.check}Vertrekken</button></div>`;
    o.querySelectorAll("[data-kmauto]").forEach(b=>b.onclick=()=>{auto=b.dataset.kmauto;teken()});
    o.querySelector("[data-kmskip]").onclick=()=>weg({skip:true});
    o.querySelector("[data-kmok]").onclick=()=>{const v=o.querySelector("[data-kmbegin]").value;if(v===""){o.querySelector("[data-kmbegin]").focus();toast("Vul de kilometerstand in");return}try{localStorage.setItem("ms.kmauto",auto)}catch(e){}weg({auto,begin:Math.round(+v)})}};teken()})}
async function kmTerug(rit,d){const gps=kmGps(rit.id),route=kmRoute(rit,d),gis=gps>=1?Math.round(+rit.begin+gps):"";let type=rit.type||"zakelijk";
  return kmSheet("",(o,weg)=>{const teken=()=>{o.firstChild.innerHTML=`<div class="km-k"><span class="km-ic">${I.auto}</span><div><small>Kilometerregistratie</small><b>Terug bij de loods</b></div>${kmPlaat(rit.auto)}</div>
    <div class="km-2"><div><small>Vertrek</small><b>${kmN(rit.begin)}</b></div><label class="km-in"><span>Stand nu</span><input type="number" inputmode="numeric" min="${esc(rit.begin)}" step="1" data-kmeind value="${gis}" placeholder="Stand op je teller"></label></div>
    <em class="km-n">${gps>=1?`Geschat via GPS: ${kmN(gps)} km. Controleer je teller.`:"Vul de stand van je teller in."}</em>
    <div class="km-r"><small>Route</small><p>${esc(kmVan())} ${route.length?`→ ${route.slice(0,3).map(esc).join(" → ")}${route.length>3?` → <b>+${route.length-3}</b>`:""} `:""}→ ${esc(kmVan())}</p></div>
    <div class="km-seg">${KM_TYPE.map(([v,l])=>`<button type="button" data-kmtype="${v}" aria-pressed="${type===v}">${l}</button>`).join("")}</div>
    <div class="km-f"><button type="button" class="ghost" data-kmlater>Later invullen</button><button type="button" class="primary" data-kmok>${I.check}Opslaan</button></div>`;
    o.querySelectorAll("[data-kmtype]").forEach(b=>b.onclick=()=>{const v=o.querySelector("[data-kmeind]").value;type=b.dataset.kmtype;teken();o.querySelector("[data-kmeind]").value=v});
    o.querySelector("[data-kmlater]").onclick=()=>weg({later:true});
    o.querySelector("[data-kmok]").onclick=()=>{const v=o.querySelector("[data-kmeind]").value;if(v===""||+v<+rit.begin){toast(v===""?"Vul de kilometerstand in":"De eindstand is lager dan de beginstand");o.querySelector("[data-kmeind]").focus();return}weg({eind:Math.round(+v),type,route})}};teken()})}
/* knoppen van de werkdag onderscheppen (window-capture loopt vóór de document-capture van 29-werkdag) */
function kmDoor(act){const b=document.createElement("button");b.type="button";b.dataset.act=act;b.dataset.kmok="1";b.hidden=true;document.body.appendChild(b);b.click();b.remove()}
window.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-act='wdstart'],[data-act='wdstop']");if(!b||b.dataset.kmok)return;
  const a=b.dataset.act,d=iso(today());
  if(a==="wdstart"){if(!kmAan())return;e.preventDefault();e.stopPropagation();
    /* live delen al bij deze tik starten: na de kilometerstand is het geen tik meer en vraagt de telefoon niet om je locatie */
    const lv=typeof liveStart==="function"&&typeof LV!=="undefined"&&LV.watch==null;if(lv){state.liveDelen=true;try{localStorage.setItem("ms.live","1")}catch(_){}liveStart(true)}
    const r=await kmVertrek();if(!r){if(lv){state.liveDelen=false;try{localStorage.setItem("ms.live","0")}catch(_){}liveStop(true)}return}
    if(!r.skip){try{await kmBewaar(d,{id:newId("rit"),nr:kmVolgNr(r.auto,d),auto:r.auto,begin:r.begin,eind:"",startTs:new Date().toISOString(),stopTs:"",van:kmVan(),naar:"",route:"",type:"zakelijk",door:kmMij(),bron:"werkdag"})}catch(er){err(er)}}
    kmDoor("wdstart")}
  else{const rit=kmOpen();if(!rit)return;e.preventDefault();e.stopPropagation();const r=await kmTerug(rit,d);if(!r)return;
    if(!r.later){try{await kmBewaar(d,{...rit,eind:r.eind,type:r.type,stopTs:new Date().toISOString(),naar:kmVan(),route:r.route.join(" – ")});try{localStorage.removeItem("ms.kmgps."+rit.id)}catch(_){}toast(`Rit opgeslagen · ${kmN(r.eind-rit.begin)} km`)}catch(er){err(er)}}
    kmDoor("wdstop")}},true);

/* ---------- rittenoverzicht ---------- */
const KMV={jaar:"",auto:""};
function kmLijst(){const alle=kmRitten(),jaren=[...new Set([String(today().getFullYear()),...alle.map(r=>r.datum.slice(0,4))])].sort().reverse();
  if(!KMV.jaar||!jaren.includes(KMV.jaar))KMV.jaar=jaren[0];const autos=kmAutos().map(v=>v.kenteken);[...new Set(alle.map(r=>r.auto))].forEach(k=>{if(k&&!autos.includes(k))autos.push(k)});
  if(KMV.auto&&!autos.includes(KMV.auto))KMV.auto="";
  const l=alle.filter(r=>r.datum.slice(0,4)===KMV.jaar&&(!KMV.auto||r.auto===KMV.auto)),som=t=>l.filter(r=>!t||r.type===t).reduce((a,r)=>a+(kmAfst(r)||0),0);
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:#252c3c">${I.auto}</span><div style="flex:1;min-width:0"><h3>Kilometerregistratie</h3><div class="subt">Rittenoverzicht voor de Belastingdienst</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="setbody km-lijst">
    <div class="km-fl"><select data-kmjaar>${jaren.map(j=>`<option ${j===KMV.jaar?"selected":""}>${j}</option>`).join("")}</select>${autos.length>1?`<div class="km-seg sm"><button type="button" data-kmf="" aria-pressed="${!KMV.auto}">Alle</button>${autos.map(k=>`<button type="button" data-kmf="${esc(k)}" aria-pressed="${KMV.auto===k}">${esc(kmFmt(k))}</button>`).join("")}</div>`:""}</div>
    <div class="km-tot"><div><small>Ritten</small><b>${l.length}</b></div><div><small>Totaal</small><b>${kmN(som())} km</b></div><div><small>Zakelijk</small><b>${kmN(som("zakelijk"))} km</b></div><div><small>Privé</small><b>${kmN(som("prive"))} km</b></div></div>
    ${l.length?`<div class="km-rl">${l.slice().reverse().map(r=>{const k=kmAfst(r);return `<button type="button" class="km-ri" data-kmedit="${esc(r.id)}" data-d="${esc(r.datum)}">
      <span class="km-d"><b>${esc(fmtD(r.datum))}</b><small>Rit ${esc(r.nr||"")}</small></span>
      <span class="km-m"><span class="km-mt">${kmPlaat(r.auto,"mini")}<em class="km-t km-t-${esc(r.type||"zakelijk")}">${esc((KM_TYPE.find(x=>x[0]===r.type)||KM_TYPE[0])[1])}</em></span><small>${esc(r.van||"")}${r.route?" → "+esc(String(r.route).split(" – ").length>1?String(r.route).split(" – ").length+" adressen":r.route):""}${r.naar?" → "+esc(r.naar):""}</small></span>
      <span class="km-s">${k!=null?`<b>${kmN(k)} km</b><small>${kmN(r.begin)} – ${kmN(r.eind)}</small>`:`<span class="pill late">Nog invullen</span>`}</span></button>`}).join("")}</div>`
    :`<div class="km-leeg">${I.auto}<b>Nog geen ritten in ${esc(KMV.jaar)}</b><small>${kmAutos().length?"Druk op Vandaag op Start werkdag; dan vraagt Mansard de kilometerstand.":"Voeg eerst je auto toe bij Instellingen › Kilometerregistratie."}</small></div>`}
  </div>
  <div class="row stickyfoot"><button type="button" class="ghost" data-kmcsv ${l.length?"":"disabled"}>${I.download||I.send}CSV</button><button type="button" class="ghost" data-kmprint ${l.length?"":"disabled"}>Afdrukken</button><span class="sp"></span><button type="button" class="primary" data-kmnieuw ${kmAutos().length?"":"disabled"}>${I.plus||"+"}Rit toevoegen</button></div>`,{wide:true});
  form.querySelector("[data-kmjaar]").onchange=e=>{KMV.jaar=e.target.value;kmLijst()};
  form.querySelectorAll("[data-kmf]").forEach(b=>b.onclick=()=>{KMV.auto=b.dataset.kmf;kmLijst()});
  form.querySelectorAll("[data-kmedit]").forEach(b=>b.onclick=()=>{const r=kmRitten().find(x=>x.id===b.dataset.kmedit);if(r)kmBewerk(r)});
  const n=form.querySelector("[data-kmnieuw]");if(n)n.onclick=()=>{const d=iso(today()),a=KMV.auto||kmAutos()[0].kenteken,lt=kmLaatste(a);kmBewerk({id:"",datum:d,auto:a,begin:lt!=null?lt:"",eind:"",van:kmVan(),naar:"",route:"",type:"prive",bron:"los"})};
  form.querySelector("[data-kmcsv]").onclick=()=>kmCsv(l);form.querySelector("[data-kmprint]").onclick=()=>kmPrint(l)}
function kmBewerk(r){const nieuw=!r.id,autos=[...new Set([...kmAutos().map(v=>v.kenteken),r.auto].filter(Boolean))];let type=r.type||"zakelijk";
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:#252c3c">${I.auto}</span><div style="flex:1;min-width:0"><h3>${nieuw?"Rit toevoegen":"Rit "+esc(r.nr||"")}</h3><div class="subt">${nieuw?"Bijvoorbeeld een privérit of een rit tussendoor":esc(fmtL(r.datum))}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="setbody">
    ${autos.length>1?`<div class="km-pl">${autos.map(k=>`<button type="button" class="km-pb${k===r.auto?" on":""}" data-kmauto="${esc(k)}">${kmPlaat(k)}</button>`).join("")}</div>`:`<div class="km-pl een">${kmPlaat(r.auto,"groot")}</div>`}
    <div class="grid2"><label>Datum<input type="date" id="kmD" value="${esc(r.datum)}"></label><label>Ritnummer<input type="number" id="kmNr" min="1" value="${esc(r.nr||kmVolgNr(r.auto,r.datum))}"></label></div>
    <div class="grid2"><label>Kilometerstand vertrek<input type="number" inputmode="numeric" id="kmB" value="${esc(r.begin??"")}"></label><label>Kilometerstand aankomst<input type="number" inputmode="numeric" id="kmE" value="${esc(r.eind??"")}"></label></div>
    <div class="grid2"><label>Adres vertrek<input id="kmVan" value="${esc(r.van||"")}"></label><label>Adres aankomst<input id="kmNaar" value="${esc(r.naar||"")}"></label></div>
    <label>Gereden route (indien afwijkend)<textarea id="kmRoute" rows="2">${esc(r.route||"")}</textarea></label>
    <label>Wat voor rit is dit?</label><div class="km-seg">${KM_TYPE.map(([v,l])=>`<button type="button" data-kmtype="${v}" aria-pressed="${type===v}">${l}</button>`).join("")}</div>
  </div>
  <div class="row stickyfoot">${nieuw?`<button type="button" class="ghost" data-kmterug>Terug</button>`:`<button type="button" class="ghost danger" data-kmdel>${I.trash||I.x}Verwijderen</button>`}<span class="sp"></span><button type="button" class="primary" data-kmsave>${I.check}Opslaan</button></div>`,{wide:true});
  let auto=r.auto;form.querySelectorAll("[data-kmauto]").forEach(b=>b.onclick=()=>{auto=b.dataset.kmauto;form.querySelectorAll("[data-kmauto]").forEach(x=>x.classList.toggle("on",x===b));if(nieuw){const lt=kmLaatste(auto);form.querySelector("#kmB").value=lt!=null?lt:"";form.querySelector("#kmNr").value=kmVolgNr(auto,form.querySelector("#kmD").value||r.datum)}});
  form.querySelectorAll("[data-kmtype]").forEach(b=>b.onclick=()=>{type=b.dataset.kmtype;form.querySelectorAll("[data-kmtype]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
  const t=form.querySelector("[data-kmterug]");if(t)t.onclick=kmLijst;
  const dl=form.querySelector("[data-kmdel]");if(dl){let armed=false;dl.onclick=async()=>{if(!armed){armed=true;dl.innerHTML="Zeker weten? Tik nogmaals";return}try{await kmWeg(r.datum,r.id);toast("Rit verwijderd");kmLijst()}catch(e){err(e)}}}
  form.querySelector("[data-kmsave]").onclick=async()=>{const g=id=>form.querySelector(id).value.trim(),d=g("#kmD"),b=g("#kmB"),e=g("#kmE");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){toast("Kies een datum");return}if(b===""){toast("Vul de beginstand in");return}if(e!==""&&+e<+b){toast("De eindstand is lager dan de beginstand");return}
    const rit={...r,id:r.id||newId("rit"),nr:Number(g("#kmNr"))||1,auto,begin:Math.round(+b),eind:e===""?"":Math.round(+e),van:g("#kmVan"),naar:g("#kmNaar"),route:g("#kmRoute"),type,door:r.door||kmMij(),bron:r.bron||"los",stopTs:r.stopTs||(e!==""?new Date().toISOString():"")};
    if(r.bron==="werkdag"&&!r.stopTs&&e==="")rit.stopTs="";
    try{if(r.id&&r.datum!==d)await kmWeg(r.datum,r.id);await kmBewaar(d,rit);toast("Rit opgeslagen");kmLijst()}catch(er){err(er)}}}
const kmRij=r=>[r.datum,r.nr||"",kmFmt(r.auto),r.begin??"",r.eind??"",kmAfst(r)??"",r.van||"",r.naar||"",r.route||"",(KM_TYPE.find(x=>x[0]===r.type)||KM_TYPE[0])[1],String(r.door||"").split("@")[0]];
const KM_KOP=["Datum","Ritnummer","Kenteken","Beginstand","Eindstand","Afstand (km)","Adres vertrek","Adres aankomst","Route","Type rit","Bestuurder"];
function kmCsv(l){const q=v=>{const s=String(v??"");return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const csv="﻿"+[KM_KOP,...l.map(kmRij)].map(r=>r.map(q).join(";")).join("\r\n"),a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`kilometerregistratie-${KMV.jaar}${KMV.auto?"-"+kmFmt(KMV.auto):""}.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function kmPrint(l){const s=S(),som=t=>l.filter(r=>!t||r.type===t).reduce((a,r)=>a+(kmAfst(r)||0),0);
  const html=`<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Kilometerregistratie ${esc(KMV.jaar)}</title><style>body{font:11px/1.45 Avenir,"Avenir Next",Helvetica,Arial,sans-serif;color:#252c3c;margin:28px}h1{font-size:15px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;margin:0}p{margin:4px 0 16px;color:#56616a}table{width:100%;border-collapse:collapse}th{background:#252c3c;color:#fff;text-align:left;font-weight:600;padding:6px;font-size:10px;letter-spacing:.06em;text-transform:uppercase}td{padding:5px 6px;border-bottom:1px solid #dfe0e0;vertical-align:top}td.r,th.r{text-align:right}.tot{margin-top:14px;display:flex;gap:24px}.tot b{display:block;font-size:14px}@page{size:A4 landscape;margin:12mm}</style></head><body>
  <h1>Kilometerregistratie ${esc(KMV.jaar)}</h1><p>${esc(s.naam||"")}${KMV.auto?" · "+esc(kmFmt(KMV.auto)):""} · ${l.length} ritten</p>
  <table><thead><tr>${KM_KOP.map((k,i)=>`<th${[3,4,5].includes(i)?' class="r"':""}>${k}</th>`).join("")}</tr></thead><tbody>${l.map(r=>`<tr>${kmRij(r).map((v,i)=>`<td${[3,4,5].includes(i)?' class="r"':""}>${esc(i===0?fmtD(v):[3,4,5].includes(i)&&v!==""?kmN(v):v)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <div class="tot"><div>Totaal<b>${kmN(som())} km</b></div><div>Zakelijk<b>${kmN(som("zakelijk"))} km</b></div><div>Privé<b>${kmN(som("prive"))} km</b></div><div>Beide<b>${kmN(som("beide"))} km</b></div></div>
  <script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`;
  const w=window.open("","_blank");if(w){w.document.write(html);w.document.close()}else toast("Sta pop-ups toe om af te drukken")}

/* ---------- instellingen ---------- */
SETCARDS.push({id:"km",t:"Kilometerregistratie",sub:"Ritten bijhouden, vanzelf bij je werkdag",ic:"auto",bg:"#252c3c",
  st:s=>(s.voertuigen||[]).filter(v=>v&&v.kenteken).length?(s.kmAan===false?["soon","Staat uit"]:["ok","Aan"]):["soon","Nog geen auto"],
  rows:s=>{const j=String(today().getFullYear()),l=kmRitten().filter(r=>r.datum.slice(0,4)===j);return[["Auto's",(s.voertuigen||[]).filter(v=>v&&v.kenteken).map(v=>kmFmt(v.kenteken)).join(", ")||"—"],["Ritten "+j,String(l.length)],["Zakelijk "+j,kmN(l.filter(r=>r.type==="zakelijk").reduce((a,r)=>a+(kmAfst(r)||0),0))+" km"]]},
  extra:`<button type="button" class="tiny ghost" data-act="setedit" data-v="kmlijst">${I.auto}Rittenoverzicht</button>`});
if(typeof QUICK!=="undefined")QUICK.push(["kmlijst","Kilometers","auto"]);
SETEXTRA.kmlijst=()=>kmLijst();
SETEXTRA.km=(c,s)=>{let vt=(s.voertuigen||[]).map(v=>({...v}));
  const rij=(v,i)=>`<div class="km-vr" data-i="${i}">${kmPlaat(v.kenteken||"??-??-??","mini")}<input data-vk placeholder="Kenteken, bijv. V-962-FN" value="${esc(v.kenteken||"")}" autocapitalize="characters"><input data-vn placeholder="Naam (optioneel), bijv. Bus" value="${esc(v.naam||"")}"><button type="button" class="iconbtn sm" data-vdel aria-label="Verwijderen">${I.x}</button></div>`;
  setDlg(c,`${info("Bij <b>Start werkdag</b> tik je je auto aan en bevestig je de kilometerstand; die staat al ingevuld met de laatste stand. Bij <b>Terug bij de loods</b> schat Mansard de eindstand via GPS en vult de route met je klanten van vandaag. Losse en privéritten voeg je toe in het rittenoverzicht.")}
    ${tgl("kmAan","Kilometers vragen bij Start werkdag","Twee tikken per dag: bij vertrek en bij terugkomst",s.kmAan!==false)}
    ${sec("Auto's")}<div id="kmV">${(vt.length?vt:[{kenteken:"",naam:""}]).map(rij).join("")}</div>
    <button type="button" class="small ghost" id="kmPlus" style="justify-self:start">${I.plus||"+"}Auto toevoegen</button>
    ${sec("Vertrekadres")}${inp("startadres","Adres van de loods",s.startadres||"",{ph:[s.adres,s.plaats].filter(Boolean).join(", ")||"Straat 1, Plaats",help:"Begin- en eindpunt van je ritten. Leeg = je bedrijfsadres."})}`,{wide:false});
  const box=form.querySelector("#kmV"),lees=()=>[...box.querySelectorAll(".km-vr")].map(r=>({kenteken:kmFmt(r.querySelector("[data-vk]").value),naam:r.querySelector("[data-vn]").value.trim()}));
  const bind=()=>{box.querySelectorAll(".km-vr").forEach(r=>{const k=r.querySelector("[data-vk]");k.oninput=()=>{r.querySelector(".kmplaat b").textContent=kmFmt(k.value)||"??-??-??"};k.onblur=()=>{k.value=kmFmt(k.value)};r.querySelector("[data-vdel]").onclick=()=>{r.remove();if(!box.children.length){box.insertAdjacentHTML("beforeend",rij({},0));bind()}}})};bind();
  form.querySelector("#kmPlus").onclick=()=>{box.insertAdjacentHTML("beforeend",rij({},box.children.length));bind();box.lastElementChild.querySelector("[data-vk]").focus()};
  bindSave(()=>({voertuigen:lees().filter(v=>v.kenteken).map(v=>{const o=vt.find(x=>kmFmt(x.kenteken)===v.kenteken);return{...(o||{}),...v}})}))};

/* ---------- stijl ---------- */
document.head.insertAdjacentHTML("beforeend",`<style id="kmStijl">
.kmplaat{display:inline-flex;align-items:stretch;border-radius:6px;overflow:hidden;border:1.5px solid #1d1d1b;background:#f2c94c;box-shadow:inset 0 1px 0 rgb(255 255 255 / .5),0 4px 10px -6px rgb(0 0 0 / .4);font-family:"Kenteken","DIN Alternate","Arial Narrow",Arial,sans-serif;line-height:1;vertical-align:middle;flex:none}
.kmplaat i{font-style:normal;background:#1f3c96;color:#fff;font-size:8px;font-weight:700;display:flex;align-items:flex-end;justify-content:center;padding:0 4px 4px;min-width:16px;letter-spacing:.02em;background-image:radial-gradient(circle at 50% 30%,#f2c94c 0 1px,transparent 1.6px)}
.kmplaat b{color:#1d1d1b;font-weight:700;letter-spacing:.06em;padding:6px 10px;font-size:17px;white-space:nowrap}
.kmplaat.groot b{font-size:26px;padding:9px 16px}.kmplaat.groot i{font-size:10px;min-width:22px}
.kmplaat.mini b{font-size:11.5px;padding:3px 6px}.kmplaat.mini i{font-size:6px;min-width:11px;padding:0 2px 2px}
.km-sh{background:#fff;border-radius:22px;padding:20px;width:min(440px,calc(100vw - 32px));display:grid;gap:16px;box-shadow:0 40px 80px -30px rgb(28 34 49 / .55);border:1px solid #dfe0e0}
.km-k{display:flex;align-items:center;gap:12px}.km-k>div{flex:1;min-width:0}.km-k small{display:block;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#56616a}.km-k b{font-size:17px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:#252c3c}
.km-ic{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;color:#fff;background:linear-gradient(150deg,#323b50,#252c3c 55%,#1c2231);flex:none}.km-ic svg{width:24px;height:24px}
.km-pl{display:grid;gap:8px}.km-pl.een{justify-items:start;gap:4px}.km-pl small{color:#56616a;font-size:12px}
.km-pb{display:flex;align-items:center;gap:12px;padding:10px 12px!important;border-radius:14px!important;border:1.5px solid #dfe0e0!important;background:linear-gradient(180deg,#f5f5f3,#ececea 60%,#e3e3e0)!important;color:#252c3c!important;justify-content:flex-start!important;text-align:left;min-height:0!important}
.km-pb.on{border-color:#252c3c!important;box-shadow:0 0 0 3px rgb(37 44 60 / .14)}
.km-in{display:grid;gap:6px;margin:0}.km-in span{font-size:12px;font-weight:600;color:#56616a}.km-in input{font-size:24px!important;font-weight:700;letter-spacing:.04em;padding:12px 14px!important;height:auto!important;font-variant-numeric:tabular-nums}.km-in em,.km-n{font-style:normal;font-size:12px;color:#56616a}
.km-2{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:end}.km-2>div small{display:block;font-size:12px;font-weight:600;color:#56616a;margin-bottom:6px}.km-2>div b{font-size:20px;font-variant-numeric:tabular-nums;color:#56616a;display:block;padding:12px 0}
.km-r{background:linear-gradient(180deg,#f5f5f3,#ececea 60%,#e3e3e0);border-radius:14px;padding:10px 12px}.km-r small{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#56616a}.km-r p{margin:3px 0 0;font-size:13px;color:#252c3c;line-height:1.45}
.km-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:6px;background:#ececea;border-radius:14px;padding:4px}
.km-seg button{border:0!important;background:transparent!important;color:#56616a!important;border-radius:10px!important;padding:9px 6px!important;font-weight:600;box-shadow:none!important;min-height:0!important}
.km-seg button[aria-pressed=true]{background:#fff!important;color:#252c3c!important;box-shadow:0 2px 8px -3px rgb(0 0 0 / .25)!important}
.km-seg.sm{grid-auto-columns:auto;overflow-x:auto}.km-seg.sm button{padding:6px 10px!important;font-size:12px}
.km-f{display:grid;grid-template-columns:auto 1fr;gap:10px}.km-f button{width:auto!important;margin:0!important;justify-content:center}
.km-lijst{gap:14px}.km-fl{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.km-fl select{width:auto}
.km-tot{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.km-tot div{background:linear-gradient(180deg,#f5f5f3,#ececea 60%,#e3e3e0);border-radius:14px;padding:10px 12px;border:1px solid #dfe0e0}.km-tot small{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#56616a}.km-tot b{font-size:17px;color:#252c3c;font-variant-numeric:tabular-nums;white-space:nowrap}
.km-rl{display:grid;border:1px solid #dfe0e0;border-radius:16px;overflow:hidden;background:#fff}
.km-ri{display:grid!important;grid-template-columns:78px minmax(0,1fr) auto;gap:12px;align-items:center;text-align:left;padding:12px 14px!important;border:0!important;border-bottom:1px solid #dfe0e0!important;border-radius:0!important;background:#fff!important;color:#252c3c!important;box-shadow:none!important;min-height:0!important}
.km-ri:last-child{border-bottom:0!important}.km-ri:hover{background:#f8f9f9!important}
.km-d b{display:block;font-size:13px}.km-d small,.km-m small,.km-s small{display:block;font-size:11.5px;color:#56616a;font-weight:500}
.km-m{min-width:0}.km-m small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}.km-mt{display:flex;align-items:center;gap:8px}
.km-t{font-style:normal;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:99px;background:#ececea;color:#56616a}.km-t-zakelijk{background:#252c3c;color:#fff}
.km-s{text-align:right}.km-s b{font-size:14px;white-space:nowrap;font-variant-numeric:tabular-nums}
.km-leeg{display:grid;justify-items:center;text-align:center;gap:6px;padding:30px 16px;border:1px dashed #d3d3ce;border-radius:16px;color:#56616a}.km-leeg svg{width:34px;height:34px;color:#252c3c}.km-leeg b{color:#252c3c}
.km-vr{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(0,1fr) auto;gap:8px;align-items:center;margin-bottom:8px}
@media (max-width:560px){.km-tot{grid-template-columns:repeat(2,minmax(0,1fr))}.km-ri{grid-template-columns:62px minmax(0,1fr) auto;gap:8px;padding:11px 12px!important}.km-vr{grid-template-columns:auto minmax(0,1fr) auto}.km-vr [data-vn]{grid-column:2/3;grid-row:2}}
</style>`);
