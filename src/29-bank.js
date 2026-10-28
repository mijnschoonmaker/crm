/* ---------- FACTUREN: selecteren en in één keer afhandelen + BANK (bestand of koppeling) ----------
   Selecteer facturen met de vinkjes en kies onderin wat er moet gebeuren: versturen, herinneren, WIK-brief,
   op betaald zetten, incasso aanbieden of intrekken, oninbaar, PDF's printen.
   Betalingen komen binnen via een bankbestand (CAMT.053, MT940, CSV) of via de bankkoppeling (Enable Banking, PSD2):
   de server zoekt het factuurnummer in de omschrijving en zet de factuur op betaald als het bedrag klopt. */
const FB_SEL=new Set();
function fbSelOpschonen(ids){for(const id of [...FB_SEL])if(!ids.has(id))FB_SEL.delete(id)}
const fbDagen=d=>d?Math.round((today()-parse(d))/DAY):0;
const fbKort=d=>d?fmtD(String(d).slice(0,10)):"";
function fbBankInfo(){return ((RAW.instellingen||[]).find(x=>x.id==="bank"))||{}}
function fbTeBekijken(){return (state.banktx||[]).filter(t=>t.status==="controleren"||t.status==="onbekend")}

/* laatste actie in mensentaal */
function fbLaatste(f){
  const l=[];
  if(f.status==="betaald")l.push([f.betaaldOp,f.betaalwijze==="contant"?"Contant betaald":f.betaalwijze==="pin"?"Per pin betaald":f.betaalwijze==="mollie"?"Online betaald":f.betaalwijze==="incasso"||f.incasso?"Afgeschreven (incasso)":f.bankTx?"Betaald (via bank gekoppeld)":"Betaald per bank"]);
  if(f.oninbaarOp)l.push([f.oninbaarOp,"Oninbaar"]);
  if(f.wikOp)l.push([f.wikOp,"WIK-brief"]);
  if(f.herinnerdOp)l.push([f.herinnerdOp,(Number(f.herinneringen)||1)>1?(Number(f.herinneringen))+"e herinnering":"Herinnering"]);
  if(f.incasso&&f.incassoOp)l.push([String(f.incassoOp).slice(0,10),f.incassoMislukt?"Incasso mislukt":"Incasso aangeboden"]);
  if(f.verstuurdOp)l.push([f.verstuurdOp,"Verstuurd"]);
  l.sort((a,b)=>String(b[0]).localeCompare(String(a[0])));
  return l[0]||null}

function fbTabel(list,F){
  const alle=list.length&&list.every(f=>FB_SEL.has(f.id)),som=list.filter(f=>FB_SEL.has(f.id)).length;
  return `<div class="tablewrap fb-wrap"><table class="t fb-t"><thead><tr><th class="fb-cb"><button type="button" class="fb-box${alle?" on":som?" half":""}" data-act="fbselall" aria-label="Alles selecteren">${I.check}</button></th><th class="fb-nr">Nummer</th><th>Klant</th><th class="fb-hm">Vervalt</th><th class="fb-hm">Laatste actie</th><th class="fb-st">Status</th><th class="r">Bedrag</th><th class="fb-ops"></th></tr></thead>
  <tbody>${list.map(f=>fbRij(f)).join("")}</tbody></table></div>`}
function fbRij(f){
  const st=fStatus(f),t=totals(f).inc,sel=FB_SEL.has(f.id),la=fbLaatste(f),late=st[1]==="Achterstallig"?fbDagen(f.verval):0,openF=st[1]==="Openstaand"||st[1]==="Achterstallig";
  const k=state.klanten.find(x=>x.id===f.klantId),plaats=(k&&k.plaats)||"";
  const pills=[f.incasso&&f.status!=="betaald"?`<span class="pill ${f.incassoMislukt?"late":"brand"}" title="${f.incassoMislukt?"Incasso mislukt: "+esc(f.incassoFout||""):"Wordt automatisch afgeschreven"}">${f.incassoMislukt?"incasso mislukt":"incasso"}</span>`:"",
    openF&&!f.verstuurdOp?`<span class="pill neutral">niet verstuurd</span>`:"",f.betaaldBedrag!==""&&f.betaaldBedrag!=null&&Math.abs(Number(f.betaaldBedrag)-t)>.01&&f.status==="betaald"?`<span class="pill soon">${eur(f.betaaldBedrag)} ontvangen</span>`:""].join("");
  const _v=typeof fhVolgende==="function"?fhVolgende(f):null,_vk=_v&&_v.klaar&&(_v.soort==="herinnering"||_v.soort==="wik");
  const mailAct=f.status==="concept"?"":openF?(f.verstuurdOp?`<button type="button" class="iconbtn fb-q" data-act="fbqher" data-id="${esc(f.id)}" ${_vk?"":"disabled"} title="${_vk?esc(_v.lbl)+" versturen":_v&&_v.datum&&_v.soort!=="bijlikifin"?esc((_v.soort==="likifin"?"Likifin":_v.lbl)+" vanaf "+fmtD(_v.datum)):"Nog geen herinnering nodig"}" aria-label="Herinnering sturen">${I.bell}</button>`:`<button type="button" class="iconbtn fb-q" data-act="fbqsend" data-id="${esc(f.id)}" title="Factuur versturen" aria-label="Factuur versturen">${I.send}</button>`):"";
  return `<tr class="click${sel?" fb-on":""}" data-act="factuur" data-id="${esc(f.id)}"><td class="fb-cb" data-act="fbsel" data-id="${esc(f.id)}"><span class="fb-box${sel?" on":""}">${I.check}</span></td>
    <td class="mono fb-nr">${esc(f.nummer)}<small class="subt fb-d">${fbKort(f.datum)}</small></td>
    <td><b>${esc(cleanName(f.klantNaam))}</b><small class="subt fb-mnr">${esc(f.nummer)} · ${fbKort(f.datum)}</small><small class="subt">${esc([f.klantAdres||"",plaats&&!String(f.klantAdres||"").toLowerCase().includes(plaats.toLowerCase())?plaats:""].filter(Boolean).join(", "))}</small></td>
    <td class="fb-hm">${fbKort(f.verval)}${late?`<small class="fb-late">${late} ${late===1?"dag":"dagen"} te laat</small>`:openF&&f.verval?`<small class="subt">over ${Math.max(0,-fbDagen(f.verval))} d.</small>`:""}</td>
    <td class="fb-hm">${la?`${esc(la[1])}<small class="subt">${fbKort(la[0])}${f.status!=="betaald"?" · "+fbDagen(la[0])+" d. geleden":""}</small>`:`<span class="subt">—</span>`}${typeof fhRegel==="function"?fhRegel(f):""}</td>
    <td class="fb-st">${statusPill(st[0],st[1]==="Achterstallig"?"Te laat":st[1])}${pills?`<div class="fb-pills">${pills}</div>`:""}</td>
    <td class="r amt${late?" fb-al":""}">${eur(t)}${late?`<small class="fb-ml">${late} d. te laat</small>`:""}</td><td class="fb-ops">${mailAct}</td></tr>`}

