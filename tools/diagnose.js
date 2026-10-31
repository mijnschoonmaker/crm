/* Alleen lezen: VvE Nijegast woningen (7451) en losse opdrachten. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const all = (await db.collection("klanten").get()).docs;
  const h = all.filter(d => String(d.data().klantnr) === "7451");
  const ids = h.map(d => d.id);
  const fam = all.filter(d => ids.includes(d.id) || ids.includes(d.data().hoofdKlantId));
  for (const d of fam) { const k = d.data();
    n("k " + d.id, { naam: k.naam, hoofd: k.hoofdKlantId || "", nr: k.opdrachtNr || "", soort: k.soort, adres: k.adres, plaats: k.plaats, objectId: k.objectId, objecten: (k.objecten || []).map(o => ({ id: o.id, naam: o.naam, adres: o.adres })), dienst: k.dienst, prijs: k.prijs, freq: k.frequentie, gepland: k.gepland, aanbieden: k.aanbieden, aanbodVanaf: k.aanbodVanaf, startdatum: k.startdatum, uitstelTot: k.uitstelTot, eersteKeer: k.eersteKeer, verw: k.opdrachtVerwijderd, prospect: k.prospect, actief: k.actief,
      opdrachten: (k.opdrachten || []).map(o => ({ id: o.id, nr: o.nr, dienst: o.dienst, prijs: o.prijs, freq: o.frequentie, volgende: o.volgende, objectId: o.objectId, apart: o.apart, bij: o.bij, actief: o.actief, items: (o.items || []).filter(i => Number(i.aantal) > 0).map(i => ({ n: i.naam, a: i.aantal, fq: i.fq, vol: i.vol, btw: i.btw })), tp: o.tp })) }); }
})().catch(x => { console.error(x); process.exit(1); });
