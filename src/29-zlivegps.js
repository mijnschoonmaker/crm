/* ---------- Live locatie delen met de klanten van vandaag ----------
   Aan op de Route-pagina. De telefoon geeft om de paar seconden de plek door; het klantportaal laat de klanten
   van vandaag een autootje op de kaart zien met de verwachte aankomsttijd. Alleen terwijl het CRM open staat. */
const LV={watch:null,last:0,pos:null,lock:null,fout:""};
state.liveDelen=(()=>{try{return localStorage.getItem("ms.live")==="1"}catch(e){return false}})();
const lvAfst=(a,b)=>{if(!a||!b)return 1e9;const R=6371e3,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
/* elk apparaat een eigen id: staat live delen op twee apparaten aan (telefoon + iPad/laptop), dan wint de telefoon met echte GPS */
const LV_DEV=(()=>{try{let d=localStorage.getItem("ms.lvdev");if(!d){d=Math.random().toString(36).slice(2,10);localStorage.setItem("ms.lvdev",d)}return d}catch(e){return Math.random().toString(36).slice(2,10)}})();
LV.rit=null;LV.ritUnsub=null;
function lvVolgRit(){if(LV.ritUnsub||!LIVE)return;try{LV.ritUnsub=fsDb().doc("live/rit").onSnapshot(s=>{LV.rit=s.exists?s.data():null},()=>{LV.ritUnsub=null})}catch(e){}}
/* mag dit apparaat nu de plek van de bus doorgeven? Niet als een ander apparaat de afgelopen minuut een even goede of betere plek gaf */
function lvMagSchrijven(nauw){const r=LV.rit;if(!r||!r.actief||!r.dev||r.dev===LV_DEV||r.datum!==iso(today()))return true;
  const oud=Date.now()-Date.parse(r.ts||0);if(!(oud<60e3))return true;
  const hun=Number(r.nauw)||999;return nauw+10<hun*0.6}
async function lvSchrijf(extra){if(!LIVE)return;const em=String((state.me&&state.me.email)||"").toLowerCase(),d={...extra,naam:doorNaam()||String((state.me&&state.me.name)||"").split(" ")[0]||"",door:em,dev:LV_DEV,datum:iso(today()),ts:new Date().toISOString()};
  try{await fsDb().doc("live/rit").set(d,{merge:true})}catch(e){console.warn("live",e)}
  /* ook per medewerker, zodat het Control Center bij meerdere bussen ieder apart kan volgen */
  if(em)try{await fsDb().doc("live/mw_"+em.replace(/[^a-z0-9]/g,"_").slice(0,80)).set({...d,naam:doorNaam()||d.naam},{merge:true})}catch(e){console.warn("live mw",e)}}
async function lvWakker(){try{if(LV.watch&&"wakeLock" in navigator&&!LV.lock&&document.visibilityState==="visible"){LV.lock=await navigator.wakeLock.request("screen");LV.lock.addEventListener("release",()=>{LV.lock=null})}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&LV.watch)lvWakker()});
function liveStart(stil){
  if(!LIVE||!navigator.geolocation){if(!stil)toast(LIVE?"Deze telefoon kan geen locatie delen":"Live delen werkt in de live versie");return}
  if(LV.watch!=null)return;
  LV.fout="";
  LV.fix=Date.now();
  LV.watch=navigator.geolocation.watchPosition(p=>{LV.fix=Date.now();
    const c={lat:+p.coords.latitude.toFixed(6),lng:+p.coords.longitude.toFixed(6)},nu=Date.now();
    let koers=Number.isFinite(p.coords.heading)?Math.round(p.coords.heading):null;
    if(koers==null&&LV.pos&&lvAfst(LV.pos,c)>15){const y=Math.sin((c.lng-LV.pos.lng)*Math.PI/180)*Math.cos(c.lat*Math.PI/180),x=Math.cos(LV.pos.lat*Math.PI/180)*Math.sin(c.lat*Math.PI/180)-Math.sin(LV.pos.lat*Math.PI/180)*Math.cos(c.lat*Math.PI/180)*Math.cos((c.lng-LV.pos.lng)*Math.PI/180);koers=Math.round((Math.atan2(y,x)*180/Math.PI+360)%360)}
    /* alleen echte GPS-plekken: een laptop of iPad zonder GPS schat de plek via wifi en zit er soms kilometers naast */
    const nauw=Math.round(p.coords.accuracy||0);
    if(nauw>120){LV.fout="Geen nauwkeurige plek (alleen via wifi). Deel live vanaf je telefoon.";lvKnop();return}
    /* elke 5 seconden, of meteen als je 20 meter verder bent */
    if(nu-LV.last<5000&&lvAfst(LV.pos,c)<20)return;
    if(!lvMagSchrijven(nauw)){LV.last=nu;LV.pos=c;if(typeof rvMapLive==="function")rvMapLive();return}
    if(typeof kmTik==="function")kmTik(LV.pos,c,p.coords.accuracy);LV.last=nu;LV.pos=c;if(koers!=null)LV.koers=koers;LV.fout="";if(typeof rvMapLive==="function")rvMapLive();lvSchrijf({actief:true,lat:c.lat,lng:c.lng,nauw,snelheid:Number.isFinite(p.coords.speed)?Math.round(p.coords.speed*3.6):null,...(koers!=null?{koers}:{})});lvKnop()},
    e=>{LV.fout=e.code===1?"Geen toestemming voor je locatie. iPhone/iPad: Instellingen › Privacy en beveiliging › Locatievoorzieningen › Safari-websites › Tijdens gebruik van de app.":"Je locatie is even niet beschikbaar";if(e.code===1){/* iPhone geeft dit soms als de app even op de achtergrond is: dan niet uitzetten, alleen bij een echte weigering */const verborgen=document.visibilityState!=="visible";if(LV.watch!=null){try{navigator.geolocation.clearWatch(LV.watch)}catch(er){}LV.watch=null}
      lvToestemming().then(t=>{if(t==="denied"&&!verborgen){liveStop(true);state.liveDelen=false;try{localStorage.setItem("ms.live","0")}catch(er){}toast(LV.fout)}else if(!verborgen)setTimeout(()=>{if(state.liveDelen&&LV.watch==null)liveStart(true)},3000);lvKnop()});return}/* even geen signaal (binnen, computer): geen melding, de telefoon probeert het vanzelf opnieuw */lvKnop()},
    {enableHighAccuracy:true,maximumAge:3000,timeout:30000});lvVolgRit();
  lvWakker();if(!stil)toast("Live delen staat aan · de klanten van vandaag zien waar je bent");lvKnop()}
