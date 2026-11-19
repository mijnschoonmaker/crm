/* ---------- Overzicht (nieuw, eerst alleen in de demo) ----------
   De ochtendbriefing van een vijfsterrenhotel: wie zijn vandaag onze gasten en wat hebben ze nodig, wat vraagt aandacht,
   waar is het team, welke momenten kunnen we gebruiken om te verrassen en hoe gaat het met de service.
   Leest alleen bestaande gegevens (planning, hospitality, meldingen, ploeg, beurten, tickets) en slaat niets op.
   Live blijft het huidige overzicht staan tot dit is goedgekeurd. Met de knop "Klassiek overzicht" zie je het oude. */
const OV2={oud:(()=>{try{return localStorage.getItem("ms.ov2.oud")==="1"}catch(e){return false}})()};
const OV2I={cadeau:sv('<rect x="3.5" y="8" width="17" height="12.5" rx="1.8"/><path d="M12 8v12.5M3.5 12.5h17M12 8c-1.5-3.5-5.5-3.5-5.5-1S10 8 12 8zm0 0c1.5-3.5 5.5-3.5 5.5-1S14 8 12 8z"/>'),hart:sv('<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>'),ster:sv('<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>')};
function ov2Aan(){return true}
function ov2Hosp(k){const L=(k.hosp||[]).map(x=>String(x&&x.t||"").trim()).filter(Boolean);return L.slice(0,3).join(" · ")}
function ov2Jarig(k,van,dagen){const g=String(k.geboortedatum||"");if(!/^\d{4}-\d{2}-\d{2}/.test(g))return null;
  for(let i=0;i<dagen;i++){const d=addDays(van,i);if(iso(d).slice(5)===g.slice(5,10))return {d,leeftijd:d.getFullYear()-Number(g.slice(0,4))}}return null}
function ov2Jubileum(k,van,dagen){const a=String(k.aangemaakt||"").slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(a))return null;
  for(let i=0;i<dagen;i++){const d=addDays(van,i),j=d.getFullYear()-Number(a.slice(0,4));if(j>=1&&iso(d).slice(5)===a.slice(5))return {d,jaar:j}}return null}
