/* ---------- KWALITEIT: elke afspraak op sterrenniveau ----------
   Zoals een driesterrenrestaurant: geen bord de zaal in zonder controle, elke gast vooraf kennen,
   stipt op tijd, een klacht dezelfde dag rechtzetten en elke dag meten of het niveau gehaald wordt.
   1 Eindcontrole bij afmelden (punten + opleverfoto + wat viel op)      → beurt.kwaliteit, klant.bezoekNotitie
   2 Herstel: lage beoordeling of afgekeurde controle → melding tot opgelost → beurt.herstel
   3 Stiptheid: aankomstvenster rond de geplande tijd, alleen intern (geen bericht naar de klant)
   4 Briefing bij Start: wat je moet weten, met "Gezien"                    → beurt.briefGezien
   5 Kwaliteitsscore: Statistieken › Kwaliteit, per week en per medewerker
   6 Kleine gebaren: jubileum en mijlpaal staan klaar in Communicatie; jij beslist of ze weggaan */
const KW_GLAS=["Geen strepen of druppels","Kozijnen en dorpels droog","Alles teruggezet (bloempotten, matten)","Poort en hek weer dicht"];
const KW_ALG=["Alles schoon en droog opgeleverd","Spullen weer op hun plek","Afval meegenomen","Deur en poort weer dicht"];
const KW={groep:{},gezien:{}};
const kwS=()=>(typeof S==="function"&&S())||{};
const kwPunten=()=>{const t=kwS().kwPunten;return Array.isArray(t)&&t.length?t:(typeof GLAS==="function"&&GLAS()?KW_GLAS:KW_ALG)};
const kwVenster=()=>Math.max(5,Math.min(120,Number(kwS().kwVenster)||15));
const kwDrempel=()=>Math.min(4,Math.max(1,Number(kwS().kwDrempel)||3));
const kwTest=()=>typeof LIVE!=="undefined"&&!LIVE&&/[?&]selftest\b/.test(location.search)&&!/[?&]kwtoon\b/.test(location.search);
const kwHm=x=>{const d=new Date(x);return isNaN(d)?"":String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const kwNaam=k=>cleanName((k&&k.naam)||"");

/* ---------- 3. stiptheid ---------- */
/* minuten te laat t.o.v. de geplande tijd (negatief = eerder); null zonder vaste tijd of zonder starttijd */
function kwLaat(b){const p=toMin(b&&b.tijd);if(p==null||!b.startOp)return null;const d=new Date(b.startOp);if(isNaN(d))return null;return d.getHours()*60+d.getMinutes()-p}
function kwOpTijd(b){const l=kwLaat(b);return l==null?null:l<=kwVenster()}

/* ---------- 4. briefing bij Start ---------- */
function kwBriefRegels(k){const hl=typeof hospList==="function"?hospList(k):[],R=[];
  const cat=[["aankomst","Aankomst en toegang",I.lock],["dier","Huisdieren",I.paw||I.alert],["letop","Let op",I.alert],["voorkeur","Voorkeur",I.heart||I.note]];
  const n=k.bezoekNotitie;if(n&&n.t)R.push({ic:I.note,l:"Vorige keer opgevallen"+(n.door?" · "+n.door:""),t:n.t,pri:1});
  cat.forEach(([c,l,ic])=>{const x=hl.filter(y=>y.c===c);if(x.length)R.push({ic,l,t:x.map(y=>y.t).join(" · ")})});
  const praat=hl.filter(x=>x.c==="verteld"&&(typeof hospNu!=="function"||hospNu(x)));if(praat.length)R.push({ic:I.chat||I.note,l:"Ter sprake brengen",t:praat.map(x=>x.t).join(" · ")});
  if(typeof ov2Klacht==="function"&&ov2Klacht(k))R.unshift({ic:I.alert,l:"Extra aandacht",t:"Deze klant was onlangs niet tevreden. Lever vandaag extra zorgvuldig op.",pri:1});
  const lb=(state.beurten||[]).filter(b=>b.klantId===k.id&&b.beoordeling&&Number(b.beoordeling.sterren)>0).sort((a,b)=>String(b.datum).localeCompare(String(a.datum)))[0];
  if(lb&&Number(lb.beoordeling.sterren)<=kwDrempel()&&!R.some(r=>r.l==="Extra aandacht"))R.unshift({ic:I.alert,l:"Extra aandacht",t:`Gaf het vorige bezoek ${lb.beoordeling.sterren} ${Number(lb.beoordeling.sterren)===1?"ster":"sterren"}${lb.beoordeling.tekst?": “"+String(lb.beoordeling.tekst).slice(0,140)+"”":""}. Lever vandaag extra zorgvuldig op.`,pri:1});
  return R}
function kwBriefing(k){return new Promise(res=>{try{
  if(kwTest()||kwS().kwBriefing===false)return res(true);
  const R=kwBriefRegels(k);if(!R.length)return res(true);
  const d=document.createElement("dialog");d.className="vraag-dlg";
  d.innerHTML=`<div class="vraag-ov"><div class="skz kwb" role="alertdialog" aria-modal="true" aria-labelledby="kwbT">
    <div class="skz-kop"><span class="skz-ic">${I.user||I.klanten}</span><div><h3 id="kwbT">Voor je aanbelt</h3><p>${esc(kwNaam(k))}${k.tijd?" · "+esc(k.tijd):""}</p></div></div>
    <div class="kwb-l">${R.map(r=>`<div class="kwb-r${r.pri?" pri":""}"><span class="kwb-ic">${r.ic||""}</span><span><small>${esc(r.l)}</small><b>${esc(r.t)}</b></span></div>`).join("")}</div>
    <div class="skz-k"><button type="button" class="ghost" data-kb="x">Annuleren</button><button type="button" class="primary" data-kb="ok">${I.check}<span>Gezien, start</span></button></div></div></div>`;
  document.body.appendChild(d);d.showModal();const weg=v=>{try{d.close()}catch(_){}d.remove();res(v)};
  d.addEventListener("cancel",e=>{e.preventDefault();weg(null)});
  d.addEventListener("click",e=>{const b=e.target.closest("[data-kb]");if(!b)return;if(b.dataset.kb==="x")return weg(null);KW.gezien[k.id]=new Date().toISOString();weg(true)})
}catch(e){console.error(e);res(true)}})}

/* ---------- 1. eindcontrole bij afmelden ---------- */
/* geeft {beurt,klant} terug om mee op te slaan, of null als je annuleert */
function kwControle(k){return new Promise(res=>{try{
  const extra=()=>({...(KW.gezien[k.id]?{briefGezien:KW.gezien[k.id]}:{})});
  const klaar=v=>{if(v)delete KW.gezien[k.id];res(v)};
  if(kwTest()||kwS().kwAan===false||k.soort==="vve")return klaar({beurt:extra(),klant:{}});
  /* flat: één controle voor alle woningen van dezelfde Start */
  const g=k.bezigGroep&&KW.groep[k.bezigGroep];if(g&&Date.now()-g.t<30*60e3)return klaar({beurt:{...g.beurt,...extra()},klant:{...g.klant}});
  const punten=kwPunten(),ok=punten.map(()=>false),fotos=[],verplicht=kwS().kwFoto==="verplicht";let bezig=false,notitie="";
  const dg=document.createElement("dialog");dg.className="vraag-dlg";const o=document.createElement("div");o.className="vraag-ov";dg.appendChild(o);
  const weg=v=>{try{dg.close()}catch(_){}dg.remove();klaar(v)};dg.addEventListener("cancel",e=>{e.preventDefault();weg(null)});
  const teken=()=>{const alle=ok.every(Boolean);
    o.innerHTML=`<div class="rk vve-op kwc" role="dialog" aria-modal="true" aria-label="Eindcontrole">
    <div class="rk-h"><span class="objic">${I.check}</span><div><b>Eindcontrole · ${esc(kwNaam(k))}</b><small>Loop het nog één keer na voordat je vertrekt. Vink af wat in orde is.</small></div><button type="button" class="iconbtn sm" data-kx aria-label="Sluiten">${I.x}</button></div>
    <div class="vve-lijst">${punten.map((t,i)=>`<label class="vve-t"><input type="checkbox" data-kp="${i}" ${ok[i]?"checked":""}><span><i>${I.check}</i>${esc(t)}</span></label>`).join("")}</div>
    <button type="button" class="kwc-alles" data-kal ${alle?"hidden":""}>${I.check}Alles in orde</button>
    <div class="vve-foto"><div class="vve-fh"><span class="eyebrow">${I.camera}Opleverfoto${verplicht?"":" (optioneel)"}</span><label class="btn small bv-cam${state.assets?"":" dis"}">${I.camera}${fotos.length?"Nog een foto":"Foto maken"}<input type="file" accept="image/*" capture="environment" hidden data-kfoto></label></div>
      ${fotos.length?`<div class="vve-fl">${fotos.map((f,i)=>`<span><img src="${f.url}" alt=""><button type="button" class="iconbtn sm" data-kdel="${i}" aria-label="Verwijderen">${I.x}</button></span>`).join("")}</div>`:`<small class="help">Eén foto van het resultaat. De klant ziet hem terug bij dit bezoek in het klantportaal.</small>`}</div>
    <label>Wat viel je op? (optioneel)<input data-knot value="${esc(notitie)}" placeholder="Bijv. dakgoot zit vol, volgende keer melden"><small class="help">Komt terug in de briefing bij het volgende bezoek.</small></label>
    <div class="rk-f"><button type="button" class="ghost" data-kx>Annuleren</button><span class="sp"></span><button type="button" class="primary" data-kok ${bezig?"disabled":""}>${I.check}Afmelden</button></div></div>`;
    o.querySelectorAll("[data-kx]").forEach(b=>b.onclick=()=>weg(null));
    o.querySelectorAll("[data-kp]").forEach(c=>c.onchange=()=>{ok[+c.dataset.kp]=c.checked;const a=o.querySelector("[data-kal]");if(a)a.hidden=ok.every(Boolean)});
    o.querySelector("[data-kal]").onclick=()=>{ok.fill(true);notitie=o.querySelector("[data-knot]").value;teken()};
    o.querySelector("[data-knot]").oninput=e=>{notitie=e.target.value};
    o.querySelector("[data-kfoto]").onchange=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f||!state.assets)return;bezig=true;teken();
      try{const r=await state.assets.upload(f);fotos.push({id:r.id,url:URL.createObjectURL(f),op:new Date().toISOString()})}catch(er){toast("De foto kon niet worden geüpload")}bezig=false;teken()};
    o.querySelectorAll("[data-kdel]").forEach(b=>b.onclick=()=>{fotos.splice(Number(b.dataset.kdel),1);teken()});
    o.querySelector("[data-kok]").onclick=async()=>{
      if(verplicht&&!fotos.length&&state.assets){toast("Maak eerst een opleverfoto");return}
      const nee=punten.filter((_,i)=>!ok[i]);
      if(nee.length){const a=await vraag("Niet alles in orde?",`Niet afgevinkt: <b>${nee.map(esc).join(", ")}</b>.<br>Is dat echt niet in orde? Dan krijgt kantoor een melding om het recht te zetten.`,"Ja, melden","Terug");if(a!==true)return}
      const t=notitie.trim().slice(0,300),nu=new Date().toISOString();
      const uit={beurt:{kwaliteit:{punten:punten.map((p,i)=>({naam:p,ok:ok[i]})),fotos:fotos.map(f=>({id:f.id,op:f.op})),op:nu},...(t?{bezoekNotitie:t}:{})},
        klant:{bezoekNotitie:t?{t,datum:iso(today()),door:typeof doorNaam==="function"?doorNaam():""}:""}};
      if(k.bezigGroep)KW.groep[k.bezigGroep]={...uit,t:Date.now()};
      weg({beurt:{...uit.beurt,...extra()},klant:uit.klant})}};
  document.body.appendChild(dg);teken();try{dg.showModal()}catch(_){dg.setAttribute("open","")}
}catch(e){console.error(e);res({beurt:{},klant:{}})}})}

