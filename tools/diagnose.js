/* Eenmalige herstelactie op verzoek van Robin: prijs glasbewassing van Hans Miedema machine service (382309) terug van € 0 naar € 82,47 incl.
   (de prijs van zijn laatste beurt/factuur; overschrijvende prijs 68,16 ex btw). Wijzigt alleen als de prijs nog 0 is. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
(async () => {
  const q = (await db.collection("klanten").get()).docs.filter(d => String(d.data().klantnr) === "382309" && !d.data().hoofdKlantId);
  if (q.length !== 1) { n("gestopt", q.length + " klanten gevonden"); return; }
  const d = q[0], k = d.data();
  if (Number(k.prijs) > 0) { n("niets gedaan", "prijs is al " + k.prijs); return; }
  const vd = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
  await d.ref.set({ prijs: 82.47, log: [...(Array.isArray(k.log) ? k.log : []), { datum: vd, tekst: "Prijs glasbewassing hersteld naar € 82,47 per beurt (stond door het ondertekenen van offerte OFF-2026-002 voor glasbewassing binnen ten onrechte op € 0)" }] }, { merge: true });
  n("hersteld", { naam: k.naam, prijs: 82.47 });
})().catch(x => { console.error(x); process.exit(1); });
