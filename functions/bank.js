/* Bank: betalingen van klanten automatisch koppelen aan verkoopfacturen.
   - bankVerwerk : transacties uit een geüpload bankbestand (CAMT.053, MT940, CSV) verwerken
   - bankBanken / bankStart / bankTerug : koppeling met de bank via Enable Banking (PSD2, alleen-lezen)
   - bankNu / bankSync : nieuwe bijschrijvingen ophalen (handmatig, en 4x per dag automatisch)
   - bankOntkoppel : koppeling stoppen
   Sleutels (App ID + private key van Enable Banking) staan in /geheim/config, de sessie in /geheim/bank.
   Elke bijschrijving komt in /banktx: gekoppeld, te controleren, niet herkend of genegeerd. */
module.exports = ({ db, onCall, onRequest, onSchedule, HttpsError, geheim, checkGebruiker, crypto, nu, HOST }) => {
  const EB = "https://api.enablebanking.com";
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const isoNL = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(d);
  const dec = v => Array.isArray(v) ? v.map(dec) : v && typeof v === "object" ? (v.__arr ? v.__arr.map(x => x && x.__a ? x.__a.map(dec) : dec(x)) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;
  const eur = n => "€ " + r2(n).toFixed(2).replace(".", ",");

  function totals(f, b) {
    const btw = Number(f.btw ?? b.btw ?? 21) / 100, incl = f.incl ?? b.incl ?? true;
    const sum = (f.regels || []).reduce((a, r) => a + (Number(r.aantal) || 0) * (Number(r.prijs) || 0), 0);
    return r2(incl ? sum : sum * (1 + btw));
  }
  /* factuurnummer als zoekpatroon: scheidingstekens mogen ontbreken of anders zijn ("26-009324" = "26009324" = "26 009324") */
  function nrPatroon(nr) {
    const t = String(nr || "").replace(/[^0-9a-z]/gi, "");
    if (t.replace(/\D/g, "").length < 4) return null;
    return new RegExp("(?<![0-9a-z])" + t.split("").map(c => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s.\\-/_]?") + "(?![0-9])", "i");
  }
  const woorden = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(hr|mw|mevr|dhr|de|van|der|den|het|en|e|o|b|v|of|fam|familie|bv|vof|cv)\b/g, " ").split(/[^a-z]+/).filter(w => w.length > 2);
  const lijktNaam = (a, b) => { const A = new Set(woorden(a)); return woorden(b).some(w => A.has(w)); };
  const schoonIban = s => String(s || "").replace(/\s+/g, "").toUpperCase();
  const txId = t => "tx_" + crypto.createHash("sha1").update([t.datum, r2(t.bedrag).toFixed(2), schoonIban(t.iban), String(t.omschrijving || "").replace(/\s+/g, " ").trim().toLowerCase(), String(t.ref || "")].join("|")).digest("hex").slice(0, 24);

  /* ---------- het koppelen ---------- */
  async function verwerk(lijst, bron) {
    const b = (await db.doc("instellingen/bedrijf").get()).data() || {};
    const [fs, ks] = await Promise.all([db.collection("facturen").get(), db.collection("klanten").get()]);
    const facturen = fs.docs.map(d => ({ id: d.id, ...dec(d.data()) })).filter(f => f.soort !== "offerte" && f.status !== "concept" && f.nummer);
    const klanten = new Map(ks.docs.map(d => [d.id, dec(d.data())]));
    const open = () => facturen.filter(f => f.status === "open" || f.status === "oninbaar" || (!f.status && !f.betaald));
    const uit = { nieuw: 0, betaald: [], controleren: 0, onbekend: 0, genegeerd: 0, dubbel: 0 };
    const tx = lijst.map(t => ({ datum: String(t.datum || "").slice(0, 10), bedrag: r2(t.bedrag), naam: String(t.naam || "").slice(0, 140), iban: schoonIban(t.iban).slice(0, 34), omschrijving: String(t.omschrijving || "").replace(/\s+/g, " ").trim().slice(0, 500), ref: String(t.ref || "").slice(0, 80), id: t.id ? String(t.id).replace(/[^\w-]/g, "").slice(0, 60) : "" }))
      .filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t.datum) && t.bedrag > 0);   // alleen bijschrijvingen
    for (const t of tx) {
      const id = t.id ? "tx_" + t.id : txId(t), ref = db.doc("banktx/" + id);
      if ((await ref.get()).exists) continue;
      uit.nieuw++;
      const doc = { ...t, id, bron, op: nu(), status: "onbekend", factuurIds: [], nummers: [], reden: "" };
      const tekst = t.omschrijving + " " + t.ref;
      const opn = open();
      if (/mollie/i.test(t.naam) || /stichting mollie payments/i.test(tekst)) {
        Object.assign(doc, { status: "genegeerd", reden: "Uitbetaling van Mollie: die betalingen staan al op betaald" }); uit.genegeerd++;
      } else {
        const hits = opn.filter(f => { const p = nrPatroon(f.nummer); return p && p.test(tekst); });
        const alBetaald = facturen.filter(f => f.status === "betaald" && (() => { const p = nrPatroon(f.nummer); return p && p.test(tekst); })());
        const som = r2(hits.reduce((a, f) => a + totals(f, b), 0));
        if (hits.length && Math.abs(som - t.bedrag) <= 0.01) {
          Object.assign(doc, { status: "gekoppeld", factuurIds: hits.map(f => f.id), nummers: hits.map(f => f.nummer), reden: "Factuurnummer en bedrag kloppen" });
        } else if (hits.length) {
          Object.assign(doc, { status: "controleren", factuurIds: hits.map(f => f.id), nummers: hits.map(f => f.nummer), reden: `Bedrag wijkt af: ontvangen ${eur(t.bedrag)}, ${hits.length > 1 ? "facturen samen" : "factuur"} ${eur(som)}` });
        } else if (alBetaald.length) {
          const zelfde = alBetaald.find(f => Math.abs(totals(f, b) - t.bedrag) <= 0.01 && f.betaalwijze !== "contant");
          Object.assign(doc, { status: zelfde ? "dubbel" : "controleren", factuurIds: alBetaald.map(f => f.id), nummers: alBetaald.map(f => f.nummer), reden: zelfde ? "Deze factuur stond al op betaald" : "Factuur " + alBetaald.map(f => f.nummer).join(", ") + " stond al op betaald: misschien dubbel betaald" });
        } else {
          /* geen factuurnummer: een bekende rekening van de klant (eerder gekoppeld) + precies één open factuur met dit bedrag */
          const zb = opn.filter(f => Math.abs(totals(f, b) - t.bedrag) <= 0.01);
          const viaIban = t.iban ? zb.filter(f => { const k = klanten.get(f.klantId); return k && (k.bankIbans || []).map(schoonIban).includes(t.iban); }) : [];
          const viaNaam = zb.filter(f => { const k = klanten.get(f.klantId) || {}; return lijktNaam(t.naam, [f.klantNaam, k.naam, k.contact].join(" ")); });
          if (viaIban.length === 1) Object.assign(doc, { status: "gekoppeld", factuurIds: [viaIban[0].id], nummers: [viaIban[0].nummer], reden: "Bekende rekening van de klant en het bedrag klopt" });
          else if (viaNaam.length >= 1 || viaIban.length > 1) { const s = (viaIban.length ? viaIban : viaNaam).sort((x, y) => String(x.datum).localeCompare(String(y.datum)))[0]; Object.assign(doc, { status: "controleren", voorstel: s.id, factuurIds: [s.id], nummers: [s.nummer], reden: "Geen factuurnummer in de omschrijving; naam en bedrag passen bij factuur " + s.nummer }); }
          else Object.assign(doc, { status: "onbekend", reden: "Geen factuur gevonden bij deze betaling" });
        }
      }
      if (doc.status === "gekoppeld") {
        for (const fid of doc.factuurIds) {
          const f = facturen.find(x => x.id === fid), log = Array.isArray(f.log) ? f.log : [];
          await db.doc("facturen/" + fid).set({ status: "betaald", betaald: true, betaaldOp: t.datum, betaaldTs: nu(), betaalwijze: f.betaalwijze === "incasso" ? "incasso" : "overmaken", bankTx: id, oninbaarOp: "", log: [...log, { datum: nu(), tekst: "Betaling ontvangen via de bank" + (t.naam ? " van " + t.naam : "") + " (" + eur(t.bedrag) + ")" }] }, { merge: true });
          f.status = "betaald";
          const bs = await db.collection("beurten").where("gefactureerd", "==", fid).get();
          for (const d of bs.docs) await d.ref.set({ betaald: true }, { merge: true });
          uit.betaald.push({ nummer: f.nummer, bedrag: totals(f, b), naam: f.klantNaam || "" });
          /* rekening onthouden: de volgende keer herkennen we de klant ook zonder factuurnummer */
          if (t.iban && f.klantId && klanten.has(f.klantId)) { const k = klanten.get(f.klantId), l = (k.bankIbans || []).map(schoonIban); if (!l.includes(t.iban)) { k.bankIbans = [...l, t.iban].slice(-4); await db.doc("klanten/" + f.klantId).set({ bankIbans: k.bankIbans }, { merge: true }); } }
        }
      } else if (doc.status === "controleren") uit.controleren++;
      else if (doc.status === "onbekend") uit.onbekend++;
      else if (doc.status === "dubbel") uit.dubbel++;
      await ref.set(doc);
    }
    return uit;
  }

  const bankVerwerk = onCall({ timeoutSeconds: 300, memory: "512MiB" }, async req => {
    await checkGebruiker(req.auth);
    const d = req.data || {}, tx = Array.isArray(d.tx) ? d.tx.slice(0, 5000) : [];
    if (!tx.length) throw new HttpsError("invalid-argument", "Geen transacties gevonden in het bestand.");
    const uit = await verwerk(tx, "Bestand " + String(d.naam || "").slice(0, 80));
    await db.doc("instellingen/bank").set({ laatsteBestand: { naam: String(d.naam || "").slice(0, 80), op: nu(), ...samenvatting(uit) } }, { merge: true });
    return uit;
  });
  const samenvatting = u => ({ nieuw: u.nieuw, betaald: u.betaald.length, controleren: u.controleren, onbekend: u.onbekend });

  /* ---------- Enable Banking ---------- */
  const b64u = x => Buffer.from(x).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  function jwt(g) {
    if (!g.ebApp || !g.ebKey) throw new HttpsError("failed-precondition", "Vul eerst de App ID en de sleutel van Enable Banking in.");
    const iat = Math.floor(Date.now() / 1000), kop = b64u(JSON.stringify({ typ: "JWT", alg: "RS256", kid: g.ebApp })), body = b64u(JSON.stringify({ iss: "enablebanking.com", aud: "api.enablebanking.com", iat, exp: iat + 3600 }));
    const sig = crypto.createSign("RSA-SHA256").update(kop + "." + body).sign(g.ebKey).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    return kop + "." + body + "." + sig;
  }
  async function eb(g, pad, opts = {}, psu) {
    const h = { Authorization: "Bearer " + jwt(g), "Content-Type": "application/json", ...(psu || {}) };
    const r = await fetch(EB + pad, { ...opts, headers: h });
    const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (e) {}
    if (!r.ok) { const m = j.message || j.detail || j.error || t.slice(0, 200); const e = new Error("Bank: " + m); e.status = r.status; e.code = j.code || j.error; throw e; }
    return j;
  }
  const basisOk = s => { const u = String(s || ""); return /^https:\/\/[a-z0-9.-]+$/i.test(u) && (u === HOST() || /\.(web\.app|firebaseapp\.com)$/.test(u) || /(^|\.)mijnschoonmaker\.com$/.test(u.replace(/^https:\/\//, ""))) ? u : HOST(); };

  const bankBanken = onCall(async req => {
    await checkGebruiker(req.auth);
    const g = await geheim(), j = await eb(g, "/aspsps?country=NL");
    return { banken: (j.aspsps || []).map(a => ({ naam: a.name, logo: a.logo || "", types: a.psu_types || [] })).sort((x, y) => x.naam.localeCompare(y.naam)) };
  });
  const bankStart = onCall(async req => {
    await checkGebruiker(req.auth);
    const g = await geheim(), d = req.data || {}, naam = String(d.bank || "Knab").slice(0, 80), basis = basisOk(d.basis);
    const j = await eb(g, "/aspsps?country=NL"), a = (j.aspsps || []).find(x => x.name.toLowerCase() === naam.toLowerCase());
    if (!a) throw new HttpsError("not-found", naam + " staat niet in de lijst met banken.");
    const sec = Math.min(Number(a.maximum_consent_validity) || 90 * 86400, 180 * 86400), tot = new Date(Date.now() + sec * 1000 - 3600e3).toISOString();
    const state = crypto.randomBytes(18).toString("hex"), type = (a.psu_types || []).includes("business") && d.zakelijk !== false ? "business" : "personal";
    const r = await eb(g, "/auth", { method: "POST", body: JSON.stringify({ access: { valid_until: tot }, aspsp: { name: a.name, country: "NL" }, state, redirect_url: basis + "/api/bank/terug", psu_type: type }) });
    await db.doc("geheim/bankstart").set({ state, bank: a.name, basis, op: nu() });
    return { url: r.url };
  });
  const bankTerug = onRequest(async (req, res) => {
    const q = req.query || {}, s = (await db.doc("geheim/bankstart").get()).data() || {}, basis = s.basis || HOST();
    const terug = (m, ok) => res.redirect(302, basis + "/?bank=" + (ok ? "ok" : "fout") + (m ? "&m=" + encodeURIComponent(m) : ""));
    try {
      if (q.error) return terug(String(q.error_description || q.error).slice(0, 160));
      if (!q.code || !s.state || q.state !== s.state || Date.now() - Date.parse(s.op) > 30 * 60e3) return terug("De koppeling is verlopen of ongeldig. Probeer het opnieuw.");
      const g = await geheim(), oud = (await db.doc("geheim/bank").get()).data() || {};
      const r = await eb(g, "/sessions", { method: "POST", body: JSON.stringify({ code: String(q.code) }) });
      const rek = (r.accounts || []).map(a => ({ uid: a.uid, iban: (a.account_id && a.account_id.iban) || "", naam: a.name || a.product || "" })).filter(a => a.uid);
      if (!rek.length) return terug("De bank gaf geen rekeningen terug. Koppel de rekening eerst in Enable Banking (Link accounts).");
      if (oud.sessie && oud.sessie !== r.session_id) { try { await eb(g, "/sessions/" + oud.sessie, { method: "DELETE" }); } catch (e) {} }
      const geldig = (r.access && r.access.valid_until) || "";
      await db.doc("geheim/bank").set({ sessie: r.session_id, rekeningen: rek, bank: s.bank, geldigTot: geldig, sinds: nu(), vanaf: oud.vanaf || "" });
      await db.doc("geheim/bankstart").delete();
      await db.doc("instellingen/bank").set({ gekoppeld: true, bank: s.bank, rekeningen: rek.map(a => ({ iban: a.iban.replace(/^(.{4}).*(.{3})$/, "$1 •••• $2"), naam: a.naam })), geldigTot: geldig, sinds: nu(), fout: "" }, { merge: true });
      try { await sync(null); } catch (e) { console.error("eerste sync", e); }
      terug("", true);
    } catch (e) { console.error("bankTerug", e); terug(String(e.message || e).slice(0, 160)); }
  });

  async function sync(psu) {
    const [g, s] = await Promise.all([geheim(), db.doc("geheim/bank").get().then(x => x.data() || {})]);
    if (!s.sessie) throw new HttpsError("failed-precondition", "Er is geen bank gekoppeld.");
    if (s.geldigTot && Date.parse(s.geldigTot) < Date.now()) { await db.doc("instellingen/bank").set({ verlopen: true, fout: "De toestemming van de bank is verlopen. Koppel opnieuw." }, { merge: true }); throw new HttpsError("failed-precondition", "De toestemming van de bank is verlopen. Koppel de bank opnieuw."); }
    const vanaf = s.vanaf ? isoNL(new Date(Date.parse(s.vanaf) - 5 * 86400e3)) : isoNL(new Date(Date.now() - 60 * 86400e3));
    const tx = [];
    let saldo = null;
    for (const a of s.rekeningen || []) {
      let key = "", n = 0;
      do {
        const j = await eb(g, `/accounts/${a.uid}/transactions?date_from=${vanaf}` + (key ? "&continuation_key=" + encodeURIComponent(key) : ""), {}, psu);
        for (const t of j.transactions || []) {
          if (t.status && t.status !== "BOOK") continue;
          const amt = Number((t.transaction_amount || {}).amount) || 0, credit = t.credit_debit_indicator ? t.credit_debit_indicator === "CRDT" : amt > 0;
          const rem = [].concat(t.remittance_information || []).join(" ") + (t.reference_number ? " " + t.reference_number : "");
          tx.push({ id: t.transaction_id || t.entry_reference || "", datum: t.booking_date || t.value_date || t.transaction_date, bedrag: credit ? Math.abs(amt) : -Math.abs(amt), naam: (t.debtor && t.debtor.name) || "", iban: (t.debtor_account && t.debtor_account.iban) || "", omschrijving: rem, ref: t.end_to_end_id || "" });
        }
        key = j.continuation_key || "";
      } while (key && ++n < 20);
      try { const bj = await eb(g, `/accounts/${a.uid}/balances`, {}, psu); const bl = (bj.balances || []).find(x => /CLBD|ITBD|XPCD|ITAV/.test(x.balance_type || "")) || (bj.balances || [])[0]; if (bl) saldo = r2((saldo || 0) + Number(bl.balance_amount.amount)); } catch (e) {}
    }
    const uit = await verwerk(tx, "Bank " + (s.bank || ""));
    await db.doc("geheim/bank").set({ vanaf: nu() }, { merge: true });
    await db.doc("instellingen/bank").set({ bijgewerkt: nu(), saldo, fout: "", verlopen: false, laatsteSync: samenvatting(uit) }, { merge: true });
    return uit;
  }
  const bankNu = onCall({ timeoutSeconds: 300, memory: "512MiB" }, async req => {
    await checkGebruiker(req.auth);
    /* de gebruiker kijkt mee: dan gelden de PSD2-limieten (4x per dag zonder gebruiker) niet */
    const ip = String((req.rawRequest && (req.rawRequest.headers["x-forwarded-for"] || req.rawRequest.ip)) || "").split(",")[0].trim(), ua = String((req.rawRequest && req.rawRequest.headers["user-agent"]) || "").slice(0, 200);
    try { return await sync(ip ? { "Psu-Ip-Address": ip, "Psu-User-Agent": ua } : null); }
    catch (e) { if (e instanceof HttpsError) throw e; await db.doc("instellingen/bank").set({ fout: String(e.message || e).slice(0, 200) }, { merge: true }); throw new HttpsError("internal", String(e.message || e)); }
  });
  const bankSync = onSchedule({ schedule: "10 8,12,16,20 * * *", timeZone: "Europe/Amsterdam", timeoutSeconds: 300, memory: "512MiB" }, async () => {
    const s = (await db.doc("geheim/bank").get()).data() || {};
    if (!s.sessie) return;
    try { await sync(null); } catch (e) { console.error("bankSync", e); await db.doc("instellingen/bank").set({ fout: String(e.message || e).slice(0, 200) }, { merge: true }); }
  });
  const bankOntkoppel = onCall(async req => {
    await checkGebruiker(req.auth);
    const g = await geheim(), s = (await db.doc("geheim/bank").get()).data() || {};
    if (s.sessie) { try { await eb(g, "/sessions/" + s.sessie, { method: "DELETE" }); } catch (e) {} }
    await db.doc("geheim/bank").set({ sessie: "", rekeningen: [], geldigTot: "", vanaf: s.vanaf || "" });
    await db.doc("instellingen/bank").set({ gekoppeld: false, rekeningen: [], geldigTot: "", saldo: null }, { merge: true });
    return { ok: true };
  });

  return { functies: { bankVerwerk, bankBanken, bankStart, bankTerug, bankNu, bankSync, bankOntkoppel }, verwerk, nrPatroon, totals };
};
