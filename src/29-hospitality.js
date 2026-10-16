/* ---------- HOSPITALITY: wat je over deze klant moet weten (zoals een sterrenrestaurant zijn gasten kent) ---------- */
I.heart=sv('<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>');
I.paw=sv('<circle cx="7" cy="9" r="1.7"/><circle cx="11" cy="6.5" r="1.7"/><circle cx="15.5" cy="7" r="1.7"/><circle cx="18" cy="11" r="1.6"/><path d="M8 16.5c0-2.6 2-5 4.5-5s4.5 2.4 4.5 5c0 1.8-1.4 2.5-3 2.1-1-.3-2-.3-3 0-1.6.4-3-.3-3-2.1z"/>');
const HOSP_CAT=[["persoon","Persoonlijk","user"],["voorkeur","Voorkeur","heart"],["letop","Let op","alert"],["dier","Huisdieren","paw"],["aankomst","Aankomst & toegang","lock"],["moment","Bijzonder moment","cal2"],["verteld","Klant vertelde","chat"]];
const hospCat=c=>HOSP_CAT.find(x=>x[0]===c)||HOSP_CAT[1];
const HOSP_TIPS=[["persoon","Spreek aan met u / meneer, mevrouw"],["persoon","Mag met voornaam aangesproken worden"],["voorkeur","Liever een appje dan bellen"],["voorkeur","Komt het liefst 's ochtends uit"],["voorkeur","Waardeert een praatje"],["voorkeur","Graag rustig en stil werken (thuiswerker)"],
  ["letop","Planten in de vensterbank voorzichtig"],["letop","Geen water op de houten kozijnen"],["letop","Schoenen uit als je binnen komt"],["dier","Hond, vriendelijk"],["dier","Kat mag niet naar buiten"],["aankomst","Even aanbellen bij aankomst"],["aankomst","Parkeren op de oprit mag"],["moment","Verjaardag: "],["verteld","Klant vertelde dat "]];
