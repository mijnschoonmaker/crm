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
  if(b.status==="geblokkeerd")return{ok:false,soort:"geblokkeerd"};
  return{ok:false,soort:"verlopen"}}
function msBalk(){if(!msTenant()||!MS.doc||window.ZEEM_MEEKIJK)return;const st=msStatus();let el=document.getElementById("msBalk");
  const eig=window.ZEEM_ROL==="eigenaar";
  const html=st.soort==="proef"?`<span><b>Eerste maand</b> · nog ${plural(Math.max(0,st.dagen),"dag","dagen")}</span>${eig?`<button type="button" class="small primary" data-act="msabo">Abonnement kiezen</button>`:""}`
    :st.soort==="achterstand"?`<span><b>De laatste betaling is mislukt.</b> Betaal het bedrag vóór ${fmtD(st.tot)}; daarna gaat Mansard dicht tot er betaald is.</span>${eig?`<button type="button" class="small" data-act="msabo">Nu betalen</button>`:""}`
    :st.soort==="opgezegd"?`<span>Abonnement opgezegd · je kunt Mansard gebruiken tot ${fmtD(st.tot)}</span>${eig?`<button type="button" class="small" data-act="msabo">Toch doorgaan</button>`:""}`:"";
  if(!html){if(el)el.remove();}else{if(!el){el=document.createElement("div");el.id="msBalk";el.className="ms-balk";const m=document.querySelector("main");if(m)m.prepend(el)}el.innerHTML=html}
  let ov=document.getElementById("msDicht");
  /* nieuwe bedrijven: de proefperiode is de voorbeeldomgeving; de eigen (lege) omgeving gaat open zodra er een abonnement is */
  if(st.soort==="proef"&&MS.doc.proefDemo){if(!ov){ov=document.createElement("div");ov.id="msDicht";ov.className="ms-dicht";document.body.appendChild(ov)}
    const dg=Math.max(0,st.dagen),url="/demo/?proef=1&d="+dg;
    ov.innerHTML=`<div class="ms-dk ms-proef"><img src="/mansard-logo.png" alt="Mansard"><h2>Welkom bij Mansard</h2><p>Je proefperiode loopt nog <b>${plural(dg,"dag","dagen")}</b>. Probeer alles uit in de voorbeeldomgeving, met voorbeeldklanten, planning, offertes en facturen. Daar wordt niets bewaard, dus je kunt niets kapot maken.</p>
      <a class="btn primary" href="${url}">${I.eye||""}Naar de voorbeeldomgeving</a>
      <p class="ms-pk">${eig?"Wil je beginnen met je eigen bedrijf? Kies een pakket, dan kom je meteen in je eigen, lege omgeving. De eerste maand kost € 1 (excl. btw); daarna gaat het maandbedrag pas af.":"Je eigen omgeving gaat open zodra de eigenaar van je bedrijf een abonnement kiest."}</p>
      ${eig?`<button type="button" data-act="msabo">${I.card||""}Abonnement kiezen</button>`:""}<button type="button" class="ghost" data-act="msuit">Uitloggen</button></div>`;return}
  if(!st.ok){if(!ov){ov=document.createElement("div");ov.id="msDicht";ov.className="ms-dicht";document.body.appendChild(ov)}
    if(st.soort==="geblokkeerd"){ov.innerHTML=`<div class="ms-dk"><img src="/mansard-logo.png" alt="Mansard"><h2>Je account is tijdelijk gepauzeerd</h2><p>Je gegevens staan veilig. Neem contact op met Mansard om het weer te openen.</p><button type="button" class="ghost" data-act="msuit">Uitloggen</button></div>`;return}
    ov.innerHTML=`<div class="ms-dk"><img src="/mansard-logo.png" alt="Mansard"><h2>${st.soort==="opgezegd"?"Je abonnement is afgelopen":st.soort==="onbetaald"?"De betaling is niet gelukt":"Je proefperiode is voorbij"}</h2><p>${MS.doc.proefDemo&&st.soort==="verlopen"?"Je hebt Mansard kunnen proberen in de voorbeeldomgeving.":"Je gegevens staan veilig klaar."} ${st.soort==="onbetaald"?(eig?"Betaal het openstaande bedrag en je kunt direct verder.":"Vraag de eigenaar van je bedrijf om de betaling te regelen."):eig?"Kies een abonnement en je kunt direct verder.":"Vraag de eigenaar van je bedrijf om een abonnement te kiezen."}</p>
      ${eig?`<button type="button" class="primary" data-act="msabo">${st.soort==="onbetaald"?"Nu betalen":"Abonnement kiezen"}</button>`:""}<button type="button" class="ghost" data-act="msuit">Uitloggen</button></div>`}
  else if(ov)ov.remove()}
