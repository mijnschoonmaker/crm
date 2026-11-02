/* ---------- Motivatie onderweg: huisjes die vollopen en een feestje bij elke afmelding ---------- */
const HUIS='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 10.4 12 4.2l7.5 6.2v8.4a1.4 1.4 0 0 1-1.4 1.4h-3.4v-5a1 1 0 0 0-1-1h-3.4a1 1 0 0 0-1 1v5H5.9a1.4 1.4 0 0 1-1.4-1.4z" stroke-linejoin="round"/></svg>';
function motTekst(done,total){const todo=total-done;
  if(!total)return"";if(!done)return"Klaar voor de start? Het eerste adres wacht.";
  if(!todo)return total>1?`Dag klaar! ${total} ${BW("woningen")} gedaan, top gewerkt`:"Klaar! Top gewerkt";
  if(todo===1)return"Nog één adres, bijna klaar!";
  if(done/total>=.5)return`Over de helft, goed bezig! Nog ${todo} te gaan`;
  return`Lekker op gang · ${done} ${done===1?BW("woning"):BW("woningen")} gedaan`}
function huisjes(done,total,nieuw){if(!total)return"";const max=16,n=Math.min(total,max),d=Math.round(done/total*n);
  return `<div class="huisjes" role="img" aria-label="${done} van ${total} ${BW("woningen")} gedaan">${Array.from({length:n},(_,i)=>`<i class="${i<d?"af":""}${nieuw&&i===d-1?" pop":""}">${HUIS}</i>`).join("")}${total>max?`<small>+${total-max}</small>`:""}</div>`}
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
    <div class="ft-body"><b class="ft-w">${esc(woord)}</b><span class="ft-a">${klaar?(total>1?`Alle ${total} ${BW("woningen")} gedaan. Rust lekker uit.`:"Top gewerkt vandaag."):esc(a.adres||cleanName(k.naam))+" is klaar"}</span>
      ${huisjes(done,total,true)}${klaar?"":`<span class="ft-nog">Nog ${todo} ${todo===1?"adres":"adressen"} te gaan</span>`}</div>
    <div class="ft-stub"><div class="ft-perf"><i class="ft-rits"></i></div><div class="ft-st"><span class="ft-stempel">${'<svg viewBox="0 0 24 24"><path d="M5.5 12.8l4.2 4.2L18.5 7.6"/></svg>'}<i>${BW("gewassen")}</i></span><code>${esc((a.adres||"").toUpperCase().slice(0,22))}</code></div></div></div>`;
  document.body.appendChild(el);try{navigator.vibrate&&navigator.vibrate(klaar?[40,60,40,60,80]:[30,40,30])}catch(e){}
  /* stuk afscheuren, met confetti vanaf de scheurlijn */
  setTimeout(()=>{const st=el.querySelector(".ft-stub");if(!st)return;const r=(typeof vpR==="function"?vpR(st):st.getBoundingClientRect());el.querySelector(".ft").classList.add("scheur");
    confetti(document.body,{n:klaar?260:150,bron:{x:r.left+r.width/2,y:r.top}});if(klaar)setTimeout(()=>confetti(document.body,{n:200}),350)},900);
  const weg=()=>{laatDwarrelen(el);el.classList.add("weg");setTimeout(()=>el.remove(),350)};el.addEventListener("click",weg);setTimeout(weg,klaar?4200:3200)}catch(e){console.error(e)}}

/* ---------- Betaald via Mollie: geld-melding met confetti en kassageluid ---------- */
let betaalVorig=null;
function kassa(){if(S().ccGeluid===false)return;try{const A=new (window.AudioContext||window.webkitAudioContext)(),t=A.currentTime,o=A.createGain();o.gain.value=.22;o.connect(A.destination);
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
    <div class="gp-body"><b class="gp-b" id="geldB">${gpBedrag(0)}</b><span class="gp-w">${esc(cleanName(f.klantNaam||""))}</span><span class="gp-m">Factuur ${esc(f.nummer||"")} · ${esc(betVia(f))} · zojuist</span>
      <button type="button" class="primary gp-btn" data-geldf="${esc(f.id)}">Bekijk factuur</button></div></div>`;
  document.body.appendChild(el);kassa();
  requestAnimationFrame(()=>{const r=vpR(el);confetti(document.body,{n:70,bron:{x:r.left+r.width/2,y:r.top+40}})});
  const B=el.querySelector("#geldB"),t0=performance.now(),dur=900;const stap=n=>{const p=Math.min(1,(n-t0)/dur),e=1-Math.pow(1-p,3);B.innerHTML=gpBedrag(bedrag*e);if(p<1)requestAnimationFrame(stap)};requestAnimationFrame(stap);
  const weg=()=>{el.classList.add("weg");setTimeout(()=>el.remove(),300)};
  el.querySelector("[data-geldf]").onclick=()=>{weg();openFactuur(f.id)};el.querySelector(".gp-x").onclick=weg;
  let tm=setTimeout(weg,9000);el.addEventListener("mouseenter",()=>clearTimeout(tm));el.addEventListener("mouseleave",()=>{tm=setTimeout(weg,4000)})}catch(e){console.error(e)}}
