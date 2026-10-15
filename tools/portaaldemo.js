/* Demo-gegevens voor het klantportaal van Ashley Buytendorp (testklant), voor een schermvideo.
   Opnieuw draaien mag: eerst wordt alles met test:"portaaldemo" en de bestaande facturen/bezoeken/tickets van Ashley weggehaald. */
const admin = require("/home/runner/work/_temp_fn/node_modules/firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const id = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const TAG = "portaaldemo";
const addD = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
(async () => {
  const ks = await db.collection("klanten").get();
  const ash = ks.docs.find(d => /buytendorp/i.test(String(d.data().naam || "")) && /ashley/i.test(String(d.data().naam || "") + String(d.data().contact || "")));
  if (!ash) throw new Error("Ashley niet gevonden");
  const K = ash.data(), kid = ash.id;
  console.log("Klant:", kid, K.naam, K.email);
  const weg = async (q, wat) => { const s = await q.get(); for (const d of s.docs) await d.ref.delete(); console.log("verwijderd", wat, s.size); };
  /* oude demo en bestaande testgegevens van Ashley opruimen */
  for (const c of ["klanten", "beurten", "facturen", "tickets", "ticketBerichten"]) await weg(db.collection(c).where("test", "==", TAG), c + " (demo)");
  await weg(db.collection("beurten").where("klantId", "==", kid), "bezoeken Ashley");
  await weg(db.collection("facturen").where("klantId", "==", kid), "facturen Ashley");
  await weg(db.collection("ticketBerichten").where("klantId", "==", kid), "ticketberichten Ashley");
  await weg(db.collection("tickets").where("klantId", "==", kid), "tickets Ashley");
  await weg(db.collection("portaalVerzoeken").where("klantId", "==", kid), "verzoeken Ashley");
  await weg(db.collection("klanten").where("aanbevolenDoor", "==", kid), "aanbevolen klanten");

  /* bezoeken elke 8 weken, net geweest op 14 oktober */
  const data = ["2026-01-07", "2026-03-04", "2026-04-29", "2026-06-24", "2026-08-19", "2026-10-14"];
  const tijden = ["10:05", "11:20", "09:40", "10:55", "11:10", "11:05"];
  const nu = new Date().toISOString();
  for (let i = 0; i < data.length; i++) {
    const d = data[i], laatste = i === data.length - 1, fid = id("f"), bid = id("b"), nr = "2026-D" + String(i + 1).padStart(2, "0");
    const betaald = !laatste, bop = betaald ? addD(d, [2, 1, 4, 0, 3][i] ?? 2) : "";
    await db.doc("facturen/" + fid).set({ test: TAG, soort: "factuur", nummer: nr, klantId: kid, klantNaam: K.naam || "", klantAdres: [K.adres, [K.postcode, K.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", "), klantEmail: K.email || "",
      datum: d, verval: addD(d, 14), regels: [{ omschrijving: "Glasbewassing " + d.split("-").reverse().join("-"), aantal: 1, prijs: 68 }], btw: 21, incl: true,
      status: betaald ? "betaald" : "open", betaaldOp: bop, betaalwijze: betaald ? "overmaken" : "", verstuurdOp: d, notitie: "", gemaakt: d + "T15:00:00.000Z" });
    await db.doc("beurten/" + bid).set({ test: TAG, klantId: kid, klantNaam: K.naam || "", datum: d, bedrag: 68, betaald, gefactureerd: fid, dienst: "Glasbewassing", tijd: tijden[i], duur: 35, gemeten: true,
      op: d + "T" + tijden[i] + ":00.000Z", ...(laatste ? {} : { beoordeling: { sterren: 5, op: addD(d, 1) } }) });
  }
  /* aanbevelingen: 1 beloond, 1 eerste afspraak gepland, 1 aangemeld (nog geen akkoord) */
  const ab = [
    { naam: "TEST Klaas de Vries", contact: "Klaas de Vries", aanbevelingBeloond: true, aangemaakt: "2026-09-02" },
    { naam: "TEST Sanne Jansen", contact: "Sanne Jansen", aangemaakt: "2026-10-06" },
    { naam: "TEST Pieter Bos", contact: "Pieter Bos", prospect: true, akkoord: false, aangemaakt: "2026-10-12" }];
  let klaasId = "";
  for (const a of ab) { const nid = id("k"); if (!klaasId) klaasId = nid;
    await db.doc("klanten/" + nid).set({ test: TAG, soort: "particulier", plaats: "Grootegast", actief: true, aanbevolenDoor: kid, dienst: "Glasbewassing", prijs: 68, frequentie: 52, laatst: "2026-10-01", gepland: "", ...a }); }
  /* tickets: één opgelost, één lopend met antwoord */
  const tel = db.doc("tellers/tickets");
  const nr = async () => db.runTransaction(async t => { const s = await t.get(tel); const v = (s.exists ? s.data().n : 1000) + 1; t.set(tel, { n: v }); return "T-" + v; });
  const adres = [K.adres, K.plaats].filter(Boolean).join(", ");
  const tk = async (o, berichten) => { const tid = id("tk"), last = berichten[berichten.length - 1];
    await db.doc("tickets/" + tid).set({ test: TAG, klantId: kid, klantNaam: K.naam || "", adres, nummer: await nr(), bron: "portaal", aangemaakt: berichten[0].op, laatst: last.op, laatsteTekst: last.tekst, laatsteVan: last.van, ongelezenTeam: 0, ongelezenKlant: 0, gezienKlant: last.op, gezienTeam: last.op, ...o });
    for (const b of berichten) await db.doc("ticketBerichten/" + id("tb")).set({ test: TAG, ticketId: tid, klantId: kid, foto: "", ...b, ...(b.van === "team" ? { door: "robin@mijnschoonmaker.com", doorNaam: "Robin" } : {}) }); };
  await tk({ onderwerp: "Strepen op het keukenraam", categorie: "kwaliteit", status: "opgelost", opgelostOp: "2026-08-21T09:12:00.000Z" }, [
    { van: "klant", tekst: "Goedemorgen, op het keukenraam aan de achterkant zitten nog wat strepen. Kunnen jullie daar nog even naar kijken?", op: "2026-08-20T08:14:00.000Z" },
    { van: "team", tekst: "Goedemorgen Ashley, vervelend! We komen morgen langs en nemen het keukenraam opnieuw mee, uiteraard kosteloos.", op: "2026-08-20T08:41:00.000Z" },
    { van: "team", tekst: "Het keukenraam is opnieuw gedaan. Bedankt voor het melden!", op: "2026-08-21T09:12:00.000Z" }]);
  await tk({ onderwerp: "Dakgoot ook meenemen?", categorie: "planning", status: "open", ongelezenKlant: 1, gezienKlant: "2026-10-14T17:32:00.000Z" }, [
    { van: "klant", tekst: "Hoi, kunnen jullie bij de volgende beurt ook de dakgoot schoonmaken? Wat kost dat?", op: "2026-10-14T17:32:00.000Z" },
    { van: "team", tekst: "Hoi Ashley, dat kan zeker! Dakgoot reinigen kost € 45. Zullen we het bij de volgende beurt op 9 december meenemen?", op: "2026-10-14T18:05:00.000Z" }]);
  /* klant zelf: vaste prijs, net geweest, over 8 weken weer */
  await ash.ref.set({ prijs: 68, frequentie: 8, dienst: "Glasbewassing", laatst: "2026-10-14", gepland: "2026-12-09", tijd: "11:10", reeks: [], bezig: "", actief: true, prospect: false, akkoord: true, eersteKeer: false,
    aangemaakt: K.aangemaakt && K.aangemaakt < "2026-01-01" ? K.aangemaakt : "2025-12-01",
    tegoed: [{ id: id("tg"), bedrag: 15, reden: "Korting klantaanbeveling (Klaas)", van: klaasId, op: "2026-10-01" }] }, { merge: true });
  console.log("klaar");
})().catch(e => { console.error(e); process.exit(1); });
