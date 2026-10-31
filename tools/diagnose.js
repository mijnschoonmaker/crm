/* Alleen lezen: berichten van ticket T-1003 en welke klant ze zag. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3500));
(async () => {
  const id = "tkmvwhg34e1bc0bc", t = (await db.doc("tickets/" + id).get()).data() || {};
  n("ticket", { klant: t.klantId, status: t.status, laatsteVan: t.laatsteVan, aangemaakt: t.aangemaakt, laatst: t.laatst });
  const b = (await db.collection("ticketBerichten").where("ticketId", "==", id).get()).docs.map(d => ({ id: d.id, klant: d.data().klantId, van: d.data().van, op: d.data().op, tekst: String(d.data().tekst || "").slice(0, 60) }));
  n("berichten", b);
  const ss = (await db.collection("portaalSessie").where("klantId", "==", t.klantId).get()).docs.map(x => ({ op: x.data().op, voorbeeld: !!x.data().voorbeeld, door: x.data().door || x.data().via || "" }));
  n("sessies", ss);
})().catch(x => { console.error(x); process.exit(1); });
