/* ---------- Motivatie onderweg: huisjes die vollopen en een feestje bij elke afmelding ---------- */
const HUIS='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 10.4 12 4.2l7.5 6.2v8.4a1.4 1.4 0 0 1-1.4 1.4h-3.4v-5a1 1 0 0 0-1-1h-3.4a1 1 0 0 0-1 1v5H5.9a1.4 1.4 0 0 1-1.4-1.4z" stroke-linejoin="round"/></svg>';
function motTekst(done,total){const todo=total-done;
  if(!total)return"";if(!done)return"Klaar voor de start? Het eerste adres wacht.";
  if(!todo)return total>1?`Dag klaar! ${total} woningen gedaan, top gewerkt`:"Klaar! Top gewerkt";
  if(todo===1)return"Nog één adres, bijna klaar!";
  if(done/total>=.5)return`Over de helft, goed bezig! Nog ${todo} te gaan`;
  return`Lekker op gang · ${done} ${done===1?"woning":"woningen"} gedaan`}
function huisjes(done,total,nieuw){if(!total)return"";const max=16,n=Math.min(total,max),d=Math.round(done/total*n);
  return `<div class="huisjes" role="img" aria-label="${done} van ${total} woningen gedaan">${Array.from({length:n},(_,i)=>`<i class="${i<d?"af":""}${nieuw&&i===d-1?" pop":""}">${HUIS}</i>`).join("")}${total>max?`<small>+${total-max}</small>`:""}</div>`}
function motBlok(done,total){if(!total)return"";return `<div class="motb">${huisjes(done,total)}<p>${esc(motTekst(done,total))}</p></div>`}
const FEEST_WOORD=["Yes!","Top!","Lekker!","Mooi werk!","Strak!","Netjes!"];
/* echte confetti: papiertjes met zwaartekracht, luchtweerstand, dwarrelen en kantelen (canvas, achter de kaart) */
function confetti(host,{n=170,kleuren,bron}={}){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const kl=kleuren||["#1f8fa8","#2bb673","#7fd8c0","#0f5c6e","#9fd4ff","#3fd08b","#ffffff","#ff8a7a"];
  const c=document.createElement("canvas");c.className="fc-canvas";host.prepend(c);if(host===document.body){c.style.position="fixed";c.style.zIndex="9998"}
  const dpr=Math.min(2,window.devicePixelRatio||1),W=innerWidth,H=innerHeight;c.width=W*dpr;c.height=H*dpr;const x=c.getContext("2d");x.scale(dpr,dpr);
  const tint=(h,f)=>{const v=parseInt(h.slice(1),16);let r=v>>16,g=v>>8&255,b=v&255;r=Math.round(r*f);g=Math.round(g*f);b=Math.round(b*f);return`rgb(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)})`};
  const P=[],R=Math.random,add=(ox,oy,ang,spr,vel,cnt)=>{for(let i=0;i<cnt;i++){const a=ang+(R()-.5)*spr,v=vel*(.5+R()*.7),col=kl[(R()*kl.length)|0];
    P.push({x:ox,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,w:7+R()*6,h:10+R()*10,rot:R()*6.28,vr:(R()-.5)*.25,fl:R()*6.28,vf:.06+R()*.14,wb:R()*6.28,vw:.04+R()*.07,rond:R()<.14,c1:tint(col,1),c2:tint(col,.72),d:.955+R()*.02})}};
  if(bron){add(bron.x,bron.y,-Math.PI/2,Math.PI*1.2,13,n)}else{
  const v0=Math.max(32,Math.min(60,H*.06));
  add(-10,H*.95,-Math.PI*.36,.4,v0,n*.28);add(W+10,H*.95,-Math.PI*.64,.4,v0,n*.28);add(W/2,H*.46,-Math.PI/2,Math.PI*2,14,n*.12);
  /* en een zachte regen van boven, zodat het ook na de knal nog even dwarrelt */
  for(let i=0;i<n*.32;i++){const col=kl[(R()*kl.length)|0];P.push({x:R()*W,y:-20-R()*H*.6,vx:(R()-.5)*1.5,vy:1+R()*2,w:7+R()*6,h:10+R()*10,rot:R()*6.28,vr:(R()-.5)*.2,fl:R()*6.28,vf:.05+R()*.12,wb:R()*6.28,vw:.03+R()*.06,rond:R()<.14,c1:tint(col,1),c2:tint(col,.72),d:.97})}}
  let t0=performance.now(),last=t0;
  const stap=nu=>{const dt=Math.min(2.5,(nu-last)/16.7);last=nu;const el=nu-t0;x.clearRect(0,0,W,H);let leeft=0;
    for(const p of P){p.vx*=Math.pow(p.d,dt);p.vy=p.vy*Math.pow(p.d,dt)+.42*dt;const term=1.7+Math.abs(Math.cos(p.fl))*1.5;if(p.vy>term)p.vy=term+(p.vy-term)*.85;
      p.wb+=p.vw*dt;p.x+=(p.vx+Math.sin(p.wb)*1.3)*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.fl+=p.vf*dt;
      if(p.y>H+30)continue;leeft++;const sy=Math.cos(p.fl);
      x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.globalAlpha=el>6400?Math.max(0,1-(el-6400)/900):1;x.fillStyle=sy>0?p.c1:p.c2;
      if(p.rond){x.beginPath();x.ellipse(0,0,p.w*.45,p.w*.45*Math.abs(sy)+.4,0,0,6.283);x.fill()}else x.fillRect(-p.w/2,-p.h/2*Math.abs(sy),p.w,p.h*Math.abs(sy)+.5);
      x.restore()}
    if(leeft&&el<7400&&c.isConnected)requestAnimationFrame(stap);else c.remove()};
  requestAnimationFrame(stap)}
