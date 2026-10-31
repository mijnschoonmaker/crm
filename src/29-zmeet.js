/* ---------- Meetlint in het CRM: instellingen en soorten (diensten per strekkende meter of per m²) ---------- */
I.ruler=I.ruler||'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg>';
const meetSoorten=()=>{try{return typeof Meetlint!=="undefined"?Meetlint.soortenUit(uDienstLijst().filter(d=>!d.glas&&d.groep!=="bijz")):[]}catch(e){return[]}};
/* welke maat uit het 3D-model hoort bij een dienst: zelf gekozen (Instellingen › Meetlint) of geraden uit de naam */
const MEET_BRON={goot:"Goten",windveer:"Windveren",rand:"Alle dakranden (goten + platte daken)",plat:"Dakranden platte daken",gevel:"Gevels (m²)",dak:"Dakoppervlak (m²)"};
const meetBron=x=>{const k=(S().meetBron||{})[x.id];if(k!==undefined)return k;const n=((x.naam||"")+" "+(x.kort||"")).toLowerCase();
  if(x.eenheid==="m2"){if(/beplating|paneel|panelen|trespa|bekleding|kozijn/.test(n))return"";if(/gevel|muur|metsel|voeg/.test(n))return"gevel";if(/\bdak(?!kapel|goot|lijst|rand)|dakpan|pannen/.test(n))return"dak";return""}
  if(/windve/.test(n))return"windveer";if(/goot|goten/.test(n))return"goot";if(/daklijst|boei|dakrand|dakkant|dakbeschot/.test(n))return"rand";return""};
const meetBronWaarde=(d,b)=>{if(!d)return 0;if(b==="gevel")return d.gevel||0;if(b==="dak")return d.dakopp||0;const z=b==="rand"?["goot","plat"]:[b];return(d.randen||[]).filter(r=>z.includes(r.soort)).reduce((a,r)=>a+r.m,0)};
/* ---- zelflerend: elke echte maat (gemeten op foto/luchtfoto, of zelf aangepast in de offerte) naast de maat uit het 3D-model.
   Per soort rand en per bouwjaarklasse een correctiefactor (mediaan, voorzichtig: telt pas zwaar mee na een paar metingen). ---- */
const MEET_KL=j=>{j=Number(j)||0;return !j?"?":j<1945?"<1945":j<1975?"1945-74":j<1995?"1975-94":j<2010?"1995-09":"2010+"};
function meetCorr(b,bouwjaar){const L=((state.meetleer&&state.meetleer.items)||[]).filter(x=>x&&x.m>0&&x.e>0&&(x.b===b||(b==="goot"&&x.b==="rand")));if(!L.length)return{f:1,n:0};
  const kl=MEET_KL(bouwjaar),K=L.filter(x=>MEET_KL(x.j)===kl),S2=K.length>=3?K:L,r=S2.map(x=>x.e/x.m).sort((a,b)=>a-b),med=r.length%2?r[(r.length-1)/2]:(r[r.length/2-1]+r[r.length/2])/2;
  const f=1+(S2.length/(S2.length+4))*(med-1);return{f:Math.max(0.8,Math.min(1.25,f)),n:S2.length}}
async function meetLeerBewaar(info,dns){if(!info||!info.d||!info.items||!info.items.length)return;const nu=iso(today()),L=[...(((state.meetleer||{}).items)||[])];let n=0;
  info.items.forEach(x=>{if(!(x.model>0))return;let e=null,w="";if(x.gemeten>0){e=x.gemeten;w="foto"}
    else if(x.gekozen){const it=(dns||[]).flatMap(d=>d.items||[]).find(i=>String(i.id)===String(x.id)),a=it?Number(it.aantal)||0:0;if(a>0&&Math.abs(a-x.gekozen)>0.05){e=a;w="aangepast"}}
    if(!e)return;const r=e/x.model;if(r<0.6||r>1.6)return;const k=info.d.pand+"|"+x.bron,i=L.findIndex(z=>z.k===k),rec={k,b:x.bron,m:Math.round(x.model*100)/100,e:Math.round(e*100)/100,j:info.d.bouwjaar||0,dak:info.d.dak||"",w,t:nu};
    if(i>=0)L[i]=rec;else L.push(rec);n++});
  if(!n)return;const items=L.slice(-600);await save("instellingen","meetleer",{items});state.meetleer={items}}
