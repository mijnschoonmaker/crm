/* Alleen lezen: welke platform-instellingen zijn gezet (alleen ja/nee, geen waarden). */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  for (const p of ["platform/geheim", "platform/config", "platform/instellingen", "geheim/config"]) {
    const d = await db.doc(p).get(); const v = d.exists ? d.data() : null;
    n(p, v ? Object.fromEntries(Object.keys(v).filter(k => /mollie|afzender|brevo|hook/i.test(k)).map(k => [k, !!v[k]])) : "bestaat niet");
  }
  const pg = (await db.doc("platform/geheim").get()).data() || {}, g = (await db.doc("geheim/config").get()).data() || {};
  n("zelfde mollie", { mansardKeyGelijkAanEigen: !!pg.mansardMollieKey && pg.mansardMollieKey === g.mollieKey, mansardKeyTest: String(pg.mansardMollieKey || "").startsWith("test_") });
  n("zelfde afzender", { platformAfzenderGelijkAanEigen: !!pg.platformAfzender && pg.platformAfzender === g.afzender, platformAfzenderDomein: String(pg.platformAfzender || pg.afzender || "").split("@")[1] || "" });
})().catch(x => { console.error(x); process.exit(1); });
