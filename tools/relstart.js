/* Eenmalig: "Eerstvolgend klantnummer" (bhKlantStart) zetten, zodat nieuwe relatiecodes niet botsen met SnelStart.
   Verhoogt alleen (nooit lager zetten) en wijzigt verder niets. Meldt ook de hoogste relatiecode die nu in het CRM staat. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const nieuw = parseInt(process.env.START, 10); if (!(nieuw > 1000)) throw new Error("ongeldig startnummer");
  const ref = db.doc("instellingen/bedrijf"), ins = (await ref.get()).data() || {}, oud = parseInt(ins.bhKlantStart, 10) || 0;
  const ks = await db.collection("klanten").get();
  const nrs = ks.docs.map(d => d.data()).filter(k => !k.hoofdKlantId && /^\d+$/.test(String(k.klantnr || ""))).map(k => Number(k.klantnr)).sort((a, b) => a - b);
  const hoger = nrs.filter(n => n >= nieuw);
  if (oud < nieuw) await ref.set({ bhKlantStart: String(nieuw) }, { merge: true });
  console.log(`::notice title=Relatiecodes::Eerstvolgend klantnummer was ${oud || "leeg"}, is nu ${Math.max(oud, nieuw)} · ${nrs.length} klanten met code · hoogste in CRM ${nrs[nrs.length - 1] || "-"} · codes vanaf ${nieuw}: ${hoger.length ? hoger.join(", ") : "geen"}`);
})().catch(x => { console.error(x); process.exit(1); });
