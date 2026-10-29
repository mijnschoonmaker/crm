/* ---------- RENDER ---------- */
const VIEWS={control:vControl,vandaag:vRoute,route:vRoute,planning:vPlanning,klanten:vKlanten,communicatie:vCommunicatie,offertes:vOffertes,facturen:vFacturen,boekhouding:vBoekhouding,calculator:vRamen,uitvoering:vUitvoering,inzichten:vInzichten,instellingen:vInstellingen,handleiding:vHandleiding};
function render(){tikWis();try{warmMailLogo()}catch(e){}try{sessionStorage.setItem("ms.tab",state.tab||"control");if(state.utab)sessionStorage.setItem("ms.utab",state.utab)}catch(e){}
  /* tellers in het menu: wat je in het Control Center op afgehandeld of later hebt gezet, telt niet mee */
  const af=typeof ccAf==="function"?ccAf:()=>false;
  const late=overdue().filter(k=>!(k.gepland==null||k.gepland==="")||!af(ccTlKey(k))).length,ach=facturen().filter(f=>fStatus(f)[1]==="Achterstallig"&&!af("fv:"+f.id)).length,mTodo=state.loaded?(typeof wqOpen==="function"?wqOpen():queues().reduce((a,q)=>a+q.items.length,0)):0;
  const st_=S(),B={planning:st_.bolPlanning===false?0:late,facturen:st_.bolFacturen===false?0:ach,communicatie:st_.bolComm===false?0:mTodo,klanten:nieuweAanmeldingen().filter(k=>!af("nk:"+k.id)).length,offertes:state.facturen.filter(f=>f.soort==="offerte"&&f.getekendNieuw&&!getekendAfgehandeld(f)&&!af("og:"+f.id)).length};
  meldNieuweAanmelding();
  const badge=t=>t==="control"&&iso(today())<"2026-12-15"?`<span class="badge cc-nieuw">Nieuw</span>`:t==="offertes"&&B[t]?`<span class="badge nk-b" title="Online ondertekend"><i>${B[t]}</i><em>getekend</em></span>`:t==="klanten"&&B[t]?`<span class="badge nk-b" title="${B[t]===1?"Nieuwe klant aangemeld":B[t]+" nieuwe klanten aangemeld"}"><i>${B[t]}</i><em>nieuw</em></span>`:B[t]?`<span class="badge">${B[t]}</span>`:"";
  try{nieuwKaart()}catch(e){console.error(e)}
  try{ptKaart()}catch(e){console.error(e)}
  try{tkKaart()}catch(e){console.error(e)}
  try{betaalCheck()}catch(e){console.error(e)}
  try{lvDagCheck()}catch(e){}
  $(".app").classList.toggle("collapsed",state.collapsed);
  const mw=isMw();document.body.classList.toggle("mw",mw);if(mw&&!MW_TABS.includes(state.tab))state.tab="vandaag";
  $("#sideNav").innerHTML=PAGES.filter(([t])=>!mw||MW_TABS.includes(t)).map(([t,l])=>`<button type="button" data-act="tab" data-tab="${t}" aria-current="${state.tab===t}" title="${l}">${I[t]}<span class="lbl">${l}</span>${badge(t)}</button>`).join("");
  const mob=mw?MW_TABS:["control","vandaag","planning","klanten"],inMeer=!mob.includes(state.tab),meerB=late*0+mTodo;
  $("#tabNav").innerHTML=mw?mob.map(t=>`<button type="button" data-act="tab" data-tab="${t}" aria-current="${state.tab===t}"><i>${I[t]}</i>${PAGES.find(p=>p[0]===t)[1]}</button>`).join(""):mob.map(t=>`<button type="button" data-act="tab" data-tab="${t}" aria-current="${state.tab===t}"><i>${I[t]}</i>${t==="control"?"Overzicht":PAGES.find(p=>p[0]===t)[1]}${t==="control"?"":badge(t)}</button>`).join("")+`<button type="button" data-act="meer" aria-current="${inMeer}"><i>${I.more}</i>Meer${meerB?`<span class="badge">${meerB}</span>`:""}</button>`;
  const nm=(state.me&&state.me.name)||S().naam||"Jouw bedrijf";
  {let lg=S().logo;if(lg){try{localStorage.setItem("ms.lg",lg)}catch(e){}}else if(LIVE){try{lg=localStorage.getItem("ms.lg")||""}catch(e){}}
    const h=new Date().getHours(),fn=state.me&&state.me.name?state.me.name.trim().split(/\s+/)[0]:"",gr=(h<6?"Goedenacht":h<12?"Goedemorgen":h<18?"Goedemiddag":"Goedenavond")+(fn?", "+fn:""),key=lg+"|"+gr;
    if(key!==state._lgShown){state._lgShown=key;document.querySelectorAll(".logo").forEach(el=>{const src="/mansard-logo.png";el.classList.toggle("haslogo",!!src);if(src)el.innerHTML=`<img class="lgimg" src="${esc(src)}" alt="Mansard"><span class="wm lgtxt">${esc(gr)}</span>`})}}
  $("#userCard").innerHTML=`<span class="uav">${esc(initials(nm))}</span><div style="min-width:0"><b>${esc(nm)}</b><small>${esc(S().naam&&state.me&&state.me.name?S().naam:"Mansard · CRM")}</small></div>`;
  const main=$("main");main.classList.toggle("wide",big()&&(state.tab==="control"||state.tab==="vandaag"||state.tab==="planning"||state.tab==="uitvoering"));
  if(!state.loaded&&state.db){$("#view").innerHTML=`<div class="ms-laden" role="status" aria-label="Gegevens laden"><i></i></div>`;return}
  if(state.loaded&&!state._perRun){state._perRun=1;setTimeout(()=>runPeriodiek(true),2500)}
  const ae=document.activeElement,fid=ae&&ae.id&&$("#view").contains(ae)?ae.id:null,pos=fid&&ae.selectionStart;
  const rcF=RC&&state.tab==="calculator"?RC.focusState():null;
  const tlAct=e=>e.querySelector('[aria-pressed="true"],[aria-current="true"],[aria-selected="true"]'),tlKey=a=>a?(a.dataset.v||a.dataset.tab||a.textContent):"",tlOud=[...$("#view").querySelectorAll(".tabsline")].map(e=>({x:e.scrollLeft,a:tlKey(tlAct(e))})),tlTab=state.tab;
  try{$("#view").innerHTML=(VIEWS[state.tab]||vVandaag)();if(state.tab==="calculator"){mountRamen();if(rcF)RC.restoreFocus(rcF)}if(state.tab==="planning")pkNaRender()}catch(e){console.error(e);$("#view").innerHTML=`<div class="notice">Deze pagina kon niet worden getoond (${esc(e.message)}). Ga naar een andere pagina of vernieuw.</div>`}
  if(fid){const el=document.getElementById(fid);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(_){}}}
  /* zijwaarts schuivende tabbalken houden hun plek na opnieuw tekenen; de gekozen tab blijft in beeld */
  requestAnimationFrame(pulsTemmen);
  $("#view").querySelectorAll(".tabsline").forEach((e,i)=>{if(e.scrollWidth<=e.clientWidth)return;const o=tlTab===state.tab?tlOud[i]:null;if(o)e.scrollLeft=o.x;
    const a=tlAct(e);if(!a||(o&&o.a===tlKey(a)))return;const l=a.offsetLeft-e.offsetLeft,r=l+a.offsetWidth;
    if(l<e.scrollLeft)e.scrollLeft=Math.max(0,l-16);else if(r>e.scrollLeft+e.clientWidth)e.scrollLeft=r-e.clientWidth+16});
}
/* paginawissel in de geschiedenis, zodat de terugknop naar de vorige pagina gaat */
function go(tab){if(tab==="route")tab="vandaag";if(isMw()&&!MW_TABS.includes(tab))tab="vandaag";if(tab!==state.tab){try{history.pushState({msTab:tab},"")}catch(_){}}goTab(tab)}
function goTab(tab){if(tab==="route")tab="vandaag";if(isMw()&&!MW_TABS.includes(tab))tab="vandaag";state.tab=tab;state.kmenu=state.fmenu=false;try{localStorage.setItem("zeem.tab",tab);sessionStorage.setItem("ms.tab",tab)}catch(_){}if(dlg.open)dlg.close();render();window.scrollTo(0,0)}

