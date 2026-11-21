"""Maakt functions/assets/glans.gif: de lichtstraal die rond de knop 'Mijn klantportaal' in de mail draait.
In de mail is een CSS-animatie niet betrouwbaar (veel mailprogramma's laten die weg), een GIF wel.
Het palet is een vaste reeks van 64 kleuren (grijs -> accent -> wit -> grijs); de functie /api/t/g/<hex>.gif
vervangt alleen het palet, zodat elk bedrijf zijn eigen accentkleur krijgt.  python3 tools/glansgif.py"""
import math
from PIL import Image
W,H,R,N=440,52,6,90          # 440x52 wordt in de mail uitgerekt tot ~660x76; alleen de rand van 2px is zichtbaar
def idx(a):
  a%=360
  if a<230: return 0
  if a<320: return round((a-230)/90*23)
  if a<345: return 24+round((a-320)/25*15)
  return 40+round((a-345)/15*23)
def pal(acc=(0x13,0x7a,0x8a)):
  g=(0xe3,0xe6,0xea);w=(255,255,255);P=[]
  mx=lambda a,b,t:[round(a[i]+(b[i]-a[i])*t) for i in range(3)]
  for i in range(24):P+=mx(g,acc,i/23)
  for i in range(16):P+=mx(acc,w,i/15)
  for i in range(24):P+=mx(w,g,i/23)
  return P
fr=[]
for f in range(N):
  rot=f/N*360;im=Image.new("P",(W,H),0);im.putpalette(pal());px=im.load()
  for y in range(H):
    for x in range(W):
      if R<=x<W-R and R<=y<H-R: continue
      dx=(x+.5-W/2)*1.5;dy=(y+.5-H/2)*(76/52)
      px[x,y]=idx(math.degrees(math.atan2(dx,-dy))-rot)
  fr.append(im)
fr[0].save("functions/assets/glans.gif",save_all=True,append_images=fr[1:],duration=50,loop=0,optimize=False,disposal=1)
# lokale kleurtabellen weghalen (Pillow schrijft ze per beeld), zodat alleen het globale palet van 64 kleuren telt
d=bytearray(open("functions/assets/glans.gif","rb").read());G=d[13:13+192];o=d[:13+192];p=13+192
while True:
  b=d[p]
  if b==0x3b: o.append(b);break
  if b==0x21: o+=d[p:p+2];p+=2
  else:
    pk=d[p+9];h=bytearray(d[p:p+10]);p+=10
    if pk>>7:
      n=3*(2<<(pk&7));assert n==192 and d[p:p+n]==G,"ander palet";p+=n;h[9]=pk&0x40
    o+=h;o.append(d[p]);p+=1
  while d[p]: o+=d[p:p+d[p]+1];p+=d[p]+1
  o.append(0);p+=1
open("functions/assets/glans.gif","wb").write(o)
