/* ---------- Factuur-PDF voor het klantportaal ----------
   De klant moet in zijn portaal precies de factuur zien die wij maken. Het CRM maakt daarom van elke
   definitieve factuur de echte PDF (dezelfde als bij Downloaden) en bewaart die. Verandert de factuur,
   de status of de huisstijl, dan wordt de PDF automatisch opnieuw gemaakt. */
const pdfHash=t=>{let h=5381;for(let i=0;i<t.length;i++)h=(h*33^t.charCodeAt(i))>>>0;return h.toString(36)+t.length.toString(36)};
function pdfSigRuw(f){try{return pdfHash(JSON.stringify(invModel(f))+"|"+(S().logo||"")+"|"+(f.status||"")+"|opmaak6")}catch(e){return""}}
/* snelheid: de handtekening van elke factuur werd elke 20 seconden opnieuw uitgerekend (alle facturen, ~1 s rekenwerk,
   op een telefoon enkele seconden waarin de app niet reageert). Nu alleen opnieuw als de factuur, de klant,
   de bedrijfsgegevens of de datum veranderd zijn. */
const PDFSIG_C=new WeakMap(),pdfKlantIdx=tikMemo("pdfk",()=>{const m=new Map();(state.klanten||[]).forEach(k=>m.set(k.id,k));return m});
function pdfSig(f){if(!f||typeof f!=="object")return pdfSigRuw(f);const st=state.settings,k=pdfKlantIdx().get(f.klantId)||null,d=iso(today()),c=PDFSIG_C.get(f);
  if(c&&c.st===st&&c.k===k&&c.d===d)return c.sig;const sig=pdfSigRuw(f);PDFSIG_C.set(f,{st,k,d,sig});return sig}
let pdfBezig=false,pdfMislukt=new Set();
/* PDF's maken kost even rekenwerk: niet doen terwijl iemand aan het tikken of typen is */
let PDF_TIK=0;if(typeof document!=="undefined")["pointerdown","keydown"].forEach(t=>document.addEventListener(t,()=>{PDF_TIK=Date.now()},{passive:true,capture:true}));
const pdfRustig=()=>Date.now()-PDF_TIK>5000;
async function pdfSync(){
  if(!LIVE||pdfBezig||!state.loaded||isMw()||!state.assets||typeof pdfDoc!=="function")return;
  const grens=iso(addDays(today(),-550));
  pdfBezig=true;
  /* in kleine stukjes, zodat de app tussendoor blijft reageren */
  const kand=state.facturen.filter(f=>(f.soort!=="offerte"||f.getekend||f.status==="geaccepteerd")&&f.status!=="concept"&&f.nummer&&String(f.datum||"")>=grens&&!pdfMislukt.has(f.id)),todo=[];
  try{let t0=performance.now();for(const f of kand){if(f.pdfSig!==pdfSig(f))todo.push(f);if(performance.now()-t0>12){await new Promise(r=>setTimeout(r,30));t0=performance.now()}}}catch(e){pdfBezig=false;return}
  if(!todo.length){pdfBezig=false;return}
  try{for(const f0 of todo.slice(0,6)){while(!pdfRustig())await new Promise(r=>setTimeout(r,1500));const f=state.facturen.find(x=>x.id===f0.id);if(!f)continue;const sig=pdfSig(f);if(!sig||f.pdfSig===sig)continue;
      try{const doc=await pdfDoc(f);if(!doc)throw new Error("pdf");const blob=new Blob([doc.output("arraybuffer")],{type:"application/pdf"});
        const r=await state.assets.upload(blob,{type:"application/pdf"});const cur=state.facturen.find(x=>x.id===f.id)||f;
        await save("facturen",f.id,{...strip(cur),pdfId:r.id,pdfSig:sig})}
      catch(e){console.warn("factuur-pdf",f.nummer,e);pdfMislukt.add(f.id)}
      await new Promise(r=>setTimeout(r,300))}}
  finally{pdfBezig=false}
  if(todo.length>6)setTimeout(pdfSync,1500)}
if(LIVE)setInterval(()=>{try{pdfSync()}catch(e){}},20000),setTimeout(function w(){state.loaded?pdfSync():setTimeout(w,1500)},4000);
