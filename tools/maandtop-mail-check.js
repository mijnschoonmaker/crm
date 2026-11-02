/* Alleen lezen: vraagt bij Brevo op wat er met de felicitatiemails (snelste betalers) is gebeurd. Wijzigt niets; toont alleen voornamen. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const g = (await db.doc("geheim/config").get()).data() || {};
  const q = await db.collection("berichten").where("sjabloon", "==", "maandtop").get();
  for (const d of q.docs) { const m = d.data(), vn = String(m.klantNaam || "?").split(/[ ,]/).filter(Boolean).pop();
    const r = await fetch("https://api.brevo.com/v3/smtp/statistics/events?limit=50&days=30&email=" + encodeURIComponent(m.naar || ""), { headers: { "api-key": g.brevoKey, accept: "application/json" } });
    const j = await r.json().catch(() => ({}));
    const ev = (j.events || []).filter(e => /snelste|plek|beker|betaler/i.test(String(e.subject || "")) || String(e.date || "").startsWith("2026-11-01"));
    console.log("::notice title=Felicitatie::" + vn + " (" + String(m.verstuurdOp || "").slice(0, 16) + "): " + (ev.length ? ev.map(e => e.event + " " + String(e.date || "").slice(0, 16) + (e.reason ? " (" + e.reason + ")" : "")).join(", ") : "geen gebeurtenissen bij Brevo (status " + r.status + ")"));
  }
})().catch(x => { console.error(x.message); process.exit(1); });
