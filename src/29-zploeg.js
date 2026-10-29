/* ---------- Control Center · meerdere bussen ----------
   Rij met de mensen die vandaag onderweg zijn. Tik op een naam: de kaart toont waar die rijdt en zijn adressen,
   de voortgang eronder alleen zijn adressen. "Iedereen" laat alle bussen tegelijk zien.
   Wie welk adres doet: afgemeld door (beurt), gestart door (bezigDoor) of ingedeeld in de dagroute (routes/<dag>.wie).
   Elke medewerker die live deelt schrijft zijn eigen live/mw_<email>; live/rit blijft zoals het was. */
const PL={live:{},unsub:null,dag:""};
const PL_KLEUR=["#137a8a","#d9822b","#7b5cd6","#2f9e5b","#c0447a","#3b6fd8"];
CC.mw=(()=>{try{return localStorage.getItem("ms.cc.mw")||""}catch(e){return""}})();
const plNm=s=>{const n=String(s||"").trim().split(/[\s@._-]/)[0];return n?n.charAt(0).toUpperCase()+n.slice(1).toLowerCase():""};
const plVers=L=>L&&L.actief&&L.datum===iso(today())&&Date.now()-Date.parse(L.ts||0)<5*60e3;
/* demo: twee bussen, Mark en Sem, die elk een deel van de route rijden */
const plDemo=()=>!LIVE;
const plDoorIdx=tikMemo("pld",day=>{const m={};state.beurten.forEach(x=>{if(x.datum===day&&x.door)(m[x.klantId]=m[x.klantId]||[]).push(x)});return m});
function plWie(k,day,i,n){day=day||iso(today());
  if(plDemo()){const R=routeStops(day),j=i!=null?i:R.findIndex(s=>s.k.id===k.id),t=n!=null?n:R.length;return j<Math.ceil(t/2)?"Mark":"Sem"}
  const b=(plDoorIdx(day)[k.id]||[]).slice().sort((a,c)=>String(c.op||"").localeCompare(String(a.op||"")))[0];if(b)return plNm(b.door);
  if(k.bezig&&k.bezigDoor)return plNm(k.bezigDoor);
  const w=((state.routes[day]||{}).wie||{})[k.id];return w?plNm(w):""}
/* demo: plek van een bus = halverwege zijn laatste klare adres en zijn volgende */
function plDemoPos(nm){const R=routeStops(iso(today())).filter((s,i,a)=>plWie(s.k,null,i,a.length)===nm),bk=rtBedrijf(),lo=pkHeeftAdres(bk)&&pkCoord(bk);
  const nx=R.findIndex(s=>!s.done),na=nx>=0?pkCoord(R[nx].k):null,vo=[...R.slice(0,nx<0?R.length:nx)].reverse().map(s=>pkCoord(s.k)).find(Boolean)||lo;
  if(na&&vo)return{lat:(vo[0]+na[0])/2,lng:(vo[1]+na[1])/2};const c=na||vo;return c?{lat:c[0],lng:c[1]}:null}
/* iedereen die vandaag onderweg is, met zijn adressen */
const PLM_M=tikMemo("plm",plMensenRuw);
function plMensen(){return PLM_M().slice()}
function plMensenRuw(){const ti=iso(today()),R=routeStops(ti),M={};
  const p=nm=>M[nm]||(M[nm]={naam:nm,stops:[],live:null});
  R.forEach((s,i)=>{const w=plWie(s.k,ti,i,R.length);if(w)p(w).stops.push(s)});
  Object.values(PL.live).forEach(L=>{const nm=plNm(L.naam||L.door);if(nm&&L.datum===ti)p(nm).live=L});
  if(plDemo())Object.values(M).forEach(m=>{const q=plDemoPos(m.naam);if(q)m.live={...q,actief:true,datum:ti,ts:new Date().toISOString(),demo:1}});
  return Object.values(M).sort((a,b)=>a.naam.localeCompare(b.naam,"nl")).map((m,i)=>({...m,kleur:PL_KLEUR[i%PL_KLEUR.length],klaar:m.stops.filter(s=>s.done).length}))}
