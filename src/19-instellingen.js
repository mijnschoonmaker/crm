/* ---------- INSTELLINGEN ---------- */
Object.assign(DEF,{skipRedenen:["Klant niet thuis","Slecht weer","Ziekte/personeelsuitval","Klant uitgesteld","Defecte apparatuur","Overig"],annuleerRedenen:["Klant geannuleerd","Verhuisd","Te duur","Geen toegang","Overig"],afmeldStatus:"concept",betaalmethoden:["contant","pin","bank"],werkStart:"08:00",werkEind:"17:00",kalVan:"07:00",kalTot:"22:00",slotStd:10,lookahead:1,maxJobs:10,overlap:true,compact:false,ultra:false});
const LANDEN={NL:{n:"Nederland",f:"🇳🇱",btw:[21,9,0]},BE:{n:"België",f:"🇧🇪",btw:[21,12,6,0]}};
const tgl=(k,label,sub,on)=>`<label class="tgl"><span><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:""}</span><input type="checkbox" data-k="${k}" data-t="bool" ${on?"checked":""} role="switch"><i></i></label>`;
const inp=(k,label,v,{type="text",ph="",cls="",help="",t="str",attrs=""}={})=>`<label class="${cls}">${esc(label)}<input type="${type}" data-k="${k}" data-t="${t}" value="${esc(v??"")}" placeholder="${esc(ph)}" ${attrs}>${help?`<small class="help">${help}</small>`:""}</label>`;
const sel=(k,label,v,opts,{cls="",help="",t="str"}={})=>`<label class="${cls}">${esc(label)}<select data-k="${k}" data-t="${t}">${opts.map(([a,b])=>`<option value="${esc(a)}" ${String(v)===String(a)?"selected":""}>${esc(b)}</option>`).join("")}</select>${help?`<small class="help">${help}</small>`:""}</label>`;
const ta=(k,label,v,{rows=5,help="",cls="full",count=false}={})=>`<label class="${cls}">${esc(label)}<textarea data-k="${k}" data-t="str" style="min-height:${rows*22}px"${count?' data-count="1"':""}>${esc(v??"")}</textarea>${count?`<small class="help cnt"></small>`:""}${help?`<small class="help">${help}</small>`:""}</label>`;
const sec=t=>`<div class="secl">${esc(t)}</div>`;
const info=(t,cls="")=>`<div class="infobox ${cls}">${I.handleiding}<span>${t}</span></div>`;
function setDlg(c,body,{wide=true,foot}={}){
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:${c.bg}">${I[c.ic]}</span><div style="flex:1;min-width:0"><h3>${esc(c.t)}</h3><div class="subt">${esc(c.sub||"")}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="setbody">${body}</div>
  <div class="row stickyfoot">${foot??`<button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="submit" class="primary" id="setSave">Opslaan</button>`}</div>`,{wide});
  form.querySelectorAll("[data-count]").forEach(t=>{const u=()=>{const n=t.value.length;t.parentElement.querySelector(".cnt").textContent="SMS: "+n+" tekens"+(n>160?" · "+Math.ceil(n/153)+" berichten":"")};t.addEventListener("input",u);u()});
}
function readFields(root=form){const o={};root.querySelectorAll("[data-k]").forEach(el=>{const k=el.dataset.k,t=el.dataset.t;if(!k||k.includes("."))return;o[k]=t==="bool"?el.checked:t==="num"?Number(el.value)||0:el.value.trim()});return o}
async function saveSettings(patch,msg="Instellingen opgeslagen"){const data={...state.settings,...patch};if(data.postcode)data.postcode=String(data.postcode).toUpperCase();
  try{await save("instellingen","bedrijf",data);state.settings=data;toast(msg);return true}catch(e){err(e);return false}}
function bindSave(extra){form.onsubmit=async e=>{e.preventDefault();const b=$("#setSave");if(b)b.disabled=true;const p={...readFields(),...(extra?extra():{})};if(await saveSettings(p)){dlg.close();schedule()}else if(b)b.disabled=false}}
const testRow=(id,ph,help)=>`${sec("Testbericht")}<div class="testrow"><input id="${id}" placeholder="${esc(ph)}"><button type="button" class="small" data-test="${id}">${I.send}Test</button></div><small class="help">${esc(help)}</small>`;
function bindTest(id,textFn,subjFn){const b=form.querySelector(`[data-test="${id}"]`);if(!b)return;b.onclick=()=>{const v=$("#"+id).value.trim();if(!v){$("#"+id).focus();return}
  const k={id:"",naam:"Test",email:v.includes("@")?v:"",telefoon:v.includes("@")?"":v};const ex={...klantVars({naam:"Fam. Voorbeeld",adres:"Dorpsstraat 1",plaats:"Voorbeeld",tijd:"09:00",duur:30,dienst:"Glasbewassing",prijs:35,frequentie:4},addDays(today(),1)),factuurnummer:today().getFullYear()+"-0001",bedrag:"€ 35,00",vervaldatum:fmtL(addDays(today(),-5)),factuurdatum:fmtL(addDays(today(),-19)),dagen_te_laat:5};
  const kan=v.includes("@")?"email":"sms",txt=fill(textFn(kan),ex),h=sendHref(kan,k,txt,fill(subjFn?subjFn():"Test",ex));if(h){const a=document.createElement("a");a.href=h;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();toast("Test geopend in je "+(kan==="email"?"mailprogramma":"berichten-app"))}}}

const SETCARDS=[
  {id:"bedrijf",t:"Bedrijf & Branding",sub:"Bedrijfsgegevens, logo, kleuren en Peppol-gegevens",ic:"building",bg:"#0f1f26",st:s=>s.naam&&s.iban?["ok","Geconfigureerd"]:["soon","Onvolledig"],rows:s=>[["Naam",s.naam],["Email",s.email],["BTW",s.btwnr],["IBAN",s.iban]],extra:`<button type="button" class="tiny ghost" data-act="voorbeeld" style="align-self:center">Voorbeeldfactuur bekijken ${I.right}</button>`},
  {id:"land",t:"Land, valuta & BTW",sub:"Valuta, getalnotatie en btw volgen je land",ic:"globe",bg:"#2a9bb0",st:s=>["ok",s.land],rows:s=>[["Land",LANDEN[s.land]?.n||"Nederland"],["Valuta","€ EUR"],["BTW",s.btw+"% standaard"]]},
  {id:"email",t:"E-mail afzender",sub:"Zo komen je mails bij de klant aan",ic:"mail",bg:"#5b5bd6",st:s=>s.email?["ok","Actief"]:["soon","Geen e-mail"],rows:s=>[["Klant ziet",s.naam||"—"],["Antwoorden naar",s.email||"—"],["Verzending","Je eigen mailprogramma"]],v:"Bekijken"},
  {id:"tracking",t:"Mail-tracking",sub:"Zien wanneer klanten je mail openen of klikken",ic:"eye",bg:"#2f7f88",st:s=>s.trackUrl&&s.trackKey?(s.trackAan===false?["soon","Staat uit"]:["ok","Actief"]):["soon","Niet ingesteld"],rows:s=>[["Server",s.trackUrl?String(s.trackUrl).replace(/^https?:\/\//,""):"—"],["Meet","Geopend · Geklikt in de mail"]],warn:s=>s.trackUrl?"":"Met een kleine gratis server zie je per mail wanneer de klant hem opende en of er op een link is geklikt."},
  {id:"sms",t:"SMS afzendernaam",sub:"Wat je klant onder je berichten ziet",ic:"communicatie",bg:"#e09a2c",st:s=>s.smsNaam?["ok","Eigen naam"]:["soon","Niet ingesteld"],rows:s=>[["Klant ziet",s.smsNaam||s.naam||"—"],["Ingesteld",s.smsNaam||"—"],["Verzending","Via je eigen telefoon"]]},
  {id:"dag",t:"Dagherinnering",sub:"Melden dat je morgen komt",ic:"bell",bg:"#2a8bd1",st:s=>s.dagAan?["ok","Aan"]:["soon","Uit"],rows:s=>[["Status",s.dagAan?"Staat aan":"Staat uit"],["Wanneer",(s.dagDagen||1)+" dag vooraf "+s.dagTijd],["Kanaal",KANAAL[s.dagKanaal]||"WhatsApp"]]},
  {id:"fh",t:"Factuurherinnering",sub:"Herinneren na de vervaldatum",ic:"clock",bg:"#e0822c",st:s=>s.fhAan?["ok","Aan"]:["soon","Uit"],rows:s=>[["Status",s.fhAan?"Staat aan":"Staat uit"],["Momenten",fhMomenten().filter(m=>m.aan).map(m=>m.dagen+" dgn").join(" · ")],["Tijdstip",s.fhTijd+(s.fhWerkdagen?" · werkdagen":"")]]},
  {id:"betaal",t:"Betalingen",sub:"Hoe klanten je betalen",ic:"card",bg:"#23845a",st:s=>s.betaallink?["ok","Betaallink"]:["soon","Niet ingesteld"],rows:s=>[["Standaard",{overmaken:"Overmaken",contant:"Contant",pin:"Pin",tikkie:"Betaalverzoek"}[s.betaalwijze]||"Overmaken"],["Betaallink",s.betaallink?"Ingesteld":"—"],["Mollie","Niet in Mansard"]],warn:s=>s.betaallink?"":"Zonder betaallink maken klanten het bedrag over op je IBAN. Een vaste betaallink (bijv. van je bank of Tikkie) komt automatisch in je facturen en herinneringen."},
  {id:"bijschr",t:"Bijschrijvingen",sub:"Bankafschrift inlezen en facturen afboeken",ic:"bank",bg:"#1f8a7a",st:()=>["ok","Handmatig"],rows:()=>[["Rekening uitlezen","Via CSV-export"],["Banken","ING, Rabo, ABN, bunq…"]],warn:()=>"Download in je bankapp de afschriften als CSV. Mansard herkent factuurnummers en bedragen en boekt die facturen af als betaald.",v:"Afschrift inlezen"},
  {id:"peppol",t:"Peppol e-facturatie",sub:"Gegevens voor e-facturen",ic:"send",bg:"#3a9fd6",st:s=>{const m=[!s.peppolId&&"peppol_id",!s.kvk&&"kvk_number"].filter(Boolean);return m.length?["soon","Mist "+m.length+" veld(en)"]:["ok","Compleet"]},rows:s=>[["Peppol ID",s.peppolId||"—"],["KvK",s.kvk||"—"],["BTW",s.btwnr||"—"],["Ontbreekt",[!s.peppolId&&"peppol_id",!s.kvk&&"kvk_number"].filter(Boolean).join(", ")||"niets"]]},
  {id:"data",t:"Data Beheer",sub:"Importeren, exporteren en voorbeelden",ic:"inbox",bg:"#4b3fd0",st:()=>["ok","Beschikbaar"],rows:()=>[["Importeren","CSV / Excel"],["Exporteren","Klanten · Jobs · Facturen · Bonnen"],["Templates","Lege voorbeelden"]]},
  {id:"afmelden",t:"Job afmelden",sub:"Redenen en standaard betaalmethode",ic:"checksq",bg:"#23845a",st:()=>["ok","Aanpasbaar"],rows:s=>[["Skip-redenen",plural((s.skipRedenen||[]).length,"reden","redenen")],["Annuleren-redenen",plural((s.annuleerRedenen||[]).length,"reden","redenen")],["Standaard betaalmethode",{overmaken:"Overmaken",contant:"Contant",pin:"Pin",tikkie:"Betaalverzoek"}[s.betaalwijze]||"Overmaken"]]},
  {id:"welkom",t:"Welkomstmail & overeenkomst",sub:"Welkom heten met je voorwaarden",ic:"mail",bg:"#1d5a74",st:s=>s.welkomAan?["ok","Klaar om te sturen"]:["soon","Uit"],rows:s=>[["Voorwaarden",s.voorwaarden||"—"],["Opzegtermijn",s.opzegtermijn||"—"],["Incasso vragen",s.incassoVragen?"Ja":"Nee"]]},
  {id:"doorplannen",t:"Doorplannen & werkdagen",sub:"Werkdagen, vrije dagen en feestdagen",ic:"cal2",bg:"#23845a",st:()=>["ok","Alles in één ritme"],rows:s=>[["Werkdagen",dagenTxt(s.werkdagen)],["Vrije dag",(s.vrijeDag==="na"?"Werkdag erna":"Werkdag ervóór")+(s.feestdagen?" · feestdagen overslaan":"")],["Volgende feestdag",volgendeFeestdag()]]},
  {id:"review",t:"Reviewverzoek na factuur",sub:"Tevreden klanten om een review vragen",ic:"spark",bg:"#e3a92c",st:s=>s.reviewAan?["ok","Aan"]:["soon","Staat uit"],rows:s=>[["Automatisch klaarzetten",s.reviewAan?"Aan":"Uit"],["Max per adres",(s.reviewMax||2)+"× · "+(s.reviewDagen||180)+" dagen"],["Verstuurd",state.berichten.filter(m=>m.sjabloon==="review").length+" totaal"]]},
  {id:"website",t:"Dienstenwebshop",sub:"Prijscalculator (dienstenwebshop) voor je eigen website",ic:"globe",bg:"#0b0b0b",st:s=>s.webUrl?["ok","Op je website"]:["soon","Nog niet geplaatst"],rows:s=>[["Logo",s.logo?"Uit Bedrijf & Branding":"Geen logo (naam)"],["Tarieven","Zelfde als de Calculator"],["Aanvragen naar",s.email||"—"]],v:"Openen"},
];
const dienstLijstOud=()=>S().diensten&&S().diensten.length?S().diensten:[{naam:"Glasbewassing",prijs:25,duur:30}];
/* diensten komen live uit Uitvoering › Diensten (ook als je daar nog niets hebt opgeslagen: dan de standaarddiensten) */
const dienstLijst=()=>{try{return uDienstLijst()}catch(e){return dienstLijstOud()}};
const QUICK=[["bijschr","Bijschrijvingen","bank"],["diensten","Diensten","wrench"],["meldingen","Meldingen","bell"],["gebruikers","Gebruikers","klanten"],["planning","Planning","planning"],["bulkprijs","Bulk prijzen","trend"],["bulkduur","Bulk duur","clock"],["wachtwoord","Wachtwoord","shield"],["pwa","PWA & App","phone"],["webview","Dienstenwebshop","globe"],["abonnement","Abonnement","card"]];
const dagenTxt=w=>{w=w||[1,2,3,4,5];const n=["zo","ma","di","wo","do","vr","za"];if(w.length===5&&[1,2,3,4,5].every(x=>w.includes(x)))return"Ma t/m Vr (standaard)";return[1,2,3,4,5,6,0].filter(x=>w.includes(x)).map(x=>n[x]).join(", ")||"geen"};
function volgendeFeestdag(){const t=today(),s=S();const all={...feestdagen(t.getFullYear(),s.land),...feestdagen(t.getFullYear()+1,s.land)};const k=Object.keys(all).sort().find(d=>parse(d)>=t);return k?all[k]+" "+fmtD(k):"—"}
function vInstellingen(){
  const s=S();
  return `<div class="pagehead"><div><p class="kicker">${I.instellingen}Configuratie</p><h1 class="xl">Instellingen</h1><p class="lead" style="margin:0">Beheer je bedrijfsprofiel, integraties en automatisering</p></div></div>
  <div class="setgrid">${SETCARDS.map(c=>{const[cl,lb]=c.st(s),w=c.warn&&c.warn(s);return `<div class="setcard sc2 sc2-${cl}"><div class="sc2-kop jp-kop"><div class="jp-kr1"><span class="jp-st"><i></i>${esc(lb)}</span><span class="sp"></span></div><div class="sc2-t"><span class="ic">${I[c.ic]}</span><div><h3>${esc(c.t)}</h3>${c.sub?`<small>${esc(c.sub)}</small>`:""}</div></div></div>
    <div class="sc2-body"><dl>${c.rows(s).map(([a,b])=>`<dt>${esc(a)}</dt><dd title="${esc(b??"")}">${esc(b??"—")||"—"}</dd>`).join("")}</dl>
    ${w?`<div class="warnbox">${I.alert}<span>${esc(w)}</span></div>`:""}
    <button type="button" class="setbtn" data-act="setedit" data-v="${c.id}">${c.v?I.search:I.note} ${c.v||"Bewerken"}<span style="flex:1"></span>${I.right}</button>${c.extra||""}</div></div>`}).join("")}</div>
  <div class="panel quickp"><div class="qhead"><span class="eyebrow">Sneltoegang</span><span style="flex:1"></span><span class="eyebrow" style="display:flex;align-items:center;gap:6px">${I.euro}Bedragen</span>
    <div class="seg"><button type="button" data-act="toonex" data-v="1" aria-pressed="${!!s.toonEx}">Ex BTW</button><button type="button" data-act="toonex" data-v="0" aria-pressed="${!s.toonEx}">Incl BTW</button></div></div>
    <div class="quick">${QUICK.map(([id,l,ic])=>`<button type="button" data-act="setedit" data-v="${id}"><span>${I[ic]}</span>${esc(l)}</button>`).join("")}</div></div>
  <div class="okbox">${I.shield}<div><b>Alles op één plek</b><span>Je instellingen worden opgeslagen bij je gegevens en gelden voor iedereen met wie je Mansard deelt. Dingen die een externe dienst nodig hebben (online betalen, sms via een provider, Peppol) staan eerlijk gemarkeerd.</span></div></div>`;
}
function openSetEdit(id){
  if(id==="diensten"){state.utab="diensten";go("uitvoering");return}
  const s=S(),c=SETCARDS.find(x=>x.id===id)||{};
  const D={
  bedrijf(){let logo=s.logo,logoMail=s.logoMail;
    const lgImg=v=>v?`<img src="${BLOB}${esc(v)}" alt="Logo">`:`<span class="subt">Geen logo</span>`;
    setDlg(c,`<div class="box">${sec("Logo & kleuren")}<div class="logorow"><div class="logobox" id="lg1">${lgImg(logo)}</div><div><p class="subt" style="margin:0 0 8px">PNG of JPG, max 2 MB. Verschijnt op facturen, offertes en PDF's.</p>
      ${state.assets?`<label class="btn small">${I.upload}${logo?"Vervang":"Uploaden"}<input type="file" accept="image/png,image/jpeg" hidden id="lgf1"></label> <button type="button" class="small ghost" id="lgx1">${I.x}Verwijder</button>`:'<p class="subt">Uploaden kan alleen de eigenaar van deze pagina.</p>'}</div></div>
      <div class="grid2" style="margin-top:12px"><label>Hoofdkleur<span class="colorrow"><input type="color" id="hk" value="${esc(s.hoofdkleur)}"><input data-k="hoofdkleur" id="hkt" value="${esc(s.hoofdkleur)}"></span><small class="help">Bv. #0ea5e9</small></label><label>Accent kleur<span class="colorrow"><input type="color" id="ak" value="${esc(s.accentkleur)}"><input data-k="accentkleur" id="akt" value="${esc(s.accentkleur)}"></span><small class="help">Bv. #6366f1</small></label></div>
      <div class="splitrow"><span class="subt">Klik om te zien hoe je logo en kleuren in een factuur-e-mail verschijnen.</span><button type="button" class="small" id="pvMail">${I.search}Preview e-mail</button></div></div>
      <div class="box">${sec("Logo in e-mails")}<div class="logorow"><div class="logobox" id="lg2">${lgImg(logoMail||logo)}</div><div><p class="subt" style="margin:0 0 8px">Standaard je bedrijfslogo. Wil je in e-mails een ander (bijvoorbeeld liggend) logo? Upload het hier.</p>
      ${state.assets?`<label class="btn small">${I.upload}Vervang<input type="file" accept="image/png,image/jpeg" hidden id="lgf2"></label> <button type="button" class="small ghost" id="lgx2">${I.x}Gebruik bedrijfslogo</button>`:""}</div></div>
      <div class="grid2" style="margin-top:12px">${sel("logoGrootte","Grootte",s.logoGrootte,[[48,"Klein (48 px)"],[60,"Middel (60 px)"],[72,"Groot (72 px)"],[96,"Extra groot (96 px)"]],{t:"num"})}${sel("logoUitlijning","Uitlijning",s.logoUitlijning,[["links","Links"],["midden","Midden"],["rechts","Rechts"]])}</div></div>
      <div class="box">${sec("Bedrijfsgegevens")}<div class="grid2">${inp("naam","Bedrijfsnaam",s.naam,{cls:"full"})}${inp("adres","Adres",s.adres,{cls:"full"})}${inp("postcode","Postcode",s.postcode)}${inp("plaats","Plaats",s.plaats)}${inp("telefoon","Telefoon",s.telefoon,{type:"tel"})}${inp("email","E-mail",s.email,{type:"email"})}${inp("kvk","KvK-nummer",s.kvk)}${inp("btwnr","Btw-nummer",s.btwnr,{ph:"NL001234567B01"})}${inp("iban","IBAN",s.iban,{ph:"NL00 BANK 0123 4567 89"})}${inp("bic","BIC",s.bic,{ph:"KNABNL2H"})}${inp("peppolId","Peppol ID",s.peppolId,{cls:"full",ph:"0106:12345678",help:"KvK-schema 0106 gevolgd door je KvK-nummer"})}</div></div>`);
    const sync=(a,b)=>{$(a).oninput=e=>$(b).value=e.target.value;$(b).oninput=e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))$(a).value=e.target.value}};sync("#hk","#hkt");sync("#ak","#akt");
    const up=(fid,boxid,set)=>{const f=$(fid);if(f)f.onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>2*1024*1024){toast("Het logo is groter dan 2 MB");return}try{const r=await state.assets.upload(file);set(r.id);$(boxid).innerHTML=`<img src="${esc(r.url)}" alt="Logo">`}catch(er){toast("Uploaden lukte niet ("+(er.code||"fout")+")")}}};
    up("#lgf1","#lg1",v=>logo=v);up("#lgf2","#lg2",v=>logoMail=v);
    const x1=$("#lgx1");if(x1)x1.onclick=()=>{logo="";$("#lg1").innerHTML=lgImg("")};const x2=$("#lgx2");if(x2)x2.onclick=()=>{logoMail="";$("#lg2").innerHTML=lgImg(logo)};
    $("#pvMail").onclick=()=>openMailPreview({...s,...readFields(),logo,logoMail});
    bindSave(()=>({logo,logoMail}));},
  land(){const L=LANDEN[s.land]||LANDEN.NL;
    setDlg(c,`${sel("land","Land",s.land,Object.entries(LANDEN).map(([k,v])=>[k,v.f+"  "+v.n]),{help:"Bepaalt btw-tarieven en feestdagen"})}
      <div class="grid2"><div class="minibox"><span class="eyebrow">${I.euro} Valuta</span><b>€ EUR</b><small>Voorbeeld: € 1.234,50</small></div><div class="minibox"><span class="eyebrow">${I.receipt} BTW</span><b>${L.btw.join("% · ")}%</b><small>Standaard: ${s.btw}%</small></div></div>
      ${sel("btw","Standaard btw-tarief",s.btw,L.btw.map(v=>[v,v+"%"+(v===21?" (hoog)":v===9||v===6?" (laag)":v===0?" (nul)":"")]),{t:"num",help:"Wordt voorgesteld bij nieuwe facturen en offertes"})}
      ${tgl("incl","Prijzen zijn incl. btw","De prijs per beurt bij klanten is inclusief btw",s.incl)}
      ${inp("termijn","Betaaltermijn (dagen)",s.termijn,{type:"number",t:"num"})}
      ${sel("factNrStijl","Factuurnummers",s.factNrStijl||"jaar",[["jaar","Per jaar: "+nextNr("factuur",iso(today())).replace(/\d+$/,m=>m.replace(/./g,"0").replace(/0$/,"1"))+" …"],["doorlopend","Doorlopend zoals DienstenCRM: 26-009295"]],{help:"Doorlopend: jaar in 2 cijfers en een volgnummer van 6 cijfers dat over de jaren doorloopt. Zo krijgt je boekhouder één reeks."})}
      ${inp("factNrStart","Eerste volgnummer (bij overstap)",s.factNrStart,{type:"number",t:"num",ph:"9295",help:"Laatste factuurnummer uit het oude pakket + 1, bijv. 26-009294 → 9295. Volgende factuur: "+esc(nextNr("factuur",iso(today())))})}
      ${inp("onderdeelVan","Onderdeel van (moederbedrijf)",s.onderdeelVan,{ph:"Mansard",help:"Komt onder elke factuur als: \""+esc(s.naam||"Je bedrijf")+" is een onderdeel van …\". Leeg laten als dat niet van toepassing is."})}
      ${sel("taal","Taal van de app",s.taal,[["nl","Nederlands"]],{help:"Mansard is alleen in het Nederlands beschikbaar."})}`,{wide:false});bindSave();},
  email(){setDlg(c,`${info("Mansard verstuurt zelf geen mail: elke e-mail opent in <b>je eigen mailprogramma</b>, met de tekst al ingevuld. Je klant ziet dus jouw naam en adres als afzender en antwoorden komen gewoon bij jou binnen.")}
      <label>Wat je klant ziet als afzender<input value="${esc(s.naam||"—")}" readonly><small class="help">Je bedrijfsnaam, aanpassen bij Bedrijf &amp; Branding</small></label>
      <label>Antwoorden komen binnen op<input value="${esc(s.email||"—")}" readonly><small class="help">Je e-mailadres, aanpassen bij Bedrijf &amp; Branding</small></label>
      <label>Verzendadres<input value="${esc(s.email||"Het adres van je mailprogramma")}" readonly><small class="help">Het account waarmee je mailprogramma verstuurt</small></label>
      ${testRow("tmail","jouw@email.nl","Opent een testmail in je mailprogramma, zo zie je precies wat je klant krijgt.")}`,{wide:false,foot:`<span class="sp"></span><button type="button" class="primary" data-act="close">Sluiten</button>`});
    bindTest("tmail",()=>s.dagMail,()=>s.dagOnderwerp);},
  tracking(){const key=s.trackKey||[...crypto.getRandomValues(new Uint8Array(18))].map(x=>"abcdefghjkmnpqrstuvwxyz23456789"[x%31]).join("");
    setDlg(c,`${info("Elke opgemaakte mail krijgt een onzichtbaar pixeltje en gevolgde links. Opent de klant de mail of klikt hij op een link (bijv. de betaallink), dan zie je dat bij <b>Communicatie</b> en op de klantkaart, met datum en tijd.")}
      ${tgl("trackAan","Mail-tracking aan","Alleen voor opgemaakte e-mails, niet voor sms of WhatsApp",s.trackAan!==false)}
      ${inp("trackUrl","Adres van je tracking-server",s.trackUrl,{cls:"full",ph:"https://zeem-track.jouwnaam.workers.dev"})}
      ${inp("trackKey","Geheime sleutel",key,{cls:"full",help:"Zet precies deze sleutel als secret KEY in je server. Deel hem met niemand."})}
      <div class="splitrow" style="gap:10px"><button type="button" class="small" id="trkTest">${I.check}Test verbinding</button><span class="subt" id="trkRes"></span></div>
      ${sec("Server instellen · eenmalig, gratis (± 10 min)")}
      <ol class="trk-steps"><li>Maak een gratis account op <b>dash.cloudflare.com</b>.</li>
        <li>Ga naar <b>Storage &amp; Databases › KV</b> en maak een namespace met de naam <code>zeem-track</code>.</li>
        <li>Ga naar <b>Workers &amp; Pages › Create › Worker</b>, noem hem <code>zeem-track</code> en klik <b>Deploy</b>.</li>
        <li>Klik <b>Edit code</b>, vervang alles door de servercode (knop hieronder) en klik <b>Deploy</b>.</li>
        <li>Bij <b>Settings › Bindings</b>: voeg een <b>KV namespace</b> toe met variabelenaam <code>TRACK</code> en kies <code>zeem-track</code>.</li>
        <li>Bij <b>Settings › Variables and Secrets</b>: voeg een <b>Secret</b> toe met naam <code>KEY</code> en als waarde de sleutel hierboven.</li>
        <li>Kopieer het adres van je worker (eindigt op <code>.workers.dev</code>), plak het hierboven, sla op en test de verbinding.</li></ol>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="small" id="trkCopy">${I.copy}Servercode kopiëren</button><button type="button" class="small" id="trkKey">${I.copy}Sleutel kopiëren</button></div>
      <div class="warnbox">${I.alert}<span><b>Goed om te weten.</b> Apple Mail en sommige mailprogramma's laden plaatjes vooraf of blokkeren ze. Een mail kan daardoor als geopend worden gemeld terwijl de klant hem nog niet las, of andersom. Klikken op een link is wel betrouwbaar. Vermeld in je privacyverklaring dat je meet of mails worden geopend.</span></div>`,{wide:false});
    bindSave();
    $("#trkCopy").onclick=()=>copy(TRACK_WORKER);
    $("#trkKey").onclick=()=>copy(form.querySelector('[data-k="trackKey"]').value);
    $("#trkTest").onclick=async()=>{const u=form.querySelector('[data-k="trackUrl"]').value.trim().replace(/\/+$/,""),k=form.querySelector('[data-k="trackKey"]').value.trim(),R=$("#trkRes");
      if(!/^https:\/\//.test(u)){R.innerHTML='<span style="color:var(--late)">Vul eerst een adres in dat met https:// begint</span>';return}R.textContent="Bezig…";
      try{const a=await fetch(u+"/ping");if(!a.ok)throw new Error("server niet gevonden");const b=await fetch(u+"/e",{method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify({k,ids:[]})});
        R.innerHTML=b.ok?'<span style="color:var(--ok);font-weight:700">Verbonden, sleutel klopt ✓</span>':b.status===401?'<span style="color:var(--late)">Server gevonden, maar de sleutel klopt niet (controleer secret KEY)</span>':'<span style="color:var(--late)">Server gaf fout '+b.status+' (controleer de KV-koppeling TRACK)</span>'}
      catch(e){R.innerHTML='<span style="color:var(--late)">Niet bereikbaar: '+esc(e.message||String(e))+'</span>'}}},
  sms(){const sug=String(s.naam||"").replace(/[^a-z0-9]/gi,"").slice(0,11).toLowerCase();
    setDlg(c,`<label>Afzendernaam<input data-k="smsNaam" id="smsn" value="${esc(s.smsNaam)}" maxlength="11"><small class="help">Letters en cijfers, 3 tot 11 tekens. Geen spaties, punten of streepjes.</small></label>
      <div class="splitrow"><b class="subt" id="smsc"></b>${sug.length>=3?`<button type="button" class="tiny ghost" id="smsSug" style="color:var(--brand);text-decoration:underline">Gebruik "${esc(sug)}"</button>`:""}</div>
      <div class="box">${sec("Voorbeeld op de telefoon")}<div class="bubble"><b id="smsp"></b><span>Morgen komen wij langs voor de glasbewassing. Tot dan!</span></div></div>
      ${info("<b>Goed om te weten:</b> berichten gaan via je eigen telefoon, dus de ontvanger ziet je telefoonnummer. Deze naam gebruiken we als ondertekening in sms- en WhatsApp-teksten ({afzender}). Laat je dit leeg, dan gebruiken we je bedrijfsnaam.")}
      ${testRow("tsms","+31612345678","Opent je berichten-app met een testbericht.")}`,{wide:false});
    const u=()=>{const v=$("#smsn").value;$("#smsc").textContent=v.length+"/11 tekens"+(v&&!/^[a-z0-9]{3,11}$/i.test(v)?" · ongeldig":"");$("#smsp").textContent=v||s.naam||"Je bedrijf"};$("#smsn").oninput=u;u();
    const sg=$("#smsSug");if(sg)sg.onclick=()=>{$("#smsn").value=sug;u()};
    bindTest("tsms",()=>"Morgen komen wij langs voor de glasbewassing. Tot dan! "+($("#smsn").value||s.naam));
    form.onsubmit=async e=>{e.preventDefault();const v=$("#smsn").value.trim();if(v&&!/^[a-z0-9]{3,11}$/i.test(v)){toast("Gebruik 3 tot 11 letters of cijfers");return}if(await saveSettings({smsNaam:v})){dlg.close();schedule()}};},
  dag(){const ph="[name.customer] · [date.appointment] · [time.appointment] · [timeslot.appointment] · [fulladdress.appointment] · [service.appointment] · [name.company] · [phone.company]";
    setDlg(c,`${tgl("dagAan","Dagherinnering klaarzetten","De herinneringen staan klaar in Communicatie; jij opent ze met één tik. Gaat ook als je eerder al hebt gemeld dat je komt.",s.dagAan)}
      ${sel("dagKanaal","Via welk kanaal",s.dagKanaal,[["whatsapp","WhatsApp"],["sms","SMS"],["email","Alleen e-mail"]],{help:"Dit kanaal staat bovenaan en gemarkeerd bij het versturen."})}
      ${sec("Wanneer klaarzetten")}${tgl("dagVast","Op een vast tijdstip vooraf","Bijv. elke dag om 18:00 voor alle klussen van morgen.",s.dagVast!==false)}
      <div class="grid2">${sel("dagDagen","Hoeveel dagen vooraf",s.dagDagen,[[1,"1 dag vooraf"],[2,"2 dagen vooraf"],[3,"3 dagen vooraf"]],{t:"num"})}${inp("dagTijd","Om welk tijdstip",s.dagTijd,{type:"time"})}</div>
      ${tgl("dagUurAan","Zoveel uur voor de klus zelf","Kijkt naar de starttijd van elke klus apart.",s.dagUurAan)}
      ${sel("dagUren","Uur voor de klus",s.dagUren,[[1,"1 uur"],[2,"2 uur"],[3,"3 uur"],[4,"4 uur"]],{t:"num"})}
      <p class="subt" style="margin:0">Staan beide aan, dan krijgt de klant twee berichten. Meerdere klussen op hetzelfde adres op dezelfde dag worden één bericht met alle diensten en tijden erin.</p>
      ${sec("Berichttekst")}${inp("dagOnderwerp","E-mail onderwerp",s.dagOnderwerp,{cls:"full"})}${ta("dagMail","E-mail bericht",s.dagMail,{rows:8})}${ta("dagSms","SMS- en WhatsApp-tekst",s.dagSms,{rows:3,count:true,help:"Houd het kort: één sms is 160 tekens."})}
      <small class="help">Beschikbaar: ${ph} · {afzender}</small>
      ${sec("Controleren")}<button type="button" class="small" id="whoNow">${I.search}Wie krijgt hem nu?</button><div id="whoList"></div>
      ${testRow("tdag","jij@bedrijf.nl of +31612345678","E-mailadres of telefoonnummer: opent één bericht met jouw tekst.")}`);
    $("#whoNow").onclick=()=>{const q=queues().filter(x=>x.id==="herinnering"||x.id==="uur");const it=q.flatMap(x=>x.items);$("#whoList").innerHTML=it.length?`<table class="minitable">${it.map(i=>`<tr><td><b>${esc(cleanName(i.k.naam))}</b></td><td>${esc(i.vars.datum)}</td><td>${esc(i.vars.tijdvak)}</td></tr>`).join("")}</table>`:`<p class="subt">Nu niemand${s.dagAan?"":" (de herinnering staat uit)"}. Alleen klanten die ingepland staan krijgen hem.</p>`};
    bindTest("tdag",kan=>kan==="email"?form.querySelector('[data-k="dagMail"]').value:form.querySelector('[data-k="dagSms"]').value,()=>form.querySelector('[data-k="dagOnderwerp"]').value);bindSave();},
  fh(){const M=fhMomenten();
    setDlg({...c,sub:"Herinneren na de vervaldatum"},`${tgl("fhAan","Herinneringen klaarzetten","Zet een herinnering klaar zodra een factuur te laat is. Betaalde facturen vallen af.",s.fhAan)}
      <div class="grid2">${inp("fhTijd","Tijdstip",s.fhTijd,{type:"time"})}${sel("fhSkip","Zelf net gestuurd? Overslaan",s.fhSkip,[[0,"Niet overslaan"],[1,"1 dag"],[3,"3 dagen"],[7,"7 dagen"]],{t:"num"})}</div>
      ${tgl("fhWerkdagen","Alleen op werkdagen","In het weekend en op feestdagen staat er niets klaar.",s.fhWerkdagen)}
      ${tgl("fhIncasso","Automatische incasso overslaan","Klanten met automatische incasso krijgen geen herinnering.",s.fhIncasso)}
      ${tgl("fhStop","Stoppen na de aanmaning","Daarna neem jij het over: er wordt niets meer klaargezet.",s.fhStop)}
      ${sec("Momenten en teksten")}<p class="subt" style="margin:0">Elk moment is los aan te zetten en zelf in te stellen. Per factuur gaat elk moment maximaal één keer de deur uit; eerdere momenten worden niet met terugwerkende kracht verstuurd.</p>
      ${M.map((m,i)=>`<details class="moment"${i===0?" open":""}><summary><b>${esc(m.naam)}</b><span class="subt">${m.dagen} dagen te laat · ${KANAAL[m.kanaal]}</span></summary><div class="mbody">
        <label class="tgl"><span><b>Dit moment gebruiken</b></span><input type="checkbox" data-m="${i}" data-f="aan" ${m.aan?"checked":""}><i></i></label>
        <div class="grid2"><label>Dagen na vervaldatum<input type="number" min="1" data-m="${i}" data-f="dagen" value="${m.dagen}"></label><label>Via welk kanaal<select data-m="${i}" data-f="kanaal">${[["email","Alleen e-mail"],["whatsapp","WhatsApp"],["sms","SMS"]].map(([a,b])=>`<option value="${a}" ${m.kanaal===a?"selected":""}>${b}</option>`).join("")}</select></label></div>
        <label>E-mail onderwerp<input data-m="${i}" data-f="onderwerp" value="${esc(m.onderwerp)}"></label>
        <label>E-mail bericht<textarea data-m="${i}" data-f="mail" style="min-height:170px">${esc(m.mail)}</textarea><small class="help">Download de PDF bij de factuur als je hem wilt meesturen.</small></label>
        <label>SMS- en WhatsApp-tekst<textarea data-m="${i}" data-f="sms" style="min-height:70px">${esc(m.sms)}</textarea><small class="help">Houd het kort: één sms is 160 tekens.</small></label></div></details>`).join("")}
      <small class="help">Beschikbaar: [name.customer] · [nr.invoice] · [total.invoice] · [duedate.invoice] · [daysoverdue.invoice] · [mollielink.invoice] · [payline.invoice] · [name.company] · [iban.company] · [phone.company]</small>
      ${sec("Controleren")}<button type="button" class="small" id="whichNow">${I.search}Welke facturen nu?</button><div id="whichList"></div>`);
    $("#whichNow").onclick=()=>{const q=queues().find(x=>x.id==="aanmaning"),it=q?q.items:[];const late=facturen().filter(f=>fStatus(f)[1]==="Achterstallig");
      $("#whichList").innerHTML=it.length?`<table class="minitable">${it.map(i=>`<tr><td class="mono">${esc(i.vars.factuurnummer)}</td><td>${esc(cleanName(i.k.naam))}</td><td>${esc(i.stap.naam)}</td><td class="r">${esc(i.vars.bedrag)}</td></tr>`).join("")}</table>`:`<p class="subt">Nu geen. ${plural(late.length,"factuur is","facturen zijn")} achterstallig${s.fhAan?"":"; de herinneringen staan uit"}.</p>`};
    bindSave(()=>{const m=fhMomenten().map(x=>({...x}));form.querySelectorAll("[data-m]").forEach(el=>{const i=Number(el.dataset.m),f=el.dataset.f;m[i][f]=f==="aan"?el.checked:f==="dagen"?Number(el.value)||1:el.value});return{fhM:m}});},
  betaal(){setDlg(c,`${sel("betaalwijze","Standaard betaalmethode bij afmelden",s.betaalwijze,[["overmaken","Overmaken (factuur blijft open)"],["contant","Contant (factuur direct betaald)"],["pin","Pin (factuur direct betaald)"],["tikkie","Betaalverzoek / betaallink"]],{help:"Geldt als je een job afmeldt met direct factureren."})}
      ${inp("betaallink","Vaste betaallink (optioneel)",s.betaallink,{cls:"full",ph:"https://…",help:"Bijv. een vast betaalverzoek van je bank of Tikkie. Komt als [mollielink.invoice] in herinneringen en onder je PDF-facturen."})}
      <div class="warnbox">${I.alert}<span>Online betalen via Mollie of iDEAL met automatische afboeking heeft een betaalaccount en een server nodig. Dat kan Mansard niet. Afboeken doe je met <b>Bijschrijvingen</b> (bankafschrift inlezen) of met de knop Markeer betaald.</span></div>`,{wide:false});bindSave();},
  bijschr(){openBank()},
  rapport(){setDlg({...c,t:"Rapport boekhouder",sub:"Maand- of kwartaal-PDF voor je boekhouder"},`${inp("boekhouderEmail","E-mail boekhouder",s.boekhouderEmail,{type:"email",cls:"full",ph:"boekhouder@kantoor.nl",help:"Het rapport wordt als mail aan dit adres klaargezet"})}
      ${sel("rapportFreq","Frequentie",s.rapportFreq||"maand",[["maand","Elke maand (vorige maand)"],["kwartaal","Elk kwartaal (vorig kwartaal)"]],{help:"Hoe vaak het rapport klaarstaat"})}
      ${sel("rapportType","Type rapport",s.rapportType||"volledig",[["volledig","Volledig (omzet + facturen + uitgaven)"],["kort","Alleen totalen"]])}
      ${tgl("rapportAan","Automatisch klaarzetten","Op de verstuurdag staat het rapport klaar in Communicatie; jij downloadt de PDF en stuurt de mail.",s.rapportAan)}
      ${sel("rapportDag","Verstuurdag",s.rapportDag,[...Array(28)].map((_,i)=>[i+1,"Dag "+(i+1)+" van de maand"]),{t:"num"})}
      ${sec("Inkoopfacturen")}<div class="warnbox">${I.alert}<span>Automatisch doorsturen of een inkoop-mailbox met AI-scan kan Mansard niet: daarvoor is een mailserver nodig. Voeg bonnen toe via Boekhouding of de knop Bon op Vandaag; ze staan met foto in het rapport-overzicht.</span></div>
      ${sec("Direct downloaden")}<p class="subt" style="margin:0">Kies de periode en download het rapport (PDF), handig om te testen of alles klopt.</p>
      <div class="grid2"><label>Jaar<select id="rpY">${[0,1,2].map(i=>today().getFullYear()-i).map(y=>`<option>${y}</option>`).join("")}</select></label><label>Periode<select id="rpP">${[...Array(12)].map((_,m)=>`<option value="m${m}" ${m===(today().getMonth()+11)%12?"selected":""}>${new Date(2000,m,1).toLocaleDateString("nl-NL",{month:"long"})}</option>`).join("")}${[1,2,3,4].map(q=>`<option value="q${q}">Q${q}</option>`).join("")}</select></label></div>
      <button type="button" class="small" id="rpGo" style="align-self:flex-start">${I.dl}Download rapport</button>`,{wide:false});
    $("#rpGo").onclick=()=>pdfRapport(Number($("#rpY").value),$("#rpP").value);bindSave();},
  peppol(){const miss=[!s.peppolId&&"Peppol ID",!s.kvk&&"KvK-nummer",!s.btwnr&&"Btw-nummer"].filter(Boolean);
    setDlg(c,`${miss.length?`<div class="warnbox">${I.alert}<span>Ontbreekt: ${esc(miss.join(", "))}</span></div>`:""}
      <div class="grid2">${inp("peppolId","Peppol ID",s.peppolId,{cls:"full",ph:"0106:12345678",help:"Voor Nederlandse bedrijven: 0106 gevolgd door je KvK-nummer"})}${inp("kvk","KvK-nummer",s.kvk)}${inp("btwnr","Btw-nummer",s.btwnr)}</div>
      ${info("Je Peppol ID komt op je facturen zodat zakelijke klanten je kunnen herkennen. Echt via het Peppol-netwerk versturen kan Mansard niet: daarvoor is een aangesloten Peppol-dienstverlener nodig.")}`,{wide:false});bindSave();},
  data(){let tab="import",typ="klanten";
    const T=[["klanten","Klanten","Kies zelf de kolommen",I.klanten],["jobs","Jobs","Afgemelde opdrachten",I.checksq],["facturen","Facturen","Met bedragen en status",I.facturen]];
    const draw=()=>{$("#dbB").innerHTML=`<div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr)">${[["import","Importeren",I.upload],["export","Exporteren",I.dl],["tpl","Templates",I.note]].map(([k,l,ic])=>`<button type="button" data-tab2="${k}" aria-pressed="${tab===k}">${ic}${l}</button>`).join("")}</div>
      ${sec("Data type")}<div class="grid2">${T.filter(x=>tab!=="import"||x[0]==="klanten").map(([k,l,d,ic])=>`<button type="button" class="typeb${typ===k?" on":""}" data-typ="${k}"><span>${ic}</span><span><b>${l}</b><small>${d}</small></span>${typ===k?I.check:""}</button>`).join("")}</div>
      ${tab==="import"?`${info("Je eigen Excel werkt: sla hem op als CSV (Bestand › Opslaan als › CSV). Na het kiezen zie je een <b>voorstel</b> voor de kolommen, dat je zelf kunt aanpassen. Jobs en facturen importeren kan Mansard niet; die ontstaan vanzelf bij het afmelden.","ok")}<button type="button" class="primary" data-act="import" style="width:100%">${I.upload}Kies bestand en start import</button>`
       :tab==="export"?`<button type="button" class="primary" id="dbGo" style="width:100%">${I.dl}Exporteer ${esc(T.find(x=>x[0]===typ)[1].toLowerCase())} als CSV</button><small class="help">Opent in Excel of Numbers. Maak af en toe een back-up van je klanten.</small>${sec("Volledige back-up")}<button type="button" id="dbAll" style="width:100%">${I.dl}Alles exporteren (JSON)</button><button type="button" id="dbAllF" style="width:100%;margin-top:8px">${I.dl}Alles + foto's (voor de overstap)</button><small class="help">Alle klanten, opdrachten, afspraken, facturen, berichten en instellingen in één bestand. Dit is ook het bestand waarmee Mansard later naar een eigen server overgaat.</small>`
       :`<button type="button" class="primary" id="dbTpl" style="width:100%">${I.note}Download lege voorbeeld-CSV</button><small class="help">Vul deze in Excel en importeer hem daarna.</small>`}`;
      const g=$("#dbGo");if(g)g.onclick=()=>{
        if(typ==="klanten")exportKlanten();else if(typ==="facturen")exportFacturen();
        else if(typ==="jobs")saveFile("zeem-jobs-"+iso(today())+".csv",csvOf(["datum","klant","dienst","bedrag","gefactureerd","betaald"],state.beurten.map(x=>({datum:x.datum,klant:cleanName(x.klantNaam),dienst:x.dienst||"",bedrag:Number(x.bedrag)||0,gefactureerd:x.gefactureerd?"ja":"nee",betaald:x.betaald?"ja":"nee"}))),"Jobs opgeslagen");
        else saveFile("zeem-bonnen-"+iso(today())+".csv",csvOf(["datum","leverancier","omschrijving","categorie","bedrag","btw"],state.kosten),"Bonnen opgeslagen")};
      const al=$("#dbAll");if(al)al.onclick=()=>exportAlles();const alf=$("#dbAllF");if(alf)alf.onclick=()=>exportAlles(true);const tp=$("#dbTpl");if(tp)tp.onclick=()=>saveFile("zeem-klanten-voorbeeld.csv","﻿naam;adres;postcode;plaats;telefoon;email;ronde;dienst;frequentie;prijs;laatst;notities\nFam. Jansen;Dorpsstraat 1;1234 AB;Voorbeeld;0612345678;jansen@voorbeeld.nl;Ronde Noord;Glasbewassing;4;24,50;01-09-2026;Sleutel bij buren\n","Voorbeeld opgeslagen")};
    setDlg({...c,sub:"Importeer of exporteer klanten, jobs, facturen en bonnen"},`<div id="dbB"></div>`,{wide:false,foot:`<span class="sp"></span><button type="button" data-act="close">Sluiten</button>`});draw();
    $("#dbB").onclick=e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.tab2){tab=b.dataset.tab2;if(tab==="import")typ="klanten";draw()}else if(b.dataset.typ){typ=b.dataset.typ;draw()}};},
  afmelden(){let sk=[...(s.skipRedenen||[])],an=[...(s.annuleerRedenen||[])],st=s.afmeldStatus==="overslaan"?"overslaan":"concept",bm=[...(s.betaalmethoden||["contant","pin","bank"])],bw=s.betaalwijze||"overmaken";
    const BM=[["contant","Contant",I.euro],["pin","PIN",I.card],["bank","Bank",I.bank]],ST=[["concept","Conceptfactuur in Facturen",I.note],["overslaan","Overslaan",I.right]];
    const draw=()=>{$("#afB").innerHTML=`<div class="secl">Overslaan-redenen <span class="mono">${sk.length}</span></div><div class="chips wrap">${sk.map((r,i)=>`<span class="rchip y">${esc(r)}<button type="button" data-rmsk="${i}" aria-label="Verwijder">${I.x}</button></span>`).join("")}</div>
      <div class="testrow"><input id="skIn" placeholder="Voeg eigen reden toe…"><button type="button" class="small yellow" id="skAdd" aria-label="Toevoegen">${I.plus}</button></div>
      <div class="secl">Annulerings-redenen <span class="mono">${an.length}</span></div><div class="chips wrap">${an.map((r,i)=>`<span class="rchip r">${esc(r)}<button type="button" data-rman="${i}" aria-label="Verwijder">${I.x}</button></span>`).join("")}</div>
      <div class="testrow"><input id="anIn" placeholder="Voeg eigen reden toe…"><button type="button" class="small" id="anAdd" style="background:var(--late-bg);color:var(--late)" aria-label="Toevoegen">${I.plus}</button></div>
      <div class="box plan"><div class="secl" style="color:var(--plan)">Standaard afmeld-actie</div><p class="subt" style="margin:0 0 8px">Afmelden zet standaard een conceptfactuur klaar in Facturen. Wil je dat de factuur bij een klant meteen verstuurd wordt, zet dat dan aan in de klantkaart (Factuur direct versturen bij afmelden).</p>
        <div class="chips wrap">${ST.map(([k,l,ic])=>`<button type="button" class="chip${st===k?" onplan":""}" data-st="${k}">${ic}${l}</button>`).join("")}</div></div>
      <div class="box okb"><div class="secl" style="color:var(--ok)">Betaalmethoden</div><div class="chips wrap">${BM.map(([k,l,ic])=>`<button type="button" class="chip${bm.includes(k)?" onok":""}" data-bm="${k}">${ic}${l}</button>`).join("")}</div>
        <div class="secl" style="color:var(--ok)">Standaard</div><div class="chips wrap">${BM.filter(([k])=>bm.includes(k)).map(([k,l,ic])=>`<button type="button" class="chip${(bw==="overmaken"?"bank":bw)===k?" onok":""}" data-bw="${k}">${ic}${l}</button>`).join("")}</div>
        <small class="help">Bij Contant of PIN wordt een direct gefactureerde job meteen als betaald geboekt. Bank = overmaken, de factuur blijft open.</small></div>`;
      const add=(inp,arr)=>{const v=$(inp).value.trim();if(v&&!arr.includes(v)){arr.push(v);draw()}};
      $("#skAdd").onclick=()=>add("#skIn",sk);$("#anAdd").onclick=()=>add("#anIn",an);
      $("#skIn").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();add("#skIn",sk)}};$("#anIn").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();add("#anIn",an)}}};
    setDlg({...c,sub:"Overslaan-redenen, annuleringsredenen en standaard betaalmethode"},`<div id="afB"></div>`,{wide:false});draw();
    $("#afB").onclick=e=>{const t=e.target.closest("button");if(!t)return;
      if(t.dataset.rmsk){sk.splice(Number(t.dataset.rmsk),1);draw()}else if(t.dataset.rman){an.splice(Number(t.dataset.rman),1);draw()}
      else if(t.dataset.st){st=t.dataset.st;draw()}else if(t.dataset.bm){const k=t.dataset.bm;bm=bm.includes(k)?bm.filter(x=>x!==k):[...bm,k];if(!bm.length)bm=["bank"];draw()}
      else if(t.dataset.bw){bw=t.dataset.bw==="bank"?"overmaken":t.dataset.bw;draw()}};
    form.onsubmit=async e=>{e.preventDefault();if(await saveSettings({skipRedenen:sk,annuleerRedenen:an,afmeldStatus:st,betaalmethoden:bm,betaalwijze:bw})){dlg.close();schedule()}};},
  welkom(){const T=tpls();let vw=s.voorwaardenPdf||"",vwNaam=s.voorwaardenNaam||"";
    const pdfRow=()=>vw?`<div class="filerow">${I.note}<div style="flex:1;min-width:0"><b>${esc(vwNaam||"voorwaarden.pdf")}</b></div><a class="tiny ghost btn" href="${BLOB}${esc(vw)}" target="_blank" rel="noopener" style="color:var(--brand)">Openen</a><button type="button" class="tiny ghost danger" id="vwX" aria-label="Verwijder">${I.trash}</button></div>`:(state.assets?`<label class="btn small" style="align-self:flex-start">${I.upload}PDF uploaden<input type="file" accept="application/pdf" hidden id="vwF"></label>`:'<p class="subt" style="margin:0">Uploaden kan alleen de eigenaar van deze pagina.</p>');
    setDlg({...c,sub:"Teksten, algemene voorwaarden en akkoord van de klant"},`${info("Je stuurt het welkomstbericht zelf, per klant, vanuit de klantkaart of Communicatie › Klaar om te versturen. In de teksten kun je <b>[name.company]</b> en <b>[name.customer]</b> gebruiken. Digitaal laten ondertekenen kan Mansard niet; de klant gaat akkoord door op je mail te antwoorden en dat noteer je op de klantkaart.")}
      ${tgl("welkomAan","Welkomstberichten klaarzetten","Nieuwe klanten verschijnen 30 dagen lang onder Klaar om te versturen.",s.welkomAan)}
      ${inp("welkomOnderwerp","Onderwerp van de mail",s.welkomOnderwerp||"Welkom bij [name.company]",{cls:"full"})}
      <label class="full">Tekst van de mail<textarea id="wTxt" style="min-height:150px">${esc(T.welkom.mail)}</textarea><small class="help">De overeenkomst en de link naar je voorwaarden worden er automatisch onder gezet.</small></label>
      ${sec("Algemene voorwaarden (PDF)")}<div id="vwBox">${pdfRow()}</div><small class="help">De link gaat mee in de welkomstmail.</small>
      ${inp("voorwaarden","Of: link naar je voorwaarden op je website",s.voorwaarden,{cls:"full",ph:"https://jouwsite.nl/voorwaarden"})}
      ${sec("Overeenkomst")}${inp("ovTitel","Titel van de overeenkomst",s.ovTitel||"Serviceovereenkomst",{cls:"full"})}
      ${ta("ovInleiding","Inleiding in de overeenkomst",s.ovInleiding||"Op deze overeenkomst zijn de algemene voorwaarden van [name.company] van toepassing.",{rows:3})}
      <div class="grid2">${inp("opzegtermijn","Opzegtermijn",s.opzegtermijn)}${inp("ovMelding","Melding naar",s.ovMelding,{type:"email",ph:"jij@bedrijf.nl",help:"Leeg = het e-mailadres van je bedrijf."})}</div>
      ${ta("ovExtra","Extra afspraken (optioneel)",s.ovExtra,{rows:3,help:"Komt als extra punt in de overeenkomst te staan."})}
      ${tgl("incassoVragen","Ook een machtiging voor automatische incasso vragen","",s.incassoVragen)}
      <div class="box">${tgl("ovHerAan","Herinneren als de klant nog niet akkoord is","Zet een herinnering klaar in Communicatie zolang je op de klantkaart nog geen akkoord hebt aangevinkt.",s.ovHerAan!==false)}
        <div class="grid3">${inp("ovHer1","Eerste na (dagen)",s.ovHer1??5,{type:"number",t:"num"})}${inp("ovHerN","Daarna elke (dagen)",s.ovHerN??7,{type:"number",t:"num"})}${inp("ovHerMax","Maximaal aantal",s.ovHerMax??2,{type:"number",t:"num"})}</div>
        ${ta("ovHerTekst","Tekst van de herinnering",s.ovHerTekst||"Beste [name.customer],\n\nU heeft van ons een serviceovereenkomst ontvangen waar we nog geen akkoord op hebben. Wilt u die kort doornemen en laten weten of u akkoord gaat? Een kort antwoord op deze mail is genoeg.\n\nMet vriendelijke groet,\n[name.company]",{rows:5})}</div>`);
    const bindPdf=()=>{const f=$("#vwF");if(f)f.onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const r=await state.assets.upload(file,{type:"application/pdf"});vw=r.id;vwNaam=file.name;$("#vwBox").innerHTML=pdfRow();bindPdf()}catch(er){toast("Uploaden lukte niet ("+(er.code||"fout")+")")}};
      const x=$("#vwX");if(x)x.onclick=()=>{vw="";vwNaam="";$("#vwBox").innerHTML=pdfRow();bindPdf()}};bindPdf();
    form.onsubmit=async e=>{e.preventDefault();const p={...readFields(),voorwaardenPdf:vw,voorwaardenNaam:vwNaam};let tx=$("#wTxt").value;
      try{await save("instellingen","sjablonen",{...state.sjablonen,welkom:{...(state.sjablonen.welkom||{}),naam:T.welkom.naam,mail:tx}})}catch(er){err(er);return}if(await saveSettings(p)){dlg.close();schedule()}};},
  doorplannen(){let w=[...(s.werkdagen||[1,2,3,4,5])];const t=today(),fd={...feestdagen(t.getFullYear(),s.land),...feestdagen(t.getFullYear()+1,s.land)},nx=Object.keys(fd).sort().filter(d=>parse(d)>=t).slice(0,6);
    const check=()=>{const bad=actief().filter(k=>k.gepland&&!isWerkdag(parse(k.gepland)));const ok=actief().filter(k=>k.gepland).length;
      $("#rkRes").innerHTML=bad.length?`<div class="warnbox">${I.alert}<span>${plural(bad.length,"job staat","jobs staan")} op een vrije dag of feestdag: ${bad.slice(0,4).map(k=>esc(cleanName(k.naam))+" ("+fmtD(k.gepland)+")").join(", ")}. <button type="button" class="tiny" id="rkFix">Verplaats naar werkdag</button></span></div>`:`<div class="okbox" style="margin:0">${I.check}<div><span>Alle ${ok} ingeplande jobs staan netjes op een werkdag.</span></div></div>`;
      const fx=$("#rkFix");if(fx)fx.onclick=async()=>{await runSeq(bad,k=>save("klanten",k.id,{...strip(k),gepland:iso(werkdagAanpassen(parse(k.gepland)))}),"Jobs verplaatst naar een werkdag");setTimeout(check,200)}};
    setDlg({...c,t:"Doorplannen",sub:"Werkdagen, feestdagen en de controle van je planning"},`${sec("Op welke dagen werk je")}<div class="daychips">${[[1,"Ma"],[2,"Di"],[3,"Wo"],[4,"Do"],[5,"Vr"],[6,"Za"],[0,"Zo"]].map(([d,l])=>`<label><input type="checkbox" data-wd="${d}" ${w.includes(d)?"checked":""}><span>${l}</span></label>`).join("")}</div>
      <p class="subt" style="margin:0">Valt een beurt op een dag die uit staat, dan stelt Mansard een werkdag voor, bijvoorbeeld zaterdag → vrijdag, of 1e Kerstdag → 24 december. Het ritme loopt daarna gewoon door vanaf de laatste beurt.</p>
      ${sel("vrijeDag","Welke werkdag pakt Mansard dan",s.vrijeDag,[["voor","De werkdag ervóór"],["na","De werkdag erna"]])}
      ${tgl("feestdagen","Feestdagen overslaan",s.land==="BE"?"Nieuwjaar, Paasmaandag, 1 mei, Hemelvaart, Pinkstermaandag, 21 juli, 15 augustus, 1 en 11 november en Kerstmis.":"Nieuwjaarsdag, 2e Paasdag, Koningsdag, Hemelvaart, 2e Pinksterdag, 1e/2e Kerstdag en Bevrijdingsdag (lustrumjaren).",s.feestdagen)}
      <div class="box">${sec("Komende feestdagen")}<table class="minitable">${nx.map(d=>`<tr><td>${esc(fd[d])}</td><td class="r">${wd(parse(d))} ${fmtD(d)}</td></tr>`).join("")}</table></div>
      <div class="splitrow">${sec("Controle van je planning")}<button type="button" class="tiny ghost" id="rkAgain">${I.refresh}Opnieuw kijken</button></div><div id="rkRes"></div>`,{wide:false});
    check();$("#rkAgain").onclick=check;
    bindSave(()=>({werkdagen:[...form.querySelectorAll("[data-wd]")].filter(x=>x.checked).map(x=>Number(x.dataset.wd))}));},
  review(){const T=tpls(),rv=state.berichten.filter(m=>m.sjabloon==="review"),t=today();
    setDlg({...c,sub:"Om een review vragen, met limiet per klant"},`${info("Een paar dagen nadat je een factuur maakt, zet Mansard een vriendelijk reviewverzoek klaar in Communicatie. In de teksten kun je <b>[name.company]</b> en <b>[name.customer]</b> gebruiken. Op de klantkaart kun je per klant aangeven dat er géén reviewverzoeken meer heen gaan.")}
      <label class="check-row"><input type="checkbox" data-k="reviewAan" data-t="bool" ${s.reviewAan?"checked":""}>Reviewverzoek klaarzetten na een factuur</label>
      ${inp("reviewLink","Reviewlink",s.reviewLink,{cls:"full",ph:"https://g.page/r/…/review",help:"De link waar de klant zijn review achterlaat (bv. je Google-reviewlink)."})}
      <div class="grid3">${inp("reviewNa","Dagen na factuur",s.reviewNa??3,{type:"number",t:"num"})}${inp("reviewMax","Max per klant",s.reviewMax,{type:"number",t:"num"})}${inp("reviewDagen","Wachttijd (dagen)",s.reviewDagen,{type:"number",t:"num"})}</div>
      <small class="help"><b>Dagen na factuur</b>: hoe lang we wachten. <b>Max per klant</b>: hoe vaak één klant ooit een verzoek krijgt. <b>Wachttijd</b>: minimaal aantal dagen tussen twee verzoeken. Voorbeeld: 3 dagen · max 2 · 180 dagen ertussen.</small>
      ${inp("reviewOnderwerp","Onderwerp van de mail",s.reviewOnderwerp||"Tevreden over ons werk?",{cls:"full"})}
      <label class="full">Tekst van de mail<textarea id="rvTxt" style="min-height:120px">${esc(T.review.mail)}</textarea><small class="help">De reviewlink wordt automatisch toegevoegd.</small></label>
      ${inp("reviewKnop","Tekst bij de link",s.reviewKnop||"Review achterlaten",{cls:"full"})}
      <div class="splitrow">${sec("Verstuurd")}<button type="button" class="small" data-act="queue" data-q="review">${I.send}Nu verwerken</button></div>
      <div class="grid4">${[["Totaal",rv.length],["30 dagen",rv.filter(m=>(t-new Date(m.op))/DAY<=30).length],["Klaar",(queues().find(q=>q.id==="review")||{items:[]}).items.length],["Uitgezet",state.klanten.filter(k=>k.geenReview).length]].map(([l,n])=>`<div class="minibox c"><b>${n}</b><small>${l}</small></div>`).join("")}</div>
      ${rv.length?"":'<p class="subt" style="margin:0">Nog geen reviewverzoeken.</p>'}`,{wide:false,foot:`<button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="button" id="rvPrev">${I.search}Voorbeeld</button><button type="submit" class="primary" id="setSave">Opslaan</button>`});
    $("#rvPrev").onclick=()=>{const p=readFields(),v={klant:"Fam. Voorbeeld",bedrijf:s.naam||"Je bedrijf",reviewlink:p.reviewLink||"(je reviewlink)"};const body=fill($("#rvTxt").value,v)+(p.reviewLink&&!$("#rvTxt").value.includes("[link.review]")?"\n\n"+(p.reviewKnop||"Review achterlaten")+": "+p.reviewLink:"");
      toast("Voorbeeld hieronder");const el=$("#rvPv")||document.createElement("div");el.id="rvPv";el.className="bubble";el.style.whiteSpace="pre-line";el.innerHTML=`<b>${esc(fill(p.reviewOnderwerp,v))}</b><span>${esc(body)}</span>`;$("#rvTxt").parentElement.after(el)};
    form.onsubmit=async e=>{e.preventDefault();let tx=$("#rvTxt").value;const p=readFields();
      try{await save("instellingen","sjablonen",{...state.sjablonen,review:{...(state.sjablonen.review||{}),naam:T.review.naam,mail:tx}})}catch(er){err(er);return}if(await saveSettings(p)){dlg.close();schedule()}};},
  planning(){const w=s.werkdagen||[1,2,3,4,5],nz=actief().filter(k=>k.gepland&&!k.tijd).length;
    setDlg({t:"Planning instellingen",sub:"Werktijden, slots, weekends en weergave",ic:"planning",bg:"#23845a"},`${sec("Werktijden")}<div class="grid2">${inp("werkStart","Start werkdag",s.werkStart,{type:"time"})}${inp("werkEind","Einde werkdag",s.werkEind,{type:"time"})}</div>
      ${sec("Kalender weergave")}<div class="grid2">${inp("kalVan","Vanaf",s.kalVan,{type:"time",help:"Eerste zichtbare uur"})}${inp("kalTot","Tot",s.kalTotMig?s.kalTot:(s.kalTot==="19:00"||!s.kalTot?"22:00":s.kalTot),{type:"time",help:"Laatste zichtbare uur"})}
      ${sel("slotStd","Slot duur (min)",s.slotStd,[[10,"10 minuten"],[15,"15 minuten"],[30,"30 minuten"]],{t:"num"})}${inp("zichtbaarDagen","Te plannen zichtbaar (dagen vooraf)",s.zichtbaarDagen??11,{type:"number",t:"num",attrs:'min="0" max="60"',help:"Zoveel dagen voordat een klant weer aan de beurt is, verschijnt hij bij 'Te plannen'. Meer dan 7 dagen te vroeg inplannen geeft een waarschuwing."})}
      ${inp("maxJobs","Max jobs per dag",s.maxJobs,{type:"number",t:"num",attrs:'min="0"',help:"0 = geen drempel. Waarschuwt als er meer jobs op een dag staan."})}<span></span></div>
      <label>Weekenddagen (vrij)</label><div class="daychips inv">${[[0,"Zo"],[1,"Ma"],[2,"Di"],[3,"Wo"],[4,"Do"],[5,"Vr"],[6,"Za"]].map(([d,l])=>`<label><input type="checkbox" data-we="${d}" ${w.includes(d)?"":"checked"}><span>${l}</span></label>`).join("")}</div><small class="help">Tik om aan/uit te zetten. Vrije dagen zijn gearceerd in de planning.</small>
      ${tgl("overlap","Taak overlap toestaan","Twee jobs op hetzelfde tijdstip toestaan",s.overlap)}
      ${tgl("compact","Compacte dagweergave","Toon meer per scherm in de dagweergave",s.compact)}
      ${tgl("ultra","Ultra-compacte weergave","Maximaal info-dichtheid (kleinere slots)",s.ultra)}
      <label class="tgl"><span><b>Prijzen incl. btw tonen</b><small>In planning-kaartjes prijzen incl. btw in plaats van excl.</small></span><input type="checkbox" id="inclTonen" ${s.toonEx?"":"checked"}><i></i></label>
      ${sec("Onderhoud")}<p class="subt" style="margin:0">Ingeplande jobs zonder tijd staan bovenaan de dag onder 'Zonder tijd'. Reset zet ze terug naar 'Te plannen', zodat je ze opnieuw met een tijd kunt inplannen.</p>
      <button type="button" class="small" id="rstNt" style="align-self:flex-start" ${nz?"":"disabled"}>${I.refresh}Reset ${plural(nz,"job","jobs")} zonder tijd</button>`);
    $("#rstNt").onclick=async()=>{const l=actief().filter(k=>k.gepland&&!k.tijd);await runSeq(l,k=>save("klanten",k.id,{...strip(k),gepland:""}),plural(l.length,"job","jobs")+" terug naar te plannen");$("#rstNt").disabled=true};
    bindSave(()=>{const we=[...form.querySelectorAll("[data-we]")].filter(x=>x.checked).map(x=>Number(x.dataset.we));const p={werkdagen:[0,1,2,3,4,5,6].filter(d=>!we.includes(d)),toonEx:!$("#inclTonen").checked,kalTotMig:true};state.slot=Number(form.querySelector('[data-k="slotStd"]').value)||30;state.rowH=$("[data-k='ultra']").checked?.7:$("[data-k='compact']").checked?.85:1;return p});},
  gebruikers(){const u=state.u,me=state.me||{},owner=u&&u.isOwner?u.isOwner():true;
    setDlg({t:"Gebruikers & Rollen",sub:"Wie met Mansard mag werken",ic:"klanten",bg:"#3d4a5c"},`<div class="okbox" style="margin:0">${I.shield}<div><b>Rollen lopen via Delen</b><span>Collega's voeg je toe met de knop Delen bovenaan deze pagina. De rol die je daar kiest bepaalt wat iemand mag.</span></div></div>
      <div class="card" style="grid-template-columns:48px minmax(0,1fr) auto"><span class="av" style="--h:200">${esc(initials(me.name||S().naam||"Jij"))}</span><b>${esc(me.name||"Jij")} <span class="eyebrow" style="color:var(--brand)">jij</span></b><div class="meta">${esc(me.email||S().email||"")}</div><div class="side-col"><span class="pill late">${owner?"Eigenaar":"Gebruiker"}</span></div></div>
      <table class="minitable"><tr><td><b>Editor</b></td><td>Beheerder: alles bekijken en wijzigen</td></tr><tr><td><b>Contributor</b></td><td>Medewerker: planning, afmelden en klanten bijwerken</td></tr><tr><td><b>Viewer / Commenter</b></td><td>Alleen lezen, bijvoorbeeld je boekhouder</td></tr></table>
      ${info("Tip: geef je boekhouder de rol Viewer, dan kan hij alles inzien maar niets veranderen. Beperken per scherm kan Mansard niet; het is per rol voor de hele app.")}`,{wide:false,foot:`<button type="button" class="ghost" data-act="close">Sluiten</button><span class="sp"></span><span class="pill brand">${I.plus}Gebruiker toevoegen: knop Delen bovenaan</span>`});},
  abonnement(){const m=iso(today()).slice(0,7),jobs=state.beurten.filter(b=>String(b.datum).startsWith(m)).length,docs=COLS.reduce((a,c)=>a+(c==="instellingen"?4:c==="routes"?Object.keys(state.routes).length:state[c].length),0);
    setDlg({t:"Abonnement",sub:"Je plan en gebruik",ic:"card",bg:"#23845a"},`<div class="planhero"><div><span class="eyebrow">Huidig plan</span><b>Mansard</b></div><div style="text-align:right"><b>€ 0</b><small>/maand</small></div><div class="ph-row"><span>Status<br><b>Actief</b></span><span>Draait in<br><b>je Claude-account</b></span></div></div>
      ${sec("Gebruik deze maand")}${[["Klanten",state.klanten.length,null],["Jobs deze maand",jobs,null],["Opslag",docs,25000]].map(([l,n,mx])=>`<div class="usage"><div><b>${l}</b><span class="mono">${n}${mx?" / "+mx.toLocaleString("nl-NL"):""}</span></div><i><b style="width:${mx?Math.max(1,n/mx*100):100}%"></b></i></div>`).join("")}
      <div class="box">${sec("In dit plan")}${["Onbeperkt klanten en jobs (tot 25.000 records)","Planning, route, offertes en facturen","Delen met collega's via Delen","Werkt op telefoon en computer"].map(x=>`<div class="incl">${I.check}${x}</div>`).join("")}</div>`,{wide:false,foot:`<span class="sp"></span><button type="button" class="primary" data-act="close">Sluiten</button>`});},
  pwa(){setDlg({t:"PWA & App",sub:"Mansard op je telefoon",ic:"phone",bg:"#2a8bd1"},`${sec("App")}<div class="infobox">${I.phone}<span><b>Telefoon:</b> open deze pagina in de Claude-app, of zet de link via het deel-icoon van je browser op je beginscherm.<br><b>Computer:</b> zet de pagina in je bladwijzers of pin hem vast in Claude.</span></div>
      ${sec("Meldingen")}<div class="warnbox">${I.bell}<span>Pushmeldingen kan Mansard niet sturen. Alles wat klaarstaat zie je aan de rode bolletjes in het menu.</span></div>
      ${sec("Gegevens")}<div class="okbox" style="margin:0">${I.check}<div><b>Gegevens worden live bijgewerkt</b><span>Wijzigingen van collega's verschijnen vanzelf.</span></div></div>
      <button type="button" class="small" data-act="refresh" style="align-self:stretch">${I.refresh}Scherm verversen</button>`,{wide:false,foot:`<span class="sp"></span><button type="button" class="primary" data-act="close">Sluiten</button>`});},
  wachtwoord(){setDlg({t:"Beveiliging",sub:"Inloggen en toegang",ic:"shield",bg:"#c0392b"},`<div class="infobox">${I.lock}<span>Mansard heeft geen eigen wachtwoord: je logt in met je Claude-account. Je wachtwoord en tweestapsverificatie beheer je daar, bij je accountinstellingen.</span></div>
      ${info("Wie de pagina mag openen, bepaal jij met de knop Delen bovenaan. Haal iemand daar weg en hij kan er direct niet meer in.")}`,{wide:false,foot:`<span class="sp"></span><button type="button" class="primary" data-act="close">Sluiten</button>`});},
  meldingen(){setDlg({t:"Meldingen",sub:"Wat je ziet als er iets te doen is",ic:"bell",bg:"#c0392b"},`<div class="warnbox">${I.alert}<span>Pushmeldingen, meldingen per mail of sms aan jezelf kan Mansard niet sturen: daar is een server voor nodig. Wat wel kan: rode bolletjes in het menu en een dagoverzicht op Vandaag.</span></div>
      ${sec("Bolletjes in het menu")}${tgl("bolPlanning","Planning","Aantal klanten dat te laat is",s.bolPlanning!==false)}${tgl("bolFacturen","Facturen","Aantal achterstallige facturen",s.bolFacturen!==false)}${tgl("bolComm","Communicatie","Berichten die klaarstaan om te versturen",s.bolComm!==false)}
      ${sec("Dagelijks overzicht")}${tgl("dagOverzicht","Dagelijks overzicht op Vandaag","Omzet vandaag, openstaande facturen en klussen van morgen, vanaf het tijdstip hieronder.",s.dagOverzicht!==false)}
      <div class="grid2">${inp("overzichtTijd","Tijdstip",s.overzichtTijd||"18:00",{type:"time"})}<span class="subt" style="align-self:end;padding-bottom:12px">Europe/Amsterdam</span></div>`,{wide:false});bindSave();},
  diensten(){let L=dienstLijst().map(d=>({...d}));
    const draw=()=>{$("#dsB").innerHTML=`${sec("Bestaande diensten ("+L.length+")")}${L.map((d,i)=>`<div class="drow"><label>Naam<input data-di="${i}" data-f="naam" value="${esc(d.naam)}"></label><label>Prijs €<input type="number" step="0.5" data-di="${i}" data-f="prijs" value="${esc(d.prijs)}"></label><label>Min<input type="number" step="5" data-di="${i}" data-f="duur" value="${esc(d.duur)}"></label><button type="button" class="small ghost danger" data-drm="${i}" aria-label="Verwijder">${I.trash}</button></div>`).join("")}
      ${sec("Nieuwe dienst toevoegen")}<div class="drow"><label>Naam<input id="dnN" placeholder="bv. Zonnepanelen reinigen"></label><label>Prijs €<input id="dnP" type="number" step="0.5" value="25"></label><label>Minuten<input id="dnM" type="number" step="5" value="60"></label><button type="button" class="small primary" id="dnAdd">${I.plus}Toevoegen</button></div>
      <small class="help">Kies je een dienst bij een klant of nieuwe job, dan worden prijs en duur ingevuld. Prijzen per raam of m² stel je in bij de Calculator.</small>`;
      $("#dnAdd").onclick=()=>{const n=$("#dnN").value.trim();if(!n){$("#dnN").focus();return}L.push({naam:n,prijs:Number($("#dnP").value)||0,duur:Number($("#dnM").value)||60});draw()}};
    setDlg({t:"Diensten beheer",sub:"Bekijk, bewerk en voeg diensten toe",ic:"wrench",bg:"#1f8a7a"},`<div id="dsB"></div>`,{wide:true});draw();
    $("#dsB").addEventListener("input",e=>{const i=e.target.dataset.di;if(i==null)return;const f=e.target.dataset.f;L[i][f]=f==="naam"?e.target.value:Number(e.target.value)||0});
    $("#dsB").addEventListener("click",e=>{const b=e.target.closest("[data-drm]");if(b){L.splice(Number(b.dataset.drm),1);draw()}});
    form.onsubmit=async e=>{e.preventDefault();if(await saveSettings({diensten:L.filter(d=>d.naam.trim())},"Diensten opgeslagen")){dlg.close();schedule()}};},
  website(){const c=SETCARDS.find(x=>x.id==="website");const wa0=s.webWa||waNr(s.telefoon);
    setDlg(c,`${info("De <b>dienstenwebshop</b>: een losse pagina voor je eigen website. Klanten maken foto's, tikken de ramen aan en zien direct hun prijs per beurt, zonder tijden en zonder prijs per raam."+(LIVE?" De aanvraag komt <b>automatisch in je CRM</b> als nieuwe klant met opdracht, en je krijgt er een mail van.":" De aanvraag komt bij jou binnen per e-mail of WhatsApp."))}
      ${sec("Wat er in komt")}<div class="okbox" style="margin:0">${I.check}<div><b>${s.logo?"Je logo uit Bedrijf &amp; Branding":"Je bedrijfsnaam (nog geen logo ingesteld)"}</b><span>Bovenaan in het midden. Tarieven, staffelkorting en minimumprijs komen uit de Calculator. Aanvragen gaan naar ${esc(s.email||"je e-mailadres (stel dit in bij Bedrijf & Branding)")}.</span></div></div>
      <div class="wg-kaartje" id="webGebKaart">${wgKaartje()}</div>
      ${inp("webPostcodes","Extra postcodes",s.webPostcodes||"",{ph:"9700-9999, 8400-8499",help:"Extra postcodes bovenop je klanten en getekende gebieden: 4 cijfers of reeksen, gescheiden door komma's."})}<div class="grid2">${inp("webWa","WhatsApp-nummer voor aanvragen",wa0,{ph:"31612345678"})}${inp("webUrl","Adres van de dienstenwebshop op je website",s.webUrl||"",{ph:"https://www.jouwsite.nl/calculator.html"})}</div>
      ${inp("webVoorwaarden","Link naar je algemene voorwaarden",s.webVoorwaarden||"",{ph:"https://www.jouwsite.nl/voorwaarden",help:"Onder de knop Indienen staat dat de prijs na de tellingcontrole bij het eerste bezoek kan veranderen, met een link naar je voorwaarden. Leeg = zonder link."})}
      <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="primary" id="webView">${I.eye}Calculator bekijken</button><button type="button" id="webDl">${I.dl}Calculator downloaden (HTML)</button><button type="button" id="webFr">${I.dl}Voor Framer downloaden</button></div>
      ${sec("Complete website")}<div class="grid2">${inp("webScore","Google-score bovenaan de website",s.webScore??"4,8",{ph:"4,8",help:"Leeg = in plaats daarvan je werkgebied tonen."})}${inp("webReviewUrl","Link naar je Google-reviews",s.webReviewUrl||"https://www.google.com/search?q=mijnschoonmaker.com+Reviews",{ph:"https://g.page/…"})}</div><div class="okbox" style="margin:0">${I.globe||I.check}<div><b>Een hele website met de dienstenwebshop erin</b><span>Met je logo, gegevens, WhatsApp-knop, werkwijze, voordelen, klantportaal, vragen en contact. In Framer plak je één code-blok en ben je klaar.</span></div></div>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="primary" id="siteView">${I.eye}Website bekijken</button><button type="button" id="siteFr">${I.dl}Website voor Framer downloaden</button><button type="button" id="siteDl">${I.dl}Als HTML downloaden</button></div>
      <small class="help"><b>Zo zet je hem in Framer:</b> 1. Maak een nieuw project. 2. Assets › Code › + › New component, vervang alle voorbeeldcode door de inhoud van het gedownloade bestand en sla op. 3. Sleep <b>Website</b> op de Home-pagina, zet Width op Fill en Height op Fit. 4. Publish en koppel mijnschoonmaker.com bij Site Settings › Domains.</small>
      <small class="help"><b>Framer:</b> open het gedownloade tekstbestand, kopieer alles, ga in Framer naar Assets › Code › + › New component, vervang de voorbeeldcode door wat je kopieerde, sla op en sleep PrijsCalculator op je pagina (Width: Fill, Height: Fit). <b>Andere website:</b> upload het HTML-bestand (bijvoorbeeld als calculator.html). Verander je later je logo of tarieven, download hem dan opnieuw en vervang het bestand.</small>
      ${sec("In een bestaande pagina plaatsen")}<pre class="embedcode" id="webCode"></pre>
      <button type="button" class="small" id="webCopy" style="align-self:flex-start">${I.copy||""}Code kopiëren</button>`,{wide:true});
    const code=()=>{const u=form.querySelector('[data-k="webUrl"]').value;return `<iframe src="${u.trim()||"https://www.jouwsite.nl/calculator.html"}" style="width:100%;min-height:1400px;border:0" allow="camera" loading="lazy"></iframe>`};
    const drawCode=()=>{$("#webCode").textContent=code()};drawCode();form.querySelector('[data-k="webUrl"]').addEventListener("input",drawCode);
    $("#webCopy").onclick=()=>copy(code(),$("#webCopy"));
    {const wb=()=>{const k=$("#webGebKaart");if(k){k.innerHTML=wgKaartje();const b=k.querySelector("[data-wgopen]");if(b)b.onclick=()=>werkgebiedEditor(wb)}};wb()}
    $("#webView").onclick=async()=>{const b=$("#webView");b.disabled=true;try{const wa=String(form.querySelector('[data-k="webWa"]').value||"").replace(/\D/g,"");webCalcVoorbeeld(await klantCalcHtml(wa))}catch(e){err(e)}finally{b.disabled=false}};
    $("#webDl").onclick=async()=>{const b=$("#webDl");b.disabled=true;try{const wa=String(form.querySelector('[data-k="webWa"]').value||"").replace(/\D/g,"");await saveFile("prijscalculator.html",await klantCalcHtml(wa),"Calculator gedownload")}finally{b.disabled=false}};
    const siteBtn=(id,f)=>{$(id).onclick=async()=>{const b=$(id);b.disabled=true;try{await f(await websiteDelen())}catch(e){err(e)}finally{b.disabled=false}}};
    siteBtn("#siteView",p=>websiteVoorbeeld(websiteHtml(p,true)));
    siteBtn("#siteFr",p=>saveFile("Website-framer.txt",websiteFramer(p),"Website voor Framer gedownload"));
    siteBtn("#siteDl",p=>saveFile("website.html",websiteHtml(p,false),"Website gedownload"));
    $("#webFr").onclick=async()=>{const b=$("#webFr");b.disabled=true;try{const wa=String(form.querySelector('[data-k="webWa"]').value||"").replace(/\D/g,"");const h=await klantCalcHtml(wa);await saveFile("PrijsCalculator-framer.txt",FRAMER_TPL.replace("__HTML__",()=>JSON.stringify(h)),"Framer-component gedownload")}finally{b.disabled=false}};
    bindSave();},
  async webview(){try{const wa=String(s.webWa||waNr(s.telefoon)||"").replace(/\D/g,"");webCalcVoorbeeld(await klantCalcHtml(wa))}catch(e){err(e)}},
  bulkprijs(){openBulkPrijs()},
  bulkduur(){openBulkDuur()},
  };
  (D[id]||(SETEXTRA[id]&&(()=>SETEXTRA[id](c,s)))||(()=>toast("Onbekende instelling")))();
}
function openMailPreview(s,los){
  const y=today().getFullYear(),f={soort:"factuur",nummer:"FACT-"+y+"-DEMO",datum:iso(today()),verval:iso(addDays(today(),Number(s.termijn)||30)),regels:[{omschrijving:"Glazenwasbeurt — voorgevel",aantal:1,prijs:85},{omschrijving:"Dakgoot reinigen",aantal:1,prijs:60.5}],btw:21,incl:true};
  const old=state.settings;state.settings={...old,...s};
  const v={...sampleVars(),klant:"Voorbeeld Klant",factuurnummer:f.nummer,bedrag:eur(totals(f).inc),factuurdatum:fmtL(f.datum),vervaldatum:fmtL(f.verval)};
  const T=tpls().factuur,html=mailFor("factuur",v,T.mail,{f,preview:true}),subj=fill(T.onderwerp,v);
  state.settings=old;
  openDlg(`<div class="dlg-head"><span class="objic" style="background:var(--brand-soft);color:var(--brand)">${I.mail}</span><div style="flex:1;min-width:0"><h3 style="font-size:19px">${esc(subj)}</h3><div class="subt">Aan: voorbeeld@klant.nl · van: ${esc(s.naam||"je bedrijf")}${s.email?" &lt;"+esc(s.email)+"&gt;":""}</div></div><button type="button" class="iconbtn" id="pvX" aria-label="Sluiten">${I.x}</button></div>
  <div class="mailprev" style="max-height:62vh">${html}</div>
  <div class="row"><span class="subt" style="flex:1;font-size:13px">Demo-data — echte facturen gebruiken klant- en factuurgegevens. Stijl en accentkleur kies je bij Communicatie › E-mail opmaak.</span><button type="button" class="primary" id="pvBack">Sluiten</button></div>`,{wide:true});
  $("#pvBack").onclick=$("#pvX").onclick=()=>los?dlg.close():openSetEdit("bedrijf");
}
function scopeHtml(){const ds=[...new Set(actief().map(k=>k.dienst||"Glasbewassing"))];
  return `${sec("Welke klanten?")}<div class="grid2"><label>Ronde<select id="bsR"><option value="">Alle rondes</option>${rondes().map(r=>`<option>${esc(r)}</option>`).join("")}</select></label><span></span>
  <label>Aangemaakt na<input type="date" id="bsNa"><small class="help">Negeer klanten van vóór deze datum</small></label><label>Aangemaakt voor<input type="date" id="bsVo"><small class="help">Negeer klanten van na deze datum</small></label></div>
  <label>Filter op dienst (optioneel)</label><div class="chips" style="margin:0">${ds.map(d=>`<label class="chipchk"><input type="checkbox" data-bd="${esc(d)}"><span>${esc(d)}</span></label>`).join("")}</div><small class="help">Alleen geselecteerde diensten worden aangepast. Leeg = alle diensten.</small>`}
