/* Alleen lezen: waarom komt een account niet in het CRM? Toont status van het inlogaccount en tweestapsverificatie (geen geheimen). */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
(async () => {
  const e = String(process.env.EMAIL || "").toLowerCase(), db = admin.firestore();
  const u = await admin.auth().getUserByEmail(e).catch(x => null);
  const m = (await db.doc("mfa/" + e).get()).data() || null, g = await db.doc("gebruikers/" + e).get();
  const c = (u && u.customClaims) || {};
  const uit = { bestaat: !!u, emailVerified: u && u.emailVerified, disabled: u && u.disabled, providers: u && u.providerData.map(p => p.providerId),
    laatsteLogin: u && u.metadata.lastSignInTime, laatsteVernieuwing: u && u.metadata.lastRefreshTime, tokensGeldigVanaf: u && u.tokensValidAfterTime,
    mfaClaim: Array.isArray(c.mfa) ? c.mfa.map(t => new Date(t * 1000).toISOString()) : null, mfaDoc: m && { aan: m.aan, sinds: m.sinds, uit: m.uit || "" }, gebruikersDoc: g.exists ? g.data() : null };
  console.log(JSON.stringify(uit, null, 1));
  console.log("::notice title=Toegang " + e + "::" + JSON.stringify(uit).replace(/%/g, "%25"));
})().catch(x => { console.error(x); process.exit(1); });
