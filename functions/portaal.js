/* ---------- Klantportaal ----------
   Klanten loggen in met een link per e-mail (geen wachtwoord). Alles loopt via deze server:
   de browser van de klant krijgt nooit direct toegang tot de database.
   Routes (via hosting /api/portaal/**):
     POST login   {email}          -> stuurt inloglink (antwoord is altijd hetzelfde)
     POST sessie  {l}              -> wisselt inloglink om voor een sessie
     GET  data                     -> alles wat de klant ziet
     GET  factuur?id=              -> één factuur
     POST betaal  {id}             -> Mollie-betaallink voor een open factuur
     POST actie   {type,…}         -> verzoek / instructies / beoordeling / gegevens
     POST uit                      -> uitloggen
     GET  ref?c=CODE               -> openbare info voor een aanbevelingslink
   Collecties (alleen de server leest/schrijft): portaalLogin, portaalSessie
   CRM leest: portaalVerzoeken */
const crypto = require("crypto");

module.exports = function maakPortaal(ctx) {
  const { db, onRequest, onCall, HttpsError, geheim, bedrijf, brevoSend, mailHtml, HOST, nu, newId, checkGebruiker, mollie, voornaamVan, bucket } = ctx;
  const sha = s => crypto.createHash("sha256").update(String(s)).digest("hex");
  const tok = () => crypto.randomBytes(32).toString("hex");
  const DAG = 864e5;
  const dec = v => Array.isArray(v) ? v.map(dec) : v && typeof v === "object" ? (v.__arr ? v.__arr.map(x => x && x.__a ? x.__a.map(dec) : dec(x)) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;
  const lc = s => String(s || "").trim().toLowerCase();
  const isoNL = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(d);
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const schoon = n => { const s = String(n || "").trim(); return s.includes(",") ? s.split(",").slice(1).join(",").trim() + " " + s.split(",")[0].trim() : s; };

  function basisUrl(req) {
    const h = String(req.headers["x-forwarded-host"] || req.hostname || "").split(",")[0].trim().toLowerCase();
    return /^[a-z0-9.-]+\.(web\.app|firebaseapp\.com|mijnschoonmaker\.com)$/.test(h) ? "https://" + h : HOST();
  }
  async function limiet(sleutel, max, ms) {
    const ref = db.doc("limiet/p" + sha(sleutel).slice(0, 40));
    return db.runTransaction(async t => {
      const s = await t.get(ref), d = s.exists ? s.data() : null, vers = d && Date.now() - d.t < ms;
      const n = vers ? d.n + 1 : 1; t.set(ref, { n, t: vers ? d.t : Date.now() }); return n <= max;
    });
  }
  const ip = req => String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
  const body = req => { if (req.body && typeof req.body === "object") return req.body; try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; } };

  async function klantenMetEmail(email) {
    const e = lc(email); if (!/^\S+@\S+\.\S+$/.test(e)) return [];
    const s = await db.collection("klanten").select("email", "fEmail", "pEmail", "oEmail", "actief", "naam", "contact", "prospect").get();
    return s.docs.filter(d => { const x = d.data(); return [x.email, x.fEmail, x.pEmail, x.oEmail].some(m => String(m || "").toLowerCase().split(/[;,\s]+/).includes(e)); })
      .map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.actief !== false) - (a.actief !== false));
  }
  async function stuurInlogMail(req, k, email, dagen) {
    const [g, b] = await Promise.all([geheim(), bedrijf()]);
    if (!g.brevoKey) throw new Error("geen Brevo-sleutel");
    const t = tok();
    await db.doc("portaalLogin/" + sha(t)).set({ klantId: k.id, email: lc(email), exp: Date.now() + dagen * DAG, op: nu() });
    const url = basisUrl(req) + "/portaal?l=" + t, vn = voornaamVan(schoon(k.contact || k.naam));
    const tekst = `Beste ${vn},\n\nMet de knop hieronder opent u uw persoonlijke klantomgeving van ${b.naam || "mijnschoonmaker.com"}. Daar ziet u wanneer wij weer langskomen, uw facturen en bezoeken, en kunt u ons eenvoudig iets laten weten.\n\nDe knop werkt ${dagen > 1 ? dagen + " dagen" : "een uur"} en is alleen voor u bedoeld. U hoeft geen wachtwoord te onthouden.\n\nMet vriendelijke groet,\n${b.naam || "mijnschoonmaker.com"}`;
    const afz = g.afzender || b.email || "info@mijnschoonmaker.com";
    await brevoSend(g.brevoKey, { sender: { name: b.naam || "mijnschoonmaker", email: afz }, replyTo: { email: b.email || afz }, to: [{ email, name: schoon(k.naam) || undefined }],
      subject: (dagen > 1 ? "Uw persoonlijke klantomgeving" : "Uw inloglink") + " · " + (b.naam || "mijnschoonmaker.com"), htmlContent: mailHtml(tekst, b, { knop: { url, tekst: "Open mijn klantomgeving" } }), textContent: tekst + "\n\n" + url, tags: ["portaal"] });
  }
  async function sessie(req) {
    const m = /^Bearer ([a-f0-9]{64})$/.exec(String(req.headers.authorization || ""));
    if (!m) return null;
    const ref = db.doc("portaalSessie/" + sha(m[1])), s = await ref.get();
    if (!s.exists || s.data().exp < Date.now()) return null;
    const k = await db.doc("klanten/" + s.data().klantId).get();
    if (!k.exists) return null;
    if (Date.now() - (s.data().gezien || 0) > DAG) ref.set({ gezien: Date.now(), exp: Date.now() + 180 * DAG }, { merge: true }).catch(() => {});
    return { ref, klant: { id: k.id, ...dec(k.data()) }, kref: k.ref };
  }
  async function maakRefCode(k) {
    const basis = schoon(k.contact || k.naam).split(/\s+/)[0].normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 6) || "VRIEND";
    for (let i = 0; i < 8; i++) {
      const c = basis + String(crypto.randomInt(10, 100));
      if ((await db.collection("klanten").where("refCode", "==", c).limit(1).get()).empty) return c;
    }
    return basis + crypto.randomBytes(2).toString("hex").toUpperCase();
  }
  function totals(f, b) {
    const btw = Number(f.btw ?? b.btw ?? 21) / 100, incl = f.incl ?? b.incl ?? true;
    const sum = (f.regels || []).reduce((a, r) => a + (Number(r.aantal) || 0) * (Number(r.prijs) || 0), 0);
    const inc = incl ? sum : sum * (1 + btw), ex = incl ? sum / (1 + btw) : sum;
    return { ex: r2(ex), btw: r2(inc - ex), inc: r2(inc) };
  }
  const fStatus = f => f.status === "betaald" ? "betaald" : f.status === "oninbaar" ? "gesloten" : f.verval && f.verval < isoNL() ? "verlopen" : "open";
  const bedrijfInfo = (b, base) => ({ naam: b.naam || "mijnschoonmaker.com", logo: (b.logoMail || b.logo) ? base + "/_blob/" + (b.logoMail || b.logo) : "", telefoon: b.telefoon || "", mobiel: b.mobiel || b.telefoon || "", email: b.email || "", website: b.website || "", iban: b.iban || "", reviewLink: b.reviewLink || "", kleur: b.mailAccent || b.hoofdkleur || "#137a8a",
    voorwaarden: b.voorwaardenPdf ? base + "/_blob/" + b.voorwaardenPdf : "", tijdWeergave: b.portaalTijd || "venster", refAan: b.refAan !== false, refBeloning: b.refBeloning != null && b.refBeloning !== "" ? Number(b.refBeloning) : 15, refWelkom: b.refWelkom != null && b.refWelkom !== "" ? Number(b.refWelkom) : 10, werkStart: b.werkStart || "08:00" });

  async function data(req, S) {
    const k = S.klant, b = await bedrijf(), base = basisUrl(req), vandaag = isoNL();
    if (!k.refCode) { k.refCode = await maakRefCode(k); await S.kref.set({ refCode: k.refCode }, { merge: true }); }
    const tq = await db.collection("tickets").where("klantId", "==", k.id).get(), tks = tq.docs.map(d => d.data());
    const [bs, fs, vz, rk, ra] = await Promise.all([
      db.collection("beurten").where("klantId", "==", k.id).get(),
      db.collection("facturen").where("klantId", "==", k.id).get(),
      db.collection("portaalVerzoeken").where("klantId", "==", k.id).get(),
      db.collection("klanten").where("aanbevolenDoor", "==", k.id).get(),
      db.collection("aanvragen").where("aanbevolenDoor", "==", k.id).get()
    ]);
    const beurten = bs.docs.map(d => ({ id: d.id, ...dec(d.data()) })).filter(x => x.datum).sort((a, b2) => b2.datum.localeCompare(a.datum));
    const facturen = fs.docs.map(d => ({ id: d.id, ...dec(d.data()) })).filter(f => f.soort !== "offerte" && f.status !== "concept").sort((a, b2) => String(b2.datum).localeCompare(String(a.datum)))
      .map(f => ({ id: f.id, nummer: f.nummer || "", datum: f.datum || "", verval: f.verval || "", bedrag: totals(f, b).inc, status: fStatus(f), betaaldOp: f.status === "betaald" ? String(f.betaaldOp || f.betaald || "").slice(0, 10) : "", herinnerd: Number(f.herinneringen) || 0, betaallink: f.status !== "betaald" ? (f.betaallink || f.mollieLink || "") : "" }));
    const freqW = Number(k.frequentie) || 4;
    let volgende = null;
    if (k.gepland && k.gepland >= vandaag) volgende = { datum: k.gepland, tijd: k.tijd || "", bezig: !!k.bezig && k.gepland === vandaag, reeks: (k.reeks || []).filter(x => x && x.d > k.gepland).slice(0, 12).map(x => ({ datum: x.d, tijd: x.t || "" })) };
    let verwacht = "";
    if (!volgende && k.actief !== false && !k.prospect) { const l = k.laatst ? new Date(k.laatst + "T12:00:00") : null; verwacht = l ? isoNL(new Date(Math.max(Date.now(), l.getTime() + freqW * 7 * DAG))) : ""; }
    const laatsteB = beurten[0];
    const aanbevolen = [
      ...ra.docs.map(d => d.data()).filter(a => a.status === "nieuw" || a.status === "bezig").map(a => ({ naam: voornaamVan(((a.aanvraag || {}).klant || {}).naam || ""), datum: String(a.ontvangen || "").slice(0, 10), status: "aangemeld" })),
      ...rk.docs.map(d => dec(d.data())).map(x => ({ naam: voornaamVan(schoon(x.contact || x.naam)), datum: x.aangemaakt || "", status: x.aanbevelingBeloond ? "beloond" : x.actief === false ? "gestopt" : x.akkoord === false || x.prospect ? "akkoord" : "eerste" }))
    ].sort((a, b2) => String(b2.datum).localeCompare(String(a.datum)));
    const tegoed = (k.tegoed || []).filter(t => t && Number(t.bedrag) > 0);
    return {
      bedrijf: bedrijfInfo(b, base),
      klant: { voornaam: voornaamVan(schoon(k.contact || k.naam)), naam: schoon(k.naam), contact: k.contact || "", adres: k.adres || "", postcode: k.postcode || "", plaats: k.plaats || "", pcPlaats: [k.postcode, k.plaats].filter(Boolean).join(" "), email: k.email || "", telefoon: k.telefoon || "", mobiel: k.mobiel || "", zakelijk: k.soort === "zakelijk",
        klantnr: k.klantnr || "", sinds: k.aangemaakt || (beurten.length ? beurten[beurten.length - 1].datum : ""), dienst: k.dienst || "Glasbewassing", frequentie: freqW, prijs: Number(k.prijs) || 0, binnen: !!k.binnen, actief: k.actief !== false,
        toegang: k.portaalToegang || { opties: [], tekst: "" }, nieuw: !!k.eersteKeer && !beurten.length },
      volgende, verwacht,
      bezoeken: beurten.slice(0, 30).map(x => ({ id: x.id, datum: x.datum, dienst: x.dienst || k.dienst || "Glasbewassing", extra: x.extra || [], bedrag: Number(x.bedrag) || 0, beoordeling: x.beoordeling ? { sterren: x.beoordeling.sterren } : null })),
      teBeoordelen: laatsteB && !laatsteB.beoordeling && (Date.now() - new Date(laatsteB.datum + "T12:00:00").getTime()) < 21 * DAG ? { id: laatsteB.id, datum: laatsteB.datum } : null,
      aantalBezoeken: beurten.length,
      facturen,
      tickets: { open: tks.filter(t => t.status !== "opgelost").length, ongelezen: tks.reduce((a, t) => a + (Number(t.ongelezenKlant) || 0), 0) },
      verzoeken: vz.docs.map(d => ({ id: d.id, ...d.data() })).filter(v => v.type !== "beoordeling" && v.type !== "toegang").sort((a, b2) => String(b2.op).localeCompare(String(a.op))).slice(0, 8)
        .map(v => ({ type: v.type, status: v.status, op: v.op, datum: v.datum || "", tot: v.tot || "", tekst: v.tekst || "", antwoord: v.antwoord || "" })),
      aanbevelen: { code: k.refCode, link: base + "/aanbevolen/" + k.refCode, lijst: aanbevolen, tegoed: r2(tegoed.reduce((a, t) => a + Number(t.bedrag), 0)), opHold: aanbevolen.filter(x => ["aangemeld", "akkoord", "eerste"].includes(x.status)).length, tegoedRegels: tegoed.map(t => ({ bedrag: Number(t.bedrag), reden: t.reden || "" })), verdiend: r2((k.tegoedGebruikt || []).reduce((a, t) => a + (Number(t.bedrag) || 0), 0)) }
    };
  }

  const TYPES = { verzetten: "Afspraak verzetten", overslaan: "Bezoek overslaan", vakantie: "Afwezig / vakantie", bericht: "Bericht", gegevens: "Gegevens wijzigen", extra: "Extra dienst aanvragen", stoppen: "Opzeggen", beoordeling: "Beoordeling", toegang: "Toegang en instructies" };
  async function actie(req, S, d) {
    const k = S.klant, type = String(d.type || "");
    if (!TYPES[type]) throw new Error("onbekend");
    if (type === "bericht") return ticketNieuw(S, { tekst: d.tekst, categorie: "overig" });   // losse berichten worden een ticket
    if (!(await limiet("actie" + k.id, 30, 3600e3))) throw new Error("te veel");
    const txt = s => String(s || "").trim().slice(0, 1500), dt = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? String(s) : "";
    const v = { klantId: k.id, klantNaam: k.naam || "", adres: [k.adres, k.plaats].filter(Boolean).join(", "), type, titel: TYPES[type], tekst: txt(d.tekst), status: "nieuw", op: nu(), bron: "portaal" };
    if (type === "verzetten" || type === "overslaan") { v.datum = dt(d.datum) || k.gepland || ""; v.voorkeur = txt(d.voorkeur).slice(0, 200); }
    if (type === "vakantie") { v.datum = dt(d.datum); v.tot = dt(d.tot); if (!v.datum || !v.tot || v.tot < v.datum) throw new Error("Kies een begin- en einddatum."); }
    if (type === "gegevens") {
      /* direct doorvoeren op de klant in het CRM */
      const naamVeld = k.soort === "zakelijk" ? "contact" : "naam", MAX = { naam: 80, adres: 120, postcode: 10, plaats: 60, telefoon: 30, mobiel: 30, email: 120 }, nieuw = {}, oud = {};
      for (const [f, max] of Object.entries(MAX)) {
        if (d[f] === undefined) continue;
        let x = txt(d[f]).replace(/\s+/g, " ").slice(0, max);
        if (f === "postcode") x = x.toUpperCase().replace(/^(\d{4})\s?([A-Z]{2})$/, "$1 $2");
        if (f === "email") x = x.toLowerCase();
        const doel = f === "naam" ? naamVeld : f;
        if (doel === "naam" && x === schoon(k.naam)) continue;   // alleen anders weergegeven ("Achternaam, Voornaam")
        if (x !== String(k[doel] || "")) { nieuw[doel] = x; oud[doel] = k[doel] || ""; }
      }
      if (nieuw.email && !/^\S+@\S+\.\S+$/.test(nieuw.email)) throw new Error("Vul een geldig e-mailadres in.");
      if ("adres" in nieuw && !nieuw.adres) throw new Error("Vul uw straat en huisnummer in.");
      if ("naam" in nieuw && nieuw.naam.length < 2) throw new Error("Vul uw naam in.");
      if (!Object.keys(nieuw).length) throw new Error("Er is niets gewijzigd.");
      const LBL = { naam: "naam", contact: "contactpersoon", adres: "adres", postcode: "postcode", plaats: "plaats", telefoon: "telefoon", mobiel: "mobiel", email: "e-mail" };
      await S.kref.set({ ...nieuw, log: [...(Array.isArray(k.log) ? k.log : []), { datum: isoNL(), tekst: "Gegevens gewijzigd door klant (portaal): " + Object.keys(nieuw).map(f => LBL[f] + " " + (oud[f] || "–") + " → " + (nieuw[f] || "–")).join(", ") }] }, { merge: true });
      v.wijziging = nieuw; v.oud = oud; v.status = (nieuw.adres !== undefined || nieuw.postcode !== undefined || nieuw.plaats !== undefined) ? "nieuw" : "info";
    }
    if (type === "extra") { v.diensten = (Array.isArray(d.diensten) ? d.diensten : []).map(x => txt(x).slice(0, 60)).slice(0, 8); }
    if (type === "toegang") {
      const opties = (Array.isArray(d.opties) ? d.opties : []).map(x => txt(x).slice(0, 60)).slice(0, 10), toegang = { opties, tekst: txt(d.tekst).slice(0, 600), code: txt(d.code).replace(/\s+/g, " ").slice(0, 40), op: nu() };
      await S.kref.set({ portaalToegang: toegang }, { merge: true });
      v.toegang = toegang; v.status = "info";
    }
    if (type === "beoordeling") {
      const st = Math.max(1, Math.min(5, Math.round(Number(d.sterren) || 0)));
      const bref = db.doc("beurten/" + String(d.beurtId || "")), bs = await bref.get();
      if (!bs.exists || bs.data().klantId !== k.id) throw new Error("bezoek niet gevonden");
      await bref.set({ beoordeling: { sterren: st, tekst: v.tekst, op: nu() } }, { merge: true });
      Object.assign(v, { sterren: st, beurtId: bref.id, datum: bs.data().datum || "", status: st <= 3 ? "nieuw" : "info" });
    }
    if (type === "bericht" && !v.tekst) throw new Error("Schrijf een bericht.");
    const id = newId("pv");
    await db.doc("portaalVerzoeken/" + id).set(v);
    if (v.status === "nieuw") {
      try {
        const [g, b] = await Promise.all([geheim(), bedrijf()]);
        if (g.brevoKey && (g.meldAdres || b.email)) await brevoSend(g.brevoKey, { sender: { name: "mijnschoonmaker CRM", email: g.afzender || b.email }, to: [{ email: g.meldAdres || b.email }], replyTo: k.email ? { email: k.email } : undefined,
          subject: `Klantportaal: ${v.titel} · ${schoon(k.naam)}`, textContent: [`${schoon(k.naam)} (${v.adres}) via het klantportaal:`, "", v.titel + (v.datum ? " · " + v.datum : "") + (v.tot ? " t/m " + v.tot : "") + (v.sterren ? " · " + v.sterren + " sterren" : ""), v.voorkeur ? "Voorkeur: " + v.voorkeur : "", v.diensten && v.diensten.length ? "Diensten: " + v.diensten.join(", ") : "", v.wijziging ? "Al doorgevoerd in het CRM:\n" + Object.keys(v.wijziging).map(f => "- " + f + ": " + ((v.oud || {})[f] || "–") + " → " + (v.wijziging[f] || "–")).join("\n") : "", v.tekst ? "\n" + v.tekst : "", "", "Open het CRM om dit af te handelen."].filter(x => x !== "").join("\n") });
      } catch (e) { console.error("melding portaal", e); }
    }
    return { ok: true, id };
  }

  const portaal = onRequest({ memory: "256MiB", timeoutSeconds: 30 }, async (req, res) => {
    res.set("cache-control", "no-store");
    const pad = String(req.path || "").replace(/^\/api\/portaal/, "").replace(/\/+$/, "") || "/";
    try {
      if (pad === "/login" && req.method === "POST") {
        const email = lc(body(req).email);
        if (!/^\S+@\S+\.\S+$/.test(email)) { res.status(400).json({ fout: "Vul een geldig e-mailadres in." }); return; }
        if (!(await limiet("ip" + ip(req), 12, 3600e3)) || !(await limiet("em" + email, 4, 900e3))) { res.status(429).json({ fout: "U heeft al een paar keer een link aangevraagd. Kijk in uw mail (ook bij ongewenst) of probeer het over een kwartier opnieuw." }); return; }
        const ks = await klantenMetEmail(email);
        if (ks.length) await stuurInlogMail(req, ks[0], email, 1 / 24);
        res.json({ ok: true }); return;   // altijd hetzelfde antwoord: verraadt niet of iemand klant is
      }
      if (pad === "/sessie" && req.method === "POST") {
        const l = String(body(req).l || "");
        if (!/^[a-f0-9]{64}$/.test(l)) { res.status(400).json({ fout: "ongeldig" }); return; }
        const ref = db.doc("portaalLogin/" + sha(l));
        const v = await db.runTransaction(async t => { const s = await t.get(ref); if (!s.exists) return null; t.delete(ref); return s.data(); });
        if (!v || v.exp < Date.now()) { res.status(410).json({ fout: "Deze link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan." }); return; }
        const s = tok();
        await db.doc("portaalSessie/" + sha(s)).set({ klantId: v.klantId, email: v.email, exp: Date.now() + 180 * DAG, gezien: Date.now(), op: nu(), ua: String(req.headers["user-agent"] || "").slice(0, 160) });
        await db.doc("klanten/" + v.klantId).set({ portaalLaatst: nu() }, { merge: true }).catch(() => {});
        res.json({ ok: true, s }); return;
      }
      if (pad === "/merk" && req.method === "GET") {
        const b = await bedrijf(), id = b.logo || b.logoMail || "";
        res.set("cache-control", "public, max-age=300"); res.json({ naam: b.naam || "", logo: id ? basisUrl(req) + "/_blob/" + id : "" }); return;
      }
      if (pad === "/ref" && req.method === "GET") {
        const c = String(req.query.c || "").toUpperCase();
        if (!/^[A-Z0-9]{3,12}$/.test(c)) { res.status(404).json({}); return; }
        const q = await db.collection("klanten").where("refCode", "==", c).limit(1).get(), b = await bedrijf();
        if (q.empty) { res.status(404).json({}); return; }
        const k = q.docs[0].data(), bi = bedrijfInfo(b, basisUrl(req));
        res.json({ voornaam: voornaamVan(schoon(k.contact || k.naam)), plaats: k.plaats || "", welkom: bi.refAan ? bi.refWelkom : 0, bedrijf: { naam: bi.naam, logo: bi.logo, website: bi.website, telefoon: bi.telefoon, kleur: bi.kleur }, code: c }); return;
      }
      const S = await sessie(req);
      if (!S) { res.status(401).json({ fout: "Log opnieuw in." }); return; }
      if (pad === "/data" && req.method === "GET") { res.json(await data(req, S)); return; }
      if (pad === "/uit" && req.method === "POST") { await S.ref.delete(); res.json({ ok: true }); return; }
      if (pad === "/factuur" && req.method === "GET") {
        const f = await db.doc("facturen/" + String(req.query.id || "")).get();
        if (!f.exists || f.data().klantId !== S.klant.id || f.data().soort === "offerte" || f.data().status === "concept") { res.status(404).json({ fout: "niet gevonden" }); return; }
        const x = dec(f.data()), b = await bedrijf();
        res.json({ nummer: x.nummer, datum: x.datum, verval: x.verval, klantNaam: schoon(x.klantNaam), klantAdres: x.klantAdres || "", regels: (x.regels || []).map(r => ({ omschrijving: r.omschrijving, aantal: Number(r.aantal) || 0, prijs: Number(r.prijs) || 0 })), incl: x.incl ?? b.incl ?? true, btwPct: Number(x.btw ?? b.btw ?? 21), ...totals(x, b), status: fStatus(x), betaaldOp: x.betaaldOp || "", betaallink: x.status !== "betaald" ? (x.betaallink || x.mollieLink || "") : "", notitie: x.notitie || "",
          bedrijf: { ...bedrijfInfo(b, basisUrl(req)), adres: b.adres || "", pcPlaats: [b.postcode, b.plaats].filter(Boolean).join(" "), kvk: b.kvk || "", btwnr: b.btwnr || "", bic: b.bic || "" } }); return;
      }
      if (pad === "/betaal" && req.method === "POST") {
        const id = String(body(req).id || ""), f = await db.doc("facturen/" + id).get();
        if (!f.exists || f.data().klantId !== S.klant.id || f.data().status === "betaald" || f.data().soort === "offerte" || f.data().status === "concept") { res.status(404).json({ fout: "niet gevonden" }); return; }
        const x = dec(f.data()), b = await bedrijf(), g = await geheim();
        if (x.betaallink && x.mollieStatus === "open") { res.json({ link: x.betaallink }); return; }
        if (!g.mollieKey) { res.status(409).json({ fout: "Online betalen is nog niet beschikbaar. U kunt het bedrag overmaken." }); return; }
        const base = basisUrl(req);
        const p = await mollie(g.mollieKey, "payments", { method: "POST", body: JSON.stringify({ amount: { currency: "EUR", value: totals(x, b).inc.toFixed(2) }, description: ("Factuur " + (x.nummer || id)).slice(0, 255), redirectUrl: base + "/portaal?betaald=" + encodeURIComponent(id), webhookUrl: base + "/api/mollie", metadata: { factuurId: id } }) });
        const link = p._links && p._links.checkout && p._links.checkout.href;
        await f.ref.set({ mollieId: p.id, mollieLink: link || "", betaallink: link || "", mollieStatus: p.status }, { merge: true });
        res.json({ link }); return;
      }
      if (pad === "/tickets" && req.method === "GET") { res.json(await ticketsLijst(S)); return; }
      if (pad === "/ticket" && req.method === "GET") { try { res.json(await ticketLees(S, req.query.id)); } catch (e) { res.status(404).json({ fout: "Ticket niet gevonden." }); } return; }
      if ((pad === "/tickets" || pad === "/ticket/antwoord") && req.method === "POST") {
        try { res.json(pad === "/tickets" ? await ticketNieuw(S, body(req)) : await ticketAntwoord(S, body(req))); }
        catch (e) { res.status(400).json({ fout: e.message === "te veel" ? "U heeft veel berichten achter elkaar gestuurd. Probeer het zo opnieuw." : e.message === "niet gevonden" ? "Ticket niet gevonden." : e.message }); }
        return;
      }
      if (pad === "/actie" && req.method === "POST") {
        try { res.json(await actie(req, S, body(req))); } catch (e) { res.status(400).json({ fout: /onbekend|niet gevonden/.test(e.message) ? "Dat lukte niet." : e.message === "te veel" ? "Even rustig aan, probeer het later opnieuw." : e.message }); }
        return;
      }
      res.status(404).json({ fout: "niet gevonden" });
    } catch (e) { console.error("portaal", pad, e); res.status(500).json({ fout: "Er ging iets mis. Probeer het zo opnieuw." }); }
  });

  /* ---------- tickets ---------- */
  const T_CAT = { planning: "Planning of afspraak", factuur: "Factuur of betaling", kwaliteit: "Kwaliteit of klacht", toegang: "Toegang", overig: "Overig" };
  async function ticketNummer() { const ref = db.doc("tellers/tickets"); const n = await db.runTransaction(async t => { const s = await t.get(ref); const v = (s.exists ? s.data().n : 1000) + 1; t.set(ref, { n: v }); return v; }); return "T-" + n; }
  async function bewaarFoto(f) {
    if (!f) return "";
    const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(f));
    if (!m || m[3].length > 8e6) throw new Error("Deze foto kan niet worden verstuurd.");
    const id = crypto.randomBytes(16).toString("hex");
    await bucket().file("assets/" + id).save(Buffer.from(m[3], "base64"), { contentType: m[1], resumable: false });
    return id;
  }
  const tKort = t => ({ id: t.id, nummer: t.nummer || "", onderwerp: t.onderwerp || "", categorie: t.categorie || "overig", status: t.status || "open", aangemaakt: t.aangemaakt || "", laatst: t.laatst || "", laatsteTekst: t.laatsteTekst || "", laatsteVan: t.laatsteVan || "", ongelezen: Number(t.ongelezenKlant) || 0 });
  async function ticketsLijst(S) {
    const q = await db.collection("tickets").where("klantId", "==", S.klant.id).get();
    return { tickets: q.docs.map(d => tKort({ id: d.id, ...d.data() })).sort((a, b) => String(b.laatst).localeCompare(String(a.laatst))) };
  }
  async function ticketLees(S, id) {
    const ref = db.doc("tickets/" + String(id || "")), s = await ref.get();
    if (!s.exists || s.data().klantId !== S.klant.id) throw new Error("niet gevonden");
    const q = await db.collection("ticketBerichten").where("ticketId", "==", s.id).get();
    const berichten = q.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.op).localeCompare(String(b.op)))
      .map(m => ({ id: m.id, van: m.van, tekst: m.tekst || "", foto: m.foto || "", op: m.op, naam: m.van === "team" ? (m.doorNaam || "") : "", systeem: !!m.systeem }));
    await ref.set({ ongelezenKlant: 0, gezienKlant: nu() }, { merge: true });
    return { ticket: tKort({ id: s.id, ...s.data() }), berichten, gezienTeam: s.data().gezienTeam || "" };
  }
  async function ticketNieuw(S, d) {
    const k = S.klant, onderwerp = String(d.onderwerp || "").trim().slice(0, 120), tekst = String(d.tekst || "").trim().slice(0, 3000), categorie = T_CAT[d.categorie] ? d.categorie : "overig";
    if (!tekst && !d.foto) throw new Error("Beschrijf kort waar het om gaat.");
    if (!(await limiet("ticket" + k.id, 15, 3600e3))) throw new Error("te veel");
    const foto = await bewaarFoto(d.foto), op = nu(), id = newId("tk"), nummer = await ticketNummer();
    const titel = onderwerp || tekst.split(/\n/)[0].slice(0, 70) || T_CAT[categorie];
    await db.doc("tickets/" + id).set({ klantId: k.id, klantNaam: k.naam || "", adres: [k.adres, k.plaats].filter(Boolean).join(", "), nummer, onderwerp: titel, categorie, status: "open", aangemaakt: op, laatst: op, laatsteTekst: tekst || "Foto", laatsteVan: "klant", ongelezenTeam: 1, ongelezenKlant: 0, gezienKlant: op, bron: "portaal" });
    await db.doc("ticketBerichten/" + newId("tb")).set({ ticketId: id, klantId: k.id, van: "klant", tekst, foto, op });
    return { ok: true, id, nummer };
  }
  async function ticketAntwoord(S, d) {
    const k = S.klant, ref = db.doc("tickets/" + String(d.id || "")), s = await ref.get();
    if (!s.exists || s.data().klantId !== k.id) throw new Error("niet gevonden");
    const tekst = String(d.tekst || "").trim().slice(0, 3000);
    if (!tekst && !d.foto) throw new Error("Typ een bericht.");
    if (!(await limiet("tb" + k.id, 60, 3600e3))) throw new Error("te veel");
    const foto = await bewaarFoto(d.foto), op = nu(), t = s.data();
    await db.doc("ticketBerichten/" + newId("tb")).set({ ticketId: s.id, klantId: k.id, van: "klant", tekst, foto, op });
    await ref.set({ laatst: op, laatsteTekst: tekst || "Foto", laatsteVan: "klant", ongelezenTeam: (Number(t.ongelezenTeam) || 0) + 1, gezienKlant: op, ...(t.status === "opgelost" ? { status: "open", heropend: op } : {}) }, { merge: true });
    return { ok: true, bericht: { id: "n" + Date.now(), van: "klant", tekst, foto, op } };
  }
  /* CRM: klant per mail laten weten dat er een antwoord op zijn ticket is (niet als hij net zelf keek) */
  const ticketMelding = onCall({ memory: "256MiB" }, async req => {
    await checkGebruiker(req.auth);
    const { ticketId, basis } = req.data || {};
    const ts = await db.doc("tickets/" + String(ticketId || "")).get();
    if (!ts.exists) return { ok: false };
    const t = ts.data();
    if (t.gezienKlant && Date.now() - new Date(t.gezienKlant).getTime() < 3 * 60e3) return { ok: true, overgeslagen: "online" };
    if (t.laatsteMailKlant && Date.now() - new Date(t.laatsteMailKlant).getTime() < 20 * 60e3) return { ok: true, overgeslagen: "recent" };
    const s = await db.doc("klanten/" + t.klantId).get(); if (!s.exists) return { ok: false };
    const k = { id: s.id, ...dec(s.data()) }, email = String(k.email || k.pEmail || "").split(/[;,\s]+/)[0];
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, geenMail: true };
    const [g, b] = await Promise.all([geheim(), bedrijf()]);
    if (!g.brevoKey) return { ok: false };
    const tk = tok();
    await db.doc("portaalLogin/" + sha(tk)).set({ klantId: k.id, email: lc(email), exp: Date.now() + 7 * DAG, op: nu() });
    const host = String(basis || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const url = basisUrl({ headers: { "x-forwarded-host": host } }) + "/portaal?l=" + tk + "#ticket-" + ts.id;
    const st = t.status === "opgelost" ? "Wij hebben uw ticket als opgelost gemarkeerd." : "Er is een nieuw antwoord op uw ticket.";
    const tekst = `Beste ${voornaamVan(schoon(k.contact || k.naam))},\n\n${st}\n\n**${t.nummer} · ${t.onderwerp}**\n${String(t.laatsteTekst || "").slice(0, 400)}\n\nMet de knop hieronder opent u het ticket direct.\n\nMet vriendelijke groet,\n${b.naam || "mijnschoonmaker.com"}`;
    const afz = g.afzender || b.email || "info@mijnschoonmaker.com";
    await brevoSend(g.brevoKey, { sender: { name: b.naam || "mijnschoonmaker", email: afz }, replyTo: { email: b.email || afz }, to: [{ email, name: schoon(k.naam) || undefined }], subject: `${t.nummer}: ${t.status === "opgelost" ? "opgelost" : "nieuw antwoord"} · ${b.naam || "mijnschoonmaker.com"}`, htmlContent: mailHtml(tekst, b, { knop: { url, tekst: "Ticket bekijken" } }), textContent: tekst.replace(/\*\*/g, "") + "\n\n" + url, tags: ["portaal", "ticket"] });
    await ts.ref.set({ laatsteMailKlant: nu() }, { merge: true });
    return { ok: true };
  });

  /* CRM: klant uitnodigen voor het portaal (link 14 dagen geldig) */
  const portaalUitnodigen = onCall({ memory: "256MiB" }, async req => {
    await checkGebruiker(req.auth);
    const { klantId, basis } = req.data || {};
    const s = await db.doc("klanten/" + String(klantId || "")).get();
    if (!s.exists) throw new HttpsError("not-found", "Klant niet gevonden.");
    const k = { id: s.id, ...dec(s.data()) }, email = String(k.email || k.pEmail || k.fEmail || "").split(/[;,\s]+/)[0];
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpsError("invalid-argument", "Deze klant heeft geen e-mailadres.");
    const fakeReq = { headers: { "x-forwarded-host": String(basis || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "") } };
    try { await stuurInlogMail(fakeReq, k, email, 14); } catch (e) { throw new HttpsError("internal", "Versturen lukte niet: " + e.message); }
    await s.ref.set({ portaalUitgenodigd: nu() }, { merge: true });
    return { ok: true, email };
  });

  /* aanbevelingscode bij een websiteaanvraag omzetten naar de klant die aanbeveelt */
  async function refKlant(code) {
    const c = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length < 3) return null;
    const q = await db.collection("klanten").where("refCode", "==", c).limit(1).get();
    return q.empty ? null : { id: q.docs[0].id, code: c, naam: q.docs[0].data().naam || "" };
  }
  return { portaal, portaalUitnodigen, ticketMelding, refKlant };
};
