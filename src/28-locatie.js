/* ---------- LOCATIE toevoegen / wijzigen (zoals in een klantdossier): adres links, klantgegevens ernaast ---------- */
const splitAdres=a=>{const m=String(a||"").trim().match(/^(.*?)\s+(\d+)\s*[-\s]?\s*([a-zA-Z0-9][a-zA-Z0-9 \-\/]*)?$/);return m?{straat:m[1],huisnr:m[2],toev:(m[3]||"").trim()}:{straat:String(a||"").trim(),huisnr:"",toev:""}};
const joinAdres=(s,h,t)=>[String(s||"").trim(),[String(h||"").trim(),String(t||"").trim()].filter(Boolean).join(t&&/^\d/.test(String(t))?"-":"")].filter(Boolean).join(" ");
const normPc=p=>{const c=String(p||"").toUpperCase().replace(/\s+/g,"");return /^\d{4}[A-Z]{2}$/.test(c)?c.slice(0,4)+" "+c.slice(4):String(p||"").toUpperCase().trim()};

/* adreswijziging doorvoeren in conceptfacturen en openstaande offertes (verstuurde facturen blijven zoals ze zijn) */
async function adresDoorvoeren(kOud,kNieuw){let n=0;
  const fOud=factAddr(kOud),fNw=factAddr(kNieuw),jOud=jobAddr(kOud),jNw=jobAddr(kNieuw),hOud=fullAddr(kOud),hNw=fullAddr(kNieuw);
  for(const f of state.facturen.filter(x=>x.klantId===kNieuw.id)){let nw=null;
    if(f.soort==="offerte"){if(["concept","verstuurd"].includes(f.status||"concept")){if(f.klantAdres===jOud&&jOud!==jNw)nw=jNw;else if(f.klantAdres===hOud&&hOud!==hNw)nw=hNw}}
    else if(f.status==="concept"&&f.klantAdres===fOud&&fOud!==fNw)nw=fNw;
    if(nw!=null){await save("facturen",f.id,{...strip(f),klantAdres:nw});n++}}
  return n}

