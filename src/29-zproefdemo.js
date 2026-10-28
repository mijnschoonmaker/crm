/* ---------- Voorbeeldomgeving tijdens de proefperiode ----------
   Wie zich aanmeldt, probeert Mansard 30 dagen in de demo (/demo/?proef=1). Een balk onderin zegt dat er niets bewaard wordt
   en brengt je met "Abonnement kiezen" terug naar je eigen account, waar het abonnementsvenster meteen opent. */
if(typeof window!=="undefined"&&!LIVE){(()=>{let pf=null;
  try{const q=new URLSearchParams(location.search);if(q.get("proef")==="1"){pf={d:Number(q.get("d"))||0,op:Date.now()};localStorage.setItem("ms.proef",JSON.stringify(pf))}else pf=JSON.parse(localStorage.getItem("ms.proef")||"null")}catch(e){}
  /* bezoeker van de website (geen proefaccount): rondkijken mag, aanmelden kan altijd via de balk */
  if(!pf){try{const q=new URLSearchParams(location.search);if(q.has("selftest")||q.has("kaal")||window.ZEEM_DIRECT)return}catch(e){}
    const zet2=()=>{if(document.getElementById("pfBalk")||!document.body)return;const b=document.createElement("div");b.id="pfBalk";b.className="pf-balk";
      b.innerHTML=`<span><b>Voorbeeldomgeving</b> · kijk gerust rond, er wordt niets bewaard</span><a href="/?account=nieuw">Account aanmaken</a>`;document.body.appendChild(b)};
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",zet2);else zet2();return}const dg=Math.max(0,(pf.d||0)-Math.floor((Date.now()-(pf.op||Date.now()))/864e5));
  const zet=()=>{if(document.getElementById("pfBalk")||!document.body)return;const b=document.createElement("div");b.id="pfBalk";b.className="pf-balk";
    b.innerHTML=`<span><b>Voorbeeldomgeving</b> · proefperiode nog ${dg} ${dg===1?"dag":"dagen"} · er wordt niets bewaard</span><a href="/?kies-abonnement=1">Abonnement kiezen</a>`;document.body.appendChild(b)};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",zet);else zet()})()}