function betaalCheck(){if(!state.loaded||isMw())return;const nu={};state.facturen.forEach(f=>{if(f.soort!=="offerte")nu[f.id]=f.status});
  if(betaalVorig){
    state.facturen.filter(f=>f.status==="betaald"&&betaalVorig[f.id]&&betaalVorig[f.id]!=="betaald"&&betAuto(f)&&String(f.betaaldOp||"").slice(0,10)>=iso(addDays(today(),-1))).slice(0,1).forEach(geldFeest)}
  betaalVorig=nu;try{if(typeof ccBetVernieuw==="function")ccBetVernieuw()}catch(e){}}
/* binnengekomen betalingen: automatisch verwerkt (iDEAL via Mollie, bankkoppeling of incasso), niet wat je zelf op betaald zet */
const betAuto=f=>!!f&&f.status==="betaald"&&(f.betaalwijze==="mollie"||!!f.bankTx||(f.betaalwijze==="incasso"&&f.mollieStatus==="paid"));
const MOLLIE_M={ideal:"iDEAL",creditcard:"Creditcard",bancontact:"Bancontact",paypal:"PayPal",applepay:"Apple Pay",banktransfer:"Overboeking via Mollie",kbc:"KBC",belfius:"Belfius",in3:"in3",klarna:"Klarna"};
const betVia=f=>f.betaalwijze==="mollie"?(f.mollieMethode?MOLLIE_M[f.mollieMethode]||f.mollieMethode:"iDEAL"):f.betaalwijze==="incasso"?"Incasso":f.bankTx?"Bank":f.betaalwijze==="contant"?"Contant":f.betaalwijze==="pin"?"Pin":"Overgemaakt";
const betTs=f=>String(f.betaaldTs||(f.betaaldOp?f.betaaldOp+"T12:00:00":"")||"");
const betZienLees=()=>{try{return localStorage.getItem("ms.betZien")||""}catch(e){return""}};
function betNieuw(){const z=betZienLees()||iso(today())+"T00:00:00";return (state.facturen||[]).filter(f=>f.soort!=="offerte"&&betAuto(f)&&betTs(f)>z)}
/* betaalsnelheid zoals in het klantportaal: van versturen tot betaald, op de seconde */
const betVan=f=>{if(f.verstuurdTs)return f.verstuurdTs;const v=String(f.verstuurdOp||"");if(/T\d/.test(v))return v;if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const g=String(f.gemaakt||"");return g&&g.slice(0,10)===v?g:v+"T00:00:00"}return f.gemaakt||(f.datum?f.datum+"T09:00:00":"")};
const betSec=f=>{if(f.status!=="betaald")return null;const bo=String(f.betaaldOp||"").slice(0,10),ts=f.betaaldTs||(/^\d{4}-\d{2}-\d{2}$/.test(bo)?bo+"T12:00:00":"");if(!ts)return null;const v=Date.parse(betVan(f)),t=Date.parse(ts);return v>0&&t>0?Math.max(0,Math.round((t-v)/1000)):null};
/* via de bank (afschrift of bankkoppeling) of handmatig "per bank": de bank geeft alleen de dag, niet het tijdstip.
   Het tijdstip in betaaldTs is dan het moment van inlezen, dus geen echte betaaltijd. */
