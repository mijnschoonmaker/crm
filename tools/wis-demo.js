/* Alle (demo)gegevens wissen vóór het overzetten van de echte klanten.
   Wordt gestart via GitHub › Actions › "Gegevens wissen" (proefdraai tenzij ECHT=ja).
   Eerst gaat er een volledige back-up naar Firebase Storage › backups/voor-wissen-<tijd>.json.gz.
   Blijft staan: instellingen (bedrijf, sjablonen, prijzen, huisstijl, website), gebruikers, tweestapsverificatie, sleutels. */
const OUT = [], _log = console.log; console.log = (...a) => { OUT.push(a.join(" ")); _log(...a); };
process.on("exit", () => _log("::notice title=Resultaat::" + OUT.join("\n").replace(/%/g, "%25").replace(/\n/g, "%0A")));
const zlib = require("zlib"), path = require("path");
const admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));
const P = process.env.P, ECHT = process.env.ECHT === "ja";
const WIS = ["klanten", "beurten", "facturen", "berichten", "kosten", "banktx", "routes", "aanvragen", "tickets", "ticketBerichten", "portaalVerzoeken", "akkoord", "geplandeMails", "tellers", "live", "portaalSessies", "portaalLinks", "portaalLogin", "portaalSessie"];
const INST_WIS = ["aangiftes", "planmails"];
const HOUD = new Set(["instellingen", "gebruikers", "mfa", "geheim"]);
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: P });
const db = admin.firestore();
const ser = v => v instanceof admin.firestore.Timestamp ? { __ts: v.toDate().toISOString() } : v instanceof admin.firestore.GeoPoint ? { __geo: [v.latitude, v.longitude] } : v && typeof v === "object" && v.constructor && v.constructor.name === "DocumentReference" ? { __ref: v.path } : Array.isArray(v) ? v.map(ser) : v && typeof v === "object" && !Buffer.isBuffer(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ser(x)])) : v;
(async () => {
  const cols = await db.listCollections();
  console.log((ECHT ? "ECHT WISSEN" : "PROEFDRAAI") + " in project " + P);
  const wis = [];
  for (const c of cols) {
    const n = (await c.count().get()).data().count;
    const actie = HOUD.has(c.id) ? "blijft" : WIS.includes(c.id) ? "WISSEN" : "blijft (onbekend)";
    console.log(`  ${c.id.padEnd(20)} ${String(n).padStart(6)}  ${actie}`);
    if (actie === "WISSEN") wis.push(c);
  }
  const ks = await db.collection("klanten").limit(12).get();
  console.log("Voorbeelden klanten: " + ks.docs.map(d => d.data().naam || d.id).join(" | "));
  const inst = await db.collection("instellingen").get();
  console.log("Instellingen: " + inst.docs.map(d => d.id + (INST_WIS.includes(d.id) ? " (WISSEN)" : "")).join(", "));
  if (!ECHT) { console.log("Niets gewist. Start opnieuw met ECHT=ja."); return; }
  /* back-up van alles (behalve sleutels) */
  const data = { gemaakt: new Date().toISOString(), project: P, collecties: {} }; let n = 0;
  for (const c of cols) { if (c.id === "geheim") continue; const s = await c.get(); data.collecties[c.id] = Object.fromEntries(s.docs.map(d => [d.id, ser(d.data())])); n += s.size; }
  data.aantal = n;
  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(data)), { level: 9 }), naam = "backups/voor-wissen-" + data.gemaakt.replace(/[:.]/g, "-") + ".json.gz";
  let ok = false;
  for (const b of [P + ".firebasestorage.app", P + ".appspot.com"]) { try { await admin.storage().bucket(b).file(naam).save(gz, { contentType: "application/gzip", resumable: false }); console.log("Back-up opgeslagen: gs://" + b + "/" + naam + " (" + n + " documenten)"); ok = true; break; } catch (e) { console.log("Bucket " + b + ": " + e.message); } }
  if (!ok) throw new Error("Back-up opslaan lukte niet; er is niets gewist.");
  for (const c of wis) { await db.recursiveDelete(c); console.log("Gewist: " + c.id); }
  for (const id of INST_WIS) { await db.doc("instellingen/" + id).delete(); console.log("Gewist: instellingen/" + id); }
  await db.doc("instellingen/bank").set({ laatsteSync: admin.firestore.FieldValue.delete(), laatsteBestand: admin.firestore.FieldValue.delete() }, { merge: true }).catch(() => {});
  await db.doc("geheim/bank").set({ vanaf: "" }, { merge: true }).catch(() => {});
  console.log("Klaar.");
})().catch(e => { console.error(e); process.exit(1); });
