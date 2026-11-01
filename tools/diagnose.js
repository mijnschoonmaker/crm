/* Eenmalig: de 3 verstuurde maandtop-mails van oktober in de berichtenlog zetten (die stap faalde). Alleen als ze er nog niet staan. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
const P = require("../functions/portaal.js")({ db, onRequest: f => f, onCall: f => f, onSchedule: null, bedrijf: async () => ({}), voornaamVan: x => x, HOST: () => "", nu: () => "", newId: () => "x", portaalUrl: async () => "" });
(async () => {
  const al = await db.collection("berichten").where("sjabloon", "==", "maandtop").get();
  if (!al.empty) { n("al aanwezig", al.size); return; }
  const r = (await db.doc("ranglijst/2026-10").get()).data(), b = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const op = "2026-11-01T12:55:00.000Z";
  for (let i = 0; i < r.top.length; i++) {
    const x = r.top[i], k = (await db.doc("klanten/" + x.klantId).get()).data() || {}, m = P.winnaarMail(i + 1, x, "oktober", r.prijzen[i], b);
    await db.collection("berichten").add({ klantId: x.klantId, klantNaam: k.naam || "", naar: String(k.email || "").trim(), kanaal: "email", sjabloon: "maandtop", onderwerp: m.onderwerp, tekst: m.tekst + "\n\n" + m.onder, status: "verstuurd", verstuurdOp: op, op, door: "automatisch" });
    n("gelogd", { plek: i + 1, vn: x.vn, heeftEmail: /@/.test(String(k.email || "")) });
  }
})().catch(x => { console.error(x); process.exit(1); });
