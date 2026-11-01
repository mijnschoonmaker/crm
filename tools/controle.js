/* Wekelijkse controle (alleen lezen): VvE's, losse opdrachten en klanten met meerdere locaties.
   Wijzigt niets. Vindt hij iets, dan staat het in de samenvatting van de run en eindigt de run met een fout,
   zodat GitHub een melding stuurt. */
const admin = require("../functions/node_modules/firebase-admin");
const fs = require("fs");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
(async () => {
  const all = (await db.collection("klanten").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const hoofdLoc = k => { if (!k || k.objectId === "hoofd") return "hoofd"; const os = k.objecten || []; const o = os.find(o => o.id === k.objectId) || os[0] || null; return o && o.adres ? o.id : "hoofd"; };
  const locAdr = (k, id) => { const o = id !== "hoofd" && (k.objecten || []).find(x => x.id === id); return o ? o.adres : k.adres; };
  const nr = (k, o) => (k.klantnr || "?") + "-" + (o.nr || "?"), naam = k => String(k.naam || "").replace(/\s+/g, " ").trim();
  const F = { "Hoofdopdracht zonder vaste plek (klant heeft meerdere locaties)": [], "Losse opdracht met een ander adres dan de uitvoerlocatie": [],
    "Losse opdracht wordt eerder aangeboden dan de aanboddatum": [], "Losse opdracht met een andere prijs dan in de opdracht": [], "Losse opdracht staat aan, maar de opdracht bestaat niet meer": [], "Actieve klant met glasbewassing voor € 0 per beurt": [] };
  for (const k of all) {
    if (k.hoofdKlantId || k.actief === false) continue;
    if (!k.prospect && !k.opdrachtVerwijderd && !(Number(k.prijs) > 0) && !k.periodiek) F["Actieve klant met glasbewassing voor € 0 per beurt"].push(`${naam(k)} (${k.klantnr || "?"})`);
    const os = (k.objecten || []).filter(o => o && o.adres);
    if (os.length && !k.objectId) F["Hoofdopdracht zonder vaste plek (klant heeft meerdere locaties)"].push(`${naam(k)} (${k.klantnr || "?"}): staat nu op ${os[0].adres}`);
    for (const o of k.opdrachten || []) {
      if (o.actief === false) continue;
      const job = all.find(x => x.hoofdKlantId === k.id && x.opdrachtId === o.id && x.actief !== false); if (!job) continue;
      const want = locAdr(k, o.objectId || hoofdLoc(k));
      if (String(job.adres || "") !== String(want || "")) F["Losse opdracht met een ander adres dan de uitvoerlocatie"].push(`${naam(k)} ${nr(k, o)}: planning ${job.adres || "–"}, opdracht ${want || "–"}`);
      const vol = o.volgende || (o.items || []).filter(i => Number(i.aantal) > 0 && i.vol).map(i => i.vol).sort()[0] || "";
      if (!job.gepland && !job.laatst && vol && String(job.aanbodVanaf || "") < vol) F["Losse opdracht wordt eerder aangeboden dan de aanboddatum"].push(`${naam(k)} ${nr(k, o)}: nu ${job.aanbodVanaf || "meteen"}, hoort ${vol}`);
      if (Math.abs((Number(job.prijs) || 0) - (Number(o.prijs) || 0)) > 0.005) F["Losse opdracht met een andere prijs dan in de opdracht"].push(`${naam(k)} ${nr(k, o)}: planning € ${job.prijs}, opdracht € ${o.prijs}`);
    }
  }
  for (const j of all.filter(x => x.hoofdKlantId && x.actief !== false && x.opdrachtId)) {
    const h = all.find(x => x.id === j.hoofdKlantId);
    if (!h || !(h.opdrachten || []).some(o => o.id === j.opdrachtId)) F["Losse opdracht staat aan, maar de opdracht bestaat niet meer"].push(`${naam(j)} (${j.dienst || "?"}, ${j.adres || "?"})`);
  }
  const tel = Object.values(F).reduce((a, l) => a + l.length, 0);
  let md = `# Wekelijkse controle VvE en locaties\n\n${tel ? `**${tel} punt${tel === 1 ? "" : "en"} om na te kijken.** Meestal is openen en opnieuw opslaan van de opdracht genoeg.\n` : "Alles in orde."}\n`;
  for (const [t, l] of Object.entries(F)) if (l.length) md += `\n## ${t}\n${l.map(x => "- " + x).join("\n")}\n`;
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  for (const [t, l] of Object.entries(F)) if (l.length) console.log("::warning title=" + t + "::" + l.join(" | ").slice(0, 3500));
  if (tel) process.exit(1);
})().catch(x => { console.error(x); process.exit(2); });
