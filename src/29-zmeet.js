/* ---------- Meetlint in het CRM: instellingen en soorten (diensten per strekkende meter of per m²) ---------- */
I.ruler=I.ruler||'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg>';
const meetSoorten=()=>{try{return typeof Meetlint!=="undefined"?Meetlint.soortenUit(uDienstLijst().filter(d=>!d.glas&&d.groep!=="bijz")):[]}catch(e){return[]}};
const meetAan=w=>{const s=S();if(w==="webshop")return s.meetWebshop===true;if(w==="telling")return s.meetTelling!==false;return s.meetRekentool!==false};
SETCARDS.push({id:"meetlint",t:"Meetlint",sub:"Goten, windveren en beplating opmeten op een foto",ic:"ruler",bg:"#c9a227",
  st:s=>[meetAan("rekentool"),meetAan("telling"),meetAan("webshop")].some(Boolean)?["ok","Aan"]:["soon","Staat uit"],
  rows:s=>[["Rekentool",meetAan("rekentool")?"Aan":"Uit"],["Tellingcontrole",meetAan("telling")?"Aan":"Uit"],["Dienstenwebshop",meetAan("webshop")?"Aan":"Uit"]]});
SETEXTRA.meetlint=(c,s)=>{const L=meetSoorten();
  setDlg(c,`${info("Met de meetlint meet je op een foto hoeveel meter goot, daklijst of windveer er is, of hoeveel m² beplating. Eerst sleep je een <b>referentie</b> over iets waarvan je de maat kent (bijvoorbeeld 4 bakstenen), daarna rekent Mansard elke lijn om. De meters gaan met je eigen tarief mee in de prijs.")}
    ${tgl("meetRekentool","Rekentool","Meten bij het tellen van de ramen in de rekentool en offertes",meetAan("rekentool"))}
    ${tgl("meetTelling","Tellingcontrole","Meten op de foto's bij de O-beurt",meetAan("telling"))}
    ${tgl("meetWebshop","Dienstenwebshop","Klanten meten zelf op hun foto's op je website",meetAan("webshop"))}
    <small class="help">${L.length?"Te meten: "+L.map(x=>esc(x.kort)+" ("+(x.eenheid==="m2"?"m²":"m")+")").join(", ")+". Dit volgt uit Uitvoering › Diensten: alles met de eenheid per strekkende meter of per m².":"Nog geen diensten per strekkende meter of per m². Zet de eenheid bij Uitvoering › Diensten."}</small>`,{wide:false});
  bindSave()};
