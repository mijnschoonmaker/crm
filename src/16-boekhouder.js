/* ---------- Boekhouder: omzet (verkoopboek) en uren naar de boekhouder, in het importformaat van SnelStart ----------
   Het verkoopboek gaat als CSV met de SnelStart-veldnamen (FldDagboek, FldBoekingcode, FldDatum, FldGrootboeknummer, FldDebet,
   FldCredit, FldRelatiecode, FldFactuurnummer, fldOmschrijving): per factuur een hoofdboeking op het verkoopdagboek, een
   omzetregel en een btw-regel. Grootboekrekeningen per klanttype en btw-tarief stel je in bij Instellingen. */
const BH_TYPES=[["particulier","Particulier"],["zakelijk","Zakelijk"],["vve","VVE / Overheid"]];
const BH_GB=[["verlegd","Grootboekrekening omzet verlegd","8050"],["omzet0","Grootboekrekening omzet 0%",""],["omzet9","Grootboekrekening omzet 9%","8010"],["omzet21","Grootboekrekening omzet 21%","8000"],["btw9","Grootboekrekening BTW 9%","3100"],["btw21","Grootboekrekening BTW 21%","3101"],["aanmaning","Aanmaningskosten",""]];
const BH_DEF={bhSalaris:"maand",bhAangifte:"kwartaal",bhPakket:"snelstart",bhDagboekBank:"1300",bhDagboekKas:"1300",bhVerkoopboek:"1300",bhDebiteuren:"1300",bhBtw0:"10",bhBtwLaag:"11",bhBtwHoog:"12",bhBtwVerlegd:"10"};
const bhS=k=>{const v=S()[k];return v==null||v===""?(BH_DEF[k]??""):String(v)};
const bhGb=(type,veld)=>{const v=S()["bhGb_"+type+"_"+veld];if(v!=null&&v!=="")return String(v);const d=BH_GB.find(x=>x[0]===veld);return d?d[2]:""};
const bhType=k=>k&&k.soort==="vve"?"vve":k&&k.soort==="zakelijk"?"zakelijk":"particulier";
const bhLog=()=>Array.isArray((state.boekhouder||{}).items)?state.boekhouder.items:[];
const bhD=iso=>{const d=parse(iso);return d?pad(d.getDate())+"-"+pad(d.getMonth()+1)+"-"+d.getFullYear():""};
const bhN=x=>(Math.round((Number(x)||0)*100)/100).toFixed(2).replace(".",",");
state.bhVan=state.bhVan||iso(new Date(today().getFullYear(),today().getMonth(),1));state.bhTot=state.bhTot||iso(today());

