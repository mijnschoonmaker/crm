/* Alleen lezen: waarom kreeg een klant een conceptfactuur? Toont facturatie-instellingen van de klant(en), hoofdklant/opdracht en de factuur. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore(), Z = String(process.env.ZOEK || "").toLowerCase(), NR = String(process.env.NR || "");
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
(async () => {
  const all = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const hit = all.filter(k => String(k.naam || "").toLowerCase().includes(Z));
  for (const k of hit) {
    console.log("KLANT", k.id, JSON.stringify(pick(k, ["naam", "adres", "soort", "actief", "dienst", "prijs", "frequentie", "periodiek", "factPer", "nietFactureren", "directFactureren", "hoofdKlantId", "opdrachtId", "laatst", "gepland"])));
    (k.opdrachten || []).forEach(o => console.log("   OPDR", JSON.stringify(pick(o, ["id", "dienst", "prijs", "frequentie", "facturatie", "actief", "apart", "groep"]))));
  }
  const f = (await db.collection("facturen").where("nummer", "==", NR).get()).docs.map(d => ({ id: d.id, ...d.data() }))[0];
  if (f) { console.log("FACTUUR", JSON.stringify(pick(f, ["nummer", "status", "klantId", "klantNaam", "datum", "regels", "periodiek", "gemaakt", "notitie"])));
    const b = (await db.collection("beurten").where("klantId", "==", f.klantId).get()).docs.map(d => d.data()).filter(x => x.datum >= "2026-10-20");
    b.forEach(x => console.log("BEURT", JSON.stringify(pick(x, ["datum", "gefactureerd", "periodiek", "bedrag", "dienst", "door", "op", "extra", "extraFacturen"])))) }
  else console.log("geen factuur", NR);
})().catch(x => { console.error(x); process.exit(1) });