function msStart(){if(!msTenant()||MS.unsub)return;try{MS.unsub=fsDb().doc("bedrijven/"+window.ZEEM_BID).onSnapshot(s=>{MS.doc=s.exists?s.data():{};msBalk();
  /* vanuit de voorbeeldomgeving op "Abonnement kiezen" getikt: meteen het abonnementsvenster */
  if(MS.kies){MS.kies=false;setTimeout(aboDlg,300)}},()=>{})}catch(e){}}
if(typeof window!=="undefined"&&LIVE&&/[?&]kies-abonnement=1/.test(location.search)){MS.kies=true;try{history.replaceState(null,"",location.pathname+location.hash)}catch(_){}}
/* pakketten (excl. btw); de server houdt dezelfde bedragen aan */
const MS_PLANS={starter:{key:"starter",naam:"Starter",prijs:69,inbegrepen:1,extraPrijs:0,maxGebruikers:1,maxKlanten:150},mansard:{key:"mansard",naam:"Mansard",prijs:99,inbegrepen:3,extraPrijs:19.95}};
const msPlan=()=>{const p=(MS.doc||{}).plan;return p&&MS_PLANS[p.key]?MS_PLANS[p.key]:p&&p.naam==="Starter"?MS_PLANS.starter:MS_PLANS.mansard};
const msExcl=(p,n)=>Math.round((p.prijs+Math.max(0,n-p.inbegrepen)*(p.extraPrijs||0))*100)/100;
async function aboDlg(kies){
  const b=MS.doc||{},st=msStatus();let n=b.gebruikers||1,klanten=(state.klanten||[]).filter(k=>k.actief!==false).length;
  try{const r=await fbFn("abonnement")({});n=r.data.gebruikers||n}catch(e){}
  const eig=window.ZEEM_ROL==="eigenaar",nu=msPlan();let keus=kies&&MS_PLANS[kies]?kies:(b.plan&&b.plan.key)||(n>1||klanten>150?"mansard":"starter");
  const lbl={proef:"Eerste maand",actief:"Actief",achterstand:"Betaling mislukt",onbetaald:"Niet betaald",opgezegd:"Opgezegd",verlopen:"Verlopen",geblokkeerd:"Gepauzeerd"}[st.soort]||"—";
  const past=p=>!(p.maxGebruikers&&n>p.maxGebruikers)&&!(p.maxKlanten&&klanten>p.maxKlanten);
  const kaart=p=>{const ex=msExcl(p,n),ok=past(p);return `<button type="button" class="ms-plan${keus===p.key?" on":""}${ok?"":" nee"}" data-msplan="${p.key}"${ok?"":" disabled"}><span class="ms-pn">${p.naam}${b.plan&&b.plan.key===p.key&&st.soort==="actief"?' <i>Huidig</i>':""}</span><b>${eur(ex)}</b><small>per maand, excl. btw · ${eur(Math.round(ex*1.21*100)/100)} incl.</small>
    <ul><li>${p.maxGebruikers?"1 gebruiker":p.inbegrepen+" gebruikers inbegrepen"}</li><li>${p.maxKlanten?"Tot "+p.maxKlanten+" klanten":"Onbeperkt klanten"}</li><li>${p.extraPrijs?"Extra gebruiker "+eur(p.extraPrijs)+" excl. btw":"Alle functies"}</li></ul>${ok?"":`<em>${p.maxGebruikers&&n>p.maxGebruikers?"Je hebt "+plural(n,"gebruiker","gebruikers"):"Je hebt "+klanten+" klanten"}</em>`}</button>`};
  openDlg(`<div class="dlg-head"><span class="objic big">${I.card}</span><div style="flex:1"><h3>Abonnement</h3><div class="subt">${esc(b.naam||S().naam||"")} · <span class="pill ${st.ok?"ok":"late"} dotp">${lbl}</span></div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="ms-plans" id="msPlans">${Object.values(MS_PLANS).map(kaart).join("")}</div>
    <div id="msSom"></div>
    <p class="subt" style="margin:0">Maandelijks opzegbaar. Betalen gaat met automatische incasso via Mollie. Alle bedragen zijn excl. 21% btw. ${st.soort==="proef"?"Kies je nu, dan betaal je € 1 (excl. btw) voor de eerste maand; het maandbedrag gaat pas daarna af.":""} Gebruikers voeg je toe bij Instellingen › Gebruikers.</p>
    <div class="row" id="msKnoppen"></div>`);
  const draw=()=>{const p=MS_PLANS[keus],ex=msExcl(p,n),inc=Math.round(ex*1.21*100)/100,extra=Math.max(0,n-p.inbegrepen);
    $("#msPlans").querySelectorAll("[data-msplan]").forEach(x=>x.classList.toggle("on",x.dataset.msplan===keus));
    $("#msSom").innerHTML=`<table class="minitable"><tr><td>${p.naam}${p.maxGebruikers?", 1 gebruiker":", inclusief "+p.inbegrepen+" gebruikers"}</td><td style="text-align:right">${eur(p.prijs)}</td></tr>${extra&&p.extraPrijs?`<tr><td>${plural(extra,"extra gebruiker","extra gebruikers")} × ${eur(p.extraPrijs)}</td><td style="text-align:right">${eur(extra*p.extraPrijs)}</td></tr>`:""}<tr><td>Btw 21%</td><td style="text-align:right">${eur(Math.round((inc-ex)*100)/100)}</td></tr><tr><td><b>Per maand</b></td><td style="text-align:right"><b>${eur(inc)}</b></td></tr>${st.soort==="proef"?`<tr><td>Eerste maand (excl. btw)</td><td style="text-align:right"><b>${eur(1)}</b></td></tr>`:""}</table>`;
    const actief=st.soort==="actief"||st.soort==="achterstand"||st.soort==="onbetaald",ander=actief&&b.plan&&b.plan.key&&b.plan.key!==keus;
    $("#msKnoppen").innerHTML=`${eig&&!actief?`<button type="button" class="primary" id="msGo">${I.card}${st.soort==="opgezegd"?"Abonnement weer starten":"Start met "+p.naam}</button>`:""}${eig&&(st.soort==="achterstand"||st.soort==="onbetaald")?`<button type="button" class="primary" id="msGo">${I.card}Nu betalen</button>`:""}${eig&&ander?`<button type="button" class="primary" id="msWissel">${I.check||""}Overstappen naar ${p.naam}</button>`:""}${eig&&actief?`<button type="button" class="ghost danger" id="msStop">Opzeggen</button>`:""}<span class="sp"></span><button type="button" data-act="close">Sluiten</button>`;
    const go=document.getElementById("msGo");if(go)go.onclick=async()=>{go.disabled=true;go.innerHTML=I.clock+"Naar betalen…";try{const r=await fbFn("abonnementStart")({basis:location.origin,plan:keus});if(r.data.url)location.href=r.data.url;else{toast("Je abonnement is al actief");dlg.close()}}catch(e){go.disabled=false;draw();toast(fnFout(e))}};
    const w=document.getElementById("msWissel");if(w)w.onclick=async()=>{w.disabled=true;try{const r=await fbFn("abonnementPlan")({plan:keus});toast("Je zit nu op "+p.naam+" · "+eur(r.data.bedrag)+" per maand incl. btw");dlg.close()}catch(e){w.disabled=false;toast(fnFout(e))}};
    const stop=document.getElementById("msStop");if(stop)stop.onclick=async()=>{if(!(await vraag("Abonnement opzeggen?","Je kunt Mansard blijven gebruiken tot het einde van de betaalde periode. Daarna blijven je gegevens 90 dagen bewaard.","Opzeggen","Annuleren")))return;try{const r=await fbFn("abonnementStoppen")({});toast("Opgezegd. Je kunt Mansard gebruiken tot "+fmtD(r.data.tot));dlg.close()}catch(e){toast(fnFout(e))}}};
  $("#msPlans").onclick=e=>{const x=e.target.closest("[data-msplan]");if(!x||x.disabled)return;keus=x.dataset.msplan;draw()};
  draw()}
