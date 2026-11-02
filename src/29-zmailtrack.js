/* ---------- WAT HEEFT DE KLANT GEDAAN ----------
   Toont de eigen mailtracking (functions/mailtrack.js) per bericht, een tijdlijn per klant (Verzonden berichten op de klantkaart)
   en signalen in Overzicht. Alleen echte opens en kliks tellen; Apple Mail-voorladen en virusscanners staan apart. */
const TRK={act:null,actT:0,bezig:false};
const trkTijd=x=>{if(!x)return"";const d=new Date(x);if(isNaN(d))return"";const v=iso(d)===iso(today())?"vandaag":iso(d)===iso(addDays(today(),-1))?"gisteren":fmtD(iso(d));return v+" "+pad(d.getHours())+":"+pad(d.getMinutes())};
const trkBron=x=>[x.d,x.p].filter(Boolean).join(" · ");
const trkUniek=a=>[...new Set(a.filter(Boolean))];
/* regels onder een bericht */
function trkRegels(m){const out=[],O=Array.isArray(m.trkOpens)?m.trkOpens:[],K=Array.isArray(m.trkKliks)?m.trkKliks:[];
  const E=O.filter(x=>x.s==="echt"),V=O.filter(x=>x.s==="voorgeladen"),KE=K.filter(x=>x.s==="echt");
  if(m.bezorgdOp)out.push(`<span class="trk-ok">${I.check}Bezorgd ${esc(trkTijd(m.bezorgdOp))}</span>`);
  if(E.length){const bron=trkUniek(E.map(trkBron)).slice(0,3).join(", ");
    out.push(`<span class="trk-ok">${I.eye}Geopend ${esc(trkTijd(E[0].t))}${E.length>1?` · ${E.length}× (laatst ${esc(trkTijd(E[E.length-1].t))})`:""}${bron?` · ${esc(bron)}`:""}</span>`)}
  else if(V.length)out.push(`<span title="Apple Mail laadt mails vooraf in. Dat betekent niet dat de klant hem gelezen heeft.">${I.clock}Voorgeladen door Apple Mail · nog niet zeker gelezen</span>`);
  else if(m.bezorgdOp||m.verstuurdOp)out.push(`<span>${I.clock}Nog niet geopend</span>`);
  KE.slice(-4).forEach(k=>out.push(`<span class="trk-ok trk-klik">${I.right}Klik op <b>${esc(k.l||"link")}</b> ${esc(trkTijd(k.t))}${trkBron(k)?` · ${esc(trkBron(k))}`:""}</span>`));
  if(KE.length>4)out.push(`<span>+${KE.length-4} kliks</span>`);
  const sc=O.filter(x=>x.s==="scanner").length+K.filter(x=>x.s==="scanner").length;
  if(sc)out.push(`<span class="trk-scan" title="Automatische controle door een virusscanner of mailbeveiliging, niet door de klant">${I.shield||I.alert}${sc}× gecontroleerd door een scanner</span>`);
  return out}
/* ---- tijdlijn per klant ---- */
const TRK_ACT={portaal:["Klantportaal geopend","user"],tab:["Bekeek in het portaal","eye"],"factuur-geopend":["Factuur bekeken in het portaal","facturen"],pdf:["PDF geopend","note"],
  "betalen-start":["Op Betalen gedrukt","euro"],betaald:["Betaald","check"],"betalen-afgebroken":["Betaling afgebroken","alert"],"offerte-bekeken":["Offerte bekeken","offertes"],"offerte-teruggezien":["Getekende offerte teruggezien","offertes"],"offerte-geopend":["Offerte geopend in het portaal","offertes"],"offerte-getekend":["Offerte ondertekend","check"]};
