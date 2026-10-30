/* ---------- Klantportaal & aanbevelingen (CRM-kant) ----------
   - tegoed op de klant (k.tegoed) wordt verrekend met de eerstvolgende factuur
   - aanbevelingskorting staat "on hold" tot de nieuwe klant akkoord heeft (k.akkoord) én de eerste afspraak is uitgevoerd
   - verzoeken uit het portaal (portaalVerzoeken) komen binnen als kaart in de zijbalk */
const refBeloning=()=>{const v=S().refBeloning;return v!=null&&v!==""?Number(v)||0:20};
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
    await save("klanten",r.id,{...strip(r2_),tegoed:[...(r2_.tegoed||[]),{id:newId("tg"),bedrag,reden:"Korting klantaanbeveling ("+vn+")",bron:"aanbevelen",van:k.id,op:iso(today())}],log:[...(r2_.log||[]),{datum:iso(today()),tekst:eur(bedrag)+" aanbevelingskorting vrijgegeven ("+cleanName(k.naam)+" is klant geworden)"}]});
    toast(eur(bedrag)+" korting vrijgegeven voor "+cleanName(r.naam)+" · gaat van de volgende factuur af")
  }catch(e){console.error(e)}},400)}
const voornaam=n=>{let s=String(n||"").trim();if(s.includes(","))s=s.split(",").slice(1).join(",").trim()||s;return s.split(/\s+/)[0]||s};

/* ---------- code van een buur (geef € 5, krijg € 10) ----------
   Elke klant heeft een eigen code (refCode). Een nieuwe klant die met die code komt (website, dienstenwebshop of offerte in het CRM):
   - krijgt de welkomstkorting als tegoed (gaat van de eerste factuur af),
   - de aanbrenger krijgt zijn beloning zodra de eerste afspraak is uitgevoerd (aanbevelingVrijgeven). */
const refEur=n=>{const v=Number(n)||0;return "€ "+(Number.isInteger(v)?String(v):eur(v).replace(/^€\s*/,""))};
const refNorm=c=>String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,12);
function refVan(code,zelfId){const c=refNorm(code);if(c.length<3)return null;const r=state.klanten.find(k=>k.refCode===c);return r&&r.id!==zelfId?r:null}
function refCodeNieuw(k){const n=String(k.contact||k.naam||"").trim(),s=n.includes(",")?n.split(",").slice(1).join(",").trim()+" "+n.split(",")[0].trim():n;
  const b=(cleanName(s).split(/\s+/)[0]||"").normalize("NFD").replace(/[^A-Za-z]/g,"").toUpperCase().slice(0,6)||"VRIEND",bezet=new Set(state.klanten.map(x=>x.refCode).filter(Boolean));
  for(let i=0;i<60;i++){const c=b+(10+Math.floor(Math.random()*90));if(!bezet.has(c))return c}return b+Math.random().toString(36).slice(2,6).toUpperCase()}
async function refCodeZorg(id){const k=state.klanten.find(x=>x.id===id);if(!k)return"";if(k.refCode)return k.refCode;const c=refCodeNieuw(k);await save("klanten",k.id,{...strip(k),refCode:c});return c}
const refLink=c=>(LIVE?location.origin:"https://app.mansard.nl")+"/aanbevolen/"+encodeURIComponent(c);
/* koppelen aan een aanbrenger: alleen als deze klant nog niet aan iemand gekoppeld is; welkomstkorting maar één keer */
function refKoppelPatch(k,r){if(!r||!refAan()||(k&&k.aanbevolenDoor))return{};
  const w=refWelkom(),heeft=k&&[...(k.tegoed||[]),...(k.tegoedGebruikt||[])].some(t=>t&&(t.bron==="welkom"||/^Welkomstkorting/.test(String(t.reden||""))));
  return{aanbevolenDoor:r.id,aanbevolenCode:r.refCode||"",
    ...(w>0&&!heeft?{tegoed:[...((k&&k.tegoed)||[]),{id:newId("tg"),bedrag:w,reden:"Welkomstkorting (aanbevolen door "+voornaam(r.contact||cleanName(r.naam))+")",bron:"welkom",op:iso(today())}]}:{}),
    log:[...((k&&k.log)||[]),{datum:iso(today()),tekst:"Aanbevolen door "+cleanName(r.naam)+" (code "+(r.refCode||"")+")"+(w>0&&!heeft?" · "+eur(w)+" welkomstkorting op de eerste factuur":"")}]}}

/* aanvraag via een aanbevelingslink: koppel en geef de welkomstkorting */
function aanbevelingBijAanvraag(D){
  if(D&&!D.aanbevolenDoor&&D.ref){const r0=refVan(D.ref);if(r0)D={...D,aanbevolenDoor:r0.id,ref:r0.refCode}}
  if(!D||!D.aanbevolenDoor||!refAan())return{};
  const r=state.klanten.find(x=>x.id===D.aanbevolenDoor),w=refWelkom();if(!r)return{};
  {const n=x=>String(x||"").toLowerCase().replace(/[^a-z0-9]/g,""),kk=D.klant||{};if(n(r.adres)&&n(r.adres)===n(kk.adres)&&n(r.postcode)===n(kk.postcode))return{}}  // eigen code op eigen adres telt niet
  return{aanbevolenDoor:D.aanbevolenDoor,aanbevolenCode:D.ref||"",...(w>0?{tegoed:[{id:newId("tg"),bedrag:w,reden:"Welkomstkorting"+(r?" (aanbevolen door "+voornaam(r.contact||cleanName(r.naam))+")":""),bron:"welkom",op:iso(today())}]}:{})}}

/* instructies van de klant (uit het portaal) bij de afspraak */
function toegangHtml(k){const t=k&&k.portaalToegang;if(!t||(!(t.opties||[]).length&&!t.tekst&&!t.code))return"";
  return `<div class="notebox pt-toegang"><span class="eyebrow">${I.key||I.pin}Instructies van de klant</span>${t.code?`<span class="pt-code"><small>Code poort / toegangsdeur</small><b>${esc(t.code)}</b><button type="button" class="tiny ghost" data-copy="${esc(t.code)}" onclick="event.stopPropagation();navigator.clipboard&&navigator.clipboard.writeText(this.dataset.copy).then(()=>toast('Code gekopieerd'))" aria-label="Code kopiëren">${I.copy||"Kopieer"}</button></span>`:""}${(t.opties||[]).length?`<span class="pt-chips">${t.opties.map(o=>`<span>${esc(o)}</span>`).join("")}</span>`:""}${t.tekst?`<span>${esc(t.tekst)}</span>`:""}</div>`}

