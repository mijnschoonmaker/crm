/* Alleen lezen: welke zoomniveaus en lagen heeft de PDOK-luchtfoto (WMTS en WMS)? */
const n = (...a) => console.log("::notice title=Lucht::" + a.join(" "));
(async () => {
  const w = await (await fetch("https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0?request=GetCapabilities&service=WMTS")).text();
  const lagen = [...w.matchAll(/<ows:Identifier>([^<]+)<\/ows:Identifier>/g)].map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i);
  n("WMTS identifiers:", lagen.slice(0, 40).join(", "));
  const tm = w.split("<TileMatrixSet>").find(x => x.includes("EPSG:3857")) || ""; const lv = [...tm.matchAll(/<ows:Identifier>(\d+)<\/ows:Identifier>/g)].map(m => +m[1]); n("EPSG:3857 niveaus:", lv.length ? Math.min(...lv) + "-" + Math.max(...lv) : "?");
  for (const z of [19, 20, 21]) { const x = Math.floor((6.56 + 180) / 360 * 2 ** z), la = 53.14 * Math.PI / 180, y = Math.floor((1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * 2 ** z);
    const r = await fetch(`https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/${z}/${x}/${y}.jpeg`); n("WMTS z" + z, r.status, r.headers.get("content-type"), (await r.arrayBuffer()).byteLength); }
  const c = await (await fetch("https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0?request=GetCapabilities&service=WMS")).text();
  n("WMS lagen:", [...c.matchAll(/<Name>([^<]+)<\/Name>/g)].map(m => m[1]).slice(0, 30).join(", "));
  const b = [6.5675, 53.1430, 6.5690, 53.1440];
  const r = await fetch(`https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0?service=WMS&request=GetMap&version=1.3.0&layers=Actueel_orthoHR&styles=&crs=CRS:84&bbox=${b.join(",")}&width=512&height=512&format=image/jpeg`);
  n("WMS GetMap", r.status, r.headers.get("content-type"), (await r.arrayBuffer()).byteLength);
})().catch(e => { console.error(e); process.exit(1); });