function kkLocatie(kid,oid){const k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const main=oid==="main",os=k.objecten||[],o0=main?null:os.find(x=>x.id===oid),isNew=!main&&!o0;
  const src=main?{adres:k.adres,postcode:k.postcode,plaats:k.plaats,land:k.land,naam:k.locOms||"",contact:k.locContact||{},straat:k.straat,huisnr:k.huisnr,toev:k.toev}
    :o0?{...o0,contact:o0.contact||{}}:{naam:os.length?"":"Woning",adres:"",postcode:"",plaats:"",contact:{}};
  const sp=src.straat!=null&&src.straat!==""?{straat:src.straat,huisnr:src.huisnr||"",toev:src.toev||""}:splitAdres(src.adres);
  const erft=!main&&!src.adres,ph=erft?splitAdres(k.adres):{};
  const c=src.contact||{};
  const inp=(id,l,v,o={})=>`<label class="${o.cls||""}">${l}<input id="lc-${id}" value="${esc(v||"")}" placeholder="${esc(o.ph||l)}" ${o.type?`type="${o.type}"`:""} ${o.im?`inputmode="${o.im}"`:""} autocomplete="off"></label>`;
  const kv=(a,b)=>b?`<div class="ow-kv"><span>${esc(a)}</span><b>${b}</b></div>`:"";
  openDlg(`<div class="dlg-head"><span class="objic big">${I.globe}</span><div style="min-width:0;flex:1"><h3>${isNew?"Locatie toevoegen":"Locatie wijzigen"}</h3><div class="subt">${esc(cleanName(k.naam))}${main?" · hoofdadres":""}</div></div><button type="button" class="iconbtn" id="lcX" aria-label="Terug">${I.x}</button></div>
  <div class="lc-wrap"><div class="lc-main">
    <section class="kp"><div class="kp-h"><span class="objic">${I.pin}</span><b>Adres</b></div>
      <label class="lc-zoek">Snel zoeken<span class="ow-in"><i>${I.search}</i><input id="lc-q" placeholder="Typ een adres of postcode + huisnummer" autocomplete="off"></span><div class="lc-sug" id="lcSug" hidden></div></label>
      <div class="lc-g lc-g3">${inp("straat","Adres",sp.straat,{ph:ph.straat||"Straat"})}${inp("huisnr","Huisnr.",sp.huisnr,{ph:ph.huisnr||"Huisnr.",im:"numeric"})}${inp("toev","Toev.",sp.toev,{ph:ph.toev||"Toev."})}</div>
      <div class="lc-g lc-g2">${inp("postcode","Postcode",src.postcode,{ph:erft?k.postcode||"Postcode":"1234 AB"})}${inp("plaats","Plaats",src.plaats,{ph:erft?k.plaats||"Plaats":"Plaats"})}</div>
      <div class="lc-g lc-g2"><label>Land<select id="lc-land">${Object.entries(LANDEN).map(([a,b])=>`<option value="${a}" ${(src.land||"NL")===a?"selected":""}>${esc(b.n)}</option>`).join("")}</select></label>
        ${inp("naam","Locatieomschrijving",src.naam,{ph:main?"Hoofdadres":"Bijv. woning, kantoor, vakantiehuis"})}</div>
      ${erft?`<p class="help" style="margin:0">Leeg gelaten adresvelden nemen het hoofdadres over (${esc(fullAddr(k))}).</p>`:""}
      <p class="help" id="lcMsg" style="margin:0"></p></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Contactgegevens</b><small class="subt">op deze locatie</small></div>
      <div class="lc-g lc-g2">${inp("vn","Voornaam",c.voornaam)}${inp("an","Achternaam",c.achternaam)}
        <label>Geslacht<select id="lc-gs">${[["","Onbekend"],["m","Man"],["v","Vrouw"]].map(([a,b])=>`<option value="${a}" ${(c.geslacht||"")===a?"selected":""}>${b}</option>`).join("")}</select></label>${inp("fn","Functie",c.functie)}
        ${inp("tel","Telefoon",c.tel,{type:"tel"})}${inp("em","E-mailadres",c.email,{type:"email"})}</div></section>
    ${main?"":`<details class="kp lc-more"${o0&&(o0.toegang||o0.alarmcode||o0.parkeren||o0.materialen||o0.notities)?" open":""}><summary><span class="objic">${I.lock}</span><b>Werkinformatie</b><small class="subt">toegang, alarmcode, parkeren</small></summary>
      <div class="lc-g lc-g2">${inp("ramen","Aantal ramen",src.ramen,{type:"number",im:"numeric",ph:"0"})}${inp("m2","m² schoonmaak",src.m2,{type:"number",im:"numeric",ph:"0"})}</div>
      ${inp("toegang","Toegang",src.toegang,{ph:"Bijv. sleutel bij de buren, aanmelden bij beheerder",cls:"full"})}
      <label>Alarmcode<span class="secret">${I.lock}<input id="lc-alarm" type="password" autocomplete="off" value="${esc(src.alarmcode||"")}" placeholder="Bijv. 1234"><button type="button" class="small ghost" id="lcShow">Toon</button></span></label>
      <label>Parkeren<textarea id="lc-park" style="min-height:52px" placeholder="Bijv. parkeervergunning nodig">${esc(src.parkeren||"")}</textarea></label>
      <label>Materialen<textarea id="lc-mat" style="min-height:52px" placeholder="Bijv. ladder 6 m">${esc(src.materialen||"")}</textarea></label>
      <label>Notities<textarea id="lc-not" style="min-height:52px">${esc(src.notities||"")}</textarea></label></details>`}
  </div><aside class="lc-side">
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Klantgegevens</b><span class="sp"></span><button type="button" class="iconbtn sm" id="lcKg" aria-label="Klantgegevens wijzigen" title="Wijzigen">${I.pencil}</button></div>
      ${kv("Klantnummer",esc(klantNr(k)))}${kv("Type klant",soortLbl(k))}${kv("Naam",esc(cleanName(k.naam)))}${k.contact?kv("Contactpersoon",esc(k.contact)):""}
      ${kv("E-mailadres",esc(k.email||"—"))}${kv("Telefoon",esc(k.telefoon||"—"))}${kv("Hoofdadres",esc(fullAddr(k)||"—"))}${k.fAdres?kv("Factuuradres",esc(factAddr(k))):""}
      ${kv("Betaalwijze",k.incasso?"Automatische incasso":"Per bank")}${kv("Klant sinds",k.aangemaakt?esc(fmtL(k.aangemaakt)):"")}</section>
    ${(k.objecten||[]).length||main?`<section class="kp"><div class="kp-h"><span class="objic">${I.globe}</span><b>Alle locaties</b></div>
      <div class="lc-locs">${[{id:"main",naam:k.locOms||"Hoofdadres",a:fullAddr(k)},...(k.objecten||[]).map(x=>({id:x.id,naam:x.naam||"Locatie",a:x.adres?fullAddr(x):fullAddr(k)}))].map(l=>`<button type="button" class="lc-loc${(main&&l.id==="main")||l.id===oid?" act":""}" data-lc="${esc(l.id)}"><b>${esc(l.naam)}</b><small>${esc(l.a||"—")}</small></button>`).join("")}</div></section>`:""}
  </aside></div>
  <div class="row stickyfoot">${!main&&!isNew?`<button type="button" class="ghost danger" id="lcDel">${I.trash}Verwijderen</button>`:""}<span class="sp"></span><button type="button" id="lcBack">Annuleren</button><button type="submit" class="primary" id="lcSave">${I.check}Opslaan</button></div>`,{xwide:true});
  const $l=n=>$("#lc-"+n),v=n=>($l(n)?$l(n).value.trim():"");
  $("#lcX").onclick=$("#lcBack").onclick=()=>openKlantView(kid);
  $("#lcKg").onclick=()=>kkGegevens(kid);
  form.querySelectorAll("[data-lc]").forEach(b=>b.onclick=()=>kkLocatie(kid,b.dataset.lc));
  const sh=$("#lcShow");if(sh)sh.onclick=()=>{const i=$l("alarm");i.type=i.type==="password"?"text":"password";sh.textContent=i.type==="password"?"Toon":"Verberg"};
  /* snel zoeken via de openbare adresservice van PDOK; werkt dat niet, dan gewoon zelf invullen */
  const msg=t=>{const m=$("#lcMsg");if(m)m.textContent=t||""};
  const vul=d=>{if(!d)return;if(d.straatnaam)$l("straat").value=d.straatnaam;if(d.huisnummer!=null)$l("huisnr").value=String(d.huisnummer);$l("toev").value=[d.huisletter,d.huisnummertoevoeging].filter(Boolean).join("");
    if(d.postcode)$l("postcode").value=normPc(d.postcode);if(d.woonplaatsnaam)$l("plaats").value=d.woonplaatsnaam;msg("Adres ingevuld: "+[joinAdres(v("straat"),v("huisnr"),v("toev")),v("postcode"),v("plaats")].filter(Boolean).join(", "))};
  const PD="https://api.pdok.nl/bzk/locatieserver/search/v3_1/";
  const pd=async(path)=>{const r=await fetch(PD+path);if(!r.ok)throw new Error("pdok");return r.json()};
  let tq=0;const sug=$("#lcSug");
  $l("q").addEventListener("input",()=>{clearTimeout(tq);const q=v("q");if(q.length<3){sug.hidden=true;return}
    tq=setTimeout(async()=>{try{const j=await pd("suggest?fq=type:adres&rows=7&q="+encodeURIComponent(q));const docs=(j.response&&j.response.docs)||[];
      sug.innerHTML=docs.map(d=>`<button type="button" data-pid="${esc(d.id)}">${esc(d.weergavenaam)}</button>`).join("")||'<span class="subt">Geen adres gevonden</span>';sug.hidden=false;
      sug.querySelectorAll("[data-pid]").forEach(b=>b.onclick=async()=>{sug.hidden=true;$l("q").value=b.textContent;try{const r=await pd("lookup?id="+encodeURIComponent(b.dataset.pid));vul(((r.response||{}).docs||[])[0])}catch(e){msg("Ophalen lukte niet, vul het adres zelf in.")}})}
    catch(e){sug.innerHTML='<span class="subt">Adres zoeken is nu niet beschikbaar. Vul het adres hieronder zelf in.</span>';sug.hidden=false}},250)});
  $l("q").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();const b=sug.querySelector("[data-pid]");if(b)b.click()}});
  /* postcode + huisnummer ingevuld: straat en plaats opzoeken als die nog leeg zijn */
  const pcLookup=async()=>{const pc=v("postcode").replace(/\s+/g,"").toUpperCase(),hn=v("huisnr");if(!/^\d{4}[A-Z]{2}$/.test(pc)||!hn||(v("straat")&&v("plaats")))return;
    try{const j=await pd("free?fq=type:adres&rows=1&q="+encodeURIComponent("postcode:"+pc+" and huisnummer:"+hn));const d=((j.response||{}).docs||[])[0];if(d){if(!v("straat"))$l("straat").value=d.straatnaam||"";if(!v("plaats"))$l("plaats").value=d.woonplaatsnaam||"";msg("Straat en plaats aangevuld vanuit de postcode.")}}catch(e){}};
  $l("postcode").addEventListener("change",()=>{$l("postcode").value=normPc($l("postcode").value);pcLookup()});$l("huisnr").addEventListener("change",pcLookup);
  form.onsubmit=async e=>{e.preventDefault();
    const straat=v("straat"),huisnr=v("huisnr"),toev=v("toev"),adres=joinAdres(straat,huisnr,toev),postcode=normPc(v("postcode")),plaats=v("plaats");
    if(main&&(!straat||!plaats)){(straat?$l("plaats"):$l("straat")).focus();toast("Vul minimaal de straat en de plaats in");return}
    if(!main&&adres&&!plaats&&!postcode){$l("plaats").focus();toast("Vul ook de postcode of plaats in");return}
    const contact={voornaam:v("vn"),achternaam:v("an"),geslacht:$l("gs").value,functie:v("fn"),tel:v("tel"),email:v("em")};
    const cur=state.klanten.find(x=>x.id===kid)||k;let nw;
    if(main)nw={...strip(cur),adres,straat,huisnr,toev,postcode,plaats,land:$l("land").value,locOms:v("naam"),locContact:contact};
    else{const data={...(o0||{}),id:o0?o0.id:newId("o"),naam:v("naam")||"Locatie",adres,straat,huisnr,toev,postcode:adres?postcode:"",plaats:adres?plaats:"",land:$l("land").value,contact,
        ramen:v("ramen"),m2:v("m2"),toegang:v("toegang"),alarmcode:$l("alarm").value.trim(),parkeren:v("park"),materialen:v("mat"),notities:v("not")};
      const list=isNew?[...(cur.objecten||[]),data]:(cur.objecten||[]).map(x=>x.id===data.id?data:x);
      nw={...strip(cur),objecten:list,objectId:list.some(x=>x.id===cur.objectId)?cur.objectId:(list[0]?list[0].id:"")}}
    $("#lcSave").disabled=true;
    try{await save("klanten",kid,nw);const n=await adresDoorvoeren({...cur},{...nw,id:kid});
      const gewijzigd=fullAddr(cur)!==fullAddr({...nw})||jobAddr(cur)!==jobAddr({...nw,id:kid});
      toast(isNew?"Locatie toegevoegd":gewijzigd?"Adres gewijzigd · planning, route en opdrachten gebruiken het nieuwe adres"+(n?" · "+plural(n,"concept/offerte","concepten/offertes")+" bijgewerkt":""):"Locatie opgeslagen");
      setTimeout(()=>openKlantView(kid),60)}
    catch(er){$("#lcSave").disabled=false;err(er)}};
  const d=$("#lcDel");if(d){let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.innerHTML=I.trash+"Zeker weten? Tik nogmaals";return}
    const cur=state.klanten.find(x=>x.id===kid)||k,list=(cur.objecten||[]).filter(x=>x.id!==oid);
    try{await save("klanten",kid,{...strip(cur),objecten:list,objectId:list.some(x=>x.id===cur.objectId)?cur.objectId:(list[0]?list[0].id:"")});toast("Locatie verwijderd");setTimeout(()=>openKlantView(kid),60)}catch(er){err(er)}}}
}

