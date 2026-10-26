/* Eén factuur (op nummer) een ander factuuradres geven, en optioneel de uitvoerlocatie in de notitie zetten.
   Wijzigt alleen klantAdres (en notitie als LOCATIE is ingevuld). De PDF maakt het CRM daarna vanzelf opnieuw. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const meld = t => { console.log(t); console.log("::notice title=Factuuradres::" + String(t).replace(/\n/g, " ")); };
(async () => {
  const nr = String(process.env.NUMMER || "").trim(), adres = String(process.env.ADRES || "").trim(), loc = String(process.env.LOCATIE || "").trim();
  if (!nr || adres.length < 5) throw new Error("nummer of adres ontbreekt");
  const q = await db.collection("facturen").where("nummer", "==", nr).get();
  if (q.size !== 1) throw new Error("verwacht precies 1 factuur met nummer " + nr + ", gevonden: " + q.size);
  const d = q.docs[0], f = d.data();
  if (f.soort === "offerte") throw new Error("dit is een offerte");
  const patch = { klantAdres: adres };
  if (loc && !String(f.notitie || "").includes(loc)) patch.notitie = ["Uitvoerlocatie: " + loc, f.notitie || ""].filter(Boolean).join("\n");
  meld("voor: klantAdres=" + (f.klantAdres || "") + " | notitie=" + (f.notitie || ""));
  await d.ref.update(patch);
  meld("na: klantAdres=" + adres + (patch.notitie ? " | notitie=" + patch.notitie : ""));
})().catch(e => { console.error(e); console.log("::error title=Factuuradres::" + e.message); process.exit(1); });
