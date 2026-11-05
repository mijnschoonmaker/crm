/* Alleen lezen: ligt een adres binnen het postcodevlak dat het CRM tekent? Vergelijkt PDOK-locatieserver en CBS postcode4. */
const PC = process.env.PC || "9765", Q = process.env.Q || "Burgemeester J.G. Legroweg 13 9765AD Paterswolde";
const n = (...a) => console.log("::notice title=PC::" + a.join(" "));
const inPoly = (x, y, ring) => { let b = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) b = !b; } return b; };
const inGeom = (x, y, g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []).some(p => inPoly(x, y, p[0]) && !p.slice(1).some(h => inPoly(x, y, h)));
(async () => {
  const a = await (await fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&fl=weergavenaam,centroide_ll&q=" + encodeURIComponent(Q))).json();
  const d = a.response.docs[0], m = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(d.centroide_ll); const x = +m[1], y = +m[2]; n("adres", d.weergavenaam, x, y);
  const j = await (await fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:postcode&rows=5&fl=postcode,centroide_ll&q=" + PC)).json();
  const p = j.response.docs.find(z => String(z.postcode).startsWith(PC)), pm = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(p.centroide_ll); n("gekozen pc6", p.postcode, pm[1], pm[2]);
  const e = .0015, r = await (await fetch(`https://api.pdok.nl/cbs/postcode4/ogc/v1/collections/postcode4/items?f=json&limit=50&bbox=${+pm[1] - e},${+pm[2] - e},${+pm[1] + e},${+pm[2] + e}`)).json();
  (r.features || []).forEach(f => n("feature", f.properties.postcode, "jaar", f.properties.jaarcode, f.geometry.type, "delen", f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.length : 1, "adres binnen:", inGeom(x, y, f.geometry)));
  const r2 = await (await fetch(`https://api.pdok.nl/cbs/postcode4/ogc/v1/collections/postcode4/items?f=json&limit=20&bbox=${x - .0005},${y - .0005},${x + .0005},${y + .0005}`)).json();
  (r2.features || []).forEach(f => n("rond adres", f.properties.postcode, "jaar", f.properties.jaarcode, "adres binnen:", inGeom(x, y, f.geometry)));
  const c = await (await fetch("https://api.pdok.nl/cbs/postcode4/ogc/v1/collections")).json(); n("collecties", (c.collections || []).map(z => z.id).join(","));
})().catch(e => { console.error(e); process.exit(1); });