/* adres snel zoeken (PDOK) voor een set velden met hetzelfde voorvoegsel: q, straat, huisnr, toev, postcode, plaats */
function bindAdresZoek(px){const $f=n=>$("#"+px+n),v=n=>($f(n)?$f(n).value.trim():""),sug=$("#"+px+"sug"),msgEl=$("#"+px+"msg");if(!$f("q")||!sug)return;
  const msg=t=>{if(msgEl)msgEl.textContent=t||""};
  const PD="https://api.pdok.nl/bzk/locatieserver/search/v3_1/",pd=async p=>{const r=await fetch(PD+p);if(!r.ok)throw new Error("pdok");return r.json()};
  const vul=d=>{if(!d)return;if(d.straatnaam)$f("straat").value=d.straatnaam;if(d.huisnummer!=null)$f("huisnr").value=String(d.huisnummer);$f("toev").value=[d.huisletter,d.huisnummertoevoeging].filter(Boolean).join("");
    if(d.postcode)$f("postcode").value=normPc(d.postcode);if(d.woonplaatsnaam)$f("plaats").value=d.woonplaatsnaam;msg("Adres ingevuld: "+[joinAdres(v("straat"),v("huisnr"),v("toev")),v("postcode"),v("plaats")].filter(Boolean).join(", "))};
  let tq=0;
  $f("q").addEventListener("input",()=>{clearTimeout(tq);const q=v("q");if(q.length<3){sug.hidden=true;return}
    tq=setTimeout(async()=>{try{const j=await pd("suggest?fq=type:adres&rows=7&q="+encodeURIComponent(q));const docs=(j.response&&j.response.docs)||[];
      sug.innerHTML=docs.map(d=>`<button type="button" data-pid="${esc(d.id)}">${esc(d.weergavenaam)}</button>`).join("")||'<span class="subt">Geen adres gevonden</span>';sug.hidden=false;
      sug.querySelectorAll("[data-pid]").forEach(b=>b.onclick=async()=>{sug.hidden=true;$f("q").value=b.textContent;try{const r=await pd("lookup?id="+encodeURIComponent(b.dataset.pid));vul(((r.response||{}).docs||[])[0])}catch(e){msg("Ophalen lukte niet, vul het adres zelf in.")}})}
    catch(e){sug.innerHTML='<span class="subt">Adres zoeken is nu niet beschikbaar. Vul het adres hieronder zelf in.</span>';sug.hidden=false}},250)});
  $f("q").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();const b=sug.querySelector("[data-pid]");if(b)b.click()}});
  const pcLookup=async()=>{const pc=v("postcode").replace(/\s+/g,"").toUpperCase(),hn=v("huisnr");if(!/^\d{4}[A-Z]{2}$/.test(pc)||!hn||(v("straat")&&v("plaats")))return;
    try{const j=await pd("free?fq=type:adres&rows=1&q="+encodeURIComponent("postcode:"+pc+" and huisnummer:"+hn));const d=((j.response||{}).docs||[])[0];if(d){if(!v("straat"))$f("straat").value=d.straatnaam||"";if(!v("plaats"))$f("plaats").value=d.woonplaatsnaam||"";msg("Straat en plaats aangevuld vanuit de postcode.")}}catch(e){}};
  $f("postcode").addEventListener("change",()=>{$f("postcode").value=normPc($f("postcode").value);pcLookup()});$f("huisnr").addEventListener("change",pcLookup)}

