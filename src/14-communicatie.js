/* ---------- COMMUNICATIE ---------- */
const CATGRAD={Aankondiging:"#4a78b8",Afkondiging:"#3f8a66",Afspraak:"#6a63b0",Herinnering:"#b07a3a",Factuur:"#2f7f88",Offerte:"#4f86a8",Review:"#a68a3a",Welkom:"#a2607a",Algemeen:"#6b7a80"};
const MSTAT={geopend:["brand","Klaargezet"],gepland:["soon","Gepland"],gekopieerd:["plan","Verstuurd"],bezorgd:["ok","Bezorgd"],gelezen:["ok","Geopend"],geklikt:["ok2","Geklikt in de mail"],bounce:["late","Niet afgeleverd"],spam:["late","Als spam gemarkeerd"],uit:["neutral","Uitgeschreven"],mislukt:["late","Mislukt"]};
const mStat=m=>m.spamOp?"spam":(m.bouncedOp||m.geblokkeerdOp)?"bounce":m.status==="mislukt"?"mislukt":m.uitgeschrevenOp?"uit":m.geklikOp?"geklikt":m.gelezenOp?"gelezen":m.bezorgdOp?"bezorgd":m.status==="gepland"?"gepland":(m.status==="verstuurd"||m.status==="gekopieerd")?"gekopieerd":m.status||"geopend";
const fmtTS=x=>{if(!x)return"";const d=new Date(x);return fmtD(iso(d))+" "+pad(d.getHours())+":"+pad(d.getMinutes())};
/* korte trackingregel onder een bericht */
function mailTrk(m){if(m.kanaal!=="email")return"";const st=mStat(m),b=[];
  if(st==="geklikt"||st==="gelezen"){b.push(`<span class="trk-ok">${I.eye}Geopend ${esc(fmtTS(m.gelezenOp))}${(m.opens||0)>1?` · ${m.opens}×`:""}</span>`);if(m.geklikOp)b.push(`<span class="trk-ok">${I.right}Link aangeklikt ${esc(fmtTS(m.geklikOp))}</span>`)}
  else if(m.bezorgdOp)b.push(`<span class="trk-ok">${I.check}Bezorgd ${esc(fmtTS(m.bezorgdOp))}</span>`);
  else if(m.track||m.brevoId)b.push(`<span>${I.clock}Nog niet geopend</span>`);
  if(st==="bounce"||st==="spam"||st==="mislukt")b.unshift(`<span style="color:var(--late);font-weight:600">${I.alert}${esc(MSTAT[st][1])}${m.bounceReden||m.fout?" · "+esc(String(m.bounceReden||m.fout).slice(0,80)):""}</span>`);
  bijlLijst(m).forEach((a,i)=>b.push(`<button type="button" class="trk-bij" data-bij="${esc(m.id)}" data-n="${i}" title="Openen">${I.note}${esc(a.naam)}</button>`));
  return b.length?`<div class="msg-trk">${b.join("")}</div>`:""}
/* ---------- mail-tracking (web beacon via eigen server) ---------- */
const trackBase=()=>String(S().trackUrl||"").trim().replace(/\/+$/,"");
const trackOn=()=>!!(trackBase()&&S().trackKey&&S().trackAan!==false);
async function trackSig(id,u){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(S().trackKey+"|"+id+"|"+u));return [...new Uint8Array(b)].slice(0,6).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function trackHtml(html,id){if(!trackOn())return html;const B=trackBase();
  const urls=[...new Set([...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]))].filter(u=>!u.startsWith(B));
  for(const u0 of urls){const u=u0.replace(/&amp;/g,"&"),sg=await trackSig(id,u);html=html.split(`href="${u0}"`).join(`href="${B}/c/${id}?u=${encodeURIComponent(u)}&amp;s=${sg}"`)}
  const px=`<img src="${B}/o/${id}.gif" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;margin:0;padding:0">`;
  const i=html.lastIndexOf("</div>");return i>=0?html.slice(0,i)+px+html.slice(i):html+px}
let trackBusy=false,trackLast=0;
async function syncTrack(force){if(!trackOn()||trackBusy)return;if(!force&&Date.now()-trackLast<120000)return;trackBusy=true;trackLast=Date.now();
  try{const lim=Date.now()-150*DAY,ms=state.berichten.filter(m=>m.track&&new Date(m.op).getTime()>lim);
    if(!ms.length){if(force)toast("Nog geen gevolgde mails");return}
    const r=await fetch(trackBase()+"/e",{method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify({k:S().trackKey,ids:ms.map(m=>m.id)})});
    if(!r.ok)throw new Error(r.status===401?"de sleutel klopt niet":"server gaf "+r.status);
    const d=await r.json();let n=0;
    for(const m of ms){const e=d[m.id];if(!e)continue;const O=e.o||[],C=e.c||[];if(O.length===(m.opens||0)&&C.length===(m.clicks||0))continue;
      const first=Math.min(...O,...C.map(c=>c.t));
      await save("berichten",m.id,{...strip(m),opens:O.length,clicks:C.length,gelezenOp:new Date(first).toISOString(),laatstGelezen:O.length?new Date(Math.max(...O)).toISOString():"",geklikOp:C.length?new Date(C[0].t).toISOString():"",kliks:C.slice(-10)});n++}
    if(force)toast(n?plural(n,"mail bijgewerkt","mails bijgewerkt"):"Mailstatussen zijn actueel")}
  catch(e){if(force)toast("Tracking-server niet bereikbaar: "+(e.message||e))}finally{trackBusy=false}}
if(typeof window!=="undefined"&&typeof setInterval==="function")setInterval(()=>{try{syncTrack()}catch(_){}},5*60000);
const tplVars=t=>[...new Set(((t.onderwerp||"")+(t.mail||"")+(t.sms||"")).match(/\[[a-z0-9_]+\.[a-z_]+\]|\{\w+\}/g)||[])];
const VARLIST=["klant","voornaam","datum","tijd","tijdvak","adres","straat","plaats","diensten","dienst","prijs","interval","bedrijf","telefoon","iban","factuurnummer","bedrag","vervaldatum","factuurdatum","dagen_te_laat","betaallink","reviewlink"];
const MAILKIND={factuur:["Factuur","[nr.invoice]"],aanmaning:["Betalingsherinnering","Factuur [nr.invoice]"],offerte:["Offerte","[nr.invoice]"],review:["Review",""],welkom:["Welkom","Welkom bij [name.company]"]};
function sampleVars(){
  const k={naam:"Fam. de Vries",voornaam:"Anna",adres:"Lindelaan 12",postcode:"3581 AB",plaats:"Utrecht",tijd:"09:00",duur:240,dienst:"Glasbewassing",prijs:80,frequentie:4};
  return{...klantVars(k,addDays(today(),5)),tijdvak:"tussen 08:00 en 12:00",factuurnummer:today().getFullYear()+"-0042",bedrag:"€ 96,80",factuurdatum:fmtL(today()),vervaldatum:fmtL(addDays(today(),14)),dagen_te_laat:5,reviewlink:S().reviewLink||"https://g.page/r/…/review"};
}
const sampleRegels=[{omschrijving:"Glazenwassen buitenzijde",aantal:1,prijs:65},{omschrijving:"Dakkapel + kozijnen",aantal:1,prijs:15}];
/* knop in een opgemaakt (rich) sjabloon: vóór "Met vriendelijke groet" */
function richMetKnop(rich,block){const wrap=x=>`<div style="margin:0 0 18px;line-height:1.65;font-size:15px;color:#222">${x}</div>`;if(!block)return wrap(rich);
  try{const T=document.createElement("template");T.innerHTML=rich;const w=document.createTreeWalker(T.content,NodeFilter.SHOW_TEXT);let n,hit=null,at=0;
    while((n=w.nextNode())){const m=n.nodeValue.search(/met vriendelijke groet|vriendelijke groet|groet,/i);if(m>=0){hit=n;at=m;break}}
    if(!hit)return wrap(rich)+block;
    /* alles vóór de groet netjes (met gesloten tags) eruit knippen, de rest blijft heel */
    const r=document.createRange();r.setStart(T.content,0);r.setEnd(hit,at);const voor=document.createElement("div");voor.append(r.extractContents());
    const na=document.createElement("div");na.append(T.content);
    const v=voor.innerHTML.replace(/(\s|<br\s*\/?>|<(div|p)>\s*(<br\s*\/?>)?\s*<\/\2>)+$/i,"");
    return wrap(v)+block+wrap(na.innerHTML)}catch(e){return wrap(rich)+block}}