/* Starter: maximaal 150 klanten; daarna eerst overstappen */
function msKlantLimiet(){if(!msTenant()||!MS.doc)return false;const p=msPlan();if(!p.maxKlanten)return false;
  const n=(state.klanten||[]).filter(k=>k.actief!==false).length;if(n<p.maxKlanten)return false;
  vraag("Je zit aan het maximum van Starter",`Je hebt ${n} klanten. Het pakket Starter is voor maximaal ${p.maxKlanten} klanten. Stap over naar Mansard (onbeperkt klanten, 3 gebruikers) om nieuwe klanten toe te voegen.`,window.ZEEM_ROL==="eigenaar"?"Overstappen":"Oké","Later").then(j=>{if(j&&window.ZEEM_ROL==="eigenaar")aboDlg("mansard")});return true}
document.addEventListener("click",e=>{const t=e.target.closest("[data-act=msabo],[data-act=msuit]");if(!t)return;e.preventDefault();e.stopPropagation();if(t.dataset.act==="msabo")aboDlg();else{try{firebase.auth().signOut()}catch(_){}}},true);
if(typeof window!=="undefined"&&LIVE){const t=setInterval(()=>{if(window.ZEEM_BID&&state.loaded){clearInterval(t);msStart()}},700);
  if(/[?&]abonnement=/.test(location.search)){try{history.replaceState(null,"",location.pathname+location.hash)}catch(_){}setTimeout(()=>toast("Dank je wel! Je abonnement wordt verwerkt; binnen een minuut staat het op actief."),1800)}}
