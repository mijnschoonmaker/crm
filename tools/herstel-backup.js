/* Een back-up van het CRM terugzetten in Firestore.
   Gebruik (op een computer met Node 18+):
     cd functions && npm install && cd ..
     GOOGLE_APPLICATION_CREDENTIALS=pad/naar/service-account.json node tools/herstel-backup.js backup-2026-10-18.json.gz [collectie ...] [--echt]
   - Zonder --echt laat het alleen zien wat er zou gebeuren (proefdraai).
   - Zonder collecties worden alle collecties uit de back-up teruggezet.
   - Bestaande documenten met hetzelfde id worden overschreven; documenten die niet in de back-up staan blijven staan.
   De back-up komt uit het CRM (Instellingen › Beveiliging & back-ups › Download) of uit Firebase Storage › backups/. */
const fs = require("fs"), zlib = require("zlib"), path = require("path");
const admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
const args = process.argv.slice(2), echt = args.includes("--echt"), [bestand, ...rest] = args.filter(a => a !== "--echt");
if (!bestand) { console.error("Geef het back-upbestand op."); process.exit(1); }
const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(bestand)).toString("utf8"));
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const terug = v => Array.isArray(v) ? v.map(terug) : v && typeof v === "object"
  ? (v.__ts ? admin.firestore.Timestamp.fromDate(new Date(v.__ts)) : v.__geo ? new admin.firestore.GeoPoint(v.__geo[0], v.__geo[1]) : v.__ref ? db.doc(v.__ref) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, terug(x)]))) : v;
(async () => {
  const cols = rest.length ? rest : Object.keys(data.collecties);
  console.log(`Back-up van ${data.gemaakt} (project ${data.project}), ${data.aantal} documenten. ${echt ? "TERUGZETTEN" : "Proefdraai"}:`);
  for (const c of cols) {
    const docs = Object.entries(data.collecties[c] || {});
    console.log(`  ${c}: ${docs.length} documenten`);
    if (!echt) continue;
    for (let i = 0; i < docs.length; i += 400) { const b = db.batch(); docs.slice(i, i + 400).forEach(([id, d]) => b.set(db.collection(c).doc(id), terug(d))); await b.commit(); }
  }
  console.log(echt ? "Klaar." : "Niets veranderd. Voeg --echt toe om echt terug te zetten.");
})().catch(e => { console.error(e); process.exit(1); });
