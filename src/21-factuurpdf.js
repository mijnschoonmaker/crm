/* datum achter een omschrijving weghalen; de datum staat al in een eigen kolom */
const omsZonderDatum=t=>String(t||"").replace(/\s+\d{1,2} (januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december) \d{4}\s*$/i,"");
/* ---------- FACTUUR-OPMAAK (scherm en PDF, A4) ---------- */
/* klant bij een factuur: op id, anders op naam (oude of handmatige facturen) */
function invKlant(f){const ks=state.klanten||[];return ks.find(x=>x.id===f.klantId)||(f.klantNaam?ks.find(x=>cleanName(x.naam).trim().toLowerCase()===cleanName(f.klantNaam).trim().toLowerCase()):null)||null}
function invData(f,klant){
  const s=S(),off=f.soort==="offerte",t=totals(f),btw=Number(f.btw??s.btw),incl=f.incl??s.incl;
  const k=klant||invKlant(f)||{};
  const regels=(f.regels||[]).map(r=>{const p=Number(r.prijs)||0,ex=incl?p/(1+btw/100):p,a=Number(r.aantal)||0;return{oms:omsZonderDatum(String(r.omschrijving||"").replace(/ ?\(minimumtarief\)/gi,"")),aantal:a,prijs:r2(ex),btw,tot:r2(ex*a),subs:Array.isArray(r.subs)?r.subs:null}});
  const st=off?{concept:["CONCEPT","n"],verstuurd:["VERSTUURD","b"],geaccepteerd:["GEACCEPTEERD","g"],afgewezen:["AFGEWEZEN","r"]}[f.status||"concept"]:f.status==="betaald"?["BETAALD","g"]:f.status==="concept"?["CONCEPT","n"]:fStatus(f)[1]==="Achterstallig"?["VERVALLEN","r"]:["TE BETALEN","b"];
  /* volledige naam/adres: adres van de factuur, aangevuld met het (factuur)adres van de klant als daar iets ontbreekt */
  const kAdr=k&&(k.adres||k.fAdres)?(typeof factAddr==="function"&&(off?false:k.fAdres)?factAddr(k):fullAddr(k)):"";
  let naar=String(f.klantAdres||"").split(", ").filter(Boolean);const kl=String(kAdr||"").split(", ").filter(Boolean);
  if(naar.length<2&&kl.length>naar.length)naar=kl;
  const tav=typeof tavK==="function"?tavK(k,off?"offerte":"factuur"):"";if(tav&&!naar.some(x=>x.includes(tav)))naar.unshift("T.a.v. "+tav);
  if(k&&k.soort==="zakelijk"&&k.contact&&!tav)naar.unshift("T.a.v. "+k.contact);
  return{s,off,t,btw,regels,st,titel:off?"OFFERTE":"FACTUUR",
    van:[s.adres,[s.postcode,s.plaats].filter(Boolean).join(" "),(LANDEN[s.land]||LANDEN.NL).n,s.btwnr&&"BTW "+s.btwnr,s.kvk&&"KvK "+s.kvk].filter(Boolean),
    klantNaam:cleanName(f.klantNaam||k.naam||""),naar,klantContact:[k.email||f.klantEmail,k.telefoon].filter(Boolean).join(" · "),
    meta:[[off?"Offertedatum":"Factuurdatum",fmtL(f.datum)],[off?"Geldig tot":"Vervalt op",fmtL(f.verval)],[off?"Offertenummer":"Factuurnummer",f.nummer]],
    termijn:Math.max(0,Math.round((parse(f.verval)-parse(f.datum))/DAY)),
    voldaan:f.status==="betaald"&&["contant","pin"].includes(f.betaalwijze)?"Voldaan per "+f.betaalwijze+" op "+fmtL(f.betaaldOp):""};
}
function invRows(f,klant){
  const d=invData(f,klant),s=d.s,k=klant||invKlant(f)||{};
  const nr=k.id||k.klantnr?klantNr(k):"1026";
  const info=[["Adres",[s.adres,[s.postcode,s.plaats].filter(Boolean).join(" ")].filter(Boolean)],["",[]],["Telefoon",[s.telefoon]],["E-mailadres",[s.email]],["",[]],["KVK-nummer",[s.kvk]],["BTW",[s.btwnr]],["IBAN",[String(s.iban||"").replace(/\s/g,"")]],["BIC",[s.bic]],["Klantnummer",[String(nr)]],[d.off?"Offertenummer":"Factuurnummer",[f.nummer]],[d.off?"Offertedatum":"Factuurdatum",[fmtNum(f.datum).replace(/ /g,"")]],...(d.off?[["Geldig tot",[fmtNum(f.verval).replace(/ /g,"")]]]:[])]
    .filter(([l,v],i,arr)=>l?v.some(Boolean):(arr[i-1]&&arr[i-1][1].some(Boolean)));
  const regels=d.regels.map(r=>({...r,datum:fmtNum(f.datum).replace(/ /g,""),ex:r.tot,inc:r2(r.tot*(1+r.btw/100))}));
  const iban=String(s.iban||"").replace(/\s/g,""),vw=s.voorwaarden&&/^https?:/.test(s.voorwaarden)?s.voorwaarden.replace(/^https?:\/\//,""):s.voorwaardenPdf?"onze website":"";
  const betaal=d.off?`Deze offerte is geldig tot ${fmtNum(f.verval).replace(/ /g,"")}. Gaat u akkoord? Laat het ons weten, dan plannen wij u in.`
    :d.voldaan?`${d.voldaan}. Hartelijk dank voor uw betaling.`
    :`We verzoeken u vriendelijk het bovenstaande bedrag van ${eur(d.t.inc)} voor ${fmtNum(f.verval).replace(/ /g,"")} te voldoen op onze bankrekening: ${iban||"(IBAN)"} tnv: ${s.naam||""} onder vermelding van het factuurnummer: ${f.nummer}.${s.betaallink?" Direct betalen kan via: "+s.betaallink:""}`;
  const vwTxt=vw?`Op deze ${d.off?"offerte":"factuur"} zijn onze algemene voorwaarden van toepassing, te vinden op ${vw}.${d.off?"":" Bij niet-tijdige betaling zijn wij gerechtigd de vordering uit handen te geven en wettelijke rente en incassokosten in rekening te brengen."}`:"";
  return{...d,info,regels,betaal,vwTxt,naamKlant:d.klantNaam};
}
function invModel(f,klant){
  const d=invRows(f,klant),s=d.s;
  const hex=x=>/^#[0-9a-f]{6}$/i.test(x||"")?x:null,lum=h=>{const n=parseInt(h.slice(1),16);return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255};
  let A=hex(s.hoofdkleur)||"#11181c";if(lum(A)>.75)A="#11181c";
  const kn=(d.info.find(x=>x[0]==="Klantnummer")||[,[""]])[1][0];
  const meta=[[d.off?"Offertenummer":"Factuurnummer",f.nummer],[d.off?"Offertedatum":"Factuurdatum",fmtL(f.datum)],[d.off?"Geldig tot":"Vervaldatum",fmtL(f.verval)],["Klantnummer",kn]];
  const coLines=[s.adres,[s.postcode,s.plaats].filter(Boolean).join(" "),s.telefoon,s.email].filter(Boolean);
  const pay=d.off?null:d.voldaan?null:[["IBAN",String(s.iban||"—")],["T.n.v.",s.naam||"—"],["Factuurnr.",f.nummer],["Uiterlijk",fmtL(f.verval)]];
  const foot=[s.naam,s.kvk&&"KvK "+s.kvk,s.btwnr&&"BTW-id "+s.btwnr,s.website].filter(Boolean);
  const zin=d.off?`Deze offerte is geldig tot ${fmtL(f.verval)}. Gaat u akkoord? Laat het ons weten, dan plannen wij u direct in.`:d.voldaan?`${d.voldaan}. Hartelijk dank voor uw betaling.`:`Graag vóór ${fmtL(f.verval)} overmaken onder vermelding van het factuurnummer.${s.betaallink?" Direct betalen kan via "+s.betaallink+".":""}`;
  const pill=!d.off&&(d.st[1]==="g"||d.st[1]==="r");
  const coInfo=d.info.filter(([l])=>l!=="Offertenummer"&&l!=="Factuurnummer").map(([l,v])=>[l,v.filter(Boolean)]);
  const vervalRij=d.off?null:["Vervaldatum",[fmtNum(f.verval).replace(/ /g,"")]];if(vervalRij)coInfo.push(vervalRij);const di=coInfo.findIndex(([l])=>/datum|Geldig/i.test(l));if(di>0&&coInfo[di-1][0])coInfo.splice(di,0,["",[]]);
  return{...d,pill,A,meta,coLines,pay,foot,zin,coInfo,betreft:(d.off?"Offerte ":"Factuur ")+f.nummer,titel:d.off?"Offerte":"Factuur",stLabel:{b:"Openstaand",g:d.off?"Geaccepteerd":"Betaald",r:d.off?"Afgewezen":"Vervallen",n:d.st[0]==="VERSTUURD"?"Verstuurd":"Concept"}[d.st[1]]||d.st[0]};
}
const offTxt=(t,f)=>{const k=typeof invKlant==="function"?invKlant(f):null,vn=k&&k.voornaam?k.voornaam:String(cleanName(f.klantNaam||"")).split(",").slice(-1)[0].trim();let v={};try{v=k&&k.id&&typeof klantVars==="function"?klantVars(k):{}}catch(e){}return fill(t,{...v,klant:cleanName(f.klantNaam||""),naam:cleanName(f.klantNaam||""),voornaam:vn,bedrijf:S().naam||"",factuurnummer:f.nummer||"",vervaldatum:f.verval?fmtL(f.verval):""}).trim()};
function paperHtml(f,klant){
  const m=invModel(f,klant),s=m.s,num=x=>(Number(x)||0).toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2});
  const vanX=[s.kvk&&"KvK "+s.kvk,s.btwnr&&"BTW "+s.btwnr].filter(Boolean).join(" · ");
  const hero=m.off?[["Totaal",`€ ${num(m.t.inc)}`],["Geldig tot",fmtL(f.verval)],["Offertedatum",fmtL(f.datum)]]:m.voldaan||m.st[1]==="g"?[["Betaald",`€ ${num(m.t.inc)}`],["Betaald op",fmtL(f.betaaldOp||f.datum)],["Factuurdatum",fmtL(f.datum)]]:[["Te betalen",`€ ${num(m.t.inc)}`],["Vervaldatum",fmtL(f.verval)],["Factuurdatum",fmtL(f.datum)]];
  return `<div class="inv5" style="--A:${m.A}">
  <div class="i5-top"><div class="i5-lft"><div class="i5-lg">${s.logo?`<img src="${BLOB}${esc(s.logo)}" alt="" class="i5-logo">`:`<b class="i5-coname">${esc(s.naam||"Je bedrijfsnaam")}</b>`}</div>
      <div class="i5-kl"><b>${esc(m.naamKlant)}</b>${m.naar.map(x=>`<span>${esc(x)}</span>`).join("")}</div></div>
    <div class="i5-co"><b>${esc(s.naam||"Je bedrijfsnaam")}</b><table>${m.coInfo.map(([l,v])=>l?`<tr><th>${esc(l)}</th><td>${v.map(esc).join("<br>")}</td></tr>`:`<tr class="gap"><td colspan="2"></td></tr>`).join("")}</table></div></div>
  ${f.soort==="offerte"&&offTxt(f.tekst,f)?`<div class="i5-txt">${esc(offTxt(f.tekst,f)).replace(/\n/g,"<br>")}</div>`:""}
  ${f.soort==="offerte"&&f.letop&&offTxt(f.letopTekst,f)?`<div class="i5-letop"><b>Let op:</b><span>${esc(offTxt(f.letopTekst,f)).replace(/\n/g,"<br>")}</span></div>`:""}
  ${m.off?`<table class="i5-t i5-og"><thead><tr><th>Omschrijving</th><th class="c">Aantal</th><th class="r">Prijs excl.</th><th class="r">Btw</th><th class="r">Prijs incl.</th></tr></thead><tbody>
    ${m.regels.map(r=>`<tr class="i5g-h${r.subs&&r.subs.length?" has":""}"><td><b>${esc(r.oms)}</b></td><td class="c">${r.subs&&r.subs.length?"":r.aantal}</td><td class="r"><b>€ ${num(r.ex)}</b></td><td class="r">${r.btw}%</td><td class="r"><b>€ ${num(r.ex*(1+r.btw/100))}</b></td></tr>${(r.subs||[]).map((x,i,a)=>`<tr class="i5g-s${i===a.length-1?" last":""}"><td>${esc(x.naam)}${x.fq?`<small>${esc(x.fq)}</small>`:""}</td><td class="c">${esc(x.qty||"")}</td><td></td><td></td><td></td></tr>`).join("")}`).join("")}</tbody></table>`
  :`<table class="i5-t"><thead><tr><th>Omschrijving</th><th class="c">Aantal</th><th class="r">Prijs</th><th class="r">Bedrag</th></tr></thead><tbody>
    ${m.regels.map(r=>`<tr><td>${esc(r.oms)}</td><td class="c">${r.aantal}</td><td class="r">€ ${num(r.prijs)}</td><td class="r"><b>€ ${num(r.ex)}</b></td></tr>`).join("")}</tbody></table>`}
  <div class="i5-sum"><div class="i5-pay">${m.pay?`<span class="i5-l">Betaalgegevens</span><table>${m.pay.filter(x=>x[0]!=="Uiterlijk").map(([a,b])=>`<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join("")}</table>`:`<span class="i5-l">${m.off?"Geldigheid":"Betaling"}</span>`}${m.off?`<b class="i5-pnr">Offerte ${esc(f.nummer)}</b>`:""}<p>${esc(m.zin)}</p></div>
    ${m.off&&f.totaalTonen===false?"<div></div>":`<div class="i5-tot"><div><span>Subtotaal</span><span>€ ${num(m.t.ex)}</span></div><div><span>BTW ${m.btw}%</span><span>€ ${num(m.t.btw)}</span></div><div class="g"><span><b>${m.off?"Totaal per beurt":m.voldaan||m.st[1]==="g"?"Betaald":"Te betalen"}</b><small>${m.off?"incl. "+m.btw+"% btw":m.voldaan||m.st[1]==="g"?"Hartelijk dank":"Vóór "+esc(fmtL(f.verval))}</small></span><span class="i5-amt">€ ${num(m.t.inc)}</span></div></div>`}</div>
  ${f.notitie?`<div class="i5-note"><span class="i5-l">Opmerking</span>${esc(f.notitie)}</div>`:""}
  ${f.soort!=="offerte"&&typeof factFotos==="function"&&factFotos(f).length?`<div class="i5-fotos"><span class="i5-l">Bijlage · foto's</span><b class="i5-ft">Opgemerkt tijdens ons werk</b><span class="i5-fs">Tijdens de beurt${f.datum?" van "+esc(fmtL(f.datum)):""} viel ons het volgende op.</span><div class="${factFotos(f).length===1?"een":""}">${factFotos(f).map((b,i)=>`<figure><img src="${BLOB}${esc(b.id)}" alt=""><figcaption><i>${i+1}</i><span><b>${esc(b.notitie||"Bijzonderheid")}</b><small>${esc(fmtL(b.datum||f.datum))}</small></span></figcaption></figure>`).join("")}</div></div>`:""}
  ${f.soort==="offerte"&&offTxt(f.voettekst,f)?`<div class="i5-txt">${esc(offTxt(f.voettekst,f)).replace(/\n/g,"<br>")}</div>`:""}
    ${m.vwTxt?`<p class="i5-vw">${esc(m.vwTxt)}</p>`:""}
  <div class="i5-foot">${m.foot.map(x=>`<span>${esc(x)}</span>`).join("")}</div></div>`;
}
async function pdfDoc(f,klant){
  const doc=newPdf();if(!doc)return null;const m=invModel(f,klant),s=m.s,L=20,R=190,W=R-L,logo=await loadLogo(),A=hexRgb(m.A);
  const C={ink:[17,24,28],mut:[112,122,127],soft:[250,251,251],line:[228,231,233]};
  const col=c=>doc.setTextColor(...c),B=()=>doc.setFont("helvetica","bold"),N=()=>doc.setFont("helvetica","normal");
  const lab=(t,x,y,al,c)=>{B();doc.setFontSize(6.4);col(c||C.mut);const u=t.toUpperCase(),w=doc.getTextWidth(u)+.5*(u.length-1),x0=al==="right"?x-w:al==="center"?x-w/2:x;doc.text(u,x0,y,{charSpace:.5});col(C.ink)};
  const num=v=>(Number(v)||0).toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2}),E=v=>"€ "+num(v);
  // kop: logo links, onze gegevens rechts, klant links eronder
  let y=18;
  if(logo){const h=22,w=Math.min(50,h*logo.ratio);try{doc.addImage(logo.url,logo.fmt,L,y-4,w,w/logo.ratio)}catch(e){}}else{B();doc.setFontSize(15);col(C.ink);doc.text(doc.splitTextToSize(s.naam||"Je bedrijfsnaam",80)[0],L,y+6)}
  B();doc.setFontSize(8.8);col(C.ink);{const nm=s.naam||"Je bedrijfsnaam",nw=doc.getTextWidth(nm);doc.text(nm,R,y,{align:"right"})}
  doc.setFontSize(7.6);N();const vw=Math.min(52,Math.max(24,...m.coInfo.flatMap(([l,v])=>v.map(x=>doc.getTextWidth(String(x))))));const VX=R-vw,LX=VX-3;
  let cy=y+6.5;m.coInfo.forEach(([l,v])=>{if(!l){cy+=2.4;return}N();doc.setFontSize(7.6);col(C.mut);doc.text(l,LX,cy,{align:"right"});col(C.ink);v.forEach((x,k)=>doc.text(doc.splitTextToSize(String(x),vw+2)[0],VX,cy+k*3.7));cy+=Math.max(1,v.length)*3.7+.5});
  let ky=y+(logo?Math.min(50,22*logo.ratio)/logo.ratio+9:16);N();doc.setFontSize(10);col(C.ink);B();doc.text(doc.splitTextToSize(m.naamKlant,LX-L-30)[0],L,ky);N();doc.setFontSize(8.6);col([60,68,72]);
  m.naar.forEach((x,i)=>doc.text(doc.splitTextToSize(String(x),LX-L-30)[0],L,ky+5.2+i*4.4));const kEnd=ky+5.2+m.naar.length*4.4;col(C.ink);
  y=Math.max(cy,kEnd)+9;
  doc.setDrawColor(...C.line);doc.setLineWidth(.25);doc.line(L,y-3,R,y-3);y+=6;
  if(f.soort==="offerte"&&offTxt(f.tekst,f)){N();doc.setFontSize(8.8);col(C.ink);const tl=doc.splitTextToSize(offTxt(f.tekst,f),W);doc.text(tl,L,y,{lineHeightFactor:1.45});y+=tl.length*4.6+8}
  if(f.soort==="offerte"&&f.letop&&offTxt(f.letopTekst,f)){B();doc.setFontSize(8.8);col(C.ink);doc.text("Let op:",L,y);N();const ll=doc.splitTextToSize(offTxt(f.letopTekst,f),W);doc.text(ll,L,y+4.8,{lineHeightFactor:1.45});y+=4.8+ll.length*4.6+6}
  // tabel
  const X={o:L+4,a:134,p:160,t:R-4};
  const head=()=>{doc.setFillColor(...C.soft);doc.roundedRect(L,y-5,W,9,1.5,1.5,"F");[["Omschrijving",X.o,"left"],["Aantal",X.a,"center"],["Prijs",X.p,"right"],["Bedrag",X.t,"right"]].forEach(([t,x,al])=>lab(t,x,y+.6,al));y+=11};
  if(m.off){/* offerte: per dienst een kopregel met prijzen, de onderdelen eronder */
    const Y={o:L+4,a:110,p:141,b:157,t:R-4};
    const oh=()=>{doc.setFillColor(...C.soft);doc.roundedRect(L,y-5,W,9,1.5,1.5,"F");[["Omschrijving",Y.o,"left"],["Aantal",Y.a,"center"],["Prijs excl.",Y.p,"right"],["Btw",Y.b,"right"],["Prijs incl.",Y.t,"right"]].forEach(([t,x,al])=>lab(t,x,y+.6,al));y+=11};
    oh();
    m.regels.forEach((r,i)=>{const subs=r.subs||[];const ls=doc.splitTextToSize(r.oms,Y.a-Y.o-16),rh=ls.length*4+1.5;
      const sh=subs.reduce((a,x)=>a+(x.fq?8.2:5.2),0);if(y+rh+Math.min(sh,40)>236){doc.addPage();y=20;oh()}
      B();doc.setFontSize(9);col(C.ink);doc.text(ls,Y.o,y);if(!subs.length){N();doc.text(String(r.aantal),Y.a,y,{align:"center"})}
      B();doc.text(E(r.ex),Y.p,y,{align:"right"});N();doc.text(r.btw+"%",Y.b,y,{align:"right"});B();doc.text(E(r.ex*(1+r.btw/100)),Y.t,y,{align:"right"});N();
      y+=rh+1;
      if(subs.length){const top=y-2.6;let hh=subs.reduce((a,x)=>a+(x.fq?8.2:5.2),0)+1.6;
        if(top+hh<=262){doc.setFillColor(252,252,253);doc.rect(L+3,top,R-L-6,hh,"F")}
        let yy=y+1.2;subs.forEach(x=>{if(yy>262){doc.addPage();yy=24}N();doc.setFontSize(8.2);col(C.ink);doc.text(doc.splitTextToSize(String(x.naam),Y.a-Y.o-20)[0],Y.o+5,yy);doc.text(String(x.qty||""),Y.a,yy,{align:"center"});
          if(x.fq){doc.setFontSize(7);col(C.mut);doc.text(String(x.fq),Y.o+5,yy+3.4);col(C.ink)}yy+=x.fq?8.2:5.2});y=yy+1.2}
      y+=1.5;doc.setDrawColor(...C.line);doc.setLineWidth(.2);if(i<m.regels.length-1)doc.line(L,y-3,R,y-3);y+=2.4});
  }else{
  head();
  m.regels.forEach((r,i)=>{const ls=doc.splitTextToSize(r.oms,X.a-X.o-14),rh=ls.length*4+1.5;if(y+rh>236){doc.addPage();y=20;head()}
    N();doc.setFontSize(8.8);col(C.ink);doc.text(ls,X.o,y);
    doc.text(String(r.aantal),X.a,y,{align:"center"});doc.text(E(r.prijs),X.p,y,{align:"right"});B();doc.text(E(r.ex),X.t,y,{align:"right"});N();
    y+=rh+1.5;doc.setDrawColor(...C.line);doc.setLineWidth(.2);if(i<m.regels.length-1)doc.line(L,y-3,R,y-3);y+=2.4});}
  doc.setDrawColor(185,192,196);doc.setLineWidth(.25);doc.line(L,y-3,R,y-3);
  y+=5;if(y>205){doc.addPage();y=20}
  // totalen
  const TX=126,ty0=y;let tyEnd=y;
  if(!(m.off&&f.totaalTonen===false)){doc.setFontSize(8.2);
  [["Subtotaal",m.t.ex],["BTW "+m.btw+"%",m.t.btw]].forEach(([a,b])=>{N();col(C.mut);doc.text(a,TX,y+4);col(C.ink);doc.text(E(b),R,y+4,{align:"right"});y+=6});
  y+=1;const paid=m.voldaan||m.st[1]==="g",tint=A.map(v=>Math.round(v*.08+255*.92)),edge=A.map(v=>Math.round(v*.3+255*.7));
  doc.setFillColor(...C.soft);doc.roundedRect(TX-4,y,R-TX+4,13.5,2,2,"F");
  B();doc.setFontSize(8.8);col(C.ink);doc.text(m.off?"Totaal per beurt":paid?"Betaald":"Te betalen",TX,y+6);
  N();doc.setFontSize(6.8);col(C.mut);doc.text(m.off?"incl. "+m.btw+"% btw":paid?"Hartelijk dank":"Vóór "+fmtL(f.verval),TX,y+9.8);
  B();doc.setFontSize(11);col(A);doc.text(E(m.t.inc),R-4,y+8.3,{align:"right"});col(C.ink);tyEnd=y+13.5;}
  // betaalgegevens
  y=ty0;const PW=TX-L-12,pr=m.pay?m.pay.filter(x=>x[0]!=="Uiterlijk"):[],zl=(N(),doc.setFontSize(7.6),doc.splitTextToSize(m.zin,PW-10)),bh=10+pr.length*4.6+zl.length*3.8+3+(m.off?5.4:0);
  doc.setFillColor(...C.soft);doc.roundedRect(L,y,PW,bh,2,2,"F");
  lab(m.pay?"Betaalgegevens":m.off?"Geldigheid":"Betaling",L+5,y+6);let by=y+11.5;if(m.off){B();doc.setFontSize(8.6);col([58,68,74]);doc.text("Offerte "+f.nummer,L+5,by);col(C.ink);by+=5}
  pr.forEach(([a,b])=>{N();doc.setFontSize(8);col(C.mut);doc.text(a,L+5,by);B();col(C.ink);doc.text(String(b),L+22,by);by+=4.6});
  N();doc.setFontSize(7.6);col(C.mut);doc.text(zl,L+5,by+1,{lineHeightFactor:1.45});col(C.ink);
  y=Math.max(y+bh,tyEnd)+9;
  if(f.notitie){const nl=doc.splitTextToSize(f.notitie,W-10),nh=9+nl.length*4.2;if(y+nh>258){doc.addPage();y=20}doc.setDrawColor(...C.line);doc.setLineWidth(.3);doc.roundedRect(L,y,W,nh,2,2,"S");lab("Opmerking",L+5,y+5.5);N();doc.setFontSize(8);doc.text(nl,L+5,y+10.2);y+=nh+7}
  if(f.soort==="offerte"&&offTxt(f.voettekst,f)){N();doc.setFontSize(8.8);col(C.ink);const vl2=doc.splitTextToSize(offTxt(f.voettekst,f),W);if(y+vl2.length*4.6>262){doc.addPage();y=20}doc.text(vl2,L,y+2,{lineHeightFactor:1.45});y+=vl2.length*4.6+6}
  if(y>255){doc.addPage();y=20}
  
  if(m.vwTxt){const v=doc.splitTextToSize(m.vwTxt,W);N();doc.setFontSize(6.8);col(C.mut);doc.text(v,L,y,{lineHeightFactor:1.5});col(C.ink)}
  /* foto's van bijzonderheden: eigen pagina, twee per rij */
  const ff=f.soort!=="offerte"&&typeof factFotos==="function"?factFotos(f):[];
  if(ff.length){const ims=[];for(const p of ff){const im=await fotoData(p.id);if(im)ims.push({...im,p})}
    if(ims.length){doc.addPage();let yy=24;
      /* kop in dezelfde stijl als de factuur */
      B();doc.setFontSize(6.6);col(C.mut);doc.setCharSpace(.9);doc.text("BIJLAGE · FOTO'S",L,yy);doc.setCharSpace(0);
      B();doc.setFontSize(15);col(C.ink);doc.text("Opgemerkt tijdens ons werk",L,yy+8);
      N();doc.setFontSize(8.6);col(C.mut);const sub=`Tijdens de beurt${f.datum?" van "+fmtL(f.datum):""} viel ons het volgende op.`;doc.text(sub,L,yy+14);
      doc.setDrawColor(...C.line);doc.setLineWidth(.25);doc.line(L,yy+19,R,yy+19);yy+=27;
      /* foto bijsnijden tot een vaste verhouding, zodat alle kaarten even hoog zijn */
      const crop=(im,ar)=>new Promise(res=>{const i=new Image();i.onload=()=>{let sw=i.width,sh=i.height;if(sw/sh>ar)sw=sh*ar;else sh=sw/ar;const c=document.createElement("canvas");c.width=Math.min(1200,Math.round(sw));c.height=Math.round(c.width/ar);
        c.getContext("2d").drawImage(i,(i.width-sw)/2,(i.height-sh)/2,sw,sh,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.85))};i.onerror=()=>res(im.data);i.src=im.data});
      const een=ims.length===1,gap=7,cols=een?1:2,cw=(W-gap*(cols-1))/cols,pad=3.2,ar=4/3,iw=cw-2*pad,ih=iw/ar;
      for(let i=0;i<ims.length;i+=cols){const row=ims.slice(i,i+cols);
        const notes=row.map(im=>{B();doc.setFontSize(9);return doc.splitTextToSize(im.p.notitie||"Bijzonderheid",iw-9)}),nl=Math.max(...notes.map(n=>n.length));
        const ch=pad+ih+5+nl*4.3+5.5+pad;if(yy+ch>270){doc.addPage();yy=22}
        for(let j=0;j<row.length;j++){const im=row[j],x=L+j*(cw+gap),data=await crop(im,ar);
          doc.setFillColor(...C.soft);doc.setDrawColor(...C.line);doc.setLineWidth(.3);doc.roundedRect(x,yy,cw,ch,3,3,"FD");
          try{doc.addImage(data,"JPEG",x+pad,yy+pad,iw,ih)}catch(e){}
          doc.setDrawColor(255,255,255);doc.setLineWidth(1.2);doc.roundedRect(x+pad-.4,yy+pad-.4,iw+.8,ih+.8,2.2,2.2,"S");
          const ty=yy+pad+ih+5.6;doc.setFillColor(...C.ink);doc.circle(x+pad+2.6,ty-1.3,2.6,"F");B();doc.setFontSize(7);doc.setTextColor(255,255,255);doc.text(String(i+j+1),x+pad+2.6,ty-.1,{align:"center"});
          B();doc.setFontSize(9);col(C.ink);doc.text(notes[j],x+pad+7.5,ty,{lineHeightFactor:1.35});
          N();doc.setFontSize(7.2);col(C.mut);doc.text(fmtL(im.p.datum||f.datum),x+pad+7.5,ty+notes[j].length*4.3+.6);col(C.ink)}
        yy+=ch+gap}}}
  const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setDrawColor(...C.line);doc.setLineWidth(.25);doc.line(L,277,R,277);N();doc.setFontSize(6.8);col(C.mut);
    doc.text(m.foot.join("   ·   "),L,282);if(pages>1)doc.text("Pagina "+p+" / "+pages,R,282,{align:"right"});col(C.ink)}
  return doc;
}
async function pdf(id){
  const f=state.facturen.find(x=>x.id===id);if(!f)return;const doc=await pdfDoc(f);if(!doc)return;
  saveFile((f.soort==="offerte"?"Offerte ":"Factuur ")+f.nummer+".pdf",doc.output("arraybuffer"),"PDF opgeslagen");
}
const demoKlant={naam:"Familie de Vries",adres:"Voorbeeldstraat 12",postcode:"1234 AB",plaats:"Amsterdam",email:"klant@voorbeeld.nl",telefoon:"06 12 34 56 78"};
const demoFactuur=()=>({soort:"factuur",nummer:today().getFullYear()+"-VOORBEELD",klantNaam:demoKlant.naam,klantAdres:fullAddr(demoKlant),datum:iso(today()),verval:iso(addDays(today(),Number(S().termijn)||14)),status:"open",btw:21,incl:false,
  regels:[{omschrijving:"Glasbewassing buitenzijde (8-wekelijks)",aantal:1,prijs:45},{omschrijving:"Dakgoten uitzuigen",aantal:2,prijs:32.5},{omschrijving:"Zonnepanelen reinigen",aantal:1,prijs:60}],notitie:"Dit is een voorbeeldfactuur om je opmaak te bekijken. Er is niets verstuurd."});
function openVoorbeeld(){
  const f=demoFactuur();
  openDlg(`<div class="dlg-head"><span class="objic" style="background:var(--brand-soft);color:var(--brand)">${I.facturen}</span><div style="flex:1;min-width:0"><h3 style="font-size:19px">Voorbeeldfactuur</h3><div class="subt">Zo ziet je factuur-PDF eruit, met je logo en bedrijfsgegevens</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="paperwrap">${paperHtml(f,demoKlant)}</div>
  <div class="row"><span class="subt" style="flex:1;font-size:13px">Demo-data. Echte facturen gebruiken klant- en factuurgegevens.</span>${state.dl?`<button type="button" id="vbPdf">${I.dl}Download als PDF</button>`:""}<button type="button" class="primary" data-act="close">Sluiten</button></div>`,{wide:true});
  const b=$("#vbPdf");if(b)b.onclick=async()=>{const doc=await pdfDoc(f,demoKlant);if(doc)saveFile("Voorbeeldfactuur.pdf",doc.output("arraybuffer"),"Voorbeeld-PDF opgeslagen")};
}

/* ---------- klantnummer (relatiecode) ---------- */
function klantNr(k){
  if(!k)return "";if(k.klantnr)return String(k.klantnr);
  const i=[...state.klanten].sort((a,b)=>String(a.aangemaakt||"").localeCompare(String(b.aangemaakt||""))||String(a.id).localeCompare(String(b.id))).findIndex(x=>x.id===k.id);
  return String(1000+Math.max(1,i+1));
}
/* ---------- SnelStart-export: relaties + verkoopboekingen ---------- */
const SS_DEF={dagboek:"1300",deb:"1300",omzet:"8000",btwH:"3101",btwL:"3102",omzet0:"8000"};
const ssNum=v=>(Number(v)||0).toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true});
const ssDate=d=>{const x=parse(d);return x?String(x.getDate()).padStart(2,"0")+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+x.getFullYear():""};
function ssData(van,tot,cfg){
  const fs=facturen().filter(f=>f.status!=="concept"&&f.datum>=van&&f.datum<=tot).sort((a,b)=>String(a.datum).localeCompare(String(b.datum))||String(a.nummer).localeCompare(String(b.nummer)));
  const rows=[],rel=new Map();
  fs.forEach(f=>{
    const k=state.klanten.find(x=>x.id===f.klantId)||null,code=k?klantNr(k):(f.relatiecode||""),t=totals(f);
    const inc=r2(t.inc),ex=r2(t.ex),btw=r2(inc-ex),rate=Number(f.btw??S().btw)||0,neg=inc<0,A=Math.abs;
    const bc=(String(f.nummer).match(/(\d+)\D*$/)||[,""])[1].replace(/^0+(?=\d)/,"");
    const L=(gb,amt,debet)=>rows.push([cfg.dagboek,bc,ssDate(f.datum),gb,ssNum(debet!==neg?A(amt):0),ssNum(debet!==neg?0:A(amt)),f.nummer,code,f.nummer].join(";"));
    L(cfg.deb,inc,true);L(rate?cfg.omzet:(cfg.omzet0||cfg.omzet),ex,false);if(btw)L(rate>=15?cfg.btwH:cfg.btwL,btw,false);
    if(code&&!rel.has(code)){const src=k||{naam:f.klantNaam};rel.set(code,src)}
  });
  const qq=v=>v?'"'+String(v).replace(/"/g,'""')+'"':"",pl=v=>String(v||"").replace(/[;\r\n]/g," ");
  const relRows=[...rel].map(([code,k])=>[code,qq(cleanName(k.naam||"")),qq(cleanName(k.contact||k.naam||"")),qq(k.adres||""),pl(String(k.postcode||"").replace(/\s+/g,"").toUpperCase()),pl(k.plaats),qq(k.telefoon||""),"",pl(k.email)].join(";"));
  return{fs,rev:"Dagboek;Boekingcode;Datum;Grootboeknummer;Debet;Credit;Omschrijving;Relatiecode;Factuurnummer\r\n"+rows.map(r=>r+"\r\n").join(""),
    cus:"Relatiecode;Naam;Contactpersoon;Adres;Postcode;Plaats;Telefoon;Fax;Email\r\n"+relRows.map(r=>r+"\r\n").join(""),nRel:rel.size};
}
function openSnelstart(){
  const s=S(),cfg={...SS_DEF,...(s.snelstart||{})},t=today();
  const van0=cfg.laatst?iso(addDays(parse(cfg.laatst),1)):iso(new Date(t.getFullYear(),t.getMonth(),1));
  openDlg(`<div class="dlg-head"><span class="objic big" style="background:var(--brand-soft);color:var(--brand)">${I.dl}</span><div style="flex:1;min-width:0"><h3>Exporteren naar SnelStart</h3><div class="subt">Twee bestanden: relaties (klanten) en verkoopboekingen</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Sluiten">${I.x}</button></div>
  <div class="grid2"><label>Van<input type="date" id="ss-van" value="${van0}"></label><label>Tot en met<input type="date" id="ss-tot" value="${iso(t)}"></label></div>
  <div id="ss-sum" class="te-cnt"></div>
  <details><summary style="cursor:pointer;font-weight:700">Grootboekrekeningen</summary>
  <div class="grid2" style="margin-top:12px">${[["dagboek","Dagboek (verkoop)"],["deb","Debiteuren"],["omzet","Omzet"],["omzet0","Omzet 0% / verlegd"],["btwH","BTW hoog (21%)"],["btwL","BTW laag (9%)"]].map(([k,l])=>`<label>${l}<input id="ss-${k}" value="${esc(cfg[k])}" inputmode="numeric"></label>`).join("")}</div>
  <small class="help">Standaard zoals in je voorbeeld: dagboek 1300, debiteuren 1300, omzet 8000, BTW hoog 3101. Controleer BTW laag in je SnelStart-administratie.</small></details>
  <div class="ss-two">
    <div class="ss-card"><span class="objic" style="background:var(--plan-bg);color:var(--plan)">${I.klanten}</span><div><b>1. Klanten (relaties)</b><small id="ss-nk"></small></div><button type="button" id="ss-k">${I.dl}Download klanten</button></div>
    <div class="ss-card"><span class="objic" style="background:var(--brand-soft);color:var(--brand)">${I.facturen}</span><div><b>2. Facturen (boekingen)</b><small id="ss-nf"></small></div><button type="button" class="primary" id="ss-f">${I.dl}Download facturen</button></div></div>
  <small class="help">Importeer in SnelStart eerst de klanten, daarna de facturen.</small>
  <div class="row stickyfoot"><span class="sp"></span><button type="button" data-act="close">Sluiten</button></div>`,{wide:true});
  const get=()=>{const c={...cfg};Object.keys(SS_DEF).forEach(k=>c[k]=$("#ss-"+k).value.trim()||SS_DEF[k]);return c};
  const upd=()=>{const d=ssData($("#ss-van").value,$("#ss-tot").value,get());$("#ss-sum").innerHTML=`${I.facturen}<span><b>${plural(d.fs.length,"factuur","facturen")}</b> · ${plural(d.nRel,"klant","klanten")} · ${eur(d.fs.reduce((a,f)=>a+totals(f).inc,0))} incl. btw</span>`;
    $("#ss-nk").textContent=plural(d.nRel,"klant","klanten")+" met een factuur in deze periode";$("#ss-nf").textContent=plural(d.fs.length,"factuur","facturen")+" · "+d.fs.length*3+" boekingsregels";$("#ss-k").disabled=!d.nRel;$("#ss-f").disabled=!d.fs.length};
  form.addEventListener("input",upd);upd();form.onsubmit=e=>e.preventDefault();
  const run=async w=>{const van=$("#ss-van").value,tot=$("#ss-tot").value,c=get(),d=ssData(van,tot,c),tag=ssDate(van)+"_tm_"+ssDate(tot);
    if(w==="k")await saveFile("customers_active_"+tag+".csv",d.cus,"Klantenbestand voor SnelStart opgeslagen");
    else{await saveFile("revenue_"+tag+".csv",d.rev,"Factuurbestand voor SnelStart opgeslagen");const {laatst,...rest}=c;state.settings={...state.settings,snelstart:{...rest,laatst:tot}};try{await save("instellingen","bedrijf",state.settings)}catch(e){}}};
  $("#ss-k").onclick=()=>run("k");$("#ss-f").onclick=()=>run("f");
}
