/* Alleen lezen: welke bedrijven bestaan er en hebben ze klanten/portaalbezoek. Geen namen. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const bs = await db.collection("bedrijven").get(); const out = [];
  for (const d of bs.docs) { const ks = await db.collection("bedrijven/" + d.id + "/klanten").get(); out.push({ id: d.id, status: d.data().status || "", plan: d.data().plan || d.data().abonnement || "", klanten: ks.size, portaal: ks.docs.filter(k => k.data().portaalLaatst).length, aangemaakt: String(d.data().aangemaakt || d.data().op || "").slice(0, 10) }); }
  n("bedrijven", out);
})().catch(x => { console.error(x); process.exit(1); });
