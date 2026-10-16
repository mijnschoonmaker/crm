/* ---------- Alle stops: volgorde aanpassen met slepen (muis direct, op de telefoon even vasthouden) ---------- */
let rd=null;
document.addEventListener("pointerdown",e=>{if(e.button>0)return;const c=e.target.closest&&e.target.closest(".rlijst .rstop[data-rdrag]");if(!c||e.target.closest("a,input,select,button:not(.nm)"))return;
  rd={c,id:c.dataset.rid,x:e.clientX,y:e.clientY,on:false,touch:e.pointerType!=="mouse",pid:e.pointerId};
  if(rd.touch)rd.timer=setTimeout(()=>{if(rd&&!rd.on)rdStart()},260)});
function rdStart(){if(!rd||rd.on)return;rd.on=true;const list=rd.c.parentElement;rd.items=[...list.querySelectorAll(".rstop")];rd.from=rd.items.indexOf(rd.c);rd.to=rd.from;
  rd.base=rd.items.map(it=>{const r=it.getBoundingClientRect();return{top:r.top,mid:r.top+r.height/2,h:r.height}});rd.h=rd.base[rd.from].h+8;
  rd.c.classList.add("rd-lift");document.body.classList.add("dg-busy","rd-busy");if(navigator.vibrate&&rd.touch)try{navigator.vibrate(15)}catch(_){}}
document.addEventListener("pointermove",e=>{if(!rd)return;const dx=e.clientX-rd.x,dy=e.clientY-rd.y;
  if(!rd.on){if(rd.touch){if(Math.hypot(dx,dy)>10){clearTimeout(rd.timer);rd=null}return}if(Math.hypot(dx,dy)<6)return;rdStart()}
  e.preventDefault();rd.c.style.transform=`translateY(${dy}px) scale(1.015)`;
  const cy=rd.base[rd.from].mid+dy;let to=0;rd.items.forEach((it,i)=>{if(i!==rd.from&&rd.base[i].mid<cy)to++});rd.to=to;
  rd.items.forEach((it,i)=>{if(i===rd.from)return;let s=0;if(rd.from<rd.to&&i>rd.from&&i<=rd.to)s=-rd.h;else if(rd.to<rd.from&&i>=rd.to&&i<rd.from)s=rd.h;it.style.transform=s?`translateY(${s}px)`:""});
  /* meescrollen bij de rand */
  const Z=90,sc=document.scrollingElement;if(e.clientY<Z)sc.scrollTop-=8;else if(e.clientY>innerHeight-Z)sc.scrollTop+=8;
},{passive:false});
document.addEventListener("touchmove",e=>{if(rd&&rd.on)e.preventDefault()},{passive:false});
async function rdEnd(cancel){if(!rd)return;clearTimeout(rd.timer);const d=rd;rd=null;if(!d.on)return;
  document.body.classList.remove("dg-busy","rd-busy");
  const stop=ev=>{ev.stopPropagation();ev.preventDefault()};document.addEventListener("click",stop,{capture:true,once:true});setTimeout(()=>document.removeEventListener("click",stop,{capture:true}),50);
  if(cancel||d.to===d.from){d.items.forEach(it=>{it.style.transform=""});d.c.classList.remove("rd-lift");return}
  /* kaart laat landen op zijn nieuwe plek, dan de volgorde bewaren */
  const land=d.base[d.to].top-(d.to>d.from?0:0)+(d.to>d.from?d.base[d.to].h-d.base[d.from].h:0)-d.base[d.from].top;
  d.c.style.transition="transform .16s ease";d.c.style.transform=`translateY(${land}px)`;
  const ids=d.items.map(it=>it.dataset.rid);ids.splice(d.to,0,ids.splice(d.from,1)[0]);
  const day=state.routeDay||iso(today());
  try{await save("routes",day,{...strip(state.routes[day]||{}),order:ids});toast("Volgorde aangepast")}catch(e){err(e)}
  setTimeout(()=>{d.items.forEach(it=>{it.style.transition="";it.style.transform=""});d.c.classList.remove("rd-lift");render()},170)}
document.addEventListener("pointerup",()=>rdEnd(false));document.addEventListener("pointercancel",()=>rdEnd(true));