/* ---------- EVENTS ---------- */
let swAt=0;
const K=id=>state.klanten.find(x=>x.id===id);
document.addEventListener("click",e=>{
  if(Date.now()-swAt<400){e.preventDefault();return}
  const t=e.target.closest("[data-act]");
  if(!t){if(state.kmenu||state.fmenu){state.kmenu=state.fmenu=false;render()}return}
  const a=t.dataset.act,id=t.dataset.id;
  if(state.pselMode&&state.tab==="planning"&&a==="job"&&id){e.preventDefault();if(state.psel.has(id))state.psel.delete(id);else state.psel.add(id);render();return}
  if(a==="send"){logSend(Number(t.dataset.i),t.dataset.k);return}
  if(t.tagName==="A")return;
  if(a!=="kmenu"&&a!=="fmenu"&&(state.kmenu||state.fmenu)){state.kmenu=state.fmenu=false;if(!["billall","finalizeall","queue","fhmenu","fexport","import","export"].includes(a))render()}
  const n=Number(t.dataset.n);
  switch(a){
    case"tab":go(t.dataset.tab);break;
    case"pselmode":state.pselMode=!state.pselMode;if(!state.pselMode)state.psel.clear();else state.planMode=false;render();break;
    case"pselclr":state.psel.clear();render();break;
    case"pselmove":pselMove();break;
    case"pselterug":pselTerug();break;
    case"close":sluitDlg();break;
    case"collapse":state.collapsed=!state.collapsed;try{localStorage.setItem("zeem.col",state.collapsed?"1":"0")}catch(_){}render();break;
    case"meer":openMeer();break;
    case"settings":go("instellingen");break;
    /* klanten en jobs */
    case"klant":if(isMw()){if(id)openKlantMw(id);break}openKlant(id||null);break;
    case"job":openJob(id,t.dataset.d);break;
    case"ptopen":openPortaalVz();break;
    case"pmeer":state.pmeer=!state.pmeer;render();break;
    case"livedelen":liveWissel();break;
    case"pkaart":state.pkaart=!state.pkaart;state.pmeer=false;try{localStorage.setItem("ms.pk",state.pkaart?"1":"0")}catch(e){}if(state.pkaart){PK.fit=false;PK.zelf=false}render();break;
    case"pkwis":state.ksel.clear();render();break;
    case"pkfit":pkFit();break;
    case"pkinbeeld":pkInBeeld();break;
    case"pkretry":PK.fout="";render();break;
    case"pscrolloffer":{const c=document.querySelector(".offercol");if(c)c.scrollIntoView({behavior:"smooth",block:"start"})}break;
    case"tkopen":openTickets(id);break;
    case"tknieuw":openTickets("",id);break;
    case"ptinvite":portaalUitnodigen(id);break;
    case"ptkijk":portaalBekijken(id);break;
    case"reeksinfo":openReeksInfo(id,t.dataset.d);break;
    case"reeksnew":{const k=K(id);if(k&&k.gepland)openReeks(k,k.gepland,k.tijd||"",true).then(r=>{if(r)reeksOpslaan(k,k.gepland,k.tijd||"",r,true)})}break;
    case"beurtinfo":openBeurtInfo(id);break;
    case"afspraak":openAfspraak(id,t.dataset.d);break;
    case"afsprdel":afspraakVerwijderen(id);break;
    case"hospedit":kkHosp(id);break;
    case"opdracht":{const kk=state.klanten.find(x=>x.id===id);
      /* losse opdracht (apart ingepland): open de opdracht bij de hoofdklant, zoals op de klantkaart */
      if(kk&&kk.hoofdKlantId&&kk.opdrachtId&&state.klanten.some(x=>x.id===kk.hoofdKlantId&&(x.opdrachten||[]).some(o=>o.id===kk.opdrachtId))){openOpdrachtWerk(kk.hoofdKlantId,kk.opdrachtId);break}if(kk&&kk.opdrachtVerwijderd&&t.dataset.o==="new"){kkNieuweHoofd(id);break}openOpdrachtWerk(id,t.dataset.o);break}
    case"offedit":{const f=state.facturen.find(x=>x.id===id);openOfferte({id,back:state.tab==="offertes"?"":f&&f.klantId});break}
    case"offback":sluitDlg(()=>{if(id&&state.klanten.some(x=>x.id===id))openKlantView(id);else dlg.close()});break;
    case"offdel":kkDelOfferte(id);break;
    case"opdrdel":kkDelOpdracht(id,t.dataset.o);break;
    case"autoplan":{const k=K(id);if(k){const on=!k.autoplan;save("klanten",k.id,{...strip(k),autoplan:on}).then(()=>{toast(on?"Doorplannen aan":"Doorplannen uit");const d=$("#jobPanel");if(d)openJob(k.id,d.dataset.d)}).catch(err)}break}
    case"was":{const k=K(id);if(k){t.disabled=true;if(dlg.open)dlg.close();afronden(k,"concept")}break}
    case"afmelden":case"factureren":{const k=K(id);if(k){t.disabled=true;if(dlg.open)dlg.close();afronden(k,a==="factureren"?"open":"concept",t.closest(".swipe"))}break}
    case"start":{const k=K(id);if(k){const jp=$("#jobPanel");if(isBezig(k)&&dlg.open)dlg.close();startJob(k).then(()=>{if(jp&&dlg.open)setTimeout(()=>openJob(id,jp.dataset.d),80)})}break}
    case"obj":kkLocatie(id,t.dataset.o||"");break;
    case"reveal":t.outerHTML='<span class="mono">'+esc(t.dataset.v)+'</span>';break;
    case"msgklant":{const k=K(id);if(k)openCompose({title:"Bericht aan "+cleanName(k.naam),sjabloon:"afspraak",recipients:[{k,vars:klantVars(k),ref:""}]});break}
    case"import":openImport();break;
    case"kfoto":state.kmenu=false;openKlantFoto();break;
    case"webaanvraag":openWebAanvraag();break;
    case"planmail":openPlanMail(t.dataset.d);break;
    case"geplande":openGeplande();break;
    case"sendgepland":sendGeplande();break;
    case"export":exportKlanten();break;
    case"kmenu":state.kmenu=!state.kmenu;render();break;
    case"kf":state.kf=t.dataset.v;state.kpage=1;render();break;
    case"kpage":state.kpage+=n;render();window.scrollTo(0,0);break;
    case"selmode":state.sel=state.sel?null:new Set();render();break;
    case"selk":state.sel.has(id)?state.sel.delete(id):state.sel.add(id);render();break;
    case"selall":klantFilter().forEach(k=>state.sel.add(k.id));render();break;
    case"selmsg":openGroepKeuze(state.klanten.filter(k=>state.sel.has(k.id)));break;
    case"selplan":{const l=state.klanten.filter(k=>state.sel.has(k.id));runSeq(l,k=>save("klanten",k.id,{...strip(k),gepland:iso(today()),tijd:""}),plural(l.length,"klant","klanten")+" vandaag ingepland");break}
    case"selpause":{const l=state.klanten.filter(k=>state.sel.has(k.id));runSeq(l,k=>save("klanten",k.id,{...strip(k),actief:false}),plural(l.length,"klant","klanten")+" op inactief gezet");break}
    case"seldel":{if(t.dataset.armed!=="1"){t.dataset.armed="1";t.textContent="Zeker weten? Tik nogmaals";break}const l=state.klanten.filter(k=>state.sel.has(k.id));runSeq(l,k=>del("klanten",k.id),plural(l.length,"klant","klanten")+" verwijderd");state.sel=new Set();break}
    case"postcodes":openPostcodes();break;
    case"pcronde":{const pc=t.dataset.v,l=actief().filter(k=>String(k.postcode||"").replace(/\s/g,"").startsWith(pc));const r="Ronde "+pc;runSeq(l,k=>save("klanten",k.id,{...strip(k),ronde:r}),plural(l.length,"klant","klanten")+" in "+r).then(()=>setTimeout(openPostcodes,80));break}
    case"welkom":{const refs=sentRefs(),l=actief().filter(k=>!refs.has("welkom:"+k.id));if(!l.length){toast("Alle klanten hebben al een welkomstbericht gekregen");break}openBulk(l,"welkom");break}
    /* facturen en offertes */
    case"factuur":openFactuur(id);break;
    case"afterug":afmeldingTerug(id);break;
    case"beurtfact":{const b=state.beurten.find(x=>x.id===id);t.disabled=true;billAll(t,[id]).then(fid=>{if(fid){if(dlg.open)dlg.close();setTimeout(()=>openFactuur(fid),80)}}).catch(err);break}
    case"newfactuur":openFactuurForm({soort:"factuur",klantId:id});break;
    case"newofferte":openOfferte({klantId:id});break;
    case"editf":{const f=state.facturen.find(x=>x.id===id);if(f&&f.soort==="offerte")openOfferte({id});else openFactuurForm({id});break}
    case"fset":setFStatus(id,t.dataset.s);break;
    case"akkoord":openAkkoord(id);break;
    case"pdf":pdf(id);break;
    case"sendf":sendF(id,{direct:true,btn:t});break;
    case"toinvoice":{const o=state.facturen.find(x=>x.id===id);if(o)openFactuurForm({soort:"factuur",klantId:o.klantId,regels:o.regels.map(r=>({...r})),vanOfferte:o.id});break}
    case"fmenu":state.fmenu=!state.fmenu;render();break;
    case"ff":state.fFilter=t.dataset.v;if(state.tab!=="facturen")state.tab="facturen";render();break;
    case"of":state.oFilter=t.dataset.v;render();break;
    case"billall":billAll(t);break;
    case"fotokijk":fotoBekijk({soort:t.dataset.bron,id:t.dataset.id},Number(t.dataset.i));break;
    case"bvdel":{const k=state.klanten.find(x=>x.id===id);if(k){const l=[...(k.bevindingen||[])];l.splice(Number(t.dataset.i),1);const jp=$("#jobPanel");save("klanten",k.id,{...strip(k),bevindingen:l}).then(()=>{toast("Foto verwijderd");if(dlg.open&&jp)setTimeout(()=>openJob(jp.dataset.k,jp.dataset.d),50)}).catch(err)}break}
    case"perlijst":state.fmenu=false;openPeriodiekLijst();break;
    case"finalizeall":{const l=facturen().filter(f=>f.status==="concept");runSeq(l,f=>save("facturen",f.id,{...strip(f),status:"open"}),plural(l.length,"factuur","facturen")+" definitief gemaakt");break}
    case"fexport":exportFacturen();break;
    case"snelstart":state.fmenu=false;state.tab="boekhouding";state.btab="boekhouder";state.bhtab="overzichten";render();window.scrollTo({top:0});break;
    /* communicatie */
    case"copymsg":{const r=compose&&compose.recipients[Number(t.dataset.i)];if(r)copy(fill(compose.tekst,r.vars),t);break}
    case"fhmenu":{const K=fhKlaar();if(K.herinnering.length)fbHerinner(K.herinnering,false);else if(K.wik.length)fbHerinner(K.wik,true);else if(K.likifin.length)fhLikifin(K.likifin);
      else{const ds=facturen().map(f=>fhVolgende(f)).filter(v=>v&&v.datum&&!v.klaar&&v.soort!=="bijlikifin").map(v=>v.datum).sort();toast(ds[0]?"Vandaag geen herinneringen aan de beurt · eerstvolgende "+fmtD(ds[0]):"Geen openstaande facturen die een herinnering nodig hebben")}break}
    case"queue":{const q=queues().find(x=>x.id===t.dataset.q);if(q&&q.items.length)openCompose({title:q.titel,sjabloon:q.sjabloon||q.id,recipients:q.items,hint:q.hint?esc(q.hint):"",tekst:q.tekst,mail:q.mail,onderwerp:q.onderwerp,kanaal:q.kanaal});else toast(q?"Niets klaar om te versturen":"Zet factuurherinneringen aan bij Instellingen");break}
    case"bulk":{const g=$("#bulkGroup"),tp=$("#bulkTpl");openBulk(g?g.value:"alle",tp?tp.value:"weer");break}
    case"bulktoday":openBulk("vandaag","afspraak");break;
    case"bulkmsg":openBulk("route","afspraak");break;
    case"pickrec":openPickRecipients();break;
    case"nieuwsbrief":openBulk("alle","nieuwsbrief");break;
    case"ctab":state.ctab=t.dataset.v;state.mpage=1;render();break;
    case"tf":state.tf=t.dataset.v;render();break;
    case"tplsw":state.tplSide[t.dataset.k]=t.dataset.v;render();break;
    case"tplview":openTplView(t.dataset.k);break;
    case"tpledit":openTplEdit(t.dataset.k);break;
    case"tplnew":openTplEdit(null);break;
    case"tplstd":{if(t.dataset.armed!=="1"){t.dataset.armed="1";t.innerHTML=I.alert+"Alle aanpassingen wissen? Tik nogmaals";break}const o={};Object.keys(state.sjablonen).forEach(k=>{if(!TPL[k])o[k]=state.sjablonen[k]});save("instellingen","sjablonen",o).then(()=>toast("Standaardteksten geladen")).catch(err);break}
    case"mailstijl":openMailStijl();break;
    case"copyhtml":copyHtmlFor(Number(t.dataset.i));break;
    case"tracksync":syncTrack(true);break;
    case"mpage":state.mpage+=n;render();window.scrollTo(0,0);break;
    case"mch":state.mch=t.dataset.v;render();break;
    case"tplreset":{const ta=document.querySelector(`[data-tt="${t.dataset.k}"]`),tn=document.querySelector(`[data-tn="${t.dataset.k}"]`);if(ta)ta.value=TPL[t.dataset.k].tekst;if(tn)tn.value=TPL[t.dataset.k].naam;break}
    case"tplsave":case"tpladd":case"tpldel":{const o={};document.querySelectorAll("[data-tt]").forEach(ta=>{const k=ta.dataset.tt,tn=document.querySelector(`[data-tn="${k}"]`);o[k]={naam:(tn&&tn.value.trim())||k,tekst:ta.value}});
      if(a==="tpladd")o["eigen"+Date.now().toString(36)]={naam:"Nieuwe template",tekst:"Hoi [name.customer], "};if(a==="tpldel")delete o[t.dataset.k];
      save("instellingen","sjablonen",o).then(()=>toast(a==="tpladd"?"Template toegevoegd":a==="tpldel"?"Template verwijderd":"Templates opgeslagen")).catch(err);break}
    /* vandaag & route */
    case"krz":state.krz=state.krz===t.dataset.v?"":t.dataset.v;state.kpage=1;render();break;
    case"vdag":state.vDay=t.dataset.d;render();scrollTo({top:0});break;
    case"vday":state.vDay=n===0?iso(today()):iso(addDays(parse(state.vDay||iso(today())),n));render();break;
    case"daynote":openDayNote(t.dataset.d||iso(today()));break;
    case"kost":openKost(id);break;
    case"plantoday":{const l=teplannen(today()).filter(k=>!k.gepland);t.disabled=true;runSeq(l,k=>save("klanten",k.id,{...strip(k),gepland:iso(today())}),plural(l.length,"klant","klanten")+" vandaag ingepland");break}
    case"toroute":state.routeDay=t.dataset.d;go("route");break;
    case"rday":state.routeDay=n===0?iso(today()):iso(addDays(parse(state.routeDay||iso(today())),n));render();break;
    case"rmove":routeMove(id,n);break;
    case"rvmap":rvMapToggle();break;
    case"optim":optimize(t.dataset.d);break;
    case"weekplan":{const d=t.dataset.d?parse(t.dataset.d):null;openWeekplan(d&&d>startOfWeek(today())?d:addDays(startOfWeek(today()),7));break}
    /* planning */
    case"pview":state.pview=t.dataset.v;state.pick=null;render();break;
    case"pstat":state.pstat=t.dataset.v;render();break;
    case"pnav":{const v=state.pview,tt=today();
      if(n===0){state.planDay=iso(tt);state.week=startOfWeek(tt);state.multiDays=null;state.mon=iso(new Date(tt.getFullYear(),tt.getMonth(),1))}
      else if(v==="dag")state.planDay=iso(addDays(parse(curDay()),n));
      else if(v==="week"){state.week=addDays(state.week,7*n);state.planDay=iso(state.week)}
      else if(v==="multi"){const ds=viewDays(),span=Math.round((parse(ds[ds.length-1])-parse(ds[0]))/DAY)+1;state.multiDays=ds.map(d=>iso(addDays(parse(d),span*n)))}
      else{const m=parse(state.mon||iso(new Date(tt.getFullYear(),tt.getMonth(),1)));state.mon=iso(new Date(m.getFullYear(),m.getMonth()+n,1));state.planDay=state.mon}
      render();break}
    case"pickday":state.planDay=t.dataset.d;state.pview="dag";render();break;
    case"rowh":state.rowH=Math.min(1.5,Math.max(.7,Math.round((state.rowH+n*.25)*100)/100));render();break;
    case"slotsz":state.slot=Number(t.dataset.v);render();break;
    case"mdel":{const ds=viewDays().filter(d=>d!==t.dataset.d);state.multiDays=ds.length?ds:null;render();break}
    case"planmode":state.planMode=!state.planMode;state.pick=null;render();break;
    case"pmpick":state.pick=state.pick===id?null:id;render();break;
    case"tslot":if(ADV.meer&&mSel.size){planMulti(t.dataset.d,t.dataset.t);break}if(state.planMode&&state.pick){const p=state.pick;state.pick=null;moveTo(p,t.dataset.d,t.dataset.t)}break;
    case"achter":state.achter=!state.achter;render();break;
    case"refresh":render();toast("Bijgewerkt");break;
    case"bulkday":openBulkDay(t.dataset.d);break;
    case"newjob":openNewJob(t.dataset.d);break;
    case"planop":t.disabled=true;moveTo(id,t.dataset.d||"",t.dataset.t).then(()=>{if(dlg.open&&form.dataset.sheet==="offer")setTimeout(openOfferSheet,60)});break;
    case"planall":{const days=viewDays(),l0=teplannen(parse(days[days.length-1])<today()?today():parse(days[days.length-1])),l=state.pkaart&&state.ksel.size?l0.filter(k=>state.ksel.has(k.id)):l0;t.disabled=true;runSeq(l,k=>save("klanten",k.id,{...strip(k),gepland:iso(sugDate(k,days))}),plural(l.length,"klant","klanten")+" ingepland op hun vervaldag");break}
    case"offersheet":openOfferSheet();break;
    case"kklogmeer":case"kklogmin":{state.kkLogN=a==="kklogmeer"?(state.kkLogN||5)+10:5;const kid=state._kkLast,y=dlg.scrollTop;if(kid){openKlantView(kid);requestAnimationFrame(()=>dlg.scrollTop=y)}break}
    case"naarofferlijst":{const m=document.getElementById("mobOffer");if(m)m.scrollIntoView({behavior:"smooth",block:"start"});else openOfferSheet();break}
    case"advtgl":ADV.open=!ADV.open;advSave();reOffer();break;
    case"osort":ADV.sort=t.dataset.v;advSave();reOffer();break;
    case"advdatum0":ADV.datum="";reOffer();break;
    case"msel":mSel.has(id)?mSel.delete(id):mSel.add(id);reOffer();break;
    case"mselplan":{const d=t.dataset.d;if(dlg.open)dlg.close();planMulti(d,nextFree(d));break}
    case"mselclr":mSel.clear();reOffer();break;
    case"mselall":document.querySelectorAll(dlg.open&&form.dataset.sheet==="offer"?"#dlgForm [data-act=msel]":".offercol [data-act=msel]").forEach(b=>mSel.add(b.dataset.id));reOffer();break;
    case"mselgrp":{const g=t.dataset.g;state.klanten.filter(k=>(k.ronde||"Zonder groep")===g).forEach(k=>{if(document.querySelector('[data-act=msel][data-id="'+CSS.escape(k.id)+'"]'))mSel.add(k.id)});reOffer();break}
    /* boekhouding, calculator, inzichten, instellingen, help */
    case"bhtab":case"bhper":case"bhsave":case"bhdlomzet":case"bhdluren":case"bhmailomzet":case"bhmailuren":case"bhmailfile":bhActie(a,t);break;
    case"btab":state.btab=t.dataset.v;if(state.tab!=="boekhouding")state.tab="boekhouding";render();break;
    case"aangifte":openAangifte(Number(t.dataset.y),Number(t.dataset.q));break;
    case"rapport":pdfRapport(state.tab==="boekhouding"?state.bjaar:today().getFullYear(),state.tab==="boekhouding"?state.bper:(state.iper==="jaar"?"jaar":state.iper==="kwartaal"?"q"+(Math.floor(today().getMonth()/3)+1):"m"+today().getMonth()));break;
    case"rapportm":{const d=new Date(today().getFullYear(),today().getMonth()-1,1);pdfRapport(d.getFullYear(),"m"+d.getMonth());break}
    case"itab":state.itab=t.dataset.v;render();break;
    case"iper":state.iper=t.dataset.v;render();break;
    case"prijzen":openPrijzen();break;
    case"calcoff":calcToKlant("off");break;
    case"rcopen":openOfferte({klantId:id});break;
    case"calcset":calcToKlant("set");break;
    case"setedit":openSetEdit(t.dataset.v);break;
    case"skip":openSkip(id);break;
    case"toonex":saveSettings({toonEx:t.dataset.v==="1"},"Bedragen worden nu "+(t.dataset.v==="1"?"ex":"incl")+" btw getoond").then(()=>schedule());break;
    case"voorbeeld":openVoorbeeld();break;
    case"acc":state.open[t.dataset.v]=!state.open[t.dataset.v];render();break;
    default:if(/^fb/.test(a))fbAct(a,t,e);else if(/^u/.test(a))uAct(a,t);
  }
});
document.addEventListener("input",e=>{
  if(e.target.dataset&&e.target.dataset.u&&e.target.type!=="checkbox"&&e.target.tagName!=="SELECT"){uInput(e.target,false);return}
  const id=e.target.id;
  const map={q:"q",fq:"fq",mq:"mq",pq:"pq",hq:"hq",tq:"tq"};
  if(map[id]){state[map[id]]=e.target.value;if(id==="q")state.kpage=1;render();return}
  if(id==="advZoek"){ADV.zoek=e.target.value;const p=e.target.selectionStart,inSheet=dlg.open&&dlg.contains(e.target);reOffer();if(inSheet){const el=form.querySelector("#advZoek");if(el){el.focus();try{el.setSelectionRange(p,p)}catch(_){}}}return}
  if(id&&id.startsWith("cc-")&&id!=="cc-klant"){const c=state.calc;c[id.slice(3)]=Math.max(0,Number(e.target.value)||0);render()}
});
function reOffer(){render();if(dlg.open&&form.dataset.sheet==="offer")openOfferSheet()}
document.addEventListener("change",e=>{
  const t=e.target,id=t.id;
  if(t.dataset&&t.dataset.bvk&&t.files&&t.files[0]){const f=t.files[0];t.value="";bvUpload(t.dataset.bvk,f);return}
  if(t.dataset&&t.dataset.fwcam&&t.files&&t.files[0]){const f=t.files[0];t.value="";fwCamUpload(t.dataset.fwcam,f);return}
  if(t.dataset&&t.dataset.u){uInput(t,t.type==="checkbox"||t.tagName==="SELECT");return}
  if(id==="kronde"){state.ronde=t.value;state.kpage=1;render()}
  else if(id==="mst"){state.mst=t.value;state.mpage=1;render()}
  else if(id==="mpp"){state.mpp=Number(t.value);state.mpage=1;render()}
  else if(id==="kpp"){state.kpp=Number(t.value);state.kpage=1;render()}
  else if(id==="bjaar"){state.bjaar=Number(t.value);render()}
  else if(id==="bper"){state.bper=t.value;render()}
  else if(t.dataset.adv){ADV[t.dataset.adv]=t.checked;if(t.dataset.adv==="meer"&&!t.checked)mSel.clear();advSave();reOffer()}
  else if(id==="advDatum"){ADV.datum=t.value;reOffer()}
  else if(id==="madd"&&t.value){const ds=viewDays();if(!ds.includes(t.value))state.multiDays=[...ds,t.value].sort();render()}
  else if(t.dataset.csel){state.calc.sel[t.dataset.csel]=t.checked;render()}
  else if(id==="cc-freq"){state.calc.freq=Number(t.value);render()}
});
// slepen
/* slepen met muis én vinger: pak een job of een klant uit Te plannen en laat hem los op een dag of tijdslot */
document.addEventListener("dragstart",e=>{if(e.target.closest&&e.target.closest("[data-drag]"))e.preventDefault()});
let dg=null;
const dropAt=(x,y)=>{for(const el of document.elementsFromPoint(x,y)){if(el.classList&&el.classList.contains("dg-ghost"))continue;const c=el.closest&&el.closest("[data-drop]");if(c)return c}return null};
document.addEventListener("pointerdown",e=>{if(e.button>0)return;const j=e.target.closest&&e.target.closest("[data-drag]");if(!j||e.target.closest("input,select,textarea,.tiny,.check"))return;
  dg={j,id:j.dataset.drag,x:e.clientX,y:e.clientY,on:false,touch:e.pointerType!=="mouse",t0:Date.now(),pid:e.pointerId};
  if(dg.touch)dg.timer=setTimeout(()=>{if(dg&&!dg.on)startDg(dg.x,dg.y)},280)});
