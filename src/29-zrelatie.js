/* ---------- relatiecodes (klantnummers) voor SnelStart ----------
   Elke klant krijgt bij het opslaan meteen een vast klantnummer. Nieuwe nummers beginnen nooit lager dan
   "Eerstvolgend klantnummer" (Boekhouder › Instellingen), zodat ze niet botsen met relaties die al in SnelStart
   staan, bijvoorbeeld uit DienstenCRM. Een nummer dat al bij een andere klant hoort, kan niet nog eens. */
const relStart=()=>Math.max(1001,parseInt(S().bhKlantStart,10)||0);
const relMax=(zonder)=>state.klanten.filter(k=>k.id!==zonder&&!k.hoofdKlantId).reduce((m,k)=>{const n=parseInt(k.klantnr,10);return /^\d+$/.test(String(k.klantnr||""))&&n>m?n:m},0);
const relVolgende=zonder=>String(Math.max(relStart(),relMax(zonder)+1));
const relBezet=(nr,id)=>!!nr&&state.klanten.find(k=>k.id!==id&&!k.hoofdKlantId&&String(k.klantnr||"")===String(nr));
{const _save=save;save=async function(col,id,data){
  if(col==="klanten"&&data&&!data.hoofdKlantId&&!String(data.klantnr||"").trim()){const oud=state.klanten.find(k=>k.id===id);data={...data,klantnr:(oud&&oud.klantnr)||relVolgende(id)}}
  return _save.apply(this,[col,id,data,...[].slice.call(arguments,3)])}}
