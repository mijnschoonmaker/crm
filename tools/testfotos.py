import json, urllib.request, urllib.parse, os, sys
os.makedirs("tools/testfotos", exist_ok=True)
UA = {"User-Agent": "mijnschoonmaker-crm-test/1.0 (robin@mijnschoonmaker.com)"}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read()
n = 0
for cat in ["Category:Terraced houses in the Netherlands", "Category:Semi-detached houses in the Netherlands", "Category:Detached houses in the Netherlands", "Category:Houses in Groningen (province)"]:
    try:
        q = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "format": "json", "generator": "categorymembers", "gcmtitle": cat, "gcmtype": "file", "gcmlimit": 8, "prop": "imageinfo", "iiprop": "url", "iiurlwidth": 1400})
        r = json.loads(get(q))
        for p in (r.get("query") or {}).get("pages", {}).values():
            u = p.get("imageinfo", [{}])[0].get("thumburl", "")
            if not u.lower().split("?")[0].endswith((".jpg", ".jpeg")): continue
            open(f"tools/testfotos/t{n:02d}.jpg", "wb").write(get(u)); print(n, p["title"]); n += 1
    except Exception as e: print("fout", cat, e, file=sys.stderr)
print("totaal", n)
