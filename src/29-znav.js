/* ---------- Navigeren: direct de navigatie-app op dit apparaat openen ----------
   Een gewone google.com/maps-link opent op een iPhone/iPad zonder Google Maps de App Store.
   Op iPhone/iPad kies je één keer (per apparaat) welke app: Apple Kaarten, Google Maps of Waze. */
const NAV_APPS=[["apple","Apple Kaarten"],["google","Google Maps"],["waze","Waze"]];
const navIos=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const navPref=()=>{try{return localStorage.getItem("ms.nav")||""}catch(e){return""}};
function navUrl(app,adr){const q=encodeURIComponent(adr);
  if(app==="google")return navIos()?"comgooglemaps://?daddr="+q+"&directionsmode=driving":"https://www.google.com/maps/dir/?api=1&destination="+q+"&travelmode=driving";
  if(app==="waze")return "https://waze.com/ul?q="+q+"&navigate=yes";
  return "https://maps.apple.com/?daddr="+q+"&dirflg=d"}
function navKies(adr,ga){const o=document.createElement("dialog");o.className="nav-kies";const cur=navPref();
  o.innerHTML=`<div class="nav-k"><b>Navigeren met</b><small>${esc(adr)}</small>${NAV_APPS.map(([v,l])=>`<button type="button" class="${v===cur?"primary":""}" data-nav="${v}">${esc(l)}</button>`).join("")}<label class="check-row"><input type="checkbox" id="navOnth" checked>Onthouden op dit apparaat</label><button type="button" class="ghost" data-nav="">Annuleren</button></div>`;
  document.body.appendChild(o);try{o.showModal()}catch(_){o.setAttribute("open","")}
  const weg=()=>{try{o.close()}catch(_){}o.remove()};o.addEventListener("cancel",e=>{e.preventDefault();weg()});
  o.addEventListener("click",e=>{const b=e.target.closest("[data-nav]");if(!b)return;const v=b.dataset.nav;const onth=o.querySelector("#navOnth").checked;weg();if(!v)return;
    if(onth)try{localStorage.setItem("ms.nav",v)}catch(_){}if(ga!==false)location.href=navUrl(v,adr);else toast("Navigatie-app: "+NAV_APPS.find(x=>x[0]===v)[1])})}
/* alle "navigeer naar dit adres"-links (Google Maps zoeken) onderscheppen op iPhone/iPad */
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href^="https://www.google.com/maps/search/"]');if(!a||!navIos())return;
  let adr="";try{adr=new URL(a.href).searchParams.get("query")||""}catch(_){}if(!adr)return;e.preventDefault();e.stopPropagation();
  const p=navPref();if(p)location.href=navUrl(p,adr);else navKies(adr)},true);
/* andere app kiezen (knop op de Route-pagina) */
function navWissel(){navKies("Kies de app voor Navigeer",false)}
