/* ---------- BOEKHOUDING ---------- */
function barChart(series,labels,opts={}){
  const W=680,H=opts.h||240,pl=52,pb=28,pt=12,n=labels.length,max=Math.max(1,...series.flatMap(s=>s.v.map(Math.abs)));
  const step=[1,2,5,10,20,25,50,100,200,250,500,1000,2000,2500,5000,10000,20000,50000,100000].find(s=>max/s<=4)||Math.ceil(max/4);
  const top=Math.ceil(max/step)*step,ys=v=>pt+(H-pt-pb)*(1-v/top),gw=(W-pl-8)/n,bw=gw*.72/series.length;
  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(opts.label||"Grafiek")}">`;
  for(let v=0;v<=top;v+=step)s+=`<line x1="${pl}" x2="${W-4}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)" stroke-dasharray="${v?"3 4":""}"/><text x="${pl-8}" y="${ys(v)+4}" text-anchor="end">€${v>=1000?(v/1000).toLocaleString("nl-NL")+"k":v}</text>`;
  labels.forEach((l,i)=>{series.forEach((se,j)=>{const v=Math.max(0,se.v[i]),x=pl+i*gw+gw*.14+j*bw,y=ys(v);s+=`<rect x="${x}" y="${y}" width="${Math.max(2,bw-2)}" height="${Math.max(0,H-pb-y)}" rx="3" fill="${se.c}"><title>${esc(l)} · ${esc(se.n)}: ${eur(se.v[i])}</title></rect>`});
    s+=`<text x="${pl+i*gw+gw/2}" y="${H-8}" text-anchor="middle">${esc(l)}</text>`});
  return s+`</svg>`;
}
const legend=series=>`<div class="legend">${series.map(s=>`<span><i style="background:${s.c}"></i>${esc(s.n)}</span>`).join("")}</div>`;
function vBoekhouding(){
  const y=state.bjaar,per=state.bper,rg=periodRange(y,per),F=fin(rg),t=today();
  const years=[...new Set([t.getFullYear(),...state.facturen.map(f=>Number(String(f.datum).slice(0,4))),...state.kosten.map(c=>Number(String(c.datum).slice(0,4)))].filter(Boolean))].sort((a,b)=>b-a);
  const ag=aangifteStatus(),cur=ag[0],dl=Math.round((cur.deadline-t)/DAY),older=ag.slice(1).filter(a=>!a.gedaan&&(a.y===t.getFullYear()||a.q===4));
  const months=[...Array(12)].map((_,m)=>fin(periodRange(y,"m"+m)));
  const curM=y===t.getFullYear()?t.getMonth():11;
  let html=`<div class="pagehead"><div><h1>Boekhouding</h1><p class="lead" style="margin:0">Financieel overzicht</p></div>
    <div class="acts"><select id="bjaar" style="width:auto">${years.map(x=>`<option ${x===y?"selected":""}>${x}</option>`).join("")}</select>
    <select id="bper" style="width:auto"><option value="jaar" ${per==="jaar"?"selected":""}>Heel jaar</option>${[1,2,3,4].map(q=>`<option value="q${q}" ${per==="q"+q?"selected":""}>Q${q}</option>`).join("")}${[...Array(12)].map((_,m)=>`<option value="m${m}" ${per==="m"+m?"selected":""}>${new Date(2000,m,1).toLocaleDateString("nl-NL",{month:"long"})}</option>`).join("")}</select></div></div>
  <div class="panel aangifte"><div class="ag-row"><span class="objic" style="background:var(--surface-2);color:var(--brand)">${I.cal2}</span><div style="flex:1;min-width:0"><b>Btw-aangifte Q${cur.q} ${cur.y}</b><div class="subt">${cur.gedaan?"Ingediend op "+fmtL(state.aangiftes[cur.key]):dl>=0?"Nog "+plural(dl,"dag","dagen")+" · uiterlijk "+fmtL(cur.deadline):"Te laat sinds "+fmtL(cur.deadline)}</div></div>
    <button type="button" class="primary" data-act="aangifte" data-y="${cur.y}" data-q="${cur.q}">${cur.gedaan?"Bekijk aangifte":"Aangifte klaarzetten"} ${I.right}</button></div>
    ${older.length?`<div class="ag-old"><span>${plural(older.length,"oudere aangifte staat","oudere aangiftes staan")} nog open:</span>${older.map(a=>`<button type="button" class="tiny ghost" data-act="aangifte" data-y="${a.y}" data-q="${a.q}" style="color:var(--brand)">Btw-aangifte Q${a.q} ${a.y}</button>`).join("")}</div>`:""}</div>
  <div class="tabsline">${[["overzicht","Overzicht",I.inzichten],["inkoop","Inkoopfacturen",I.receipt],["cijfers","Cijfers",I.trend],["btw","BTW",I.bank],["controle","Controle",I.shield],["boekhouder","Boekhouder",I.send]].map(([v,l,ic])=>`<button type="button" data-act="btab" data-v="${v}" aria-pressed="${state.btab===v}" style="display:inline-flex;gap:8px">${ic}${l}</button>`).join("")}</div>`;
  const B=state.btab;
  if(B==="boekhouder")return html+vBoekhouder();
  if(B==="overzicht"){
    html+=`<div class="toolbar" style="justify-content:flex-end"><button type="button" class="primary" data-act="kost">${I.plus}Toevoegen</button><button type="button" data-act="rapport">${I.dl}Rapport (PDF)</button></div>
    <div class="stats"><button type="button" class="stat" data-act="btab" data-v="cijfers"><span class="eyebrow">Omzet</span><b>${eur(F.omzet)}</b><small>${plural(F.fs.length,"factuur","facturen")}</small></button>
      <button type="button" class="stat" data-act="btab" data-v="inkoop"><span class="eyebrow">Uitgaven</span><b>${eur(F.kosten)}</b><small>${plural(F.ks.length,"kostenpost","kosten")}</small></button>
      <button type="button" class="stat" data-act="btab" data-v="cijfers"><span class="eyebrow">Winst</span><b style="color:${F.winst>=0?"var(--ok)":"var(--late)"}">${eur(F.winst)}</b><small>${F.omzet?Math.round(F.winst/F.omzet*1000)/10+"% marge":"—"}</small></button>
      <button type="button" class="stat" data-act="btab" data-v="btw"><span class="eyebrow">BTW</span><b>${eur(F.btwSaldo)}</b><small>${F.btwSaldo>0?"af te dragen":F.btwSaldo<0?"terug te vragen":"niets open"}</small></button></div>
    <div class="panel"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3 style="margin:0">Omzet per maand · ${y}</h3><b class="big2">${eur(months[curM].omzet)}</b> <span class="subt">in ${new Date(y,curM,1).toLocaleDateString("nl-NL",{month:"long"})}</span></div></div>
      ${barChart([{n:"Omzet",c:"var(--brand)",v:months.map(m=>m.omzet)},{n:"Kosten",c:"var(--accent)",v:months.map(m=>m.kosten)}],[...Array(12)].map((_,m)=>new Date(y,m,1).toLocaleDateString("nl-NL",{month:"short"}).replace(".","")),{label:"Omzet en kosten per maand"})}
      ${legend([{n:"Omzet",c:"var(--brand)"},{n:"Kosten",c:"var(--accent)"}])}<p class="subt" style="font-size:12px;margin:8px 0 0">Excl. btw · op factuurdatum, conceptfacturen tellen niet mee.</p></div>`;
  }else if(B==="inkoop"){
    const ks=F.ks.sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));
    html+=`<div class="toolbar"><span class="subt" style="flex:1">${plural(ks.length,"bon","bonnen")} in deze periode · ${eur(ks.reduce((a,c)=>a+(Number(c.bedrag)||0),0))} incl. btw</span><button type="button" class="primary" data-act="kost">${I.camera}Bon toevoegen</button></div>`;
    html+=ks.length?`<div class="tablewrap"><table class="t"><thead><tr><th>Datum</th><th>Leverancier</th><th>Categorie</th><th>Bon</th><th class="r">Excl.</th><th class="r">Btw</th><th class="r">Incl.</th></tr></thead><tbody>${ks.map(c=>`<tr class="click" data-act="kost" data-id="${esc(c.id)}"><td>${fmtD(c.datum)}</td><td><b>${esc(c.leverancier||"—")}</b><br><small class="subt">${esc(c.omschrijving||"")}</small></td><td><span class="pill neutral">${esc(c.categorie||"Overig")}</span></td><td>${c.bon?`<span class="pill ok">${I.camera}foto</span>`:'<span class="pill soon">geen</span>'}</td><td class="r amt">${eur(kostEx(c))}</td><td class="r amt">${eur(kostBtw(c))}</td><td class="r amt">${eur(c.bedrag)}</td></tr>`).join("")}</tbody></table></div>`
      :empty("Nog geen bonnen in deze periode","Fotografeer je bonnetjes direct na aankoop met de knop Bon op Vandaag, dan klopt je winst en btw.",`<button type="button" class="primary" data-act="kost">${I.camera}Bon toevoegen</button>`);
  }else if(B==="cijfers"){
    const rows=months.map((m,i)=>({l:new Date(y,i,1).toLocaleDateString("nl-NL",{month:"long"}),...m}));const T=fin(periodRange(y,"jaar"));
    html+=`<div class="tablewrap"><table class="t"><thead><tr><th>Maand</th><th class="r">Omzet</th><th class="r">Kosten</th><th class="r">Winst</th><th class="r">Btw omzet</th><th class="r">Voorbelasting</th></tr></thead><tbody>${rows.map(r=>`<tr><td style="text-transform:capitalize">${r.l}</td><td class="r amt">${eur(r.omzet)}</td><td class="r amt">${eur(r.kosten)}</td><td class="r amt" style="color:${r.winst<0?"var(--late)":"inherit"}">${eur(r.winst)}</td><td class="r amt">${eur(r.btwOmzet)}</td><td class="r amt">${eur(r.voorbelasting)}</td></tr>`).join("")}
      <tr style="font-weight:800"><td>Totaal ${y}</td><td class="r amt">${eur(T.omzet)}</td><td class="r amt">${eur(T.kosten)}</td><td class="r amt">${eur(T.winst)}</td><td class="r amt">${eur(T.btwOmzet)}</td><td class="r amt">${eur(T.voorbelasting)}</td></tr></tbody></table></div>
      <p class="subt" style="font-size:12px">Alle bedragen excl. btw, op factuur- en bondatum. Kosten per categorie:</p>
      <div class="panel">${(()=>{const c={};fin(periodRange(y,"jaar")).ks.forEach(k=>{c[k.categorie||"Overig"]=(c[k.categorie||"Overig"]||0)+kostEx(k)});const ks=Object.keys(c).sort((a,b)=>c[b]-c[a]),mx=Math.max(1,...ks.map(k=>c[k]));return ks.length?ks.map(k=>`<div class="hbar" style="--h:${hue(k)}"><span>${esc(k)}</span><div class="b"><i style="width:${c[k]/mx*100}%"></i></div><span class="amt">${eur(c[k])}</span></div>`).join(""):'<p class="subt" style="margin:0">Nog geen kosten dit jaar.</p>'})()}</div>`;
  }else if(B==="btw"){
    html+=`<div class="tablewrap"><table class="t"><thead><tr><th>Kwartaal</th><th class="r">1a omzet</th><th class="r">1a btw</th><th class="r">5b voorbelasting</th><th class="r">Saldo</th><th>Deadline</th><th>Status</th></tr></thead><tbody>${[1,2,3,4].map(q=>{const f=fin(periodRange(y,"q"+q)),key=y+"-Q"+q,dd=qDeadline(y,q),done=state.aangiftes[key],started=new Date(y,q*3-3,1)<=t;
      return `<tr class="click" data-act="aangifte" data-y="${y}" data-q="${q}"><td><b>Q${q} ${y}</b></td><td class="r amt">${eur(f.omzet)}</td><td class="r amt">${eur(f.btwOmzet)}</td><td class="r amt">${eur(f.voorbelasting)}</td><td class="r amt"><b>${eur(f.btwSaldo)}</b></td><td>${fmtD(dd)}</td><td>${done?statusPill("ok","Ingediend"):!started?statusPill("neutral","Nog niet"):dd<t?statusPill("late","Te laat"):new Date(y,q*3,0)<t?statusPill("soon","Klaarzetten"):statusPill("plan","Loopt")}</td></tr>`}).join("")}</tbody></table></div>
      <p class="subt" style="font-size:12px">Mansard rekent de bedragen uit. De aangifte zelf doe je in Mijn Belastingdienst Zakelijk.</p>`;
  }else{
    const checks=[];const yr=periodRange(y,"jaar");
    const nob=state.kosten.filter(c=>inRange(c.datum,yr)&&!c.bon);if(nob.length)checks.push(["soon",plural(nob.length,"bon zonder foto","bonnen zonder foto"),"Bewaar een foto van elke bon, de Belastingdienst kan erom vragen.","inkoop"]);
    const conc=facturen().filter(f=>f.status==="concept");if(conc.length)checks.push(["soon",plural(conc.length,"conceptfactuur","conceptfacturen")+" niet definitief","Concepten tellen niet mee in je omzet en btw.","facturen"]);
    const late=facturen().filter(f=>fStatus(f)[1]==="Achterstallig");if(late.length)checks.push(["late",plural(late.length,"achterstallige factuur","achterstallige facturen"),"Samen "+eur(late.reduce((a,f)=>a+totals(f).inc,0))+". Stuur een herinnering vanuit Facturen.","facturen"]);
    const ub=unbilled();if(ub.length)checks.push(["soon",plural(ub.length,"afgemelde beurt","afgemelde beurten")+" niet gefactureerd","Samen "+eur(ub.reduce((a,b)=>a+(Number(b.bedrag)||0),0))+" aan omzet die nog niet op een factuur staat.","facturen"]);
    const st=S();const miss=[!st.naam&&"bedrijfsnaam",!st.iban&&"IBAN",!st.kvk&&"KvK-nummer",!st.btwnr&&"btw-nummer"].filter(Boolean);if(miss.length)checks.push(["late","Bedrijfsgegevens incompleet","Ontbreekt op je facturen: "+miss.join(", ")+".","instellingen"]);
    const nrs=echteFacturen().filter(f=>String(f.datum).startsWith(String(y))).map(f=>parseInt(String(f.nummer).split("-")[1],10)).filter(Boolean).sort((a,b)=>a-b);const gaps=[];for(let i=1;i<nrs.length;i++)if(nrs[i]-nrs[i-1]>1)gaps.push(nrs[i-1]+1);
    if(gaps.length)checks.push(["soon","Gat in factuurnummers","Ontbrekend: "+gaps.slice(0,5).map(n=>y+"-"+String(n).padStart(4,"0")).join(", ")+". Facturen moeten doorlopend genummerd zijn.","facturen"]);
    const openAg=aangifteStatus().filter(a=>!a.gedaan&&a.deadline<t);if(openAg.length)checks.push(["late",plural(openAg.length,"btw-aangifte","btw-aangiftes")+" over de deadline","Markeer een aangifte als ingediend zodra je hem hebt gedaan.","btw"]);
    html+=checks.length?`<div class="list">${checks.map(([c,ti,tx,go])=>`<div class="card" style="grid-template-columns:44px minmax(0,1fr) auto"><span class="objic" style="background:var(--${c}-bg);color:var(--${c})">${c==="late"?I.alert:I.shield}</span><b>${esc(ti)}</b><div class="meta">${esc(tx)}</div><div class="side-col">${go==="facturen"||go==="instellingen"?`<button type="button" class="small" data-act="tab" data-tab="${go}">Bekijken</button>`:`<button type="button" class="small" data-act="btab" data-v="${go}">Bekijken</button>`}</div></div>`).join("")}</div>`
      :`<div class="empty"><span class="objic big" style="background:var(--ok)">${I.shield}</span><strong>Alles in orde</strong><span>Geen open punten gevonden in ${y}.</span></div>`;
  }
  return html;
}
function openAangifte(y,q){
  const f=fin(periodRange(y,"q"+q)),key=y+"-Q"+q,done=state.aangiftes[key];
  const r=n=>Math.floor(n);// Belastingdienst rondt af op hele euro's in je voordeel
  const txt=`Btw-aangifte Q${q} ${y}\n1a Leveringen/diensten belast met hoog tarief: omzet € ${r(f.omzet)}, btw € ${r(f.btwOmzet)}\n5b Voorbelasting: € ${Math.ceil(f.voorbelasting)}\nTotaal te betalen: € ${r(f.btwOmzet)-Math.ceil(f.voorbelasting)}`;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.bank}</span><div style="flex:1"><h3>Btw-aangifte Q${q} ${y}</h3><div class="subt">Uiterlijk ${fmtL(qDeadline(y,q))}${done?" · ingediend op "+fmtL(done):""}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="tablewrap" style="box-shadow:none"><table class="t" style="min-width:0"><thead><tr><th>Rubriek</th><th class="r">Omzet</th><th class="r">Btw</th></tr></thead><tbody>
    <tr><td><b>1a</b> Leveringen/diensten belast met hoog tarief</td><td class="r amt">€ ${r(f.omzet)}</td><td class="r amt">€ ${r(f.btwOmzet)}</td></tr>
    <tr><td><b>5a</b> Verschuldigde omzetbelasting</td><td></td><td class="r amt">€ ${r(f.btwOmzet)}</td></tr>
    <tr><td><b>5b</b> Voorbelasting</td><td></td><td class="r amt">€ ${Math.ceil(f.voorbelasting)}</td></tr>
    <tr style="font-weight:800"><td>Totaal te betalen</td><td></td><td class="r amt">€ ${r(f.btwOmzet)-Math.ceil(f.voorbelasting)}</td></tr></tbody></table></div>
  <p class="subt" style="margin:0">Gebaseerd op ${plural(f.fs.length,"factuur","facturen")} en ${plural(f.ks.length,"bon","bonnen")} in dit kwartaal, afgerond op hele euro's. Facturen met 9% of 0% btw staan nu ook onder 1a; controleer dat als je die gebruikt. Indienen doe je zelf in Mijn Belastingdienst Zakelijk.</p>
  <div class="row"><button type="button" class="small" id="agCopy">${I.copy}Kopieer bedragen</button><span class="sp"></span>${done?`<button type="button" class="ghost danger" id="agUndo">Markering weghalen</button>`:`<button type="button" class="primary" id="agDone">${I.check}Markeer als ingediend</button>`}</div>`);
  $("#agCopy").onclick=e=>copy(txt,e.currentTarget);
  const setA=async v=>{const a={...state.aangiftes};if(v)a[key]=v;else delete a[key];try{await save("instellingen","aangiftes",a);dlg.close();toast(v?"Aangifte gemarkeerd als ingediend":"Markering weggehaald")}catch(er){err(er)}};
  const dn=$("#agDone");if(dn)dn.onclick=()=>setA(iso(today()));const un=$("#agUndo");if(un)un.onclick=()=>setA("");
}
