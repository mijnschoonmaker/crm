/* Alleen lezen: toont de staat van één factuur (op nummer) en de bijbehorende klant, om fouten te zoeken. Wijzigt niets.
   De uitkomst staat als meldingen (annotaties) bij de run. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const uit = [];
const log = (...a) => { const t = a.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" "); uit.push(t); console.log(t); };
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
(async () => {
  const nr = String(process.env.NUMMER || "").trim();
  const q = await db.collection("facturen").where("nummer", "==", nr).get();
  log("facturen met nummer " + nr + ": " + q.size);
  for (const d of q.docs) {
    const f = d.data();
    log("FACTUUR " + d.id, pick(f, ["soort", "status", "betaald", "betaaldOp", "betaaldTs", "betaalwijze", "mollieStatus", "mollieBetaald", "verstuurdOp", "gemaakt", "datum", "vanOfferte", "incasso", "deelBetaald"]));
    log("laatst gewijzigd (server): " + (d.updateTime ? d.updateTime.toDate().toISOString() : "?"));
    if (f.klantId) {
      const k = (await db.doc("klanten/" + f.klantId).get()).data() || {};
      log("KLANT", { ...pick(k, ["prospect", "actief", "opdrachtVerwijderd", "prijs", "frequentie", "gepland", "laatst", "aanbieden", "aanbodVanaf", "autoplan"]), tegoed: (k.tegoed || []).map(t => pick(t, ["bedrag", "bron", "ref", "op"])), tegoedGebruikt: (k.tegoedGebruikt || []).length });
    }
    const bs = await db.collection("beurten").where("gefactureerd", "==", d.id).get();
    log("beurten bij factuur: " + bs.size);
  }
  const ins = (await db.doc("instellingen/bedrijf").get()).data() || {};
  log("crSnel instelling: " + JSON.stringify(ins.crSnel));
  uit.forEach((t, i) => console.log("::notice title=Diagnose " + (i + 1) + "::" + t.replace(/\n/g, " ")));
})().catch(x => { console.error(x); process.exit(1); });
