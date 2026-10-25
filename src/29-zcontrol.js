/* ---------- MANSARD Control Center ----------
   Operationele cockpit. Leest alleen gegevens die het CRM al heeft (klanten, beurten, facturen, offertes, tickets,
   portaalverzoeken, routes, live rit) en rekent met dezelfde functies als de rest van het CRM (fin, totals, fStatus,
   routeStops, overdue, queues). Slaat niets op en maakt geen nieuwe gegevens; de scheiding tussen bedrijven blijft zoals hij is.
   Alle signalen en cijfers komen uit echte gegevens; is er niets, dan staat er een lege status. */
I.control=I.control||sv('<rect x="3.5" y="3.5" width="7" height="8" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.6"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.6"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.6"/>');
const CC={q:"",zoek:false,weer:null,weerBezig:false,alles:false,sel:-1,menu:"",toonVerborgen:false};
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
/* Elke melding gaat over één ding (factuur, offerte, klant, ticket) met een vaste sleutel. Afgehandeld of "later" wordt bewaard in
   instellingen/control (alleen deze sleutels en datums, geen klantgegevens), zodat de wachtrij op elk apparaat gelijk is.
   Terugkerende zaken (vervallen factuur, wachtende offerte, te late klant) komen na 7 dagen terug als ze nog steeds spelen. */
const CC_TERUG=["fv","im","ow","tl","hh"];
function ccStatus(){return state.ccStatus||{}}
function ccVerborgen(key){const st=ccStatus(),nu=new Date(),a=(st.afgehandeld||{})[key],l=(st.later||{})[key];
  if(l&&new Date(l)>nu)return "later";
  if(a){if(CC_TERUG.includes(key.split(":")[0]))return (nu-new Date(a))/864e5<7?"klaar":false;return "klaar"}return false}
async function ccZet(key,soort,tot){const st=ccStatus(),af={...(st.afgehandeld||{})},la={...(st.later||{})},grens=Date.now()-60*864e5;
  if(soort==="klaar"){af[key]=new Date().toISOString();delete la[key]}else if(soort==="later"){la[key]=tot;delete af[key]}else{delete af[key];delete la[key]}
  Object.keys(af).forEach(k=>{if(new Date(af[k]).getTime()<grens)delete af[k]});Object.keys(la).forEach(k=>{if(new Date(la[k]).getTime()<Date.now())delete la[k]});
  const d={afgehandeld:af,later:la};state.ccStatus=d;render();try{await save("instellingen","control",d)}catch(e){err(e)}}
const ccTel=k=>k?String(k.mobiel||k.telefoon||"").replace(/[^\d+]/g,""):"";
/* "Ik kom eraan": zelfde tekst als op Vandaag (sjabloon Onderweg), met link naar het klantportaal */
function ccKomEraan(k){const tel=ccTel(k);if(!tel||typeof waLink!=="function")return "";let t="";try{const T=tpls().onderweg||{};t=fill(T.sms||T.tekst||T.mail||"",klantVars(k,today()))}catch(e){}
  const vn=k.voornaam||cleanName(k.naam).split(",").slice(-1)[0].trim();if(!t)t=`Beste ${vn}, wij zijn onderweg naar u.`;
  const pl=(/^https?:/.test(location.origin)&&LIVE?location.origin:"https://app.mansard.nl")+"/portaal"+(k.email?"?e="+encodeURIComponent(k.email):"");return waLink(tel,t+"\n\nLive volgen: "+pl)}
