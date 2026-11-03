/* Alleen lezen: is na een online handtekening het definitieve bestellingsoverzicht verstuurd? Toont geen e-mailadressen. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore(), NR = String(process.env.NR || "");
const n = (...a) => console.log("::notice title=Akkoord::" + a.join(" "));
(async () => {
  const q = await db.collection("akkoord").where("nummer", "==", NR).get();
  n("akkoord-docs:", q.size);
  for (const d of q.docs) { const a = d.data();
    n("status", a.status, "· email aanwezig:", a.email ? "ja" : "NEE", "· klantId:", a.klantId ? "ja" : "nee", "· factuurId:", a.factuurId ? "ja" : "nee", "· getekend op:", (a.getekend || {}).op || "-", "· gemaakt:", a.gemaakt || "-");
    const b = await db.collection("berichten").where("factuurId", "==", a.factuurId || "x").get();
    b.docs.map(x => x.data()).forEach(m => n("bericht:", m.sjabloon, "·", m.status, "·", m.op, "·", (m.onderwerp || "").slice(0, 70)));
    if (a.klantId) { const k = await db.collection("berichten").where("klantId", "==", a.klantId).get(); n("berichten bij klant:", k.size, k.docs.map(x => x.data().sjabloon + "@" + String(x.data().op).slice(11, 16)).join(", ")); }
  }
})().catch(x => { console.error(x.message); process.exit(1); });
