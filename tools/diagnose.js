/* Alleen lezen: klant Bennemaheerd 34 Oldekerk, waarom het portaal geen datum toont. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3500));
(async () => {
  const alle = (await db.collection("klanten").get()).docs;
  const ks = alle.filter(d => /bennemaheerd/i.test(JSON.stringify(d.data())));
  for (const d of ks) { const k = d.data();
    n("klant " + d.id, { upd: d.updateTime.toDate().toISOString(), keys: Object.keys(k).sort(), gepland: k.gepland, tijd: k.tijd, reeks: k.reeks, nieuw: k.nieuw, actief: k.actief, prospect: k.prospect, hoofd: k.hoofdKlantId || "", verw: k.opdrachtVerwijderd || false, aanbodVanaf: k.aanbodVanaf, laatst: k.laatst, freq: k.frequentie, bevestigd: k.bevestigd || k.geplandBevestigd || k.planMail || "" });
    const sub = alle.filter(x => x.data().hoofdKlantId === d.id).map(x => ({ id: x.id, dienst: x.data().dienst, gepland: x.data().gepland, actief: x.data().actief }));
    if (sub.length) n("jobs " + d.id, sub);
    const vk = Object.fromEntries(Object.entries(k).filter(([a, v]) => /plan|gepl|datum|route|dag|mail/i.test(a)).map(([a, v]) => [a, typeof v === "object" ? JSON.stringify(v).slice(0, 200) : v]));
    n("planvelden " + d.id, vk);
  }
  if (!ks.length) n("niets", alle.length);
})().catch(x => { console.error(x); process.exit(1); });
