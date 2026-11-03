/* Alleen lezen: klanten die de laatste uren zijn gewijzigd, gegroepeerd per minuut, met hun geplande datum. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const uur = Number(process.env.UREN || 3), sinds = Date.now() - uur * 36e5;
  const q = await db.collection("klanten").get();
  const L = q.docs.filter(d => d.updateTime.toMillis() >= sinds).map(d => ({ id: d.id, t: d.updateTime.toDate().toISOString(), naam: d.data().naam, plaats: d.data().plaats, adres: d.data().adres, gepland: d.data().gepland, tijd: d.data().tijd || "", vorige: d.data().laatst || d.data().laatsteBeurt || "" }));
  L.sort((a, b) => a.t.localeCompare(b.t));
  const per = {}; L.forEach(x => { const m = x.t.slice(0, 16); (per[m] = per[m] || []).push(x); });
  for (const [m, l] of Object.entries(per)) { console.log("MINUUT", m, "UTC", l.length, "klanten");
    l.forEach(x => console.log("  K", x.id, "|", x.naam, "|", x.adres, x.plaats, "| gepland", x.gepland || "-", x.tijd)); }
})().catch(x => { console.error(x); process.exit(1); });
