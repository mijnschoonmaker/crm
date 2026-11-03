/* Eenmalig (met akkoord van Robin): het definitieve bestellingsoverzicht van een online ondertekende offerte alsnog versturen,
   precies zoals akkoordGeven dat doet. Verstuurt niets als er al een definitief overzicht bij deze offerte is. */
const path = require("path"), fs = require("fs"), Module = require("module");
const f = path.join(__dirname, "../functions/index.js"), mod = new Module(f, null);
mod.filename = f; mod.paths = Module._nodeModulePaths(path.dirname(f));
mod._compile(fs.readFileSync(f, "utf8") + "\nmodule.exports.__x={stuurOverzichtMail,leesAsset,db};", f);
const { stuurOverzichtMail, leesAsset, db } = mod.exports.__x, NR = String(process.env.NR || "");
const n = (...a) => console.log("::notice title=Opnieuw::" + a.join(" "));
(async () => {
  const q = await db.collection("akkoord").where("nummer", "==", NR).get();
  if (q.size !== 1) { n("niet precies 1 akkoord gevonden:", q.size); return; }
  const a = q.docs[0].data(), g = a.getekend || {};
  if (a.status !== "getekend" || !a.email) { n("niet getekend of geen e-mail; niets gedaan"); return; }
  const al = await db.collection("berichten").where("factuurId", "==", a.factuurId || "x").get();
  if (al.docs.some(d => d.data().sjabloon === "definitief")) { n("er is al een definitief overzicht; niets gedaan"); return; }
  const h = g.handtekening ? await leesAsset(g.handtekening) : null, m = a.model || {};
  const r = await stuurOverzichtMail({ soort: "definitief", naar: a.email, naamKlant: a.naamKlant || (m.klant || {}).naam || "", klantId: a.klantId || "", meta: { factuurId: a.factuurId || "" },
    model: { ...m, ...(h ? { handtekening: { naam: g.naam, plaats: g.plaats, datum: g.datum, browser: g.browser, systeem: g.systeem, png: h.bytes } } : {}) } });
  n("verstuurd:", r.nummer, "· handtekening in pdf:", h ? "ja" : "nee");
  process.exit(0);
})().catch(x => { console.error(x.message); process.exit(1); });
