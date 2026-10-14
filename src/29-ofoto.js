/* ---------- ramen tellen met foto's: rondom de woning per zijde één foto, AI telt per verdieping, glazenwasser verbetert met een tik ---------- */
const RF_ZIJDEN=[
  {z:"Voorzijde",tip:"Ga recht voor de woning staan, zo ver terug dat de hele gevel tot en met het dak op de foto past."},
  {z:"Rechterzijde",tip:"Loop rechtsom. Heeft deze kant geen ramen of kun je er niet bij? Tik op Overslaan."},
  {z:"Achterzijde",tip:"Vanuit de tuin of het achterpad. Zet de hele achtergevel en het dak op de foto."},
  {z:"Linkerzijde",tip:"Laatste zijde. Daarna worden de ramen voor je geteld."}];
const RF_T=[["f0","BG","Begane grond"],["f1","1","1e verdieping"],["f2","2","2e verdieping"],["f3","3","3e verdieping"],["s-tuimel","D","Dakraam"],["s-koepel","K","Lichtkoepel"],["s-lood","L","Glas-in-lood"],["s-mini","M","Miniraampje"]];
const rfL=t=>(RF_T.find(x=>x[0]===t)||RF_T[0]);
const rfCol=t=>typeof DOTCOL==="function"?DOTCOL(t):"#e5484d";

/* plattegrond van bovenaf: vier gevels, de huidige knippert, het poppetje loopt rechtsom mee */
function rfHuisSvg(step,done){done=done||[];const P=[[60,104],[114,52],[60,0],[6,52]],W=["M34 90h52","M98 78V26","M86 14H34","M22 26v52"];
  const side=(i,d)=>`<path d="${d}" class="rf-g${done[i]==="ok"?" ok":done[i]==="skip"?" skip":""}${i===step?" nu":""}"/>`;
  const man=step>=0&&step<4?`<g class="rf-man" style="transform:translate(${P[step][0]}px,${P[step][1]}px)"><circle r="8" class="rf-mh"/><rect x="-4" y="-2.2" width="8" height="5.4" rx="1.2" class="rf-mc"/><rect x="-1.6" y="-3.8" width="3.2" height="2" rx=".6" class="rf-mc"/></g>`:"";
  return `<svg class="rf-plan" viewBox="-6 -10 132 124" aria-hidden="true"><rect x="30" y="22" width="60" height="60" rx="2" class="rf-hs"/><rect x="30" y="22" width="60" height="30" class="rf-pan"/><path d="M30 52h60" class="rf-nok"/>
    <rect x="66" y="30" width="9" height="12" rx="1" class="rf-sch"/>${W.map((d,i)=>side(i,d)).join("")}${man}</svg>`}

