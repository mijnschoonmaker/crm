/* Alleen lezen: hoe staan de relatiecodes (klantnummers) ervoor? Schrijft alleen aantallen en veldnamen in het logboek, geen klantgegevens. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const [ks, fs] = await Promise.all([db.collection("klanten").get(), db.collection("facturen").get()]);
  const K = ks.docs.map(d => d.data()).filter(k => !k.hoofdKlantId), F = fs.docs.map(d => d.data()).filter(f => f.soort !== "offerte");
  const velden = {}; K.forEach(k => Object.keys(k).forEach(x => velden[x] = (velden[x] || 0) + 1));
  const nr = K.map(k => String(k.klantnr || "")).filter(Boolean), num = nr.map(Number).filter(n => n > 0);
  const tel = {}; nr.forEach(n => tel[n] = (tel[n] || 0) + 1);
  const b = (a, z) => num.filter(n => n >= a && n < z).length;
  const fv = {}; F.forEach(f => Object.keys(f).forEach(x => fv[x] = (fv[x] || 0) + 1));
  const fRel = F.filter(f => f.relatiecode), fMatch = F.filter(f => f.relatiecode && f.klantId).length;
  const kById = {}; ks.docs.forEach(d => kById[d.id] = d.data());
  const verschil = F.filter(f => f.relatiecode && f.klantId && kById[f.klantId] && String(kById[f.klantId].klantnr || "") !== String(f.relatiecode)).length;
  const r = [
    `klanten ${K.length} | actief ${K.filter(k => k.actief !== false).length} | met klantnr ${nr.length} | zonder ${K.length - nr.length}`,
    `klantnr 1000-1999: ${b(1000, 2000)} | 2000-9999: ${b(2000, 10000)} | 10000+: ${b(10000, 1e12)} | <1000: ${b(1, 1000)} | niet-numeriek ${nr.length - num.length}`,
    `dubbele klantnrs: ${Object.values(tel).filter(x => x > 1).length} | min ${num.length ? Math.min(...num) : "-"} max ${num.length ? Math.max(...num) : "-"}`,
    `facturen ${F.length} | met relatiecode-veld ${fRel.length} | daarvan klantnr anders dan relatiecode ${verschil} (van ${fMatch})`,
    `aangemaakt in Mansard (geen import-sporen): ${K.filter(k => !k.klantnr).length}`,
    `klantvelden: ${Object.entries(velden).sort((a, b2) => b2[1] - a[1]).map(([k, v]) => k + ":" + v).join(", ")}`,
    `factuurvelden: ${Object.entries(fv).sort((a, b2) => b2[1] - a[1]).map(([k, v]) => k + ":" + v).join(", ")}`];
  console.log(r.join("\n")); console.log("::notice title=Relatiecodes::" + r.join("%0A"));
})().catch(e => { console.error(e); process.exit(1); });
