/* ---------- UITVOERING: diensten, frequenties en bedrijfsmiddelen ----------
   Eén document instellingen/uitvoering. Bij opslaan worden de afgeleide instellingen bijgewerkt:
   - tarieven, seconden, staffels, wegingsfactoren, starttarief, minimum en frequentiekortingen → instellingen/ramen (rekentool, opdrachten, website-calculator)
   - dienstenlijst (chips bij opdracht en offerte) en frequenties (keuzelijsten) → instellingen/bedrijf */
const EENHEDEN=["per stuk","per raam","per m²","per strekkende meter","per meter","per paneel","per uur","per keer"];
const FREQ_STD=[["1x per week",1],["1x per 2 weken",2],["1x per 3 weken",3],["1x per 4 weken",4],["1x per maand",4],["1x per 6 weken",6],["1x per 8 weken",8],["1x per 2 maanden",9],["1x per 12 weken",12],["1x per 3 maanden",13],["1x per 16 weken",16],["1x per 4 maanden",17],["1x per 24 weken",24],["1x per 26 weken",26],["1x per 6 maanden",26],["1x per 32 weken",32],["1x per 8 maanden",35],["1x per 36 weken",36],["1x per 9 maanden",39],["1x per 48 weken",48],["1x per 52 weken",52],["1x per 12 maanden",52],["1x per 2 jaar",104],["1x per 3 jaar",156],["1x per 4 jaar",208],["1x per 5 jaar",260],["Op afroep",999],["Eenmalig",998]];
const FREQ_DEF=[1,2,3,4,6,8,12,13,16,26,52];
/* frequenties die in de keuzelijsten staan (Uitvoering › Frequenties) */
const freqLijst=()=>{const f=S().freqs;return Array.isArray(f)&&f.length?f.map(x=>Number(x.w)).filter(w=>w>0):FREQ_DEF};
const freqOpts=cur=>{const o=[...freqLijst()];const c=Number(cur);if(c>0&&!o.includes(c))o.push(c);return [...new Set(o)].sort((a,b)=>a-b)};
const freqEigenLabel=w=>{const f=S().freqs;if(!Array.isArray(f))return"";const x=f.find(y=>Number(y.w)===Number(w));return x&&x.l?x.l:""};

const uid=p=>p+Math.random().toString(36).slice(2,9);
const itm=(naam,eenheid,prijs,sec,extra)=>({id:uid("d"),naam,artikel:"",extern:"",eenheid,prijs,btw:21,sec,weging:100,tiers:[],factAantal:true,...(extra||{})});
const UITV_WEG=["rolluik","antispin","antialg","schoorsteen","spoed","hogedruk"];
function uitvDefault(){
  if(!RC)RC=buildRamen();const c=RC.cfgAll();
  const k=(key,naam)=>itm(naam,"per raam",c[key+"_p"],c[key+"_s"],{key});
  const G=[
    {id:"glas",type:"glas",std:true,naam:"Glasbewassing",start:c.start||0,min:c.min,fp:{},items:[k("g0","Begane grond"),k("g1","1e verdieping"),k("g2","2e verdieping"),k("g3","3e verdieping")]},
    {id:"bijz",type:"bijz",std:true,naam:"Glasbewassing bijzondere ramen",items:[k("lood","Glas-in-lood"),k("mini","Miniraampjes"),k("koepel","Lichtkoepel"),k("tuimel","Dak-/tuimelramen")]},
    {id:"goten",std:true,naam:"Goten",items:[itm("Leeghalen","per strekkende meter",3,90)]},
    {id:"gevel",std:true,naam:"Reiniging gevelelementen",items:[itm("Daklijst","per strekkende meter",3.50,60),itm("Daklijst met klossen","per strekkende meter",5.50,120),itm("Windveren, regenpijpen etc.","per strekkende meter",3,60),itm("Beplating, luiken, garagedeuren etc.","per m²",4,90),itm("Goten reiniging buitenkant","per strekkende meter",5,120)]},
    {id:"dakkapel",std:true,naam:"Reiniging dakkapel",items:[itm("Eerste verdieping","per stuk",35,1200),itm("Tweede verdieping","per stuk",45,1500)]},
    {id:"zon",std:true,naam:"Reiniging zonnepanelen",items:[itm("Reiniging zonnepanelen","per paneel",3.50,90)]},
    {id:"binnen",std:true,naam:"Glasbewassing binnen",items:[itm("Normale ramen","per raam",2.25,60),itm("Dak- / tuimelramen","per raam",2.10,70),itm("Miniraampjes","per raam",0.60,15)]}];
  G.forEach(g=>g.items.forEach((it,i)=>{it.id=g.id+"_"+i}));/* vaste ids, zodat tellingen blijven kloppen */
  return {groepen:G,eigen:[],middelen:[],freqs:FREQ_DEF.map(w=>({w,l:""}))};
}
/* werkkopie: opgeslagen document + actuele tarieven uit de rekentool */
let U=null,Udirty=false;
function uitvLoad(force){
  if(U&&!force)return U;
  const base=uitvDefault(),sv=state.uitv&&state.uitv.groepen?JSON.parse(JSON.stringify(state.uitv)):null;
  const u=sv?{...base,...sv}:base;
  /* vroegere standaarddiensten die niet meer standaard zijn: weg, tenzij een klant ze gebruikt (wie ze nodig heeft, maakt ze zelf aan) */
  if(sv){const inGebruik=new Set();(state.klanten||[]).forEach(k=>(k.opdrachten||[]).forEach(o=>o&&o.groep&&inGebruik.add(o.groep)));
    u.groepen=(u.groepen||[]).filter(g=>!UITV_WEG.includes(g.id)||inGebruik.has(g.id))}
  if(!sv){/* eerste keer: eigen diensten uit de oude lijst overnemen */
    const bekend=new Set(base.groepen.map(g=>g.naam.toLowerCase()));
    (S().diensten||[]).forEach(d=>{const n=String(d.naam||"").trim();if(!n||/^glasbewassing$/i.test(n)||bekend.has(n.toLowerCase()))return;u.eigen.push({id:uid("g"),naam:n,items:[itm(n,"per keer",Number(d.prijs)||0,(Number(d.duur)||30)*60)]})});
    if(Array.isArray(S().freqs))u.freqs=S().freqs}
  u.freqCalc=(sv&&sv.freqCalc)||S().freqCalc||{};
  /* tarieven met een sleutel komen altijd uit de rekentool (die kan ook elders zijn aangepast) */
  if(!RC)RC=buildRamen();const c=RC.cfgAll();
  u.groepen.forEach(g=>{(g.items||[]).forEach(it=>{if(!it.key)return;it.prijs=c[it.key+"_p"];it.sec=c[it.key+"_s"];
      it.tiers=JSON.parse(JSON.stringify(c.tb&&Array.isArray(c.tb[it.key])?c.tb[it.key]:(/^g\d$/.test(it.key)?c.tiers:[])));it.weging=c.wg&&c.wg[it.key]!=null?c.wg[it.key]:100});
    if(g.type==="glas"){g.start=c.start||0;g.min=c.min;const fl=RC.freqList();g.fp={};fl.forEach(f=>{g.fp[f.k]=c.fp&&c.fp[f.k]!=null&&c.fp[f.k]!==""?Number(c.fp[f.k]):f.p})}});
  U=u;Udirty=false;return U}
