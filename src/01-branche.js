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
    schoorsteenveger:[["veeg","Schoorsteen vegen",[I_("Rookkanaal vegen","per stuk",65,40),I_("Extra rookkanaal","per stuk",35,20)]],
      ["cv","Cv-afvoer vegen",[I_("Rookgasafvoer cv-ketel","per stuk",55,30)]],
      ["insp","Inspectie",[I_("Camera-inspectie met rapport","per keer",85,30)]],
      ["kap","Kap en vonkenvanger",[I_("Schoorsteenkap plaatsen","per stuk",145,45)]]],
    schilder:[["buiten","Buitenschilderwerk",[I_("Kozijnen en deuren","per m²",38,30),I_("Boeidelen en windveren","per strekkende meter",22,15)]],
      ["binnen","Binnenschilderwerk",[I_("Muren en plafonds","per m²",14,10)]],
      ["onderh","Onderhoudsinspectie",[I_("Jaarlijkse inspectie","per keer",75,45)]],
      ["hout","Houtrotherstel",[I_("Herstel","per uur",55,60)]]],
    hovenier:[["tuin","Tuinonderhoud",[I_("Onderhoud","per uur",45,60)]],
      ["heg","Heg snoeien",[I_("Heg snoeien","per strekkende meter",4.5,2)]],
      ["gazon","Gazon",[I_("Maaien en kanten steken","per m²",0.25,1)]],
      ["blad","Blad ruimen",[I_("Blad ruimen","per uur",45,60)]]],
    timmerman:[["timmer","Timmerwerk",[I_("Arbeid","per uur",52,60)]],
      ["kozijn","Kozijnen en deuren",[I_("Deur afhangen","per stuk",95,90),I_("Kozijn vervangen","per stuk",650,240)]],
      ["hout","Houtrotherstel",[I_("Herstel","per uur",52,60)]],
      ["onderh","Onderhoudsinspectie",[I_("Jaarlijkse inspectie","per keer",75,45)]]],
    betonboorder:[["boren","Kernboren",[I_("Boring tot Ø 100 mm","per stuk",85,30),I_("Boring Ø 100 tot 200 mm","per stuk",145,45)]],
      ["zagen","Betonzagen",[I_("Wandzagen","per strekkende meter",95,30),I_("Vloerzagen","per strekkende meter",65,20)]],
      ["sparing","Sparingen",[I_("Sparing maken","per stuk",195,90)]],
      ["voorrij","Voorrijkosten",[I_("Voorrijden","per keer",45,0)]]]}[b]||[];
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
