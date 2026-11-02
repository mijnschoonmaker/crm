/* ---------- STATISTIEKEN: meer inzicht ----------
   Werk: per klant en per plaats (omzet, tijd, € per uur, % van de omzet) en per werkdag/per week (uit de werkdag: loods tot loods).
   Geld: hoe er betaald wordt (iDEAL, incasso, overmaken, contant/pin) en hoe oud het openstaande geld is. Alleen lezen, niets wordt opgeslagen. */
const stPct=(a,t)=>t>0?Math.round(a/t*100):0;
const stUurTxt=(om,min)=>min>0?eur(om/(min/60))+"/u":"–";
function stRijen(lijst,{tot,max,key,klik,alle,meerAct}){const n=lijst.length,toon=alle?lijst:lijst.slice(0,max);
  return `<div class="st-rows">${toon.map(x=>`<div class="st-row bar st-meer-r${klik&&x.id?" click":""}"${klik&&x.id?` data-act="klant" data-id="${esc(x.id)}" role="button"`:""}><span class="st-rn">${esc(x.naam)}<small>${x.n} ${x.n===1?"beurt":"beurten"} · ${uren(x.min)} · ${stUurTxt(x.om,x.min)}</small></span><span class="st-rb"><i style="width:${tot?x.om/(lijst[0].om||1)*100:0}%;--h:${hue(x.naam)}"></i></span><b>${stE(x.om)}<small>${stPct(x.om,tot)}%</small></b></div>`).join("")}</div>${n>max?`<button type="button" class="linkbtn st-meer" data-act="${meerAct}">${alle?"Minder tonen":`Toon alle ${n}`}</button>`:""}`}
function stPerKlantPlaats(bs){
  const hk=id=>{const k=state.klanten.find(x=>x.id===id);return k&&k.hoofdKlantId&&state.klanten.some(x=>x.id===k.hoofdKlantId)?k.hoofdKlantId:id};
  const K={},Pl={};let tot=0;
  bs.forEach(b=>{const om=beurtOmzet(b),min=beurtMin(b),id=hk(b.klantId),kh=state.klanten.find(x=>x.id===id),kb=state.klanten.find(x=>x.id===b.klantId)||kh;tot+=om;
    const a=K[id]=K[id]||{id,naam:kh?cleanName(kh.naam):(b.klantNaam||"Onbekende klant"),om:0,min:0,n:0};a.om+=om;a.min+=min;a.n++;
    const pl=String((kb&&jobAddrObj(kb).plaats)||"Onbekend").trim()||"Onbekend",p=Pl[pl.toLowerCase()]=Pl[pl.toLowerCase()]||{naam:pl.charAt(0).toUpperCase()+pl.slice(1),om:0,min:0,n:0};p.om+=om;p.min+=min;p.n++});
  const kl=Object.values(K).sort((a,b)=>b.om-a.om),pl=Object.values(Pl).sort((a,b)=>b.om-a.om);
  if(!kl.length)return"";
  const bestU=kl.filter(x=>x.min>=30).sort((a,b)=>b.om/b.min-a.om/a.min)[0],bestP=pl.filter(x=>x.min>=30).sort((a,b)=>b.om/b.min-a.om/a.min)[0];
  return `<div class="st-two"><section class="st-card"><div class="st-ch"><div><h3>Per klant</h3><p>Omzet ex btw, tijd bij de klant en wat je per uur verdient${bestU?` · hoogste per uur: <b>${esc(bestU.naam)}</b> (${stUurTxt(bestU.om,bestU.min)})`:""}</p></div></div>
      ${stRijen(kl,{tot,max:8,klik:true,alle:state.stAlleKl,meerAct:"stAlleKl"})}</section>
    <section class="st-card"><div class="st-ch"><div><h3>Per plaats</h3><p>Waar je omzet vandaan komt${bestP?` · hoogste per uur: <b>${esc(bestP.naam)}</b> (${stUurTxt(bestP.om,bestP.min)})`:""}</p></div></div>
      ${stRijen(pl,{tot,max:8,alle:state.stAllePl,meerAct:"stAllePl"})}</section></div>`}
