"""Bouwt public/index.html voor de echte versie uit dezelfde bron als de Claude-versie."""
import subprocess, re, os, json
Z = "/home/claude/zeem"
subprocess.run(["python3", "build.py"], cwd=Z, check=True, capture_output=True)
crm = open("/home/claude/glazenwasser-crm.html").read()
V = "10.14.1"
fb = "".join(f'<script src="https://www.gstatic.com/firebasejs/{V}/firebase-{m}-compat.js"></script>\n' for m in ["app", "auth", "firestore", "storage", "functions"])
head = f'''<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cut">
<meta name="theme-color" content="#137a8a"><meta name="robots" content="noindex">
<link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.json">
{fb}<script src="/config.js"></script>
<script>{open("shim.js").read()}</script>
'''
i = crm.index("<title>")
html = head + crm[i:].replace("<style>", "<style>html,body{margin:0}\n", 1) + "\n</body></html>\n"
os.makedirs("public", exist_ok=True)
open("public/index.html", "w").write(html)
# broncode meenemen in de repository
import shutil, glob
os.makedirs("src/kc", exist_ok=True)
for f in glob.glob(Z + "/[0-9][0-9]-*.js") + [Z + "/style.css", Z + "/pages.css", Z + "/build.py"]:
    shutil.copy(f, "src/")
shutil.copy("/home/claude/klantcalculator.html", "src/klantcalculator.html")
shutil.copy("/home/claude/kc/framer_tpl.tsx", "src/kc/framer_tpl.tsx")
print("public/index.html", len(html))
