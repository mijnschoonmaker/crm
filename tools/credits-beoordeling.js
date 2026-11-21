/* Op verzoek van Robin (21-11-2026): klanten die een bezoek beoordeelden en daar nog geen € 0,10 credits voor kregen, krijgen ze alsnog.
   SCHRIJF=1 om echt toe te voegen; anders alleen tonen. Klanten met "robin" in de naam worden overgeslagen (dat is Robin zelf). */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const nl = () => new Date().toLocaleString("sv-SE", { timeZone: "Europe/Amsterdam" }).replace(" ", "T");
(async () => {
  const schrijf = process.env.SCHRIJF === "1";
  const ins = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const crB = ins.crBezoek == null || ins.crBezoek === "" ? 0.1 : Number(ins.crBezoek) || 0;
  const bs = (await db.collection("beurten").get()).docs.map(d => ({ id: d.id, ...d.data() })).filter(b => b.beoordeling && Number(b.beoordeling.sterren) > 0);
  const per = {}; bs.forEach(b => (per[b.klantId] = per[b.klantId] || []).push(b));
  let n = 0;
  for (const [kid, L] of Object.entries(per)) {
    const kr = db.doc("klanten/" + kid), ks = await kr.get(); if (!ks.exists) continue; const k = ks.data(), naam = String(k.naam || "");
    if (/robin/i.test(naam)) { console.log("OVERGESLAGEN (Robin zelf):", naam, L.length, "beoordeling(en)"); continue; }
    const heeft = new Set([...(k.tegoed || []), ...(k.tegoedGebruikt || [])].filter(y => y && y.bron === "beoordeling").map(y => y.ref));
    const mist = L.filter(b => !heeft.has(b.id));
    L.forEach(b => console.log(heeft.has(b.id) ? "AL GEHAD " : "MIST     ", naam, "·", b.datum, "·", b.beoordeling.sterren, "sterren"));
    if (!mist.length || !schrijf || !(crB > 0)) { n += mist.length; continue; }
    await db.runTransaction(async t => { const s = await t.get(kr), x = s.data() || {}, al = new Set([...(x.tegoed || []), ...(x.tegoedGebruikt || [])].filter(y => y && y.bron === "beoordeling").map(y => y.ref));
      const nieuw = mist.filter(b => !al.has(b.id)).map(b => ({ id: "tg" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), bedrag: crB, reden: "Credits: bezoek beoordeeld", bron: "beoordeling", ref: b.id, op: nl() }));
      if (nieuw.length) t.set(kr, { tegoed: [...(Array.isArray(x.tegoed) ? x.tegoed : []), ...nieuw] }, { merge: true }); n += nieuw.length; });
  }
  console.log(schrijf ? "TOEGEVOEGD: " + n + " × € " + crB : "ZOU TOEVOEGEN: " + n + " × € " + crB);
})().catch(x => { console.error(x); process.exit(1); });