function stPerDagWeek(rg){
  if(typeof wdGet!=="function"||typeof wdCijfers!=="function")return"";
  const dagen=Object.keys(state.routes||{}).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&inRange(d,rg)&&(state.routes[d].werk||{}).start&&(state.routes[d].werk||{}).stop).sort();
  if(!dagen.length)return `<section class="st-card"><div class="st-ch"><div><h3>Per werkdag en per week</h3><p>Omzet, uren, reistijd en pauze per dag</p></div></div><p class="st-leeg">Nog geen afgeronde werkdagen in deze periode. Druk op Vandaag op <b>Start werkdag</b> en aan het eind op <b>Terug bij de loods</b>.</p></section>`;
  const C=dagen.map(d=>({d,...wdCijfers(d)})),sum=x=>C.reduce((a,c)=>a+c[x],0),gemU=sum("netto")>0?sum("omzet")/(sum("netto")/60):0;
  const wd=d=>["zo","ma","di","wo","do","vr","za"][parse(d).getDay()];
  const rij=c=>{const pu=c.netto>0?c.omzet/(c.netto/60):0,dl=gemU&&C.length>1?Math.round((pu-gemU)/gemU*100):null;
    return `<tr><td><b>${wd(c.d)} ${esc(fmtD(c.d))}</b></td><td class="r">${eur(c.omzet)}</td><td class="r">${c.n}</td><td class="r">${wdU(c.netto)}</td><td class="r">${wdU(c.fact)}</td><td class="r">${wdU(c.reis)}</td><td class="r">${wdU(c.pauze)}</td><td class="r"><b>${pu?eur(pu):"–"}</b>${dl!=null&&pu?`<small class="${dl>=0?"st-plus":"st-min"}">${dl>=0?"+":""}${dl}%</small>`:""}</td></tr>`};
  /* per week (maandag t/m zondag) */
  const W={};C.forEach(c=>{const s=parse(c.d);s.setDate(s.getDate()-((s.getDay()+6)%7));const k=iso(s);const w=W[k]=W[k]||{k,nr:weekNr(s),dagen:0,omzet:0,netto:0,fact:0,reis:0,pauze:0,n:0};w.dagen++;["omzet","netto","fact","reis","pauze","n"].forEach(x=>w[x]+=c[x])});
  const wk=Object.values(W).sort((a,b)=>a.k.localeCompare(b.k));
  const kop=`<thead><tr><th></th><th class="r">Omzet ex btw</th><th class="r">Stops</th><th class="r">Gewerkt</th><th class="r">Bij klanten</th><th class="r">Reistijd</th><th class="r">Pauze</th><th class="r">Per uur</th></tr></thead>`;
  return `<section class="st-card"><div class="st-ch"><div><h3>Per werkdag</h3><p>Loods tot loods · gewerkt = zonder pauze · per uur = omzet per gewerkt uur${gemU?` · gemiddeld <b>${eur(gemU)}</b>/u`:""}</p></div></div>
      <div class="st-tabw"><table class="st-tab">${kop}<tbody>${C.slice().reverse().map(rij).join("")}</tbody></table></div></section>
    ${wk.length>1?`<section class="st-card"><div class="st-ch"><div><h3>Per week</h3><p>Zelfde cijfers opgeteld per week</p></div></div>
      <div class="st-tabw"><table class="st-tab"><thead><tr><th></th><th class="r">Dagen</th><th class="r">Omzet ex btw</th><th class="r">Stops</th><th class="r">Gewerkt</th><th class="r">Reistijd</th><th class="r">Pauze</th><th class="r">Per uur</th></tr></thead><tbody>${wk.slice().reverse().map(w=>`<tr><td><b>Week ${w.nr}</b></td><td class="r">${w.dagen}</td><td class="r">${eur(w.omzet)}</td><td class="r">${w.n}</td><td class="r">${wdU(w.netto)}</td><td class="r">${wdU(w.reis)} <small>${stPct(w.reis,w.netto+w.pauze)}%</small></td><td class="r">${wdU(w.pauze)}</td><td class="r"><b>${w.netto>0?eur(w.omzet/(w.netto/60)):"–"}</b></td></tr>`).join("")}</tbody></table></div></section>`:""}`}
