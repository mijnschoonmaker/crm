/* Eenmalig (op verzoek van Robin): een wekelijkse VvE-opdracht hoort op de periodieke factuur. Zet de opdracht op 'Periodieke factuur',
   en haalt de per ongeluk gemaakte conceptfactuur weg; de beurt blijft afgemeld en telt mee (via de periodieke factuur).
   HOOFD = hoofdklant-id, OPDR = opdracht-id, NR = conceptfactuur. UITVOEREN=ja voert uit. */
const path = require("path"), admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.P });
const db = admin.firestore(), DOE = process.env.UITVOEREN === "ja", { HOOFD, OPDR, NR } = process.env;
const n = (...a) => console.log("::notice title=Periodiek::" + a.join(" "));
(async () => {
  const h = await db.doc("klanten/" + HOOFD).get(), hk = h.data() || {}, o = (hk.opdrachten || []).find(x => x.id === OPDR);
  if (!o) { n("opdracht niet gevonden"); return }
  const sub = (await db.collection("klanten").where("hoofdKlantId", "==", HOOFD).get()).docs.filter(d => d.data().opdrachtId === OPDR);
  const fq = (await db.collection("facturen").where("nummer", "==", NR).get()).docs;
  const f = fq.length === 1 ? fq[0] : null, fd = f && f.data();
  n("opdracht:", o.dienst, o.prijs, "facturatie:", o.facturatie || "(niet gezet)", "· locatie-klanten:", sub.length, "· factuur:", fd ? fd.status + " " + (fd.verstuurdOp || "niet verstuurd") : "niet gevonden");
  if (fd && (fd.status !== "concept" || fd.verstuurdOp)) { n("factuur is geen onverstuurd concept; niets gedaan"); return }
  const bs = f ? (await db.collection("beurten").where("gefactureerd", "==", f.id).get()).docs : [];
  n("beurten bij de factuur:", bs.map(d => d.data().datum).join(", ") || "geen", DOE ? "" : "(alleen gekeken)");
  if (!DOE) return;
  const b = db.batch();
  b.set(h.ref, { opdrachten: hk.opdrachten.map(x => x.id === OPDR ? { ...x, facturatie: "periodiek" } : x) }, { merge: true });
  sub.forEach(d => b.set(d.ref, { factPer: true, directFactureren: false, nietFactureren: false }, { merge: true }));
  bs.forEach(d => b.set(d.ref, { gefactureerd: "periodiek", periodiek: true, bedrag: 0 }, { merge: true }));
  if (f) b.delete(f.ref);
  await b.commit(); n("klaar: opdracht op periodiek,", bs.length, "beurt(en) naar periodiek,", f ? NR + " weggehaald" : "geen factuur");
})().catch(e => { console.error(e); process.exit(1) });