const TRK_TAB={bezoeken:"Bezoeken",diensten:"Diensten",tickets:"Tickets",offertes:"Offertes",facturen:"Facturen",credits:"Credits",aanbevelen:"Aanbevelen",ik:"Mijn gegevens",contact:"Contact"};
function trkTijdlijnHtml(){return `<section class="trk-tl" id="trkTl"><div class="trk-tlh"><b>${I.spark||I.eye}Wat heeft de klant gedaan</b><small>Mails, klantportaal, betalen en offertes</small></div><div class="trk-tlb"><p class="subt">Laden…</p></div></section>`}
async function trkTijdlijnLaad(ids,ms){const box=document.querySelector("#trkTl .trk-tlb");if(!box)return;
  const ev=[];/* uit de berichten */
  (ms||[]).forEach(m=>{if(m.kanaal!=="email")return;const ow=m.onderwerp||"Mail";
    if(m.verstuurdOp||m.op)ev.push({t:m.verstuurdOp||m.op,ic:"send",tx:`Mail verstuurd: ${ow}`,kl:"mut"});
    (m.trkOpens||[]).filter(x=>x.s==="echt").forEach((x,i)=>ev.push({t:x.t,ic:"eye",tx:`${i?"Opnieuw geopend":"Geopend"}: ${ow}`,sub:trkBron(x)}));
    if(!m.trk&&m.gelezenOp)ev.push({t:m.gelezenOp,ic:"eye",tx:`Geopend: ${ow}`});
    (m.trkKliks||[]).filter(x=>x.s==="echt").forEach(x=>ev.push({t:x.t,ic:"right",tx:`Klik op ${x.l||"link"} in: ${ow}`,sub:trkBron(x),kl:"sterk"}));
    if(m.bouncedOp)ev.push({t:m.bouncedOp,ic:"alert",tx:`Niet afgeleverd: ${ow}`,kl:"rood"})});
  let fout="";if(LIVE&&typeof fbFn==="function"){try{const r=await fbFn("activiteit")({klantIds:ids});(r.data.items||[]).forEach(a=>{if(a.soort==="klik")return;const L=TRK_ACT[a.soort]||[a.soort,"note"];
      const extra=a.soort==="tab"?(TRK_TAB[a.tab]||a.tab):a.nummer?(a.soort==="pdf"?(a.doc==="offerte"?"offerte ":"factuur ")+a.nummer:a.nummer):"";
      ev.push({t:a.t,ic:L[1],tx:L[0]+(extra?": "+extra:""),sub:[a.via==="betaallink"?"via de betaallink in de mail":a.via==="portaal"?"via het klantportaal":"",a.methode,a.apparaat].filter(Boolean).join(" · "),kl:a.soort==="betaald"||a.soort==="offerte-getekend"?"groen":a.soort==="betalen-afgebroken"?"rood":a.soort==="betalen-start"?"sterk":""})})}
    catch(e){fout="Portaal- en betaalactiviteit kon niet worden geladen."}}
  ev.sort((a,b)=>String(b.t).localeCompare(String(a.t)));
  if(!ev.length){box.innerHTML=`<p class="subt">Nog niets. Zodra de klant een mail opent, klikt, in het portaal kijkt of betaalt, zie je het hier.</p>`;return}
  const toon=TRK.alle?ev:ev.slice(0,14);
  box.innerHTML=`<ol class="trk-ev">${toon.map(e=>`<li class="${e.kl||""}"><span class="trk-ei">${I[e.ic]||I.note}</span><div><b>${esc(e.tx)}</b>${e.sub?`<small>${esc(e.sub)}</small>`:""}</div><time>${esc(trkTijd(e.t))}</time></li>`).join("")}</ol>${ev.length>14?`<button type="button" class="linkbtn" id="trkMeer">${TRK.alle?"Minder tonen":`Alles tonen (${ev.length})`}</button>`:""}${fout?`<p class="subt">${esc(fout)}</p>`:""}`;
  const mb=document.getElementById("trkMeer");if(mb)mb.onclick=()=>{TRK.alle=!TRK.alle;trkTijdlijnLaad(ids,ms)}}
/* ---- signalen in Overzicht ---- */
function trkActLaad(){if(!LIVE||TRK.bezig||typeof fbFn!=="function"||Date.now()-TRK.actT<5*60e3)return;TRK.bezig=true;
  fbFn("activiteit")({dagen:14}).then(r=>{TRK.act=r.data.items||[];TRK.actT=Date.now();if(state.tab==="control")schedule()}).catch(()=>{TRK.actT=Date.now()}).finally(()=>{TRK.bezig=false})}
