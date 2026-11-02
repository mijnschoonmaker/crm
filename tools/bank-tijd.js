/* Alleen lezen: banktransacties van de laatste dagen en de tijden van de gekoppelde facturen. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const sinds = new Date(Date.now() - 4 * 864e5).toISOString().slice(0, 10);
  const q = await db.collection("banktx").where("datum", ">=", sinds).get();
  for (const d of q.docs.map(x => x.data()).sort((a, b) => String(a.op).localeCompare(String(b.op)))) {
    console.log("TX", d.datum, "bedrag", d.bedrag, "status", d.status, "op", d.op, "bron", d.bron, "nrs", (d.nummers || []).join(","), "reden", d.reden, "naam~", String(d.naam || "").slice(0, 14));
    for (const fid of d.factuurIds || []) { const f = (await db.doc("facturen/" + fid).get()).data() || {};
      console.log("   FACTUUR", f.nummer, "status", f.status, "verstuurdOp", f.verstuurdOp, "verstuurdTs", f.verstuurdTs, "gemaakt", f.gemaakt, "betaaldOp", f.betaaldOp, "betaaldTs", f.betaaldTs, "wijze", f.betaalwijze);
      (f.log || []).slice(-5).forEach(l => console.log("      log", l.datum, String(l.tekst || "").slice(0, 90))); }
  }
  const fs = await db.collection("facturen").where("betaaldOp", ">=", sinds).get();
  for (const x of fs.docs) { const f = x.data(); const k = f.klantId ? ((await db.doc("klanten/" + f.klantId).get()).data() || {}) : {};
    const arr = v => Array.isArray(v) ? v : v && v.__arr ? v.__arr : [];
    const cr = [...arr(k.tegoed), ...arr(k.tegoedGebruikt)].filter(t => t && t.bron === "snel" && String(t.ref) === x.id).map(t => t.bedrag + " op " + t.op);
    console.log("BETAALD", f.nummer, f.betaaldOp, f.betaaldTs, f.betaalwijze, "verstuurd", f.verstuurdTs || f.verstuurdOp, "naam~", String(f.klantNaam || "").slice(0, 14), "snelcredit:", cr.join(" | ") || "GEEN"); }
})().catch(x => { console.error(x); process.exit(1); });
