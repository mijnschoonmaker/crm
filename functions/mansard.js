/* Mansard als platform: een nieuw bedrijf aanmelden (30 dagen gratis), de status van het abonnement lezen.
   Een bedrijf = bedrijven/<id> (naam, eigenaar, status, proefTot, plan) met daaronder al zijn gegevens. */
module.exports = ({ rawDb, T, onCall, HttpsError, nu }) => {
  const PLAN = { naam: "Mansard", prijs: 99, inbegrepen: 3, extraPrijs: 19.95, proefDagen: 30 };
  const emailVan = auth => { const a = auth && auth.token; if (!a || !a.email_verified) throw new HttpsError("unauthenticated", "Bevestig eerst je e-mailadres."); return String(a.email || "").toLowerCase(); };

  const bedrijfAanmaken = onCall(async req => {
    const e = emailVan(req.auth), d = req.data || {};
    const naam = String(d.naam || "").trim().slice(0, 80), tel = String(d.telefoon || "").trim().slice(0, 30), plaats = String(d.plaats || "").trim().slice(0, 60);
    if (naam.length < 2) throw new HttpsError("invalid-argument", "Vul de naam van je bedrijf in.");
    const g = await rawDb.doc("gebruikers/" + e).get();
    if (g.exists) throw new HttpsError("already-exists", "Dit e-mailadres hoort al bij een bedrijf. Log opnieuw in.");
    let bid = T.nieuwBid(); for (let i = 0; i < 5 && (await rawDb.doc("bedrijven/" + bid).get()).exists; i++) bid = T.nieuwBid();
    const proefTot = new Date(Date.now() + PLAN.proefDagen * 864e5).toISOString().slice(0, 10);
    const b = rawDb.batch();
    b.set(rawDb.doc("bedrijven/" + bid), { naam, eigenaar: e, telefoon: tel, plaats, status: "proef", proefTot, plan: PLAN, gebruikers: 1, aangemaakt: nu() });
    b.set(rawDb.doc("gebruikers/" + e), { bedrijf: bid, rol: "eigenaar", naam: String((req.auth.token && req.auth.token.name) || ""), toegevoegd: nu() });
    b.set(rawDb.doc("bedrijven/" + bid + "/instellingen/bedrijf"), { naam, email: e, telefoon: tel, plaats, btw: 21, incl: true, termijn: 14, liveMail: true, portaalKnop: true, aangemaakt: nu() });
    await b.commit();
    try { await rawDb.collection("aanmeldingen").add({ bid, naam, email: e, telefoon: tel, plaats, op: nu() }); } catch (x) {}
    return { bid, proefTot };
  });

  const abonnement = onCall(async req => {
    emailVan(req.auth);
    if (T.isLegacy()) return { status: "eigen", plan: PLAN };
    const s = await rawDb.doc("bedrijven/" + T.bid()).get(), d = s.data() || {};
    const n = (await rawDb.collection("gebruikers").where("bedrijf", "==", T.bid()).get()).size;
    return { status: d.status, proefTot: d.proefTot || "", plan: d.plan || PLAN, gebruikers: n, naam: d.naam };
  });

  return { functies: { bedrijfAanmaken, abonnement }, PLAN };
};