const uGroups=()=>[...U.groepen.map(g=>({...g,_e:false})),...U.eigen.map(g=>({...g,_e:true}))];
const uGroup=id=>U.groepen.find(g=>g.id===id)||U.eigen.find(g=>g.id===id);
function uSel(){const s=state.uSel;if(!s)return null;const g=uGroup(s.g);if(!g)return null;return {g,it:s.i!=null?g.items[s.i]:null}}

async function uitvSave(){
  const b=$("#uSave");if(b)b.disabled=true;
  try{
    const glas=U.groepen.find(g=>g.type==="glas"),c=RC.cfgAll(),patch={...(state.ramen||{})};
    Object.keys(c).forEach(k=>{if(!(k in patch))patch[k]=c[k]});
    patch.tb={...(c.tb||{})};patch.wg={...(c.wg||{})};
    U.groepen.forEach(g=>g.items.forEach(it=>{if(!it.key)return;patch[it.key+"_p"]=Math.max(0,Number(it.prijs)||0);patch[it.key+"_s"]=Math.max(0,Number(it.sec)||0);
      patch.tb[it.key]=(it.tiers||[]).map(t=>[Math.max(0,Number(t[0])||0),Number(t[1])||0]).filter(t=>t[0]>0);patch.wg[it.key]=Number(it.weging)||0}));
    if(glas){patch.start=Math.max(0,Number(glas.start)||0);patch.min=Math.max(0,Number(glas.min)||0);patch.fp={};Object.keys(glas.fp||{}).forEach(k=>patch.fp[k]=Number(glas.fp[k])||0);
      const g0=glas.items.find(x=>x.key==="g0");if(g0)patch.tiers=patch.tb.g0}
    /* chips bij opdracht en offerte */
    const dl=[{naam:"Glasbewassing",prijs:Number(S().diensten&&(S().diensten.find(d=>/^glasbewassing$/i.test(d.naam))||{}).prijs)||25,duur:30}];
    uGroups().filter(g=>!g.verberg&&g.type!=="glas"&&g.type!=="bijz").forEach(g=>(g.items||[]).forEach(it=>{dl.push({naam:g.items.length>1?g.naam+" · "+it.naam:g.naam,prijs:r2(Number(it.prijs)||0),duur:Math.max(5,Math.round((Number(it.sec)||0)/60/5)*5)||30,eenheid:it.eenheid})}));
    const freqs=(U.freqs||[]).filter(f=>Number(f.w)>0).map(f=>({w:Number(f.w),l:String(f.l||"").trim()}));
    const freqCalc=U.freqCalc||{};const doc=JSON.parse(JSON.stringify({groepen:U.groepen,eigen:U.eigen,middelen:U.middelen,freqs,freqCalc}));
    await save("instellingen","uitvoering",doc);state.uitv=doc;
    await save("instellingen","ramen",patch);state.ramen=patch;
    await saveSettings({diensten:dl,freqs,freqCalc},"Uitvoering opgeslagen");if(RC&&RC.refreshFreq)RC.refreshFreq();
    Udirty=false;uitvLoad(true);render()}
  catch(e){err(e);if(b)b.disabled=false}
}
function uDirty(){Udirty=true;const b=$("#uSave");if(b){b.disabled=false;b.classList.add("pulse")}const r=$("#uReset");if(r)r.disabled=false}

/* rekenvoorbeeld voor één dienst (alleen eigen staffel) */
function uVoorbeeld(it){const tU=(t,n)=>{t=(t||[]).filter(x=>Number(x[0])>0).map(x=>[Number(x[0]),Number(x[1])||0]).sort((a,b)=>a[0]-b[0]);let o=0;for(let i=1;i<=n;i++){let d=0;for(const [f,p] of t)if(i>=f)d=p;o+=d/100}return o};
  return [1,10,20].map(n=>{const p=n*(Number(it.prijs)||0)*(1-tU(it.tiers,n)/n);return `<div><span>${n} ${n===1?"eenheid":"eenheden"}</span><b>${eur(p)}</b><small>${fmtSec(n*(Number(it.sec)||0))}</small></div>`}).join("")}
const fmtSec=s=>{s=Math.round(Number(s)||0);if(s<60)return s+" sec";const m=Math.floor(s/60),r=s%60;return m<60?m+" min"+(r?" "+r+" sec":""):Math.floor(m/60)+" u "+(m%60)+" min"};

