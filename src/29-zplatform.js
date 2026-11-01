/* ---------- Mansard-platform (alleen voor de eigenaar van Mansard) ----------
   De Mollie-sleutel waarmee nieuwe bedrijven hun abonnement betalen, en de afzender voor hun mails.
   Sleutels plak je hier zelf; ze gaan rechtstreeks naar de server en komen nooit terug in het scherm. */
const platformEigenaar=()=>{try{return LIVE&&["robin@mansard.nl","robin@mijnschoonmaker.com"].includes(String((firebase.auth().currentUser||{}).email||"").toLowerCase())}catch(e){return false}};
let PLAT=null;
async function platLaad(){if(!platformEigenaar()||typeof fbFn!=="function")return;try{PLAT=(await fbFn("platformSleutels")({})).data||null;const el=document.querySelector('[data-v="platform"]');if(el&&state.tab==="instellingen")render()}catch(e){PLAT={fout:typeof fnFout==="function"?fnFout(e):e.message}}}
SETCARDS.push({id:"platform",t:"Mansard-platform",sub:"Abonnementen en mail voor nieuwe bedrijven",ic:"shield",bg:"#252c3c",
  st:()=>{if(!PLAT){setTimeout(platLaad,0);return["soon","Laden…"]}if(PLAT.fout)return["soon","Niet gelukt"];return PLAT.mollie==="live"&&PLAT.afzender?["ok","Klaar voor nieuwe bedrijven"]:["soon","Nog niet ingesteld"]},
  rows:()=>PLAT&&!PLAT.fout?[["Mollie Mansard",PLAT.mollie==="live"?"Live":PLAT.mollie==="test"?"Testsleutel":"Niet ingesteld"],["Afzender",PLAT.afzender||"Niet ingesteld"]]:[["Status","—"]],
  warn:()=>PLAT&&!PLAT.fout&&(!PLAT.mollie||!PLAT.afzender)?"Zolang dit niet is ingesteld, kunnen nieuwe bedrijven geen abonnement afsluiten en geen mail versturen via Mansard.":"",v:"Instellen"});
SETEXTRA.platform=c=>{const P=PLAT||{};
  setDlg(c,`${info("Alleen jij ziet dit. Nieuwe bedrijven betalen hun abonnement via het Mollie-account van <b>Mansard</b>, en mails die ze zonder eigen Brevo versturen gaan uit vanaf een afzender van <b>Mansard</b>. Zonder deze gegevens wordt nooit iets van mijnschoonmaker gebruikt: dan staat abonneren en mailen voor nieuwe bedrijven gewoon nog dicht.")}
    ${sec("Abonnementen (Mollie van Mansard)")}<p class="subt" style="margin:0 0 8px">Nu: <b>${P.mollie==="live"?"live sleutel ingesteld":P.mollie==="test"?"testsleutel ingesteld":"niet ingesteld"}</b></p>
    ${inp("_pmk","Nieuwe Mollie API-sleutel (live_… of test_…)","",{type:"password",attrs:'autocomplete="off"',cls:"full",ph:"Plak hier de sleutel uit het Mollie-dashboard van Mansard",help:"Laat leeg om de huidige te houden."})}
    ${sec("Mail voor nieuwe bedrijven")}${inp("_paf","Afzender (in Brevo goedgekeurd)",P.afzender||"",{type:"email",ph:"noreply@mansard.nl"})}${inp("_pan","Naam afzender (optioneel)",P.afzenderNaam||"",{ph:"Leeg = naam van het bedrijf zelf"})}
    ${inp("_pbk","Eigen Brevo-sleutel voor Mansard (optioneel)","",{type:"password",attrs:'autocomplete="off"',cls:"full",ph:"xkeysib-…",help:P.brevo?"Er staat al een eigen Brevo-sleutel. Laat leeg om die te houden.":"Leeg = de mail gaat via het Brevo-account dat al gekoppeld is, maar wel vanaf het adres hierboven."})}
    ${sec("Eigen bussen")}<div id="platBus"><p class="subt" style="margin:0">Laden…</p></div>
    ${sec("Facturen Mansard (voor je boekhouding)")}<div id="platFact"><p class="subt" style="margin:0">Laden…</p></div>`,
    {foot:`<span class="sp"></span><button type="button" class="ghost" data-act="close">Sluiten</button><button type="button" class="primary" id="platBew">${I.check}Opslaan</button>`});
  platFacturen();platBus();
  form.querySelector("#platBew").onclick=async()=>{const g=id=>(form.querySelector(`[data-k="${id}"]`)||{}).value||"";const b=form.querySelector("#platBew");b.disabled=true;
    try{PLAT=(await fbFn("platformSleutels")({actie:"zet",mansardMollieKey:g("_pmk"),platformAfzender:g("_paf"),platformAfzenderNaam:g("_pan"),platformBrevoKey:g("_pbk")})).data;toast("Opgeslagen");dlg.close();render()}
    catch(e){toast(typeof fnFout==="function"?fnFout(e):e.message);b.disabled=false}}};

