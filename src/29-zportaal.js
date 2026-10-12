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
  return `<section class="kp"><div class="kp-h"><span class="objic" style="background:#e9a23b;color:#fff">${I.spark||I.user}</span><b>Klantportaal & aanbevelen</b><span class="sp"></span>${LIVE?`<button type="button" class="small" data-act="chatopen" data-id="${esc(k.id)}">${I.chat||I.mail}Chat</button><button type="button" class="small" data-act="ptinvite" data-id="${esc(k.id)}">${I.send}${k.portaalLaatst||k.portaalUitgenodigd?"Opnieuw uitnodigen":"Uitnodigen"}</button>`:""}</div>
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
    const det=[v.datum?(v.type==="vakantie"?"Van "+fmtD(v.datum)+" t/m "+fmtD(v.tot):"Afspraak "+fmtD(v.datum)):"",v.voorkeur?"Voorkeur: "+v.voorkeur:"",v.diensten&&v.diensten.length?v.diensten.join(", "):"",...(v.wijziging?Object.keys(v.wijziging).map(f=>f+": "+((v.oud||{})[f]||"–")+" → "+(v.wijziging[f]||"–")):[]),v.sterren?"★".repeat(v.sterren)+"☆".repeat(5-v.sterren):""].filter(Boolean);
    return `<div class="pt-vz" data-id="${esc(v.id)}"><div class="pt-vz-h"><span class="pill ${v.type==="beoordeling"||v.type==="stoppen"?"late":v.type==="bericht"?"neutral":"soon"}">${esc(T[0])}</span><b>${k?`<button type="button" class="linkbtn" data-act="klant" data-id="${esc(k.id)}">${esc(cleanName(k.naam))}</button>`:esc(cleanName(v.klantNaam))}</b><small>${esc(v.adres||"")}</small><span class="sp"></span><small>${esc(fmtD(String(v.op).slice(0,10)))} ${esc(String(v.op).slice(11,16))}</small></div>
      ${det.length?`<div class="pt-det">${det.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}${v.tekst?`<p class="pt-txt">${esc(v.tekst)}</p>`:""}
      <div class="pt-act"><input type="text" placeholder="Antwoord voor de klant (zichtbaar in het portaal, niet verplicht)" data-ant="${esc(v.id)}">
        ${v.type==="gegevens"?`<span class="pill ok">${I.check}Al bijgewerkt in het CRM</span>`:""}
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

/* ---------- chat met klanten (via het klantportaal) ---------- */
state.chats=state.chats||[];let chatUnsub=null,chatOpen=null;
const chatNaam=()=>{const n=String((state.me&&(state.me.name||state.me.email))||"").split("@")[0].split(/[.\s_-]/)[0];return n?n[0].toUpperCase()+n.slice(1):""};
const chatOngelezen=()=>(state.chats||[]).filter(c=>Number(c.ongelezenTeam)>0);
let chatVorig=null;
function liveChat(){if(!LIVE||chatUnsub)return;
  chatUnsub=fsDb().collection("chats").orderBy("laatst","desc").limit(150).onSnapshot(s=>{
    state.chats=s.docs.map(d=>({id:d.id,...d.data()}));
    try{chatKaart()}catch(e){}if(chatOpen)try{chatLijstTeken()}catch(e){}
    const nu_=Object.fromEntries(state.chats.map(c=>[c.id,Number(c.ongelezenTeam)||0]));
    if(chatVorig===null){const l=chatOngelezen();if(l.length)chatPopup(l[0],l.length>1?l.reduce((a,c)=>a+Number(c.ongelezenTeam),0):0)}
    else state.chats.filter(c=>c.laatsteVan==="klant"&&nu_[c.id]>(chatVorig[c.id]||0)&&!(chatOpen&&chatOpen.kid===c.id&&document.hasFocus())).forEach(c=>chatPopup(c));
    chatVorig=nu_},e=>console.error("chats",e))}
/* pop-up rechtsboven + geluidje + systeemmelding als het tabblad op de achtergrond staat */
function chatGeluid(){try{const A=new (window.AudioContext||window.webkitAudioContext)(),t=A.currentTime;[[880,0],[1320,.12]].forEach(([f,d])=>{const o=A.createOscillator(),g=A.createGain();o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.18,t+d+.02);g.gain.exponentialRampToValueAtTime(.001,t+d+.35);o.connect(g).connect(A.destination);o.start(t+d);o.stop(t+d+.4)});setTimeout(()=>A.close(),900)}catch(e){}}
function chatPopup(c,totaal){
  let box=document.getElementById("chatPops");if(!box){box=document.createElement("div");box.id="chatPops";box.className="ch-pops";box.setAttribute("aria-live","polite");document.body.appendChild(box)}
  box.querySelectorAll(`[data-kid="${CSS.escape(c.id)}"]`).forEach(x=>x.remove());
  const el=document.createElement("div");el.className="ch-pop";el.dataset.kid=c.id;el.setAttribute("role","alert");
  el.innerHTML=`<span class="chx-av" style="--h:${hue(c.klantNaam||"")}">${esc(initials(cleanName(c.klantNaam||"?")))}</span><div class="ch-pop-t"><small>${I.chat||""}${totaal?totaal+" ongelezen chatberichten":"Nieuw chatbericht"}</small><b>${esc(cleanName(c.klantNaam||"Klant"))}</b><p>${esc(String(c.laatsteTekst||"").slice(0,140))}</p>
    <div class="ch-pop-k"><button type="button" class="small primary" data-cp="open">${I.send}Beantwoorden</button><button type="button" class="small ghost" data-cp="x">Later</button></div></div><button type="button" class="iconbtn sm ghost ch-pop-x" data-cp="x" aria-label="Sluiten">${I.x}</button>`;
  const weg=()=>{el.classList.add("weg");setTimeout(()=>el.remove(),250)};
  el.addEventListener("click",e=>{const b=e.target.closest("[data-cp]");if(!b)return;weg();if(b.dataset.cp==="open"){if(dlg.open&&!chatOpen)dlg.close();if(chatOpen)chatGesprek(c.id);else openChat(c.id)}});
  box.prepend(el);while(box.children.length>3)box.lastElementChild.remove();
  setTimeout(()=>{if(el.isConnected&&!el.matches(":hover"))weg()},20000);
  chatGeluid();
  try{if(document.hidden&&"Notification" in window&&Notification.permission==="granted"){const n=new Notification("Chat: "+cleanName(c.klantNaam||"Klant"),{body:String(c.laatsteTekst||""),icon:"/logo.png",tag:"chat-"+c.id});n.onclick=()=>{window.focus();openChat(c.id);n.close()}}}catch(e){}
}
/* toestemming voor systeemmeldingen vragen bij de eerste klik in het CRM */
if(LIVE&&"Notification" in window&&Notification.permission==="default")document.addEventListener("click",function q(){document.removeEventListener("click",q);try{Notification.requestPermission()}catch(e){}},{once:true});
if(LIVE)setTimeout(function w(){state.loaded?liveChat():setTimeout(w,700)},900);
function chatKaart(){const l=chatOngelezen(),n=l.reduce((a,c)=>a+Number(c.ongelezenTeam),0);
  /* zijbalk (computer) */
  const side=document.querySelector("aside.side"),uc=document.getElementById("userCard");
  let el=document.getElementById("chatCard");
  if(side&&uc){if(!n){if(el)el.remove()}else{if(!el){el=document.createElement("div");el.id="chatCard";side.insertBefore(el,document.getElementById("ptCard")||uc)}
    const c=l[0],sig=l.map(x=>x.id+x.ongelezenTeam).join(",");if(el.dataset.sig!==sig){el.dataset.sig=sig;el.className="pt-card ch-card";
      el.innerHTML=`<button type="button" data-act="chatopen" data-id="${esc(c.id)}"><span class="pt-ic">${I.chat||I.mail}<i>${n}</i></span><span class="pt-tx"><b>${l.length>1?l.length+" chats":esc(cleanName(c.klantNaam))}</b><small>${esc(c.laatsteTekst||"")}</small></span>${I.right}</button>`}}}
  /* zwevende knop (telefoon) */
  let fb=document.getElementById("chatFab");
  if(!n){if(fb)fb.remove();return}
  if(!fb){fb=document.createElement("button");fb.type="button";fb.id="chatFab";fb.className="ch-fab";fb.dataset.act="chatopen";document.body.appendChild(fb)}
  fb.dataset.id=l[0].id;fb.setAttribute("aria-label",n+" nieuwe chatberichten");fb.innerHTML=`${I.chat||I.mail}<i>${n}</i>`}

async function openChat(kid){
  if(!LIVE)return toast("De chat werkt in de live versie");
  chatOpen={kid:kid||(matchMedia("(max-width:760px)").matches?"":((state.chats[0]||{}).id)||""),unsub:null,berichten:[],foto:null};
  openDlg(`<div class="dlg-head"><span class="objic big">${I.chat||I.mail}</span><div style="min-width:0;flex:1"><h3>Chat met klanten</h3><div class="subt">Berichten via het klantportaal</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="chx"><div class="chx-l"><label class="chx-z">${I.search}<input type="search" id="chxZ" placeholder="Zoek of start een chat…" autocomplete="off"></label><div id="chxL"></div></div><div class="chx-r" id="chxR"></div></div>`,{xwide:true});
  dlg.addEventListener("close",chatSluit,{once:true});
  $("#chxZ").oninput=chatLijstTeken;chatLijstTeken();if(chatOpen.kid)chatGesprek(chatOpen.kid);else if(!state.chats.length)$("#chxR").innerHTML=`<p class="subt chx-leeg">Nog geen gesprekken.<br>Zoek een klant om een chat te starten.</p>`}
function chatSluit(){if(chatOpen&&chatOpen.unsub)chatOpen.unsub();chatOpen=null}
function chatLijstTeken(){const L=$("#chxL");if(!L||!chatOpen)return;const q=(($("#chxZ")||{}).value||"").trim().toLowerCase();
  let rij=state.chats.filter(c=>!q||String(c.klantNaam+" "+(c.adres||"")).toLowerCase().includes(q));
  const extra=q.length>=2?state.klanten.filter(k=>!state.chats.some(c=>c.id===k.id)&&[k.naam,k.adres,k.plaats,k.email].join(" ").toLowerCase().includes(q)).slice(0,8):[];
  L.innerHTML=rij.map(c=>`<button type="button" class="chx-i${c.id===chatOpen.kid?" act":""}${Number(c.ongelezenTeam)>0?" nieuw":""}" data-chk="${esc(c.id)}"><span class="chx-av" style="--h:${hue(c.klantNaam||"")}">${esc(initials(cleanName(c.klantNaam||"?")))}</span><span class="chx-t"><b>${esc(cleanName(c.klantNaam||"Klant"))}</b><small>${c.laatsteVan==="team"?"U: ":""}${esc(c.laatsteTekst||"")}</small></span><span class="chx-m"><small>${c.laatst?esc(chatTijd(c.laatst)):""}</small>${Number(c.ongelezenTeam)>0?`<i>${c.ongelezenTeam}</i>`:""}</span></button>`).join("")
    +(extra.length?`<p class="eyebrow" style="margin:12px 10px 6px">Nieuwe chat starten</p>`+extra.map(k=>`<button type="button" class="chx-i" data-chk="${esc(k.id)}"><span class="chx-av" style="--h:${hue(k.naam||"")}">${esc(initials(cleanName(k.naam)))}</span><span class="chx-t"><b>${esc(cleanName(k.naam))}</b><small>${esc([k.adres,k.plaats].filter(Boolean).join(", "))}</small></span></button>`).join(""):"")
    ||`<p class="subt" style="padding:20px 10px;text-align:center">${q?"Geen klant gevonden":"Nog geen gesprekken"}</p>`;
  L.querySelectorAll("[data-chk]").forEach(b=>b.onclick=()=>chatGesprek(b.dataset.chk))}
const chatTijd=s=>{const d=new Date(s),t=new Date();return d.toDateString()===t.toDateString()?d.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):d.toLocaleDateString("nl-NL",{day:"numeric",month:"short"})};
const CH_SNEL=["Bedankt voor uw bericht, we passen het aan.","We komen morgen bij u langs.","Ik bel u zo even.","Geen probleem, we plannen u opnieuw in.","Fijn om te horen, bedankt!"];
function chatGesprek(kid){if(!chatOpen)return;if(chatOpen.unsub)chatOpen.unsub();chatOpen.kid=kid;chatOpen.berichten=[];chatOpen.foto=null;
  const k=state.klanten.find(x=>x.id===kid)||{id:kid,naam:(state.chats.find(c=>c.id===kid)||{}).klantNaam||"Klant"},c=state.chats.find(x=>x.id===kid)||{};
  chatLijstTeken();
  $("#chxR").innerHTML=`<div class="chx-h"><button type="button" class="iconbtn sm chx-terug" id="chxTerug" aria-label="Terug naar gesprekken">${I.left||"‹"}</button><span class="chx-av big" style="--h:${hue(k.naam||"")}">${esc(initials(cleanName(k.naam)))}</span><div style="flex:1;min-width:0"><b>${esc(cleanName(k.naam))}</b><small>${esc([k.adres,k.plaats].filter(Boolean).join(", "))}${k.gepland?" · volgende afspraak "+esc(fmtD(k.gepland))+(k.tijd?" "+esc(k.tijd):""):""}</small></div>${k.telefoon?`<a class="btn small chx-hb" href="tel:${esc(k.telefoon)}" title="Bellen">${I.phone||""}<span>Bellen</span></a>`:""}<button type="button" class="small chx-hb" data-act="klant" data-id="${esc(kid)}" title="Klantkaart">${I.user||""}<span>Klantkaart</span></button></div>
    <div class="chx-b" id="chxB"><p class="subt" style="margin:auto">Laden…</p></div>
    <div class="chx-s">${CH_SNEL.map(x=>`<button type="button" data-chs="${esc(x)}">${esc(x)}</button>`).join("")}</div>
    <div class="chx-p" id="chxP" hidden></div>
    <div class="chx-in"><label class="btn iconbtn" title="Foto toevoegen" aria-label="Foto toevoegen">${I.camera||I.upload}<input type="file" accept="image/*" id="chxF" hidden></label><textarea id="chxT" rows="1" placeholder="Bericht aan ${esc(voornaam(k.contact||cleanName(k.naam)))}…"></textarea><button type="button" class="primary chx-hb" id="chxS">${I.send}<span>Versturen</span></button></div>
    <small class="help" style="margin:4px 4px 0">${c.gezienKlant&&Date.now()-new Date(c.gezienKlant)<3*60e3?`<span class="sdot ok"></span> ${esc(voornaam(k.contact||cleanName(k.naam)))} is nu in het portaal`:"De klant krijgt een mail met een knop naar dit gesprek als hij niet online is."}</small>`;
  chatOpen.unsub=fsDb().collection("chatBerichten").where("klantId","==",kid).onSnapshot(s=>{if(!chatOpen||chatOpen.kid!==kid)return;chatOpen.berichten=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.op).localeCompare(String(b.op)));chatBerichtenTeken();
    const cc=state.chats.find(x=>x.id===kid);if(cc&&Number(cc.ongelezenTeam)>0||!cc)fsDb().doc("chats/"+kid).set({ongelezenTeam:0,gezienTeam:new Date().toISOString()},{merge:true}).catch(()=>{});
    else fsDb().doc("chats/"+kid).set({gezienTeam:new Date().toISOString()},{merge:true}).catch(()=>{})},e=>{console.error(e);$("#chxB").innerHTML=`<p class="subt" style="margin:auto">Laden lukte niet</p>`});
  $("#chxTerug").onclick=()=>{if(chatOpen.unsub)chatOpen.unsub();chatOpen.unsub=null;chatOpen.kid="";$("#chxR").innerHTML="";chatLijstTeken()};
  const t=$("#chxT"),groei=()=>{t.style.height="auto";t.style.height=Math.min(t.scrollHeight,140)+"px"};t.oninput=groei;
  t.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();chatVerstuur(k)}};
  form.querySelectorAll("[data-chs]").forEach(b=>b.onclick=()=>{t.value=b.dataset.chs;groei();t.focus()});
  $("#chxS").onclick=()=>chatVerstuur(k);
  $("#chxF").onchange=e=>{const f=e.target.files[0];e.target.value="";if(!f)return;chatOpen.foto=f;const p=$("#chxP");p.hidden=false;p.innerHTML=`<img src="${URL.createObjectURL(f)}" alt=""><span>${esc(f.name)}</span><button type="button" class="iconbtn sm ghost" id="chxPx" aria-label="Verwijderen">${I.x}</button>`;$("#chxPx").onclick=()=>{chatOpen.foto=null;p.hidden=true;p.innerHTML=""}};
  setTimeout(()=>t.focus(),60)}
function chatBerichtenTeken(){const b=$("#chxB");if(!b||!chatOpen)return;const bij=b.scrollHeight-b.scrollTop-b.clientHeight<140;let dag="";
  const c=state.chats.find(x=>x.id===chatOpen.kid)||{},laatsteTeam=[...chatOpen.berichten].reverse().find(m=>m.van==="team");
  b.innerHTML=chatOpen.berichten.length?chatOpen.berichten.map(m=>{const d=new Date(m.op).toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"});const sep=d!==dag?(dag=d,`<div class="chx-dag"><span>${esc(d)}</span></div>`):"";
    return sep+`<div class="chx-m2 ${m.van==="team"?"ik":"zij"}">${m.foto?`<a href="${BLOB}${esc(m.foto)}" target="_blank" rel="noopener" class="chx-f"><img src="${BLOB}${esc(m.foto)}" alt="Foto"></a>`:""}${m.tekst?`<div class="chx-bb">${esc(m.tekst).replace(/\n/g,"<br>")}</div>`:""}<small>${m.van==="team"&&m.doorNaam?esc(m.doorNaam)+" · ":""}${new Date(m.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}${m===laatsteTeam?(c.gezienKlant&&c.gezienKlant>=m.op?" · gelezen":" · verzonden"):""}</small></div>`}).join(""):`<p class="subt" style="margin:auto;text-align:center">Nog geen berichten.<br>Stuur het eerste bericht.</p>`;
  if(bij)b.scrollTop=b.scrollHeight}
async function chatVerstuur(k){const t=$("#chxT"),s=$("#chxS"),tekst=t.value.trim(),f=chatOpen&&chatOpen.foto;if(!tekst&&!f)return;s.disabled=true;
  try{let foto="";if(f){const r=await state.assets.upload(f);foto=r.id}
    const op=new Date().toISOString(),naam=chatNaam();
    await fsDb().collection("chatBerichten").doc(newId("cb")).set({klantId:k.id,van:"team",tekst,foto,op,door:(state.me&&state.me.email)||"",doorNaam:naam});
    await fsDb().doc("chats/"+k.id).set({klantId:k.id,klantNaam:k.naam||"",adres:[k.adres,k.plaats].filter(Boolean).join(", "),laatst:op,laatsteTekst:tekst||"Foto",laatsteVan:"team",ongelezenKlant:firebase.firestore.FieldValue.increment(1),ongelezenTeam:0,gezienTeam:op},{merge:true});
    t.value="";t.style.height="auto";chatOpen.foto=null;const p=$("#chxP");if(p){p.hidden=true;p.innerHTML=""}
    fbFn("chatMelding")({klantId:k.id,basis:location.origin}).catch(e=>console.error("chatMelding",e))}
  catch(e){err(e)}finally{s.disabled=false;t.focus()}}
