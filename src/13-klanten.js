/* ---------- KLANTEN ---------- */
function klantFilter(){
  const q=state.q.toLowerCase(),f=state.kf,rz=state.krz;
  return state.klanten.filter(k=>(!rz||kRitme(k).z===rz)&&(f==="alle"?true:f==="inactief"?k.actief===false:k.actief!==false&&(k.soort||"particulier")===f)&&(!state.ronde||k.ronde===state.ronde)&&(!q||[k.naam,k.adres,k.plaats,k.postcode,k.telefoon,k.email].join(" ").toLowerCase().includes(q)))
    .sort((a,b)=>(a.actief===false)-(b.actief===false)||cleanName(a.naam).localeCompare(cleanName(b.naam)));
}
function vKlanten(){
  const all=state.klanten,act=actief().length,ks=klantFilter(),pp=state.kpp,pages=Math.max(1,Math.ceil(ks.length/pp));
  if(state.kpage>pages)state.kpage=pages;
  const shown=ks.slice((state.kpage-1)*pp,state.kpage*pp),selm=!!state.sel;
  const cnt=f=>all.filter(k=>f==="alle"?true:f==="inactief"?k.actief===false:k.actief!==false&&(k.soort||"particulier")===f).length;
  let html=`${aanmeldBanner()}<div class="pagehead"><div><p class="kicker">Klantenbestand</p><h1 class="xl">${plural(all.length,"klant","klanten")}</h1><p class="lead" style="margin:0"><b>${act}</b> actief${rondes().length?" · "+plural(rondes().length,"ronde","rondes"):""}</p></div></div>
  <div class="toolbar">
    <button type="button" class="${selm?"on":""}" data-act="selmode">${I.checksq}${selm?"Klaar met selecteren":"Selecteer"}</button>
    <button type="button" data-act="postcodes">${I.pin}Postcodes</button>
    ${LIVE?"":`<button type="button" data-act="welkom">${I.mail}Welkomstberichten</button>`}
    <div class="drop"><button type="button" data-act="kmenu">${I.more}Meer</button>${state.kmenu?`<div class="menu"><button type="button" data-act="kfoto">${I.camera}Klanten uit foto (AI)</button><button type="button" data-act="webaanvraag">${I.globe}Aanvraag van de website</button><button type="button" data-act="import">${I.upload}Importeren uit Excel/CSV</button>${state.dl&&all.length?`<button type="button" data-act="export">${I.dl}Exporteren als CSV</button>`:""}</div>`:""}</div>
    <button type="button" class="primary" data-act="klant">${I.plus}Nieuwe klant</button></div>
  ${all.length?kRitmeKaart():""}
  <div class="kl-bar"><div class="toolbar"><div class="search">${I.search}<input id="q" type="search" placeholder="Zoek op naam, adres, e-mail…" value="${esc(state.q)}"></div></div>
  <div class="chips"><span style="color:var(--muted);display:grid">${I.filter}</span>${[["alle","Alle"],["particulier","Particulier"],["zakelijk","Zakelijk"],["vve","VvE"],["inactief","Inactief"]].map(([v,l])=>`<button type="button" class="chip" data-act="kf" data-v="${v}" aria-pressed="${state.kf===v}">${l}<span class="n">${cnt(v)}</span></button>`).join("")}
    ${rondes().length?`<select id="kronde" style="width:auto;border-radius:99px;padding:6px 12px"><option value="">Alle rondes</option>${rondes().map(r=>`<option ${r===state.ronde?"selected":""}>${esc(r)}</option>`).join("")}</select>`:""}</div></div>`;
  if(selm)html+=`<div class="banner"><div><b>${plural(state.sel.size,"klant","klanten")} geselecteerd</b> <button type="button" class="small ghost" data-act="selall">Selecteer alle ${ks.length}</button></div>
    <button type="button" class="small" data-act="selmsg" ${state.sel.size?"":"disabled"}>${I.msg}Bericht</button><button type="button" class="small" data-act="selplan" ${state.sel.size?"":"disabled"}>${I.planning}Plan vandaag</button><button type="button" class="small" data-act="selpause" ${state.sel.size?"":"disabled"}>Inactief maken</button><button type="button" class="small danger" data-act="seldel" ${state.sel.size?"":"disabled"}>${I.trash}Verwijderen</button></div>`;
  if(!all.length)return html+empty("Nog geen klanten","Voeg je eerste klant toe, of importeer je bestaande lijst uit Excel.",`<div style="display:flex;gap:8px"><button type="button" class="primary" data-act="klant">${I.plus}Nieuwe klant</button><button type="button" data-act="import">${I.upload}Importeren</button></div>`);
  html+=`<div class="countline"><span class="eyebrow">${plural(ks.length,"resultaat","resultaten")}</span><label style="flex-direction:row;align-items:center;gap:8px">Per pagina<select id="kpp">${[25,50,100].map(n=>`<option ${n===pp?"selected":""}>${n}</option>`).join("")}</select></label></div>`;
  if(!ks.length)return html+empty("Geen klanten gevonden","Probeer een andere zoekterm of filter.");
  html+=`<div class="list klx">${shown.map(k=>{const s=status(k),sel=selm&&state.sel.has(k.id),C=2*Math.PI*27,_t=today(),_due=s.v,_st=parse(k.laatst)||(_due?addDays(_due,-freqDays(k)):_t),_span=Math.max(1,(_due-_st)/DAY),pct=k.actief===false||(!k.laatst&&!k.gepland)?0:Math.round(Math.max(0,Math.min(1,(_t-_st)/DAY/_span))*100),
      _nw=s.diff===-999,_gp=k.actief!==false&&!k.prospect&&!!parse(k.gepland),rc=k.actief===false?"neutral":k.prospect?"soon":_nw?"nieuw":_gp?"plan":s.diff<0?"late":s.diff<7?"crit":s.diff<=10?"warn":s.diff<=14?"attn":"ok",_ang=pct/100*2*Math.PI-Math.PI/2,_kx=(30+27*Math.cos(_ang)).toFixed(1),_ky=(30+27*Math.sin(_ang)).toFixed(1);
    const dag=s.v?s.v.toLocaleDateString("nl-NL",{day:"numeric",month:"short"}):"",tel=k.mobiel||k.telefoon;
    return `<div class="card click kx kx-${rc}${k.actief===false?" dim":""}${sel?" sel":""}${selm?" kx-selm":""}" data-act="${selm?"selk":"klant"}" data-id="${esc(k.id)}" style="--h:${hue(k.ronde||k.naam)}">
    <span class="kx-av"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="27" class="kx-tr"/></svg><i class="kx-ring" style="--p:${Math.max(0,Math.min(100,pct))}%"></i>${pct>2&&pct<100&&!_gp?`<i class="kx-knob" style="left:${(_kx/.6).toFixed(2)}%;top:${(_ky/.6).toFixed(2)}%"></i>`:""}${(()=>{const gp=parse(k.gepland),ttl=(_nw?"Nieuwe klant, nog niet gewassen":gp?"Ingepland op "+fmtL(k.gepland)+(k.tijd?" om "+k.tijd:""):s.diff<0?Math.abs(s.diff)+" dagen te laat, nog niet ingepland":s.diff===0?"Vandaag aan de beurt, nog niet ingepland":"Over "+s.diff+" dagen aan de beurt, nog niet ingepland")+" · "+pct+"% van het ritme";
      const mnd=["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
      const tile=(band,big)=>`<i class="kc-m">${band}</i><b>${big}</b>`;
      const c=selm?(sel?I.check:""):k.actief===false?`<b>–</b><em>inactief</em>`:k.prospect?`${I.offertes}<em>offerte</em>`:_nw?tile("nieuw",'<span class="kc-s">★</span>'):gp?tile(mnd[gp.getMonth()],gp.getDate()):s.diff===0?tile("vandaag",new Date().getDate()):s.diff<0?tile("te laat","+"+Math.abs(s.diff)):tile(s.diff===1?"dag":"dagen",s.diff);
      return `<span class="kc${!selm&&k.actief!==false&&!k.prospect?" kc-tile":""}${gp&&!selm?" kc-plan":""}" title="${esc(ttl)}">${c}</span>`})()}</span>
    <div class="kx-main"><span class="nm">${esc(cleanName(k.naam))}${isZak(k)?`<em class="kx-tag">${soortLbl(k)}</em>`:""}${k.ronde?`<em class="kx-tag">${esc(k.ronde)}</em>`:""}</span>
      <div class="kx-sub"><span>${I.pin}${esc([k.adres,k.plaats].filter(Boolean).join(", ")||"Geen adres")}</span></div></div>
    <div class="kx-due">${(()=>{const gp=k.actief!==false&&!k.prospect&&parse(k.gepland);return gp?`<span class="kx-st kx-st-plan">Ingepland</span><small>${esc(gp.toLocaleDateString("nl-NL",{weekday:"short",day:"numeric",month:"short"}))}${k.tijd?" · "+esc(k.tijd):""}</small>`:`<span class="kx-st">${k.actief===false?"Inactief":k.prospect?"Wacht op akkoord":esc(s.txt)}</span><small>${k.actief===false||k.prospect?"":esc(dag)}</small>`})()}</div>
    <div class="kx-amt"><b>${eur(k.prijs)}</b><small>${esc(intervalTxt(k))}</small></div>
    <div class="kx-act">${tel?`<a class="kx-b" href="tel:${esc(String(tel).replace(/\s/g,""))}" title="Bellen" onclick="event.stopPropagation()">${I.phone}</a>`:""}${k.adres?`<a class="kx-b" href="${esc(mapsQ(k))}" target="_blank" rel="noopener" title="Route" onclick="event.stopPropagation()">${I.route}</a>`:""}<span class="kx-b kx-go">${I.right}</span></div></div>`}).join("")}</div>`;
  if(pages>1)html+=`<div class="pager"><button type="button" class="small" data-act="kpage" data-n="-1" ${state.kpage<=1?"disabled":""}>${I.left}</button><span class="mono">${state.kpage} / ${pages}</span><button type="button" class="small" data-act="kpage" data-n="1" ${state.kpage>=pages?"disabled":""}>${I.right}</button></div>`;
  return html;
}
function openPostcodes(){
  const g={};actief().forEach(k=>{const pc=String(k.postcode||"").replace(/\s/g,"").slice(0,4)||"Onbekend";(g[pc]=g[pc]||[]).push(k)});
  const keys=Object.keys(g).sort();
  openDlg(`<div class="dlg-head"><span class="objic big">${I.pin}</span><div style="flex:1"><h3>Postcodes</h3><div class="subt">Klanten per postcodegebied · maak er in één keer een ronde van</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  ${keys.length?`<div class="tablewrap" style="box-shadow:none"><table class="t" style="min-width:480px"><thead><tr><th>Gebied</th><th>Klanten</th><th>Per jaar</th><th>Rondes</th><th></th></tr></thead><tbody>${keys.map(pc=>{const ks=g[pc],j=ks.reduce((a,k)=>a+(Number(k.prijs)||0)*365/freqDays(k),0),rs=[...new Set(ks.map(k=>k.ronde).filter(Boolean))];
    return `<tr><td><b class="mono">${esc(pc)}</b><br><small class="subt">${esc([...new Set(ks.map(k=>k.plaats).filter(Boolean))].join(", "))}</small></td><td>${ks.length}</td><td class="amt">${eur0(j)}</td><td>${rs.map(r=>`<span class="pill neutral">${esc(r)}</span>`).join(" ")||"—"}</td><td class="r">${pc!=="Onbekend"?`<button type="button" class="tiny" data-act="pcronde" data-v="${esc(pc)}">Maak ronde</button>`:""}</td></tr>`}).join("")}</tbody></table></div>`:empty("Nog geen klanten","")}`,{wide:true});
}

/* ---------- aanvraag van de website (calculator) toevoegen ----------
   De calculator stuurt een aanvraagcode (ZEEM1:…, formaat zeem.aanvraag v1) mee in de mail.
   Plakken → klant met telling, prijs en duur, en de opdracht staat klaar om in te plannen.
   Straks met een eigen server komt hetzelfde formaat automatisch binnen. */
function leesAanvraag(txt){const m=String(txt||"").match(/ZEEM1:([A-Za-z0-9_-]+)/);if(!m)return null;
  try{let b=m[1].replace(/-/g,"+").replace(/_/g,"/");while(b.length%4)b+="=";const d=JSON.parse(decodeURIComponent(escape(atob(b))));return d&&(d.formaat==="zeem.aanvraag"||d.formaat==="zeem.contact")?d:null}catch(e){return null}}
function aanvraagKlant(d){const k=d.klant||{},t=d.telling||{},fl=(t.floors||[]).map(n=>Number(n)||0),sp={lood:0,mini:0,koepel:0,tuimel:0,...(t.special||{})};
  if(!RC)RC=buildRamen();const R=RC.prijs({floors:fl,special:sp,fk:"m8",koz:false});
  const prijs=r2(S().incl?R.inc:R.ex),duur=Math.max(15,Math.ceil(R.sec/60/5)*5);
  const f4=[0,1,2,3].map(i=>i<3?(fl[i]||0):fl.slice(3).reduce((a,b)=>a+b,0));const geenBijz=!Object.values(sp).some(n=>n>0);
  const regels=[...fl.map((n,i)=>n?[FLN[Math.min(i,3)]||((i)+"e verdieping"),n]:null),...Object.entries(sp).map(([k2,n])=>n?[{lood:"Glas-in-lood",mini:"Miniraampjes",koepel:"Lichtkoepels",tuimel:"Dak- / tuimelramen"}[k2],n]:null)].filter(Boolean);
  return {k,t,fl,sp,R,prijs,duur,f4,geenBijz,regels,ramen:R.count}}
/* aanvraag → klant met opdracht (glasbewassing per verdieping); eerste beurt = O-beurt met tellingcontrole.
   fotos: [{blob,naam,w,h,dots}] als de aanvraag rechtstreeks uit de calculator in het crm komt */
async function aanvraagToevoegen(D,fotos=[]){const a=aanvraagKlant(D),id=newId("k");
  const zak=D.soort==="zakelijk"&&a.k.bedrijf;const tf=[];
  for(const f of (fotos||[])){try{if(!state.assets||!f.blob)break;const file=new File([f.blob],f.naam||"woning-foto.jpg",{type:f.blob.type||"image/jpeg"});const r=await state.assets.upload(file);tf.push({id:r.id,naam:f.naam||"Foto",datum:iso(today()),w:f.w||0,h:f.h||0,dots:(f.dots||[]).map(d=>({x:d.x,y:d.y,t:d.t}))})}catch(er){console.error(er)}}
  const k={naam:zak?a.k.bedrijf:(a.k.naam||"Nieuwe klant"),contact:zak?a.k.naam||"":"",adres:a.k.adres||"",postcode:String(a.k.postcode||"").toUpperCase(),plaats:a.k.plaats||"",email:a.k.email||"",telefoon:a.k.telefoon||"",
    notities:a.k.opmerking||"",dienst:"Glasbewassing",prijs:a.prijs,frequentie:8,duur:a.duur,ronde:"",laatst:"",gepland:"",tijd:"",aanbieden:true,eersteKeer:true,tellingControle:true,
    ramenRegel:a.geenBijz?normR({f:a.f4,fq:["","","",""]}):null,
    ramenTelling:{floors:a.fl,special:a.sp,freq:"m8",koz:false,ramen:a.ramen,datum:iso(today()),fotos:tf,bron:"klant"},
    bron:"website",nieuwAangemeld:true,binnen:false,soort:zak?"zakelijk":"particulier",actief:true,prospect:false,akkoord:true,opdrachtVerwijderd:false,aangemaakt:iso(today()),
    ...aanbevelingBijAanvraag(D),
    log:[{datum:iso(today()),tekst:(D.aanbevolenDoor?"Aanbevolen via code "+(D.ref||"")+" · ":"")+"Aanvraag via de website · "+a.ramen+" ramen (telling klant) · "+eur(a.prijs)+" per beurt, elke 8 weken · eerste beurt O-beurt met tellingcontrole"}],objecten:[]};
  await save("klanten",id,k);return {...k,id}}
/* contactverzoek van een bedrijf / VvE: klant als prospect, nog zonder opdracht */
async function contactToevoegen(D){const k0=D.klant||{},id=newId("k");
  const k={naam:k0.bedrijf||k0.naam||"Nieuw bedrijf",contact:k0.naam||"",adres:k0.adres||"",postcode:String(k0.postcode||"").toUpperCase(),plaats:k0.plaats||"",email:k0.email||"",telefoon:k0.telefoon||"",
    notities:[D.pand?"Soort pand: "+D.pand:"",k0.opmerking||""].filter(Boolean).join("\n"),dienst:"Glasbewassing",prijs:0,frequentie:8,duur:30,ronde:"",laatst:"",gepland:"",tijd:"",aanbieden:false,
    bron:"website",aanvraagType:"contact",nieuwAangemeld:true,binnen:false,soort:"zakelijk",actief:true,prospect:true,akkoord:false,aangemaakt:iso(today()),
    log:[{datum:iso(today()),tekst:"Contactverzoek via de website (bedrijf / VvE)"+(D.pand?" · "+D.pand:"")+(k0.opmerking?" · "+k0.opmerking:"")}],objecten:[]};
  await save("klanten",id,k);return {...k,id}}
function openWebAanvraag(){
  openDlg(`<div class="dlg-head"><span class="objic big">${I.globe}</span><div style="flex:1;min-width:0"><h3>Aanvraag van de website</h3><div class="subt">Plak de e-mail of het WhatsApp-bericht van de klant</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <label>Bericht van de klant<textarea id="wa-in" rows="6" placeholder="Plak hier het hele bericht. Mansard zoekt zelf de aanvraagcode (ZEEM1:…)."></textarea></label>
    <div id="wa-prev"></div>
    <div class="row stickyfoot"><button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="submit" class="primary" id="wa-go" disabled>${I.check}Toevoegen en aanbieden in planning</button></div>`,{wide:false});
  let D=null;const draw=()=>{D=leesAanvraag($("#wa-in").value);const box=$("#wa-prev");$("#wa-go").disabled=!D;
    if(!$("#wa-in").value.trim()){box.innerHTML="";return}
    if(D&&D.formaat==="zeem.contact"){const c=D.klant||{};box.innerHTML=`<div class="box" style="display:flex;flex-direction:column;gap:6px"><span class="pill neutral" style="align-self:flex-start">Contactverzoek bedrijf / VvE</span><b style="font-size:16px">${esc(c.bedrijf||"")}</b><span class="subt">t.a.v. ${esc(c.naam||"")} · ${esc([c.email,c.telefoon].filter(Boolean).join(" · "))}</span>${c.adres?`<span class="subt">${esc([c.adres,[c.postcode,c.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", "))}</span>`:""}${D.pand?`<span class="subt">Soort pand: ${esc(D.pand)}</span>`:""}${c.opmerking?`<span class="subt">Vraag: ${esc(c.opmerking)}</span>`:""}</div>`;return}
    if(!D){box.innerHTML=`<div class="warnbox">${I.alert}<span>Geen aanvraagcode gevonden. Plak het hele bericht, inclusief de regel die begint met ZEEM1:</span></div>`;return}
    const a=aanvraagKlant(D),dub=state.klanten.find(x=>x.adres&&a.k.adres&&x.adres.trim().toLowerCase()===a.k.adres.trim().toLowerCase()&&String(x.postcode||"").replace(/\s/g,"")===String(a.k.postcode||"").replace(/\s/g,""));
    box.innerHTML=`<div class="box" style="display:flex;flex-direction:column;gap:6px">
      <b style="font-size:16px">${esc(D.soort==="zakelijk"&&a.k.bedrijf?a.k.bedrijf:(a.k.naam||"Onbekend"))}</b>${D.soort==="zakelijk"?`<span class="pill neutral" style="align-self:flex-start">Zakelijk${a.k.bedrijf?" · t.a.v. "+esc(a.k.naam||""):""}</span>`:""}<span class="subt">${esc([a.k.adres,[a.k.postcode,a.k.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", "))}</span>
      <span class="subt">${esc([a.k.email,a.k.telefoon].filter(Boolean).join(" · "))}</span>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${a.regels.map(([n,c])=>`<span class="pill neutral">${esc(n)} <b>${c}</b></span>`).join("")}</div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;border-top:1px solid var(--line);padding-top:8px"><span>${a.ramen} ramen · elke 8 weken · ± ${a.duur} min</span><b style="font-size:18px">${eur(a.prijs)}</b></div>
      ${a.k.opmerking?`<span class="subt">Opmerking: ${esc(a.k.opmerking)}</span>`:""}
      ${D.fotos?`<span class="subt">${D.fotos===1?"De foto":D.fotos+" foto’s"} met aangetikte ramen ${D.fotos===1?"zit":"zitten"} als bijlage bij het bericht. Voeg ${D.fotos===1?"hem":"ze"} toe in de opdracht onder Foto’s.</span>`:""}</div>
      ${dub?`<div class="warnbox">${I.alert}<span>Op dit adres staat al een klant: <b>${esc(cleanName(dub.naam))}</b>. Toevoegen maakt een tweede klant aan.</span></div>`:""}`};
  $("#wa-in").addEventListener("input",draw);
  form.onsubmit=async e=>{e.preventDefault();if(!D)return;const b=$("#wa-go");b.disabled=true;
    try{if(D.formaat==="zeem.contact"){const k=await contactToevoegen(D);dlg.close();toast(cleanName(k.naam)+" staat bij Klanten · maak een offerte op maat");openKlantView(k.id);return}const k=await aanvraagToevoegen(D);dlg.close();toast(cleanName(k.naam)+" staat klaar om in te plannen · eerste beurt is een O-beurt met tellingcontrole");state.tab="planning";schedule()}catch(er){b.disabled=false;err(er)}};
}

/* ---------- Ritmekaart: waar staat elke klant in zijn ritme ---------- */
function kRitme(k){const t=today(),p=parse(k.gepland);
  if(k.actief===false)return{z:"uit",f:0};
  if(p&&p>=t)return{z:"gepland",f:Math.min(1,1-(p-t)/DAY/Math.max(7,freqDays(k)))};
  if(!k.laatst)return{z:"nieuw",f:1.15};
  const v=volgende(k),fd=Math.max(7,freqDays(k)),f=1-(v-t)/DAY/fd,d=Math.round((v-t)/DAY);
  return{z:d<0||(p&&p<t)?"laat":d<=7?"week":"ok",f}}
function kRitmeKaart(){const ak=actief(),r=ak.map(k=>({k,...kRitme(k)})),n=z=>r.filter(x=>x.z===z).length,rz=state.krz;
  const laat=n("laat"),week=n("week"),opSchema=n("ok")+n("gepland"),pct=ak.length?Math.round(opSchema/ak.length*100):0;
  const mot=!ak.length?"Nog geen actieve klanten.":laat?`${plural(laat,"klant loopt","klanten lopen")} achter. Plan ze in, dan is iedereen weer in ritme.`:week?`Iedereen in ritme. ${week} deze week aan de beurt.`:"Iedereen loopt keurig in zijn ritme!";
  const chip=(z,l,c)=>`<button type="button" class="kr-c${rz===z?" on":""}" data-act="krz" data-v="${z}" style="--c:${c}"><i></i><b>${n(z)}</b><span>${l}</span></button>`;
  const dots=r.filter(x=>x.z!=="uit").map(x=>{const L=Math.max(1,Math.min(99,x.f/1.25*100));return `<i class="kr-d z-${x.z}" style="left:${L}%;--y:${(hueN(x.k.id)%4)*9}px;--i:${hueN(x.k.id)%20}" title="${esc(cleanName(x.k.naam))} · ${esc((dueTxt(x.k)||{}).txt||"")}">${HUIS}</i>`}).join("");
  return `<section class="kr"><div class="kr-top"><div><p class="kr-k">Ritme van je klanten</p><div class="kr-big"><b>${pct}%</b><span>op schema</span></div><p class="kr-mot">${mot}</p></div>
      <div class="kr-cs">${chip("laat","te laat","#ff9b8a")}${chip("week","deze week","#ffe08a")}${chip("gepland","gepland","#9ff0d2")}${chip("nieuw","nieuw","#b9d8ff")}</div></div>
    <div class="kr-baan"><div class="kr-zones"><span class="zo">net gewassen</span><span class="zb">bijna aan de beurt</span><span class="zl">te laat</span></div>${dots}</div></section>`}
const hueN=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
