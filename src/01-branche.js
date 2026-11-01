/* ---------- BRANCHE: het vak van het bedrijf ----------
   "glazenwasser" is de standaard en blijft precies zoals het altijd was (ook mijnschoonmaker.com):
   elke functie hieronder geeft voor glazenwassers exact de oude tekst/waarde terug.
   Andere vakken (gekozen bij het aanmelden, Instellingen › Bedrijf) krijgen eigen woorden en standaarddiensten
   en zien de ramen-onderdelen (tellen per verdieping, ramen aantikken, tellingcontrole) niet. */
const BRANCHES=[
  {id:"glazenwasser",naam:"Glazenwassers",enk:"Glazenwasser",ic:"druppel"},
  {id:"schoorsteenveger",naam:"Schoorsteenvegers",enk:"Schoorsteenveger",ic:"vlam"},
  {id:"schilder",naam:"Schilders",enk:"Schilder",ic:"roller"},
  {id:"hovenier",naam:"Hoveniers",enk:"Hovenier",ic:"boom"},
  {id:"timmerman",naam:"Timmerlieden",enk:"Timmerman",ic:"hamer"},
  {id:"betonboorder",naam:"Betonboorders",enk:"Betonboorder",ic:"boor"}];
const brGeldig=b=>BRANCHES.some(x=>x.id===b);
function BR(){try{/* mijnschoonmaker.com (het eigen glazenwassersbedrijf) is altijd glazenwasser */if(typeof LIVE!=="undefined"&&LIVE&&(!window.ZEEM_BID||window.ZEEM_BID==="mijnschoonmaker"))return"glazenwasser";const b=String((typeof state!=="undefined"&&state.settings&&state.settings.branche)||"");return brGeldig(b)?b:"glazenwasser"}catch(e){return"glazenwasser"}}
const GLAS=()=>BR()==="glazenwasser";
const brInfo=(b=BR())=>BRANCHES.find(x=>x.id===b)||BRANCHES[0];
/* hoofddienst: valt terug als een klant (nog) geen dienst heeft */
const BR_HOOFD={glazenwasser:"Glasbewassing",schoorsteenveger:"Schoorsteen vegen",schilder:"Schilderwerk",hovenier:"Tuinonderhoud",timmerman:"Timmerwerk",betonboorder:"Kernboren"};
const HD=()=>BR_HOOFD[BR()]||"Glasbewassing";
/* woorden die per vak verschillen; [glazenwasser, ander vak] */
const BR_W={
  laatst:["Laatst gewassen","Laatste bezoek"],
  gewassen:["Gewassen","Klaar"],
  nogNiet:["Nieuwe klant, nog niet gewassen","Nieuwe klant, nog niet geweest"],
  netGewassen:["net gewassen","net geweest"],
  woning:["woning","adres"],woningen:["woningen","adressen"],Woningen:["Woningen","Adressen"],
  medewerker:["Medewerker (glazenwasser)","Medewerker"],
  uwWerk:["Uw ramen zijn gewassen","Het werk is klaar"]};
