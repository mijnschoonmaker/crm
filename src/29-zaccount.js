/* ---------- Mijn account: tik op je naam linksonder ----------
   Je eigen gegevens, je bedrijf, het abonnement (status, bedrag, gebruikers, volgende afschrijving), gebruik en koppelingen in één overzicht. */
function accRol(){const r=window.ZEEM_ROL||"";return r==="eigenaar"||(typeof isEigenaar==="function"&&isEigenaar())?"Eigenaar":r==="medewerker"?"Medewerker":r?r.charAt(0).toUpperCase()+r.slice(1):LIVE?"Gebruiker":"Eigenaar (demo)"}
function accAbo(){/* abonnementsgegevens: echt uit bedrijven/<id>, of een voorbeeld in de demo */
  if(!LIVE)return{soort:"proef",lbl:"Proefperiode",ok:true,bedrag:99,inbegrepen:3,extraPrijs:19.95,n:1,datumLbl:"Gratis tot",datum:iso(addDays(today(),21)),dagen:21,demo:true};
  if(typeof msTenant!=="function"||!msTenant())return{soort:"eigen",lbl:"Eigen omgeving",ok:true};
  const b=(typeof MS!=="undefined"&&MS.doc)||{},st=msStatus(),p=b.plan||{prijs:99,inbegrepen:3,extraPrijs:19.95},n=b.gebruikers||1,extra=Math.max(0,n-p.inbegrepen);
  const lbl={proef:"Proefperiode",actief:"Actief",achterstand:"Betaling mislukt",opgezegd:"Opgezegd",verlopen:"Verlopen"}[st.soort]||"—";
  const datum=st.soort==="proef"?b.proefTot:st.soort==="actief"||st.soort==="achterstand"?(b.volgende||b.betaaldTot):(b.betaaldTot||b.proefTot);
  return{soort:st.soort,lbl,ok:st.ok,bedrag:Math.round((p.prijs+extra*p.extraPrijs)*100)/100,inbegrepen:p.inbegrepen,extraPrijs:p.extraPrijs,n,datum,dagen:st.dagen,
    datumLbl:st.soort==="proef"?"Gratis tot":st.soort==="actief"?"Volgende afschrijving":st.soort==="achterstand"?"Nieuwe poging":"Te gebruiken tot"}}
