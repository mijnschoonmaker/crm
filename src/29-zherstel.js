/* ---------- na vernieuwen op dezelfde plek terugkomen: pagina, subtab, open venster en scrollpositie ---------- */
(function(){
  const SK="ms.herstel",SUB=["btab","bhtab","itab","ctab","fFilter","oFilter","iper","bper"];
  /* vensters die je na vernieuwen opnieuw wilt zien; alleen eenvoudige argumenten (id's, datums) */
  let laatst=null,herstellen=null;
  const eenvoudig=a=>a.every(x=>x==null||["string","number","boolean"].includes(typeof x)||(typeof x==="object"&&!Array.isArray(x)&&Object.values(x).every(v=>v==null||["string","number","boolean"].includes(typeof v))));
  const REG={},wrap=(n,f)=>{REG[n]=f;return function(...a){laatst=eenvoudig(a)?{f:n,a:JSON.parse(JSON.stringify(a))}:null;return f.apply(this,a)}};
  /* alle code staat in één blok, dus de functies worden hier bij naam vervangen */
  openKlantView=wrap("openKlantView",openKlantView);kkBerichten=wrap("kkBerichten",kkBerichten);kkOpenOverzicht=wrap("kkOpenOverzicht",kkOpenOverzicht);
  openJob=wrap("openJob",openJob);openFactuur=wrap("openFactuur",openFactuur);openOpdracht=wrap("openOpdracht",openOpdracht);openOpdrachtWerk=wrap("openOpdrachtWerk",openOpdrachtWerk);
  openAfspraak=wrap("openAfspraak",openAfspraak);openBeurtInfo=wrap("openBeurtInfo",openBeurtInfo);openReeksInfo=wrap("openReeksInfo",openReeksInfo);openPeriodiek=wrap("openPeriodiek",openPeriodiek);
  openRamenKlant=wrap("openRamenKlant",openRamenKlant);openAkkoord=wrap("openAkkoord",openAkkoord);openAangifte=wrap("openAangifte",openAangifte);openTplView=wrap("openTplView",openTplView);
  try{dlg.addEventListener("close",()=>{laatst=null})}catch(e){}

  function bewaar(){try{
    try{localStorage.setItem("zeem.tab",state.tab)}catch(_){}
    const sub={};SUB.forEach(k=>{if(state[k]!=null&&typeof state[k]!=="object")sub[k]=state[k]});
    sessionStorage.setItem(SK,JSON.stringify({tab:state.tab,sub,y:window.scrollY||0,venster:dlg.open?laatst:null,vy:dlg.open?dlg.scrollTop:0,op:Date.now()}))}catch(e){}}
  window.addEventListener("pagehide",bewaar);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")bewaar()});

  /* bij het laden: subtabs meteen terugzetten, venster en scroll zodra de gegevens er zijn */
  try{const h=JSON.parse(sessionStorage.getItem(SK)||"null");sessionStorage.removeItem(SK);
    if(h&&Date.now()-h.op<30*60000&&h.tab===state.tab){SUB.forEach(k=>{if(k in (h.sub||{}))state[k]=h.sub[k]});herstellen=h}}catch(e){}
  if(!herstellen)return;
  const t0=Date.now();
  (function wacht(){
    if(!state.loaded){if(Date.now()-t0<20000)setTimeout(wacht,150);return}
    setTimeout(()=>{const h=herstellen;herstellen=null;
      try{render()}catch(e){}
      if(h.y)window.scrollTo(0,h.y);
      const v=h.venster;if(v&&typeof REG[v.f]==="function"){try{({openKlantView,kkBerichten,kkOpenOverzicht,openJob,openFactuur,openOpdracht,openOpdrachtWerk,openAfspraak,openBeurtInfo,openReeksInfo,openPeriodiek,openRamenKlant,openAkkoord,openAangifte,openTplView})[v.f](...v.a);if(h.vy)requestAnimationFrame(()=>{try{dlg.scrollTop=h.vy}catch(_){}})}catch(e){console.error("herstel venster",e)}}
    },60)})();
})();
