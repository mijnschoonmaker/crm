/* ---------- Foto aantekenen: met je vinger omcirkelen, pijlen en markeren voordat de foto wordt bewaard ---------- */
function fotoAnnoteren(file){return new Promise(async klaar=>{
  let url="";try{url=URL.createObjectURL(file)}catch(e){return klaar(file)}
  const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=url});if(!img){URL.revokeObjectURL(url);return klaar(file)}
  const KL=[["#ff3b30","Rood"],["#ffffff","Wit"],["#0a84ff","Blauw"],["#30d158","Groen"]];
  const st={tool:"pen",kleur:KL[0][0],lijnen:[],bezig:null};
  const ov=document.createElement("div");ov.className="an";ov.innerHTML=`
    <div class="an-top"><button type="button" class="an-tb" data-an="stop">Annuleren</button><b>Aangeven op de foto</b><button type="button" class="an-tb an-ok" data-an="ok">Klaar</button></div>
    <div class="an-st"><canvas></canvas><p class="an-hint">Teken met je vinger wat de klant moet zien</p></div>
    <div class="an-bar">
      <div class="an-tools">${[["pen","Pen",'<path d="M4 20c4-1 6-3 9-8l3-5a2 2 0 0 1 3 2l-3 5c-3 5-5 7-9 8"/>'],["cirkel","Cirkel",'<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>'],["pijl","Pijl",'<path d="M5 19 19 5M10 5h9v9"/>']].map(([t,l,p])=>`<button type="button" data-tool="${t}" aria-pressed="${t==="pen"}"><svg viewBox="0 0 24 24">${p}</svg><span>${l}</span></button>`).join("")}</div>
      <div class="an-kl">${KL.map(([c,l],i)=>`<button type="button" data-kl="${c}" aria-label="${l}" aria-pressed="${!i}" style="--c:${c}"></button>`).join("")}</div>
      <div class="an-acts"><button type="button" data-an="undo" aria-label="Ongedaan maken"><svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg></button><button type="button" data-an="skip">Zonder tekening</button></div>
    </div>`;
  document.body.appendChild(ov);document.body.classList.add("an-open");
  const cv=ov.querySelector("canvas"),ctx=cv.getContext("2d"),box=ov.querySelector(".an-st");let sc=1,dpr=Math.min(2,devicePixelRatio||1);
  const maat=()=>{const bw=box.clientWidth-24,bh=box.clientHeight-24;sc=Math.min(bw/img.naturalWidth,bh/img.naturalHeight);const w=Math.round(img.naturalWidth*sc),h=Math.round(img.naturalHeight*sc);
    cv.style.width=w+"px";cv.style.height=h+"px";cv.width=w*dpr;cv.height=h*dpr;teken()};
  /* lijnen worden opgeslagen in fotocoördinaten (0..1), zodat ze op elke grootte hetzelfde staan */
  const dik=w=>Math.max(3,w*.009);
  function lijn(c,l,W,H){const lw=dik(W),P=l.p.map(([x,y])=>[x*W,y*H]);if(!P.length)return;
    const pad=()=>{c.beginPath();if(l.t==="pen"){c.moveTo(P[0][0],P[0][1]);for(let i=1;i<P.length-1;i++){const mx=(P[i][0]+P[i+1][0])/2,my=(P[i][1]+P[i+1][1])/2;c.quadraticCurveTo(P[i][0],P[i][1],mx,my)}const e=P[P.length-1];c.lineTo(e[0],e[1])}
      else if(l.t==="cirkel"){const[a,b]=[P[0],P[P.length-1]];c.ellipse((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(b[0]-a[0])/2+1,Math.abs(b[1]-a[1])/2+1,0,0,6.283)}
      else{const[a,b]=[P[0],P[P.length-1]],an=Math.atan2(b[1]-a[1],b[0]-a[0]),k=lw*4.2;c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.moveTo(b[0]-k*Math.cos(an-.45),b[1]-k*Math.sin(an-.45));c.lineTo(b[0],b[1]);c.lineTo(b[0]-k*Math.cos(an+.45),b[1]-k*Math.sin(an+.45))}};
    c.lineCap="round";c.lineJoin="round";
    pad();c.strokeStyle=l.k==="#ffffff"?"rgba(0,0,0,.35)":"rgba(255,255,255,.85)";c.lineWidth=lw*1.9;c.stroke();
    pad();c.strokeStyle=l.k;c.lineWidth=lw;c.stroke()}
  function teken(){const W=cv.width,H=cv.height;ctx.clearRect(0,0,W,H);ctx.drawImage(img,0,0,W,H);[...st.lijnen,...(st.bezig?[st.bezig]:[])].forEach(l=>lijn(ctx,l,W,H))}
  const pos=e=>{const r=cv.getBoundingClientRect();return[Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]};
  cv.addEventListener("pointerdown",e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);st.bezig={t:st.tool,k:st.kleur,p:[pos(e)]};ov.classList.add("getekend");teken()});
  cv.addEventListener("pointermove",e=>{if(!st.bezig)return;const p=pos(e);if(st.bezig.t==="pen")st.bezig.p.push(p);else st.bezig.p[1]=p;teken()});
  const los=()=>{if(!st.bezig)return;const l=st.bezig;st.bezig=null;if(l.p.length>1||l.t==="pen")st.lijnen.push(l.p.length>1?l:{...l,p:[l.p[0],[l.p[0][0]+.002,l.p[0][1]+.002]]});teken()};
  cv.addEventListener("pointerup",los);cv.addEventListener("pointercancel",los);
  ov.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{st.tool=b.dataset.tool;ov.querySelectorAll("[data-tool]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
  ov.querySelectorAll("[data-kl]").forEach(b=>b.onclick=()=>{st.kleur=b.dataset.kl;ov.querySelectorAll("[data-kl]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
  const sluit=v=>{removeEventListener("resize",maat);ov.remove();document.body.classList.remove("an-open");URL.revokeObjectURL(url);klaar(v)};
  ov.addEventListener("click",async e=>{const b=e.target.closest("[data-an]");if(!b)return;const a=b.dataset.an;
    if(a==="undo"){st.lijnen.pop();teken();return}
    if(a==="stop")return sluit(null);
    if(a==="skip"||!st.lijnen.length)return sluit(file);
    /* tekening op volle grootte (max 2000px) in de foto zetten */
    const s=Math.min(1,2000/Math.max(img.naturalWidth,img.naturalHeight)),o=document.createElement("canvas");o.width=Math.round(img.naturalWidth*s);o.height=Math.round(img.naturalHeight*s);
    const oc=o.getContext("2d");oc.drawImage(img,0,0,o.width,o.height);st.lijnen.forEach(l=>lijn(oc,l,o.width,o.height));
    const blob=await new Promise(r=>o.toBlob(r,"image/jpeg",.88));if(!blob)return sluit(file);
    sluit(new File([blob],(String(file.name||"foto").replace(/\.\w+$/,""))+"-aangegeven.jpg",{type:"image/jpeg"}))});
  addEventListener("resize",maat);requestAnimationFrame(maat)})}
