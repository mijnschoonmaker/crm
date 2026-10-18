/* mijnschoonmaker CRM — server (Firebase Functions, regio europe-west4)
   - sendMail      : e-mail versturen via Brevo (alleen voor CRM-gebruikers)
   - brevoHook     : statussen van Brevo (bezorgd, geopend, geklikt, bounce, spam)
   - mollieLink    : betaallink per factuur aanmaken
   - mollieHook    : Mollie meldt een betaling, factuur gaat op betaald
   - aanvraag      : websitecalculator en contactformulier (openbaar)
   - geplandVerzenden : elke 10 minuten ingeplande mails versturen
   - blob          : foto's en bestanden uit de opslag tonen (/_blob/<id>)
   - portaal       : klantportaal (/portaal, /api/portaal/**) en aanbevelingen
   - bank*         : bankbestand of bankkoppeling (Enable Banking): betalingen automatisch op de juiste factuur (bank.js)
   - mfa*, dagBackup, backup* : tweestapsverificatie voor het CRM en dagelijkse back-ups (beveiliging.js)
   Sleutels staan in Firestore /geheim/config (alleen de server kan ze lezen). */
const { onCall: _onCall, onRequest: _onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule: _onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
setGlobalOptions({ region: "europe-west4", maxInstances: 5 });
const rawDb = admin.firestore();
/* meerdere bedrijven: elke database-aanroep gaat naar het bedrijf van het lopende verzoek (tenant.js) */
const T = require("./tenant");
const db = T.maakDb(rawDb);
const BIDC = new Map(), BEST = new Map();
async function bidVanEmail(e) {
  if (!e) return T.LEGACY; const c = BIDC.get(e); if (c && Date.now() - c.t < 60e3) return c.b;
  let b = T.LEGACY; try { const s = await rawDb.doc("gebruikers/" + e).get(); if (s.exists && T.BID_RE.test(String(s.data().bedrijf || ""))) b = s.data().bedrijf; } catch (x) {}
  BIDC.set(e, { b, t: Date.now() }); return b;
}
async function bestaat(b) { const c = BEST.get(b); if (c && Date.now() - c.t < 300e3) return c.ok; const ok = (await rawDb.doc("bedrijven/" + b).get()).exists; BEST.set(b, { ok, t: Date.now() }); return ok; }
const onCall = (o, f) => { if (typeof o === "function") { f = o; o = {}; }
  return _onCall(o, async req => { const a = req.auth && req.auth.token, e = a && a.email_verified ? String(a.email || "").toLowerCase() : ""; return T.metBedrijf(await bidVanEmail(e), () => f(req)); }); };
const onRequest = (o, f) => { if (typeof o === "function") { f = o; o = {}; }
  return _onRequest(o, async (req, res) => { const b = T.bidUitReq(req); if (b !== T.LEGACY && !(await bestaat(b))) { res.status(404).send("Onbekend bedrijf"); return; } return T.metBedrijf(b, () => f(req, res)); }); };
/* geplande taken draaien voor elk bedrijf apart */
const onSchedule = (o, f) => _onSchedule(o, async ev => {
  let lijst = [T.LEGACY]; try { lijst = lijst.concat((await rawDb.collection("bedrijven").get()).docs.filter(d => !["gestopt", "verwijderd"].includes(d.data().status)).map(d => d.id)); } catch (e) { console.error("bedrijven", e); }
  for (const b of lijst) { try { await T.metBedrijf(b, () => f(ev)); } catch (e) { console.error("taak", b, e); } }
});
const bucket = () => admin.storage().bucket();
const EIGENAAR = "robin@mijnschoonmaker.com";
const nu = () => new Date().toISOString();
const newId = p => p + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");

const BEV = require("./beveiliging")({ admin, db, bucket, onCall, onSchedule, HttpsError, crypto, EIGENAAR });
const geheim = async () => { const t = (await db.doc("geheim/config").get()).data() || {}; if (T.isLegacy()) return t;
  /* nieuwe bedrijven: de mail- en AI-sleutels van het platform, hun eigen Mollie- en banksleutels */
  const p = (await rawDb.doc("geheim/config").get()).data() || {};
  return { brevoKey: p.brevoKey, aiKey: p.aiKey, afzender: p.platformAfzender || p.afzender, hookToken: p.hookToken, ...t }; };
/* logo voor in mails: als ingesloten afbeelding (zoals bij facturen en offertes), zodat mailprogramma's hem niet blokkeren als "externe afbeelding" */
const MAILLOGO = { id: "", url: "" };
async function laadMailLogo(b) { const id = b.logoMail || b.logo; if (!id || MAILLOGO.id === id) return; try { const [[m], [buf]] = await Promise.all([bucket().file("assets/" + id).getMetadata(), bucket().file("assets/" + id).download()]); if (buf.length < 900000) { MAILLOGO.id = id; MAILLOGO.url = "data:" + (m.contentType || "image/png") + ";base64," + buf.toString("base64"); } } catch (e) { console.warn("mail-logo", e.message || e); } }
const bedrijf = async () => { const b = (await db.doc("instellingen/bedrijf").get()).data() || {}; await laadMailLogo(b); return b; };

/* ---------- bestellingsoverzicht: gedeelde hulpjes ---------- */
const { maakOverzichtPdf, eur } = require("./overzicht");
const HOST = () => { try { return "https://" + (process.env.GCLOUD_PROJECT || JSON.parse(process.env.FIREBASE_CONFIG || "{}").projectId) + ".web.app"; } catch (e) { return ""; } };
const nlDatum = (d = new Date()) => new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "2-digit", month: "2-digit", year: "numeric" }).format(d).replace(/\//g, "-");
const nlTijd = (d = new Date()) => new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" }).format(d);
async function leesAsset(id) { if (!id) return null; try { const f = bucket().file("assets/" + id); const [[m], [buf]] = await Promise.all([f.getMetadata(), f.download()]); return { bytes: buf, type: m.contentType || "" }; } catch (e) { return null; } }
async function volgNummer() { const ref = db.doc("tellers/overzicht"); const n = await db.runTransaction(async t => { const s = await t.get(ref); const v = (s.exists ? s.data().n : 1800) + 1; t.set(ref, { n: v }); return v; }); return String(new Date().getFullYear()).slice(2) + "-" + String(n).padStart(6, "0"); }
function bedrijfModel(b, logo) { return { naam: b.naam || "mijnschoonmaker.com", adres: b.adres || "", pcPlaats: [b.postcode, b.plaats].filter(Boolean).join(" "), telefoon: b.telefoon || "", email: b.email || "", kvk: b.kvk || "", btwnr: b.btwnr || "", iban: b.iban || "", bic: b.bic || "", logo }; }
const voornaamVan = naam => { const n = String(naam || "").trim(); if (n.includes(",")) return n.split(",").slice(1).join(",").trim() || n; return n.split(/\s+/)[0] || n; };
const TPL_STD = {
  voorlopig: { onderwerp: "[name.company] - Voorlopig bestellingsoverzicht [nr.invoice]", mail: "Beste [firstname.customer],\n\nBedankt voor uw bestelling via mijnschoonmaker.com.\nIn de bijlage vindt u uw voorlopige bestellingsoverzicht en onze algemene voorwaarden.\n\nUw eerste bezoek\nTijdens uw eerste bezoek voeren we de door u bestelde diensten uit. Dit eerste bezoek noemen we de 0-beurt. We controleren daarbij ook of de opgegeven aantallen overeenkomen met de situatie ter plaatse. Mocht hierin een verschil zitten, dan kan dit gevolgen hebben voor de prijs. Meer informatie hierover vindt u in onze algemene voorwaarden.\nDe planning\nWe plannen uw woning in op een passende route, waarbij we afspraken zoveel mogelijk per omgeving combineren. Hierdoor kan het eerste bezoek iets langer op zich laten wachten. Houd rekening met een wachttijd van ongeveer 2 tot 8 weken.\n\nNa uw eerste bezoek komen we iedere 8 weken bij u langs. Twee dagen voor iedere afspraak ontvangt u een e-mail met de datum en het tijdstip.\nZodra uw eerste bezoek is ingepland, ontvangt u hiervan bericht.\n\nMet vriendelijke groet,\nmijnschoonmaker.com\nWhatsapp: [06 18 06 06 06](https://wa.me/message/GPFV7VR2JSCHC1) | ma - vrij 10:00 uur - 17:30 uur" },
  definitief: { onderwerp: "[name.company] - Definitief bestellingsoverzicht [nr.invoice]", mail: "Beste [firstname.customer],\n\nHartelijk dank voor uw vertrouwen in mijnschoonmaker.com.\nBijgaand ontvangt u het definitieve bestellingsoverzicht van de door u gekozen diensten.\n\nUw overeenkomst heeft een standaardlooptijd van één jaar.\nNa deze periode zetten wij de dienstverlening voort volgens de afgesproken frequentie, totdat de overeenkomst wordt beëindigd conform onze algemene voorwaarden.\nOp deze overeenkomst zijn onze algemene voorwaarden van toepassing.\n\nMet vriendelijke groet,\nmijnschoonmaker.com" }
};
async function sjabloon(sleutel) { try { const d = (await db.doc("instellingen/sjablonen").get()).data() || {}; const t = d[sleutel]; if (t && t.mail) return { onderwerp: t.onderwerp || TPL_STD[sleutel].onderwerp, mail: t.mail }; } catch (e) {} return TPL_STD[sleutel]; }
function vulIn(tekst, v) { return String(tekst || "").replace(/\[([a-z0-9_]+)\.([a-z_]+)\]/g, (m, a, b) => { const k = a + "." + b; return v[k] != null ? String(v[k]) : m; }); }
const htmlEsc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/* alle mails als realistisch ticket: papier met zachte schaduw, blauwe kopband, perforatie met ronde inkepingen en een blauwe strook onderaan */
function mailHtml(tekst, b, opts = {}) { return geenAutoLinks(mailHtmlRuw(tekst, b, opts)); }
/* Outlook/Gmail maken van nummers, datums, domeinen en e-mailadressen lelijke blauwe links: zelf netjes opmaken of onzichtbaar onderbreken */
function geenAutoLinks(html){let inA=0,inS=0;
  return String(html).split(/(<[^>]+>)/).map(p=>{if(p[0]==="<"){const t=p.toLowerCase();if(/^<a[\s>]/.test(t))inA++;else if(t.startsWith("</a"))inA=Math.max(0,inA-1);else if(/^<style/.test(t))inS=1;else if(t.startsWith("</style"))inS=0;return p}
    if(inA||inS||!p.trim())return p;
    return p.replace(/([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|((?:[\w-]+\.)+(?:com|nl|be|eu|net|org|info)\b)|((?<![#&\w])\d[\d\s\-\/:.]{2,}\d(?![\d;]))/gi,(m,mail,dom,num)=>{
      if(mail)return `<a href="mailto:${mail}" style="color:inherit;text-decoration:none">${mail}</a>`;
      if(dom)return `<a href="https://${dom}" style="color:inherit;text-decoration:none">${dom}</a>`;
      return m.split("").join("&zwnj;")})}).join("")}
function mailHtmlRuw(tekst, b, opts = {}) {
  const BL = "#137a8a", BL2 = "#1d5a74", BG = "#eef2f3", INK = "#0f1f26", MUT = "#5d6f76";
  const T = opts.ticket || null, A = (T && T.kleur) || BL;
  const lid = b.logoMail || b.logo, logo = lid ? `<img src="${HOST() + "/_blob/" + lid}" border="0" alt="${htmlEsc(b.naam || "")}" style="max-height:${Math.min(72, Number(b.logoGrootte) || 56)}px;max-width:170px;display:inline-block">` : `<b style="font-size:19px;letter-spacing:-.3px;color:${INK}">${htmlEsc(b.naam || "")}</b>`;
  const regel = r => htmlEsc(r).replace(/\*\*(.+?)\*\*/g, `<b style="color:${INK}">$1</b>`).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (m, t, u) => `<a href="${u}" style="color:${A};font-weight:700;text-decoration:none;border-bottom:1.5px solid ${A}55">${t}</a>`);
  const alinea = t => String(t).split(/\n\s*\n/).filter(x => x.trim()).map(p => `<p style="margin:0 0 15px;line-height:1.65;font-size:15.5px;color:#2b3a40;letter-spacing:-.1px">${p.split("\n").map(regel).join("<br>")}</p>`).join("");
  const knop = opts.knop ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:6px auto 22px"><tr><td style="border-radius:14px;background:${A};background-image:linear-gradient(135deg,#1590a2,${A} 55%,#11677a);box-shadow:0 10px 20px -10px rgba(15,95,110,.7)"><a href="${opts.knop.url}" style="display:inline-block;padding:13px 26px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:-.1px;border-radius:14px">${htmlEsc(opts.knop.tekst)} &rarr;</a></td></tr></table>` : "";
  const mono = "'SF Mono',Menlo,Consolas,'Courier New',monospace";
  const gat = kant => `<td width="15" style="width:15px;padding:0;background:#fbfcfc;font-size:0;line-height:0"><div style="width:15px;height:30px;background:${BG};border-radius:${kant === "l" ? "0 15px 15px 0" : "15px 0 0 15px"};box-shadow:inset ${kant === "l" ? "-2px" : "2px"} 0 3px rgba(15,70,85,.10)">&nbsp;</div></td>`;
  const nr = String(opts.nummer || (T && T.nummer) || "").trim();
  /* strook: status van het ticket, of bij gewone mails de contactgegevens */
  const lab = "font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.72)";
  const nl = x => htmlEsc(x);
  const strook = T ? T.strook : `<div style="font-size:16px;font-weight:800;color:#fff;letter-spacing:-.2px">${htmlEsc(b.naam || "")}</div><div style="font-size:12.5px;color:rgba(255,255,255,.72);margin:2px 0 12px">Glasbewassing &middot; vaste route</div><table role="presentation" cellpadding="0" cellspacing="0" border="0" class="ms-nl">${[["WhatsApp",b.telefoon],["E-mail",b.email],["IBAN",b.iban]].filter(x=>x[1]).map(([l,v])=>`<tr><td style="padding:3px 14px 3px 0;font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.6);white-space:nowrap;vertical-align:top;line-height:20px">${l}</td><td style="padding:3px 0;font-size:14px;font-weight:600;color:#ffffff;line-height:20px;word-break:break-word${l==="IBAN"?";font-family:'SF Mono',Menlo,Consolas,monospace;font-weight:500;font-size:13px;letter-spacing:.5px":""}">${l==="WhatsApp"?`<a href="https://wa.me/${String(b.webWa||v).replace(/\D/g,"").replace(/^00/,"").replace(/^0/,"31")}" style="color:#ffffff;text-decoration:none">${htmlEsc(v)}</a>`:htmlEsc(v)}</td></tr>`).join("")}</table>`;
  const kop = T ? T.kop : "";
  return `<style>a[x-apple-data-detectors],.ms-nl a{color:inherit!important;text-decoration:none!important}${opts.style || ""}</style><div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:${BG};padding:26px 12px 22px;-webkit-font-smoothing:antialiased">
<div class="ms-tk" style="width:100%;max-width:720px;margin:0 auto;border-radius:22px;box-shadow:0 1px 2px rgba(15,70,85,.06),0 22px 44px -22px rgba(15,70,85,.38)">
<div style="background:#ffffff;background-image:linear-gradient(180deg,#ffffff 0%,#fbfcfc 100%);border-radius:22px 22px 0 0;overflow:hidden">
  <div style="height:9px;background:${BL};background-image:linear-gradient(90deg,${BL2},${BL} 60%,#2aa3b3)"></div>
  <div style="text-align:center;padding:24px 24px ${kop ? 2 : 6}px">${logo}</div>
  ${kop ? `<div style="padding:14px 34px 4px">${kop}</div>` : ""}
  <div style="padding:${kop ? 12 : 16}px 34px 8px">${alinea(tekst)}${opts.na || ""}${knop}${opts.onder ? alinea(opts.onder) : ""}</div>
</div>
${T ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse"><tr>${gat("l")}<td style="background:#fbfcfc;padding:0 8px;height:30px"><div style="border-top:2px dotted #c3d2d6;height:0;line-height:0;font-size:0">&nbsp;</div></td>${gat("r")}</tr></table>` : `<div style="background:#fbfcfc;height:14px;line-height:14px;font-size:0">&nbsp;</div>`}
<div style="background:${BL};background-image:repeating-linear-gradient(115deg,rgba(255,255,255,.035) 0 2px,transparent 2px 22px),linear-gradient(135deg,${BL2},${BL} 60%,#1a8c9c);border-radius:0 0 22px 22px;color:#ffffff;padding:18px 30px 20px">${strook}</div>
</div>${T ? `<p class="ms-nl" style="text-align:center;font-size:12px;color:#8a979c;margin:16px 0 0">${[b.naam, b.telefoon, b.email].filter(Boolean).map(nl).join(" &nbsp;·&nbsp; ")}</p>` : ""}</div>`;
}
async function bewaarPdf(buf) { const hid = crypto.randomBytes(16).toString("hex"); await bucket().file("assets/" + hid).save(Buffer.from(buf), { contentType: "application/pdf", resumable: false }); return hid; }
/* overzicht maken + mailen; geeft { nummer, brevoId } terug */
async function stuurOverzichtMail({ soort, model, naar, naamKlant, klantId, meta }) {
  const [g, b] = await Promise.all([geheim(), bedrijf()]);
  if (!g.brevoKey) throw new Error("geen Brevo-sleutel");
  const vl = soort !== "definitief";
  const [logo, vw, hf] = await Promise.all([leesAsset(b.logo), vl ? leesAsset(b.voorwaardenPdf) : null, vl ? leesAsset(b.herroepingPdf) : null]);
  const nummer = model.nummer || await volgNummer();
  const titel = soort === "definitief" ? "Definitief bestellingsoverzicht" : "Voorlopig bestellingsoverzicht";
  const pdf = await maakOverzichtPdf({ contractduur: "1 jaar", datum: nlDatum(), ...model, titel, nummer, bedrijf: bedrijfModel(b, logo) });
  const tpl = await sjabloon(soort), v = { "firstname.customer": voornaamVan(naamKlant), "name.customer": naamKlant, "name.company": b.naam || "", "phone.company": b.telefoon || "", "email.company": b.email || "", "nr.invoice": nummer, "date.invoice": nlDatum() };
  const tekst = vulIn(tpl.mail, v), onderwerp = vulIn(tpl.onderwerp, v);
  const bijlagen = [{ name: `${nummer}_${vl ? "v" : "d"}.pdf`, content: Buffer.from(pdf).toString("base64") }];
  if (vw) bijlagen.push({ name: b.voorwaardenNaam || "Algemene voorwaarden.pdf", content: Buffer.from(vw.bytes).toString("base64") });
  if (hf) bijlagen.push({ name: b.herroepingNaam || "Herroepingsformulier.pdf", content: Buffer.from(hf.bytes).toString("base64") });
  const afz = g.afzender || b.email || "info@mijnschoonmaker.com";
  const brevoId = await brevoSend(g.brevoKey, { sender: { name: b.naam || "mijnschoonmaker", email: afz }, replyTo: { email: b.email || afz }, to: [{ email: naar, name: naamKlant || undefined }], subject: onderwerp, htmlContent: mailHtml(tekst, b), textContent: tekst.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, "$1 ($2)"), attachment: bijlagen, tags: ["crm", soort] });
  const id = newId("m");
  let pdfId = ""; try { pdfId = await bewaarPdf(pdf); } catch (e) { console.error("pdf bewaren", e); }
  const bl = [{ naam: bijlagen[0].name, id: pdfId }]; if (vw) bl.push({ naam: bijlagen[1].name, id: b.voorwaardenPdf || "" }); if (hf) bl.push({ naam: bijlagen[bijlagen.length - 1].name, id: b.herroepingPdf || "" });
  await db.doc("berichten/" + id).set({ ...(meta || {}), klantId: klantId || "", klantNaam: naamKlant || "", naar, kanaal: "email", sjabloon: soort, onderwerp, tekst, status: "verstuurd", brevoId, verstuurdOp: nu(), op: nu(), bijlage: bijlagen.map(x => x.name).join(", "), bijlagen: bl, overzichtNr: nummer });
  return { nummer, brevoId, berichtId: id };
}

function aanvraagModel(D, b0) {
  const t0 = D.telling || {}, pct = Number(b0.btw) || 21;
  const FL = ["Begane grond", "1e verdieping", "2e verdieping", "3e verdieping"], SP = { lood: "Glas-in-lood", mini: "Miniraampjes", koepel: "Lichtkoepels", tuimel: "Dak- / tuimelramen" };
  const freq = { m4: "1x per 4 weken", m6: "1x per 6 weken", m8: "1x per 8 weken", m12: "1x per 12 weken" }[t0.freq] || "1x per 8 weken";
  const subs = [...(t0.floors || []).map((n, i) => Number(n) > 0 ? { naam: FL[Math.min(i, 3)] || (i + "e verdieping"), aantal: Number(n) + " st", freq } : null), ...Object.entries(t0.special || {}).map(([k, n]) => Number(n) > 0 ? { naam: SP[k] || k, aantal: Number(n) + " st", freq } : null)].filter(Boolean);
  const incl = Number((D.prijs || {}).incl) || 0, excl = Number((D.prijs || {}).excl) || Math.round(incl / (1 + pct / 100) * 100) / 100;
  const zak = D.soort === "zakelijk" && D.klant.bedrijf, naamK = zak ? D.klant.bedrijf : D.klant.naam;
  return { klant: { naam: naamK, contact: zak ? D.klant.naam : "", adres: D.klant.adres || "", pcPlaats: [String(D.klant.postcode || "").toUpperCase(), D.klant.plaats].filter(Boolean).join(" ") },
            groepen: [{ omschrijving: "Glasbewassing", excl, btwPct: pct, btw: Math.round((incl - excl) * 100) / 100, incl, subs }],
            voetnoot: "Dit overzicht is voorlopig. Tijdens het eerste bezoek (0-beurt) controleren wij de aantallen. Bij een verschil kan de prijs wijzigen." };
}

async function checkGebruiker(auth) {
  const e = auth && auth.token && auth.token.email_verified && String(auth.token.email || "").toLowerCase();
  if (!e) throw new HttpsError("unauthenticated", "Log eerst in.");
  if (e !== EIGENAAR && !(await db.doc("gebruikers/" + e).get()).exists) throw new HttpsError("permission-denied", "Geen toegang tot het CRM.");
  /* tweestapsverificatie: deze inlogsessie moet met een code zijn bevestigd (als de gebruiker het aan heeft staan) */
  if (!(await BEV.mfaBevestigd(auth))) throw new HttpsError("permission-denied", "Bevestig eerst je inlogcode (tweestapsverificatie).");
  if (MANSARD && !(await MANSARD.magGebruiken())) throw new HttpsError("failed-precondition", "De proefperiode is voorbij. Kies een abonnement om verder te gaan (Instellingen › Abonnement).");
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
    tags: ["crm", ...(T.isLegacy() ? [] : ["b:" + T.bid()])]
  };
  if (bijlagen && bijlagen.length) mail.attachment = bijlagen.map(a => ({ name: a.naam, content: a.data }));
  return { key: g.brevoKey, mail };
}

/* knop "Naar uw klantportaal": persoonlijke inloglink, 30 dagen geldig en vaker te gebruiken, zodat de klant direct binnen is */
async function portaalLinkVullen(d) {
  if (d.meta && d.meta.klantId && /__PORTAAL_LINK__/.test(String(d.html || ""))) {
    try { const t = T.tok(32), h = crypto.createHash("sha256").update(t).digest("hex");
      await db.doc("portaalLogin/" + h).set({ klantId: String(d.meta.klantId), email: String(d.naar).trim().toLowerCase(), exp: Date.now() + 30 * 864e5, herbruik: true, op: nu(), bron: "mail" });
      d.html = String(d.html).replace(/__PORTAAL_LINK__/g, "l=" + t); } catch (e) { console.error("portaallink", e); d.html = String(d.html).replace(/[?&]?__PORTAAL_LINK__/g, ""); } }
  else if (/__PORTAAL_LINK__/.test(String(d.html || ""))) d.html = String(d.html).replace(/[?&]?__PORTAAL_LINK__/g, "");
}
exports.sendMail = onCall({ memory: "512MiB", timeoutSeconds: 60 }, async req => {
  const wie = await checkGebruiker(req.auth);
  const d = req.data || {};
  if (!/^\S+@\S+\.\S+$/.test(String(d.naar || ""))) throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");
  const id = /^[\w-]{4,40}$/.test(d.berichtId || "") ? d.berichtId : newId("m");
  await portaalLinkVullen(d);
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
  /* bijlagen bewaren, zodat je ze later bij Verzonden berichten kunt openen */
  try { const bl = []; for (const a of (d.bijlagen || []).slice(0, 6)) { let bid = ""; if (a && a.data && /\.pdf$/i.test(a.naam || "")) bid = await bewaarPdf(Buffer.from(String(a.data), "base64")); bl.push({ naam: String((a && a.naam) || "bijlage"), id: bid }); }
    if (bl.length) await db.doc("berichten/" + id).set({ bijlagen: bl }, { merge: true }); } catch (e) { console.error("bijlage bewaren", e); }
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
      await portaalLinkVullen(d);
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
      redirectUrl: site ? site + "/portaal?betaald=" + encodeURIComponent(factuurId) : (b.website || "https://mijnschoonmaker.com"),
      webhookUrl: site + "/api/mollie" + T.hookQs(),
      metadata: { factuurId }
    })
  });
  const link = p._links && p._links.checkout && p._links.checkout.href;
  await f.ref.set({ mollieId: p.id, mollieLink: link || "", betaallink: link || "", mollieStatus: p.status }, { merge: true });
  return { link, id: p.id };
});
/* factuur automatisch afschrijven bij een klant met een incasso-machtiging (sequenceType recurring) */
exports.mollieIncasso = onCall(async req => {
  await checkGebruiker(req.auth);
  const { factuurId, bedrag, omschrijving, basis } = req.data || {};
  const g = await geheim();
  if (!g.mollieKey) throw new HttpsError("failed-precondition", "Er is nog geen Mollie-sleutel ingesteld.");
  const f = await db.doc("facturen/" + factuurId).get();
  if (!f.exists) throw new HttpsError("not-found", "Factuur niet gevonden.");
  const x = f.data();
  if (x.incasso && x.mollieId && !["failed", "canceled", "expired"].includes(x.mollieStatus || "")) return { id: x.mollieId, status: x.mollieStatus, al: true };
  const ks = await db.doc("klanten/" + String(x.klantId || "")).get();
  const k = ks.exists ? ks.data() : {};
  if (!(k.incasso && k.mollieCustomerId && k.mollieMandateId)) throw new HttpsError("failed-precondition", "Deze klant heeft geen incasso-machtiging.");
  const val = Number(bedrag);
  if (!(val > 0)) throw new HttpsError("invalid-argument", "Ongeldig bedrag.");
  const site = String(basis || "").replace(/\/+$/, "");
  const p = await mollie(g.mollieKey, "payments", { method: "POST", body: JSON.stringify({
    amount: { currency: "EUR", value: val.toFixed(2) }, customerId: k.mollieCustomerId, mandateId: k.mollieMandateId, sequenceType: "recurring",
    description: String(omschrijving || "Factuur " + (x.nummer || factuurId)).slice(0, 255), webhookUrl: site + "/api/mollie" + T.hookQs(), metadata: { factuurId } }) });
  await f.ref.set({ incasso: true, incassoOp: nu(), mollieId: p.id, mollieStatus: p.status, betaallink: "", mollieLink: "" }, { merge: true });
  return { id: p.id, status: p.status };
});
/* incasso intrekken (zolang Mollie de afschrijving nog niet heeft verstuurd) */
exports.mollieIntrekken = onCall(async req => {
  await checkGebruiker(req.auth);
  const { factuurId } = req.data || {};
  const g = await geheim();
  if (!g.mollieKey) throw new HttpsError("failed-precondition", "Er is nog geen Mollie-sleutel ingesteld.");
  const f = await db.doc("facturen/" + String(factuurId || "")).get();
  if (!f.exists) throw new HttpsError("not-found", "Factuur niet gevonden.");
  const x = f.data();
  if (!x.incasso || !x.mollieId) throw new HttpsError("failed-precondition", "Deze factuur staat niet klaar voor incasso.");
  const p = await mollie(g.mollieKey, "payments/" + x.mollieId);
  if (p.status === "paid") throw new HttpsError("failed-precondition", "Deze incasso is al afgeschreven.");
  if (!p.isCancelable && !["failed", "canceled", "expired"].includes(p.status)) throw new HttpsError("failed-precondition", "Mollie heeft de afschrijving al naar de bank gestuurd; intrekken kan niet meer.");
  if (p.isCancelable) await mollie(g.mollieKey, "payments/" + x.mollieId, { method: "DELETE" });
  await f.ref.set({ incasso: false, mollieStatus: "canceled", mollieId: "", incassoIngetrokken: nu() }, { merge: true });
  return { ok: true };
});
exports.mollieHook = onRequest(async (req, res) => {
  const id = (req.body && req.body.id) || "";
  if (!/^tr_\w+$/.test(id)) { res.status(400).send("geen id"); return; }
  const g = await geheim();
  try {
    const p = await mollie(g.mollieKey, "payments/" + id);   // altijd zelf opvragen: de webhook zelf is niet te vertrouwen
    if (p.metadata && p.metadata.incasso && p.metadata.klantId) {
      /* eerste betaling voor de machtiging: bij "paid" is er een mandaat */
      const kref = db.doc("klanten/" + p.metadata.klantId), ks = await kref.get();
      if (ks.exists) {
        const upd = { incassoAanvraag: { id: p.id, op: nu(), status: p.status } };
        if (p.status === "paid" && p.mandateId) {
          let bank = "", rek = "";
          try { const m = await mollie(g.mollieKey, "customers/" + p.customerId + "/mandates/" + p.mandateId); const dt = m.details || {}; bank = dt.consumerName || ""; rek = String(dt.consumerAccount || "").replace(/^(.{4}).*(.{4})$/, "$1 •••• $2"); } catch (e) {}
          Object.assign(upd, { incasso: true, mollieCustomerId: p.customerId, mollieMandateId: p.mandateId, incassoSinds: (p.paidAt || nu()).slice(0, 10), incassoBank: bank, incassoRekening: rek, log: [...(Array.isArray(ks.data().log) ? ks.data().log : []), { datum: nu().slice(0, 10), tekst: "Automatische incasso ingesteld door klant (portaal)" + (rek ? " · " + rek : "") }] });
        }
        await kref.set(upd, { merge: true });
      }
      res.send("ok"); return;
    }
    const fid = p.metadata && p.metadata.factuurId;
    if (fid) {
      const ref = db.doc("facturen/" + fid), upd = { mollieStatus: p.status };
      if (p.sequenceType === "recurring" && ["failed", "canceled", "expired"].includes(p.status)) Object.assign(upd, { incassoMislukt: nu(), incassoFout: (p.details && p.details.bankReason) || p.status });
      if (p.status === "paid") Object.assign(upd, { status: "betaald", betaald: true, betaaldOp: (p.paidAt || nu()).slice(0, 10), betaaldTs: p.paidAt || nu(), betaalwijze: "mollie" });
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
    /* aanbevolen door een bestaande klant? */
    if (D.ref) { try { const r = await P.refKlant(D.ref); if (r) { D.ref = r.code; D.aanbevolenDoor = r.id; } else delete D.ref; } catch (e) { delete D.ref; } }
    let meta = []; try { meta = JSON.parse(velden.fotometa || "[]"); } catch (e) {}
    const id = newId("a"), fotos = [];
    for (const [i, f] of bestanden.entries()) {
      if (!/^image\//.test(f.type || "image/jpeg")) continue;
      const fid = crypto.randomBytes(16).toString("hex");
      await bucket().file("assets/" + fid).save(f.buf, { contentType: f.type || "image/jpeg", resumable: false });
      fotos.push({ id: fid, naam: f.naam || "foto.jpg", ...(meta[i] || {}) });
    }
    await db.doc("aanvragen/" + id).set({ aanvraag: D, fotos, status: "nieuw", ontvangen: nu(), aanbevolenDoor: D.aanbevolenDoor || "", ip: crypto.createHash("sha1").update(ip).digest("hex").slice(0, 12) });

    /* klant krijgt direct het voorlopige bestellingsoverzicht (alleen bij een calculator-aanvraag met e-mailadres) */
    if (D.formaat === "zeem.aanvraag" && (await bedrijf()).ovVoorlopigAan !== false && /^\S+@\S+\.\S+$/.test(String(D.klant.email || ""))) {
      try {
        const b0 = await bedrijf(), zak = D.soort === "zakelijk" && D.klant.bedrijf, naamK = zak ? D.klant.bedrijf : D.klant.naam;
        const r = await stuurOverzichtMail({ soort: "voorlopig", naar: D.klant.email, naamKlant: D.klant.naam || naamK, meta: { aanvraagId: id },
          model: aanvraagModel(D, b0) });
        await db.doc("aanvragen/" + id).set({ overzichtNr: r.nummer, overzichtBericht: r.berichtId }, { merge: true });
      } catch (e) { console.error("voorlopig overzicht", e); }
    }

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

/* ---------- foto's op de instellingenkaarten (platform, per branche): openbaar leesbaar, ook voor de demo ---------- */
exports.kaartfotos = onRequest({ memory: "256MiB" }, async (req, res) => {
  try { const s = await rawDb.doc("platform/kaartfotos").get(); res.set("cache-control", "public, max-age=300"); res.json(s.exists ? s.data() : {}); }
  catch (e) { res.json({}); }
});

/* ---------- bestanden: /_blob/<id> ---------- */
exports.blob = onRequest({ memory: "256MiB" }, async (req, res) => {
  const id = String(req.path || "").split("/").pop();
  if (!/^[\w-]{6,64}$/.test(id)) { res.status(404).send(""); return; }
  const f = bucket().file("assets/" + id);
  try {
    const [m] = await f.getMetadata();
    res.set("content-type", m.contentType || "application/octet-stream");
    res.set("cache-control", "public, max-age=31536000, immutable");
    f.createReadStream().on("error", () => res.status(404).end()).pipe(res);
  } catch (e) { res.status(404).send(""); }
});


/* ---------- definitief overzicht vanuit het CRM (bijv. na de tellingcontrole) ---------- */
exports.stuurOverzicht = onCall({ memory: "512MiB", timeoutSeconds: 60 }, async req => {
  await checkGebruiker(req.auth);
  const d = req.data || {};
  if (!/^\S+@\S+\.\S+$/.test(String(d.naar || ""))) throw new HttpsError("invalid-argument", "Deze klant heeft geen geldig e-mailadres.");
  try {
    const r = await stuurOverzichtMail({ soort: d.soort === "voorlopig" ? "voorlopig" : "definitief", naar: d.naar, naamKlant: d.naamKlant || "", klantId: d.klantId || "", model: d.model || {} });
    if (d.klantId) await db.doc("klanten/" + d.klantId).set({ overzicht: { soort: d.soort || "definitief", nummer: r.nummer, op: nu() } }, { merge: true });
    return r;
  } catch (e) { throw new HttpsError("internal", "Versturen lukte niet: " + (e.message || e)); }
});

/* ---------- PDF van een eerder verstuurd overzicht terughalen (oude berichten hebben de PDF niet bewaard) ---------- */
exports.berichtPdf = onCall({ memory: "512MiB", timeoutSeconds: 60 }, async req => {
  await checkGebruiker(req.auth);
  const d = req.data || {}, ref = db.doc("berichten/" + String(d.id || "x")), s = await ref.get();
  if (!s.exists) throw new HttpsError("not-found", "Bericht niet gevonden.");
  const m = s.data(), al = (m.bijlagen || []).find(x => x.id && /_[vd]\.pdf$/.test(x.naam));
  if (al) return { id: al.id };
  if (!m.overzichtNr) throw new HttpsError("failed-precondition", "Bij dit bericht is geen PDF bewaard.");
  const b = await bedrijf(), logo = await leesAsset(b.logo);
  let model = null;
  if (m.factuurId) { const q = await db.collection("akkoord").where("factuurId", "==", m.factuurId).limit(1).get();
    if (!q.empty) { const a = q.docs[0].data(), g = a.getekend || {}; const h = g.handtekening ? await leesAsset(g.handtekening) : null;
      model = { ...(a.model || {}), ...(h ? { handtekening: { naam: g.naam, plaats: g.plaats, datum: g.datum, browser: g.browser, systeem: g.systeem, png: h.bytes } } : {}) }; } }
  if (!model && m.aanvraagId) { const a = await db.doc("aanvragen/" + m.aanvraagId).get(); if (a.exists && a.data().aanvraag) model = aanvraagModel(a.data().aanvraag, b); }
  if (!model && d.model && typeof d.model === "object") model = d.model;
  if (!model) throw new HttpsError("failed-precondition", "De gegevens van dit overzicht zijn niet meer te vinden.");
  const vl = m.sjabloon !== "definitief", titel = vl ? "Voorlopig bestellingsoverzicht" : "Definitief bestellingsoverzicht";
  const pdf = await maakOverzichtPdf({ contractduur: "1 jaar", ...model, datum: nlDatum(new Date(m.op || Date.now())), titel, nummer: m.overzichtNr, bedrijf: bedrijfModel(b, logo) });
  const id = await bewaarPdf(pdf), naam = m.overzichtNr + "_" + (vl ? "v" : "d") + ".pdf";
  const rest = String(m.bijlage || "").split(", ").filter(n => n && n !== naam).map(n => ({ naam: n, id: n === (b.voorwaardenNaam || "Algemene voorwaarden.pdf") ? b.voorwaardenPdf || "" : n === (b.herroepingNaam || "Herroepingsformulier.pdf") ? b.herroepingPdf || "" : "" }));
  await ref.set({ bijlagen: [{ naam, id }, ...rest] }, { merge: true });
  return { id };
});

/* ---------- offerte online ondertekenen: /akkoord/<token> ---------- */
exports.akkoordInfo = onRequest({ cors: true }, async (req, res) => {
  const tok = String(req.query.t || "");
  if (!/^[\w-]{16,64}$/.test(tok)) { res.status(404).json({ fout: "niet gevonden" }); return; }
  const s = await db.doc("akkoord/" + tok).get();
  if (!s.exists) { res.status(404).json({ fout: "niet gevonden" }); return; }
  const a = s.data(), b = await bedrijf();
  res.json({ status: a.status, nummer: a.nummer, geldigTot: a.geldigTot || "", klant: (a.model || {}).klant || {}, groepen: (a.model || {}).groepen || [],
    bedrijf: { naam: b.naam || "", logo: (b.logoMail || b.logo) ? HOST() + "/_blob/" + (b.logoMail || b.logo) : "", telefoon: b.telefoon || "", email: b.email || "" },
    voorwaarden: b.voorwaardenPdf ? HOST() + "/_blob/" + b.voorwaardenPdf : (b.voorwaarden && /^https?:/.test(b.voorwaarden) ? b.voorwaarden : ""), getekend: a.getekend ? { naam: a.getekend.naam, datum: a.getekend.datum } : null });
});
exports.akkoordGeven = onRequest({ cors: true, memory: "512MiB", timeoutSeconds: 60 }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("POST"); return; }
  const d = typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
  const tok = String(d.t || "");
  if (!/^[\w-]{16,64}$/.test(tok)) { res.status(400).json({ fout: "ongeldig" }); return; }
  const naam = String(d.naam || "").trim().slice(0, 80), plaats = String(d.plaats || "").trim().slice(0, 80), png = String(d.png || "");
  if (naam.length < 2 || !/^data:image\/png;base64,/.test(png) || png.length > 600000) { res.status(400).json({ fout: "Vul uw naam in en zet uw handtekening." }); return; }
  const ref = db.doc("akkoord/" + tok);
  const a = await db.runTransaction(async t => { const s = await t.get(ref); if (!s.exists) return null; const v = s.data(); if (v.status !== "open") return { ...v, al: true }; t.update(ref, { status: "bezig" }); return v; });
  if (!a) { res.status(404).json({ fout: "niet gevonden" }); return; }
  if (a.al) { res.json({ ok: true, al: true }); return; }
  try {
    const ua = String(req.headers["user-agent"] || ""), browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) && !/Edg/.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Onbekend";
    const systeem = /iPhone|iPad|Macintosh|Mac OS/.test(ua) ? "Apple" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Onbekend";
    const buf = Buffer.from(png.split(",")[1], "base64"), hid = crypto.randomBytes(16).toString("hex");
    await bucket().file("assets/" + hid).save(buf, { contentType: "image/png", resumable: false });
    const datum = nlDatum() + " - " + nlTijd(), getekend = { naam, plaats, datum, browser, systeem, handtekening: hid, op: nu() };
    await ref.update({ status: "getekend", getekend });
    const f = a.factuurId ? await db.doc("facturen/" + a.factuurId).get() : null;
    if (f && f.exists) await f.ref.set({ status: "geaccepteerd", akkoordOp: nu().slice(0, 10), getekend, getekendNieuw: true }, { merge: true });
    const m = a.model || {}, naar = a.email || "";
    let nummer = "";
    if (naar) { const r = await stuurOverzichtMail({ soort: "definitief", naar, naamKlant: a.naamKlant || (m.klant || {}).naam || "", klantId: a.klantId || "", meta: { factuurId: a.factuurId || "" }, model: { ...m, handtekening: { naam, plaats, datum, browser, systeem, png: buf } } }); nummer = r.nummer; }
    /* melding naar het bedrijf */
    try { const [g, b] = await Promise.all([geheim(), bedrijf()]); if (g.brevoKey && (g.meldAdres || b.email)) await brevoSend(g.brevoKey, { sender: { name: "mijnschoonmaker CRM", email: g.afzender || b.email }, to: [{ email: g.meldAdres || b.email }], subject: `Offerte ${a.nummer || ""} ondertekend door ${naam}`, textContent: `${naam}${plaats ? " uit " + plaats : ""} heeft offerte ${a.nummer || ""} online ondertekend op ${datum}.\nHet definitieve bestellingsoverzicht${nummer ? " (" + nummer + ")" : ""} is naar de klant gemaild.\n\nOpen het CRM om de klant in te plannen.` }); } catch (e) { console.error(e); }
    res.json({ ok: true });
  } catch (e) { console.error(e); await ref.update({ status: "open" }).catch(() => {}); res.status(500).json({ fout: "Er ging iets mis. Probeer het opnieuw." }); }
});

/* ---------- klantportaal ---------- */
const P = require("./portaal")({ db, T, onRequest, onCall, HttpsError, geheim, bedrijf, brevoSend, mailHtml, HOST, nu, newId, checkGebruiker, mollie, voornaamVan, bucket });
/* tweestapsverificatie voor het CRM en dagelijkse back-ups */
Object.assign(exports, BEV.functies);
/* bank: betalingen automatisch koppelen aan facturen (bankbestand of koppeling via Enable Banking) */
const BANK = require("./bank")({ db, T, onCall, onRequest, onSchedule, HttpsError, geheim, checkGebruiker, crypto, nu, HOST });
Object.assign(exports, BANK.functies);
/* Mansard: nieuwe bedrijven aanmelden en abonnementen */
var MANSARD; MANSARD = require("./mansard")({ rawDb, T, onCall, onRequestRaw: _onRequest, HttpsError, nu, mollie, HOST });
Object.assign(exports, MANSARD.functies);
exports.ticketMelding = P.ticketMelding;
exports.portaal = P.portaal;
exports.portaalUitnodigen = P.portaalUitnodigen;

/* ---------- ramen tellen met AI: foto's per zijde van de woning, terug: stippen per raam met soort ---------- */
const RT_PROMPT = `Je helpt een Nederlandse glazenwasser het aantal ramen van een woning te tellen. Je krijgt foto's van de zijden van één woning (voorzijde, zijkanten, achterzijde, eventueel extra). Zoek op elke foto ieder raam dat een glazenwasser aan de buitenkant wast, en geef per raam een stip in het midden van het glas.

Wat telt als één raam: elk los ingekaderd glasvlak (elke ruit in een eigen kader of vleugel). Een raam met een bovenlicht = 2. Een deur met glas = 1 per glasvlak. Een schuifpui met 3 glasvlakken = 3. Garagedeur zonder glas telt niet. Ramen van de buren tellen niet mee: alleen de woning die centraal staat.

Soort (t):
- "f0" raam op de begane grond
- "f1" raam op de 1e verdieping
- "f2" raam op de 2e verdieping (ook ramen in een dakkapel op die hoogte)
- "f3" raam op de 3e verdieping of hoger
- "s-tuimel" dakraam/tuimelraam dat schuin in het dakvlak ligt
- "s-koepel" lichtkoepel op een plat dak
- "s-lood" glas-in-lood (ruit met loodstrips, vaak bovenlichten in jaren-30 woningen)
- "s-mini" miniraampje: kleine ruitjes kleiner dan ca. 30x30 cm (ook elk vakje in een roedeverdeling), tel elk ruitje
Bepaal de verdieping aan de hand van de gevel (hoogte, aantal bouwlagen), niet alleen de plek in de foto.

Dubbel tellen voorkomen (belangrijk): de foto's overlappen vaak. Een hoek van de woning staat op twee zijfoto's (hoekramen, de eerste of laatste ramen van een gevel), een extra foto toont vaak opnieuw een deel van een gevel die al op een zijfoto staat, en een uitbouw of dakkapel kan op meerdere foto's staan. Vergelijk daarom de foto's met elkaar op vorm, kozijnkleur, roedes, gordijnen, plek naast deuren, regenpijpen en andere herkenningspunten. Zet elk raam maar op één foto als stip: op de foto waar het het duidelijkst te zien is. Zet hetzelfde raam op de andere foto('s) in "dubbel", met het nummer van de foto waar het wel geteld is.
Coördinaten x en y zijn tussen 0 en 1, relatief aan de breedte en hoogte van die foto (0,0 = linksboven).

Antwoord ALLEEN met JSON, zonder uitleg eromheen, in deze vorm:
{"fotos":[{"i":0,"ramen":[{"t":"f0","x":0.31,"y":0.72}],"dubbel":[{"x":0.92,"y":0.40,"geteld_op":1}]}],"zeker":"hoog|middel|laag","opmerking":"korte Nederlandse opmerking voor de glazenwasser, bv. wat slecht zichtbaar was (max 1 zin), of leeg"}`;
const RT_SOORT = new Set(["f0", "f1", "f2", "f3", "s-tuimel", "s-koepel", "s-lood", "s-mini"]);
exports.ramenTellen = onCall({ memory: "512MiB", timeoutSeconds: 120 }, async req => {
  await checkGebruiker(req.auth);
  const g = await geheim(), key = g.aiKey;
  if (!key) throw new HttpsError("failed-precondition", "AI-tellen is nog niet ingesteld. Vul je Anthropic API-sleutel in bij Instellingen › AI ramen tellen.");
  const fotos = (req.data && req.data.fotos || []).filter(f => f && typeof f.data === "string" && f.data.length > 100).slice(0, 8);
  if (!fotos.length) throw new HttpsError("invalid-argument", "Geen foto's ontvangen.");
  const content = [];
  fotos.forEach((f, i) => {
    content.push({ type: "text", text: `Foto ${i} · ${String(f.zijde || "zijde").slice(0, 40)}` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.data.replace(/^data:image\/\w+;base64,/, "") } });
  });
  content.push({ type: "text", text: "Tel nu de ramen en geef het JSON-antwoord." });
  let r, j;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: g.aiModel || "claude-opus-5-5", max_tokens: 4000, system: RT_PROMPT, messages: [{ role: "user", content }] }) });
    j = await r.json();
  } catch (e) { throw new HttpsError("unavailable", "De AI was niet bereikbaar. Probeer het zo nog eens."); }
  if (!r.ok) { const m = (j && j.error && j.error.message) || r.status; console.error("ramenTellen", m);
    throw new HttpsError(r.status === 401 ? "permission-denied" : "internal", r.status === 401 ? "De AI-sleutel klopt niet. Controleer hem bij Instellingen." : "AI-tellen lukte niet: " + m); }
  const txt = (j.content || []).filter(c => c.type === "text").map(c => c.text).join(""), a = txt.indexOf("{"), b = txt.lastIndexOf("}");
  let out; try { out = JSON.parse(txt.slice(a, b + 1)); } catch (e) { console.error("ramenTellen parse", txt.slice(0, 400)); throw new HttpsError("internal", "De AI gaf geen bruikbaar antwoord. Probeer het opnieuw."); }
  const cl = n => Math.max(0, Math.min(1, Math.round((Number(n) || 0) * 10000) / 10000));
  const per = fotos.map((_, i) => { const f = (out.fotos || []).find(x => Number(x.i) === i) || {};
    return (f.ramen || []).filter(d => RT_SOORT.has(d.t)).slice(0, 120).map(d => ({ t: d.t, x: cl(d.x), y: cl(d.y) })); });
  const dub = fotos.map((_, i) => { const f = (out.fotos || []).find(x => Number(x.i) === i) || {};
    return (Array.isArray(f.dubbel) ? f.dubbel : []).slice(0, 60).map(d => ({ x: cl(d.x), y: cl(d.y), i: Math.max(0, Math.min(fotos.length - 1, Number(d.geteld_op) || 0)) })).filter(d => d.i !== i); });
  return { fotos: per, dubbel: dub, zeker: ["hoog", "middel", "laag"].includes(out.zeker) ? out.zeker : "", opmerking: String(out.opmerking || "").slice(0, 300) };
});
