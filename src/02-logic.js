/* ---------- LOGICA ---------- */
/* vaste weekdagen (bijv. VvE-trappenhuis elke di en vr): k.weekdagen = [2,5]; anders een interval in weken */
const vasteDagen=k=>Array.isArray(k&&k.weekdagen)&&k.weekdagen.length?[...new Set(k.weekdagen.map(Number))].filter(d=>d>=0&&d<=6).sort():null;
const volgendeWeekdag=(k,na)=>{const dg=vasteDagen(k);if(!dg)return null;let d=addDays(na,1);for(let i=0;i<8;i++){if(dg.includes(d.getDay()))return d;d=addDays(d,1)}return d};
const ritmeVolgende=(k,na)=>vasteDagen(k)?volgendeWeekdag(k,na):werkdagAanpassen(addDays(na,freqDays(k)));
const DAGK=["zo","ma","di","wo","do","vr","za"];
/* bijzondere frequenties: als heel groot aantal weken bewaard, zodat alle bestaande planning gewoon werkt (nooit vanzelf weer aan de beurt) */
const FQ_AFROEP=999,FQ_EENMALIG=998,fqSpec=w=>Number(w)===FQ_AFROEP||Number(w)===FQ_EENMALIG,fqSpecTxt=w=>Number(w)===FQ_AFROEP?"Op afroep":"Eenmalig";
const ritmeTxt=k=>{const dg=vasteDagen(k);if(dg)return(dg.length===7?"elke dag":dg.map(d=>DAGK[d]).join(" · "));const f=Number(k.frequentie)||4;if(fqSpec(f))return fqSpecTxt(f).toLowerCase();return"elke "+f+" wk"};
const freqDays=k=>{const dg=vasteDagen(k);return dg?Math.max(1,Math.round(7/dg.length)):(Number(k.frequentie)||4)*7};
/* aanboddatum per verdieping (opdracht) bepaalt mee wanneer de klant weer aan de beurt is */
const aanbodVan=k=>{const q=k&&k.ramenRegel;if(!q||!Array.isArray(q.f))return null;const idx=q.f.map((n,i)=>Number(n)>0?i:-1).filter(i=>i>=0);if(!idx.length)return null;
  const ds=idx.map(i=>(q.vol||[])[i]).filter(d=>d&&(!k.laatst||d>k.laatst));if(!ds.length)return null;return {min:ds.slice().sort()[0],alle:ds.length===idx.length}};
