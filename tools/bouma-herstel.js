/* Eenmalig herstel (op verzoek van Robin, 20-11-2026), klant 472031:
   1. offerte OFF-2026-007 terugzetten in facturen/fmw0jpgesnnru vanuit de ondertekende versie (akkoord sk584…);
      de huidige inhoud (een kopie van testofferte OFF-2026-001) gaat eerst naar archief/
   2. opdracht "Reiniging zonnepanelen" (16 panelen, 1x per jaar) toevoegen aan de klant.
   Drukt geen e-mailadressen of telefoonnummers af. Doet niets als het al gedaan is. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const KID = "kmvmhb5vfssnh", FID = "fmw0jpgesnnru", AK = "sk584me3kyvfnn4tugcnap3t5p26";
(async () => {
  const ins = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const ak = (await db.doc("akkoord/" + AK).get()).data();
  const kr = db.doc("klanten/" + KID), k = (await kr.get()).data();
  const fr = db.doc("facturen/" + FID), f = (await fr.get()).data() || {};
  if (!ak || ak.factuurId !== FID || ak.klantId !== KID) throw new Error("akkoord klopt niet");
  /* 1. offerte */
  if (f.nummer === "OFF-2026-007" && f.klantId === KID) console.log("offerte staat al goed");
  else {
    await db.doc("archief/" + FID + "_" + Date.now()).set({ reden: "overschreven kopie van OFF-2026-001, vervangen door herstelde OFF-2026-007 (20-11-2026)", data: f });
    const g = ak.model.groepen[0], nu = new Date().toISOString();
    const doc = { soort: "offerte", nummer: "OFF-2026-007", klantId: KID, klantNaam: k.naam || "", klantAdres: [k.adres, [k.postcode, k.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", "), klantEmail: k.email || "",
      datum: "2026-11-03", verval: ak.geldigTot || "2026-12-03", gemaakt: ak.gemaakt, verstuurdOp: ak.gemaakt, status: "geaccepteerd", akkoordOp: "2026-11-03", autoAkkoord: true, getekendNieuw: false,
      getekend: ak.getekend, akkoordToken: AK, btw: g.btwPct || 21, incl: false,
      regels: [{ omschrijving: g.omschrijving, aantal: 1, prijs: g.excl, subs: (g.subs || []).map(s => ({ naam: s.naam, qty: s.aantal, fq: g.freq || "" })) }],
      extraRegels: [], diensten: [], opdracht: {}, tekst: ins.offerteTekst || "", voettekst: ins.offerteVoet || "", notitie: "Hersteld op 20-11-2026 uit de ondertekende versie", herinnerdOp: "", herinneringen: 0, betaaldOp: "", vanOfferte: "", hersteldOp: nu };
    await fr.set(doc);
    console.log("offerte OFF-2026-007 teruggezet");
  }
  /* 2. opdracht */
  await db.runTransaction(async t => {
    const s = await t.get(kr), x = s.data() || {}, L = Array.isArray(x.opdrachten) ? x.opdrachten : [];
    if (L.some(o => o.vanOfferte === "OFF-2026-007" || /zonnepan/i.test(o.dienst || ""))) { console.log("opdracht zonnepanelen bestaat al"); return; }
    const nr = Math.max(Number(x.opdrNrMax) || 1, ...L.map(o => Number(o.nr) || 0)) + 1, ex = 72.68;
    const o = { id: "o" + Date.now().toString(36) + "zp", nr, dienst: "Reiniging zonnepanelen", groep: "zon", objectId: x.objectId || "hoofd", apart: false, actief: true,
      prijs: ins.incl ? Math.round(ex * 1.21 * 100) / 100 : ex, frequentie: 52, duur: 35, volgende: "", tp: "", td: "", taak: "", fotos: [], facturatie: "", vanOfferte: "OFF-2026-007",
      items: [{ id: "zon_0", naam: "Reiniging zonnepanelen", eenheid: "per paneel", aantal: 16, prijs: Math.round(ex / 16 * 10000) / 10000, btw: 21, sec: 120, fq: 52, vol: "", op: "", od: "", weging: 100, tiers: [] }] };
    t.set(kr, { opdrachten: [...L, o], opdrNrMax: nr, log: [...(Array.isArray(x.log) ? x.log : []), { datum: "2026-11-20", tekst: "Opdracht reiniging zonnepanelen (16 panelen, 1x per jaar) toegevoegd uit de op 3-11 ondertekende offerte OFF-2026-007" }] }, { merge: true });
    console.log("opdracht toegevoegd, nr", nr, "prijs", o.prijs, ins.incl ? "(incl)" : "(excl)");
  });
})().catch(x => { console.error(x); process.exit(1); });
