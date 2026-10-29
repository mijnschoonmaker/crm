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
  /* alleen stops die tijdens de werkdag zijn afgemeld (tussen vertrek en terugkomst bij de loods), anders kloppen reistijd en uurloon niet */
  const binnen=b=>{if(!w.start||!b.op)return true;const t=new Date(b.op).getTime();return t>=new Date(w.start).getTime()-6e4&&(!eind||w.gecorrigeerd||t<=new Date(eind).getTime()+6e4)};/* achteraf gecorrigeerd: afmeldingen na de (eerdere) terugkomst tellen gewoon mee */
  /* werken er meerdere mensen op deze dag, dan telt alleen wat degene die de werkdag startte zelf heeft afgemeld */
  const wNm=x=>String(x||"").trim().split(/[\s@._-]/)[0].toLowerCase(),alle0=state.beurten.filter(b=>b.datum===d&&!b.geannuleerd),mijn=w.door?alle0.filter(b=>wNm(b.door)===wNm(w.door)):[];
  const alle=new Set(alle0.map(b=>wNm(b.door))).size>1&&mijn.length?mijn:alle0,bs=alle.filter(binnen),buiten=alle.length-bs.length;
  const geschat=bs.filter(beurtTeKort).length;
  const fact=bs.reduce((a,b)=>a+beurtMin(b),0),gemeten=bs.filter(b=>b.gemeten||b.startOp).length;
  const totaal=wdMin(w.start,eind),netto=Math.max(0,totaal-pauze),reis=Math.max(0,netto-fact);
  const omzet=bs.reduce((a,b)=>a+beurtOmzet(b),0);
  return {w,totaal,pauze,netto,fact,reis,omzet,n:bs.length,buiten,gemeten,geschat,perUur:netto>0?omzet/(netto/60):0,perFact:fact>0?omzet/(fact/60):0}}
