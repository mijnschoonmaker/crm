/* Alleen lezen: controle VvE's en klanten met meerdere locaties. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const all = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const byId = Object.fromEntries(all.map(k => [k.id, k]));
  const hoofdLoc = k => { if (!k || k.objectId === "hoofd") return "hoofd"; const os = k.objecten || []; const o = os.find(o => o.id === k.objectId) || os[0] || null; return o && o.adres ? o.id : "hoofd"; };
  const locAdr = (k, id) => { const o = id !== "hoofd" && (k.objecten || []).find(x => x.id === id); return o ? o.adres : k.adres; };
  const zonderKeuze = [], adresFout = [], teVroeg = [], hoofdOpLoc = [];
  for (const k of all) {
    if (k.hoofdKlantId || k.actief === false) continue;
    const os = (k.objecten || []).filter(o => o && o.adres);
    if (os.length && !k.objectId) zonderKeuze.push({ naam: k.naam, nr: k.klantnr, plek: os[0].adres });
    if (os.length && k.objectId && k.objectId !== "hoofd" && !k.opdrachtVerwijderd) hoofdOpLoc.push({ naam: k.naam, nr: k.klantnr, factuuradres: k.adres, hoofdopdrachtOp: locAdr(k, k.objectId) });
    for (const o of k.opdrachten || []) {
      const job = all.find(x => x.hoofdKlantId === k.id && x.opdrachtId === o.id && x.actief !== false); if (!job) continue;
      const want = locAdr(k, o.objectId || hoofdLoc(k));
      if (String(job.adres || "") !== String(want || "")) adresFout.push({ naam: k.naam, nr: (k.klantnr || "") + "-" + (o.nr || ""), staat: job.adres, moet: want });
      const vol = o.volgende || (o.items || []).filter(i => Number(i.aantal) > 0 && i.vol).map(i => i.vol).sort()[0] || "";
      if (!job.gepland && !job.laatst && vol && String(job.aanbodVanaf || "") < vol) teVroeg.push({ naam: k.naam, nr: (k.klantnr || "") + "-" + (o.nr || ""), aanbodNu: job.aanbodVanaf || "meteen", moet: vol });
    }
  }
  n("hoofdopdracht zonder vaste plek (meerdere locaties)", zonderKeuze);
  n("hoofdopdracht staat op een extra locatie", hoofdOpLoc);
  n("losse opdracht met verkeerd adres", adresFout);
  n("losse opdracht te vroeg aangeboden", teVroeg);
})().catch(x => { console.error(x); process.exit(1); });
