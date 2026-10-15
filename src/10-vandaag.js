/* ---------- VANDAAG ---------- */
function stopCard(k,i,isNext,late,day,totaal){
  const o=jobObj(k),a=jobAddrObj(k),h=hue(k.ronde||k.naam),js=jobState(k,day),sp=STATEPILL[js],bz=isBezig(k),mw=isMw();
  const tel=String(k.telefoon||"").replace(/[^\d+]/g,""),isT=day===iso(today());
  /* reistijd vanaf waar je nu bent (live locatie of vorige stop) */
  let reis=null;try{if(isT&&typeof rtMin==="function"&&typeof pkCoord==="function"){const vorige=routeStops(day).filter(x=>x.done).slice(-1)[0];const van=(typeof LV!=="undefined"&&LV.pos&&[LV.pos.lat,LV.pos.lng])||(vorige&&pkCoord(vorige.k))||null;reis=van?rtMin(van,pkCoord(k)):null}}catch(e){}
  const tm=toMin(k.tijd),eind=tm!=null?fromMin(tm+duur(k)):"";
  const naam=String((state.me&&state.me.name)||"").split(" ")[0]||"",vn=k.voornaam||cleanName(k.naam).split(",").slice(-1)[0].trim();
  const wa=tel&&typeof waLink==="function"?waLink(tel,`Goedendag${vn?" "+vn:""}, we zijn ${reis?"over ongeveer "+reis+" minuten":"zo"} bij u voor de glasbewassing. Groet, ${naam||(S().naam||"")}`):"";
  const tags=`${statusPill(sp[0],sp[1])}${late?'<span class="pill late">Achterstallig</span>':""}`;
  return `<div class="swipe" data-id="${esc(k.id)}">
    <div class="sbg sbg-r"><span>${I.check} Afmelden<small>conceptfactuur</small></span></div>
    <div class="sbg sbg-l"><span>Factureren<small>direct, open factuur</small></span></div>
    <div class="swipe-card tk${isNext?" next":""}${bz?" bezig":""}">
      <div class="tk-kop">
        <div class="tk-nr"><small>Stop</small><b>${i+1}</b>${totaal?`<em>van ${totaal}</em>`:""}</div>
        <div class="tk-tijd"><small>${bz?"Bezig sinds":"Aanvang"}</small><b>${bz?esc(String(new Date(k.bezig).toTimeString()).slice(0,5)):esc(k.tijd||"—")}</b>${eind&&!bz?`<em>tot ${esc(eind)}</em>`:""}</div>
        <div class="tk-vlucht" aria-hidden="true"><i></i>${typeof RV_BUS!=="undefined"?`<span>${RV_BUS}</span>`:""}<i></i></div>
        <div class="tk-eta">${bz?`<small>Bezig</small><b data-timer="${esc(k.bezig)}">${fmtTimer(Date.now()-new Date(k.bezig))}</b><em>${duur(k)} min gepland</em>`:reis!=null?`<small>Rijden</small><b>${reis} min</b><em>${isNext?"vanaf hier":"geschat"}</em>`:`<small>Duur</small><b>${duur(k)} min</b><em>werk</em>`}</div>
      </div>
      <div class="tk-perf" aria-hidden="true"></div>
      <div class="tk-body">
        <div class="tk-tags">${tags}${isNext?'<span class="pill nextp">Volgende</span>':""}</div>
        <button type="button" class="tk-adres" data-act="klant" data-id="${esc(k.id)}"><span class="av" style="--h:${h}">${esc(initials(k.naam))}</span><span><b>${esc(a.adres||cleanName(k.naam))}</b><small>${esc([a.postcode,a.plaats].filter(Boolean).join(" "))}${a.plaats?" · ":""}${esc(cleanName(k.naam))}${o&&o.naam?" · "+esc(o.naam):""}</small></span>${I.right.replace("<svg",'<svg class="chev"')}</button>
        <div class="tk-feit"><span><b>${dienstHtml(k)}</b>${k.binnen?" + binnen":""}</span><span>${I.clock}<b>${duur(k)} min</b></span>${mw?"":`<span>${I.euro||""}<b>${eur0(toon(k.prijs))}</b></span>`}</div>
        ${bz?(()=>{const ex=(k.tijden||[]).length&&typeof gemTijd==="function"?gemTijd(k):duur(k),f=(Date.now()-new Date(k.bezig))/60000/ex;return `<div class="tk-tm"><div class="bt-bar"><i data-tbar="${esc(k.bezig)}" data-exp="${ex}" class="${f>1?"over":""}" style="width:${Math.min(100,f*100)}%"></i></div><small>${(k.tijden||[]).length?"Gemiddeld "+ex+" min bij deze klant":"Verwacht "+ex+" min"}</small></div>`})():""}
        <div class="tk-info">${oBeurtBlok(k)}${hospRoute(k)}${toegangHtml(k)}${ookDezeBeurt(k,day)}${objInfo(k)}${jobExtra(k)}</div>
        <div class="tk-acts"><a class="tk-a" href="${esc(mapsQ(k))}" target="_blank" rel="noopener">${I.nav}<span>Navigeer</span></a>${tel?`<a class="tk-a" href="tel:${esc(tel)}">${I.phone}<span>Bellen</span></a>`:""}${wa&&!bz?`<a class="tk-a" href="${esc(wa)}" target="_blank" rel="noopener">${I.msg}<span>Ik kom eraan</span></a>`:""}<button type="button" class="tk-a" data-act="skip" data-id="${esc(k.id)}">${I.right}<span>Overslaan</span></button></div>
      </div>
      <div class="tk-perf" aria-hidden="true"></div>
      <div class="tk-stub">${bz?`<span class="tk-live"><i></i>Bezig · na afloop afmelden</span>`:`<button type="button" class="tk-start" data-act="start" data-id="${esc(k.id)}">${I.clock}Start</button>`}<button type="button" class="primary tk-af" data-act="afmelden" data-id="${esc(k.id)}">${I.check}Afmelden</button></div>
    </div></div>`;
}
function stopRow(k,day,done){
  const a=jobAddrObj(k),js=done?"afgerond":jobState(k,day),sp=STATEPILL[js],info=jobObj(k);
  return `<div class="swipe" data-id="${esc(k.id)}"${done?' data-done="1"':""}>
    <div class="sbg sbg-r"><span>${I.check} Afmelden</span></div><div class="sbg sbg-l"><span>Factureren</span></div>
    <div class="swipe-card srow${done?" done":""}" data-act="job" data-id="${esc(k.id)}" data-d="${esc(day)}">
      <span class="sr-t">${esc(k.tijd||"—")}</span><span class="av sm" style="--h:${hue(k.ronde||k.naam)}">${esc(initials(k.naam))}</span>
      <span class="sr-a"><b>${esc(a.adres||cleanName(k.naam))}</b><small>${esc(a.plaats||"")}${a.plaats?" · ":""}${esc(cleanName(k.naam))}</small></span>
      ${info?`<span class="sr-i" title="Objectinfo">i</span>`:""}<span class="amt">${done?eur(toon(k.prijs)):eur0(toon(k.prijs))}</span>${statusPill(sp[0],sp[1])}${I.right.replace("<svg",'<svg class="chev"')}
    </div></div>`;
}
function activiteit(d){
  const ev=[];
  state.beurten.filter(b=>b.datum===d).forEach(b=>ev.push({t:b.op||d+"T12:00",ic:I.check,c:"ok",txt:"<b>"+esc(cleanName(b.klantNaam))+"</b> afgemeld · "+eur(b.bedrag)}));
  state.facturen.filter(f=>String(f.gemaakt||"").slice(0,10)===d).forEach(f=>ev.push({t:f.gemaakt,ic:I.facturen,c:"brand",txt:(f.soort==="offerte"?"Offerte ":f.status==="concept"?"Conceptfactuur ":"Factuur ")+"<b>"+esc(f.nummer)+"</b> · "+esc(cleanName(f.klantNaam))}));
  state.berichten.filter(m=>String(m.op).slice(0,10)===d).forEach(m=>ev.push({t:m.op,ic:I.msg,c:"plan",txt:(KANAAL[m.kanaal]||"Bericht")+" aan <b>"+esc(cleanName(m.klantNaam))+"</b>"}));
  state.kosten.filter(c=>String(c.aangemaakt||"").slice(0,10)===d).forEach(c=>ev.push({t:c.aangemaakt,ic:I.receipt,c:"soon",txt:"Bon <b>"+esc(c.leverancier||c.categorie)+"</b> · "+eur(c.bedrag)}));
  ev.sort((a,b)=>String(b.t).localeCompare(String(a.t)));
  return ev.length?`<div class="act">${ev.slice(0,12).map(e=>{const tt=String(e.t).length>10?new Date(e.t):null;return `<div><span class="act-ic ${e.c}">${e.ic}</span><span>${e.txt}</span><time>${tt&&!isNaN(tt)?pad(tt.getHours())+":"+pad(tt.getMinutes()):""}</time></div>`}).join("")}</div>`:'<p class="subt" style="font-style:italic;margin:0">Nog geen activiteit vandaag</p>';
}
function routePreview(stops){
  const todo=stops.filter(s=>!s.done);
  if(!stops.length)return'<p class="subt" style="font-style:italic;margin:0">Geen stops</p>';
  return `<div class="rprev">${stops.map((s,i)=>`<div class="${s.done?"done":""}"><span class="rp-n">${s.done?"✓":i+1}</span><span><b>${esc(jobAddrObj(s.k).adres||cleanName(s.k.naam))}</b><small>${esc(s.k.tijd||"")}${s.k.tijd?" · ":""}${esc(jobAddrObj(s.k).plaats||"")}</small></span></div>`).join("")}</div>
  ${todo.length?routeLinks(stops).map((l,i,a)=>`<a class="btn small primary" style="width:100%;margin-top:10px" href="${esc(l)}" target="_blank" rel="noopener">${I.map}${a.length>1?"Deel "+(i+1):"Open in Google Maps"}</a>`).join(""):""}`;
}
function vVandaag(){
  const t=today(),d=state.vDay||iso(t),dd=parse(d),isT=d===iso(t);
  const stops=routeStops(d),todo=stops.filter(s=>!s.done);
  const doneB=state.beurten.filter(b=>b.datum===d);
  const omzet=doneB.reduce((a,b)=>a+toon(b.bedrag),0),verwacht=omzet+todo.reduce((a,s)=>a+toon(s.k.prijs),0);
  const total=todo.length+doneB.length,pct=total?Math.round(doneB.length/total*100):0;
  const due=isT?teplannen(t).filter(k=>!k.gepland):[];
  const note=(state.routes[d]||{}).notitie||"";
  const h=new Date().getHours(),groet=h<12?"Goedemorgen":h<18?"Goedemiddag":"Goedenavond",naam=(state.me&&state.me.name?state.me.name.split(" ")[0]:"")||cleanName(S().naam);
  const rel=Math.round((dd-t)/864e5),dagL=rel===0?"Vandaag":rel===1?"Morgen":rel===-1?"Gisteren":dd.toLocaleDateString("nl-NL",{weekday:"long"});
  const top=`<div class="vk"><div class="vk-l"><p class="vk-d">${I.sun}<span>${(x=>x.charAt(0).toUpperCase()+x.slice(1))(dd.toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"}))}</span><em>wk ${weekNr(dd)}</em></p></div>
    <div class="vk-nav" role="group" aria-label="Dag"><button type="button" data-act="vday" data-n="-1" aria-label="Vorige dag">${I.left}</button><button type="button" class="vk-nu${isT?" is":""}" data-act="vday" data-n="0" title="Naar vandaag"><small>${esc(fmtNum(dd))}</small><b>${esc(dagL.charAt(0).toUpperCase()+dagL.slice(1))}</b></button><button type="button" data-act="vday" data-n="1" aria-label="Volgende dag">${I.right}</button></div></div>`;
  const noteHtml=note?`<button type="button" class="daynote" data-act="daynote" data-d="${d}"><span class="eyebrow">Dagnotitie</span>${esc(note)}</button>`:"";
  const dueHtml=due.length?`<div class="banner"><div><b>${plural(due.length,"klant is","klanten zijn")} vandaag aan de beurt, maar niet ingepland</b><br><small>${due.slice(0,3).map(k=>esc(cleanName(k.naam))).join(", ")}${due.length>3?" en "+(due.length-3)+" meer":""}</small></div><button type="button" class="primary" data-act="plantoday">Plan vandaag in</button></div>`:"";
  const emptyHtml=!todo.length?vdRust(d,isT,stops.length,due.length):"";
  if(big()){
    return `<div class="withside"><div class="mainc">${top}
      ${vdHero(doneB.length,total,todo.length,omzet,verwacht,pct)}
      ${werkdagKaart(d,isT,total)}${aanmeldBanner()}${noteHtml}
      ${todo.length?`<div class="ns-head sm"><h2>Volgende stop</h2><span>${isMw()?"Tik voor adres en instructies · veeg rechts → afmelden":"Veeg of klik · links → factureren · rechts → afmelden"}</span></div><div class="list" style="gap:8px">${todo.map(s=>stopRow(s.k,d)).join("")}</div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button type="button" data-act="toroute" data-d="${d}">${I.route}Jouw route</button><button type="button" data-act="bulktoday">${I.msg}Bericht aan deze klanten</button></div>`:emptyHtml}
      ${doneB.length?`<div class="ns-head sm"><h2>Afgerond</h2></div><div class="list" style="gap:8px">${doneB.map(b=>{const k=state.klanten.find(x=>x.id===b.klantId);return k?stopRow(k,d,true):""}).join("")}</div>`:""}
      </div><aside class="rpanel"><div class="rp-sec"><span class="eyebrow rp-h">${I.pin}Route preview</span>${routePreview(stops)}</div>${isMw()?"":`<div class="rp-sec"><span class="eyebrow rp-h">${I.spark}Activiteit</span>${activiteit(d)}</div>`}</aside></div>`;
  }
  let html=top+vdHero(doneB.length,total,todo.length,omzet,verwacht,pct)+werkdagKaart(d,isT,total)+`${aanmeldBanner()}${noteHtml}`;
  if(!todo.length)html+=emptyHtml;
  else{
    html+=`<div class="ns-head"><h2>Volgende stop</h2><span>${isMw()?"Veeg rechts → afmelden":"Veeg links → factureren · rechts → afmelden"}</span></div>
    <div class="list">${stopCard(todo[0].k,doneB.length,true,parse(todo[0].k.gepland)<t,d,total)}</div>
    ${todo.length>1?`<h2 style="margin-top:24px">Daarna <small class="mono" style="font-size:13px;color:var(--muted);font-weight:400">${plural(todo.length-1,"stop","stops")}</small></h2><div class="list">${todo.slice(1).map((s,i)=>stopCard(s.k,doneB.length+i+1,false,parse(s.k.gepland)<t,d,total)).join("")}</div>`:""}
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button type="button" data-act="bulktoday">${I.msg}Bericht aan deze klanten</button><button type="button" data-act="toroute" data-d="${d}">Volgorde aanpassen</button></div>`;
  }
  if(doneB.length)html+=`<h2>Afgerond</h2><div class="list" style="gap:8px">${doneB.map(b=>{const k=state.klanten.find(x=>x.id===b.klantId);return k?stopRow(k,d,true):""}).join("")}</div>`;
  return html;
}

