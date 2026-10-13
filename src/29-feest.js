/* ---------- Motivatie onderweg: huisjes die vollopen en een feestje bij elke afmelding ---------- */
const HUIS='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 11.2 12 4l8.5 7.2V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/></svg>';
function motTekst(done,total){const todo=total-done;
  if(!total)return"";if(!done)return"Klaar voor de start? Het eerste adres wacht.";
  if(!todo)return total>1?`Dag klaar! ${total} woningen gedaan, top gewerkt 🎉`:"Klaar! Top gewerkt 🎉";
  if(todo===1)return"Nog één adres, bijna klaar!";
  if(done/total>=.5)return`Over de helft, goed bezig! 💪 Nog ${todo} te gaan`;
  return`Lekker op gang · ${done} ${done===1?"woning":"woningen"} gedaan`}
function huisjes(done,total,nieuw){if(!total)return"";const max=16,n=Math.min(total,max),d=Math.round(done/total*n);
  return `<div class="huisjes" role="img" aria-label="${done} van ${total} woningen gedaan">${Array.from({length:n},(_,i)=>`<i class="${i<d?"af":""}${nieuw&&i===d-1?" pop":""}">${HUIS}</i>`).join("")}${total>max?`<small>+${total-max}</small>`:""}</div>`}
function motBlok(done,total){if(!total)return"";return `<div class="motb">${huisjes(done,total)}<p>${esc(motTekst(done,total))}</p></div>`}
const FEEST_WOORD=["Yes!","Top!","Lekker!","Mooi werk!","Strak!","Netjes!"];
function feest(k){try{
  const day=iso(today()),s=routeStops(day);let total=s.length,done=s.filter(x=>x.done).length;
  const st=s.find(x=>x.k.id===k.id);if(!st){total++;done++}else if(!st.done)done++;done=Math.min(done,total);
  const klaar=done>=total,a=jobAddrObj(k),todo=total-done;
  const old=document.getElementById("feest");if(old)old.remove();
  const el=document.createElement("div");el.id="feest";el.className="feest"+(klaar?" groot":"");el.setAttribute("aria-live","polite");
  const kl=["#2bb673","#f2b632","#3d8bfd","#ff6b6b","#1f8fa8","#a46bff"];
  const conf=matchMedia("(prefers-reduced-motion: reduce)").matches?"":Array.from({length:klaar?60:30},(_,i)=>{const h=(Math.random()*2-1),v=.6+Math.random()*.8;
    return `<i style="--x:${(h*(klaar?420:260)).toFixed(0)}px;--y:${(-v*(klaar?360:240)).toFixed(0)}px;--r:${(Math.random()*720-360).toFixed(0)}deg;--c:${kl[i%kl.length]};--d:${(Math.random()*.15).toFixed(2)}s;${i%3?"":"border-radius:50%;"}"></i>`}).join("");
  el.innerHTML=`<div class="feest-conf">${conf}</div><div class="feest-k">
    <div class="feest-v"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><path d="M15 27l7 7 15-16"/></svg></div>
    <b>${klaar?"Dag klaar! 🎉":FEEST_WOORD[Math.floor(Math.random()*FEEST_WOORD.length)]+" "+esc(a.adres||cleanName(k.naam))+" gedaan"}</b>
    <span>${klaar?(total>1?`Alle ${total} woningen gedaan. Top gewerkt!`:"Alles gedaan voor vandaag. Top gewerkt!"):`${done} van ${total} klaar · nog ${todo} te gaan`}</span>
    ${huisjes(done,total,true)}</div>`;
  document.body.appendChild(el);try{navigator.vibrate&&navigator.vibrate(klaar?[40,60,40,60,80]:[30,40,30])}catch(e){}
  const weg=()=>{el.classList.add("weg");setTimeout(()=>el.remove(),350)};el.addEventListener("click",weg);setTimeout(weg,klaar?3200:1900)}catch(e){console.error(e)}}

