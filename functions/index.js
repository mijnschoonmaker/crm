/* mijnschoonmaker CRM — server (Firebase Functions, regio europe-west4)
   - sendMail      : e-mail versturen via Brevo (alleen voor CRM-gebruikers)
   - brevoHook     : statussen van Brevo (bezorgd, geopend, geklikt, bounce, spam)
   - mollieLink    : betaallink per factuur aanmaken
   - mollieHook    : Mollie meldt een betaling, factuur gaat op betaald
   - aanvraag      : websitecalculator en contactformulier (openbaar)
   - geplandVerzenden : elke 10 minuten ingeplande mails versturen
   - blob          : foto's en bestanden uit de opslag tonen (/_blob/<id>)
   Sleutels staan in Firestore /geheim/config (alleen de server kan ze lezen). */
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
setGlobalOptions({ region: "europe-west4", maxInstances: 5 });
const db = admin.firestore();
const bucket = () => admin.storage().bucket();
const EIGENAAR = "robin@mijnschoonmaker.com";
const nu = () => new Date().toISOString();
const newId = p => p + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");

const geheim = async () => (await db.doc("geheim/config").get()).data() || {};
const bedrijf = async () => (await db.doc("instellingen/bedrijf").get()).data() || {};

async function checkGebruiker(auth) {
  const e = auth && auth.token && auth.token.email_verified && String(auth.token.email || "").toLowerCase();
  if (!e) throw new HttpsError("unauthenticated", "Log eerst in.");
  if (e === EIGENAAR) return e;
  if (!(await db.doc("gebruikers/" + e).get()).exists) throw new HttpsError("permission-denied", "Geen toegang tot het CRM.");
  return e;
}

