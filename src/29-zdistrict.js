/* ---------- SUBGEBIEDEN PER POSTCODE (zoals de basisteams bij 112) ----------
   Elke postcode (4 cijfers) wordt opgedeeld in subgebieden van maximaal 10 woningen (glasbewassing) die dicht bij elkaar liggen:
   9861-A, 9861-B… Komt er een klant bij, dan gaat hij naar het dichtstbijzijnde subgebied in zijn postcode met nog plek;
   zit alles vol, dan maakt Mansard een nieuw subgebied. Bestaande indelingen blijven staan (instellingen/districten), zodat je
   er vast op kunt plannen: één subgebied is ongeveer één werkdag voor één bus. */
const SG={cap:null,sel:"",map:null,laag:null,bewaarT:0};
const SG_KL=["#d8c24a","#5fc4c4","#e07b6a","#a96fd0","#77c46c","#6c8fe0","#e0a35a","#5aa88f","#c46c9a","#8a9a4a"];
const sgCap=()=>{if(SG.cap==null){try{SG.cap=Number(localStorage.getItem("ms.dscap"))||Number((state.districten||{}).cap)||10}catch(e){SG.cap=10}}return Math.max(3,Math.min(30,Number(SG.cap)||10))};
const sgKlanten=()=>actief().filter(k=>!k.opdrachtVerwijderd&&(Number(k.prijs)>0||k.gepland||k.ramenRegel)&&(!GLAS()||/glas|ramen/i.test(String(k.dienst||HD()))));
const sgPc=k=>{const m=String(jobAddrObj(k).postcode||k.postcode||"").match(/^\s*(\d{4})/);return m?m[1]:""};
const sgAfst=(a,b)=>{const dy=(a[0]-b[0])*111.3,dx=(a[1]-b[1])*111.3*Math.cos(a[0]*Math.PI/180);return Math.sqrt(dx*dx+dy*dy)};
const sgMid=pts=>[pts.reduce((s,p)=>s+p[0],0)/pts.length,pts.reduce((s,p)=>s+p[1],0)/pts.length];
const sgLetter=i=>{let s="";i++;while(i>0){const r=(i-1)%26;s=String.fromCharCode(65+r)+s;i=Math.floor((i-1)/26)}return s};
/* groepjes van max cap die echt dicht bij elkaar liggen:
   1) zo weinig mogelijk groepen (n/cap naar boven), 2) meerdere startpunten (k-means++, vaste volgorde zodat de uitkomst stabiel is),
   3) toewijzen met capaciteit, 4) daarna klanten verplaatsen of ruilen zolang de groepen daardoor compacter worden.
   Maatstaf: som van de afstanden in het kwadraat tot het midden van de groep (grote uitschieters wegen zwaar). */
const SG_ALG=2;
function sgRnd(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;return x/4294967296}}
function sgKost(P,toe,K){const C=sgMids(P,toe,K);let t=0;P.forEach((p,i)=>{const d=sgAfst(p.c,C[toe[i]]);t+=d*d});return t}
function sgMids(P,toe,K){const s=[...Array(K)].map(()=>[0,0,0]);P.forEach((p,i)=>{const g=s[toe[i]];g[0]+=p.c[0];g[1]+=p.c[1];g[2]++});return s.map(g=>g[2]?[g[0]/g[2],g[1]/g[2]]:[0,0])}
function sgWijs(P,C,cap){const n=P.length,K=C.length,toe=new Array(n).fill(-1),tel=new Array(K).fill(0);
  /* wie de grootste "spijt" heeft (verschil tussen beste en op-één-na-beste groep) mag eerst kiezen */
  const ord=P.map((p,i)=>{const d=C.map(c=>sgAfst(p.c,c)).sort((a,b)=>a-b);return[i,(d[1]??d[0])-d[0]]}).sort((a,b)=>b[1]-a[1]);
  for(const [i] of ord){const opt=C.map((c,j)=>[sgAfst(P[i].c,c),j]).sort((a,b)=>a[0]-b[0]);for(const [,j] of opt){if(tel[j]<cap){toe[i]=j;tel[j]++;break}}}
  return toe}
