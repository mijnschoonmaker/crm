/* Meerdere bedrijven in één CRM (Mansard).
   Elk bedrijf heeft zijn eigen gegevens onder bedrijven/<id>/...; het eerste bedrijf (mijnschoonmaker.com) staat
   om historische redenen in de hoofdcollecties. Welk bedrijf een verzoek betreft, wordt één keer bepaald
   (ingelogde gebruiker, token, ?b=) en geldt dan voor alle database-aanroepen in dat verzoek (AsyncLocalStorage).
   Tokens van nieuwe bedrijven beginnen met "<bedrijfsid>_", zodat links en sessies vanzelf bij het goede bedrijf horen. */
const { AsyncLocalStorage } = require("async_hooks");
const crypto = require("crypto");
const als = new AsyncLocalStorage();
const LEGACY = "mijnschoonmaker";
/* collecties die voor het hele platform gelden, niet per bedrijf */
const GLOBAL = new Set(["gebruikers", "mfa", "bedrijven", "limiet", "aanmeldingen", "platform"]);
const BID_RE = /^b[a-z0-9]{7}$/;

const bid = () => (als.getStore() && als.getStore().bid) || LEGACY;
const isLegacy = () => bid() === LEGACY;
const pad = () => isLegacy() ? "" : "bedrijven/" + bid() + "/";
const pfx = p => { const s = String(p).replace(/^\/+/, ""), top = s.split("/")[0]; return GLOBAL.has(top) ? s : pad() + s; };

function maakDb(raw) {
  return new Proxy(raw, {
    get(t, k) {
      if (k === "collection") return p => t.collection(pfx(p));
      if (k === "doc") return p => t.doc(pfx(p));
      if (k === "listCollections") return async () => isLegacy() ? t.listCollections() : t.doc("bedrijven/" + bid()).listCollections();
      if (k === "raw") return t;
      const v = t[k]; return typeof v === "function" ? v.bind(t) : v;
    }
  });
}
const metBedrijf = (b, fn) => als.run({ bid: b && BID_RE.test(b) ? b : LEGACY }, fn);
const nieuwBid = () => "b" + [...crypto.randomBytes(7)].map(x => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join("");
/* token met bedrijfsvoorvoegsel (alleen voor nieuwe bedrijven; het eerste bedrijf houdt gewone tokens) */
const tok = (n = 32) => (isLegacy() ? "" : bid() + "_") + crypto.randomBytes(n).toString("hex");
const TOK_PFX = /^(b[a-z0-9]{7})_/;
const hookQs = () => isLegacy() ? "" : "?b=" + bid();

/* bedrijf van een verzoek zonder ingelogde gebruiker: ?b=, header, of een token met voorvoegsel */
function bidUitReq(req) {
  const q = req.query || {}, b = req.body && typeof req.body === "object" ? req.body : {};
  if (q.b && BID_RE.test(String(q.b))) return String(q.b);
  const h = String((req.headers && req.headers["x-bedrijf"]) || "");
  if (BID_RE.test(h)) return h;
  const kand = [q.t, q.l, q.s, q.tok, q.state, b.t, b.l, b.s, b.tok, b.token, String((req.headers && req.headers.authorization) || "").replace(/^Bearer\s+/i, ""),
    ...String(req.path || req.url || "").split("?")[0].split("/")];
  for (const c of kand) { const m = TOK_PFX.exec(String(c || "")); if (m) return m[1]; }
  const tags = [].concat(b.tags || [], b.tag || []);
  for (const t of tags) { const m = /^b:(b[a-z0-9]{7})$/.exec(String(t)); if (m) return m[1]; }
  return LEGACY;
}

module.exports = { als, LEGACY, GLOBAL, BID_RE, bid, isLegacy, pad, pfx, maakDb, metBedrijf, nieuwBid, tok, hookQs, bidUitReq, TOK_PFX };
