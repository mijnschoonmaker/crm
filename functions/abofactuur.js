/* Btw-factuur voor het Mansard-abonnement: bij elke betaalde Mollie-betaling (eerste maand en elke maand daarna)
   een PDF met het Mansard-logo, bewaard in de opslag en per mail naar de eigenaar van het bedrijf.
   Nooit dubbel: per Mollie-betaling (tr_…) één factuur. De factuur is al voldaan (iDEAL/incasso), er staat dus geen IBAN op. */
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const MANSARD = { naam: "Mansard", adres: "Parklaan 7", pcPlaats: "9861 CD Grootegast", kvk: "55979068", btwnr: "NL002198478B25", web: "mansard.nl" };
const BTW = 21;
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const eur = n => "€ " + r2(n).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const veilig = s => String(s == null ? "" : s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x20-\x7E\xA0-\xFF€]/g, "");
const nlDatum = iso => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00Z"); return isNaN(d) ? "" : d.getUTCDate() + " " + MAANDEN[d.getUTCMonth()] + " " + d.getUTCFullYear(); };
const dagNL = d => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(d ? new Date(d) : new Date());
const plusMaandMin1 = iso => { const d = new Date(iso + "T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
let LOGO = null;
const logoBytes = () => { if (LOGO === null) { try { LOGO = fs.readFileSync(path.join(__dirname, "assets", "mansard-logo.png")); } catch (e) { LOGO = false; } } return LOGO; };

async function maakPdf(m) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(veilig("Factuur " + m.nummer)); pdf.setAuthor("Mansard");
  const F = await pdf.embedFont(StandardFonts.Helvetica), B = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, L = 62, R = W - 62, page = pdf.addPage([W, H]);
  const ink = rgb(0.11, 0.13, 0.19), mute = rgb(0.4, 0.43, 0.48), line = rgb(0.86, 0.87, 0.89), band = rgb(0.96, 0.96, 0.955), groen = rgb(0.12, 0.48, 0.3);
  const t = (s, x, y, o = {}) => { const f = o.f || F, sz = o.sz || 9.5, str = veilig(s); let xx = x; if (o.r) xx = x - f.widthOfTextAtSize(str, sz); page.drawText(str, { x: xx, y, size: sz, font: f, color: o.c || ink }); };
  let y = H - 64;
  const lb = logoBytes();
  if (lb) { try { const img = await pdf.embedPng(lb); const s = 150 / img.width; page.drawImage(img, { x: L, y: y - img.height * s + 4, width: img.width * s, height: img.height * s }); } catch (e) { t("MANSARD", L, y - 14, { f: B, sz: 18 }); } }
  else t("MANSARD", L, y - 14, { f: B, sz: 18 });
  /* afzender rechts */
  let ry = y;
  [[MANSARD.naam, B], [MANSARD.adres], [MANSARD.pcPlaats], [""], ["KvK " + MANSARD.kvk], ["Btw " + MANSARD.btwnr], [MANSARD.web]].forEach(([s, f]) => { if (s) t(s, R, ry, { r: true, f: f || F, sz: 8.8, c: f ? ink : mute }); ry -= 12.5; });
  y -= 112;
  t("FACTUUR", L, y, { f: B, sz: 20 }); y -= 30;
  /* klant links, gegevens rechts */
  const k = m.klant || {};
  let ly = y; t("Aan", L, ly, { f: B, sz: 8.5, c: mute }); ly -= 14;
  [k.naam, k.adres, k.pcPlaats, k.kvk ? "KvK " + k.kvk : "", k.btwnr ? "Btw " + k.btwnr : "", k.email].filter(Boolean).forEach(s => { t(s, L, ly, { sz: 9.5 }); ly -= 13; });
  let gy = y; const gx = R - 190;
  [["Factuurnummer", m.nummer], ["Factuurdatum", nlDatum(m.datum)], ["Betaald op", nlDatum(m.betaaldOp)], ["Betaalwijze", m.betaalwijze]].forEach(([a, b]) => { t(a, gx, gy, { sz: 8.8, c: mute }); t(b, R, gy, { sz: 8.8, r: true, f: B }); gy -= 14; });
  y = Math.min(ly, gy) - 26;
  /* regels */
  page.drawRectangle({ x: L, y: y - 6, width: R - L, height: 22, color: band });
  t("Omschrijving", L + 10, y + 1, { f: B, sz: 8.8 }); t("Bedrag excl. btw", R - 10, y + 1, { f: B, sz: 8.8, r: true }); y -= 26;
  for (const rg of m.regels) { t(rg.oms, L + 10, y, { sz: 9.5 }); if (rg.sub) t(rg.sub, L + 10, y - 12, { sz: 8.3, c: mute }); t(eur(rg.excl), R - 10, y, { sz: 9.5, r: true }); y -= rg.sub ? 30 : 20; page.drawLine({ start: { x: L, y: y + 8 }, end: { x: R, y: y + 8 }, thickness: 0.6, color: line }); }
  y -= 8;
  const tx = R - 200;
  [["Subtotaal excl. btw", eur(m.excl)], ["Btw " + BTW + "%", eur(m.btw)]].forEach(([a, b]) => { t(a, tx, y, { sz: 9.5, c: mute }); t(b, R - 10, y, { sz: 9.5, r: true }); y -= 16; });
  page.drawLine({ start: { x: tx, y: y + 8 }, end: { x: R, y: y + 8 }, thickness: 0.8, color: ink });
  t("Totaal", tx, y - 6, { f: B, sz: 11 }); t(eur(m.incl), R - 10, y - 6, { f: B, sz: 11, r: true }); y -= 40;
  page.drawRectangle({ x: L, y: y - 10, width: R - L, height: 30, color: rgb(0.93, 0.97, 0.94) });
  t("Voldaan: dit bedrag is al betaald via " + (m.betaalwijze === "iDEAL" ? "iDEAL" : m.betaalwijze.toLowerCase()) + ". U hoeft niets te doen.", L + 12, y + 1, { sz: 9.2, c: groen, f: B });
  t("Mansard · " + MANSARD.adres + ", " + MANSARD.pcPlaats + " · KvK " + MANSARD.kvk + " · Btw " + MANSARD.btwnr, W / 2 - F.widthOfTextAtSize(veilig("Mansard · " + MANSARD.adres + ", " + MANSARD.pcPlaats + " · KvK " + MANSARD.kvk + " · Btw " + MANSARD.btwnr), 7.8) / 2, 40, { sz: 7.8, c: mute });
  return Buffer.from(await pdf.save());
}

module.exports = ({ rawDb, bucket, brevoSend, mailHtml, nu }) => {
  async function volgnummer() {
    const jaar = dagNL().slice(0, 4), ref = rawDb.doc("platform/aboTeller");
    return rawDb.runTransaction(async tr => { const s = await tr.get(ref), d = s.exists ? s.data() : {}; const n = (d.jaar === jaar ? Number(d.n) || 0 : 0) + 1; tr.set(ref, { jaar, n }, { merge: true }); return "MAN-" + jaar + "-" + String(n).padStart(4, "0"); });
  }
  /* p = Mollie-betaling (status paid), b = bedrijven/<bid> */
  async function maakVoorBetaling(bid, p, b) {
    if (!p || p.status !== "paid") return null;
    const ref = rawDb.doc("bedrijven/" + bid + "/abonnementFacturen/" + p.id);
    const al = await ref.get(); if (al.exists) return al.data();
    const incl = r2(Number((p.amount || {}).value) || 0); if (!(incl > 0)) return null;
    const excl = r2(incl / (1 + BTW / 100)), btw = r2(incl - excl);
    const betaald = dagNL(p.paidAt || Date.now()), plan = (b.plan && b.plan.naam) || "Mansard";
    const regels = [];
    if (p.metadata && p.metadata.soort === "start") regels.push({ oms: "Abonnement Mansard, pakket " + plan + " - eerste maand", sub: b.proefTot ? "Proefperiode tot en met " + nlDatum(b.proefTot) + "; daarna het maandbedrag." : "", excl });
    else regels.push({ oms: "Abonnement Mansard, pakket " + plan, sub: "Periode " + nlDatum(betaald) + " t/m " + nlDatum(plusMaandMin1(betaald)) + (b.gebruikers ? " · " + b.gebruikers + (b.gebruikers === 1 ? " gebruiker" : " gebruikers") : ""), excl });
    const ins = (await rawDb.doc("bedrijven/" + bid + "/instellingen/bedrijf").get()).data() || {};
    const klant = { naam: ins.naam || b.naam || "", adres: ins.adres || "", pcPlaats: [ins.postcode, ins.plaats].filter(Boolean).join(" "), kvk: ins.kvk || "", btwnr: ins.btwnr || ins.btwNummer || "", email: b.eigenaar || ins.email || "" };
    const nummer = await volgnummer(), datum = betaald;
    const methode = p.method === "ideal" ? "iDEAL" : p.method === "directdebit" ? "Automatische incasso" : "Mollie";
    const pdf = await maakPdf({ nummer, datum, betaaldOp: betaald, betaalwijze: methode, klant, regels, excl, btw, incl });
    const pad = "abofacturen/" + bid + "/" + nummer + ".pdf";
    await bucket().file(pad).save(pdf, { contentType: "application/pdf", resumable: false });
    const rec = { klantNaam: klant.naam || "", klantEmail: klant.email || "", nummer, datum, betaaldOp: betaald, excl, btw, incl, oms: regels[0].oms, periode: regels[0].sub || "", methode, pad, mollieId: p.id, op: nu(), gemaild: false };
    await ref.set(rec);
    /* mail naar de eigenaar, vanaf de afzender van Mansard */
    try {
      const pl = (await rawDb.doc("platform/geheim").get()).data() || {}, g = (await rawDb.doc("geheim/config").get()).data() || {};
      const key = pl.platformBrevoKey || g.brevoKey, afz = pl.platformAfzender, naar = klant.email;
      if (key && afz && /@/.test(naar)) {
        const tekst = `Beste ${klant.naam || "klant"},\n\nDank je wel voor je betaling. In de bijlage vind je de factuur **${nummer}** van ${eur(incl)} (incl. ${eur(btw)} btw) voor je ${regels[0].oms.charAt(0).toLowerCase() + regels[0].oms.slice(1)}.\n\nHet bedrag is al voldaan via ${methode}; je hoeft niets te doen. Al je facturen vind je ook terug in Mansard bij Instellingen › Abonnement.\n\nMet vriendelijke groet,\nMansard`;
        const mb = { naam: "Mansard", email: afz, mailAccent: "#252c3c", strookSub: "Software voor glazenwassers en schoonmakers" };
        await brevoSend(key, { sender: { name: "Mansard", email: afz }, to: [{ email: naar, name: klant.naam || undefined }], subject: "Factuur " + nummer + " · Mansard", htmlContent: mailHtml(tekst, mb), textContent: tekst.replace(/\*\*/g, ""), attachment: [{ name: "Factuur " + nummer + ".pdf", content: pdf.toString("base64") }], tags: ["mansard", "abofactuur"] });
        await ref.set({ gemaild: true, gemaildOp: nu(), naar }, { merge: true });
      }
    } catch (e) { console.error("abofactuur mail", bid, e.message); }
    return rec;
  }
  async function lijst(bid) { const q = await rawDb.collection("bedrijven/" + bid + "/abonnementFacturen").get(); return q.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, c) => String(c.nummer).localeCompare(String(a.nummer))); }
  async function pdfVan(bid, id) { const d = (await rawDb.doc("bedrijven/" + bid + "/abonnementFacturen/" + id).get()).data(); if (!d || !d.pad) return null; const [buf] = await bucket().file(d.pad).download(); return { naam: "Factuur " + d.nummer + ".pdf", data: buf.toString("base64") }; }
  /* alle Mansard-facturen (voor de eigen boekhouding van Mansard) */
  async function alle() {
    const q = await rawDb.collectionGroup("abonnementFacturen").get(), namen = {};
    const L = [];
    for (const d of q.docs) { const bid = d.ref.parent.parent ? d.ref.parent.parent.id : ""; if (!bid) continue; const x = d.data();
      if (!x.klantNaam && !(bid in namen)) namen[bid] = ((await rawDb.doc("bedrijven/" + bid).get()).data() || {}).naam || bid;
      L.push({ bid, id: d.id, nummer: x.nummer, datum: x.datum, klant: x.klantNaam || namen[bid] || bid, excl: x.excl, btw: x.btw, incl: x.incl, methode: x.methode || "", mollieId: x.mollieId || d.id, oms: x.oms || "", periode: x.periode || "" }); }
    return L.sort((a, c) => String(c.nummer).localeCompare(String(a.nummer)));
  }
  return { maakVoorBetaling, lijst, pdfVan, maakPdf, alle };
};
