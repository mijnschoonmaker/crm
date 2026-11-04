/* Alleen lezen: bij welke actieve klanten kan Mansard geen voornaam vinden? (dezelfde regels als de mails) */
const admin = require("../functions/node_modules/firebase-admin"), fs = require("fs");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore(), src = fs.readFileSync(__dirname + "/../functions/index.js", "utf8");
const voornaamK = eval(src.match(/const voornaamK = ([\s\S]*?\}\)\(\));/)[1]);
const n = (...a) => console.log("::notice title=Voornaam::" + a.join(" "));
(async () => {
  const q = await db.collection("klanten").get();
  const ks = q.docs.map(d => d.data()).filter(k => k.actief !== false && !k.prospect && !k.opdrachtVerwijderd);
  const geen = ks.filter(k => !voornaamK({ voornaam: k.voornaam, contact: k.contact, naam: k.naam, email: k.email }));
  const uitMail = ks.filter(k => !k.voornaam && !k.contact && !String(k.naam || "").includes(",") && voornaamK({ naam: k.naam, email: k.email }));
  n("actieve klanten:", ks.length, "· voornaam gevonden:", ks.length - geen.length, "· geen voornaam:", geen.length, "· uit e-mailadres:", uitMail.length);
  const zak = geen.filter(k => k.soort === "zakelijk" || k.soort === "vve"), part = geen.filter(k => !zak.includes(k));
  n("zonder voornaam, zakelijk:", zak.map(k => String(k.naam || "").slice(0, 40)).join(" | ").slice(0, 3000));
  n("zonder voornaam, particulier:", part.map(k => String(k.naam || "").slice(0, 40)).join(" | ").slice(0, 3000));
})().catch(x => { console.error(x.message); process.exit(1); });
