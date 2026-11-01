/* Alleen lezen: klanten met prijs 0 terwijl ze glasbewassing hebben. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const all = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const nul = all.filter(k => k.actief !== false && !k.prospect && !k.hoofdKlantId && !k.opdrachtVerwijderd && !(Number(k.prijs) > 0));
  n("aantal actief", all.filter(k => k.actief !== false && !k.hoofdKlantId).length);
  n("prijs 0", nul.length);
  const h = all.find(k => /miedema/i.test(k.naam || "") && String(k.klantnr) === "382309");
  if (h) n("miedema", { prijs: h.prijs, dienst: h.dienst, freq: h.frequentie, rr: h.ramenRegel ? { keys: Object.keys(h.ramenRegel), prijs: h.ramenRegel.prijs, tot: h.ramenRegel.totaal, p: h.ramenRegel.p, f: h.ramenRegel.f, fq: h.ramenRegel.fq } : null, tp: h.tp, periodiek: !!h.periodiek, keys: Object.keys(h).filter(x => /prijs|bedrag|tarief/i.test(x)) });
  n("voorbeelden", nul.slice(0, 25).map(k => ({ nr: k.klantnr, naam: k.naam, dienst: k.dienst, rr: !!k.ramenRegel, rrP: k.ramenRegel && (k.ramenRegel.prijs ?? k.ramenRegel.totaal), soort: k.soort })));
  const fs = (await db.collection("facturen").get()).docs.map(d => d.data()).filter(f => f.soort !== "offerte");
  const laatst = {}; fs.forEach(f => { if (!laatst[f.klantId] || String(f.datum) > String(laatst[f.klantId].datum)) laatst[f.klantId] = f; });
  n("met factuur", nul.filter(k => laatst[k.id]).length);
})().catch(x => { console.error(x); process.exit(1); });
