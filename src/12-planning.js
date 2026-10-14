/* ---------- PLANNING ---------- */
function curDay(){return state.planDay||iso(today())}
function viewDays(){
  const v=state.pview,t=today();
  if(v==="dag")return[curDay()];
  if(v==="week")return[...Array(7)].map((_,i)=>iso(addDays(state.week,i)));
  if(v==="multi"){if(!state.multiDays||!state.multiDays.length)state.multiDays=[0,1,2].map(i=>iso(addDays(parse(curDay()),i)));return[...state.multiDays].sort()}
  const m=parse(state.mon||iso(new Date(t.getFullYear(),t.getMonth(),1)));const out=[];for(let d=new Date(m);d.getMonth()===m.getMonth();d=addDays(d,1))out.push(iso(d));return out;
}
function sugDate(k,days){const t=today(),lo=parse(days[0])>t?parse(days[0]):t,hi=parse(days[days.length-1]);let x=volgende(k);if(x<lo)x=lo;if(x>hi&&lo<=hi)x=hi;return werkdagAanpassen(x)}
function offerHtml(k,dayIso,timed){
  const s=dueTxt(k),h=hue(k.ronde||k.naam),days=viewDays(),sd=dayIso||iso(sugDate(k,days)),tt=(timed||state.pview!=="week"&&state.pview!=="maand")?nextFree(sd):"",picked=state.pick===k.id;
  const t=today(),gp=parse(k.gepland),mnd=["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
  let cls,band,big,ad,extra="";const dtx=x=>wd(x)+" "+x.getDate()+" "+mnd[x.getMonth()]+(x.getFullYear()!==t.getFullYear()?" "+x.getFullYear():"");
  if(gp&&gp<t){cls="late";band="gemist";big=gp.getDate();ad=gp;extra="gemist"}
  else if(!k.laatst){cls="nieuw";band="nieuw";big='<span class="kc-s">★</span>';ad=volgende(k);if(ad<t)ad=t;extra="nieuwe klant"}
  else{const v=volgende(k),d=Math.round((v-t)/DAY);ad=v;
    if(d<0){cls="late";band="te laat";big="+"+Math.abs(d)}
    else if(d===0){cls="crit";band="vandaag";big=t.getDate()}
    else{cls=d<7?"crit":d<=10?"warn":d<=14?"attn":"ok";band=d===1?"dag":"dagen";big=d}}
  const adTxt=iso(ad)===iso(t)?"vandaag":dtx(ad);
  const ao=jobAddrObj(k),sdD=parse(sd);
  return `<div class="job offer of kx-${cls}${picked?" picked":""}" style="--h:${h}" draggable="true" data-drag="${esc(k.id)}"${state.planMode?` data-act="pmpick" data-id="${esc(k.id)}"`:""}>
    <div class="of-top"><span class="kx-av of-av"><span class="kc kc-tile"><i class="kc-m">${band}</i><b>${big}</b></span></span>
      <div class="of-main"><button type="button" class="of-adr" data-act="opdracht" data-id="${esc(k.id)}" title="Opdracht openen">${esc(ao.adres||cleanName(k.naam))}</button>
        <div class="of-nm">${esc(cleanName(k.naam))}${ao.plaats?" · "+esc(ao.plaats):""}</div>
        <div class="of-st"><span>Aanboddatum</span> <b>${esc(adTxt)}</b>${extra?` · ${esc(extra)}`:""}</div></div>
      <div class="of-amt"><b>${eur0(toon(k.prijs))}</b><small>${duur(k)} min</small></div></div>
    <div class="of-chips"><span>${I.wrench}${esc(k.dienst||"Glasbewassing")}</span><span>${I.refresh||I.clock}elke ${esc(k.frequentie||4)} wk</span>${k.ronde?`<span class="of-r"><i style="background:hsl(${h} 65% 52%)"></i>${esc(k.ronde)}</span>`:""}</div>
    ${state.planMode?`<div class="of-pm${picked?" on":""}">${picked?"Gekozen · tik een tijdslot":"Tik om te kiezen"}</div>`:""}
  </div>`;
}
const pqMatch=k=>{const q=state.pq.toLowerCase();return !q||[k.naam,k.adres,k.plaats,k.postcode,jobAddr(k)].join(" ").toLowerCase().includes(q)};
const showState=st=>state.pstat==="alle"||state.pstat===st;
function dayItems(d){
  const js=actief().filter(k=>k.gepland===d).map(k=>({k,st:jobState(k,d)})).filter(x=>x.st!=="afgerond");
  actief().forEach(k=>(k.reeks||[]).forEach((r,i)=>{if(r&&r.d===d&&r.d!==k.gepland)js.push({k:{...k,gepland:d,tijd:r.t||k.tijd||""},st:"gepland",r:{i:i+2,n:(k.reeks||[]).length+1}})}));
  const done=state.beurten.filter(b=>b.datum===d).map(b=>({b,k:state.klanten.find(x=>x.id===b.klantId)||{id:b.klantId,naam:b.klantNaam,prijs:b.bedrag,tijd:b.tijd,duur:b.duur},st:"afgerond"}));
  const proj=[];if(state.pview!=="dag"){actief().filter(k=>!(k.reeks||[]).length).forEach(k=>occurrences(k,parse(d),parse(d)).forEach(o=>{if(!o.real)proj.push({k,st:"verwacht"})}))}
  return{js:js.filter(x=>showState(x.st)),done:done.filter(x=>showState("afgerond")),proj:state.pstat==="alle"?proj:[]};
}
function daySum(d){const it=dayItems(d);return{n:it.js.length+it.done.length,sum:it.js.reduce((a,x)=>a+(Number(x.k.prijs)||0),0)+it.done.reduce((a,x)=>a+(Number(x.b.bedrag)||0),0),min:it.js.reduce((a,x)=>a+duur(x.k),0)+it.done.reduce((a,x)=>a+duur(x.k),0)}}
function tjob(x,top,height,left,width){
  if(x.r)return tjobReeks(x,top,height,left,width);
  const k=x.k,a=jobAddrObj(k),sp=STATEPILL[x.st]||["neutral","Verwacht"],dim=pqMatch(k)?"":" faded";
  const cmp=height<58?" compact":"";
  return `<div class="tjob st-${x.st}${dim}${cmp}${state.flash&&!x.b&&state.flash===k.id?" just-in":""}${state.pselMode&&!x.b&&state.psel.has(k.id)?" psel":""}${state.pselMode&&!x.b?" pselable":""}" ${x.b?`data-act="beurtinfo" data-id="${esc(x.b.id)}"`:`data-act="job" data-id="${esc(k.id)}"`} data-d="${esc(x.b?x.b.datum:k.gepland)}" ${x.st!=="afgerond"?`data-drag="${esc(k.id)}"`:x.b?`data-drag="b:${esc(x.b.id)}"`:""} style="--h:${hue(k.ronde||k.naam)};top:${top}px;height:${height}px;left:calc(${left}% + 3px);width:calc(${width}% - 6px)">
    <div class="tj-top"><button type="button" class="tj-nm" ${x.b?`data-act="beurtinfo" data-id="${esc(x.b.id)}"`:`data-act="job" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}"`}>${esc(a.adres||cleanName(k.naam))}${a.plaats?", "+esc(a.plaats):""}</button>${x.st==="bezig"?'<span class="pill busy tiny-p">Bezig</span>':""}</div>
    <div class="tj-bot">${dienstHtml(k)}<span class="amt">${eur0(toon(x.b?x.b.bedrag:k.prijs))}</span>${x.st==="afgerond"?`<span class="tj-ok done">${I.check}</span>`:`<button type="button" class="tj-ok" data-act="was" data-id="${esc(k.id)}" aria-label="${esc(cleanName(k.naam))} afgerond">${I.check}</button>`}</div></div>`;
}
function dayHead(d,showWk){
  const dd=parse(d),s=daySum(d),isT=d===iso(today()),fd=feestdag(dd),off=!isWerkdag(dd),te=S().maxJobs&&s.n>S().maxJobs;
  const u=s.min?Math.floor(s.min/60)+"u"+(s.min%60?pad(s.min%60):""):"";
  return `<button type="button" class="tg-dh${isT?" today":""}${off?" off":""}${showWk?" solo":""}" title="${esc(fd||(off?"Geen werkdag":""))}" data-act="pickday" data-d="${d}">
    <span class="dh-w">${isT?"Vandaag · ":""}${dd.toLocaleDateString("nl-NL",{weekday:showWk?"long":"short"}).replace(".","")}</span>
    <span class="dh-d"><b>${dd.getDate()}</b><small>${dd.toLocaleDateString("nl-NL",{month:"short"}).replace(".","")}</small></span>
    <span class="dh-s">${fd?esc(fd):off&&!s.n?"Vrije dag":s.n?`${plural(s.n,"job","jobs")}${u?" · "+u:""}<em>${eur0(toon(s.sum))}</em>`:"Nog niets gepland"}${te?` <b class="dh-warn" title="Meer dan ${S().maxJobs} jobs">!</b>`:""}</span></button>`;
}
function timeGrid(days){
  if(![10,15,30].includes(state.slot))state.slot=30;
  const slot=state.slot,H=Math.round((slot===10?28:slot===15?32:50)*state.rowH),S0=Math.floor((toMin(S().kalVan)??360)/60)*60,E0=Math.max(S0+120,Math.ceil((toMin(S().kalTot)??1200)/60)*60),n=(E0-S0)/slot;
  const nowM=new Date().getHours()*60+new Date().getMinutes();
  const items=days.map(d=>dayItems(d));
  const anyUn=items.some(it=>it.js.some(x=>toMin(x.k.tijd)==null)||it.done.some(x=>toMin(x.b.tijd)==null));
  let html=`<div class="tgwrap"><div class="tg${days.length>=5?" tg-wk":""}" style="--n:${days.length};--H:${H}px"><div class="tg-head"><div class="tg-corner"><small>wk ${weekNr(parse(days[0]))}</small></div>${days.map(d=>dayHead(d,days.length===1)).join("")}</div>`;
  if(false)html+=`<div class="tg-un"><div class="tg-corner sm">Nog geen tijd</div>${days.map((d,i)=>`<div class="tg-uc">${items[i].done.filter(x=>toMin(x.b.tijd)==null).map(x=>`<span class="uchip done">${I.check}${esc(cleanName(x.b.klantNaam))}</span>`).join("")}${items[i].js.filter(x=>toMin(x.k.tijd)==null).map(x=>`<span class="uchip${pqMatch(x.k)?"":" faded"}" draggable="true" data-drag="${esc(x.k.id)}" data-act="klant" data-id="${esc(x.k.id)}">${esc(jobAddrObj(x.k).adres||cleanName(x.k.naam))}</span>`).join("")}</div>`).join("")}</div>`;
  html+=`<div class="tg-body"><div class="tg-times">${[...Array(n)].map((_,i)=>{const m=S0+i*slot;return `<span style="height:${H}px" class="${m%60?"hh":"hu"}">${fromMin(m)}</span>`}).join("")}</div>`;
  days.forEach((d,ci)=>{
    const it=items[ci];
    const timed=[...it.js.filter(x=>toMin(x.k.tijd)!=null).map(x=>({...x,s:toMin(x.k.tijd)})),...it.done.filter(x=>toMin(x.b.tijd)!=null).map(x=>({...x,s:toMin(x.b.tijd)}))].sort((a,b)=>a.s-b.s);
    const placed=[];timed.forEach(x=>{const s=Math.max(S0,x.s),e=s+duur(x.k);let lane=0;while(placed.some(p=>p.lane===lane&&p.s<e&&s<p.e))lane++;placed.push({...x,s,e,lane})});
    const lanes=Math.max(1,...placed.map(p=>p.lane+1)),isT=d===iso(today());
    html+=`<div class="tg-col${isT?" today":""}">${[...Array(n)].map((_,i)=>{const m=S0+i*slot,ws=toMin(S().werkStart)??480,we=toMin(S().werkEind)??1020;return `<div class="tslot${m%60===0?" hour":""}${m<ws||m>=we?" offh":""}${(state.planMode&&state.pick)||(ADV.meer&&mSel.size)?" pickable":""}" style="height:${H}px" data-drop="${d}" data-tijd="${fromMin(m)}" data-act="tslot" data-d="${d}" data-t="${fromMin(m)}"></div>`}).join("")}
      ${placed.map(p=>tjob(p,(p.s-S0)/slot*H+3,Math.max(H-6,(p.e-p.s)/slot*H-6),p.lane/lanes*100,100/lanes)).join("")}
      ${isT&&nowM>=S0&&nowM<E0?`<div class="tnow" style="top:${(nowM-S0)/slot*H}px"></div>`:""}</div>`;
  });
  return html+`</div></div></div>`;
}
function weekCols(days){
  const t=iso(today());
  return `<div class="weekwrap"><div class="weekgrid">${days.map(d=>{const it=dayItems(d),s=daySum(d);return `<div class="daycol${d===t?" is-today":""}" data-drop="${d}">
    ${dayHead(d,false)}
    ${it.done.map(x=>`<div class="job done" style="--h:${hue(x.b.klantNaam)}"><div class="jn">${I.check}<button type="button" data-act="klant" data-id="${esc(x.b.klantId)}">${esc(cleanName(x.b.klantNaam))}</button></div><div class="jf"><span class="ja">Afgerond</span><span class="amt">${eur0(toon(x.b.bedrag))}</span></div></div>`).join("")}
    ${it.js.sort((a,b)=>(toMin(a.k.tijd)??9999)-(toMin(b.k.tijd)??9999)).map(x=>{const k=x.k;if(x.r)return reeksCard(x);return `<div class="job${pqMatch(k)?"":" faded"}${x.st==="bezig"?" busy":""}${state.pselMode&&state.psel.has(k.id)?" psel":""}${state.pselMode?" pselable":""}" style="--h:${hue(k.ronde||k.naam)}" draggable="true" data-drag="${esc(k.id)}">
      <div class="jn">${k.tijd?`<span class="tm">${esc(k.tijd)}</span>`:""}<button type="button" data-act="job" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}">${esc(jobAddrObj(k).adres||cleanName(k.naam))}</button></div>
      <div class="ja">${esc(cleanName(k.naam))}</div><div class="ja">${dienstHtml(k)}</div>
      <div class="jf"><span class="amt">${eur0(toon(k.prijs))}</span><span style="display:flex;gap:4px"><button type="button" class="tiny ghost" data-act="afsprdel" data-id="${esc(k.id)}" title="Afspraak verwijderen" aria-label="Afspraak verwijderen">${I.trash}</button><button type="button" class="check sm" data-act="was" data-id="${esc(k.id)}" aria-label="Afgerond">${I.check}</button></span></div></div>`}).join("")}
    ${it.proj.map(x=>`<div class="job proj" style="--h:${hue(x.k.ronde||x.k.naam)}"><div class="jn"><button type="button" data-act="klant" data-id="${esc(x.k.id)}">${esc(cleanName(x.k.naam))}</button></div><div class="jf"><span class="amt">${eur0(toon(x.k.prijs))}</span><span class="pill neutral">verwacht</span></div></div>`).join("")}
  </div>`}).join("")}</div></div>`;
}
function monthGrid(days){
  const first=parse(days[0]),lead=(first.getDay()+6)%7,t=iso(today());
  const cells=[...Array(lead)].map(()=>`<div class="mcell blank"></div>`).concat(days.map(d=>{const s=daySum(d),it=dayItems(d);return `<button type="button" class="mcell${d===t?" today":""}${isWerkdag(parse(d))?"":" off"}" data-act="pickday" data-d="${d}"><span class="md">${parse(d).getDate()}</span>${s.n?`<span class="mn">${plural(s.n,"job","jobs")}</span><span class="amt">${eur0(toon(s.sum))}</span>`:it.proj.length?`<span class="mn faded">${it.proj.length} verwacht</span>`:""}</button>`}));
  return `<div class="mgrid">${["ma","di","wo","do","vr","za","zo"].map(x=>`<span class="mh">${x}</span>`).join("")}${cells.join("")}</div>`;
}
state.planMode=false;
function vPlanning(){
  const v=state.pview,t=today(),days=viewDays(),first=parse(days[0]),last=parse(days[days.length-1]);
  state.week=startOfWeek(v==="maand"?parse(curDay()):first);
  let offer=teplannen(offerUpTo(addDays(last<t?t:last,zichtbaarDagen())));if(state.achter)offer=offer.filter(k=>dueOf(k)<t);offer=offerFilter(offer);
  const offerAll=offer;if(state.pkaart&&state.ksel.size){[...state.ksel].forEach(id=>{if(!offerAll.some(k=>k.id===id))state.ksel.delete(id)});if(state.ksel.size)offer=offer.filter(k=>state.ksel.has(k.id))}
  const offerSum=offer.reduce((a,k)=>a+(Number(k.prijs)||0),0);
  const tot=days.reduce((a,d)=>{const s=daySum(d);a.n+=s.n;a.sum+=s.sum;return a},{n:0,sum:0});
  const title=v==="dag"?longD(first):v==="week"?"Week "+weekNr(first):v==="multi"?plural(days.length,"dag","dagen"):first.toLocaleDateString("nl-NL",{month:"long",year:"numeric"});
  const sub=v==="dag"?"Dagplanning · wk "+weekNr(first):v==="week"?fmtD(first)+" – "+fmtD(last):v==="multi"?"Geselecteerde dagen · wk "+weekNr(first):"Maandoverzicht";
  const d0=curDay();
  const totMin=days.reduce((a,d)=>a+daySum(d).min,0),isT=v==="dag"&&d0===iso(t);
  const navTxt=v==="dag"?(isT?"Vandaag":"Naar vandaag"):v==="week"?"Deze week":v==="maand"?"Deze maand":"Vandaag";
  const tglChip=(on,act,lbl,ic)=>on?`<button type="button" class="pl-chip" data-act="${act}">${ic}${lbl}${I.x}</button>`:"";
  const mi=(act,ic,lbl,sub,extra="")=>`<button type="button" class="pl-mi" data-act="${act}"${extra}>${ic}<span><b>${lbl}</b>${sub?`<small>${sub}</small>`:""}</span></button>`;
  const mt=(act,ic,lbl,on)=>`<button type="button" class="pl-mi tg" data-act="${act}" aria-pressed="${!!on}">${ic}<span><b>${lbl}</b></span><i class="pl-sw"></i></button>`;
  let html=`<div class="pl-head">
    <div class="pl-tt"><p class="kicker">Planning${v==="dag"?" · wk "+weekNr(first):""}</p><h1 class="xl">${esc(title)}</h1>
      <p class="pl-sum">${v==="dag"?"":esc(sub)+" · "}<b>${plural(tot.n,"job","jobs")}</b>${totMin?` · ${Math.floor(totMin/60)}u${pad(totMin%60)}`:""} · <b>${eur0(toon(tot.sum))}</b> <small>${btwLbl()}</small>${offer.length?` · <button type="button" class="linkbtn" data-act="${big()?"pscrolloffer":"offersheet"}">${offer.length} te plannen</button>`:""}</p></div>
    <div class="pl-nav">
      <div class="pl-dnav" role="group" aria-label="Datum"><button type="button" data-act="pnav" data-n="-1" aria-label="Vorige">${I.left}</button><button type="button" class="pl-today${isT?" is-nu":""}" data-act="pnav" data-n="0">${navTxt}</button><button type="button" data-act="pnav" data-n="1" aria-label="Volgende">${I.right}</button></div>
      <div class="seg pl-view" role="group" aria-label="Weergave">${[["dag","Dag"],["week","Week"],["multi","Multi"],["maand","Maand"]].map(([x,l])=>`<button type="button" data-act="pview" data-v="${x}" aria-pressed="${v===x}">${l}</button>`).join("")}</div>
    </div></div>
  <div class="pl-bar">
    <div class="search pl-q">${I.search}<input id="pq" type="search" placeholder="Zoek klant of adres…" value="${esc(state.pq)}" autocomplete="off" aria-controls="pqRes">${pqResHtml(offerAll)}</div>
        <span class="pl-sp"></span>
    ${state.pstat&&state.pstat!=="alle"?`<button type="button" class="pl-chip" data-act="pstat" data-v="alle"><span class="sdot ${({gepland:"plan",bezig:"busy",afgerond:"ok"})[state.pstat]}"></span>Alleen ${({gepland:"gepland",bezig:"bezig",afgerond:"afgerond"})[state.pstat]}${I.x}</button>`:""}
    ${tglChip(state.achter,"achter","Alleen achterstallig",I.alert)}${tglChip(state.pselMode,"pselmode","Selecteren",I.checksq||I.check)}
    <button type="button" class="pl-kaart" data-act="pkaart" aria-pressed="${!!state.pkaart}" title="Kaartplannen">${I.map}<span>Kaartplannen</span></button>
    <button type="button" class="primary pl-opt" data-act="planmail" data-d="${d0}" title="Klanten laten weten wanneer je komt">${I.send}<span>Planningsmail</span></button>
    <div class="pl-meer${state.pmeer?" open":""}"><button type="button" class="iconbtn pl-mb" data-act="pmeer" aria-expanded="${!!state.pmeer}" aria-label="Meer acties" title="Meer">${I.dots||"⋯"}</button>
      <div class="pl-menu" role="menu">
        <p class="pl-ml">Acties</p>
        ${v==="dag"||v==="multi"?mi("optim",I.route||I.wand,"Optimaliseer route","Jobs van deze dag in de kortste volgorde",` data-d="${d0}"`):""}
        ${mi("daynote",I.note,"Notitie bij deze dag","",` data-d="${d0}"`)}
        ${mi("bulkday",I.cal2,"Bulk dag","Hele dag in één keer verzetten of afmelden",` data-d="${d0}"`)}
        ${mi("refresh",I.refresh,"Verversen","")}
        <span class="pl-mk">${mt("pkaart",I.map,"Kaartplannen",state.pkaart)}</span>
        <p class="pl-ml">Tonen</p>
        <div class="pl-mrow"><div class="seg pl-st2">${[["alle","Alle",""],["gepland","Gepland","plan"],["bezig","Bezig","busy"],["afgerond","Afgerond","ok"]].map(([x,l,c])=>`<button type="button" data-act="pstat" data-v="${x}" aria-pressed="${(state.pstat||"alle")===x}">${c?`<span class="sdot ${c}"></span>`:""}${l}</button>`).join("")}</div></div>
        <p class="pl-ml">Werkwijze</p>
        ${mt("pselmode",I.checksq||I.check,"Meerdere afspraken selecteren",state.pselMode)}
        ${mt("achter",I.alert,"Alleen achterstallig tonen",state.achter)}
        ${v==="dag"||v==="multi"?`<p class="pl-ml">Weergave</p>
        <div class="pl-mrow"><span>Tijdvak</span><div class="seg">${[10,15,30].map(x=>`<button type="button" data-act="slotsz" data-v="${x}" aria-pressed="${state.slot===x}">${x} min</button>`).join("")}</div></div>
        <div class="pl-mrow"><span>Hoogte</span><div class="seg"><button type="button" data-act="rowh" data-n="-1" aria-label="Lager">${I.minus}</button><button type="button" disabled style="opacity:1;color:var(--ink);min-width:74px">${state.rowH<1?"Compact":state.rowH>1?"Ruim":"Normaal"}</button><button type="button" data-act="rowh" data-n="1" aria-label="Hoger">${I.plus}</button></div></div>`:""}
      </div></div>
  </div>
  ${state.pselMode?pselBar():""}
  ${state.pkaart&&state.klanten.length?pkSlot(offerAll,days):""}
  ${state.planMode?`<div class="notice" style="background:var(--brand-soft);color:var(--brand)">Plan-modus staat aan: kies rechts een klant en tik daarna op een tijdslot.${state.pick?" Gekozen: <b>"+esc(cleanName((state.klanten.find(k=>k.id===state.pick)||{}).naam))+"</b>":""}</div>`:""}`;
  if(v==="multi")html+=`<div class="ctrlrow" style="justify-content:flex-start"><span class="eyebrow">Dagen:</span>${days.map(d=>`<span class="chip daychip">${wd(parse(d))} ${fmtD(d)}<button type="button" class="tiny ghost" data-act="mdel" data-d="${d}" aria-label="Verwijder ${fmtD(d)}">${I.x}</button></span>`).join("")}${days.length<6?`<input type="date" id="madd" style="width:auto" aria-label="Dag toevoegen">`:""}</div>`;
  if(!state.klanten.length)return html+empty("Nog geen klanten","Voeg je eerste klant toe of importeer je klantenbestand.",`<button type="button" class="primary" data-act="klant">${I.plus}Nieuwe klant</button>`);
  if(!big()&&v==="dag"){const wk=[...Array(7)].map((_,i)=>iso(addDays(startOfWeek(first),i)));html+=`<div class="daypick">${wk.map(d=>`<button type="button" data-act="pickday" data-d="${d}" aria-pressed="${d===d0}"${d===iso(t)?' class="is-today"':""}><span>${wd(parse(d))}</span><b>${parse(d).getDate()}</b><i>${daySum(d).n}</i></button>`).join("")}</div>`}
  html+=v==="week"?timeGrid((()=>{const w=S().werkdagen||[1,2,3,4,5],wd=days.filter(d=>w.includes(parse(d).getDay())||dayItems(d).js.length);return wd.length?wd:days})()):v==="maand"?monthGrid(days):timeGrid(days);
  const offerCol=`<aside class="rpanel offercol" data-drop=""><div class="rp-h2"><span class="eyebrow rp-h">${I.inbox}Te plannen</span><span class="mono">${offer.length} · ${eur0(toon(offerSum))} <small>${btwLbl()}</small></span></div>
    ${state.pkaart&&state.ksel.size?`<div class="pk-selbar">${I.map}<span><b>${plural(offer.length,"adres","adressen")}</b> geselecteerd op de kaart</span><button type="button" class="tiny ghost" data-act="pkwis">Alles tonen</button></div>`:""}
    ${advHtml(offer,d0)}
    ${offer.length>1&&!state.planMode?`<button type="button" class="small" style="width:100%;margin-bottom:10px" data-act="planall">Alles inplannen op aanboddatum</button>`:""}
    <div class="list" style="gap:8px">${offer.length?offerCards(offer,v==="dag"&&parse(d0)>=t?d0:""):`<p class="subt" style="text-align:center;font-style:italic;margin:30px 0">Alles ingepland</p>`}</div></aside>`;
  if(big())return `<div class="withside">`+`<div class="mainc">${html}</div>${offerCol}</div>`;
  return html+(offer.length?`<button type="button" class="fab-plan" data-act="offersheet">${I.inbox}${offer.length} in te plannen</button>`:"");
}

/* beknopte info bij een afgeronde afspraak */
function openBeurtInfo(id){
  const b=state.beurten.find(x=>x.id===id);if(!b)return;const k=state.klanten.find(x=>x.id===b.klantId),d=parse(b.datum);
  const f=b.gefactureerd?state.facturen.find(x=>x.id===b.gefactureerd):null;
  const nm=cleanName(k?k.naam:b.klantNaam),adr=k?jobAddr(k):"",tel=k?String(k.telefoon||"").replace(/[^\d+]/g,""):"";
  const rij=(l,v)=>v?`<div class="bi-r"><span>${l}</span><b>${v}</b></div>`:"";
  openDlg(`<div class="jp">
    <div class="jp-head"><div class="jp-meta">${statusPill("ok","Afgerond")}<span>${I.planning}${["zo","ma","di","wo","do","vr","za"][d.getDay()]} ${esc(fmtD(d))}</span>${b.tijd?`<span>${I.clock}${esc(b.tijd)}</span>`:""}</div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="jp-who"><span class="av" style="--h:${hue(k?(k.ronde||k.naam):b.klantNaam)}">${esc(initials(nm))}</span><div style="min-width:0"><h3>${esc(nm)}</h3>${adr?`<div class="sc-sub">${I.pin}${esc(adr)}</div>`:""}${k?`<button type="button" class="linkbtn" data-act="klant" data-id="${esc(k.id)}">Naar klantkaart ${I.right}</button>`:`<small class="help">Deze klant staat niet meer in je klantenbestand.</small>`}</div></div>
    ${k?`<div class="jp-tiles">${tel?`<a class="jp-tile" href="tel:${esc(tel)}">${I.phone}<span>Bellen</span></a>`:`<span class="jp-tile dis">${I.phone}<span>Bellen</span></span>`}${k.email?`<a class="jp-tile" href="mailto:${esc(k.email)}">${I.mail}<span>Mail</span></a>`:`<span class="jp-tile dis">${I.mail}<span>Mail</span></span>`}<a class="jp-tile" href="${esc(mapsQ(k))}" target="_blank" rel="noopener">${I.nav}<span>Route</span></a></div>`:""}
    <div class="jp-body"><div class="bi">
      ${rij("Dienst",esc(b.dienst||(k&&k.dienst)||"Glasbewassing"))}
      ${rij("Bedrag",eur(toon(Number(b.bedrag)||0)))}
      ${rij("Duur",b.duur?esc(b.duur)+" min":"")}
      ${rij("Factuur",f?esc(f.nummer||"Concept")+" · "+(f.status==="betaald"||b.betaald?"betaald":f.status==="concept"?"concept":"open")+(f.periodiek?" (periodiek)":""):b.gefactureerd==="periodiek"?"Gaat mee op de periodieke factuur":b.gefactureerd==="nvt"?"Niet gefactureerd (zo ingesteld)":b.gefactureerd?"Gefactureerd":"Nog niet gefactureerd")}
      ${k?rij("Frequentie","elke "+esc(k.frequentie||4)+" weken"):""}
      ${k&&k.gepland?rij("Volgende afspraak",esc(fmtL(k.gepland))+(k.tijd?" om "+esc(k.tijd):"")):""}
    </div>${b.notitie?`<div class="notebox"><span class="eyebrow">Notitie bij deze beurt</span>${esc(b.notitie)}</div>`:""}</div>
    <div class="jp-foot">${f?`<button type="button" data-act="editf" data-id="${esc(f.id)}">${I.facturen}Factuur bekijken</button>`:""}${k?`<button type="button" class="primary" data-act="klant" data-id="${esc(k.id)}">${I.klanten}Klantkaart</button>`:`<button type="button" data-act="close">Sluiten</button>`}</div>
  </div>`,{drawer:true});
}

/* ---------- Planningsmail verzenden ---------- */
let pm=null;
const pmGepland=()=>{const o=state.planmails||{};return Array.isArray(o.items)?o.items:[]};
function pmVak(k){const m=toMin(k.tijd);if(m==null)return"in de loop van de dag";return m<12*60?"in de ochtend":m<17*60?"in de middag":"in de avond"}
function pmKlanten(d){return actief().filter(k=>k.gepland===d).sort((a,b)=>(toMin(a.tijd)??9999)-(toMin(b.tijd)??9999)||jobAddr(a).localeCompare(jobAddr(b)))}
function pmStd(){const t=today(),w=S().werkdagen||[1,2,3,4,5];for(let i=1;i<10;i++){const d=addDays(t,i);if(pmKlanten(iso(d)).length)return iso(d)}let d=addDays(t,1);while(!w.includes(d.getDay()))d=addDays(d,1);return iso(d)}
function openPlanMail(dag){
  const T=tpls(),A=T.aankondiging||{},d=dag&&parse(dag)>today()?dag:pmStd();
  pm={mode:"afspraken",verz:"direct",datum:d,naam:false,sel:new Set(pmKlanten(d).filter(k=>mailK(k,"planning").email).map(k=>k.id)),mail:true,sms:false,tekst:"kennis",tpl:"aankondiging",onderwerp:A.onderwerp||"",body:A.mail||"",smsBody:A.sms||"",op:iso(addDays(parse(d),-2)),opT:"18:00",open:3};
  drawPlanMail();
}
function pmVars(k){const v=klantVars(k,parse(pm.datum));if(pm.mode==="tijdvakken")v.tijdvak=pmVak(k);return v}
function drawPlanMail(){
  const T=tpls(),ks=pmKlanten(pm.datum),sel=ks.filter(k=>pm.sel.has(k.id)),refs=sentRefs(),gp=pmGepland();
  const stap=(n,titel,waarde,body)=>`<section class="pm-st${pm.open===n?" open":""}"><button type="button" class="pm-sh" data-pmopen="${n}"><span class="pm-n">${n}</span><b>${titel}</b><span class="pm-v">${waarde}</span>${I.down}</button>${pm.open===n?`<div class="pm-sb">${body}</div>`:""}</section>`;
  const keuze=(grp,v,l,sub,ic)=>`<button type="button" class="pm-ch" data-pm="${grp}" data-v="${v}" aria-pressed="${pm[grp]===v}">${ic||""}<span><b>${l}</b>${sub?`<small>${sub}</small>`:""}</span><i></i></button>`;
  const tplKeys=Object.keys(T).filter(k=>T[k].actief!==false&&k!=="aankondiging");
  const nMail=sel.filter(k=>mailK(k,"planning").email).length,nTel=sel.filter(k=>k.telefoon).length;
  const vb=sel[0]||ks[0],vv=vb?pmVars(vb):null;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.send}</span><div style="min-width:0;flex:1"><h3>Planningsmail verzenden</h3><div class="subt">Laat klanten weten wanneer je komt</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="pm">
  ${stap(1,"Naar afspraken of tijdvakken?",pm.mode==="afspraken"?"Afspraken":"Tijdvakken",`<div class="pm-chs">${keuze("mode","afspraken","Afspraken","Met de exacte tijd, bijv. tussen 09:30 en 10:15",I.clock)}${keuze("mode","tijdvakken","Tijdvakken","Alleen ochtend, middag of avond",I.sun)}</div>`)}
  ${stap(2,"Verzending",pm.verz==="direct"?"Direct versturen":"Gepland · "+esc(fmtD(pm.op))+" "+esc(pm.opT),`<div class="pm-chs">${keuze("verz","direct","Direct versturen","Je verstuurt de berichten nu",I.send)}${keuze("verz","gepland","Gepland bericht klaarzetten","Staat op de gekozen dag klaar om te versturen",I.timer)}</div>
    ${pm.verz==="gepland"?`<div class="row" style="gap:10px;margin-top:12px"><label style="flex:1">Versturen op<input type="date" id="pmOp" value="${esc(pm.op)}"></label><label style="flex:1">Om<input type="time" id="pmOpT" value="${esc(pm.opT)}"></label></div><p class="help" style="margin:6px 0 0">Standaard 2 dagen voor de afspraak.</p>`:""}`)}
  ${stap(3,"Naar welke afspraken?",plural(sel.length,"afspraak","afspraken")+" · "+esc(wd(parse(pm.datum))+" "+fmtD(pm.datum)),`
    <label>Kies de datum<input type="date" id="pmDag" value="${esc(pm.datum)}"></label>
    <div class="pm-opts"><label class="pm-cb"><input type="checkbox" id="pmNaam" ${pm.naam?"checked":""}><span>Klantnaam weergeven</span></label><label class="pm-cb"><input type="checkbox" id="pmAll" ${ks.length&&sel.length===ks.length?"checked":""}><span>Alles selecteren</span></label></div>
    <div class="pm-list">${ks.length?ks.map(k=>{const done=refs.has("planmail:"+pm.datum+":"+k.id),gep=gp.some(g=>g.datum===pm.datum&&g.klantId===k.id);
      return `<label class="pm-it${pm.sel.has(k.id)?" sel":""}"><input type="checkbox" data-pmk="${esc(k.id)}" ${pm.sel.has(k.id)?"checked":""}><span class="pm-tm">${esc(pm.mode==="tijdvakken"?pmVak(k).replace("in de ",""):k.tijd||"–")}</span><span class="pm-ad"><b>${esc(pm.naam?cleanName(k.naam):k.adres||jobAddr(k))}</b><small>${esc(pm.naam?jobAddr(k):[k.postcode,k.plaats].filter(Boolean).join(" "))}</small></span>${done?`<span class="pill ok">verstuurd</span>`:gep?`<span class="pill neutral">gepland</span>`:""}<span class="pm-ic${mailK(k,"planning").email?"":" off"}" title="${mailK(k,"planning").email?esc(mailK(k,"planning").email):"Geen e-mailadres"}">${I.mail}</span></label>`}).join(""):`<p class="subt" style="text-align:center;margin:18px 0">Geen afspraken op deze dag</p>`}</div>`)}
  ${stap(4,"Berichttekst",(pm.tekst==="kennis"?"Kennisgeving":esc((T[pm.tpl]||{}).naam||"Vrije tekst"))+" · "+[pm.mail&&"e-mail",pm.sms&&"sms/WhatsApp"].filter(Boolean).join(" + "),`
    <div class="pm-opts"><label class="pm-cb"><input type="checkbox" id="pmMail" ${pm.mail?"checked":""}><span>E-mail</span></label><label class="pm-cb"><input type="checkbox" id="pmSms" ${pm.sms?"checked":""}><span>SMS / WhatsApp</span></label></div>
    <div class="pm-chs">${keuze("tekst","kennis","Kennisgevingen en afspraakvoorstellen","Standaard aankondiging met datum en "+(pm.mode==="tijdvakken"?"tijdvak":"tijd"),I.megaphone)}${keuze("tekst","vrij","Vrije tekst / template","Kies een template of schrijf zelf",I.pencil)}</div>
    ${pm.tekst==="vrij"?`<label>Template<select id="pmTpl"><option value="">Vrije tekst</option>${tplKeys.map(k=>`<option value="${esc(k)}"${pm.tpl===k?" selected":""}>${esc(T[k].naam)}</option>`).join("")}</select></label>`:""}
    ${pm.mail?`<label>Onderwerp<input id="pmSubj" value="${esc(pm.onderwerp)}"></label><label>E-mail — woorden tussen {accolades} worden per klant ingevuld<textarea id="pmBody" style="min-height:150px">${esc(pm.body)}</textarea></label>`:""}
    ${pm.sms?`<label>SMS / WhatsApp<textarea id="pmSmsB" style="min-height:70px">${esc(pm.smsBody)}</textarea></label>`:""}
    ${vv&&pm.mail?`<div class="pm-prev"><span class="eyebrow">Voorbeeld voor ${esc(cleanName(vb.naam))}</span><b>${esc(fill(pm.onderwerp,vv))}</b><p>${esc(fill(pm.body,vv)).replace(/\n/g,"<br>")}</p></div>`:""}`)}
  </div>
  <div class="row pm-foot"><button type="button" id="pmGep">${I.timer}Geplande berichten${gp.length?` <span class="pm-badge">${gp.length}</span>`:""}</button><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="button" class="primary" id="pmGo" ${sel.length&&(pm.mail||pm.sms)?"":"disabled"}>${I.send}${pm.verz==="gepland"?"Klaarzetten":"Verzenden"}${sel.length?" ("+sel.length+")":""}</button></div>
  ${pm.mail&&sel.length>nMail?`<p class="help" style="margin:8px 0 0;text-align:right">${plural(sel.length-nMail,"klant heeft","klanten hebben")} geen e-mailadres${pm.sms&&nTel?"; die krijgen sms/WhatsApp":""}.</p>`:""}`,{wide:true});
  const keep=()=>{const g=id=>{const e=$("#"+id);return e?e.value:null};const s=g("pmSubj"),b=g("pmBody"),m=g("pmSmsB");if(s!=null)pm.onderwerp=s;if(b!=null)pm.body=b;if(m!=null)pm.smsBody=m;const o=g("pmOp"),ot=g("pmOpT");if(o)pm.op=o;if(ot)pm.opT=ot};
  const re=()=>{keep();const y=dlg.scrollTop;drawPlanMail();dlg.scrollTop=y};
  form.querySelectorAll("[data-pmopen]").forEach(b=>b.onclick=()=>{keep();const n=Number(b.dataset.pmopen);pm.open=pm.open===n?0:n;re()});
  form.querySelectorAll("[data-pm]").forEach(b=>b.onclick=()=>{keep();const g=b.dataset.pm,v=b.dataset.v;pm[g]=v;
    if(g==="tekst"&&v==="kennis"){const A=T.aankondiging||{};pm.onderwerp=A.onderwerp||"";pm.body=A.mail||"";pm.smsBody=A.sms||""}
    if(g==="tekst"&&v==="vrij"){const X=T[pm.tpl];if(!X)pm.tpl=""}
    if(g==="mode"||(g==="verz"&&v==="direct"))pm.open=g==="mode"?2:3;re()});
  const on=(id,ev,fn)=>{const e=$("#"+id);if(e)e[ev]=fn};
  on("pmDag","onchange",e=>{if(!e.target.value)return;keep();pm.datum=e.target.value;pm.op=iso(addDays(parse(pm.datum),-2));pm.sel=new Set(pmKlanten(pm.datum).filter(k=>mailK(k,"planning").email||pm.sms).map(k=>k.id));re()});
  on("pmNaam","onchange",e=>{pm.naam=e.target.checked;re()});
  on("pmAll","onchange",e=>{pm.sel=new Set(e.target.checked?ks.map(k=>k.id):[]);re()});
  form.querySelectorAll("[data-pmk]").forEach(c=>c.onchange=()=>{c.checked?pm.sel.add(c.dataset.pmk):pm.sel.delete(c.dataset.pmk);re()});
  on("pmMail","onchange",e=>{pm.mail=e.target.checked;re()});
  on("pmSms","onchange",e=>{pm.sms=e.target.checked;re()});
  on("pmTpl","onchange",e=>{pm.tpl=e.target.value;const X=T[pm.tpl];if(X){pm.onderwerp=X.onderwerp||"";pm.body=X.mail||"";pm.smsBody=X.sms||""}else{pm.onderwerp="Bericht van [name.company]";pm.body="Beste [name.customer],\n\n\n\nMet vriendelijke groet,\n[name.company]";pm.smsBody=""}re()});
  const pv=()=>{const p=form.querySelector(".pm-prev");if(p&&vv){p.querySelector("b").textContent=fill(pm.onderwerp,vv);p.querySelector("p").innerHTML=esc(fill(pm.body,vv)).replace(/\n/g,"<br>")}};
  on("pmSubj","oninput",e=>{pm.onderwerp=e.target.value;pv()});on("pmBody","oninput",e=>{pm.body=e.target.value;pv()});on("pmSmsB","oninput",e=>{pm.smsBody=e.target.value});
  on("pmOp","onchange",e=>{pm.op=e.target.value;re()});on("pmOpT","onchange",e=>{pm.opT=e.target.value;re()});
  on("pmGep","onclick",()=>{keep();openGeplande()});
  on("pmGo","onclick",async()=>{keep();if(pm.verz==="gepland")return pmKlaarzetten(sel);pmDirect(sel)});
}
function pmRecipients(list){return list.map(k=>({k:mailK(k,"planning"),vars:(()=>{const v=pmVars(k);if(tavK(k,"planning"))v.klant=tavK(k,"planning");return v})(),ref:"planmail:"+pm.datum+":"+k.id}))}
function pmDirect(sel){
  const kanaal=pm.mail?"email":(sel[0]&&sel[0].telefoon?"whatsapp":"sms");
  openCompose({title:"Planningsmail · "+wd(parse(pm.datum))+" "+fmtD(pm.datum),recipients:pmRecipients(sel),sjabloon:pm.tekst==="kennis"?"aankondiging":(pm.tpl||"vrij"),
    tekst:pm.smsBody||pm.body||"",mail:pm.mail?pm.body:"",onderwerp:pm.onderwerp,kanaal});
}
async function pmKlaarzetten(sel){
  const items=pmGepland().filter(g=>!(g.datum===pm.datum&&sel.some(k=>k.id===g.klantId)));
  sel.forEach(k=>items.push({id:newId("g"),klantId:k.id,datum:pm.datum,op:pm.op,tijd:pm.opT,mode:pm.mode,mail:pm.mail,sms:pm.sms,onderwerp:pm.onderwerp,body:pm.body,smsBody:pm.smsBody,sjabloon:pm.tekst==="kennis"?"aankondiging":(pm.tpl||"vrij")}));
  try{await save("instellingen","planmails",{items});state.planmails={items};dlg.close();toast(plural(sel.length,"bericht","berichten")+" klaargezet voor "+fmtD(pm.op))}catch(e){err(e)}
}
/* geplande berichten die aan de beurt zijn (voor Communicatie / Vandaag) */
function pmDue(){const now=new Date(),ti=iso(today()),nm=now.getHours()*60+now.getMinutes(),refs=sentRefs();
  return pmGepland().filter(g=>(g.op<ti||(g.op===ti&&nm>=(toMin(g.tijd)||0)))&&!refs.has("planmail:"+g.datum+":"+g.klantId)).map(g=>({g,k:state.klanten.find(x=>x.id===g.klantId)})).filter(x=>x.k&&x.k.gepland===x.g.datum)}
