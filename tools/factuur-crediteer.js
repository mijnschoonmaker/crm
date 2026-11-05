/* Eenmalig (met akkoord van Robin): een dubbel verstuurde, nog openstaande factuur crediteren, precies zoals de knop
   "Creditfactuur aanmaken" in het CRM, en beide als verrekend afsluiten zodat er geen herinneringen meer gaan.
   UITVOEREN=ja voert uit; anders alleen kijken. */
const path = require("path"), admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.P });
const db = admin.firestore(), NR = String(process.env.NR || "").trim(), DOE = process.env.UITVOEREN === "ja";
const n = (...a) => console.log("::notice title=Crediteren::" + a.join(" "));
const eur = v => "€ " + (Math.round(v * 100) / 100).toFixed(2).replace(".", ",");
const inc = f => (f.regels || []).reduce((s, r) => { const a = (Number(r.aantal) || 0) * (Number(r.prijs) || 0); return s + (f.prijsIncl === false || f.excl ? a * (1 + (Number(r.btw) || 0) / 100) : a) }, 0);
(async () => {
  const fs = await db.collection("facturen").get(), alle = fs.docs.map(d => ({ id: d.id, ...d.data() }));
  const f = alle.filter(x => x.nummer === NR && x.soort !== "offerte");
  if (f.length !== 1) { n("niet precies 1 factuur", NR, ":", f.length); return }
  const o = f[0];
  n(NR, "·", o.klantNaam, "· status", o.status, "· datum", o.datum, "· verstuurd", o.verstuurdOp || "-", "· bedrag ±", eur(inc(o)), "· mollie", o.mollieStatus || o.mollieId || "-", "· deelBetaald", o.deelBetaald || 0);
  const zelfde = alle.filter(x => x.klantId === o.klantId && x.soort !== "offerte" && x.id !== o.id && x.datum >= "2026-10-20");
  zelfde.forEach(x => n("andere factuur klant:", x.nummer, x.status, x.betaaldOp || "", x.betaalwijze || "", eur(inc(x))));
  const bs = await db.collection("beurten").where("gefactureerd", "==", o.id).get();
  n("beurten die naar", NR, "wijzen:", bs.size);
  const cr = alle.find(x => x.creditVan === o.id);
  if (cr) { n("er is al een creditfactuur:", cr.nummer, "; niets gedaan"); return }
  if (o.status !== "open" || o.betaaldOp || Number(o.deelBetaald) > 0) { n("factuur staat niet (helemaal) open; niets gedaan"); return }
  const st = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const d = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  let nummer;
  if (st.factNrStijl === "doorlopend") { const ns = alle.filter(x => x.soort !== "offerte" && /^\d{2}-\d{6}$/.test(String(x.nummer || ""))).map(x => parseInt(String(x.nummer).slice(3), 10) || 0);
    nummer = d.slice(2, 4) + "-" + String(Math.max((parseInt(st.factNrStart, 10) || 0) - 1, ...ns) + 1).padStart(6, "0") }
  else { const pre = d.slice(0, 4) + "-", ns = alle.filter(x => String(x.nummer || "").startsWith(pre)).map(x => parseInt(String(x.nummer).slice(5), 10) || 0); nummer = pre + String(Math.max(0, ...ns) + 1).padStart(4, "0") }
  n("creditfactuur wordt", nummer, "voor", eur(-inc(o)), DOE ? "" : "(alleen gekeken)");
  if (!DOE) return;
  const { id, ...rest } = o, nid = "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nu = new Date().toISOString();
  const nf = { ...rest, nummer, datum: d, verval: d, regels: (o.regels || []).map(r => ({ ...r, prijs: -(Number(r.prijs) || 0) })), status: "betaald", betaaldOp: d, betaalwijze: "verrekend",
    verstuurdOp: "", herinnerdOp: "", herinneringen: 0, oninbaarOp: "", gemaakt: nu, log: [], creditVan: o.id, periodiek: false, notitie: "Creditfactuur voor factuur " + o.nummer + " (dubbel verstuurd)" };
  for (const k of ["mollieId", "mollieLink", "mollieStatus", "mollieMethode", "betaalLink", "betaallink", "incasso", "updatedAt"]) delete nf[k];
  const b = db.batch();
  b.set(db.doc("facturen/" + nid), nf);
  b.set(db.doc("facturen/" + o.id), { status: "betaald", betaaldOp: d, betaalwijze: "verrekend", notitie: [o.notitie, "Dubbel verstuurd, gecrediteerd met " + nummer].filter(Boolean).join(" · ") }, { merge: true });
  await b.commit();
  n("klaar:", NR, "verrekend met creditfactuur", nummer);
})().catch(e => { console.error(e); process.exit(1) });
