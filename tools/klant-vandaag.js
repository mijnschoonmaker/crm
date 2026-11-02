/* Alleen lezen: waarom ziet een klant (op klantnummer) vandaag wel/geen live-status en welke prijs staat er. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
const dag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
(async () => {
  const nr = String(process.env.NR || "").trim();
  const all = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const ks = all.filter(k => String(k.klantnr || "") === nr);
  console.log("dag", dag, "klanten met nr", nr, ks.length);
  for (const k of ks) console.log("KLANT", k.id, JSON.stringify(pick(k, ["naam", "dienst", "prijs", "frequentie", "gepland", "tijd", "laatst", "actief", "bezig", "hoofdKlantId", "opdrachtId", "periodiek", "prospect", "binnen", "reeks"])), "opdrachten:", JSON.stringify((k.opdrachten || []).map(o => pick(o, ["nr", "dienst", "prijs", "frequentie", "actief", "objectId"]))));
  const [ls, rd, bs] = await Promise.all([db.doc("live/rit").get(), db.doc("routes/" + dag).get(), db.collection("beurten").where("datum", "==", dag).get()]);
  const L = ls.exists ? ls.data() : null;
  console.log("LIVE/RIT", JSON.stringify(pick(L, ["actief", "datum", "ts", "naam", "nauw"])), "leeftijd min", L && L.ts ? Math.round((Date.now() - Date.parse(L.ts)) / 60e3) : "-");
  const lq = await db.collection("live").where("datum", "==", dag).get();
  lq.docs.forEach(d => console.log("LIVE", d.id, JSON.stringify(pick(d.data(), ["actief", "ts", "naam"]))));
  const r = rd.exists ? rd.data() : {};
  console.log("ROUTE wie:", JSON.stringify(Object.fromEntries(Object.entries(r.wie || {}).map(([id, w]) => [(all.find(x => x.id === id) || {}).klantnr || id, w]))), "order:", JSON.stringify((r.order || []).map(id => (all.find(x => x.id === id) || {}).klantnr || id)));
  console.log("BEURTEN vandaag:", JSON.stringify(bs.docs.map(d => { const b = d.data(); return [(all.find(x => x.id === b.klantId) || {}).klantnr || b.klantId, b.door || b.medewerker || ""]; })));
  const gepl = all.filter(x => x.gepland === dag && x.actief !== false);
  console.log("GEPLAND vandaag:", JSON.stringify(gepl.map(x => [x.klantnr, x.tijd || "", x.bezig ? "bezig" : ""])));
})().catch(x => { console.error(x); process.exit(1); });
