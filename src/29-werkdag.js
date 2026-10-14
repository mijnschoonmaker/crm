/* ---------- werkdag: vertrek bij de loods, pauzes en terugkomst. Samen met start/afmelden per klant geeft dat
   facturabele uren, reistijd en pauze, en zo wat je echt per uur verdient ---------- */
const wdNu=()=>new Date().toISOString();
const wdMin=(a,b)=>a&&b?Math.max(0,(new Date(b)-new Date(a))/6e4):0;
function wdGet(d){return (state.routes[d]||{}).werk||null}
async function wdZet(d,patch){const r=state.routes[d]||{},w={...(r.werk||{}),...patch,door:(state.me&&state.me.email)||""};
  state.routes[d]={...r,werk:w};schedule();try{await save("routes",d,{...strip(r),werk:w})}catch(e){err(e)}}
/* cijfers van een dag: werktijd (loods tot loods), pauze, facturabel (gemeten tijd bij klanten), reistijd = de rest */
function wdCijfers(d){const w=wdGet(d)||{},nu=wdNu(),eind=w.stop||(w.start&&d===iso(today())?nu:"");
  const pauze=(w.pauzes||[]).reduce((a,p)=>a+wdMin(p.van,p.tot||(w.stop?w.stop:nu)),0);
  const bs=state.beurten.filter(b=>b.datum===d),fact=bs.reduce((a,b)=>a+(Number(b.duur)||0),0),gemeten=bs.filter(b=>b.gemeten).length;
  const totaal=wdMin(w.start,eind),netto=Math.max(0,totaal-pauze),reis=Math.max(0,netto-fact);
  const omzet=bs.reduce((a,b)=>a+exAmt(b.bedrag),0);
  return {w,totaal,pauze,netto,fact,reis,omzet,n:bs.length,gemeten,perUur:netto>0?omzet/(netto/60):0,perFact:fact>0?omzet/(fact/60):0}}
