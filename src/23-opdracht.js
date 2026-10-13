/* ---------- OPDRACHT-WERKBLAD: alles van één opdracht in één scherm ---------- */
function openOpdrachtWerk(kid,focus){
  const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const st=S(),incl=!!st.incl,btwL=incl?"incl.":"excl.";
  let extra=(k.opdrachten||[]).map(o=>({...o}));
  if(focus==="new")extra.push({id:newId("o"),dienst:"",prijs:"",frequentie:52,duur:30,volgende:"",actief:true,_nieuw:true});
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
  openDlg(`<div class="dlg-head"><span class="objic big">${I.checksq||I.check}</span><div style="min-width:0;flex:1"><h3>Opdracht ${esc(nr)}-1 · ${esc(k.dienst||"Glasbewassing")}</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(jobAddr(k))}</div></div><span class="pill ${status[0]} dotp">${status[1]}</span><button type="button" class="iconbtn" id="owX" aria-label="Terug naar klantkaart">${I.x}</button></div>
  <div class="hosp-top" id="owHospTop">${hospBlok(k,{leegKnop:false})}</div>
  <div class="kk-grid ow-grid"><div class="kk-left">
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Klantgegevens</b><span class="sp"></span><button type="button" class="small" id="owKk">${I.right}Klantkaart</button></div>
      ${kv("Klantnummer",esc(nr))}${kv("Naam",esc(cleanName(k.naam)))}${kv("E-mail",k.email?`<a href="mailto:${esc(k.email)}">${esc(k.email)}</a>`:"—")}${kv("Telefoon",k.telefoon?`<a href="tel:${esc(String(k.telefoon).replace(/[^\d+]/g,""))}">${esc(k.telefoon)}</a>`:"—")}${kv("Soort",k.soort==="zakelijk"?"Zakelijk":"Particulier")}</section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.pin}</span><b>Adresgegevens</b><span class="sp"></span><a class="btn small" href="${esc(mapsQ(k))}" target="_blank" rel="noopener">${I.nav}Navigatie</a></div>
      ${kv("Adres",esc(jobAddr(k)))}${(k.objecten||[]).length>1?`<label>Object<select id="ow-obj">${k.objecten.map(o=>`<option value="${esc(o.id)}" ${jobObj(k)&&jobObj(k).id===o.id?"selected":""}>${esc(o.naam||"Object")}</option>`).join("")}</select></label>`:""}
      ${[["offerte","Offerte gaat naar"],["factuur","Facturen gaan naar"],["planning","Planningsmails gaan naar"]].map(([x,l])=>kv(l,(mailK(k,x).email?esc(mailK(k,x).email):"—")+(tavK(k,x)?`<br><small class="subt">t.a.v. ${esc(tavK(k,x))}</small>`:""))).join("")}<button type="button" class="linkbtn" id="owAdr" style="align-self:flex-start">Adresgegevens aanpassen ${I.right}</button></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.planning}</span><b>Afspraakdetails</b></div>
      <div class="grid2">
        <label>Ronde<input id="ow-ronde" list="ow-rl" value="${esc(k.ronde||"")}" placeholder="bijv. Ronde Noord"><datalist id="ow-rl">${rondes().map(r=>`<option value="${esc(r)}">`).join("")}</datalist></label>
        <label>Volgende beurt<input value="${k.gepland?esc(fmtL(k.gepland))+(k.tijd?" "+esc(k.tijd):""):"Te plannen"}" disabled></label>
        <label>Eerste keer<select id="ow-eerste"><option value="ja" ${isEersteKeer(k)?"selected":""}>Ja</option><option value="nee" ${isEersteKeer(k)?"":"selected"}>Nee</option></select><small class="help">${k.eersteKeer==null?"Automatisch ingevuld: ":""}wordt na de eerste afgemelde beurt vanzelf Nee</small></label>
        <label>Contactmethode planning<select id="ow-contact">${[["kennisgeving","Kennisgeving (aankondiging sturen)"],["bevestigen","Afspraak laten bevestigen"],["geen","Geen bericht"]].map(([v,l])=>`<option value="${v}" ${(k.contactPlanning||"kennisgeving")===v?"selected":""}>${l}</option>`).join("")}</select></label>
        <label>Toeslag (%)<input id="ow-toeslag" type="number" step="1" min="0" value="${esc(k.toeslag||"")}" placeholder="0"></label>
        <label>Reden toeslag<input id="ow-toeslagr" value="${esc(k.toeslagReden||"")}" placeholder="Bijv. hoogwerker nodig"></label>
        <label class="check-row"><input id="ow-verbA" type="checkbox" ${k.verbergAantal?"checked":""}>Aantallen verbergen op factuur</label>
        <label class="check-row"><input id="ow-verbF" type="checkbox" ${k.verbergFreq?"checked":""}>Frequenties verbergen op factuur</label>
        <label class="full check-row"><input id="ow-afmail" type="checkbox" ${k.afmeldMail?"checked":""}>Afmeldbericht klaarzetten na elke beurt</label>
        <label class="full check-row"><input id="ow-bellen" type="checkbox" ${k.bellen?"checked":""}>Medewerker moet onderweg bellen <small class="help">staat bij de klus op de route</small></label>
        <label class="full check-row"><input id="ow-actief" type="checkbox" ${k.actief!==false?"checked":""}>Opdracht loopt (uitzetten = klant inactief, alle toekomstige afspraken vervallen)</label>
        ${k.gepland?`<button type="button" class="small ghost danger" id="owWis" style="grid-column:1/-1;justify-self:start;white-space:nowrap">Alle toekomstige afspraken verwijderen</button>`:""}
      </div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.spark}</span><b>Nu aanbieden / uitstellen</b></div>
      <div class="ow-aanb" id="owAanb"></div></section>
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
    <section class="kp"><div class="kp-h"><span class="objic">${I.pencil}</span><b>Extra informatie</b></div>
      <label>Taakomschrijving<textarea id="ow-taak" style="min-height:70px" placeholder="Bijv. wassen ramen incl. kozijnen, achterom via de poort">${esc(k.taak||"")}</textarea></label>
      <label>Notitie voor op de route<textarea id="ow-not" style="min-height:56px" placeholder="Sleutel onder bloempot, hond, ladder nodig achterkant…">${esc(k.notities||"")}</textarea></label></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.check}</span><b>Afspraakregels</b><span class="sp"></span><button type="button" class="iconbtn sm primary" id="owAddT" aria-label="Opdrachtregel toevoegen" aria-expanded="false">${I.plus}</button></div><div class="ow-add" id="owAdd" hidden><div class="ow-addh"><b>Opdrachtregel toevoegen</b><button type="button" class="small" id="owEigen">${I.plus}Eigen dienst</button></div><input id="owZoek" placeholder="Zoeken" style="max-width:280px">
      <div class="ow-chips" id="owChips">${dienstChips(diensten,"data-dn")}</div></div><div id="owLines"></div><div class="totals" id="owTot"></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.receipt}</span><div style="min-width:0"><b>Artikelen</b><small>Gaan eenmalig mee op de volgende factuur</small></div><span class="sp"></span><button type="button" class="iconbtn sm primary" id="owArtAdd" aria-label="Artikel toevoegen">${I.plus}</button></div><div id="owArt"></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.camera||I.upload}</span><b>Foto's</b><span class="sp"></span>${state.assets?`<label class="btn small primary">${I.plus}Uploaden<input type="file" accept="image/*" multiple hidden id="owFoto"></label>`:""}</div><div class="ow-fotos" id="owFotos"></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.chat}</span><b>Logboek</b></div>
      <div class="log">${[...(k.log||[]).map(l=>({d:l.datum,t:l.tekst,s:"Notitie"})),...state.berichten.filter(m=>m.klantId===k.id).map(m=>({d:String(m.op).slice(0,10),t:m.tekst,s:KANAAL[m.kanaal]||m.kanaal}))].sort((a,b)=>String(b.d).localeCompare(String(a.d))).slice(0,15).map(l=>`<div><span>${fmtD(l.d)} · ${esc(l.s)}</span>${esc(l.t)}</div>`).join("")||'<div style="color:var(--muted)">Er zijn nog geen logboekregels.</div>'}</div>
      <div style="display:flex;gap:8px"><input id="ow-log" placeholder="Bijv. gebeld, komt dinsdag beter uit"><button type="button" class="small" id="owLog">Noteer</button></div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.wrench}</span><div style="min-width:0"><b>Bedrijfsmiddelen</b><small>Staan bij de klus op de route</small></div></div><div id="owMid"></div></section>
    <section class="kp kp-rc"><div class="kp-h"><span class="objic">${I.calculator}</span><div style="min-width:0"><b>Prijs aanpassen?</b><small>${k.ramenTelling?`Laatste telling ${fmtD(k.ramenTelling.datum)} · ${k.ramenTelling.ramen} ramen. `:""}Tel opnieuw in een nieuwe offerte; na akkoord past de opdracht zich aan.</small></div><span class="sp"></span><button type="button" class="small primary" id="owOff">${I.offertes}Nieuwe offerte</button></div></section>
  </div></div>
  <div class="row stickyfoot kk-foot"><button type="button" class="ghost danger" id="owDel">${I.trash}Opdracht verwijderen</button><span class="sp"></span><button type="button" id="owBack">Annuleren</button><button type="submit" class="primary" id="owSave">${I.check}Opslaan</button></div>`,{xwide:true});
  const $o=n=>$("#ow-"+n);
  {const t=$("#owAddT"),p=$("#owAdd");if(t&&p)t.onclick=()=>{p.hidden=!p.hidden;t.setAttribute("aria-expanded",String(!p.hidden));t.classList.toggle("open",!p.hidden);if(!p.hidden){const z=$("#owZoek");z&&z.focus()}}}
  const editR=new Set();
  /* extra diensten ingeklapt tonen; open bij nieuw toevoegen of na "Wijzigen" */
  const dicht=new Set((k.opdrachten||[]).map(o=>o.id));
  let hosp=(k.hosp||[]).map(x=>({...x}));
  const hospDraw=()=>{const t=$("#owHospTop");if(t)t.innerHTML=hospBlok({...k,hosp},{leegKnop:false})};
  $("#owHospTop").addEventListener("click",async e=>{const b=e.target.closest("[data-hosp-af]");if(!b)return;e.preventDefault();const ix=+b.dataset.hospAf.split(":")[1];if(!hosp[ix])return;
    hosp[ix].af=iso(today());hospDraw();try{const cur=state.klanten.find(x=>x.id===k.id)||k;await save("klanten",k.id,{...strip(cur),hosp:hosp.map(x=>({...x}))});toast("Afgevinkt als besproken · komt niet meer bovenaan te staan")}catch(er){err(er)}});
  let mF=Number(k.frequentie)||4,mD=Number(k.duur)||30;
  /* aantallen uit de telling (offerte/rekentool) overnemen als de opdracht nog geen eigen aantallen heeft */
  const uitTelling=()=>{const t=k.ramenTelling;if(!t||!Array.isArray(t.floors))return null;const f=[0,1,2,3].map(i=>Number(t.floors[i])||0);return f.some(n=>n)?normR({f}):null};
  const heeftAantallen=q=>q&&(q.f||[]).some(n=>Number(n)>0);
  let main={dienst:k.dienst||"Glasbewassing",prijs:k.prijs??"",ramen:heeftAantallen(k.ramenRegel)?normR(JSON.parse(JSON.stringify(k.ramenRegel))):(/glas|ramen/i.test(k.dienst||"Glasbewassing")?uitTelling():null)};
  /* glasbewassing per verdieping: prijs en tijd volgens de tarieven van de rekentool */
  const FL=["Begane grond","1e verdieping","2e verdieping","3e verdieping"];
  const calcR=(r,isMain)=>{const q=r.ramen;if(!q)return null;try{const w=isMain?mF:Number(r.frequentie)||52,b=ramenBerekening(normR(q),w,null);
      return {...b,inc:b.ex*1.21,prijs:r2(incl?b.ex*1.21:b.ex),w}}catch(e){console.error(e);return null}};
  const fqSel=(di,key,val,leeg)=>`<select data-i="${di}" data-rk="${key}"><option value="">${leeg}</option>${freqOpts(val).map(w=>`<option value="${w}" ${String(val)===String(w)?"selected":""}>${esc(freqLabel(w))}</option>`).join("")}</select>`;
  const calcHtml=(r,i,isMain)=>{const q=normR(r.ramen);r.ramen=q;const c=calcR(r,isMain)||{c:{min:0,kozMin:0,start:0},rows:[],count:0,min:0,glas:0,kozP:0,ex:0,inc:0};const di=isMain?"m":i;
    if(!editR.has(di)&&q.f.some(n=>n))return isMain?`<div class="ow-dh ow-dmain"><span class="mono">1</span><div class="ow-dm"><b>${esc(r.dienst||"Glasbewassing")}</b></div><span class="mono ow-dp">${eur(r.prijs)}</span><button type="button" class="small" data-redit="m">${I.pencil}Wijzigen</button></div>`:sumHtml(q,c,di,isMain);
    return `<div class="ow-calc" data-calc="${di}">${q.f.some(n=>n)?`<div style="display:flex;justify-content:flex-end"><button type="button" class="small" data-rdone="${di}">${I.check}Klaar met wijzigen</button></div>`:""}
      <label>Werkomschrijving<textarea data-i="${di}" data-rk="oms" style="min-height:56px" placeholder="Bijv. wassen ramen incl. kozijnen">${esc(q.oms||"")}</textarea></label>
      <p class="ow-note">Prijs en tijdsduur worden per verdieping berekend uit je tarieven (prijs en seconden per raam). Pas Overschrijvende prijs of tijdsduur alleen aan als je er bewust van wilt afwijken. Berekenen rekent alles opnieuw uit met de ingevoerde aantallen. Afspraken die al ingepland zijn veranderen niet.</p>
      ${q.f.some(n=>n)?`<div class="ow-berbar"><span class="subt">Prijs en tijdsduur van alle verdiepingen berekenen met de ingevoerde aantallen en je tarieven.</span><button type="button" class="small primary" data-ber="${di}">${I.calculator}Berekenen</button></div>`:""}
      <div class="ow-floors">${FL.map((n,j)=>{const cnt=Number(q.f[j])||0,rw=c.rows.find(x=>x.i===j),kr=c.krows.find(x=>x.i===j);return `<div class="ow-flb${cnt?" ow-on":""}"><div class="ow-fl"><span>${n}</span><div class="ow-step"><button type="button" data-st="${di}:${j}:-1" aria-label="Min">−</button><input data-i="${di}" data-rk="f${j}" type="number" min="0" inputmode="numeric" value="${cnt}" aria-label="${n}"><span>st</span><button type="button" data-st="${di}:${j}:1" aria-label="Plus">+</button></div></div>
        ${cnt?`<div class="ow-sub"><label>Frequentie${fqSel(di,"fq"+j,q.fq[j],"Zelfde als opdracht")}</label><label>Aanboddatum<input data-i="${di}" data-rk="vol${j}" type="date" value="${esc(q.vol[j]||"")}" title="Leeg = bij de volgende beurt"></label>
          <label><span class="ow-lt">Prijs <small>· overschrijven</small></span><span class="ow-in"><i>€</i><input data-i="${di}" data-rk="op${j}" type="number" step="0.01" min="0" value="${esc(has0(q.op[j])?q.op[j]:rw?rw.p.toFixed(2):"")}" placeholder="${rw?esc(rw.calcP.toFixed(2)):"0,00"}"><em>excl.</em></span></label><label><span class="ow-lt">Tijdsduur <small>· overschrijven</small></span><span class="ow-in"><input data-i="${di}" data-rk="od${j}" type="number" step="1" min="0" value="${esc(has0(q.od[j])?q.od[j]:rw?Math.max(1,Math.ceil(rw.min-1e-9)):"")}" placeholder="${rw?rw.calcMin:0}"><em>min</em></span></label></div>
          <div class="ow-fx">${rw?`<p class="ow-calcd">${I.calculator}<span>${cnt} × ${eur(rw.pp)}<i>·</i>${cnt} × ${rw.sec} sec = ${(cnt*rw.sec/60).toLocaleString("nl-NL",{maximumFractionDigits:1})} min</span>${rw.ovP||rw.ovD?"<b>eigen waarde</b>":""}</p>`:"<span></span>"}
            <div class="ow-fxa">${q.vol[j]?`<button type="button" class="linkbtn ow-sync" data-sync="${di}:${j}" title="Aanboddatum ${esc(fmtD(q.vol[j]))} voor alle verdiepingen gebruiken">${I.planning}Datum voor alle verdiepingen</button>`:""}<button type="button" class="small ow-ber" data-ber="${di}:${j}" title="Berekent prijs en tijd van alle verdiepingen van deze dienst">${I.calculator}Berekenen</button></div></div>
`:""}</div>`}).join("")}</div>
      <div class="ow-res">${resHtml(c,q)}</div>
      <div class="ow-over"><div class="ow-overh"><b>Alles overschrijven</b><span>Geldt voor de hele glasbewassing en gaat voor de prijzen per verdieping. Leeg = berekend.</span></div>
        <div class="ow-overg">
          <label>Starttarief<span class="ow-in"><i>€</i><input data-i="${di}" data-rk="start" type="number" step="0.01" min="0" value="${esc(q.start??"")}" placeholder="${esc((c.c.start||0).toFixed(2))}"><em>excl.</em></span></label>
          <label>Prijs glasbewassing<span class="ow-in"><i>€</i><input data-i="${di}" data-rk="tp" type="number" step="0.01" min="0" value="${esc(q.tp??"")}" placeholder="${esc((c.glas||0).toFixed(2))}"><em>excl.</em></span></label>
          <label>Tijdsduur<span class="ow-in"><i>${I.clock}</i><input data-i="${di}" data-rk="td" type="number" step="1" min="0" value="${esc(q.td??"")}" placeholder="${esc(String(Math.ceil(c.rows.reduce((a,r)=>a+r.min,0))||0))}"><em>min</em></span></label>
        </div>${q.tp!==""||q.td!==""||q.start!==""?`<button type="button" class="linkbtn" data-ovclr="${di}">Overschrijvingen wissen</button>`:""}</div></div>`};
  /* overzicht van de ramen per verdieping (zoals na opslaan), met potlood om te wijzigen */
  const sumHtml=(q,c,di,isMain)=>{const base=isMain?mF:null,has=v=>v!==""&&v!=null;
    return `<div class="ow-calc ow-sum" data-calc="${di}"><div class="ow-sumh"><b>Ramen per verdieping</b><button type="button" class="small" data-redit="${di}">${I.pencil}Wijzigen</button></div>
      ${q.oms?`<p class="ow-oms">${esc(q.oms)}</p>`:""}
      <div class="ow-fls">${q.f.map((n,j)=>{if(!n)return"";const rw=c.rows.find(x=>x.i===j);const fq=q.fq[j]?freqLabel(q.fq[j]):(base?freqLabel(base):"Zelfde als opdracht");
        return `<div class="ow-flc">${flIcon(j)}
          <div class="ow-flm"><b>${FLN[j]}</b><span>${n} ${n===1?"raam":"ramen"}${rw?` · ${rw.sec} sec per raam`:""}</span><div class="ow-tags"><span class="ow-tag">${I.planning}${esc(fq)}</span><span class="ow-tag${q.vol[j]?"":" muted"}">${I.clock}${q.vol[j]?"vanaf "+esc(fmtL(q.vol[j])):"volgende beurt"}</span></div></div>
          <div class="ow-flp"><b>${rw?eur(rw.p):"—"}</b><span>${rw?(Math.round(rw.min*10)/10).toLocaleString("nl-NL"):0} min</span><em class="${c.totOver||has(q.op[j])||has(q.od[j])?"ov":""}">${c.totOver||has(q.op[j])||has(q.od[j])?"eigen prijs":"berekend"}</em></div></div>`}).join("")}</div>
      <div class="ow-res">${c.start?`<div class="ow-kv"><span>Starttarief</span><b>${eur(c.start)}</b></div>`:""}${c.totOver?`<div class="ow-kv"><span>Overschrijvende prijs glasbewassing</span><b>${eur(c.glas)}</b></div>`:""}<div class="ow-kv tot"><span>Totaal glasbewassing · ${c.count} ramen · ${c.min} min</span><b>${eur(c.ex)} excl. · ${eur(c.ex*1.21)} incl.</b></div></div></div>`};
  const resHtml=(c,q)=>{const vari=ramenVariabel(q);
    return `${c.rows.map(r=>`<div class="ow-kv"><span>${r.naam} · ${r.n} st${q.fq[r.i]?" · "+esc(freqLabel(q.fq[r.i]).toLowerCase()):""}</span><b>${eur(r.p)} · ${Math.round(r.min)} min</b></div>`).join("")}
      ${c.krows.map(r=>`<div class="ow-kv"><span>Kozijnen ${r.naam.toLowerCase()}${q.kfq[r.i]?" · "+esc(freqLabel(q.kfq[r.i]).toLowerCase()):""}</span><b>${eur(r.p)} · ${Math.round(r.min)} min</b></div>`).join("")}
      ${c.minK?`<div class="ow-kv"><span>Minimumprijs kozijnreiniging</span><b>${eur(c.kozP)}</b></div>`:""}${c.start?`<div class="ow-kv"><span>Starttarief</span><b>${eur(c.start)}</b></div>`:""}
      <div class="ow-kv tot"><span>${vari?"Beurt met alles":"Prijs per keer"} · ${c.count} ramen · ${c.min} min</span><b>${eur(c.ex)} excl. · ${eur(c.ex*1.21)} incl.</b></div>
      ${vari?'<p class="subt" style="margin:4px 0 0;font-size:12.5px">Onderdelen met een eigen frequentie gaan alleen mee als ze aan de beurt zijn; de factuur rekent dan alleen die delen.</p>':""}`};
  /* ritme volgt de kortste frequentie van de verdiepingen; tijdsduur volgt de berekening (of de gemeten tijd) */
  const ritmeUitRamen=()=>{const q=main.ramen;if(!q)return 0;const ws=q.f.map((n,i)=>n&&Number(q.fq[i])).filter(Boolean),leeg=q.f.some((n,i)=>n&&!q.fq[i]);return ws.length?Math.min(...ws,...(leeg?[mF]:[])):0};
  const syncRitme=()=>{const w=ritmeUitRamen();if(w)mF=w;if(main.ramen&&!(k.tijden||[]).length){const c=calcR(main,true);if(c&&c.min)mD=Math.max(5,Math.ceil(c.min/5)*5)}};
  const isGlas=n=>/glas|ramen/i.test(String(n||""));
  const dichtHtml=(r,i)=>{const its=(r.items||[]).filter(x=>Number(x.aantal)>0);
    return `<div class="ow-line ow-dicht"><div class="ow-dh"><span class="mono">${i+2}</span><div class="ow-dm"><b>${esc(r.dienst||"Dienst")}</b>${r.actief===false?"<small><em>niet actief</em></small>":""}</div><span class="mono ow-dp">${eur(r.prijs)}</span>
      <button type="button" class="small" data-lopen="${i}">${I.pencil}Wijzigen</button><button type="button" class="iconbtn sm" data-rm="${i}" aria-label="Regel verwijderen">${I.x}</button></div></div>`};
  const lineHtml=(r,i,isMain)=>!isMain&&r.id&&dicht.has(r.id)?dichtHtml(r,i):`<div class="ow-line${isMain?" main":""}">
      ${isMain&&r.ramen?"":`      <div class="ow-lh"><span class="mono">${isMain?1:i+2}</span><input data-i="${isMain?"m":i}" data-k="dienst" value="${esc(r.dienst)}" placeholder="Dienst" aria-label="Dienst">${isMain?"":`<button type="button" class="small ghost" data-rm="${i}" aria-label="Regel verwijderen">${I.x}</button>`}</div>
      <div class="ow-lg">
        <label>Prijs per keer (€ ${btwL})<input data-i="${isMain?"m":i}" data-k="prijs" type="number" step="0.01" min="0" value="${esc(r.prijs)}">${isMain?'<small class="help ow-tsl" id="owTsl"></small>':""}</label>
        ${isMain&&r.ramen?`<label>Ritme planning<input value="${esc(freqLabel(mF))}${ritmeUitRamen()?" (kortste frequentie)":""}" disabled></label><label>Tijdsduur per beurt<input value="${mD} min${(k.tijden||[]).length?" (gemeten)":" (berekend)"}" disabled></label>`
          :isMain?`<label>Hoe vaak (ritme planning)<select id="ow-freq">${freqO(mF).map(w=>`<option value="${w}" ${w===mF?"selected":""}>${esc(freqLabel(w))}</option>`).join("")}</select></label><label>Tijdsduur per beurt<select id="ow-duur">${[...new Set([5,10,15,20,25,30,35,40,45,50,55,60,75,90,120,150,180,240,mD])].sort((a,b)=>a-b).map(m=>`<option value="${m}" ${m===mD?"selected":""}>${m<60?m+" min":(m/60).toLocaleString("nl-NL")+" uur"}</option>`).join("")}</select>${(k.tijden||[]).length?`<small class="help">Gemeten gemiddeld ${gemTijd(k)} min</small>`:""}</label>`
          :r.items?`<div class="ow-kv" style="grid-column:1/-1"><span>Ritme</span><b>Zelfde als glasbewassing (${esc(freqLabel(mF).toLowerCase())}) <small class="subt">· per onderdeel aan te passen</small></b></div>`
          :`<label>Hoe vaak<select data-i="${i}" data-k="frequentie">${freqO(r.frequentie).map(w=>`<option value="${w}" ${w===Number(r.frequentie)?"selected":""}>${esc(freqLabel(w))}</option>`).join("")}</select></label>
            <label>Volgende keer<input data-i="${i}" data-k="volgende" type="date" value="${esc(r.volgende||"")}" title="Leeg = bij de volgende beurt"></label>`}
      </div>`}
      ${!isMain&&r.items?itemsHtml(r,i):r.ramen?calcHtml(r,i,isMain):isGlas(r.dienst)?`<button type="button" class="small" data-calcopen="${isMain?"m":i}">${I.calculator}Ramen per verdieping invullen</button>`:""}
      ${isMain?"":`<label class="check-row"><input type="checkbox" data-i="${i}" data-k="actief" ${r.actief!==false?"checked":""}>Actief · gaat mee met de beurt waarop hij aan de beurt is</label>`}
      <div class="ow-lsave"><button type="button" class="small primary" data-lsave="${isMain?"m":i}">${I.check}Opslaan</button></div>
    </div>`;
  const gOpts=r=>({freqDefault:mF||Number(k.frequentie)||8});
  const itemsHtml=(r,i)=>groepEditor(r,"x"+i,gOpts(r));
  const itemsRecalc=(i,struct)=>{const r=extra[i];if(!r||!r.items)return;r.frequentie=mF;const c=groepCalc(r),mul=incl?1+(Number(st.btw)||21)/100:1;r.prijs=r2(c.ex*mul);r.duur=Math.max(5,Math.ceil(c.sec/60/5)*5);
    const pi=$("#owLines").querySelector(`input[data-i="${i}"][data-k="prijs"]`);if(pi){pi.value=r.prijs;pi.classList.remove("flash");void pi.offsetWidth;pi.classList.add("flash")}
    if(struct)groepRedraw($("#owLines"),"x"+i,r,gOpts(r));else groepTotUpdate($("#owLines"),"x"+i,r,gOpts(r));tot()};
  const tot=()=>{const per=Number(main.prijs)||0,ex=extra.filter(o=>o.actief!==false&&o.dienst),ts=Math.max(0,Number(($o("toeslag")||{}).value)||0)/100;
    const jaar=(per*52/(mF||4)+ex.reduce((a,o)=>a+(Number(o.prijs)||0)*52/(Number(o.frequentie)||52),0))*(1+ts);
    $("#owTot").innerHTML=`<span>Per beurt (${esc(main.dienst||"hoofdopdracht")})</span><span>${eur(per)}</span>${ts?`<span>Toeslag ${r2(ts*100)}%</span><span>+ ${eur(per*ts)}</span><span class="grand">Per beurt incl. toeslag</span><span class="grand">${eur(per*(1+ts))}</span>`:""}${ex.length?`<span>Extra opdrachten, per keer${ts?" incl. toeslag":""}</span><span>${eur(ex.reduce((a,o)=>a+(Number(o.prijs)||0),0)*(1+ts))}</span>`:""}`;
    const h=$("#owTsl");if(h)h.textContent=ts?`+ ${r2(ts*100)}% toeslag = ${eur(per*(1+ts))} per keer`:""};
  const draw=()=>{syncRitme();$("#owLines").innerHTML=lineHtml(main,0,true)+extra.map((r,i)=>lineHtml(r,i,false)).join("");tot()};
  const allFotos=()=>[...tFotos.map(f=>({...f,naam:"Uit de telling",t:1})),...fotos];
  const drawFotos=()=>{const all=allFotos();
    $("#owFotos").innerHTML=all.length?all.map((f,i)=>fotoCard(f,i,!f.t)).join(""):'<p class="subt ow-fempty">Nog geen foto\'s. Upload een foto en tik de ramen aan die gewassen moeten worden. Foto\'s uit de rekentool verschijnen hier vanzelf.</p>'};
  draw();drawFotos();
  /* aanbieden / uitstellen, artikelen, bedrijfsmiddelen */
  let aanb={aanbieden:!!k.aanbieden,uitstelTot:k.uitstelTot||""},arts=(k.artikelen||[]).map(a=>({...a})),mids=[...(k.middelen||[])];
  const drawAanb=()=>{const v=volgende(k),ti=iso(today()),st=k.gepland?["ok","Ingepland op "+fmtL(k.gepland)+(k.tijd?" om "+k.tijd:"")]:aanb.uitstelTot&&aanb.uitstelTot>ti?["soon","Uitgesteld tot "+fmtL(aanb.uitstelTot)]:aanb.aanbieden||v<=today()?["late","Staat nu bij Te plannen"]:["neutral","Wordt aangeboden vanaf "+fmtL(iso(v))];
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
  {const d=$("#owDel");if(d)d.onclick=()=>kkDelOpdracht(kid,"main","opdracht")}
  $o("fact").onchange=()=>{const v=$o("fact").value,h=$("#owFactH");if(h)h.textContent=FACT_HELP[v]||"";if(v==="periodiek"&&!isPeriodiek(k)){const b=$("#owPer");if(b)b.click()}};
  {const b=$("#owPer");if(b)b.onclick=async()=>{b.disabled=true;try{await save("klanten",kid,collect());openPeriodiek(kid)}catch(er){b.disabled=false;err(er)}}}
  $("#owLines").addEventListener("change",e=>{if(e.target.id==="ow-freq"){mF=Number(e.target.value)||4;if(main.ramen){const c=calcR(main,true);if(c)main.prijs=c.prijs}draw()}else if(e.target.id==="ow-duur")mD=Number(e.target.value)||30});
  $o("toeslag").addEventListener("input",tot);
  const wis=$("#owWis");if(wis)wis.onclick=async()=>{wis.disabled=true;try{const cur=state.klanten.find(x=>x.id===kid)||k;await save("klanten",kid,{...strip(cur),gepland:"",tijd:""});toast("Toekomstige afspraak verwijderd, klant staat weer bij te plannen");wis.remove()}catch(er){wis.disabled=false;err(er)}};
  const recalc=di=>{const isM=di==="m",r=isM?main:extra[+di],c=calcR(r,isM),box=$("#owLines").querySelector(`[data-calc="${di}"]`);if(!c||!box)return;
    r.prijs=c.prijs;box.querySelector(".ow-res").innerHTML=resHtml(c,r.ramen);
    const pi=$("#owLines").querySelector(`input[data-i="${di}"][data-k="prijs"]`);if(pi){pi.value=c.prijs;pi.classList.remove("flash");void pi.offsetWidth;pi.classList.add("flash")}
    if(isM&&!(k.tijden||[]).length&&c.min){mD=Math.max(5,Math.ceil(c.min/5)*5);const sd=$o("duur");if(sd){const m=String(mD);if(![...sd.options].some(o=>o.value===m))sd.insertAdjacentHTML("beforeend",`<option value="${m}">${m} min</option>`);sd.value=m}}
    if(!isM)r.duur=Math.max(5,Math.ceil(c.min/5)*5);tot()};
  $("#owLines").addEventListener("input",e=>{const el=e.target,di=el.dataset.i,rk=el.dataset.rk;if(di!=null&&rk){const r=di==="m"?main:extra[+di];
      const q=r.ramen,m=rk.match(/^(f|fq|vol|op|od|kf|kfq|kvol|kop|kod)(\d)$/);
      if(m){const [,key,jj]=m;if(key==="kf"){q.kf[+jj]=el.checked;recalc(di);draw();return}q[key][+jj]=key==="f"?Math.max(0,Number(el.value)||0):el.value;if(key==="vol"||key==="fq"){recalc(di);draw();return}}
      else q[rk]=el.value;
      if(rk!=="oms")recalc(di);return}});
  $("#owLines").addEventListener("change",e=>{const el=e.target,rk=el.dataset.rk;if(rk&&/^f\d$/.test(rk)){recalc(el.dataset.i);setTimeout(draw,0)}});
  $("#owLines").addEventListener("click",e=>{const st=e.target.closest("[data-st]");if(st){const [di,j,d]=st.dataset.st.split(":");const r=di==="m"?main:extra[+di];const was=Number(r.ramen.f[+j])||0;r.ramen.f[+j]=Math.max(0,was+Number(d));
      const inp=$("#owLines").querySelector(`input[data-i="${di}"][data-rk="f${j}"]`);if(inp)inp.value=r.ramen.f[+j];recalc(di);if(!was!==!r.ramen.f[+j])draw();return}
    const be=e.target.closest("[data-ber]");if(be){const di=be.dataset.ber.split(":")[0];const isM=di==="m",r=isM?main:extra[+di],q=r.ramen;
      const w=isM?mF:Number(r.frequentie)||52;const leeg={...q,op:["","","",""],od:["","","",""],tp:"",td:""};const b=ramenBerekening(leeg,w,null);
      q.f.forEach((n,j)=>{q.op[j]="";q.od[j]="";if(!n)return;if(!q.fq[j])q.fq[j]=String(w);if(!q.vol[j])q.vol[j]=k.gepland||iso(today())});
      recalc(di);draw();return}
    const sy=e.target.closest("[data-sync]");if(sy){const [di,j]=sy.dataset.sync.split(":");const q=(di==="m"?main:extra[+di]).ramen,v=q.vol[+j];q.f.forEach((n,i)=>{if(n){q.vol[i]=v;if(q.kf[i]&&q.kfq[i])q.kvol[i]=v}});draw();toast("Aanboddatum "+fmtD(v)+" voor alle verdiepingen");return}
    const oc=e.target.closest("[data-ovclr]");if(oc){const di=oc.dataset.ovclr,q=(di==="m"?main:extra[+di]).ramen;q.tp="";q.td="";q.start="";recalc(di);draw();return}
    const re=e.target.closest("[data-redit]");if(re){editR.add(re.dataset.redit);draw();return}
    const rd=e.target.closest("[data-rdone]");if(rd){editR.delete(rd.dataset.rdone);draw();return}
    const co=e.target.closest("[data-calcopen]");if(co){const di=co.dataset.calcopen,r=di==="m"?main:extra[+di];r.ramen=(di==="m"&&uitTelling())||normR({});editR.add(di);draw();return}});
  $("#owLines").addEventListener("input",e=>{const el=e.target,i=el.dataset.i,key=el.dataset.k;if(i==null||!key)return;const tgt=i==="m"?main:extra[+i];
    tgt[key]=el.type==="checkbox"?el.checked:key==="prijs"||key==="frequentie"?(el.value===""?"":Number(el.value)):el.value;tot()});
  $("#owLines").addEventListener("change",e=>{if(e.target.dataset.k==="actief"){extra[+e.target.dataset.i].actief=e.target.checked;tot()}
    if(e.target.dataset.k==="frequentie"&&e.target.dataset.i!=="m"){const r=extra[+e.target.dataset.i];if(r&&r.items)groepRedraw($("#owLines"),"x"+e.target.dataset.i,r,gOpts(r))}});
  $("#owLines").addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(b){extra.splice(+b.dataset.rm,1);draw()}});
  groepBind($("#owLines"),key=>extra[+key.slice(1)],(key,struct)=>itemsRecalc(+key.slice(1),struct));
  const addLine=(dienst,prijs)=>{extra.push({id:newId("o"),dienst,prijs,frequentie:52,duur:30,volgende:"",actief:true});draw();const l=$("#owLines").querySelectorAll('input[data-k="dienst"]');const last=l[l.length-1];if(last){last.scrollIntoView({block:"center",behavior:"smooth"});if(!dienst)last.focus()}};
  const leegR=()=>uitTelling()||normR({});
  form.querySelectorAll("[data-dn]").forEach(b=>b.onclick=()=>{const d=diensten[+b.dataset.dn];if(!d.glas&&!(heeftGlas(k)||isGlas(main.dienst))){toast(GLAS_REGEL+" Maak eerst een offerte met glasbewassing.");return}
    if(d.items&&d.items.length){extra.push({id:newId("o"),dienst:d.naam,groep:d.groep,items:d.items.map(it=>({...it,aantal:0})),prijs:0,frequentie:mF||8,duur:d.duur||30,volgende:"",actief:true});draw();const l=$("#owLines").querySelectorAll(".ow-line");l[l.length-1].scrollIntoView({block:"start",behavior:"smooth"});return}
    if(d.glas||isGlas(d.naam)){if(isGlas(main.dienst)&&!main.ramen){main.ramen=leegR();editR.add("m");draw();const c=$("#owLines").querySelector('[data-calc="m"]');if(c)c.scrollIntoView({block:"start",behavior:"smooth"});return}
      if(isGlas(main.dienst)&&main.ramen&&d.naam.toLowerCase()===String(main.dienst).toLowerCase()){editR.add("m");draw();const c=$("#owLines").querySelector('[data-calc="m"]');if(c)c.scrollIntoView({block:"start",behavior:"smooth"});return}
      extra.push({id:newId("o"),dienst:d.naam,prijs:"",frequentie:mF||8,duur:30,volgende:"",actief:true,ramen:leegR()});editR.add(String(extra.length-1));draw();const l=$("#owLines").querySelectorAll(".ow-line");l[l.length-1].scrollIntoView({block:"start",behavior:"smooth"});return}
    addLine(d.naam,Number(d.prijs)||"")});
  $("#owEigen").onclick=()=>addLine("","");
  $("#owZoek").oninput=e=>{const q=e.target.value.toLowerCase();if(q){const m=form.querySelector("#owChips .chips-meer"),mb=form.querySelector("#owChips [data-meer]");if(m)m.hidden=false;if(mb)mb.hidden=true}form.querySelectorAll("#owChips [data-dn]").forEach(b=>b.hidden=!!q&&!b.textContent.toLowerCase().includes(q))};
  const ff=$("#owFoto");if(ff)ff.onchange=async e=>{const files=[...e.target.files];e.target.value="";const start=fotos.length;
    for(const file of files){try{const sz=await imgSize(file);const r=await state.assets.upload(file);fotos.push({id:r.id,naam:file.name,datum:iso(today()),w:sz.w,h:sz.h,dots:[]})}catch(er){toast("Foto "+file.name+" kon niet worden geüpload")}}
    drawFotos();if(fotos.length>start)openFotoViewer(allFotos(),tFotos.length+start,{edit:i=>i>=tFotos.length,onChange:(i,dots)=>{fotos[i-tFotos.length].dots=dots;drawFotos()}})};
  $("#owFotos").addEventListener("click",e=>{const b=e.target.closest("[data-frm]");if(b){e.preventDefault();e.stopPropagation();fotos.splice(+b.dataset.frm-tFotos.length,1);drawFotos();return}
    const c=e.target.closest("[data-fi]");if(c){e.preventDefault();openFotoViewer(allFotos(),+c.dataset.fi,{edit:i=>i>=tFotos.length,onChange:(i,dots)=>{fotos[i-tFotos.length].dots=dots;drawFotos()}})}});
  /* rekentool: prijs, frequentie en duur gaan direct naar regel 1 van de opdracht */
  let rcLive=false;
  const mountRc=()=>{const box=$("#owRc");if(!box||!box.hidden)return;
    try{if(!RC)RC=buildRamen();
      RC.setEmbed({klantId:k.id,base:k,
        form:()=>({naam:cleanName(k.naam),adres:k.adres||"",pc:k.postcode||"",plaats:k.plaats||"",tel:k.telefoon||"",email:k.email||"",notitie:$o("not").value.trim(),zakelijk:k.soort==="zakelijk"}),
        onCalc:()=>{if(!$("#owLines"))return;const c=RC.current();if(!c)return;rcLive=true;main.prijs=c.opd.prijs;if(c.extra&&c.extra.length){const gs=new Set(c.extra.map(e=>e.groep));extra=[...extra.filter(o=>!o.groep||!gs.has(o.groep)),...c.extra]}
          const sf=$o("freq"),w=String(c.opd.frequentie);if(c.opd.frequentie){if(![...sf.options].some(o=>o.value===w))sf.insertAdjacentHTML("beforeend",`<option value="${w}">${esc(freqLabel(w))}</option>`);sf.value=w}
          if(!(k.tijden||[]).length&&c.opd.duur){const sd=$o("duur"),m=String(c.opd.duur);if(![...sd.options].some(o=>o.value===m))sd.insertAdjacentHTML("beforeend",`<option value="${m}">${m} min</option>`);sd.value=m}
          draw();const pi=$("#owLines").querySelector('input[data-i="m"][data-k="prijs"]');if(pi){pi.classList.remove("flash");void pi.offsetWidth;pi.classList.add("flash")}},
        onSave:async patch=>{const d={...collect(),...patch};await save("klanten",kid,d);setTimeout(()=>openOpdrachtWerk(kid),80);return kid},
        offerte:async()=>{const {t}=await RC.telling();await save("klanten",kid,{...collect(),...(t?{ramenTelling:t}:{})});RC.reset();openOfferte({klantId:kid,metTelling:true})}},true);
      box.hidden=false;box.appendChild(RC.host);RC.sync();if(k.ramenTelling)RC.loadFor(k.id);const b=$("#owRcT");if(b)b.hidden=true}
    catch(er){console.error(er);box.hidden=false;box.innerHTML='<p class="subt">De rekentool kon hier niet worden geladen.</p>'}};
  $("#owOff").onclick=()=>openOfferte({klantId:kid,metTelling:true});
  const back=()=>openKlant(kid);$("#owX").onclick=$("#owBack").onclick=back;$("#owKk").onclick=back;
  const collect=()=>{syncRitme();const cur=state.klanten.find(x=>x.id===kid)||k,actief=$o("actief").checked;
    return {...strip(cur),dienst:String(main.dienst||"").trim()||"Glasbewassing",prijs:r2(Number(main.prijs)||0),ramenRegel:main.ramen||null,frequentie:mF||4,duur:mD||30,ronde:$o("ronde").value.trim(),contactPlanning:$o("contact").value,eersteKeer:$o("eerste").value==="ja",toeslag:Number($o("toeslag").value)||0,toeslagReden:$o("toeslagr").value.trim(),verbergAantal:$o("verbA").checked,verbergFreq:$o("verbF").checked,afmeldMail:$o("afmail").checked,
      binnen:false,actief,...(actief?{}:{gepland:"",tijd:""}),akkoord:$o("akkoord").checked,incasso:$o("betaal").value==="incasso",...factModusPatch($o("fact").value,k),
      taak:$o("taak").value.trim(),hosp:hosp.map(x=>({c:x.c||"voorkeur",t:String(x.t||"").trim(),...(x.af?{af:x.af}:{}),...(x.c==="verteld"&&x.vanaf?{vanaf:x.vanaf}:{})})).filter(x=>x.t),notities:$o("not").value.trim(),bellen:$o("bellen").checked,startdatum:$o("start").value,einddatum:$o("eind").value,btwVerlegd:$o("verlegd").checked,aanbieden:cur.gepland?!!cur.aanbieden:aanb.aanbieden,uitstelTot:aanb.uitstelTot,artikelen:arts.filter(a=>String(a.naam||"").trim()).map(a=>({naam:String(a.naam).trim(),aantal:Number(a.aantal)||1,prijs:r2(Number(a.prijs)||0)})),middelen:mids,objectId:$o("obj")?$o("obj").value:cur.objectId||"",fotos,
      opdrachten:extra.filter(o=>String(o.dienst||"").trim()).map(({_nieuw,...o})=>({...o,dienst:String(o.dienst).trim(),prijs:r2(Number(o.prijs)||0),frequentie:Number(o.frequentie)||52}))}};
  $("#owLog").onclick=async()=>{const v=$o("log").value.trim();if(!v)return;const d=collect();d.log=[...(d.log||[]),{datum:iso(today()),tekst:v}];
    try{await save("klanten",kid,d);toast("Genoteerd");setTimeout(()=>openOpdrachtWerk(kid),60)}catch(er){err(er)}};
  /* opslaan per dienst: alles bewaren en in het werkblad blijven */
  $("#owLines").addEventListener("click",e=>{const o=e.target.closest("[data-lopen]");if(!o)return;const r=extra[+o.dataset.lopen];if(r&&r.id){dicht.delete(r.id);draw()}});
  $("#owLines").addEventListener("click",async e=>{const b=e.target.closest("[data-lsave]");if(!b)return;e.preventDefault();b.disabled=true;
    try{let d=collect();if(rcLive&&RC&&RC.current()){const {t}=await RC.telling();if(t)d={...d,ramenTelling:t}}await save("klanten",kid,d);
      const di=b.dataset.lsave,r=di==="m"?main:extra[+di];toast("“"+((r&&r.dienst)||"Glasbewassing")+"” opgeslagen");if(editR.has(di))editR.delete(di);if(di!=="m"&&r&&r.id)dicht.add(r.id);draw()}
    catch(er){err(er)}finally{b.disabled=false}});
  form.onsubmit=async e=>{e.preventDefault();$("#owSave").disabled=true;
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
const dotsHtml=(f,big)=>(f.dots||[]).map((d,j)=>`<span class="fdot${big?" big":""}" data-dj="${j}" style="left:${d.x*100}%;top:${d.y*100}%;background:${d.t?DOTCOL(d.t):"var(--brand,#137a8a)"}">${d.t?"":j+1}</span>`).join("");
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
const normR=q=>{q=q||{};const a=(x,d)=>[0,1,2,3].map(i=>x&&x[i]!=null?x[i]:d);
  const r={f:a(q.f,0).map(n=>Number(n)||0),fq:a(q.fq,""),vol:a(q.vol,""),op:a(q.op,""),od:a(q.od,""),kf:a(q.kf,false).map(Boolean),kfq:a(q.kfq,""),kvol:a(q.kvol,""),kop:a(q.kop,""),kod:a(q.kod,""),start:q.start??"",tp:q.tp??"",td:q.td??"",oms:q.oms||""};
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
  let glas=rows.reduce((a,r)=>a+r.p,0),minG=false,totOver=false;
  if(rows.length&&has(q.tp)){/* overschrijvende prijs voor de hele glasbewassing: verdeeld naar verhouding over de verdiepingen */
    let target=Number(q.tp)||0;if(due){const all=ramenBerekening({...q,tp:"",td:""},opdrW,null),part=rows.reduce((a,r)=>a+r.p,0);target=all.glas>0?target*part/all.glas:target}
    spread(target,"p");glas=r2(target);totOver=true}
  else if(rows.length&&!over&&glas<c.min){/* onder het minimumtarief: naar verhouding aanvullen tot het minimum, zonder melding */spread(c.min,"p");glas=c.min}
  if(rows.length&&has(q.td)){let tm=Number(q.td)||0;if(due){const all=ramenBerekening({...q,tp:"",td:""},opdrW,null),part=rows.reduce((a,r)=>a+r.min,0);const am=all.rows.reduce((a,r)=>a+r.min,0);tm=am>0?tm*part/am:tm}spread(tm,"min")}
  const kz=[];/* kozijnreiniging zit standaard bij glasbewassing */let kover=false;
  const krows=kz.map(x=>{let p=x.n*(c.koz_p||0);if(has(q.kop[x.i])){p=Number(q.kop[x.i]);kover=true}return {i:x.i,n:x.n,naam:FLN[x.i],p:r2(p),min:has(q.kod[x.i])?Number(q.kod[x.i]):x.n*(c.koz_s||0)/60,calcP:r2(x.n*(c.koz_p||0)),calcMin:Math.ceil(x.n*(c.koz_s||0)/60)}});
  let kozP=krows.reduce((a,r)=>a+r.p,0),minK=false;if(krows.length&&!kover&&kozP<(c.kozMin||0)){minK=true;kozP=c.kozMin}const kozMin=krows.reduce((a,r)=>a+r.min,0);
  const start=rows.length?(has(q.start)?Number(q.start):(c.start||0)):0,ex=r2(glas+kozP+start);
  return {rows,krows,glas:r2(glas),minG,totOver,kozP:r2(kozP),minK,kozMin,start,ex,min:Math.ceil(rows.reduce((a,r)=>a+r.min,0)+kozMin),count:tot,c};
}
/* welke delen gaan mee op deze dag, en hoe schuiven de volgende data door */
function ramenDue(k,d){const q=normR(k.ramenRegel);const ok=(fq,vol)=>!fq||!vol||vol<=d;
  return {q,due:{f:q.f.map((n,i)=>!!n&&ok(q.fq[i],q.vol[i])),k:q.f.map((n,i)=>!!n&&q.kf[i]&&ok(q.kfq[i],q.kvol[i]))}}}
function ramenDoorschuiven(q,due,d){const n={...q,vol:[...q.vol],kvol:[...q.kvol]},nx=w=>iso(addDays(parse(d),Number(w)*7));
  q.f.forEach((c,i)=>{if(!c)return;if(q.fq[i]&&due.f[i])n.vol[i]=nx(q.fq[i]);if(q.kf[i]&&q.kfq[i]&&due.k[i])n.kvol[i]=nx(q.kfq[i])});return n}

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
