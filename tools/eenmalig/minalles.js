/* Eenmalig, op verzoek van de eigenaar: minimumprijs geldt voor gewone en bijzondere ramen samen. Zet alleen dit ene veld. */
const admin = require("../../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const ref = admin.firestore().doc("instellingen/ramen");
(async () => { const voor = (await ref.get()).data() || {}; await ref.set({ minAlles: true }, { merge: true });
  console.log("::notice title=Instelling::minAlles was " + JSON.stringify(voor.minAlles) + ", nu true · minimum " + voor.min); })().catch(e => { console.error(e); process.exit(1); });
