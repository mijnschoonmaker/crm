/* Eenmalig (op verzoek van Robin): een VvE-taak hernoemen bij één klant: checklist, frequentie en de taken op eerdere beurten.
   UITVOEREN=ja voert uit; anders alleen kijken. */
const path = require("path"), admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.P });
const db = admin.firestore(), Q = String(process.env.KLANT || "").toLowerCase(), VAN = process.env.VAN, NAAR = process.env.NAAR, DOE = process.env.UITVOEREN === "ja";
const n = (...a) => console.log("::notice title=Hernoemen::" + a.join(" "));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => String(d.data().naam || "").toLowerCase().includes(Q));
  if (ks.length !== 1) { n("niet precies 1 klant:", ks.map(d => d.data().naam).join(", ") || "geen"); return }
  const kd = ks[0], k = kd.data(), st = ((await db.doc("instellingen/bedrijf").get()).data() || {});
  const lijst = Array.isArray(k.vveTaken) && k.vveTaken.length ? k.vveTaken : Array.isArray(st.vveTakenStd) && st.vveTakenStd.length ? st.vveTakenStd : ["Entree en deuren", "Trappenhuis", "Lift", "Bergingsgang"];
  n(k.naam, "· checklist:", lijst.join(", "), Array.isArray(k.vveTaken) && k.vveTaken.length ? "(eigen)" : "(standaard)", "· freq:", JSON.stringify(k.vveFreq || {}));
  if (!lijst.includes(VAN)) { n(VAN, "staat niet in de checklist; niets gedaan"); return }
  const bs = (await db.collection("beurten").where("klantId", "==", kd.id).get()).docs.filter(d => (d.data().taken || []).some(t => t && t.naam === VAN));
  n("beurten met", VAN + ":", bs.map(d => d.data().datum).join(", ") || "geen", DOE ? "" : "(alleen gekeken)");
  if (!DOE) return;
  const b = db.batch(), upd = { vveTaken: lijst.map(t => t === VAN ? NAAR : t) };
  if (k.vveFreq && typeof k.vveFreq === "object" && VAN in k.vveFreq) { const f = { ...k.vveFreq }; f[NAAR] = f[VAN]; delete f[VAN]; upd.vveFreq = f }
  b.set(kd.ref, upd, { merge: true });
  bs.forEach(d => b.set(d.ref, { taken: d.data().taken.map(t => t && t.naam === VAN ? { ...t, naam: NAAR } : t) }, { merge: true }));
  await b.commit(); n("klaar:", upd.vveTaken.join(", "), "·", bs.length, "beurt(en) bijgewerkt");
})().catch(e => { console.error(e); process.exit(1) });
