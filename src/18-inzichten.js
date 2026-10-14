/* ---------- INZICHTEN ---------- */
function curPeriod(per,offset=0){
  const t=today();
  if(per==="maand"){const d=new Date(t.getFullYear(),t.getMonth()+offset,1);return{rg:[d,new Date(d.getFullYear(),d.getMonth()+1,0)],lbl:monthName(d.getFullYear(),d.getMonth())}}
  if(per==="kwartaal"){const q=Math.floor(t.getMonth()/3)+offset,y=t.getFullYear()+Math.floor(q/4),qq=((q%4)+4)%4;return{rg:[new Date(y,qq*3,1),new Date(y,qq*3+3,0)],lbl:"Q"+(qq+1)+" "+y}}
  const y=t.getFullYear()+offset;return{rg:[new Date(y,0,1),new Date(y,11,31)],lbl:String(y)};
}
/* ---------- grafiekjes in eigen stijl ---------- */
function stBars(vals,labels,{hi=-1,fmt=v=>eur0(v),h=200,gem=true}={}){const mx=Math.max(1,...vals)*1.1,pos=vals.filter(v=>v>0),avg=pos.length?pos.reduce((a,v)=>a+v,0)/pos.length:0;
  return `<div class="st-bars" style="--bh:${h}px">${gem&&avg>0?`<div class="st-avg" style="bottom:calc(26px + (var(--bh) - 26px) * ${avg/mx})"><span>gem. ${esc(fmt(avg))}</span></div>`:""}${vals.map((v,i)=>`<div class="st-col${i===hi?" hi":""}" title="${esc(labels[i])}: ${esc(fmt(v))}"><div class="st-tr"><i style="height:${v>0?Math.max(2,v/mx*100):0}%"><em>${v>0?esc(fmt(v)):""}</em></i></div><span>${esc(labels[i])}</span></div>`).join("")}</div>`}
