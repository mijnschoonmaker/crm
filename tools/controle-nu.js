/* Systeemcontrole met de hand draaien (workflow "Systeemcontrole nu") voor het eerste bedrijf.
   Schrijft de uitkomst naar instellingen/systeemcontrole, net als de nachtelijke taak, maar stuurt geen mail.
   In het logboek staan alleen de titels en aantallen, geen klantgegevens. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const C = require("../functions/controle.js")({ db, onCall: (o, f) => f, onSchedule: (o, f) => f, geheim: async () => ({}),
  bedrijf: async () => (await db.doc("instellingen/bedrijf").get()).data() || {}, brevoSend: async () => "", checkGebruiker: async () => 1, nu: () => new Date().toISOString() });
(async () => {
  const u = await C.controleer();
  const oud = (await db.doc("instellingen/systeemcontrole").get()).data() || {};
  await db.doc("instellingen/systeemcontrole").set({ ...u, mailOp: oud.mailOp || "" });
  const t = [`## Systeemcontrole: ${u.status}`, "", "| Status | Controle | Aantal |", "|---|---|---|", ...u.checks.map(c => `| ${{ groen: "🟢", oranje: "🟠", rood: "🔴" }[c.status]} | ${c.titel} | ${c.aantal} |`)].join("\n");
  console.log(t); if (process.env.GITHUB_STEP_SUMMARY) require("fs").appendFileSync(process.env.GITHUB_STEP_SUMMARY, t + "\n");
})().catch(e => { console.error(e); process.exit(1); });
