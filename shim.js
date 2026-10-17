/* mijnschoonmaker CRM — koppeling met Firebase (login, database, opslag, downloads).
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

  const db = {
    collection: c => ({
      doc: id => ({ set: d => fs.collection(c).doc(id).set(enc(d)), delete: () => fs.collection(c).doc(id).delete() }),
      onSnapshot: (cb, er) => fs.collection(c).onSnapshot(s => {
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
  let klaar; const ingelogd = new Promise(r => (klaar = r));
  const user = { me: async () => { const u = auth.currentUser || {}; return { name: u.displayName || String(u.email || "").split("@")[0], email: u.email || "" }; } };
  window.claude = { use: async n => { await ingelogd; return { db, assets, downloads, user }[n] || null; } };

  /* ---------- inlogscherm ---------- */
  const css = `.lg-ov{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:20px;background:radial-gradient(900px 500px at 80% -10%,rgb(240 170 110 / .12),transparent 60%),radial-gradient(800px 500px at 10% 0%,rgb(19 122 138 / .12),transparent 60%),#f3f6f7;font-family:Manrope,system-ui,-apple-system,sans-serif;color:#0f1f26}
  .lg-c{width:min(400px,100%);background:#fff;border-radius:24px;padding:32px 28px;box-shadow:0 1px 2px rgb(15 31 38 / .05),0 24px 60px -20px rgb(15 31 38 / .25)}
  .lg-logo{display:flex;justify-content:center;margin:-4px 0 22px}.lg-logo img{height:84px;width:auto;max-width:200px;object-fit:contain}.lg-logo span{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#137a8a,#1d5a74);display:grid;place-items:center}.lg-logo svg{width:22px;height:22px}
  .lg-c h1{font-family:Inter,Manrope,sans-serif;font-size:26px;letter-spacing:-.02em;margin:0 0 6px}.lg-c p{color:#5d6f76;margin:0 0 20px;font-size:14.5px;line-height:1.5}
  .lg-c label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:700;margin-bottom:14px}
  .lg-c input{font:inherit;font-size:15px;font-weight:500;padding:12px 14px;border:1px solid #dde5e8;border-radius:12px;background:#fbfcfc;outline:none}.lg-c input:focus{border-color:#137a8a;box-shadow:0 0 0 3px rgb(19 122 138 / .15)}
  .lg-b{width:100%;font:inherit;font-weight:700;font-size:15px;padding:13px;border:0;border-radius:12px;color:#fff;background:linear-gradient(135deg,#137a8a,#1d5a74);cursor:pointer;margin-top:4px}.lg-b:disabled{opacity:.6}
  .lg-l{background:none;border:0;font:inherit;font-size:13.5px;font-weight:600;color:#137a8a;cursor:pointer;padding:0}.lg-row{display:flex;justify-content:space-between;margin-top:16px}
  .lg-m{font-size:13.5px;min-height:20px;margin-top:12px;color:#c0392b;font-weight:600}.lg-m.ok{color:#23845a}`;
  const mark = '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2.5" stroke="#fff" stroke-width="1.8"/><path d="M12 4v16M4 12h16" stroke="#fff" stroke-width="1.2" opacity=".55"/><path d="M7 17L17 7" stroke="#ebbd4c" stroke-width="2.6" stroke-linecap="round"/></svg>';
  let ov = null;
  const toon = html => {
    if (!ov) { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); ov = document.createElement("div"); ov.className = "lg-ov"; document.body.appendChild(ov); }
    ov.style.display = "grid"; ov.innerHTML = `<div class="lg-c"><div class="lg-logo"><img src="/logo.png" alt="mijnschoonmaker" onerror="this.remove()"></div>${html}</div>`;
  };
  const $ = s => ov.querySelector(s), msg = (t, ok) => { const m = $(".lg-m"); if (m) { m.textContent = t; m.className = "lg-m" + (ok ? " ok" : ""); } };
  const NL = { "auth/invalid-credential": "E-mailadres of wachtwoord klopt niet.", "auth/wrong-password": "E-mailadres of wachtwoord klopt niet.", "auth/user-not-found": "E-mailadres of wachtwoord klopt niet.", "auth/too-many-requests": "Te veel pogingen. Probeer het over een paar minuten opnieuw.", "auth/email-already-in-use": "Er bestaat al een account met dit e-mailadres. Log in.", "auth/weak-password": "Kies een wachtwoord van minimaal 8 tekens.", "auth/invalid-email": "Controleer het e-mailadres.", "auth/network-request-failed": "Geen internetverbinding." };
  const fout = e => msg(NL[e.code] || "Er ging iets mis (" + (e.code || e.message) + ").");

  function login(nieuw) {
    toon(`<h1>${nieuw ? "Account maken" : "Inloggen"}</h1><p>${nieuw ? "Gebruik het e-mailadres waarmee je bent toegevoegd aan het CRM." : "Welkom terug. Log in om verder te gaan."}</p>
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
    toon(`<h1>Inlogcode</h1><p>${herstel ? "Vul een van je herstelcodes in (bijvoorbeeld <b>a1b2c-3d4e5</b>). Elke herstelcode werkt één keer." : "Open je authenticator-app (bijvoorbeeld Google Authenticator) en vul de 6 cijfers in voor <b>mijnschoonmaker CRM</b>."}</p>
      <form id="lgF"><label>${herstel ? "Herstelcode" : "Code"}<input id="lgC" ${herstel ? 'autocomplete="off" placeholder="xxxxx-xxxxx"' : 'inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]*" maxlength="7" placeholder="123 456"'} required style="letter-spacing:${herstel ? ".05em" : ".3em"};font-size:20px;text-align:center"></label>
      <button class="lg-b" id="lgGo">Bevestigen</button></form><div class="lg-m"></div>
      <div class="lg-row"><button class="lg-l" id="lgHs">${herstel ? "Code uit de app gebruiken" : "Telefoon kwijt? Herstelcode gebruiken"}</button><button class="lg-l" id="lgOut">Uitloggen</button></div>`);
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
  async function start(u) {
    if (await mfaNodig(u)) return mfaScherm(u, false);
    try { await Promise.race([fs.collection("instellingen").limit(1).get(), new Promise((_, nee) => setTimeout(() => nee({ code: "traag" }), 8000))]); }
    catch (e) { if (e.code === "permission-denied") return geenToegang(u); }
    if (ov) ov.style.display = "none";
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