const hospItems=k=>(k&&Array.isArray(k.hosp)?k.hosp:[]).map((x,i)=>({...x,_i:i})).filter(x=>x&&String(x.t||"").trim());
const hospNu=(x,day)=>x.c!=="verteld"||!x.vanaf||x.vanaf<=(day||iso(today()));
/* open punten; "klant vertelde" (en dus ter sprake brengen) eerst */
const hospList=k=>{const l=hospItems(k).filter(x=>!(x.c==="verteld"&&x.af)),d=iso(today()),r=x=>x.c==="verteld"?(hospNu(x,d)?0:2):1;return l.sort((a,b)=>r(a)-r(b)||a._i-b._i)};
const hospItem=(k,x,cls)=>{const c=hospCat(x.c),v=x.c==="verteld",nu=hospNu(x),prio=v&&nu,later=v&&!nu;return `<div class="${cls} hc-${c[0]}${prio?" hosp-prio":""}${later?" hosp-later":""}"><span class="hosp-ic">${I[c[2]]||I.note}</span><div><small>${prio?`<em class="hosp-tag">Ter sprake brengen</em>`:esc(c[1])}</small><span>${esc(x.t)}</span></div>${later?`<span class="hosp-af hosp-wacht" title="Pas ter sprake brengen vanaf ${esc(fmtL(x.vanaf))}">${I.clock}Nog niet bespreken · vanaf ${esc(fmtD(x.vanaf))}</span>`:""}${prio?`<button type="button" class="hosp-af" data-hosp-af="${esc(k.id)}:${x._i}" title="Vink af als je het met de klant hebt besproken; dan komt het niet meer bovenaan">${I.check}Heb je het besproken?</button>`:""}</div>`};
/* blok met aandachtspunten: in de klantkaart en boven in de opdracht */
function hospBlok(k,{leegKnop=true}={}){const l=hospList(k),alle=hospItems(k);
  if(!l.length&&alle.length)return `<div class="hosp hosp-leeg"><span class="objic">${I.heart}</span><div><b>Hospitality aandachtspunten</b><small>Alles wat de klant vertelde is besproken.</small></div>${leegKnop?`<button type="button" class="small" data-act="hospedit" data-id="${esc(k.id)}">${I.plus}Noteren</button>`:""}</div>`;
  if(!l.length)return `<div class="hosp hosp-leeg"><span class="objic">${I.heart}</span><div><b>Hospitality aandachtspunten</b><small>Nog niets genoteerd. Wat moet iedereen weten om deze klant écht goed van dienst te zijn?</small></div>${leegKnop?`<button type="button" class="small" data-act="hospedit" data-id="${esc(k.id)}">${I.plus}Noteren</button>`:""}</div>`;
  const g=hospGroet(k,l),m=hospMoment(l),n=l.length,niv=n>=5?"Vaste gast":n>=3?"Goede bekende":"Nieuwe kennis";
  const tl=l.map(x=>String(x.t).toLowerCase()).join("|"),sug=HOSP_TIPS.map((t,i)=>({t,i})).filter(x=>!/: $/.test(x.t[1])&&!tl.includes(x.t[1].toLowerCase())&&!(x.t[0]==="persoon"&&l.some(y=>y.c==="persoon"))).slice(0,4);
  return `<div class="hosp hx"><div class="hx-h"><span class="hx-ic">${I.heart}</span><div class="hx-t"><b>Hospitality</b><small>${esc(niv)} · ${plural(n,"aandachtspunt","aandachtspunten")}</small></div><div class="hx-m" title="Hoe goed ken je deze klant">${[1,2,3,4,5].map(i=>`<i class="${i<=Math.min(5,n)?"on":""}"></i>`).join("")}</div>${leegKnop?`<button type="button" class="iconbtn sm" data-act="hospedit" data-id="${esc(k.id)}" aria-label="Aandachtspunten aanpassen" title="Aanpassen">${I.pencil}</button>`:""}</div>
    ${g||m?`<div class="hx-tips">${g?`<div class="hx-tip"><span>${I.user}</span><div><small>Aanspreken</small><b>${esc(g)}</b></div></div>`:""}${m?`<div class="hx-tip${m.dagen<=7?" bijna":""}"><span>${m.ic}</span><div><small>${esc(m.label)}</small><b>${esc(m.tekst)}</b></div></div>`:""}</div>`:""}
    <div class="hosp-l">${l.map(x=>hospItem(k,x,"hosp-i")).join("")}</div>
    ${leegKnop&&sug.length?`<div class="hx-snel"><small>Snel toevoegen</small>${sug.map(x=>`<button type="button" class="hx-chip" data-hq="${esc(k.id)}:${x.i}">${I.plus}${esc(x.t[1])}</button>`).join("")}</div>`:""}</div>`}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-hq]");if(!b)return;e.preventDefault();e.stopPropagation();const[kid,i]=b.dataset.hq.split(":"),k=state.klanten.find(x=>x.id===kid),t=HOSP_TIPS[+i];if(!k||!t)return;
  b.disabled=true;try{await save("klanten",kid,{...strip(k),hosp:[...(k.hosp||[]),{c:t[0],t:t[1]}]});toast("Toegevoegd aan hospitality");if(dlg.open&&typeof openKlantView==="function"&&document.querySelector("#dlgForm .hx"))openKlantView(kid)}catch(er){err(er);b.disabled=false}},true);
/* begroeting en bijzondere momenten uit de aandachtspunten afleiden */
function hospGroet(k,l){const t=l.map(x=>String(x.t).toLowerCase()).join(" | ");
  const nm=cleanName(k.naam||""),ach=k.achternaam||nm.split(",")[0].trim(),vn=k.voornaam||(nm.includes(",")?nm.split(",").slice(1).join(",").trim():"");
  if(/voornaam/.test(t)&&vn)return vn+" · je/jij";
  if(/\bu\b|meneer|mevrouw/.test(t))return (k.geslacht==="vrouw"?"Mevrouw ":k.geslacht==="man"?"Meneer ":"Meneer/mevrouw ")+ach+" · u";
  return ""}
