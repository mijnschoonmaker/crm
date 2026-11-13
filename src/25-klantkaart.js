/* klant + zijn losse opdrachten (apart ingeplande jobs met eigen afspraak en factuur): op de klantkaart samen tonen */
const kkIds=k=>{if(!k)return[];const h=k.hoofdKlantId||k.id;return [h,...state.klanten.filter(x=>x.hoofdKlantId&&x.hoofdKlantId===h).map(x=>x.id)]};/* ook vanaf de kaart van een losse opdracht: alles van de klant */
/* ---------- KLANTKAART: overzicht met blokken (zoals een klantdossier), per blok aanpassen ---------- */
/* losse opdracht (eigen uitvoerlocatie): factuuradres, ontvangers en t.a.v. komen van de klant zelf (zoals in DienstenCRM: één factuuradres, meerdere locaties) */
const kkHoofd=k=>k&&k.hoofdKlantId?(state.klanten.find(x=>x.id===k.hoofdKlantId)||k):k;
const factAddr=k0=>{const k=kkHoofd(k0);return factAddr0(k)};
const factAddr0=k=>k&&k.fAdres?[k.fAdres,[k.fPostcode,k.fPlaats].filter(Boolean).join(" ")].filter(Boolean).join(", "):(k&&k.adres?fullAddr(k):jobAddr(k));
/* naar welk e-mailadres gaat wat: facturen, offertes of planningsmails (leeg = gewone e-mail) */
const mailK=(k,soort)=>{if(!k)return k;const h=kkHoofd(k)||k;const m=soort==="factuur"?h.fEmail:soort==="offerte"?h.oEmail:soort==="planning"?h.pEmail:"";return m?{...k,email:m}:(h!==k&&h.email?{...k,email:h.email}:k)};
const tavK=(k0,soort)=>{const k=kkHoofd(k0);return tavK0(k,soort)};
const tavK0=(k,soort)=>k?(soort==="factuur"?k.fTav:soort==="offerte"?k.oTav:soort==="planning"?k.pTav:"")||"":"";
function betaalgedrag(fs){
  const f=fs.filter(x=>x.soort!=="offerte"&&x.status!=="concept");
  const c={aanmaning:0,herinnering:0,optijd:0,open:0};
  f.forEach(x=>{const h=Number(x.herinneringen)||0,st=fStatus(x)[1];if(st==="Openstaand"||st==="Achterstallig"){c.open++;return}if(h>=2)c.aanmaning++;else if(h===1)c.herinnering++;else c.optijd++});
  const paid=f.filter(x=>x.status==="betaald"&&x.betaaldOp),gem=paid.length?Math.round(paid.reduce((a,x)=>a+Math.max(0,(parse(x.betaaldOp)-parse(x.datum))/DAY),0)/paid.length):null;
  /* nauwkeurig: van het moment van versturen tot het moment van betalen (zelfde regel als bij de snelbetaal-credits) */
  const vanTs=x=>{if(x.verstuurdTs)return x.verstuurdTs;const v=String(x.verstuurdOp||"");if(/T\d/.test(v))return v;if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const g=String(x.gemaakt||"");return g&&g.slice(0,10)===v?g:v+"T08:00:00"}return x.gemaakt||(x.datum?x.datum+"T08:00:00":"")};
  const totTs=x=>x.betaaldTs||(x.betaaldOp?String(x.betaaldOp).slice(0,10)+"T12:00:00":"");
  const duren=paid.map(x=>Date.parse(totTs(x))-Date.parse(vanTs(x))).filter(d=>d>=0&&isFinite(d)),gemMs=duren.length?duren.reduce((a,b)=>a+b,0)/duren.length:null;
  return {c,gem,gemMs,n:f.length,laatste:f.slice().sort((a,b)=>String(b.datum).localeCompare(String(a.datum))).slice(0,3)}}
/* betaalgedrag als nette kaart: ring met % op tijd, oordeel en vier tellers */
const PAYK={aanmaning:["#d9534f","Aanmaning"],herinnering:["#e0a030","Herinnering"],optijd:["#2bb673","Op tijd betaald"],open:["#5aa9c2","Openstaand"]};
function duurTxt(ms){const m=Math.max(0,Math.round(ms/6e4)),d=Math.floor(m/1440),u=Math.floor(m%1440/60),mi=m%60;return [d?d+" "+(d===1?"dag":"dagen"):"",u?u+" uur":"",mi||(!d&&!u)?mi+" min":""].filter(Boolean).join(" ")}
function payBlok(bg,los){const c=bg.c,afg=c.optijd+c.herinnering+c.aanmaning,pct=afg?Math.round(c.optijd/afg*100):null,tot=afg+c.open;
  const [vk,vt]=c.aanmaning?["late","Aanmaning nodig geweest"]:c.herinnering?["soon","Soms een herinnering"]:afg?["ok","Betaalt netjes op tijd"]:c.open?["plan","Nog geen betalingen"]:["plan","Nog geen facturen"];
  /* rustige kaart: grote score, één verdeelbalk en vier tellers naast elkaar */
  const K=["optijd","herinnering","aanmaning","open"],KL={optijd:"Op tijd",herinnering:"Herinnering",aanmaning:"Aanmaning",open:"Openstaand"};
  const balk=tot?K.filter(k=>c[k]).map(k=>`<i class="pb-s pb-${k}" style="flex:${c[k]}" title="${KL[k]}: ${c[k]}"></i>`).join(""):`<i class="pb-s pb-leeg" style="flex:1"></i>`;
  const kop=pct==null?`<b class="pb-big pb-dim">—</b><span class="pb-sub">${c.open?"Nog niets betaald":"Nog geen facturen"}</span>`:`<b class="pb-big">${pct}<small>%</small></b><span class="pb-sub">op tijd betaald</span>`;
  if(los==="pil")return `<span class="pb-v ${vk}">${vt}</span>`;
  return `<div class="pay pb2">${los?"":`<div class="pb-h"><b>Betaalgedrag</b><span class="pb-v ${vk}">${vt}</span></div>`}
    <div class="pb-hero"><div class="pb-top"><div class="pb-score">${kop}</div>${bg.gem!=null?`<div class="pb-gem"><span>Gemiddeld betaald na</span><b>${bg.gemMs!=null?duurTxt(bg.gemMs):bg.gem+" "+(bg.gem===1?"dag":"dagen")}</b></div>`:`<div class="pb-gem"><span>Facturen</span><b>${bg.n||tot}</b></div>`}</div>
    <div class="pb-bar">${balk}</div></div>
    <div class="pb-t">${K.map(k=>`<div class="pb-c pb-${k}${c[k]?"":" nul"}"><b>${c[k]}</b><span>${KL[k]}</span></div>`).join("")}</div></div>`}
function donut(c){const parts=[["late",c.aanmaning],["soon",c.herinnering],["ok",c.optijd],["plan",c.open]],tot=parts.reduce((a,p)=>a+p[1],0);
  if(!tot)return `<svg viewBox="0 0 42 42" class="kd-donut"><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--surface-3)" stroke-width="6"/></svg>`;
  let off=25;return `<svg viewBox="0 0 42 42" class="kd-donut">${parts.filter(p=>p[1]).map(([cl,n])=>{const L=n/tot*100,s=`<circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--${cl})" stroke-width="6" stroke-dasharray="${L} ${100-L}" stroke-dashoffset="${off}"/>`;off-=L;return s}).join("")}</svg>`}

