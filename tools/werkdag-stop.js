/* Werkdag van één dag corrigeren: "Terug bij de loods" = vertrek + MINUTEN. Wijzigt alleen routes/<dag>.werk.stop (en zet gecorrigeerd). */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const meld = t => { console.log(t); console.log("::notice title=Werkdag::" + String(t).replace(/\n/g, " ")); };
(async () => {
  const dag = String(process.env.DAG || "").trim(), min = Number(process.env.MINUTEN);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dag) || !(min > 0 && min < 24 * 60)) throw new Error("dag of minuten ongeldig");
  const ref = db.doc("routes/" + dag), s = await ref.get(); const w = (s.data() || {}).werk;
  if (!w || !w.start) throw new Error("geen werkdag met vertrek op " + dag);
  const stop = new Date(new Date(w.start).getTime() + min * 6e4).toISOString();
  meld("voor: start=" + w.start + " stop=" + (w.stop || ""));
  await ref.update({ "werk.stop": stop, "werk.gecorrigeerd": new Date().toISOString() });
  meld("na: stop=" + stop + " (" + new Date(stop).toLocaleTimeString("nl-NL", { timeZone: "Europe/Amsterdam" }) + ")");
})().catch(e => { console.error(e); console.log("::error title=Werkdag::" + e.message); process.exit(1); });