const wdU=m=>{m=Math.round(m||0);const h=Math.floor(m/60),mm=m%60;return h?`${h}u${String(mm).padStart(2,"0")}`:`${mm} min`};
const wdT=ts=>ts?new Date(ts).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):"";
function werkdagKaart(d,isT,total){const c=wdCijfers(d),w=c.w,inP=(w.pauzes||[]).some(p=>!p.tot);
  if(!isT&&!w.start)return"";
  const balk=c.netto>0?`<div class="wd-bar" role="img" aria-label="Verdeling van je werktijd"><i class="f" style="flex:${c.fact}"></i><i class="r" style="flex:${c.reis}"></i>${c.pauze?`<i class="p" style="flex:${c.pauze}"></i>`:""}</div>
    <div class="wd-leg"><span><i class="f"></i>Bij klanten <b>${wdU(c.fact)}</b></span><span><i class="r"></i>Reistijd <b>${wdU(c.reis)}</b></span><span><i class="p"></i>Pauze <b>${wdU(c.pauze)}</b></span></div>`:"";
  if(!w.start)return `<section class="wd wd-0"><span class="wd-ic">${I.truck||I.route}</span><div class="wd-m"><b>Klaar om te vertrekken?</b><small>Tik bij vertrek bij de loods op start. Dan zie je vanavond je reistijd, pauzes en wat je echt per uur verdient.</small></div><button type="button" class="primary" data-act="wdstart">${I.play||I.clock}Start werkdag</button></section>`;
  if(w.stop){const pct=v=>c.netto>0?Math.round(v/c.netto*100):0,tips=[c.n&&c.gemeten<c.n?`${plural(c.n-c.gemeten,"stop is","stops zijn")} afgemeld zonder op Start te drukken; daar telt de geplande duur.`:"",c.buiten?`${plural(c.buiten,"stop is","stops zijn")} buiten deze werkdag afgemeld en ${c.buiten===1?"telt":"tellen"} hier niet mee.`:"",c.fact>c.netto+1?"De tijd bij klanten is langer dan je werkdag. Controleer of je op tijd op Start werkdag drukte.":""].filter(Boolean);
    return `<section class="wd wd-klaar"><div class="wd-h"><span class="wd-ic">${I.check}</span><div class="wd-m"><small class="wd-eb">Werkdag afgerond</small><b class="wd-dur">${wdU(c.totaal)}</b></div>${!isMw()?`<button type="button" class="iconbtn sm wd-pen" data-act="wdbewerk" data-d="${esc(d)}" title="Tijden aanpassen" aria-label="Tijden aanpassen">${I.pencil}</button>`:""}${isT?`<button type="button" class="small ghost wd-her" data-act="wdheropen" title="Werkdag heropenen">${I.refresh||""}<span>Heropenen</span></button>`:""}</div>
    <div class="wd-tl"><span><small>Vertrek loods</small><b>${wdT(w.start)}</b></span><i></i><span><small>Terug bij de loods</small><b>${wdT(w.stop)}</b></span></div>
    ${c.netto>0?`<div class="wd-bar" role="img" aria-label="Verdeling van je werktijd">${c.fact?`<i class="f" style="flex:${c.fact}"></i>`:""}${c.reis?`<i class="r" style="flex:${c.reis}"></i>`:""}${c.pauze?`<i class="p" style="flex:${c.pauze}"></i>`:""}</div>
    <div class="wd-3"><div><i class="f"></i><small>Bij klanten</small><b>${wdU(c.fact)}</b><em>${pct(c.fact)}%</em></div><div><i class="r"></i><small>Reistijd</small><b>${wdU(c.reis)}</b><em>${pct(c.reis)}%</em></div><div><i class="p"></i><small>Pauze</small><b>${wdU(c.pauze)}</b><em>${pct(c.pauze)}%</em></div></div>`:""}
    <div class="wd-kpi"><div class="hoofd"><small>Omzet ex btw</small><b>${eur(c.omzet)}</b><em>${plural(c.n,"stop","stops")}</em></div><div><small>Per gewerkt uur</small><b>${c.perUur?eur(c.perUur):"–"}</b></div><div><small>Per facturabel uur</small><b>${c.perFact?eur(c.perFact):"–"}</b></div></div>${c.geschat?`<p class="subt wd-noot" style="margin:8px 2px 0;font-size:12px">${c.geschat===1?"1 stop is":c.geschat+" stops zijn"} veel korter gemeten dan gepland (bijv. Start en direct Afmelden). Daarvoor is de geplande duur geteld.</p>`:""}
    ${tips.length?`<div class="wd-tips">${I.info||I.alert}<div>${tips.map(t=>`<p>${t}</p>`).join("")}</div></div>`:""}</section>`}
  const pz=(w.pauzes||[]).find(p=>!p.tot);
  return `<section class="wd wd-aan${inP?" wd-pz":""}"><div class="wd-h"><span class="wd-ic">${inP?(I.coffee||I.clock):(I.truck||I.route)}</span><div class="wd-m"><b>${inP?"Pauze":"Onderweg"} <span class="wd-tm" data-wdsince="${esc(inP?pz.van:w.start)}">${wdU(wdMin(inP?pz.van:w.start,wdNu()))}</span></b><small>Vertrokken om ${wdT(w.start)}${c.pauze?` · ${wdU(c.pauze)} pauze`:""} · ${plural(c.n,"stop","stops")} klaar${total?` van ${total}`:""}</small></div></div>
    ${LIVE&&!w.liveUit?`<div class="wd-live"${typeof LV!=="undefined"&&state.liveDelen&&LV.watch!=null?" hidden":""}><span>${I.alert||I.info||""}</span><div><b>Live delen staat uit</b><small data-lvfout>${esc((typeof LV!=="undefined"&&LV.fout)||"Klanten zien je nu niet onderweg.")}</small></div><button type="button" class="small primary" data-act="livedelen">Aanzetten</button></div>`:""}
    ${balk}<div class="wd-k">${inP?`<button type="button" class="primary" data-act="wdpauze">${I.play||I.check}Pauze voorbij</button>`:`<button type="button" data-act="wdpauze">${I.coffee||I.clock}Pauze</button><button type="button" class="primary" data-act="wdstop">${I.home||I.check}Terug bij de loods</button>`}</div></section>`}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-act^='wd']");if(!b)return;const a=b.dataset.act;if(!["wdstart","wdstop","wdpauze","wdheropen","wdbewerk"].includes(a))return;e.preventDefault();e.stopPropagation();
  if(a==="wdbewerk"){if(!isMw())wdBewerk(b.dataset.d||iso(today()));return}
  const d=iso(today()),w=wdGet(d)||{};
  /* live delen meteen bij de tik aanzetten (vóór het opslaan): dan mag de telefoon om je locatie vragen */
  if(a==="wdstart"){wdLive(true);await wdZet(d,{start:wdNu(),stop:"",pauzes:[],liveUit:false});toast("Werkdag gestart · live delen staat aan");try{navigator.vibrate&&navigator.vibrate(20)}catch(_){}}
  else if(a==="wdpauze"){const pz=[...(w.pauzes||[])],open=pz.findIndex(p=>!p.tot);if(open>=0){pz[open]={...pz[open],tot:wdNu()};toast("Pauze voorbij · "+wdU(wdMin(pz[open].van,pz[open].tot)))}else{pz.push({van:wdNu()});toast("Pauze gestart")}await wdZet(d,{pauzes:pz})}
  else if(a==="wdstop"){const bz=state.klanten.filter(k=>typeof isBezig==="function"&&isBezig(k));
    if(bz.length&&!(await vraag("Nog bezig bij een klant",`De tijd loopt nog bij <b>${esc(cleanName(bz[0].naam))}</b>. Toch de werkdag stoppen? Meld die stop daarna nog af.`,"Toch stoppen","Annuleren")))return;
    const pz=(w.pauzes||[]).map(p=>p.tot?p:{...p,tot:wdNu()});await wdZet(d,{stop:wdNu(),pauzes:pz});wdLive(false);const c=wdCijfers(d);toast(`Werkdag klaar · ${wdU(c.netto)} gewerkt, ${wdU(c.reis)} reistijd`)}
  else if(a==="wdheropen"){await wdZet(d,{stop:""});wdLive(true,true);toast("Werkdag loopt weer")}
},true);
/* lopende tijd elke halve minuut bijwerken */
setInterval(()=>{document.querySelectorAll("[data-wdsince]").forEach(el=>el.textContent=wdU(wdMin(el.dataset.wdsince,wdNu())))},30000);
/* statistieken: tijdsverdeling over een periode (alleen dagen met start en stop bij de loods) */
function wdPeriode(rg){const dagen=Object.keys(state.routes||{}).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&inRange(d,rg)&&(state.routes[d].werk||{}).start&&(state.routes[d].werk||{}).stop);
  const t={dagen:dagen.length,totaal:0,pauze:0,netto:0,fact:0,reis:0,omzet:0};dagen.forEach(d=>{const c=wdCijfers(d);["totaal","pauze","netto","fact","reis","omzet"].forEach(x=>t[x]+=c[x])});
  t.perUur=t.netto>0?t.omzet/(t.netto/60):0;t.perFact=t.fact>0?t.omzet/(t.fact/60):0;return t}