const betAlleenDag=f=>!!f.bankTx||f.betaalwijze==="overmaken"||f.betaalwijze==="incasso";
const betDagTekst=f=>{const v=String(betVan(f)).slice(0,10),b=String(f.betaaldOp||"").slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!/^\d{4}-\d{2}-\d{2}$/.test(b))return"";const n=Math.max(0,Math.round((Date.parse(b)-Date.parse(v))/864e5));return n===0?"betaald op de dag van de factuur":n===1?"betaald 1 dag na de factuur":"betaald "+n+" dagen na de factuur"};
const betDuur=sec=>{if(sec==null)return"";const d=Math.floor(sec/86400),u=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),x=sec%60,p=[];if(d)p.push(d+(d===1?" dag":" dagen"));if(u)p.push(u+" uur");if(m)p.push(m+" min");if(x||!p.length)p.push(x+" sec");return p.join(" ")};
/* ranglijst nu: klanten op gemiddelde betaalsnelheid (betaalde facturen van de laatste 12 maanden), zelfde regels als het portaal */
/* je eigen klantkaart (zelfde e-mail als je bedrijf) doet niet mee, net als in het portaal */
const betEigen=()=>{const m=String(S().email||"").trim().toLowerCase(),o=new Set();if(m)(state.klanten||[]).forEach(k=>{if(String(k.email||"").trim().toLowerCase()===m||k.nietInRanglijst===true)o.add(k.id)});return o};
/* snelste betalers van de maand, zelfde regels als het portaal: vanaf november 2026 alleen via de iDEAL-knop (Mollie, iDEAL, geen incasso) */
const BET_IDEAL_VANAF="2026-11";
const betIdeal=f=>f.betaalwijze==="mollie"&&!f.incasso&&(f.mollieMethode==="ideal"||(!f.mollieMethode&&String(f.betaaldTs||"")<"2026-11-01T15:00"));
const betMaand=f=>String(f.betaaldTs?iso(new Date(f.betaaldTs)):f.betaaldOp||"").slice(0,7);
/* plek per klant in de snelste betalers van een maand (zelfde regels als de top 3 en het portaal) */
function betMaandRang(m){const T=betMaandTop(m,true),r={};T.forEach((x,i)=>r[x.f.klantId]={plek:i+1,fid:x.f.id});return{r,n:T.length}}
function betMaandTop(m,alle){const eig=betEigen(),best={};(state.facturen||[]).forEach(f=>{if(f.soort==="offerte"||f.status!=="betaald"||!f.klantId||eig.has(f.klantId)||betMaand(f)!==m)return;if(f.incasso||f.betaalwijze==="incasso")return;if(m>=BET_IDEAL_VANAF&&!betIdeal(f))return;const s=betSec(f);if(s==null)return;if(!best[f.klantId]||s<best[f.klantId].s)best[f.klantId]={f,s}});
  const L=Object.values(best).sort((a,b)=>a.s-b.s);return alle?L:L.slice(0,3)}
function betMaandHtml(){const m=iso(today()).slice(0,7),T=betMaandTop(m),st=S(),pr=[["crMaandTop",5],["crMaandTop2",2.5],["crMaandTop3",1]].map(([k,d])=>st[k]!=null&&st[k]!==""?Number(st[k]):d),kl=["top","zilver","brons"];
  const mn=MAANDEN[Number(m.slice(5))-1];
  return `<div class="bet-mt"><div class="bet-mth"><b>Snelste betalers ${esc(mn)}</b><small>Telt mee: alleen betalen met de iDEAL-knop. Op de 1e van de maand krijgt de top 3 de credits en een mail.</small></div>
    ${T.length?`<div class="bet-mtl">${T.map((x,i)=>`<span class="bet-mtp"><span class="bet-rk ${kl[i]}"><i class="bet-cup">🏆</i><b>${i+1}</b></span><span><b>${esc(cleanName(x.f.klantNaam||"Klant"))}</b><small>${esc(betDuur(x.s))}${pr[i]>0?" · +"+String(pr[i]).replace(".",",")+" credits":""}</small></span></span>`).join("")}</div>`:`<p class="subt" style="margin:0">Nog niemand deze maand.</p>`}</div>`}
function betRanglijst(){const sinds=iso(addDays(today(),-365)),per={},eig=betEigen();(state.facturen||[]).forEach(f=>{if(f.soort==="offerte"||f.status!=="betaald"||!f.klantId||eig.has(f.klantId)||String(f.datum||"")<sinds)return;const s=betSec(f);if(s==null)return;(per[f.klantId]=per[f.klantId]||[]).push(s)});
  const l=Object.entries(per).map(([id,a])=>({id,s:a.reduce((x,y)=>x+y,0)/a.length})).sort((a,b)=>a.s-b.s),r={};l.forEach((x,i)=>r[x.id]=i+1);return{r,n:l.length}}