function scopeKlanten(){const r=$("#bsR").value,na=$("#bsNa").value,vo=$("#bsVo").value,ds=[...form.querySelectorAll("[data-bd]")].filter(x=>x.checked).map(x=>x.dataset.bd);
  return actief().filter(k=>(!r||k.ronde===r)&&(!ds.length||ds.includes(k.dienst||"Glasbewassing"))&&(!na||(k.aangemaakt||"")>=na)&&(!vo||(k.aangemaakt||"9999")<=vo))}
function openBulkPrijs(){
  setDlg({t:"Bulk prijswijziging",sub:"Verhoog of verlaag de prijs per beurt",ic:"trend",bg:"#e0822c"},`<div class="warnbox">${I.alert}<span>Wijzigt de prijs per beurt van vaste klanten. Bestaande facturen en offertes blijven onveranderd.</span></div>
    <div class="grid2"><label>Richting<select id="bpDir"><option value="1">Verhogen</option><option value="-1">Verlagen</option></select></label><label>Type<select id="bpType"><option value="pct">Percentage (%)</option><option value="eur">Vast bedrag (€)</option></select></label>
    <label class="full"><span id="bpLbl">Percentage (%)</span><input type="number" step="0.1" min="0" id="bpVal" placeholder="bijv. 5" required></label></div>
    <label class="tgl"><span><b>Afronden</b><small>Eindprijzen afronden zodat €18,97 → €19,00</small></span><select id="bpRound" style="width:auto"><option value="1">Hele euro</option><option value="0.5">Halve euro</option><option value="0">Niet afronden</option></select></label>
    ${scopeHtml()}<div class="box" id="bpPrev"></div>`,{wide:false,foot:`<button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="submit" class="primary" id="bpGo">Verhogen</button>`});
  const calc=k=>{const v=Number($("#bpVal").value)||0,dir=Number($("#bpDir").value),p=Number(k.prijs)||0;let n=$("#bpType").value==="pct"?p*(1+dir*v/100):p+dir*v;const rd=Number($("#bpRound").value);if(rd)n=Math.round(n/rd)*rd;return Math.max(0,r2(n))};
  const prev=()=>{$("#bpLbl").textContent=$("#bpType").value==="pct"?"Percentage (%)":"Bedrag (€)";$("#bpGo").textContent=$("#bpDir").value==="1"?"Verhogen":"Verlagen";const ks=scopeKlanten();const oud=ks.reduce((a,k)=>a+(Number(k.prijs)||0)*365/freqDays(k),0),nw=ks.reduce((a,k)=>a+calc(k)*365/freqDays(k),0);
    $("#bpPrev").innerHTML=`${sec("Voorbeeld")}<p class="subt" style="margin:0 0 8px">${plural(ks.length,"klant","klanten")} · jaaromzet ${eur0(oud)} → <b>${eur0(nw)}</b></p><table class="minitable">${ks.slice(0,5).map(k=>`<tr><td>${esc(cleanName(k.naam))}</td><td class="r">${eur(k.prijs)} → <b>${eur(calc(k))}</b></td></tr>`).join("")}</table>`};
  form.addEventListener("input",prev);form.addEventListener("change",prev);prev();
  form.onsubmit=async e=>{e.preventDefault();if(!Number($("#bpVal").value)){$("#bpVal").focus();return}const ks=scopeKlanten();$("#bpGo").disabled=true;await runSeq(ks,k=>save("klanten",k.id,{...strip(k),prijs:calc(k)}),"Prijs aangepast bij "+plural(ks.length,"klant","klanten"));dlg.close()};
}
function openBulkDuur(){
  setDlg({t:"Bulk duur aanpassen",sub:"Pas de geschatte duur van vaste klanten aan",ic:"clock",bg:"#1f8a9a"},`${info("Past de duur per beurt aan. Die bepaalt hoe lang een job in de planning staat en hoeveel uur je dag telt.")}
    <label>Nieuwe duur (min)<input type="number" id="bdV" min="5" max="600" step="5" placeholder="bv. 30" required><small class="help">Tussen 5 en 600 minuten</small></label>
    <label class="tgl"><span><b>Ook ingeplande jobs bijwerken</b><small>Geldt ook voor klanten die al op een dag staan</small></span><input type="checkbox" id="bdIn" checked><i></i></label>
    ${scopeHtml()}<p class="subt" id="bdN" style="margin:0"></p>`,{wide:false,foot:`<button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="submit" class="primary" id="bdGo">Aanpassen</button>`});
  const cnt=()=>{const ks=scopeKlanten().filter(k=>$("#bdIn").checked||!k.gepland);$("#bdN").textContent=plural(ks.length,"klant wordt","klanten worden")+" aangepast"};form.addEventListener("change",cnt);cnt();
  form.onsubmit=async e=>{e.preventDefault();const v=Number($("#bdV").value);if(!(v>=5&&v<=600)){$("#bdV").focus();return}const ks=scopeKlanten().filter(k=>$("#bdIn").checked||!k.gepland);$("#bdGo").disabled=true;await runSeq(ks,k=>save("klanten",k.id,{...strip(k),duur:v}),"Duur aangepast bij "+plural(ks.length,"klant","klanten"));dlg.close()};
}
/* bankafschrift */
let bank=null;
function openBank(){
  setDlg({t:"Bijschrijvingen",sub:"Bankafschrift inlezen en facturen afboeken",ic:"bank",bg:"#1f8a7a"},`${info("Download in je bankapp of internetbankieren je transacties als <b>CSV</b> (ING, Rabobank, ABN AMRO, bunq, Knab…). Mansard zoekt factuurnummers en bedragen en stelt voor welke facturen betaald zijn.")}
    <label>CSV-bestand van je bank<input type="file" id="bkF" accept=".csv,.txt,text/csv"></label><div id="bkRes"></div>`,{foot:`<button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="button" class="primary" id="bkGo" disabled>Afboeken</button>`});
  $("#bkF").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>bankMatch(String(rd.result));rd.readAsText(f)};
  $("#bkGo").onclick=async()=>{const sel=bank.filter((m,i)=>form.querySelector(`[data-bk="${i}"]`)?.checked);$("#bkGo").disabled=true;
    await runSeq(sel,async m=>{const f=m.f;await save("facturen",f.id,{...strip(f),status:"betaald",betaaldOp:m.datum||iso(today()),betaaldTs:m.datum?m.datum+"T12:00:00.000Z":new Date().toISOString(),betaalwijze:"overmaken"});for(const b of state.beurten.filter(b=>b.gefactureerd===f.id))await save("beurten",b.id,{...strip(b),betaald:true})},plural(sel.length,"factuur","facturen")+" afgeboekt als betaald");dlg.close()};
}
function bankMatch(text){
  const rows=parseCSV(text);if(rows.length<2){$("#bkRes").innerHTML='<div class="notice">Geen transacties gevonden in dit bestand.</div>';return}
  const head=rows[0].map(h=>String(h).toLowerCase()),fi=re=>head.findIndex(h=>re.test(h));
  const iA=fi(/^bedrag|amount|transactiebedrag|bedrag \(eur\)/),iD=fi(/af.?bij|debet.?credit|credit.?debet/),iT=fi(/datum|date/);
  const open=facturen().filter(f=>["Openstaand","Achterstallig"].includes(fStatus(f)[1]));const used=new Set();bank=[];
  rows.slice(1).forEach(r=>{let a=parseNum(iA>-1?r[iA]:"");const dir=iD>-1?String(r[iD]).toLowerCase():"";if(/^af|debit|^d$/.test(dir))return;if(a<=0)return;
    const txt=r.join(" ").toLowerCase(),flat=txt.replace(/\s/g,""),datum=parseDate(iT>-1?r[iT]:"")||(String(r[iT]||"").match(/^\d{8}$/)?String(r[iT]).replace(/(\d{4})(\d{2})(\d{2})/,"$1-$2-$3"):"");
    let best=null;for(const f of open){if(used.has(f.id))continue;const inc=totals(f).inc,nm=cleanName(f.klantNaam).toLowerCase().split(/\s+/).filter(w=>w.length>2&&!/^fam/.test(w));
      let sc=0;if(flat.includes(String(f.nummer).toLowerCase().replace(/\s/g,"")))sc=3;else if(Math.abs(inc-a)<.01&&nm.some(w=>txt.includes(w)))sc=2;else if(Math.abs(inc-a)<.01)sc=1;
      if(sc&&(!best||sc>best.sc))best={f,sc}}
    if(best){used.add(best.f.id);bank.push({f:best.f,sc:best.sc,a,datum,txt:r.filter(x=>String(x).length>3).slice(0,4).join(" · ")})}});
  $("#bkRes").innerHTML=bank.length?`${sec(plural(bank.length,"mogelijke match","mogelijke matches"))}<div class="tablewrap" style="box-shadow:none"><table class="t" style="min-width:560px"><thead><tr><th></th><th>Factuur</th><th>Klant</th><th class="r">Bedrag</th><th>Zekerheid</th></tr></thead><tbody>${bank.map((m,i)=>`<tr><td><input type="checkbox" data-bk="${i}" ${m.sc>=2?"checked":""}></td><td class="mono">${esc(m.f.nummer)}</td><td>${esc(cleanName(m.f.klantNaam))}<br><small class="subt">${esc(m.txt.slice(0,70))}</small></td><td class="r amt">${eur(m.a)}</td><td>${m.sc===3?statusPill("ok","Factuurnummer"):m.sc===2?statusPill("soon","Bedrag + naam"):statusPill("neutral","Alleen bedrag")}</td></tr>`).join("")}</tbody></table></div>`
    :`<div class="notice">Geen bijschrijvingen gevonden die passen bij je ${plural(open.length,"openstaande factuur","openstaande facturen")}.</div>`;
  $("#bkGo").disabled=!bank.length;
}
/* overslaan */
function openSkip(id){
  const k=state.klanten.find(x=>x.id===id);if(!k)return;const R=S().skipRedenen||[];
  const IC={"Klant niet thuis":I.user,"Slecht weer":I.cloud||I.alert,"Ziekte/personeelsuitval":I.heart||I.alert,"Klant uitgesteld":I.clock,"Defecte apparatuur":I.wrench,"Overig":I.dots||I.note};
  openDlg(`<div class="ow-kop jp-kop ow-soon"><div class="jp-kr1"><span class="jp-st"><i></i>Overslaan</span><span class="sp"></span><button type="button" class="jp-ib" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="jp-kr2"><span class="jp-k1"><small>${["zo","ma","di","wo","do","vr","za"][today().getDay()]} ${today().getDate()} ${["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][today().getMonth()]}</small><b>${esc(k.tijd||"–")}</b></span><span class="jp-k2"><b>${esc(cleanName(k.naam))}</b><em>${I.pin}${esc(jobAddr(k))}</em></span><span class="jp-k3"><small>Bedrag</small><b>${eur(toon(k.prijs))}</b><em>niet gewassen</em></span></div></div>
  <div class="sk-sec"><span class="eyebrow">${I.alert}Reden</span><div class="sk-redenen">${R.map((r,i)=>`<label class="sk-reden"><input type="radio" name="skr" value="${esc(r)}" ${i===0?"checked":""}><span>${IC[r]||I.note}<b>${esc(r==="Ziekte/personeelsuitval"?"Ziekte of uitval":r)}</b></span></label>`).join("")}</div></div>
  <div class="sk-sec"><span class="eyebrow">${I.planning}Wanneer weer aanbieden?</span><div class="sk-wanneer" role="group">${[["0","Morgen al",""],["1","Over 1 week",""],["int","Volgend interval","over "+intervalTxt(k)+" · aanbevolen"]].map(([v,l,s],i)=>`<label class="sk-w"><input type="radio" name="skW" value="${v}" ${v==="int"?"checked":""}><span><b>${l}</b>${s?`<small>${esc(s)}</small>`:""}</span></label>`).join("")}</div></div>
  <label>Notitie (optioneel)<input id="skN" placeholder="Bijv. hond los in de tuin"></label>
  <div class="row stickyfoot"><button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="submit" class="primary" id="skGo">${I.right}Overslaan</button></div>`);
  form.onsubmit=async e=>{e.preventDefault();const r=(form.querySelector('input[name="skr"]:checked')||{}).value||"Overgeslagen",w=(form.querySelector('input[name="skW"]:checked')||{}).value||"int",n=$("#skN").value.trim();
    const tot=w==="0"?addDays(today(),1):w==="1"?addDays(today(),7):addDays(today(),freqDays(k));
    const prev={gepland:k.gepland||"",tijd:k.tijd||"",skipTot:k.skipTot||"",log:k.log||[]};
    try{await save("klanten",k.id,{...strip(k),gepland:"",tijd:"",bezig:"",skipTot:iso(tot),log:[...(k.log||[]),{datum:iso(today()),tekst:"Overgeslagen: "+r+(n?" · "+n:"")}]});dlg.close();
      toast(cleanName(k.naam)+" overgeslagen, weer aangeboden vanaf "+fmtD(tot),()=>save("klanten",k.id,{...strip(k),...prev}))}catch(er){err(er)}};
}