/* ---------- Brevo ---------- */
async function brevoSend(key, mail) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(mail)
  });
  const t = await r.text();
  let j = {}; try { j = JSON.parse(t); } catch (e) {}
  if (!r.ok) throw new Error("Brevo " + r.status + ": " + (j.message || t).slice(0, 200));
  return j.messageId || "";
}
async function maakMail({ naar, naam, onderwerp, html, tekst, bijlagen }) {
  const [g, b] = await Promise.all([geheim(), bedrijf()]);
  if (!g.brevoKey) throw new HttpsError("failed-precondition", "Er is nog geen Brevo-sleutel ingesteld (Instellingen › E-mail versturen).");
  const afz = g.afzender || b.email || "info@mijnschoonmaker.com";
  const mail = {
    sender: { name: b.naam || "mijnschoonmaker", email: afz },
    replyTo: { email: b.email || afz, name: b.naam || undefined },
    to: [{ email: naar, name: naam || undefined }],
    subject: onderwerp || "Bericht",
    htmlContent: html || "<p>" + String(tekst || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>") + "</p>",
    textContent: tekst || undefined,
    tags: ["crm"]
  };
  if (bijlagen && bijlagen.length) mail.attachment = bijlagen.map(a => ({ name: a.naam, content: a.data }));
  return { key: g.brevoKey, mail };
}

exports.sendMail = onCall({ memory: "512MiB", timeoutSeconds: 60 }, async req => {
  const wie = await checkGebruiker(req.auth);
  const d = req.data || {};
  if (!/^\S+@\S+\.\S+$/.test(String(d.naar || ""))) throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");
  const id = /^[\w-]{4,40}$/.test(d.berichtId || "") ? d.berichtId : newId("m");
  const { key, mail } = await maakMail(d);
  let brevoId = "";
  try { brevoId = await brevoSend(key, mail); }
  catch (e) {
    await db.doc("berichten/" + id).set({ ...(d.meta || {}), naar: d.naar, kanaal: "email", onderwerp: d.onderwerp || "", status: "mislukt", fout: String(e.message || e), op: nu(), door: wie }, { merge: true });
    throw new HttpsError("internal", "Versturen lukte niet: " + (e.message || e));
  }
  await db.doc("berichten/" + id).set({
    ...(d.meta || {}), naar: d.naar, kanaal: "email", onderwerp: d.onderwerp || "", tekst: d.tekst || "",
    status: "verstuurd", brevoId, verstuurdOp: nu(), op: nu(), door: wie, bijlage: (d.bijlagen || []).map(a => a.naam).join(", ")
  }, { merge: true });
  return { ok: true, id, brevoId };
});

/* Brevo-webhook: https://<domein>/api/brevo?t=<token> */
const BREVO_EV = {
  delivered: "bezorgdOp", opened: "gelezenOp", unique_opened: "gelezenOp", proxy_open: "gelezenOp", click: "geklikOp",
  hard_bounce: "bouncedOp", soft_bounce: "bouncedOp", invalid_email: "bouncedOp", blocked: "geblokkeerdOp",
  spam: "spamOp", complaint: "spamOp", unsubscribed: "uitgeschrevenOp", deferred: "uitgesteldOp"
};
exports.brevoHook = onRequest(async (req, res) => {
  const g = await geheim();
  if (!g.hookToken || req.query.t !== g.hookToken) { res.status(403).send("nee"); return; }
  const lijst = Array.isArray(req.body) ? req.body : [req.body || {}];
  for (const ev of lijst) {
    const veld = BREVO_EV[ev.event]; const mid = ev["message-id"] || ev.messageId;
    if (!veld || !mid) continue;
    const q = await db.collection("berichten").where("brevoId", "==", mid).limit(1).get();
    if (q.empty) continue;
    const ref = q.docs[0].ref, m = q.docs[0].data(), t = ev.ts_event ? new Date(ev.ts_event * 1000).toISOString() : ev.ts ? new Date(ev.ts * 1000).toISOString() : nu();
    const p = {};
    if (!m[veld]) p[veld] = t;
    if (veld === "gelezenOp") { p.opens = admin.firestore.FieldValue.increment(1); p.laatstGelezen = t; }
    if (veld === "geklikOp") { p.clicks = admin.firestore.FieldValue.increment(1); if (!m.gelezenOp) p.gelezenOp = t; if (ev.link) p.kliks = admin.firestore.FieldValue.arrayUnion({ t: Date.parse(t), u: String(ev.link).slice(0, 300) }); }
    if (veld === "bouncedOp") p.bounceReden = String(ev.reason || ev.event).slice(0, 200);
    if (Object.keys(p).length) await ref.set(p, { merge: true });
  }
  res.send("ok");
});

/* ---------- ingeplande mails (aangemaakt door het CRM in /geplandeMails) ---------- */
exports.geplandVerzenden = onSchedule({ schedule: "every 10 minutes", timeZone: "Europe/Amsterdam", memory: "512MiB" }, async () => {
  const q = await db.collection("geplandeMails").where("status", "==", "gepland").where("sendAt", "<=", nu()).limit(40).get();
  for (const doc of q.docs) {
    const d = doc.data();
    try {
      const { key, mail } = await maakMail(d);
      const brevoId = await brevoSend(key, mail);
      const id = d.berichtId || newId("m");
      await db.doc("berichten/" + id).set({ ...(d.meta || {}), naar: d.naar, kanaal: "email", onderwerp: d.onderwerp || "", tekst: d.tekst || "", status: "verstuurd", brevoId, verstuurdOp: nu(), op: nu(), gepland: true }, { merge: true });
      await doc.ref.set({ status: "verstuurd", brevoId, verstuurdOp: nu() }, { merge: true });
    } catch (e) {
      await doc.ref.set({ status: "mislukt", fout: String(e.message || e).slice(0, 300) }, { merge: true });
    }
  }
});

/* ---------- Mollie ---------- */
async function mollie(key, pad, opts = {}) {
  const r = await fetch("https://api.mollie.com/v2/" + pad, { ...opts, headers: { authorization: "Bearer " + key, "content-type": "application/json" } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Mollie " + r.status + ": " + (j.detail || j.title || ""));
  return j;
}
exports.mollieLink = onCall(async req => {
  await checkGebruiker(req.auth);
  const { factuurId, bedrag, omschrijving, basis } = req.data || {};
  const g = await geheim();
  if (!g.mollieKey) throw new HttpsError("failed-precondition", "Er is nog geen Mollie-sleutel ingesteld.");
  const f = await db.doc("facturen/" + factuurId).get();
  if (!f.exists) throw new HttpsError("not-found", "Factuur niet gevonden.");
  const val = Number(bedrag);
  if (!(val > 0)) throw new HttpsError("invalid-argument", "Ongeldig bedrag.");
  const b = await bedrijf();
  const site = String(basis || "").replace(/\/+$/, "");
  const p = await mollie(g.mollieKey, "payments", {
    method: "POST",
    body: JSON.stringify({
      amount: { currency: "EUR", value: val.toFixed(2) },
      description: String(omschrijving || "Factuur " + (f.data().nummer || factuurId)).slice(0, 255),
      redirectUrl: b.website || "https://mijnschoonmaker.com",
      webhookUrl: site + "/api/mollie",
      metadata: { factuurId }
    })
  });
  const link = p._links && p._links.checkout && p._links.checkout.href;
  await f.ref.set({ mollieId: p.id, mollieLink: link || "", betaallink: link || "", mollieStatus: p.status }, { merge: true });
  return { link, id: p.id };
});
exports.mollieHook = onRequest(async (req, res) => {
  const id = (req.body && req.body.id) || "";
  if (!/^tr_\w+$/.test(id)) { res.status(400).send("geen id"); return; }
  const g = await geheim();
  try {
    const p = await mollie(g.mollieKey, "payments/" + id);   // altijd zelf opvragen: de webhook zelf is niet te vertrouwen
    const fid = p.metadata && p.metadata.factuurId;
    if (fid) {
      const ref = db.doc("facturen/" + fid), upd = { mollieStatus: p.status };
      if (p.status === "paid") Object.assign(upd, { status: "betaald", betaald: true, betaaldOp: (p.paidAt || nu()).slice(0, 10), betaalwijze: "mollie" });
      await ref.set(upd, { merge: true });
      if (p.status === "paid") {
        const bs = await db.collection("beurten").where("gefactureerd", "==", fid).get();
        for (const d of bs.docs) await d.ref.set({ betaald: true }, { merge: true });
      }
    }
    res.send("ok");
  } catch (e) { console.error(e); res.status(500).send("fout"); }
});

/* ---------- websitecalculator + contactformulier ---------- */
function leesMultipart(req) {
  const Busboy = require("busboy");
  return new Promise((ok, fout) => {
    const velden = {}, bestanden = [];
    const bb = Busboy({ headers: req.headers, limits: { fileSize: 8 * 1024 * 1024, files: 12, fields: 10, fieldSize: 200 * 1024 } });
    bb.on("field", (n, v) => { velden[n] = v; });
    bb.on("file", (n, s, info) => { const c = []; s.on("data", d => c.push(d)); s.on("end", () => bestanden.push({ veld: n, naam: info.filename, type: info.mimeType, buf: Buffer.concat(c) })); });
    bb.on("finish", () => ok({ velden, bestanden }));
    bb.on("error", fout);
    bb.end(req.rawBody);
  });
}
exports.aanvraag = onRequest({ cors: true, memory: "512MiB", timeoutSeconds: 60 }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("POST"); return; }
  try {
    /* eenvoudige bescherming: max 6 aanvragen per uur per IP */
    const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
    const uur = new Date().toISOString().slice(0, 13), rl = db.doc("limiet/" + crypto.createHash("sha1").update(ip + uur).digest("hex"));
    const n = await db.runTransaction(async t => { const s = await t.get(rl); const c = (s.exists ? s.data().n : 0) + 1; t.set(rl, { n: c, uur }); return c; });
    if (n > 6) { res.status(429).send("Te veel aanvragen, probeer het later opnieuw."); return; }

    const { velden, bestanden } = await leesMultipart(req);
    if (velden.website_url) { res.send("ok"); return; }       // honeypot
    let D; try { D = JSON.parse(velden.aanvraag || ""); } catch (e) { res.status(400).send("Ongeldige aanvraag"); return; }
    if (!D || !["zeem.aanvraag", "zeem.contact"].includes(D.formaat) || !D.klant || !D.klant.naam) { res.status(400).send("Ongeldige aanvraag"); return; }
    /* dubbel indienen (twee keer klikken) binnen 15 minuten: maar één keer opslaan */
    const dk = crypto.createHash("sha1").update([D.formaat, D.klant.naam, D.klant.email, D.klant.postcode, D.klant.adres].map(x => String(x || "").trim().toLowerCase()).join("|")).digest("hex");
    const dref = db.doc("limiet/d" + dk), dub = await db.runTransaction(async t => { const s = await t.get(dref); const vers = s.exists && Date.now() - s.data().t < 15 * 60 * 1000; if (!vers) t.set(dref, { t: Date.now() }); return vers; });
    if (dub) { res.json({ ok: true, dubbel: true }); return; }
    let meta = []; try { meta = JSON.parse(velden.fotometa || "[]"); } catch (e) {}
    const id = newId("a"), fotos = [];
    for (const [i, f] of bestanden.entries()) {
      if (!/^image\//.test(f.type || "image/jpeg")) continue;
      const fid = crypto.randomBytes(16).toString("hex");
      await bucket().file("assets/" + fid).save(f.buf, { contentType: f.type || "image/jpeg", resumable: false });
      fotos.push({ id: fid, naam: f.naam || "foto.jpg", ...(meta[i] || {}) });
    }
    await db.doc("aanvragen/" + id).set({ aanvraag: D, fotos, status: "nieuw", ontvangen: nu(), ip: crypto.createHash("sha1").update(ip).digest("hex").slice(0, 12) });

    /* melding naar je eigen mailbox (als Brevo is ingesteld) */
    try {
      const [g, b] = await Promise.all([geheim(), bedrijf()]);
      if (g.brevoKey && (g.meldAdres || b.email)) {
        const k = D.klant, soort = D.formaat === "zeem.contact" ? "Nieuw contactverzoek" : "Nieuwe offerte-aanvraag";
        await brevoSend(g.brevoKey, {
          sender: { name: "mijnschoonmaker CRM", email: g.afzender || b.email }, to: [{ email: g.meldAdres || b.email }],
          subject: soort + ": " + k.naam,
          textContent: [soort, "", "Naam: " + k.naam, k.bedrijf ? "Bedrijf: " + k.bedrijf : "", "Adres: " + [k.adres, k.postcode, k.plaats].filter(Boolean).join(" "), "E-mail: " + (k.email || ""), "Telefoon: " + (k.telefoon || ""), k.opmerking ? "\nOpmerking: " + k.opmerking : "", "", "Open het CRM om de aanvraag te bekijken."].filter(x => x !== "").join("\n")
        });
      }
    } catch (e) { console.error("melding", e); }
    res.json({ ok: true, id });
  } catch (e) { console.error(e); res.status(500).send("Er ging iets mis"); }
});

/* ---------- bestanden: /_blob/<id> ---------- */
exports.blob = onRequest({ memory: "256MiB" }, async (req, res) => {
  const id = String(req.path || "").split("/").pop();
  if (!/^[\w-]{6,64}$/.test(id)) { res.status(404).send(""); return; }
  const f = bucket().file("assets/" + id);
  try {
    const [m] = await f.getMetadata();
    res.set("content-type", m.contentType || "application/octet-stream");
    res.set("cache-control", "private, max-age=31536000, immutable");
    f.createReadStream().on("error", () => res.status(404).end()).pipe(res);
  } catch (e) { res.status(404).send(""); }
});
