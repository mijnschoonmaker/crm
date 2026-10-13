/* ---------- Bijlagen van verzonden berichten openen ----------
   Nieuwe mails bewaren hun PDF's, die openen direct. Bij oudere berichten maken we de PDF opnieuw:
   facturen en offertes hier in het CRM, bestellingsoverzichten via de server. */
function bijlLijst(m){if(!m)return[];if(Array.isArray(m.bijlagen)&&m.bijlagen.length)return m.bijlagen;
  return String(m.bijlage||"").split(/,\s*/).filter(Boolean).map(naam=>({naam,id:""}))}
function bijlVenster(){let w=null;try{w=window.open("","_blank")}catch(e){}
  if(w){try{w.document.title="PDF laden…";w.document.body.style.cssText="margin:0;display:grid;place-items:center;height:100vh;font:15px -apple-system,system-ui,sans-serif;color:#667";w.document.body.textContent="PDF wordt geladen…"}catch(e){}}
  return w}
function bijlToon(w,url,naam){if(w&&!w.closed){w.location.href=url;return}
  const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener";if(/^blob:/.test(url))a.download=naam||"bijlage.pdf";document.body.appendChild(a);a.click();a.remove()}
async function bijlOpen(mid,i){
  const m=state.berichten.find(x=>x.id===mid),a=bijlLijst(m)[i];if(!a)return;
  if(a.id)return bijlToon(null,BLOB+a.id,a.naam);
  const s=S(),naam=a.naam;
  if(s.voorwaardenPdf&&(naam===(s.voorwaardenNaam||"Algemene voorwaarden.pdf")||/voorwaarden/i.test(naam)))return bijlToon(null,BLOB+s.voorwaardenPdf,naam);
  if(s.herroepingPdf&&/herroeping/i.test(naam))return bijlToon(null,BLOB+s.herroepingPdf,naam);
  const w=bijlVenster();
  try{
    /* factuur of offerte: opnieuw maken uit het CRM */
    const fm=naam.match(/^(Factuur|Offerte)\s+(.+)\.pdf$/i),refId=/^(factuur|aanmaning|offerte):/.test(String(m.ref||""))?String(m.ref).split(":")[1]:"";
    const f=(refId&&state.facturen.find(x=>x.id===refId))||(fm&&state.facturen.find(x=>x.nummer===fm[2]));
    if(f){const doc=await pdfDoc(f);if(!doc)throw new Error("De PDF kon niet worden gemaakt");
      const url=URL.createObjectURL(new Blob([doc.output("arraybuffer")],{type:"application/pdf"}));bijlToon(w,url,naam);setTimeout(()=>URL.revokeObjectURL(url),120000);return}
    /* bestellingsoverzicht: de server maakt hem opnieuw en bewaart hem */
    if(/_[vd]\.pdf$/i.test(naam)&&m.overzichtNr){
      if(!LIVE)throw new Error("Dit werkt alleen in de live versie");
      const k=state.klanten.find(x=>x.id===m.klantId);
      const r=await fbFn("berichtPdf")({id:m.id,model:k&&typeof overzichtModelKlant==="function"?overzichtModelKlant(k):null});
      return bijlToon(w,BLOB+r.data.id,naam)}
    throw new Error("Deze bijlage is niet bewaard")}
  catch(e){try{w&&w.close()}catch(er){}toast((typeof fnFout==="function"?fnFout(e):e.message||e)+"")}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-bij]");if(!b)return;e.preventDefault();e.stopPropagation();bijlOpen(b.dataset.bij,+b.dataset.n)},true);
