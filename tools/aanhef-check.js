/* Alleen lezen: welke sjablonen gebruiken [firstname.user] (de naam van de afzender) en hoeveel verstuurde mails begonnen met de naam van de afzender? */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (...a) => console.log("::notice title=Aanhef::" + a.join(" "));
(async () => {
  const sj = (await db.doc("instellingen/sjablonen").get()).data() || {};
  const hit = Object.entries(sj).filter(([k, v]) => /firstname\.user/.test(JSON.stringify(v))).map(([k, v]) => k + " (" + String(v.naam || "") + ")");
  n("sjablonen met [firstname.user]:", hit.join(", ") || "geen");
  const b = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const vn = String(b.voornaam || "robin").toLowerCase();
  const q = await db.collection("berichten").where("op", ">=", "2026-09-01").get();
  const L = q.docs.map(d => d.data()).filter(m => m.kanaal === "email" && new RegExp("^\\s*(beste|hallo|hoi|geachte)\\s+" + vn + "\\b", "i").test(String(m.tekst || "").replace(/<[^>]+>/g, "")));
  const per = {}; L.forEach(m => { const k = String(m.sjabloon || "?") + " " + String(m.op || "").slice(0, 10); per[k] = (per[k] || 0) + 1 });
  n("verstuurde mails die met 'Beste " + vn + "' beginnen:", L.length, "·", Object.entries(per).sort().map(([k, v]) => k + ": " + v).join(" | ").slice(0, 2500));
})().catch(x => { console.error(x.message); process.exit(1); });