const BW=k=>{const w=BR_W[k];return w?(GLAS()?w[0]:w[1]):k};
/* standaarddiensten per vak (Uitvoering); glazenwassers houden uitvDefault() zoals hij was */
function brDiensten(b=BR()){const I_=(naam,eenheid,prijs,min)=>itm(naam,eenheid,prijs,min*60);
  const D={
    schoorsteenveger:[["veeg","Schoorsteen vegen",[I_("Rookkanaal open haard","per stuk",65,40),I_("Rookkanaal houtkachel of inzethaard","per stuk",65,40),I_("Extra rookkanaal op hetzelfde adres","per stuk",35,20)]],
      ["cv","Cv- en gasafvoer",[I_("Rookgasafvoer cv-ketel","per stuk",55,30),I_("Gaskachel of geiser","per stuk",55,30)]],
      ["insp","Inspectie",[I_("Visuele inspectie","per keer",45,20),I_("Camera-inspectie met rapport","per keer",95,45),I_("Rookproef","per keer",65,30)]],
      ["kap","Kap en vonkenvanger",[I_("Schoorsteenkap plaatsen","per stuk",145,45),I_("Vonkenvanger plaatsen","per stuk",95,30)]],
      ["nest","Nest verwijderen",[I_("Vogelnest verwijderen","per stuk",75,40)]],
      ["voorrij","Voorrijkosten",[I_("Voorrijden","per keer",25,0)]]],
    schilder:[["buiten","Buitenschilderwerk",[I_("Kozijnen","per strekkende meter",24,15),I_("Ramen en deuren","per stuk",95,90),I_("Boeidelen en windveren","per strekkende meter",22,15),I_("Gevel of muurwerk","per m²",18,10),I_("Dakkapel","per stuk",450,360)]],
      ["binnen","Binnenschilderwerk",[I_("Muren","per m²",12,8),I_("Plafonds","per m²",14,10),I_("Deuren","per stuk",85,75),I_("Kozijnen binnen","per stuk",65,45),I_("Trap","per stuk",450,480)]],
      ["hout","Houtrotherstel",[I_("Houtrot repareren, per plek","per stuk",65,45),I_("Arbeid","per uur",55,60)]],
      ["kit","Kit- en glaswerk",[I_("Kitwerk","per strekkende meter",9,6),I_("Glas vervangen","per m²",180,60)]],
      ["onderh","Onderhoudsinspectie",[I_("Jaarlijkse inspectie met advies","per keer",75,45)]],
      ["toeslag","Toeslagen",[I_("Steiger of hoogwerker, per dag","per keer",185,0),I_("Voorrijkosten","per keer",25,0)]]],
    hovenier:[["tuin","Tuinonderhoud",[I_("Onderhoud","per uur",45,60),I_("Onkruid wieden","per m²",1.5,2)]],
      ["heg","Heg snoeien",[I_("Heg tot 2 meter","per strekkende meter",4.5,2),I_("Heg boven 2 meter","per strekkende meter",7.5,4)]],
      ["gazon","Gazon",[I_("Maaien en kanten steken","per m²",0.25,1),I_("Verticuteren","per m²",0.6,1),I_("Bemesten","per m²",0.2,1)]],
      ["boom","Bomen en struiken",[I_("Boom snoeien","per stuk",85,60),I_("Struiken snoeien","per uur",45,60)]],
      ["blad","Blad ruimen",[I_("Blad ruimen","per uur",45,60)]],
      ["bestr","Bestrating reinigen",[I_("Bestrating reinigen","per m²",3.5,3),I_("Voegen invegen","per m²",2.5,2)]],
      ["afval","Groenafval afvoeren",[I_("Afvoeren","per keer",45,15)]]],
    timmerman:[["timmer","Timmerwerk",[I_("Arbeid","per uur",52,60)]],
      ["kozijn","Kozijnen en deuren",[I_("Deur afhangen","per stuk",95,90),I_("Binnendeur plaatsen","per stuk",185,150),I_("Kozijn vervangen","per stuk",650,240),I_("Hang- en sluitwerk","per stuk",45,30)]],
      ["dak","Dak en gevel",[I_("Boeiboorden vervangen","per strekkende meter",65,45),I_("Dakkapel herstellen","per uur",52,60)]],
      ["vloer","Vloeren en trappen",[I_("Vloer leggen","per m²",28,20),I_("Plinten","per strekkende meter",9,6)]],
      ["tuinhout","Schutting en overkapping",[I_("Schutting plaatsen","per strekkende meter",85,60),I_("Overkapping","per uur",52,60)]],
      ["hout","Houtrotherstel",[I_("Houtrot repareren, per plek","per stuk",65,45)]],
      ["onderh","Onderhoudsinspectie",[I_("Jaarlijkse inspectie","per keer",75,45)]],
      ["voorrij","Voorrijkosten",[I_("Voorrijden","per keer",35,0)]]],
    betonboorder:[["boren","Kernboren",[I_("Boring tot Ø 100 mm","per stuk",85,30),I_("Boring Ø 100 tot 200 mm","per stuk",145,45),I_("Boring Ø 200 tot 300 mm","per stuk",225,60),I_("Extra boordiepte, per 10 cm","per stuk",15,5)]],
      ["zagen","Betonzagen",[I_("Wandzagen","per strekkende meter",95,30),I_("Vloerzagen","per strekkende meter",65,20),I_("Sparing zagen","per stuk",195,90)]],
      ["sloop","Sloopwerk",[I_("Breekwerk","per uur",65,60)]],
      ["afval","Puin afvoeren",[I_("Afvoeren","per keer",75,20)]],
      ["toeslag","Toeslagen",[I_("Stofvrij werken met afzuiging","per keer",45,0),I_("Werken boven 3 meter","per keer",65,0),I_("Voorrijkosten","per keer",45,0)]]]}[b]||[];
  const G=D.map(([id,naam,items])=>({id,std:true,naam,items}));
  G.forEach(g=>g.items.forEach((it,i)=>{it.id=g.id+"_"+i}));return G}
/* wisselen in de demo (?branche=...) */
function brUitUrl(){try{const b=new URLSearchParams(location.search).get("branche");return brGeldig(b)?b:""}catch(e){return""}}
const BR_DIENSTNAMEN=()=>{try{return brDiensten().map(g=>g.naam)}catch(e){return[]}};
/* standaardsjablonen voor een ander vak: dezelfde opbouw, zonder ramen en glasbewassing (eigen aanpassingen van het bedrijf gaan altijd voor) */
function brTpl(t){if(GLAS()||!t)return t;const f=x=>typeof x!=="string"?x:x
  .replace(/• Ramen en ventilatieroosters gesloten houden\n• Horren verwijderen en rolluiken openen\n• Poorten en hekwerk toegankelijk maken\n• Voldoende ruimte rondom de ramen vrijhouden\n• Een eventuele robotmaaier tijdelijk uitschakelen/,"• Poorten en hekwerk toegankelijk maken\n• Voldoende ruimte rondom de werkplek vrijhouden\n• Huisdieren even binnen houden")
  .replace(/komen we uw ramen wassen/g,"komen we bij u langs").replace(/komen we de ramen wassen bij/g,"komen we langs bij")
  .replace(/Wij wassen uw ramen elke/g,"Wij komen elke").replace(/bedankt dat we je ramen weer mochten wassen/g,"bedankt dat we weer voor je aan de slag mochten")
  .replace(/Glasbewassing/g,"Afspraak").replace(/glasbewassing/g,"afspraak");
  const o={};Object.keys(t).forEach(k=>o[k]=f(t[k]));return o}
