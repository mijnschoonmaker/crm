/* ---------- DEMO-OMGEVING (alleen in /demo, nooit in de echte versie) ----------
   Verzonnen klanten, facturen en beurten om instructievideo's mee op te nemen.
   Alles blijft in deze browser bewaard; datums schuiven elke dag mee, zodat de planning altijd actueel oogt.
   Opnieuw beginnen: /demo/?opnieuw */
const DEMO_KEY="ms.demo.v3";
const DEMO_PLAATS=[["Zuidhorn","9801",53.2464,6.4060],["Grootegast","9861",53.2140,6.2720],["Leek","9351",53.1620,6.3770],["Marum","9363",53.1440,6.2650],["Aduard","9831",53.2560,6.4590],["Oldekerk","9821",53.2230,6.3230],["Tolbert","9356",53.1640,6.3590],["Niekerk","9822",53.2220,6.3480]];
const DEMO_STRAAT=["Lindenlaan","Esdoornstraat","Molenweg","Kastanjelaan","Berkenhof","Wilgenpad","Populierenlaan","Meidoornstraat","Iepenlaan","Vlierstraat","Hazelaarhof","Eikenlaan","Lijsterbes","Beukenlaan","Zonnedauw","Kievitstraat","Merelhof","Fazantenlaan"];
const DEMO_NAMEN=[["de Vries","Sanne"],["Jansen","Pieter"],["Bakker","Marieke"],["Visser","Henk"],["Smit","Lotte"],["Mulder","Gerrit"],["de Boer","Anneke"],["Postma","Jeroen"],["Dijkstra","Femke"],["Bos","Klaas"],["Hoekstra","Ilse"],["van der Meer","Bram"],["Kuipers","Ruben"],["Wiersma","Jolanda"],["Veenstra","Tom"],["Huizinga","Esther"],["Bosma","Wouter"],["Kramer","Nienke"],["Schuurman","Dirk"],["Hofman","Linda"],["Brouwer","Sander"],["Meijer","Yvonne"],["Zijlstra","Martin"],["Prins","Karin"],["Boersma","Erik"],["Haan","Petra"],["Venema","Joost"],["Kooistra","Marloes"],["Tuinstra","Hans"],["Oosterhuis","Wendy"]];
const DEMO_ZAAK=[["Bakkerij Van der Molen","zakelijk",145,4],["Tandartspraktijk Lindenhof","zakelijk",120,4],["Autobedrijf Kuipers","zakelijk",189,4],["Kinderopvang De Speeltuin","zakelijk",98,6],["VvE De Linde","vve",265,4]];
function demoRnd(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function demoMaak(){
  const R=demoRnd(20261018),pick=a=>a[Math.floor(R()*a.length)],t=today(),D=n=>iso(addDays(t,n)),geo={};
  const klanten=[],beurten=[],facturen=[],berichten=[],banktx=[];let nr=9301,ki=0;
  const nieuwK=(naam,soort,prijs,freq,i)=>{const p=DEMO_PLAATS[i%DEMO_PLAATS.length],straat=pick(DEMO_STRAAT),hn=1+Math.floor(R()*88),pc=p[1]+" "+String.fromCharCode(65+Math.floor(R()*20))+String.fromCharCode(65+Math.floor(R()*24));
    const id="kdemo"+String(++ki).padStart(3,"0"),k={naam,adres:straat+" "+hn,postcode:pc,plaats:p[0],telefoon:"06 "+(12000000+Math.floor(R()*87999999)).toString().replace(/(\d{4})(\d{4})/,"$1 $2"),email:naam.toLowerCase().replace(/[^a-z]+/g,".").replace(/^\.|\.$/g,"")+"@voorbeeld.nl",
      prijs,frequentie:freq,ronde:p[0],dienst:soort==="vve"?"Glasbewassing + kozijnen":"Glasbewassing",duur:soort==="particulier"?25+5*Math.floor(R()*5):60+15*Math.floor(R()*3),soort,actief:true,binnen:false,aangemaakt:D(-200-Math.floor(R()*300)),log:[],objecten:[],gepland:"",tijd:"",laatst:"",notities:"",contactPlanning:"kennisgeving"};
    geo[(k.adres+"|"+pc.replace(/\s+/g,"")+"|"+p[0]).toLowerCase()]=[+(p[2]+(R()-.5)*.012).toFixed(6),+(p[3]+(R()-.5)*.02).toFixed(6)];
    klanten.push({id,...k});return klanten[klanten.length-1]};
  DEMO_NAMEN.forEach(([a,v],i)=>nieuwK(a+", "+v,"particulier",[22.5,25,27.5,29.95,32.5,35,39.5,45][Math.floor(R()*8)],[4,4,6,8,8,12][Math.floor(R()*6)],i));
  DEMO_ZAAK.forEach(([n,s,p,f],i)=>nieuwK(n,s,p,f,i*2));
  const vve=klanten.find(k=>k.soort==="vve");if(vve){vve.contact="Bestuur VvE De Linde";vve.adres="Lindenlaan 14";vve.postcode="9801 LK";vve.plaats="Zuidhorn"}
  /* geschiedenis: beurten en facturen van de afgelopen maanden */
  klanten.forEach((k,i)=>{const stap=k.frequentie*7,eerste=-(5+Math.floor(R()*stap));
    for(let d=eerste-stap*4;d<=eerste;d+=stap){if(d<-170)continue;const bid="bdemo"+i+"_"+(-d),fid="fdemo"+i+"_"+(-d),bedrag=k.prijs,datum=D(d);
      const recent=d>-12,factureer=!(recent&&i%7===0);
      const b={id:bid,klantId:k.id,klantNaam:k.naam,datum,bedrag,betaald:false,gefactureerd:factureer?fid:"",dienst:k.dienst,tijd:"",duur:k.duur,door:i%5===0?"Jelmer":"Mark",op:datum+"T12:00:00.000Z"};
      beurten.push(b);k.laatst=datum;
      if(!factureer)continue;
      const verval=D(d+14),te=-d-14,f={id:fid,soort:"factuur",nummer:"",klantId:k.id,klantNaam:k.naam,klantAdres:k.adres+", "+k.postcode+" "+k.plaats,klantEmail:k.email,datum,verval,status:"open",regels:[{omschrijving:k.dienst+" "+k.adres,aantal:1,prijs:bedrag}],btw:21,incl:true,verstuurdOp:datum,gemaakt:datum+"T13:00:00.000Z",log:[]};
      const kans=R();
      if(te>45&&kans<.985||te>10&&te<=45&&kans<.85||te>0&&te<=10&&kans<.55||te<=0&&kans<.2){const bw=kans<.35?"mollie":kans<.5?"contant":"overmaken";Object.assign(f,{status:"betaald",betaalwijze:bw,betaaldOp:D(d+Math.min(-d,Math.floor(R()*12))),betaaldTs:D(d+3)+"T10:00:00.000Z"});b.betaald=true}
      else if(te>3){f.herinneringen=te>20?2:1;f.herinnerdOp=D(d+17)}
      facturen.push(f)}});
  facturen.sort((a,b)=>a.datum.localeCompare(b.datum)).forEach(f=>f.nummer=String(t.getFullYear()).slice(2)+"-"+String(nr++).padStart(6,"0"));
  /* planning: vandaag een route van 8 adressen, daarna verspreid over drie weken */
  const tijden=["08:00","08:40","09:15","09:50","10:30","11:15","13:00","13:45","14:30","15:15"];
  const zh=klanten.filter(k=>["Zuidhorn","Aduard","Niekerk"].includes(k.plaats)).slice(0,8);
  zh.forEach((k,i)=>{k.gepland=D(0);k.tijd=tijden[i]});
  if(zh[0])zh[0].taak="Ramen buiten en kozijnen. Achterom via de poort aan de zijkant; graag de plantenbakken op de vensterbank laten staan.";
  klanten.filter(k=>!k.gepland).forEach((k,i)=>{if(i%5===4)return;let d=1+Math.floor(R()*20);const wd=addDays(t,d).getDay();if(wd===0)d++;if(wd===6)d+=2;k.gepland=D(d);k.tijd=tijden[Math.floor(R()*tijden.length)]});
  /* offertes */
  const off=(n,naam,adres,st,regels,dd)=>facturen.push({id:"odemo"+n,soort:"offerte",nummer:"OFF-"+t.getFullYear()+"-"+String(n).padStart(3,"0"),klantId:"",klantNaam:naam,klantAdres:adres,klantEmail:"",datum:D(dd),verval:D(dd+30),status:st,regels,btw:21,incl:true,gemaakt:D(dd)+"T09:00:00.000Z"});
  off(41,"Familie Wijnstra","Molenweg 7, 9363 AB Marum","verstuurd",[{omschrijving:"Glasbewassing buiten, elke 6 weken",aantal:1,prijs:32.5},{omschrijving:"Eenmalig kozijnen reinigen",aantal:1,prijs:85}],-3);
  off(42,"Huisartsenpraktijk Aduard","Eikenlaan 2, 9831 AC Aduard","geaccepteerd",[{omschrijving:"Glasbewassing binnen en buiten, elke 4 weken",aantal:1,prijs:110}],-12);
  off(43,"De Wit, Marco","Kievitstraat 21, 9351 KD Leek","concept",[{omschrijving:"Glasbewassing buiten",aantal:1,prijs:27.5}],0);
  /* berichten en bank */
  facturen.filter(f=>f.soort==="factuur").slice(-14).forEach((f,i)=>berichten.push({id:"mdemo"+i,klantId:f.klantId,klantNaam:f.klantNaam,naar:f.klantEmail,kanaal:"email",sjabloon:"factuur",onderwerp:"Factuur "+f.nummer+" – Voorbeeld Glazenwasserij",tekst:"Beste klant, in de bijlage vindt u factuur "+f.nummer+".",op:f.datum+"T13:05:00.000Z",ref:"factuur:"+f.id,status:i%3?"geopend":"bezorgd",opens:i%3?1+(i%2):0}));
  const lo=facturen.filter(f=>f.soort==="factuur"&&f.status==="open");
  if(lo[0])banktx.push({id:"tx_demo1",datum:D(-1),bedrag:Math.max(5,totals(lo[0]).inc-2.5),naam:lo[0].klantNaam.split(",")[0].toUpperCase(),iban:"NL20INGB0001234567",omschrijving:"glazenwasser "+lo[0].nummer,status:"controleren",factuurIds:[lo[0].id],nummers:[lo[0].nummer],reden:"Bedrag wijkt af: ontvangen "+eur(Math.max(5,totals(lo[0]).inc-2.5))+", factuur "+eur(totals(lo[0]).inc),bron:"Bank Knab",op:new Date().toISOString()});
  banktx.push({id:"tx_demo2",datum:D(-2),bedrag:30,naam:"J. DE GROOT",iban:"NL55RABO0123456789",omschrijving:"ramen wassen",status:"onbekend",reden:"Geen factuur gevonden bij deze betaling",bron:"Bank Knab",op:new Date().toISOString()});
  const inst=[{id:"bedrijf",naam:"Voorbeeld Glazenwasserij",adres:"Lindenlaan 14",postcode:"9801 AB",plaats:"Zuidhorn",telefoon:"06 12 34 56 78",email:"info@voorbeeldglazenwasserij.nl",website:"voorbeeldglazenwasserij.nl",kvk:"12345678",btwnr:"NL001234567B01",iban:"NL00 DEMO 0123 4567 89",btw:21,incl:true,termijn:14,factNrStijl:"doorlopend",fhAan:true,dagAan:true},
    {id:"bank",gekoppeld:true,bank:"Knab",rekeningen:[{iban:"NL91 •••• 210",naam:"Zakelijke rekening"}],geldigTot:iso(addDays(t,92))+"T10:00:00.000Z",bijgewerkt:new Date(Date.now()-35*60e3).toISOString(),saldo:3218.60,laatsteSync:{nieuw:5,betaald:4,controleren:1}}];
  return {gemaakt:iso(t),geo,cols:{klanten,beurten,facturen,berichten,banktx,instellingen:inst,routes:[],kosten:[]}};
}
/* datums laten meeschuiven met de dag van vandaag */
function demoSchuif(v,n){if(!n)return v;if(typeof v==="string"&&/^\d{4}-\d{2}-\d{2}/.test(v)){const d=iso(addDays(parse(v.slice(0,10)),n));return d+v.slice(10)}if(Array.isArray(v))return v.map(x=>demoSchuif(x,n));if(v&&typeof v==="object")return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==="nummer"||k==="id"?x:demoSchuif(x,n)]));return v}
function demoBewaar(){try{const cols={};COLS.forEach(c=>cols[c]=[...mem[c].values()]);localStorage.setItem(DEMO_KEY,JSON.stringify({gemaakt:iso(today()),cols}))}catch(e){}}
async function demoStart(){
  let d=null;const opnieuw=/[?&]opnieuw/.test(location.search);
  try{if(!opnieuw)d=JSON.parse(localStorage.getItem(DEMO_KEY)||"null")}catch(e){}
  if(opnieuw)try{history.replaceState(null,"",location.pathname)}catch(_){}
  if(!d){d=demoMaak();try{const G=JSON.parse(localStorage.getItem("ms.geo")||"{}");localStorage.setItem("ms.geo",JSON.stringify({...G,...d.geo}))}catch(e){}}
  else{const n=Math.round((today()-parse(d.gemaakt))/DAY);if(n>0)d.cols=demoSchuif(d.cols,n)}
  COLS.forEach(c=>{mem[c]=new Map((d.cols[c]||[]).map(x=>[x.id,x]));apply(c,[...mem[c].values()])});
  demoBewaar();
  const _s=save,_d=del;let tm=0;const later=()=>{clearTimeout(tm);tm=setTimeout(demoBewaar,300)};
  save=async(c,id,x)=>{await _s(c,id,x);later()};del=async(c,id)=>{await _d(c,id);later()};
  state.me={name:"Mark",email:"mark@voorbeeldglazenwasserij.nl"};
  const DL={save:async({filename,data})=>{const b=data instanceof Blob?data:new Blob([data]),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}};
  state.dl=DL;render();await init();
  state.dl=DL;$("#status").innerHTML="";state.loaded=true;render();
}