function vUitvoering(){
  uitvLoad();const t=state.utab||"diensten";
  const head=`<div class="pagehead"><div><p class="kicker">Uitvoering</p><h1 class="xl">${t==="diensten"?"Diensten":t==="frequenties"?"Frequenties":"Bedrijfsmiddelen"}</h1><p class="lead" style="margin:0">${t==="diensten"?"Tarieven, tijden en kortingen. De rekentool, opdrachten, offertes en de dienstenwebshop rekenen hiermee.":t==="frequenties"?"Kies welke frequenties je aanbiedt. Die staan in alle keuzelijsten.":"Je materiaal en gereedschap op één plek."}</p></div>
    <div class="acts"><button type="button" id="uReset" data-act="ureset" ${Udirty?"":"disabled"}>${I.refresh}Herstellen</button><button type="button" class="primary${Udirty?" pulse":""}" id="uSave" data-act="usave" ${Udirty?"":"disabled"}>${I.check}Opslaan</button></div></div>
    <div class="toolbar u-tb" style="margin-bottom:18px"><div class="seg" role="group" aria-label="Onderdeel">${[["diensten","Diensten"],["frequenties","Frequenties"],["middelen","Bedrijfsmiddelen"]].map(([x,l])=>`<button type="button" data-act="utab" data-v="${x}" aria-pressed="${t===x}">${l}</button>`).join("")}</div>
      <button type="button" class="small" data-act="uwebview" title="Bekijk de dienstenwebshop (prijscalculator) zoals klanten hem op je website zien${Udirty?" (sla eerst op)":""}">${I.globe||I.eye||""}Dienstenwebshop bekijken</button></div>`;
  if(t==="frequenties")return head+uFreqHtml();
  if(t==="middelen")return head+uMiddelHtml();
  const sel=uSel();
  return head+`<div class="u-grid"><div class="u-left">${uListHtml(U.groepen,false,"Standaard diensten","Vaste diensten voor een particuliere woning. Je kunt ze aanpassen of verbergen.")}${uListHtml(U.eigen,true,"Eigen diensten","Diensten die alleen jij aanbiedt.")}</div>
    <div class="u-right">${big()?(sel?uEditHtml(sel):`<div class="card u-empty">${I.pencil}<b>Kies een dienst</b><span>Tik links op een groep of dienst om hem aan te passen.</span></div>`):""}</div></div>`;
}
function uListHtml(list,eigen,titel,sub){
  const s=state.uSel||{},open=state.uOpen||(state.uOpen={glas:true});
  return `<section class="card u-card"><div class="u-ch"><div><b>${titel}</b><span>${sub}</span></div></div>
    ${list.map((g,gi)=>{const op=!!open[g.id],gs=s.g===g.id&&s.i==null;
      return `<div class="u-g${op?" open":""}${g.verberg?" hid":""}"><div class="u-gr${gs?" sel":""}">
        <button type="button" class="u-tg" data-act="uopen" data-g="${esc(g.id)}" aria-expanded="${op}" aria-label="${op?"Inklappen":"Uitklappen"}">${op?I.minus:I.plus}</button>
        <button type="button" class="u-gn" data-act="usel" data-g="${esc(g.id)}"><b>${esc(g.naam||"Naamloos")}</b><small>${g.verberg?"Verborgen · ":""}${g.type!=="glas"&&g.type!=="bijz"&&g.inCalc===false?"onder meer diensten · ":""}${plural((g.items||[]).length,"dienst","diensten")}${g.type==="glas"?" · starttarief "+eur(g.start||0):""}</small></button>
        ${eigen?`<button type="button" class="iconbtn sm" data-act="umove" data-g="${esc(g.id)}" data-n="-1" ${gi?"":"disabled"} aria-label="Omhoog">${I.up}</button><button type="button" class="iconbtn sm" data-act="umove" data-g="${esc(g.id)}" data-n="1" ${gi<list.length-1?"":"disabled"} aria-label="Omlaag">${I.down}</button>`:""}
        <button type="button" class="iconbtn sm" data-act="usel" data-g="${esc(g.id)}" aria-label="Aanpassen">${I.pencil}</button></div>
        ${op?`<div class="u-its">${(g.items||[]).map((it,i)=>`<button type="button" class="u-it${s.g===g.id&&s.i===i?" sel":""}" data-act="usel" data-g="${esc(g.id)}" data-i="${i}"><span class="u-chev">${I.right}</span><span class="u-in"><b>${esc(it.naam||"Naamloos")}</b><small>${eur(it.prijs)} ${esc(it.eenheid||"")} · ${fmtSec(it.sec)}${(it.tiers||[]).length?" · staffel":""}</small></span>${I.pencil}</button>`).join("")}
          ${g.type!=="glas"&&g.type!=="bijz"?`<button type="button" class="u-add" data-act="uitem" data-g="${esc(g.id)}">${I.plus}Dienst toevoegen</button>`:""}</div>`:""}</div>`}).join("")}
    ${eigen?`<button type="button" class="u-add big" data-act="ugroep">${I.plus}Categorie toevoegen</button>`:""}</section>`;
}
const uIn=(id,u,val,{type="number",step="0.01",pre="",post="",ph="",ro=false}={})=>`<span class="ow-in">${pre?`<i>${pre}</i>`:""}<input id="${id}" data-u="${u}" type="${type}" ${type==="number"?`step="${step}" inputmode="decimal"`:""} value="${esc(val??"")}" placeholder="${esc(ph)}" ${ro?"readonly":""}>${post?`<em>${post}</em>`:""}</span>`;
function uEditHtml({g,it}){
  const del=g.id&&U.eigen.some(x=>x.id===g.id);
  if(!it){const fl=g.type==="glas"?RC.freqList():[];
    return `<div class="card u-ed"><div class="u-edh"><span class="objic">${I.wrench}</span><div><span class="eyebrow">Groep</span><h3>${esc(g.naam||"Naamloos")}</h3></div>${!big()?`<button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button>`:""}</div>
      <label class="tgl"><span><b>Groep standaard verbergen</b><small>Niet tonen bij nieuwe opdrachten en offertes</small></span><input type="checkbox" data-u="g.verberg" id="ug-verberg" ${g.verberg?"checked":""}><i></i></label>
      ${g.type==="glas"||g.type==="bijz"?"":`<label class="tgl"><span><b>Standaard in het overzicht</b><small>Uit = deze dienst staat onder "+ Meer diensten" (bij opdracht, offerte en calculator)</small></span><input type="checkbox" data-u="g.inCalc" id="ug-incalc" ${g.inCalc!==false?"checked":""}><i></i></label>`}
      <label>Naam${uIn("ug-naam","g.naam",g.naam,{type:"text",ro:!!g.std})}</label>
      ${g.type==="bijz"?"":(()=>{const glas=g.type==="glas";const opts=glas?RC.freqList().filter(f=>f.calcAan!==false).map(f=>({v:f.k,l:f.l,w:f.w})):freqLijst().map(w=>({v:String(w),l:freqLabel(w),w}));
        const sel=Array.isArray(g.freqs)&&g.freqs.length?g.freqs.map(String):null,alle=!sel,adv=g.freqAdvies!=null?String(g.freqAdvies):"";
        return `<div class="u-sec"><b>Frequenties voor deze dienst</b><span>Welke frequenties de klant kan kiezen bij deze dienst${glas?" (rekentool, website en offerte)":" (rekentool, offerte en opdracht)"}. Alles uit = alle aangeboden frequenties.</span></div>
        <div class="u-fchips">${opts.map(o=>`<label class="chipchk"><input type="checkbox" data-act="ugfreq" data-g="${esc(g.id)}" data-v="${esc(o.v)}" ${alle||sel.includes(o.v)?"checked":""}><span>${esc(o.l)}</span></label>`).join("")}</div>
        <label>Adviesfrequentie (staat standaard geselecteerd)<select data-u="g.freqAdvies" id="ug-fadv"><option value="">Geen voorkeur</option>${opts.filter(o=>alle||sel.includes(o.v)).map(o=>`<option value="${esc(o.v)}" ${adv===o.v?"selected":""}>${esc(o.l)}</option>`).join("")}</select></label>`})()}
      ${g.type==="glas"?`<div class="u-2"><label>Starttarief${uIn("ug-start","g.start",g.start,{pre:"€",post:"excl."})}</label><label>Minimumprijs${uIn("ug-min","g.min",g.min,{pre:"€",post:"excl."})}</label></div>
        <div class="u-sec"><b>Frequentie</b><span>Korting (%) — een negatief getal is een toeslag</span></div>
        <div class="u-fp">${fl.map(f=>`<div class="u-fpr"><span>${esc(f.l)}</span>${uIn("ufp-"+f.k,"g.fp."+f.k,(g.fp||{})[f.k]??f.p,{step:"1",post:"%"})}</div>`).join("")}</div>`
        :`<div class="u-sec"><b>Frequentie</b><span>Korting (%) per frequentie — een negatief getal is een toeslag (bijv. −50 bij op afroep)</span></div>
        <div class="u-fp">${dienstFreqKeuzes().map(w=>`<div class="u-fpr"><span>${esc(fqSpec(w)?fqSpecTxt(w):fqTxt(w)||freqLabel(w))}</span>${uIn("ufw-"+w,"g.fpw."+w,(g.fpw||{})[w]??0,{step:"1",post:"%"})}</div>`).join("")}</div>`}
      ${del?`<button type="button" class="small danger" data-act="udelg" data-g="${esc(g.id)}">${I.trash}Categorie verwijderen</button>`:""}</div>`}
  const i=g.items.indexOf(it),canDel=!it.key;
  return `<div class="card u-ed"><div class="u-edh"><span class="objic">${I.wrench}</span><div><span class="eyebrow">${esc(g.naam)}</span><h3>${esc(it.naam||"Naamloos")}</h3></div>${!big()?`<button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button>`:""}</div>
    <label>Naam dienst${uIn("ui-naam","i.naam",it.naam,{type:"text",ro:!!it.key})}</label>
    <div class="u-2"><label>Artikelnummer (optioneel)${uIn("ui-art","i.artikel",it.artikel,{type:"text"})}</label>
      <label>Externe ID (optioneel)${uIn("ui-ext","i.extern",it.extern,{type:"text"})}</label></div>
    <div class="u-2"><label>Eenheid<select id="ui-eenh" data-u="i.eenheid">${[...new Set([...EENHEDEN,it.eenheid].filter(Boolean))].map(e=>`<option ${e===it.eenheid?"selected":""}>${esc(e)}</option>`).join("")}</select></label><span></span></div>
    <label class="tgl"><span><b>Aantal weergeven op factuur</b><small>Bijv. "8 × raam" in plaats van één bedrag</small></span><input type="checkbox" data-u="i.factAantal" id="ui-fa" ${it.factAantal!==false?"checked":""}><i></i></label>
    <div class="u-2"><label>Prijs per eenheid${uIn("ui-prijs","i.prijs",it.prijs,{pre:"€",post:"excl."})}</label>
      <label>Btw-tarief<select id="ui-btw" data-u="i.btw">${[21,9,0].map(b=>`<option value="${b}" ${Number(it.btw??21)===b?"selected":""}>${b}%</option>`).join("")}</select></label></div>
    <div class="u-2"><label>Tijdsduur per eenheid${uIn("ui-sec","i.sec",it.sec,{step:"1",post:"sec"})}<small class="help" id="ui-secv">= ${fmtSec(it.sec)}</small></label>
      <label>Wegingsfactor staffelkorting${uIn("ui-weg","i.weging",it.weging??100,{step:"1",post:"%"})}<small class="help">Hoe zwaar deze eenheden meetellen voor de staffel</small></label></div>
    <div class="u-sec"><b>Staffelkorting</b><span>Vanaf 10 eenheden 10% en vanaf 20 eenheden 20% betekent: de eerste 9 zonder korting, nummer 10 t/m 19 met 10%, vanaf 20 met 20%. Kortingen tellen niet op.</span></div>
    <div class="u-tiers">${(it.tiers||[]).map((t,j)=>`<div class="u-tr">${uIn("ut-"+j+"a","i.tiers."+j+".0",t[0],{step:"1",pre:"Vanaf"})}${uIn("ut-"+j+"b","i.tiers."+j+".1",t[1],{step:"1",post:"%"})}<button type="button" class="iconbtn sm" data-act="udeltier" data-j="${j}" aria-label="Verwijderen">${I.x}</button></div>`).join("")||'<p class="subt" style="margin:0">Geen staffelkorting.</p>'}</div>
    <button type="button" class="small" data-act="uaddtier">${I.plus}Korting toevoegen</button>
    <div class="u-vb" id="ui-vb"><span class="eyebrow">Rekenvoorbeeld</span><div>${uVoorbeeld(it)}</div></div>
    ${canDel?`<button type="button" class="small danger" data-act="udeli" data-g="${esc(g.id)}" data-i="${i}">${I.trash}Dienst verwijderen</button>`:`<p class="help" style="margin:0">Deze dienst hoort bij de rekentool en kan niet worden verwijderd.</p>`}</div>`;
}
function uFreqHtml(){
  const mine=U.freqs||[],has=w=>mine.some(f=>Number(f.w)===w),fl=RC?RC.freqList():[],calcKey=(l,w)=>{const f=fl.find(x=>x.l.toLowerCase()===l.toLowerCase());return f?f.k:w>0&&!fqSpec(w)?"w"+w+"_"+l.toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,12):""},
    isExtra=k=>!fl.some(x=>x.k===k&&!(U.freqCalc&&U.freqCalc[k]&&typeof U.freqCalc[k]==="object")),calcAan=k=>isExtra(k)?!!(U.freqCalc&&U.freqCalc[k]&&typeof U.freqCalc[k]==="object"):!(U.freqCalc&&U.freqCalc[k]===false);
  const sw=(act,attrs,on,lbl)=>`<label class="u-sw${on?" aan":""}" title="${esc(lbl)}"><input type="checkbox" data-act="${act}" ${attrs} ${on?"checked":""}><i></i><span>${esc(lbl)}</span></label>`;
  return `<div class="u-grid"><section class="card u-card"><div class="u-ch"><div><b>Overzicht frequenties</b><span>Zet per frequentie aan of klanten hem kunnen kiezen: in de <b>planning</b> (klanten, opdrachten, offertes) en in de <b>rekentool</b> (calculator en website).</span></div></div>
    <div class="u-fl u-ffl">${FREQ_STD.map(([l,w])=>{const ck=calcKey(l,w);return `<div class="u-fi"><span>${esc(l)}</span><small>${w&&!fqSpec(w)?w+" wk":"—"}</small>
      ${w?sw("uftog",`data-w="${w}" data-l="${esc(l)}"`,has(w),"Planning"):`<span class="u-sw dis"><i></i><span>Planning</span></span>`}
      ${ck?sw("ufcalc",`data-k="${ck}" data-w="${w}" data-l="${esc(l)}" data-x="${isExtra(ck)?1:0}"`,calcAan(ck),"Rekentool"):`<span class="u-sw dis"><i></i><span>Rekentool</span></span>`}</div>`}).join("")}</div></section>
    <section class="card u-card"><div class="u-ch"><div><b>Jouw frequenties</b><span>Deze staan in de keuzelijsten bij klanten, opdrachten en offertes. Een eigen naam is optioneel.</span></div></div>
    <div class="u-fl">${mine.map((f,i)=>`<div class="u-fi mine"><span class="u-fw">${fqSpec(f.w)?"—":f.w+" wk"}</span><input id="uf-${i}" data-u="f.${i}.l" value="${esc(f.l||"")}" placeholder="${esc(freqLabelStd(f.w))}" aria-label="Naam">
      <button type="button" class="iconbtn sm" data-act="ufmove" data-i="${i}" data-n="-1" ${i?"":"disabled"} aria-label="Omhoog">${I.up}</button><button type="button" class="iconbtn sm" data-act="ufmove" data-i="${i}" data-n="1" ${i<mine.length-1?"":"disabled"} aria-label="Omlaag">${I.down}</button><button type="button" class="iconbtn sm" data-act="ufdel" data-i="${i}" aria-label="Verwijderen">${I.x}</button></div>`).join("")||'<p class="subt">Nog geen frequenties; de standaardlijst wordt gebruikt.</p>'}</div>
    <div class="u-addrow"><input type="number" id="ufNew" min="1" step="1" placeholder="Aantal weken"><button type="button" class="small" data-act="ufnew">${I.plus}Eigen frequentie</button></div></section></div>`;
}
function uMiddelHtml(){
  const m=U.middelen||[];
  return `<section class="card u-card" style="max-width:860px"><div class="u-ch"><div><b>Overzicht bedrijfsmiddelen</b><span>Ladders, telescoopstelen, watersystemen, middelen.</span></div></div>
    <div class="u-fl">${m.map((x,i)=>`<div class="u-mi"><span class="u-mic">${I.wrench}</span><input id="um-${i}n" data-u="m.${i}.naam" value="${esc(x.naam||"")}" placeholder="Naam" aria-label="Naam"><span class="ow-in u-aant"><input id="um-${i}a" data-u="m.${i}.aantal" type="number" min="0" step="1" value="${esc(x.aantal??1)}" aria-label="Aantal"><em>st</em></span>
      <input id="um-${i}o" class="u-not" data-u="m.${i}.notitie" value="${esc(x.notitie||"")}" placeholder="Notitie, bijv. onderhoud of locatie" aria-label="Notitie">
      <span class="u-mact"><button type="button" class="iconbtn sm" data-act="ummove" data-i="${i}" data-n="-1" ${i?"":"disabled"} aria-label="Omhoog">${I.up}</button><button type="button" class="iconbtn sm" data-act="ummove" data-i="${i}" data-n="1" ${i<m.length-1?"":"disabled"} aria-label="Omlaag">${I.down}</button><button type="button" class="iconbtn sm" data-act="umdel" data-i="${i}" aria-label="Verwijderen">${I.x}</button></span></div>`).join("")||'<p class="subt" style="margin:8px 0">Nog geen bedrijfsmiddelen.</p>'}</div>
    <button type="button" class="u-add big" data-act="umadd">${I.plus}Bedrijfsmiddel toevoegen</button></section>`;
}
const freqLabelStd=w=>{w=Number(w)||4;if(fqSpec(w))return fqSpecTxt(w);return w===52?"Elk jaar":w===26?"Elk half jaar":w===13?"Elk kwartaal":"Elke "+w+" "+(w===1?"week":"weken")};

