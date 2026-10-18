import glob,re,os,sys
D=os.path.dirname(os.path.abspath(__file__));os.chdir(D)
OUT=sys.argv[1] if len(sys.argv)>1 else '../glazenwasser-crm.html'
css=open('style.css').read()+"\n"+open('pages.css').read()
thema=open('thema.css').read()
js="\n".join(open(f).read() for f in sorted(glob.glob('[0-9][0-9]-*.js')))
import json
js="const FRAMER_TPL="+json.dumps(open(os.path.join(D,'kc','framer_tpl.tsx')).read()).replace("</","<\\/")+";\n"+js
js="const KC_TPL="+json.dumps(open(os.path.join(D,'klantcalculator.html')).read()).replace("</","<\\/")+";\n"+js
mark='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2.5" stroke="#fff" stroke-width="1.8"/><path d="M12 4v16M4 12h16" stroke="#fff" stroke-width="1.2" opacity=".55"/><path d="M7 17L17 7" stroke="#ebbd4c" stroke-width="2.6" stroke-linecap="round"/></svg>'
gear='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>'
col='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 9l-3 3 3 3"/></svg>'
html=f'''<title>Mansard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<style>
{css}
</style>
<div class="app">
  <aside class="side">
    <div class="logo"><span class="mk">{mark}</span><span class="wm">Mansard</span></div>
    <button type="button" class="collapse" data-act="collapse" aria-label="Menu in- of uitklappen">{col}<span class="lbl">Menu inklappen</span></button>
    <nav id="sideNav" aria-label="Hoofdmenu"></nav>
    <div class="sp"></div>
    <div class="usercard" id="userCard"></div>
  </aside>
  <div style="min-width:0">
    <div class="topbar"><div class="logo"><span class="mk">{mark}</span><span class="wm">Mansard</span></div><div class="sp"></div><button type="button" class="iconbtn" data-act="tab" data-tab="instellingen" aria-label="Instellingen">{gear}</button></div>
    <main><div id="status"></div><div id="view"></div></main>
  </div>
</div>
<nav class="tabs" id="tabNav" aria-label="Menu"></nav>
<dialog id="dlg"><form class="dlg" id="dlgForm" method="dialog"></form></dialog>
<script>
(function(){{
{js}
}})();
</script>
<style id="mansardThema">
{thema}
</style>
'''
open(OUT,'w').write(html)
pass
print(len(html))