const stDelta=(a,b,suf)=>{if(!b)return"";const d=Math.round((a-b)/Math.abs(b)*100);return `<span class="st-pill ${d>=0?"up":"down"}">${d>=0?"▲":"▼"} ${Math.abs(d)}%${suf?" "+suf:""}</span>`};
const stTile=(ic,lbl,val,sub,cls="",act="")=>`<div class="st-tile ${cls}"${act}><span class="st-ic">${ic}</span><span class="st-l">${lbl}</span><b>${val}</b><small>${sub}</small></div>`;
function vInzichten(){
  const per=state.iper,P=curPeriod(per),V=curPeriod(per,-1),t=today(),perW={maand:"maand",kwartaal:"kwartaal",jaar:"jaar"}[per];
  let html=`<div class="pagehead"><div><h1 class="xl">Statistieken</h1></div></div>
  <div class="toolbar" style="justify-content:space-between"><div class="seg brand">${[["geld","Geld",I.euro],["werk","Werk",I.timer],["klanten","Klanten",I.klanten]].map(([v,l,ic])=>`<button type="button" data-act="itab" data-v="${v}" aria-pressed="${state.itab===v}">${ic}${l}</button>`).join("")}</div>
    <div class="seg brand">${[["maand","Maand"],["kwartaal","Kwartaal"],["jaar","Jaar"]].map(([v,l])=>`<button type="button" data-act="iper" data-v="${v}" aria-pressed="${per===v}">${l}</button>`).join("")}</div></div>`;
  const kd=id=>state.klanten.find(k=>k.id===id);
  if(state.itab==="geld"){
    const F=fin(P.rg),Fv=fin(V.rg),Y=fin(curPeriod("jaar").rg),Yv=fin([new Date(t.getFullYear()-1,0,1),new Date(t.getFullYear()-1,t.getMonth(),t.getDate())]);
    const open=facturen().filter(f=>["Openstaand","Achterstallig"].includes(fStatus(f)[1])),late=open.filter(f=>fStatus(f)[1]==="Achterstallig");
    const paid=facturen().filter(f=>f.status==="betaald"&&f.betaaldOp),term=paid.length?Math.round(paid.reduce((a,f)=>a+(parse(f.betaaldOp)-parse(f.datum))/DAY,0)/paid.length):null;
    const betaaldP=F.fs.filter(f=>f.status==="betaald").reduce((a,f)=>a+totals(f).inc,0);
    const months=[...Array(12)].map((_,i)=>{const d=new Date(t.getFullYear(),t.getMonth()-11+i,1);return{l:d.toLocaleDateString("nl-NL",{month:"short"}).replace(".",""),...fin([d,new Date(d.getFullYear(),d.getMonth()+1,0)])}});
    /* nog te verdienen: ingeplande beurten in de rest van deze periode */
    const ti=iso(t),eind=iso(P.rg[1]),ingepland=actief().filter(k=>k.gepland&&k.gepland>=ti&&k.gepland<=eind).reduce((a,k)=>a+exAmt(k.prijs),0);
    const vorige=Fv.omzet,record=per==="maand"&&F.omzet>0&&F.omzet>=Math.max(...months.slice(0,11).map(m=>m.omzet));
    const doel=Math.max(vorige,1),pct=Math.min(100,Math.round(F.omzet/doel*100)),pctP=Math.min(100,Math.round((F.omzet+ingepland)/doel*100));
    const mot=record?"Beste maand van het afgelopen jaar. Top gedaan!":F.omzet>=vorige&&vorige>0?`Je zit al boven ${esc(V.lbl)}. Alles wat erbij komt is winst.`:vorige>0?`Nog ${eur0(vorige-F.omzet)} om ${esc(V.lbl)} te evenaren${ingepland?" · met wat ingepland staat haal je "+pctP+"%":""}.`:F.omzet>0?"Een mooie start. Elke factuur telt.":"Nog geen omzet in deze periode. De eerste factuur is de mooiste.";
    html+=`<section class="st-hero"><div class="st-hm"><span class="st-k">Omzet · ${esc(P.lbl)} · ex btw</span>
        <div class="st-big"><b>${eur0(F.omzet)}</b>${stDelta(F.omzet,vorige,"vs "+V.lbl)}</div>
        <p class="st-mot">${record?I.spark:""}${mot}</p>
        ${vorige>0?`<div class="st-goal st-rol"><div class="fg-weg" style="--p:${pct/100}"><div class="fg-baan"><i></i></div><span class="fg-munt">${FG_MUNT}</span><span class="st-vlag">🏁</span></div><div class="st-gl"><span><b>${pct}%</b> van ${esc(V.lbl)} (${eur0(vorige)})</span>${ingepland?`<span class="st-ing"><i></i>${eur0(ingepland)} ingepland</span>`:""}</div></div>`:""}</div>
      <div class="st-hs">${stTile(I.receipt,"Facturen",F.fs.length,"in "+esc(P.lbl))}${stTile(I.check,"Betaald",eur0(betaaldP),"incl btw","ok")}</div></section>
    <div class="st-tiles">${stTile(I.clock,"Openstaand",eur0(open.reduce((a,f)=>a+totals(f).inc,0)),plural(open.length,"factuur","facturen")+" · incl btw","",` data-act="tab" data-tab="facturen" role="button"`)}
      ${stTile(I.alert,"Te laat",eur0(late.reduce((a,f)=>a+totals(f).inc,0)),late.length?plural(late.length,"factuur","facturen")+" over tijd":"alles op tijd",late.length?"late":"ok")}
      ${stTile(I.timer,"Betaaltermijn",term==null?"–":term+" dagen","gemiddeld tot betaling",term!=null&&term<=7?"ok":"")}
      ${stTile(I.euro,"Omzet "+t.getFullYear(),eur0(Y.omzet),Yv.omzet?(Y.omzet>=Yv.omzet?"▲ ":"▼ ")+Math.abs(Math.round((Y.omzet-Yv.omzet)/Yv.omzet*100))+"% vs vorig jaar":"ex btw, tot vandaag")}</div>
    <section class="st-card"><div class="st-ch"><div><h3>Omzet per maand</h3><p>Laatste 12 maanden · ex btw · stippellijn = gemiddelde</p></div>${state.dl?`<button type="button" class="small" data-act="rapport">${I.dl}Rapport (PDF)</button>`:""}</div>
      ${stBars(months.map(m=>m.omzet),months.map(m=>m.l),{hi:11,h:230})}</section>`;
  }else if(state.itab==="werk"){
    const bs=state.beurten.filter(b=>inRange(b.datum,P.rg)),bv=state.beurten.filter(b=>inRange(b.datum,V.rg));
    const mins=bs.reduce((a,b)=>a+(Number(b.duur)||duur(kd(b.klantId)||{})),0),om=bs.reduce((a,b)=>a+exAmt(b.bedrag),0);
    const per_d={};bs.forEach(b=>{const k=b.dienst||(kd(b.klantId)||{}).dienst||"Glasbewassing";per_d[k]=(per_d[k]||0)+exAmt(b.bedrag)});const dk=Object.keys(per_d).sort((a,b)=>per_d[b]-per_d[a]),dtot=dk.reduce((a,k)=>a+per_d[k],0)||1;
    const wdc=[0,0,0,0,0,0,0];bs.forEach(b=>{wdc[(parse(b.datum).getDay()+6)%7]+=1});const top=wdc.indexOf(Math.max(...wdc));
    const dag={};state.beurten.forEach(b=>{dag[b.datum]=(dag[b.datum]||0)+exAmt(b.bedrag)});const best=Object.entries(dag).sort((a,b)=>b[1]-a[1])[0];
    const ach=overdue().length,gem=bs.length?om/bs.length:0;
    const mot=!bs.length?"Nog geen beurten afgemeld in deze periode. Op naar de eerste!":bs.length>bv.length?`${bs.length-bv.length} beurten meer dan ${esc(V.lbl)}. Lekker bezig!`:bs.length===bv.length?`Net zoveel beurten als ${esc(V.lbl)}. Stabiel!`:`${esc(V.lbl)} telde er ${bv.length}. Nog ${bv.length-bs.length} te gaan om gelijk te komen.`;
    html+=`<section class="st-hero"><div class="st-hm"><span class="st-k">Woningen gedaan · ${esc(P.lbl)}</span>
        <div class="st-big"><b>${bs.length}</b>${stDelta(bs.length,bv.length,"vs "+V.lbl)}</div>
        ${bs.length&&typeof huisjes==="function"?huisjes(bs.length,bs.length):""}
        <p class="st-mot">${mot}</p></div>
      <div class="st-hs">${stTile(I.euro,"Per uur",mins?eur0(om/(mins/60)):"–","omzet ex btw per gewerkt uur","ok")}${stTile(I.receipt,"Per beurt",gem?eur0(gem):"–","gemiddeld ex btw")}</div></section>
    <div class="st-tiles">${stTile(I.timer,"Uren",uren(mins),"op basis van duur per job")}
      ${stTile(I.euro,"Omzet uit werk",eur0(om),"afgemelde beurten ex btw")}
      ${stTile(I.spark,"Beste dag ooit",best?eur0(best[1]):"–",best?esc(fmtL(best[0])):"nog geen beurten")}
      ${stTile(I.alert,"Achterstallig",ach,ach?"klanten over hun interval":"niemand achter, netjes!",ach?"late":"ok",` data-act="tab" data-tab="planning" role="button"`)}</div>
    <div class="st-two"><section class="st-card"><div class="st-ch"><div><h3>Drukste dagen</h3><p>Afgemelde beurten per weekdag${wdc[top]?" · meestal op "+["maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag","zondag"][top]:""}</p></div></div>
        ${stBars(wdc,["ma","di","wo","do","vr","za","zo"],{hi:wdc[top]?top:-1,fmt:v=>String(Math.round(v)),h:200,gem:false})}</section>
      <section class="st-card"><div class="st-ch"><div><h3>Omzet per dienst</h3><p>Aandeel in de omzet uit werk</p></div></div>
        ${dk.length?`<div class="st-share">${dk.map(k=>`<i style="width:${per_d[k]/dtot*100}%;--h:${hue(k)}" title="${esc(k)}"></i>`).join("")}</div><div class="st-rows">${dk.map(k=>`<div class="st-row"><span class="st-dot" style="--h:${hue(k)}"></span><span class="st-rn">${esc(k)}</span><span class="st-rp">${Math.round(per_d[k]/dtot*100)}%</span><b>${eur0(per_d[k])}</b></div>`).join("")}</div>`:'<p class="st-leeg">Nog geen afgemelde beurten in deze periode.</p>'}</section></div>`;
  }else{
    const ak=actief(),nieuw=state.klanten.filter(k=>inRange(k.aangemaakt,P.rg)),nieuwV=state.klanten.filter(k=>inRange(k.aangemaakt,V.rg)),inact=state.klanten.filter(k=>k.actief===false);
    const jaar=ak.reduce((a,k)=>a+exAmt(k.prijs)*365/freqDays(k),0),perK=ak.length?jaar/ak.length:0;
    const rd={};ak.forEach(k=>{const r=k.ronde||"Zonder ronde";rd[r]=(rd[r]||0)+exAmt(k.prijs)*365/freqDays(k)});const rk=Object.keys(rd).sort((a,b)=>rd[b]-rd[a]),rmx=Math.max(1,...rk.map(r=>rd[r]));
    const top=state.klanten.map(k=>({k,s:echteFacturen().filter(f=>f.klantId===k.id).reduce((a,f)=>a+totals(f).ex,0)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,6),tmx=Math.max(1,...top.map(x=>x.s));
    const zak=ak.filter(k=>k.soort==="zakelijk").length;
    const groei=[...Array(12)].map((_,i)=>{const d=new Date(t.getFullYear(),t.getMonth()-11+i+1,0);const di=iso(d);return{l:new Date(d.getFullYear(),d.getMonth(),1).toLocaleDateString("nl-NL",{month:"short"}).replace(".",""),n:ak.filter(k=>String(k.aangemaakt||"0000").slice(0,10)<=di).length}});
    const mot=nieuw.length?`${plural(nieuw.length,"nieuwe klant","nieuwe klanten")} in ${esc(P.lbl)}. Samen goed voor ${eur0(nieuw.filter(k=>k.actief!==false).reduce((a,k)=>a+exAmt(k.prijs)*365/freqDays(k),0))} per jaar.`:`Nog geen nieuwe klanten in ${esc(P.lbl)}. Een aanbeveling via het klantportaal helpt!`;
    html+=`<section class="st-hero"><div class="st-hm"><span class="st-k">Actieve klanten</span>
        <div class="st-big"><b>${ak.length}</b>${nieuw.length?`<span class="st-pill up">+${nieuw.length} in ${esc(P.lbl)}</span>`:""}</div>
        <p class="st-mot">${mot}</p>
        <div class="st-wijk" aria-hidden="true">${ak.slice(0,60).map(k=>`<i class="${nieuw.includes(k)?"nw":""}${k.soort==="zakelijk"?" zk":""}" title="${esc(cleanName(k.naam))}">${HUIS}</i>`).join("")}${ak.length>60?`<small>+${ak.length-60}</small>`:""}</div>
        <div class="st-goal"><div class="st-share sm"><i style="width:${ak.length?(ak.length-zak)/ak.length*100:0}%;--h:190"></i><i style="width:${ak.length?zak/ak.length*100:0}%;--h:30"></i></div><div class="st-gl"><span><span class="st-dot" style="--h:190"></span>${ak.length-zak} particulier</span><span><span class="st-dot" style="--h:30"></span>${zak} zakelijk</span></div></div></div>
      <div class="st-hs">${stTile(I.euro,"Verwacht per jaar",eur0(jaar),"uit vaste klanten, ex btw","ok")}${stTile(I.klanten,"Per klant",perK?eur0(perK):"–","gemiddeld per jaar")}</div></section>
    <div class="st-tiles">${stTile(I.plus,"Nieuw",nieuw.length,nieuwV.length?nieuwV.length+" in "+esc(V.lbl):"in "+esc(P.lbl),nieuw.length?"ok":"")}
      ${stTile(I.klanten,"Actief",ak.length,`${zak} zakelijk · ${ak.length-zak} particulier`)}
      ${stTile(I.timer,"Inactief",inact.length,"gepauzeerd of opgezegd",inact.length?"":"ok")}
      ${stTile(I.spark,"Beste klant",top[0]?eur0(top[0].s):"–",top[0]?esc(cleanName(top[0].k.naam)):"nog geen facturen")}</div>
    <section class="st-card"><div class="st-ch"><div><h3>Klantengroei</h3><p>Actieve klanten aan het eind van elke maand</p></div></div>${stBars(groei.map(g=>g.n),groei.map(g=>g.l),{hi:11,fmt:v=>String(Math.round(v)),h:200,gem:false})}</section>
    <div class="st-two"><section class="st-card"><div class="st-ch"><div><h3>Jaaromzet per ronde</h3><p>Verwacht, ex btw</p></div></div>${rk.length?`<div class="st-rows">${rk.map(r=>`<div class="st-row bar"><span class="st-rn">${esc(r)}</span><span class="st-rb"><i style="width:${rd[r]/rmx*100}%;--h:${hue(r)}"></i></span><b>${eur0(rd[r])}</b></div>`).join("")}</div>`:'<p class="st-leeg">Nog geen klanten.</p>'}</section>
      <section class="st-card"><div class="st-ch"><div><h3>Beste klanten</h3><p>Gefactureerd ex btw, alle tijd</p></div></div>${top.length?`<div class="st-rows">${top.map((x,i)=>`<div class="st-row bar click" data-act="klant" data-id="${esc(x.k.id)}" role="button"><span class="st-av" style="--h:${hue(x.k.ronde||x.k.naam)}">${i+1}</span><span class="st-rn">${esc(cleanName(x.k.naam))}</span><span class="st-rb"><i style="width:${x.s/tmx*100}%;--h:190"></i></span><b>${eur0(x.s)}</b></div>`).join("")}</div>`:'<p class="st-leeg">Nog geen facturen.</p>'}</section></div>`;
  }
  return html;
}
