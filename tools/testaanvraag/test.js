/* Eenmalige testaanmelding via de echte webshop (zoals een klant), op verzoek van de eigenaar. */
const { chromium, devices } = require("playwright");
const D = __dirname + "/";
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(devices["iPhone 13"]); const p = await ctx.newPage();
  p.on("pageerror", e => console.log("ERR", e.message));
  let api = null; p.on("response", r => { if (/\/api\/aanvraag/.test(r.url())) api = r.status(); });
  await p.goto("https://app.mansard.nl/webshop/mijnschoonmaker-test.html", { waitUntil: "networkidle" });
  await p.click("#cfgKnop"); await p.waitForTimeout(600); await p.click(".k-part"); await p.waitForTimeout(600);
  await p.click("#adrQ"); await p.type("#adrQ", "9861CD 7", { delay: 60 }); await p.waitForSelector("#adrSug button", { timeout: 15000 }); await p.waitForTimeout(800);
  await p.click("#adrSug button"); await p.waitForTimeout(3000);
  await p.setInputFiles("#ph-in", [D + "foto1.jpg", D + "foto2.jpg"]); await p.waitForTimeout(3000);
  await p.click("#cfgKnop"); await p.waitForTimeout(1200);
  const tik = async (t, pts) => { await p.click(`#ed-types [data-t="${t}"]`); await p.waitForTimeout(200); const r = await p.evaluate(() => { const e = document.getElementById("ed-wrap").getBoundingClientRect(); return [e.x, e.y, e.width, e.height]; }); for (const [x, y] of pts) { await p.mouse.click(r[0] + r[2] * x, r[1] + r[3] * y); await p.waitForTimeout(150); } };
  await tik("f1", [[.3, .4], [.45, .4]]); await tik("s-tuimel", [[.75, .45]]); await p.click("#ed-done"); await p.waitForTimeout(1500);
  await tik("f0", [[.5, .6]]); await p.click("#ed-done"); await p.waitForTimeout(2000);
  const prijs = await p.evaluate(() => document.getElementById("cfgP").textContent);
  const tel = await p.evaluate(() => JSON.stringify({ floors, special, freq: document.getElementById("freq").value }));
  await p.click("#cfgKnop"); await p.waitForTimeout(1500);
  await p.fill("#k-naam", "TEST Robin – testaanmelding webshop (mag weg)");
  await p.fill("#k-email", "robin@mijnschoonmaker.com");
  await p.fill("#k-opm", "Testaanmelding via de webshop, gemaakt om te controleren of alles goed in het CRM komt. Mag verwijderd worden.");
  const adres = await p.evaluate(() => [document.getElementById("k-adres").value, document.getElementById("k-pc").value, document.getElementById("k-plaats").value].join(" | "));
  await p.evaluate(() => document.getElementById("indienen").scrollIntoView());
  await p.click("#indienen"); await p.waitForTimeout(8000);
  const msg = await p.evaluate(() => (document.querySelector(".say,#say,.msg") || {}).textContent || document.getElementById("indienen").textContent);
  console.log("::notice title=Testaanmelding::prijs " + prijs + " · telling " + tel + " · adres " + adres + " · server " + api + " · melding: " + msg);
  await b.close(); if (api !== 200) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
