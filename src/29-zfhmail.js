/* ---------- FACTUURHERINNERING AUTOMATISCH PER E-MAIL ----------
   Instellingen › Factuurherinnering › "Automatisch versturen per e-mail" (standaard uit).
   Zolang het CRM open is zet het de herinneringen die vandaag aan de beurt zijn klaar als ingeplande mail (geplandeMails)
   met verstuurtijd [fhTijd]. De server kijkt vlak voor het versturen nog of de factuur nog openstaat, niet (deels) betaald is,
   niet al met de hand herinnerd is en of de bank bijgewerkt is. Daarna zet de server de herinnering op de factuur.
   De WIK-brief gaat nooit vanzelf: die verstuur je altijd zelf. Alleen klanten met een e-mailadres en momenten via e-mail. */
const FHMAIL={bezig:false,laatst:0};
function fhMailAan(){const s=S();return LIVE&&!!s.liveMail&&!!s.fhAan&&s.fhAutoMail===true}
function fhAutoItem(it){const m=it&&it.stap;return !!(m&&!m.wik&&(m.kanaal||"email")==="email"&&it.k&&it.k.email&&!it.k.incasso)}
async function fhMailKlaarzetten(){
  if(FHMAIL.bezig||!fhMailAan()||!state.loaded||!state.db)return;
  const s=S(),nu=new Date(),tm=toMin(s.fhTijd||"09:00");if(tm==null)return;
  const send=new Date(nu.getFullYear(),nu.getMonth(),nu.getDate(),Math.floor(tm/60),tm%60,0);if(nu>=send)return;
  const q=queues().find(x=>x.id==="aanmaning");if(!q||!q.items.length)return;
  FHMAIL.bezig=true;
  try{for(const it of q.items.filter(fhAutoItem)){
      const [,fid,n]=String(it.ref).split(":"),f=state.facturen.find(x=>x.id===fid);if(!f)continue;
      const id="fh_"+fid+"_"+n,ref=state.db.collection("geplandeMails").doc(id);
      try{const cur=await ref.get();if(cur.exists)continue;
        let vars=it.vars;if(liveMollie()){try{vars={...vars,betaallink:await mollieLinkVoor(f)}}catch(e){console.error("fhmail link",e)}}
        const m=it.stap,html=mailFor("aanmaning",vars,m.mail,{f,stap:m});
        let bijlagen=[];try{const doc=await pdfDoc(f);if(doc)bijlagen=[{naam:"Factuur "+f.nummer+".pdf",data:String(doc.output("datauristring")).split(",")[1]}]}catch(e){console.error("fhmail pdf",e)}
        const rest=Math.round((totals(f).inc-(Number(f.deelBetaald)||0))*100)/100;
        await ref.set({status:"gepland",sendAt:send.toISOString(),naar:it.k.email,naam:cleanName(it.k.naam),onderwerp:fill(m.onderwerp,vars),html,tekst:fill(m.mail,vars),bijlagen,
          meta:{klantId:it.k.id||f.klantId||"",klantNaam:it.k.naam||"",sjabloon:"aanmaning",ref:it.ref},fhCheck:{factuurId:fid,stap:Number(n),rest,deel:Number(f.deelBetaald)||0},gemaakt:new Date().toISOString(),door:"factuurherinnering"})}
      catch(e){console.error("fhmail",fid,e)}}
    FHMAIL.laatst=Date.now()}
  finally{FHMAIL.bezig=false}}
if(typeof window!=="undefined"&&LIVE)setInterval(()=>{try{if(Date.now()-FHMAIL.laatst>5*60e3)fhMailKlaarzetten()}catch(e){}},60e3);

/* status op de kaart "Betalingsherinneringen" in Communicatie › Klaar om te versturen */
function fhMailKaart(x){const s=S(),tijd=s.fhTijd||"09:00",auto=x.items.filter(fhAutoItem),zelf=x.items.filter(i=>!fhAutoItem(i)),nm=l=>l.slice(0,4).map(i=>esc(cleanName(i.k.naam))).join(", ")+(l.length>4?" en "+(l.length-4)+" meer":"");
  if(!LIVE||!s.liveMail)return"";
  if(!fhMailAan())return `<div class="dag-auto uit"><span>Nu moet je herinneringen zelf versturen.</span><button type="button" class="small primary" data-act="fhautoaan">Automatisch om ${esc(tijd)} versturen</button></div>`;
  const voorbij=(()=>{const tm=toMin(tijd),n=new Date();return tm!=null&&n.getHours()*60+n.getMinutes()>=tm})();
  return `<div class="dag-auto aan"><b>✓ ${voorbij?"Herinneringen gaan elke dag vanzelf om "+esc(tijd):"Gaat vanzelf om "+esc(tijd)+" per e-mail"}</b>${auto.length&&!voorbij?`<small>${nm(auto)}</small>`:""}${zelf.length?`<small class="dag-zonder">Zelf versturen (WIK-brief, geen e-mailadres, incasso of via WhatsApp/sms): ${nm(zelf)}</small>`:""}<small class="dag-let">Het CRM moet die dag vóór ${esc(tijd)} één keer open zijn geweest (telefoon of computer).</small></div>`}
