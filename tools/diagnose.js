/* Alleen lezen: status van de Mollie-betalingen van Beerlings (GET, sleutel wordt niet getoond). Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3500));
(async () => {
  const key = ((await db.doc("geheim/config").get()).data() || {}).mollieKey;
  n("sleutel", { aanwezig: !!key, soort: String(key || "").slice(0, 5) });
  for (const id of ["tr_B7DCEcfmdwHY8HNWMxrYJ", "tr_NNXfWUJp3B7GgDx2BTsYJ"]) {
    const r = await fetch("https://api.mollie.com/v2/payments/" + id, { headers: { authorization: "Bearer " + key } }); const p = await r.json();
    n(id, { http: r.status, status: p.status, method: p.method, mode: p.mode, amount: p.amount, created: p.createdAt, expires: p.expiresAt, paidAt: p.paidAt, canceled: p.canceledAt, failed: p.failedAt, details: p.details, redirect: p.redirectUrl, webhook: String(p.webhookUrl || "").replace(/[?].*/, "?…"), checkout: !!(p._links && p._links.checkout), err: p.detail || "" });
  }
  const pr = await fetch("https://api.mollie.com/v2/methods", { headers: { authorization: "Bearer " + key } }); const m = await pr.json();
  n("methodes", { http: pr.status, ids: ((m._embedded || {}).methods || []).map(x => x.id), err: m.detail || "" });
})().catch(x => { console.error(x); process.exit(1); });
