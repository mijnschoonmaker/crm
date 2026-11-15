/* ---------- VRAGEN VAN NIET-KLANTEN (via de prijscalculator op de website) ----------
   Los van de klant-tickets: geen klantkaart, eigen icoon met teller naast de tickets.
   Afgesloten vragen worden na 30 dagen automatisch gewist (server, vragenOpruimen). */
I.vraag=sv('<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-4.5 3.5V17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M10 9.2a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9v.4"/><circle cx="12" cy="14.3" r=".6" fill="currentColor" stroke="none"/>');
state.vragen=state.vragen||[];
let vrUnsub=null,vrOpen=null,vrVorig=null;
function liveVragen(){if(!LIVE||vrUnsub)return;
  vrUnsub=fsDb().collection("vragen").orderBy("laatst","desc").limit(200).onSnapshot(s=>{
    state.vragen=s.docs.map(d=>({id:d.id,...d.data()}));
    try{vrVernieuw()}catch(e){}if(vrOpen)try{vrLijstTeken()}catch(e){}
    if(s.metadata&&s.metadata.fromCache)return;
    const nu_=Object.fromEntries(state.vragen.map(v=>[v.id,Number(v.ongelezenTeam)||0]));
    if(vrVorig!==null&&state.vragen.some(v=>v.laatsteVan==="bezoeker"&&nu_[v.id]>(vrVorig[v.id]||0)&&!(vrOpen&&vrOpen.id===v.id&&document.hasFocus()))){
      try{if(typeof tkGeluid==="function")tkGeluid()}catch(e){}const v=state.vragen.find(x=>x.laatsteVan==="bezoeker"&&nu_[x.id]>(vrVorig[x.id]||0));if(v)toast("Nieuwe vraag van "+(v.naam||"de website"))}
    vrVorig=nu_},e=>console.error("vragen",e))}
if(LIVE)setTimeout(function w(){state.loaded?liveVragen():setTimeout(w,700)},1100);
/* icoon naast de tickets: rood = nieuw bericht, grijs = nog open */
function vrKnop(){const V=state.vragen||[],n=V.filter(v=>Number(v.ongelezenTeam)>0).length,o=V.filter(v=>v.status!=="opgelost").length;
  return `<button type="button" class="cc-bel cc-tk${n?" nieuw":""}" id="ccVr" data-vr="open" aria-label="Vragen van niet-klanten${n?", "+n+" nieuw":o?", "+o+" open":""}" title="Vragen van niet-klanten">${I.vraag}${n?`<i>${n}</i>`:o?`<i class="grijs">${o}</i>`:""}</button>`}
function vrVernieuw(){const el=document.getElementById("ccVr");if(el)el.outerHTML=vrKnop()}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-vr=open]");if(!b)return;e.preventDefault();openVragen()});
const VR_ST={open:["brand","Open"],opgelost:["ok","Afgesloten"]};
function openVragen(id){
  if(!LIVE)return toast("Vragen werken in de live versie");
  vrOpen={id:id||"",filter:"open",unsub:null,berichten:[]};
  openDlg(`<div class="dlg-head"><span class="objic big tk-ic">${I.vraag}</span><div style="min-width:0;flex:1"><h3>Vragen van niet-klanten</h3><div class="subt">Via het offerte-aanvraagformulier op je website · los van de klant-tickets · afgesloten vragen worden na 30 dagen gewist</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="chx"><div class="chx-l"><div class="seg tk-seg" role="group" id="vrSeg"></div><label class="chx-z">${I.search}<input type="search" id="vrZ" placeholder="Zoek naam, e-mail of vraag…" autocomplete="off"></label><div id="vrL"></div></div><div class="chx-r" id="vrR"></div></div>`,{xwide:true});
  dlg.addEventListener("close",()=>{if(vrOpen&&vrOpen.unsub)vrOpen.unsub();vrOpen=null},{once:true});
  vrSegTeken();$("#vrZ").oninput=vrLijstTeken;vrLijstTeken();
  const eerste=id||(!matchMedia("(max-width:760px)").matches&&((state.vragen.find(v=>Number(v.ongelezenTeam)>0)||state.vragen.find(v=>v.status!=="opgelost")||{}).id));
  if(eerste)vrDetail(eerste);else $("#vrR").innerHTML=`<p class="subt chx-leeg">Geen open vragen.<br>Vragen van bezoekers van je website komen hier binnen.</p>`}
function vrSegTeken(){const S_=$("#vrSeg");if(!S_||!vrOpen)return;
  S_.innerHTML=[["open","Open"],["opgelost","Afgesloten"],["alle","Alle"]].map(([v,l])=>`<button type="button" data-vrf="${v}" aria-pressed="${v===vrOpen.filter}">${l}</button>`).join("");
  S_.querySelectorAll("[data-vrf]").forEach(b=>b.onclick=()=>{vrOpen.filter=b.dataset.vrf;vrSegTeken();vrLijstTeken()})}