const volgende=k=>{const l=parse(k.laatst);let v=l?(vasteDagen(k)?volgendeWeekdag(k,l):addDays(l,freqDays(k))):(vasteDagen(k)?(vasteDagen(k).includes(today().getDay())?today():volgendeWeekdag(k,today())):today());{const ab=parse(k.aanbodVanaf);if(ab&&(!l||l<ab))v=ab}const a=aanbodVan(k);if(a){const av=parse(a.min);if(av&&(a.alle||av<v))v=av}const sk=parse(k.skipTot);if(sk&&sk>v)v=sk;return v};
const planned=k=>parse(k.gepland)||volgende(k);
const toMin=t=>{const m=String(t||"").match(/^(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null};
const fromMin=m=>pad(Math.floor(m/60))+":"+pad(m%60);
const duurBasis=k=>Number(k.duur)||30;
/* bedrag van de afspraak: eigen dienst plus extra opdrachten die die dag mee gaan (zelfde opslag als k.prijs) */
const prijsMee=(k,d)=>{let p=Number(k&&k.prijs)||0;try{if(S().glasMee!==false&&typeof extraDue==="function")extraDue(k,d||k.gepland||iso(today())).forEach(o=>{p+=Number(o.prijs)||0})}catch(e){}return r2(p)};
/* tijd van de afspraak: de vaste duur plus extra opdrachten die die dag mee gaan (dakkapel, goten…) */
const duur=k=>{let m=duurBasis(k);try{if(S().glasMee!==false&&typeof extraDue==="function"){const d=k.gepland||iso(today());extraDue(k,d).forEach(o=>{m+=Number(o.duur)||0})}}catch(e){}return m};
const uren=m=>(Math.round(m/60*10)/10).toLocaleString("nl-NL")+"u";
const actief=()=>state.klanten.filter(k=>k.actief!==false&&!k.prospect);
const rondes=()=>[...new Set(state.klanten.map(k=>k.ronde).filter(Boolean))].sort();
const unbilled=()=>state.beurten.filter(b=>!b.gefactureerd&&!b.betaald);
const intervalTxt=k=>{if(vasteDagen(k))return ritmeTxt(k);const f=Number(k.frequentie)||4;if(fqSpec(f))return fqSpecTxt(f).toLowerCase();return f===1?"week":f+" weken"};
function status(k){
  const v=planned(k),t=today(),diff=Math.round((v-t)/DAY);
  const l=parse(k.laatst);const pct=l?Math.min(1,Math.max(0,(t-l)/DAY/freqDays(k))):1;
  if(!k.laatst&&!k.gepland)return{cls:"late",txt:"Nog niet gewassen",diff:-999,v,pct};
  if(diff<0)return{cls:"late",txt:Math.abs(diff)+" dg te laat",diff,v,pct};
  if(diff===0)return{cls:"soon",txt:"Vandaag",diff,v,pct};
  if(diff===1)return{cls:"soon",txt:"Morgen",diff,v,pct};
  if(diff<=7)return{cls:"soon",txt:(w=>w.charAt(0).toUpperCase()+w.slice(1))(v.toLocaleDateString("nl-NL",{weekday:"long"})),diff,v,pct};
  return{cls:"ok",txt:fmtD(v),diff,v,pct};
}
function occurrences(k,from,to){
  const out=[],t=today();let d=parse(k.gepland),real=true;
  if(!d)return out;
  const stap=x=>vasteDagen(k)?volgendeWeekdag(k,x):addDays(x,freqDays(k));
  if(d<t){d=stap(t);real=false}
  /* alleen deze afspraak verplaatst: de verwachte afspraken daarna volgen het oorspronkelijke ritme */
  const em=k.eenmalig&&k.eenmalig.van&&!vasteDagen(k)?parse(k.eenmalig.van):null;
  let g=0;while(d<=to&&g++<120){if(d>=from)out.push({date:iso(d),real});d=real&&em?stap(em):stap(d);real=false}
  return out;
}
const overdue=()=>actief().filter(k=>{const p=parse(k.gepland);return p?p<today():dueOf(k)<today()});/* dueOf telt ook extra opdrachten mee */
const dueOf=k=>{const p=parse(k.gepland);if(p&&p<today())return p;if(k.aanbieden&&!p)return today();const v=volgende(k);let e=null;try{const w=S().glasMee===false?"":extraWanneer(k);e=w&&parse(w)}catch(_){}return e&&e<v?e:v};
function teplannen(upTo){const t=today(),ti=iso(t);return actief().filter(k=>{if(k.uitstelTot&&k.uitstelTot>ti&&!k.gepland)return false;if(k.einddatum&&k.einddatum<ti&&!k.gepland)return false;if(k.opdrachtVerwijderd&&!k.gepland)return false;if(Number(k.maxOpen)>0&&!k.gepland&&state.facturen.filter(f=>f.klantId===k.id&&f.soort!=="offerte"&&["Openstaand","Achterstallig"].includes(fStatus(f)[1])).length>=Number(k.maxOpen))return false;const p=parse(k.gepland);if(p&&p>t){/* al ingepland, maar een verdieping is eerder aan de beurt dan toen je hem inplande: dan toch aanbieden om eerder te plannen.
    Heb je hem bewust na die datum ingepland (aanbodGezien), dan staat hij alleen in de agenda. */const a=aanbodVan(k),av=a&&parse(a.min);if(av&&av<p&&av<=upTo&&(!k.aanbodGezien||a.min<k.aanbodGezien))return true;
      const ew=S().glasMee===false?"":extraWanneer(k),ed=ew&&parse(ew);return !!(ed&&ed<p&&ed<=upTo&&(!k.aanbodGezien||ew<k.aanbodGezien))}if(p)return p<t;
    /* staat bij elke verdieping een aanboddatum en ligt de vroegste na de gekozen datum, dan nog niet aanbieden (ook niet als hij als nieuw/aanbieden is gemarkeerd) */
    {const a=aanbodVan(k),av=a&&a.alle&&parse(a.min);if(av&&av>upTo)return extraAanBeurt(k,upTo)}
    /* "aanbieden vanaf" (of bij een losse opdracht: "Volgende keer" bij de opdracht van de hoofdklant) ligt na de gekozen datum: nog niet aanbieden */
    {const u=upTo instanceof Date?upTo:parse(upTo)||t;let ab=parse(k.aanbodVanaf);
      if(k.hoofdKlantId){const h=state.klanten.find(x=>x.id===k.hoofdKlantId),o=h&&(h.opdrachten||[]).find(x=>x.id===k.opdrachtId),ov=o&&parse(o.volgende);if(ov&&(!k.laatst||o.volgende>k.laatst))ab=ov}
      if(ab&&ab>u&&(!k.laatst||iso(ab)>k.laatst))return extraAanBeurt(k,upTo)}
    return k.aanbieden||volgende(k)<=upTo||extraAanBeurt(k,upTo)}).sort((a,b)=>dueOf(a)-dueOf(b))}
/* een andere dienst (bv. reiniging gevelelementen) is aan de beurt: dan komt de klant bij Te plannen en gaat de glasbewassing mee */
/* vroegste datum waarop een extra opdracht (dakkapel, goten, gevel…) aan de beurt is, ook per onderdeel met een eigen frequentie.
   Nog nooit gedaan = nu aan de beurt. Zelfde opdrachten als extraDue (zelfde adres, niet apart ingepland). */
function extraWanneer(k){let min="";const ti=iso(today()),zet=d=>{if(d&&(!min||d<min))min=d};
  try{extraOpdr(k).forEach(o=>{const ov=o.volgende||(o.laatst?"":ti);
    const its=(o.items||[]).filter(it=>Number(it.aantal)>0);
    if(!its.length){zet(ov);return}
    its.forEach(it=>zet(it.vol||(it.fq?(o.laatst&&o.volgende?o.volgende:ti):ov)))})}catch(e){}
  return min&&min<ti?ti:min}
function extraAanBeurt(k,upTo){if(S().glasMee===false)return false;const u=iso(upTo instanceof Date?upTo:parse(upTo)||today()),e=extraWanneer(k);return !!e&&e<=u}
/* vroegste aanbod: verdieping met eigen aanboddatum of extra opdracht */
function aanbodMinAlles(k){const a=(typeof aanbodVan==="function"&&aanbodVan(k)||{}).min||"",e=S().glasMee===false?"":extraWanneer(k);return [a,e].filter(Boolean).sort()[0]||""}
function dueTxt(k){
  const p=parse(k.gepland),t=today();
  if(p&&p<t)return{cls:"late",txt:"Gepland "+fmtD(p)+", niet gedaan"};
  if(!k.laatst)return{cls:"late",txt:"Nog nooit gewassen"};
  const v=volgende(k),d=Math.round((v-t)/DAY);
  if(d<0)return{cls:"late",txt:Math.abs(d)+" dg te laat"};
  if(d===0)return{cls:"soon",txt:"Vandaag aan de beurt"};
  return{cls:d<=7?"soon":"ok",txt:"Vanaf "+wd(v)+" "+fmtD(v)};
}
const isBezig=k=>{if(!k||!k.bezig)return false;const d=new Date(k.bezig);return !isNaN(d)&&iso(d)===iso(today())};
/* tijdregistratie: start/stop per job, gemiddelde van de laatste 5 metingen wordt de duur voor de planning */
const fmtTimer=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+":"+String(m).padStart(2,"0"):String(m))+":"+String(x).padStart(2,"0")};
const timerHtml=k=>`<span class="tmr" data-timer="${esc(k.bezig)}">${fmtTimer(Date.now()-new Date(k.bezig))}</span>`;
const gemTijd=k=>{const t=(k.tijden||[]).slice(-5);return t.length?Math.round(t.reduce((a,x)=>a+(Number(x.min)||0),0)/t.length):0};
function metingPatch(k,min){/* gemeten tijd zonder de extra opdrachten van vandaag: de vaste duur is alleen de eigen dienst */
  try{if(S().glasMee!==false&&typeof extraDue==="function"){const ex=extraDue(k,iso(today())).reduce((a,o)=>a+(Number(o.duur)||0),0);if(ex)min=Math.max(1,Math.round(min-ex))}}catch(e){}
  const tijden=[...(k.tijden||[]),{datum:iso(today()),min}].slice(-20),t=tijden.slice(-5),gem=Math.round(t.reduce((a,x)=>a+x.min,0)/t.length);
  return {tijden,duur:Math.max(5,Math.ceil(gem/5)*5)}}
/* een meting die veel korter is dan de geplande duur (bijv. per ongeluk Start en meteen Afmelden) is geen echte meting:
   die telt niet mee voor de planning en niet als facturabele tijd */
const meetTeKort=(min,plan)=>(Number(min)||0)<Math.max(5,0.3*(Number(plan)||0));
const beurtTeKort=b=>{if(!b.gemeten)return false;const k=state.klanten.find(x=>x.id===b.klantId);return !!k&&meetTeKort(b.duur,duur(k))};
const beurtMin=b=>{const k=state.klanten.find(x=>x.id===b.klantId),m=Number(b.duur)||0;return m&&!beurtTeKort(b)?m:(k?duur(k):m)};
const lopendeMin=k=>isBezig(k)?Math.max(0,Math.round((Date.now()-new Date(k.bezig))/60000)):null;
function jobState(k,day){
  if(state.beurten.some(b=>b.klantId===k.id&&b.datum===day))return"afgerond";
  /* gestart vandaag: ook bezig tonen als je de stop op een andere dag (bijv. de geplande datum) bekijkt */
  return isBezig(k)&&(day===iso(today())||day===k.gepland)?"bezig":"gepland";
}
const STATEPILL={gepland:["plan","Gepland"],bezig:["busy","Bezig"],afgerond:["ok","Afgerond"]};
function nextFree(dayIso){let e=8*60;actief().filter(k=>k.gepland===dayIso&&toMin(k.tijd)!=null).forEach(k=>{e=Math.max(e,toMin(k.tijd)+duur(k))});actief().forEach(k=>(k.reeks||[]).forEach(r=>{if(r&&r.d===dayIso&&toMin(r.t)!=null)e=Math.max(e,toMin(r.t)+duur(k))}));e=Math.ceil(e/15)*15;return fromMin(Math.min(e,19*60))}
const dienstHtml=k=>`<span class="dienst">${I.wrench}${esc(k.dienst||"Glasbewassing")}</span>`;
/* alle diensten van deze afspraak: eigen dienst + extra opdrachten die die dag mee gaan (bv. "Reiniging dakkapel 2x") */
function dienstenVan(k,d){const l=[{naam:k.dienst||"Glasbewassing",extra:false}];
  try{if(S().glasMee!==false&&typeof extraDue==="function")extraDue(k,d||k.gepland||iso(today())).filter(o=>o.actief!==false).forEach(o=>{const its=(o.items||[]).filter(x=>Number(x.aantal)>0),n=its.reduce((a,x)=>a+(Number(x.aantal)||0),0);l.push({naam:(o.dienst||o.naam||"Extra")+(its.length===1&&n>1?" "+n+"x":""),extra:true})})}catch(e){}return l}
