/* ---------- EIGEN MAILTRACKING EN KLANTACTIVITEIT ----------
   1. Elke mail via Mansard (sendMail en ingeplande mails) krijgt een onzichtbaar plaatje en eigen kliklinks:
        /api/t/o/<tok>       leesbevestiging (1x1 gif)
        /api/t/k/<tok>/<nr>  klik op een knop of link, daarna door naar de echte link
      Per keer: tijdstip, apparaat en mailprogramma. Apple Mail-privacy (voorladen) en virusscanners worden herkend en
      apart gezet, zodat "geopend" en "geklikt" alleen echte handelingen van de klant zijn.
   2. Wat de klant daarna doet (klantportaal, factuur-PDF, betalen, offerte) komt in klantActiviteit.
   3. activiteit (onCall): de tijdlijn per klant voor het CRM. Alleen voor ingelogde gebruikers van hetzelfde bedrijf.
   Er wordt geen IP-adres of locatie bewaard. */
module.exports = ({ db, T, onRequest, onCall, HttpsError, checkGebruiker, nu, HOST }) => {
  const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
  const BOT = /bot|spider|crawl|preview|scan|barracuda|mimecast|proofpoint|symantec|trend ?micro|forcepoint|python|curl|wget|go-http|java\/|okhttp|axios|headless|phantom|slurp|facebookexternalhit|linkedin|whatsapp|skypeuri|bingpreview|microsoft office protocol discovery|safelinks|urldefense|cloudmark|sophos|fortinet|cisco/i;
  const bron = (ua) => {
    ua = String(ua || "");
    const dev = /iPad/.test(ua) ? "iPad" : /iPhone/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows-computer" : /Macintosh|Mac OS X/.test(ua) ? "Mac" : "";
    const prog = /GoogleImageProxy|ggpht/i.test(ua) ? "Gmail" : /YahooMailProxy/i.test(ua) ? "Yahoo Mail" : /Outlook|Microsoft Office|ms-office|MSOffice/i.test(ua) ? "Outlook"
      : /Thunderbird/i.test(ua) ? "Thunderbird" : /Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Firefox|FxiOS/.test(ua) ? "Firefox"
      : /AppleWebKit/.test(ua) && /Mobile\//.test(ua) && !/Safari\//.test(ua) ? "Apple Mail" : /AppleWebKit/.test(ua) && !/Safari\//.test(ua) && /Macintosh/.test(ua) ? "Apple Mail" : /Safari\//.test(ua) ? "Safari" : "";
    return { dev, prog };
  };
  /* soort van een open: echt, voorgeladen (Apple Mail-privacy) of scanner */
  const soortOpen = (ua, sec) => { ua = String(ua || "").trim();
    if (BOT.test(ua)) return "scanner";
    if (ua === "Mozilla/5.0" || ua === "") return "voorgeladen"; /* Apple Mail-privacybescherming laadt de mail via een proxy met deze kale naam */
    if (sec != null && sec < 4) return "scanner"; /* binnen een paar seconden na versturen: automatisch */
    return "echt"; };
  const soortKlik = (ua, sec) => { ua = String(ua || "").trim(); if (BOT.test(ua) || ua === "") return "scanner"; if (sec != null && sec < 15) return "scanner"; return "echt"; };
  const LABEL = u => /\/api\/portaal\/b\//.test(u) ? "Betalen" : /\/akkoord\//.test(u) ? "Offerte bekijken" : /\/portaal/.test(u) ? "Klantportaal" : /g\.page|google\.[a-z.]+\/.*(review|maps)|search\.google/i.test(u) ? "Google-review" : /mollie\.com/.test(u) ? "Betalen" : /\.pdf(\?|$)/i.test(u) ? "PDF" : "";
  const tekstVan = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 40);

  /* html voorbereiden: links via onze klikteller, plaatje erin. Geeft { html, trk } terug (trk gaat bij het bericht). */
  function voorbereiden(html, berichtId) {
    html = String(html || ""); if (!html || !berichtId) return { html, trk: null };
    const tok = T.tok(12);
    const m = /(https?:\/\/[a-z0-9.-]+)\/portaal\b/i.exec(html) || /(https?:\/\/(?:app\.mansard\.nl|crm\.mijnschoonmaker\.com|[a-z0-9-]+\.web\.app))\//i.exec(html);
    const base = (m ? m[1] : HOST()).replace(/\/+$/, "");
    const links = [];
    html = html.replace(/<a\b([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi, (all, a, href, b, inner) => {
      const u = href.replace(/&amp;/g, "&");
      if (links.length >= 30 || /\/api\/t\/k\//.test(u) || /unsubscribe|uitschrijven/i.test(u)) return all;
      const i = links.length; links.push({ u: u.slice(0, 1500), l: LABEL(u) || tekstVan(inner) || "Link" });
      return `<a${a}href="${base}/api/t/k/${tok}/${i}"${b}>${inner}</a>`; });
    const px = `<img src="${base}/api/t/o/${tok}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;margin:0;padding:0;opacity:0">`;
    const j = html.search(/<\/body>/i); html = j >= 0 ? html.slice(0, j) + px + html.slice(j) : html + px;
    return { html, trk: { tok, links, base } };
  }

  async function zoek(tok) { if (!/^(?:b[a-z0-9]{7}_)?[a-f0-9]{24}$/.test(String(tok || ""))) return null;
    const q = await db.collection("berichten").where("trkTok", "==", String(tok)).limit(1).get(); return q.empty ? null : q.docs[0]; }

  async function vastleggen(ref, veld, item, max = 40) {
    await db.runTransaction(async t => { const s = await t.get(ref); if (!s.exists) return; const m = s.data() || {};
      const lijst = Array.isArray(m[veld]) ? m[veld] : []; const p = { [veld]: [...lijst, item].slice(-max) };
      if (item.s === "echt") { const k = veld === "trkOpens" ? "trkOpenOp" : "trkKlikOp"; if (!m[k]) p[k] = item.t; p[veld === "trkOpens" ? "trkOpenN" : "trkKlikN"] = (Number(m[veld === "trkOpens" ? "trkOpenN" : "trkKlikN"]) || 0) + 1; }
      t.set(ref, p, { merge: true }); }); }

  /* klantactiviteit vastleggen (klantportaal, betalen, offerte); nooit bij de voorbeeldweergave in het CRM */
  async function act(klantId, soort, info = {}) {
    try { if (!klantId || !soort) return; const t = nu();
      await db.collection("klantActiviteit").add({ ...Object.fromEntries(Object.entries(info || {}).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, typeof v === "string" ? v.slice(0, 200) : v])), klantId: String(klantId), soort: String(soort).slice(0, 40), t }); }
    catch (e) { console.error("klantactiviteit", e.message); } }

  const mailTrack = onRequest({ memory: "256MiB" }, async (req, res) => {
    const deel = String(req.path || "").split("/").filter(Boolean), i0 = deel.indexOf("t"), soort = deel[i0 + 1], tok = deel[i0 + 2], nr = Number(deel[i0 + 3]);
    const ua = String(req.headers["user-agent"] || "").slice(0, 300), t = nu();
    if (soort === "o") {
      res.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0"); res.set("content-type", "image/gif"); res.set("pragma", "no-cache");
      try { const d = await zoek(tok); if (d) { const m = d.data() || {}, sec = m.verstuurdOp ? (Date.parse(t) - Date.parse(m.verstuurdOp)) / 1000 : null, b = bron(ua);
          await vastleggen(d.ref, "trkOpens", { t, s: soortOpen(ua, sec), d: b.dev, p: b.prog }); } } catch (e) { console.error("trk open", e.message); }
      res.send(GIF); return; }
    if (soort === "k") {
      let doel = HOST();
      try { const d = await zoek(tok); if (d) { const m = d.data() || {}, L = ((m.trk || {}).links || [])[nr];
          if (L && /^https?:\/\//.test(L.u)) { doel = L.u; const sec = m.verstuurdOp ? (Date.parse(t) - Date.parse(m.verstuurdOp)) / 1000 : null, b = bron(ua), s = soortKlik(ua, sec);
            await vastleggen(d.ref, "trkKliks", { t, s, l: L.l, i: nr, d: b.dev, p: b.prog });
            if (s === "echt" && m.klantId) await act(m.klantId, "klik", { label: L.l, bericht: d.id, onderwerp: String(m.onderwerp || "").slice(0, 80) }); } } }
      catch (e) { console.error("trk klik", e.message); }
      res.redirect(302, doel); return; }
    res.status(404).send("niet gevonden");
  });

  /* tijdlijn voor het CRM: activiteit van een of meer klanten (of recent, voor de signalen in Overzicht) */
  const activiteit = onCall(async req => {
    await checkGebruiker(req.auth);
    const d = req.data || {}, ids = (Array.isArray(d.klantIds) ? d.klantIds : []).map(String).filter(x => /^[\w-]{2,60}$/.test(x)).slice(0, 10);
    let q;
    if (ids.length) q = await db.collection("klantActiviteit").where("klantId", "in", ids).get();
    else { const sinds = new Date(Date.now() - Math.min(30, Math.max(1, Number(d.dagen) || 7)) * 864e5).toISOString(); q = await db.collection("klantActiviteit").where("t", ">=", sinds).get(); }
    return { items: q.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => String(b.t).localeCompare(String(a.t))).slice(0, 300) };
  });

  return { voorbereiden, act, functies: { mailTrack, activiteit } };
};