function wdStatKaart(rg,lbl){const t=wdPeriode(rg);
  if(!t.dagen||(t.netto+t.pauze)<5)return `<section class="st-card wd-st"><div class="st-ch"><div><h3>Waar gaat je tijd naartoe?</h3><p>Facturabel, reistijd en pauze</p></div></div><p class="st-leeg">Druk op Vandaag op <b>Start werkdag</b> bij vertrek en <b>Terug bij de loods</b> aan het eind. Dan zie je hier je echte uurloon.</p></section>`;
  const p=x=>t.netto+t.pauze>0?Math.round(x/(t.netto+t.pauze)*100):0;
  return `<section class="st-card wd-st"><div class="st-ch"><div><h3>Waar gaat je tijd naartoe?</h3><p>${plural(t.dagen,"werkdag","werkdagen")} gemeten · ${esc(lbl)}</p></div></div>
    <div class="wd-bar big"><i class="f" style="flex:${t.fact}"></i><i class="r" style="flex:${t.reis}"></i><i class="p" style="flex:${t.pauze||0.0001}"></i></div>
    <div class="wd-leg"><span><i class="f"></i>Facturabel <b>${wdU(t.fact)}</b> · ${p(t.fact)}%</span><span><i class="r"></i>Reistijd <b>${wdU(t.reis)}</b> · ${p(t.reis)}%</span><span><i class="p"></i>Pauze <b>${wdU(t.pauze)}</b> · ${p(t.pauze)}%</span></div>
    <div class="wd-kpi"><div><small>Omzet ex btw</small><b>${eur(t.omzet)}</b></div><div><small>Echt per gewerkt uur</small><b>${t.perUur?eur(t.perUur):"–"}</b></div><div><small>Per facturabel uur</small><b>${t.perFact?eur(t.perFact):"–"}</b></div><div><small>Reistijd per dag</small><b>${wdU(t.reis/t.dagen)}</b></div></div></section>`}

/* live locatie volgt de werkdag: aan bij vertrek uit de loods, uit bij terugkomst */
/* automatisch live delen zonder locatievraag: alleen op een telefoon/tablet en alleen als locatie al is toegestaan.
   Is dat nog niet zo, dan geen melding; de glazenwasser zet het zelf aan met Live delen (dan vraagt de telefoon het één keer). */