const dienstenHtml=(k,d)=>`<span class="tj-dn">${dienstenVan(k,d).map(x=>`<span class="tj-dc${x.extra?" ex":""}">${x.extra?I.plus:I.wrench}${esc(x.naam)}</span>`).join("")}</span>`;

/* objecten en adressen */
/* objectId "hoofd" = bewust het hoofdadres van de klant (anders valt hij terug op de eerste locatie) */
const jobObj=k=>{if(k&&k.objectId==="hoofd")return null;const os=k.objecten||[];return os.find(o=>o.id===k.objectId)||os[0]||null};
const jobAddrObj=k=>{const o=jobObj(k);return o&&o.adres?o:k};
const jobAddr=k=>fullAddr(jobAddrObj(k));
/* uitvoerlocatie: waar een opdracht wordt uitgevoerd. "hoofd" = het hoofdadres van de klant (ook het factuuradres), anders de id van een locatie.
   hoofdLoc = locatie van de hoofdopdracht; opdrLoc = locatie van een extra opdracht (leeg = oude opdracht zonder keuze: zelfde plek als de hoofdopdracht) */
const hoofdLoc=k=>{if(!k||k.objectId==="hoofd")return"hoofd";const o=jobObj(k);return o&&o.adres?o.id:"hoofd"};
const opdrLoc=(k,o)=>{const id=o&&o.objectId;return id?id:hoofdLoc(k)};
const locAdr=(k,id)=>{const o=id&&id!=="hoofd"&&((k&&k.objecten)||[]).find(x=>x.id===id&&x.adres);return o?fullAddr(o):fullAddr(k||{})};
const locNaam=(k,id)=>{const o=id&&id!=="hoofd"&&((k&&k.objecten)||[]).find(x=>x.id===id&&x.adres);return o?(o.naam||""):(k&&k.locOms)||"Hoofdadres"};
const mapsQ=k=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(jobAddr(k));
/* opdrachten: de hoofdopdracht staat op de klant zelf, extra opdrachten (goten, zonnepanelen…) liften mee met de beurt waarop ze aan de beurt zijn */
const isEersteKeer=k=>k.eersteKeer!=null?!!k.eersteKeer:!state.beurten.some(b=>b.klantId===k.id);
const freqLabel=w=>{w=Number(w)||4;if(fqSpec(w))return fqSpecTxt(w);const el=typeof freqEigenLabel==="function"?freqEigenLabel(w):"";if(el)return el;return w===52?"Elk jaar":w===26?"Elk half jaar":w===13?"Elk kwartaal":"Elke "+w+" "+(w===1?"week":"weken")};
/* bij welke opdracht hoort een extra dienst? Gekoppeld (o.bij), of anders: dezelfde locatie als een losse (apart ingeplande) opdracht.
   Zo gaat een dienst alleen mee met de glasbewassing op hetzelfde adres; andere adressen staan er los van. */
function opdrBij(k,o){const L=(k&&k.opdrachten)||[];if(!o||o.apart)return"";
  if(o.bij&&o.bij!==o.id&&L.some(p=>p.id===o.bij&&p.actief!==false))return o.bij;
  const loc=opdrLoc(k,o);if(loc===hoofdLoc(k))return"";
  /* hoofdopdracht van die locatie: de apart ingeplande, anders de glasbewassing, anders de eerste */
  const c=L.filter(p=>p.actief!==false&&opdrLoc(k,p)===loc&&!p.bij),r=c.find(p=>p.apart)||c.find(p=>p.ramen||/glas/i.test(p.dienst||""))||c[0];return r&&r.id!==o.id?r.id:""}
const extraOpdr=k=>{
  if(k&&k.hoofdKlantId){const h=state.klanten.find(x=>x.id===k.hoofdKlantId);return h?(h.opdrachten||[]).filter(o=>o.actief!==false&&opdrBij(h,o)===k.opdrachtId):[]}
  const L=(k&&k.opdrachten)||[];return L.filter(o=>o.actief!==false&&!o.apart&&!opdrBij(k,o)&&opdrLoc(k,o)===hoofdLoc(k))};/* op een ander adres nooit mee met het hoofdadres *//* apart ingeplande opdrachten gaan niet mee met de glasbewassing */
const extraDue=(k,day)=>{const d=day||iso(today()),out=[];extraOpdr(k).forEach(o=>{const oDue=!o.volgende||o.volgende<=d;
    if(!o.items||typeof groepCalc!=="function"){if(oDue)out.push(o);return}
    const c=groepCalc(o,it=>it.fq?(!it.vol||it.vol<=d):(!it.vol||it.vol<=d));if(!c.rows.length&&!(c.vast&&oDue))return;const st=S(),mul=st.incl?1+(Number(st.btw)||21)/100:1;
    out.push({...o,items:c.rows.map(r=>r.it),prijs:r2(c.ex*mul),duur:gHasD(o.td)?Number(o.td)||0:Math.max(c.rows.length?1:0,Math.round((c.sec||0)/60)),_oDue:oDue})});return out};
const gHasD=v=>v!==undefined&&v!==null&&v!=="";
/* losse opdracht afgemeld: de diensten die erbij horen staan bij de hoofdklant; daar de volgende datum doorschuiven */
async function extraNaBij(k,d,ed){try{if(!k||!k.hoofdKlantId||!(ed||[]).length)return;const h=state.klanten.find(x=>x.id===k.hoofdKlantId);if(!h)return;
  await save("klanten",h.id,{...strip(h),opdrachten:extraNa(h,d,ed)})}catch(e){console.error("extraNaBij",e)}}
/* na de beurt: volgende datum van extra opdrachten en van onderdelen met een eigen frequentie doorschuiven */
const extraNa=(k,d,ed)=>(k.opdrachten||[]).map(o=>{const x=ed.find(y=>y.id===o.id);if(!x)return o;const n={...o,laatst:d};
  if(!o.items||x._oDue!==false)n.volgende=iso(addDays(parse(d),(Number(o.frequentie)||52)*7));
  if(o.items)n.items=o.items.map(it=>it.fq&&x.items.some(y=>y.id===it.id)?{...it,vol:iso(addDays(parse(d),Number(it.fq)*7))}:it);return n});
