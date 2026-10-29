/* ---------- VvE: checklist en opleverfoto bij het afmelden ----------
   Bij een VvE (klant.soort === "vve") vraagt afmelden eerst wat er is gedaan (per ruimte) en een foto uit de camera.
   Dat komt op de beurt te staan (taken, fotos, meldingen) en is zichtbaar in het klantportaal en op het bewonersbord. */
const VVE_STD=["Entree en deuren","Trappenhuis","Lift","Bergingsgang"];
/* standaard checklist voor nieuwe VvE's: in te stellen bij Instellingen › Klantportaal VvE */
const vveStd=()=>{const t=state.settings&&state.settings.vveTakenStd;return Array.isArray(t)&&t.length?t:VVE_STD};
const vveTaken=k=>Array.isArray(k.vveTaken)&&k.vveTaken.length?k.vveTaken:vveStd();
/* hoe vaak een taak: elke beurt (standaard) of periodiek, bijv. 2x per week trappenhuis maar 1x per kwartaal het hekwerk */
const VVE_FREQ=[["beurt","Elke beurt",0],["week","Elke week",7],["2week","Elke 2 weken",14],["maand","Elke maand",30],["kwartaal","Elk kwartaal",91],["halfjaar","Elk half jaar",182],["jaar","Elk jaar",365]];
const vveFreq=(k,t)=>{const f=(k&&k.vveFreq||{})[t];return VVE_FREQ.some(x=>x[0]===f)?f:"beurt"};
const vveFreqLbl=f=>(VVE_FREQ.find(x=>x[0]===f)||VVE_FREQ[0])[1];
/* periodieke taak is aan de beurt als hij langer dan de termijn geleden (met een paar dagen speling) voor het laatst is afgevinkt */
function vveLaatst(k,t){let d="";(state.beurten||[]).forEach(b=>{if(b.klantId===k.id&&b.datum>d&&(b.taken||[]).some(x=>x.naam===t&&x.ok))d=b.datum});return d}
function vveAanDeBeurt(k,t,datum){const f=vveFreq(k,t),dg=(VVE_FREQ.find(x=>x[0]===f)||[0,0,0])[2];if(!dg)return true;const l=vveLaatst(k,t);if(!l)return true;
  return (new Date(datum+"T12:00:00")-new Date(l+"T12:00:00"))/864e5>=dg-Math.min(3,Math.round(dg/7))}
const VVE_CAT=[["technisch","Technisch",I.wrench],["vandalisme","Vandalisme",I.alert],["overig","Overig",I.note]];
function vveOplevering(k){return new Promise(res=>{
  const dag=iso(today()),taken=vveTaken(k).filter(t=>vveAanDeBeurt(k,t,dag)),fotos=[];let bezig=false;
  const o=document.createElement("div");o.className="vraag-ov";const dg=document.createElement("dialog");dg.className="vraag-dlg";dg.appendChild(o);const weg=v=>{try{dg.close()}catch(_){}dg.remove();res(v)};dg.addEventListener("cancel",e=>{e.preventDefault();weg(null)});
  const teken=()=>{o.innerHTML=`<div class="rk vve-op" role="dialog" aria-modal="true" aria-label="Oplevering">
    <div class="rk-h"><span class="objic">${I.check}</span><div><b>Oplevering ${esc(cleanName(k.naam))}</b><small>Wat is er gedaan? Dit ziet het bestuur in het portaal en op het bewonersbord.</small></div><button type="button" class="iconbtn sm" data-vx aria-label="Sluiten">${I.x}</button></div>
    <div class="vve-lijst">${taken.map((t,i)=>`<label class="vve-t"><input type="checkbox" value="${i}" checked><span><i>${I.check}</i>${esc(t)}${vveFreq(k,t)!=="beurt"?` <small class="vve-per">${esc(vveFreqLbl(vveFreq(k,t)).toLowerCase())}</small>`:""}</span></label>`).join("")}</div>
    <div class="vve-foto"><div class="vve-fh"><span class="eyebrow">${I.camera}Opleverfoto</span><label class="btn small bv-cam${state.assets?"":" dis"}">${I.camera}${fotos.length?"Nog een foto":"Foto maken"}<input type="file" accept="image/*" hidden data-vfoto ${state.assets?"":"disabled"}></label></div>
      ${fotos.length?`<div class="vve-fl">${fotos.map((f,i)=>`<span><img src="${f.url}" alt=""><button type="button" class="iconbtn sm" data-vdel="${i}" aria-label="Verwijderen">${I.x}</button></span>`).join("")}</div>`:`<small class="help">Eén foto van de opgeleverde entree of het trappenhuis, direct uit de camera. ${bezig?"Uploaden…":""}</small>`}</div>
    <label>Opmerking (optioneel)<input data-vnot placeholder="Bijv. lamp bij de entree kapot"></label>
    <div class="rk-f"><button type="button" class="ghost" data-vx>Annuleren</button><span class="sp"></span><button type="button" class="primary" data-vok ${bezig?"disabled":""}>${I.check}Afmelden</button></div></div>`;
    o.querySelectorAll("[data-vx]").forEach(b=>b.onclick=()=>weg(null));
    o.querySelector("[data-vfoto]").onchange=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f||!state.assets)return;bezig=true;teken();
      try{const r=await state.assets.upload(f);fotos.push({id:r.id,url:URL.createObjectURL(f),op:new Date().toISOString()})}catch(er){toast("De foto kon niet worden geüpload")}bezig=false;teken()};
    o.querySelectorAll("[data-vdel]").forEach(b=>b.onclick=()=>{fotos.splice(Number(b.dataset.vdel),1);teken()});
    o.querySelector("[data-vok]").onclick=()=>{const ok=[...o.querySelectorAll('.vve-lijst input')].map(i=>i.checked),not=o.querySelector("[data-vnot]").value.trim();
      weg({taken:taken.map((t,i)=>({naam:t,ok:ok[i]})),fotos:fotos.map(f=>({id:f.id,op:f.op})),notitie:not,meldingen:(k.bevindingen||[]).map(b=>({id:b.id,notitie:b.notitie||"",zijde:b.zijde||"",categorie:b.categorie||"",datum:b.datum||iso(today())}))})}};
  document.body.appendChild(dg);teken();try{dg.showModal()}catch(_){dg.setAttribute("open","")}})}
