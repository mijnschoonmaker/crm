/* Eén veld in instellingen/bedrijf zetten. Gestart via Actions › "Instelling zetten" (KEY en VAL). */
const path = require("path"), admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.P });
const k = String(process.env.KEY || ""), v = String(process.env.VAL ?? "");
const MAG = ["onderdeelVan", "naam", "website"];
(async () => {
  if (!MAG.includes(k)) throw new Error("Dit veld mag hier niet: " + k);
  await admin.firestore().doc("instellingen/bedrijf").set({ [k]: v }, { merge: true });
  console.log(`::notice title=Instelling::${k} = ${v}`);
})().catch(e => { console.error(e); process.exit(1); });
