/* Algemene voorwaarden voorzien van de handtekening van de klant, als paraaf onder elke pagina.
   De inhoud van elke pagina blijft ongewijzigd: hij wordt iets verkleind (94%) zodat er onderaan
   ruimte vrijkomt voor de paraaf, en er komt een laatste pagina "Ondertekening" bij.
   av = bytes van de voorwaarden-PDF, png = handtekening (PNG-bytes),
   info = { naam, plaats, datum, browser, systeem, nummer, bedrijf } */
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const veilig = s => String(s == null ? "" : s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x20-\x7E\xA0-\xFF€]/g, "");

async function tekenVoorwaarden(av, png, info) {
  const pdf = await PDFDocument.load(av, { ignoreEncryption: true });
  const F = await pdf.embedFont(StandardFonts.Helvetica), B = await pdf.embedFont(StandardFonts.HelveticaBold);
  const img = await pdf.embedPng(png);
  const grijs = rgb(0.45, 0.48, 0.52), lijn = rgb(0.82, 0.84, 0.86), ink = rgb(0.1, 0.12, 0.15);
  const pages = pdf.getPages(), n = pages.length + 1;
  const regel = veilig(`Geparafeerd door ${info.naam || ""} · ${info.datum || ""}${info.nummer ? " · offerte " + info.nummer : ""}`);
  pages.forEach((p, i) => {
    const { width: W, height: H } = p.getSize(), s = 0.94;
    p.scaleContent(s, s);
    p.translateContent(W * (1 - s) / 2, H * (1 - s));
    const strook = H * (1 - s), L = Math.max(36, W * 0.07), R = W - L, y0 = 14;
    p.drawLine({ start: { x: L, y: strook - 6 }, end: { x: R, y: strook - 6 }, thickness: 0.5, color: lijn });
    p.drawText(regel, { x: L, y: y0 + 10, size: 7, font: F, color: grijs });
    p.drawText(veilig(`Pagina ${i + 1} van ${n}`), { x: L, y: y0, size: 7, font: F, color: grijs });
    const h = Math.min(strook - 14, 30), w = Math.min(img.width * h / img.height, 110), hh = img.height * w / img.width;
    p.drawText("Paraaf", { x: R - w - 34, y: y0 + 6, size: 7, font: B, color: grijs });
    p.drawImage(img, { x: R - w, y: y0 - 2, width: w, height: Math.min(hh, strook - 10) });
  });
  /* laatste pagina: volledige ondertekening */
  const [W, H] = pages.length ? [pages[0].getSize().width, pages[0].getSize().height] : [595.28, 841.89];
  const p = pdf.addPage([W, H]), L = 62;
  let y = H - 90;
  p.drawText("Ondertekening algemene voorwaarden", { x: L, y, size: 16, font: B, color: ink }); y -= 28;
  const tekst = veilig(`Deze algemene voorwaarden${info.bedrijf ? " van " + info.bedrijf : ""} zijn digitaal ondertekend bij het akkoord op offerte ${info.nummer || ""}. Elke pagina is onderaan geparafeerd met dezelfde handtekening.`);
  const woorden = tekst.split(/\s+/); let cur = "";
  for (const w of woorden) { const nx = cur ? cur + " " + w : w; if (F.widthOfTextAtSize(nx, 10.5) > W - 2 * L && cur) { p.drawText(cur, { x: L, y, size: 10.5, font: F, color: ink }); y -= 16; cur = w; } else cur = nx; }
  if (cur) { p.drawText(cur, { x: L, y, size: 10.5, font: F, color: ink }); y -= 30; }
  const rij = (a, b) => { p.drawText(veilig(a), { x: L, y, size: 10, font: F, color: grijs }); p.drawText(veilig(b || "-"), { x: L + 130, y, size: 10, font: B, color: ink }); y -= 18; };
  rij("Naam", info.naam); if (info.plaats) rij("Plaats", info.plaats); rij("Datum en tijd", info.datum); if (info.nummer) rij("Offerte", info.nummer);
  rij("Apparaat", [info.systeem, info.browser].filter(Boolean).join(" · "));
  y -= 14; p.drawText("Handtekening", { x: L, y, size: 10, font: F, color: grijs }); y -= 8;
  const w = Math.min(240, img.width), h = img.height * w / img.width;
  p.drawRectangle({ x: L, y: y - h - 12, width: w + 24, height: h + 12, borderColor: lijn, borderWidth: 0.8 });
  p.drawImage(img, { x: L + 12, y: y - h - 6, width: w, height: h });
  p.drawText(veilig(`Pagina ${n} van ${n}`), { x: L, y: 28, size: 7, font: F, color: grijs });
  pdf.setTitle(veilig(`Algemene voorwaarden - ondertekend door ${info.naam || ""}`));
  return await pdf.save();
}

module.exports = { tekenVoorwaarden };
