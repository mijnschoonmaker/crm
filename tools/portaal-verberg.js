/* Op verzoek van Robin: beurten van een klant in één maand niet meer tonen in het klantportaal en op het bewonersbord
   (de beurt zelf blijft in het CRM, voor omzet en historie). UITVOEREN=ja voert uit; anders alleen kijken. */
const path = require("path"), admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.P });
const db = admin.firestore(), Q = String(process.env.KLANT || "").toLowerCase(), M = String(process.env.MAAND || ""), DOE = process.env.UITVOEREN === "ja";
const n = (...a) => console.log("::notice title=Verbergen::" + a.join(" "));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => JSON.stringify([d.data().naam, d.data().contact, d.data().adres]).toLowerCase().includes(Q));
  if (!ks.length || ks.length > 8) { n("klanten:", ks.length, "; niets gedaan"); return }
  const b = db.batch(); let t = 0;
  for (const kd of ks) { const bs = (await db.collection("beurten").where("klantId", "==", kd.id).get()).docs.filter(d => String(d.data().datum || "").startsWith(M));
    bs.forEach(d => { const x = d.data(); n(kd.data().naam, "·", kd.id, "· beurt", x.datum, x.dienst || "", "· door", x.door || "", "· factuur", x.gefactureerd || "-", x.portaalVerborgen ? "(al verborgen)" : ""); b.set(d.ref, { portaalVerborgen: true }, { merge: true }); t++ }) }
  if (!DOE) { n(t, "beurt(en) gevonden (alleen gekeken)"); return }
  await b.commit(); n("klaar:", t, "beurt(en) verborgen in het portaal");
})().catch(e => { console.error(e); process.exit(1) });
