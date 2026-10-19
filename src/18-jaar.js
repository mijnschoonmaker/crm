/* ---------- ANALYSE: jaaroverzicht in de geest van DienstenCRM, in Mansard-stijl ----------
   Filters: jaar · bron (facturen of afspraken) · uren (geregistreerd of volgens planning) · medewerker.
   KPI's per gewerkte dag/week/maand, omzet per week en maand, btw, nieuwe klanten, klantenverloop, offertes,
   voltijdomzet, top-10 klanten/diensten/plaatsen en per medewerker omzet, afspraken, uren, uuromzet en klachten. */
state.ajaar=state.ajaar||new Date().getFullYear();state.abron=state.abron||"facturen";state.auren=state.auren||"geregistreerd";state.amw=state.amw||"";state.aall=state.aall||{};
const AN_MND=["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
const AN_KL=["#252c3c","#c9a46a","#6b7896","#9aa3b5","#8a6d43","#3e4a64","#b8c0cf","#d9b98a"];
const AN_WK=38,AN_VAK=3;/* voltijd: 38 uur per week, 3 weken vakantie */
function anWeken(y){const d=new Date(y,11,28);return weekNr(d)}
function anWk(s,y){const d=parse(s);if(!d)return -1;const w=weekNr(d);/* week 1 die in december valt of week 52/53 in januari */
  if(d.getMonth()===11&&w===1)return -1;if(d.getMonth()===0&&w>50)return 0;return w}
/* lijngrafiek (één of meer lijnen), schaalt mee met de breedte */
function anLijn(series,labels,{fmt=v=>String(Math.round(v)),h=220,elk=1}={}){
  const W=760,H=h,pl=46,pr=12,pt=14,pb=28,n=labels.length,rauw=Math.max(...series.flatMap(s=>s.v),0),mx=rauw<=4&&series.flatMap(s=>s.v).every(v=>Number.isInteger(v))?4:Math.max(1,rauw)*1.12,x=i=>pl+(n<2?0:i*(W-pl-pr)/(n-1)),y=v=>pt+(H-pt-pb)*(1-v/mx);
  const grid=[0,.25,.5,.75,1].map(f=>`<line x1="${pl}" x2="${W-pr}" y1="${y(mx*f)}" y2="${y(mx*f)}"/><text x="${pl-8}" y="${y(mx*f)+4}" text-anchor="end">${esc(fmt(mx*f))}</text>`).join("");
  const xl=labels.map((l,i)=>i%elk===0||i===n-1?`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${esc(l)}</text>`:"").join("");
  const lijnen=series.map((s,si)=>{const c=s.c||AN_KL[si%AN_KL.length],pts=s.v.map((v,i)=>[x(i),y(v)]),d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join("");
    const vlak=series.length===1?`<path d="${d}L${x(n-1)} ${y(0)}L${x(0)} ${y(0)}Z" fill="url(#anv${si})" stroke="none"/>`:"";
    return `<defs><linearGradient id="anv${si}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".22"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>${vlak}<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${n<=14?pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="#fff" stroke="${c}" stroke-width="2"><title>${esc(s.n?s.n+" · ":"")}${esc(labels[i])}: ${esc(fmt(s.v[i]))}</title></circle>`).join(""):""}`}).join("");
  const leg=series.length>1?`<div class="ajr-leg">${series.map((s,si)=>`<span><i style="background:${s.c||AN_KL[si%AN_KL.length]}"></i>${esc(s.n)}</span>`).join("")}</div>`:"";
  return `<svg class="ajr-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><g class="ajr-grid">${grid}</g>${lijnen}<g class="ajr-x">${xl}</g></svg>${leg}`}
/* staafgrafiek voor veel staven (52 weken): smal, waarde in tooltip */
function anStaaf(vals,labels,{fmt=v=>eur0(v),h=210,hi=-1,elk=4}={}){
  const W=760,H=h,pl=50,pr=8,pt=12,pb=26,n=vals.length,mx=Math.max(1,...vals)*1.1,bw=(W-pl-pr)/n,y=v=>pt+(H-pt-pb)*(1-v/mx);
  const grid=[0,.5,1].map(f=>`<line x1="${pl}" x2="${W-pr}" y1="${y(mx*f)}" y2="${y(mx*f)}"/><text x="${pl-8}" y="${y(mx*f)+4}" text-anchor="end">${esc(fmt(mx*f))}</text>`).join("");
  const bars=vals.map((v,i)=>{const bx=pl+i*bw+bw*.16,hh=Math.max(v>0?2:0,(H-pt-pb)*v/mx/1);return `<rect class="${i===hi?"hi":""}" x="${bx.toFixed(1)}" y="${(H-pb-hh).toFixed(1)}" width="${(bw*.68).toFixed(1)}" height="${hh.toFixed(1)}" rx="${Math.min(4,bw*.3).toFixed(1)}"><title>${esc(labels[i])}: ${esc(fmt(v))}</title></rect>`}).join("");
  const xl=labels.map((l,i)=>i%elk===0?`<text x="${(pl+i*bw+bw/2).toFixed(1)}" y="${H-8}" text-anchor="middle">${esc(l)}</text>`:"").join("");
  return `<svg class="ajr-svg ajr-bars" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="anb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9aa3b5"/><stop offset="1" stop-color="#6b7896"/></linearGradient><linearGradient id="anbh" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#3e4a64"/><stop offset="1" stop-color="#1b2130"/></linearGradient></defs><g class="ajr-grid">${grid}</g>${bars}<g class="ajr-x">${xl}</g></svg>`}
function anDonut(delen){const tot=delen.reduce((a,d)=>a+d.n,0),R=58,C=2*Math.PI*R;let acc=0;
  const ring=tot?delen.filter(d=>d.n).map(d=>{const l=d.n/tot*C,s=`<circle r="${R}" cx="80" cy="80" fill="none" stroke="${d.c}" stroke-width="20" stroke-dasharray="${Math.max(0,l-(delen.filter(x=>x.n).length>1?3:0)).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-acc).toFixed(2)}" transform="rotate(-90 80 80)"><title>${esc(d.l)}: ${d.n}</title></circle>`;acc+=l;return s}).join(""):`<circle r="${R}" cx="80" cy="80" fill="none" stroke="#eceef1" stroke-width="20"/>`;
  return `<div class="ajr-donut"><div class="ajr-dr"><svg viewBox="0 0 160 160">${ring}</svg><div class="ajr-dm"><small>Totaal</small><b>${tot}</b></div></div>
    <div class="ajr-dl">${delen.map(d=>`<div><i style="background:${d.c}"></i><span>${esc(d.l)}</span><b>${d.n}</b><em>${tot?Math.round(d.n/tot*100):0}%</em></div>`).join("")}</div></div>`}
function anTabel(key,kop,rijen,{fmtN=v=>v,leeg="Nog geen gegevens."}={}){const all=state.aall[key],r=all?rijen:rijen.slice(0,10),mx=Math.max(1,...rijen.map(x=>x.om));
  if(!rijen.length)return `<p class="st-leeg">${leeg}</p>`;
  return `<table class="ajr-tab"><thead><tr><th class="n">#</th><th>${kop[0]} · ${kop[1].toLowerCase()}</th><th class="r">${kop[2]}</th></tr></thead><tbody>${r.map((x,i)=>`<tr${x.id?` data-act="klant" data-id="${esc(x.id)}" class="click"`:""}><td class="n">${i+1}</td><td><span class="ajr-nm" title="${esc(x.n)}">${esc(x.n)}</span><span class="ajr-sub"><span class="ajr-sb"><i style="width:${x.om/mx*100}%"></i></span><em>${fmtN(x.a)}×</em></span></td><td class="r b">${eur0(x.om)}</td></tr>`).join("")}</tbody></table>
    ${rijen.length>10?`<button type="button" class="small ghost ajr-alles" data-an="alles" data-k="${key}">${all?"Toon top 10":"Alles weergeven ("+rijen.length+")"}</button>`:""}`}
function anKaart(titel,sub,inhoud,extra=""){return `<section class="st-card ajr-card"><div class="st-ch"><div><h3>${titel}</h3><p>${sub}</p></div>${extra}</div>${inhoud}</section>`}
function anTot(lbl,v){return `<div class="ajr-tot"><small>${lbl}</small><b>${v}</b></div>`}

function vAnalyse(){
  const t=today(),Y=+state.ajaar,huidig=Y===t.getFullYear(),start=new Date(Y,0,1),eind=huidig?t:new Date(Y,11,31),rg=[start,eind];
  const rgV=[new Date(Y-1,0,1),huidig?new Date(Y-1,t.getMonth(),t.getDate()):new Date(Y-1,11,31)];
  const bron=state.abron,afs=bron==="afspraken",mw=afs?state.amw:"",plan=false;
  const KM={};state.klanten.forEach(k=>KM[k.id]=k);
  const alleB=state.beurten.filter(b=>b.datum&&!b.geannuleerd);
  const mws=[...new Set(alleB.filter(b=>String(b.datum).startsWith(String(Y))).map(b=>b.door).filter(Boolean))].sort();
  const bIn=r=>alleB.filter(b=>inRange(b.datum,r)&&(!mw||b.door===mw)),fIn=r=>echteFacturen().filter(f=>inRange(f.datum,r));
  const bOm=b=>exAmt(b.bedrag),bMin=b=>plan?duur(KM[b.klantId]||{}):(Number(b.duur)||duur(KM[b.klantId]||{}));
  /* omzet-posten volgens de gekozen bron */
  const posten=r=>afs?bIn(r).map(b=>({d:b.datum,om:bOm(b),btw:0,k:b.klantId,b})):fIn(r).map(f=>{const tt=totals(f);return{d:f.datum,om:tt.ex,btw:tt.btw,k:f.klantId,f}});
  const P=posten(rg),PV=posten(rgV),omzet=P.reduce((a,p)=>a+p.om,0),omzetV=PV.reduce((a,p)=>a+p.om,0);
  const B=bIn(rg),dagen=new Set(B.map(b=>b.datum)),weken=new Set(B.map(b=>anWk(b.datum,Y)+"")),mnd=new Set(B.map(b=>String(b.datum).slice(0,7)));
  const minuten=B.reduce((a,b)=>a+bMin(b),0),gemMin=B.filter(b=>(b.gemeten||b.startOp)&&Number(b.duur)).reduce((a,b)=>a+Number(b.duur),0),gemPct=minuten?Math.round(gemMin/minuten*100):0,urenTxt=!minuten?"nog geen uren":gemPct>=99?"alles gemeten":gemPct?gemPct+"% gemeten, rest volgens planning":"volgens planning (nog niet gemeten)",uren=minuten/60,omB=B.reduce((a,b)=>a+bOm(b),0),perUur=uren>0?omB/uren:0,voltijd=perUur*AN_WK*(52-AN_VAK);
  const per=(n)=>n?omzet/n:0,groei=omzetV?Math.round((omzet-omzetV)/omzetV*100):null;
  const pLbl=`Periode 1 jan t/m ${huidig?fmtD(t):"31 dec"}`;
  const yrs=[...new Set([...state.beurten.map(b=>String(b.datum||"").slice(0,4)),...state.facturen.map(f=>String(f.datum||"").slice(0,4)),String(t.getFullYear())].filter(x=>/^\d{4}$/.test(x)))].sort().reverse();

  let h=`<div class="ajr-bar">
    <label class="ajr-f"><small>Jaar</small><select data-an="jaar">${yrs.map(y=>`<option${+y===Y?" selected":""}>${y}</option>`).join("")}</select></label>
    <div class="ajr-f"><small>Omzet op basis van</small><div class="seg brand ajr-seg">${[["facturen","Facturen"],["afspraken","Afspraken"]].map(([v,l])=>`<button type="button" data-an="bron" data-v="${v}" aria-pressed="${bron===v}">${l}</button>`).join("")}</div></div>
    ${afs&&mws.length?`<label class="ajr-f"><small>Medewerker</small><select data-an="mw"><option value="">Iedereen</option>${mws.map(m=>`<option${m===mw?" selected":""}>${esc(m)}</option>`).join("")}</select></label>`:""}
  </div>`;

  /* hero + KPI's */
  const mot=groei==null?(omzet?`Eerste jaar in Mansard: ${plural(dagen.size,"werkdag","werkdagen")} gewerkt.`:"Nog geen omzet in dit jaar."):groei>=0?`${groei}% meer dan dezelfde periode in ${Y-1}. Mooi zo!`:`${Math.abs(groei)}% minder dan dezelfde periode in ${Y-1}.`;
  h+=`<section class="st-hero ajr-hero"><div class="st-hm"><span class="st-k">Omzet · ${Y} · ex btw · ${afs?"afspraken":"facturen"}${mw?" · "+esc(mw):""}</span>
      <div class="st-big"><b>${eur0(omzet)}</b>${stDelta(omzet,omzetV,"vs "+(Y-1))}</div><p class="st-mot">${mot}</p>
      <div class="st-wk ajr-chips"><span><b>${dagen.size}</b> dagen</span><span><b>${weken.size}</b> weken</span><span><b>${mnd.size}</b> maanden gewerkt</span><span><b>${(uren).toLocaleString("nl-NL",{maximumFractionDigits:0})}u</b> bij klanten</span></div></div>
    <div class="st-hs">${stTile(I.timer,"Voltijdomzet",afs&&voltijd?eur0(voltijd):"–",afs?`per jaar bij ${AN_WK} uur/week, ${AN_VAK} wk vakantie`:"kies Afspraken","ok")}${stTile(I.euro,"Per uur",perUur?eur(perUur):"–","omzet ex btw per uur bij klanten")}</div></section>
  <div class="ajr-per">${I.planning}<span>${pLbl}</span></div>
  <div class="st-tiles ajr-kpi">
    ${stTile(I.timer,"Per werkdag",eur0(per(dagen.size)),`gemiddeld over ${plural(dagen.size,"dag","dagen")}`)}
    ${stTile(I.planning,"Per werkweek",eur0(per(weken.size)),`gemiddeld over ${plural(weken.size,"week","weken")}`)}
    ${stTile(I.facturen||I.receipt,"Per maand",eur0(per(mnd.size)),`gemiddeld over ${plural(mnd.size,"maand","maanden")}`)}
    ${stTile(I.receipt,afs?"Per afspraak":"Per factuur",eur(P.length?omzet/P.length:0),`gemiddeld over ${plural(P.length,afs?"afspraak":"factuur",afs?"afspraken":"facturen")}`)}
    ${stTile(I.clock,"Uren per dag",dagen.size?(uren/dagen.size).toLocaleString("nl-NL",{maximumFractionDigits:1})+"u":"–",urenTxt)}
    ${stTile(I.trend||I.spark,"Omzetgroei",groei==null?"–":(groei>=0?"+":"")+groei+"%",`vs dezelfde periode ${Y-1}`,groei==null?"":groei>=0?"ok":"late")}
  </div>`;

  /* omzet per week en per maand */
  const nW=anWeken(Y),wv=Array(nW).fill(0),mv=Array(12).fill(0),bv=Array(12).fill(0);
  P.forEach(p=>{const w=anWk(p.d,Y);if(w>=1&&w<=nW)wv[w-1]+=p.om;else if(w===0)wv[0]+=p.om;const m=+String(p.d).slice(5,7)-1;mv[m]+=p.om;bv[m]+=p.btw});
  const hiW=huidig?Math.min(nW,weekNr(t))-1:-1,hiM=huidig?t.getMonth():-1;
  h+=anKaart("Omzetverloop per week",`Ex btw · ${afs?"afspraken":"facturen"} · week 1 t/m ${nW}`,anStaaf(wv,wv.map((_,i)=>"wk "+(i+1)),{hi:hiW}).replace(/>wk (\d+)</g,">$1<"),anTot("Totaal",eur0(omzet)));
  h+=`<div class="st-two">${anKaart("Omzetverloop per maand","Ex btw · stippellijn = gemiddelde",stBars(mv.map(r2),AN_MND,{hi:hiM,h:210}),anTot("Totaal",eur0(omzet)))}
    ${afs?anKaart("Btw per maand","Alleen beschikbaar bij omzet op basis van facturen",`<div class="ajr-hint">${I.receipt}<span>Kies bovenaan <b>Facturen</b> om de btw per maand te zien.</span></div>`)
      :anKaart("Btw per maand","Af te dragen btw over je facturen",stBars(bv.map(r2),AN_MND,{hi:hiM,h:210,gem:false}),anTot("Totaal",eur0(bv.reduce((a,v)=>a+v,0))))}</div>`;

  /* klanten: nieuw per week en verloop */
  const nk=Array(nW).fill(0);state.klanten.forEach(k=>{if(!String(k.aangemaakt||"").startsWith(String(Y)))return;const w=anWk(k.aangemaakt,Y);if(w>=1&&w<=nW)nk[w-1]++;else if(w===0)nk[0]++});
  const tot=huidig?Math.min(nW,weekNr(t)):nW,lbls=[...Array(tot)].map((_,i)=>"wk "+(i+1));
  const wkEind=i=>{const d=new Date(Y,0,4);const dag=(d.getDay()||7)-1;d.setDate(d.getDate()-dag+7*i+6);return iso(d)};
  const laatstB={};alleB.forEach(b=>{if(!laatstB[b.klantId]||b.datum>laatstB[b.klantId])laatstB[b.klantId]=b.datum});
  const verloop=[...Array(tot)].map((_,i)=>{const e=wkEind(i),s=iso(addDays(parse(e),-6));return state.klanten.filter(k=>{const a=String(k.aangemaakt||"").slice(0,10);if(a&&a>e)return false;if(k.actief!==false)return true;const stop=String(k.inactiefOp||k.gepauzeerdOp||laatstB[k.id]||"").slice(0,10);return stop&&stop>=s}).length});
  h+=`<div class="st-two">${anKaart("Nieuwe klanten per week",`Klanten toegevoegd in ${Y}`,anLijn([{v:nk.slice(0,tot)}],lbls.map(l=>l.slice(3)),{elk:4}),anTot("Totaal",nk.reduce((a,v)=>a+v,0)))}
    ${anKaart("Klantenverloop","Actieve klanten per week",anLijn([{v:verloop,c:"#c9a46a"}],lbls.map(l=>l.slice(3)),{elk:4}),anTot("Nu",verloop[verloop.length-1]||0))}</div>`;

  /* offertes + voltijdomzet */
  const off=offertes().filter(f=>String(f.datum||"").startsWith(String(Y))),ti=iso(t);
  const st=f=>{const s=f.status||"concept";if(s==="verstuurd")return f.verval&&f.verval<ti?"verlopen":"open";return s};
  const OD=[["geaccepteerd","Geaccepteerd","#5f8f6e"],["open","Open","#c9a46a"],["concept","Concept","#9aa3b5"],["verlopen","Verlopen","#6b7896"],["afgewezen","Afgewezen","#a4544a"]].map(([k,l,c])=>({l,c,n:off.filter(f=>st(f)===k).length}));
  const ow=off.filter(f=>st(f)==="geaccepteerd").reduce((a,f)=>a+totals(f).ex,0),beslist=OD[0].n+OD[4].n;
  h+=`<div class="st-two">${anKaart("Offertes",`${plural(off.length,"offerte","offertes")} in ${Y}${beslist?` · ${Math.round(OD[0].n/beslist*100)}% geaccepteerd`:""}`,anDonut(OD),ow?anTot("Geaccepteerd",eur0(ow)):"")}
    ${anKaart("Gemiddelde voltijdomzet",`Op basis van ${AN_WK} uur per week en ${AN_VAK} weken vakantie`,afs?(voltijd?`<div class="ajr-vt"><b>${eur0(voltijd)}</b><span>per jaar</span></div>
        <div class="ajr-vtr"><div><small>Omzet per uur</small><b>${eur(perUur)}</b></div><div><small>Uren bij klanten</small><b>${Math.round(uren)}u</b></div><div><small>Per week (${AN_WK}u)</small><b>${eur0(perUur*AN_WK)}</b></div></div>
        <p class="subt ajr-uitleg">Wat je${mw?" ("+esc(mw)+")":""} per jaar omzet als je fulltime bij klanten zou werken met dezelfde omzet per uur. Handig om medewerkers en prijzen te vergelijken.</p>`:`<p class="st-leeg">Nog geen afgemelde afspraken met uren in ${Y}.</p>`)
      :`<div class="ajr-hint">${I.timer}<span>Kies bovenaan <b>Afspraken</b> om de gemiddelde voltijdomzet te berekenen.</span></div>`)}</div>`;

  /* top-10's */
  const groep=(fnKey)=>{const m={};P.forEach(p=>{fnKey(p).forEach(([key,n,id,om,a])=>{const x=m[key]||(m[key]={n,id,a:0,om:0});x.a+=a??1;x.om+=om})});return Object.values(m).sort((a,b)=>b.om-a.om||b.a-a.a)};
  const kNaam=p=>{const k=KM[p.k];return k?cleanName(k.naam):cleanName((p.f||p.b||{}).klantNaam||"Onbekend")};
  const tk=groep(p=>[[p.k||kNaam(p),kNaam(p),KM[p.k]?p.k:"",p.om]]);
  const tpl=groep(p=>{const k=KM[p.k];let pl=k&&k.plaats;if(!pl&&p.f){const m=String(p.f.klantAdres||"").match(/\d{4}\s?[A-Z]{2}\s+(.+)$/);pl=m&&m[1]}return[[String(pl||"Onbekend").trim(),String(pl||"Onbekend").trim(),"",p.om]]});
  const td=groep(p=>{if(p.b){const k=KM[p.b.klantId]||{},r=[[stDienstNorm(p.b.dienst||k.dienst),stDienstNorm(p.b.dienst||k.dienst),"",p.om]];(p.b.extra||[]).forEach(e=>r.push([stDienstNorm(e),stDienstNorm(e),"",0]));return r}
    const k=KM[p.k]||{},rs=(p.f.regels||[]).filter(r=>(Number(r.aantal)||0)*(Number(r.prijs)||0));const som=rs.reduce((a,r)=>a+(Number(r.aantal)||0)*(Number(r.prijs)||0),0)||1;
    return rs.map(r=>{let n=String(r.omschrijving||"").split("(")[0];if(k.adres)n=n.replace(k.adres,"");n=n.replace(/\s+\d+[a-z]?\s*$/i,"").replace(/[\s,·-]+$/,"").trim();if(/^(toeslag|korting|voorrijkosten)/i.test(n)||!n)n="Glasbewassing";n=stDienstNorm(n);return[n,n,"",p.om*(Number(r.aantal)||0)*(Number(r.prijs)||0)/som]})});
  const aant=afs?"Afspraken":"Facturen";
  h+=`<div class="ajr-three">${anKaart("Top klanten",`Op omzet · ${Y}`,anTabel("k",["Klant",aant,"Omzet"],tk))}${anKaart("Top diensten",`Op omzet · ${Y}`,anTabel("d",["Dienst","Aantal","Omzet"],td))}${anKaart("Top plaatsen",`Op omzet · ${Y}`,anTabel("p",["Plaats",aant,"Omzet"],tpl))}</div>`;

  /* per medewerker */
  if(mws.length){
    const MB={};mws.forEach(m=>MB[m]={om:Array(12).fill(0),n:Array(12).fill(0),min:Array(12).fill(0),kl:Array(12).fill(0),klL:[]});
    alleB.filter(b=>inRange(b.datum,rg)&&MB[b.door]).forEach(b=>{const m=+b.datum.slice(5,7)-1,x=MB[b.door];x.om[m]+=bOm(b);x.n[m]++;x.min[m]+=bMin(b)});
    (state.tickets||[]).filter(k=>k.categorie==="kwaliteit").forEach(k=>{const d=String(k.gemaakt||k.op||k.aangemaakt||k.datum||"").slice(0,10);if(!inRange(d,rg))return;
      const vb=alleB.filter(b=>b.klantId===k.klantId&&b.datum<=d&&b.door).sort((a,b)=>b.datum.localeCompare(a.datum))[0];if(!vb||!MB[vb.door])return;const x=MB[vb.door];x.kl[+d.slice(5,7)-1]++;x.klL.push({k,b:vb,d})});
    const mN=huidig?t.getMonth()+1:12,lab=AN_MND.slice(0,mN),som=a=>a.reduce((s,v)=>s+v,0);
    const ser=f=>mws.map((m,i)=>({n:m,v:f(MB[m]).slice(0,mN),c:AN_KL[i%AN_KL.length]}));
    const tabel=(kop,rij)=>`<table class="ajr-tab ajr-mw"><thead><tr><th>Medewerker</th>${kop.map(k=>`<th class="r">${k}</th>`).join("")}</tr></thead><tbody>${mws.map((m,i)=>`<tr><td><span class="ajr-dot" style="background:${AN_KL[i%AN_KL.length]}"></span>${esc(m)}</td>${rij(MB[m],m).map(v=>`<td class="r">${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const uurOm=x=>{const u=som(x.min)/60;return u?som(x.om)/u:0};
    h+=`<div class="ajr-sec"><span class="st-k">Per medewerker · ${Y}</span><p class="subt">Op basis van afgemelde afspraken · uren: ${urenTxt}</p></div>
    <div class="st-two">${anKaart("Omzet per medewerker","Per maand, ex btw",anLijn(ser(x=>x.om.map(r2)),lab,{fmt:v=>eur0(v)})+tabel(["Omzet"],x=>[eur0(som(x.om))]))}
      ${anKaart("Afspraken per medewerker","Aantal afgemelde afspraken per maand",anLijn(ser(x=>x.n),lab)+tabel(["Afspraken"],x=>[som(x.n)]))}</div>
    <div class="st-two">${anKaart("Uren per medewerker","Uren bij klanten per maand",anLijn(ser(x=>x.min.map(v=>Math.round(v/6)/10)),lab,{fmt:v=>Math.round(v)+"u"})+tabel(["Uren"],x=>[Math.round(som(x.min)/60)+"u"]))}
      ${anKaart("Omzet per uur",`Uuromzet per maand · voltijd = ${AN_WK}u × ${52-AN_VAK} weken`,anLijn(ser(x=>x.om.map((v,i)=>x.min[i]?r2(v/(x.min[i]/60)):0)),lab,{fmt:v=>eur0(v)})+tabel(["Uuromzet","Voltijdomzet"],x=>{const u=uurOm(x);return[u?eur(u):"–",u?eur0(u*AN_WK*(52-AN_VAK)):"–"]}))}</div>
    ${anKaart("Klachten per medewerker","Tickets in de categorie Kwaliteit of klacht, gekoppeld aan wie er het laatst was",(mws.some(m=>som(MB[m].kl))?anLijn(ser(x=>x.kl),lab):`<div class="ajr-hint">${I.check}<span>Geen klachten in ${Y}. Netjes gewerkt!</span></div>`)+tabel(["Klachten",""],(x,m)=>[som(x.kl),x.klL.length?`<button type="button" class="iconbtn ajr-oog" data-an="klacht" data-v="${esc(m)}" aria-label="Bekijk klachten">${I.eye}</button>`:""]))}`;
    window._anKlacht=MB;
  }
  return h;
}
function anKlachten(m){const x=(window._anKlacht||{})[m];if(!x)return;
  openDlg(`<div class="dlg-head"><h3>Klachten · ${esc(m)}</h3><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="ajr-kll">${x.klL.sort((a,b)=>b.d.localeCompare(a.d)).map(({k,b,d})=>`<div class="ajr-kl" data-act="klant" data-id="${esc(k.klantId||"")}" role="button"><b>${esc(k.onderwerp||"Klacht")}</b><small>${esc(fmtL?fmtL(d):d)} · ${esc(cleanName(k.klantNaam||b.klantNaam||""))} · beurt ${esc(fmtD(b.datum))}</small></div>`).join("")}</div>
    <div class="row"><span class="sp"></span><button type="button" class="primary" data-act="close">Sluiten</button></div>`)}
document.addEventListener("click",e=>{const el=e.target.closest("[data-an]");if(!el||el.tagName==="SELECT")return;const a=el.dataset.an;
  if(a==="bron"){state.abron=el.dataset.v;render()}else if(a==="uren"){state.auren=el.dataset.v;render()}
  else if(a==="alles"){state.aall[el.dataset.k]=!state.aall[el.dataset.k];render()}else if(a==="klacht")anKlachten(el.dataset.v)});
document.addEventListener("change",e=>{const el=e.target.closest("select[data-an]");if(!el)return;if(el.dataset.an==="jaar")state.ajaar=+el.value;if(el.dataset.an==="mw")state.amw=el.value;render()});
