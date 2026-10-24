/* ---------- Instellingen › Klantportaal VvE ----------
   Twee kanten: het klantportaal van het bestuur (inloggen: logboek, meldingen, facturen, documenten)
   en het bewonersbord: de QR-code in de trappenhal. Bewoners zien daar alleen wanneer we geweest zijn en wie,
   en wanneer we weer komen. Wat in de hal hangt staat dus niet in het klantportaal, en andersom. */
I.qr=I.qr||sv('<rect x="4" y="4" width="6" height="6" rx="1.2"/><rect x="14" y="4" width="6" height="6" rx="1.2"/><rect x="4" y="14" width="6" height="6" rx="1.2"/><path d="M14 14h2.5v2.5H14zM19.5 14v.01M14 19.5v.01M17 17h3v3h-3z"/>');
const vveKlanten=()=>(state.klanten||[]).filter(k=>k&&k.soort==="vve"&&k.actief!==false).sort((a,b)=>String(a.naam||"").localeCompare(String(b.naam||""),"nl"));
const vveHex=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,"0")).join("");
const VVE_TOK=/^(?:b[a-z0-9]{7}_)?[a-f0-9]{24,64}$/;
/* echte link van het bord van één VvE; maakt de code aan als die er nog niet is (in de demo: het voorbeeldbord) */
async function vveBordLink(k){if(!LIVE)return location.origin+"/bord.html?demo";
  let t=k.bordToken;if(!VVE_TOK.test(String(t||""))){t=(window.ZEEM_BID&&window.ZEEM_BID!=="mijnschoonmaker"?window.ZEEM_BID+"_":"")+vveHex();await save("klanten",k.id,{...strip(k),bordToken:t});k.bordToken=t}
  return location.origin+"/bord/"+t}
/* voorbeeld van het bord met de instellingen zoals ze nu in het venster staan (ook als je nog niet hebt opgeslagen) */
function vveBordVoorbeeld(extra=""){const on=(k,d)=>{const el=form.querySelector(`[data-k="${k}"]`);return el?el.checked:d};
  const q=["demo","door="+(on("vveDoor",true)?1:0),"live="+(on("vveBordLive",true)?1:0),"taken="+(on("vveBordTaken",true)?1:0),"fotos="+(on("vveBordFotos",false)?1:0)];
  return location.origin+"/bord.html?"+q.join("&")+extra}
SETCARDS.push({id:"vve",t:"Klantportaal VvE",sub:"Wat het bestuur en de bewoners van een VvE zien",ic:"building",bg:"#137a8a",
  st:()=>{const n=vveKlanten().length;return n?["ok",plural(n,"VvE","VvE's")]:["soon","Nog geen VvE's"]},
  rows:s=>[["Bestuur","Klantportaal VvE"],["Bewoners (QR)",(s.vveDoor===false?"Wanneer":"Wanneer en door wie")+(s.vveBordTaken===false?"":" + aftekenlijst")],["Standaard checklist",String((vveStd()||[]).length)+" ruimtes"]]});