function openGeplande(){
  const gp=pmGepland().slice().sort((a,b)=>(a.op+a.tijd).localeCompare(b.op+b.tijd)),refs=sentRefs(),due=pmDue();
  const st=g=>refs.has("planmail:"+g.datum+":"+g.klantId)?["ok","Verstuurd"]:due.some(x=>x.g.id===g.id)?["late","Klaar om te versturen"]:["neutral","Gepland"];
  openDlg(`<div class="dlg-head"><span class="objic big">${I.timer}</span><div style="min-width:0;flex:1"><h3>Geplande berichten</h3><div class="subt">${plural(gp.length,"bericht","berichten")}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  ${due.length?`<div class="infobox">${I.bell}<span style="flex:1">${plural(due.length,"bericht staat","berichten staan")} klaar om te versturen.</span><button type="button" class="small primary" id="gpSend">${I.send}Nu versturen</button></div>`:""}
  <div class="pm-list">${gp.length?gp.map(g=>{const k=state.klanten.find(x=>x.id===g.klantId),[c,l]=st(g);return `<div class="pm-it"><span class="pm-tm">${esc(fmtD(g.op))}<br><small>${esc(g.tijd||"")}</small></span><span class="pm-ad"><b>${esc(k?cleanName(k.naam):"Onbekende klant")}</b><small>Afspraak ${esc(wd(parse(g.datum))+" "+fmtD(g.datum))}${k&&k.gepland!==g.datum?" · afspraak verplaatst":""}</small></span><span class="pill ${c}">${l}</span><button type="button" class="iconbtn" data-gpdel="${esc(g.id)}" aria-label="Verwijderen">${I.trash}</button></div>`}).join(""):`<p class="subt" style="text-align:center;margin:24px 0">Nog geen geplande berichten</p>`}</div>
  <div class="row"><button type="button" id="gpBack">${I.left}Terug</button><span class="sp"></span>${gp.some(g=>st(g)[0]==="ok")?`<button type="button" class="small ghost" id="gpClean">Verstuurde opruimen</button>`:""}<button type="button" data-act="close">Klaar</button></div>`,{wide:true});
  const sv=async items=>{try{await save("instellingen","planmails",{items});state.planmails={items};openGeplande()}catch(e){err(e)}};
  form.querySelectorAll("[data-gpdel]").forEach(b=>b.onclick=()=>sv(pmGepland().filter(g=>g.id!==b.dataset.gpdel)));
  const c=$("#gpClean");if(c)c.onclick=()=>sv(pmGepland().filter(g=>st(g)[0]!=="ok"));
  const bk=$("#gpBack");if(bk)bk.onclick=()=>pm?drawPlanMail():openPlanMail();
  const s=$("#gpSend");if(s)s.onclick=()=>sendGeplande();
}
function sendGeplande(){
  const due=pmDue();if(!due.length)return toast("Er staat niets klaar");const g0=due[0].g;
  const rec=due.map(({g,k})=>{const v=klantVars(k,parse(g.datum));if(g.mode==="tijdvakken")v.tijdvak=pmVak(k);return{k:mailK(k,"planning"),vars:v,ref:"planmail:"+g.datum+":"+k.id,stap:{naam:"Gepland bericht",mail:g.mail?g.body:g.smsBody,sms:g.sms?g.smsBody:g.body,onderwerp:g.onderwerp}}});
  openCompose({title:"Geplande planningsmails",recipients:rec,sjabloon:g0.sjabloon||"aankondiging",tekst:g0.sms?g0.smsBody:g0.body,mail:g0.mail?g0.body:"",onderwerp:g0.onderwerp,kanaal:g0.mail?"email":"whatsapp"});
}

