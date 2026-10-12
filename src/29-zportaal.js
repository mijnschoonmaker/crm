/* ---------- Klantportaal & aanbevelingen (CRM-kant) ----------
   - tegoed op de klant (k.tegoed) wordt verrekend met de eerstvolgende factuur
   - aanbevelingskorting staat "on hold" tot de nieuwe klant akkoord heeft (k.akkoord) én de eerste afspraak is uitgevoerd
   - verzoeken uit het portaal (portaalVerzoeken) komen binnen als kaart in de zijbalk */
const refBeloning=()=>{const v=S().refBeloning;return v!=null&&v!==""?Number(v)||0:15};
const refWelkom=()=>{const v=S().refWelkom;return v!=null&&v!==""?Number(v)||0:10};
const refAan=()=>S().refAan!==false;

/* tegoed verrekenen met een nieuwe factuur: voegt negatieve regels toe, nooit meer dan het factuurbedrag */
function tegoedVerrekenen(k,f){
  const tg=(k.tegoed||[]).filter(t=>t&&Number(t.bedrag)>0);if(!tg.length)return null;
  let ruimte=r2(f.regels.reduce((a,r)=>a+(Number(r.aantal)||0)*(Number(r.prijs)||0),0));if(ruimte<=0)return null;
  const rest=[],gebruikt=[];
  for(const t of tg){const b=Math.min(Number(t.bedrag),ruimte);
    if(b>0){f.regels.push({omschrijving:t.reden||"Korting",aantal:1,prijs:-r2(b)});ruimte=r2(ruimte-b);gebruikt.push({...t,bedrag:r2(b),factuur:f.nummer,op:iso(today())})}
    if(Number(t.bedrag)-b>0.004)rest.push({...t,bedrag:r2(Number(t.bedrag)-b)})}
  return{tegoed:rest,tegoedGebruikt:[...(k.tegoedGebruikt||[]),...gebruikt]}}

/* na een uitgevoerde afspraak: aanbevelingskorting vrijgeven aan wie deze klant heeft aangebracht */
function aanbevelingVrijgeven(id){setTimeout(async()=>{
  const k=state.klanten.find(x=>x.id===id);if(!k||!k.aanbevolenDoor||k.aanbevelingBeloond||!refAan())return;
  if(k.akkoord===false||k.prospect)return;                       // nog geen akkoord: blijft on hold
  const r=state.klanten.find(x=>x.id===k.aanbevolenDoor);if(!r)return;
  const bedrag=refBeloning();if(!(bedrag>0))return;
  const vn=voornaam(k.contact||cleanName(k.naam));
  try{
    await save("klanten",k.id,{...strip(k),aanbevelingBeloond:true,log:[...(k.log||[]),{datum:iso(today()),tekst:"Eerste afspraak uitgevoerd: aanbevelingskorting voor "+cleanName(r.naam)+" vrijgegeven"}]});
    const r2_=state.klanten.find(x=>x.id===r.id)||r;
    await save("klanten",r.id,{...strip(r2_),tegoed:[...(r2_.tegoed||[]),{id:newId("tg"),bedrag,reden:"Korting klantaanbeveling ("+vn+")",van:k.id,op:iso(today())}],log:[...(r2_.log||[]),{datum:iso(today()),tekst:eur(bedrag)+" aanbevelingskorting vrijgegeven ("+cleanName(k.naam)+" is klant geworden)"}]});
    toast(eur(bedrag)+" korting vrijgegeven voor "+cleanName(r.naam)+" · gaat van de volgende factuur af")
  }catch(e){console.error(e)}},400)}
const voornaam=n=>{let s=String(n||"").trim();if(s.includes(","))s=s.split(",").slice(1).join(",").trim()||s;return s.split(/\s+/)[0]||s};

/* aanvraag via een aanbevelingslink: koppel en geef de welkomstkorting */
function aanbevelingBijAanvraag(D){
  if(!D||!D.aanbevolenDoor||!refAan())return{};
  const r=state.klanten.find(x=>x.id===D.aanbevolenDoor),w=refWelkom();
  return{aanbevolenDoor:D.aanbevolenDoor,aanbevolenCode:D.ref||"",...(w>0?{tegoed:[{id:newId("tg"),bedrag:w,reden:"Welkomstkorting"+(r?" (aanbevolen door "+voornaam(r.contact||cleanName(r.naam))+")":""),op:iso(today())}]}:{})}}