/* invoer: pad in data-u, bijv. g.start, g.fp.m8, i.tiers.0.1, f.2.l, m.0.aantal */
function uInput(el,commit){
  const p=el.dataset.u.split("."),root=p.shift(),sel=uSel();let o=root==="g"?sel&&sel.g:root==="i"?sel&&sel.it:root==="f"?U.freqs:root==="m"?U.middelen:null;if(!o)return;
  for(let j=0;j<p.length-1;j++){if(o[p[j]]==null)o[p[j]]={};o=o[p[j]]}
  const k=p[p.length-1];o[k]=el.type==="checkbox"?el.checked:el.type==="number"?(el.value===""?"":Number(el.value)):el.value;
  /* groepen in de lijst zijn kopieën bij weergave; schrijf naar het echte object */
  uDirty();
  if(root==="i"&&sel){const v=$("#ui-vb");if(v)v.querySelector("div").innerHTML=uVoorbeeld(sel.it);const sv=$("#ui-secv");if(sv)sv.textContent="= "+fmtSec(sel.it.sec)}
  if(root==="i"&&sel&&k==="naam"){const b=document.querySelector(`.u-it.sel .u-in b`);if(b)b.textContent=el.value||"Naamloos";const h=el.closest(".u-ed");if(h)h.querySelector("h3").textContent=el.value||"Naamloos"}
  if(root==="g"&&sel&&k==="naam"){const b=document.querySelector(`.u-gr.sel .u-gn b`);if(b)b.textContent=el.value||"Naamloos";const h=el.closest(".u-ed");if(h)h.querySelector("h3").textContent=el.value||"Naamloos"}
  if(commit)uRedraw();
}
function uRedraw(){if(!big()&&dlg.open&&form.dataset.sheet==="uedit"){const y=dlg.scrollTop;render();uOpenEdit();dlg.scrollTop=y}else render()}
function uOpenEdit(){const s=uSel();if(!s)return;openDlg(uEditHtml(s),{drawer:true});form.dataset.sheet="uedit"}
function uAct(a,t){
  const s=state.uSel;
  switch(a){
    case"utab":state.utab=t.dataset.v;render();break;
    case"usave":uitvSave();break;
    case"ureset":uitvLoad(true);state.uSel=null;render();toast("Wijzigingen ongedaan gemaakt");break;
    case"uopen":{const o=state.uOpen||(state.uOpen={});o[t.dataset.g]=!o[t.dataset.g];render();break}
    case"usel":{state.uSel={g:t.dataset.g,i:t.dataset.i!=null?Number(t.dataset.i):null};(state.uOpen||(state.uOpen={}))[t.dataset.g]=true;render();if(!big())uOpenEdit();break}
    case"uitem":{const g=uGroup(t.dataset.g);g.items.push(itm("Nieuwe dienst","per stuk",0,60));state.uSel={g:g.id,i:g.items.length-1};(state.uOpen||(state.uOpen={}))[g.id]=true;uDirty();render();if(!big())uOpenEdit();setTimeout(()=>{const e=$("#ui-naam");if(e){e.focus();e.select()}},30);break}
    case"ugroep":{const g={id:uid("g"),naam:"Nieuwe categorie",items:[itm("Nieuwe dienst","per stuk",0,60)]};U.eigen.push(g);state.uSel={g:g.id,i:null};(state.uOpen||(state.uOpen={}))[g.id]=true;uDirty();render();if(!big())uOpenEdit();setTimeout(()=>{const e=$("#ug-naam");if(e){e.focus();e.select()}},30);break}
    case"umove":{const i=U.eigen.findIndex(g=>g.id===t.dataset.g),j=i+Number(t.dataset.n);if(i<0||j<0||j>=U.eigen.length)break;[U.eigen[i],U.eigen[j]]=[U.eigen[j],U.eigen[i]];uDirty();render();break}
    case"udelg":{U.eigen=U.eigen.filter(g=>g.id!==t.dataset.g);state.uSel=null;uDirty();if(dlg.open)dlg.close();render();break}
    case"udeli":{const g=uGroup(t.dataset.g);g.items.splice(Number(t.dataset.i),1);state.uSel=g.items.length?{g:g.id,i:null}:null;uDirty();if(dlg.open)dlg.close();render();break}
    case"uaddtier":{const x=uSel();if(!x||!x.it)break;const tl=x.it.tiers||(x.it.tiers=[]);const last=tl[tl.length-1];tl.push(last?[Number(last[0])+10,Number(last[1])+10]:[10,10]);uDirty();uRedraw();break}
    case"udeltier":{const x=uSel();if(!x||!x.it)break;x.it.tiers.splice(Number(t.dataset.j),1);uDirty();uRedraw();break}
    case"uwebview":{if(Udirty){toast("Sla eerst op, dan rekent de calculator met je nieuwe tarieven");break}t.disabled=true;(async()=>{try{const s=S(),wa=String(s.webWa||waNr(s.telefoon)||"").replace(/\D/g,"");webCalcVoorbeeld(await klantCalcHtml(wa),undefined,{direct:true})}catch(e){err(e)}finally{t.disabled=false}})();break}
    case"ugfreq":{const g=uGroup(t.dataset.g);if(!g)break;const glas=g.type==="glas";const all=(glas?RC.freqList().filter(f=>f.calcAan!==false).map(f=>f.k):freqLijst().map(String));
      let sel=Array.isArray(g.freqs)&&g.freqs.length?g.freqs.map(String):all.slice();const v=t.dataset.v;if(t.checked){if(!sel.includes(v))sel.push(v)}else sel=sel.filter(x=>x!==v);
      if(!sel.length){t.checked=true;toast("Minimaal één frequentie");break}
      g.freqs=sel.length>=all.length&&all.every(x=>sel.includes(x))?[]:sel;if(g.freqAdvies&&!sel.includes(String(g.freqAdvies)))g.freqAdvies="";uDirty();uRedraw();break}
    case"uftog":{const w=Number(t.dataset.w);const i=U.freqs.findIndex(f=>Number(f.w)===w);if(i>=0)U.freqs.splice(i,1);else{U.freqs.push({w,l:/maand|jaar/.test(t.dataset.l)?t.dataset.l:""});U.freqs.sort((a,b)=>a.w-b.w)}uDirty();render();break}
    case"ufcalc":{const k=t.dataset.k;U.freqCalc=U.freqCalc||{};
      if(t.dataset.x==="1"){if(U.freqCalc[k]&&typeof U.freqCalc[k]==="object")delete U.freqCalc[k];else U.freqCalc[k]={l:t.dataset.l,w:Number(t.dataset.w)}}
      else{if(U.freqCalc[k]===false)delete U.freqCalc[k];else U.freqCalc[k]=false}
      uDirty();render();break}
    case"ufadd":{const w=Number(t.dataset.w);if(!U.freqs.some(f=>Number(f.w)===w)){U.freqs.push({w,l:/maand|jaar/.test(t.dataset.l)?t.dataset.l:""});U.freqs.sort((a,b)=>a.w-b.w)}uDirty();render();break}
    case"ufnew":{const w=Math.round(Number(($("#ufNew")||{}).value)||0);if(w<1){toast("Vul een aantal weken in");break}if(!U.freqs.some(f=>Number(f.w)===w)){U.freqs.push({w,l:""});U.freqs.sort((a,b)=>a.w-b.w)}uDirty();render();break}
    case"ufmove":{const i=Number(t.dataset.i),j=i+Number(t.dataset.n);[U.freqs[i],U.freqs[j]]=[U.freqs[j],U.freqs[i]];uDirty();render();break}
    case"ufdel":U.freqs.splice(Number(t.dataset.i),1);uDirty();render();break;
    case"umadd":U.middelen.push({id:uid("b"),naam:"",aantal:1,notitie:""});uDirty();render();setTimeout(()=>{const e=$("#um-"+(U.middelen.length-1)+"n");if(e)e.focus()},30);break;
    case"ummove":{const i=Number(t.dataset.i),j=i+Number(t.dataset.n);[U.middelen[i],U.middelen[j]]=[U.middelen[j],U.middelen[i]];uDirty();render();break}
    case"umdel":U.middelen.splice(Number(t.dataset.i),1);uDirty();render();break;
    default:return false}
  return true;
}

