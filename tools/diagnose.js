/* Alleen lezen: klant 8147, locaties en uitvoerlocaties. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3500));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => String(d.data().klantnr) === "8147" || /rondweg 5\b/i.test(String(d.data().adres || "")));
  for (const d of ks) { const k = d.data();
    n("klant " + d.id, { naam: k.naam, adres: k.adres, objectId: k.objectId === undefined ? "(geen)" : k.objectId, objecten: (k.objecten || []).map(o => ({ id: o.id, naam: o.naam, adres: o.adres })), opdrachten: (k.opdrachten || []).map(o => ({ id: o.id, nr: o.nr, dienst: o.dienst, objectId: o.objectId, apart: o.apart, bij: o.bij })), log: (k.log || []).slice(-6) }); }
})().catch(x => { console.error(x); process.exit(1); });