/* instructies van de klant (uit het portaal) bij de afspraak */
function toegangHtml(k){const t=k&&k.portaalToegang;if(!t||(!(t.opties||[]).length&&!t.tekst&&!t.code))return"";
  return `<div class="notebox pt-toegang"><span class="eyebrow">${I.key||I.pin}Instructies van de klant</span>${t.code?`<span class="pt-code"><small>Code poort / toegangsdeur</small><b>${esc(t.code)}</b><button type="button" class="tiny ghost" data-copy="${esc(t.code)}" onclick="event.stopPropagation();navigator.clipboard&&navigator.clipboard.writeText(this.dataset.copy).then(()=>toast('Code gekopieerd'))" aria-label="Code kopiëren">${I.copy||"Kopieer"}</button></span>`:""}${(t.opties||[]).length?`<span class="pt-chips">${t.opties.map(o=>`<span>${esc(o)}</span>`).join("")}</span>`:""}${t.tekst?`<span>${esc(t.tekst)}</span>`:""}</div>`}

/* klantkaart: portaal + aanbevelingen */
function kkPortaal(k){
  const tg=(k.tegoed||[]).filter(t=>Number(t.bedrag)>0),som=tg.reduce((a,t)=>a+Number(t.bedrag),0);
  const door=k.aanbevolenDoor&&state.klanten.find(x=>x.id===k.aanbevolenDoor);
  const aangebracht=state.klanten.filter(x=>x.aanbevolenDoor===k.id);
  const st=x=>x.aanbevelingBeloond?["ok","Vrijgegeven"]:x.actief===false?["neutral","Gestopt"]:x.akkoord===false||x.prospect?["soon","On hold · wacht op akkoord"]:["soon","On hold · eerste afspraak"];
  return `<section class="kp"><div class="kp-h"><span class="objic" style="background:#e9a23b;color:#fff">${I.spark||I.user}</span><b>Klantportaal & aanbevelen</b><span class="sp"></span>${LIVE?`<button type="button" class="small" data-act="ptinvite" data-id="${esc(k.id)}">${I.send}${k.portaalLaatst||k.portaalUitgenodigd?"Opnieuw uitnodigen":"Uitnodigen"}</button>`:""}</div>
    <div class="pt-kk">
      <div><small>Portaal</small><b>${k.portaalLaatst?"Laatst ingelogd "+esc(fmtD(k.portaalLaatst.slice(0,10))):k.portaalUitgenodigd?"Uitgenodigd "+esc(fmtD(k.portaalUitgenodigd.slice(0,10))):"Nog niet gebruikt"}</b></div>
      <div><small>Aanbevelingscode</small><b>${esc(k.refCode||"Wordt gemaakt bij eerste login")}</b></div>
      <div><small>Tegoed</small><b${som>0?' style="color:var(--ok)"':""}>${som>0?eur(som):"—"}</b></div>
    </div>
    ${tg.length?`<div class="kd-sub"><span class="eyebrow">Gaat van de volgende factuur af</span>${tg.map(t=>`<span class="kd-li"><i style="background:var(--ok)"></i>${esc(t.reden||"Korting")}<em>${eur(t.bedrag)}</em></span>`).join("")}</div>`:""}
    ${door?`<div class="kd-sub"><span class="eyebrow">Aanbevolen door</span><span class="kd-li"><i style="background:#e9a23b"></i><button type="button" class="linkbtn" data-act="klant" data-id="${esc(door.id)}">${esc(cleanName(door.naam))}</button><em>${k.aanbevelingBeloond?"korting vrijgegeven":"korting on hold"}</em></span></div>`:""}
    ${aangebracht.length?`<div class="kd-sub"><span class="eyebrow">Heeft aangebracht (${aangebracht.length})</span>${aangebracht.map(x=>{const s=st(x);return `<span class="kd-li"><i style="background:var(--${s[0]==="ok"?"ok":s[0]==="soon"?"soon":"muted"})"></i><button type="button" class="linkbtn" data-act="klant" data-id="${esc(x.id)}">${esc(cleanName(x.naam))}</button><em>${s[1]}</em></span>`}).join("")}</div>`:""}
    ${toegangHtml(k)}
  </section>`}

async function portaalUitnodigen(id){const k=state.klanten.find(x=>x.id===id);if(!k)return;
  if(!LIVE)return toast("Werkt in de live versie");
  if(!(k.email||k.pEmail||k.fEmail))return toast("Deze klant heeft nog geen e-mailadres");
  if(!(await vraag("Uitnodigen voor het klantportaal",`${esc(cleanName(k.naam))} krijgt een mail met een persoonlijke knop om in te loggen (14 dagen geldig). Daarna logt de klant zelf in met zijn e-mailadres.`,"Uitnodiging versturen")))return;
  try{const r=await fbFn("portaalUitnodigen")({klantId:id,basis:location.origin});toast("Uitnodiging verstuurd naar "+r.data.email)}catch(e){fnFout(e)}}

