/* ---------- LIVE: eigen server (Firebase + Brevo + Mollie) ----------
   Alles hieronder doet alleen iets in de echte versie (crm.mijnschoonmaker.com), waar window.ZEEM_LIVE is gezet. */
const liveMail=()=>LIVE&&!!S().liveMail;
const liveMollie=()=>LIVE&&!!S().liveMollie;
const fbFn=n=>window.firebase.app().functions("europe-west4").httpsCallable(n);
const fsDb=()=>window.firebase.firestore();
const isEigenaar=()=>LIVE&&String((state.me&&state.me.email)||"").toLowerCase()==="robin@mijnschoonmaker.com";
const randTok=(n=24)=>[...crypto.getRandomValues(new Uint8Array(n))].map(x=>"abcdefghjkmnpqrstuvwxyz23456789"[x%31]).join("");
const fnFout=e=>String((e&&e.message)||e||"onbekende fout").replace(/^.*?:\s*(?=Versturen|Er is|Geen|Log|Ongeldig)/,"");

async function mollieLinkVoor(f){
  if(f.betaallink&&f.mollieId&&f.mollieStatus==="open")return f.betaallink;
  const r=await fbFn("mollieLink")({factuurId:f.id,bedrag:Math.round(totals(f).inc*100)/100,omschrijving:(S().naam||"Glasbewassing")+" · factuur "+f.nummer,basis:location.origin});
  return r.data.link}

/* opgemaakte mail rechtstreeks versturen (vervangt kopiëren + plakken) */
async function verstuurLive(i){
  const c=compose,r=c&&c.recipients[i];if(!r||!r.k.email)return;
  const ref=String(r.ref||""),_ab=/^afkondiging:/.test(ref)?state.beurten.find(b=>b.id===ref.split(":")[1]):null,fid=/^(factuur|aanmaning):/.test(ref)?ref.split(":")[1]:(_ab&&_ab.gefactureerd&&!["nvt","periodiek"].includes(_ab.gefactureerd)?_ab.gefactureerd:""),f=fid?state.facturen.find(x=>x.id===fid):null;
  const st=r.stap,tekst=st?st.mail:(c.mail||c.tekst);let vars=r.vars;
  const btn=form.querySelector(`[data-act="copyhtml"][data-i="${i}"]`);if(btn){btn.disabled=true;btn.innerHTML=I.clock+"Bezig…"}
  try{
    if(f&&f.soort!=="offerte"&&!f.betaald&&liveMollie()){try{vars={...vars,betaallink:await mollieLinkVoor(f)}}catch(e){console.error(e);toast("Betaallink maken lukte niet; de mail gaat zonder Mollie-link")}}
    const subj=fill(st?st.onderwerp:c.onderwerp,vars),html=mailFor(c.sjabloon,vars,tekst,{f,stap:st});
    let bijlagen=[];if(f){const doc=await pdfDoc(f);if(doc)bijlagen=[{naam:(f.soort==="offerte"?"Offerte ":"Factuur ")+f.nummer+".pdf",data:String(doc.output("datauristring")).split(",")[1]}]}
    await fbFn("sendMail")({berichtId:newId("m"),naar:r.k.email,naam:cleanName(r.k.naam),onderwerp:subj,html,tekst:fill(tekst,vars),bijlagen,meta:{klantId:r.k.id||"",klantNaam:r.k.naam,sjabloon:c.sjabloon,ref:r.ref||""}});
    c.sent[i]="live";toast("Mail verstuurd naar "+r.k.email);if(r.onSent)await r.onSent()}
  catch(e){console.error(e);toast("Versturen lukte niet: "+fnFout(e))}
  drawCmpList()}

/* aanvragen van de website (de server zet ze in /aanvragen): automatisch als klant + opdracht toevoegen */
let aanvrUnsub=null;
function liveAanvragen(){if(!LIVE||aanvrUnsub)return;
  aanvrUnsub=fsDb().collection("aanvragen").where("status","==","nieuw").onSnapshot(s=>s.docs.forEach(d=>verwerkAanvraag(d.ref)),e=>console.error("aanvragen",e))}
