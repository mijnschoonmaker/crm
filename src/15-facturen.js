/* ---------- FACTUREN & OFFERTES ---------- */
function factTable(list,off){
  return `<div class="tablewrap"><table class="t"><thead><tr><th>Nummer</th><th>Klant</th><th>Datum</th><th>${off?"Geldig tot":"Vervalt"}</th><th>Status</th><th class="r">Bedrag</th></tr></thead><tbody>${list.map(f=>{const st=fStatus(f);return `<tr class="click" data-act="${off?"offedit":"factuur"}" data-id="${esc(f.id)}" title="${off?"Offerte openen":"Factuur openen"}"><td class="mono">${esc(f.nummer)}</td><td><b>${esc(cleanName(f.klantNaam))}</b><br><small class="subt">${esc(f.klantAdres||"")}</small></td><td>${fmtD(f.datum)}</td><td>${fmtD(f.verval)}</td><td>${statusPill(st[0],st[1])}${!off&&f.verstuurdOp&&st[1]==="Openstaand"?' <span class="pill neutral">verstuurd</span>':""}${!off&&f.incasso&&f.status!=="betaald"?` <span class="pill ${f.incassoMislukt?"late":"brand"}" title="${f.incassoMislukt?"Incasso mislukt: "+esc(f.incassoFout||""):"Wordt automatisch afgeschreven"}">${f.incassoMislukt?"incasso mislukt":"incasso"}</span>`:""}</td><td class="r amt">${eur(totals(f).inc)}</td></tr>`}).join("")}</tbody></table></div>`;
}
/* printen: definitieve facturen van klanten zonder e-mailadres (of geenemail@), nog niet geprint, van de afgelopen 45 dagen */
function printNodig(f){if(f.soort==="offerte"||["concept","oninbaar"].includes(f.status)||f.geprintOp||String(f.datum||"")<iso(addDays(today(),-45)))return false;
  const k=state.klanten.find(x=>x.id===f.klantId);const m=k?(mailK(k,"factuur")||{}).email:f.klantEmail;return !m}
