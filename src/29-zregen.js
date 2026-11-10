/* ---------- MELDKAMER: regenradar en dagstrook ----------
   1. Regenradar: de buienradar (RainViewer) over de live kaart, en per volgend adres of het daar de komende 2 uur gaat regenen (Open-Meteo, per kwartier).
   2. Dagstrook: per dag (of per bus) gepland tegenover werkelijk: bij de klant, rijden en pauze. Alleen echte gegevens. */
const RG={pad:"",host:"",tijd:0,laag:null,aan:(()=>{try{return localStorage.getItem("ms.rg")!=="0"}catch(e){return true}})(),haal:0,voor:null,voorT:0,bezig:false};
const RG_UIT=true;
async function rgRadar(){if(RG_UIT)return;if(Date.now()-RG.haal<5*60e3)return;RG.haal=Date.now();
  try{const j=await (await fetch("https://api.rainviewer.com/public/weather-maps.json")).json(),L=(j.radar&&j.radar.past)||[],f=L[L.length-1];
    if(f){RG.host=j.host||"https://tilecache.rainviewer.com";RG.pad=f.path;RG.tijd=f.time*1000;rgLaag()}}catch(e){}}
function rgLaag(){const el=document.getElementById("rvMap"),m=el&&el._map,L=window.L;if(!m||!L)return;
  /* buienradar op de kaart staat uit (op verzoek van Robin): laag en knop weg */
  if(RG_UIT){if(el._rg){m.removeLayer(el._rg);el._rg=null}const kb=el.querySelector(".rg-knop");if(kb)kb.remove();return}
  if(!RG.aan||!RG.pad){if(el._rg){m.removeLayer(el._rg);el._rg=null}rgKnop(el);return}
  const url=RG.host+RG.pad+"/256/{z}/{x}/{y}/2/1_1.png";
  if(el._rg&&el._rgUrl===url&&m.hasLayer(el._rg)){rgKnop(el);return}
  if(el._rg)m.removeLayer(el._rg);
  if(!m.getPane("rgPane")){m.createPane("rgPane").style.zIndex=390;m.getPane("rgPane").style.pointerEvents="none"}
  el._rg=L.tileLayer(url,{pane:"rgPane",opacity:.62,maxNativeZoom:7,maxZoom:22,tileSize:256,className:"rg-tegel"}).addTo(m);el._rgUrl=url;rgKnop(el)}
function rgKnop(el){if(!el)return;if(RG_UIT){const kb=el.querySelector(".rg-knop");if(kb)kb.remove();return}let b=el.querySelector(".rg-knop");if(!b){b=document.createElement("button");b.type="button";b.className="rg-knop";b.dataset.rg="1";el.appendChild(b)}
  const t=RG.tijd?new Date(RG.tijd).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):"";
  const v=RG.voor,droog=v&&!v.leeg&&!v.eerste;
  b.setAttribute("aria-pressed",RG.aan);b.title=RG.aan?"Buienradar staat aan"+(t?" (beeld van "+t+")":"")+" · tik om uit te zetten":"Buienradar aanzetten";
  b.innerHTML=`<span class="rg-dr"></span>Buienradar${RG.aan?(droog?" <small>· geen buien</small>":t?` <small>· ${t}</small>`:""):" <small>· uit</small>"}`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-rg]");if(!b)return;e.preventDefault();e.stopPropagation();RG.aan=!RG.aan;try{localStorage.setItem("ms.rg",RG.aan?"1":"0")}catch(_){}rgLaag()},true);
