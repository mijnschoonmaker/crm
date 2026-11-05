/* Alleen lezen: betaaltijden per factuur van klanten die bij de zoekterm horen (voor de ranglijst). Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore(), Z = String(process.env.ZOEK || "").toLowerCase().split("|");
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => Z.some(z => z && String(d.data().naam || "").toLowerCase().includes(z)));
  for (const kd of ks) { const fs = (await db.collection("facturen").where("klantId", "==", kd.id).get()).docs.map(d => d.data()).filter(f => f.datum >= "2026-10-01");
    console.log("KLANT", kd.data().naam, kd.id);
    fs.forEach(f => { const van = f.verstuurdOp || f.gemaakt || "", sec = f.betaaldTs && van ? Math.round((Date.parse(f.betaaldTs) - Date.parse(van)) / 1000) : null;
      console.log("  ", f.nummer, f.status, "wijze", f.betaalwijze || "", "methode", f.mollieMethode || "", "verstuurd", f.verstuurdOp || "", "gemaakt", f.gemaakt || "", "betaaldTs", f.betaaldTs || "", "betaaldOp", f.betaaldOp || "", "sec", sec, f.creditVan ? "CREDIT" : "") }) }
})().catch(x => { console.error(x); process.exit(1) });