function objInfo(k,day){const o=jobObj(k)||{};const it=[];
  try{if(k.ramenRegel&&ramenVariabel(normR(k.ramenRegel))){const {q,due}=ramenDue(k,day||iso(today()));const parts=q.f.map((n,i)=>n&&due.f[i]?FLN[i].toLowerCase()+" ("+n+")":"").filter(Boolean);it.push(`<span><b>Deze keer</b> ${esc(parts.join(", ")||"niets")}</span>`)}}catch(e){}
  if(isEersteKeer(k))it.push(`<span><b>Eerste keer</b> ja</span>`);
  const ed=extraDue(k,day);if(ed.length)it.push(`<span><b>Ook</b> ${ed.map(x=>esc(x.dienst)).join(", ")}${S().glasMee!==false?` <small class="subt">· ${esc((k.dienst||"Glasbewassing").toLowerCase())} gaat mee</small>`:""}</span>`);
  if(o.toegang)it.push(`<span><b>Toegang</b> ${esc(o.toegang)}</span>`);
  if(o.alarmcode)it.push(`<span><b>Alarm</b> <button type="button" class="reveal" data-act="reveal" data-v="${esc(o.alarmcode)}">${I.lock}Toon code</button></span>`);
  if(o.parkeren)it.push(`<span><b>Parkeren</b> ${esc(o.parkeren)}</span>`);
  if(o.materialen)it.push(`<span><b>Mee</b> ${esc(o.materialen)}</span>`);
  if(o.ramen)it.push(`<span><b>Ramen</b> ${esc(o.ramen)}</span>`);
  return it.length?`<div class="objinfo">${it.join("")}</div>`:""}

/* route */
const huisnr=a=>{const m=String(a||"").match(/(\d+)\s*([a-z]?)\s*$/i);return m?Number(m[1]):0};
const straat=a=>String(a||"").replace(/\s*\d+.*$/,"").toLowerCase();
const geoCmp=(a,b)=>{const A=jobAddrObj(a),B=jobAddrObj(b);return String(A.postcode||"").slice(0,4).localeCompare(String(B.postcode||"").slice(0,4))||straat(A.adres).localeCompare(straat(B.adres))||huisnr(A.adres)-huisnr(B.adres)};
function routeStops(day){
  const isToday=day===iso(today());
  let ks=actief().filter(k=>{const p=parse(k.gepland);return p&&(k.gepland===day||(isToday&&p<today()))});
  const doneIds=state.beurten.filter(b=>b.datum===day).map(b=>b.klantId);
  ks=[...ks,...state.klanten.filter(k=>doneIds.includes(k.id)&&!ks.includes(k))];
  const order=state.routes[day]?.order||[];
  ks.sort((a,b)=>{const ia=order.indexOf(a.id),ib=order.indexOf(b.id);if(ia>-1||ib>-1)return(ia<0?999:ia)-(ib<0?999:ib);const ta=toMin(a.tijd)??9999,tb=toMin(b.tijd)??9999;if(ta!==tb)return ta-tb;return geoCmp(a,b)});
  return ks.map(k=>({k,done:doneIds.includes(k.id)}));
}
function routeLinks(stops){
  const addrs=stops.filter(s=>!s.done).map(s=>jobAddr(s.k)).filter(Boolean);
  const start=S().startadres;const out=[];
  for(let i=0;i<addrs.length;i+=9){
    const chunk=addrs.slice(i,i+9),origin=i===0?(start||""):addrs[i-1],dest=chunk[chunk.length-1],way=chunk.slice(0,-1);
    out.push("https://www.google.com/maps/dir/?api=1"+(origin?"&origin="+encodeURIComponent(origin):"")+"&destination="+encodeURIComponent(dest)+(way.length?"&waypoints="+encodeURIComponent(way.join("|")):"")+"&travelmode=driving");
  }
  return out;
}
function waLink(tel,text){
  let d=String(tel||"").replace(/[^\d+]/g,"");if(!d)return"";
  if(d.startsWith("+"))d=d.slice(1);else if(d.startsWith("00"))d=d.slice(2);else if(d.startsWith("0"))d="31"+d.slice(1);
  return "https://wa.me/"+d+(text?"?text="+encodeURIComponent(text):"");
}

/* geld */
const exAmt=x=>S().incl?(Number(x)||0)/(1+Number(S().btw)/100):(Number(x)||0);
/* omzet van één afgemelde beurt, ex btw, overal hetzelfde (statistieken, analyse, werkdag):
   - gefactureerd: het deel van de factuur (totaal ex btw gedeeld door het aantal beurten op die factuur), met de btw van die factuur zelf (ook verlegd)
   - niet factureren: 0 · geannuleerd: 0 · periodiek zonder bedrag: de prijs van de klant · anders: het bedrag van de beurt */
let _BO=null;
function boMap(){if(_BO&&_BO.b===state.beurten&&_BO.f===state.facturen)return _BO;const F={},n={};(state.facturen||[]).forEach(f=>F[f.id]=f);
  (state.beurten||[]).forEach(b=>{if(b.gefactureerd&&F[b.gefactureerd])n[b.gefactureerd]=(n[b.gefactureerd]||0)+1});return _BO={b:state.beurten,f:state.facturen,F,n}}
function beurtOmzet(b){if(!b||b.geannuleerd||b.gefactureerd==="nvt")return 0;const M=boMap(),f=b.gefactureerd&&M.F[b.gefactureerd];
  if(f&&f.soort!=="offerte")return totals(f).ex/(M.n[f.id]||1);
  if(b.periodiek&&!Number(b.bedrag)){const k=state.klanten.find(x=>x.id===b.klantId);return k?exAmt(k.prijs):0}
  return exAmt(b.bedrag)}
/* was een klant actief in (een deel van) de periode s..e (iso)? Zelfde regel voor Statistieken › Klanten en Analyse */
function klantActiefIn(k,s,e,laatstB){if(k.prospect||k.hoofdKlantId)return false;const a=String(k.aangemaakt||"").slice(0,10);if(a&&a>e)return false;if(k.actief!==false)return true;
  const stop=String(k.inactiefOp||k.gepauzeerdOp||(laatstB&&laatstB[k.id])||"").slice(0,10);return !!stop&&stop>=s}
/* btw per regel: een regel kan een eigen tarief hebben (bijv. 9% voor trappenhuis van een VvE of glasbewassing binnen),
   anders geldt het tarief van de factuur. Btw verlegd / 0% op de factuur = alle regels 0%. */
function rBtw(f,r){const fb=f&&f.btw!=null&&f.btw!==""?Number(f.btw):Number(S().btw);if(f&&f.btw!=null&&Number(f.btw)===0)return 0;
  return r&&r.btw!=null&&r.btw!==""&&!isNaN(Number(r.btw))?Number(r.btw):fb}
function totals(f){
  const incl=f.incl??S().incl,g={};
  (f.regels||[]).forEach(r=>{const p=rBtw(f,r);(g[p]=g[p]||{pct:p,som:0}).som+=(Number(r.aantal)||0)*(Number(r.prijs)||0)});
  if(!Object.keys(g).length){const p=rBtw(f,null);g[p]={pct:p,som:0}}
  let ex=0,inc=0;const tarieven=Object.values(g).sort((a,b)=>b.pct-a.pct).map(x=>{const e=incl?x.som/(1+x.pct/100):x.som,i=incl?x.som:x.som*(1+x.pct/100);ex+=e;inc+=i;return{pct:x.pct,ex:r2(e),btw:r2(i-e),inc:r2(i)}});
  return{ex:r2(ex),btw:r2(inc-ex),inc:r2(inc),tarieven};
}
/* welk tarief hoort bij een regel? Nederland: schoonmaak van woningen valt onder 9%:
   - VvE: trappenhuis, entree, galerij, lift, bergingen en ramen binnen (gemeenschappelijke ruimtes van een woongebouw)
   - particulier: glasbewassing binnen. Buiten, gevel, zonnepanelen, goten en zakelijke klanten blijven 21%.
   Aan/uit bij Instellingen › Land, valuta & BTW. null = tarief van de factuur. */
