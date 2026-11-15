/* Demo-toegang: wie de demo wil bekijken vult een e-mailadres in en kan de demo daarna 7 dagen gebruiken.
   - ?t=TOKEN in de link (uit de welkomstmail) zet de toegang op dit apparaat;
   - de oude toegangscode (?code=... of via "Ik heb een toegangscode") blijft werken voor eigen gebruik;
   - na 7 dagen ziet de bezoeker dat de proefperiode voorbij is.
   Gewone drempel aan de voorkant, geen echte beveiliging: de demo bevat alleen voorbeeldgegevens. */
(function(){var H="4a8eec4925826f4b60526d7ac3c0a9b61ef54ac19233bafce2f4a13eb49395d2",K="mansardDemoToegang",KT="mansardDemoToken",DAGEN=7;
var ls={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
async function hash(t){var b=new TextEncoder().encode(String(t).trim().toUpperCase());var d=await crypto.subtle.digest("SHA-256",b);return Array.from(new Uint8Array(d)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")}
document.documentElement.classList.add("dslot");
var st=document.createElement("style");st.textContent="html.dslot body>*:not(#dslot){display:none!important}#dslot{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:#f5f5f3;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#14171c;overflow:auto}#dslot .k{width:100%;max-width:420px;background:#fff;border:1px solid #eceef1;border-radius:22px;padding:34px 30px 28px;box-shadow:0 1px 2px rgb(20 23 28/.03),0 30px 60px -40px rgb(20 23 28/.35);text-align:center}#dslot img{height:18px;margin-bottom:26px}#dslot .ey{display:block;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#8a8f98;margin-bottom:10px}#dslot h1{font-size:25px;font-weight:500;margin:0 0 10px;letter-spacing:-.015em;line-height:1.2}#dslot p{font-size:14.5px;line-height:1.55;color:#5b6270;margin:0 0 20px}#dslot input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:13px 14px;border:1px solid #d9dce1;border-radius:12px;outline:none;background:#fff}#dslot input.code{letter-spacing:.2em;text-align:center;font-size:18px}#dslot input:focus{border-color:#252c3c;box-shadow:0 0 0 3px rgba(37,44,60,.12)}#dslot .p{margin-top:12px;width:100%;font:inherit;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;padding:15px;border:0;border-radius:12px;background:linear-gradient(150deg,#323b50,#252c3c 55%,#1c2231);color:#fff;cursor:pointer}#dslot button.p[disabled]{opacity:.6;cursor:wait}#dslot .f{color:#b4472f;font-size:13px;min-height:18px;margin-top:10px}#dslot ul{list-style:none;margin:0 0 22px;padding:14px 16px;background:#f6f7f9;border-radius:14px;text-align:left;font-size:13.5px;color:#3a4150;display:grid;gap:7px}#dslot ul li::before{content:'✓';margin-right:8px;color:#1f9d55;font-weight:700}#dslot small{display:block;margin-top:14px;font-size:12.5px;color:#8a8f98;line-height:1.5}#dslot small a,#dslot .lnk{color:#14171c;background:none;border:0;padding:0;font:inherit;text-decoration:underline;cursor:pointer}#dslot .ld{font-size:14px;color:#8a8f98}"+
"#dslotBadge{position:fixed;right:14px;bottom:14px;z-index:2147483000;background:#252c3c;color:#fff;font:600 11px/1 Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:9px 13px;border-radius:999px;box-shadow:0 10px 24px -12px rgb(20 23 28/.5);opacity:.92;pointer-events:none}";
document.head.appendChild(st);
function klaar(fn){if(document.body)fn();else document.addEventListener("DOMContentLoaded",fn)}
function open_(verloopt){document.documentElement.classList.remove("dslot");var o=document.getElementById("dslot");if(o)o.remove();
  if(verloopt)klaar(function(){var n=Math.max(1,Math.ceil((verloopt-Date.now())/864e5));var b=document.getElementById("dslotBadge")||document.createElement("div");b.id="dslotBadge";b.textContent="Demo · nog "+n+" "+(n===1?"dag":"dagen");document.body.appendChild(b)})}
function scherm(html){klaar(function(){var d=document.getElementById("dslot");if(!d){d=document.createElement("div");d.id="dslot";document.body.appendChild(d)}d.innerHTML='<div class="k"><img src="/mansard-logo.png" alt="Mansard">'+html+'</div>'})}
function formulier(){scherm('<form id="dsF"><span class="ey">Demo</span><h1>Probeer Mansard '+DAGEN+' dagen</h1><p>Vul uw e-mailadres in en bekijk direct hoe Mansard werkt, met een voorbeeldbedrijf vol klanten, planning en facturen.</p><ul><li>Direct toegang, '+DAGEN+' dagen lang</li><li>Geen betaalgegevens nodig</li><li>Link per e-mail, ook voor op uw telefoon</li></ul><input type="email" name="email" autocomplete="email" inputmode="email" placeholder="uw@bedrijf.nl" aria-label="E-mailadres" required><button class="p" type="submit">Start de demo</button><div class="f" role="alert"></div><small>Heeft u een toegangscode? <button type="button" class="lnk" id="dsCode">Vul hem hier in</button></small></form>');
  klaar(function(){var f=document.getElementById("dsF"),i=f.querySelector("input"),m=f.querySelector(".f"),b=f.querySelector("button.p");setTimeout(function(){i.focus()},50);
    document.getElementById("dsCode").onclick=codeFormulier;
    f.onsubmit=async function(e){e.preventDefault();m.textContent="";var em=i.value.trim();if(!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(em)){m.textContent="Vul een geldig e-mailadres in.";return}
      b.disabled=true;b.textContent="Even geduld…";
      try{var r=await fetch("/api/demo/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:em})});var j=await r.json().catch(function(){return{}});
        if(j.ok&&j.token){ls.set(KT,j.token);open_(j.verloopt);return}
        if(j.verlopen){verlopen();return}
        m.textContent=j.fout||"Er ging iets mis. Probeer het opnieuw."}catch(x){m.textContent="Geen verbinding. Probeer het opnieuw."}
      b.disabled=false;b.textContent="Start de demo"}})}
function codeFormulier(){scherm('<form id="dsC"><span class="ey">Demo</span><h1>Toegangscode</h1><p>Vul de code in die u van ons heeft gekregen.</p><input class="code" inputmode="text" autocomplete="off" autocapitalize="characters" placeholder="Code" aria-label="Toegangscode"><button class="p" type="submit">Bekijk de demo</button><div class="f" role="alert"></div><small><button type="button" class="lnk" id="dsTerug">Terug</button></small></form>');
  klaar(function(){var f=document.getElementById("dsC"),i=f.querySelector("input"),m=f.querySelector(".f");setTimeout(function(){i.focus()},50);document.getElementById("dsTerug").onclick=formulier;
    f.onsubmit=async function(e){e.preventDefault();if(await hash(i.value)===H){ls.set(K,H);open_()}else{m.textContent="Deze code klopt niet.";i.select()}}})}
function verlopen(){ls.del(KT);scherm('<span class="ey">Demo</span><h1>Uw proefperiode is voorbij</h1><p>De '+DAGEN+' dagen van uw demo zijn om. Wilt u verder met Mansard of nog iets vragen? Wij helpen u graag op weg.</p><a class="p" href="https://www.mansard.nl" style="display:block;box-sizing:border-box;text-decoration:none">Neem contact op</a><small>Heeft u een toegangscode? <button type="button" class="lnk" id="dsCode">Vul hem hier in</button></small>');
  klaar(function(){document.getElementById("dsCode").onclick=codeFormulier})}
(async function(){
  var q=new URLSearchParams(location.search),c=q.get("code"),t=q.get("t");
  if(t){ls.set(KT,t);try{q.delete("t");history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:"")+location.hash)}catch(e){}}
  if(ls.get(K)===H){open_();return}
  if(c&&await hash(c)===H){ls.set(K,H);open_();return}
  var tok=ls.get(KT);
  if(!tok){formulier();return}
  scherm('<div class="ld">Demo openen…</div>');
  try{var r=await fetch("/api/demo/check?t="+encodeURIComponent(tok));var j=await r.json();
    if(j.ok){open_(j.verloopt);return}
    if(j.verlopen){verlopen();return}
    ls.del(KT);formulier()}
  catch(e){open_()}/* geen verbinding met de server: niet blokkeren */
})();
})();
