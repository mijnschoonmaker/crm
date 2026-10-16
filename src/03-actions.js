/* ---------- ACTIES ---------- */
async function gewassen(k){
  const _lm=lopendeMin(k),_mp=_lm&&_lm>=1?metingPatch(k,_lm):null,_last=(k.tijden||[]).slice(-1)[0],_dur=_mp?_lm:_last&&_last.datum===iso(today())?_last.min:duur(k);if(_mp)k={...k,..._mp};
  const prev={laatst:k.laatst||"",gepland:k.gepland||"",bezig:k.bezig||""},bId=newId("b"),d=iso(today());
  try{
    await save("beurten",bId,{klantId:k.id,klantNaam:k.naam,datum:d,bedrag:Number(k.prijs)||0,betaald:false,gefactureerd:"",dienst:k.dienst||"Glasbewassing",tijd:k.tijd||"",duur:_dur,gemeten:!!_mp,startOp:prev.bezig||"",op:new Date().toISOString()});
    let nx="",_rk=reeksNa(k);if(_rk)nx=_rk.gepland;else if(k.autoplan){const v=ritmeVolgende(k,today());nx=iso(v)}
    await save("klanten",k.id,{...strip(k),laatst:d,gepland:nx,...(_rk?{tijd:_rk.tijd,reeks:_rk.reeks}:{}),bezig:""});aanbevelingVrijgeven(k.id);
    toast(cleanName(k.naam)+" afgerond · "+eur(k.prijs),async()=>{await del("beurten",bId);await save("klanten",k.id,{...strip(k),...prev})});
  }catch(e){err(e)}
}
async function afronden(k,mode,el){
  if(typeof isOBeurt==="function"&&isOBeurt(k)&&!k.tellingGecontroleerd&&!k._tcSkip){const a=await vraag("Telling nog niet gecontroleerd",`Dit is de O-beurt van <b>${esc(cleanName(k.naam))}</b>. Controleer eerst ter plekke of de telling van de klant klopt.`,"Toch afmelden","Telling controleren");
    if(a===null){render();return}if(a===false){render();openTellingControle(k.id);return}}
  const _lm=lopendeMin(k),_mp=_lm&&_lm>=1?metingPatch(k,_lm):null,_last=(k.tijden||[]).slice(-1)[0],_dur=_mp?_lm:_last&&_last.datum===iso(today())?_last.min:duur(k);if(_mp)k={...k,..._mp};
  const _mw=isMw();if(_mw)mode="concept";/* medewerker: altijd concept, kantoor controleert en verstuurt */
  const direct=mode==="concept"&&!!k.directFactureren&&!_mw;if(direct)mode="open";
  const d=iso(today()),st=S(),bId=newId("b"),fId=newId("f"),prev={laatst:k.laatst||"",gepland:k.gepland||"",bezig:k.bezig||""};
  let _rr=null;try{if(k.ramenRegel&&ramenVariabel(normR(k.ramenRegel))){const {q,due}=ramenDue(k,d),b=ramenBerekening(q,Number(k.frequentie)||4,due),mul=st.incl?1+(Number(st.btw)||21)/100:1;
    _rr={q,due,bedrag:r2(b.ex*mul),regels:[...(b.rows.length?[{omschrijving:(k.dienst||"Glasbewassing")+" "+b.rows.map(r=>r.naam.toLowerCase()).join(", ")+(k.verbergAantal?"":", "+b.count+" ramen")+regelExtra(k),aantal:1,prijs:r2((b.glas+b.start)*mul)}]:[]),...(b.kozP?[{omschrijving:"Kozijnreiniging "+b.krows.map(r=>r.naam.toLowerCase()).join(", "),aantal:1,prijs:r2(b.kozP*mul)}]:[])]}}}catch(e){console.error(e);_rr=null}
  const f={soort:"factuur",nummer:nextNr("factuur",d),klantId:k.id,klantNaam:k.naam,klantAdres:factAddr(k),klantEmail:mailK(k,"factuur").email||"",datum:d,
    verval:iso(addDays(today(),Number(k.termijn)||Number(st.termijn)||14)),regels:[...(_rr&&_rr.regels.length?_rr.regels:[{omschrijving:(k.dienst||"Glasbewassing")+regelExtra(k),aantal:1,prijs:Number(k.prijs)||0}]),...extraDue(k,d).map(o=>({omschrijving:(o.groepOms?o.groepOms:o.dienst+(k.verbergFreq?"":" ("+freqLabel(o.frequentie).toLowerCase()+")")+(o.items&&!k.verbergAantal&&o.items.length?": "+groepDetail(o.items,k.verbergFreq?0:o.frequentie):"")),aantal:1,prijs:Number(o.prijs)||0}))],
    btw:Number(st.btw),incl:!!st.incl,status:mode==="open"?"open":"concept",notitie:k.factuurInstructie||"",gemaakt:new Date().toISOString(),betaalwijze:st.betaalwijze||"overmaken"};
  if(mode==="open"&&["contant","pin"].includes(st.betaalwijze)){f.status="betaald";f.betaaldOp=d}
  if(Number(k.toeslag)>0){const sub=f.regels.reduce((a,r)=>a+(Number(r.aantal)||0)*(Number(r.prijs)||0),0);f.regels.push({omschrijving:"Toeslag "+Number(k.toeslag)+"%"+(k.toeslagReden?" ("+k.toeslagReden+")":""),aantal:1,prijs:r2(sub*Number(k.toeslag)/100)})}
  (k.artikelen||[]).forEach(a=>{if(a&&a.naam)f.regels.push({omschrijving:a.naam,aantal:Number(a.aantal)||1,prijs:Number(a.prijs)||0})});
  if(k.btwVerlegd){f.btw=0;f.notitie=[f.notitie,"Btw verlegd"].filter(Boolean).join("\n")}
  if((k.bevindingen||[]).length)f.bijlagen=k.bevindingen.map(b=>({...b,soort:"foto"}));
  if(k.nietFactureren&&!isPeriodiek(k)){/* niet factureren: beurt afmelden zonder factuur */
    try{const _ed=extraDue(k,d),_opd=extraNa(k,d,_ed);
      await save("beurten",bId,{klantId:k.id,klantNaam:k.naam,datum:d,bedrag:0,extra:_ed.map(o=>o.dienst),betaald:false,gefactureerd:"nvt",dienst:k.dienst||"Glasbewassing",tijd:k.tijd||"",duur:_dur,gemeten:!!_mp,startOp:prev.bezig||"",op:new Date().toISOString()});
      let nx="",_rk=reeksNa(k);if(_rk)nx=_rk.gepland;else if(k.autoplan){nx=iso(ritmeVolgende(k,today()))}
      await save("klanten",k.id,{...strip(k),eersteKeer:false,aanbieden:false,uitstelTot:"",bevindingen:[],opdrachten:_opd,...(_rr?{ramenRegel:ramenDoorschuiven(_rr.q,_rr.due,d)}:{}),laatst:d,gepland:nx,...(_rk?{tijd:_rk.tijd,reeks:_rk.reeks}:{}),bezig:""});aanbevelingVrijgeven(k.id);
      const undo=async()=>{try{await del("beurten",bId);await save("klanten",k.id,{...strip(k),...prev});toast("Teruggezet")}catch(e){err(e)}};
      feest(k);toast(cleanName(k.naam)+" afgemeld · niet gefactureerd (staat zo bij de opdracht)",[{label:"Ongedaan",fn:undo}])}
    catch(e){if(el){const c=el.querySelector(".swipe-card");if(c)c.style.transform="";el.classList.remove("armed")}err(e)}
    return}
  if(isPeriodiek(k)){/* periodieke factuur: beurt afmelden zonder eigen factuur; artikelen gaan mee op de periodieke factuur */
    try{const _ed=extraDue(k,d),_opd=extraNa(k,d,_ed);
      await save("beurten",bId,{klantId:k.id,klantNaam:k.naam,datum:d,bedrag:0,extra:_ed.map(o=>o.dienst),betaald:false,gefactureerd:"periodiek",periodiek:true,dienst:k.dienst||"Glasbewassing",tijd:k.tijd||"",duur:_dur,gemeten:!!_mp,startOp:prev.bezig||"",op:new Date().toISOString()});
      let nx="",_rk=reeksNa(k);if(_rk)nx=_rk.gepland;else if(k.autoplan){nx=iso(ritmeVolgende(k,today()))}
      await save("klanten",k.id,{...strip(k),eersteKeer:false,aanbieden:false,uitstelTot:"",opdrachten:_opd,...(_rr?{ramenRegel:ramenDoorschuiven(_rr.q,_rr.due,d)}:{}),laatst:d,gepland:nx,...(_rk?{tijd:_rk.tijd,reeks:_rk.reeks}:{}),bezig:""});aanbevelingVrijgeven(k.id);
      const undo=async()=>{try{await del("beurten",bId);await save("klanten",k.id,{...strip(k),...prev});toast("Teruggezet")}catch(e){err(e)}};
      feest(k);toast(cleanName(k.naam)+" afgemeld · gaat mee op de periodieke factuur ("+fmtD(k.periodiek.volgende)+")",[{label:"Ongedaan",fn:undo}])}
    catch(e){if(el){const c=el.querySelector(".swipe-card");if(c)c.style.transform="";el.classList.remove("armed")}err(e)}
    return}
  const _tg=tegoedVerrekenen(k,f);
  try{
    await save("facturen",fId,f);
    const _ed=extraDue(k,d),_opd=extraNa(k,d,_ed);
    await save("beurten",bId,{klantId:k.id,klantNaam:k.naam,datum:d,bedrag:r2(f.regels.reduce((a,r)=>a+(Number(r.aantal)||0)*(Number(r.prijs)||0),0)),extra:_ed.map(o=>o.dienst),betaald:f.status==="betaald",gefactureerd:fId,dienst:k.dienst||"Glasbewassing",tijd:k.tijd||"",duur:_dur,gemeten:!!_mp,startOp:prev.bezig||"",op:new Date().toISOString()});
    let nx="",_rk=reeksNa(k);if(_rk)nx=_rk.gepland;else if(k.autoplan){nx=iso(ritmeVolgende(k,today()))}
    await save("klanten",k.id,{...strip(k),eersteKeer:false,aanbieden:false,uitstelTot:"",artikelen:[],bevindingen:[],...(k.opdrachtVerwijderd?{actief:false}:{}),opdrachten:_opd,...(_rr?{ramenRegel:ramenDoorschuiven(_rr.q,_rr.due,d)}:{}),laatst:d,gepland:nx,...(_rk?{tijd:_rk.tijd,reeks:_rk.reeks}:{}),...(_tg||{}),bezig:""});aanbevelingVrijgeven(k.id);
    const undo=async()=>{try{await del("facturen",fId);await del("beurten",bId);await save("klanten",k.id,{...strip(k),...prev});toast("Teruggezet")}catch(e){err(e)}};
    feest(k);
    if(_mw){toast(cleanName(k.naam)+" afgemeld",[{label:"Ongedaan",fn:undo}]);return}
    toast(mode==="open"?cleanName(k.naam)+(f.status==="betaald"?" afgerekend ("+st.betaalwijze+") · ":" gefactureerd · ")+f.nummer:cleanName(k.naam)+" afgemeld · conceptfactuur klaar",
      [{label:"Ongedaan",fn:undo},...(mode==="open"?[{label:"Versturen",fn:()=>sendF(fId)}]:[{label:"Bericht",fn:()=>openCompose({title:"Werk voltooid · "+cleanName(k.naam),sjabloon:"voltooid",recipients:[{k,vars:klantVars(k,today()),ref:""}]})}])]);
    if(direct&&f.status!=="betaald"){let n=0;const go=()=>{if(state.facturen.some(x=>x.id===fId))sendF(fId);else if(++n<30)setTimeout(go,100)};setTimeout(go,300)}
  }catch(e){if(el){const c=el.querySelector(".swipe-card");if(c)c.style.transform="";el.classList.remove("armed")}err(e)}
}
async function startJob(k){
  const on=!isBezig(k);
  /* direct zichtbaar maken, ook als het opslaan even duurt */
  const lokaal=patch=>{const i=state.klanten.findIndex(x=>x.id===k.id);if(i>=0){state.klanten[i]={...state.klanten[i],...patch};schedule()}};
  /* de dag is begonnen: live delen gaat vanzelf aan, zodat de klant van vandaag kan zien dat je eraan komt (één keer vraagt de telefoon om je locatie) */
  if(on&&typeof LIVE!=="undefined"&&LIVE&&typeof wdLive==="function"&&!(state.liveDelen&&typeof LV!=="undefined"&&LV.watch!=null)&&!(wdGet(iso(today()))||{}).liveUit)try{wdLive(true)}catch(e){}
  try{if(on){const ts=new Date().toISOString();lokaal({bezig:ts});setTimeout(()=>{const b=document.querySelector(".bs-timer");if(b){b.classList.remove("bt-flash");void b.offsetWidth;b.classList.add("bt-flash")}},80);toast("Tijd loopt bij "+cleanName(k.naam));await save("klanten",k.id,{...strip(k),bezig:ts});return}
    /* stoppen = klaar: tijd vastleggen en meteen afmelden (conceptfactuur, of zoals bij de opdracht ingesteld) */
    await afronden(k,"concept");}catch(e){err(e)}
}
async function moveTo(id,date,tijd,force){
  const k=state.klanten.find(x=>x.id===id);if(!k)return;
  if(date&&!force&&date!==k.gepland&&typeof vroegOk==="function"&&!(await vroegOk([k],date)))return;
  const prev={gepland:k.gepland||"",tijd:k.tijd||""};
  const nw={gepland:date,tijd:!date?"":tijd!==undefined?tijd:(k.tijd||""),...(date?{aanbieden:false}:{})};
  if(date&&!force&&!k.gepland&&typeof ADV!=="undefined"&&ADV.reeks){const r=await openReeks(k,date,nw.tijd);if(!r)return;return reeksOpslaan(k,date,nw.tijd,r)}
  if(prev.gepland===nw.gepland&&prev.tijd===nw.tijd)return;
  try{await save("klanten",k.id,{...strip(k),...nw});toast(cleanName(k.naam)+(date?" ingepland op "+fmtD(date)+(nw.tijd?" om "+nw.tijd:""):" terug naar te plannen"),()=>save("klanten",k.id,{...strip(k),...prev}))}catch(e){err(e)}
}
async function optimize(day){
  /* alle stops van deze dag die nog open staan, ook afspraken die van eerder zijn doorgeschoven */
  const alle=routeStops(day),af=alle.filter(s=>s.done).map(s=>s.k),js=alle.filter(s=>!s.done).map(s=>s.k);
  if(js.length<2){toast("Minimaal twee open stops nodig op deze dag");return}
  const co=k=>typeof pkCoord==="function"?pkCoord(k):null,bk=typeof rtBedrijf==="function"?rtBedrijf():null;
  let start=bk&&typeof pkHeeftAdres==="function"&&pkHeeftAdres(bk)?co(bk):null;if(af.length&&co(af[af.length-1]))start=co(af[af.length-1]);
  /* dichtstbijzijnde-buur vanaf de loods (of het laatste afgeronde adres); zonder coördinaten op postcode en huisnummer */
  const rest=js.slice(),volg=[];let pos=start;
  while(rest.length){let bi=0;if(pos){let bd=Infinity;rest.forEach((k,i)=>{const c=co(k);const d=c?rtKm(pos,c):50+i*.001;if(d<bd){bd=d;bi=i}})}else{rest.sort(geoCmp);bi=0}
    const k=rest.splice(bi,1)[0];volg.push(k);pos=co(k)||pos}
  let m=Math.min(...js.map(k=>toMin(k.tijd)??1e9));if(m>=1e9)m=toMin(S().werkStart)??8*60;
  const ids=[];
  try{let prev=start;for(const k of volg){const c=co(k),reis=prev&&c?(rtMin(prev,c)||0):0;if(ids.length)m=Math.ceil((m+reis)/5)*5;
      await save("klanten",k.id,{...strip(k),tijd:fromMin(m)});ids.push(k.id);m+=duur(k);prev=c||prev}
    await save("routes",day,{...strip(state.routes[day]||{}),order:[...af.map(k=>k.id),...ids]});
    toast(start?"Route geoptimaliseerd: kortste rondje vanaf "+(af.length?"je laatste adres":"de loods"):"Route geoptimaliseerd op postcode en huisnummer")}catch(e){err(e)}
}
async function setFStatus(id,s){
  const f=state.facturen.find(x=>x.id===id);if(!f)return;
  try{await save("facturen",id,{...strip(f),status:s,betaaldOp:s==="betaald"?iso(today()):""});
    if(f.soort!=="offerte")for(const b of state.beurten.filter(b=>b.gefactureerd===id))await save("beurten",b.id,{...strip(b),betaald:s==="betaald"});
    toast(s==="betaald"?"Betaling verwerkt":"Status bijgewerkt");setTimeout(()=>openFactuur(id),50)}catch(e){err(e)}
}
async function billAll(btn,ids){
  const ub=unbilled().filter(b=>!ids||ids.includes(b.id)),groups={};let laatsteId="";ub.forEach(b=>(groups[b.klantId]=groups[b.klantId]||[]).push(b));
  const st=S(),d=iso(today());let i=0;if(btn)btn.disabled=true;
  const first=nextNr("factuur",d),{pre,n:base,pad:nrPad}=nrDelen(first);
  try{for(const kid of Object.keys(groups)){
    const k=state.klanten.find(x=>x.id===kid)||{naam:groups[kid][0].klantNaam};
    const id=newId("f"),regels=groups[kid].sort((a,b)=>String(a.datum).localeCompare(String(b.datum))).map(b=>({omschrijving:(b.dienst||k.dienst||"Glasbewassing")+" "+fmtL(b.datum),aantal:1,prijs:Number(b.bedrag)||0}));
    await save("facturen",id,{soort:"factuur",nummer:pre+String(base+i).padStart(nrPad,"0"),klantId:kid,klantNaam:k.naam,klantAdres:k.adres?factAddr(k):"",klantEmail:mailK(k,"factuur").email||"",datum:d,verval:iso(addDays(today(),Number(k.termijn)||Number(st.termijn)||14)),regels,btw:Number(st.btw),incl:!!st.incl,status:"open",notitie:"",gemaakt:new Date().toISOString()});
    for(const b of groups[kid])await save("beurten",b.id,{...strip(b),gefactureerd:id});
    laatsteId=id;i++}
    if(ids){toast("Factuur aangemaakt");if(btn)btn.disabled=false;return laatsteId}
    toast(plural(i,"factuur","facturen")+" aangemaakt");state.fFilter="openstaand";schedule()}
  catch(e){if(btn)btn.disabled=false;err(e)}
}

