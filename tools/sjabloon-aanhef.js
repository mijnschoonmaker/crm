/* Eenmalig (met akkoord van Robin): in de sjablonen factuur en voorlopig de aanhef "Beste [firstname.user]" vervangen door [firstname.customer].
   Alleen in de aanhef; jouw naam onder de groet blijft staan. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const RE = /((?:^|>|\n)\s*(?:beste|hallo|hoi|geachte|dag|goedemorgen|goedemiddag)\s*(?:<[^>]+>\s*)*)\[firstname\.user\]/gi;
(async () => {
  const ref = db.doc("instellingen/sjablonen"), d = (await ref.get()).data() || {}, patch = {};
  for (const k of ["factuur", "voorlopig"]) { const t = d[k]; if (!t) continue; const n = { ...t };
    for (const f of ["mail", "sms", "onderwerp"]) if (typeof t[f] === "string") n[f] = t[f].replace(RE, "$1[firstname.customer]");
    if (JSON.stringify(n) !== JSON.stringify(t)) { patch[k] = n; console.log("::notice title=Sjabloon::" + k + " aangepast · begint nu met: " + String(n.mail || "").replace(/<[^>]+>/g, " ").trim().slice(0, 80)); }
    else console.log("::notice title=Sjabloon::" + k + " niets te vervangen"); }
  if (Object.keys(patch).length) await ref.set(patch, { merge: true });
})().catch(x => { console.error(x.message); process.exit(1); });
