/* Alleen lezen: waarom wordt de envelop in de planning niet groen? Toont per planningsmail (laatste 14 dagen) of er een
   leesplaatje in zat en welke opens er binnenkwamen (echt, voorgeladen, scanner). Wijzigt niets; toont geen e-mailadressen. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (...a) => console.log("::notice title=Planmail::" + a.join(" "));
(async () => {
  const sinds = new Date(Date.now() - 14 * 864e5).toISOString();
  const q = await db.collection("berichten").where("op", ">=", sinds).get();
  const ms = q.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.kanaal === "email");
  const pm = ms.filter(m => /^planmail:/.test(String(m.ref || "")) || m.sjabloon === "aankondiging");
  n("E-mails 14 dagen:", ms.length, "· planningsmails:", pm.length, "· met leesplaatje (trk):", pm.filter(m => m.trk || m.trkTok).length, "· trkOpenOp gezet:", pm.filter(m => m.trkOpenOp).length, "· gelezenOp (Brevo):", pm.filter(m => m.gelezenOp).length);
  const alle = ms.filter(m => m.trk || m.trkTok);
  n("Alle mails met leesplaatje:", alle.length, "· waarvan echte open:", alle.filter(m => m.trkOpenOp).length);
  const tel = {}; pm.forEach(m => (m.trkOpens || []).forEach(x => { const k = x.s + "/" + (x.p || "?"); tel[k] = (tel[k] || 0) + 1 }));
  n("Soorten opens bij planningsmails:", JSON.stringify(tel));
  const perDag = {}; pm.forEach(m => { const d = String(m.op).slice(0, 10), x = perDag[d] = perDag[d] || { n: 0, trk: 0, echt: 0, opensAny: 0, via: {} }; x.n++; if (m.trk || m.trkTok) x.trk++; if (m.trkOpenOp) x.echt++; if ((m.trkOpens || []).length) x.opensAny++; const v = m.via || m.bron || (m.verstuurdDoor ? "crm" : "?"); x.via[v] = (x.via[v] || 0) + 1; });
  Object.keys(perDag).sort().forEach(d => n(d, JSON.stringify(perDag[d])));
  pm.sort((a, b) => String(b.op).localeCompare(String(a.op))).slice(0, 12).forEach(m => n("bericht", m.id, String(m.op).slice(0, 16), "ref", String(m.ref || "-").replace(/:[^:]+$/, ":…"), "· trk", !!(m.trk || m.trkTok), "· base", (m.trk && m.trk.base) || m.trkBase || "-", "· opens", JSON.stringify((m.trkOpens || []).map(x => x.s + "/" + (x.p || "?") + "/" + Math.round((Date.parse(x.t) - Date.parse(m.verstuurdOp || m.op)) / 1000) + "s")).slice(0, 200), "· verstuurdOp", m.verstuurdOp || "-", "· brevo gelezen", m.gelezenOp || "-", "· velden", Object.keys(m).filter(k => /trk|gelezen|bezorgd|status|kanaal|via|server/i.test(k)).join(",")));
})().catch(x => { console.error(x); process.exit(1); });
