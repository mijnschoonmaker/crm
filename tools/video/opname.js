/* Neemt het klantportaal van Ashley op als telefoonscherm (1080x1920), op het tempo van de ingesproken tekst. */
const fs = require("fs"), crypto = require("crypto");
const NM = "/home/runner/work/_v/node_modules/";
const admin = require(NM + "firebase-admin"), { chromium } = require(NM + "playwright");
const MET_DB = !!process.env.GOOGLE_APPLICATION_CREDENTIALS; if (MET_DB) admin.initializeApp(); const db = MET_DB ? admin.firestore() : null;
const T = JSON.parse(fs.readFileSync(process.env.TEKST || "tools/video/tekst.json")), DUUR = JSON.parse(fs.readFileSync("out/duur.json"));
const wacht = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const DEMO = process.env.URL; let token = "";
  if (MET_DB) {
  const ks = await db.collection("klanten").get();
  const ash = ks.docs.find(d => /buytendorp/i.test(String(d.data().naam || "")));
  token = crypto.randomBytes(32).toString("hex");
  await db.doc("portaalSessie/" + crypto.createHash("sha256").update(token).digest("hex")).set({ klantId: ash.id, email: ash.data().email || "", exp: Date.now() + 3600e3, gezien: Date.now(), op: new Date().toISOString(), ua: "video" });
  }
  const b = await chromium.launch({ args: ["--font-render-hinting=none", "--force-color-profile=srgb"] });
  const ctx = await b.newContext({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 5, isMobile: true, hasTouch: true, locale: "nl-NL", timezoneId: "Europe/Amsterdam",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
  await ctx.addInitScript(t => { try { localStorage.setItem("ms.portaal.s", t) } catch (e) {} }, token);
  await ctx.addInitScript(() => { window.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style");
    s.textContent = `.__tap{position:fixed;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(19,122,138,.9);box-shadow:0 4px 18px rgba(0,0,0,.25);pointer-events:none;z-index:2147483647;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .5s}html{scroll-behavior:smooth}`;
    document.head.appendChild(s) }) });
  /* ---- live rit op een echte kaart: huis opzoeken (PDOK) en een echte route erheen (OSRM) ---- */
  const LM = process.env.LIVEMODE || ""; let RIT = null, liveAan = false;
  if (LM) {
    const adr = LM === "dave" ? "Tolberterstraat 28 Leek" : "Parklaan 7 Grootegast";
    let huis = LM === "dave" ? [53.1626, 6.3747] : [53.2116, 6.2735];
    try { const j = await (await fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&fl=centroide_ll&q=" + encodeURIComponent(adr))).json(); const m = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(((j.response || {}).docs || [{}])[0].centroide_ll || ""); if (m) huis = [+m[2], +m[1]] } catch (e) { console.log("geocode", e.message) }
    const start = [huis[0] - 0.0085, huis[1] - 0.0125]; let pts = [start, huis];
    try { const r = await (await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${huis[1]},${huis[0]}?overview=full&geometries=geojson`)).json(); if (r.routes && r.routes[0]) pts = r.routes[0].geometry.coordinates.map(c => [c[1], c[0]]) } catch (e) { console.log("route", e.message) }
    RIT = { huis, pts, naam: LM === "dave" ? "Dave" : "Robin" }; console.log("rit", pts.length, "punten", huis);
  }
  const nu2 = new Date(), vandaag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(nu2);
  const liveObj = () => ({ status: "onderweg", voor: 1, bezigBij: false, eta: "11:10", km: 1.6, naam: RIT.naam, huis: RIT.huis, pos: { lat: RIT.pts[0][0], lng: RIT.pts[0][1], koers: 45, ts: new Date().toISOString() } });
  await ctx.route("**/api/portaal/**", async route => {
    const u = route.request().url();
    if (!/\/(data|live)(\?|$)/.test(u) || (!liveAan && LM !== "dave")) return route.continue();
    if (/\/live(\?|$)/.test(u)) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ live: liveAan ? liveObj() : null }) });
    const resp = await route.fetch(); let j = {}; try { j = await resp.json() } catch (e) {}
    if (LM === "dave") { j.bedrijf = { ...(j.bedrijf || {}), naam: "Glazenwasbedrijf Dave", logo: ((fs.readFileSync("tools/video/crmdemo/demo.js", "utf8").match(/DEMO_LOGO="([^"]+)"/) || [])[1]) || (j.bedrijf || {}).logo };
      j.klant = { ...(j.klant || {}), voornaam: "Marieke", naam: "Jansen, Marieke", adres: "Tolberterstraat 28", postcode: "9351 BA", plaats: "Leek", pcPlaats: "9351 BA Leek" } }
    if (liveAan) { j.volgende = { datum: vandaag, tijd: "11:10", bezig: false, reeks: [] }; j.live = liveObj() }
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(j) });
  });
  const page = await ctx.newPage();
  await page.goto(DEMO || "https://crm.mijnschoonmaker.com/portaal", { waitUntil: "networkidle" });
  await page.waitForSelector(DEMO ? "#tabNav button" : "nav.tabs", { timeout: 30000 }); await wacht(2500);
  const cdp = await ctx.newCDPSession(page); const frames = []; let n = 0;
  cdp.on("Page.screencastFrame", async f => { const p = `out/fr/${String(n++).padStart(5, "0")}.jpg`; fs.writeFileSync(p, Buffer.from(f.data, "base64")); frames.push([p, f.metadata.timestamp]); try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }) } catch (e) {} });
  fs.mkdirSync("out/fr", { recursive: true });
  /* kleine animatie zodat er altijd frames binnenkomen, ook als het scherm stilstaat */
  await page.evaluate(() => { const d = document.createElement("div"); d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;z-index:2147483646"; document.body.appendChild(d); let i = 0; setInterval(() => { d.style.background = i++ % 2 ? "#000" : "#fff" }, 33) });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, maxWidth: 2160, maxHeight: 3840, everyNthFrame: 1 });
  const t0 = Date.now() / 1000; const starts = [];
  /* geen nep-effecten: alleen het element in beeld brengen en (bij tik) echt aantikken, zodat je de eigen animaties van de app ziet */
  const ring = async (sel, klik) => { const el = page.locator(sel).first();
    const ok = await page.evaluate(sel => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 90) window.scrollTo({ top: Math.max(0, r.top + scrollY - innerHeight * .3), behavior: "smooth" }); return true }, sel);
    if (!ok) { console.log("niet gevonden", sel); return } await wacht(450);
    if (klik) { await el.tap({ timeout: 3000 }).catch(() => el.click({ timeout: 3000 }).catch(() => console.log("klik mislukt", sel))); await wacht(250) } };
  await wacht(600);
  const TS = fs.existsSync("out/tstart.json") ? JSON.parse(fs.readFileSync("out/tstart.json")) : null, tA = Date.now() / 1000;
  for (let i = 0; i < T.length; i++) {
    if (TS) { const w = tA + TS[i] - Date.now() / 1000; if (w > 0) await wacht(w * 1000) }
    const s0 = Date.now() / 1000; starts.push(s0 - t0);
    for (const [a, v] of T[i].a) {
      if (a === "wacht") await wacht(v * (+process.env.WACHT || 1));
      else if (a === "top") await page.evaluate(() => window.scrollTo({ top: 0 }));
      else if (a === "scroll") await page.evaluate(y => window.scrollTo({ top: y < 0 ? scrollY + y : y }), v);
      else if (a === "wijs") await ring(v, false);
      else if (a === "portaal") { await page.goto("https://crm.mijnschoonmaker.com/portaal", { waitUntil: "networkidle" }); await page.waitForSelector("nav.tabs", { timeout: 30000 }).catch(() => {}); await wacht(600) }
      else if (a === "crm") { await page.goto(DEMO, { waitUntil: "networkidle" }); await page.waitForSelector("#tabNav button", { timeout: 30000 }).catch(() => {}); await page.evaluate(() => { const b = document.querySelector("[data-act=tab][data-tab=vandaag]"); if (b) b.click() }) }
      else if (a === "live") {
        liveAan = true; const restMs = Math.max(4000, (TS ? (tA + TS[i] + DUUR[i]) : (s0 + DUUR[i])) * 1000 - Date.now() - 600);
        await page.evaluate(() => { try { tab = "home"; laad(true) } catch (e) { location.reload() } });
        await page.waitForSelector("#lvMap .leaflet-marker-icon", { timeout: 15000 }).catch(() => console.log("geen livekaart"));
        await page.evaluate(() => { const e = document.getElementById("lvKaart"); if (e) window.scrollTo({ top: Math.max(0, e.getBoundingClientRect().top + scrollY - 70), behavior: "instant" }) });
        await wacht(500);
        await page.evaluate(([pts, ms]) => { try { lvPeil = async () => {}; clearInterval(LVK.timer) } catch (e) {}
          const K = LVK; if (!K || !K.car) return; K.zelf = true; try { K.map.fitBounds(pts, { padding: [36, 36], animate: false }) } catch (e) {}
          const d = [0]; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; d.push(d[i - 1] + Math.hypot(b[0] - a[0], (b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180))) }
          const tot = d[d.length - 1] || 1, t0 = performance.now(), q = id => document.getElementById(id), rot = () => K.car.getElement() && K.car.getElement().querySelector(".lv-rot");
          const st = t => { const p = Math.min(1, (t - t0) / ms), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, s = e * tot * .985; let k = 1; while (k < d.length - 1 && d[k] < s) k++;
            const a = pts[k - 1], b = pts[k], f = (s - d[k - 1]) / ((d[k] - d[k - 1]) || 1), ll = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
            K.car.setLatLng(ll); if (K.lijn) K.lijn.setLatLngs([ll, D.live.huis]); const br = Math.atan2((b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180), b[0] - a[0]) * 180 / Math.PI; const r = rot(); if (r) r.style.transform = `rotate(${br}deg)`;
            const km = Math.max(.1, Math.round((1 - e) * 1.6 * 10) / 10), L = { ...D.live, voor: p < .35 ? 1 : 0, km }, T = lvTekst(L);
            if (q("lvT")) q("lvT").textContent = T.t; if (q("lvS")) q("lvS").textContent = T.s; if (q("lvE")) q("lvE").textContent = "± " + (p < .35 ? "11:10" : p < .75 ? "11:06" : "11:03");
            if (p < 1) requestAnimationFrame(st) }; requestAnimationFrame(st) }, [RIT.pts, restMs]);
      }
      else if (a === "ga") await page.evaluate(t => { try { const d = document.querySelector("dialog[open]"); if (d && d.id !== "dlg") d.close(); } catch (e) {} const b = document.querySelector(`[data-act=tab][data-tab=${t}]`); if (b) b.click(); window.scrollTo({ top: 0, behavior: "instant" }) }, v)
      else if (a === "sluit") await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => { try { d.close() } catch (e) {} }) })
      else if (a === "scrollnaar") await page.evaluate(sel => { const e = document.querySelector(sel); if (e) window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 90 }) }, v)
      else if (a === "tik") { await ring(v, true); await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })) }
    }
    if (!TS) { const rest = DUUR[i] + Number(process.env.PAUZE || 0.45) - (Date.now() / 1000 - s0); if (rest > 0) await wacht(rest * 1000) }
    else if (i === T.length - 1) { const w = tA + TS[i] + DUUR[i] + 0.6 - Date.now() / 1000; if (w > 0) await wacht(w * 1000) }
  }
  await wacht(1200);
  await cdp.send("Page.stopScreencast"); await wacht(500);
  const tEnd = Date.now() / 1000;
  fs.writeFileSync("out/starts.json", JSON.stringify(starts)); fs.writeFileSync("out/ta.json", JSON.stringify(tA - t0));
  /* frames naar vaste 30 fps via een concat-lijst */
  frames.sort((a, b) => a[1] - b[1]); const base = frames[0][1];
  let lst = ""; for (let i = 0; i < frames.length; i++) { const d = (i + 1 < frames.length ? frames[i + 1][1] : base + (tEnd - t0)) - frames[i][1]; lst += `file '${frames[i][0].replace("out/", "")}'\nduration ${Math.max(0.001, d).toFixed(4)}\n` }
  lst += `file '${frames[frames.length - 1][0].replace("out/", "")}'\n`;
  fs.writeFileSync("out/frames.txt", lst); fs.writeFileSync("out/offset.txt", String((base - (Date.now() / 1000 - (Date.now() / 1000 - t0))) ));
  console.log("frames", frames.length, "starts", starts.map(x => x.toFixed(2)).join(" "), "screencast-begin", base, "t0", t0);
  fs.writeFileSync("out/meta.json", JSON.stringify({ base, t0 }));
  if (token) await db.doc("portaalSessie/" + crypto.createHash("sha256").update(token).digest("hex")).delete();
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
