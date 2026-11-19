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

/* ---------- eerste bezoek als ontvangst: extra tijd, kennismaking en vóórfoto's (alleen intern, in de opdracht) ---------- */
function kwEerste(k){if(!k||k.laatst||k.prospect)return false;if(k.eersteKeer!=null)return !!k.eersteKeer;return !(kwIdx()[k.id]||[]).length}
function kwEersteMin(k){const s=kwS(),m=s.kwEersteExtra==null?15:Math.max(0,Math.min(120,Number(s.kwEersteExtra)||0));return m&&kwEerste(k)?m:0}
/* gemeten tijd van het eerste bezoek zonder de kennismaking, zodat de geleerde vaste duur klopt */
function kwMeetMin(k,m){const x=kwEersteMin(k);return x&&m>x+5?m-x:m}
/* ---------- 4. briefing bij Start ---------- */
function kwBriefRegels(k){const hl=typeof hospList==="function"?hospList(k):[],R=[];
  const cat=[["aankomst","Aankomst en toegang",I.lock],["dier","Huisdieren",I.paw||I.alert],["letop","Let op",I.alert],["voorkeur","Voorkeur",I.heart||I.note]];
  if(kwEerste(k))R.push({ic:I.user||I.klanten,l:"Eerste kennismaking",t:"Stel jezelf voor, vraag naar wensen en bijzonderheden (toegang, huisdieren, aandachtspunten) en maak vóórfoto's.",pri:1});
  (Array.isArray(k.schades)?k.schades:[]).filter(x=>x&&x.status!=="afgehandeld").slice(-2).forEach(x=>R.push({ic:I.alert,l:"Schade "+fmtD(x.datum)+(x.door?" · "+x.door:""),t:x.tekst+" (nog niet afgehandeld)",pri:1}));
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
  const eerste=kwEerste(k),fotos=[];let bezig=false;
  const d=document.createElement("dialog");d.className="vraag-dlg";const o=document.createElement("div");o.className="vraag-ov";d.appendChild(o);
  const teken=()=>{o.innerHTML=`<div class="skz kwb" role="alertdialog" aria-modal="true" aria-labelledby="kwbT">
    <div class="skz-kop"><span class="skz-ic">${I.user||I.klanten}</span><div><h3 id="kwbT">${eerste?"Eerste bezoek":"Voor je aanbelt"}</h3><p>${esc(kwNaam(k))}${k.tijd?" · "+esc(k.tijd):""}</p></div></div>
    <div class="kwb-l">${R.map(r=>`<div class="kwb-r${r.pri?" pri":""}"><span class="kwb-ic">${r.ic||""}</span><span><small>${esc(r.l)}</small><b>${esc(r.t)}</b></span></div>`).join("")}</div>
    ${eerste?`<div class="vve-foto kwb-fo"><div class="vve-fh"><span class="eyebrow">${I.camera}Vóórfoto's</span><label class="btn small bv-cam${state.assets?"":" dis"}">${I.camera}${fotos.length?"Nog een foto":"Foto maken"}<input type="file" accept="image/*" capture="environment" hidden data-bfoto></label></div>
      ${fotos.length?`<div class="vve-fl">${fotos.map((f,i)=>`<span><img src="${f.url}" alt=""><button type="button" class="iconbtn sm" data-bdel="${i}" aria-label="Verwijderen">${I.x}</button></span>`).join("")}</div>`:""}
      <small class="help">Hoe het was vóór het eerste bezoek. Alleen voor jullie: de foto's komen in de opdracht, de klant ziet ze niet.</small></div>`:""}
    <div class="skz-k"><button type="button" class="ghost" data-kb="x">Annuleren</button><button type="button" class="primary" data-kb="ok" ${bezig?"disabled":""}>${I.check}<span>Gezien, start</span></button></div></div>`;
    const fi=o.querySelector("[data-bfoto]");if(fi)fi.onchange=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f||!state.assets)return;bezig=true;teken();
      try{const sz=typeof imgSize==="function"?await imgSize(f).catch(()=>({})):{},r=await state.assets.upload(f);fotos.push({id:r.id,url:URL.createObjectURL(f),w:sz.w||0,h:sz.h||0})}catch(er){toast("De foto kon niet worden geüpload")}bezig=false;teken()};
    o.querySelectorAll("[data-bdel]").forEach(b=>b.onclick=()=>{fotos.splice(Number(b.dataset.bdel),1);teken()})};
  document.body.appendChild(d);teken();d.showModal();const weg=v=>{try{d.close()}catch(_){}d.remove();res(v)};
  d.addEventListener("cancel",e=>{e.preventDefault();weg(null)});
  d.addEventListener("click",e=>{const b=e.target.closest("[data-kb]");if(!b)return;if(b.dataset.kb==="x")return weg(null);if(bezig)return;KW.gezien[k.id]=new Date().toISOString();
    /* vóórfoto's bij de opdracht (k.fotos): Start slaat de klant daarna op, dus meteen in het object en in de lijst zetten */
    if(fotos.length){const dg=iso(today()),nw=fotos.map((f,i)=>({id:f.id,naam:"Vóórfoto eerste bezoek"+(fotos.length>1?" "+(i+1):""),datum:dg,w:f.w,h:f.h,dots:[],voor:true}));
      k.fotos=[...(k.fotos||[]),...nw];const ix=state.klanten.findIndex(x=>x.id===k.id);if(ix>=0&&state.klanten[ix]!==k)state.klanten[ix]={...state.klanten[ix],fotos:[...(state.klanten[ix].fotos||[]),...nw]}}
    weg(true)})
}catch(e){console.error(e);res(true)}})}

/* ---------- 1. eindcontrole bij afmelden ---------- */
/* geeft {beurt,klant} terug om mee op te slaan, of null als je annuleert */
function kwControle(k){return new Promise(res=>{try{
  const extra=()=>({...(KW.gezien[k.id]?{briefGezien:KW.gezien[k.id]}:{})});
  const klaar=v=>{if(v)delete KW.gezien[k.id];res(v)};
  if(kwTest()||kwS().kwAan===false||k.soort==="vve")return klaar({beurt:extra(),klant:{}});
  /* flat: één controle voor alle woningen van dezelfde Start */
  const g=k.bezigGroep&&KW.groep[k.bezigGroep];if(g&&Date.now()-g.t<30*60e3)return klaar({beurt:{...g.beurt,...extra()},klant:{...g.klant}});
  const punten=kwPunten(),ok=punten.map(()=>false),fotos=[],sFotos=[],verplicht=kwS().kwFoto==="verplicht";let bezig=false,notitie="",schade=false,sTekst="";
  const dg=document.createElement("dialog");dg.className="vraag-dlg";const o=document.createElement("div");o.className="vraag-ov";dg.appendChild(o);
  const weg=v=>{try{dg.close()}catch(_){}dg.remove();klaar(v)};dg.addEventListener("cancel",e=>{e.preventDefault();weg(null)});
  const teken=()=>{const alle=ok.every(Boolean);
    o.innerHTML=`<div class="rk vve-op kwc" role="dialog" aria-modal="true" aria-label="Eindcontrole">
    <div class="rk-h"><span class="objic">${I.check}</span><div><b>Eindcontrole · ${esc(kwNaam(k))}</b><small>Loop het nog één keer na voordat je vertrekt. Vink af wat in orde is.</small></div><button type="button" class="iconbtn sm" data-kx aria-label="Sluiten">${I.x}</button></div>
    <div class="vve-lijst">${punten.map((t,i)=>`<label class="vve-t"><input type="checkbox" data-kp="${i}" ${ok[i]?"checked":""}><span><i>${I.check}</i>${esc(t)}</span></label>`).join("")}</div>
    <button type="button" class="kwc-alles" data-kal ${alle?"hidden":""}>${I.check}Alles in orde</button>
    <div class="vve-foto"><div class="vve-fh"><span class="eyebrow">${I.camera}Opleverfoto${verplicht?"":" (optioneel)"}</span><label class="btn small bv-cam${state.assets?"":" dis"}">${I.camera}${fotos.length?"Nog een foto":"Foto maken"}<input type="file" accept="image/*" capture="environment" hidden data-kfoto></label></div>
      ${fotos.length?`<div class="vve-fl">${fotos.map((f,i)=>`<span><img src="${f.url}" alt=""><button type="button" class="iconbtn sm" data-kdel="${i}" aria-label="Verwijderen">${I.x}</button></span>`).join("")}</div>`:`<small class="help">Eén foto van het resultaat. De klant ziet hem terug bij dit bezoek in het klantportaal.</small>`}</div>
    <div class="kwc-sch${schade?" open":""}">${schade?`<div class="vve-fh"><span class="eyebrow">${I.alert}Schade melden</span><button type="button" class="small ghost" data-ksch>Geen schade</button></div>
      <label>Wat is er beschadigd?<input data-kstx value="${esc(sTekst)}" placeholder="Bijv. kras op kozijn voorkant, plantenpot omgevallen"></label>
      <div class="vve-fh"><span class="eyebrow">${I.camera}Foto's van de schade</span><label class="btn small bv-cam${state.assets?"":" dis"}">${I.camera}${sFotos.length?"Nog een foto":"Foto maken"}<input type="file" accept="image/*" capture="environment" hidden data-ksfoto></label></div>
      ${sFotos.length?`<div class="vve-fl">${sFotos.map((f,i)=>`<span><img src="${f.url}" alt=""><button type="button" class="iconbtn sm" data-ksdel="${i}" aria-label="Verwijderen">${I.x}</button></span>`).join("")}</div>`:""}
      <small class="help">Kantoor krijgt direct een melding en belt de klant. Eerlijk melden voordat de klant het ontdekt. De klant ziet dit niet in het portaal.</small>`
      :`<button type="button" class="kwc-schk" data-ksch>${I.alert}Schade melden</button>`}</div>
    <label>Wat viel je op? (optioneel)<input data-knot value="${esc(notitie)}" placeholder="Bijv. dakgoot zit vol, volgende keer melden"><small class="help">Komt terug in de briefing bij het volgende bezoek.</small></label>
    <div class="rk-f"><button type="button" class="ghost" data-kx>Annuleren</button><span class="sp"></span><button type="button" class="primary" data-kok ${bezig?"disabled":""}>${I.check}Afmelden</button></div></div>`;
    o.querySelectorAll("[data-kx]").forEach(b=>b.onclick=()=>weg(null));
    o.querySelectorAll("[data-kp]").forEach(c=>c.onchange=()=>{ok[+c.dataset.kp]=c.checked;const a=o.querySelector("[data-kal]");if(a)a.hidden=ok.every(Boolean)});
    o.querySelector("[data-kal]").onclick=()=>{ok.fill(true);notitie=o.querySelector("[data-knot]").value;teken()};
    o.querySelector("[data-knot]").oninput=e=>{notitie=e.target.value};
    o.querySelectorAll("[data-ksch]").forEach(b=>b.onclick=()=>{schade=!schade;notitie=o.querySelector("[data-knot]").value;teken()});
    {const st=o.querySelector("[data-kstx]");if(st)st.oninput=e=>{sTekst=e.target.value}}
    {const sf=o.querySelector("[data-ksfoto]");if(sf)sf.onchange=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f||!state.assets)return;bezig=true;teken();
      try{const r=await state.assets.upload(f);sFotos.push({id:r.id,url:URL.createObjectURL(f),op:new Date().toISOString()})}catch(er){toast("De foto kon niet worden geüpload")}bezig=false;teken()}}
    o.querySelectorAll("[data-ksdel]").forEach(b=>b.onclick=()=>{sFotos.splice(Number(b.dataset.ksdel),1);teken()});
    o.querySelector("[data-kfoto]").onchange=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f||!state.assets)return;bezig=true;teken();
      try{const r=await state.assets.upload(f);fotos.push({id:r.id,url:URL.createObjectURL(f),op:new Date().toISOString()})}catch(er){toast("De foto kon niet worden geüpload")}bezig=false;teken()};
    o.querySelectorAll("[data-kdel]").forEach(b=>b.onclick=()=>{fotos.splice(Number(b.dataset.kdel),1);teken()});
    o.querySelector("[data-kok]").onclick=async()=>{
      if(verplicht&&!fotos.length&&state.assets){toast("Maak eerst een opleverfoto");return}
      if(schade&&!sTekst.trim()){toast("Beschrijf kort wat er beschadigd is");const st=o.querySelector("[data-kstx]");if(st)st.focus();return}
      const nee=punten.filter((_,i)=>!ok[i]);
      if(nee.length){const a=await vraag("Niet alles in orde?",`Niet afgevinkt: <b>${nee.map(esc).join(", ")}</b>.<br>Is dat echt niet in orde? Dan krijgt kantoor een melding om het recht te zetten.`,"Ja, melden","Terug");if(a!==true)return}
      const t=notitie.trim().slice(0,300),nu=new Date().toISOString();
      const uit={beurt:{kwaliteit:{punten:punten.map((p,i)=>({naam:p,ok:ok[i]})),fotos:fotos.map(f=>({id:f.id,op:f.op})),op:nu},...(t?{bezoekNotitie:t}:{})},
        klant:{bezoekNotitie:t?{t,datum:iso(today()),door:typeof doorNaam==="function"?doorNaam():""}:""}};
      if(schade){const sd={id:newId("sd"),datum:iso(today()),op:nu,door:typeof doorNaam==="function"?doorNaam():"",tekst:sTekst.trim().slice(0,300),fotos:sFotos.map(f=>({id:f.id,op:f.op})),status:"open"};
        uit.beurt.schade=sd;uit.klant.schades=[...(Array.isArray(k.schades)?k.schades:[]),sd]}
      if(k.bezigGroep){const {schade:_s,...bg}=uit.beurt,{schades:_ss,...kg}=uit.klant;KW.groep[k.bezigGroep]={beurt:bg,klant:kg,t:Date.now()}}
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
  /* schade: blijft staan tot het met de klant is afgehandeld */
  state.klanten.forEach(k=>(Array.isArray(k.schades)?k.schades:[]).filter(x=>x&&x.status!=="afgehandeld").forEach(x=>{const dd=Math.max(0,Math.round((today()-parse(x.datum))/864e5));
    add({key:"kws:"+x.id+":"+(x.status||"open"),p:x.status==="gebeld"?"hoog":"kritiek",top:2,ic:"alert",t:(x.status==="gebeld"?"Schade in behandeling: ":"Schade gemeld: ")+cleanName(k.naam||""),
      u:`${x.tekst}${x.door?" · gemeld door "+x.door:""} op ${fmtD(x.datum)}${(x.fotos||[]).length?" · "+plural(x.fotos.length,"foto","foto's"):""}. ${x.status==="gebeld"?"Rond af als het met de klant geregeld is.":"Bel de klant voordat hij het zelf ontdekt."}`,
      b:[k.adres,k.plaats].filter(Boolean).join(", "),leeftijd:dd,knop:"Open klant",go:"klant:"+k.id,
      acts:x.status==="gebeld"?[{l:"Afgehandeld",ic:"check",cc:"kw:schade:"+k.id+":"+x.id+":afgehandeld"}]:[bel(k),{l:"Gebeld",ic:"check",cc:"kw:schade:"+k.id+":"+x.id+":gebeld"}].filter(Boolean)})}));
  /* vertrekcontrole van de bus: wat ontbrak bij vertrek */
  {const w=((state.routes||{})[ti]||{}).werk,v=w&&w.vertrek;if(v&&(v.punten||[]).some(p=>!p.ok))add({key:"kwb:"+ti,p:"normaal",ic:"truck",t:"Bus niet compleet bij vertrek"+(w.door?" · "+w.door:""),u:"Ontbrak: "+(v.punten||[]).filter(p=>!p.ok).map(p=>p.naam.toLowerCase()).join(", ")+".",b:"",leeftijd:0,knop:"",go:"",acts:[]})}
  /* 3. stiptheid: nog niet gestart terwijl het aankomstvenster bijna of al voorbij is (alleen voor jou, de klant krijgt niets) */
  if(kwS().kwStipt===false||typeof routeStops!=="function")return;const nm=nu.getHours()*60+nu.getMinutes(),v=kwVenster();
  routeStops(ti).filter(x=>!x.done&&!x.k.bezig).forEach(({k})=>{const m=toMin(k.tijd);if(m==null||nm<m+v-10)return;const te=nm>m+v,eind=fromMin(m+v);
    add({key:"kwl:"+k.id+":"+ti,p:te?"kritiek":"hoog",ic:"clock",t:te?`Te laat: ${cleanName(k.naam)} (${k.tijd})`:`Dreigt te laat: ${cleanName(k.naam)} (${k.tijd})`,
      u:te?`Het aankomstvenster liep tot ${eind}. Bel de klant zelf even; er gaat geen automatisch bericht.`:`Nog niet gestart. Het aankomstvenster loopt tot ${eind}.`,
      b:[jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "),leeftijd:0,knop:"Open klant",go:"klant:"+k.id,acts:[bel(k)].filter(Boolean)})})}
async function kwActie(v){const P=String(v||"").split(":"),[w,id]=P;
  if(w==="schade"){const k=state.klanten.find(x=>x.id===P[1]);if(!k)return;const st=P[3]==="afgehandeld"?"afgehandeld":"gebeld";
    try{await save("klanten",k.id,{...strip(k),schades:(k.schades||[]).map(x=>x.id===P[2]?{...x,status:st,[st+"Op"]:new Date().toISOString()}:x)});toast(st==="gebeld"?"Genoteerd: klant gebeld":"Schade afgehandeld");render()}catch(e){err(e)}return}
  const b=(state.beurten||[]).find(x=>x.id===id);if(!b)return;const h=b.herstel||{},nu=new Date().toISOString();
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
  /* verschil met de vorige periode: klein, onder het getal */
  const ver=(a,b,hoog=true,suf="")=>{if(a==null||b==null||a===b)return"";const d=Math.round((a-b)*10)/10,goed=(d>0)===hoog;return `<em class="kwq-d ${goed?"op":"af"}">${d>0?"▲":"▼"} ${kom(Math.abs(d))}${suf} t.o.v. vorige ${esc(V.lbl.split(" ")[0].toLowerCase())}</em>`};
  const tegel=(ic,l,v,sub,d)=>`<div class="st-tile kwq-tile"><span class="st-ic">${ic}</span><span class="st-l">${l}</span><b>${v}</b><small>${sub}</small>${d||""}</div>`;
  const tiles=`<div class="st-tiles kwq-tiles">
    ${tegel(I.clock,"Op tijd",pct(A.opTijd),A.tijdN?plural(A.tijdN,"bezoek","bezoeken")+" met vaste tijd":"nog geen bezoeken met vaste tijd",ver(A.opTijd,B.opTijd,true,"%"))}
    ${tegel(I.ster||I.spark,"Beoordeling",A.sterren==null?"—":kom(A.sterren)+"<span class=\"kwq-v\"> / 5</span>",A.sterN?plural(A.sterN,"beoordeling","beoordelingen"):"nog geen beoordelingen",ver(A.sterren,B.sterren))}
    ${tegel(I.check,"Eindcontrole",pct(A.controle),A.ctlN?A.ctlN+" van "+A.n+" gecontroleerd":"start vanaf het volgende bezoek","")}
    ${tegel(I.alert,"Klachten",A.klacht==null?"—":kom(A.klacht)+"<span class=\"kwq-v\"> per 100</span>",A.klachtN?plural(A.klachtN,"keer","keer")+" niet tevreden"+(A.nawerk?" · "+A.nawerk+"× nawerk":""):"niets gemeld",ver(A.klacht,B.klacht,false))}</div>`;
  /* per week: % op tijd, laatste 12 weken */
  const ma=d=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x},w0=ma(t);
  const wk=[...Array(12)].map((_,i)=>{const s=addDays(w0,(i-11)*7),c=kwCijfers(inP([s,addDays(s,6)]));return{l:String(weekNr(s)),c}});
  const eerste=wk.findIndex(w=>w.c.opTijd!=null),toon=eerste<0?[]:wk.slice(eerste);
  const week=`<section class="st-card"><div class="st-ch"><div><h3>Op tijd per week</h3><p>Gestart binnen ${kwVenster()} minuten na de geplande tijd</p></div></div>
    ${toon.length?stBars(toon.map(w=>w.c.opTijd||0),toon.map(w=>"wk "+w.l),{hi:toon.length-1,fmt:v=>Math.round(v)+"%",h:170,gem:false}):'<p class="st-leeg">Zodra er bezoeken met een vaste tijd zijn afgemeld, zie je hier per week hoe stipt je was.</p>'}</section>`;
  /* per medewerker */
  const per={};inP(P.rg).forEach(b=>{const w=String(b.door||"Onbekend");(per[w]=per[w]||[]).push(b)});
  const rijen=Object.entries(per).map(([w,L])=>[w,kwCijfers(L)]).sort((a,b)=>b[1].n-a[1].n);
  const mw=`<section class="st-card kwq-card"><div class="st-ch"><div><h3>Per medewerker</h3><p>${esc(P.lbl)}</p></div></div>
    ${rijen.length?`<div class="kwq-t"><div class="kwq-r kwq-h"><span>Medewerker</span><span>Bezoeken</span><span>Op tijd</span><span>Sterren</span><span>Controle</span><span>Klachten</span></div>
      ${rijen.map(([w,c])=>`<div class="kwq-r"><b>${esc(w)}</b><span data-l="Bezoeken">${c.n}</span><span data-l="Op tijd">${pct(c.opTijd)}</span><span data-l="Sterren">${c.sterren==null?"—":kom(c.sterren)}</span><span data-l="Controle">${pct(c.controle)}</span><span data-l="Klachten" class="${c.klachtN?"kwq-rood":""}">${c.klachtN}</span></div>`).join("")}</div>`
      :'<p class="st-leeg">Nog geen afgemelde bezoeken in deze periode.</p>'}</section>`;
  const open=kwHerstelLijst();
  const herstel=`<section class="st-card kwq-card"><div class="st-ch"><div><h3>Herstel</h3><p>Lage beoordelingen en eindcontroles die niet in orde waren</p></div></div>
    ${open.length?`<div class="kwq-t">${open.map(b=>`<div class="kwq-r kwq-h2" data-act="klant" data-id="${esc(b.klantId)}" role="button"><b>${esc(cleanName(b.klantNaam||""))}</b><span>${esc(fmtD(b.datum))}</span><span>${kwLaag(b)?b.beoordeling.sterren+" ★":"controle"}</span><span>${(b.herstel||{}).status==="gebeld"?"gebeld":"open"}</span></div>`).join("")}</div>`
      :`<div class="kwq-ok"><span>${I.check}</span><div><b>Niets open</b><small>Alles is rechtgezet.</small></div></div>`}</section>`;
  return `<div class="kwq">${tiles}${week}<div class="st-two kwq-two">${mw}${herstel}</div></div>`}

/* ---------- 6. kleine gebaren ---------- */
const KW_MIJL=[10,25,50,100,150,200];
/* klant sinds: de vroegste van aanmaakdatum en eerste bezoek (bij overgezette klanten is de aanmaakdatum de importdatum) */
function kwIdx(){const B=state.beurten||[];if(KW.idxB===B&&KW.idxN===B.length)return KW.idx;const m={};B.forEach(b=>{if(b&&b.klantId&&b.datum&&!b.geannuleerd)(m[b.klantId]=m[b.klantId]||[]).push(b)});
  Object.values(m).forEach(L=>L.sort((a,b)=>String(a.datum).localeCompare(String(b.datum))));KW.idx=m;KW.idxB=B;KW.idxN=B.length;return m}
function kwSinds(k){let d=String(k.aangemaakt||"").slice(0,10);const L=kwIdx()[k.id];if(L&&L.length&&(!d||L[0].datum<d))d=L[0].datum;return d}
function kwMijlpaal(k,dagen=3){const g=iso(addDays(today(),-dagen)),L=kwIdx()[k.id]||[];
  for(const n of KW_MIJL){const b=L[n-1];if(b&&b.datum>=g)return {n,b}}return null}
function kwMomenten(mom,t){if(kwS().kwGebaren===false)return;state.klanten.filter(k=>k.actief!==false&&!k.prospect&&!k.hoofdKlantId).forEach(k=>{const m=kwMijlpaal(k,7);if(m)mom.push({d:parse(m.b.datum),ic:"ster",t:`${ccNaam(k)}: ${m.n}e bezoek`,s:"Een bedankje staat klaar in Communicatie",k})})}

/* ---------- vertrekcontrole van de bus (bij Start werkdag) ---------- */
const KW_BUS=["Ladders goed vast","Genoeg water en zeep","Schone doeken en wissers","Bus netjes, binnen en buiten"];
const kwBusPunten=()=>{const t=kwS().kwBusPunten;return Array.isArray(t)&&t.length?t:KW_BUS};
/* geeft {punten,op} terug om bij de werkdag op te slaan; geen annuleren (de kilometerstand is dan al opgeslagen) */
function kwVertrek(){return new Promise(res=>{try{
  if(kwTest()||kwS().kwBus===false)return res(null);
  const P=kwBusPunten(),ok=P.map(()=>false);
  const d=document.createElement("dialog");d.className="vraag-dlg";const o=document.createElement("div");o.className="vraag-ov";d.appendChild(o);
  const teken=()=>{o.innerHTML=`<div class="rk vve-op kwc" role="dialog" aria-modal="true" aria-label="Vertrekcontrole">
    <div class="rk-h"><span class="objic">${I.truck||I.route}</span><div><b>Vertrekcontrole</b><small>Klaar voor de dag? Vink af wat in orde is.</small></div></div>
    <div class="vve-lijst">${P.map((t,i)=>`<label class="vve-t"><input type="checkbox" data-bp="${i}" ${ok[i]?"checked":""}><span><i>${I.check}</i>${esc(t)}</span></label>`).join("")}</div>
    <button type="button" class="kwc-alles" data-bal ${ok.every(Boolean)?"hidden":""}>${I.check}Alles in orde</button>
    <div class="rk-f"><span class="sp"></span><button type="button" class="primary" data-bok>${I.check}Vertrekken</button></div></div>`;
    o.querySelectorAll("[data-bp]").forEach(c=>c.onchange=()=>{ok[+c.dataset.bp]=c.checked;const a=o.querySelector("[data-bal]");if(a)a.hidden=ok.every(Boolean)});
    o.querySelector("[data-bal]").onclick=()=>{ok.fill(true);teken()};
    o.querySelector("[data-bok]").onclick=async()=>{const nee=P.filter((_,i)=>!ok[i]);
      if(nee.length){const a=await vraag("Niet alles in orde?",`Niet afgevinkt: <b>${nee.map(esc).join(", ")}</b>.<br>Regel het nog even voor je vertrekt, of vertrek toch (kantoor ziet wat er ontbrak).`,"Toch vertrekken","Terug");if(a!==true)return}
      try{d.close()}catch(_){}d.remove();res({punten:P.map((p,i)=>({naam:p,ok:ok[i]})),op:new Date().toISOString()})}};
  d.addEventListener("cancel",e=>e.preventDefault());document.body.appendChild(d);teken();d.showModal()
}catch(e){console.error(e);res(null)}})}

/* ---------- dagbriefing op de telefoon (bovenaan Vandaag) ---------- */
function kwDagBrief(stops,d,isT){if(!isT||kwS().kwDagbrief===false)return"";const open=stops.filter(s=>!s.done).map(s=>s.k);if(!open.length)return"";
  const md=iso(today()).slice(5),her=new Set(kwHerstelLijst().map(b=>b.klantId));
  const R=[];open.forEach(k=>{const l=[];if(kwEerste(k))l.push(["Eerste bezoek","goud"]);if(her.has(k.id))l.push(["Herstel loopt","rood"]);
    if((k.schades||[]).some(x=>x&&x.status!=="afgehandeld"))l.push(["Open schade","rood"]);
    if(String(k.geboortedatum||"").slice(5,10)===md)l.push(["Jarig vandaag","goud"]);
    const ks=kwSinds(k);if(ks&&ks.slice(5)===md&&today().getFullYear()-Number(ks.slice(0,4))>=1)l.push([(today().getFullYear()-Number(ks.slice(0,4)))+" jaar klant","goud"]);
    const lt=typeof hospList==="function"?hospList(k).filter(x=>x.c==="letop"||x.c==="dier").map(x=>x.t):[];
    if(l.length||lt.length)R.push({k,l,lt})});
  const tel=(n,w)=>n?`<span><b>${n}</b> ${w}</span>`:"";
  const nE=R.filter(r=>r.l.some(x=>x[0]==="Eerste bezoek")).length,nH=R.filter(r=>r.l.some(x=>/Herstel|schade/.test(x[0]))).length,nJ=R.filter(r=>r.l.some(x=>/Jarig|jaar klant/.test(x[0]))).length;
  return `<details class="kwd"${R.length?" open":""}><summary><span class="kwd-ic">${I.sun||I.planning}</span><span class="kwd-t"><b>Jouw dag</b><small>${[plural(open.length,"adres","adressen"),nE?plural(nE,"eerste bezoek","eerste bezoeken"):"",nH?nH+" extra aandacht":"",nJ?nJ+" iets te vieren":""].filter(Boolean).join(" · ")}</small></span>${I.down||""}</summary>
    ${R.length?`<div class="kwd-l">${R.map(r=>`<div class="kwd-r" role="button" tabindex="0" data-act="klant" data-id="${esc(r.k.id)}"><span class="kwd-tm">${esc(r.k.tijd||"")}</span><span class="kwd-m"><b>${esc(kwNaam(r.k))}</b>${r.l.map(x=>`<i class="kwd-lb ${x[1]}">${esc(x[0])}</i>`).join("")}${r.lt.length?`<small>${esc(r.lt.join(" · "))}</small>`:""}</span></div>`).join("")}</div>`
      :`<p class="kwd-leeg">Geen bijzonderheden vandaag. Gewoon een mooie dag.</p>`}</details>`}

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
    ${sec("Eerste bezoek")}
    ${inp("kwEersteExtra","Extra tijd bij een eerste bezoek (minuten)",s.kwEersteExtra==null?15:s.kwEersteExtra,{type:"number",t:"num",attrs:'min="0" max="120" step="5"',help:"Voor de kennismaking. 0 = geen extra tijd. Bij Start staat de kennismaking in de briefing, met vóórfoto's die alleen in de opdracht komen."})}
    ${sec("Vertrek")}
    ${tgl("kwBus","Vertrekcontrole van de bus","Bij Start werkdag eerst de lijst hieronder aflopen. Wat ontbrak, zie je in het Overzicht.",s.kwBus!==false)}
    <label class="full">Vertrekcontrole (één per regel)<textarea id="kwBp" style="min-height:90px">${esc(kwBusPunten().join("\n"))}</textarea></label>
    ${tgl("kwDagbrief","Dagbriefing bovenaan Vandaag","Elke medewerker ziet zijn dag: eerste bezoeken, herstel, schade, jarigen en waar hij op moet letten.",s.kwDagbrief!==false)}
    ${sec("Stipt op tijd")}
    ${tgl("kwStipt","Melding als je te laat dreigt te komen","Alleen voor jou in het Overzicht. De klant krijgt niets automatisch.",s.kwStipt!==false)}
    ${inp("kwVenster","Aankomstvenster (minuten na de geplande tijd)",kwVenster(),{type:"number",t:"num",attrs:'min="5" max="120" step="5"'})}
    ${sec("Herstel")}
    ${sel("kwDrempel","Herstelmelding bij een beoordeling van",String(kwDrempel()),[["1","1 ster"],["2","2 sterren of minder"],["3","3 sterren of minder"],["4","4 sterren of minder"]],{help:"Rode melding in het Overzicht: bellen, zo nodig kosteloos nawerk, dan op opgelost."})}
    ${inp("crBezoek","Credits voor het beoordelen van een bezoek (€)",s.crBezoek==null?"0.10":s.crBezoek,{type:"number",t:"num",attrs:'min="0" max="5" step="0.05"',help:"De klant beoordeelt in het klantportaal elk bezoek met 1 tot 5 sterren (tot 7 dagen erna). Die sterren komen in je kwaliteitsscore. 0 = geen credits."})}
    ${sec("Kleine gebaren")}
    ${tgl("kwGebaren","Jubileum en mijlpalen klaarzetten","Bij 1, 2, 3… jaar klant en bij het 10e, 25e, 50e bezoek staat een bedankje klaar in Communicatie. Jij beslist of het weggaat.",s.kwGebaren!==false)}`,{wide:false});
  bindSave(()=>{const t=$("#kwPt").value.split(/\n/).map(x=>x.trim()).filter(Boolean).slice(0,10),std=typeof GLAS==="function"&&GLAS()?KW_GLAS:KW_ALG;const bp=$("#kwBp").value.split(/\n/).map(x=>x.trim()).filter(Boolean).slice(0,10);return{kwBusPunten:bp.length&&bp.join("|")!==KW_BUS.join("|")?bp:[],kwPunten:t.length&&t.join("|")!==std.join("|")?t:[],kwVenster:Math.max(5,Math.min(120,Number(($("[data-k=kwVenster]")||{}).value)||15))}})};