/* balk onderin zodra er iets is geselecteerd */
function fbBar(all){
  const sel=all.filter(f=>FB_SEL.has(f.id));if(!sel.length)return"";
  const som=sel.reduce((a,f)=>a+totals(f).inc,0),open=sel.filter(f=>f.status==="open"||f.status==="concept"),m=state.fbMenu;
  const knop=(act,ic,l,dis,cls="")=>`<button type="button" class="fb-bk ${cls}" data-act="${act}" ${dis?"disabled":""}>${ic}<span>${l}</span></button>`;
  return `<div class="fb-bar" role="toolbar" aria-label="Acties voor geselecteerde facturen">
    <div class="fb-tel"><b>${sel.length}</b><span>${sel.length===1?"factuur":"facturen"} · ${eur(som)}</span></div>
    ${knop("fbsend",I.send,"Versturen",!open.length)}${knop("fbher",I.bell,"Herinnering",!sel.some(f=>f.status==="open"))}${knop("fbwik",I.alert,"WIK-brief",!sel.some(f=>f.status==="open"))}${knop("fbbank",I.check,"Betaald",!sel.some(f=>f.status!=="betaald"),"ok")}
    <div class="fb-mw"><button type="button" class="fb-bk" data-act="fbmenu" aria-expanded="${!!m}">${I.more}<span>Meer</span></button>${m?`<div class="menu fb-menu">
      <button type="button" data-act="fbcontant">${I.euro}Contant betaald</button><button type="button" data-act="fbpin">${I.card}Per pin betaald</button>
      <button type="button" data-act="fbinc">${I.bank}Incasso klaarzetten (Mollie SEPA)</button><button type="button" data-act="fbincweg">${I.x}Incasso intrekken</button>
      <button type="button" data-act="fbpdf">${I.dl}PDF's downloaden om te printen</button><button type="button" data-act="fbcsv">${I.dl}Exporteer selectie (CSV)</button>
      <button type="button" data-act="fbliki">${I.send}Overgedragen aan Likifin</button><button type="button" data-act="fbheropen">${I.refresh}Weer op openstaand</button><button type="button" data-act="fboninb" class="danger">${I.x}Oninbaar</button></div>`:""}</div>
    <button type="button" class="iconbtn fb-x" data-act="fbclr" aria-label="Selectie wissen" title="Selectie wissen">${I.x}</button></div>`}

/* strook boven de lijst: bankstatus + betalingen die je even moet bekijken */
function fbBankStrook(bk,tc){
  const nc=tc.filter(t=>t.status==="controleren").length,no=tc.filter(t=>t.status==="onbekend").length;
  const lg=bk.gekoppeld?`<span class="fb-bl">${esc((bk.bank||"Bank").slice(0,1))}</span>`:`<span class="fb-bl uit">${I.bank}</span>`;
  const geldig=bk.geldigTot?Math.round((Date.parse(bk.geldigTot)-Date.now())/864e5):null;
  const sub=bk.gekoppeld?(bk.fout?`<em class="fb-fout">${esc(bk.fout)}</em>`:`${bk.bijgewerkt?"Bijgewerkt "+new Date(bk.bijgewerkt).toLocaleString("nl-NL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Wordt zo bijgewerkt"}${bk.saldo!=null?" · saldo "+eur(bk.saldo):""}${geldig!=null&&geldig<=14?` · <em class="fb-fout">toestemming verloopt over ${Math.max(0,geldig)} d.</em>`:""}`)
    :"Betalingen automatisch op betaald: koppel je bank of upload een bankbestand";
  return `<section class="fb-strook"><button type="button" class="fb-bs" data-act="fbbankdlg">${lg}<span class="fb-bt"><b>${bk.gekoppeld?esc(bk.bank||"Bank")+" gekoppeld":"Bankkoppeling"}</b><small>${sub}</small></span>${I.right}</button>
    ${nc||no?`<button type="button" class="fb-rv" data-act="fbreview"><b>${nc+no}</b><span>${nc?plural(nc,"betaling","betalingen")+" controleren":""}${nc&&no?" · ":""}${no?no+" niet herkend":""}</span>${I.right}</button>`:""}</section>`}

/* ---------- acties ---------- */
const fbGekozen=()=>facturen().filter(f=>FB_SEL.has(f.id));
const fbK=f=>state.klanten.find(x=>x.id===f.klantId);
function fbOntvanger(f,soort){const kk=fbK(f),v=factVars(f),t=typeof tavK==="function"?tavK(kk,soort||"factuur"):"";if(t)v.klant=t;return{k:kk?mailK(kk,"factuur"):{naam:f.klantNaam,email:f.klantEmail},v}}
async function fbBetaald(list,wijze){
  const n=list.filter(f=>f.status!=="betaald");if(!n.length)return toast("Deze facturen zijn al betaald");
  const tt=plural(n.length,"factuur","facturen")+" op betaald zetten?",tx=`${wijze==="contant"?"Contant":wijze==="pin"?"Per pin":"Per bank"} · samen <b>${eur(n.reduce((a,f)=>a+totals(f).inc,0))}</b>. Er gaan geen herinneringen meer uit.`;
  const dag=wijze==="bank"?await vraagBetaaldatum(tt,tx):(await vraag(tt,tx,"Op betaald zetten"))?iso(today()):null;if(!dag)return;
  for(const f of n){await save("facturen",f.id,{...strip(f),status:"betaald",betaalwijze:wijze==="bank"?(f.betaalwijze==="incasso"?"incasso":"overmaken"):wijze,betaaldOp:dag,betaaldTs:betaaldTsVan(dag),oninbaarOp:""});
    for(const b of state.beurten.filter(b=>b.gefactureerd===f.id))await save("beurten",b.id,{...strip(b),betaald:true})}
  FB_SEL.clear();state.fbMenu=false;toast(plural(n.length,"factuur","facturen")+" op betaald gezet");render()}
