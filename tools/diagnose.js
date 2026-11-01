/* Alleen lezen: ticket T-1001. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const ts = (await db.collection("tickets").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  n("alle", ts.map(t => ({ nr: t.nummer, st: t.status, ong: t.ongelezenTeam, laatst: t.laatst, van: t.laatsteVan, gezien: t.gezienTeam, upd: "" })));
  const t = ts.find(x => x.nummer === "T-1001");
  if (t) { const d = await db.doc("tickets/" + t.id).get(); n("upd", d.updateTime.toDate().toISOString());
    const b = (await db.collection("ticketBerichten").where("ticketId", "==", t.id).get()).docs.map(x => ({ van: x.data().van, op: x.data().op, tekst: String(x.data().tekst || "").slice(0, 50) }));
    n("berichten", b.sort((a, c) => String(a.op).localeCompare(String(c.op)))); }
})().catch(x => { console.error(x); process.exit(1); });