/* lijst voor de knoppen bij opdracht, offerte en factuur; per groep met de diensten (eenheden) erin */
/* frequenties per dienst(groep): g.freqs = toegestane keuzes (glas: rekentool-sleutels, overige: weken), leeg/afwezig = alles; g.freqAdvies = standaardkeuze */
function uFreqGroep(id){const src=Udirty&&U?U:(state.uitv&&state.uitv.groepen?state.uitv:null);if(!src)return {keuzes:null,advies:null};
  const g=[...(src.groepen||[]),...(src.eigen||[])].find(x=>x.id===id||(id==="glas"&&x.type==="glas"));if(!g)return {keuzes:null,advies:null};
  return {keuzes:Array.isArray(g.freqs)&&g.freqs.length?g.freqs.map(String):null,advies:g.freqAdvies!=null&&g.freqAdvies!==""?String(g.freqAdvies):null}}
function uDienstLijst(){
  if(!RC)RC=buildRamen();const c=RC.cfgAll();
  const src=Udirty&&U?U:(state.uitv&&state.uitv.groepen?state.uitv:null);
  const groepen=src?[...(src.groepen||[]),...(src.eigen||[])]:uitvDefault().groepen;
  const out=[];
  groepen.forEach(g=>{if(g.verberg)return;
    const items=(g.items||[]).map(it=>({id:it.id,naam:it.naam,eenheid:it.eenheid||"per stuk",prijs:Number(it.key?c[it.key+"_p"]:it.prijs)||0,sec:Number(it.key?c[it.key+"_s"]:it.sec)||0,tiers:it.key?((c.tb&&c.tb[it.key])||[]):(it.tiers||[]),weging:it.key?(c.wg&&c.wg[it.key]!=null&&c.wg[it.key]!==""?Number(c.wg[it.key]):100):(it.weging??100),btw:it.btw??21}));
    if(g.type==="glas"){out.push({naam:g.naam||"Glasbewassing",glas:true,prijs:0,duur:30,groep:g.id});return}
    const sec=items.reduce((a,x)=>a+x.sec,0);
    const fq=uFreqGroep(g.id);out.push({naam:g.naam,groep:g.id,inCalc:g.inCalc!==false,freqs:fq.keuzes?fq.keuzes.map(Number).filter(Boolean):null,freqAdvies:fq.advies?Number(fq.advies)||0:0,items,prijs:items.length===1?items[0].prijs:0,duur:Math.max(5,Math.round(sec/60/5)*5)||30,eenheid:items.length===1?items[0].eenheid:""})});
  return out}