/* ---------- Geavanceerd plannen (zijpaneel Te plannen) ---------- */
const ADV=(()=>{let o={};try{o=JSON.parse(localStorage.getItem("ms.adv")||"{}")||{}}catch(e){}return{open:!!o.open,groepen:!!o.groepen,meer:!!o.meer,reeks:!!o.reeks,fase:!!o.fase,verberg:!!o.verberg,dubbel:!!o.dubbel,sort:o.sort||"datum",datum:""}})();
const advSave=()=>{try{localStorage.setItem("ms.adv",JSON.stringify({...ADV,datum:undefined}))}catch(e){}};
const mSel=new Set();
function offerFilter(list){
  let o=list.slice();
  if(ADV.verberg)o=o.filter(k=>!k.ronde);
  if(ADV.dubbel){const t=iso(today()),bezet=new Set(actief().filter(k=>k.gepland&&k.gepland>=t).map(k=>jobAddr(k).toLowerCase()));o=o.filter(k=>!bezet.has(jobAddr(k).toLowerCase()))}
  const pc=k=>String(jobAddrObj(k).postcode||k.postcode||"").replace(/\s/g,"").toUpperCase()||"~",pl=k=>String(jobAddrObj(k).plaats||k.plaats||"").toLowerCase()||"~";
  if(ADV.sort==="postcode")o.sort((a,b)=>pc(a).localeCompare(pc(b))||jobAddr(a).localeCompare(jobAddr(b),"nl",{numeric:true}));
  else if(ADV.sort==="plaats")o.sort((a,b)=>pl(a).localeCompare(pl(b))||jobAddr(a).localeCompare(jobAddr(b),"nl",{numeric:true}));
  else o.sort((a,b)=>dueOf(a)-dueOf(b));
  [...mSel].forEach(id=>{if(!o.some(k=>k.id===id))mSel.delete(id)});
  return o;
}
function offerUpTo(def){return ADV.datum?parse(ADV.datum):def}
function offerCards(o,dayIso,timed){
  const card=k=>ADV.meer?`<div class="msel-w${mSel.has(k.id)?" chk":""}"><button type="button" class="msel-c" data-act="msel" data-id="${esc(k.id)}" aria-pressed="${mSel.has(k.id)}" aria-label="Selecteer ${esc(cleanName(k.naam))}">${I.check}</button>${offerHtml(k,dayIso,timed)}</div>`:offerHtml(k,dayIso,timed);
  if(!ADV.groepen)return o.map(card).join("");
  const g={};o.forEach(k=>{const n=k.ronde||"Zonder groep";(g[n]=g[n]||[]).push(k)});
  return Object.keys(g).sort((a,b)=>(a==="Zonder groep")-(b==="Zonder groep")||a.localeCompare(b,"nl")).map(n=>`<div class="og-h"><span class="og-dot" style="--h:${hue(n)}"></span><b>${esc(n)}</b><span>${g[n].length} · ${eur0(toon(g[n].reduce((a,k)=>a+(Number(k.prijs)||0),0)))}</span>${ADV.meer?`<button type="button" class="linkbtn" data-act="mselgrp" data-g="${esc(n)}">Selecteer</button>`:""}</div>`+g[n].map(card).join("")).join("");
}
function advHtml(o,d0){
  const cb=(k,l,sub)=>`<label class="pm-cb adv-cb"><input type="checkbox" data-adv="${k}" ${ADV[k]?"checked":""}><span>${l}${sub?`<small>${sub}</small>`:""}</span></label>`;
  const selDur=[...mSel].reduce((a,id)=>{const k=state.klanten.find(x=>x.id===id);return a+(k?duur(k):0)},0);
  return `<div class="adv-top"><button type="button" class="small adv-btn" aria-pressed="${ADV.open}" data-act="advtgl" aria-expanded="${ADV.open}">${I.filter}Geavanceerd plannen</button></div>
  ${ADV.open?`<div class="adv">
    <div class="rp-tools" role="toolbar" aria-label="Planning-acties">
      <button type="button" class="iconbtn" data-act="newjob" data-d="${d0}" title="Nieuwe job" aria-label="Nieuwe job">${I.plus}</button>
      <button type="button" class="iconbtn" data-act="planmail" data-d="${d0}" title="Planningsmail verzenden" aria-label="Planningsmail verzenden">${I.mail}</button>
      <button type="button" class="iconbtn" data-act="geplande" title="Geplande berichten" aria-label="Geplande berichten">${I.timer}${pmGepland().length?`<i class="rp-dot"></i>`:""}</button>
      <button type="button" class="iconbtn" data-act="bulkday" data-d="${d0}" title="Bulk dag" aria-label="Bulk dag">${I.cal2}</button>
      <button type="button" class="iconbtn${state.achter?" on":""}" data-act="achter" title="Alleen achterstallig" aria-label="Alleen achterstallig">${I.alert}</button>
    </div>
    <div class="adv-opts">
      ${cb("groepen","Opdrachtgroepen","Per ronde gegroepeerd")}
      ${cb("reeks","Meervoudig inplannen","Bij inplannen kiezen: vast aantal, tot een datum of doorlopend")}
      ${cb("meer","Meerdere klanten tegelijk","Meerdere kiezen, één tijdslot")}
      ${ADV.meer?cb("fase","Gefaseerd inplannen","Loopt door naar de volgende werkdag als de dag vol is"):""}
      ${cb("verberg","Afspraken in groepen niet tonen","Klanten met een ronde verbergen")}
      ${cb("dubbel","Dubbel ingeplande adressen niet aanbieden","Adres heeft al een afspraak staan")}
    </div></div>`:""}
  <label class="adv-date">Aanbod zien op datum<span class="adv-dr"><input type="date" id="advDatum" value="${esc(ADV.datum)}">${ADV.datum?`<button type="button" class="iconbtn" data-act="advdatum0" aria-label="Datum wissen">${I.x}</button>`:""}</span></label>
  <div class="adv-ov"><b>Overzicht afspraken (${o.length})</b><div class="seg" role="group" aria-label="Sorteren">${[["datum","Datum"],["postcode","Postcode"],["plaats","Plaats"]].map(([x,l])=>`<button type="button" data-act="osort" data-v="${x}" aria-pressed="${ADV.sort===x}">${l}</button>`).join("")}</div></div>
  ${ADV.meer?`<div class="msel-bar${mSel.size?" act":""}"><span>${mSel.size?`<b>${mSel.size} gekozen</b> · ${Math.floor(selDur/60)}u${pad(selDur%60)}${mSel.size?" — tik een tijdslot":""}`:"Vink klanten aan en tik daarna een tijdslot"}</span>${mSel.size?`<span class="msel-acts"><button type="button" class="small primary" data-act="mselplan" data-d="${esc(parse(d0)<today()?iso(today()):d0)}">Plan ${esc(wd(parse(parse(d0)<today()?iso(today()):d0))+" "+parse(parse(d0)<today()?iso(today()):d0).getDate())}</button><button type="button" class="linkbtn" data-act="mselclr">Wissen</button></span>`:`<button type="button" class="linkbtn" data-act="mselall">Alles</button>`}</div>`:""}`;
}
async function planMulti(d,t){
  const ids=[...mSel],ks=offerFilter(teplannen(addDays(today(),3650))).filter(k=>ids.includes(k.id));
  ids.forEach(id=>{if(!ks.some(k=>k.id===id)){const k=state.klanten.find(x=>x.id===id);if(k)ks.push(k)}});
  if(!(await vroegOk(ks,d)))return;
  const we=toMin(S().werkEind)??1020,ws=toMin(S().werkStart)??480;let day=parse(d),m=toMin(t),n=0,dagen=new Set();
  try{for(const k of ks){const du=duur(k);
      if(ADV.fase&&m+du>we&&m>ws){do{day=addDays(day,1)}while(!isWerkdag(day));const f=nextFree(iso(day));m=Math.max(ws,toMin(f)??ws)}
      await save("klanten",k.id,{...strip(k),gepland:iso(day),tijd:fromMin(m),aanbieden:false});dagen.add(iso(day));m+=du;n++}
    mSel.clear();toast(plural(n,"afspraak","afspraken")+" ingepland"+(dagen.size>1?" over "+dagen.size+" dagen":" op "+fmtD(d)))}catch(e){err(e)}
  render();
}

