/* ---------- Pushmeldingen op dit apparaat (tickets) ----------
   Aanzetten per apparaat: telefoon (iPhone: alleen als Mansard op het beginscherm staat) of computer.
   De server stuurt bij een nieuw ticket, verzoek of klantbericht een melding, ook als Mansard dicht is.
   Tik op de melding: Mansard opent dat ticket. */
const PUSH={reg:null,sub:null,klaar:false};
const pushKan=()=>typeof navigator!=="undefined"&&"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
const pushIos=()=>/iPhone|iPad|iPod/.test(navigator.userAgent||"")||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const pushStandalone=()=>{try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(e){return false}};
const pushApparaat=()=>{const u=navigator.userAgent||"";return (pushIos()?"iPhone/iPad":/Android/.test(u)?"Android":/Mac/.test(u)?"Mac":/Windows/.test(u)?"Windows":"Apparaat")+(pushStandalone()?" (app)":" (browser)")};
function pushB64(s){const p="=".repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...b].map(c=>c.charCodeAt(0)))}
async function pushInit(){if(!LIVE||!pushKan()||PUSH.klaar)return;PUSH.klaar=true;
  try{PUSH.reg=await navigator.serviceWorker.register("/sw.js");PUSH.sub=await PUSH.reg.pushManager.getSubscription();
    /* aanmelding opnieuw doorgeven (bijv. na een wissel van gebruiker of als de server hem heeft opgeruimd) */
    if(PUSH.sub&&Notification.permission==="granted")fbFn("pushAbo")({sub:PUSH.sub.toJSON(),apparaat:pushApparaat()}).catch(()=>{})}catch(e){console.error("push",e)}
  try{navigator.serviceWorker.addEventListener("message",e=>{if(e.data&&e.data.type==="mansard-open")pushOpenUrl(e.data.url)})}catch(e){}}
function pushOpenUrl(url){try{const q=new URL(url,location.origin).searchParams,id=q.get("ticket");if(id){if(dlg.open)dlg.close();openTickets(id)}else if(q.get("tickets"))openTickets()}catch(e){}}
async function pushAan(){
  if(!pushKan()){if(pushIos()&&!pushStandalone())return melding("Eerst op je beginscherm","Op de iPhone werken meldingen alleen als Mansard op je beginscherm staat. Open app.mansard.nl in Safari, tik op de deelknop (vierkant met pijl) en kies <b>Zet op beginscherm</b>. Open Mansard daarna via het icoon en zet hier de meldingen aan.");return melding("Niet mogelijk","Deze browser ondersteunt geen pushmeldingen.")}
  const p=await Notification.requestPermission();if(p!=="granted")return melding("Geen toestemming","Je hebt meldingen geweigerd. Zet ze aan in de instellingen van je telefoon of browser (Meldingen › Mansard) en probeer het opnieuw.");
  try{if(!PUSH.reg)PUSH.reg=await navigator.serviceWorker.register("/sw.js");await navigator.serviceWorker.ready;
    const k=(await fbFn("pushSleutel")({})).data.key;
    PUSH.sub=await PUSH.reg.pushManager.getSubscription()||await PUSH.reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushB64(k)});
    await fbFn("pushAbo")({sub:PUSH.sub.toJSON(),apparaat:pushApparaat()});
    const r=await fbFn("pushTest")({});toast(r.data&&r.data.verstuurd?"Meldingen staan aan · er komt nu een testmelding":"Meldingen staan aan");pushBalk()}
  catch(e){console.error(e);err(e)}}
async function pushUit(){try{if(PUSH.sub){const s=PUSH.sub.toJSON();await PUSH.sub.unsubscribe().catch(()=>{});await fbFn("pushAbo")({sub:s,uit:true}).catch(()=>{})}PUSH.sub=null;toast("Meldingen op dit apparaat staan uit");pushBalk()}catch(e){err(e)}}
/* balkje in het ticketvenster */
function pushBalkHtml(){if(!LIVE)return"";const aan=!!PUSH.sub&&("Notification" in window)&&Notification.permission==="granted";
  return aan?`<div class="tk-push aan">${I.bell}<span><b>Meldingen op dit apparaat staan aan</b><small>Je krijgt een melding bij een nieuw ticket of bericht, ook als Mansard dicht is.</small></span><button type="button" class="small ghost" data-push="test">Test</button><button type="button" class="small ghost" data-push="uit">Uitzetten</button></div>`
    :`<div class="tk-push">${I.bell}<span><b>Meldingen op je telefoon</b><small>Hoor het meteen als een klant een ticket stuurt, ook met je telefoon in je zak.</small></span><button type="button" class="small primary" data-push="aan">Aanzetten</button></div>`}
function pushBalk(){const el=document.getElementById("tkPush");if(el)el.innerHTML=pushBalkHtml()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-push]");if(!b)return;const a=b.dataset.push;
  if(a==="aan")pushAan();else if(a==="uit")pushUit();else if(a==="test")fbFn("pushTest")({}).then(r=>toast(r.data&&r.data.verstuurd?"Testmelding verstuurd":"Geen aangemeld apparaat gevonden")).catch(err)});
if(typeof window!=="undefined")setTimeout(function w(){if(typeof state!=="undefined"&&state.loaded){pushInit();
  /* geopend via een melding: /?ticket=<id> */
  try{const q=new URLSearchParams(location.search);if(q.get("ticket")||q.get("tickets")){pushOpenUrl(location.href);history.replaceState(null,"",location.pathname)}}catch(e){}}else setTimeout(w,800)},1200);
