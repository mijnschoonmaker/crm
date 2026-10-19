/* Beveiliging van het CRM: tweestapsverificatie (TOTP, zoals Google Authenticator) en dagelijkse back-ups.
   - Het klantportaal valt hier NIET onder: klanten blijven inloggen met de link per e-mail.
   - Tweestapsverificatie wordt op de server afgedwongen: in de Firestore- en Storage-regels en in checkGebruiker.
     Na een geldige code krijgt de inlogsessie (auth_time) een vinkje in de custom claim "mfa".
     Logt iemand opnieuw in (ander apparaat, gestolen wachtwoord), dan is dat een nieuwe sessie zonder vinkje.
   - Back-ups: elke nacht alle collecties (behalve /geheim) als JSON (gzip) naar Storage backups/JJJJ-MM-DD.json.gz,
     35 dagen bewaard. Terugzetten: tools/herstel-backup.js (zie OVERDRACHT.md). */
const zlib = require("zlib");

const TN = require("./tenant");
const BK = () => "backups/" + (TN.isLegacy() ? "" : TN.bid() + "/");
module.exports = ctx => {
  const { admin, db, bucket, onCall, onSchedule, HttpsError, crypto, EIGENAAR, BEHEER } = ctx;

  /* ---------- TOTP (RFC 6238) ---------- */
  const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const b32enc = buf => { let bits = 0, val = 0, out = ""; for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += B32[(val << (5 - bits)) & 31]; return out; };
  const b32dec = s => { s = String(s).replace(/[^A-Z2-7]/gi, "").toUpperCase(); let bits = 0, val = 0; const out = []; for (const c of s) { val = (val << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(out); };
  const hotp = (key, ctr) => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(ctr)); const h = crypto.createHmac("sha1", key).update(b).digest(); const o = h[h.length - 1] & 15; return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, "0"); };
  const totpOk = (secret, code) => { code = String(code || "").replace(/\D/g, ""); if (code.length !== 6) return false; const key = b32dec(secret), t = Math.floor(Date.now() / 30000);
    for (const d of [-1, 0, 1]) { const c = hotp(key, t + d); if (crypto.timingSafeEqual(Buffer.from(c), Buffer.from(code))) return true; } return false; };
  const hash = s => crypto.createHash("sha256").update(String(s).replace(/[^a-z0-9]/gi, "").toLowerCase()).digest("hex");

  const mailVan = auth => auth && auth.token && auth.token.email_verified && String(auth.token.email || "").toLowerCase();
  async function magCRM(auth) {
    const e = mailVan(auth);
    if (!e) throw new HttpsError("unauthenticated", "Log eerst in.");
    if (e !== EIGENAAR && e !== BEHEER && !(await db.doc("gebruikers/" + e).get()).exists) throw new HttpsError("permission-denied", "Geen toegang tot het CRM.");
    return e;
  }
  /* staat tweestapsverificatie aan en is deze inlogsessie bevestigd? (gebruikt door checkGebruiker) */
  async function mfaBevestigd(auth) {
    const e = mailVan(auth); if (!e) return false;
    const m = await db.doc("mfa/" + e).get();
    if (!m.exists || m.data().aan !== true) return true;
    const lijst = Array.isArray(auth.token.mfa) ? auth.token.mfa : [];
    return lijst.includes(Number(auth.token.auth_time));
  }
  async function sessieBevestigen(auth) {
    const u = await admin.auth().getUser(auth.uid);
    const oud = Array.isArray((u.customClaims || {}).mfa) ? u.customClaims.mfa : [];
    const t = Number(auth.token.auth_time);
    await admin.auth().setCustomUserClaims(auth.uid, { ...(u.customClaims || {}), mfa: [...oud.filter(x => x !== t), t].slice(-10) });
  }
  /* te veel foute codes achter elkaar: 15 minuten wachten */
  async function remCheck(ref, g) { const f = (g.fout || []).filter(x => Date.now() - x < 15 * 60e3); if (f.length >= 6) throw new HttpsError("resource-exhausted", "Te veel foute codes. Probeer het over een kwartier opnieuw."); return f; }

  const mfaStatus = onCall(async req => {
    const e = await magCRM(req.auth);
    const m = await db.doc("mfa/" + e).get(), d = m.exists ? m.data() : {};
    const uit = { aan: d.aan === true, sinds: d.sinds || "", bevestigd: await mfaBevestigd(req.auth) };
    if (e === EIGENAAR || e === BEHEER) {
      /* eigenaar mijnschoonmaker: alleen de eigen gebruikers (zonder bedrijf); beheer: iedereen */
      const gs = await db.collection("gebruikers").get(), ms = await db.collection("mfa").get(), aan = new Set(ms.docs.filter(x => x.data().aan === true).map(x => x.id));
      const eigen = gs.docs.filter(x => e === BEHEER || !x.data().bedrijf).map(x => x.id);
      uit.gebruikers = [e, ...eigen.filter(x => x !== e)].map(x => ({ email: x, aan: aan.has(x) }));
    }
    return uit;
  });

  const mfaStart = onCall(async req => {
    const e = await magCRM(req.auth);
    const m = await db.doc("mfa/" + e).get();
    if (m.exists && m.data().aan === true) throw new HttpsError("failed-precondition", "Tweestapsverificatie staat al aan.");
    const secret = b32enc(crypto.randomBytes(20));
    await db.doc("geheim/mfa_" + e).set({ wacht: secret, gestart: new Date().toISOString() }, { merge: true });
    const label = encodeURIComponent("mijnschoonmaker CRM:" + e);
    return { secret, uri: `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent("mijnschoonmaker CRM")}&algorithm=SHA1&digits=6&period=30` };
  });

  const mfaActiveer = onCall(async req => {
    const e = await magCRM(req.auth);
    const ref = db.doc("geheim/mfa_" + e), g = (await ref.get()).data() || {};
    if (!g.wacht) throw new HttpsError("failed-precondition", "Begin opnieuw met instellen.");
    const fout = await remCheck(ref, g);
    if (!totpOk(g.wacht, req.data && req.data.code)) { await ref.set({ fout: [...fout, Date.now()] }, { merge: true }); throw new HttpsError("invalid-argument", "Die code klopt niet. Kijk of de tijd op je telefoon goed staat en probeer de nieuwste code."); }
    const herstel = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString("hex").replace(/(.{5})/, "$1-"));
    await ref.set({ secret: g.wacht, wacht: admin.firestore.FieldValue.delete(), herstel: herstel.map(hash), fout: [] }, { merge: true });
    await db.doc("mfa/" + e).set({ aan: true, sinds: new Date().toISOString() });
    await sessieBevestigen(req.auth);
    return { herstel };
  });

  const mfaControle = onCall(async req => {
    const e = await magCRM(req.auth);
    const ref = db.doc("geheim/mfa_" + e), g = (await ref.get()).data() || {};
    if (!g.secret) { await sessieBevestigen(req.auth); return { ok: true }; }
    const fout = await remCheck(ref, g);
    const code = String((req.data && req.data.code) || "").trim();
    let ok = totpOk(g.secret, code), viaHerstel = false;
    if (!ok) { const h = hash(code), i = (g.herstel || []).indexOf(h); if (i >= 0) { ok = true; viaHerstel = true; await ref.set({ herstel: g.herstel.filter((_, j) => j !== i) }, { merge: true }); } }
    if (!ok) { await ref.set({ fout: [...fout, Date.now()] }, { merge: true }); throw new HttpsError("invalid-argument", "Die code klopt niet."); }
    await ref.set({ fout: [], laatst: new Date().toISOString() }, { merge: true });
    await sessieBevestigen(req.auth);
    return { ok: true, viaHerstel, overHerstel: viaHerstel ? (g.herstel || []).length - 1 : (g.herstel || []).length };
  });

  const mfaUit = onCall(async req => {
    const e = await magCRM(req.auth);
    const doel = String((req.data && req.data.email) || e).toLowerCase();
    if (doel !== e) {
      /* de eigenaar kan tweestapsverificatie van een medewerker resetten (telefoon kwijt) */
      if (e !== EIGENAAR && e !== BEHEER) throw new HttpsError("permission-denied", "Alleen de eigenaar kan dit.");
      if (e === EIGENAAR && ((await db.doc("gebruikers/" + doel).get()).data() || {}).bedrijf) throw new HttpsError("permission-denied", "Deze gebruiker hoort bij een ander bedrijf.");
      if (!(await mfaBevestigd(req.auth))) throw new HttpsError("permission-denied", "Bevestig eerst je eigen code.");
    } else {
      const ref = db.doc("geheim/mfa_" + e), g = (await ref.get()).data() || {};
      const fout = await remCheck(ref, g);
      if (g.secret && !totpOk(g.secret, req.data && req.data.code)) { await ref.set({ fout: [...fout, Date.now()] }, { merge: true }); throw new HttpsError("invalid-argument", "Die code klopt niet."); }
    }
    await db.doc("mfa/" + doel).set({ aan: false, uit: new Date().toISOString(), uitDoor: e });
    await db.doc("geheim/mfa_" + doel).delete().catch(() => {});
    return { ok: true };
  });

  /* ---------- back-ups ---------- */
  const SKIP = new Set(["geheim"]);
  const ser = v => v instanceof admin.firestore.Timestamp ? { __ts: v.toDate().toISOString() }
    : v instanceof admin.firestore.GeoPoint ? { __geo: [v.latitude, v.longitude] }
    : v && typeof v === "object" && v.constructor && v.constructor.name === "DocumentReference" ? { __ref: v.path }
    : Array.isArray(v) ? v.map(ser) : v && typeof v === "object" && !Buffer.isBuffer(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ser(x)])) : v;
  async function maakBackup() {
    const cols = (await db.listCollections()).filter(c => !SKIP.has(c.id));
    const data = { gemaakt: new Date().toISOString(), project: process.env.GCLOUD_PROJECT || "", collecties: {} };
    let n = 0;
    for (const c of cols) { const s = await c.get(); data.collecties[c.id] = Object.fromEntries(s.docs.map(d => [d.id, ser(d.data())])); n += s.size; }
    data.aantal = n;
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(data)), { level: 9 });
    return { gz, n, cols: cols.length };
  }
  const dag = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
  async function bewaar(gz, naam) {
    await bucket().file(BK() + naam).save(gz, { contentType: "application/gzip", resumable: false, metadata: { cacheControl: "private, no-store" } });
    /* ouder dan 35 dagen opruimen */
    const [files] = await bucket().getFiles({ prefix: BK() });
    const grens = Date.now() - 35 * 864e5;
    await Promise.all(files.filter(f => Date.parse(f.metadata.timeCreated) < grens).map(f => f.delete().catch(() => {})));
  }
  const dagBackup = onSchedule({ schedule: "15 3 * * *", timeZone: "Europe/Amsterdam", memory: "1GiB", timeoutSeconds: 540 }, async () => {
    const { gz, n } = await maakBackup();
    await bewaar(gz, dag() + ".json.gz");
    await db.doc("instellingen/backup").set({ laatst: new Date().toISOString(), documenten: n, bytes: gz.length }, { merge: true });
  });
  async function alleenEigenaar(auth) {
    const e = await magCRM(auth);
    if (e !== EIGENAAR && !(TN.isLegacy() ? false : ((await db.doc("gebruikers/" + e).get()).data() || {}).rol === "eigenaar")) throw new HttpsError("permission-denied", "Alleen de eigenaar kan back-ups beheren.");
    if (!(await mfaBevestigd(auth))) throw new HttpsError("permission-denied", "Bevestig eerst je code.");
    return e;
  }
  const backupLijst = onCall(async req => {
    await alleenEigenaar(req.auth);
    const [files0] = await bucket().getFiles({ prefix: BK() }), files = files0.filter(f => !f.name.slice(BK().length).includes("/"));
    return { lijst: files.map(f => ({ naam: f.name.slice(BK().length), bytes: Number(f.metadata.size) || 0, op: f.metadata.timeCreated })).sort((a, b) => b.op.localeCompare(a.op)) };
  });
  const backupNu = onCall({ memory: "1GiB", timeoutSeconds: 300 }, async req => {
    await alleenEigenaar(req.auth);
    const naam = req.data && req.data.naam ? String(req.data.naam).replace(/[^\w.-]/g, "") : "";
    let gz, n = null;
    if (naam) { [gz] = await bucket().file(BK() + naam).download(); }
    else { const r = await maakBackup(); gz = r.gz; n = r.n; await bewaar(gz, dag() + "-handmatig.json.gz"); await db.doc("instellingen/backup").set({ laatst: new Date().toISOString(), documenten: n, bytes: gz.length }, { merge: true }); }
    if (gz.length > 7.5 * 1024 * 1024) return { teGroot: true, bytes: gz.length };
    return { naam: naam || ("backup-" + dag() + ".json.gz"), data: gz.toString("base64"), documenten: n, bytes: gz.length };
  });

  return { mfaBevestigd, functies: { mfaStatus, mfaStart, mfaActiveer, mfaControle, mfaUit, dagBackup, backupLijst, backupNu } };
};
