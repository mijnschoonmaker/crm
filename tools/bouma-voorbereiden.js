/* Alleen lezen: gegevens verzamelen om offerte OFF-2026-007 (Bouma) terug te zetten en de opdracht zonnepanelen te maken. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const zonder = o => JSON.stringify(o, (k, v) => /mail|tel|telefoon|iban/i.test(k) ? undefined : (typeof v === "string" && v.length > 300 ? v.slice(0, 60) + "…(" + v.length + ")" : v));
(async () => {
  const ak = (await db.doc("akkoord/sk584me3kyvfnn4tugcnap3t5p26").get()).data();
  console.log("AKKOORD", zonder(ak));
  const off = (await db.doc("facturen/fmvny2l03ajl1").get()).data();
  console.log("VOORBEELD-OFFERTE-VELDEN", Object.keys(off).sort().join(","));
  const fs = (await db.collection("facturen").where("soort", "==", "offerte").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const zp = fs.filter(f => /zonnepan/i.test(JSON.stringify(f.regels || []))).slice(0, 2);
  zp.forEach(f => console.log("OFFERTE-ZP", f.id, f.nummer, zonder({ regels: f.regels, opdracht: f.opdracht, diensten: f.diensten, btw: f.btw, incl: f.incl, start: f.start, facturatie: f.facturatie, uitvoer: f.uitvoer })));
  console.log("NUMMERS", fs.map(f => f.nummer).sort().slice(-12).join(","));
  const ks = (await db.collection("klanten").get()).docs.map(d => d.data());
  ks.flatMap(k => (k.opdrachten || []).filter(o => /zonnepan/i.test(o.dienst || ""))).slice(0, 3).forEach(o => console.log("OPDRACHT-ZP", zonder(o)));
  const b = (await db.doc("klanten/kmvmhb5vfssnh").get()).data();
  console.log("BOUMA", zonder({ objectId: b.objectId, objecten: b.objecten, opdrachten: b.opdrachten, prospect: b.prospect, factPer: b.factPer }));
  const ins = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const g = Object.keys(ins).filter(k => /groep|dienst/i.test(k));
  console.log("INSTELLING-KEYS", g.join(","));
  (ins.dienstGroepen || ins.groepen || []).filter(x => /zonnepan/i.test(JSON.stringify(x))).forEach(x => console.log("GROEP", zonder(x)));
})().catch(x => { console.error(x); process.exit(1); });
