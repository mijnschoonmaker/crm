/* ---------- ROUTE ---------- */
function vRoute(){
  const day=state.routeDay||iso(today()),d=parse(day),stops=routeStops(day),todo=stops.filter(s=>!s.done);
  const doneB=state.beurten.filter(b=>b.datum===day),verdiend=doneB.reduce((a,b)=>a+(Number(b.bedrag)||0),0),totaal=verdiend+todo.reduce((a,s)=>a+(Number(s.k.prijs)||0),0);
  const pct=stops.length?Math.round((stops.length-todo.length)/stops.length*100):0,C=2*Math.PI*54;
  const isT=day===iso(today()),mw=isMw(),naam=esc((state.me&&state.me.name?state.me.name.split(" ")[0]:"")||"");
  const done=stops.length-todo.length,restMin=todo.reduce((a,s)=>a+duur(s.k),0)+Math.max(0,todo.length-1)*8;
  const uM=m=>m>=60?Math.floor(m/60)+"u"+(m%60?String(m%60).padStart(2,"0"):""):m+" min";
  const klaarOm=isT&&todo.length?(()=>{const n=new Date(),eerst=toMin(todo[0].k.tijd),start=Math.max(n.getHours()*60+n.getMinutes(),eerst??0),t=start+restMin;return String(Math.floor(t/60)%24).padStart(2,"0")+":"+String(t%60).padStart(2,"0")})():"";
  const nx=todo[0]&&todo[0].k,R=46,C2=2*Math.PI*R,klaar=stops.length&&!todo.length;
  const navTxt=isT?"Vandaag":fmtD(d);
  const stat=(l,v,sub)=>`<div class="rd-s"><small>${l}</small><b>${v}</b>${sub?`<span>${sub}</span>`:""}</div>`;
  const nodes=stops.map((s,i)=>{const nu=!s.done&&nx&&s.k.id===nx.id;return `<li class="${s.done?"af":nu?"nu":""}" title="${esc(jobAddrObj(s.k).adres||cleanName(s.k.naam))}"><i>${s.done?`<svg viewBox="0 0 24 24"><path d="M5.5 12.8l4.2 4.2L18.5 7.6"/></svg>`:HUIS}</i><small>${esc(s.k.tijd||"")}</small></li>`}).join("");
  let html=`<div class="rh"><div class="rh-top"><div class="rh-tt"><p class="rh-k">${I.route}<span>${longD(d)}</span><em>wk ${weekNr(d)}</em></p><h1 class="rh-t">Route${naam?`<span>${naam}</span>`:""}</h1></div>
    <div class="rh-nav" role="group" aria-label="Dag"><button type="button" data-act="rday" data-n="-1" aria-label="Vorige dag">${I.left}</button><button type="button" class="rh-nu${isT?" is-nu":""}" data-act="rday" data-n="0">${navTxt}</button><button type="button" data-act="rday" data-n="1" aria-label="Volgende dag">${I.right}</button></div></div>
  ${stops.length?`<section class="rd${klaar?" klaar":""}">
    <div class="rd-main">
      <div class="rd-ring"><svg viewBox="0 0 108 108"><circle cx="54" cy="54" r="${R}" class="rd-bg"/><circle cx="54" cy="54" r="${R}" class="rd-fg" stroke-dasharray="${C2}" stroke-dashoffset="${C2*(1-pct/100)}"/></svg><span>${klaar?`<svg class="rd-ok" viewBox="0 0 24 24"><path d="M5.5 12.8l4.2 4.2L18.5 7.6"/></svg>`:`<b>${done}<small>/${stops.length}</small></b><em>klaar</em>`}</span></div>
      <div class="rd-tx"><h2>${klaar?"Dag klaar, top gewerkt!":esc(motTekst(done,stops.length))}</h2>
        <div class="rd-stats">${mw?"":stat("Verdiend",eur0(verdiend),klaar?"":"van "+eur0(totaal))}${klaar?stat("Woningen",String(stops.length),"vandaag gedaan"):stat("Nog te gaan",plural(todo.length,"stop","stops"),"± "+uM(restMin))}${klaarOm?stat("Klaar rond",klaarOm,"inclusief rijden"):""}</div></div>
    </div>
    <ol class="rd-track${stops.length>10?" veel":""}" style="--p:${stops.length>1?Math.min(1,done/(stops.length-1)):pct/100}">${nodes}</ol>
  </section>`:""}</div>`;
  if(!stops.length)return html+empty("Geen stops op deze dag","Plan klanten in via Planning, dan staan ze hier op volgorde.",`<button type="button" class="primary" data-act="tab" data-tab="planning">${I.planning}Naar planning</button>`);
  if(todo.length){
    const k=todo[0].k,a=jobAddrObj(k),js=jobState(k,day),sp=STATEPILL[js],tel=String(k.telefoon||"").replace(/[^\d+]/g,"");
    html+=`<div class="ns-head sm"><h2><span class="dotlive"></span>Volgende stop</h2><span class="mono">${stops.length-todo.length+1} / ${stops.length}</span></div>
    <div class="ns-hint">${isMw()?`Veeg de kaart naar rechts: <b>afmelden</b>${I.right}`:`Veeg de kaart: ${I.left}<b>direct factureren</b><span>·</span><b>afmelden</b>${I.right}`}</div>
    <div class="swipe bs-swipe" data-id="${esc(k.id)}"><div class="sbg sbg-r"><span>${I.check} Afmelden<small>conceptfactuur</small></span></div><div class="sbg sbg-l"><span>Direct factureren<small>open factuur</small></span></div>
    <div class="swipe-card bigstop"><div class="bs-top"><span class="av" style="--h:${hue(k.ronde||k.naam)};grid-row:auto">${esc(initials(k.naam))}</span><div style="min-width:0;flex:1">${statusPill(sp[0],sp[1])}<button type="button" class="bs-nm" data-act="klant" data-id="${esc(k.id)}">${esc(cleanName(k.naam))}</button><div class="sc-sub" style="font-size:16px"><span class="dienst">${I.pin}${esc(jobAddr(k))}</span></div></div></div>
      <div class="chips" style="margin:0">${k.tijd?`<span class="chip">${I.clock} ${esc(k.tijd)}</span>`:""}${(()=>{const bm=berekendeMin(k,day),n=(k.tijden||[]).length;return (bm?`<span class="chip chip-calc" title="Zoals berekend in de offerte / rekentool">${I.calculator} berekend ${bm} min</span>`:"")+`<span class="chip" title="${n?"Gemiddelde van de laatste "+Math.min(5,n)+" metingen":"Nog niet gemeten"}">${I.timer} ${n?"gem. "+gemTijd(k):bm?"nog niet gemeten":duur(k)+""}${n||!bm?" min":""}</span>`})()}<span class="chip">€ ${esc(String(k.prijs||0).replace(".",","))}</span><span class="chip">${I.wrench} ${esc(k.dienst||"Glasbewassing")}</span>${k.binnen?'<span class="chip">+ binnen</span>':""}</div>
      ${oBeurtBlok(k)}${hospRoute(k)}${ookDezeBeurt(k,typeof day!=="undefined"?day:undefined)}${k.notities?`<div class="notebox"><span class="eyebrow">Notitie</span>${esc(k.notities)}</div>`:""}${objInfo(k)}${jobExtra(k)}
      <a class="btn navbtn" href="${esc(mapsQ(k))}" target="_blank" rel="noopener">${I.nav}Navigeer naar ${esc(cleanName(k.naam))}<span style="flex:1"></span>${I.ext}</a>
      ${(()=>{const n=(k.tijden||[]).length,ex=n?gemTijd(k):duur(k),on=js==="bezig",ms=on?Date.now()-new Date(k.bezig):0,f=ms/60000/ex;
        return `<div class="bs-timer${on?" loopt":""}"><div class="bt-top">${on?'<span class="dotlive"></span><b>Tijd loopt</b>':`<span class="bt-ic">${I.timer}</span><b>Nog niet gestart</b>`}<span class="sp"></span><span class="bt-clock"${on?` data-timer="${esc(k.bezig)}"`:""}>${on?fmtTimer(ms):"0:00"}</span><span class="bt-exp">/ ${ex} min</span></div>
        <div class="bt-bar"><i${on?` data-tbar="${esc(k.bezig)}" data-exp="${ex}"`:""} class="${f>1?"over":""}" style="width:${Math.min(100,f*100)}%"></i></div>
        <small>${on?(n?"Gemiddeld "+ex+" min bij deze klant (laatste "+Math.min(5,n)+" keer)":"Verwacht "+ex+" min · eerste meting")+" · klaar? Tik op Stop & afmelden":"Tik op <b>Start</b> bij aankomst"+(n?" · gemiddeld "+ex+" min uit "+Math.min(5,n)+" metingen":" · nog geen metingen, verwacht "+ex+" min")}</small></div>`})()}
      <div class="bs-btns">${tel?`<a class="btn" href="tel:${esc(tel)}">${I.phone}Bellen</a>`:`<button type="button" disabled>${I.phone}Geen nummer</button>`}<button type="button" data-act="start" data-id="${esc(k.id)}">${js==="bezig"?I.check+"Stop & afmelden":I.play+"Start"}</button><button type="button" data-act="skip" data-id="${esc(k.id)}">${I.right}Overslaan</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">${tel?`<span class="contact">${esc(k.telefoon)}</span>`:"<span></span>"}<span></span></div>
    </div></div>`;
  }
  html+=`<div class="ns-head sm" style="margin-top:26px"><h2>Alle stops</h2><span></span></div>
  <div class="toolbar">${routeLinks(stops).map((l,i,a)=>`<a class="btn primary" href="${esc(l)}" target="_blank" rel="noopener">${I.map}${a.length>1?"Route deel "+(i+1):"Hele route in Google Maps"}</a>`).join("")}
    <button type="button" data-act="optim" data-d="${day}">${I.wand}Optimaliseer route</button><button type="button" data-act="bulkmsg">${I.msg}Bericht aan deze klanten</button></div>
  ${S().startadres?"":`<p class="subt">Tip: zet je vertrekadres bij Instellingen, dan begint de route daar.</p>`}
  <div class="list" style="gap:8px">${stops.map((s,i)=>{const k=s.k;return `<div class="card rstop${s.done?" dim":""}"><span class="rnum${s.done?" done":""}">${s.done?"✓":i+1}</span>
    <button type="button" class="nm" data-act="klant" data-id="${esc(k.id)}">${esc(jobAddrObj(k).adres||k.naam)}</button>
    <div class="meta"><span>${k.tijd?`<b class="mono">${esc(k.tijd)}</b>`:""}</span><span>${esc(cleanName(k.naam))}</span><span>${esc(jobAddrObj(k).plaats||"")}</span><span class="amt">${eur(toon(k.prijs))}</span></div>
    <div class="side-col" style="flex-direction:row;align-items:center">${s.done?statusPill("ok","Afgerond"):`<button type="button" class="small ghost" data-act="rmove" data-id="${esc(k.id)}" data-n="-1" aria-label="Omhoog" ${i===0?"disabled":""}>${I.up}</button><button type="button" class="small ghost" data-act="rmove" data-id="${esc(k.id)}" data-n="1" aria-label="Omlaag">${I.down}</button><a class="btn small" href="${esc(mapsQ(k))}" target="_blank" rel="noopener" aria-label="Navigeer">${I.nav}</a>`}</div></div>`}).join("")}</div>`;
  return html;
}
async function routeMove(id,n){
  const day=state.routeDay||iso(today()),ids=routeStops(day).map(s=>s.k.id),i=ids.indexOf(id),j=i+n;
  if(i<0||j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];
  try{await save("routes",day,{...strip(state.routes[day]||{}),order:ids})}catch(e){err(e)}
}
