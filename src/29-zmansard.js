/* ---------- Mansard: proefperiode en abonnement van een bedrijf ----------
   Alleen voor nieuwe bedrijven (niet voor het eerste bedrijf). Status komt uit bedrijven/<id>. */
const MS={doc:null,unsub:null};
const msTenant=()=>LIVE&&!!window.ZEEM_BID&&window.ZEEM_BID!=="mijnschoonmaker";
const msDagen=d=>d?Math.ceil((parse(d)-today())/DAY):0;
function msStatus(){const b=MS.doc||{},v=iso(today());
  if(b.status==="actief"){if(!b.achterstand)return{ok:true,soort:"actief"};
    /* zelfde regel als de server: 14 dagen na de mislukte betaling gaat het CRM dicht tot er betaald is */
    const tot=iso(addDays(parse(String(b.foutOp||v).slice(0,10)),14));return{ok:tot>=v,soort:tot>=v?"achterstand":"onbetaald",tot}}
  if(b.status==="proef")return{ok:String(b.proefTot||"")>=v,soort:String(b.proefTot||"")>=v?"proef":"verlopen",dagen:msDagen(b.proefTot)};
  if(b.status==="opgezegd")return{ok:String(b.betaaldTot||b.proefTot||"")>=v,soort:"opgezegd",tot:b.betaaldTot||b.proefTot};
  return{ok:false,soort:"verlopen"}}
function msBalk(){if(!msTenant()||!MS.doc||window.ZEEM_MEEKIJK)return;const st=msStatus();let el=document.getElementById("msBalk");
  const eig=window.ZEEM_ROL==="eigenaar";
  const html=st.soort==="proef"?`<span><b>Proefperiode</b> · nog ${plural(Math.max(0,st.dagen),"dag","dagen")} gratis</span>${eig?`<button type="button" class="small primary" data-act="msabo">Abonnement kiezen</button>`:""}`
    :st.soort==="achterstand"?`<span><b>De laatste betaling is mislukt.</b> Betaal het bedrag vóór ${fmtD(st.tot)}; daarna gaat Mansard dicht tot er betaald is.</span>${eig?`<button type="button" class="small" data-act="msabo">Nu betalen</button>`:""}`
    :st.soort==="opgezegd"?`<span>Abonnement opgezegd · je kunt Mansard gebruiken tot ${fmtD(st.tot)}</span>${eig?`<button type="button" class="small" data-act="msabo">Toch doorgaan</button>`:""}`:"";
  if(!html){if(el)el.remove();}else{if(!el){el=document.createElement("div");el.id="msBalk";el.className="ms-balk";const m=document.querySelector("main");if(m)m.prepend(el)}el.innerHTML=html}
  let ov=document.getElementById("msDicht");
  /* nieuwe bedrijven: de proefperiode is de voorbeeldomgeving; de eigen (lege) omgeving gaat open zodra er een abonnement is */
  if(st.soort==="proef"&&MS.doc.proefDemo){if(!ov){ov=document.createElement("div");ov.id="msDicht";ov.className="ms-dicht";document.body.appendChild(ov)}
    const dg=Math.max(0,st.dagen),url="/demo/?proef=1&d="+dg;
    ov.innerHTML=`<div class="ms-dk ms-proef"><img src="/mansard-logo.png" alt="Mansard"><h2>Welkom bij Mansard</h2><p>Je proefperiode loopt nog <b>${plural(dg,"dag","dagen")}</b>. Probeer alles uit in de voorbeeldomgeving, met voorbeeldklanten, planning, offertes en facturen. Daar wordt niets bewaard, dus je kunt niets kapot maken.</p>
      <a class="btn primary" href="${url}">${I.eye||""}Naar de voorbeeldomgeving</a>
      <p class="ms-pk">${eig?"Wil je beginnen met je eigen bedrijf? Kies een abonnement, dan kom je meteen in je eigen, lege omgeving. Tijdens de proef betaal je alleen € 0,01 voor de machtiging; de eerste maand gaat pas na je proefperiode af.":"Je eigen omgeving gaat open zodra de eigenaar van je bedrijf een abonnement kiest."}</p>
      ${eig?`<button type="button" data-act="msabo">${I.card||""}Abonnement kiezen</button>`:""}<button type="button" class="ghost" data-act="msuit">Uitloggen</button></div>`;return}
  if(!st.ok){if(!ov){ov=document.createElement("div");ov.id="msDicht";ov.className="ms-dicht";document.body.appendChild(ov)}
    ov.innerHTML=`<div class="ms-dk"><img src="/mansard-logo.png" alt="Mansard"><h2>${st.soort==="opgezegd"?"Je abonnement is afgelopen":st.soort==="onbetaald"?"De betaling is niet gelukt":"Je proefperiode is voorbij"}</h2><p>${MS.doc.proefDemo&&st.soort==="verlopen"?"Je hebt Mansard kunnen proberen in de voorbeeldomgeving.":"Je gegevens staan veilig klaar."} ${st.soort==="onbetaald"?(eig?"Betaal het openstaande bedrag en je kunt direct verder.":"Vraag de eigenaar van je bedrijf om de betaling te regelen."):eig?"Kies een abonnement en je kunt direct verder.":"Vraag de eigenaar van je bedrijf om een abonnement te kiezen."}</p>
      ${eig?`<button type="button" class="primary" data-act="msabo">${st.soort==="onbetaald"?"Nu betalen":"Abonnement kiezen"}</button>`:""}<button type="button" class="ghost" data-act="msuit">Uitloggen</button></div>`}
  else if(ov)ov.remove()}
