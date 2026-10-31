/* Alleen lezen: Powerplus, wanneer is de klant voor het laatst opgeslagen en wat staat er op de factuur van 26-10. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3500));
(async () => {
  const ids = ["kmvmhau25ioz3", "kmvoczqye9veq", "kmvofxf4za3d3"], uit = [];
  for (const id of ids) { const d = await db.doc("klanten/" + id).get(), k = d.data() || {};
    uit.push({ id, upd: d.updateTime && d.updateTime.toDate().toISOString(), naam: k.naam, adres: k.adres, hoofd: k.hoofdKlantId || "", bijOpdr: k.hoortBijOpdracht || k.opdrachtId || "", freq: k.frequentie, laatst: k.laatst, gepland: k.gepland, aanbieden: k.aanbieden, rr: k.ramenRegel ? { f: k.ramenRegel.f, fq: k.ramenRegel.fq, vol: k.ramenRegel.vol } : null, eenmalig: k.eenmalig || "", actief: k.actief }); }
  n("klanten", uit);
  const fs = (await db.collection("facturen").where("klantId", "in", ids).get()).docs.map(x => ({ id: x.id, ...x.data() })).filter(f => f.datum >= "2026-10-20");
  n("facturen", fs.map(f => ({ nr: f.nummer, soort: f.soort, datum: f.datum, kid: f.klantId, status: f.status, regels: (f.regels || []).map(r => r.omschrijving + " | " + r.aantal + " x " + r.prijs), gemaakt: f.gemaakt })));
  const bs = (await db.collection("beurten").where("klantId", "in", ids).get()).docs.map(x => x.data()).filter(b => b.datum >= "2026-10-01");
  n("beurten", bs.map(b => ({ kid: b.klantId, datum: b.datum, op: b.op, bedrag: b.bedrag, extra: b.extra, gef: b.gefactureerd })));
})().catch(x => { console.error(x); process.exit(1); });