/* kopje boven elke maand in de betalingenlijst, met de top 3 van die maand */
function betMaandKop(f,vorig,MR){const bm=betMaand(f);if(vorig&&betMaand(vorig)===bm)return"";const MRm=MR[bm]||(MR[bm]=betMaandRang(bm)),T=betMaandTop(bm),kl=["top","zilver","brons"],nuM=iso(today()).slice(0,7)===bm,mn=MAANDEN[Number(bm.slice(5))-1]||bm;
  return `<div class="bet-mk${nuM?" nu":""}"><div class="bet-mkh"><b>${esc(mn.charAt(0).toUpperCase()+mn.slice(1))}</b><small>${nuM?"loopt nog":"afgesloten"}</small></div>${T.length?`<div class="bet-mkt">${T.map((x,i)=>`<span class="bet-mkp"><span class="bet-rk ${kl[i]}"><i class="bet-cup">🏆</i><b>${i+1}</b></span>${esc(cleanName(x.f.klantNaam||"Klant").split(",")[0])}</span>`).join("")}</div>`:`<small class="bet-mk0">Nog geen snelste betalers</small>`}</div>`}
/* lijst met betalingen van de laatste 14 dagen (alle manieren), nieuwste bovenaan */
function openBetalingen(){const van=iso(addDays(today(),-14)),z=betZienLees()||iso(today())+"T00:00:00";
  const L=(state.facturen||[]).filter(f=>f.soort!=="offerte"&&f.status==="betaald"&&String(f.betaaldOp||"")>=van).sort((a,b)=>betTs(b).localeCompare(betTs(a))),MR={};
  const som=L.reduce((a,f)=>a+totals(f).inc,0),vd=iso(today()),somVd=L.filter(f=>String(f.betaaldOp||"").slice(0,10)===vd).reduce((a,f)=>a+totals(f).inc,0);
  openDlg(`<div class="dlg-head"><span class="objic big bet-ic">${I.euro}</span><div style="min-width:0;flex:1"><h3>Betalingen</h3><div class="subt">Ontvangen in de laatste 14 dagen · vandaag ${eur(somVd)} · per maand gegroepeerd, elke maand heeft een eigen top 3</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    ${betMaandHtml()}${L.length?`<div class="bet-tot"><span>Totaal 14 dagen</span><b>${eur(som)}</b><small>${plural(L.length,"betaling","betalingen")}</small></div><div class="bet-l">${L.map((f,ix)=>{const kop=betMaandKop(f,ix?L[ix-1]:null,MR),nw=betAuto(f)&&betTs(f)>z,d=String(f.betaaldOp||"").slice(0,10);
      const dg=betAlleenDag(f),sec=dg?null:betSec(f),dgt=dg?betDagTekst(f):"",tijd=!dg&&f.betaaldTs?new Date(f.betaaldTs).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):"",bm=betMaand(f),MRm=MR[bm]||(MR[bm]=betMaandRang(bm)),mx=MRm.r[f.klantId],rg=mx&&mx.fid===f.id?mx.plek:0;
      return kop+`<button type="button" class="bet-r${nw?" nieuw":""}" data-betf="${esc(f.id)}"><span class="bet-av" style="--h:${hue(f.klantNaam||"")}">${esc(initials(cleanName(f.klantNaam||"?")))}</span><span class="bet-t"><b>${esc(cleanName(f.klantNaam||"Klant"))}</b><small>${d===vd?"Vandaag":esc(fmtD(d))}${tijd?" om "+esc(tijd):""} · ${esc(betVia(f))} · ${esc(f.nummer||"")}</small>${sec!=null?`<em class="bet-snel${sec<86400?" vlot":""}">${I.clock||""}betaald in ${esc(betDuur(sec))}${f.betaaldTs?"":" (ongeveer)"}</em>`:dgt?`<em class="bet-snel" title="De bank geeft alleen de dag door, niet het tijdstip">${I.clock||""}${esc(dgt)}</em>`:""}</span>${nw?'<i class="bet-nw">Nieuw</i>':""}<span class="bet-b">${eur(totals(f).inc)}</span><span class="bet-rk${rg===1?" top":rg===2?" zilver":rg===3?" brons":""}" title="${rg?"Plek "+rg+" bij de snelste betalers van "+(MAANDEN[Number(bm.slice(5))-1]||bm):"Telt niet mee voor de snelste betalers (alleen de snelste betaling per klant via de iDEAL-knop telt)"}">${rg?(rg<=3?'<i class="bet-cup">🏆</i>':"#")+"<b>"+rg+"</b><small class=\"bet-rkm\">"+esc((MAANDEN[Number(bm.slice(5))-1]||"").slice(0,3))+"</small>":"–"}</span></button>`}).join("")}</div>`
      :`<p class="subt" style="margin:8px 0">Nog geen betalingen in de laatste 14 dagen.</p>`}`);
  try{localStorage.setItem("ms.betZien",new Date().toISOString())}catch(e){}try{ccBetVernieuw()}catch(e){}
  dlg.querySelectorAll("[data-betf]").forEach(b=>b.onclick=()=>{const id=b.dataset.betf;dlg.close();openFactuur(id)})}
