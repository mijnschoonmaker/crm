/* ---------- OPDRACHT-WERKBLAD: alles van één opdracht in één scherm ---------- */
function openOpdrachtWerk(kid,focus){
  const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  /* een dienst die bij een andere opdracht hoort, opent in die opdracht */
  {const c=focus&&(k.opdrachten||[]).find(o=>o.id===focus),p=c&&opdrBij(k,c);if(p)focus=p}
  const st=S(),incl=!!st.incl,btwL=incl?"incl.":"excl.";
  /* bestaande extra opdrachten (eigen nummer, bijv. 1002-2) horen niet in het werkblad van de hoofdopdracht; ze blijven wel bewaard */
  let extra=(k.opdrachten||[]).map(o=>({...o,_bestaand:true}));
  /* gewijzigde tarieven (Uitvoering › Diensten) meteen in de opdracht; de nieuwe prijs wordt bewaard bij Opslaan */
  extra.forEach(o=>{try{if(o.items&&groepTarievenBij(o)){const c=groepCalc(o),mul=incl?1+(Number(st.btw)||21)/100:1;o.prijs=r2(c.ex*mul);o.duur=Math.max(5,Math.ceil(c.sec/60/5)*5)}}catch(e){console.error(e)}});
  if(focus==="new")extra.push({id:newId("o"),dienst:"",prijs:"",frequentie:52,duur:30,volgende:"",actief:true,_nieuw:true});
  /* een extra of nieuwe opdracht opent als eigen opdrachtkaart met een eigen nummer (bijv. 1002-2); de hoofdopdracht blijft ongemoeid */
  const soloId=focus&&!["main","hosp"].includes(focus)?(focus==="new"?extra[extra.length-1].id:focus):null,soloI=soloId?extra.findIndex(o=>o.id===soloId):-1;
  const soloNr=(()=>{if(soloI<0)return 1;const eo=typeof extraOpdr==="function"?extraOpdr(k):(k.opdrachten||[]),j=eo.findIndex(o=>o.id===soloId);return (soloId&&typeof opdrNr==="function"&&(k.opdrachten||[]).some(o=>o.id===soloId))?(extra[soloI].nr||opdrNr(k,soloId)):typeof opdrVolgNr==="function"?opdrVolgNr(k):(j>=0?j+2:eo.length+2)})();
  /* losse opdracht (eigen nummer): het adres stel je links bij Adres in, voor deze opdracht */
  /* in een losse opdracht kun je meer diensten toevoegen: elke extra dienst wordt een eigen opdracht (eigen nummer) op hetzelfde adres */
  const soloSet=new Set(soloI>=0?[soloI,...extra.map((o,i)=>i!==soloI&&o.actief!==false&&opdrBij(k,o)===soloId?i:-1).filter(i=>i>=0)]:[]);
  const soloR=soloI>=0?extra[soloI]:null,soloAdr=()=>{const o=soloR&&soloR.objectId&&(k.objecten||[]).find(x=>x.id===soloR.objectId&&x.adres);return o?fullAddr(o)+(o.naam?" · "+o.naam:""):fullAddr(k)};
  let fotos=[...(k.fotos||[])];
  const tFotos=(k.ramenTelling&&k.ramenTelling.fotos)||[];
  const fs=state.facturen.filter(f=>f.klantId===k.id&&f.soort!=="offerte"),open=fs.filter(f=>["Openstaand","Achterstallig"].includes(fStatus(f)[1]));
  const off=state.facturen.filter(f=>f.klantId===k.id&&f.soort==="offerte"&&f.status==="geaccepteerd").sort((a,b)=>String(b.akkoordOp||b.datum).localeCompare(String(a.akkoordOp||a.datum)))[0];
  const status=k.prospect?["soon","Wacht op akkoord"]:k.actief===false?["neutral","Gestopt"]:["ok","Lopend"];
  const freqO=w=>freqOpts(Number(w)||4);
  const durO=[...new Set([15,30,45,60,90,120,180,240,Number(k.duur)||30])].sort((a,b)=>a-b);
  const kv=(a,b)=>`<div class="ow-kv"><span>${a}</span><b>${b}</b></div>`;
  const diensten=dienstLijst();
  const nr=klantNr(k);
  openDlg(`<div class="ow-kop jp-kop ow-${status[0]}"><div class="jp-kr1"><span class="jp-st"><i></i>${status[1]}</span><span class="sp"></span><button type="button" class="jp-ib" id="owX" aria-label="Terug naar klantkaart">${I.x}</button></div>
    <div class="jp-kr2"><span class="jp-k1"><small>${soloI>=0&&extra[soloI]._nieuw?"Nieuwe opdracht":"Opdracht"}</small><b>${esc(nr)}-${soloNr}</b></span><span class="jp-k2"><b>${esc(cleanName(k.naam))}</b><em>${I.pin}${esc(jobAddr(k))}</em></span>${soloI>=0?`<span class="jp-k3"><small>${esc(extra[soloI].dienst||"Kies een dienst")}</small><b>${extra[soloI].prijs!==""&&extra[soloI].prijs!=null?eur(toon(extra[soloI].prijs)):"—"}</b><em>${esc(freqLabel(Number(extra[soloI].frequentie)||52))}</em></span>`:`<span class="jp-k3"><small>${esc(k.dienst||"Glasbewassing")}</small><b>${eur(toon(k.prijs))}</b><em>${esc(ritmeTxt(k))} · ${duur(k)} min</em></span>`}</div></div>
  <div class="hosp-top" id="owHospTop">${hospBlok(k,{leegKnop:false})}</div>
  <div class="kk-grid ow-grid"><div class="kk-left">
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Klantgegevens</b><span class="sp"></span><button type="button" class="small" id="owKk">${I.right}Klantkaart</button></div>
      ${kv("Klantnummer",esc(nr))}${kv("Naam",esc(cleanName(k.naam)))}${kv("E-mail",k.email?`<a href="mailto:${esc(k.email)}">${esc(k.email)}</a>`:"—")}${kv("Telefoon",k.telefoon?`<a href="tel:${esc(String(k.telefoon).replace(/[^\d+]/g,""))}">${esc(k.telefoon)}</a>`:"—")}${kv("Soort",soortLbl(k))}</section>
    <section class="kp" id="owAdrK"><div class="kp-h"><span class="objic">${I.pin}</span><b>Adres</b><span class="sp"></span>
        <span id="owAdrKn" class="ow-adrkn"><button type="button" class="iconbtn sm" id="owAdrE" aria-label="Adres en ontvangers wijzigen" title="Wijzigen">${I.pencil}</button></span>
        <span id="owAdrKe" class="ow-adrkn" hidden><button type="button" class="small" id="owAdrU" aria-label="Annuleren" title="Annuleren">${I.undo||I.x}</button><button type="button" class="small primary" id="owAdrS" aria-label="Opslaan" title="Opslaan">${I.save||I.check}</button></span></div>
      <div id="owAdrV">${kv("Adres",esc(soloR?soloAdr():jobAddr(k)))}
      ${[["offerte","Offerte gaat naar"],["factuur","Facturen gaan naar"],["planning","Planningsmails gaan naar"]].map(([x,l])=>kv(l,(mailK(k,x).email?esc(mailK(k,x).email):"—")+(tavK(k,x)?`<br><small class="subt">t.a.v. ${esc(tavK(k,x))}</small>`:""))).join("")}</div>
      <div id="owAdrF" class="ow-adrf" hidden></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.planning}</span><b>Opdracht</b><span class="sp"></span><button type="button" class="iconbtn sm" id="owOpdE" aria-label="Opdracht wijzigen" title="Wijzigen">${I.pencil}</button></div>
      <div class="ow-kvs" id="owOpdV"></div>
      <div class="grid2" id="owOpdF" hidden>
        <label>Ronde<input id="ow-ronde" list="ow-rl" value="${esc(k.ronde||"")}" placeholder="bijv. Ronde Noord"><datalist id="ow-rl">${rondes().map(r=>`<option value="${esc(r)}">`).join("")}</datalist></label>
        <label>Volgende beurt<input value="${k.gepland?esc(fmtL(k.gepland))+(k.tijd?" "+esc(k.tijd):""):"Te plannen"}" disabled></label>
        <label>Eerste keer<select id="ow-eerste"><option value="ja" ${isEersteKeer(k)?"selected":""}>Ja</option><option value="nee" ${isEersteKeer(k)?"":"selected"}>Nee</option></select><small class="help">${k.eersteKeer==null?"Automatisch ingevuld: ":""}wordt na de eerste afgemelde beurt vanzelf Nee</small></label>
        <label>Contactmethode planning<select id="ow-contact">${[["kennisgeving","Kennisgeving"],["bevestigen","Afspraakvoorstel"],["bellen","Klant bellen"],["geen","Niet e-mailen"]].map(([v,l])=>`<option value="${v}" ${(k.contactPlanning||"kennisgeving")===v?"selected":""}>${l}</option>`).join("")}</select></label>
        <label>Toeslag (%)<input id="ow-toeslag" type="number" step="1" min="0" value="${esc(k.toeslag||"")}" placeholder="0"></label>
        <label>Reden toeslag<input id="ow-toeslagr" value="${esc(k.toeslagReden||"")}" placeholder="Bijv. hoogwerker nodig"></label>
        <label class="check-row"><input id="ow-verbA" type="checkbox" ${k.verbergAantal?"checked":""}>Aantallen verbergen op factuur</label>
        <label class="check-row"><input id="ow-verbF" type="checkbox" ${k.verbergFreq?"checked":""}>Frequenties verbergen op factuur</label>
        <label class="full check-row"><input id="ow-afmail" type="checkbox" ${k.afmeldMail?"checked":""}>Afmeldbericht klaarzetten na elke beurt</label>
        <label class="full check-row"><input id="ow-bellen" type="checkbox" ${k.bellen?"checked":""}>Medewerker moet onderweg bellen <small class="help">staat bij de klus op de route</small></label>
        <label class="full check-row"><input id="ow-actief" type="checkbox" ${k.actief!==false?"checked":""}>Opdracht loopt (uitzetten = klant inactief, alle toekomstige afspraken vervallen)</label>
        ${k.gepland?`<button type="button" class="small ghost danger" id="owWis" style="grid-column:1/-1;justify-self:start;white-space:nowrap">Alle toekomstige afspraken verwijderen</button>`:""}
      </div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.facturen}</span><b>Details contract</b></div>
      ${kv("Status",status[1])}<div class="grid2"><label>Startdatum contract<input id="ow-start" type="date" value="${esc(k.startdatum||String((off&&off.akkoordOp)||k.aangemaakt||iso(today())).slice(0,10))}"></label><label>Einddatum contract<input id="ow-eind" type="date" value="${esc(k.einddatum||"")}"><small class="help">Na deze datum niet meer aanbieden</small></label></div>${kv("Offerte",off?`<button type="button" class="linkbtn" data-act="factuur" data-id="${esc(off.id)}">${esc(off.nummer)} · geaccepteerd</button>`:"—")}
      <label class="check-row"><input id="ow-akkoord" type="checkbox" ${k.akkoord?"checked":""}>Akkoord op overeenkomst en algemene voorwaarden</label></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.euro||I.facturen}</span><b>Facturatie</b></div>
      <div class="grid2">
        <label>Betaalwijze<select id="ow-betaal"><option value="bank" ${k.incasso?"":"selected"}>Per bank</option><option value="incasso" ${k.incasso?"selected":""}>Automatische incasso</option></select></label>
        <label>Facturatie<select id="ow-fact">${FACT_OPT.map(([a,b])=>`<option value="${a}" ${factModus(k)===a?"selected":""}>${b}</option>`).join("")}</select><small class="help" id="owFactH">${esc(FACT_HELP[factModus(k)])}</small></label>
      </div>
      <div class="ow-per${isPeriodiek(k)?" on":""}"><span class="objic">${I.receipt}</span><div><b>Periodieke factuur</b><small>${isPeriodiek(k)?esc(perLabel(k.periodiek.freq))+" · volgende "+esc(fmtL(k.periodiek.volgende))+" · "+eur((k.periodiek.regels||[]).reduce((a,r)=>a+(Number(r.aantal)||1)*(Number(r.prijs)||0),0))+" excl.":"Bijv. trappenhal elke week, één factuur per maand"}</small></div><button type="button" class="small${isPeriodiek(k)?"":" primary"}" id="owPer">${isPeriodiek(k)?I.pencil+"Aanpassen":I.plus+"Aanmaken"}</button></div>
      <label class="check-row"><input id="ow-verlegd" type="checkbox" ${k.btwVerlegd?"checked":""}>Btw verleggen <small class="help">factuur met 0% btw en de vermelding "Btw verlegd"</small></label>
      ${kv("Openstaande facturen",open.length?`<span class="pill late">${plural(open.length,"factuur","facturen")} · ${eur(open.reduce((a,f)=>a+totals(f).inc,0))}</span>`:"Nee")}</section>
  </div><div class="kk-side">
    <section class="kp"><div class="kp-h"><span class="objic">${I.pencil}</span><b>Taakomschrijving</b></div>
      <textarea id="ow-taak" style="min-height:70px" placeholder="Bijv. wassen ramen incl. kozijnen, achterom via de poort">${esc(soloR?(soloR.taak||""):(k.taak||""))}</textarea>
</section>
    ${k.soort==="vve"?`<section class="kp"><div class="kp-h"><span class="objic">${I.checksq||I.check}</span><b>Checklist VvE</b></div>
      <p class="subt" style="margin:0 0 8px">Per ruimte of taak hoe vaak. Bij het afmelden ziet je medewerker alleen wat die dag aan de beurt is; het bestuur ziet het in het portaal.</p>
      <div id="ow-vvetaken" class="vve-ed">${vveTaken(k).map(t=>vveEdRij(t,vveFreq(k,t))).join("")}</div>
      <button type="button" class="small" id="owVveTk" style="margin-top:8px">${I.plus}Ruimte of taak toevoegen</button></section>`:""}
    <section class="kp"><div class="kp-h"><span class="objic">${I.plus}</span><b>Opdrachtregel toevoegen</b><span class="sp"></span><button type="button" class="small" id="owEigen">${I.plus}Eigen dienst</button></div>
      <input id="owZoek" placeholder="Zoeken" style="max-width:280px">
      <div class="ow-chips" id="owChips">${dienstChips(diensten,"data-dn")}</div></section>
    <section class="kp" id="owRegelsK"><div class="kp-h"><span class="objic">${I.check}</span><b>Opdrachtregels</b></div><div id="owLines"></div><div class="totals" id="owTot"></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.receipt}</span><div style="min-width:0"><b>Artikelen</b><small>Gaan eenmalig mee op de volgende factuur</small></div><span class="sp"></span><button type="button" class="iconbtn sm primary" id="owArtAdd" aria-label="Artikel toevoegen">${I.plus}</button></div><div id="owArt"></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.wrench}</span><div style="min-width:0"><b>Bedrijfsmiddelen</b><small>Staan bij de klus op de route</small></div></div><div id="owMid"></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.camera||I.upload}</span><b>Foto's</b><span class="sp"></span><label class="iconbtn sm primary" role="button" tabindex="0" aria-label="Foto's van de woning toevoegen" title="Foto's van de woning toevoegen" style="cursor:pointer">${I.plus}<input type="file" accept="image/*" multiple hidden id="owFoto"></label></div><div class="ow-fotos" id="owFotos"></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.chat}</span><b>Logboek</b></div>
      <div class="log">${[...(k.log||[]).map(l=>({d:l.datum,t:l.tekst,s:"Notitie"})),...state.berichten.filter(m=>m.klantId===k.id).map(m=>({d:String(m.op).slice(0,10),t:m.tekst,s:KANAAL[m.kanaal]||m.kanaal}))].sort((a,b)=>String(b.d).localeCompare(String(a.d))).slice(0,15).map(l=>`<div><span>${fmtD(l.d)} · ${esc(l.s)}</span>${esc(l.t)}</div>`).join("")||'<div style="color:var(--muted)">Er zijn nog geen logboekregels.</div>'}</div>
      <div class="log-in"><input id="ow-log" placeholder="Notitie toevoegen…" aria-label="Notitie voor het logboek"><button type="button" class="small primary" id="owLog">${I.plus}Noteer</button></div></section>
  </div></div>
  <div class="row stickyfoot kk-foot">${soloI>=0?"":`<button type="button" class="ghost danger" id="owDel">${I.trash}Opdracht verwijderen</button>`}<span class="sp"></span><button type="button" id="owBack">Annuleren</button><button type="submit" class="primary" id="owSave">${I.check}Opslaan</button></div>`,{xwide:true});
  const $o=n=>$("#ow-"+n);
  /* Opdracht: rustig overzicht (zoals het vorige CRM); potlood = wijzigen */
  const drawOpdV=()=>{const v=$("#owOpdV");if(!v)return;const g=n=>$o(n),ja=c=>c&&c.checked?"Ja":"Nee",sel=n=>{const e=g(n);return e&&e.selectedIndex>=0?e.options[e.selectedIndex].text:"—"};
    const ts=Number(g("toeslag")&&g("toeslag").value)||0,tr=(g("toeslagr")&&g("toeslagr").value.trim())||"";
    const rij=(a,b)=>`<div class="ow-kv"><span>${a}</span><b>${b}</b></div>`;
    v.innerHTML=rij("Ronde",esc((g("ronde")&&g("ronde").value.trim())||"—"))+rij("Volgende beurt",k.gepland?esc(fmtL(k.gepland))+(k.tijd?" "+esc(k.tijd):""):"Te plannen")+rij("Eerste keer",esc(sel("eerste")))+rij("Contactmethode planning",esc(sel("contact")))
      +rij("Medewerker moet onderweg bellen",ja(g("bellen")))+rij("Aantallen verbergen voor de klant",ja(g("verbA")))+rij("Frequenties verbergen voor de klant",ja(g("verbF")))
      +rij("Toeslag hanteren",ts?ts+"%":"Nee")+rij("Toeslag reden",esc(tr||"—"))+rij("Afmeldbericht actief",ja(g("afmail")))+rij("Opdracht loopt",ja(g("actief")))
      +(k.gepland?rij("Alle toekomstige afspraken",`<button type="button" class="linkbtn" id="owWisV">Verwijderen</button>`):"");
    const w=$("#owWisV");if(w)w.onclick=()=>{const b=$("#owWis");if(b)b.click()}};
  drawOpdV();
  {const e=$("#owOpdE"),f=$("#owOpdF"),v=$("#owOpdV");if(e&&f&&v)e.onclick=()=>{const open=f.hidden;f.hidden=!open;v.hidden=open;e.classList.toggle("on",open);e.innerHTML=open?I.check:I.pencil;e.title=open?"Klaar":"Wijzigen";if(!open)drawOpdV()}}
  const editR=new Set();
  /* extra diensten ingeklapt tonen; open bij nieuw toevoegen of na "Wijzigen" */
  const dicht=new Set((k.opdrachten||[]).map(o=>o.id));
  let hosp=(k.hosp||[]).map(x=>({...x}));
  const hospDraw=()=>{const t=$("#owHospTop");if(t)t.innerHTML=hospBlok({...k,hosp},{leegKnop:false})};
  $("#owHospTop").addEventListener("click",async e=>{const b=e.target.closest("[data-hosp-af]");if(!b)return;e.preventDefault();const ix=+b.dataset.hospAf.split(":")[1];if(!hosp[ix])return;
    hosp[ix].af=iso(today());hospDraw();try{const cur=state.klanten.find(x=>x.id===k.id)||k;await save("klanten",k.id,{...strip(cur),hosp:hosp.map(x=>({...x}))});toast("Afgevinkt als besproken · komt niet meer bovenaan te staan")}catch(er){err(er)}});
  let mF=Number(k.frequentie)||4,mD=Number(k.duur)||30,mW=(vasteDagen(k)||[]).slice();
  /* aantallen uit de telling (offerte/rekentool) overnemen als de opdracht nog geen eigen aantallen heeft */
  const uitTelling=()=>{const t=k.ramenTelling;if(!t||!Array.isArray(t.floors))return null;const f=[0,1,2,3].map(i=>Number(t.floors[i])||0);return f.some(n=>n)?normR({f}):null};
  const heeftAantallen=q=>q&&(q.f||[]).some(n=>Number(n)>0);
  let main={dienst:k.dienst||"Glasbewassing",prijs:k.prijs??"",ramen:heeftAantallen(k.ramenRegel)?normR(JSON.parse(JSON.stringify(k.ramenRegel))):(/glas|ramen/i.test(k.dienst||"Glasbewassing")?uitTelling():null)};
  /* glasbewassing per verdieping: prijs en tijd volgens de tarieven van de rekentool */
  const FL=["Begane grond","1e verdieping","2e verdieping","3e verdieping"];
  const calcR=(r,isMain)=>{const q=r.ramen;if(!q)return null;try{const w=isMain?mF:Number(r.frequentie)||52,b=ramenBerekening(normR(q),w,null);
      return {...b,inc:b.ex*1.21,prijs:r2(incl?b.ex*1.21:b.ex),w}}catch(e){console.error(e);return null}};
  const fqSel=(di,key,val,leeg)=>`<select data-i="${di}" data-rk="${key}"><option value="">${leeg}</option>${freqOpts(val).map(w=>`<option value="${w}" ${String(val)===String(w)?"selected":""}>${esc(freqLabel(w))}</option>`).join("")}</select>`;
  /* kozijnreiniging bij een onderdeel: vinkje + eigen frequentie, aanboddatum, prijs en tijdsduur (zoals DienstenCRM) */
  const kozBlok=(di,soort,j,aan,fq,vol,op,od)=>{const nm=soort==="k"?["kf","kfq","kvol","kop","kod"].map(x=>x+j):["spkf","spkfq","spkvol","spkop","spkod"].map(x=>x+":"+j);
    return `<div class="ow-koz${aan?" on":""}"><label class="ow-kozc"><input type="checkbox" data-i="${di}" data-rk="${nm[0]}" ${aan?"checked":""}><span>Kozijnreiniging</span><small>${aan?"zit bij de glasbewassing in, of vul een eigen prijs in":"aanvinken als de kozijnen bij dit onderdeel mee moeten"}</small></label>
      ${aan?`<div class="ow-sub"><label>Frequentie${fqSel(di,nm[1],fq,"Elke keer")}</label><label>Aanboddatum<input data-i="${di}" data-rk="${nm[2]}" type="date" value="${esc(vol||"")}"></label>
        <label><span class="ow-lt">Prijs <small>· overschrijven</small></span><span class="ow-in"><i>€</i><input data-i="${di}" data-rk="${nm[3]}" type="number" step="0.01" min="0" value="${esc(op??"")}" placeholder="0,00"><em>excl.</em></span></label>
        <label><span class="ow-lt">Tijdsduur <small>· overschrijven</small></span><span class="ow-in"><input data-i="${di}" data-rk="${nm[4]}" type="number" step="1" min="0" value="${esc(od??"")}" placeholder="0"><em>min</em></span></label></div>`:""}</div>`};
  /* glasbewassing bijzondere ramen: per soort een aantal met eigen frequentie, aanboddatum, prijs, tijdsduur en kozijnreiniging */
  const spBlok=(q,c,di)=>`<div class="ow-spb"><div class="ow-spbh"><b>Glasbewassing bijzondere ramen</b><span>Dak- en tuimelramen, lichtkoepels, glas-in-lood en miniraampjes, elk met een eigen tarief.</span></div>
    <div class="ow-floors">${SPK.map(k=>{const cnt=Number(q.sp[k])||0,rw=(c.srows||[]).find(x=>x.k===k);return `<div class="ow-flb${cnt?" ow-on":""}"><div class="ow-fl"><span>${SPN[k]}</span><div class="ow-step"><button type="button" data-sst="${di}:${k}:-1" aria-label="Min">−</button><input data-i="${di}" data-rk="sp:${k}" type="number" min="0" inputmode="numeric" value="${cnt}" aria-label="${SPN[k]}"><span>st</span><button type="button" data-sst="${di}:${k}:1" aria-label="Plus">+</button></div></div>
      ${cnt?`<div class="ow-sub"><label>Frequentie${fqSel(di,"spfq:"+k,q.spfq[k],"Selecteer…")}</label><label>Aanboddatum<input data-i="${di}" data-rk="spvol:${k}" type="date" value="${esc(q.spvol[k]||"")}"></label>
        <label><span class="ow-lt">Prijs <small>· overschrijven</small></span><span class="ow-in"><i>€</i><input data-i="${di}" data-rk="spop:${k}" type="number" step="0.01" min="0" value="${esc(q.spop[k]??"")}" placeholder="${rw?esc(rw.cp.toFixed(2)):"0,00"}"><em>excl.</em></span></label>
        <label><span class="ow-lt">Tijdsduur <small>· overschrijven</small></span><span class="ow-in"><input data-i="${di}" data-rk="spod:${k}" type="number" step="1" min="0" value="${esc(q.spod[k]??"")}" placeholder="${rw?Math.ceil(rw.cm):0}"><em>min</em></span></label></div>
        <div class="ow-fx">${rw?`<p class="ow-calcd">${I.calculator}<span>${cnt} st · ${eur(rw.cp)} · ${Math.ceil(rw.cm)} min</span>${rw.ovP||rw.ovD?"<b>eigen waarde</b>":""}</p>`:"<span></span>"}<div class="ow-fxa"><button type="button" class="small ow-ber" data-sber="${di}:${k}" title="Prijs en tijd opnieuw berekenen">${I.calculator}Berekenen</button></div></div>
        ${kozBlok(di,"s",k,q.spkf[k],q.spkfq[k],q.spkvol[k],q.spkop[k],q.spkod[k])}`:""}</div>`}).join("")}</div></div>`;
  const calcHtml=(r,i,isMain)=>{const q=normR(r.ramen);r.ramen=q;const c=calcR(r,isMain)||{c:{min:0,kozMin:0,start:0},rows:[],count:0,min:0,glas:0,kozP:0,ex:0,inc:0};const di=isMain?"m":String(i);
    const heeft=q.f.some(n=>n)||SPK.some(x=>Number(q.sp[x]));
    if(!editR.has(di)&&heeft)return regelKaart(r,q,c,di,isMain);
    return `<div class="ow-calc" data-calc="${di}">${heeft?`<div style="display:flex;justify-content:flex-end"><button type="button" class="small" data-rdone="${di}">${I.check}Klaar met wijzigen</button></div>`:""}
      <label>Werkomschrijving<textarea data-i="${di}" data-rk="oms" style="min-height:56px" placeholder="Bijv. wassen ramen incl. kozijnen">${esc(q.oms||"")}</textarea></label>
      <p class="ow-note">Prijs en tijdsduur worden per verdieping berekend uit je tarieven (prijs en seconden per raam). Pas Overschrijvende prijs of tijdsduur alleen aan als je er bewust van wilt afwijken. Berekenen rekent alles opnieuw uit met de ingevoerde aantallen. Afspraken die al ingepland zijn veranderen niet.</p>
      ${q.f.some(n=>n)?`<div class="ow-berbar"><span class="subt">Prijs en tijdsduur van alle verdiepingen berekenen met de ingevoerde aantallen en je tarieven.</span><button type="button" class="small primary" data-ber="${di}">${I.calculator}Berekenen</button></div>`:""}
      <div class="ow-floors">${FL.map((n,j)=>{const cnt=Number(q.f[j])||0,rw=c.rows.find(x=>x.i===j),kr=c.krows.find(x=>x.i===j);return `<div class="ow-flb${cnt?" ow-on":""}"><div class="ow-fl"><span>${n}</span><div class="ow-step"><button type="button" data-st="${di}:${j}:-1" aria-label="Min">−</button><input data-i="${di}" data-rk="f${j}" type="number" min="0" inputmode="numeric" value="${cnt}" aria-label="${n}"><span>st</span><button type="button" data-st="${di}:${j}:1" aria-label="Plus">+</button></div></div>
        ${cnt?`<div class="ow-sub"><label>Frequentie${fqSel(di,"fq"+j,q.fq[j],"Selecteer…")}</label><label>Aanboddatum<input data-i="${di}" data-rk="vol${j}" type="date" value="${esc(q.vol[j]||"")}" title="Leeg = bij de volgende beurt"></label>
          <label><span class="ow-lt">Prijs <small>· overschrijven</small></span><span class="ow-in"><i>€</i><input data-i="${di}" data-rk="op${j}" type="number" step="0.01" min="0" value="${esc(has0(q.op[j])?q.op[j]:rw?rw.p.toFixed(2):"")}" placeholder="${rw?esc(rw.calcP.toFixed(2)):"0,00"}"><em>excl.</em></span></label><label><span class="ow-lt">Tijdsduur <small>· overschrijven</small></span><span class="ow-in"><input data-i="${di}" data-rk="od${j}" type="number" step="1" min="0" value="${esc(has0(q.od[j])?q.od[j]:rw?Math.max(1,Math.ceil(rw.min-1e-9)):"")}" placeholder="${rw?rw.calcMin:0}"><em>min</em></span></label></div>
          <div class="ow-fx">${rw?`<p class="ow-calcd">${I.calculator}<span>${cnt} × ${eur(rw.pp)}<i>·</i>${cnt} × ${rw.sec} sec = ${(cnt*rw.sec/60).toLocaleString("nl-NL",{maximumFractionDigits:1})} min</span>${rw.ovP||rw.ovD?"<b>eigen waarde</b>":""}</p>`:"<span></span>"}
            <div class="ow-fxa">${q.vol[j]?`<button type="button" class="linkbtn ow-sync" data-sync="${di}:${j}" title="Aanboddatum ${esc(fmtD(q.vol[j]))} voor alle verdiepingen gebruiken">${I.planning}Datum voor alle verdiepingen</button>`:""}<button type="button" class="small ow-ber" data-ber="${di}:${j}" title="Berekent prijs en tijd van alle verdiepingen van deze dienst">${I.calculator}Berekenen</button></div></div>

          ${kozBlok(di,"k",j,q.kf[j],q.kfq[j],q.kvol[j],q.kop[j],q.kod[j])}`:""}</div>`}).join("")}</div>
      ${spBlok(q,c,di)}
      <div class="ow-res">${resHtml(c,q)}</div>
      <div class="ow-over"><div class="ow-overh"><b>Alles overschrijven</b><span>Geldt voor de hele glasbewassing en gaat voor de prijzen per verdieping. Leeg = berekend.</span></div>
        <div class="ow-overg">
          <label>Starttarief<span class="ow-in"><i>€</i><input data-i="${di}" data-rk="start" type="number" step="0.01" min="0" value="${esc(q.start??"")}" placeholder="${esc((c.c.start||0).toFixed(2))}"><em>excl.</em></span></label>
          <label>Prijs glasbewassing<span class="ow-in"><i>€</i><input data-i="${di}" data-rk="tp" type="number" step="0.01" min="0" value="${esc(q.tp??"")}" placeholder="${esc((c.glas||0).toFixed(2))}"><em>excl.</em></span></label>
          <label>Tijdsduur<span class="ow-in"><i>${I.clock}</i><input data-i="${di}" data-rk="td" type="number" step="1" min="0" value="${esc(q.td??"")}" placeholder="${esc(String(Math.ceil(c.rows.reduce((a,r)=>a+r.min,0))||0))}"><em>min</em></span></label>
        </div>${q.tp!==""||q.td!==""||q.start!==""?`<button type="button" class="linkbtn" data-ovclr="${di}">Overschrijvingen wissen</button>`:""}</div></div>`};
  /* overzicht van de ramen per verdieping (zoals na opslaan), met potlood om te wijzigen */
  /* opdrachtregel als overzichtelijke kaart: omschrijving, minimumprijs, aantallen per verdieping en totaal */
  const regelKaart=(r,q,c,di,isMain)=>{const base=isMain?mF:Number(r.frequentie)||null,naam=r.dienst||"Glasbewassing",min=Number(c.c&&c.c.min)||0,kmin=Number(c.c&&c.c.kozMin)||0;
    const fqT=w=>{const t=String(freqLabel(w)||"");return /^elke\s/i.test(t)?"1x per "+t.replace(/^elke\s+/i,""):t.toLowerCase()};
    const fr=(w)=>w?` <i>(${esc(fqT(w))})</i>`:"";
    const heeftSp=SPK.some(x=>Number(q.sp[x]));
    const let_=min>0||kmin>0?`<div class="ow-rkl"><b>Let op:</b> ${esc(naam)}${heeftSp?" en Glasbewassing bijzondere ramen hebben een gezamenlijke":" heeft een"} minimumprijs van${min>0?`<br>– ${eur(min)} (excl. btw) voor ${esc(naam)}`:""}${kmin>0?`<br>– ${eur(kmin)} (excl. btw) voor Kozijnreiniging`:""}${c.aanvul>0?`<br><span class="ow-rkls">Nu ${eur(c.glas-c.aanvul)}; het verschil van ${eur(c.aanvul)} wordt automatisch aangevuld.</span>`:""}</div>`:"";
    let eerste=true;const kaart=(titel,regels,kozR,totG,ovG,extraTot)=>{const lt=eerste?let_:"";eerste=false;return `<div class="ow-rk" data-calc="${di}"><div class="ow-rkh"><span class="objic">${I.check}</span><b>${esc(titel)} <small>(Kozijnreiniging)</small></b><span class="sp"></span><button type="button" class="iconbtn sm" data-redit="${di}" aria-label="Wijzigen" title="Wijzigen">${I.pencil}</button></div>
      ${q.oms?`<p class="ow-rko">${esc(q.oms)}</p>`:""}${lt}
      <dl class="ow-rkf">${regels}${kozR}</dl>
      <dl class="ow-rkt">${extraTot||""}<dt>Totaal ${esc(titel)}</dt><dd>${eur(totG)}${ovG?" <i>(overschrijvend)</i>":""}</dd><dt>Totaal Kozijnreiniging</dt><dd>${eur(c.krows.filter(x=>titel===naam?!x.sp:x.sp).reduce((a,x)=>a+x.p,0))}</dd></dl></div>`};
    const gr=c.rows.filter(x=>!x.sp),sr=c.rows.filter(x=>x.sp);
    const fl=q.f.map((n,j)=>n?`<dt>${FLN[j]}</dt><dd>${n} st${fr(Number(q.fq[j])||base)}</dd>`:"").join("");
    const fk=c.krows.filter(x=>!x.sp).map(x=>`<dt>Kozijnen ${esc(x.naam.toLowerCase())}</dt><dd>${x.n} st${fr(Number(q.kfq[x.i])||Number(q.fq[x.i])||base)}</dd>`).join("");
    const spl=SPK.map(x=>Number(q.sp[x])?`<dt>${esc(SPN[x])}</dt><dd>${q.sp[x]} st${fr(Number(q.spfq[x])||base)}</dd>`:"").join("");
    const spk=c.krows.filter(x=>x.sp).map(x=>`<dt>Kozijnen ${esc(x.naam.toLowerCase())}</dt><dd>${x.n} st${fr(Number(q.spkfq[x.k])||Number(q.spfq[x.k])||base)}</dd>`).join("");
    const glasG=r2(gr.reduce((a,x)=>a+x.p,0)+(c.aanvul||0)),glasS=r2(sr.reduce((a,x)=>a+x.p,0));
    const ovG=c.totOver||gr.some(x=>x.ovP),ovS=c.totOver||sr.some(x=>x.ovP);
    const startT=c.start?`<dt>Starttarief</dt><dd>${eur(c.start)}</dd>`:"";
    return (q.f.some(n=>n)?kaart(naam,fl,fk,glasG,ovG,startT):"")+(heeftSp?kaart("Glasbewassing bijzondere ramen",spl,spk,glasS,ovS,q.f.some(n=>n)?"":startT):"")};
  const sumHtml=(q,c,di,isMain)=>{const base=isMain?mF:null,has=v=>v!==""&&v!=null;
    return `<div class="ow-calc ow-sum" data-calc="${di}"><div class="ow-sumh"><b>Ramen per verdieping</b><button type="button" class="small" data-redit="${di}">${I.pencil}Wijzigen</button></div>
      ${q.oms?`<p class="ow-oms">${esc(q.oms)}</p>`:""}
      <div class="ow-fls">${q.f.map((n,j)=>{if(!n)return"";const rw=c.rows.find(x=>x.i===j);const fq=q.fq[j]?freqLabel(q.fq[j]):"Frequentie nog kiezen";
        return `<div class="ow-flc">${flIcon(j)}
          <div class="ow-flm"><b>${FLN[j]}</b><span>${n} ${n===1?"raam":"ramen"}${rw?` · ${rw.sec} sec per raam`:""}</span><div class="ow-tags"><span class="ow-tag">${I.planning}${esc(fq)}</span><span class="ow-tag${q.vol[j]?"":" muted"}">${I.clock}${q.vol[j]?"vanaf "+esc(fmtL(q.vol[j])):"volgende beurt"}</span></div></div>
          <div class="ow-flp"><b>${rw?eur(rw.p):"—"}</b><span>${rw?(Math.round(rw.min*10)/10).toLocaleString("nl-NL"):0} min</span><em class="${c.totOver||has(q.op[j])||has(q.od[j])?"ov":""}">${c.totOver||has(q.op[j])||has(q.od[j])?"eigen prijs":"berekend"}</em></div></div>`}).join("")}</div>
      <div class="ow-res">${c.aanvul>0?`<div class="ow-kv"><span>Aanvulling tot minimumprijs ${eur(c.c.min)}</span><b>+ ${eur(c.aanvul)}</b></div>`:""}${c.start?`<div class="ow-kv"><span>Starttarief</span><b>${eur(c.start)}</b></div>`:""}${c.totOver?`<div class="ow-kv"><span>Overschrijvende prijs glasbewassing</span><b>${eur(c.glas)}</b></div>`:""}<div class="ow-kv tot"><span>Totaal glasbewassing · ${c.count} ramen · ${c.min} min</span><b>${eur(c.ex)} excl. · ${eur(c.ex*1.21)} incl.</b></div></div></div>`};
  const resHtml=(c,q)=>{const vari=ramenVariabel(q);
    return `${c.rows.map(r=>`<div class="ow-kv"><span>${r.naam} · ${r.n} st${q.fq[r.i]?" · "+esc(freqLabel(q.fq[r.i]).toLowerCase()):""}</span><b>${eur(r.p)} · ${Math.round(r.min)} min</b></div>`).join("")}
      ${c.aanvul>0?`<div class="ow-kv"><span>Aanvulling tot minimumprijs</span><b>+ ${eur(c.aanvul)}</b></div>`:""}${c.krows.map(r=>`<div class="ow-kv"><span>Kozijnen ${r.naam.toLowerCase()}${q.kfq[r.i]?" · "+esc(freqLabel(q.kfq[r.i]).toLowerCase()):""}</span><b>${eur(r.p)} · ${Math.round(r.min)} min</b></div>`).join("")}
      ${c.minK?`<div class="ow-kv"><span>Minimumprijs kozijnreiniging</span><b>${eur(c.kozP)}</b></div>`:""}${c.start?`<div class="ow-kv"><span>Starttarief</span><b>${eur(c.start)}</b></div>`:""}
      <div class="ow-kv tot"><span>${vari?"Beurt met alles":"Prijs per keer"} · ${c.count} ramen · ${c.min} min</span><b>${eur(c.ex)} excl. · ${eur(c.ex*1.21)} incl.</b></div>
      ${vari?'<p class="subt" style="margin:4px 0 0;font-size:12.5px">Onderdelen met een eigen frequentie gaan alleen mee als ze aan de beurt zijn; de factuur rekent dan alleen die delen.</p>':""}`};
  /* ritme volgt de kortste frequentie van de verdiepingen; tijdsduur volgt de berekening (of de gemeten tijd) */
  const ritmeUitRamen=()=>{const q=main.ramen;if(!q)return 0;const ws=q.f.map((n,i)=>n&&Number(q.fq[i])).filter(Boolean),leeg=q.f.some((n,i)=>n&&!q.fq[i]);return ws.length?Math.min(...ws,...(leeg?[mF]:[])):0};
  const syncRitme=()=>{const w=ritmeUitRamen();if(w)mF=w;if(main.ramen&&!(k.tijden||[]).length){const c=calcR(main,true);if(c&&c.min)mD=Math.max(5,Math.ceil(c.min/5)*5)}};
  const isGlas=n=>/glas|ramen/i.test(String(n||""));
  /* opgeslagen extra dienst als overzichtskaart (zoals DienstenCRM): omschrijving, onderdelen met aantal en frequentie, totalen, potlood om te wijzigen */
  const dichtHtml=(r,i)=>{const its=(r.items||[]).filter(x=>Number(x.aantal)>0),base=Number(r.frequentie)||mF||null;
    const fqT=w=>{const t=String(freqLabel(w)||"");return /^elke\s/i.test(t)?"1x per "+t.replace(/^elke\s+/i,""):t.toLowerCase()};
    let c=null;try{if(r.items)c=groepCalc(r)}catch(e){}
    const regels=its.length?its.map(x=>`<dt>${esc(x.naam)}</dt><dd>${String(x.aantal).replace(".",",")} ${esc(eenhKort(x.eenheid))}${(Number(x.fq)||base)?` <i>(${esc(fqT(Number(x.fq)||base))})</i>`:""}</dd>`).join(""):`<dt>Hoe vaak</dt><dd>${base?esc(fqT(base)):"—"}</dd>`;
    const ov=r.items&&(gHas(r.tp)||its.some(x=>gHas(x.op)));
    return `<div class="ow-line ow-dicht"><div class="ow-rk"><div class="ow-rkh"><span class="objic">${I.check}</span><b>${esc(r.dienst||"Dienst")}${r.actief===false?' <small>(niet actief)</small>':""}</b><span class="sp"></span><button type="button" class="iconbtn sm" data-lopen="${i}" aria-label="Wijzigen" title="Wijzigen">${I.pencil}</button><button type="button" class="iconbtn sm" data-rm="${i}" aria-label="Regel verwijderen" title="Verwijderen">${I.x}</button></div>
      ${r.oms?`<p class="ow-rko">${esc(r.oms)}</p>`:""}
      <dl class="ow-rkf">${regels}</dl>
      <dl class="ow-rkt">${c&&c.start?`<dt>Starttarief</dt><dd>${eur(c.start)}</dd>`:""}<dt>Tijdsduur</dt><dd>${c?Math.round(c.sec/60):Number(r.duur)||0} minuten</dd><dt>Totaal ${esc(r.dienst||"")}</dt><dd>${eur(c?(S().toonEx?c.ex:c.ex*(1+(Number(st.btw)||21)/100)):toon(r.prijs))}${ov?" <i>(overschrijvend)</i>":""}</dd></dl></div></div>`};
  /* op welk adres: hoofdadres of een van de locaties van de klant; een ander adres wordt een eigen afspraak */
  const adresKeuze=(r,i)=>{const ls=(k.objecten||[]).filter(o=>o.adres);if(!ls.length)return `<small class="help">Glasbewassing op een ander adres? Voeg dat adres eerst toe bij Locaties op de klantkaart; dan kies je het hier.</small>`;
    return `<label>Adres<select data-i="${i}" data-k="objectId"><option value="">${esc(fullAddr(k))} (hoofdadres)</option>${ls.map(o=>`<option value="${esc(o.id)}" ${o.id===r.objectId?"selected":""}>${esc([o.adres,[o.postcode,o.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", "))}${o.naam?" · "+esc(o.naam):""}</option>`).join("")}</select>${r.objectId?`<small class="help">Ander adres: wordt apart ingepland, met een eigen afspraak en factuur.</small>`:""}</label>`};
  /* losse opdracht met ramen of onderdelen: naam, prijs, ritme en datum staan al in de regels eronder (per verdieping), dus geen dubbele kop */
  const soloKaal=(r,i,isMain)=>!isMain&&soloI===i&&!!(r.ramen||r.items)&&!!String(r.dienst||"").trim();
  const lineHtml=(r,i,isMain)=>!isMain&&r.id&&dicht.has(r.id)?dichtHtml(r,i):`<div class="ow-line${isMain?" main":""}">
      ${isMain&&r.ramen||soloKaal(r,i,isMain)?"":`      <div class="ow-lh"><span class="mono">${isMain?1:i+2}</span><input data-i="${isMain?"m":i}" data-k="dienst" value="${esc(r.dienst)}" placeholder="Dienst" aria-label="Dienst">${isMain?"":`<button type="button" class="small ghost" data-rm="${i}" aria-label="Regel verwijderen">${I.x}</button>`}</div>
      <div class="ow-lg">
        <label>Prijs per keer (€ ${btwL})<input data-i="${isMain?"m":i}" data-k="prijs" type="number" step="0.01" min="0" value="${esc(r.prijs)}">${isMain?'<small class="help ow-tsl" id="owTsl"></small>':""}</label>
        ${isMain&&r.ramen?`<label>Ritme planning<input value="${esc(freqLabel(mF))}${ritmeUitRamen()?" (kortste frequentie)":""}" disabled></label><label>Tijdsduur per beurt<input value="${mD} min${(k.tijden||[]).length?" (gemeten)":" (berekend)"}" disabled></label>`
          :isMain?`<label>Hoe vaak (ritme planning)<select id="ow-freq">${freqO(mF).map(w=>`<option value="${w}" ${w===mF&&!mW.length?"selected":""}>${esc(freqLabel(w))}</option>`).join("")}<option value="dagen" ${mW.length?"selected":""}>Vaste weekdagen (bijv. VvE)</option></select>${mW.length?`<div class="ow-dagen" role="group" aria-label="Weekdagen">${[1,2,3,4,5,6].map(d=>`<button type="button" data-wd="${d}" aria-pressed="${mW.includes(d)}">${["zo","ma","di","wo","do","vr","za"][d]}</button>`).join("")}</div><small class="help">Elke week op deze dagen; na afmelden staat de volgende dag automatisch in de planning.</small>`:""}</label><label>Tijdsduur per beurt<select id="ow-duur">${[...new Set([5,10,15,20,25,30,35,40,45,50,55,60,75,90,120,150,180,240,mD])].sort((a,b)=>a-b).map(m=>`<option value="${m}" ${m===mD?"selected":""}>${m<60?m+" min":(m/60).toLocaleString("nl-NL")+" uur"}</option>`).join("")}</select>${(k.tijden||[]).length?`<small class="help">Gemeten gemiddeld ${gemTijd(k)} min</small>`:""}</label>`
          :r.items?`<div class="ow-kv" style="grid-column:1/-1"><span>Ritme</span><b>Zelfde als glasbewassing (${esc(freqLabel(mF).toLowerCase())}) <small class="subt">· per onderdeel aan te passen</small></b></div>`
          :`<label>Hoe vaak<select data-i="${i}" data-k="frequentie">${freqO(r.frequentie).map(w=>`<option value="${w}" ${w===Number(r.frequentie)?"selected":""}>${esc(freqLabel(w))}</option>`).join("")}</select></label>
            <label>Volgende keer<input data-i="${i}" data-k="volgende" type="date" value="${esc(r.volgende||"")}" title="Leeg = bij de volgende beurt"></label>`}
      </div>`}
      ${!isMain&&r.items?itemsHtml(r,i):r.ramen?calcHtml(r,i,isMain):isGlas(r.dienst)?`<button type="button" class="small" data-calcopen="${isMain?"m":i}">${I.calculator}Ramen per verdieping invullen</button>`:""}
      ${!isMain&&!soloSet.has(i)&&(r.ramen||isGlas(r.dienst))?adresKeuze(r,i):""}
      ${isMain?"":soloSet.has(i)&&i!==soloI?`<label class="check-row"><input type="checkbox" data-i="${i}" data-k="actief" ${r.actief!==false?"checked":""}>Actief · gaat mee met de dienst ${esc(String((soloR&&soloR.dienst)||"glasbewassing").toLowerCase())} van deze opdracht wanneer die weer aan de beurt is</label>`:`<label class="check-row"><input type="checkbox" data-i="${i}" data-k="actief" ${r.actief!==false?"checked":""}>Actief${r.apart?"":" · gaat mee met de dienst glasbewassing wanneer deze weer aan de beurt is"}</label>
      <label class="check-row"><input type="checkbox" data-i="${i}" data-k="apart" ${r.apart?"checked":""}>Apart inplannen · eigen afspraak in de agenda, met eigen tijd en factuur <small class="subt">(voor grote klussen; anders gaat hij mee met de glasbewassing)</small></label>
      ${i===soloI&&!extra.some(x=>x.bij===r.id)?(()=>{const kand=extra.filter(x=>x.id!==r.id&&!x.bij&&!x._nieuw&&x.actief!==false&&String(x.dienst||"").trim()&&(x.objectId||"")===(r.objectId||""));return kand.length?`<label>Hoort bij opdracht<select data-i="${i}" data-k="bij"><option value="">Eigen opdracht</option>${kand.map(x=>`<option value="${esc(x.id)}" ${r.bij===x.id?"selected":""}>#${esc(nr)}-${esc(x.nr||opdrNr(k,x.id))} · ${esc(x.dienst)}</option>`).join("")}</select><small class="help">Kies een opdracht op hetzelfde adres: deze dienst gaat dan mee met die afspraak.</small></label>`:""})():""}`}
      <div class="ow-lsave"><button type="button" class="small primary" data-lsave="${isMain?"m":i}">${I.check}Opslaan</button></div>
    </div>`;
  const itemsRitme=r=>{const its=(r.items||[]).filter(x=>Number(x.aantal)>0);if(!its.length)return Number(r.frequentie)||mF||52;const ws=its.map(x=>Number(x.fq)||mF||52);return Math.min(...ws)};
  const gOpts=r=>({freqDefault:mF||Number(k.frequentie)||8});
  const itemsHtml=(r,i)=>groepEditor(r,"x"+i,gOpts(r));
  const itemsRecalc=(i,struct)=>{const r=extra[i];if(!r||!r.items)return;r.frequentie=itemsRitme(r);const c=groepCalc(r),mul=incl?1+(Number(st.btw)||21)/100:1;r.prijs=r2(c.ex*mul);r.duur=Math.max(5,Math.ceil(c.sec/60/5)*5);
    const pi=$("#owLines").querySelector(`input[data-i="${i}"][data-k="prijs"]`);if(pi){pi.value=r.prijs;pi.classList.remove("flash");void pi.offsetWidth;pi.classList.add("flash")}
    if(struct)groepRedraw($("#owLines"),"x"+i,r,gOpts(r));else groepTotUpdate($("#owLines"),"x"+i,r,gOpts(r));tot()};
  const tot=()=>{if(soloI>=0&&extra[soloI]){const L=[...soloSet].map(i=>extra[i]).filter(Boolean);$("#owTot").innerHTML=L.map(r=>`<span>Per keer (${esc(r.dienst||"deze opdracht")})</span><span>${eur(toon(Number(r.prijs)||0))}</span>`).join("");return}
    const per=Number(main.prijs)||0,ex=extra.filter(o=>o.actief!==false&&o.dienst&&!o._bestaand),ts=Math.max(0,Number(($o("toeslag")||{}).value)||0)/100;
    const jaar=(per*52/(mF||4)+ex.reduce((a,o)=>a+(Number(o.prijs)||0)*52/(Number(o.frequentie)||52),0))*(1+ts);
    $("#owTot").innerHTML=`<span>Per beurt (${esc(main.dienst||"hoofdopdracht")})</span><span>${eur(toon(per))}</span>${ts?`<span>Toeslag ${r2(ts*100)}%</span><span>+ ${eur(toon(per)*ts)}</span><span class="grand">Per beurt incl. toeslag</span><span class="grand">${eur(toon(per)*(1+ts))}</span>`:""}${ex.length?`<span>Extra opdrachten, per keer${ts?" incl. toeslag":""}</span><span>${eur(ex.reduce((a,o)=>a+(Number(o.prijs)||0),0)*(1+ts))}</span>`:""}`;
    const h=$("#owTsl");if(h)h.textContent=ts?`+ ${r2(ts*100)}% toeslag = ${eur(toon(per)*(1+ts))} per keer`:""};
  /* nieuwe opdracht: de opdrachtregels verschijnen pas als je een dienst kiest (zoals in DienstenCRM) */
  const soloLeeg=()=>{const r=soloI>=0&&extra[soloI];return !!r&&!String(r.dienst||"").trim()&&!r.ramen&&!r.items&&!r._toon};
  const draw=()=>{syncRitme();{const sk=$("#owRegelsK");if(sk)sk.style.display=soloLeeg()?"none":""}$("#owLines").innerHTML=soloI>=0&&extra[soloI]?[...soloSet].filter(i=>extra[i]).map(i=>lineHtml(extra[i],i,false)).join(""):lineHtml(main,0,true)+extra.map((r,i)=>r._bestaand?"":lineHtml(r,i,false)).join("");tot()};
  const allFotos=()=>[...tFotos.map(f=>({...f,naam:"Uit de telling",t:1})),...fotos];
  const drawFotos=()=>{const all=allFotos();
    $("#owFotos").innerHTML=all.length?all.map((f,i)=>fotoCard(f,i,!f.t)).join(""):'<p class="subt ow-fempty">Nog geen foto\'s. Klik op + om foto\'s van de woning toe te voegen en tik de ramen aan die gewassen moeten worden. Foto\'s uit de rekentool verschijnen hier vanzelf.</p>'};
  draw();drawFotos();
  /* aanbieden / uitstellen, artikelen, bedrijfsmiddelen */
  let aanb={aanbieden:!!k.aanbieden,uitstelTot:k.uitstelTot||""},arts=(k.artikelen||[]).map(a=>({...a})),mids=[...(k.middelen||[])];
  const drawAanb=()=>{if(!$("#owAanb"))return;const v=volgende(k),ti=iso(today()),st=k.gepland?["ok","Ingepland op "+fmtL(k.gepland)+(k.tijd?" om "+k.tijd:"")]:aanb.uitstelTot&&aanb.uitstelTot>ti?["soon","Uitgesteld tot "+fmtL(aanb.uitstelTot)]:aanb.aanbieden||v<=today()?["late","Staat nu bij Te plannen"]:["neutral","Wordt aangeboden vanaf "+fmtL(iso(v))];
    $("#owAanb").innerHTML=`<div class="ow-kv"><span>Status</span><b><span class="pill ${st[0]}">${esc(st[1])}</span></b></div>${kv("Volgens frequentie",fmtL(iso(v)))}
      ${k.gepland?"":`<div class="row" style="padding:0;justify-content:flex-start;gap:8px;flex-wrap:wrap"><button type="button" class="small${aanb.aanbieden?" primary":""}" id="owNu">${I.inbox}Nu aanbieden</button><label class="ow-uit">Uitstellen tot<input type="date" id="owUit" value="${esc(aanb.uitstelTot)}" min="${ti}"></label>${aanb.uitstelTot||aanb.aanbieden?`<button type="button" class="linkbtn" id="owAanb0">Normaal (volgens frequentie)</button>`:""}</div>`}`;
    const n=$("#owNu");if(n)n.onclick=()=>{aanb={aanbieden:true,uitstelTot:""};drawAanb()};
    const u=$("#owUit");if(u)u.onchange=()=>{aanb={aanbieden:false,uitstelTot:u.value};drawAanb()};
    const z=$("#owAanb0");if(z)z.onclick=()=>{aanb={aanbieden:false,uitstelTot:""};drawAanb()}};
  const drawArt=()=>{$("#owArt").innerHTML=arts.length?`<div class="ow-arts">${arts.map((a,i)=>`<div class="ow-art"><input data-ai="${i}" data-af="naam" value="${esc(a.naam||"")}" placeholder="Bijv. SOOCLEAN 20 l can"><input data-ai="${i}" data-af="aantal" type="number" min="1" step="1" value="${esc(a.aantal??1)}" aria-label="Aantal"><span class="ow-in"><i>€</i><input data-ai="${i}" data-af="prijs" type="number" step="0.01" min="0" value="${esc(a.prijs??"")}" aria-label="Prijs per stuk"></span><button type="button" class="iconbtn sm" data-ard="${i}" aria-label="Verwijderen">${I.x}</button></div>`).join("")}</div><small class="help">Prijs per stuk ${btwL} btw</small>`:'<p class="subt" style="margin:0">Er zijn geen artikelen geselecteerd.</p>';
    $("#owArt").querySelectorAll("[data-ai]").forEach(el=>el.oninput=()=>{const a=arts[+el.dataset.ai];a[el.dataset.af]=el.type==="number"?(el.value===""?"":Number(el.value)):el.value});
    $("#owArt").querySelectorAll("[data-ard]").forEach(b=>b.onclick=()=>{arts.splice(+b.dataset.ard,1);drawArt()})};
  $("#owArtAdd").onclick=()=>{arts.push({naam:"",aantal:1,prijs:""});drawArt();const l=$("#owArt").querySelectorAll('[data-af="naam"]');if(l.length)l[l.length-1].focus()};
  const drawMid=()=>{const all=(state.uitv&&state.uitv.middelen)||[];
    $("#owMid").innerHTML=all.length?`<div class="ow-mids">${all.map(m=>`<label class="chipchk"><input type="checkbox" data-mid="${esc(m.id)}" ${mids.includes(m.id)?"checked":""}><span>${esc(m.naam||"Naamloos")}${Number(m.aantal)>1?" ("+m.aantal+")":""}</span></label>`).join("")}</div>`:`<p class="subt" style="margin:0">Er zijn geen bedrijfsmiddelen. Voeg ze toe bij <button type="button" class="linkbtn" id="owMidGo">Uitvoering › Bedrijfsmiddelen</button>.</p>`;
    $("#owMid").querySelectorAll("[data-mid]").forEach(c=>c.onchange=()=>{mids=mids.filter(x=>x!==c.dataset.mid);if(c.checked)mids.push(c.dataset.mid)});
    const g=$("#owMidGo");if(g)g.onclick=()=>{state.utab="middelen";go("uitvoering")}};
  drawAanb();drawArt();drawMid();
  {const a=$("#owAdr");if(a)a.onclick=()=>kkAdres(kid)}
  /* adres en ontvangers wijzigen in de kaart zelf (zoals in DienstenCRM): kies uit de locaties en contactpersonen van de klant */
  {const E=$("#owAdrE"),V=$("#owAdrV"),F=$("#owAdrF"),KN=$("#owAdrKn"),KE=$("#owAdrKe");
    const adrO=()=>{const os=(k.objecten||[]).filter(o=>o&&(o.adres||o.naam));const hoofd=fullAddr(k);const cur=soloR?(soloR.objectId||""):jobObj(k)&&jobObj(k).adres?jobObj(k).id:"";
      return `<option value="hoofd"${!cur?" selected":""}>${esc(hoofd||"Hoofdadres")}${os.length?" (hoofdadres)":""}</option>`+os.filter(o=>o.adres).map(o=>`<option value="${esc(o.id)}"${cur===o.id?" selected":""}>${esc(fullAddr(o))}${o.naam?" · "+esc(o.naam):""}</option>`).join("")};
    const ontv=(x)=>{const cs=(k.contacten||[]).filter(c=>c&&c.email),em=x==="factuur"?k.fEmail:x==="offerte"?k.oEmail:k.pEmail,tv=tavK(k,x);
      const idx=em?cs.findIndex(c=>c.email===em&&(!tv||c.naam===tv)):-1;const eigen=em&&idx<0;
      return `<option value="std"${!em?" selected":""}>Standaard klantgegevens${k.email?" · "+esc(k.email):""}</option>`+cs.map((c,i)=>`<option value="c${i}"${idx===i?" selected":""}>${esc(c.naam)}${c.functie?" ("+esc(c.functie)+")":""} · ${esc(c.email)}</option>`).join("")+(eigen?`<option value="eigen" selected>${esc(em)}${tv?" · t.a.v. "+esc(tv):""}</option>`:"")};
    const open=on=>{V.hidden=on;F.hidden=!on;KN.hidden=on;KE.hidden=!on;
      if(on)F.innerHTML=`<label>Adres<select id="owA-adr">${adrO()}</select></label>${(k.objecten||[]).filter(o=>o.adres).length?"":`<small class="help">Meerdere adressen? Voeg ze toe als locatie op de klantkaart.</small>`}
        ${[["offerte","Offerte gaat naar"],["factuur","Facturen gaan naar"],["planning","Planningsmails gaan naar"]].map(([x,l])=>`<label>${l}<select id="owA-${x}">${ontv(x)}</select></label>`).join("")}
        ${(k.contacten||[]).some(c=>c.email)?"":`<small class="help">Andere ontvanger? Voeg een contactpersoon met e-mailadres toe op de klantkaart.</small>`}`};
    if(E)E.onclick=()=>open(true);
    const U=$("#owAdrU");if(U)U.onclick=()=>open(false);
    const SV=$("#owAdrS");if(SV)SV.onclick=async()=>{const cs=(k.contacten||[]).filter(c=>c&&c.email),patch={objectId:$("#owA-adr").value||"hoofd"};
      [["offerte","o"],["factuur","f"],["planning","p"]].forEach(([x,p])=>{const v=$("#owA-"+x).value;if(v==="std"){patch[p+"Email"]="";patch[p+"Tav"]=""}else if(v[0]==="c"){const c=cs[+v.slice(1)];patch[p+"Email"]=c.email;patch[p+"Tav"]=c.naam||""}});
      if(soloR){const v=patch.objectId;delete patch.objectId;soloR.objectId=v==="hoofd"?"":v;SV.disabled=true;
        try{await save("klanten",kid,{...collect(),...patch});toast("Adres en ontvangers opgeslagen");dlg.close();openOpdrachtWerk(kid,soloR.id)}catch(er){SV.disabled=false;err(er)}return}
      SV.disabled=true;try{await save("klanten",kid,{...strip(k),...patch});Object.assign(k,patch);toast("Adres en ontvangers opgeslagen");dlg.close();openOpdrachtWerk(kid)}catch(er){SV.disabled=false;err(er)}}}
  {const d=$("#owDel");if(d)d.onclick=()=>kkDelOpdracht(kid,"main","opdracht")}
  $o("fact").onchange=()=>{const v=$o("fact").value,h=$("#owFactH");if(h)h.textContent=FACT_HELP[v]||"";if(v==="periodiek"&&!isPeriodiek(k)){const b=$("#owPer");if(b)b.click()}};
  {const b=$("#owPer");if(b)b.onclick=async()=>{b.disabled=true;try{await save("klanten",kid,collect());openPeriodiek(kid)}catch(er){b.disabled=false;err(er)}}}
  $("#owLines").addEventListener("click",e=>{const b=e.target.closest("[data-wd]");if(!b)return;e.preventDefault();const d=Number(b.dataset.wd);mW=mW.includes(d)?mW.filter(x=>x!==d):[...mW,d].sort();if(!mW.length)mW=[d];draw()});
  $("#owLines").addEventListener("change",e=>{if(e.target.id==="ow-freq"){if(e.target.value==="dagen"){mW=mW.length?mW:[2,5];mF=1;draw();return}mW=[];mF=Number(e.target.value)||4;if(main.ramen){const c=calcR(main,true);if(c)main.prijs=c.prijs}draw()}else if(e.target.id==="ow-duur")mD=Number(e.target.value)||30});
  $o("toeslag").addEventListener("input",tot);
  const wis=$("#owWis");if(wis)wis.onclick=async()=>{wis.disabled=true;try{const cur=state.klanten.find(x=>x.id===kid)||k;await save("klanten",kid,{...strip(cur),gepland:"",tijd:""});toast("Toekomstige afspraak verwijderd, klant staat weer bij te plannen");wis.remove()}catch(er){wis.disabled=false;err(er)}};
  const recalc=di=>{const isM=di==="m",r=isM?main:extra[+di],c=calcR(r,isM),box=$("#owLines").querySelector(`[data-calc="${di}"]`);if(!c||!box)return;
    r.prijs=c.prijs;box.querySelector(".ow-res").innerHTML=resHtml(c,r.ramen);
    const pi=$("#owLines").querySelector(`input[data-i="${di}"][data-k="prijs"]`);if(pi){pi.value=c.prijs;pi.classList.remove("flash");void pi.offsetWidth;pi.classList.add("flash")}
    if(isM&&!(k.tijden||[]).length&&c.min){mD=Math.max(5,Math.ceil(c.min/5)*5);const sd=$o("duur");if(sd){const m=String(mD);if(![...sd.options].some(o=>o.value===m))sd.insertAdjacentHTML("beforeend",`<option value="${m}">${m} min</option>`);sd.value=m}}
    if(!isM)r.duur=Math.max(5,Math.ceil(c.min/5)*5);tot()};
  $("#owLines").addEventListener("input",e=>{const el=e.target,di=el.dataset.i,rk=el.dataset.rk;if(di!=null&&rk){const r=di==="m"?main:extra[+di];
      const q=r.ramen,sm=rk.match(/^(sp|spfq|spvol|spop|spod|spkf|spkfq|spkvol|spkop|spkod):(\w+)$/);
      if(sm){const [,key,sk]=sm;q[key]=q[key]||{};if(key==="spkf"){q.spkf[sk]=el.checked;recalc(di);draw();return}q[key][sk]=key==="sp"?Math.max(0,Math.round(Number(el.value)||0)):el.value;if(key==="spvol"||key==="spfq"){recalc(di);draw();return}recalc(di);return}
      const m=rk.match(/^(f|fq|vol|op|od|kf|kfq|kvol|kop|kod)(\d)$/);
      if(m){const [,key,jj]=m;if(key==="kf"){q.kf[+jj]=el.checked;recalc(di);draw();return}q[key][+jj]=key==="f"?Math.max(0,Number(el.value)||0):el.value;if(key==="vol"||key==="fq"){recalc(di);draw();return}}
      else q[rk]=el.value;
      if(rk!=="oms")recalc(di);return}});
  $("#owLines").addEventListener("change",e=>{const el=e.target,rk=el.dataset.rk;if(rk&&(/^f\d$/.test(rk)||/^sp:/.test(rk))){recalc(el.dataset.i);setTimeout(draw,0)}});
  $("#owLines").addEventListener("click",e=>{const st=e.target.closest("[data-st]");if(st){const [di,j,d]=st.dataset.st.split(":");const r=di==="m"?main:extra[+di];const was=Number(r.ramen.f[+j])||0;r.ramen.f[+j]=Math.max(0,was+Number(d));
      const inp=$("#owLines").querySelector(`input[data-i="${di}"][data-rk="f${j}"]`);if(inp)inp.value=r.ramen.f[+j];recalc(di);if(!was!==!r.ramen.f[+j])draw();return}
    const ss=e.target.closest("[data-sst]");if(ss){const [di,sk,d]=ss.dataset.sst.split(":");const q=(di==="m"?main:extra[+di]).ramen;const was=Number(q.sp[sk])||0;q.sp[sk]=Math.max(0,was+Number(d));
      const inp=$("#owLines").querySelector(`input[data-i="${di}"][data-rk="sp:${sk}"]`);if(inp)inp.value=q.sp[sk];recalc(di);if(!was!==!q.sp[sk])draw();return}
    const sb=e.target.closest("[data-sber]");if(sb){const [di,sk]=sb.dataset.sber.split(":");const r=di==="m"?main:extra[+di],q=r.ramen;q.spop[sk]="";q.spod[sk]="";if(!q.spvol[sk])q.spvol[sk]=k.gepland||iso(today());recalc(di);draw();return}
    const be=e.target.closest("[data-ber]");if(be){const di=be.dataset.ber.split(":")[0];const isM=di==="m",r=isM?main:extra[+di],q=r.ramen;
      const w=isM?mF:Number(r.frequentie)||52;const leeg={...q,op:["","","",""],od:["","","",""],tp:"",td:""};const b=ramenBerekening(leeg,w,null);
      q.f.forEach((n,j)=>{q.op[j]="";q.od[j]="";if(!n)return;if(!q.vol[j])q.vol[j]=k.gepland||iso(today())});
      recalc(di);draw();return}
    const sy=e.target.closest("[data-sync]");if(sy){const [di,j]=sy.dataset.sync.split(":");const q=(di==="m"?main:extra[+di]).ramen,v=q.vol[+j];q.f.forEach((n,i)=>{if(n){q.vol[i]=v;if(q.kf[i]&&q.kfq[i])q.kvol[i]=v}});draw();toast("Aanboddatum "+fmtD(v)+" voor alle verdiepingen");return}
    const oc=e.target.closest("[data-ovclr]");if(oc){const di=oc.dataset.ovclr,q=(di==="m"?main:extra[+di]).ramen;q.tp="";q.td="";q.start="";recalc(di);draw();return}
    const re=e.target.closest("[data-redit]");if(re){editR.add(re.dataset.redit);draw();return}
    const rd=e.target.closest("[data-rdone]");if(rd){editR.delete(rd.dataset.rdone);draw();return}
    const co=e.target.closest("[data-calcopen]");if(co){const di=co.dataset.calcopen,r=di==="m"?main:extra[+di];r.ramen=(di==="m"&&uitTelling())||normR({});editR.add(di);draw();return}});
  $("#owLines").addEventListener("input",e=>{const el=e.target,i=el.dataset.i,key=el.dataset.k;if(i==null||!key)return;const tgt=i==="m"?main:extra[+i];
    tgt[key]=el.type==="checkbox"?el.checked:key==="prijs"||key==="frequentie"?(el.value===""?"":Number(el.value)):el.value;tot()});
  $("#owLines").addEventListener("change",e=>{if(e.target.dataset.k==="actief"){extra[+e.target.dataset.i].actief=e.target.checked;tot()}
    if(e.target.dataset.k==="apart"){extra[+e.target.dataset.i].apart=e.target.checked;tot()}
    if(e.target.dataset.k==="bij"){const r=extra[+e.target.dataset.i];if(r){r.bij=e.target.value||"";if(r.bij)r.apart=false}}
    if(e.target.dataset.k==="objectId"){const r=extra[+e.target.dataset.i];if(r){r.objectId=e.target.value||"";if(r.objectId)r.apart=true;draw()}}
    if(e.target.dataset.k==="frequentie"&&e.target.dataset.i!=="m"){const r=extra[+e.target.dataset.i];if(r&&r.items)groepRedraw($("#owLines"),"x"+e.target.dataset.i,r,gOpts(r))}});
  $("#owLines").addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(b){const i=+b.dataset.rm;if(soloI>=0&&i===soloI){const r=extra[i];delete r.ramen;delete r.items;delete r.groep;Object.assign(r,{dienst:"",prijs:"",objectId:"",apart:false,_toon:false});editR.delete(String(i));draw();return}extra.splice(i,1);if(soloSet.has(i)){const n=[...soloSet].filter(x=>x!==i).map(x=>x>i?x-1:x);soloSet.clear();n.forEach(x=>soloSet.add(x))}draw()}});
  groepBind($("#owLines"),key=>extra[+key.slice(1)],(key,struct)=>itemsRecalc(+key.slice(1),struct));
  const addLine=(dienst,prijs)=>{extra.push({id:newId("o"),dienst,prijs,frequentie:52,duur:30,volgende:"",actief:true});draw();const l=$("#owLines").querySelectorAll('input[data-k="dienst"]');const last=l[l.length-1];if(last){last.scrollIntoView({block:"center",behavior:"smooth"});if(!dienst)last.focus()}};
  const leegR=()=>uitTelling()||normR({});
  form.querySelectorAll("[data-dn]").forEach(b=>b.onclick=()=>{const d=diensten[+b.dataset.dn];if(!d.glas&&!(heeftGlas(k)||isGlas(main.dienst))){toast(GLAS_REGEL+" Maak eerst een offerte met glasbewassing.");return}
    /* nieuwe (losse) opdracht: de gekozen dienst vult deze opdracht zelf; glasbewassing opnieuw berekenen (ander adres = andere aantallen) */
    const soloGevuld=soloI>=0&&extra[soloI]&&(String(extra[soloI].dienst||"").trim()||extra[soloI].items||extra[soloI].ramen);
    if(soloGevuld){/* deze opdracht heeft al een dienst: de nieuwe dienst komt erbij als eigen opdracht, de eerste blijft staan */
      const o={id:newId("o"),dienst:d.naam,prijs:"",frequentie:mF||8,duur:30,volgende:"",actief:true,_nieuw:true,_solo:true,bij:soloId};
      if(d.items&&d.items.length)Object.assign(o,{groep:d.groep,items:d.items.map(it=>({...it,aantal:0})),prijs:0,duur:d.duur||30});
      else if(d.glas||isGlas(d.naam))o.ramen=normR({});else o.prijs=Number(d.prijs)||"";
      extra.push(o);const ni=extra.length-1;soloSet.add(ni);if(o.ramen)editR.add(String(ni));draw();
      const l=$("#owLines").querySelectorAll(".ow-line");if(l.length)l[l.length-1].scrollIntoView({block:"start",behavior:"smooth"});return}
    if(soloI>=0&&extra[soloI]){const r=extra[soloI];delete r.items;delete r.ramen;delete r.groep;
      if(d.items&&d.items.length)Object.assign(r,{dienst:d.naam,groep:d.groep,items:d.items.map(it=>({...it,aantal:0})),prijs:0,frequentie:mF||8,duur:d.duur||30});
      else if(d.glas||isGlas(d.naam)){Object.assign(r,{dienst:d.naam,prijs:"",frequentie:mF||8,duur:30,ramen:normR({})});editR.add(String(soloI))}
      else Object.assign(r,{dienst:d.naam,prijs:Number(d.prijs)||""});
      draw();const l=$("#owLines").querySelector(".ow-line");if(l)l.scrollIntoView({block:"start",behavior:"smooth"});return}
    if(d.items&&d.items.length){extra.push({id:newId("o"),dienst:d.naam,groep:d.groep,items:d.items.map(it=>({...it,aantal:0})),prijs:0,frequentie:mF||8,duur:d.duur||30,volgende:"",actief:true});draw();const l=$("#owLines").querySelectorAll(".ow-line");l[l.length-1].scrollIntoView({block:"start",behavior:"smooth"});return}
    if(d.glas||isGlas(d.naam)){if(isGlas(main.dienst)&&!main.ramen){main.ramen=leegR();editR.add("m");draw();const c=$("#owLines").querySelector('[data-calc="m"]');if(c)c.scrollIntoView({block:"start",behavior:"smooth"});return}
      if(isGlas(main.dienst)&&main.ramen&&d.naam.toLowerCase()===String(main.dienst).toLowerCase()){editR.add("m");draw();const c=$("#owLines").querySelector('[data-calc="m"]');if(c)c.scrollIntoView({block:"start",behavior:"smooth"});return}
      extra.push({id:newId("o"),dienst:d.naam,prijs:"",frequentie:mF||8,duur:30,volgende:"",actief:true,ramen:normR({})});editR.add(String(extra.length-1));draw();const l=$("#owLines").querySelectorAll(".ow-line");l[l.length-1].scrollIntoView({block:"start",behavior:"smooth"});return}
    addLine(d.naam,Number(d.prijs)||"")});
  $("#owEigen").onclick=()=>{if(soloI>=0&&extra[soloI]){extra[soloI]._toon=true;draw();const d=$("#owLines").querySelector('input[data-k="dienst"]');if(d){d.scrollIntoView({block:"center",behavior:"smooth"});d.focus()}return}addLine("","")};
  $("#owZoek").oninput=e=>{const q=e.target.value.toLowerCase();if(q){const m=form.querySelector("#owChips .chips-meer"),mb=form.querySelector("#owChips [data-meer]");if(m)m.hidden=false;if(mb)mb.hidden=true}form.querySelectorAll("#owChips [data-dn]").forEach(b=>b.hidden=!!q&&!b.textContent.toLowerCase().includes(q))};
  /* foto uploaden: via de opslag van het CRM (ook als die later is geladen) */
  const fotoUpload=async f=>{if(state.assets)return state.assets.upload(f);if(window.ZEEM_PUT){const id=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,"0")).join("");await window.ZEEM_PUT(id,f,f.type||"image/jpeg");return {id}}throw new Error("Uploaden kan hier niet")};
  const ff=$("#owFoto");if(ff&&ff.parentElement)ff.parentElement.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();ff.click()}};
  if(ff)ff.onchange=async e=>{const files=[...e.target.files];e.target.value="";const start=fotos.length;
    for(const file of files){try{const sz=await imgSize(file);const r=await fotoUpload(file);fotos.push({id:r.id,naam:file.name,datum:iso(today()),w:sz.w,h:sz.h,dots:[]})}catch(er){console.error("foto uploaden",er);toast("Foto "+file.name+" kon niet worden geüpload ("+String((er&&(er.code||er.message))||"onbekende fout").replace(/^storage\//,"")+")")}}
    drawFotos();if(fotos.length>start)openFotoViewer(allFotos(),tFotos.length+start,{edit:i=>i>=tFotos.length,onChange:(i,dots)=>{fotos[i-tFotos.length].dots=dots;drawFotos()}})};
  $("#owFotos").addEventListener("click",e=>{const b=e.target.closest("[data-frm]");if(b){e.preventDefault();e.stopPropagation();fotos.splice(+b.dataset.frm-tFotos.length,1);drawFotos();return}
    const c=e.target.closest("[data-fi]");if(c){e.preventDefault();openFotoViewer(allFotos(),+c.dataset.fi,{edit:i=>i>=tFotos.length,onChange:(i,dots)=>{fotos[i-tFotos.length].dots=dots;drawFotos()}})}});
  /* rekentool: prijs, frequentie en duur gaan direct naar regel 1 van de opdracht */
  let rcLive=false;
  const mountRc=()=>{const box=$("#owRc");if(!box||!box.hidden)return;
    try{if(!RC)RC=buildRamen();
      RC.setEmbed({klantId:k.id,base:k,
        form:()=>({naam:cleanName(k.naam),adres:k.adres||"",pc:k.postcode||"",plaats:k.plaats||"",tel:k.telefoon||"",email:k.email||"",notitie:"",zakelijk:isZak(k),soort:k.soort||"particulier"}),
        onCalc:()=>{if(!$("#owLines"))return;const c=RC.current();if(!c)return;rcLive=true;main.prijs=c.opd.prijs;if(c.extra&&c.extra.length){const gs=new Set(c.extra.map(e=>e.groep));extra=[...extra.filter(o=>!o.groep||!gs.has(o.groep)),...c.extra]}
          const sf=$o("freq"),w=String(c.opd.frequentie);if(c.opd.frequentie){if(![...sf.options].some(o=>o.value===w))sf.insertAdjacentHTML("beforeend",`<option value="${w}">${esc(freqLabel(w))}</option>`);sf.value=w}
          if(!(k.tijden||[]).length&&c.opd.duur){const sd=$o("duur"),m=String(c.opd.duur);if(![...sd.options].some(o=>o.value===m))sd.insertAdjacentHTML("beforeend",`<option value="${m}">${m} min</option>`);sd.value=m}
          draw();const pi=$("#owLines").querySelector('input[data-i="m"][data-k="prijs"]');if(pi){pi.classList.remove("flash");void pi.offsetWidth;pi.classList.add("flash")}},
        onSave:async patch=>{const d={...collect(),...patch};await save("klanten",kid,d);setTimeout(()=>openOpdrachtWerk(kid),80);return kid},
        offerte:async()=>{const {t}=await RC.telling();await save("klanten",kid,{...collect(),...(t?{ramenTelling:t}:{})});RC.reset();openOfferte({klantId:kid,metTelling:true})}},true);
      box.hidden=false;box.appendChild(RC.host);RC.sync();if(k.ramenTelling)RC.loadFor(k.id);const b=$("#owRcT");if(b)b.hidden=true}
    catch(er){console.error(er);box.hidden=false;box.innerHTML='<p class="subt">De rekentool kon hier niet worden geladen.</p>'}};
  if($("#owOff"))$("#owOff").onclick=async()=>{if(typeof owNieuwTerug==="function")await owNieuwTerug(kid);openOfferte({klantId:kid,metTelling:true})};
  const back=async()=>{if(typeof owNieuwTerug==="function")await owNieuwTerug(kid);openKlant(kid)};$("#owX").onclick=$("#owBack").onclick=back;$("#owKk").onclick=back;
  /* ramen per verdieping: ritme = kortste frequentie, volgende keer = vroegste aanboddatum (alleen als elke verdieping er een heeft) */
  const ramenRitmeDatum=o=>{const q=o.ramen,uit={};if(!q||!Array.isArray(q.f))return uit;const idx=q.f.map((n,i)=>Number(n)>0?i:-1).filter(i=>i>=0);if(!idx.length)return uit;
    const ws=idx.map(i=>Number((q.fq||[])[i])).filter(Boolean);if(ws.length)uit.frequentie=Math.min(...ws);
    const ds=idx.map(i=>(q.vol||[])[i]).filter(Boolean);if(ds.length===idx.length)uit.volgende=ds.sort()[0];return uit};
  const collect=()=>{syncRitme();const cur=state.klanten.find(x=>x.id===kid)||k,actief=$o("actief").checked;
    /* taakomschrijving hoort bij deze opdracht: bij een losse opdracht (eigen nummer) in die opdracht, niet bij de klant */
    if(soloR){soloR.taak=$o("taak").value.trim();soloSet.forEach(i=>{const o=extra[i];if(o&&o!==soloR&&(o._solo||o.bij===soloR.id)){o.objectId=soloR.objectId||"";o.apart=false;o.bij=soloR.id}})}
    return {...strip(cur),dienst:String(main.dienst||"").trim()||"Glasbewassing",prijs:r2(Number(main.prijs)||0),ramenRegel:main.ramen||null,frequentie:mW.length?1:(mF||4),weekdagen:mW.length?mW:[],...(mW.length?{autoplan:true}:{}),duur:mD||30,ronde:$o("ronde").value.trim(),contactPlanning:$o("contact").value,eersteKeer:$o("eerste").value==="ja",toeslag:Number($o("toeslag").value)||0,toeslagReden:$o("toeslagr").value.trim(),verbergAantal:$o("verbA").checked,verbergFreq:$o("verbF").checked,afmeldMail:$o("afmail").checked,
      binnen:false,actief,...(actief?{}:{gepland:"",tijd:""}),akkoord:$o("akkoord").checked,incasso:$o("betaal").value==="incasso",...factModusPatch($o("fact").value,k),
      taak:soloR?(cur.taak||""):$o("taak").value.trim(),...($o("vvetaken")?vveEdLees($o("vvetaken")):{}),hosp:hosp.map(x=>({c:x.c||"voorkeur",t:String(x.t||"").trim(),...(x.af?{af:x.af}:{}),...(x.c==="verteld"&&x.vanaf?{vanaf:x.vanaf}:{})})).filter(x=>x.t),bellen:$o("bellen").checked,startdatum:$o("start").value,einddatum:$o("eind").value,btwVerlegd:$o("verlegd").checked,aanbieden:cur.gepland?!!cur.aanbieden:aanb.aanbieden,uitstelTot:aanb.uitstelTot,artikelen:arts.filter(a=>String(a.naam||"").trim()).map(a=>({naam:String(a.naam).trim(),aantal:Number(a.aantal)||1,prijs:r2(Number(a.prijs)||0)})),middelen:mids,objectId:$o("obj")?$o("obj").value:cur.objectId||"",fotos,
      opdrachten:extra.filter(o=>String(o.dienst||"").trim()).map(({_nieuw,_toon,_bestaand,_solo,...o})=>({...o,dienst:String(o.dienst).trim(),prijs:r2(Number(o.prijs)||0),frequentie:o.items?itemsRitme(o):Number(o.frequentie)||52,...(o.ramen?ramenRitmeDatum(o):{}),...(o.objectId&&o.objectId!=="hoofd"&&!o.bij&&!o.apart&&!opdrBij({opdrachten:extra},o)?{apart:true}:{})}))}};
  $("#owLog").onclick=async()=>{const v=$o("log").value.trim();if(!v)return;const d=collect();d.log=[...(d.log||[]),{datum:iso(today()),tekst:v}];
    try{await save("klanten",kid,d);toast("Genoteerd");setTimeout(()=>openOpdrachtWerk(kid),60)}catch(er){err(er)}};
  /* opslaan per dienst: alles bewaren en in het werkblad blijven */
  $("#owLines").addEventListener("click",e=>{const o=e.target.closest("[data-lopen]");if(!o)return;const r=extra[+o.dataset.lopen];if(r&&r.id){dicht.delete(r.id);draw()}});
  $("#owLines").addEventListener("click",async e=>{const b=e.target.closest("[data-lsave]");if(!b)return;e.preventDefault();if(await fqMelding())return;b.disabled=true;
    try{let d=collect();if(rcLive&&RC&&RC.current()){const {t}=await RC.telling();if(t)d={...d,ramenTelling:t}}await save("klanten",kid,d);
      const di=b.dataset.lsave,r=di==="m"?main:extra[+di];toast("“"+((r&&r.dienst)||"Glasbewassing")+"” opgeslagen");if(editR.has(di))editR.delete(di);if(di!=="m"&&r&&r.id)dicht.add(r.id);draw()}
    catch(er){err(er)}finally{b.disabled=false}});
  /* zoals in DienstenCRM: bij elke verdieping en elk bijzonder raam met een aantal moet de gebruiker zelf een frequentie kiezen */
  const fqOntbreekt=()=>{const L=soloI>=0?[...soloSet].map(i=>[String(i),extra[i]]):[["m",main],...extra.map((r,i)=>[String(i),r]).filter(x=>!x[1]._bestaand)];
    return L.filter(([,r])=>{const q=r&&r.ramen;if(!q)return false;return (q.f||[]).some((n,j)=>Number(n)>0&&!(q.fq||[])[j])||Object.keys(q.sp||{}).some(k=>Number(q.sp[k])>0&&!(q.spfq||{})[k])}).map(x=>x[0])};
  const fqMelding=async()=>{const mis=fqOntbreekt();if(!mis.length)return false;mis.forEach(x=>{editR.add(x);const r=x==="m"?main:extra[+x];if(r&&r.id)dicht.delete(r.id)});draw();await melding("Let op: Er is nog geen frequentie ingevuld.","Kies bij elke verdieping (en elk bijzonder raam) met een aantal een frequentie.");
    const s=$("#owLines").querySelector('select[data-rk^="fq"] option[value=""]:checked, select[data-rk^="spfq:"] option[value=""]:checked');if(s){const el=s.parentElement;el.scrollIntoView({block:"center",behavior:"smooth"});el.focus()}return true};
  form.onsubmit=async e=>{e.preventDefault();if(await fqMelding())return;$("#owSave").disabled=true;
    try{let d=collect();if(rcLive&&RC&&RC.current()){const {t}=await RC.telling();if(t)d={...d,ramenTelling:t}}
      /* aanboddatum gewijzigd terwijl er al een afspraak staat: vragen of die mee moet */
      {const cur=state.klanten.find(x=>x.id===kid)||k,a0=aanbodVan(cur),a1=aanbodVan(d);
        if(a1&&(!a0||a0.min!==a1.min)&&d.gepland&&d.gepland!==a1.min&&typeof vraag==="function"){
          const ok=await vraag("Afspraak aanpassen?",`Er staat al een afspraak op <b>${esc(fmtL(d.gepland))}</b>. De nieuwe aanboddatum is <b>${esc(fmtL(a1.min))}</b>. Wil je de afspraak terugzetten naar Te plannen, zodat hij vanaf de nieuwe datum wordt aangeboden?`,"Terug naar te plannen","Afspraak laten staan");
          if(ok)d={...d,gepland:"",tijd:"",aanbieden:false}}}
      await save("klanten",kid,d);toast("Opdracht opgeslagen"+((a=>a?" · aan de beurt vanaf "+fmtD(iso(volgende(d))):"")(aanbodVan(d))));setTimeout(back,60)}catch(er){$("#owSave").disabled=false;err(er)}};
  if(focus&&focus!=="main"&&focus!=="hosp"){setTimeout(()=>{const l=$("#owLines");if(l)l.scrollIntoView({block:"start"});const ins=$("#owLines")&&$("#owLines").querySelectorAll('input[data-k="dienst"]');if(focus==="new"&&ins&&ins.length)ins[ins.length-1].focus()},80)}
}

/* ---------- foto's met aangetikte ramen ---------- */
const DOTCOL=t=>({"s-lood":"#12a594","s-mini":"#d6409f","s-koepel":"#3e63dd","s-tuimel":"#0090ff"})[t]||["#e5484d","#f76b15","#8e4ec6","#6e56cf","#5b5bd6"][Math.min(4,+String(t||"f0").slice(1)||0)]||"#e5484d";
const imgSize=file=>new Promise(res=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{res({w:im.naturalWidth,h:im.naturalHeight});URL.revokeObjectURL(u)};im.onerror=()=>{res({w:4,h:3});URL.revokeObjectURL(u)};im.src=u});
const dotsHtml=(f,big)=>(f.dots||[]).map((d,j)=>`<span class="fdot${big?" big":""}" data-dj="${j}" style="left:${d.x*100}%;top:${d.y*100}%;background:${d.t?DOTCOL(d.t):"var(--brand,#137a8a)"}"></span>`).join("");
function fotoCard(f,i,removable){const ar=f.w&&f.h?`${f.w}/${f.h}`:"4/3",n=(f.dots||[]).length;
  return `<div class="ow-foto" data-fi="${i}" role="button" tabindex="0" title="Openen en ramen aantikken"><span class="fwrap" style="aspect-ratio:${ar}"><img src="${BLOB}${esc(f.id)}" alt="${esc(f.naam||"Foto")}" loading="lazy">${dotsHtml(f)}</span><small>${n?`<b>${n} ${n===1?"raam":"ramen"}</b> · `:""}${esc(f.naam||"Foto")}</small>${removable?`<button type="button" class="ow-frm" data-frm="${i}" aria-label="Foto verwijderen">${I.x}</button>`:""}</div>`}
function openFotoViewer(list,start,opt={}){
  let i=start,hist=[];const canEdit=j=>typeof opt.edit==="function"?opt.edit(j):!!opt.edit;
  const ov=document.createElement("div");ov.className="fv";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");
  (dlg.open?dlg:document.body).appendChild(ov);
  const close=()=>{ov.remove();document.removeEventListener("keydown",key)};
  const key=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close()}else if(e.key==="ArrowRight")go(1);else if(e.key==="ArrowLeft")go(-1)};
  const go=d=>{if(list.length<2)return;i=(i+d+list.length)%list.length;hist=[];draw()};
  const draw=()=>{const f=list[i],ed=canEdit(i),n=(f.dots||[]).length;
    ov.innerHTML=`<div class="fv-top"><div><b>${ed?"Tik de ramen aan die gewassen moeten worden":"Ramen die gewassen moeten worden"}</b><br><span>${esc(f.naam||"Foto")} · ${n} ${n===1?"raam":"ramen"} aangetikt${list.length>1?` · foto ${i+1} van ${list.length}`:""}${!ed&&f.t?" · stippen komen uit de rekentool":""}</span></div><button type="button" class="fv-x" aria-label="Sluiten">${I.x}</button></div>
      <div class="fv-stage">${list.length>1?`<button type="button" class="fv-nav l" aria-label="Vorige foto">${I.left||"‹"}</button>`:""}<div class="fv-wrap${ed?" ed":""}" style="aspect-ratio:${f.w&&f.h?f.w+"/"+f.h:"4/3"}"><img src="${BLOB}${esc(f.id)}" alt="">${dotsHtml(f,true)}</div>${list.length>1?`<button type="button" class="fv-nav r" aria-label="Volgende foto">${I.right}</button>`:""}</div>
      <div class="fv-bar">${ed?`<button type="button" class="fv-undo"${hist.length||n?"":" disabled"}>Ongedaan</button><button type="button" class="fv-clear"${n?"":" disabled"}>Alles wissen</button>`:""}<button type="button" class="fv-done">${ed?"Klaar":"Sluiten"}</button></div>`;
    const wEl=ov.querySelector(".fv-wrap"),stg=ov.querySelector(".fv-stage").getBoundingClientRect(),rt=(f.w&&f.h)?f.w/f.h:4/3,aw=stg.width-(list.length>1?120:24),ah=stg.height-8;
    let ww=aw,hh=aw/rt;if(hh>ah){hh=ah;ww=ah*rt}wEl.style.width=Math.max(50,ww)+"px";wEl.style.height=Math.max(50,hh)+"px";wEl.style.aspectRatio="auto";
    ov.querySelector(".fv-x").onclick=close;ov.querySelector(".fv-done").onclick=close;
    const l=ov.querySelector(".fv-nav.l"),r=ov.querySelector(".fv-nav.r");if(l)l.onclick=()=>go(-1);if(r)r.onclick=()=>go(1);
    const set=dots=>{f.dots=dots;if(opt.onChange)opt.onChange(i,dots);draw()};
    if(ed){const w=ov.querySelector(".fv-wrap");
      w.onclick=e=>{const dEl=e.target.closest(".fdot");const dots=[...(f.dots||[])];
        if(dEl){dots.splice(+dEl.dataset.dj,1);set(dots);return}
        const b=w.getBoundingClientRect();dots.push({x:Math.round((e.clientX-b.left)/b.width*10000)/10000,y:Math.round((e.clientY-b.top)/b.height*10000)/10000});set(dots)};
      ov.querySelector(".fv-undo").onclick=()=>{const dots=[...(f.dots||[])];dots.pop();set(dots)};
      ov.querySelector(".fv-clear").onclick=()=>set([])}};
  document.addEventListener("keydown",key);draw();
}
const jobFotos=k=>[...(((k.ramenTelling||{}).fotos)||[]).map(f=>({...f,naam:"Uit de telling",t:1})),...(k.fotos||[])];
document.addEventListener("click",e=>{const c=e.target.closest("[data-jfi]");if(!c)return;const jp=c.closest("#jobPanel");if(!jp)return;e.preventDefault();
  const k=state.klanten.find(x=>x.id===jp.dataset.k);if(k)openFotoViewer(jobFotos(k),+c.dataset.jfi,{edit:false})});

/* ---------- glasbewassing per verdieping: berekening (ook gebruikt bij afmelden) ---------- */
const FLN=["Begane grond","1e verdieping","2e verdieping","3e verdieping"];
const has0=v=>v!==""&&v!=null;
const SPK=["tuimel","koepel","lood","mini"],SPN={tuimel:"Dak- / tuimelramen",koepel:"Lichtkoepels",lood:"Glas-in-lood",mini:"Miniraampjes"};
const normR=q=>{q=q||{};const a=(x,d)=>[0,1,2,3].map(i=>x&&x[i]!=null?x[i]:d);
  const r={f:a(q.f,0).map(n=>Number(n)||0),fq:a(q.fq,""),vol:a(q.vol,""),op:a(q.op,""),od:a(q.od,""),kf:a(q.kf,false).map(Boolean),kfq:a(q.kfq,""),kvol:a(q.kvol,""),kop:a(q.kop,""),kod:a(q.kod,""),start:q.start??"",tp:q.tp??"",td:q.td??"",oms:q.oms||"",sp:SPK.reduce((o,k)=>(o[k]=Math.max(0,Math.round(Number(q.sp&&q.sp[k])||0)),o),{})};
  const so=(x,d)=>SPK.reduce((o,k)=>(o[k]=x&&x[k]!=null?x[k]:d,o),{});["spfq","spvol","spop","spod","spkfq","spkvol","spkop","spkod"].forEach(n=>r[n]=so(q[n],""));r.spkf=SPK.reduce((o,k)=>(o[k]=!!(q.spkf&&q.spkf[k]),o),{});
  if(q.koz&&!q.kf){r.f.forEach((n,i)=>{if(n){r.kf[i]=true;r.kfq[i]=(q.kz&&q.kz.fq)||"";r.kvol[i]=(q.kz&&q.kz.vol)||""}})}return r};
const ramenVariabel=q=>!!q&&new Set((q.f||[]).map((n,i)=>n?String((q.fq||[])[i]||""):null).filter(x=>x!==null)).size>1;
function ramenBerekening(q,opdrW,due){
  if(!RC)RC=buildRamen();const c=RC.cfgAll(),has=v=>v!==""&&v!=null;
  const tierU=n=>{const t=(c.tiers||[]).filter(x=>x[0]>0).slice().sort((a,b)=>a[0]-b[0]);let off=0;for(let i=1;i<=n;i++){let d=0;for(const [from,p] of t){if(i>=from)d=p}off+=d/100}return off};
  const fl=q.f.map((n,i)=>({i,n:Number(n)||0})).filter(x=>x.n>0&&(!due||due.f[x.i]));
  const tot=fl.reduce((a,x)=>a+x.n,0),SD=RC.staffel(fl.map(x=>({k:"g"+Math.min(3,x.i),n:x.n})));let over=false;
  const calc=x=>{const key="g"+Math.min(3,x.i),w=Number(q.fq[x.i])||opdrW;return {p:x.n*(c[key+"_p"]||0)*(1-(SD[key]||0))*(1-RC.freqPct(w)/100),min:x.n*(c[key+"_s"]||0)/60}};
  const rows=fl.map(x=>{const b=calc(x);let p=b.p;if(has(q.op[x.i])){p=Number(q.op[x.i]);over=true}return {i:x.i,n:x.n,naam:FLN[x.i],p:r2(p),min:has(q.od[x.i])?Number(q.od[x.i]):b.min,calcP:r2(b.p),calcMin:Math.ceil(b.min),sec:c["g"+Math.min(3,x.i)+"_s"]||0,pp:c["g"+Math.min(3,x.i)+"_p"]||0,ovP:has(q.op[x.i]),ovD:has(q.od[x.i])}});
  const spread=(target,key)=>{const sum=rows.reduce((a,r)=>a+r[key],0);if(!rows.length||!(sum>0))return;const f=target/sum;let acc=0;rows.forEach((r,ix)=>{if(ix===rows.length-1)r[key]=key==="p"?r2(target-acc):Math.max(0,target-acc);else{r[key]=key==="p"?r2(r[key]*f):r[key]*f;acc+=r[key]}})};
  /* bijzondere ramen (dak/tuimel, koepel, glas-in-lood, mini): eigen tarief, met de frequentiekorting van die dienst (Uitvoering › Diensten) */
  const spOk=k=>!due||!due.sp||due.sp[k];const sq=SPK.reduce((o,k)=>(o[k]=q.sp&&spOk(k)?Number(q.sp[k])||0:0,o),{}),SS=RC.staffel(SPK.map(k=>({k,n:Number(sq[k])||0})).filter(x=>x.n));
  const srows=SPK.map(k=>{const n=Number(sq[k])||0;if(!n)return null;const cp=r2(n*(c[k+"_p"]||0)*(1-(SS[k]||0))*(typeof dienstFreqFactor==="function"?dienstFreqFactor("bijz",Number(q.spfq&&q.spfq[k])||opdrW):1)),cm=n*(c[k+"_s"]||0)/60,op=q.spop&&q.spop[k],od=q.spod&&q.spod[k];if(has(op))over=true;
    return {k,n,naam:SPN[k],p:has(op)?r2(Number(op)):cp,min:has(od)?Number(od):cm,cp,cm,ovP:has(op),ovD:has(od)}}).filter(Boolean);
  rows.push(...srows.map(r=>({...r,i:"s",calcP:r.cp,calcMin:Math.ceil(r.cm),sp:true})));
  let glas=rows.reduce((a,r)=>a+r.p,0),minG=false,totOver=false,aanvul=0;
  if(rows.length&&has(q.tp)){/* overschrijvende prijs voor de hele glasbewassing: verdeeld naar verhouding over de verdiepingen */
    let target=Number(q.tp)||0;if(due){const all=ramenBerekening({...q,tp:"",td:""},opdrW,null),part=rows.reduce((a,r)=>a+r.p,0);target=all.glas>0?target*part/all.glas:target}
    spread(target,"p");glas=r2(target);totOver=true}
  else if(rows.length&&!over&&glas<c.min){/* onder het minimumtarief: per verdieping blijft de echte prijs staan, het verschil wordt op de achtergrond aangevuld tot het minimum */minG=true;aanvul=r2(c.min-glas);glas=c.min}
  if(rows.length&&has(q.td)){let tm=Number(q.td)||0;if(due){const all=ramenBerekening({...q,tp:"",td:""},opdrW,null),part=rows.reduce((a,r)=>a+r.min,0);const am=all.rows.reduce((a,r)=>a+r.min,0);tm=am>0?tm*part/am:tm}spread(tm,"min")}
  /* kozijnreiniging per onderdeel aan te vinken (zoals DienstenCRM); zit standaard bij de glasbewassing in, dus € 0 tenzij je een eigen prijs invult */
  const kz=[...q.f.map((n,i)=>({i,n:Number(n)||0})).filter(x=>x.n&&q.kf[x.i]&&(!due||!due.k||due.k[x.i])).map(x=>({...x,naam:FLN[x.i],op:q.kop[x.i],od:q.kod[x.i]})),
    ...SPK.filter(k=>q.sp&&Number(q.sp[k])&&q.spkf&&q.spkf[k]&&(!due||!due.sk||due.sk[k])).map(k=>({i:"s:"+k,k,n:Number(q.sp[k]),naam:SPN[k],op:q.spkop&&q.spkop[k],od:q.spkod&&q.spkod[k],sp:true}))];
  const krows=kz.map(x=>({i:x.i,k:x.k,sp:!!x.sp,n:x.n,naam:x.naam,p:has(x.op)?r2(Number(x.op)):0,min:has(x.od)?Number(x.od):0,calcP:0,calcMin:0,ovP:has(x.op)}));
  const kozP=krows.reduce((a,r)=>a+r.p,0),minK=false,kozMin=krows.reduce((a,r)=>a+r.min,0);
  const start=rows.length?(has(q.start)?Number(q.start):(c.start||0)):0,ex=r2(glas+kozP+start);
  return {rows,krows,glas:r2(glas),minG,aanvul,totOver,kozP:r2(kozP),minK,kozMin,start,ex,min:Math.ceil(rows.reduce((a,r)=>a+r.min,0)+kozMin),count:tot+srows.reduce((a,r)=>a+r.n,0),srows,c};
}
/* welke delen gaan mee op deze dag, en hoe schuiven de volgende data door */
/* gaat er op deze dag een andere dienst mee (bv. reiniging gevelelementen), dan gaat de hele glasbewassing standaard mee (uit te zetten bij Instellingen › Planning) */
function glasMeeDag(k,d){try{return S().glasMee!==false&&typeof extraDue==="function"&&extraDue(k,d).length>0}catch(e){return false}}
function ramenDue(k,d){const q=normR(k.ramenRegel);const mee=glasMeeDag(k,d),ok=(fq,vol)=>mee||!fq||!vol||vol<=d;
  return {q,due:{f:q.f.map((n,i)=>!!n&&ok(q.fq[i],q.vol[i])),k:q.f.map((n,i)=>!!n&&q.kf[i]&&ok(q.kfq[i],q.kvol[i])),
    sp:SPK.reduce((o,k)=>(o[k]=!!q.sp[k]&&ok(q.spfq[k],q.spvol[k]),o),{}),sk:SPK.reduce((o,k)=>(o[k]=!!q.sp[k]&&q.spkf[k]&&ok(q.spkfq[k],q.spkvol[k]),o),{})}}}
function ramenDoorschuiven(q,due,d){const n={...q,vol:[...q.vol],kvol:[...q.kvol]},nx=w=>iso(addDays(parse(d),Number(w)*7));
  q.f.forEach((c,i)=>{if(!c)return;if(q.fq[i]&&due.f[i])n.vol[i]=nx(q.fq[i]);if(q.kf[i]&&q.kfq[i]&&due.k[i])n.kvol[i]=nx(q.kfq[i])});
  n.spvol={...(q.spvol||{})};n.spkvol={...(q.spkvol||{})};SPK.forEach(k=>{if(!q.sp||!q.sp[k])return;if(q.spfq[k]&&due.sp&&due.sp[k])n.spvol[k]=nx(q.spfq[k]);if(q.spkf[k]&&q.spkfq[k]&&due.sk&&due.sk[k])n.spkvol[k]=nx(q.spkfq[k])});return n}

/* korte samenvatting voor de klantkaart: per verdieping aantal, frequentie, aanboddatum, prijs en tijdsduur */
function ramenSamenvatting(k){try{if(!k.ramenRegel)return"";const q=normR(k.ramenRegel);if(!q.f.some(n=>n))return"";const c=ramenBerekening(q,Number(k.frequentie)||4,null);
  return `<div class="kk-rs">${q.f.map((n,j)=>{if(!n)return"";const rw=c.rows.find(x=>x.i===j);return `<span><b>${FLN[j]}</b> ${n} st · ${esc((q.fq[j]?freqLabel(q.fq[j]):freqLabel(k.frequentie)).toLowerCase())}${q.vol[j]?" · vanaf "+esc(fmtD(q.vol[j])):""} · ${rw?eur(rw.p):"—"} · ${rw?Math.round(rw.min):0} min</span>`}).join("")}</div>`}catch(e){return""}}

/* verdieping-icoon: huisje met de betreffende verdieping gemarkeerd */
function flIcon(j){const n=Math.max(2,Math.min(4,j+1)),H=13/n,y0=21,rows=[...Array(n)].map((_,i)=>{const y=y0-(i+1)*H;return `<rect x="5.5" y="${(y+.6).toFixed(2)}" width="13" height="${(H-1.2).toFixed(2)}" rx="1.4" class="${i===j?"on":""}"/>`}).join("");
  return `<span class="ow-fi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3.5 ${(y0-n*H).toFixed(2)}L12 3l8.5 ${(y0-n*H-3).toFixed(2)}" class="roof"/>${rows}</svg><b>${j?j:"BG"}</b></span>`}

/* tijd zoals berekend in de offerte / rekentool (los van de gemeten tijden) */
function berekendeMin(k,day){if(!k)return null;let m=null;
  try{if(k.ramenRegel){const b=ramenBerekening(normR(k.ramenRegel),Number(k.frequentie)||4,null);if(b&&b.min)m=b.min}}catch(e){}
  if(m==null){const off=state.facturen.filter(f=>f.klantId===k.id&&f.soort==="offerte"&&f.status==="geaccepteerd").sort((a,b)=>String(b.akkoordOp||b.datum).localeCompare(String(a.akkoordOp||a.datum)))[0];
    if(off)m=Number(off.telling&&off.telling.minuten)||Number(off.opdracht&&off.opdracht.duur)||null}
  if(m==null&&k.ramenTelling&&k.ramenTelling.minuten)m=Number(k.ramenTelling.minuten);
  if(m==null)return null;
  try{(typeof extraDue==="function"?extraDue(k,day||iso(today())):[]).forEach(o=>{m+=Number(o.duur)||0})}catch(e){}
  return Math.round(m)}

/* VvE-checklist in de opdracht: per taak een frequentie */
function vveEdRij(t,f){return `<div class="vve-er"><input data-vtn value="${esc(t)}" placeholder="Bijv. hekwerk" maxlength="60"><select data-vtf>${VVE_FREQ.map(([c,l])=>`<option value="${c}"${c===f?" selected":""}>${esc(l)}</option>`).join("")}</select><button type="button" class="iconbtn sm" data-vtx aria-label="Weghalen">${I.x}</button></div>`}
function vveEdLees(el){const vveTaken=[],vveFreq={};el.querySelectorAll(".vve-er").forEach(r=>{const n=r.querySelector("[data-vtn]").value.trim(),f=r.querySelector("[data-vtf]").value;if(n&&!vveTaken.includes(n)&&vveTaken.length<20){vveTaken.push(n);if(f!=="beurt")vveFreq[n]=f}});return{vveTaken,vveFreq}}
document.addEventListener("click",e=>{const x=e.target.closest&&e.target.closest("[data-vtx]");if(x){x.closest(".vve-er").remove();return}
  const p=e.target.closest&&e.target.closest("#owVveTk");if(p){const el=document.getElementById("ow-vvetaken");if(el){el.insertAdjacentHTML("beforeend",vveEdRij("","beurt"));el.lastElementChild.querySelector("input").focus()}}});