function btwRegel(k,oms){const st=S();if(!k||k.btwVerlegd||(st.land||"NL")!=="NL")return null;const o=String(oms||"").toLowerCase();
  if(/buiten|gevel|zonnepan|goot|goten|dakkapel|dakgoot|kozijn|schoorsteen|rolluik|hogedruk/.test(o))return null;
  if(k.soort==="vve"&&st.btw9Vve!==false&&/trap|schoonma|entree|portiek|galerij|lift|berging|kelder|binnen|hal\b|gang/.test(o))return 9;
  if(k.soort!=="zakelijk"&&k.soort!=="vve"&&st.btw9Binnen!==false&&/binnen/.test(o)&&/glas|raam|ramen|wassen/.test(o))return 9;
  return null}
/* bij opslaan van een nieuwe of conceptfactuur/-offerte: regels zonder eigen tarief krijgen het tarief van hierboven (verstuurde facturen blijven ongemoeid) */
function btwRegels(k,regels){return (regels||[]).map(r=>{if(r.btw!=null&&r.btw!=="")return r;const b=btwRegel(k,r.omschrijving);return b==null?r:{...r,btw:b}})}
function btwVast(data,nieuw){if(!data||!["factuur","offerte"].includes(data.soort)||!Array.isArray(data.regels))return data;if(!nieuw&&data.status!=="concept")return data;
  const k=(state.klanten||[]).find(x=>x.id===data.klantId);if(!k)return data;return {...data,regels:btwRegels(k,data.regels)}}
function fStatus(f){
  if(f.soort==="offerte")return({concept:["neutral","Concept"],verstuurd:["soon","Verstuurd"],geaccepteerd:["ok","Geaccepteerd"],afgewezen:["late","Afgewezen"]})[f.status||"concept"]||["neutral","Concept"];
  if(f.status==="betaald")return["ok","Betaald"];
  if(f.status==="concept")return["neutral","Concept"];
  if(f.status==="oninbaar")return["neutral","Oninbaar"];
  if(f.verval&&parse(f.verval)<today())return["late","Achterstallig"];
  return["soon","Openstaand"];
}
const facturen=()=>state.facturen.filter(f=>f.soort!=="offerte");
const offertes=()=>state.facturen.filter(f=>f.soort==="offerte");
const echteFacturen=()=>facturen().filter(f=>f.status!=="concept");
/* factuurnummers: standaard 2026-0001 per jaar; met "doorlopend" (zoals DienstenCRM) 26-009295: jaar in 2 cijfers en een
   volgnummer van 6 cijfers dat over de jaren doorloopt, startend bij het laatste nummer uit het oude pakket + 1 */
function nrDelen(nr){const m=String(nr||"").match(/^(.*?)(\d+)$/);return m?{pre:m[1],n:parseInt(m[2],10),pad:m[2].length}:{pre:String(nr||""),n:0,pad:4}}
function nextNr(soort,datum,skip=0){
  const y=String(datum).slice(0,4),st=S();
  if(soort!=="offerte"&&st.factNrStijl==="doorlopend"){const pre=y.slice(2)+"-",start=Math.max(0,parseInt(st.factNrStart,10)||0);
    const ns=state.facturen.filter(f=>f.soort!=="offerte"&&/^\d{2}-\d{6}$/.test(String(f.nummer||""))).map(f=>parseInt(String(f.nummer).slice(3),10)||0);
    return pre+String(Math.max(start-1,...ns)+1+skip).padStart(6,"0")}
  const pre=soort==="offerte"?"OFF-"+y+"-":y+"-";
  const ns=state.facturen.filter(f=>String(f.nummer||"").startsWith(pre)).map(f=>parseInt(String(f.nummer).slice(pre.length),10)||0);
  return pre+String(Math.max(0,...ns)+1+skip).padStart(soort==="offerte"?3:4,"0");
}
const kostEx=c=>(Number(c.bedrag)||0)/(1+(Number(c.btw)||0)/100);
const kostBtw=c=>(Number(c.bedrag)||0)-kostEx(c);
function periodRange(jaar,per){
  if(per==="jaar")return[new Date(jaar,0,1),new Date(jaar,11,31)];
  if(per[0]==="q"){const q=Number(per[1])-1;return[new Date(jaar,q*3,1),new Date(jaar,q*3+3,0)]}
  const m=Number(per.slice(1));return[new Date(jaar,m,1),new Date(jaar,m+1,0)];
}
const inRange=(s,[a,b])=>{const d=parse(s);return d&&d>=a&&d<=b};
function fin(range){
  const fs=echteFacturen().filter(f=>inRange(f.datum,range)),ks=state.kosten.filter(c=>inRange(c.datum,range));
  const omzet=fs.reduce((a,f)=>a+totals(f).ex,0),btwOmzet=fs.reduce((a,f)=>a+totals(f).btw,0);
  /* btw-aangifte per rubriek: 1a hoog (21%), 1b laag (9%), 1e 0% of verlegd */
  const rub={a:{omzet:0,btw:0},b:{omzet:0,btw:0},e:{omzet:0,btw:0}};fs.forEach(f=>(totals(f).tarieven||[]).forEach(x=>{const k=x.pct>=15?"a":x.pct>0?"b":"e";rub[k].omzet+=x.ex;rub[k].btw+=x.btw}));
  const kosten=ks.reduce((a,c)=>a+kostEx(c),0),voorbelasting=ks.reduce((a,c)=>a+kostBtw(c),0);
  return{fs,ks,rub,omzet:r2(omzet),btwOmzet:r2(btwOmzet),kosten:r2(kosten),voorbelasting:r2(voorbelasting),winst:r2(omzet-kosten),btwSaldo:r2(btwOmzet-voorbelasting)};
}
const qDeadline=(y,q)=>new Date(y,q*3+1,0);// laatste dag van de maand na het kwartaal (q = 1..4)
function aangifteStatus(){
  const t=today(),cq=Math.floor(t.getMonth()/3)+1;
  let y=t.getFullYear(),q=cq-1;if(q===0){q=4;y--}
  const out=[];for(let i=0;i<5;i++){let yy=y,qq=q-i;while(qq<1){qq+=4;yy--}out.push({y:yy,q:qq,key:yy+"-Q"+qq,deadline:qDeadline(yy,qq),gedaan:!!state.aangiftes[yy+"-Q"+qq]})}
  return out;
}

