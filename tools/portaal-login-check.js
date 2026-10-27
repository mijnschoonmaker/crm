/* Alleen lezen: waarom komt er geen inlogmail voor het klantportaal? Telt klanten met dit e-mailadres,
   recente inloglinks en of de mailsleutel is ingesteld. Vraagt bij Brevo de afleverstatus op (de sleutel blijft op de server). Toont geen namen of sleutels. Wijzigt niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const crypto = require("crypto");
const sha = s => crypto.createHash("sha256").update(String(s)).digest("hex");
(async () => {
  const e = String(process.env.EMAIL || "").trim().toLowerCase();
  const uit = [];
  const ks = (await db.collection("klanten").select("email", "fEmail", "pEmail", "oEmail", "actief", "prospect", "hoofdKlantId").get()).docs;
  const match = ks.filter(d => { const x = d.data(); return [x.email, x.fEmail, x.pEmail, x.oEmail].some(m => String(m || "").toLowerCase().split(/[;,\s]+/).includes(e)); });
  uit.push("klanten met dit adres: " + match.length + " (waarvan hoofdklant: " + match.filter(d => !d.data().hoofdKlantId).length + ") " + JSON.stringify(match.map(d => ({ actief: d.data().actief !== false, prospect: !!d.data().prospect, veld: ["email", "fEmail", "pEmail", "oEmail"].filter(f => String(d.data()[f] || "").toLowerCase().split(/[;,\s]+/).includes(e)) }))));
  const sinds = Date.now() - 6 * 3600e3;
  const lg = (await db.collection("portaalLogin").where("email", "==", e).get()).docs.map(d => d.data()).filter(x => (x.exp || 0) > sinds - 30 * 24 * 3600e3);
  uit.push("inloglinks voor dit adres (laatste tijd): " + lg.length + (lg.length ? " · nieuwste aangemaakt " + lg.map(x => x.op).sort().pop() : ""));
  const g = (await db.doc("geheim/config").get()).data() || {};
  uit.push("Brevo-sleutel ingesteld: " + !!g.brevoKey + " · afzender ingesteld: " + !!g.afzender);
  if (g.brevoKey) {
    try {
      const r = await fetch("https://api.brevo.com/v3/smtp/statistics/events?limit=15&days=2&email=" + encodeURIComponent(e), { headers: { "api-key": g.brevoKey, accept: "application/json" } });
      const j = await r.json();
      const ev = (j.events || []).map(x => (x.date || "").slice(0, 19) + " " + x.event + (x.subject ? " · " + String(x.subject).slice(0, 40) : "") + (x.reason ? " · " + String(x.reason).slice(0, 80) : ""));
      uit.push("Brevo (status " + r.status + ") gebeurtenissen laatste 2 dagen: " + (ev.length ? ev.join(" | ") : "geen"));
      const a = await (await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": g.brevoKey, accept: "application/json" } })).json();
      uit.push("Brevo-account: " + JSON.stringify((a.plan || []).map(p => ({ type: p.type, credits: p.credits, creditsType: p.creditsType, eind: p.endDate }))) + " · relay: " + JSON.stringify(a.relay ? { enabled: a.relay.enabled } : null));
    } catch (x) { uit.push("Brevo opvragen mislukt: " + x.message); }
  }
  const lim = (await db.doc("limiet/p" + sha("em" + e).slice(0, 40)).get()).data();
  uit.push("aanvragen-teller dit adres: " + (lim ? lim.n + " sinds " + new Date(lim.t).toISOString() : "geen"));
  uit.forEach((t, i) => console.log("::notice title=Portaal " + (i + 1) + "::" + t));
})().catch(x => { console.error(x); process.exit(1); });
