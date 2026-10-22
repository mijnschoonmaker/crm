/* ---------- Systeemcontrole ----------
   Elke nacht kijkt de server (functions/controle.js) of je gegevens kloppen: factuurnummers, betaalde facturen,
   gekoppelde beurten, mails, back-up en bedrijfsgegevens. Alleen lezen, er wordt niets aangepast.
   Hier zie je de uitkomst en kun je de controle direct opnieuw laten draaien. */
const SYSC=()=>{const d=(RAW.instellingen||[]).find(x=>x.id==="systeemcontrole");return d?strip(d):null};
const SYS_KL={groen:["ok","Alles klopt"],oranje:["soon","Even naar kijken"],rood:["late","Actie nodig"]};
const sysWanneer=ts=>{if(!ts)return"nog nooit";const d=new Date(ts),v=iso(today()),dg=iso(d);return(dg===v?"vandaag":dg===iso(addDays(today(),-1))?"vannacht":fmtD(dg))+" om "+d.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})};
SETCARDS.push({id:"systeem",t:"Systeemcontrole",sub:"Elke nacht nagaan of alles klopt",ic:"shield",bg:"#252c3c",
  st:()=>{const c=SYSC();if(!c)return["soon","Nog niet gedraaid"];const[,l]=SYS_KL[c.status]||SYS_KL.oranje;return[c.status==="groen"?"ok":"soon",l]},
  rows:()=>{const c=SYSC();if(!c)return[["Laatste controle","Nog niet"],["Controleert","Facturen · beurten · mails · back-up"]];const n=s=>c.checks.filter(x=>x.status===s).length;
    return[["Laatste controle",sysWanneer(c.op)],["Goed",n("groen")+" van "+c.checks.length],["Aandacht",n("rood")+n("oranje")?(n("rood")?n("rood")+" rood":"")+(n("rood")&&n("oranje")?" · ":"")+(n("oranje")?n("oranje")+" oranje":""):"—"]]},
  warn:()=>{const c=SYSC();return c&&c.status==="rood"?"Er is iets gevonden dat actie nodig heeft. Open de controle voor de details.":""},v:"Bekijken"});
SETEXTRA.systeem=c=>{const teken=(bezig)=>{const r=SYSC();
  setDlg(c,`${info("Elke nacht om 04:40 controleert Mansard je gegevens: dubbele of ontbrekende factuurnummers, betaalde facturen zonder datum, beurten die naar een verwijderde factuur wijzen, vergeten afspraken, mislukte of blijvende mails, de back-up en je bedrijfsgegevens. Er wordt niets aangepast. Is er iets rood, dan krijg je een mail.")}
    ${r?`<div class="sys-kop sys-${esc(r.status)}"><span class="sys-dot"></span><div><b>${esc((SYS_KL[r.status]||SYS_KL.oranje)[1])}</b><small>Laatste controle ${esc(sysWanneer(r.op))}${r.telling?` · ${r.telling.facturen} facturen, ${r.telling.klanten} klanten, ${r.telling.beurten} beurten`:""}</small></div></div>
    <div class="sys-lijst">${r.checks.slice().sort((a,b)=>({rood:0,oranje:1,groen:2})[a.status]-({rood:0,oranje:1,groen:2})[b.status]).map(x=>`<div class="sys-r sys-${esc(x.status)}"><span class="sys-dot"></span><div><b>${esc(x.titel)}${x.aantal?` <em>${x.aantal}</em>`:""}</b><small>${esc(x.uitleg)}</small>${x.voorbeelden&&x.voorbeelden.length?`<ul>${x.voorbeelden.map(v=>`<li>${esc(v)}</li>`).join("")}</ul>`:""}</div></div>`).join("")}</div>`
    :`<p class="subt">De eerste controle draait vannacht. Je kunt hem ook nu starten.</p>`}`,
    {wide:true,foot:`<span class="sp"></span><button type="button" class="ghost" data-act="close">Sluiten</button><button type="button" class="primary" id="sysNu" ${bezig?"disabled":""}>${I.refresh||I.check}${bezig?"Bezig met controleren…":"Nu controleren"}</button>`});
  const b=form.querySelector("#sysNu");if(b)b.onclick=async()=>{if(!LIVE||typeof fbFn!=="function"){toast("Controleren kan in de online versie");return}teken(true);
    try{await fbFn("controleNu")();toast("Controle klaar")}catch(e){toast("Controleren lukte niet: "+(typeof fnFout==="function"?fnFout(e):e.message))}setTimeout(()=>teken(false),400)}};teken(false)};
document.head.insertAdjacentHTML("beforeend",`<style id="sysStijl">
.sys-kop{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:16px;background:linear-gradient(180deg,#f5f5f3,#ececea 60%,#e3e3e0);border:1px solid #dfe0e0;margin:6px 0 14px}
.sys-kop b{display:block;font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:#252c3c}.sys-kop small{color:#56616a;font-size:12.5px}
.sys-dot{width:12px;height:12px;border-radius:50%;flex:none;background:#2f8a5f;box-shadow:0 0 0 4px rgb(47 138 95 / .15)}
.sys-oranje>.sys-dot{background:#d08a1e;box-shadow:0 0 0 4px rgb(208 138 30 / .16)}.sys-rood>.sys-dot{background:#c4473b;box-shadow:0 0 0 4px rgb(196 71 59 / .16)}
.sys-lijst{display:grid;border:1px solid #dfe0e0;border-radius:16px;overflow:hidden;background:#fff}
.sys-r{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-bottom:1px solid #dfe0e0}.sys-r:last-child{border-bottom:0}
.sys-r>.sys-dot{margin-top:5px;width:10px;height:10px}.sys-r div{min-width:0;flex:1}
.sys-r b{font-size:13.5px;color:#252c3c;display:flex;align-items:center;gap:8px}.sys-r b em{font-style:normal;font-size:11px;font-weight:700;background:#ececea;color:#4d575f;border-radius:99px;padding:1px 8px}
.sys-r small{display:block;color:#56616a;font-size:12.5px;line-height:1.5;margin-top:2px}
.sys-r ul{margin:6px 0 0;padding-left:16px;color:#4d575f;font-size:12px;line-height:1.55}.sys-r li{overflow-wrap:anywhere}
.sys-groen ul{display:none}
</style>`);
