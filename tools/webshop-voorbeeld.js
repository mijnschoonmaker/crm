/* Maakt public/webshop/voorbeeld.html: de echte dienstenwebshop (zelfde opmaak en tarieven als de test-webshop)
   als voorbeeld voor www.mansard.nl. Neutraal bedrijf ("Voorbeeld Glazenwasserij"), elk adres ligt in het werkgebied
   en er wordt niets verstuurd: aanvragen, aanbevelingscodes en WhatsApp/mail gaan nergens heen.
   Gebruik: node tools/webshop-voorbeeld.js  (leest public/webshop/mijnschoonmaker-test.html) */
const fs = require("fs"), path = require("path");
function maakVoorbeeld(testHtml) {
  let h = testHtml;
  const i = h.indexOf("const BEDRIJF="), j = h.indexOf("};", i);
  if (i < 0 || j < 0) throw new Error("BEDRIJF niet gevonden");
  const oud = JSON.parse(h.slice(i + 14, j + 1));
  const B = { ...oud, naam: "Voorbeeld Glazenwasserij", email: "", whatsapp: "", logo: "", endpoint: "voorbeeld:aanvraag", werkgebied: "", gebieden: [], klantPc: "", voorwaarden: "" };
  h = h.slice(0, i) + "const BEDRIJF=" + JSON.stringify(B) + h.slice(j + 1);
  const kop = `<script>/* voorbeeld: niets verlaat deze pagina */(function(){const F=window.fetch.bind(window);
window.fetch=function(u,o){const s=String(u&&u.url||u);if(s.indexOf("voorbeeld:")===0){
 if(/[?&]ref=/.test(s))return Promise.resolve(new Response("{}",{status:404}));
 setTimeout(function(){try{const d=document.createElement("div");d.className="vb-klaar";d.textContent="Dit is een voorbeeld: er is niets verstuurd. In uw eigen webshop komt de aanvraag nu direct in Mansard.";document.body.appendChild(d);setTimeout(function(){d.remove()},7000)}catch(e){}},300);
 return Promise.resolve(new Response('{"ok":true}',{status:200,headers:{"Content-Type":"application/json"}}))}
 if(/app\\.mansard\\.nl\\/api\\//.test(s))return Promise.resolve(new Response('{"ok":true}',{status:200}));return F(u,o)};
try{localStorage.removeItem("ms.ref")}catch(e){}
/* bezoekers van mansard.nl hebben geen foto van hun huis bij de hand: één tik op een voorbeeldfoto */
function vbKnop(){const fk=document.querySelector(".cfg-fotos");if(!fk||fk.querySelector(".vb-foto"))return;const b=document.createElement("button");b.type="button";b.className="vb-foto";b.innerHTML="<b>Gebruik een voorbeeldfoto</b><span>Geen foto bij de hand? Probeer het met dit huis.</span>";
 b.onclick=async function(){if(b.disabled)return;b.disabled=true;try{const r=await fetch("/site/huis.jpg",{cache:"force-cache"});const bl=await r.blob();const f=new File([bl],"voorbeeldhuis.jpg",{type:bl.type||"image/jpeg"});const inp=document.getElementById("ph-in");const dt=new DataTransfer();dt.items.add(f);inp.files=dt.files;inp.dispatchEvent(new Event("change",{bubbles:true}))}catch(e){}setTimeout(function(){b.disabled=false},800)};
 const h=fk.querySelector("h3");if(h&&h.nextSibling)fk.insertBefore(b,h.nextSibling.nextSibling||null);else fk.prepend(b)}
/* in een iframe op mansard.nl: nooit de pagina eromheen laten meescrollen */
Element.prototype.scrollIntoView=function(o){try{const r=this.getBoundingClientRect(),c=(o&&o.block==="center")?(innerHeight-r.height)/2:(o&&o.block==="end")?innerHeight-r.height:0;window.scrollTo({top:Math.max(0,r.top+scrollY-c),behavior:(o&&o.behavior)||"auto"})}catch(e){}};
{const fo=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(o){return fo.call(this,Object.assign({},o||{},{preventScroll:true}))}}
/* direct beginnen bij de bolletjes: particulier, voorbeeldfoto en de editor open */
async function vbStart(){try{const wacht=t=>new Promise(r=>setTimeout(r,t));
 for(let i=0;i<40&&!document.querySelector(".cfg-start");i++)await wacht(100);
 const st=document.querySelector(".cfg-start");if(st)st.click();await wacht(300);const k=document.querySelector(".k-part");if(k)k.click();await wacht(300);
 const r=await fetch("/site/huis.jpg",{cache:"force-cache"});const bl=await r.blob();const f=new File([bl],"voorbeeldhuis.jpg",{type:bl.type||"image/jpeg"});
 const inp=document.getElementById("ph-in");const dt=new DataTransfer();dt.items.add(f);inp.files=dt.files;inp.dispatchEvent(new Event("change",{bubbles:true}));
 for(let i=0;i<40&&!(window.photos&&photos.length);i++)await wacht(100);await wacht(400);if(typeof openEd==="function")openEd(0);window.scrollTo(0,0)}catch(e){}}
if(!/[?&]start=0/.test(location.search))window.addEventListener("load",function(){setTimeout(vbStart,300)});
new MutationObserver(vbKnop).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener("DOMContentLoaded",vbKnop);
})();</script>
<style>.vb-klaar{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:99999;max-width:min(92vw,520px);background:#0e1117;color:#fff;font:500 14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;padding:12px 16px;border-radius:12px;box-shadow:0 14px 34px -14px rgba(0,0,0,.55);text-align:center}
a[href*="app.mansard.nl/portaal"]{pointer-events:none;opacity:.55}
.vb-foto{all:unset;box-sizing:border-box;display:grid;gap:3px;width:100%;margin:10px 0 12px;padding:12px 14px;border-radius:12px;border:1.5px solid #0e1117;background:#fff;color:#0e1117;cursor:pointer;font:400 13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left}
.vb-foto b{font-weight:600;font-size:14px}.vb-foto span{color:#5b6370}.vb-foto:disabled{opacity:.6}
body[data-lock] .vb-foto,.cfg-fotos[data-lock] .vb-foto{pointer-events:auto}</style>`;
  h = h.replace("<head>", "<head>\n" + kop);
  h = h.replace(/<title>[^<]*<\/title>/, "<title>Voorbeeld dienstenwebshop · Mansard</title>");
  h = h.replace("<head>", '<head>\n<meta name="robots" content="noindex">');
  return h;
}
module.exports = maakVoorbeeld;
if (require.main === module) {
  const d = path.join(__dirname, "..", "public", "webshop");
  fs.writeFileSync(path.join(d, "voorbeeld.html"), maakVoorbeeld(fs.readFileSync(path.join(d, "mijnschoonmaker-test.html"), "utf8")));
  console.log("voorbeeld.html gemaakt");
}
