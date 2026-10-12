/* Bestellingsoverzicht (voorlopig / definitief) als PDF, met pdf-lib (geen browser nodig).
   model = { titel, nummer, datum, contractduur,
             bedrijf:{naam,adres,pcPlaats,telefoon,email,kvk,btwnr,iban,bic, logo:{bytes,type}},
             klant:{naam,contact,adres,pcPlaats,klantnummer},
             groepen:[{omschrijving, excl, btwPct, btw, incl, subs:[{naam, aantal, freq}]}],
             handtekening:{naam,plaats,datum,browser,systeem, png:Uint8Array} } */
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const eur = n => "€ " + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// Helvetica (WinAnsi) kent geen tekens buiten Latin-1: vervang wat niet past
const veilig = s => String(s == null ? "" : s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x20-\x7E\xA0-\xFF€]/g, "");

async function maakOverzichtPdf(m) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(veilig(`${m.titel} ${m.nummer || ""}`));
  pdf.setAuthor(veilig(m.bedrijf.naam || ""));
  const F = await pdf.embedFont(StandardFonts.Helvetica), B = await pdf.embedFont(StandardFonts.HelveticaBold), I = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const W = 595.28, H = 841.89, L = 62, R = W - 62;
  let page = pdf.addPage([W, H]), y = H - 60;
  const ink = rgb(0.07, 0.09, 0.1), mute = rgb(0.38, 0.43, 0.46), line = rgb(0.85, 0.87, 0.88), band = rgb(0.95, 0.955, 0.96);
  const t = (s, x, yy, o = {}) => { const f = o.f || F, sz = o.sz || 9.5, str = veilig(s); let xx = x; if (o.r) xx = x - f.widthOfTextAtSize(str, sz); else if (o.c) xx = x - f.widthOfTextAtSize(str, sz) / 2; page.drawText(str, { x: xx, y: yy, size: sz, font: f, color: o.col || ink }); };
  const wrap = (s, f, sz, max) => { const out = []; let cur = ""; for (const w of veilig(s).split(/\s+/)) { const nx = cur ? cur + " " + w : w; if (f.widthOfTextAtSize(nx, sz) > max && cur) { out.push(cur); cur = w; } else cur = nx; } if (cur) out.push(cur); return out; };

  /* logo */
  const b = m.bedrijf;
  if (b.logo && b.logo.bytes) {
    try {
      const img = /png/i.test(b.logo.type || "") ? await pdf.embedPng(b.logo.bytes) : await pdf.embedJpg(b.logo.bytes);
      const s = Math.min(110 / img.width, 80 / img.height);
      page.drawImage(img, { x: L, y: y - img.height * s + 6, width: img.width * s, height: img.height * s });
    } catch (e) { t(b.naam, L, y - 14, { f: B, sz: 16 }); }
  } else t(b.naam, L, y - 14, { f: B, sz: 16 });

  /* bedrijfsgegevens rechts, met labels */
  t(b.naam, R, y - 10, { f: B, sz: 14, r: true });
  let ry = y - 32;
  const lx = R - 120, kv = (k, v) => { if (!v) return; t(k + ":", lx - 6, ry, { f: B, sz: 8.5, r: true }); t(v, lx, ry, { sz: 8.5 }); ry -= 13; };
  kv("Adres", b.adres); if (b.pcPlaats) { t(b.pcPlaats, lx, ry, { sz: 8.5 }); ry -= 13; }
  ry -= 5; kv("Telefoon", b.telefoon); kv("E-mailadres", b.email);
  ry -= 5; kv("KVK-nummer", b.kvk); kv("BTW", b.btwnr); kv("IBAN", b.iban); kv("BIC", b.bic);
  kv("Contractduur", m.contractduur); kv("Klantnummer", m.klant.klantnummer); kv("Datum", m.datum);

  /* klant links */
  let ky = y - 132; const k = m.klant;
  for (const s of [k.naam, k.contact ? "t.a.v. " + k.contact : "", k.adres, k.pcPlaats].filter(Boolean)) { t(s, L, ky, { sz: 10 }); ky -= 14; }

  y = Math.min(ry, ky) - 50;
  t(`Betreft: ${m.titel} ${m.nummer || ""}`, L, y, { f: B, sz: 10.5 }); y -= 22;
  t("Let op:", L, y, { f: B, sz: 10 }); y -= 16;
  for (const s of ["Onderstaande bedragen zijn inclusief middelen, materialen en voorrijkosten.", "Onze voorwaarden zijn van toepassing."]) { t(s, L, y, { sz: 10 }); y -= 14; }
  y -= 22;

  /* tabel */
  const cA = L + 205, xP = L + 300, xT = L + 345, xB = L + 405, cI = R;
  const kop = () => {
    t("Omschrijving", L, y, { f: B, sz: 9.5 }); t("Aantal", cA, y, { f: B, sz: 9.5 });
    t("Prijs", xP, y, { f: B, sz: 9.5, r: true }); t("BTW", xT, y, { f: B, sz: 9.5, r: true }); t("BTW", xB, y, { f: B, sz: 9.5, r: true }); t("Prijs", cI, y, { f: B, sz: 9.5, r: true });
    y -= 12;
    t("(excl. BTW)", xP, y, { sz: 8, col: mute, r: true }); t("(tarief)", xT, y, { sz: 8, col: mute, r: true }); t("(bedrag)", xB, y, { sz: 8, col: mute, r: true }); t("(incl. BTW)", cI, y, { sz: 8, col: mute, r: true });
    y -= 8; page.drawLine({ start: { x: L - 4, y }, end: { x: R + 4, y }, thickness: 0.8, color: ink }); y -= 20;
  };
  const nieuwePagina = () => { page = pdf.addPage([W, H]); y = H - 70; kop(); };
  kop();
  let tot = { excl: 0, btw: 0, incl: 0 };
  for (const g of m.groepen || []) {
    const subs = g.subs || [], need = 22 + subs.length * 26 + 14;
    if (y - need < 120) nieuwePagina();
    t(g.omschrijving, L, y, { f: B, sz: 10.5 });
    if (g.aantal) t(String(g.aantal), cA, y, { sz: 9.5 });
    t(eur(g.excl), xP, y, { f: B, sz: 10, r: true }); t((g.btwPct ?? 21) + " %", xT, y, { f: B, sz: 10, r: true });
    t(eur(g.btw), xB, y, { f: B, sz: 10, r: true }); t(eur(g.incl), cI, y, { f: B, sz: 10, r: true });
    tot.excl += Number(g.excl) || 0; tot.btw += Number(g.btw) || 0; tot.incl += Number(g.incl) || 0;
    y -= 10;
    if (subs.length) {
      const hgt = subs.length * 26 + 8;
      page.drawRectangle({ x: L + 10, y: y - hgt, width: R - L - 6, height: hgt, color: band });
      let sy = y - 14;
      for (const s of subs) {
        t(s.naam, L + 22, sy, { sz: 8.8 }); if (s.aantal !== "" && s.aantal != null) t(String(s.aantal), cA, sy, { sz: 8.8 });
        if (s.freq) t("(" + s.freq + ")", L + 34, sy - 11, { sz: 8, col: mute });
        sy -= 26;
      }
      y -= hgt;
    }
    y -= 22;
  }
  if ((m.groepen || []).length > 1) {
    if (y < 140) nieuwePagina();
    page.drawLine({ start: { x: xP - 70, y: y + 8 }, end: { x: R + 4, y: y + 8 }, thickness: 0.6, color: line });
    y -= 6; t("Totaal per beurt", L, y, { f: B, sz: 10.5 });
    t(eur(tot.excl), xP, y, { f: B, sz: 10, r: true }); t(eur(tot.btw), xB, y, { f: B, sz: 10, r: true }); t(eur(tot.incl), cI, y, { f: B, sz: 10.5, r: true });
    y -= 26;
  }
  if (m.voetnoot) { for (const s of wrap(m.voetnoot, I, 9, R - L)) { if (y < 90) nieuwePagina(); t(s, L, y, { f: I, sz: 9, col: mute }); y -= 13; } y -= 10; }

  /* handtekening */
  const h = m.handtekening;
  if (h) {
    if (y < 210) { page = pdf.addPage([W, H]); y = H - 80; }
    y -= 20;
    for (const [kk, vv] of [["Naam", h.naam], ["Plaatsnaam", h.plaats], ["Datum", h.datum], ["Browser", h.browser], ["Systeem", h.systeem]]) { t(kk + ": " + (vv || "-"), L, y, { f: B, sz: 9.5 }); y -= 15; }
    if (h.png) { try { const img = await pdf.embedPng(h.png); const s = Math.min(170 / img.width, 70 / img.height); page.drawImage(img, { x: L + 10, y: y - img.height * s - 4, width: img.width * s, height: img.height * s }); } catch (e) {} }
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => { const s = `Pagina ${i + 1} / ${pages.length}`; p.drawText(s, { x: W / 2 - I.widthOfTextAtSize(s, 8.5) / 2, y: 40, size: 8.5, font: I, color: mute }); });
  return await pdf.save();
}
module.exports = { maakOverzichtPdf, eur, veilig };
