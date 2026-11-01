/* Alleen lezen: resultaat maandronde oktober. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const r = await db.doc("ranglijst/2026-10").get();
  n("ranglijst", r.exists ? { prijzen: r.data().prijzen, top: (r.data().top || []).map(x => ({ vn: x.vn, sec: x.sec })) } : "nog niet");
  if (r.exists) for (const x of r.data().top || []) { const k = (await db.doc("klanten/" + x.klantId).get()).data() || {}; n("credits " + x.vn, [...(k.tegoed || [])].filter(t => t.bron === "maandtop").map(t => ({ b: t.bedrag, r: t.reden }))); }
  const m = (await db.collection("berichten").where("sjabloon", "==", "maandtop").get()).docs.map(d => ({ onderwerp: d.data().onderwerp, status: d.data().status }));
  n("mails", m);
})().catch(x => { console.error(x); process.exit(1); });
