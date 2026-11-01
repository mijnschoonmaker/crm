/* Alleen lezen: wie heeft afmeldMail aan, en is het sjabloon afkondiging ooit gebruikt. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.map(d => d.data());
  n("afmeldMail", { aan: ks.filter(k => k.afmeldMail).length, totaal: ks.length });
  const bs = (await db.collection("berichten").get()).docs.map(d => d.data());
  const per = {}; bs.forEach(b => { const s = String(b.sjabloon || (String(b.ref || "").split(":")[0]) || "?"); per[s] = (per[s] || 0) + 1 });
  n("berichten per sjabloon", per);
})().catch(x => { console.error(x); process.exit(1); });
