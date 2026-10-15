/* ---------- FACTUUR-WERKBLAD: klant, adres, opties, details, regels, voettekst en logboek ---------- */
function openFactuurWerk(id){
  const f=state.facturen.find(x=>x.id===id);if(!f)return;
  if(f.soort==="offerte")return openFactuurOud(id);
  const k=state.klanten.find(x=>x.id===f.klantId),st=fStatus(f),s=S(),t=totals(f),btw=Number(f.btw??s.btw),incl=f.incl??s.incl;
  const kv=(a,b)=>`<div class="ow-kv"><span>${a}</span><b>${b||"—"}</b></div>`;
  const mail=e=>e?`<a href="mailto:${esc(e)}">${esc(e)}</a>`:"",tel=x=>x?`<a href="tel:${esc(String(x).replace(/[^\d+]/g,""))}">${esc(x)}</a>`:"";
  const dt=x=>x?esc(fmtL(String(x).slice(0,10)))+(String(x).length>10&&String(x).includes("T")?" · "+new Date(x).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):""):"—";
  const bg=k?betaalgedrag(state.facturen.filter(x=>x.klantId===k.id)):null;
  const credit=f.creditVan?state.facturen.find(x=>x.id===f.creditVan):null,creditN=state.facturen.find(x=>x.creditVan===f.id);
  const W={contant:"Contant",pin:"Pin",overmaken:"Per bank",incasso:"Automatische incasso",mollie:"Mollie"};
  const opt=(ic,lbl,act,date,cls="")=>`<tr><td>${act?`<button type="button" class="linkbtn fw-opt ${cls}" data-fw="${act}">${ic}${lbl}</button>`:`<span class="fw-opt plain">${ic}${lbl}</span>`}</td><td class="r">${date||"—"}</td></tr>`;
  const betaaldMet=w=>f.status==="betaald"&&(f.betaalwijze||"overmaken")===w?dt(f.betaaldOp):"";
  const rv=invRows(f,k);
  const regRows=(f.regels||[]).map((r,i)=>{const p=Number(r.prijs)||0,a=Number(r.aantal)||0,ex=(incl?p/(1+btw/100):p),exT=ex*a;return `<tr><td>${esc(omsZonderDatum(r.omschrijving))}<br><small class="subt">Datum: ${esc(fmtNum(f.datum).replace(/ /g,""))}</small></td><td class="r">${a.toLocaleString("nl-NL")}</td><td class="r">${eur(ex)}</td><td class="r">${eur(exT)}</td><td class="r">${eur(exT*btw/100)}</td><td class="r">${eur(exT*(1+btw/100))}</td><td class="r fw-ro"><button type="button" class="iconbtn sm" data-fwr="${i}" aria-label="Regel aanpassen">${I.pencil}</button><button type="button" class="iconbtn sm" data-fwd="${i}" aria-label="Regel verwijderen">${I.x}</button></td></tr>`}).join("");
  const log=[{d:f.gemaakt||f.datum,t:"Factuur aangemaakt"},f.verstuurdOp&&{d:f.verstuurdOp,t:"Factuur verstuurd"},f.herinnerdOp&&{d:f.herinnerdOp,t:"Herinnering verstuurd"+(Number(f.herinneringen)>1?" ("+f.herinneringen+"e)":"")},f.status==="betaald"&&{d:f.betaaldOp,t:"Betaald · "+(W[f.betaalwijze]||"per bank")},f.status==="oninbaar"&&{d:f.oninbaarOp,t:"Op oninbaar gezet"},creditN&&{d:creditN.datum,t:"Gecrediteerd met "+creditN.nummer},
    ...state.berichten.filter(m=>String(m.ref||"").includes(f.id)).map(m=>({d:m.op,t:(KANAAL[m.kanaal]||"Bericht")+": "+(m.onderwerp||"")})),...(f.log||[]).map(l=>({d:l.datum,t:l.tekst}))].filter(x=>x&&x.d).sort((a,b)=>String(b.d).localeCompare(String(a.d)));
  openDlg(`<div class="dlg-head"><span class="objic big">${I.facturen}</span><div style="min-width:0;flex:1"><h3>Factuur ${esc(f.nummer)}</h3><div class="subt">${esc(cleanName(f.klantNaam))} · ${eur(t.inc)}${f.periodiek?" · periodiek":""}${credit?" · creditfactuur van "+esc(credit.nummer):""}</div></div>${statusPill(st[0],st[1])}<button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="kk-acts">${f.status==="concept"?`<button type="button" class="small primary" data-fw="definitief">${I.check}Maak definitief</button>`:""}${st[1]!=="Betaald"&&f.status!=="concept"?`<button type="button" class="small good" data-fw="bank">${I.check}Betaald</button>`:""}<button type="button" class="small yellow" data-fw="send">${I.send}${st[1]==="Achterstallig"?"Stuur herinnering":"Versturen"}</button>${state.dl?`<button type="button" class="small" data-act="pdf" data-id="${esc(f.id)}">${I.dl}PDF downloaden</button>`:""}<button type="button" class="small" data-fw="bekijk">${I.eye}Bekijk factuur</button>${k?`<button type="button" class="small" data-fw="klant">${I.user}Klantkaart</button>`:""}</div>
  <div class="kk-grid kd"><div class="kk-left">
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Klantgegevens</b><span class="sp"></span>${k?`<button type="button" class="iconbtn sm" data-fw="klant" aria-label="Naar klantkaart" title="Klantkaart">${I.right}</button>`:""}</div>
      ${k?`${k.soort==="zakelijk"?kv("Bedrijfsnaam",esc(cleanName(k.naam))):""}${kv("Voornaam",esc(k.voornaam||""))}${kv("Achternaam",esc(k.achternaam||(k.soort==="zakelijk"?"":cleanName(k.naam))))}${kv("E-mailadres",mail(k.email))}${kv("Telefoon",tel(k.telefoon))}${kv("Mobiel",tel(k.mobiel))}
      ${payBlok(bg)}`:kv("Klant",esc(cleanName(f.klantNaam))+' <small class="subt">(niet meer in je klantenbestand)</small>')}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.pin}</span><b>Adresgegevens</b><span class="sp"></span><button type="button" class="iconbtn sm" data-fw="adres" aria-label="Adres op factuur aanpassen">${I.pencil}</button></div>
      ${k?kv("Werklocatie",esc(jobAddr(k))):""}${kv("Factuuradres",esc(f.klantAdres||""))}${kv("Facturen gaan naar",mail(f.klantEmail)+(f.tav||(k&&tavK(k,"factuur"))?`<br><small class="subt">t.a.v. ${esc(f.tav||tavK(k,"factuur"))}</small>`:""))}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.checksq||I.check}</span><b>Factuuropties</b></div>
      <table class="minitable fw-opts"><tr><th>Actie</th><th class="r">Datum</th></tr>
        ${opt(I.eye,"Bekijk factuur","bekijk","")}
        ${opt(I.spark,"Factuur aangemaakt","",dt(f.gemaakt||f.datum))}
        ${f.creditVan?"":opt(I.refresh,"Creditfactuur aanmaken",creditN?"":"credit",creditN?`<button type="button" class="linkbtn" data-act="factuur" data-id="${esc(creditN.id)}">${esc(creditN.nummer)}</button>`:"")}
        ${opt(I.copy,"Factuur dupliceren","dupl","")}
        ${opt(I.euro,"Contant betaald","contant",betaaldMet("contant"))}
        ${opt(I.euro,"Per pin betaald","pin",betaaldMet("pin"))}
        ${opt(I.euro,"Per bank betaald","bank",betaaldMet("overmaken")||betaaldMet("incasso"))}
        ${opt(I.euro,"Openstaand","open",f.status==="open"&&st[1]!=="Achterstallig"?"nu":"")}
        ${opt(I.mail,"Verstuur factuur","send",dt(f.verstuurdOp)==="—"?"":dt(f.verstuurdOp))}
        ${opt(I.mail,"Verstuur herinnering","herinner",f.herinnerdOp?dt(f.herinnerdOp):"")}
        ${f.soort!=="offerte"&&f.status!=="betaald"?opt(I.alert||I.mail,"WIK-brief versturen (laatste aanmaning)","wikbrief",f.wikOp?dt(f.wikOp):"Incassokosten "+eur(wikKosten(totals(f).inc))):""}
        ${opt(I.x,"Op oninbaar zetten","oninbaar",f.status==="oninbaar"?dt(f.oninbaarOp):"","danger")}
      </table></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.facturen}</span><b>Factuurdetails</b><span class="sp"></span><button type="button" class="iconbtn sm" data-fw="bekijk" aria-label="Bekijken" title="Bekijken">${I.eye}</button><button type="button" class="iconbtn sm" data-fw="details" aria-label="Details aanpassen">${I.pencil}</button></div>
      ${kv("Factuurnummer",esc(f.nummer))}${kv("Type factuur",f.creditVan?"Creditfactuur":f.periodiek?"Periodiek":"Normaal")}${kv("Factuurdatum",esc(fmtL(f.datum)))}${kv("Uiterste betaaldatum",esc(fmtL(f.verval)))}${kv("Betaalwijze",esc(W[f.betaalwijze]||"Per bank"))}
      ${kv("Btw",btw+"%"+(btw===0&&/verlegd/i.test(f.notitie||"")?" (verlegd)":"")+(incl?" · prijzen incl.":" · prijzen excl."))}${kv("Bedrag betaald",f.status==="betaald"?eur(f.betaaldBedrag!=null&&f.betaaldBedrag!==""?f.betaaldBedrag:t.inc):"")}${kv("Datum betaald",f.betaaldOp?esc(fmtL(f.betaaldOp)):"")}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.upload}</span><div style="min-width:0"><b>Meesturen bestanden</b><small>Foto's komen in de PDF; andere bestanden voeg je toe in je mail</small></div><span class="sp"></span>${state.assets?`<label class="iconbtn sm" title="Foto maken" aria-label="Foto maken">${I.camera}<input type="file" accept="image/*" capture="environment" hidden data-fwcam="${esc(f.id)}"></label><label class="iconbtn sm primary" title="Bestand toevoegen" aria-label="Bestand toevoegen">${I.plus}<input type="file" hidden multiple id="fwBij"></label>`:""}</div>
      ${factFotos(f).length||(f.bijlagen||[]).some(b=>b.soort==="foto")?`<div class="fw-fotos">${(f.bijlagen||[]).map((b,i)=>b.soort!=="foto"?"":`<div class="fw-foto${b.opFactuur===false?" uit":""}"><button type="button" class="bv-open" data-act="fotokijk" data-bron="factuur" data-id="${esc(f.id)}" data-i="${i}" aria-label="Foto bekijken"><img src="${BLOB}${esc(b.id)}" alt="" loading="lazy"></button><div><b>${esc(b.notitie||"Foto")}</b><small>${esc(fmtD(b.datum||f.datum))} · ${b.opFactuur===false?"niet op factuur":"staat op de factuur"}</small></div><span class="fw-fa"><button type="button" class="iconbtn sm" data-fwft="${i}" title="${b.opFactuur===false?"Op factuur zetten":"Niet op factuur"}" aria-label="Op factuur aan/uit">${b.opFactuur===false?I.eye:I.check}</button><button type="button" class="iconbtn sm" data-fwb="${i}" aria-label="Verwijderen">${I.x}</button></span></div>`).join("")}</div>`:""}
      ${(f.bijlagen||[]).some(b=>b.soort!=="foto")?`<table class="minitable">${f.bijlagen.map((b,i)=>b.soort==="foto"?"":`<tr><td><a href="${BLOB}${esc(b.id)}" target="_blank" rel="noopener"><b>${esc(b.naam)}</b></a></td><td class="r" style="white-space:nowrap"><a class="iconbtn sm" href="${BLOB}${esc(b.id)}" download="${esc(b.naam)}" aria-label="Downloaden">${I.dl}</a><button type="button" class="iconbtn sm" data-fwb="${i}" aria-label="Verwijderen">${I.x}</button></td></tr>`).join("")}</table>`:""}${(f.bijlagen||[]).length?"":'<p class="subt" style="margin:0">Er zijn geen bestanden geüpload. Foto\'s van bijzonderheden komen als extra pagina in de PDF.</p>'}</section>
  </div><div class="kk-side">
    <section class="kp"><div class="kp-h"><span class="objic">${I.note}</span><b>Notitie</b><span class="sp"></span><button type="button" class="iconbtn sm" data-fw="notitie" aria-label="Notitie aanpassen">${I.pencil}</button></div>
      <div id="fwNot">${f.notitie?`<p class="fw-txt">${esc(f.notitie).replace(/\n/g,"<br>")}</p>`:'<p class="subt" style="margin:0">Geen notitie. Een notitie komt als opmerking op de factuur.</p>'}</div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.receipt}</span><b>Factuurregels</b><span class="sp"></span><button type="button" class="small primary" data-fw="regel">${I.plus}Factuurregel</button></div>
      <div class="tablewrap fw-tw"><table class="t fw-reg"><thead><tr><th>Omschrijving</th><th class="r">Aantal</th><th class="r">Per stuk</th><th class="r">Excl.</th><th class="r">Btw</th><th class="r">Incl.</th><th></th></tr></thead>
        <tbody>${regRows||'<tr><td colspan="7" class="subt">Nog geen regels</td></tr>'}</tbody><tfoot><tr><td><b>Totaal</b></td><td></td><td></td><td class="r"><b>${eur(t.ex)}</b></td><td class="r"><b>${eur(t.btw)}</b></td><td class="r"><b>${eur(t.inc)}</b></td><td></td></tr></tfoot></table></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.facturen}</span><b>Voettekst factuur</b></div>
      <p class="fw-txt">${esc(rv.betaal)}</p>${rv.vwTxt?`<p class="fw-txt">${esc(rv.vwTxt)}</p>`:""}<small class="help">Wordt automatisch gemaakt uit het bedrag, de vervaldatum en je bedrijfsgegevens (Instellingen).</small></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.chat}</span><b>Logboek</b></div>
      <div class="log">${log.map(l=>`<div><span>${dt(l.d)}</span>${esc(l.t)}</div>`).join("")}</div>
      <div style="display:flex;gap:8px"><input id="fw-log" placeholder="Bijv. klant belt terug over de factuur"><button type="button" class="small" id="fwLog">Noteer</button></div></section>
  </div></div>
  <div class="row"><button type="button" class="ghost danger" id="delF">Factuur verwijderen</button><span class="sp"></span><button type="button" data-act="close">Sluiten</button></div>`,{xwide:true});
  const re=()=>{const y=dlg.scrollTop;openFactuurWerk(id);dlg.scrollTop=y};
  const cur=()=>state.facturen.find(x=>x.id===id)||f;
  const put=async(p,msg)=>{await save("facturen",id,{...strip(cur()),...p});if(msg)toast(msg);setTimeout(re,40)};
  const beurtenBetaald=async on=>{for(const b of state.beurten.filter(b=>b.gefactureerd===id))await save("beurten",b.id,{...strip(b),betaald:on})};
  const act={
    bekijk:()=>openFactuurOud(id,true),
    klant:()=>k&&openKlantView(k.id),
    definitief:()=>put({status:"open"},"Factuur is definitief"),
    contant:async()=>{await beurtenBetaald(true);put({status:"betaald",betaalwijze:"contant",betaaldOp:iso(today())},"Contant betaald")},
    pin:async()=>{await beurtenBetaald(true);put({status:"betaald",betaalwijze:"pin",betaaldOp:iso(today())},"Per pin betaald")},
    bank:async()=>{await beurtenBetaald(true);put({status:"betaald",betaalwijze:cur().betaalwijze==="incasso"?"incasso":"overmaken",betaaldOp:iso(today())},"Per bank betaald")},
    open:async()=>{await beurtenBetaald(false);put({status:"open",betaaldOp:"",oninbaarOp:""},"Factuur staat weer open")},
    oninbaar:()=>put({status:"oninbaar",oninbaarOp:iso(today())},"Op oninbaar gezet; er gaan geen herinneringen meer uit"),
    send:()=>sendF(id,{direct:true,btn:form.querySelector('[data-fw="send"]')}),
    herinner:()=>sendF(id,{herinnering:true}),
    wikbrief:()=>sendF(id,{wik:true}),
    dupl:async()=>{const n=cur(),d=iso(today()),nid=newId("f");const nf={...strip(n),nummer:nextNr("factuur",d),datum:d,verval:iso(addDays(today(),Math.max(1,Math.round((parse(n.verval)-parse(n.datum))/DAY))||14)),status:"concept",betaaldOp:"",verstuurdOp:"",herinnerdOp:"",herinneringen:0,oninbaarOp:"",gemaakt:new Date().toISOString(),log:[],creditVan:"",periodiek:false};
      try{await save("facturen",nid,nf);toast("Kopie gemaakt · "+nf.nummer);setTimeout(()=>openFactuurWerk(nid),60)}catch(er){err(er)}},
    credit:async()=>{const n=cur(),d=iso(today()),nid=newId("f");const nf={...strip(n),nummer:nextNr("factuur",d),datum:d,verval:d,regels:(n.regels||[]).map(r=>({...r,prijs:-(Number(r.prijs)||0)})),status:"open",betaaldOp:"",verstuurdOp:"",herinnerdOp:"",herinneringen:0,oninbaarOp:"",gemaakt:new Date().toISOString(),log:[],creditVan:n.id,periodiek:false,notitie:"Creditfactuur voor factuur "+n.nummer};
      try{await save("facturen",nid,nf);toast("Creditfactuur "+nf.nummer+" gemaakt");setTimeout(()=>openFactuurWerk(nid),60)}catch(er){err(er)}},
    adres:()=>fwSmall(id,"Adres op de factuur",I.pin,`<label>Factuuradres<input id="fa-a" value="${esc(cur().klantAdres||"")}"><small class="help">Zoals het op deze factuur komt, bijv. "Kamperfoelie 3, 9351XT Leek"</small></label><div class="grid2"><label>Facturen gaan naar<input id="fa-e" type="email" value="${esc(cur().klantEmail||"")}"></label><label>Ter attentie van<input id="fa-t" value="${esc(cur().tav||(k&&tavK(k,"factuur"))||"")}"></label></div>`,()=>({klantAdres:$("#fa-a").value.trim(),klantEmail:$("#fa-e").value.trim(),tav:$("#fa-t").value.trim()})),
    notitie:()=>fwSmall(id,"Notitie",I.note,`<label>Notitie <small class="help">komt als opmerking op de factuur</small><textarea id="fn-n" style="min-height:120px">${esc(cur().notitie||"")}</textarea></label>`,()=>({notitie:$("#fn-n").value.trim()})),
    details:()=>{const n=cur();fwSmall(id,"Factuurdetails",I.facturen,`<div class="grid2"><label>Factuurnummer<input id="fd-nr" value="${esc(n.nummer)}"></label><label>Betaalwijze<select id="fd-bw">${Object.entries(W).map(([v,l])=>`<option value="${v}" ${(n.betaalwijze||"overmaken")===v?"selected":""}>${l}</option>`).join("")}</select></label>
      <label>Factuurdatum<input id="fd-d" type="date" value="${esc(n.datum)}"></label><label>Uiterste betaaldatum<input id="fd-v" type="date" value="${esc(n.verval)}"></label>
      <label>Btw-tarief<select id="fd-btw">${[21,9,0].map(v=>`<option value="${v}" ${Number(n.btw??s.btw)===v?"selected":""}>${v}%</option>`).join("")}</select></label><label class="check-row" style="align-self:end"><input type="checkbox" id="fd-incl" ${(n.incl??s.incl)?"checked":""}>Prijzen zijn incl. btw</label>
      <label>Bedrag betaald<span class="ow-in"><i>€</i><input id="fd-bb" type="number" step="0.01" value="${esc(n.betaaldBedrag??"")}" placeholder="${esc(totals(n).inc.toFixed(2))}"></span></label><label>Datum betaald<input id="fd-bd" type="date" value="${esc(n.betaaldOp||"")}"><small class="help">Invullen = factuur is betaald</small></label></div>`,
      ()=>{const nr=$("#fd-nr").value.trim();if(!nr){toast("Vul een factuurnummer in");return null}if(nr!==n.nummer&&state.facturen.some(x=>x.id!==id&&x.nummer===nr)){toast("Dit factuurnummer bestaat al");return null}
        const bd=$("#fd-bd").value;return {nummer:nr,betaalwijze:$("#fd-bw").value,datum:$("#fd-d").value||n.datum,verval:$("#fd-v").value||n.verval,btw:Number($("#fd-btw").value),incl:$("#fd-incl").checked,betaaldBedrag:$("#fd-bb").value===""?"":Number($("#fd-bb").value),betaaldOp:bd,...(bd?{status:"betaald"}:n.status==="betaald"?{status:"open"}:{})}})},
    regel:()=>fwRegel(id,-1)
  };
  form.querySelectorAll("[data-fw]").forEach(b=>b.onclick=e=>{e.preventDefault();const fn=act[b.dataset.fw];if(fn)fn()});
  form.querySelectorAll("[data-fwr]").forEach(b=>b.onclick=()=>fwRegel(id,+b.dataset.fwr));
  form.querySelectorAll("[data-fwd]").forEach(b=>b.onclick=()=>{const r=[...(cur().regels||[])];if(r.length<=1)return toast("Een factuur heeft minimaal één regel");r.splice(+b.dataset.fwd,1);put({regels:r},"Regel verwijderd")});
  form.querySelectorAll("[data-fwft]").forEach(b=>b.onclick=()=>{const l=[...(cur().bijlagen||[])],i=+b.dataset.fwft;l[i]={...l[i],opFactuur:l[i].opFactuur===false};put({bijlagen:l},l[i].opFactuur===false?"Foto staat niet op de factuur":"Foto staat op de factuur")});
  form.querySelectorAll("[data-fwb]").forEach(b=>b.onclick=()=>{const l=[...(cur().bijlagen||[])];l.splice(+b.dataset.fwb,1);put({bijlagen:l},"Bestand verwijderd")});
  const bj=$("#fwBij");if(bj)bj.onchange=async e=>{const files=[...e.target.files];e.target.value="";const l=[...(cur().bijlagen||[])];for(const x of files){try{const r=await state.assets.upload(x);l.push({id:r.id,naam:x.name})}catch(er){toast(x.name+" kon niet worden toegevoegd")}}put({bijlagen:l},plural(files.length,"bestand","bestanden")+" toegevoegd")};
  $("#fwLog").onclick=()=>{const v=$("#fw-log").value.trim();if(!v)return;put({log:[...(cur().log||[]),{datum:new Date().toISOString(),tekst:v}]})};
  const d=$("#delF");let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}
    try{for(const b of state.beurten.filter(b=>b.gefactureerd===f.id))await save("beurten",b.id,{...strip(b),gefactureerd:""});await del("facturen",f.id);dlg.close();toast(f.nummer+" verwijderd")}catch(er){err(er)}};
}
function fwSmall(id,title,ic,body,read){
  const f=state.facturen.find(x=>x.id===id);if(!f)return;
  openDlg(`<div class="dlg-head"><span class="objic big">${ic}</span><div style="min-width:0;flex:1"><h3>${title}</h3><div class="subt">Factuur ${esc(f.nummer)}</div></div><button type="button" class="iconbtn" id="fwX" aria-label="Terug">${I.x}</button></div>
    ${body}<div class="row"><span class="sp"></span><button type="button" id="fwB">Annuleren</button><button type="submit" class="primary" id="fwS">${I.check}Opslaan</button></div>`,{wide:true});
  $("#fwX").onclick=$("#fwB").onclick=()=>openFactuurWerk(id);
  form.onsubmit=async e=>{e.preventDefault();const p=read();if(!p)return;$("#fwS").disabled=true;
    try{const cur=state.facturen.find(x=>x.id===id)||f;await save("facturen",id,{...strip(cur),...p});toast("Opgeslagen");setTimeout(()=>openFactuurWerk(id),40)}catch(er){$("#fwS").disabled=false;err(er)}};
}
function fwRegel(id,i){const f=state.facturen.find(x=>x.id===id);if(!f)return;const r=i>=0?f.regels[i]:{omschrijving:"",aantal:1,prijs:""},incl=f.incl??S().incl;
  const ds=(typeof dienstLijst==="function"?dienstLijst():[]).flatMap(d=>d.items&&d.items.length?d.items.map(it=>({naam:d.items.length>1?d.naam+" – "+it.naam:d.naam,prijs:it.prijs})):d.glas?[]:[d]);
  fwSmall(id,i>=0?"Factuurregel aanpassen":"Factuurregel toevoegen",I.receipt,`${i<0&&ds.length?`<div class="chips" style="margin:0">${ds.map((d,j)=>`<button type="button" class="chip" data-fdn="${j}">${I.plus}${esc(d.naam)}</button>`).join("")}</div>`:""}
    <label>Omschrijving<input id="fr-o" value="${esc(r.omschrijving||"")}" required></label>
    <div class="grid2"><label>Aantal<input id="fr-a" type="number" step="0.01" value="${esc(r.aantal??1)}"></label><label>Prijs per eenheid (${incl?"incl.":"excl."} btw)<span class="ow-in"><i>€</i><input id="fr-p" type="number" step="0.01" value="${esc(r.prijs??"")}"></span></label></div>`,
  ()=>{const o=$("#fr-o").value.trim();if(!o){$("#fr-o").focus();return null}const l=[...(f.regels||[])],n={omschrijving:o,aantal:Number($("#fr-a").value)||0,prijs:Number($("#fr-p").value)||0};if(i>=0)l[i]={...l[i],...n};else l.push(n);return {regels:l}});
  form.querySelectorAll("[data-fdn]").forEach(b=>b.onclick=()=>{const d=ds[+b.dataset.fdn];$("#fr-o").value=d.naam;const p=Number(d.prijs)||0;$("#fr-p").value=incl?r2(p*(1+(Number(f.btw??S().btw)||0)/100)):p});
}