/* opgemaakte e-mail, inline gestyled zodat hij in een mailprogramma geplakt kan worden */
function emailHtml({stijl,accent,kicker,titel,tekst,rich,meta,regels,totaal,knop,bank,logo,preview}){
  const s=S(),A=accent||"#111111",serif="Georgia,'Times New Roman',serif",sans="-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const e=x=>esc(x);
  let paras=String(tekst||"").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  let sig=paras.findIndex(p=>/^(met vriendelijke groet|groet|vriendelijke groet)/i.test(p));if(sig<0)sig=paras.length;
  const P=p=>`<p style="margin:0 0 18px;line-height:1.65;font-size:15px;color:#222">${e(p).replace(/\n/g,"<br>")}</p>`;
  const sigP=p=>{const[a,...b]=p.split("\n");return `<p style="margin:0;line-height:1.5;font-size:15px;color:#222">${e(a)}${b.length?`<br><b>${e(b.join(" "))}</b>`:""}</p>`};
  const richBlock=rich?`<div style="margin:0 0 18px;line-height:1.65;font-size:15px;color:#222">${rich}</div>`:"";
  let block="";
  if(meta&&meta.length)block+=`<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f6f7f8;border:1px solid #e6e8ea;border-radius:${stijl==="klassiek"?4:12}px;margin:4px 0 22px;border-collapse:separate"><tr><td style="padding:14px 20px"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${meta.map(([a,b],i)=>{const last=i===meta.length-1&&totaal,bt=last?"border-top:1px solid #e1e4e6;padding-top:10px;":"";return `<tr><td style="${bt}padding-bottom:4px;padding-top:${last?10:4}px;font-size:14px;color:#5d6f76">${e(a)}</td><td style="${bt}padding-bottom:4px;padding-top:${last?10:4}px;font-size:${last?18:14}px;font-weight:700;text-align:right;color:#111">${e(b)}</td></tr>`}).join("")}</table></td></tr></table>`;
  if(regels&&regels.length)block+=`<table style="width:100%;border-collapse:collapse;margin:0 0 22px;font-size:14px"><tr style="background:#f6f7f8"><th style="text-align:left;padding:9px 10px;font-size:11px;letter-spacing:.08em;color:#5d6f76;border-bottom:2px solid #e1e4e6">OMSCHRIJVING</th><th style="padding:9px 10px;font-size:11px;letter-spacing:.08em;color:#5d6f76;border-bottom:2px solid #e1e4e6">AANTAL</th><th style="text-align:right;padding:9px 10px;font-size:11px;letter-spacing:.08em;color:#5d6f76;border-bottom:2px solid #e1e4e6">BEDRAG</th></tr>${regels.map(r=>`<tr><td style="padding:10px;border-bottom:1px solid #eceef0">${e(r.omschrijving)}</td><td style="padding:10px;text-align:center;border-bottom:1px solid #eceef0">${e(r.aantal)}</td><td style="padding:10px;text-align:right;border-bottom:1px solid #eceef0">${eur((Number(r.aantal)||0)*(Number(r.prijs)||0))}</td></tr>`).join("")}${totaal?`<tr><td></td><td style="padding:12px 10px;text-align:right;font-weight:700">Totaal incl. BTW</td><td style="padding:12px 10px;text-align:right;font-weight:800;font-size:17px">${e(totaal)}</td></tr>`:""}</table>`;
  if(knop&&knop.url)block+=`<div style="text-align:center;margin:${knop.stil?"4px 0 24px":"6px 0 10px"}"><a href="${e(knop.url)}" style="display:inline-block;background:${stijl==="luxe"?"#111":A};color:#fff;text-decoration:none;font-weight:600;padding:10px 20px;font-size:14px;line-height:1.2;border-radius:${stijl==="klassiek"?3:8}px;font-family:${sans}">${e(knop.tekst)}</a></div>${knop.stil?"":`<p style="text-align:center;font-size:13px;color:#5d6f76;margin:0 0 22px">Werkt de knop niet? <a href="${e(knop.url)}" style="color:#111;font-weight:700">Open dan deze link</a></p>`}`;
  if(bank&&bank.length)block+=`<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f6f7f8;border:1px solid #e6e8ea;border-radius:${stijl==="klassiek"?4:12}px;margin:0 0 22px;border-collapse:separate"><tr><td style="padding:16px 22px"><div style="font-size:12px;font-weight:800;letter-spacing:.1em;margin-bottom:8px;color:#111">BANKGEGEVENS</div><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${bank.map(([a,b])=>`<tr><td style="padding:3px 18px 3px 0;font-size:14px;color:#5d6f76;width:80px">${e(a)}</td><td style="padding:3px 0;font-size:14px;font-weight:700;color:#111">${e(b)}</td></tr>`).join("")}</table></td></tr></table>`;
  const body=rich?richMetKnop(rich,block):paras.slice(0,sig).map(P).join("")+block+paras.slice(sig).map(sigP).join("");
  const naam=s.naam||"Je bedrijf",lgSrc=logo?(preview?BLOB+logo:(state.mailLogo&&state.mailLogo.id===logo?state.mailLogo.url:"")):"",lg=lgSrc?`<img src="${e(lgSrc)}" alt="" style="max-height:${Math.min(80,Number(s.logoGrootte)||64)}px;max-width:180px">`:"";
  const foot=`<p style="text-align:center;font-size:12px;color:#8a979c;margin:18px 0 0;line-height:1.7">${[naam,s.telefoon,s.email].filter(Boolean).map(e).join(" &nbsp;·&nbsp; ")}${s.iban?`<br>IBAN: ${e(s.iban)}`:""}</p>`;
  if(stijl==="klassiek")return `<div style="font-family:${sans};background:#f3f4f5;padding:24px 12px"><div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e3e5e7;padding:30px 34px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border-bottom:2px solid ${A};margin-bottom:24px"><tr><td style="padding-bottom:16px;vertical-align:middle">${lg||`<b style="font-size:18px">${e(naam)}</b>`}</td><td style="padding-bottom:16px;text-align:right;vertical-align:middle;font-family:${serif};font-size:13px;color:#5d6f76">${e(kicker||"")}</td></tr></table>
    ${titel?`<h1 style="font-family:${serif};font-weight:400;font-size:26px;margin:0 0 22px;color:#111">${e(titel)}</h1>`:""}${body}<div style="border-top:1px solid ${A};margin-top:26px"></div>${foot}</div></div>`;
  if(stijl==="luxe")return `<div style="font-family:${sans};background:#f1efeb;padding:24px 12px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:6px;overflow:hidden">
    <div style="background:#141414;color:#fff;text-align:center;padding:30px 24px;border-bottom:3px solid ${A}">${lg?`<div style="margin-bottom:14px;background:#fff;display:inline-block;padding:8px;border-radius:6px">${lg}</div>`:`<div style="font-family:${serif};font-size:22px;letter-spacing:.04em;margin-bottom:10px">${e(naam)}</div>`}
      <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${A}">${e(kicker||"")}</div>${titel?`<div style="font-family:${serif};font-size:24px;margin-top:8px">${e(titel)}</div>`:""}</div>
    <div style="padding:36px 40px">${body}</div></div>${foot}</div>`;
  /* modern = realistisch blauw ticket, gelijk aan de mails van de server */
  const BL="#137a8a",BL2="#1d5a74",BG="#eef2f3",INK="#0f1f26",mono="'SF Mono',Menlo,Consolas,'Courier New',monospace";
  const gat=k=>`<td width="15" style="width:15px;padding:0;background:#fbfcfc;font-size:0;line-height:0"><div style="width:15px;height:30px;background:${BG};border-radius:${k==="l"?"0 15px 15px 0":"15px 0 0 15px"};box-shadow:inset ${k==="l"?"-2px":"2px"} 0 3px rgba(15,70,85,.10)">&nbsp;</div></td>`;
  const lab="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.72)";
  const nr=String((meta&&meta[0]&&meta[0][1])||"").trim();
  const strook=`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td valign="middle" style="word-break:break-word"><div style="${lab}">${e(naam)}</div><div style="font-size:13.5px;color:#fff;margin-top:4px;line-height:1.55">${[s.telefoon,s.email].filter(Boolean).map(e).join("<br>")}${s.iban?`<br><span style="font-family:${mono};font-size:12px;opacity:.85">${e(s.iban)}</span>`:""}</div></td>
    </td></tr></table>`;
  const kop=(kicker||titel)?`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#6b7c82">${e(kicker||"")}${nr&&String(titel||"").trim()!==nr?`&nbsp;<span style="font-family:${mono};letter-spacing:1px;color:${BL}">${e(nr)}</span>`:""}</td></tr></table>${titel?`<div style="font-size:22px;font-weight:800;color:${INK};line-height:1.2;margin:10px 0 2px;letter-spacing:-.4px;${String(titel).trim()===nr?`font-family:${mono};letter-spacing:.5px;`:""}">${e(titel)}</div>`:""}<div style="border-top:1px solid #e3eaec;margin:14px 0 0;height:0;line-height:0;font-size:0">&nbsp;</div>`:"";
  const tb=body.replace(new RegExp('background:'+A.replace(/[#]/g,"#")+';color:#fff;text-decoration:none;font-weight:600;padding:10px 20px','g'),`background:${BL};background-image:linear-gradient(135deg,#1590a2,${BL} 55%,#11677a);color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;box-shadow:0 10px 20px -10px rgba(15,95,110,.7)`).replace(/border-radius:8px;font-family/g,"border-radius:14px;font-family");
  return `<div style="font-family:${sans};background:${BG};padding:26px 12px 22px;-webkit-font-smoothing:antialiased"><div style="max-width:560px;margin:0 auto;border-radius:22px;box-shadow:0 1px 2px rgba(15,70,85,.06),0 22px 44px -22px rgba(15,70,85,.38)">
<div style="background:#ffffff;background-image:linear-gradient(180deg,#ffffff 0%,#fbfcfc 100%);border-radius:22px 22px 0 0;overflow:hidden">
  <div style="height:9px;background:${BL};background-image:linear-gradient(90deg,${BL2},${BL} 60%,#2aa3b3)"></div>
  <div style="text-align:center;padding:24px 24px 2px">${lg||`<b style="font-size:19px;letter-spacing:-.3px;color:${INK}">${e(naam)}</b>`}</div>
  ${kop?`<div style="padding:16px 34px 2px">${kop}</div>`:""}
  <div style="padding:16px 34px 10px;color:#2b3a40">${tb}</div>
</div>
<div style="background:#fbfcfc;height:14px;line-height:14px;font-size:0">&nbsp;</div>
<div style="background:${BL};background-image:repeating-linear-gradient(115deg,rgba(255,255,255,.035) 0 2px,transparent 2px 22px),linear-gradient(135deg,${BL2},${BL} 60%,#1a8c9c);border-radius:0 0 22px 22px;color:#ffffff;padding:18px 30px 20px">${strook}</div>
</div></div>`;
}
function mailFor(sjabloon,vars,tekst,{f,stap,preview}={}){
  const _T=(tpls()[sjabloon]||{}),_rich=!stap&&_T.mailHtml&&String(tekst||"").trim()===String(_T.mail||"").trim()?fillHtml(richSafe(_T.mailHtml),vars):null;
  const s=S(),kind=stap?"aanmaning":sjabloon,K=MAILKIND[kind]||[ (tpls()[sjabloon]||{}).naam||"Bericht",""];
  const o={stijl:s.mailStijl||"modern",accent:s.mailAccent||s.hoofdkleur||"#111111",kicker:K[0],titel:fill(K[1].replace("{onderwerp}",s.reviewOnderwerp||"Tevreden over ons werk?"),vars),tekst:fill(tekst,vars),rich:_rich,logo:s.logoMail||s.logo,preview};
  if(["factuur","offerte"].includes(kind)){const t=f?totals(f):{inc:96.8};o.meta=[[kind==="offerte"?"Offertenummer":"Factuurnummer",vars.factuurnummer],[kind==="offerte"?"Datum":"Factuurdatum",f?fmtNum(f.datum):fmtNum(today())],[kind==="offerte"?"Geldig tot":"Vervaldatum",f?fmtNum(f.verval):fmtNum(addDays(today(),14))],...(kind==="offerte"&&f&&f.totaalTonen===false?[]:[["Totaal incl. BTW",eur(t.inc)]])];
    o.regels=f?f.regels.map(r=>Array.isArray(r.subs)&&r.subs.length?{...r,omschrijving:r.omschrijving+": "+r.subs.map(x=>String(x.naam).toLowerCase()+" "+(x.qty||"")).join(", ").trim()}:r):sampleRegels;if(!(kind==="offerte"&&f&&f.totaalTonen===false))o.totaal=eur(t.inc)}
  if(["factuur","aanmaning"].includes(kind)&&(vars.betaallink||s.betaallink))o.knop={tekst:"Direct betalen",url:vars.betaallink||s.betaallink};
  if(["factuur","aanmaning"].includes(kind)&&s.iban)o.bank=[["IBAN",s.iban],["T.n.v.",s.naam||"—"],["Kenmerk",vars.factuurnummer]];
  if(kind==="offerte"&&vars.akkoordlink)o.knop={tekst:"Offerte bekijken en akkoord geven",url:vars.akkoordlink};
  if(kind==="aankondiging"&&s.portaalKnop!==false){const em=vars["email.customer"]||"";o.knop={tekst:"Naar uw klantportaal",url:(LIVE?location.origin:"https://crm.mijnschoonmaker.com")+"/portaal"+(em?"?e="+encodeURIComponent(em):""),stil:true}}
  if(kind==="review"&&s.reviewLink)o.knop={tekst:s.reviewKnop||"Review achterlaten",url:s.reviewLink};
  return emailHtml(o);
}
async function copyHtml(html,plain){
  try{if(window.ClipboardItem&&navigator.clipboard&&navigator.clipboard.write){await navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([html],{type:"text/html"}),"text/plain":new Blob([plain],{type:"text/plain"})})]);return true}}catch(e){}
  const d=document.createElement("div");d.contentEditable="true";d.style.cssText="position:fixed;left:-9999px;top:0";d.innerHTML=html;(dlg.open?dlg:document.body).appendChild(d);
  const r=document.createRange();r.selectNodeContents(d);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);let ok=false;try{ok=document.execCommand("copy")}catch(e){}sel.removeAllRanges();d.remove();return ok;
}
function openUrl(h){const a=document.createElement("a");a.href=h;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove()}
async function warmMailLogo(){
  const s=S(),id=s.logoMail||s.logo;if(!id||(state.mailLogo&&state.mailLogo.id===id))return;
  try{const r=await fetch(BLOB+id);if(!r.ok)return;const b=await r.blob();const url=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b)});state.mailLogo={id,url}}catch(e){}
}
async function copyHtmlFor(i){
  if(liveMail())return verstuurLive(i);
  const c=compose,r=c&&c.recipients[i];if(!r)return;
  const ref=String(r.ref||""),_ab=/^afkondiging:/.test(ref)?state.beurten.find(b=>b.id===ref.split(":")[1]):null,fid=/^(factuur|aanmaning):/.test(ref)?ref.split(":")[1]:(_ab&&_ab.gefactureerd&&!["nvt","periodiek"].includes(_ab.gefactureerd)?_ab.gefactureerd:""),f=fid?state.facturen.find(x=>x.id===fid):null;
  const st=r.stap,tekst=st?st.mail:(c.mail||c.tekst),subj=fill(st?st.onderwerp:c.onderwerp,r.vars);
  const mid=newId("m"),tr=trackOn()&&!!r.k.email,html=tr?await trackHtml(mailFor(c.sjabloon,r.vars,tekst,{f,stap:st}),mid):mailFor(c.sjabloon,r.vars,tekst,{f,stap:st}),ok=await copyHtml(html,fill(tekst,r.vars));
  if(!ok){toast("Kopiëren lukte niet in deze weergave");return}
  if(r.k.email)openUrl("mailto:"+encodeURIComponent(r.k.email)+"?subject="+encodeURIComponent(subj));
  const bij=f?(f.soort==="offerte"?"Offerte ":"Factuur ")+f.nummer+".pdf":"";
  if(f){const doc=await pdfDoc(f);if(doc)await saveFile(bij,doc.output("arraybuffer"),"Mail gekopieerd en PDF opgeslagen: plak de mail (⌘V) en sleep de PDF erin")}
  else toast("Opgemaakte mail gekopieerd: plak hem (⌘V) in de nieuwe mail");
  c.sent[i]="kopie";
  try{await save("berichten",mid,{klantId:r.k.id||"",klantNaam:r.k.naam,naar:r.k.email||"",kanaal:"email",status:"gekopieerd",sjabloon:c.sjabloon,onderwerp:subj,tekst:fill(tekst,r.vars),op:new Date().toISOString(),ref:r.ref||"",bijlage:bij,track:tr});if(r.onSent)await r.onSent()}catch(e){err(e)}
  drawCmpList();
}
function vCommunicatie(){
  const bs=state.berichten,T=tpls(),qs=queues(),todo=qs.reduce((a,q)=>a+q.items.length,0);
  const n=k=>bs.filter(m=>m.kanaal===k).length,ms=mStat;if(trackOn())setTimeout(()=>syncTrack(),60);
  const stc={};Object.keys(MSTAT).forEach(k=>stc[k]=bs.filter(m=>ms(m)===k).length);
  let html=`<div class="pagehead"><div><p class="kicker">Communicatie</p><h1 class="xl">Berichten</h1><p class="lead" style="margin:0">${plural(bs.length,"bericht","berichten")}${todo?` · <b>${todo}</b> klaar om te versturen`:""}</p></div>
    <div class="acts"><button type="button" data-act="nieuwsbrief">${I.megaphone}Nieuwsbrief</button><button type="button" class="primary" data-act="pickrec">${I.send}Verstuur bericht</button></div></div>
  ${cmVlucht(bs,stc,n,todo)}
  <div class="seg" style="margin:18px 0 14px">${[["recent","Recent",bs.length],["klaar","Klaar om te versturen",todo],["templates","Templates",Object.keys(T).length]].map(([v,l,c])=>`<button type="button" data-act="ctab" data-v="${v}" aria-pressed="${state.ctab===v}">${l} <span class="mono" style="opacity:.6;font-size:12px">${c}</span></button>`).join("")}</div>`;
  if(state.ctab==="klaar"){
    const groups=[["alle","Alle actieve klanten"],["vandaag","Route vandaag"],["morgen","Route morgen"],...rondes().map(r=>["r:"+r,r]),...[...new Set(actief().filter(k=>k.nieuwsbrief!==false).map(k=>k.nbGroep||"Standaard"))].sort().map(g=>["nb:"+g,"Nieuwsbrief · "+g])];
    return html+`<div class="qgrid">${qs.map(x=>`<div class="qitem panel"><div style="display:flex;align-items:center;gap:8px"><b style="flex:1">${esc(x.titel)}</b><span class="pill ${x.items.length?(x.id==="aanmaning"?"late":"soon"):"ok"}">${x.items.length||"✓"}</span></div>
      <small>${esc(x.uitleg)}</small>${x.items.length?`<small style="color:var(--ink)">${x.items.slice(0,3).map(i=>esc(cleanName(i.k.naam))).join(", ")}${x.items.length>3?" en "+(x.items.length-3)+" meer":""}</small><button type="button" class="small primary" data-act="queue" data-q="${x.id}">Opstellen (${x.items.length})</button>`:`<small style="color:var(--ok)">Niets te doen</small>`}</div>`).join("")}</div>
    <div class="panel" style="margin-top:14px"><span class="eyebrow">Groepsbericht</span><p class="subt" style="margin:4px 0 10px">Bijvoorbeeld bij slecht weer: één bericht aan een ronde of de route van een dag.</p><div class="toolbar" style="margin:0"><select id="bulkGroup" style="flex:1 1 180px;width:auto">${groups.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select>
      <select id="bulkTpl" style="flex:1 1 160px;width:auto">${Object.keys(T).map(k=>`<option value="${esc(k)}" ${k==="weer"?"selected":""}>${esc(T[k].naam)}</option>`).join("")}</select><button type="button" data-act="bulk">Opstellen</button></div></div>`;
  }
  if(state.ctab==="templates"){
    const q=state.tq.toLowerCase(),F=state.tf;
    const keys=Object.keys(T).filter(k=>{const t=T[k];return(F==="alle"||(F==="email"?t.mail:t.sms))&&(!q||[t.naam,t.doel,t.onderwerp,t.mail,t.sms].join(" ").toLowerCase().includes(q))}).sort((a,b)=>T[a].naam.localeCompare(T[b].naam));
    const stl={klassiek:"Klassiek",modern:"Modern",luxe:"Luxe"}[S().mailStijl||"modern"];
    html+=`<div class="toolbar"><div class="search">${I.search}<input id="tq" type="search" placeholder="Zoek template…" value="${esc(state.tq)}"></div>
      <div class="seg">${[["alle","Alle"],["email","Email"],["sms","SMS"]].map(([v,l])=>`<button type="button" data-act="tf" data-v="${v}" aria-pressed="${F===v}">${l}</button>`).join("")}</div></div>
    <div class="panels" style="margin-bottom:16px"><button type="button" class="featc" data-act="mailstijl"><span class="objic big gl" style="--g:#b07a3a">${I.spark}</span><span><b>E-mail opmaak</b><small>Kies tussen Klassiek, Modern en Luxe — nu: ${stl}</small></span>${I.right}</button>
      <button type="button" class="featc" data-act="setedit" data-v="review"><span class="objic big gl" style="--g:#a68a3a">${I.spark}</span><span><b>Reviewverzoek</b><small>Tekst, wachttijd en reviewlink — automatisch na een factuur</small></span>${I.right}</button></div>
    <div class="splitrow" style="margin-bottom:14px"><p class="subt" style="margin:0;flex:1 1 300px">Eén kaart per doel. Schakel binnen de kaart tussen <b>E-mail</b> en <b>SMS</b>. Woorden zoals <code>[name.customer]</code> worden per klant ingevuld.</p>
      <span style="display:flex;gap:8px"><button type="button" data-act="tplstd">${I.copy}Standaard laden</button><button type="button" class="primary" data-act="tplnew">${I.plus}Nieuwe template</button></span></div>`;
    if(!keys.length)return html+empty("Geen templates gevonden","Probeer een andere zoekterm.");
    return html+`<div class="tplgrid">${keys.map(k=>{const t=T[k],v=state.tplSide[k]||(t.mail?"email":"sms"),sv=state.sjablonen[k]&&TPL[k];
      const isS=v!=="email",vc=[...new Set(((isS?t.sms||"":(t.onderwerp||"")+(t.mail||""))).match(/\[[a-z0-9_]+\.[a-z_]+\]|\{\w+\}/g)||[])].length,cat=t.cat||TPLGUESS[k]||"Algemeen",cg=CATGRAD[cat]||CATGRAD.Algemeen;
      return `<div class="tplc"><div class="tplh"><span class="objic gl" style="--g:${cg}">${isS?I.chat:I.mail}</span><div style="flex:1;min-width:0"><b>${esc(t.naam)}</b><small>${[t.mail&&"1 e-mail",t.sms&&"1 sms"].filter(Boolean).join(" · ")||"leeg"}</small></div>
        ${t.mail&&t.sms?`<div class="seg mini"><button type="button" data-act="tplsw" data-k="${esc(k)}" data-v="email" aria-pressed="${v==="email"}">E-mail</button><button type="button" data-act="tplsw" data-k="${esc(k)}" data-v="sms" aria-pressed="${v==="sms"}">SMS</button></div>`:""}</div>
        <div class="tplm"><b>${esc(t.doel||t.naam)}</b>${t.actief===false?`<span class="pill late">Inactief</span>`:""}<span class="pill ${t.eigen?"plan":sv?"soon":"brand"}">${t.eigen?"Eigen":sv?"Aangepast":"Standaard"}</span></div>
        ${v==="email"?`<div class="tpls">${esc(t.onderwerp)}</div>`:""}<p class="tplb">${esc((v==="email"?t.mail:t.sms).replace(/\s+/g," ").slice(0,150))}${(v==="email"?t.mail:t.sms).length>150?"…":""}</p>
        <div class="tplf"><span>${I.spark}${plural(vc,"variabele","variabelen")}</span><span style="flex:1"></span><button type="button" class="tiny ghost" data-act="tplview" data-k="${esc(k)}">${I.eye}Bekijken</button><button type="button" class="tiny ghost" data-act="tpledit" data-k="${esc(k)}" style="color:var(--brand)">${I.pencil}Aanpassen</button></div></div>`}).join("")}</div>`;
  }
  const q=state.mq.toLowerCase(),pp=state.mpp||25;
  const log=[...bs].sort((a,b)=>String(b.op).localeCompare(String(a.op))).filter(m=>(state.mch==="alle"||m.kanaal===state.mch)&&(state.mst==="alle"||ms(m)===state.mst)&&(!q||[m.klantNaam,m.tekst,m.naar,m.onderwerp].join(" ").toLowerCase().includes(q)));
  const pages=Math.max(1,Math.ceil(log.length/pp));if(state.mpage>pages)state.mpage=pages;
  html+=`<div class="toolbar"><div class="search">${I.search}<input id="mq" type="search" placeholder="Zoek klant of inhoud…" value="${esc(state.mq)}"></div>
    <div class="seg">${[["alle","Alle"],["email","Email"],["sms","SMS"],["whatsapp","WhatsApp"]].map(([v,l])=>`<button type="button" data-act="mch" data-v="${v}" aria-pressed="${state.mch===v}">${l}</button>`).join("")}</div>
    <select id="mst" style="width:auto"><option value="alle">Alle statussen</option>${Object.keys(MSTAT).map(k=>`<option value="${k}" ${state.mst===k?"selected":""}>${MSTAT[k][1]}</option>`).join("")}</select></div>
  <div class="countline"><span class="eyebrow">${plural(log.length,"bericht","berichten")}</span><label style="flex-direction:row;align-items:center;gap:8px">Per pagina<select id="mpp">${[25,50,100].map(x=>`<option ${x===pp?"selected":""}>${x}</option>`).join("")}</select></label></div>`;
  if(!log.length)return html+empty(bs.length?"Geen berichten gevonden":"Nog geen berichten","Elk bericht dat je via mijnschoonmaker opent of kopieert, komt in deze log.");
  html+=`<div class="list">${log.slice((state.mpage-1)*pp,state.mpage*pp).map(m=>{const d=new Date(m.op),ago=Math.round((today()-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/DAY),st=MSTAT[ms(m)];return `<div class="card msgc${m.klantId?" click":""}" ${m.klantId?`data-act="klant" data-id="${esc(m.klantId)}"`:""}>
    <span class="av sm" style="grid-row:1/span 3;align-self:start">${esc(initials(m.klantNaam))}</span>
    <span class="msg-to"><span class="kn ${m.kanaal}">${m.kanaal==="email"?I.mail:m.kanaal==="sms"?I.sms:I.msg}</span><b>${esc(m.naar||cleanName(m.klantNaam))}</b></span>
    <div class="msg-subj">${esc(m.onderwerp||(T[m.sjabloon]||{}).naam||"Bericht")}${m.naar?` · <span style="font-weight:500;color:var(--muted)">${esc(cleanName(m.klantNaam))}</span>`:""}</div>
    <div class="msg-body">${esc(m.tekst)}</div>${mailTrk(m)}
    <div class="side-col" style="grid-row:1;flex-direction:row;align-items:center">${statusPill(st[0]==="ok2"?"ok":st[0],st[1])}<span class="subt mono" style="font-size:12px">${ago===0?pad(d.getHours())+":"+pad(d.getMinutes()):ago<=6?ago+"d":fmtD(iso(d))}</span></div></div>`}).join("")}</div>`;
  if(pages>1)html+=`<div class="pager"><button type="button" class="small" data-act="mpage" data-n="-1" ${state.mpage<=1?"disabled":""}>${I.left}</button><span class="mono">${state.mpage} / ${pages}</span><button type="button" class="small" data-act="mpage" data-n="1" ${state.mpage>=pages?"disabled":""}>${I.right}</button></div>`;
  return html;
}
function openMailStijl(){
  const s=S();let stijl=s.mailStijl||"modern",acc=s.mailAccent||"#111111",tab="factuur";
  const SW=["#2b3cb0","#2f7a6e","#b3263c","#121826"],ST=[["klassiek","Klassiek","Zakelijk en vertrouwd: wit, serif koptekst, logo links en dunne lijnen in uw accentkleur."],["modern","Modern","Strakke witte kaart met afgeronde hoeken, gecentreerd logo en een accentstreep bovenaan."],["luxe","Luxe","Premium uitstraling: donkere kopband, serif titel, veel witruimte en een fijne accentlijn."]];
  const T=tpls(),tk={factuur:"factuur",aankondiging:"aankondiging",herinnering:"aanmaning",review:"review"};
  const prev=()=>{const k=tk[tab],v=sampleVars(),vv={...v,klant:tab==="factuur"?"mevrouw De Vries":"klant"};const old={...state.settings};state.settings={...state.settings,mailStijl:stijl,mailAccent:acc};
    const h=mailFor(k,vv,T[k].mail,{preview:true});state.settings=old;return h};
  const draw=()=>{$("#msB").innerHTML=`<div class="stgrid">${ST.map(([k,l,d])=>`<button type="button" class="stc${stijl===k?" on":""}" data-st="${k}"><span class="stv ${k}"><i></i><i></i><i></i></span><b>${l}${stijl===k?I.check:""}</b><small>${d}</small></button>`).join("")}</div>
    <div class="secl" style="color:var(--ink);font-size:14px;letter-spacing:0;text-transform:none">Accentkleur</div><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${SW.map(c=>`<button type="button" class="swatch${acc===c?" on":""}" data-sw="${c}" style="background:${c}" aria-label="Kleur ${c}"></button>`).join("")}<span class="subt">Eigen kleur</span><input type="color" id="msC" value="${esc(acc)}" style="width:52px;height:44px;padding:3px"></div>
    <div class="splitrow"><b style="display:flex;gap:8px;align-items:center">${I.search}Voorbeeld</b><button type="button" class="small" id="msTest">${I.send}Testmail naar mij</button></div>
    <div class="seg" style="display:grid;grid-template-columns:repeat(4,1fr)">${[["factuur","Factuur"],["aankondiging","Aankondiging"],["herinnering","Herinnering"],["review","Review"]].map(([k,l])=>`<button type="button" data-tb="${k}" aria-pressed="${tab===k}">${l}</button>`).join("")}</div>
    <div class="mailprev">${prev()}</div><small class="help">Deze stijl geldt voor de knop <b>Opgemaakt</b> bij facturen, herinneringen, offertes, reviewverzoeken en aankondigingen. Logo en bedrijfsgegevens komen uit Instellingen › Bedrijf &amp; Branding. Je logo staat in de voorbeelden; in een geplakte mail verschijnt je bedrijfsnaam, want het logo staat in je privé-pagina.</small>`};
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:linear-gradient(135deg,#f0a33c,#e0822c)">${I.spark}</span><div style="flex:1"><h3>E-mail opmaak</h3><div class="subt">Kies hoe je opgemaakte mails eruitzien</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div id="msB" class="setbody"></div><div class="row stickyfoot"><button type="button" class="ghost" data-act="close">Annuleren</button><span class="sp"></span><button type="submit" class="primary" id="msSave">Opmaak opslaan</button></div>`,{wide:true});
  draw();
  $("#msB").addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.st){stijl=b.dataset.st;draw()}else if(b.dataset.sw){acc=b.dataset.sw;draw()}else if(b.dataset.tb){tab=b.dataset.tb;draw()}
    else if(b.id==="msTest"){const k=tk[tab],old={...state.settings};state.settings={...state.settings,mailStijl:stijl,mailAccent:acc};const v=sampleVars(),h=mailFor(k,v,T[k].mail);state.settings=old;
      if(await copyHtml(h,fill(T[k].mail,v))){if(s.email)openUrl("mailto:"+encodeURIComponent(s.email)+"?subject="+encodeURIComponent("Test: "+fill(T[k].onderwerp,v)));if(tab==="factuur"){const df=demoFactuur(),doc=await pdfDoc(df,demoKlant);if(doc)await saveFile("Voorbeeldfactuur.pdf",doc.output("arraybuffer"),"Mail gekopieerd en PDF opgeslagen: plak de mail (⌘V) en sleep de PDF erin");return}toast(s.email?"Opgemaakte mail gekopieerd: plak hem (⌘V) in de testmail":"Gekopieerd. Vul je e-mail in bij Bedrijf & Branding voor een testmail")}else toast("Kopiëren lukte niet in deze weergave")}});
  $("#msB").addEventListener("input",e=>{if(e.target.id==="msC"){acc=e.target.value;$(".mailprev").innerHTML=prev()}});
  $("#msB").addEventListener("change",e=>{if(e.target.id==="msC")draw()});
  form.onsubmit=async e=>{e.preventDefault();$("#msSave").disabled=true;if(await saveSettings({mailStijl:stijl,mailAccent:acc},"E-mail opmaak opgeslagen")){dlg.close();schedule()}else $("#msSave").disabled=false};
}
function openTplView(k){
  const t=tpls()[k];if(!t)return;const v=sampleVars();let mode="code";
  const side=(state.tplSide&&state.tplSide[k])||(t.mail?"email":"sms"),isM=side==="email"&&t.mail,cat=t.cat||TPLGUESS[k]||"Algemeen";
  const kan=(isM?"E-mail":"SMS / WhatsApp")+" · "+cat;
  const vs=[...new Set(((isM?(t.onderwerp||"")+t.mail:t.sms||"")).match(/\[[a-z0-9_]+\.[a-z_]+\]|\{\w+\}/g)||[])];
  const box=(lab,txt,id)=>`<div class="tv-sec"><div class="tv-h"><span class="tv-l">${lab}</span><button type="button" class="tv-copy" data-copy="${id}">${I.copy||""}Kopieer</button></div><pre class="tv-code">${esc(txt)}</pre></div>`;
  const draw=()=>{$("#tvB").innerHTML=mode==="code"?`
    ${t.doel?`<div class="tv-sec"><span class="tv-l">Beschrijving</span><p class="tv-p">${esc(t.doel)}</p></div>`:""}
    ${isM?`<div class="tv-sec"><span class="tv-l">Onderwerp</span><p class="tv-p"><b>${esc(t.onderwerp||"")}</b></p></div>${t.mailHtml?`<div class="tv-sec"><div class="tv-h"><span class="tv-l">Inhoud</span><button type="button" class="tv-copy" data-copy="mail">${I.copy||""}Kopieer</button></div><div class="tv-code tv-rich">${richSafe(t.mailHtml)}</div></div>`:box("Inhoud",t.mail,"mail")}`:box("Inhoud",t.sms||"","sms")}
    ${vs.length?`<div class="tv-sec"><span class="tv-l">Variabelen</span><div class="tv-vars">${vs.map(x=>`<code>${esc(x)}</code>`).join("")}</div></div>`:""}`
    :(isM?`<div class="tv-sec"><span class="tv-l">E-mail · ${esc(fill(t.onderwerp,v))}</span><div class="mailprev">${mailFor(k,v,t.mail,{preview:true})}</div></div>`
    :`<div class="tv-sec"><span class="tv-l">SMS / WhatsApp</span><div class="bubble">${esc(fill(t.sms||"",v))}<small class="subt">${fill(t.sms||"",v).length} tekens</small></div></div>`);
    $("#tvMode").textContent=mode==="code"?"Voorbeeld bekijken":"Sjabloon bekijken"};
  openDlg(`<div class="dlg-head"><span class="objic big" style="${isM?"background:var(--plan-bg);color:var(--plan)":"background:#fdf1dc;color:#d9891c"}">${isM?I.mail:(I.chat||I.send)}</span><div style="flex:1;min-width:0"><h3>${esc(t.naam)}</h3><div class="subt">${esc(kan)}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div id="tvB"></div>
  <div class="row"><button type="button" class="ghost" id="tvMode"></button><span class="sp"></span><button type="button" data-act="close">Sluiten</button><button type="button" class="primary" data-act="tpledit" data-k="${esc(k)}">${I.note}Aanpassen</button></div>`,{wide:true});
  draw();
  $("#tvMode").onclick=()=>{mode=mode==="code"?"prev":"code";draw()};
  $("#tvB").addEventListener("click",e=>{const b=e.target.closest("[data-copy]");if(b)copy(b.dataset.copy==="mail"?t.mail:t.sms,b)});
}
const TPLGUESS={aankondiging:"Aankondiging",afkondiging:"Afkondiging",weer:"Afspraak",wijzigen:"Afspraak",afspraak:"Afspraak",annuleren:"Afspraak",factuur:"Factuur",aanmaning:"Herinnering",herinnering:"Herinnering",offerte:"Offerte",review:"Review",welkom:"Welkom",voltooid:"Afkondiging",nieuwsbrief:"Algemeen",vrij:"Algemeen"};
const TPLCAT=["Aankondiging","Afkondiging","Afspraak","Factuur","Herinnering","Offerte","Review","Welkom","Algemeen"];
function openTplEdit(k){
  const T=tpls(),isNew=!k,t=isNew?{naam:"",doel:"",onderwerp:"Bericht van [name.company]",mail:"Beste [name.customer],\n\n\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], ",eigen:true}:T[k];
  const guess=TPLGUESS[k]||"Algemeen",_g=({aankondiging:"Aankondiging",afkondiging:"Aankondiging",weer:"Afspraak",wijzigen:"Afspraak",afspraak:"Afspraak",annuleren:"Afspraak",factuur:"Factuur",aanmaning:"Herinnering",herinnering:"Herinnering",offerte:"Offerte",review:"Review",welkom:"Welkom"})[k]||"Algemeen";
  const sd=k&&state.tplSide&&state.tplSide[k];let kanaal=sd?(sd==="email"?"mail":"sms"):(t.mail||!t.sms?"mail":"sms"),last=null;
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:var(--plan-bg);color:var(--plan)">${I.note}</span><div style="flex:1;min-width:0"><h3>${isNew?"Nieuwe template":"Template aanpassen"}</h3><div class="subt">E-mail of sms-bericht met variabelen</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="grid2"><label class="te-lab">Naam<input id="te-n" value="${esc(t.naam)}" required></label><label class="te-lab">Categorie<select id="te-cat">${TPLCAT.map(c=>`<option${(t.cat||guess)===c?" selected":""}>${c}</option>`).join("")}</select></label></div>
  <label class="te-lab">Beschrijving<input id="te-d" value="${esc(t.doel||"")}" placeholder="Waar is dit bericht voor?"></label>
  <div class="te-lab">Kanaal<div class="te-seg" role="group"><button type="button" data-kn="mail">${I.mail}Email</button><button type="button" data-kn="sms">${I.chat||I.send}SMS / WhatsApp</button></div></div>
  <div id="te-mailbox"><label class="te-lab">Onderwerp<input id="te-o" value="${esc(t.onderwerp)}"></label>
    <div class="te-lab">Inhoud<div class="rtx">
      <div class="rt-bar" role="toolbar" aria-label="Opmaak">
        <select data-rt="fontName" title="Lettertype"><option value="">Lettertype</option><option value="-apple-system,'Segoe UI',Helvetica,Arial,sans-serif">Standaard</option><option value="Arial,Helvetica,sans-serif">Arial</option><option value="Georgia,'Times New Roman',serif">Georgia</option><option value="'Times New Roman',Times,serif">Times</option><option value="Verdana,Geneva,sans-serif">Verdana</option><option value="'Trebuchet MS',sans-serif">Trebuchet</option><option value="'Courier New',monospace">Courier</option></select>
        <select data-rt="fontSize" title="Grootte"><option value="">Grootte</option><option value="2">Klein</option><option value="3">Normaal</option><option value="4">Groot</option><option value="5">Extra groot</option><option value="6">Kop</option></select>
        <span class="rt-sep"></span>
        <button type="button" data-rc="bold" title="Vet (⌘B)"><b>B</b></button><button type="button" data-rc="italic" title="Schuin (⌘I)"><i>I</i></button><button type="button" data-rc="underline" title="Onderstrepen (⌘U)"><u>U</u></button>
        <span class="rt-sep"></span>
        <button type="button" data-rc="insertUnorderedList" title="Opsomming">• ≡</button>
        <label class="rt-col" title="Tekstkleur"><span>A</span><input type="color" data-rt="foreColor" value="#111111"></label>
        <span class="rt-sep"></span>
        <button type="button" data-rc="removeFormat" title="Opmaak wissen">Tx</button>
      </div>
      <div id="te-m" class="rt-ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Inhoud e-mail">${t.mailHtml?richSafe(t.mailHtml):plainRich(t.mail)}</div></div>
      <small class="help">Selecteer tekst en kies vet, lettertype of grootte. Leeg = geen e-mailversie. De stijl van de mail (Klassiek, Modern, Luxe) kies je bij E-mail opmaak.</small></div></div>
  <div id="te-smsbox"><label class="te-lab">Inhoud<textarea id="te-s" class="te-code" style="min-height:140px">${esc(t.sms)}</textarea></label><div class="te-cnt" id="te-c"></div></div>
  <div class="te-lab">Tags invoegen<div class="tg-box">${TAGS.map(([g,l])=>`<div class="tg-g"><span class="tg-h">Tags ${esc(g.toLowerCase())}</span>${l.map(([tg,lab])=>`<button type="button" class="tg-r" data-var="${tg}"><span>${esc(lab)}</span><code>[${tg}]</code></button>`).join("")}</div>`).join("")}</div></div>
  <label class="te-chk"><input type="checkbox" id="te-a" ${t.actief!==false?"checked":""}><span>Actief (beschikbaar om te versturen)</span></label>
  <div class="row stickyfoot">${isNew||!t.eigen?(isNew?"":`<button type="button" class="ghost" id="teReset">Standaardtekst terugzetten</button>`):`<button type="button" class="ghost danger" id="teDel">${I.trash}Verwijderen</button>`}<span class="sp"></span><button type="button" data-act="close">Annuleren</button><button type="submit" class="primary" id="teSave">${I.check}Opslaan</button></div>`,{wide:true});
  const kn=()=>{form.querySelectorAll("[data-kn]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.kn===kanaal));$("#te-mailbox").hidden=kanaal!=="mail";$("#te-smsbox").hidden=kanaal!=="sms";last=null};
  form.querySelectorAll("[data-kn]").forEach(b=>b.onclick=()=>{kanaal=b.dataset.kn;kn()});kn();
  const cnt=()=>{const raw=$("#te-s").value,n=raw.length,f=fill(raw,sampleVars()).length,parts=f<=160?1:Math.ceil(f/153),room=parts*(parts>1?153:160)-f,el=$("#te-c");
    el.className="te-cnt"+(parts>1?" warn":"");el.innerHTML=n?`${I.chat||""}<span><b>${n} tekens · ingevuld ca. ${f} · ${parts} SMS</b> — nog ${room} tekens ruimte</span>`:`<span>Leeg = geen sms-versie</span>`};$("#te-s").oninput=cnt;cnt();
  const ed=$("#te-m");let rng=null;try{document.execCommand("styleWithCSS",false,true)}catch(_){}
  const keep=()=>{const sl=getSelection();if(sl.rangeCount&&ed.contains(sl.anchorNode))rng=sl.getRangeAt(0).cloneRange()};
  const terug=()=>{ed.focus();if(rng){const sl=getSelection();sl.removeAllRanges();sl.addRange(rng)}};
  ["keyup","mouseup","input","blur"].forEach(ev=>ed.addEventListener(ev,keep));
  form.querySelectorAll("[data-rc]").forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{terug();document.execCommand(b.dataset.rc,false,null);keep()}});
  form.querySelectorAll("[data-rt]").forEach(x=>x.addEventListener(x.type==="color"?"input":"change",()=>{if(!x.value)return;terug();document.execCommand(x.dataset.rt,false,x.value);keep();if(x.tagName==="SELECT")x.value=""}));
  ed.addEventListener("paste",e=>{e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData("text/plain");document.execCommand("insertText",false,t)});
  form.querySelectorAll("textarea,#te-o").forEach(x=>x.addEventListener("focus",()=>last=x));ed.addEventListener("focus",()=>last=ed);
  form.querySelectorAll("[data-var]").forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const v="["+b.dataset.var+"]",x=last||(kanaal==="mail"?ed:$("#te-s"));
    if(x===ed){terug();document.execCommand("insertText",false,v);keep();return}
    const p=x.selectionStart??x.value.length;x.value=x.value.slice(0,p)+v+x.value.slice(x.selectionEnd??p);x.focus();x.selectionStart=x.selectionEnd=p+v.length;cnt()}});
  const all=()=>({...state.sjablonen});
  const r=$("#teReset");if(r)r.onclick=async()=>{const o=all();delete o[k];try{await save("instellingen","sjablonen",o);dlg.close();toast("Standaardtekst teruggezet")}catch(e){err(e)}};
  const d=$("#teDel");if(d){let armed=false;d.onclick=async()=>{if(!armed){armed=true;d.textContent="Zeker weten? Tik nogmaals";return}const o=all();delete o[k];try{await save("instellingen","sjablonen",o);dlg.close();toast("Template verwijderd")}catch(e){err(e)}}}
  form.onsubmit=async e=>{e.preventDefault();const n=$("#te-n").value.trim();if(!n){$("#te-n").focus();return}
    const o=all(),key=k||"eigen"+Date.now().toString(36);o[key]={...(state.sjablonen[key]||{}),naam:n,doel:$("#te-d").value.trim(),cat:$("#te-cat").value,actief:$("#te-a").checked,onderwerp:$("#te-o").value.trim(),mail:(()=>{const h=richSafe(ed.innerHTML).trim(),pl=richText(h);return pl?h:""})(),sms:$("#te-s").value,...(t.eigen?{eigen:true}:{})};
    $("#teSave").disabled=true;try{await save("instellingen","sjablonen",o);dlg.close();toast(isNew?"Template toegevoegd":"Template opgeslagen")}catch(er){$("#teSave").disabled=false;err(er)}};
}

/* ---------- Communicatie: envelopjes die van verstuurd naar geopend vliegen ---------- */
const CM_ENV='<svg viewBox="0 0 40 30" aria-hidden="true"><rect x="1.5" y="1.5" width="37" height="27" rx="4" fill="#fff"/><path d="M2.5 4 20 17 37.5 4" fill="none" stroke="#9fb7bf" stroke-width="2" stroke-linejoin="round"/><path d="M2.5 27 15 15M37.5 27 25 15" stroke="#d5e2e6" stroke-width="1.6"/></svg>';
function cmVlucht(bs,stc,n,todo){const ms=mStat,tot=bs.length;
  const verst=bs.filter(m=>m.kanaal==="email"&&!["mislukt","bounce","spam"].includes(ms(m))).length;
  const open=bs.filter(m=>["gelezen","geklikt"].includes(ms(m))).length,klik=stc.geklikt||0,mis=(stc.mislukt||0)+(stc.bounce||0)+(stc.spam||0);
  const pO=verst?Math.round(open/verst*100):0,pK=verst?Math.round(klik/verst*100):0;
  const mot=!tot?"Nog geen berichten verstuurd. Je eerste mail vliegt zo de deur uit.":!trackOn()?"Zet mail-tracking aan bij Instellingen, dan zie je wie je mail opent.":pO>=60?`${pO}% van je mails wordt geopend. Dat is sterk!`:verst?`${open} van ${verst} mails geopend.`:"Verstuur een mail om te zien wie hem opent.";
  const st=(l,w,ic,c)=>`<div class="cm-s"><span class="cm-i" style="--c:${c}">${ic}</span><span><small>${l}</small><b>${w}</b></span></div>`;
  const nE=Math.min(5,Math.max(1,Math.round(pO/20)));
  return `<section class="cm"><div class="cm-top"><div><p class="cm-k">Berichten</p><div class="cm-big"><b>${tot}</b><span>${plural(tot,"bericht","berichten")} verstuurd${todo?` · <em>${todo} klaar om te versturen</em>`:""}</span></div><p class="cm-mot">${mot}</p></div>
      <div class="cm-ch">${st("E-mail",n("email"),I.mail,"#b9b3ff")}${st("SMS",n("sms"),I.sms,"#ffd29a")}${st("WhatsApp",n("whatsapp"),I.msg,"#9ff0c4")}</div></div>
    <div class="cm-lucht">
      <svg class="cm-boog" viewBox="0 0 600 90" preserveAspectRatio="none" aria-hidden="true"><path d="M20 70 C 160 6, 440 6, 580 70" fill="none" stroke="rgb(255 255 255 / .35)" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/></svg>
      <div class="cm-pt p1"><i>${I.send}</i><b>${verst}</b><small>verstuurd</small></div>
      <div class="cm-pt p2"><i>${I.eye}</i><b>${open}</b><small>geopend · ${pO}%</small></div>
      <div class="cm-pt p3"><i>${I.right}</i><b>${klik}</b><small>geklikt · ${pK}%</small></div>
      ${tot?[...Array(nE)].map((_,i)=>`<span class="cm-env" style="--d:${i*.9}s">${CM_ENV}</span>`).join(""):""}
    </div>
    ${mis?`<p class="cm-mis"><i></i>${plural(mis,"bericht kwam","berichten kwamen")} niet aan</p>`:""}</section>`}
