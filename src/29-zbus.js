/* ---------- EIGEN BUS OP DE KAART ----------
   Een bedrijf stuurt foto's van zijn bus (alle zijden). Mansard knipt de bus uit en zet hem erbij (Instellingen › Mansard-platform).
   Daarna rijdt de eigen bus in het CRM en in het klantportaal. Zonder eigen bus blijft alles zoals het was (de Mansard-bus).
   mijnschoonmaker.com (het eigen glazenwassersbedrijf) ziet deze kaart niet en houdt altijd de Mansard-bus. */
const busLegacy=()=>typeof LIVE!=="undefined"&&LIVE&&(!window.ZEEM_BID||window.ZEEM_BID==="mijnschoonmaker");
function busEigen(){try{if(busLegacy())return null;const s=S(),b=s.busBeeld;return s.busAan!==false&&b&&b.rechts?b:null}catch(e){return null}}
/* rechts = de bus rijdt naar rechts (voorkant rechts); links = de andere kant van de bus */
/* zonder eigen bus: mijnschoonmaker.com de eigen bus met de Brian James boxvan, andere bedrijven alleen de bus */
function busSrc(links){const b=busEigen();if(!b)return busLegacy()?"/img/mansard-bus.png":"/img/bus.png";return"/_blob/"+(links&&b.links?b.links:b.rechts)}
const BUS_ZIJDEN=[["rechts","Rechterkant","Voorkant van de bus rechts in beeld"],["links","Linkerkant","Voorkant van de bus links in beeld"],["voor","Voorkant",""],["achter","Achterkant",""]];
try{const g=SET_GROEP.find(x=>x[0]==="werk");if(g&&!g[3].includes("bus"))g[3].push("bus")}catch(e){}
SETCARDS.push({id:"bus",t:"Eigen bus op de kaart",sub:"Je eigen bus rijdt mee in het CRM en het klantportaal",ic:"auto",bg:"#252c3c",weg:busLegacy,
  st:s=>busEigen()?["ok","Je eigen bus rijdt"]:s.busStatus==="aangevraagd"?["soon","Mansard is ermee bezig"]:s.busBeeld&&s.busBeeld.rechts&&s.busAan===false?["soon","Staat uit"]:["soon","Nog niet ingesteld"],
  rows:s=>[["Op de kaart",busEigen()?"Je eigen bus":"De Mansard-bus"],["Foto's",String(Object.keys(s.busFotos||{}).length)+" van 4"]]});
SETEXTRA.bus=(c,s)=>{const F={...(s.busFotos||{})},klaar=s.busBeeld&&s.busBeeld.rechts;
  const tegel=([z,l,h])=>`<label class="bus-t${F[z]?" heeft":""}" data-bz="${z}"><span class="bus-f">${F[z]?`<img src="/_blob/${esc(F[z])}" alt="">`:`${I.camera||I.upload}`}</span><b>${esc(l)}</b>${h?`<small>${esc(h)}</small>`:""}<input type="file" accept="image/*" hidden data-bzin="${z}"></label>`;
  setDlg(c,`${info("Maak een foto van alle vier de zijden van je bus, het liefst met de bus helemaal in beeld en zo recht mogelijk van opzij. <b>Mansard knipt je bus uit</b> en zet hem erbij. Daarna rijdt je eigen bus op de kaart: in het CRM en op de dag zelf ook bij je klanten in het klantportaal.")}
    ${klaar?`${sec("Je bus op de kaart")}<div class="bus-klaar"><img src="/_blob/${esc(s.busBeeld.rechts)}" alt="Je eigen bus">${s.busBeeld.links?`<img src="/_blob/${esc(s.busBeeld.links)}" alt="">`:""}</div>${tgl("busAan","Eigen bus tonen","Uit = weer de standaard Mansard-bus",s.busAan!==false)}`:""}
    ${sec(klaar?"Nieuwe foto's sturen":"Foto's van je bus")}<div class="bus-g">${BUS_ZIJDEN.map(tegel).join("")}</div>
    ${s.busStatus==="aangevraagd"?`<p class="subt" style="margin:10px 0 0">Verstuurd op ${esc(fmtD(String(s.busOp||"").slice(0,10)))}. Mansard is ermee bezig; je krijgt je bus vanzelf te zien.</p>`:""}
    <style>.bus-g{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.bus-t{display:flex;flex-direction:column;gap:4px;padding:10px;border:1px dashed var(--line);border-radius:14px;cursor:pointer;background:var(--card,#fff)}.bus-t.heeft{border-style:solid}
    .bus-f{aspect-ratio:16/10;border-radius:10px;background:var(--soft,#f3f4f6);display:grid;place-items:center;overflow:hidden;color:var(--muted)}.bus-f img{width:100%;height:100%;object-fit:cover}.bus-f svg{width:26px;height:26px}.bus-t small{color:var(--muted);font-weight:400}
    .bus-klaar{display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:12px;border-radius:14px;background:var(--soft,#f3f4f6)}.bus-klaar img{height:56px;width:auto}</style>`,
    {foot:`<button type="button" class="ghost" data-act="close">Sluiten</button><span class="sp"></span>${klaar?`<button type="button" class="small" id="busBew">${I.check}Opslaan</button>`:""}<button type="button" class="primary" id="busStuur">${I.send}Versturen naar Mansard</button>`});
  form.querySelectorAll("[data-bzin]").forEach(inp=>inp.onchange=async e=>{const file=e.target.files&&e.target.files[0];e.target.value="";if(!file)return;const z=inp.dataset.bzin,t=inp.closest(".bus-t");
    try{t.classList.add("bezig");const r=state.assets?await state.assets.upload(file):null;if(!r)throw new Error("Uploaden kan hier niet");F[z]=r.id;t.classList.add("heeft");t.querySelector(".bus-f").innerHTML=`<img src="/_blob/${esc(r.id)}" alt="">`}
    catch(er){toast("Foto kon niet worden geüpload")}finally{t.classList.remove("bezig")}});
  const bew=form.querySelector("#busBew");if(bew)bew.onclick=async()=>{const t=form.querySelector('[data-k="busAan"]');if(await saveSettings({busAan:!!(t&&t.checked)}))dlg.close();render()};
  form.querySelector("#busStuur").onclick=async()=>{if(!Object.keys(F).length){toast("Voeg eerst foto's van je bus toe");return}if(!F.rechts&&!F.links){toast("Voeg in elk geval een foto van de zijkant toe");return}
    const b=form.querySelector("#busStuur");b.disabled=true;
    try{if(LIVE&&typeof fbFn==="function")await fbFn("busAanvraag")({fotos:F});
      await saveSettings({busFotos:F,busStatus:"aangevraagd",busOp:new Date().toISOString()},"Verstuurd naar Mansard. Je hoort het als je bus klaarstaat.");dlg.close();render()}
    catch(e){toast(typeof fnFout==="function"?fnFout(e):e.message);b.disabled=false}}};