function openAccount(){
  const s=S(),me=state.me||{},nm=(me.name||s.contact||s.naam||"Gebruiker"),mail=me.email||s.email||"",a=accAbo(),eig=!LIVE||window.ZEEM_ROL==="eigenaar"||(typeof isEigenaar==="function"&&isEigenaar());
  const bk=typeof fbBankInfo==="function"?fbBankInfo():{},mnd=iso(today()).slice(0,7);
  const fm=(state.facturen||[]).filter(f=>f.soort!=="offerte"&&String(f.datum||"").slice(0,7)===mnd).length,act=(state.klanten||[]).filter(k=>k.actief!==false).length;
  const pill=(ok,t)=>`<span class="pill ${ok?"ok":"neutral"} dotp">${esc(t)}</span>`;
  const rij=(l,v)=>`<div class="acc-r"><span>${l}</span><b>${v||"—"}</b></div>`;
  const aboKaart=a.soort==="eigen"?`<p class="subt" style="margin:0">Dit is de eigen omgeving van Mansard: hier is geen abonnement nodig.</p>`
    :`<div class="acc-plan"><div><small>Mansard${a.demo?" · voorbeeld":""}</small><b>${eur(a.bedrag)}</b><em>per maand, excl. btw</em></div>${pill(a.ok&&a.soort!=="achterstand",a.lbl)}</div>
      ${a.soort==="proef"&&a.dagen!=null?`<div class="acc-proef"><span>Nog <b>${plural(Math.max(0,a.dagen),"dag","dagen")}</b> gratis</span><i><b style="width:${Math.max(4,Math.min(100,Math.round((30-Math.max(0,a.dagen))/30*100)))}%"></b></i></div>`:""}
      ${rij(a.datumLbl,a.datum?fmtL(a.datum):"—")}${rij("Gebruikers",`<span id="accN">${a.n}</span> van ${a.inbegrepen} inbegrepen`)}${rij("Extra gebruiker",eur(a.extraPrijs)+" per maand")}${rij("Betalen","Automatische incasso via Mollie · maandelijks opzegbaar")}
      ${eig?`<button type="button" class="small" data-act="msabo" id="accAbo">${I.card}Abonnement beheren</button>`:`<p class="subt" style="margin:0">Alleen de eigenaar van het bedrijf kan het abonnement wijzigen.</p>`}`;
  openDlg(`<div class="dlg-head fw-head acc-head"><div class="fw-h1"><span class="acc-av">${esc(initials(nm))}</span><div class="fw-ht"><small>Mijn account</small><h3>${esc(cleanName(nm))}</h3></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="fw-h2"><div class="fw-hk"><b>${esc(s.naam||"Mijn bedrijf")}</b><small>${esc(mail)}${mail?" · ":""}${esc(accRol())}</small></div><div class="fw-hb">${a.soort==="eigen"?"":pill(a.ok&&a.soort!=="achterstand",a.lbl)}</div></div></div>
  <div class="acc-grid">
    <section class="acc-k"><div class="acc-kh"><span class="objic">${I.klanten}</span><b>Mijn gegevens</b></div>
      ${rij("Naam",esc(cleanName(nm)))}${rij("E-mail",esc(mail))}${rij("Rol",esc(accRol()))}${rij("Inloggen",LIVE?"E-mail + wachtwoord":"Demo")}</section>
    <section class="acc-k"><div class="acc-kh"><span class="objic">${I.card}</span><b>Abonnement</b></div>${aboKaart}</section>
    <section class="acc-k"><div class="acc-kh"><span class="objic">${I.facturen}</span><b>Bedrijf</b></div>
      ${rij("Bedrijfsnaam",esc(s.naam||""))}${rij("Adres",esc([s.adres,[s.postcode,s.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", ")))}${rij("KvK",esc(s.kvk||""))}${rij("Btw-nummer",esc(s.btwnr||s.btwNr||""))}
      ${eig?`<button type="button" class="small" id="accBedrijf">${I.pencil}Bedrijfsgegevens bewerken</button>`:""}</section>
    <section class="acc-k"><div class="acc-kh"><span class="objic">${I.spark}</span><b>Gebruik en koppelingen</b></div>
      <div class="acc-stats"><div><b>${act}</b><small>actieve klanten</small></div><div><b>${fm}</b><small>facturen deze maand</small></div><div><b id="accN2">${a.n||1}</b><small>${(a.n||1)===1?"gebruiker":"gebruikers"}</small></div></div>
      ${rij("E-mail versturen",pill(!!s.liveMail,s.liveMail?"Actief":"Niet ingesteld"))}${rij("Online betalen",pill(!!s.liveMollie,s.liveMollie?"Mollie actief":"Niet ingesteld"))}
      ${rij("Bank",pill(!!bk.gekoppeld,bk.gekoppeld?(bk.bank||"Gekoppeld"):"Niet gekoppeld"))}${rij("AI",pill(!!s.liveAI,s.liveAI?"Claude AI aan":"Uit"))}</section>
  </div>
  <div class="row acc-foot"><button type="button" class="ghost" id="accSet">${I.instellingen}Instellingen</button><button type="button" class="ghost" id="accHulp">${I.handleiding}Handleiding</button><span class="sp"></span>${LIVE?`<button type="button" data-act="msuit">Uitloggen</button>`:""}<button type="button" class="primary" data-act="close">Sluiten</button></div>`,{wide:true});
  const g=id=>document.getElementById(id);
  if(g("accBedrijf"))g("accBedrijf").onclick=()=>{dlg.close();if(typeof openSetEdit==="function")openSetEdit("bedrijf")};
  g("accSet").onclick=()=>{dlg.close();go("instellingen")};g("accHulp").onclick=()=>{dlg.close();go("handleiding")};
  if(LIVE&&a.soort!=="eigen"&&typeof fbFn==="function")fbFn("abonnement")({}).then(r=>{const n=r&&r.data&&r.data.gebruikers;if(n){const x=g("accN"),y=g("accN2");if(x)x.textContent=n;if(y)y.textContent=n}}).catch(()=>{})}
document.addEventListener("click",e=>{const uc=e.target.closest("#userCard");if(!uc)return;e.preventDefault();openAccount()});
