/* ---------- Klanten uit foto (AI) ----------
   Maak een foto of screenshot van een klantkaart of klantenlijst in een ander CRM (of van een papieren kaart).
   De AI leest naam, adres, contact, diensten met frequentie en prijs, datums en notities uit.
   Je controleert alles per klant en zet het met één tik in Mansard: als nieuwe klant of aangevuld bij een bestaande. */
const KFO={fotos:[],res:null,bezig:false,fout:""};
const KFO_FREQ=[[1,"Elke week"],[2,"Elke 2 weken"],[3,"Elke 3 weken"],[4,"Elke 4 weken"],[5,"Elke 5 weken"],[6,"Elke 6 weken"],[8,"Elke 8 weken"],[10,"Elke 10 weken"],[12,"Elke 12 weken"],[13,"Elk kwartaal"],[16,"Elke 16 weken"],[26,"Elk half jaar"],[52,"Elk jaar"]];
function kfNorm(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"")}
function kfDubbel(k){const a=kfNorm(k.adres),p=kfNorm(k.postcode),n=kfNorm(cleanName(k.naam));
  return state.klanten.find(x=>a&&kfNorm(x.adres)===a&&(!p||!x.postcode||kfNorm(x.postcode)===p))||state.klanten.find(x=>n&&n.length>4&&kfNorm(cleanName(x.naam))===n)||null}
function kfPrijs(d){const st=S(),m=1+(Number(st.btw)||21)/100;let p=Number(d.prijs)||0;if(d.incl===true&&!st.incl)p=p/m;if(d.incl===false&&st.incl)p=p*m;return r2(p)}
async function kfVerklein(file){const u=URL.createObjectURL(file),im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=u});
  const m=1800,s=Math.min(1,m/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.round(im.naturalWidth*s),h=Math.round(im.naturalHeight*s);
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(im,0,0,w,h);URL.revokeObjectURL(u);return cv.toDataURL("image/jpeg",.85)}
function kfVoorbeeld(){const j=new Date().getFullYear();return{opmerking:"Voorbeeld in de demo: in je eigen CRM leest de AI de echte foto uit.",klanten:[
  {naam:"Jansen, Piet",contact:"",soort:"particulier",adres:"Kerkstraat 12",postcode:"9351 AB",plaats:"Leek",telefoon:"06 1234 5678",email:"p.jansen@voorbeeld.nl",klantnr:"1043",notities:"Sleutel onder de bloempot · hond in de tuin",
    diensten:[{dienst:"Glasbewassing",frequentie:4,prijs:24.5,incl:true,laatst:j+"-10-02",volgende:j+"-10-30"},{dienst:"Glasbewassing binnen",frequentie:13,prijs:35,incl:true,laatst:"",volgende:""},{dienst:"Dakgoot reinigen",frequentie:52,prijs:45,incl:true,laatst:"",volgende:""}]}]}}
