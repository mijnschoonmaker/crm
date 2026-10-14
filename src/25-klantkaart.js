/* ---------- KLANTKAART: overzicht met blokken (zoals een klantdossier), per blok aanpassen ---------- */
const factAddr=k=>k&&k.fAdres?[k.fAdres,[k.fPostcode,k.fPlaats].filter(Boolean).join(" ")].filter(Boolean).join(", "):(k&&k.adres?fullAddr(k):jobAddr(k));
/* naar welk e-mailadres gaat wat: facturen, offertes of planningsmails (leeg = gewone e-mail) */
const mailK=(k,soort)=>{if(!k)return k;const m=soort==="factuur"?k.fEmail:soort==="offerte"?k.oEmail:soort==="planning"?k.pEmail:"";return m?{...k,email:m}:k};
const tavK=(k,soort)=>k?(soort==="factuur"?k.fTav:soort==="offerte"?k.oTav:soort==="planning"?k.pTav:"")||"":"";
function betaalgedrag(fs){
  const f=fs.filter(x=>x.soort!=="offerte"&&x.status!=="concept");
  const c={aanmaning:0,herinnering:0,optijd:0,open:0};
  f.forEach(x=>{const h=Number(x.herinneringen)||0,st=fStatus(x)[1];if(st==="Openstaand"||st==="Achterstallig"){c.open++;return}if(h>=2)c.aanmaning++;else if(h===1)c.herinnering++;else c.optijd++});
  const paid=f.filter(x=>x.status==="betaald"&&x.betaaldOp),gem=paid.length?Math.round(paid.reduce((a,x)=>a+Math.max(0,(parse(x.betaaldOp)-parse(x.datum))/DAY),0)/paid.length):null;
  return {c,gem,n:f.length,laatste:f.slice().sort((a,b)=>String(b.datum).localeCompare(String(a.datum))).slice(0,3)}}
/* betaalgedrag als nette kaart: ring met % op tijd, oordeel en vier tellers */
const PAYK={aanmaning:["#d9534f","Aanmaning"],herinnering:["#e0a030","Herinnering"],optijd:["#2bb673","Op tijd betaald"],open:["#5aa9c2","Openstaand"]};
function payBlok(bg){const c=bg.c,afg=c.optijd+c.herinnering+c.aanmaning,pct=afg?Math.round(c.optijd/afg*100):null,tot=afg+c.open;
  const [vk,vt]=c.aanmaning?["late","Aanmaning nodig geweest"]:c.herinnering?["soon","Soms een herinnering"]:afg?["ok","Betaalt netjes op tijd"]:c.open?["plan","Nog geen betalingen"]:["plan","Nog geen facturen"];
  const R=16,C=2*Math.PI*R;let off=0;const seg=tot?Object.keys(PAYK).filter(k=>c[k]).map(k=>{const L=c[k]/tot*C,gap=Object.keys(PAYK).filter(x=>c[x]).length>1?1.6:0,el=`<circle cx="21" cy="21" r="${R}" fill="none" stroke="${PAYK[k][0]}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${Math.max(.01,L-gap)} ${C}" stroke-dashoffset="${-off}"/>`;off+=L;return el}).join(""):"";
  return `<div class="pay"><div class="pay-h"><b>Betaalgedrag</b><span class="pay-v ${vk}">${vt}</span></div>
    <div class="pay-b"><div class="pay-r"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="${R}" fill="none" stroke="var(--surface-2)" stroke-width="5"/><g transform="rotate(-90 21 21)">${seg}</g></svg><span class="${pct==null?"leeg":""}">${pct==null?"nog":pct+"%"}<small>${pct==null?"niets betaald":"op tijd"}</small></span></div>
      <div class="pay-g">${Object.keys(PAYK).reverse().map(k=>`<div class="pay-c${c[k]?"":" nul"}" style="--c:${PAYK[k][0]}"><b>${c[k]}</b><span><i></i>${PAYK[k][1]}</span></div>`).join("")}</div></div>
    ${bg.gem!=null?`<p class="pay-f">Gemiddeld betaald binnen <b>${bg.gem} ${bg.gem===1?"dag":"dagen"}</b></p>`:""}</div>`}
function donut(c){const parts=[["late",c.aanmaning],["soon",c.herinnering],["ok",c.optijd],["plan",c.open]],tot=parts.reduce((a,p)=>a+p[1],0);
  if(!tot)return `<svg viewBox="0 0 42 42" class="kd-donut"><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--surface-3)" stroke-width="6"/></svg>`;
  let off=25;return `<svg viewBox="0 0 42 42" class="kd-donut">${parts.filter(p=>p[1]).map(([cl,n])=>{const L=n/tot*100,s=`<circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--${cl})" stroke-width="6" stroke-dasharray="${L} ${100-L}" stroke-dashoffset="${off}"/>`;off-=L;return s}).join("")}</svg>`}

