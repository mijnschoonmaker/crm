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
/* via een (getekende) offerte: een lopende periodieke factuur blijft aan; de gekozen facturatie geldt dan voor de extra diensten */
const factModusPatchOfferte=(m,k)=>isPeriodiek(k)&&m!=="periodiek"?{periodiek:{...k.periodiek,extraModus:["direct","concept","geen"].includes(m)?m:"concept"}}:factModusPatch(m,k);
/* extra diensten (bijv. glasbewassing 1x per 3 maanden) bij een periodieke factuur: zo factureren */
const PER_EXTRA=[["concept","Per beurt factuur klaarzetten"],["direct","Per beurt direct versturen"],["geen","Niet factureren"]];
/* facturatie per extra opdracht (los van de hoofdopdracht en van elkaar).
   Gaat mee met de beurt: "" = op dezelfde factuur · concept/direct = eigen factuur · geen = niet factureren.
   Apart ingepland (eigen afspraak): direct / concept / geen / periodiek, net als een hoofdopdracht. */
const OPDR_FACT_HELP={"":"Komt op dezelfde factuur als de hoofdopdracht.",concept:"Na het afmelden staat er een eigen conceptfactuur voor deze opdracht klaar.",direct:"Na het afmelden gaat er een eigen factuur voor deze opdracht naar de klant.",geen:"Deze opdracht wordt niet gefactureerd.",periodiek:"Beurten van deze opdracht krijgen geen eigen factuur; er gaat één vaste factuur per week, maand of kwartaal."};
const opdrFactOpt=(o,k)=>(typeof opdrApart==="function"?opdrApart(k,o):o&&o.apart)?[["concept","Factuur klaarzetten"],["direct","Direct versturen"],["periodiek","Periodieke factuur"],["geen","Niet factureren"]]:[["","Op dezelfde factuur als de hoofdopdracht"],["concept","Eigen factuur klaarzetten"],["direct","Eigen factuur direct versturen"],["geen","Niet factureren"]];
function opdrFactVan(k,o){if(!o)return"";if(o.facturatie!=null&&o.facturatie!=="")return o.facturatie;
  if(typeof opdrApart==="function"?opdrApart(k,o):o.apart){const j=typeof opdrJob==="function"?opdrJob(k,o.id):null;return j?factModus(j):"concept"}return""}
