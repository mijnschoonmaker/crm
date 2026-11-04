/* Alleen lezen: particuliere klanten waarvan de naam op een bedrijf lijkt (bedrijfsnaam in het vak achternaam) */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const BEDR = /(centrum|praktijk|b\.?v\.?\b|v\.?o\.?f\.?\b|stichting|vereniging|transport|service|tuning|bank|mode|agentu|bakkerij|kapsalon|garage|makelaar|apotheek|school|kerk|winkel|restaurant|caf[eé]|hotel|bedrijf|holding|installatie|bouw|groep|kantoor|salon|studio|dier|tuin|verhuur|autobedrijf|machine|logistiek|zorg|fysio|tandarts|huisarts|notaris|advocaat|gemeente|vve|beheer|&)/i;
(async () => {
  const ks = (await db.collection("klanten").get()).docs.map(d => d.data()).filter(k => k.soort !== "zakelijk" && k.soort !== "vve" && !k.opdrachtVerwijderd);
  const hit = ks.filter(k => BEDR.test(String(k.achternaam || k.naam || "")));
  console.log("::notice title=Zakelijk::" + hit.length + " particuliere klanten met een bedrijfsnaam: " + hit.map(k => `${k.naam} (${k.actief === false ? "inactief" : "actief"})`).join(" | ").slice(0, 3000));
})().catch(x => { console.error(x.message); process.exit(1); });
