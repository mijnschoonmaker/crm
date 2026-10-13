/* ---------- ROUTE ---------- */
function vRoute(){
  const day=state.routeDay||iso(today()),d=parse(day),stops=routeStops(day),todo=stops.filter(s=>!s.done);
  const doneB=state.beurten.filter(b=>b.datum===day),verdiend=doneB.reduce((a,b)=>a+(Number(b.bedrag)||0),0),totaal=verdiend+todo.reduce((a,s)=>a+(Number(s.k.prijs)||0),0);
  const pct=stops.length?Math.round((stops.length-todo.length)/stops.length*100):0,C=2*Math.PI*54;
  const isT=day===iso(today()),mw=isMw(),naam=esc((state.me&&state.me.name?state.me.name.split(" ")[0]:"")||"");
  const done=stops.length-todo.length,werkMin=todo.reduce((a,s)=>a+duur(s.k),0);
  /* reistijd: van waar je nu bent (live locatie, laatste adres of je bedrijfsadres) naar het volgende adres, en tussen de adressen */
  const isT0=day===iso(today()),rt=rtReis(stops,todo,isT0),reisMin=rt.heen+rt.tussen,restMin=werkMin+reisMin;
  const uM=m=>m>=60?Math.floor(m/60)+"u"+(m%60?String(m%60).padStart(2,"0"):""):m+" min";
  const klaarOm=isT&&todo.length?(()=>{const n=new Date(),nu=n.getHours()*60+n.getMinutes(),eerst=toMin(todo[0].k.tijd),start=Math.max(nu+rt.heen,eerst??0),t=start+werkMin+rt.tussen;return String(Math.floor(t/60)%24).padStart(2,"0")+":"+String(t%60).padStart(2,"0")})():"";
  const nx=todo[0]&&todo[0].k,R=46,C2=2*Math.PI*R,klaar=stops.length&&!todo.length;
  const navTxt=isT?"Vandaag":fmtD(d);
  const stat=(l,v,sub)=>`<div class="rd-s"><small>${l}</small><b>${v}</b>${sub?`<span>${sub}</span>`:""}</div>`;
  const nodes=stops.map((s,i)=>{const nu=!s.done&&nx&&s.k.id===nx.id;return `<li class="${s.done?"af":nu?"nu":""}" title="${esc(jobAddrObj(s.k).adres||cleanName(s.k.naam))}"><i>${s.done?`<svg viewBox="0 0 24 24"><path d="M5.5 12.8l4.2 4.2L18.5 7.6"/></svg>`:HUIS}</i><small>${esc(s.k.tijd||"")}</small></li>`}).join("");
  let html=`<div class="rh"><div class="rh-top"><div class="rh-tt"><p class="rh-k">${I.route}<span>${longD(d)}</span><em>wk ${weekNr(d)}</em></p><h1 class="rh-t">Route${naam?`<span>${naam}</span>`:""}</h1></div>
    <div class="rh-acts">${isT?lvKnopHtml():""}<div class="rh-nav" role="group" aria-label="Dag"><button type="button" data-act="rday" data-n="-1" aria-label="Vorige dag">${I.left}</button><button type="button" class="rh-nu${isT?" is-nu":""}" data-act="rday" data-n="0">${navTxt}</button><button type="button" data-act="rday" data-n="1" aria-label="Volgende dag">${I.right}</button></div></div></div>
  ${stops.length?rvKaart({stops,done,todo,nx,klaar,mw,verdiend,totaal,restMin,klaarOm,uM,day,werkMin,reisMin,rt}):""}</div>`;
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

/* ---------- Voortgangskaart: een weg met huisjes en ons busje dat meerijdt ---------- */
const RV_BUS='<svg aria-hidden="true" viewBox="0 0 64 40"><defs><linearGradient id="rvb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26adc2"/><stop offset="1" stop-color="#11778c"/></linearGradient><linearGradient id="rvg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eafcff"/><stop offset="1" stop-color="#86c9d5"/></linearGradient></defs><g stroke="#9fb3ba" stroke-width="1.4" stroke-linecap="round"><path d="M8 7.5H40"/><path d="M11 7.5V4.8M17 7.5V4.8M23 7.5V4.8M29 7.5V4.8M35 7.5V4.8"/><path d="M8 4.8H40"/></g><path d="M5 12a3.5 3.5 0 0 1 3.5-3.5H40c2 0 3.6.8 4.8 2.3l7.4 9.2 5.6 1.8c1.6.5 2.7 2 2.7 3.7V30a2 2 0 0 1-2 2H5z" fill="url(#rvb)"/><path d="M42.5 12.5h1.6c.8 0 1.5.4 2 1l5.2 6.8H42.5z" fill="url(#rvg)" stroke="#0b4552" stroke-width=".8"/><rect x="30" y="12.5" width="9.5" height="7.6" rx="1.4" fill="url(#rvg)" stroke="#0b4552" stroke-width=".8"/><path d="M5 23.5h55" stroke="#0e6476" stroke-width=".8" opacity=".6"/><path d="M7 20.5h22" stroke="#7fe0ee" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><rect x="57" y="23.5" width="3.2" height="2.2" rx="1" fill="#fffbe0"/><g class="rv-wiel"><circle cx="16" cy="32" r="5.6" fill="#1d2a30"/><circle cx="16" cy="32" r="2.4" fill="#c8d3d7"/><path d="M16 29.6v4.8" stroke="#1d2a30" stroke-width="1"/></g><g class="rv-wiel r2"><circle cx="49" cy="32" r="5.6" fill="#1d2a30"/><circle cx="49" cy="32" r="2.4" fill="#c8d3d7"/><path d="M49 29.6v4.8" stroke="#1d2a30" stroke-width="1"/></g></svg>';
const RV_VLAG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M5 4h13l-2.6 4L18 12H5z" fill="currentColor"/></svg>';
function rvKaart(o){const{stops,done,todo,nx,klaar,mw,verdiend,totaal,restMin,klaarOm,uM,day,werkMin,reisMin,rt}=o,n=stops.length,pct=Math.round(done/n*100);
  /* waar staat het busje: bij het volgende adres onderweg (halverwege), aan het eind als alles klaar is */
  const pos=klaar?1:n<2?0:done===0?0:Math.min(1,(done-.5)/(n-1));
  const sk="ms.rv."+day;let v0=pos,e0=verdiend;try{const x=JSON.parse(sessionStorage.getItem(sk)||"null");if(x){v0=x.v;e0=x.e}sessionStorage.setItem(sk,JSON.stringify({v:pos,e:verdiend}))}catch(e){}
  const vooruit=pos>v0+.001,meer=verdiend>e0+.5;
  const fase=klaar?"Dag klaar":done===0?"Klaar voor de start":todo.length===1?"Laatste adres":"Onderweg";
  const sub=klaar?`${plural(n,"woning","woningen")} gedaan${mw?"":" · "+eur0(verdiend)+" verdiend"}`:[plural(todo.length,"adres","adressen")+" te gaan",uM(werkMin)+" werk"+(reisMin?" + "+(rt.schat?"± ":"")+uM(reisMin)+" rijden":""),klaarOm?"klaar rond "+klaarOm:""].filter(Boolean).join(" · ");
  const nodes=stops.map((s,i)=>{const nu=!s.done&&nx&&s.k.id===nx.id;return `<li class="${s.done?"af":nu?"nu":""}" style="--x:${n<2?.5:i/(n-1)}" title="${esc(jobAddrObj(s.k).adres||cleanName(s.k.naam))}"><i>${s.done?'<svg viewBox="0 0 24 24"><path d="M5.5 12.8l4.2 4.2L18.5 7.6"/></svg>':HUIS}</i><small>${esc(s.k.tijd||"")}</small></li>`}).join("");
  const geld=mw?`<div class="rv-geld"><small>Woningen</small><b>${done}<em>/${n}</em></b></div>`
    :`<div class="rv-geld"><small>${klaar?"Verdiend vandaag":"Verdiend"}</small><b data-tel="${verdiend}" data-van="${meer?e0:verdiend}">${eur0(meer?e0:verdiend)}</b>${klaar?"":`<span class="rv-gb"><i style="width:${totaal?Math.round(verdiend/totaal*100):0}%"></i></span><em>van ${eur0(totaal)}</em>`}</div>`;
  if(vooruit||meer)setTimeout(rvAnim,60);
  return `<section class="rv${klaar?" klaar":""}${vooruit?" rijdt":""}">
    <div class="rv-top"><div class="rv-tx"><span class="rv-fase">${klaar?RV_VLAG:'<i></i>'}${fase}<b>${done}/${n}</b></span>
      <h2>${klaar?"Top gewerkt vandaag!":esc(motTekst(done,n))}</h2><p>${esc(sub)}</p></div>${geld}</div>
    <div class="rv-weg${n>10?" veel":""}" style="--p:${pos};--v:${vooruit?v0:pos}">
      <div class="rv-asfalt"><span class="rv-af"></span></div>
      <ol>${nodes}</ol>
      <span class="rv-bus${klaar?" thuis":""}">${RV_BUS}</span>
      <span class="rv-finish">${RV_VLAG}</span>
    </div></section>`}
function rvAnim(){const w=document.querySelector(".rv-weg");if(w){requestAnimationFrame(()=>{w.style.setProperty("--v",getComputedStyle(w).getPropertyValue("--p"))});setTimeout(()=>{const r=document.querySelector(".rv.rijdt");r&&r.classList.remove("rijdt")},1900)}
  const b=document.querySelector(".rv-geld b[data-tel]");if(b){const a=+b.dataset.van,z=+b.dataset.tel;if(z>a){const t0=performance.now(),st=t=>{const k=Math.min(1,(t-t0)/1400),e=1-Math.pow(1-k,3);b.textContent=eur0(Math.round(a+(z-a)*e));if(k<1&&b.isConnected)requestAnimationFrame(st);else b.classList.add("pop")};requestAnimationFrame(st)}}}

/* ---------- reistijd tussen adressen (hemelsbreed × weg-factor, gemiddeld 50 km/u, + 2 min parkeren) ---------- */
const rtBedrijf=()=>{const st=S();return{id:"_bedrijf",adres:st.adres||"",postcode:st.postcode||"",plaats:st.plaats||""}};
function rtKm(a,b){const R=6371,r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dg=r(b[1]-a[1]),h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function rtMin(a,b){if(!a||!b)return null;const km=rtKm(a,b);if(km<.05)return 0;return Math.max(2,Math.round(km*1.35/50*60)+2)}
let rtBezig=false;
function rtReis(stops,todo,isT){if(typeof pkCoord!=="function")return{heen:0,tussen:Math.max(0,todo.length-1)*8,schat:true};
  const bk=rtBedrijf(),lijst=[...stops.map(s=>s.k),...(pkHeeftAdres(bk)?[bk]:[])];
  if(!rtBezig&&pkOpen(lijst).length){rtBezig=true;Promise.resolve(pkGeocode(lijst)).finally(()=>{rtBezig=false;if(state.tab==="route")render()})}
  let schat=false;const m=(a,b)=>{const v=rtMin(a,b);if(v==null){schat=true;return 8}return v};
  let tussen=0;for(let i=0;i<todo.length-1;i++)tussen+=m(pkCoord(todo[i].k),pkCoord(todo[i+1].k));
  let heen=0;if(isT&&todo.length){const af=stops.filter(s=>s.done),van=(typeof LV!=="undefined"&&LV.pos&&[LV.pos.lat,LV.pos.lng])||(af.length&&pkCoord(af[af.length-1].k))||(pkHeeftAdres(bk)&&pkCoord(bk))||null;
    if(van){const v=rtMin(van,pkCoord(todo[0].k));if(v==null)schat=true;else heen=v}}
  return{heen,tussen,schat}}
