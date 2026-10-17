# Overdracht: mijnschoonmaker CRM

Dit document is voor een ontwikkelaar (of een AI-hulpmiddel) die het CRM overneemt.
Alles wat nodig is om het CRM te begrijpen, aan te passen, online te zetten en
terug te zetten staat hier.

Eigenaar: robin@mijnschoonmaker.com

---

## 1. Wat het is

Een eigen CRM voor een glasbewassingsbedrijf. Het bestaat uit vier delen, die allemaal
op **één Firebase-project van de eigenaar** draaien (regio `europe-west4`, Nederland):

| Onderdeel | Adres | Wie gebruikt het |
|---|---|---|
| CRM (de app) | `crm.mijnschoonmaker.com` | eigenaar en medewerkers |
| Klantportaal | `crm.mijnschoonmaker.com/portaal` | klanten, inloggen met een link per e-mail |
| Bewonersbord (VvE) | `/bord/<token>` | bewoners, via QR-code in de hal |
| Akkoord op offerte | `/akkoord/<id>` | klant opent link uit de offertemail |

De publieke website (mijnschoonmaker.com) staat in Framer. Het CRM maakt die website
als één codecomponent (Instellingen › Website › "Website voor Framer downloaden").

Het CRM is **niet afhankelijk van Claude of Anthropic** om te draaien. Claude heeft
alleen de code geschreven. Het enige optionele onderdeel dat een AI-dienst gebruikt,
is "ramen tellen met AI" (een Anthropic API-sleutel in `/geheim/config`). Zonder die
sleutel valt het terug op herkenning in de browser.

## 2. Techniek

- **Frontend:** gewone JavaScript, geen framework, geen bundler.
  `src/*.js` worden in **alfabetische volgorde** achter elkaar in één `<script>` gezet.
  Een bestand dat iets van een ander bestand nodig heeft bij het laden, moet dus later
  in de naam sorteren (bijvoorbeeld `19-werk.js` na `19-instellingen.js`).
- **Opbouw:** `python3 build_live.py` maakt `public/index.html` uit `src/` en `shim.js`.
  `src/build.py` maakt een losse testversie zonder Firebase (voor lokaal proberen).
- **shim.js:** de koppeling met Firebase (inloggen, database, opslag, downloads,
  tweestapsverificatie). Biedt `window.claude.use("db"|"assets"|"downloads"|"user")`.
- **Klantportaal:** één bestand, `public/portaal.html` (HTML + CSS + JS). Praat alleen met
  de server via `/api/portaal/*`, nooit rechtstreeks met de database.
- **Server:** Firebase Functions (Node 22) in `functions/`:
  - `index.js`: mail (Brevo), Mollie (betaallinks, incasso, webhook), aanvragen van de
    website, ingeplande mails, bestanden (`/_blob/<id>`), PDF's, akkoord op offertes
  - `portaal.js`: alle routes van het klantportaal en tickets
  - `beveiliging.js`: tweestapsverificatie en back-ups
  - `overzicht.js`: PDF van het bestellingsoverzicht
- **Database:** Firestore. Platte collecties: `klanten`, `beurten`, `facturen`, `routes`,
  `instellingen`, `berichten`, `kosten`, `aanvragen`, `geplandeMails`, `akkoord`,
  `portaalVerzoeken`, `tickets`, `ticketBerichten`, `tellers`, `live`, `gebruikers`,
  `mfa`, `geheim`.
  Let op: Firestore kent geen arrays in arrays. `shim.js` pakt die in als `{__arr: …}`.
- **Bestanden:** Firebase Storage, map `assets/<id>`. Lezen gaat via de functie `blob`
  (`/_blob/<id>`), uploaden vanuit het CRM.

## 3. Sleutels en geheimen

Nooit in de code en nooit in een chat. Ze staan op twee plekken:

1. **Firestore `/geheim/config`**: Brevo, Mollie, (optioneel) Anthropic. De eigenaar vult
   ze in via het CRM (Instellingen). De Firestore-regels verbieden lezen vanuit de browser;
   alleen de server leest ze.
2. **GitHub** (Settings › Secrets and variables › Actions):
   - secret `FIREBASE_SERVICE_ACCOUNT`: JSON-sleutel van een service-account met de rol Eigenaar
   - variable `FIREBASE_PROJECT`: de project-ID

## 4. Online zetten

Elke push naar `main` gaat automatisch online via `.github/workflows/deploy.yml`
("Online zetten"): functions, Firestore-/Storage-regels en hosting. Dezelfde workflow
zet ook de dagelijkse Google-back-up aan en toont de regio van de database.

Zelf doen (zonder GitHub):
```
cd functions && npm install && cd ..
python3 build_live.py
npx firebase-tools deploy --project <project-id>
```

## 5. Beveiliging

- **Toegang tot het CRM:** inloggen met e-mail + wachtwoord (Firebase Auth), e-mailadres
  moet bevestigd zijn, en het adres moet in `/gebruikers` staan (of de eigenaar zijn).
  Dit wordt **op de server** gecontroleerd in `firestore.rules`, `storage.rules` en
  `checkGebruiker()` in `functions/index.js`.
- **Tweestapsverificatie** (Instellingen › Beveiliging & back-ups): een code uit een
  authenticator-app (TOTP). Afgedwongen op de server: na een geldige code krijgt de
  inlogsessie (`auth_time`) een vinkje in de custom claim `mfa`. Een nieuwe inlog (ander
  apparaat, gestolen wachtwoord) heeft een andere `auth_time` en dus geen vinkje.
  - Telefoon kwijt: inloggen met een van de 8 herstelcodes.
  - Medewerker telefoon kwijt: de eigenaar reset het in het CRM.
  - Eigenaar telefoon én herstelcodes kwijt: in de Firebase-console het document
    `mfa/robin@mijnschoonmaker.com` verwijderen (of `aan` op `false` zetten) en opnieuw instellen.