const wdU=m=>{m=Math.round(m||0);const h=Math.floor(m/60),mm=m%60;return h?`${h}u${String(mm).padStart(2,"0")}`:`${mm} min`};
const wdT=ts=>ts?new Date(ts).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):"";
function werkdagKaart(d,isT,total){const c=wdCijfers(d),w=c.w,inP=(w.pauzes||[]).some(p=>!p.tot);
  if(!isT&&!w.start)return"";
  const balk=c.netto>0?`<div class="wd-bar" role="img" aria-label="Verdeling van je werktijd"><i class="f" style="flex:${c.fact}"></i><i class="r" style="flex:${c.reis}"></i>${c.pauze?`<i class="p" style="flex:${c.pauze}"></i>`:""}</div>
    <div class="wd-leg"><span><i class="f"></i>Bij klanten <b>${wdU(c.fact)}</b></span><span><i class="r"></i>Reistijd <b>${wdU(c.reis)}</b></span><span><i class="p"></i>Pauze <b>${wdU(c.pauze)}</b></span></div>`:"";
  if(!w.start)return `<section class="wd wd-0"><span class="wd-ic">${I.truck||I.route}</span><div class="wd-m"><b>Klaar om te vertrekken?</b><small>Tik bij vertrek bij de loods op start. Dan zie je vanavond je reistijd, pauzes en wat je echt per uur verdient.</small></div><button type="button" class="primary" data-act="wdstart">${I.play||I.clock}Start werkdag</button></section>`;
  if(w.stop)return `<section class="wd wd-klaar"><div class="wd-h"><span class="wd-ic">${I.check}</span><div class="wd-m"><b>Werkdag afgerond · ${wdU(c.totaal)}</b><small>${wdT(w.start)} vertrek loods · ${wdT(w.stop)} terug bij de loods</small></div>${isT?`<button type="button" class="small ghost" data-act="wdheropen">Heropenen</button>`:""}</div>
    ${balk}<div class="wd-kpi"><div><small>Facturabel</small><b>${wdU(c.fact)}</b></div><div><small>Omzet</small><b>${eur0(c.omzet)}</b></div><div><small>Per gewerkt uur</small><b>${c.perUur?eur0(c.perUur):"–"}</b></div><div><small>Per facturabel uur</small><b>${c.perFact?eur0(c.perFact):"–"}</b></div></div>
    ${c.n&&c.gemeten<c.n?`<p class="wd-tip">${plural(c.n-c.gemeten,"stop is","stops zijn")} afgemeld zonder op start te drukken; daar is de geplande duur gebruikt.</p>`:""}</section>`;
  const pz=(w.pauzes||[]).find(p=>!p.tot);
  return `<section class="wd wd-aan${inP?" wd-pz":""}"><div class="wd-h"><span class="wd-ic">${inP?(I.coffee||I.clock):(I.truck||I.route)}</span><div class="wd-m"><b>${inP?"Pauze":"Onderweg"} <span class="wd-tm" data-wdsince="${esc(inP?pz.van:w.start)}">${wdU(wdMin(inP?pz.van:w.start,wdNu()))}</span></b><small>Vertrokken om ${wdT(w.start)}${c.pauze?` · ${wdU(c.pauze)} pauze`:""} · ${plural(c.n,"stop","stops")} klaar${total?` van ${total}`:""}</small></div></div>
    ${balk}<div class="wd-k">${inP?`<button type="button" class="primary" data-act="wdpauze">${I.play||I.check}Pauze voorbij</button>`:`<button type="button" data-act="wdpauze">${I.coffee||I.clock}Pauze</button><button type="button" class="primary" data-act="wdstop">${I.home||I.check}Terug bij de loods</button>`}</div></section>`}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-act^='wd']");if(!b)return;const a=b.dataset.act;if(!["wdstart","wdstop","wdpauze","wdheropen"].includes(a))return;e.preventDefault();e.stopPropagation();
  const d=iso(today()),w=wdGet(d)||{};
  if(a==="wdstart"){await wdZet(d,{start:wdNu(),stop:"",pauzes:[]});toast("Werkdag gestart · goede rit!");try{navigator.vibrate&&navigator.vibrate(20)}catch(_){}}
  else if(a==="wdpauze"){const pz=[...(w.pauzes||[])],open=pz.findIndex(p=>!p.tot);if(open>=0){pz[open]={...pz[open],tot:wdNu()};toast("Pauze voorbij · "+wdU(wdMin(pz[open].van,pz[open].tot)))}else{pz.push({van:wdNu()});toast("Pauze gestart")}await wdZet(d,{pauzes:pz})}
  else if(a==="wdstop"){const bz=state.klanten.filter(k=>typeof isBezig==="function"&&isBezig(k));
    if(bz.length&&!(await vraag("Nog bezig bij een klant",`De tijd loopt nog bij <b>${esc(cleanName(bz[0].naam))}</b>. Toch de werkdag stoppen? Meld die stop daarna nog af.`,"Toch stoppen","Annuleren")))return;
    const pz=(w.pauzes||[]).map(p=>p.tot?p:{...p,tot:wdNu()});await wdZet(d,{stop:wdNu(),pauzes:pz});const c=wdCijfers(d);toast(`Werkdag klaar · ${wdU(c.netto)} gewerkt, ${wdU(c.reis)} reistijd`)}
  else if(a==="wdheropen"){await wdZet(d,{stop:""});toast("Werkdag loopt weer")}
},true);
/* lopende tijd elke halve minuut bijwerken */
setInterval(()=>{document.querySelectorAll("[data-wdsince]").forEach(el=>el.textContent=wdU(wdMin(el.dataset.wdsince,wdNu())))},30000);
/* statistieken: tijdsverdeling over een periode (alleen dagen met start en stop bij de loods) */
function wdPeriode(rg){const dagen=Object.keys(state.routes||{}).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&inRange(d,rg)&&(state.routes[d].werk||{}).start&&(state.routes[d].werk||{}).stop);
  const t={dagen:dagen.length,totaal:0,pauze:0,netto:0,fact:0,reis:0,omzet:0};dagen.forEach(d=>{const c=wdCijfers(d);["totaal","pauze","netto","fact","reis","omzet"].forEach(x=>t[x]+=c[x])});
  t.perUur=t.netto>0?t.omzet/(t.netto/60):0;t.perFact=t.fact>0?t.omzet/(t.fact/60):0;return t}
function wdStatKaart(rg,lbl){const t=wdPeriode(rg);
  if(!t.dagen)return `<section class="st-card wd-st"><div class="st-ch"><div><h3>Waar gaat je tijd naartoe?</h3><p>Facturabel, reistijd en pauze</p></div></div><p class="st-leeg">Druk op Vandaag op <b>Start werkdag</b> bij vertrek en <b>Terug bij de loods</b> aan het eind. Dan zie je hier je echte uurloon.</p></section>`;
  const p=x=>t.netto+t.pauze>0?Math.round(x/(t.netto+t.pauze)*100):0;
  return `<section class="st-card wd-st"><div class="st-ch"><div><h3>Waar gaat je tijd naartoe?</h3><p>${plural(t.dagen,"werkdag","werkdagen")} gemeten · ${esc(lbl)}</p></div></div>
    <div class="wd-bar big"><i class="f" style="flex:${t.fact}"></i><i class="r" style="flex:${t.reis}"></i><i class="p" style="flex:${t.pauze||0.0001}"></i></div>
    <div class="wd-leg"><span><i class="f"></i>Facturabel <b>${wdU(t.fact)}</b> · ${p(t.fact)}%</span><span><i class="r"></i>Reistijd <b>${wdU(t.reis)}</b> · ${p(t.reis)}%</span><span><i class="p"></i>Pauze <b>${wdU(t.pauze)}</b> · ${p(t.pauze)}%</span></div>
    <div class="wd-kpi"><div><small>Omzet</small><b>${eur0(t.omzet)}</b></div><div><small>Echt per gewerkt uur</small><b>${t.perUur?eur0(t.perUur):"–"}</b></div><div><small>Per facturabel uur</small><b>${t.perFact?eur0(t.perFact):"–"}</b></div><div><small>Reistijd per dag</small><b>${wdU(t.reis/t.dagen)}</b></div></div></section>`}
