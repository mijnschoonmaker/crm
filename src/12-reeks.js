/* ---------- Meervoudig inplannen: afspraakreeksen ----------
   k.reeks = [{d:"2026-11-09",t:"09:30"},…]  = de afspraken NA k.gepland.
   Na afronden schuift de eerste uit de reeks door naar k.gepland. */
const RK_IC={n:sv('<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),tot:sv('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15.5 2 2 4-4"/>')};
function reeksNa(k){const t=iso(today()),r=(k.reeks||[]).filter(x=>x&&x.d&&x.d>t);if(!r.length)return null;return{gepland:r[0].d,tijd:r[0].t||k.tijd||"",reeks:r.slice(1)}}
/* datums na de eerste afspraak; altijd gerekend vanaf de startdatum, dus geen verloop door verschuivingen */
function reeksDatums(start,weken,mode,n,tot){
  const s=parse(start),out=[],stap=Math.max(1,Number(weken)||4)*7,eind=mode==="tot"&&tot?parse(tot):null;
  for(let i=1;i<60;i++){if(mode==="vast"&&i>=n)break;
    const basis=addDays(s,i*stap);if(eind&&basis>eind)break;
    const d=werkdagAanpassen(basis);out.push({d:iso(d),schuif:iso(d)!==iso(basis),basis:iso(basis)});
    if(mode==="door"&&i>=3)break}
  return out}
const rkDag=d=>{const x=parse(d);return wd(x)+" "+x.getDate()+" "+["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][x.getMonth()]+(x.getFullYear()!==today().getFullYear()?" '"+String(x.getFullYear()).slice(2):"")};

function openReeks(k,date,tijd,bestaand){return new Promise(res=>{
  const st={mode:bestaand?"vast":"vast",n:Math.min(10,Math.max(2,Number(k.reeksN)||4)),weken:Number(k.frequentie)||4,tot:iso(addDays(parse(date),182))};
  const o=document.createElement("div");o.className="vraag-ov rk-ov";
  const modes=[...(bestaand?[]:[["een","Eén afspraak","Alleen deze keer",I.cal2]]),["vast","Vast aantal","2 tot 10 afspraken",RK_IC.n],["tot","Tot een datum","Herhalen tot en met",RK_IC.tot],["door","Doorlopend","Na elke beurt de volgende",I.refresh]];
  const teken=()=>{
    const lijst=st.mode==="een"?[]:reeksDatums(date,st.weken,st.mode,st.n,st.tot),tot=1+lijst.length;
    const rij=(d,i,schuif)=>`<li${i===0?' class="eerste"':""}><span class="rk-i">${i+1}</span><b>${esc(rkDag(d))}</b><span class="rk-t">${esc(tijd||"geen tijd")}</span>${schuif?`<span class="rk-sch" title="Valt op een vrije dag, verschoven naar een werkdag">verschoven</span>`:""}${i===0?`<span class="rk-1">eerste</span>`:""}</li>`;
    o.innerHTML=`<div class="rk" role="dialog" aria-modal="true" aria-label="Meervoudig inplannen">
      <div class="rk-h"><span class="objic">${I.refresh}</span><div><b>Hoe wil je dit inplannen?</b><small>${esc(jobAddrObj(k).adres||cleanName(k.naam))} · ${esc(rkDag(date))}${tijd?" om "+esc(tijd):""}</small></div><button type="button" class="iconbtn sm" data-rk="x" aria-label="Sluiten">${I.x}</button></div>
      <div class="rk-modes">${modes.map(([v,l,s,ic])=>`<button type="button" class="rk-m${st.mode===v?" on":""}" data-rkm="${v}" aria-pressed="${st.mode===v}">${ic}<b>${l}</b><small>${s}</small></button>`).join("")}</div>
      ${st.mode==="een"?`<p class="rk-uit">De klant krijgt één afspraak. Na de beurt verschijnt hij weer bij Te plannen.</p>`:`
      <div class="rk-opt">
        ${st.mode==="vast"?`<span class="rk-l">Aantal afspraken</span><div class="rk-n">${[2,3,4,5,6,7,8,9,10].map(n=>`<button type="button" data-rkn="${n}" class="${st.n===n?"on":""}" aria-pressed="${st.n===n}">${n}</button>`).join("")}</div>`:""}
        ${st.mode==="tot"?`<label class="rk-l">Tot en met<input type="date" id="rkTot" value="${esc(st.tot)}" min="${esc(iso(addDays(parse(date),7)))}"></label>`:""}
        <label class="rk-l rk-w">Om de<select id="rkW">${[1,2,3,4,5,6,8,10,12,13,16,26].map(w=>`<option value="${w}"${st.weken===w?" selected":""}>${w===1?"week":w+" weken"}</option>`).join("")}</select>${st.weken!==(Number(k.frequentie)||4)?`<small>klant staat op ${esc(freqLabel(Number(k.frequentie)||4)).toLowerCase()}</small>`:`<small>frequentie van de klant</small>`}</label>
      </div>
      <ol class="rk-list">${rij(date,0,false)}${lijst.map((x,i)=>rij(x.d,i+1,x.schuif)).join("")}${st.mode==="door"?`<li class="rk-more"><span class="rk-i">…</span><span>en zo verder, steeds na afronden van de vorige beurt</span></li>`:""}</ol>
      ${st.mode==="tot"&&lijst.length>=59?`<p class="help">Maximaal 60 afspraken.</p>`:""}`}
      <div class="rk-f"><button type="button" data-rk="x">Annuleren</button><button type="button" class="primary" data-rk="ok">${I.check}${st.mode==="een"?"Inplannen":st.mode==="door"?"Doorlopend inplannen":plural(tot,"afspraak","afspraken")+" inplannen"}</button></div></div>`;
    const tt=o.querySelector("#rkTot");if(tt)tt.onchange=()=>{if(tt.value){st.tot=tt.value;teken()}};
    const w=o.querySelector("#rkW");if(w)w.onchange=()=>{st.weken=Number(w.value)||4;teken()};
  };
  const done=v=>{o.remove();document.removeEventListener("keydown",esc_,true);res(v)};
  const esc_=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();done(null)}};document.addEventListener("keydown",esc_,true);
  o.addEventListener("click",e=>{const b=e.target.closest("[data-rk],[data-rkm],[data-rkn]");if(!b){if(e.target===o)done(null);return}
    if(b.dataset.rkm){st.mode=b.dataset.rkm;teken();return}
    if(b.dataset.rkn){st.n=Number(b.dataset.rkn);teken();return}
    if(b.dataset.rk==="x")return done(null);
    if(b.dataset.rk==="ok"){const lijst=st.mode==="een"||st.mode==="door"?[]:reeksDatums(date,st.weken,st.mode,st.n,st.tot);done({mode:st.mode,n:st.n,weken:st.weken,tot:st.tot,lijst})}});
  teken();(dlg.open?dlg:document.body).appendChild(o);setTimeout(()=>{const b=o.querySelector('[data-rk="ok"]');if(b)b.focus()},30)})}

async function reeksOpslaan(k,date,tijd,r,bestaand){
  const cur=state.klanten.find(x=>x.id===k.id)||k,prev={gepland:cur.gepland||"",tijd:cur.tijd||"",reeks:cur.reeks||[],autoplan:!!cur.autoplan,aanbieden:!!cur.aanbieden,frequentie:cur.frequentie};
  let p={gepland:date,tijd:tijd||"",aanbieden:false},msg;
  if(r.mode==="een"){p.reeks=[];msg=cleanName(k.naam)+" ingepland op "+fmtD(date)+(tijd?" om "+tijd:"")}
  else if(r.mode==="door"){p.reeks=[];p.autoplan=true;if(r.weken!==(Number(cur.frequentie)||4))p.frequentie=r.weken;msg=cleanName(k.naam)+" doorlopend ingepland, elke "+(r.weken===1?"week":r.weken+" weken")}
  else{p.reeks=r.lijst.map(x=>({d:x.d,t:tijd||""}));p.autoplan=false;p.reeksN=r.mode==="vast"?r.n:cur.reeksN||"";
    const n=p.reeks.length+1;msg=plural(n,"afspraak","afspraken")+" ingepland voor "+cleanName(k.naam)+" · t/m "+fmtD(n>1?p.reeks[n-2].d:date)}
  if(r.mode!=="een")p.log=[...(cur.log||[]),{datum:iso(today()),tekst:r.mode==="door"?"Doorlopende afspraakreeks gestart vanaf "+fmtD(date):"Afspraakreeks: "+(p.reeks.length+1)+" afspraken vanaf "+fmtD(date)}];
  try{await save("klanten",cur.id,{...strip(cur),...p});toast(msg,()=>{const c2=state.klanten.find(x=>x.id===cur.id);return save("klanten",cur.id,{...strip(c2),...prev})})}catch(e){err(e)}
  if(bestaand&&dlg.open&&$("#jobPanel"))openJob(cur.id,date);
}

/* ---------- weergave in de agenda ---------- */
const rkBadge=x=>`<span class="rk-b" title="Afspraak ${x.r.i} van ${x.r.n} in een reeks">${I.refresh}${x.r.i}/${x.r.n}</span>`;
function tjobReeks(x,top,height,left,width){const k=x.k,a=jobAddrObj(k),cmp=height<58?" compact":"",dim=pqMatch(k)?"":" faded";
  return `<div class="tjob st-gepland rk-job${dim}${cmp}" data-act="reeksinfo" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}" style="--h:${hue(k.ronde||k.naam)};top:${top}px;height:${height}px;left:calc(${left}% + 3px);width:calc(${width}% - 6px)">
    <div class="tj-top"><button type="button" class="tj-nm" data-act="reeksinfo" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}">${esc(a.adres||cleanName(k.naam))}${a.plaats?", "+esc(a.plaats):""}</button></div>
    <div class="tj-bot">${dienstHtml(k)}<span class="amt">${eur0(toon(k.prijs))}</span>${rkBadge(x)}</div></div>`}
function reeksCard(x){const k=x.k;
  return `<div class="job rk-job${pqMatch(k)?"":" faded"}" style="--h:${hue(k.ronde||k.naam)}">
    <div class="jn">${k.tijd?`<span class="tm">${esc(k.tijd)}</span>`:""}<button type="button" data-act="reeksinfo" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}">${esc(jobAddrObj(k).adres||cleanName(k.naam))}</button></div>
    <div class="ja">${esc(cleanName(k.naam))}</div><div class="jf"><span class="amt">${eur0(toon(k.prijs))}</span>${rkBadge(x)}</div></div>`}

function reeksBlok(k){const r=k.reeks||[];
  if(r.length)return `<div class="rk-blok"><span class="rk-bi">${I.refresh}</span><div><b>Reeks · nog ${plural(r.length,"afspraak","afspraken")} na deze</b><small>Volgende: ${esc(rkDag(r[0].d))}${r[0].t?" om "+esc(r[0].t):""} · laatste ${esc(rkDag(r[r.length-1].d))}</small></div><button type="button" class="small" data-act="reeksinfo" data-id="${esc(k.id)}" data-d="${esc(k.gepland)}">Bekijken</button></div>`;
  return `<div class="rk-blok leeg"><span class="rk-bi">${I.refresh}</span><div><b>Eenmalige afspraak</b><small>Plan in één keer de volgende afspraken mee</small></div><button type="button" class="small" data-act="reeksnew" data-id="${esc(k.id)}">Herhalen…</button></div>`}

function openReeksInfo(id,dSel){
  const k=state.klanten.find(x=>x.id===id);if(!k)return;
  const items=[...(k.gepland?[{d:k.gepland,t:k.tijd||"",hoofd:true}]:[]),...(k.reeks||[])];
  const t=iso(today());
  openDlg(`<div class="dlg-head"><span class="objic big">${I.refresh}</span><div style="min-width:0;flex:1"><h3>Afspraakreeks</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(jobAddr(k))}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="rk-sum"><div><b>${items.length}</b><small>afspraken</small></div><div><b>${esc(items.length?rkDag(items[items.length-1].d):"–")}</b><small>laatste</small></div><div><b>${eur0(toon((Number(k.prijs)||0)*items.length))}</b><small>totaal</small></div></div>
    <ol class="rk-list rk-edit">${items.map((x,i)=>`<li class="${x.d===dSel?"sel ":""}${x.hoofd?"eerste":""}"><span class="rk-i">${i+1}</span><b>${esc(rkDag(x.d))}</b><input type="time" value="${esc(x.t||"")}" data-rkt="${i}" aria-label="Tijd afspraak ${i+1}">${x.hoofd?`<span class="rk-1">${x.d<t?"open":"eerstvolgend"}</span><button type="button" class="iconbtn sm" data-act="job" data-id="${esc(k.id)}" data-d="${esc(x.d)}" aria-label="Openen" title="Openen">${I.right}</button>`:`<button type="button" class="iconbtn sm" data-rkdel="${i}" aria-label="Deze afspraak verwijderen" title="Verwijderen">${I.trash}</button>`}</li>`).join("")}</ol>
    <p class="help" style="margin:4px 0 0">Na het afronden van een beurt schuift de volgende afspraak uit de reeks automatisch door. Een losse afspraak verplaats je door hem te verwijderen en opnieuw in te plannen.</p>
    <div class="row"><button type="button" class="ghost danger" id="rkStop">${I.x}Reeks stoppen</button><span class="sp"></span><button type="button" data-act="klant" data-id="${esc(k.id)}">Klant</button><button type="button" class="primary" data-act="close">Klaar</button></div>`);
  const opsl=async(nieuw,msg)=>{const cur=state.klanten.find(x=>x.id===id)||k,prev={tijd:cur.tijd||"",reeks:cur.reeks||[]};
    try{await save("klanten",id,{...strip(cur),...nieuw});if(msg)toast(msg,()=>{const c2=state.klanten.find(x=>x.id===id);return save("klanten",id,{...strip(c2),...prev})});openReeksInfo(id,dSel)}catch(e){err(e)}};
  form.querySelectorAll("[data-rkt]").forEach(inp=>inp.onchange=()=>{const i=Number(inp.dataset.rkt),cur=state.klanten.find(x=>x.id===id)||k,off=cur.gepland?1:0;
    if(i<off)opsl({tijd:inp.value},"Tijd aangepast");else{const r=(cur.reeks||[]).slice();r[i-off]={...r[i-off],t:inp.value};opsl({reeks:r},"Tijd aangepast")}});
  form.querySelectorAll("[data-rkdel]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.rkdel),cur=state.klanten.find(x=>x.id===id)||k,off=cur.gepland?1:0,r=(cur.reeks||[]).slice(),x=r.splice(i-off,1)[0];opsl({reeks:r},"Afspraak "+fmtD(x.d)+" uit de reeks verwijderd")});
  $("#rkStop").onclick=async()=>{if(!(await vraag("Reeks stoppen",`De ${plural((k.reeks||[]).length,"latere afspraak","latere afspraken")} worden uit de agenda gehaald. De eerstvolgende afspraak${k.gepland?" ("+esc(fmtD(k.gepland))+")":""} blijft staan.`,"Ja, stoppen")))return;opsl({reeks:[]},"Reeks gestopt")};
}
