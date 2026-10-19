/* ---------- Weekrooster: plan een hele week in één keer ----------
   Wie aan de beurt is wordt per buurt gegroepeerd en over de werkdagen verdeeld, op volgorde van een
   logische route, met een verwachte tijd per adres. Jij kijkt ernaar, schuift wat nodig is en zet het vast. */
const WP={st:null,ov:null,map:null,mk:[]};
const WP_KLEUR=["#137a8a","#e9a23b","#7c5cbf","#23845a","#d9534f","#2f6fdd","#b8860b"];
const wpOpt=()=>{let o={};try{o=JSON.parse(localStorage.getItem("ms.wp")||"{}")||{}}catch(e){}const st=S(),ws=toMin(st.werkStart)??480,we=toMin(st.werkEind)??1020;
  return{uur:Math.min(12,Math.max(2,Number(o.uur)||Math.max(2,Math.round((we-ws-45)/60)))),vroeg:o.vroeg!=null?Number(o.vroeg):7,laat:o.laat!=null?Number(o.laat):7}};
const wpOptSave=o=>{try{localStorage.setItem("ms.wp",JSON.stringify(o))}catch(e){}};
const wpDagen=k=>vasteDagen(k)||(Array.isArray(k.planDagen)&&k.planDagen.length?k.planDagen.map(Number):null);
const wpMagOp=(k,d)=>{const dg=wpDagen(k);return !dg||dg.includes(parse(d).getDay())};
const wpPc4=k=>String(jobAddrObj(k).postcode||k.postcode||"").replace(/\s/g,"").slice(0,4);
const wpPlaats=k=>String(jobAddrObj(k).plaats||k.plaats||"").trim();
const wpCo=k=>typeof pkCoord==="function"?pkCoord(k):null;
const wpU=m=>{m=Math.round(m);return m>=60?Math.floor(m/60)+"u"+(m%60?pad(m%60):""):m+" min"};
const wpAfst=(a,b)=>a&&b?rtKm(a,b):null;
function wpWeekDagen(ws){const out=[];for(let i=0;i<7;i++){const d=addDays(ws,i);if(isWerkdag(d)&&d>=today())out.push(iso(d))}return out}

/* kandidaten: aan de beurt binnen het venster (tot `vroeg` dagen te vroeg mag), nog zonder afspraak in de toekomst */
function wpKandidaten(ws,o){
  const t=iso(today()),eind=addDays(ws,6),upTo=addDays(eind,o.vroeg);
  return teplannen(upTo).filter(k=>!(k.gepland&&k.gepland>=t)).filter(k=>!(k.reeks||[]).some(r=>r&&r.d&&r.d>=t));
}
const wpPrio=k=>{const d=Math.round((dueOf(k)-today())/DAY);return d};/* negatief = over tijd */

