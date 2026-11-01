/* ---------- Pushmeldingen naar de telefoon (en computer) van het team ----------
   Bij een nieuw ticket of een nieuw klantbericht krijgt elk aangemeld apparaat van dit bedrijf een melding,
   ook als Mansard dicht is of de telefoon vergrendeld in je zak zit.
   - VAPID-sleutels: per bedrijf, door de server zelf aangemaakt en bewaard in geheim/push (nooit leesbaar vanuit de browser).
   - Aanmeldingen: collectie pushAbos (alleen de server leest/schrijft), per apparaat, met het e-mailadres van de gebruiker.
   - Verlopen of ingetrokken aanmeldingen (404/410) ruimt hij zelf op. */
const webpush = require("web-push");
const crypto = require("crypto");

module.exports = function maakPush(ctx) {
  const { db, onCall, checkGebruiker, HttpsError, nu } = ctx;
  const mail = req => String((req.auth && req.auth.token && req.auth.token.email) || "").toLowerCase();
  async function sleutels() {
    const ref = db.doc("geheim/push"), d = (await ref.get()).data() || {};
    if (d.publicKey && d.privateKey) return d;
    const k = webpush.generateVAPIDKeys(); await ref.set(k, { merge: true }); return k;
  }
  const idVan = endpoint => crypto.createHash("sha256").update(String(endpoint)).digest("hex").slice(0, 40);
  const geldig = s => s && typeof s.endpoint === "string" && /^https:\/\/[^\s]{10,800}$/.test(s.endpoint) && s.keys && typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string" && s.keys.p256dh.length < 200 && s.keys.auth.length < 100;

  const pushSleutel = onCall(async req => { await checkGebruiker(req.auth); return { key: (await sleutels()).publicKey }; });

  const pushAbo = onCall(async req => {
    await checkGebruiker(req.auth);
    const { sub, uit, apparaat } = req.data || {};
    if (!geldig(sub)) throw new HttpsError("invalid-argument", "Ongeldige aanmelding.");
    const ref = db.doc("pushAbos/" + idVan(sub.endpoint));
    if (uit) { await ref.delete().catch(() => {}); return { ok: true, uit: true }; }
    await ref.set({ email: mail(req), sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, apparaat: String(apparaat || "").slice(0, 80), op: nu(), tickets: true }, { merge: true });
    return { ok: true };
  });

  /* naar alle aangemelde apparaten van dit bedrijf (of alleen die van één gebruiker) */
  async function stuur(bericht, alleenVoor) {
    try {
      const k = await sleutels(), q = await db.collection("pushAbos").get();
      const lijst = q.docs.filter(d => d.data().tickets !== false && (!alleenVoor || d.data().email === alleenVoor));
      const payload = JSON.stringify({ titel: String(bericht.titel || "Mansard").slice(0, 80), tekst: String(bericht.tekst || "").slice(0, 180), url: bericht.url || "/", tag: bericht.tag || "mansard" });
      let n = 0;
      await Promise.all(lijst.map(async d => {
        try { await webpush.sendNotification(d.data().sub, payload, { vapidDetails: { subject: "https://app.mansard.nl", publicKey: k.publicKey, privateKey: k.privateKey }, TTL: 6 * 3600, urgency: "high", topic: String(bericht.tag || "mansard").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined }); n++; }
        catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) await d.ref.delete().catch(() => {}); else console.error("push", e && e.statusCode, e && e.body); }
      }));
      return n;
    } catch (e) { console.error("push", e); return 0; }
  }

  const pushTest = onCall(async req => {
    await checkGebruiker(req.auth);
    const n = await stuur({ titel: "Mansard", tekst: "Pushmeldingen staan aan. Zo zie je voortaan een nieuw ticket.", url: "/?tickets=1", tag: "test" }, mail(req));
    return { verstuurd: n };
  });

  return { pushSleutel, pushAbo, pushTest, stuur };
};