function dgInfo(id){if(id.startsWith("b:")){const b=state.beurten.find(x=>x.id===id.slice(2))||{};const k=state.klanten.find(x=>x.id===b.klantId)||{};return{k,du:Number(b.duur)||duur(k),adr:jobAddrObj(k).adres||cleanName(b.klantNaam||k.naam||""),prijs:b.bedrag}}
  const k=state.klanten.find(x=>x.id===id)||{};return{k,du:duur(k),adr:jobAddrObj(k).adres||cleanName(k.naam||""),plaats:jobAddrObj(k).plaats||k.plaats||"",prijs:k.prijs}}
function startDg(x,y){if(!dg)return;dg.on=true;const r=vpR(dg.j),inf=dgInfo(dg.id);dg.inf=inf;
  const tile=dg.j.querySelector(".kc-tile");
  const g=document.createElement("div");g.className="dg-ghost dg-card";
  let tl=I.cal2;if(tile){const m=tile.querySelector(".kc-m"),bb=tile.querySelector("b"),KL={ok:"#3c9a6a",attn:"#c2a227",warn:"#e28c1c",soon:"#e28c1c",crit:"#e2571f",late:"#cc2f2f",nieuw:"#137a8a",plan:"#2e9a6b",gemist:"#cc2f2f"},kc=[...dg.j.classList].map(c=>c.replace(/^kx-/,"")).find(c=>KL[c]);tl=`<span class="dg-t"><i style="background:${KL[kc]||"var(--brand)"}">${esc(m?m.textContent:"")}</i><b>${bb?bb.innerHTML:""}</b></span>`}
  g.innerHTML=`<span class="dg-tile${tile?" t":""}">${tl}</span><span class="dg-tx"><b>${esc(inf.adr||"Afspraak")}</b><small>${inf.plaats?esc(inf.plaats)+" · ":""}${inf.du} min${inf.prijs?" · "+eur0(toon(inf.prijs)):""}</small></span>`;
  document.body.appendChild(g);
  dg.dx=Math.min(x-r.left,40);dg.dy=Math.min(y-r.top,28);dg.g=g;dg.cx=r.left;dg.cy=r.top;dg.tx=x-dg.dx;dg.ty=y-dg.dy;dg.vx=0;
  g.style.transform=`translate3d(${r.left}px,${r.top}px,0) scale(.96)`;requestAnimationFrame(()=>g.classList.add("op"));
  const loop=()=>{if(!dg||!dg.on||dg.g!==g)return;const ox=dg.cx;dg.cx+=(dg.tx-dg.cx)*.38;dg.cy+=(dg.ty-dg.cy)*.38;dg.vx=dg.vx*.8+(dg.cx-ox)*.2;
    const rot=Math.max(-7,Math.min(7,dg.vx*.6));g.style.transform=`translate3d(${dg.cx}px,${dg.cy}px,0) rotate(${rot}deg) scale(1.02)`;dg.raf=requestAnimationFrame(loop)};dg.raf=requestAnimationFrame(loop);
  dg.j.classList.add("dragging");document.body.classList.add("dg-busy");if(navigator.vibrate&&dg.touch)try{navigator.vibrate(15)}catch(_){}}