function stMeerWerk(P){const bs=state.beurten.filter(b=>!b.geannuleerd&&inRange(b.datum,P.rg));return stPerDagWeek(P.rg)+stPerKlantPlaats(bs)}
/* ---- geld binnen ---- */
const stBetaalWijze=f=>f.incasso||f.betaalwijze==="incasso"?"Automatische incasso":f.betaalwijze==="mollie"?(f.mollieMethode&&f.mollieMethode!=="ideal"?"Online ("+f.mollieMethode+")":"iDEAL-knop"):["contant","pin"].includes(f.betaalwijze)?"Contant of pin":"Overgemaakt";
function stMeerGeld(P,F){
  const fs=F.fs||[];if(!fs.length)return"";
  const tot=fs.reduce((a,f)=>a+totals(f).inc,0),bet=fs.filter(f=>f.status==="betaald"),betS=bet.reduce((a,f)=>a+totals(f).inc,0);
  const W={};bet.forEach(f=>{const w=stBetaalWijze(f),x=W[w]=W[w]||{naam:w,s:0,n:0,d:0,dn:0};x.s+=totals(f).inc;x.n++;const dd=f.betaaldOp&&f.datum?(parse(f.betaaldOp)-parse(f.datum))/DAY:null;if(dd!=null&&dd>=0){x.d+=dd;x.dn++}});
  const wl=Object.values(W).sort((a,b)=>b.s-a.s);
  const snel=bet.filter(f=>f.betaaldOp&&f.datum&&(parse(f.betaaldOp)-parse(f.datum))/DAY<=1).length;
  /* openstaand (alle facturen, niet alleen deze periode) naar leeftijd sinds de factuurdatum */
  const t=today(),open=facturen().filter(f=>["Openstaand","Achterstallig"].includes(fStatus(f)[1]));
  const B=[["0 – 14 dagen",0,14],["15 – 30 dagen",15,30],["31 – 60 dagen",31,60],["Ouder dan 60 dagen",61,1e9]].map(([naam,a,z])=>{const L=open.filter(f=>{const d=Math.floor((t-parse(f.datum))/DAY);return d>=a&&d<=z});return{naam,n:L.length,s:L.reduce((x,f)=>x+totals(f).inc,0)}});
  const openS=B.reduce((a,b)=>a+b.s,0),bmx=Math.max(1,...B.map(b=>b.s)),wmx=Math.max(1,...wl.map(w=>w.s));
  return `<div class="st-two"><section class="st-card"><div class="st-ch"><div><h3>Hoe wordt er betaald</h3><p>${esc(P.lbl)} · <b>${stPct(betS,tot)}%</b> van ${stE(tot)} is binnen (${bet.length} van ${fs.length} facturen)${snel?` · ${snel} binnen een dag betaald`:""}</p></div></div>
      ${wl.length?`<div class="st-rows">${wl.map(w=>`<div class="st-row bar st-meer-r"><span class="st-rn">${esc(w.naam)}<small>${w.n} ${w.n===1?"factuur":"facturen"}${w.dn?` · gem. ${Math.round(w.d/w.dn*10)/10} dagen`:""}</small></span><span class="st-rb"><i style="width:${w.s/wmx*100}%;--h:${hue(w.naam)}"></i></span><b>${stE(w.s)}<small>${stPct(w.s,betS)}%</small></b></div>`).join("")}</div>`:'<p class="st-leeg">Nog niets betaald in deze periode.</p>'}</section>
    <section class="st-card"><div class="st-ch"><div><h3>Openstaand naar leeftijd</h3><p>Alle openstaande facturen · ${stE(openS)} incl btw · gerekend vanaf de factuurdatum</p></div></div>
      ${open.length?`<div class="st-rows">${B.map((b,i)=>`<div class="st-row bar st-meer-r${i>=2&&b.n?" st-oud":""}"><span class="st-rn">${b.naam}<small>${b.n} ${b.n===1?"factuur":"facturen"}</small></span><span class="st-rb"><i style="width:${b.s/bmx*100}%;--h:${[150,40,20,0][i]}"></i></span><b>${stE(b.s)}<small>${stPct(b.s,openS)}%</small></b></div>`).join("")}</div>`:'<p class="st-leeg">Niets openstaand. Alles is betaald!</p>'}</section></div>`}
