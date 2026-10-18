/* ---------- Rollen: eigenaar / beheerder / medewerker ----------
   Een medewerker (glazenwasser) ziet alleen wat hij nodig heeft om het werk te doen:
   Vandaag en Route, per adres de instructies, poortcode en notities, en hij kan afmelden.
   Geen bedragen, geen facturen, offertes, instellingen of planning. */
const MW_TABS=["vandaag","handleiding"];
state.rol=(()=>{try{return localStorage.getItem("ms.rol")||""}catch(e){return""}})();
function isMw(){if(!LIVE)return false;if(isEigenaar())return false;if(!state.me)return state.rol==="medewerker";return state.rol!=="beheerder"&&state.rol!=="eigenaar"}
async function laadRol(){if(!LIVE)return;
  const e=String((state.me&&state.me.email)||"").toLowerCase();if(!e){setTimeout(laadRol,400);return}
  let r="eigenaar";
  if(e!=="robin@mijnschoonmaker.com"){try{const d=await fsDb().doc("gebruikers/"+e).get();r=(d.exists&&d.data().rol)||"beheerder"}catch(er){r="medewerker"}}
  const oud=state.rol;state.rol=r;try{localStorage.setItem("ms.rol",r)}catch(er){}
  if(isMw()&&!MW_TABS.includes(state.tab))state.tab="vandaag";
  if(oud!==r)render()}
if(LIVE)setTimeout(laadRol,300);

/* eenvoudige klantinfo voor de medewerker: alleen wat je onderweg nodig hebt */
function openKlantMw(id){const k=state.klanten.find(x=>x.id===id);if(!k)return;
  const a=jobAddrObj(k),t=k.portaalToegang||{};
  openDlg(`<div class="dlg-head"><span class="objic big">${I.user}</span><div style="min-width:0;flex:1"><h3>${esc(a.adres||cleanName(k.naam))}</h3><div class="subt">${esc(cleanName(k.naam))}${a.plaats?" · "+esc([a.postcode,a.plaats].filter(Boolean).join(" ")):""}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
    <div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn" href="${esc(mapsQ(k))}" target="_blank" rel="noopener">${I.route}Navigeren</a>${k.telefoon?`<a class="btn" href="tel:${esc(String(k.telefoon).replace(/\s/g,""))}">${I.phone}Bellen</a>`:""}</div>
    ${toegangHtml(k)}
    
    ${typeof hospRoute==="function"?hospRoute(k):""}
    <div class="kv-mw"><div><small>Dienst</small><b>${esc(k.dienst||"Glasbewassing")}</b></div><div><small>Duur</small><b>${duur(k)} min</b></div><div><small>Binnen</small><b>${k.binnen?"Ja":"Nee"}</b></div></div>
    <div class="row"><span class="sp"></span><button type="button" class="primary" data-act="close">Sluiten</button></div>`);
}
