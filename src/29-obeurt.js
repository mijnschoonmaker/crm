/* ---------- O-beurt: eerste wasbeurt na een aanvraag via de website, met tellingcontrole op locatie ---------- */
const isOBeurt=k=>!!(k&&k.tellingControle&&isEersteKeer(k));
const TC_FL=["Begane grond","1e verdieping","2e verdieping","3e verdieping"];
function tcFloors(k){const q=k.ramenRegel?normR(k.ramenRegel):null;if(q)return q.f.slice(0,4).map(n=>Number(n)||0);
  const t=k.ramenTelling&&k.ramenTelling.floors||[];return [0,1,2,3].map(i=>i<3?Number(t[i])||0:t.slice(3).reduce((a,b)=>a+(Number(b)||0),0))}
/* bijzondere ramen: uit de opdrachtregel, anders uit de telling van de klant */
function tcSp(k){const q=k.ramenRegel&&k.ramenRegel.sp,t=k.ramenTelling&&k.ramenTelling.special||{},src=q&&SPK.some(x=>q[x])?q:t;return SPK.reduce((o,x)=>(o[x]=Math.max(0,Math.round(Number(src[x])||0)),o),{})}
function tcPrijs(k,f,sp){try{const q=normR({...(k.ramenRegel||{}),f,sp:sp||tcSp(k)});const b=ramenBerekening(q,Number(k.frequentie)||8,null),st=S(),mul=st.incl?1+(Number(st.btw)||21)/100:1;
  return {prijs:r2(b.ex*mul),duur:Math.max(5,Math.ceil(b.min/5)*5),count:b.count}}catch(e){console.error(e);return null}}
const TC_SPN={tuimel:"Dak- / tuimelramen",koepel:"Lichtkoepels",lood:"Glas-in-lood",mini:"Miniraampjes"};
function oBeurtBlok(k){if(!isOBeurt(k))return "";const f=tcFloors(k),sp=tcSp(k),tot=f.reduce((a,b)=>a+b,0)+SPK.reduce((a,x)=>a+sp[x],0),g=k.tellingGecontroleerd;
  const fo=(g&&g.fotos||[]).filter(x=>x.id);
  return `<div class="obt${g?" klaar":""}"><div class="obt-h"><span class="obt-p">O-beurt</span><b>${g?"Telling gecontroleerd":"Tellingcontrole"}</b><span class="sp"></span>${g?`<span class="obt-ok">${I.check}${g.na===g.voor?"klopt":g.voor+" → "+g.na+" ramen"}</span>`:""}</div>
    <p>${g?`Gecontroleerd op ${esc(fmtD(g.datum))}${g.ai?" met foto's":""}${g.na!==g.voor&&g.prijsNa!==g.prijsVoor?` · prijs ${esc(eur(g.prijsVoor))} → <b>${esc(eur(g.prijsNa))}</b>`:""}.`:`Eerste wasbeurt. De klant telde zelf <b>${tot} ramen</b>. Loop rond de woning en maak per zijde een foto: de ramen worden voor je geteld.`}</p>
    <div class="obt-f">${f.map((n,i)=>n?`<span>${esc(TC_FL[i])} <b>${n}</b></span>`:"").join("")}${SPK.map(x=>sp[x]?`<span>${esc(TC_SPN[x])} <b>${sp[x]}</b></span>`:"").join("")}</div>
    ${fo.length?`<div class="obt-fo">${fo.map((x,i)=>`<button type="button" data-tcfo="${esc(k.id)}:${i}" aria-label="Foto ${i+1}"><img src="${BLOB+esc(x.id)}" alt="" loading="lazy"><em>${(x.dots||[]).length}</em></button>`).join("")}</div>`:""}
    <button type="button" class="small${g?"":" primary"}" data-tctl="${esc(k.id)}">${g?I.calculator+"Telling aanpassen":I.camera+"Telling controleren"}</button></div>`}