/* verkoopboek: alle definitieve facturen met factuurdatum in de periode */
function bhVerkoopboek(van,tot){
  const fs=echteFacturen().filter(f=>f.datum>=van&&f.datum<=tot).sort((a,b)=>String(a.datum).localeCompare(String(b.datum))||String(a.nummer).localeCompare(String(b.nummer),"nl",{numeric:true}));
  const rows=[],kop=["FldDagboek","FldBoekingcode","FldDatum","FldGrootboeknummer","FldDebet","FldCredit","FldRelatiecode","FldFactuurnummer","fldOmschrijving","BtwCode"];
  let code=Number(String(Date.now()).slice(-6));const fout=[];
  fs.forEach(f=>{const k=state.klanten.find(x=>x.id===f.klantId),t=bhType(k),T=totals(f),pct=Number(f.btw??S().btw);
    const rel=k?klantNr(k):"",nr=String(f.nummer||f.id),oms=(f.klantNaam||(k&&cleanName(k.naam))||"")+" · "+nr,dat=bhD(f.datum);
    const omzetGb=f.btwVerlegd||k&&k.btwVerlegd?bhGb(t,"verlegd"):pct===0?bhGb(t,"omzet0"):pct===9?bhGb(t,"omzet9"):bhGb(t,"omzet21");
    const btwGb=pct===9?bhGb(t,"btw9"):pct===21?bhGb(t,"btw21"):"";
    const btwCode=f.btwVerlegd||k&&k.btwVerlegd?bhS("bhBtwVerlegd"):pct===0?bhS("bhBtw0"):pct===9?bhS("bhBtwLaag"):bhS("bhBtwHoog");
    if(!omzetGb)fout.push(nr+": geen grootboekrekening omzet "+pct+"% voor "+t);
    if(T.btw>0&&!btwGb)fout.push(nr+": geen grootboekrekening btw "+pct+"%");
    code++;
    rows.push([bhS("bhVerkoopboek"),code,dat,bhS("bhDebiteuren"),bhN(T.inc),bhN(0),rel,nr,oms,btwCode]);
    rows.push([bhS("bhVerkoopboek"),code,dat,omzetGb,bhN(0),bhN(T.ex),rel,nr,oms,btwCode]);
    if(T.btw>0)rows.push([bhS("bhVerkoopboek"),code,dat,btwGb,bhN(0),bhN(T.btw),rel,nr,oms,btwCode]);
  });
  const csv=[kop,...rows].map(r=>r.map(x=>{x=String(x??"");return /[;"\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x}).join(";")).join("\r\n");
  return{fs,rows,csv,fout,omzet:fs.reduce((a,f)=>a+totals(f).inc,0)};
}
/* uren: werkdagen (vertrek loods tot terug) met pauze, bij klanten en reistijd */
function bhUren(van,tot){
  const dagen=Object.keys(state.routes||{}).filter(d=>d>=van&&d<=tot&&(state.routes[d]||{}).werk&&state.routes[d].werk.start).sort();
  const kop=["Datum","Medewerker","Start","Stop","Pauze (min)","Gewerkt (min)","Bij klanten (min)","Reistijd (min)","Adressen","Omzet"];
  const naam=(state.me&&state.me.name)||S().naam||"";
  const rows=dagen.map(d=>{const c=wdCijfers(d);const tt=x=>x?new Date(x).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):"";return[bhD(d),naam,tt(c.w.start),tt(c.w.stop),Math.round(c.pauze),Math.round(c.netto),Math.round(c.fact),Math.round(c.reis),c.n,bhN(c.omzet)]});
  return{rows,csv:[kop,...rows].map(r=>r.join(";")).join("\r\n"),min:rows.reduce((a,r)=>a+(Number(r[5])||0),0)};
}
function bhDownload(naam,tekst){const bl=new Blob(["﻿"+tekst],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(bl),a=document.createElement("a");a.href=u;a.download=naam;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
const bhB64=t=>btoa(unescape(encodeURIComponent("﻿"+t)));
async function bhLogZet(item){const items=[{op:new Date().toISOString(),...item},...bhLog()].slice(0,300);try{await save("instellingen","boekhouder",{items});state.boekhouder={items}}catch(e){err(e)}}
async function bhMail(soort,naar,bijlagen,onderwerp,tekst,oms){
  if(!LIVE)return toast("Mailen werkt in de live versie");
  if(!/^\S+@\S+\.\S+$/.test(naar||""))return toast("Vul een geldig e-mailadres in");
  try{toast("Versturen…");await fbFn("sendMail")({naar,naam:"Boekhouder",onderwerp,tekst,bijlagen,meta:{klantNaam:"Boekhouder",sjabloon:"boekhouder"}});
    await bhLogZet({type:soort,omschrijving:oms,naar,bijlagen:bijlagen.map(b=>b.naam)});toast("Verstuurd naar "+naar);render()}catch(e){toast(fnFout(e))}
}
function bhPeriodeTxt(van,tot){return bhD(van)+" tm "+bhD(tot)}

function vBoekhouder(){
  const sub=state.bhtab||"overzichten",van=state.bhVan,tot=state.bhTot,s=S();
  let html=`<div class="bh-tabs seg">${[["overzichten","Overzichten"],["instellingen","Instellingen"]].map(([v,l])=>`<button type="button" data-act="bhtab" data-v="${v}" aria-pressed="${sub===v}">${l}</button>`).join("")}</div>`;
  if(sub==="instellingen"){
    const inpS=(k,l,ph="")=>`<label>${l}<input data-bh="${k}" value="${esc(bhS(k))}" placeholder="${esc(ph)}" inputmode="numeric"></label>`;
    const inpM=(k,l)=>`<label>${l}<input data-bh="${k}" type="email" value="${esc(bhS(k))}" placeholder="boekhouder@kantoor.nl"></label>`;
    html+=`<div class="bh-grid">
      <section class="panel bh-p"><h3>${I.building||I.user}Bedrijfsgegevens</h3>
        <label>Salaris per<select data-bh="bhSalaris">${[["maand","Maand"],["4weken","4 weken"],["week","Week"]].map(([v,l])=>`<option value="${v}"${bhS("bhSalaris")===v?" selected":""}>${l}</option>`).join("")}</select></label>
        <label>Aangifte per<select data-bh="bhAangifte">${[["maand","Maand"],["kwartaal","Kwartaal"],["jaar","Jaar"]].map(([v,l])=>`<option value="${v}"${bhS("bhAangifte")===v?" selected":""}>${l}</option>`).join("")}</select></label>
        <label>Boekhoudpakket<select data-bh="bhPakket"><option value="snelstart">SnelStart</option></select></label>
        ${inpS("bhDagboekBank","Dagboekcode bank")}${inpS("bhDagboekKas","Dagboekcode kas")}${inpS("bhVerkoopboek","Verkoopboek (dagboekcode)")}${inpS("bhDebiteuren","Grootboekrekening debiteuren","1300")}
        ${inpM("bhMailOmzet","Accountant e-mailadres omzet")}${inpM("bhMailUren","Accountant e-mailadres uren")}${inpM("bhMailInkoop","Accountant e-mailadres inkoopfacturen")}${inpM("bhMailBank","Accountant e-mailadres bankbestanden")}
        <label>Werkgeversnummer<input data-bh="bhWerkgever" value="${esc(bhS("bhWerkgever"))}"></label>
      </section>
      <div class="bh-col">
      <section class="panel bh-p"><h3>${I.boekhouding}Grootboekrekeningen</h3>
        <div class="bh-gb"><div class="bh-gbh">${BH_TYPES.map(([v,l])=>`<b>${l}</b>`).join("")}</div>
        ${BH_GB.map(([veld,l])=>`<div class="bh-gbl">${esc(l)}</div><div class="bh-gbr">${BH_TYPES.map(([t])=>`<input data-bh="bhGb_${t}_${veld}" value="${esc(S()["bhGb_"+t+"_"+veld]??"")}" placeholder="${esc(BH_GB.find(x=>x[0]===veld)[2])}" inputmode="numeric" aria-label="${esc(l)} ${t}">`).join("")}</div>`).join("")}</div>
      </section>
      <section class="panel bh-p"><h3>${I.bank||I.boekhouding}BTW-codes</h3>
        ${inpS("bhBtw0","BTW-code 0%")}${inpS("bhBtwLaag","BTW-code laag")}${inpS("bhBtwHoog","BTW-code hoog")}${inpS("bhBtwVerlegd","BTW-code verlegd")}
      </section></div></div>
      <div class="row" style="margin-top:14px"><button type="button" class="primary" data-act="bhsave">${I.check}Opslaan</button></div>`;
    return html;
  }
  const vb=bhVerkoopboek(van,tot),ur=bhUren(van,tot),log=bhLog();
  const per=(v,t)=>`<div class="bh-per"><label>Datum vanaf<input type="date" data-bhd="van" value="${esc(v)}"></label><label>Datum t/m<input type="date" data-bhd="tot" value="${esc(t)}"></label></div>`;
  const snel=[["Deze maand",iso(new Date(today().getFullYear(),today().getMonth(),1)),iso(today())],["Vorige maand",iso(new Date(today().getFullYear(),today().getMonth()-1,1)),iso(new Date(today().getFullYear(),today().getMonth(),0))],["Dit kwartaal",iso(new Date(today().getFullYear(),Math.floor(today().getMonth()/3)*3,1)),iso(today())],["Vorig kwartaal",iso(new Date(today().getFullYear(),Math.floor(today().getMonth()/3)*3-3,1)),iso(new Date(today().getFullYear(),Math.floor(today().getMonth()/3)*3,0))]];
  html+=`<div class="chips bh-snel">${snel.map(([l,a,b])=>`<button type="button" class="chip" data-act="bhper" data-van="${a}" data-tot="${b}" aria-pressed="${van===a&&tot===b}">${l}</button>`).join("")}</div>
  <div class="bh-grid3">
    <section class="panel bh-p"><h3>${I.euro||I.bank}Omzetperiode</h3>${per(van,tot)}
      <div class="bh-sum"><span><b>${vb.fs.length}</b> facturen</span><span><b>${eur(vb.omzet)}</b> incl. btw</span><span><b>${vb.rows.length}</b> boekingsregels</span></div>
      ${vb.fout.length?`<div class="notice" style="margin:0">${vb.fout.slice(0,4).map(esc).join("<br>")}${vb.fout.length>4?"<br>…":""}<br><button type="button" class="linkbtn" data-act="bhtab" data-v="instellingen">Grootboekrekeningen instellen</button></div>`:""}
      <label>E-mailadres<input type="email" id="bhMail1" value="${esc(bhS("bhMailOmzet"))}" placeholder="boekhouder@kantoor.nl"></label>
      <div class="row"><button type="button" class="primary" data-act="bhmailomzet" ${vb.fs.length?"":"disabled"}>${I.mail}E-mail naar boekhouder</button><button type="button" data-act="bhdlomzet" ${vb.fs.length?"":"disabled"}>${I.dl}Download CSV</button></div>
      <small class="help">SnelStart-importbestand: per factuur een hoofdboeking, omzetregel en btw-regel (Boekhouden › Importeren › Boekingen).</small>
    </section>
    <section class="panel bh-p"><h3>${I.clock}Urenperiode</h3>${per(van,tot)}
      <div class="bh-sum"><span><b>${ur.rows.length}</b> werkdagen</span><span><b>${Math.floor(ur.min/60)}u${pad(ur.min%60)}</b> gewerkt</span></div>
      <label>E-mailadres<input type="email" id="bhMail2" value="${esc(bhS("bhMailUren"))}" placeholder="boekhouder@kantoor.nl"></label>
      <div class="row"><button type="button" class="primary" data-act="bhmailuren" ${ur.rows.length?"":"disabled"}>${I.mail}E-mail naar boekhouder</button><button type="button" data-act="bhdluren" ${ur.rows.length?"":"disabled"}>${I.dl}Download CSV</button></div>
      <small class="help">Uit je werkdagen (Vandaag › Start werkdag): vertrek, terug, pauze, bij klanten en reistijd.</small>
    </section>
    <section class="panel bh-p"><h3>${I.paperclip||I.file||I.mail}Versturen bestanden</h3>
      <p class="subt" style="margin:0">Kies het bestand dat je wilt verzenden, bijvoorbeeld een inkoopfactuur of bankbestand.</p>
      <label>Omschrijving bestand<input id="bhOms" placeholder="Bijv. inkoopfacturen september"></label>
      <label>Bestand(en)<input type="file" id="bhFile" multiple></label>
      <label>E-mailadres<input type="email" id="bhMail3" value="${esc(bhS("bhMailInkoop")||bhS("bhMailBank"))}" placeholder="boekhouder@kantoor.nl"></label>
      <div class="row"><button type="button" class="primary" data-act="bhmailfile">${I.mail}E-mail naar boekhouder</button></div>
    </section>
  </div>
  <section class="panel bh-p" style="margin-top:14px"><h3>${I.send}Verstuurde overzichten</h3>
    ${log.length?`<table class="minitable bh-log"><thead><tr><th>Datum verstuurd</th><th>Type</th><th>Omschrijving</th><th>Verstuurd naar</th></tr></thead><tbody>${log.slice(0,30).map(x=>`<tr><td>${esc(bhD(x.op.slice(0,10)))} · ${esc(x.op.slice(11,16))}</td><td>${esc(x.type)}</td><td>${esc(x.omschrijving)}</td><td>${esc(x.naar)}</td></tr>`).join("")}</tbody></table>`:`<p class="subt" style="margin:0">Nog niets verstuurd.</p>`}
  </section>`;
  return html;
}
async function bhActie(a,t){
  const van=state.bhVan,tot=state.bhTot,p=bhPeriodeTxt(van,tot);
  if(a==="bhtab"){state.bhtab=t.dataset.v;render()}
  else if(a==="bhper"){state.bhVan=t.dataset.van;state.bhTot=t.dataset.tot;render()}
  else if(a==="bhsave"){const patch={};document.querySelectorAll("[data-bh]").forEach(e=>patch[e.dataset.bh]=e.value.trim());if(await saveSettings(patch,"Boekhouder-instellingen opgeslagen"))render()}
  else if(a==="bhdlomzet"){bhDownload(`verkoopboek_${van}_${tot}.csv`,bhVerkoopboek(van,tot).csv)}
  else if(a==="bhdluren"){bhDownload(`uren_${van}_${tot}.csv`,bhUren(van,tot).csv)}
  else if(a==="bhmailomzet"){const vb=bhVerkoopboek(van,tot),naar=($("#bhMail1")||{}).value;
    await bhMail("Omzet",naar,[{naam:`verkoopboek_${van}_${tot}.csv`,data:bhB64(vb.csv)}],`Omzet ${p} – ${S().naam||"mijnschoonmaker"}`,`Beste boekhouder,\n\nIn de bijlage het verkoopboek van ${p} als SnelStart-importbestand: ${vb.fs.length} facturen, ${eur(vb.omzet)} incl. btw.\n\nMet vriendelijke groet,\n${S().naam||""}`,`Omzet ${p}`)}
  else if(a==="bhmailuren"){const ur=bhUren(van,tot),naar=($("#bhMail2")||{}).value;
    await bhMail("Uren",naar,[{naam:`uren_${van}_${tot}.csv`,data:bhB64(ur.csv)}],`Uren ${p} – ${S().naam||"mijnschoonmaker"}`,`Beste boekhouder,\n\nIn de bijlage de uren van ${p}: ${ur.rows.length} werkdagen.\n\nMet vriendelijke groet,\n${S().naam||""}`,`Uren ${p}`)}
  else if(a==="bhmailfile"){const inp=$("#bhFile"),naar=($("#bhMail3")||{}).value,oms=($("#bhOms")||{}).value.trim()||"Bestanden";const files=[...((inp&&inp.files)||[])];
    if(!files.length)return toast("Kies eerst een bestand");if(files.some(f=>f.size>8e6))return toast("Een bestand is groter dan 8 MB");
    const bijl=[];for(const f of files){const b64=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(String(fr.result).split(",")[1]||"");fr.readAsDataURL(f)});bijl.push({naam:f.name,data:b64})}
    await bhMail("Bestanden",naar,bijl,`${oms} – ${S().naam||"mijnschoonmaker"}`,`Beste boekhouder,\n\nIn de bijlage: ${oms} (${files.map(f=>f.name).join(", ")}).\n\nMet vriendelijke groet,\n${S().naam||""}`,oms)}
}
document.addEventListener("change",e=>{const t=e.target;if(t&&t.dataset&&t.dataset.bhd){if(t.dataset.bhd==="van")state.bhVan=t.value;else state.bhTot=t.value;render()}});