/* ---------- verzoeken uit het portaal ---------- */
const PT_TYPE={verzetten:["Afspraak verzetten","verzet"],overslaan:["Bezoek overslaan","pauze"],vakantie:["Afwezig","zon"],bericht:["Bericht","bericht"],gegevens:["Gegevens wijzigen","user"],extra:["Extra dienst","plus"],stoppen:["Opzeggen","alert"],beoordeling:["Beoordeling","spark"],toegang:["Instructies","pin"]};
let ptUnsub=null;state.portaalVz=state.portaalVz||[];
function livePortaal(){if(!LIVE||ptUnsub)return;
  ptUnsub=fsDb().collection("portaalVerzoeken").where("status","==","nieuw").onSnapshot(s=>{state.portaalVz=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.op).localeCompare(String(a.op)));try{ptKaart()}catch(e){}},e=>console.error("portaal",e))}
if(LIVE)setTimeout(function w(){state.loaded?livePortaal():setTimeout(w,700)},700);
function ptKaart(){const side=document.querySelector("aside.side"),uc=document.getElementById("userCard");if(!side||!uc)return;
  let el=document.getElementById("ptCard");const l=state.portaalVz||[];
  if(!l.length){if(el)el.remove();return}
  if(!el){el=document.createElement("div");el.id="ptCard";side.insertBefore(el,uc)}
  const sig=l.map(x=>x.id).join(",");if(el.dataset.sig===sig)return;el.dataset.sig=sig;
  const v=l[0],T=PT_TYPE[v.type]||["Verzoek"];
  el.className="pt-card";
  el.innerHTML=`<button type="button" data-act="ptopen"><span class="pt-ic">${I.mail}<i>${l.length}</i></span><span class="pt-tx"><b>${l.length>1?l.length+" klantverzoeken":T[0]}</b><small>${esc(cleanName(v.klantNaam))}${v.datum?" · "+esc(fmtD(v.datum)):""}</small></span>${I.right}</button>`}

function openPortaalVz(){const l=state.portaalVz||[];
  const rij=v=>{const T=PT_TYPE[v.type]||["Verzoek"],k=state.klanten.find(x=>x.id===v.klantId);
    const det=[v.datum?(v.type==="vakantie"?"Van "+fmtD(v.datum)+" t/m "+fmtD(v.tot):"Afspraak "+fmtD(v.datum)):"",v.voorkeur?"Voorkeur: "+v.voorkeur:"",v.diensten&&v.diensten.length?v.diensten.join(", "):"",v.wijziging?[v.wijziging.telefoon,v.wijziging.email].filter(Boolean).join(" · "):"",v.sterren?"★".repeat(v.sterren)+"☆".repeat(5-v.sterren):""].filter(Boolean);
    return `<div class="pt-vz" data-id="${esc(v.id)}"><div class="pt-vz-h"><span class="pill ${v.type==="beoordeling"||v.type==="stoppen"?"late":v.type==="bericht"?"neutral":"soon"}">${esc(T[0])}</span><b>${k?`<button type="button" class="linkbtn" data-act="klant" data-id="${esc(k.id)}">${esc(cleanName(k.naam))}</button>`:esc(cleanName(v.klantNaam))}</b><small>${esc(v.adres||"")}</small><span class="sp"></span><small>${esc(fmtD(String(v.op).slice(0,10)))} ${esc(String(v.op).slice(11,16))}</small></div>
      ${det.length?`<div class="pt-det">${det.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}${v.tekst?`<p class="pt-txt">${esc(v.tekst)}</p>`:""}
      <div class="pt-act"><input type="text" placeholder="Antwoord voor de klant (zichtbaar in het portaal, niet verplicht)" data-ant="${esc(v.id)}">
        ${v.type==="gegevens"&&k?`<button type="button" class="small" data-ptover="${esc(v.id)}">Overnemen</button>`:""}
        ${(v.type==="verzetten"||v.type==="overslaan")&&k&&k.gepland?`<button type="button" class="small" data-act="job" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}">${I.planning}Afspraak</button>`:""}
        <button type="button" class="small primary" data-ptok="${esc(v.id)}">${I.check}Afgehandeld</button></div></div>`};
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:linear-gradient(135deg,var(--brand),#1d5a74);color:#fff">${I.mail}</span><div style="min-width:0;flex:1"><h3>Klantverzoeken</h3><div class="subt">Via het klantportaal · ${plural(l.length,"open verzoek","open verzoeken")}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="pt-list">${l.length?l.map(rij).join(""):`<p class="subt" style="text-align:center;margin:30px 0">Alles is afgehandeld</p>`}</div>`,{wide:true});
  const af=async(id,extra={})=>{const v=l.find(x=>x.id===id);const a=(form.querySelector(`[data-ant="${id}"]`)||{}).value||"";
    try{await fsDb().doc("portaalVerzoeken/"+id).set({status:"afgehandeld",antwoord:a.trim(),afgehandeldOp:new Date().toISOString(),door:(state.me&&state.me.email)||"",...extra},{merge:true});
      const k=v&&state.klanten.find(x=>x.id===v.klantId);if(k)await save("klanten",k.id,{...strip(k),log:[...(k.log||[]),{datum:iso(today()),tekst:"Portaal · "+((PT_TYPE[v.type]||["Verzoek"])[0])+(v.datum?" "+fmtD(v.datum):"")+(v.tot?" t/m "+fmtD(v.tot):"")+(v.tekst?": "+v.tekst.slice(0,140):"")+(a?" · antwoord: "+a:"")}]});
      const el=form.querySelector(`.pt-vz[data-id="${id}"]`);if(el)el.remove();toast("Afgehandeld");if(!form.querySelector(".pt-vz"))setTimeout(()=>dlg.close(),300)}catch(e){err(e)}};
  form.querySelectorAll("[data-ptok]").forEach(b=>b.onclick=()=>{b.disabled=true;af(b.dataset.ptok)});
  form.querySelectorAll("[data-ptover]").forEach(b=>b.onclick=async()=>{const v=l.find(x=>x.id===b.dataset.ptover),k=v&&state.klanten.find(x=>x.id===v.klantId);if(!k)return;const w=v.wijziging||{};
    try{await save("klanten",k.id,{...strip(k),...(w.telefoon?{telefoon:w.telefoon}:{}),...(w.email?{email:w.email}:{})});toast("Gegevens van "+cleanName(k.naam)+" bijgewerkt");af(v.id)}catch(e){err(e)}});
}