/* voorbeeldblok op de plek waar de afspraak komt */
function dgPreview(c){let p=document.getElementById("dgPrev");
  if(!c||!c.classList.contains("tslot")){if(p)p.remove();return}
  const col=c.parentElement;if(!p){p=document.createElement("div");p.id="dgPrev";p.className="dg-prev"}
  if(p.parentElement!==col){col.appendChild(p);p.style.transition="none";requestAnimationFrame(()=>p.style.transition="")}
  const H=c.offsetHeight,slot=state.slot||30,du=(dg&&dg.inf&&dg.inf.du)||30,t=c.dataset.tijd,m=toMin(t);
  p.style.top=(c.offsetTop+3)+"px";p.style.height=Math.max(H-6,du/slot*H-6)+"px";
  const key=t+"|"+du;if(p.dataset.k!==key){p.dataset.k=key;p.innerHTML=`<b>${esc(t)} – ${esc(fromMin(m+du))}</b><span>${esc((dg&&dg.inf&&dg.inf.adr)||"")}</span>`}}
document.addEventListener("pointermove",e=>{if(!dg)return;const dx=e.clientX-dg.x,dy=e.clientY-dg.y;
  if(!dg.on){if(dg.touch){if(Math.hypot(dx,dy)>10){clearTimeout(dg.timer);dg=null}return}if(Math.hypot(dx,dy)<6)return;startDg(dg.x,dg.y)}
  e.preventDefault();dg.tx=e.clientX-dg.dx;dg.ty=e.clientY-dg.dy;
  const c=dropAt(e.clientX,e.clientY);document.querySelectorAll(".over").forEach(x=>x!==c&&x.classList.remove("over"));if(c)c.classList.add("over");
  dgPreview(c);dg.g.classList.toggle("ok",!!c);
  dgAuto(e.clientY)},{passive:false});