function tcFotosHtml(tf){if(!tf.length)return `<div class="tc-fotos leeg">${I.camera||""}<span>De klant heeft geen foto's meegestuurd. Tel de ramen ter plekke.</span></div>`;
  const n=tf.reduce((a,f)=>a+(f.dots||[]).length,0);
  return `<div class="tc-fotos"><div class="tc-fh"><b>Foto's van de klant</b><small>${tf.length} ${tf.length===1?"foto":"foto's"}${n?` · ${n} ramen aangetikt`:""} · tik om groot te bekijken</small></div>
    <div class="tc-fg" id="tcFg">${tf.map((f,i)=>`<button type="button" data-tcf="${i}" aria-label="${esc(f.naam||"Foto")} bekijken"><span class="fwrap" style="aspect-ratio:${f.w&&f.h?f.w+"/"+f.h:"4/3"}"><img src="${BLOB}${esc(f.id)}" alt="" loading="lazy">${dotsHtml(f)}</span>${(f.dots||[]).length?`<em>${(f.dots||[]).length}</em>`:""}</button>`).join("")}</div></div>`}
function openTellingControle(kid,na){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const gc=k.tellingGecontroleerd,voor=(gc&&gc.origF)||tcFloors(k),vsp=(gc&&gc.origSp)||tcSp(k),f=tcFloors(k).slice(),sp={...tcSp(k)};
  const p0=gc?gc.prijsVoor:Number(k.prijs)||0;let fotos=null,ai=false,spOpen=SPK.some(x=>sp[x]||vsp[x]);
  /* foto's van de klant (uit de dienstenwebshop, met de aangetikte ramen) en eerder gemaakte controlefoto's */
  const tf=[...(((k.ramenTelling||{}).fotos)||[]).filter(x=>x&&x.id).map((x,i)=>({...x,naam:x.zijde||("Foto "+(i+1)+" van de klant"),t:1})),...(k.fotos||[]).filter(x=>x&&x.id),...((gc&&gc.fotos)||[]).filter(x=>x&&x.id).map(x=>({...x,naam:"Controle · "+(x.zijde||"foto")}))].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
  openDlg(`<div class="dlg-head"><span class="objic big">${I.calculator}</span><div style="flex:1;min-width:0"><h3>Tellingcontrole</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(fullAddr(k))}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    ${tcFotosHtml(tf)}
    <div class="tc-or"><span>${tf.length?"jouw telling":"tel zelf"}</span></div>
    <div class="tc-rows" id="tcRows"></div><div id="tcSum"></div>
    <div class="row stickyfoot"><button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="submit" class="primary" id="tcGo">${I.check}Telling klopt</button></div>`,{wide:false});
  const same=()=>f.every((n,i)=>n===voor[i])&&SPK.every(x=>sp[x]===vsp[x]);
  const totV=()=>voor.reduce((a,b)=>a+b,0)+SPK.reduce((a,x)=>a+vsp[x],0),totN=()=>f.reduce((a,b)=>a+b,0)+SPK.reduce((a,x)=>a+sp[x],0);
  const row=(key,label,n,v)=>`<div class="tc-row${n!==v?" dif":""}"><div><b>${label}</b><small>klant telde ${v}</small></div><div class="ow-step"><button type="button" data-tcs="${key}:-1" aria-label="Min">−</button><input type="number" min="0" inputmode="numeric" data-tci="${key}" value="${n}" aria-label="${label}"><span>st</span><button type="button" data-tcs="${key}:1" aria-label="Plus">+</button></div></div>`;
  const draw=()=>{$("#tcRows").innerHTML=f.map((n,i)=>row(i,TC_FL[i],n,voor[i])).join("")+(spOpen?`<div class="tc-sub">Bijzondere ramen</div>`+SPK.map(x=>row(x,TC_SPN[x],sp[x],vsp[x])).join(""):`<button type="button" class="tc-more" data-tcmore>＋ Dakramen, lichtkoepels, glas-in-lood of miniraampjes</button>`);sum()};
  const zet=(key,v)=>{v=Math.max(0,Math.round(Number(v)||0));if(/^\d$/.test(String(key)))f[+key]=v;else sp[key]=v};
  const sum=()=>{const sm=same(),tv=totV(),tn=totN(),c=sm?null:tcPrijs(k,f,sp);
    $("#tcSum").innerHTML=sm?`<div class="okbox" style="margin:0">${I.check}<div><b>Zelfde als de klant: ${tn} ramen</b><span>Prijs blijft ${esc(eur(p0))} per beurt.</span></div></div>`
      :`<div class="warnbox">${I.alert}<span>Klant telde <b>${tv}</b>, jij telt <b>${tn}</b> ramen. ${c&&c.prijs===p0?`Prijs blijft <b>${esc(eur(p0))}</b> per beurt (minimumprijs of zelfde tarief).`:`Nieuwe prijs ${c?`<b>${esc(eur(c.prijs))}</b> per beurt (was ${esc(eur(p0))}), ± ${c.duur} min`:"wordt herberekend"}.`}</span></div>`;
    $("#tcGo").innerHTML=I.check+(sm?"Telling klopt":"Telling opslaan")};
  draw();
  {const g=$("#tcFg");if(g)g.onclick=e=>{const b=e.target.closest("[data-tcf]");if(b)openFotoViewer(tf,+b.dataset.tcf,{edit:false,titel:"Foto van de klant: controleer de aangetikte ramen"})}}
  if($("#tcAi"))$("#tcAi").onclick=()=>openFotoTelling(k,fotos,res=>{fotos=res.fotos;ai=true;f.splice(0,4,...res.f);SPK.forEach(x=>sp[x]=res.sp[x]||0);if(SPK.some(x=>sp[x]))spOpen=true;draw();
    $("#tcAi").classList.add("klaar");$("#tcAi>i").innerHTML=I.check;$("#tcAiS").textContent=`${res.fotos.length} foto's · ${totN()} ramen geteld. Tik om de foto's te bekijken of te verbeteren.`;
    $("#tcRows").animate([{opacity:.3,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:420,easing:"cubic-bezier(.2,.8,.2,1)"})});
  $("#tcRows").addEventListener("click",e=>{if(e.target.closest("[data-tcmore]")){spOpen=true;draw();return}const b=e.target.closest("[data-tcs]");if(!b)return;const [i,d]=b.dataset.tcs.split(":");const cur=/^\d$/.test(i)?f[+i]:sp[i];zet(i,cur+Number(d));draw()});
  $("#tcRows").addEventListener("input",e=>{const el=e.target.closest("[data-tci]");if(!el)return;const key=el.dataset.tci;zet(key,el.value);const v=/^\d$/.test(key)?voor[+key]:vsp[key],n=/^\d$/.test(key)?f[+key]:sp[key];el.closest(".tc-row").classList.toggle("dif",n!==v);sum()});
  form.onsubmit=async e=>{e.preventDefault();const b=$("#tcGo");b.disabled=true;
    const cur=state.klanten.find(x=>x.id===kid)||k,sm=same(),c=sm?null:tcPrijs(cur,f,sp),tv=totV(),tn=totN();
    let fo=gc&&gc.fotos||[];
    if(fotos&&fotos.length){b.innerHTML=I.camera+"Foto's bewaren…";const up=[];
      for(const p of fotos){try{const r=state.assets?await state.assets.upload(new File([p.blob],"telling-"+p.zijde.toLowerCase().replace(/\W+/g,"-")+".jpg",{type:"image/jpeg"})):null;if(r&&r.id)up.push({id:r.id,w:p.w,h:p.h,zijde:p.zijde,dots:p.dots.map(d=>({x:Math.round(d.x*1e4)/1e4,y:Math.round(d.y*1e4)/1e4,t:d.t}))})}catch(er){console.warn(er)}}
      if(up.length)fo=up}
    const g={datum:iso(today()),voor:tv,na:tn,origF:voor,origSp:vsp,prijsVoor:p0,prijsNa:c?c.prijs:p0,...(ai||(gc&&gc.ai)?{ai:true}:{}),...(fo.length?{fotos:fo}:{})};
    const patch={tellingGecontroleerd:g,ramenRegel:normR({...(cur.ramenRegel||{}),f:f.slice(),sp:{...sp}}),...(c?{prijs:c.prijs,...(!(cur.tijden||[]).length?{duur:c.duur}:{})}:{}),
      ramenTelling:{...(cur.ramenTelling||{}),gecontroleerd:g},log:[...(cur.log||[]),{datum:iso(today()),tekst:(sm?`Tellingcontrole O-beurt: klopt (${tn} ramen)`:`Tellingcontrole O-beurt: ${tv} → ${tn} ramen · prijs ${eur(p0)} → ${eur(c?c.prijs:p0)}`)+(ai?" · geteld met foto's":"")}]};
    try{await save("klanten",kid,{...strip(cur),...patch});toast(sm?"Telling klopt · vastgelegd":"Telling aangepast · nieuwe prijs "+eur(c?c.prijs:p0)+" per beurt");dlg.close();render();if(typeof na==="function")na();
      if(typeof stuurDefinitief==="function"&&liveMail()&&S().ovDefinitiefAan!==false)setTimeout(()=>stuurDefinitief(kid,true),400)}catch(er){b.disabled=false;err(er)}};
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-tctl]");if(!b)return;e.preventDefault();e.stopPropagation();openTellingControle(b.dataset.tctl)},true);

/* ---------- melding: nieuwe klant aangemeld via de website ---------- */
const nieuweAanmeldingen=()=>state.klanten.filter(k=>k.nieuwAangemeld&&k.actief!==false);
let _aanmGezien=null;
function meldNieuweAanmelding(){if(!state.loaded)return;const l=nieuweAanmeldingen();
  if(_aanmGezien===null){_aanmGezien=new Set(l.map(k=>k.id));return}
  const nw=l.filter(k=>!_aanmGezien.has(k.id));nw.forEach(k=>_aanmGezien.add(k.id));
  if(nw.length)setTimeout(()=>toast(nw.length===1?(nw[0].aanvraagType==="contact"?`Nieuw contactverzoek van ${cleanName(nw[0].naam)}`:`Nieuwe klant aangemeld via de website: ${cleanName(nw[0].naam)}`):`${nw.length} nieuwe klanten aangemeld via de website`),50)}
function aanmeldBanner(){if(isMw())return "";const l=nieuweAanmeldingen();if(!l.length)return "";
  return `<div class="aanm">${l.slice(0,3).map(k=>{const t=k.ramenTelling||{};return `<div class="aanm-r"><span class="aanm-ic">${I.bell}</span><div class="aanm-t">${k.aanvraagType==="contact"?`<b>Nieuw contactverzoek van een bedrijf</b><span>${esc(cleanName(k.naam))}${k.contact?" · t.a.v. "+esc(k.contact):""} · ${esc([k.email,k.telefoon].filter(Boolean).join(" · "))} · ${esc(fmtD(k.aangemaakt))}</span>`:`<b>Nieuwe klant aangemeld via de website</b><span>${esc(cleanName(k.naam))} · ${esc([k.adres,k.plaats].filter(Boolean).join(", "))}${t.ramen?` · ${t.ramen} ramen`:""} · ${esc(eur(k.prijs))} per beurt · ${esc(fmtD(k.aangemaakt))}</span>`}</div>
    <div class="aanm-k"><button type="button" class="small primary" data-aanm="open" data-id="${esc(k.id)}">${I.klanten}Bekijken</button>${k.aanvraagType==="contact"?`<button type="button" class="small" data-aanm="off" data-id="${esc(k.id)}">${I.offertes}Offerte maken</button>`:`<button type="button" class="small" data-aanm="plan" data-id="${esc(k.id)}">${I.planning}Inplannen</button>`}<button type="button" class="iconbtn sm" data-aanm="weg" data-id="${esc(k.id)}" aria-label="Melding sluiten" title="Gezien">${I.x}</button></div></div>`}).join("")}${l.length>3?`<small class="subt">en nog ${l.length-3} meer</small>`:""}</div>`}
/* opvallende kaart in de zijbalk: YES, een nieuwe klant */
function nieuwKaart(){if(isMw()){const o=document.getElementById("nieuwCard");if(o)o.remove();return}const side=document.querySelector("aside.side"),uc=document.getElementById("userCard");if(!side||!uc)return;
  let el=document.getElementById("nieuwCard");const l=nieuweAanmeldingen();
  if(!l.length){if(el)el.remove();return}
  if(!el){el=document.createElement("div");el.id="nieuwCard";side.insertBefore(el,uc)}
  const k=l[0],t=k.ramenTelling||{},n=l.length,ct=k.aanvraagType==="contact";
  const sig=l.map(x=>x.id).join(",");if(el.dataset.sig===sig)return;const nieuw=el.dataset.sig!==undefined&&el.dataset.sig!==sig;el.dataset.sig=sig;
  el.className="nk-card"+(nieuw?" nk-pop":"");
  el.innerHTML=`<span class="nk-conf" aria-hidden="true">${"<i></i>".repeat(10)}</span>
    <div class="nk-top"><span class="nk-ic">${I.klanten}</span><span class="nk-kick">${n>1?n+" nieuwe aanmeldingen":ct?"Nieuw contactverzoek":"Nieuwe klant!"}</span></div>
    <b class="nk-naam">${esc(cleanName(k.naam))}</b>
    <small class="nk-sub">${esc([k.plaats||"",ct?"bedrijf / VvE":(t.ramen?t.ramen+" ramen":""),k.prijs?eur(Number(k.prijs)):""].filter(Boolean).join(" · "))||"via je website"}</small>
    <div class="nk-act"><button type="button" class="nk-btn" data-aanm="open" data-id="${esc(k.id)}">Bekijken ${I.right}</button>${n>1?`<button type="button" class="nk-more" data-act="tab" data-tab="klanten">Alle ${n}</button>`:""}</div>`;
  if(nieuw)setTimeout(()=>el.classList.remove("nk-pop"),2600)}
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
  const r=vpR(i),W=Math.min(320,innerWidth-16),H=dpEl.offsetHeight;let x=Math.min(Math.max(8,r.left),innerWidth-W-8),y=r.bottom+6;if(y+H>innerHeight-8)y=Math.max(8,r.top-H-6);
  Object.assign(dpEl.style,{left:x+"px",top:y+"px",width:W+"px"});
  /* rechts in beeld houden (ook bij de 90%-weergave op een groot scherm): gemeten breedte, zelfde eenheden als left */
  {const dl=i.closest("dialog"),cR=(dl?Math.min(vpR(dl).right,innerWidth):innerWidth)-8,Wv=vpR(dpEl).width||W;if(x+Wv>cR){x=Math.max(8,Math.min(r.right,cR)-Wv);dpEl.style.left=x+"px"}}
  /* nameten en binnen beeld schuiven: binnen een venster valt alles buiten de rand van dat venster weg */
  {const a=dpEl.getBoundingClientRect(),dl=i.closest("dialog"),c=dl?dl.getBoundingClientRect():null,vw=document.documentElement.clientWidth||innerWidth,vh=document.documentElement.clientHeight||innerHeight,k=a.width?W/a.width:1;
    const L=Math.max(8,c?c.left+8:8),R=Math.min(vw-8,c?c.right-8:vw-8),T=Math.max(8,c?c.top+8:8),B=Math.min(vh-8,c?c.bottom-8:vh-8);let dx=0,dy=0;
    if(a.right>R)dx=R-a.right;if(a.left+dx<L)dx=L-a.left;if(a.bottom>B)dy=B-a.bottom;if(a.top+dy<T)dy=T-a.top;
    if(dx||dy)Object.assign(dpEl.style,{left:(x+dx*k)+"px",top:(y+dy*k)+"px"});
    /* Safari met zoom rekent soms anders: nameten en bijschuiven tot hij echt binnen het venster valt */
    for(let n=0;n<4;n++){const b=dpEl.getBoundingClientRect(),c2=dl?dl.getBoundingClientRect():{left:0,right:vw};const rr=Math.min(vw,c2.right)-8,ll=Math.max(0,c2.left)+8;let d=0;if(b.right>rr+0.5)d=rr-b.right;else if(b.left<ll-0.5)d=ll-b.left;if(!d)break;
      const L0=parseFloat(dpEl.style.left)||0;dpEl.style.left=(L0+d)+"px";const b2=dpEl.getBoundingClientRect(),moved=b2.left-b.left;if(moved&&Math.abs(moved-d)>0.5){dpEl.style.left=(L0+d*d/moved)+"px"}}}
  document.addEventListener("keydown",dpKey,true);
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