/* regen per volgend adres, per kwartier, komende 2 uur */
async function rgVoorspel(){if(RG.bezig||Date.now()-RG.voorT<10*60e3)return;const ti=iso(today()),open=routeStops(ti).filter(x=>!x.done).slice(0,12);
  const P=open.map(x=>({k:x.k,c:typeof pkCoord==="function"?pkCoord(x.k):null})).filter(x=>x.c);if(!P.length){RG.voor={leeg:true};return}
  RG.bezig=true;RG.voorT=Date.now();
  try{const la=P.map(x=>x.c[0].toFixed(3)).join(","),lo=P.map(x=>x.c[1].toFixed(3)).join(",");
    const j=await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&minutely_15=precipitation&forecast_minutely_15=9&timezone=Europe%2FAmsterdam`)).json();
    const A=Array.isArray(j)?j:[j],nu=Date.now();let eerste=null;const raak=[];
    A.forEach((r,i)=>{const m=r&&r.minutely_15;if(!m)return;m.time.forEach((t,ix)=>{const ts=Date.parse(t+":00"),mm=Number(m.precipitation[ix])||0;if(ts<nu-15*60e3||mm<0.2)return;
      if(!raak.some(z=>z.i===i))raak.push({i,ts,mm});if(!eerste||ts<eerste.ts)eerste={i,ts,mm}})});
    RG.voor={P,eerste,raak,max:Math.max(0,...raak.map(z=>z.mm))}}
  catch(e){RG.voor=null}finally{RG.bezig=false;rgRegelZet();rgKnop(document.getElementById("rvMap"))}}
function rgRegelHtml(){const v=RG.voor;if(!v||v.leeg)return"";
  if(!v.eerste)return `<div class="rg-regel droog"><span class="rg-ic">${I.sun||"☀"}</span><span><b>Komende 2 uur droog</b> op de volgende adressen</span></div>`;
  const t=new Date(v.eerste.ts),hm=t.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}),min=Math.round((v.eerste.ts-Date.now())/6e4),k=v.P[v.eerste.i].k,adr=jobAddrObj(k).adres||ccNaam(k),n=v.raak.length-1;
  const zwaar=v.max>=2?"flinke bui":v.max>=0.8?"bui":"lichte regen";
  return `<div class="rg-regel nat"><span class="rg-ic">${I.drop||"💧"}</span><span><b>${min<=5?"Nu "+zwaar:zwaar[0].toUpperCase()+zwaar.slice(1)+" over "+min+" min"}</b> · rond ${hm} bij ${esc(adr)}${n>0?` en ${plural(n,"ander adres","andere adressen")}`:""}</span></div>`}
function rgRegelZet(){if(state.tab!=="control")return;const el=document.getElementById("rgRegel");if(el)el.innerHTML=rgRegelHtml()}
I.drop=I.drop||'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/></svg>';
I.sun=I.sun||'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

/* ---------- dagstrook ---------- */
function dsData(d){const w=wdGet(d)||{},nu=new Date(),isT=d===iso(today()),ms=x=>x?new Date(x).getTime():null;
  const stops=routeStops(d),gepland=stops.map(x=>{const s=toMin(x.k.tijd);return s==null?null:{van:s,tot:s+(Number(duur(x.k))||30),k:x.k,done:x.done}}).filter(Boolean);
  const dag=new Date(d+"T00:00:00").getTime(),mn=t=>(t-dag)/6e4;
  const klant=state.beurten.filter(b=>b.datum===d&&!b.geannuleerd&&b.op).map(b=>{const tot=ms(b.op),van=b.startOp?ms(b.startOp):tot-beurtMin(b)*6e4;return{van:mn(van),tot:mn(tot),naam:cleanName(b.klantNaam||""),gemeten:!!b.startOp,door:b.door||""}});
  if(isT)stops.filter(x=>!x.done&&x.k.bezig&&String(x.k.bezig).slice(0,10)===d).forEach(x=>klant.push({van:mn(ms(x.k.bezig)),tot:mn(nu.getTime()),naam:cleanName(x.k.naam),bezig:true}));
  const pauze=(w.pauzes||[]).map(p=>({van:mn(ms(p.van)),tot:mn(p.tot?ms(p.tot):(w.stop?ms(w.stop):nu.getTime()))}));
  const start=w.start?mn(ms(w.start)):null,eind=w.stop?mn(ms(w.stop)):(isT&&w.start?mn(nu.getTime()):null);
  return{gepland,klant:klant.sort((a,b)=>a.van-b.van),pauze,start,eind,nu:isT?mn(nu.getTime()):null}}
/* dagstrook staat uit (op verzoek van Robin) */
const DS_UIT=true;
function dsHtml(){if(DS_UIT)return"";try{const d=iso(today()),D=dsData(d);if(!D.gepland.length&&!D.klant.length)return"";
  const basis=[...D.gepland.flatMap(x=>[x.van,x.tot]),...D.klant.flatMap(x=>[x.van,x.tot]),D.start,D.eind].filter(x=>x!=null&&isFinite(x));
  /* is de dag al klaar, dan de strook niet tot "nu" (bijv. 22:00) uitrekken */
  const nuEcht=D.nu,nuIn=D.nu!=null&&(!basis.length||(D.nu<=Math.max(...basis)+45&&D.nu>=Math.min(...basis)-60));if(!nuIn)D.nu=null;
  const alle=[...basis,D.nu].filter(x=>x!=null&&isFinite(x));
  const lo=Math.floor((Math.min(...alle)-20)/60)*60,hi=Math.ceil((Math.max(...alle)+20)/60)*60,span=Math.max(60,hi-lo),pc=m=>((Math.max(lo,Math.min(hi,m))-lo)/span*100).toFixed(2)+"%",br=(a,b)=>((Math.max(0,Math.min(hi,b)-Math.max(lo,a)))/span*100).toFixed(2)+"%";
  const hm=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(Math.round(m%60)).padStart(2,"0");
  /* niet meer dan ~7 tijden onder de strook, zodat ze op de telefoon niet over elkaar vallen */
  const nU=span/60,stap=nU<=6?60:nU<=12?120:180,uren=[];for(let h=lo;h<=hi;h+=stap)uren.push(`<span style="left:${pc(h)}">${String(Math.floor(h/60))}:00</span>`);
  /* rijden = binnen de werkdag, niet bij een klant en geen pauze */
  const rij=[];if(D.start!=null&&D.eind!=null){const bezet=[...D.klant,...D.pauze].map(x=>[x.van,x.tot]).sort((a,b)=>a[0]-b[0]);let t=D.start;bezet.forEach(([a,b])=>{if(a>t+1)rij.push({van:t,tot:Math.min(a,D.eind)});t=Math.max(t,b)});if(D.eind>t+1)rij.push({van:t,tot:D.eind})}
  const som=l=>l.reduce((a,x)=>a+Math.max(0,x.tot-x.van),0),kl=som(D.klant),rj=som(rij.filter(x=>x.tot>x.van)),pz=som(D.pauze);
  /* uitloop: werkelijk klaar bij de laatst afgemelde stop tegenover de planning van die stop */
  const gp=D.gepland.filter(x=>x.done),laatst=D.klant.filter(x=>!x.bezig).slice(-1)[0];let uit=null;
  if(laatst&&gp.length){const g=D.gepland.find(x=>cleanName(x.k.naam)===laatst.naam);if(g)uit=Math.round(laatst.tot-g.tot)}
  /* zelfde nummer in Gepland en Werkelijk, zodat je ziet welke klant welke is */
  const nrVan=n=>{const i=D.gepland.findIndex(x=>cleanName(x.k.naam)===n);return i<0?"":String(i+1)};
  const blok=(x,c,t,nr)=>{const w=(Math.max(0,Math.min(hi,x.tot)-Math.max(lo,x.van)))/span*100;return `<i class="ds-b ${c}${w<3.2?" sm":""}" style="left:${pc(x.van)};width:${w.toFixed(2)}%" title="${esc(t)}">${nr?`<em>${nr}</em>`:""}${nr&&w>11&&x.k?`<span>${esc(cleanName(x.k.naam))}</span>`:""}</i>`};
  const lijnen=[];for(let h=lo;h<=hi;h+=60)lijnen.push(`<i class="ds-gl${(h-lo)%stap?"":" vol"}" style="left:${pc(h)}"></i>`);
  const tot=kl+rj+pz,pr=v=>tot?Math.round(v/tot*100):0;
  const oordeel=uit==null?"":uit>10?`<span class="ds-oo laat">${I.clock||""}${uit} min later klaar dan gepland</span>`:uit<-10?`<span class="ds-oo vroeg">${I.check||""}${-uit} min eerder klaar dan gepland</span>`:`<span class="ds-oo ok">${I.check||""}Precies volgens planning</span>`;
  const tegel=(c,l,v,sub)=>`<div class="ds-t ${c}"><span>${l}</span><b>${v}</b>${sub?`<small>${sub}</small>`:""}</div>`;
  const wd=D.start!=null?tegel("t-wd","Werkdag",hm(D.start)+" – "+(D.eind!=null&&!(D.nu!=null&&Math.abs(D.eind-D.nu)<2)?hm(D.eind):"nu"),D.eind!=null?wdU(D.eind-D.start)+" in totaal":""):"";
  const leeg=!tot&&D.start==null,gpS=D.gepland.slice().sort((a,b)=>a.van-b.van),gpMin=som(D.gepland);
  const tegels=leeg&&gpS.length?tegel("t-wd","Gepland",plural(gpS.length,"klant","klanten"),"")+tegel("t-gp","Eerste klant",hm(gpS[0].van),"")+tegel("t-gp","Laatste klaar",hm(Math.max(...gpS.map(x=>x.tot))),"")+tegel("t-kl","Bij klanten",wdU(gpMin),"volgens planning")
    :`${wd}${tegel("t-kl","Bij klanten",wdU(kl),tot?pr(kl)+"% van de dag":"")}${tegel("t-rj","Rijden",wdU(rj),tot?pr(rj)+"% van de dag":"")}${pz?tegel("t-pz","Pauze",wdU(pz),""):""}`;
  const oordeel2=oordeel||(leeg&&gpS.length&&nuEcht!=null&&nuEcht<gpS[0].van?`<span class="ds-oo wacht">${I.clock||""}Nog niet begonnen · eerste klant om ${hm(gpS[0].van)}</span>`:"");
  const lijst=D.gepland.map((x,i)=>`<li class="${x.done?"af":""}"><em>${x.done?(I.check||"✓"):i+1}</em><span>${esc(cleanName(x.k.naam))}</span><small>${hm(x.van)}</small></li>`).join("");
  const werkLeeg=!D.klant.length&&!rij.length&&!D.pauze.length;
  const legenda=`<div class="ds-leg"><span><i class="gp"></i>Gepland</span><span><i class="kl"></i>Bij de klant</span><span><i class="rj"></i>Rijden</span>${pz?`<span><i class="pz"></i>Pauze</span>`:""}${D.nu!=null?`<span><i class="nu"></i>Nu</span>`:""}</div>`;
  /* per klant een tegel: gepland tegenover werkelijk */
  const volg=D.gepland.findIndex(x=>!x.done);
  const kTegels=D.gepland.map((x,i)=>{const nm=cleanName(x.k.naam),w=D.klant.find(y=>y.naam===nm),dv=w?Math.round(w.van-x.van):null;
    const st=w&&w.bezig?"bz":x.done?"af":i===volg?"vg":"";
    const lab=st==="bz"?"Nu bezig":st==="af"?"Klaar":st==="vg"?"Volgende":"Gepland";
    const sub=w&&w.bezig?`Gestart ${hm(w.van)}${dv>10?` · ${dv} min later`:dv<-10?` · ${-dv} min eerder`:""}`
      :w?`Werkelijk ${hm(w.van)} – ${hm(w.tot)}${dv>10?` · ${dv} min later`:dv<-10?` · ${-dv} min eerder`:" · op tijd"}`
      :x.done?"Afgemeld":`${Math.round(x.tot-x.van)} min`;
    const laat=w&&dv>10;
    return `<div class="ds-t ds-kt ${st}"><span><em>${x.done?(I.check||"✓"):i+1}</em><i class="lb">${lab} · </i>${hm(x.van)} – ${hm(x.tot)}</span><b title="${esc(nm)}">${esc(nm)}</b><small class="${laat?"laat":""}">${sub}</small></div>`}).join("");
  return `<div class="ds"><div class="ds-k"><div><b>Dagstrook</b><small>Hoe liep je dag tegenover de planning?</small></div>${oordeel2}</div>
    <div class="ds-tg">${tegels}</div>
    ${tot?`<div class="ds-mix" aria-hidden="true"><i class="kl" style="flex:${kl}"></i><i class="rj" style="flex:${rj}"></i>${pz?`<i class="pz" style="flex:${pz}"></i>`:""}</div>`:""}
    ${kTegels?`<div class="ds-kl">${kTegels}</div>`:""}</div>`}catch(e){console.error("dagstrook",e);return""}}
/* elke minuut bijwerken (nu-lijn, bezig-blok) zonder het scherm opnieuw te tekenen */
if(typeof window!=="undefined")setInterval(()=>{try{if(state.tab!=="control")return;const el=document.querySelector(".ds");if(el){const t=document.createElement("div");t.innerHTML=dsHtml();if(t.firstElementChild)el.replaceWith(t.firstElementChild)}rgRadar();rgVoorspel()}catch(e){}},60000);
function rgStart(){rgRadar();rgLaag();rgVoorspel();rgRegelZet()}