async function wdMagLocatie(){try{if(!(matchMedia("(pointer:coarse)").matches))return false;if(!navigator.permissions||!navigator.permissions.query)return false;const r=await navigator.permissions.query({name:"geolocation"});return r.state!=="denied"}catch(e){return false}}
async function wdLive(aan,auto){if(typeof liveStart!=="function")return;
  if(aan&&auto&&!(await wdMagLocatie()))return;
  state.liveDelen=aan;try{localStorage.setItem("ms.live",aan?"1":"0")}catch(e){}aan?liveStart(true):liveStop(true);render()}
/* CRM opnieuw geopend tijdens een lopende werkdag: live delen weer aanzetten */
const wdHervat=()=>{try{const w=wdGet(iso(today()));if(w&&w.start&&!w.stop&&!w.liveUit&&typeof LV!=="undefined"&&LV.watch==null)wdLive(true,true)}catch(e){}};
setTimeout(wdHervat,4000);
/* terug in de app (scherm weer aan, andere app gesloten): live delen weer oppakken */
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(wdHervat,800)});

/* ---------- werkdag achteraf corrigeren (eigenaar en beheerder): te laat op Terug bij de loods gedrukt? ----------
   Pas vertrek of terugkomst aan, of vul de echte reistijd in: dan rekent Mansard de terugkomst uit. */
function wdBewerk(d){const c=wdCijfers(d),w=c.w;if(!w.start)return;const hm=ts=>ts?wdT(ts):"";
  openDlg(`<div class="dlg-head"><span class="objic big">${I.pencil}</span><div style="flex:1"><h3>Werkdag aanpassen</h3><div class="subt">${esc(fmtL(d))} · bij klanten ${wdU(c.fact)}${c.pauze?" · pauze "+wdU(c.pauze):""}</div></div><button type="button" class="iconbtn" id="wbX" aria-label="Sluiten">${I.x}</button></div>
    <div class="u-2"><label>Vertrek loods<input id="wb-van" type="time" value="${esc(hm(w.start))}" required></label><label>Terug bij de loods<input id="wb-tot" type="time" value="${esc(hm(w.stop))}"></label></div>
    <label>Of vul de echte reistijd in<span class="ow-in"><input id="wb-reis" type="number" min="0" step="1" inputmode="numeric" placeholder="${Math.round(c.reis)}"><i>min</i></span><small class="help">Mansard rekent dan de terugkomst uit: vertrek + tijd bij klanten + pauze + reistijd.</small></label>
    <p class="subt" id="wb-uit" style="margin:0"></p>
    <div class="row"><span class="sp"></span><button type="button" id="wbC">Annuleren</button><button type="submit" class="primary">${I.check}Opslaan</button></div>`,{wide:false});
  const op=(t,basis)=>{const m=String(t||"").match(/^(\d{1,2}):(\d{2})/);if(!m)return"";const x=new Date(basis||w.start||parse(d));const y=new Date(parse(d));y.setHours(+m[1],+m[2],0,0);return y.toISOString()};
  const reken=()=>{const r=$("#wb-reis").value;if(r!==""){const van=op($("#wb-van").value);if(van){const t=new Date(new Date(van).getTime()+(c.fact+c.pauze+Number(r))*6e4);$("#wb-tot").value=String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0")}}
    const van=op($("#wb-van").value),tot=op($("#wb-tot").value);$("#wb-uit").textContent=van&&tot?`Werkdag ${wdU(wdMin(van,tot))} · reistijd ${wdU(Math.max(0,wdMin(van,tot)-c.pauze-c.fact))}`:""};
  ["wb-van","wb-tot","wb-reis"].forEach(id=>$("#"+id).addEventListener("input",reken));reken();
  $("#wbX").onclick=$("#wbC").onclick=()=>dlg.close();
  form.onsubmit=async e=>{e.preventDefault();const van=op($("#wb-van").value),tot=op($("#wb-tot").value);
    if(!van){toast("Vul de vertrektijd in");return}if(tot&&new Date(tot)<=new Date(van)){toast("Terug bij de loods moet na vertrek liggen");return}
    const pz=(w.pauzes||[]).map(p=>p.tot||!tot?p:{...p,tot});
    await wdZet(d,{start:van,stop:tot||w.stop||"",pauzes:pz,gecorrigeerd:new Date().toISOString()});dlg.close();const n=wdCijfers(d);toast(`Opgeslagen · reistijd ${wdU(n.reis)}`)}}