function vFacturen(){
  const all=facturen().sort((a,b)=>String(b.datum).localeCompare(String(a.datum))||String(b.nummer).localeCompare(String(a.nummer)));
  const by=s=>all.filter(f=>fStatus(f)[1]===s);
  const sum=l=>l.reduce((a,f)=>a+totals(f).inc,0);
  const open=[...by("Openstaand"),...by("Achterstallig")],ub=unbilled(),ubK=new Set(ub.map(b=>b.klantId));
  const q=state.fq.toLowerCase();let F=state.fFilter;
  const cash=f=>["contant","pin"].includes(f.betaalwijze);
  /* openstaand en te laat: op factuurnummer, oudste bovenaan (zoals in DienstenCRM) */
  const opNr=(a,b)=>String(a.nummer||"").localeCompare(String(b.nummer||""),"nl",{numeric:true})||String(a.datum).localeCompare(String(b.datum));
  const lists={openstaand:open.sort(opNr),achterstallig:by("Achterstallig").sort(opNr),concept:by("Concept"),bank:by("Betaald").filter(f=>!cash(f)),contant:by("Betaald").filter(cash),oninbaar:by("Oninbaar"),betaald:by("Betaald"),alle:all,printen:all.filter(printNodig)};
  if(!lists[F])F="openstaand";
  const shown=lists[F].filter(f=>!q||[f.nummer,f.klantNaam,f.klantAdres,eur(totals(f).inc)].join(" ").toLowerCase().includes(q));
  fbSelOpschonen(new Set(all.map(f=>f.id)));
  const bk=fbBankInfo(),tc=fbTeBekijken();
  let html=`<div class="pagehead"><div><p class="kicker">Administratie</p><h1 class="xl">Facturen</h1><p class="lead" style="margin:0"><b>${all.length}</b> facturen · <b>${eur(sum(open))}</b> openstaand</p></div>
    <div class="acts"><button type="button" class="primary" data-act="newfactuur">${I.facturen}Nieuwe factuur</button><div class="drop"><button type="button" data-act="fmenu">Meer ${I.down}</button>${state.fmenu?`<div class="menu">
      <button type="button" data-act="perlijst">${I.receipt}Periodieke facturen (${state.klanten.filter(isPeriodiek).length})</button>
      <button type="button" data-act="billall" ${ub.length?"":"disabled"}>${I.facturen}Factureer gewassen werk (${ub.length})</button>
      <button type="button" data-act="finalizeall" ${by("Concept").length?"":"disabled"}>${I.check}Alle concepten definitief maken</button>
      <button type="button" data-act="fhmenu">${I.bell}Betalingsherinneringen</button>
      <button type="button" data-act="fbbankdlg">${I.bank}Bankkoppeling</button>
      <button type="button" data-act="fbupload">${I.upload}Bankbestand uploaden</button>
      ${state.dl?`<button type="button" data-act="snelstart">${I.dl}Exporteer naar SnelStart</button><button type="button" data-act="fexport">${I.dl}Exporteer als CSV</button>`:""}</div>`:""}</div></div></div>
  ${fGeldstroom(all,open,by,sum)}
  ${fbBankStrook(bk,tc)}
  ${typeof fhStrook==="function"?fhStrook():""}
  ${ub.length?`<div class="banner"><div><b>${plural(ub.length,"afgemelde beurt","afgemelde beurten")} nog niet gefactureerd</b><br><small>${plural(ubK.size,"klant","klanten")} · ${eur(ub.reduce((a,b)=>a+(Number(b.bedrag)||0),0))}</small></div><button type="button" class="primary" data-act="billall">Maak ${plural(ubK.size,"factuur","facturen")}</button><button type="button" class="ghost" data-act="ubnvt">Niet factureren…</button></div>`:""}
  ${by("Concept").length?`<div class="banner" style="background:var(--surface-2)"><div><b>${plural(by("Concept").length,"conceptfactuur","conceptfacturen")} klaar</b><br><small>Van afgemelde opdrachten · ${eur(sum(by("Concept")))}</small></div><button type="button" data-act="ff" data-v="concept">Bekijken</button><button type="button" class="primary" data-act="finalizeall">Alles definitief maken</button></div>`:""}
  ${!S().iban||!S().naam?`<div class="notice">Vul je bedrijfsnaam en IBAN in bij <button type="button" class="tiny ghost" data-act="tab" data-tab="instellingen" style="color:inherit;text-decoration:underline">Instellingen</button>, dan staan ze op elke factuur.</div>`:""}
  <div class="toolbar fb-tools"><div class="search">${I.search}<input id="fq" type="search" placeholder="Zoek op factuurnummer, klant, adres of bedrag…" value="${esc(state.fq)}"></div><button type="button" class="fb-up" data-act="fbupload" title="CAMT.053, MT940 of CSV van je bank">${I.upload}<span>Bankbestand uploaden</span></button></div>
  <div class="tabsline fb-tabs">${[["openstaand","Openstaand"],["achterstallig","Te laat"],["concept","Concept"],["bank","Per bank betaald"],["contant","Contant betaald"],["oninbaar","Oninbaar"],["printen","Printen"],["alle","Alle"]].map(([v,l])=>`<button type="button" data-act="ff" data-v="${v}" aria-pressed="${F===v||(F==="betaald"&&(v==="bank"||v==="contant"))}">${l}<span class="n">${lists[v].length}</span></button>`).join("")}</div>`+(F==="printen"?`<div class="banner pr-ban"><div><b>${lists.printen.length?plural(lists.printen.length,"factuur","facturen")+" om te printen":"Niets om te printen"}</b><br><small>Klanten zonder e-mailadres (geenemail@). Print ze en zet ze daarna op geprint.</small></div>${lists.printen.length?`<button type="button" data-act="fbprintpdf">${I.dl}PDF van alles</button><button type="button" class="primary" data-act="fbgeprint">${I.check}Alles geprint</button>`:""}</div>`:"");
  if(!shown.length)return html+(all.length?empty("Geen facturen in deze lijst",q?"Zoek op iets anders.":F==="openstaand"?"Alles is betaald. Mooi zo!":"Kies een ander tabblad."):empty("Nog geen facturen","Maak je eerste factuur via Klanten of Planning, of meld een opdracht af op Vandaag.",`<button type="button" class="primary" data-act="newfactuur">${I.facturen}Nieuwe factuur</button>`))+fbBar(all);
  return html+fbTabel(shown,F)+fbBar(all);
}
function vOffertes(){
  const all=offertes().sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));
  const F=state.oFilter,lists={alle:all,concept:all.filter(f=>(f.status||"concept")==="concept"),verstuurd:all.filter(f=>f.status==="verstuurd"),geaccepteerd:all.filter(f=>f.status==="geaccepteerd"),afgewezen:all.filter(f=>f.status==="afgewezen")};
  const tot=all.reduce((a,f)=>a+totals(f).inc,0),acc=lists.geaccepteerd.length,dec=lists.afgewezen.length;
  let html=`<div class="pagehead"><div><p class="kicker">Sales</p><h1 class="xl">Offertes</h1><p class="lead" style="margin:0">${plural(all.length,"offerte","offertes")} · <b>${eur(tot)}</b> totaalwaarde</p></div><div class="acts"><button type="button" class="primary" data-act="newofferte">${I.offertes}Nieuwe offerte</button></div></div>`;
  if(!all.length)return html+empty("Nog geen offertes",'Maak je eerste offerte aan via "Nieuwe offerte" of met de Calculator.',`<button type="button" class="primary" data-act="newofferte">${I.offertes}Eerste offerte</button>`);
  html+=`${ofHandtekening(lists,acc,dec)}
  <div class="tabsline">${[["alle","Alle"],["concept","Concept"],["verstuurd","Verstuurd"],["geaccepteerd","Geaccepteerd"],["afgewezen","Afgewezen"]].map(([v,l])=>`<button type="button" data-act="of" data-v="${v}" aria-pressed="${F===v}">${l}<span class="n">${lists[v].length}</span></button>`).join("")}</div>`;
  const shown=lists[F]||all;
  return html+(shown.length?factTable(shown,true):empty("Geen offertes in deze lijst",""));
}