/* het voorstel */
function wpVoorstel(ws,o){
  const dagen=wpWeekDagen(ws),t=today(),st=S(),wsMin=toMin(st.werkStart)??480,cap=o.uur*60,maxJobs=Number(st.maxJobs)||0;
  const bk=rtBedrijf(),loods=pkHeeftAdres(bk)?wpCo(bk):null;
  const vast={};dagen.forEach(d=>vast[d]=actief().filter(k=>k.gepland===d));
  actief().forEach(k=>(k.reeks||[]).forEach(r=>{if(r&&r.d&&vast[r.d]&&r.d!==k.gepland)vast[r.d].push({...k,gepland:r.d,tijd:r.t||k.tijd||""})}));
  const kand=wpKandidaten(ws,o).filter(k=>!dagen.some(d=>vast[d].some(x=>x.id===k.id)));
  const D=dagen.map((d,i)=>{const items=vast[d].map(k=>({k,vast:true,tijd:k.tijd||""}));
    return{d,i,items,min:items.reduce((a,x)=>a+duur(x.k),0),reis:0,cent:null}});
  const centrum=day=>{const cs=day.items.map(x=>wpCo(x.k)).filter(Boolean);if(!cs.length)return null;return[cs.reduce((a,c)=>a+c[0],0)/cs.length,cs.reduce((a,c)=>a+c[1],0)/cs.length]};
  D.forEach(day=>day.cent=centrum(day));
  const past=(day,k)=>{if(!wpMagOp(k,day.d))return false;if(maxJobs&&day.items.length>=maxJobs)return false;
    const reis=day.items.length?8:(loods&&wpCo(k)?rtMin(loods,wpCo(k))||5:10);return day.min+day.items.reduce((a,x)=>a+8,0)+reis+duur(k)<=cap};
  const kost=(day,k)=>{const c=wpCo(k);let km;
    if(c&&day.cent)km=wpAfst(day.cent,c);else if(c&&loods)km=wpAfst(loods,c)+6;else{const pc=wpPc4(k),zelfde=day.items.some(x=>wpPc4(x.k)===pc),pl=day.items.some(x=>wpPlaats(x.k).toLowerCase()===wpPlaats(k).toLowerCase());km=zelfde?1:pl?4:day.items.length?15:8}
    const p=wpPrio(k);return km+(p>0?Math.min(6,p*.6):0)-(p<0?Math.min(4,-p*.3):0)};
  /* 1. over tijd en deze week aan de beurt eerst, daarna wie nog te vroeg is maar erbij past */
  const open=kand.slice().sort((a,b)=>wpPrio(a)-wpPrio(b));const rest=[];
  const plaats=k=>{let best=null,bk_=Infinity;for(const day of D){if(!past(day,k))continue;
      const c=day.items.length?kost(day,k):(day.i*0.01+(wpPrio(k)<0?0:3));if(c<bk_){bk_=c;best=day}}
    if(!best)return false;best.items.push({k,vast:false,tijd:""});best.min+=duur(k);best.cent=centrum(best);return true};
  /* zaai: eerste klant per lege dag = hoogste prioriteit die nog los ligt, daarna groeit elke dag met de dichtstbijzijnde */
  for(const day of D){if(day.items.length)continue;const cents=D.map(x=>x.cent).filter(Boolean);
    const ver=x=>{const c=wpCo(x);return !c||!cents.length||cents.every(y=>wpAfst(y,c)>=3)};
    const k=open.find(x=>wpMagOp(x,day.d)&&past(day,x)&&ver(x))||open.find(x=>wpMagOp(x,day.d)&&past(day,x));if(!k)continue;open.splice(open.indexOf(k),1);day.items.push({k,vast:false,tijd:""});day.min+=duur(k);day.cent=centrum(day)}
  /* groei: steeds de kandidaat met de laagste kosten over alle dagen */
  while(open.length){let bi=-1,bd=null,bc=Infinity;
    for(let i=0;i<open.length;i++){const k=open[i];for(const day of D){if(!past(day,k))continue;const c=kost(day,k);if(c<bc){bc=c;bi=i;bd=day}}}
    if(bi<0)break;const k=open.splice(bi,1)[0];bd.items.push({k,vast:false,tijd:""});bd.min+=duur(k);bd.cent=centrum(bd)}
  rest.push(...open);
  D.forEach(day=>wpVolgorde(day,loods,wsMin));
  const buurt=day=>{const pl={};day.items.forEach(x=>{const p=wpPlaats(x.k)||"?";pl[p]=(pl[p]||0)+1});const top=Object.keys(pl).sort((a,b)=>pl[b]-pl[a]);return top.slice(0,2).join(" · ")};
  D.forEach(day=>day.buurt=buurt(day));
  const waarsch=[];rest.forEach(k=>{if(wpPrio(k)<=0)waarsch.push({k,t:"Past niet meer deze week · "+(wpPrio(k)<0?Math.abs(wpPrio(k))+" dagen over tijd":"vandaag aan de beurt")})});
  D.forEach(day=>day.items.forEach(x=>{if(!x.vast&&teVroeg(x.k,day.d))x.vroeg=true}));
  return{ws:iso(ws),dagen:D,rest,waarsch,loods};
}
/* volgorde en tijden binnen een dag: vanaf de loods naar de dichtstbijzijnde, vaste tijden blijven staan */
function wpVolgorde(day,loods,wsMin){
  const vastT=day.items.filter(x=>x.vast&&toMin(x.tijd)!=null).sort((a,b)=>toMin(a.tijd)-toMin(b.tijd)),los=day.items.filter(x=>!(x.vast&&toMin(x.tijd)!=null));
  const seq=[];let pos=loods;while(los.length){let bi=0,bd=Infinity;for(let i=0;i<los.length;i++){const c=wpCo(los[i].k);const d=pos&&c?wpAfst(pos,c):(seq.length?50:0)+(wpPc4(los[i].k)===(seq.length?wpPc4(seq[seq.length-1].k):"")?0:20);if(d<bd){bd=d;bi=i}}
    const x=los.splice(bi,1)[0];seq.push(x);pos=wpCo(x.k)||pos}
  let m=wsMin,prev=loods,reis=0,km=0;const out=[];const anker=vastT.slice();
  const naar=x=>{const c=wpCo(x.k);const r=prev&&c?(rtMin(prev,c)||0):(out.length?8:5);if(prev&&c)km+=wpAfst(prev,c);reis+=r;return r};
  const zetAnker=()=>{const a=anker.shift();const r=naar(a);m=Math.max(m+r,toMin(a.tijd))+duur(a.k);prev=wpCo(a.k)||prev;out.push(a)};
  for(const x of seq){
    while(anker.length&&toMin(anker[0].tijd)<=m)zetAnker();
    const c=wpCo(x.k),schat=prev&&c?(rtMin(prev,c)||0):(out.length?8:5);
    while(anker.length&&m+schat+duur(x.k)>toMin(anker[0].tijd))zetAnker();
    const r=naar(x),start=Math.ceil((m+r)/5)*5;x.tijd=fromMin(start);m=start+duur(x.k);prev=wpCo(x.k)||prev;out.push(x)}
  while(anker.length)zetAnker();
  if(loods&&prev&&prev!==loods){km+=wpAfst(prev,loods);reis+=rtMin(prev,loods)||0}
  day.items=out;day.reis=reis;day.km=Math.round(km);day.eind=m;
}

