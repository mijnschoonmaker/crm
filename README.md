# mijnschoonmaker CRM

Eigen CRM voor glasbewassing, live op Firebase.

- `public/` — de app (wordt gebouwd uit de broncode, `build_live.py`)
- `functions/` — server: mail via Brevo, Mollie, websiteaanvragen, ingeplande mails, bestanden
- `firestore.rules`, `storage.rules` — wie mag wat (alleen gebruikers in `/gebruikers` + de eigenaar)
- `.github/workflows/deploy.yml` — elke wijziging op `main` gaat automatisch online

Nodig in GitHub (Settings › Secrets and variables › Actions):
- secret `FIREBASE_SERVICE_ACCOUNT` — JSON-sleutel van een service-account met de rol Eigenaar
- variable `FIREBASE_PROJECT` — de project-ID uit Firebase