const perExtraModus=k=>(k&&k.periodiek&&k.periodiek.extraModus)||"concept";
/* opdrachtnummer zoals in het klantdossier: 1001-1 (hoofdopdracht) of 1001-2 (losse opdracht, bijv. trappenhal van een VvE) */
function perOpdrNr(k){const h=k&&k.hoofdKlantId&&state.klanten.find(x=>x.id===k.hoofdKlantId);return h?klantNr(h)+"-"+(k.opdrachtNr||(typeof opdrNr==="function"&&opdrNr(h,k.opdrachtId))||2):klantNr(k)+"-1"}
const perNaam=k=>{const h=k&&k.hoofdKlantId&&state.klanten.find(x=>x.id===k.hoofdKlantId);return cleanName((h||k).naam)};
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
  const regels=(p.regels||[]).filter(r=>String(r.omschrijving||"").trim()||Number(r.prijs)).map(r=>({omschrijving:perFill(r.omschrijving,datum),aantal:Number(r.aantal)||1,prijs:Number(r.prijs)||0,...(r.btw!=null&&r.btw!==""&&!k.btwVerlegd?{btw:Number(r.btw)}:{})}));
  (k.artikelen||[]).forEach(a=>{if(a&&a.naam)regels.push({omschrijving:a.naam,aantal:Number(a.aantal)||1,prijs:st.incl?r2((Number(a.prijs)||0)/(1+(Number(p.btw??st.btw)||0)/100)):Number(a.prijs)||0})});
  if(!regels.length)return null;
  const versturen=p.modus==="versturen",f={soort:"factuur",nummer:nextNr("factuur",datum),klantId:k.id,...(k.beheercode?{beheercode:k.beheercode}:{}),klantNaam:k.naam,klantAdres:factAddr(k),klantEmail:mailK(k,"factuur").email||"",datum,
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
    regels:[{omschrijving:(isZak(k)||/schoon|trap/i.test(k.dienst||"")?"Maandelijkse factuur schoonmaakcontract ":"Glasbewassing ")+perNaam(k)+" [month.current] [year.current]",prijs:"",aantal:1}]};
  p.regels=(p.regels||[]).map(r=>r.btw!=null&&r.btw!==""?r:{...r,btw:btwRegel(k,r.omschrijving)??Number(p.btw??st.btw)});
  const heeftExtra=(k.opdrachten||[]).some(o=>o&&o.actief!==false&&!(typeof opdrApart==="function"?opdrApart(k,o):o.apart));
  const goBack=()=>typeof back==="function"?back():back==="lijst"?openPeriodiekLijst():back==="klant"?openKlantView(kid):openOpdrachtWerk(kid);
  const draw=()=>{
    openDlg(`<div class="dlg-head"><span class="objic big">${I.receipt}</span><div style="min-width:0;flex:1"><h3>Periodieke factuur</h3><div class="subt">${esc(perNaam(k))} · opdracht ${esc(perOpdrNr(k))}${k.hoofdKlantId?" · "+esc(k.dienst||""):""}</div></div>${k.periodiek&&k.periodiek.aan?statusPill("ok","Actief"):k.periodiek?statusPill("neutral","Gestopt"):""}<button type="button" class="iconbtn" id="pfX" aria-label="Terug">${I.x}</button></div>
    ${k.periodiek&&!k.periodiek.aan?`<div class="warnbox" style="margin:0 0 12px">${I.alert}<span>Deze periodieke factuur staat <b>uit</b>: er worden geen periodieke facturen gemaakt en elke beurt krijgt weer een eigen factuur. Controleer de volgende verzenddatum en kies <b>Opslaan</b> om hem weer aan te zetten.</span></div>`:""}<div class="pf-grid"><section class="kp"><div class="kp-h"><span class="objic">${I.facturen}</span><b>Factuurdetails</b></div>
        <label>Frequentie<select id="pf-freq">${PER_FREQ.map(([v,l])=>`<option value="${v}" ${p.freq===v?"selected":""}>${l}</option>`).join("")}</select></label>
        <label>Volgende verzenddatum<input type="date" id="pf-vol" value="${esc(p.volgende||"")}"></label>
        <label>Factuurmodus<select id="pf-mod"><option value="klaarzetten" ${p.modus!=="versturen"?"selected":""}>Klaarzetten (conceptfactuur)</option><option value="versturen" ${p.modus==="versturen"?"selected":""}>Definitief maken en klaarzetten om te versturen</option></select></label>
        ${heeftExtra?`<label>Extra diensten<select id="pf-ex">${PER_EXTRA.map(([v,l])=>`<option value="${v}" ${(p.extraModus||"concept")===v?"selected":""}>${l}</option>`).join("")}</select><small class="help">Bijv. glasbewassing die mee gaat met een beurt: die staat niet op de periodieke factuur maar krijgt een eigen factuur.</small></label>`:""}${k.btwVerlegd?'<small class="help">Btw wordt verlegd (instelling bij de opdracht)</small>':""}
        <div class="infobox">${I.planning}<span>De beurten worden gewoon ingepland en afgemeld, maar krijgen <b>geen factuur per beurt</b>. Op de verzenddatum komt deze factuur in Facturen${p.modus==="versturen"?" en bij Communicatie › Facturen versturen":""}.</span></div></section>
      <section class="kp"><div class="kp-h"><span class="objic">${I.receipt}</span><b>Factuurregels</b><span class="sp"></span><button type="button" class="linkbtn" id="pfLeg">Legenda</button></div>
        <div id="pfLegB" hidden class="pf-leg">${PER_LEGENDA.map(([c,l])=>`<button type="button" class="chip" data-ins="${c}"><code>${c}</code> ${l}</button>`).join("")}</div>
        <div class="pf-rh"><span>Omschrijving</span><span>Aantal</span><span>Prijs (excl. btw)</span><span>Btw-tarief</span><span></span></div>
        <div class="pf-rows">${p.regels.map((r,i)=>`<div class="pf-row"><input data-ri="${i}" data-rf="omschrijving" value="${esc(r.omschrijving||"")}" placeholder="Omschrijving" aria-label="Omschrijving"><input data-ri="${i}" data-rf="aantal" type="number" min="0" step="1" value="${esc(r.aantal??1)}" aria-label="Aantal"><span class="ow-in"><i>€</i><input data-ri="${i}" data-rf="prijs" type="number" step="0.01" value="${esc(r.prijs??"")}" aria-label="Prijs excl. btw"></span><select data-ri="${i}" data-rf="btw" aria-label="Btw-tarief"${k.btwVerlegd?" disabled":""}>${[21,9,0].map(b=>`<option value="${b}" ${Number(r.btw)===b?"selected":""}>${b}%</option>`).join("")}</select><button type="button" class="iconbtn sm" data-rdel="${i}" aria-label="Regel verwijderen">${I.x}</button></div>`).join("")}</div>
        <button type="button" class="small" id="pfAdd" style="align-self:flex-start">${I.plus}Factuurregel toevoegen</button>
        <div class="pf-prev" id="pfPrev"></div></section></div>
    <div class="row">${k.periodiek&&k.periodiek.aan?`<button type="button" class="ghost danger" id="pfStop">Periodieke factuur stoppen</button>`:""}<span class="sp"></span><button type="button" id="pfBack">${I.x}Terug</button><button type="submit" class="primary" id="pfSave">${I.check}Opslaan</button></div>`,{xwide:true});
    const prev=()=>{const d=p.volgende||iso(today()),ex=p.regels.reduce((a,r)=>a+(Number(r.aantal)||1)*(Number(r.prijs)||0),0),inc=p.regels.reduce((a,r)=>a+(Number(r.aantal)||1)*(Number(r.prijs)||0)*(1+(k.btwVerlegd?0:Number(r.btw)||0)/100),0),bs=[...new Set(p.regels.filter(r=>r.omschrijving||Number(r.prijs)).map(r=>k.btwVerlegd?0:Number(r.btw)||0))],b=bs.join("/")||"0";
      $("#pfPrev").innerHTML=`<span class="eyebrow">Voorbeeld factuur van ${esc(fmtL(d))}</span>${p.regels.filter(r=>r.omschrijving||r.prijs).map(r=>`<div class="ow-kv"><span>${esc(perFill(r.omschrijving,d))}${(Number(r.aantal)||1)>1?" × "+r.aantal:""}</span><b>${eur((Number(r.aantal)||1)*(Number(r.prijs)||0))}</b></div>`).join("")}<div class="ow-kv tot"><span>Totaal ${b}% btw</span><b>${eur(ex)} excl. · ${eur(inc)} incl.</b></div><small class="help">Daarna: ${esc(fmtL(perVolgende(d,p.freq)))}, ${esc(fmtL(perVolgende(perVolgende(d,p.freq),p.freq)))}, …</small>`};
    prev();
    const keep=()=>{p.freq=$("#pf-freq").value;p.volgende=$("#pf-vol").value;p.modus=$("#pf-mod").value;const ex=$("#pf-ex");if(ex)p.extraModus=ex.value;const b0=p.regels.find(r=>Number(r.prijs));if(b0)p.btw=Number(b0.btw)};
    ["pf-freq","pf-vol","pf-mod","pf-ex"].forEach(id=>{const el=$("#"+id);if(el)el.onchange=()=>{keep();prev()}});
    form.querySelectorAll("[data-ri]").forEach(el=>{el.oninput=()=>{const r=p.regels[+el.dataset.ri];r[el.dataset.rf]=el.type==="number"||el.dataset.rf==="btw"?(el.value===""?"":Number(el.value)):el.value;prev()};el.onchange=el.oninput;el.onfocus=()=>{lastIn=el}});
    form.querySelectorAll("[data-rdel]").forEach(b=>b.onclick=()=>{keep();p.regels.splice(+b.dataset.rdel,1);draw()});
    $("#pfAdd").onclick=()=>{keep();p.regels.push({omschrijving:"",aantal:1,prijs:"",btw:(p.regels[p.regels.length-1]||{}).btw??Number(p.btw??st.btw)});draw();const l=form.querySelectorAll('[data-rf="omschrijving"]');l[l.length-1].focus()};
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
  openDlg(`<div class="dlg-head"><span class="objic big">${I.receipt}</span><div style="min-width:0;flex:1"><h3>Periodieke facturen</h3><div class="subt">${plural(ks.filter(isPeriodiek).length,"actieve opdracht","actieve opdrachten")}${ks.some(k=>!isPeriodiek(k))?" · "+plural(ks.filter(k=>!isPeriodiek(k)).length,"staat","staan")+" uit":""}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    ${due?`<div class="infobox">${I.bell}<span style="flex:1">${plural(due,"factuur is","facturen zijn")} aan de beurt.</span><button type="button" class="small primary" id="plRun">Nu maken</button></div>`:""}
    ${ks.length?`<div class="tablewrap" style="box-shadow:none"><table class="t"><thead><tr><th>Opdracht</th><th>Bedrijf / naam</th><th>Frequentie</th><th>Factuurmodus</th><th>Volgende verzenddatum</th><th class="r">Per periode</th><th></th></tr></thead><tbody>${ks.map(k=>{const p=k.periodiek,ex=(p.regels||[]).reduce((a,r)=>a+(Number(r.aantal)||1)*(Number(r.prijs)||0),0);
      return `<tr data-pl="${esc(k.id)}" style="cursor:pointer${p.aan?"":";opacity:.55"}"><td class="mono">${esc(perOpdrNr(k))}</td><td><b>${esc(perNaam(k))}</b><br><small class="subt">${k.hoofdKlantId?esc(k.dienst||"")+" · ":""}${esc(jobAddr(k))}</small></td><td>${esc(perLabel(p.freq))}</td><td>${p.modus==="versturen"?"Definitief":"Klaarzetten"}</td><td>${p.aan?esc(fmtL(p.volgende)):'<span class="pill late">uit</span> <small class="subt">tik om weer aan te zetten</small>'}</td><td class="r">${eur(ex)} <small class="subt">excl.</small></td><td class="r">${I.pencil}</td></tr>`}).join("")}</tbody></table></div>`:empty("Nog geen periodieke facturen","Open een opdracht en kies bij Facturatie › Periodieke factuur.")}
    <div class="row"><span class="sp"></span><button type="button" data-act="close">Klaar</button></div>`,{xwide:true});
  form.querySelectorAll("[data-pl]").forEach(r=>r.onclick=()=>openPeriodiek(r.dataset.pl,"lijst"));
  const r=$("#plRun");if(r)r.onclick=async()=>{r.disabled=true;await runPeriodiek();openPeriodiekLijst()};
}
