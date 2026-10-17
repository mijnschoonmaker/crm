/* Factuurnummering instellen: doorlopend (26-009379) vanaf het opgegeven volgnummer. Gestart via Actions › "Factuurnummer instellen". */
const path = require("path"), admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.P });
const n = parseInt(process.env.START, 10);
(async () => {
  if (!(n > 0)) throw new Error("Geen geldig volgnummer");
  await admin.firestore().doc("instellingen/bedrijf").set({ factNrStijl: "doorlopend", factNrStart: n }, { merge: true });
  const d = (await admin.firestore().doc("instellingen/bedrijf").get()).data();
  console.log(`::notice title=Factuurnummer::Stijl ${d.factNrStijl}, eerste volgnummer ${d.factNrStart}`);
})().catch(e => { console.error(e); process.exit(1); });