const meetLeerTekst=()=>{const L=((state.meetleer||{}).items)||[];if(!L.length)return"Nog geen metingen om van te leren. Zodra je een maat uit het 3D-model aanpast of zelf meet op een foto of de luchtfoto, leert Mansard daarvan.";
  return "Geleerd van "+L.length+" "+(L.length===1?"meting":"metingen")+": "+["goot","windveer","plat","gevel","dak"].map(b=>{const c=meetCorr(b);return c.n?(MEET_BRON[b]||b).replace(/ \(.*\)/,"").toLowerCase()+" "+(c.f>=1?"+":"−")+Math.abs(Math.round((c.f-1)*1000)/10).toString().replace(".",",")+" %":""}).filter(Boolean).join(", ")+"."};
const meetAan=w=>{const s=S();if(w==="webshop")return s.meetWebshop===true;if(w==="telling")return s.meetTelling!==false;return s.meetRekentool!==false};
SETCARDS.push({id:"meetlint",t:"Meetlint",sub:"Goten, windveren en beplating opmeten op een foto",ic:"ruler",bg:"#c9a227",
  st:s=>[meetAan("rekentool"),meetAan("telling"),meetAan("webshop")].some(Boolean)?["ok","Aan"]:["soon","Staat uit"],
  rows:s=>[["Rekentool",meetAan("rekentool")?"Aan":"Uit"],["Tellingcontrole",meetAan("telling")?"Aan":"Uit"],["Dienstenwebshop",meetAan("webshop")?"Aan":"Uit"]]});
SETEXTRA.meetlint=(c,s)=>{const L=meetSoorten();
  setDlg(c,`${info("Met de meetlint meet je op een foto hoeveel meter goot, daklijst of windveer er is, of hoeveel m² beplating. Eerst sleep je een <b>referentie</b> over iets waarvan je de maat kent (bijvoorbeeld 4 bakstenen), daarna rekent Mansard elke lijn om. De meters gaan met je eigen tarief mee in de prijs.")}
    <small class="help" style="display:block;margin:4px 0 10px"><b>Zelflerend.</b> ${esc(meetLeerTekst())}</small>
    ${tgl("meetRekentool","Rekentool","Meten bij het tellen van de ramen in de rekentool en offertes",meetAan("rekentool"))}
    ${tgl("meetTelling","Tellingcontrole","Meten op de foto's bij de O-beurt",meetAan("telling"))}
    ${tgl("meetWebshop","Dienstenwebshop","Klanten zien op je website wat goten, windveren en dergelijke kosten, gemeten met het 3D-model van hun woning",meetAan("webshop"))}
    ${L.length?`${sec("Maten uit het 3D-model")}<small class="help" style="display:block;margin-bottom:8px">Zodra er een adres is, haalt Mansard de woning op uit de laserscan van Nederland (3D BAG). Kies per dienst welke maat erbij hoort; die kun je in de rekentool met één tik in de prijs zetten.</small>
      ${L.filter(x=>x.eenheid!=="st").map(x=>{const b=meetBron(x),opts=Object.entries(MEET_BRON).filter(([k])=>(x.eenheid==="m2")===(k==="gevel"||k==="dak"));return `<label class="fld"><span class="lab">${esc(x.kort)} <small>(${x.eenheid==="m2"?"m²":"m"})</small></span><select class="in" data-mbron="${esc(x.id)}"><option value=""${b?"":" selected"}>Niet uit het 3D-model</option>${opts.map(([k,t])=>`<option value="${k}"${b===k?" selected":""}>${esc(t)}</option>`).join("")}</select></label>`}).join("")}`:""}
    <small class="help">${L.length?"Te meten: "+L.map(x=>esc(x.kort)+" ("+(x.eenheid==="m2"?"m²":x.eenheid==="st"?"per stuk":"m")+")").join(", ")+". Dit volgt uit Uitvoering › Diensten: alles met de eenheid per strekkende meter of per m², en dakkapellen per stuk.":"Nog geen diensten per strekkende meter of per m². Zet de eenheid bij Uitvoering › Diensten."}</small>`,{wide:false});
  bindSave(()=>{const m={...(S().meetBron||{})};form.querySelectorAll("[data-mbron]").forEach(el=>m[el.dataset.mbron]=el.value);return{meetBron:m}})};