function liveStop(stil){if(LV.watch!=null){try{navigator.geolocation.clearWatch(LV.watch)}catch(e){}}LV.watch=null;LV.pos=null;try{LV.lock&&LV.lock.release()}catch(e){}LV.lock=null;
  if(!LV.rit||!LV.rit.dev||LV.rit.dev===LV_DEV)lvSchrijf({actief:false});if(!stil)toast("Live delen staat uit");lvKnop()}
/* wisselen op wat de knop laat zien: staat hij grijs (ook als het aanzetten eerder mislukte), dan gaat hij aan */
function liveWissel(){state.liveDelen=!(state.liveDelen&&LV.watch!=null);try{localStorage.setItem("ms.live",state.liveDelen?"1":"0")}catch(e){}state.liveDelen?liveStart():liveStop();try{const d=iso(today()),r=state.routes[d]||{};state.routes[d]={...r,werk:{...(r.werk||{}),liveUit:!state.liveDelen}};save("routes",d,{...strip(r),werk:{...(r.werk||{}),liveUit:!state.liveDelen}})}catch(e){}render()}
/* knop in de kop van de Route-pagina */
function lvKnopHtml(){if(!LIVE)return"";const aan=state.liveDelen&&LV.watch!=null;
  return `<button type="button" class="rh-live${aan?" aan":""}" data-act="livedelen" aria-pressed="${aan}" title="Klanten van vandaag zien in hun portaal waar je bent"><i></i><span>${aan?"Live zichtbaar":"Live delen"}</span></button>`}
function lvKnop(){const b=document.querySelector(".rh-live");if(b)b.outerHTML=lvKnopHtml();
  /* melding in de werkdagkaart: live delen staat uit terwijl je onderweg bent */
  const w=document.querySelector(".wd-live");if(w){const aan=state.liveDelen&&LV.watch!=null;w.hidden=aan;const f=w.querySelector("[data-lvfout]");if(f)f.textContent=LV.fout||"Klanten zien je nu niet onderweg."}}
/* automatisch: na het herladen weer aan, en uit als de dag klaar is */
/* bij openen alleen hervatten als locatie al is toegestaan (anders zou de browser telkens om toestemming vragen) */
/* iPhone/Safari meldt de toestemming vaak als "vragen" (prompt), ook als je eerder op Sta toe tikte. Vroeger ging live delen dan uit
   bij elke herstart van de pagina (Safari herlaadt een tabblad op de achtergrond regelmatig). Nu: alleen bij een echte weigering niet. */
async function lvToestemming(){try{return navigator.permissions&&navigator.permissions.query?(await navigator.permissions.query({name:"geolocation"})).state:"onbekend"}catch(e){return"onbekend"}}
if(LIVE)setTimeout(async function w(){if(!state.loaded)return setTimeout(w,800);if(!state.liveDelen)return;
  const t=await lvToestemming();
  if(t!=="denied")liveStart(true);else{LV.fout="Geen toestemming voor je locatie. iPhone: Instellingen › Apps › Safari › Locatie › Sta toe.";lvKnop();render()}},1500);
/* terug in beeld (scherm weer aan, andere app dicht): live delen weer oppakken, en een vastgelopen GPS opnieuw starten */
document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="visible"||!LIVE||!state.loaded)return;setTimeout(()=>{if(!state.liveDelen)return;
  if(LV.watch==null)liveStart(true);else if(Date.now()-(LV.fix||0)>30000)lvHerstart()},600)});
function lvHerstart(){if(LV.watch!=null){try{navigator.geolocation.clearWatch(LV.watch)}catch(e){}LV.watch=null}liveStart(true)}
/* bewaker: geeft de telefoon 45 seconden geen plek terwijl het CRM in beeld is, dan de GPS opnieuw starten */
if(LIVE)setInterval(()=>{if(document.visibilityState==="visible"&&state.liveDelen&&LV.watch!=null&&Date.now()-(LV.fix||Date.now())>45000){LV.fix=Date.now();lvHerstart()}},15000);
function lvDagCheck(){if(LV.watch==null)return;const s=routeStops(iso(today()));if(s.length&&s.every(x=>x.done)){state.liveDelen=false;try{localStorage.setItem("ms.live","0")}catch(e){}liveStop(true);toast("Dag klaar · live delen is gestopt")}}