/* kaart weg, confetti mag uitdwarrelen */
function laatDwarrelen(el){const cv=el.querySelector(".fc-canvas");if(cv){cv.style.position="fixed";cv.style.zIndex="9998";document.body.appendChild(cv)}}
const VINK='<path d="M5.5 12.8l4.2 4.2L18.5 7.6"/>';
function feest(k){try{
  const day=iso(today()),s=routeStops(day);let total=s.length,done=s.filter(x=>x.done).length;
  const st=s.find(x=>x.k.id===k.id);if(!st){total++;done++}else if(!st.done)done++;done=Math.min(done,total);
  const klaar=done>=total,a=jobAddrObj(k),todo=total-done;
  const old=document.getElementById("feest");if(old)old.remove();
  const el=document.createElement("div");el.id="feest";el.className="feest"+(klaar?" groot":"");el.setAttribute("aria-live","polite");
  const tijd=new Date().toTimeString().slice(0,5),woord=klaar?"Dag klaar!":FEEST_WOORD[Math.floor(Math.random()*FEEST_WOORD.length)];
  el.innerHTML=`<div class="ft${klaar?" klaar":""}">
    <div class="ft-kop"><div><small>Stop</small><b>${done}<em>/${total}</em></b></div><div class="ft-vl"><i></i>${typeof RV_BUS!=="undefined"?`<span>${RV_BUS}</span>`:""}<i></i></div><div style="text-align:right"><small>Afgemeld</small><b>${tijd}</b></div></div>
    <div class="ft-body"><b class="ft-w">${esc(woord)}</b><span class="ft-a">${klaar?(total>1?`Alle ${total} woningen gedaan. Rust lekker uit.`:"Top gewerkt vandaag."):esc(a.adres||cleanName(k.naam))+" is klaar"}</span>
      ${huisjes(done,total,true)}${klaar?"":`<span class="ft-nog">Nog ${todo} ${todo===1?"adres":"adressen"} te gaan</span>`}</div>
    <div class="ft-stub"><div class="ft-perf"></div><div class="ft-st"><span class="ft-stempel">${'<svg viewBox="0 0 24 24"><path d="M5.5 12.8l4.2 4.2L18.5 7.6"/></svg>'}<i>Gewassen</i></span><code>${esc((a.adres||"").toUpperCase().slice(0,22))}</code></div></div></div>`;
  document.body.appendChild(el);try{navigator.vibrate&&navigator.vibrate(klaar?[40,60,40,60,80]:[30,40,30])}catch(e){}
  /* stuk afscheuren, met confetti vanaf de scheurlijn */
  setTimeout(()=>{const st=el.querySelector(".ft-stub");if(!st)return;const r=(typeof vpR==="function"?vpR(st):st.getBoundingClientRect());el.querySelector(".ft").classList.add("scheur");
    confetti(document.body,{n:klaar?260:150,bron:{x:r.left+r.width/2,y:r.top}});if(klaar)setTimeout(()=>confetti(document.body,{n:200}),350)},650);
  const weg=()=>{laatDwarrelen(el);el.classList.add("weg");setTimeout(()=>el.remove(),350)};el.addEventListener("click",weg);setTimeout(weg,klaar?4200:3200)}catch(e){console.error(e)}}

