/* Opschonen van het CRM van het eerste bedrijf (de collecties in de root, NIET bedrijven/...).
   MODUS=tellen: alleen tellen wat er staat (niets wijzigen).
   MODUS=wissen: eerst een back-up (JSON, als artifact van de run), dan de genoemde collecties leegmaken. */
const admin = require("../functions/node_modules/firebase-admin");
const fs = require("fs");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const NOOIT = new Set(["instellingen", "geheim", "gebruikers", "mfa", "bedrijven", "mansard", "config", "systeem", "backups"]);
(async () => {
  const modus = process.env.MODUS || "tellen";
  const cols = (await db.listCollections()).map(c => c.id).sort();
  const telling = {};
  for (const c of cols) { if (c === "bedrijven") { telling[c] = "(andere bedrijven, niet aanraken)"; continue; } telling[c] = (await db.collection(c).count().get()).data().count; }
  console.log(JSON.stringify(telling, null, 1));
  console.log("::notice title=Telling::" + JSON.stringify(telling));
  if (modus !== "wissen") return;
  const weg = String(process.env.COLLECTIES || "").split(",").map(s => s.trim()).filter(Boolean);
  const fout = weg.filter(c => NOOIT.has(c) || !cols.includes(c));
  if (fout.length) throw new Error("Niet toegestaan of bestaat niet: " + fout.join(", "));
  const backup = {};
  for (const c of weg) backup[c] = (await db.collection(c).get()).docs.map(d => ({ id: d.id, data: d.data() }));
  fs.mkdirSync("backup", { recursive: true });
  fs.writeFileSync("backup/opschonen-" + new Date().toISOString().slice(0, 19).replace(/:/g, "") + ".json", JSON.stringify(backup));
  const res = {};
  for (const c of weg) { res[c] = backup[c].length; await db.recursiveDelete(db.collection(c)); }
  console.log("::notice title=Gewist::" + JSON.stringify(res));
})().catch(x => { console.error(x); process.exit(1); });
