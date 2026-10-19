/* ---------- PERIODIEKE FACTUREN ----------
   Per opdracht: vaste factuurregels die elke week/maand/kwartaal/... op een vaste datum worden gefactureerd.
   De beurten worden gewoon ingepland en afgemeld, maar krijgen geen eigen factuur. */
const PER_FREQ=[["week","Per week"],["2weken","Per 2 weken"],["4weken","Per 4 weken"],["maand","Per maand"],["kwartaal","Per kwartaal"],["halfjaar","Per halfjaar"],["jaar","Per jaar"]];
const MAANDEN=["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
const isPeriodiek=k=>!!(k&&k.periodiek&&k.periodiek.aan);
/* facturatie per opdracht (zoals in een klantdossier) */
const FACT_OPT=[["direct","Direct versturen"],["periodiek","Periodieke factuur"],["concept","Factuur klaarzetten"],["geen","Niet factureren"]];
const FACT_HELP={direct:"Na het afmelden gaat de factuur meteen naar de klant.",periodiek:"Beurten krijgen geen eigen factuur; er gaat één vaste factuur per week, maand of kwartaal.",concept:"Na het afmelden staat er een conceptfactuur klaar in Facturen.",geen:"Na het afmelden wordt er geen factuur gemaakt (bijv. bij ruilen of een gratis beurt)."};
const factModus=k=>isPeriodiek(k)?"periodiek":k&&k.nietFactureren?"geen":k&&k.directFactureren?"direct":"concept";
const factModusPatch=(m,k)=>m==="periodiek"?{directFactureren:false,nietFactureren:false}:{directFactureren:m==="direct",nietFactureren:m==="geen",...(isPeriodiek(k)?{periodiek:{...k.periodiek,aan:false}}:{})};
const perLabel=f=>(PER_FREQ.find(x=>x[0]===f)||PER_FREQ[3])[1];
function perVolgende(d,f){const x=parse(d);
  if(f==="week")return iso(addDays(x,7));if(f==="2weken")return iso(addDays(x,14));if(f==="4weken")return iso(addDays(x,28));
  const m={maand:1,kwartaal:3,halfjaar:6,jaar:12}[f]||1,day=x.getDate(),n=new Date(x.getFullYear(),x.getMonth()+m,1),last=new Date(n.getFullYear(),n.getMonth()+1,0).getDate();n.setDate(Math.min(day,last));return iso(n)}
/* [month.current] [month.previous] [month.next] [year.current] [year.previous] [year.next] [week.current] [date] */
function perFill(t,d){const x=parse(d),m=x.getMonth(),y=x.getFullYear(),wk=typeof weekNr==="function"?weekNr(x):"";
  const map={"month.current":MAANDEN[m],"month.previous":MAANDEN[(m+11)%12],"month.next":MAANDEN[(m+1)%12],"year.current":y,"year.previous":y-1,"year.next":y+1,
    "year.month.previous":m===0?y-1:y,"week.current":wk,"date":fmtL(d)};
  return String(t||"").replace(/\[([a-z.]+)\]/g,(a,k)=>k in map?String(map[k]):a)}
const PER_LEGENDA=[["[month.current]","huidige maand"],["[month.previous]","vorige maand"],["[month.next]","volgende maand"],["[year.current]","huidig jaar"],["[year.previous]","vorig jaar"],["[year.month.previous]","jaar van de vorige maand"],["[week.current]","weeknummer"],["[date]","factuurdatum"]];

/* factuur maken voor één periode; id is vast per klant en datum, dus nooit dubbel */
async function perMaak(k,datum){
  const p=k.periodiek,st=S(),fId="per_"+k.id+"_"+datum.replace(/-/g,"");
  if(state.facturen.some(f=>f.id===fId))return null;
  const regels=(p.regels||[]).filter(r=>String(r.omschrijving||"").trim()||Number(r.prijs)).map(r=>({omschrijving:perFill(r.omschrijving,datum),aantal:Number(r.aantal)||1,prijs:Number(r.prijs)||0}));
  (k.artikelen||[]).forEach(a=>{if(a&&a.naam)regels.push({omschrijving:a.naam,aantal:Number(a.aantal)||1,prijs:st.incl?r2((Number(a.prijs)||0)/(1+(Number(p.btw??st.btw)||0)/100)):Number(a.prijs)||0})});
  if(!regels.length)return null;
  const versturen=p.modus==="versturen",f={soort:"factuur",nummer:nextNr("factuur",datum),klantId:k.id,klantNaam:k.naam,klantAdres:factAddr(k),klantEmail:mailK(k,"factuur").email||"",datum,
    verval:iso(addDays(parse(datum),Number(k.termijn)||Number(st.termijn)||14)),regels,btw:k.btwVerlegd?0:Number(p.btw??st.btw),incl:false,status:versturen?"open":"concept",
    notitie:[k.factuurInstructie||"",k.btwVerlegd?"Btw verlegd":""].filter(Boolean).join("\n"),bijlagen:(k.bevindingen||[]).map(b=>({...b,soort:"foto"})),gemaakt:new Date().toISOString(),betaalwijze:k.incasso?"incasso":st.betaalwijze||"overmaken",periodiek:true};
  await save("facturen",fId,f);if(!state.facturen.some(x=>x.id===fId))state.facturen.push({...f,id:fId});
  /* afgemelde beurten van deze periode koppelen aan de factuur */
  for(const b of state.beurten.filter(b=>b.klantId===k.id&&b.gefactureerd==="periodiek"&&b.datum<=datum))await save("beurten",b.id,{...strip(b),gefactureerd:fId});
  return fId}
let perBezig=false;
async function runPeriodiek(stil){
  if(perBezig)return 0;perBezig=true;let n=0;const ti=iso(today());
  try{for(const k0 of state.klanten.filter(isPeriodiek)){let k=k0,guard=0;
      while(k.periodiek.volgende&&k.periodiek.volgende<=ti&&guard++<24){const d=k.periodiek.volgende;if(await perMaak(k,d))n++;
        const np={...k.periodiek,laatst:d,volgende:perVolgende(d,k.periodiek.freq)};k={...k,periodiek:np,artikelen:[],bevindingen:[]};await save("klanten",k.id,{...strip(k)})}}
    if(n&&!stil)toast(plural(n,"periodieke factuur","periodieke facturen")+" gemaakt");else if(n)toast(plural(n,"periodieke factuur","periodieke facturen")+" klaargezet in Facturen")}
  catch(e){err(e)}perBezig=false;return n}

function openPeriodiek(kid,back){
  const k=state.klanten.find(x=>x.id===kid);if(!k)return;const st=S();
  const p=k.periodiek?JSON.parse(JSON.stringify(k.periodiek)):{aan:true,freq:"maand",volgende:iso(new Date(today().getFullYear(),today().getMonth()+1,1)),modus:"klaarzetten",btw:Number(st.btw)||21,
    regels:[{omschrijving:(isZak(k)?"Maandelijkse factuur schoonmaakcontract ":"Glasbewassing ")+cleanName(k.naam)+" [month.current] [year.current]",prijs:"",aantal:1}]};
  const goBack=()=>back==="lijst"?openPeriodiekLijst():back==="klant"?openKlantView(kid):openOpdrachtWerk(kid);
  const draw=()=>{
    openDlg(`<div class="dlg-head"><span class="objic big">${I.receipt}</span><div style="min-width:0;flex:1"><h3>Periodieke factuur</h3><div class="subt">${esc(cleanName(k.naam))} · opdracht ${esc(klantNr(k))}-1</div></div>${k.periodiek&&k.periodiek.aan?statusPill("ok","Actief"):""}<button type="button" class="iconbtn" id="pfX" aria-label="Terug">${I.x}</button></div>
    <div class="pf-grid"><section class="kp"><div class="kp-h"><span class="objic">${I.facturen}</span><b>Factuurdetails</b></div>
        <label>Frequentie<select id="pf-freq">${PER_FREQ.map(([v,l])=>`<option value="${v}" ${p.freq===v?"selected":""}>${l}</option>`).join("")}</select></label>
        <label>Volgende verzenddatum<input type="date" id="pf-vol" value="${esc(p.volgende||"")}"></label>
        <label>Factuurmodus<select id="pf-mod"><option value="klaarzetten" ${p.modus!=="versturen"?"selected":""}>Klaarzetten (conceptfactuur)</option><option value="versturen" ${p.modus==="versturen"?"selected":""}>Definitief maken en klaarzetten om te versturen</option></select></label>
        <label>Btw-tarief<select id="pf-btw">${[21,9,0].map(b=>`<option value="${b}" ${Number(p.btw??st.btw)===b?"selected":""}>${b}%</option>`).join("")}</select>${k.btwVerlegd?'<small class="help">Btw wordt verlegd (instelling bij de opdracht)</small>':""}</label>
        <div class="infobox">${I.planning}<span>De beurten worden gewoon ingepland en afgemeld, maar krijgen <b>geen factuur per beurt</b>. Op de verzenddatum komt deze factuur in Facturen${p.modus==="versturen"?" en bij Communicatie › Facturen versturen":""}.</span></div></section>
      <section class="kp"><div class="kp-h"><span class="objic">${I.receipt}</span><b>Factuurregels</b><span class="sp"></span><button type="button" class="linkbtn" id="pfLeg">Legenda</button></div>
        <div id="pfLegB" hidden class="pf-leg">${PER_LEGENDA.map(([c,l])=>`<button type="button" class="chip" data-ins="${c}"><code>${c}</code> ${l}</button>`).join("")}</div>
        <div class="pf-rh"><span>Omschrijving</span><span>Aantal</span><span>Prijs (excl. btw)</span><span></span></div>
        <div class="pf-rows">${p.regels.map((r,i)=>`<div class="pf-row"><input data-ri="${i}" data-rf="omschrijving" value="${esc(r.omschrijving||"")}" placeholder="Omschrijving" aria-label="Omschrijving"><input data-ri="${i}" data-rf="aantal" type="number" min="0" step="1" value="${esc(r.aantal??1)}" aria-label="Aantal"><span class="ow-in"><i>€</i><input data-ri="${i}" data-rf="prijs" type="number" step="0.01" value="${esc(r.prijs??"")}" aria-label="Prijs excl. btw"></span><button type="button" class="iconbtn sm" data-rdel="${i}" aria-label="Regel verwijderen">${I.x}</button></div>`).join("")}</div>
        <button type="button" class="small" id="pfAdd" style="align-self:flex-start">${I.plus}Factuurregel toevoegen</button>
        <div class="pf-prev" id="pfPrev"></div></section></div>
    <div class="row">${k.periodiek&&k.periodiek.aan?`<button type="button" class="ghost danger" id="pfStop">Periodieke factuur stoppen</button>`:""}<span class="sp"></span><button type="button" id="pfBack">${I.x}Terug</button><button type="submit" class="primary" id="pfSave">${I.check}Opslaan</button></div>`,{xwide:true});
    const prev=()=>{const d=p.volgende||iso(today()),ex=p.regels.reduce((a,r)=>a+(Number(r.aantal)||1)*(Number(r.prijs)||0),0),b=k.btwVerlegd?0:Number(p.btw??st.btw)||0;
      $("#pfPrev").innerHTML=`<span class="eyebrow">Voorbeeld factuur van ${esc(fmtL(d))}</span>${p.regels.filter(r=>r.omschrijving||r.prijs).map(r=>`<div class="ow-kv"><span>${esc(perFill(r.omschrijving,d))}${(Number(r.aantal)||1)>1?" × "+r.aantal:""}</span><b>${eur((Number(r.aantal)||1)*(Number(r.prijs)||0))}</b></div>`).join("")}<div class="ow-kv tot"><span>Totaal ${b}% btw</span><b>${eur(ex)} excl. · ${eur(ex*(1+b/100))} incl.</b></div><small class="help">Daarna: ${esc(fmtL(perVolgende(d,p.freq)))}, ${esc(fmtL(perVolgende(perVolgende(d,p.freq),p.freq)))}, …</small>`};
    prev();
    const keep=()=>{p.freq=$("#pf-freq").value;p.volgende=$("#pf-vol").value;p.modus=$("#pf-mod").value;p.btw=Number($("#pf-btw").value)};
    ["pf-freq","pf-vol","pf-mod","pf-btw"].forEach(id=>$("#"+id).onchange=()=>{keep();prev()});
    form.querySelectorAll("[data-ri]").forEach(el=>{el.oninput=()=>{const r=p.regels[+el.dataset.ri];r[el.dataset.rf]=el.type==="number"?(el.value===""?"":Number(el.value)):el.value;prev()};el.onfocus=()=>{lastIn=el}});
    form.querySelectorAll("[data-rdel]").forEach(b=>b.onclick=()=>{keep();p.regels.splice(+b.dataset.rdel,1);draw()});
    $("#pfAdd").onclick=()=>{keep();p.regels.push({omschrijving:"",aantal:1,prijs:""});draw();const l=form.querySelectorAll('[data-rf="omschrijving"]');l[l.length-1].focus()};
    $("#pfLeg").onclick=()=>{const b=$("#pfLegB");b.hidden=!b.hidden};
    form.querySelectorAll("[data-ins]").forEach(b=>b.onmousedown=e=>{e.preventDefault();const el=lastIn&&lastIn.dataset.rf==="omschrijving"?lastIn:form.querySelector('[data-rf="omschrijving"]');if(!el)return;const s=el.selectionStart??el.value.length;el.value=el.value.slice(0,s)+b.dataset.ins+el.value.slice(el.selectionEnd??s);el.dispatchEvent(new Event("input"));el.focus()});
    $("#pfX").onclick=$("#pfBack").onclick=goBack;
    const so=$("#pfStop");if(so){let armed=false;so.onclick=async()=>{if(!armed){armed=true;so.textContent="Zeker weten? Tik nogmaals";return}
      try{const cur=state.klanten.find(x=>x.id===kid)||k;await save("klanten",kid,{...strip(cur),periodiek:{...cur.periodiek,aan:false}});toast("Periodieke factuur gestopt; beurten krijgen weer een eigen factuur");goBack()}catch(er){err(er)}}}
    form.onsubmit=async e=>{e.preventDefault();keep();
      if(!p.volgende){$("#pf-vol").focus();return toast("Kies de volgende verzenddatum")}
      if(!p.regels.some(r=>String(r.omschrijving||"").trim()&&Number(r.prijs))){return toast("Vul minimaal één factuurregel met een prijs in")}
      $("#pfSave").disabled=true;
      try{const cur=state.klanten.find(x=>x.id===kid)||k;const np={...p,aan:true,regels:p.regels.filter(r=>String(r.omschrijving||"").trim()||Number(r.prijs))};
        await save("klanten",kid,{...strip(cur),periodiek:np});toast("Periodieke factuur opgeslagen · eerste op "+fmtD(np.volgende));
        if(np.volgende<=iso(today()))setTimeout(()=>runPeriodiek(),300);goBack()}catch(er){$("#pfSave").disabled=false;err(er)}};
  };
  let lastIn=null;draw();
}
function openPeriodiekLijst(){
  const ks=state.klanten.filter(k=>k.periodiek).sort((a,b)=>String(a.periodiek.volgende||"").localeCompare(String(b.periodiek.volgende||"")));
  const due=ks.filter(k=>isPeriodiek(k)&&k.periodiek.volgende<=iso(today())).length;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.receipt}</span><div style="min-width:0;flex:1"><h3>Periodieke facturen</h3><div class="subt">${plural(ks.filter(isPeriodiek).length,"actieve opdracht","actieve opdrachten")}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    ${due?`<div class="infobox">${I.bell}<span style="flex:1">${plural(due,"factuur is","facturen zijn")} aan de beurt.</span><button type="button" class="small primary" id="plRun">Nu maken</button></div>`:""}
    ${ks.length?`<div class="tablewrap" style="box-shadow:none"><table class="t"><thead><tr><th>Opdracht</th><th>Bedrijf / naam</th><th>Frequentie</th><th>Factuurmodus</th><th>Volgende verzenddatum</th><th class="r">Per periode</th><th></th></tr></thead><tbody>${ks.map(k=>{const p=k.periodiek,ex=(p.regels||[]).reduce((a,r)=>a+(Number(r.aantal)||1)*(Number(r.prijs)||0),0);
      return `<tr data-pl="${esc(k.id)}" style="cursor:pointer${p.aan?"":";opacity:.55"}"><td class="mono">${esc(klantNr(k))}-1</td><td><b>${esc(cleanName(k.naam))}</b><br><small class="subt">${esc(jobAddr(k))}</small></td><td>${esc(perLabel(p.freq))}</td><td>${p.modus==="versturen"?"Definitief":"Klaarzetten"}</td><td>${p.aan?esc(fmtL(p.volgende)):'<span class="pill neutral">gestopt</span>'}</td><td class="r">${eur(ex)} <small class="subt">excl.</small></td><td class="r">${I.pencil}</td></tr>`}).join("")}</tbody></table></div>`:empty("Nog geen periodieke facturen","Open een opdracht en kies bij Facturatie › Periodieke factuur.")}
    <div class="row"><span class="sp"></span><button type="button" data-act="close">Klaar</button></div>`,{xwide:true});
  form.querySelectorAll("[data-pl]").forEach(r=>r.onclick=()=>openPeriodiek(r.dataset.pl,"lijst"));
  const r=$("#plRun");if(r)r.onclick=async()=>{r.disabled=true;await runPeriodiek();openPeriodiekLijst()};
}
