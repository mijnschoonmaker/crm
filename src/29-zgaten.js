/* ---------- tickets: echte ronde inkepingen bij de perforatie ----------
   In plaats van gekleurde rondjes (die nooit precies de achtergrondkleur hebben door schaduwen) knippen we
   met een masker echte gaten in het ticket, zodat je er de achtergrond doorheen ziet. */
function ticketGaten(root){(root||document).querySelectorAll(".swipe-card.tk,.ft").forEach(c=>{
  const ps=[...c.querySelectorAll(":scope>.tk-perf,:scope>.ft-perf,:scope .tk-perf,:scope .ft-perf")].filter(p=>p.offsetParent!==null);
  const w=c.offsetWidth,h=c.offsetHeight;if(!w||!h){return}
  const key=w+"x"+h+":"+ps.map(p=>p.offsetTop).join(",");if(c._gk===key)return;c._gk=key;
  if(!ps.length){c.style.webkitMaskImage=c.style.maskImage="";c.classList.remove("tk-gat");return}
  const cr=c.getBoundingClientRect(),r=12;
  const cir=(x,y)=>`M${x-r},${y}a${r},${r} 0 1,0 ${2*r},0a${r},${r} 0 1,0 ${-2*r},0Z`;
  const gaten=ps.map(p=>{const y=p.getBoundingClientRect().top-cr.top+1;return cir(0,y)+cir(w,y)}).join("");
  /* alfamasker: het hele ticket dekkend, de cirkels uitgespaard (evenodd) */
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path fill="#000" fill-rule="evenodd" d="M0,0H${w}V${h}H0Z${gaten}"/></svg>`;
  const u=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  c.style.webkitMaskImage=c.style.maskImage=u;c.style.webkitMaskSize=c.style.maskSize="100% 100%";c.style.webkitMaskRepeat=c.style.maskRepeat="no-repeat";c.classList.add("tk-gat")})}
(function(){let t=0;const go=()=>{clearTimeout(t);t=setTimeout(()=>ticketGaten(),60)};
  new MutationObserver(go).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  addEventListener("resize",go);document.addEventListener("click",()=>setTimeout(go,260),true)})();
