/* Aanboddatum per verdieping die na het afmelden niet is doorgeschoven (fout tot 27-10-2026).
   MODE=kijk (standaard): alleen tonen. MODE=herstel: zet zo'n datum op laatste bezoek + frequentie. Verder verandert er niets. */
const admin = require("../functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: process.env.P });
const db = admin.firestore();
const herstel = process.env.MODE === "herstel";
const plus = (d, w) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + Number(w) * 7); return x.toISOString().slice(0, 10); };
const arr = v => Array.isArray(v) ? v : v && v.__arr ? v.__arr.map(x => x && x.__a ? x.__a : x) : [];
(async () => {
  const ks = await db.collection("klanten").get(); const uit = []; let n = 0;
  for (const d of ks.docs) {
    const k = d.data(), q = k.ramenRegel; if (!q || !k.laatst) continue;
    const f = arr(q.f), fq = arr(q.fq), vol = arr(q.vol).slice(), kf = arr(q.kf), kfq = arr(q.kfq), kvol = arr(q.kvol).slice();
    const wijz = [];
    f.forEach((c, i) => { if (!Number(c)) return;
      if (fq[i] && vol[i] && vol[i] <= k.laatst) { const nw = plus(k.laatst, fq[i]); wijz.push("verd." + i + " " + vol[i] + "→" + nw); vol[i] = nw; }
      if (kf[i] && kfq[i] && kvol[i] && kvol[i] <= k.laatst) { const nw = plus(k.laatst, kfq[i]); wijz.push("kozijn " + i + " " + kvol[i] + "→" + nw); kvol[i] = nw; } });
    if (!wijz.length) continue; n++;
    uit.push((k.naam || d.id).slice(0, 40) + " · " + (k.adres || "") + " · laatst " + k.laatst + " · " + wijz.join(", "));
    if (herstel) await d.ref.set({ ramenRegel: { ...q, vol, ...(q.kvol ? { kvol } : {}) } }, { merge: true });
  }
  uit.unshift((herstel ? "HERSTELD: " : "GEVONDEN: ") + n + " klanten");
  uit.forEach((t, i) => console.log("::notice title=Aanbod " + (i + 1) + "::" + t));
})().catch(x => { console.error(x); process.exit(1); });