function sgVerbeter(P,toe,K,cap){const n=P.length;let C=sgMids(P,toe,K),tel=new Array(K).fill(0);toe.forEach(j=>tel[j]++);
  for(let ronde=0;ronde<60;ronde++){let beter=false;
    for(let i=0;i<n;i++){const a=toe[i],da=sgAfst(P[i].c,C[a])**2;
      /* verplaatsen naar een groep met plek */
      for(let j=0;j<K;j++){if(j===a||tel[j]>=cap||tel[a]<=1)continue;if(sgAfst(P[i].c,C[j])**2+1e-9<da){toe[i]=j;tel[a]--;tel[j]++;beter=true;break}}
      if(toe[i]!==a)continue;
      /* ruilen met iemand uit een andere groep */
      for(let k=0;k<n;k++){const b=toe[k];if(b===a)continue;const voor=da+sgAfst(P[k].c,C[b])**2,na=sgAfst(P[i].c,C[b])**2+sgAfst(P[k].c,C[a])**2;if(na+1e-9<voor){toe[i]=b;toe[k]=a;beter=true;break}}}
    C=sgMids(P,toe,K);if(!beter)break}
  return toe}
function sgCluster(P,cap){const n=P.length;if(!n)return[];const K=Math.ceil(n/cap);if(K===1)return[P];
  P=[...P].sort((a,b)=>String(a.k.id).localeCompare(String(b.k.id)));
  let best=null,bk=Infinity;
  for(let poging=0;poging<8;poging++){const r=sgRnd(9301+poging*7919);
    /* k-means++ startpunten */
    const C=[P[Math.floor(r()*n)].c];while(C.length<K){const d=P.map(p=>Math.min(...C.map(c=>sgAfst(p.c,c)))**2),tot=d.reduce((a,b)=>a+b,0);let x=r()*tot,i=0;while(i<n-1&&(x-=d[i])>0)i++;C.push(P[i].c)}
    let toe=sgWijs(P,C,cap);
    for(let it=0;it<15;it++){const nC=sgMids(P,toe,K),nt=sgWijs(P,nC,cap);if(nt.every((j,i)=>j===toe[i]))break;toe=nt}
    toe=sgVerbeter(P,toe,K,cap);const k=sgKost(P,toe,K);if(k<bk){bk=k;best=toe}}
  const G=[...Array(K)].map(()=>[]);P.forEach((p,i)=>G[best[i]].push(p));
  /* letters op volgorde van noord-west naar zuid-oost, zodat A, B, C ook op de kaart naast elkaar liggen */
  return G.filter(g=>g.length).map(g=>({g,m:sgMid(g.map(x=>x.c))})).sort((a,b)=>(b.m[0]-a.m[0])+(a.m[1]-b.m[1])*0.6).map(x=>x.g)}
/* indeling: bestaande codes blijven, nieuwe klanten naar het dichtstbijzijnde subgebied met plek (binnen 1,5 km), anders wordt de
   hele postcode opnieuw compact ingedeeld. Een oude indeling (van vóór deze rekenwijze) wordt één keer helemaal opnieuw gemaakt. */
function sgToewijzen(){const cap=sgCap(),dd=state.districten||{},opnieuw=(dd.alg||0)<SG_ALG,oud=opnieuw?{}:(dd.map||{}),map={},per={};
  sgKlanten().forEach(k=>{const c=pkCoord(k),pc=sgPc(k);if(!c||!pc)return;(per[pc]=per[pc]||[]).push({k,c})});
  Object.entries(per).forEach(([pc,L])=>{let G={},nieuw=[];
    L.forEach(x=>{const o=oud[x.k.id];if(o&&String(o).startsWith(pc+"-"))(G[o]=G[o]||[]).push(x);else nieuw.push(x)});
    Object.keys(G).forEach(code=>{while(G[code].length>cap){nieuw.push(G[code].pop())}});
    const rest=[];nieuw.forEach(x=>{const vrij=Object.entries(G).filter(([,g])=>g.length<cap).map(([code,g])=>[code,sgAfst(x.c,sgMid(g.map(y=>y.c)))]).filter(([,d])=>d<1.5).sort((a,b)=>a[1]-b[1])[0];
      if(vrij)G[vrij[0]].push(x);else rest.push(x)});
    if(rest.length){G={};sgCluster(L,cap).forEach((g,i)=>{G[pc+"-"+sgLetter(i)]=g})}
    Object.entries(G).forEach(([code,g])=>g.forEach(x=>map[x.k.id]=code))});
  return map}
const sgCodeVan=k=>{if(!k)return"";const m=(state.districten||{}).map||{};return m[k.id]||m[k.hoofdKlantId]||""};
/* het vakje links op een klantkaart: postcode + letter van het subgebied (anders de initialen) */
function sgAv(k,cls,h,fb){const c=typeof GLAS==="function"&&GLAS()?sgCodeVan(k):"";
  if(!c)return `<span class="av${cls?" "+cls:""}"${h!=null?` style="--h:${h}"`:""}>${esc(fb)}</span>`;const [pc,l]=c.split("-");
  return `<span class="av sgav${cls?" "+cls:""}" style="--h:${hue(pc)}" title="Postcode ${esc(pc)} · subgebied ${esc(l)}"><small>${esc(pc)}</small><b>${esc(l)}</b></span>`}