/* ---------- KLANT ---------- */
function openKlant(id,opt={}){if(id&&state.klanten.some(x=>x.id===id)&&!opt.rc&&!opt.edit)return openKlantView(id,opt);return openKlantEdit(id,opt)}
function openKlantEdit(id,opt={}){
  if(!id&&!opt.rc&&typeof openNieuweKlant==="function")return openNieuweKlant();
  const k=state.klanten.find(x=>x.id===id)||{naam:"",adres:"",postcode:"",plaats:"",telefoon:"",email:"",ronde:"",frequentie:4,prijs:"",binnen:false,laatst:"",gepland:"",tijd:"",duur:30,dienst:"Glasbewassing",notities:"",actief:true,soort:"particulier",log:[],objecten:[]};
  const isNew=!k.id;
  const hist=isNew?[]:state.beurten.filter(b=>b.klantId===k.id).sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));
  const fs=isNew?[]:state.facturen.filter(f=>f.klantId===k.id).sort((a,b)=>String(b.datum).localeCompare(String(a.datum))),offs=fs.filter(f=>f.soort==="offerte"),facs=fs.filter(f=>f.soort!=="offerte");
  const s=isNew?null:status(k),jaar=(Number(k.prijs)||0)*(365/freqDays(k))+extraOpdr(k).reduce((a,o)=>a+(Number(o.prijs)||0)*52/(Number(o.frequentie)||52),0);
  openDlg(`<div class="dlg-head">${isNew?`<span class="objic big">${I.user}</span>`:`<span class="av" style="--h:${hue(k.ronde||k.naam)}">${esc(initials(k.naam))}</span>`}<div style="min-width:0;flex:1"><h3>${isNew?"Nieuwe klant":"Klantgegevens aanpassen"}</h3>
    ${!isNew?`<div class="subt">${esc(k.naam)} · ${esc(fullAddr(k))}</div>`:'<div class="subt">Vul naam en adres in, de rest kan later</div>'}</div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="kk-grid${isNew?"":" kk-one"}"><div class="kk-left">${k.prospect?(()=>{const of=state.facturen.filter(f=>f.soort==="offerte"&&f.klantId===k.id&&f.status!=="afgewezen"&&f.status!=="geaccepteerd").sort((a,b)=>String(b.datum).localeCompare(String(a.datum)))[0];return `<div class="banner"><div><b>Offerte${of?" "+esc(of.nummer):""} wacht op akkoord</b><br><small>Deze klant staat nog niet in de planning. Bij akkoord wordt hij een vaste klant en plan je de eerste beurt in.</small></div>${of?`<button type="button" class="primary small" data-act="akkoord" data-id="${esc(of.id)}">Akkoord en inplannen</button>`:""}</div>`})():""}

  <div class="grid2">
    <label class="full">Naam<input id="f-naam" required value="${esc(k.naam)}"></label>
    <label class="full">Adres<input id="f-adres" required value="${esc(k.adres)}" placeholder="Straat en huisnummer"></label>
    <label>Postcode<input id="f-postcode" value="${esc(k.postcode)}" placeholder="1234 AB"></label>
    <label>Plaats<input id="f-plaats" value="${esc(k.plaats)}"></label>
    <label>Telefoon<input id="f-telefoon" type="tel" value="${esc(k.telefoon)}"></label>
    <label>Klantnummer<input id="f-klantnr" inputmode="numeric" value="${esc(k.klantnr||"")}" placeholder="${isNew?"Automatisch":esc(klantNr(k))}"><small class="help">Zelfde als de relatiecode in SnelStart</small></label>
    <label>E-mail<input id="f-email" type="email" value="${esc(k.email)}"></label>
    <label>Ronde<input id="f-ronde" list="rondelijst" value="${esc(k.ronde)}" placeholder="bijv. Ronde Noord"><datalist id="rondelijst">${rondes().map(r=>`<option value="${esc(r)}">`).join("")}</datalist></label>
    <label>Soort<select id="f-soort"><option value="particulier" ${k.soort!=="zakelijk"&&k.soort!=="vve"?"selected":""}>Particulier</option><option value="zakelijk" ${k.soort==="zakelijk"?"selected":""}>Zakelijk</option><option value="vve" ${k.soort==="vve"?"selected":""}>VvE / Overheid</option></select></label>
  </div>
  <div><span class="eyebrow">Dienst en planning</span><div class="grid2" style="margin-top:8px">
    <label>Dienst<input id="f-dienst" list="dienstlijst" value="${esc(k.dienst||"Glasbewassing")}"><datalist id="dienstlijst">${[...dienstLijst().map(d=>d.naam),...DIENSTEN].filter((v,i,a)=>a.indexOf(v)===i).map(d=>`<option value="${esc(d)}">`).join("")}</datalist></label>
    <label>Prijs per beurt (€ ${S().incl?"incl.":"excl."} btw)<input id="f-prijs" type="number" step="0.5" min="0" inputmode="decimal" required value="${esc(k.prijs)}"></label>
    <label>Frequentie<select id="f-frequentie">${freqOpts(k.frequentie||4).map(w=>`<option value="${w}" ${Number(k.frequentie||4)===w?"selected":""}>Elke ${w} ${w===1?"week":"weken"}</option>`).join("")}</select></label>
    <label>Duur<select id="f-duur">${[...new Set([15,30,45,60,90,120,180,240,Number(k.duur||30)])].sort((a,b)=>a-b).map(m=>`<option value="${m}" ${Number(k.duur||30)===m?"selected":""}>${m<60?m+" min":(m/60).toLocaleString("nl-NL")+" uur"}</option>`).join("")}</select>${(k.tijden||[]).length?`<small class="help">Gemeten: gemiddeld ${gemTijd(k)} min over ${plural(Math.min(5,k.tijden.length),"beurt","beurten")} · laatst ${k.tijden.slice(-1)[0].min} min</small>`:'<small class="help">Wordt automatisch bijgesteld met Start en Stop op Route</small>'}</label>
    <label>Laatst gewassen<input id="f-laatst" type="date" value="${esc(k.laatst)}"></label>
    <label>Ingepland op <small style="font-weight:500">(leeg = te plannen)</small><input id="f-gepland" type="date" value="${esc(k.gepland)}"></label>
    <label>Tijd<input id="f-tijd" type="time" step="900" value="${esc(k.tijd)}"></label>
    ${(k.objecten||[]).length?`<label>Object<select id="f-object">${k.objecten.map(o=>`<option value="${esc(o.id)}" ${jobObj(k)&&jobObj(k).id===o.id?"selected":""}>${esc(o.naam||"Object")}</option>`).join("")}</select></label>`:"<span></span>"}

    <label class="check-row"><input id="f-akkoord" type="checkbox" ${k.akkoord?"checked":""}>Akkoord op overeenkomst</label><label class="check-row"><input id="f-geenreview" type="checkbox" ${k.geenReview?"checked":""}>Geen reviewverzoeken</label>
    <label class="full check-row"><input id="f-incasso" type="checkbox" ${k.incasso?"checked":""}>Betaalt via automatische incasso (krijgt geen betalingsherinneringen)</label>
    <label class="full check-row"><input id="f-direct" type="checkbox" ${k.directFactureren?"checked":""}>Factuur direct versturen bij afmelden <small style="font-weight:500;color:var(--muted)">(standaard: conceptfactuur in Facturen)</small></label>
    ${isNew?"":`<label class="check-row"><input id="f-actief" type="checkbox" ${k.actief!==false?"checked":""}>Actieve klant</label><label>Reden als inactief<select id="f-reden"><option value="">—</option>${(S().annuleerRedenen||[]).map(r=>`<option ${k.opzegReden===r?"selected":""}>${esc(r)}</option>`).join("")}</select></label>`}
  </div></div>
  ${isNew?"":`<div><div style="display:flex;align-items:center;gap:8px"><span class="eyebrow">Objecten</span><span style="flex:1"></span><button type="button" class="small" data-act="obj" data-id="${esc(k.id)}" data-o="">${I.plus}Object</button></div>
    <div class="list" style="margin-top:8px;gap:6px">${(k.objecten||[]).map(o=>`<button type="button" class="objrow" data-act="obj" data-id="${esc(k.id)}" data-o="${esc(o.id)}"><span class="objic">${I.building}</span><span class="objtx"><b>${esc(o.naam||"Object")}</b><small>${esc(o.adres?[o.adres,o.plaats].filter(Boolean).join(", "):"Klantadres")}${o.ramen?" · "+esc(o.ramen)+" ramen":""}${o.m2?" · "+esc(o.m2)+" m²":""}</small></span>${I.right.replace("<svg",'<svg class="chev"')}</button>`).join("")||'<p class="subt" style="margin:0">Nog geen objecten. Leg per pand het aantal ramen, toegang, alarmcode en parkeren vast.</p>'}</div></div>`}
  </div>${isNew?`<div class="kk-side"><section class="kp"><div class="kp-h"><span class="objic">${I.offertes}</span><b>Offertes</b></div><p class="subt" style="margin:0 0 12px">Sla de klant op. Daarna maak je hier een offerte met de rekentool, of klik meteen hieronder.</p><button type="button" class="primary" id="kkOff">${I.offertes}Opslaan en offerte maken</button></section></div>`:""}
  <div class="row stickyfoot kk-foot">${isNew?"":`<button type="button" class="ghost danger" id="delK">Verwijderen</button>`}<span class="sp"></span><button type="button" id="kkCancel">Annuleren</button><button type="submit" class="primary" id="saveK">Opslaan</button></div>`,{xwide:isNew,wide:!isNew});
  $("#kkCancel").onclick=()=>{if(isNew)dlg.close();else openKlantView(k.id)};
  const g=n=>$("#f-"+n);
  g("dienst").addEventListener("change",()=>{const d=dienstLijst().find(x=>x.naam===g("dienst").value);if(d){if(!Number(g("prijs").value))g("prijs").value=d.prijs;g("duur").value=[15,30,45,60,90,120,180,240].reduce((a,b)=>Math.abs(b-d.duur)<Math.abs(a-d.duur)?b:a)}});
  const collect=()=>{
    if(!g("naam").value.trim()||!g("adres").value.trim()){g(g("naam").value.trim()?"adres":"naam").focus();return null}
    const cur=state.klanten.find(x=>x.id&&x.id===(newKid||k.id))||k;
    return {...strip(cur),naam:g("naam").value.trim(),adres:g("adres").value.trim(),postcode:g("postcode").value.trim().toUpperCase(),plaats:g("plaats").value.trim(),
      telefoon:g("telefoon").value.trim(),klantnr:g("klantnr").value.trim(),email:g("email").value.trim(),ronde:g("ronde").value.trim(),soort:g("soort").value,
      frequentie:Number(g("frequentie").value),prijs:Number(g("prijs").value)||0,laatst:g("laatst").value,gepland:g("gepland").value,tijd:g("gepland").value?g("tijd").value:"",
      duur:Number(g("duur").value)||30,dienst:g("dienst").value.trim()||"Glasbewassing",objectId:g("object")?g("object").value:"",binnen:false,
      actief:isNew?true:g("actief").checked,incasso:g("incasso").checked,directFactureren:g("direct").checked,akkoord:g("akkoord").checked,geenReview:g("geenreview").checked,opzegReden:g("reden")?g("reden").value:"",aangemaakt:cur.aangemaakt||iso(today()),log:cur.log||[],objecten:cur.objecten||[]}};
  let newKid=k.id||"";
  const saveK=async(patch={})=>{const base=collect();if(!base)throw{msg:"Vul eerst de naam en het adres van de klant in (links)."};if(!newKid)newKid=newId("k");await save("klanten",newKid,{...base,...patch});return newKid};
  form.onsubmit=async e=>{e.preventDefault();$("#saveK").disabled=true;
    try{let extraP={};if(rcLive&&RC&&RC.current()){const {t}=await RC.telling();if(t)extraP={ramenTelling:t}}
      const r=await saveK(extraP);if(!r)return;toast(isNew?"Klant toegevoegd":"Opgeslagen");setTimeout(()=>openKlantView(r),60)}catch(er){$("#saveK").disabled=false;if(er&&er.msg)toast(er.msg);else err(er)}};
  /* rekentool in de klantkaart: tellen, prijs opslaan, of door naar een offerte */
  let rcLive=false;const rcT=$("#kkRcT"),mountRc=()=>{const box=$("#kkRc");if(!box||!box.hidden)return;
    try{if(!RC)RC=buildRamen();
      RC.setEmbed({klantId:k.id||"",base:k,
        form:()=>({naam:g("naam").value.trim(),adres:g("adres").value.trim(),pc:g("postcode").value.trim().toUpperCase(),plaats:g("plaats").value.trim(),tel:g("telefoon").value.trim(),email:g("email").value.trim(),notitie:"",zakelijk:g("soort").value==="zakelijk"}),
        onSave:async(patch,o={})=>{const kid=await saveK(patch);if(!o.stay)setTimeout(()=>openKlant(kid,{rc:true}),80);return kid},
        onCalc:()=>{if(!g("prijs"))return;const c=RC.current();if(!c)return;rcLive=true;
          g("prijs").value=c.opd.prijs;
          const sf=g("frequentie"),w=String(c.opd.frequentie);if(w&&w!=="undefined"){if(![...sf.options].some(o=>o.value===w))sf.insertAdjacentHTML("beforeend",`<option value="${w}">Elke ${w} weken</option>`);sf.value=w}
          if(!(k.tijden||[]).length){const sd=g("duur"),m=String(c.opd.duur);if(![...sd.options].some(o=>o.value===m))sd.insertAdjacentHTML("beforeend",`<option value="${m}">${m} min</option>`);sd.value=m}
          [g("prijs"),sf].forEach(el=>{el.classList.remove("flash");void el.offsetWidth;el.classList.add("flash")})},
        offerte:async()=>{const {t}=await RC.telling();const kid=await saveK({...(t?{ramenTelling:t}:{}),...(isNew||k.prospect?{prospect:true}:{})});RC.reset();openOfferte({klantId:kid,metTelling:true})}},true);
      box.hidden=false;box.appendChild(RC.host);RC.sync();if(k.id&&k.ramenTelling)RC.loadFor(k.id);if(rcT)rcT.hidden=true}
    catch(er){console.error(er);box.hidden=false;box.innerHTML='<p class="subt">De rekentool kon hier niet worden geladen.</p>'}};
  if(rcT)rcT.onclick=mountRc;if(opt.rc)mountRc();
  const ko=$("#kkOff");if(ko)ko.onclick=async()=>{ko.disabled=true;try{const kid=await saveK({prospect:true});openOfferte({klantId:kid})}catch(er){ko.disabled=false;if(er&&er.msg)toast(er.msg);else err(er)}};
  const d=$("#delK");
  if(d){let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}
    try{await del("klanten",k.id);dlg.close();toast(cleanName(k.naam)+" verwijderd")}catch(er){err(er)}}}
  const al=$("#addLog");
  if(al)al.onclick=async()=>{const v=g("log").value.trim();if(!v)return;const log=[...(k.log||[]),{datum:iso(today()),tekst:v}];
    try{await save("klanten",k.id,{...strip(k),log});setTimeout(()=>openKlant(k.id,{keepCalc:true}),60)}catch(er){err(er)}};
}
function openObject(kid,oid){
  const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const os=k.objecten||[],o=os.find(x=>x.id===oid)||{naam:os.length?"":"Woning",adres:"",postcode:"",plaats:"",ramen:"",m2:"",toegang:"",alarmcode:"",parkeren:"",materialen:"",notities:""};
  const isNew=!o.id;
  const f=(id,l,ph="",type="text",cls="")=>`<label class="${cls}">${l}<input id="o-${id}" type="${type}" value="${esc(o[id])}" placeholder="${esc(ph)}"${type==="number"?' min="0" inputmode="numeric"':""}></label>`;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.building}</span><div style="min-width:0;flex:1"><h3>${isNew?"Nieuw object":"Object bewerken"}</h3><div class="subt">Voor ${esc(cleanName(k.naam))}</div></div><button type="button" class="iconbtn" id="oX" aria-label="Sluiten">${I.x}</button></div>
  <div class="grid2">${f("naam","Naam object","Woning, kantoor, winkelpand…","text","full")}${f("adres","Adres (optioneel — leeg = klantadres)","Straat + huisnummer","text","full")}${f("postcode","Postcode")}${f("plaats","Plaats")}
    ${f("ramen","Aantal ramen","","number")}${f("m2","m² schoonmaak","","number")}
    ${f("toegang","Toegang (sleutel / code / aanmelden)","Bijv. sleutel bij receptie, aanmelden bij beheerder","text","full")}
    <label class="full">Alarmcode (verborgen tot je op Toon tikt)<span class="secret">${I.lock}<input id="o-alarmcode" type="password" autocomplete="off" value="${esc(o.alarmcode)}" placeholder="Bijv. 1234"><button type="button" class="small ghost" id="oShow">Toon</button></span></label>
    <label class="full">Parkeren<textarea id="o-parkeren" style="min-height:56px" placeholder="Bijv. parkeervergunning nodig, laden/lossen voor de deur">${esc(o.parkeren)}</textarea></label>
    <label class="full">Materialen<textarea id="o-materialen" style="min-height:56px" placeholder="Bijv. ladder 6m, hoogwerker, waterontharder">${esc(o.materialen)}</textarea></label>
    <label class="full">Notities<textarea id="o-notities" style="min-height:56px">${esc(o.notities)}</textarea></label></div>
  <div class="row">${isNew?"":`<button type="button" class="ghost danger" id="delO">Verwijderen</button>`}<span class="sp"></span><button type="button" id="oBack">Annuleren</button><button type="submit" class="primary" id="oSave">Opslaan</button></div>`);
  $("#oShow").onclick=()=>{const i=$("#o-alarmcode");i.type=i.type==="password"?"text":"password";$("#oShow").textContent=i.type==="password"?"Toon":"Verberg"};
  $("#oBack").onclick=$("#oX").onclick=()=>openKlant(k.id,{keepCalc:true});
  const write=async list=>{const objectId=list.some(x=>x.id===k.objectId)?k.objectId:(list[0]?list[0].id:"");await save("klanten",k.id,{...strip(k),objecten:list,objectId})};
  form.onsubmit=async e=>{e.preventDefault();const g=n=>$("#o-"+n).value.trim();
    const data={id:o.id||newId("o"),naam:g("naam")||"Object",adres:g("adres"),postcode:g("postcode").toUpperCase(),plaats:g("plaats"),ramen:g("ramen"),m2:g("m2"),toegang:g("toegang"),alarmcode:g("alarmcode"),parkeren:g("parkeren"),materialen:g("materialen"),notities:g("notities")};
    const list=isNew?[...os,data]:os.map(x=>x.id===o.id?data:x);
    $("#oSave").disabled=true;try{await write(list);toast(isNew?"Object toegevoegd":"Object opgeslagen");setTimeout(()=>openKlant(k.id,{keepCalc:true}),60)}catch(er){$("#oSave").disabled=false;err(er)}};
  const d=$("#delO");if(d){let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}
    try{await write(os.filter(x=>x.id!==o.id));toast("Object verwijderd");setTimeout(()=>openKlant(k.id),60)}catch(er){err(er)}}}
}

/* ---------- IMPORT / EXPORT ---------- */
const FIELDS=[["klantnr","Klantnummer / relatiecode",/(relatiecode|klantnummer|klantnr|debiteur)/],["naam","Naam",/^(naam|klant|klantnaam|name|bedrijf|bedrijfsnaam|achternaam)/],["adres","Adres / straat",/(adres|straat|address|street)/],["huisnr","Huisnummer",/(huisn|huisnummer|^nr$|^nummer$|number)/],
  ["postcode","Postcode",/(postcode|zip|postal)/],["plaats","Plaats",/(plaats|woonplaats|stad|city|gemeente)/],["telefoon","Telefoon",/(tel|mobiel|gsm|phone)/],["email","E-mail",/(mail)/],
  ["prijs","Prijs",/(prijs|bedrag|tarief|price)/],["frequentie","Frequentie (weken)",/(freq|interval|weken|cyclus)/],["ronde","Ronde",/(ronde|wijk|route|gebied)/],["dienst","Dienst",/(dienst|service)/],["laatst","Laatst gewassen",/(laatst|vorige|last)/],["notities","Notities",/(notitie|opmerking|note|info)/]];
function parseCSV(text){
  const first=text.split(/\r?\n/)[0]||"";
  const delim=[";","\t",","].map(d=>[d,first.split(d).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],cur="",q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;else if(c===delim){row.push(cur);cur=""}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cur);rows.push(row);row=[];cur=""}
    else cur+=c}
  if(cur||row.length){row.push(cur);rows.push(row)}
  return rows.filter(r=>r.some(x=>String(x).trim()));
}
const parseNum=v=>{const s=String(v||"").replace(/[€\s]/g,"");if(!s)return 0;const n=s.includes(",")?s.replace(/\./g,"").replace(",","."):s;return Number(n)||0};
const parseDate=v=>{const s=String(v||"").trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+"-"+pad(m[2])+"-"+pad(m[3]);m=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);if(m){const y=m[3].length===2?"20"+m[3]:m[3];return y+"-"+pad(m[2])+"-"+pad(m[1])}return""};
let imp=null;
function openImport(){
  openDlg(`<div class="dlg-head"><span class="objic big">${I.upload}</span><div style="flex:1"><h3>Klanten importeren</h3><div class="subt">Uit Excel of CSV, kolommen worden herkend</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <p class="subt" style="margin:0">Sla je lijst in Excel op als CSV (Bestand › Opslaan als › CSV) en kies het bestand. Of plak de rijen hieronder, met de kolomnamen op de eerste regel.</p>
  <label>CSV-bestand<input type="file" id="impFile" accept=".csv,.txt,text/csv"></label>
  <label>Of plak hier<textarea id="impText" placeholder="Naam;Adres;Postcode;Plaats;Telefoon;Prijs&#10;Fam. Bakker;Dorpsstraat 4;1234 AB;Zeist;0612345678;22,50"></textarea></label>
  <div id="impMap"></div>
  <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="button" class="primary" id="impGo" disabled>Importeren</button></div>`,{wide:true});
  const load=t=>{const rows=parseCSV(t);if(rows.length<2){$("#impMap").innerHTML='<div class="notice">Er zijn minimaal een kopregel en één klantregel nodig.</div>';$("#impGo").disabled=true;return}
    const head=rows[0].map(h=>String(h).trim()),map={};
    FIELDS.forEach(([f,,re])=>{const i=head.findIndex((h,ix)=>re.test(h.toLowerCase())&&!Object.values(map).includes(ix));if(i>-1)map[f]=i});
    imp={head,rows:rows.slice(1),map};drawMap()};
  $("#impFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{$("#impText").value="";load(String(rd.result))};rd.readAsText(f)};
  $("#impText").oninput=e=>{if(e.target.value.trim())load(e.target.value)};
  $("#impGo").onclick=runImport;
}
function drawMap(){
  const{head,rows,map}=imp;
  $("#impMap").innerHTML=`<span class="eyebrow">Kolommen koppelen · ${rows.length} klanten gevonden</span>
  <div class="grid3" style="margin-top:8px">${FIELDS.map(([f,lbl])=>`<label>${lbl}<select data-map="${f}"><option value="">— niet —</option>${head.map((h,i)=>`<option value="${i}" ${map[f]===i?"selected":""}>${esc(h||"kolom "+(i+1))}</option>`).join("")}</select></label>`).join("")}</div>
  <div class="importprev" style="margin-top:12px"><table><tr>${["Naam","Adres","Postcode","Plaats","Prijs","Freq."].map(h=>`<th>${h}</th>`).join("")}</tr>${rows.slice(0,5).map(r=>{const k=rowToKlant(r);return `<tr><td>${esc(k.naam)}</td><td>${esc(k.adres)}</td><td>${esc(k.postcode)}</td><td>${esc(k.plaats)}</td><td>${eur(k.prijs)}</td><td>${k.frequentie} wk</td></tr>`}).join("")}</table></div>`;
  $("#impMap").querySelectorAll("[data-map]").forEach(s=>s.onchange=()=>{const v=s.value;if(v==="")delete imp.map[s.dataset.map];else imp.map[s.dataset.map]=Number(v);drawMap()});
  const ok=imp.map.naam!=null&&imp.map.adres!=null;$("#impGo").disabled=!ok;$("#impGo").textContent=ok?"Importeer "+rows.length+" klanten":"Koppel naam en adres";
}
function rowToKlant(r){
  const g=f=>imp.map[f]!=null?String(r[imp.map[f]]??"").trim():"";
  return{klantnr:g("klantnr"),naam:g("naam"),adres:[g("adres"),g("huisnr")].filter(Boolean).join(" "),postcode:g("postcode").toUpperCase(),plaats:g("plaats"),telefoon:g("telefoon"),email:g("email"),
    prijs:parseNum(g("prijs")),frequentie:Math.max(1,Math.round(parseNum(g("frequentie")))||4),ronde:g("ronde"),dienst:g("dienst")||"Glasbewassing",duur:30,laatst:parseDate(g("laatst")),gepland:"",tijd:"",notities:g("notities"),
    binnen:false,soort:"particulier",actief:true,aangemaakt:iso(today()),log:[],objecten:[]};
}
async function runImport(){
  const b=$("#impGo");b.disabled=true;let n=0;
  const list=imp.rows.map(rowToKlant).filter(k=>k.naam&&k.adres);
  try{for(const k of list){await save("klanten",newId("k"),k);n++;if(n%10===0)b.textContent=n+" van "+list.length+"…"}
    dlg.close();toast(n+" klanten geïmporteerd");state.tab="klanten";schedule()}
  catch(e){b.disabled=false;toast(n+" geïmporteerd, daarna fout: "+(e.message||e.code))}
}
async function saveFile(filename,data,okMsg){
  if(!state.dl){toast("Downloaden is hier niet beschikbaar");return}
  try{await state.dl.save({filename,data});toast(okMsg||"Opgeslagen")}catch(e){if(e.code!=="declined")toast("Opslaan lukte niet ("+e.code+")")}
}
function csvOf(cols,rows){const q=v=>{const s=String(v??"");return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};return "﻿"+cols.join(";")+"\n"+rows.map(r=>cols.map(c=>q(typeof r[c]==="number"?String(r[c]).replace(".",","):r[c])).join(";")).join("\n")}
const exportKlanten=()=>saveFile("zeem-klanten-"+iso(today())+".csv",csvOf(["naam","adres","postcode","plaats","telefoon","email","ronde","dienst","frequentie","prijs","laatst","notities"],state.klanten),"Klantenlijst opgeslagen");
const exportFacturen=()=>saveFile("zeem-facturen-"+iso(today())+".csv",csvOf(["nummer","datum","verval","klant","status","excl","btw","incl"],facturen().map(f=>{const t=totals(f);return{nummer:f.nummer,datum:f.datum,verval:f.verval,klant:cleanName(f.klantNaam),status:fStatus(f)[1],excl:t.ex,btw:t.btw,incl:t.inc}})),"Facturen opgeslagen");

/* ---------- FACTUREN & OFFERTES ---------- */
function openFactuur(id){const f=state.facturen.find(x=>x.id===id);if(!f)return;if(f.soort==="offerte")return openFactuurOud(id);return openFactuurWerk(id)}
function openFactuurOud(id,fromWerk){
  const f=state.facturen.find(x=>x.id===id);if(!f)return;
  const st=fStatus(f),off=f.soort==="offerte";if(off&&f.getekendNieuw&&typeof getekendGezien==="function")getekendGezien(f);
  openDlg(`<div class="dlg-head fw-head"><div class="fw-h1"><span class="objic big">${off?I.offertes:I.facturen}</span><div class="fw-ht"><small>${off?"Offerte":"Factuur"}</small><h3>${esc(f.nummer)}</h3></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="fw-h2"><div class="fw-hk"><b>${esc(cleanName(f.klantNaam))}</b><small>${esc(fmtL(String(f.datum||"").slice(0,10)))}</small></div><div class="fw-hb"><b>${eur(totals(f).inc)}</b>${statusPill(st[0],st[1])}</div></div></div>
  ${off&&f.getekend&&typeof getekendBox==="function"?getekendBox(f):""}<div class="row fw-acts" style="justify-content:flex-start;padding:0">
    ${off?`${f.status!=="geaccepteerd"?`<button type="button" class="small primary" data-act="akkoord" data-id="${esc(f.id)}">${I.check}Akkoord en inplannen</button>`:""}${(f.status||"concept")==="concept"?`<button type="button" class="small" data-act="fset" data-id="${esc(f.id)}" data-s="verstuurd">Markeer verstuurd</button>`:""}${f.status!=="afgewezen"?`<button type="button" class="small" data-act="fset" data-id="${esc(f.id)}" data-s="afgewezen">Afgewezen</button>`:""}<button type="button" class="small" data-act="toinvoice" data-id="${esc(f.id)}" title="Alleen voor eenmalig werk. Vaste klanten krijgen na elke afgemelde beurt vanzelf een factuur.">Eenmalig factureren</button>`
      :f.status==="concept"?`<button type="button" class="small primary" data-act="fset" data-id="${esc(f.id)}" data-s="open">Maak definitief</button>`:f.status==="betaald"?`<button type="button" class="small" data-act="fset" data-id="${esc(f.id)}" data-s="open">Terug naar openstaand</button>`:`<button type="button" class="small good" data-act="fset" data-id="${esc(f.id)}" data-s="betaald">${I.check}Markeer betaald</button>`}
    ${state.dl?`<button type="button" class="small" data-act="pdf" data-id="${esc(f.id)}">${I.dl}PDF</button>`:""}
    <button type="button" class="small yellow" data-act="sendf" data-id="${esc(f.id)}">${I.send}${st[1]==="Achterstallig"?"Stuur herinnering":"Versturen"}</button>
    <button type="button" class="small" data-act="editf" data-id="${esc(f.id)}">Bewerken</button>
  </div>
  ${f.verstuurdOp||f.herinnerdOp?`<p class="subt" style="margin:0">${f.verstuurdOp?"Verstuurd op "+fmtL(f.verstuurdOp):""}${f.verstuurdOp&&f.herinnerdOp?" · ":""}${f.herinnerdOp?"Laatste herinnering "+fmtL(f.herinnerdOp):""}</p>`:""}
  <div class="paperwrap">${paperHtml(f)}</div>
  <div class="row">${fromWerk?"":`<button type="button" class="ghost danger" id="delF">Verwijderen</button>`}<span class="sp"></span>${fromWerk?`<button type="button" id="fBack">${I.left}Terug naar factuur</button>`:`<button type="button" data-act="close">Sluiten</button>`}</div>`,{wide:true});
  requestAnimationFrame(paperFit);
  if(fromWerk){$("#fBack").onclick=()=>openFactuurWerk(id);return}
  const d=$("#delF");let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}
    try{for(const b of state.beurten.filter(b=>b.gefactureerd===f.id))await save("beurten",b.id,{...strip(b),gefactureerd:""});await del("facturen",f.id);dlg.close();toast(f.nummer+" verwijderd")}catch(e){err(e)}};
}
function openFactuurForm(opts={}){
  const ex=opts.id?state.facturen.find(x=>x.id===opts.id):null;
  const soort=ex?ex.soort:opts.soort||"factuur",st=S(),d=ex?ex.datum:iso(today());
  const k0=ex?state.klanten.find(x=>x.id===ex.klantId):opts.klantId?state.klanten.find(x=>x.id===opts.klantId):null;
  const lines=ex?ex.regels.map(r=>({...r})):opts.regels||[{omschrijving:soort==="offerte"?((k0&&k0.dienst)||"Glasbewassing")+", per beurt":((k0&&k0.dienst)||"Glasbewassing"),aantal:1,prijs:k0?Number(k0.prijs)||0:""}];
  const ks=[...state.klanten].sort((a,b)=>cleanName(a.naam).localeCompare(cleanName(b.naam)));
  const totHtml=()=>{const t=totals({regels:lines,btw:Number($("#ff-btw").value),incl:$("#ff-incl").checked});return `<span>Subtotaal excl. btw</span><span>${eur(t.ex)}</span><span>Btw ${$("#ff-btw").value}%</span><span>${eur(t.btw)}</span><span class="grand">Totaal</span><span class="grand">${eur(t.inc)}</span>`};
  const draw=()=>{$("#ffLines").innerHTML=lines.map((r,i)=>`<div class="line"><input data-l="${i}" data-k="omschrijving" value="${esc(r.omschrijving)}" placeholder="Omschrijving" aria-label="Omschrijving"><input data-l="${i}" data-k="aantal" type="number" min="0" step="1" value="${esc(r.aantal)}" aria-label="Aantal"><input data-l="${i}" data-k="prijs" type="number" step="0.01" value="${esc(r.prijs)}" placeholder="Prijs" aria-label="Prijs"><button type="button" class="small ghost" data-rm="${i}" aria-label="Regel verwijderen">${I.x}</button></div>`).join("");$("#ffTot").innerHTML=totHtml()};
  openDlg(`<div class="dlg-head"><span class="objic big">${soort==="offerte"?I.offertes:I.facturen}</span><div style="flex:1"><h3>${ex?"Bewerk "+esc(ex.nummer):soort==="offerte"?"Nieuwe offerte":"Nieuwe factuur"}</h3></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="grid2">
    <label class="full">Klant<select id="ff-klant" required><option value="">Kies een klant…</option>${ks.map(k=>`<option value="${esc(k.id)}" ${k0&&k0.id===k.id?"selected":""}>${esc(cleanName(k.naam))} — ${esc(k.adres)}</option>`).join("")}</select></label>
    <label>Datum<input type="date" id="ff-datum" value="${d}"></label>
    <label>${soort==="offerte"?"Geldig tot":"Vervaldatum"}<input type="date" id="ff-verval" value="${ex?ex.verval:iso(addDays(today(),soort==="offerte"?30:Number(k0&&k0.termijn)||Number(st.termijn)||14))}"></label>
    <label>Btw-tarief<select id="ff-btw">${[21,9,0].map(v=>`<option value="${v}" ${Number(ex?ex.btw:st.btw)===v?"selected":""}>${v}%</option>`).join("")}</select></label>
    <label class="check-row" style="align-self:end"><input type="checkbox" id="ff-incl" ${(ex?ex.incl:st.incl)?"checked":""}>Prijzen zijn incl. btw</label>
  </div>
  <div><span class="eyebrow">Regels</span><div class="lines" id="ffLines" style="margin-top:8px"></div><button type="button" class="small" id="ffAdd" style="margin-top:8px">${I.plus}Regel</button></div>
  <div class="totals" id="ffTot"></div>
  <label>Opmerking<textarea id="ff-notitie" style="min-height:56px">${esc(ex?ex.notitie:"")}</textarea></label>
  <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button>${soort==="factuur"&&!ex?`<button type="button" id="ffConcept">Bewaar als concept</button>`:""}<button type="submit" class="primary" id="ffSave">${ex?"Opslaan":soort==="offerte"?"Offerte aanmaken":"Factuur aanmaken"}</button></div>`,{wide:true});
  draw();
  $("#ffLines").addEventListener("input",e=>{const i=e.target.dataset.l;if(i==null)return;lines[i][e.target.dataset.k]=e.target.dataset.k==="omschrijving"?e.target.value:e.target.value===""?"":Number(e.target.value);$("#ffTot").innerHTML=totHtml()});
  $("#ffLines").addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(b&&lines.length>1){lines.splice(Number(b.dataset.rm),1);draw()}});
  $("#ffAdd").onclick=()=>{lines.push({omschrijving:"",aantal:1,prijs:""});draw()};
  $("#ff-btw").onchange=draw;$("#ff-incl").onchange=draw;
  $("#ff-klant").onchange=e=>{const k=state.klanten.find(x=>x.id===e.target.value);if(k&&lines.length===1&&!lines[0].prijs){lines[0].prijs=Number(k.prijs)||0;draw()}};
  const doSave=async status=>{
    const kid=$("#ff-klant").value;if(!kid){$("#ff-klant").focus();return}
    const k=state.klanten.find(x=>x.id===kid);const datum=$("#ff-datum").value||iso(today());
    const data={soort,nummer:ex?ex.nummer:nextNr(soort,datum),klantId:kid,klantNaam:k.naam,klantAdres:soort==="offerte"?jobAddr(k):factAddr(k),klantEmail:mailK(k,soort==="offerte"?"offerte":"factuur").email||"",datum,verval:$("#ff-verval").value,
      regels:lines.filter(r=>r.omschrijving||r.prijs).map(r=>({omschrijving:String(r.omschrijving||""),aantal:Number(r.aantal)||0,prijs:Number(r.prijs)||0})),
      btw:Number($("#ff-btw").value),incl:$("#ff-incl").checked,status:ex?ex.status:status,notitie:$("#ff-notitie").value.trim(),betaaldOp:ex?ex.betaaldOp||"":"",vanOfferte:ex?ex.vanOfferte||"":opts.vanOfferte||"",gemaakt:ex?ex.gemaakt||"":new Date().toISOString(),
      verstuurdOp:ex?ex.verstuurdOp||"":"",herinnerdOp:ex?ex.herinnerdOp||"":"",herinneringen:ex?ex.herinneringen||0:0};
    if(!data.regels.length){toast("Voeg minimaal één regel toe");return}
    const id=ex?ex.id:newId("f");$("#ffSave").disabled=true;
    try{await save("facturen",id,data);if(opts.vanOfferte){const o=state.facturen.find(x=>x.id===opts.vanOfferte);if(o)await save("facturen",o.id,{...strip(o),status:"geaccepteerd"})}
      toast(ex?"Opgeslagen":data.nummer+" aangemaakt");setTimeout(()=>openFactuur(id),60)}
    catch(e){$("#ffSave").disabled=false;err(e)}
  };
  form.onsubmit=e=>{e.preventDefault();doSave(soort==="offerte"?"concept":"open")};
  const c=$("#ffConcept");if(c)c.onclick=()=>doSave("concept");
}
function newPdf(){const J=window.jspdf&&window.jspdf.jsPDF;if(!J){toast("De PDF-module is niet geladen. Vernieuw de pagina.");return null}return new J({unit:"mm",format:"a4"})}
const E=n=>"EUR "+(Number(n)||0).toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2});
const hexRgb=h=>{const m=String(h||"").match(/^#?([0-9a-f]{6})$/i);if(!m)return[19,122,138];const n=parseInt(m[1],16);return[n>>16&255,n>>8&255,n&255]};
async function loadLogo(){
  const id=S().logo;if(!id)return null;
  try{const r=await fetch(BLOB+id);if(!r.ok)return null;const b=await r.blob();if(!/png|jpe?g/.test(b.type))return null;
    const url=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b)});
    const im=await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=url});if(!im)return null;
    return{url,fmt:/png/.test(b.type)?"PNG":"JPEG",ratio:im.width/im.height}}catch(e){return null}
}
function pdfHeader(doc,title,logo){// voor rapporten
  const st=S(),L=20,R=190;let ty=24;
  if(logo){const h=16,w=Math.min(50,h*logo.ratio);try{doc.addImage(logo.url,logo.fmt,L,10,w,w/logo.ratio);ty=34}catch(e){}}
  doc.setTextColor(15,31,38);doc.setFont("helvetica","bold");doc.setFontSize(logo?13:18);doc.text(st.naam||"Je bedrijfsnaam",L,ty);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(93,111,118);
  [st.adres,[st.postcode,st.plaats].filter(Boolean).join(" "),st.telefoon,st.email,st.kvk&&"KvK "+st.kvk,st.btwnr&&"Btw "+st.btwnr,st.iban&&"IBAN "+st.iban].filter(Boolean).forEach((l,i)=>doc.text(String(l),R,20+i*4.5,{align:"right"}));
  doc.setDrawColor(...hexRgb(st.hoofdkleur));doc.setLineWidth(.8);doc.line(L,54,R,54);
  doc.setTextColor(15,31,38);doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text(title,L,68);doc.setFont("helvetica","normal");doc.setFontSize(10);
}
async function pdfRapport(jaar,per){
  const doc=newPdf();if(!doc)return;const rg=periodRange(jaar,per),F=fin(rg),L=20,R=190;
  const lbl=per==="jaar"?String(jaar):per[0]==="q"?"Q"+per[1]+" "+jaar:monthName(jaar,Number(per.slice(1)));
  pdfHeader(doc,"Rapport "+lbl,await loadLogo());
  let y=80;[["Omzet excl. btw",F.omzet],["Btw over omzet",F.btwOmzet],["Omzet incl. btw",F.omzet+F.btwOmzet]].forEach(([a,b])=>{doc.setTextColor(93,111,118);doc.text(a,L,y);doc.setTextColor(15,31,38);doc.text(E(b),R,y,{align:"right"});y+=7});
  y+=6;doc.setFont("helvetica","bold");doc.text("Facturen ("+F.fs.length+")",L,y);doc.setFont("helvetica","normal");y+=7;
  F.fs.sort((a,b)=>String(a.datum).localeCompare(String(b.datum))).forEach(f=>{if(y>275){doc.addPage();y=24}const t=totals(f);doc.text([f.nummer,fmtD(f.datum),cleanName(f.klantNaam).slice(0,34)].join("   "),L,y);doc.text(E(t.inc),R,y,{align:"right"});y+=5.5});
  saveFile("mijnschoonmaker rapport "+lbl+".pdf",doc.output("arraybuffer"),"Rapport opgeslagen");
}

/* ---------- KOSTEN / BON ---------- */
function openKost(id){
  const c=state.kosten.find(x=>x.id===id)||{datum:iso(today()),leverancier:"",omschrijving:"",categorie:"Materiaal",bedrag:"",btw:21,bon:""};
  const isNew=!c.id;let bon=c.bon||"";
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:linear-gradient(135deg,var(--ok),#1d6b4a)">${I.receipt}</span><div style="flex:1"><h3>${isNew?"Bon toevoegen":"Bon bewerken"}</h3><div class="subt">Uitgave voor je boekhouding en btw</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  ${state.assets?`<div><span class="eyebrow">Foto van de bon</span><div style="display:flex;gap:12px;align-items:center;margin-top:8px;flex-wrap:wrap"><div id="bonPrev">${bon?`<img src="${BLOB}${esc(bon)}" alt="Bon" style="max-height:120px;border-radius:10px;border:1px solid var(--line)">`:""}</div>
    <label class="btn small" style="flex-direction:row;color:var(--ink)">${I.camera}${bon?"Andere foto":"Foto maken of kiezen"}<input type="file" id="bonFile" accept="image/*,application/pdf" capture="environment" hidden></label><span class="subt" id="bonSt"></span></div></div>`:`<p class="subt" style="margin:0">Foto's opslaan kan alleen als jij de eigenaar van deze pagina bent.</p>`}
  <div class="grid2">
    <label>Datum<input type="date" id="c-datum" value="${esc(c.datum)}"></label>
    <label>Bedrag incl. btw (€)<input type="number" step="0.01" min="0" inputmode="decimal" id="c-bedrag" value="${esc(c.bedrag)}" required></label>
    <label>Leverancier<input id="c-leverancier" value="${esc(c.leverancier)}" placeholder="Bijv. Shell, Praxis, Unger"></label>
    <label>Btw<select id="c-btw">${[21,9,0].map(v=>`<option value="${v}" ${Number(c.btw)===v?"selected":""}>${v}%</option>`).join("")}</select></label>
    <label>Categorie<select id="c-categorie">${KOSTCAT.map(v=>`<option ${c.categorie===v?"selected":""}>${v}</option>`).join("")}</select></label>
    <label>Omschrijving<input id="c-omschrijving" value="${esc(c.omschrijving)}" placeholder="Bijv. diesel bus"></label>
  </div>
  <div class="row">${isNew?"":`<button type="button" class="ghost danger" id="delC">Verwijderen</button>`}<span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="submit" class="primary" id="cSave">Opslaan</button></div>`);
  const bf=$("#bonFile");
  if(bf)bf.onchange=async e=>{const file=e.target.files[0];if(!file)return;$("#bonSt").textContent="Uploaden…";
    try{const r=await state.assets.upload(file);bon=r.id;$("#bonPrev").innerHTML=r.contentType==="application/pdf"?`<span class="pill neutral">${I.note}PDF bewaard</span>`:`<img src="${esc(r.url)}" alt="Bon" style="max-height:120px;border-radius:10px;border:1px solid var(--line)">`;$("#bonSt").textContent=""}
    catch(er){$("#bonSt").textContent="Uploaden lukte niet ("+(er.code||"fout")+")"}};
  form.onsubmit=async e=>{e.preventDefault();const g=n=>$("#c-"+n).value;
    const data={datum:g("datum")||iso(today()),bedrag:Number(g("bedrag"))||0,leverancier:g("leverancier").trim(),btw:Number(g("btw")),categorie:g("categorie"),omschrijving:g("omschrijving").trim(),bon,aangemaakt:c.aangemaakt||new Date().toISOString()};
    if(!data.bedrag){$("#c-bedrag").focus();return}
    $("#cSave").disabled=true;try{await save("kosten",c.id||newId("c"),data);dlg.close();toast("Bon opgeslagen · "+eur(data.bedrag))}catch(er){$("#cSave").disabled=false;err(er)}};
  const d=$("#delC");if(d){let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}try{await del("kosten",c.id);dlg.close();toast("Bon verwijderd")}catch(er){err(er)}}}
}

/* ---------- COMMUNICATIE ---------- */
function sendHref(kanaal,k,text,onderwerp){
  if(kanaal==="whatsapp")return waLink(k.telefoon,text);
  if(kanaal==="sms"){const d=String(k.telefoon||"").replace(/[^\d+]/g,"");return d?"sms:"+d+"?&body="+encodeURIComponent(text):""}
  if(kanaal==="email")return k.email?"mailto:"+encodeURIComponent(k.email)+"?subject="+encodeURIComponent(onderwerp||"Glasbewassing")+"&body="+encodeURIComponent(text):"";
  return"";
}
let compose=null;
function openCompose({title,recipients,sjabloon="vrij",hint="",tekst,mail,onderwerp,kanaal,groep}){
  const T=tpls();
  const TT=T[sjabloon]||T.vrij;compose={title,recipients,sjabloon,tekst:tekst??TT.sms??TT.tekst,mail:mail||TT.mail||"",kanaal:kanaal||"",onderwerp:onderwerp||TT.onderwerp||"Bericht van [name.company]",sent:{},hint,groep:!!groep};
  drawCompose();
}
function drawCompose(){
  const c=compose,T=tpls();
  openDlg(`<div class="dlg-head"><span class="objic big">${I.send}</span><div style="min-width:0;flex:1"><h3>${esc(c.title)}</h3><div class="subt">${plural(c.recipients.length,"ontvanger","ontvangers")}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="chips" style="margin:0">${Object.keys(T).filter(k=>(c.groep?GROEP_TPL.includes(k):T[k].actief!==false)||k===c.sjabloon).map(k=>`<button type="button" class="chip" data-tplpick="${esc(k)}" aria-pressed="${c.sjabloon===k}">${esc(T[k].naam)}</button>`).join("")}</div>
  <label>${c.mail?"WhatsApp- en sms-tekst":"Bericht"} — woorden tussen {accolades} worden per klant ingevuld<textarea id="cmpTxt" style="min-height:${c.mail?80:110}px">${esc(c.tekst)}</textarea></label>
  <label>E-mail onderwerp<input id="cmpSubj" value="${esc(c.onderwerp)}"></label>
  ${c.mail?`<label>E-mail bericht<textarea id="cmpMail" style="min-height:140px">${esc(c.mail)}</textarea></label>`:""}
  ${c.hint?`<div class="notice" style="margin:0">${c.hint}</div>`:""}
  <p class="subt" style="margin:0">${liveMail()?"<b>Versturen</b> stuurt de mail in je huisstijl direct naar de klant, met PDF als die er is. WhatsApp en sms openen met het bericht al ingevuld. Alles komt in de berichtenlog, met de status van elke mail.":"Een knop opent WhatsApp, je sms-app of je mailprogramma met het bericht al ingevuld. <b>Opgemaakt</b> kopieert de mail in je huisstijl en opent een lege mail, waarin je hem plakt. Op versturen druk je zelf. Alles komt in de berichtenlog."}</p>
  <div class="rcp-list" id="cmpList"></div>
  <div class="row">${liveMail()&&c.recipients.filter(r=>r.k.email).length>1?`<button type="button" class="small primary" id="cmpAll">${I.send}Mail naar alle ${c.recipients.filter(r=>r.k.email).length}</button>`:""}${c.recipients.length>1?`<button type="button" class="small" id="cmpNums">${I.copy}Kopieer alle nummers</button><button type="button" class="small" id="cmpMails">${I.copy}Kopieer alle e-mailadressen</button>`:""}<span class="sp"></span><button type="button" data-act="close">Klaar</button></div>`,{wide:true});
  drawCmpList();
  $("#cmpTxt").oninput=e=>{c.tekst=e.target.value;drawCmpList()};
  $("#cmpSubj").oninput=e=>{c.onderwerp=e.target.value;drawCmpList()};
  const cm=$("#cmpMail");if(cm)cm.oninput=e=>{c.mail=e.target.value;drawCmpList()};
  form.querySelectorAll("[data-tplpick]").forEach(b=>b.onclick=()=>{c.sjabloon=b.dataset.tplpick;c.tekst=T[c.sjabloon].sms;c.mail=T[c.sjabloon].mail;c.onderwerp=T[c.sjabloon].onderwerp;drawCompose()});
  const ca=$("#cmpAll");if(ca)ca.onclick=verstuurAlles;
  const nb=$("#cmpNums");if(nb)nb.onclick=e=>copy(c.recipients.map(r=>r.k.telefoon).filter(Boolean).join(", "),e.currentTarget);
  const mb=$("#cmpMails");if(mb)mb.onclick=e=>copy(c.recipients.map(r=>r.k.email).filter(Boolean).join(", "),e.currentTarget);
}
function drawCmpList(){
  const c=compose;if(!c||c.stil||!document.getElementById("cmpList"))return;
  $("#cmpList").innerHTML=c.recipients.map((r,i)=>{const s=c.sent[i],st=r.stap;
    const txtFor=kan=>kan==="email"?fill(st?st.mail:(c.mail||c.tekst),r.vars):fill(st?st.sms:c.tekst,r.vars);
    const btn=(kan,lbl)=>{const h=sendHref(kan,r.k,txtFor(kan),fill(st?st.onderwerp:c.onderwerp,r.vars));return h?`<a class="btn small${s===kan?" primary":c.kanaal===kan&&!s?" yellow":""}" href="${esc(h)}" target="_blank" rel="noopener" data-act="send" data-i="${i}" data-k="${kan}">${lbl}</a>`:""};
    const order=[["whatsapp","WhatsApp"],["sms","SMS"],["email","E-mail"]].sort((a,b)=>(b[0]===c.kanaal)-(a[0]===c.kanaal));
    const chips=order.map(([k,l])=>btn(k,l)).join("");
    const hoofd=r.k.email?(liveMail()?`<button type="button" class="small${s==="live"?" good":" primary"} rcp-go" data-act="copyhtml" data-i="${i}" title="Opgemaakte mail direct versturen" ${s==="live"?"disabled":""}>${s==="live"?I.check+"Mail verstuurd":I.send+"Mail versturen"}</button>`:`<button type="button" class="small${s==="kopie"?" good":" primary"} rcp-go" data-act="copyhtml" data-i="${i}" title="Opgemaakte mail kopiëren en je mailprogramma openen">${I.copy}Opgemaakte mail</button>`):"";
    return `<div class="rcp${s?" klaar":""}"><div class="rcp-k"><span class="av" style="--h:${hue(r.k.ronde||r.k.naam||"")}">${esc(initials(r.k.naam||"?"))}</span><div class="rcp-n"><b>${esc(cleanName(r.k.naam))}</b>${r.k.telefoon?`<small>${I.phone}${esc(r.k.telefoon)}</small>`:""}${r.k.email?`<small>${I.mail}${esc(r.k.email)}</small>`:""}${st?`<small class="rcp-st">${esc(st.naam)}</small>`:""}</div>${s?`<span class="pill ok dotp">${s==="live"?"Verstuurd":"Via "+esc(KANAAL[s]||s)}</span>`:""}<button type="button" class="small ghost rcp-cp" data-act="copymsg" data-i="${i}" aria-label="Kopieer bericht" title="Kopieer bericht">${I.copy}</button></div>
      ${chips||hoofd?`${hoofd}<div class="rcp-a"><span class="rcp-l">${hoofd?"Of open in":"Open in"}</span>${chips}</div>`:'<span class="pill neutral">Geen nummer of e-mailadres</span>'}</div>`}).join("");
}
async function logSend(i,kanaal){
  const c=compose,r=c&&c.recipients[i];if(!r)return;
  const st=r.stap,txt=kanaal==="email"?fill(st?st.mail:(c.mail||c.tekst),r.vars):fill(st?st.sms:c.tekst,r.vars);c.sent[i]=kanaal;
  try{await save("berichten",newId("m"),{klantId:r.k.id||"",klantNaam:r.k.naam,naar:kanaal==="email"?r.k.email||"":r.k.telefoon||"",kanaal,sjabloon:c.sjabloon,onderwerp:kanaal==="email"?fill(st?st.onderwerp:c.onderwerp,r.vars):"",tekst:txt,op:new Date().toISOString(),ref:r.ref||""});
    if(r.onSent)await r.onSent()}catch(e){err(e)}
  drawCmpList();
}
function sendF(id,o={}){
  const f=state.facturen.find(x=>x.id===id);if(!f)return;const off=f.soort==="offerte",late=!off&&(o.herinnering||o.wik||fStatus(f)[1]==="Achterstallig");
  const _k=state.klanten.find(x=>x.id===f.klantId),_mail=_k?mailK(_k,off?"offerte":"factuur").email:f.klantEmail;
  /* direct versturen: zonder tussenscherm de opgemaakte mail met PDF naar de klant */
  if(o.direct&&typeof liveMail==="function"&&liveMail()&&_mail){const T=tpls(),sj=o.wik?"wik":late?"aanmaning":off?"offerte":"factuur",TT=T[sj]||T.vrij,b=o.btn;
    const ok=()=>{if(b){b.disabled=false;b.innerHTML=I.check+"Verstuurd"}};
    if(b){b.disabled=true;b.innerHTML=I.clock+"Versturen…"}
    compose={title:"",sjabloon:sj,tekst:TT.sms??TT.tekst,mail:TT.mail||"",onderwerp:TT.onderwerp||"Bericht van [name.company]",sent:{},hint:"",groep:false,stil:true,recipients:[{k:_k?mailK(_k,off?"offerte":"factuur"):{naam:f.klantNaam,email:f.klantEmail},vars:(()=>{const v=factVars(f),t=tavK(_k,off?"offerte":"factuur");if(t)v.klant=t;return v})(),ref:(late?"aanmaning:":"factuur:")+f.id,
      onSent:()=>save("facturen",f.id,late?{...strip(f),herinnerdOp:iso(today()),herinneringen:(Number(f.herinneringen)||0)+1,...(o.wik?{wikOp:iso(today())}:{})}:{...strip(f),verstuurdOp:f.verstuurdOp||iso(today()),status:off&&(f.status||"concept")==="concept"?"verstuurd":f.status})}]};
    verstuurLive(0).then(()=>{if(compose&&compose.sent[0]==="live")ok();else if(b){b.disabled=false;b.innerHTML=I.send+"Opnieuw proberen"}});return}
  openCompose({title:(o.wik?"WIK-brief ":off?"Offerte ":late?"Herinnering ":"Factuur ")+f.nummer,sjabloon:o.wik?"wik":late?"aanmaning":off?"offerte":"factuur",hint:esc("Wil je de PDF meesturen? Download hem eerst bij de factuur en voeg hem in je mail toe."),
    recipients:[{k:(()=>{const kk=state.klanten.find(x=>x.id===f.klantId);return kk?mailK(kk,off?"offerte":"factuur"):{naam:f.klantNaam,email:f.klantEmail}})(),vars:(()=>{const v=factVars(f),kk=state.klanten.find(x=>x.id===f.klantId),t=tavK(kk,off?"offerte":"factuur");if(t)v.klant=t;return v})(),ref:(late?"aanmaning:":"factuur:")+f.id,
      onSent:()=>save("facturen",f.id,late?{...strip(f),herinnerdOp:iso(today()),herinneringen:(Number(f.herinneringen)||0)+1,...(o.wik?{wikOp:iso(today())}:{})}:{...strip(f),verstuurdOp:f.verstuurdOp||iso(today()),status:off&&(f.status||"concept")==="concept"?"verstuurd":f.status})}]});
}
function openBulk(group,tpl){
  const t=today();let ks=[],title="Groepsbericht",datum=null;
  if(group==="route"){datum=parse(state.routeDay||iso(t));ks=routeStops(iso(datum)).filter(s=>!s.done).map(s=>s.k);title="Klanten van "+longD(datum)}
  else if(group==="alle"){ks=actief();title="Alle actieve klanten"}
  else if(group==="vandaag"||group==="morgen"){datum=group==="vandaag"?t:addDays(t,1);ks=routeStops(iso(datum)).filter(s=>!s.done).map(s=>s.k);title="Route "+group}
  else if(group&&group.startsWith("nb:")){const g=group.slice(3);ks=actief().filter(k=>k.nieuwsbrief!==false&&(k.nbGroep||"Standaard")===g);title="Nieuwsbrief · "+g}
  else if(group&&group.startsWith("r:")){const r=group.slice(2);ks=actief().filter(k=>k.ronde===r);title=r}
  else if(Array.isArray(group)){ks=group;title=plural(ks.length,"klant","klanten")}
  if(!ks.length){toast("Geen klanten in deze groep");return}
  openCompose({title,sjabloon:tpl||"afspraak",recipients:ks.map(k=>({k,vars:klantVars(k,datum),ref:tpl==="welkom"?"welkom:"+k.id:""}))});
}
/* groepsbericht: eerst kiezen welk soort bericht */
const GROEP_TPL=["kerst","nieuwsbrief","zomer","uitloop","update","prijs","weer","vrij"];
const GROEP_KL={kerst:"#b4413a",nieuwsbrief:"#4a78b8",zomer:"#d08a2e",uitloop:"#8a6bb0",update:"#2f7f88",prijs:"#5d6f76",weer:"#3a8fc0",vrij:"#6b7a80"};
function openGroepKeuze(ks){if(!ks.length){toast("Selecteer eerst klanten");return}const T=tpls(),keys=GROEP_TPL.filter(k=>T[k]),ic={kerst:I.spark,nieuwsbrief:I.megaphone,zomer:I.sun||I.spark,uitloop:I.clock,update:I.note,prijs:I.trend||I.note,weer:I.cal2,vrij:I.pencil};
  openDlg(`<div class="dlg-head"><span class="objic big">${I.send}</span><div style="flex:1"><h3>Bericht aan ${plural(ks.length,"klant","klanten")}</h3><div class="subt">Kies een bericht. Je kunt de tekst daarna nog aanpassen.</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="gk-grid">${keys.map(k=>`<button type="button" class="gk-c" data-gk="${esc(k)}"><span class="objic gl" style="--g:${GROEP_KL[k]||"#6b7a80"}">${ic[k]||I.mail}</span><span><b>${esc(T[k].naam)}</b><small>${esc(T[k].doel||"")}</small></span>${I.right}</button>`).join("")}</div>
    <p class="subt" style="margin:0">Teksten aanpassen voor de volgende keer doe je bij Communicatie › Templates.</p>`,{wide:true});
  form.querySelectorAll("[data-gk]").forEach(b=>b.onclick=()=>{const k=b.dataset.gk;openCompose({title:T[k].naam+" · "+plural(ks.length,"klant","klanten"),sjabloon:k,groep:true,recipients:ks.map(x=>({k:x,vars:klantVars(x),ref:""}))})})}
async function verstuurAlles(){const c=compose;if(!c)return;const b=$("#cmpAll");const todo=c.recipients.map((r,i)=>i).filter(i=>c.recipients[i].k.email&&c.sent[i]!=="live");
  if(!todo.length){toast("Alle mails zijn al verstuurd");return}
  if(!(await vraag("Alles versturen?",`De mail gaat naar <b>${todo.length}</b> ${todo.length===1?"klant":"klanten"} met een e-mailadres. Klanten zonder e-mailadres sla je over; die kun je via WhatsApp of sms bereiken.`,"Versturen","Annuleren")))return;
  let n=0;for(const i of todo){if(b){b.disabled=true;b.innerHTML=`${I.clock}Bezig… ${n}/${todo.length}`}await verstuurLive(i);n++}
  toast(plural(n,"mail","mails")+" verstuurd");const b2=$("#cmpAll");if(b2){b2.disabled=false;b2.innerHTML=I.check+"Verstuurd"}}
function openPickRecipients(){
  const ks=[...actief()].sort((a,b)=>cleanName(a.naam).localeCompare(cleanName(b.naam)));const sel=new Set();
  openDlg(`<div class="dlg-head"><span class="objic big">${I.send}</span><div style="flex:1"><h3>Verstuur bericht</h3><div class="subt">Kies een of meer klanten</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="search">${I.search}<input id="prq" placeholder="Zoek klant"></div>
  <div class="list" id="prl" style="gap:6px;max-height:50vh;overflow:auto"></div>
  <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="button" class="primary" id="prGo" disabled>Volgende</button></div>`);
  const draw=()=>{const q=$("#prq").value.toLowerCase();$("#prl").innerHTML=ks.filter(k=>!q||[k.naam,k.adres,k.plaats].join(" ").toLowerCase().includes(q)).map(k=>`<label class="check-row"><input type="checkbox" data-pk="${esc(k.id)}" ${sel.has(k.id)?"checked":""}><span style="flex:1"><b>${esc(cleanName(k.naam))}</b><br><small style="color:var(--muted)">${esc(fullAddr(k))}</small></span></label>`).join("");
    $("#prGo").disabled=!sel.size;$("#prGo").textContent=sel.size?"Volgende ("+sel.size+")":"Volgende"};
  draw();$("#prq").oninput=draw;
  $("#prl").onchange=e=>{const id=e.target.dataset.pk;if(!id)return;e.target.checked?sel.add(id):sel.delete(id);$("#prGo").disabled=!sel.size;$("#prGo").textContent=sel.size?"Volgende ("+sel.size+")":"Volgende"};
  $("#prGo").onclick=()=>openGroepKeuze(ks.filter(k=>sel.has(k.id)));
}

/* ---------- PLANNING-DIALOGEN ---------- */
function openDayNote(d){
  const r=state.routes[d]||{};
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:linear-gradient(135deg,var(--accent),#c58f12)">${I.note}</span><div style="flex:1"><h3>Notitie</h3><div class="subt">${esc(longD(parse(d)))}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <textarea id="dn-txt" style="min-height:120px" placeholder="Bijv. ladder ophalen, bus naar garage om 16:00">${esc(r.notitie||"")}</textarea>
  <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="submit" class="primary" id="dnSave">Opslaan</button></div>`);
  form.onsubmit=async e=>{e.preventDefault();$("#dnSave").disabled=true;try{await save("routes",d,{...strip(r),notitie:$("#dn-txt").value.trim()});dlg.close();toast("Notitie opgeslagen")}catch(er){$("#dnSave").disabled=false;err(er)}};
}
function openBulkDay(d){
  const js=actief().filter(k=>k.gepland===d);
  openDlg(`<div class="dlg-head"><span class="objic big">${I.cal2}</span><div style="flex:1"><h3>Bulk dag</h3><div class="subt">${plural(js.length,"job","jobs")} op ${esc(longD(parse(d)))}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="grid2"><label>Verplaats alle jobs naar<input type="date" id="bd-naar" value="${iso(addDays(parse(d),1))}"></label><label class="check-row" style="align-self:end"><input type="checkbox" id="bd-tijd" checked>Tijden behouden</label></div>
  <p class="subt" style="margin:0">Handig bij slecht weer of ziekte. Wil je klanten laten weten dat je later komt? Stuur daarna een groepsbericht vanuit Route of Communicatie.</p>
  <div class="row"><button type="button" class="ghost danger" id="bdUn">Alles terug naar te plannen</button><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="submit" class="primary" id="bdGo" ${js.length?"":"disabled"}>Verplaatsen</button></div>`);
  form.onsubmit=async e=>{e.preventDefault();const naar=$("#bd-naar").value;if(!naar)return;const keep=$("#bd-tijd").checked;$("#bdGo").disabled=true;
    await runSeq(js,k=>save("klanten",k.id,{...strip(k),gepland:naar,tijd:keep?k.tijd||"":""}),"");dlg.close();toast(plural(js.length,"job","jobs")+" verplaatst naar "+fmtD(naar),[{label:"Klanten berichten",fn:()=>openCompose({title:"Afspraak gewijzigd naar "+longD(parse(naar)),sjabloon:"wijzigen",recipients:js.map(k=>({k,vars:klantVars({...k,gepland:naar,tijd:keep?k.tijd:""},parse(naar)),ref:""}))})}])};
  $("#bdUn").onclick=async()=>{await runSeq(js,k=>save("klanten",k.id,{...strip(k),gepland:"",tijd:""}),"Jobs terug naar te plannen");dlg.close()};
}
function openNewJob(d){
  const ks=[...actief()].sort((a,b)=>cleanName(a.naam).localeCompare(cleanName(b.naam)));
  openDlg(`<div class="dlg-head"><span class="objic big">${I.plus}</span><div style="flex:1"><h3>Nieuwe job</h3><div class="subt">Plan een klant in op een dag en tijd</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="grid2"><label class="full">Klant<select id="nj-k" required><option value="">Kies een klant…</option>${ks.map(k=>`<option value="${esc(k.id)}">${esc(cleanName(k.naam))} — ${esc(k.adres)}</option>`).join("")}</select></label>
  <label>Datum<input type="date" id="nj-d" value="${d}"></label><label>Tijd<input type="time" step="900" id="nj-t" value="${nextFree(d)}"></label>
  <label>Dienst<input id="nj-s" list="dienstlijst2" value="Glasbewassing"><datalist id="dienstlijst2">${[...dienstLijst().map(d=>d.naam),...DIENSTEN].filter((v,i,a)=>a.indexOf(v)===i).map(x=>`<option value="${esc(x)}">`).join("")}</datalist></label><label>Prijs (€)<input id="nj-p" type="number" step="0.5"></label></div>
  <p class="subt" style="margin:0">Nieuwe klant? <button type="button" class="small ghost" data-act="klant" style="padding:0;color:var(--brand)">Maak eerst een klant aan</button></p>
  <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="submit" class="primary" id="njGo">Inplannen</button></div>`);
  $("#nj-k").onchange=e=>{const k=state.klanten.find(x=>x.id===e.target.value);if(k){$("#nj-s").value=k.dienst||"Glasbewassing";$("#nj-p").value=k.prijs||""}};
  form.onsubmit=async e=>{e.preventDefault();const k=state.klanten.find(x=>x.id===$("#nj-k").value);if(!k){$("#nj-k").focus();return}$("#njGo").disabled=true;
    try{await save("klanten",k.id,{...strip(k),gepland:$("#nj-d").value,tijd:$("#nj-t").value,dienst:$("#nj-s").value.trim()||k.dienst||"Glasbewassing",prijs:$("#nj-p").value===""?k.prijs:Number($("#nj-p").value)});dlg.close();toast(cleanName(k.naam)+" ingepland")}catch(er){$("#njGo").disabled=false;err(er)}};
}
function openOfferSheet(){
  const day=curDay();let offer=teplannen(offerUpTo(parse(day)>addDays(state.week,6)?parse(day):addDays(state.week,6)));if(state.achter)offer=offer.filter(k=>dueOf(k)<today());offer=offerFilter(offer);const y=dlg.open?dlg.scrollTop:0;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.inbox}</span><div style="min-width:0;flex:1"><h3>${offer.length} te plannen</h3><div class="subt">Plannen op ${esc(longD(parse(day)))}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="sheet-adv">${advHtml(offer,day)}</div>
  ${offer.length?`<div class="list">${offerCards(offer,parse(day)<today()?"":day,true)}</div>`:empty("Alles ingepland","Er is niemand meer aan de beurt in deze week.")}`);
  form.dataset.sheet="offer";dlg.scrollTop=y;
}
function openMeer(){
  const items=[["facturen","Facturen maken, versturen en opvolgen"],["communicatie","WhatsApp, sms en e-mail"],["offertes","Offertes maken en opvolgen"],["uitvoering","Diensten, frequenties en middelen"],["inzichten","Hoe gaat het met je business?"],["instellingen","Bedrijf, btw en herinneringen"],["handleiding","Uitleg per onderdeel"]];
  openDlg(`<div class="dlg-head"><h3 style="flex:1">Meer</h3><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="list" style="gap:6px">${items.map(([t,d])=>`<button type="button" class="objrow" data-act="tab" data-tab="${t}"><span class="objic">${I[t]}</span><span class="objtx"><b>${PAGES.find(p=>p[0]===t)[1]}</b><small>${esc(d)}</small></span>${I.right.replace("<svg",'<svg class="chev"')}</button>`).join("")}</div>`);
}

/* offerte akkoord → opdracht: klant actief, prijs en frequentie overnemen, eerste beurt inplannen */
function openAkkoord(id){
  const f=state.facturen.find(x=>x.id===id);if(!f)return;const k=state.klanten.find(x=>x.id===f.klantId);
  if(!k){toast("De klant van deze offerte bestaat niet meer");return}
  const o=f.opdracht||{},t=totals(f),prijs=o.prijs??(S().incl?t.inc:t.ex),fr=Number(o.frequentie||k.frequentie||4),du=Number(o.duur||k.duur||30);
  let d=addDays(today(),7);for(let i=0;i<14&&!isWerkdag(d);i++)d=addDays(d,1);
  const fo=freqOpts(fr);
  const dur=[15,30,45,60,90,120,180,240];if(!dur.includes(du))dur.push(du);dur.sort((a,b)=>a-b);
  openDlg(`<div class="dlg-head"><span class="objic big">${I.check}</span><div style="min-width:0;flex:1"><h3>Akkoord op ${esc(f.nummer)}</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(fullAddr(k))}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <p class="subt" style="margin:0">De klant wordt een vaste klant met deze afspraken. Na elke afgemelde beurt komt de factuur bij Facturen.</p>
  <div class="grid2">
    <label>Prijs per beurt (€ ${S().incl?"incl.":"excl."} btw)<input id="ak-prijs" type="number" step="0.01" min="0" inputmode="decimal" value="${esc(prijs)}" required></label>
    <label>Frequentie<select id="ak-freq">${fo.map(w=>`<option value="${w}" ${w===fr?"selected":""}>Elke ${w} ${w===1?"week":"weken"}</option>`).join("")}</select></label>
    <label>Duur<select id="ak-duur">${dur.map(m=>`<option value="${m}" ${m===du?"selected":""}>${m<60?m+" min":(m/60).toLocaleString("nl-NL")+" uur"}</option>`).join("")}</select></label>
    <label>Dienst<input id="ak-dienst" value="${esc(k.dienst||"Glasbewassing")}"></label>
    <label>Aanboddatum<input id="ak-aanbod" type="date" value="${esc(f.start||iso(today()))}"><small class="help">Vanaf deze datum staat de klant bij Te plannen</small></label>
    <label>Eerste beurt <small style="font-weight:500">(leeg = via Te plannen)</small><input id="ak-dat" type="date" value="${k.gepland&&!k.prospect?esc(k.gepland):""}"></label>
    <label>Tijd <small style="font-weight:500">(leeg = eerste vrije tijd)</small><input id="ak-tijd" type="time" value="${esc(k.prospect?"":k.tijd||"")}"></label>
  </div>
  <label class="check-row"><input id="ak-ov" type="checkbox" checked>Akkoord op overeenkomst noteren in de klantkaart</label>
  <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="submit" class="primary" id="akGo">${I.check}Akkoord en inplannen</button></div>`);
  form.onsubmit=async e=>{e.preventDefault();const b=$("#akGo");b.disabled=true;
    const dat=$("#ak-dat").value,tijd=dat?($("#ak-tijd").value||nextFree(dat)):"",p=r2(Number($("#ak-prijs").value)||0);
    try{const cur=state.klanten.find(x=>x.id===k.id)||k;
      await save("klanten",k.id,{...strip(cur),...(o.extra&&o.extra.length?{opdrachten:[...(cur.opdrachten||[]).filter(x=>!x.groep||!o.extra.some(e=>e.groep===x.groep)),...o.extra]}:{}),prospect:false,opdrachtVerwijderd:false,...(f.facturatie?factModusPatch(f.facturatie,cur):{}),actief:true,akkoord:$("#ak-ov").checked||!!cur.akkoord,prijs:p,frequentie:Number($("#ak-freq").value),duur:Number($("#ak-duur").value),
        dienst:$("#ak-dienst").value.trim()||"Glasbewassing",gepland:dat,tijd,aanbodVanaf:$("#ak-aanbod").value||"",aanbieden:!dat&&!($("#ak-aanbod").value>iso(today())),opzegReden:"",log:[...(cur.log||[]),{datum:iso(today()),tekst:"Akkoord op offerte "+f.nummer+" · "+eur(p)+" per beurt, elke "+$("#ak-freq").value+" weken"+(dat?" · eerste beurt "+fmtD(parse(dat)):"")+($("#ak-aanbod").value?" · aanboddatum "+fmtD(parse($("#ak-aanbod").value)):"")}]});
      await save("facturen",f.id,{...strip(f),status:"geaccepteerd",akkoordOp:iso(today())});
      if(f.facturatie==="periodiek"&&!isPeriodiek(cur)){toast(cleanName(k.naam)+" is nu vaste klant · stel nu de periodieke factuur in");setTimeout(()=>openPeriodiek(k.id,"klant"),80);return}
      dlg.close();toast(cleanName(k.naam)+" is nu vaste klant"+(dat?" · ingepland op "+fmtD(parse(dat))+(tijd?" om "+tijd:""):" · staat bij Te plannen vanaf "+fmtD(parse($("#ak-aanbod").value||iso(today())))))}
    catch(er){b.disabled=false;err(er)}};
}

/* afspraak wijzigen vanuit de klantkaart */
function openAfspraak(id,day){
  const k=state.klanten.find(x=>x.id===id);if(!k)return;
  const isPlanned=!!k.gepland&&(!day||day===k.gepland),d0=day||k.gepland||iso(volgende(k)<today()?today():volgende(k));
  const durO=[15,30,45,60,90,120,180,240],du=Number(k.duur||30);if(!durO.includes(du))durO.push(du);durO.sort((a,b)=>a-b);
  const fr=Number(k.frequentie||4),freqO=freqOpts(fr);
  const back=()=>setTimeout(()=>openKlant(id),60);
  openDlg(`<div class="dlg-head"><span class="objic big">${I.planning}</span><div style="min-width:0;flex:1"><h3>${isPlanned?"Afspraak wijzigen":"Afspraak inplannen"}</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(jobAddr(k))}</div></div><button type="button" class="iconbtn" id="afX" aria-label="Terug">${I.x}</button></div>
  <div class="grid2">
    <label>Datum<input id="af-d" type="date" value="${esc(d0)}" required></label>
    <label>Tijd <small style="font-weight:500">(leeg = eerste vrije tijd)</small><input id="af-t" type="time" step="900" value="${esc(isPlanned?k.tijd||"":k.tijd||"")}"></label>
    <label>Dienst<input id="af-dienst" value="${esc(k.dienst||"Glasbewassing")}"></label>
    <label>Prijs per beurt (€ ${S().incl?"incl.":"excl."} btw)<input id="af-prijs" type="number" step="0.01" min="0" inputmode="decimal" value="${esc(k.prijs)}"></label>
    <label>Duur<select id="af-duur">${durO.map(m=>`<option value="${m}" ${m===du?"selected":""}>${m<60?m+" min":(m/60).toLocaleString("nl-NL")+" uur"}</option>`).join("")}</select></label>
    <label>Frequentie<select id="af-freq">${freqO.map(w=>`<option value="${w}" ${w===fr?"selected":""}>Elke ${w} ${w===1?"week":"weken"}</option>`).join("")}</select></label>
  </div>
  <p class="subt" style="margin:0">Prijs, duur, frequentie en notitie gelden voor alle volgende beurten van deze klant.</p>
  <div class="row">${isPlanned?`<button type="button" class="ghost danger" id="afUn">Terug naar te plannen</button>`:""}${isPlanned?`<button type="button" class="ghost" id="afJob">${I.eye}Open job</button>`:""}<span class="sp"></span><button type="button" id="afBack">Annuleren</button><button type="submit" class="primary" id="afGo">${I.check}${isPlanned?"Opslaan":"Inplannen"}</button></div>`);
  $("#afX").onclick=$("#afBack").onclick=()=>openKlant(id);
  const un=$("#afUn");if(un)un.onclick=async()=>{un.disabled=true;try{await save("klanten",k.id,{...strip(k),gepland:"",tijd:""});toast(cleanName(k.naam)+" terug naar te plannen");back()}catch(e){un.disabled=false;err(e)}};
  const jb=$("#afJob");if(jb)jb.onclick=()=>openJob(k.id,k.gepland);
  form.onsubmit=async e=>{e.preventDefault();const d=$("#af-d").value;if(!d){$("#af-d").focus();return}$("#afGo").disabled=true;
    const nd=parse(d),warn=!isWerkdag(nd)?" · let op: geen werkdag":"";
    try{await save("klanten",k.id,{...strip(k),gepland:d,tijd:$("#af-t").value||nextFree(d),aanbieden:false,dienst:$("#af-dienst").value.trim()||"Glasbewassing",prijs:r2(Number($("#af-prijs").value)||0),duur:Number($("#af-duur").value)||30,frequentie:Number($("#af-freq").value)||4});
      toast(cleanName(k.naam)+" ingepland op "+fmtD(d)+($("#af-t").value?" om "+$("#af-t").value:"")+warn);back()}
    catch(er){$("#afGo").disabled=false;err(er)}};
}

/* opdracht toevoegen of wijzigen vanuit de klantkaart */
function openOpdracht(kid,oid){
  const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const main=oid==="main",isNew=oid==="new",o=main?{dienst:k.dienst||"Glasbewassing",prijs:k.prijs,frequentie:k.frequentie||4,duur:k.duur||30}:(k.opdrachten||[]).find(x=>x.id===oid)||{dienst:"",prijs:"",frequentie:52,duur:30,volgende:"",actief:true};
  const freqO=freqOpts(Number(o.frequentie)||4),durO=[...new Set([15,30,45,60,90,120,180,240,Number(o.duur)||30])].sort((a,b)=>a-b);
  const fl=freqLabel;
  const back=()=>setTimeout(()=>openKlant(kid),60);
  openDlg(`<div class="dlg-head"><span class="objic big">${I.checksq||I.check}</span><div style="min-width:0;flex:1"><h3>${isNew?"Nieuwe opdracht":main?"Hoofdopdracht":"Opdracht wijzigen"}</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(jobAddr(k))}</div></div><button type="button" class="iconbtn" id="opX" aria-label="Terug">${I.x}</button></div>
  <div class="grid2">
    <label class="full">Dienst<input id="op-dienst" list="op-dl" value="${esc(o.dienst)}" required placeholder="Bijv. Dakgoten reinigen"><datalist id="op-dl">${[...dienstLijst().map(d=>d.naam),...DIENSTEN].filter((v,i,a)=>a.indexOf(v)===i).map(d=>`<option value="${esc(d)}">`).join("")}</datalist></label>
    <label>Prijs per keer (€ ${S().incl?"incl.":"excl."} btw)<input id="op-prijs" type="number" step="0.01" min="0" inputmode="decimal" value="${esc(o.prijs)}" required></label>
    <label>Frequentie<select id="op-freq">${freqO.map(w=>`<option value="${w}" ${w===Number(o.frequentie)?"selected":""}>${fl(w)}</option>`).join("")}</select></label>
    <label>Duur<select id="op-duur">${durO.map(m=>`<option value="${m}" ${m===Number(o.duur||30)?"selected":""}>${m<60?m+" min":(m/60).toLocaleString("nl-NL")+" uur"}</option>`).join("")}</select></label>
    ${main?`<label>Volgende beurt<input value="${k.gepland?esc(fmtL(k.gepland)):"Te plannen"}" disabled></label>`:`<label>Volgende keer <small style="font-weight:500">(leeg = bij de volgende beurt)</small><input id="op-volg" type="date" value="${esc(o.volgende||"")}"></label>`}
    ${main||isNew?"":`<label class="full check-row"><input id="op-actief" type="checkbox" ${o.actief!==false?"checked":""}>Opdracht actief</label>`}
  </div>
  <p class="subt" style="margin:0">${main?"De hoofdopdracht bepaalt het ritme van de planning. Wijzigingen gelden voor alle volgende beurten.":"Een extra opdracht wordt meegenomen bij de beurt waarop hij aan de beurt is, en komt dan ook op die factuur. Daarna schuift de volgende keer vanzelf door."}</p>
  <div class="row">${!main&&!isNew?`<button type="button" class="ghost danger" id="opDel">Verwijderen</button>`:""}<span class="sp"></span><button type="button" id="opBack">Annuleren</button><button type="submit" class="primary" id="opGo">${I.check}Opslaan</button></div>`);
  $("#opX").onclick=$("#opBack").onclick=()=>openKlant(kid);
  const d=$("#opDel");if(d)d.onclick=async()=>{d.disabled=true;try{await save("klanten",k.id,{...strip(k),opdrachten:(k.opdrachten||[]).filter(x=>x.id!==oid)});toast("Opdracht verwijderd");back()}catch(e){d.disabled=false;err(e)}};
  form.onsubmit=async e=>{e.preventDefault();const dienst=$("#op-dienst").value.trim();if(!dienst){$("#op-dienst").focus();return}$("#opGo").disabled=true;
    const v={dienst,prijs:r2(Number($("#op-prijs").value)||0),frequentie:Number($("#op-freq").value)||4,duur:Number($("#op-duur").value)||30};
    try{if(main)await save("klanten",k.id,{...strip(k),...v});
      else{const nw={...o,...v,id:o.id||newId("o"),volgende:$("#op-volg").value,actief:$("#op-actief")?$("#op-actief").checked:true};
        const list=isNew?[...(k.opdrachten||[]),nw]:(k.opdrachten||[]).map(x=>x.id===oid?nw:x);await save("klanten",k.id,{...strip(k),opdrachten:list})}
      toast(isNew?"Opdracht toegevoegd":"Opdracht opgeslagen");back()}
    catch(er){$("#opGo").disabled=false;err(er)}};
}

const regelExtra=k=>{const x=[k.verbergFreq?"":freqLabel(k.frequentie).toLowerCase()].filter(Boolean);return x.length?" ("+x.join(", ")+")":""};

/* ingeplande afspraak verwijderen: direct weer aanbieden, of doorschuiven op de frequentie */
function afspraakVerwijderen(id){
  const k=state.klanten.find(x=>x.id===id);if(!k||!k.gepland)return;const g=k.gepland,nx=iso(addDays(parse(g),freqDays(k)));
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:linear-gradient(135deg,var(--late),#a3352f)">${I.trash}</span><div style="min-width:0;flex:1"><h3>Afspraak verwijderen</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(longD(parse(g)))}${k.tijd?" om "+esc(k.tijd):""}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <p style="margin:0;font-size:16px;font-weight:600">Wil je de afspraak direct weer aanbieden?</p>
  <div class="ad-keuze">${(k.reeks||[]).length?`<button type="button" class="ad-k ad-rk" id="adRk"><b>Alleen deze afspraak</b><span>De reeks loopt door: de volgende afspraak is ${esc(longD(parse(k.reeks[0].d)))}${k.reeks[0].t?" om "+esc(k.reeks[0].t):""}.</span></button>`:""}<button type="button" class="ad-k" id="adJa"><b>Ja</b><span>De klant staat meteen weer bij <i>Te plannen</i> aan de zijkant van de planning.</span></button>
    <button type="button" class="ad-k" id="adNee"><b>Nee</b><span>De afspraak schuift op met de frequentie (${esc(freqLabel(k.frequentie).toLowerCase())}): de volgende keer wordt rond ${esc(fmtD(nx))} aangeboden.</span></button></div>
  <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button></div>`);
  const go=async ja=>{form.querySelectorAll(".ad-k").forEach(b=>b.disabled=true);const cur=state.klanten.find(x=>x.id===id)||k,prev={gepland:cur.gepland||"",tijd:cur.tijd||"",skipTot:cur.skipTot||"",aanbieden:!!cur.aanbieden};
    try{await save("klanten",id,{...strip(cur),gepland:"",tijd:"",bezig:"",...(ja?{aanbieden:true,skipTot:""}:{aanbieden:false,skipTot:nx}),log:[...(cur.log||[]),{datum:iso(today()),tekst:"Afspraak "+fmtD(g)+" verwijderd"+(ja?", direct weer aangeboden":", opgeschoven naar "+fmtD(nx))}]});
      dlg.close();toast(ja?cleanName(k.naam)+" staat weer bij te plannen":"Afspraak verwijderd · volgende keer rond "+fmtD(nx),async()=>{const c2=state.klanten.find(x=>x.id===id);await save("klanten",id,{...strip(c2),...prev})})}
    catch(e){err(e);form.querySelectorAll(".ad-k").forEach(b=>b.disabled=false)}};
  const rk=$("#adRk");if(rk)rk.onclick=async()=>{form.querySelectorAll(".ad-k").forEach(b=>b.disabled=true);const cur=state.klanten.find(x=>x.id===id)||k,r=cur.reeks||[],prev={gepland:cur.gepland||"",tijd:cur.tijd||"",reeks:r};
    try{await save("klanten",id,{...strip(cur),gepland:r[0].d,tijd:r[0].t||cur.tijd||"",reeks:r.slice(1),bezig:"",log:[...(cur.log||[]),{datum:iso(today()),tekst:"Afspraak "+fmtD(g)+" uit de reeks verwijderd"}]});dlg.close();toast("Afspraak verwijderd · volgende "+fmtD(r[0].d),async()=>{const c2=state.klanten.find(x=>x.id===id);await save("klanten",id,{...strip(c2),...prev})})}catch(e){err(e);form.querySelectorAll(".ad-k").forEach(b=>b.disabled=false)}};
  $("#adJa").onclick=()=>go(true);$("#adNee").onclick=()=>go(false);
}

