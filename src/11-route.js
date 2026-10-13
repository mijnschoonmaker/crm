/* ---------- ROUTE ---------- */
function vRoute(){
  const day=state.routeDay||iso(today()),d=parse(day),stops=routeStops(day),todo=stops.filter(s=>!s.done);
  const doneB=state.beurten.filter(b=>b.datum===day),verdiend=doneB.reduce((a,b)=>a+(Number(b.bedrag)||0),0),totaal=verdiend+todo.reduce((a,s)=>a+(Number(s.k.prijs)||0),0);
  const pct=stops.length?Math.round((stops.length-todo.length)/stops.length*100):0,C=2*Math.PI*54;
  let html=`<div class="pagehead rt"><div><p class="kicker">${I.route}${longD(d)} <span class="pill brand">wk ${weekNr(d)}</span></p><h1 class="xl">Route <span class="rt-who">${esc((state.me&&state.me.name?state.me.name.split(" ")[0]:"")||cleanName(S().naam)||"")}</span></h1><p class="lead" style="margin:0">${plural(todo.length,"stop","stops")} te gaan · ${doneB.length} afgerond</p></div>
    <div class="acts"><div class="datenav"><button type="button" class="ghost" data-act="rday" data-n="-1" aria-label="Vorige dag">${I.left}</button><b>${fmtNum(d)}</b><button type="button" class="ghost" data-act="rday" data-n="1" aria-label="Volgende dag">${I.right}</button></div>${day===iso(today())?"":`<button type="button" data-act="rday" data-n="0">Vandaag</button>`}</div></div>
  <div class="verdiend">${isMw()?`<div style="flex:1;min-width:0"><span class="eyebrow">Jouw dag</span><b class="oc-big">${doneB.length} <span style="color:var(--muted);font-weight:600">/ ${stops.length}</span></b><span class="oc-sub">${todo.length?plural(todo.length,"stop","stops")+" te gaan":"alles afgerond"}</span>${motBlok(doneB.length,stops.length)}</div>`:`<div style="flex:1;min-width:0"><span class="eyebrow">Verdiend</span><b class="oc-big">${eur0(verdiend)}</b><span class="oc-sub">van <b>${eur0(totaal)}</b></span>${motBlok(stops.length-todo.length,stops.length)}</div>`}
    <div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" stroke="var(--surface-3)" stroke-width="9" fill="none"/><circle cx="60" cy="60" r="54" stroke="var(--brand)" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct/100)}" transform="rotate(-90 60 60)"/></svg><span><b>${pct}%</b><small>Klaar</small></span></div></div>`;
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