SETEXTRA.vve=(c,s)=>{const vv=vveKlanten();
  const tegel=(id,ic,t,sub)=>`<button type="button" class="vv-tegel" id="${id}"><span class="objic" style="background:#137a8a">${I[ic]}</span><span><b>${esc(t)}</b><small>${esc(sub)}</small></span>${I.ext||""}</button>`;
  setDlg(c,`${info("Een VvE heeft twee kanten. Het <b>bestuur</b> logt in op het klantportaal VvE: logboek met checklist en opleverfoto's, meldingen, facturen en documenten. De <b>bewoners</b> scannen de QR-code in de trappenhal en zien wanneer en door wie er is schoongemaakt, met de aftekenlijst van die dag. Zij komen niet in het klantportaal: dat is alleen voor het bestuur.")}
    <div class="vv-tegels">
      ${tegel("vvPortaal","eye","Bekijk klantportaal VvE","Wat het bestuur ziet na inloggen")}
      ${tegel("vvBord","qr","Bekijk wat bewoners zien","Na het scannen van de QR-code in de trappenhal")}
      ${tegel("vvPoster","note","Bekijk het bordje","Het A5-bordje met QR-code dat in de hal hangt")}
    </div>
    ${sec("Klantportaal VvE (bestuur)")}
    ${tgl("vveDoor","Laten zien wie er heeft schoongemaakt","Voornaam van de medewerker bij elk bezoek, in het klantportaal en op het bewonersbord",s.vveDoor!==false)}
    <label class="full">Standaard checklist voor een nieuwe VvE (één ruimte per regel)<textarea id="vvTaken" style="min-height:104px" placeholder="${esc(VVE_STD.join("\n"))}">${esc(vveStd().join("\n"))}</textarea><small class="help">Je medewerker vinkt dit af bij het afmelden. Per VvE pas je het aan in de opdracht.</small></label>
    ${sec("Bewonersbord (QR-code in de trappenhal)")}
    <small class="help" style="margin-top:-4px">Bewoners zien wanneer en door wie er is schoongemaakt, de volgende beurt en hoe ze iets kunnen melden. Zonder inloggen en zonder toegang tot het klantportaal: facturen, meldingen en documenten blijven bij het bestuur.</small>
    ${tgl("vveBordLive","Live laten zien als we onderweg zijn","Op de dag zelf: hoeveel adressen nog en hoe laat we er ongeveer zijn",s.vveBordLive!==false)}
    ${tgl("vveBordTaken","Aftekenlijst tonen","Welke ruimtes die dag zijn afgetekend",s.vveBordTaken!==false)}
    ${tgl("vveBordFotos","Opleverfoto's en notitie tonen","Staat altijd in het klantportaal",s.vveBordFotos===true)}
    ${sec("Bordjes voor in de hal")}
    ${vv.length?`<div class="vv-lijst">${vv.map(k=>`<div class="vv-rij"><div><b>${esc(k.naam||"VvE")}</b><small>${esc([k.adres,k.plaats].filter(Boolean).join(", "))}</small></div><button type="button" class="small" data-vvbord="${esc(k.id)}">${I.eye}Bord</button><button type="button" class="small" data-vvprint="${esc(k.id)}">${I.qr}Bordje printen</button></div>`).join("")}</div>`
      :`<p class="subt" style="margin:0">Nog geen VvE's. Maak een klant aan met soort <b>VvE</b>; daarna print je hier het bordje met QR-code.</p>`}`,{wide:false});
  const open=u=>window.open(u,"_blank","noopener");
  $("#vvPortaal").onclick=()=>open(location.origin+"/portaal.html?demo=vve");
  $("#vvBord").onclick=()=>open(vveBordVoorbeeld());
  $("#vvPoster").onclick=()=>open(vveBordVoorbeeld("&poster=1"));
  const metLink=async(b,f)=>{const k=vv.find(x=>x.id===b.dataset.vvbord||x.id===b.dataset.vvprint);if(!k)return;
    const w=window.open("about:blank","_blank");b.disabled=true;
    try{const u=await vveBordLink(k);if(w)w.location.href=f(u);else open(f(u))}catch(e){if(w)w.close();err(e)}finally{b.disabled=false}};
  form.querySelectorAll("[data-vvbord]").forEach(b=>b.onclick=()=>metLink(b,u=>u));
  form.querySelectorAll("[data-vvprint]").forEach(b=>b.onclick=()=>metLink(b,u=>u+(u.includes("?")?"&":"?")+(LIVE?"print=1":"poster=1")));
  bindSave(()=>{const t=$("#vvTaken").value.split(/\n/).map(x=>x.trim()).filter(Boolean).slice(0,20);return{vveTakenStd:t.length&&t.join("|")!==VVE_STD.join("|")?t:[]}})};
