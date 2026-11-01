/* Alleen lezen: Hans Miedema, factuur en ramenRegel. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const all = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const h = all.find(k => String(k.klantnr) === "382309" && !k.hoofdKlantId);
  n("rr", h.ramenRegel); n("k", { prijs: h.prijs, binnen: h.binnen, duur: h.duur, toeslag: h.toeslag, log: (h.log || []).slice(-8) });
  const fs = (await db.collection("facturen").where("klantId", "==", h.id).get()).docs.map(d => ({ id: d.id, ...d.data() }));
  n("facturen", fs.map(f => ({ nr: f.nummer, datum: f.datum, status: f.status, incl: f.incl, btw: f.btw, regels: f.regels })));
  const bs = (await db.collection("beurten").where("klantId", "==", h.id).get()).docs.map(d => d.data());
  n("beurten", bs.map(b => ({ d: b.datum, bedrag: b.bedrag, dienst: b.dienst })));
})().catch(x => { console.error(x); process.exit(1); });