/* website-calculator: zelfde rekentool voor klanten, met logo, gegevens en tarieven uit Mansard */
const waNr=t=>{let d=String(t||"").replace(/\D/g,"");if(d.startsWith("00"))d=d.slice(2);else if(d.startsWith("0"))d="31"+d.slice(1);return d};
async function klantCalcHtml(wa){const s=S();if(!RC)RC=buildRamen();const c=RC.cfgAll(),lg=await loadLogo();
  const cfg={g0_p:c.g0_p,g1_p:c.g1_p,g2_p:c.g2_p,g3_p:c.g3_p,tuimel_p:c.tuimel_p,lood_p:c.lood_p,koepel_p:c.koepel_p,mini_p:c.mini_p,start:c.start||0,min:c.min,tiers:c.tiers,tb:c.tb||{},wg:c.wg||{},fp:c.fp||{}};
  const B={naam:s.naam||"Glasbewassing",email:s.email||"",whatsapp:wa||waNr(s.telefoon),logo:lg?await kleinLogo(lg.url):"",endpoint:LIVE?location.origin+"/api/aanvraag"+(window.ZEEM_BID&&window.ZEEM_BID!=="mijnschoonmaker"?"?b="+window.ZEEM_BID:""):"",werkgebied:String((form&&form.querySelector('[data-k="webPostcodes"]')||{}).value??s.webPostcodes??"").trim(),gebieden:wgVoorCalc(),klantPc:wgKlantPcAan()?wgKlantPc().join(","):"",voorwaarden:String((form&&form.querySelector('[data-k="webVoorwaarden"]')||{}).value??s.webVoorwaarden??"").trim()};
  const fla=RC.freqList().filter(f=>f.aan!==false),fadv=(fla.find(f=>f.adv)||fla.find(f=>f.k==="m8")||fla[0]||{}).k||"m8";const fl="const FREQ_LIST="+JSON.stringify(fla.map(f=>[f.k,f.l,f.w?52/f.w:1,Number(f.p)||0,f.w||0]))+";\nconst FREQ_ADV="+JSON.stringify(fadv)+";\n";
  const conf=`/*CFG-START*/\nconst BEDRIJF=${JSON.stringify(B)};\nconst VAT=${(Number(s.btw)||21)/100};\nconst cfg=${JSON.stringify(cfg)};\n${fl}`;
  return KC_TPL.slice(0,KC_TPL.indexOf("/*CFG-START*/"))+conf+KC_TPL.slice(KC_TPL.indexOf("/*CFG-END*/")).split('${k==="m8"?" selected":""}').join('${k===FREQ_ADV?" selected":""}').split('g("freq").value==="m8"').join('g("freq").value===FREQ_ADV')}