/* ---------- Facturen: geldstroom van deze maand, met een munt die naar de spaarpot rolt ---------- */
const FG_POT='<svg viewBox="0 0 64 52" aria-hidden="true"><defs><linearGradient id="fgKb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#e4e8ef"/><stop offset="1" stop-color="#b9c2d0"/></linearGradient><linearGradient id="fgKg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e2a6"/><stop offset="1" stop-color="#c9a24e"/></linearGradient><linearGradient id="fgKs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="fgKc"><rect x="3" y="8" width="58" height="37" rx="5"/></clipPath></defs><g transform="rotate(-8 32 26)"><rect x="3" y="8" width="58" height="37" rx="5" fill="url(#fgKb)" stroke="#ffffff" stroke-opacity=".8" stroke-width=".8"/><g clip-path="url(#fgKc)"><rect class="fg-kglans" x="-20" y="0" width="16" height="60" fill="url(#fgKs)" transform="skewX(-20)"/></g><rect x="9" y="17" width="10" height="8" rx="1.6" fill="url(#fgKg)"/><path d="M9 21h10M14 17v8" stroke="#a8823a" stroke-width=".5" opacity=".7"/><path d="M49 17.5a5 5 0 0 1 0 7M46.5 19a2.6 2.6 0 0 1 0 4" fill="none" stroke="#6b7486" stroke-width="1.1" stroke-linecap="round"/><rect x="9" y="31" width="7" height="2" rx="1" fill="#8d96a7"/><rect x="18" y="31" width="7" height="2" rx="1" fill="#8d96a7"/><rect x="27" y="31" width="7" height="2" rx="1" fill="#8d96a7"/><rect x="36" y="31" width="7" height="2" rx="1" fill="#8d96a7"/><rect x="9" y="37" width="16" height="1.6" rx=".8" fill="#a3abba"/><circle cx="50" cy="38" r="3" fill="#3a4560" opacity=".85"/><circle cx="54" cy="38" r="3" fill="#8d96a7" opacity=".75"/></g></svg>';
const FG_MUNT='<svg viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="fgm" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6c9"/><stop offset=".55" stop-color="#f3c64a"/><stop offset="1" stop-color="#b9862a"/></radialGradient></defs><circle cx="16" cy="16" r="14" fill="url(#fgm)" stroke="#a87820" stroke-width="1.2"/><circle cx="16" cy="16" r="10.2" fill="none" stroke="#fff3c0" stroke-width="1" opacity=".7"/><text x="16" y="21" text-anchor="middle" font-size="14" font-weight="800" fill="#8a5e14" font-family="system-ui">€</text></svg>';
function fGeldstroom(all,open,by,sum){
  const t=today(),m0=iso(new Date(t.getFullYear(),t.getMonth(),1)),mnd=t.toLocaleDateString("nl-NL",{month:"long"});
  const dezeM=all.filter(f=>f.status!=="concept"&&String(f.datum||"")>=m0),gef=sum(dezeM);
  const binnenL=all.filter(f=>f.status==="betaald"&&String(f.betaaldOp||"")>=m0),binnen=sum(binnenL);
  const late=by("Achterstallig"),lateS=sum(late),openS=sum(open);
  const totaal=Math.max(1,binnen+openS),pct=Math.round(binnen/totaal*100);
  const mot=!binnen&&!openS?"Nog niets gefactureerd deze maand.":!openS?"Alles is binnen. Lekker!":lateS?`${eur0(lateS)} is over de betaaltermijn. Een herinnering helpt.`:pct>=50?`Al ${pct}% binnen, de rest is onderweg.`:`${eur0(openS)} is onderweg naar je rekening.`;
  const chip=(v,l,w,sub,cls="")=>`<button type="button" class="fg-c ${cls}" data-act="ff" data-v="${v}"><span>${l}</span><b>${w}</b><small>${sub}</small></button>`;
  return `<section class="fg${!openS&&binnen?" klaar":""}">
    <div class="fg-top"><div><p class="fg-k">Binnen in ${esc(mnd)}</p><div class="fg-big"><b>${eur0(binnen)}</b>${gef?`<span>van ${eur0(gef)} gefactureerd</span>`:""}</div><p class="fg-mot">${mot}</p></div>
      <div class="fg-pct"><b>${pct}%</b><small>binnen</small></div></div>
    <div class="fg-weg" style="--p:${pct/100}"><div class="fg-baan"><i></i></div><span class="fg-munt">${FG_MUNT}</span><span class="fg-pot">${FG_POT}</span><span class="fg-l l1">Onderweg</span><span class="fg-l l2">Op je rekening</span></div>
    <div class="fg-cs">${chip("openstaand","Onderweg",eur0(openS),plural(open.length,"factuur","facturen"))}${chip("achterstallig","Te laat",eur0(lateS),late.length?plural(late.length,"factuur","facturen"):"alles op tijd",late.length?"late":"ok")}${chip("betaald","Betaald totaal",eur0(sum(by("Betaald"))),plural(by("Betaald").length,"factuur","facturen"))}</div></section>`}

