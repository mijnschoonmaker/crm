#!/usr/bin/env python3
"""Maakt de bewegende plaatjes voor de mails in public/mail/.

  python3 tools/mailgif.py           -> onderweg.gif en weg.gif (witte bus met gesloten aanhanger)
  python3 tools/mailgif.py --kaart   -> live-kaart.gif op een echte luchtfoto (PDOK) met een route over de weg (OSRM)

De kaart heeft internet nodig (PDOK en OSRM); dat draait in GitHub Actions bij het online zetten.
Lukt het ophalen niet, dan blijft het bestaande plaatje staan.
"""
import io, math, os, sys, json, urllib.request
from PIL import Image, ImageDraw, ImageFilter

UIT = os.path.join(os.path.dirname(__file__), "..", "public", "mail")
BUS = os.path.join(os.path.dirname(__file__), "..", "public", "img", "mansard-bus.png")  # dezelfde bus + Brian James boxvan als op Vandaag
_BUSIM = None


def busfoto():
    global _BUSIM
    if _BUSIM is None:
        im = Image.open(BUS).convert("RGBA")
        _BUSIM = im.crop(im.getbbox())
    return _BUSIM

SS = 3  # supersampling
BG = (250, 251, 251)
HUIS_GRIJS = (205, 212, 216)
HUIS_DOEL = (37, 44, 60)  # Gelders blauw



_ACHTER = {}


