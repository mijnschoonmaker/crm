/* Mansard CRM — koppeling met Firebase (login, database, opslag, downloads).
   Biedt hetzelfde window.claude.use(...) als de oude versie, zodat de CRM-code gelijk blijft. */
(function () {
  window.ZEEM_LIVE = true;
  firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth(), fs = firebase.firestore(), st = firebase.storage();
  fs.settings({ ignoreUndefinedProperties: true });
  /* offline-opslag; staat uit als die eerder vastliep (Safari laat de browseropslag soms hangen na het heropenen van een tabblad) */
  let geenCache = false; try { geenCache = localStorage.getItem("ms.geenCache") === "1"; } catch (e) {}
  if (!geenCache) fs.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  window.ZEEM_HERSTEL = async () => { try { localStorage.setItem("ms.geenCache", "1"); } catch (e) {}
    try { await fs.terminate(); await fs.clearPersistence(); } catch (e) {} location.reload(); };   // werkt ook even zonder internet (bijv. onderweg)

  /* Firestore kent geen arrays in arrays: die pakken we in en weer uit */
  const enc = v => Array.isArray(v) ? (v.some(Array.isArray) ? { __arr: v.map(x => Array.isArray(x) ? { __a: x.map(enc) } : enc(x)) } : v.map(enc))
    : v && typeof v === "object" && !(v instanceof Date) ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, enc(x)])) : v;
  const dec = v => Array.isArray(v) ? v.map(dec)
    : v && typeof v === "object" ? (v.__arr ? v.__arr.map(x => x && x.__a ? x.__a.map(dec) : dec(x)) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;

  /* Mansard: elk bedrijf zijn eigen gegevens onder bedrijven/<id>/…; het eerste bedrijf (mijnschoonmaker.com) in de hoofdcollecties */
  const GLOBAAL = new Set(["gebruikers", "mfa", "bedrijven", "limiet", "aanmeldingen", "platform"]);
  window.ZEEM_BID = "mijnschoonmaker";
  const pf = p => { const s = String(p), top = s.split("/")[0]; return window.ZEEM_BID === "mijnschoonmaker" || GLOBAAL.has(top) ? s : "bedrijven/" + window.ZEEM_BID + "/" + s; };
  window.ZEEM_FS = new Proxy(fs, { get(t, k) {
    if (k === "collection") return p => t.collection(pf(p));
    if (k === "doc") return p => t.doc(pf(p));
    const v = t[k]; return typeof v === "function" ? v.bind(t) : v; } });
  const db = {
    collection: c => ({
      doc: id => ({ set: d => window.ZEEM_MEEKIJK ? Promise.reject(new Error("Meekijken is alleen lezen: er wordt niets opgeslagen.")) : fs.collection(pf(c)).doc(id).set(enc(d)),
        delete: () => window.ZEEM_MEEKIJK ? Promise.reject(new Error("Meekijken is alleen lezen: er wordt niets verwijderd.")) : fs.collection(pf(c)).doc(id).delete() }),
      onSnapshot: (cb, er) => fs.collection(pf(c)).onSnapshot(s => {
        try { cb({ docs: s.docs.map(d => ({ id: d.id, data: () => dec(d.data()) })) }); }
        catch (e) { console.error(c, e); (window.__fsErr = window.__fsErr || []).push(c + ": " + (e.message || e)); }
      }, e => { console.error(c, e); (window.__fsErr = window.__fsErr || []).push(c + " (laden): " + (e.code || e.message)); if (er) er(e); })
    })
  };
  const rid = () => [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, "0")).join("");
  window.ZEEM_PUT = (id, blob, type) => st.ref("assets/" + id).put(blob, { contentType: type || blob.type || "application/octet-stream" });
  const assets = {
    upload: async (file, o = {}) => { const id = rid(); await window.ZEEM_PUT(id, file, o.type || file.type); return { id }; },
    list: async () => { const r = await st.ref("assets").listAll(); return { assets: r.items.map(i => ({ id: i.name })) }; }
  };
  const downloads = {
    /* op iPhone/iPad opende Safari het bestand in hetzelfde tabblad; daarna gaf "terug" een foutmelding.
       Nu: deelscherm (Bewaar in Bestanden) als dat kan, anders als download (octet-stream) in een nieuw tabblad. */
    save: async ({ filename, data }) => {
      const b = data instanceof Blob ? data : new Blob([data], { type: "application/octet-stream" });
      const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (ios && navigator.canShare) {
        try { const f = new File([b], filename, { type: b.type || "application/octet-stream" });
          if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f] }); return; } }
        catch (e) { if (e && e.name === "AbortError") return; }
      }
      const u = URL.createObjectURL(b), a = document.createElement("a");
      a.href = u; a.download = filename; a.rel = "noopener"; if (ios) a.target = "_blank";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
    }
  };
  /* CRM pas tonen als duidelijk is dat je ingelogd bent (geen flits van de binnenkant) */
  document.documentElement.classList.add("lg-wacht");
  { const w = document.createElement("style"); w.textContent = "html.lg-wacht body>.app,html.lg-wacht #tabNav,html.lg-wacht body>.topbar{visibility:hidden!important}html.lg-wacht body{background:#f7f7f6}"; document.head.appendChild(w); }
  let klaar; const ingelogd = new Promise(r => (klaar = r));
  const user = { me: async () => { const u = auth.currentUser || {}; return { name: u.displayName || String(u.email || "").split("@")[0], email: u.email || "" }; } };
  window.claude = { use: async n => { await ingelogd; return { db, assets, downloads, user }[n] || null; } };

  /* ---------- inlogscherm ---------- */
  const css = `.lg-ov{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:20px;background:radial-gradient(75% 60% at 100% 0%,#f4f1eb 0%,transparent 62%),linear-gradient(160deg,#dfe5ea 0%,#eef0f2 45%,#f5f5f4 100%);font-family:"Avenir Next",Avenir,"Nunito Sans","Helvetica Neue",Arial,sans-serif;color:#0d121b}
  .lg-c{width:min(400px,100%);background:#fff;border-radius:14px;padding:36px 30px;border:1px solid #e3e5e8;box-shadow:0 30px 60px -36px rgb(13 18 27 / .35)}
  .lg-logo{display:flex;justify-content:center;margin:-4px 0 22px}.lg-logo img{height:84px;width:auto;max-width:200px;object-fit:contain}.lg-logo span{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#137a8a,#1d5a74);display:grid;place-items:center}.lg-logo svg{width:22px;height:22px}
  .lg-c h1{font-family:inherit;font-weight:500;font-size:20px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 8px}.lg-c p{color:#5d6168;margin:0 0 22px;font-size:14.5px;line-height:1.5}
  .lg-c label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#5d6168;margin-bottom:14px}
  .lg-c input{font:inherit;font-size:15px;font-weight:500;padding:12px 14px;border:1px solid #d6d9dd;border-radius:6px;background:#fff;outline:none;color:#0d121b;text-transform:none;letter-spacing:0}.lg-c input:focus{border-color:#0d121b;box-shadow:0 0 0 1px #0d121b}
  .lg-b{width:100%;font:inherit;font-weight:600;font-size:12px;letter-spacing:.22em;text-transform:uppercase;padding:15px;border:0;border-radius:6px;color:#fff;background:radial-gradient(130% 180% at 100% 0%,#3e4860 0%,transparent 60%),linear-gradient(135deg,#1c2231,#2a3245 60%,#1f2534);cursor:pointer;margin-top:6px}.lg-b:hover{background:#1b2130}.lg-b:disabled{opacity:.6}
  .lg-l{background:none;border:0;font:inherit;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#0d121b;cursor:pointer;padding:0;border:0;box-shadow:none;-webkit-appearance:none;appearance:none}.lg-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-top:18px}.lg-row .lg-l{text-align:left;line-height:1.5}.lg-row .lg-l:last-child{text-align:right;flex:none}.lg-row .lg-l:first-child:not(:last-child){flex:1 1 auto}
  .lg-m{font-size:13.5px;min-height:20px;margin-top:12px;color:#c0392b;font-weight:600}.lg-m.ok{color:#2f6b4f}.lg-m{color:#a23a30}`;
  const mark = '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2.5" stroke="#fff" stroke-width="1.8"/><path d="M12 4v16M4 12h16" stroke="#fff" stroke-width="1.2" opacity=".55"/><path d="M7 17L17 7" stroke="#ebbd4c" stroke-width="2.6" stroke-linecap="round"/></svg>';
  let ov = null;
  const toon = html => {
    if (!ov) { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); ov = document.createElement("div"); ov.className = "lg-ov"; document.body.appendChild(ov); }
    ov.style.display = "grid"; ov.innerHTML = `<div class="lg-c"><div class="lg-logo"><img src="/mansard-logo.png" alt="Mansard" onerror="this.remove()"></div>${html}</div>`;
  };
  const $ = s => ov.querySelector(s), msg = (t, ok) => { const m = $(".lg-m"); if (m) { m.textContent = t; m.className = "lg-m" + (ok ? " ok" : ""); } };
  const NL = { "auth/invalid-credential": "E-mailadres of wachtwoord klopt niet.", "auth/wrong-password": "E-mailadres of wachtwoord klopt niet.", "auth/user-not-found": "E-mailadres of wachtwoord klopt niet.", "auth/too-many-requests": "Te veel pogingen. Probeer het over een paar minuten opnieuw.", "auth/email-already-in-use": "Er bestaat al een account met dit e-mailadres. Log in.", "auth/weak-password": "Kies een wachtwoord van minimaal 8 tekens.", "auth/invalid-email": "Controleer het e-mailadres.", "auth/network-request-failed": "Geen internetverbinding." };
  const fout = e => msg(NL[e.code] || "Er ging iets mis (" + (e.code || e.message) + ").");

  function login(nieuw) {
    toon(`<h1>${nieuw ? "Account maken" : "Inloggen"}</h1><p>${nieuw ? "Nieuw bij Mansard? Maak een account en probeer 30 dagen gratis. Ben je uitgenodigd, gebruik dan dat e-mailadres." : "Welkom terug. Log in om verder te gaan."}</p>
      <form id="lgF"><label>E-mailadres<input type="email" id="lgE" autocomplete="username" required></label>
      <label>Wachtwoord<input type="password" id="lgP" autocomplete="${nieuw ? "new-password" : "current-password"}" minlength="${nieuw ? 8 : 1}" required></label>
      <button class="lg-b" id="lgGo">${nieuw ? "Account maken" : "Inloggen"}</button></form><div class="lg-m"></div>
      <div class="lg-row">${nieuw ? '<button class="lg-l" id="lgSw">Ik heb al een account</button><span></span>' : '<button class="lg-l" id="lgVg">Wachtwoord vergeten?</button><button class="lg-l" id="lgSw">Account maken</button>'}</div>`);
    $("#lgSw").onclick = () => login(!nieuw);
    const vg = $("#lgVg"); if (vg) vg.onclick = async () => { const e = $("#lgE").value.trim(); if (!e) return msg("Vul eerst je e-mailadres in."); try { await auth.sendPasswordResetEmail(e); msg("Je krijgt een mail om een nieuw wachtwoord te kiezen.", true); } catch (er) { fout(er); } };
    $("#lgF").onsubmit = async ev => {
      ev.preventDefault(); const b = $("#lgGo"); b.disabled = true; msg("");
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        if (nieuw) { const r = await auth.createUserWithEmailAndPassword($("#lgE").value.trim(), $("#lgP").value); await r.user.sendEmailVerification(); }
        else await auth.signInWithEmailAndPassword($("#lgE").value.trim(), $("#lgP").value);
      } catch (er) { fout(er); b.disabled = false; }
    };
    setTimeout(() => { const e = $("#lgE"); if (e) e.focus(); }, 50);
  }
  function bevestig(u) {
    toon(`<h1>Bevestig je e-mailadres</h1><p>We hebben een mail gestuurd naar <b>${u.email}</b>. Klik op de link in die mail en kom daarna hier terug.</p>
      <button class="lg-b" id="lgOk">Ik heb het bevestigd</button><div class="lg-m"></div>
      <div class="lg-row"><button class="lg-l" id="lgRe">Mail opnieuw sturen</button><button class="lg-l" id="lgOut">Uitloggen</button></div>`);
    $("#lgOk").onclick = async () => { await u.reload(); if (auth.currentUser.emailVerified) { await u.getIdToken(true); start(auth.currentUser); } else msg("Nog niet bevestigd. Kijk ook in je spam."); };
    $("#lgRe").onclick = async () => { try { await u.sendEmailVerification(); msg("Mail opnieuw verstuurd.", true); } catch (er) { fout(er); } };
    $("#lgOut").onclick = () => auth.signOut();
  }
  function geenToegang(u) {
    toon(`<h1>Nog geen toegang</h1><p>Je bent ingelogd als <b>${u.email}</b>, maar dit account is nog niet toegevoegd aan het CRM. Vraag de eigenaar om je toe te voegen bij Instellingen › Gebruikers.</p>
      <button class="lg-b" id="lgRt">Opnieuw proberen</button><div class="lg-row"><span></span><button class="lg-l" id="lgOut">Uitloggen</button></div>`);
    $("#lgRt").onclick = () => start(u); $("#lgOut").onclick = () => auth.signOut();
  }
  /* nog bij geen enkel bedrijf: zelf een bedrijf starten (30 dagen gratis) of wachten op een uitnodiging */
  function nieuwBedrijf(u) {
    toon(`<h1>Welkom bij Mansard</h1><p>Start je eigen omgeving en probeer alles <b>30 dagen gratis</b>. Geen betaalgegevens nodig.</p>
      <form id="lgF"><label>Naam van je bedrijf<input id="lgN" required maxlength="80" placeholder="Bijv. Glazenwasserij De Vries"></label>
      <label>Plaats<input id="lgPl" maxlength="60" placeholder="Bijv. Groningen"></label>
      <label>Telefoonnummer<input id="lgT" type="tel" maxlength="30" placeholder="06 12 34 56 78"></label>
      <button class="lg-b" id="lgGo">Start gratis proefperiode</button></form><div class="lg-m"></div>
      <p style="font-size:12.5px;color:#5d6f76;margin:14px 0 0">Daarna € 99 per maand inclusief 3 gebruikers, elke extra gebruiker € 19,95. Maandelijks opzegbaar. Werk je bij een bedrijf dat Mansard al gebruikt? Vraag dan de eigenaar om je toe te voegen; je hoeft hier niets in te vullen.</p>
      <div class="lg-row"><span></span><button class="lg-l" id="lgOut">Uitloggen</button></div>`);
    $("#lgOut").onclick = () => auth.signOut();
    $("#lgF").onsubmit = async ev => {
      ev.preventDefault(); const b = $("#lgGo"); b.disabled = true; msg("");
      try { await firebase.app().functions("europe-west4").httpsCallable("bedrijfAanmaken")({ naam: $("#lgN").value, plaats: $("#lgPl").value, telefoon: $("#lgT").value });
        msg("Je omgeving staat klaar. Even geduld…", true); setTimeout(() => location.reload(), 800); }
      catch (er) { msg((er && er.message) || "Aanmaken lukte niet."); b.disabled = false; }
    };
  }
  let gestart = false;
  /* tweestapsverificatie: staat het aan en is deze inlogsessie nog niet bevestigd, dan eerst de code uit de app */
  async function mfaNodig(u) {
    try {
      const m = await fs.collection("mfa").doc(String(u.email || "").toLowerCase()).get();
      if (!m.exists || m.data().aan !== true) return false;
      const t = await u.getIdTokenResult();
      const lijst = Array.isArray(t.claims.mfa) ? t.claims.mfa : [];
      return !lijst.includes(Number(t.claims.auth_time));
    } catch (e) { return false; }
  }
  function mfaScherm(u, herstel) {
    toon(`<h1>Inlogcode</h1><p>${herstel ? "Vul een van je herstelcodes in (bijvoorbeeld <b>a1b2c-3d4e5</b>). Elke herstelcode werkt één keer." : "Open je authenticator-app (bijvoorbeeld Google Authenticator) en vul de 6 cijfers in voor <b>Mansard CRM</b>."}</p>
      <form id="lgF"><label>${herstel ? "Herstelcode" : "Code"}<input id="lgC" ${herstel ? 'autocomplete="off" placeholder="xxxxx-xxxxx"' : 'inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]*" maxlength="7" placeholder="123 456"'} required style="letter-spacing:${herstel ? ".05em" : ".3em"};font-size:20px;text-align:center"></label>
      <button class="lg-b" id="lgGo">Bevestigen</button></form><div class="lg-m"></div>
      <div class="lg-row"><button class="lg-l" id="lgHs">${herstel ? "Code uit de app gebruiken" : "Herstelcode gebruiken"}</button><button class="lg-l" id="lgOut">Uitloggen</button></div>`);
    $("#lgHs").onclick = () => mfaScherm(u, !herstel);
    $("#lgOut").onclick = () => auth.signOut();
    const inp = $("#lgC"); setTimeout(() => inp.focus(), 50);
    if (!herstel) inp.oninput = () => { if (inp.value.replace(/\D/g, "").length === 6) $("#lgF").requestSubmit(); };
    $("#lgF").onsubmit = async ev => {
      ev.preventDefault(); const b = $("#lgGo"); if (b.disabled) return; b.disabled = true; msg("");
      try {
        const r = await firebase.app().functions("europe-west4").httpsCallable("mfaControle")({ code: inp.value });
        await u.getIdToken(true);
        if (r.data && r.data.viaHerstel) { try { sessionStorage.setItem("ms.herstelOver", String(r.data.overHerstel)); } catch (e) {} }
        start(u);
      } catch (er) { msg((er && er.message) || "Die code klopt niet."); b.disabled = false; inp.select(); }
    };
  }

  /* ---------- Mansard-beheer (robin@mansard.nl): los van het eigen glazenwassersbedrijf ---------- */
  const BEHEER = "robin@mansard.nl";
  const bcss = `.bh{position:fixed;inset:0;z-index:2147483600;overflow:auto;background:#f5f5f4;font-family:"Avenir Next",Avenir,"Nunito Sans","Helvetica Neue",system-ui,sans-serif;color:#0d121b}
  .bh-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:16px;padding:16px 28px;color:#fff;background:repeating-linear-gradient(115deg,rgb(255 255 255 / .018) 0 1px,transparent 1px 26px),radial-gradient(120% 140% at 100% 0%,#4a5670 0%,transparent 55%),linear-gradient(135deg,#1a1f2c 0%,#2a3245 55%,#1d2332 100%)}
  .bh-top img{height:26px;filter:brightness(0) invert(1)}.bh-tag{font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#1d2332;background:linear-gradient(90deg,#c9a46a,#ecd3a3);padding:6px 12px;border-radius:999px}
  .bh-top .sp{flex:1}.bh-top small{color:rgb(255 255 255 / .7);font-size:13px}.bh-btn{font:inherit;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;padding:10px 16px;border-radius:8px;border:1px solid #d6d9dd;background:#fff;color:#0d121b;cursor:pointer}
  .bh-top .bh-btn{background:rgb(255 255 255 / .1);border-color:rgb(255 255 255 / .25);color:#fff}.bh-btn.pri{background:linear-gradient(135deg,#1c2231,#2a3245);color:#fff;border:0}
  .bh-in{max-width:1180px;margin:0 auto;padding:28px}.bh-in h1{font-weight:400;font-size:32px;margin:0 0 4px}.bh-in>p{color:#5d6168;margin:0 0 22px}
  .bh-st{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}.bh-st div{background:#fff;border:1px solid #e3e5e8;border-radius:12px;padding:16px 18px}.bh-st small{display:block;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#7a7e84}.bh-st b{font-size:28px;font-weight:400}
  .bh-k{background:#fff;border:1px solid #e3e5e8;border-radius:14px;padding:6px 0;margin-bottom:22px;overflow-x:auto}.bh-k h2{font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;margin:14px 20px 8px}
  .bh-t{width:100%;border-collapse:collapse;font-size:14px}.bh-t th{text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#7a7e84;padding:10px 20px;border-bottom:1px solid #eef0f2}.bh-t td{padding:12px 20px;border-bottom:1px solid #f2f3f5;vertical-align:middle}.bh-t tr:last-child td{border-bottom:0}.bh-t td small{display:block;color:#7a7e84;font-size:12px}
  .bh-p{display:inline-block;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;background:#eef0f3;color:#3e4a64}.bh-p.ok{background:#e4f3ea;color:#2f6b4f}.bh-p.proef{background:#f6efe2;color:#8a6d43}.bh-p.late{background:#f7e4e1;color:#a23a30}
  .bh-f{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;padding:6px 20px 18px}.bh-f label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5d6168;flex:1;min-width:240px}.bh-f input{font:inherit;font-size:14px;padding:11px 12px;border:1px solid #d6d9dd;border-radius:6px;text-transform:none;letter-spacing:0}
  .bh-n{padding:0 20px 16px;color:#5d6168;font-size:13.5px;line-height:1.5;margin:0}.bh-leeg{padding:22px 20px;color:#7a7e84}
  @media (max-width:760px){.bh-st{grid-template-columns:1fr 1fr}.bh-in{padding:18px}.bh-top{padding:14px 16px;flex-wrap:wrap}}
  .mk-balk{position:fixed;left:0;right:0;top:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;gap:14px;padding:8px 16px;background:linear-gradient(90deg,#c9a46a,#ecd3a3);color:#1d2332;font:600 13px/1.3 "Avenir Next",Avenir,system-ui,sans-serif}
  .mk-balk button{font:inherit;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:6px 12px;border-radius:6px;border:0;background:#1d2332;color:#fff;cursor:pointer}html.mk body{padding-top:38px}html.mk .topbar{top:38px}`;
  const bEsc = v => String(v == null ? "" : v).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const bDat = d => d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const bEur = n => "€ " + (Number(n) || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function meekijkBalk() {
    const zet = () => { document.documentElement.classList.add("mk"); if (!document.getElementById("bhCss")) { const s = document.createElement("style"); s.id = "bhCss"; s.textContent = bcss; document.head.appendChild(s); }
      let b = document.getElementById("mkBalk"); if (!b) { b = document.createElement("div"); b.id = "mkBalk"; b.className = "mk-balk"; document.body.appendChild(b); }
      b.innerHTML = `<span>Mansard-beheer · je kijkt mee bij <b>${bEsc(window.ZEEM_MEEKIJK)}</b> · alleen lezen</span><button type="button" id="mkTerug">Terug naar beheer</button>`;
      document.getElementById("mkTerug").onclick = () => { try { sessionStorage.removeItem("ms.meekijk"); } catch (x) {} location.reload(); }; };
    document.body ? zet() : document.addEventListener("DOMContentLoaded", zet, { once: true });
  }
  async function beheerScherm(u) {
    if (ov) ov.style.display = "none";
    if (!document.getElementById("bhCss")) { const s = document.createElement("style"); s.id = "bhCss"; s.textContent = bcss; document.head.appendChild(s); }
    let el = document.getElementById("bhScherm"); if (!el) { el = document.createElement("div"); el.id = "bhScherm"; el.className = "bh"; document.body.appendChild(el); }
    el.innerHTML = `<div class="bh-top"><img src="/mansard-logo.png" alt="Mansard" onerror="this.remove()"><span class="bh-tag">Mansard beheer</span><span class="sp"></span><small>${bEsc(u.email)}</small><button class="bh-btn" id="bhUit">Uitloggen</button></div><div class="bh-in"><p class="bh-leeg">Laden…</p></div>`;
    document.getElementById("bhUit").onclick = () => auth.signOut();
    let bs = [], gs = [];
    try { bs = (await fs.collection("bedrijven").get()).docs.map(d => ({ id: d.id, ...d.data() })); } catch (x) { console.error(x); }
    try { gs = (await fs.collection("gebruikers").get()).docs.map(d => ({ id: d.id, ...d.data() })); } catch (x) {}
    const n = b => gs.filter(g => g.bedrijf === b.id).length || b.gebruikers || 0, v = new Date().toISOString().slice(0, 10);
    const st = b => b.status === "actief" ? (b.achterstand ? ["late", "Betaling mislukt"] : ["ok", "Actief"]) : b.status === "proef" ? (String(b.proefTot || "") >= v ? ["proef", "Proef"] : ["late", "Proef verlopen"]) : b.status === "opgezegd" ? ["", "Opgezegd"] : ["late", b.status || "—"];
    bs.sort((a, b) => String(b.aangemaakt || "").localeCompare(String(a.aangemaakt || "")));
    const act = bs.filter(b => b.status === "actief"), proef = bs.filter(b => b.status === "proef" && String(b.proefTot || "") >= v), mrr = act.reduce((a, b) => a + (Number(b.bedrag) || 0), 0);
    el.querySelector(".bh-in").innerHTML = `<h1>Bedrijven op Mansard</h1><p>Hier werk je namens Mansard. Je eigen glazenwasserij (mijnschoonmaker.com) open je door in te loggen met robin@mijnschoonmaker.com.</p>
      <div class="bh-st"><div><small>Bedrijven</small><b>${bs.length}</b></div><div><small>In proefperiode</small><b>${proef.length}</b></div><div><small>Actief abonnement</small><b>${act.length}</b></div><div><small>Per maand</small><b>${bEur(mrr)}</b></div></div>
      <div class="bh-k"><h2>Klanten van Mansard</h2>${bs.length ? `<table class="bh-t"><tr><th>Bedrijf</th><th>Eigenaar</th><th>Status</th><th>Proef / volgende</th><th>Gebruikers</th><th>Sinds</th><th></th></tr>${bs.map(b => { const s = st(b); return `<tr><td><b>${bEsc(b.naam || b.id)}</b><small>${bEsc(b.plaats || "")}${b.telefoon ? " · " + bEsc(b.telefoon) : ""}</small></td><td>${bEsc(b.eigenaar || "")}</td><td><span class="bh-p ${s[0]}">${bEsc(s[1])}</span></td><td>${bDat(b.status === "proef" ? b.proefTot : b.volgende || b.betaaldTot)}${b.bedrag ? `<small>${bEur(b.bedrag)} p/m</small>` : ""}</td><td>${n(b)}</td><td>${bDat(b.aangemaakt)}</td><td><button class="bh-btn" data-mk="${bEsc(b.id)}" data-naam="${bEsc(b.naam || b.id)}">Meekijken</button></td></tr>`; }).join("")}</table>` : `<p class="bh-leeg">Nog geen andere bedrijven aangemeld.</p>`}</div>
      <div class="bh-k"><h2>Abonnementen innen (Mollie)</h2><p class="bh-n">De Mollie-sleutel van het profiel <b>Mansard</b>, waarmee glazenwassers hun abonnement betalen. Hij wordt veilig op de server bewaard en is daarna niet meer te lezen.</p>
        <div class="bh-f"><label>Mollie API-sleutel Mansard<input type="password" id="bhKey" placeholder="live_… of test_…" autocomplete="off"></label><button class="bh-btn pri" id="bhKeyOk">Opslaan</button></div></div>
      <div class="bh-k"><h2>Tweestapsverificatie</h2><div id="bhMfa"><p class="bh-n">Laden…</p></div></div>
      <div class="bh-k"><h2>Kaartfoto's instellingen</h2><p class="bh-n">De foto's op de instellingenkaarten gelden voor alle bedrijven in dezelfde branche. Plaats ze door bij een bedrijf mee te kijken en in Instellingen op een kaart te tikken.</p></div>`;
    bhMfa();
    el.querySelectorAll("[data-mk]").forEach(b => b.onclick = () => { try { sessionStorage.setItem("ms.meekijk", JSON.stringify({ bid: b.dataset.mk, naam: b.dataset.naam })); } catch (x) {} location.reload(); });
    document.getElementById("bhKeyOk").onclick = async () => { const k = document.getElementById("bhKey").value.trim(), b = document.getElementById("bhKeyOk");
      if (!/^(live|test)_/.test(k)) { alert("Een Mollie-sleutel begint met live_ of test_"); return; }
      b.disabled = true; try { await fs.doc("platform/geheim").set({ mansardMollieKey: k, gewijzigd: new Date().toISOString() }, { merge: true }); document.getElementById("bhKey").value = ""; b.textContent = "Opgeslagen"; } catch (x) { b.disabled = false; b.textContent = "Opnieuw"; console.error(x); } };
    document.documentElement.classList.remove("lg-wacht");
  }

  async function bhMfa() {
    const box = document.getElementById("bhMfa"), fn = n => firebase.app().functions("europe-west4").httpsCallable(n);
    let st = {}; try { st = (await fn("mfaStatus")({})).data || {}; } catch (x) {}
    if (st.aan) { box.innerHTML = `<p class="bh-n"><span class="bh-p ok">Aan</span> Bij elke nieuwe inlog vraagt Mansard om een code uit je authenticator-app.</p>`; return; }
    box.innerHTML = `<p class="bh-n">Dit account kan bij alle bedrijven meekijken. Zet tweestapsverificatie aan: bij inloggen is dan ook een code uit je telefoon nodig.</p><div class="bh-f"><button class="bh-btn pri" id="bhMfaGo">Tweestapsverificatie aanzetten</button></div>`;
    document.getElementById("bhMfaGo").onclick = async () => {
      let r; try { r = (await fn("mfaStart")({})).data; } catch (x) { alert((x && x.message) || "Lukt nu niet"); return; }
      box.innerHTML = `<ol class="bh-n" style="padding-left:38px"><li>Installeer een authenticator-app (Google Authenticator, Microsoft Authenticator of de Wachtwoorden-app van je iPhone).</li>
        <li>Scan deze QR-code:<div id="bhQr" style="width:180px;margin:10px 0"></div>Of vul de sleutel in: <code>${bEsc(r.secret.replace(/(.{4})/g, "$1 ").trim())}</code></li>
        <li>Vul de 6 cijfers in:</li></ol><div class="bh-f"><label>Code<input id="bhCode" inputmode="numeric" maxlength="7" autocomplete="one-time-code"></label><button class="bh-btn pri" id="bhAct">Aanzetten</button></div>`;
      const qr = () => { try { const q = window.qrcode(0, "M"); q.addData(r.uri); q.make(); document.getElementById("bhQr").innerHTML = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch (x) {} };
      if (window.qrcode) qr(); else { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"; sc.onload = qr; document.head.appendChild(sc); }
      document.getElementById("bhAct").onclick = async () => {
        try { const h = (await fn("mfaActiveer")({ code: document.getElementById("bhCode").value })).data.herstel || []; await auth.currentUser.getIdToken(true);
          box.innerHTML = `<p class="bh-n"><span class="bh-p ok">Aan</span> Bewaar deze herstelcodes veilig (elke code werkt één keer, je ziet ze maar één keer):</p><p class="bh-n" style="font-family:monospace;font-size:15px;line-height:1.9">${h.map(bEsc).join("<br>")}</p>`;
        } catch (x) { alert((x && x.message) || "Die code klopt niet"); } };
    };
  }
  async function start(u) {
    if (await mfaNodig(u)) return mfaScherm(u, false);
    const e = String(u.email || "").toLowerCase();
    if (e === BEHEER) {
      /* Mansard-beheer: geen eigen bedrijf. Standaard het beheerscherm; bij "Meekijken" alleen-lezen het CRM van dat bedrijf */
      let mk = null; try { mk = JSON.parse(sessionStorage.getItem("ms.meekijk") || "null"); } catch (x) {}
      if (!mk || !/^b[a-z0-9]{7}$/.test(mk.bid || "")) return beheerScherm(u);
      window.ZEEM_BID = mk.bid; window.ZEEM_ROL = "meekijk"; window.ZEEM_MEEKIJK = mk.naam || mk.bid; meekijkBalk();
    } else if (e !== "robin@mijnschoonmaker.com") {
      let g = null; try { g = await fs.collection("gebruikers").doc(e).get(); } catch (x) {}
      if (!g || !g.exists) return nieuwBedrijf(u);
      const b = String(g.data().bedrijf || ""); window.ZEEM_BID = /^b[a-z0-9]{7}$/.test(b) ? b : "mijnschoonmaker";
      window.ZEEM_ROL = g.data().rol || "";
    }
    try { await Promise.race([fs.collection(pf("instellingen")).limit(1).get(), new Promise((_, nee) => setTimeout(() => nee({ code: "traag" }), 8000))]); }
    catch (e) { if (e.code === "permission-denied") return geenToegang(u); }
    if (ov) ov.style.display = "none";
    document.documentElement.classList.remove("lg-wacht");
    if (!gestart) { gestart = true; klaar(u); voegUitloggenToe(); }
  }
  function voegUitloggenToe() {
    const put = () => { const c = document.getElementById("userCard"); if (c && !c.querySelector(".lg-out")) { const b = document.createElement("button"); b.type = "button"; b.className = "lg-out"; b.textContent = "Uitloggen"; b.style.cssText = "all:unset;cursor:pointer;font-size:12px;font-weight:700;color:var(--muted);margin-left:auto;padding:4px 8px;border-radius:8px"; b.onclick = e => { e.stopPropagation(); auth.signOut(); }; c.appendChild(b); } };
    new MutationObserver(put).observe(document.body, { childList: true, subtree: true }); put();
  }
  const naDom = f => document.body ? f() : document.addEventListener("DOMContentLoaded", f, { once: true });
  auth.onAuthStateChanged(u => naDom(() => {
    if (!u) { if (gestart) location.reload(); else login(false); return; }
    if (!u.emailVerified) return bevestig(u);
    start(u);
  }));
})();
