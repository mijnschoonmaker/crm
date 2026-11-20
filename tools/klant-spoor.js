/* Alleen lezen: volgt het spoor van één klant (zoekterm in adres/naam of klantnummer): klantkaart, opdrachten, offertes/facturen,
   akkoorden, aanvragen en berichten. Wijzigt niets; toont geen e-mailadressen of telefoonnummers. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined && o[k] !== "").map(k => [k, o[k]]));
const zonder = o => JSON.stringify(o, (k, v) => /mail|tel|telefoon|iban|handtekening|sig|png|data:/i.test(k) ? undefined : v);
(async () => {
  const z = String(process.env.ZOEK || "").toLowerCase().trim();
  const all = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const hit = all.filter(k => String(k.klantnr || "") === z || JSON.stringify([k.adres, k.naam]).toLowerCase().includes(z));
  const ids = new Set(hit.map(k => k.id));
  for (const k of hit) {
    console.log("KLANT", k.id, zonder(pick(k, ["naam", "klantnr", "adres", "plaats", "dienst", "prijs", "frequentie", "gepland", "actief", "prospect", "hoofdKlantId", "aangemaakt", "laatst", "eersteKeer", "bron"])));
    (k.opdrachten || []).forEach(o => console.log("  OPDRACHT", zonder(pick(o, ["id", "nr", "dienst", "prijs", "frequentie", "volgende", "actief", "bij", "groep", "eenmalig", "gedaan"])), "items:", zonder((o.items || []).map(i => pick(i, ["naam", "aantal", "prijs"])))));
    console.log("  overige velden:", Object.keys(k).sort().join(","));
    console.log("  opdrachtVerwijderd:", zonder(k.opdrachtVerwijderd), "· eenmalig:", zonder(k.eenmalig), "· akkoord:", zonder(k.akkoord));
    (k.log || []).slice(-40).forEach(l => console.log("  LOG", zonder(l).slice(0, 300)));
  }
  const fs = (await db.collection("facturen").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  fs.filter(f => ids.has(f.klantId) || /001813|472031/.test(String(f.nummer || "") + String(f.klantnr || ""))).forEach(f =>
    console.log("FACTUUR/OFFERTE", f.id, zonder(pick(f, ["soort", "nummer", "datum", "status", "klantId", "verstuurdOp", "getekend", "akkoordOp", "omgezet", "opdrachtGemaakt", "verwerkt", "totaal", "bron"])), "regels:", zonder((f.regels || []).map(r => pick(r, ["omschrijving", "aantal", "prijs"])))));
  for (const fid of ["fmw0jpgesnnru"]) { const d = await db.doc("facturen/" + fid).get(); console.log("OFFERTE-DOC", fid, d.exists ? zonder(pick(d.data(), ["soort", "nummer", "status", "klantId", "regels"])) : "BESTAAT NIET (verwijderd)"); }
  for (const c of ["akkoord", "aanvragen"]) {
    const q = (await db.collection(c).get()).docs.map(d => ({ id: d.id, ...d.data() }));
    q.filter(x => ids.has(x.klantId) || /001813|jutte/i.test(JSON.stringify(x).slice(0, 4000))).forEach(x => console.log(c.toUpperCase(), x.id, "velden:", Object.keys(x).sort().join(","), zonder(pick(x, ["klantId", "nummer", "factuurId", "offerteId", "status", "op", "verwerkt", "soort", "bron", "ref"]))));
  }
  const b = (await db.collection("berichten").where("klantId", "in", [...ids].slice(0, 10)).get()).docs.map(d => d.data());
  b.sort((a, c) => String(a.op).localeCompare(String(c.op))).forEach(m => console.log("BERICHT", String(m.op).slice(0, 16), m.kanaal, m.sjabloon || "", "|", String(m.onderwerp || "").slice(0, 90), "| ref", m.ref || ""));
})().catch(x => { console.error(x); process.exit(1); });
