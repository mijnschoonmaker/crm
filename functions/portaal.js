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

/* live kaart: het busje is zichtbaar zodra er nog zoveel adressen (of minder) vóór de klant zijn; zo blijven andere adressen privé */
const LIVE_KAART_VANAF = 2;

module.exports = function maakPortaal(ctx) {
  const { db, T, onRequest, onCall, onSchedule, HttpsError, geheim, bedrijf, brevoSend, mailHtml, HOST, nu, newId, checkGebruiker, mollie, voornaamVan, bucket, portaalUrl, verwerkFactuurBetaling, snelBetaald } = ctx;
  /* moment van versturen: het precieze tijdstip als dat er is; het CRM bewaart soms alleen de datum, dan het aanmaakmoment van die dag */
  const vanTs = f => { if (!f) return ""; if (f.verstuurdTs) return f.verstuurdTs; const v = String(f.verstuurdOp || ""); if (/T\d/.test(v)) return v;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const g = String(f.gemaakt || ""); return g && g.slice(0, 10) === v ? g : v + "T00:00:00"; } return f.gemaakt || ""; };
  const sha = s => crypto.createHash("sha256").update(String(s)).digest("hex");
  const tok = () => T.tok(32);
  const DAG = 864e5;
  const dec = v => Array.isArray(v) ? v.map(dec) : v && typeof v === "object" ? (v.__arr ? v.__arr.map(x => x && x.__a ? x.__a.map(dec) : dec(x)) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;
  const lc = s => String(s || "").trim().toLowerCase();
  const isoNL = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(d);
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const schoon = n => { const s = String(n || "").trim(); return s.includes(",") ? s.split(",").slice(1).join(",").trim() + " " + s.split(",")[0].trim() : s; };

  function basisUrl(req) {
    const h = String(req.headers["x-forwarded-host"] || req.hostname || "").split(",")[0].trim().toLowerCase();
    return /^[a-z0-9.-]+\.(web\.app|firebaseapp\.com|mijnschoonmaker\.com|mansard\.(nl|be|it|uk|co\.uk|eu|com))$/.test(h) ? "https://" + h : HOST();
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
    const s = await db.collection("klanten").select("email", "fEmail", "pEmail", "oEmail", "actief", "naam", "contact", "prospect", "hoofdKlantId").get();
    return s.docs.filter(d => { const x = d.data(); if (x.hoofdKlantId) return false; return [x.email, x.fEmail, x.pEmail, x.oEmail].some(m => String(m || "").toLowerCase().split(/[;,\s]+/).includes(e)); })
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
    const m = /^Bearer ((?:b[a-z0-9]{7}_)?[a-f0-9]{64})$/.exec(String(req.headers.authorization || ""));
    if (!m) return null;
    const ref = db.doc("portaalSessie/" + sha(m[1])), s = await ref.get();
    if (!s.exists || s.data().exp < Date.now()) return null;
    const k = await db.doc("klanten/" + s.data().klantId).get();
    if (!k.exists) return null;
    const voorbeeld = !!s.data().voorbeeld;
    if (!voorbeeld && Date.now() - (s.data().gezien || 0) > DAG) ref.set({ gezien: Date.now(), exp: Date.now() + 180 * DAG }, { merge: true }).catch(() => {});
    return { ref, klant: { id: k.id, ...dec(k.data()) }, kref: k.ref, voorbeeld };
  }
  async function maakRefCode(k) {
    const basis = schoon(k.contact || k.naam).split(/\s+/)[0].normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 6) || "VRIEND";
    for (let i = 0; i < 8; i++) {
      const c = basis + String(crypto.randomInt(10, 100));
      if ((await db.collection("klanten").where("refCode", "==", c).limit(1).get()).empty) return c;
    }
    return basis + crypto.randomBytes(2).toString("hex").toUpperCase();
  }
  /* btw per regel (9% en 21% op één factuur kan); btw 0 op de factuur = alles 0% (verlegd) */
  function totals(f, b) {
    const fb = f.btw != null && f.btw !== "" ? Number(f.btw) : Number(b.btw ?? 21), incl = f.incl ?? b.incl ?? true, g = {};
    (f.regels || []).forEach(r => { const p = fb === 0 && f.btw != null ? 0 : (r.btw != null && r.btw !== "" && !isNaN(Number(r.btw)) ? Number(r.btw) : fb); (g[p] = g[p] || { pct: p, som: 0 }).som += (Number(r.aantal) || 0) * (Number(r.prijs) || 0); });
    if (!Object.keys(g).length) g[fb] = { pct: fb, som: 0 };
    let ex = 0, inc = 0; const tarieven = Object.values(g).sort((a, c) => c.pct - a.pct).map(x => { const e = incl ? x.som / (1 + x.pct / 100) : x.som, i = incl ? x.som : x.som * (1 + x.pct / 100); ex += e; inc += i; return { pct: x.pct, ex: r2(e), btw: r2(i - e), inc: r2(i) }; });
    return { ex: r2(ex), btw: r2(inc - ex), inc: r2(inc), tarieven };
  }
  /* hoe snel betaald: van het versturen van de factuur tot de betaling (alleen als beide tijden bekend zijn) */
  /* seconden tussen versturen en betalen; zonder exact tijdstip (oudere, handmatig afgeboekte facturen) rekenen we met de dag van betaling om 12:00 */
  const betaalSec = f => { if (f.status !== "betaald") return null; const bo = String(f.betaaldOp || f.betaald || "").slice(0, 10), ts = f.betaaldTs || (/^\d{4}-\d{2}-\d{2}$/.test(bo) ? bo + "T12:00:00" : ""); if (!ts) return null;
    const van = Date.parse(vanTs(f) || (f.datum ? f.datum + "T09:00:00" : "")), tot = Date.parse(ts); if (!(van > 0)) return null; return Math.max(0, Math.round((tot - van) / 1000)); };
  const betaalPrecies = f => !!f.betaaldTs;
  /* ranglijst: wie betaalt gemiddeld het snelst (alle klanten, betaalde facturen van de laatste 12 maanden, op de seconde) */
  async function betaalRang(klantId) {
    const sinds = new Date(Date.now() - 365 * DAG).toISOString().slice(0, 10);
    const q = await db.collection("facturen").where("status", "==", "betaald").get();
    const per = {};
    q.docs.forEach(d => { const f = d.data(); if (!f.klantId || f.soort === "offerte" || (f.datum || "") < sinds) return; const sec = betaalSec(f); if (sec == null) return; (per[f.klantId] = per[f.klantId] || []).push({ sec, precies: betaalPrecies(f) }); });
    const lijst = Object.entries(per).map(([id, a]) => ({ id, sec: a.reduce((x, y) => x + y.sec, 0) / a.length, n: a.length, precies: a.every(y => y.precies) })).sort((a, b2) => a.sec - b2.sec);
    const i = lijst.findIndex(x => x.id === klantId);
    return { positie: i < 0 ? null : i + 1, sec: i < 0 ? null : Math.round(lijst[i].sec), beste: lijst.length ? Math.round(lijst[0].sec) : null, n: i < 0 ? 0 : lijst[i].n, precies: i < 0 ? false : lijst[i].precies };
  }
  const snelUren = f => { if (f.status !== "betaald" || !f.betaaldTs) return null; const van = Date.parse(vanTs(f)), tot = Date.parse(f.betaaldTs); if (!(van > 0 && tot >= van)) return null; return Math.round((tot - van) / 36e5 * 10) / 10; };
  const zelfdeDag = f => !!(f.betaaldTs && (f.verstuurdOp || f.gemaakt) && isoNL(new Date(f.betaaldTs)) === isoNL(new Date(vanTs(f))));
  const fStatus = f => f.status === "betaald" ? "betaald" : f.status === "oninbaar" ? "gesloten" : f.verval && f.verval < isoNL() ? "verlopen" : "open";
  const bedrijfInfo = (b, base) => ({ naam: b.naam || "mijnschoonmaker.com", logo: (b.logoMail || b.logo) ? base + "/_blob/" + (b.logoMail || b.logo) : "", telefoon: b.telefoon || "", mobiel: b.mobiel || b.telefoon || "", email: b.email || "", website: b.website || "", iban: b.iban || "", reviewLink: b.reviewLink || "", kleur: b.mailAccent || b.hoofdkleur || "#137a8a",
    voorwaarden: b.voorwaardenPdf ? base + "/_blob/" + b.voorwaardenPdf : "", tijdWeergave: b.portaalTijd || "venster", refAan: b.refAan !== false, refBeloning: b.refBeloning != null && b.refBeloning !== "" ? Number(b.refBeloning) : 20, refWelkom: b.refWelkom != null && b.refWelkom !== "" ? Number(b.refWelkom) : 10, werkStart: b.werkStart || "08:00",
    credits: { review: 0, beurt: 0, extra: numOf(b.crExtra, 3), aanbevelen: numOf(b.refBeloning, 20), snel: numOf(b.crSnel, 0.5), jaar: 0 } });
  const numOf = (v, d) => v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : d;

  /* ---------- live meekijken: waar rijdt de glazenwasser (alleen voor klanten van vandaag) ---------- */
  const tMin = t => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || "")); return m ? (+m[1]) * 60 + (+m[2]) : 9999; };
  const afstand = (a, b, c, d) => { const R = 6371, r = x => x * Math.PI / 180, dl = r(c - a), dg = r(d - b), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  async function klantGeo(kref, k) {
    const key = [k.adres, k.postcode, k.plaats].map(x => String(x || "").trim().toLowerCase()).join("|");
    if (k.geo && k.geo.lat && (k.geo.key === key || k.geo.key === "*")) return [k.geo.lat, k.geo.lng];
    try {
      const r = await fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&fl=centroide_ll&q=" + encodeURIComponent([k.adres, k.postcode, k.plaats].filter(Boolean).join(" ")));
      const j = await r.json(), d = ((j.response || {}).docs || [])[0], m = d && /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(d.centroide_ll || "");
      if (m) { const g = [+m[2], +m[1]]; await kref.set({ geo: { key, lat: g[0], lng: g[1] } }, { merge: true }); return g; }
    } catch (e) { console.error("geo", e.message); }
    return null;
  }
  const DAGK = ["zo", "ma", "di", "wo", "do", "vr", "za"], DAGL = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  const vasteDagen = k => Array.isArray(k && k.weekdagen) && k.weekdagen.length ? [...new Set(k.weekdagen.map(Number))].filter(d => d >= 0 && d <= 6).sort() : null;
  /* VvE: trappenhal-schoonmaak (vaste dagen, checklist) of alleen buitendiensten (glasbewassing, zonnepanelen, dakinspectie…) */
  const vveSoortVan = k => /trap|schoonma|entree|portiek|\bhal\b/i.test(String(k.dienst || "")) || (vasteDagen(k) && !/glas|zonne|dak|goot|gevel/i.test(String(k.dienst || ""))) ? "schoon" : "buiten";
  const freqTxt = w => { w = Number(w) || 0; return w === 999 ? "op afroep" : w === 998 ? "eenmalig" : w === 1 ? "elke week" : w === 13 ? "elk kwartaal" : w === 26 ? "elk half jaar" : w === 52 ? "elk jaar" : w ? "elke " + w + " weken" : ""; };
  const plusW = (d, w) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + Number(w) * 7); return isoNL(x); };
  function vveDiensten(k, jobs) {
    const nu = isoNL(), uit = [];
    const volg = (gepland, laatst, w, vanaf) => gepland && gepland >= nu ? gepland : vanaf && vanaf >= nu ? vanaf : laatst && Number(w) > 0 && Number(w) < 998 ? (plusW(laatst, w) < nu ? nu : plusW(laatst, w)) : "";
    /* omschrijving per dienst voor de klant: aantallen per verdieping of onderdelen */
    const FLN = ["Begane grond", "1e verdieping", "2e verdieping", "3e verdieping"], SPN = { tuimel: "Dak- / tuimelramen", koepel: "Lichtkoepels", lood: "Glas-in-lood", mini: "Miniraampjes" };
    const ramenDet = q => { if (!q || !Array.isArray(q.f)) return ""; const d = q.f.map((n, i) => Number(n) > 0 ? (FLN[i] || (i + "e verdieping")) + " " + Number(n) + " st" : "").filter(Boolean); Object.keys(SPN).forEach(x => { const n = Number(q.sp && q.sp[x]); if (n > 0) d.push(SPN[x] + " " + n + " st") }); return d.join(" · ") };
    const itemsDet = its => (Array.isArray(its) ? its : []).filter(x => x && Number(x.aantal) > 0).map(x => String(x.naam || "Onderdeel") + " " + String(x.aantal).replace(".", ",") + " " + (x.eenheid === "m2" ? "m²" : x.eenheid === "m" ? "m" : "st")).join(" · ");
    const pr = (v, its) => (Array.isArray(its) && its.length) ? null : (Number(v) > 0 ? Number(v) : null);
    if (k.actief !== false && !k.opdrachtVerwijderd) uit.push({ naam: k.dienst || "Glasbewassing", ritme: freqTxt(k.frequentie), volgende: volg(k.gepland, k.laatst, k.frequentie, k.aanbodVanaf), ingepland: !!(k.gepland && k.gepland >= nu), laatst: k.laatst || "", detail: ramenDet(k.ramenRegel) + (k.binnen ? (ramenDet(k.ramenRegel) ? " · " : "") + "binnen en buiten" : ""), prijs: pr(k.prijs), hoofd: true });
    (Array.isArray(k.opdrachten) ? k.opdrachten : []).filter(o => o && o.actief !== false && !o.apart && o.dienst).forEach(o => uit.push({ naam: String(o.dienst), ritme: freqTxt(o.frequentie), volgende: o.volgende && o.volgende >= nu ? o.volgende : (o.volgende && o.volgende < nu ? nu : ""), ingepland: false, laatst: o.laatst || "", detail: itemsDet(o.items) || ramenDet(o.ramen), prijs: pr(o.prijs, o.items), mee: true }));
    (jobs || []).filter(j => j.actief !== false).forEach(j => uit.push({ naam: j.dienst || j.naam || "Opdracht", ritme: freqTxt(j.frequentie), volgende: volg(j.gepland, j.laatst, j.frequentie, j.aanbodVanaf), ingepland: !!(j.gepland && j.gepland >= nu), laatst: j.laatst || "", detail: [j.adres ? String(j.adres) + (j.plaats ? ", " + j.plaats : "") : "", ramenDet(j.ramenRegel)].filter(Boolean).join(" · "), prijs: pr(j.prijs) }));
    const gezien = new Set(); return uit.filter(x => { const key = x.naam.toLowerCase() + "|" + x.ritme; if (gezien.has(key)) return false; gezien.add(key); return true; }).slice(0, 12);
  }
  const ritmeTxt = k => { const dg = vasteDagen(k); if (dg) return dg.length === 7 ? "elke dag" : "elke " + dg.map(d => DAGL[d]).join(" en "); const f = Number(k.frequentie) || 4; return f === 1 ? "elke week" : "elke " + f + " weken"; };
  const vveTakenVan = (k, b) => Array.isArray(k.vveTaken) && k.vveTaken.length ? k.vveTaken.map(String).slice(0, 20) : b && Array.isArray(b.vveTakenStd) && b.vveTakenStd.length ? b.vveTakenStd.map(String).slice(0, 20) : ["Entree en deuren", "Trappenhuis", "Lift", "Bergingsgang"];
  const tijdVan = x => { if (x.startOp) { try { return new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" }).format(new Date(x.startOp)); } catch (e) {} } return x.tijd || ""; };
  async function liveInfo(S) {
    const k = S.klant, dag = isoNL();
    if (!(k.gepland === dag || (Array.isArray(k.reeks) && k.reeks.some(r => r && r.d === dag)))) return null;
    const [ls, ks, bs] = await Promise.all([db.doc("live/rit").get(), db.collection("klanten").where("gepland", "==", dag).get(), db.collection("beurten").where("datum", "==", dag).get()]);
    const klaar = new Set(bs.docs.map(d => d.data().klantId));
    if (klaar.has(k.id)) return { status: "klaar" };
    if (k.bezig && k.gepland === dag) return { status: "bezig" };
    /* meerdere bussen: als dit adres in de dagroute aan iemand is toegewezen, volgen we die bus en tellen we alleen zijn adressen */
    const nmW = x => String(x || "").trim().split(/[\s@._-]/)[0].toLowerCase();
    let wie = {}, order = [], L = ls.exists ? ls.data() : null;
    try { const rd = await db.doc("routes/" + dag).get(); if (rd.exists) { const r = rd.data() || {}; wie = r.wie || {}; order = Array.isArray(r.order) ? r.order : []; } } catch (e) {}
    const mijn = nmW(wie[k.id]);
    if (mijn) { try { const lq = await db.collection("live").where("datum", "==", dag).get(); const m = lq.docs.filter(d => d.id.startsWith("mw_")).map(d => d.data()).find(x => nmW(x.naam) === mijn); if (m) L = m; } catch (e) {} }
    if (!L || !L.actief || L.datum !== dag || !(Date.now() - Date.parse(L.ts) < 5 * 60e3)) return { status: "uit" };
    const lijst = ks.docs.map(d => ({ id: d.id, ...dec(d.data()) })).filter(x => x.actief !== false && !klaar.has(x.id) && (!mijn || nmW(wie[x.id]) === mijn))
      /* zelfde volgorde als de dagroute in het CRM (Vandaag); alleen zonder vaste volgorde op tijd */
      .sort((a, b) => { const ia = order.indexOf(a.id), ib = order.indexOf(b.id); if (ia > -1 || ib > -1) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); return tMin(a.tijd) - tMin(b.tijd); });
    const i = lijst.findIndex(x => x.id === k.id), voor = Math.max(0, i), bezigBij = lijst.slice(0, Math.max(0, i)).some(x => x.bezig);
    const huis = await klantGeo(S.kref, k);
    const km = huis ? afstand(L.lat, L.lng, huis[0], huis[1]) : null, rij = km != null ? Math.round(km * 1.35 / 38 * 60) + 2 : 12;
    const werk = lijst.slice(0, voor).reduce((a, x) => a + (Number(x.duur) || 30), 0) + voor * 8;
    const eta = new Date(Date.now() + (voor ? werk + rij : rij) * 60e3);
    const etaTxt = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(eta);
    /* de exacte plek van de bus alleen als u bijna aan de beurt bent: zo zien klanten niet bij wie we verder allemaal komen */
    const dichtbij = voor <= LIVE_KAART_VANAF;
    return { status: "onderweg", voor, bezigBij, eta: etaTxt, km: km != null ? Math.round(km * 10) / 10 : null, naam: L.naam || "", huis: dichtbij ? huis : null,
      pos: dichtbij && !(Number(L.nauw) > 150) ? { lat: L.lat, lng: L.lng, koers: L.koers ?? null, ts: L.ts, sec: Math.max(0, Math.round((Date.now() - Date.parse(L.ts)) / 1000)) } : null };
  }

  /* getekende offerte: online ondertekend of op akkoord gezet; datum altijd als JJJJ-MM-DD */
  const offGetekend = f => !!(f && f.soort === "offerte" && (f.getekend || f.status === "geaccepteerd"));
  const offDatum = f => { const g = (f && f.getekend) || {}; for (const v of [g.datum, g.op, f.akkoordOp, f.geaccepteerdOp]) { if (v == null || v === "") continue;
      if (typeof v === "number") return new Date(v).toISOString().slice(0, 10); if (v && typeof v.toDate === "function") return v.toDate().toISOString().slice(0, 10);
      const t = String(v); if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10); const m = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/); if (m) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
      const d = new Date(t); if (!isNaN(d)) return d.toISOString().slice(0, 10); } return ""; };
  async function data(req, S) {
    const k = S.klant, b = await bedrijf(), base = basisUrl(req), vandaag = isoNL();
    if (!k.refCode) { k.refCode = await maakRefCode(k); await S.kref.set({ refCode: k.refCode }, { merge: true }); }
    const tq = await db.collection("tickets").where("klantId", "==", k.id).get(), tks = tq.docs.map(d => d.data());
    /* losse opdrachten (apart ingepland) horen bij deze klant: hun bezoeken en facturen ook tonen */
    const jq = await db.collection("klanten").where("hoofdKlantId", "==", k.id).get().catch(() => ({ docs: [] })), ids = [k.id, ...jq.docs.map(d => d.id)].slice(0, 10);
    const [bs, fs, vz, rk, ra] = await Promise.all([
      db.collection("beurten").where("klantId", "in", ids).get(),
      db.collection("facturen").where("klantId", "in", ids).get(),
      db.collection("portaalVerzoeken").where("klantId", "==", k.id).get(),
      db.collection("klanten").where("aanbevolenDoor", "==", k.id).get(),
      db.collection("aanvragen").where("aanbevolenDoor", "==", k.id).get()
    ]);
    const beurten = bs.docs.map(d => ({ id: d.id, ...dec(d.data()) })).filter(x => x.datum).sort((a, b2) => b2.datum.localeCompare(a.datum));
    /* getekende offertes: de klant kan ze terugzien (de ondertekende versie op /akkoord/<token>) */
    const offRuw = fs.docs.map(d => ({ id: d.id, ...dec(d.data()) })).filter(f => f.soort === "offerte" && (f.getekend || f.status === "geaccepteerd"));
    const offertes = [];
    for (const f of offRuw.sort((a, b2) => String(b2.datum).localeCompare(String(a.datum))).slice(0, 20)) {
      let link = ""; try { const q = await db.collection("akkoord").where("factuurId", "==", f.id).limit(1).get(); if (!q.empty) link = base + "/akkoord/" + q.docs[0].id; } catch (x) {}
      const g = f.getekend || {};
      offertes.push({ id: f.id, nummer: String(f.nummer || "").replace(/^OFF-/, ""), datum: f.datum || "", bedrag: totals(f, b).inc, getekendOp: offDatum(f), getekendDoor: g.naam || "", link });
    }
    const facturen = fs.docs.map(d => ({ id: d.id, ...dec(d.data()) })).filter(f => f.soort !== "offerte" && f.status !== "concept").sort((a, b2) => String(b2.datum).localeCompare(String(a.datum)))
      .map(f => ({ id: f.id, nummer: f.nummer || "", datum: f.datum || "", verval: f.verval || "", bedrag: totals(f, b).inc, status: fStatus(f), betaaldOp: f.status === "betaald" ? String(f.betaaldOp || f.betaald || "").slice(0, 10) : "", snelUren: snelUren(f), sec: betaalSec(f), incasso: !!f.incasso, incassoStatus: f.incasso ? (f.mollieStatus || "") : "", herinnerd: Number(f.herinneringen) || 0, betaallink: f.status !== "betaald" ? (f.betaallink || f.mollieLink || "") : "" }));
    const freqW = Number(k.frequentie) || 4;
    let volgende = null;
    if (k.gepland && k.gepland >= vandaag) volgende = { datum: k.gepland, tijd: k.tijd || "", bezig: !!k.bezig && k.gepland === vandaag, reeks: (k.reeks || []).filter(x => x && x.d > k.gepland).slice(0, 12).map(x => ({ datum: x.d, tijd: x.t || "" })) };
    let verwacht = "";
    if (!volgende && k.actief !== false && !k.prospect) { const l = k.laatst ? new Date(k.laatst + "T12:00:00") : null; verwacht = l ? isoNL(new Date(Math.max(Date.now(), l.getTime() + freqW * 7 * DAG))) : ""; }
    const laatsteB = beurten[0];
    const vve = k.soort === "vve", wdg = vasteDagen(k);
    let bordToken = k.bordToken || "";
    if (vve && !/^(?:b[a-z0-9]{7}_)?[a-f0-9]{24,}$/.test(bordToken)) { bordToken = T.tok(16); await S.kref.set({ bordToken }, { merge: true }).catch(() => {}); }
    const fotoUrl = id => /^[\w-]{6,64}$/.test(String(id || "")) ? base + "/_blob/" + id : "";
    const meldingenVan = (bs, kl) => [...(kl.bevindingen || []).map(b => ({ ...b, datum: b.datum || vandaag })), ...bs.flatMap(x => (x.meldingen || []).map(m => ({ ...m, datum: m.datum || x.datum })))]
      .filter(m => m && m.id).map(m => ({ datum: m.datum, categorie: m.categorie || "", tekst: String(m.notitie || "").slice(0, 400), foto: fotoUrl(m.id) })).sort((a, b2) => String(b2.datum).localeCompare(String(a.datum))).slice(0, 20);
    const aanbevolen = [
      ...ra.docs.map(d => d.data()).filter(a => a.status === "nieuw" || a.status === "bezig").map(a => ({ naam: voornaamVan(((a.aanvraag || {}).klant || {}).naam || ""), datum: String(a.ontvangen || "").slice(0, 10), status: "aangemeld" })),
      ...rk.docs.map(d => dec(d.data())).map(x => ({ naam: voornaamVan(schoon(x.contact || x.naam)), datum: x.aangemaakt || "", status: x.aanbevelingBeloond ? "beloond" : x.actief === false ? "gestopt" : x.akkoord === false || x.prospect ? "akkoord" : "eerste" }))
    ].sort((a, b2) => String(b2.datum).localeCompare(String(a.datum)));
    const tegoed = (k.tegoed || []).filter(t => t && Number(t.bedrag) > 0);
    let extraDiensten = [];
    try { const ud = await db.doc("instellingen/uitvoering").get(); if (ud.exists) { const u = dec(ud.data());
      extraDiensten = [...(u.groepen || []), ...(u.eigen || [])].filter(g => g && !g.verberg && !["rolluik", "antispin", "antialg", "schoorsteen", "spoed", "hogedruk", "binnen"].includes(g.id) && !/glasbewassing binnen/i.test(String(g.naam || "")) && g.type !== "glas" && g.type !== "bijz" && String(g.naam || "").trim()).map(g => String(g.naam).trim()).slice(0, 24); } } catch (e) { console.error("diensten", e); }
    return {
      bedrijf: { ...bedrijfInfo(b, base), extraDiensten },
      klant: { voornaam: voornaamVan(schoon(k.contact || k.naam)), naam: schoon(k.naam), contact: k.contact || "", adres: k.adres || "", postcode: k.postcode || "", plaats: k.plaats || "", pcPlaats: [k.postcode, k.plaats].filter(Boolean).join(" "), email: k.email || "", telefoon: k.telefoon || "", mobiel: k.mobiel || "", zakelijk: k.soort === "zakelijk" || k.soort === "vve",
        vve, vveSoort: vve ? vveSoortVan(k) : "", diensten: vveDiensten(k, jq.docs.map(d => ({ id: d.id, ...dec(d.data()) }))), ritme: ritmeTxt(k), weekdagen: wdg || [], taken: vveTakenVan(k, b), takenFreq: Object.fromEntries(Object.entries(k.vveFreq && typeof k.vveFreq === "object" ? k.vveFreq : {}).filter(([n, f]) => typeof f === "string" && ["week", "2week", "maand", "kwartaal", "halfjaar", "jaar"].includes(f)).slice(0, 20).map(([n, f]) => [String(n).slice(0, 60), f])),
        klantnr: k.klantnr || "", sinds: k.aangemaakt || (beurten.length ? beurten[beurten.length - 1].datum : ""), dienst: k.dienst || "Glasbewassing", frequentie: freqW, prijs: Number(k.prijs) || 0, binnen: !!k.binnen, actief: k.actief !== false,
        toegang: k.portaalToegang || { opties: [], tekst: "" }, beheercode: String(k.beheercode || ""), nieuw: !!k.eersteKeer && !beurten.length,
        incasso: { actief: !!k.incasso && !!k.mollieMandateId, sinds: String(k.incassoSinds || "").slice(0, 10), bank: k.incassoBank || "", rekening: k.incassoRekening || "", beschikbaar: !!(await geheim()).mollieKey } },
      volgende, verwacht,
      bezoeken: beurten.slice(0, 30).map(x => ({ id: x.id, datum: x.datum, tijd: tijdVan(x), door: vve && b.vveDoor === false ? "" : voornaamVan(String(x.door || "")), dienst: x.dienst || k.dienst || "Glasbewassing", extra: x.extra || [], bedrag: Number(x.bedrag) || 0, beoordeling: x.beoordeling ? { sterren: x.beoordeling.sterren } : null,
        ...(vve ? { /* alleen wat er gedaan is: niet-gedane taken ziet de klant niet */ taken: Array.isArray(x.taken) ? x.taken.filter(t => t && t.ok).map(t => ({ naam: String(t.naam || ""), ok: true })) : [], fotos: (x.fotos || []).map(f => fotoUrl(f.id)).filter(Boolean), notitie: String(x.notitie || "").slice(0, 400) } : {}) })),
      ...(vve ? { bord: { url: base + "/bord/" + bordToken }, meldingen: meldingenVan(beurten, k).filter(m => m.categorie !== "vuil") } : {}),
      teBeoordelen: laatsteB && !laatsteB.beoordeling && (Date.now() - new Date(laatsteB.datum + "T12:00:00").getTime()) < 21 * DAG ? { id: laatsteB.id, datum: laatsteB.datum } : null,
      aantalBezoeken: beurten.length,
      documenten: (Array.isArray(k.documenten) ? k.documenten : []).filter(d => d && d.id && d.portaal === true).map(d => ({ naam: String(d.naam || "").slice(0, 120), soort: d.soort || "overig", datum: String(d.datum || "").slice(0, 10), url: fotoUrl(d.id) })).filter(d => d.url),
      facturen, offertes,
      rang: await betaalRang(k.id).catch(e => { console.error("rang", e); return null; }),
      live: await liveInfo(S).catch(e => { console.error("live", e); return null; }),
      tickets: { open: tks.filter(t => t.status !== "opgelost").length, ongelezen: tks.reduce((a, t) => a + (Number(t.ongelezenKlant) || 0), 0) },
      verzoeken: vz.docs.map(d => ({ id: d.id, ...d.data() })).filter(v => v.type !== "beoordeling" && v.type !== "toegang" && !v.ticketId).sort((a, b2) => String(b2.op).localeCompare(String(a.op))).slice(0, 8)
        .map(v => ({ type: v.type, status: v.status, op: v.op, datum: v.datum || "", tot: v.tot || "", tekst: v.tekst || "", antwoord: v.antwoord || "" })),
      credits: (() => { const alle = [...tegoed.map(t => ({ ...t, open: true })), ...(k.tegoedGebruikt || []).map(t => ({ ...t, open: false }))].filter(t => Number(t.bedrag) > 0)
          .map(t => ({ bedrag: Number(t.bedrag), reden: String(t.reden || ""), bron: t.bron || (/aanbeveling/i.test(t.reden || "") ? "aanbevelen" : "overig"), op: String(t.op || t.gebruiktOp || "").slice(0, 10), open: t.open })).sort((a, b2) => b2.op.localeCompare(a.op));
        const rv = vz.docs.map(d => d.data()).filter(x => x.type === "review"); const rvDone = alle.some(t => t.bron === "review");
        return { saldo: r2(tegoed.reduce((a, t) => a + Number(t.bedrag), 0)), verdiend: r2(alle.reduce((a, t) => a + t.bedrag, 0)), regels: alle.slice(0, 30), tarieven: bedrijfInfo(b, base).credits,
          review: rvDone ? "toegekend" : rv.length ? "aangevraagd" : "open", beoordeeld: beurten.filter(x => x.beoordeling).length }; })(),
      aanbevelen: { code: k.refCode, link: base + "/aanbevolen/" + k.refCode, lijst: aanbevolen, tegoed: r2(tegoed.reduce((a, t) => a + Number(t.bedrag), 0)), opHold: aanbevolen.filter(x => ["aangemeld", "akkoord", "eerste"].includes(x.status)).length, tegoedRegels: tegoed.map(t => ({ bedrag: Number(t.bedrag), reden: t.reden || "" })), verdiend: r2((k.tegoedGebruikt || []).reduce((a, t) => a + (Number(t.bedrag) || 0), 0)) }
    };
  }

  const TYPES = { verzetten: "Afspraak verzetten", overslaan: "Bezoek overslaan", vakantie: "Afwezig / vakantie", bericht: "Bericht", gegevens: "Gegevens wijzigen", extra: "Extra dienst aanvragen", review: "Google-review geplaatst", stoppen: "Opzeggen", beoordeling: "Beoordeling", toegang: "Toegang en instructies", beheercode: "Beheercode op de factuur" };
  /* ligt de afspraak (datum + tijd, Nederlandse tijd) binnen 48 uur? Zonder tijd: 08:00 */
  function binnen48(datum, tijd) {
    const t = /^\d{1,2}:\d{2}/.test(String(tijd || "")) ? String(tijd).slice(0, 5).padStart(5, "0") : "08:00";
    const ruw = new Date(datum + "T" + t + ":00Z").getTime();
    const off = (() => { try { const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", timeZoneName: "shortOffset" }).formatToParts(new Date(ruw)).find(x => x.type === "timeZoneName").value; const m = /GMT([+-]\d+)/.exec(p); return m ? Number(m[1]) : 1; } catch (e) { return 1; } })();
    return ruw - off * 3600e3 - Date.now() < 48 * 3600e3;
  }
  /* hoort deze factuur bij de ingelogde klant (of bij een losse opdracht van die klant)? */
  async function vanKlant(S, kid) { if (kid === S.klant.id) return true; if (!kid) return false; try { const j = await db.doc("klanten/" + kid).get(); return j.exists && j.data().hoofdKlantId === S.klant.id; } catch (e) { return false; } }
  async function actie(req, S, d) {
    const k = S.klant, type = String(d.type || "");
    if (!TYPES[type]) throw new Error("onbekend");
    if (type === "bericht") return ticketNieuw(S, { tekst: d.tekst, categorie: "overig" });   // losse berichten worden een ticket
    if (!(await limiet("actie" + k.id, 30, 3600e3))) throw new Error("te veel");
    const txt = s => String(s || "").trim().slice(0, 1500), dt = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? String(s) : "";
    const v = { klantId: k.id, klantNaam: k.naam || "", adres: [k.adres, k.plaats].filter(Boolean).join(", "), type, titel: TYPES[type], tekst: txt(d.tekst), status: "nieuw", op: nu(), bron: "portaal" };
    if (type === "verzetten" || type === "overslaan") { v.datum = dt(d.datum) || k.gepland || ""; v.voorkeur = txt(d.voorkeur).slice(0, 200);
      /* tot 48 uur voor de afspraak; daarna staat de route vast */
      if (v.datum && v.datum === k.gepland && binnen48(v.datum, k.tijd)) throw new Error("Verzetten of overslaan kan tot 48 uur voor de afspraak. Neem even contact met ons op, dan kijken we wat er nog kan."); }
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
    if (type === "review") {
      const bestaand = await db.collection("portaalVerzoeken").where("klantId", "==", k.id).where("type", "==", "review").get();
      if (!bestaand.empty) throw new Error("U heeft dit al doorgegeven. Dank u wel!");
      v.tekst = txt(d.tekst).slice(0, 300); v.status = "nieuw";
    }
    if (type === "extra") { v.diensten = (Array.isArray(d.diensten) ? d.diensten : []).map(x => txt(x).slice(0, 60)).slice(0, 8); }
    if (type === "toegang") {
      const opties = (Array.isArray(d.opties) ? d.opties : []).map(x => txt(x).slice(0, 60)).slice(0, 10), toegang = { opties, tekst: txt(d.tekst).slice(0, 600), code: txt(d.code).replace(/\s+/g, " ").slice(0, 40), op: nu() };
      await S.kref.set({ portaalToegang: toegang }, { merge: true });
      v.toegang = toegang; v.status = "info";
    }
    if (type === "beheercode") {
      const bc = txt(d.code).replace(/\s+/g, " ").trim().slice(0, 60);
      await S.kref.set({ beheercode: bc }, { merge: true });
      v.beheercode = bc; v.status = "info";
    }
    if (type === "beoordeling") {
      const st = Math.max(1, Math.min(5, Math.round(Number(d.sterren) || 0)));
      const bref = db.doc("beurten/" + String(d.beurtId || "")), bs = await bref.get();
      if (!bs.exists || bs.data().klantId !== k.id) throw new Error("bezoek niet gevonden");
      await bref.set({ beoordeling: { sterren: st, tekst: v.tekst, op: nu() } }, { merge: true });
      Object.assign(v, { sterren: st, beurtId: bref.id, datum: bs.data().datum || "", status: st <= 3 ? "nieuw" : "info" });
      /* beoordelen van een bezoek levert geen credits meer op */
    }
    if (type === "bericht" && !v.tekst) throw new Error("Schrijf een bericht.");
    const id = newId("pv");
    /* verzoeken die een reactie vragen, worden meteen een ticket: zo kun je antwoorden en ziet de klant het gesprek */
    if (v.status === "nieuw") { try { v.ticketId = await verzoekTicket(k, v); v.status = "ticket"; } catch (e) { console.error("verzoek→ticket", e); } }
    await db.doc("portaalVerzoeken/" + id).set(v);
    /* ook als het verzoek meteen een ticket werd: een mail naar het bedrijf, zodat er actie op komt */
    if (v.status === "nieuw" || v.ticketId) {
      try {
        const [g, b] = await Promise.all([geheim(), bedrijf()]);
        if (g.brevoKey && (g.meldAdres || b.email)) await brevoSend(g.brevoKey, { sender: { name: "mijnschoonmaker CRM", email: g.afzender || b.email }, to: [{ email: g.meldAdres || b.email }], replyTo: k.email ? { email: k.email } : undefined,
          subject: `Klantportaal: ${v.titel} · ${schoon(k.naam)}`, textContent: [`${schoon(k.naam)} (${v.adres}) via het klantportaal:`, "", v.titel + (v.datum ? " · " + v.datum : "") + (v.tot ? " t/m " + v.tot : "") + (v.sterren ? " · " + v.sterren + " sterren" : ""), v.voorkeur ? "Voorkeur: " + v.voorkeur : "", v.diensten && v.diensten.length ? "Diensten: " + v.diensten.join(", ") : "", v.wijziging ? "Al doorgevoerd in het CRM:\n" + Object.keys(v.wijziging).map(f => "- " + f + ": " + ((v.oud || {})[f] || "–") + " → " + (v.wijziging[f] || "–")).join("\n") : "", v.tekst ? "\n" + v.tekst : "", "", "Open het CRM om dit af te handelen."].filter(x => x !== "").join("\n") });
      } catch (e) { console.error("melding portaal", e); }
    }
    return { ok: true, id, ticketId: v.ticketId || "" };
  }
  const datNL = s => { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))) return ""; const d = new Date(s + "T12:00:00"); return new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(d); };
  function verzoekTekst(v) {
    const r = [];
    if (v.type === "verzetten") r.push(`Ik wil mijn afspraak${v.datum ? " van " + datNL(v.datum) : ""} graag verzetten.`);
    if (v.type === "overslaan") r.push(`Ik wil het bezoek${v.datum ? " van " + datNL(v.datum) : ""} graag overslaan.`);
    if (v.type === "vakantie") r.push(`Ik ben afwezig van ${datNL(v.datum)} tot en met ${datNL(v.tot)}.`);
    if (v.type === "extra") r.push("Ik wil graag een extra dienst" + (v.diensten && v.diensten.length ? ": " + v.diensten.join(", ").toLowerCase() : "") + ".");
    if (v.type === "stoppen") r.push("Ik wil mijn abonnement opzeggen.");
    if (v.type === "gegevens") r.push("Ik heb mijn gegevens gewijzigd: " + Object.keys(v.wijziging || {}).map(f => f + " " + ((v.oud || {})[f] || "–") + " → " + (v.wijziging[f] || "–")).join(", ") + ".");
    if (v.type === "beoordeling") r.push(`Beoordeling van het bezoek${v.datum ? " van " + datNL(v.datum) : ""}: ${v.sterren} van 5 sterren.`);
    if (v.voorkeur) r.push("Voorkeur: " + v.voorkeur);
    if (v.tekst) r.push(v.tekst);
    return r.join("\n");
  }
  async function verzoekTicket(k, v) {
    const op = nu(), id = newId("tk"), nummer = await ticketNummer(), tekst = verzoekTekst(v);
    const cat = ["verzetten", "overslaan", "vakantie"].includes(v.type) ? "planning" : v.type === "beoordeling" ? "kwaliteit" : "overig";
    await db.doc("tickets/" + id).set({ klantId: k.id, klantNaam: k.naam || "", adres: [k.adres, k.plaats].filter(Boolean).join(", "), nummer, onderwerp: TYPES[v.type] + (v.datum && v.type !== "beoordeling" ? " · " + datNL(v.datum) : ""), categorie: cat, status: "open", aangemaakt: op, laatst: op, laatsteTekst: tekst.split("\n")[0], laatsteVan: "klant", ongelezenTeam: 1, ongelezenKlant: 0, gezienKlant: op, bron: "portaal", verzoek: { type: v.type, datum: v.datum || "", tot: v.tot || "", ...(v.diensten && v.diensten.length ? { diensten: v.diensten } : {}) } });
    await db.doc("ticketBerichten/" + newId("tb")).set({ ticketId: id, klantId: k.id, van: "klant", tekst, foto: "", op });
    return id;
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
        if (!/^(?:b[a-z0-9]{7}_)?[a-f0-9]{64}$/.test(l)) { res.status(400).json({ fout: "ongeldig" }); return; }
        const ref = db.doc("portaalLogin/" + sha(l));
        const v = await db.runTransaction(async t => { const s = await t.get(ref); if (!s.exists) return null; if (!s.data().herbruik) t.delete(ref); return s.data(); });
        if (!v || v.exp < Date.now()) { res.status(410).json({ fout: "Deze link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan." }); return; }
        const s = tok();
        if (v.voorbeeld) {
          /* meekijken vanuit het CRM: alleen bekijken, een uur geldig, telt niet als inloggen van de klant */
          await db.doc("portaalSessie/" + sha(s)).set({ klantId: v.klantId, email: "", exp: Date.now() + 3600e3, voorbeeld: true, door: v.door || "", op: nu() });
          res.json({ ok: true, s, voorbeeld: true }); return;
        }
        await db.doc("portaalSessie/" + sha(s)).set({ klantId: v.klantId, email: v.email, exp: Date.now() + 180 * DAG, gezien: Date.now(), op: nu(), ua: String(req.headers["user-agent"] || "").slice(0, 160) });
        await db.doc("klanten/" + v.klantId).set({ portaalLaatst: nu() }, { merge: true }).catch(() => {});
        res.json({ ok: true, s }); return;
      }
      if (pad === "/merk" && req.method === "GET") {
        const b = await bedrijf(), id = b.logo || b.logoMail || "";
        res.set("cache-control", "public, max-age=300"); res.json({ naam: b.naam || "", logo: id ? basisUrl(req) + "/_blob/" + id : "" }); return;
      }
      /* na het betalen via Mollie: korte bedankpagina, ook zonder in te loggen (het factuurnummer-id is niet te raden) */
      if (pad === "/bedankt" && req.method === "GET") {
        const id = String(req.query.id || "");
        if (!/^[\w-]{1,60}$/.test(id)) { res.status(404).json({}); return; }
        const fs_ = await db.doc("facturen/" + id).get();
        if (!fs_.exists || fs_.data().soort === "offerte") { res.status(404).json({}); return; }
        const f = dec(fs_.data()); let voornaam = "";
        try { const kd = await db.doc("klanten/" + f.klantId).get(); if (kd.exists) { const k = dec(kd.data()); voornaam = voornaamVan(schoon(k.contact || k.naam)); } } catch (e) {}
        res.json({ betaald: f.status === "betaald", nummer: f.nummer || "", uren: snelUren(f), zelfdeDag: zelfdeDag(f), voornaam }); return;
      }
      /* ons werk: openbare fotogalerij voor de website (beheer in het CRM, Instellingen › Ons werk) */
      if (pad === "/werk" && req.method === "GET") {
        res.set("Access-Control-Allow-Origin", "*"); res.set("Cache-Control", "public, max-age=300");
        const d = await db.doc("instellingen/galerij").get(), base = basisUrl(req);
        const items = (d.exists && Array.isArray(d.data().items) ? d.data().items : []).filter(x => x && x.blob && x.aan !== false)
          .map(x => ({ url: base + "/_blob/" + x.blob, thumb: base + "/_blob/" + (x.thumb || x.blob), w: Number(x.w) || 4, h: Number(x.h) || 3, titel: String(x.titel || "").slice(0, 80), plaats: String(x.plaats || "").slice(0, 60), cat: String(x.cat || "woning") }));
        res.json({ items }); return;
      }
      /* bewonersbord: openbare, afgeslankte weergave voor het bordje in de hal (QR-code), zonder inloggen */
      if (pad === "/bord" && req.method === "GET") {
        const t = String(req.query.t || "");
        if (!/^(?:b[a-z0-9]{7}_)?[a-f0-9]{24,64}$/.test(t)) { res.status(404).json({}); return; }
        const q = await db.collection("klanten").where("bordToken", "==", t).limit(1).get();
        if (q.empty) { res.status(404).json({}); return; }
        const k = dec(q.docs[0].data()), kid = q.docs[0].id, b = await bedrijf(), bi = bedrijfInfo(b, basisUrl(req)), base = basisUrl(req);
        if (k.soort !== "vve" || k.actief === false) { res.status(404).json({}); return; }
        const bs = (await db.collection("beurten").where("klantId", "==", kid).get()).docs.map(d => ({ id: d.id, ...dec(d.data()) })).filter(x => x.datum).sort((a, b2) => b2.datum.localeCompare(a.datum));
        const fotoUrl = id => /^[\w-]{6,64}$/.test(String(id || "")) ? base + "/_blob/" + id : "";
        const vandaag = isoNL(), wdg = vasteDagen(k);
        let volgende = k.gepland && k.gepland >= vandaag ? { datum: k.gepland, tijd: k.tijd || "" } : null;
        if (!volgende && wdg) { const d = new Date(vandaag + "T12:00:00"); for (let i = 1; i < 9; i++) { d.setDate(d.getDate() + 1); if (wdg.includes(d.getDay())) { volgende = { datum: isoNL(d), tijd: "" }; break; } } }
        /* live volgen op de dag zelf: zonder exacte plek (het bord is openbaar), wel hoeveel adressen nog en hoe laat */
        let live = null;
        if (b.vveBordLive !== false) try { const L = await liveInfo({ klant: { ...k, id: kid }, kref: q.docs[0].ref }); if (L) live = { status: L.status, voor: L.voor ?? null, eta: L.eta || "", naam: L.naam || "", bezigBij: !!L.bezigBij, km: L.km ?? null, huis: L.status === "onderweg" ? (L.huis || await klantGeo(q.docs[0].ref, { ...k, id: kid }).catch(() => null)) : null, pos: L.pos || null }; } catch (e) { console.error("bordlive", e); }
        res.set("cache-control", live ? "no-store" : "public, max-age=120");
        res.json({ live, bedrijf: { naam: bi.naam, logo: bi.logo, telefoon: bi.telefoon, whatsapp: String(b.webWa || b.mobiel || b.telefoon || ""), email: bi.email || "", website: bi.website, kleur: bi.kleur }, naam: schoon(k.naam), adres: k.adres || "", plaats: k.plaats || "", ritme: ritmeTxt(k), soort: vveSoortVan(k), diensten: vveSoortVan(k) === "buiten" ? vveDiensten(k, (await db.collection("klanten").where("hoofdKlantId", "==", kid).get().catch(() => ({ docs: [] }))).docs.map(d => ({ id: d.id, ...dec(d.data()) }))).map(x => ({ naam: x.naam, ritme: x.ritme, volgende: x.volgende })) : [],
          bezig: !!k.bezig && k.gepland === vandaag, volgende,
          bezoeken: bs.slice(0, 8).map(x => ({ datum: x.datum, tijd: tijdVan(x), door: b.vveDoor === false ? "" : voornaamVan(String(x.door || "")), taken: [], fotos: [], notitie: "" })) });
        return;
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
      if (S.voorbeeld && req.method !== "GET" && pad !== "/uit") { res.status(403).json({ fout: "Dit is een voorbeeld vanuit het CRM: hier kun je alleen kijken." }); return; }
      if (pad === "/data" && req.method === "GET") { const d = await data(req, S); if (S.voorbeeld) d.voorbeeld = true; res.json(d); return; }
      if (pad === "/live" && req.method === "GET") { res.json({ live: await liveInfo(S) }); return; }
      if (pad === "/uit" && req.method === "POST") { await S.ref.delete(); res.json({ ok: true }); return; }
      if (pad === "/factuur" && req.method === "GET") {
        const f = await db.doc("facturen/" + String(req.query.id || "")).get();
        if (!f.exists || !(await vanKlant(S, f.data().klantId)) || (f.data().soort === "offerte" && !offGetekend(f.data())) || f.data().status === "concept") { res.status(404).json({ fout: "niet gevonden" }); return; }
        const x = dec(f.data()), b = await bedrijf();
        res.json({ soort: x.soort === "offerte" ? "offerte" : "factuur", getekend: x.soort === "offerte" ? { naam: (x.getekend || {}).naam || "", datum: offDatum(x) } : null, pdf: !!x.pdfId, incasso: !!x.incasso && x.status !== "betaald" && !x.incassoMislukt, nummer: x.nummer, datum: x.datum, verval: x.verval, klantNaam: schoon(x.klantNaam), klantAdres: x.klantAdres || "", regels: (x.regels || []).map(r => ({ omschrijving: r.omschrijving, aantal: Number(r.aantal) || 0, prijs: Number(r.prijs) || 0 })), incl: x.incl ?? b.incl ?? true, btwPct: Number(x.btw ?? b.btw ?? 21), ...totals(x, b), status: fStatus(x), betaaldOp: x.betaaldOp || "", betaallink: x.status !== "betaald" ? (x.betaallink || x.mollieLink || "") : "", notitie: x.notitie || "",
          bedrijf: { ...bedrijfInfo(b, basisUrl(req)), adres: b.adres || "", pcPlaats: [b.postcode, b.plaats].filter(Boolean).join(" "), kvk: b.kvk || "", btwnr: b.btwnr || "", bic: b.bic || "" } }); return;
      }
      /* de echte factuur-PDF zoals het CRM hem maakt */
      if (pad === "/factuurpdf" && req.method === "GET") {
        const f = await db.doc("facturen/" + String(req.query.id || "")).get();
        if (!f.exists || !(await vanKlant(S, f.data().klantId)) || (f.data().soort === "offerte" && !offGetekend(f.data())) || f.data().status === "concept" || !f.data().pdfId) { res.status(404).json({ fout: "niet gevonden" }); return; }
        const x = f.data(), file = bucket().file("assets/" + String(x.pdfId));
        try { const [buf] = await file.download(); res.set("content-type", "application/pdf"); res.set("content-disposition", `inline; filename="${x.soort === "offerte" ? "Offerte" : "Factuur"} ${String(x.nummer || "").replace(/[^\w.-]/g, "")}.pdf"`); res.send(buf); }
        catch (e) { res.status(404).json({ fout: "niet gevonden" }); }
        return;
      }
      if (pad === "/betaal" && req.method === "POST") {
        const id = String(body(req).id || ""), f = await db.doc("facturen/" + id).get();
        if (!f.exists || !(await vanKlant(S, f.data().klantId)) || f.data().soort === "offerte" || f.data().status === "concept") { res.status(404).json({ fout: "niet gevonden" }); return; }
        const albetaald = { betaald: true, melding: "Deze factuur is al betaald. Dank u wel! U hoeft niets meer te doen." };
        if (f.data().status === "betaald") { res.json(albetaald); return; }
        const x = dec(f.data()), b = await bedrijf(), g = await geheim();
        /* nooit dubbel laten betalen: is de vorige Mollie-betaling al gelukt (maar nog niet verwerkt), dan nu verwerken en melden */
        if (x.mollieId && g.mollieKey && typeof verwerkFactuurBetaling === "function") { try { const p0 = await mollie(g.mollieKey, "payments/" + x.mollieId);
          if (p0 && p0.status === "paid" && p0.metadata && p0.metadata.factuurId === id) { const vol = await verwerkFactuurBetaling(p0); if (vol) { res.json(albetaald); return; } }
          if (p0 && p0.status === "open" && p0._links && p0._links.checkout && Math.abs(Number((p0.amount || {}).value) - (Math.round((totals(x, b).inc - (Number(x.deelBetaald) || 0)) * 100) / 100)) < 0.01) { res.json({ link: p0._links.checkout.href }); return; } } catch (e) { console.error("mollie check", e); } }
        /* openstaand bedrag (min een eventuele deelbetaling); een oude link alleen als het bedrag nog klopt */
        const rest = Math.round((totals(x, b).inc - (Number(x.deelBetaald) || 0)) * 100) / 100;
        if (!(rest > 0)) { res.status(409).json({ fout: "Deze factuur staat niet meer open." }); return; }
        if (x.betaallink && x.mollieStatus === "open" && (x.mollieBedrag == null || Math.abs(Number(x.mollieBedrag) - rest) < 0.01)) { res.json({ link: x.betaallink }); return; }
        if (!g.mollieKey) { res.status(409).json({ fout: "Online betalen is nog niet beschikbaar. U kunt het bedrag overmaken." }); return; }
        const base = basisUrl(req);
        const p = await mollie(g.mollieKey, "payments", { method: "POST", body: JSON.stringify({ amount: { currency: "EUR", value: rest.toFixed(2) }, description: ("Factuur " + (x.nummer || id)).slice(0, 255), redirectUrl: base + "/portaal?betaald=" + encodeURIComponent(id), webhookUrl: base + "/api/mollie" + T.hookQs(), metadata: { factuurId: id } }) });
        const link = p._links && p._links.checkout && p._links.checkout.href;
        await f.ref.set({ mollieId: p.id, mollieLink: link || "", betaallink: link || "", mollieStatus: p.status, mollieBedrag: rest }, { merge: true });
        res.json({ link }); return;
      }
      /* automatische incasso: machtiging via een eerste iDEAL-betaling van € 0,01, daarna schrijft het CRM facturen automatisch af */
      if (pad === "/incasso" && req.method === "POST") {
        const g = await geheim(), b = await bedrijf(), k = S.klant, base = basisUrl(req), d = body(req);
        if (!g.mollieKey) { res.status(409).json({ fout: "Automatisch betalen is nog niet beschikbaar." }); return; }
        if (d.stop) {
          if (k.mollieCustomerId && k.mollieMandateId) { try { await mollie(g.mollieKey, "customers/" + k.mollieCustomerId + "/mandates/" + k.mollieMandateId, { method: "DELETE" }); } catch (e) { console.error("mandaat intrekken", e.message); } }
          await S.kref.set({ incasso: false, mollieMandateId: "", incassoGestopt: nu(), log: [...(Array.isArray(k.log) ? k.log : []), { datum: isoNL(), tekst: "Automatische incasso gestopt door klant (portaal)" }] }, { merge: true });
          res.json({ ok: true }); return;
        }
        let cid = k.mollieCustomerId || "";
        if (!cid) { const c = await mollie(g.mollieKey, "customers", { method: "POST", body: JSON.stringify({ name: schoon(k.naam).slice(0, 100), email: k.email || undefined, metadata: { klantId: k.id } }) }); cid = c.id; await S.kref.set({ mollieCustomerId: cid }, { merge: true }); }
        const p = await mollie(g.mollieKey, "payments", { method: "POST", body: JSON.stringify({ amount: { currency: "EUR", value: "0.01" }, customerId: cid, sequenceType: "first", method: "ideal", description: ("Machtiging automatische incasso").slice(0, 255), redirectUrl: base + "/portaal?incasso=1", webhookUrl: base + "/api/mollie" + T.hookQs(), metadata: { incasso: true, klantId: k.id } }) });
        const link = p._links && p._links.checkout && p._links.checkout.href;
        await S.kref.set({ incassoAanvraag: { id: p.id, op: nu() } }, { merge: true });
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
  const T_CAT = { planning: "Planning of afspraak", factuur: "Factuur of betaling", kwaliteit: "Kwaliteit of klacht", toegang: "Toegang", technisch: "Technische melding", vandalisme: "Vandalisme of schade", vuil: "Vuil of grofvuil", overig: "Overig" };
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
    if (!S.voorbeeld) await ref.set({ ongelezenKlant: 0, gezienKlant: nu() }, { merge: true });
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
    const opg = t.status === "opgelost";
    const st = opg ? "Goed nieuws: wij hebben uw ticket opgelost. Is er toch nog iets niet goed? Reageer dan gewoon in het ticket." : "Er is een nieuw antwoord op uw ticket:";
    const aanhef = `Beste ${voornaamVan(schoon(k.contact || k.naam))},\n\n${st}`;
    const groet = `Met vriendelijke groet,\n${b.naam || "mijnschoonmaker.com"}`;
    const tekst = `${aanhef}\n\n**${t.nummer} · ${t.onderwerp}**\n${String(t.laatsteTekst || "").slice(0, 400)}\n\nMet de knop hieronder opent u het ticket direct.\n\n${groet}`;
    const tm = ticketMailBlok(t, opg, b);
    const afz = g.afzender || b.email || "info@mijnschoonmaker.com";
    await brevoSend(g.brevoKey, { sender: { name: b.naam || "mijnschoonmaker", email: afz }, replyTo: { email: b.email || afz }, to: [{ email, name: schoon(k.naam) || undefined }], subject: `${t.nummer}: ${t.status === "opgelost" ? "opgelost" : "nieuw antwoord"} · ${b.naam || "mijnschoonmaker.com"}`, htmlContent: mailHtml(aanhef, b, { knop: { url, tekst: opg ? "Ticket bekijken" : "Antwoord lezen" }, na: tm.na, style: tm.css, ticket: tm.ticket, onder: groet }), textContent: tekst.replace(/\*\*/g, "") + "\n\n" + url, tags: ["portaal", "ticket"] });
    await ts.ref.set({ laatsteMailKlant: nu() }, { merge: true });
    return { ok: true };
  });


  /* ticketmail: de hele mail is een ticket (zie mailHtml opts.ticket); in Apple Mail/iOS klapt de stempel erop en komt de strook los */
  function ticketMailBlok(t, opg, b) {
    const e = x => String(x ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const kl = "#137a8a", kl2 = "#1d5a74";
    const d = new Date(t.laatst || Date.now()), dat = d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }), tijd = d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
    const laatst = String(t.laatsteTekst || "").slice(0, 300), bub = laatst && laatst !== "Ticket opgelost";
    const mono = "'SF Mono',Menlo,Consolas,'Courier New',monospace";
    const css = `@keyframes msIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes msStempel{0%{opacity:0;transform:rotate(-10deg) scale(2.3)}60%{opacity:1;transform:rotate(-10deg) scale(.92)}100%{opacity:.95;transform:rotate(-10deg) scale(1)}}
@keyframes msPuls{0%,100%{opacity:1}50%{opacity:.3}}
.ms-tk{animation:msIn .7s cubic-bezier(.2,.9,.3,1) both}
.ms-st{display:inline-block;transform:rotate(-10deg);animation:msStempel .45s cubic-bezier(.2,1.5,.4,1) .8s both}
.ms-dot{animation:msPuls 1.4s ease-in-out infinite}`;
    const stempel = opg ? `<span class="ms-st" style="display:inline-block;border:2.5px solid ${kl};color:${kl};border-radius:9px;padding:4px 11px;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;white-space:nowrap">&#10003; Opgelost</span>`
      : `<span style="display:inline-block;background:#e3f2f4;color:${kl};border-radius:99px;padding:5px 12px;font-size:12.5px;font-weight:700;white-space:nowrap"><span class="ms-dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${kl};vertical-align:middle;margin:-2px 6px 0 0"></span>Nieuw antwoord</span>`;
    const kop = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
  <td valign="middle" style="font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#6b7c82;white-space:nowrap">Ticket&nbsp;<span style="letter-spacing:.6px;color:${kl}">${e(t.nummer)}</span></td>
  <td align="right" valign="middle">${stempel}</td></tr></table>
