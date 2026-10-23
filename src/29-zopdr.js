/* ---------- Opdrachten: vaste nummers en "apart inplannen" ----------
   - Elke extra opdracht krijgt bij het opslaan een vast nummer (2, 3, ...). Verwijder je er een, dan houden de andere hun nummer;
     een nummer wordt nooit opnieuw gebruikt (opdrNrMax op de klant).
   - Standaard gaat een extra opdracht mee met de glasbewassing (zelfde bezoek, zelfde factuur).
   - Met "Apart inplannen" wordt het een eigen afspraak: Mansard maakt er een losse job van (een klantregel met hoofdKlantId),
     die in Te plannen verschijnt met eigen datum, tijd, duur en factuur. In het klantenbestand en de statistieken telt die
     job niet als extra klant; in het klantportaal ziet de klant de bezoeken en facturen ervan gewoon terug. */
function opdrNummers(k){const m={},l=(k&&k.opdrachten)||[];let max=Math.max(1,Number(k&&k.opdrNrMax)||1);
  l.forEach(o=>{if(Number(o.nr)>1){m[o.id]=Number(o.nr);max=Math.max(max,Number(o.nr))}});l.forEach(o=>{if(!m[o.id])m[o.id]=++max});return m}
const opdrNr=(k,id)=>opdrNummers(k)[id]||null;
const opdrVolgNr=k=>{const m=opdrNummers(k);return Math.max(1,Number(k&&k.opdrNrMax)||1,...Object.values(m))+1};
const opdrJob=(k,oid)=>state.klanten.find(x=>x.hoofdKlantId===k.id&&x.opdrachtId===oid);
const isJob=k=>!!(k&&k.hoofdKlantId);
function opdrStempel(d){const m=opdrNummers(d),ops=(d.opdrachten||[]).map(o=>({...o,nr:m[o.id]}));return{...d,opdrachten:ops,opdrNrMax:Math.max(Number(d.opdrNrMax)||1,...ops.map(o=>o.nr||1))}}
/* losse jobs bijwerken na het opslaan van de klant */
const OPDR_VELDEN=["naam","contact","adres","postcode","plaats","email","fEmail","pEmail","oEmail","telefoon","mobiel","soort","klantnr","lat","lng","geo","ronde","termijn","btwVerlegd","incasso","akkoord"];
async function opdrJobsSync(kid,d){const nu=iso(today());
  for(const o of d.opdrachten||[]){const job=opdrJob({id:kid},o.id),aan=o.apart&&o.actief!==false;
    if(aan){const basis={};OPDR_VELDEN.forEach(f=>{if(d[f]!==undefined)basis[f]=d[f]});
      /* eigen adres (locatie van de klant): dat adres, en opnieuw op de kaart zetten */
      const loc=o.objectId&&(d.objecten||[]).find(x=>x.id===o.objectId&&x.adres);if(loc)Object.assign(basis,{adres:loc.adres,postcode:loc.postcode||"",plaats:loc.plaats||"",lat:null,lng:null,geo:null});
      const v={...basis,dienst:o.dienst||"Extra opdracht",prijs:Number(o.prijs)||0,duur:Number(o.duur)||30,frequentie:Number(o.frequentie)||52,hoofdKlantId:kid,opdrachtId:o.id,opdrachtNr:o.nr||null,actief:true,prospect:false};
      if(!job){await save("klanten",newId("k"),{...v,autoplan:true,gepland:"",tijd:"",aanbieden:true,aanbodVanaf:o.volgende||"",aangemaakt:nu,log:[{datum:nu,tekst:"Losse opdracht aangemaakt vanuit de klant"}],objecten:[],opdrachten:[],eersteKeer:false})}
      else if(["dienst","prijs","duur","frequentie","naam","adres","postcode","plaats","email","actief","opdrachtNr"].some(f=>String(job[f]??"")!==String(v[f]??"")))await save("klanten",job.id,{...strip(job),...v})}
    else if(job&&job.actief!==false)await save("klanten",job.id,{...strip(job),actief:false,gepland:"",tijd:"",log:[...(job.log||[]),{datum:nu,tekst:"Losse opdracht gestopt (niet meer apart ingepland)"}]})}
  /* opdracht verwijderd: losse job stoppen */
  for(const job of state.klanten.filter(x=>x.hoofdKlantId===kid&&x.actief!==false))if(!(d.opdrachten||[]).some(o=>o.id===job.opdrachtId))await save("klanten",job.id,{...strip(job),actief:false,gepland:"",tijd:""})}
/* alle opslagen van klanten lopen hierlangs: nummers vastleggen en losse jobs bijwerken */
{const _save=save;save=async function(col,id,data){
  const hoofd=col==="klanten"&&data&&Array.isArray(data.opdrachten)&&!data.hoofdKlantId;if(hoofd)data=opdrStempel(data);
  const r=await _save(col,id,data);if(hoofd&&!opdrJobsSync._bezig){opdrJobsSync._bezig=true;try{await opdrJobsSync(id,data)}catch(e){console.error("losse opdrachten",e)}finally{opdrJobsSync._bezig=false}}return r}}
/* klantkaart van een losse job: waar hoort hij bij */
function opdrJobBanner(k){if(!isJob(k))return"";const h=state.klanten.find(x=>x.id===k.hoofdKlantId);
  return `<div class="banner" style="margin-bottom:12px"><div><b>Losse opdracht${h&&k.opdrachtNr?" "+esc(klantNr(h))+"-"+esc(k.opdrachtNr):""}</b><br><small>Hoort bij ${h?esc(cleanName(h.naam)):"een andere klant"}. Wordt apart ingepland, met een eigen afspraak en factuur. Prijs, frequentie en duur pas je aan bij de opdracht van de klant.</small></div>${h?`<button type="button" data-act="klant" data-id="${esc(h.id)}">${I.right||""}Naar de klant</button>`:""}</div>`}
