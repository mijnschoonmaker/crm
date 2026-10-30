/* ---------- DEMO-OMGEVING (alleen in /demo, nooit in de echte versie) ----------
   Verzonnen klanten, facturen en beurten om instructievideo's mee op te nemen.
   Alles blijft in deze browser bewaard; datums schuiven elke dag mee, zodat de planning altijd actueel oogt.
   Opnieuw beginnen: /demo/?opnieuw */
const DEMO_KEY="ms.demo.v6";
/* Westerkwartier: plaats, postcode, lat, lng, gewicht (aantal klanten), wie rijdt er (M = Mark, S = Sem) */
const DEMO_PLAATS=[["Zuidhorn","9801",53.2464,6.4060,22,"M"],["Noordhorn","9804",53.2620,6.3920,7,"M"],["Aduard","9831",53.2560,6.4590,8,"M"],["Den Horn","9832",53.2300,6.4430,4,"M"],["Niekerk","9822",53.2220,6.3480,4,"M"],["Oldekerk","9821",53.2230,6.3230,4,"M"],["Grijpskerk","9843",53.2630,6.3060,6,"M"],["Kommerzijl","9845",53.2840,6.3220,2,"M"],
  ["Grootegast","9861",53.2140,6.2720,10,"S"],["Lutjegast","9866",53.2350,6.2550,3,"S"],["Doezum","9863",53.2080,6.2300,2,"S"],["Sebaldeburen","9862",53.2030,6.2550,2,"S"],["Leek","9351",53.1620,6.3770,18,"S"],["Tolbert","9356",53.1640,6.3590,6,"S"],["Midwolde","9354",53.1800,6.3930,3,"S"],["Enumatil","9355",53.1810,6.3660,2,"S"],["Marum","9363",53.1440,6.2650,9,"S"],["Nuis","9364",53.1600,6.2900,2,"S"],["Niebert","9365",53.1630,6.3050,2,"S"],["Opende","9865",53.1660,6.2050,4,"S"]];
const DEMO_STRAAT=["Lindenlaan","Esdoornstraat","Molenweg","Kastanjelaan","Berkenhof","Wilgenpad","Populierenlaan","Meidoornstraat","Iepenlaan","Vlierstraat","Hazelaarhof","Eikenlaan","Lijsterbes","Beukenlaan","Zonnedauw","Kievitstraat","Merelhof","Fazantenlaan","Kerkstraat","Hoofdstraat","Schoolstraat","Dorpsstraat","Stationsweg","Julianalaan","Wilhelminastraat","Oranjelaan","De Gaast","Bomenbuurt","Spoorstraat","Raadhuisstraat","Prinses Margrietstraat","Burgemeester Brouwerstraat","Westerhornweg","Mellemaweg","Tolberterstraat","Zuiderweg","De Kolk","Kanaalweg","Pastorielaan","Lauwerslaan","Reitdiep","Wiardaweg","Hogeweg","Noorderweg","Klinkerweg"];
const DEMO_ACHTER=["de Vries","Jansen","Bakker","Visser","Smit","Mulder","de Boer","Postma","Dijkstra","Bos","Hoekstra","van der Meer","Kuipers","Wiersma","Veenstra","Huizinga","Bosma","Kramer","Schuurman","Hofman","Brouwer","Meijer","Prins","Boersma","Haan","Venema","Kooistra","Tuinstra","Oosterhuis","Bolt","Hoving","Wolters","Westra","Nienhuis","Pot","Bouma","Kamminga","Tiemens","Mollema","Hiemstra","Sikkema","Oosting","Jager","Kok","Vos","Dekker","van Dijk","Heeringa","Elzinga","Ritsema","Dijkhuis","Holtrop","Huisman","Wieringa","Lubbers","Nijdam","Feenstra","Medema","Ploeg","Steenhuis","Hazenberg","Kuiper","Schaap","Rozema","Groen","Doornbos","Bruins","Hamstra","Bijlsma","Zwart"];
const DEMO_VOOR=["Sanne","Pieter","Marieke","Henk","Lotte","Gerrit","Anneke","Jeroen","Femke","Klaas","Ilse","Bram","Ruben","Jolanda","Tom","Esther","Wouter","Nienke","Dirk","Linda","Sander","Yvonne","Martin","Karin","Erik","Petra","Joost","Marloes","Hans","Wendy","Jan","Geert","Harm","Tineke","Roelf","Grietje","Albert","Jantina","Bert","Hilde","Arjen","Ellen","Kees","Margriet","Johan","Ingrid","Rik","Saskia","Frank","Monique","Jelle","Annemarie","Sietse","Rianne","Dennis","Mirjam","Theo","Gea","Wim","Aaltje"];
/* zakelijk: naam, soort, prijs per beurt (incl. btw), frequentie (weken), dienst, extra */
const DEMO_ZAAK=[["Bakkerij Van der Molen","zakelijk",64.5,2,"Glasbewassing etalage + kozijnen"],["Tandartspraktijk Lindenhof","zakelijk",89,4,"Glasbewassing binnen en buiten"],["Autobedrijf Kuipers","zakelijk",145,4,"Glasbewassing showroom"],["Kinderopvang De Speeltuin","zakelijk",98,4,"Glasbewassing binnen en buiten"],
  ["Huisartsenpraktijk Grootegast","zakelijk",112,4,"Glasbewassing binnen en buiten"],["Fysiotherapie Leek","zakelijk",72.5,4,"Glasbewassing"],["Supermarkt De Buurtwinkel","zakelijk",79,2,"Glasbewassing gevel en entree"],["Kapsalon Knipkunst","zakelijk",34.5,2,"Glasbewassing etalage"],
  ["Café De Ster","zakelijk",42.5,4,"Glasbewassing"],["Bloemenhuis Flora","zakelijk",29.5,2,"Glasbewassing etalage"],["Notariskantoor Hoekstra & Bosma","zakelijk",118,4,"Glasbewassing binnen en buiten"],["Dierenkliniek Westerkwartier","zakelijk",96,6,"Glasbewassing"],
  ["Fietsenmaker Bolt","zakelijk",38.5,4,"Glasbewassing etalage"],["Makelaardij Zuidhorn","zakelijk",54,4,"Glasbewassing etalage + kozijnen"],["Opticien Lindeboom","zakelijk",36,2,"Glasbewassing etalage"],["Uitvaartcentrum Rustoord","zakelijk",132,6,"Glasbewassing binnen en buiten"],
  ["Basisschool De Wegwijzer","zakelijk",285,8,"Glasbewassing school"],["Sportschool FitLeek","zakelijk",88,4,"Glasbewassing"],["Hotel De Postkoets","zakelijk",0,2,"Glasbewassing hotel"],["Apotheek Zuidhorn","zakelijk",0,4,"Glasbewassing binnen en buiten"],
  ["Garage Hoving","zakelijk",67.5,6,"Glasbewassing showroom"],["Installatiebedrijf Wolters","zakelijk",58,8,"Glasbewassing kantoor"],["Beautysalon Puur","zakelijk",31.5,4,"Glasbewassing etalage"],["Bibliotheek Leek","zakelijk",164,8,"Glasbewassing binnen en buiten"],
  ["VvE De Linde","vve",365,8,"Glasbewassing + kozijnen"],["VvE Molenhof","vve",248,12,"Glasbewassing buitenzijde"],["VvE Het Hooghuis","vve",0,1,"Schoonmaak trappenhal"]];
