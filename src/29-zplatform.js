/* ---------- Mansard-platform (alleen voor de eigenaar van Mansard) ----------
   De Mollie-sleutel waarmee nieuwe bedrijven hun abonnement betalen, en de afzender voor hun mails.
   Sleutels plak je hier zelf; ze gaan rechtstreeks naar de server en komen nooit terug in het scherm. */
const platformEigenaar=()=>{try{return LIVE&&["robin@mansard.nl","robin@mijnschoonmaker.com"].includes(String((firebase.auth().currentUser||{}).email||"").toLowerCase())}catch(e){return false}};
let PLAT=null;
async function platLaad(){if(!platformEigenaar()||typeof fbFn!=="function")return;try{PLAT=(await fbFn("platformSleutels")({})).data||null;const el=document.querySelector('[data-v="platform"]');if(el&&state.tab==="instellingen")render()}catch(e){PLAT={fout:typeof fnFout==="function"?fnFout(e):e.message}}}
SETCARDS.push({id:"platform",t:"Mansard-platform",sub:"Abonnementen en mail voor nieuwe bedrijven",ic:"shield",bg:"#252c3c",
  st:()=>{if(!PLAT){setTimeout(platLaad,0);return["soon","Laden…"]}if(PLAT.fout)return["soon","Niet gelukt"];return PLAT.mollie==="live"&&PLAT.afzender?["ok","Klaar voor nieuwe bedrijven"]:["soon","Nog niet ingesteld"]},
  rows:()=>PLAT&&!PLAT.fout?[["Mollie Mansard",PLAT.mollie==="live"?"Live":PLAT.mollie==="test"?"Testsleutel":"Niet ingesteld"],["Afzender",PLAT.afzender||"Niet ingesteld"]]:[["Status","—"]],
  warn:()=>PLAT&&!PLAT.fout&&(!PLAT.mollie||!PLAT.afzender)?"Zolang dit niet is ingesteld, kunnen nieuwe bedrijven geen abonnement afsluiten en geen mail versturen via Mansard.":"",v:"Instellen"});
SETEXTRA.platform=c=>{const P=PLAT||{};
  setDlg(c,`${info("Alleen jij ziet dit. Nieuwe bedrijven betalen hun abonnement via het Mollie-account van <b>Mansard</b>, en mails die ze zonder eigen Brevo versturen gaan uit vanaf een afzender van <b>Mansard</b>. Zonder deze gegevens wordt nooit iets van mijnschoonmaker gebruikt: dan staat abonneren en mailen voor nieuwe bedrijven gewoon nog dicht.")}
    ${sec("Abonnementen (Mollie van Mansard)")}<p class="subt" style="margin:0 0 8px">Nu: <b>${P.mollie==="live"?"live sleutel ingesteld":P.mollie==="test"?"testsleutel ingesteld":"niet ingesteld"}</b></p>
    ${inp("_pmk","Nieuwe Mollie API-sleutel (live_… of test_…)","",{type:"password",attrs:'autocomplete="off"',cls:"full",ph:"Plak hier de sleutel uit het Mollie-dashboard van Mansard",help:"Laat leeg om de huidige te houden."})}
    ${sec("Mail voor nieuwe bedrijven")}${inp("_paf","Afzender (in Brevo goedgekeurd)",P.afzender||"",{type:"email",ph:"noreply@mansard.nl"})}${inp("_pan","Naam afzender (optioneel)",P.afzenderNaam||"",{ph:"Leeg = naam van het bedrijf zelf"})}
    ${inp("_pbk","Eigen Brevo-sleutel voor Mansard (optioneel)","",{type:"password",attrs:'autocomplete="off"',cls:"full",ph:"xkeysib-…",help:P.brevo?"Er staat al een eigen Brevo-sleutel. Laat leeg om die te houden.":"Leeg = de mail gaat via het Brevo-account dat al gekoppeld is, maar wel vanaf het adres hierboven."})}`,
    {foot:`<span class="sp"></span><button type="button" class="ghost" data-act="close">Sluiten</button><button type="button" class="primary" id="platBew">${I.check}Opslaan</button>`});
  form.querySelector("#platBew").onclick=async()=>{const g=id=>(form.querySelector(`[data-k="${id}"]`)||{}).value||"";const b=form.querySelector("#platBew");b.disabled=true;
    try{PLAT=(await fbFn("platformSleutels")({actie:"zet",mansardMollieKey:g("_pmk"),platformAfzender:g("_paf"),platformAfzenderNaam:g("_pan"),platformBrevoKey:g("_pbk")})).data;toast("Opgeslagen");dlg.close();render()}
    catch(e){toast(typeof fnFout==="function"?fnFout(e):e.message);b.disabled=false}}};
