/* Eenmalig (op verzoek van Robin): een VvE-taak hernoemen bij de klant(en) die bij de zoekterm horen: checklist, frequentie en
   de taken op eerdere beurten. UITVOEREN=ja voert uit; anders alleen kijken. */
const path = require("path"), admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.P });
const db = admin.firestore(), Q = String(process.env.KLANT || "").toLowerCase(), VAN = process.env.VAN, NAAR = process.env.NAAR, DOE = process.env.UITVOEREN === "ja";
const n = (...a) => console.log("::notice title=Hernoemen::" + a.join(" "));
(async () => {
  const st = ((await db.doc("instellingen/bedrijf").get()).data() || {});
  const std = Array.isArray(st.vveTakenStd) && st.vveTakenStd.length ? st.vveTakenStd : ["Entree en deuren", "Trappenhuis", "Lift", "Bergingsgang"];
  const ks = (await db.collection("klanten").get()).docs.filter(d => JSON.stringify([d.data().naam, d.data().contact, d.data().bedrijfsnaam, d.data().achternaam, d.data().adres]).toLowerCase().includes(Q));
  if (!ks.length || ks.length > 6) { n("klanten gevonden:", ks.length, "; niets gedaan"); return }
  const b = db.batch(); let tel = 0;
  for (const kd of ks) {
    const k = kd.data(), eigen = Array.isArray(k.vveTaken) && k.vveTaken.length, lijst = eigen ? k.vveTaken : std;
    const bs = (await db.collection("beurten").where("klantId", "==", kd.id).get()).docs.filter(d => (d.data().taken || []).some(t => t && t.naam === VAN));
    n(k.naam, "·", k.adres || "", "· actief", k.actief !== false, "· checklist:", lijst.join(", "), eigen ? "(eigen)" : "(standaard)", "· beurten met", VAN + ":", bs.map(d => d.data().datum).join(", ") || "geen");
    if (!lijst.includes(VAN) && !bs.length) continue;
    tel++;
    const upd = { vveTaken: lijst.map(t => t === VAN ? NAAR : t) };
    if (k.vveFreq && typeof k.vveFreq === "object" && VAN in k.vveFreq) { const f = { ...k.vveFreq }; f[NAAR] = f[VAN]; delete f[VAN]; upd.vveFreq = f }
    if (eigen && lijst.includes(VAN)) b.set(kd.ref, upd, { merge: true });
    bs.forEach(d => b.set(d.ref, { taken: d.data().taken.map(t => t && t.naam === VAN ? { ...t, naam: NAAR } : t) }, { merge: true }));
  }
  if (!DOE) { n("aan te passen:", tel, "klant(en) (alleen gekeken)"); return }
  await b.commit(); n("klaar:", tel, "klant(en) bijgewerkt");
})().catch(e => { console.error(e); process.exit(1) });
