/* Mansard als platform: een nieuw bedrijf aanmelden (eerste maand € 1), de status van het abonnement lezen.
   Een bedrijf = bedrijven/<id> (naam, eigenaar, status, proefTot, plan) met daaronder al zijn gegevens. */
module.exports = ({ rawDb, T, onCall, onRequestRaw, HttpsError, nu, mollie, HOST, mfaOk }) => {
  /* pakketten (bedragen excl. btw; Mollie schrijft incl. 21% btw af). De eerste maand (proef) kost € 1. */
  const BTW = 21, STARTPRIJS = 1;
  const PLANS = {
    starter: { key: "starter", naam: "Starter", prijs: 69, inbegrepen: 1, extraPrijs: 0, maxGebruikers: 1, maxKlanten: 150, proefDagen: 30 },
    mansard: { key: "mansard", naam: "Mansard", prijs: 99, inbegrepen: 3, extraPrijs: 19.95, proefDagen: 30 },
  };
  const PLAN = PLANS.mansard;
  const planVan = b => { const p = b && b.plan; if (p && PLANS[p.key]) return PLANS[p.key]; if (p && p.naam === "Starter") return PLANS.starter; return PLANS.mansard; };
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
    return { status: d.status, achterstand: !!d.achterstand, respijtTot: d.achterstand ? respijtTot(d) : "", proefTot: d.proefTot || "", plan: planVan(d), plans: PLANS, btw: BTW, startPrijs: STARTPRIJS, gebruikers: n, naam: d.naam };
  });

  /* ---------- abonnement via Mollie (account van Mansard zelf) ---------- */
  const r2 = n => Math.round(n * 100) / 100;
  const vandaag = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
  /* na een mislukte betaling nog 14 dagen gewoon doorwerken; daarna dicht tot er (via "Nu betalen") betaald is */
  const RESPIJT = 14, respijtTot = b => { const x = new Date(String(b.foutOp || nu()).slice(0, 10) + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + RESPIJT); return x.toISOString().slice(0, 10); };
  const plusMaand = d => { const x = new Date(d + "T12:00:00Z"); x.setUTCMonth(x.getUTCMonth() + 1); return x.toISOString().slice(0, 10); };
  async function sleutel() { const pl = (await rawDb.doc("platform/geheim").get()).data() || {}, g = (await rawDb.doc("geheim/config").get()).data() || {}; const k = pl.mansardMollieKey || g.mansardMollieKey || g.mollieKey; if (!k) throw new HttpsError("failed-precondition", "Betalen is nog niet ingesteld bij Mansard."); return k; }
  async function aantalGebruikers(bid) { return (await rawDb.collection("gebruikers").where("bedrijf", "==", bid).get()).size; }
  const exclVoor = (n, plan = PLAN) => r2(plan.prijs + Math.max(0, n - plan.inbegrepen) * (plan.extraPrijs || 0));
  /* wat Mollie afschrijft: incl. btw */
  const bedragVoor = (n, plan = PLAN) => r2(exclVoor(n, plan) * (1 + BTW / 100));
  /* actieve klanten: alles behalve wat op inactief staat (oude klanten zonder het veld tellen mee) */
  async function aantalKlanten(bid) { const c = rawDb.collection("bedrijven/" + bid + "/klanten"); try { const [alle, uit] = await Promise.all([c.count().get(), c.where("actief", "==", false).count().get()]); return alle.data().count - uit.data().count; } catch (e) { return 0; } }
  async function pastInPlan(bid, plan) {
    const n = await aantalGebruikers(bid);
    if (plan.maxGebruikers && n > plan.maxGebruikers) throw new HttpsError("failed-precondition", "Het pakket " + plan.naam + " is voor " + plan.maxGebruikers + " gebruiker. Verwijder eerst andere gebruikers of kies het pakket Mansard.");
    if (plan.maxKlanten) { const k = await aantalKlanten(bid); if (k > plan.maxKlanten) throw new HttpsError("failed-precondition", "Je hebt " + k + " klanten. Het pakket " + plan.naam + " is voor maximaal " + plan.maxKlanten + " klanten. Kies het pakket Mansard."); }
    return n;
  }
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
    const gekozen = PLANS[String((req.data || {}).plan || "")] || planVan(b);
    const n = await pastInPlan(bid, gekozen), plan = gekozen;
    if (!b.plan || b.plan.key !== plan.key) await ref.set({ plan }, { merge: true });
    const key = await sleutel(), basis = basisOk((req.data || {}).basis);
    let cid = b.mollieCustomer;
    if (!cid) { const c = await mollie(key, "customers", { method: "POST", body: JSON.stringify({ name: b.naam || e, email: e, metadata: { mansard: bid } }) }); cid = c.id; await ref.set({ mollieCustomer: cid }, { merge: true }); }
    const inProef = b.status === "proef" && String(b.proefTot || "") > vandaag();
    /* tijdens de eerste maand: € 1 (incl. btw) en het abonnement gaat pas na die maand in */
    const bedrag = inProef ? STARTPRIJS : bedragVoor(n, plan);
    const p = await mollie(key, "payments", { method: "POST", body: JSON.stringify({
      amount: { currency: "EUR", value: bedrag.toFixed(2) }, customerId: cid, sequenceType: "first",
      description: inProef ? "Mansard " + plan.naam + " · eerste maand" : "Mansard " + plan.naam + " " + vandaag().slice(0, 7),
      redirectUrl: basis + "/?abonnement=" + bid, webhookUrl: HOST() + "/api/mansard-mollie", metadata: { mansard: bid, soort: "start", inProef } }) });
    await ref.set({ startBetaling: p.id }, { merge: true });
    return { url: p._links && p._links.checkout && p._links.checkout.href };
  });

  async function zetSub(bid, key, startDate) {
    const ref = rawDb.doc("bedrijven/" + bid), b = (await ref.get()).data() || {}, n = await aantalGebruikers(bid);
    if (b.mollieSub) return b.mollieSub;
    const sub = await mollie(key, "customers/" + b.mollieCustomer + "/subscriptions", { method: "POST", body: JSON.stringify({
      amount: { currency: "EUR", value: bedragVoor(n, planVan(b)).toFixed(2) }, interval: "1 month", startDate,
      description: "Mansard " + planVan(b).naam + " (" + (b.naam || bid) + ")", webhookUrl: HOST() + "/api/mansard-mollie", metadata: { mansard: bid } }) });
    await ref.set({ mollieSub: sub.id, status: "actief", abonnementSinds: nu(), volgende: startDate, bedrag: Number(sub.amount.value), bedragExcl: exclVoor(n, planVan(b)), gebruikers: n }, { merge: true });
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
    await eigenaarVan(req.auth); const bid = T.bid(), ref = rawDb.doc("bedrijven/" + bid), b = (await ref.get()).data() || {}, n = await aantalGebruikers(bid), bedrag = bedragVoor(n, planVan(b));
    if (b.mollieSub && b.mollieCustomer && Number(b.bedrag) !== bedrag) {
      const key = await sleutel();
      await mollie(key, "customers/" + b.mollieCustomer + "/subscriptions/" + b.mollieSub, { method: "PATCH", body: JSON.stringify({ amount: { currency: "EUR", value: bedrag.toFixed(2) } }) });
    }
    await ref.set({ gebruikers: n, bedrag, bedragExcl: exclVoor(n, planVan(b)) }, { merge: true });
    return { gebruikers: n, bedrag };
  });

  /* ander pakket kiezen (Starter <-> Mansard); het maandbedrag past zich meteen aan */
  const abonnementPlan = onCall(async req => {
    await eigenaarVan(req.auth); const bid = T.bid(), ref = rawDb.doc("bedrijven/" + bid), b = (await ref.get()).data() || {};
    const plan = PLANS[String((req.data || {}).plan || "")]; if (!plan) throw new HttpsError("invalid-argument", "Onbekend pakket.");
    const n = await pastInPlan(bid, plan), bedrag = bedragVoor(n, plan);
    if (b.mollieSub && b.mollieCustomer) { const key = await sleutel(); await mollie(key, "customers/" + b.mollieCustomer + "/subscriptions/" + b.mollieSub, { method: "PATCH", body: JSON.stringify({ amount: { currency: "EUR", value: bedrag.toFixed(2) }, description: "Mansard " + plan.naam + " (" + (b.naam || bid) + ")" }) }); }
    await ref.set({ plan, gebruikers: n, bedrag, bedragExcl: exclVoor(n, plan), planGewijzigd: nu() }, { merge: true });
    return { plan: plan.key, bedrag };
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

  /* ---------- Mansard-beheer (alleen robin@mansard.nl, met bevestigde tweestapsverificatie als die aan staat) ----------
     Alles werkt alleen op nieuwe bedrijven (bedrijven/b…); het eigen bedrijf in de hoofdcollecties is hier nooit te raken.
     Elke actie komt in beheerLog. */
  const BEHEER_MAIL = "robin@mansard.nl", DATA_COLS = ["klanten","beurten","facturen","routes","instellingen","berichten","kosten","aanvragen","geplandeMails","akkoord","portaalVerzoeken","tickets","ticketBerichten","tellers","live","banktx","abonnementBetalingen"];
  const plusDagen = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const beheer = onCall({ timeoutSeconds: 300, memory: "512MiB" }, async req => {
    const e = emailVan(req.auth); if (e !== BEHEER_MAIL) throw new HttpsError("permission-denied", "Alleen voor Mansard-beheer.");
    if (mfaOk && !(await mfaOk(req.auth))) throw new HttpsError("permission-denied", "Bevestig eerst je inlogcode (tweestapsverificatie).");
    const d = req.data || {}, actie = String(d.actie || "");
    const log = async (bid, tekst) => { try { await rawDb.collection("beheerLog").add({ bid: bid || "", tekst, door: e, op: nu() }); } catch (x) {} };
    if (actie === "log") { const q = await rawDb.collection("beheerLog").orderBy("op", "desc").limit(40).get(); return { log: q.docs.map(x => x.data()) }; }
    const bid = String(d.bid || ""); if (!T.BID_RE.test(bid)) throw new HttpsError("invalid-argument", "Onbekend bedrijf.");
    const ref = rawDb.doc("bedrijven/" + bid), snap = await ref.get(); if (!snap.exists) throw new HttpsError("not-found", "Dit bedrijf bestaat niet (meer).");
    const b = snap.data() || {};
    if (actie === "details") {
      const gs = (await rawDb.collection("gebruikers").where("bedrijf", "==", bid).get()).docs.map(x => ({ email: x.id, rol: x.data().rol || "", naam: x.data().naam || "", toegevoegd: x.data().toegevoegd || "" }));
      const tel = async c => { try { return (await ref.collection(c).count().get()).data().count; } catch (x) { return null; } };
      const [klanten, facturen, beurten] = await Promise.all([tel("klanten"), tel("facturen"), tel("beurten")]);
      const bet = (await ref.collection("abonnementBetalingen").orderBy("op", "desc").limit(12).get().catch(() => ({ docs: [] }))).docs.map(x => ({ id: x.id, ...x.data() }));
      const lg = (await rawDb.collection("beheerLog").where("bid", "==", bid).get().catch(() => ({ docs: [] }))).docs.map(x => x.data()).sort((a, c) => String(c.op).localeCompare(String(a.op))).slice(0, 20);
      return { gebruikers: gs, tellers: { klanten, facturen, beurten }, betalingen: bet, log: lg, notitie: b.beheerNotitie || "" };
    }
    if (actie === "proefVerlengen") {
      const n = Math.max(1, Math.min(180, Math.round(Number(d.dagen) || 0))), basis = String(b.proefTot || "") > vandaag() ? b.proefTot : vandaag(), tot = plusDagen(basis, n);
      await ref.set({ proefTot: tot, ...(b.status === "actief" ? {} : { status: "proef" }) }, { merge: true }); await log(bid, "Proefperiode verlengd met " + n + " dagen, tot " + tot); return { proefTot: tot };
    }
    if (actie === "blokkeren") { if (b.status === "geblokkeerd") return { ok: true }; await ref.set({ status: "geblokkeerd", vorigeStatus: b.status || "proef", geblokkeerdOp: nu(), blokReden: String(d.reden || "").slice(0, 200) }, { merge: true }); await log(bid, "Toegang geblokkeerd" + (d.reden ? ": " + String(d.reden).slice(0, 200) : "")); return { ok: true }; }
    if (actie === "deblokkeren") { const st = b.vorigeStatus && b.vorigeStatus !== "geblokkeerd" ? b.vorigeStatus : "proef"; await ref.set({ status: st, vorigeStatus: "", blokReden: "" }, { merge: true }); await log(bid, "Toegang weer open (" + st + ")"); return { status: st }; }
    if (actie === "notitie") { const t = String(d.tekst || "").slice(0, 2000); await ref.set({ beheerNotitie: t }, { merge: true }); await log(bid, "Notitie bijgewerkt"); return { ok: true }; }
    if (actie === "gebruikerVerwijderen") {
      const m = String(d.email || "").toLowerCase(), g = await rawDb.doc("gebruikers/" + m).get();
      if (!g.exists || g.data().bedrijf !== bid) throw new HttpsError("not-found", "Deze gebruiker hoort niet bij dit bedrijf.");
      if (g.data().rol === "eigenaar" || m === b.eigenaar) throw new HttpsError("failed-precondition", "De eigenaar kun je niet los verwijderen. Verwijder dan het hele bedrijf.");
      await g.ref.delete(); const n = await aantalGebruikers(bid); await ref.set({ gebruikers: n }, { merge: true }); await log(bid, "Gebruiker " + m + " verwijderd"); return { gebruikers: n };
    }
    if (actie === "export") {
      const uit = { bedrijf: b, gebruikers: (await rawDb.collection("gebruikers").where("bedrijf", "==", bid).get()).docs.map(x => ({ id: x.id, ...x.data() })), geexporteerd: nu() };
      for (const c of DATA_COLS) uit[c] = (await ref.collection(c).get()).docs.map(x => ({ id: x.id, ...x.data() }));
      const json = JSON.stringify(uit); if (json.length > 9e6) throw new HttpsError("resource-exhausted", "Te groot om hier te downloaden.");
      await log(bid, "Gegevens geëxporteerd"); return { json };
    }
    if (actie === "verwijderen") {
      if (String(d.bevestig || "").trim().toLowerCase() !== String(b.naam || bid).trim().toLowerCase()) throw new HttpsError("failed-precondition", "Typ de naam van het bedrijf precies over om te bevestigen.");
      if (b.mollieSub && b.mollieCustomer) { try { await mollie(await sleutel(), "customers/" + b.mollieCustomer + "/subscriptions/" + b.mollieSub, { method: "DELETE" }); } catch (x) { console.error("abonnement stoppen", x); } }
      const gs = await rawDb.collection("gebruikers").where("bedrijf", "==", bid).get(); const bt = rawDb.batch(); gs.docs.forEach(x => bt.delete(x.ref)); await bt.commit();
      await rawDb.recursiveDelete(ref);
      await log(bid, "Bedrijf verwijderd: " + (b.naam || bid) + " (" + (b.eigenaar || "") + ", " + gs.size + " gebruiker(s))"); return { ok: true };
    }
    throw new HttpsError("invalid-argument", "Onbekende actie.");
  });

  return { functies: { bedrijfAanmaken, abonnement, abonnementStart, abonnementBijwerken, abonnementPlan, abonnementStoppen, mansardHook, beheer }, PLAN, magGebruiken };
};