/* periodieke facturen (prijs per periode excl. btw) */
const DEMO_PER={"Hotel De Postkoets":{freq:"maand",regels:[["Glasbewassing Hotel De Postkoets, 2x per maand · [month.current] [year.current]",1,268]],beurt:2},
  "Apotheek Zuidhorn":{freq:"maand",regels:[["Glasbewassing binnen en buiten Apotheek Zuidhorn · [month.current] [year.current]",1,96]],beurt:1},
  "VvE Het Hooghuis":{freq:"maand",regels:[["Schoonmaak trappenhal en entree VvE Het Hooghuis · [month.current] [year.current]",1,312],["Glasbewassing trappenhal (binnenzijde)",1,38]],beurt:1}};
function demoRnd(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function demoMaak(){
  const R=demoRnd(20261028),pick=a=>a[Math.floor(R()*a.length)],ri=(a,b)=>a+Math.floor(R()*(b-a+1)),t=today(),D=n=>iso(addDays(t,n)),geo={};
  const wd=n=>addDays(t,n).getDay(),isWerk=n=>wd(n)>0&&wd(n)<6;
  /* tijdstempel op dag n om HH:MM lokale tijd */
  const TS=(n,hm)=>{const x=addDays(t,n),[h,m]=String(hm).split(":").map(Number);x.setHours(h,m,0,0);return x.toISOString()};
  const hm=min=>String(Math.floor(min/60)).padStart(2,"0")+":"+String(Math.round(min%60)).padStart(2,"0");
  const klanten=[],beurten=[],facturen=[],berichten=[],banktx=[],kosten=[],routes=[];let ki=0;
  const gewichten=DEMO_PLAATS.flatMap((p,i)=>Array(p[4]).fill(i));
  const gebruikt=new Set();
  const adresIn=p=>{let a;do{a=pick(DEMO_STRAAT)+" "+ri(1,96)+(R()<.08?pick(["a","b"]):"")}while(gebruikt.has(a+p[0]));gebruikt.add(a+p[0]);return a};
  const nieuwK=(naam,soort,prijs,freq,pi,extra)=>{const p=DEMO_PLAATS[pi],pc=p[1]+" "+String.fromCharCode(65+ri(0,19))+String.fromCharCode(65+ri(0,23)),adres=adresIn(p);
    const id="kdemo"+String(++ki).padStart(3,"0"),mail=naam.toLowerCase().replace(/^(.+?), (.+)$/,"$2.$1").replace(/[^a-z]+/g,".").replace(/^\.|\.$/g,"");
    const k={naam,adres,postcode:pc,plaats:p[0],telefoon:"06 "+String(ri(10000000,99999999)).replace(/(\d{4})(\d{4})/,"$1 $2"),email:mail+"@"+pick(soort==="particulier"?["gmail.com","hotmail.com","ziggo.nl","kpnmail.nl","live.nl","outlook.com"]:["voorbeeld.nl"]),
      prijs,frequentie:freq,ronde:p[0],dienst:"Glasbewassing",duur:30,soort,actief:true,binnen:false,aangemaakt:D(-ri(60,1400)),log:[],objecten:[],gepland:"",tijd:"",laatst:"",notities:"",contactPlanning:"kennisgeving",directFactureren:true,autoplan:true,_team:p[5],...extra};
    geo[(k.adres+"|"+pc.replace(/\s+/g,"")+"|"+p[0]).toLowerCase()]=[+(p[2]+(R()-.5)*.014).toFixed(6),+(p[3]+(R()-.5)*.022).toFixed(6)];
    klanten.push({id,...k});return klanten[klanten.length-1]};

  /* ---- particulieren: woningtype bepaalt prijs en duur ---- */
  /* prijzen incl. btw; gemiddeld ± € 60 excl. per woning, zo’n 8 à 10 woningen per bus per dag ≈ € 520 */
  const TYPES=[[.42,[62.5,64.5,67.5],[20,30]],[.32,[68.5,71.5,74.5],[25,35]],[.20,[78.5,82.5,86.5],[30,45]],[.06,[94.5,99.5,109.5],[45,60]]];
  for(let i=0;i<620;i++){const a=pick(DEMO_ACHTER),v=pick(DEMO_VOOR);let r=R(),ty=TYPES[0];for(const x of TYPES){if(r<x[0]){ty=x;break}r-=x[0]}
    const binnen=R()<.07,f=binnen?pick([8,12,12]):pick([4,6,6,6,8,8,8,8,8,12,12]);let prijs=pick(ty[1]);if(binnen)prijs=Math.round(prijs*1.85*2)/2;
    const k=nieuwK(a+", "+v,"particulier",prijs,f,pick(gewichten),{binnen,dienst:binnen?"Glasbewassing binnen en buiten":"Glasbewassing",duur:Math.round(ri(ty[2][0],ty[2][1])/5)*5*(binnen?2:1)});
    if(R()<.05)k.directFactureren=false;/* factuur klaarzetten */
    const bp=R();k._betaal=bp<.27?"mollie":bp<.50?"snel":bp<.80?"normaal":bp<.92?"laat":bp<.96?"slecht":"contant";
    if(R()<.09){k.actief=false;k.inactiefOp=D(-ri(20,300));k.opzegReden=pick(["Verhuisd","Doet het zelf","Te duur","Huis verkocht","Andere glazenwasser"])}
    /* extra opdrachten die meegaan met de glasbewassing */
    const e=R();if(k.actief&&e<.22){const o=e<.09?{dienst:"Dakgoten reinigen",prijs:pick([55,65,75]),duur:30,frequentie:52}:e<.17?{dienst:"Zonnepanelen reinigen",prijs:ri(10,26)*4.5,duur:35,frequentie:52}:{dienst:"Kozijnen reinigen",prijs:pick([29.5,35,42.5]),duur:20,frequentie:26};
      k.opdrachten=[{id:"odemo"+ki,nr:2,...o,laatst:"",volgende:"",actief:true,facturatie:""}];k.opdrNrMax=2}
    if(k.actief&&R()<.12)k.taak=pick(["Achterom via de poort, hond is binnen.","Sleutel ligt onder de bloempot bij de achterdeur.","Serredak niet betreden.","Graag aanbellen, mevrouw is slecht ter been.","Auto staat soms op de oprit, ladder links zetten.","Alleen buitenkant, dakkapel ook meenemen."])}
  /* ---- zakelijk en VvE ---- */
  DEMO_ZAAK.forEach(([n,s,p,f,dienst],i)=>{const pi=[0,0,0,12,8,12,16,12,2,0,12,8,14,0,12,12,8,12,0,0,6,13,12,12,0,8,12][i]??0;
    const k=nieuwK(n,s,p,f,pi,{dienst,duur:s==="vve"?ri(75,120):p>200?180:p>100?ri(60,90):p>60?ri(35,55):ri(20,30),contact:s==="vve"?"Bestuur "+n:pick(DEMO_VOOR)+" "+pick(DEMO_ACHTER),termijn:s==="particulier"?14:30});
    k._betaal=R()<.4||s==="vve"?"incasso":pick(["snel","normaal","normaal","laat"]);if(k._betaal==="incasso")k.incasso=true;
    if(DEMO_PER[n]){const P=DEMO_PER[n];k.directFactureren=false;k.factPer=true;k._per=P;
      const vol=new Date(t.getFullYear(),t.getMonth()+1,1);k.periodiek={aan:true,freq:P.freq,volgende:iso(vol),laatst:iso(new Date(t.getFullYear(),t.getMonth(),1)),modus:"versturen",btw:21,extraModus:"concept",regels:P.regels.map(([o,a,pr])=>({omschrijving:o,aantal:a,prijs:pr,btw:21}))};
      k.prijs=Math.round(P.regels.reduce((a,r)=>a+r[1]*r[2],0)*1.21/(4.33/k.frequentie)*100)/100}
    if(n==="VvE Het Hooghuis"){k.weekdagen=[2];k.autoplan=true;k.duur=75;k.taak="Trappen stofzuigen en dweilen, leuningen en liftdeuren afnemen, entreeglas binnen."}
    if(n==="VvE De Linde"){k.adres="Lindenlaan 14";k.postcode="9801 LK";k.plaats="Zuidhorn";geo["lindenlaan 14|9801lk|zuidhorn"]=[53.2471,6.4031];k.taak="24 appartementen. Galerijen en trappenhuis-glas buitenzijde. Sleutel technische ruimte bij de beheerder (06 41 22 87 10)."}});
  const actief=klanten.filter(k=>k.actief);

  /* ---- planning vandaag: Mark rijdt boven het kanaal, Sem rond Leek en Grootegast ---- */
  const kies=(team,n)=>{const l=actief.filter(k=>k._team===team&&k.soort==="particulier"&&!k.weekdagen&&k.frequentie<=8);const o=[];const pl=pick(l).plaats;
    l.filter(k=>k.plaats===pl).concat(l.filter(k=>k.plaats!==pl)).forEach(k=>{if(o.length<n&&!o.includes(k))o.push(k)});return o};
  const vandaagM=isWerk(0)?kies("M",9):[],vandaagS=isWerk(0)?kies("S",8):[];
  const zm=actief.find(k=>k.naam==="Makelaardij Zuidhorn");if(zm&&vandaagM.length)vandaagM.splice(4,0,zm);
  const vandaagAlle=[...vandaagM,...vandaagS],vandaagSet=new Set(vandaagAlle);
  /* laatste beurt van elke klant zo kiezen dat de volgende beurt in de komende weken valt */
  const laatsteDag={};
  actief.forEach(k=>{const st=k.frequentie*7;let d;
    if(vandaagSet.has(k))d=-st;
    else if(k.weekdagen){d=-((wd(0)-2+7)%7||7)}
    else{do{d=-ri(1,st-1)}while(!isWerk(d))}
    while(!isWerk(d))d--;laatsteDag[k.id]=d});
  /* een paar klanten zijn over tijd: die staan bij Te plannen */
  actief.filter(k=>k.soort==="particulier"&&!vandaagSet.has(k)).slice(5,13).forEach(k=>{let d=-k.frequentie*7-ri(3,12);while(!isWerk(d))d--;laatsteDag[k.id]=d;k._teplannen=true});

  /* ---- geschiedenis: 13 maanden beurten en facturen ---- */
  const ruim=n=>{const x=addDays(t,n),m=x.getMonth(),dg=x.getDate();return (m===11&&dg>=22)||(m===0&&dg<=4)};/* kerstvakantie */
  const fs=[];/* [factuur, beurten] */
  const doorVan=k=>k._team==="M"?"Mark":"Sem";
  const beurtOp=(d,k,idx)=>TS(d,hm(8*60+5+idx*38+ri(0,15)));
  klanten.filter(k=>!k.actief&&k.inactiefOp).forEach(k=>{let d=Math.round((parse(k.inactiefOp)-t)/864e5)-ri(3,k.frequentie*7);while(!isWerk(d))d--;laatsteDag[k.id]=d});
  klanten.filter(k=>laatsteDag[k.id]!=null).forEach(k=>{const st=k.frequentie*7;let n=0;const min=Math.round((new Date(t.getFullYear()-1,0,1)-t)/864e5);const aanm=Math.max(min,Math.round((parse(k.aangemaakt)-t)/864e5));
    const dagen=[];for(let d=laatsteDag[k.id];d>=aanm;d-=st){let x=d;if(ruim(x))continue;while(!isWerk(x))x--;dagen.push(x)}
    dagen.reverse();
    dagen.forEach((d,j)=>{const bid="bdemo"+k.id.slice(5)+"_"+(-d),idx=ri(0,9),op=beurtOp(d,k,idx),duur=Math.max(10,k.duur+ri(-4,6)),start=new Date(new Date(op).getTime()-duur*6e4).toISOString();
      const b={id:bid,klantId:k.id,klantNaam:k.naam,datum:D(d),bedrag:k.prijs,betaald:false,gefactureerd:"",dienst:k.dienst,tijd:"",duur,gemeten:true,startOp:start,door:doorVan(k),op};
      let regels=[{omschrijving:k.dienst+" "+k.adres+", "+k.plaats,aantal:1,prijs:k.prijs}];
      /* extra opdracht bij de laatste beurt in zijn ritme */
      const o=(k.opdrachten||[])[0];if(o){const per=o.frequentie*7,naLaatste=-d;if(!o.laatst&&naLaatste<per&&naLaatste>=Math.max(14,per-200)&&R()<.5||(!o.laatst&&j===dagen.length-1&&o.frequentie===26)){o.laatst=D(d);o.volgende=D(d+per);b.extra=[o.dienst];b.bedrag=+(k.prijs+o.prijs).toFixed(2);b.duur+=o.duur;regels.push({omschrijving:o.dienst,aantal:1,prijs:o.prijs})}}
      if(k.factPer){b.bedrag=0;b.periodiek=true;b.gefactureerd="periodiek";beurten.push(b);return}
      if(k.weekdagen){beurten.push(b);return}
      beurten.push(b);fs.push([k,b,regels,d])});
    if(dagen.length)k.laatst=D(dagen[dagen.length-1]);
    const o=(k.opdrachten||[])[0];if(o&&!o.laatst){o.volgende=D(ri(10,160))}});
  /* VvE Het Hooghuis: elke dinsdag trappenhal, gefactureerd per maand */
  const hh=actief.find(k=>k.naam==="VvE Het Hooghuis");
  if(hh){beurten.filter(b=>b.klantId===hh.id).forEach(b=>{b.bedrag=0;b.periodiek=true;b.gefactureerd="periodiek"});
    for(let d=laatsteDag[hh.id];d>=Math.round((new Date(t.getFullYear()-1,0,1)-t)/864e5);d-=7){if(ruim(d))continue;if(!beurten.some(b=>b.klantId===hh.id&&b.datum===D(d)))beurten.push({id:"bdemohh_"+(-d),klantId:hh.id,klantNaam:hh.naam,datum:D(d),bedrag:0,betaald:false,gefactureerd:"periodiek",periodiek:true,dienst:hh.dienst,duur:ri(70,85),gemeten:true,door:"Sem",op:TS(d,"09:40")})}
    hh.laatst=D(laatsteDag[hh.id])}

  /* ---- facturen per beurt, met echt betaalgedrag ---- */
  const gem=(k,d)=>{const p=k._betaal;return p==="mollie"?ri(0,1):p==="snel"?ri(3,8):p==="normaal"?ri(8,16):p==="laat"?ri(13,30):p==="slecht"?ri(24,55):p==="incasso"?ri(4,6):0};
  fs.forEach(([k,b,regels,d])=>{const fid="fdemo"+b.id.slice(5),termijn=Number(k.termijn)||14,
      f={id:fid,soort:"factuur",nummer:"",klantId:k.id,klantNaam:k.naam,klantAdres:k.adres+", "+k.postcode+" "+k.plaats,klantEmail:k.email,datum:D(d),verval:D(d+termijn),status:"open",regels,btw:21,incl:true,verstuurdOp:D(d),verstuurdTs:b.op,gemaakt:b.op,betaalwijze:k.incasso?"incasso":"overmaken",log:[]};
    b.gefactureerd=fid;
    /* gisteren en vandaag: klanten met "factuur klaarzetten" hebben nog een concept */
    if(!k.directFactureren&&d>=-2){f.status="concept";delete f.verstuurdOp;delete f.verstuurdTs;facturen.push(f);return}
    if(k.incasso){f.incasso=true;f.incassoOp=TS(d+1,"06:15")}
    const off=gem(k,d),bd=d+off;
    if(k._betaal==="contant"){Object.assign(f,{status:"betaald",betaalwijze:"contant",betaaldOp:D(d),betaaldTs:b.op});b.betaald=true}
    else if(bd<=0||(bd<=1&&k._betaal==="mollie"&&d<0)){Object.assign(f,{status:"betaald",betaalwijze:k._betaal==="mollie"?"mollie":k.incasso?"incasso":"overmaken",betaaldOp:D(Math.min(bd,0)),betaaldTs:TS(Math.min(bd,0),hm(ri(7*60,22*60)))});b.betaald=true}
    if(k._betaal==="mollie")f.betaallink="https://www.mollie.com/checkout/demo";
    /* herinneringen: verstuurd als de factuur (toen) over de vervaldatum was */
    const tot=f.status==="betaald"?bd:0,te=tot-(d+termijn);
    if(!k.incasso&&te>3){f.herinneringen=te>17?2:1;f.herinnerdOp=D(d+termijn+(te>17?17:3));f.herinnerData=[D(d+termijn+3),...(te>17?[D(d+termijn+17)]:[])]}
    if(!k.incasso&&f.status==="open"&&te>45){f.wikOp=D(d+termijn+31);f.herinnerData.push(f.wikOp)}
    facturen.push(f)});
  /* twee oude facturen van een wanbetaler zijn oninbaar */
  const slecht=facturen.filter(f=>f.herinneringen===2&&!f.periodiek&&f.datum<D(-150)&&f.datum>D(-260)).slice(0,2);
  slecht.forEach(f=>{Object.assign(f,{status:"oninbaar",oninbaarOp:D(-ri(20,60)),betaaldOp:"",betaaldTs:"",wikOp:D(Math.round((parse(f.verval)-t)/864e5)+31)});f.herinnerData=[...(f.herinnerData||[]),f.wikOp];const b=beurten.find(b=>b.gefactureerd===f.id);if(b)b.betaald=false});
  /* creditnota na een klacht (streep op het glas, half geld terug) */
  {const o=facturen.find(f=>f.status==="betaald"&&f.datum<D(-70)&&f.datum>D(-110)&&f.regels[0].prijs>30);
    if(o){const c={...o,id:"fdemo_credit1",nummer:"",datum:D(-Math.round((t-parse(o.datum))/864e5)+9),regels:[{omschrijving:"Creditering 50% glasbewassing "+o.datum.split("-").reverse().join("-")+" (strepen op de serre, afgesproken met klant)",aantal:1,prijs:-Math.round(o.regels[0].prijs/2*100)/100}],status:"betaald",betaalwijze:"overmaken",creditVan:o.id,herinneringen:0,herinnerdOp:"",herinnerData:[]};
      c.verval=c.datum;c.betaaldOp=c.datum;c.gemaakt=c.datum+"T10:12:00.000Z";c.verstuurdOp=c.datum;delete c.wikOp;facturen.push(c)}}
  /* periodieke facturen: elke 1e van de maand */
  actief.filter(k=>k._per).forEach(k=>{const P=k._per;for(let m=t.getMonth()+12;m>=0;m--){const dt=new Date(t.getFullYear(),t.getMonth()-m,1),ds=iso(dt),dn=Math.round((dt-t)/864e5);if(ds<k.aangemaakt&&m<t.getMonth()+12)continue;
      const fid="per_"+k.id+"_"+ds.replace(/-/g,""),regels=P.regels.map(([o,a,p])=>({omschrijving:perFill(o,ds),aantal:a,prijs:p,btw:21}));
      const f={id:fid,soort:"factuur",nummer:"",klantId:k.id,klantNaam:k.naam,klantAdres:k.adres+", "+k.postcode+" "+k.plaats,klantEmail:k.email,datum:ds,verval:D(dn+30),status:"open",regels,btw:21,incl:false,periodiek:true,verstuurdOp:ds,verstuurdTs:TS(dn,"07:02"),gemaakt:TS(dn,"07:00"),betaalwijze:k.incasso?"incasso":"overmaken",log:[]};
      if(k.incasso){f.incasso=true;f.incassoOp=TS(dn+1,"06:15")}
      const bd=dn+(k.incasso?5:ri(9,24));if(bd<=0)Object.assign(f,{status:"betaald",betaaldOp:D(bd),betaaldTs:TS(bd,"11:20")});
      facturen.push(f);
      const vorige=iso(new Date(dt.getFullYear(),dt.getMonth()-1,1));beurten.filter(b=>b.klantId===k.id&&b.datum>=vorige&&b.datum<ds).forEach(b=>b.gefactureerd=fid)}});
  /* per dag en per persoon: klussen achter elkaar, met rijtijd en een halfuur lunch */
  {const G={};beurten.forEach(b=>{if(b.op&&b.datum<D(0))(G[b.datum+"|"+b.door]=G[b.datum+"|"+b.door]||[]).push(b)});
    Object.values(G).forEach(l=>{l.sort((a,b)=>a.op.localeCompare(b.op));const dn=Math.round((parse(l[0].datum)-t)/864e5);let m=8*60+ri(0,15),lunch=false;
      l.forEach(b=>{if(!lunch&&m>=12*60){m+=30;lunch=true}b.startOp=TS(dn,hm(m));m+=b.duur;b.op=TS(dn,hm(m));m+=ri(6,13)})});
    const fx=new Map(facturen.map(f=>[f.id,f]));fs.forEach(([k,b])=>{const f=fx.get(b.gefactureerd);if(f&&f.verstuurdTs){f.gemaakt=b.op;f.verstuurdTs=b.op}})}
  /* nummers op volgorde van datum, doorlopend over de jaren */
  let nr=7832;facturen.sort((a,b)=>(a.datum+a.gemaakt).localeCompare(b.datum+b.gemaakt)).forEach(f=>{if(f.status!=="concept")f.nummer=f.datum.slice(2,4)+"-"+String(nr++).padStart(6,"0")});
  facturen.filter(f=>f.status==="concept").forEach(f=>f.nummer=f.datum.slice(2,4)+"-"+String(nr++).padStart(6,"0"));

  /* ---- vandaag: de eerste adressen zijn klaar, bij elk team is er één bezig ---- */
  const tijdM=["08:00","08:25","08:55","09:20","09:50","10:25","11:00","11:30","13:00","13:35","14:05","14:40"],tijdS=["08:15","08:45","09:10","09:45","10:15","10:50","11:20","12:45","13:20","13:55","14:30"];
  /* afgemeld en "bezig" voor vandaag rekent demoVandaag() bij elk openen uit op de echte klok */
  const reeksTijd=(l,start)=>{let m=start,lunch=false;l.forEach(k=>{if(!lunch&&m>=12*60){m+=30;lunch=true}k.gepland=D(0);k.tijd=hm(Math.round(m/5)*5);m+=k.duur+ri(6,13)})};
  reeksTijd(vandaagM,8*60);reeksTijd(vandaagS,8*60+15);

  /* ---- komende drie weken inplannen; wat verder weg ligt, komt later bij Te plannen ---- */
  const perDag={};vandaagAlle.forEach(()=>perDag[0]=(perDag[0]||0)+1);
  actief.forEach(k=>{if(vandaagSet.has(k)||k._teplannen)return;
    if(k.weekdagen){let d=1;while(wd(d)!==2)d++;k.gepland=D(d);k.tijd="09:30";return}
    let d=laatsteDag[k.id]+k.frequentie*7;if(d<=0)d=1;if(d>21)return;
    while(!isWerk(d)||(perDag[d]||0)>=19)d++;perDag[d]=(perDag[d]||0)+1;k.gepland=D(d);k.tijd=hm(8*60+(perDag[d]-1)%11*35)});
  /* klanten die "bevestigen" willen of liever gebeld worden */
  actief.filter(k=>k.soort==="particulier").forEach((k,i)=>{if(i%9===3)k.contactPlanning="bevestigen";else if(i%17===5)k.contactPlanning="bellen"});

  /* ---- nieuwe aanmeldingen via de website ---- */
  {const k=nieuwK("Zijlstra, Marloes","particulier",68,8,8,{adres:"Fazantenlaan 62"});const P=(x,y,t)=>({x,y,t});
    Object.assign(k,{gepland:"",tijd:"",laatst:"",aangemaakt:D(0),nieuwAangemeld:true,eersteKeer:true,tellingControle:true,aanbieden:true,duur:35,bron:"website",
      ramenRegel:{f:[5,3,0,0],sp:{tuimel:3}},log:[{datum:D(0),tekst:"Aanvraag via de website · 11 ramen (telling klant) · € 68,00 per beurt, elke 8 weken"}],
      ramenTelling:{ramen:11,floors:[5,3],special:{tuimel:3},fotos:[{id:"demo-huis",w:642,h:530,zijde:"Voorkant",dots:[P(.127,.67,"f0"),P(.383,.70,"f0"),P(.458,.70,"f0"),P(.66,.67,"f0"),P(.693,.72,"f0"),P(.726,.42,"f1"),P(.762,.42,"f1"),P(.796,.42,"f1"),P(.16,.48,"s-tuimel"),P(.273,.47,"s-tuimel"),P(.39,.44,"s-tuimel")]}]}})
    const k2=nieuwK("Hamstra, Jelle","particulier",26.5,6,12,{});Object.assign(k2,{aangemaakt:D(-2),nieuwAangemeld:true,eersteKeer:true,aanbieden:true,bron:"website",log:[{datum:D(-2),tekst:"Aanvraag via de website · twee-onder-een-kap · € 26,50 per beurt, elke 6 weken"}]})}

  /* ---- offertes ---- */
  let on=0;const off=(naam,adres,st,regels,dd,extra)=>{on++;facturen.push({id:"odemo"+on,soort:"offerte",nummer:"OFF-"+D(dd).slice(0,4)+"-"+String(100+on).padStart(3,"0"),klantId:"",klantNaam:naam,klantAdres:adres,klantEmail:"",datum:D(dd),verval:D(dd+30),status:st,regels,btw:21,incl:true,gemaakt:TS(dd,"16:40"),...(st!=="concept"?{verstuurdOp:D(dd)}:{}),...(extra||{})})};
  off("Gemeente Westerkwartier, locatie Zuidhorn","Hooghuis 1, 9801 AB Zuidhorn","verstuurd",[{omschrijving:"Glasbewassing gemeentehuis buitenzijde, elke 8 weken",aantal:1,prijs:485},{omschrijving:"Glasbewassing binnenzijde, 2x per jaar",aantal:1,prijs:620}],-6);
  off("Familie Wijnstra","Molenweg 7, 9363 AB Marum","verstuurd",[{omschrijving:"Glasbewassing, elke 6 weken",aantal:1,prijs:64.5},{omschrijving:"Eenmalig kozijnen reinigen",aantal:1,prijs:85}],-3);
  off("Huisartsenpraktijk Aduard","Eikenlaan 2, 9831 AC Aduard","geaccepteerd",[{omschrijving:"Glasbewassing binnen en buiten, elke 4 weken",aantal:1,prijs:110}],-12,{akkoordOp:D(-9)});
  off("Camping De Watermolen","Kanaalweg 40, 9843 TE Grijpskerk","geaccepteerd",[{omschrijving:"Glasbewassing receptie en sanitairgebouwen, april t/m september elke 2 weken",aantal:1,prijs:138}],-44,{akkoordOp:D(-40)});
  off("Kuiper, Henk","Hoofdstraat 88, 9351 AG Leek","geaccepteerd",[{omschrijving:"Glasbewassing, elke 8 weken",aantal:1,prijs:69.5},{omschrijving:"Zonnepanelen reinigen (18 panelen), 1x per jaar",aantal:1,prijs:81}],-27,{akkoordOp:D(-26)});
  off("Restaurant Het Kanaal","Kanaalweg 3, 9801 AA Zuidhorn","afgewezen",[{omschrijving:"Glasbewassing, elke 2 weken",aantal:1,prijs:58}],-61);
  off("Doornbos, Gea","Wilhelminastraat 12, 9861 BH Grootegast","afgewezen",[{omschrijving:"Glasbewassing binnen en buiten, elke 8 weken",aantal:1,prijs:119.5}],-35);
  off("Bouwbedrijf Nijdam","Industrieweg 9, 9351 PK Leek","verstuurd",[{omschrijving:"Opleveringsschoonmaak glas, 6 woningen",aantal:6,prijs:95}],-41);
  off("VvE De Vaart","Reitdiep 2-40, 9801 ZZ Zuidhorn","concept",[{omschrijving:"Glasbewassing buitenzijde 38 appartementen, elke 8 weken",aantal:1,prijs:425}],-1);
  off("De Wit, Marco","Kievitstraat 21, 9351 KD Leek","concept",[{omschrijving:"Glasbewassing",aantal:1,prijs:62.5}],0);

  /* ---- kosten: brandstof, bus, verzekering, materiaal ---- */
  const kost=(d,bedrag,leverancier,categorie,omschrijving,btw=21)=>kosten.push({id:"cdemo"+kosten.length,datum:D(d),bedrag:+bedrag.toFixed(2),leverancier,btw,categorie,omschrijving,bon:"",aangemaakt:TS(d,"18:10")});
  for(let m=t.getMonth()+12;m>=0;m--){const eerste=Math.round((new Date(t.getFullYear(),t.getMonth()-m,1)-t)/864e5),inM=n=>eerste+n<=0;
    if(inM(0))kost(eerste,489,"Volkswagen Financial Services","Auto en bus","Lease Volkswagen Transporter (VZK-38-T)");
    if(inM(1)){kost(eerste+1,96.4,"Centraal Beheer","Verzekering","Autoverzekering bussen",0);kost(eerste+1,47.8,"Interpolis","Verzekering","Bedrijfsaansprakelijkheid",0)}
    if(inM(3)){kost(eerste+3,42.5,"KPN","Telefoon en internet","Abonnement Mark");kost(eerste+3,32.5,"KPN","Telefoon en internet","Abonnement Sem")}
    if(inM(1))kost(eerste+1,99*1.21,"Mansard","Software","Abonnement Mansard CRM");
    if(inM(2))kost(eerste+2,11.95,"Knab","Overig","Bankkosten zakelijke rekening",0);
    if(inM(4))kost(eerste+4,ri(14,26)+R(),"Mollie","Overig","Transactiekosten betaallinks");
    [5,12,19,26].forEach((n,j)=>{if(inM(n)&&isWerk(eerste+n))kost(eerste+n,ri(68,96)+R(),pick(["Tango Zuidhorn","TinQ Grootegast","Shell Leek","Tango Leek"]),"Brandstof","Diesel "+(j%2?"VNP-71-B":"VZK-38-T"))});
    if(inM(9))kost(eerste+9,ri(45,190)+R(),"Glazenwassersgroothandel Noord","Materiaal",pick(["Zeep, inwassers en wissers","Rubbers, zeemlappen en emmers","Glasreiniger en microvezeldoeken"]));
    if(m%2===0&&inM(15))kost(eerste+15,129,"Osmose Service Nederland","Materiaal","Harsfilters osmose-installatie");
    if(m%3===1&&inM(20))kost(eerste+20,225*1.21,"Administratiekantoor Bolt","Overig","Btw-aangifte en administratie kwartaal")}
  kost(-212,389,"Glazenwassersgroothandel Noord","Gereedschap","Telescoopsteel carbon 14 m");kost(-96,612.4,"Garage Hoving","Auto en bus","Grote beurt en APK VNP-71-B");kost(-305,184.5,"Workwear Groningen","Kleding","Werkkleding met logo (2 sets)");
  kost(-41,163.2,"Workwear Groningen","Kleding","Winterjassen Mark en Sem");kost(-158,74.95,"Gamma Leek","Gereedschap","Ladderstabilisator");kost(-11,286.5,"Garage Hoving","Auto en bus","Winterbanden VZK-38-T");
  const ronde=x=>Math.round(x*100)/100;kosten.forEach(c=>c.bedrag=ronde(c.bedrag));
  kosten.splice(0,kosten.length,...kosten.filter(c=>c.datum<=D(0)));

  /* ---- werkdagen en kilometers ---- */
  const dagen=[...new Set(beurten.filter(b=>b.datum>=D(-120)&&b.datum<=D(0)).map(b=>b.datum))].sort();let standM=84210,standS=131560;
  dagen.forEach(ds=>{const dn=Math.round((parse(ds)-t)/864e5),bs=beurten.filter(b=>b.datum===ds&&b.op&&b.door==="Mark").sort((a,b)=>a.op.localeCompare(b.op));if(!bs.length)return;
    const start=TS(dn,hm(7*60+40+ri(0,20))),laatsteOp=bs[bs.length-1].op,stop=dn===0?"":new Date(new Date(laatsteOp).getTime()+ri(18,35)*6e4).toISOString();
    const kmM=ri(38,72),kmS=ri(44,86);const r={id:ds,werk:{start,...(stop?{stop}:{}),pauzes:[{van:TS(dn,"12:15"),tot:dn===0?TS(dn,"12:45"):TS(dn,hm(12*60+15+ri(25,40)))}],door:"mark@voorbeeldglazenwasserij.nl"},
      ritten:[{id:"rM"+ds,nr:0,auto:"VZK-38-T",begin:standM,eind:stop?standM+kmM:"",startTs:start,stopTs:stop,van:"Lindenlaan 14, Zuidhorn",naar:"Lindenlaan 14, Zuidhorn",route:"Loods – klanten – loods",type:"zakelijk",door:"mark@voorbeeldglazenwasserij.nl",bron:"werkdag"},
        {id:"rS"+ds,nr:0,auto:"VNP-71-B",begin:standS,eind:stop?standS+kmS:"",startTs:start,stopTs:stop,van:"Lindenlaan 14, Zuidhorn",naar:"Lindenlaan 14, Zuidhorn",route:"Loods – klanten – loods",type:"zakelijk",door:"sem@voorbeeldglazenwasserij.nl",bron:"werkdag"}]};
    if(stop){standM+=kmM;standS+=kmS}routes.push(r)});
  if(vandaagAlle.length){let r=routes.find(x=>x.id===D(0));if(!r){r={id:D(0)};routes.push(r)}delete r.werk;delete r.ritten;r.order=vandaagAlle.map(k=>k.id);r.notitie="Sem: na Leek nog langs de groothandel voor nieuwe rubbers."}

  /* ---- verzonden berichten van de afgelopen weken ---- */
  facturen.filter(f=>f.soort==="factuur"&&f.verstuurdOp&&f.verstuurdOp>=D(-21)).forEach((f,i)=>berichten.push({id:"mdemo"+i,klantId:f.klantId,klantNaam:f.klantNaam,naar:f.klantEmail,kanaal:"email",sjabloon:"factuur",onderwerp:"Factuur "+f.nummer+" – Voorbeeld Glazenwasserij",tekst:"Beste klant, in de bijlage vindt u factuur "+f.nummer+".",op:f.verstuurdTs||f.verstuurdOp+"T13:05:00.000Z",verstuurdOp:f.verstuurdTs||f.verstuurdOp+"T13:05:00.000Z",ref:"factuur:"+f.id,status:i%4?"geopend":"bezorgd",opens:i%4?1+(i%3):0}));
  facturen.filter(f=>f.herinnerdOp&&f.herinnerdOp>=D(-30)).forEach((f,i)=>berichten.push({id:"hdemo"+i,klantId:f.klantId,klantNaam:f.klantNaam,naar:f.klantEmail,kanaal:"email",sjabloon:"aanmaning",onderwerp:"Herinnering factuur "+f.nummer,tekst:"Beste klant, wij hebben de betaling van factuur "+f.nummer+" nog niet ontvangen.",op:f.herinnerdOp+"T09:00:00.000Z",verstuurdOp:f.herinnerdOp+"T09:00:00.000Z",ref:"aanmaning:"+f.id,status:"geopend",opens:1}));

  /* ---- bank ---- */
  const lo=facturen.filter(f=>f.soort==="factuur"&&f.status==="open"&&!f.incasso&&f.datum<D(-3));
  if(lo[0])banktx.push({id:"tx_demo1",datum:D(-1),bedrag:Math.max(5,totals(lo[0]).inc-2.5),naam:lo[0].klantNaam.split(",")[0].toUpperCase(),iban:"NL20INGB0001234567",omschrijving:"glazenwasser "+lo[0].nummer,status:"controleren",factuurIds:[lo[0].id],nummers:[lo[0].nummer],reden:"Bedrag wijkt af: ontvangen "+eur(Math.max(5,totals(lo[0]).inc-2.5))+", factuur "+eur(totals(lo[0]).inc),bron:"Bank Knab",op:new Date().toISOString()});
  banktx.push({id:"tx_demo2",datum:D(-2),bedrag:30,naam:"J. DE GROOT",iban:"NL55RABO0123456789",omschrijving:"ramen wassen",status:"onbekend",reden:"Geen factuur gevonden bij deze betaling",bron:"Bank Knab",op:new Date().toISOString()});
  const inst=[{id:"bedrijf",naam:"Voorbeeld Glazenwasserij",adres:"Lindenlaan 14",postcode:"9801 AB",plaats:"Zuidhorn",startadres:"Lindenlaan 14, 9801 AB Zuidhorn",telefoon:"06 12 34 56 78",email:"info@voorbeeldglazenwasserij.nl",website:"voorbeeldglazenwasserij.nl",kvk:"12345678",btwnr:"NL001234567B01",iban:"NL00 DEMO 0123 4567 89",btw:21,incl:true,termijn:14,factNrStijl:"doorlopend",factNrStart:"7832",fhAan:true,dagAan:true,kmAan:true,
      voertuigen:[{kenteken:"VZK-38-T",naam:"Transporter Mark",stand:84210},{kenteken:"VNP-71-B",naam:"Caddy Sem",stand:131560}]},
    {id:"bank",gekoppeld:true,bank:"Knab",rekeningen:[{iban:"NL91 •••• 210",naam:"Zakelijke rekening"}],geldigTot:iso(addDays(t,92))+"T10:00:00.000Z",bijgewerkt:new Date(Date.now()-35*60e3).toISOString(),saldo:14862.35,laatsteSync:{nieuw:11,betaald:9,controleren:1}}];
  klanten.forEach(k=>{delete k._team;delete k._betaal;delete k._per;delete k._teplannen});
  return {gemaakt:iso(t),geo,cols:{klanten,beurten,facturen,berichten,banktx,instellingen:inst,routes,kosten}};
}
/* datums laten meeschuiven met de dag van vandaag (ook de dagroutes, want die hebben de datum als id) */
function demoSchuif(v,n,sleutel){if(!n)return v;if(typeof v==="string"&&/^\d{4}-\d{2}-\d{2}/.test(v)){if((sleutel==="id"||sleutel==="nummer")&&!/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const d=iso(addDays(parse(v.slice(0,10)),n));return d+v.slice(10)}if(Array.isArray(v))return v.map(x=>demoSchuif(x,n));if(v&&typeof v==="object")return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==="nummer"?x:demoSchuif(x,n,k)]));return v}
/* opslag in IndexedDB: een volledige demo met bijna twee jaar geschiedenis past niet in localStorage (5 MB) */
const demoIdb=()=>new Promise((res,rej)=>{try{const r=indexedDB.open("ms-demo",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}});
async function demoLees(){try{const db=await demoIdb();return await new Promise(res=>{const q=db.transaction("kv").objectStore("kv").get(DEMO_KEY);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)})}catch(e){return null}}
async function demoSchrijf(v){try{const db=await demoIdb();db.transaction("kv","readwrite").objectStore("kv").put(v,DEMO_KEY)}catch(e){}}
function demoBewaar(){try{const cols={};COLS.forEach(c=>cols[c]=[...mem[c].values()]);demoSchrijf({gemaakt:iso(today()),cols})}catch(e){}}
/* foto's in de demo: geen server, dus verkleind in deze browser bewaard; /_blob/<id> wordt in beeld vervangen door de foto zelf */
const DEMO_AKEY="ms.demo.assets";let DEMO_A={};try{DEMO_A=JSON.parse(localStorage.getItem(DEMO_AKEY)||"{}")||{}}catch(e){DEMO_A={}}
function demoAssetsBewaar(){for(let i=0;i<20;i++){try{localStorage.setItem(DEMO_AKEY,JSON.stringify(DEMO_A));return}catch(e){const k=Object.keys(DEMO_A);if(!k.length)return;delete DEMO_A[k[0]]}}}
const demoVerklein=file=>new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const m=1400,k=Math.min(1,m/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL("image/jpeg",.8))};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error("Deze foto kan niet worden gelezen"))};im.src=u});
const demoAssets={upload:async(file)=>{const id=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,"0")).join("");DEMO_A[id]=/^image\//.test(file.type||"image/jpeg")?await demoVerklein(file):await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(file)});demoAssetsBewaar();demoBlobFix(document);return {id}},
  list:async()=>({assets:Object.keys(DEMO_A).map(id=>({id}))})};
