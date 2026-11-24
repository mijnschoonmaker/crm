/* ---------- KWALITEIT: elke afspraak op sterrenniveau ----------
   Zoals een driesterrenrestaurant: geen bord de zaal in zonder controle, elke gast vooraf kennen,
   stipt op tijd, een klacht dezelfde dag rechtzetten en elke dag meten of het niveau gehaald wordt.
   1 Eindcontrole bij afmelden (punten + opleverfoto + wat viel op)      → beurt.kwaliteit, klant.bezoekNotitie
   2 Herstel: lage beoordeling of afgekeurde controle → melding tot opgelost → beurt.herstel
   3 Stiptheid: aankomstvenster rond de geplande tijd, alleen intern (geen bericht naar de klant)
   4 Briefing bij Start: wat je moet weten, met "Gezien"                    → beurt.briefGezien
   5 Kwaliteitsscore: Statistieken › Kwaliteit, per week en per medewerker
   (kleine gebaren: jubileum en mijlpaal zijn op verzoek weer weggehaald) */
const KW_GLAS=["Geen strepen of druppels","Kozijnen en dorpels droog","Alles teruggezet (bloempotten, matten)","Poort en hek weer dicht"];
const KW_ALG=["Alles schoon en droog opgeleverd","Spullen weer op hun plek","Afval meegenomen","Deur en poort weer dicht"];
const KW={groep:{},gezien:{}};
const kwS=()=>(typeof S==="function"&&S())||{};
const kwPunten=()=>{const t=kwS().kwPunten;return Array.isArray(t)&&t.length?t:(typeof GLAS==="function"&&GLAS()?KW_GLAS:KW_ALG)};
const kwVenster=()=>Math.max(5,Math.min(120,Number(kwS().kwVenster)||15));
const kwDrempel=()=>Math.min(4,Math.max(1,Number(kwS().kwDrempel)||3));
const kwTest=()=>typeof LIVE!=="undefined"&&!LIVE&&/[?&]selftest\b/.test(location.search)&&!/[?&]kwtoon\b/.test(location.search);
const kwHm=x=>{const d=new Date(x);return isNaN(d)?"":String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const kwNaam=k=>cleanName((k&&k.naam)||"");

/* ---------- 3. stiptheid ---------- */
/* minuten te laat t.o.v. de geplande tijd (negatief = eerder); null zonder vaste tijd of zonder starttijd */
function kwLaat(b){const p=toMin(b&&b.tijd);if(p==null||!b.startOp)return null;const d=new Date(b.startOp);if(isNaN(d))return null;return d.getHours()*60+d.getMinutes()-p}
function kwOpTijd(b){const l=kwLaat(b);return l==null?null:l<=kwVenster()}

/* ---------- eerste bezoek als ontvangst: extra tijd, kennismaking en vóórfoto's (alleen intern, in de opdracht) ---------- */
function kwEerste(k){if(!k||k.laatst||k.prospect)return false;if(k.eersteKeer!=null)return !!k.eersteKeer;return !(kwIdx()[k.id]||[]).length}
/* extra tijd alleen als er voor deze klant een offerte is verstuurd; een direct aangemaakte opdracht krijgt geen extra tijd */
function kwOffKlanten(){const F=state.facturen||[];if(KW.offF===F&&KW.offN===F.length)return KW.off;const S_=new Set();
  F.forEach(f=>{if(f&&f.soort==="offerte"&&f.klantId&&(f.verstuurdOp||f.getekend||["verstuurd","geaccepteerd"].includes(f.status)))S_.add(f.klantId)});KW.off=S_;KW.offF=F;KW.offN=F.length;return S_}
function kwEersteMin(k){const s=kwS(),m=s.kwEersteExtra==null?15:Math.max(0,Math.min(120,Number(s.kwEersteExtra)||0));return m&&kwEerste(k)&&kwOffKlanten().has(k.hoofdKlantId||k.id)?m:0}
/* gemeten tijd van het eerste bezoek zonder de kennismaking, zodat de geleerde vaste duur klopt */
function kwMeetMin(k,m){const x=kwEersteMin(k);return x&&m>x+5?m-x:m}
/* ---------- 4. briefing bij Start ---------- */
function kwBriefRegels(k){const hl=typeof hospList==="function"?hospList(k):[],R=[];
  const cat=[["aankomst","Aankomst en toegang",I.lock],["dier","Huisdieren",I.paw||I.alert],["letop","Let op",I.alert],["voorkeur","Voorkeur",I.heart||I.note]];
  if(kwEerste(k))R.push({ic:I.user||I.klanten,l:"Eerste kennismaking",t:"Stel jezelf voor, vraag naar wensen en bijzonderheden (toegang, huisdieren, aandachtspunten) en maak vóórfoto's.",pri:1});
  (Array.isArray(k.schades)?k.schades:[]).filter(x=>x&&x.status!=="afgehandeld").slice(-2).forEach(x=>R.push({ic:I.alert,l:"Schade "+fmtD(x.datum)+(x.door?" · "+x.door:""),t:x.tekst+" (nog niet afgehandeld)",pri:1}));
  {const pt=(k.hoofdKlantId&&state.klanten.find(x=>x.id===k.hoofdKlantId)||k).portaalToegang;if(pt&&((pt.opties||[]).length||pt.tekst||pt.code))R.push({ic:I.lock,l:"Instructies van de klant",t:[...(pt.opties||[]),pt.code?"code: "+pt.code:"",pt.tekst||""].filter(Boolean).join(" · ")})}
  const n=k.bezoekNotitie;if(n&&n.t)R.push({ic:I.note,l:"Vorige keer opgevallen"+(n.door?" · "+n.door:""),t:n.t,pri:1});
  cat.forEach(([c,l,ic])=>{const x=hl.filter(y=>y.c===c);if(x.length)R.push({ic,l,t:x.map(y=>y.t).join(" · ")})});
  const praat=hl.filter(x=>x.c==="verteld"&&(typeof hospNu!=="function"||hospNu(x)));if(praat.length)R.push({ic:I.chat||I.note,l:"Ter sprake brengen",t:praat.map(x=>x.t).join(" · ")});
  if(typeof ov2Klacht==="function"&&ov2Klacht(k))R.unshift({ic:I.alert,l:"Extra aandacht",t:"Deze klant was onlangs niet tevreden. Lever vandaag extra zorgvuldig op.",pri:1});
  const lb=(state.beurten||[]).filter(b=>b.klantId===k.id&&b.beoordeling&&Number(b.beoordeling.sterren)>0).sort((a,b)=>String(b.datum).localeCompare(String(a.datum)))[0];
  if(lb&&Number(lb.beoordeling.sterren)<=kwDrempel()&&!R.some(r=>r.l==="Extra aandacht"))R.unshift({ic:I.alert,l:"Extra aandacht",t:`Gaf het vorige bezoek ${lb.beoordeling.sterren} ${Number(lb.beoordeling.sterren)===1?"ster":"sterren"}${lb.beoordeling.tekst?": “"+String(lb.beoordeling.tekst).slice(0,140)+"”":""}. Lever vandaag extra zorgvuldig op.`,pri:1});
  return R}
/* ---------- gedeelde opmaak van de beurtschermen (ontwerp "Beurt afronden – checklist") ---------- */
const KW_NUL=["Voorgevel","Achtergevel","Kozijnen en rubbers"];
const KW_ZIJDEN=["Voorzijde","Achterzijde","Linkerzijde","Rechterzijde"];
/* foto groot openen en plekken aantikken: tik = bolletje erbij, tik op bolletje = weg. De bolletjes tellen niets. */
function kwStippen(f,klaar){const d=document.createElement("dialog");d.className="kwa-dlg kwa-stdlg";document.body.appendChild(d);
  const weg=()=>{try{d.close()}catch(_){}d.remove();klaar&&klaar()};d.addEventListener("cancel",e=>{e.preventDefault();weg()});
  const teken=()=>{d.innerHTML=`<div class="kwa-stw"><div class="kwa-stk"><b>${esc(f.zijde||"Foto van de woning")}</b><small>Tik op de foto om een plek aan te geven · tik op een bolletje om het weg te halen</small><button type="button" class="primary small" data-stk>Klaar</button></div>
    <div class="kwa-stf" style="aspect-ratio:${f.w&&f.h?f.w+"/"+f.h:"4/3"};width:min(100%,calc(80vh * ${f.w&&f.h?(f.w/f.h).toFixed(4):"1.3333"}))"><img src="${f.url}" alt="" draggable="false">${f.st.map((p,j)=>`<button type="button" class="kwa-st groot" data-stj="${j}" style="left:${p.x}%;top:${p.y}%" aria-label="Bolletje weghalen"></button>`).join("")}</div></div>`;
    d.querySelector("[data-stk]").onclick=weg;
    d.querySelector(".kwa-stf").onclick=e=>{const j=e.target.closest("[data-stj]");if(j){f.st.splice(+j.dataset.stj,1);teken();return}
      const r=e.currentTarget.getBoundingClientRect();f.st.push({x:Math.round((e.clientX-r.left)/r.width*1000)/10,y:Math.round((e.clientY-r.top)/r.height*1000)/10});teken()}};
  teken();d.showModal()}
const kwNulPunten=()=>{const t=kwS().kwNulPunten;return Array.isArray(t)&&t.length?t:KW_NUL};
const KW_BIJZ=[["onbereikbaar","Niet bereikbaar"],["schade","Schade"],["extra","Extra werk mogelijk"],["herstel","Herstel na klacht"]];
function kwKop(k,kruimel,pil,regel){return `<div class="kwa-h"><div class="kwa-kr"><span>Vandaag</span> / <b>${esc(kruimel)}</b><button type="button" class="kwa-x" data-kx aria-label="Sluiten">${I.x}</button></div>
  <div class="kwa-wie"><span class="kwa-av">${esc(initials(k.naam||""))}</span><div><div class="kwa-n"><b>${esc(kwNaam(k))}</b>${pil||""}</div><small>${regel}</small></div></div></div>`}
function kwFotoUp(f){return new Promise(async res=>{try{const sz=typeof imgSize==="function"?await imgSize(f).catch(()=>({})):{},r=await state.assets.upload(f);res({id:r.id,url:URL.createObjectURL(f),w:sz.w||0,h:sz.h||0,op:new Date().toISOString()})}catch(e){toast("De foto kon niet worden geüpload");res(null)}})}
function kwDlg(){const d=document.createElement("dialog");d.className="kwa-dlg";const o=document.createElement("div");o.className="kwa";d.appendChild(o);document.body.appendChild(d);return {d,o}}

/* klantkaart: staat bij het eerste bezoek (bestaande schade en bijzonderheden), alleen intern */
function kkNulmeting(k){const L=Array.isArray(k&&k.nulmeting)?k.nulmeting.filter(x=>x&&(x.items||[]).length):[];if(!L.length)return"";
  return `<section class="kk-nul"><div class="kk-nul-h"><span class="hosp-ic">${I.camera}</span><div><b>Staat bij eerste bezoek</b><small>Vastgelegd vóór het eerste bezoek · alleen intern, niet zichtbaar voor de klant</small></div></div>
    ${L.map(r=>`<div class="kk-nul-r"><small>${esc(fmtD(r.datum))}${r.door?" · "+esc(r.door):""}</small><div class="kk-nul-g">${r.items.map(x=>`<a class="kk-nul-i" href="${BLOB}${esc(x.id)}" target="_blank" rel="noopener"><img src="${BLOB}${esc(x.id)}" alt="" loading="lazy"><span><em class="${x.soort==="bijz"?"bz":"sd"}">${x.soort==="bijz"?"Bijzonderheid":"Bestaande schade"}</em>${x.notitie?esc(x.notitie):"<i>Geen notitie</i>"}</span></a>`).join("")}</div></div>`).join("")}</section>`}
/* ---------- 4. briefing bij Start · eerste beurt: nulmeting ---------- */
function kwBriefing(k){return new Promise(res=>{try{
  if(kwTest())return res(true);
  const eerste=kwEerste(k),nul=eerste&&kwS().kwNul!==false;
  if(!nul&&kwS().kwBriefing===false)return res(true);
  const R=kwBriefRegels(k).filter(r=>r.l!=="Eerste kennismaking");if(!nul&&!R.length)return res(true);
  const F=[],S=[];let bezig=false;/* S: bestaande schade of bijzonderheden, met soort en notitie *//* nulmeting: foto's van de woning, per foto een zijde en aangetikte plekken (tellen niets) */
  const {d,o}=kwDlg();const weg=v=>{try{d.close()}catch(_){}d.remove();res(v)};d.addEventListener("cancel",e=>{e.preventDefault();weg(null)});
  const ZIJ=KW_ZIJDEN;
  const ftegel=(f,i)=>`<div class="kwa-nf"><button type="button" class="kwa-nfi" data-nfo="${i}" aria-label="Foto ${i+1} openen en plekken aantikken" style="aspect-ratio:${f.w&&f.h?f.w+"/"+f.h:"4/3"}"><img src="${f.url}" alt="">${f.st.map(p=>`<i class="kwa-st" style="left:${p.x}%;top:${p.y}%"></i>`).join("")}${f.st.length?`<em class="kwa-nfn">${f.st.length}</em>`:""}</button>
    <div class="kwa-zij" role="group" aria-label="Zijde van de woning">${ZIJ.map(z=>`<button type="button" class="${f.zijde===z?"on":""}" data-nzij="${i}" data-z="${esc(z)}">${esc(z)}</button>`).join("")}</div>
    <button type="button" class="kwa-nfx" data-nfx="${i}" aria-label="Foto verwijderen">${I.x}</button></div>`;
  const stegel=(x,i)=>`<div class="kwa-ns"><img src="${x.url}" alt="">
    <div class="kwa-nsb"><div class="kwa-zij" role="group" aria-label="Soort">${[["schade","Bestaande schade"],["bijz","Bijzonderheid"]].map(([v,l])=>`<button type="button" class="${x.soort===v?"on":""}" data-nss="${i}" data-v="${v}">${l}</button>`).join("")}</div>
      <input class="in" data-nsn="${i}" value="${esc(x.notitie)}" maxlength="160" placeholder="${x.soort==="bijz"?"Bijv. poort klemt, even optillen":"Bijv. kras in ruit keukenraam"}">
      <small>${x.soort==="bijz"?"Komt als aandachtspunt bij elk volgend bezoek.":"Wordt vastgelegd in de klantkaart als bewijs."}</small></div>
    <button type="button" class="kwa-nfx" data-nsx="${i}" aria-label="Foto verwijderen">${I.x}</button></div>`;
  const teken=()=>{const n=F.length,klaar=true;/* foto's bij de nulmeting zijn niet verplicht */
    o.innerHTML=`${kwKop(k,nul?"Eerste beurt":"Start beurt",nul?'<i class="kwa-pil goud">Nieuw</i>':"",esc([jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "))+(nul?" · Klant sinds "+(String(k.aangemaakt||"").slice(0,10)===iso(today())?"vandaag":fmtD(String(k.aangemaakt||iso(today())).slice(0,10))):k.tijd?" · "+esc(k.tijd):""))}
    <div class="kwa-b">
      ${nul?`<section class="kwa-c"><h4>Nulmeting</h4><p>Stel jezelf even voor en vraag naar wensen. Maak daarna, vóór je begint, foto's van de woning (1) en leg vast wat er al kapot was of opvalt (2). Bestaande schade die zo is vastgelegd, kan je later niet worden aangerekend.</p></section>`:""}
      ${R.length?`<section class="kwa-c"><h4>Aandachtspunten</h4>${R.map(r=>`<div class="kwa-ap${r.pri?" pri":""}"><small>${esc(r.l)}</small><span>${esc(r.t)}</span></div>`).join("")}</section>`:""}
      ${nul?`<section class="kwa-c"><h4>1 · Foto's van de woning <em class="${n?"ok":""}">${n?plural(n,"foto","foto's"):"niet verplicht"}</em></h4>
        <p class="kwa-hulp" style="margin:0 0 12px">Maak van elke zijde van de woning een foto en kies welke zijde het is. Deze foto's komen bij de opdracht: jij en je collega's zien ze bij elk volgend bezoek, zodat je meteen weet welke ramen erbij horen. Tik op een foto om plekken aan te wijzen, bijvoorbeeld een raam dat lastig te bereiken is.</p>
        <div class="kwa-nfg">${F.map(ftegel).join("")}<label class="kwa-fv kwa-nfadd${state.assets?"":" dis"}"><span>${I.camera}<em>${n?"Nog een foto":"Foto maken"}</em></span><input type="file" accept="image/*" multiple hidden data-nf="1"></label></div>
        </section>
      <section class="kwa-c"><h4>2 · Bestaande schade of bijzonderheden <em>${S.length?plural(S.length,"foto","foto's"):"alleen als het er is"}</em></h4>
        <div class="kwa-uitl"><div><b>Bestaande schade</b><span>Was al zo vóór ons eerste bezoek, zoals een kras in een ruit of een gescheurde rubber. Wordt met datum vastgelegd in de klantkaart, zodat je kunt laten zien dat het er al was als de klant er later naar vraagt.</span></div>
          <div><b>Bijzonderheid</b><span>Iets om rekening mee te houden, zoals een poort die klemt of een losse dakgoot. Je notitie verschijnt bij elk volgend bezoek als aandachtspunt bij Start.</span></div></div>
        <div class="kwa-nsl">${S.map(stegel).join("")}</div>
        <label class="kwa-nsadd${state.assets?"":" dis"}">${I.camera}<span>Foto van schade of bijzonderheid</span><input type="file" accept="image/*" multiple hidden data-ns="1"></label>
      </section>
      <p class="kwa-hulp kwa-priv">${I.lock||""}Geen van deze foto's gaat naar de klant.</p>`:""}
    </div>
    <div class="kwa-f"><button type="button" class="primary kwa-go" data-kb ${(nul&&!klaar)||bezig?"disabled":""}>${nul?"▶ Start beurt":I.check+"<span>Gezien, start</span>"}</button>
      <small>${nul&&!state.assets?"Foto's maken lukt nu niet · je kunt toch starten":nul?(n?"Klaar voor de eerste beurt":"Foto's zijn niet verplicht · je kunt direct starten"):"Daarna loopt de tijd"}</small></div>`;
    o.querySelectorAll("[data-kx]").forEach(b=>b.onclick=()=>weg(null));
    o.querySelectorAll("[data-nf]").forEach(inp=>inp.onchange=async e=>{const fs=[...(e.target.files||[])];e.target.value="";if(!fs.length||!state.assets)return;bezig=true;teken();
      for(const f of fs){const r=await kwFotoUp(f);if(r)F.push({...r,zijde:"",st:[]})}bezig=false;teken()});
    o.querySelectorAll("[data-nzij]").forEach(b=>b.onclick=()=>{const f=F[+b.dataset.nzij];f.zijde=f.zijde===b.dataset.z?"":b.dataset.z;teken()});
    o.querySelectorAll("[data-nfx]").forEach(b=>b.onclick=()=>{F.splice(+b.dataset.nfx,1);teken()});
    o.querySelectorAll("[data-nfo]").forEach(b=>b.onclick=()=>kwStippen(F[+b.dataset.nfo],teken));
    o.querySelectorAll("[data-ns]").forEach(inp=>inp.onchange=async e=>{const fs=[...(e.target.files||[])];e.target.value="";if(!fs.length||!state.assets)return;bezig=true;teken();
      for(const f of fs){const r=await kwFotoUp(f);if(r)S.push({...r,soort:"schade",notitie:""})}bezig=false;teken()});
    o.querySelectorAll("[data-nss]").forEach(b=>b.onclick=()=>{S[+b.dataset.nss].soort=b.dataset.v;teken()});
    o.querySelectorAll("[data-nsn]").forEach(x=>x.oninput=()=>{S[+x.dataset.nsn].notitie=x.value});
    o.querySelectorAll("[data-nsx]").forEach(b=>b.onclick=()=>{S.splice(+b.dataset.nsx,1);teken()});
    o.querySelector("[data-kb]").onclick=()=>{if(bezig)return;KW.gezien[k.id]=new Date().toISOString();
      const dg=iso(today()),nw=F.map((x,i)=>({id:x.id,naam:"Nulmeting: "+(x.zijde||"woning"),zijde:x.zijde||"",datum:dg,w:x.w,h:x.h,dots:[],stippen:x.st.map(p=>({x:p.x,y:p.y})),voor:true}));
      const ix=state.klanten.findIndex(x=>x.id===k.id),zet=(veld,val)=>{k[veld]=val;if(ix>=0&&state.klanten[ix]!==k)state.klanten[ix]={...state.klanten[ix],[veld]:val}};
      if(nw.length)zet("fotos",[...(k.fotos||[]),...nw]);
      /* bestaande schade en bijzonderheden: vastlegging in de klantkaart; bijzonderheden met notitie ook als aandachtspunt (hospitality · Let op) */
      if(S.length){const door=typeof doorNaam==="function"?doorNaam():"";
        zet("nulmeting",[...(Array.isArray(k.nulmeting)?k.nulmeting:[]),{datum:dg,op:new Date().toISOString(),door,items:S.map(x=>({id:x.id,w:x.w,h:x.h,soort:x.soort,notitie:String(x.notitie||"").trim()}))}]);
        const bz=S.filter(x=>x.soort==="bijz"&&String(x.notitie||"").trim());if(bz.length)zet("hosp",[...(Array.isArray(k.hosp)?k.hosp:[]),...bz.map(x=>({c:"letop",t:String(x.notitie).trim(),bron:"nulmeting",op:dg}))])}
      weg(true)}};
  teken();d.showModal()
}catch(e){console.error(e);res(true)}})}

/* ---------- 1. beurt afronden: afvinken, foto alleen als het telt ---------- */
/* geeft {beurt,klant,na} terug om mee op te slaan (na = wat er ná het afmelden nog moet gebeuren), of null bij annuleren */
function kwControle(k){return new Promise(res=>{try{
  const extra=()=>({...(KW.gezien[k.id]?{briefGezien:KW.gezien[k.id]}:{})}),nawerkUit=k.nawerk?{actief:false,gepland:"",tijd:""}:{};
  const klaar=v=>{if(v){delete KW.gezien[k.id];v.klant={...(v.klant||{}),...nawerkUit}}res(v)};
  if(kwTest()||kwS().kwAan===false||k.soort==="vve")return klaar({beurt:extra(),klant:{}});
  const g=k.bezigGroep&&KW.groep[k.bezigGroep];if(g&&Date.now()-g.t<30*60e3)return klaar({beurt:{...g.beurt,...extra()},klant:{...g.klant}});
  const punten=kwPunten(),ok=punten.map(()=>true),fotos=[],soort=new Set();let bezig=false,bijz=false,notitie="",zien=false;
  const R=kwBriefRegels(k).filter(r=>r.l!=="Eerste kennismaking"&&r.l!=="Vorige keer opgevallen");
  const {d,o}=kwDlg();const weg=v=>{try{d.close()}catch(_){}d.remove();klaar(v)};d.addEventListener("cancel",e=>{e.preventDefault();weg(null)});
  const du=typeof duur==="function"?duur(k):0;
  const teken=()=>{const n=ok.filter(Boolean).length,onb=soort.has("onbereikbaar");
    o.innerHTML=`${kwKop(k,"Beurt afronden",'<i class="kwa-pil groen">Bezig</i>',`${I.pin||""}${esc([jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "))}<br>${esc(k.dienst||HD())}${du?" · "+du+" min":""}${k.prijs?" · "+esc(typeof eur==="function"?eur(Number(k.prijs)||0):k.prijs):""}`)}
    <div class="kwa-b">
      ${R.length?`<section class="kwa-c"><h4>Aandachtspunten<button type="button" class="kwa-pen" data-kpen aria-label="Aandachtspunten aanpassen">${I.pencil}</button></h4><p>${R.map(r=>esc(r.t)).join(" · ")}</p></section>`:""}
      <section class="kwa-c"><h4>Controle <em class="${n===punten.length?"ok":"rood"}">${n} / ${punten.length}</em></h4>
        ${punten.map((t,i)=>`<label class="kwa-ck"><input type="checkbox" data-kp="${i}" ${ok[i]?"checked":""}><i>${I.check}</i><span>${esc(t)}</span></label>`).join("")}</section>
      <section class="kwa-c kwa-bz${bijz?" open":""}"><label class="kwa-ck kwa-bzk"><input type="checkbox" data-kbz ${bijz?"checked":""}><i>${I.check}</i><span><b>Bijzonderheid</b><small>${bijz?"Notitie en eventueel een foto":"Alleen dan een notitie en foto"}</small></span></label>
        ${bijz?`<h5>Wat is er</h5><div class="kwa-chips">${KW_BIJZ.map(([v,l])=>`<button type="button" class="kwa-chip${soort.has(v)?" on":""}" data-ks="${v}" aria-pressed="${soort.has(v)}">${l}</button>`).join("")}</div>
        <h5>Notitie</h5><textarea data-knot rows="3" placeholder="${soort.has("onbereikbaar")?"Bijv. achterpoort op slot, achterzijde niet gewassen":"Wat moet kantoor weten?"}">${esc(notitie)}</textarea>
        <h5>Foto</h5><div class="kwa-fr">${fotos.map((f,i)=>`<span class="kwa-th"><img src="${f.url}" alt=""><button type="button" data-kdel="${i}" aria-label="Verwijderen">${I.x}</button></span>`).join("")}<label class="kwa-fv kwa-fs${state.assets?"":" dis"}"><span>${I.camera}<em>Foto</em></span><input type="file" accept="image/*" capture="environment" hidden data-kfoto></label><label class="kwa-fv kwa-fs${state.assets?"":" dis"}"><span>${I.plus}<em>Uit foto's</em></span><input type="file" accept="image/*" multiple hidden data-kfoto></label></div>
        <label class="kwa-ck kwa-zien"><input type="checkbox" data-kzien ${zien?"checked":""}><i>${I.check}</i><span><b>Klant laten zien</b><small>De klant ziet notitie en foto bij dit bezoek in het klantportaal</small></span></label>`:""}
      </section>
      ${bijz&&onb?`<p class="kwa-plan">↻ ${esc(notitie.trim()?notitie.trim().slice(0,60):"Het niet gedane deel")} komt bij te plannen</p>`:""}
    </div>
    <div class="kwa-f"><button type="button" class="primary kwa-go" data-kok ${bezig?"disabled":""}>${I.check}<span>Klaar en afmelden</span></button><small>${bijz&&zien?"Notitie en foto verschijnen in het klantportaal":"Concept­factuur zoals altijd"}</small></div>`;
    o.querySelectorAll("[data-kx]").forEach(b=>b.onclick=()=>weg(null));
    o.querySelectorAll("[data-kp]").forEach(c=>c.onchange=()=>{ok[+c.dataset.kp]=c.checked;teken()});
    const bz=o.querySelector("[data-kbz]");bz.onchange=()=>{bijz=bz.checked;teken()};
    const pen=o.querySelector("[data-kpen]");if(pen)pen.onclick=()=>{weg(null);setTimeout(()=>typeof openKlant==="function"&&openKlant(k.id),80)};
    o.querySelectorAll("[data-ks]").forEach(b=>b.onclick=()=>{const v=b.dataset.ks;soort.has(v)?soort.delete(v):soort.add(v);const t=o.querySelector("[data-knot]");if(t)notitie=t.value;teken()});
    const t=o.querySelector("[data-knot]");if(t)t.oninput=e=>{notitie=e.target.value;const p=o.querySelector(".kwa-plan");if(p)p.textContent="↻ "+(notitie.trim()?notitie.trim().slice(0,60):"Het niet gedane deel")+" komt bij te plannen"};
    const zz=o.querySelector("[data-kzien]");if(zz)zz.onchange=()=>{zien=zz.checked;teken()};
    o.querySelectorAll("[data-kfoto]").forEach(inp=>inp.onchange=async e=>{const fs=[...(e.target.files||[])];e.target.value="";if(!fs.length||!state.assets)return;bezig=true;teken();for(const f of fs){const r=await kwFotoUp(f);if(r)fotos.push(r)}bezig=false;teken()});
    o.querySelectorAll("[data-kdel]").forEach(b=>b.onclick=()=>{fotos.splice(Number(b.dataset.kdel),1);teken()});
    o.querySelector("[data-kok]").onclick=async()=>{if(bezig)return;
      const nee=punten.filter((_,i)=>!ok[i]),tx=notitie.trim().slice(0,400);
      if(nee.length){const a=await vraag("Niet alles in orde?",`Niet afgevinkt: <b>${nee.map(esc).join(", ")}</b>.<br>Kantoor krijgt een melding om het recht te zetten.`,"Ja, melden","Terug");if(a!==true)return}
      if(bijz&&!soort.size&&!tx&&!fotos.length){toast("Kies wat er is of schrijf een notitie");return}
      if(bijz&&soort.has("onbereikbaar")&&!tx){toast("Schrijf kort wat er niet gedaan is");const x=o.querySelector("[data-knot]");if(x)x.focus();return}
      if(bijz&&soort.has("schade")&&!tx){toast("Beschrijf kort wat er beschadigd is");const x=o.querySelector("[data-knot]");if(x)x.focus();return}
      const nu=new Date().toISOString(),door=typeof doorNaam==="function"?doorNaam():"",fx=fotos.map(f=>({id:f.id,op:f.op}));
      const uit={beurt:{kwaliteit:{punten:punten.map((p,i)=>({naam:p,ok:ok[i]})),fotos:[],op:nu}},klant:{bezoekNotitie:bijz&&tx?{t:tx,datum:iso(today()),door}:""},na:null};
      if(bijz){uit.beurt.bijzonderheid={soort:[...soort],notitie:tx,fotos:fx,klantZien:zien,op:nu,door};if(tx)uit.beurt.bezoekNotitie=tx}
      if(bijz&&soort.has("schade")){const sd={id:newId("sd"),datum:iso(today()),op:nu,door,tekst:tx,fotos:fx,status:"open"};uit.beurt.schade=sd;uit.klant.schades=[...(Array.isArray(k.schades)?k.schades:[]),sd]}
      if(bijz&&(soort.has("onbereikbaar")||soort.has("herstel")))uit.na=()=>kwNaAfmelden(k,{onbereikbaar:soort.has("onbereikbaar"),herstel:soort.has("herstel"),tekst:tx,fotos:fx});
      if(k.bezigGroep){const {schade:_s,bijzonderheid:_b,...bg}=uit.beurt,{schades:_ss,...kg}=uit.klant;KW.groep[k.bezigGroep]={beurt:bg,klant:kg,t:Date.now()}}
      weg({beurt:{...uit.beurt,...extra()},klant:uit.klant,na:uit.na})}};
  teken();d.showModal()
}catch(e){console.error(e);res({beurt:{},klant:{}})}})}

/* na het afmelden: niet bereikbaar → nawerk bij Te plannen (eenmalig, zonder factuur); herstel na klacht → open herstel op opgelost */
async function kwNaAfmelden(k,o){try{const h=state.klanten.find(x=>x.id===(k.hoofdKlantId||k.id))||k,nu=iso(today());
  if(o.onbereikbaar){const basis={};(typeof OPDR_VELDEN!=="undefined"?OPDR_VELDEN:["naam","adres","postcode","plaats","email","telefoon","mobiel","soort","klantnr","lat","lng","geo","ronde"]).forEach(f=>{if(k[f]!==undefined)basis[f]=k[f]});
    await save("klanten",newId("k"),{...basis,dienst:"Nawerk: "+(o.tekst||"niet gedaan deel").slice(0,70),prijs:0,duur:15,frequentie:52,hoofdKlantId:h.id,actief:true,prospect:false,nawerk:true,nietFactureren:true,taak:o.tekst||"",fotos:(o.fotos||[]).map((f,i)=>({id:f.id,naam:"Niet bereikbaar"+(i?" "+(i+1):""),datum:nu,dots:[]})),
      autoplan:true,gepland:"",tijd:"",aanbieden:true,aanbodVanaf:nu,aangemaakt:nu,eersteKeer:false,objecten:[],opdrachten:[],log:[{datum:nu,tekst:"Nawerk: bij het bezoek van "+fmtD(nu)+" niet bereikbaar. "+(o.tekst||"")}]});
    toast("Nawerk staat bij Te plannen")}
  if(o.herstel){for(const b of kwHerstelLijst().filter(b=>b.klantId===k.id||b.klantId===h.id)){const cur=state.beurten.find(x=>x.id===b.id)||b;await save("beurten",b.id,{...strip(cur),herstel:{...(cur.herstel||{}),status:"opgelost",opgelostOp:new Date().toISOString(),nawerk:true,door:doorNaam()}})}}
}catch(e){console.error("na afmelden",e);toast("Nawerk kon niet worden klaargezet")}}

/* ---------- 2. herstel ---------- */
const kwAfgekeurd=b=>!!(b&&b.kwaliteit&&(b.kwaliteit.punten||[]).some(p=>p&&p.ok===false));
const kwLaag=b=>{const s=b&&b.beoordeling&&Number(b.beoordeling.sterren);return s>0&&s<=kwDrempel()};
function kwHerstelLijst(){const g=iso(addDays(today(),-60));
  return (state.beurten||[]).filter(b=>b.datum>=g&&!b.geannuleerd&&(kwLaag(b)||kwAfgekeurd(b))&&!(b.herstel&&b.herstel.status==="opgelost"))}
function kwSignalen(add,bel){if(isMw())return;const nu=new Date(),ti=iso(today());
  kwHerstelLijst().forEach(b=>{const k=state.klanten.find(x=>x.id===b.klantId)||{naam:b.klantNaam},h=b.herstel||{},laag=kwLaag(b),gb=h.status==="gebeld";
    const wat=laag?`gaf ${b.beoordeling.sterren} ${Number(b.beoordeling.sterren)===1?"ster":"sterren"}`:"eindcontrole niet in orde";
    const tx=laag&&b.beoordeling.tekst?` “${String(b.beoordeling.tekst).slice(0,120)}”`:!laag?" Niet in orde: "+(b.kwaliteit.punten||[]).filter(p=>!p.ok).map(p=>p.naam.toLowerCase()).join(", ")+".":"";
    const uur=Math.max(0,Math.round((nu-new Date(String((b.beoordeling&&b.beoordeling.op)||b.op||b.datum+"T12:00")))/36e5));
    add({key:"kwh:"+b.id+":"+(h.status||"open"),p:gb?"hoog":laag?"kritiek":"hoog",top:1,ic:"alert",t:gb?`Herstel loopt: ${cleanName(k.naam||"")}`:`Herstel: ${cleanName(k.naam||"")} ${wat}`,
      u:(gb?`Gebeld ${fmtD(String(h.gebeldOp).slice(0,10))}. Plan zo nodig kosteloos nawerk en zet het daarna op opgelost.`:`Bezoek van ${fmtD(b.datum)}${b.door?" door "+b.door:""}.${tx} Bel ${uur<24?"vandaag nog":"zo snel mogelijk"} en zet het recht.`),
      b:[k.adres,k.plaats].filter(Boolean).join(", "),leeftijd:Math.round(uur/24),knop:"Open klant",go:k.id?"klant:"+k.id:"",
      acts:gb?[{l:"Nawerk plannen",ic:"planning",cc:"klant:"+k.id},{l:"Opgelost",ic:"check",cc:"kw:opgelost:"+b.id}]:[bel(k),{l:"Gebeld",ic:"check",cc:"kw:gebeld:"+b.id},{l:"Opgelost",ic:"check",cc:"kw:opgelost:"+b.id}].filter(Boolean)})});
  /* schade: blijft staan tot het met de klant is afgehandeld */
  state.klanten.forEach(k=>(Array.isArray(k.schades)?k.schades:[]).filter(x=>x&&x.status!=="afgehandeld").forEach(x=>{const dd=Math.max(0,Math.round((today()-parse(x.datum))/864e5));
    add({key:"kws:"+x.id+":"+(x.status||"open"),p:x.status==="gebeld"?"hoog":"kritiek",top:2,ic:"alert",t:(x.status==="gebeld"?"Schade in behandeling: ":"Schade gemeld: ")+cleanName(k.naam||""),
      u:`${x.tekst}${x.door?" · gemeld door "+x.door:""} op ${fmtD(x.datum)}${(x.fotos||[]).length?" · "+plural(x.fotos.length,"foto","foto's"):""}. ${x.status==="gebeld"?"Rond af als het met de klant geregeld is.":"Bel de klant voordat hij het zelf ontdekt."}`,
      b:[k.adres,k.plaats].filter(Boolean).join(", "),leeftijd:dd,knop:"Open klant",go:"klant:"+k.id,
      acts:x.status==="gebeld"?[{l:"Afgehandeld",ic:"check",cc:"kw:schade:"+k.id+":"+x.id+":afgehandeld"}]:[bel(k),{l:"Gebeld",ic:"check",cc:"kw:schade:"+k.id+":"+x.id+":gebeld"}].filter(Boolean)})}));
  /* bijzonderheid "extra werk mogelijk": een kans, tot je hem afhandelt */
  (state.beurten||[]).filter(b=>b.bijzonderheid&&(b.bijzonderheid.soort||[]).includes("extra")&&!b.bijzonderheid.extraGezien&&b.datum>=iso(addDays(today(),-60))).forEach(b=>{const k=state.klanten.find(x=>x.id===b.klantId)||{naam:b.klantNaam};
    add({key:"kwx:"+b.id,p:"normaal",ic:"spark",t:"Extra werk mogelijk: "+cleanName(k.naam||""),u:(b.bijzonderheid.notitie||"Zie de foto bij het bezoek")+" · gezien door "+(b.bijzonderheid.door||b.door||"")+" op "+fmtD(b.datum)+".",b:[k.adres,k.plaats].filter(Boolean).join(", "),leeftijd:Math.round((today()-parse(b.datum))/864e5),knop:"Open klant",go:k.id?"klant:"+k.id:"",acts:[bel(k),{l:"Afgehandeld",ic:"check",cc:"kw:extra:"+b.id}].filter(Boolean)})});
  /* vertrekcontrole van de bus: wat ontbrak bij vertrek */
  {const w=((state.routes||{})[ti]||{}).werk,v=w&&w.vertrek;if(v&&(v.punten||[]).some(p=>!p.ok))add({key:"kwb:"+ti,p:"normaal",ic:"truck",t:"Bus niet compleet bij vertrek"+(w.door?" · "+w.door:""),u:"Ontbrak: "+(v.punten||[]).filter(p=>!p.ok).map(p=>p.naam.toLowerCase()).join(", ")+".",b:"",leeftijd:0,knop:"",go:"",acts:[]})}
  /* 3. stiptheid: nog niet gestart terwijl het aankomstvenster bijna of al voorbij is (alleen voor jou, de klant krijgt niets) */
  if(kwS().kwStipt===false||typeof routeStops!=="function")return;const nm=nu.getHours()*60+nu.getMinutes(),v=kwVenster();
  routeStops(ti).filter(x=>!x.done&&!x.k.bezig).forEach(({k})=>{const m=toMin(k.tijd);if(m==null||nm<m+v-10)return;const te=nm>m+v,eind=fromMin(m+v);
    add({key:"kwl:"+k.id+":"+ti,p:te?"kritiek":"hoog",ic:"clock",t:te?`Te laat: ${cleanName(k.naam)} (${k.tijd})`:`Dreigt te laat: ${cleanName(k.naam)} (${k.tijd})`,
      u:te?`Het aankomstvenster liep tot ${eind}. Bel de klant zelf even; er gaat geen automatisch bericht.`:`Nog niet gestart. Het aankomstvenster loopt tot ${eind}.`,
      b:[jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "),leeftijd:0,knop:"Open klant",go:"klant:"+k.id,acts:[bel(k)].filter(Boolean)})})}
async function kwActie(v){const P=String(v||"").split(":"),[w,id]=P;
  if(w==="extra"){const b=(state.beurten||[]).find(x=>x.id===id);if(!b)return;try{await save("beurten",b.id,{...strip(b),bijzonderheid:{...(b.bijzonderheid||{}),extraGezien:new Date().toISOString()}});render()}catch(e){err(e)}return}
  if(w==="beoord")return kwBeoordelingen(Number(id)||30);
  if(w==="week"){if(id==="open"){state.itab="kwaliteit";go("inzichten");return}
    try{await saveSettings({kwWeekGezien:kwWeekRange().key},"Weekoverzicht gezien");render()}catch(e){err(e)}return}
  if(w==="schade"){const k=state.klanten.find(x=>x.id===P[1]);if(!k)return;const st=P[3]==="afgehandeld"?"afgehandeld":"gebeld";
    try{await save("klanten",k.id,{...strip(k),schades:(k.schades||[]).map(x=>x.id===P[2]?{...x,status:st,[st+"Op"]:new Date().toISOString()}:x)});toast(st==="gebeld"?"Genoteerd: klant gebeld":"Schade afgehandeld");render()}catch(e){err(e)}return}
  const b=(state.beurten||[]).find(x=>x.id===id);if(!b)return;const h=b.herstel||{},nu=new Date().toISOString();
  try{if(w==="gebeld"){await save("beurten",b.id,{...strip(b),herstel:{...h,status:"gebeld",gebeldOp:nu,door:doorNaam()}});toast("Genoteerd: klant gebeld");render();return}
    if(w==="opgelost"){const a=await vraag("Herstel afronden","Was er nawerk nodig om het recht te zetten? Dat telt mee in je kwaliteitsscore.","Ja, nawerk gedaan","Nee, opgelost zonder nawerk");if(a===null||a===undefined)return;
      await save("beurten",b.id,{...strip(b),herstel:{...h,status:"opgelost",opgelostOp:nu,nawerk:a===true,door:doorNaam()}});toast("Herstel afgerond");render()}}catch(e){err(e)}}

/* ---------- 5. kwaliteitsscore (Statistieken › Kwaliteit) ---------- */
function kwCijfers(L){const n=L.length,tijd=L.map(kwOpTijd).filter(x=>x!=null),st=L.filter(b=>b.beoordeling&&Number(b.beoordeling.sterren)>0),ctl=L.filter(b=>b.kwaliteit);
  return {n,opTijd:tijd.length?Math.round(tijd.filter(Boolean).length/tijd.length*100):null,tijdN:tijd.length,tijdOk:tijd.filter(Boolean).length,
    sterren:st.length?Math.round(st.reduce((a,b)=>a+Number(b.beoordeling.sterren),0)/st.length*10)/10:null,sterN:st.length,
    klacht:n?Math.round(L.filter(b=>kwLaag(b)||kwAfgekeurd(b)).length/n*1000)/10:null,klachtN:L.filter(b=>kwLaag(b)||kwAfgekeurd(b)).length,
    nawerk:L.filter(b=>b.herstel&&b.herstel.nawerk).length,
    controle:ctl.length?Math.round(ctl.filter(b=>!kwAfgekeurd(b)).length/ctl.length*100):null,ctlN:ctl.length,
    brief:L.filter(b=>b.briefGezien).length}}
/* klik op de tegel Beoordeling: wie er in deze periode beoordeeld heeft */
function kwSterLijst(P){const L=(state.beurten||[]).filter(b=>!b.geannuleerd&&inRange(b.datum,P.rg)&&b.beoordeling&&Number(b.beoordeling.sterren)>0)
    .sort((a,b)=>String((b.beoordeling.op||b.datum)).localeCompare(String(a.beoordeling.op||a.datum)));
  const gem=L.length?Math.round(L.reduce((a,b)=>a+Number(b.beoordeling.sterren),0)/L.length*10)/10:0,kom=x=>String(x).replace(".",",");
  const st=n=>`<span class="kws-st" aria-label="${n} van 5 sterren">${[1,2,3,4,5].map(i=>`<i class="${i<=n?"on":""}">★</i>`).join("")}</span>`;
  const {d,o}=kwDlg();const weg=()=>{try{d.close()}catch(_){}d.remove()};d.addEventListener("cancel",e=>{e.preventDefault();weg()});
  o.innerHTML=`<div class="kwa-h"><div class="kwa-kr"><span>Statistieken</span> / <b>Beoordelingen</b><button type="button" class="kwa-x" data-kx aria-label="Sluiten">${I.x}</button></div>
    <div class="kws-top"><b>${kom(gem)}<small> / 5</small></b><div><span>${esc(P.lbl)}</span><small>${plural(L.length,"beoordeling","beoordelingen")}</small></div></div></div>
    <div class="kwa-b"><section class="kwa-c kws-l">${L.map(b=>{const k=state.klanten.find(x=>x.id===b.klantId),n=Number(b.beoordeling.sterren)||0,t=String(b.beoordeling.tekst||"").trim();
      return `<button type="button" class="kws-r${n<=3?" laag":""}" data-kwk="${esc(b.klantId||"")}"><div class="kws-w"><b>${esc(cleanName((k&&k.naam)||b.klantNaam||"Klant"))}</b><small>${esc(fmtD(b.datum))}${b.door?" · "+esc(b.door):""}</small></div>${st(n)}${t?`<p>“${esc(t)}”</p>`:""}</button>`}).join("")||'<p class="st-leeg">Nog geen beoordelingen in deze periode.</p>'}</section></div>`;
  o.querySelector("[data-kx]").onclick=weg;
  o.querySelectorAll("[data-kwk]").forEach(b=>b.onclick=()=>{const id=b.dataset.kwk;if(!id||!state.klanten.some(x=>x.id===id))return;weg();openKlantView(id)});
  d.showModal()}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-kwster]");if(!t)return;const P=window.__kwP;if(P)kwSterLijst(P)});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target.closest&&e.target.closest("[data-kwster]");if(!t)return;e.preventDefault();const P=window.__kwP;if(P)kwSterLijst(P)});
function vKwaliteit(P,V){window.__kwP=P;const t=today(),inP=rg=>(state.beurten||[]).filter(b=>!b.geannuleerd&&inRange(b.datum,rg));
  const A=kwCijfers(inP(P.rg)),B=kwCijfers(inP(V.rg)),pct=x=>x==null?"—":x+"%",kom=x=>String(x).replace(".",",");
  /* verschil met de vorige periode: klein, onder het getal */
  /* naam van de vorige periode: "oktober", "Q3", "2025"; jaartal erbij als dat anders is dan nu (bijv. "december 2025" in januari) */
  const vNaam=(()=>{const pv=String(V.lbl||"").split(" "),py=String(P.lbl||"").split(" ").pop();if(pv.length<2)return pv[0]||"de vorige periode";const n=/^Q/.test(pv[0])?pv[0]:pv[0].toLowerCase();return pv[1]!==py?n+" "+pv[1]:n})();
  const ver=(a,b,hoog=true,suf="",telling=false)=>{if(a==null||b==null||a===b)return"";const d=Math.round((a-b)*10)/10,goed=(d>0)===hoog;
    const w=telling?(d>0?"meer":"minder"):goed?"beter":"lager";return `<em class="kwq-d ${goed?"op":"af"}">${d>0?"▲":"▼"} ${kom(Math.abs(d))}${suf} ${w} dan ${esc(vNaam)}</em>`};
  const tegel=(ic,l,v,sub,d,attr="")=>`<div class="st-tile kwq-tile"${attr}><span class="st-ic">${ic}</span><span class="st-l">${l}</span><b>${v}</b><small>${sub}</small>${d||""}</div>`;
  const tiles=`<div class="st-tiles kwq-tiles">
    ${tegel(I.clock,"Op tijd",pct(A.opTijd),A.tijdN?A.tijdOk+" van "+plural(A.tijdN,"bezoek","bezoeken")+" binnen het geplande tijdstip":"nog geen bezoeken met een gepland tijdstip",ver(A.opTijd,B.opTijd,true,"%"))}
    ${tegel(I.ster||I.spark,"Beoordeling",A.sterren==null?"—":kom(A.sterren)+"<span class=\"kwq-v\"> / 5</span>",A.sterN?plural(A.sterN,"beoordeling","beoordelingen")+" · bekijken":"nog geen beoordelingen",ver(A.sterren,B.sterren),A.sterN?` role="button" tabindex="0" data-kwster="${esc(P.lbl)}" title="Bekijk wie er beoordeeld heeft" style="cursor:pointer"`:"")}
    ${tegel(I.check,"Eindcontrole",pct(A.controle),A.ctlN?A.ctlN+" van "+A.n+" gecontroleerd":"start vanaf het volgende bezoek","")}
    ${tegel(I.alert,"Klachten",A.klacht==null?"—":kom(A.klacht)+"<span class=\"kwq-v\"> per 100</span>",A.klachtN?plural(A.klachtN,"keer","keer")+" niet tevreden"+(A.nawerk?" · "+A.nawerk+"× nawerk":""):"niets gemeld",ver(A.klacht,B.klacht,false,"",true))}</div>`;
  /* per week: % op tijd, laatste 12 weken */
  const ma=d=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x},w0=ma(t);
  const wk=[...Array(12)].map((_,i)=>{const s=addDays(w0,(i-11)*7),c=kwCijfers(inP([s,addDays(s,6)]));return{l:String(weekNr(s)),c}});
  const eerste=wk.findIndex(w=>w.c.opTijd!=null),toon=eerste<0?[]:wk.slice(eerste);
  const week=`<section class="st-card"><div class="st-ch"><div><h3>Op tijd per week</h3><p>Gestart binnen ${kwVenster()} minuten na de geplande tijd</p></div></div>
    ${toon.length?stBars(toon.map(w=>w.c.opTijd||0),toon.map(w=>"wk "+w.l),{hi:toon.length-1,fmt:v=>Math.round(v)+"%",h:170,gem:false}):'<p class="st-leeg">Zodra er bezoeken met een gepland tijdstip zijn afgemeld, zie je hier per week hoe stipt je was.</p>'}</section>`;
  /* per medewerker */
  const per={};inP(P.rg).forEach(b=>{const w=String(b.door||"Onbekend");(per[w]=per[w]||[]).push(b)});
  const rijen=Object.entries(per).map(([w,L])=>[w,kwCijfers(L)]).sort((a,b)=>b[1].n-a[1].n);
  const mw=`<section class="st-card kwq-card"><div class="st-ch"><div><h3>Per medewerker</h3><p>${esc(P.lbl)}</p></div></div>
    ${rijen.length?`<div class="kwq-t"><div class="kwq-r kwq-h"><span>Medewerker</span><span>Bezoeken</span><span>Op tijd</span><span>Sterren</span><span>Controle</span><span>Klachten</span></div>
      ${rijen.map(([w,c])=>`<div class="kwq-r"><b>${esc(w)}</b><span data-l="Bezoeken">${c.n}</span><span data-l="Op tijd">${pct(c.opTijd)}</span><span data-l="Sterren">${c.sterren==null?"—":kom(c.sterren)}</span><span data-l="Controle">${pct(c.controle)}</span><span data-l="Klachten" class="${c.klachtN?"kwq-rood":""}">${c.klachtN}</span></div>`).join("")}</div>`
      :'<p class="st-leeg">Nog geen afgemelde bezoeken in deze periode.</p>'}</section>`;
  const open=kwHerstelLijst();
  const herstel=`<section class="st-card kwq-card"><div class="st-ch"><div><h3>Herstel</h3><p>Lage beoordelingen en eindcontroles die niet in orde waren</p></div></div>
    ${open.length?`<div class="kwq-t">${open.map(b=>`<div class="kwq-r kwq-h2" data-act="klant" data-id="${esc(b.klantId)}" role="button"><b>${esc(cleanName(b.klantNaam||""))}</b><span>${esc(fmtD(b.datum))}</span><span>${kwLaag(b)?b.beoordeling.sterren+" ★":"controle"}</span><span>${(b.herstel||{}).status==="gebeld"?"gebeld":"open"}</span></div>`).join("")}</div>`
      :`<div class="kwq-ok"><span>${I.check}</span><div><b>Niets open</b><small>Alles is rechtgezet.</small></div></div>`}</section>`;
  return `<div class="kwq">${tiles}${week}<div class="st-two kwq-two">${mw}${herstel}</div></div>`}

/* ---------- 6. kleine gebaren ---------- */
const KW_MIJL=[10,25,50,100,150,200];
/* klant sinds: de vroegste van aanmaakdatum en eerste bezoek (bij overgezette klanten is de aanmaakdatum de importdatum) */
function kwIdx(){const B=state.beurten||[];if(KW.idxB===B&&KW.idxN===B.length)return KW.idx;const m={};B.forEach(b=>{if(b&&b.klantId&&b.datum&&!b.geannuleerd)(m[b.klantId]=m[b.klantId]||[]).push(b)});
  Object.values(m).forEach(L=>L.sort((a,b)=>String(a.datum).localeCompare(String(b.datum))));KW.idx=m;KW.idxB=B;KW.idxN=B.length;return m}
function kwSinds(k){let d=String(k.aangemaakt||"").slice(0,10);const L=kwIdx()[k.id];if(L&&L.length&&(!d||L[0].datum<d))d=L[0].datum;return d}
function kwMijlpaal(k,dagen=3){const g=iso(addDays(today(),-dagen)),L=kwIdx()[k.id]||[];
  for(const n of KW_MIJL){const b=L[n-1];if(b&&b.datum>=g)return {n,b}}return null}

/* ---------- wie heeft beoordeeld (klik op Beoordeling in het Overzicht) ---------- */
function kwBeoordelingen(dagen){const van=dagen>0?iso(addDays(today(),-dagen)):"0000",L=(state.beurten||[]).filter(b=>b.datum>=van&&b.beoordeling&&Number(b.beoordeling.sterren)>0).sort((a,b)=>String(b.datum).localeCompare(String(a.datum))||String((b.beoordeling||{}).op||"").localeCompare(String((a.beoordeling||{}).op||"")));
  const gem=L.length?Math.round(L.reduce((a,b)=>a+Number(b.beoordeling.sterren),0)/L.length*10)/10:null,verd=[5,4,3,2,1].map(n=>[n,L.filter(b=>Number(b.beoordeling.sterren)===n).length]);
  const ster=n=>`<span class="kwr-s" aria-label="${n} van 5 sterren">${"★".repeat(n)}<i>${"★".repeat(5-n)}</i></span>`;
  const knop=(d,l)=>`<button type="button" class="kwr-p${d===dagen?" on":""}" data-cc="kw:beoord:${d}">${l}</button>`;
  openDlg(`<div class="cc"><div class="dlg-head"><span class="objic big">${I.ster||I.spark}</span><div style="flex:1;min-width:0"><h3>Beoordelingen</h3><div class="subt">${L.length?plural(L.length,"beoordeling","beoordelingen")+" · gemiddeld "+String(gem).replace(".",",")+" / 5":"Nog geen beoordelingen in deze periode"}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="kwr-f">${knop(30,"30 dagen")}${knop(90,"90 dagen")}${knop(0,"Alles")}</div>
    ${L.length?`<div class="kwr-v">${verd.map(([n,c])=>`<div><span>${n} ★</span><i><b style="width:${L.length?Math.round(c/L.length*100):0}%"></b></i><em>${c}</em></div>`).join("")}</div>
    <div class="kwr-l">${L.map(b=>{const k=state.klanten.find(x=>x.id===b.klantId)||{},n=Number(b.beoordeling.sterren),t=String(b.beoordeling.tekst||"").trim();
      return `<div class="kwr-r${n<=kwDrempel()?" laag":""}" role="button" tabindex="0" data-cc="klant:${esc(b.klantId||"")}"><span class="kwr-d">${esc(fmtD(b.datum))}</span><span class="kwr-m"><b>${esc(cleanName(k.naam||b.klantNaam||"Klant"))}</b><small>${esc([k.adres||"",k.plaats||""].filter(Boolean).join(", "))}${b.door?" · "+esc(b.door):""}</small>${t?`<q>${esc(t)}</q>`:""}</span>${ster(n)}</div>`}).join("")}</div>`:`<p class="st-leeg">Zodra klanten een bezoek beoordelen in het klantportaal, zie je hier wie en hoeveel sterren.</p>`}</div>`,{wide:true})}

/* ---------- weekoverzicht kwaliteit: elke zaterdag in het Overzicht, tot je op Gezien tikt ----------
   Zoals de wekelijkse briefing in een sterrenkeuken: deze week tegen vorige week, per medewerker, en een waarschuwing
   als iets twee weken achter elkaar slechter wordt. */
function kwWeekRange(){const t=today(),za=addDays(t,-((t.getDay()+1)%7));/* laatste zaterdag (vandaag als het zaterdag is) */return {za,key:iso(za),rg:w=>[addDays(za,-6-7*w),addDays(za,-7*w)]}}
function kwWeekCijfers(rg){const L=(state.beurten||[]).filter(b=>!b.geannuleerd&&inRange(b.datum,rg)),c=kwCijfers(L);
  c.schade=state.klanten.reduce((a,k)=>a+(Array.isArray(k.schades)?k.schades.filter(x=>x&&inRange(x.datum,rg)).length:0),0);c.L=L;return c}
function kwWeekKaart(){if(isMw()||kwS().kwWeek===false)return"";const W=kwWeekRange();if(kwS().kwWeekGezien===W.key)return"";
  if((today()-W.za)/864e5>6)return"";
  const A=kwWeekCijfers(W.rg(0)),B=kwWeekCijfers(W.rg(1)),C=kwWeekCijfers(W.rg(2));if(!A.n&&!B.n)return"";
  const kom=x=>String(x).replace(".",","),pct=x=>x==null?"—":x+"%";
  const ver=(a,b,hoog=true,suf="")=>{if(a==null||b==null||a===b)return`<em class="kww-d">= vorige week</em>`;const d=Math.round((a-b)*10)/10,goed=(d>0)===hoog;return`<em class="kww-d ${goed?"op":"af"}">${d>0?"▲":"▼"} ${kom(Math.abs(d))}${suf}</em>`};
  /* twee weken achter elkaar slechter */
  const zakt=(a,b,c,hoog=true)=>a!=null&&b!=null&&c!=null&&(hoog?(a<b&&b<c):(a>b&&b>c));
  const waarsch=[];
  if(zakt(A.opTijd,B.opTijd,C.opTijd))waarsch.push(`Op tijd zakt al twee weken: ${pct(C.opTijd)} → ${pct(B.opTijd)} → ${pct(A.opTijd)}`);
  if(zakt(A.sterren,B.sterren,C.sterren))waarsch.push(`Beoordeling zakt al twee weken: ${kom(C.sterren)} → ${kom(B.sterren)} → ${kom(A.sterren)}`);
  if(zakt(A.controle,B.controle,C.controle))waarsch.push(`Eindcontrole in orde zakt al twee weken: ${pct(C.controle)} → ${pct(B.controle)} → ${pct(A.controle)}`);
  if(zakt(A.klacht,B.klacht,C.klacht,false))waarsch.push(`Klachten stijgen al twee weken: ${kom(C.klacht)} → ${kom(B.klacht)} → ${kom(A.klacht)} per 100`);
  const per=w=>{const m={};w.L.forEach(b=>{const n=String(b.door||"Onbekend");(m[n]=m[n]||[]).push(b)});return m};
  const pA=per(A),pB=per(B),pC=per(C),namen=Object.keys(pA).sort((a,b)=>pA[b].length-pA[a].length);
  const rij=namen.map(n=>{const a=kwCijfers(pA[n]),b=kwCijfers(pB[n]||[]),c=kwCijfers(pC[n]||[]);
    if(zakt(a.opTijd,b.opTijd,c.opTijd))waarsch.push(`${n}: op tijd zakt al twee weken (${pct(a.opTijd)})`);
    if(zakt(a.sterren,b.sterren,c.sterren))waarsch.push(`${n}: beoordeling zakt al twee weken (${kom(a.sterren)})`);
    return `<div class="kwq-r"><b>${esc(n)}</b><span data-l="Bezoeken">${a.n}</span><span data-l="Op tijd">${pct(a.opTijd)}</span><span data-l="Sterren">${a.sterren==null?"—":kom(a.sterren)}</span><span data-l="Controle">${pct(a.controle)}</span><span data-l="Klachten" class="${a.klachtN?"kwq-rood":""}">${a.klachtN}</span></div>`}).join("");
  const tg=(l,v,d)=>`<div class="kww-t"><small>${l}</small><b>${v}</b>${d}</div>`;
  return `<section class="kp kww"><div class="kww-h"><span class="kww-ic">${I.check}</span><div><b>Weekoverzicht kwaliteit</b><small>Week ${weekNr(W.za)} · ${fmtD(iso(W.rg(0)[0]))} – ${fmtD(W.key)} · vergeleken met vorige week</small></div></div>
    <div class="kww-g">${tg("Bezoeken",A.n,`<em class="kww-d">${B.n} vorige week</em>`)}${tg("Op tijd",pct(A.opTijd),ver(A.opTijd,B.opTijd,true,"%"))}${tg("Beoordeling",A.sterren==null?"—":kom(A.sterren),ver(A.sterren,B.sterren))}${tg("Eindcontrole",pct(A.controle),ver(A.controle,B.controle,true,"%"))}${tg("Klachten",A.klachtN,ver(A.klachtN,B.klachtN,false))}${tg("Schade",A.schade,ver(A.schade,B.schade,false))}</div>
    ${waarsch.length?`<div class="kww-w">${waarsch.map(w=>`<p>${I.alert}<span>${esc(w)}</span></p>`).join("")}</div>`:`<p class="kww-ok">${I.check}<span>Niets dat twee weken achter elkaar slechter wordt.</span></p>`}
    ${rij?`<div class="kwq-t kww-mw"><div class="kwq-r kwq-h"><span>Medewerker</span><span>Bezoeken</span><span>Op tijd</span><span>Sterren</span><span>Controle</span><span>Klachten</span></div>${rij}</div>`:""}
    <div class="kww-k"><button type="button" class="ghost" data-cc="kw:week:open">Statistieken › Kwaliteit</button><button type="button" class="primary" data-cc="kw:week:gezien">${I.check}Gezien</button></div></section>`}

/* ---------- vertrekcontrole van de bus (bij Start werkdag) ---------- */
const KW_BUS=["Ladders goed vast","Genoeg water en zeep","Schone doeken en wissers","Bus netjes, binnen en buiten"];
const kwBusPunten=()=>{const t=kwS().kwBusPunten;return Array.isArray(t)&&t.length?t:KW_BUS};
/* geeft {punten,op} terug om bij de werkdag op te slaan; geen annuleren (de kilometerstand is dan al opgeslagen) */
function kwVertrek(){return new Promise(res=>{try{
  if(kwTest()||kwS().kwBus===false)return res(null);
  const P=kwBusPunten(),ok=P.map(()=>false);
  const d=document.createElement("dialog");d.className="vraag-dlg";const o=document.createElement("div");o.className="vraag-ov";d.appendChild(o);
  const teken=()=>{o.innerHTML=`<div class="rk vve-op kwc" role="dialog" aria-modal="true" aria-label="Vertrekcontrole">
    <div class="rk-h"><span class="objic">${I.truck||I.route}</span><div><b>Vertrekcontrole</b><small>Klaar voor de dag? Vink af wat in orde is.</small></div></div>
    <div class="vve-lijst">${P.map((t,i)=>`<label class="vve-t"><input type="checkbox" data-bp="${i}" ${ok[i]?"checked":""}><span><i>${I.check}</i>${esc(t)}</span></label>`).join("")}</div>
    <button type="button" class="kwc-alles" data-bal ${ok.every(Boolean)?"hidden":""}>${I.check}Alles in orde</button>
    <div class="rk-f"><span class="sp"></span><button type="button" class="primary" data-bok>${I.check}Vertrekken</button></div></div>`;
    o.querySelectorAll("[data-bp]").forEach(c=>c.onchange=()=>{ok[+c.dataset.bp]=c.checked;const a=o.querySelector("[data-bal]");if(a)a.hidden=ok.every(Boolean)});
    o.querySelector("[data-bal]").onclick=()=>{ok.fill(true);teken()};
    o.querySelector("[data-bok]").onclick=async()=>{const nee=P.filter((_,i)=>!ok[i]);
      if(nee.length){const a=await vraag("Niet alles in orde?",`Niet afgevinkt: <b>${nee.map(esc).join(", ")}</b>.<br>Regel het nog even voor je vertrekt, of vertrek toch (kantoor ziet wat er ontbrak).`,"Toch vertrekken","Terug");if(a!==true)return}
      try{d.close()}catch(_){}d.remove();res({punten:P.map((p,i)=>({naam:p,ok:ok[i]})),op:new Date().toISOString()})}};
  d.addEventListener("cancel",e=>e.preventDefault());document.body.appendChild(d);teken();d.showModal()
}catch(e){console.error(e);res(null)}})}

/* ---------- dagbriefing op de telefoon (bovenaan Vandaag) ---------- */
function kwDagBrief(stops,d,isT){if(!isT||kwS().kwDagbrief===false)return"";const open=stops.filter(s=>!s.done).map(s=>s.k);if(!open.length)return"";
  const md=iso(today()).slice(5),her=new Set(kwHerstelLijst().map(b=>b.klantId));
  const R=[];open.forEach(k=>{const l=[];if(kwEerste(k))l.push(["Eerste bezoek","goud"]);if(her.has(k.id))l.push(["Herstel loopt","rood"]);
    if((k.schades||[]).some(x=>x&&x.status!=="afgehandeld"))l.push(["Open schade","rood"]);
    if(String(k.geboortedatum||"").slice(5,10)===md)l.push(["Jarig vandaag","goud"]);
    const ks=kwSinds(k);if(ks&&ks.slice(5)===md&&today().getFullYear()-Number(ks.slice(0,4))>=1)l.push([(today().getFullYear()-Number(ks.slice(0,4)))+" jaar klant","goud"]);
    const lt=typeof hospList==="function"?hospList(k).filter(x=>x.c==="letop"||x.c==="dier").map(x=>x.t):[];
    R.push({k,l,lt})});/* alle adressen van vandaag, ook zonder bijzonderheden (zoals VvE's) */
  const tel=(n,w)=>n?`<span><b>${n}</b> ${w}</span>`:"";
  const nE=R.filter(r=>r.l.some(x=>x[0]==="Eerste bezoek")).length,nH=R.filter(r=>r.l.some(x=>/Herstel|schade/.test(x[0]))).length,nJ=R.filter(r=>r.l.some(x=>/Jarig|jaar klant/.test(x[0]))).length;
  return `<details class="kwd"${R.some(r=>r.l.length||r.lt.length)?" open":""}><summary><span class="kwd-ic">${I.sun||I.planning}</span><span class="kwd-t"><b>Jouw dag</b><small>${[plural(open.length,"adres","adressen"),nE?plural(nE,"eerste bezoek","eerste bezoeken"):"",nH?nH+" extra aandacht":"",nJ?nJ+" iets te vieren":""].filter(Boolean).join(" · ")}</small></span>${I.down||""}</summary>
    ${R.length?`<div class="kwd-l">${R.map(r=>`<div class="kwd-r" role="button" tabindex="0" data-act="klant" data-id="${esc(r.k.id)}"><span class="kwd-tm">${esc(r.k.tijd||"")}</span><span class="kwd-m"><b>${esc(kwNaam(r.k))}</b>${r.l.map(x=>`<i class="kwd-lb ${x[1]}">${esc(x[0])}</i>`).join("")}${r.lt.length?`<small>${esc(r.lt.join(" · "))}</small>`:""}</span></div>`).join("")}</div>`
      :`<p class="kwd-leeg">Geen bijzonderheden vandaag. Gewoon een mooie dag.</p>`}</details>`}

/* ---------- instellingen ---------- */
SETCARDS.push({id:"kwaliteit",t:"Kwaliteit & service",sub:"Eindcontrole, briefing, stiptheid en herstel",ic:"check",bg:"#252c3c",
  st:s=>s.kwAan===false?["soon","Staat uit"]:["ok","Aan"],
  rows:s=>[["Eindcontrole",s.kwAan===false?"Uit":plural(kwPunten().length,"punt","punten")],["Aankomstvenster",kwVenster()+" min"],["Herstel vanaf",kwDrempel()+" sterren of minder"]]});
SETEXTRA.kwaliteit=(c,s)=>{
  setDlg(c,`${info("Zoals in een sterrenrestaurant: niets gaat de deur uit zonder controle, je kent de klant voor je aanbelt, je bent stipt en een klacht zet je dezelfde dag recht. De cijfers zie je bij <b>Statistieken › Kwaliteit</b>.")}
    ${sec("Eindcontrole bij afmelden")}
    ${tgl("kwAan","Eindcontrole bij elk bezoek","Bij afmelden de punten afvinken. Een foto en notitie alleen bij een bijzonderheid. VvE's houden hun eigen checklist.",s.kwAan!==false)}
    <label class="full">Controlepunten (één per regel)<textarea id="kwPt" style="min-height:104px">${esc(kwPunten().join("\n"))}</textarea><small class="help">Kort en concreet. Wat niet is afgevinkt, wordt een melding om recht te zetten.</small></label>
    ${sec("Eerste beurt: nulmeting")}
    ${tgl("kwNul","Nulmeting bij de eerste beurt","Bij Start van een eerste beurt kun je eerst foto's van de woning maken (niet verplicht). Per foto geef je de zijde aan en kun je plekken aantikken. Ze worden bij de locatie bewaard, niet naar de klant.",s.kwNul!==false)}
    ${sec("Voor je aanbelt")}
    ${tgl("kwBriefing","Briefing bij Start","Bij Start eerst zien wat je moet weten: toegang, huisdieren, voorkeuren en wat vorige keer opviel. Alleen als er iets te melden is.",s.kwBriefing!==false)}
    ${sec("Eerste bezoek")}
    ${inp("kwEersteExtra","Extra tijd bij een eerste bezoek (minuten)",s.kwEersteExtra==null?15:s.kwEersteExtra,{type:"number",t:"num",attrs:'min="0" max="120" step="5"',help:"Voor de kennismaking, alleen bij klanten aan wie een offerte is verstuurd (een direct aangemaakte opdracht krijgt geen extra tijd). 0 = geen extra tijd. Bij Start staat de kennismaking in de briefing, met vóórfoto's die alleen in de opdracht komen."})}
    ${sec("Vertrek")}
    ${tgl("kwBus","Vertrekcontrole van de bus","Bij Start werkdag eerst de lijst hieronder aflopen. Wat ontbrak, zie je in het Overzicht.",s.kwBus!==false)}
    <label class="full">Vertrekcontrole (één per regel)<textarea id="kwBp" style="min-height:90px">${esc(kwBusPunten().join("\n"))}</textarea></label>
    ${tgl("kwDagbrief","Dagbriefing bovenaan Vandaag","Elke medewerker ziet zijn dag: eerste bezoeken, herstel, schade, jarigen en waar hij op moet letten.",s.kwDagbrief!==false)}
    ${sec("Stipt op tijd")}
    ${tgl("kwStipt","Melding als je te laat dreigt te komen","Alleen voor jou in het Overzicht. De klant krijgt niets automatisch.",s.kwStipt!==false)}
    ${inp("kwVenster","Aankomstvenster (minuten na de geplande tijd)",kwVenster(),{type:"number",t:"num",attrs:'min="5" max="120" step="5"'})}
    ${tgl("kwWeek","Weekoverzicht op zaterdag","Elke zaterdag in het Overzicht: deze week tegen vorige week, per medewerker, met een waarschuwing als iets twee weken achter elkaar slechter wordt.",s.kwWeek!==false)}
    ${sec("Herstel")}
    ${sel("kwDrempel","Herstelmelding bij een beoordeling van",String(kwDrempel()),[["1","1 ster"],["2","2 sterren of minder"],["3","3 sterren of minder"],["4","4 sterren of minder"]],{help:"Rode melding in het Overzicht: bellen, zo nodig kosteloos nawerk, dan op opgelost."})}
    ${inp("crBezoek","Credits voor het beoordelen van een bezoek (€)",s.crBezoek==null?"0.10":s.crBezoek,{type:"number",t:"num",attrs:'min="0" max="5" step="0.05"',help:"De klant beoordeelt in het klantportaal elk bezoek met 1 tot 5 sterren (tot 48 uur erna). Die sterren komen in je kwaliteitsscore. 0 = geen credits."})}
`,{wide:false});
  bindSave(()=>{const t=$("#kwPt").value.split(/\n/).map(x=>x.trim()).filter(Boolean).slice(0,10),std=typeof GLAS==="function"&&GLAS()?KW_GLAS:KW_ALG;const bp=$("#kwBp").value.split(/\n/).map(x=>x.trim()).filter(Boolean).slice(0,10);return{kwBusPunten:bp.length&&bp.join("|")!==KW_BUS.join("|")?bp:[],kwPunten:t.length&&t.join("|")!==std.join("|")?t:[],kwVenster:Math.max(5,Math.min(120,Number(($("[data-k=kwVenster]")||{}).value)||15))}})};