/* ---------- JOB-PANEEL (klik op een stop) ---------- */
function openJob(id,day){
  const k=state.klanten.find(x=>x.id===id);if(!k)return;day=day||iso(today());
  const b=state.beurten.find(x=>x.klantId===id&&x.datum===day),done=!!b,js=done?"afgerond":jobState(k,day),sp=STATEPILL[js],d=parse(day);
  const tel=String(k.telefoon||"").replace(/[^\d+]/g,""),bedrag=done?Number(b.bedrag)||0:Number(k.prijs)||0,st=S();
  const vars=klantVars(k,d),T=tpls(),aan=T.aankondiging||{};
  const mail=k.email?"mailto:"+encodeURIComponent(k.email)+"?subject="+encodeURIComponent(fill(aan.onderwerp||"Glasbewassing",vars)):"";
  const sms=tel?"sms:"+tel+"?&body="+encodeURIComponent(fill(aan.sms||"",vars)):"";
  const tile=(href,ic,l,dis)=>dis?"":`<a class="jp-tile" href="${esc(href)}" ${/^https?:/.test(href)?'target="_blank" rel="noopener"':""}>${ic}<span>${l}</span></a>`;
  const nxt=werkdagAanpassen(addDays(done?d:(d<today()?today():d),freqDays(k)));
  const diensten=[[k.dienst||"Glasbewassing",bedrag]].concat(k.binnen?[]:[]);
  openDlg(`<div id="jobPanel" data-d="${esc(day)}" data-k="${esc(k.id)}" class="jp${done?" jp-isaf":""}">
  <div class="jp-kop jp-${js}"><div class="jp-kr1"><span class="jp-st"><i></i>${esc(sp[1])}</span><button type="button" class="jp-st jp-kk" data-act="klant" data-id="${esc(k.id)}">${I.user}Klantkaart${I.right}</button><span class="sp"></span>${!done&&k.gepland===day?`<button type="button" class="jp-ib" data-act="afsprdel" data-id="${esc(k.id)}" title="Afspraak verwijderen" aria-label="Afspraak verwijderen">${I.trash}</button>`:""}<button type="button" class="jp-ib" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="jp-kr2"><span class="jp-k1"><small>${["zo","ma","di","wo","do","vr","za"][d.getDay()]} ${d.getDate()} ${["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][d.getMonth()]}</small><b>${esc(k.tijd||"–")}</b></span>
      <span class="jp-k2"><b>${esc(cleanName(k.naam))}</b><em>${I.pin}${esc(jobAddr(k))}</em></span>
      <span class="jp-k3"><small>Bedrag</small><b>${eur(toon(bedrag))}</b><em>${done?"afgerond":"na afmelden"}</em></span></div></div>
  ${state.tab==="planning"?"":`<div class="jp-tiles">${tile(tel?waLink(tel,""):"",I.chat,"WhatsApp",!tel)}${tile("tel:"+tel,I.phone,"Bellen",!tel)}${tile(mail,I.mail,"Mail",!mail)}${tile(mapsQ(k),I.nav,"Route")}</div>`}
  <div class="jp-body">
    ${done?(()=>{const f=b.gefactureerd&&!["nvt","periodiek"].includes(b.gefactureerd)?state.facturen.find(x=>x.id===b.gefactureerd):null,fs=f?fStatus(f):null,
        om=b.op?new Date(b.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):"",du=Number(b.duur)||0;
      return `<div class="jp-af"><div class="jp-af-t"><span class="eyebrow">Bedrag</span><b>${eur(toon(bedrag))}</b></div>
        <dl class="jp-af-dl">${om?`<div><dt>Afgemeld</dt><dd>${esc(om)}</dd></div>`:""}${du?`<div><dt>Bij de klant</dt><dd>${du>=60?Math.floor(du/60)+"u"+String(Math.round(du%60)).padStart(2,"0"):Math.round(du)+" min"}${b.gemeten?"":" <small>geschat</small>"}</dd></div>`:""}
        <div><dt>Factuur</dt><dd>${f?`<button type="button" class="linkbtn" data-act="factuur" data-id="${esc(f.id)}">${esc(f.nummer)}</button> ${statusPill(fs[0],fs[1])}`:b.gefactureerd==="nvt"?"Niet nodig":b.gefactureerd==="periodiek"?"Periodieke factuur":"Nog niet gefactureerd"}</dd></div></dl></div>`})()
      :""}
    <div><span class="eyebrow">${I.user}Opdracht</span><div class="jp-af jp-geg"><dl class="jp-af-dl">
      <div><dt>Omschrijving</dt><dd>${esc(k.omschrijving||k.ronde||(k.dienst||"Glasbewassing"))}</dd></div>
      <div><dt>Klantnummer</dt><dd>${esc(klantNr(k))}</dd></div>
      <div><dt>Naam</dt><dd><button type="button" class="linkbtn" data-act="klant" data-id="${esc(k.id)}">${esc(cleanName(k.naam))}</button></dd></div>
      <div><dt>Adres</dt><dd class="jp-adr">${esc(jobAddrObj(k).adres||"")}<small>${esc([jobAddrObj(k).postcode,jobAddrObj(k).plaats].filter(Boolean).join(" "))}</small></dd></div>
      ${tel?`<div><dt>Telefoon</dt><dd><a href="tel:${esc(tel)}">${esc(k.telefoon)}</a></dd></div>`:""}
      ${k.email?`<div><dt>E-mail</dt><dd><a href="mailto:${esc(k.email)}">${esc(k.email)}</a></dd></div>`:""}
      <div><dt>Medewerker</dt><dd>${esc((state.me&&state.me.name)||st.naam||"")}</dd></div>
      <div><dt>Tijdsduur</dt><dd>${duur(k)} min${gemTijd(k)?` <small>gemeten ${gemTijd(k)} min</small>`:""} <button type="button" class="iconbtn sm" data-act="opdracht" data-id="${esc(k.id)}" aria-label="Opdracht aanpassen" title="Opdracht aanpassen">${I.edit||I.note}</button></dd></div>
      <div class="jp-uit"><dt>Uit te voeren</dt><dd>${esc(k.dienst||"Glasbewassing")}${k.binnen?" (buiten en binnen)":""}${extraDue(k,day).length?` · ${extraDue(k,day).map(o=>esc(o.naam||o.dienst||"extra")).join(" · ")}`:""}${k.taak?`<small>${esc(k.taak)}</small>`:""}</dd></div>
    </dl></div></div>
    <div><span class="eyebrow">Diensten</span><div class="jp-svc">${diensten.map(([n,p])=>`<div><span class="jp-ic">${I.wrench}</span><b>${esc(n)}${k.binnen?" (buiten en binnen)":""}</b><span>${eur(toon(p))}</span></div>`).join("")}</div></div>
    ${oBeurtBlok(k)}${hospRoute(k)}${toegangHtml(k)}${ookDezeBeurt(k,typeof day!=="undefined"?day:undefined)}${objInfo(k)}${jobExtra(k)}
    ${(()=>{const fl=jobFotos(k);return fl.length?`<div><span class="eyebrow">Foto's · ${fl.reduce((a,f)=>a+(f.dots||[]).length,0)} ramen aangetikt</span><div class="jp-fotos" style="margin-top:6px">${fl.map((f,j)=>fotoCard(f,j,false).replace('data-fi=','data-jfi=')).join("")}</div></div>`:""})()}
    ${done?`<div class="jp-vb"><span class="jp-ic">${I.planning}</span><div><small>Volgende beurt</small><b>${k.gepland&&k.gepland>day?esc(fmtL(k.gepland))+(k.tijd?" · "+esc(k.tijd):""):"Nog niet ingepland"}</b></div>${k.gepland&&k.gepland>day?"":`<button type="button" class="small" data-act="afspraak" data-id="${esc(k.id)}">${I.planning}Inplannen</button>`}</div>`:""}
  </div>
  <div class="jp-foot">${done?`${!b.gefactureerd||b.gefactureerd==="nvt"?`<button type="button" class="ghost" data-act="afterug" data-id="${esc(b.id)}">${I.refresh}Afmelding terugdraaien</button>`:""}${b.gefactureerd&&!["nvt","periodiek"].includes(b.gefactureerd)&&state.facturen.some(x=>x.id===b.gefactureerd)?`<button type="button" class="primary" data-act="factuur" data-id="${esc(b.gefactureerd)}">${I.facturen}Factuur bekijken</button>`:!b.gefactureerd&&!isMw()?`<button type="button" class="primary" data-act="beurtfact" data-id="${esc(b.id)}">${I.facturen}Factuur maken</button>`:""}`:`${day===iso(today())?`<button type="button" data-act="start" data-id="${esc(k.id)}">${isBezig(k)?I.check+"Stop &amp; afmelden "+timerHtml(k):I.play+"Start"}</button>`:""}${isMw()?"":`<button type="button" class="ghost" data-act="factureren" data-id="${esc(k.id)}">${I.facturen}Direct factureren</button>`}<button type="button" class="primary" data-act="afmelden" data-id="${esc(k.id)}">${I.check}Afmelden</button>`}</div>
  </div>`,{drawer:true});
}

/* ---------- Vandaag: kop in de stijl van het klantportaal ---------- */
function vdHero(done,total,todo,omzet,verwacht,pct){if(!total)return"";const R=44,C=2*Math.PI*R,klaar=done>=total,mw=isMw();
  return `<section class="vh${klaar?" klaar":""}"><div class="vh-m"><p class="vh-k">${klaar?"Dag klaar":done?"Onderweg":"Klaar voor de start"} · ${done}/${total}</p>
    <h2>${esc(klaar?"Top gewerkt vandaag!":motTekst(done,total))}</h2>
    <div class="vh-weg" style="--p:${total?done/total:0}"><div class="fg-baan"><i></i></div>${[...Array(Math.min(total,12))].map((_,i)=>`<span class="vh-h${i<Math.round(done/total*Math.min(total,12))?" af":""}" style="left:${(i+1)/Math.min(total,12)*100}%">${HUIS}</span>`).join("")}<span class="vh-bus">${typeof RV_BUS!=="undefined"?RV_BUS:""}</span></div>
    <div class="vh-st">${mw?"":`<span><small>Verdiend</small><b>${eur0(omzet)}</b><em>van ${eur0(verwacht)}</em></span>`}<span><small>Klaar</small><b>${done}</b><em>adressen</em></span><span><small>Te gaan</small><b>${todo}</b><em>${todo===1?"adres":"adressen"}</em></span></div></div>
    <div class="vh-r"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="${R}" class="t"/><circle cx="50" cy="50" r="${R}" class="v" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct/100)}"/></svg><span><b>${pct}%</b><small>klaar</small></span></div></section>`}