async function verwerkAanvraag(ref){let a=null;
  try{await fsDb().runTransaction(async t=>{const s=await t.get(ref);if(!s.exists||s.data().status!=="nieuw")return;a=s.data();t.update(ref,{status:"bezig",door:(state.me&&state.me.email)||""})})}catch(e){return}
  if(!a)return;
  try{const D=a.aanvraag;let k;
    if(D.formaat==="zeem.contact")k=await contactToevoegen(D);
    else{const fotos=[];for(const f of a.fotos||[]){try{const r=await fetch(BLOB+f.id);if(r.ok)fotos.push({blob:await r.blob(),naam:f.naam||"foto.jpg",w:f.w||0,h:f.h||0,dots:f.dots||[]})}catch(e){}}
      k=await aanvraagToevoegen(D,fotos)}
    await ref.update({status:"verwerkt",klantId:(k&&k.id)||"",verwerktOp:new Date().toISOString()})}
  catch(e){console.error(e);ref.update({status:"nieuw"}).catch(()=>{})}}
if(LIVE)setTimeout(function w(){state.loaded?liveAanvragen():setTimeout(w,600)},600);

/* ---------- instellingen die alleen in de echte versie bestaan ---------- */
if(LIVE){
  const at=SETCARDS.findIndex(x=>x.id==="email")+1;
  SETCARDS.splice(at,0,
    {id:"liveMail",t:"E-mail versturen",sub:"Mails rechtstreeks vanuit het CRM, met alle statussen",ic:"send",bg:"#2f7f88",st:s=>s.liveMail?["ok","Actief"]:["soon","Niet ingesteld"],rows:s=>[["Afzender",s.liveAfzender||"—"],["Via","Brevo"],["Statussen","Bezorgd · geopend · geklikt · bounce · spam"]],warn:s=>s.liveMail?"":"Koppel Brevo om mails, facturen en herinneringen direct vanuit het CRM te versturen."},
    {id:"liveMollie",t:"Online betalen",sub:"Betaallink per factuur, automatisch afboeken",ic:"card",bg:"#23845a",st:s=>s.liveMollie?["ok","Actief"]:["soon","Niet ingesteld"],rows:s=>[["Via","Mollie"],["Afboeken","Automatisch bij betaling"]],warn:s=>s.liveMollie?"":"Met Mollie krijgt elke factuurmail een eigen betaallink en staat de factuur vanzelf op betaald."},
    {id:"liveUsers",t:"Gebruikers",sub:"Wie mag inloggen in het CRM",ic:"klanten",bg:"#1d5a74",st:()=>["ok","Beheren"],rows:s=>[["Eigenaar","robin@mijnschoonmaker.com"],["Inloggen","E-mail + wachtwoord"]]},
    {id:"liveImport",t:"Overzetten",sub:"Gegevens uit de oude versie inladen",ic:"inbox",bg:"#4b3fd0",st:()=>["ok","Eenmalig"],rows:()=>[["Bestand","zeem-backup (met foto's)"]]});
  const alleenEigenaar=()=>{if(isEigenaar())return true;toast("Alleen de eigenaar kan dit aanpassen");return false};

  SETEXTRA.liveMail=(c,s)=>{if(!alleenEigenaar())return;const tok=s.hookToken||randTok(),hook=location.origin+"/api/brevo?t="+tok;
    setDlg(c,`${info("Mails gaan via <b>Brevo</b> rechtstreeks vanuit het CRM naar je klant, met PDF als bijlage. Je ziet per mail of hij is <b>bezorgd, geopend, geklikt</b>, of dat hij niet aankwam of als spam werd gemarkeerd.")}
      ${inp("liveAfzender","Afzenderadres",s.liveAfzender||"info@mijnschoonmaker.com",{type:"email",cls:"full",help:"Moet bij Brevo als afzender zijn bevestigd. Antwoorden van klanten komen binnen op je e-mailadres uit Bedrijf & Branding."})}
      ${inp("liveMeld","Meldingen van nieuwe websiteaanvragen naar",s.liveMeld||s.email||"info@mijnschoonmaker.com",{type:"email",cls:"full"})}
      <label class="full">Brevo API-sleutel<input type="password" id="brevoKey" autocomplete="off" placeholder="${s.liveMail?"Ingesteld · laat leeg om te houden":"xkeysib-…"}"><small class="help">Wordt veilig op de server bewaard en is daarna niet meer in te zien.</small></label>
      <label class="full">Webhook-adres voor Brevo<span style="display:flex;gap:8px"><input value="${esc(hook)}" readonly style="flex:1"><button type="button" class="small" id="hookCp">${I.copy}Kopieer</button></span><small class="help">Plak dit bij Brevo › Transactional › Settings › Webhook, met alle gebeurtenissen aangevinkt.</small></label>
      ${sec("Brevo instellen · eenmalig")}
      <ol class="trk-steps"><li>Ga in Brevo naar <b>Senders, Domains &amp; Dedicated IPs › Domains</b> en voeg <code>mijnschoonmaker.com</code> toe.</li>
        <li>Brevo toont een paar DNS-records (TXT en CNAME). Zet die bij <b>Mijndomein › Mijn domeinen › mijnschoonmaker.com › DNS-instellingen</b>. Klik daarna in Brevo op <b>Verify</b>.</li>
        <li>Voeg bij <b>Senders</b> het adres <code>info@mijnschoonmaker.com</code> toe.</li>
        <li>Maak bij <b>SMTP &amp; API › API Keys</b> een sleutel en plak hem hierboven.</li>
        <li>Zet het webhook-adres hierboven bij <b>Transactional › Settings › Webhook</b>.</li>
        <li>Opslaan en daarna op <b>Testmail</b> klikken.</li></ol>
      <div class="splitrow" style="gap:10px"><button type="button" class="small" id="liveTest" ${s.liveMail?"":"disabled"}>${I.send}Testmail naar mezelf</button><span class="subt" id="liveRes"></span></div>`,{wide:false});
    $("#hookCp").onclick=()=>copy(hook);
    $("#liveTest").onclick=async()=>{const R=$("#liveRes");R.textContent="Bezig…";
      try{await fbFn("sendMail")({naar:s.email||s.liveAfzender,onderwerp:"Testmail vanuit het CRM",tekst:"Het versturen vanuit het CRM werkt.\n\nMet vriendelijke groet,\n"+(s.naam||"mijnschoonmaker"),meta:{klantNaam:"Test"}});R.innerHTML='<span style="color:var(--ok);font-weight:700">Verstuurd naar '+esc(s.email||s.liveAfzender)+' ✓</span>'}
      catch(e){R.innerHTML='<span style="color:var(--late)">'+esc(fnFout(e))+'</span>'}};
    form.onsubmit=async e=>{e.preventDefault();const p=readFields(),key=$("#brevoKey").value.trim();
      try{await fsDb().doc("geheim/config").set({...(key?{brevoKey:key}:{}),afzender:p.liveAfzender,meldAdres:p.liveMeld,hookToken:tok},{merge:true});
        if(await saveSettings({...p,hookToken:tok,liveMail:!!(key||s.liveMail)})){dlg.close();schedule()}}catch(er){err(er)}}};

  SETEXTRA.liveMollie=(c,s)=>{if(!alleenEigenaar())return;
    setDlg(c,`${info("Elke factuurmail krijgt een eigen <b>betaallink</b> (iDEAL, Bancontact, creditcard). Betaalt de klant, dan staat de factuur vanzelf op <b>betaald</b>.")}
      ${tgl("liveMollie","Online betalen aan","Betaallink automatisch in factuurmails en herinneringen",s.liveMollie!==false&&!!s.liveMollieKey)}
      <label class="full">Mollie API-sleutel<input type="password" id="mollieKey" autocomplete="off" placeholder="${s.liveMollieKey?"Ingesteld · laat leeg om te houden":"live_… of test_…"}"><small class="help">Te vinden in Mollie › Ontwikkelaars › API-sleutels. Begin gerust met de test-sleutel.</small></label>
      <div class="warnbox">${I.alert}<span>Je Mollie-account moet eerst zijn geverifieerd (KvK, bankrekening, ID) voordat echte betalingen werken.</span></div>`,{wide:false});
    form.onsubmit=async e=>{e.preventDefault();const on=form.querySelector('[data-k="liveMollie"]').checked,key=$("#mollieKey").value.trim();
      try{if(key)await fsDb().doc("geheim/config").set({mollieKey:key},{merge:true});
        if(await saveSettings({liveMollie:on&&!!(key||s.liveMollieKey),liveMollieKey:!!(key||s.liveMollieKey),liveMollieTest:key?key.startsWith("test_"):!!s.liveMollieTest})){dlg.close();schedule()}}catch(er){err(er)}}};

  SETEXTRA.liveUsers=async(c,s)=>{
    const draw=async()=>{let lijst=[];try{lijst=(await fsDb().collection("gebruikers").get()).docs.map(d=>({id:d.id,...d.data()}))}catch(e){}
      $("#usrL").innerHTML=`<table class="minitable"><tr><td><b>robin@mijnschoonmaker.com</b></td><td>Eigenaar</td><td></td></tr>${lijst.map(u=>`<tr><td>${esc(u.id)}</td><td>${esc(u.naam||"")}</td><td class="r">${isEigenaar()?`<button type="button" class="tiny ghost" data-rm="${esc(u.id)}" style="color:var(--late)">Verwijderen</button>`:""}</td></tr>`).join("")}</table>`;
      $("#usrL").querySelectorAll("[data-rm]").forEach(b=>b.onclick=async()=>{if(!(await vraag("Gebruiker verwijderen?",`<b>${esc(b.dataset.rm)}</b> kan daarna niet meer inloggen in het CRM.`,"Verwijderen","Annuleren")))return;await fsDb().doc("gebruikers/"+b.dataset.rm).delete();draw()})};
    setDlg(c,`${info("Iedereen die hier staat kan inloggen met zijn eigen e-mailadres en wachtwoord. Nieuwe gebruikers maken zelf een account aan op het inlogscherm en bevestigen hun e-mailadres.")}
      <div id="usrL"><p class="subt">Laden…</p></div>
      ${isEigenaar()?`${sec("Gebruiker toevoegen")}<div class="grid2">${inp("_ue","E-mailadres","",{type:"email",ph:"naam@voorbeeld.nl"})}${inp("_un","Naam","",{ph:"Bijv. Jan"})}</div><button type="button" class="small primary" id="usrAdd">${I.plus}Toevoegen</button>`:""}`,{wide:false,foot:`<span class="sp"></span><button type="button" class="primary" data-act="close">Sluiten</button>`});
    const a=$("#usrAdd");if(a)a.onclick=async()=>{const e=form.querySelector('[data-k="_ue"]').value.trim().toLowerCase(),n=form.querySelector('[data-k="_un"]').value.trim();
      if(!/^\S+@\S+\.\S+$/.test(e))return toast("Vul een geldig e-mailadres in");try{await fsDb().doc("gebruikers/"+e).set({naam:n,toegevoegd:new Date().toISOString()});form.querySelector('[data-k="_ue"]').value="";form.querySelector('[data-k="_un"]').value="";toast(e+" kan nu inloggen");draw()}catch(er){err(er)}};
    draw()};

  SETEXTRA.liveImport=(c,s)=>{if(!alleenEigenaar())return;
    setDlg(c,`${info("Kies het back-upbestand uit de oude versie (Instellingen › Data Beheer › <b>Alles + foto's</b>). Bestaande gegevens met hetzelfde nummer worden overschreven.")}
      <label class="btn" style="width:100%;justify-content:center">${I.upload}Back-upbestand kiezen<input type="file" accept=".json,application/json" hidden id="impF"></label>
      <div id="impR" class="subt" style="margin-top:12px"></div>`,{wide:false,foot:`<span class="sp"></span><button type="button" data-act="close">Sluiten</button>`});
    $("#impF").onchange=async e=>{const f=e.target.files[0];if(!f)return;const R=$("#impR");let d;
      try{d=JSON.parse(await f.text())}catch(er){R.textContent="Dit is geen geldig back-upbestand.";return}
      if(d.formaat!=="zeem-export"||!d.collecties){R.textContent="Dit is geen back-up van mijnschoonmaker.";return}
      const n=Object.values(d.collecties).reduce((a,l)=>a+l.length,0),nb=(d.bestanden||[]).filter(b=>b.data).length;
      if(!(await vraag("Gegevens overzetten?",`${n} records en ${nb} foto's/bestanden uit de back-up van <b>${esc(d.gemaakt?fmtL(d.gemaakt.slice(0,10)):"onbekend")}</b> worden ingeladen.`,"Overzetten","Annuleren")))return;
      let k=0;const tik=()=>{R.textContent=`Bezig… ${k} van ${n+nb}`};
      try{for(const b of d.bestanden||[]){if(!b.data)continue;const bl=await (await fetch(b.data)).blob();await window.ZEEM_PUT(b.id,bl,b.type||bl.type);k++;if(k%5===0)tik()}
        for(const col of COLS){for(const doc of d.collecties[col]||[]){const {id,...rest}=doc;if(!id)continue;await save(col,id,rest);k++;if(k%20===0)tik()}}
        R.innerHTML='<b style="color:var(--ok)">Klaar ✓</b> Alles is overgezet.';toast("Gegevens overgezet")}
      catch(er){console.error(er);R.innerHTML='<span style="color:var(--late)">Overzetten stopte bij '+k+': '+esc(er.message||String(er))+'</span>'}}};
}
