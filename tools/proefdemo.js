/* Eenmalig: bedrijven die nu in hun proefperiode zitten ook de proef in de voorbeeldomgeving laten doen (proefDemo: true).
   Voegt alleen dit ene veld toe; er wordt niets verwijderd of overschreven. MODUS=tellen laat alleen zien wie het zou krijgen. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const vandaag = new Date().toISOString().slice(0, 10), modus = process.env.MODUS || "tellen";
  const q = await db.collection("bedrijven").where("status", "==", "proef").get();
  const lijst = q.docs.filter(d => String(d.data().proefTot || "") >= vandaag && !d.data().proefDemo && !d.data().mollieSub);
  const uit = [];
  for (const d of lijst) {
    const n = (await d.ref.collection("klanten").count().get()).data().count;
    uit.push(`${d.id} · ${d.data().naam || "?"} · proef tot ${d.data().proefTot} · ${n} klanten`);
    if (modus === "zetten") await d.ref.set({ proefDemo: true, proefDemoOp: new Date().toISOString() }, { merge: true });
  }
  console.log(`::notice title=Proefperiode::${modus === "zetten" ? "Aangepast" : "Zou aanpassen"}: ${lijst.length} bedrijven`);
  uit.forEach((t, i) => console.log(`::notice title=Bedrijf ${i + 1}::${t}`));
})().catch(x => { console.error(x); process.exit(1); });
