/* ---------- Kaart: rechtsklik (of lang vasthouden op telefoon/tablet) op een woning ----------
   Menu zoals in een meldkamerkaart: schuine (obliek) luchtfoto onder 45 graden, Street View en het coördinaat kopiëren.
   De schuine luchtfoto opent in Google Maps (3D-weergave, schuin van boven) op precies dat punt. */
const OBL_CSS=`.obl-m{position:absolute;z-index:1200;min-width:220px;background:#2b2f36;color:#fff;border-radius:10px;box-shadow:0 14px 34px -12px rgb(0 0 0 / .55);padding:6px;font:500 13px/1.3 var(--f-ui,Inter,system-ui,sans-serif)}
.obl-m small{display:block;padding:6px 10px 8px;color:#aab2b8;font-size:11.5px;font-variant-numeric:tabular-nums;border-bottom:1px solid rgb(255 255 255 / .1);margin-bottom:4px}
.obl-m a,.obl-m button{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;padding:10px;border-radius:7px;cursor:pointer;color:#fff}
.obl-m a:hover,.obl-m button:hover,.obl-m a:focus-visible,.obl-m button:focus-visible{background:rgb(255 255 255 / .1)}
.obl-m svg{width:16px;height:16px;flex:none;opacity:.85}`;
const oblUrl=(la,ln)=>`https://www.google.com/maps/@${la},${ln},90a,35y,0h,60t/data=!3m1!1e3`;
const oblSv=(la,ln)=>`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${la},${ln}`;
function oblDicht(){document.querySelectorAll(".obl-m").forEach(x=>x.remove())}
function oblToon(el,m,ll,pt){oblDicht();if(!document.getElementById("obl-css")){const s=document.createElement("style");s.id="obl-css";s.textContent=OBL_CSS;document.head.appendChild(s)}
  const la=ll.lat.toFixed(6),ln=ll.lng.toFixed(6),d=document.createElement("div");d.className="obl-m";d.setAttribute("role","menu");
  const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  d.innerHTML=`<small>GPS ${la}, ${ln}</small>
    ${typeof kavelAan==="function"&&kavelAan()?`<button type="button" role="menuitem" data-kv="1">${ic('<path d="M3 17l6-10 4 6 3-4 5 8z"/><path d="M3 21h18"/>')}Toon obliek luchtfoto (Kavel 10)</button>`:""}
    <a role="menuitem" href="${oblUrl(la,ln)}" target="_blank" rel="noopener">${ic('<path d="M3 17l6-10 4 6 3-4 5 8z"/><path d="M3 21h18"/>')}${typeof kavelAan==="function"&&kavelAan()?"Google 3D":"Toon obliek luchtfoto"}</a>
    <a role="menuitem" href="${oblSv(la,ln)}" target="_blank" rel="noopener">${ic('<circle cx="12" cy="6" r="3"/><path d="M8 21v-6l-2-2 2-4h8l2 4-2 2v6"/>')}Street View</a>
    <button type="button" role="menuitem" data-k="1">${ic('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>')}Kopieer coördinaat</button>`;
  {const kv=d.querySelector("[data-kv]");if(kv)kv.onclick=()=>{oblDicht();kavelOpen({ll:[+la,+ln]})}}
  d.querySelector("[data-k]").onclick=async()=>{try{await navigator.clipboard.writeText(la+","+ln);if(typeof toast==="function")toast("Coördinaat gekopieerd")}catch(e){}oblDicht()};
  d.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setTimeout(oblDicht,50)));
  ["mousedown","touchstart","dblclick","wheel","click","contextmenu"].forEach(t=>d.addEventListener(t,ev=>ev.stopPropagation()));
  if(getComputedStyle(el).position==="static")el.style.position="relative";el.appendChild(d);
  const W=el.clientWidth,H=el.clientHeight,w=d.offsetWidth,h=d.offsetHeight;d.style.left=Math.max(6,Math.min(pt.x,W-w-6))+"px";d.style.top=Math.max(6,Math.min(pt.y,H-h-6))+"px"}
function oblKoppel(el,m){if(!el||!m||el._obliek)return;el._obliek=1;
  const opPunt=(cx,cy)=>{const r=el.getBoundingClientRect(),pt={x:cx-r.left,y:cy-r.top};oblToon(el,m,m.containerPointToLatLng([pt.x,pt.y]),pt)};
  el.addEventListener("contextmenu",ev=>{if(ev.target.closest&&ev.target.closest(".obl-m"))return;ev.preventDefault();opPunt(ev.clientX,ev.clientY)});
  /* lang vasthouden op een aanraakscherm */
  let t=null,sx=0,sy=0;const stop=()=>{clearTimeout(t);t=null};
  el.addEventListener("touchstart",ev=>{if(ev.touches.length!==1)return stop();const p=ev.touches[0];sx=p.clientX;sy=p.clientY;stop();t=setTimeout(()=>{t=null;opPunt(sx,sy)},600)},{passive:true});
  el.addEventListener("touchmove",ev=>{const p=ev.touches[0];if(p&&Math.hypot(p.clientX-sx,p.clientY-sy)>10)stop()},{passive:true});
  el.addEventListener("touchend",stop,{passive:true});el.addEventListener("touchcancel",stop,{passive:true});
  m.on("movestart zoomstart",oblDicht);m.on("click",oblDicht);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")oblDicht()})}
