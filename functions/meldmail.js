/* Meldingen aan het bedrijf zelf (nieuwe aanvraag, offerte ondertekend, klantportaal, vraag via de website):
   van platte tekst een rustige, opgemaakte mail maken in de stijl van Mansard. De platte tekst blijft als tekstversie mee. */
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const LAB = /^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .\/()-]{1,34}):\s+(.+)$/;
const ACTIE = /^(open het crm|open mansard|beantwoord|bekijk|plan |ga naar)/i;
const APP = "https://app.mansard.nl";

function meldHtml(onderwerp, tekst) {
  const regels = String(tekst || "").replace(/\r/g, "").split("\n");
  const blokken = []; let velden = [], actie = "", nieuw = true;
  const sluitVelden = () => { if (velden.length) { blokken.push({ v: velden }); velden = []; } };
  for (const r0 of regels) {
    const r = r0.trim();
    if (!r) { sluitVelden(); nieuw = true; continue; }
    if (ACTIE.test(r)) { actie = r; continue; }
    const m = LAB.exec(r);
    if (m && !/^https?$/i.test(m[1])) { velden.push([m[1], m[2]]); nieuw = true; continue; }
    sluitVelden();
    const vorige = blokken[blokken.length - 1];
    if (!nieuw && vorige && vorige.p !== undefined) vorige.p += "<br>" + esc(r); else blokken.push({ p: esc(r) });
    nieuw = false;
  }
  sluitVelden();
  /* eerste zin als inleiding iets groter */
  const tijd = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(new Date());
  const body = blokken.map((b, i) => b.v
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;background:#f7f8fa;border:1px solid #eceef2;border-radius:14px;margin:0 0 20px">${b.v.map(([l, w], j) => `<tr><td style="padding:${j ? 11 : 14}px 0 ${j === b.v.length - 1 ? 14 : 11}px 18px;${j ? "border-top:1px solid #eceef2;" : ""}font:600 10.5px/1.4 -apple-system,'Helvetica Neue',Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#8a909c;width:34%;vertical-align:top">${esc(l)}</td><td style="padding:${j ? 11 : 14}px 18px ${j === b.v.length - 1 ? 14 : 11}px 10px;${j ? "border-top:1px solid #eceef2;" : ""}font:500 15px/1.5 -apple-system,'Helvetica Neue',Arial,sans-serif;color:#14181f;vertical-align:top">${/@/.test(w) && !/\s/.test(w) ? `<a href="mailto:${esc(w)}" style="color:#252c3c;text-decoration:none">${esc(w)}</a>` : /^\+?[\d ()-]{8,}$/.test(w) ? `<a href="tel:${esc(w.replace(/[^\d+]/g, ""))}" style="color:#252c3c;text-decoration:none">${esc(w)}</a>` : esc(w)}</td></tr>`).join("")}</table>`
    : `<p style="margin:0 0 18px;font:${i === 0 ? "400 17px/1.6" : "400 15px/1.65"} -apple-system,'Helvetica Neue',Arial,sans-serif;color:${i === 0 ? "#14181f" : "#3a4150"}">${b.p}</p>`).join("");
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(onderwerp)}</title></head>
<body style="margin:0;padding:0;background:#f3f3f1">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f3f1"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;border-collapse:separate;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 2px rgba(20,23,28,.04),0 24px 48px -32px rgba(20,23,28,.28)">
<tr><td style="background:#252c3c;background-image:linear-gradient(135deg,#3a4560,#1f2533);padding:26px 32px 24px">
  <div style="font:400 15px/1 Georgia,'Times New Roman',serif;letter-spacing:7px;color:#ffffff">MANSARD</div>
  <div style="margin-top:22px;font:600 10.5px/1.4 -apple-system,'Helvetica Neue',Arial,sans-serif;letter-spacing:2.2px;text-transform:uppercase;color:rgba(255,255,255,.62)">Melding · ${esc(tijd)}</div>
  <div style="margin-top:8px;font:500 21px/1.35 -apple-system,'Helvetica Neue',Arial,sans-serif;color:#ffffff">${esc(onderwerp)}</div>
</td></tr>
<tr><td style="padding:30px 32px 8px">${body}
  ${actie ? `<p style="margin:4px 0 16px;font:400 14px/1.6 -apple-system,'Helvetica Neue',Arial,sans-serif;color:#6b7280">${esc(actie)}</p>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px"><tr><td style="border-radius:12px;background:#252c3c;background-image:linear-gradient(135deg,#3a4560,#252c3c)"><a href="${APP}" style="display:inline-block;padding:14px 26px;font:700 12px/1 -apple-system,'Helvetica Neue',Arial,sans-serif;letter-spacing:2.2px;text-transform:uppercase;color:#ffffff;text-decoration:none">Open Mansard &rarr;</a></td></tr></table>
</td></tr>
<tr><td style="padding:18px 32px 24px;border-top:1px solid #eef0f3;font:400 12px/1.6 -apple-system,'Helvetica Neue',Arial,sans-serif;color:#9aa1a8">Deze melding is automatisch verstuurd door Mansard. Alleen voor u en uw team.</td></tr>
</table></td></tr></table></body></html>`;
}
module.exports = { meldHtml };