- **Klantportaal:** inloggen met een eenmalige link per e-mail, daarna een sessie-token.
  Klanten zien alleen hun eigen gegevens. Valt bewust niet onder tweestapsverificatie.
- **Mollie:** betalingen en incasso alleen via de server. Er wordt nooit vooraf
  afgeschreven: pas als de factuur na een uitgevoerde beurt wordt verstuurd.

## 6. Back-ups en terugzetten

Er zijn twee soorten back-ups, los van elkaar:

1. **Eigen nachtelijke back-up** (functie `dagBackup`, elke nacht 03:15): alle collecties
   behalve `geheim` als één JSON-bestand (gzip) in Storage `backups/JJJJ-MM-DD.json.gz`,
   35 dagen bewaard. In het CRM te downloaden (Instellingen › Beveiliging & back-ups).
2. **Firestore-back-up van Google** (ingesteld door de workflow): dagelijks, 14 dagen bewaard.
   Terugzetten in de Google Cloud-console › Firestore › Disaster recovery, of met
   `gcloud firestore databases restore`.

Een eigen back-up terugzetten:
```
cd functions && npm install && cd ..
GOOGLE_APPLICATION_CREDENTIALS=service-account.json node tools/herstel-backup.js backup-2026-10-18.json.gz            # proefdraai
GOOGLE_APPLICATION_CREDENTIALS=service-account.json node tools/herstel-backup.js backup-2026-10-18.json.gz klanten --echt
```
Foto's en PDF's (`assets/`) zitten niet in de JSON; die staan in Storage. Controleer in de
Google Cloud-console › Cloud Storage › bucket › Protection dat "soft delete" aanstaat
(Google bewaart verwijderde bestanden dan nog een tijd, standaard 7 dagen).

## 7. Waar wat staat (CRM, `src/`)

| Bestand | Wat |
|---|---|
| `01-core.js` | staat, iconen, hulpjes, opslaan (`save`) |
| `02-logic.js` | berekeningen, facturen, herinneringen, mailvariabelen |
| `03-actions.js` | acties (beurt afmelden, factureren, …) |
| `10-vandaag.js` | scherm Vandaag |
| `11-route*.js` | route plannen, kaart, slepen |
| `12-*.js` | planning, kaart, zoeken, reeksen, weekplan |
| `13-klanten.js`, `25-klantkaart.js` | klanten en klantkaart |
| `14-communicatie.js` | mails en sjablonen (opmaak in `emailHtmlRuw`) |
| `15-facturen.js`, `21-factuurpdf.js`, `27-factuur.js` | facturen en PDF |
| `16-boekhoud*.js` | boekhouding en export |
| `17-calculator.js`, `17-ramen.js` | calculator en ramen tellen (ook de dienstenwebshop) |
| `18-inzichten.js` | statistieken |
| `19-instellingen.js` | instellingen (`SETCARDS`, `openSetEdit`) |
| `19-website.js`, `19-werk.js` | website voor Framer en de fotogalerij "Ons werk" |
| `22-offerte.js`, `23-opdracht.js` | offertes en opdrachten (prijs per verdieping, minimum) |
| `24-uitvoering.js` | diensten, frequenties, prijzen |
| `29-zlive.js` | alles wat alleen online werkt: mail versturen, Mollie, Brevo |
| `29-zportaal.js` | klantportaal-instellingen en verzoeken in het CRM |
| `29-zveilig.js` | beveiliging en back-ups (instellingen) |
| `30-render.js` | navigatie en tekenen van de pagina's |

## 8. Kosten en accounts om bij te houden

- **Google Firebase** (Blaze, betalen naar gebruik): betaalkaart geldig houden.
- **Domein** mijnschoonmaker.com: op tijd verlengen. DNS wijst `crm.` naar Firebase Hosting
  en de hoofdsite naar Framer.
- **Brevo** (mail), **Mollie** (betalingen), **Framer** (website), **GitHub** (code).
- **AVG:** de verwerkersvoorwaarden van Google (Data Processing Terms) accepteren in de
  Firebase-console › Projectinstellingen, en met Brevo en Mollie een verwerkersovereenkomst hebben.

## 9. Lokaal proberen

```
cd src && python3 build.py /tmp/crm.html     # testversie zonder Firebase, opslag in de browser
```
Open `/tmp/crm.html` in een browser. Het klantportaal kun je lokaal testen door
`public/` te serveren (`python3 -m http.server`) en `/api/portaal/*` na te bootsen.

## Bank: betalingen automatisch koppelen

- **Facturen › Bankbestand uploaden**: CAMT.053 (XML), MT940 of CSV (Knab, ING en andere). De browser leest het bestand, de server (`functions/bank.js`, `bankVerwerk`) koppelt de betalingen.
- **Bankkoppeling** (Facturen › Knab-strook): via Enable Banking (PSD2, alleen-lezen, gratis voor eigen rekeningen). App ID en private key (.pem) staan in `geheim/config` (`ebApp`, `ebKey`), de sessie in `geheim/bank`. De redirect URL is `https://crm.mijnschoonmaker.com/api/bank/terug`. Automatisch ophalen gebeurt om 8, 12, 16 en 20 uur (`bankSync`). De toestemming van de bank verloopt na 90 tot 180 dagen: dan opnieuw koppelen.
- **Regel**: staat het factuurnummer in de omschrijving en klopt het bedrag, dan gaat de factuur op betaald. Ook een bekende rekening van de klant met precies het open bedrag telt. De rest komt in `banktx` met de status *controleren* of *onbekend* en wordt in het CRM met één klik gekoppeld. Uitbetalingen van Mollie worden genegeerd.