/* ---------- Betaald via Mollie: geld-melding met confetti en kassageluid ---------- */
let betaalVorig=null;
function kassa(){try{const A=new (window.AudioContext||window.webkitAudioContext)(),t=A.currentTime,o=A.createGain();o.gain.value=.22;o.connect(A.destination);
  /* "ka": korte tik, "ching": heldere belletjes met nagalm */
  const n=A.createBufferSource(),b=A.createBuffer(1,A.sampleRate*.05,A.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);n.buffer=b;const ng=A.createGain();ng.gain.value=.5;n.connect(ng).connect(o);n.start(t);
  [[2093,.07],[2637,.1],[3136,.13],[4186,.16],[2637,.3],[3520,.34]].forEach(([f,dl])=>{const os=A.createOscillator(),g=A.createGain();os.type="triangle";os.frequency.value=f;g.gain.setValueAtTime(0,t+dl);g.gain.linearRampToValueAtTime(.5,t+dl+.005);g.gain.exponentialRampToValueAtTime(.001,t+dl+.7);os.connect(g).connect(o);os.start(t+dl);os.stop(t+dl+.75)});
  setTimeout(()=>A.close(),1500)}catch(e){}}
function geldFeest(f){try{
  const old=document.getElementById("feest");if(old)old.remove();
  const bedrag=totals(f).inc,el=document.createElement("div");el.id="feest";el.className="feest geld";
  const conf=matchMedia("(prefers-reduced-motion: reduce)").matches?"":Array.from({length:46},(_,i)=>{const h=Math.random()*2-1,v=.6+Math.random()*.9,munt=i%3===0;
    return `<i class="${munt?"munt":""}" style="--x:${(h*380).toFixed(0)}px;--y:${(-v*320).toFixed(0)}px;--r:${(Math.random()*720-360).toFixed(0)}deg;--c:${["#f2b632","#2bb673","#ffd76a","#1f9a63","#3d8bfd"][i%5]};--d:${(Math.random()*.2).toFixed(2)}s">${munt?"€":""}</i>`}).join("");
  el.innerHTML=`<div class="feest-conf">${conf}</div><div class="feest-k">
    <div class="geld-ic">€</div>
    <span class="geld-l">Betaald via iDEAL</span>
    <b class="geld-b" id="geldB">${eur(0)}</b>
    <span>${esc(cleanName(f.klantNaam||""))} · factuur ${esc(f.nummer||"")}</span>
    <button type="button" class="small" data-geldf="${esc(f.id)}">Bekijk factuur</button></div>`;
  document.body.appendChild(el);kassa();try{navigator.vibrate&&navigator.vibrate([20,30,20,30,60])}catch(e){}
  const B=$("#geldB"),t0=performance.now(),dur=900;const stap=n=>{const p=Math.min(1,(n-t0)/dur),e=1-Math.pow(1-p,3);B.textContent=eur(bedrag*e);if(p<1)requestAnimationFrame(stap)};requestAnimationFrame(stap);
  const knop=el.querySelector("[data-geldf]");knop.onclick=e=>{e.stopPropagation();el.remove();openFactuur(f.id)};
  const weg=()=>{el.classList.add("weg");setTimeout(()=>el.remove(),350)};el.addEventListener("click",weg);setTimeout(()=>{if(el.isConnected&&!el.matches(":hover"))weg()},5000)}catch(e){console.error(e)}}
function betaalCheck(){if(!state.loaded||isMw())return;const nu={};state.facturen.forEach(f=>{if(f.soort!=="offerte")nu[f.id]=f.status});
  if(betaalVorig){
    state.facturen.filter(f=>f.status==="betaald"&&betaalVorig[f.id]&&betaalVorig[f.id]!=="betaald"&&f.betaalwijze==="mollie"&&String(f.betaaldOp||"").slice(0,10)>=iso(addDays(today(),-1))).slice(0,1).forEach(geldFeest)}
  betaalVorig=nu}