/* ---------- te vroeg inplannen: waarschuwing ---------- */
const VROEG_DAGEN=7;
/* hoeveel dagen voor de vervaldatum een klant bij Te plannen verschijnt (standaard 11) */
const zichtbaarDagen=()=>{const s=S();return s.zichtbaarDagen!=null&&s.zichtbaarDagen!==""?Math.max(0,Number(s.zichtbaarDagen)||0):(Number(s.lookahead)?Number(s.lookahead)*7:11)};
function teVroeg(k,date){if(!k||!date||k.aanbieden)return false;try{const v=volgende(k);return v&&parse(date)<addDays(v,-VROEG_DAGEN)}catch(e){return false}}
/* eigen vraagvenster (geen browser-popup), werkt ook boven een open dialoog */
function vraag(titel,tekst,ja="Toch inplannen",nee="Annuleren"){return new Promise(res=>{
  const o=document.createElement("div");o.className="vraag-ov";o.innerHTML=`<div class="vraag" role="alertdialog" aria-modal="true"><span class="objic kd-warn">${I.alert}</span><div><b>${esc(titel)}</b><p>${tekst}</p></div><div class="vraag-k"><button type="button" data-v="0">${esc(nee)}</button><button type="button" class="primary" data-v="1">${esc(ja)}</button></div></div>`;
  /* eigen venster in de bovenste laag: bleef anders onzichtbaar binnen een scrollend (mobiel) venster, waardoor Opslaan leek te hangen */
  const d=document.createElement("dialog");d.className="vraag-dlg";d.appendChild(o);document.body.appendChild(d);
  const done=v=>{try{d.close()}catch(_){}d.remove();res(v)};o.addEventListener("click",e=>{const b=e.target.closest("[data-v]");if(b)done(b.dataset.v==="1");else if(e.target===o)done(null)});
  d.addEventListener("cancel",e=>{e.preventDefault();done(null)});
  try{d.showModal()}catch(_){d.setAttribute("open","")}setTimeout(()=>{const b=o.querySelector('[data-v="1"]');if(b)b.focus()},30)})}