/* ---------- Offertes: een handtekening die zich vult met je scoringskans ---------- */
function ofHandtekening(lists,acc,dec){const sumI=l=>l.reduce((a,f)=>a+totals(f).inc,0),lop=[...lists.concept,...lists.verstuurd],sc=acc+dec?Math.round(acc/(acc+dec)*100):null;
  const L=1000,len=sc==null?0:sc/100*L;
  const mot=sc==null?(lop.length?`${plural(lop.length,"offerte wacht","offertes wachten")} op een handtekening.`:"Maak een offerte, de eerste handtekening komt eraan."):sc>=70?`${sc}% tekent. Klanten zeggen ja tegen je!`:sc>=40?`${sc}% tekent. Bel lopende offertes even na, dat helpt.`:`${sc}% tekent. Een nabelactie kan wonderen doen.`;
  const tile=(v,l,w,sub,cls="")=>`<button type="button" class="of-c ${cls}" data-act="of" data-v="${v==="lopend"?"verstuurd":v}"><span>${l}</span><b>${w}</b><small>${sub}</small></button>`;
  return `<section class="ofh"><div class="ofh-top"><div><p class="ofh-k">Scoringskans</p><div class="ofh-big"><b>${sc==null?"—":sc+"%"}</b><span>${acc+dec?`${acc} van ${acc+dec} beslist getekend`:"nog niets beslist"}</span></div><p class="ofh-mot">${mot}</p></div></div>
    <div class="ofh-sig"><span class="ofh-x">✕</span><svg viewBox="0 0 520 90" preserveAspectRatio="xMinYMax meet" aria-hidden="true"><path class="sp" pathLength="${L}" d="M14 62c18-30 34-44 46-38 14 7-12 44 2 44 16 0 30-56 46-52 12 3-6 40 8 40 18 0 24-34 40-34 14 0 4 30 18 30 20 0 28-44 48-44 16 0 0 40 18 40 22 0 30-28 50-28 14 0 8 22 22 22 26 0 40-32 66-32 20 0 22 26 46 26 26 0 40-14 70-18"/><path class="sv" pathLength="${L}" stroke-dasharray="${L}" stroke-dashoffset="${L-len}" style="--L:${L}" d="M14 62c18-30 34-44 46-38 14 7-12 44 2 44 16 0 30-56 46-52 12 3-6 40 8 40 18 0 24-34 40-34 14 0 4 30 18 30 20 0 28-44 48-44 16 0 0 40 18 40 22 0 30-28 50-28 14 0 8 22 22 22 26 0 40-32 66-32 20 0 22 26 46 26 26 0 40-14 70-18"/></svg><span class="ofh-lijn"></span></div>
    <div class="of-cs">${tile("lopend","Lopend",lop.length,eur0(sumI(lop)))}${tile("geaccepteerd","Getekend",acc,eur0(sumI(lists.geaccepteerd)),"ok")}${tile("afgewezen","Afgewezen",dec,plural(dec,"offerte","offertes"),dec?"late":"")}</div></section>`}