/* ---------- Betaald via Mollie: geld-melding met confetti en kassageluid ---------- */
let betaalVorig=null;
function kassa(){try{const A=new (window.AudioContext||window.webkitAudioContext)(),t=A.currentTime,o=A.createGain();o.gain.value=.22;o.connect(A.destination);
  /* "ka": korte tik, "ching": heldere belletjes met nagalm */
  const n=A.createBufferSource(),b=A.createBuffer(1,A.sampleRate*.05,A.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);n.buffer=b;const ng=A.createGain();ng.gain.value=.5;n.connect(ng).connect(o);n.start(t);
  [[2093,.07],[2637,.1],[3136,.13],[4186,.16],[2637,.3],[3520,.34]].forEach(([f,dl])=>{const os=A.createOscillator(),g=A.createGain();os.type="triangle";os.frequency.value=f;g.gain.setValueAtTime(0,t+dl);g.gain.linearRampToValueAtTime(.5,t+dl+.005);g.gain.exponentialRampToValueAtTime(.001,t+dl+.7);os.connect(g).connect(o);os.start(t+dl);os.stop(t+dl+.75)});
  setTimeout(()=>A.close(),1500)}catch(e){}}
const gpBedrag=v=>`<small>€</small>${esc(eur(v).replace(/^€\s?/,""))}`;
function geldFeest(f){try{
  const old=document.getElementById("geldPop");if(old)old.remove();
  const bedrag=totals(f).inc,el=document.createElement("div");el.id="geldPop";el.className="geldpop";el.setAttribute("role","status");
  el.innerHTML=`<div class="gp-k">
    <div class="gp-top"><svg class="gp-ic" viewBox="0 0 24 24"><path d="M16.5 7.2A5.8 5.8 0 1 0 16.5 16.8"/><path d="M5.5 10.5h7.5M5.5 13.5h7.5"/></svg><span class="gp-l"><svg viewBox="0 0 24 24">${VINK}</svg>Betaling ontvangen</span><button type="button" class="gp-x" aria-label="Sluiten">${I.x}</button></div>
    <div class="gp-body"><b class="gp-b" id="geldB">${gpBedrag(0)}</b><span class="gp-w">${esc(cleanName(f.klantNaam||""))}</span><span class="gp-m">Factuur ${esc(f.nummer||"")} · iDEAL · zojuist</span>
      <button type="button" class="primary gp-btn" data-geldf="${esc(f.id)}">Bekijk factuur</button></div></div>`;
  document.body.appendChild(el);kassa();
  requestAnimationFrame(()=>{const r=vpR(el);confetti(document.body,{n:70,bron:{x:r.left+r.width/2,y:r.top+40}})});
  const B=el.querySelector("#geldB"),t0=performance.now(),dur=900;const stap=n=>{const p=Math.min(1,(n-t0)/dur),e=1-Math.pow(1-p,3);B.innerHTML=gpBedrag(bedrag*e);if(p<1)requestAnimationFrame(stap)};requestAnimationFrame(stap);
  const weg=()=>{el.classList.add("weg");setTimeout(()=>el.remove(),300)};
  el.querySelector("[data-geldf]").onclick=()=>{weg();openFactuur(f.id)};el.querySelector(".gp-x").onclick=weg;
  let tm=setTimeout(weg,9000);el.addEventListener("mouseenter",()=>clearTimeout(tm));el.addEventListener("mouseleave",()=>{tm=setTimeout(weg,4000)})}catch(e){console.error(e)}}
function betaalCheck(){if(!state.loaded||isMw())return;const nu={};state.facturen.forEach(f=>{if(f.soort!=="offerte")nu[f.id]=f.status});
  if(betaalVorig){
    state.facturen.filter(f=>f.status==="betaald"&&betaalVorig[f.id]&&betaalVorig[f.id]!=="betaald"&&f.betaalwijze==="mollie"&&String(f.betaaldOp||"").slice(0,10)>=iso(addDays(today(),-1))).slice(0,1).forEach(geldFeest)}
  betaalVorig=nu}
