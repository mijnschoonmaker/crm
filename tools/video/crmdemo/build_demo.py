import subprocess,sys
s=open('/home/claude/glazenwasser-crm.html').read()
demo=open('demo.js').read()
i=s.index('<script>\n(function(){')
s=s[:i]+'<script>\n'+demo+'\n</script>\n'+s[i:]
a=s.index('if(!LIVE)$("#status").innerHTML=\'<div class="notice verhuisd">');b=s.index(';',s.index('</div>\'',a))+1;s=s[:a]+s[b:]
s=s.replace('<title>','<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>',1)
s='<!doctype html><html lang="nl"><head><meta charset="utf-8">'+s if not s.lstrip().lower().startswith('<!doctype') else s
o='const src=lg?BLOB+lg:LIVE?"/logo.png":"";'
assert o in s
s=s.replace(o,'const src=window.DEMO_LOGO||(lg?BLOB+lg:LIVE?"/logo.png":"");')
open('index.html','w').write(s)