/* alle abonnementsfacturen van Mansard: per maand bekijken, PDF downloaden en als CSV exporteren voor de boekhouder */
async function platFacturen(){const el=form.querySelector("#platFact");if(!el)return;let L=[];
  try{L=((await fbFn("platformFacturen")({})).data||{}).facturen||[]}catch(e){el.innerHTML=`<p class="subt" style="margin:0">${esc(typeof fnFout==="function"?fnFout(e):e.message)}</p>`;return}
  if(!L.length){el.innerHTML=`<p class="subt" style="margin:0">Nog geen facturen. Zodra een bedrijf betaalt, staat de factuur hier (nummers MAN-jaar-volgnummer).</p>`;return}
  const maanden=[...new Set(L.map(f=>String(f.datum).slice(0,7)))].sort().reverse();let m=maanden[0];
  const csvCel=v=>{const t=String(v??"");return /[;"\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t},getal=n=>(Math.round((Number(n)||0)*100)/100).toFixed(2).replace(".",",");
  const teken=()=>{const R=L.filter(f=>m==="alle"||String(f.datum).startsWith(m)),som=k=>R.reduce((a,f)=>a+(Number(f[k])||0),0);
    el.innerHTML=`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><select id="pfM">${["alle",...maanden].map(x=>`<option value="${x}"${x===m?" selected":""}>${x==="alle"?"Alle maanden":esc(MAANDEN[Number(x.slice(5,7))-1]+" "+x.slice(0,4))}</option>`).join("")}</select><span class="sp"></span><button type="button" class="small" id="pfCsv">${I.dl||""}CSV voor boekhouder</button></div>
      <table class="minitable"><tr><th>Nummer</th><th>Datum</th><th>Bedrijf</th><th style="text-align:right">Excl.</th><th style="text-align:right">Btw</th><th style="text-align:right">Incl.</th><th></th></tr>${R.map(f=>`<tr><td><b>${esc(f.nummer)}</b></td><td>${esc(fmtD(f.datum))}</td><td>${esc(f.klant)}</td><td style="text-align:right">${eur(f.excl)}</td><td style="text-align:right">${eur(f.btw)}</td><td style="text-align:right">${eur(f.incl)}</td><td style="text-align:right"><button type="button" class="tiny" data-pff="${esc(f.bid)}|${esc(f.id)}">PDF</button></td></tr>`).join("")}
      <tr><td colspan="3"><b>Totaal ${R.length} ${R.length===1?"factuur":"facturen"}</b></td><td style="text-align:right"><b>${eur(som("excl"))}</b></td><td style="text-align:right"><b>${eur(som("btw"))}</b></td><td style="text-align:right"><b>${eur(som("incl"))}</b></td><td></td></tr></table>`;
    el.querySelector("#pfM").onchange=e=>{m=e.target.value;teken()};
    el.querySelector("#pfCsv").onclick=()=>{const rij=["Factuurnummer","Factuurdatum","Klant","Omschrijving","Periode","Bedrag excl. btw","Btw 21%","Bedrag incl. btw","Betaalwijze","Mollie-betaling"].join(";");
      const tekst="\ufeff"+[rij,...R.slice().sort((a,b)=>String(a.nummer).localeCompare(String(b.nummer))).map(f=>[f.nummer,f.datum,f.klant,f.oms,f.periode,getal(f.excl),getal(f.btw),getal(f.incl),f.methode,f.mollieId].map(csvCel).join(";"))].join("\r\n");
      const u=URL.createObjectURL(new Blob([tekst],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=u;a.download="mansard-facturen-"+(m==="alle"?"alle":m)+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)};
    el.querySelectorAll("[data-pff]").forEach(b=>b.onclick=async()=>{const[bid,id]=b.dataset.pff.split("|");b.disabled=true;try{const x=(await fbFn("platformFacturen")({bid,id})).data;const bl=new Blob([Uint8Array.from(atob(x.data),c=>c.charCodeAt(0))],{type:"application/pdf"}),u=URL.createObjectURL(bl),a=document.createElement("a");a.href=u;a.download=x.naam;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}catch(e){toast(typeof fnFout==="function"?fnFout(e):e.message)}b.disabled=false})};
  teken()}

/* eigen bussen: foto's die bedrijven stuurden; knip de bus uit (PNG met doorzichtige achtergrond) en zet hem erbij */
async function platBus(){const el=form.querySelector("#platBus");if(!el)return;let L=[];
  try{L=((await fbFn("platformBus")({})).data||{}).aanvragen||[]}catch(e){el.innerHTML=`<p class="subt" style="margin:0">${esc(typeof fnFout==="function"?fnFout(e):e.message)}</p>`;return}
  if(!L.length){el.innerHTML=`<p class="subt" style="margin:0">Nog geen aanvragen. Bedrijven sturen foto's van hun bus via Instellingen › Eigen bus op de kaart.</p>`;return}
  const nm={rechts:"Rechterkant",links:"Linkerkant",voor:"Voorkant",achter:"Achterkant"};
  el.innerHTML=L.map(a=>`<div class="pb-r" data-pb="${esc(a.bid)}" style="border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px">
    <div class="row" style="gap:8px;align-items:center"><b>${esc(a.naam||a.bid)}</b><span class="pill ${a.status==="klaar"?"ok":""}">${a.status==="klaar"?"Staat erbij":"Aangevraagd"}</span><span class="sp"></span><small class="subt">${esc(fmtD(String(a.op||"").slice(0,10)))}</small></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0">${Object.entries(a.fotos||{}).map(([z,id])=>`<a href="/_blob/${esc(id)}" target="_blank" rel="noopener" title="${esc(nm[z]||z)} openen" style="display:block;width:96px"><img src="/_blob/${esc(id)}" alt="" style="width:96px;height:64px;object-fit:cover;border-radius:8px;display:block"><small>${esc(nm[z]||z)}</small></a>`).join("")}</div>
    ${a.busBeeld&&a.busBeeld.rechts?`<div class="row" style="gap:10px;margin-bottom:8px"><img src="/_blob/${esc(a.busBeeld.rechts)}" alt="" style="height:40px">${a.busBeeld.links?`<img src="/_blob/${esc(a.busBeeld.links)}" alt="" style="height:40px">`:""}</div>`:""}
    <div class="row" style="gap:8px;flex-wrap:wrap"><label class="small ghost" style="cursor:pointer">Uitgeknipt, rijdt naar rechts (PNG)<input type="file" accept="image/png,image/webp" hidden data-pbr></label><label class="small ghost" style="cursor:pointer">Andere kant (optioneel)<input type="file" accept="image/png,image/webp" hidden data-pbl></label><span class="sp"></span><button type="button" class="small primary" data-pbgo>Plaatsen</button></div>
    <small class="subt" data-pbst></small></div>`).join("");
  el.querySelectorAll("[data-pb]").forEach(r=>{const st=r.querySelector("[data-pbst]"),gek={};
    r.querySelectorAll("[data-pbr],[data-pbl]").forEach(i=>i.onchange=()=>{const f=i.files&&i.files[0];if(f){gek[i.hasAttribute("data-pbr")?"rechts":"links"]=f;st.textContent=Object.entries(gek).map(([z,f])=>(z==="rechts"?"Rechts: ":"Links: ")+f.name).join(" · ")}});
    r.querySelector("[data-pbgo]").onclick=async()=>{if(!gek.rechts){toast("Kies eerst de uitgeknipte bus die naar rechts rijdt");return}const b=r.querySelector("[data-pbgo]");b.disabled=true;
      try{const up=async f=>{const x=await state.assets.upload(f);return x.id};const rechts=await up(gek.rechts),links=gek.links?await up(gek.links):"";
        await fbFn("platformBus")({actie:"plaats",bid:r.dataset.pb,rechts,links});toast("Bus geplaatst bij "+(r.querySelector("b").textContent));platBus()}
      catch(e){toast(typeof fnFout==="function"?fnFout(e):e.message);b.disabled=false}}})}