/* prijs (excl.) en seconden van een regel met aantallen */
function itemsCalc(items,W){/* staffel zoals bij de ramen: alle onderdelen van één dienst tellen samen mee (met hun wegingsfactor); halve meters tellen naar rato */
  const tU=(t,n)=>{t=(t||[]).filter(x=>Number(x[0])>0).map(x=>[Number(x[0]),Number(x[1])||0]).sort((a,b)=>a[0]-b[0]);let o=0;for(let i=1;i<=Math.ceil(n-1e-9);i++){let d=0;for(const [f,p] of t)if(i>=f)d=p;o+=d/100*Math.min(1,n-(i-1))}return o};
  const wg=it=>it.weging!=null&&it.weging!==""?Number(it.weging):100;
  if(W==null)W=itemsWeight(items);
  let ex=0,sec=0;(items||[]).forEach(it=>{const n=Number(it.aantal)||0;if(!(n>0))return;const disc=W>0?tU(it.tiers,W)/W:0;ex+=n*(Number(it.prijs)||0)*(1-disc);sec+=n*(Number(it.sec)||0)});return {ex:r2(ex),sec}}
function itemsWeight(items){return Math.round((items||[]).reduce((a,it)=>{const n=Number(it.aantal)||0;return n>0?a+n*(it.weging!=null&&it.weging!==""?Number(it.weging):100)/100:a},0)*100)/100}
const eenhKort=e=>({"per strekkende meter":"m","per meter":"m","per m²":"m²","per uur":"uur","per paneel":"panelen","per raam":"ramen","per keer":"×"})[e]||"st";

/* knoppen voor diensten: de gewone direct, de rest onder "+ Meer diensten" */
function dienstChips(list,attr){const chip=(d,i)=>`<button type="button" class="chip" ${attr}="${i}">${I.plus}${esc(d.naam)}</button>`;
  const hoofd=[],meer=[];list.forEach((d,i)=>(d.inCalc===false?meer:hoofd).push(chip(d,i)));
  return hoofd.join("")+(meer.length?`<button type="button" class="chip chip-meer" data-meer>${I.plus}Meer diensten (${meer.length})</button><span class="chips-meer" hidden>${meer.join("")}</span>`:"")}
document.addEventListener("click",e=>{const b=e.target.closest("[data-meer]");if(!b)return;const s=b.nextElementSibling;if(s){s.hidden=false;b.hidden=true}});

/* ---------- regel met onderdelen (zoals Reiniging gevelelementen): per onderdeel frequentie, aanboddatum en eigen prijs/tijd ---------- */
const gHas=v=>v!==""&&v!=null;
/* frequentiekorting per dienst (zoals in DienstenCRM): instellingen/uitvoering · groep.fpw = {weken: %}. Negatief = toeslag. Glasbewassing zelf houdt zijn eigen kortingen (rekentool). */
function dienstFreqPct(gid,w){if(!gid||gid==="glas")return 0;const src=(typeof Udirty!=="undefined"&&Udirty&&U)?U:state.uitv;if(!src)return 0;const g=[...(src.groepen||[]),...(src.eigen||[])].find(x=>x.id===gid);
  const v=g&&g.fpw?g.fpw[String(Number(w)||0)]:null;return v===""||v==null?0:Math.max(-500,Math.min(100,Number(v)||0))}