function ov2Klacht(k){const g=iso(addDays(today(),-60));return (state.tickets||[]).some(t=>t.klantId===k.id&&/kwaliteit|klacht/i.test(String(t.categorie||t.cat||""))&&String(t.gemaakt||t.op||t.datum||"")>=g)}
function ov2Sterren(b){const s=b&&b.beoordeling&&Number(b.beoordeling.sterren);return s>0?s:0}
function vOverzicht2(){const t=today(),ti=iso(t),P=ccPlanning(),S_=ccSignalen().slice().sort((a,b)=>(a.p==="kritiek"?0:a.p==="hoog"?1:2)-(b.p==="kritiek"?0:b.p==="hoog"?1:2));
  const klaar=P.filter(x=>x.st[1]==="Afgerond").length,bezig=P.filter(x=>x.st[0]==="soon").length,M=typeof plMensen==="function"?plMensen():[];
  const kritiek=S_.filter(m=>m.p==="kritiek").length,omzet=state.beurten.filter(b=>b.datum===ti).reduce((a,b)=>a+beurtVerdiend(b),0),
    verwacht=P.reduce((a,x)=>a+(x.st[1]==="Afgerond"?0:(typeof prijsMee==="function"?prijsMee(x.k,ti):Number(x.k.prijs)||0)),0);
  const achter=P.some(x=>x.st[1]==="Niet afgemeld");
  const kleur=kritiek||achter?"rood":S_.length?"let":"ok",zin=[plural(P.length,"bezoek","bezoeken"),M.length?plural(M.length,"medewerker","medewerkers")+(bezig||M.some(m=>m.live)?" onderweg":""):"",S_.length?plural(S_.length,"aandachtspunt","aandachtspunten"):"geen aandachtspunten",achter?"loopt achter":kritiek?plural(kritiek,"punt","punten")+" dringend":"alles op schema"].filter(Boolean).join(" · ");
  const dag=t.toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"});
  const tel=(l,v,s)=>`<div class="kkh-t"><span>${l}</span><b>${v}</b><small>${s||""}</small></div>`;
  /* gasten van vandaag */
  const gast=x=>{const k=x.k,h=ov2Hosp(k),lbl=[];
    if(typeof isEersteKeer==="function"&&isEersteKeer(k))lbl.push("Eerste bezoek");
    const j=ov2Jarig(k,t,1);if(j)lbl.push("Jarig vandaag");const ju=ov2Jubileum(k,t,1);if(ju)lbl.push(plural(ju.jaar,"jaar","jaar")+" klant");
    if(ov2Klacht(k))lbl.push("Eerder een klacht");
    const wie=typeof plWie==="function"?plWie(k,ti,x.i,P.length):"";
    return `<button type="button" class="ov2-g st-${x.st[0]}" data-cc="klant:${esc(k.id)}"><span class="ov2-gt"><b>${esc(x.tijd||"—")}</b><small>${esc(wie||"")}</small></span>
      <span class="ov2-gm"><b>${esc(ccNaam(k))}</b>${lbl.length?lbl.map(l=>`<i class="ov2-goud">${esc(l)}</i>`).join(""):""}<small>${esc(x.dienst)} · ${esc([jobAddrObj(k).adres,k.plaats].filter(Boolean).join(", "))}</small>${h?`<em>${esc(h)}</em>`:""}</span>
      <span class="ov2-gs ${x.st[0]}">${x.st[0]==="ok"?I.check:x.st[0]==="soon"?'<i class="cc-puls"></i>':""}${esc(x.st[1])}${x.st[0]==="ok"&&x.info?`<small>${esc(x.info.split(" · ")[0])}</small>`:""}</span></button>`};
  const gasten=P.length?`<div class="ov2-gl">${P.map(gast).join("")}</div>`:`<p class="ov2-leeg">Vandaag geen bezoeken gepland.</p>`;
  /* aandacht nodig */
  const sigActs=m=>(m.acts||[]).filter(Boolean).slice(0,2).map(a=>a.href?`<a class="ov2-ab" href="${esc(a.href)}">${I[a.ic]||""}${esc(a.l)}</a>`:a.cc?`<button type="button" class="ov2-ab" data-cc="${esc(a.cc)}">${I[a.ic]||""}${esc(a.l)}</button>`:"").join("");
  const aandacht=S_.length?`<div class="ov2-al">${S_.slice(0,OV2.alleS?99:6).map(m=>`<div class="ov2-a p-${esc(m.p||"")}"><i class="ov2-ad"></i><span class="ov2-am"><b>${esc(m.t||"")}</b>${m.u?`<small>${esc(m.u)}</small>`:""}</span><span class="ov2-aa">${sigActs(m)}</span></div>`).join("")}</div>${S_.length>6?`<button type="button" class="ov2-meer" data-ov2="alleS">${OV2.alleS?"Minder tonen":"Alle "+S_.length+" tonen"}</button>`:""}`
    :`<p class="ov2-leeg ok">${I.check}Niets dat aandacht vraagt. Alles is afgehandeld.</p>`;
  /* het team */
  const team=M.length?`<div class="ov2-tl">${M.map(m=>{const s=plStatus(m),open=m.stops.filter(z=>!z.done),vlg=open[0];return `<div class="ov2-t"><span class="ov2-ta" style="--k:${esc(m.kleur||"#252c3c")}">${esc(m.naam.charAt(0))}</span>
      <span class="ov2-tm"><b>${esc(m.naam)}</b><small class="${esc(s[0])}">${esc(s[1])}</small>${vlg?`<em>Hierna: ${esc(ccNaam(vlg.k))}${vlg.k.tijd?" · "+esc(vlg.k.tijd):""}</em>`:""}</span>
      <span class="ov2-tp"><b>${m.klaar}/${m.stops.length}</b><span class="ov2-bar"><i style="width:${m.stops.length?Math.round(m.klaar/m.stops.length*100):0}%"></i></span></span>
      <button type="button" class="ov2-ab" data-cc="mw:${esc(m.naam)}" title="Op de kaart">${I.map}</button></div>`}).join("")}</div>`
    :`<p class="ov2-leeg">Vandaag is er nog niemand ingedeeld.</p>`;
  /* momenten om te verrassen */
  const act=state.klanten.filter(k=>k.actief!==false&&!k.prospect&&!k.hoofdKlantId),mom=[];
  act.forEach(k=>{const j=ov2Jarig(k,t,7);if(j)mom.push({d:j.d,ic:"cadeau",t:`${ccNaam(k)} is ${iso(j.d)===ti?"vandaag":"op "+fmtD(iso(j.d))} jarig`,s:j.leeftijd>0&&j.leeftijd<110?"wordt "+j.leeftijd:"Stuur een felicitatie",k});
    const ju=ov2Jubileum(k,t,7);if(ju)mom.push({d:ju.d,ic:"hart",t:`${ccNaam(k)}: ${plural(ju.jaar,"jaar","jaar")} klant`,s:(iso(ju.d)===ti?"vandaag":"op "+fmtD(iso(ju.d)))+" · een kaartje of attentie",k})});
  const g14=iso(addDays(t,-14));state.beurten.filter(b=>b.datum>=g14&&ov2Sterren(b)===5).slice(0,6).forEach(b=>{const k=ccKlant(b.klantId);if(k)mom.push({d:parse(b.datum),ic:"ster",t:`${ccNaam(k)} gaf 5 sterren`,s:"Bedank voor het bezoek van "+fmtD(b.datum),k})});
  if(typeof kwMomenten==="function")try{kwMomenten(mom,t)}catch(e){console.error(e)}
  /* weggeklikte momenten blijven weg (op dit apparaat) */
  const momWeg=(()=>{let L=[];try{L=JSON.parse(localStorage.getItem("ms.ov2.weg")||"[]")}catch(e){}return new Set([...L,...(Array.isArray(S().ovMomWeg)?S().ovMomWeg:[])])})();
  mom.forEach(m=>{m.key=m.ic+":"+m.k.id+":"+iso(m.d)});for(let i=mom.length-1;i>=0;i--)if(momWeg.has(mom[i].key))mom.splice(i,1);
  mom.sort((a,b)=>a.d-b.d);
  const momenten=mom.length?`<div class="ov2-ml">${mom.slice(0,OV2.alleM?40:5).map(m=>`<div class="ov2-mw"><button type="button" class="ov2-m" data-cc="klant:${esc(m.k.id)}"><span class="ov2-mi">${OV2I[m.ic]||OV2I.hart}</span><span><b>${esc(m.t)}</b><small>${esc(m.s)}</small></span></button><button type="button" class="ov2-mx" data-ov2="weg:${esc(m.key)}" aria-label="Weghalen" title="Weghalen">${I.x}</button></div>`).join("")}</div>${mom.length>5?`<button type="button" class="ov2-meer" data-ov2="alleM">${OV2.alleM?"Minder tonen":"Alle "+mom.length+" tonen"}</button>`:""}`
    :`<p class="ov2-leeg">Deze week geen verjaardagen, jubilea of nieuwe 5-sterrenbeoordelingen.</p>`;
  /* service */
  const per=(a,b)=>state.beurten.filter(x=>x.datum>=a&&x.datum<b&&ov2Sterren(x)),gem=L=>L.length?Math.round(L.reduce((s,x)=>s+ov2Sterren(x),0)/L.length*10)/10:null;
  const n30=per(iso(addDays(t,-30)),iso(addDays(t,1))),v30=per(iso(addDays(t,-60)),iso(addDays(t,-30))),g1=gem(n30),g0=gem(v30);
  const tkOpen=(state.tickets||[]).filter(x=>x.status!=="opgelost").length,R=ccPrestaties();
  const pijl=(a,b,hoogGoed=true)=>a==null||b==null||a===b?"":`<i class="ov2-pijl ${(a>b)===hoogGoed?"op":"af"}">${a>b?"▲":"▼"}</i>`;
  const svc=`<div class="kkh-tg kk-kern ov2-svc">${tel("Beoordeling",g1==null?"—":String(g1).replace(".",",")+" / 5"+pijl(g1,g0),n30.length?plural(n30.length,"beoordeling","beoordelingen")+" · 30 dagen":"nog geen beoordelingen")}${tel("Open tickets",tkOpen,tkOpen?"wacht op antwoord":"alles beantwoord")}${tel("Betaalt binnen",R.betaal==null?"—":String(R.betaal).replace(".",",")+" d","gemiddeld · 90 dagen")}${tel("Klantbehoud",R.behoud==null?"—":R.behoud+"%","klanten van een jaar of langer")}</div>`;
  const kop=(t2,sub,extra)=>`<div class="ov2-h"><div><b>${t2}</b>${sub?`<small>${sub}</small>`:""}</div>${extra||""}</div>`;
  setTimeout(()=>{ccWeerLaad();ccLiveCheck()},30);
  return `<div class="cc ov2">
  <div class="ov2-top"><div><h1>Overzicht</h1><p>${esc(dag.charAt(0).toUpperCase()+dag.slice(1))}</p></div><div class="ov2-tools cc-tools">${"Notification" in window&&Notification.permission==="default"?`<button type="button" class="cc-ntf" data-cc="notif">${I.bell}Meldingen aan</button>`:""}<button type="button" class="cc-bel cc-snd${S().ccGeluid===false?" uit":""}" data-cc="geluid" aria-label="${S().ccGeluid===false?"Geluid aanzetten":"Geluid uitzetten"}" title="${S().ccGeluid===false?"Geluid staat uit":"Geluid bij nieuwe meldingen"}">${S().ccGeluid===false?sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>'):sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')}</button>${ccBelKnop()}${ccTkKnop()}${typeof vrKnop==="function"?vrKnop():""}${ccBetKnop()}${ccPortKnop()}${ccWeerHtml()}</div></div>
  <section class="kp ow-kern ov2-dag"><div class="ov2-zin"><i class="ov2-stip ${kleur}"></i><b>Vandaag</b> ${esc(zin)}</div>
    <div class="kkh-tg kk-kern">${tel("Bezoeken",P.length,klaar?klaar+" klaar":"nog niets afgemeld")}${tel("Bezig",bezig,bezig?"op dit moment":"")}${tel("Aandacht",S_.length,kritiek?kritiek+" dringend":S_.length?"op te pakken":"alles afgehandeld")}${tel("Omzet vandaag",eur0(omzet),verwacht?"nog "+eur0(verwacht)+" te gaan":"")}</div></section>
  <div class="ov2-grid">
    <div class="ov2-col">
      <section class="ov2-s" id="ov2Gast">${kop("Gasten van vandaag",P.length?`${klaar} van ${P.length} geweest`:"",`<button type="button" class="cc-link" data-cc="tab:planning">Planning${I.right||""}</button>`)}${gasten}</section>
      <section class="ov2-s">${kop("Momenten om te verrassen","Verjaardagen, jubilea en 5-sterrenbeoordelingen")}${momenten}</section>
    </div>
    <div class="ov2-col">
      ${typeof mkStroomHtml==="function"?`<div class="ov2-stroom">${mkStroomHtml()}</div>`:""}
      <section class="ov2-s" id="ov2Aandacht">${kop("Aandacht nodig",S_.length?"Van boven naar beneden afwerken":"")}${aandacht}</section>
      <section class="ov2-s">${kop("Het team",M.length?plural(M.length,"medewerker","medewerkers")+" vandaag":"",`<button type="button" class="cc-link" data-cc="tab:vandaag">Kaart${I.right||""}</button>`)}${team}</section>
    </div>
  </div>
  <section class="kp ow-kern ov2-service">${kop("Hoe gaat het met de service?","")}${svc}</section>
  </div>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-ov2]");if(!b)return;e.preventDefault();const v=b.dataset.ov2;
  if(v==="oud"){OV2.oud=!OV2.oud;try{localStorage.setItem("ms.ov2.oud",OV2.oud?"1":"0")}catch(e){}}else if(v==="alleS")OV2.alleS=!OV2.alleS;else if(v==="alleM")OV2.alleM=!OV2.alleM;else if(v.startsWith("weg:")){const key=v.slice(4);try{const L=JSON.parse(localStorage.getItem("ms.ov2.weg")||"[]");L.push(key);localStorage.setItem("ms.ov2.weg",JSON.stringify(L.slice(-300)))}catch(e){}
    /* ook in de bedrijfsinstellingen, zodat het op alle apparaten weg blijft */
    try{const W=[...(Array.isArray(S().ovMomWeg)?S().ovMomWeg:[]).filter(x=>x!==key),key].slice(-300);state.settings={...state.settings,ovMomWeg:W};save("instellingen","bedrijf",{...state.settings}).catch(()=>{})}catch(e){}}if(typeof render==="function")render()});
