/* ---------- Beveiliging & back-ups (alleen online CRM) ----------
   Tweestapsverificatie met een authenticator-app voor CRM-gebruikers (niet voor het klantportaal),
   en dagelijkse back-ups van alle gegevens (server: functions/beveiliging.js). */
const VG={st:null,lijst:null,laatst:null};
async function vgLaad(){try{VG.st=(await fbFn("mfaStatus")()).data}catch(e){VG.st={fout:fnFout(e)}}
  if(LIVE&&vgEigenaar())try{VG.lijst=(await fbFn("backupLijst")()).data.lijst}catch(e){VG.lijst=null}}
const vgEigenaar=()=>String((window.firebase&&firebase.auth().currentUser||{}).email||"").toLowerCase()==="robin@mijnschoonmaker.com";
function vgKb(b){return b>1048576?(b/1048576).toFixed(1).replace(".",",")+" MB":Math.max(1,Math.round(b/1024))+" kB"}
function vgQr(tekst,el){const t=()=>{try{const q=window.qrcode(0,"M");q.addData(tekst);q.make();el.innerHTML=q.createSvgTag({cellSize:5,margin:2,scalable:true})}catch(e){el.textContent=""}};
  if(window.qrcode)return t();const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";s.onload=t;document.head.appendChild(s)}
function vgHtml(){const s=VG.st;
  if(!s)return`<p class="subt">Laden…</p>`;
  if(s.fout)return info("Kon de status niet ophalen: "+esc(s.fout),"warn");
  const mfa=s.aan?`<div class="okbox" style="margin:0">${I.shield}<div><b>Tweestapsverificatie staat aan</b><span>Sinds ${esc(fmtD(String(s.sinds).slice(0,10)))}. Bij inloggen op een nieuw apparaat vraagt het CRM om de code uit je app.</span></div></div>
      <div class="row" style="gap:8px;margin-top:10px"><button type="button" class="small ghost" id="vgUit">Uitzetten</button></div>`
    :`${info("Met tweestapsverificatie heb je naast je wachtwoord ook een code uit een app op je telefoon nodig. Lekt je wachtwoord, dan komt niemand er toch in. <b>Het klantportaal verandert niet</b>: klanten blijven inloggen met de link per e-mail.")}
      <div id="vgStap"><button type="button" class="primary" id="vgStart">${I.lock}Tweestapsverificatie instellen</button></div>`;
  const gebr=s.gebruikers&&s.gebruikers.length>1?`${sec("Gebruikers")}<div class="vg-g">${s.gebruikers.map(g=>`<div class="vg-gr"><span>${esc(g.email)}</span><b class="${g.aan?"aan":""}">${g.aan?"Aan":"Uit"}</b>${g.aan&&g.email!==s.gebruikers[0].email?`<button type="button" class="small ghost" data-vgreset="${esc(g.email)}">Resetten</button>`:""}</div>`).join("")}</div><small class="help">Resetten als een medewerker zijn telefoon kwijt is: daarna stelt hij het opnieuw in.</small>`:"";
  const bk=vgEigenaar()?`${sec("Back-ups")}${info("Elke nacht om 03:15 maakt het CRM automatisch een back-up van alle gegevens (klanten, beurten, facturen, instellingen, tickets…). De back-ups worden <b>35 dagen</b> bewaard bij Google, apart van de database. API-sleutels zitten er bewust niet in.")}
      ${VG.lijst?VG.lijst.length?`<div class="vg-b">${VG.lijst.slice(0,8).map(b=>`<div class="vg-br"><span>${esc(fmtL(b.naam.slice(0,10)))}${/handmatig/.test(b.naam)?" · handmatig":""}</span><em>${vgKb(b.bytes)}</em><button type="button" class="small ghost" data-vgdl="${esc(b.naam)}">${I.dl}Download</button></div>`).join("")}</div>`:`<p class="subt">Nog geen back-ups. De eerste komt vannacht, of maak er nu een.</p>`:""}
      <div class="row" style="gap:8px;margin-top:10px"><button type="button" class="primary" id="vgNu">${I.dl}Nu een back-up maken en downloaden</button></div>
      <small class="help">Bewaar af en toe een download op je eigen computer of in iCloud. Terugzetten staat uitgelegd in OVERDRACHT.md in GitHub.</small>`:"";
  return `${sec("Tweestapsverificatie")}${mfa}${gebr}${bk}`}
function vgTeken(){const b=$("#vgBox");if(!b)return;b.innerHTML=vgHtml();vgBind()}
async function vgBezig(btn,f){const t=btn.innerHTML;btn.disabled=true;btn.innerHTML=I.clock+"Bezig…";try{await f()}catch(e){toast(fnFout(e))}finally{if(btn.isConnected){btn.disabled=false;btn.innerHTML=t}}}
function vgBind(){
  const st=$("#vgStart");if(st)st.onclick=()=>vgBezig(st,async()=>{const r=(await fbFn("mfaStart")()).data;const box=$("#vgStap");
    box.innerHTML=`<ol class="vg-stap"><li><b>Installeer een authenticator-app</b> op je telefoon, bijvoorbeeld Google Authenticator, Microsoft Authenticator of de Wachtwoorden-app van je iPhone.</li>
      <li><b>Scan deze QR-code</b> met de app.<div class="vg-qr" id="vgQr"></div><small class="help">Lukt scannen niet? Vul deze sleutel handmatig in: <code class="vg-key">${esc(r.secret.replace(/(.{4})/g,"$1 ").trim())}</code></small></li>
      <li><b>Vul de 6 cijfers in</b> die de app nu laat zien:<div class="row" style="gap:8px;margin-top:8px"><input id="vgCode" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="123 456" style="max-width:160px;letter-spacing:.25em;font-size:18px;text-align:center"><button type="button" class="primary" id="vgAct">Aanzetten</button></div></li></ol>`;
    vgQr(r.uri,$("#vgQr"));const c=$("#vgCode");c.focus();
    const go=()=>vgBezig($("#vgAct"),async()=>{const h=(await fbFn("mfaActiveer")({code:c.value})).data.herstel;await firebase.auth().currentUser.getIdToken(true);
      box.innerHTML=`<div class="okbox" style="margin:0">${I.check}<div><b>Tweestapsverificatie staat aan</b><span>Bewaar deze herstelcodes op een veilige plek (bijvoorbeeld uitgeprint of in je wachtwoordbeheer). Ben je je telefoon kwijt, dan log je met één van deze codes in. Elke code werkt één keer. Je ziet ze maar één keer.</span></div></div>
        <div class="vg-hc">${h.map(x=>`<code>${esc(x)}</code>`).join("")}</div><div class="row" style="gap:8px"><button type="button" class="small" id="vgCp">${I.copy}Kopiëren</button><button type="button" class="small" id="vgDl">${I.dl}Downloaden</button><span class="sp"></span><button type="button" class="small primary" id="vgKlaar">Ik heb ze bewaard</button></div>`;
      const txt="Herstelcodes mijnschoonmaker CRM ("+(firebase.auth().currentUser.email||"")+")\nElke code werkt één keer.\n\n"+h.join("\n")+"\n";
      $("#vgCp").onclick=()=>copy(txt,$("#vgCp"));$("#vgDl").onclick=async()=>{const d=await window.claude.use("downloads");d.save({filename:"herstelcodes-crm.txt",data:new Blob([txt],{type:"text/plain"})})};
      $("#vgKlaar").onclick=async()=>{await vgLaad();vgTeken()}});
    $("#vgAct").onclick=go;c.oninput=()=>{if(c.value.replace(/\D/g,"").length===6)go()}});
  const uit=$("#vgUit");if(uit)uit.onclick=async()=>{const code=prompt("Vul de code uit je app in om tweestapsverificatie uit te zetten:");if(!code)return;vgBezig(uit,async()=>{await fbFn("mfaUit")({code});toast("Tweestapsverificatie staat uit");await vgLaad();vgTeken()})};
  form.querySelectorAll("[data-vgreset]").forEach(b=>b.onclick=()=>{if(!confirm("Tweestapsverificatie resetten voor "+b.dataset.vgreset+"?"))return;vgBezig(b,async()=>{await fbFn("mfaUit")({email:b.dataset.vgreset});toast("Gereset");await vgLaad();vgTeken()})});
  const dl=async naam=>{const r=(await fbFn("backupNu")(naam?{naam}:{})).data;if(r.teGroot){toast("De back-up is te groot om te downloaden ("+vgKb(r.bytes)+"); hij staat wel veilig bij Google.");return}
    const bin=atob(r.data),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const d=await window.claude.use("downloads");await d.save({filename:r.naam.replace(/^(\d)/,"backup-$1"),data:new Blob([u],{type:"application/gzip"})});
    if(!naam){toast("Back-up gemaakt"+(r.documenten?" · "+r.documenten+" items":""));await vgLaad();vgTeken()}};
  const nu=$("#vgNu");if(nu)nu.onclick=()=>vgBezig(nu,()=>dl(""));
  form.querySelectorAll("[data-vgdl]").forEach(b=>b.onclick=()=>vgBezig(b,()=>dl(b.dataset.vgdl)))}
if(typeof SETCARDS!=="undefined"&&LIVE){
  SETCARDS.push({id:"veilig",t:"Beveiliging & back-ups",sub:"Tweestapsverificatie en dagelijkse back-ups",ic:"shield",bg:"#2f6f4f",
    st:()=>VG.st&&VG.st.aan?["ok","Beveiligd"]:["soon","Tweestap uit"],rows:()=>[["Tweestap",VG.st?(VG.st.aan?"Aan":"Uit"):"…"],["Back-up","Elke nacht"]]});
  SETEXTRA.veilig=c=>{setDlg(c,`<div id="vgBox"><p class="subt">Laden…</p></div>`,{foot:`<span class="sp"></span><button type="button" class="primary" data-act="close">Klaar</button>`});vgLaad().then(vgTeken)};
  setTimeout(()=>{vgLaad().then(()=>{try{if(state.tab==="instellingen")render()}catch(e){}})},4000);
  /* na inloggen met een herstelcode: laten weten hoeveel er nog over zijn */
  setTimeout(()=>{try{const n=sessionStorage.getItem("ms.herstelOver");if(n!=null){sessionStorage.removeItem("ms.herstelOver");toast(`Ingelogd met een herstelcode. Je hebt er nog ${n}. Stel tweestapsverificatie opnieuw in op je nieuwe telefoon (Instellingen › Beveiliging).`)}}catch(e){}},2500)}
