"""Echte schermafbeeldingen van het klantportaal (telefoon, 390 x 844, 2x) voor de website.

Draait in GitHub (workflow "Portaalschermen"): opent public/portaal.html met voorbeeldgegevens
(tools/portaalschermen.json, geen echte klant), en bewaart per onderdeel public/site/portaal-<naam>.jpg.
De luchtfoto op het live-scherm komt van PDOK, zoals in het echte portaal.
"""
import functools, http.server, io, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
UIT = os.path.join(PUB, "site")
M = json.load(open(os.path.join(ROOT, "tools", "portaalschermen.json")))
SCHERMEN = [("home", "data", "home"), ("live", "live", "home"), ("bezoeken", "data", "bezoeken"),
            ("facturen", "data", "facturen"), ("credits", "data", "aanbevelen"), ("tickets", "data", "tickets")]
FONT = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap">'
        '<style>body,button,input,textarea,select{font-family:"Avenir Next","Avenir","Nunito Sans",sans-serif!important}</style>')


class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    os.makedirs(UIT, exist_ok=True)
    s = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(H, directory=PUB))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{s.server_address[1]}"
    gemaakt = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for naam, bron, tab in SCHERMEN:
            data = M[bron]
            ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="nl-NL", timezone_id="Europe/Amsterdam")
            ctx.add_init_script("localStorage.setItem('ms.portaal.s','voorbeeld')")

            def rt(route, _r=None, data=data):
                u = route.request.url
                if "/api/portaal/data" in u:
                    return route.fulfill(status=200, content_type="application/json", body=json.dumps(data))
                if "/api/portaal/tickets" in u:
                    return route.fulfill(status=200, content_type="application/json", body=json.dumps(M["tickets"]))
                if "/api/portaal/live" in u:
                    return route.fulfill(status=200, content_type="application/json", body=json.dumps({"live": data.get("live")}))
                if "/api/portaal/" in u:
                    return route.fulfill(status=200, content_type="application/json", body="{}")
                return route.continue_()

            ctx.route("**/*", rt)
            pg = ctx.new_page()
            fouten = []
            pg.on("pageerror", lambda e: fouten.append(str(e)))
            pg.goto(base + "/portaal.html", wait_until="networkidle")
            pg.evaluate("h=>document.head.insertAdjacentHTML('beforeend',h)", FONT)
            pg.wait_for_timeout(1500)
            pg.evaluate("t=>{const e=document.querySelector('[data-tab=\"'+t+'\"]');if(e)e.click()}", tab)
            pg.wait_for_timeout(4000 if naam == "live" else 1500)
            pg.evaluate("scrollTo(0,0)")
            pg.wait_for_timeout(400)
            png = pg.screenshot()
            Image.open(io.BytesIO(png)).convert("RGB").save(os.path.join(UIT, f"portaal-{naam}.jpg"), quality=86, optimize=True, progressive=True)
            gemaakt.append(naam + (" (fout: " + fouten[0][:80] + ")" if fouten else ""))
            ctx.close()
        b.close()
    s.shutdown()
    print("Gemaakt:", ", ".join(gemaakt))


if __name__ == "__main__":
    sys.exit(main())
