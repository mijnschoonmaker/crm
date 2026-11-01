/* Alleen lezen: snelbetaal-credits en facturen per maand. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.map(d => d.data());
  const per = {};
  ks.forEach(k => [...(k.tegoed || []), ...(k.tegoedGebruikt || [])].forEach(t => { if (t && t.bron === "snel") { const m = String(t.op || "").slice(0, 7); per[m] = per[m] || { n: 0, som: 0 }; per[m].n++; per[m].som += Number(t.bedrag) || 0; } }));
  const fs = (await db.collection("facturen").get()).docs.map(d => d.data()).filter(f => f.soort !== "offerte");
  const fm = {}; fs.forEach(f => { const m = String(f.datum || "").slice(0, 7); if (m < "2026-06") return; fm[m] = fm[m] || { facturen: 0, betaald: 0, incasso: 0 }; fm[m].facturen++; if (f.status === "betaald") fm[m].betaald++; if (f.incasso || f.betaalwijze === "incasso") fm[m].incasso++; });
  n("snel", per); n("facturen", fm); n("klanten", { actief: ks.filter(k => k.actief !== false && !k.prospect && !k.hoofdKlantId).length });
})().catch(x => { console.error(x); process.exit(1); });
