/* ---------- MANSARD Control Center ----------
   Operationele cockpit. Leest alleen gegevens die het CRM al heeft (klanten, beurten, facturen, offertes, tickets,
   portaalverzoeken, routes, live rit) en rekent met dezelfde functies als de rest van het CRM (fin, totals, fStatus,
   routeStops, overdue, queues). Slaat niets op en maakt geen nieuwe gegevens; de scheiding tussen bedrijven blijft zoals hij is.
   Alle signalen en cijfers komen uit echte gegevens; is er niets, dan staat er een lege status. */
I.control=I.control||sv('<rect x="3.5" y="3.5" width="7" height="8" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.6"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.6"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.6"/>');
const CC={q:"",zoek:false,weer:null,weerBezig:false};
const ccDag=n=>iso(addDays(today(),n||0));
const ccRest=f=>Math.max(0,r2(totals(f).inc-(Number(f.deelBetaald)||0)));
const ccDagen=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const ccKlant=id=>state.klanten.find(x=>x.id===id);
const ccNaam=k=>k?cleanName(k.naam||""):"";
const ccLijst=(arr,n=3)=>{const u=[...new Set(arr.filter(Boolean))];return u.slice(0,n).join(", ")+(u.length>n?" en "+(u.length-n)+" meer":"")};
const ccWeekEind=()=>{const t=today(),d=(7-t.getDay())%7;return addDays(t,d)};
const ccMetOpdracht=()=>actief().filter(k=>!k.opdrachtVerwijderd&&!k.hoofdKlantId);

/* ---------- KPI's ---------- */
function ccKpis(){const t=today(),M=curPeriod("maand"),V=curPeriod("maand",-1),fM=fin(M.rg),fV=fin(V.rg);
  const pct=fV.omzet>0?Math.round((fM.omzet-fV.omzet)/fV.omzet*100):null;
  const open=facturen().filter(f=>!["concept","betaald","oninbaar"].includes(f.status)),ach=open.filter(f=>fStatus(f)[1]==="Achterstallig");
  const opdr=ccMetOpdracht(),weekEind=ccWeekEind();
  const dezeWeek=opdr.filter(k=>{const g=parse(k.gepland);if(g)return g>=t&&g<=weekEind;const v=volgende(k);return v&&v<=weekEind}).length;
  const mnd=iso(addDays(t,-30)),wk=iso(addDays(t,-7));
  const aanvr=state.klanten.filter(k=>k.actief!==false&&(k.nieuwAangemeld||(k.prospect&&k.bron==="website"))),aanvrRecent=aanvr.filter(k=>String(k.aangemaakt||"")>=mnd||k.nieuwAangemeld);
  return {omzet:fM.omzet,pct,maand:M.lbl,open:r2(open.reduce((a,f)=>a+ccRest(f),0)),nOpen:open.length,nAch:ach.length,opdr:opdr.length,dezeWeek,
    aanvr:aanvrRecent.length,aanvrWeek:aanvrRecent.filter(k=>String(k.aangemaakt||"")>=wk).length}}