/* ---------- instellingen ---------- */
if(LIVE){const at=SETCARDS.findIndex(x=>x.id==="liveOverzicht")+1;
  SETCARDS.splice(at||SETCARDS.length,0,{id:"livePortaal",t:"Klantportaal & aanbevelen",sub:"Klanten zien hun afspraken en facturen, en bevelen je aan",ic:"spark",bg:"#e09a2b",st:s=>s.refAan!==false?["ok","Actief"]:["soon","Aanbevelen staat uit"],rows:s=>[["Adres",location.host+"/portaal"],["Korting aanbeveler",s.refAan===false?"—":eur(s.refBeloning!=null&&s.refBeloning!==""?s.refBeloning:15)],["Welkomstkorting",s.refAan===false?"—":eur(s.refWelkom!=null&&s.refWelkom!==""?s.refWelkom:10)]]});
  SETEXTRA.livePortaal=(c,s)=>{const url=location.origin+"/portaal";
    setDlg(c,`${info("Klanten loggen in op <b>"+esc(location.host)+"/portaal</b> met hun e-mailadres; ze krijgen een inlogknop per mail, zonder wachtwoord. Ze zien hun volgende bezoek, bezoeken en facturen, kunnen online betalen, afspraken verzetten of afwezigheid doorgeven, instructies achterlaten en je aanbevelen.")}
      <div class="splitrow" style="gap:10px"><code style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(url)}</code><button type="button" class="small" id="ptCopy">${I.copy||I.check}Kopieer</button><a class="btn small" href="${esc(url)}" target="_blank" rel="noopener">Openen</a></div>
      ${sel("portaalTijd","Tijd van het bezoek tonen als",s.portaalTijd||"venster",[["venster","Tijdvak van 2 uur (bijv. tussen 09:30 en 11:30)"],["vak","Dagdeel (in de ochtend / middag)"],["exact","Rond de geplande tijd"]],{cls:"full"})}
      ${sec("Aanbevelen")}
      ${tgl("refAan","Klanten kunnen je aanbevelen","Met een persoonlijke link en korting",s.refAan!==false)}
      <div class="grid2">${inp("refBeloning","Korting voor wie aanbeveelt (€)",s.refBeloning!=null&&s.refBeloning!==""?s.refBeloning:15,{type:"number",t:"num",attrs:'min="0" step="1"'})}${inp("refWelkom","Welkomstkorting nieuwe klant (€)",s.refWelkom!=null&&s.refWelkom!==""?s.refWelkom:10,{type:"number",t:"num",attrs:'min="0" step="1"'})}</div>
      <small class="help">De korting voor wie aanbeveelt staat <b>on hold</b> en wordt pas vrijgegeven als de nieuwe klant akkoord heeft gegeven én de eerste afspraak is uitgevoerd. Daarna gaat hij automatisch van de eerstvolgende factuur af. De welkomstkorting staat direct op de eerste factuur van de nieuwe klant.</small>
      <small class="help">Zorg dat bij Bedrijf & Branding je <b>website</b> en bij Reviewverzoek je <b>reviewlink</b> zijn ingevuld: die gebruikt het portaal.</small>`,{wide:false});
    $("#ptCopy").onclick=async()=>{try{await navigator.clipboard.writeText(url);toast("Gekopieerd")}catch(e){}};
    bindSave()};
}
