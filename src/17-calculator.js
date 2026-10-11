/* ---------- CALCULATOR ---------- */
const DEFPRIJS=[{id:"d1",naam:"Glasbewassing buiten",perRaam:1.25,perM2:0,start:10,minimum:20},{id:"d2",naam:"Binnen en buiten",perRaam:2.25,perM2:0,start:12,minimum:32},
  {id:"d3",naam:"Begane grond glas",perRaam:1,perM2:0,start:8,minimum:18},{id:"d4",naam:"Dakgoot reinigen",perRaam:0,perM2:0,start:45,minimum:45},
  {id:"d5",naam:"Zonnepanelen reinigen",perRaam:3.5,perM2:0,start:25,minimum:60},{id:"d6",naam:"Schoonmaak",perRaam:0,perM2:1.8,start:0,minimum:40}];
const prijslijst=()=>state.prijzen.diensten&&state.prijzen.diensten.length?state.prijzen.diensten:DEFPRIJS;
if(!state.calc)state.calc={ramen:20,stuks:0,m2:0,freq:4,sel:{d1:true}};
function calcPrice(d,c){const n=["Zonnepanelen reinigen"].includes(d.naam)?c.stuks:c.ramen;return r2(Math.max(Number(d.minimum)||0,(Number(d.start)||0)+n*(Number(d.perRaam)||0)+c.m2*(Number(d.perM2)||0)))}
function vCalculator(){
  const P=prijslijst(),c=state.calc,chosen=P.filter(d=>c.sel[d.id]),tot=chosen.reduce((a,d)=>a+calcPrice(d,c),0),perJaar=c.freq?tot*365/(c.freq*7):tot;
  let html=`<div class="pagehead"><div><p class="kicker">${I.calculator}Calculator</p><h1 class="xl">Prijs berekenen</h1><p class="lead" style="margin:0">Reken een prijs uit op aantal ramen of m² en maak er direct een offerte van</p></div>
    <div class="acts"><button type="button" class="primary" data-act="prijzen">${I.instellingen}Prijzen &amp; diensten</button></div></div>
  <div class="calcgrid"><div class="panel"><h3>Het pand</h3><div class="grid2">
      <label>Aantal ramen<input type="number" min="0" id="cc-ramen" value="${c.ramen}" inputmode="numeric"></label>
      <label>Zonnepanelen (stuks)<input type="number" min="0" id="cc-stuks" value="${c.stuks}" inputmode="numeric"></label>
      <label>m² schoonmaak<input type="number" min="0" id="cc-m2" value="${c.m2}" inputmode="numeric"></label>
      <label>Frequentie<select id="cc-freq"><option value="0" ${!c.freq?"selected":""}>Eenmalig</option>${[2,4,6,8,12,26].map(w=>`<option value="${w}" ${c.freq===w?"selected":""}>Elke ${w} weken</option>`).join("")}</select></label></div>
    <h3 style="margin-top:20px">Diensten</h3><div class="list" style="gap:6px">${P.map(d=>`<label class="check-row"><input type="checkbox" data-csel="${esc(d.id)}" ${c.sel[d.id]?"checked":""}><span style="flex:1"><b>${esc(d.naam)}</b><br><small class="subt">${[d.start?"start "+eur(d.start):"",d.perRaam?eur(d.perRaam)+" per "+(d.naam.includes("Zonnepanelen")?"paneel":"raam"):"",d.perM2?eur(d.perM2)+" per m²":"",d.minimum?"minimaal "+eur(d.minimum):""].filter(Boolean).join(" · ")}</small></span><b class="amt">${eur(calcPrice(d,c))}</b></label>`).join("")}</div></div>
    <div class="panel calcres"><span class="eyebrow">Prijs per beurt · ${S().incl?"incl.":"excl."} btw</span><b class="oc-big">${eur(tot)}</b>
      <span class="oc-sub">${c.freq?`≈ <b>${eur0(perJaar)}</b> per jaar bij elke ${c.freq} weken`:"Eenmalige klus"}</span>
      <div class="list" style="gap:4px;margin:16px 0">${chosen.map(d=>`<div style="display:flex;justify-content:space-between;gap:8px"><span>${esc(d.naam)}</span><span class="amt">${eur(calcPrice(d,c))}</span></div>`).join("")||'<span class="subt">Kies een of meer diensten</span>'}</div>
      <label>Voor klant<select id="cc-klant"><option value="">Nieuwe klant…</option>${[...state.klanten].sort((a,b)=>cleanName(a.naam).localeCompare(cleanName(b.naam))).map(k=>`<option value="${esc(k.id)}">${esc(cleanName(k.naam))}</option>`).join("")}</select></label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="primary" data-act="calcoff" ${chosen.length?"":"disabled"}>${I.offertes}Maak offerte</button><button type="button" data-act="calcset" ${chosen.length?"":"disabled"}>Prijs opslaan bij klant</button></div></div></div>
  <div class="notice" style="background:var(--surface-2);color:var(--muted);margin-top:18px">Een calculator op je eigen website, waarmee bezoekers zelf een prijs uitrekenen en een aanvraag sturen, kan mijnschoonmaker niet hosten. Deze calculator is voor jezelf, aan de deur of aan de telefoon.</div>`;
  return html;
}
async function calcToKlant(mode){
  const P=prijslijst(),c=state.calc,chosen=P.filter(d=>c.sel[d.id]),kid=$("#cc-klant").value;
  const regels=chosen.map(d=>({omschrijving:d.naam+(c.ramen&&d.perRaam&&!d.naam.includes("Zonnepanelen")?" ("+c.ramen+" ramen)":"")+(c.freq?", per beurt elke "+c.freq+" weken":""),aantal:1,prijs:calcPrice(d,c)}));
  let k=state.klanten.find(x=>x.id===kid);
  if(!k){openKlant(null);toast("Maak eerst de klant aan en kies hem daarna in de calculator");return}
  if(mode==="off"){openFactuurForm({soort:"offerte",klantId:k.id,regels});state.calc={ramen:20,stuks:0,m2:0,freq:4,sel:{d1:true}}}
  else{const prijs=regels.reduce((a,r)=>a+r.prijs,0);try{await save("klanten",k.id,{...strip(k),prijs,dienst:chosen.map(d=>d.naam).join(" + "),frequentie:c.freq||k.frequentie||4});state.calc={ramen:20,stuks:0,m2:0,freq:4,sel:{d1:true}};render();toast("Prijs "+eur(prijs)+" opgeslagen bij "+cleanName(k.naam)+" · calculator leeggemaakt")}catch(e){err(e)}}
}
function openPrijzen(){
  const P=prijslijst().map(d=>({...d}));
  const draw=()=>{$("#prl").innerHTML=P.map((d,i)=>`<div class="prow"><input data-p="${i}" data-k="naam" value="${esc(d.naam)}" aria-label="Naam dienst"><input data-p="${i}" data-k="start" type="number" step="0.5" value="${esc(d.start)}" aria-label="Starttarief"><input data-p="${i}" data-k="perRaam" type="number" step="0.05" value="${esc(d.perRaam)}" aria-label="Per raam of stuk"><input data-p="${i}" data-k="perM2" type="number" step="0.05" value="${esc(d.perM2)}" aria-label="Per m²"><input data-p="${i}" data-k="minimum" type="number" step="0.5" value="${esc(d.minimum)}" aria-label="Minimum"><button type="button" class="small ghost" data-prm="${i}" aria-label="Verwijder">${I.x}</button></div>`).join("")};
  openDlg(`<div class="dlg-head"><span class="objic big">${I.instellingen}</span><div style="flex:1"><h3>Prijzen &amp; diensten</h3><div class="subt">Prijs = start + aantal × per raam/stuk + m² × per m², minimaal het minimum</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="prow head"><span>Dienst</span><span>Start €</span><span>Per raam/stuk €</span><span>Per m² €</span><span>Minimum €</span><span></span></div><div id="prl" class="lines"></div>
  <button type="button" class="small" id="prAdd" style="align-self:flex-start">${I.plus}Dienst</button>
  <div class="row"><span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="submit" class="primary" id="prSave">Opslaan</button></div>`,{wide:true});
  draw();
  $("#prl").oninput=e=>{const i=e.target.dataset.p;if(i==null)return;P[i][e.target.dataset.k]=e.target.dataset.k==="naam"?e.target.value:Number(e.target.value)||0};
  $("#prl").onclick=e=>{const b=e.target.closest("[data-prm]");if(b){P.splice(Number(b.dataset.prm),1);draw()}};
  $("#prAdd").onclick=()=>{P.push({id:newId("d"),naam:"",perRaam:0,perM2:0,start:0,minimum:0});draw()};
  form.onsubmit=async e=>{e.preventDefault();$("#prSave").disabled=true;try{await save("instellingen","prijzen",{diensten:P.filter(d=>d.naam.trim())});dlg.close();toast("Prijzen opgeslagen")}catch(er){$("#prSave").disabled=false;err(er)}};
}
