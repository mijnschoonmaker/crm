"""Bouwt public/index.html voor de echte versie uit dezelfde bron als de Claude-versie."""
import subprocess, re, os, json
# bouwt uit src/ in deze repository (de enige bron)
import tempfile
R = os.path.dirname(os.path.abspath(__file__))
tmp = os.path.join(tempfile.mkdtemp(), "crm.html")
subprocess.run(["python3", os.path.join(R, "src", "build.py"), tmp], check=True)
crm = open(tmp).read()
os.chdir(R)
V = "10.14.1"
fb = "".join(f'<script src="https://www.gstatic.com/firebasejs/{V}/firebase-{m}-compat.js"></script>\n' for m in ["app", "auth", "firestore", "storage", "functions"])
head = f'''<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cut">
<meta name="theme-color" content="#f5f5f4"><meta name="robots" content="noindex">
<link rel="icon" href="/mansard-32.png" type="image/png" sizes="32x32"><link rel="icon" href="/mansard-512.png" type="image/png" sizes="512x512"><link rel="apple-touch-icon" href="/mansard-app-180.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Mansard"><meta name="apple-mobile-web-app-status-bar-style" content="default">
{fb}<script src="/config.js"></script>
<script>{open("shim.js").read()}</script>
'''
i = crm.index("<title>")
html = head + crm[i:].replace("<style>", "<style>html,body{margin:0}\n", 1) + "\n</body></html>\n"
# meteen het eigen logo tonen (geen Zeem-logo bij het laden); daarna vult het CRM het logo uit Instellingen in
import re as _re
html = _re.sub(r'<div class="logo"><span class="mk">.*?</span><span class="wm">Mansard</span></div>', '<div class="logo haslogo"><img class="lgimg" src="/mansard-logo.png" alt="Mansard"><span class="wm lgtxt"></span></div>', html)
assert html.count('class="logo haslogo"') >= 2, "logo niet vervangen"
os.makedirs("public", exist_ok=True)
open("public/index.html", "w").write(html)
print("public/index.html", len(html))

# demo-omgeving (verzonnen gegevens, geen server) voor instructievideo's: /demo
demo = crm[crm.index("<title>"):]
assert demo.count("render();init();") == 1
demo = demo.replace("render();init();", open(os.path.join(R, "src", "demo", "demo.js")).read() + "\ndemoStart();", 1)
demo = demo.replace("<title>Mansard</title>", "<title>Mansard (demo)</title>", 1)
dhead = '''<!doctype html>
<script>if(location.hostname!=='app.mansard.nl'&&/^crm\./.test(location.hostname))location.replace('https://app.mansard.nl/demo/'+location.search+location.hash)</script>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cut">
<meta name="theme-color" content="#f5f5f4"><meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/mansard-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/mansard-180.png">
'''
_acc = os.path.join(R, "src", "demo", "accent.css")
if os.path.exists(_acc):
    demo = demo.replace("</script>\n<style id=\"mansardThema\">", "</script>\n<style id=\"mansardThema\">", 1)
    demo = demo + "\n<style id=\"mansardAccent\">\n" + open(_acc).read() + "\n</style>\n"
demo = dhead + demo.replace("<style>", "<style>html,body{margin:0}\n", 1) + "\n</body></html>\n"
# geen eigen merk in de demo: neutraal icoon en een verzonnen bedrijfsnaam
demo = _re.sub(r'<div class="logo"><span class="mk">.*?</span><span class="wm">Mansard</span></div>', '<div class="logo haslogo"><img class="lgimg" src="/mansard-logo.png" alt="Mansard"><span class="wm lgtxt"></span></div>', demo)
demo = demo.replace("mijnschoonmaker-95789", "\x00PRJ\x00").replace("robin@mijnschoonmaker.com", "info@voorbeeldglazenwasserij.nl").replace("mijnschoonmaker.com", "voorbeeldglazenwasserij.nl")
demo = demo.replace("Robin is ", "Mark is ").replace("mijnschoonmaker · CRM (demo)", "CRM (demo)").replace("Mijnschoonmaker", "Het CRM").replace("mijnschoonmaker", "het CRM").replace("https://\x00PRJ\x00.web.app", "https://app.mansard.nl").replace("\x00PRJ\x00.web.app", "app.mansard.nl").replace("\x00PRJ\x00", "mijnschoonmaker-95789")
os.makedirs("public/demo", exist_ok=True)
open("public/demo/index.html", "w").write(demo)
print("public/demo/index.html", len(demo))