function vrLijstTeken(){const L=$("#vrL");if(!L||!vrOpen)return;const q=(($("#vrZ")||{}).value||"").trim().toLowerCase();
  const rij=(state.vragen||[]).filter(v=>(vrOpen.filter==="alle"||(vrOpen.filter==="opgelost"?v.status==="opgelost":v.status!=="opgelost"))&&(!q||[v.naam,v.email,v.telefoon,v.laatsteTekst,v.nummer].join(" ").toLowerCase().includes(q)));
  L.innerHTML=rij.map(v=>`<button type="button" class="chx-i${v.id===vrOpen.id?" act":""}${Number(v.ongelezenTeam)>0?" nieuw":""}" data-vri="${esc(v.id)}"><span class="chx-av" style="--h:${hue(v.naam||"")}">${esc(initials(v.naam||"?"))}</span><span class="chx-t"><b>${esc(v.naam||"Bezoeker")}</b><small>${esc(String(v.laatsteTekst||"").slice(0,60))}</small></span><span class="chx-m"><small>${v.laatst?esc(tkTijd(v.laatst)):""}</small>${Number(v.ongelezenTeam)>0?`<i>${v.ongelezenTeam}</i>`:""}</span></button>`).join("")
    ||`<p class="subt" style="padding:20px 10px;text-align:center">${q?"Niets gevonden":vrOpen.filter==="opgelost"?"Geen afgesloten vragen":"Geen open vragen"}</p>`;
  L.querySelectorAll("[data-vri]").forEach(b=>b.onclick=()=>vrDetail(b.dataset.vri))}
function vrDetail(id){if(!vrOpen)return;if(vrOpen.unsub)vrOpen.unsub();vrOpen.id=id;vrOpen.berichten=[];
  const v=(state.vragen||[]).find(x=>x.id===id)||{id,naam:"Bezoeker"};vrLijstTeken();
  const wa=v.telefoon&&typeof waLink==="function"?waLink(v.telefoon,""):"";
  $("#vrR").innerHTML=`<div class="chx-h"><button type="button" class="iconbtn sm chx-terug" id="vrTerug" aria-label="Terug">${I.left||"‹"}</button><span class="chx-av big" style="--h:${hue(v.naam||"")}">${esc(initials(v.naam||"?"))}</span><div style="flex:1;min-width:0"><b>${esc(v.naam||"Bezoeker")}</b><small>${esc(v.nummer||"")} · nog geen klant${v.email?" · "+esc(v.email):""}${v.telefoon?" · "+esc(v.telefoon):""}</small></div>
      ${v.telefoon?`<a class="btn small chx-hb" href="tel:${esc(v.telefoon)}" title="Bellen">${I.phone||""}<span>Bellen</span></a>`:""}${wa?`<a class="btn small chx-hb" href="${esc(wa)}" target="_blank" rel="noopener" title="WhatsApp">${I.chat||I.bericht||""}<span>WhatsApp</span></a>`:""}<button type="button" class="small chx-hb" id="vrKlant" title="Klant van maken">${I.user||I.plus}<span>Klant van maken</span></button></div>
    <div class="tk-stbar"><span>Status</span><div class="seg" role="group">${Object.entries(VR_ST).map(([s,[c,l]])=>`<button type="button" data-vrs="${s}" aria-pressed="${(v.status||"open")===s}"><i class="tk-dot" style="background:var(--${c})"></i>${l}</button>`).join("")}</div></div>
    <div class="chx-b" id="vrB"><p class="subt" style="margin:auto">Laden…</p></div>
    <div class="chx-in"><textarea id="vrT" rows="1" placeholder="Antwoord aan ${esc(voornaam(v.naam||""))}…"></textarea><button type="button" class="primary chx-hb" id="vrS">${I.send}<span>Versturen</span></button></div>
    <small class="help" style="margin:4px 4px 0">${v.email?"Je antwoord verschijnt alleen in het ticketscherm op de website. "+esc(v.email)+" krijgt een seintje per e-mail met een knop naar het gesprek.":"Geen e-mailadres: je antwoord verschijnt alleen in het venster op de website. Bel of app als het dringend is."}</small>`;
  $("#vrTerug").onclick=()=>{if(vrOpen.unsub)vrOpen.unsub();vrOpen.unsub=null;vrOpen.id="";$("#vrR").innerHTML=`<p class="subt chx-leeg"></p>`;vrLijstTeken()};
  form.querySelectorAll("[data-vrs]").forEach(b=>b.onclick=()=>vrStatus(v,b.dataset.vrs));
  $("#vrKlant").onclick=()=>vrNaarKlant(v);
  const t=$("#vrT"),groei=()=>{t.style.height="auto";t.style.height=Math.min(t.scrollHeight,140)+"px"};t.oninput=groei;t.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();vrVerstuur(v)}};$("#vrS").onclick=()=>vrVerstuur(v);
  vrOpen.unsub=fsDb().collection("vraagBerichten").where("vraagId","==",id).onSnapshot(s=>{if(!vrOpen||vrOpen.id!==id)return;
    vrOpen.berichten=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.op).localeCompare(String(b.op)));vrBerichtenTeken();
    fsDb().doc("vragen/"+id).set({ongelezenTeam:0,gezienTeam:new Date().toISOString()},{merge:true}).catch(()=>{})},e=>{console.error(e);$("#vrB").innerHTML=`<p class="subt" style="margin:auto">Laden lukte niet</p>`});
  setTimeout(()=>t.focus(),60)}
