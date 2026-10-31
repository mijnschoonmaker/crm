/* Dakranden van een woning uit 3D BAG (TU Delft / Kadaster, LoD 2.2 uit laserscans).
   In: het adrespunt in RD (x,y) en in WGS84 (lat,lng) van de PDOK-locatieserver.
   Uit: per rand de soort (goot, windveer, dakrand plat dak), de echte 3D-lengte en de punten in WGS84 om op de luchtfoto te tekenen.
   Randen tegen een buurpand (scheidingsmuur bij een rijwoning) tellen niet mee. Alleen lezen, niets bewaren. */
module.exports = ({ onCall, onRequest, HttpsError, checkGebruiker }) => {
  const rd2w = (x, y) => { const dX = (x - 155000) * 1e-5, dY = (y - 463000) * 1e-5;
    const N = 3235.65389 * dY - 32.58297 * dX ** 2 - 0.2475 * dY ** 2 - 0.84978 * dX ** 2 * dY - 0.0655 * dY ** 3 - 0.01709 * dX ** 2 * dY ** 2 - 0.00738 * dX + 0.0053 * dX ** 4 - 0.00039 * dX ** 2 * dY ** 3 + 0.00033 * dX ** 4 * dY - 0.00012 * dX * dY;
    const E = 5260.52916 * dX + 105.94684 * dX * dY + 2.45656 * dX * dY ** 2 - 0.81885 * dX ** 3 + 0.05594 * dX * dY ** 3 - 0.05607 * dX ** 3 * dY + 0.01199 * dY - 0.00256 * dX ** 3 * dY ** 2 + 0.00128 * dX * dY ** 4 + 0.00022 * dY ** 2 - 0.00022 * dX ** 2 + 0.00026 * dX ** 5;
    return [52.1551744 + N / 3600, 5.38720621 + E / 3600]; };
  const pip = (p, poly) => { let c = false; for (let i = 0, k = poly.length - 1; i < poly.length; k = i++) { const a = poly[i], b = poly[k]; if (((a[1] > p[1]) !== (b[1] > p[1])) && (p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0])) c = !c; } return c; };
  /* afstand van punt p tot lijnstuk a-b (2D) */
  const dSeg = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy; let t = L2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy); };
  /* oppervlakte van een 3D-veelhoek (Newell) */
  const opp = P => { let nx = 0, ny = 0, nz = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); } return Math.hypot(nx, ny, nz) / 2; };
  async function bereken(d) {
    const x = Number(d.x), y = Number(d.y), lat = Number(d.lat), lng = Number(d.lng);
    if (!(x > 0 && x < 300000 && y > 289000 && y < 630000)) throw new HttpsError("invalid-argument", "Geen geldig adrespunt.");
    const r = 15, url = `https://api.3dbag.nl/collections/pand/items?bbox=${x - r},${y - r},${x + r},${y + r}&limit=60`;
    let j; try { const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) }); if (!res.ok) throw new Error("status " + res.status); j = await res.json(); }
    catch (e) { throw new HttpsError("unavailable", "3D BAG is nu niet bereikbaar. Meet op de luchtfoto."); }
    const T = j.metadata && j.metadata.transform; if (!T) throw new HttpsError("unavailable", "Onbekend antwoord van 3D BAG.");
    /* kleine correctie zodat de lijnen precies op de luchtfoto vallen: het adres is in beide stelsels bekend */
    const w0 = rd2w(x, y), dLat = lat ? lat - w0[0] : 0, dLng = lng ? lng - w0[1] : 0, ll = p => { const w = rd2w(p[0], p[1]); return [Math.round((w[0] + dLat) * 1e7) / 1e7, Math.round((w[1] + dLng) * 1e7) / 1e7]; };
    const panden = (j.features || []).map(f => { const V = (f.vertices || []).map(v => [v[0] * T.scale[0] + T.translate[0], v[1] * T.scale[1] + T.translate[1], v[2] * T.scale[2] + T.translate[2]]);
      const b = (f.CityObjects || {})[f.id] || {}, g0 = (b.geometry || [])[0], voet = g0 && g0.boundaries && g0.boundaries[0] && g0.boundaries[0][0] ? g0.boundaries[0][0].map(i => V[i]) : [];
      return { f, V, b, voet }; }).filter(p => p.voet.length > 2);
    let hoofd = panden.find(p => pip([x, y], p.voet));
    if (!hoofd) { let best = 9; panden.forEach(p => { for (let i = 0; i < p.voet.length; i++) { const dd = dSeg([x, y], p.voet[i], p.voet[(i + 1) % p.voet.length]); if (dd < best) { best = dd; hoofd = p; } } }); }
    if (!hoofd) throw new HttpsError("not-found", "Geen gebouw gevonden op dit adres in 3D BAG.");
    const buren = panden.filter(p => p !== hoofd);
    const tegenBuur = (a, b) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return buren.some(p => { for (let i = 0; i < p.voet.length; i++) if (dSeg(m, p.voet[i], p.voet[(i + 1) % p.voet.length]) < 0.45) return true; return false; }); };
    /* een echte dakrand ligt boven de buitenmuur; randen midden op het dak (een sprong tussen twee dakdelen) tellen niet */
    const opGevel = (a, b) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v = hoofd.voet; for (let i = 0; i < v.length; i++) if (dSeg(m, v[i], v[(i + 1) % v.length]) < 0.6) return true; return false; };
    const part = (hoofd.f.CityObjects || {})[hoofd.f.id + "-0"] || {}, g = (part.geometry || []).find(x => x.lod === "2.2") || (part.geometry || []).find(x => x.lod === "1.3");
    if (!g) throw new HttpsError("not-found", "Van dit gebouw is geen dakmodel bekend.");
    const V = hoofd.V, shell = g.type === "Solid" ? g.boundaries[0] : g.boundaries, sv = g.semantics ? (g.type === "Solid" ? g.semantics.values[0] : g.semantics.values) : [], st = g.semantics ? g.semantics.surfaces : [];
    const daken = []; let gevel = 0, dak = 0; const gevels = {};
    shell.forEach((s, i) => { const t = st[sv[i]] && st[sv[i]].type, P = s[0].map(k => V[k]);
      if (t === "RoofSurface") { daken.push(s[0]); dak += opp(P); }
      else if (t === "WallSurface") { /* muur tegen de buren telt niet: het midden ligt op hun voetafdruk */
        const mx = P.reduce((a, q) => a + q[0], 0) / P.length, my = P.reduce((a, q) => a + q[1], 0) / P.length;
        if (buren.some(p => { for (let k = 0; k < p.voet.length; k++) if (dSeg([mx, my], p.voet[k], p.voet[(k + 1) % p.voet.length]) < 0.45) return true; return false; })) return;
        const A = opp(P); gevel += A;
        /* windrichting van de gevel (buitenkant): normaal uit de voetafdruk-rand */
        let nx = 0, ny = 0; for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); }
        const az = (Math.atan2(nx, ny) * 180 / Math.PI + 360) % 360, r = ["noord", "oost", "zuid", "west"][Math.round(az / 90) % 4]; gevels[r] = (gevels[r] || 0) + A; } });
    /* gevelvlakken voor het rechtzetten van een foto: per vrije buitenmuur de breedte en de hoogte op beide hoeken (en de punt bij een puntgevel) */
    const muren = []; shell.forEach((s, i) => { if (st[sv[i]] && st[sv[i]].type === "WallSurface") muren.push(s[0].map(k => V[k])); });
    let fp = hoofd.voet.map(q => [q[0], q[1]]); { let A2 = 0; for (let i = 0; i < fp.length; i++) { const p = fp[i], q = fp[(i + 1) % fp.length]; A2 += p[0] * q[1] - q[0] * p[1]; } if (A2 < 0) fp = fp.reverse(); }
    let zijden = fp.map((p, i) => [p, fp[(i + 1) % fp.length]]);
    for (let n = 0; n < 30; n++) { let ok = false; for (let i = 0; i < zijden.length && zijden.length > 3; i++) { const [a1, b1] = zijden[i], [a2, b2] = zijden[(i + 1) % zijden.length];
        const ux = b1[0] - a1[0], uy = b1[1] - a1[1], vx = b2[0] - a2[0], vy = b2[1] - a2[1]; if ((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy)) > 0.998) { zijden[i] = [a1, b2]; zijden.splice((i + 1) % zijden.length, 1); ok = true; break; } } if (!ok) break; }
    const vlakken = [];
    zijden.forEach(([A, B]) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 1.5 || tegenBuur(A, B)) return; const ex = (B[0] - A[0]) / L, ey = (B[1] - A[1]) / L;
      /* alleen muurdelen die helemaal in dit vlak liggen (niet de muur om de hoek) */
      const pts = muren.map(P => P.map(q => ({ u: (q[0] - A[0]) * ex + (q[1] - A[1]) * ey, d: Math.abs((q[0] - A[0]) * ey - (q[1] - A[1]) * ex), z: q[2] }))).filter(P => P.every(q => q.d < 0.4 && q.u > -0.4 && q.u < L + 0.4)).flat();
      if (pts.length < 4) return; const z0 = Math.min(...pts.map(q => q.z)), hoog = f => { const z = pts.filter(f).map(q => q.z); return z.length ? Math.max(...z) - z0 : 0; };
      const hL = hoog(q => q.u < 0.4), hR = hoog(q => q.u > L - 0.4), top = pts.reduce((m, q) => q.z > m.z ? q : m, pts[0]);
      if (hL < 1.5 || hR < 1.5) return;
      /* buitenkant: rechts van de rand bij een voetafdruk tegen de klok in */
      const az = (Math.atan2(ey, -ex) * 180 / Math.PI + 360) % 360, r = ["noord", "oost", "zuid", "west"][Math.round(az / 90) % 4];
      vlakken.push({ richting: r, w: Math.round(L * 100) / 100, hL: Math.round(hL * 100) / 100, hR: Math.round(hR * 100) / 100,
        ...(top.z - z0 > Math.max(hL, hR) + 0.6 && top.u > 0.5 && top.u < L - 0.5 ? { punt: { u: Math.round(top.u * 100) / 100, h: Math.round((top.z - z0) * 100) / 100 } } : {}) }); });
    vlakken.sort((p, q) => q.w * Math.max(q.hL, q.hR) - p.w * Math.max(p.hL, p.hR));
    const key = (a, b) => a < b ? a + "_" + b : b + "_" + a, cnt = {}; daken.forEach(r => r.forEach((v, i) => { const k = key(v, r[(i + 1) % r.length]); cnt[k] = (cnt[k] || 0) + 1; }));
    let randen = [];
    daken.forEach(r => { const zs = r.map(i => V[i][2]), zmin = Math.min(...zs), zmax = Math.max(...zs), plat = zmax - zmin < 0.15;
      r.forEach((v, i) => { const w = r[(i + 1) % r.length]; if (cnt[key(v, w)] > 1) return; const A = V[v], B = V[w], len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), dz = Math.abs(B[2] - A[2]);
        if (len < 0.4 || tegenBuur(A, B) || !opGevel(A, B)) return;
        const soort = plat ? "plat" : dz < 0.2 && Math.abs((A[2] + B[2]) / 2 - zmin) < 0.3 ? "goot" : dz >= 0.2 ? "windveer" : null; if (!soort) return;
        randen.push({ soort, A, B, len, hoogte: Math.round(Math.min(A[2], B[2]) * 10) / 10 }); }); });
    /* stukjes die van boven gezien in één rechte lijn liggen (het model knipt randen op, of de helling knikt) samenvoegen */
    const d3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    const evenwijdig = (p, q) => { const ux = p.B[0] - p.A[0], uy = p.B[1] - p.A[1], vx = q.B[0] - q.A[0], vy = q.B[1] - q.A[1], n = Math.hypot(ux, uy) * Math.hypot(vx, vy); return n > 0 && Math.abs(ux * vx + uy * vy) / n > 0.985; };
    for (let n = 0; n < 40; n++) { let ok = false;
      for (let i = 0; i < randen.length && !ok; i++) for (let k = i + 1; k < randen.length && !ok; k++) { const p = randen[i], q = randen[k];
        if (p.soort !== q.soort || !evenwijdig(p, q)) continue;
        const paren = [[p.B, q.A, p.A, q.B], [p.B, q.B, p.A, q.A], [p.A, q.A, p.B, q.B], [p.A, q.B, p.B, q.A]].find(z => d3(z[0], z[1]) < 0.15); if (!paren) continue;
        randen[i] = { ...p, A: paren[2], B: paren[3], len: p.len + q.len, hoogte: Math.min(p.hoogte, q.hoogte) }; randen.splice(k, 1); ok = true; }
      if (!ok) break; }
    randen = randen.filter(r => r.len >= 0.8).sort((p, q) => q.len - p.len);
    const a = hoofd.b.attributes || {};
    return { pand: hoofd.f.id, bouwjaar: a.oorspronkelijkbouwjaar || null, meetjaar: a.b3_pw_datum || null, dak: a.b3_dak_type || "", /* hoogtes boven de grond (3D BAG geeft ze t.o.v. NAP) */
      nokhoogte: a.b3_h_dak_max ? Math.round((a.b3_h_dak_max - (a.b3_h_maaiveld || 0)) * 10) / 10 : null, goothoogte: a.b3_h_dak_min ? Math.round((a.b3_h_dak_min - (a.b3_h_maaiveld || 0)) * 10) / 10 : null,
      randen: randen.map(r => ({ soort: r.soort, m: Math.round(r.len * 100) / 100, hoogte: Math.round((r.hoogte - (a.b3_h_maaiveld || 0)) * 10) / 10, p: [ll(r.A), ll(r.B)] })), voet: hoofd.voet.map(ll),
      vlakken, gevel: Math.round(gevel * 10) / 10, dakopp: Math.round(dak * 10) / 10, gevels: Object.fromEntries(Object.entries(gevels).map(([k, v]) => [k, Math.round(v * 10) / 10])),
      maaiveld: a.b3_h_maaiveld != null ? Math.round(a.b3_h_maaiveld * 10) / 10 : null };
  }
  const huis3d = onCall({ memory: "256MiB", timeoutSeconds: 30 }, async req => { await checkGebruiker(req.auth); return bereken(req.data || {}); });
  /* voor de dienstenwebshop op de website van een bedrijf: openbaar, alleen totalen (geen ligging), met een eenvoudige rem per bezoeker */
  const tellers = new Map();
  const huis3dWeb = onRequest({ cors: true, memory: "256MiB", timeoutSeconds: 30 }, async (req, res) => {
    const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim(), nu = Date.now(), t = (tellers.get(ip) || []).filter(v => nu - v < 600000);
    if (t.length >= 30) { res.status(429).json({ fout: "Even te veel opvragingen. Probeer het over een paar minuten opnieuw." }); return; }
    t.push(nu); tellers.set(ip, t); if (tellers.size > 5000) tellers.clear();
    const q = req.method === "POST" ? (req.body || {}) : req.query;
    try { const o = await bereken({ x: q.x, y: q.y, lat: q.lat, lng: q.lng });
      const som = s => Math.round(o.randen.filter(r => r.soort === s).reduce((a, r) => a + r.m, 0) * 100) / 100;
      res.set("Cache-Control", "public, max-age=86400").json({ goot: som("goot"), windveer: som("windveer"), plat: som("plat"), gevel: o.gevel, dakopp: o.dakopp, goothoogte: o.goothoogte, nokhoogte: o.nokhoogte, maaiveld: o.maaiveld, bouwjaar: o.bouwjaar, meetjaar: o.meetjaar, dak: o.dak }); }
    catch (e) { res.status(e.code === "not-found" ? 404 : e.code === "invalid-argument" ? 400 : 503).json({ fout: e.message || "Niet beschikbaar" }); }
  });
  return { huis3d, huis3dWeb };
};
