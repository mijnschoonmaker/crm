/* Vragen van niet-klanten (vanaf de prijscalculator op de website).
   Los van de tickets van bestaande klanten: geen klantkaart, en afgesloten vragen worden na 30 dagen gewist.
   - POST /api/vraag {actie:"start", naam, email, telefoon, tekst}  -> { ok, id, t }
   - POST /api/vraag {actie:"bericht", id, t, tekst}                -> { ok }
   - GET  /api/vraag?id=..&t=..                                      -> { ok, status, berichten:[{van,tekst,op,naam}] }
   - vraagMelding (CRM): seintje per mail naar de vraagsteller, met een knop naar het gesprek (het antwoord zelf staat alleen in het ticketscherm)
   - vragenOpruimen (elke nacht): afgesloten vragen ouder dan 30 dagen weg */
const crypto = require("crypto");
module.exports = ({ db, onRequest, onCall, onSchedule, HttpsError, brevoSend, mailHtml, checkGebruiker, geheim, bedrijf, newId, nu, isLegacy }) => {
  const h = s => crypto.createHash("sha256").update(String(s)).digest("hex");
  const schoon = (s, n) => String(s || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n);
  const ipVan = req => String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
  async function binnenLimiet(ip, max) {
    const uur = new Date().toISOString().slice(0, 13), ref = db.doc("limiet/v" + h(ip + uur).slice(0, 32));
    return db.runTransaction(async t => { const s = await t.get(ref); const n = (s.exists ? s.data().n : 0) + 1; t.set(ref, { n, uur }); return n <= max; });
  }
  async function leesVraag(id, tok) {
    if (!/^vr[a-z0-9]{6,40}$/i.test(String(id || "")) || !tok) return null;
    const s = await db.doc("vragen/" + id).get(); if (!s.exists) return null; const v = s.data();
    const th = h(tok); if (!(v.tokenHash === th || (v.mailTokens || []).includes(th))) return null; return { ref: s.ref, v };
  }
  async function meldTeam(v, tekst, nieuw) {
    try { const [g, b] = await Promise.all([geheim(), bedrijf()]); if (!g.brevoKey || !(g.meldAdres || b.email)) return;
      await brevoSend(g.brevoKey, { sender: { name: "Mansard CRM", email: g.afzender || b.email }, to: [{ email: g.meldAdres || b.email }],
        subject: (nieuw ? "Nieuwe vraag van de website: " : "Nieuw bericht van ") + v.naam,
        textContent: [(nieuw ? "Nieuwe vraag via de website (nog geen klant)" : "Nieuw bericht op een vraag via de website"), "", "Naam: " + v.naam, v.email ? "E-mail: " + v.email : "", v.telefoon ? "Telefoon: " + v.telefoon : "", "", tekst, "", "Beantwoord de vraag in het CRM (icoon Vragen)."].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n") });
    } catch (e) { console.error("vraag melding team", e.message); }
  }
  const vragen = onRequest({ cors: true, memory: "256MiB", timeoutSeconds: 30 }, async (req, res) => {
    res.set("cache-control", "no-store");
    try {
      if (req.method === "GET") {
        const x = await leesVraag(req.query.id, req.query.t); if (!x) { res.status(404).json({ ok: false }); return; }
        const q = await db.collection("vraagBerichten").where("vraagId", "==", req.query.id).get();
        const berichten = q.docs.map(d => d.data()).filter(m => !m.systeem).sort((a, b) => String(a.op).localeCompare(String(b.op))).map(m => ({ van: m.van, tekst: m.tekst, op: m.op, naam: m.van === "team" ? (m.doorNaam || "") : "" }));
        await x.ref.set({ gezienBezoeker: nu(), ongelezenBezoeker: 0 }, { merge: true });
        res.json({ ok: true, status: x.v.status || "open", naam: x.v.naam || "", berichten }); return;
      }
      if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
      const b = typeof req.body === "object" && req.body ? req.body : (() => { try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; } })();
      if (b.website_url) { res.json({ ok: true }); return; } /* honeypot */
      const ip = ipVan(req);
      if (b.actie === "start") {
        if (!(await binnenLimiet(ip, 6))) { res.status(429).json({ ok: false, fout: "Te veel berichten. Probeer het later opnieuw." }); return; }
        const naam = schoon(b.naam, 80), email = schoon(b.email, 120).toLowerCase(), telefoon = schoon(b.telefoon, 30), tekst = schoon(b.tekst, 2000);
        if (!naam || !tekst || (!email && !telefoon)) { res.status(400).json({ ok: false, fout: "Vul uw naam, uw vraag en uw e-mailadres of telefoonnummer in." }); return; }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) { res.status(400).json({ ok: false, fout: "Controleer uw e-mailadres." }); return; }
        const id = newId("vr"), tok = crypto.randomBytes(18).toString("hex"), op = nu();
        const tel = await db.runTransaction(async t => { const r = db.doc("tellers/vragen"), x = await t.get(r); const v = (x.exists ? x.data().n : 100) + 1; t.set(r, { n: v }); return v; }).catch(() => Date.now() % 10000);
        const pagina = /^\/webshop\/[a-z0-9-]{1,60}\.html$/i.test(String(b.pagina || "")) ? String(b.pagina) : "";
        const v = { naam, email, telefoon, pagina, nummer: "V-" + tel, tokenHash: h(tok), status: "open", aangemaakt: op, laatst: op, laatsteTekst: tekst.slice(0, 200), laatsteVan: "bezoeker", ongelezenTeam: 1, ongelezenBezoeker: 0, bron: "website" };
        await db.doc("vragen/" + id).set(v);
        await db.collection("vraagBerichten").doc(newId("vb")).set({ vraagId: id, van: "bezoeker", tekst, op });
        meldTeam(v, tekst, true);
        res.json({ ok: true, id, t: tok }); return;
      }
      if (b.actie === "bericht") {
        if (!(await binnenLimiet(ip, 40))) { res.status(429).json({ ok: false, fout: "Te veel berichten. Probeer het later opnieuw." }); return; }
        const x = await leesVraag(b.id, b.t); if (!x) { res.status(404).json({ ok: false }); return; }
        const tekst = schoon(b.tekst, 2000); if (!tekst) { res.status(400).json({ ok: false }); return; }
        const op = nu();
        await db.collection("vraagBerichten").doc(newId("vb")).set({ vraagId: b.id, van: "bezoeker", tekst, op });
        const FV = require("firebase-admin").firestore.FieldValue;
        await x.ref.set({ laatst: op, laatsteTekst: tekst.slice(0, 200), laatsteVan: "bezoeker", ongelezenTeam: FV.increment(1), ...(x.v.status === "opgelost" ? { status: "open" } : {}) }, { merge: true });
        meldTeam(x.v, tekst, false);
        res.json({ ok: true }); return;
      }
      res.status(400).json({ ok: false });
    } catch (e) { console.error("vragen", e); res.status(500).json({ ok: false, fout: "Er ging iets mis. Probeer het opnieuw." }); }
  });
  /* seintje per mail naar de vraagsteller (alleen als er een e-mailadres is): het antwoord staat niet in de mail, de knop opent het gesprek */
  const vraagMelding = onCall(async req => {
    await checkGebruiker(req.auth);
    const id = String((req.data || {}).vraagId || ""); const s = await db.doc("vragen/" + id).get(); if (!s.exists) throw new HttpsError("not-found", "Vraag niet gevonden.");
    const v = s.data(); if (!v.email) return { ok: true, mail: false };
    const [g, b] = await Promise.all([geheim(), bedrijf()]); if (!g.brevoKey) return { ok: true, mail: false };
    const pagina = v.pagina || (isLegacy && isLegacy() ? "/webshop/mijnschoonmaker.html" : "");
    if (!pagina) return { ok: true, mail: false, reden: "geen pagina" };
    /* eigen sleutel voor de link in deze mail (de sleutel in de browser van de bezoeker blijft geldig) */
    const tok = crypto.randomBytes(18).toString("hex");
    await s.ref.set({ mailTokens: [...(v.mailTokens || []), h(tok)].slice(-5) }, { merge: true });
    const url = "https://app.mansard.nl" + pagina + "?vraag=" + encodeURIComponent(id) + "&t=" + tok;
    const voor = String(v.naam || "").split(/\s+/)[0] || "";
    const tekst = `Beste ${voor},\n\nEr staat een antwoord voor u klaar op uw vraag${v.nummer ? " (" + v.nummer + ")" : ""}. Met de knop hieronder opent u het gesprek en kunt u ook direct reageren.`;
    const onder = `Met vriendelijke groet,\n${b.naam || ""}`;
    await brevoSend(g.brevoKey, { sender: { name: b.naam || "Glazenwasser", email: g.afzender || b.email }, to: [{ email: v.email, name: v.naam || undefined }],
      subject: "Er staat een antwoord voor u klaar" + (v.nummer ? " (" + v.nummer + ")" : ""), htmlContent: mailHtml(tekst, b, { knop: { url, tekst: "Bekijk het antwoord" }, onder, zonderStrook: true }),
      textContent: tekst + "\n\n" + url + "\n\n" + onder });
    return { ok: true, mail: true };
  });
  /* privacy: afgesloten vragen ouder dan 30 dagen (en open vragen zonder bericht in 90 dagen) wissen, met berichten */
  const vragenOpruimen = onSchedule({ schedule: "23 3 * * *", timeZone: "Europe/Amsterdam", timeoutSeconds: 300 }, async () => {
    const grens = new Date(Date.now() - 30 * 864e5).toISOString(), grensOpen = new Date(Date.now() - 90 * 864e5).toISOString();
    const q = await db.collection("vragen").get();
    for (const d of q.docs) { const v = d.data(); const oud = v.status === "opgelost" ? String(v.laatst || v.opgelostOp || "") < grens : String(v.laatst || "") < grensOpen; if (!oud) continue;
      try { const bq = await db.collection("vraagBerichten").where("vraagId", "==", d.id).get(); for (const m of bq.docs) await m.ref.delete(); await d.ref.delete(); } catch (e) { console.error("vraag opruimen", d.id, e.message); } }
  });
  return { vragen, vraagMelding, vragenOpruimen };
};
