/* Alleen lezen: kijkt of SEPA-incasso (directdebit) actief is op het Mollie-profiel van Mansard (abonnementen). Wijzigt niets, toont geen sleutel. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const pl = (await db.doc("platform/geheim").get()).data() || {}, g = (await db.doc("geheim/config").get()).data() || {};
  const k = pl.mansardMollieKey || g.mansardMollieKey;
  if (!k) { console.log("::notice title=SEPA::Geen Mansard-Mollie-sleutel gevonden"); return; }
  const modus = String(k).startsWith("live_") ? "live" : String(k).startsWith("test_") ? "test" : "onbekend";
  const get = async p => { const r = await fetch("https://api.mollie.com/v2/" + p, { headers: { authorization: "Bearer " + k } }); return { ok: r.ok, s: r.status, j: await r.json().catch(() => ({})) }; };
  const alle = await get("methods?locale=nl_NL&includeWallets=applepay"), rec = await get("methods?sequenceType=recurring"), first = await get("methods?sequenceType=first");
  const ids = x => ((x.j._embedded || {}).methods || []).map(m => m.id).join(", ") || ("fout " + x.s);
  const regels = ["Sleutel: " + modus, "Actieve methoden: " + ids(alle), "Eerste betaling (machtiging): " + ids(first), "Terugkerend (maandelijkse afschrijving): " + ids(rec)];
  regels.forEach(t => console.log("::notice title=SEPA::" + t));
})().catch(x => { console.error(x.message); process.exit(1); });
