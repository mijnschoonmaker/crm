/* ---------- MELDKAMER → BUS (zoals 112): berichten van kantoor die direct op de telefoon/iPad onderweg verschijnen ----------
   Kantoor maakt op het Overzicht een melding (urgentie, tekst, eventueel een adres). Die staat meteen als rode pin op de live kaart
   en springt op elk ander apparaat open, met trilling, geluid en pushmelding. De bus tikt op "Begrepen": kantoor ziet wie hem
   wanneer gelezen heeft. Daarnaast: verandert de planning van vandaag op een ander apparaat, dan krijgt de bus daar direct een melding van.
   Opslag: live/inzet_<id> (zelfde rechten als de live-locatie), alleen van vandaag. */
const IZ={lijst:[],unsub:null,weg:new Set(),open:null,lokaal:0,sig:null,sigT:0,demo:[]};
const IZ_PRIO={1:["Spoed","rood"],2:["Vandaag","oranje"],3:["Info","grijs"]};
const izMijnKey=()=>String((state.me&&state.me.email)||"ik").toLowerCase().replace(/[^a-z0-9]/g,"_");
const izAan=x=>(Array.isArray(x.aan)?x.aan:x.aan?[x.aan]:[]).map(v=>String(v).toLowerCase());
const izVoorMij=x=>{const A=izAan(x);if(!A.length)return true;const ik=[String(doorNaam()||"").toLowerCase(),String((state.me&&state.me.email)||"").toLowerCase()];return A.some(v=>ik.includes(v))};
const izLijst=()=>(LIVE?IZ.lijst:IZ.demo).filter(x=>x.datum===iso(today())).sort((a,b)=>String(b.op).localeCompare(String(a.op)));
function izLuister(){if(!LIVE||IZ.unsub||!state.loaded)return;
  try{IZ.unsub=fsDb().collection("live").where("soort","==","inzet").onSnapshot(q=>{IZ.lijst=q.docs.map(d=>({id:d.id,...d.data()}));izVerwerk()},()=>{IZ.unsub=null})}catch(e){}}
if(typeof window!=="undefined")setTimeout(function w(){if(!state.loaded)return setTimeout(w,1000);izLuister();izPlanSig(true)},2500);
/* nieuwe melding voor dit apparaat? Dan openklappen (niet op het apparaat dat hem verstuurde) */
function izVerwerk(){izKantoorZet();izPins();
  const k=izMijnKey(),nieuw=izLijst().filter(x=>x.dev!==LV_DEV&&izVoorMij(x)&&!(x.gelezen||{})[k]&&!IZ.weg.has(x.id)).sort((a,b)=>(a.prio||3)-(b.prio||3)||String(a.op).localeCompare(String(b.op)))[0];
  if(nieuw&&(!IZ.open||IZ.open!==nieuw.id))izToon(nieuw)}