function openKlantFoto(){KFO.fotos=[];KFO.res=null;KFO.bezig=false;KFO.fout="";kfTeken()}
function kfTeken(){
  const head=`<div class="dlg-head"><span class="objic big">${I.camera}</span><div style="flex:1"><h3>Klanten uit foto</h3><div class="subt">AI leest de gegevens uit een ander CRM, kaart of lijst</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>`;
  if(KFO.res){openDlg(head+kfReviewHtml(),{wide:true});kfReviewBind();return}
  openDlg(head+`
    <p class="subt" style="margin:0">Maak een foto van je scherm of een screenshot van de klantkaart in je oude CRM. Meerdere foto's mag (bijvoorbeeld gegevens en diensten op aparte schermen). Ook een klantenlijst met meerdere klanten werkt.</p>
    <div class="kf-fotos">${KFO.fotos.map((f,i)=>`<div class="kf-th"><img src="${f}" alt="Foto ${i+1}"><button type="button" class="iconbtn sm" data-kfrm="${i}" aria-label="Foto verwijderen">${I.x}</button></div>`).join("")}
      <label class="kf-add">${I.camera}<span>${KFO.fotos.length?"Nog een foto":"Foto maken of kiezen"}</span><input type="file" id="kfIn" accept="image/*" multiple hidden></label></div>
    ${KFO.fout?`<div class="notice">${esc(KFO.fout)}</div>`:""}
    ${LIVE&&!S().liveAI?`<div class="notice">AI staat nog uit. Zet hem aan bij Instellingen › AI (je Anthropic-sleutel).</div>`:""}
    <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="button" class="primary" id="kfGo" ${KFO.fotos.length&&!KFO.bezig?"":"disabled"}>${KFO.bezig?I.clock+"Uitlezen…":I.spark+"Gegevens uitlezen"}</button></div>`,{wide:true});
  const inp=$("#kfIn");inp.onchange=async e=>{const fs=[...e.target.files].slice(0,6-KFO.fotos.length);for(const f of fs){try{KFO.fotos.push(await kfVerklein(f))}catch(er){}}KFO.fout="";kfTeken()};
  document.querySelectorAll("[data-kfrm]").forEach(b=>b.onclick=()=>{KFO.fotos.splice(Number(b.dataset.kfrm),1);kfTeken()});
  $("#kfGo").onclick=kfUitlezen}
async function kfUitlezen(){if(!KFO.fotos.length||KFO.bezig)return;KFO.bezig=true;KFO.fout="";kfTeken();
  try{let res;if(!LIVE){await new Promise(r=>setTimeout(r,1400));res=kfVoorbeeld()}else{const r=await fbFn("klantFoto")({fotos:KFO.fotos.map(d=>({data:d.split(",")[1]}))});res=r.data||{}}
    const ks=(res.klanten||[]).map(k=>{const dub=kfDubbel(k);return{...k,mee:true,doel:dub?dub.id:"",diensten:(k.diensten&&k.diensten.length?k.diensten:[{dienst:"Glasbewassing",frequentie:4,prijs:0,incl:null,laatst:"",volgende:""}]).map(d=>({...d,prijs:kfPrijs(d)}))}});
    if(!ks.length){KFO.bezig=false;KFO.fout="Er zijn geen klantgegevens gevonden. Probeer een scherpere foto, recht van voren.";kfTeken();return}
    KFO.res={klanten:ks,opmerking:res.opmerking||""};KFO.bezig=false;kfTeken()}
  catch(e){KFO.bezig=false;KFO.fout=typeof fnFout==="function"?fnFout(e):String(e.message||e);kfTeken()}}
