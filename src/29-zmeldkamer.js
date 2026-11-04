/* ---------- MELDKAMER: live binnenkomend + status van de bus + uitloop ----------
   Net als op een 112-meldkamer: één stroom van wat er nu binnenkomt, met een urgentiecode
   (rood = nu doen, oranje = vandaag, grijs = ter info), één tik om af te handelen of weg te zetten. Alleen echte gegevens. */
const MK={weg:null,gehoord:null};
const mkSet=(n,k)=>{if(MK[n])return MK[n];try{MK[n]=new Set(JSON.parse(localStorage.getItem(k)||"[]"))}catch(e){MK[n]=new Set()}return MK[n]};
/* "Gezien" geldt voor alle apparaten: bewaard in instellingen/meldkamer (MacBook, iPad en telefoon gelijk) */
const mkWegSync=()=>{const w=[...MK.weg].slice(-600);state.meldkamer={...(state.meldkamer||{}),weg:w};try{const r=save("instellingen","meldkamer",{weg:w});if(r&&r.catch)r.catch(()=>{})}catch(e){}};
const mkWeg=()=>{const s=mkSet("weg","ms.mk.weg");if(state.meldkamer){const srv=Array.isArray(state.meldkamer.weg)?state.meldkamer.weg:[],H=new Set(srv);srv.forEach(k=>s.add(k));if(s.size>600){const t=[...s].slice(-600);s.clear();t.forEach(k=>s.add(k))}
    /* staat hier iets als gezien dat de server (nog) niet heeft, bv. omdat twee apparaten tegelijk opsloegen: aanvullen tot alles gelijk is */
    if(!MK.syncT&&[...s].some(k=>!H.has(k)))MK.syncT=setTimeout(()=>{MK.syncT=0;mkWegSync()},1200)}return s},mkGehoord=()=>mkSet("gehoord","ms.mk.gehoord");
const mkBewaar=(n,k)=>{try{localStorage.setItem(k,JSON.stringify([...MK[n]].slice(-600)))}catch(e){}};
function mkStroom(){const L=[],grens=Date.now()-36*36e5,ts=x=>{const t=Date.parse(x||"");return t>0?t:0},nm=x=>cleanName(x||"")||"Klant";
  const add=(key,t,code,ic,titel,sub,act,knop)=>{const dag=/^\d{4}-\d{2}-\d{2}$/.test(String(t||"")),n=ts(dag?t+"T12:00:00":t);if(!n||n<grens)return;L.push({key,n,t,code,ic,titel,sub,act,knop,dag})};
  /* rood: klant wacht op ons */
  (state.tickets||[]).forEach(x=>{if(x.status!=="opgelost"&&Number(x.ongelezenTeam)>0)add("tk:"+x.id+":"+(x.laatst||""),x.laatst||x.aangemaakt,"rood","ticket","Klant wacht op antwoord",[nm(x.klantNaam),x.onderwerp].filter(Boolean).join(" · "),"tickets","Antwoorden")});
  (state.berichten||[]).forEach(m=>{const k=m.bouncedOp||m.geblokkeerdOp;if(k&&m.kanaal==="email")add("bo:"+m.id,k,"rood","alert","Mail kwam niet aan",[nm(m.klantNaam||m.naam),m.onderwerp].filter(Boolean).join(" · "),m.klantId?"klant:"+m.klantId:"tab:communicatie","Bekijken")});
  /* oranje: vandaag oppakken */
  state.klanten.forEach(k=>{if(k.nieuwAangemeld&&k.actief!==false)add("nk:"+k.id,k.aangemaakt||new Date().toISOString(),"oranje","klanten",k.aanvraagType==="contact"?"Contactverzoek":"Nieuwe aanvraag",[ccNaam(k),k.plaats].filter(Boolean).join(" · "),"klant:"+k.id,"Inplannen")});
  (state.portaalVz||[]).forEach(x=>add("vz:"+x.id,x.op||x.aangemaakt,"oranje","inbox","Verzoek uit het klantportaal",[nm(x.klantNaam),x.typeLabel||x.type].filter(Boolean).join(" · "),"tickets","Bekijken"));
  state.facturen.forEach(f=>{const off=f.soort==="offerte",n=nm(f.klantNaam);
    if(off&&f.akkoordOp)add("ak:"+f.id,f.akkoordOp,"oranje","check","Offerte getekend",n+" · "+eur(totals(f).inc),"f:"+f.id,"Inplannen");
    if(!off&&f.status==="betaald"&&(f.betaaldTs||f.betaaldOp))add("bt:"+f.id,f.betaaldTs||f.betaaldOp+"T12:00:00","grijs","euro","Betaald"+(f.betaalwijze==="mollie"?" via iDEAL":""),n+" · "+eur(totals(f).inc),"f:"+f.id)});
  /* grijs: ter info */
  state.beurten.forEach(b=>{if(b.op)add("bu:"+b.id,b.op,"grijs","check","Afgemeld"+(b.door?" door "+String(b.door).split(" ")[0]:""),[nm(b.klantNaam),b.dienst].filter(Boolean).join(" · "),"klant:"+b.klantId)});
  (state.berichten||[]).forEach(m=>{if(m.kanaal==="email"&&(m.trkOpenOp||m.gelezenOp))add("op:"+m.id,m.trkOpenOp||m.gelezenOp,"grijs","mail","Mail geopend",[nm(m.klantNaam||m.naam),m.onderwerp].filter(Boolean).join(" · "),m.klantId?"klant:"+m.klantId:"tab:communicatie")});
  const W=mkWeg(),R={rood:0,oranje:1,grijs:2};
  return L.filter(x=>!W.has(x.key)).sort((a,b)=>R[a.code]-R[b.code]||b.n-a.n)}