const plMeer=()=>plMensen().length>=2;
/* kandidaten om een adres aan toe te wijzen: wie vandaag onderweg is en wie de laatste 60 dagen heeft afgemeld */
function plKandidaten(){const s=new Set(plMensen().map(m=>m.naam)),g=iso(addDays(today(),-60));
  if(!plDemo())state.beurten.forEach(b=>{if(b.door&&b.datum>=g)s.add(plNm(b.door))});
  return [...s].filter(Boolean).sort((a,b)=>a.localeCompare(b,"nl"))}
function plKies(nm){CC.mw=CC.mw===nm?"":nm;try{localStorage.setItem("ms.cc.mw",CC.mw)}catch(e){}const el=document.getElementById("rvMap");if(el){el._gezet=0;el._volg=true}render()}
function plSel(){if(!CC.mw)return"";return plMensen().some(m=>m.naam===CC.mw)?CC.mw:""}

/* ---------- de rij met namen ---------- */
function plStatus(m){const open=m.stops.filter(s=>!s.done),bz=m.stops.find(s=>!s.done&&s.k.bezig);
  if(m.stops.length&&!open.length)return["ok","Klaar voor vandaag"];
  if(bz)return["soon","Bezig bij "+ccNaam(bz.k)];
  if(plVers(m.live)||(m.live&&m.live.demo))return["live",open[0]?"Onderweg naar "+ccNaam(open[0].k):"Onderweg"];
  if(m.klaar)return["neutral","Laatst afgemeld "+(()=>{const b=state.beurten.filter(x=>x.datum===iso(today())&&plNm(x.door)===m.naam).map(x=>x.op).filter(Boolean).sort().pop();return b?new Date(b).toTimeString().slice(0,5):""})()];
  return["neutral",m.stops.length?"Nog niet gestart":"Geen adressen ingedeeld"]}
function plRijHtml(){const M=plMensen();if(M.length<2)return"";const sel=plSel(),tot=M.reduce((a,m)=>a+m.stops.length,0),kl=M.reduce((a,m)=>a+m.klaar,0);
  const R=routeStops(iso(today())),los=R.length-tot;
  const chip=(nm,kleur,titel,sub,teller,cls,act)=>`<button type="button" class="pl-chip${cls}" data-cc="${act}" aria-pressed="${cls.includes(" on")}" style="--pk:${kleur}"><span class="pl-av">${titel}</span><span class="pl-tx"><b>${esc(nm)}</b><small>${esc(sub)}</small></span><span class="pl-tel">${teller}</span></button>`;
  return `<section class="cc-card pl-rij" id="ccPloeg"><div class="pl-kop"><b>${I.truck||""}Onderweg vandaag</b><small>Tik op een naam: de kaart toont waar die rijdt, de voortgang eronder alleen zijn adressen</small></div>
    <div class="pl-chips">${chip("Iedereen","#252c3c",I.klanten||"",plural(M.length,"bus","bussen")+" · "+plural(R.length,"adres","adressen")+(los>0?" · "+los+" niet ingedeeld":""),kl+"/"+R.length,sel?"":" on","mw:")}
    ${M.map(m=>{const st=plStatus(m);return chip(m.naam,m.kleur,esc(m.naam.charAt(0))+(st[0]==="live"||st[0]==="soon"?'<i class="pl-puls"></i>':""),st[1],m.klaar+"/"+m.stops.length,(sel===m.naam?" on":"")+" st-"+st[0],"mw:"+esc(m.naam))}).join("")}</div></section>`}