/* berichten */
function normTpl(d,sv){sv=sv||{};const r={...d,...sv,eigen:!d.naam};r.mail=sv.mail??sv.tekst??d.mail??"";r.sms=sv.sms??(sv.mail==null&&sv.tekst!=null&&!d.naam?sv.tekst:d.sms)??"";r.onderwerp=sv.onderwerp??d.onderwerp??"Bericht van [name.company]";if(isRich(r.mail)){r.mailHtml=r.mail;r.mail=richText(r.mail)}r.tekst=r.sms||r.mail;return r}
/* sjablonen die niet meer bestaan (ook niet als er ooit een aangepaste versie van is opgeslagen) */
const TPL_WEG=["voltooid"];
const tpls=()=>{const o={};Object.keys(TPL).forEach(k=>o[k]=normTpl(TPL[k],state.sjablonen[k]));Object.keys(state.sjablonen).forEach(k=>{if(!o[k]&&state.sjablonen[k]&&!TPL_WEG.includes(k))o[k]=normTpl({},state.sjablonen[k])});return o};
function klantVars(k,datum){
  const st=S(),tm=toMin(k.tijd),tv=tm!=null?"tussen "+k.tijd+" en "+fromMin(tm+duur(k)):"in de loop van de dag";
  const _ach=k.achternaam||String(k.naam||"").split(",")[0].trim();
  const _dg=datum?iso(datum):(k.gepland||iso(planned(k)));let _dl=[];try{_dl=[k.dienst||"Glasbewassing",...(typeof extraDue==="function"?extraDue(k,_dg):[]).filter(o=>o.actief!==false).map(o=>o.dienst||o.naam||"Dienst")]}catch(e){_dl=[k.dienst||"Glasbewassing"]}
  const _ao=jobAddrObj(k),_cn=cleanName(k.naam),_nat=!isZak(k)&&/,/.test(_cn)?_cn.split(",").map(x=>x.trim()).reverse().join(" "):_cn;
  const _sp=a=>{const m=String(a||"").match(/^(.*?)\s+(\d+\s*\S*)$/);return m?[m[1],m[2]]:[String(a||""),""]},[_ps,_ph]=_sp(k.straat?(k.straat+" "+(k.huisnr||"")+(k.toev||"")).trim():k.adres),[_us,_uh]=_sp(_ao.adres);
  let _sub=[];try{_sub=[(k.dienst||"Glasbewassing")+(k.ramenRegel&&typeof normR==="function"?": "+normR(k.ramenRegel).f.map((n,i)=>n?(["begane grond","1e verdieping","2e verdieping","3e verdieping"][i]+" "+n+" st"):"").filter(Boolean).join(", "):""),...(typeof extraDue==="function"?extraDue(k,_dg):[]).filter(o=>o.actief!==false).map(o=>(o.dienst||"Dienst")+((o.items||[]).length?": "+o.items.filter(x=>Number(x.aantal)>0).map(x=>x.naam+" "+x.aantal+" "+(typeof eenhKort==="function"?eenhKort(x.eenheid):"")).join(", "):""))]}catch(e){}
  const _dd=parse(_dg),_tm=toMin(k.tijd),_wk=_dd?(()=>{const d=new Date(Date.UTC(_dd.getFullYear(),_dd.getMonth(),_dd.getDate()));const n=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-n);const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil(((d-y)/864e5+1)/7)})():"";
  const _tags={"number.customer":k.klantnr||"","lastname.customer":_ach,"sex.customer":k.geslacht||"","company.customer":k.bedrijfsnaam||(isZak(k)?cleanName(k.naam):""),"street.customer":_ps,"housenumber.customer":_ph,"postal.customer":k.postcode||"","city.customer":k.plaats||"","email.customer":k.email||"","phone.customer":k.mobiel||k.telefoon||"",
    "daypart.appointment":_tm==null?"":_tm<720?"ochtend":_tm<1080?"middag":"avond","weeknumber.appointment":String(_wk),"subservices.appointment":_sub.map(x=>"• "+x).join("\n"),"articles.appointment":(k.artikelen||[]).map(a=>"• "+(a.aantal||1)+"× "+(a.naam||a.omschrijving||"")).join("\n"),
    "address.appointment":_us,"housenumber.appointment":_uh,"postal.appointment":_ao.postcode||k.postcode||"","location.appointment":(typeof jobObj==="function"&&jobObj(k)&&jobObj(k).naam)||"","confirm_link.appointment":""};
  return{..._tags,diensten:_dl.map(x=>"• "+x).join("\n"),straat:_ao.adres||"",plaats:_ao.plaats||"",aanhef:k.geslacht==="man"?"heer "+_ach:k.geslacht==="vrouw"?"mevrouw "+_ach:isZak(k)?"heer/mevrouw":"heer/mevrouw "+_ach,voornaam:k.voornaam||cleanName(k.naam),naam:_nat,klant:_nat,adres:k.adres?jobAddr(k):"",datum:longD(datum||planned(k)),tijd:k.tijd||"",tijdvak:tv,dienst:(k.dienst||"glasbewassing").toLowerCase(),
    bedrijf:st.naam||"je glazenwasser",iban:st.iban||"",telefoon:st.telefoon||"",telefoonbedrijf:st.telefoon||"",prijs:eur(k.prijs),interval:k.frequentie?intervalTxt(k):"",
    betaallink:st.betaallink||"",betaalregel:st.betaallink?"U kunt direct betalen via: "+st.betaallink+"\n":"",reviewlink:st.reviewLink||"",voorwaarden:st.voorwaarden||"",opzegtermijn:st.opzegtermijn||""};
}
function factVars(f){
  const k=state.klanten.find(x=>x.id===f.klantId)||{naam:f.klantNaam,adres:f.klantAdres};
  return{...klantVars(k,parse(f.datum)),factuurnummer:f.nummer,bedrag:f.soort==="offerte"&&f.totaalTonen===false?"de diensten en prijzen per keer zoals vermeld":eur(totals(f).inc),vervaldatum:fmtL(f.verval),factuurdatum:fmtL(f.datum),dagen_te_laat:Math.max(0,Math.round((today()-parse(f.verval))/DAY)),btwbedrag:(()=>{try{const t=totals(f);return eur(t.inc-t.ex)}catch(e){return ""}})(),aanmaningskosten:f.aanmaningskosten?eur(f.aanmaningskosten):"",betaaldatum:f.betaaldOp?fmtL(String(f.betaaldOp).slice(0,10)):"","wik.invoice":(()=>{try{return eur(wikKosten(totals(f).inc))}catch(e){return ""}})(),"today.date":fmtL(iso(today())),herinnerdatum:f.herinnerdOp?fmtL(String(f.herinnerdOp).slice(0,10)):"",herinnerdatum2:Array.isArray(f.herinnerData)&&f.herinnerData[1]?fmtL(f.herinnerData[1]):"",betaallink:f.betaallink||S().betaallink||""};
}
const sentRefs=()=>new Set(state.berichten.map(m=>m.ref).filter(Boolean));
/* één herinnering en daarna de WIK-brief: oude instellingen (zonder WIK-moment) zetten de 2e herinnering en de aanmaning uit */
const fhMomenten=()=>{const m=S().fhM;if(!(Array.isArray(m)&&m.length))return FHM;const oud=m.length<FHM.length;return (oud?[...m,...FHM.slice(m.length)]:m).map((x,i)=>({...FHM[i],...x,...(oud&&(i===1||i===2)?{aan:false}:{})}))};
/* buitengerechtelijke incassokosten (Besluit vergoeding BIK, art. 6:96 BW): 15% over de eerste € 2.500 (minimaal € 40), 10% tot € 5.000, 5% tot € 10.000, 1% tot € 200.000, 0,5% daarboven, maximaal € 6.775 */
function wikKosten(b){b=Number(b)||0;if(b<=0)return 0;const S=[[2500,.15],[2500,.10],[5000,.05],[190000,.01],[Infinity,.005]];let r=b,k=0;for(const [g,p] of S){const d=Math.min(r,g);k+=d*p;r-=d;if(r<=0)break}return Math.round(Math.min(6775,Math.max(40,k))*100)/100}
function dagGroepen(dayIso,ref){
  const refs=sentRefs(),g={};
  actief().filter(k=>k.gepland===dayIso&&(k.contactPlanning||"kennisgeving")==="kennisgeving").forEach(k=>{const a=jobAddr(k)||k.id;(g[a]=g[a]||[]).push(k)});
  return Object.values(g).map(ks=>{const k=ks[0],v=klantVars(k,parse(dayIso));if(ks.length>1){v.dienst=ks.map(x=>(x.dienst||"glasbewassing").toLowerCase()).join(" en ");v.tijdvak=ks.map(x=>klantVars(x).tijdvak).join(" en ")}
    if(typeof tavK==="function"&&tavK(k,"planning"))v.klant=tavK(k,"planning");return{k:typeof mailK==="function"?mailK(k,"planning"):k,vars:v,ref:ref+":"+dayIso+":"+k.id}}).filter(x=>!refs.has(x.ref));
}
function queues(){
  const t=today(),refs=sentRefs(),out=[],st=S(),now=new Date();
  if(st.dagAan){
    if(st.dagVast!==false){const d=addDays(t,Number(st.dagDagen)||1),items=dagGroepen(iso(d),"herinnering");
      out.push({id:"herinnering",titel:"Herinnering "+(Number(st.dagDagen)===1||!st.dagDagen?"voor morgen":"voor "+longD(d)),uitleg:"Klanten die "+longD(d)+" op de route staan"+(now.getHours()*60+now.getMinutes()<toMin(st.dagTijd)?" · verstuurtijd "+st.dagTijd:""),items,kanaal:st.dagKanaal,tekst:st.dagSms,mail:st.dagMail,onderwerp:st.dagOnderwerp});}
    if(st.dagUurAan){const nm=now.getHours()*60+now.getMinutes(),items=dagGroepen(iso(t),"uur").filter(x=>{const m=toMin(x.k.tijd);return m!=null&&nm>=m-(Number(st.dagUren)||2)*60&&nm<m});
      out.push({id:"uur",titel:"Komt er zo aan",uitleg:(Number(st.dagUren)||2)+" uur voor de klus van vandaag",items,kanaal:st.dagKanaal,tekst:st.dagSms,mail:st.dagMail,onderwerp:st.dagOnderwerp});}
  }
  {const T=tpls(),ti=iso(t);
    /* afspraak laten bevestigen: klanten met die contactmethode krijgen een bevestigingsverzoek voor hun geplande afspraak */
    const bv=actief().filter(k=>k.contactPlanning==="bevestigen"&&k.gepland&&k.gepland>=ti&&!refs.has("bevestig:"+k.gepland+":"+k.id)).sort((a,b)=>a.gepland.localeCompare(b.gepland));
    if(bv.length){const A=T.afspraak||{};out.push({id:"bevestig",titel:"Afspraak laten bevestigen",uitleg:"Klanten die hun afspraak eerst willen bevestigen",items:bv.map(k=>({k,vars:klantVars(k,parse(k.gepland)),ref:"bevestig:"+k.gepland+":"+k.id})),tekst:A.sms||A.mail||"",mail:A.mail||"",onderwerp:A.onderwerp||"Bevestiging afspraak – [name.company]",sjabloon:"afspraak"})}
    /* afmeldbericht na de beurt */
    const ab=state.beurten.filter(b=>b.datum&&(t-parse(b.datum))/DAY<=7&&!refs.has("afkondiging:"+b.id)).map(b=>({b,k:state.klanten.find(x=>x.id===b.klantId)})).filter(x=>x.k&&x.k.afmeldMail);
    if(ab.length){const A=T.afkondiging||{};out.push({id:"afkondiging",titel:"Afmeldberichten",uitleg:"Klanten die na de beurt een bericht willen dat het werk klaar is",items:ab.map(x=>{const fa=x.b.gefactureerd&&state.facturen.find(f=>f.id===x.b.gefactureerd);return {k:x.k,vars:fa?{...factVars(fa),...klantVars(x.k,parse(x.b.datum))  ,factuurnummer:fa.nummer,bedrag:eur(totals(fa).inc),betaallink:fa.betaallink||S().betaallink||""}:klantVars(x.k,parse(x.b.datum)),ref:"afkondiging:"+x.b.id}}),tekst:A.sms||A.mail||"",mail:A.mail||"",onderwerp:A.onderwerp||"Glasbewassing afgerond – [name.company]",sjabloon:"afkondiging"})}}
  if(typeof pmDue==="function"){const pd=pmDue();if(pd.length){const g0=pd[0].g;out.push({id:"planmail",titel:"Geplande planningsmails",uitleg:"Klaargezet vanuit de planning",
    items:pd.map(({g,k})=>{const v=klantVars(k,parse(g.datum));if(g.mode==="tijdvakken")v.tijdvak=pmVak(k);return{k:mailK(k,"planning"),vars:v,ref:"planmail:"+g.datum+":"+k.id,stap:{naam:"Afspraak "+fmtD(g.datum),mail:g.mail?g.body:g.smsBody,sms:g.sms?g.smsBody:g.body,onderwerp:g.onderwerp}}}),
    kanaal:g0.mail?"email":"whatsapp",tekst:g0.sms?g0.smsBody:g0.body,mail:g0.mail?g0.body:"",onderwerp:g0.onderwerp,sjabloon:g0.sjabloon||"aankondiging"})}}
  {const md=iso(t).slice(5),y=t.getFullYear(),T2=tpls(),vj=actief().filter(k=>k.geboortedatum&&k.verjaardagTpl&&String(k.geboortedatum).slice(5)===md&&!refs.has("verjaardag:"+y+":"+k.id));
    if(vj.length){const X=T2[vj[0].verjaardagTpl]||T2.verjaardag||{};out.push({id:"verjaardag",titel:"Verjaardagen vandaag",uitleg:"Klanten die vandaag jarig zijn",items:vj.map(k=>{const Y=T2[k.verjaardagTpl]||X;return{k,vars:klantVars(k),ref:"verjaardag:"+y+":"+k.id,stap:{naam:Y.naam||"Verjaardag",mail:Y.mail||"",sms:Y.sms||Y.mail||"",onderwerp:Y.onderwerp||""}}}),kanaal:"email",tekst:X.sms||"",mail:X.mail||"",onderwerp:X.onderwerp||"",sjabloon:vj[0].verjaardagTpl})}}
  const nv=facturen().filter(f=>fStatus(f)[1]==="Openstaand"&&!f.verstuurdOp);
  out.push({id:"factuur",titel:"Facturen versturen",uitleg:"Open facturen die je nog niet hebt verstuurd",hint:"Wil je de PDF meesturen? Download hem bij de factuur en voeg hem in je mail toe.",
    items:nv.map(f=>({k:state.klanten.find(x=>x.id===f.klantId)||{naam:f.klantNaam,email:f.klantEmail},vars:factVars(f),ref:"factuur:"+f.id,onSent:()=>save("facturen",f.id,{...strip(f),verstuurdOp:iso(today()),verstuurdTs:f.verstuurdTs||new Date().toISOString()})}))});
  if(st.fhAan&&(!st.fhWerkdagen||isWerkdag(t))){
    const M=fhMomenten();
    /* wat er aan de beurt is, bepaalt fhVolgende (29-zaanmaning): zelfde regels als de factuurlijst */
    const verv=facturen().filter(f=>{const v=typeof fhVolgende==="function"?fhVolgende(f):null;return v&&v.klaar&&(v.soort==="herinnering"||v.soort==="wik")});
    out.push({id:"aanmaning",titel:"Betalingsherinneringen",uitleg:"Herinneringen en WIK-brieven die vandaag aan de beurt zijn",
      items:verv.map(f=>{const v=fhVolgende(f),m=v.stap,j=v.j;return{k:state.klanten.find(x=>x.id===f.klantId)||{naam:f.klantNaam,email:f.klantEmail},vars:factVars(f),ref:"aanmaning:"+f.id+":"+(j+1),stap:m,onSent:()=>save("facturen",f.id,{...strip(f),herinnerdOp:iso(today()),herinneringen:j+1,...(m.wik?{wikOp:iso(today())}:{})})}}),
      kanaal:(M.find(m=>m.aan)||M[0]).kanaal,tekst:(M.find(m=>m.aan)||M[0]).sms,mail:(M.find(m=>m.aan)||M[0]).mail,onderwerp:(M.find(m=>m.aan)||M[0]).onderwerp});}
  if(st.welkomAan&&!LIVE){const w=actief().filter(k=>!refs.has("welkom:"+k.id)&&k.aangemaakt&&(t-parse(k.aangemaakt))/DAY<=30);
    const ov=()=>{const x=[];x.push("\n\n— "+(st.ovTitel||"Serviceovereenkomst")+" —");x.push(st.ovInleiding||"");x.push("Dienst: [service.appointment], elke [interval.appointment], [price.appointment] per beurt.");if(st.opzegtermijn&&st.opzegtermijn!=="geen")x.push("Opzegtermijn: [noticeperiod.company].");if(st.ovExtra)x.push(st.ovExtra);
      const vw=st.voorwaardenPdf?location.origin+BLOB+st.voorwaardenPdf:st.voorwaarden;if(vw)x.push("Algemene voorwaarden: "+vw);if(st.incassoVragen)x.push("Wilt u de betaling via automatische incasso laten lopen? Stuur ons uw IBAN en naam, dan regelen wij de machtiging.");x.push("Gaat u akkoord? Een kort antwoord op deze mail is genoeg.");return x.filter(Boolean).join("\n")};
    const T=tpls();
    out.push({id:"welkom",titel:"Welkomstberichten",uitleg:"Nieuwe klanten van de laatste 30 dagen",items:w.map(k=>({k,vars:klantVars(k),ref:"welkom:"+k.id})),tekst:T.welkom.sms||T.welkom.mail,mail:T.welkom.mail+ov(),onderwerp:st.welkomOnderwerp||T.welkom.onderwerp});
    if(st.ovHerAan!==false){const h=actief().filter(k=>{if(k.akkoord||!refs.has("welkom:"+k.id))return false;const sent=state.berichten.filter(m=>m.ref==="welkom:"+k.id).map(m=>new Date(m.op)).sort((a,b)=>a-b)[0];if(!sent)return false;
        const n=state.berichten.filter(m=>String(m.ref||"").startsWith("ovher:"+k.id)).length;if(n>=(Number(st.ovHerMax)||2))return false;const due=addDays(sent,(Number(st.ovHer1)||5)+n*(Number(st.ovHerN)||7));return due<=new Date()});
      if(h.length)out.push({id:"ovher",titel:"Nog geen akkoord",uitleg:"Herinnering voor de overeenkomst",items:h.map(k=>({k,vars:klantVars(k),ref:"ovher:"+k.id+":"+state.berichten.filter(m=>String(m.ref||"").startsWith("ovher:"+k.id)).length})),tekst:st.ovHerTekst,mail:st.ovHerTekst,onderwerp:"Herinnering: "+(st.ovTitel||"serviceovereenkomst"),sjabloon:"vrij"});}}
  if(st.reviewAan){const max=Number(st.reviewMax)||2,dg=Number(st.reviewDagen)||180;
    const cnt=id=>state.berichten.filter(m=>m.sjabloon==="review"&&m.klantId===id&&(t-new Date(m.op))/DAY<dg).length;
    const na=Number(st.reviewNa??3),last=id=>state.berichten.filter(m=>m.sjabloon==="review"&&m.klantId===id).map(m=>new Date(m.op)).sort((a,b)=>b-a)[0];
    const ids=[...new Set(echteFacturen().filter(f=>{const d=parse(String(f.gemaakt||f.datum).slice(0,10));return d&&(t-d)/DAY>=na&&(t-d)/DAY<=na+14}).map(f=>f.klantId))].filter(id=>{const k=state.klanten.find(x=>x.id===id),l=last(id);return k&&!k.geenReview&&cnt(id)<max&&(!l||(t-l)/DAY>=dg)});
    const RT=tpls().review,rt=RT.mail,rl=st.reviewLink&&!rt.includes("[link.review]")?"\n\n"+(st.reviewKnop||"Review achterlaten")+": [link.review]":"";
    out.push({id:"review",titel:"Reviewverzoeken",uitleg:na+" dagen na een factuur · max "+max+"× · "+dg+" dagen ertussen",items:ids.map(id=>state.klanten.find(k=>k.id===id)).map(k=>({k,vars:klantVars(k,today()),ref:"review:"+k.id+":"+iso(t)})),tekst:RT.sms+(st.reviewLink&&!RT.sms.includes("[link.review]")?" [link.review]":""),mail:rt+rl,onderwerp:st.reviewOnderwerp||RT.onderwerp,sjabloon:"review"});}
  if(false&&st.rapportAan&&t.getDate()>=(Number(st.rapportDag)||1)){const pm=new Date(t.getFullYear(),t.getMonth()-1,1),key="rapport:"+iso(pm).slice(0,7);
    if(!refs.has(key)){const F=fin(periodRange(pm.getFullYear(),"m"+pm.getMonth()));
      out.push({id:"rapport",titel:"Maandrapport boekhouder",uitleg:monthName(pm.getFullYear(),pm.getMonth())+" · download de PDF en mail hem mee",items:[{k:{id:"",naam:"Boekhouder",email:st.boekhouderEmail||""},vars:{naam:"",klant:"",bedrijf:st.naam||"",maand:monthName(pm.getFullYear(),pm.getMonth()),omzet:eur(F.omzet),kosten:eur(F.kosten),btw:eur(F.btwSaldo)},ref:key}],
        kanaal:"email",tekst:"Hoi, hierbij het rapport van [month.report]: omzet [revenue.report], kosten [costs.report], btw [vat.report]. Groet, [name.company]",mail:"Beste boekhouder,\n\nIn de bijlage het maandrapport van [month.report].\nOmzet excl. btw: [revenue.report]\nKosten excl. btw: [costs.report]\nBtw-saldo: [vat.report]\n\nMet vriendelijke groet,\n[name.company]",onderwerp:"Maandrapport [month.report] – [name.company]",sjabloon:"rapport"});}}
  return out;
}

/* andere diensten alleen samen met glasbewassing */
const heeftGlas=k=>!!k&&!k.opdrachtVerwijderd&&!k.prospect&&k.actief!==false&&/glas|ramen/i.test(String(k.dienst||"Glasbewassing"));
const GLAS_REGEL="Andere diensten kunnen alleen samen met glasbewassing worden uitgevoerd.";
