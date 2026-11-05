/* Eenmalig (op verzoek van Robin): de betaaltijd van één factuur voor de ranglijst vastzetten (in seconden).
   De echte betaaldatum en -tijd blijven ongewijzigd. UITVOEREN=ja voert uit. */
const path = require("path"), admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.P });
const db = admin.firestore(), NR = String(process.env.NR || ""), SEC = parseInt(process.env.SEC, 10), DOE = process.env.UITVOEREN === "ja";
const n = (...a) => console.log("::notice title=Betaaltijd::" + a.join(" "));
(async () => {
  const q = (await db.collection("facturen").where("nummer", "==", NR).get()).docs;
  if (q.length !== 1 || !(SEC >= 0)) { n("niet precies 1 factuur of geen geldige tijd"); return }
  const f = q[0].data(); n(NR, f.klantNaam, "status", f.status, "betaaldTs", f.betaaldTs || "", "nu vast:", f.betaalSecVast ?? "-", "wordt", SEC, "sec", DOE ? "" : "(alleen gekeken)");
  if (f.status !== "betaald") { n("niet betaald; niets gedaan"); return }
  if (DOE) { await q[0].ref.set({ betaalSecVast: SEC }, { merge: true }); n("klaar") }
})().catch(e => { console.error(e); process.exit(1) });
