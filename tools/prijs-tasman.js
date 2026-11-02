/* Eenmalige correctie (met akkoord van Robin, 2 nov 2026): VvE Tasman State, opdracht 7 (VvE Schoonmaakonderhoud).
   De prijs was opgeslagen als € 114,95 incl. (= € 95 + 21%); hoort € 103,55 incl. (= € 95 excl. + 9% btw).
   Past alleen de hoofdklant-opdracht en de bijbehorende losse opdracht aan, en alleen als de prijs nog precies 114,95 is. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const OUD = 114.95, NIEUW = 103.55, HOOFD = "kmvmhb5oc6fkf", OPDR = "omvsem3gpfmjr", JOB = "kmvsfev6ku13x";
const nu = new Date().toISOString().slice(0, 10), tekst = "Prijs gecorrigeerd: € 95,00 excl. 9% btw (was opgeslagen met 21%)";
(async () => {
  await db.runTransaction(async tx => {
    const hr = db.doc("klanten/" + HOOFD), jr = db.doc("klanten/" + JOB);
    const [h, j] = [(await tx.get(hr)).data(), (await tx.get(jr)).data()];
    if (!h || !j) throw new Error("klant niet gevonden");
    const ops = (h.opdrachten || []).map(o => ({ ...o }));
    const o = ops.find(x => x.id === OPDR);
    if (!o) throw new Error("opdracht niet gevonden");
    if (j.hoofdKlantId !== HOOFD || j.opdrachtId !== OPDR) throw new Error("losse opdracht hoort niet bij deze opdracht");
    const pa = Math.abs(Number(o.prijs) - OUD) < 0.005, pj = Math.abs(Number(j.prijs) - OUD) < 0.005;
    console.log("opdracht 7 nu:", o.prijs, "· losse opdracht nu:", j.prijs);
    if (pa) { o.prijs = NIEUW; tx.update(hr, { opdrachten: ops, log: [...(h.log || []), { datum: nu, tekst: "Opdracht 7: " + tekst }] }) }
    if (pj) tx.update(jr, { prijs: NIEUW, log: [...(j.log || []), { datum: nu, tekst }] });
    console.log(pa || pj ? "aangepast naar " + NIEUW : "niets aangepast (prijs was al anders)");
  });
  const o = ((await db.doc("klanten/" + HOOFD).get()).data().opdrachten || []).find(x => x.id === OPDR), j = (await db.doc("klanten/" + JOB).get()).data();
  console.log("::notice title=Controle::opdracht 7 prijs " + o.prijs + " · losse opdracht prijs " + j.prijs + " (gepland " + j.gepland + ")");
})().catch(x => { console.error(x); process.exit(1); });
