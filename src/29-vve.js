/* ---------- VvE: checklist en opleverfoto bij het afmelden ----------
   Bij een VvE (klant.soort === "vve") vraagt afmelden eerst wat er is gedaan (per ruimte) en een foto uit de camera.
   Dat komt op de beurt te staan (taken, fotos, meldingen) en is zichtbaar in het klantportaal en op het bewonersbord. */
const VVE_STD=["Entree en deuren","Trappenhuis","Lift","Bergingsgang"];
/* standaard checklist voor nieuwe VvE's: in te stellen bij Instellingen › Klantportaal VvE */
const vveStd=()=>{const t=state.settings&&state.settings.vveTakenStd;return Array.isArray(t)&&t.length?t:VVE_STD};
const vveTaken=k=>Array.isArray(k.vveTaken)&&k.vveTaken.length?k.vveTaken:vveStd();
const VVE_CAT=[["technisch","Technisch",I.wrench],["vandalisme","Vandalisme",I.alert],["vuil","Vuil / grofvuil",I.trash||I.alert],["overig","Overig",I.note]];
function vveOplevering(k){return new Promise(res=>{
  const taken=vveTaken(k),fotos=[];let bezig=false;
  const o=document.createElement("div");o.className="vraag-ov";const dg=document.createElement("dialog");dg.className="vraag-dlg";dg.appendChild(o);const weg=v=>{try{dg.close()}catch(_){}dg.remove();res(v)};dg.addEventListener("cancel",e=>{e.preventDefault();weg(null)});
  const teken=()=>{o.innerHTML=`<div class="rk vve-op" role="dialog" aria-modal="true" aria-label="Oplevering">
    <div class="rk-h"><span class="objic">${I.check}</span><div><b>Oplevering ${esc(cleanName(k.naam))}</b><small>Wat is er gedaan? Dit ziet het bestuur in het portaal en op het bewonersbord.</small></div><button type="button" class="iconbtn sm" data-vx aria-label="Sluiten">${I.x}</button></div>
    <div class="vve-lijst">${taken.map((t,i)=>`<label class="vve-t"><input type="checkbox" value="${i}" checked><span><i>${I.check}</i>${esc(t)}</span></label>`).join("")}</div>
    <div class="vve-foto"><div class="vve-fh"><span class="eyebrow">${I.camera}Opleverfoto</span><label class="btn small bv-cam${state.assets?"":" dis"}">${I.camera}${fotos.length?"Nog een foto":"Foto maken"}<input type="file" accept="image/*" capture="environment" hidden data-vfoto ${state.assets?"":"disabled"}></label></div>
      ${fotos.length?`<div class="vve-fl">${fotos.map((f,i)=>`<span><img src="${f.url}" alt=""><button type="button" class="iconbtn sm" data-vdel="${i}" aria-label="Verwijderen">${I.x}</button></span>`).join("")}</div>`:`<small class="help">Eén foto van de opgeleverde entree of het trappenhuis, direct uit de camera. ${bezig?"Uploaden…":""}</small>`}</div>
    <label>Opmerking (optioneel)<input data-vnot placeholder="Bijv. grofvuil bij de containers gemeld"></label>
    <div class="rk-f"><button type="button" class="ghost" data-vx>Annuleren</button><span class="sp"></span><button type="button" class="primary" data-vok ${bezig?"disabled":""}>${I.check}Afmelden</button></div></div>`;
    o.querySelectorAll("[data-vx]").forEach(b=>b.onclick=()=>weg(null));
    o.querySelector("[data-vfoto]").onchange=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f||!state.assets)return;bezig=true;teken();
      try{const r=await state.assets.upload(f);fotos.push({id:r.id,url:URL.createObjectURL(f),op:new Date().toISOString()})}catch(er){toast("De foto kon niet worden geüpload")}bezig=false;teken()};
    o.querySelectorAll("[data-vdel]").forEach(b=>b.onclick=()=>{fotos.splice(Number(b.dataset.vdel),1);teken()});
    o.querySelector("[data-vok]").onclick=()=>{const ok=[...o.querySelectorAll('.vve-lijst input')].map(i=>i.checked),not=o.querySelector("[data-vnot]").value.trim();
      weg({taken:taken.map((t,i)=>({naam:t,ok:ok[i]})),fotos:fotos.map(f=>({id:f.id,op:f.op})),notitie:not,meldingen:(k.bevindingen||[]).map(b=>({id:b.id,notitie:b.notitie||"",zijde:b.zijde||"",categorie:b.categorie||"",datum:b.datum||iso(today())}))})}};
  document.body.appendChild(dg);teken();try{dg.showModal()}catch(_){dg.setAttribute("open","")}})}
