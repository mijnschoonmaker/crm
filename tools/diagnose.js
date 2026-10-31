/* Alleen lezen: klant(en) Powerplus, ramenRegel per verdieping en de laatste beurten. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3500));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => /power\s*plus/i.test(JSON.stringify([d.data().naam, d.data().contact, d.data().bedrijf])));
  n("aantal", ks.map(d => d.id + " " + d.data().naam));
  for (const d of ks) { const k = d.data(), r = k.ramenRegel || {};
    n("klant " + d.id, { naam: k.naam, adres: k.adres, freq: k.frequentie, laatst: k.laatst, gepland: k.gepland, objectId: k.objectId, objecten: (k.objecten || []).map(o => [o.id, o.naam, o.adres]), aanbieden: k.aanbieden });
    n("ramenRegel " + d.id, { f: r.f, fq: r.fq, vol: r.vol, kf: r.kf, kfq: r.kfq, kvol: r.kvol, sp: r.sp, spfq: r.spfq, spvol: r.spvol });
    n("opdrachten " + d.id, (k.opdrachten || []).map(o => ({ id: o.id, dienst: o.dienst, fr: o.frequentie, laatst: o.laatst, volgende: o.volgende, obj: o.objectId, ramen: o.ramenRegel ? { f: o.ramenRegel.f, fq: o.ramenRegel.fq, vol: o.ramenRegel.vol } : null })));
    n("log " + d.id, (k.log || []).slice(-6));
    const bs = (await db.collection("beurten").where("klantId", "==", d.id).get()).docs.map(x => x.data()).sort((a, b) => String(b.op || b.datum).localeCompare(String(a.op || a.datum))).slice(0, 5);
    n("beurten " + d.id, bs.map(b => ({ datum: b.datum, op: b.op, door: b.door, dienst: b.dienst, bedrag: b.bedrag, obj: b.objectId, extra: b.extra ? b.extra.length : 0 })));
  }
})().catch(x => { console.error(x); process.exit(1); });
