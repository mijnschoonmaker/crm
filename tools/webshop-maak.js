/* Maakt de prijscalculator van mijnschoonmaker.com als vaste pagina (public/webshop/mijnschoonmaker.html),
   met dezelfde tarieven, frequenties, werkgebied, logo en WhatsApp als het CRM (zelfde opbouw als "Website-calculator downloaden").
   Leest alleen uit de database; schrijft alleen dit bestand. */
const fs = require("fs"), path = require("path");
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const { bouwConf } = require("../functions/webshopconf.js");
(async () => {
  const W = await bouwConf(db, { log: true }), { B, cfg, fla, gebieden, klantPc, logoId } = W, fadv = W.FREQ_ADV;
  /* live bijwerken: /api/aanvraag?conf=1 zet window.__WSCONF met de actuele instellingen; lukt dat niet, dan gelden de waarden van vannacht */
  const fl = "const FREQ_LIST=__W.FREQ_LIST||" + JSON.stringify(W.FREQ_LIST) + ";\nconst FREQ_ADV=__W.FREQ_ADV||" + JSON.stringify(fadv) + ";\n";
  const conf = "/*CFG-START*/\nconst __W=(window.__WSCONF&&window.__WSCONF.B)?window.__WSCONF:{};\nconst BEDRIJF=__W.B||" + JSON.stringify(B) + ";\nconst VAT=__W.VAT||" + W.VAT + ";\nconst cfg=__W.cfg||" + JSON.stringify(cfg) + ";\n" + fl;
  const T = fs.readFileSync(path.join(__dirname, "..", "src", "klantcalculator.html"), "utf8");
  const html = T.slice(0, T.indexOf("/*CFG-START*/")) + conf + T.slice(T.indexOf("/*CFG-END*/")).split('${k==="m8"?" selected":""}').join('${k===FREQ_ADV?" selected":""}').split('g("freq").value==="m8"').join('g("freq").value===FREQ_ADV');
  const uit = path.join(__dirname, "..", "public", "webshop"); fs.mkdirSync(uit, { recursive: true });
  /* live (15 nov 2026): "offerte op maat" — klant maakt foto's en vult gegevens in, offerte binnen 24 uur.
     Zelfde adressen als voorheen (de website laadt mijnschoonmaker-test.html en mijnschoonmaker.html), oude versie blijft als reserve. */
  const skin = fs.readFileSync(path.join(__dirname, "webshop-config-skin.html"), "utf8"), bi = html.lastIndexOf("</body>");
  const mt = html.slice(0, bi) + skin + html.slice(bi), bj = mt.lastIndexOf("</body>");
  const laag = fs.readFileSync(path.join(__dirname, "..", "src", "kc", "fotolaag.html"), "utf8");
  const gs = "<script>window.FO_GOOGLE=(window.__WSCONF&&window.__WSCONF.google)||" + JSON.stringify(W.google) + "</script>";
  /* live bijwerken zonder de pagina op te houden: de actuele documenten en gegevens komen ná het laden binnen (async);
     de pagina zelf toont meteen de versie van vannacht. Tot de offertepagina is opgebouwd niets tonen (geen flits van de oude calculator). */
  const live = '<script>window.__wsLive=function(c){try{var B=BEDRIJF,n=(c&&c.B)||{};["voorwaardenPdf","privacyPdf","herroepingPdf","voorwaarden","logo","whatsapp","email"].forEach(function(k){var o=B[k];if(n[k]!==undefined&&n[k]!==o){if(o)document.querySelectorAll(\'a[href="\'+o+\'"]\').forEach(function(a){a.href=n[k]});B[k]=n[k]}});if(c.google)window.FO_GOOGLE=c.google}catch(e){}};document.body.classList.add("fo-klaar");</script><script async src="https://app.mansard.nl/api/aanvraag?conf=1"></script>';
  const verberg = '<style>html body:not(.cfg):not(.fo-klaar)>*{visibility:hidden}</style>';
  const hi = mt.indexOf("</head>");
  const foto = mt.slice(0, hi) + verberg + mt.slice(hi, bj) + gs + laag + live + mt.slice(bj);
  fs.writeFileSync(path.join(uit, "mijnschoonmaker.html"), foto);
  fs.writeFileSync(path.join(uit, "mijnschoonmaker-test.html"), foto);
  fs.writeFileSync(path.join(uit, "mijnschoonmaker-foto.html"), foto);
  fs.writeFileSync(path.join(uit, "mijnschoonmaker-oud.html"), mt);
  try { fs.writeFileSync(path.join(uit, "voorbeeld.html"), require("./webshop-voorbeeld.js")(mt.slice(0, bj) + laag + mt.slice(bj), { foto: true })); } catch (e) { console.log("voorbeeld.html niet gemaakt:", e.message); }
  console.log("::notice title=Webshop::gemaakt · " + fla.length + " frequenties (advies " + fadv + ") · minimum " + cfg.min + " · " + gebieden.length + " werkgebieden · " + (klantPc ? klantPc.split(",").length : 0) + " klantpostcodes · logo " + (logoId ? "ja" : "nee"));
})().catch(x => { console.error(x); process.exit(1); });