async function vroegOk(list,date){const vr=list.filter(k=>teVroeg(k,date));if(!vr.length)return true;
  const t=vr.length===1?`${esc(cleanName(vr[0].naam))} is pas op <b>${esc(fmtL(iso(volgende(vr[0]))))}</b> aan de beurt (elke ${esc(vr[0].frequentie||4)} weken). Je plant hem nu op ${esc(fmtL(date))}, meer dan een week te vroeg.`
    :`${vr.length} afspraken worden meer dan een week te vroeg ingepland:<br>${vr.slice(0,6).map(k=>`• ${esc(cleanName(k.naam))}: aan de beurt ${esc(fmtD(iso(volgende(k))))}`).join("<br>")}${vr.length>6?"<br>…":""}`;
  return vraag("Te vroeg ingepland",t)}

/* ---------- meerdere afspraken selecteren en tegelijk verplaatsen ---------- */
if(!state.psel)state.psel=new Set();
function pselBar(){const n=state.psel.size,d0=state.pselDatum||curDay();
  return `<div class="psel-bar"><div class="psel-h"><span class="objic">${I.checksq||I.check}</span><div><b>${n?plural(n,"afspraak","afspraken")+" geselecteerd":"Tik op afspraken om ze te selecteren"}</b><small>Daarna in één keer verplaatsen</small></div><span class="sp"></span><button type="button" class="iconbtn sm" data-act="pselmode" aria-label="Selecteren stoppen" title="Klaar">${I.x}</button></div>
    ${n?`<div class="psel-acts"><label>Verplaatsen naar<input type="date" id="pselD" value="${esc(d0)}"></label><label>Tijd<select id="pselT"><option value="zelfde">Zelfde tijd houden</option><option value="vrij">Eerste vrije tijd</option></select></label>
      <button type="button" class="primary" data-act="pselmove">${I.right}Verplaatsen</button>
      <button type="button" data-act="pselterug">${I.inbox}Terug naar te plannen</button><button type="button" class="ghost" data-act="pselclr">Selectie wissen</button></div>`:""}</div>`}
