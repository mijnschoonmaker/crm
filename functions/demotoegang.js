/* Demo-toegang: wie de demo wil bekijken vult een e-mailadres in en krijgt de demo 7 dagen.
   - POST /api/demo/start {email}  -> { ok, token, verloopt }  (hetzelfde adres krijgt dezelfde proefperiode terug, geen verlenging)
   - GET  /api/demo/check?t=TOKEN  -> { ok, verloopt } of { ok:false, verlopen:true }
   Per adres wordt één keer een mail met een persoonlijke link gestuurd (zo werkt de demo ook op een ander apparaat).
   Aanvragen staan in de collectie demoAanvragen (beheer kan ze daar zien). */
const crypto = require("crypto");
module.exports = ({ rawDb, onRequest, brevoSend, mailHtml }) => {
  const DAGEN = 7, SITE = "https://app.mansard.nl";
  const h = s => crypto.createHash("sha256").update(String(s)).digest("hex");
  async function sleutels() { const pl = (await rawDb.doc("platform/geheim").get()).data() || {}, g = (await rawDb.doc("geheim/config").get()).data() || {}; return { key: pl.platformBrevoKey || g.brevoKey, afz: pl.platformAfzender }; }
  /* hooguit 20 aanvragen per IP per uur */
  async function binnenLimiet(ip) {
    const ref = rawDb.doc("limiet/demo_" + h(ip || "?").slice(0, 32)), uur = Math.floor(Date.now() / 36e5);
    return rawDb.runTransaction(async t => { const d = (await t.get(ref)).data() || {}; const n = d.uur === uur ? (d.n || 0) : 0; if (n >= 20) return false; t.set(ref, { uur, n: n + 1 }); return true; });
  }
  const datumNl = ms => new Date(ms).toLocaleDateString("nl-NL", { day: "numeric", month: "long", timeZone: "Europe/Amsterdam" });
  const demoToegang = onRequest({ cors: true, memory: "256MiB", timeoutSeconds: 30 }, async (req, res) => {
    try {
      const pad = String(req.path || "").replace(/^\/api\/demo/, "");
      if (pad.startsWith("/check")) {
        const t = String(req.query.t || "").trim();
        if (!/^[a-f0-9]{40}$/.test(t)) { res.json({ ok: false }); return; }
        const d = (await rawDb.doc("demoToken/" + t).get()).data();
        if (!d) { res.json({ ok: false }); return; }
        if (Date.now() > d.verloopt) { res.json({ ok: false, verlopen: true }); return; }
        rawDb.doc("demoAanvragen/" + d.id).set({ laatstGezien: new Date().toISOString() }, { merge: true }).catch(() => {});
        res.json({ ok: true, verloopt: d.verloopt }); return;
      }
      if (pad.startsWith("/start") && req.method === "POST") {
        const email = String((req.body && req.body.email) || "").trim().toLowerCase().slice(0, 200);
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { res.status(400).json({ ok: false, fout: "Vul een geldig e-mailadres in." }); return; }
        const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
        if (!(await binnenLimiet(ip))) { res.status(429).json({ ok: false, fout: "Te veel aanvragen. Probeer het over een uur opnieuw." }); return; }
        const id = h(email).slice(0, 32), ref = rawDb.doc("demoAanvragen/" + id), bestaand = (await ref.get()).data();
        if (bestaand && bestaand.token) {
          if (Date.now() > bestaand.verloopt) { res.json({ ok: false, verlopen: true }); return; }
          res.json({ ok: true, token: bestaand.token, verloopt: bestaand.verloopt }); return;
        }
        const token = crypto.randomBytes(20).toString("hex"), start = Date.now(), verloopt = start + DAGEN * 864e5;
        await rawDb.doc("demoToken/" + token).set({ id, verloopt });
        await ref.set({ email, token, start: new Date(start).toISOString(), verloopt, gemaakt: new Date().toISOString() });
        try {
          const { key, afz } = await sleutels();
          if (key && afz) {
            const link = SITE + "/demo/?t=" + token;
            const tekst = `Welkom bij de demo van Mansard!\n\nU kunt de demo ${DAGEN} dagen gebruiken, tot en met ${datumNl(verloopt)}. Met de knop hieronder opent u de demo op elk apparaat, ook op uw telefoon.\n\nIn de demo ziet u een voorbeeldbedrijf met klanten, planning, facturen en het klantportaal. Wat u verandert wordt niet bewaard, dus probeer gerust alles uit.\n\nMet vriendelijke groet,\nMansard`;
            await brevoSend(key, { sender: { name: "Mansard", email: afz }, to: [{ email }], subject: "Uw demo van Mansard (" + DAGEN + " dagen)", htmlContent: mailHtml(tekst, { naam: "Mansard", email: afz, mailAccent: "#252c3c", strookSub: "Software voor glazenwassers en schoonmakers" }, { knop: { url: link, tekst: "Open de demo" } }), textContent: tekst + "\n\n" + link });
          }
        } catch (e) { console.error("demo mail", e.message); }
        res.json({ ok: true, token, verloopt }); return;
      }
      res.status(404).json({ ok: false });
    } catch (e) { console.error("demoToegang", e); res.status(500).json({ ok: false, fout: "Er ging iets mis. Probeer het opnieuw." }); }
  });
  return { demoToegang };
};
