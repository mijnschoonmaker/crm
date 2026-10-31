/* Alleen lezen: Bert Hoekstra, portaalgebruik en tickets. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3500));
(async () => {
  const ks = (await db.collection("klanten").get()).docs.filter(d => /hoekstra/i.test(String(d.data().naam || "")));
  const uit = [];
  for (const d of ks) { const k = d.data();
    const tk = (await db.collection("tickets").where("klantId", "==", d.id).get()).docs.map(x => ({ nr: x.data().nummer, op: x.data().op, onderwerp: x.data().onderwerp, bron: x.data().bron || x.data().via || "" }));
    const ss = (await db.collection("portaalSessie").where("klantId", "==", d.id).get()).docs.map(x => ({ op: x.data().op, voorbeeld: !!x.data().voorbeeld, gezien: x.data().gezien ? new Date(x.data().gezien).toISOString() : "" }));
    uit.push({ id: d.id, naam: k.naam, upd: d.updateTime.toDate().toISOString(), hoofd: k.hoofdKlantId || "", portaalLaatst: k.portaalLaatst || "", uitgenodigd: k.portaalUitgenodigd || "", tickets: tk, sessies: ss }); }
  n("hoekstra", uit);
  const vz = (await db.collection("portaalVerzoeken").get()).docs.map(x => x.data()).filter(v => ks.some(d => d.id === v.klantId)).map(v => ({ type: v.type, op: v.op, status: v.status, ticket: v.ticketId || "" }));
  n("verzoeken", vz);
})().catch(x => { console.error(x); process.exit(1); });