/* op de achtergrond bijhouden: na het laden en als er klanten bijkomen (niet vaker dan elke 20 s) */
let sgT=0;function sgAchtergrond(){if(typeof GLAS!=="function"||!GLAS()||!state.loaded)return;clearTimeout(sgT);sgT=setTimeout(()=>{try{const v=JSON.stringify(((state.districten||{}).map)||{});sgData();if(JSON.stringify(((state.districten||{}).map)||{})!==v)schedule()}catch(e){console.error("subgebieden",e)}},4000)}
if(typeof window!=="undefined")setInterval(sgAchtergrond,60000),setTimeout(function w(){if(!state.loaded)return setTimeout(w,1500);sgAchtergrond()},3000);
/* indeling bewaren als er iets veranderd is (nieuwe klanten, verhuisd), zodat de codes vast blijven */
function sgBewaar(map){if(typeof isMw==="function"&&isMw()){state.districten={...(state.districten||{}),map};return}const oud=((state.districten||{}).map)||{};const a=Object.keys(map),b=Object.keys(oud);if(((state.districten||{}).alg||0)>=SG_ALG&&a.length===b.length&&a.every(k=>oud[k]===map[k]))return;
  const dd=state.districten||{},vorige=(dd.alg||0)<SG_ALG&&dd.map&&Object.keys(dd.map).length?dd.map:(dd.vorige||null);state.districten={...dd,map,cap:sgCap(),alg:SG_ALG,...(vorige?{vorige}:{})};clearTimeout(SG.bewaarT);SG.bewaarT=setTimeout(()=>{try{save("instellingen","districten",{map,cap:sgCap(),alg:SG_ALG,...(vorige?{vorige}:{}),op:new Date().toISOString()}).catch(()=>{})}catch(e){}},1500)}
function sgData(){const map=sgToewijzen();sgBewaar(map);const G={};
  sgKlanten().forEach(k=>{const code=map[k.id],c=pkCoord(k);if(!code||!c)return;(G[code]=G[code]||{code,pc:code.split("-")[0],leden:[]}).leden.push({k,c})});
  const pcs=[...new Set(Object.values(G).map(d=>d.pc))].sort();
  const D=Object.values(G).map(d=>({...d,mid:sgMid(d.leden.map(x=>x.c)),kleur:SG_KL[pcs.indexOf(d.pc)%SG_KL.length]})).sort((a,b)=>a.code.localeCompare(b.code,"nl",{numeric:true}));
  return{D,vast:true}}
function sgStat(d){const ks=d.leden.map(x=>x.k),min=ks.reduce((a,k)=>a+(Number(duur(k))||30),0),eur=ks.reduce((a,k)=>a+(Number(k.prijs)||0),0),grens=addDays(today(),14),beurt=ks.filter(k=>{const p=planned(k);return p&&p<=grens}).length;
  const pl={};ks.forEach(k=>{const p=jobAddrObj(k).plaats||k.plaats||"";if(p)pl[p]=(pl[p]||0)+1});const plaats=Object.entries(pl).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,2).join(" / ");
  return{n:ks.length,min,eur,beurt,plaats}}
const sgHull=pts=>{const P=[...pts].sort((a,b)=>a[1]-b[1]||a[0]-b[0]);if(P.length<3)return P;const cr=(o,a,b)=>(a[1]-o[1])*(b[0]-o[0])-(a[0]-o[0])*(b[1]-o[1]);const lo=[],up=[];
  for(const p of P){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}for(const p of [...P].reverse()){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}return lo.slice(0,-1).concat(up.slice(0,-1))};