function openKlantView(id,opt={}){
  if(state._kkLast!==id){state._kkLast=id;state.kkFQ="";state.kkFP=0}
  const k=state.klanten.find(x=>x.id===id);if(!k)return openKlantEdit(null);
  const nr=klantNr(k),fs=state.facturen.filter(f=>f.klantId===k.id).sort((a,b)=>String(b.datum).localeCompare(String(a.datum))),offs=fs.filter(f=>f.soort==="offerte"),facs=fs.filter(f=>f.soort!=="offerte");
  const hist=state.beurten.filter(b=>b.klantId===k.id).sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));
  const bg=betaalgedrag(fs),msgs=state.berichten.filter(m=>m.klantId===k.id).sort((a,b)=>String(b.op).localeCompare(String(a.op)));
  const kv=(a,b)=>`<div class="ow-kv"><span>${a}</span><b>${b||"—"}</b></div>`;
  const mail=e=>e?`<a href="mailto:${esc(e)}">${esc(e)}</a>`:"",tel=t=>t?`<a href="tel:${esc(String(t).replace(/[^\d+]/g,""))}">${esc(t)}</a>`:"";
  const pen=(act,lbl)=>`<button type="button" class="iconbtn sm" data-kk="${act}" aria-label="${lbl}" title="${lbl}">${I.pencil}</button>`;
  const plus=(act,lbl,extra="")=>`<button type="button" class="iconbtn sm primary" ${act.startsWith("data-")?act:`data-kk="${act}"`} ${extra} aria-label="${lbl}" title="${lbl}">${I.plus}</button>`;
  const PER=Number(state.kkPP)||5,fq=String(state.kkFQ||"").toLowerCase(),facsF=fq?facs.filter(f=>[f.nummer,f.datum,fmtNum(f.datum),fStatus(f)[1],String(totals(f).inc.toFixed(2)).replace(".",",")].join(" ").toLowerCase().includes(fq)):facs,fpages=Math.max(1,Math.ceil(facsF.length/PER)),fPage=Math.min(fpages-1,Math.max(0,state.kkFP||0));
  const openF=facs.filter(f=>["Openstaand","Achterstallig"].includes(fStatus(f)[1]));
  const showArch=!!state.kkArch;
  const opdr=[...(k.opdrachtVerwijderd?[]:[{id:"main",nr:nr+"-1",dienst:(k.dienst||"Glasbewassing"),prijs:r2((Number(k.prijs)||0)*(1+(Number(k.toeslag)||0)/100)),frequentie:k.frequentie||4,info:k.prospect?["soon","Wacht op akkoord"]:k.actief===false?["neutral","Gestopt"]:k.gepland?["ok","Ingepland "+fmtD(k.gepland)]:["late","Te plannen"],per:isPeriodiek(k)}]),
    ...extraOpdr(k).map((o,i)=>({id:o.id,nr:nr+"-"+(i+2),dienst:o.dienst,prijs:o.prijs,frequentie:o.frequentie,info:o.actief===false?["neutral","Uit"]:["neutral",o.volgende?"Volgende "+fmtD(o.volgende):"Bij volgende beurt"]}))];
  const locs=[{naam:k.locOms||"Hoofdadres",adres:k.adres,postcode:k.postcode,plaats:k.plaats,o:"main"},...(k.objecten||[]).map(o=>({naam:o.naam||"Object",adres:o.adres||k.adres,postcode:o.adres?o.postcode||"":k.postcode,plaats:o.adres?o.plaats||"":k.plaats,o:o.id}))];
  openDlg(`<div class="dlg-head"><span class="av" style="--h:${hue(k.ronde||k.naam)}">${esc(initials(k.naam))}</span><div style="min-width:0;flex:1"><h3>${esc(cleanName(k.naam))}</h3><div class="subt">Klant ${esc(nr)} · ${esc(fullAddr(k))}</div></div>
    ${k.nieuweKlant?`<span class="pill plan">Nieuwe klant</span>`:""}<span class="pill ${k.prospect?"soon":k.actief===false?"neutral":"ok"} dotp">${k.prospect?"Prospect":k.actief===false?"Inactief":"Actief"}</span><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  ${isOBeurt(k)?`<div class="hosp-top">${oBeurtBlok(k)}</div>`:""}<div class="hosp-top">${hospBlok(k)}</div>
  ${k.prospect?(()=>{const of=offs.find(f=>f.status!=="afgewezen"&&f.status!=="geaccepteerd");return of||offs.length?`<div class="banner"><div><b>Offerte${of?" "+esc(of.nummer):""} wacht op akkoord</b><br><small>Deze klant staat nog niet in de planning.</small></div>${of?`<button type="button" class="primary small" data-act="akkoord" data-id="${esc(of.id)}">Akkoord en inplannen</button>`:""}</div>`:`<div class="banner"><div><b>Nieuwe klant · nog geen offerte</b><br><small>Volgende stap: offerte maken. Na akkoord komt de klant in de planning.</small></div><button type="button" class="primary small" data-act="newofferte" data-id="${esc(k.id)}">${I.offertes}Offerte maken</button></div>`})():""}
  <div class="kk-grid kd"><div class="kk-left">
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Klantgegevens</b><span class="sp"></span>${pen("edit","Klantgegevens aanpassen")}</div>
      <a class="kd-map" href="${esc(mapsQ(k))}" target="_blank" rel="noopener" aria-label="Open in kaarten"><span class="kd-pin">${I.pin}</span><span><b>${esc(k.adres||"")}</b><small>${esc([k.postcode,k.plaats].filter(Boolean).join(" "))}</small></span><em>${I.nav}Route</em></a>
      ${kv("Klantnummer",esc(nr))}${kv("Type klant",k.soort==="zakelijk"?"Zakelijk":"Particulier")}${kv("Naam",esc(cleanName(k.naam)))}${k.contact?kv("Contactpersoon",esc(k.contact)):""}${k.geboortedatum?kv("Geboortedatum",esc(fmtL(k.geboortedatum))):""}
      ${kv("E-mailadres",mail(k.email))}${kv("Telefoon",tel(k.telefoon))}${k.mobiel?kv("Mobiel",tel(k.mobiel)):""}${k.website?kv("Website",`<a href="${esc(/^https?:/.test(k.website)?k.website:"https://"+k.website)}" target="_blank" rel="noopener">${esc(k.website)}</a>`):""}${k.iban?kv("IBAN",esc(k.iban)+(k.rekeninghouder?`<br><small class="subt">${esc(k.rekeninghouder)}</small>`:"")):""}${k.termijn?kv("Betalingstermijn",esc(k.termijn)+" dagen"):""}${kv("Klant sinds",k.aangemaakt?esc(fmtL(k.aangemaakt)):"")}${kv("Betaalwijze",k.incasso?"Automatische incasso":"Per bank")}${k.ronde?kv("Ronde",esc(k.ronde)):""}
      ${payBlok(bg)}
      ${bg.laatste.length?`<div class="kd-sub"><span class="eyebrow">Laatste ${bg.laatste.length} facturen</span>${bg.laatste.map(f=>{const st=fStatus(f),h=Number(f.herinneringen)||0;return `<span class="kd-li"><i style="background:var(--${st[1]==="Betaald"&&!h?"ok":st[1]==="Betaald"?"soon":st[0]==="late"?"late":"plan"})"></i>${esc(f.nummer)} · ${st[1]==="Betaald"?(h?"betaald na herinnering":"op tijd betaald"):esc(st[1].toLowerCase())}</span>`}).join("")}</div>`:""}
      <div class="kd-sub"><span class="eyebrow">Laatste ${Math.min(3,msgs.length)||""} berichten</span>${msgs.slice(0,3).map(m=>`<span class="kd-li"><i style="background:${({gelezen:"var(--ok)",geklikt:"var(--ok)",gekopieerd:"#3a94d6"})[mStat(m)]||"var(--muted)"}"></i>${esc(m.onderwerp||String(m.tekst||"").slice(0,60))} <small>${esc(fmtD(String(m.op).slice(0,10)))} · ${esc(KANAAL[m.kanaal]||m.kanaal||"")}</small></span>`).join("")||'<span class="subt">Nog geen berichten verstuurd.</span>'}
        ${msgs.length?`<button type="button" class="small" data-kk="berichten" style="align-self:flex-start;margin-top:4px">${I.send}Verzonden berichten (${msgs.length})</button>`:""}</div></section>
    ${kkPortaal(k)}
    <section class="kp"><div class="kp-h"><span class="objic">${I.klanten}</span><b>Contactpersonen</b><span class="sp"></span>${plus("contact","Contactpersoon toevoegen")}</div>
      ${(k.contacten||[]).length?`<table class="minitable">${k.contacten.map((c,i)=>`<tr><td><b>${esc(c.naam)}</b>${c.functie?`<br><small class="subt">${esc(c.functie)}</small>`:""}</td><td>${mail(c.email)}${c.email&&c.tel?"<br>":""}${tel(c.tel)}</td><td class="r" style="white-space:nowrap"><button type="button" class="iconbtn sm" data-kk="contact" data-i="${i}" aria-label="Aanpassen">${I.pencil}</button></td></tr>`).join("")}</table>`:'<p class="subt" style="margin:0">Er zijn geen contactpersonen.</p>'}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.pin}</span><b>Adresgegevens</b><span class="sp"></span>${pen("adres","Adresgegevens aanpassen")}</div>
      ${kv("Factuuradres",esc(factAddr(k))+(k.fAdres?"":` <small class="subt">(zelfde als hoofdadres)</small>`))}
      ${kv("Facturen gaan naar",mail(mailK(k,"factuur").email)+(tavK(k,"factuur")?`<br><small class="subt">t.a.v. ${esc(tavK(k,"factuur"))}</small>`:""))}
      ${kv("Offertes gaan naar",mail(mailK(k,"offerte").email)+(tavK(k,"offerte")?`<br><small class="subt">t.a.v. ${esc(tavK(k,"offerte"))}</small>`:""))}
      ${kv("Planningsmails gaan naar",mail(mailK(k,"planning").email)+(tavK(k,"planning")?`<br><small class="subt">t.a.v. ${esc(tavK(k,"planning"))}</small>`:""))}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.note}</span><b>Opmerkingen</b><span class="sp"></span>${pen("opm","Opmerkingen aanpassen")}</div>
      ${kv("Klantnotities",k.klantNotitie?esc(k.klantNotitie).replace(/\n/g,"<br>"):"")}${kv("Factuurinstructies",k.factuurInstructie?esc(k.factuurInstructie).replace(/\n/g,"<br>"):"")}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.upload}</span><b>Klantdocumenten</b><span class="sp"></span>${state.assets?`<label class="iconbtn sm primary" title="Document toevoegen" aria-label="Document toevoegen">${I.plus}<input type="file" hidden multiple id="kdDoc"></label>`:""}</div>
      ${(k.documenten||[]).length?`<table class="minitable">${k.documenten.map((d,i)=>`<tr><td><a href="${BLOB}${esc(d.id)}" target="_blank" rel="noopener"><b>${esc(d.naam)}</b></a><br><small class="subt">${esc(fmtD(d.datum))}${d.omschr?" · "+esc(d.omschr):""}</small></td><td class="r" style="white-space:nowrap"><a class="iconbtn sm" href="${BLOB}${esc(d.id)}" download="${esc(d.naam)}" aria-label="Downloaden">${I.dl}</a><button type="button" class="iconbtn sm" data-kk="docdel" data-i="${i}" aria-label="Verwijderen">${I.x}</button></td></tr>`).join("")}</table>`:`<p class="subt" style="margin:0">${state.assets?"Nog geen documenten. Voeg bijvoorbeeld een contract of een foto toe.":"Bestanden toevoegen kan hier niet."}</p>`}</section>
  </div><div class="kk-side">
    <section class="kp"><div class="kp-h"><span class="objic">${I.globe}</span><b>Locaties</b><span class="sp"></span>${plus(`data-act="obj" data-id="${esc(k.id)}" data-o=""`,"Locatie toevoegen")}</div>
      <table class="minitable kp-click">${locs.map(l=>`<tr data-act="obj" data-id="${esc(k.id)}" data-o="${esc(l.o)}" tabindex="0" role="button"><td><b>${esc(l.adres||"")}</b><br><small class="subt">${esc(l.naam)}</small></td><td>${esc(l.postcode||"")}</td><td>${esc(l.plaats||"")}</td><td class="r">${I.pencil}</td></tr>`).join("")}</table></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.checksq||I.check}</span><b>Opdrachten</b><span class="sp"></span>${!heeftGlas(k)?plus("opdrfirst","Opdracht toevoegen"):plus(`data-act="opdracht" data-id="${esc(k.id)}" data-o="new"`,"Opdracht toevoegen")}</div>
      ${opdr.length?`<div class="kd-ol">${opdr.map(o=>`<div class="kd-or" data-act="opdracht" data-id="${esc(k.id)}" data-o="${esc(o.id)}" tabindex="0" role="button"><div class="kd-or-m"><div class="kd-or-t"><b>${esc(o.dienst)}</b><span class="mono">#${esc(o.nr)}</span></div><small>${esc(jobAddr(k))}</small><div class="kd-or-p"><span class="pill ${o.info[0]}">${esc(o.info[1])}</span><span class="pill neutral">${I.refresh||""}${esc(freqLabel(o.frequentie).toLowerCase())}</span>${o.per?`<span class="pill plan">${I.receipt}Periodiek</span>`:""}</div></div><div class="kd-or-r"><b class="mono">${eur(o.prijs)}</b><span class="kd-oo"><button type="button" class="iconbtn sm" data-act="opdracht" data-id="${esc(k.id)}" data-o="${esc(o.id)}" aria-label="Opdracht aanpassen" title="Aanpassen">${I.pencil}</button><button type="button" class="iconbtn sm kd-del" data-act="opdrdel" data-id="${esc(k.id)}" data-o="${esc(o.id)}" aria-label="Opdracht verwijderen" title="Verwijderen">${I.x}</button></span></div></div>`).join("")}</div>`:`<p class="subt" style="margin:0">Nog geen opdracht. Een opdracht ontstaat zodra de klant akkoord geeft op een offerte, of via de calculator op je website.</p><button type="button" class="small primary" data-act="newofferte" data-id="${esc(k.id)}" style="align-self:flex-start">${I.offertes}Offerte maken</button>`}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.clock}</span><b>Overzicht ingeplande afspraken</b></div>
      ${k.gepland?`<div class="kd-ol"><div class="kd-or kd-af"><div class="kd-dt"><b>${parse(k.gepland).getDate()}</b><small>${esc(parse(k.gepland).toLocaleDateString("nl-NL",{month:"short"}).replace(".",""))}</small></div><div class="kd-or-m"><div class="kd-or-t"><b>${esc(k.dienst||"Glasbewassing")}</b></div><small>${esc(wd(parse(k.gepland)))}${k.tijd?" · "+esc(k.tijd):""} · ${esc(jobAddr(k))}</small></div><div class="kd-or-r"><span class="pill ${parse(k.gepland)<today()?"late":"plan"}">${parse(k.gepland)<today()?"Niet gedaan":"Ingepland"}</span></div></div></div>`:'<p class="subt" style="margin:0">Er zijn geen ingeplande afspraken.</p>'}
      ${showArch?(hist.length?`<span class="eyebrow">Archief</span><table class="minitable">${hist.slice(0,30).map(b=>`<tr data-act="beurtinfo" data-id="${esc(b.id)}" style="cursor:pointer"><td class="mono">${esc(fmtD(b.datum))}${b.tijd?" "+esc(b.tijd):""}</td><td>${esc(b.dienst||"Glasbewassing")}</td><td>${b.betaald?'<span class="pill ok">Betaald</span>':b.gefactureerd==="nvt"?'<span class="pill neutral">Niet gefactureerd</span>':b.gefactureerd?'<span class="pill soon">Gefactureerd</span>':'<span class="pill neutral">Nog factureren</span>'}</td><td class="r">${eur(b.bedrag)}</td></tr>`).join("")}</table>`:'<p class="subt" style="margin:0">Nog geen afgeronde afspraken.</p>'):""}
      <button type="button" class="small" data-kk="arch" style="align-self:flex-start">${I.eye}Archief ${showArch?"verbergen":"tonen"}${hist.length?" ("+hist.length+")":""}</button></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.offertes}</span><b>Offertes</b><span class="sp"></span>${plus(`data-act="newofferte" data-id="${esc(k.id)}"`,"Nieuwe offerte")}</div>
      ${offs.length?`<table class="minitable kp-click">${offs.map(f=>{const st=fStatus(f);return `<tr data-act="offedit" data-id="${esc(f.id)}" tabindex="0" role="button" title="Offerte openen"><td class="mono">${esc(f.nummer)}</td><td>${esc(omsZonderDatum((f.regels&&f.regels[0]&&f.regels[0].omschrijving)||"Offerte"))}${(f.regels||[]).length>1?` <small class="subt">+${f.regels.length-1}</small>`:""}</td><td>${esc(fmtD(f.datum))}</td><td><span class="pill ${st[0]}">${st[1]}</span></td><td class="r">${eur(totals(f).inc)}</td><td class="r kd-oo"><button type="button" class="iconbtn sm" data-act="offedit" data-id="${esc(f.id)}" title="Offerte openen" aria-label="Offerte openen">${I.pencil}</button>${state.dl?`<button type="button" class="iconbtn sm" data-act="pdf" data-id="${esc(f.id)}" title="PDF downloaden" aria-label="PDF downloaden">${I.dl}</button>`:""}<button type="button" class="iconbtn sm kd-del" data-act="offdel" data-id="${esc(f.id)}" title="Offerte verwijderen" aria-label="Offerte verwijderen">${I.x}</button></td></tr>`}).join("")}</table>`:'<p class="subt" style="margin:0">Nog geen offertes.</p>'}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.facturen}</span><b>Alle facturen</b><span class="sp"></span><button type="button" class="small primary" data-act="newfactuur" data-id="${esc(k.id)}">${I.plus}Nieuwe factuur</button></div>
      <div class="kd-ftools"><button type="button" class="small" data-kk="periodiek">${I.receipt}Periodieke factuur${isPeriodiek(k)?" · "+esc(fmtD(k.periodiek.volgende)):""}</button>${openF.length?`<button type="button" class="small" data-kk="openoverzicht">${I.mail}Klant openstaand overzicht sturen</button>`:""}</div>
      ${facs.length?`<div class="kd-fbar"><label class="kd-pp">Toon<select id="kdPP">${[5,10,25,50].map(n=>`<option ${PER===n?"selected":""}>${n}</option>`).join("")}</select></label><span class="sp"></span><div class="search kd-fq">${I.search}<input id="kdFQ" type="search" placeholder="Zoeken" value="${esc(state.kkFQ||"")}"></div></div>
        <div class="tablewrap kd-ft"><table class="t"><thead><tr><th>Fact. nr.</th><th>Locatie</th><th>Datum</th><th class="r">Bedrag</th><th>Status</th><th class="r"></th></tr></thead><tbody>${facsF.slice(fPage*PER,fPage*PER+PER).map(f=>{const st=fStatus(f);return `<tr data-act="factuur" data-id="${esc(f.id)}" style="cursor:pointer"><td class="mono">${esc(f.nummer)}</td><td>${esc(k.adres||"")}<br><small class="subt">${esc([k.postcode,k.plaats].filter(Boolean).join(" "))}</small></td><td>${esc(fmtNum(f.datum).replace(/ /g,""))}</td><td class="r">${eur(totals(f).inc)}</td><td><span class="pill ${st[0]}">${st[1]}</span>${st[1]==="Betaald"&&f.betaaldOp?`<br><small class="subt">${esc(fmtNum(f.betaaldOp).replace(/ /g,""))}</small>`:""}</td><td class="r" style="white-space:nowrap">${state.dl?`<button type="button" class="iconbtn sm" data-act="pdf" data-id="${esc(f.id)}" title="PDF downloaden" aria-label="PDF downloaden">${I.dl}</button>`:""}<button type="button" class="iconbtn sm" data-act="factuur" data-id="${esc(f.id)}" title="Factuur openen" aria-label="Factuur openen">${I.pencil}</button></td></tr>`}).join("")||`<tr><td colspan="6" class="subt">Geen facturen gevonden</td></tr>`}</tbody></table></div>
        <div class="kd-pg"><small class="subt">Resultaten ${facsF.length?fPage*PER+1:0} t/m ${Math.min(facsF.length,fPage*PER+PER)} van ${facsF.length}</small><span class="sp"></span>${fpages>1?`<button type="button" class="small" data-kk="fp" data-n="-1" ${fPage?"":"disabled"}>${I.left}Vorige</button>${[...Array(fpages)].map((_,n)=>n<2||n>fpages-3||Math.abs(n-fPage)<2?`<button type="button" class="small kd-pn${n===fPage?" on":""}" data-kk="fpn" data-n="${n}">${n+1}</button>`:n===2||n===fpages-3?'<span class="subt">…</span>':"").join("")}<button type="button" class="small" data-kk="fp" data-n="1" ${fPage<fpages-1?"":"disabled"}>Volgende${I.right}</button>`:""}</div>`:'<p class="subt" style="margin:0">Nog geen facturen. Na elke afgemelde beurt komt hier vanzelf een factuur.</p>'}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.chat}</span><b>Logboek</b></div>
      <div class="log">${[...(k.log||[]).map(l=>({d:l.datum,t:l.tekst,s:"Notitie"})),...msgs.map(m=>({d:String(m.op).slice(0,10),t:m.onderwerp||m.tekst,s:KANAAL[m.kanaal]||m.kanaal}))].sort((a,b)=>String(b.d).localeCompare(String(a.d))).slice(0,20).map(l=>`<div><span>${fmtD(l.d)} · ${esc(l.s)}</span>${esc(l.t)}</div>`).join("")||'<div style="color:var(--muted)">Er zijn geen logboekregels.</div>'}</div>
      <div style="display:flex;gap:8px"><input id="kd-log" placeholder="Bijv. gebeld, komt dinsdag beter uit"><button type="button" class="small" id="kdLog">Noteer</button></div></section>
  </div></div>`,{xwide:true});
  form.dataset.kk=k.id;
  const re=()=>{const y=dlg.scrollTop;openKlantView(k.id);dlg.scrollTop=y};
  const cur=()=>state.klanten.find(x=>x.id===k.id)||k;
  const put=async patch=>{await save("klanten",k.id,{...strip(cur()),...patch})};
  form.querySelectorAll("[data-kk]").forEach(b=>b.onclick=async e=>{e.preventDefault();const a=b.dataset.kk;if(a==="opdrfirst"){toast(k.opdrachtVerwijderd||k.prospect?"Maak eerst een offerte via de knop “Offerte maken”. Na akkoord ontstaat de opdracht, daarna kun je hier extra diensten toevoegen.":GLAS_REGEL+" Deze klant heeft geen lopende glasbewassing.");const o=form.querySelector('.kp [data-act="newofferte"]');if(o){o.scrollIntoView({block:"center",behavior:"smooth"});o.classList.remove("flash");void o.offsetWidth;o.classList.add("flash")}return}
    if(a==="edit")return kkGegevens(k.id);
    if(a==="arch"){state.kkArch=!state.kkArch;return re()}
    if(a==="fp"){state.kkFP=Math.max(0,(state.kkFP||0)+Number(b.dataset.n));return re()}
    if(a==="fpn"){state.kkFP=Number(b.dataset.n);return re()}
    if(a==="adres")return kkAdres(k.id);
    if(a==="opm")return kkOpm(k.id);
    if(a==="contact")return kkContact(k.id,b.dataset.i!=null?Number(b.dataset.i):-1);
    if(a==="berichten")return kkBerichten(k.id);
    if(a==="openoverzicht")return kkOpenOverzicht(k.id);
    if(a==="periodiek")return openPeriodiek(k.id,"klant");
    if(a==="docdel"){const d=[...(cur().documenten||[])];d.splice(Number(b.dataset.i),1);try{await put({documenten:d});toast("Document verwijderd");re()}catch(er){err(er)}}});
  const dc=$("#kdDoc");if(dc)dc.onchange=async e=>{const files=[...e.target.files];e.target.value="";const d=[...(cur().documenten||[])];
    for(const f of files){try{const r=await state.assets.upload(f);d.push({id:r.id,naam:f.name,datum:iso(today()),type:f.type||""})}catch(er){toast(f.name+" kon niet worden toegevoegd")}}
    try{await put({documenten:d});toast(plural(files.length,"document","documenten")+" toegevoegd");re()}catch(er){err(er)}};
  {const pp=$("#kdPP");if(pp)pp.onchange=()=>{state.kkPP=Number(pp.value);state.kkFP=0;re()};const fqi=$("#kdFQ");if(fqi)fqi.oninput=()=>{state.kkFQ=fqi.value;state.kkFP=0;clearTimeout(state._kkT);state._kkT=setTimeout(()=>{re();const n=$("#kdFQ");if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},250)}}
  const lb=$("#kdLog");if(lb)lb.onclick=async()=>{const v=$("#kd-log").value.trim();if(!v)return;try{await put({log:[...(cur().log||[]),{datum:iso(today()),tekst:v}]});re()}catch(er){err(er)}};
}
/* kleine bewerkvensters; na opslaan terug naar de klantkaart */
function kkSmall(kid,title,ic,body,read){
  const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  openDlg(`<div class="dlg-head"><span class="objic big">${ic}</span><div style="min-width:0;flex:1"><h3>${title}</h3><div class="subt">${esc(cleanName(k.naam))}</div></div><button type="button" class="iconbtn" id="kkX" aria-label="Terug">${I.x}</button></div>
    ${body(k)}<div class="row"><span class="sp"></span><button type="button" id="kkBack">Annuleren</button><button type="submit" class="primary" id="kkSave">${I.check}Opslaan</button></div>`,{wide:true});
  $("#kkX").onclick=$("#kkBack").onclick=()=>openKlantView(kid);
  form.onsubmit=async e=>{e.preventDefault();const p=read();if(!p)return;$("#kkSave").disabled=true;
    try{const cur=state.klanten.find(x=>x.id===kid)||k;await save("klanten",kid,{...strip(cur),...p});toast("Opgeslagen");openKlantView(kid)}catch(er){$("#kkSave").disabled=false;err(er)}};
}
function kkAdres(kid){const v=id=>$("#"+id).value.trim();
  kkSmall(kid,"Adresgegevens",I.pin,k=>`<p class="subt" style="margin:0">Leeg laten betekent: het hoofdadres en het gewone e-mailadres (${esc(k.email||"nog niet ingevuld")}).</p>
    <div class="secl">Factuuradres</div><div class="grid2"><label class="full">Straat en huisnummer<input id="ka-fa" value="${esc(k.fAdres||"")}" placeholder="${esc(k.adres||"")}"></label><label>Postcode<input id="ka-fp" value="${esc(k.fPostcode||"")}" placeholder="${esc(k.postcode||"")}"></label><label>Plaats<input id="ka-fpl" value="${esc(k.fPlaats||"")}" placeholder="${esc(k.plaats||"")}"></label></div>
    ${[["f","Facturen gaan naar"],["o","Offertes gaan naar"],["p","Planningsmails gaan naar"]].map(([x,l])=>`<div class="secl">${l}</div><div class="grid2"><label>E-mailadres<input id="ka-${x}e" type="email" value="${esc(k[x+"Email"]||"")}" placeholder="${esc(k.email||"")}"></label><label>Ter attentie van<input id="ka-${x}t" value="${esc(k[x+"Tav"]||"")}" placeholder="${esc(cleanName(k.naam))}"></label></div>`).join("")}`,
  ()=>({fAdres:v("ka-fa"),fPostcode:v("ka-fp").toUpperCase(),fPlaats:v("ka-fpl"),fEmail:v("ka-fe"),fTav:v("ka-ft"),oEmail:v("ka-oe"),oTav:v("ka-ot"),pEmail:v("ka-pe"),pTav:v("ka-pt")}))}
function kkOpm(kid){
  kkSmall(kid,"Opmerkingen",I.note,k=>`<label>Klantnotities <small class="help">alleen voor jezelf</small><textarea id="ko-n" style="min-height:110px">${esc(k.klantNotitie||"")}</textarea></label>
    <label>Factuurinstructies <small class="help">komt onderaan op elke factuur</small><textarea id="ko-f" style="min-height:80px" placeholder="Bijv. inkoopnummer 4500123 vermelden">${esc(k.factuurInstructie||"")}</textarea></label>`,
  ()=>({klantNotitie:$("#ko-n").value.trim(),factuurInstructie:$("#ko-f").value.trim()}))}
function kkContact(kid,i){const k=state.klanten.find(x=>x.id===kid);if(!k)return;const c=i>=0?(k.contacten||[])[i]||{}:{};
  kkSmall(kid,i>=0?"Contactpersoon":"Nieuwe contactpersoon",I.user,()=>`<div class="grid2"><label>Naam<input id="kc-n" required value="${esc(c.naam||"")}"></label><label>Functie<input id="kc-f" value="${esc(c.functie||"")}" placeholder="Bijv. beheerder, partner"></label>
    <label>E-mail<input id="kc-e" type="email" value="${esc(c.email||"")}"></label><label>Telefoon<input id="kc-t" type="tel" value="${esc(c.tel||"")}"></label></div>
    ${i>=0?`<button type="button" class="small ghost danger" id="kcDel" style="align-self:flex-start">${I.trash}Verwijderen</button>`:""}`,
  ()=>{const n=$("#kc-n").value.trim();if(!n){$("#kc-n").focus();return null}const l=[...(k.contacten||[])],o={naam:n,functie:$("#kc-f").value.trim(),email:$("#kc-e").value.trim(),tel:$("#kc-t").value.trim()};if(i>=0)l[i]=o;else l.push(o);return {contacten:l}});
  const d=$("#kcDel");if(d)d.onclick=async()=>{const l=[...(k.contacten||[])];l.splice(i,1);try{await save("klanten",kid,{...strip(k),contacten:l});toast("Contactpersoon verwijderd");openKlantView(kid)}catch(er){err(er)}}}
function kkBerichten(kid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;const ms=state.berichten.filter(m=>m.klantId===kid).sort((a,b)=>String(b.op).localeCompare(String(a.op)));
  openDlg(`<div class="dlg-head"><span class="objic big">${I.send}</span><div style="min-width:0;flex:1"><h3>Verzonden berichten</h3><div class="subt">${esc(cleanName(k.naam))} · ${plural(ms.length,"bericht","berichten")}</div></div><button type="button" class="iconbtn" id="kbX" aria-label="Terug">${I.x}</button></div>
    <div class="kd-msgs">${ms.map(m=>`<details class="kd-msg"><summary><span class="pill neutral">${esc(KANAAL[m.kanaal]||m.kanaal||"")}</span><b>${esc(m.onderwerp||String(m.tekst||"").slice(0,70))}</b><small>${esc(fmtTS(m.op))}${m.naar?" · "+esc(m.naar):""}</small>${(st=>statusPill(st[0]==="ok2"?"ok":st[0],st[1]))(MSTAT[mStat(m)]||MSTAT.geopend)}${mailTrk(m)}</summary><p>${esc(m.tekst||"").replace(/\n/g,"<br>")}</p></details>`).join("")||'<p class="subt">Nog geen berichten.</p>'}</div>
    <div class="row"><span class="sp"></span><button type="button" id="kbB">Terug naar klant</button></div>`,{wide:true});
  $("#kbX").onclick=$("#kbB").onclick=()=>openKlantView(kid)}
function kkOpenOverzicht(kid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const open=state.facturen.filter(f=>f.klantId===kid&&f.soort!=="offerte"&&["Openstaand","Achterstallig"].includes(fStatus(f)[1])).sort((a,b)=>String(a.datum).localeCompare(String(b.datum)));
  const tot=open.reduce((a,f)=>a+totals(f).inc,0),st=S(),kf=mailK(k,"factuur"),v=klantVars(kf);if(tavK(k,"factuur"))v.klant=tavK(k,"factuur");
  const lijst=open.map(f=>`- ${f.nummer} van ${fmtL(f.datum)}: ${eur(totals(f).inc)} (vervaldatum ${fmtL(f.verval)})`).join("\n");
  const mail=`Beste [name.customer],\n\nVolgens onze administratie staan de volgende facturen nog open:\n\n${lijst}\n\nTotaal: ${eur(tot)}\n\nWilt u dit bedrag overmaken${st.iban?" naar "+st.iban:""} onder vermelding van de factuurnummers? Heeft u al betaald, dan kunt u dit bericht als niet verzonden beschouwen.\n\nMet vriendelijke groet,\n[name.company]`;
  openCompose({title:"Openstaand overzicht",recipients:[{k:kf,vars:v,ref:"openoverzicht:"+kid+":"+iso(today())}],sjabloon:"vrij",kanaal:"email",onderwerp:"Overzicht openstaande facturen – [name.company]",mail,tekst:`Hoi [name.customer], er staan nog ${open.length} facturen open (${eur(tot)}). Zie de mail voor het overzicht. [name.company]`});
}

/* extra info bij een klus op de route: bellen en mee te nemen bedrijfsmiddelen */
function jobExtra(k){return jobExtra0(k)+(k&&k.id?bvHtml(k):"")}
function jobExtra0(k){const m=(k.middelen||[]).map(id=>((state.uitv&&state.uitv.middelen)||[]).find(x=>x.id===id)).filter(Boolean);
  return (k.bellen?`<div class="notebox"><span class="eyebrow">Onderweg</span>${I.phone} Bel de klant even voor je aankomt${k.telefoon?" · "+esc(k.telefoon):""}</div>`:"")+(m.length?`<div class="notebox"><span class="eyebrow">Meenemen</span>${m.map(x=>esc(x.naam)).join(", ")}</div>`:"")}

/* klantgegevens aanpassen (zoals in een klantdossier) */
function kkGegevens(kid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;const st=S(),T=tpls();
  const nm=String(k.naam||""),ach=k.achternaam??(k.soort==="zakelijk"?"":nm.includes(",")?nm.split(",")[0].trim():nm),voor=k.voornaam??(k.soort!=="zakelijk"&&nm.includes(",")?nm.split(",").slice(1).join(",").trim():"");
  const sel=(id,opts,v)=>`<select id="${id}">${opts.map(([a,b])=>`<option value="${esc(a)}" ${String(v)===String(a)?"selected":""}>${esc(b)}</option>`).join("")}</select>`;
  const groepen=[...new Set(["Standaard",...state.klanten.map(x=>x.nbGroep).filter(Boolean)])];
  kkSmall(kid,"Klantgegevens",I.user,()=>`<div class="grid2 kg">
    <label>Klantnummer<input id="kg-nr" inputmode="numeric" value="${esc(k.klantnr||"")}" placeholder="${esc(klantNr(k))}"><small class="help">Zelfde als de relatiecode in SnelStart</small></label>
    <label>Type klant${sel("kg-soort",[["particulier","Particulier"],["zakelijk","Zakelijk"]],k.soort==="zakelijk"?"zakelijk":"particulier")}</label>
    <label>Nieuwsbrief${sel("kg-nb",[["ja","Ja"],["nee","Nee"]],k.nieuwsbrief===false?"nee":"ja")}</label>
    <label>Klantgroep nieuwsbrief<input id="kg-nbg" list="kg-nbl" value="${esc(k.nbGroep||"Standaard")}"><datalist id="kg-nbl">${groepen.map(g=>`<option value="${esc(g)}">`).join("")}</datalist></label>
    <label class="full kg-bedr" ${k.soort==="zakelijk"?"":"hidden"}>Bedrijfsnaam<input id="kg-bedr" value="${esc(k.soort==="zakelijk"?nm:"")}"></label>
    <label>KVK-nummer<input id="kg-kvk" inputmode="numeric" value="${esc(k.kvk||"")}"></label>
    <label>BTW-nummer<input id="kg-btw" value="${esc(k.btwnr||"")}" placeholder="NL000000000B00"></label>
    <label>Functie<input id="kg-fn" value="${esc(k.functie||"")}"></label><span></span>
    <label>Voornaam<input id="kg-voor" value="${esc(voor)}"></label>
    <label>Achternaam<input id="kg-ach" value="${esc(ach)}"></label>
    <label>Geboortedatum<input id="kg-geb" type="date" value="${esc(k.geboortedatum||"")}"></label>
    <label>Template verjaardagsmail${sel("kg-vtpl",[["","Selecteer (geen felicitatie)"],...Object.keys(T).map(x=>[x,T[x].naam])],k.verjaardagTpl||"")}<small class="help">Staat op de verjaardag klaar bij Communicatie</small></label>
    <label>Geslacht${sel("kg-gesl",[["","Onbekend"],["man","Man"],["vrouw","Vrouw"]],k.geslacht||"")}<small class="help">Voor [salutation.customer] in berichten: "heer Jansen"</small></label>
    <label>Nieuwe klant${sel("kg-nieuw",[["nee","Nee"],["ja","Ja"]],k.nieuweKlant?"ja":"nee")}</label>
    <label class="full">Niet meer aanbieden bij aantal openstaande facturen${sel("kg-maxo",[["0","Standaard (n.v.t.)"],["1","Vanaf 1 openstaande factuur"],["2","Vanaf 2 openstaande facturen"],["3","Vanaf 3 openstaande facturen"],["4","Vanaf 4 openstaande facturen"],["5","Vanaf 5 openstaande facturen"]],k.maxOpen||0)}<small class="help">De klant staat dan niet meer bij Te plannen. Geldt niet voor afspraken die al zijn ingepland.</small></label>
    <label>Overschrijvende betalingstermijn<span class="ow-in"><input id="kg-term" type="number" min="0" step="1" value="${esc(k.termijn||0)}"><em>dagen</em></span><small class="help">0 = standaard termijn (${Number(st.termijn)||14} dagen)</small></label>
    <span></span>
    <label>IBAN<input id="kg-iban" value="${esc(k.iban||"")}" placeholder="NL00 BANK 0000 0000 00" autocomplete="off"></label>
    <label>Rekeninghouder<input id="kg-rh" value="${esc(k.rekeninghouder||"")}"></label>
    <label>E-mailadres<input id="kg-email" type="email" value="${esc(k.email||"")}"></label>
    <label>Website<input id="kg-web" value="${esc(k.website||"")}" placeholder="www.voorbeeld.nl"></label>
    <label>Telefoon<input id="kg-tel" type="tel" value="${esc(k.telefoon||"")}" placeholder="10 cijfers"></label>
    <label>Mobiel<input id="kg-mob" type="tel" value="${esc(k.mobiel||"")}" placeholder="10 cijfers"></label>
    <div class="secl full">Hoofdadres</div>
    <label class="full">Adres<input id="kg-adres" required value="${esc(k.adres||"")}" placeholder="Straat en huisnummer"></label>
    <label>Postcode<input id="kg-pc" value="${esc(k.postcode||"")}" placeholder="1234 AB"></label>
    <label>Plaats<input id="kg-pl" value="${esc(k.plaats||"")}"></label>
    <div class="secl full">Status</div>
    <label class="check-row"><input id="kg-actief" type="checkbox" ${k.actief!==false?"checked":""}>Actieve klant</label>
    <label>Reden als inactief${sel("kg-reden",[["","—"],...(st.annuleerRedenen||[]).map(r=>[r,r])],k.opzegReden||"")}</label>
    <label class="check-row"><input id="kg-geenrev" type="checkbox" ${k.geenReview?"checked":""}>Geen reviewverzoeken</label>
    <span></span>
    <button type="button" class="small ghost danger" id="kgDel" style="justify-self:start">${I.trash}Klant verwijderen</button>
  </div>`,()=>{const v=id=>$("#"+id).value.trim(),zak=$("#kg-soort").value==="zakelijk",voorn=v("kg-voor"),achn=v("kg-ach"),bedr=v("kg-bedr");
    const naam=zak?(bedr||[voorn,achn].filter(Boolean).join(" ")):(achn?achn+(voorn?", "+voorn:""):voorn);
    if(!naam){$(zak?"#kg-bedr":"#kg-ach").focus();toast("Vul een naam in");return null}
    if(!v("kg-adres")){$("#kg-adres").focus();toast("Vul het adres in");return null}
    const telOk=t=>!t||String(t).replace(/\D/g,"").length>=10;if(!telOk(v("kg-tel"))||!telOk(v("kg-mob"))){toast("Een telefoonnummer heeft 10 cijfers");return null}
    const actief=$("#kg-actief").checked;
    return {naam,voornaam:voorn,achternaam:achn,contact:zak?[voorn,achn].filter(Boolean).join(" "):(k.contact||""),klantnr:v("kg-nr"),soort:zak?"zakelijk":"particulier",nieuwsbrief:$("#kg-nb").value==="ja",nbGroep:v("kg-nbg")||"Standaard",
      geboortedatum:v("kg-geb"),verjaardagTpl:$("#kg-vtpl").value,geslacht:$("#kg-gesl").value,nieuweKlant:$("#kg-nieuw").value==="ja",maxOpen:Number($("#kg-maxo").value)||0,termijn:Math.max(0,Number(v("kg-term"))||0),
      kvk:v("kg-kvk"),btwnr:v("kg-btw").toUpperCase(),functie:v("kg-fn"),...(zak?{bedrijfsnaam:bedr}:{}),iban:v("kg-iban").toUpperCase(),rekeninghouder:v("kg-rh"),email:v("kg-email"),website:v("kg-web"),telefoon:v("kg-tel"),mobiel:v("kg-mob"),adres:v("kg-adres"),postcode:v("kg-pc").toUpperCase(),plaats:v("kg-pl"),
      actief,...(actief?{}:{gepland:"",tijd:""}),opzegReden:$("#kg-reden").value,geenReview:$("#kg-geenrev").checked}});
  $("#kg-soort").onchange=e=>{const b=form.querySelector(".kg-bedr");if(b)b.hidden=e.target.value!=="zakelijk"};
  const d=$("#kgDel");let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}try{await del("klanten",kid);dlg.close();toast(cleanName(k.naam)+" verwijderd")}catch(er){err(er)}};
}

/* opdracht verwijderen, met keuze voor de toekomstig ingeplande afspraken */
function kkDelOpdracht(kid,oid,back){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const main=oid==="main",o=main?null:(k.opdrachten||[]).find(x=>x.id===oid);if(!main&&!o)return;
  const naam=main?(k.dienst||"Glasbewassing"):o.dienst,extra=(k.opdrachten||[]).filter(x=>x.id!==oid&&x.actief!==false);
  const goBack=()=>back==="opdracht"?openOpdrachtWerk(kid):openKlantView(kid);
  openDlg(`<div class="dlg-head"><span class="objic big kd-warn">${I.alert}</span><div style="min-width:0;flex:1"><h3>Verwijderen</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(naam)}</div></div><button type="button" class="iconbtn" id="odX" aria-label="Annuleren">${I.x}</button></div>
    <p style="margin:0;font-size:15px">Weet je zeker dat je deze opdracht wilt verwijderen?</p>
    <label class="check-row"><input type="checkbox" id="od-fut" ${main&&k.gepland?"checked":"checked"}>In de toekomst ingeplande afspraken verwijderen</label>
    ${main?`<p class="help" style="margin:0">${k.gepland?"Er staat een afspraak op "+esc(fmtL(k.gepland))+(k.tijd?" om "+esc(k.tijd):"")+". ":""}${extra.length?"<b>Let op:</b> "+esc(extra.map(x=>x.dienst).join(", "))+" stopt dan ook, want andere diensten worden alleen samen met glasbewassing uitgevoerd. ":""}De klant blijft in je klantenbestand, maar wordt niet meer aangeboden in de planning. Facturen en de wasgeschiedenis blijven bewaard.</p>`:`<p class="help" style="margin:0">Facturen en de wasgeschiedenis blijven bewaard.</p>`}
    <div class="row"><span class="sp"></span><button type="button" id="odC">Annuleren</button><button type="submit" class="primary danger-bg" id="odS">${I.trash}Verwijderen</button></div>`,{wide:false});
  $("#odX").onclick=$("#odC").onclick=goBack;
  form.onsubmit=async e=>{e.preventDefault();$("#odS").disabled=true;const fut=$("#od-fut").checked,cur=state.klanten.find(x=>x.id===kid)||k;let p={};
    if(!main)p={opdrachten:(cur.opdrachten||[]).filter(x=>x.id!==oid)};
    else p={opdrachten:(cur.opdrachten||[]).map(x=>({...x,actief:false})),opdrachtVerwijderd:true,aanbieden:false,periodiek:cur.periodiek?{...cur.periodiek,aan:false}:cur.periodiek,...(fut||!cur.gepland?{gepland:"",tijd:"",actief:false}:{})};
    try{await save("klanten",kid,{...strip(cur),...p});toast("Opdracht verwijderd"+(fut&&cur.gepland&&main?" · afspraak "+fmtD(cur.gepland)+" vervalt":""));openKlantView(kid)}catch(er){$("#odS").disabled=false;err(er)}};
}
/* nieuwe opdracht bij een klant zonder opdrachten: wordt weer de hoofdopdracht */
async function kkNieuweHoofd(kid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  try{await save("klanten",kid,{...strip(k),opdrachtVerwijderd:false,actief:true,dienst:"Glasbewassing",prijs:0,ramenRegel:null,opdrachten:k.opdrachten||[]});setTimeout(()=>openOpdrachtWerk(kid),60)}catch(er){err(er)}}

/* offerte verwijderen vanuit de klantkaart */
function kkDelOfferte(fid){const f=state.facturen.find(x=>x.id===fid);if(!f)return;const kid=f.klantId;
  openDlg(`<div class="dlg-head"><span class="objic big kd-warn">${I.alert}</span><div style="min-width:0;flex:1"><h3>Verwijderen</h3><div class="subt">Offerte ${esc(f.nummer)} · ${eur(totals(f).inc)}</div></div><button type="button" class="iconbtn" id="dfX" aria-label="Annuleren">${I.x}</button></div>
    <p style="margin:0;font-size:15px">Weet je zeker dat je deze offerte wilt verwijderen?</p>
    ${f.status==="geaccepteerd"?'<p class="help" style="margin:0">Deze offerte is al geaccepteerd. De opdracht en de planning blijven gewoon staan.</p>':""}
    <div class="row"><span class="sp"></span><button type="button" id="dfC">Annuleren</button><button type="submit" class="primary danger-bg" id="dfS">${I.trash}Verwijderen</button></div>`,{wide:false});
  const back=()=>kid&&state.klanten.some(x=>x.id===kid)?openKlantView(kid):dlg.close();
  $("#dfX").onclick=$("#dfC").onclick=back;
  form.onsubmit=async e=>{e.preventDefault();$("#dfS").disabled=true;try{await del("facturen",fid);toast("Offerte "+f.nummer+" verwijderd");back()}catch(er){$("#dfS").disabled=false;err(er)}};
}