/* ---------- kaart ---------- */
/* alleen de adressen van wie je hebt aangeklikt */
function rvStopFilter(stops){if(state.tab!=="control")return stops;const sel=plSel();if(!sel)return stops;const n=stops.length;return stops.filter((s,i)=>plWie(s.k,null,i,n)===sel)}
/* kleur van het adres: van welke bus (alleen als er meer bussen zijn en je iedereen bekijkt) */
function rvStopKleur(k){if(state.tab!=="control"||plSel()||!plMeer())return"";const m=plMensen().find(x=>x.stops.some(s=>s.k.id===k.id));return m?m.kleur:""}
/* de bus op de kaart: van wie je hebt aangeklikt (undefined = gewoon je eigen telefoon) */
function plBusPos(){if(state.tab!=="control"||!plMeer())return undefined;const sel=plSel();if(!sel)return null;
  const m=plMensen().find(x=>x.naam===sel);if(!m||!m.live)return null;if(m.live.demo)return undefined;return plVers(m.live)?{lat:m.live.lat,lng:m.live.lng}:null}
/* iedereen: alle bussen tegelijk, met naam. true = de kaart hoeft zelf geen bus te tekenen */
function rvPloeg(el,pts){if(state.tab!=="control"||!plMeer()||plSel())return false;const L=window.L;
  plMensen().forEach(m=>{const v=m.live;if(!v||!(v.demo||plVers(v)))return;const c=[v.lat,v.lng];pts.push(c);
    L.marker(c,{icon:L.divIcon({className:"pl-bus",html:`<span style="--pk:${m.kleur}"><img src="/img/mansard-bus.png" alt=""><b>${esc(m.naam)}</b></span>`,iconSize:[0,0],iconAnchor:[0,0]}),zIndexOffset:900})
      .on("click",()=>plKies(m.naam)).addTo(el._laag)});
  return true}

/* ---------- indelen: welk adres rijdt wie ---------- */
async function plIndelen(id,nm){const day=iso(today()),r=state.routes[day]||{},wie={...(r.wie||{})};if(nm)wie[id]=nm;else delete wie[id];
  if(plDemo()){toast("In de demo kun je niet indelen; in je eigen Mansard wel");return render()}
  state.routes[day]={...r,wie};render();try{await save("routes",day,{...strip(r),wie});toast(nm?cleanName((state.klanten.find(k=>k.id===id)||{}).naam||"")+" → "+nm:"Indeling weggehaald")}catch(e){err(e)}}
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("select[data-ccwie]");if(s)plIndelen(s.dataset.ccwie,s.value)});
function plWieHtml(k,i,n){if(!plMeer()||plSel())return"";const w=plWie(k,null,i,n),M=plMensen(),m=M.find(x=>x.naam===w);
  if(w)return `<span class="pl-tag" style="--pk:${m?m.kleur:"#64748b"}">${esc(w)}</span>`;
  return `<select class="pl-sel" data-ccwie="${esc(k.id)}" aria-label="Wie rijdt dit adres"><option value="">Wie?</option>${plKandidaten().map(x=>`<option>${esc(x)}</option>`).join("")}</select>`}

/* ---------- live posities van alle medewerkers (alleen eigenaar en beheerder) ---------- */
function plLuister(){if(!LIVE||PL.unsub||!state.loaded||isMw())return;
  try{PL.unsub=fsDb().collection("live").onSnapshot(q=>{const n={};q.docs.forEach(d=>{if(d.id.startsWith("mw_"))n[d.id]=d.data()});PL.live=n;plVernieuw()},()=>{PL.unsub=null})}catch(e){}}
function plVernieuw(){if(state.tab!=="control")return;const r=document.getElementById("ccPloeg"),h=plRijHtml();
  if(!!r!==!!h)return render();if(r)r.outerHTML=h;
  const el=document.getElementById("rvMap");if(!el||!el._map)return;if(plSel())rvMapLive();else ccKaart()}
if(LIVE)setTimeout(function w(){if(!state.loaded)return setTimeout(w,1000);plLuister()},2000);