function izToon(x){IZ.open=x.id;let d=document.getElementById("izDlg");if(d)d.remove();d=document.createElement("dialog");d.id="izDlg";d.className="iz-dlg";
  const [pl,pc]=IZ_PRIO[x.prio]||IZ_PRIO[3],k=x.klantId&&state.klanten.find(y=>y.id===x.klantId),tijd=new Date(x.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"});
  const nav=x.lat&&x.lng?`https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lng}`:x.adres?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(x.adres)}`:"";
  d.innerHTML=`<div class="iz-k ${pc}"><span class="iz-p"><i></i>${esc(pl)}</span><span>Melding van ${esc(x.doorNaam||"kantoor")} · ${tijd}</span></div>
    <div class="iz-b"><p class="iz-t">${esc(x.tekst||"")}</p>${x.adres||k?`<div class="iz-a">${I.map||""}<div><b>${esc(k?cleanName(k.naam):"")}</b><span>${esc(x.adres||"")}</span></div></div>`:""}</div>
    <div class="iz-f">${nav?`<a class="iz-nav" href="${esc(nav)}" target="_blank" rel="noopener">${I.route||""}Navigeer</a>`:""}${k?`<button type="button" class="iz-kl" data-izk="${esc(k.id)}">Open klant</button>`:""}<button type="button" class="primary iz-ok" data-izok="${esc(x.id)}">${I.check}Begrepen</button></div>`;
  document.body.appendChild(d);try{d.showModal()}catch(e){d.setAttribute("open","")}
  try{navigator.vibrate&&navigator.vibrate(x.prio===1?[300,120,300,120,300]:[200,100,200])}catch(e){}
  try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type="sine";o.frequency.value=x.prio===1?1046:880;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.35)}catch(e){}
  d.addEventListener("cancel",e=>e.preventDefault())}
document.addEventListener("click",async e=>{const ok=e.target.closest("[data-izok]"),kl=e.target.closest("[data-izk]");if(!ok&&!kl)return;e.preventDefault();
  const d=document.getElementById("izDlg"),id=(ok&&ok.dataset.izok)||IZ.open;
  if(id){IZ.weg.add(id);const k=izMijnKey(),nu=new Date().toISOString();
    if(LIVE)try{await fsDb().doc("live/"+id).set({gelezen:{[k]:{t:nu,naam:doorNaam()||""}}},{merge:true})}catch(er){console.warn(er)}
    else{const x=IZ.demo.find(y=>y.id===id);if(x)x.gelezen={...(x.gelezen||{}),[k]:{t:nu,naam:doorNaam()||""}}}}
  if(d){try{d.close()}catch(_){}d.remove()}IZ.open=null;if(kl&&typeof openKlantView==="function")openKlantView(kl.dataset.izk);izVerwerk()},true);

/* ---- kantoor: melding maken ---- */
const izBusChip=(v,l,on,kl,sub)=>`<button type="button" class="iz-bus" data-izb="${esc(v)}" aria-pressed="${on}"><span class="iz-bi" style="background:${esc(kl)}">${v?esc(String(l).charAt(0).toUpperCase()):(I.klanten||"")}</span><span><b>${esc(l)}</b>${sub?`<small>${esc(sub)}</small>`:""}</span></button>`;
function izNieuw(){const ti=iso(today()),stops=routeStops(ti).filter(x=>!x.done),mens=(typeof plKandidaten==="function"?plKandidaten():[]).filter(Boolean);
  const snel=["Klant belde: poort staat open","Klant is niet thuis, sleutel ligt bij de buren","Extra adres erbij vandaag","Bel even naar kantoor","Klant wil vandaag afzeggen"];
  openDlg(`<div class="dlg-head"><span class="objic big">${I.send}</span><div style="min-width:0;flex:1"><h3>Melding naar de bus</h3><div class="subt">Verschijnt direct op de telefoon of iPad onderweg</div></div><button type="button" class="iconbtn" id="izX" aria-label="Sluiten">${I.x}</button></div>
    <label>Urgentie</label><div class="iz-prio" role="radiogroup">${[1,2,3].map(p=>`<button type="button" class="iz-pk ${IZ_PRIO[p][1]}" data-izp="${p}" aria-pressed="${p===2}"><i></i>${IZ_PRIO[p][0]}</button>`).join("")}</div>
    <label>Aan</label><div class="iz-aan" role="group">${izBusChip("","Iedereen",true,"#252c3c",mens.length?plural(mens.length,"bus","bussen"):"alle apparaten")}${mens.map(m=>{const pm=(typeof plMensen==="function"?plMensen():[]).find(x=>x.naam===m),on=pm&&pm.live&&typeof plVers==="function"&&plVers(pm.live);
      return izBusChip(m,m,false,(pm&&pm.kleur)||"#5d6675",on?"live onderweg":pm&&pm.stops.length?plural(pm.stops.length,"adres","adressen")+" vandaag":"")}).join("")}</div>
    ${mens.length?"":`<p class="subt" style="margin:-4px 0 12px">Rijden er vandaag meer bussen, dan kies je hier per bus.</p>`}
    <label>Bericht<textarea id="izT" rows="3" maxlength="400" placeholder="Bijv. klant belde: poort staat open, achterom via het steegje"></textarea></label>
    <div class="iz-snel">${snel.map(t=>`<button type="button" class="chip" data-izs="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <label>Adres (komt als pin op de kaart)<select id="izK"><option value="">Geen adres</option>${stops.map(x=>`<option value="${esc(x.k.id)}">${esc((x.k.tijd?x.k.tijd+" · ":"")+cleanName(x.k.naam)+" · "+(jobAddrObj(x.k).adres||""))}</option>`).join("")}</select></label>
    <div class="row"><span class="sp"></span><button type="button" id="izAnn">Annuleren</button><button type="submit" class="primary" id="izGo">${I.send}Versturen</button></div>`,{wide:true});
  $("#izX").onclick=$("#izAnn").onclick=()=>dlg.close();
  form.querySelectorAll("[data-izp]").forEach(b=>b.onclick=()=>form.querySelectorAll("[data-izp]").forEach(x=>x.setAttribute("aria-pressed",x===b)));
  /* Iedereen of één/meer bussen aanklikken */
  form.querySelectorAll("[data-izb]").forEach(b=>b.onclick=()=>{const alle=b.dataset.izb==="";const L=[...form.querySelectorAll("[data-izb]")];
    if(alle)L.forEach(x=>x.setAttribute("aria-pressed",x===b));else{b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true");const iets=L.some(x=>x.dataset.izb&&x.getAttribute("aria-pressed")==="true");L.find(x=>x.dataset.izb==="").setAttribute("aria-pressed",!iets)}});
  form.querySelectorAll("[data-izs]").forEach(b=>b.onclick=()=>{const t=$("#izT");t.value=b.dataset.izs;t.focus()});
  form.onsubmit=async e=>{e.preventDefault();const tekst=$("#izT").value.trim();if(!tekst){$("#izT").focus();return}
    const prio=Number((form.querySelector('[data-izp][aria-pressed="true"]')||{}).dataset?.izp||2),kid=$("#izK").value,k=kid&&state.klanten.find(x=>x.id===kid),c=k&&typeof pkCoord==="function"?pkCoord(k):null;
    const id="inzet_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const x={soort:"inzet",datum:iso(today()),op:new Date().toISOString(),tekst,prio,aan:[...form.querySelectorAll('[data-izb][aria-pressed="true"]')].map(x=>x.dataset.izb).filter(Boolean),klantId:kid||"",adres:k?[jobAddrObj(k).adres,jobAddrObj(k).plaats].filter(Boolean).join(", "):"",
      ...(c?{lat:c[0],lng:c[1]}:{}),door:String((state.me&&state.me.email)||""),doorNaam:doorNaam()||"Kantoor",dev:LV_DEV,gelezen:{}};
    $("#izGo").disabled=true;
    try{if(LIVE){await fsDb().doc("live/"+id).set(x);try{await fbFn("inzetPush")({id})}catch(er){console.warn("push",er)}}else IZ.demo.push({id,...x});
      dlg.close();toast("Melding verstuurd "+(x.aan.length?"naar "+x.aan.join(", "):"naar iedereen onderweg"));izVerwerk()}catch(er){$("#izGo").disabled=false;err(er)}}}
document.addEventListener("click",e=>{if(e.target.closest("[data-iznieuw]")){e.preventDefault();izNieuw()}});

/* ---- kantoor: overzicht van verstuurde meldingen met leesstatus ---- */
function izKantoorHtml(){const L=izLijst();
  return `<div class="iz-kant"><div class="iz-kh"><b>${I.send}Meldingen naar de bus</b><button type="button" class="mk-b" data-iznieuw="1">${I.plus||"+"}Nieuwe melding</button></div>${L.length?`<ul>${L.slice(0,6).map(x=>{const g=Object.values(x.gelezen||{}),[pl,pc]=IZ_PRIO[x.prio]||IZ_PRIO[3],t=new Date(x.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"});
    return `<li class="${pc}"><span class="iz-pp"><i></i>${pl}</span><span class="iz-lt"><b>${esc(x.tekst)}</b><small>${t} · ${izAan(x).length?"aan "+esc((Array.isArray(x.aan)?x.aan:[x.aan]).join(", ")):"aan iedereen"}${x.adres?" · "+esc(x.adres):""}</small></span><span class="iz-st ${g.length?"ok":""}">${g.length?`${I.check}Gelezen door ${esc(g.map(y=>y.naam||"bus").join(", "))} · ${new Date(g[0].t).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}`:"Verstuurd · nog niet gelezen"}</span></li>`}).join("")}</ul>`:`<p class="iz-leeg">Nog geen meldingen vandaag. Zet hier iets klaar voor de bus, bijvoorbeeld als een klant belt.</p>`}</div>`}
function izKantoorZet(){if(state.tab!=="control")return;const el=document.querySelector(".iz-kant");if(!el)return;const t=document.createElement("div");t.innerHTML=izKantoorHtml();el.replaceWith(t.firstElementChild)}
/* ---- rode pin op de live kaart (zoals de melder bij 112) ---- */
function izPins(){const el=document.getElementById("rvMap"),m=el&&el._map,L=window.L;if(!m||!L)return;
  if(el._iz)m.removeLayer(el._iz);el._iz=L.layerGroup().addTo(m);const k=izMijnKey();
  izLijst().filter(x=>x.lat&&x.lng&&!Object.keys(x.gelezen||{}).length).forEach(x=>{const [pl,pc]=IZ_PRIO[x.prio]||IZ_PRIO[3];
    L.marker([x.lat,x.lng],{zIndexOffset:2000,icon:L.divIcon({className:"iz-pin "+pc,html:`<span class="iz-pb">!</span><span class="iz-pl">${esc(pl)}</span>`,iconSize:[30,44],iconAnchor:[15,40]})}).bindTooltip(esc(x.tekst),{direction:"top",offset:[0,-34]}).addTo(el._iz)})}
if(typeof window!=="undefined")setInterval(()=>{try{izPins()}catch(e){}},15000);

/* ---- planning van vandaag gewijzigd op een ander apparaat: melding op dit apparaat ---- */
function izPlanSig(stil){try{const ti=iso(today()),S2={};routeStops(ti).filter(x=>!x.done).forEach(x=>S2[x.k.id]={n:cleanName(x.k.naam),t:x.k.tijd||""});
  const oud=IZ.sig;IZ.sig=S2;if(stil||!oud||Date.now()-IZ.lokaal<6000)return;
  const bij=Object.keys(S2).filter(i=>!oud[i]),af=Object.keys(oud).filter(i=>!S2[i]&&!state.beurten.some(b=>b.klantId===i&&b.datum===ti)),tijd=Object.keys(S2).filter(i=>oud[i]&&oud[i].t!==S2[i].t);
  if(!bij.length&&!af.length&&!tijd.length)return;
  const r=[...bij.map(i=>"+ "+S2[i].n+(S2[i].t?" om "+S2[i].t:"")),...af.map(i=>"− "+oud[i].n+" vervalt"),...tijd.map(i=>S2[i].n+": "+(oud[i].t||"?")+" → "+(S2[i].t||"?"))];
  izPlanBalk(r)}catch(e){}}
function izPlanBalk(r){let b=document.getElementById("izPlan");if(b)b.remove();b=document.createElement("div");b.id="izPlan";b.className="iz-plan";b.setAttribute("role","alert");
  b.innerHTML=`<span class="iz-pi">${I.planning||""}</span><div><b>Planning van vandaag gewijzigd</b><small>${r.slice(0,3).map(esc).join(" · ")}${r.length>3?" · …":""}</small></div><button type="button" data-izpv="1">Bekijk</button><button type="button" class="iz-px" data-izpx="1" aria-label="Sluiten">${I.x}</button>`;
  document.body.appendChild(b);try{navigator.vibrate&&navigator.vibrate([150,80,150])}catch(e){}clearTimeout(IZ.pt);IZ.pt=setTimeout(()=>{const x=document.getElementById("izPlan");if(x)x.remove()},45000)}
document.addEventListener("click",e=>{const v=e.target.closest("[data-izpv]"),x=e.target.closest("[data-izpx]");if(!v&&!x)return;e.preventDefault();const b=document.getElementById("izPlan");if(b)b.remove();if(v){state.tab="vandaag";render()}});