/* ---------- MANSARD adviseert: signalen uit echte gegevens, op urgentie ---------- */
const CC_PRIO={kritiek:[0,"Kritiek","late"],hoog:[1,"Hoog","warn"],normaal:[2,"Normaal","soon"],laag:[3,"Laag","ok"]};
function ccSignalen(){const s=[],t=today(),ti=iso(t),morgen=ccDag(1);
  /* kritiek: vervallen facturen */
  const ach=facturen().filter(f=>!["concept","betaald","oninbaar"].includes(f.status)&&fStatus(f)[1]==="Achterstallig");
  if(ach.length){const som=ach.reduce((a,f)=>a+ccRest(f),0),oud=Math.max(...ach.map(f=>ccDagen(f.verval,ti)));
    s.push({p:"kritiek",ic:"facturen",t:plural(ach.length,"factuur vervallen","facturen vervallen"),u:`Samen ${eur(som)} open, de oudste ${plural(oud,"dag","dagen")} over de vervaldatum. Een herinnering voorkomt betalingsachterstand.`,
      b:ccLijst(ach.map(f=>ccNaam(ccKlant(f.klantId))||cleanName(f.klantNaam||""))),knop:"Bekijk facturen",go:"ff:achterstallig"})}
  /* kritiek: mislukte incasso */
  const mis=facturen().filter(f=>f.incassoMislukt&&f.status!=="betaald");
  if(mis.length)s.push({p:"kritiek",ic:"bank",t:plural(mis.length,"incasso mislukt","incasso's mislukt"),u:"De automatische afschrijving is niet gelukt. Stuur een betaallink of neem contact op.",
    b:ccLijst(mis.map(f=>cleanName(f.klantNaam||""))),knop:"Bekijk facturen",go:"ff:openstaand"});
  /* hoog: offertes zonder reactie */
  const off=state.facturen.filter(f=>f.soort==="offerte"&&f.status==="verstuurd"&&ccDagen(String(f.verstuurdOp||f.datum||"").slice(0,10),ti)>=7);
  if(off.length)s.push({p:"hoog",ic:"offertes",t:plural(off.length,"offerte wacht","offertes wachten")+" op reactie",u:"Langer dan 7 dagen verstuurd zonder akkoord of afwijzing. Even nabellen of een herinnering sturen vergroot de kans op akkoord.",
    b:ccLijst(off.map(f=>cleanName(f.klantNaam||""))),knop:"Bekijk offertes",go:"of:verstuurd"});
  /* hoog: klanten te laat en nog niet ingepland */
  const laat=overdue().filter(k=>!k.gepland&&!k.opdrachtVerwijderd);
  if(laat.length)s.push({p:"hoog",ic:"planning",t:plural(laat.length,"klant is","klanten zijn")+" aan de beurt maar niet ingepland",u:"Hun termijn is verstreken. Plan ze in om het ritme vast te houden.",b:ccLijst(laat.map(ccNaam)),knop:"Open planning",go:"tab:planning"});
  /* hoog: afspraken vandaag/morgen zonder tijd */
  const zt=actief().filter(k=>(k.gepland===ti||k.gepland===morgen)&&!k.tijd);
  if(zt.length)s.push({p:"hoog",ic:"clock",t:plural(zt.length,"afspraak heeft","afspraken hebben")+" nog geen tijd",u:"Vandaag of morgen ingepland zonder tijdstip. De klant krijgt dan geen nauwkeurige aankondiging.",b:ccLijst(zt.map(ccNaam)),knop:"Open planning",go:"tab:planning"});
  /* hoog: conceptfacturen van afgemeld werk */
  const con=facturen().filter(f=>f.status==="concept"&&String(f.datum||"")<=ti);
  if(con.length)s.push({p:"hoog",ic:"receipt",t:plural(con.length,"factuur staat","facturen staan")+" nog als concept",u:`Samen ${eur(con.reduce((a,f)=>a+totals(f).inc,0))}. Maak ze definitief en verstuur ze, dan komt het geld sneller binnen.`,b:ccLijst(con.map(f=>cleanName(f.klantNaam||""))),knop:"Bekijk concepten",go:"ff:concept"});
  /* normaal: klantportaal (tickets en verzoeken) */
  const tk=(state.tickets||[]).filter(x=>x.status!=="opgelost"&&(Number(x.ongelezenTeam)>0||x.status==="open")),vz=state.portaalVz||[];
  if(tk.length||vz.length)s.push({p:"normaal",ic:"ticket",t:[tk.length?plural(tk.length,"ticket wacht","tickets wachten"):"",vz.length?plural(vz.length,"verzoek","verzoeken")+" uit het portaal":""].filter(Boolean).join(" · "),
    u:"Klanten wachten op een reactie in het klantportaal.",b:ccLijst([...tk.map(x=>cleanName(x.klantNaam||"")),...vz.map(x=>cleanName(x.klantNaam||""))]),knop:"Open tickets",go:"tickets"});
  /* normaal: nieuwe aanmeldingen */
  const nw=nieuweAanmeldingen();
  if(nw.length)s.push({p:"normaal",ic:"klanten",t:plural(nw.length,"nieuwe aanmelding","nieuwe aanmeldingen"),u:"Via de website aangemeld en nog niet opgevolgd.",b:ccLijst(nw.map(ccNaam)),knop:"Bekijk klanten",go:"tab:klanten"});
  /* normaal: berichten in de wachtrij */
  let wq=0;try{wq=queues().reduce((a,q)=>a+q.items.length,0)}catch(e){}
  if(wq)s.push({p:"normaal",ic:"communicatie",t:plural(wq,"bericht klaar","berichten klaar")+" om te versturen",u:"Herinneringen of aankondigingen in de wachtrij van Communicatie.",b:"",knop:"Open communicatie",go:"tab:communicatie"});
  /* laag: btw-aangifte */
  {const q=Math.floor(t.getMonth()/3),pq=q===0?4:q,py=q===0?t.getFullYear()-1:t.getFullYear(),dl=qDeadline(py,pq),dd=Math.round((dl-t)/864e5),key=py+"-Q"+pq;
    if(dd>=0&&dd<=21&&!(state.aangiftes||{})[key]&&echteFacturen().some(f=>inRange(f.datum,periodRange(py,"q"+pq))))
      s.push({p:dd<=7?"hoog":"laag",ic:"bank",t:`Btw-aangifte Q${pq} ${py} nog indienen`,u:`Uiterlijk ${longD(dl)}, nog ${plural(dd,"dag","dagen")}. De bedragen staan klaar in Boekhouding.`,b:"",knop:"Open boekhouding",go:"tab:boekhouding"})}
  /* laag: kans op herhaalopdracht (klant zonder opdracht die het afgelopen jaar minstens 3 keer kwam) */
  {const jaar=iso(addDays(t,-365)),n={};state.beurten.forEach(b=>{if(b.datum>=jaar)n[b.klantId]=(n[b.klantId]||0)+1});
    const her=state.klanten.filter(k=>(k.opdrachtVerwijderd||k.actief===false)&&!k.prospect&&(n[k.id]||0)>=3);
    if(her.length)s.push({p:"laag",ic:"refresh",t:"Kans op herhaalopdracht",u:`${plural(her.length,"klant kwam","klanten kwamen")} het afgelopen jaar minstens 3 keer, maar ${her.length===1?"heeft":"hebben"} nu geen opdracht. Tijd voor een check-in.`,
      b:ccLijst(her.map(ccNaam)),knop:her.length===1?"Open klant":"Bekijk klanten",go:her.length===1?"klant:"+her[0].id:"tab:klanten"})}
  return s.sort((a,b)=>CC_PRIO[a.p][0]-CC_PRIO[b.p][0])}