/* klantkaart: portaal + aanbevelingen */
function kkPortaal(k){
  const tg=(k.tegoed||[]).filter(t=>Number(t.bedrag)>0),som=tg.reduce((a,t)=>a+Number(t.bedrag),0);
  const door=k.aanbevolenDoor&&state.klanten.find(x=>x.id===k.aanbevolenDoor);
  const aangebracht=state.klanten.filter(x=>x.aanbevolenDoor===k.id);
  const st=x=>x.aanbevelingBeloond?["ok","Vrijgegeven"]:x.actief===false?["neutral","Gestopt"]:x.akkoord===false||x.prospect?["soon","On hold · wacht op akkoord"]:["soon","On hold · eerste afspraak"];
  return `<section class="kp"><div class="kp-h pt-h"><span class="objic" style="background:#e9a23b;color:#fff">${I.spark||I.user}</span><b>Klantportaal & aanbevelen</b><span class="sp"></span>${LIVE?`<span class="pt-acts"><button type="button" class="small" data-act="tknieuw" data-id="${esc(k.id)}">${I.ticket}Ticket</button><button type="button" class="small" data-act="ptkijk" data-id="${esc(k.id)}">${I.eye||I.globe||""}Portaal bekijken</button><button type="button" class="small" data-act="ptinvite" data-id="${esc(k.id)}">${I.send}${k.portaalLaatst||k.portaalUitgenodigd?"Opnieuw uitnodigen":"Uitnodigen"}</button></span>`:""}</div>
    <div class="pt-kk">
      <div><small>Portaal</small><b>${k.portaalLaatst?"Laatst in het portaal "+esc((d=>isNaN(d)?fmtD(k.portaalLaatst.slice(0,10)):fmtD(iso(d))+" om "+d.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Amsterdam"}))(new Date(k.portaalLaatst))):k.portaalUitgenodigd?"Uitgenodigd "+esc(fmtD(k.portaalUitgenodigd.slice(0,10))):"Nog niet gebruikt"}</b></div>
      <div><small>Aanbevelingscode</small><b>${k.refCode?esc(k.refCode):`<button type="button" class="linkbtn" data-act="refmaak" data-id="${esc(k.id)}">Code maken</button>`}</b></div>
      <div><small>Tegoed</small><b${som>0?' style="color:var(--ok)"':""}>${som>0?eur(som):"—"}</b></div>
      <div><small>Automatische incasso</small><b${k.incasso&&k.mollieMandateId?' style="color:var(--ok)"':""}>${k.incasso&&k.mollieMandateId?"Actief"+(k.incassoRekening?" · "+esc(k.incassoRekening):"")+(k.incassoSinds?" · sinds "+esc(fmtD(k.incassoSinds)):""):"Niet ingesteld"}</b></div>
    </div>
    ${tg.length?`<div class="kd-sub"><span class="eyebrow">Gaat van de volgende factuur af</span>${tg.map(t=>`<span class="kd-li"><i style="background:var(--ok)"></i>${esc(t.reden||"Korting")}<em>${eur(t.bedrag)}</em></span>`).join("")}</div>`:""}
    ${refAan()&&k.refCode&&k.actief!==false&&!k.prospect?`<div class="kd-sub ref-deel"><span class="eyebrow">Geef ${refEur(refWelkom())}, krijg ${refEur(refBeloning())} · persoonlijke link</span><span class="kd-li"><i style="background:#e9a23b"></i><span class="mono" style="overflow:hidden;text-overflow:ellipsis">${esc(refLink(k.refCode).replace(/^https?:\/\//,""))}</span><em><button type="button" class="tiny ghost" data-act="refkopie" data-id="${esc(k.id)}">${I.copy||""}Kopieer</button>${k.telefoon||k.mobiel?`<button type="button" class="tiny ghost" data-act="refwa" data-id="${esc(k.id)}">WhatsApp</button>`:""}</em></span></div>`:""}
    ${refAan()&&!door&&!(state.beurten||[]).some(b=>b.klantId===k.id)?`<div class="kd-sub"><span class="eyebrow">Aanbevolen door een klant?</span><span class="kd-li ref-in"><input class="ref-kk" data-id="${esc(k.id)}" placeholder="Code, bijv. HANS68" maxlength="12" autocomplete="off" spellcheck="false" aria-label="Code van de aanbrenger"><button type="button" class="tiny" data-act="refkoppel" data-id="${esc(k.id)}">Koppelen</button></span></div>`:""}
    ${door?`<div class="kd-sub"><span class="eyebrow">Aanbevolen door</span><span class="kd-li"><i style="background:#e9a23b"></i><button type="button" class="linkbtn" data-act="klant" data-id="${esc(door.id)}">${esc(cleanName(door.naam))}</button><em>${k.aanbevelingBeloond?"korting vrijgegeven":"korting on hold"}</em></span></div>`:""}
    ${aangebracht.length?`<div class="kd-sub"><span class="eyebrow">Heeft aangebracht (${aangebracht.length})</span>${aangebracht.map(x=>{const s=st(x);return `<span class="kd-li"><i style="background:var(--${s[0]==="ok"?"ok":s[0]==="soon"?"soon":"muted"})"></i><button type="button" class="linkbtn" data-act="klant" data-id="${esc(x.id)}">${esc(cleanName(x.naam))}</button><em>${s[1]}</em></span>`}).join("")}</div>`:""}
    ${toegangHtml(k)}
  </section>`}

/* het klantportaal bekijken zoals deze klant het ziet (alleen bekijken) */
/* in het CRM zelf (geen nieuw tabblad): zo blijft het CRM in beeld en blijft live delen je plek doorgeven terwijl je meekijkt */
async function portaalBekijken(id){
  try{const r=await fbFn("portaalVoorbeeld")({klantId:id,basis:location.origin});portaalOverlay(r.data.url)}
  catch(e){toast("Openen lukte niet: "+(typeof fnFout==="function"?fnFout(e):e.message))}}
function portaalOverlay(url){const r={data:{url}};{
    /* eigen <dialog> (bovenste laag), anders valt hij achter de open klantkaart */
    const o=document.createElement("dialog");o.className="pv-ov";o.innerHTML=`<div class="pv-bar"><b>Klantportaal · voorbeeld</b><span class="sp"></span><button type="button" class="small" data-pvtab>Nieuw tabblad</button><button type="button" class="iconbtn" data-pvx aria-label="Sluiten">${I.x}</button></div><iframe src="${esc(r.data.url)}" title="Klantportaal" allow="geolocation"></iframe>`;
    document.body.appendChild(o);try{o.showModal()}catch(_){o.setAttribute("open","")}const weg=()=>{try{o.close()}catch(_){}o.remove()};o.addEventListener("cancel",e=>{e.preventDefault();weg()});o.querySelector("[data-pvx]").onclick=weg;o.querySelector("[data-pvtab]").onclick=()=>{window.open(r.data.url,"_blank");weg()};
    document.addEventListener("keydown",function k(e){if(e.key==="Escape"&&document.body.contains(o)){weg();document.removeEventListener("keydown",k)}})}}
async function portaalUitnodigen(id){const k=state.klanten.find(x=>x.id===id);if(!k)return;
  if(!LIVE)return toast("Werkt in de live versie");
  if(!(k.email||k.pEmail||k.fEmail))return toast("Deze klant heeft nog geen e-mailadres");
  if(!(await vraag("Uitnodigen voor het klantportaal",`${esc(cleanName(k.naam))} krijgt een mail met een persoonlijke knop om in te loggen (14 dagen geldig). Daarna logt de klant zelf in met zijn e-mailadres.`,"Uitnodiging versturen")))return;
  try{const r=await fbFn("portaalUitnodigen")({klantId:id,basis:location.origin});toast("Uitnodiging verstuurd naar "+r.data.email)}catch(e){fnFout(e)}}

/* ---------- verzoeken uit het portaal ---------- */
const PT_TYPE={verzetten:["Afspraak verzetten","verzet"],overslaan:["Bezoek overslaan","pauze"],vakantie:["Afwezig","zon"],bericht:["Bericht","bericht"],gegevens:["Gegevens wijzigen","user"],extra:["Extra dienst","plus"],review:["Google-review","spark"],stoppen:["Opzeggen","alert"],beoordeling:["Beoordeling","spark"],toegang:["Instructies","pin"]};
let ptUnsub=null;state.portaalVz=state.portaalVz||[];
function livePortaal(){if(!LIVE||ptUnsub)return;
  ptUnsub=fsDb().collection("portaalVerzoeken").where("status","==","nieuw").onSnapshot(s=>{state.portaalVz=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.op).localeCompare(String(a.op)));try{ptKaart()}catch(e){}},e=>console.error("portaal",e))}
if(LIVE)setTimeout(function w(){state.loaded?livePortaal():setTimeout(w,700)},700);
/* klantverzoeken staan sinds de samenvoeging in het ticketoverzicht (tabblad Verzoeken) */
function ptKaart(){const o=document.getElementById("ptCard");if(o)o.remove();try{tkKaart()}catch(e){}if(tkOpen)try{tkSegTeken();tkLijstTeken()}catch(e){}}

function ptRij(v){const T=PT_TYPE[v.type]||["Verzoek"],k=state.klanten.find(x=>x.id===v.klantId);
    const det=[v.datum?(v.type==="vakantie"?"Van "+fmtD(v.datum)+" t/m "+fmtD(v.tot):"Afspraak "+fmtD(v.datum)):"",v.voorkeur?"Voorkeur: "+v.voorkeur:"",v.diensten&&v.diensten.length?v.diensten.join(", "):"",...(v.wijziging?Object.keys(v.wijziging).map(f=>f+": "+((v.oud||{})[f]||"–")+" → "+(v.wijziging[f]||"–")):[]),v.sterren?"★".repeat(v.sterren)+"☆".repeat(5-v.sterren):""].filter(Boolean);
    return `<div class="pt-vz" data-id="${esc(v.id)}"><div class="pt-vz-h"><span class="pill ${v.type==="beoordeling"||v.type==="stoppen"?"late":v.type==="bericht"?"neutral":"soon"}">${esc(T[0])}</span><b>${k?`<button type="button" class="linkbtn" data-act="klant" data-id="${esc(k.id)}">${esc(cleanName(k.naam))}</button>`:esc(cleanName(v.klantNaam))}</b><small>${esc(v.adres||"")}</small><span class="sp"></span><small>${esc(fmtD(String(v.op).slice(0,10)))} ${esc(String(v.op).slice(11,16))}</small></div>
      ${det.length?`<div class="pt-det">${det.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}${v.tekst?`<p class="pt-txt">${esc(v.tekst)}</p>`:""}
      <div class="pt-act"><input type="text" placeholder="Antwoord voor de klant (zichtbaar in het portaal, niet verplicht)" data-ant="${esc(v.id)}">
        ${v.type==="gegevens"?`<span class="pill ok">${I.check}Al bijgewerkt in het CRM</span>`:""}
        ${(v.type==="verzetten"||v.type==="overslaan")&&k&&k.gepland?`<button type="button" class="small" data-act="job" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}">${I.planning}Afspraak</button>`:""}
        <button type="button" class="small primary" data-ptok="${esc(v.id)}">${I.check}Afgehandeld</button></div></div>`}
async function ptAfhandelen(id){const l=state.portaalVz||[],v=l.find(x=>x.id===id);const a=(form.querySelector(`[data-ant="${id}"]`)||{}).value||"";
  await fsDb().doc("portaalVerzoeken/"+id).set({status:"afgehandeld",antwoord:a.trim(),afgehandeldOp:new Date().toISOString(),door:(state.me&&state.me.email)||""},{merge:true});
  const k=v&&state.klanten.find(x=>x.id===v.klantId);if(k)await save("klanten",k.id,{...strip(k),log:[...(k.log||[]),{datum:iso(today()),tekst:"Portaal · "+((PT_TYPE[v.type]||["Verzoek"])[0])+(v.datum?" "+fmtD(v.datum):"")+(v.tot?" t/m "+fmtD(v.tot):"")+(v.tekst?": "+v.tekst.slice(0,140):"")+(a?" · antwoord: "+a:"")}]});
  state.portaalVz=l.filter(x=>x.id!==id);toast("Afgehandeld")}
function openPortaalVz(){openTickets("","",true)}
/* ---------- instellingen ---------- */
if(LIVE){const at=SETCARDS.findIndex(x=>x.id==="liveOverzicht")+1;
  SETCARDS.splice(at||SETCARDS.length,0,{id:"livePortaal",t:"Klantportaal & aanbevelen",sub:"Klanten zien hun afspraken en facturen, en bevelen je aan",ic:"spark",bg:"#e09a2b",st:s=>s.refAan!==false?["ok","Actief"]:["soon","Aanbevelen staat uit"],rows:s=>[["Adres",location.host+"/portaal"],["Korting aanbeveler",s.refAan===false?"—":eur(s.refBeloning!=null&&s.refBeloning!==""?s.refBeloning:20)],["Welkomstkorting",s.refAan===false?"—":eur(s.refWelkom!=null&&s.refWelkom!==""?s.refWelkom:10)],["Credits",`aanbevelen ${s.refBeloning??20} · extra dienst ${s.crExtra??3} · jaar klant ${s.crJaar??10}`]]});
  SETEXTRA.livePortaal=(c,s)=>{const url=location.origin+"/portaal";
    setDlg(c,`${info("Klanten loggen in op <b>"+esc(location.host)+"/portaal</b> met hun e-mailadres; ze krijgen een inlogknop per mail, zonder wachtwoord. Ze zien hun volgende bezoek, bezoeken en facturen, kunnen online betalen, afspraken verzetten of afwezigheid doorgeven, instructies achterlaten en je aanbevelen.")}
      <div class="splitrow" style="gap:10px"><code style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(url)}</code><button type="button" class="small" id="ptCopy">${I.copy||I.check}Kopieer</button><a class="btn small" href="${esc(url)}" target="_blank" rel="noopener">Openen</a></div>
      ${sel("portaalTijd","Tijd van het bezoek tonen als",s.portaalTijd||"venster",[["venster","Tijdvak van 2 uur (bijv. tussen 09:30 en 11:30)"],["vak","Dagdeel (in de ochtend / middag)"],["exact","Rond de geplande tijd"]],{cls:"full"})}
      ${sec("Aanbevelen")}
      ${tgl("refAan","Klanten kunnen je aanbevelen","Met een persoonlijke link en korting",s.refAan!==false)}
      <div class="grid2">${inp("refBeloning","Korting voor wie aanbeveelt (€)",s.refBeloning!=null&&s.refBeloning!==""?s.refBeloning:20,{type:"number",t:"num",attrs:'min="0" step="1"'})}${inp("refWelkom","Welkomstkorting nieuwe klant (€)",s.refWelkom!=null&&s.refWelkom!==""?s.refWelkom:10,{type:"number",t:"num",attrs:'min="0" step="1"'})}</div>
      <small class="help">De korting voor wie aanbeveelt staat <b>on hold</b> en wordt pas vrijgegeven als de nieuwe klant akkoord heeft gegeven én de eerste afspraak is uitgevoerd. Daarna gaat hij automatisch van de eerstvolgende factuur af. De welkomstkorting staat direct op de eerste factuur van de nieuwe klant.</small>
      <small class="help">Instellingen voor VvE's (het portaal van het bestuur en het bewonersbord met QR-code) staan bij <b>Klantportaal VvE</b>.</small>
      ${sec("Credits")}
      <small class="help" style="margin-top:-4px">Klanten sparen in het portaal <b>credits</b> (1 credit = € 1 korting) die automatisch van de volgende factuur afgaan. Zet een veld op 0 om die manier uit te zetten.</small>
      <div class="grid3">${inp("crExtra","Extra dienst besteld",s.crExtra!=null&&s.crExtra!==""?s.crExtra:3,{type:"number",t:"num",attrs:'min="0" step="1"',help:"Als je het ticket oplost"})}</div>
      <div class="grid3">${inp("crSnel","Factuur binnen 24 uur betaald",s.crSnel!=null&&s.crSnel!==""?s.crSnel:0.5,{type:"number",t:"num",attrs:'min="0" step="0.5"',help:"Per factuur · 0,5 = een halve credit (€ 0,50)"})}</div>
      <div class="infobox" style="margin-top:4px">${I.handleiding}<span><b>Geen credits voor reviews.</b> Belonen voor reviews mag juridisch niet: Google verbiedt het en verwijdert zulke reviews, en volgens de Nederlandse regels voor consumentenreviews moet een beloonde review als zodanig herkenbaar zijn. Daarom is er in plaats daarvan <b>Elk jaar klant</b>: een bedankje voor trouwe klanten. Om een review vragen mag wel, zonder beloning.</span></div>
      <small class="help">Zorg dat bij Bedrijf & Branding je <b>website</b> en bij Reviewverzoek je <b>reviewlink</b> zijn ingevuld: die gebruikt het portaal (de reviewlink om klanten om een review te vragen).</small>`,{wide:false});
    $("#ptCopy").onclick=async()=>{try{await navigator.clipboard.writeText(url);toast("Gekopieerd")}catch(e){}};
    bindSave()};
}

/* ---------- tickets van klanten (via het klantportaal) ---------- */
state.tickets=state.tickets||[];let tkUnsub=null,tkOpen=null,tkVorig=null;
const TK_CAT={planning:"Planning of afspraak",factuur:"Factuur of betaling",kwaliteit:"Kwaliteit of klacht",toegang:"Toegang",overig:"Overig"};
const TK_ST={open:["late","Open"],behandeling:["soon","In behandeling"],opgelost:["ok","Opgelost"]};
const tkNaam=()=>{const n=String((state.me&&(state.me.name||state.me.email))||"").split("@")[0].split(/[.\s_-]/)[0];return n?n[0].toUpperCase()+n.slice(1):""};
const tkOngelezen=()=>(state.tickets||[]).filter(t=>Number(t.ongelezenTeam)>0);
function liveTickets(){if(!LIVE||tkUnsub)return;
  tkUnsub=fsDb().collection("tickets").orderBy("laatst","desc").limit(300).onSnapshot(s=>{
    state.tickets=s.docs.map(d=>({id:d.id,...d.data()}));
    try{tkKaart()}catch(e){}if(tkOpen)try{tkLijstTeken()}catch(e){}
    const nu_=Object.fromEntries(state.tickets.map(t=>[t.id,Number(t.ongelezenTeam)||0]));
    if(tkVorig===null){const l=tkOngelezen();if(l.length)tkPopup(l[0],l.length>1?l.length:0)}
    else state.tickets.filter(t=>t.laatsteVan==="klant"&&nu_[t.id]>(tkVorig[t.id]||0)&&!(tkOpen&&tkOpen.id===t.id&&document.hasFocus())).forEach(t=>tkPopup(t,0,!(t.id in tkVorig)));
    tkVorig=nu_},e=>console.error("tickets",e))}
if(LIVE)setTimeout(function w(){state.loaded?liveTickets():setTimeout(w,700)},900);
function tkKaart(){if(isMw()){["tkCard","tkFab"].forEach(i=>{const o=document.getElementById(i);if(o)o.remove()});return}const l=tkOngelezen(),n=l.length,open=state.tickets.filter(t=>t.status!=="opgelost").length,vz=(state.portaalVz||[]).length;
  const side=document.querySelector("aside.side"),uc=document.getElementById("userCard");let el=document.getElementById("tkCard");
  if(side&&uc){if(!open&&!vz){if(el)el.remove()}else{if(!el){el=document.createElement("div");el.id="tkCard";side.insertBefore(el,document.getElementById("ptCard")||uc)}
    const t=l[0],sig=open+"|"+vz+"|"+l.map(x=>x.id+x.ongelezenTeam).join(","),v0=(state.portaalVz||[])[0];if(el.dataset.sig!==sig){el.dataset.sig=sig;el.className="pt-card ch-card";
      el.innerHTML=`<button type="button" data-act="tkopen"${t?` data-id="${esc(t.id)}"`:""}><span class="pt-ic">${I.ticket}${n+vz?`<i>${n+vz}</i>`:""}</span><span class="pt-tx"><b>${n?(n>1?n+" tickets wachten":"Ticket "+esc(t.nummer||"")):vz?(vz>1?vz+" klantverzoeken":(PT_TYPE[v0.type]||["Klantverzoek"])[0]):plural(open,"open ticket","open tickets")}</b><small>${t?esc(cleanName(t.klantNaam))+" · "+esc(t.laatsteTekst||""):vz?esc(cleanName(v0.klantNaam||""))+(v0.datum?" · "+esc(fmtD(v0.datum)):""):"Bekijk het overzicht"}</small></span>${I.right}</button>`}}}
  let fb=document.getElementById("tkFab");
  if(!n){if(fb)fb.remove();return}
  if(!fb){fb=document.createElement("button");fb.type="button";fb.id="tkFab";fb.className="ch-fab";fb.dataset.act="tkopen";document.body.appendChild(fb)}
  fb.dataset.id=l[0].id;fb.setAttribute("aria-label",n+" tickets met nieuwe berichten");fb.innerHTML=`${I.ticket}<i>${n}</i>`}
/* pop-up rechtsboven + geluidje + systeemmelding als het tabblad op de achtergrond staat */
function tkGeluid(){try{const A=new (window.AudioContext||window.webkitAudioContext)(),t=A.currentTime;[[880,0],[1320,.12]].forEach(([f,d])=>{const o=A.createOscillator(),g=A.createGain();o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.18,t+d+.02);g.gain.exponentialRampToValueAtTime(.001,t+d+.35);o.connect(g).connect(A.destination);o.start(t+d);o.stop(t+d+.4)});setTimeout(()=>A.close(),900)}catch(e){}}
function tkPopup(t,totaal,nieuw){if(isMw())return;
  let box=document.getElementById("chatPops");if(!box){box=document.createElement("div");box.id="chatPops";box.className="ch-pops";box.setAttribute("aria-live","polite");document.body.appendChild(box)}
  box.querySelectorAll(`[data-kid="${CSS.escape(t.id)}"]`).forEach(x=>x.remove());
  const el=document.createElement("div");el.className="ch-pop";el.dataset.kid=t.id;el.setAttribute("role","alert");
  el.innerHTML=`<span class="chx-av" style="--h:${hue(t.klantNaam||"")}">${esc(initials(cleanName(t.klantNaam||"?")))}</span><div class="ch-pop-t"><small>${I.ticket}${totaal?totaal+" tickets wachten op antwoord":nieuw||t.aangemaakt===t.laatst?"Nieuw ticket "+esc(t.nummer||""):"Nieuw bericht · "+esc(t.nummer||"")}</small><b>${esc(cleanName(t.klantNaam||"Klant"))}</b><p><strong>${esc(t.onderwerp||"")}</strong>${t.laatsteTekst&&t.laatsteTekst!==t.onderwerp?" · "+esc(String(t.laatsteTekst).slice(0,120)):""}</p>
    <div class="ch-pop-k"><button type="button" class="small primary" data-cp="open">${I.send}Bekijken</button><button type="button" class="small ghost" data-cp="x">Later</button></div></div><button type="button" class="iconbtn sm ghost ch-pop-x" data-cp="x" aria-label="Sluiten">${I.x}</button>`;
  const weg=()=>{el.classList.add("weg");setTimeout(()=>el.remove(),250)};
  el.addEventListener("click",e=>{const b=e.target.closest("[data-cp]");if(!b)return;weg();if(b.dataset.cp==="open"){if(tkOpen)tkDetail(t.id);else{if(dlg.open)dlg.close();openTickets(t.id)}}});
  box.prepend(el);while(box.children.length>3)box.lastElementChild.remove();
  setTimeout(()=>{if(el.isConnected&&!el.matches(":hover"))weg()},20000);
  tkGeluid();
  try{if(document.hidden&&"Notification" in window&&Notification.permission==="granted"){const n=new Notification((t.nummer||"Ticket")+": "+cleanName(t.klantNaam||"Klant"),{body:(t.onderwerp||"")+(t.laatsteTekst?"\n"+t.laatsteTekst:""),icon:"/logo.png",tag:"tk-"+t.id});n.onclick=()=>{window.focus();openTickets(t.id);n.close()}}}catch(e){}}
if(LIVE&&"Notification" in window&&Notification.permission==="default")document.addEventListener("click",function q(){document.removeEventListener("click",q);try{Notification.requestPermission()}catch(e){}},{once:true});

/* ---------- ticketoverzicht ---------- */
function openTickets(id,nieuwVoor,verzoeken){
  if(!LIVE)return toast("Tickets werken in de live versie");
  if(verzoeken===undefined)verzoeken=!id&&!nieuwVoor&&!tkOngelezen().length&&(state.portaalVz||[]).length>0;
  tkOpen={id:id||"",filter:verzoeken?"verzoeken":"actief",unsub:null,berichten:[],foto:null,nieuwVoor:nieuwVoor||""};
  openDlg(`<div class="dlg-head"><span class="objic big tk-ic">${I.ticket}</span><div style="min-width:0;flex:1"><h3>Tickets</h3><div class="subt">Tickets en verzoeken van klanten via het klantportaal</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="chx"><div class="chx-l"><div class="seg tk-seg" role="group" id="tkSeg"></div><label class="chx-z">${I.search}<input type="search" id="chxZ" placeholder="Zoek ticket of klant…" autocomplete="off"></label><div id="chxL"></div></div><div class="chx-r" id="chxR"></div></div>`,{xwide:true});
  dlg.addEventListener("close",()=>{if(tkOpen&&tkOpen.unsub)tkOpen.unsub();tkOpen=null},{once:true});
  tkSegTeken();
  $("#chxZ").oninput=tkLijstTeken;tkLijstTeken();
  if(nieuwVoor)tkNieuw(nieuwVoor);
  else if(verzoeken){const v=(state.portaalVz||[])[0];if(v&&!matchMedia("(max-width:760px)").matches)vzDetail(v.id);else $("#chxR").innerHTML=`<p class="subt chx-leeg">${v?"Kies een verzoek.":"Alle verzoeken zijn afgehandeld."}</p>`}
  else{const eerste=id||(!matchMedia("(max-width:760px)").matches&&((tkOngelezen()[0]||state.tickets.find(t=>t.status!=="opgelost")||{}).id));if(eerste)tkDetail(eerste);else $("#chxR").innerHTML=`<p class="subt chx-leeg">Geen ticket gekozen.<br>Zoek een klant om zelf een ticket te starten.</p>`}}
function tkSegTeken(){const S_=$("#tkSeg");if(!S_||!tkOpen)return;const vz=(state.portaalVz||[]).length;
  if(!vz&&tkOpen.filter==="verzoeken")tkOpen.filter="actief";
  S_.innerHTML=[["actief","Lopend"],...(vz?[["verzoeken","Verzoeken"+` <i class="tk-n">${vz}</i>`]]:[]),["opgelost","Opgelost"],["alle","Alle"]].map(([v,l])=>`<button type="button" data-tkf="${v}" aria-pressed="${v===tkOpen.filter}">${l}</button>`).join("");
  S_.querySelectorAll("[data-tkf]").forEach(b=>b.onclick=()=>{tkOpen.filter=b.dataset.tkf;tkOpen.lsig="";tkSegTeken();tkLijstTeken()})}
function vzDetail(id){const v=(state.portaalVz||[]).find(x=>x.id===id),R=$("#chxR");if(!R||!tkOpen)return;
  if(tkOpen.unsub){tkOpen.unsub();tkOpen.unsub=null}tkOpen.id="vz:"+id;tkOpen.lsig="";tkLijstTeken();
  if(!v){R.innerHTML=`<p class="subt chx-leeg">Dit verzoek is al afgehandeld.</p>`;return}
  const k=state.klanten.find(x=>x.id===v.klantId)||{naam:v.klantNaam||""},T=PT_TYPE[v.type]||["Verzoek"];
  R.innerHTML=tkKop(k,`<b>${esc(T[0])}</b><small class="subt" style="display:block">${esc(cleanName(k.naam||""))} · klantverzoek</small>`)+`<div class="vz-body">${ptRij(v)}</div>`;
  const pa=R.querySelector(".pt-act");if(pa){const i=pa.querySelector("[data-ant]");if(i)i.remove();pa.insertAdjacentHTML("afterbegin",`<button type="button" class="small primary" id="vzAntw">${I.send}Beantwoorden</button>`);const ok=pa.querySelector("[data-ptok]");if(ok)ok.classList.remove("primary")}
  const an=$("#vzAntw");if(an)an.onclick=async()=>{an.disabled=true;try{const tid=await vzNaarTicket(v);ptKaart();tkOpen.filter="actief";tkSegTeken();tkDetail(tid);setTimeout(()=>{const t=$("#chxT");if(t)t.focus()},120)}catch(e){an.disabled=false;err(e)}};
  tkTerugBind();
  const b=R.querySelector("[data-ptok]");if(b)b.onclick=async()=>{b.disabled=true;try{await ptAfhandelen(id);ptKaart();const nx=(state.portaalVz||[])[0];if(nx&&!matchMedia("(max-width:760px)").matches)vzDetail(nx.id);else{R.innerHTML=`<p class="subt chx-leeg">${nx?"Kies een verzoek.":"Alle verzoeken zijn afgehandeld."}</p>`}}catch(e){b.disabled=false;err(e)}}}
/* een (oud) klantverzoek omzetten in een ticket, zodat je kunt antwoorden en de klant het gesprek in zijn portaal ziet */
function vzTekst(v){const r=[],dl=x=>x?parse(x).toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"}):"";
  if(v.type==="verzetten")r.push(`Ik wil mijn afspraak${v.datum?" van "+dl(v.datum):""} graag verzetten.`);
  if(v.type==="overslaan")r.push(`Ik wil het bezoek${v.datum?" van "+dl(v.datum):""} graag overslaan.`);
  if(v.type==="vakantie")r.push(`Ik ben afwezig van ${dl(v.datum)} tot en met ${dl(v.tot)}.`);
  if(v.type==="extra")r.push("Ik wil graag een extra dienst"+(v.diensten&&v.diensten.length?": "+v.diensten.join(", ").toLowerCase():"")+".");
  if(v.type==="stoppen")r.push("Ik wil mijn abonnement opzeggen.");
  if(v.type==="gegevens")r.push("Ik heb mijn gegevens gewijzigd: "+Object.keys(v.wijziging||{}).map(f=>f+" "+((v.oud||{})[f]||"–")+" → "+(v.wijziging[f]||"–")).join(", ")+".");
  if(v.type==="beoordeling")r.push(`Beoordeling van het bezoek${v.datum?" van "+dl(v.datum):""}: ${v.sterren} van 5 sterren.`);
  if(v.voorkeur)r.push("Voorkeur: "+v.voorkeur);if(v.tekst)r.push(v.tekst);return r.join("\n")}
async function vzNaarTicket(v){const id=newId("tk"),tekst=vzTekst(v),op=v.op||new Date().toISOString();
  const n=await fsDb().runTransaction(async tr=>{const r=fsDb().doc("tellers/tickets"),x=await tr.get(r);const w=(x.exists?x.data().n:1000)+1;tr.set(r,{n:w});return w});
  const T=PT_TYPE[v.type]||["Verzoek"],cat=["verzetten","overslaan","vakantie"].includes(v.type)?"planning":v.type==="beoordeling"?"kwaliteit":"overig";
  const t={klantId:v.klantId,klantNaam:v.klantNaam||"",adres:v.adres||"",nummer:"T-"+n,onderwerp:T[0]+(v.datum&&v.type!=="beoordeling"?" · "+fmtD(v.datum):""),categorie:cat,status:"open",aangemaakt:op,laatst:op,laatsteTekst:tekst.split("\n")[0],laatsteVan:"klant",ongelezenTeam:0,ongelezenKlant:0,bron:"portaal",verzoek:{type:v.type,datum:v.datum||"",tot:v.tot||""}};
  await fsDb().doc("tickets/"+id).set(t);
  await fsDb().collection("ticketBerichten").doc(newId("tb")).set({ticketId:id,klantId:v.klantId,van:"klant",tekst,foto:"",op});
  await fsDb().doc("portaalVerzoeken/"+v.id).set({status:"ticket",ticketId:id},{merge:true});
  state.portaalVz=(state.portaalVz||[]).filter(x=>x.id!==v.id);
  if(!state.tickets.some(x=>x.id===id))state.tickets.unshift({id,...t});return id}
function tkLijstTeken(){const L=$("#chxL");if(!L||!tkOpen)return;const q=(($("#chxZ")||{}).value||"").trim().toLowerCase();
  if(tkOpen.filter==="verzoeken"){const vl=(state.portaalVz||[]).filter(v=>!q||[v.klantNaam,v.adres,v.tekst].join(" ").toLowerCase().includes(q));
    L.innerHTML=vl.map(v=>{const T=PT_TYPE[v.type]||["Verzoek"];return `<button type="button" class="chx-i nieuw${"vz:"+v.id===tkOpen.id?" act":""}" data-vzi="${esc(v.id)}"><span class="chx-av" style="--h:${hue(v.klantNaam||"")}">${esc(initials(cleanName(v.klantNaam||"?")))}</span><span class="chx-t"><b>${esc(T[0])}</b><small>${esc(cleanName(v.klantNaam||""))}${v.datum?" · "+esc(fmtD(v.datum)):""}</small></span><span class="chx-m"><small>${v.op?esc(tkTijd(v.op)):""}</small></span></button>`}).join("")||`<p class="subt" style="padding:20px 10px;text-align:center">${q?"Niets gevonden":"Geen open verzoeken"}</p>`;
    L.querySelectorAll("[data-vzi]").forEach(b=>b.onclick=()=>vzDetail(b.dataset.vzi));return}
  const rij=state.tickets.filter(t=>(tkOpen.filter==="alle"||(tkOpen.filter==="opgelost"?t.status==="opgelost":t.status!=="opgelost"))&&(!q||[t.klantNaam,t.adres,t.nummer,t.onderwerp].join(" ").toLowerCase().includes(q)));
  const extra=q.length>=2?state.klanten.filter(k=>[k.naam,k.adres,k.plaats,k.email].join(" ").toLowerCase().includes(q)).slice(0,6):[];
  L.innerHTML=rij.map(t=>{const st=TK_ST[t.status]||TK_ST.open;return `<button type="button" class="chx-i${t.id===tkOpen.id?" act":""}${Number(t.ongelezenTeam)>0?" nieuw":""}" data-tki="${esc(t.id)}"><span class="chx-av" style="--h:${hue(t.klantNaam||"")}">${esc(initials(cleanName(t.klantNaam||"?")))}</span><span class="chx-t"><b>${esc(t.onderwerp||"Ticket")}</b><small>${esc(cleanName(t.klantNaam||""))} · ${esc(t.nummer||"")}</small></span><span class="chx-m"><small>${t.laatst?esc(tkTijd(t.laatst)):""}</small>${Number(t.ongelezenTeam)>0?`<i>${t.ongelezenTeam}</i>`:`<i class="tk-dot" style="background:var(--${st[0]})" title="${st[1]}"></i>`}</span></button>`}).join("")
    +(extra.length?`<p class="eyebrow" style="margin:12px 10px 6px">Ticket starten voor</p>`+extra.map(k=>`<button type="button" class="chx-i" data-tkn="${esc(k.id)}"><span class="chx-av" style="--h:${hue(k.naam||"")}">${esc(initials(cleanName(k.naam)))}</span><span class="chx-t"><b>${esc(cleanName(k.naam))}</b><small>${esc([k.adres,k.plaats].filter(Boolean).join(", "))}</small></span>${I.plus}</button>`).join(""):"")
    ||`<p class="subt" style="padding:20px 10px;text-align:center">${q?"Niets gevonden":tkOpen.filter==="opgelost"?"Nog geen opgeloste tickets":"Geen lopende tickets"}</p>`;
  L.querySelectorAll("[data-tki]").forEach(b=>b.onclick=()=>tkDetail(b.dataset.tki));
  L.querySelectorAll("[data-tkn]").forEach(b=>b.onclick=()=>tkNieuw(b.dataset.tkn))}
const tkTijd=s=>{const d=new Date(s),t=new Date();return d.toDateString()===t.toDateString()?d.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):d.toLocaleDateString("nl-NL",{day:"numeric",month:"short"})};
const TK_SNEL=["Bedankt voor uw bericht, we gaan ermee aan de slag.","We komen het bij het volgende bezoek oplossen.","We hebben het aangepast. Is het zo goed?","Fijn om te horen, dan sluiten we dit ticket."];
const tkComposer=(k,extra="")=>`<div class="chx-s">${TK_SNEL.map(x=>`<button type="button" data-chs="${esc(x)}">${esc(x)}</button>`).join("")}</div>${extra}
    <div class="chx-p" id="chxP" hidden></div>
    <div class="chx-in"><label class="btn iconbtn" title="Foto toevoegen" aria-label="Foto toevoegen">${I.camera||I.upload}<input type="file" accept="image/*" id="chxF" hidden></label><textarea id="chxT" rows="1" placeholder="Antwoord aan ${esc(voornaam(k.contact||cleanName(k.naam||"")))}…"></textarea><button type="button" class="primary chx-hb" id="chxS">${I.send}<span>Versturen</span></button></div>`;
function tkBindComposer(onSend){const t=$("#chxT"),groei=()=>{t.style.height="auto";t.style.height=Math.min(t.scrollHeight,140)+"px"};t.oninput=groei;
  t.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSend()}};
  form.querySelectorAll("[data-chs]").forEach(b=>b.onclick=()=>{t.value=b.dataset.chs;groei();t.focus()});
  $("#chxS").onclick=onSend;
  $("#chxF").onchange=e=>{const f=e.target.files[0];e.target.value="";if(!f)return;tkOpen.foto=f;const p=$("#chxP");p.hidden=false;p.innerHTML=`<img src="${URL.createObjectURL(f)}" alt=""><span>${esc(f.name)}</span><button type="button" class="iconbtn sm ghost" id="chxPx" aria-label="Verwijderen">${I.x}</button>`;$("#chxPx").onclick=()=>{tkOpen.foto=null;p.hidden=true;p.innerHTML=""}};
  setTimeout(()=>t.focus(),60)}
function tkKop(k,inhoud){return `<div class="chx-h"><button type="button" class="iconbtn sm chx-terug" id="chxTerug" aria-label="Terug naar tickets">${I.left||"‹"}</button><span class="chx-av big" style="--h:${hue(k.naam||"")}">${esc(initials(cleanName(k.naam||"?")))}</span><div style="flex:1;min-width:0">${inhoud}</div>${k.telefoon?`<a class="btn small chx-hb" href="tel:${esc(k.telefoon)}" title="Bellen">${I.phone||""}<span>Bellen</span></a>`:""}${k.id?`<button type="button" class="small chx-hb" data-act="klant" data-id="${esc(k.id)}" title="Klantkaart">${I.user||""}<span>Klantkaart</span></button>`:""}</div>`}
function tkTerugBind(){$("#chxTerug").onclick=()=>{if(tkOpen.unsub)tkOpen.unsub();tkOpen.unsub=null;tkOpen.id="";$("#chxR").innerHTML=`<p class="subt chx-leeg"></p>`;tkLijstTeken()}}
function tkDetail(id){if(!tkOpen)return;if(tkOpen.unsub)tkOpen.unsub();tkOpen.id=id;tkOpen.berichten=[];tkOpen.foto=null;
  const t=state.tickets.find(x=>x.id===id)||{id},k=state.klanten.find(x=>x.id===t.klantId)||{naam:t.klantNaam||"Klant"};
  tkLijstTeken();
  $("#chxR").innerHTML=tkKop(k,`<b>${esc(t.onderwerp||"Ticket")}</b><small>${esc(t.nummer||"")} · ${esc(TK_CAT[t.categorie]||"Overig")} · ${esc(cleanName(k.naam))}${k.gepland?" · afspraak "+esc(fmtD(k.gepland)):""}</small>`)
    +(t.verzoek&&k.id?`<div class="tk-vz"><span class="pill soon">${esc((PT_TYPE[t.verzoek.type]||["Verzoek"])[0])}</span><span>${t.verzoek.datum?esc(t.verzoek.type==="vakantie"?"Van "+fmtD(t.verzoek.datum)+" t/m "+fmtD(t.verzoek.tot):"Afspraak "+fmtD(t.verzoek.datum)):""}</span><span class="sp"></span>${k.gepland?`<button type="button" class="small" data-act="job" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}">${I.planning}Afspraak openen</button>`:""}</div>`:"")
    +`<div class="tk-stbar"><span>Status</span><div class="seg" role="group">${Object.entries(TK_ST).map(([v,[c,l]])=>`<button type="button" data-tks="${v}" aria-pressed="${(t.status||"open")===v}"><i class="tk-dot" style="background:var(--${c})"></i>${l}</button>`).join("")}</div></div>
    <div class="chx-b" id="chxB"><p class="subt" style="margin:auto">Laden…</p></div>`+tkComposer(k)
    +`<small class="help" style="margin:4px 4px 0">${t.gezienKlant&&Date.now()-new Date(t.gezienKlant)<3*60e3?`<span class="sdot ok"></span> De klant kijkt nu in het portaal`:"De klant krijgt een mail met een knop naar dit ticket als hij niet online is."}</small>`;
  tkTerugBind();
  form.querySelectorAll("[data-tks]").forEach(b=>b.onclick=()=>tkStatus(t,b.dataset.tks));
  tkOpen.unsub=fsDb().collection("ticketBerichten").where("ticketId","==",id).onSnapshot(s=>{if(!tkOpen||tkOpen.id!==id)return;tkOpen.berichten=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.op).localeCompare(String(b.op)));tkBerichtenTeken();
    fsDb().doc("tickets/"+id).set({ongelezenTeam:0,gezienTeam:new Date().toISOString()},{merge:true}).catch(()=>{})},e=>{console.error(e);$("#chxB").innerHTML=`<p class="subt" style="margin:auto">Laden lukte niet</p>`});
  tkBindComposer(()=>tkVerstuur(t,k))}
function tkBerichtenTeken(){const b=$("#chxB");if(!b||!tkOpen)return;const bij=b.scrollHeight-b.scrollTop-b.clientHeight<140;let dag="";
  const t=state.tickets.find(x=>x.id===tkOpen.id)||{},laatsteTeam=[...tkOpen.berichten].reverse().find(m=>m.van==="team"&&!m.systeem);
  b.innerHTML=tkOpen.berichten.map(m=>{const d=new Date(m.op).toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"});const sep=d!==dag?(dag=d,`<div class="chx-dag"><span>${esc(d)}</span></div>`):"";
    if(m.systeem)return sep+`<div class="tk-sys2">${esc(m.tekst)} · ${new Date(m.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}</div>`;
    return sep+`<div class="chx-m2 ${m.van==="team"?"ik":"zij"}">${m.foto?`<a href="${BLOB}${esc(m.foto)}" target="_blank" rel="noopener" class="chx-f"><img src="${BLOB}${esc(m.foto)}" alt="Foto"></a>`:""}${m.tekst?`<div class="chx-bb">${esc(m.tekst).replace(/\n/g,"<br>")}</div>`:""}<small>${m.van==="team"&&m.doorNaam?esc(m.doorNaam)+" · ":""}${new Date(m.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}${m===laatsteTeam?(t.gezienKlant&&t.gezienKlant>=m.op?" · gelezen":" · verzonden"):""}</small></div>`}).join("")||`<p class="subt" style="margin:auto">Nog geen berichten</p>`;
  if(bij)b.scrollTop=b.scrollHeight}
async function tkFotoUp(){const f=tkOpen&&tkOpen.foto;if(!f)return"";const r=await state.assets.upload(f);return r.id}
async function tkVerstuur(t,k){const tx=$("#chxT"),s=$("#chxS"),tekst=tx.value.trim();if(!tekst&&!(tkOpen&&tkOpen.foto))return;s.disabled=true;
  try{const foto=await tkFotoUp(),op=new Date().toISOString();
    await fsDb().collection("ticketBerichten").doc(newId("tb")).set({ticketId:t.id,klantId:t.klantId,van:"team",tekst,foto,op,door:(state.me&&state.me.email)||"",doorNaam:tkNaam()});
    const cur=state.tickets.find(x=>x.id===t.id)||t;
    await fsDb().doc("tickets/"+t.id).set({laatst:op,laatsteTekst:tekst||"Foto",laatsteVan:"team",ongelezenKlant:firebase.firestore.FieldValue.increment(1),ongelezenTeam:0,gezienTeam:op,...(cur.status==="open"?{status:"behandeling"}:{})},{merge:true});
    tx.value="";tx.style.height="auto";tkOpen.foto=null;const p=$("#chxP");if(p){p.hidden=true;p.innerHTML=""}
    if(cur.status==="open")setTimeout(()=>{if(tkOpen&&tkOpen.id===t.id)form.querySelectorAll("[data-tks]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.tks==="behandeling"))},50);
    fbFn("ticketMelding")({ticketId:t.id,basis:location.origin}).catch(e=>console.error("ticketMelding",e))}
  catch(e){err(e)}finally{s.disabled=false;tx.focus()}}
async function tkStatus(t,st){const cur=state.tickets.find(x=>x.id===t.id)||t;if((cur.status||"open")===st)return;const op=new Date().toISOString();
  try{await fsDb().doc("tickets/"+t.id).set({status:st,...(st==="opgelost"?{opgelostOp:op,laatst:op,laatsteTekst:"Ticket opgelost",laatsteVan:"team",ongelezenKlant:firebase.firestore.FieldValue.increment(1)}:{})},{merge:true});
    await fsDb().collection("ticketBerichten").doc(newId("tb")).set({ticketId:t.id,klantId:t.klantId,van:"team",systeem:true,tekst:"Status: "+TK_ST[st][1],op,door:(state.me&&state.me.email)||""});
    form.querySelectorAll("[data-tks]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.tks===st));toast(cur.nummer+" · "+TK_ST[st][1]);
    if(st==="opgelost"){fbFn("ticketMelding")({ticketId:t.id,basis:location.origin}).catch(()=>{});try{await creditsVoorTicket(cur)}catch(e){console.error("credits",e)}}}catch(e){err(e)}}
/* extra dienst via een offerte: een bestaande klant (al eerder een beurt gehad) tekent online of gaat akkoord.
   Zelfde credits als een extra dienst uit het portaal (Instellingen › crExtra). Eén keer per offerte: vaste id, dus ook
   als twee apparaten het tegelijk doen blijft het bij één keer. Een nieuwe klant (eerste offerte) krijgt ze niet. */
function offIsExtra(f,k){if(!f||!k||f.soort!=="offerte")return false;const d=String(f.datum||"9999-12-31");
  return (state.beurten||[]).some(b=>b.klantId===k.id&&String(b.datum||"")<d)||(!!k.laatst&&String(k.laatst)<d)}
const _crOff=new Set();
const crExtraRecent=k=>{const g=iso(addDays(today(),-60));return [...(k.tegoed||[]),...(k.tegoedGebruikt||[])].some(x=>x&&x.bron==="extra"&&String(x.op||"")>=g)};
async function creditsVoorOfferte(f){if(!f||_crOff.has(f.id))return false;const k=state.klanten.find(x=>x.id===f.klantId);if(!k||!offIsExtra(f,k))return false;
  const s=S(),n=s.crExtra!=null&&s.crExtra!==""?Number(s.crExtra):3;if(!(n>0))return false;
  const tid="tg_off_"+f.id;if([...(k.tegoed||[]),...(k.tegoedGebruikt||[])].some(x=>x&&(x.id===tid||x.ref===f.id)))return false;
  /* al credits voor een extra dienst in de afgelopen 60 dagen (bijv. via het ticket "Extra dienst aanvragen"): niet dubbel */
  if(crExtraRecent(k))return false;_crOff.add(f.id);
  const reden="Credits: extra dienst besteld (offerte "+(f.nummer||"")+")";
  try{await save("klanten",k.id,{...strip(k),tegoed:[...(k.tegoed||[]),{id:tid,bedrag:n,reden,bron:"extra",ref:f.id,op:iso(today())}],log:[...(k.log||[]),{datum:iso(today()),tekst:reden+" · "+n+" credit"+(n===1?"":"s")+" (€ "+n+") op de volgende factuur"}]});
    toast(cleanName(k.naam)+": "+n+" credits voor de extra dienst");return true}catch(e){_crOff.delete(f.id);console.error("credits offerte",e);return false}}
/* ondertekende of geaccepteerde offertes van de afgelopen 60 dagen nalopen (ook die van vóór deze regeling, zoals een getekende offerte voor glasbewassing binnen) */
function creditsOffertesCheck(){if(!state.loaded||(typeof isMw==="function"&&isMw()))return;const grens=iso(addDays(today(),-60));
  state.facturen.filter(f=>f.soort==="offerte"&&(f.getekend||(f.status==="geaccepteerd"&&String(f.akkoordOp||"")>="2026-10-29"))&&!_crOff.has(f.id)&&String((f.getekend&&(f.getekend.datum||f.getekend.op))||f.akkoordOp||f.datum||"").slice(0,10)>=grens).forEach(f=>{creditsVoorOfferte(f)})}
if(typeof window!=="undefined")setInterval(()=>{try{creditsOffertesCheck()}catch(e){}},15000);

/* credits (portaal) toekennen als een review- of extra-dienst-ticket is opgelost; één keer per ticket */
/* extra dienst: géén credits bij het afsluiten van het ticket; die komen pas als de klant akkoord gaat met de offerte (creditsVoorOfferte) */
async function creditsVoorTicket(t){const vt=t.verzoek&&t.verzoek.type;if(vt!=="review")return;const k=state.klanten.find(x=>x.id===t.klantId);if(!k)return;
  const s=S(),n=vt==="review"?0:(s.crExtra!=null&&s.crExtra!==""?Number(s.crExtra):3);if(!(n>0))return;
  const al=[...(k.tegoed||[]),...(k.tegoedGebruikt||[])].some(x=>x&&x.ref===t.id);if(al)return;
  if(vt==="extra"&&crExtraRecent(k))return;/* al credits via de getekende offerte voor deze extra dienst */
  const reden=vt==="review"?"Credits: Google-review":"Credits: extra dienst besteld";
  await save("klanten",k.id,{...strip(k),tegoed:[...(k.tegoed||[]),{id:newId("tg"),bedrag:n,reden,bron:vt,ref:t.id,op:iso(today())}],log:[...(k.log||[]),{datum:iso(today()),tekst:reden+" · "+n+" credit"+(n===1?"":"s")+" (€ "+n+") op de volgende factuur"}]});
  toast(`${n} credit${n===1?"":"s"} toegekend aan ${cleanName(k.naam)}`)}
/* zelf een ticket starten voor een klant */
function tkNieuw(kid){if(!tkOpen)return;if(tkOpen.unsub)tkOpen.unsub();tkOpen.unsub=null;tkOpen.id="";tkOpen.foto=null;const k=state.klanten.find(x=>x.id===kid);if(!k)return;tkLijstTeken();
  $("#chxR").innerHTML=tkKop(k,`<b>Nieuw ticket</b><small>${esc(cleanName(k.naam))} · ${esc([k.adres,k.plaats].filter(Boolean).join(", "))}</small>`)
    +`<div class="tk-new"><label>Onderwerp<input id="tkNo" maxlength="120" placeholder="Bijvoorbeeld: toegang achterom"></label><label>Soort<select id="tkNc">${Object.entries(TK_CAT).map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select></label></div><div class="chx-b"><p class="subt" style="margin:auto;text-align:center">Het eerste bericht opent het ticket.<br>De klant ziet het in zijn klantportaal en krijgt een mail.</p></div>`+tkComposer(k);
  tkTerugBind();
  tkBindComposer(async()=>{const tx=$("#chxT"),s=$("#chxS"),tekst=tx.value.trim(),ond=$("#tkNo").value.trim();if(!tekst){tx.focus();return}if(!ond){$("#tkNo").focus();toast("Vul een onderwerp in");return}
    s.disabled=true;try{const foto=await tkFotoUp(),op=new Date().toISOString(),id=newId("tk");
      const tel=await fsDb().runTransaction(async tr=>{const r=fsDb().doc("tellers/tickets"),x=await tr.get(r);const v=(x.exists?x.data().n:1000)+1;tr.set(r,{n:v});return v}).catch(()=>Date.now()%100000);
      await fsDb().doc("tickets/"+id).set({klantId:k.id,klantNaam:k.naam||"",adres:[k.adres,k.plaats].filter(Boolean).join(", "),nummer:"T-"+tel,onderwerp:ond,categorie:$("#tkNc").value,status:"behandeling",aangemaakt:op,laatst:op,laatsteTekst:tekst,laatsteVan:"team",ongelezenTeam:0,ongelezenKlant:1,gezienTeam:op,bron:"crm"});
      await fsDb().collection("ticketBerichten").doc(newId("tb")).set({ticketId:id,klantId:k.id,van:"team",tekst,foto,op,door:(state.me&&state.me.email)||"",doorNaam:tkNaam()});
      fbFn("ticketMelding")({ticketId:id,basis:location.origin}).catch(()=>{});toast("Ticket T-"+tel+" aangemaakt");setTimeout(()=>tkDetail(id),300)}catch(e){err(e);s.disabled=false}})}

/* klantkaart: code maken, link delen, en achteraf een aanbrenger koppelen */
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-act^='ref']");if(!b)return;const a=b.dataset.act,id=b.dataset.id;
  if(!["refmaak","refkopie","refwa","refkoppel"].includes(a))return;e.preventDefault();e.stopPropagation();const k=state.klanten.find(x=>x.id===id);if(!k)return;
  if(a==="refmaak"){b.disabled=true;try{const c=await refCodeZorg(id);toast("Code "+c+" gemaakt");kkHerteken(id)}catch(er){err(er);b.disabled=false}return}
  if(a==="refkopie"){const c=await refCodeZorg(id);try{await navigator.clipboard.writeText(refLink(c));toast("Link gekopieerd")}catch(_){toast(refLink(c))}return}
  if(a==="refwa"){const c=await refCodeZorg(id),S_=S(),tekst=`Hoi ${voornaam(k.contact||cleanName(k.naam))}, fijn dat u klant bent! Kent u iemand die ook schone ramen wil? Met uw persoonlijke link krijgt uw buur ${refEur(refWelkom())} korting op de eerste factuur en u krijgt ${refEur(refBeloning())} korting zodra wij er voor het eerst zijn geweest:\n${refLink(c)}\n\nUw code: ${c}\n\nGroet, ${S_.naam||""}`;
    const u=waLink(k.mobiel||k.telefoon,tekst);if(u)window.open(u,"_blank","noopener");return}
  if(a==="refkoppel"){const inp=b.parentElement.querySelector(".ref-kk"),c=refNorm(inp&&inp.value),r=refVan(c,id);
    if(!c){toast("Vul de code van de aanbrenger in");if(inp)inp.focus();return}
    if(!r){toast("Code "+c+" is niet bekend");if(inp)inp.focus();return}
    if(r.aanbevolenDoor===id){toast("Deze klanten kunnen elkaar niet allebei aanbevelen");return}
    if(!(await vraag("Aanbrenger koppelen",`${esc(cleanName(k.naam))} is aanbevolen door <b>${esc(cleanName(r.naam))}</b>.<br>${refWelkom()>0?esc(eur(refWelkom()))+" welkomstkorting gaat van de eerste factuur af. ":""}${esc(voornaam(r.contact||cleanName(r.naam)))} krijgt ${esc(eur(refBeloning()))} zodra de eerste afspraak is uitgevoerd.`,"Koppelen")))return;
    b.disabled=true;try{const cur=state.klanten.find(x=>x.id===id)||k;await save("klanten",id,{...strip(cur),...refKoppelPatch(cur,r)});toast("Gekoppeld aan "+cleanName(r.naam));kkHerteken(id)}catch(er){err(er);b.disabled=false}}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList&&e.target.classList.contains("ref-kk")){e.preventDefault();const b=e.target.parentElement.querySelector("[data-act=refkoppel]");if(b)b.click()}});
function kkHerteken(id){try{const p=document.querySelector("dialog[open]");if(p&&typeof openKlantView==="function"&&p.querySelector(".kp"))setTimeout(()=>openKlantView(id),60);else render()}catch(e){}}
/* eenmalige correctie (30-10-2026): credits voor een extra dienst die bij het afsluiten van het ticket werden gegeven, weer weghalen;
   ze komen nu pas bij akkoord op de offerte. Alleen nog niet gebruikte credits van vandaag. */
if(typeof window!=="undefined")setTimeout(async function w(){if(!state.loaded)return setTimeout(w,2000);if(typeof isMw==="function"&&isMw())return;
  for(const k of state.klanten.filter(k=>(k.tegoed||[]).some(x=>x&&x.bron==="extra"&&/^tk/.test(String(x.ref||""))&&String(x.op||"")>="2026-10-30"))){
    const weg=(k.tegoed||[]).filter(x=>x&&x.bron==="extra"&&/^tk/.test(String(x.ref||""))&&String(x.op||"")>="2026-10-30");
    try{await save("klanten",k.id,{...strip(k),tegoed:(k.tegoed||[]).filter(x=>!weg.includes(x)),log:[...(k.log||[]),{datum:iso(today()),tekst:"Credits extra dienst (€ "+weg.reduce((a,x)=>a+Number(x.bedrag||0),0)+") teruggezet: die komen pas bij akkoord op de offerte"}]})}catch(e){console.error("credits terug",e)}}},4000);