/* verstuurd: vinkje weg; is niets meer geselecteerd, dan verdwijnt ook de balk onderin */
function fbKlaar(id){FB_SEL.delete(id);if(!FB_SEL.size)state.fbMenu=false;schedule()}
function fbVersturen(list){
  const nl=list.filter(f=>f.status==="open"||f.status==="concept");if(!nl.length)return toast("Kies openstaande facturen om te versturen");
  const go=async()=>{for(const f of nl.filter(f=>f.status==="concept"))await save("facturen",f.id,{...strip(f),status:"open"});
    openCompose({title:plural(nl.length,"factuur","facturen")+" versturen",sjabloon:"factuur",hint:liveMail()?"":esc("Wil je de PDF meesturen? Download hem bij de factuur en voeg hem in je mail toe."),
      recipients:nl.map(f0=>{const f=state.facturen.find(x=>x.id===f0.id)||f0,o=fbOntvanger(f);return{k:o.k,vars:o.v,ref:"factuur:"+f.id,onSent:()=>{fbKlaar(f.id);const c=state.facturen.find(x=>x.id===f.id)||f;return save("facturen",f.id,{...strip(c),verstuurdOp:c.verstuurdOp||iso(today()),...naVerstuurd(c)})}}})})};
  go()}
/* herinnering: per factuur de volgende stap uit je instellingen (1e, 2e herinnering), of de WIK-brief */
function fbHerinner(list,wik){
  const M=fhMomenten(),open=list.filter(f=>f.status==="open");if(!open.length)return toast("Kies openstaande facturen");
  const nl=open.filter(f=>{const v=fhVolgende(f);return v&&v.klaar&&(wik?v.soort==="wik":v.soort==="herinnering")}),over=open.filter(f=>!nl.includes(f));
  if(!nl.length){if(open.length===1)fhPoort(open[0],wik);else{const ds=over.map(f=>fhVolgende(f)).filter(v=>v&&v.datum&&!v.klaar).map(v=>v.datum).sort();toast((wik?"Nog geen WIK-brief aan de beurt":"Nog geen herinnering aan de beurt")+(ds[0]?" · eerstvolgende "+fmtD(ds[0]):""))}return}
  if(over.length)toast(plural(over.length,"factuur","facturen")+" overgeslagen: nog niet aan de beurt");
  const wm=M.find(m=>m.wik)||{naam:"WIK-brief",wik:true,...(tpls().wik||{})};
  const items=nl.map(f=>{const o=fbOntvanger(f),n=Number(f.herinneringen)||0;let st=null;
    const v=fhVolgende(f);if(wik)st={...wm,...(v&&v.stap||{}),sms:(v&&v.stap&&v.stap.sms)||wm.sms||wm.mail};else{st=(v&&v.stap)||M.filter(m=>!m.wik)[0]||{};st={...st,naam:st.naam||"Herinnering",sms:st.sms||st.mail}}
    return{k:o.k,vars:o.v,ref:"aanmaning:"+f.id+":"+(wik?"wik":n+1),stap:st,onSent:()=>{fbKlaar(f.id);const c=state.facturen.find(x=>x.id===f.id)||f;return save("facturen",f.id,{...strip(c),herinnerdOp:iso(today()),herinneringen:v&&v.j!=null?v.j+1:(Number(c.herinneringen)||0)+1,...(wik?{wikOp:iso(today())}:{})})}}});
  const T=tpls()[wik?"wik":"aanmaning"]||{};
  openCompose({title:wik?"WIK-brief ("+plural(nl.length,"factuur","facturen")+")":plural(nl.length,"herinnering","herinneringen"),sjabloon:wik?"wik":"aanmaning",recipients:items,tekst:T.sms,mail:T.mail,onderwerp:T.onderwerp,kanaal:"email",
    hint:wik?esc("De WIK-brief geeft de klant 14 dagen om te betalen, met de wettelijke incassokosten. Stuur hem alleen na een gewone herinnering."):""})}
async function fbIncasso(list,weg){
  if(!liveMollie())return toast("Zet eerst Mollie aan bij Instellingen › Koppelingen");
  let ok=0,over=[],fout=0;
  for(const f of list){const k=fbK(f);
    if(weg){if(!f.incasso||f.status==="betaald"){over.push(f.nummer);continue}try{await fbFn("mollieIntrekken")({factuurId:f.id});ok++}catch(e){fout++;toast(f.nummer+": "+fnFout(e))}continue}
    if(f.status!=="open"||f.incasso&&!f.incassoMislukt){over.push(f.nummer);continue}
    if(!(k&&k.incasso&&k.mollieMandateId)){over.push(f.nummer);continue}
    try{await fbFn("mollieIncasso")({factuurId:f.id,bedrag:totals(f).inc,omschrijving:"Factuur "+f.nummer,basis:location.origin});ok++}catch(e){fout++;toast(f.nummer+": "+fnFout(e))}}
  state.fbMenu=false;
  toast(weg?`${plural(ok,"incasso","incasso's")} ingetrokken${over.length?" · "+over.length+" overgeslagen":""}`:`${plural(ok,"factuur","facturen")} klaargezet voor incasso${over.length?" · "+over.length+" overgeslagen (geen machtiging, al aangeboden of niet open)":""}`);render()}
