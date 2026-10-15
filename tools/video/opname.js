/* Neemt het klantportaal van Ashley op als telefoonscherm (1080x1920), op het tempo van de ingesproken tekst. */
const fs = require("fs"), crypto = require("crypto");
const NM = "/home/runner/work/_v/node_modules/";
const admin = require(NM + "firebase-admin"), { chromium } = require(NM + "playwright");
if (!process.env.URL) admin.initializeApp(); const db = process.env.URL ? null : admin.firestore();
const T = JSON.parse(fs.readFileSync(process.env.TEKST || "tools/video/tekst.json")), DUUR = JSON.parse(fs.readFileSync("out/duur.json"));
const wacht = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const DEMO = process.env.URL; let token = "";
  if (!DEMO) {
  const ks = await db.collection("klanten").get();
  const ash = ks.docs.find(d => /buytendorp/i.test(String(d.data().naam || "")));
  token = crypto.randomBytes(32).toString("hex");
  await db.doc("portaalSessie/" + crypto.createHash("sha256").update(token).digest("hex")).set({ klantId: ash.id, email: ash.data().email || "", exp: Date.now() + 3600e3, gezien: Date.now(), op: new Date().toISOString(), ua: "video" });
  }
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, locale: "nl-NL", timezoneId: "Europe/Amsterdam",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
  await ctx.addInitScript(t => { try { localStorage.setItem("ms.portaal.s", t) } catch (e) {} }, token);
  await ctx.addInitScript(() => { window.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style");
    s.textContent = `.__tap{position:fixed;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(19,122,138,.9);box-shadow:0 4px 18px rgba(0,0,0,.25);pointer-events:none;z-index:2147483647;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .5s}html{scroll-behavior:smooth}`;
    document.head.appendChild(s) }) });
  const page = await ctx.newPage();
  await page.goto(DEMO || "https://crm.mijnschoonmaker.com/portaal", { waitUntil: "networkidle" });
  await page.waitForSelector(DEMO ? "#tabNav button" : "nav.tabs", { timeout: 30000 }); await wacht(2500);
  const cdp = await ctx.newCDPSession(page); const frames = []; let n = 0;
  cdp.on("Page.screencastFrame", async f => { const p = `out/fr/${String(n++).padStart(5, "0")}.jpg`; fs.writeFileSync(p, Buffer.from(f.data, "base64")); frames.push([p, f.metadata.timestamp]); try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }) } catch (e) {} });
  fs.mkdirSync("out/fr", { recursive: true });
  /* kleine animatie zodat er altijd frames binnenkomen, ook als het scherm stilstaat */
  await page.evaluate(() => { const d = document.createElement("div"); d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;z-index:2147483646"; document.body.appendChild(d); let i = 0; setInterval(() => { d.style.background = i++ % 2 ? "#000" : "#fff" }, 33) });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  const t0 = Date.now() / 1000; const starts = [];
  const ring = async (sel, klik) => { const el = page.locator(sel).first(); try { await el.scrollIntoViewIfNeeded({ timeout: 2000 }) } catch (e) {} const bx = await el.boundingBox({ timeout: 2500 }).catch(() => null); if (!bx) { console.log("niet gevonden", sel); return }
    const x = bx.x + bx.width / 2, y = bx.y + Math.min(bx.height / 2, 60);
    await page.evaluate(([x, y]) => { const d = document.createElement("div"); d.className = "__tap"; d.style.left = x + "px"; d.style.top = y + "px"; d.style.transform = "scale(.4)"; d.style.opacity = "0"; document.body.appendChild(d);
      requestAnimationFrame(() => { d.style.transform = "scale(1)"; d.style.opacity = "1" }); setTimeout(() => { d.style.transform = "scale(.8)" }, 380); setTimeout(() => { d.style.opacity = "0"; d.style.transform = "scale(1.3)" }, 900); setTimeout(() => d.remove(), 1500) }, [x, y]);
    await wacht(420); if (klik) await el.click({ timeout: 3000 }).catch(() => console.log("klik mislukt", sel)); await wacht(300) };
  await wacht(600);
  for (let i = 0; i < T.length; i++) {
    const s0 = Date.now() / 1000; starts.push(s0 - t0);
    for (const [a, v] of T[i].a) {
      if (a === "wacht") await wacht(v);
      else if (a === "top") await page.evaluate(() => window.scrollTo({ top: 0 }));
      else if (a === "scroll") await page.evaluate(y => window.scrollTo({ top: y < 0 ? scrollY + y : y }), v);
      else if (a === "wijs") await ring(v, false);
      else if (a === "ga") await page.evaluate(t => { try { const d = document.querySelector("dialog[open]"); if (d && d.id !== "dlg") d.close(); } catch (e) {} const b = document.querySelector(`[data-act=tab][data-tab=${t}]`); if (b) b.click(); window.scrollTo({ top: 0, behavior: "instant" }) }, v)
      else if (a === "sluit") await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => { try { d.close() } catch (e) {} }) })
      else if (a === "scrollnaar") await page.evaluate(sel => { const e = document.querySelector(sel); if (e) window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 90 }) }, v)
      else if (a === "tik") { await ring(v, true); await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })) }
    }
    const rest = DUUR[i] + Number(process.env.PAUZE || 0.45) - (Date.now() / 1000 - s0); if (rest > 0) await wacht(rest * 1000);
  }
  await wacht(1200);
  await cdp.send("Page.stopScreencast"); await wacht(500);
  const tEnd = Date.now() / 1000;
  fs.writeFileSync("out/starts.json", JSON.stringify(starts));
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
