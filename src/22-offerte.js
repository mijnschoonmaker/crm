/* ---------- OFFERTE-WERKBLAD: klant links, tekst + rekentool + offerteregels rechts ---------- */
const OFF_TEKST="Beste [firstname.customer],\n\nHierbij ontvangt u van ons een offerte voor de onderstaande diensten. De prijzen in de offerte zijn de prijzen per keer. Facturatie gebeurt per beurt achteraf.";
const OFF_LETOP="Onderstaande bedragen zijn inclusief middelen, materialen en voorrijkosten.\nOnze voorwaarden zijn van toepassing.";
/* geen standaard voettekst onder de offerte; wie er een wil, vult hem zelf in (per offerte of bij Instellingen) */
const OFF_VOET="";
const BETAALW=[["bank","Per bank"],["incasso","Automatische incasso"],["contant","Contant"],["pin","PIN"]];
function openOfferte(opts={}){
  const ex=opts.id?state.facturen.find(x=>x.id===opts.id):null;
  if(opts.id&&!ex)return;
  if(ex&&ex.getekendNieuw&&typeof getekendGezien==="function")getekendGezien(ex);
  let kid=ex?ex.klantId:opts.klantId||"";
  const k0=state.klanten.find(x=>x.id===kid)||null;if(!k0)kid="";
  const st=S(),dat=ex?ex.datum:iso(today());
  const opd0=(ex&&ex.opdracht)||{};
  /* regels die je zelf toevoegt; de regels uit de rekentool komen er live bij */
  /* rekentool-regels en eigen regels apart houden, zodat het minimumtarief nooit dubbel in de offerte komt */
  const legacyRc=ex&&!ex.rcRegels&&!ex.rcTelling&&ex.telling;
  let extra=ex?(Array.isArray(ex.extraRegels)?ex.extraRegels:ex.rcRegels||ex.rcTelling?[]:legacyRc?[]:(ex.regels||[])).filter(r=>!r.subs).map(r=>({...r})):[];
  let rc=ex&&(ex.rcRegels||legacyRc)?{regels:(ex.rcRegels||ex.regels).map(r=>({...r,omschrijving:String(r.omschrijving||"").replace(/ ?\(minimumtarief\)/gi,"")})),count:(ex.telling&&ex.telling.ramen)||0,opd:{}}:null,touched={freq:!!opd0.frequentie,duur:!!opd0.duur};
  const ks=[...state.klanten].sort((a,b)=>cleanName(a.naam).localeCompare(cleanName(b.naam)));
  const v=(k,n)=>esc(k?k[n]||"":"");
  const freqO=freqOpts(),durO=[15,30,45,60,90,120,180,240];
  const fr0=Number(opd0.frequentie||(k0&&k0.frequentie)||8),du0=Number(opd0.duur||(k0&&k0.duur)||30);
  if(!freqO.includes(fr0))freqO.push(fr0);if(!durO.includes(du0))durO.push(du0);freqO.sort((a,b)=>a-b);durO.sort((a,b)=>a-b);
  const stPill=ex?fStatus(ex):["neutral","Concept"];
  const diensten=dienstLijst().filter(d=>d.groep!=="bijz");
  let dns=((ex&&ex.diensten)||[]).map(d=>({...d,items:(d.items||[]).map(i=>({...i}))}));
  /* oudere offertes: dienstregels die per ongeluk ook als eigen regel bewaard zijn niet dubbel tonen */
  if(dns.length)extra=extra.filter(r=>!dns.some(d=>String(d.groepOms||d.naam||"").trim()===String(r.omschrijving||"").trim()));
  openDlg(`<div class="dlg-head"><span class="objic big">${I.offertes}</span><div style="min-width:0;flex:1"><div class="ow-kick">Offerte</div><h3 class="ow-h">${ex?esc(ex.nummer):"Nieuw"}</h3><div class="subt" id="owSub">${k0?esc(cleanName(k0.naam))+" · "+esc(fullAddr(k0)):"Kies een klant of vul een nieuwe klant in"}</div></div><span class="pill ${stPill[0]} dotp">${esc(stPill[1])}</span><button type="button" class="iconbtn" data-act="${opts.back?"offback":"close"}" data-id="${esc(opts.back||"")}" aria-label="Sluiten">${I.x}</button></div>
  <div class="kk-grid ow-grid"><div class="kk-left">
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Klantgegevens</b><button type="button" class="ow-kk" id="owKk" title="Naar de klantkaart" aria-label="Naar de klantkaart"${kid?"":" hidden"}>${I.user}<span>Klantkaart</span>${I.ext||""}</button></div>
      <div class="grid2">
        <label class="full">Klant<select id="ow-k"><option value="">Nieuwe klant</option>${ks.map(k=>`<option value="${esc(k.id)}" ${k.id===kid?"selected":""}>${esc(cleanName(k.naam))}${k.adres?" — "+esc(k.adres):""}</option>`).join("")}</select></label>
        <label class="full">Naam<input id="ow-naam" value="${v(k0,"naam")}" required></label>
        <label class="full">Adres<input id="ow-adres" value="${v(k0,"adres")}" placeholder="Straat en huisnummer" required></label>
        <label>Postcode<input id="ow-postcode" value="${v(k0,"postcode")}" placeholder="1234 AB"></label>
        <label>Plaats<input id="ow-plaats" value="${v(k0,"plaats")}"></label>
        <label>E-mail <small style="font-weight:500">(offerte gaat naar)</small><input id="ow-email" type="email" value="${v(k0,"email")}"></label>
        <label>Telefoon<input id="ow-telefoon" type="tel" value="${v(k0,"telefoon")}"></label>
        <label>Soort<select id="ow-soort"><option value="particulier">Particulier</option><option value="zakelijk" ${k0&&k0.soort==="zakelijk"?"selected":""}>Zakelijk</option><option value="vve" ${k0&&k0.soort==="vve"?"selected":""}>VvE</option></select></label>
      </div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.facturen}</span><b>Details offerte</b></div>
      <div class="grid2">
        <label>Offertenummer<input value="${ex?esc(ex.nummer):"Automatisch"}" disabled></label>
        <label>Status<input value="${esc(stPill[1])}" disabled></label>
        <label>Offertedatum<input id="ow-datum" type="date" value="${dat}"></label>
        <label>Geldig tot<input id="ow-verval" type="date" value="${ex?esc(ex.verval):iso(addDays(today(),30))}"></label>
        <label>Aanboddatum <small style="font-weight:500">(optioneel)</small><input id="ow-start" type="date" value="${ex?esc(ex.start||""):""}"><small class="help">Vanaf deze datum staat de klant na akkoord bij Te plannen</small></label>
        <label>Frequentie<select id="ow-freq">${freqO.map(w=>`<option value="${w}" ${w===fr0?"selected":""}>${esc(freqLabel(w))}</option>`).join("")}</select></label>
        <label>Duur per beurt<select id="ow-duur">${durO.map(m=>`<option value="${m}" ${m===du0?"selected":""}>${m<60?m+" min":(m/60).toLocaleString("nl-NL")+" uur"}</option>`).join("")}</select></label>
      </div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.euro||I.facturen}</span><b>Facturatie</b></div>
      <div class="grid2">
        <label>Betaalwijze<select id="ow-betaal">${BETAALW.map(([a,b])=>`<option value="${a}" ${(ex?ex.betaalwijze:(k0&&k0.incasso?"incasso":"bank"))===a?"selected":""}>${b}</option>`).join("")}</select></label>
        <label>Btw-tarief<select id="ow-btw">${[21,9,0].map(x=>`<option value="${x}" ${Number(ex?ex.btw:21)===x?"selected":""}>${x}%</option>`).join("")}</select></label>
        <label>Facturatie<select id="ow-fact">${FACT_OPT.map(([a,b])=>`<option value="${a}" ${(ex&&ex.facturatie?ex.facturatie:k0?factModus(k0):"concept")===a?"selected":""}>${b}</option>`).join("")}</select><small class="help" id="owFactH"></small></label>
        <label>Betalingstermijn<input value="${esc(String(st.termijn||14))} dagen" disabled></label>
        <label class="full">Opmerking op de offerte<textarea id="ow-notitie" style="min-height:56px" placeholder="Bijv. graag sleutel achterom">${esc(ex?ex.notitie||"":"")}</textarea></label>
      </div></section>
  </div><div class="kk-side">
    <section class="kp ow-txt" id="owTxt"><div class="kp-h"><span class="objic">${I.pencil}</span><b>Tekst offerte</b><span class="sp"></span><button type="button" class="iconbtn sm" id="owTxtT" aria-label="Tekst offerte aanpassen" title="Aanpassen">${I.pencil}</button></div>
      <div class="ow-txtv" id="owTxtV"></div>
      <div class="ow-txte" id="owTxtE" hidden>
        <p class="help" style="margin:0">Deze tekst geldt alleen voor deze offerte. De standaardtekst stel je in bij Instellingen, of vink hieronder "bewaar als standaard" aan.</p>
        <label>Tekst offerte <button type="button" class="linkbtn ow-leg" data-leg>(Legenda)</button><textarea id="ow-tekst" style="min-height:120px">${esc(ex?ex.tekst??"":st.offerteTekst||OFF_TEKST)}</textarea></label>
        <div class="ow-legb" hidden>${[["[name.customer]","naam van de klant"],["[firstname.customer]","voornaam van de klant"],["[name.company]","jouw bedrijfsnaam"]].map(([c,l])=>`<button type="button" class="chip" data-ins="${c}"><code>${c}</code> ${l}</button>`).join("")}</div>
        <label>Voettekst offerte <button type="button" class="linkbtn ow-leg" data-leg>(Legenda)</button><textarea id="ow-voet" style="min-height:110px">${esc(ex?ex.voettekst??"":st.offerteVoet||OFF_VOET)}</textarea></label>
        <label class="check-row"><input type="checkbox" id="ow-letop" ${(ex?!!ex.letop:!!st.offerteLetopAan)?"checked":""}>Toon "Let op"-tekst</label>
        <label id="owLetopW">Overschrijvende "Let op"-tekst<textarea id="ow-letopt" style="min-height:70px">${esc(ex&&ex.letopTekst!=null?ex.letopTekst:st.offerteLetop||OFF_LETOP)}</textarea></label>
        <label class="check-row"><input type="checkbox" id="ow-totaal" ${(ex?ex.totaalTonen!==false:st.offerteTotaal!==false)?"checked":""}>Totaalprijs offerte tonen</label>
        <p class="ow-warn" id="owTotW">Let op: de totaalprijs houdt geen rekening met frequenties en is een optelsom van alle prijzen op de offerte. Zet dit uit als je diensten met verschillende frequenties op de offerte hebt.</p>
        <label class="check-row"><input type="checkbox" id="ow-std">Bewaar deze teksten en instellingen als standaard voor nieuwe offertes</label>
        <button type="button" class="small" id="owTxtK" style="align-self:flex-start">${I.check}Klaar</button>
      </div></section>
    <section class="kp kp-rc"><div class="kp-h"><span class="objic">${I.calculator}</span><div><b>Rekentool</b><small>Maak foto's en tik de ramen aan. Aantallen, tijden en prijzen komen vanzelf bij de offerteregels.</small></div></div><div id="owRc"></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.check}</span><b>Offerteregels</b><span class="sp"></span><button type="button" class="small" id="owAdd">${I.plus}Eigen regel</button></div>
      <div class="ow-chips">${dienstChips(diensten,"data-dn")}</div>
      <div id="owRegels"></div>
      <div class="totals" id="owTot" style="margin-top:10px"></div></section>
  </div></div>
  <div class="row stickyfoot kk-foot ow-foot"><div class="ow-neven">${ex?`<button type="button" class="ow-link danger" id="owDel">${I.trash||""}Verwijderen</button>`:""}<button type="button" class="ow-link" id="owSent">${I.right}Handmatig op verstuurd</button><button type="button" class="ow-link" data-act="${opts.back?"offback":"close"}" data-id="${esc(opts.back||"")}">Annuleren</button></div><div class="ow-hoofd"><button type="button" id="owSave">${I.check}Opslaan</button><button type="button" id="owView">${I.eye}Bekijk offerte</button><button type="submit" class="primary" id="owSend">${I.send||I.msg}Versturen</button></div></div>`,{xwide:true});
  const $o=n=>$("#ow-"+n);
  const ex2inc=p=>st.incl?r2(Number(p)/(1+Number($o("btw").value)/100)):Number(p);
  const dnsCalc=d=>groepCalc(d);
  const dnsRegels=()=>dns.map(d=>{const c=dnsCalc(d);return c.rows.length?{omschrijving:d.groepOms?d.groepOms:d.naam+" ("+freqLabel(d.frequentie).toLowerCase()+"): "+groepDetail(c.rows.map(r=>r.it),d.frequentie),aantal:1,prijs:c.ex,sec:c.sec}:null}).filter(Boolean);
  /* offerteregels gegroepeerd zoals op de offerte: per dienst één regel met de onderdelen eronder */
  const glasNaam=()=>{const g=diensten.find(d=>d.glas);return g&&g.naam||"Glasbewassing"};
  const glasGroep=()=>{const rr=rc?rc.regels:[];if(!rr.length)return [];if(!rr.some(r=>r.sub))return rr;
    return [{omschrijving:glasNaam(),aantal:1,prijs:r2(rr.reduce((a,r)=>a+(Number(r.prijs)||0),0)),subs:rr.filter(r=>r.sub).map(r=>({naam:r.sub,qty:r.qty||"",fq:r.fq||""}))}]};
  const dnsGroep=()=>dns.map(d=>{const c=dnsCalc(d);return c.rows.length?{omschrijving:d.groepOms||d.naam,aantal:1,prijs:c.ex,subs:d.groepOms?[]:c.rows.map(r=>({naam:r.it.naam,qty:String(r.it.aantal).replace(".",",")+" "+eenhKort(r.it.eenheid),fq:fqTxt(Number(r.it.fq)||Number(d.frequentie)||8)}))}:null}).filter(Boolean);
  const allRegels=()=>[...glasGroep(),...dnsGroep(),...extra.filter(r=>r.omschrijving||Number(r.prijs))].map(r=>({omschrijving:String(r.omschrijving||""),aantal:Number(r.aantal)||0,prijs:Number(r.prijs)||0,...(r.subs&&r.subs.length?{subs:r.subs}:{})}));
  const glasFreq=()=>{try{const fl=RC.freqList().filter(f=>f.aan!==false||f.k===RC.getFreq()),cur=RC.getFreq();return `<label class="ow-gf">Frequentie glasbewassing<select id="owGF">${fl.map(f=>`<option value="${f.k}" ${f.k===cur?"selected":""}>${esc(f.l)}${f.p?` (${f.p>0?"−":"+"}${Math.abs(f.p)}%)`:""}</option>`).join("")}</select></label>`}catch(e){return ""}};
  const glasW=()=>Number($o("freq").value)||8;
  const dnsHtml=()=>dns.map((d,i)=>{d.frequentie=glasW();const c=dnsCalc(d);return `<div class="ow-dn"><div class="ow-dnh"><b>${esc(d.naam)}</b><span class="sp"></span><span class="mono">${c.ex?eur(c.ex):""}</span><button type="button" class="iconbtn sm" data-dnrm="${i}" aria-label="Dienst weghalen">${I.x}</button></div>
      ${groepEditor(d,"d"+i,{offerte:true,freqDefault:glasW()})}</div>`}).join("");
  const draw=()=>{
    const rr=rc?rc.regels:[];
    $("#owRegels").innerHTML=`<div class="ow-glas">${glasFreq()}</div>${rr.length?`<div class="ow-rc"><div class="ow-rch"><span class="eyebrow">Glasbewassing uit de rekentool${rc.count?" · "+rc.count+" ramen":""}</span><button type="button" class="small ghost" id="owRcX" aria-label="Regels uit de rekentool weghalen" title="Weghalen">${I.x}</button></div>${rr.map(r=>`<div class="ow-row"><span>${esc(String(r.omschrijving).replace(/ ?\(minimumtarief\)/gi,""))}${r.sec?`<small class="ow-rsec">${(Math.round(r.sec/6)/10).toLocaleString("nl-NL")} min werktijd · alleen voor jou</small>`:""}</span><span class="mono">${eur(r.prijs)}</span></div>`).join("")}${rr.some(r=>r.sec)?`<div class="ow-row ow-rtot"><span>Werktijd totaal ${Math.round(rr.reduce((a,r)=>a+(r.sec||0),0)/60)} min</span><span class="mono">${eur(rr.reduce((a,r)=>a+r.prijs,0))}</span></div>`:""}</div>`:`<p class="subt" style="margin:6px 0 10px">Nog niets uit de rekentool. Tik in de rekentool de ramen aan op de foto's, of voeg hieronder een dienst toe.</p>`}
      ${dns.length?`<div class="ow-dns">${dnsHtml()}</div>`:""}
      <div class="lines">${extra.map((r,i)=>`<div class="line"><input data-l="${i}" data-k="omschrijving" value="${esc(r.omschrijving)}" placeholder="Omschrijving" aria-label="Omschrijving"><input data-l="${i}" data-k="aantal" type="number" min="0" step="1" value="${esc(r.aantal)}" aria-label="Aantal"><input data-l="${i}" data-k="prijs" type="number" step="0.01" value="${esc(r.prijs)}" placeholder="Prijs excl." aria-label="Prijs excl. btw"><button type="button" class="small ghost" data-rm="${i}" aria-label="Regel verwijderen">${I.x}</button></div>`).join("")}</div>`;
    tot()};
  const tot=()=>{const kk=state.klanten.find(x=>x.id===kid),t=totals({regels:kk?btwRegels(kk,allRegels()):allRegels(),btw:Number($o("btw").value),incl:false});
    $("#owTot").innerHTML=`<span>Subtotaal excl. btw</span><span>${eur(t.ex)}</span>${t.tarieven.map(x=>`<span>Btw ${x.pct}%</span><span>${eur(x.btw)}</span>`).join("")}<span class="grand">Totaal per beurt</span><span class="grand">${eur(t.inc)}</span>`};
  $("#owRegels").addEventListener("input",e=>{const i=e.target.dataset.l;if(i==null)return;const key=e.target.dataset.k;extra[i][key]=key==="omschrijving"?e.target.value:e.target.value===""?"":Number(e.target.value);tot()});
  groepBind($("#owRegels"),key=>dns[+key.slice(1)],(key,struct)=>{const d=dns[+key.slice(1)];if(!d)return;if(struct)draw();else{groepTotUpdate($("#owRegels"),key,d,{offerte:true,freqDefault:glasW()});const h=$("#owRegels").querySelector(`[data-ge="${key}"]`);const m=h&&h.closest(".ow-dn")?h.closest(".ow-dn").querySelector(".ow-dnh .mono"):null;if(m){const c=dnsCalc(d);m.textContent=c.ex?eur(c.ex):""}tot()}});
  $("#owRegels").addEventListener("change",e=>{const el=e.target;
    if(el.id==="owGF"){RC.setFreq(el.value);return}
    if(el.dataset.dnf){dns[+el.dataset.dnf].frequentie=Number(el.value);draw();return}
});
  $("#owRegels").addEventListener("click",e=>{const dr=e.target.closest("[data-dnrm]");if(dr){dns.splice(+dr.dataset.dnrm,1);draw();return}
    if(e.target.closest("#owRcX")){rc=null;draw();return}const b=e.target.closest("[data-rm]");if(b){extra.splice(Number(b.dataset.rm),1);draw()}});
  $("#owAdd").onclick=()=>{extra.push({omschrijving:"",aantal:1,prijs:""});draw();const l=$("#owRegels").querySelectorAll(".line input[data-k=omschrijving]");if(l.length)l[l.length-1].focus()};
  form.querySelectorAll("[data-dn]").forEach(b=>b.onclick=()=>{const d=diensten[+b.dataset.dn];
    if(d.glas){/* voorkeur: foto's aantikken; de aantallen kunnen ook met de hand */try{RC.handmatig(true)}catch(e){}const r=$("#owRc");if(r)r.scrollIntoView({block:"start",behavior:"smooth"});toast("Tik bij voorkeur de ramen aan op foto's. Geen foto? Vul de aantallen per verdieping zelf in.");return}
    if(d.items&&d.items.length){const bestaand=dns.findIndex(x=>x.groep===d.groep);if(bestaand<0)dns.push({id:newId("o"),groep:d.groep,naam:d.naam,frequentie:Number($o("freq").value)||8,items:d.items.map(it=>({...it,aantal:0}))});draw();const c=$("#owRegels").querySelectorAll(".ow-dn");const el=c[bestaand<0?c.length-1:bestaand];if(el)el.scrollIntoView({block:"center",behavior:"smooth"});return}
    extra.push({omschrijving:d.naam,aantal:1,prijs:r2(ex2inc(d.prijs||0))});draw()});
  $o("btw").onchange=tot;
  /* tekst offerte: ingeklapt een voorbeeld, opengeklapt aanpassen */
  const txtV=()=>{const f0={klantNaam:$o("naam").value.trim()||"(klant)",klantId:kid},yn=b=>b?"Ja":"Nee",para=t=>esc(offTxt(t,f0)).replace(/\n/g,"<br>")||'<span class="subt">—</span>';
    $("#owTxtV").innerHTML=`<div class="ow-kv"><span>Tekst offerte</span><b class="ow-tp">${para($o("tekst").value)}</b></div><div class="ow-kv"><span>Voettekst offerte</span><b class="ow-tp">${para($o("voet").value)}</b></div>${$o("letop").checked?`<div class="ow-kv"><span>"Let op"-tekst</span><b class="ow-tp">${para($o("letopt").value)}</b></div>`:""}<div class="ow-kv"><span>Totaalprijs offerte tonen</span><b>${yn($o("totaal").checked)}</b></div>`;
    $("#owLetopW").hidden=!$o("letop").checked;$("#owTotW").hidden=!$o("totaal").checked};
  const txtOpen=on=>{$("#owTxtE").hidden=!on;$("#owTxtV").hidden=on;$("#owTxtT").hidden=on;if(!on)txtV()};
  $("#owTxtT").onclick=()=>txtOpen(true);$("#owTxtK").onclick=()=>txtOpen(false);
  ["letop","totaal"].forEach(n=>$o(n).onchange=txtV);
  let lastTxt=null;["tekst","voet","letopt"].forEach(n=>$o(n).addEventListener("focus",()=>lastTxt=$o(n)));
  form.querySelectorAll("[data-leg]").forEach(b=>b.onclick=()=>{const l=form.querySelector(".ow-legb");l.hidden=!l.hidden});
  form.querySelectorAll(".ow-legb [data-ins]").forEach(b=>b.onmousedown=e=>{e.preventDefault();const el=lastTxt||$o("tekst"),p=el.selectionStart??el.value.length;el.value=el.value.slice(0,p)+b.dataset.ins+el.value.slice(el.selectionEnd??p);el.focus();el.selectionStart=el.selectionEnd=p+b.dataset.ins.length});
  txtV();
  const factH=()=>{const h=$("#owFactH");if(h)h.textContent=FACT_HELP[$o("fact").value]||""};$o("fact").onchange=factH;factH();
  $o("freq").onchange=()=>{touched.freq=true;draw()};$o("duur").onchange=()=>touched.duur=true;
  const sub=()=>{const n=$o("naam").value.trim(),a=[$o("adres").value.trim(),[$o("postcode").value.trim(),$o("plaats").value.trim()].filter(Boolean).join(" ")].filter(Boolean).join(", ");$("#owSub").textContent=n?n+(a?" · "+a:""):"Kies een klant of vul een nieuwe klant in"};
  ["naam","adres","postcode","plaats"].forEach(n=>$o(n).addEventListener("input",sub));
  /* naar de klantkaart van de gekozen klant (vraagt eerst of je wijzigingen wilt bewaren, zoals bij sluiten) */
  const kkB=$("#owKk");if(kkB)kkB.onclick=()=>{const id=$o("k").value;if(!id)return;sluitDlg(()=>openKlant(id))};
  $o("k").addEventListener("change",()=>{if(kkB)kkB.hidden=!$o("k").value});
  $o("k").onchange=e=>{const k=state.klanten.find(x=>x.id===e.target.value);kid=k?k.id:"";
    ["naam","adres","postcode","plaats","email","telefoon"].forEach(n=>$o(n).value=k?k[n]||"":"");$o("soort").value=k&&(k.soort==="zakelijk"||k.soort==="vve")?k.soort:"particulier";
    if(k&&!touched.freq&&!rc){$o("freq").value=String(k.frequentie||8)}sub();if(RC)RC.sync()};
  /* rekentool: ongewijzigd, alleen gekoppeld aan dit scherm */
  try{if(!RC)RC=buildRamen();
    RC.setEmbed({klantId:kid,base:k0||{},
      form:()=>({naam:$o("naam").value.trim(),adres:$o("adres").value.trim(),pc:$o("postcode").value.trim().toUpperCase(),plaats:$o("plaats").value.trim(),tel:$o("telefoon").value.trim(),email:$o("email").value.trim(),notitie:"",zakelijk:$o("soort").value==="zakelijk"}),
      onCalc:()=>{if(!$("#owRegels"))return;const c=RC.current();if(c)rc=c;if(c){if(!touched.freq&&rc.opd.frequentie){const w=String(rc.opd.frequentie);if(![...$o("freq").options].some(o=>o.value===w))$o("freq").insertAdjacentHTML("beforeend",`<option value="${w}">Elke ${w} weken</option>`);$o("freq").value=w}if(!touched.duur&&rc.opd.duur)$o("duur").value=String(rc.opd.duur)}draw()},
      onSave:async patch=>{const id=await saveKlant(patch);return id},
      offerte:mode=>doSave(mode==="send"?"send":"view")},true);
    $("#owRc").appendChild(RC.host);RC.setOfferte(true);RC.sync();
    const t0=ex&&ex.rcTelling?ex.rcTelling:(legacyRc||opts.metTelling)&&k0&&k0.ramenTelling?k0.ramenTelling:null;if(t0)RC.loadObj(t0)}
  catch(er){console.error(er);const m=$("#owRc");if(m)m.innerHTML='<p class="subt">De rekentool kon hier niet worden geladen.</p>'}
  draw();
  /* klant opslaan: bestaande klant bijwerken, nieuwe klant als 'wacht op akkoord' */
  const klantVelden=()=>{const pc=$o("postcode").value.trim().toUpperCase().replace(/\s+/g,""),postcode=/^\d{4}[A-Z]{2}$/.test(pc)?pc.slice(0,4)+" "+pc.slice(4):$o("postcode").value.trim().toUpperCase();
    return {naam:$o("naam").value.trim(),adres:$o("adres").value.trim(),postcode,plaats:$o("plaats").value.trim(),email:$o("email").value.trim(),telefoon:$o("telefoon").value.trim(),soort:$o("soort").value}};
  async function saveKlant(patch={}){
    const kv=klantVelden();if(!kv.naam||!kv.adres){$o(kv.naam?"adres":"naam").focus();throw {msg:"Vul eerst de naam en het adres van de klant in (links)."}}
    const cur=state.klanten.find(x=>x.id===kid);
    if(cur){await save("klanten",kid,{...strip(cur),...kv,...patch});return kid}
    kid=newId("k");
    await save("klanten",kid,{...kv,klantnr:"",ronde:"",frequentie:Number($o("freq").value)||8,prijs:0,laatst:"",gepland:"",tijd:"",duur:Number($o("duur").value)||30,dienst:"Glasbewassing",objectId:"",binnen:false,
      actief:true,prospect:true,incasso:$o("betaal").value==="incasso",akkoord:false,geenReview:false,opzegReden:"",notities:"",aangemaakt:iso(today()),log:[],objecten:[],...patch});
    return kid}
  let busyNow=false;
  async function doSave(mode){
    if(busyNow)return;const regels=allRegels();
    const kv=klantVelden();if(!kv.naam||!kv.adres){$o(kv.naam?"adres":"naam").focus();toast("Vul de naam en het adres van de klant in");return}
    const opslaan=mode==="save"||mode==="saveclose";
    if(!regels.length&&!opslaan){toast("Voeg minimaal één offerteregel toe, of bereken de prijs in de rekentool");return}
    if(!opslaan){const glasNu=(rc&&rc.regels&&rc.regels.length)||extra.some(r=>/glas|ramen/i.test(String(r.omschrijving||""))),k1=state.klanten.find(x=>x.id===kid);
      if(dns.length&&!glasNu&&!heeftGlas(k1)){toast(GLAS_REGEL+" Tel eerst de ramen in de rekentool, of voeg een regel glasbewassing toe.");const r=$("#owRc");if(r)r.scrollIntoView({block:"start",behavior:"smooth"});return}}
    busyNow=true;const btns=form.querySelectorAll(".kk-foot button");btns.forEach(b=>b.disabled=true);
    try{
      const btw=Number($o("btw").value),hoofd=[...(rc?rc.regels:[]),...extra.filter(r=>r.omschrijving||Number(r.prijs))],t=totals({regels:hoofd,btw,incl:false});
      const dnsExtra=dns.map(d=>{const c=dnsCalc(d);return c.ex?{id:d.id||newId("o"),dienst:d.naam,groep:d.groep,items:d.items.map(x=>({...x})),oms:d.oms||"",start:d.start??"",tp:d.tp??"",td:d.td??"",groepOms:d.groepOms||"",prijs:r2(st.incl?c.ex*(1+btw/100):c.ex),frequentie:Number(d.frequentie)||8,duur:Math.max(5,Math.ceil(c.sec/60/5)*5),volgende:"",actief:true}:null}).filter(Boolean);
      const opdracht={prijs:r2(st.incl?t.inc:t.ex),frequentie:Number($o("freq").value)||8,duur:Number($o("duur").value)||30,extra:dnsExtra};
      let tel=null,fail=0;if(rc){const r=await RC.telling();tel=r.t;fail=r.fail}
      const wasNew=!state.klanten.some(x=>x.id===kid),cur=state.klanten.find(x=>x.id===kid);
      const kPatch={...(tel?{ramenTelling:tel}:{}),...((wasNew||(cur&&cur.prospect))?{prijs:opdracht.prijs,frequentie:opdracht.frequentie,duur:opdracht.duur,incasso:$o("betaal").value==="incasso",opdrachten:[...((cur&&cur.opdrachten)||[]).filter(o=>!o.groep||!dnsExtra.some(e=>e.groep===o.groep)),...dnsExtra]}:{})};
      const klantId=await saveKlant(kPatch);const k=state.klanten.find(x=>x.id===klantId)||{...kv,id:klantId};
      if($("#ow-std").checked){const sd={...state.settings,offerteTekst:$o("tekst").value,offerteVoet:$o("voet").value,offerteLetopAan:$o("letop").checked,offerteLetop:$o("letopt").value,offerteTotaal:$o("totaal").checked};await save("instellingen","bedrijf",sd);state.settings=sd}
      const datum=$o("datum").value||iso(today()),id=ex?ex.id:newId("f");
      const data={...(ex?strip(ex):{}),soort:"offerte",nummer:ex?ex.nummer:nextNr("offerte",datum),klantId,klantNaam:kv.naam,klantAdres:fullAddr(kv),klantEmail:kv.email,datum,verval:$o("verval").value||iso(addDays(parse(datum),30)),
        regels,extraRegels:extra.filter(r=>r.omschrijving||Number(r.prijs)).map(r=>({omschrijving:String(r.omschrijving||""),aantal:Number(r.aantal)||0,prijs:Number(r.prijs)||0})),rcTelling:tel||(rc&&ex?ex.rcTelling||null:null),rcRegels:rc?rc.regels.map(r=>({omschrijving:r.omschrijving,aantal:r.aantal,prijs:r.prijs})):null,
        diensten:dns,btw,incl:false,status:mode==="sent"?"verstuurd":ex?ex.status||"concept":"concept",tekst:$o("tekst").value,voettekst:$o("voet").value,notitie:$o("notitie").value.trim(),start:$o("start").value,betaalwijze:$o("betaal").value,facturatie:$o("fact").value,letop:$o("letop").checked,letopTekst:$o("letopt").value,totaalTonen:$o("totaal").checked,opdracht,
        telling:tel?{ramen:tel.ramen,minuten:tel.minuten}:(ex&&ex.telling)||null,
        betaaldOp:"",vanOfferte:"",gemaakt:ex?ex.gemaakt||"":new Date().toISOString(),verstuurdOp:mode==="sent"?new Date().toISOString():ex?ex.verstuurdOp||"":"",herinnerdOp:ex?ex.herinnerdOp||"":"",herinneringen:ex?ex.herinneringen||0:0};
      await save("facturen",id,data);
      sig0=null;
      if(opslaan){toast("Offerte "+data.nummer+" opgeslagen als concept · je vindt hem bij Offertes"+(fail?" · "+plural(fail,"foto is","foto's zijn")+" niet opgeslagen":""));
        if(mode==="save"){if(RC)RC.reset();let n=0;const go=()=>{if(state.facturen.some(x=>x.id===id))openOfferte({id,back:opts.back});else if(++n<30)setTimeout(go,100)};setTimeout(go,60)}
        return true}
      toast((ex?"Offerte "+data.nummer+" opgeslagen":(wasNew?"Klant aangemaakt en offerte ":"Offerte ")+data.nummer+" staat bij Offertes")+(mode==="sent"?" · op verstuurd gezet":"")+(fail?" · "+plural(fail,"foto is","foto's zijn")+" niet opgeslagen":""));
      if(RC)RC.reset();
      let n=0;const go=()=>{if(state.facturen.some(x=>x.id===id)){mode==="send"?sendF(id):openFactuur(id)}else if(++n<30)setTimeout(go,100)};setTimeout(go,60)}
    catch(er){if(er&&er.msg)toast(er.msg);else err(er);return false}
    finally{busyNow=false;btns.forEach(b=>b.disabled=false)}
    return true}
  form.onsubmit=e=>{e.preventDefault();doSave("send")};
  $("#owView").onclick=()=>doSave("view");$("#owSave").onclick=()=>doSave("save");
  /* niet per ongeluk alles kwijt: bij sluiten met wijzigingen vragen om op te slaan */
  const sig=()=>{try{return JSON.stringify([[...form.querySelectorAll("input,select,textarea")].filter(e=>e.type!=="file").map(e=>e.type==="checkbox"?e.checked:e.value),dns,extra,rc&&rc.regels?rc.regels.map(r=>[r.omschrijving,r.aantal,r.prijs]):null])}catch(e){return ""}};
  let sig0=null;setTimeout(()=>{if(form.contains($("#owSave")))sig0=sig()},700);
  dlgGuard=async()=>{if(!form.contains($("#owSave")))return true;if(sig0===null||sig()===sig0)return true;
    const a=await vraag("Offerte nog niet opgeslagen","Je hebt wijzigingen in deze offerte die nog niet zijn opgeslagen. Wil je hem bewaren als concept, zodat je later verder kunt?","Opslaan als concept","Niet opslaan");
    if(a===null)return false;if(a===false)return true;return await doSave("saveclose")};$("#owSent").onclick=()=>doSave("sent");
  const d=$("#owDel");if(d){let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}
    try{await del("facturen",ex.id);dlg.close();toast(ex.nummer+" verwijderd")}catch(er){err(er)}}}
}