<div style="font-size:22px;font-weight:800;color:#0f1f26;line-height:1.2;margin:12px 0 4px;letter-spacing:-.4px">${e(t.onderwerp || "Uw vraag")}</div>
<div style="border-top:1.5px dashed #dde5e8;margin:14px 0 0;height:0;line-height:0;font-size:0">&nbsp;</div>`;
    const na = bub ? `<div style="background:#f3f6f7;border-left:3px solid ${kl};border-radius:4px 14px 14px 4px;padding:12px 14px;font-size:14.5px;line-height:1.55;color:#33454c;margin:0 0 20px">${e(laatst)}</div>` : "";
    const lab = "font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.75)";
    const strook = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
  <td valign="middle"><div style="${lab}">${opg ? "Opgelost" : "Beantwoord"}</div><div style="font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;color:#fff;margin-top:3px;white-space:nowrap">${e(dat)} · ${e(tijd).replace(":", "&#8203;:")}</div></td>
  <td valign="middle" align="center"><div style="${lab}">Status</div><div style="font-size:15px;font-weight:800;color:#fff;margin-top:2px;white-space:nowrap">${opg ? "Afgerond" : "Wacht op u"}</div></td>
  <td valign="middle" align="right" style="font-size:34px;line-height:1;font-weight:800;color:#fff">${opg ? "&#10003;" : "&#9993;"}</td></tr></table>`;
    return { css, ticket: { kleur: kl, kleur2: kl2, kop, strook }, na };
  }

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

  /* CRM: het portaal bekijken zoals deze klant het ziet (alleen bekijken, link 10 minuten geldig) */
  const portaalVoorbeeld = onCall({ memory: "256MiB" }, async req => {
    const wie = await checkGebruiker(req.auth);
    const { klantId, basis } = req.data || {};
    const s = await db.doc("klanten/" + String(klantId || "")).get();
    if (!s.exists) throw new HttpsError("not-found", "Klant niet gevonden.");
    const t = tok();
    await db.doc("portaalLogin/" + sha(t)).set({ klantId: s.id, email: "", exp: Date.now() + 600e3, herbruik: false, voorbeeld: true, door: String(wie || ""), op: nu(), bron: "crm" });
    const b = /^https:\/\/[\w.-]+$/.test(String(basis || "")) ? String(basis) : HOST();
    return { url: b + "/portaal?l=" + t };
  });

  /* aanbevelingscode bij een websiteaanvraag omzetten naar de klant die aanbeveelt */
  async function refKlant(code) {
    const c = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length < 3) return null;
    const q = await db.collection("klanten").where("refCode", "==", c).limit(1).get();
    return q.empty ? null : { id: q.docs[0].id, code: c, naam: q.docs[0].data().naam || "", contact: q.docs[0].data().contact || "" };
  }

  /* ---------- automatische credits: snel betaald, automatisch betalen, jaren klant ----------
     Draait elk uur overdag. Elke toekenning heeft een vaste bron+ref, dus nooit dubbel. */
  const creditsAuto = onSchedule ? onSchedule({ schedule: "7 7-22 * * *", timeZone: "Europe/Amsterdam", timeoutSeconds: 300, memory: "512MiB" }, async () => {
    const b = await bedrijf(), cr = bedrijfInfo(b, "").credits, vandaag = isoNL(), md = vandaag.slice(5), jaar = Number(vandaag.slice(0, 4));
    if (!(cr.snel > 0 || cr.jaar > 0)) return;
    const [ks, fs] = await Promise.all([db.collection("klanten").get(), cr.snel > 0 ? db.collection("facturen").where("status", "==", "betaald").get() : null]);
    const K = new Map(ks.docs.map(d => [d.id, { id: d.id, ref: d.ref, ...dec(d.data()) }]));
    const nieuw = new Map(), jubileum = [];
    const heeft = (k, bron, ref) => (k.tegoed || []).concat(k.tegoedGebruikt || []).concat(nieuw.get(k.id) || []).some(t => t && t.bron === bron && String(t.ref || "") === String(ref));
    const geef = (k, bedrag, reden, bron, ref) => { if (!(bedrag > 0) || heeft(k, bron, ref)) return false; const l = nieuw.get(k.id) || []; l.push({ id: newId("tg"), bedrag, reden, bron, ref: String(ref), op: vandaag }); nieuw.set(k.id, l); return true; };
    const week = Date.now() - 7 * 864e5;
    if (fs) for (const d of fs.docs) {
      const f = { id: d.id, ...dec(d.data()) }, k = K.get(f.klantId);
      if (!k || f.soort === "offerte" || f.incasso || f.betaalwijze === "incasso") continue;
      if (!(Date.parse(f.betaaldTs || "") > week && snelBetaald(f))) continue;
      geef(k, cr.snel, "Credits: factuur " + (f.nummer || "") + " binnen 24 uur betaald", "snel", f.id);
    }
    for (const k of K.values()) {
      if (k.actief === false || k.prospect) continue;
      const sinds = String(k.aangemaakt || "");
      if (false && cr.jaar > 0 && /^\d{4}-\d{2}-\d{2}$/.test(sinds) && sinds.slice(5) === md && jaar - Number(sinds.slice(0, 4)) >= 1) {
        const n = jaar - Number(sinds.slice(0, 4));
        if (geef(k, cr.jaar, "Credits: " + n + " jaar klant", "jaar", jaar)) jubileum.push([k, n]);
      }
    }
    for (const [id, l] of nieuw) { const k = K.get(id); await k.ref.set({ tegoed: [...(k.tegoed || []), ...l] }, { merge: true }); }
    /* bedankmail op de jaardag */
    if (jubileum.length) { const g = await geheim(); if (g.brevoKey) for (const [k, n] of jubileum) {
      const email = String(k.email || "").trim(); if (!/@/.test(email)) continue;
      try {
        const vn = voornaamVan(schoon(k.contact || k.naam)), naam = b.naam || "mijnschoonmaker.com";
        const onderwerp = `${n} jaar klant: dank u wel! · ${naam}`;
        const tekst = `Beste ${vn},\n\nVandaag bent u precies ${n === 1 ? "één jaar" : n + " jaar"} klant bij ons. Dank u wel voor uw vertrouwen!\n\nAls bedankje hebben wij **${cr.jaar} credits (€ ${cr.jaar})** voor u klaargezet. Die gaan automatisch van uw volgende factuur af; u hoeft niets te doen. In uw klantportaal ziet u uw credits altijd terug.\n\nMet vriendelijke groet,\n${naam}`;
        const afz = g.afzender || b.email || "info@mijnschoonmaker.com";
        await brevoSend(g.brevoKey, { sender: { name: naam, email: afz }, replyTo: { email: b.email || afz }, to: [{ email, name: schoon(k.naam) || undefined }], subject: onderwerp, htmlContent: mailHtml(tekst, b, { portaal: await portaalUrl(k.id, email) }) });
        await db.doc("berichten/" + newId("m")).set({ klantId: k.id, klantNaam: k.naam || "", naar: email, kanaal: "email", sjabloon: "jubileum", onderwerp, tekst, status: "verstuurd", verstuurdOp: nu(), op: nu(), door: "automatisch" });
      } catch (e) { console.error("jubileummail", k.id, e.message); }
    } }
    console.log("credits automatisch", [...nieuw.values()].reduce((a, l) => a + l.length, 0));
  }) : null;
  return { portaal, portaalUitnodigen, portaalVoorbeeld, ticketMelding, refKlant, creditsAuto };
};
