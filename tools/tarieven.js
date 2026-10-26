/* Alleen lezen: toont de tarieven van de rekentool (instellingen/ramen) en de frequentie-instellingen. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const r = (await db.doc("instellingen/ramen").get()).data() || {};
  const b = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const keep = Object.fromEntries(Object.entries(r).filter(([k]) => /_p$|^start$|^min$|^tiers$|^tb$|^wg$|^fp$/.test(k)));
  const uit = ["RAMEN " + JSON.stringify(keep), "BTW " + JSON.stringify(b.btw), "FREQCALC " + JSON.stringify(b.freqCalc || {})];
  uit.forEach((t, i) => console.log("::notice title=Tarieven " + (i + 1) + "::" + t));
})().catch(x => { console.error(x); process.exit(1); });