async function pselMove(){const d=($("#pselD")||{}).value,mode=($("#pselT")||{}).value||"zelfde";if(!d){toast("Kies een datum");return}
  const ks=[...state.psel].map(id=>state.klanten.find(x=>x.id===id)).filter(Boolean);if(!ks.length)return;
  if(!(await vroegOk(ks,d)))return;state.pselDatum=d;
  let n=0;try{for(const k of ks.sort((a,b)=>(toMin(a.tijd)??9999)-(toMin(b.tijd)??9999))){const t=mode==="vrij"||!k.tijd?nextFree(d):k.tijd;await save("klanten",k.id,{...strip(k),gepland:d,tijd:t,aanbieden:false});n++}
    toast(plural(n,"afspraak","afspraken")+" verplaatst naar "+fmtD(d));state.psel.clear();render()}catch(e){err(e)}}
async function pselTerug(){const ks=[...state.psel].map(id=>state.klanten.find(x=>x.id===id)).filter(Boolean);if(!ks.length)return;
  if(!(await vraag("Terug naar te plannen",`${plural(ks.length,"afspraak","afspraken")} uit de agenda halen? Ze staan daarna weer bij Te plannen.`,"Ja, uit de agenda")))return;
  try{for(const k of ks)await save("klanten",k.id,{...strip(k),gepland:"",tijd:"",aanbieden:true});toast(plural(ks.length,"afspraak","afspraken")+" terug naar te plannen");state.psel.clear();render()}catch(e){err(e)}}

/* menu "Meer" in Planning: sluiten bij klik erbuiten of na een keuze */
document.addEventListener("click",e=>{if(!state.pmeer)return;const m=e.target.closest(".pl-meer");
  if(m&&e.target.closest('.pl-menu [data-act]:not([data-act="rowh"]):not([data-act="slotsz"])')){state.pmeer=false;return}
  if(!m){state.pmeer=false;document.querySelectorAll(".pl-meer.open").forEach(x=>x.classList.remove("open"))}},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&state.pmeer){state.pmeer=false;document.querySelectorAll(".pl-meer.open").forEach(x=>x.classList.remove("open"))}});