/* automatisch scrollen tijdens slepen: zone onder de kopbalk en boven de tabbalk, sneller naarmate je dichter bij de rand komt (nodig op de telefoon om van de lijst naar de agenda te slepen) */
function dgAuto(y){if(!dg)return;dg.ay=y;if(dg.araf)return;const stap=()=>{if(!dg||!dg.on){if(dg)dg.araf=0;return}
  const tb=document.querySelector(".topbar"),nb=document.getElementById("tabNav"),top=(tb&&getComputedStyle(tb).display!=="none"?tb.getBoundingClientRect().bottom:0),bot=nb&&getComputedStyle(nb).display!=="none"?nb.getBoundingClientRect().top:innerHeight;
  const Z=110,sc=document.scrollingElement;let v=0;if(dg.ay<top+Z)v=-Math.min(28,4+(top+Z-dg.ay)*.25);else if(dg.ay>bot-Z)v=Math.min(28,4+(dg.ay-(bot-Z))*.25);
  if(v){sc.scrollTop+=v;const c=dropAt(dg.tx+dg.dx,dg.ay);document.querySelectorAll(".over").forEach(x=>x!==c&&x.classList.remove("over"));if(c)c.classList.add("over");dgPreview(c)}
  dg.araf=requestAnimationFrame(stap)};dg.araf=requestAnimationFrame(stap)}
