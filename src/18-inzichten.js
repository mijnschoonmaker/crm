/* ---------- INZICHTEN ---------- */
function curPeriod(per,offset=0){
  const t=today();
  if(per==="maand"){const d=new Date(t.getFullYear(),t.getMonth()+offset,1);return{rg:[d,new Date(d.getFullYear(),d.getMonth()+1,0)],lbl:monthName(d.getFullYear(),d.getMonth())}}
  if(per==="kwartaal"){const q=Math.floor(t.getMonth()/3)+offset,y=t.getFullYear()+Math.floor(q/4),qq=((q%4)+4)%4;return{rg:[new Date(y,qq*3,1),new Date(y,qq*3+3,0)],lbl:"Q"+(qq+1)+" "+y}}
  const y=t.getFullYear()+offset;return{rg:[new Date(y,0,1),new Date(y,11,31)],lbl:String(y)};
}
function vInzichten(){
  const per=state.iper,P=curPeriod(per),V=curPeriod(per,-1),t=today();
  let html=`<div class="pagehead"><div><p class="kicker">Inzichten</p><h1 class="xl">Hoe gaat het met je business?</h1></div></div>
  <div class="toolbar" style="justify-content:space-between"><div class="seg brand">${[["geld","Geld",I.euro],["werk","Werk",I.timer],["klanten","Klanten",I.klanten]].map(([v,l,ic])=>`<button type="button" data-act="itab" data-v="${v}" aria-pressed="${state.itab===v}">${ic}${l}</button>`).join("")}</div>
    <div class="seg brand">${[["maand","Maand"],["kwartaal","Kwartaal"],["jaar","Jaar"]].map(([v,l])=>`<button type="button" data-act="iper" data-v="${v}" aria-pressed="${per===v}">${l}</button>`).join("")}</div></div>`;
  if(state.itab==="geld"){
    const F=fin(P.rg),Fv=fin(V.rg),Y=fin(curPeriod("jaar").rg);
    const delta=Fv.omzet?Math.round((F.omzet-Fv.omzet)/Math.abs(Fv.omzet)*100):null;
    const open=facturen().filter(f=>["Openstaand","Achterstallig"].includes(fStatus(f)[1])),late=open.filter(f=>fStatus(f)[1]==="Achterstallig");
    const paid=facturen().filter(f=>f.status==="betaald"&&f.betaaldOp),term=paid.length?Math.round(paid.reduce((a,f)=>a+(parse(f.betaaldOp)-parse(f.datum))/DAY,0)/paid.length):null;
    const betaaldP=F.fs.filter(f=>f.status==="betaald").reduce((a,f)=>a+totals(f).inc,0);
    const months=[...Array(12)].map((_,i)=>{const d=new Date(t.getFullYear(),t.getMonth()-11+i,1);return{l:d.toLocaleDateString("nl-NL",{month:"short"}).replace(".",""),...fin([d,new Date(d.getFullYear(),d.getMonth()+1,0)])}});
    html+=`<div class="hero-card"><div><span class="eyebrow">Omzet · ${esc(P.lbl)} <span style="text-transform:none;letter-spacing:0;font-weight:600">· ex btw</span></span><b class="oc-big" style="font-size:56px">${eur0(F.omzet)}</b>
        <span class="oc-sub">${delta==null?"vs "+esc(V.lbl):`<b style="color:${delta>=0?"var(--ok)":"var(--late)"}">${delta>=0?"+":""}${delta}%</b> vs ${esc(V.lbl)}`}</span>
        <p class="subt" style="margin:14px 0 0;font-size:14px">Kosten en winst houd je bij in SnelStart.</p></div>
      <div class="hc-side"><div class="stat"><span class="eyebrow">Facturen</span><b>${F.fs.length}</b><small>in ${esc(P.lbl)}</small></div><div class="stat"><span class="eyebrow">Betaald</span><b>${eur0(betaaldP)}</b><small>incl btw</small></div></div></div>
    <div class="stats"><div class="stat"><span class="eyebrow">${I.clock}Openstaand</span><b>${eur0(open.reduce((a,f)=>a+totals(f).inc,0))}</b><small>${plural(open.length,"factuur","facturen")} · incl btw</small></div>
      <div class="stat"><span class="eyebrow">${I.alert}Te laat</span><b>${eur0(late.reduce((a,f)=>a+totals(f).inc,0))}</b><small>${plural(late.length,"factuur","facturen")} over tijd</small></div>
      <div class="stat"><span class="eyebrow">${I.receipt}Betaaltermijn</span><b>${term==null?"–":term+" dg"}</b><small>gemiddeld tussen factuur en betaling</small></div>
      <div class="stat"><span class="eyebrow">${I.euro}Omzet ${t.getFullYear()}</span><b>${eur0(Y.omzet)}</b><small>ex btw, tot vandaag</small></div></div>
    <div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">Omzet per maand</h3><p class="subt" style="margin:2px 0 0">Laatste 12 maanden · ex btw</p></div>${state.dl?`<button type="button" data-act="rapport">${I.dl}Rapport (PDF)</button>`:""}</div>
      ${barChart([{n:"Omzet",c:"var(--brand)",v:months.map(m=>m.omzet)}],months.map(m=>m.l),{label:"Omzet laatste 12 maanden",h:260})}</div>`;
  }else if(state.itab==="werk"){
    const bs=state.beurten.filter(b=>inRange(b.datum,P.rg)),bv=state.beurten.filter(b=>inRange(b.datum,V.rg));
    const kd=id=>state.klanten.find(k=>k.id===id);const mins=bs.reduce((a,b)=>a+(Number(b.duur)||duur(kd(b.klantId)||{})),0),om=bs.reduce((a,b)=>a+exAmt(b.bedrag),0);
    const per_d={};bs.forEach(b=>{const k=b.dienst||(kd(b.klantId)||{}).dienst||"Glasbewassing";per_d[k]=(per_d[k]||0)+exAmt(b.bedrag)});const dk=Object.keys(per_d).sort((a,b)=>per_d[b]-per_d[a]),dmx=Math.max(1,...dk.map(k=>per_d[k]));
    const wdc=[0,0,0,0,0,0,0];bs.forEach(b=>{wdc[(parse(b.datum).getDay()+6)%7]+=1});const wmx=Math.max(1,...wdc);
    const ach=overdue().length;
    html+=`<div class="stats"><div class="stat"><span class="eyebrow">Beurten</span><b>${bs.length}</b><small>${bv.length?((bs.length>=bv.length?"+":"")+(bs.length-bv.length)+" vs "+esc(V.lbl)):esc(P.lbl)}</small></div>
      <div class="stat"><span class="eyebrow">Uren</span><b>${uren(mins)}</b><small>op basis van duur per job</small></div>
      <div class="stat"><span class="eyebrow">Per uur</span><b>${mins?eur0(om/(mins/60)):"–"}</b><small>omzet ex btw per gewerkt uur</small></div>
      <div class="stat late"><span class="eyebrow">Achterstallig</span><b>${ach}</b><small>klanten over hun interval</small></div></div>
    <div class="panels"><div class="panel"><h3>Omzet per dienst</h3>${dk.length?dk.map(k=>`<div class="hbar" style="--h:${hue(k)}"><span>${esc(k)}</span><div class="b"><i style="width:${per_d[k]/dmx*100}%"></i></div><span class="amt">${eur0(per_d[k])}</span></div>`).join(""):'<p class="subt" style="margin:0">Nog geen afgemelde beurten in deze periode.</p>'}</div>
      <div class="panel"><h3>Drukste dagen</h3>${["ma","di","wo","do","vr","za","zo"].map((l,i)=>`<div class="hbar" style="--h:190"><span>${l}</span><div class="b"><i style="width:${wdc[i]/wmx*100}%"></i></div><span class="amt">${wdc[i]}</span></div>`).join("")}</div></div>`;
  }else{
    const ak=actief(),nieuw=state.klanten.filter(k=>inRange(k.aangemaakt,P.rg)),inact=state.klanten.filter(k=>k.actief===false);
    const jaar=ak.reduce((a,k)=>a+(Number(k.prijs)||0)*365/freqDays(k),0);
    const rd={};ak.forEach(k=>{const r=k.ronde||"Zonder ronde";rd[r]=(rd[r]||0)+(Number(k.prijs)||0)*365/freqDays(k)});const rk=Object.keys(rd).sort((a,b)=>rd[b]-rd[a]),rmx=Math.max(1,...rk.map(r=>rd[r]));
    const top=state.klanten.map(k=>({k,s:echteFacturen().filter(f=>f.klantId===k.id).reduce((a,f)=>a+totals(f).ex,0)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,6);
    const zak=ak.filter(k=>k.soort==="zakelijk").length;
    html+=`<div class="stats"><div class="stat"><span class="eyebrow">Actief</span><b>${ak.length}</b><small>${zak} zakelijk · ${ak.length-zak} particulier</small></div>
      <div class="stat"><span class="eyebrow">Nieuw</span><b>${nieuw.length}</b><small>in ${esc(P.lbl)}</small></div>
      <div class="stat"><span class="eyebrow">Verwacht per jaar</span><b>${eur0(jaar)}</b><small>uit vaste klanten</small></div>
      <div class="stat"><span class="eyebrow">Inactief</span><b>${inact.length}</b><small>gepauzeerd of opgezegd</small></div></div>
    <div class="panels"><div class="panel"><h3>Jaaromzet per ronde</h3>${rk.length?rk.map(r=>`<div class="hbar" style="--h:${hue(r)}"><span>${esc(r)}</span><div class="b"><i style="width:${rd[r]/rmx*100}%"></i></div><span class="amt">${eur0(rd[r])}</span></div>`).join(""):'<p class="subt" style="margin:0">Nog geen klanten.</p>'}</div>
      <div class="panel"><h3>Beste klanten</h3>${top.length?`<table class="minitable">${top.map(x=>`<tr class="click" data-act="klant" data-id="${esc(x.k.id)}" style="cursor:pointer"><td><b>${esc(cleanName(x.k.naam))}</b></td><td class="r">${eur(x.s)}</td></tr>`).join("")}</table><p class="subt" style="font-size:12px;margin:8px 0 0">Gefactureerd ex btw, alle tijd</p>`:'<p class="subt" style="margin:0">Nog geen facturen.</p>'}</div></div>`;
  }
  return html;
}