function kfReviewHtml(){const R=KFO.res,n=R.klanten.filter(k=>k.mee).length,eh=S().incl?"incl. btw":"excl. btw";
  const fq=v=>{const l=KFO_FREQ.some(x=>x[0]===v)?KFO_FREQ:[...KFO_FREQ,[v,"Elke "+v+" weken"]].sort((a,b)=>a[0]-b[0]);return l.map(([w,t])=>`<option value="${w}" ${w===v?"selected":""}>${t}</option>`).join("")};
  return `${R.opmerking?`<div class="notice">${esc(R.opmerking)}</div>`:""}<p class="subt" style="margin:0">${plural(R.klanten.length,"klant","klanten")} gevonden. Controleer de gegevens en pas aan waar nodig. Prijzen ${eh}.</p>
  <div class="kf-lijst">${R.klanten.map((k,i)=>{const dub=k.doel&&state.klanten.find(x=>x.id===k.doel);return `<section class="kf-k${k.mee?"":" uit"}" data-i="${i}">
    <div class="kf-kh"><label class="kf-mee"><input type="checkbox" data-f="mee" ${k.mee?"checked":""}><b>${esc(cleanName(k.naam)||k.adres||"Klant "+(i+1))}</b></label>
      ${dub?`<select data-f="doel" class="kf-doel"><option value="${esc(dub.id)}" selected>Aanvullen bij ${esc(cleanName(dub.naam))}</option><option value="">Als nieuwe klant</option></select>`:`<span class="pill neutral">Nieuwe klant</span>`}</div>
    <div class="grid3">
      <label>Naam<input data-f="naam" value="${esc(k.naam)}"></label><label>Contactpersoon<input data-f="contact" value="${esc(k.contact)}"></label>
      <label>Soort<select data-f="soort"><option value="particulier" ${k.soort!=="zakelijk"?"selected":""}>Particulier</option><option value="zakelijk" ${k.soort==="zakelijk"?"selected":""}>Zakelijk</option></select></label>
      <label>Adres<input data-f="adres" value="${esc(k.adres)}"></label><label>Postcode<input data-f="postcode" value="${esc(k.postcode)}"></label><label>Plaats<input data-f="plaats" value="${esc(k.plaats)}"></label>
      <label>Telefoon<input data-f="telefoon" value="${esc(k.telefoon)}"></label><label>E-mail<input data-f="email" value="${esc(k.email)}"></label><label>Klantnummer<input data-f="klantnr" value="${esc(k.klantnr)}"></label></div>
    <span class="eyebrow" style="margin-top:6px">Diensten</span>
    <div class="kf-dl">${k.diensten.map((d,j)=>`<div class="kf-d" data-j="${j}"><input data-d="dienst" value="${esc(d.dienst)}" aria-label="Dienst"><select data-d="frequentie" aria-label="Frequentie">${fq(d.frequentie)}</select><input data-d="prijs" type="number" step="0.01" value="${esc(d.prijs)}" aria-label="Prijs"><input data-d="laatst" type="date" value="${esc(d.laatst)}" aria-label="Laatst gedaan" title="Laatst gedaan"><button type="button" class="iconbtn sm" data-drm="${j}" aria-label="Dienst verwijderen">${I.x}</button></div>`).join("")}
      <div class="kf-dkop"><span>Dienst</span><span>Frequentie</span><span>Prijs</span><span>Laatst gedaan</span><span></span></div>
      <button type="button" class="small ghost" data-dadd style="align-self:flex-start">${I.plus||"+"}Dienst toevoegen</button></div>
    <label class="full">Notities<textarea data-f="notities" rows="2">${esc(k.notities)}</textarea></label></section>`}).join("")}</div>
  <div class="row"><button type="button" class="ghost" id="kfOpnieuw">${I.camera}Andere foto</button><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="button" class="primary" id="kfSave" ${n?"":"disabled"}>${I.check}${n===1?"Zet in Mansard":"Zet "+n+" klanten in Mansard"}</button></div>`}
function kfReviewBind(){const R=KFO.res;
  document.querySelectorAll(".kf-k").forEach(sec=>{const k=R.klanten[Number(sec.dataset.i)];
    sec.querySelectorAll("[data-f]").forEach(el=>{const f=el.dataset.f;el.addEventListener(el.type==="checkbox"||el.tagName==="SELECT"?"change":"input",()=>{k[f]=el.type==="checkbox"?el.checked:el.value;if(f==="mee"||f==="doel")kfTeken()})});
    sec.querySelectorAll(".kf-d").forEach(row=>{const d=k.diensten[Number(row.dataset.j)];row.querySelectorAll("[data-d]").forEach(el=>el.addEventListener(el.tagName==="SELECT"?"change":"input",()=>{const f=el.dataset.d;d[f]=f==="frequentie"?Number(el.value):f==="prijs"?(Number(el.value)||0):el.value}))});
    sec.querySelectorAll("[data-drm]").forEach(b=>b.onclick=()=>{k.diensten.splice(Number(b.dataset.drm),1);kfTeken()});
    const add=sec.querySelector("[data-dadd]");if(add)add.onclick=()=>{k.diensten.push({dienst:"",frequentie:4,prijs:0,incl:null,laatst:"",volgende:""});kfTeken()}});
  $("#kfOpnieuw").onclick=()=>{KFO.res=null;KFO.fotos=[];kfTeken()};
  $("#kfSave").onclick=kfOpslaan}