const DEMO_FOTO={"demo-huis":"/site/huis.jpg"};
function demoBlobFix(root){(root.querySelectorAll?root.querySelectorAll('img[src*="/_blob/demo-"]'):[]).forEach(el=>{const id=(el.getAttribute("src")||"").split("/_blob/")[1];if(DEMO_FOTO[id])el.setAttribute("src",DEMO_FOTO[id])});(root.querySelectorAll?root.querySelectorAll('img[src*="/_blob/"],a[href*="/_blob/"]'):[]).forEach(el=>{const at=el.tagName==="A"?"href":"src",v=el.getAttribute(at)||"",id=v.split("/_blob/")[1];if(id&&DEMO_A[id.split(/[?#]/)[0]])el.setAttribute(at,DEMO_A[id.split(/[?#]/)[0]])})}
new MutationObserver(ms=>{for(const m of ms){if(m.type==="attributes")demoBlobFix(m.target.parentNode||document);else m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches&&n.matches('img,a'))demoBlobFix(n.parentNode||document);demoBlobFix(n)}})}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["src","href"]});
/* vandaag naar de echte klok: wat volgens de route al af had moeten zijn is afgemeld (met factuur),
   wie op dit moment bij een adres is staat op "bezig", en de werkdag loopt van vertrek tot (als alles klaar is) terug bij de loods */
function demoVandaag(c){const ti=iso(today()),nu=new Date(),nm=nu.getHours()*60+nu.getMinutes();
  const r=(c.routes||[]).find(x=>x.id===ti);if(!r||!Array.isArray(r.order)||!r.order.length)return;
  c.beurten=(c.beurten||[]).filter(b=>!b.demoVandaag);c.facturen=(c.facturen||[]).filter(f=>!f.demoVandaag);
  const K=new Map((c.klanten||[]).map(k=>[k.id,k])),zelf=new Set(c.beurten.filter(b=>b.datum===ti).map(b=>b.klantId)),half=Math.ceil(r.order.length/2);
  const tsm=m=>{const x=today();x.setHours(Math.floor(m/60),Math.round(m%60),0,0);return x.toISOString()},mn=s=>{const[a,b]=String(s||"08:00").split(":").map(Number);return a*60+(b||0)};
  let nr=Math.max(0,...c.facturen.filter(f=>/^\d{2}-\d{6}$/.test(String(f.nummer||""))).map(f=>+String(f.nummer).slice(3)));
  let eerste=null,laatste=0,alles=true;const km={Mark:0,Sem:0};
  r.order.forEach((id,i)=>{const k=K.get(id);if(!k||k.gepland!==ti)return;const door=i<half?"Mark":"Sem",st=mn(k.tijd),dr=Number(k.duur)||30,eind=st+dr+((i*7)%5)-2;
    if(k.demoBezig){k.bezig="";k.bezigDoor="";delete k.demoBezig}
    if(door==="Mark")eerste=eerste==null?st:Math.min(eerste,st);km[door]+=6+(i*3)%7;
    if(zelf.has(id))return;
    if(eind<=nm){const op=tsm(eind),fid="fdemov"+id,regels=[{omschrijving:k.dienst+" "+k.adres+", "+k.plaats,aantal:1,prijs:k.prijs}];
      c.beurten.push({id:"bdemov"+id,klantId:id,klantNaam:k.naam,datum:ti,bedrag:k.prijs,betaald:false,gefactureerd:fid,dienst:k.dienst,tijd:k.tijd,duur:dr,gemeten:true,startOp:tsm(st),door,op,demoVandaag:true});
      c.facturen.push({id:fid,soort:"factuur",nummer:ti.slice(2,4)+"-"+String(++nr).padStart(6,"0"),klantId:id,klantNaam:k.naam,klantAdres:k.adres+", "+k.postcode+" "+k.plaats,klantEmail:k.email,datum:ti,verval:iso(addDays(today(),Number(k.termijn)||14)),status:"open",regels,btw:21,incl:true,verstuurdOp:ti,verstuurdTs:op,gemaakt:op,betaalwijze:k.incasso?"incasso":"overmaken",...(k.incasso?{incasso:true}:{}),log:[],demoVandaag:true});
      if(door==="Mark")laatste=Math.max(laatste,eind)}
    else{if(door==="Mark")alles=false;if(st<=nm&&!k.bezig){k.bezig=tsm(st);k.bezigDoor=door.toLowerCase()+"@voorbeeldglazenwasserij.nl";k.demoBezig=true}}});
  if(eerste==null||nm<eerste-10){delete r.werk;delete r.ritten;return}
  const start=tsm(eerste-8),stop=alles&&laatste?tsm(laatste+24):"";
  r.werk={start,...(stop?{stop}:{}),pauzes:nm>=12*60+45?[{van:tsm(12*60+15),tot:tsm(12*60+45)}]:nm>=12*60+15?[{van:tsm(12*60+15)}]:[],door:"mark@voorbeeldglazenwasserij.nl"};
  const stand=a=>{let m=0;(c.routes||[]).forEach(x=>(x.ritten||[]).forEach(t=>{if(x.id!==ti&&t.auto===a&&Number(t.eind)>m)m=Number(t.eind)}));return m};
  r.ritten=[["VZK-38-T","Mark"],["VNP-71-B","Sem"]].map(([a,w])=>{const b=stand(a);return{id:"r"+w+ti,nr:0,auto:a,begin:b,eind:stop?b+km[w]+14:"",startTs:start,stopTs:stop,van:"Lindenlaan 14, Zuidhorn",naar:"Lindenlaan 14, Zuidhorn",route:"Loods – klanten – loods",type:"zakelijk",door:w.toLowerCase()+"@voorbeeldglazenwasserij.nl",bron:"werkdag"}})}
async function demoStart(){
  if(!state.assets)state.assets=demoAssets;
  let d=null;const opnieuw=/[?&]opnieuw/.test(location.search);
  if(!opnieuw)d=await demoLees();try{localStorage.removeItem("ms.demo.v4")}catch(e){}
  if(opnieuw)try{history.replaceState(null,"",location.pathname)}catch(_){}
  if(!d){d=demoMaak();try{const G=JSON.parse(localStorage.getItem("ms.geo")||"{}");localStorage.setItem("ms.geo",JSON.stringify({...G,...d.geo}))}catch(e){}}
  /* een nieuwe dag: de demo opnieuw opbouwen (zelfde klanten, datums rond vandaag), zodat werkdagen op werkdagen blijven vallen */
  else if(d.gemaakt!==iso(today())){d=demoMaak()}
  demoVandaag(d.cols);
  /* bestaande demo's: voorbeeld-taakomschrijvingen bij de adressen van vandaag (eenmalig) */
  try{const kl=d.cols.klanten||[];if(!kl.some(k=>k.taak)){const TK=["Ramen buiten en kozijnen. Achterom via de poort aan de zijkant; graag de plantenbakken op de vensterbank laten staan.","Ook het glas van de voordeur en de serre. Ladder niet tegen de dakgoot zetten.","Alleen buitenkant. Sleutel van de poort hangt in het kastje naast de voordeur."];
    kl.filter(k=>k.gepland===iso(today())).slice(0,6).forEach((k,i)=>k.taak=TK[i%3])}}catch(e){}
  COLS.forEach(c=>{mem[c]=new Map((d.cols[c]||[]).map(x=>[x.id,x]));apply(c,[...mem[c].values()])});
  demoBewaar();
  const _s=save,_d=del;let tm=0;const later=()=>{clearTimeout(tm);tm=setTimeout(demoBewaar,300)};
  save=async(c,id,x)=>{await _s(c,id,x);later()};del=async(c,id)=>{await _d(c,id);later()};
  state.me={name:"Mark",email:"mark@voorbeeldglazenwasserij.nl"};
  const DL={save:async({filename,data})=>{const b=data instanceof Blob?data:new Blob([data]),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}};
  state.dl=DL;render();await init();
  state.dl=DL;if(!state.assets)state.assets=demoAssets;$("#status").innerHTML="";state.loaded=true;render();
}
