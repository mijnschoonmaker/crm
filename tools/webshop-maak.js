/* Maakt de dienstenwebshop van mijnschoonmaker.com als vaste pagina (public/webshop/mijnschoonmaker.html),
   met dezelfde tarieven, frequenties, werkgebied, logo en WhatsApp als het CRM (zelfde opbouw als "Website-calculator downloaden").
   Leest alleen uit de database; schrijft alleen dit bestand. */
const fs = require("fs"), path = require("path");
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const dec = v => Array.isArray(v) ? v.map(dec) : v && typeof v === "object" ? (v.__arr ? v.__arr.map(x => x && x.__a ? x.__a.map(dec) : dec(x)) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;
const TYPES = { g0_p: 1.75, g1_p: 1.90, g2_p: 2.05, g3_p: 2.20, tuimel_p: 1.61, lood_p: 1.90, koepel_p: 2.20, mini_p: 0.40 };
const DEF = { start: 0, min: 56.20, tiers: [[10, 10], [20, 20], [30, 30], [40, 40]], tb: {}, wg: {}, fp: {} };
const FREQ_BASE = [["w1","1x per week",52,0,1],["w2","1x per 2 weken",26,0,2],["w4","1x per 4 weken",13,0,4],["mnd","1x per maand",12,0,4],    ["w6","1x per 6 weken",52/6,0,6],["m8","1x per 8 weken",6.5,5,8],["mnd2","1x per 2 maanden",6,0,8],["w12","1x per 12 weken",52/12,0,12],    ["mnd3","1x per 3 maanden",4,-150,12],["w16","1x per 16 weken",3.25,0,12],["mnd4","1x per 4 maanden",3,0,12],["w24","1x per 24 weken",52/24,0,26],    ["mnd6","1x per 6 maanden",2,0,26],["w48","1x per 48 weken",52/48,0,52],["mnd12","1x per 12 maanden",1,0,52],["afroep","Op afroep",1,-25,0],["once","Eenmalig",1,-25,0]];
const waNr = t => { let d = String(t || "").replace(/\D/g, ""); if (d.startsWith("00")) d = d.slice(2); else if (d.startsWith("0")) d = "31" + d.slice(1); return d; };
(async () => {
  const get = async id => dec((await db.doc("instellingen/" + id).get()).data() || {});
  const [s, r, u] = await Promise.all([get("bedrijf"), get("ramen"), get("uitvoering")]);
  const c = { ...TYPES, ...JSON.parse(JSON.stringify(DEF)) }; Object.keys(r).forEach(k => { if (k in c) c[k] = r[k]; }); if (!Array.isArray(c.tiers)) c.tiers = DEF.tiers;
  const cfg = { g0_p: c.g0_p, g1_p: c.g1_p, g2_p: c.g2_p, g3_p: c.g3_p, tuimel_p: c.tuimel_p, lood_p: c.lood_p, koepel_p: c.koepel_p, mini_p: c.mini_p, start: c.start || 0, min: c.min, tiers: c.tiers, tb: c.tb || {}, wg: c.wg || {}, fp: c.fp || {} };
  /* frequenties: zoals RC.freqList() in het CRM */
  const fc = s.freqCalc || {}, list = FREQ_BASE.slice();
  Object.entries(fc).forEach(([k, v]) => { if (v && typeof v === "object" && Number(v.w) > 0 && !list.some(x => x[0] === k)) list.push([k, String(v.l || "1x per " + v.w + " weken"), 52 / Number(v.w), 0, Number(v.w)]); });
  const g = [...(u.groepen || []), ...(u.eigen || [])].find(x => x && (x.id === "glas" || x.type === "glas"));
  const keuzes = g && Array.isArray(g.freqs) && g.freqs.length ? g.freqs.map(String) : null, advies = g && g.freqAdvies != null && g.freqAdvies !== "" ? String(g.freqAdvies) : null;
  const fla = list.map(([k, l, y, p, w]) => ({ k, l, p, w, aan: fc[k] !== false && (!keuzes || keuzes.includes(k)), adv: advies === k })).filter(f => f.aan);
  const fadv = (fla.find(f => f.adv) || fla.find(f => f.k === "m8") || fla[0] || {}).k || "m8";
  /* werkgebied */
  const gebieden = (s.webGebieden || []).filter(x => x && x.aan !== false && Array.isArray(x.pts) && x.pts.length >= 3).map(x => ({ s: x.soort || "beide", p: x.pts.map(q => [Math.round(q[0] * 1e5) / 1e5, Math.round(q[1] * 1e5) / 1e5]) }));
  let klantPc = "";
  if (s.webKlantPc !== false) { const z = new Set(); (await db.collection("klanten").select("postcode").get()).docs.forEach(d => { const m = String(d.data().postcode || "").match(/^\s*(\d{4})/); if (m) z.add(m[1]); }); klantPc = [...z].sort().join(","); }
  const logoId = s.logo || "";
  const B = { naam: s.naam || "Glasbewassing", email: s.email || "", whatsapp: waNr(s.webWa || s.telefoon), logo: logoId ? "https://app.mansard.nl/_blob/" + logoId : "", endpoint: "https://app.mansard.nl/api/aanvraag", werkgebied: String(s.webPostcodes || "").trim(), gebieden, klantPc, voorwaarden: String(s.webVoorwaarden || "").trim() };
  const fl = "const FREQ_LIST=" + JSON.stringify(fla.map(f => [f.k, f.l, f.w ? 52 / f.w : 1, Number(f.p) || 0, f.w || 0])) + ";\nconst FREQ_ADV=" + JSON.stringify(fadv) + ";\n";
  const conf = "/*CFG-START*/\nconst BEDRIJF=" + JSON.stringify(B) + ";\nconst VAT=" + ((Number(s.btw) || 21) / 100) + ";\nconst cfg=" + JSON.stringify(cfg) + ";\n" + fl;
  const T = fs.readFileSync(path.join(__dirname, "..", "src", "klantcalculator.html"), "utf8");
  const html = T.slice(0, T.indexOf("/*CFG-START*/")) + conf + T.slice(T.indexOf("/*CFG-END*/")).split('${k==="m8"?" selected":""}').join('${k===FREQ_ADV?" selected":""}').split('g("freq").value==="m8"').join('g("freq").value===FREQ_ADV');
  const uit = path.join(__dirname, "..", "public", "webshop"); fs.mkdirSync(uit, { recursive: true });
  fs.writeFileSync(path.join(uit, "mijnschoonmaker.html"), html);
  console.log("::notice title=Webshop::gemaakt · " + fla.length + " frequenties (advies " + fadv + ") · minimum " + cfg.min + " · " + gebieden.length + " werkgebieden · " + (klantPc ? klantPc.split(",").length : 0) + " klantpostcodes · logo " + (logoId ? "ja" : "nee"));
})().catch(x => { console.error(x); process.exit(1); });
