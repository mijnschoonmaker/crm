"""Test van de database-regels (firestore.rules) in de Firestore-emulator.

Controleert dat elk bedrijf alleen zijn eigen gegevens ziet, dat geheime sleutels nooit vanuit de browser
te lezen zijn en dat tweestapsverificatie wordt afgedwongen. Draait in GitHub vóór elke update:
  npx firebase-tools emulators:exec --only firestore --project demo-mansard "python3 tests/regels.py"
"""
import base64, json, os, sys, time, urllib.request, urllib.error

HOST = os.environ.get("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080")
PROJ = "demo-mansard"
URL = f"http://{HOST}/v1/projects/{PROJ}/databases/(default)/documents/"
RES = []


def b64(d):
    return base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()


def token(email, verified=True, mfa=None, auth_time=1700000000):
    now = int(time.time())
    p = {"iss": f"https://securetoken.google.com/{PROJ}", "aud": PROJ, "auth_time": auth_time, "user_id": email, "sub": email,
         "iat": now, "exp": now + 3600, "email": email, "email_verified": verified, "firebase": {"sign_in_provider": "password"}}
    if mfa is not None:
        p["mfa"] = mfa
    return b64({"alg": "none", "typ": "JWT"}) + "." + b64(p) + "."


def req(method, path, tok=None, body=None):
    h = {"Content-Type": "application/json"}
    if tok:
        h["Authorization"] = "Bearer " + tok
    r = urllib.request.Request(URL + path, method=method, headers=h, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(r) as x:
            return x.status
    except urllib.error.HTTPError as e:
        return e.code


def zet(path, velden):
    f = {k: ({"booleanValue": v} if isinstance(v, bool) else {"stringValue": v}) for k, v in velden.items()}
    s = req("PATCH", path, "owner", {"fields": f})
    assert s == 200, (path, s)


def mag(naam, verwacht, method, path, tok, body=None):
    s = req(method, path, tok, body)
    ok = (s in (200, 404)) if verwacht else (s == 403)
    RES.append((naam, ok, s))


def main():
    for _ in range(30):
        try:
            urllib.request.urlopen(f"http://{HOST}/")
            break
        except Exception:
            time.sleep(1)
    A, B, MW, VR, EIG = "anna@bedrijf-a.nl", "bob@bedrijf-b.nl", "medewerker@mijnschoonmaker.com", "vreemde@voorbeeld.nl", "robin@mijnschoonmaker.com"
    zet(f"gebruikers/{A}", {"bedrijf": "baaaaaaa", "rol": "eigenaar"})
    zet(f"gebruikers/{B}", {"bedrijf": "bbbbbbbb"})
    zet(f"gebruikers/{MW}", {"naam": "Medewerker"})
    zet("bedrijven/baaaaaaa/klanten/k1", {"naam": "Klant van A"})
    zet("bedrijven/bbbbbbbb/klanten/k2", {"naam": "Klant van B"})
    zet("klanten/k0", {"naam": "Klant van het eerste bedrijf"})
    zet("geheim/config", {"brevoKey": "geheim"})
    zet("bedrijven/baaaaaaa/geheim/config", {"mollieKey": "geheim"})
    w = {"fields": {"naam": {"stringValue": "inbraak"}}}
    ta, tb, tmw = token(A), token(B), token(MW)

    mag("Bedrijf A leest eigen klanten", True, "GET", "bedrijven/baaaaaaa/klanten/k1", ta)
    mag("Bedrijf A schrijft eigen klanten", True, "PATCH", "bedrijven/baaaaaaa/klanten/k1", ta, w)
    mag("Bedrijf A leest NIET de klanten van bedrijf B", False, "GET", "bedrijven/bbbbbbbb/klanten/k2", ta)
    mag("Bedrijf A ziet NIET de lijst van bedrijf B", False, "GET", "bedrijven/bbbbbbbb/klanten", ta)
    mag("Bedrijf A leest NIET de klanten van het eerste bedrijf", False, "GET", "klanten/k0", ta)
    mag("Bedrijf B schrijft NIET bij bedrijf A", False, "PATCH", "bedrijven/baaaaaaa/klanten/x", tb, w)
    mag("Medewerker eerste bedrijf leest eigen klanten", True, "GET", "klanten/k0", tmw)
    mag("Medewerker eerste bedrijf leest NIET bij bedrijf A", False, "GET", "bedrijven/baaaaaaa/klanten/k1", tmw)
    mag("Eigenaar eerste bedrijf leest NIET bij bedrijf A", False, "GET", "bedrijven/baaaaaaa/klanten/k1", token(EIG))
    mag("Zonder inloggen geen toegang", False, "GET", "klanten/k0", None)
    mag("Onbekend account geen toegang", False, "GET", "klanten/k0", token(VR))
    mag("Niet-bevestigd e-mailadres geen toegang", False, "GET", "bedrijven/baaaaaaa/klanten/k1", token(A, verified=False))
    mag("Geheime sleutels niet leesbaar (eigenaar)", False, "GET", "geheim/config", token(EIG))
    mag("Geheime sleutels niet leesbaar (bedrijf A)", False, "GET", "bedrijven/baaaaaaa/geheim/config", ta)
    mag("Bedrijf A leest NIET de gebruikers van bedrijf B", False, "GET", f"gebruikers/{B}", ta)
    mag("Gebruiker maakt zichzelf NIET lid van een ander bedrijf", False, "PATCH", f"gebruikers/{A}", ta, {"fields": {"bedrijf": {"stringValue": "bbbbbbbb"}}})
    nw = {"fields": {"bedrijf": {"stringValue": "baaaaaaa"}, "rol": {"stringValue": "medewerker"}}}
    mag("Eigenaar bedrijf A voegt eigen medewerker toe", True, "PATCH", "gebruikers/nieuw@bedrijf-a.nl", ta, nw)
    mag("Eigenaar bedrijf A maakt NIET het account van de platformeigenaar aan", False, "PATCH", f"gebruikers/{EIG}", ta, nw)
    mag("Eigenaar bedrijf A maakt NIET het beheeraccount aan", False, "PATCH", "gebruikers/robin@mansard.nl", ta, nw)
    zet(f"mfa/{A}", {"aan": True})
    mag("Tweestapsverificatie aan: zonder code geen toegang", False, "GET", "bedrijven/baaaaaaa/klanten/k1", token(A))
    mag("Tweestapsverificatie aan: met bevestigde code wel toegang", True, "GET", "bedrijven/baaaaaaa/klanten/k1", token(A, mfa=[1700000000]))

    fout = [r for r in RES if not r[1]]
    regels = [f"## Database-regels: {len(RES) - len(fout)} van {len(RES)} goed", "", "| | Controle | Antwoord |", "|---|---|---|"]
    regels += [f"| {'✅' if ok else '❌'} | {n} | {s} |" for n, ok, s in RES]
    t = "\n".join(regels)
    print(t)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        open(os.environ["GITHUB_STEP_SUMMARY"], "a").write(t + "\n\n")
    sys.exit(1 if fout else 0)


if __name__ == "__main__":
    main()
