/* Alleen lezen: staat de automatische dagherinnering aan en welke mails staan ingepland. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const s = (await db.doc("instellingen/bedrijf").get()).data() || {};
  console.log("INST", JSON.stringify(Object.fromEntries(["liveMail", "dagAan", "dagAutoMail", "dagVast", "dagTijd", "dagDagen"].map(k => [k, s[k]]))));
  const q = await db.collection("geplandeMails").orderBy("gemaakt", "desc").limit(15).get();
  q.docs.forEach(d => { const m = d.data(); console.log("GEPLAND", d.id, m.status, m.sendAt, m.door || "", (m.meta || {}).sjabloon || "", String(m.naam || "").slice(0, 12), m.fout || ""); });
})().catch(x => { console.error(x); process.exit(1); });
