/* ---------- O-beurt: eerste wasbeurt na een aanvraag via de website, met tellingcontrole op locatie ---------- */
const isOBeurt=k=>!!(k&&k.tellingControle&&isEersteKeer(k));
const TC_FL=["Begane grond","1e verdieping","2e verdieping","3e verdieping"];
function tcFloors(k){const q=k.ramenRegel?normR(k.ramenRegel):null;if(q)return q.f.slice(0,4).map(n=>Number(n)||0);
  const t=k.ramenTelling&&k.ramenTelling.floors||[];return [0,1,2,3].map(i=>i<3?Number(t[i])||0:t.slice(3).reduce((a,b)=>a+(Number(b)||0),0))}
function tcPrijs(k,f){try{const q=normR({...(k.ramenRegel||{}),f});const b=ramenBerekening(q,Number(k.frequentie)||8,null),st=S(),mul=st.incl?1+(Number(st.btw)||21)/100:1;
  return {prijs:r2(b.ex*mul),duur:Math.max(5,Math.ceil(b.min/5)*5),count:b.count}}catch(e){console.error(e);return null}}
function oBeurtBlok(k){if(!isOBeurt(k))return "";const f=tcFloors(k),tot=f.reduce((a,b)=>a+b,0),g=k.tellingGecontroleerd;
  return `<div class="obt${g?" klaar":""}"><div class="obt-h"><span class="obt-p">O-beurt</span><b>${g?"Telling gecontroleerd":"Tellingcontrole"}</b><span class="sp"></span>${g?`<span class="obt-ok">${I.check}${g.na===g.voor?"klopt":g.voor+" → "+g.na+" ramen"}</span>`:""}</div>
    <p>${g?`Gecontroleerd op ${esc(fmtD(g.datum))}${g.na!==g.voor&&g.prijsNa!==g.prijsVoor?` · prijs ${esc(eur(g.prijsVoor))} → <b>${esc(eur(g.prijsNa))}</b>`:""}.`:`Eerste wasbeurt. De klant telde zelf <b>${tot} ramen</b>. Tel ter plekke na of het klopt.`}</p>
    <div class="obt-f">${f.map((n,i)=>n?`<span>${esc(TC_FL[i])} <b>${n}</b></span>`:"").join("")}</div>
    <button type="button" class="small${g?"":" primary"}" data-tctl="${esc(k.id)}">${I.calculator}${g?"Telling aanpassen":"Telling controleren"}</button></div>`}
