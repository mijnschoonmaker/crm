/* Alleen lezen: toont de ruwe tekst/opmaak van een sjabloon (geen klantgegevens). Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => { const s = (await db.doc("instellingen/sjablonen").get()).data() || {}; const k = process.env.SJ || "aankondiging";
  const t = s[k] || {}; console.log("SLEUTELS", Object.keys(t).join(","));
  for (const f of ["mail", "tekst", "mailHtml"]) if (t[f]) console.log("VELD " + f + ":\n" + JSON.stringify(String(t[f])).slice(0, 4000)); })().catch(x => { console.error(x); process.exit(1); });