function trkSignalen(add,bel){const ti=iso(today()),K=id=>state.klanten.find(k=>k.id===id),nm=k=>k?cleanName(k.naam):"";
  const open=f=>f&&f.soort!=="offerte"&&!["betaald","concept","oninbaar"].includes(f.status)&&!f.incasso;
  /* 1. factuurmail meerdere keren geopend, nog niet betaald (na 2 dagen) */
  state.berichten.forEach(m=>{const mm=/^factuur:([\w-]+)/.exec(String(m.ref||""));if(!mm||!m.trk)return;const f=state.facturen.find(x=>x.id===mm[1]);if(!open(f))return;
    const E=(m.trkOpens||[]).filter(x=>x.s==="echt"),dd=Math.floor((Date.now()-Date.parse(m.verstuurdOp||m.op||0))/864e5),k=K(f.klantId);
    if(E.length>=2&&dd>=2)add({key:"trkfo:"+f.id,p:"hoog",ic:"eye",t:`Factuur ${f.nummer} ${E.length}× geopend, nog niet betaald`,u:`Laatst geopend ${trkTijd(E[E.length-1].t)}${E[E.length-1].d?" op "+E[E.length-1].d:""}. Een vriendelijk telefoontje helpt vaak.`,b:nm(k),leeftijd:dd,knop:"Open factuur",go:"f:"+f.id,acts:[bel&&bel(k)].filter(Boolean)});
    /* 2. na 5 dagen nog niet geopend: misschien in ongewenst */
    else if(!E.length&&!(m.trkOpens||[]).some(x=>x.s==="voorgeladen")&&dd>=5&&!m.bouncedOp)add({key:"trkfn:"+f.id,p:"laag",ic:"mail",t:`Factuurmail ${f.nummer} na ${dd} dagen nog niet geopend`,u:"Misschien in ongewenste mail beland of over het hoofd gezien. Even checken of sturen via WhatsApp?",b:nm(k),leeftijd:dd,knop:"Open factuur",go:"f:"+f.id,acts:[bel&&bel(k)].filter(Boolean)})});
  trkActLaad();const A=TRK.act||[];
  /* 3. iDEAL gestart of afgebroken, nog niet betaald */
  const perF={};A.forEach(a=>{if(!a.nummer)return;const x=perF[a.nummer]=perF[a.nummer]||{k:a.klantId,start:null,af:null,bet:null,offBek:0,offT:null};
    if(a.soort==="betalen-start"&&(!x.start||a.t>x.start))x.start=a.t;if(a.soort==="betalen-afgebroken"&&(!x.af||a.t>x.af))x.af=a.t;if(a.soort==="betaald")x.bet=a.t;
    if(a.soort==="offerte-bekeken"||a.soort==="offerte-geopend"){x.offBek++;if(!x.offT||a.t>x.offT)x.offT=a.t}});
  Object.entries(perF).forEach(([nr,x])=>{const f=state.facturen.find(y=>y.nummer===nr);const k=K(x.k);
    if(f&&f.soort!=="offerte"&&open(f)&&!x.bet&&(x.af||x.start)&&Date.now()-Date.parse(x.af||x.start)>30*60e3)
      add({key:"trkib:"+f.id+":"+String(x.af||x.start).slice(0,10),p:"hoog",ic:"euro",t:x.af?`Betaling van ${nr} afgebroken`:`Op Betalen gedrukt bij ${nr}, niet afgerond`,u:`${trkTijd(x.af||x.start)}. De klant wilde betalen maar het is niet gelukt. Even bellen of de link opnieuw sturen?`,b:nm(k),leeftijd:0,knop:"Open factuur",go:"f:"+f.id,acts:[bel&&bel(k)].filter(Boolean)});
    /* 4. offerte vaak bekeken, nog niet getekend */
    if(f&&f.soort==="offerte"&&f.status==="verstuurd"&&x.offBek>=3)add({key:"trkob:"+f.id,p:"hoog",ic:"offertes",t:`Offerte ${nr} ${x.offBek}× bekeken, nog niet getekend`,u:`Laatst bekeken ${trkTijd(x.offT)}. De klant is geïnteresseerd: een goed moment om te bellen.`,b:nm(k),leeftijd:0,knop:"Open offerte",go:"f:"+f.id,acts:[bel&&bel(k)].filter(Boolean)})})}
