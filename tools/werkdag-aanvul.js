/* Werkdag van één dag achteraf aanvullen (eenmalig, op verzoek van de eigenaar):
   - ADRES + MINUTEN: de afgemelde beurt van die dag bij dat adres krijgt die gemeten tijd (Start vergeten)
   - PAUZE: een pauze van zoveel minuten toevoegen aan routes/<dag>.werk.pauzes
   PROEF=1: alleen laten zien wat er zou veranderen. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const meld = t => { console.log(t); console.log("::notice title=Werkdag::" + String(t).replace(/\n/g, " ")); };
const n = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const tijdNL = iso => new Date(iso).toLocaleTimeString("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" });
(async () => {
  const dag = String(process.env.DAG || "").trim(), adres = String(process.env.ADRES || "").trim(), min = Number(process.env.MINUTEN || 0), pauze = Number(process.env.PAUZE || 0), proef = process.env.PROEF === "1";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dag)) throw new Error("dag ongeldig");
  meld((proef ? "PROEF · " : "") + "dag " + dag);
  if (adres && min > 0) {
    const ks = await db.collection("klanten").get(), kl = ks.docs.filter(d => n(d.data().adres).includes(n(adres)));
    const bs = (await db.collection("beurten").where("datum", "==", dag).get()).docs.filter(d => kl.some(k => k.id === d.data().klantId) && !d.data().geannuleerd);
    meld("klanten met dat adres: " + kl.map(k => k.data().naam + " (" + k.data().adres + ")").join("; ") + " · beurten vandaag: " + bs.length);
    if (bs.length !== 1) throw new Error("verwacht precies 1 beurt bij " + adres + " op " + dag + ", gevonden " + bs.length);
    { const d0 = bs[0].data(), kd = (kl.find(k => k.id === d0.klantId) || { data: () => ({}) }).data();
      const pick = (o, ks) => JSON.stringify(Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]])));
      meld("BEURT " + pick(d0, ["bedrag", "dienst", "extra", "gefactureerd", "extraFacturen", "periodiek", "duur", "op", "door"]));
      meld("KLANT " + pick(kd, ["prijs", "dienst", "soort", "facturatie", "periodiek", "duur", "frequentie"]) + " opdrachten: " + JSON.stringify((kd.opdrachten || []).map(o => ({ d: o.dienst, p: o.prijs, a: o.actief, g: o.groep }))));
      if (process.env.ALLEEN_TONEN === "1") { meld("alleen getoond"); return; } }
    const b = bs[0], d = b.data(), op = d.op || new Date().toISOString(), start = new Date(new Date(op).getTime() - min * 6e4).toISOString();
    meld("beurt " + b.id + " (" + d.klantNaam + "): duur " + d.duur + " → " + min + " min, gemeten " + !!d.gemeten + " → true, start " + tijdNL(start) + " – afgemeld " + tijdNL(op));
    if (!proef) await b.ref.update({ duur: min, gemeten: true, startOp: d.startOp || start, achterafIngevuld: new Date().toISOString() });
  }
  if (pauze > 0) {
    const ref = db.doc("routes/" + dag), s = await ref.get(), w = (s.data() || {}).werk || {};
    if (!w.start) throw new Error("geen werkdag met vertrek op " + dag);
    const pz = Array.isArray(w.pauzes) ? w.pauzes : [];
    /* midden op de dag, binnen de werkdag */
    let van = new Date(dag + "T12:00:00+01:00"); if (van < new Date(w.start)) van = new Date(new Date(w.start).getTime() + 60 * 6e4);
    const tot = new Date(van.getTime() + pauze * 6e4);
    meld("werkdag " + tijdNL(w.start) + " – " + (w.stop ? tijdNL(w.stop) : "loopt") + " · pauzes nu " + pz.length + " → pauze erbij " + tijdNL(van.toISOString()) + "–" + tijdNL(tot.toISOString()));
    if (!proef) await ref.update({ "werk.pauzes": [...pz, { van: van.toISOString(), tot: tot.toISOString(), achteraf: true }], "werk.gecorrigeerd": new Date().toISOString() });
  }
  meld(proef ? "proef klaar, niets gewijzigd" : "opgeslagen");
})().catch(e => { console.error(e); console.log("::error title=Werkdag::" + e.message); process.exit(1); });