/* ---------- Vandaag zonder stops: busje staat geparkeerd, met wat er nu zinvol is ---------- */
function vdRust(d,isT,klaar,nDue){let nx=null;try{for(let i=1;i<=21;i++){const dd=iso(addDays(parse(d),i)),st=routeStops(dd);if(st.length){nx={d:dd,n:st.length,eerste:st[0].k};break}}}catch(e){}
  const titel=klaar?"Dag klaar, top gedaan!":isT?"Vandaag een vrije dag":"Niets gepland op deze dag",sub=klaar?"Alle adressen zijn afgemeld. Busje mag de garage in.":"Geen adressen vandaag. Geniet ervan!";
  const dag=x=>{const p=parse(x),df=Math.round((p-parse(iso(today())))/864e5);return df===1?"Morgen":df===2?"Overmorgen":p.toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"short"})};
  return `<section class="vr${klaar?" klaar":""}"><div class="vr-sc" aria-hidden="true"><span class="vr-garage"><i></i></span><span class="vr-zon"></span><span class="vr-wolk w1"></span><span class="vr-wolk w2"></span><span class="vr-huis">${HUIS}</span><span class="vr-bus">${typeof RV_BUS!=="undefined"?RV_BUS:""}</span>${klaar?"":'<span class="vr-z">z<i>z</i><b>z</b></span>'}<span class="vr-grond"></span></div>
    <div class="vr-tx"><p class="vr-k">${klaar?"Dag afgerond":isT?"Vrije dag":"Geen stops"}</p><h2>${titel}</h2><p>${sub}</p>
</div></section>`}