/* volledige export: vast formaat (versie 1) voor back-up en de overstap naar een eigen server */
async function exportAlles(metBestanden){
  const col={};COLS.forEach(c=>col[c]=(RAW[c]||[]).map(d=>({...d})));
  let bestanden=[];try{if(state.assets){const r=await state.assets.list();bestanden=(r.assets||[]).map(a=>({id:a.id,type:a.contentType,bytes:a.sizeBytes}))}}catch(e){}
  if(metBestanden){let n=0;toast("Foto's en bestanden verzamelen… (0/"+bestanden.length+")");
    for(const b of bestanden){try{const r=await fetch(BLOB+b.id);if(r.ok){const bl=await r.blob();b.data=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(bl)})}}catch(e){}if(++n%10===0)toast("Foto's en bestanden verzamelen… ("+n+"/"+bestanden.length+")")}}
  const data={formaat:"zeem-export",versie:1,gemaakt:new Date().toISOString(),bron:"claude-artifact",bedrijf:S().naam||"",collecties:col,bestanden};
  await saveFile("zeem-backup-"+iso(today())+".json",JSON.stringify(data,null,1),"Back-up opgeslagen")}

/* logo verkleinen voor de website-calculator (scherp op retina, klein bestand) */
function kleinLogo(url){return new Promise(res=>{const im=new Image();im.onload=()=>{const m=240,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);try{res(c.toDataURL("image/png"))}catch(e){res(url)}};im.onerror=()=>res(url);im.src=url})}