function vrBerichtenTeken(){const b=$("#vrB");if(!b||!vrOpen)return;let dag="";
  b.innerHTML=vrOpen.berichten.map(m=>{const d=new Date(m.op).toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"});const sep=d!==dag?(dag=d,`<div class="chx-dag"><span>${esc(d)}</span></div>`):"";
    if(m.systeem)return sep+`<div class="tk-sys2">${esc(m.tekst)} · ${new Date(m.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}</div>`;
    return sep+`<div class="chx-m2 ${m.van==="team"?"ik":"zij"}"><div class="chx-bb">${esc(m.tekst||"").replace(/\n/g,"<br>")}</div><small>${m.van==="team"&&m.doorNaam?esc(m.doorNaam)+" · ":""}${new Date(m.op).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}</small></div>`}).join("")||`<p class="subt" style="margin:auto">Nog geen berichten</p>`;
  b.scrollTop=b.scrollHeight}
async function vrVerstuur(v){const tx=$("#vrT"),s=$("#vrS"),tekst=tx.value.trim();if(!tekst)return;s.disabled=true;
  try{const op=new Date().toISOString(),naam=typeof tkNaam==="function"?tkNaam():"";
    await fsDb().collection("vraagBerichten").doc(newId("vb")).set({vraagId:v.id,van:"team",tekst,op,door:(state.me&&state.me.email)||"",doorNaam:naam});
    await fsDb().doc("vragen/"+v.id).set({laatst:op,laatsteTekst:tekst.slice(0,200),laatsteVan:"team",ongelezenTeam:0,gezienTeam:op,ongelezenBezoeker:firebase.firestore.FieldValue.increment(1)},{merge:true});
    tx.value="";tx.style.height="auto";
    fbFn("vraagMelding")({vraagId:v.id}).then(r=>{if(r&&r.data&&r.data.mail)toast("Verstuurd · seintje gemaild naar "+v.email)}).catch(e=>console.error("vraagMelding",e))}
  catch(e){err(e)}finally{s.disabled=false;tx.focus()}}
async function vrStatus(v,st){const cur=(state.vragen||[]).find(x=>x.id===v.id)||v;if((cur.status||"open")===st)return;const op=new Date().toISOString();
  try{await fsDb().doc("vragen/"+v.id).set({status:st,...(st==="opgelost"?{opgelostOp:op}:{})},{merge:true});
    await fsDb().collection("vraagBerichten").doc(newId("vb")).set({vraagId:v.id,van:"team",systeem:true,tekst:st==="opgelost"?"Vraag afgesloten (wordt na 30 dagen gewist)":"Vraag weer geopend",op});
    form.querySelectorAll("[data-vrs]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.vrs===st));toast((cur.nummer||"Vraag")+" · "+VR_ST[st][1])}catch(e){err(e)}}
/* wordt de vrager klant: klantkaart aanmaken met naam, e-mail en telefoon (en de vraag als notitie); daarna gaat het verder als gewone klant */
async function vrNaarKlant(v){
  const dub=state.klanten.find(k=>(v.email&&String(k.email||"").toLowerCase()===String(v.email).toLowerCase())||(v.telefoon&&String(k.telefoon||"").replace(/\D/g,"")===String(v.telefoon).replace(/\D/g,"")));
  if(dub){if(await vraag("Al een klant","Er is al een klant met dit e-mailadres of telefoonnummer: <b>"+esc(cleanName(dub.naam))+"</b>. Die openen?","Openen")){dlg.close();setTimeout(()=>openKlantView(dub.id),80)}return}
  if(!(await vraag("Klant van maken",esc(v.naam||"Deze vrager")+" wordt een nieuwe klant (prospect) met naam, e-mail en telefoon. De vraag zet ik als notitie op de klantkaart.","Klant maken")))return;
  try{const id=newId("k"),eerste=(vrOpen&&vrOpen.berichten||[]).find(m=>m.van==="bezoeker"&&!m.systeem);
    const k={naam:v.naam||"Nieuwe klant",contact:"",adres:"",postcode:"",plaats:"",email:v.email||"",telefoon:v.telefoon||"",notities:eerste?("Vraag via de website: "+eerste.tekst):"",dienst:typeof HD==="function"?HD():"Glasbewassing",prijs:0,frequentie:8,duur:30,ronde:"",laatst:"",gepland:"",tijd:"",aanbieden:false,
      bron:"website",nieuwAangemeld:true,binnen:false,soort:"particulier",actief:true,prospect:true,akkoord:false,aangemaakt:iso(today()),log:[{datum:iso(today()),tekst:"Klant gemaakt van vraag "+(v.nummer||"")+" via de website"}],objecten:[]};
    await save("klanten",id,k);await fsDb().doc("vragen/"+v.id).set({klantId:id},{merge:true});toast(cleanName(k.naam)+" is nu klant");dlg.close();setTimeout(()=>openKlantView(id),120)}catch(e){err(e)}}