def achtergrond(w, h):
    """zacht verloop: boven precies de kleur van de mail erboven (#fbfcfc), naar beneden zacht grijs waar de huisjes staan"""
    if (w, h) not in _ACHTER:
        im = Image.new("RGB", (w, h))
        d = ImageDraw.Draw(im)
        top, bot = (251, 252, 252), (238, 241, 243)
        for y in range(h):
            t = max(0, min(1, (y - h * .12) / (h * .5)))
            t = t * t * (3 - 2 * t)
            d.line([0, y, w, y], fill=tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
        _ACHTER[(w, h)] = im
    return _ACHTER[(w, h)].copy()

def rr(d, box, r, **kw):
    d.rounded_rectangle([round(v) for v in box], radius=round(r), **kw)


def wiel(d, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(29, 33, 40))
    d.ellipse([cx - r * .55, cy - r * .55, cx + r * .55, cy + r * .55], fill=(176, 184, 192))
    d.ellipse([cx - r * .22, cy - r * .22, cx + r * .22, cy + r * .22], fill=(90, 98, 108))


def combinatie(d, x, base, s):
    """Witte bestelbus (rijdt naar rechts) met daarachter een gesloten aluminium aanhanger.
    x = voorkant van de bus, base = onderkant van de wielen, s = schaal."""
    # ---- aanhanger (links) ----
    tw, th = 118 * s, 92 * s
    tx1 = x - 168 * s - 16 * s
    tx0 = tx1 - tw
    ty1 = base - 14 * s
    ty0 = ty1 - th
    # disselboom naar de trekhaak
    d.line([tx1, ty1 - 10 * s, tx1 + 18 * s, ty1 - 10 * s], fill=(70, 76, 86), width=round(4 * s))
    # kast met afgeronde voorkant
    rr(d, [tx0, ty0, tx1, ty1], 9 * s, fill=(224, 228, 232), outline=(178, 186, 194), width=round(1.6 * s))
    # lichte bovenkant en ribbels
    rr(d, [tx0 + 3 * s, ty0 + 3 * s, tx1 - 3 * s, ty0 + 16 * s], 6 * s, fill=(238, 241, 244))
    for i in range(1, 6):
        xx = tx0 + i * tw / 6
        d.line([xx, ty0 + 18 * s, xx, ty1 - 14 * s], fill=(205, 211, 217), width=round(1.2 * s))
    # zwarte onderrand
    d.rectangle([tx0, ty1 - 12 * s, tx1, ty1], fill=(44, 48, 56))
    # achterlicht
    d.rectangle([tx0 + 1 * s, ty1 - 24 * s, tx0 + 5 * s, ty1 - 15 * s], fill=(196, 46, 46))
    # spatbord en wiel
    wx = tx0 + tw * .52
    d.pieslice([wx - 17 * s, ty1 - 15 * s, wx + 17 * s, ty1 + 19 * s], 180, 360, fill=(52, 57, 66))
    wiel(d, wx, base - 12 * s, 12 * s)

    # ---- bus (rechts) ----
    bx0 = x - 168 * s
    top = base - 98 * s
    body_b = base - 14 * s
    # laadruimte + cabine als één vorm
    pts = [(bx0, top + 6 * s), (bx0 + 112 * s, top + 6 * s), (bx0 + 128 * s, top + 8 * s), (bx0 + 146 * s, top + 40 * s),
           (x - 4 * s, top + 52 * s), (x, top + 60 * s), (x, body_b - 4 * s), (x - 4 * s, body_b), (bx0, body_b)]
    d.polygon(pts, fill=(250, 251, 252), outline=(186, 194, 201))
    d.line(pts + [pts[0]], fill=(186, 194, 201), width=round(1.6 * s), joint="curve")
    # onderband
    d.polygon([(bx0, body_b - 16 * s), (x, body_b - 16 * s), (x, body_b - 4 * s), (x - 4 * s, body_b), (bx0, body_b)], fill=(228, 233, 237))
    # bumper
    rr(d, [x - 12 * s, body_b - 14 * s, x + 2 * s, body_b], 3 * s, fill=(60, 66, 76))
    # ramen
    d.polygon([(bx0 + 116 * s, top + 14 * s), (bx0 + 126 * s, top + 14 * s), (bx0 + 141 * s, top + 41 * s), (bx0 + 116 * s, top + 41 * s)], fill=(43, 52, 69))
    d.polygon([(bx0 + 118 * s, top + 16 * s), (bx0 + 123 * s, top + 16 * s), (bx0 + 128 * s, top + 26 * s), (bx0 + 118 * s, top + 26 * s)], fill=(96, 110, 132))
    rr(d, [bx0 + 92 * s, top + 14 * s, bx0 + 111 * s, top + 41 * s], 3 * s, fill=(43, 52, 69))
    # deurnaden en handgreep
    d.line([bx0 + 88 * s, top + 10 * s, bx0 + 88 * s, body_b - 2 * s], fill=(214, 220, 225), width=round(1.4 * s))
    d.line([bx0 + 114 * s, top + 10 * s, bx0 + 114 * s, body_b - 2 * s], fill=(214, 220, 225), width=round(1.4 * s))
    d.line([bx0 + 100 * s, top + 50 * s, bx0 + 107 * s, top + 50 * s], fill=(150, 158, 166), width=round(2.2 * s))
    # koplamp
    rr(d, [x - 9 * s, top + 56 * s, x - 1 * s, top + 63 * s], 2 * s, fill=(255, 236, 170))
    # imperiaal met ladder
    d.line([bx0 + 8 * s, top - 2 * s, bx0 + 104 * s, top - 2 * s], fill=(160, 168, 176), width=round(3 * s))
    for i in range(7):
        xx = bx0 + 12 * s + i * 15 * s
        d.line([xx, top - 2 * s, xx, top + 6 * s], fill=(160, 168, 176), width=round(1.6 * s))
    d.line([bx0 + 4 * s, top - 9 * s, bx0 + 108 * s, top - 9 * s], fill=(178, 185, 192), width=round(2.4 * s))
    d.line([bx0 + 4 * s, top - 3 * s, bx0 + 108 * s, top - 3 * s], fill=(178, 185, 192), width=round(2.4 * s))
    for i in range(8):
        xx = bx0 + 8 * s + i * 14 * s
        d.line([xx, top - 9 * s, xx, top - 3 * s], fill=(178, 185, 192), width=round(1.6 * s))
    # wielkasten en wielen
    for wx in (bx0 + 30 * s, x - 34 * s):
        d.pieslice([wx - 19 * s, body_b - 17 * s, wx + 19 * s, body_b + 21 * s], 180, 360, fill=(52, 57, 66))
        wiel(d, wx, base - 13 * s, 13 * s)
    # zachte schaduw onder de combinatie
    return tx0


def huis(d, cx, base, h, kleur, w=2.6, s=1):
    hw = h * .62
    pts = [(cx - hw, base), (cx - hw, base - h * .55), (cx, base - h), (cx + hw, base - h * .55), (cx + hw, base)]
    d.line(pts, fill=kleur, width=round(w * s), joint="curve")
    dw = h * .2
    d.line([(cx - dw, base), (cx - dw, base - h * .38), (cx + dw, base - h * .38), (cx + dw, base)], fill=kleur, width=round(w * s), joint="curve")


def scene(naam, richting):
    W, H = 1120, 200
    huizen = [(42, 38), (265, 44), (383, 52), (517, 40), (633, 44), (751, 52), (868, 40), (1088, 44)]
    doel = (1000, 62) if richting == "aan" else (142, 62)
    if richting == "weg":
        huizen = [hh for hh in huizen if abs(hh[0] - doel[0]) > 70]
    else:
        huizen = [hh for hh in huizen if abs(hh[0] - doel[0]) > 70]
    n = 44
    frames = []
    base = 180
    for f in range(n):
        t = f / (n - 1)
        e = 1 - (1 - t) ** 2.2 if richting == "aan" else t ** 1.6
        if richting == "aan":
            xv = -40 + (doel[0] - 70 + 40) * e
        else:
            xv = doel[0] + 210 + (W + 340 - doel[0] - 210) * e
        im = achtergrond(W * SS, H * SS)
        d = ImageDraw.Draw(im)
        # weg
        d.line([0, (base + 6) * SS, W * SS, (base + 6) * SS], fill=(214, 220, 224), width=4 * SS)
        for xx in range(0, W, 32):
            d.line([(xx + 6) * SS, (base + 6) * SS, (xx + 22) * SS, (base + 6) * SS], fill=(246, 248, 249), width=1 * SS)
        for cx, h in huizen:
            huis(d, cx * SS, (base - 2) * SS, h * SS, HUIS_GRIJS, 2.6, SS)
        huis(d, doel[0] * SS, (base - 2) * SS, doel[1] * SS, HUIS_DOEL, 3.4, SS)
        # schaduw
        sh = Image.new("L", im.size, 0)
        sd = ImageDraw.Draw(sh)
        sd.ellipse([(xv - 410) * SS, (base - 4) * SS, (xv + 2) * SS, (base + 8) * SS], fill=70)
        sh = sh.filter(ImageFilter.GaussianBlur(6 * SS))
        im.paste((150, 160, 168), mask=sh)
        bf = busfoto()
        bh = 104 * SS
        bw = round(bf.width * bh / bf.height)
        bi = bf.resize((bw, bh), Image.LANCZOS)
        im.paste(bi, (round(xv * SS - bw), round((base + 3) * SS - bh)), bi)
        frames.append(im.resize((W, H), Image.LANCZOS))
    hold = [900] + [55] * (n - 2) + [1400]
    if richting == "weg":
        hold = [1400] + [55] * (n - 2) + [600]
    pal = frames[-1 if richting == "aan" else 0].quantize(colors=96, method=Image.Quantize.MEDIANCUT)
    q = [fr.quantize(palette=pal, dither=Image.Dither.NONE) for fr in frames]
    q[0].save(os.path.join(UIT, naam + ".gif"), save_all=True, append_images=q[1:], duration=hold, loop=0, optimize=True, disposal=1)
    print("geschreven", naam, os.path.getsize(os.path.join(UIT, naam + ".gif")))


# ------------------------------------------------------------------ kaart
# gewone woonwijk (Houten): geen echte klant. Route over echte straten tussen A en B (OSRM)
A_LL, B_LL = (52.03100, 5.15400), (52.03300, 5.15900)
MAX_M = 230  # alleen het eerste stuk van de route: past ruim in beeld op zoom 17
Z = 17
KW, KH = 560, 340


def tegel_xy(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def haal(url, t=20):
    req = urllib.request.Request(url, headers={"User-Agent": "Mansard-mailgif/1.0"})
    return urllib.request.urlopen(req, timeout=t).read()


def route_ll():
    url = f"https://router.project-osrm.org/route/v1/driving/{A_LL[1]:.6f},{A_LL[0]:.6f};{B_LL[1]:.6f},{B_LL[0]:.6f}?overview=full&geometries=geojson"
    js = json.loads(haal(url))
    return [(lat, lon) for lon, lat in js["routes"][0]["geometry"]["coordinates"]]


def beeld(ll):
    """kies zoom en uitsnede zodat de hele route ruim in beeld past"""
    global Z
    for z in (17, 16, 15):
        P = [tegel_xy(la, lo, z) for la, lo in ll]
        xs, ys = [p[0] * 256 for p in P], [p[1] * 256 for p in P]
        if max(xs) - min(xs) <= KW - 110 and max(ys) - min(ys) <= KH - 90:
            Z = z
            cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
            px0, py0 = cx - KW / 2, cy - KH / 2
            return px0, py0, [(x - px0, y - py0) for x, y in zip(xs, ys)]
    raise RuntimeError("route te lang")


def luchtfoto(px0, py0):
    big = Image.new("RGB", (KW, KH))
    for tx in range(int(px0 // 256), int((px0 + KW) // 256) + 1):
        for ty in range(int(py0 // 256), int((py0 + KH) // 256) + 1):
            raw = haal(f"https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{Z}/{tx}/{ty}.jpeg")
            big.paste(Image.open(io.BytesIO(raw)).convert("RGB"), (round(tx * 256 - px0), round(ty * 256 - py0)))
    return big


def langs(pts, t):
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    L = sum(seg) or 1
    want = t * L
    for i, s in enumerate(seg):
        if want <= s or i == len(seg) - 1:
            f = 0 if s == 0 else min(1, want / s)
            p = (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f)
            ang = math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])
            return p, ang, i
        want -= s
    return pts[-1], 0, len(pts) - 2


def bovenaanzicht(ang, s):
    """bus met aanhanger van bovenaf, rijrichting naar rechts, gedraaid naar ang"""
    W, H = int(70 * s), int(30 * s)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cy = H / 2
    # aanhanger
    rr(d, [2 * s, cy - 8 * s, 26 * s, cy + 8 * s], 2.5 * s, fill=(214, 219, 224, 255), outline=(120, 128, 138, 255), width=max(1, round(s)))
    d.line([26 * s, cy, 32 * s, cy], fill=(60, 66, 76, 255), width=max(1, round(1.4 * s)))
    # bus
    rr(d, [32 * s, cy - 8.5 * s, 64 * s, cy + 8.5 * s], 3.5 * s, fill=(252, 253, 253, 255), outline=(120, 128, 138, 255), width=max(1, round(s)))
    rr(d, [53 * s, cy - 7 * s, 58 * s, cy + 7 * s], 1.5 * s, fill=(43, 52, 69, 255))
    for i in range(4):
        xx = 36 * s + i * 4 * s
        d.line([xx, cy - 5 * s, xx, cy + 5 * s], fill=(176, 184, 192, 255), width=max(1, round(.9 * s)))
    im = im.rotate(-math.degrees(ang), resample=Image.BICUBIC, expand=True)
    return im


def kaart():
    try:
        ll = route_ll()
    except Exception as e:
        print("route niet bereikbaar, rechte lijn:", e)
        ll = [A_LL, (A_LL[0], B_LL[1]), B_LL]
    # route inkorten tot MAX_M meter (zo blijft het een straatje of twee in een woonwijk)
    def m(a, b):
        return 6371000 * math.hypot(math.radians(b[0] - a[0]), math.radians(b[1] - a[1]) * math.cos(math.radians(a[0])))
    kort, tot = [ll[0]], 0
    for a2, b2 in zip(ll, ll[1:]):
        d = m(a2, b2)
        if tot + d >= MAX_M:
            f = (MAX_M - tot) / d if d else 0
            kort.append((a2[0] + (b2[0] - a2[0]) * f, a2[1] + (b2[1] - a2[1]) * f))
            break
        kort.append(b2)
        tot += d
    ll = kort
    try:
        px0, py0, pts = beeld(ll)
        foto = luchtfoto(px0, py0)
    except Exception as e:
        print("luchtfoto niet bereikbaar, bestaande kaart blijft staan:", e)
        return
    # foto iets rustiger zodat route en bus opvallen
    foto = Image.blend(foto, Image.new("RGB", foto.size, (236, 238, 240)), .12)
    eind = pts[-1]
    n = 64
    frames = []
    for f in range(n):
        u = f / (n - 1)
        t = .22 + .62 * (u * u * (3 - 2 * u))  # zacht optrekken en afremmen
        im = foto.resize((KW * SS, KH * SS), Image.LANCZOS).convert("RGBA")
        lay = Image.new("RGBA", im.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        p, ang, i = langs(pts, t)
        P = [(x * SS, y * SS) for x, y in pts]
        gedaan = P[:i + 1] + [(p[0] * SS, p[1] * SS)]
        nog = [(p[0] * SS, p[1] * SS)] + P[i + 1:]
        if len(gedaan) > 1:
            d.line(gedaan, fill=(255, 255, 255, 150), width=7 * SS, joint="curve")
            d.line(gedaan, fill=(37, 44, 60, 210), width=4 * SS, joint="curve")
        # stippellijn voor het stuk dat nog komt
        acc = 0
        for a, b in zip(nog, nog[1:]):
            L = math.dist(a, b)
            k = 0
            k = (-acc) % (10 * SS)
            while k < L:
                q = (a[0] + (b[0] - a[0]) * k / L, a[1] + (b[1] - a[1]) * k / L)
                d.ellipse([q[0] - 3.2 * SS, q[1] - 3.2 * SS, q[0] + 3.2 * SS, q[1] + 3.2 * SS], fill=(37, 44, 60, 200))
                d.ellipse([q[0] - 2.2 * SS, q[1] - 2.2 * SS, q[0] + 2.2 * SS, q[1] + 2.2 * SS], fill=(255, 255, 255, 250))
                k += 10 * SS
            acc += L
        # doel: huisje in een witte cirkel
        ex, ey = eind[0] * SS, eind[1] * SS
        pul = (f % 20) / 20
        d.ellipse([ex - (14 + 10 * pul) * SS, ey - (14 + 10 * pul) * SS, ex + (14 + 10 * pul) * SS, ey + (14 + 10 * pul) * SS], fill=(255, 255, 255, int(110 * (1 - pul))))
        d.ellipse([ex - 13 * SS, ey - 13 * SS, ex + 13 * SS, ey + 13 * SS], fill=(37, 44, 60, 255), outline=(255, 255, 255, 255), width=2 * SS)
        huis(d, ex, ey + 6 * SS, 13 * SS, (255, 255, 255, 255), 2, SS)
        im = Image.alpha_composite(im, lay)
        # bus met halo
        halo = Image.new("RGBA", im.size, (0, 0, 0, 0))
        hd = ImageDraw.Draw(halo)
        hd.ellipse([p[0] * SS - 26 * SS, p[1] * SS - 26 * SS, p[0] * SS + 26 * SS, p[1] * SS + 26 * SS], fill=(255, 255, 255, 70))
        # bus en aanhanger volgen de weg: voorkant op de route, achterkant een buslengte terug op de route
        Ltot = sum(math.dist(pts[k], pts[k + 1]) for k in range(len(pts) - 1)) or 1
        BL = 96  # lengte van bus + boxvan in pixels
        voor, _, _ = langs(pts, t)
        achter, _, _ = langs(pts, max(0, t - BL / Ltot))
        mid = ((voor[0] + achter[0]) / 2, (voor[1] + achter[1]) / 2)
        ang2 = math.atan2(voor[1] - achter[1], voor[0] - achter[0])
        bf = busfoto()
        bw = round(BL * 1.08 * SS)
        bi = bf.resize((bw, round(bf.height * bw / bf.width)), Image.LANCZOS)
        deg = math.degrees(ang2)
        if abs(deg) > 90:  # naar links rijden: spiegelen zodat de bus niet op zijn kop staat
            bi = bi.transpose(Image.FLIP_LEFT_RIGHT)
            deg = deg - 180 if deg > 0 else deg + 180
        bi = bi.rotate(-deg, resample=Image.BICUBIC, expand=True)
        im.alpha_composite(bi, (round(mid[0] * SS - bi.width / 2), round(mid[1] * SS - bi.height / 2)))
        frames.append(im.convert("RGB").resize((KW, KH), Image.LANCZOS))
    pal = frames[0].quantize(colors=200, method=Image.Quantize.MEDIANCUT)
    q = [fr.quantize(palette=pal, dither=Image.Dither.NONE) for fr in frames]
    q[0].save(os.path.join(UIT, "live-kaart.gif"), save_all=True, append_images=q[1:], duration=[700] + [55] * (n - 2) + [1400], loop=0, optimize=True, disposal=1)
    print("geschreven live-kaart", os.path.getsize(os.path.join(UIT, "live-kaart.gif")))


def overzicht(lat, lon, z=15, n=4):
    """hulpje: luchtfoto-overzicht met coordinaten, om een woonwijk voor de mailkaart te kiezen"""
    cx, cy = tegel_xy(lat, lon, z)
    tx0, ty0 = int(cx) - n // 2, int(cy) - n // 2
    im = Image.new("RGB", (256 * n, 256 * n))
    for i in range(n):
        for j in range(n):
            raw = haal(f"https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{tx0 + i}/{ty0 + j}.jpeg")
            im.paste(Image.open(io.BytesIO(raw)).convert("RGB"), (i * 256, j * 256))
    d = ImageDraw.Draw(im)
    N = 2 ** z
    for k in range(0, 256 * n + 1, 128):
        lo = (tx0 + k / 256) / N * 360 - 180
        la = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (ty0 + k / 256) / N))))
        d.line([k, 0, k, 256 * n], fill=(255, 255, 0), width=1)
        d.line([0, k, 256 * n, k], fill=(255, 255, 0), width=1)
        d.text((k + 2, 2), f"{lo:.4f}", fill=(255, 255, 0))
        d.text((2, k + 2), f"{la:.4f}", fill=(255, 255, 0))
    im.save(os.path.join(os.path.dirname(__file__), "overzicht.jpg"), quality=80)


def hero():
    """grote luchtfoto (zoom 18) met route in pixels voor de website: public/mail/hero-kaart.jpg + hero-route.json"""
    global Z
    if os.path.exists(os.path.join(UIT, "hero-kaart.jpg")) and "--opnieuw" not in sys.argv:
        print("hero-kaart bestaat al"); return
    try:
        ll = route_ll()
    except Exception as e:
        print("route niet bereikbaar:", e); return
    def m(a, b):
        return 6371000 * math.hypot(math.radians(b[0] - a[0]), math.radians(b[1] - a[1]) * math.cos(math.radians(a[0])))
    kort, tot = [ll[0]], 0
    for a2, b2 in zip(ll, ll[1:]):
        d = m(a2, b2)
        if tot + d >= 420:
            f = (420 - tot) / d if d else 0
            kort.append((a2[0] + (b2[0] - a2[0]) * f, a2[1] + (b2[1] - a2[1]) * f)); break
        kort.append(b2); tot += d
    W, H, z = 1600, 1000, 18
    P = [tegel_xy(la, lo, z) for la, lo in kort]
    xs, ys = [p[0] * 256 for p in P], [p[1] * 256 for p in P]
    if max(xs) - min(xs) > W - 300 or max(ys) - min(ys) > H - 240:
        z = 17; P = [tegel_xy(la, lo, z) for la, lo in kort]; xs, ys = [p[0] * 256 for p in P], [p[1] * 256 for p in P]
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    px0, py0 = cx - W / 2, cy - H / 2
    big = Image.new("RGB", (W, H))
    for tx in range(int(px0 // 256), int((px0 + W) // 256) + 1):
        for ty in range(int(py0 // 256), int((py0 + H) // 256) + 1):
            raw = haal(f"https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{tx}/{ty}.jpeg")
            big.paste(Image.open(io.BytesIO(raw)).convert("RGB"), (round(tx * 256 - px0), round(ty * 256 - py0)))
    big.save(os.path.join(UIT, "hero-kaart.jpg"), quality=84, optimize=True, progressive=True)
    with open(os.path.join(UIT, "hero-route.json"), "w") as f:
        json.dump({"w": W, "h": H, "z": z, "pts": [[round(x - px0, 1), round(y - py0, 1)] for x, y in zip(xs, ys)]}, f)
    print("geschreven hero-kaart", z, len(xs))


if __name__ == "__main__":
    if "--overzicht" in sys.argv:
        overzicht(52.0230, 5.1680)
    elif "--kaart" in sys.argv:
        kaart()
        try:
            hero()
        except Exception as e:
            print("hero-kaart mislukt:", e)
    else:
        scene("onderweg", "aan")
        scene("weg", "weg")
