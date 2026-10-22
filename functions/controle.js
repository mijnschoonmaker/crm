/* Systeemcontrole: elke nacht (en op verzoek) per bedrijf nagaan of de gegevens kloppen.
   Alleen lezen: er wordt niets aangepast. De uitkomst staat in instellingen/systeemcontrole en is in het CRM
   te zien bij Instellingen › Systeemcontrole. Is er iets rood, dan krijgt het bedrijf één mail. */
module.exports = ctx => {
  const { db, onCall, onSchedule, geheim, bedrijf, brevoSend, checkGebruiker, nu } = ctx;
  const isoNL = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(d);
  const r2 = x => Math.round((Number(x) || 0) * 100) / 100;
  const som = f => (f.regels || []).reduce((a, r) => a + (Number(r.aantal) || 0) * (Number(r.prijs) || 0), 0);
  const nrDelen = nr => { const m = String(nr || "").match(/^(.*?)(\d+)$/); return m ? { pre: m[1], n: parseInt(m[2], 10), pad: m[2].length } : null; };

  async function controleer() {
    const [fs, bs, ks, gm, mis, bk, b] = await Promise.all([
      db.collection("facturen").get(), db.collection("beurten").get(), db.collection("klanten").get(),
      db.collection("geplandeMails").where("status", "in", ["gepland", "mislukt"]).get(),
      db.collection("berichten").where("status", "==", "mislukt").get(),
      db.doc("instellingen/backup").get(), bedrijf()]);
    const facturen = fs.docs.map(d => ({ id: d.id, ...d.data() })), fids = new Set(facturen.map(f => f.id));
    const klanten = ks.docs.map(d => ({ id: d.id, ...d.data() })), kids = new Set(klanten.map(k => k.id));
    const beurten = bs.docs.map(d => ({ id: d.id, ...d.data() }));
    const echte = facturen.filter(f => f.soort !== "offerte");
    const vandaag = isoNL(), jaar = vandaag.slice(0, 4), week = new Date(Date.now() - 7 * 864e5).toISOString();
    const C = [];
    const zet = (id, titel, ernst, lijst, uitleg, goed) => C.push({ id, titel, status: lijst.length ? ernst : "groen", aantal: lijst.length,
      uitleg: lijst.length ? uitleg : goed, voorbeelden: lijst.slice(0, 8).map(String) });

    /* factuurnummers */
    const per = {};
    echte.filter(f => f.nummer && f.status !== "concept").forEach(f => (per[f.nummer] = per[f.nummer] || []).push(f));
    const dubbel = Object.entries(per).filter(([, l]) => l.length > 1).map(([n, l]) => `${n} (${l.length}×)`);
    zet("dubbel", "Geen dubbele factuurnummers", "rood", dubbel, "Hetzelfde factuurnummer staat op meer dan één factuur. Dat mag niet voor de Belastingdienst: geef één van de twee een nieuw nummer.", "Elk factuurnummer komt één keer voor.");
    const reeks = {}, pads = {};
    echte.forEach(f => { const d = nrDelen(f.nummer); if (!d || !String(f.datum || "").startsWith(jaar)) return; (reeks[d.pre] = reeks[d.pre] || new Set()).add(d.n); pads[d.pre] = Math.max(pads[d.pre] || 0, d.pad); });
    const gaten = [];
    Object.entries(reeks).forEach(([pre, set]) => { const l = [...set].sort((a, b2) => a - b2); for (let i = 1; i < l.length && gaten.length < 50; i++) for (let n = l[i - 1] + 1; n < l[i] && gaten.length < 50; n++) gaten.push(pre + String(n).padStart(pads[pre], "0")); });
    zet("gaten", "Factuurnummers sluiten aan", "oranje", gaten, "Er ontbreken nummers in de reeks van dit jaar, meestal door een verwijderde conceptfactuur. Kun je het uitleggen, dan is het geen probleem.", "De nummering van dit jaar loopt zonder gaten door.");

    /* facturen */
    zet("betaaldDatum", "Betaalde facturen hebben een betaaldatum", "oranje",
      echte.filter(f => f.status === "betaald" && !f.betaaldOp).map(f => f.nummer || f.id),
      "Deze facturen staan op betaald zonder datum. Ze tellen dan niet goed mee in je overzichten per periode.", "Alle betaalde facturen hebben een datum.");
    zet("leeg", "Geen lege facturen", "oranje",
      echte.filter(f => !["concept", "oninbaar"].includes(f.status) && r2(som(f)) === 0).map(f => f.nummer || f.id),
      "Deze facturen zijn verstuurd of openstaand maar hebben geen bedrag.", "Elke verstuurde factuur heeft een bedrag.");
    zet("zonderKlant", "Openstaande facturen horen bij een klant", "oranje",
      echte.filter(f => f.status === "open" && f.klantId && !kids.has(f.klantId)).map(f => `${f.nummer || f.id} (${f.klantNaam || "onbekend"})`),
      "De klant van deze openstaande facturen bestaat niet meer. Herinneringen en het klantportaal werken dan niet.", "Alle openstaande facturen horen bij een bestaande klant.");

    /* beurten */
    zet("wees", "Gefactureerde beurten hebben een factuur", "rood",
      beurten.filter(x => x.gefactureerd && !["nvt", "periodiek"].includes(x.gefactureerd) && !fids.has(x.gefactureerd)).map(x => `${x.klantNaam || x.klantId} · ${x.datum}`),
      "Deze beurten staan als gefactureerd, maar de factuur bestaat niet. Ze worden dan nooit meer gefactureerd: open de klant en maak de factuur opnieuw.", "Elke gefactureerde beurt hoort bij een bestaande factuur.");
    const grens = isoNL(new Date(Date.now() - 7 * 864e5));
    zet("vergeten", "Geen afspraken vergeten", "oranje",
      klanten.filter(k => k.actief !== false && !k.prospect && k.gepland && k.gepland < grens).map(k => `${String(k.naam || "").split(",").reverse().join(" ").trim()} · ${k.gepland}`),
      "Deze klanten stonden meer dan een week geleden gepland en zijn niet afgemeld of verzet. Meld ze af of plan ze opnieuw in.", "Er staan geen oude afspraken open.");

    /* mail */
    const uur = new Date(Date.now() - 36e5).toISOString();
    const vast = gm.docs.map(d => d.data()).filter(m => m.status === "gepland" && m.sendAt && m.sendAt < uur);
    zet("verzenden", "Ingeplande mails gaan op tijd de deur uit", "rood", vast.map(m => `${m.naar || ""} · ${String(m.sendAt).slice(0, 16).replace("T", " ")}`),
      "Er staan mails klaar die al meer dan een uur verstuurd hadden moeten zijn. De verzendtaak lijkt te haperen.", "Alle ingeplande mails zijn op tijd verstuurd.");
    const misl = [...mis.docs.map(d => d.data()).filter(m => String(m.op || "") >= week), ...gm.docs.map(d => d.data()).filter(m => m.status === "mislukt" && String(m.sendAt || "") >= week)];
    zet("mislukt", "Mails komen aan", "oranje", misl.map(m => `${m.naar || ""}: ${String(m.fout || "").slice(0, 80)}`),
      "Deze mails zijn de afgelopen week niet verstuurd. Controleer het e-mailadres van de klant of stuur ze opnieuw.", "De afgelopen week is geen enkele mail mislukt.");

    /* back-up */
    const laatst = (bk.data() || {}).laatst || "";
    const oud = !laatst || Date.now() - Date.parse(laatst) > 36 * 36e5;
    zet("backup", "Dagelijkse back-up gelukt", "rood", oud ? [laatst ? "Laatste: " + laatst.slice(0, 16).replace("T", " ") : "Nog geen back-up gevonden"] : [],
      "De nachtelijke back-up is langer dan anderhalve dag niet gelukt.", "De back-up van vannacht is gelukt" + (laatst ? " (" + laatst.slice(0, 10) + ")." : "."));

    /* bedrijfsgegevens */
    const mist = [["naam", "Bedrijfsnaam"], ["email", "E-mailadres"], ["iban", "IBAN"], ["btwnr", "Btw-nummer"], ["kvk", "KvK-nummer"]].filter(([k]) => !String(b[k] || "").trim()).map(([, l]) => l);
    zet("bedrijf", "Bedrijfsgegevens compleet", "oranje", mist, "Deze gegevens ontbreken bij Instellingen › Bedrijf & Branding. Ze horen op elke factuur.", "Alle verplichte gegevens voor je facturen zijn ingevuld.");

    const status = C.some(c => c.status === "rood") ? "rood" : C.some(c => c.status === "oranje") ? "oranje" : "groen";
    return { op: nu(), status, checks: C, telling: { facturen: echte.length, klanten: klanten.length, beurten: beurten.length } };
  }

  async function bewaarEnMeld(uit) {
    const ref = db.doc("instellingen/systeemcontrole"), oud = (await ref.get()).data() || {};
    let mailOp = oud.mailOp || "";
    if (uit.status === "rood" && (!mailOp || Date.now() - Date.parse(mailOp) > 3 * 864e5 || oud.status !== "rood")) {
      try {
        const [g, b] = await Promise.all([geheim(), bedrijf()]);
        if (g.brevoKey && b.email) {
          const rood = uit.checks.filter(c => c.status === "rood");
          const tekst = "Bij de nachtelijke systeemcontrole van Mansard is iets gevonden dat aandacht nodig heeft:\n\n" +
            rood.map(c => `• ${c.titel}: ${c.uitleg}\n  ${c.voorbeelden.slice(0, 3).join("; ")}`).join("\n\n") +
            "\n\nAlle details staan in het CRM bij Instellingen › Systeemcontrole.";
          await brevoSend(g.brevoKey, { sender: { name: "Mansard", email: g.afzender || b.email }, to: [{ email: b.email }], subject: "Systeemcontrole: " + rood.length + " punt" + (rood.length === 1 ? "" : "en") + " om naar te kijken",
            textContent: tekst, htmlContent: "<p>" + tekst.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>") + "</p>", tags: ["systeemcontrole"] });
          mailOp = nu();
        }
      } catch (e) { console.error("systeemcontrole mail", e); }
    }
    await ref.set({ ...uit, mailOp });
    return uit;
  }

  const systeemControle = onSchedule({ schedule: "40 4 * * *", timeZone: "Europe/Amsterdam", memory: "512MiB", timeoutSeconds: 300 }, async () => {
    await bewaarEnMeld(await controleer());
  });
  const controleNu = onCall({ memory: "512MiB", timeoutSeconds: 120 }, async req => {
    await checkGebruiker(req.auth);
    return bewaarEnMeld(await controleer());
  });
  return { systeemControle, controleNu, controleer };
};
