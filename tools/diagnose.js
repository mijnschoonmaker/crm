/* Alleen lezen: boekhouder-instellingen Mansard. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x));
(async () => { const b = (await db.doc("instellingen/bedrijf").get()).data() || {}; n("bh", { bhMansardOmzet: b.bhMansardOmzet ?? null, bhMansardDagboek: b.bhMansardDagboek ?? null, bhVerkoopboek: b.bhVerkoopboek ?? null }); })().catch(x => { console.error(x); process.exit(1); });