/* afgemelde beurten die niet (meer) gefactureerd hoeven te worden, bv. omdat de factuur bewust is verwijderd: uit de melding halen */
function ubNietFactureren(){const L=unbilled().sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));if(!L.length)return;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.facturen}</span><div style="flex:1;min-width:0"><h3>Niet factureren</h3><div class="subt">Deze afgemelde beurten staan nog niet op een factuur. Kies welke niet gefactureerd hoeven te worden.</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="ubn-l">${L.map(b=>{const k=state.klanten.find(x=>x.id===b.klantId)||{};return `<div class="ubn-r"><span><b>${esc(cleanName(k.naam||b.klantNaam||"Klant"))}</b><small>${esc(fmtD(b.datum))} · ${esc(b.dienst||k.dienst||"")} · ${eur(Number(b.bedrag)||0)}</small></span><button type="button" class="small" data-ubn="${esc(b.id)}">Niet factureren</button></div>`}).join("")}</div>`,{wide:false});
  form.querySelectorAll("[data-ubn]").forEach(btn=>btn.onclick=async()=>{const b=state.beurten.find(x=>x.id===btn.dataset.ubn);if(!b)return;btn.disabled=true;
    try{await save("beurten",b.id,{...strip(b),gefactureerd:"nvt"});const r=btn.closest(".ubn-r");if(r)r.remove();toast("Staat niet meer bij nog te factureren");if(!form.querySelector(".ubn-r")){dlg.close();render()}}catch(e){btn.disabled=false;err(e)}})}