/* ---------- scherm ---------- */
async function openWeekplan(ws){
  const o=wpOpt();ws=startOfWeek(ws||addDays(startOfWeek(today()),7));
  WP.st={ws,o,v:null,bezig:false,mode:"week"};
  if(WP.ov)WP.ov.remove();const ov=document.createElement("div");ov.className="vraag-ov wp-ov";document.body.appendChild(ov);WP.ov=ov;
  ov.addEventListener("click",e=>{if(e.target===ov)wpSluit()});
  wpTeken();
  /* adressen zonder coördinaten eerst opzoeken, dan pas rekenen */
  const kand=[...wpKandidaten(ws,o),...actief().filter(k=>k.gepland&&k.gepland>=iso(ws)&&k.gepland<=iso(addDays(ws,6))),rtBedrijf()];
  if(typeof pkGeocode==="function"&&pkOpen(kand).length){WP.st.bezig=true;wpTeken();try{await pkGeocode(kand)}catch(e){}WP.st.bezig=false;if(WP.ov!==ov)return}
  wpReken();
}
function wpSluit(){if(WP.ov){WP.ov.remove();WP.ov=null}WP.st=null;WP.map=null}
function wpReken(){const s=WP.st;if(!s)return;s.v=wpVoorstel(s.ws,s.o);wpTeken();wpKaart()}
function wpTeken(){const s=WP.st;if(!s||!WP.ov)return;const v=s.v,o=s.o,ws=s.ws,we=addDays(ws,6),mnd=["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
  const dtx=d=>{const x=parse(d);return wd(x)+" "+x.getDate()+" "+mnd[x.getMonth()]};
  const kand=wpKandidaten(ws,o),laat=kand.filter(k=>wpPrio(k)<0).length,vastN=actief().filter(k=>k.gepland&&k.gepland>=iso(ws)&&k.gepland<=iso(we)).length;
  const nieuw=v?v.dagen.reduce((a,d)=>a+d.items.filter(x=>!x.vast).length,0):0,totMin=v?v.dagen.reduce((a,d)=>a+d.min+d.reis,0):0,omzet=v?v.dagen.reduce((a,d)=>a+d.items.filter(x=>!x.vast).reduce((b,x)=>b+(Number(x.k.prijs)||0),0),0):0;
  const rij=(x,day)=>{const k=x.k,a=jobAddrObj(k),p=wpPrio(k);
    const badge=x.vast?`<span class="wp-b vast">vast</span>`:p<0?`<span class="wp-b laat">+${-p}</span>`:x.vroeg?`<span class="wp-b vroeg">vroeg</span>`:"";
    const dg=wpDagen(k);
    return `<li class="wp-r${x.vast?" vast":""}" data-id="${esc(k.id)}"><span class="wp-t">${esc(x.tijd||"–")}</span><div class="wp-m"><b>${esc(a.adres||cleanName(k.naam))}</b><small>${esc(cleanName(k.naam))}${a.plaats?" · "+esc(a.plaats):""} · ${duur(k)} min${dg?" · "+dg.map(n=>["zo","ma","di","wo","do","vr","za"][n]).join("/"):""}</small></div>${badge}
      ${x.vast?"":`<select class="wp-mv" data-wpmv="${esc(k.id)}" aria-label="Verplaatsen"><option value="">${esc(wd(parse(day.d)))}</option>${v.dagen.filter(d=>d.d!==day.d).map(d=>`<option value="${d.d}">${esc(wd(parse(d.d)))} ${parse(d.d).getDate()}</option>`).join("")}<option value="-">Niet deze week</option></select><button type="button" class="iconbtn sm wp-vk" data-wpvk="${esc(k.id)}" title="Voorkeursdagen van deze klant" aria-label="Voorkeursdagen">${I.cal2}</button>`}</li>`};
  const dagKaart=(day,i)=>{const n=day.items.length,nw=day.items.filter(x=>!x.vast).length,vol=Math.min(100,Math.round((day.min+day.reis)/(o.uur*60)*100));
    return `<section class="wp-d" style="--c:${WP_KLEUR[i%WP_KLEUR.length]}"><header><i class="wp-dot"></i><div><b>${esc(dtx(day.d))}</b><small>${n?`${plural(n,"adres","adressen")} · ${wpU(day.min+day.reis)}${day.km?" · "+day.km+" km":""}${day.buurt?" · "+esc(day.buurt):""}`:"Vrij"}</small></div>${n?`<span class="wp-klaar">klaar ± ${fromMin(day.eind)}</span>`:""}</header>
      ${n?`<div class="wp-vol"><i style="width:${vol}%"></i></div><ol>${day.items.map(x=>rij(x,day)).join("")}</ol>`:`<p class="wp-leeg">Geen adressen · <button type="button" class="linkbtn" data-wpvul="${day.d}">vul deze dag aan</button></p>`}
      ${n&&(day.min+day.reis)<o.uur*60-60?`<p class="wp-leeg">Nog ${wpU(o.uur*60-day.min-day.reis)} over · <button type="button" class="linkbtn" data-wpvul="${day.d}">vul aan</button></p>`:""}</section>`};
  WP.ov.innerHTML=`<div class="rk wp" role="dialog" aria-modal="true" aria-label="Weekrooster">
    <div class="rk-h"><span class="objic">${I.wand}</span><div><b>Plan de week</b><small>Week ${weekNr(ws)} · ${fmtD(ws)} – ${fmtD(we)}</small></div>
      <div class="pl-dnav wp-nav" role="group" aria-label="Week"><button type="button" data-wpnav="-1" aria-label="Vorige week">${I.left}</button><button type="button" data-wpnav="1" aria-label="Volgende week">${I.right}</button></div>
      <button type="button" class="iconbtn sm" data-wpx aria-label="Sluiten">${I.x}</button></div>
    <div class="wp-sum"><div><b>${kand.length}</b><small>aan de beurt</small></div><div><b class="${laat?"laat":""}">${laat}</b><small>over tijd</small></div><div><b>${vastN}</b><small>al vast</small></div><div><b>${v?v.dagen.filter(d=>d.items.length).length:"–"}</b><small>wasdagen</small></div></div>
    <div class="wp-opt"><label>Max per dag<select data-wpo="uur">${[4,5,6,7,8,9,10].map(u=>`<option value="${u}"${o.uur===u?" selected":""}>${u} uur</option>`).join("")}</select></label>
      <label>Mag te vroeg<select data-wpo="vroeg">${[0,3,7,14].map(u=>`<option value="${u}"${o.vroeg===u?" selected":""}>${u?u+" dagen":"nooit"}</option>`).join("")}</select></label>
      <span class="sp"></span><button type="button" class="small" data-wpreken>${I.refresh}Opnieuw</button></div>
    <div id="wpMap" class="wp-map${v&&v.dagen.some(d=>d.items.some(x=>wpCo(x.k)))?"":" hide"}"></div>
    ${s.bezig?`<p class="wp-leeg">Adressen opzoeken…</p>`:!v?`<p class="wp-leeg">Rekenen…</p>`:`
    <div class="wp-dagen">${v.dagen.map(dagKaart).join("")}</div>
    ${v.waarsch.length?`<div class="wp-w">${v.waarsch.map(w=>`<span>${I.alert}<b>${esc(cleanName(w.k.naam))}</b> · ${esc(w.t)}</span>`).join("")}</div>`:""}
    ${v.rest.length?`<p class="wp-leeg">${plural(v.rest.length,"klant schuift","klanten schuiven")} door naar een volgende week: ${v.rest.slice(0,6).map(k=>esc(cleanName(k.naam))).join(", ")}${v.rest.length>6?" …":""}</p>`:""}
    <div class="rk-f"><small>${nieuw?`${plural(nieuw,"nieuwe afspraak","nieuwe afspraken")} · ${wpU(totMin)} werk · ${eur0(toon(omzet))}`:"Niets nieuws in te plannen"}</small><span class="sp"></span><button type="button" class="ghost" data-wpx>Annuleren</button><button type="button" class="primary" data-wpzet ${nieuw?"":"disabled"}>${I.check}Zet in agenda</button></div>`}
  </div>`;
  const ov=WP.ov;
  ov.querySelectorAll("[data-wpx]").forEach(b=>b.onclick=wpSluit);
  ov.querySelectorAll("[data-wpnav]").forEach(b=>b.onclick=()=>{openWeekplan(addDays(s.ws,7*Number(b.dataset.wpnav)))});
  ov.querySelectorAll("[data-wpo]").forEach(e=>e.onchange=()=>{s.o[e.dataset.wpo]=Number(e.value);wpOptSave(s.o);wpReken()});
  const r=ov.querySelector("[data-wpreken]");if(r)r.onclick=wpReken;
  ov.querySelectorAll("[data-wpmv]").forEach(e=>e.onchange=()=>wpVerplaats(e.dataset.wpmv,e.value));
  ov.querySelectorAll("[data-wpvk]").forEach(b=>b.onclick=()=>wpVoorkeur(b.dataset.wpvk));
  ov.querySelectorAll("[data-wpvul]").forEach(b=>b.onclick=()=>wpVul(b.dataset.wpvul));
  const z=ov.querySelector("[data-wpzet]");if(z)z.onclick=wpZet;
}
function wpVerplaats(id,naar){const v=WP.st.v;let x=null,van=null;v.dagen.forEach(d=>{const i=d.items.findIndex(y=>y.k.id===id);if(i>=0){x=d.items.splice(i,1)[0];van=d}});if(!x)return;
  const loods=v.loods,wsMin=toMin(S().werkStart)??480;
  if(naar==="-")v.rest.push(x.k);else{const d=v.dagen.find(y=>y.d===naar);if(d){x.tijd="";d.items.push(x)}}
  v.dagen.forEach(d=>{d.min=d.items.reduce((a,y)=>a+duur(y.k),0);wpVolgorde(d,loods,wsMin)});wpTeken();wpKaart()}
function wpVul(d){const s=WP.st,v=s.v;if(!v)return;const day=v.dagen.find(x=>x.d===d);if(!day)return;
  const cap=s.o.uur*60,inD=new Set(v.dagen.flatMap(x=>x.items.map(y=>y.k.id)));
  /* kandidaten: wie nog los ligt deze week, daarna wie binnen 3 weken aan de beurt is, dichtstbij eerst */
  const extra=teplannen(addDays(parse(d),21)).filter(k=>!inD.has(k.id)&&!(k.gepland&&k.gepland>=iso(today()))&&wpMagOp(k,d));
  const cent=day.items.length?(()=>{const cs=day.items.map(x=>wpCo(x.k)).filter(Boolean);return cs.length?[cs.reduce((a,c)=>a+c[0],0)/cs.length,cs.reduce((a,c)=>a+c[1],0)/cs.length]:null})():v.loods;
  extra.sort((a,b)=>{const ca=wpCo(a),cb=wpCo(b);const da=ca&&cent?wpAfst(cent,ca):50,db=cb&&cent?wpAfst(cent,cb):50;return (da+Math.max(0,wpPrio(a))*.4)-(db+Math.max(0,wpPrio(b))*.4)});
  let n=0;for(const k of extra){if(day.min+day.reis+duur(k)+8>cap)break;day.items.push({k,vast:false,tijd:"",vroeg:teVroeg(k,d)});day.min+=duur(k);n++;v.rest=v.rest.filter(x=>x.id!==k.id)}
  if(!n){toast("Niemand in de buurt die binnenkort aan de beurt is");return}
  wpVolgorde(day,v.loods,toMin(S().werkStart)??480);toast(plural(n,"adres","adressen")+" toegevoegd aan "+fmtD(d));wpTeken();wpKaart()}
function wpVoorkeur(id){const k=state.klanten.find(x=>x.id===id);if(!k)return;const cur=wpDagen(k)||[];
  const o=document.createElement("div");o.className="vraag-ov";o.style.zIndex=340;
  o.innerHTML=`<div class="rk" style="max-width:380px"><div class="rk-h"><span class="objic">${I.cal2}</span><div><b>Voorkeursdagen</b><small>${esc(cleanName(k.naam))} · alleen op deze dagen plannen</small></div></div>
    <div class="wp-vkd">${[1,2,3,4,5,6].map(n=>`<label><input type="checkbox" value="${n}"${cur.includes(n)?" checked":""}><span>${["zo","ma","di","wo","do","vr","za"][n]}</span></label>`).join("")}</div>
    <p class="help">Niets aangevinkt = elke werkdag mag. Dit onthoudt het systeem voor alle volgende weken.</p>
    <div class="rk-f"><button type="button" class="ghost" data-x>Annuleren</button><span class="sp"></span><button type="button" class="primary" data-ok>Opslaan</button></div></div>`;
  document.body.appendChild(o);o.querySelector("[data-x]").onclick=()=>o.remove();
  o.querySelector("[data-ok]").onclick=async()=>{const dg=[...o.querySelectorAll("input:checked")].map(e=>Number(e.value));try{await save("klanten",k.id,{...strip(k),planDagen:dg});k.planDagen=dg;o.remove();toast(dg.length?"Voorkeur opgeslagen":"Voorkeur gewist");wpReken()}catch(e){err(e)}}}
async function wpZet(){const s=WP.st,v=s&&s.v;if(!v)return;const b=WP.ov.querySelector("[data-wpzet]");if(b)b.disabled=true;
  let n=0;const dagen=[];
  try{for(const day of v.dagen){const nieuw=day.items.filter(x=>!x.vast);if(!nieuw.length)continue;
      for(const x of nieuw){await save("klanten",x.k.id,{...strip(x.k),gepland:day.d,tijd:x.tijd,aanbieden:false});n++}
      await save("routes",day.d,{...strip(state.routes[day.d]||{}),order:day.items.map(x=>x.k.id)});dagen.push(day.d)}
    toast(plural(n,"afspraak","afspraken")+" ingepland over "+plural(dagen.length,"dag","dagen"));
    state.pview="week";state.week=startOfWeek(parse(v.ws));state.planDay=v.dagen[0]?v.dagen[0].d:iso(parse(v.ws));wpSluit();render()}
  catch(e){err(e);if(b)b.disabled=false}}
/* kaartje: per dag een kleur */
async function wpKaart(){const s=WP.st,v=s&&s.v;const el=WP.ov&&WP.ov.querySelector("#wpMap");if(!v||!el||el.classList.contains("hide")||typeof pkLaadLeaflet!=="function")return;
  try{await pkLaadLeaflet()}catch(e){el.classList.add("hide");return}if(!WP.ov||!WP.ov.contains(el))return;
  const L=window.L;if(!el._map){el._map=L.map(el,{zoomControl:false,attributionControl:false});rvOndergrond(el);rvLaagKnop(el);el._laag=L.layerGroup().addTo(el._map)}
  const m=el._map;el._laag.clearLayers();const pts=[];
  v.dagen.forEach((day,i)=>{const c=WP_KLEUR[i%WP_KLEUR.length];day.items.forEach((x,j)=>{const co=wpCo(x.k);if(!co)return;pts.push(co);
    L.marker(co,{icon:L.divIcon({className:"wp-pin",html:`<i style="background:${c}">${j+1}</i>`,iconSize:[22,22],iconAnchor:[11,11]})}).bindTooltip(`${wd(parse(day.d))} ${x.tijd} · ${esc(jobAddrObj(x.k).adres||cleanName(x.k.naam))}`).addTo(el._laag)})});
  if(v.loods){pts.push(v.loods);L.marker(v.loods,{icon:L.divIcon({className:"wp-pin",html:`<i class="loods">${I.truck||"L"}</i>`,iconSize:[26,26],iconAnchor:[13,13]})}).addTo(el._laag)}
  if(pts.length){m.invalidateSize();m.fitBounds(pts,{padding:[18,18],maxZoom:14})}
}
