/* ---------- DAGHERINNERING AUTOMATISCH PER E-MAIL ----------
   Instellingen › Dagherinnering › "E-mail automatisch versturen" (standaard uit).
   Zolang het CRM open is zet het de herinneringsmails voor de klussen van over [dagDagen] dag(en) klaar als ingeplande mail
   (geplandeMails) met verstuurtijd [dagTijd] (standaard 18:00). De server verstuurt ze op dat tijdstip en kijkt vlak ervoor
   nog of de klus nog op die dag staat, of de klant nog actief is en of de herinnering niet al met de hand is verstuurd.
   Alleen klanten met een e-mailadres; de rest blijft gewoon in de wachtrij in Communicatie (WhatsApp/sms). */
const DAGMAIL={bezig:false,laatst:0};
function dagMailAan(){const s=S();return LIVE&&!!s.liveMail&&s.dagAan!==false&&s.dagAutoMail===true&&s.dagVast!==false}
async function dagMailKlaarzetten(){
  if(DAGMAIL.bezig||!dagMailAan()||!state.loaded||!state.db)return;
  const s=S(),nu=new Date(),tm=toMin(s.dagTijd||"18:00");if(tm==null)return;
  /* alleen vóór het verstuurtijdstip: daarna is de server aan zet en blijft alles van de server */
  const send=new Date(nu.getFullYear(),nu.getMonth(),nu.getDate(),Math.floor(tm/60),tm%60,0);if(nu>=send)return;
  const q=queues().find(x=>x.id==="herinnering");if(!q||!q.items.length)return;
  DAGMAIL.bezig=true;
  try{const T=tpls(),TT=T.herinnering||{},tekst=TT.mail||TT.sms||TT.tekst||"",datum=String(q.items[0].ref).split(":")[1];
    for(const it of q.items){const k=it.k,kid=String(it.ref).split(":")[2];if(!k||!k.email||!kid)continue;
      const id="dag_"+datum+"_"+kid,ref=state.db.collection("geplandeMails").doc(id);
      try{const cur=await ref.get();if(cur.exists&&cur.data().status!=="gepland")continue;
        const html=mailFor("herinnering",it.vars,tekst);
        await ref.set({status:"gepland",sendAt:send.toISOString(),naar:k.email,naam:cleanName(k.naam),onderwerp:fill(TT.onderwerp||"Herinnering: morgen komen wij langs",it.vars),html,tekst:fill(tekst,it.vars),
          meta:{klantId:k.id||kid,klantNaam:k.naam||"",sjabloon:"herinnering",ref:it.ref},dagCheck:{datum,klantId:kid},gemaakt:new Date().toISOString(),door:"dagherinnering"})}
      catch(e){console.error("dagmail",kid,e)}}
    DAGMAIL.laatst=Date.now()}
  finally{DAGMAIL.bezig=false}}
if(typeof window!=="undefined"&&LIVE)setInterval(()=>{try{if(Date.now()-DAGMAIL.laatst>5*60e3)dagMailKlaarzetten()}catch(e){}},60e3);

/* status op de kaart "Herinnering voor morgen" in Communicatie › Klaar om te versturen */
function dagMailKaart(x){const s=S(),tijd=s.dagTijd||"18:00",met=x.items.filter(i=>i.k&&i.k.email),zonder=x.items.filter(i=>!(i.k&&i.k.email)),nm=l=>l.slice(0,4).map(i=>esc(cleanName(i.k.naam))).join(", ")+(l.length>4?" en "+(l.length-4)+" meer":"");
  if(!LIVE||!s.liveMail)return"";
  if(!dagMailAan())return `<div class="dag-auto uit"><span>Nu moet je dit elke dag zelf versturen.</span><button type="button" class="small primary" data-act="dagautoaan">Automatisch om ${esc(tijd)} versturen</button></div>`;
  return `<div class="dag-auto aan"><b>✓ Gaat vanzelf om ${esc(tijd)} per e-mail</b>${met.length?`<small>${nm(met)}</small>`:""}${zonder.length?`<small class="dag-zonder">Geen e-mailadres, dus zelf versturen: ${nm(zonder)}</small>`:""}<small class="dag-let">Het CRM moet vandaag vóór ${esc(tijd)} één keer open zijn geweest (telefoon of computer).</small></div>`}
