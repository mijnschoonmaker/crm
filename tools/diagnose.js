/* Alleen lezen: Beerlings, open facturen en Mollie-velden. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3500));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => /beerling/i.test(JSON.stringify(d.data())));
  for (const d of ks) { const k = d.data();
    n("klant " + d.id, { naam: k.naam, hoofd: k.hoofdKlantId || "", incasso: k.incasso || false, mandaat: !!k.mollieMandateId });
    const fs = (await db.collection("facturen").where("klantId", "==", d.id).get()).docs;
    n("facturen " + d.id, fs.map(x => { const f = x.data(); return { id: x.id, nr: f.nummer, soort: f.soort, status: f.status, datum: f.datum, upd: x.updateTime.toDate().toISOString(), mollieId: f.mollieId || "", mollieStatus: f.mollieStatus || "", mollieBedrag: f.mollieBedrag, link: String(f.betaallink || "").slice(0, 60), mlink: String(f.mollieLink || "").slice(0, 60), deel: f.deelBetaald || 0, keys: Object.keys(f).filter(a => /mollie|betaal|link/i.test(a)) }; }));
  }
  const tk = (await db.collection("tickets").get()).docs.map(x => ({ id: x.id, ...x.data() })).filter(t => t.nummer == 1003 || /T-1003/.test(t.nummer));
  n("ticket", tk.map(t => ({ id: t.id, klant: t.klantId, onderwerp: t.onderwerp, factuur: t.factuurId || t.ref || "" })));
})().catch(x => { console.error(x); process.exit(1); });