/* afgemelde beurt naar een andere tijd of dag slepen (corrigeert de geregistreerde tijd; de factuur blijft staan) */
async function beurtVerplaatsen(bid,datum,tijd){const b=state.beurten.find(x=>x.id===bid);if(!b||!datum)return;
  const prev={datum:b.datum,tijd:b.tijd||""},nw={datum,tijd:tijd!==undefined&&tijd!==""?tijd:(b.tijd||"")};if(prev.datum===nw.datum&&prev.tijd===nw.tijd)return;
  try{await save("beurten",bid,{...strip(b),...nw});
    const k=state.klanten.find(x=>x.id===b.klantId);if(k&&k.laatst===prev.datum&&nw.datum!==prev.datum)await save("klanten",k.id,{...strip(k),laatst:nw.datum});
    toast("Afgemelde beurt van "+cleanName(b.klantNaam)+" verplaatst naar "+fmtD(nw.datum)+(nw.tijd?" om "+nw.tijd:""),async()=>{const b2=state.beurten.find(x=>x.id===bid);if(b2)await save("beurten",bid,{...strip(b2),...prev})})}
  catch(e){err(e)}}

/* afmelding van een beurt terugdraaien: beurt weg, klant weer op die dag in de planning */
async function afmeldingTerug(bId){
  const b=state.beurten.find(x=>x.id===bId);if(!b)return;const k=state.klanten.find(x=>x.id===b.klantId);
  if(b.gefactureerd&&b.gefactureerd!=="nvt"){toast("Er is al een factuur voor deze beurt");return}
  if(!await vraag("Afmelding terugdraaien?",`${esc(cleanName(b.klantNaam||(k&&k.naam)||""))} staat dan weer open op ${esc(fmtL(b.datum))}.`,"Terugdraaien"))return;
  try{await del("beurten",bId);
    if(k){const vorige=state.beurten.filter(x=>x.klantId===k.id&&x.id!==bId&&x.datum<=b.datum).map(x=>x.datum).sort().pop()||"";
      await save("klanten",k.id,{...strip(k),laatst:vorige,gepland:b.datum,...(b.tijd?{tijd:b.tijd}:{})})}
    if(dlg.open)dlg.close();toast("Afmelding teruggedraaid")}catch(e){err(e)}
}