function sgOpen(){const lijst=sgKlanten(),zonder=lijst.filter(k=>!pkCoord(k)).length;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.map}</span><div style="min-width:0;flex:1"><h3>Subgebieden per postcode</h3><div class="subt">Elke postcode opgedeeld in stukken van maximaal 10 woningen die dicht bij elkaar liggen</div></div><button type="button" class="iconbtn" id="sgX" aria-label="Sluiten">${I.x}</button></div>
    <div class="ds2-bar"><label>Max. woningen per subgebied<span class="ds2-cap"><button type="button" data-dscap="-1">−</button><b id="sgCapV">${sgCap()}</b><button type="button" data-dscap="1">+</button></span></label><span id="sgInfo" class="subt"></span><span class="sp"></span><span id="sgKnop"></span></div>
    <div class="ds2-grid"><div class="ds2-map" id="sgMap"></div><div class="ds2-lijst" id="sgLijst"></div></div>
    ${zonder?`<p class="subt" id="sgGeo" style="margin:8px 0 0">${zonder} adressen worden nog op de kaart gezet…</p>`:""}`,{xwide:true});
  $("#sgX").onclick=()=>dlg.close();
  form.querySelectorAll("[data-dscap]").forEach(b=>b.onclick=()=>{SG.cap=sgCap()+Number(b.dataset.dscap);$("#sgCapV").textContent=sgCap();try{localStorage.setItem("ms.dscap",String(sgCap()))}catch(e){}sgTeken()});
  pkLaadLeaflet().then(()=>{const L=window.L;SG.map=L.map($("#sgMap"),{zoomControl:true,attributionControl:false});
    L.tileLayer("https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png",{maxZoom:19}).addTo(SG.map);SG.laag=L.layerGroup().addTo(SG.map);SG.fit=true;sgTeken();
    if(zonder&&typeof pkGeocode==="function")(async()=>{await pkGeocode(lijst);const t=setInterval(()=>{if(!PK.busy){clearInterval(t);const g=$("#sgGeo");if(g)g.remove();SG.fit=true;sgTeken()}},800)})()}).catch(()=>{$("#sgMap").innerHTML='<p class="subt" style="padding:20px">De kaart kon niet laden.</p>';sgTeken()})}
function sgTeken(){const {D,vast}=sgData(),L=window.L,tot=D.reduce((a,d)=>a+d.leden.length,0);
  const info=$("#sgInfo");if(info)info.textContent=`${plural(tot,"woning","woningen")} · ${plural(D.length,"subgebied","subgebieden")} in ${plural(new Set(D.map(d=>d.pc)).size,"postcode","postcodes")}`;
  const kn=$("#sgKnop");if(kn)kn.innerHTML=`<span class="ds2-vast">${I.check}Codes blijven vast</span><button type="button" class="small" data-dsweer="1">Opnieuw indelen</button>`;
  const lj=$("#sgLijst");if(lj)lj.innerHTML=D.length?D.map((d,i)=>{const kop=i===0||D[i-1].pc!==d.pc?`<div class="ds2-pc"><b>${esc(d.pc)}</b><span>${esc((d.leden[0]&&(jobAddrObj(d.leden[0].k).plaats||d.leden[0].k.plaats))||"")} · ${plural(D.filter(x=>x.pc===d.pc).length,"subgebied","subgebieden")}</span></div>`:"";return kop+(()=>{const s=sgStat(d);return `<button type="button" class="ds2-it${SG.sel===d.code?" sel":""}" data-dssel="${esc(d.code)}"><span class="ds2-code" style="background:${d.kleur}">${esc(d.code.split("-")[1])}</span><span class="ds2-t"><b>Subgebied ${esc(d.code.split("-")[1])}</b><small>${plural(s.n,"woning","woningen")} · ${wdU(s.min)} werk · ${eur0(s.eur)}</small></span>${s.beurt?`<span class="ds2-b" title="Binnen 14 dagen aan de beurt">${s.beurt}</span>`:""}</button>
      ${SG.sel===d.code?`<div class="ds2-kl">${d.leden.map(x=>`<span${x.nieuw?' class="nw"':""}>${esc(cleanName(x.k.naam))}<small>${esc(jobAddrObj(x.k).adres||"")}</small></span>`).join("")}</div>`:""}`})()}).join(""):`<p class="subt">Nog geen klanten met een adres op de kaart.</p>`;
  if(!SG.map||!L)return;SG.laag.clearLayers();const alle=[];
  D.forEach(d=>{const pts=d.leden.map(x=>x.c);alle.push(...pts);const on=!SG.sel||SG.sel===d.code;
    const h=sgHull(pts);if(h.length>=3)L.polygon(h,{color:d.kleur,weight:on?2.5:1,fillColor:d.kleur,fillOpacity:on?.28:.08,opacity:on?1:.4}).on("click",()=>{SG.sel=SG.sel===d.code?"":d.code;sgTeken()}).addTo(SG.laag);
    pts.forEach(c=>L.circleMarker(c,{radius:on?5:3,color:"#fff",weight:1.5,fillColor:d.kleur,fillOpacity:on?1:.5}).addTo(SG.laag));
    L.marker(sgMid(pts),{interactive:false,icon:L.divIcon({className:"ds2-lab",html:`<span style="border-color:${d.kleur}">${esc(d.code)}</span>`,iconSize:null})}).addTo(SG.laag)});
  if(SG.fit&&alle.length){SG.map.fitBounds(alle,{padding:[30,30]});SG.fit=false}
  if(SG.sel){const d=D.find(x=>x.code===SG.sel);if(d)SG.map.fitBounds(d.leden.map(x=>x.c),{padding:[60,60],maxZoom:15})}
  setTimeout(()=>{try{SG.map.invalidateSize()}catch(e){}},100)}
document.addEventListener("click",async e=>{const t=e.target.closest("[data-act='districten'],[data-dssel],[data-dsvast],[data-dsweer]");if(!t)return;
  if(t.dataset.act==="districten"){e.preventDefault();e.stopPropagation();state.pmeer=false;sgOpen();return}
  e.preventDefault();
  if(t.dataset.dssel!=null){SG.sel=SG.sel===t.dataset.dssel?"":t.dataset.dssel;if(!SG.sel)SG.fit=true;sgTeken();return}
  if(t.dataset.dsweer){if(await vraag("Opnieuw indelen?","Mansard deelt alle klanten per postcode opnieuw in op ligging. De letters van de subgebieden kunnen dan veranderen.","Opnieuw indelen")!==true)return;
    try{await save("instellingen","districten",{map:{},cap:sgCap(),op:new Date().toISOString()});state.districten={map:{}};SG.fit=true;sgTeken()}catch(er){err(er)}}},true);
/* ---------- overlay op de kaarten: postcodegebieden (stippellijn) en subgebieden (gekleurd met code) ---------- */
SG.ov=(()=>{try{return localStorage.getItem("ms.sgov")==="1"}catch(e){return false}})();
async function sgOverlay(el,m){const L=window.L;if(!el||!m||!L)return;if(el._sg){m.removeLayer(el._sg);el._sg=null}sgKnopZet(el);if(!SG.ov)return;
  const {D}=sgData(),g=L.layerGroup().addTo(m);el._sg=g;
  if(!m.getPane("sgPane")){m.createPane("sgPane").style.zIndex=380}
  D.forEach(d=>{const pts=d.leden.map(x=>x.c),h=sgHull(pts);
    if(h.length>=3)L.polygon(h,{pane:"sgPane",color:d.kleur,weight:2,fillColor:d.kleur,fillOpacity:.22,interactive:false}).addTo(g);
    else pts.forEach(c=>L.circle(c,{pane:"sgPane",radius:60,color:d.kleur,weight:2,fillOpacity:.22,interactive:false}).addTo(g));
    L.marker(sgMid(pts),{interactive:false,icon:L.divIcon({className:"ds2-lab",html:`<span style="border-color:${d.kleur}">${esc(d.code)}</span>`,iconSize:null})}).addTo(g)});
  if(typeof wgPcVlak==="function")for(const pc of [...new Set(D.map(d=>d.pc))]){try{const f=await wgPcVlak(pc);if(f&&el._sg===g)L.geoJSON(f,{pane:"sgPane",style:{color:"#14181f",weight:1.5,dashArray:"6 5",fill:false,opacity:.7},interactive:false}).addTo(g)}catch(e){}}}
function sgKnopZet(el){let b=el.querySelector(".sg-knop");if(!b){b=document.createElement("button");b.type="button";b.className="sg-knop";b.dataset.sgov="1";el.appendChild(b)}
  b.setAttribute("aria-pressed",SG.ov);b.innerHTML=`<span class="sg-dr"></span>Postcodes`;b.title=SG.ov?"Postcodes en subgebieden verbergen":"Postcodes en subgebieden op de kaart tonen"}
document.addEventListener("click",e=>{const b=e.target.closest("[data-sgov]");if(!b)return;e.preventDefault();e.stopPropagation();SG.ov=!SG.ov;try{localStorage.setItem("ms.sgov",SG.ov?"1":"0")}catch(_){}sgKaarten(true)},true);
/* knop op elke kaart met klanten (live kaart en kaartplannen) */
function sgKaarten(opnieuw){if(typeof GLAS!=="function"||!GLAS())return;
  [[document.getElementById("rvMap"),m=>m&&m._map],[typeof PK!=="undefined"&&PK.el,()=>typeof PK!=="undefined"&&PK.map]].forEach(([el,fm])=>{if(!el)return;const m=fm(el);if(!m)return;
    if(opnieuw||!el.querySelector(".sg-knop")||(SG.ov&&!el._sg))sgOverlay(el,m)})}
if(typeof window!=="undefined")setInterval(()=>{try{sgKaarten(false)}catch(e){}},2000);