/* ---------- FOTO'S VAN BIJZONDERHEDEN (op locatie) ----------
   Gemaakt bij de klus; gaan als foto-pagina mee in de PDF van de factuur van die beurt. */
const BV_ZIJDE=["Voorzijde","Achterzijde","Linkerzijde","Rechterzijde","Dak","Binnen"];
const bvZijdeHtml=()=>`<div class="bv-zijde"><span>Welke zijde van de woning?</span><div class="seg bv-zs" role="group">${BV_ZIJDE.map(z=>`<button type="button" data-bvz="${z}" aria-pressed="false">${z}</button>`).join("")}</div></div>`;
const bvZijdeBind=()=>form.querySelectorAll("[data-bvz]").forEach(b=>b.onclick=()=>{const on=b.getAttribute("aria-pressed")!=="true";form.querySelectorAll("[data-bvz]").forEach(x=>x.setAttribute("aria-pressed","false"));b.setAttribute("aria-pressed",String(on))});
const bvZijde=()=>{const b=form.querySelector('[data-bvz][aria-pressed="true"]');return b?b.dataset.bvz:""};
const BV_SNEL=["Verf laat los van het kozijn","Dakpan ligt los","Ruit is gebarsten","Dakgoot zit vol of lekt","Houtrot in het kozijn","Kitvoeg is los","Vogelnest of overlast","Schade aan het glas"];
const fotoInput=(attr,label)=>state.assets?`<label class="btn small bv-cam">${I.camera}${label||"Foto bijzonderheid"}<input type="file" accept="image/*" capture="environment" hidden ${attr}></label>`:"";
function bvHtml(k){const l=k.bevindingen||[];
  return `<div class="bv"><div class="bv-h"><span class="eyebrow">${I.camera}Opgemerkt</span>${fotoInput(`data-bvk="${esc(k.id)}"`)}</div>
    ${l.length?`<div class="bv-list">${l.map((b,i)=>`<div class="bv-it"><button type="button" class="bv-open" data-act="fotokijk" data-bron="klant" data-id="${esc(k.id)}" data-i="${i}" aria-label="Foto bekijken"><img src="${BLOB}${esc(b.id)}" alt="" loading="lazy"></button><button type="button" class="bv-txt" data-act="fotokijk" data-bron="klant" data-id="${esc(k.id)}" data-i="${i}">${esc(b.notitie||"Foto")}</button><button type="button" class="iconbtn sm" data-act="bvdel" data-id="${esc(k.id)}" data-i="${i}" aria-label="Verwijderen">${I.x}</button></div>`).join("")}</div><small class="help">Gaat als foto mee met de factuur van deze beurt</small>`:`<small class="help">Iets bijzonders gezien, zoals een losse dakpan of verf die van het kozijn afgaat? Maak een foto; die komt bij de factuur.</small>`}</div>`}