/* ---------- NIEUWE KLANT: alle klantgegevens zoals in een klantdossier ---------- */
function openNieuweKlant(){const st=S();
  const inp=(id,l,o={})=>`<label class="${o.cls||""}">${l}<input id="nk-${id}" ${o.type?`type="${o.type}"`:""} ${o.im?`inputmode="${o.im}"`:""} placeholder="${esc(o.ph||l)}" autocomplete="off" value="${esc(o.v||"")}">${o.help?`<small class="help">${o.help}</small>`:""}</label>`;
  const sel=(id,l,opts,v)=>`<label>${l}<select id="nk-${id}">${opts.map(([a,b])=>`<option value="${esc(a)}" ${String(v)===String(a)?"selected":""}>${esc(b)}</option>`).join("")}</select></label>`;
  const durs=[15,30,45,60,90,120,180,240];
  openDlg(`<div class="dlg-head"><span class="objic big">${I.user}</span><div style="min-width:0;flex:1"><h3>Nieuwe klant</h3><div class="subt">Vul de naam en het adres in, de rest kan later</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="lc-wrap nk-wrap"><div class="lc-main">
    <section class="kp"><div class="kp-h"><span class="objic">${I.user}</span><b>Klantgegevens</b></div>
      <div class="lc-g lc-g2">
        ${inp("nr","Klantnummer",{im:"numeric",ph:"Automatisch",help:"Zelfde als de relatiecode in SnelStart"})}
        ${sel("soort","Type klant",[["particulier","Particulier"],["zakelijk","Zakelijk"],["vve","VvE / Overheid"]],"particulier")}
        ${inp("voor","Voornaam")}${inp("ach","Achternaam")}
        ${inp("geb","Geboortedatum",{type:"date"})}${sel("gesl","Geslacht",[["","Onbekend"],["man","Man"],["vrouw","Vrouw"]],"")}
        ${inp("bedr","Bedrijfsnaam")}${inp("kvk","KVK-nummer",{im:"numeric"})}
        ${inp("btw","BTW-nummer",{ph:"NL000000000B00"})}${inp("fn","Functie")}
        ${inp("iban","IBAN",{ph:"NL00 BANK 0000 0000 00"})}${inp("rh","Rekeninghouder")}
        ${inp("email","E-mailadres",{type:"email"})}${inp("web","Website",{ph:"www.voorbeeld.nl"})}
        ${inp("tel","Telefoon",{type:"tel",ph:"10 cijfers"})}${inp("mob","Mobiel",{type:"tel",ph:"10 cijfers"})}
      </div></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.pin}</span><b>Adresgegevens</b></div>
      <label class="lc-zoek">Snel zoeken<span class="ow-in"><i>${I.search}</i><input id="nk-q" placeholder="Typ een adres of postcode + huisnummer" autocomplete="off"></span><div class="lc-sug" id="nk-sug" hidden></div></label>
      <div class="lc-g lc-g3">${inp("straat","Adres",{ph:"Straatnaam"})}${inp("huisnr","Huisnr.",{im:"numeric",ph:"1"})}${inp("toev","Toev.",{ph:""})}</div>
      <div class="lc-g lc-g2">${inp("postcode","Postcode",{ph:"1234 AB"})}${inp("plaats","Plaats")}</div>
      <div class="lc-g lc-g2"><label>Land<select id="nk-land">${Object.entries(LANDEN).map(([a,b])=>`<option value="${a}">${esc(b.n)}</option>`).join("")}</select></label><span></span></div>
      <p class="help" id="nk-msg" style="margin:0"></p></section>
    <section class="kp f-vve" id="nk-vve" hidden><div class="kp-h"><span class="objic">${I.checksq||I.check}</span><b>VvE-instellingen</b></div>
      <label>Vaste weekdagen<div class="ow-dagen" id="nk-wdagen">${[1,2,3,4,5,6].map(d=>`<button type="button" data-fwd="${d}" aria-pressed="false">${["zo","ma","di","wo","do","vr","za"][d]}</button>`).join("")}</div><small class="help">Bijv. di en vr: elke week op die dagen in de planning; na afmelden staat de volgende dag klaar.</small></label>
      <label>Checklist per ruimte (één per regel)<textarea id="nk-vvetaken" style="min-height:90px">${esc(VVE_TAKEN.join("\n"))}</textarea><small class="help">Vink je af bij het afmelden, met een opleverfoto. Het bestuur ziet dit in het portaal en op het bewonersbord.</small></label></section>
  </div><aside class="lc-side">
    <section class="kp"><div class="kp-h"><span class="objic">${I.note}</span><b>Klantnotities</b><small class="subt">alleen voor jezelf</small></div>
      <textarea id="nk-notitie" style="min-height:110px" placeholder="Bijv. via via aangemeld, wil graag in het voorjaar starten"></textarea></section>
    <section class="kp"><div class="kp-h"><span class="objic">${I.offertes}</span><b>Offertes</b></div><p class="subt" style="margin:0">Sla de klant op. Daarna maak je hier een offerte met de rekentool, of klik meteen hieronder.</p><button type="button" class="primary" id="nkOff">${I.offertes}Opslaan en offerte maken</button></section>
  </aside></div>
  <div class="row stickyfoot kk-foot"><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="submit" class="primary" id="nkSave">${I.check}Opslaan</button></div>`,{xwide:true});
  bindAdresZoek("nk-");
  const v=n=>{const e=$("#nk-"+n);return e?e.value.trim():""};
  {const so=$("#nk-soort"),vv=$("#nk-vve");if(so&&vv){so.addEventListener("change",()=>{vv.hidden=so.value!=="vve"});vv.querySelectorAll("[data-fwd]").forEach(b=>b.onclick=()=>b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true"))}}
  const collect=()=>{const vve=v("soort")==="vve",zak=v("soort")==="zakelijk"||vve,voor=v("voor"),ach=v("ach"),bedr=v("bedr");
    const naam=zak?(bedr||[voor,ach].filter(Boolean).join(" ")):(ach?ach+(voor?", "+voor:""):voor||bedr);
    if(!naam){$(zak?"#nk-bedr":"#nk-ach").focus();toast(zak?"Vul de bedrijfsnaam in":"Vul een achternaam in");return null}
    const straat=v("straat"),plaats=v("plaats");if(!straat||!plaats){$(straat?"#nk-plaats":"#nk-straat").focus();toast("Vul het adres en de plaats in");return null}
    const telOk=t=>!t||String(t).replace(/\D/g,"").length>=10;if(!telOk(v("tel"))||!telOk(v("mob"))){$(telOk(v("tel"))?"#nk-mob":"#nk-tel").focus();toast("Een telefoonnummer heeft 10 cijfers");return null}
    const gp=v("gepland");
    return {naam,voornaam:voor,achternaam:ach,contact:zak?[voor,ach].filter(Boolean).join(" "):"",bedrijfsnaam:bedr,kvk:v("kvk"),btwnr:v("btw").toUpperCase(),functie:v("fn"),
      klantnr:v("nr"),soort:vve?"vve":zak?"zakelijk":"particulier",...(vve?(()=>{const wd=[...document.querySelectorAll('#nk-wdagen [data-fwd][aria-pressed="true"]')].map(b=>Number(b.dataset.fwd));return{weekdagen:wd,...(wd.length?{autoplan:true}:{}),vveTaken:v("vvetaken").split(/\n/).map(x=>x.trim()).filter(Boolean).slice(0,20)}})():{}),geboortedatum:v("geb"),geslacht:v("gesl"),iban:v("iban").toUpperCase(),rekeninghouder:v("rh"),email:v("email"),website:v("web"),telefoon:v("tel"),mobiel:v("mob"),
      adres:joinAdres(straat,v("huisnr"),v("toev")),straat,huisnr:v("huisnr"),toev:v("toev"),postcode:normPc(v("postcode")),plaats,land:v("land")||"NL",klantNotitie:v("notitie"),
      dienst:v("dienst")||"Glasbewassing",prijs:Number(v("prijs"))||0,frequentie:(vve&&document.querySelector('#nk-wdagen [data-fwd][aria-pressed="true"]'))?1:(Number(v("freq"))||4),duur:Number(v("duur"))||30,ronde:v("ronde"),laatst:v("laatst"),gepland:gp,tijd:gp?v("tijd"):"",notities:v("not"),
      incasso:false,directFactureren:false,binnen:false,objectId:"",actief:true,akkoord:false,geenReview:false,opzegReden:"",aangemaakt:iso(today()),log:[],objecten:[]}};
  let kid="";
  const opslaan=async patch=>{const d=collect();if(!d)return null;if(!kid)kid=newId("k");await save("klanten",kid,{...d,prospect:true,opdrachtVerwijderd:true,...patch});return kid};
  form.onsubmit=async e=>{e.preventDefault();const b=$("#nkSave");b.disabled=true;try{const id=await opslaan({});if(!id){b.disabled=false;return}toast("Klant toegevoegd · maak een offerte om de opdracht vast te leggen");setTimeout(()=>openKlantView(id),60)}catch(er){b.disabled=false;err(er)}};
  $("#nkOff").onclick=async()=>{const b=$("#nkOff");b.disabled=true;try{const id=await opslaan({prospect:true});if(!id){b.disabled=false;return}openOfferte({klantId:id})}catch(er){b.disabled=false;err(er)}};
  setTimeout(()=>{const f=$("#nk-voor");if(f)f.focus()},50)}