document.addEventListener("touchmove",e=>{if(dg&&dg.on)e.preventDefault()},{passive:false});
const endDg=(e,cancel)=>{if(!dg)return;clearTimeout(dg.timer);const d=dg;dg=null;if(!d.on)return;cancelAnimationFrame(d.raf);
  const p=document.getElementById("dgPrev"),c=cancel?null:dropAt(e.clientX,e.clientY);
  d.j.classList.remove("dragging");document.body.classList.remove("dg-busy");document.querySelectorAll(".over").forEach(x=>x.classList.remove("over"));
  const stop=ev=>{ev.stopPropagation();ev.preventDefault()};document.addEventListener("click",stop,{capture:true,once:true});setTimeout(()=>document.removeEventListener("click",stop,{capture:true}),50);
  /* landen: de zwevende kaart glijdt in het voorbeeldblok, anders terug naar waar hij vandaan kwam */
  const g=d.g;g.classList.add("land");
  if(c&&p){const r=vpR(p);g.style.transform=`translate3d(${r.left}px,${r.top}px,0) scale(.98)`;g.style.width=r.width+"px";g.classList.add("in")}
  else if(!c){const r=vpR(d.j);g.style.transform=`translate3d(${r.left}px,${r.top}px,0) scale(.9)`;g.style.opacity="0"}
  else{g.style.opacity="0";g.style.transform+=" scale(.9)"}
  setTimeout(()=>{g.remove();if(p)p.remove()},c&&p?230:200);
  if(!c)return;state.flash=d.id.startsWith("b:")?"":d.id;setTimeout(()=>{state.flash="";document.querySelectorAll(".just-in").forEach(x=>x.classList.remove("just-in"))},1400);
  setTimeout(()=>{if(d.id.startsWith("b:"))beurtVerplaatsen(d.id.slice(2),c.dataset.drop,c.dataset.tijd);else moveTo(d.id,c.dataset.drop,c.dataset.tijd)},c&&p?160:0)};