/* ---------- 2. herstel ---------- */
const kwAfgekeurd=b=>!!(b&&b.kwaliteit&&(b.kwaliteit.punten||[]).some(p=>p&&p.ok===false));
const kwLaag=b=>{const s=b&&b.beoordeling&&Number(b.beoordeling.sterren);return s>0&&s<=kwDrempel()};
function kwHerstelLijst(){const g=iso(addDays(today(),-60));
  return (state.beurten||[]).filter(b=>b.datum>=g&&!b.geannuleerd&&(kwLaag(b)||kwAfgekeurd(b))&&!(b.herstel&&b.herstel.status==="opgelost"))}
function kwSignalen(add,bel){if(isMw())return;const nu=new Date(),ti=iso(today());
  kwHerstelLijst().forEach(b=>{const k=state.klanten.find(x=>x.id===b.klantId)||{naam:b.klantNaam},h=b.herstel||{},laag=kwLaag(b),gb=h.status==="gebeld";
    const wat=laag?`gaf ${b.beoordeling.sterren} ${Number(b.beoordeling.sterren)===1?"ster":"sterren"}`:"eindcontrole niet in orde";
    const tx=laag&&b.beoordeling.tekst?` “${String(b.beoordeling.tekst).slice(0,120)}”`:!laag?" Niet in orde: "+(b.kwaliteit.punten||[]).filter(p=>!p.ok).map(p=>p.naam.toLowerCase()).join(", ")+".":"";
    const uur=Math.max(0,Math.round((nu-new Date(String((b.beoordeling&&b.beoordeling.op)||b.op||b.datum+"T12:00")))/36e5));
    add({key:"kwh:"+b.id+":"+(h.status||"open"),p:gb?"hoog":laag?"kritiek":"hoog",top:1,ic:"alert",t:gb?`Herstel loopt: ${cleanName(k.naam||"")}`:`Herstel: ${cleanName(k.naam||"")} ${wat}`,
      u:(gb?`Gebeld ${fmtD(String(h.gebeldOp).slice(0,10))}. Plan zo nodig kosteloos nawerk en zet het daarna op opgelost.`:`Bezoek van ${fmtD(b.datum)}${b.door?" door "+b.door:""}.${tx} Bel ${uur<24?"vandaag nog":"zo snel mogelijk"} en zet het recht.`),
      b:[k.adres,k.plaats].filter(Boolean).join(", "),leeftijd:Math.round(uur/24),knop:"Open klant",go:k.id?"klant:"+k.id:"",
      acts:gb?[{l:"Nawerk plannen",ic:"planning",cc:"klant:"+k.id},{l:"Opgelost",ic:"check",cc:"kw:opgelost:"+b.id}]:[bel(k),{l:"Gebeld",ic:"check",cc:"kw:gebeld:"+b.id},{l:"Opgelost",ic:"check",cc:"kw:opgelost:"+b.id}].filter(Boolean)})});
  /* 3. stiptheid: nog niet gestart terwijl het aankomstvenster bijna of al voorbij is (alleen voor jou, de klant krijgt niets) */
  if(kwS().kwStipt===false||typeof routeStops!=="function")return;const nm=nu.getHours()*60+nu.getMinutes(),v=kwVenster();
  routeStops(ti).filter(x=>!x.done&&!x.k.bezig).forEach(({k})=>{const m=toMin(k.tijd);if(m==null||nm<m+v-10)return;const te=nm>m+v,eind=fromMin(m+v);
    add({key:"kwl:"+k.id+":"+ti,p:te?"kritiek":"hoog",ic:"clock",t:te?`Te laat: ${cleanName(k.naam)} (${k.tijd})`:`Dreigt te laat: ${cleanName(k.naam)} (${k.tijd})`,
      u:te?`Het aankomstvenster liep tot ${eind}. Bel de klant zelf even; er gaat geen automatisch bericht.`:`Nog niet gestart. Het aankomstvenster loopt tot ${eind}.`,
      b:[jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "),leeftijd:0,knop:"Open klant",go:"klant:"+k.id,acts:[bel(k)].filter(Boolean)})})}
async function kwActie(v){const [w,id]=String(v||"").split(":"),b=(state.beurten||[]).find(x=>x.id===id);if(!b)return;const h=b.herstel||{},nu=new Date().toISOString();
  try{if(w==="gebeld"){await save("beurten",b.id,{...strip(b),herstel:{...h,status:"gebeld",gebeldOp:nu,door:doorNaam()}});toast("Genoteerd: klant gebeld");render();return}
    if(w==="opgelost"){const a=await vraag("Herstel afronden","Was er nawerk nodig om het recht te zetten? Dat telt mee in je kwaliteitsscore.","Ja, nawerk gedaan","Nee, opgelost zonder nawerk");if(a===null||a===undefined)return;
      await save("beurten",b.id,{...strip(b),herstel:{...h,status:"opgelost",opgelostOp:nu,nawerk:a===true,door:doorNaam()}});toast("Herstel afgerond");render()}}catch(e){err(e)}}

/* ---------- 5. kwaliteitsscore (Statistieken › Kwaliteit) ---------- */
function kwCijfers(L){const n=L.length,tijd=L.map(kwOpTijd).filter(x=>x!=null),st=L.filter(b=>b.beoordeling&&Number(b.beoordeling.sterren)>0),ctl=L.filter(b=>b.kwaliteit);
  return {n,opTijd:tijd.length?Math.round(tijd.filter(Boolean).length/tijd.length*100):null,tijdN:tijd.length,
    sterren:st.length?Math.round(st.reduce((a,b)=>a+Number(b.beoordeling.sterren),0)/st.length*10)/10:null,sterN:st.length,
    klacht:n?Math.round(L.filter(b=>kwLaag(b)||kwAfgekeurd(b)).length/n*1000)/10:null,klachtN:L.filter(b=>kwLaag(b)||kwAfgekeurd(b)).length,
    nawerk:L.filter(b=>b.herstel&&b.herstel.nawerk).length,
    controle:ctl.length?Math.round(ctl.filter(b=>!kwAfgekeurd(b)).length/ctl.length*100):null,ctlN:ctl.length,
    brief:L.filter(b=>b.briefGezien).length}}
function vKwaliteit(P,V){const t=today(),inP=rg=>(state.beurten||[]).filter(b=>!b.geannuleerd&&inRange(b.datum,rg));
  const A=kwCijfers(inP(P.rg)),B=kwCijfers(inP(V.rg)),pct=x=>x==null?"—":x+"%",kom=x=>String(x).replace(".",",");
  const pijl=(a,b,hoog=true)=>a==null||b==null||a===b?"":`<span class="st-pill ${(a>b)===hoog?"up":"down"}">${a>b?"▲":"▼"} vorige ${esc(V.lbl)}</span>`;
  const tiles=`<div class="st-tiles">
    ${stTile(I.clock,"Op tijd",pct(A.opTijd),(A.tijdN?`binnen ${kwVenster()} min · ${A.tijdN} bezoeken `:"nog geen bezoeken met vaste tijd ")+pijl(A.opTijd,B.opTijd))}
    ${stTile(I.ster||I.spark,"Beoordeling",A.sterren==null?"—":kom(A.sterren)+" / 5",(A.sterN?plural(A.sterN,"beoordeling","beoordelingen")+" ":"nog geen beoordelingen ")+pijl(A.sterren,B.sterren))}
    ${stTile(I.check,"Eindcontrole in orde",pct(A.controle),A.ctlN?plural(A.ctlN,"controle","controles"):"nog geen controles")}
    ${stTile(I.alert,"Klachten per 100",A.klacht==null?"—":kom(A.klacht),(A.klachtN?plural(A.klachtN,"keer","keer")+(A.nawerk?" · "+A.nawerk+"× nawerk":"")+" ":"niets gemeld ")+pijl(A.klacht,B.klacht,false))}</div>`;
  /* per week: % op tijd en gemiddelde sterren, laatste 12 weken */
  const ma=d=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x},w0=ma(t);
  const wk=[...Array(12)].map((_,i)=>{const s=addDays(w0,(i-11)*7),c=kwCijfers(inP([s,addDays(s,6)]));return{l:String(weekNr(s)),c}});
  const week=`<section class="st-card"><div class="st-ch"><div><h3>Op tijd per week</h3><p>Laatste 12 weken · gestart binnen ${kwVenster()} minuten na de geplande tijd</p></div></div>
    ${wk.some(w=>w.c.opTijd!=null)?stBars(wk.map(w=>w.c.opTijd||0),wk.map(w=>w.l),{hi:11,fmt:v=>Math.round(v)+"%",h:180,gem:false}):'<p class="st-leeg">Zodra er bezoeken met een vaste tijd zijn afgemeld, zie je hier per week hoe stipt je was.</p>'}</section>`;
  /* per medewerker */
  const per={};inP(P.rg).forEach(b=>{const w=String(b.door||"Onbekend");(per[w]=per[w]||[]).push(b)});
  const rijen=Object.entries(per).map(([w,L])=>[w,kwCijfers(L)]).sort((a,b)=>b[1].n-a[1].n);
  const mw=`<section class="st-card"><div class="st-ch"><div><h3>Per medewerker</h3><p>${esc(P.lbl)}</p></div></div>
    ${rijen.length?`<div class="kwq-t"><div class="kwq-r kwq-h"><span>Medewerker</span><span>Bezoeken</span><span>Op tijd</span><span>Sterren</span><span>Controle</span><span>Klachten</span></div>
      ${rijen.map(([w,c])=>`<div class="kwq-r"><b>${esc(w)}</b><span>${c.n}</span><span>${pct(c.opTijd)}</span><span>${c.sterren==null?"—":kom(c.sterren)}</span><span>${pct(c.controle)}</span><span class="${c.klachtN?"kwq-rood":""}">${c.klachtN}</span></div>`).join("")}</div>`
      :'<p class="st-leeg">Nog geen afgemelde bezoeken in deze periode.</p>'}</section>`;
  const open=kwHerstelLijst();
  const herstel=`<section class="st-card"><div class="st-ch"><div><h3>Herstel</h3><p>Lage beoordelingen en eindcontroles die niet in orde waren</p></div></div>
    ${open.length?`<div class="kwq-t">${open.map(b=>`<div class="kwq-r kwq-h2" data-act="klant" data-id="${esc(b.klantId)}" role="button"><b>${esc(cleanName(b.klantNaam||""))}</b><span>${esc(fmtD(b.datum))}</span><span>${kwLaag(b)?b.beoordeling.sterren+" ★":"controle"}</span><span>${(b.herstel||{}).status==="gebeld"?"gebeld":"open"}</span></div>`).join("")}</div>`
      :`<p class="st-leeg">${I.check} Niets open. Alles is rechtgezet.</p>`}</section>`;
  return `${tiles}${week}<div class="st-two">${mw}${herstel}</div>`}

/* ---------- 6. kleine gebaren ---------- */
const KW_MIJL=[10,25,50,100,150,200];
/* klant sinds: de vroegste van aanmaakdatum en eerste bezoek (bij overgezette klanten is de aanmaakdatum de importdatum) */
function kwIdx(){const B=state.beurten||[];if(KW.idxB===B&&KW.idxN===B.length)return KW.idx;const m={};B.forEach(b=>{if(b&&b.klantId&&b.datum&&!b.geannuleerd)(m[b.klantId]=m[b.klantId]||[]).push(b)});
  Object.values(m).forEach(L=>L.sort((a,b)=>String(a.datum).localeCompare(String(b.datum))));KW.idx=m;KW.idxB=B;KW.idxN=B.length;return m}
function kwSinds(k){let d=String(k.aangemaakt||"").slice(0,10);const L=kwIdx()[k.id];if(L&&L.length&&(!d||L[0].datum<d))d=L[0].datum;return d}
function kwMijlpaal(k,dagen=3){const g=iso(addDays(today(),-dagen)),L=kwIdx()[k.id]||[];
  for(const n of KW_MIJL){const b=L[n-1];if(b&&b.datum>=g)return {n,b}}return null}
function kwMomenten(mom,t){if(kwS().kwGebaren===false)return;state.klanten.filter(k=>k.actief!==false&&!k.prospect&&!k.hoofdKlantId).forEach(k=>{const m=kwMijlpaal(k,7);if(m)mom.push({d:parse(m.b.datum),ic:"ster",t:`${ccNaam(k)}: ${m.n}e bezoek`,s:"Een bedankje staat klaar in Communicatie",k})})}

/* ---------- instellingen ---------- */
SETCARDS.push({id:"kwaliteit",t:"Kwaliteit & service",sub:"Eindcontrole, briefing, stiptheid en herstel",ic:"check",bg:"#252c3c",
  st:s=>s.kwAan===false?["soon","Staat uit"]:["ok","Aan"],
  rows:s=>[["Eindcontrole",s.kwAan===false?"Uit":plural(kwPunten().length,"punt","punten")+(s.kwFoto==="verplicht"?" + foto":"")],["Aankomstvenster",kwVenster()+" min"],["Herstel vanaf",kwDrempel()+" sterren of minder"]]});
SETEXTRA.kwaliteit=(c,s)=>{
  setDlg(c,`${info("Zoals in een sterrenrestaurant: niets gaat de deur uit zonder controle, je kent de klant voor je aanbelt, je bent stipt en een klacht zet je dezelfde dag recht. De cijfers zie je bij <b>Statistieken › Kwaliteit</b>.")}
    ${sec("Eindcontrole bij afmelden")}
    ${tgl("kwAan","Eindcontrole bij elk bezoek","Bij afmelden de punten hieronder nalopen, met opleverfoto en wat opviel. VvE's houden hun eigen checklist.",s.kwAan!==false)}
    <label class="full">Controlepunten (één per regel)<textarea id="kwPt" style="min-height:104px">${esc(kwPunten().join("\n"))}</textarea><small class="help">Kort en concreet. Wat niet is afgevinkt, wordt een melding om recht te zetten.</small></label>
    ${sel("kwFoto","Opleverfoto",s.kwFoto==="verplicht"?"verplicht":"optioneel",[["optioneel","Optioneel"],["verplicht","Verplicht"]],{help:"De klant ziet de foto terug bij het bezoek in het klantportaal."})}
    ${sec("Voor je aanbelt")}
    ${tgl("kwBriefing","Briefing bij Start","Bij Start eerst zien wat je moet weten: toegang, huisdieren, voorkeuren en wat vorige keer opviel. Alleen als er iets te melden is.",s.kwBriefing!==false)}
    ${sec("Stipt op tijd")}
    ${tgl("kwStipt","Melding als je te laat dreigt te komen","Alleen voor jou in het Overzicht. De klant krijgt niets automatisch.",s.kwStipt!==false)}
    ${inp("kwVenster","Aankomstvenster (minuten na de geplande tijd)",kwVenster(),{type:"number",t:"num",attrs:'min="5" max="120" step="5"'})}
    ${sec("Herstel")}
    ${sel("kwDrempel","Herstelmelding bij een beoordeling van",String(kwDrempel()),[["1","1 ster"],["2","2 sterren of minder"],["3","3 sterren of minder"],["4","4 sterren of minder"]],{help:"Rode melding in het Overzicht: bellen, zo nodig kosteloos nawerk, dan op opgelost."})}
    ${sec("Kleine gebaren")}
    ${tgl("kwGebaren","Jubileum en mijlpalen klaarzetten","Bij 1, 2, 3… jaar klant en bij het 10e, 25e, 50e bezoek staat een bedankje klaar in Communicatie. Jij beslist of het weggaat.",s.kwGebaren!==false)}`,{wide:false});
  bindSave(()=>{const t=$("#kwPt").value.split(/\n/).map(x=>x.trim()).filter(Boolean).slice(0,10),std=typeof GLAS==="function"&&GLAS()?KW_GLAS:KW_ALG;return{kwPunten:t.length&&t.join("|")!==std.join("|")?t:[],kwVenster:Math.max(5,Math.min(120,Number(($("[data-k=kwVenster]")||{}).value)||15))}})};
