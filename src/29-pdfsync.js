/* ---------- Factuur-PDF voor het klantportaal ----------
   De klant moet in zijn portaal precies de factuur zien die wij maken. Het CRM maakt daarom van elke
   definitieve factuur de echte PDF (dezelfde als bij Downloaden) en bewaart die. Verandert de factuur,
   de status of de huisstijl, dan wordt de PDF automatisch opnieuw gemaakt. */
const pdfHash=t=>{let h=5381;for(let i=0;i<t.length;i++)h=(h*33^t.charCodeAt(i))>>>0;return h.toString(36)+t.length.toString(36)};
function pdfSig(f){try{return pdfHash(JSON.stringify(invModel(f))+"|"+(S().logo||"")+"|"+(f.status||"")+"|opmaak2")}catch(e){return""}}
let pdfBezig=false,pdfMislukt=new Set();
async function pdfSync(){
  if(!LIVE||pdfBezig||!state.loaded||isMw()||!state.assets||typeof pdfDoc!=="function")return;
  const grens=iso(addDays(today(),-550));
  const todo=state.facturen.filter(f=>f.soort!=="offerte"&&f.status!=="concept"&&f.nummer&&String(f.datum||"")>=grens&&!pdfMislukt.has(f.id)&&f.pdfSig!==pdfSig(f));
  if(!todo.length)return;pdfBezig=true;
  try{for(const f0 of todo.slice(0,6)){const f=state.facturen.find(x=>x.id===f0.id);if(!f)continue;const sig=pdfSig(f);if(!sig||f.pdfSig===sig)continue;
      try{const doc=await pdfDoc(f);if(!doc)throw new Error("pdf");const blob=new Blob([doc.output("arraybuffer")],{type:"application/pdf"});
        const r=await state.assets.upload(blob,{type:"application/pdf"});const cur=state.facturen.find(x=>x.id===f.id)||f;
        await save("facturen",f.id,{...strip(cur),pdfId:r.id,pdfSig:sig})}
      catch(e){console.warn("factuur-pdf",f.nummer,e);pdfMislukt.add(f.id)}
      await new Promise(r=>setTimeout(r,300))}}
  finally{pdfBezig=false}
  if(todo.length>6)setTimeout(pdfSync,1500)}
if(LIVE)setInterval(()=>{try{pdfSync()}catch(e){}},20000),setTimeout(function w(){state.loaded?pdfSync():setTimeout(w,1500)},4000);
