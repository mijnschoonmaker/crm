/* Alleen lezen: facturen van Swart. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => /swart/i.test(String(d.data().naam || "")));
  for (const d of ks) { const k = d.data();
    const fs = (await db.collection("facturen").where("klantId", "==", d.id).get()).docs.map(x => { const f = x.data(); return { id: x.id, nr: f.nummer, soort: f.soort, status: f.status, datum: f.datum, verstuurdOp: f.verstuurdOp || "", verstuurdTs: f.verstuurdTs || "", incasso: !!f.incasso, mollieStatus: f.mollieStatus || "", periodiek: !!f.periodiek, keys: Object.keys(f).filter(a => /verstu|mail|send|incasso|bron|via/i.test(a)) }; });
    const ms = (await db.collection("berichten").where("klantId", "==", d.id).get().catch(() => ({ docs: [] }))).docs.map(x => ({ op: x.data().op || x.data().datum, ref: x.data().ref, onderwerp: x.data().onderwerp, status: x.data().status }));
    n("klant " + d.id, { naam: k.naam, email: k.email, fEmail: k.fEmail, incasso: k.incasso, fact: fs, berichten: ms.slice(-8) }); }
})().catch(x => { console.error(x); process.exit(1); });
