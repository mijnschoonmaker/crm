/* Foto's/bestanden van gewiste testgegevens opruimen.
   Alleen bestanden in assets/ die (1) in de back-up van het opschonen voorkwamen en (2) nergens meer in de database
   worden genoemd (ook niet bij andere bedrijven) worden verwijderd. MODUS=tellen wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
const fs = require("fs"), path = require("path");
admin.initializeApp({ projectId: process.env.P, storageBucket: process.env.BUCKET || undefined });
const db = admin.firestore();
const tokens = (v, set) => { if (v == null) return; if (typeof v === "string") { (v.match(/[\w-]{6,64}/g) || []).forEach(t => set.add(t)); return; }
  if (Array.isArray(v)) { v.forEach(x => tokens(x, set)); return; } if (typeof v === "object") { if (v.toDate) return; Object.entries(v).forEach(([k, x]) => { tokens(k, set); tokens(x, set); }); } };
async function alleDocs(ref, set) { for (const c of await (ref ? ref.listCollections() : db.listCollections())) {
  for (const d of (await c.get()).docs) { tokens(d.id, set); tokens(d.data(), set); await alleDocs(d.ref, set); } } }
(async () => {
  const modus = process.env.MODUS || "tellen";
  const dir = "backup-in", files = fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).filter(f => String(f).endsWith(".json")) : [];
  if (!files.length) throw new Error("Geen back-up gevonden");
  const uitBackup = new Set(); files.forEach(f => tokens(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), uitBackup));
  const bucket = admin.storage().bucket(process.env.BUCKET || (process.env.P + ".firebasestorage.app"));
  let [lijst] = await bucket.getFiles({ prefix: "assets/" }).catch(() => [[]]);
  if (!lijst.length && !process.env.BUCKET) { const b2 = admin.storage().bucket(process.env.P + ".appspot.com"); [lijst] = await b2.getFiles({ prefix: "assets/" }).catch(() => [[]]); }
  const nog = new Set(); await alleDocs(null, nog);
  const weg = lijst.filter(f => { const id = f.name.slice(7); return uitBackup.has(id) && !nog.has(id); });
  const mb = weg.reduce((a, f) => a + Number(f.metadata.size || 0), 0) / 1048576;
  const msg = { bestandenTotaal: lijst.length, vanTestgegevens: weg.length, mb: Math.round(mb * 10) / 10 };
  console.log("::notice title=Fotos::" + JSON.stringify(msg));
  if (modus !== "wissen") return;
  let n = 0; for (const f of weg) { await f.delete().then(() => n++).catch(e => console.error(f.name, e.message)); }
  console.log("::notice title=Verwijderd::" + n + " bestanden");
})().catch(x => { console.error(x); process.exit(1); });
