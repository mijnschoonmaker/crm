/* Mails voor inloggen (e-mailadres bevestigen, nieuw wachtwoord) in de huisstijl van Mansard, vanaf noreply@mansard.nl,
   met links op app.mansard.nl in plaats van het technische Firebase-adres. Lukt het niet, dan valt de app terug op de
   standaardmail van Firebase. Bij "wachtwoord vergeten" zeggen we nooit of een adres bestaat. */
const crypto = require("crypto");
module.exports = ({ admin, rawDb, onCall, HttpsError, brevoSend, mailHtml, nu }) => {
  const SITE = "https://app.mansard.nl";
  const naarSite = link => { try { const u = new URL(link); return SITE + u.pathname + u.search; } catch (e) { return link; } };
  async function sleutels() { const pl = (await rawDb.doc("platform/geheim").get()).data() || {}, g = (await rawDb.doc("geheim/config").get()).data() || {}; return { key: pl.platformBrevoKey || g.brevoKey, afz: pl.platformAfzender }; }
  /* hooguit 4 mails per adres per uur */
  async function binnenLimiet(email) {
    const ref = rawDb.doc("limiet/authmail_" + crypto.createHash("sha256").update(email).digest("hex").slice(0, 32)), uur = Math.floor(Date.now() / 36e5);
    return rawDb.runTransaction(async t => { const d = (await t.get(ref)).data() || {}; const n = d.uur === uur ? (d.n || 0) : 0; if (n >= 4) return false; t.set(ref, { uur, n: n + 1 }); return true; });
  }
  const mb = afz => ({ naam: "Mansard", email: afz, mailAccent: "#252c3c", strookSub: "Software voor glazenwassers en schoonmakers" });
  const authMail = onCall(async req => {
    const d = req.data || {}, soort = d.soort === "reset" ? "reset" : "verificatie";
    const email = soort === "verificatie" ? String((req.auth && req.auth.token && req.auth.token.email) || "").toLowerCase() : String(d.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) throw new HttpsError("invalid-argument", "Vul een geldig e-mailadres in.");
    const { key, afz } = await sleutels(); if (!key || !afz) throw new HttpsError("unavailable", "standaard");
    if (!(await binnenLimiet(email))) throw new HttpsError("resource-exhausted", "Er zijn net al een paar mails verstuurd. Probeer het over een uur opnieuw.");
    const acs = { url: SITE + "/" };
    let link;
    try { link = soort === "reset" ? await admin.auth().generatePasswordResetLink(email, acs) : await admin.auth().generateEmailVerificationLink(email, acs); }
    catch (e) { if (soort === "reset" && /user-not-found|no user record/i.test(e.code + " " + e.message)) return { ok: true }; console.error("authMail link", e.code || e.message); throw new HttpsError("unavailable", "standaard"); }
    link = naarSite(link);
    const tekst = soort === "reset"
      ? "Hallo,\n\nJe hebt gevraagd om een nieuw wachtwoord voor Mansard. Klik op de knop hieronder om een nieuw wachtwoord te kiezen. De link werkt één keer en is een uur geldig.\n\nHeb je dit niet zelf gevraagd? Dan kun je deze mail negeren; je wachtwoord blijft hetzelfde.\n\nMet vriendelijke groet,\nMansard"
      : "Welkom bij Mansard!\n\nBevestig je e-mailadres met de knop hieronder. Daarna kun je meteen verder met het instellen van je bedrijf.\n\nHeb je geen account aangemaakt? Dan kun je deze mail negeren.\n\nMet vriendelijke groet,\nMansard";
    const knop = { url: link, tekst: soort === "reset" ? "Nieuw wachtwoord kiezen" : "E-mailadres bevestigen" };
    await brevoSend(key, { sender: { name: "Mansard", email: afz }, to: [{ email }], subject: soort === "reset" ? "Nieuw wachtwoord voor Mansard" : "Bevestig je e-mailadres · Mansard", htmlContent: mailHtml(tekst, mb(afz), { knop }), textContent: tekst + "\n\n" + knop.tekst + ": " + link, tags: ["mansard", "auth-" + soort] });
    return { ok: true };
  });
  return { authMail };
};
