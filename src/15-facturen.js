/* ---------- FACTUREN & OFFERTES ---------- */
function factTable(list,off){
  return `<div class="tablewrap"><table class="t"><thead><tr><th>Nummer</th><th>Klant</th><th>Datum</th><th>${off?"Geldig tot":"Vervalt"}</th><th>Status</th><th class="r">Bedrag</th></tr></thead><tbody>${list.map(f=>{const st=fStatus(f);return `<tr class="click" data-act="${off?"offedit":"factuur"}" data-id="${esc(f.id)}" title="${off?"Offerte openen":"Factuur openen"}"><td class="mono">${esc(f.nummer)}</td><td><b>${esc(cleanName(f.klantNaam))}</b><br><small class="subt">${esc(f.klantAdres||"")}</small></td><td>${fmtD(f.datum)}</td><td>${fmtD(f.verval)}</td><td>${statusPill(st[0],st[1])}${!off&&f.verstuurdOp&&st[1]==="Openstaand"?' <span class="pill neutral">verstuurd</span>':""}</td><td class="r amt">${eur(totals(f).inc)}</td></tr>`}).join("")}</tbody></table></div>`;
}
function vFacturen(){
  const all=facturen().sort((a,b)=>String(b.datum).localeCompare(String(a.datum))||String(b.nummer).localeCompare(String(a.nummer)));
  const by=s=>all.filter(f=>fStatus(f)[1]===s);
  const sum=l=>l.reduce((a,f)=>a+totals(f).inc,0);
  const open=[...by("Openstaand"),...by("Achterstallig")],verst=open.filter(f=>f.verstuurdOp),ub=unbilled(),ubK=new Set(ub.map(b=>b.klantId));
  const q=state.fq.toLowerCase(),F=state.fFilter;
  const lists={alle:all,openstaand:by("Openstaand"),achterstallig:by("Achterstallig"),concept:by("Concept"),betaald:by("Betaald")};
  const shown=(lists[F]||all).filter(f=>!q||[f.nummer,f.klantNaam,f.klantAdres].join(" ").toLowerCase().includes(q));
  let html=`<div class="pagehead"><div><h1>Facturen</h1><p class="lead" style="margin:0"><b>${all.length}</b> facturen · <b>${eur(sum(open))}</b> openstaand</p></div>
    <div class="acts"><button type="button" class="primary" data-act="newfactuur">${I.facturen}Nieuwe factuur</button><div class="drop"><button type="button" data-act="fmenu">Meer ${I.down}</button>${state.fmenu?`<div class="menu">
      <button type="button" data-act="perlijst">${I.receipt}Periodieke facturen (${state.klanten.filter(isPeriodiek).length})</button>
      <button type="button" data-act="billall" ${ub.length?"":"disabled"}>${I.facturen}Factureer gewassen werk (${ub.length})</button>
      <button type="button" data-act="finalizeall" ${by("Concept").length?"":"disabled"}>${I.check}Alle concepten definitief maken</button>
      <button type="button" data-act="queue" data-q="aanmaning">${I.bell}Betalingsherinneringen</button>
      ${state.dl?`<button type="button" data-act="snelstart">${I.dl}Exporteer naar SnelStart</button><button type="button" data-act="fexport">${I.dl}Exporteer als CSV</button>`:""}</div>`:""}</div></div></div>
  <div class="stats">
    <button type="button" class="stat" data-act="ff" data-v="openstaand"><span class="eyebrow">Openstaand</span><b>${eur0(sum(open))}</b><small>${plural(open.length,"factuur","facturen")}</small></button>
    <button type="button" class="stat late" data-act="ff" data-v="achterstallig"><span class="eyebrow">Achterstallig</span><b>${eur0(sum(by("Achterstallig")))}</b><small>${plural(by("Achterstallig").length,"factuur","facturen")}</small></button>
    <div class="stat"><span class="eyebrow">Verstuurd</span><b>${verst.length}</b><small>Wacht op betaling</small></div>
    <button type="button" class="stat" data-act="ff" data-v="betaald"><span class="eyebrow">Betaald</span><b>${eur0(sum(by("Betaald")))}</b><small>${by("Betaald").length} betaald</small></button></div>
  ${ub.length?`<div class="banner"><div><b>${plural(ub.length,"afgemelde beurt","afgemelde beurten")} nog niet gefactureerd</b><br><small>${plural(ubK.size,"klant","klanten")} · ${eur(ub.reduce((a,b)=>a+(Number(b.bedrag)||0),0))}</small></div><button type="button" class="primary" data-act="billall">Maak ${plural(ubK.size,"factuur","facturen")}</button></div>`:""}
  ${by("Concept").length?`<div class="banner" style="background:var(--surface-2)"><div><b>${plural(by("Concept").length,"conceptfactuur","conceptfacturen")} klaar</b><br><small>Van afgemelde opdrachten · ${eur(sum(by("Concept")))}</small></div><button type="button" data-act="ff" data-v="concept">Bekijken</button><button type="button" class="primary" data-act="finalizeall">Alles definitief maken</button></div>`:""}
  ${!S().iban||!S().naam?`<div class="notice">Vul je bedrijfsnaam en IBAN in bij <button type="button" class="tiny ghost" data-act="tab" data-tab="instellingen" style="color:inherit;text-decoration:underline">Instellingen</button>, dan staan ze op elke factuur.</div>`:""}
  <div class="toolbar"><div class="search">${I.search}<input id="fq" type="search" placeholder="Zoek op factuurnummer, klant of adres…" value="${esc(state.fq)}"></div></div>
  <div class="tabsline">${[["alle","Alle"],["openstaand","Openstaand"],["achterstallig","Achterstallig"],["concept","Concept"],["betaald","Betaald"]].map(([v,l])=>`<button type="button" data-act="ff" data-v="${v}" aria-pressed="${F===v}">${l}<span class="n">${lists[v].length}</span></button>`).join("")}</div>`;
  if(!shown.length)return html+(all.length?empty("Geen facturen in deze lijst","Kies een ander tabblad of zoek op iets anders."):empty("Nog geen facturen","Maak je eerste factuur via Klanten of Planning, of meld een opdracht af op Vandaag.",`<button type="button" class="primary" data-act="newfactuur">${I.facturen}Nieuwe factuur</button>`));
  return html+factTable(shown,false);
}
function vOffertes(){
  const all=offertes().sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));
  const F=state.oFilter,lists={alle:all,concept:all.filter(f=>(f.status||"concept")==="concept"),verstuurd:all.filter(f=>f.status==="verstuurd"),geaccepteerd:all.filter(f=>f.status==="geaccepteerd"),afgewezen:all.filter(f=>f.status==="afgewezen")};
  const tot=all.reduce((a,f)=>a+totals(f).inc,0),acc=lists.geaccepteerd.length,dec=lists.afgewezen.length;
  let html=`<div class="pagehead"><div><p class="kicker">Sales</p><h1 class="xl">Offertes</h1><p class="lead" style="margin:0">${plural(all.length,"offerte","offertes")} · <b>${eur(tot)}</b> totaalwaarde</p></div><div class="acts"><button type="button" class="primary" data-act="newofferte">${I.offertes}Nieuwe offerte</button></div></div>`;
  if(!all.length)return html+empty("Nog geen offertes",'Maak je eerste offerte aan via "Nieuwe offerte" of met de Calculator.',`<button type="button" class="primary" data-act="newofferte">${I.offertes}Eerste offerte</button>`);
  html+=`<div class="stats"><div class="stat"><span class="eyebrow">Lopend</span><b>${lists.concept.length+lists.verstuurd.length}</b><small>${eur0([...lists.concept,...lists.verstuurd].reduce((a,f)=>a+totals(f).inc,0))}</small></div>
    <div class="stat"><span class="eyebrow">Geaccepteerd</span><b>${acc}</b><small>${eur0(lists.geaccepteerd.reduce((a,f)=>a+totals(f).inc,0))}</small></div>
    <div class="stat"><span class="eyebrow">Afgewezen</span><b>${dec}</b><small>offertes</small></div>
    <div class="stat"><span class="eyebrow">Scoringskans</span><b>${acc+dec?Math.round(acc/(acc+dec)*100)+"%":"—"}</b><small>van beslist</small></div></div>
  <div class="tabsline">${[["alle","Alle"],["concept","Concept"],["verstuurd","Verstuurd"],["geaccepteerd","Geaccepteerd"],["afgewezen","Afgewezen"]].map(([v,l])=>`<button type="button" data-act="of" data-v="${v}" aria-pressed="${F===v}">${l}<span class="n">${lists[v].length}</span></button>`).join("")}</div>`;
  const shown=lists[F]||all;
  return html+(shown.length?factTable(shown,true):empty("Geen offertes in deze lijst",""));
}
