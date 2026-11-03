/* ---------- TREK OM TE VERVERSEN (telefoon en tablet) ----------
   Bovenaan de pagina naar beneden trekken en loslaten: het CRM laadt opnieuw (net als Cmd+R op de laptop).
   Niet in een venster, op een kaart (Leaflet), in een lijst die zelf scrolt of tijdens het vegen van een stopkaart. */
(function(){if(typeof window==="undefined"||!("ontouchstart" in window))return;
  const DREMPEL=80,MAX=120;let y0=null,x0=0,dy=0,el=null,klaar=false;
  const bovenaan=t=>{if((window.scrollY||document.documentElement.scrollTop||0)>2)return false;
    for(let n=t;n&&n!==document.body;n=n.parentElement){if(n.matches&&n.matches("dialog[open],dialog[open] *,.leaflet-container,.leaflet-container *,.swipe,.swipe *,input,textarea,select,[contenteditable]"))return false;
      const cs=getComputedStyle(n);if(/(auto|scroll)/.test(cs.overflowY)&&n.scrollHeight>n.clientHeight+2&&n.scrollTop>0)return false}
    return !document.querySelector("dialog[open]")};
  const maak=()=>{if(el)return el;el=document.createElement("div");el.id="ptrIc";el.setAttribute("aria-hidden","true");
    el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';document.body.appendChild(el);return el};
  const zet=(d,anim)=>{const e=maak(),p=Math.min(1,d/DREMPEL);e.style.transition=anim?"transform .25s ease,opacity .25s ease":"none";
    e.style.opacity=String(Math.min(1,d/30));e.style.transform=`translate(-50%,${Math.min(d,MAX)-56}px) rotate(${p*270}deg)`;e.classList.toggle("klaar",d>=DREMPEL)};
  document.addEventListener("touchstart",e=>{if(e.touches.length!==1||!bovenaan(e.target)){y0=null;return}y0=e.touches[0].clientY;x0=e.touches[0].clientX;dy=0;klaar=false},{passive:true});
  document.addEventListener("touchmove",e=>{if(y0==null)return;const t=e.touches[0],d=t.clientY-y0,dx=Math.abs(t.clientX-x0);
    if(d<=0||dx>d){if(dy>0)zet(0,true);y0=d<0||dx>d?null:y0;dy=0;return}
    if((window.scrollY||0)>2){y0=null;return}dy=d*.55;zet(dy,false);if(dy>8&&e.cancelable)e.preventDefault()},{passive:false});
  document.addEventListener("touchend",()=>{if(y0==null)return;y0=null;
    if(dy>=DREMPEL&&!klaar){klaar=true;const e=maak();e.classList.add("draait");e.style.transition="transform .2s ease";e.style.transform="translate(-50%,24px)";
      setTimeout(()=>{try{if(typeof opslaanKlaar==="function")opslaanKlaar().finally(()=>location.reload());else location.reload()}catch(x){location.reload()}},250)}
    else zet(0,true);dy=0},{passive:true});
})();
