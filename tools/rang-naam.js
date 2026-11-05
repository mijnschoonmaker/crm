/* Alleen lezen: welke naam toont de ranglijst voor klanten bij de zoekterm (zelfde code als het portaal). Wijzigt niets. */
const path = require("path"), fs = require("fs"), Module = require("module");
const f = path.join(__dirname, "../functions/index.js"), mod = new Module(f, null);
mod.filename = f; mod.paths = Module._nodeModulePaths(path.dirname(f));
mod._compile(fs.readFileSync(f, "utf8") + "\nmodule.exports.__x={voornaamVan,db};", f);
const { voornaamVan, db } = mod.exports.__x, Z = String(process.env.ZOEK || "").toLowerCase().split("|");
const p = fs.readFileSync(path.join(__dirname, "../functions/portaal.js"), "utf8");
const schoonSrc = (p.match(/\n  const schoon = [^\n]*/) || [""])[0];
eval(schoonSrc + "\n" + p.slice(p.indexOf("  const rangEen"), p.indexOf("  /* top 3 van een maand")) + ";globalThis.rangVn=rangVn;globalThis.schoon=typeof schoon==='function'?schoon:(x=>x)");
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => Z.some(z => z && String(d.data().naam || "").toLowerCase().includes(z)));
  ks.forEach(d => { const k = d.data(); const kk = { ...k, naam: schoon(k.naam), contact: k.contact ? schoon(k.contact) : "" };
    console.log("NAAM", JSON.stringify({ naam: k.naam, voornaam: k.voornaam, achternaam: k.achternaam, contact: k.contact }), "voornaamVan:", voornaamVan(kk), "ranglijst:", rangVn(kk)) });
  process.exit(0);
})().catch(x => { console.error(x); process.exit(1) });