document.addEventListener("pointerup",e=>endDg(e,false));document.addEventListener("pointercancel",e=>endDg(e,true));
// vegen
let sw=null;
document.addEventListener("pointerdown",e=>{const c=e.target.closest&&e.target.closest(".swipe-card");if(!c||e.button>0||c.parentElement.dataset.done)return;if(e.target.closest("button,a")&&e.target.closest("button,a")!==c)return;
  sw={c,p:c.parentElement,x:e.clientX,y:e.clientY,dx:0,on:false,w:c.offsetWidth,pid:e.pointerId}});
document.addEventListener("pointermove",e=>{if(!sw||e.pointerId!==sw.pid)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;
  if(!sw.on){if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.3){sw.on=true;try{sw.c.setPointerCapture(e.pointerId)}catch(_){}sw.c.style.transition="none"}else if(Math.abs(dy)>10){sw=null;return}else return}
  sw.dx=dx;sw.c.style.transform="translateX("+dx+"px)";sw.p.dataset.dir=dx<0?"left":"right";sw.p.classList.toggle("armed",Math.abs(dx)>Math.min(120,sw.w*.33))});
const endSw=()=>{if(!sw)return;const s=sw;sw=null;if(!s.on)return;swAt=Date.now();s.c.style.transition="";
  if(Math.abs(s.dx)>Math.min(120,s.w*.33)){s.c.style.transform="translateX("+(s.dx<0?-s.w-40:s.w+40)+"px)";const k=K(s.p.dataset.id);if(k)setTimeout(()=>afronden(k,s.dx<0?"open":"concept",s.p),200)}
  else{s.c.style.transform="";s.p.classList.remove("armed")}};
