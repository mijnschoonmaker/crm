/* Alleen lezen: komen de factuurmails aan? Telt per dag de verstuurde factuurmails met hun Brevo-status, en controleert
   de DNS (SPF, DKIM, DMARC) van het afzenderdomein. Wijzigt niets; toont geen e-mailadressen van klanten. */
const admin = require("../functions/node_modules/firebase-admin");
const dns = require("dns").promises;
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const n = (...a) => { const t = a.join(" "); console.log("::notice title=Mail::" + t); };
(async () => {
  const g = (await db.doc("geheim/config").get()).data() || {}, b = (await db.doc("instellingen/bedrijf").get()).data() || {};
  const afz = String(g.afzender || b.email || ""), dom = afz.split("@")[1] || "";
  n("Afzenderdomein:", dom || "?", "· antwoordadres-domein:", String(b.email || "").split("@")[1] || "?");
  const sinds = new Date(Date.now() - 8 * 864e5).toISOString();
  const q = await db.collection("berichten").where("op", ">=", sinds).get();
  const ms = q.docs.map(d => d.data()).filter(m => m.kanaal === "email");
  const groep = {};
  for (const m of ms) { const s = String(m.sjabloon || "?"), d = String(m.op || m.verstuurdOp || "").slice(0, 10), k = s + " " + d;
    const x = groep[k] = groep[k] || { n: 0, bezorgd: 0, gelezen: 0, geklikt: 0, bounce: 0, spam: 0, geblokkeerd: 0, uitgesteld: 0, mislukt: 0 };
    x.n++; if (m.bezorgdOp) x.bezorgd++; if (m.gelezenOp) x.gelezen++; if (m.geklikOp) x.geklikt++; if (m.bouncedOp) x.bounce++; if (m.spamOp) x.spam++; if (m.geblokkeerdOp) x.geblokkeerd++; if (m.uitgesteldOp && !m.bezorgdOp) x.uitgesteld++; if (m.status === "mislukt") x.mislukt++; }
  Object.keys(groep).sort().forEach(k => { const x = groep[k]; n(k + ":", x.n, "verstuurd ·", x.bezorgd, "bezorgd ·", x.gelezen, "geopend ·", x.geklikt, "geklikt ·", x.bounce, "bounce ·", x.spam, "spam-klacht ·", x.geblokkeerd, "geblokkeerd ·", x.uitgesteld, "uitgesteld ·", x.mislukt, "mislukt"); });
  const br = ms.filter(m => m.bouncedOp).slice(0, 8).map(m => m.bounceReden || "?"); if (br.length) n("Bounce-redenen:", br.join(" | ").slice(0, 900));
  /* betaald per factuurdag */
  const fq = await db.collection("facturen").where("datum", ">=", sinds.slice(0, 10)).get();
  const per = {}; fq.docs.map(d => d.data()).filter(f => f.soort !== "offerte" && f.status !== "concept").forEach(f => { const x = per[f.datum] = per[f.datum] || { n: 0, betaald: 0, incasso: 0, verstuurd: 0 }; x.n++; if (f.status === "betaald") x.betaald++; if (f.incasso) x.incasso++; if (f.verstuurdOp) x.verstuurd++; });
  Object.keys(per).sort().forEach(d => { const x = per[d]; n("Facturen " + d + ":", x.n, "· verstuurd", x.verstuurd, "· betaald", x.betaald, "· incasso", x.incasso); });
  if (dom) {
    const txt = async h => { try { return (await dns.resolveTxt(h)).map(r => r.join("")); } catch (e) { return []; } };
    const spf = (await txt(dom)).filter(t => /^v=spf1/i.test(t)), dmarc = (await txt("_dmarc." + dom)).filter(t => /^v=DMARC1/i.test(t));
    const dk = [...await txt("mail._domainkey." + dom), ...await txt("brevo1._domainkey." + dom), ...await txt("brevo2._domainkey." + dom)];
    let dkc = []; for (const s of ["brevo1._domainkey.", "brevo2._domainkey."]) { try { dkc = dkc.concat(await dns.resolveCname(s + dom)); } catch (e) {} }
    const code = (await txt(dom)).filter(t => /brevo-code/i.test(t));
    n("SPF:", spf.join(" ") || "GEEN", "· Brevo in SPF:", spf.some(t => /sendinblue|brevo/i.test(t)) ? "ja" : "nee");
    n("DKIM Brevo:", dk.length || dkc.length ? "aanwezig" : "NIET gevonden", "· DMARC:", dmarc.join(" ") || "GEEN", "· brevo-code:", code.length ? "ja" : "nee");
  }
})().catch(x => { console.error(x.message); process.exit(1); });
