/* Alleen lezen: diensten in Uitvoering en waar 'gevelelementen' gebruikt wordt. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3000));
(async () => {
  const u = (await db.doc("instellingen/uitvoering").get()).data() || {};
  n("groepen", (u.groepen || []).map(g => [g.id, g.naam, g.type || "", g.verberg ? "VERBORGEN" : "", (g.items || []).length]));
  n("eigen", (u.eigen || []).map(g => [g.id, g.naam, g.type || "", g.verberg ? "VERBORGEN" : "", (g.items || []).map(i => i.naam + " " + i.prijs)]));
  const re = /gevelelement/i; let k = 0, ex = [];
  for (const c of ["klanten", "opdrachten", "facturen", "beurten"]) {
    let hit = 0; const s = await db.collection(c).get().catch(() => ({ docs: [] }));
    for (const d of s.docs) { const j = JSON.stringify(d.data()); if (re.test(j)) { hit++; if (ex.length < 12) ex.push(c + ":" + d.id + ":" + (j.match(/.{0,60}gevelelement.{0,60}/i) || [""])[0]); } }
    n("gebruik " + c, hit);
  }
  n("voorbeelden", ex);
})().catch(x => { console.error(x); process.exit(1); });
