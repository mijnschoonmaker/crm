/* Alleen lezen: platform-sleutels gezet en anders dan die van mijnschoonmaker (alleen ja/nee). */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x));
(async () => {
  const pg = (await db.doc("platform/geheim").get()).data() || {}, g = (await db.doc("geheim/config").get()).data() || {};
  n("platform", { mollieGezet: !!pg.mansardMollieKey, live: String(pg.mansardMollieKey || "").startsWith("live_"), andersDanMijnschoonmaker: !!pg.mansardMollieKey && pg.mansardMollieKey !== g.mollieKey, afzender: pg.platformAfzender || "", eigenBrevo: !!pg.platformBrevoKey });
  if (pg.mansardMollieKey) { try { const r = await fetch("https://api.mollie.com/v2/methods?sequenceType=first", { headers: { authorization: "Bearer " + pg.mansardMollieKey } }); const j = await r.json(); n("mollie", { ok: r.ok, methoden: (j._embedded && j._embedded.methods || []).map(m => m.id) }); } catch (e) { n("mollie", { fout: e.message }); } }
  if (pg.mansardMollieKey) { try { const r = await fetch("https://api.mollie.com/v2/methods?sequenceType=recurring", { headers: { authorization: "Bearer " + pg.mansardMollieKey } }); const j = await r.json(); n("mollie recurring", { ok: r.ok, methoden: (j._embedded && j._embedded.methods || []).map(m => m.id) }); } catch (e) { n("mollie", { fout: e.message }); } }
})().catch(x => { console.error(x); process.exit(1); });