/* ---------- planning vandaag (zelfde lijst als Vandaag) ---------- */
function ccPlanning(){const ti=iso(today());return routeStops(ti).map(({k,done})=>{const g=parse(k.gepland),laat=!done&&g&&g<today();
  const st=done?["ok","Afgerond"]:k.bezig?["soon","In uitvoering"]:laat?["late","Te laat"]:["neutral","Gepland"];
  return {k,tijd:k.tijd||"",st,dienst:k.dienst||"Glasbewassing"}})}

/* ---------- recente activiteiten, samengesteld uit bestaande gegevens (niets wordt extra geregistreerd) ---------- */
function ccActiviteit(){const ev=[],grens=iso(addDays(today(),-30)),d10=s=>String(s||"").slice(0,10),tijd=(s,fb)=>{const m=String(s||"").match(/T(\d{2}:\d{2})/);return m?m[1]:fb||""};
  const add=(ts,ic,t,s,kl,act)=>{if(!ts||d10(ts)<grens)return;ev.push({ts:String(ts),ic,t,s,kl,act})};
  state.beurten.forEach(b=>add(b.op||b.datum,"check","Beurt afgerond",[cleanName(b.klantNaam||""),b.dienst].filter(Boolean).join(" · "),"ok","klant:"+b.klantId));
  state.facturen.forEach(f=>{const off=f.soort==="offerte",nm=cleanName(f.klantNaam||"");
    if(f.verstuurdOp)add(f.verstuurdOp,off?"offertes":"facturen",(off?"Offerte ":"Factuur ")+"verstuurd",nm+" · "+eur(totals(f).inc),"soon","f:"+f.id);
    if(off&&f.akkoordOp)add(f.akkoordOp,"check","Offerte geaccepteerd",nm,"ok","f:"+f.id);
    if(!off&&f.status==="betaald"&&(f.betaaldTs||f.betaaldOp))add(f.betaaldTs||f.betaaldOp,"euro","Factuur betaald",nm+" · "+eur(totals(f).inc),"ok","f:"+f.id);
    if(!off&&f.status!=="betaald"&&f.status!=="concept"&&fStatus(f)[1]==="Achterstallig"&&f.verval)add(f.verval,"alert","Factuur vervallen",nm+" · "+eur(ccRest(f)),"late","f:"+f.id)});
  state.klanten.forEach(k=>{if(k.aangemaakt&&!k.hoofdKlantId)add(k.aangemaakt,"user","Nieuwe klant",ccNaam(k)+(k.plaats?" · "+k.plaats:""),"neutral","klant:"+k.id)});
  (state.tickets||[]).forEach(x=>add(x.laatst||x.aangemaakt,"ticket","Ticket"+(x.status==="opgelost"?" opgelost":""),[cleanName(x.klantNaam||""),x.onderwerp].filter(Boolean).join(" · "),"soon","tickets"));
  return ev.sort((a,b)=>b.ts.localeCompare(a.ts)).slice(0,8).map(e=>({...e,lbl:d10(e.ts)===iso(today())?tijd(e.ts,"Vandaag"):fmtD(d10(e.ts))}))}

