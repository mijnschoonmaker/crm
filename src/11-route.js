/* ---------- ROUTE ---------- */
/* tik op een stop in de lijst: het ticket klapt open; tik op het adres: klantkaart */
const RT_OPEN=new Set();
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  const kop=t.closest(".rt-open .tk-kop");if(kop){const w=kop.closest(".rt-open");RT_OPEN.delete(w.dataset.rid);render();return}
  const row=t.closest(".rlijst .rstop");if(!row||row.classList.contains("af")||t.closest("button,a,.rd-grip,input"))return;
  RT_OPEN.add(row.dataset.rid);render();});
function vRoute(){
  const day=state.routeDay||iso(today()),d=parse(day),stops=routeStops(day),todo=stops.filter(s=>!s.done);
  const doneB=state.beurten.filter(b=>b.datum===day),verdiend=doneB.reduce((a,b)=>a+(Number(b.bedrag)||0),0),totaal=verdiend+todo.reduce((a,s)=>a+(Number(s.k.prijs)||0),0);
  const pct=stops.length?Math.round((stops.length-todo.length)/stops.length*100):0,C=2*Math.PI*54;
  const isT=day===iso(today()),mw=isMw(),naam=esc((state.me&&state.me.name?state.me.name.split(" ")[0]:"")||"");
  const done=stops.length-todo.length,werkMin=todo.reduce((a,s)=>a+duur(s.k),0);
  /* reistijd: van waar je nu bent (live locatie, laatste adres of je bedrijfsadres) naar het volgende adres, en tussen de adressen */
  const isT0=day===iso(today()),rt=rtReis(stops,todo,isT0),reisMin=rt.heen+rt.tussen,restMin=werkMin+reisMin;
  const uM=m=>m>=60?Math.floor(m/60)+"u"+(m%60?String(m%60).padStart(2,"0"):""):m+" min";
  /* 's avonds (na 18:00) niet gestart: dan niet doen alsof je nu nog begint; op een andere dag rekenen vanaf de eerste afspraak of je werkstart */
  const nuMin=(()=>{const n=new Date();return n.getHours()*60+n.getMinutes()})(),laat=isT&&!(stops.length-todo.length)&&todo.length&&nuMin>=18*60;
  const klaarOm=todo.length&&!laat?(()=>{const eerst=toMin(todo[0].k.tijd),ws=toMin(S().werkStart)??480,start=isT?Math.max(nuMin+rt.heen,eerst??0):Math.max(ws,eerst??0)+rt.heen,t=start+werkMin+rt.tussen;return String(Math.floor(t/60)%24).padStart(2,"0")+":"+String(t%60).padStart(2,"0")})():"";
  const nx=todo[0]&&todo[0].k,R=46,C2=2*Math.PI*R,klaar=stops.length&&!todo.length;
  const navTxt=isT?"Vandaag":fmtD(d);
  const stat=(l,v,sub)=>`<div class="rd-s"><small>${l}</small><b>${v}</b>${sub?`<span>${sub}</span>`:""}</div>`;
  const nodes=stops.map((s,i)=>{const nu=!s.done&&nx&&s.k.id===nx.id;return `<li class="${s.done?"af":nu?"nu":""}" title="${esc(jobAddrObj(s.k).adres||cleanName(s.k.naam))}"><i>${s.done?`<svg viewBox="0 0 24 24"><path d="M5.5 12.8l4.2 4.2L18.5 7.6"/></svg>`:HUIS}</i><small>${esc(s.k.tijd||"")}</small></li>`}).join("");
  let html=`<div class="rh"><div class="rh-top"><div class="rh-tt"><p class="rh-k">${I.route}<span>${longD(d)}</span><em>wk ${weekNr(d)}</em></p><h1 class="rh-t">Route${naam?`<span>${naam}</span>`:""}</h1></div>
    <div class="rh-acts">${isT?lvKnopHtml():""}<div class="rh-nav" role="group" aria-label="Dag"><button type="button" data-act="rday" data-n="-1" aria-label="Vorige dag">${I.left}</button><button type="button" class="rh-nu${isT?" is-nu":""}" data-act="rday" data-n="0">${navTxt}</button><button type="button" data-act="rday" data-n="1" aria-label="Volgende dag">${I.right}</button></div></div></div>
  ${stops.length?rvKaart({stops,done,todo,nx,klaar,mw,verdiend,totaal,restMin,klaarOm,uM,day,werkMin,reisMin,rt,isT,laat}):""}</div>`;
  if(!stops.length)return html+empty("Geen stops op deze dag","Plan klanten in via Planning, dan staan ze hier op volgorde.",`<button type="button" class="primary" data-act="tab" data-tab="planning">${I.planning}Naar planning</button>`);
  if(todo.length){
    const k=todo[0].k,a=jobAddrObj(k),js=jobState(k,day),sp=STATEPILL[js],tel=String(k.telefoon||"").replace(/[^\d+]/g,"");
    html+=`<div class="ns-head sm"><h2><span class="dotlive"></span>Volgende stop</h2><span class="mono">${stops.length-todo.length+1} / ${stops.length}</span></div>
    <div class="ns-hint">${isMw()?`Veeg de kaart naar rechts: <b>afmelden</b>${I.right}`:`Veeg de kaart: ${I.left}<b>direct factureren</b><span>·</span><b>afmelden</b>${I.right}`}</div>
    ${stopCard(k,stops.length-todo.length,true,parse(k.gepland)<today(),day,stops.length)}`;
  }
  html+=`<div class="ns-head sm" style="margin-top:26px"><h2>Alle stops</h2><span></span></div>
  <div class="toolbar">${routeLinks(stops).map((l,i,a)=>`<a class="btn primary" href="${esc(l)}" target="_blank" rel="noopener">${I.map}${a.length>1?"Route deel "+(i+1):"Hele route in Google Maps"}</a>`).join("")}
    <button type="button" data-act="optim" data-d="${day}">${I.wand}Optimaliseer route</button><button type="button" data-act="bulkmsg">${I.msg}Bericht aan deze klanten</button></div>
  ${S().startadres?"":`<p class="subt">Tip: zet je vertrekadres bij Instellingen, dan begint de route daar.</p>`}
  <div class="list rlijst" style="gap:8px">${stops.map((s,i)=>{const k=s.k,nu=!s.done&&nx&&k.id===nx.id;if(!s.done&&RT_OPEN.has(k.id))return `<div class="rt-open" data-rid="${esc(k.id)}">${stopCard(k,i,nu,parse(k.gepland)<today(),day,stops.length)}</div>`;return `<div class="card rstop${s.done?" dim af":nu?" nu":""}" data-rid="${esc(k.id)}"${s.done?"":' data-rdrag="1"'}><span class="rnum${s.done?" done":nu?" nu":""}">${s.done?I.check:i+1}</span>
    <button type="button" class="nm" data-act="klant" data-id="${esc(k.id)}">${esc(jobAddrObj(k).adres||k.naam)}</button>
    <div class="meta"><span>${k.tijd?`<b class="mono">${esc(k.tijd)}</b>`:""}</span><span>${esc(cleanName(k.naam))}</span><span>${esc(jobAddrObj(k).plaats||"")}</span><span class="amt">${eur(toon(k.prijs))}</span></div>
    <div class="side-col" style="flex-direction:row;align-items:center">${s.done?statusPill("ok","Afgerond"):`<span class="rd-grip" aria-hidden="true"><i></i><i></i><i></i></span><a class="btn small" href="${esc(mapsQ(k))}" target="_blank" rel="noopener" aria-label="Navigeer">${I.nav}</a>`}</div></div>`}).join("")}</div>`;
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
function rvKaart(o){const{stops,done,todo,nx,klaar,mw,verdiend,totaal,restMin,klaarOm,uM,day,werkMin,reisMin,rt,isT,laat}=o,n=stops.length,pct=Math.round(done/n*100);
  /* waar staat het busje: bij het volgende adres onderweg (halverwege), aan het eind als alles klaar is */
  const pos=klaar?1:n<2?0:done===0?0:Math.min(1,(done-.5)/(n-1));
  const sk="ms.rv."+day;let v0=pos,e0=verdiend;try{const x=JSON.parse(sessionStorage.getItem(sk)||"null");if(x){v0=x.v;e0=x.e}sessionStorage.setItem(sk,JSON.stringify({v:pos,e:verdiend}))}catch(e){}
  const vooruit=pos>v0+.001,meer=verdiend>e0+.5;
  const fase=klaar?"Dag klaar":laat?"Niet gestart":isT===false?"Gepland":done===0?"Klaar voor de start":todo.length===1?"Laatste adres":"Onderweg";
  const dagTxt=(()=>{const d=parse(day),t=today(),v=Math.round((d-t)/DAY);return v===1?"Morgen":v===-1?"Gisteren":wd(d)+" "+d.getDate()+" "+["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][d.getMonth()]})();
  const kop=klaar?"Top gewerkt vandaag!":laat?`Vandaag niet gestart · ${plural(todo.length,"adres staat","adressen staan")} nog open`:isT===false?`${dagTxt}: ${plural(todo.length,"adres","adressen")}${klaarOm?", klaar rond "+klaarOm:""}`:motTekst(done,n);
  const sub=klaar?`${plural(n,"woning","woningen")} gedaan${mw?"":" · "+eur0(verdiend)+" verdiend"}`:[plural(todo.length,"adres","adressen")+" te gaan",uM(werkMin)+" werk"+(reisMin?" + "+(rt.schat?"± ":"")+uM(reisMin)+" rijden":""),klaarOm?"klaar rond "+klaarOm:""].filter(Boolean).join(" · ");
  const kort=a=>{a=String(a||"");return a.length>14?a.slice(0,13).trim()+"…":a};
  const nodes=stops.map((s,i)=>{const nu=!s.done&&nx&&s.k.id===nx.id,adr=jobAddrObj(s.k).adres||cleanName(s.k.naam);return `<li class="${s.done?"af":nu?"nu":""}" style="--x:${n<2?.5:i/(n-1)}" title="${esc(adr)}">${nu?`<b class="rv-nu">Volgende</b>`:""}<i>${s.done?'<svg viewBox="0 0 24 24"><path d="M5.5 12.8l4.2 4.2L18.5 7.6"/></svg>':HUIS}</i><small>${esc(s.k.tijd||"")}</small>${n<=8?`<em>${esc(kort(adr))}</em>`:""}</li>`}).join("");
  const geld=mw?`<div class="rv-geld"><small>Woningen</small><b>${done}<em>/${n}</em></b></div>`
    :`<div class="rv-geld"><small>${klaar?"Verdiend vandaag":"Verdiend"}</small><b data-tel="${verdiend}" data-van="${meer?e0:verdiend}">${eur0(meer?e0:verdiend)}</b>${klaar?"":`<span class="rv-gb"><i style="width:${totaal?Math.round(verdiend/totaal*100):0}%"></i></span><em>van ${eur0(totaal)}</em>`}</div>`;
  if(vooruit||meer)setTimeout(rvAnim,60);if(state.rvMap)setTimeout(rvMapTeken,40);
  return `<section class="rv${klaar?" klaar":""}${vooruit?" rijdt":""}">
    <div class="rv-top"><div class="rv-tx"><span class="rv-fase">${klaar?RV_VLAG:'<i></i>'}${fase}<b>${done}/${n}</b></span>
      ${(()=>{const m=String(kop).match(/^(.*?[?!])\s+(.+)$/)||String(kop).match(/^(.*?)\s·\s(.+)$/);return m?`<h2>${esc(m[1])}</h2><p class="rv-sub">${esc(m[2].charAt(0).toUpperCase()+m[2].slice(1))}</p>`:`<h2>${esc(kop)}</h2>`})()}${klaar?`<p>${esc(sub)}</p>`:`<div class="rv-chips"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg><b>${todo.length}</b> ${todo.length===1?"adres":"adressen"}</span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg><b>${uM(werkMin)}</b> werk</span>${reisMin?`<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg><b>${rt.schat?"± ":""}${uM(reisMin)}</b> rijden</span>`:""}${klaarOm?`<span class="rv-klaar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>klaar <b>${klaarOm}</b></span>`:""}</div>`}</div>${geld}</div>
    <div class="rv-weg${n>10?" veel":""}${state.rvMap?" open":""}" style="--p:${pos};--v:${vooruit?v0:pos}" data-act="rvmap" role="button" tabindex="0" aria-expanded="${!!state.rvMap}" title="${state.rvMap?"Kaart verbergen":"Stops op de kaart"}">
      <div class="rv-asfalt"><span class="rv-af"></span></div>
      <ol>${nodes}</ol>
      <span class="rv-bus${klaar?" thuis":""}">${RV_BUS}</span>
      <span class="rv-finish">${RV_VLAG}</span>
    </div>${rvMapHtml()}${state.rvMap?"":`<small class="rv-tip">Tik op de weg voor de kaart</small>`}</section>`}
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