/* na afmelden: is er al een factuur van vandaag voor deze klant? dan direct daaraan koppelen */
function bvFactuurVandaag(k){const b=state.beurten.find(x=>x.klantId===k.id&&x.datum===iso(today())&&x.gefactureerd&&x.gefactureerd!=="periodiek");return b?state.facturen.find(f=>f.id===b.gefactureerd&&f.status!=="betaald"):null}
async function bvUpload(kid,file){const k=state.klanten.find(x=>x.id===kid);if(!k||!file)return;
  file=await fotoAnnoteren(file);if(!file)return;
  const back=dlg.open&&$("#jobPanel")?{job:$("#jobPanel").dataset.k,d:$("#jobPanel").dataset.d}:null;
  let r;try{toast("Foto uploaden…");r=await state.assets.upload(file)}catch(e){return toast("De foto kon niet worden geüpload")}
  const url=URL.createObjectURL(file);
  openDlg(`<div class="dlg-head"><span class="objic big">${I.camera}</span><div style="min-width:0;flex:1"><h3>Wat viel op?</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(jobAddr(k))}</div></div></div>
    <img src="${url}" alt="" class="bv-prev">
    ${bvZijdeHtml()}
    <div class="chips" style="margin:0">${BV_SNEL.map(t=>`<button type="button" class="chip" data-bvt="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <label>Toelichting voor de klant<textarea id="bv-n" style="min-height:80px" placeholder="Bijv. aan de achterkant laat de verf los van het kozijn van de slaapkamer"></textarea></label>
    <div class="row"><span class="sp"></span><button type="button" id="bvC">Annuleren</button><button type="submit" class="primary" id="bvS">${I.check}Opslaan bij de factuur</button></div>`,{wide:true});
  form.querySelectorAll("[data-bvt]").forEach(b=>b.onclick=()=>{const t=$("#bv-n");t.value=t.value?t.value+". "+b.dataset.bvt:b.dataset.bvt;t.focus()});bvZijdeBind();
  const done=()=>{URL.revokeObjectURL(url);if(back)openJob(back.job,back.d);else dlg.close()};
  $("#bvC").onclick=done;
  form.onsubmit=async e=>{e.preventDefault();$("#bvS").disabled=true;const item={id:r.id,naam:file.name||"foto.jpg",soort:"foto",notitie:$("#bv-n").value.trim(),zijde:bvZijde(),datum:iso(today())};
    try{const f=bvFactuurVandaag(k);
      if(f){await save("facturen",f.id,{...strip(f),bijlagen:[...(f.bijlagen||[]),item]});toast("Foto toegevoegd aan factuur "+f.nummer)}
      else{const cur=state.klanten.find(x=>x.id===kid)||k;await save("klanten",kid,{...strip(cur),bevindingen:[...(cur.bevindingen||[]),item]});toast("Foto bewaard; gaat mee met de factuur")}
      done()}catch(er){$("#bvS").disabled=false;err(er)}};
}
async function fotoData(id){try{const r=await fetch(BLOB+id);if(!r||!r.ok)return null;const bl=await r.blob(),url=URL.createObjectURL(bl);
  const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
  const s=Math.min(1,1400/Math.max(im.naturalWidth,im.naturalHeight)),cv=document.createElement("canvas");cv.width=Math.round(im.naturalWidth*s);cv.height=Math.round(im.naturalHeight*s);
  cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(url);return {data:cv.toDataURL("image/jpeg",.82),w:cv.width,h:cv.height}}catch(e){return null}}
const factFotos=f=>(f.bijlagen||[]).filter(b=>b.soort==="foto"&&b.opFactuur!==false);

async function fwCamUpload(fid,file){const f=state.facturen.find(x=>x.id===fid);if(!f)return;file=await fotoAnnoteren(file);if(!file)return;let r;try{toast("Foto uploaden…");r=await state.assets.upload(file)}catch(e){return toast("De foto kon niet worden geüpload")}
  fwSmall(fid,"Wat viel op?",I.camera,`<img src="${BLOB}${esc(r.id)}" alt="" class="bv-prev">${bvZijdeHtml()}<div class="chips" style="margin:0">${BV_SNEL.map(t=>`<button type="button" class="chip" data-bvt="${esc(t)}">${esc(t)}</button>`).join("")}</div><label>Toelichting voor de klant<textarea id="bv-n" style="min-height:80px"></textarea></label>`,
    ()=>({bijlagen:[...((state.facturen.find(x=>x.id===fid)||f).bijlagen||[]),{id:r.id,naam:file.name||"foto.jpg",soort:"foto",notitie:$("#bv-n").value.trim(),zijde:bvZijde(),datum:iso(today())}]}));
  form.querySelectorAll("[data-bvt]").forEach(b=>b.onclick=()=>{const t=$("#bv-n");t.value=t.value?t.value+". "+b.dataset.bvt:b.dataset.bvt;t.focus()});bvZijdeBind()}
