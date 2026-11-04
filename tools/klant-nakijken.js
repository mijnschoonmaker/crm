/* Alleen lezen: toont de prijsvelden van klanten/opdrachten waarvan het adres de zoekterm bevat. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
const K = ["naam", "soort", "bedrijfsnaam", "contact", "voornaam", "achternaam", "klantnr", "adres", "plaats", "dienst", "prijs", "btw", "btwPct", "incl", "duur", "frequentie", "gepland", "hoofdKlantId", "opdrachtId", "opdrachtNr", "actief", "prijsIncl", "prijsEx", "toeslag", "objectId", "vve", "type"];
(async () => {
  const z = String(process.env.ZOEK || "").toLowerCase().trim();
  const ins = (await db.doc("instellingen/bedrijf").get()).data() || {};
  console.log("INSTELLING", JSON.stringify(pick(ins, ["incl", "toonEx", "btw", "btwLaag"])));
  const all = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const hit = all.filter(k => JSON.stringify([k.adres, k.naam, (k.objecten || []).map(o => o.adres)]).toLowerCase().includes(z));
  for (const k of hit) {
    console.log("KLANT " + k.id, JSON.stringify(pick(k, K)));
    const ex = Object.keys(k).filter(x => /btw|prijs|incl|tarief/i.test(x));
    console.log("  prijs/btw-velden:", JSON.stringify(pick(k, ex)));
    (k.opdrachten || []).forEach(o => console.log("  OPDRACHT", JSON.stringify(pick(o, ["id", "nr", "dienst", "prijs", "btw", "btwPct", "frequentie", "actief", "objectId", "groep"])), "items:", JSON.stringify((o.items || []).map(i => pick(i, ["naam", "aantal", "prijs", "op", "btw"])))));
  }
  const fs = await db.collection("facturen").orderBy("datum", "desc").limit(400).get();
  fs.docs.map(d => d.data()).filter(f => hit.some(k => k.id === f.klantId)).slice(0, 4).forEach(f => console.log("FACTUUR", f.nummer, f.datum, JSON.stringify((f.regels || []).map(r => pick(r, ["omschrijving", "aantal", "prijs", "btw"]))), "incl:", f.incl));
})().catch(x => { console.error(x); process.exit(1); });