const dienstFreqFactor=(gid,w)=>1-dienstFreqPct(gid,w)/100;
const dienstFreqKeuzes=()=>{const l=[...new Set(freqLijst().map(Number))].sort((a,b)=>a-b).filter(w=>!fqSpec(w));return [...l,FQ_AFROEP,FQ_EENMALIG]};
function groepCalc(g,due){
  const all=(g.items||[]).filter(it=>Number(it.aantal)>0),its=due?all.filter(due):all;
  const Wg=itemsWeight(all),row=it=>{const b0=itemsCalc([it],Wg),fk=dienstFreqFactor(g.groep,Number(it.fq)||Number(g.frequentie)),b={...b0,ex:r2(b0.ex*fk)};return {it,p:gHas(it.op)?Number(it.op)||0:b.ex,sec:gHas(it.od)?(Number(it.od)||0)*60:b.sec,calcP:b.ex,calcSec:b.sec}};
  const rowsAll=all.map(row),rows=due?rowsAll.filter(r=>its.includes(r.it)):rowsAll;
  const sumP=l=>l.reduce((a,r)=>a+r.p,0),sumS=l=>l.reduce((a,r)=>a+r.sec,0);
  let ex=sumP(rows),sec=sumS(rows);
  if(rows.length&&gHas(g.tp)){const fp=sumP(rowsAll)||1;ex=(Number(g.tp)||0)*(due?sumP(rows)/fp:1)}
  if(rows.length&&gHas(g.td)){const fs=sumS(rowsAll)||1;sec=(Number(g.td)||0)*60*(due?sumS(rows)/fs:1)}
  const start=rows.length&&gHas(g.start)?Number(g.start)||0:0;
  return {rows,ex:r2(ex+start),sec,start,calcEx:r2(sumP(rowsAll)),calcSec:sumS(rowsAll)}}
function groepOmschrijving(g,rowsIts,verbergAantal){const its=(rowsIts||(g.items||[]).filter(x=>Number(x.aantal)>0));
  if(g.groepOms)return g.groepOms;const n=g.naam||g.dienst||"";return n+(!verbergAantal&&its.length?": "+groepDetail(its,g.frequentie):"")}
function groepDetail(its,base){return its.map(x=>x.naam.toLowerCase()+" "+String(x.aantal).replace(".",",")+" "+eenhKort(x.eenheid)+(base&&x.fq&&Number(x.fq)!==Number(base)?" ("+freqLabel(Number(x.fq)).toLowerCase()+")":"")).join(", ")}
/* editor; key = id van de kaart; offerte = toont groepsomschrijving */
function groepEditor(g,key,{offerte=false,freqDefault=8}={}){const c=groepCalc(g),btwPct=Number(S().btw)||21;
  const fq=(it,j)=>`<select data-gk="${key}" data-gi="${j}" data-gf="fq"><option value="" ${it.fq===""||it.fq==null?"selected":""}>Selecteer</option><option value="0" ${String(it.fq)==="0"?"selected":""}>Zelfde als glasbewassing</option>${freqOpts(it.fq||freqDefault).map(w=>`<option value="${w}" ${String(it.fq)===String(w)?"selected":""}>${esc(freqLabel(w))}</option>`).join("")}</select>`;
  return `<div class="ge" data-ge="${key}">
    <label class="ge-full">Werkomschrijving<textarea data-gk="${key}" data-gf="oms" placeholder="Bijv. daklijsten voor- en achterzijde, inclusief klossen">${esc(g.oms||"")}</textarea></label>
    <p class="help ge-note">Let op: afspraken die al ingepland zijn veranderen niet als je hieronder iets aanpast.</p>
    ${(()=>{const Wg=itemsWeight(g.items||[]);return (g.items||[]).map((it,j)=>{const on=Number(it.aantal)>0,b0=itemsCalc([it],Wg),b={...b0,ex:r2(b0.ex*dienstFreqFactor(g.groep,Number(it.fq)||Number(g.frequentie)||freqDefault))};return `<div class="ge-it${on?" aan":""}">
      <div class="ge-row"><div class="ge-nm"><b>${esc(it.naam)}</b><small>${eur(it.prijs)} ${esc(it.eenheid)} excl. · ${it.sec} sec</small></div>
        <div class="ow-step"><button type="button" data-gk="${key}" data-gst="${j}:-1" aria-label="Min">−</button><input data-gk="${key}" data-gi="${j}" data-gf="aantal" type="number" min="0" step="any" inputmode="decimal" value="${esc(it.aantal||0)}" aria-label="Aantal ${esc(it.naam)}"><span>${esc(eenhKort(it.eenheid))}</span><button type="button" data-gk="${key}" data-gst="${j}:1" aria-label="Plus">+</button></div></div>
      ${on?`<div class="ge-sub">
        <label>Frequentie${fq(it,j)}</label>
        <label>Aanboddatum<input type="date" data-gk="${key}" data-gi="${j}" data-gf="vol" value="${esc(it.vol||"")}" title="Leeg = bij de volgende beurt"></label>
        <label>Overschrijvende prijs<span class="ow-in"><i>€</i><input type="number" step="0.01" min="0" data-gk="${key}" data-gi="${j}" data-gf="op" value="${esc(gHas(it.op)?it.op:"")}" placeholder="${b.ex.toFixed(2)}"><em>excl.</em></span></label>
        <label>Overschrijvende tijdsduur<span class="ow-in"><input type="number" step="1" min="0" data-gk="${key}" data-gi="${j}" data-gf="od" value="${esc(gHas(it.od)?it.od:"")}" placeholder="${Math.round(b.sec/60)}"><em>min</em></span></label>
        <div class="ow-flber ge-full ge-ber"><span class="subt">${I.calculator} ${String(it.aantal).replace(".",",")} ${esc(eenhKort(it.eenheid))} × ${eur(it.prijs)} = ${eur(b.ex)} · ${Math.max(1,Math.round(b.sec/60))} min${gHas(it.op)||gHas(it.od)?" · <b>eigen waarde</b>":""}</span><button type="button" class="small" data-gk="${key}" data-gber="${j}" title="Berekent alle onderdelen van deze dienst opnieuw">${I.calculator}Berekenen</button></div>
        ${it.vol?`<button type="button" class="linkbtn ge-sync" data-gk="${key}" data-gsync="${j}">Aanboddatum ${esc(fmtD(it.vol))} voor alle onderdelen gebruiken</button>`:""}</div>`:""}</div>`}).join("")})()}
    <div class="ge-tot"><div class="ow-kv"><span>Tijdsduur</span><b>${Math.round(c.sec/60)} minuten${gHas(g.td)?' <small class="subt">(eigen)</small>':""}</b></div><div class="ow-kv"><span>Totaalprijs "${esc(g.naam||g.dienst||"")}"</span><b>${eur(c.ex)} excl. · ${eur(c.ex*(1+btwPct/100))} incl.${gHas(g.tp)?' <small class="subt">(eigen)</small>':""}</b></div></div>
    <div class="ge-over">
      <label>Starttarief<span class="ow-in"><i>€</i><input type="number" step="0.01" min="0" data-gk="${key}" data-gf="start" value="${esc(g.start??"")}" placeholder="0,00"><em>excl.</em></span></label>
      <label>Overschrijvende prijs<span class="ow-in"><i>€</i><input type="number" step="0.01" min="0" data-gk="${key}" data-gf="tp" value="${esc(g.tp??"")}" placeholder="${c.calcEx.toFixed(2)}"><em>excl.</em></span></label>
      <label>Overschrijvende tijdsduur<span class="ow-in"><input type="number" step="1" min="0" data-gk="${key}" data-gf="td" value="${esc(g.td??"")}" placeholder="${Math.round(c.calcSec/60)}"><em>min</em></span></label>
      ${offerte?`<label class="ge-full">Groepsomschrijving offerte <small class="help">leeg = automatisch</small><textarea data-gk="${key}" data-gf="groepOms" style="min-height:60px" placeholder="${esc((g.naam||"")+" ("+freqLabel(freqDefault).toLowerCase()+"): "+groepDetail((g.items||[]).filter(x=>Number(x.aantal)>0),freqDefault))}">${esc(g.groepOms||"")}</textarea></label>`:""}
    </div></div>`}