let FB_PDFLIB=null;
function fbPdfLib(){if(window.PDFLib)return Promise.resolve(window.PDFLib);if(FB_PDFLIB)return FB_PDFLIB;
  FB_PDFLIB=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";s.onload=()=>res(window.PDFLib);s.onerror=()=>{FB_PDFLIB=null;rej(new Error("pdf-lib laden mislukt"))};document.head.appendChild(s)});return FB_PDFLIB}
async function fbPdf(list){
  if(!list.length)return;state.fbMenu=false;render();toast("PDF's maken…");
  try{const L=await fbPdfLib(),out=await L.PDFDocument.create();
    for(const f of list){const d=await pdfDoc(f,fbK(f));if(!d)continue;const src=await L.PDFDocument.load(d.output("arraybuffer"));(await out.copyPages(src,src.getPageIndices())).forEach(p=>out.addPage(p))}
    await saveFile((list.length===1?"Factuur "+list[0].nummer:"Facturen "+iso(today())+" ("+list.length+")")+".pdf",(await out.save()).buffer,"PDF opgeslagen: open hem en print alles in één keer")}
  catch(e){console.error(e);toast("PDF's maken lukte niet: "+(e.message||e))}}
async function fbStatus(list,status){
  const n=list.filter(f=>status==="oninbaar"?f.status!=="oninbaar"&&f.status!=="betaald":f.status!=="open");if(!n.length)return toast("Niets om te wijzigen");
  if(status==="oninbaar"&&!(await vraag(plural(n.length,"factuur","facturen")+" op oninbaar zetten?","Er gaan geen herinneringen meer uit. Je kunt ze later weer op openstaand zetten.","Oninbaar")))return;
  for(const f of n){await save("facturen",f.id,{...strip(f),status,...(status==="oninbaar"?{oninbaarOp:iso(today())}:{oninbaarOp:"",betaaldOp:"",betaaldTs:""})});
    if(status==="open")for(const b of state.beurten.filter(b=>b.gefactureerd===f.id&&b.betaald))await save("beurten",b.id,{...strip(b),betaald:false})}
  FB_SEL.clear();state.fbMenu=false;toast(plural(n.length,"factuur","facturen")+(status==="oninbaar"?" op oninbaar gezet":" weer openstaand"));render()}
function fbCsv(list){state.fbMenu=false;saveFile("facturen-selectie-"+iso(today())+".csv",csvOf(["nummer","datum","verval","klant","adres","status","laatste actie","incl"],list.map(f=>{const la=fbLaatste(f);return{nummer:f.nummer,datum:f.datum,verval:f.verval,klant:cleanName(f.klantNaam),adres:f.klantAdres||"",status:fStatus(f)[1],"laatste actie":la?la[1]+" "+fbKort(la[0]):"",incl:totals(f).inc}})),"Selectie opgeslagen")}

function fbAct(a,t,e){
  const id=t.dataset.id;
  switch(a){
    case"fbsel":if(e)e.stopPropagation();if(FB_SEL.has(id))FB_SEL.delete(id);else FB_SEL.add(id);render();break;
    case"fbselall":{const ids=[...document.querySelectorAll(".fb-t tbody tr[data-id]")].map(r=>r.dataset.id),all=ids.every(x=>FB_SEL.has(x));ids.forEach(x=>all?FB_SEL.delete(x):FB_SEL.add(x));render();break}
    case"fbclr":FB_SEL.clear();state.fbMenu=false;render();break;
    case"fbmenu":state.fbMenu=!state.fbMenu;render();break;
    case"fbsend":fbVersturen(fbGekozen());break;
    case"fbher":fbHerinner(fbGekozen(),false);break;
    case"fbwik":fbHerinner(fbGekozen(),true);break;
    case"fbbank":fbBetaald(fbGekozen(),"bank");break;
    case"fbcontant":fbBetaald(fbGekozen(),"contant");break;
    case"fbpin":fbBetaald(fbGekozen(),"pin");break;
    case"fbinc":fbIncasso(fbGekozen(),false);break;
    case"fbincweg":fbIncasso(fbGekozen(),true);break;
    case"fbpdf":fbPdf(fbGekozen());break;
    case"fbcsv":fbCsv(fbGekozen());break;
    case"fboninb":fbStatus(fbGekozen(),"oninbaar");break;
    case"fbheropen":fbStatus(fbGekozen(),"open");break;
    case"fbqsend":if(e)e.stopPropagation();sendF(id,{direct:true,btn:t});break;
    case"fbqher":if(e)e.stopPropagation();{const f=state.facturen.find(x=>x.id===id),v=f&&fhVolgende(f);if(f)fbHerinner([f],!!(v&&v.soort==="wik"))}break;
    case"fbliki":fhLikifin(fbGekozen());break;
    case"fbupload":fbKiesBestand();break;
    case"fbbankdlg":fbBankDlg();break;
    case"fbreview":fbReview();break;
  }}
document.addEventListener("click",e=>{if(state.fbMenu&&!e.target.closest(".fb-mw")){state.fbMenu=false;render()}},true);

/* ---------- bankbestand lezen ---------- */
const fbNum=s=>{s=String(s||"").trim().replace(/[€\s]/g,"");if(!s)return NaN;const neg=/^-|-$|^\(.*\)$/.test(s);s=s.replace(/[()+-]/g,"");if(/,\d{1,2}$/.test(s))s=s.replace(/\./g,"").replace(",",".");else s=s.replace(/,/g,"");const n=Number(s);return neg?-n:n};
function fbDatum(s){s=String(s||"").trim();let m;
  if(m=s.match(/^(\d{4})-?(\d{2})-?(\d{2})/))return `${m[1]}-${m[2]}-${m[3]}`;
  if(m=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  if(m=s.match(/^(\d{2})(\d{2})(\d{2})$/))return `20${m[1]}-${m[2]}-${m[3]}`;return ""}
function fbCamt(xml){
  const d=new DOMParser().parseFromString(xml,"application/xml");if(d.querySelector("parsererror"))throw new Error("Dit XML-bestand kan ik niet lezen");
  const q=(el,...pad)=>{let cur=[el];for(const n of pad){cur=cur.flatMap(c=>[...c.children].filter(x=>x.localName===n));if(!cur.length)return null}return cur[0]};
  const tx=(el,...p)=>{const x=q(el,...p);return x?x.textContent.trim():""};
  const out=[];
  [...d.getElementsByTagNameNS("*","Ntry")].forEach(n=>{
    const cd=tx(n,"CdtDbtInd"),amt=Number(tx(n,"Amt"))||0,dt=tx(n,"BookgDt","Dt")||tx(n,"BookgDt","DtTm")||tx(n,"ValDt","Dt");
    const dets=[...n.getElementsByTagNameNS("*","TxDtls")];
    const one=(td,bedrag)=>{const rp=td?q(td,"RltdPties"):null;
      const naam=rp?(tx(rp,"Dbtr","Nm")||tx(rp,"Dbtr","Pty","Nm")):"",iban=rp?(tx(rp,"DbtrAcct","Id","IBAN")):"";
      const rmt=td?[...td.getElementsByTagNameNS("*","Ustrd")].map(x=>x.textContent.trim()).concat([...td.getElementsByTagNameNS("*","Ref")].filter(x=>x.parentElement&&x.parentElement.localName==="CdtrRefInf").map(x=>x.textContent.trim())).join(" "):"";
      out.push({datum:fbDatum(dt),bedrag:(cd==="DBIT"?-1:1)*bedrag,naam,iban,omschrijving:rmt||tx(n,"AddtlNtryInf"),ref:(td&&tx(td,"Refs","EndToEndId").replace(/^NOTPROVIDED$/,""))||tx(n,"AcctSvcrRef")||tx(n,"NtryRef")})};
    if(dets.length>1)dets.forEach(td=>one(td,Number(tx(td,"Amt"))||Number(tx(td,"AmtDtls","TxAmt","Amt"))||amt/dets.length));else one(dets[0]||null,amt)});
  return out}
function fbMt940(txt){
  const out=[],lines=txt.replace(/\r/g,"").split("\n");let cur=null,in86=false;
  const push=()=>{if(!cur)return;const d=cur.d86.replace(/\n/g,"");const tag=k=>{const m=d.match(new RegExp("/"+k+"/([^/]*)"));return m?m[1].trim():""};
    const naam=tag("NAME"),rem=tag("REMI")||tag("USTD"),iban=tag("IBAN")||(d.match(/\b[A-Z]{2}\d{2}[A-Z]{4}\d{6,}\b/)||[""])[0];
    out.push({datum:cur.datum,bedrag:cur.bedrag,naam,iban,omschrijving:rem||d.replace(/\/[A-Z]{2,5}\//g," ").trim(),ref:tag("EREF").replace(/^NOTPROVIDED$/,"")});cur=null};
  for(const l of lines){
    if(l.startsWith(":61:")){push();in86=false;const m=l.slice(4).match(/^(\d{6})(\d{4})?(R?[CD])([A-Z])?([\d,]+)/);if(m){const v=Number(m[5].replace(",","."));cur={datum:fbDatum(m[1]),bedrag:/D/.test(m[3])!==/^R/.test(m[3])?-v:v,d86:""}}}
    else if(l.startsWith(":86:")){if(cur){cur.d86=l.slice(4);in86=true}}
    else if(/^:\d{2}[A-Z]?:/.test(l)){in86=false}
    else if(in86&&cur)cur.d86+=l}
  push();return out}
function fbCsvLees(txt){
  txt=txt.replace(/^﻿/,"");const r=txt.split(/\r?\n/).filter(l=>l.trim());
  const delim=[";",",","\t"].sort((a,b)=>r.slice(0,5).join("").split(b).length-r.slice(0,5).join("").split(a).length)[0];
  const cells=l=>{const o=[];let c="",q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===delim){o.push(c);c=""}else c+=ch}o.push(c);return o.map(x=>x.trim())};
  let hi=r.findIndex(l=>/bedrag|amount/i.test(l)&&/datum|date/i.test(l));const rows=r.map(cells);
  let H;if(hi<0){/* Knab en sommige banken: zonder kopregel */H=null;hi=-1}else H=rows[hi].map(h=>h.toLowerCase());
  const col=(...re)=>{if(!H)return -1;for(const x of re){const i=H.findIndex(h=>x.test(h));if(i>=0)return i}return -1};
  const cD=col(/^boekdatum/,/transactiedatum/,/^datum/,/date/),cB=col(/^bedrag/,/amount/),cCD=col(/credit.?debet|debet.?credit|af.?bij|^af\/bij|^cd$/),cN=col(/tegenrekeninghouder/,/naam.*tegen|^naam/,/name/,/omschrijving-1/),cI=col(/^tegenrekening(nummer)?$/,/tegenrekening/,/counterparty/,/iban tegen/),cO=col(/^omschrijving$/,/mededeling/,/description/,/omschrijving/),cR=col(/^referentie$/,/^kenmerk$/);
  const out=[];
  for(const c of rows.slice(hi+1)){
    if(!H){/* KNAB-export zonder kop: rekening;datum;valuta;C/D;bedrag;tegenrekening;naam;valutadatum;betaalwijze;omschrijving */if(c.length<10||!fbDatum(c[1]))continue;const v=fbNum(c[4]);out.push({datum:fbDatum(c[1]),bedrag:/^d/i.test(c[3])?-Math.abs(v):Math.abs(v),iban:c[5],naam:c[6],omschrijving:c[9]||"",ref:c[14]||""});continue}
    const dt=fbDatum(c[cD]);let v=fbNum(c[cB]);if(!dt||isNaN(v))continue;
    if(cCD>=0){const x=String(c[cCD]).toLowerCase();if(/^(d|af|debet|debit)/.test(x))v=-Math.abs(v);else if(/^(c|bij|credit)/.test(x))v=Math.abs(v)}
    out.push({datum:dt,bedrag:v,naam:cN>=0?c[cN]:"",iban:cI>=0?c[cI]:"",omschrijving:cO>=0?c[cO]:"",ref:cR>=0?c[cR]:""})}
  return out}
/* ABN AMRO .TAB-export (zonder kopregel): rekening, munt, datum, beginsaldo, eindsaldo, rentedatum, bedrag, omschrijving */
function fbAbnTab(txt){const out=[];
  txt.split(/\r?\n/).forEach(l=>{const c=l.split("\t");if(c.length<8||!/^\d{8}$/.test(c[2].trim()))return;const v=fbNum(c[6]);if(isNaN(v))return;
    const o=c.slice(7).join(" ").replace(/\s+/g," ").trim(),tag=k=>{const m=o.match(new RegExp("/"+k+"/([^/]*)"));return m?m[1].trim():""},lbl=k=>{const m=o.match(new RegExp(k+":\\s*(.*?)(?=\\s+(?:IBAN|BIC|Naam|Omschrijving|Kenmerk|Machtiging|Incassant):|$)","i"));return m?m[1].trim():""};
    out.push({datum:fbDatum(c[2].trim()),bedrag:v,naam:tag("NAME")||lbl("Naam"),iban:tag("IBAN")||lbl("IBAN"),omschrijving:tag("REMI")||lbl("Omschrijving")||o,ref:tag("EREF").replace(/^NOTPROVIDED$/,"")||lbl("Kenmerk")})});
  return out}
function fbLees(naam,txt){
  const t=txt.trim();
  if(/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}\t[A-Z]{3}\t\d{8}\t/m.test(t))return fbAbnTab(t);
  if(/^<\?xml|<Document[\s>]/i.test(t)&&/BkToCstmrStmt|Ntry/.test(t))return fbCamt(t);
  if(/^:20:|\n:61:/.test(t)||/:61:\d{6}/.test(t))return fbMt940(t);
  return fbCsvLees(t)}
function fbKiesBestand(){const i=document.createElement("input");i.type="file";i.accept=".xml,.csv,.txt,.tab,.sta,.940,.mt940,.zip";i.multiple=true;
  i.onchange=async()=>{const files=[...i.files];if(!files.length)return;let tx=[],namen=[];
    for(const f of files){try{const l=fbLees(f.name,await f.text());tx=tx.concat(l);namen.push(f.name)}catch(e){toast(f.name+": "+(e.message||"kan ik niet lezen"))}}
    const bij=tx.filter(x=>x.bedrag>0&&x.datum);
    if(!tx.length)return toast("Geen transacties gevonden. Kies een CAMT.053 (XML), MT940 of CSV-bestand van je bank.");
    if(!LIVE){toast(`${plural(tx.length,"transactie","transacties")} gelezen, ${bij.length} bijschrijvingen. Koppelen gebeurt in de live-versie.`);return}
    fbBezig("Betalingen koppelen…",`${plural(bij.length,"bijschrijving","bijschrijvingen")} uit ${esc(namen.join(", "))}`);
    try{const r=await fbFn("bankVerwerk")({tx:bij,naam:namen.join(", ")});fbUitslag(r.data,"Bankbestand verwerkt")}catch(e){dlg.close();toast("Verwerken lukte niet: "+fnFout(e))}};
  i.click()}
function fbBezig(t,s){openDlg(`<div class="fb-bezig"><div class="spin"></div><b>${esc(t)}</b><span>${s}</span></div>`)}
function fbUitslag(r,titel){
  const b=r.betaald||[];
  openDlg(`<div class="dlg-head"><span class="objic big ok">${I.check}</span><div style="flex:1"><h3>${esc(titel)}</h3><div class="subt">${plural(r.nieuw||0,"nieuwe bijschrijving","nieuwe bijschrijvingen")}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="fb-us"><div class="ok"><b>${b.length}</b><span>op betaald gezet</span></div><div class="${r.controleren?"soon":""}"><b>${r.controleren||0}</b><span>controleren</span></div><div><b>${r.onbekend||0}</b><span>niet herkend</span></div></div>
    ${b.length?`<div class="fb-ul">${b.slice(0,40).map(x=>`<div><span class="mono">${esc(x.nummer)}</span><b>${esc(cleanName(x.naam))}</b><em>${eur(x.bedrag)}</em></div>`).join("")}${b.length>40?`<div class="subt">en ${b.length-40} meer</div>`:""}</div>`:""}
    ${r.nieuw===0?`<p class="subt" style="margin:0">Alle betalingen in dit bestand waren al eerder verwerkt.</p>`:""}
    <div class="row"><span class="sp"></span>${r.controleren||r.onbekend?`<button type="button" class="primary" data-act="fbreview">Bekijk de rest</button>`:`<button type="button" class="primary" data-act="close">Klaar</button>`}</div>`)}

/* ---------- betalingen nakijken: koppelen aan een factuur of negeren ---------- */
let FB_RV="controleren";
function fbReview(){
  const all=(state.banktx||[]).slice().sort((a,b)=>String(b.datum).localeCompare(String(a.datum))),T=FB_RV;
  const L={controleren:all.filter(t=>t.status==="controleren"),onbekend:all.filter(t=>t.status==="onbekend"),gekoppeld:all.filter(t=>t.status==="gekoppeld").slice(0,60),genegeerd:all.filter(t=>t.status==="genegeerd"||t.status==="dubbel").slice(0,60)};
  const open=facturen().filter(f=>f.status==="open"||f.status==="oninbaar");
  const opties=(t)=>{const sel=t.voorstel||(t.factuurIds||[])[0]||"";const l=open.slice().sort((a,b)=>Math.abs(totals(a).inc-t.bedrag)-Math.abs(totals(b).inc-t.bedrag)).slice(0,60);
    if(sel&&!l.some(f=>f.id===sel)){const f=state.facturen.find(x=>x.id===sel);if(f)l.unshift(f)}
    return `<option value="">Kies een factuur…</option>${l.map(f=>`<option value="${esc(f.id)}" ${f.id===sel?"selected":""}>${esc(f.nummer)} · ${esc(cleanName(f.klantNaam))} · ${eur(totals(f).inc)}${Math.abs(totals(f).inc-t.bedrag)<=.01?" ✓":""}</option>`).join("")}`};
  const rij=t=>`<div class="fb-tx" data-tx="${esc(t.id)}"><div class="fb-tx-a"><b>${esc(t.naam||"Onbekende afzender")}</b><em>${eur(t.bedrag)}</em></div>
    <div class="fb-tx-m">${fbKort(t.datum)}${t.iban?" · "+esc(t.iban.replace(/^(.{4}).*(.{4})$/,"$1 •••• $2")):""}${t.omschrijving?" · "+esc(t.omschrijving):""}</div>
    ${t.reden?`<div class="fb-tx-r ${t.status}">${esc(t.reden)}</div>`:""}
    ${t.status==="controleren"||t.status==="onbekend"?`<div class="fb-tx-k"><select data-fbsel>${opties(t)}</select><button type="button" class="small primary" data-fbk="koppel">${I.check}Koppel</button><button type="button" class="small ghost" data-fbk="negeer">Negeer</button></div>`
      :t.status==="gekoppeld"?`<div class="fb-tx-k"><span class="subt">Factuur ${esc((t.nummers||[]).join(", "))}</span><span class="sp"></span><button type="button" class="small ghost" data-fbk="terug">Ongedaan maken</button></div>`
      :`<div class="fb-tx-k"><span class="sp"></span><button type="button" class="small ghost" data-fbk="herstel">Toch bekijken</button></div>`}</div>`;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.bank}</span><div style="flex:1"><h3>Bankbetalingen</h3><div class="subt">Betalingen zonder duidelijke factuur koppel je hier met één klik</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="tabsline" style="margin:0">${[["controleren","Controleren"],["onbekend","Niet herkend"],["gekoppeld","Gekoppeld"],["genegeerd","Genegeerd"]].map(([v,l])=>`<button type="button" data-fbrv="${v}" aria-pressed="${T===v}">${l}<span class="n">${L[v].length}</span></button>`).join("")}</div>
    <div class="fb-txl">${L[T].length?L[T].map(rij).join(""):`<p class="subt" style="text-align:center;padding:30px 0;margin:0">${T==="controleren"?"Niets te controleren. Alles is gekoppeld.":T==="onbekend"?"Geen onbekende betalingen.":"Nog niets."}</p>`}</div>
    <div class="row"><button type="button" class="small" data-act="fbupload">${I.upload}Bankbestand uploaden</button><span class="sp"></span><button type="button" data-act="close">Klaar</button></div>`,{wide:true});
  form.querySelectorAll("[data-fbrv]").forEach(b=>b.onclick=()=>{FB_RV=b.dataset.fbrv;fbReview()});
  form.querySelectorAll("[data-fbk]").forEach(b=>b.onclick=async()=>{const el=b.closest("[data-tx]"),t=(state.banktx||[]).find(x=>x.id===el.dataset.tx);if(!t)return;
    try{if(b.dataset.fbk==="koppel"){const fid=el.querySelector("[data-fbsel]").value;if(!fid)return toast("Kies eerst een factuur");await fbKoppel(t,fid)}
      else if(b.dataset.fbk==="negeer")await save("banktx",t.id,{...strip(t),status:"genegeerd",reden:"Door jou genegeerd"});
      else if(b.dataset.fbk==="herstel")await save("banktx",t.id,{...strip(t),status:"onbekend",reden:"Terug om te bekijken"});
      else if(b.dataset.fbk==="terug")await fbOntkoppel(t);
      setTimeout(fbReview,60)}catch(e){err(e)}})}
async function fbKoppel(t,fid){
  const f=state.facturen.find(x=>x.id===fid);if(!f)return;const tot=totals(f).inc;
  await save("facturen",f.id,{...strip(f),status:"betaald",betaalwijze:f.betaalwijze==="incasso"?"incasso":"overmaken",betaaldOp:t.datum,betaaldTs:betaaldTsVan(t.datum),bankTx:t.id,oninbaarOp:"",...(Math.abs(tot-t.bedrag)>.01?{betaaldBedrag:t.bedrag}:{}),log:[...(f.log||[]),{datum:new Date().toISOString(),tekst:"Betaling via de bank gekoppeld"+(t.naam?" ("+t.naam+", "+eur(t.bedrag)+")":"")}]});
  for(const b of state.beurten.filter(b=>b.gefactureerd===f.id))await save("beurten",b.id,{...strip(b),betaald:true});
  const k=fbK(f),ib=String(t.iban||"").replace(/\s/g,"").toUpperCase();
  if(k&&ib&&!(k.bankIbans||[]).includes(ib))await save("klanten",k.id,{...strip(k),bankIbans:[...(k.bankIbans||[]),ib].slice(-4)});
  await save("banktx",t.id,{...strip(t),status:"gekoppeld",factuurIds:[f.id],nummers:[f.nummer],reden:"Door jou gekoppeld"+(Math.abs(tot-t.bedrag)>.01?` (factuur ${eur(tot)})`:""),voorstel:""});
  toast("Factuur "+f.nummer+" staat op betaald")}
async function fbOntkoppel(t){
  for(const fid of t.factuurIds||[]){const f=state.facturen.find(x=>x.id===fid);if(f&&f.status==="betaald"&&f.bankTx===t.id){await save("facturen",f.id,{...strip(f),status:"open",betaaldOp:"",betaaldTs:"",bankTx:"",betaaldBedrag:""});for(const b of state.beurten.filter(b=>b.gefactureerd===f.id))await save("beurten",b.id,{...strip(b),betaald:false})}}
  await save("banktx",t.id,{...strip(t),status:"onbekend",reden:"Koppeling ongedaan gemaakt",factuurIds:[],nummers:[]});toast("Koppeling ongedaan gemaakt")}

/* ---------- bankkoppeling instellen ---------- */
function fbBankDlg(){
  const bk=fbBankInfo(),terug=(/^https:/.test(location.origin)?location.origin:"https://crm.mijnschoonmaker.com")+"/api/bank/terug",eig=typeof vgEigenaar==="function"?vgEigenaar():isEigenaar();
  const geldig=bk.geldigTot?new Date(bk.geldigTot):null,dg=geldig?Math.round((geldig-Date.now())/864e5):null;
  const stap=(n,t,b)=>`<div class="fb-stap"><span>${n}</span><div><b>${t}</b><p>${b}</p></div></div>`;
  const lb=bk.laatsteBestand;
  openDlg(`<div class="dlg-head"><span class="objic big">${I.bank}</span><div style="flex:1"><h3>Bankkoppeling</h3><div class="subt">Betalingen van klanten automatisch op de juiste factuur</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    ${bk.gekoppeld?`<section class="fb-kc"><div class="fb-kc-t"><span class="fb-bl xl">${esc((bk.bank||"B").slice(0,1))}</span><div><b>${esc(bk.bank||"Bank")} is gekoppeld</b><small>${(bk.rekeningen||[]).map(r=>esc(r.iban+(r.naam?" · "+r.naam:""))).join("<br>")}</small></div><span class="pill ${bk.fout?"late":"ok"} dotp">${bk.fout?"Let op":"Actief"}</span></div>
      <div class="fb-kc-g"><div><small>Bijgewerkt</small><b>${bk.bijgewerkt?new Date(bk.bijgewerkt).toLocaleString("nl-NL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"—"}</b></div><div><small>Saldo</small><b>${bk.saldo!=null?eur(bk.saldo):"—"}</b></div><div><small>Toestemming tot</small><b class="${dg!=null&&dg<=14?"fb-fout":""}">${geldig?geldig.toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"—"}</b></div></div>
      ${bk.fout?`<div class="warnbox">${I.alert}<span>${esc(bk.fout)}</span></div>`:""}
      ${bk.laatsteSync?`<p class="subt" style="margin:0">Laatste keer: ${plural(bk.laatsteSync.nieuw||0,"nieuwe bijschrijving","nieuwe bijschrijvingen")}, ${bk.laatsteSync.betaald||0} op betaald gezet${bk.laatsteSync.controleren?", "+bk.laatsteSync.controleren+" controleren":""}.</p>`:""}
      <p class="subt" style="margin:0">Elke dag om 8, 12, 16 en 20 uur kijken we automatisch naar nieuwe bijschrijvingen. Een factuur gaat op betaald als het factuurnummer in de omschrijving staat en het bedrag klopt. De bank geeft alleen leesrechten: er kan nooit geld af.</p>
      <div class="row"><button type="button" class="small primary" id="fbNu">${I.refresh}Nu bijwerken</button><button type="button" class="small" id="fbOpn">Opnieuw koppelen</button><span class="sp"></span><button type="button" class="small ghost danger" id="fbUit">Ontkoppelen</button></div></section>`
    :`<section class="fb-uitleg"><p>Koppel je zakelijke rekening, bijvoorbeeld bij Knab. Het CRM kijkt dan vier keer per dag naar nieuwe bijschrijvingen en zet facturen <b>automatisch op betaald</b>. Net als bij SnelStart werkt dit via PSD2 met alleen leesrechten. De koppeling loopt via <b>Enable Banking</b>, een erkende partij die gratis is voor je eigen rekeningen.</p>
      ${stap(1,"Maak een gratis account bij Enable Banking",`Ga naar <a href="https://enablebanking.com/sign-in/" target="_blank" rel="noopener">enablebanking.com</a>. Kies bij <i>API applications</i> voor <b>Add a new application</b>, omgeving <b>Production</b>. Vul als redirect URL in: <code class="fb-code">${esc(terug)}</code> <button type="button" class="tiny" id="fbCopy">${I.copy}Kopieer</button>. Na opslaan downloadt je browser een sleutelbestand (.pem).`)}
      ${stap(2,"Koppel je rekening bij Enable Banking","Klik bij je nieuwe applicatie op <b>Link accounts</b> en log in bij Knab. Dit moet één keer, want in de gratis versie kan alleen een rekening die je daar hebt gekoppeld worden gelezen.")}
      ${stap(3,"Vul hier de App ID en de sleutel in",eig?`<span class="fb-in fb-rij"><input id="fbApp" placeholder="${bk.sleutel?"Ingesteld · laat leeg om te houden":"Application ID, bijv. 3f9c…"}" autocomplete="off"><label class="btn small">${I.upload}<span id="fbPemL">${bk.sleutel?"Andere .pem kiezen":".pem kiezen"}</span><input type="file" id="fbPem" accept=".pem,.key,.txt" hidden></label><button type="button" class="small primary" id="fbSla">Opslaan</button></span>`:"Alleen de eigenaar van het CRM kan dit doen.")}
      ${stap(4,"Koppel",`<span class="fb-in"><select id="fbBank"><option>Knab</option><option>ING</option><option>Rabobank</option><option>ABN AMRO</option><option>bunq</option><option>Triodos Bank</option><option>ASN Bank</option><option>SNS</option><option>RegioBank</option></select><button type="button" class="small primary" id="fbKop">${I.bank}Koppel mijn bank</button></span><small class="subt">Je logt in bij je bank en geeft toestemming (meestal 90 of 180 dagen). Daarna kom je hier terug.</small>`)}
    </section>`}
    <section class="fb-bestand"><div><b>Liever zelf een bankbestand uploaden?</b><p class="subt" style="margin:2px 0 0">Download in je bankapp een afschrift als <b>CAMT.053</b> (XML), <b>MT940</b> of <b>CSV</b> en upload het hier. Dezelfde betaling wordt nooit twee keer verwerkt.${lb?`<br>Laatste bestand: ${esc(lb.naam)} · ${new Date(lb.op).toLocaleDateString("nl-NL")} · ${lb.betaald||0} op betaald gezet`:""}</p></div><button type="button" class="small" data-act="fbupload">${I.upload}Bankbestand uploaden</button></section>
    <div class="row fb-foot"><button type="button" class="ghost" data-act="fbreview">${I.receipt}Alle bankbetalingen</button><span class="sp"></span><button type="button" data-act="close">Klaar</button></div>`,{wide:true});
  const on=(id,f)=>{const el=document.getElementById(id);if(el)el.onclick=f};
  on("fbCopy",e=>copy(terug,e.currentTarget));
  let pem="";const pi=document.getElementById("fbPem");if(pi)pi.onchange=async()=>{const f=pi.files[0];if(!f)return;pem=(await f.text()).trim();if(!/BEGIN (RSA |EC )?PRIVATE KEY/.test(pem)){pem="";toast("Dit is geen geldig .pem-sleutelbestand");return}$("#fbPemL").textContent="✓ "+f.name;$("#fbPemL").closest("label").classList.add("fb-ok")};
  /* opslaan: App ID en sleutel apart onthouden, zodat je ze ook na elkaar kunt invullen */
  const bewaar=async()=>{const app=($("#fbApp")||{value:""}).value.trim();
    if(app&&!/^[0-9a-f-]{20,60}$/i.test(app)){toast("Deze App ID ziet er niet goed uit");return false}
    if(!app&&!pem)return true;
    await fsDb().doc("geheim/config").set({...(app?{ebApp:app}:{}),...(pem?{ebKey:pem}:{})},{merge:true});
    const nb={...strip(bk),...(app?{app:true}:{}),...(pem?{pemOk:true}:{})};nb.sleutel=!!((nb.app||bk.sleutel)&&(nb.pemOk||bk.sleutel));await save("instellingen","bank",nb);Object.assign(bk,nb);return true};
  const ontbreekt=()=>{const app=($("#fbApp")||{value:""}).value.trim();const a=app||bk.app||bk.sleutel,p=pem||bk.pemOk||bk.sleutel;return !a&&!p?"Vul de App ID in en kies het .pem-bestand":!a?"Vul de App ID in":!p?"Kies het .pem-bestand (klik op .pem kiezen)":""};
  on("fbSla",async()=>{if(!LIVE)return toast("Werkt in de live-versie");const m=ontbreekt();try{if(!(await bewaar()))return;toast(m?"Opgeslagen · "+m:"Opgeslagen. Klik nu op Koppel mijn bank");if(!m)setTimeout(fbBankDlg,80)}catch(e){toast("Opslaan lukte niet: "+fnFout(e))}});
  on("fbKop",async e=>{if(!LIVE)return toast("Werkt in de live-versie");const m=ontbreekt();if(m)return toast(m);const b=e.currentTarget;b.disabled=true;b.innerHTML=I.clock+"Bank openen…";
    try{if(!(await bewaar())){b.disabled=false;b.innerHTML=I.bank+"Koppel mijn bank";return}const r=await fbFn("bankStart")({bank:$("#fbBank").value,basis:location.origin});location.href=r.data.url}catch(er){b.disabled=false;b.innerHTML=I.bank+"Koppel mijn bank";toast("Koppelen lukte niet: "+fnFout(er))}});
  on("fbOpn",async e=>{if(!LIVE)return;const b=e.currentTarget;b.disabled=true;try{const r=await fbFn("bankStart")({bank:bk.bank||"Knab",basis:location.origin});location.href=r.data.url}catch(er){b.disabled=false;toast("Koppelen lukte niet: "+fnFout(er))}});
  on("fbNu",async e=>{if(!LIVE)return;const b=e.currentTarget;b.disabled=true;b.innerHTML=I.clock+"Bijwerken…";
    try{const r=await fbFn("bankNu")({});fbUitslag(r.data,"Bank bijgewerkt")}catch(er){b.disabled=false;b.innerHTML=I.refresh+"Nu bijwerken";toast(fnFout(er))}});
  on("fbUit",async()=>{if(!(await vraag("Bank ontkoppelen?","Facturen gaan dan niet meer automatisch op betaald. Je kunt altijd opnieuw koppelen.","Ontkoppelen")))return;try{await fbFn("bankOntkoppel")({});toast("Bank ontkoppeld");setTimeout(fbBankDlg,300)}catch(e){toast(fnFout(e))}})}

/* terug van de bank */
if(typeof location!=="undefined"&&/[?&]bank=/.test(location.search)){const q=new URLSearchParams(location.search),ok=q.get("bank")==="ok",m=q.get("m")||"";
  try{history.replaceState(null,"",location.pathname+location.hash)}catch(_){}
  setTimeout(()=>{try{go("facturen")}catch(_){}toast(ok?"Je bank is gekoppeld. Betalingen worden nu automatisch verwerkt.":"Koppelen lukte niet"+(m?": "+m:""));if(ok)setTimeout(fbBankDlg,600)},1500)}
