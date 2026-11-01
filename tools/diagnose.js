/* Alleen lezen: eigen klantrecord herkennen + maandranglijsten. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (t, x) => console.log("::notice title=" + t + "::" + JSON.stringify(x).slice(0, 3800));
const vanTs = f => { if (f.verstuurdTs) return f.verstuurdTs; const v = String(f.verstuurdOp || ""); if (/T\d/.test(v)) return v; if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const g = String(f.gemaakt || ""); return g && g.slice(0, 10) === v ? g : v + "T00:00:00"; } return f.gemaakt || (f.datum ? f.datum + "T09:00:00" : ""); };
const sec = f => { const bo = String(f.betaaldOp || "").slice(0, 10), ts = f.betaaldTs || (/^\d{4}-\d{2}-\d{2}$/.test(bo) ? bo + "T12:00:00" : ""); if (!ts) return null; const v = Date.parse(vanTs(f)), t = Date.parse(ts); return v > 0 && t > 0 ? Math.max(0, Math.round((t - v) / 1000)) : null; };
(async () => {
  const b = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const ks = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const w = ks.filter(k => /westerdijk/i.test(String(k.naam || "")));
  const dom = e => String(e || "").split("@")[1] || "";
  n("eigen", w.map(k => ({ id: k.id, hoofd: !!k.hoofdKlantId, emailIsBedrijf: String(k.email||"").toLowerCase() === String(b.email||"").toLowerCase(), emailIsEigenaar: String(k.email||"").toLowerCase()==="robin@mijnschoonmaker.com", zelfdeDomein: dom(k.email) === dom(b.email), velden: Object.keys(k).filter(x => /test|eigen|intern|demo|prive/i.test(x)) })));
  const K = new Map(ks.map(k => [k.id, k]));
  const fs = (await db.collection("facturen").where("status", "==", "betaald").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const maanden = {};
  fs.forEach(f => { if (f.soort === "offerte" || !f.klantId || f.incasso || f.betaalwijze === "incasso") return; const s = sec(f); if (s == null) return; const m = String(f.betaaldOp || "").slice(0, 7); if (m < "2026-05") return; (maanden[m] = maanden[m] || []).push({ k: f.klantId, s, via: f.betaalwijze || "", precies: !!f.betaaldTs }); });
  const uit = {};
  for (const [m, l] of Object.entries(maanden).sort()) {
    const best = {}; l.forEach(x => { if (!(x.k in best) || x.s < best[x.k].s) best[x.k] = x; });
    const r = Object.values(best).sort((a, c) => a.s - c.s);
    uit[m] = { betalingen: l.length, klanten: r.length, precies: l.filter(x => x.precies).length, top: r.slice(0, 4).map(x => ({ vn: String((K.get(x.k) || {}).contact || (K.get(x.k) || {}).naam || "").split(/[ ,]/)[0], eigen: /westerdijk/i.test(String((K.get(x.k) || {}).naam || "")), s: x.s, via: x.via })) };
  }
  n("maanden", uit);
})().catch(x => { console.error(x); process.exit(1); });
