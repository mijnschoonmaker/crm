/* Alleen lezen: toont de staat van één factuur (op nummer) en de bijbehorende klant, om fouten te zoeken. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
(async () => {
  const nr = String(process.env.NUMMER || "").trim();
  const q = await db.collection("facturen").where("nummer", "==", nr).get();
  console.log("facturen met nummer", nr, ":", q.size);
  for (const d of q.docs) {
    const f = d.data();
    console.log("FACTUUR", d.id, JSON.stringify(pick(f, ["soort", "status", "betaald", "betaaldOp", "betaaldTs", "betaalwijze", "mollieStatus", "mollieBetaald", "mollieLink", "betaallink", "verstuurdOp", "gemaakt", "datum", "klantId", "vanOfferte", "incasso", "deelBetaald", "bijgewerkt", "gewijzigd"]), null, 1));
    const upd = d.updateTime && d.updateTime.toDate().toISOString();
    console.log("laatst gewijzigd (server):", upd);
    if (f.klantId) { const k = (await db.doc("klanten/" + f.klantId).get()).data() || {};
      console.log("KLANT", JSON.stringify({ ...pick(k, ["prospect", "actief", "opdrachtVerwijderd", "prijs", "frequentie", "gepland", "laatst", "aanbieden", "aanbodVanaf", "autoplan"]), tegoed: (k.tegoed || []).map(t => pick(t, ["bedrag", "bron", "ref", "op"])), tegoedGebruikt: (k.tegoedGebruikt || []).length }, null, 1)); }
    const bs = await db.collection("beurten").where("gefactureerd", "==", d.id).get();
    console.log("beurten bij factuur:", bs.size);
  }
  const ins = (await db.doc("instellingen/bedrijf").get()).data() || {};
  console.log("crSnel instelling:", JSON.stringify(ins.crSnel));
})().catch(x => { console.error(x); process.exit(1); });
