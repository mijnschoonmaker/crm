/* ---------- Live locatie delen met de klanten van vandaag ----------
   Aan op de Route-pagina. De telefoon geeft om de paar seconden de plek door; het klantportaal laat de klanten
   van vandaag een autootje op de kaart zien met de verwachte aankomsttijd. Alleen terwijl het CRM open staat. */
const LV={watch:null,last:0,pos:null,lock:null,fout:""};
state.liveDelen=(()=>{try{return localStorage.getItem("ms.live")==="1"}catch(e){return false}})();
const lvAfst=(a,b)=>{if(!a||!b)return 1e9;const R=6371e3,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
async function lvSchrijf(extra){if(!LIVE)return;try{await fsDb().doc("live/rit").set({...extra,naam:String((state.me&&state.me.name)||"").split(" ")[0]||"",door:(state.me&&state.me.email)||"",datum:iso(today()),ts:new Date().toISOString()},{merge:true})}catch(e){console.warn("live",e)}}
async function lvWakker(){try{if(LV.watch&&"wakeLock" in navigator&&!LV.lock&&document.visibilityState==="visible"){LV.lock=await navigator.wakeLock.request("screen");LV.lock.addEventListener("release",()=>{LV.lock=null})}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&LV.watch)lvWakker()});
function liveStart(stil){
  if(!LIVE||!navigator.geolocation){if(!stil)toast(LIVE?"Deze telefoon kan geen locatie delen":"Live delen werkt in de live versie");return}
  if(LV.watch!=null)return;
  LV.fout="";
  LV.watch=navigator.geolocation.watchPosition(p=>{
    const c={lat:+p.coords.latitude.toFixed(6),lng:+p.coords.longitude.toFixed(6)},nu=Date.now();
    let koers=Number.isFinite(p.coords.heading)?Math.round(p.coords.heading):null;
    if(koers==null&&LV.pos&&lvAfst(LV.pos,c)>15){const y=Math.sin((c.lng-LV.pos.lng)*Math.PI/180)*Math.cos(c.lat*Math.PI/180),x=Math.cos(LV.pos.lat*Math.PI/180)*Math.sin(c.lat*Math.PI/180)-Math.sin(LV.pos.lat*Math.PI/180)*Math.cos(c.lat*Math.PI/180)*Math.cos((c.lng-LV.pos.lng)*Math.PI/180);koers=Math.round((Math.atan2(y,x)*180/Math.PI+360)%360)}
    /* niet vaker dan nodig: elke 12 seconden, of eerder als je flink bent opgeschoten */
    if(nu-LV.last<12000&&lvAfst(LV.pos,c)<40)return;
    if(typeof kmTik==="function")kmTik(LV.pos,c,p.coords.accuracy);LV.last=nu;LV.pos=c;if(koers!=null)LV.koers=koers;LV.fout="";if(typeof rvMapLive==="function")rvMapLive();lvSchrijf({actief:true,lat:c.lat,lng:c.lng,nauw:Math.round(p.coords.accuracy||0),...(koers!=null?{koers}:{})});lvKnop()},
    e=>{LV.fout=e.code===1?"Geen toestemming voor je locatie. Zet locatie aan voor deze website in je telefooninstellingen.":"Je locatie is even niet beschikbaar";if(e.code===1){liveStop(true);state.liveDelen=false;try{localStorage.setItem("ms.live","0")}catch(er){}toast(LV.fout)}/* even geen signaal (binnen, computer): geen melding, de telefoon probeert het vanzelf opnieuw */lvKnop()},
    {enableHighAccuracy:true,maximumAge:8000,timeout:30000});
  lvWakker();if(!stil)toast("Live delen staat aan · de klanten van vandaag zien waar je bent");lvKnop()}
function liveStop(stil){if(LV.watch!=null){try{navigator.geolocation.clearWatch(LV.watch)}catch(e){}}LV.watch=null;LV.pos=null;try{LV.lock&&LV.lock.release()}catch(e){}LV.lock=null;
  lvSchrijf({actief:false});if(!stil)toast("Live delen staat uit");lvKnop()}
function liveWissel(){state.liveDelen=!state.liveDelen;try{localStorage.setItem("ms.live",state.liveDelen?"1":"0")}catch(e){}state.liveDelen?liveStart():liveStop();try{const d=iso(today()),r=state.routes[d]||{};state.routes[d]={...r,werk:{...(r.werk||{}),liveUit:!state.liveDelen}};save("routes",d,{...strip(r),werk:{...(r.werk||{}),liveUit:!state.liveDelen}})}catch(e){}render()}
/* knop in de kop van de Route-pagina */
function lvKnopHtml(){if(!LIVE)return"";const aan=state.liveDelen&&LV.watch!=null;
  return `<button type="button" class="rh-live${aan?" aan":""}" data-act="livedelen" aria-pressed="${aan}" title="Klanten van vandaag zien in hun portaal waar je bent"><i></i><span>${aan?"Live zichtbaar":"Live delen"}</span></button>`}
function lvKnop(){const b=document.querySelector(".rh-live");if(b)b.outerHTML=lvKnopHtml()}
/* automatisch: na het herladen weer aan, en uit als de dag klaar is */
/* bij openen alleen hervatten als locatie al is toegestaan (anders zou de browser telkens om toestemming vragen) */
if(LIVE)setTimeout(async function w(){if(!state.loaded)return setTimeout(w,800);if(!state.liveDelen)return;
  let ok=false;try{ok=!!navigator.permissions&&(await navigator.permissions.query({name:"geolocation"})).state==="granted"}catch(e){}
  if(ok)liveStart(true);else{state.liveDelen=false;try{localStorage.setItem("ms.live","0")}catch(e){}render()}},1500);
function lvDagCheck(){if(LV.watch==null)return;const s=routeStops(iso(today()));if(s.length&&s.every(x=>x.done)){state.liveDelen=false;try{localStorage.setItem("ms.live","0")}catch(e){}liveStop(true);toast("Dag klaar · live delen is gestopt")}}