function ccAlle(){const s=[],t=today(),ti=iso(t),morgen=ccDag(1);
  const add=o=>s.push({acts:[],...o});
  const bel=k=>ccTel(k)?{l:"Bellen",ic:"phone",href:"tel:"+ccTel(k)}:null;
  /* kritiek: vervallen facturen, per factuur */
  facturen().filter(f=>!["concept","betaald","oninbaar"].includes(f.status)&&fStatus(f)[1]==="Achterstallig").forEach(f=>{const k=ccKlant(f.klantId),dd=ccDagen(f.verval,ti);
    add({key:"fv:"+f.id,p:"kritiek",ic:"facturen",t:`Factuur ${f.nummer} vervallen · ${eur(ccRest(f))}`,u:`${plural(dd,"dag","dagen")} over de vervaldatum${f.herinneringen?" · "+plural(Number(f.herinneringen),"herinnering","herinneringen")+" verstuurd":""}.`,
      b:ccNaam(k)||cleanName(f.klantNaam||""),leeftijd:dd,knop:"Open factuur",go:"f:"+f.id,acts:[{l:"Herinnering",ic:"mail",cc:"herinner:"+f.id},bel(k)].filter(Boolean)})});
  facturen().filter(f=>f.incassoMislukt&&f.status!=="betaald").forEach(f=>{const k=ccKlant(f.klantId);
    add({key:"im:"+f.id,p:"kritiek",ic:"bank",t:`Incasso mislukt · ${f.nummer}`,u:"De automatische afschrijving is niet gelukt. Stuur de factuur met betaallink of bel de klant.",b:ccNaam(k)||cleanName(f.klantNaam||""),leeftijd:0,knop:"Open factuur",go:"f:"+f.id,
      acts:[{l:"Factuur sturen",ic:"send",cc:"stuur:"+f.id},bel(k)].filter(Boolean)})});
  /* hoog: offertes zonder reactie (7+ dagen) */
  state.facturen.filter(f=>f.soort==="offerte"&&f.status==="verstuurd").forEach(f=>{const dd=ccDagen(String(f.verstuurdOp||f.datum||"").slice(0,10),ti);if(dd<7)return;const k=ccKlant(f.klantId);
    add({key:"ow:"+f.id,p:"hoog",ic:"offertes",t:`Offerte ${String(f.nummer||"").replace(/^OFF-/,"")} wacht op reactie · ${eur(totals(f).inc)}`,u:`${plural(dd,"dag","dagen")} geleden verstuurd, nog geen akkoord of afwijzing.`,b:ccNaam(k)||cleanName(f.klantNaam||""),leeftijd:dd,knop:"Open offerte",go:"f:"+f.id,
      acts:[bel(k),{l:"Opnieuw sturen",ic:"send",cc:"stuur:"+f.id}].filter(Boolean)})});
  /* hoog: aan de beurt maar niet ingepland */
  overdue().filter(k=>!k.gepland&&!k.opdrachtVerwijderd).forEach(k=>{const v=volgende(k),dd=v?Math.max(0,Math.round((t-v)/864e5)):0;
    add({key:"tl:"+k.id+":"+(v?iso(v):""),p:"hoog",ic:"planning",t:`${ccNaam(k)} is aan de beurt`,u:`${dd?plural(dd,"dag","dagen")+" over de termijn":"Vandaag aan de beurt"}, nog niet ingepland.`,b:[jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "),leeftijd:dd,knop:"Open klant",go:"klant:"+k.id,
      acts:[{l:"Inplannen",ic:"planning",cc:"plan:"+k.id},bel(k)].filter(Boolean)})});
  /* hoog: afspraak vandaag/morgen zonder tijd: tijd direct invullen */
  actief().filter(k=>(k.gepland===ti||k.gepland===morgen)&&!k.tijd).forEach(k=>add({key:"zt:"+k.id+":"+k.gepland,p:"hoog",ic:"clock",t:`${ccNaam(k)} heeft nog geen tijd`,u:`Ingepland ${k.gepland===ti?"vandaag":"morgen"}. Met een tijd krijgt de klant een nauwkeurige aankondiging.`,b:[jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "),leeftijd:0,knop:"Open klant",go:"klant:"+k.id,tijd:k.id}));
  /* hoog: conceptfacturen */
  facturen().filter(f=>f.status==="concept"&&String(f.datum||"")<=ti).forEach(f=>add({key:"cf:"+f.id,p:"hoog",ic:"receipt",t:`Conceptfactuur ${f.nummer} · ${eur(totals(f).inc)}`,u:"Afgemeld werk dat nog niet is verstuurd. Maak hem definitief, dan komt het geld sneller binnen.",b:cleanName(f.klantNaam||""),leeftijd:ccDagen(f.datum,ti),knop:"Open factuur",go:"f:"+f.id,
    acts:[{l:"Versturen",ic:"send",cc:"stuur:"+f.id}]}));
  /* normaal: tickets en verzoeken uit het klantportaal */
  (state.tickets||[]).filter(x=>x.status!=="opgelost"&&(Number(x.ongelezenTeam)>0||x.status==="open")).forEach(x=>{const k=ccKlant(x.klantId);
    add({key:"tk:"+x.id+":"+String(x.laatst||""),p:"normaal",ic:"ticket",t:`Ticket: ${x.onderwerp||"vraag van klant"}`,u:Number(x.ongelezenTeam)>0?plural(Number(x.ongelezenTeam),"nieuw bericht","nieuwe berichten")+" van de klant.":"Wacht op een reactie.",b:cleanName(x.klantNaam||""),leeftijd:0,nieuw:true,knop:"Beantwoorden",go:"ticket:"+x.id,acts:[bel(k)].filter(Boolean)})});
  (state.portaalVz||[]).forEach(x=>add({key:"vz:"+x.id,p:"normaal",ic:"inbox",t:`Verzoek: ${x.typeLabel||x.type||"uit het klantportaal"}`,u:String(x.tekst||"Een klant heeft iets doorgegeven in het portaal.").slice(0,140),b:cleanName(x.klantNaam||""),leeftijd:0,nieuw:true,knop:"Afhandelen",go:"tickets"}));
  /* normaal: nieuwe aanmeldingen */
  nieuweAanmeldingen().forEach(k=>add({key:"nk:"+k.id,p:"normaal",ic:"klanten",t:`Nieuwe aanmelding: ${ccNaam(k)}`,u:"Via de website aangemeld. Bel of mail om de eerste afspraak te maken.",b:[jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "),leeftijd:0,nieuw:true,knop:"Open klant",go:"klant:"+k.id,acts:[bel(k)].filter(Boolean)}));
  /* normaal: berichten in de wachtrij */
  {let wq=0;try{wq=queues().reduce((a,q)=>a+q.items.length,0)}catch(e){}
    if(wq)add({key:"wq:"+ti,p:"normaal",ic:"communicatie",t:plural(wq,"bericht klaar","berichten klaar")+" om te versturen",u:"Herinneringen of aankondigingen in de wachtrij van Communicatie.",b:"",leeftijd:0,knop:"Open communicatie",go:"tab:communicatie"})}
  /* btw-aangifte */
  {const q=Math.floor(t.getMonth()/3),pq=q===0?4:q,py=q===0?t.getFullYear()-1:t.getFullYear(),dl=qDeadline(py,pq),dd=Math.round((dl-t)/864e5),key=py+"-Q"+pq;
    if(dd>=0&&dd<=21&&!(state.aangiftes||{})[key]&&echteFacturen().some(f=>inRange(f.datum,periodRange(py,"q"+pq))))
      add({key:"btw:"+key,p:dd<=7?"hoog":"laag",ic:"bank",t:`Btw-aangifte Q${pq} ${py} nog indienen`,u:`Uiterlijk ${longD(dl)}, nog ${plural(dd,"dag","dagen")}. De bedragen staan klaar in Boekhouding.`,b:"",leeftijd:0,knop:"Open boekhouding",go:"tab:boekhouding"})}
  /* laag: kans op herhaalopdracht */
  {const jaar=iso(addDays(t,-365)),n={};state.beurten.forEach(b=>{if(b.datum>=jaar)n[b.klantId]=(n[b.klantId]||0)+1});
    state.klanten.filter(k=>(k.opdrachtVerwijderd||k.actief===false)&&!k.prospect&&(n[k.id]||0)>=3).forEach(k=>add({key:"hh:"+k.id,p:"laag",ic:"refresh",t:`Kans op herhaalopdracht: ${ccNaam(k)}`,u:`Kwam het afgelopen jaar ${n[k.id]} keer, maar heeft nu geen opdracht. Tijd voor een check-in.`,b:[jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "),leeftijd:0,knop:"Open klant",go:"klant:"+k.id,acts:[bel(k)].filter(Boolean)}))}
  return s.sort((a,b)=>CC_PRIO[a.p][0]-CC_PRIO[b.p][0]||(b.leeftijd||0)-(a.leeftijd||0))}
/* de wachtrij: wat nog open staat (afgehandeld en "later" eruit) */
function ccSignalen(){return ccAlle().filter(m=>!ccVerborgen(m.key))}
/* "Nu doen": alleen wat binnen een uur aandacht vraagt */
function ccNuDoen(){const uit=[],nu=new Date(),nm=nu.getHours()*60+nu.getMinutes(),ti=iso(today());
  routeStops(ti).filter(x=>!x.done&&!x.k.bezig).forEach(({k})=>{const m=toMin(k.tijd);if(m==null||m<nm-15||m>nm+60)return;
    uit.push({ic:"route",t:m>=nm?`Over ${m-nm} min: ${ccNaam(k)}`:`${ccNaam(k)} (${k.tijd}) is nu aan de beurt`,s:[jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "),kom:ccKomEraan(k),go:"klant:"+k.id})});
  (state.tickets||[]).filter(x=>x.status!=="opgelost"&&Number(x.ongelezenTeam)>0&&nu-new Date(x.laatst||0)<3600e3).forEach(x=>uit.push({ic:"ticket",t:`Nieuw bericht van ${cleanName(x.klantNaam||"een klant")}`,s:x.onderwerp||"",go:"ticket:"+x.id}));
  facturen().filter(f=>f.incassoMislukt&&f.status!=="betaald"&&String(f.incassoMisluktOp||f.incassoMislukt||"").slice(0,10)===ti).forEach(f=>uit.push({ic:"bank",t:`Incasso vandaag mislukt: ${cleanName(f.klantNaam||"")}`,s:f.nummer,go:"f:"+f.id}));
  return uit}
function ccVolgende(){const nm=new Date().getHours()*60+new Date().getMinutes(),r=routeStops(iso(today())).filter(x=>!x.done).map(x=>x.k).filter(k=>toMin(k.tijd)!=null&&toMin(k.tijd)>nm).sort((a,b)=>toMin(a.tijd)-toMin(b.tijd))[0];return r?`${r.tijd} ${ccNaam(r)}`:""}

/* ---------- live: nieuwe meldingen met geluid, browsermelding en teller in het tabblad ---------- */
const CCL={gezien:null,piep:null};
function ccGezien(){if(CCL.gezien)return CCL.gezien;try{CCL.gezien=new Set(JSON.parse(localStorage.getItem("ms.cc.gezien")||"[]"))}catch(e){CCL.gezien=new Set()}return CCL.gezien}
function ccBewaarGezien(){try{localStorage.setItem("ms.cc.gezien",JSON.stringify([...ccGezien()].slice(-400)))}catch(e){}}
function ccPiep(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=CCL.piep||(CCL.piep=new A());[0,.16].forEach((d,i)=>{const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=i?1046:784;g.gain.setValueAtTime(.0001,c.currentTime+d);g.gain.exponentialRampToValueAtTime(.18,c.currentTime+d+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d+.22);o.connect(g).connect(c.destination);o.start(c.currentTime+d);o.stop(c.currentTime+d+.25)})}catch(e){}}
let ccLiveT=0;
function ccLiveCheck(){if(!state.loaded||isMw())return;clearTimeout(ccLiveT);ccLiveT=setTimeout(()=>{try{
  const open=ccSignalen(),G=ccGezien(),eerst=!localStorage.getItem("ms.cc.gezien");
  const nieuw=open.filter(m=>m.nieuw||m.p==="kritiek").filter(m=>!G.has(m.key));
  document.title=(open.length?"("+open.length+") ":"")+"Mansard";
  if(nieuw.length&&!eerst&&S().ccGeluid!==false){ccPiep();
    if(S().ccNotif!==false&&"Notification" in window&&Notification.permission==="granted"&&document.hidden){try{const n=new Notification("Mansard · "+nieuw[0].t,{body:[nieuw[0].b,nieuw.length>1?"+"+(nieuw.length-1)+" meer":""].filter(Boolean).join(" · "),tag:"mansard-cc"});n.onclick=()=>{window.focus();go("control")}}catch(e){}}}
  if(eerst){open.forEach(m=>G.add(m.key));ccBewaarGezien()}
  }catch(e){}},400)}
/* knipperende stip blijft tot je de melding hebt gezien (op het scherm met het Control Center open) */
function ccMarkeerGezien(){if(state.tab!=="control"||document.hidden)return;const G=ccGezien();let n=0;ccSignalen().forEach(m=>{if(!G.has(m.key)){G.add(m.key);n++}});if(n)setTimeout(ccBewaarGezien,0)}

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
/* wachtrij-weergave: per melding direct handelen, afvinken of uitstellen */
function ccWachtrijHtml(L){const G=ccGezien(),toon=CC.alles?L:L.slice(0,6);
  const verb=ccAlle().filter(m=>ccVerborgen(m.key));
  const item=(m,i)=>{const [,lbl,cls]=CC_PRIO[m.p],sel=CC.sel===i;
    const acts=(m.acts||[]).map(a=>a.href?`<a class="cc-ab" href="${esc(a.href)}">${I[a.ic]||""}${esc(a.l)}</a>`:`<button type="button" class="cc-ab" data-cc="${esc(a.cc)}">${I[a.ic]||""}${esc(a.l)}</button>`).join("");
    const tijd=m.tijd?`<span class="cc-tijd"><input type="time" step="300" id="ccT_${esc(m.tijd)}" aria-label="Tijd"><button type="button" class="cc-ab pr" data-cc="tijd:${esc(m.tijd)}">${I.check}Opslaan</button></span>`:"";
    const menu=CC.menu===m.key?`<span class="cc-lm">${[["Over 1 uur",1],["Vanmiddag","mid"],["Morgen","morgen"],["Volgende week","week"]].map(([l,v])=>`<button type="button" data-cc="later:${v}:${esc(m.key)}">${l}</button>`).join("")}</span>`:"";
    return `<div class="cc-mi${sel?" sel":""}${(m.nieuw||m.p==="kritiek")&&!G.has(m.key)?" nw":""}" data-i="${i}"><span class="cc-si ${cls}">${I[m.ic]||I.alert}</span>
      <div class="cc-st"><span class="cc-mh"><span class="cc-pr ${cls}">${lbl}</span>${i<9?`<kbd>${i+1}</kbd>`:""}</span><b>${esc(m.t)}</b><p>${esc(m.u)}</p>${m.b?`<small>${esc(m.b)}</small>`:""}
        <div class="cc-acts">${acts}${tijd}<button type="button" class="cc-ab" data-cc="${esc(m.go)}">${esc(m.knop)}</button><span class="sp"></span>
          <button type="button" class="cc-ab ghost" data-cc="menu:${esc(m.key)}" aria-expanded="${CC.menu===m.key}">${I.clock}Later</button>${menu}<button type="button" class="cc-ab ok" data-cc="klaar:${esc(m.key)}" title="Afgehandeld (E)">${I.check}Afgehandeld</button></div></div></div>`};
  return (L.length?toon.map(item).join(""):`<div class="cc-rust">${I.check}<div><b>Alles op orde</b><p>Niets meer in de wachtrij. Mooi zo.</p></div></div>`)
    +(L.length>6?`<button type="button" class="cc-meer" data-cc="alles">${CC.alles?"Minder tonen":`Toon alle ${L.length}`}</button>`:"")
    +(verb.length?`<div class="cc-verb"><button type="button" class="cc-meer" data-cc="verborgen">${CC.toonVerborgen?"Verberg":"Toon"} ${plural(verb.length,"afgehandelde of uitgestelde melding","afgehandelde of uitgestelde meldingen")}</button>${CC.toonVerborgen?verb.map(m=>{const l=(ccStatus().later||{})[m.key];return `<div class="cc-vi"><span>${esc(m.t)}<small>${l?"Later: "+esc(new Date(l).toLocaleString("nl-NL",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})):"Afgehandeld"}</small></span><button type="button" class="cc-ab ghost" data-cc="terug:${esc(m.key)}">Terugzetten</button></div>`}).join(""):""}</div>`:"")}
function ccNuDoenHtml(){const L=ccNuDoen();if(!L.length){const v=ccVolgende();return `<div class="cc-nu rust"><span class="cc-nd">${I.check}</span><b>Niets dringends</b>${v?`<small>Volgende afspraak: ${esc(v)}</small>`:""}</div>`}
  return `<div class="cc-nu"><span class="cc-nl"><i></i>Nu doen</span>${L.map(x=>`<div class="cc-nuit"><span>${I[x.ic]||""}</span><button type="button" data-cc="${esc(x.go)}"><b>${esc(x.t)}</b>${x.s?`<small>${esc(x.s)}</small>`:""}</button>${x.kom?`<a class="cc-ab pr" href="${esc(x.kom)}" target="_blank" rel="noopener">${I.wa||I.send}Kom eraan</a>`:""}</div>`).join("")}</div>`}
function vControl(){const K=ccKpis(),S_=ccSignalen(),P=ccPlanning(),A=ccActiviteit(),R=ccPrestaties(),t=today();
  const dag=t.toLocaleDateString("nl-NL",{weekday:"long"}),dat=t.toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"});
  const kpi=(ic,cls,l,v,sub,subCls,act)=>`<button type="button" class="cc-kpi" data-cc="${act}"><span class="cc-ki ${cls}">${I[ic]}</span><span class="cc-kt"><small>${l}</small><b>${v}</b><em class="${subCls||""}">${sub}</em></span></button>`;
  const sig=ccWachtrijHtml(S_);
  const plan=P.length?`<ul class="cc-plan">${P.map(x=>`<li class="st-${x.st[0]}"><span class="cc-pt">${esc(x.tijd||"—")}</span><button type="button" class="cc-pk" data-cc="klant:${esc(x.k.id)}"><b>${esc(x.dienst)}</b> · ${esc(ccNaam(x.k))}<small>${esc([jobAddrObj(x.k).adres,x.k.plaats].filter(Boolean).join(", "))}</small></button><span class="pill ${x.st[0]}">${x.st[1]}</span></li>`).join("")}</ul>`
    :`<p class="cc-leeg">Vandaag staat er niets op de planning.</p>`;
  const nu=P.filter(x=>!x.st||x.st[1]!=="Afgerond").length,klaar=P.length-nu;
  const act=A.length?`<ul class="cc-act">${A.map(e=>`<li><span class="cc-at">${esc(e.lbl)}</span><span class="cc-ai ${e.kl}">${I[e.ic]||I.check}</span><button type="button" data-cc="${esc(e.act)}"><b>${esc(e.t)}</b><small>${esc(e.s)}</small></button></li>`).join("")}</ul>`
    :`<p class="cc-leeg">Nog geen activiteit in de afgelopen 30 dagen.</p>`;
  const prf=(l,v,sub)=>`<div class="cc-pf"><small>${l}</small><b>${v==null?"—":v}</b><em>${sub}</em></div>`;
  const heeftOmzet=R.weken.some(w=>w.v>0);
  setTimeout(()=>{ccKaart();ccWeerLaad();ccZoekTeken();ccLiveCheck()},30);clearTimeout(CC.gzT);CC.gzT=setTimeout(()=>{ccMarkeerGezien();document.querySelectorAll('.cc-mi.nw').forEach(e=>e.classList.add('gz'))},8000);
  return `<div class="cc">
  <div class="cc-head"><div><h1>Control Center</h1><p>Het complete overzicht van je bedrijf. Alles wat je moet weten, op één plek.</p></div>
    <div class="cc-tools"><div class="cc-zoek"><span>${I.search}</span><input id="ccQ" type="search" autocomplete="off" placeholder="Zoek klant, adres, offerte, factuur…" value="${esc(CC.q)}" aria-label="Zoeken"><kbd>${/Mac|iP/.test(navigator.platform||"")?"⌘":"Ctrl"} K</kbd><div class="cc-zr" id="ccZr" hidden></div></div>
      ${"Notification" in window&&Notification.permission==="default"?`<button type="button" class="cc-ntf" data-cc="notif">${I.bell}Meldingen aan</button>`:""}<button type="button" class="cc-bel cc-snd${S().ccGeluid===false?" uit":""}" data-cc="geluid" aria-label="${S().ccGeluid===false?"Geluid aanzetten":"Geluid uitzetten"}" title="${S().ccGeluid===false?"Geluid staat uit":"Geluid bij nieuwe meldingen"}">${S().ccGeluid===false?sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>'):sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')}</button><button type="button" class="cc-bel" data-cc="naar:ccAdv" aria-label="${plural(S_.length,"signaal","signalen")}">${I.bell}${S_.length?`<i>${S_.length}</i>`:""}</button>
      <div class="cc-dag"><b>${esc(dag.charAt(0).toUpperCase()+dag.slice(1))}</b><small>${esc(dat)}</small></div>${ccWeerHtml()}</div></div>
  ${ccNuDoenHtml()}
  <div class="cc-grid">
    <div class="cc-main">
      <div class="cc-kpis">
        ${kpi("euro","k1","Omzet "+esc(K.maand.split(" ")[0]),eur0(K.omzet),K.pct==null?"excl. btw":(K.pct>=0?"▲ ":"▼ ")+Math.abs(K.pct)+"% t.o.v. vorige maand",K.pct==null?"":K.pct>=0?"up":"down","tab:inzichten")}
        ${kpi("facturen","k2","Openstaande facturen",eur0(K.open),K.nAch?plural(K.nAch,"vervallen","vervallen"):plural(K.nOpen,"factuur","facturen")+" open",K.nAch?"down":"","ff:"+(K.nAch?"achterstallig":"openstaand"))}
        ${kpi("checksq","k3","Actieve opdrachten",K.opdr,K.dezeWeek+" deze week aan de beurt","","tab:planning")}
        ${kpi("inbox","k4","Nieuwe aanvragen",K.aanvr,K.aanvrWeek?"▲ "+K.aanvrWeek+" deze week":"afgelopen 30 dagen",K.aanvrWeek?"up":"","tab:klanten")}
      </div>
      <div class="cc-row2">
        <section class="cc-adv" id="ccAdv"><div class="cc-ah"><span class="cc-aic">${I.spark}</span><div><b>MANSARD adviseert</b><small>${S_.length?`Nog ${S_.length} open · werk ze af van boven naar beneden`:"Alles is afgehandeld"}</small></div>${S_.length?`<span class="cc-cnt">${S_.length}</span>`:""}</div>${sig}</section>
        <div class="cc-rcol">
        <section class="cc-card cc-live"><div class="cc-ch"><div><b>${I.map}Live operatie</b><small>${P.length?`${plural(P.length,"adres","adressen")} vandaag · ${klaar} klaar`:"Vandaag geen adressen"}</small></div><button type="button" class="cc-link" data-cc="tab:vandaag">Naar Vandaag${I.right||""}</button></div>
          <div class="cc-map"><div class="rv-map" id="rvMap"><div class="rv-map-l">Kaart laden…</div></div></div>
          <div class="cc-leg"><span><i class="af"></i>Afgerond</span><span><i class="nu"></i>Volgende</span><span><i></i>Gepland</span><span><i class="bus"></i>Bus (live)</span></div></section>
        <section class="cc-card"><div class="cc-ch"><div><b>${I.planning}Vandaag – planning</b><small>${esc(longD(t))}</small></div><button type="button" class="cc-link" data-cc="tab:planning">Bekijk planning${I.right||""}</button></div>${plan}</section>
        </div>

      </div>
      <div class="cc-row3">

        <section class="cc-card"><div class="cc-ch"><div><b>${I.trend}Bedrijfsprestaties</b><small>Laatste 90 dagen, uit je facturen, offertes en klanten</small></div></div>
          <div class="cc-pfs">${prf("Conversie offertes",R.conv==null?null:R.conv+"%",R.conv==null?"te weinig offertes":R.ja+" van "+R.afgesl+" afgerond")}${prf("Klantbehoud",R.behoud==null?null:R.behoud+"%",R.behoud==null?"nog geen jaar historie":"klanten van >1 jaar actief")}${prf("Gem. betaaltijd",R.betaal==null?null:String(R.betaal).replace(".",",")+" d",R.betaal==null?"te weinig betalingen":"factuur → betaald")}</div>
          <div class="cc-charts"><div><h4>Omzet per week (excl. btw)</h4>${heeftOmzet?ccSpark(R.weken):`<p class="cc-leeg">Nog geen gefactureerde omzet in de laatste 8 weken.</p>`}</div><div><h4>Verdeling opdrachten</h4>${R.verd.length?ccDonut(R.verd):`<p class="cc-leeg">Nog geen actieve opdrachten.</p>`}</div></div></section>
      </div>
    </div>
    <aside class="cc-side">
      <section class="cc-card"><div class="cc-ch"><div><b>${I.spark}Snelle acties</b></div></div>
        <div class="cc-qa">${[["klanten","Nieuwe klant","nieuw:klant","N"],["offertes","Offerte maken","nieuw:offerte","O"],["facturen","Factuur maken","nieuw:factuur","F"],["phone","Klant bellen","bellen","⌘K"],["msg","Bericht sturen","tab:communicatie","C"],["planning","Planning openen","tab:planning","P"]].map(([ic,l,a,kb])=>`<button type="button" data-cc="${a}">${I[ic]}<span>${l}</span><kbd>${kb}</kbd></button>`).join("")}</div></section>
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
  if(k==="notif"){try{Notification.requestPermission().then(()=>render())}catch(e){}return}
  if(k==="geluid"){const aan=S().ccGeluid===false;saveSettings({ccGeluid:aan},aan?"Geluid staat aan":"Geluid staat uit").then(()=>{if(aan)ccPiep();render()});return}
  if(k==="herinner")return sendF(v,{herinnering:true});
  if(k==="stuur")return sendF(v);
  if(k==="plan")return openAfspraak(v);
  if(k==="ticket")return typeof openTickets==="function"?openTickets(v):go("communicatie");
  if(k==="klaar"){CC.sel=-1;CC.menu="";return ccZet(v,"klaar")}
  if(k==="terug")return ccZet(v,"terug");
  if(k==="menu"){CC.menu=CC.menu===v?"":v;return render()}
  if(k==="later"){const [w,...kk]=v.split(":"),key=kk.join(":"),d=new Date();
    if(w==="1")d.setHours(d.getHours()+1);else if(w==="mid"){if(d.getHours()>=13)d.setHours(d.getHours()+3);else d.setHours(13,0,0,0)}else if(w==="morgen"){d.setDate(d.getDate()+1);d.setHours(7,0,0,0)}else{d.setDate(d.getDate()+7);d.setHours(7,0,0,0)}
    CC.menu="";return ccZet(key,"later",d.toISOString())}
  if(k==="alles"){CC.alles=!CC.alles;return render()}
  if(k==="verborgen"){CC.toonVerborgen=!CC.toonVerborgen;return render()}
  if(k==="tijd"){const kl=ccKlant(v),inp=document.getElementById("ccT_"+v),tv=inp&&inp.value;if(!kl||!tv){if(inp)inp.focus();return}
    return save("klanten",kl.id,{...strip(kl),tijd:tv}).then(()=>toast("Tijd opgeslagen: "+tv)).catch(err)}
  if(k==="naar"){const el=document.getElementById(v);if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-cc]");
  if(!b||!b.closest(".cc")){if(CC.zoek&&!(e.target.closest&&e.target.closest(".cc-zoek"))){CC.zoek=false;ccZoekTeken()}return}
  if(e.target.closest("[data-stop]"))return;e.preventDefault();CC.zoek=false;ccZoekTeken();ccActie(b.dataset.cc)});
document.addEventListener("input",e=>{if(e.target&&e.target.id==="ccQ"){CC.q=e.target.value;CC.zoek=true;ccZoekTeken()}});
document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="ccQ"){CC.zoek=true;ccZoekTeken()}});
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&String(e.key).toLowerCase()==="k"&&!isMw()&&state.loaded){e.preventDefault();if(state.tab!=="control")go("control");setTimeout(()=>{const q=document.getElementById("ccQ");if(q){q.focus();q.select()}},40);return}
  /* sneltoetsen op het Control Center (niet tijdens typen of met een venster open) */
  if(state.tab==="control"&&!isMw()&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))&&!(typeof dlg!=="undefined"&&dlg.open)){
    const k=String(e.key).toLowerCase(),L=ccSignalen();
    if(/^[1-9]$/.test(k)&&L[Number(k)-1]){e.preventDefault();CC.sel=Number(k)-1;render();setTimeout(()=>{const el=document.querySelector('.cc-mi.sel');if(el)el.scrollIntoView({block:"nearest",behavior:"smooth"})},20);return}
    if(k==="e"&&L[CC.sel]){e.preventDefault();return ccActie("klaar:"+L[CC.sel].key)}
    if(k==="l"&&L[CC.sel]){e.preventDefault();return ccActie("later:morgen:"+L[CC.sel].key)}
    if(k==="enter"&&L[CC.sel]){e.preventDefault();return ccActie(L[CC.sel].go)}
    if(k==="escape"&&CC.sel>=0){CC.sel=-1;CC.menu="";return render()}
    const sn={n:"nieuw:klant",o:"nieuw:offerte",f:"nieuw:factuur",p:"tab:planning",c:"tab:communicatie"}[k];if(sn){e.preventDefault();return ccActie(sn)}}
  if(e.target&&e.target.id==="ccQ"){if(e.key==="Escape"){CC.zoek=false;e.target.blur();ccZoekTeken()}
    if(e.key==="Enter"){const f=document.querySelector("#ccZr .cc-zi");if(f){e.preventDefault();CC.zoek=false;ccActie(f.dataset.cc)}}}});

/* live: elke paar seconden de wachtrij nalopen (geluid/melding bij iets nieuws, teller in het tabblad) */
setInterval(()=>{try{ccLiveCheck()}catch(e){}},5000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.tab==="control")setTimeout(ccMarkeerGezien,8000)});