document.addEventListener("pointerup",endSw);document.addEventListener("pointercancel",endSw);
let wasBig=big();addEventListener("resize",()=>{const b=big();if(b!==wasBig){wasBig=b;schedule()}});
setInterval(()=>{if(!dlg.open&&(state.tab==="planning"||state.tab==="vandaag"))schedule()},60000);
setInterval(()=>{document.querySelectorAll("[data-timer]").forEach(el=>{const t=new Date(el.dataset.timer);if(!isNaN(t))el.textContent=fmtTimer(Date.now()-t)});document.querySelectorAll("[data-tmin]").forEach(el=>{const t=new Date(el.dataset.tmin);if(!isNaN(t))el.textContent=Math.floor((Date.now()-t)/60000)+" min"});document.querySelectorAll("[data-tpct]").forEach(el=>{const t=new Date(el.dataset.tpct),ex=Number(el.dataset.exp)||30;if(isNaN(t))return;const f=(Date.now()-t)/60000/ex;el.textContent=Math.min(999,Math.round(f*100))+"%";el.classList.toggle("over",f>1)});document.querySelectorAll("[data-ton]").forEach(el=>{const t=new Date(el.dataset.ton),ex=Number(el.dataset.exp)||30;if(isNaN(t))return;const f=(Date.now()-t)/60000/ex;el.style.setProperty("--p",Math.min(1,Math.max(0,f)).toFixed(3));el.classList.toggle("over",f>1)});document.querySelectorAll("[data-tbar]").forEach(el=>{const t=new Date(el.dataset.tbar),ex=Number(el.dataset.exp)||30;if(isNaN(t))return;const f=(Date.now()-t)/60000/ex;el.style.width=Math.min(100,f*100)+"%";el.classList.toggle("over",f>1)})},1000);
render();init();

/* knop "in te plannen" weg zodra de lijst onder de agenda in beeld is */
addEventListener("scroll",()=>{const m=document.getElementById("mobOffer");document.body.classList.toggle("mo-zicht",!!m&&m.getBoundingClientRect().top<innerHeight-120)},{passive:true});
/* iPhone/iPad: zonder touchstart-luisteraar toont Safari geen ingedrukte knop (:active). Dan voelt een tik alsof er niets gebeurt. */
if(typeof document!=="undefined")document.addEventListener("touchstart",()=>{},{passive:true});
/* zuinig: oneindige "puls"-animaties met een schaduw laten de telefoon elk beeldje opnieuw tekenen, de hele tijd.
   Daardoor reageren knoppen trager en gaat de accu harder leeg. Ze pulsen nu een paar keer en staan daarna stil. */
const PULS_SCHADUW=new Map();
function pulsTemmen(){try{if(typeof document.getAnimations!=="function")return;document.getAnimations().forEach(a=>{const ef=a.effect;if(!ef||!ef.getTiming||ef.getTiming().iterations!==Infinity)return;
  const n=a.animationName||"";let s=PULS_SCHADUW.get(n);if(s===undefined){try{s=ef.getKeyframes().some(k=>"boxShadow" in k||"width" in k||"background" in k||"backgroundColor" in k||"filter" in k)}catch(e){s=false}if(n)PULS_SCHADUW.set(n,s)}
  if(s)ef.updateTiming({iterations:3})})}catch(e){}}
if(typeof window!=="undefined"){window.addEventListener("load",()=>setTimeout(pulsTemmen,500));setInterval(pulsTemmen,2000)}
