/* ---------- nieuwe versie online? ----------
   Het CRM staat vaak de hele dag open. Elke paar minuten kijken we of er een nieuwere versie staat;
   zo ja: een balk met Vernieuwen, en als het tabblad niet in beeld is en er geen venster open staat, vanzelf vernieuwen. */
(function(){if(typeof window==="undefined"||!LIVE)return;const meta=document.querySelector('meta[name="ms-versie"]'),nu=meta&&meta.content;if(!nu)return;
  let nieuw=false;
  const balk=()=>{if(document.getElementById("msVersie"))return;const b=document.createElement("div");b.id="msVersie";b.className="ms-versie";b.setAttribute("role","status");
    b.innerHTML=`<span><b>Er staat een nieuwe versie klaar</b> · vernieuw om de laatste verbeteringen te zien</span><button type="button" class="primary small">Vernieuwen</button><button type="button" class="iconbtn sm" aria-label="Later">${I.x}</button>`;
    b.querySelector(".primary").onclick=()=>location.reload();b.querySelector(".iconbtn").onclick=()=>b.remove();document.body.appendChild(b)};
  const rustig=()=>!(typeof OPS!=="undefined"&&OPS.bezig)&&!(typeof LV!=="undefined"&&LV.watch!=null)&&!(typeof dlg!=="undefined"&&dlg&&dlg.open)&&!document.querySelector(".fv,.vraag-dlg[open],dialog[open]");
  const kijk=async()=>{if(nieuw){if(document.hidden&&rustig())location.reload();return}
    try{const r=await fetch(location.pathname+"?v="+Date.now(),{cache:"no-store",credentials:"same-origin"});if(!r.ok)return;const t=await r.text(),m=t.match(/name="ms-versie" content="([0-9a-f]+)"/);
      if(m&&m[1]!==nu){nieuw=true;balk();if(document.hidden&&rustig())location.reload()}}catch(e){}};
  setInterval(kijk,5*60*1000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)kijk();else if(nieuw&&rustig())location.reload()});setTimeout(kijk,60*1000)})();
