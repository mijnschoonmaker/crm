/* ---------- Herinneringen, WIK-brief en Likifin: het CRM bepaalt wanneer ----------
   Per openstaande factuur rekent Mansard uit wat de volgende stap is en vanaf wanneer die mag:
   1. herinneringen volgens Instellingen › Factuurherinnering (dagen na de vervaldatum, met minimaal een paar dagen ertussen);
   2. de WIK-brief (14-dagenbrief) die wij zelf naar de klant sturen;
   3. 15 dagen na de WIK-brief (14 dagen termijn + 1 dag ontvangst) is de factuur klaar om over te dragen aan Likifin.
   Eerder versturen kan niet: de knoppen staan pas aan als de stap aan de beurt is. */
const FH_LIKIFIN_DAGEN=15;
function fhVolgende(f){
  if(!f||f.soort==="offerte"||f.status!=="open"||!f.verval||!f.verstuurdOp)return null;
  const st=S(),k=state.klanten.find(x=>x.id===f.klantId),vd=iso(today());
  if((st.fhIncasso&&k&&k.incasso)||(f.incasso&&!f.incassoMislukt))return null;
  if(f.likifinOp)return{soort:"bijlikifin",lbl:"Bij Likifin",datum:f.likifinOp,klaar:false};
  if(f.wikOp){const d=iso(addDays(parse(f.wikOp),FH_LIKIFIN_DAGEN));return{soort:"likifin",lbl:"Overdragen aan Likifin",datum:d,klaar:vd>=d}}
  const M=fhMomenten(),n=Number(f.herinneringen)||0;let j=n;while(M[j]&&!M[j].aan)j++;const m=M[j];if(!m)return null;
  let d=addDays(parse(f.verval),Number(m.dagen)||0);
  if(f.herinnerdOp){const tus=Math.max(Number(st.fhSkip)||0,m.wik?7:3),d2=addDays(parse(f.herinnerdOp),tus);if(d2>d)d=d2}
  const di=iso(d);return{soort:m.wik?"wik":"herinnering",stap:m,j,lbl:m.naam||(m.wik?"WIK-brief":"Herinnering"),datum:di,klaar:vd>=di}}
/* mag deze stap nu? anders een melding met de datum */
function fhPoort(f,wik){const v=fhVolgende(f);
  if(!v){toast(f.status==="open"&&!f.verstuurdOp?"Verstuur eerst de factuur":"Voor deze factuur is geen herinnering nodig");return false}
  if(v.soort==="likifin"||v.soort==="bijlikifin"){toast(v.soort==="bijlikifin"?"Deze factuur ligt al bij Likifin":"De WIK-brief is al verstuurd. Vanaf "+fmtD(v.datum)+" draag je hem over aan Likifin");return false}
  if(wik&&v.soort!=="wik"){toast("Eerst de "+v.lbl.toLowerCase()+(v.klaar?"":" (vanaf "+fmtD(v.datum)+")")+", daarna pas de WIK-brief");return false}
  if(!wik&&v.soort==="wik"){if(v.klaar)return true;toast("De volgende stap is de WIK-brief, vanaf "+fmtD(v.datum));return false}
  if(!v.klaar){toast(v.lbl+" kan vanaf "+fmtD(v.datum));return false}
  return true}
/* regel in de factuurlijst */
function fhRegel(f){const v=fhVolgende(f);if(!v)return"";
  if(v.soort==="bijlikifin")return `<small class="fh-v fh-lk">Bij Likifin sinds ${esc(fbKort(v.datum))}</small>`;
  return v.klaar?`<small class="fh-v fh-klaar">${esc(v.soort==="likifin"?"Klaar voor Likifin":v.lbl+" klaar")}</small>`:`<small class="fh-v">Volgende: ${esc(v.soort==="likifin"?"Likifin":v.lbl.toLowerCase())} · ${esc(fbKort(v.datum))}</small>`}
function fhKlaar(){const o={herinnering:[],wik:[],likifin:[]};facturen().forEach(f=>{const v=fhVolgende(f);if(v&&v.klaar&&o[v.soort])o[v.soort].push(f)});return o}
/* strook boven de lijst: wat er vandaag klaarstaat */
function fhStrook(){const K=fhKlaar(),n=K.herinnering.length+K.wik.length+K.likifin.length;if(!n)return"";
  const knop=(act,l,c)=>c?`<button type="button" class="${act==="fhlik"?"":"primary"} small" data-act="${act}">${l} (${c})</button>`:"";
  return `<div class="banner fh-strook"><div><b>Klaar om te versturen</b><br><small>${[K.herinnering.length?plural(K.herinnering.length,"herinnering","herinneringen"):"",K.wik.length?plural(K.wik.length,"WIK-brief","WIK-brieven"):"",K.likifin.length?plural(K.likifin.length,"factuur","facturen")+" klaar voor Likifin":""].filter(Boolean).join(" · ")}. Mansard houdt bij wanneer wat aan de beurt is.</small></div>
    <div class="fh-k">${knop("fhher","Herinneringen",K.herinnering.length)}${knop("fhwik","WIK-brieven",K.wik.length)}${knop("fhlik","Likifin",K.likifin.length)}</div></div>`}
/* naar Likifin: na de WIK-brief zonder betaling */
async function fhLikifin(list){const ok=list.filter(f=>{const v=fhVolgende(f);return v&&v.soort==="likifin"&&v.klaar});
  if(!ok.length){toast("Nog geen facturen klaar voor Likifin");return}
  const som=ok.reduce((a,f)=>a+totals(f).inc,0);
  if(!(await vraag("Overdragen aan Likifin",`${plural(ok.length,"factuur","facturen")} (${eur(som)}) ${ok.length===1?"is":"zijn"} 15 dagen na de WIK-brief nog niet betaald:<br>${ok.slice(0,8).map(f=>"• "+esc(f.nummer)+" · "+esc(cleanName(f.klantNaam))+" · "+eur(totals(f).inc)).join("<br>")}${ok.length>8?"<br>…":""}<br><br>Geef ze door aan Likifin. Zet ze daarna hier op overgedragen; herinneringen stoppen dan.`,"Overgedragen","Annuleren")))return;
  for(const f of ok)await save("facturen",f.id,{...strip(f),likifinOp:iso(today())});
  toast(plural(ok.length,"factuur","facturen")+" overgedragen aan Likifin")}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-act='fhher'],[data-act='fhwik'],[data-act='fhlik']");if(!b)return;e.preventDefault();e.stopPropagation();
  const K=fhKlaar(),a=b.dataset.act;if(a==="fhher")fbHerinner(K.herinnering,false);else if(a==="fhwik")fbHerinner(K.wik,true);else fhLikifin(K.likifin)},true);
document.head.insertAdjacentHTML("beforeend",`<style id="fhStijl">
.fh-v{display:block;margin-top:3px;font-size:11.5px;color:var(--muted,#646b7a)}
.fh-v.fh-klaar{color:#9a5b12;font-weight:700}.fh-v.fh-klaar::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#d08a1e;margin-right:6px;vertical-align:1px}
.fh-v.fh-lk{color:#252c3c;font-weight:600}
.fh-strook{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.fh-strook>div:first-child{flex:1;min-width:220px}.fh-k{display:flex;gap:8px;flex-wrap:wrap}
.fb-q[disabled]{opacity:.35;cursor:not-allowed}
</style>`);