function openTellingControle(kid,na){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const voor=(k.tellingGecontroleerd&&k.tellingGecontroleerd.origF)||tcFloors(k),f=tcFloors(k).slice();const p0=k.tellingGecontroleerd?k.tellingGecontroleerd.prijsVoor:Number(k.prijs)||0;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.calculator}</span><div style="flex:1;min-width:0"><h3>Tellingcontrole</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(fullAddr(k))}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    ${info("O-beurt: tel per verdieping de ramen die je wast. Klopt het met de telling van de klant, tik dan op Telling klopt. Wijkt het af, pas het aantal aan; prijs en tijdsduur rekenen mee voor de volgende beurten.")}
    <div class="tc-rows" id="tcRows"></div><div id="tcSum"></div>
    <div class="row stickyfoot"><button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="submit" class="primary" id="tcGo">${I.check}Telling klopt</button></div>`,{wide:false});
  const draw=()=>{$("#tcRows").innerHTML=f.map((n,i)=>`<div class="tc-row${n!==voor[i]?" dif":""}"><div><b>${TC_FL[i]}</b><small>klant telde ${voor[i]}</small></div><div class="ow-step"><button type="button" data-tcs="${i}:-1" aria-label="Min">−</button><input type="number" min="0" inputmode="numeric" data-tci="${i}" value="${n}" aria-label="${TC_FL[i]}"><span>st</span><button type="button" data-tcs="${i}:1" aria-label="Plus">+</button></div></div>`).join("");sum()};
  const sum=()=>{const same=f.every((n,i)=>n===voor[i]),tv=voor.reduce((a,b)=>a+b,0),tn=f.reduce((a,b)=>a+b,0),c=same?null:tcPrijs(k,f);
    $("#tcSum").innerHTML=same?`<div class="okbox" style="margin:0">${I.check}<div><b>Zelfde als de klant: ${tn} ramen</b><span>Prijs blijft ${esc(eur(p0))} per beurt.</span></div></div>`
      :`<div class="warnbox">${I.alert}<span>Klant telde <b>${tv}</b>, jij telt <b>${tn}</b> ramen. ${c&&c.prijs===p0?`Prijs blijft <b>${esc(eur(p0))}</b> per beurt (minimumprijs of zelfde tarief).`:`Nieuwe prijs ${c?`<b>${esc(eur(c.prijs))}</b> per beurt (was ${esc(eur(p0))}), ± ${c.duur} min`:"wordt herberekend"}.`}</span></div>`;
    $("#tcGo").innerHTML=I.check+(same?"Telling klopt":"Telling opslaan")};
  draw();
  $("#tcRows").addEventListener("click",e=>{const b=e.target.closest("[data-tcs]");if(!b)return;const [i,d]=b.dataset.tcs.split(":").map(Number);f[i]=Math.max(0,f[i]+d);draw()});
  $("#tcRows").addEventListener("input",e=>{const el=e.target.closest("[data-tci]");if(!el)return;f[+el.dataset.tci]=Math.max(0,Math.round(Number(el.value)||0));el.closest(".tc-row").classList.toggle("dif",f[+el.dataset.tci]!==voor[+el.dataset.tci]);sum()});
  form.onsubmit=async e=>{e.preventDefault();const b=$("#tcGo");b.disabled=true;
    const cur=state.klanten.find(x=>x.id===kid)||k,same=f.every((n,i)=>n===voor[i]),c=same?null:tcPrijs(cur,f),tv=voor.reduce((a,b)=>a+b,0),tn=f.reduce((a,b)=>a+b,0);
    const g={datum:iso(today()),voor:tv,na:tn,origF:voor,prijsVoor:p0,prijsNa:c?c.prijs:p0};
    const patch={tellingGecontroleerd:g,ramenRegel:normR({...(cur.ramenRegel||{}),f:f.slice()}),...(c?{prijs:c.prijs,...(!(cur.tijden||[]).length?{duur:c.duur}:{})}:{}),
      ramenTelling:{...(cur.ramenTelling||{}),gecontroleerd:g},log:[...(cur.log||[]),{datum:iso(today()),tekst:same?`Tellingcontrole O-beurt: klopt (${tn} ramen)`:`Tellingcontrole O-beurt: ${tv} → ${tn} ramen · prijs ${eur(p0)} → ${eur(c?c.prijs:p0)}`}]};
    try{await save("klanten",kid,{...strip(cur),...patch});toast(same?"Telling klopt · vastgelegd":"Telling aangepast · nieuwe prijs "+eur(c?c.prijs:p0)+" per beurt");dlg.close();render();if(typeof na==="function")na()}catch(er){b.disabled=false;err(er)}};
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-tctl]");if(!b)return;e.preventDefault();e.stopPropagation();openTellingControle(b.dataset.tctl)},true);

/* ---------- melding: nieuwe klant aangemeld via de website ---------- */
const nieuweAanmeldingen=()=>state.klanten.filter(k=>k.nieuwAangemeld&&k.actief!==false);
let _aanmGezien=null;
function meldNieuweAanmelding(){if(!state.loaded)return;const l=nieuweAanmeldingen();
  if(_aanmGezien===null){_aanmGezien=new Set(l.map(k=>k.id));return}
  const nw=l.filter(k=>!_aanmGezien.has(k.id));nw.forEach(k=>_aanmGezien.add(k.id));
  if(nw.length)setTimeout(()=>toast(nw.length===1?(nw[0].aanvraagType==="contact"?`Nieuw contactverzoek van ${cleanName(nw[0].naam)}`:`Nieuwe klant aangemeld via de website: ${cleanName(nw[0].naam)}`):`${nw.length} nieuwe klanten aangemeld via de website`),50)}
function aanmeldBanner(){const l=nieuweAanmeldingen();if(!l.length)return "";
  return `<div class="aanm">${l.slice(0,3).map(k=>{const t=k.ramenTelling||{};return `<div class="aanm-r"><span class="aanm-ic">${I.bell}</span><div class="aanm-t">${k.aanvraagType==="contact"?`<b>Nieuw contactverzoek van een bedrijf</b><span>${esc(cleanName(k.naam))}${k.contact?" · t.a.v. "+esc(k.contact):""} · ${esc([k.email,k.telefoon].filter(Boolean).join(" · "))} · ${esc(fmtD(k.aangemaakt))}</span>`:`<b>Nieuwe klant aangemeld via de website</b><span>${esc(cleanName(k.naam))} · ${esc([k.adres,k.plaats].filter(Boolean).join(", "))}${t.ramen?` · ${t.ramen} ramen`:""} · ${esc(eur(k.prijs))} per beurt · ${esc(fmtD(k.aangemaakt))}</span>`}</div>
    <div class="aanm-k"><button type="button" class="small primary" data-aanm="open" data-id="${esc(k.id)}">${I.klanten}Bekijken</button>${k.aanvraagType==="contact"?`<button type="button" class="small" data-aanm="off" data-id="${esc(k.id)}">${I.offertes}Offerte maken</button>`:`<button type="button" class="small" data-aanm="plan" data-id="${esc(k.id)}">${I.planning}Inplannen</button>`}<button type="button" class="iconbtn sm" data-aanm="weg" data-id="${esc(k.id)}" aria-label="Melding sluiten" title="Gezien">${I.x}</button></div></div>`}).join("")}${l.length>3?`<small class="subt">en nog ${l.length-3} meer</small>`:""}</div>`}
async function aanmGezien(id){const k=state.klanten.find(x=>x.id===id);if(!k||!k.nieuwAangemeld)return;try{await save("klanten",id,{...strip(k),nieuwAangemeld:false})}catch(e){err(e)}}
document.addEventListener("click",async e=>{const b=e.target.closest("[data-aanm]");if(!b)return;e.preventDefault();e.stopPropagation();const id=b.dataset.id,a=b.dataset.aanm;
  await aanmGezien(id);if(a==="open")openKlantView(id);else if(a==="plan")go("planning");else if(a==="off")openOfferte({klantId:id});else render()},true);

/* ---------- rustige iconen door het hele crm: zachte tint + gedempt gekleurd symbool ---------- */
const SOFT_SEL=".objic,.stat .ic,.set-top .ic,.aanm-ic,.steps3 .sn";
function softIcons(root){(root||document).querySelectorAll(SOFT_SEL).forEach(el=>{if(el.closest(".hosp,.hosp-leeg,.hosp-rt,.hosp-ed")||el.classList.contains("hosp-dic"))return;if(el.dataset.gl==="1"||el.classList.contains("gl")&&el.style.getPropertyValue("--g"))return;
  const cs=getComputedStyle(el),src=(cs.backgroundImage&&cs.backgroundImage!=="none"?cs.backgroundImage:"")+" "+cs.backgroundColor;
  const cols=[...src.matchAll(/rgba?\(([^)]+)\)/g)].map(m=>m[1].split(",").map(x=>parseFloat(x))).filter(c=>c.length<4||c[3]>.5);if(!cols.length)return;
  /* gemiddelde kleur van het verloop, iets gedempt richting crm-grijs */
  let [r,g,b]=cols.reduce((a,c)=>[a[0]+c[0],a[1]+c[1],a[2]+c[2]],[0,0,0]).map(v=>v/cols.length);
  const gr=[93,111,118],mx=.28;r=r*(1-mx)+gr[0]*mx;g=g*(1-mx)+gr[1]*mx;b=b*(1-mx)+gr[2]*mx;
  const lum=(.299*r+.587*g+.114*b);if(lum>150){const f=150/lum;r*=f;g*=f;b*=f}
  el.style.setProperty("--g",`rgb(${r|0} ${g|0} ${b|0})`);el.style.background="";el.style.color="";el.classList.add("gl");el.dataset.gl="1"})}
let _softQ=0;const _softRun=()=>{_softQ=0;try{softIcons()}catch(e){}try{document.querySelectorAll('input[type="date"]:not([data-dp])').forEach(i=>{i.dataset.dp="1";i.readOnly=true;i.setAttribute("inputmode","none")})}catch(e){}};
if(typeof MutationObserver!=="undefined")new MutationObserver(()=>{if(!_softQ)_softQ=requestAnimationFrame(_softRun)}).observe(document.documentElement,{childList:true,subtree:true});

/* ---------- eigen datumkiezer voor alle datumvelden ----------
   Native datumvelden zetten bij typen al "0002" als jaar en lokken dan een herberekening uit.
   Daarom: veld is alleen-lezen, tik opent deze kiezer; typen gebeurt hier en telt pas bij een complete datum. */
const DP_M=["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
let dpEl=null,dpIn=null,dpView=null;
const dpIso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const dpParse=v=>{const m=String(v||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3]):null};
function dpWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/864e5+1)/7)}
function dpTyped(s){s=String(s||"").trim().toLowerCase();if(!s)return null;const now=new Date();
  let m=s.match(/^(\d{1,2})[-/. ](\d{1,2})(?:[-/. ](\d{2,4}))?$/);if(m){let y=m[3]?+m[3]:now.getFullYear();if(y<100)y+=2000;if(y<1900)return null;const d=new Date(y,+m[2]-1,+m[1]);return d.getMonth()===+m[2]-1?d:null}
  m=s.match(/^(\d{1,2})\s+([a-z]+)\.?(?:\s+(\d{4}))?$/);if(m){const mi=DP_M.findIndex(x=>x.startsWith(m[2].slice(0,3)));if(mi<0)return null;const y=m[3]?+m[3]:now.getFullYear();return new Date(y,mi,+m[1])}
  m=s.match(/^(\d{8})$/);if(m){const d=new Date(+s.slice(4),+s.slice(2,4)-1,+s.slice(0,2));return isNaN(d)?null:d}return null}
function dpClose(){if(dpEl){dpEl.remove();dpEl=null}if(dpIn){dpIn.classList.remove("dp-open");dpIn=null}document.removeEventListener("keydown",dpKey,true)}
function dpKey(e){if(e.key==="Escape"){e.preventDefault();e.stopPropagation();const i=dpIn;dpClose();if(i)i.focus()}}
function dpSet(d){const i=dpIn;if(!i)return;const v=d?dpIso(d):"";if(d&&i.min&&v<i.min||d&&i.max&&v>i.max){dpEl.querySelector(".dp-msg").textContent="Valt buiten de toegestane periode";return}
  i.value=v;i.dispatchEvent(new Event("input",{bubbles:true}));i.dispatchEvent(new Event("change",{bubbles:true}));dpClose();i.focus()}
function dpDraw(){const i=dpIn,sel=dpParse(i.value),t=new Date();t.setHours(0,0,0,0);const v=dpView,first=new Date(v.getFullYear(),v.getMonth(),1),off=(first.getDay()+6)%7,start=new Date(first);start.setDate(1-off);
  let rows="";for(let w=0;w<6;w++){const wk=new Date(start);wk.setDate(start.getDate()+w*7);rows+=`<span class="dp-wk">${dpWeek(wk)}</span>`;
    for(let d=0;d<7;d++){const x=new Date(start);x.setDate(start.getDate()+w*7+d);const iso=dpIso(x),out=x.getMonth()!==v.getMonth(),dis=(i.min&&iso<i.min)||(i.max&&iso>i.max);
      rows+=`<button type="button" class="dp-d${out?" out":""}${+x===+t?" today":""}${sel&&+x===+sel?" sel":""}${d>4?" we":""}" data-dp="${iso}"${dis?" disabled":""}>${x.getDate()}</button>`}}
  const q=[["Vandaag",0],["Morgen",1],["+1 week",7],["+2 weken",14],["+4 weken",28],["+8 weken",56]];
  dpEl.innerHTML=`<div class="dp-top"><input class="dp-type" placeholder="Typ een datum, bv. 11-12-2026" value="${sel?String(sel.getDate()).padStart(2,"0")+"-"+String(sel.getMonth()+1).padStart(2,"0")+"-"+sel.getFullYear():""}" aria-label="Datum typen"></div>
    <div class="dp-q">${q.map(([l,n])=>`<button type="button" data-dpq="${n}">${l}</button>`).join("")}</div>
    <div class="dp-h"><button type="button" class="dp-nav" data-dpm="-1" aria-label="Vorige maand">‹</button><span class="dp-t"><select class="dp-ms" aria-label="Maand">${DP_M.map((m,k)=>`<option value="${k}"${k===v.getMonth()?" selected":""}>${m}</option>`).join("")}</select><select class="dp-ys" aria-label="Jaar">${Array.from({length:9},(_,k)=>t.getFullYear()-3+k).map(y=>`<option${y===v.getFullYear()?" selected":""}>${y}</option>`).join("")}</select></span><button type="button" class="dp-nav" data-dpm="1" aria-label="Volgende maand">›</button></div>
    <div class="dp-g"><span class="dp-wk dp-wh">wk</span>${["ma","di","wo","do","vr","za","zo"].map(x=>`<span class="dp-wd">${x}</span>`).join("")}${rows}</div>
    <div class="dp-f"><span class="dp-msg"></span>${i.required?"":`<button type="button" class="dp-clr" data-dpc>Wissen</button>`}</div>`}
function dpOpen(i){if(dpIn===i){dpClose();return}dpClose();dpIn=i;i.classList.add("dp-open");const s=dpParse(i.value)||new Date();dpView=new Date(s.getFullYear(),s.getMonth(),1);
  dpEl=document.createElement("div");dpEl.className="dp";dpEl.setAttribute("role","dialog");dpEl.setAttribute("aria-label","Datum kiezen");dpDraw();
  (i.closest("dialog")||document.body).appendChild(dpEl);
  const r=i.getBoundingClientRect(),W=Math.min(320,innerWidth-16),H=dpEl.offsetHeight;let x=Math.min(Math.max(8,r.left),innerWidth-W-8),y=r.bottom+6;if(y+H>innerHeight-8)y=Math.max(8,r.top-H-6);
  Object.assign(dpEl.style,{left:x+"px",top:y+"px",width:W+"px"});document.addEventListener("keydown",dpKey,true);
  dpEl.addEventListener("click",e=>{e.stopPropagation();const b=e.target.closest("button");if(!b)return;
    if(b.dataset.dp){dpSet(dpParse(b.dataset.dp));return}if(b.dataset.dpq!=null){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+(+b.dataset.dpq));dpSet(d);return}
    if(b.dataset.dpm){dpView.setMonth(dpView.getMonth()+(+b.dataset.dpm));dpDraw();return}if(b.hasAttribute("data-dpc")){dpSet(null)}});
  dpEl.addEventListener("change",e=>{if(e.target.matches(".dp-ms,.dp-ys")){dpView=new Date(+dpEl.querySelector(".dp-ys").value,+dpEl.querySelector(".dp-ms").value,1);dpDraw()}});
  dpEl.addEventListener("keydown",e=>{if(e.target.matches(".dp-type")&&e.key==="Enter"){e.preventDefault();const d=dpTyped(e.target.value);if(d)dpSet(d);else dpEl.querySelector(".dp-msg").textContent="Onbekende datum, typ bv. 11-12-2026"}});
  dpEl.addEventListener("input",e=>{if(e.target.matches(".dp-type")){const d=dpTyped(e.target.value);dpEl.querySelector(".dp-msg").textContent=d?"Enter = "+d.toLocaleDateString("nl-NL",{weekday:"short",day:"numeric",month:"long",year:"numeric"}):"";if(d&&d.getFullYear()>1999){dpView=new Date(d.getFullYear(),d.getMonth(),1);const tv=e.target.value,pos=e.target.selectionStart;dpDraw();const ni=dpEl.querySelector(".dp-type");ni.value=tv;ni.focus();ni.setSelectionRange(pos,pos);dpEl.querySelector(".dp-msg").textContent="Enter = "+d.toLocaleDateString("nl-NL",{weekday:"short",day:"numeric",month:"long",year:"numeric"})}}});
  setTimeout(()=>{const ty=dpEl&&dpEl.querySelector(".dp-type");if(ty&&matchMedia("(pointer:fine)").matches)ty.focus()},20)}
/* alle datumvelden: alleen-lezen + eigen kiezer */
document.addEventListener("mousedown",e=>{const i=e.target.closest&&e.target.closest('input[type="date"]');if(i&&!i.disabled){e.preventDefault();dpOpen(i);return}if(dpEl&&!dpEl.contains(e.target))dpClose()},true);
document.addEventListener("keydown",e=>{const i=e.target.closest&&e.target.closest('input[type="date"]');if(i&&!i.disabled&&(e.key==="Enter"||e.key===" "||e.key==="ArrowDown")){e.preventDefault();dpOpen(i)}else if(i&&/^\d$/.test(e.key)){e.preventDefault();dpOpen(i);setTimeout(()=>{const ty=dpEl&&dpEl.querySelector(".dp-type");if(ty){ty.value=e.key;ty.focus()}},30)}},true);
document.addEventListener("click",e=>{const i=e.target.closest&&e.target.closest('input[type="date"]');if(i){e.preventDefault();if(!dpEl&&!i.disabled)dpOpen(i)}},true);
addEventListener("resize",()=>dpClose());