/* website-calculator hier openen en gebruiken, zoals klanten hem op je website zien */
function webCalcVoorbeeld(html,titel,opt){webCalcVoorbeeld._recent=webCalcVoorbeeld._recent||new Set();
  const o=document.createElement("dialog");o.className="wcv-ov";
  o.innerHTML=`<div class="wcv"><div class="wcv-h"><span class="objic">${I.globe||I.eye}</span><div style="min-width:0;flex:1"><b>${titel||"Dienstenwebshop"}</b><small>Zo zien klanten ${titel?"je website":"hem op je website"}. Je kunt hem hier gewoon gebruiken.</small></div>
    <div class="seg wcv-seg"><button type="button" data-w="tel" class="${titel?"":"sel"}">Telefoon</button><button type="button" data-w="tab">Tablet</button><button type="button" data-w="pc" class="${titel?"sel":""}">Computer</button></div>
    <button type="button" class="iconbtn" data-wclose aria-label="Sluiten">${I.x}</button></div>
    <div class="wcv-b"><iframe class="wcv-f ${titel?"pc":"tel"}" title="Dienstenwebshop" allow="camera; clipboard-write"></iframe></div></div>`;
  const f=o.querySelector("iframe"),bron=String(html).replace(/<head([^>]*)>/i,m=>m+"<script>window.ZEEM_CRM=1"+(opt&&opt.direct?";window.ZEEM_DIRECT=1":"")+"<\/script>");
  /* direct in een leeg venster schrijven: werkt in Safari betrouwbaarder dan srcdoc of een blob-adres (die toonden de site soms zonder opmaak) */
  let bu="";const schrijf=()=>{try{const dd=f.contentDocument;if(!dd)throw 0;dd.open();dd.write(bron);dd.close();return true}catch(_){return false}};
  /* indienen in het voorbeeld: klant en opdracht komen meteen in het crm */
  const opMsg=async e=>{if(e.source!==f.contentWindow)return;const d=e.data||{};if(d.type!=="zeem-aanvraag")return;
    const reply=m=>{try{f.contentWindow.postMessage(m,"*")}catch(_){}};
    const D=leesAanvraag("ZEEM1:"+(d.code||""));if(!D){reply({type:"zeem-aanvraag-fout",tekst:"de aanvraag kon niet worden gelezen."});return}
    const dk=String(d.code||"").slice(0,400);if(webCalcVoorbeeld._recent.has(dk)){reply({type:"zeem-aanvraag-ok"});return}webCalcVoorbeeld._recent.add(dk);
    try{const k=D.formaat==="zeem.contact"?await contactToevoegen(D):await aanvraagToevoegen(D,d.fotos||[]);reply({type:"zeem-aanvraag-ok",id:k.id})}
    catch(er){console.error(er);reply({type:"zeem-aanvraag-fout",tekst:"opslaan in het crm lukte niet."})}};
  window.addEventListener("message",opMsg);
  const sluit=()=>{document.documentElement.classList.remove("nozm");if(bu)setTimeout(()=>URL.revokeObjectURL(bu),1000);try{o.close()}catch(_){}o.remove();document.removeEventListener("keydown",esc_,true);window.removeEventListener("message",opMsg)};
  o.addEventListener("cancel",e=>{e.preventDefault();sluit()});
  const esc_=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();sluit()}};document.addEventListener("keydown",esc_,true);
  o.addEventListener("click",e=>{if(e.target===o||e.target.closest("[data-wclose]")){sluit();return}const w=e.target.closest("[data-w]");if(w){o.querySelectorAll("[data-w]").forEach(x=>x.classList.toggle("sel",x===w));f.className="wcv-f "+w.dataset.w}});
  /* Safari tekent een iframe binnen de 90%-zoom van het CRM niet goed (wit vlak aan de zijkant): zolang het voorbeeld open is zonder zoom */
  document.documentElement.classList.add("nozm");
  document.body.appendChild(o);try{o.showModal()}catch(_){o.setAttribute("open","")}
  if(!schrijf())f.srcdoc=bron}

const websiteVoorbeeld=html=>webCalcVoorbeeld(html,"Website");
