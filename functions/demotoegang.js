/* Demo-toegang: wie de demo wil bekijken vult een e-mailadres in en krijgt de demo 7 dagen.
   - POST /api/demo/start {email}  -> { ok, token, verloopt }  (hetzelfde adres krijgt dezelfde proefperiode terug, geen verlenging)
   - GET  /api/demo/check?t=TOKEN  -> { ok, verloopt } of { ok:false, verlopen:true }
   Per adres wordt één keer een mail met een persoonlijke link gestuurd (zo werkt de demo ook op een ander apparaat).
   Aanvragen staan in de collectie demoAanvragen (beheer kan ze daar zien). */
const crypto = require("crypto");
module.exports = ({ rawDb, onRequest, onCall, HttpsError, brevoSend, mailHtml, checkGebruiker, EIGENAAR }) => {
  const DAGEN = 7, SITE = "https://app.mansard.nl";
  const h = s => crypto.createHash("sha256").update(String(s)).digest("hex");
  async function sleutels() { const pl = (await rawDb.doc("platform/geheim").get()).data() || {}, g = (await rawDb.doc("geheim/config").get()).data() || {}; return { key: pl.platformBrevoKey || g.brevoKey, afz: pl.platformAfzender }; }
  /* hooguit 20 aanvragen per IP per uur */
  async function binnenLimiet(ip) {
    const ref = rawDb.doc("limiet/demo_" + h(ip || "?").slice(0, 32)), uur = Math.floor(Date.now() / 36e5);
    return rawDb.runTransaction(async t => { const d = (await t.get(ref)).data() || {}; const n = d.uur === uur ? (d.n || 0) : 0; if (n >= 20) return false; t.set(ref, { uur, n: n + 1 }); return true; });
  }
  /* plaats waar vandaan iemand de demo opent: bij benadering, uit het IP-adres. Alleen plaats, regio en land worden bewaard, niet het IP-adres. */
  const ipVan = req => String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
  async function plaatsVan(ip) {
    if (!ip || /^(10\.|127\.|192\.168\.|::1|fc|fd)/i.test(ip)) return {};
    try { const r = await fetch("https://ipapi.co/" + encodeURIComponent(ip) + "/json/", { signal: AbortSignal.timeout(3000) }); const j = await r.json(); if (j.error) return {};
      return { plaats: String(j.city || ""), regio: String(j.region || ""), land: String(j.country_name || "") }; } catch (e) { return {}; }
  }
  const apparaat = req => /mobile|iphone|android/i.test(String(req.headers["user-agent"] || "")) ? "telefoon" : /ipad|tablet/i.test(String(req.headers["user-agent"] || "")) ? "tablet" : "computer";
  async function logIn(id, req, soort) {
    try { const ref = rawDb.doc("demoAanvragen/" + id), d = (await ref.get()).data() || {}, L = Array.isArray(d.logins) ? d.logins : [];
      if (soort === "open" && L.length && Date.now() - Date.parse(L[0].op) < 30 * 6e4) { await ref.set({ laatstGezien: new Date().toISOString() }, { merge: true }); return; }
      const pl = await plaatsVan(ipVan(req));
      await ref.set({ laatstGezien: new Date().toISOString(), logins: [{ op: new Date().toISOString(), soort, apparaat: apparaat(req), ...pl }, ...L].slice(0, 30) }, { merge: true });
    } catch (e) { console.error("demo login", e.message); }
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
        await logIn(d.id, req, "open");
        res.json({ ok: true, verloopt: d.verloopt }); return;
      }
      if (pad.startsWith("/start") && req.method === "POST") {
        const email = String((req.body && req.body.email) || "").trim().toLowerCase().slice(0, 200);
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { res.status(400).json({ ok: false, fout: "Vul een geldig e-mailadres in." }); return; }
        const ip = ipVan(req);
        if (!(await binnenLimiet(ip))) { res.status(429).json({ ok: false, fout: "Te veel aanvragen. Probeer het over een uur opnieuw." }); return; }
        const id = h(email).slice(0, 32), ref = rawDb.doc("demoAanvragen/" + id), bestaand = (await ref.get()).data();
        if (bestaand && bestaand.token) {
          if (Date.now() > bestaand.verloopt) { res.json({ ok: false, verlopen: true }); return; }
          await logIn(id, req, "opnieuw aangemeld");
          res.json({ ok: true, token: bestaand.token, verloopt: bestaand.verloopt }); return;
        }
        const token = crypto.randomBytes(20).toString("hex"), start = Date.now(), verloopt = start + DAGEN * 864e5;
        await rawDb.doc("demoToken/" + token).set({ id, verloopt });
        await ref.set({ email, token, start: new Date(start).toISOString(), verloopt, gemaakt: new Date().toISOString() });
        await logIn(id, req, "aangemeld");
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
  /* lijst voor de beheerder van Mansard (alleen de eigenaar van het platform) */
  const demoAanmeldingen = onCall(async req => {
    const e = await checkGebruiker(req.auth); if (e !== EIGENAAR) throw new HttpsError("permission-denied", "Geen toegang.");
    const qs = await rawDb.collection("demoAanvragen").orderBy("gemaakt", "desc").limit(200).get();
    return { lijst: qs.docs.map(d => { const x = d.data(); return { email: x.email || "", start: x.start || "", verloopt: x.verloopt || 0, laatstGezien: x.laatstGezien || "", logins: (x.logins || []).slice(0, 10) }; }) };
  });
  return { demoToegang, demoAanmeldingen };
};