function mkTijd(n){const d=new Date(n),v=iso(d)===iso(today());return (v?"":(iso(d)===iso(addDays(today(),-1))?"gisteren ":fmtD(iso(d))+" "))+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
function mkStroomHtml(){const L=mkStroom(),n={rood:0,oranje:0,grijs:0};L.forEach(x=>n[x.code]++);
  const toon=MK.alles?L:L.slice(0,innerWidth<700?6:10),lbl={rood:"Nu doen",oranje:"Vandaag",grijs:"Info"};
  /* geluid: alleen bij een nieuwe rode melding */
  try{const G=mkGehoord(),nieuw=L.filter(x=>x.code==="rood"&&!G.has(x.key));if(nieuw.length){const eerst=!localStorage.getItem("ms.mk.gehoord");nieuw.forEach(x=>G.add(x.key));mkBewaar("gehoord","ms.mk.gehoord");if(!eerst&&S().ccGeluid!==false&&typeof ccPiep==="function")ccPiep();MK.flits=new Set(nieuw.map(x=>x.key))}}catch(e){}
  return `<section class="cc-card mk"><div class="cc-ch"><div><b>${I.bell}Live binnenkomend</b><small>Laatste 36 uur · nieuwste en belangrijkste bovenaan</small></div>
    <div class="mk-tel">${["rood","oranje","grijs"].map(c=>`<span class="mk-c ${c}" title="${lbl[c]}"><i></i>${n[c]}</span>`).join("")}</div></div>
    ${L.length?`<ul class="mk-l">${toon.map(x=>`<li class="mk-i ${x.code}${MK.flits&&MK.flits.has(x.key)?" flits":""}"><span class="mk-ic">${I[x.ic]||I.bell}</span>
      <button type="button" class="mk-t" data-cc="${esc(x.act)}"><span class="mk-r1">${x.code!=="grijs"?`<span class="mk-code">${lbl[x.code]}</span>`:""}<b>${esc(x.titel)}</b><time>${esc(x.dag?(iso(new Date(x.n))===iso(today())?"vandaag":fmtD(iso(new Date(x.n)))):mkTijd(x.n))}</time></span><small>${esc(x.sub)}</small></button>
      <span class="mk-k">${x.knop?`<button type="button" class="mk-b" data-cc="${esc(x.act)}">${esc(x.knop)}</button>`:""}<button type="button" class="mk-x" data-mkweg="${esc(x.key)}" aria-label="Gezien" title="Gezien">${I.check}</button></span></li>`).join("")}</ul>
      ${L.length>toon.length||MK.alles?`<button type="button" class="cc-link mk-meer" data-mkalles="1">${MK.alles?"Minder tonen":"Alle "+L.length+" tonen"}</button>`:""}`
      :`<p class="cc-leeg">Rustig. Er is de afgelopen 36 uur niets binnengekomen.</p>`}</section>`}
document.addEventListener("click",e=>{const w=e.target.closest("[data-mkweg]"),a=e.target.closest("[data-mkalles]");if(!w&&!a)return;e.preventDefault();e.stopPropagation();
  if(w){mkWeg().add(w.dataset.mkweg);mkBewaar("weg","ms.mk.weg");mkWegSync();const li=w.closest(".mk-i");if(li){li.classList.add("weg");setTimeout(()=>render(),220)}else render()}
  else{MK.alles=!MK.alles;render()}},true);

/* status van de bus (kleur zoals op de meldkamer) en uitloop t.o.v. de planning */
function mkBusStatus(){const ti=iso(today()),st=routeStops(ti),open=st.filter(x=>!x.done),bz=open.find(x=>x.k.bezig&&String(x.k.bezig).slice(0,10)===ti);
  const r=(state.routes||{})[ti]||{},w=r.werk||{};
  if(!st.length)return{c:"groen",t:"Geen route vandaag"};
  if(bz)return{c:"rood",t:"Bezig bij "+(jobAddrObj(bz.k).adres||ccNaam(bz.k))};
  if(!open.length)return{c:"groen",t:w.stop||w.eind?"Terug bij de loods":"Alles afgerond"};
  if(st.some(x=>x.done)||w.start)return{c:"blauw",t:"Onderweg naar "+(jobAddrObj(open[0].k).adres||ccNaam(open[0].k))};
  return{c:"groen",t:"Nog niet vertrokken"}}
function mkUitloop(){const ti=iso(today()),open=routeStops(ti).filter(x=>!x.done);if(!open.length)return null;
  const nu=new Date(),nm=nu.getHours()*60+nu.getMinutes(),k=open[0].k,tp=toMin(k.tijd);if(tp==null)return null;
  let laat=0;if(k.bezig){const sb=new Date(k.bezig),gestart=sb.getHours()*60+sb.getMinutes(),d=Number(typeof duur==="function"?duur(k):30)||30;laat=Math.max(gestart-tp,nm-(tp+d))}else laat=nm-tp;
  return laat>=15?{min:Math.round(laat),n:open.length}:null}
function mkStatusHtml(){const s=mkBusStatus(),u=mkUitloop();
  return `<div class="mk-bus ${s.c}"><span class="mk-bd"><i></i></span><b>${esc(s.t)}</b><span class="mk-leg"><span><i class="groen"></i>Loods / klaar</span><span><i class="blauw"></i>Onderweg</span><span><i class="rood"></i>Bij klant</span></span></div>
  ${u?`<div class="mk-laat">${I.alert}<span><b>Loopt ${u.min} min achter</b> · nog ${plural(u.n,"adres","adressen")}</span><button type="button" class="mk-b" data-act="bulkmsg">${I.msg||""}Klanten laten weten</button></div>`:""}`}
/* busje op de kaart: ring in de kleur van de status */
function mkBusKleur(){try{const el=document.getElementById("rvMap"),b=el&&el._bus&&el._bus.getElement&&el._bus.getElement();if(!b)return;const c=mkBusStatus().c;b.classList.remove("mk-groen","mk-blauw","mk-rood");b.classList.add("mk-"+c)}catch(e){}}
