/* ---------- UIT TE VOEREN: wat er deze beurt precies gedaan moet worden (uit de opdracht) ----------
   Per verdieping en per soort bijzonder raam met aantallen, kozijnreiniging, plus extra opdrachten die deze keer meegaan. */
function uitTeVoeren(k,day){const d=day||iso(today()),L=[],nm=k.dienst||HD();
  try{if(k.ramenRegel&&typeof ramenDue==="function"){const {q,due}=ramenDue(k,d);
      q.f.forEach((n,i)=>{if(n&&due.f[i])L.push(nm+" - "+FLN[i]+" ("+n+" st)")});
      SPK.forEach(s=>{const n=q.sp[s];if(n&&due.sp[s])L.push("Glasbewassing bijzondere ramen - "+SPN[s].replace(" / ","/")+" ("+n+" st)")});
      const kz=q.f.map((n,i)=>n&&due.k[i]?n:0).reduce((a,b)=>a+b,0)+SPK.reduce((a,s)=>a+(q.sp[s]&&due.sk[s]?q.sp[s]:0),0);if(kz)L.push("Kozijnreiniging ("+kz+" ramen)")}
    else if(Array.isArray(k.items)&&k.items.length)k.items.filter(x=>Number(x.aantal)>0).forEach(x=>L.push(nm+" - "+itNm(x,nm)+" ("+x.aantal+" "+(typeof eenhKort==="function"?eenhKort(x.eenheid):"st")+")"));
    (typeof extraDue==="function"?extraDue(k,d):[]).filter(o=>o.actief!==false).forEach(o=>{const its=(o.items||[]).filter(x=>Number(x.aantal)>0);
      if(its.length)its.forEach(x=>L.push((o.dienst||"Dienst")+" - "+itNm(x,o.dienst)+" ("+x.aantal+" "+(typeof eenhKort==="function"?eenhKort(x.eenheid):"st")+")"));else L.push(o.dienst||"Dienst")})}catch(e){console.error("uitTeVoeren",e)}
  return L}
function uitTeVoerenHtml(k,day){if(typeof GLAS==="function"&&!GLAS())return"";const L=uitTeVoeren(k,day);if(!L.length)return"";
  return `<div class="utv"><span class="utv-h">${I.ticket||""}Uit te voeren</span><ul>${L.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`}
