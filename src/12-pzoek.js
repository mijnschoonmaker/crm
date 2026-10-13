/* ---------- Zoeken in Planning: resultaten onder het zoekveld ----------
   Typ een naam of adres: je ziet direct de klant, wanneer hij gepland staat of dat hij nog ingepland moet worden.
   Klik = naar die dag in de planning, of op de kaart / bij Te plannen tonen. */
state.pqOpen=state.pqOpen||false;
function pqLijst(){const q=String(state.pq||"").trim().toLowerCase();if(q.length<2)return[];
  const woorden=q.split(/\s+/);
  return actief().map(k=>{const t=[cleanName(k.naam),k.adres,k.plaats,k.postcode,jobAddr(k)].join(" ").toLowerCase();if(!woorden.every(w=>t.includes(w)))return null;
    const a=String(jobAddrObj(k).adres||"").toLowerCase(),n=cleanName(k.naam).toLowerCase();return{k,sc:(a.startsWith(q)||n.startsWith(q)?0:1)}}).filter(Boolean)
    .sort((a,b)=>a.sc-b.sc||cleanName(a.k.naam).localeCompare(cleanName(b.k.naam))).slice(0,7).map(x=>x.k)}
function pqResHtml(offerAll){if(!state.pqOpen)return"";const q=String(state.pq||"").trim();if(q.length<2)return"";
  const L=pqLijst(),t=iso(today()),te=new Set((offerAll||[]).map(k=>k.id));
  const rij=(k,i)=>{const a=jobAddrObj(k),gp=k.gepland&&k.gepland>=t?k.gepland:"";
    const st=gp?`<em class="pq-st pl">${I.planning}${esc(gp===t?"Vandaag":fmtD(gp))}${k.tijd?" · "+esc(k.tijd):""}</em>`:te.has(k.id)?`<em class="pq-st of">Te plannen · ${esc((dueTxt(k)||{}).txt||"")}</em>`:`<em class="pq-st">Volgende ${esc(fmtD(planned(k)))}</em>`;
    return `<li role="option" class="pq-r${i===0?" eerste":""}" data-pq="${esc(k.id)}"><span class="pq-av" style="--h:${hue(k.ronde||k.naam)}">${esc(initials(k.naam))}</span><span class="pq-tx"><b>${esc(a.adres||cleanName(k.naam))}</b><small>${esc(cleanName(k.naam))}${a.plaats?" · "+esc(a.plaats):""}</small></span>${st}<button type="button" class="pq-open" data-pqk="${esc(k.id)}" title="Klant openen" aria-label="Klant openen">${I.user}</button></li>`};
  return `<ul class="pq-res" id="pqRes" role="listbox">${L.length?L.map(rij).join(""):`<li class="pq-leeg">Geen klant gevonden voor “${esc(q)}”</li>`}</ul>`}
function pqKies(id){const k=state.klanten.find(x=>x.id===id);if(!k)return;const t=iso(today());state.pqOpen=false;state.pqDicht=Date.now();try{document.activeElement&&document.activeElement.blur()}catch(e){}
  const gp=k.gepland&&k.gepland>=t?k.gepland:"";
  if(gp){state.planDay=gp;if(state.pview==="maand")state.pview="dag";if(state.pview==="week"||state.pview==="multi"){state.week=startOfWeek(parse(gp));state.multiDays=null}
    render();setTimeout(()=>pqFlits(`.job[data-drag="${id}"],.job[data-id="${id}"]`),80);return}
  render();
  setTimeout(()=>{
    if(state.pkaart&&PK.map&&PK.mk&&PK.mk[id]){const m=PK.mk[id];PK.zelf=true;PK.map.flyTo(m.getLatLng(),Math.max(PK.map.getZoom(),15),{duration:.7});setTimeout(()=>{m.openTooltip();const el=m.getElement();if(el){el.classList.add("pk-hl");setTimeout(()=>el.classList.remove("pk-hl"),2600)}},750)}
    if(!pqFlits(`.offercol [data-drag="${id}"]`)&&!(state.pkaart&&PK.mk&&PK.mk[id]))openKlantView(id)},80)}
function pqFlits(sel){const el=document.querySelector(sel);if(!el)return false;el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.remove("pq-flits");void el.offsetWidth;el.classList.add("pq-flits");setTimeout(()=>el.classList.remove("pq-flits"),2200);return true}
document.addEventListener("input",e=>{if(e.target.id==="pq")state.pqOpen=true},true);
document.addEventListener("focusin",e=>{if(e.target.id==="pq"&&Date.now()-(state.pqDicht||0)>1500&&String(state.pq||"").trim().length>=2&&!state.pqOpen){state.pqOpen=true;render();const i=document.getElementById("pq");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}});
document.addEventListener("keydown",e=>{if(e.target.id!=="pq")return;
  if(e.key==="Enter"){e.preventDefault();const f=document.querySelector(".pq-res .pq-r");if(f)pqKies(f.dataset.pq)}
  else if(e.key==="Escape"&&state.pqOpen){e.preventDefault();state.pqOpen=false;render()}
  else if(e.key==="ArrowDown"){const f=document.querySelector(".pq-res .pq-r");if(f){e.preventDefault();f.tabIndex=0;f.focus()}}});
document.addEventListener("keydown",e=>{const r=e.target.closest&&e.target.closest(".pq-r");if(!r)return;
  if(e.key==="Enter"){e.preventDefault();pqKies(r.dataset.pq)}else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();const n=e.key==="ArrowDown"?r.nextElementSibling:r.previousElementSibling;if(n&&n.classList.contains("pq-r")){n.tabIndex=0;n.focus()}else if(e.key==="ArrowUp")document.getElementById("pq").focus()}});
document.addEventListener("click",e=>{const o=e.target.closest&&e.target.closest("[data-pqk]");if(o){e.preventDefault();e.stopPropagation();state.pqOpen=false;openKlantView(o.dataset.pqk);return}
  const r=e.target.closest&&e.target.closest("[data-pq]");if(r){e.preventDefault();pqKies(r.dataset.pq);return}
  if(state.pqOpen&&!(e.target.closest&&e.target.closest(".pl-q"))){state.pqOpen=false;const u=document.getElementById("pqRes");if(u)u.remove()}},true);