/* ---------- bedrijfsprestaties (alleen wat betrouwbaar te berekenen is) ---------- */
function ccPrestaties(){const t=today(),ti=iso(t),d90=iso(addDays(t,-90));
  const off=state.facturen.filter(f=>f.soort==="offerte"&&String(f.datum||"")>=d90),ja=off.filter(f=>f.status==="geaccepteerd").length,
    afgesl=off.filter(f=>f.status==="geaccepteerd"||f.status==="afgewezen"||(f.status==="verstuurd"&&f.verval&&f.verval<ti)).length;
  const conv=afgesl>=3?Math.round(ja/afgesl*100):null;
  const d365=iso(addDays(t,-365)),basis=state.klanten.filter(k=>!k.prospect&&!k.hoofdKlantId&&k.aangemaakt&&k.aangemaakt<d365);
  const behoud=basis.length>=5?Math.round(basis.filter(k=>k.actief!==false&&!k.opdrachtVerwijderd).length/basis.length*100):null;
  const bet=echteFacturen().filter(f=>f.status==="betaald"&&f.betaaldOp&&f.datum&&String(f.betaaldOp).slice(0,10)>=d90).map(f=>Math.max(0,ccDagen(f.datum,String(f.betaaldOp).slice(0,10))));
  const betaal=bet.length>=3?Math.round(bet.reduce((a,b)=>a+b,0)/bet.length*10)/10:null;
  /* omzet per week, laatste 8 weken (factuurdatum, excl. btw) */
  const ma=addDays(t,-((t.getDay()+6)%7)),weken=[];for(let i=7;i>=0;i--){const a=addDays(ma,-7*i),b=addDays(a,6);weken.push({a,b,v:fin([a,b]).omzet})}
  /* verdeling: actieve opdrachten per dienst (hoofdopdracht + extra diensten) */
  const v={};ccMetOpdracht().forEach(k=>{const d=String(k.dienst||"Glasbewassing").replace(/\s*\(.*$/,"");v[d]=(v[d]||0)+1;(k.opdrachten||[]).filter(o=>o.actief!==false).forEach(o=>{const n=String(o.dienst||"Overig").replace(/\s*\(.*$/,"");v[n]=(v[n]||0)+1})});
  const verd=Object.entries(v).sort((a,b)=>b[1]-a[1]);
  return {conv,ja,afgesl,behoud,nBasis:basis.length,betaal,nBet:bet.length,weken,verd}}

/* ---------- weer (Open-Meteo, gratis en zonder sleutel; plaats uit het bedrijfsadres) ---------- */
const CC_WEER={0:["Zonnig","☀️"],1:["Overwegend zonnig","🌤️"],2:["Half bewolkt","⛅"],3:["Bewolkt","☁️"],45:["Mist","🌫️"],48:["Mist","🌫️"],51:["Motregen","🌦️"],53:["Motregen","🌦️"],55:["Motregen","🌦️"],61:["Regen","🌧️"],63:["Regen","🌧️"],65:["Zware regen","🌧️"],71:["Sneeuw","🌨️"],73:["Sneeuw","🌨️"],75:["Sneeuw","🌨️"],80:["Buien","🌦️"],81:["Buien","🌦️"],82:["Zware buien","⛈️"],95:["Onweer","⛈️"],96:["Onweer","⛈️"],99:["Onweer","⛈️"]};
async function ccWeerLaad(){if(CC.weer||CC.weerBezig)return;const st=S(),plaats=String(st.plaats||"").trim();if(!plaats)return;CC.weerBezig=true;
  try{let c=null;try{const b=rtBedrijf();c=typeof pkCoord==="function"&&pkCoord(b)}catch(e){}
    if(!c){const g=await (await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&language=nl&countryCode="+encodeURIComponent(st.land||"NL")+"&name="+encodeURIComponent(plaats))).json();const r=(g.results||[])[0];if(r)c=[r.latitude,r.longitude]}
    if(!c)return;const w=await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c[0].toFixed(3)}&longitude=${c[1].toFixed(3)}&current=temperature_2m,weather_code,precipitation,wind_speed_10m&timezone=Europe%2FAmsterdam`)).json();
    const cur=w.current||{};CC.weer={temp:Math.round(cur.temperature_2m),code:cur.weather_code,regen:cur.precipitation,wind:Math.round(cur.wind_speed_10m||0),plaats};
    if(state.tab==="control"){const el=document.getElementById("ccWeer");if(el)el.outerHTML=ccWeerHtml()}}
  catch(e){}finally{CC.weerBezig=false}}
function ccWeerHtml(){const w=CC.weer;if(!w)return `<div class="cc-weer" id="ccWeer"></div>`;const [l,ic]=CC_WEER[w.code]||["",""];
  return `<div class="cc-weer" id="ccWeer" title="${esc(l)}${w.wind?" · wind "+w.wind+" km/u":""}"><span class="cc-wi" aria-hidden="true">${ic}</span><span><b>${w.temp}°C</b><small>${esc(w.plaats)}</small></span></div>`}

/* ---------- zoeken (⌘K): klanten, offertes en facturen; alleen lezen ---------- */
function ccZoek(q){q=String(q||"").trim().toLowerCase();if(q.length<2)return [];const nq=q.replace(/\s+/g,"");const R=[];
  state.klanten.filter(k=>!k.hoofdKlantId).forEach(k=>{const h=[k.naam,k.adres,k.postcode,k.plaats,k.email,k.telefoon,k.mobiel,k.klantnr,k.contact].map(x=>String(x||"").toLowerCase()).join(" ");
    if(h.includes(q)||h.replace(/\s+/g,"").includes(nq))R.push({s:"Klant",ic:"klanten",t:ccNaam(k),d:[k.adres,k.plaats].filter(Boolean).join(", "),act:"klant:"+k.id,tel:k.mobiel||k.telefoon||""})});
  state.facturen.forEach(f=>{const h=[f.nummer,f.klantNaam].map(x=>String(x||"").toLowerCase()).join(" ");
    if(h.includes(q))R.push({s:f.soort==="offerte"?"Offerte":"Factuur",ic:f.soort==="offerte"?"offertes":"facturen",t:String(f.nummer||"")+" · "+cleanName(f.klantNaam||""),d:fStatus(f)[1]+" · "+eur(totals(f).inc),act:"f:"+f.id})});
  return R.slice(0,12)}
function ccZoekTeken(){const box=document.getElementById("ccZr");if(!box)return;const r=ccZoek(CC.q);
  box.hidden=!CC.zoek||CC.q.trim().length<2;if(box.hidden)return;
  box.innerHTML=r.length?r.map((x,i)=>`<button type="button" class="cc-zi" data-cc="${esc(x.act)}" data-i="${i}"><span class="cc-zic">${I[x.ic]||""}</span><span class="cc-zt"><b>${esc(x.t)}</b><small>${esc(x.s)}${x.d?" · "+esc(x.d):""}</small></span>${x.tel?`<a class="cc-tel" href="tel:${esc(String(x.tel).replace(/\s/g,""))}" aria-label="Bellen" data-stop="1">${I.phone}</a>`:""}</button>`).join(""):`<p class="cc-leeg">Niets gevonden voor “${esc(CC.q)}”.</p>`}

/* ---------- weergave ---------- */
function ccSpark(weken){const max=Math.max(1,...weken.map(w=>w.v)),W=300,H=96,px=i=>Math.round(8+i*(W-16)/(weken.length-1)),py=v=>Math.round(H-10-(v/max)*(H-24));
  const pts=weken.map((w,i)=>px(i)+","+py(w.v)).join(" ");
  return `<svg class="cc-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Omzet per week, laatste 8 weken"><polyline points="8,${H-10} ${pts} ${W-8},${H-10}" class="a"/><polyline points="${pts}" class="l"/>${weken.map((w,i)=>`<circle cx="${px(i)}" cy="${py(w.v)}" r="2.6"><title>${fmtD(w.a)} – ${fmtD(w.b)}: ${eur0(w.v)}</title></circle>`).join("")}</svg>
    <div class="cc-sx">${weken.filter((_,i)=>i%2===1).map(w=>`<span>${fmtD(w.a)}</span>`).join("")}</div>`}
function ccDonut(verd){const tot=verd.reduce((a,x)=>a+x[1],0);if(!tot)return "";const K=["#252c3c","#5b7fa8","#9fb6cf","#c9a46a","#7c8794","#d7dde4"];let o=0;const r=34,C=2*Math.PI*r;
  const top=verd.slice(0,5),rest=verd.slice(5).reduce((a,x)=>a+x[1],0),rows=rest?[...top,["Overig",rest]]:top;
  return `<div class="cc-donut"><svg viewBox="0 0 90 90" role="img" aria-label="Verdeling opdrachten">${rows.map(([n,v],i)=>{const l=v/tot*C,s=`<circle cx="45" cy="45" r="${r}" stroke="${K[i%K.length]}" stroke-dasharray="${l.toFixed(2)} ${(C-l).toFixed(2)}" stroke-dashoffset="${(-o).toFixed(2)}"><title>${esc(n)}: ${v}</title></circle>`;o+=l;return s}).join("")}<text x="45" y="45">${tot}</text><text x="45" y="57" class="s">totaal</text></svg>
    <ul>${rows.map(([n,v],i)=>`<li><i style="background:${K[i%K.length]}"></i><span>${esc(n)}</span><b>${Math.round(v/tot*100)}%</b></li>`).join("")}</ul></div>`}
function vControl(){const K=ccKpis(),S_=ccSignalen(),P=ccPlanning(),A=ccActiviteit(),R=ccPrestaties(),t=today();
  const dag=t.toLocaleDateString("nl-NL",{weekday:"long"}),dat=t.toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"});
  const kpi=(ic,cls,l,v,sub,subCls,act)=>`<button type="button" class="cc-kpi" data-cc="${act}"><span class="cc-ki ${cls}">${I[ic]}</span><span class="cc-kt"><small>${l}</small><b>${v}</b><em class="${subCls||""}">${sub}</em></span></button>`;
  const sig=S_.length?S_.map(s=>{const [,lbl,cls]=CC_PRIO[s.p];return `<div class="cc-sig"><span class="cc-si ${cls}">${I[s.ic]||I.alert}</span><span class="cc-pr ${cls}">${lbl}</span>
      <div class="cc-st"><b>${esc(s.t)}</b><p>${esc(s.u)}</p>${s.b?`<small>Betreft: ${esc(s.b)}</small>`:""}</div><button type="button" class="cc-sk" data-cc="${esc(s.go)}">${esc(s.knop)}${I.right||""}</button></div>`}).join("")
    :`<div class="cc-rust">${I.check}<div><b>Alles op orde</b><p>Geen vervallen facturen, wachtende offertes of planningsproblemen. Mooi zo.</p></div></div>`;
  const plan=P.length?`<ul class="cc-plan">${P.map(x=>`<li class="st-${x.st[0]}"><span class="cc-pt">${esc(x.tijd||"—")}</span><button type="button" class="cc-pk" data-cc="klant:${esc(x.k.id)}"><b>${esc(x.dienst)}</b> · ${esc(ccNaam(x.k))}<small>${esc([jobAddrObj(x.k).adres,x.k.plaats].filter(Boolean).join(", "))}</small></button><span class="pill ${x.st[0]}">${x.st[1]}</span></li>`).join("")}</ul>`
    :`<p class="cc-leeg">Vandaag staat er niets op de planning.</p>`;
  const nu=P.filter(x=>!x.st||x.st[1]!=="Afgerond").length,klaar=P.length-nu;
  const act=A.length?`<ul class="cc-act">${A.map(e=>`<li><span class="cc-at">${esc(e.lbl)}</span><span class="cc-ai ${e.kl}">${I[e.ic]||I.check}</span><button type="button" data-cc="${esc(e.act)}"><b>${esc(e.t)}</b><small>${esc(e.s)}</small></button></li>`).join("")}</ul>`
    :`<p class="cc-leeg">Nog geen activiteit in de afgelopen 30 dagen.</p>`;
  const prf=(l,v,sub)=>`<div class="cc-pf"><small>${l}</small><b>${v==null?"—":v}</b><em>${sub}</em></div>`;
  const heeftOmzet=R.weken.some(w=>w.v>0);
  setTimeout(()=>{ccKaart();ccWeerLaad();ccZoekTeken()},30);
  return `<div class="cc">
  <div class="cc-head"><div><h1>Control Center</h1><p>Het complete overzicht van je bedrijf. Alles wat je moet weten, op één plek.</p></div>
    <div class="cc-tools"><div class="cc-zoek"><span>${I.search}</span><input id="ccQ" type="search" autocomplete="off" placeholder="Zoek klant, adres, offerte, factuur…" value="${esc(CC.q)}" aria-label="Zoeken"><kbd>${/Mac|iP/.test(navigator.platform||"")?"⌘":"Ctrl"} K</kbd><div class="cc-zr" id="ccZr" hidden></div></div>
      <button type="button" class="cc-bel" data-cc="naar:ccAdv" aria-label="${plural(S_.length,"signaal","signalen")}">${I.bell}${S_.length?`<i>${S_.length}</i>`:""}</button>
      <div class="cc-dag"><b>${esc(dag.charAt(0).toUpperCase()+dag.slice(1))}</b><small>${esc(dat)}</small></div>${ccWeerHtml()}</div></div>
  <div class="cc-grid">
    <div class="cc-main">
      <div class="cc-kpis">
        ${kpi("euro","k1","Omzet "+esc(K.maand.split(" ")[0]),eur0(K.omzet),K.pct==null?"excl. btw":(K.pct>=0?"▲ ":"▼ ")+Math.abs(K.pct)+"% t.o.v. vorige maand",K.pct==null?"":K.pct>=0?"up":"down","tab:inzichten")}
        ${kpi("facturen","k2","Openstaande facturen",eur0(K.open),K.nAch?plural(K.nAch,"vervallen","vervallen"):plural(K.nOpen,"factuur","facturen")+" open",K.nAch?"down":"","ff:"+(K.nAch?"achterstallig":"openstaand"))}
        ${kpi("checksq","k3","Actieve opdrachten",K.opdr,K.dezeWeek+" deze week aan de beurt","","tab:planning")}
        ${kpi("inbox","k4","Nieuwe aanvragen",K.aanvr,K.aanvrWeek?"▲ "+K.aanvrWeek+" deze week":"afgelopen 30 dagen",K.aanvrWeek?"up":"","tab:klanten")}
      </div>
      <div class="cc-row2">
        <section class="cc-adv" id="ccAdv"><div class="cc-ah"><span class="cc-aic">${I.spark}</span><div><b>MANSARD adviseert</b><small>Signalen en aanbevolen acties uit je eigen bedrijfsgegevens</small></div>${S_.length?`<span class="cc-cnt">${plural(S_.length,"actie","acties")}</span>`:""}</div>${sig}</section>
        <section class="cc-card cc-live"><div class="cc-ch"><div><b>${I.map}Live operatie</b><small>${P.length?`${plural(P.length,"adres","adressen")} vandaag · ${klaar} klaar`:"Vandaag geen adressen"}</small></div><button type="button" class="cc-link" data-cc="tab:vandaag">Naar Vandaag${I.right||""}</button></div>
          <div class="cc-map"><div class="rv-map" id="rvMap"><div class="rv-map-l">Kaart laden…</div></div></div>
          <div class="cc-leg"><span><i class="af"></i>Afgerond</span><span><i class="nu"></i>Volgende</span><span><i></i>Gepland</span><span><i class="bus"></i>Bus (live)</span></div></section>
      </div>
      <div class="cc-row3">
        <section class="cc-card"><div class="cc-ch"><div><b>${I.planning}Vandaag – planning</b><small>${esc(longD(t))}</small></div><button type="button" class="cc-link" data-cc="tab:planning">Bekijk planning${I.right||""}</button></div>${plan}</section>
        <section class="cc-card"><div class="cc-ch"><div><b>${I.trend}Bedrijfsprestaties</b><small>Laatste 90 dagen, uit je facturen, offertes en klanten</small></div></div>
          <div class="cc-pfs">${prf("Conversie offertes",R.conv==null?null:R.conv+"%",R.conv==null?"te weinig offertes":R.ja+" van "+R.afgesl+" afgerond")}${prf("Klantbehoud",R.behoud==null?null:R.behoud+"%",R.behoud==null?"nog geen jaar historie":"klanten van >1 jaar actief")}${prf("Gem. betaaltijd",R.betaal==null?null:String(R.betaal).replace(".",",")+" d",R.betaal==null?"te weinig betalingen":"factuur → betaald")}</div>
          <div class="cc-charts"><div><h4>Omzet per week (excl. btw)</h4>${heeftOmzet?ccSpark(R.weken):`<p class="cc-leeg">Nog geen gefactureerde omzet in de laatste 8 weken.</p>`}</div><div><h4>Verdeling opdrachten</h4>${R.verd.length?ccDonut(R.verd):`<p class="cc-leeg">Nog geen actieve opdrachten.</p>`}</div></div></section>
      </div>
    </div>
    <aside class="cc-side">
      <section class="cc-card"><div class="cc-ch"><div><b>${I.spark}Snelle acties</b></div></div>
        <div class="cc-qa">${[["klanten","Nieuwe klant","nieuw:klant"],["offertes","Offerte maken","nieuw:offerte"],["facturen","Factuur maken","nieuw:factuur"],["phone","Klant bellen","bellen"],["msg","Bericht sturen","tab:communicatie"],["planning","Planning openen","tab:planning"]].map(([ic,l,a])=>`<button type="button" data-cc="${a}">${I[ic]}<span>${l}</span></button>`).join("")}</div></section>
      <section class="cc-card"><div class="cc-ch"><div><b>${I.bell}Recente activiteiten</b><small>Afgelopen 30 dagen</small></div></div>${act}</section>
    </aside>
  </div></div>`}

/* kaart: de bestaande dagkaart van Vandaag (zelfde stops, busje en live GPS), altijd voor vandaag */
function ccKaart(){if(state.tab!=="control"||typeof rvMapTeken!=="function")return;const w=state.rvMap,d=state.routeDay;state.rvMap=true;state.routeDay=null;try{rvMapTeken()}finally{state.rvMap=w;state.routeDay=d}}

/* ---------- acties: alleen naar bestaande functies ---------- */
function ccActie(a){if(!a)return;const [k,...r]=a.split(":"),v=r.join(":");
  if(k==="tab")return go(v);
  if(k==="ff"){state.fFilter=v;return go("facturen")}
  if(k==="of"){state.oFilter=v;return go("offertes")}
  if(k==="klant")return ccKlant(v)?openKlant(v):go("klanten");
  if(k==="f"){const f=state.facturen.find(x=>x.id===v);if(!f)return;return f.soort==="offerte"?openOfferte({id:v}):openFactuur(v)}
  if(k==="tickets")return typeof openTickets==="function"?openTickets():go("communicatie");
  if(k==="nieuw"){if(v==="klant")return openNieuweKlant();if(v==="offerte")return openOfferte();if(v==="factuur")return openFactuurForm()}
  if(k==="bellen"){const q=document.getElementById("ccQ");if(q){q.focus();q.placeholder="Typ de naam van de klant om te bellen…"}return}
  if(k==="naar"){const el=document.getElementById(v);if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-cc]");
  if(!b||!b.closest(".cc")){if(CC.zoek&&!(e.target.closest&&e.target.closest(".cc-zoek"))){CC.zoek=false;ccZoekTeken()}return}
  if(e.target.closest("[data-stop]"))return;e.preventDefault();CC.zoek=false;ccZoekTeken();ccActie(b.dataset.cc)});
document.addEventListener("input",e=>{if(e.target&&e.target.id==="ccQ"){CC.q=e.target.value;CC.zoek=true;ccZoekTeken()}});
document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="ccQ"){CC.zoek=true;ccZoekTeken()}});
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&String(e.key).toLowerCase()==="k"&&!isMw()&&state.loaded){e.preventDefault();if(state.tab!=="control")go("control");setTimeout(()=>{const q=document.getElementById("ccQ");if(q){q.focus();q.select()}},40);return}
  if(e.target&&e.target.id==="ccQ"){if(e.key==="Escape"){CC.zoek=false;e.target.blur();ccZoekTeken()}
    if(e.key==="Enter"){const f=document.querySelector("#ccZr .cc-zi");if(f){e.preventDefault();CC.zoek=false;ccActie(f.dataset.cc)}}}});