function openKlantView(id,opt={}){
  /* nieuw geopende klantkaart begint altijd op Overzicht; alleen bij opnieuw tekenen van dezelfde open kaart blijft het tabblad staan */
  if(!(state.kkOpenId===id&&document.querySelector("dialog[open] #kkBody"))){state.kkTab="overzicht";state.kkArch=false}state.kkOpenId=id;
  try{if(!document.getElementById("kkFont")){const l=document.createElement("link");l.id="kkFont";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600&display=swap";document.head.appendChild(l)}}catch(e){}
  if(state._kkLast!==id){state._kkLast=id;state.kkFQ="";state.kkFP=0}
  const k=state.klanten.find(x=>x.id===id);if(!k)return openKlantEdit(null);
  const kIds=kkIds(k),nr=klantNr(k),fs=state.facturen.filter(f=>kIds.includes(f.klantId)).sort((a,b)=>String(b.datum).localeCompare(String(a.datum))),offs=(()=>{const z=new Set();return fs.filter(f=>f.soort==="offerte").filter(f=>{const key=f.id+"|"+(f.nummer||f.id);if(z.has(f.id)||(f.nummer&&z.has("n:"+f.nummer)))return false;z.add(f.id);if(f.nummer)z.add("n:"+f.nummer);return true})})(),facs=fs.filter(f=>f.soort!=="offerte");
  const hist=state.beurten.filter(b=>kIds.includes(b.klantId)).sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));
  const bg=betaalgedrag(fs),msgs=state.berichten.filter(m=>kIds.includes(m.klantId)).sort((a,b)=>String(b.op).localeCompare(String(a.op)));
  const kv=(a,b)=>`<div class="ow-kv"><span>${a}</span><b>${b||"—"}</b></div>`;
  const mail=e=>e?`<a href="mailto:${esc(e)}">${esc(e)}</a>`:"",tel=t=>t?`<a href="tel:${esc(String(t).replace(/[^\d+]/g,""))}">${esc(t)}</a>`:"";
  const pen=(act,lbl)=>`<button type="button" class="iconbtn sm" data-kk="${act}" aria-label="${lbl}" title="${lbl}">${I.pencil}</button>`;
  const plus=(act,lbl,extra="")=>`<button type="button" class="iconbtn sm primary" ${act.startsWith("data-")?act:`data-kk="${act}"`} ${extra} aria-label="${lbl}" title="${lbl}">${I.plus}</button>`;
  const PER=Number(state.kkPP)||5,fq=String(state.kkFQ||"").toLowerCase(),facsF=fq?facs.filter(f=>[f.nummer,f.datum,fmtNum(f.datum),fStatus(f)[1],String(totals(f).inc.toFixed(2)).replace(".",",")].join(" ").toLowerCase().includes(fq)):facs,fpages=Math.max(1,Math.ceil(facsF.length/PER)),fPage=Math.min(fpages-1,Math.max(0,state.kkFP||0));
  const openF=facs.filter(f=>["Openstaand","Achterstallig"].includes(fStatus(f)[1]));
  const showArch=!!state.kkArch;
  const opdr=[...(k.opdrachtVerwijderd?[]:[{id:"main",nr:(()=>{const h=k.hoofdKlantId&&k.opdrachtNr&&state.klanten.find(x=>x.id===k.hoofdKlantId);return h?klantNr(h)+"-"+k.opdrachtNr:nr+"-1"})(),dienst:(k.dienst||HD()),prijs:r2((Number(k.prijs)||0)*(1+(Number(k.toeslag)||0)/100)),adr:jobAddr(k),locn:hoofdLoc(k)==="hoofd"?"":locNaam(k,hoofdLoc(k)),frequentie:k.frequentie||4,info:k.prospect?["soon","Wacht op akkoord"]:k.actief===false?["neutral","Gestopt"]:k.gepland?["ok","Ingepland "+fmtD(k.gepland)]:["late","Te plannen"],per:isPeriodiek(k)}]),
    ...(k.opdrachten||[]).filter(o=>(o.actief!==false||(k.soort==="vve"&&String(o.dienst||"").trim()))&&!opdrBij(k,o)).map(o=>{const kids=(k.opdrachten||[]).filter(x=>x.actief!==false&&x.id!==o.id&&opdrBij(k,x)===o.id);const j=opdrApart(k,o)&&opdrJob(k,o.id),ul=opdrLoc(k,o);return{id:o.id,adr:locAdr(k,ul),locn:ul==="hoofd"?"":locNaam(k,ul),nr:nr+"-"+(o.nr||opdrNr(k,o.id)),dienst:[o.dienst,...kids.map(x=>x.dienst)].join(" + "),prijs:r2((Number(o.prijs)||0)+kids.reduce((a,x)=>a+(Number(x.prijs)||0),0)),frequentie:o.frequentie,
      info:o.actief===false?["neutral","Niet actief · open om aan te zetten"]:opdrApart(k,o)?(j&&j.gepland?["ok","Apart ingepland "+fmtD(j.gepland)]:["late","Apart · te plannen"]):ul!==hoofdLoc(k)?["late","Eigen adres · open en sla op om in te plannen"]:["neutral",o.volgende?"Volgende "+fmtD(o.volgende):"Bij volgende beurt"]}})];
  const cNaam=c=>c?[c.voornaam,c.achternaam].filter(Boolean).join(" ")||c.naam||"":"";
  /* contactpersoon per locatie; bij het hoofdadres valt hij terug op de oude contactpersonen of de contactpersoon van de klant */
  const hc=k.locContact&&cNaam(k.locContact)?k.locContact:(k.contacten||[])[0]?{naam:k.contacten[0].naam,tel:k.contacten[0].tel,email:k.contacten[0].email,functie:k.contacten[0].functie}:k.contact?{naam:k.contact,tel:k.telefoon||k.mobiel,email:k.email}:null;
  const locs=[{naam:k.locOms||"Hoofdadres",adres:k.adres,postcode:k.postcode,plaats:k.plaats,o:"main",c:hc},...(k.objecten||[]).map(o=>({naam:o.naam||"Object",adres:o.adres||k.adres,postcode:o.adres?o.postcode||"":k.postcode,plaats:o.adres?o.plaats||"":k.plaats,o:o.id,c:o.contact&&cNaam(o.contact)?o.contact:null}))];
  /* nieuwe kop (nov 2026): donker vlak met de kerncijfers en snelle acties */
  const stH=k.prospect?["soon","Prospect"]:k.actief===false?["neutral","Gestopt"]:["ok","Actief"];
  const gpK=k.gepland?parse(k.gepland):null,gpTxt=gpK?wd(gpK).slice(0,2)+" "+gpK.getDate()+" "+gpK.toLocaleDateString("nl-NL",{month:"short"}).replace(".",""):"Te plannen";
  const perB=k.opdrachtVerwijderd?(opdr[0]?toonK(k,opdr[0].prijs):0):(typeof stopBedrag==="function"?stopBedrag(k):toonK(k,k.prijs));
  const jaarK=typeof stJaarK==="function"?stJaarK(k):0,openS=openF.reduce((a,f)=>a+Math.max(0,totals(f).inc-(Number(f.deelBetaald)||0)),0);
  const telNr=String(k.telefoon||k.mobiel||"").replace(/[^\d+]/g,"");
  const kt=(l,v,s,c,ic,at)=>`<div class="kkh-t${at?" kkh-go":""}"${at?" "+at+' tabindex="0" role="button"':""}>${ic?`<i class="kkh-ic">${ic}</i>`:""}<span>${l}</span><b>${v}</b>${s?`<small class="${c||""}">${s}</small>`:""}</div>`;
  const bgAfg=bg.c.optijd+bg.c.herinnering+bg.c.aanmaning,bgPct=bgAfg?Math.round(bg.c.optijd/bgAfg*100):null,bgK=bgPct==null?"":bgPct>=90?"ok":bgPct>=70?"let":"late";
  const opA=`data-act="opdracht" data-id="${esc(k.id)}" data-o="main"`;
  const kern=`<section class="kko-s kko-kern"><div class="kko-h"><h3>In het kort</h3></div><div class="kkh-tg kk-kern">${kt("Volgende beurt",esc(gpTxt),gpK?(k.tijd?esc(k.tijd)+" · ":"")+(gpK<today()?"niet gedaan":"ingepland"):(k.prospect?"wacht op akkoord":"nog geen datum"),gpK&&gpK>=today()?"ok":gpK?"late":"",I.cal2||I.planning,opA)}${kt("Per beurt",eur(perB),jaarK?eur(Math.round(jaarK))+" per jaar":opdr[0]?esc(freqLabel(Number(opdr[0].frequentie)||52)):"","",I.euro,opA)}${kt("Openstaand",eur(openS),openF.length?plural(openF.length,"factuur","facturen")+" open":"niets open",openF.length?"late":"ok",I.facturen,'data-kktab="geld"')}${kt("Betaalgedrag",bgPct==null?"—":bgPct+"% op tijd",bg.gem!=null?"gemiddeld "+bg.gem+" "+(bg.gem===1?"dag":"dagen"):"nog geen betalingen",bgK,`<span class="kkh-dot ${bgK||"leeg"}"></span>`,'data-kktab="geld"')}</div></section>`;
  /* aandacht: alleen als er echt iets moet gebeuren, met de knop erbij */
  const fLaat=openF.filter(f=>fStatus(f)[1]==="Achterstallig"),offOpen=(offs||[]).filter(f=>f.status==="verstuurd"&&f.datum&&(today()-parse(String(f.datum).slice(0,10)))/DAY>=14);
  const let_=[fLaat.length?["late",I.facturen,plural(fLaat.length,"factuur","facturen")+" over de betaaltermijn",eur(fLaat.reduce((a,f)=>a+Math.max(0,totals(f).inc-(Number(f.deelBetaald)||0)),0))+" open","Bekijken",'data-kktab="geld"']:null,
    !k.prospect&&k.actief!==false&&!k.opdrachtVerwijderd&&!gpK&&Number(k.frequentie)!==FQ_AFROEP?["let",I.planning,"Nog niet ingepland","De volgende beurt heeft nog geen datum","Inplannen",opA]:null,
    gpK&&gpK<today()?["let",I.planning,"Beurt van "+esc(fmtD(k.gepland))+" niet afgemeld","Afmelden of opnieuw inplannen","Openen",opA]:null,
    !k.prospect&&offOpen.length?["let",I.offertes,"Offerte "+esc(offOpen[0].nummer||"")+" wacht op reactie",Math.round((today()-parse(String(offOpen[0].datum).slice(0,10)))/DAY)+" dagen geleden verstuurd","Bekijken",'data-kktab="geld"']:null].filter(Boolean);
  const aandacht=let_.length?`<div class="kk-let">${let_.map(([c,ic,t,sub,kn,at])=>`<div class="kk-li ${c}"><span class="kk-lic">${ic}</span><span class="kk-lt"><b>${t}</b><small>${sub}</small></span><button type="button" class="kk-lb" ${at}>${kn}</button></div>`).join("")}</div>`:"";
  openDlg(`<div class="kk-hero kk-${stH[0]}"><div class="kkh-r1"><span class="kkh-bc">Klanten<i>/</i><b>${esc(cleanName(k.naam))}</b></span><span class="sp"></span><button type="button" class="kkh-ib" data-kk="edit" aria-label="Klantgegevens aanpassen" title="Klantgegevens aanpassen">${I.pencil}</button><button type="button" class="kkh-ib" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="kkh-r2"><div class="kkh-wie"><span class="kkh-av">${esc(initials(k.naam))}</span><div class="kkh-nm"><div class="kkh-tl"><h2>${esc(cleanName(k.naam))}</h2><span class="kkh-st ${stH[0]}"><i></i>${stH[1]}</span></div><a class="kkh-adr" href="${esc(mapsQ(k))}" target="_blank" rel="noopener">${I.pin}${esc(fullAddr(k))}</a><div class="kkh-meta"><span>${esc(soortLbl(k))}</span>${k.nieuweKlant?`<span>Nieuwe klant</span>`:""}${k.aangemaakt?`<span>Klant sinds ${esc(parse(String(k.aangemaakt).slice(0,10)).toLocaleDateString("nl-NL",{month:"long",year:"numeric"}))}</span>`:""}<span>Nr. ${esc(nr)}</span></div>${(()=>{const h=typeof hospList==="function"?hospList(k).slice(0,3):[];return h.length?`<div class="kkh-hosp"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 4.4 2.5.8-1.4 2.3-2.5 4.4-2.5 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg><span>${h.map(x=>esc(String(x.t).trim())).join(" · ")}</span></div>`:""})()}</div></div>
      </div>
</div>
  ${typeof opdrJobBanner==="function"?opdrJobBanner(k):""}${isOBeurt(k)?`<div class="hosp-top">${oBeurtBlok(k)}</div>`:""}<div class="hosp-top kk-hospboven">${hospBlok(k)}</div>
  ${kkOverzicht(k,{opdr,hist,facs,msgs,openF,bg,kern:""})}
  ${k.prospect?(()=>{const of=offs.find(f=>f.status!=="afgewezen"&&f.status!=="geaccepteerd");return of||offs.length?`<div class="banner"><div><b>Offerte${of?" "+esc(of.nummer):""} wacht op akkoord</b><br><small>Deze klant staat nog niet in de planning.</small></div>${of?`<button type="button" class="primary small" data-act="akkoord" data-id="${esc(of.id)}">Akkoord en inplannen</button>`:""}</div>`:`<div class="banner"><div><b>Nieuwe klant · nog geen offerte</b><br><small>Volgende stap: offerte maken. Na akkoord komt de klant in de planning.</small></div><button type="button" class="primary small" data-act="newofferte" data-id="${esc(k.id)}">${I.offertes}Offerte maken</button></div>`})():""}
  <div class="kk-grid kd kk-v2" id="kkBody"><div class="kk-left">
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Klantgegevens</b><span class="sp"></span>${pen("edit","Klantgegevens aanpassen")}</div>
      <a class="kd-map" href="${esc(mapsQ(k))}" target="_blank" rel="noopener" aria-label="Open in kaarten"><span class="kd-pin">${I.pin}</span><span><b>${esc(k.adres||"")}</b><small>${esc([k.postcode,k.plaats].filter(Boolean).join(" "))}</small></span><em>${I.nav}Route</em></a>
      ${kv("Klantnummer",esc(nr))}${kv("Type klant",soortLbl(k))}${kv("Naam",esc(cleanName(k.naam)))}${k.contact?kv("Contactpersoon",esc(k.contact)):""}${k.geboortedatum?kv("Geboortedatum",esc(fmtL(k.geboortedatum))):""}
      ${kv("E-mailadres",mail(k.email))}${kv("Telefoon",tel(k.telefoon))}${k.mobiel?kv("Mobiel",tel(k.mobiel)):""}${k.website?kv("Website",`<a href="${esc(/^https?:/.test(k.website)?k.website:"https://"+k.website)}" target="_blank" rel="noopener">${esc(k.website)}</a>`):""}${k.iban?kv("IBAN",esc(k.iban)+(k.rekeninghouder?`<br><small class="subt">${esc(k.rekeninghouder)}</small>`:"")):""}${k.termijn?kv("Betalingstermijn",esc(k.termijn)+" dagen"):""}${kv("Klant sinds",k.aangemaakt?esc(fmtL(k.aangemaakt)):"")}${kv("Betaalwijze",k.incasso?"Automatische incasso":"Per bank")}${k.ronde?kv("Ronde",esc(k.ronde)):""}
      </section>
    <section class="kp kk-pay"><div class="kp-h"><span class="objic">${I.euro}</span><b>Betaalgedrag</b><span class="sp"></span>${payBlok(bg,"pil")}</div>${payBlok(bg,true)}
      </section>
    ${kkPortaal(k)}
    <section class="kp"><div class="kp-h"><span class="objic">${I.pin}</span><b>Adresgegevens</b><span class="sp"></span>${pen("adres","Adresgegevens aanpassen")}</div>
      ${kv("Factuuradres",esc(factAddr(k))+(k.fAdres?"":` <small class="subt">(zelfde als hoofdadres)</small>`))}
      ${k.beheercode?kv("Beheercode op de factuur",esc(k.beheercode)):""}
      ${kv("Facturen gaan naar",mail(mailK(k,"factuur").email)+(tavK(k,"factuur")?`<br><small class="subt">t.a.v. ${esc(tavK(k,"factuur"))}</small>`:""))}
      ${kv("Offertes gaan naar",mail(mailK(k,"offerte").email)+(tavK(k,"offerte")?`<br><small class="subt">t.a.v. ${esc(tavK(k,"offerte"))}</small>`:""))}
      ${kv("Planningsmails gaan naar",mail(mailK(k,"planning").email)+(tavK(k,"planning")?`<br><small class="subt">t.a.v. ${esc(tavK(k,"planning"))}</small>`:""))}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.upload}</span><b>Klantdocumenten</b><span class="sp"></span>${state.assets?`<label class="iconbtn sm primary" title="Document toevoegen" aria-label="Document toevoegen">${I.plus}<input type="file" hidden multiple id="kdDoc"></label>`:""}</div>
      ${(k.documenten||[]).length?`<table class="minitable">${k.documenten.map((d,i)=>`<tr><td><a href="${BLOB}${esc(d.id)}" target="_blank" rel="noopener"><b>${esc(d.naam)}</b></a><br><small class="subt">${esc(fmtD(d.datum))}${d.omschr?" · "+esc(d.omschr):""}</small></td><td class="r" style="white-space:nowrap">${LIVE?`<button type="button" class="kd-port${d.portaal?" aan":""}" data-kk="docportaal" data-i="${i}" title="${d.portaal?"Zichtbaar in het klantportaal (tik om te verbergen)":"Niet zichtbaar in het klantportaal (tik om te tonen)"}">${I.globe}${d.portaal?"In portaal":"Portaal"}</button>`:""}<a class="iconbtn sm" href="${BLOB}${esc(d.id)}" download="${esc(d.naam)}" aria-label="Downloaden">${I.dl}</a><button type="button" class="iconbtn sm" data-kk="docdel" data-i="${i}" aria-label="Verwijderen">${I.x}</button></td></tr>`).join("")}</table>`:`<p class="subt" style="margin:0">${state.assets?"Nog geen documenten. Voeg bijvoorbeeld een contract, offerte of verzekeringsbewijs toe. Met de knop Portaal zet je een document klaar in het klantportaal.":"Bestanden toevoegen kan hier niet."}</p>`}</section>
    <section class="kp kk-hist"><div class="kp-h"><span class="objic">${I.check}</span><div><b>Historie bezoeken</b><small>${hist.length?plural(hist.length,"bezoek","bezoeken")+" gedaan":"Nog geen bezoeken"}</small></div></div>
      ${hist.length?`<div class="kd-ol">${hist.slice(0,showArch?60:6).map(b=>{const d=parse(b.datum);return `<div class="kd-or" data-act="beurtinfo" data-id="${esc(b.id)}" tabindex="0" role="button"><div class="kd-dt"><b>${d.getDate()}</b><small>${esc(d.toLocaleDateString("nl-NL",{month:"short"}).replace(".",""))}${d.getFullYear()!==today().getFullYear()?" "+String(d.getFullYear()).slice(2):""}</small></div><div class="kd-or-m"><div class="kd-or-t"><b>${esc(b.dienst||HD())}</b></div><small>${esc(wd(d))}${b.tijd?" · "+esc(b.tijd):""}${b.door||b.medewerker?" · "+esc(b.door||b.medewerker):""}</small></div><div class="kd-or-r">${Number(b.bedrag)?`<b>${eur(b.bedrag)}</b>`:""}${b.betaald?'<span class="pill ok">Betaald</span>':b.gefactureerd==="nvt"?'<span class="pill neutral">Niet gefactureerd</span>':b.gefactureerd?'<span class="pill soon">Gefactureerd</span>':'<span class="pill neutral">Nog factureren</span>'}</div></div>`}).join("")}</div>
      ${hist.length>6?`<button type="button" class="small" data-kk="arch" style="align-self:flex-start">${I.eye}${showArch?"Minder tonen":"Alles tonen ("+hist.length+")"}</button>`:""}`:'<p class="subt" style="margin:0">Nog geen afgeronde bezoeken.</p>'}</section>
  </div><div class="kk-side">
    <section class="kp"><div class="kp-h"><span class="objic">${I.globe}</span><b>Locaties</b><span class="sp"></span>${plus(`data-act="obj" data-id="${esc(k.id)}" data-o=""`,"Locatie toevoegen")}</div>
      <table class="minitable kp-click">${locs.map(l=>`<tr data-act="obj" data-id="${esc(k.id)}" data-o="${esc(l.o)}" tabindex="0" role="button"><td><b>${esc(l.adres||"")}</b><br><small class="subt">${esc(l.naam)} · ${esc([l.postcode,l.plaats].filter(Boolean).join(" "))}</small></td><td class="kk-lc">${l.c?`<b>${esc(cNaam(l.c))}</b>${l.c.functie?` <small class="subt">${esc(l.c.functie)}</small>`:""}<br><small class="subt">${[l.c.tel,l.c.email].filter(Boolean).map(esc).join(" · ")}</small>`:'<small class="subt">Geen contactpersoon</small>'}</td><td class="r">${I.pencil}</td></tr>`).join("")}</table></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.checksq||I.check}</span><b>Opdrachten</b><span class="sp"></span>${!heeftGlas(k)?plus("opdrfirst","Opdracht toevoegen"):plus(`data-act="opdracht" data-id="${esc(k.id)}" data-o="new"`,"Opdracht toevoegen")}</div>
      ${opdr.length?`<div class="kd-ol">${opdr.map(o=>`<div class="kd-or" data-act="opdracht" data-id="${esc(k.id)}" data-o="${esc(o.id)}" tabindex="0" role="button"><div class="kd-or-m"><div class="kd-or-t"><b>${esc(o.dienst)}</b><span class="mono">#${esc(o.nr)}</span></div><small>${I.pin||""}${esc(o.adr||jobAddr(k))}${o.locn?" · "+esc(o.locn):""}</small><div class="kd-or-p"><span class="pill ${o.info[0]}">${esc(o.info[1])}</span><span class="pill neutral">${I.refresh||""}${esc(freqLabel(o.frequentie).toLowerCase())}</span>${o.per?`<span class="pill plan">${I.receipt}Periodiek</span>`:""}</div></div><div class="kd-or-r"><b class="mono">${eur(toonR(k,o))}</b><span class="kd-oo"><button type="button" class="iconbtn sm" data-act="opdracht" data-id="${esc(k.id)}" data-o="${esc(o.id)}" aria-label="Opdracht aanpassen" title="Aanpassen">${I.pencil}</button><button type="button" class="iconbtn sm kd-del" data-act="opdrdel" data-id="${esc(k.id)}" data-o="${esc(o.id)}" aria-label="Opdracht verwijderen" title="Verwijderen">${I.x}</button></span></div></div>`).join("")}</div>`:`<p class="subt" style="margin:0">Nog geen opdracht. Een opdracht ontstaat zodra de klant akkoord geeft op een offerte, of via de calculator op je website.</p><button type="button" class="small primary" data-act="newofferte" data-id="${esc(k.id)}" style="align-self:flex-start">${I.offertes}Offerte maken</button>`}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.clock}</span><b>Ingeplande bezoeken</b></div>
      ${k.gepland?`<div class="kd-ol"><div class="kd-or kd-af"><div class="kd-dt"><b>${parse(k.gepland).getDate()}</b><small>${esc(parse(k.gepland).toLocaleDateString("nl-NL",{month:"short"}).replace(".",""))}</small></div><div class="kd-or-m"><div class="kd-or-t"><b>${esc(k.dienst||HD())}</b></div><small>${esc(wd(parse(k.gepland)))}${k.tijd?" · "+esc(k.tijd):""} · ${esc(jobAddr(k))}</small></div><div class="kd-or-r"><span class="pill ${parse(k.gepland)<today()?"late":"plan"}">${parse(k.gepland)<today()?"Niet gedaan":"Ingepland"}</span></div></div></div>`:'<p class="subt" style="margin:0">Er zijn geen ingeplande bezoeken.</p>'}
      </section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.offertes}</span><b>Offertes</b><span class="sp"></span>${plus(`data-act="newofferte" data-id="${esc(k.id)}"`,"Nieuwe offerte")}</div>
      ${offs.length?`<div class="kd-ol">${offs.map(f=>{const st=fStatus(f);return `<div class="kd-or" data-act="offedit" data-id="${esc(f.id)}" tabindex="0" role="button" title="Offerte openen"><div class="kd-or-m"><div class="kd-or-t"><b>${esc(omsZonderDatum((f.regels&&f.regels[0]&&f.regels[0].omschrijving)||"Offerte"))}${(f.regels||[]).length>1?` <small class="subt">+${f.regels.length-1}</small>`:""}</b><span class="mono">${esc(f.nummer)}</span></div><small>${esc(fmtD(f.datum))}</small><div class="kd-or-p"><span class="pill ${st[0]}">${st[1]}</span></div></div><div class="kd-or-r"><b class="mono">${eur(S().toonEx?totals(f).ex:totals(f).inc)}</b><span class="kd-oo"><button type="button" class="iconbtn sm" data-act="offedit" data-id="${esc(f.id)}" title="Offerte openen" aria-label="Offerte openen">${I.pencil}</button>${state.dl?`<button type="button" class="iconbtn sm" data-act="pdf" data-id="${esc(f.id)}" title="PDF downloaden" aria-label="PDF downloaden">${I.dl}</button>`:""}<button type="button" class="iconbtn sm kd-del" data-act="offdel" data-id="${esc(f.id)}" title="Offerte verwijderen" aria-label="Offerte verwijderen">${I.x}</button></span></div></div>`}).join("")}</div>`:'<p class="subt" style="margin:0">Nog geen offertes.</p>'}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.facturen}</span><b>Alle facturen</b><span class="sp"></span>${k.factuurInstructie?"":`<button type="button" class="small" data-kk="opm">${I.plus}Factuurinstructie</button>`}<button type="button" class="small primary" data-act="newfactuur" data-id="${esc(k.id)}">${I.plus}Nieuwe factuur</button></div>
      ${k.factuurInstructie?`<div class="kk-finst"><span>Factuurinstructie</span><p>${esc(k.factuurInstructie).replace(/\n/g,"<br>")}</p><button type="button" class="kk-nb" data-kk="opm">Wijzigen</button></div>`:""}
      <div class="kd-ftools${openF.length?"":" een"}"><button type="button" class="kd-tool" data-kk="periodiek"><span class="kd-tool-i">${I.receipt}</span><span class="kd-tool-t"><b>Periodieke factuur</b><small>${isPeriodiek(k)?"Volgende "+esc(fmtD(k.periodiek.volgende)):"Instellen"}</small></span>${I.right.replace("<svg",'<svg class="kd-tool-c"')}</button>${openF.length?`<button type="button" class="kd-tool warm" data-kk="openoverzicht"><span class="kd-tool-i">${I.mail}</span><span class="kd-tool-t"><b>Openstaand overzicht</b><small>${openF.length} open · <span style="white-space:nowrap">${eur(openF.reduce((a,f)=>a+totals(f).inc,0))}</span></small></span>${I.right.replace("<svg",'<svg class="kd-tool-c"')}</button>`:""}</div>
      ${facs.length?`<div class="kd-fbar"><div class="search kd-fq">${I.search}<input id="kdFQ" type="search" placeholder="Zoeken" value="${esc(state.kkFQ||"")}"></div><label class="kd-pp"><select id="kdPP" aria-label="Aantal facturen per pagina">${[5,10,25,50].map(n=>`<option value="${n}" ${PER===n?"selected":""}>Toon ${n}</option>`).join("")}</select></label></div>
        <div class="kd-ol kd-fl">${facsF.slice(fPage*PER,fPage*PER+PER).map(f=>{const st=fStatus(f);return `<div class="kd-or" data-act="factuur" data-id="${esc(f.id)}" tabindex="0" role="button"><div class="kd-dt"><b>${parse(f.datum).getDate()}</b><small>${esc(parse(f.datum).toLocaleDateString("nl-NL",{month:"short"}).replace(".",""))}</small></div><div class="kd-or-m"><div class="kd-or-t"><b class="mono">${esc(f.nummer)}</b></div><small>${esc([k.adres,k.plaats].filter(Boolean).join(", "))}</small><div class="kd-or-p"><span class="pill ${st[0]}">${st[1]}</span>${st[1]==="Betaald"&&f.betaaldOp?`<span class="pill neutral">op ${esc(fmtD(f.betaaldOp))}</span>`:""}</div></div><div class="kd-or-r"><b class="mono">${eur(S().toonEx?totals(f).ex:totals(f).inc)}</b><span class="kd-oo">${state.dl?`<button type="button" class="iconbtn sm" data-act="pdf" data-id="${esc(f.id)}" title="PDF downloaden" aria-label="PDF downloaden">${I.dl}</button>`:""}<button type="button" class="iconbtn sm" data-act="factuur" data-id="${esc(f.id)}" title="Factuur openen" aria-label="Factuur openen">${I.pencil}</button></span></div></div>`}).join("")||`<p class="subt" style="margin:0">Geen facturen gevonden</p>`}</div>
        <div class="kd-pg"><small class="subt">Resultaten ${facsF.length?fPage*PER+1:0} t/m ${Math.min(facsF.length,fPage*PER+PER)} van ${facsF.length}</small><span class="sp"></span>${fpages>1?`<button type="button" class="small" data-kk="fp" data-n="-1" ${fPage?"":"disabled"}>${I.left}Vorige</button>${[...Array(fpages)].map((_,n)=>n<2||n>fpages-3||Math.abs(n-fPage)<2?`<button type="button" class="small kd-pn${n===fPage?" on":""}" data-kk="fpn" data-n="${n}">${n+1}</button>`:n===2||n===fpages-3?'<span class="subt">…</span>':"").join("")}<button type="button" class="small" data-kk="fp" data-n="1" ${fPage<fpages-1?"":"disabled"}>Volgende${I.right}</button>`:""}</div>`:'<p class="subt" style="margin:0">Nog geen facturen. Na elke afgemelde beurt komt hier vanzelf een factuur.</p>'}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.chat}</span><b>Logboek</b></div>
      ${(()=>{/* logboek: smalle regels (datum, soort, korte omschrijving); met het oogje klap je de volledige tekst open */
        const kort=t=>{const r=String(t||"").split(/\n+/).map(x=>x.trim()).filter(x=>x&&!/^(beste|hallo|hoi|geachte)\b/i.test(x)&&!/^met vriendelijke groet/i.test(x));return r[0]||String(t||"").trim()};
        const L=[...(k.log||[]).map(l=>({d:l.datum,u:"",t:l.tekst,s:"Notitie"})),...msgs.map(m=>({id:m.id,d:String(m.op).slice(0,10),u:String(m.op).slice(11,16),o:m.onderwerp||"",t:m.tekst||m.onderwerp||"",s:KANAAL[m.kanaal]||m.kanaal}))].sort((a,b)=>String(b.d+b.u).localeCompare(String(a.d+a.u)));
        if(!L.length)return '<p class="subt" style="margin:0">Er zijn geen logboekregels.</p>';
        const N=state.kkLogN||5;
        return `<div class="lgb">${L.slice(0,N).map(l=>{const sum=l.o||kort(l.t),meer=String(l.t||"").trim()&&String(l.t).trim()!==sum;if(l.s!=="Notitie")return `<button type="button" class="lgb-r lgb-knop" data-kk="berichten" data-mid="${esc(l.id||"")}"><span class="lgb-d">${esc(fmtD(l.d))}${l.u?`<i>${esc(l.u)}</i>`:""}</span><span class="lgb-s">${esc(l.s)}</span><span class="lgb-t">${esc(sum)}</span><span class="lgb-oog" aria-label="Bekijken">${I.eye}</span></button>`;return `<details class="lgb-r"><summary><span class="lgb-d">${esc(fmtD(l.d))}${l.u?`<i>${esc(l.u)}</i>`:""}</span><span class="lgb-s ${l.s==="Notitie"?"n":""}">${esc(l.s)}</span><span class="lgb-t">${esc(sum)}</span>${meer?`<span class="lgb-oog" aria-label="Volledig bekijken">${I.eye}</span>`:""}</summary>${meer?`<div class="lgb-x">${esc(l.t)}</div>`:""}</details>`}).join("")}</div>
          ${L.length>N?`<button type="button" class="small ghost" data-act="kklogmeer" style="align-self:flex-start">Meer tonen (${L.length-N})</button>`:N>5?`<button type="button" class="small ghost" data-act="kklogmin" style="align-self:flex-start">Minder tonen</button>`:""}`})()}
      <div class="log-in"><input id="kd-log" placeholder="Notitie toevoegen…" aria-label="Notitie voor het logboek"><button type="button" class="small primary" id="kdLog">${I.plus}Noteer</button></div></section>
  </div></div>
  ${(()=>{const t=String(k.mobiel||k.telefoon||"").replace(/[^\d+]/g,""),wa=t?t.replace(/^\+/,"").replace(/^00/,"").replace(/^0/,"31"):"";
    return `<nav class="kk-actbar" aria-label="Snelle acties">${t?`<a href="tel:${esc(t)}">${I.phone}<span>Bellen</span></a><a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">${I.wa||I.chat}<span>WhatsApp</span></a>`:""}<button type="button" ${opA}>${I.planning}<span>Inplannen</span></button><button type="button" data-act="newfactuur" data-id="${esc(k.id)}">${I.facturen}<span>Factuur</span></button></nav>`})()}`,{xwide:true});
  form.dataset.kk=k.id;
  kkTabsInit(form);
  const re=()=>{const y=dlg.scrollTop;openKlantView(k.id);dlg.scrollTop=y};
  const cur=()=>state.klanten.find(x=>x.id===k.id)||k;
  const put=async patch=>{await save("klanten",k.id,{...strip(cur()),...patch})};
  form.querySelectorAll("[data-kk]").forEach(b=>b.onclick=async e=>{e.preventDefault();const a=b.dataset.kk;if(a==="kkplan"){try{dlg.close()}catch(x){}go("planning");setTimeout(()=>{if(typeof pqKies==="function")pqKies(k.id)},90);return}if(a==="opdrfirst"){/* nieuwe klant of klant zonder opdracht: direct een (hoofd)opdracht aanmaken */if(k.opdrachtVerwijderd||k.prospect){kkNieuweHoofd(k.id);return}toast(GLAS_REGEL+" Deze klant heeft geen lopende glasbewassing.");const o=form.querySelector('.kp [data-act="newofferte"]');if(o){o.scrollIntoView({block:"center",behavior:"smooth"});o.classList.remove("flash");void o.offsetWidth;o.classList.add("flash")}return}
    if(a==="edit")return kkGegevens(k.id);
    if(a==="arch"){state.kkArch=!state.kkArch;return re()}
    if(a==="fp"){state.kkFP=Math.max(0,(state.kkFP||0)+Number(b.dataset.n));return re()}
    if(a==="fpn"){state.kkFP=Number(b.dataset.n);return re()}
    if(a==="adres")return kkAdres(k.id);
    if(a==="opm")return kkOpm(k.id);
    if(a==="contact")return kkContact(k.id,b.dataset.i!=null?Number(b.dataset.i):-1);
    if(a==="berichten")return kkBerichten(k.id,b.dataset.mid);
    if(a==="openoverzicht")return kkOpenOverzicht(k.id);
    if(a==="periodiek")return openPeriodiek(k.id,"klant");
    if(a==="docportaal"){const d=[...(cur().documenten||[])],i=Number(b.dataset.i);if(!d[i])return;d[i]={...d[i],portaal:!d[i].portaal};try{await put({documenten:d});toast(d[i].portaal?"Zichtbaar in het klantportaal (Documenten)":"Niet meer zichtbaar in het klantportaal");re()}catch(er){err(er)}}
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
    try{const cur=state.klanten.find(x=>x.id===kid)||k;await save("klanten",kid,{...strip(cur),...p});let n=0;try{n=await adresDoorvoeren({...cur},{...cur,...p,id:kid})}catch(e2){console.error(e2)}toast("Opgeslagen"+(n?" · ook bijgewerkt in "+plural(n,"conceptfactuur/offerte","conceptfacturen/offertes"):""));openKlantView(kid)}catch(er){$("#kkSave").disabled=false;err(er)}};
}
function kkAdres(kid){const v=id=>$("#"+id).value.trim();
  kkSmall(kid,"Adresgegevens",I.pin,k=>`<p class="subt" style="margin:0">Leeg laten betekent: het hoofdadres en het gewone e-mailadres (${esc(k.email||"nog niet ingevuld")}).</p>
    <div class="secl">Factuuradres</div><div class="grid2"><label class="full">Straat en huisnummer<input id="ka-fa" value="${esc(k.fAdres||"")}" placeholder="${esc(k.adres||"")}"></label><label>Postcode<input id="ka-fp" value="${esc(k.fPostcode||"")}" placeholder="${esc(k.postcode||"")}"></label><label>Plaats<input id="ka-fpl" value="${esc(k.fPlaats||"")}" placeholder="${esc(k.plaats||"")}"></label><label class="full">Beheercode op de factuur<input id="ka-bc" maxlength="60" value="${esc(k.beheercode||"")}" placeholder="Bijvoorbeeld 1334.0001 SVC: 068829"><small class="help">Komt als <b>Beheercode: …</b> onder het adres op elke factuur, ook de periodieke. De klant kan dit ook zelf invullen in het klantportaal.</small></label></div>
    ${[["f","Facturen gaan naar"],["o","Offertes gaan naar"],["p","Planningsmails gaan naar"]].map(([x,l])=>`<div class="secl">${l}</div><div class="grid2"><label>E-mailadres<input id="ka-${x}e" type="email" value="${esc(k[x+"Email"]||"")}" placeholder="${esc(k.email||"")}"></label><label>Ter attentie van<input id="ka-${x}t" value="${esc(k[x+"Tav"]||"")}" placeholder="${esc(cleanName(k.naam))}"></label></div>`).join("")}`,
  ()=>({beheercode:v("ka-bc").replace(/\s+/g," ").slice(0,60),fAdres:v("ka-fa"),fPostcode:v("ka-fp").toUpperCase(),fPlaats:v("ka-fpl"),fEmail:v("ka-fe"),fTav:v("ka-ft"),oEmail:v("ka-oe"),oTav:v("ka-ot"),pEmail:v("ka-pe"),pTav:v("ka-pt")}))}
function kkOpm(kid){
  kkSmall(kid,"Factuurinstructie",I.facturen,k=>`<label>Factuurinstructies <small class="help">komt onderaan op elke factuur</small><textarea id="ko-f" style="min-height:80px" placeholder="Bijv. inkoopnummer 4500123 vermelden">${esc(k.factuurInstructie||"")}</textarea></label>`,
  ()=>({factuurInstructie:$("#ko-f").value.trim()}))}
function kkContact(kid,i){const k=state.klanten.find(x=>x.id===kid);if(!k)return;const c=i>=0?(k.contacten||[])[i]||{}:{};
  kkSmall(kid,i>=0?"Contactpersoon":"Nieuwe contactpersoon",I.user,()=>`<div class="grid2"><label>Naam<input id="kc-n" required value="${esc(c.naam||"")}"></label><label>Functie<input id="kc-f" value="${esc(c.functie||"")}" placeholder="Bijv. beheerder, partner"></label>
    <label>E-mail<input id="kc-e" type="email" value="${esc(c.email||"")}"></label><label>Telefoon<input id="kc-t" type="tel" value="${esc(c.tel||"")}"></label></div>
    ${i>=0?`<button type="button" class="small ghost danger" id="kcDel" style="align-self:flex-start">${I.trash}Verwijderen</button>`:""}`,
  ()=>{const n=$("#kc-n").value.trim();if(!n){$("#kc-n").focus();return null}const l=[...(k.contacten||[])],o={naam:n,functie:$("#kc-f").value.trim(),email:$("#kc-e").value.trim(),tel:$("#kc-t").value.trim()};if(i>=0)l[i]=o;else l.push(o);return {contacten:l}});
  const d=$("#kcDel");if(d)d.onclick=async()=>{const l=[...(k.contacten||[])];l.splice(i,1);try{await save("klanten",kid,{...strip(k),contacten:l});toast("Contactpersoon verwijderd");openKlantView(kid)}catch(er){err(er)}}}
function kkBerichten(kid,mid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;const ids=kkIds(k),alle=state.berichten.filter(m=>ids.includes(m.klantId)).sort((a,b)=>String(b.op).localeCompare(String(a.op)));
  /* vanuit het logboek: alleen dat ene bericht, opengeklapt */
  const een=mid?alle.find(m=>m.id===mid):null,ms=een?[een]:alle;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.send}</span><div style="min-width:0;flex:1"><h3>${een?"Bericht":"Verzonden berichten"}</h3><div class="subt">${esc(cleanName(k.naam))}${een?" · "+esc(KANAAL[een.kanaal]||een.kanaal||"")+" · "+esc(fmtTS(een.op)):" · "+plural(ms.length,"bericht","berichten")}</div></div><button type="button" class="iconbtn" id="kbX" aria-label="Terug">${I.x}</button></div>
    ${!een&&typeof trkTijdlijnHtml==="function"?trkTijdlijnHtml():""}
    <div class="kd-msgs">${ms.map(m=>`<details class="kd-msg"${een?" open":""}><summary class="km"><div class="km-kop"><span class="pill neutral">${esc(KANAAL[m.kanaal]||m.kanaal||"")}</span><span class="km-t">${esc(fmtTS(m.op))}</span>${(st=>statusPill(st[0]==="ok2"?"ok":st[0],st[1]))(MSTAT[mStat(m)]||MSTAT.geopend)}</div><b class="km-ow">${esc(m.onderwerp||String(m.tekst||"").slice(0,70))}</b>${m.naar?`<small class="km-naar">Aan ${esc(m.naar)}</small>`:""}${mailTrk(m)}</summary><p>${esc(m.tekst||"").replace(/\n/g,"<br>")}</p></details>`).join("")||'<p class="subt">Nog geen berichten.</p>'}</div>
    <div class="row">${een&&alle.length>1?`<button type="button" id="kbAlle">Alle berichten (${alle.length})</button>`:""}<span class="sp"></span><button type="button" id="kbB">Terug naar klant</button></div>`,{wide:true});
  if(een&&$("#kbAlle"))$("#kbAlle").onclick=()=>kkBerichten(kid);
  $("#kbX").onclick=$("#kbB").onclick=()=>openKlantView(kid);if(!een&&typeof trkTijdlijnLaad==="function")trkTijdlijnLaad(ids,ms)}
function kkOpenOverzicht(kid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const open=state.facturen.filter(f=>f.klantId===kid&&f.soort!=="offerte"&&["Openstaand","Achterstallig"].includes(fStatus(f)[1])).sort((a,b)=>String(a.datum).localeCompare(String(b.datum)));
  const tot=open.reduce((a,f)=>a+totals(f).inc,0),st=S(),kf=mailK(k,"factuur"),v=klantVars(kf);if(tavK(k,"factuur"))v.klant=tavK(k,"factuur");
  const lijst=open.map(f=>`- ${f.nummer} van ${fmtL(f.datum)}: ${eur(totals(f).inc)} (vervaldatum ${fmtL(f.verval)})`).join("\n");
  const mail=`Beste [name.customer],\n\nVolgens onze administratie staan de volgende facturen nog open:\n\n${lijst}\n\nTotaal: ${eur(tot)}\n\nWilt u dit bedrag overmaken${st.iban?" naar "+st.iban:""} onder vermelding van de factuurnummers? Heeft u al betaald, dan kunt u dit bericht als niet verzonden beschouwen.\n\nMet vriendelijke groet,\n[name.company]`;
  openCompose({title:"Openstaand overzicht",recipients:[{k:kf,vars:v,ref:"openoverzicht:"+kid+":"+iso(today())}],sjabloon:"vrij",kanaal:"email",onderwerp:"Overzicht openstaande facturen – [name.company]",mail,tekst:`Hoi [name.customer], er staan nog ${open.length} facturen open (${eur(tot)}). Zie de mail voor het overzicht. [name.company]`});
}

/* extra info bij een klus op de route: bellen en mee te nemen bedrijfsmiddelen */
function jobExtra(k){if(!k||!k.id)return jobExtra0(k);const t=String(k.taak||"").trim();
  /* taakomschrijving uit de opdracht naast Opgemerkt, in dezelfde omlijning */
  return jobExtra0(k)+(t?`<div class="bv-duo"><div class="bv bv-taak"><div class="bv-h"><span class="eyebrow">${I.pencil}Taakomschrijving</span></div><p class="bv-tt">${esc(t)}</p></div>${bvHtml(k)}</div>`:bvHtml(k))}
function jobExtra0(k){const m=(k.middelen||[]).map(id=>((state.uitv&&state.uitv.middelen)||[]).find(x=>x.id===id)).filter(Boolean);
  return (k.bellen?`<div class="notebox"><span class="eyebrow">Onderweg</span>${I.phone} Bel de klant even voor je aankomt${k.telefoon?" · "+esc(k.telefoon):""}</div>`:"")+(m.length?`<div class="notebox"><span class="eyebrow">Meenemen</span>${m.map(x=>esc(x.naam)).join(", ")}</div>`:"")}

/* klantgegevens aanpassen (zoals in een klantdossier) */
function kkGegevens(kid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;const st=S(),T=tpls();
  const nm=String(k.naam||""),ach=k.achternaam??(isZak(k)?"":nm.includes(",")?nm.split(",")[0].trim():nm),voor=k.voornaam??(!isZak(k)&&nm.includes(",")?nm.split(",").slice(1).join(",").trim():"");
  const sel=(id,opts,v)=>`<select id="${id}">${opts.map(([a,b])=>`<option value="${esc(a)}" ${String(v)===String(a)?"selected":""}>${esc(b)}</option>`).join("")}</select>`;
  const groepen=[...new Set(["Standaard",...state.klanten.map(x=>x.nbGroep).filter(Boolean)])];
  kkSmall(kid,"Klantgegevens",I.user,()=>`<div class="grid2 kg">
    <label>Klantnummer<input id="kg-nr" inputmode="numeric" value="${esc(k.klantnr||"")}" placeholder="${esc(klantNr(k))}"><small class="help">Zelfde als de relatiecode in SnelStart</small></label>
    <label>Type klant${sel("kg-soort",[["particulier","Particulier"],["zakelijk","Zakelijk"],["vve","VvE"]],isZak(k)?k.soort:"particulier")}</label>
    <label>Nieuwsbrief${sel("kg-nb",[["ja","Ja"],["nee","Nee"]],k.nieuwsbrief===false?"nee":"ja")}</label>
    <label>Klantgroep nieuwsbrief<input id="kg-nbg" list="kg-nbl" value="${esc(k.nbGroep||"Standaard")}"><datalist id="kg-nbl">${groepen.map(g=>`<option value="${esc(g)}">`).join("")}</datalist></label>
    <label class="full kg-bedr" ${isZak(k)?"":"hidden"}>Bedrijfsnaam / naam VvE<input id="kg-bedr" value="${esc(isZak(k)?nm:"")}"></label>
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
  </div>`,()=>{const v=id=>$("#"+id).value.trim(),zak=$("#kg-soort").value!=="particulier",voorn=v("kg-voor"),achn=v("kg-ach"),bedr=v("kg-bedr");
    const naam=zak?(bedr||[voorn,achn].filter(Boolean).join(" ")):(achn?achn+(voorn?", "+voorn:""):voorn);
    if(!naam){$(zak?"#kg-bedr":"#kg-ach").focus();toast("Vul een naam in");return null}
    if(!v("kg-adres")){$("#kg-adres").focus();toast("Vul het adres in");return null}
    const telOk=t=>!t||String(t).replace(/\D/g,"").length>=10;if(!telOk(v("kg-tel"))||!telOk(v("kg-mob"))){toast("Een telefoonnummer heeft 10 cijfers");return null}
    const actief=$("#kg-actief").checked;
    return {naam,voornaam:voorn,achternaam:achn,contact:zak?[voorn,achn].filter(Boolean).join(" "):(k.contact||""),klantnr:v("kg-nr"),soort:$("#kg-soort").value,nieuwsbrief:$("#kg-nb").value==="ja",nbGroep:v("kg-nbg")||"Standaard",
      geboortedatum:v("kg-geb"),verjaardagTpl:$("#kg-vtpl").value,geslacht:$("#kg-gesl").value,nieuweKlant:$("#kg-nieuw").value==="ja",maxOpen:Number($("#kg-maxo").value)||0,termijn:Math.max(0,Number(v("kg-term"))||0),
      kvk:v("kg-kvk"),btwnr:v("kg-btw").toUpperCase(),functie:v("kg-fn"),...(zak?{bedrijfsnaam:bedr}:{}),iban:v("kg-iban").toUpperCase(),rekeninghouder:v("kg-rh"),email:v("kg-email"),website:v("kg-web"),telefoon:v("kg-tel"),mobiel:v("kg-mob"),adres:v("kg-adres"),postcode:v("kg-pc").toUpperCase(),plaats:v("kg-pl"),
      actief,...(actief?{}:{gepland:"",tijd:""}),opzegReden:$("#kg-reden").value,geenReview:$("#kg-geenrev").checked}});
  $("#kg-soort").onchange=e=>{const b=form.querySelector(".kg-bedr");if(b)b.hidden=e.target.value==="particulier"};
  const d=$("#kgDel");let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}try{await del("klanten",kid);dlg.close();toast(cleanName(k.naam)+" verwijderd")}catch(er){err(er)}};
}

/* opdracht verwijderen, met keuze voor de toekomstig ingeplande afspraken */
function kkDelOpdracht(kid,oid,back){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const main=oid==="main",o=main?null:(k.opdrachten||[]).find(x=>x.id===oid);if(!main&&!o)return;
  const naam=main?(k.dienst||HD()):o.dienst,extra=(k.opdrachten||[]).filter(x=>x.id!==oid&&x.actief!==false&&!(main&&opdrApart(k,x)));
  const goBack=()=>back==="opdracht"?openOpdrachtWerk(kid):openKlantView(kid);
  openDlg(`<div class="dlg-head"><span class="objic big kd-warn">${I.alert}</span><div style="min-width:0;flex:1"><h3>Verwijderen</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(naam)}</div></div><button type="button" class="iconbtn" id="odX" aria-label="Annuleren">${I.x}</button></div>
    <p style="margin:0;font-size:15px">Weet je zeker dat je deze opdracht wilt verwijderen?</p>
    <label class="check-row"><input type="checkbox" id="od-fut" ${main&&k.gepland?"checked":"checked"}>In de toekomst ingeplande afspraken verwijderen</label>
    ${main?`<p class="help" style="margin:0">${k.gepland?"Er staat een afspraak op "+esc(fmtL(k.gepland))+(k.tijd?" om "+esc(k.tijd):"")+". ":""}${extra.length?"<b>Let op:</b> "+esc(extra.map(x=>x.dienst).join(", "))+" stopt dan ook, want andere diensten worden alleen samen met glasbewassing uitgevoerd. ":""}${(()=>{const bl=(k.opdrachten||[]).filter(x=>x.actief!==false&&opdrApart(k,x));return bl.length?"Deze dienst wordt niet meer aangeboden. <b>"+esc(bl.map(x=>x.dienst).join(", "))+"</b> blijft gewoon lopen, met eigen planning en facturatie.":"De klant blijft in je klantenbestand, maar wordt niet meer aangeboden in de planning."})()} Facturen en de wasgeschiedenis blijven bewaard.</p>`:`<p class="help" style="margin:0">Facturen en de wasgeschiedenis blijven bewaard.</p>`}
    <div class="row"><span class="sp"></span><button type="button" id="odC">Annuleren</button><button type="submit" class="primary danger-bg" id="odS">${I.trash}Verwijderen</button></div>`,{wide:false});
  $("#odX").onclick=$("#odC").onclick=goBack;
  form.onsubmit=async e=>{e.preventDefault();$("#odS").disabled=true;const fut=$("#od-fut").checked,cur=state.klanten.find(x=>x.id===kid)||k;let p={};
    if(!main)p={opdrachten:(cur.opdrachten||[]).filter(x=>x.id!==oid&&opdrBij(cur,x)!==oid)};
    else{/* losse opdrachten (eigen afspraak, bijv. trappenhal van een VvE) blijven gewoon lopen; de klant blijft dan actief */
      const blijf=(cur.opdrachten||[]).filter(x=>x.actief!==false&&opdrApart(cur,x));
      p={opdrachten:(cur.opdrachten||[]).map(x=>blijf.includes(x)?x:{...x,actief:false}),opdrachtVerwijderd:true,aanbieden:false,periodiek:cur.periodiek?{...cur.periodiek,aan:false}:cur.periodiek,...(fut||!cur.gepland?{gepland:"",tijd:"",...(blijf.length?{}:{actief:false})}:{})}}
    try{await save("klanten",kid,{...strip(cur),...p});toast("Opdracht verwijderd"+(fut&&cur.gepland&&main?" · afspraak "+fmtD(cur.gepland)+" vervalt":""));openKlantView(kid)}catch(er){$("#odS").disabled=false;err(er)}};
}
/* nieuwe opdracht bij een klant zonder opdrachten: wordt weer de hoofdopdracht */
/* begint leeg: geen aantallen, prijzen of kozijnen van de verwijderde opdracht; de foto's van de woning blijven bij de klant (zonder stippen) */
/* nieuwe opdracht vanaf de klantkaart: pas echt als je opslaat. Sluit je het werkblad met Annuleren of het kruisje,
   dan gaat de klant terug naar hoe hij was (geen opdracht, niet bij Te plannen). */
var OW_NIEUW=null;
async function owNieuwTerug(kid){const n=OW_NIEUW;if(!n||(kid&&n.kid!==kid))return;OW_NIEUW=null;if(n.bewaard)return;
  const cur=state.klanten.find(x=>x.id===n.kid);if(!cur)return;try{await save("klanten",n.kid,{...strip(cur),...n.prev});toast("Opdracht niet aangemaakt")}catch(e){err(e)}}
if(typeof dlg!=="undefined")dlg.addEventListener("close",()=>{if(OW_NIEUW)owNieuwTerug()});
async function kkNieuweHoofd(kid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const velden=["opdrachtVerwijderd","prospect","actief","dienst","prijs","ramenRegel","ramenTelling","taak","toeslag","toeslagReden","fotos","opdrachten","aanbieden","gepland","tijd"];
  const prev={};velden.forEach(v=>{prev[v]=k[v]===undefined?(v==="opdrachtVerwijderd"||v==="prospect"?false:v==="actief"?true:Array.isArray(k[v])?[]:""):k[v]});
  const oud=((k.ramenTelling||{}).fotos||[]).filter(f=>f&&f.id&&!(k.fotos||[]).some(x=>x.id===f.id)).map(f=>({id:f.id,naam:"Woning (vorige telling)",datum:(k.ramenTelling||{}).datum||iso(today())}));
  try{await save("klanten",kid,{...strip(k),opdrachtVerwijderd:false,prospect:false,actief:true,dienst:HD(),prijs:0,ramenRegel:null,ramenTelling:null,taak:"",toeslag:0,toeslagReden:"",
    fotos:[...(k.fotos||[]),...oud],opdrachten:(k.opdrachten||[]).filter(o=>o.actief!==false)});OW_NIEUW={kid,prev,klaar:true,bewaard:false};setTimeout(()=>openOpdrachtWerk(kid),60)}catch(er){err(er)}}

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

/* ---------- klantkaart: tabbladen en overzicht (nov 2026) ---------- */
const KK_TABS=[["overzicht","Overzicht"],["werk","Werk"],["geld","Financieel"],["klant","Klant"]];
const KK_ALIAS={diensten:"werk",bezoeken:"werk",facturen:"geld",berichten:"klant",gegevens:"klant"};
const KK_TABMAP=[[/^locaties|^opdrachten|ingeplande afspraken|ingeplande bezoeken|^bezoeken|^historie bezoeken/i,"werk"],[/^offertes|facturen/i,"geld"]];
function kkOvTabs(){const t=state.kkTab||"overzicht";return `<nav class="kk-tabs" aria-label="Onderdelen van de klantkaart">${KK_TABS.map(([id,l])=>`<button type="button" class="${t===id?"on":""}" data-kktab="${id}">${({overzicht:I.trend||I.eye,werk:I.checksq||I.check,geld:I.euro||I.facturen,klant:I.user})[id]||""}<span>${l}</span></button>`).join("")}</nav>`}
function kkTabsInit(form){const body=form.querySelector("#kkBody"),ov=form.querySelector("#kkOv");if(!body)return;
  /* nov 2026: klantkaart weer op één pagina; alle blokken zichtbaar, knoppen als "Alle facturen" scrollen naar het blok */
  body.querySelectorAll("section.kp").forEach(sec=>{const h=sec.querySelector(".kp-h>b,.kp-h b,h3,h4");const tt=(h&&h.textContent||"").trim();let tab="klant";for(const [re,t] of KK_TABMAP)if(re.test(tt)){tab=t;break}sec.dataset.kkt=tab;sec.hidden=false});
  if(ov)ov.hidden=false;body.hidden=false;body.dataset.tab="overzicht";body.classList.add("kko-v4","kk-1p");
  const L=body.querySelector(".kk-left"),S=body.querySelector(".kk-side"),tpl=form.querySelector("#kkGast");
  const titel=x=>((x.querySelector(".kp-h b,.kko-h h3")||{}).textContent||"").trim().toLowerCase();
  if(tpl&&L&&!L.querySelector(".kko-gast")){L.appendChild(tpl.content.firstElementChild)}
  const zet=(col,volg)=>{if(!col)return;const secs=[...col.querySelectorAll(":scope>section")];secs.sort((a,b)=>{const ia=volg.findIndex(r=>r.test(titel(a))),ib=volg.findIndex(r=>r.test(titel(b)));return (ia<0?99:ia)-(ib<0?99:ib)}).forEach(x=>col.appendChild(x))};
  /* alles wat over de klant gaat links, alles wat over het werk en geld gaat rechts */
  const all=[...body.querySelectorAll("section.kp")],naarL=/^(betaalgedrag|verzonden berichten|klantgegevens|contactpersonen|adresgegevens|opmerkingen|klantportaal|klantdocumenten|gastvrijheid)/,naarS=/^(opdrachten|overzicht ingeplande|ingeplande bezoeken|historie bezoeken|alle facturen|offertes|locaties|logboek)/;
  all.forEach(x=>{const t=titel(x);if(naarL.test(t)&&x.parentElement!==L)L.appendChild(x);else if(naarS.test(t)&&x.parentElement!==S)S.appendChild(x)});
  zet(L,[/^gastvrijheid/,/^klantgegevens/,/^betaalgedrag/,/^verzonden berichten/,/^contactpersonen/,/^adresgegevens/,/^opmerkingen/,/^klantportaal/,/^klantdocumenten/]);
  zet(S,[/^locaties/,/^opdrachten/,/^(overzicht ingeplande|ingeplande bezoeken)/,/^historie bezoeken/,/^alle facturen/,/^offertes/,/^logboek/]);[...body.children].forEach(c=>c.hidden=false);form.dataset.kktab="overzicht";state.kkTab="overzicht";
  const doel={werk:/historie bezoeken|ingeplande afspraken|ingeplande bezoeken|opdrachten/i,geld:/alle facturen|facturen|offertes/i,klant:/logboek|klantgegevens/i};
  form.querySelectorAll("[data-kktab]").forEach(b=>b.onclick=e=>{e.preventDefault();const t=KK_ALIAS[b.dataset.kktab]||b.dataset.kktab,re=doel[t];if(!re)return;
    const sec=[...body.querySelectorAll("section.kp")].find(x=>re.test((x.querySelector(".kp-h b")||{}).textContent||""));if(sec){sec.scrollIntoView({behavior:"smooth",block:"start"});sec.classList.add("kk-flits");setTimeout(()=>sec.classList.remove("kk-flits"),1400)}})}
function kkOverzicht(k,c){
  const T=iso(today()),dag=d=>{const x=parse(d);return {n:x.getDate(),m:x.toLocaleDateString("nl-NL",{month:"short"}).replace(".","")}};
  const ic=I.checksq||I.check;
  /* diensten als kaarten, met een balk tot de volgende keer */
  const kaart=(o,i)=>{const w=Number(o.frequentie)||52,dagen=w*7;let volg="",pct=0,txt=o.info?o.info[1]:"";
    const vd=i===0&&!k.opdrachtVerwijderd?k.gepland:(k.opdrachten||[]).find(x=>x.id===o.id)?.volgende;
    if(vd){const dd=Math.round((parse(vd)-today())/DAY);pct=Math.max(4,Math.min(100,100-dd/dagen*100));txt=dd<0?"Te laat, gepland "+fmtD(vd):dd===0?"Vandaag":dd<60?"Nog "+dd+" "+(dd===1?"dag":"dagen"):"Volgende keer "+fmtD(vd)}
    let regels="";if(i===0&&!k.opdrachtVerwijderd&&k.ramen&&typeof normR==="function"){try{const q=normR(k.ramen);regels=q.f.map((n,j)=>Number(n)?`${esc(FLN[j]||"")} · ${n} ramen`:"").filter(Boolean).slice(0,3).join("<br>")}catch(e){}}
    if(!regels)regels=esc(o.adr||jobAddr(k))+(o.locn?"<br>"+esc(o.locn):"");
    const eigen=o.info&&/apart|eigen adres/i.test(o.info[1]||"");
    return `<button type="button" class="kko-d${eigen?" eigen":""}" data-act="opdracht" data-id="${esc(k.id)}" data-o="${esc(o.id)}"><span class="kko-dh"><i>${ic}</i><span><b>${esc(o.dienst||"")}</b><small>${esc(freqLabel(w))}</small></span></span><span class="kko-dr">${regels}</span><span class="kko-bar"><i style="width:${pct.toFixed(0)}%"></i></span><small class="kko-dn">${esc(txt||"")}</small><span class="kko-dp"><small>Per keer</small><b>${eur(toonR(k,o))}</b></span></button>`};
  /* tijdlijn: gepland, bezoeken, facturen, berichten en notities door elkaar op datum */
  const L=[];
  if(k.gepland&&k.gepland>=T)L.push({d:k.gepland,s:"plan",t:"Bezoek gepland"+(k.tijd?" · "+k.tijd:""),o:(k.dienst||HD())});
  c.hist.slice(0,8).forEach(b=>L.push({d:b.datum,s:"klaar",t:"Bezoek klaar"+(b.tijd?" · "+b.tijd:""),o:[b.dienst||HD(),b.door||b.medewerker||""].filter(Boolean).join(" · "),r:b.bedrag?eur(b.bedrag):""}));
  c.facs.slice(0,8).forEach(f=>{const st=fStatus(f)[1];L.push({d:st==="Betaald"&&f.betaaldOp?String(f.betaaldOp).slice(0,10):String(f.datum).slice(0,10),s:st==="Betaald"?"geld":"fact",t:"Factuur "+f.nummer+(st==="Betaald"?" betaald":" · "+st.toLowerCase()),o:"",r:eur(totals(f).inc)})});
  c.msgs.slice(0,8).forEach(m=>L.push({d:String(m.op).slice(0,10),s:"mail",t:m.onderwerp||"Bericht verstuurd",o:KANAAL[m.kanaal]||m.kanaal||""}));
  (k.log||[]).slice(-8).forEach(l=>L.push({d:l.datum,s:"note",t:"Notitie",o:String(l.tekst||"").split(/\n/)[0].slice(0,140)}));
  const TI={plan:I.planning,klaar:I.check,geld:I.euro||I.check,fact:I.facturen,mail:I.mail,note:I.note};
  const tl=L.filter(x=>x.d).sort((a,b)=>String(b.d).localeCompare(String(a.d))).slice(0,6);
  const tijdlijn=tl.length?`<div class="kko-tl">${tl.map(x=>{const dd=dag(x.d);return `<div class="kko-tr"><span class="kko-td"><b>${dd.n}</b><small>${esc(dd.m)}</small></span><span class="kko-ti ${x.s}">${TI[x.s]||I.dot||""}</span><span class="kko-tt"><b>${esc(x.t)}</b>${x.o?`<small>${esc(x.o)}</small>`:""}</span>${x.r?`<b class="kko-tb">${x.r}</b>`:""}</div>`}).join("")}</div>`:'<p class="subt" style="margin:0">Nog niets gebeurd bij deze klant.</p>';
  /* rechterkolom */
  const telNr=k.telefoon||k.mobiel,tl2=t=>String(t||"").replace(/[^\d+]/g,"");
  const CM={kennisgeving:"Krijgt een kennisgeving",bevestigen:"Krijgt een afspraakvoorstel",bellen:"Wil gebeld worden"};
  const afs=[k.bellen?["Belt onderweg vooraf",1]:null,CM[k.contactPlanning]&&k.contactPlanning!=="kennisgeving"?[CM[k.contactPlanning]]:null,[k.incasso?"Automatische incasso":"Betaalt per bank"],k.einddatum?["Contract tot "+fmtD(k.einddatum)]:null,k.ronde?["Ronde "+k.ronde]:null,k.termijn?["Betaaltermijn "+k.termijn+" dagen"]:null].filter(Boolean);
  const voork=[Number(k.toeslag)?"Toeslag "+k.toeslag+"%":"Geen toeslag",k.btwVerlegd?"btw verlegd":"btw normaal",k.verbergAantal?"aantallen verborgen":"",k.verbergFreq?"ritme verborgen":""].filter(Boolean).join(" · ");
  const addBtn=!heeftGlas(k)?`data-kk="opdrfirst"`:`data-act="opdracht" data-id="${esc(k.id)}" data-o="new"`;
  /* compact dossier (nov 2026): alles wat je dagelijks zoekt zonder te klikken, in twee kolommen */
  const rij=(at,links,titel,sub,rechts,extra="")=>`<div class="kko-tr kko-rij"${at?" "+at+' tabindex="0" role="button"':""}>${links}<span class="kko-tt"><b>${titel}</b>${sub?`<small>${sub}</small>`:""}</span>${rechts?`<span class="kko-tb">${rechts}</span>`:"<span></span>"}${extra}</div>`;
  const dt=d=>{const x=dag(d);return `<span class="kko-td"><b>${x.n}</b><small>${esc(x.m)}</small></span>`};
  const meer=(tab,t)=>`<button type="button" class="kko-meer" data-kktab="${tab}">${t}</button>`;
  const opRows=c.opdr.map((o,i)=>{const vd=i===0&&!k.opdrachtVerwijderd?k.gepland:(k.opdrachten||[]).find(x=>x.id===o.id)?.volgende;
    return rij(`data-act="opdracht" data-id="${esc(k.id)}" data-o="${esc(o.id)}"`,`<span class="kko-ic">${ic}</span>`,esc(o.dienst||""),esc(freqLabel(Number(o.frequentie)||52))+(vd?" · volgende "+esc(fmtD(vd)):o.info?" · "+esc(o.info[1]):""),eur(toonR(k,o)))}).join("");
  const pil=(k_,t)=>`<span class="pill ${k_}">${t}</span>`;
  const bzRows=[k.gepland?rij(`data-act="opdracht" data-id="${esc(k.id)}" data-o="main"`,dt(k.gepland),esc(k.dienst||HD()),esc(wd(parse(k.gepland)))+(k.tijd?" · "+esc(k.tijd):""),pil(parse(k.gepland)<today()?"late":"plan",parse(k.gepland)<today()?"Niet gedaan":"Gepland")):"",
    ...c.hist.slice(0,3).map(b=>rij(`data-act="beurtinfo" data-id="${esc(b.id)}"`,dt(b.datum),esc(b.dienst||HD()),[b.tijd,b.door||b.medewerker].filter(Boolean).map(esc).join(" · ")||"Gedaan",Number(b.bedrag)?eur(b.bedrag):""))].join("");
  const fRows=c.facs.slice(0,3).map(f=>{const st=fStatus(f);return rij(`data-act="factuur" data-id="${esc(f.id)}"`,dt(f.datum),"Factuur "+esc(f.nummer||""),pil(st[0],esc(st[1])),eur(totals(f).inc))}).join("");
  const openS=c.openF.reduce((a,f)=>a+Math.max(0,totals(f).inc-(Number(f.deelBetaald)||0)),0);
  const kv=(l,v)=>v?`<div class="kko-kv"><span>${l}</span><b>${v}</b></div>`:"",kvi=(ic,l,v)=>v?`<div class="kko-kv kko-kvi"><i>${ic}</i><span>${l}</span><b>${v}</b></div>`:"";
  const tl5=tl.slice(0,5);
  /* briefing voor het volgende bezoek: wat moet de glazenwasser weten als hij aanbelt */
  const hl=typeof hospList==="function"?hospList(k):[],hc=c_=>hl.filter(x=>x.c===c_);
  const brief=[["aankomst","Aankomst en toegang",I.lock],["dier","Huisdieren",I.paw||I.alert],["letop","Let op",I.alert],["voorkeur","Voorkeur",I.heart||I.note]].map(([c_,l,ic])=>hc(c_).length?`<div class="kb-r"><span class="kb-ic">${ic}</span><span class="kb-t"><small>${l}</small><b>${hc(c_).map(x=>esc(x.t)).join(" · ")}</b></span></div>`:"").join("");
  const praat=hl.filter(x=>x.c==="verteld"&&(typeof hospNu!=="function"||hospNu(x)));
  const gp=k.gepland?parse(k.gepland):null;
  const briefing=`<section class="kko-s kko-brief"><div class="kko-h"><span class="objic">${I.planning}</span><div class="kko-ht"><h3>${gp?"Volgende bezoek":"Bezoek"}</h3><small>Briefing voor bij de deur</small></div>${gp?`<span class="kb-dag">${esc(wd(gp))} ${gp.getDate()} ${esc(gp.toLocaleDateString("nl-NL",{month:"long"}))}${k.tijd?" · "+esc(k.tijd):""}</span>`:`<button type="button" class="kko-k" data-act="opdracht" data-id="${esc(k.id)}" data-o="main">${I.plus}Inplannen</button>`}</div>
      ${praat.length?`<div class="kb-praat"><span>${I.chat}</span><div><small>Ter sprake brengen</small><b>${praat.map(x=>esc(x.t)).join(" · ")}</b></div></div>`:""}
      ${brief||(!praat.length?`<p class="kb-leeg">Nog geen bijzonderheden voor bij de deur. Noteer bij Gastvrijheid hoe de klant het graag heeft: toegang, huisdieren, voorkeuren.</p>`:"")}
      ${c.hist[0]?`<div class="kb-vor"><small>Vorige keer</small><span>${esc(fmtD(c.hist[0].datum))}${c.hist[0].door||c.hist[0].medewerker?" · "+esc(c.hist[0].door||c.hist[0].medewerker):""}${c.hist.length>1?` · ${c.hist.length} bezoeken in totaal`:""}</span>${meer("werk","Alle bezoeken")}</div>`:""}</section>`;
  return `<div class="kko kko-v3 kko-v4 kko-v5" id="kkOv"><div class="kko-top">    <section class="kko-s kko-gast kko-gast-top"><div class="kko-h"><span class="objic">${I.heart||I.note}</span><div class="kko-ht"><h3>Hospitality aandachtspunten</h3><small>Wat we over deze klant weten</small></div><button type="button" class="kko-k kk-vulpen" data-act="hospedit" data-id="${esc(k.id)}" aria-label="Aandachtspunten aanpassen" title="Aanpassen"><svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true"><defs><linearGradient id="vpLak" x1="0" x2="1"><stop offset="0" stop-color="#0f131c"/><stop offset=".35" stop-color="#3a4560"/><stop offset=".55" stop-color="#1c2231"/><stop offset="1" stop-color="#0b0e15"/></linearGradient><linearGradient id="vpGoud" x1="0" x2="1"><stop offset="0" stop-color="#8a6a32"/><stop offset=".4" stop-color="#f3dca0"/><stop offset=".6" stop-color="#c9a45a"/><stop offset="1" stop-color="#7a5a26"/></linearGradient><linearGradient id="vpPunt" x1="0" x2="1"><stop offset="0" stop-color="#9c7a3c"/><stop offset=".45" stop-color="#f7e6b5"/><stop offset=".55" stop-color="#e2c27a"/><stop offset="1" stop-color="#8a6a30"/></linearGradient></defs><g transform="rotate(42 24 24)"><path d="M20.2 4.6c0-1.6 1.7-2.9 3.8-2.9s3.8 1.3 3.8 2.9V27h-7.6z" fill="url(#vpLak)"/><path d="M22 4.4c.1-1 .9-1.6 1.7-1.7v23.8H22z" fill="#fff" opacity=".18"/><path d="M27.6 6.2h1.1c.5 0 .8.3.8.8v11.6c0 .6-.4 1.1-1 1.3l-.9.3z" fill="url(#vpGoud)"/><circle cx="29" cy="19.4" r=".9" fill="url(#vpGoud)"/><rect x="19.9" y="22.4" width="8.2" height="1.6" rx=".4" fill="url(#vpGoud)"/><rect x="19.9" y="27" width="8.2" height="1.4" rx=".4" fill="url(#vpGoud)"/><path d="M20.4 28.4h7.2l-.6 3.2h-6z" fill="url(#vpLak)"/><path d="M20.8 31.6h6.4c.2 3.6-.9 7.6-3.2 14.2-2.3-6.6-3.4-10.6-3.2-14.2z" fill="url(#vpPunt)"/><path d="M24 45.6v-8.8" stroke="#5c4418" stroke-width=".7" stroke-linecap="round"/><circle cx="24" cy="36.2" r="1" fill="#5c4418"/><path d="M22.1 33.2c.3 2.6.9 5 1.6 7.4" stroke="#fff" stroke-width=".5" opacity=".55" stroke-linecap="round" fill="none"/></g></svg></button></div>${typeof hospBlok==="function"?hospBlok(k,{leegKnop:true}):""}</section></div></div>`}