/* koppelt invoer van alle editors in een container; getG(key) geeft het object, done(key,structureel) tekent opnieuw */
function groepBind(box,getG,done){if(box._gb)return;box._gb=1;
  const val=(el)=>el.type==="number"?(el.value===""?"":Number(el.value)):el.value;
  const set=el=>{const g=getG(el.dataset.gk);if(!g)return null;const f=el.dataset.gf;if(el.dataset.gi!=null){const it=g.items[+el.dataset.gi];it[f]=f==="aantal"?Math.max(0,Number(el.value)||0):f==="fq"?(el.value===""?"":Number(el.value)):val(el)}else g[f]=val(el);return g};
  box.addEventListener("input",e=>{const el=e.target;if(!el.dataset||!el.dataset.gk||!el.dataset.gf||el.tagName==="SELECT")return;if(set(el))done(el.dataset.gk,false)});
  box.addEventListener("change",e=>{const el=e.target;if(!el.dataset||!el.dataset.gk||!el.dataset.gf)return;if(set(el))done(el.dataset.gk,["aantal","fq","vol"].includes(el.dataset.gf))});
  box.addEventListener("click",e=>{const b=e.target.closest("[data-gst],[data-gsync],[data-gber]");if(!b||!b.dataset.gk)return;const g=getG(b.dataset.gk);if(!g)return;
    if(b.dataset.gst){const [j,d]=b.dataset.gst.split(":").map(Number),it=g.items[j];it.aantal=Math.max(0,r2((Number(it.aantal)||0)+d))}
    else if(b.dataset.gber!=null){/* eerst een frequentie kiezen: die vullen we niet vooraf in */
      if((g.items||[]).some(it=>Number(it.aantal)>0&&(it.fq===""||it.fq==null))){melding("Let op","Er is nog geen frequentie ingevuld.");return}
      (g.items||[]).forEach(it=>{it.op="";it.od=""});g.tp="";g.td=""}
    else{const v=g.items[+b.dataset.gsync].vol;g.items.forEach(it=>{if(Number(it.aantal)>0)it.vol=v})}
    done(b.dataset.gk,true)})}
/* herteken één editor zonder de rest van het scherm */
function groepRedraw(box,key,g,opts){let el=box.querySelector(`[data-ge="${key}"]`);if(!el)return;const ae=document.activeElement;if(ae&&el.contains(ae))ae.blur();
  el=box.querySelector(`[data-ge="${key}"]`);if(!el||!el.parentNode)return;const t=document.createElement("div");t.innerHTML=groepEditor(g,key,opts);try{el.parentNode.replaceChild(t.firstElementChild,el)}catch(e){}}
function groepTotUpdate(box,key,g,opts){const el=box.querySelector(`[data-ge="${key}"] .ge-tot`);if(!el)return;const t=document.createElement("div");t.innerHTML=groepEditor(g,key,opts);const n=t.querySelector(".ge-tot");if(n)el.innerHTML=n.innerHTML}

const fqTxt=w=>{w=Number(w)||0;return w===1?"1x per week":w===52?"1x per jaar":w===104?"1x per 2 jaar":w>0?"1x per "+w+" weken":""};

/* eenmalig: "Reiniging buitenkant" van Goten naar Reiniging gevelelementen (als "Goten reiniging buitenkant"),
   in de dienstenlijst én bij de klanten die het als opdracht hebben. Aantallen, prijs, frequentie en datums blijven gelijk. */
async function migGotenBuiten(){try{
  if((state.settings||{}).migGotenBuiten||window.ZEEM_MEEKIJK||(typeof isMw==="function"&&isMw()))return;
  const NM="Goten reiniging buitenkant",isB=it=>it&&/^(goten\s+)?reiniging buitenkant$/i.test(String(it.naam||"").trim());
  let gevelNaam="Reiniging gevelelementen",movedId=null;
  if(state.uitv&&Array.isArray(state.uitv.groepen)){const u=JSON.parse(JSON.stringify(state.uitv)),go=u.groepen.find(g=>g.id==="goten"),gv=u.groepen.find(g=>g.id==="gevel");
    if(gv)gevelNaam=gv.naam||gevelNaam;
    const it=go&&(go.items||[]).find(isB);
    if(it&&gv){go.items=go.items.filter(x=>x!==it);if(!(gv.items||[]).some(isB))gv.items=[...(gv.items||[]),{...it,naam:NM}];movedId=it.id;await save("instellingen","uitvoering",u);state.uitv=u;if(typeof U!=="undefined")U=null}}
  const gevelItems=()=>{const g=(state.uitv&&state.uitv.groepen||[]).find(x=>x.id==="gevel")||uitvDefault().groepen.find(x=>x.id==="gevel");return(g&&g.items||[]).map(x=>({...x,aantal:0}))};
  let n=0;
  for(const k of state.klanten){const ops=k.opdrachten||[];if(!ops.some(o=>o.groep==="goten"&&(o.items||[]).some(isB)))continue;
    let nieuw=ops.map(o=>({...o,items:(o.items||[]).map(x=>({...x}))}));
    nieuw.filter(o=>o.groep==="goten").forEach(o=>{const b=o.items.find(isB);if(!b)return;o.items=o.items.filter(x=>x!==b);
      if(Number(b.aantal)>0){o._weg=!o.items.some(x=>Number(x.aantal)>0);let gv=nieuw.find(x=>x.groep==="gevel");
        if(!gv){gv={id:newId("o"),groep:"gevel",naam:gevelNaam,dienst:gevelNaam,frequentie:o.frequentie,volgende:o.volgende||"",laatst:o.laatst||"",actief:o.actief!==false,items:gevelItems()};nieuw.push(gv)}
        gv.items=gv.items.filter(x=>!isB(x));gv.items.push({...b,naam:NM})}});
    nieuw=nieuw.filter(o=>!o._weg).map(o=>{const{_weg,...r}=o;return r});
    await save("klanten",k.id,{...strip(k),opdrachten:nieuw});n++}
  const sd={...state.settings,migGotenBuiten:true};await save("instellingen","bedrijf",sd);state.settings=sd;
  if(n)toast("Goten reiniging buitenkant staat nu onder "+gevelNaam+" ("+plural(n,"klant","klanten")+" bijgewerkt)")}catch(e){console.error("migGotenBuiten",e)}}