async function kfOpslaan(){const b=$("#kfSave");b.disabled=true;const R=KFO.res,lijst=R.klanten.filter(k=>k.mee&&(k.naam||k.adres));let n=0,laatste="";const t=iso(today());
  try{for(const k of lijst){const ds=k.diensten.filter(d=>String(d.dienst||"").trim()),h=ds[0]||{dienst:"Glasbewassing",frequentie:4,prijs:0},rest=ds.slice(1);
      const opd=rest.map(d=>({id:newId("o"),dienst:d.dienst.trim(),frequentie:Number(d.frequentie)||4,prijs:Number(d.prijs)||0,laatst:d.laatst||"",volgende:d.volgende&&d.volgende>=t?d.volgende:(d.laatst?iso(addDays(parse(d.laatst),(Number(d.frequentie)||4)*7)):""),actief:true}));
      const log={datum:t,tekst:"Gegevens overgezet uit foto (AI)"};
      const cur=k.doel&&state.klanten.find(x=>x.id===k.doel);
      if(cur){/* aanvullen: alleen lege velden invullen, notities en ontbrekende diensten erbij */
        const vul=(f,v)=>!String(cur[f]||"").trim()&&String(v||"").trim()?{[f]:String(v).trim()}:{};
        const bestaand=new Set([cur.dienst,...(cur.opdrachten||[]).map(o=>o.dienst)].map(kfNorm)),nieuw=[...(kfNorm(h.dienst)&&!bestaand.has(kfNorm(h.dienst))&&cur.dienst?[{id:newId("o"),dienst:h.dienst,frequentie:Number(h.frequentie)||4,prijs:Number(h.prijs)||0,laatst:h.laatst||"",volgende:"",actief:true}]:[]),...opd.filter(o=>!bestaand.has(kfNorm(o.dienst)))];
        await save("klanten",cur.id,{...strip(cur),...vul("contact",k.contact),...vul("adres",k.adres),...vul("postcode",String(k.postcode).toUpperCase()),...vul("plaats",k.plaats),...vul("telefoon",k.telefoon),...vul("email",k.email),...vul("klantnr",k.klantnr),
          ...(!Number(cur.prijs)&&Number(h.prijs)?{prijs:Number(h.prijs),frequentie:Number(h.frequentie)||cur.frequentie||4}:{}),...(!cur.laatst&&h.laatst?{laatst:h.laatst}:{}),
          notities:[cur.notities,k.notities].filter(x=>String(x||"").trim()).join("\n"),opdrachten:[...(cur.opdrachten||[]),...nieuw],log:[...(cur.log||[]),log]});laatste=cur.id}
      else{const id=newId("k");
        await save("klanten",id,{klantnr:k.klantnr||"",naam:k.naam||k.adres,contact:k.contact||"",adres:k.adres||"",postcode:String(k.postcode||"").toUpperCase(),plaats:k.plaats||"",telefoon:k.telefoon||"",email:k.email||"",soort:k.soort==="zakelijk"?"zakelijk":"particulier",
          dienst:String(h.dienst||"Glasbewassing").trim(),frequentie:Number(h.frequentie)||4,prijs:Number(h.prijs)||0,duur:30,laatst:h.laatst||"",gepland:h.volgende&&h.volgende>=t?h.volgende:"",tijd:"",notities:k.notities||"",opdrachten:opd,
          binnen:false,actief:true,aangemaakt:t,log:[log],objecten:[]});laatste=id}
      n++}
    dlg.close();toast(n===1?"Klant staat in Mansard":n+" klanten staan in Mansard");KFO.res=null;KFO.fotos=[];
    if(n===1&&laatste)setTimeout(()=>openKlantView(laatste),250);else{state.tab="klanten";schedule()}}
  catch(e){b.disabled=false;toast(n+" opgeslagen, daarna fout: "+(e.message||e.code))}}