function msStart(){if(!msTenant()||MS.unsub)return;try{MS.unsub=fsDb().doc("bedrijven/"+window.ZEEM_BID).onSnapshot(s=>{MS.doc=s.exists?s.data():{};msBalk();
  /* vanuit de voorbeeldomgeving op "Abonnement kiezen" getikt: meteen het abonnementsvenster */
  if(MS.kies){MS.kies=false;setTimeout(aboDlg,300)}},()=>{})}catch(e){}}
if(typeof window!=="undefined"&&LIVE&&/[?&]kies-abonnement=1/.test(location.search)){MS.kies=true;try{history.replaceState(null,"",location.pathname+location.hash)}catch(_){}}
async function aboDlg(){
  const b=MS.doc||{},st=msStatus(),p=b.plan||{prijs:99,inbegrepen:3,extraPrijs:19.95};let n=b.gebruikers||1;
  try{const r=await fbFn("abonnement")({});n=r.data.gebruikers||n}catch(e){}
  const extra=Math.max(0,n-p.inbegrepen),bedrag=Math.round((p.prijs+extra*p.extraPrijs)*100)/100,eig=window.ZEEM_ROL==="eigenaar";
  const lbl={proef:"Proefperiode",actief:"Actief",achterstand:"Betaling mislukt",onbetaald:"Niet betaald",opgezegd:"Opgezegd",verlopen:"Verlopen"}[st.soort]||"—";
  openDlg(`<div class="dlg-head"><span class="objic big">${I.card}</span><div style="flex:1"><h3>Abonnement</h3><div class="subt">${esc(b.naam||S().naam||"")}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="planhero"><div><span class="eyebrow">Mansard</span><b>${eur(bedrag)}</b><small>per maand, excl. btw</small></div><div style="text-align:right"><span class="pill ${st.ok?"ok":"late"} dotp">${lbl}</span></div>
      <div class="ph-row"><span>Inbegrepen<br><b>${p.inbegrepen} gebruikers</b></span><span>Nu<br><b>${plural(n,"gebruiker","gebruikers")}</b></span><span>${st.soort==="proef"?"Gratis tot":st.soort==="actief"?"Volgende afschrijving":"Tot"}<br><b>${fmtD(st.soort==="proef"?b.proefTot:b.volgende||b.betaaldTot||b.proefTot)||"—"}</b></span></div></div>
    <table class="minitable"><tr><td>Abonnement, inclusief ${p.inbegrepen} gebruikers</td><td style="text-align:right">${eur(p.prijs)}</td></tr>${extra?`<tr><td>${plural(extra,"extra gebruiker","extra gebruikers")} × ${eur(p.extraPrijs)}</td><td style="text-align:right">${eur(extra*p.extraPrijs)}</td></tr>`:""}<tr><td><b>Per maand</b></td><td style="text-align:right"><b>${eur(bedrag)}</b></td></tr></table>
    <p class="subt" style="margin:0">Maandelijks opzegbaar. Betalen gaat met automatische incasso via Mollie. ${st.soort==="proef"?"Kies je nu al, dan betaal je eenmalig € 0,01 voor de machtiging; de eerste maand wordt pas na je proefperiode afgeschreven.":""} Gebruikers voeg je toe bij Instellingen › Gebruikers; het maandbedrag past zich vanzelf aan.</p>
    <div class="row">${eig&&st.soort!=="actief"?`<button type="button" class="primary" id="msGo">${I.card}${st.soort==="achterstand"||st.soort==="onbetaald"?"Nu betalen":st.soort==="opgezegd"?"Abonnement weer starten":"Abonnement starten"}</button>`:""}${eig&&(st.soort==="actief"||st.soort==="achterstand"||st.soort==="onbetaald")?`<button type="button" class="ghost danger" id="msStop">Opzeggen</button>`:""}<span class="sp"></span><button type="button" data-act="close">Sluiten</button></div>`);
  const go=document.getElementById("msGo");if(go)go.onclick=async()=>{go.disabled=true;go.innerHTML=I.clock+"Naar betalen…";try{const r=await fbFn("abonnementStart")({basis:location.origin});if(r.data.url)location.href=r.data.url;else{toast("Je abonnement is al actief");dlg.close()}}catch(e){go.disabled=false;go.innerHTML=I.card+"Abonnement starten";toast(fnFout(e))}};
  const stop=document.getElementById("msStop");if(stop)stop.onclick=async()=>{if(!(await vraag("Abonnement opzeggen?","Je kunt Mansard blijven gebruiken tot het einde van de betaalde periode. Daarna blijven je gegevens 90 dagen bewaard.","Opzeggen","Annuleren")))return;try{const r=await fbFn("abonnementStoppen")({});toast("Opgezegd. Je kunt Mansard gebruiken tot "+fmtD(r.data.tot));dlg.close()}catch(e){toast(fnFout(e))}}}
document.addEventListener("click",e=>{const t=e.target.closest("[data-act=msabo],[data-act=msuit]");if(!t)return;e.preventDefault();e.stopPropagation();if(t.dataset.act==="msabo")aboDlg();else{try{firebase.auth().signOut()}catch(_){}}},true);
if(typeof window!=="undefined"&&LIVE){const t=setInterval(()=>{if(window.ZEEM_BID&&state.loaded){clearInterval(t);msStart()}},700);
  if(/[?&]abonnement=/.test(location.search)){try{history.replaceState(null,"",location.pathname+location.hash)}catch(_){}setTimeout(()=>toast("Dank je wel! Je abonnement wordt verwerkt; binnen een minuut staat het op actief."),1800)}}