const HMND=["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
function hospMoment(l){const t=today();let best=null;
  l.filter(x=>x.c==="moment").forEach(x=>{const m=String(x.t).toLowerCase().match(/(\d{1,2})[\s\-\/.]*(jan|feb|maa|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec|\d{1,2})/);if(!m)return;
    const mi=/^\d/.test(m[2])?Number(m[2])-1:HMND.indexOf(m[2]==="maa"?"mrt":m[2].slice(0,3));if(mi<0||mi>11)return;let d=new Date(t.getFullYear(),mi,Number(m[1]));if(d<t)d=new Date(t.getFullYear()+1,mi,Number(m[1]));
    const dagen=Math.round((d-t)/864e5);if(!best||dagen<best.dagen){const jarig=/verjaardag|jarig/i.test(x.t);best={dagen,ic:jarig?"🎂":"🎉",label:jarig?"Verjaardag":"Bijzonder moment",tekst:dagen===0?(jarig?"Vandaag jarig! Feliciteer even":"Vandaag!"):dagen===1?"Morgen":dagen<=30?"Over "+dagen+" dagen · "+d.getDate()+" "+HMND[mi]:d.getDate()+" "+HMND[mi]}}});
  return best}
/* invoer in de opdracht bij Taakomschrijving */
function hospEditHtml(l){return `<div class="hosp-ed"><div class="hosp-edh"><span class="hosp-ic hc-voorkeur">${I.heart}</span><div><b>Hospitality aandachtspunten</b><small>Komt bovenaan de klantkaart, de opdracht en bij de klus op de route te staan</small></div></div>
  <div class="hosp-rows">${l.map((x,i)=>`<div class="hosp-row"><select data-hi="${i}" data-hf="c" aria-label="Soort">${HOSP_CAT.map(c=>`<option value="${c[0]}" ${x.c===c[0]?"selected":""}>${esc(c[1])}</option>`).join("")}</select><textarea data-hi="${i}" data-hf="t" rows="1" class="hosp-ta" placeholder="Bijv. drinkt koffie zwart, zoon heet Daan">${esc(x.t||"")}</textarea><button type="button" class="iconbtn sm" data-hrm="${i}" aria-label="Weghalen">${I.x}</button>${x.c==="verteld"&&!x.af?`<label class="hosp-van">${I.cal2}Ter sprake brengen vanaf<input type="date" data-hi="${i}" data-hf="vanaf" value="${esc(x.vanaf||"")}"><small>leeg = meteen · bijv. pas ná de vakantie</small></label>`:""}${x.c==="verteld"&&x.af?`<div class="hosp-done">${I.check}Besproken op ${esc(fmtD(x.af))} · staat niet meer bovenaan <button type="button" class="linkbtn" data-hreopen="${i}">Weer tonen</button></div>`:""}</div>`).join("")}</div>
  <div class="hosp-add"><button type="button" class="small" data-hadd>${I.plus}Aandachtspunt</button></div>
  <div class="hosp-tips"><span class="eyebrow">Snel toevoegen</span><div>${HOSP_TIPS.map(([c,t],i)=>`<button type="button" class="chip" data-htip="${i}">${I.plus}${esc(t.replace(/: $/,""))}</button>`).join("")}</div></div></div>`}
function hospBind(box,get,onChange){
  const grow=t=>{t.style.height="auto";t.style.height=Math.max(46,t.scrollHeight+2)+"px"};
  const draw=()=>{box.innerHTML=hospEditHtml(get());box.querySelectorAll(".hosp-ta").forEach(grow);onChange&&onChange()};
  box.addEventListener("focusin",e=>{if(e.target.classList&&e.target.classList.contains("hosp-ta"))grow(e.target)});
  box.addEventListener("input",e=>{const el=e.target;if(el.dataset.hi==null)return;if(el.classList.contains("hosp-ta"))grow(el);get()[+el.dataset.hi][el.dataset.hf]=el.value;onChange&&onChange()});
  box.addEventListener("change",e=>{const el=e.target;if(el.dataset.hi==null)return;get()[+el.dataset.hi][el.dataset.hf]=el.value;if(el.dataset.hf==="c")draw();else onChange&&onChange()});
  box.addEventListener("click",e=>{const a=e.target.closest("[data-hadd],[data-hrm],[data-htip],[data-hreopen]");if(!a)return;const l=get();
    if(a.dataset.hreopen!=null){delete l[+a.dataset.hreopen].af;draw();return}
    if(a.dataset.hrm!=null){l.splice(+a.dataset.hrm,1);draw();return}
    const tip=a.dataset.htip!=null?HOSP_TIPS[+a.dataset.htip]:null;l.push({c:tip?tip[0]:"voorkeur",t:tip?tip[1]:""});draw();
    const ins=box.querySelectorAll('[data-hf="t"]'),last=ins[ins.length-1];if(last){last.focus();const v=last.value;last.setSelectionRange(v.length,v.length)}});
  draw();return draw}
/* compact voor onderweg (vandaag en route) */
function hospRoute(k){const l=hospList(k).filter(x=>hospNu(x));if(!l.length)return "";
  return `<div class="hosp-rt"><span class="eyebrow">${I.heart}Hospitality</span><div>${l.map(x=>hospItem(k,x,"hosp-rti")).join("")}</div></div>`}
/* "klant vertelde" afvinken als het besproken is (klantkaart, vandaag, route) */
document.addEventListener("click",async e=>{const b=e.target.closest("[data-hosp-af]");if(!b||b.closest("#owHospTop"))return;e.preventDefault();e.stopPropagation();
  const [kid,ix]=b.dataset.hospAf.split(":"),k=state.klanten.find(x=>x.id===kid);if(!k||!Array.isArray(k.hosp)||!k.hosp[+ix])return;
  const hosp=k.hosp.map((x,i)=>i===+ix?{...x,af:iso(today())}:x);b.disabled=true;
  try{await save("klanten",kid,{...strip(k),hosp});toast("Afgevinkt als besproken · komt niet meer bovenaan te staan");if(dlg.open&&form.dataset.kk===kid)openKlantView(kid);else render()}catch(er){b.disabled=false;err(er)}},true);

/* invoeren en aanpassen: alleen vanuit de klantkaart */
function kkHosp(kid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  let hosp=(k.hosp||[]).map(x=>({...x}));if(!hosp.length||String(hosp[hosp.length-1].t||"").trim())hosp.push({c:"voorkeur",t:""});
  openDlg(`<div class="dlg-head"><span class="objic big hosp-dic">${I.heart}</span><div style="min-width:0;flex:1"><h3>Hospitality aandachtspunten</h3><div class="subt">${esc(cleanName(k.naam))}</div></div><button type="button" class="iconbtn" id="khX" aria-label="Terug">${I.x}</button></div>
    <div id="khBox"></div>
    <div class="row stickyfoot"><span class="sp"></span><button type="button" id="khBack">Annuleren</button><button type="submit" class="primary" id="khSave">${I.check}Opslaan</button></div>`,{wide:true});
  hospBind($("#khBox"),()=>hosp);
  setTimeout(()=>{const ins=$("#khBox").querySelectorAll('[data-hf="t"]');if(ins.length)ins[ins.length-1].focus()},60);
  $("#khX").onclick=$("#khBack").onclick=()=>openKlantView(kid);
  form.onsubmit=async e=>{e.preventDefault();$("#khSave").disabled=true;
    try{const cur=state.klanten.find(x=>x.id===kid)||k;await save("klanten",kid,{...strip(cur),hosp:hosp.map(x=>({c:x.c||"voorkeur",t:String(x.t||"").trim(),...(x.af?{af:x.af}:{}),...(x.c==="verteld"&&x.vanaf?{vanaf:x.vanaf}:{})})).filter(x=>x.t)});toast("Aandachtspunten opgeslagen");openKlantView(kid)}
    catch(er){$("#khSave").disabled=false;err(er)}}}
/* andere diensten gaan mee met de glasbewassing: laat zien wat deze beurt extra gedaan moet worden */
function ookDezeBeurt(k,day){let l=[];try{l=extraDue(k,day||iso(today()))}catch(e){}if(!l.length)return "";
  return `<div class="ook-beurt"><span class="eyebrow">${I.plus}Deze beurt ook uitvoeren</span>${l.map(o=>{const its=(o.items||[]).filter(x=>Number(x.aantal)>0);return `<div class="ob-r"><b>${esc(o.dienst||"Dienst")}</b>${its.length?`<small>${esc(its.map(x=>x.naam+" "+String(x.aantal).replace(".",",")+" "+eenhKort(x.eenheid)).join(" · "))}</small>`:""}<span class="mono">${eur(o.prijs)}</span></div>`}).join("")}</div>`}
