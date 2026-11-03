/* Alleen lezen: staat de automatische dagherinnering aan en welke mails staan ingepland. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const s = (await db.doc("instellingen/bedrijf").get()).data() || {};
  console.log("INST", JSON.stringify(Object.fromEntries(["liveMail", "dagAan", "dagAutoMail", "dagVast", "dagTijd", "dagDagen"].map(k => [k, s[k]]))));
  const q = await db.collection("geplandeMails").orderBy("gemaakt", "desc").limit(15).get();
  q.docs.forEach(d => { const m = d.data(); console.log("GEPLAND", d.id, m.status, m.sendAt, m.door || "", (m.meta || {}).sjabloon || "", String(m.naam || "").slice(0, 12), "gemaakt", m.gemaakt || "", m.fout || ""); });
  const z = String(process.env.ZOEK || "").toLowerCase();
  if (z) { const ks = (await db.collection("klanten").get()).docs.filter(d => String(d.data().adres || "").toLowerCase().includes(z));
    for (const kd of ks) { const k = kd.data(); console.log("KLANT", kd.id, k.adres, k.plaats, "gepland", k.gepland, "tijd", k.tijd || "-");
      const g = await db.collection("geplandeMails").where("dagCheck.klantId", "==", kd.id).get();
      g.docs.forEach(d => { const m = d.data(), t = String(m.tekst || "").match(/Tijd[^\n]{0,40}/i); console.log("  MAIL", d.id, m.status, m.sendAt, "gemaakt", m.gemaakt, "|", t ? t[0] : "(geen tijdregel)"); }); } }
})().catch(x => { console.error(x); process.exit(1); });
