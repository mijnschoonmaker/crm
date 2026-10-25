/* Mansard als platform: een nieuw bedrijf aanmelden (30 dagen gratis), de status van het abonnement lezen.
   Een bedrijf = bedrijven/<id> (naam, eigenaar, status, proefTot, plan) met daaronder al zijn gegevens. */
module.exports = ({ rawDb, T, onCall, onRequestRaw, HttpsError, nu, mollie, HOST }) => {
  const PLAN = { naam: "Mansard", prijs: 99, inbegrepen: 3, extraPrijs: 19.95, proefDagen: 30 };
  const emailVan = auth => { const a = auth && auth.token; if (!a || !a.email_verified) throw new HttpsError("unauthenticated", "Bevestig eerst je e-mailadres."); return String(a.email || "").toLowerCase(); };

  const bedrijfAanmaken = onCall(async req => {
    const e = emailVan(req.auth), d = req.data || {};
    const naam = String(d.naam || "").trim().slice(0, 80), tel = String(d.telefoon || "").trim().slice(0, 30), plaats = String(d.plaats || "").trim().slice(0, 60);
    if (naam.length < 2) throw new HttpsError("invalid-argument", "Vul de naam van je bedrijf in.");
    const g = await rawDb.doc("gebruikers/" + e).get();
    if (g.exists) throw new HttpsError("already-exists", "Dit e-mailadres hoort al bij een bedrijf. Log opnieuw in.");
    let bid = T.nieuwBid(); for (let i = 0; i < 5 && (await rawDb.doc("bedrijven/" + bid).get()).exists; i++) bid = T.nieuwBid();
    const proefTot = new Date(Date.now() + PLAN.proefDagen * 864e5).toISOString().slice(0, 10);
    const b = rawDb.batch();
    b.set(rawDb.doc("bedrijven/" + bid), { naam, eigenaar: e, telefoon: tel, plaats, status: "proef", proefTot, proefDemo: true, plan: PLAN, gebruikers: 1, aangemaakt: nu() });
    b.set(rawDb.doc("gebruikers/" + e), { bedrijf: bid, rol: "eigenaar", naam: String((req.auth.token && req.auth.token.name) || ""), toegevoegd: nu() });
    b.set(rawDb.doc("bedrijven/" + bid + "/instellingen/bedrijf"), { naam, email: e, telefoon: tel, plaats, btw: 21, incl: true, termijn: 14, liveMail: true, portaalKnop: true, aangemaakt: nu() });
    await b.commit();
    try { await rawDb.collection("aanmeldingen").add({ bid, naam, email: e, telefoon: tel, plaats, op: nu() }); } catch (x) {}
    return { bid, proefTot };
  });

  const abonnement = onCall(async req => {
    emailVan(req.auth);
    if (T.isLegacy()) return { status: "eigen", plan: PLAN };
    const s = await rawDb.doc("bedrijven/" + T.bid()).get(), d = s.data() || {};
    const n = (await rawDb.collection("gebruikers").where("bedrijf", "==", T.bid()).get()).size;
    return { status: d.status, achterstand: !!d.achterstand, respijtTot: d.achterstand ? respijtTot(d) : "", proefTot: d.proefTot || "", plan: d.plan || PLAN, gebruikers: n, naam: d.naam };
  });

  /* ---------- abonnement via Mollie (account van Mansard zelf) ---------- */
  const r2 = n => Math.round(n * 100) / 100;
  const vandaag = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
  /* na een mislukte betaling nog 14 dagen gewoon doorwerken; daarna dicht tot er (via "Nu betalen") betaald is */
  const RESPIJT = 14, respijtTot = b => { const x = new Date(String(b.foutOp || nu()).slice(0, 10) + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + RESPIJT); return x.toISOString().slice(0, 10); };
  const plusMaand = d => { const x = new Date(d + "T12:00:00Z"); x.setUTCMonth(x.getUTCMonth() + 1); return x.toISOString().slice(0, 10); };
  async function sleutel() { const pl = (await rawDb.doc("platform/geheim").get()).data() || {}, g = (await rawDb.doc("geheim/config").get()).data() || {}; const k = pl.mansardMollieKey || g.mansardMollieKey || g.mollieKey; if (!k) throw new HttpsError("failed-precondition", "Betalen is nog niet ingesteld bij Mansard."); return k; }
  async function aantalGebruikers(bid) { return (await rawDb.collection("gebruikers").where("bedrijf", "==", bid).get()).size; }
  const bedragVoor = (n, plan = PLAN) => r2(plan.prijs + Math.max(0, n - plan.inbegrepen) * plan.extraPrijs);
  async function eigenaarVan(auth) {
    const e = emailVan(auth); if (T.isLegacy()) throw new HttpsError("failed-precondition", "Dit bedrijf heeft geen abonnement nodig.");
    const g = (await rawDb.doc("gebruikers/" + e).get()).data() || {};
    if (g.bedrijf !== T.bid() || g.rol !== "eigenaar") throw new HttpsError("permission-denied", "Alleen de eigenaar kan het abonnement regelen.");
    return e;
  }
  const basisOk = s => { const u = String(s || ""); return /^https:\/\/[a-z0-9.-]+$/i.test(u) && /(\.web\.app|\.firebaseapp\.com|(^|\.)mansard\.(nl|be|it|uk|co\.uk|eu|com)|(^|\.)mijnschoonmaker\.com)$/.test(u.replace(/^https:\/\//, "")) ? u : HOST(); };

  const abonnementStart = onCall(async req => {
    const e = await eigenaarVan(req.auth), bid = T.bid(), ref = rawDb.doc("bedrijven/" + bid), b = (await ref.get()).data() || {};
    if (b.status === "actief" && b.mollieSub && !b.achterstand) return { al: true };
    const key = await sleutel(), basis = basisOk((req.data || {}).basis), n = await aantalGebruikers(bid), plan = b.plan || PLAN;
    let cid = b.mollieCustomer;
    if (!cid) { const c = await mollie(key, "customers", { method: "POST", body: JSON.stringify({ name: b.naam || e, email: e, metadata: { mansard: bid } }) }); cid = c.id; await ref.set({ mollieCustomer: cid }, { merge: true }); }
    const inProef = b.status === "proef" && String(b.proefTot || "") > vandaag();
    const bedrag = inProef ? 0.01 : bedragVoor(n, plan);
    const p = await mollie(key, "payments", { method: "POST", body: JSON.stringify({
      amount: { currency: "EUR", value: bedrag.toFixed(2) }, customerId: cid, sequenceType: "first",
      description: inProef ? "Machtiging Mansard-abonnement" : "Mansard abonnement " + vandaag().slice(0, 7),
      redirectUrl: basis + "/?abonnement=" + bid, webhookUrl: HOST() + "/api/mansard-mollie", metadata: { mansard: bid, soort: "start", inProef } }) });
    await ref.set({ startBetaling: p.id }, { merge: true });
    return { url: p._links && p._links.checkout && p._links.checkout.href };
  });

  async function zetSub(bid, key, startDate) {
    const ref = rawDb.doc("bedrijven/" + bid), b = (await ref.get()).data() || {}, n = await aantalGebruikers(bid);
    if (b.mollieSub) return b.mollieSub;
    const sub = await mollie(key, "customers/" + b.mollieCustomer + "/subscriptions", { method: "POST", body: JSON.stringify({
      amount: { currency: "EUR", value: bedragVoor(n, b.plan || PLAN).toFixed(2) }, interval: "1 month", startDate,
      description: "Mansard abonnement (" + (b.naam || bid) + ")", webhookUrl: HOST() + "/api/mansard-mollie", metadata: { mansard: bid } }) });
    await ref.set({ mollieSub: sub.id, status: "actief", abonnementSinds: nu(), volgende: startDate, bedrag: Number(sub.amount.value), gebruikers: n }, { merge: true });
    return sub.id;
  }

  /* Mollie meldt een betaling van een abonnement (eerste betaling of maandelijkse afschrijving) */
  const mansardHook = onRequestRaw(async (req, res) => {
    const id = (req.body && req.body.id) || "";
    if (!/^tr_\w+$/.test(id)) { res.status(400).send("geen id"); return; }
    try {
      const key = await sleutel(), p = await mollie(key, "payments/" + id), bid = p.metadata && p.metadata.mansard;
      if (!bid || !T.BID_RE.test(bid)) { res.send("ok"); return; }
      const ref = rawDb.doc("bedrijven/" + bid), b = (await ref.get()).data() || {};
      await rawDb.collection("bedrijven/" + bid + "/abonnementBetalingen").doc(p.id).set({ status: p.status, bedrag: Number(p.amount.value), op: p.paidAt || p.createdAt, soort: p.sequenceType, omschrijving: p.description || "" }, { merge: true });
      if (p.metadata.soort === "start" && p.status === "paid" && p.mandateId) {
        await ref.set({ mollieMandate: p.mandateId }, { merge: true });
        const start = p.metadata.inProef && String(b.proefTot || "") > vandaag() ? b.proefTot : plusMaand(vandaag());
        await zetSub(bid, key, start);
        if (!p.metadata.inProef) await ref.set({ betaaldTot: start, status: "actief", achterstand: false }, { merge: true });
      } else if (p.subscriptionId && p.status === "paid") {
        await ref.set({ status: "actief", betaaldTot: plusMaand(vandaag()), laatsteBetaling: p.paidAt || nu(), achterstand: false }, { merge: true });
      } else if (p.subscriptionId && ["failed", "expired", "canceled"].includes(p.status)) {
        await ref.set({ achterstand: true, laatsteFout: p.status, foutOp: b.achterstand && b.foutOp ? b.foutOp : nu() }, { merge: true });
      }
      res.send("ok");
    } catch (e) { console.error("mansardHook", e); res.status(500).send("fout"); }
  });

  /* na het toevoegen of verwijderen van een gebruiker: het maandbedrag aanpassen */
  const abonnementBijwerken = onCall(async req => {
    await eigenaarVan(req.auth); const bid = T.bid(), ref = rawDb.doc("bedrijven/" + bid), b = (await ref.get()).data() || {}, n = await aantalGebruikers(bid), bedrag = bedragVoor(n, b.plan || PLAN);
    if (b.mollieSub && b.mollieCustomer && Number(b.bedrag) !== bedrag) {
      const key = await sleutel();
      await mollie(key, "customers/" + b.mollieCustomer + "/subscriptions/" + b.mollieSub, { method: "PATCH", body: JSON.stringify({ amount: { currency: "EUR", value: bedrag.toFixed(2) } }) });
    }
    await ref.set({ gebruikers: n, bedrag }, { merge: true });
    return { gebruikers: n, bedrag };
  });

  const abonnementStoppen = onCall(async req => {
    await eigenaarVan(req.auth); const bid = T.bid(), ref = rawDb.doc("bedrijven/" + bid), b = (await ref.get()).data() || {};
    if (b.mollieSub && b.mollieCustomer) { const key = await sleutel(); try { await mollie(key, "customers/" + b.mollieCustomer + "/subscriptions/" + b.mollieSub, { method: "DELETE" }); } catch (e) { console.error(e); } }
    await ref.set({ status: "opgezegd", opgezegdOp: nu(), mollieSub: "" }, { merge: true });
    return { tot: b.betaaldTot || b.proefTot || "" };
  });

  /* mag dit bedrijf het CRM gebruiken? (proef nog niet voorbij, of een actief/opgezegd-maar-betaald abonnement) */
  async function magGebruiken() {
    if (T.isLegacy()) return true;
    const b = (await rawDb.doc("bedrijven/" + T.bid()).get()).data() || {}, d = vandaag();
    if (b.status === "actief") return !b.achterstand || respijtTot(b) >= d;
    if (b.status === "proef") return String(b.proefTot || "") >= d;
    if (b.status === "opgezegd") return String(b.betaaldTot || b.proefTot || "") >= d;
    return false;
  }

  return { functies: { bedrijfAanmaken, abonnement, abonnementStart, abonnementBijwerken, abonnementStoppen, mansardHook }, PLAN, magGebruiken };
};
