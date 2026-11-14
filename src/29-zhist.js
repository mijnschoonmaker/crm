/* ---------- Historiekaart: verslag van één gedaan bezoek (geopend vanuit Historie bezoeken op de klantkaart) ----------
   Alles op deze kaart gaat over dát bezoek: wat er gedaan is, tegen welke prijs, hoe lang, de factuur en de berichten eromheen.
   Geen actieknoppen of huidige opdrachtinstellingen; met ‹ › blader je door de bezoeken van deze klant. */
function openBezoekHist(bid){
  const b=state.beurten.find(x=>x.id===bid);if(!b)return;
  const k=state.klanten.find(x=>x.id===b.klantId);if(!k){openBeurtInfo(bid);return}
  const d=parse(b.datum);
  const lijst=state.beurten.filter(x=>x.klantId===b.klantId).sort((x,y)=>String(x.datum+(x.tijd||"")).localeCompare(String(y.datum+(y.tijd||""))));
  const ix=lijst.findIndex(x=>x.id===b.id),vorig=ix>0?lijst[ix-1]:null,volg=ix>=0&&ix<lijst.length-1?lijst[ix+1]:null;
  const f=b.gefactureerd&&!["nvt","periodiek"].includes(b.gefactureerd)?state.facturen.find(x=>x.id===b.gefactureerd):null;
  const fs=f?fStatus(f):null,ex=S().toonEx||!S().incl;
  const om=b.op?new Date(b.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):"";
  const mm=m=>{m=Math.round(Number(m)||0);return m>=60?Math.floor(m/60)+"u"+String(m%60).padStart(2,"0"):m+" min"};
  const gepland=Number(b.geplandDuur)||duur(k),gemeten=Number(b.duur)||0;
  const op=beurtOpbouw(b);
  const tile=(t,v,s)=>`<div class="kkh-t"><span>${t}</span><b>${v}</b><small>${s||""}</small></div>`;
  const dagKort=["zo","ma","di","wo","do","vr","za"][d.getDay()]+" "+d.getDate()+" "+["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][d.getMonth()];
  /* wat er gedaan is: de regels van de factuur (prijzen van toen), anders de dienst en extra's van het bezoek */
  let gedaan="";
  if(f&&(f.regels||[]).length){const inc=f.incl??S().incl;
    gedaan=f.regels.map(r=>{const p=Number(r.prijs)||0,a=Number(r.aantal)||0,bt=rBtw(f,r),e=(inc?p/(1+bt/100):p)*a,v=ex?e:e*(1+bt/100);
      return `<div><span>${esc(omsZonderDatum?omsZonderDatum(r.omschrijving||""):r.omschrijving||"")}${a&&a!==1?` <small>${a.toLocaleString("nl-NL")} ×</small>`:""}</span><b>${eur(v)}</b></div>`}).join("");
  }else{gedaan=`<div><span>${esc(b.dienst||HD())}</span><b>${eur(beurtVerdiend(b))}</b></div>`+(b.extra||[]).map(x=>`<div><span>${esc(x)}</span><b><small>extra</small></b></div>`).join("")}
  /* foto's die bij dit bezoek gemaakt zijn, gingen mee met de factuur */
  const fotos=f?(f.bijlagen||[]).map((x,i)=>({x,i})).filter(o=>o.x.soort==="foto"):[];
  /* berichten rond dit bezoek: van een week ervoor tot drie weken erna */
  const van=iso(addDays(d,-7)),tot=iso(addDays(d,21));
  const ber=state.berichten.filter(m=>m.klantId===b.klantId&&String(m.op).slice(0,10)>=van&&String(m.op).slice(0,10)<=tot).sort((x,y)=>String(x.op).localeCompare(String(y.op)));
  const kan=m=>(typeof KANAAL!=="undefined"&&KANAAL[m.kanaal])||m.kanaal||"Bericht";
  openDlg(`<div id="jobPanel" data-d="${esc(b.datum)}" data-k="${esc(k.id)}" class="jp jp-isaf jp-groot jp-hist">
  <div class="jp-kop jp-afgerond"><div class="jp-kr1"><span class="jp-st"><i></i>Afgerond</span><button type="button" class="jp-st jp-kk" data-act="klant" data-id="${esc(k.id)}">${I.user}Klantkaart${I.right}</button><span class="sp"></span>
    <span class="jh-nav"><button type="button" class="jp-ib" data-hist="${esc(vorig?vorig.id:"")}" ${vorig?"":"disabled"} title="Vorig bezoek" aria-label="Vorig bezoek">${I.left}</button><small>${ix+1} van ${lijst.length}</small><button type="button" class="jp-ib" data-hist="${esc(volg?volg.id:"")}" ${volg?"":"disabled"} title="Volgend bezoek" aria-label="Volgend bezoek">${I.right}</button></span>
    <button type="button" class="jp-ib" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="jp-kr2"><span class="jp-k1"><small>${esc(dagKort)}</small><b>${esc(b.tijd||om||"–")}</b></span>
      <span class="jp-k2"><b>${esc(cleanName(k.naam))}</b><em>${I.pin}${esc(jobAddr(k))}</em></span>
      <span class="jp-k3"><small>Bedrag</small><b>${eur(beurtVerdiend(b))}</b><em>${esc(bedragLbl())}${fs?" · "+esc(fs[1].toLowerCase()):""}</em></span></div></div>
  <section class="kp ow-kern jpk-pearl jpk-pearl-top"><div class="kkh-tg kk-kern">
    ${tile("Bedrag",eur(beurtVerdiend(b)),op.length?op.map((x,i)=>(i?"+ ":"")+eur(x.bedrag)+" "+esc(i===0?"bezoek":(x.oms.replace(/^extra[: ]*/i,"").slice(0,24)||"extra"))).join(" "):esc(bedragLbl()))}
    ${tile("Tijdsduur",esc(mm(gepland)),gemeten?`gemeten ${esc(mm(gemeten))}${b.gemeten?"":" (geschat)"}`:"niet gemeten")}
    ${tile("Afgemeld",esc(om||"—"),esc(b.door||b.medewerker||""))}
    ${tile("Betaling",fs?esc(fs[1]):b.gefactureerd==="periodiek"?"Periodiek":b.gefactureerd==="nvt"?"Niet nodig":"Nog niet",fs&&fs[1]==="Betaald"&&f.betaaldOp?"op "+esc(fmtL(String(f.betaaldOp).slice(0,10))):f&&f.verval&&fs&&fs[1]!=="Betaald"?"voor "+esc(fmtL(f.verval)):"")}
  </div></section>
  <div class="jp-body jpk jpk-2k">
    <div class="jpk-col">
      <section class="jpk-s"><div class="jpk-h"><b>Wat we gedaan hebben</b><small>${esc(fmtL(b.datum))}${b.door||b.medewerker?" · "+esc(b.door||b.medewerker):""}</small></div>
        <div class="jpk-kv jh-gedaan">${gedaan}</div>
        ${f?`<div class="jh-tot"><span>Totaal ${esc(bedragLbl())}</span><b>${eur(ex?totals(f).ex:totals(f).inc)}</b></div>`:""}</section>
      ${fotos.length?`<section class="jpk-s"><div class="jpk-h"><b>Foto's en bijzonderheden</b></div><div class="jh-fotos">${fotos.map(o=>`<button type="button" class="jh-foto" data-act="fotokijk" data-bron="factuur" data-id="${esc(f.id)}" data-i="${o.i}" aria-label="Foto bekijken"><img src="${BLOB}${esc(o.x.id)}" alt="" loading="lazy">${o.x.notitie?`<small>${esc(o.x.notitie)}</small>`:""}</button>`).join("")}</div></section>`:""}
    </div>
    <div class="jpk-col">
      <section class="jpk-s"><div class="jpk-h"><b>Factuur</b><span class="sp"></span>${fs?statusPill(fs[0],fs[1]):""}</div>
        ${f?`<div class="jpk-kv"><div><span>Factuurnummer</span><b>${esc(f.nummer)}</b></div><div><span>Factuurdatum</span><b>${esc(fmtL(String(f.datum||"").slice(0,10)))}</b></div><div><span>Bedrag</span><b>${eur(totals(f).inc)} <small>incl. btw</small></b></div>${f.betaaldOp?`<div><span>Betaald op</span><b>${esc(fmtL(String(f.betaaldOp).slice(0,10)))}</b></div>`:f.verval?`<div><span>Betalen voor</span><b>${esc(fmtL(f.verval))}</b></div>`:""}</div>
          <button type="button" class="jh-fbtn" data-act="factuur" data-id="${esc(f.id)}">${I.facturen}Factuur bekijken${I.right}</button>`
          :`<p class="jh-leeg">${b.gefactureerd==="periodiek"?"Dit bezoek gaat mee op de periodieke factuur.":b.gefactureerd==="nvt"?"Voor dit bezoek was geen factuur nodig.":"Voor dit bezoek is nog geen factuur gemaakt."}</p>`}</section>
      <section class="jpk-s"><div class="jpk-h"><b>Berichten rond dit bezoek</b></div>
        ${ber.length?`<div class="jh-ber">${ber.map(m=>`<div><span>${esc(fmtD(String(m.op).slice(0,10)))}${String(m.op).slice(11,16)?" · "+esc(String(m.op).slice(11,16)):""}</span><b>${esc(kan(m))}</b><em>${esc(m.onderwerp||String(m.tekst||"").split(/\n/)[0]||"")}</em></div>`).join("")}</div>`:`<p class="jh-leeg">Geen berichten in de weken rond dit bezoek.</p>`}</section>
    </div>
  </div>
  <div class="jp-foot"><button type="button" data-act="close">Sluiten</button></div>
  </div>`,{xwide:true});
}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-hist]");if(!t||!t.closest("#jobPanel.jp-hist"))return;e.preventDefault();const id=t.dataset.hist;if(id)openBezoekHist(id)});
