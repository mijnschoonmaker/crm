/* Eenmalig, goedgekeurd door Robin (3 nov 2026): 3 klanten die per ongeluk via "Alles op aanboddatum" op 3 nov stonden, weer op Te plannen. Alleen als de datum nog 2026-11-03 is. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const IDS = ["kmvt69zfjiagg", "kmvt6po6ih1nv", "kmvwvymr4xyx3"];
(async () => {
  for (const id of IDS) { const r = db.doc("klanten/" + id), s = await r.get(); const d = s.data() || {};
    if (d.gepland !== "2026-11-03") { console.log("OVERGESLAGEN", id, d.naam, "gepland is nu", d.gepland || "-"); continue; }
    await r.set({ gepland: "" }, { merge: true }); console.log("TERUG", id, d.naam, d.adres, d.plaats); }
})().catch(x => { console.error(x); process.exit(1); });
