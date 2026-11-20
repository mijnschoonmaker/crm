/* Alleen lezen: vergelijkt de kopieën van offerte OFF-2026-001 om te zien waar ze vandaan komen. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const fs = (await db.collection("facturen").where("nummer", "==", "OFF-2026-001").get()).docs.map(d => ({ id: d.id, ...d.data(), _c: d.createTime.toDate().toISOString(), _u: d.updateTime.toDate().toISOString() }));
  const alle = new Set(fs.flatMap(f => Object.keys(f)));
  const basis = fs.find(f => f.id === "fmvny2l03ajl1") || fs[0];
  fs.forEach(f => { const ver = [...alle].filter(k => !/^_|^id$/.test(k) && JSON.stringify(f[k]) !== JSON.stringify(basis[k])).map(k => k + "=" + JSON.stringify(f[k] === undefined ? null : f[k]).slice(0, 80));
    console.log("DOC", f.id, "aangemaakt", f._c, "gewijzigd", f._u, "| anders dan origineel:", ver.join(" ; ").replace(/@/g, "(at)")); });
  /* andere documenten met dubbele nummers */
  const all = (await db.collection("facturen").get()).docs.map(d => ({ id: d.id, ...d.data(), _c: d.createTime.toDate().toISOString() }));
  const per = {}; all.forEach(f => { const n = (f.soort || "") + ":" + (f.nummer || ""); (per[n] = per[n] || []).push(f) });
  Object.entries(per).filter(([n, L]) => L.length > 1 && !/:$/.test(n)).forEach(([n, L]) => console.log("DUBBEL", n, L.map(f => f.id + "@" + f._c.slice(0, 16) + "/" + (f.klantId || "")).join(", ")));
})().catch(x => { console.error(x); process.exit(1); });