function openFotoTelling(k,prev,cb,opts){opts=opts||{};const ro=!!opts.alleenLezen;
  const d=document.createElement("dialog");d.className="rf";document.body.appendChild(d);
  let foto=prev&&prev.length?prev.map(p=>({...p,dots:p.dots.map(x=>({...x}))})):[];/* {zijde,blob,url,data,w,h,dots} */
  let stap=0,status=foto.length?"res":"cap",cur=0,tool="f0",fout="",opm="",zeker="",hist=[];
  const zijdes=RF_ZIJDEN.map(x=>x.z),done=()=>zijdes.map(z=>foto.some(p=>p.zijde===z)?"ok":skip.has(z)?"skip":"");const skip=new Set();
  const sluit=()=>{try{d.close()}catch(e){}d.remove()};
  d.addEventListener("cancel",e=>{e.preventDefault();if(status!=="scan")sluit()});
  const tel=()=>{const c={};foto.forEach(p=>p.dots.forEach(x=>c[x.t]=(c[x.t]||0)+1));return c};
  const head=(t,s)=>`<div class="rf-top"><button type="button" class="rf-x" data-rf="x" aria-label="Sluiten">${I.x}</button><div><b>${t}</b><small>${esc(s||"")}</small></div><span class="sp"></span>${status==="res"&&!ro&&hist.length?`<button type="button" class="rf-undo" data-rf="undo">${I.undo||"↶"} Herstel</button>`:""}</div>`;
  const thumbs=()=>`<div class="rf-th">${zijdes.map((z,i)=>{const p=foto.find(x=>x.zijde===z);return `<button type="button" class="${i===stap&&status==="cap"?"nu ":""}${p?"vol":skip.has(z)?"skip":""}" data-rfs="${i}">${p?`<img src="${p.url}" alt="">`:`<span>${skip.has(z)?"—":i+1}</span>`}<em>${esc(z.replace("zijde",""))}</em></button>`}).join("")}
    ${foto.filter(p=>!zijdes.includes(p.zijde)).map(p=>`<button type="button" class="vol" data-rfe="${foto.indexOf(p)}"><img src="${p.url}" alt=""><em>Extra</em></button>`).join("")}
    <label class="rf-plus" title="Extra foto (dakkapel, aanbouw, plat dak)">＋<em>Extra</em><input type="file" accept="image/*" capture="environment" hidden data-rfin="extra"></label></div>`;

  function capHtml(){const klaar=stap>=4,z=RF_ZIJDEN[Math.min(stap,3)];
    return head("Tel met foto's",fullAddr(k))+`<div class="rf-cap">
      <div class="rf-map">${rfHuisSvg(klaar?-1:stap,done())}<div class="rf-stp">${klaar?`<b>Rondje klaar</b><span>${foto.length} foto${foto.length===1?"":"'s"} · klaar om te tellen</span>`:`<small>Stap ${stap+1} van 4</small><b>${z.z}</b><span>${z.tip}</span>`}</div></div>
      ${klaar?`<button type="button" class="rf-go" data-rf="tel" ${foto.length?"":"disabled"}><span class="rf-spark">${I.camera}</span>Ramen tellen</button>`
        :`<label class="rf-shot" aria-label="Foto maken van de ${z.z.toLowerCase()}"><input type="file" accept="image/*" capture="environment" hidden data-rfin="${stap}"><span class="rf-lens"></span></label>
        <div class="rf-row"><button type="button" data-rf="skip">Overslaan</button><label>${I.upload}Uit galerij<input type="file" accept="image/*" hidden data-rfin="${stap}"></label></div>`}
      ${thumbs()}
      ${!klaar&&foto.length?`<button type="button" class="rf-link" data-rf="tel">Nu al tellen met ${foto.length} foto${foto.length===1?"":"'s"} ›</button>`:""}</div>`}

  function scanHtml(){return head("Ramen tellen",fullAddr(k))+`<div class="rf-scan"><div class="rf-sg n${Math.min(foto.length,4)}">${foto.map(p=>`<div><img src="${p.url}" alt=""><i></i></div>`).join("")}</div>
    <div class="rf-sst"><span class="rf-dots"><i></i><i></i><i></i></span><b id="rfSt">Gevels herkennen…</b><small>Dit duurt meestal 10 tot 30 seconden.</small></div></div>`}

  function resHtml(){const c=tel(),tot=Object.values(c).reduce((a,b)=>a+b,0),p=foto[cur]||foto[0];
    return head(ro?"Foto's van de telling":"Controleer de telling",ro?fullAddr(k):"Tik op een raam om toe te voegen · tik op een stip om weg te halen")+`<div class="rf-res">
      ${fout?`<div class="rf-err">${I.alert}<span>${esc(fout)} <b>Tik de ramen zelf aan op de foto's.</b></span>${status==="res"&&!ro&&foto.some(x=>x.data)?`<button type="button" class="small" data-rf="tel">Opnieuw</button>`:""}</div>`:""}
      <div class="rf-tot"><div class="rf-big"><b>${tot}</b><span>${tot===1?"raam":"ramen"}</span></div><div class="rf-cnt">${RF_T.filter(t=>c[t[0]]).map(t=>`<span style="--c:${rfCol(t[0])}"><i>${t[1]}</i>${t[2]}<b>${c[t[0]]}</b></span>`).join("")||`<span class="leeg">Nog geen ramen</span>`}</div></div>
      ${opm||zeker==="laag"?`<div class="rf-opm">${I.info||I.alert}<span>${zeker==="laag"?"<b>Twijfelgeval.</b> ":""}${esc(opm)}</span></div>`:""}
      ${p?`<div class="rf-view"><div class="rf-ph" id="rfPh" style="aspect-ratio:${p.w}/${p.h}"><img src="${p.url}" alt="${esc(p.zijde)}" draggable="false">${p.dots.map((x,j)=>`<span class="rf-d" data-rfd="${j}" style="left:${x.x*100}%;top:${x.y*100}%;--c:${rfCol(x.t)}">${rfL(x.t)[1]}</span>`).join("")}
          <div class="rf-lab">${esc(p.zijde)} · ${p.dots.length}</div></div>
        ${foto.length>1?`<button type="button" class="rf-nav l" data-rf="prev" aria-label="Vorige foto">‹</button><button type="button" class="rf-nav r" data-rf="next" aria-label="Volgende foto">›</button>`:""}</div>
        <div class="rf-pth">${foto.map((q,i)=>`<button type="button" class="${i===cur?"nu":""}" data-rfp="${i}"><img src="${q.url}" alt=""><em>${q.dots.length}</em></button>`).join("")}</div>`:""}
      ${ro?"":`<div class="rf-tools"><small>Tik toe als</small><div>${RF_T.map(t=>`<button type="button" class="${tool===t[0]?"on":""}" data-rft="${t[0]}" style="--c:${rfCol(t[0])}"><i>${t[1]}</i>${t[2]}</button>`).join("")}</div></div>`}
      <div class="rf-foot">${ro?`<span class="sp"></span><button type="button" class="primary" data-rf="x">Sluiten</button>`:`<button type="button" class="ghost" data-rf="opnieuw">${I.camera}Opnieuw</button><span class="sp"></span><button type="button" class="primary" data-rf="ok">${I.check}Overnemen · ${tot}</button>`}</div></div>`}

  const draw=()=>{d.innerHTML=status==="cap"?capHtml():status==="scan"?scanHtml():resHtml();d.dataset.st=status};
  async function verwerk(file){/* verkleinen naar max 1400 px: snel versturen, genoeg detail voor de AI */
    const u=URL.createObjectURL(file),im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=u});
    const m=1400,s=Math.min(1,m/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.round(im.naturalWidth*s),h=Math.round(im.naturalHeight*s);
    const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(im,0,0,w,h);URL.revokeObjectURL(u);
    const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.82)),data=cv.toDataURL("image/jpeg",.82);
    return {blob,data,url:URL.createObjectURL(blob),w,h,dots:[]}}
  async function tellen(){if(!foto.length)return;status="scan";fout="";draw();
    const st=["Gevels herkennen…","Verdiepingen bepalen…","Ramen tellen…","Dubbele ramen eruit halen…","Bijna klaar…"];let si=0;const iv=setInterval(()=>{si=Math.min(si+1,st.length-1);const el=d.querySelector("#rfSt");if(el)el.textContent=st[si]},4200);
    try{if(!foto.every(p=>p.data))throw {message:"De originele foto's zijn er niet meer."};
      if(typeof fbFn!=="function"||!window.firebase)throw {message:"AI-tellen werkt alleen in de live omgeving."};
      const r=await fbFn("ramenTellen")({fotos:foto.map(p=>({zijde:p.zijde,data:p.data.split(",")[1]}))}),res=r.data||{};
      foto.forEach((p,i)=>p.dots=(res.fotos&&res.fotos[i]||[]).map(x=>({x:x.x,y:x.y,t:x.t})));opm=res.opmerking||"";zeker=res.zeker||"";
      cur=Math.max(0,foto.findIndex(p=>p.dots.length));try{navigator.vibrate&&navigator.vibrate([18,60,18])}catch(e){}}
    catch(e){fout=(typeof fnFout==="function"?fnFout(e):e.message)||"AI-tellen lukte niet.";}
    clearInterval(iv);hist=[];status="res";draw();
    if(!fout)d.querySelectorAll(".rf-d").forEach((el,i)=>el.animate([{transform:"translate(-50%,-50%) scale(0)",opacity:0},{transform:"translate(-50%,-50%) scale(1.25)",opacity:1,offset:.7},{transform:"translate(-50%,-50%) scale(1)",opacity:1}],{duration:380,delay:i*35,fill:"backwards",easing:"cubic-bezier(.2,.8,.2,1)"}))}

  d.addEventListener("change",async e=>{const inp=e.target.closest("[data-rfin]");if(!inp||!inp.files[0])return;const file=inp.files[0],w=inp.dataset.rfin;inp.value="";
    try{const p=await verwerk(file);try{navigator.vibrate&&navigator.vibrate(12)}catch(er){}
      if(w==="extra"){p.zijde="Extra "+(foto.filter(x=>!zijdes.includes(x.zijde)).length+1);foto.push(p)}
      else{const z=zijdes[+w];p.zijde=z;skip.delete(z);const at=foto.findIndex(x=>x.zijde===z);if(at>=0)foto[at]=p;else foto.push(p);
        foto.sort((a,b)=>{const ia=zijdes.indexOf(a.zijde),ib=zijdes.indexOf(b.zijde);return (ia<0?9:ia)-(ib<0?9:ib)});
        let n=+w+1;while(n<4&&(foto.some(x=>x.zijde===zijdes[n])||skip.has(zijdes[n])))n++;stap=n}
      if(status==="res"){cur=foto.indexOf(p)}draw();
      const t=d.querySelector(".rf-th .vol img[src='"+p.url+"']");if(t)t.parentNode.animate([{transform:"scale(.6)",opacity:.2},{transform:"scale(1.08)"},{transform:"none",opacity:1}],{duration:380,easing:"cubic-bezier(.2,.8,.2,1)"});
      const fl=document.createElement("div");fl.className="rf-flash";d.appendChild(fl);setTimeout(()=>fl.remove(),420)}
    catch(er){toast("Deze foto kon niet worden gelezen")}});

  d.addEventListener("click",e=>{const a=e.target.closest("[data-rf],[data-rfs],[data-rfe],[data-rfp],[data-rft],[data-rfd]");
    if(!a){if(status==="res"&&!ro){const ph=e.target.closest("#rfPh");if(ph){const r=ph.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(x<0||x>1||y<0||y>1)return;
      hist.push(JSON.stringify(foto.map(p=>p.dots)));foto[cur].dots.push({x:Math.round(x*1e4)/1e4,y:Math.round(y*1e4)/1e4,t:tool});draw();const ls=d.querySelectorAll(".rf-d"),n=ls[ls.length-1];if(n)n.animate([{transform:"translate(-50%,-50%) scale(1.6)"},{transform:"translate(-50%,-50%) scale(1)"}],{duration:220})}}return}
    if(a.dataset.rfd!=null){if(ro)return;hist.push(JSON.stringify(foto.map(p=>p.dots)));foto[cur].dots.splice(+a.dataset.rfd,1);draw();return}
    if(a.dataset.rft){tool=a.dataset.rft;d.querySelectorAll("[data-rft]").forEach(b=>b.classList.toggle("on",b===a));return}
    if(a.dataset.rfp!=null){cur=+a.dataset.rfp;draw();return}
    if(a.dataset.rfs!=null){stap=+a.dataset.rfs;status="cap";draw();return}
    if(a.dataset.rfe!=null){cur=+a.dataset.rfe;status="res";draw();return}
    const v=a.dataset.rf;
    if(v==="x")sluit();
    else if(v==="skip"){skip.add(zijdes[stap]);let n=stap+1;while(n<4&&(foto.some(x=>x.zijde===zijdes[n])||skip.has(zijdes[n])))n++;stap=n;draw()}
    else if(v==="tel")tellen();
    else if(v==="prev"){cur=(cur-1+foto.length)%foto.length;draw()}
    else if(v==="next"){cur=(cur+1)%foto.length;draw()}
    else if(v==="undo"&&hist.length){const h=JSON.parse(hist.pop());foto.forEach((p,i)=>p.dots=h[i]||[]);draw()}
    else if(v==="opnieuw"){status="cap";stap=Math.min(4,zijdes.findIndex(z=>!foto.some(x=>x.zijde===z)&&!skip.has(z))<0?4:zijdes.findIndex(z=>!foto.some(x=>x.zijde===z)&&!skip.has(z)));draw()}
    else if(v==="ok"){const c=tel();sluit();cb&&cb({fotos:foto,f:["f0","f1","f2","f3"].map(t=>c[t]||0),sp:{tuimel:c["s-tuimel"]||0,koepel:c["s-koepel"]||0,lood:c["s-lood"]||0,mini:c["s-mini"]||0}})}});
  /* vegen tussen foto's */
  let sx=null;d.addEventListener("touchstart",e=>{if(status==="res"&&e.target.closest(".rf-view"))sx=e.touches[0].clientX},{passive:true});
  d.addEventListener("touchend",e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>70&&foto.length>1){cur=(cur+(dx<0?1:-1)+foto.length)%foto.length;draw()}},{passive:true});
  if(opts.start!=null)cur=opts.start;
  draw();d.showModal();
}
/* bewaarde foto's van een gecontroleerde telling bekijken */
document.addEventListener("click",e=>{const b=e.target.closest("[data-tcfo]");if(!b)return;e.preventDefault();e.stopPropagation();const [kid,i]=b.dataset.tcfo.split(":"),k=state.klanten.find(x=>x.id===kid);if(!k)return;
  const fo=(k.tellingGecontroleerd&&k.tellingGecontroleerd.fotos||[]).filter(x=>x.id).map(x=>({zijde:x.zijde||"Foto",url:BLOB+x.id,w:x.w||4,h:x.h||3,dots:x.dots||[]}));
  if(fo.length)openFotoTelling(k,fo,null,{alleenLezen:true,start:+i||0})},true);
