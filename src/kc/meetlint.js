/* ---------- Meetlint: lengtes en vlakken meten op een foto ----------
   Eerst een referentie (bijv. 4 bakstenen = 84 cm), daarna rekent Mansard elke lijn of rechthoek om naar meters.
   Gedeeld door de rekentool, de tellingcontrole (fotoweergave) en de dienstenwebshop. Gegevens per foto:
   foto.meet = {ref:{a:[x,y],b:[x,y],k,cm,n}, g:{pts:[lo,ro,rb,lb],w,hL,hR,r}, maten:[{s,a:[x,y],b:[x,y],r?:1,m?:handmatig}]}  (x,y van 0 tot 1)
   g = gevel rechtgezet: de vier hoeken van de gevelmuur op de foto + de echte maten uit het 3D-model. Dan rekent Mansard met perspectief
   (homografie): elke lijn en rechthoek op die gevel is gemeten, ook op een scheve foto. Gaat voor de referentie. */
(function(){
  if(typeof window==="undefined"||window.Meetlint)return;
  const REFS=[{k:"steen",n:"Baksteen",sub:"lengte",cm:21},{k:"laag",n:"Laag metselwerk",sub:"steen + voeg",cm:6.25},{k:"pan",n:"Dakpan",sub:"zichtbare breedte",cm:30},{k:"deur",n:"Voordeur",sub:"hoogte",cm:210},{k:"eigen",n:"Eigen maat",sub:"in cm",cm:100}];
  const KLEUR=["#0090ff","#f76b15","#8e4ec6","#12a594","#e5484d","#d6409f","#3e63dd","#978365"],REFK="#ffc53d";
  const css=`.ml-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:3}
.ml-lab{position:absolute;z-index:4;transform:translate(-50%,calc(-100% - 9px));transition:opacity .15s;display:inline-flex;align-items:center;gap:6px;padding:4px 9px 4px 6px;border-radius:99px;background:rgba(11,15,18,.82);color:#fff;font:700 11.5px/1.15 Inter,system-ui,sans-serif;white-space:nowrap;border:1px solid rgba(255,255,255,.22);box-shadow:0 4px 14px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);cursor:pointer;font-variant-numeric:tabular-nums}
.ml-lab i{width:9px;height:9px;border-radius:50%;background:var(--c);box-shadow:0 0 0 2px rgba(255,255,255,.85);flex:none}
.ml-lab small{font-weight:600;color:#b9c2c9;font-size:10.5px}
.ml-lab.ref{background:rgba(255,197,61,.95);color:#1d1a10;border-color:#fff}.ml-lab.ref small{color:#5b4d1c}.ml-lab.ref i{background:#1d1a10;box-shadow:none;width:7px;height:7px}
.ml-on{cursor:crosshair!important;touch-action:none}
.ml-gh{position:absolute;z-index:5;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #fff;background:#14b8a6;box-shadow:0 2px 10px rgba(0,0,0,.5);pointer-events:none;display:grid;place-items:center;color:#fff;font:800 10px/1 Inter,system-ui,sans-serif}
.ml-lab.gv{background:rgba(20,184,166,.95);color:#04201c;border-color:#fff}.ml-lab.gv small{color:#0b3d37}.ml-lab.gv i{background:#04201c;box-shadow:none;width:7px;height:7px}
.ml-3d{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:2;transition:opacity .2s}
.ml-zoek{position:absolute;inset:0;z-index:7;display:grid;place-items:center;pointer-events:none}.ml-zoek span{background:rgba(11,15,18,.85);color:#fff;padding:9px 16px;border-radius:99px;font:700 12.5px Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.ml-drag .ml-lab{opacity:0}
.ml-loep{position:absolute;z-index:6;width:132px;height:132px;border-radius:50%;pointer-events:none;border:3px solid #fff;box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.25);background-repeat:no-repeat;background-color:#111;transform:translate(-50%,calc(-100% - 26px))}
.ml-loep::before,.ml-loep::after{content:"";position:absolute;left:50%;top:50%;background:var(--c,#ffc53d);box-shadow:0 0 0 1px rgba(0,0,0,.45)}
.ml-loep::before{width:22px;height:2px;margin:-1px 0 0 -11px}.ml-loep::after{width:2px;height:22px;margin:-11px 0 0 -1px}
.ml-loep b{position:absolute;left:50%;bottom:-30px;transform:translateX(-50%);background:rgba(11,15,18,.88);color:#fff;font:700 12px/1 Inter,system-ui,sans-serif;padding:5px 9px;border-radius:99px;white-space:nowrap;font-variant-numeric:tabular-nums}
.ml-loep.onder{transform:translate(-50%,26px)}.ml-loep.onder b{bottom:auto;top:-30px}
.ml-bar{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:820px}
.ml-bar button{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 12px 0 6px;border-radius:99px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#dfe4e8;font:700 12.5px/1 Inter,system-ui,sans-serif;cursor:pointer}
.ml-bar button i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#fff;font-style:normal;border:2px solid #fff}
.ml-bar button i svg{width:12px;height:12px}
.ml-bar button b{padding:0 7px;height:20px;border-radius:99px;display:inline-grid;place-items:center;background:color-mix(in srgb,var(--c) 32%,transparent);color:#fff;font-size:11px;font-variant-numeric:tabular-nums}
.ml-bar button[aria-checked="true"]{background:#fff;color:#0b0f12;border-color:#fff;box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 45%,transparent)}
.ml-bar button[aria-checked="true"] b{background:var(--c)}
.ml-bar.licht button{border-color:#dfe3e6;background:#fff;color:#14181f}.ml-bar.licht button b{color:#14181f}.ml-bar.licht button[aria-checked="true"]{background:#14181f;color:#fff;border-color:#14181f}.ml-bar.licht button[aria-checked="true"] b{color:#fff}.ml-bar.licht+.ml-tip{color:#6b7280}.ml-bar.licht+.ml-tip b{color:#a67c00}
.ml-tip{width:100%;text-align:center;color:#9aa3ab;font:500 12px/1.45 Inter,system-ui,sans-serif}
.ml-tip b{color:#ffc53d}
.ml-sheet{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:30;width:min(420px,calc(100% - 24px));background:#fff;color:#14181f;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.45);padding:16px 16px 14px;font:500 13.5px/1.4 Inter,system-ui,sans-serif;animation:mlIn .22s cubic-bezier(.2,.8,.2,1)}
@keyframes mlIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
.ml-sheet h4{margin:0 0 2px;font:700 15px/1.3 Inter,system-ui,sans-serif;display:flex;align-items:center;gap:8px}
.ml-sheet h4 i{width:10px;height:10px;border-radius:50%;background:var(--c);flex:none}
.ml-sheet p{margin:0 0 12px;color:#6b7280;font-size:12.5px}
.ml-refs{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:6px;margin-bottom:12px}
.ml-refs button{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:8px 10px;border-radius:12px;border:1.5px solid #e4e7ec;background:#fafbfc;color:#14181f;font:700 12.5px/1.2 Inter,system-ui,sans-serif;cursor:pointer;text-align:left}
.ml-refs button small{font-weight:500;color:#6b7280;font-size:11px}
.ml-refs button[aria-pressed="true"]{border-color:#c9a227;background:#fff8e1;box-shadow:0 0 0 3px rgba(255,197,61,.3)}
.ml-row{display:flex;gap:8px;align-items:flex-end;margin-bottom:12px}
.ml-row label{flex:1;display:flex;flex-direction:column;gap:4px;font:600 11px/1 Inter,system-ui,sans-serif;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0}
.ml-row input{width:100%;height:42px;border-radius:11px;border:1.5px solid #dfe3e6;padding:0 12px;font:700 16px Inter,system-ui,sans-serif;color:#14181f;background:#fff;box-sizing:border-box;font-variant-numeric:tabular-nums}
.ml-row input:focus{outline:none;border-color:#14181f}
.ml-row .x{padding-bottom:12px;color:#9aa1ad;font-weight:700}
.ml-uit{font:700 13px Inter,system-ui,sans-serif;color:#14181f;margin:-4px 0 12px;font-variant-numeric:tabular-nums}
.ml-uit small{font-weight:500;color:#6b7280}
.ml-knop{display:flex;gap:8px}.ml-knop button{flex:1;height:42px;border-radius:11px;border:1px solid #dfe3e6;background:#fff;color:#14181f;font:700 13px Inter,system-ui,sans-serif;cursor:pointer}
.ml-knop button.ok{background:#14181f;color:#fff;border-color:#14181f}.ml-knop button.weg{color:#c4323a;flex:0 0 auto;padding:0 14px}`;
  const zetCss=root=>{root=root||document;const isDoc=root.nodeType===9;if(root.querySelector("#ml-css"))return;const d=isDoc?root:root.ownerDocument||document,st=d.createElement("style");st.id="ml-css";st.textContent=css;(isDoc?(root.head||root.documentElement):root).appendChild(st)};
  const fmt=(v,d)=>(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).toFixed(d).replace(".",",");
  const num=t=>{const v=parseFloat(String(t||"").replace(",","."));return isFinite(v)?v:0};
  const esc=t=>String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
  const ICL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg>';
  /* afstand in "breedte-eenheden": x loopt 0..1 over de breedte, y 0..1 over de hoogte, dus y keer de verhouding h/w */
  const dist=(a,b,asp)=>Math.hypot(b[0]-a[0],(b[1]-a[1])*asp);
  /* homografie: 4 punten op de foto -> 4 punten op de gevel (meters). Gauss-eliminatie op het 8x8-stelsel. */
  function homografie(src,dst){const A=[],B=[];for(let i=0;i<4;i++){const [x,y]=src[i],[u,v]=dst[i];A.push([x,y,1,0,0,0,-u*x,-u*y]);B.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);B.push(v)}
    for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;if(Math.abs(A[p][c])<1e-12)return null;[A[c],A[p]]=[A[p],A[c]];[B[c],B[p]]=[B[p],B[c]];
      for(let r=0;r<8;r++){if(r===c)continue;const f=A[r][c]/A[c][c];if(!f)continue;for(let k=c;k<8;k++)A[r][k]-=f*A[c][k];B[r]-=f*B[c]}}
    const h=B.map((b,i)=>b/A[i][i]);return p=>{const w=h[6]*p[0]+h[7]*p[1]+1;return[(h[0]*p[0]+h[1]*p[1]+h[2])/w,(h[3]*p[0]+h[4]*p[1]+h[5])/w]}}
  const HC={};
  const gevelH=(meet,asp)=>{const g=meet&&meet.g;if(!g||!g.pts||g.pts.length!==4||!(g.w>0))return null;const k=JSON.stringify([g.pts,g.w,g.hL,g.hR,asp]);if(HC[k]!==undefined)return HC[k];
    const H=homografie(g.pts.map(q=>[q[0],q[1]*asp]),[[0,0],[g.w,0],[g.w,g.hR],[0,g.hL]]);const ks=Object.keys(HC);if(ks.length>40)delete HC[ks[0]];return HC[k]=H};
  /* ---- stand van de camera uit de vier gevelhoeken (homografie -> rotatie + positie), om het hele 3D-model over de foto te leggen ----
     beeld: x,y van 0..1; gecentreerd in breedte-eenheden X=x-.5, Y=(y-.5)*asp. Gevelvlak: u langs de muur (links->rechts van buiten gezien),
     v omhoog, w naar buiten. f = brandpuntsafstand in breedte-eenheden. */
  const v3={sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],x:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len:a=>Math.hypot(a[0],a[1],a[2]),sc:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]]};
  const norm=a=>{const l=v3.len(a)||1;return v3.sc(a,1/l)};
  function f35naarF(f35,asp){return f35*Math.hypot(1,asp)/43.27}
  function pose(g,asp,f35){if(!g||!g.pts||g.pts.length!==4||!(g.w>0))return null;
    const img=g.pts.map(q=>[q[0]-.5,(q[1]-.5)*asp]),pl=[[0,0],[g.w,0],[g.w,g.hR],[0,g.hL]];
    const Hm=matH(pl,img);if(!Hm)return null;const h=Hm;
    let f=0;const f1=-(h[0]*h[1]+h[3]*h[4])/(h[6]*h[7]),f2=(h[0]*h[0]+h[3]*h[3]-h[1]*h[1]-h[4]*h[4])/(h[7]*h[7]-h[6]*h[6]);
    const ok=q=>isFinite(q)&&q>0.25&&q<9;if(f35)f=f35naarF(f35,asp);else if(ok(f1))f=Math.sqrt(f1);else if(ok(f2))f=Math.sqrt(f2);if(!(f>0.4&&f<3))f=f35naarF(26,asp);
    const m1=[h[0]/f,h[3]/f,h[6]],m2=[h[1]/f,h[4]/f,h[7]],m3=[h[2]/f,h[5]/f,h[8]];let l=2/(v3.len(m1)+v3.len(m2));if(m3[2]*l<0)l=-l;
    let r1=norm(v3.sc(m1,l)),r2=v3.sc(m2,l);r2=norm(v3.sub(r2,v3.sc(r1,v3.dot(r1,r2))));const r3=v3.x(r1,r2),t=v3.sc(m3,l);
    return{f,R:[r1,r2,r3],t,asp}}
  /* homografie als 3x3 (h33=1) van src->dst */
  function matH(src,dst){const A=[],B=[];for(let i=0;i<4;i++){const [x,y]=src[i],[u,v]=dst[i];A.push([x,y,1,0,0,0,-u*x,-u*y]);B.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);B.push(v)}
    for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;if(Math.abs(A[p][c])<1e-12)return null;[A[c],A[p]]=[A[p],A[c]];[B[c],B[p]]=[B[p],B[c]];
      for(let r=0;r<8;r++){if(r===c)continue;const k=A[r][c]/A[c][c];if(!k)continue;for(let q=c;q<8;q++)A[r][q]-=k*A[c][q];B[r]-=k*B[c]}}
    return[...B.map((b,i)=>b/A[i][i]),1]}
  /* plaats (oost,noord,hoogte) rond het adres -> gevelvlak (u,v,w) */
  const naarVlak=(g,q)=>{const A=g.a,B=g.b,L=Math.hypot(B[0]-A[0],B[1]-A[1])||1,ex=(B[0]-A[0])/L,ey=(B[1]-A[1])/L,dx=q[0]-A[0],dy=q[1]-A[1];return[dx*ex+dy*ey,q[2],dx*ey-dy*ex]};
  const camP=(P,u)=>{const R=P.R;return v3.add([R[0][0]*u[0]+R[1][0]*u[1]+R[2][0]*u[2],R[0][1]*u[0]+R[1][1]*u[1]+R[2][1]*u[2],R[0][2]*u[0]+R[1][2]*u[1]+R[2][2]*u[2]],P.t)};
  const projecteer=(P,u)=>{const c=camP(P,u);if(c[2]<0.3)return null;return[P.f*c[0]/c[2]+.5,(P.f*c[1]/c[2])/P.asp+.5]};
  /* straal door een beeldpunt, in gevelcoördinaten: start C en richting d */
  function straal(P,q){const dc=[(q[0]-.5)/P.f,(q[1]-.5)*P.asp/P.f,1],R=P.R;const d=[v3.dot(R[0],dc),v3.dot(R[1],dc),v3.dot(R[2],dc)],C=v3.sc([v3.dot(R[0],P.t),v3.dot(R[1],P.t),v3.dot(R[2],P.t)],-1);return{C,d}}
  function snijVlak(st,P0,nrm){const den=v3.dot(nrm,st.d);if(Math.abs(den)<1e-6)return null;const k=v3.dot(nrm,v3.sub(P0,st.C))/den;return k>0.3?{k,p:v3.add(st.C,v3.sc(st.d,k))}:null}
  function inPoly(p,P,nrm){const ax=Math.abs(nrm[0])>Math.abs(nrm[1])?(Math.abs(nrm[0])>Math.abs(nrm[2])?0:2):(Math.abs(nrm[1])>Math.abs(nrm[2])?1:2),i1=(ax+1)%3,i2=(ax+2)%3;let c=false;
    for(let i=0,k=P.length-1;i<P.length;k=i++){const a=P[i],b=P[k];if(((a[i2]>p[i2])!==(b[i2]>p[i2]))&&(p[i1]<(b[i1]-a[i1])*(p[i2]-a[i2])/(b[i2]-a[i2])+a[i1]))c=!c}return c}
  const polyOpp=P=>{let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1]}return Math.abs(a)/2};
  const schaal=(meet,asp)=>{const r=meet&&meet.ref;if(!r||!r.a||!r.b)return 0;const d=dist(r.a,r.b,asp);return d>0.002?(num(r.cm)*Math.max(1,num(r.n)||1)/100)/d:0};
  /* uitkomst van één meting: meters (lijn) of m² (rechthoek) */
  function waarde(x,meet,asp){if(x.st)return{v:1,schat:false,ok:true,st:true};
    if(!x.r&&x.m==null&&typeof x.m3==="number")return{v:x.m3,schat:false,ok:true,gevel:true,d3:true};
    const H=gevelH(meet,asp);
    if(H){const P=q=>H([q[0],q[1]*asp]),d2=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(x.r){const c=[x.a,[x.b[0],x.a[1]],x.b,[x.a[0],x.b[1]]].map(P),bw=x.bm!=null?num(x.bm):(d2(c[0],c[1])+d2(c[3],c[2]))/2,hh=x.hm!=null?num(x.hm):(d2(c[0],c[3])+d2(c[1],c[2]))/2;
        return{bw,hh,v:x.bm!=null||x.hm!=null?bw*hh:polyOpp(c),schat:false,ok:true,gevel:true}}
      return{v:x.m!=null?num(x.m):d2(P(x.a),P(x.b)),schat:false,ok:true,gevel:true}}
    const sc=schaal(meet,asp);
    if(x.r){const bw=x.bm!=null?num(x.bm):Math.abs(x.b[0]-x.a[0])*sc,hh=x.hm!=null?num(x.hm):Math.abs(x.b[1]-x.a[1])*asp*sc;return {bw,hh,v:bw*hh,schat:x.bm==null||x.hm==null,ok:!!(sc||(x.bm!=null&&x.hm!=null))}}
    const v=x.m!=null?num(x.m):dist(x.a,x.b,asp)*sc;return {v,schat:x.m==null,ok:!!(sc||x.m!=null)}}
  function totalen(fotos,soorten){const t={};(fotos||[]).forEach(f=>{const meet=f&&f.meet;if(!meet||!meet.maten)return;const asp=f.w&&f.h?f.h/f.w:0.75;
      meet.maten.forEach(x=>{const w=waarde(x,meet,asp);if(w.ok)t[x.s]=(t[x.s]||0)+w.v})});
    Object.keys(t).forEach(k=>t[k]=Math.round(t[k]*10)/10);return t}
  function svgVoor(f,soorten,opt){const meet=f&&f.meet;if(!meet||(!meet.ref&&!meet.g&&!(meet.maten||[]).length))return{svg:"",labs:""};
    const asp=f.w&&f.h?f.h/f.w:0.75,H=Math.round(1000*asp),P=q=>[q[0]*1000,q[1]*H],klein=opt&&opt.klein,sw=klein?6:3.2;
    const kl=s=>{const i=(soorten||[]).findIndex(x=>x.id===s);return i<0?"#9aa1ad":(soorten[i].kleur||KLEUR[i%KLEUR.length])};
    let g="",labs="";
    if(meet.g&&meet.g.pts&&meet.g.pts.length===4){const Q=meet.g.pts.map(P);g+=`<polygon points="${Q.map(q=>q.join(",")).join(" ")}" fill="rgba(20,184,166,.10)" stroke="rgba(11,15,18,.5)" stroke-width="${sw+3}" stroke-linejoin="round"/><polygon points="${Q.map(q=>q.join(",")).join(" ")}" fill="none" stroke="#14b8a6" stroke-width="${sw}" stroke-dasharray="12 8" stroke-linejoin="round"/>`;
      if(!klein&&(!opt||opt.gevelLab!==false)){const t=meet.g.pts,mx=(t[2][0]+t[3][0])/2,my=(t[2][1]+t[3][1])/2;labs+=`<span class="ml-lab gv" data-mlg style="left:${mx*100}%;top:${my*100}%"><i></i>${meet.g.r?esc(meet.g.r[0].toUpperCase()+meet.g.r.slice(1))+"gevel":"Gevel"}<small>${fmt(meet.g.w,2)} × ${fmt(Math.max(meet.g.hL,meet.g.hR),2)} m</small></span>`}}
    const lijn=(a,b,c,dash)=>{const [x1,y1]=P(a),[x2,y2]=P(b),L=Math.hypot(x2-x1,y2-y1)||1,nx=-(y2-y1)/L*9,ny=(x2-x1)/L*9;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(11,15,18,.55)" stroke-width="${sw+3.5}" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"${dash?` stroke-dasharray="14 9"`:""}/>`+
        (klein?"":[[x1,y1],[x2,y2]].map(([x,y])=>`<line x1="${x-nx}" y1="${y-ny}" x2="${x+nx}" y2="${y+ny}" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="5.5" fill="${c}" stroke="#fff" stroke-width="2.5"/>`).join(""))};
    if(meet.ref&&meet.ref.a&&meet.ref.b&&!meet.g){g+=lijn(meet.ref.a,meet.ref.b,REFK,true);
      if(!klein){const r=meet.ref,R=REFS.find(x=>x.k===r.k)||REFS[4],mx=(r.a[0]+r.b[0])/2,my=(r.a[1]+r.b[1])/2,tot=num(r.cm)*Math.max(1,num(r.n)||1);
        labs+=`<span class="ml-lab ref" data-mlref style="left:${mx*100}%;top:${my*100}%"><i></i>${(num(r.n)||1)>1?esc(num(r.n)+" × "):""}${r.k==="3d"?"goot · 3D-model":esc(R.n.toLowerCase())}<small>${tot>=100?fmt(tot/100,2)+" m":fmt(tot,tot%1?2:0)+" cm"}</small></span>`}}
    (meet.maten||[]).forEach((x,j)=>{const c=kl(x.s),w=waarde(x,meet,asp),sn=((soorten||[]).find(s=>s.id===x.s)||{}).kort||"Meting";
      if(x.st){const [x1,y1]=P(x.a),nr=(meet.maten||[]).slice(0,j+1).filter(z=>z.st&&z.s===x.s).length;
        g+=`<circle cx="${x1}" cy="${y1}" r="${klein?16:19}" fill="${c}" stroke="#fff" stroke-width="${klein?5:4}"/><text x="${x1}" y="${y1+ (klein?6:6.5)}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="${klein?17:18}" fill="#fff">${nr}</text>`;
        if(!klein)labs+=`<span class="ml-lab" data-mlj="${j}" style="--c:${c};left:${x.a[0]*100}%;top:${x.a[1]*100}%;margin-top:-14px"><i></i>${esc(sn)} ${nr}</span>`;return}
      if(x.r){const [x1,y1]=P(x.a),[x2,y2]=P(x.b);g+=`<rect x="${Math.min(x1,x2)}" y="${Math.min(y1,y2)}" width="${Math.abs(x2-x1)}" height="${Math.abs(y2-y1)}" rx="6" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="${sw}"/>`;
        if(!klein)labs+=`<span class="ml-lab" data-mlj="${j}" style="--c:${c};left:${(x.a[0]+x.b[0])*50}%;top:${(x.a[1]+x.b[1])*50}%"><i></i>${esc(sn)} ${w.ok?(w.schat?"≈ ":"")+fmt(w.v,1)+" m²":"?"}${w.ok?`<small>${fmt(w.bw,2)} × ${fmt(w.hh,2)} m</small>`:""}</span>`}
      else{g+=lijn(x.a,x.b,c);if(!klein)labs+=`<span class="ml-lab" data-mlj="${j}" style="--c:${c};left:${(x.a[0]+x.b[0])/2*100}%;top:${(x.a[1]+x.b[1])/2*100}%"><i></i>${esc(sn)} ${w.ok?(w.schat?"≈ ":"")+fmt(w.v,w.gevel?2:1)+" m":"?"}${w.d3?"<small>3D</small>":""}</span>`}});
    return{svg:`<svg class="ml-svg" viewBox="0 0 1000 ${H}" preserveAspectRatio="none" aria-hidden="true">${g}</svg>`,labs}}
  /* soorten uit de diensten: alles wat per strekkende meter of per m² gaat */
  function soortenUit(groepen){const L=[];(groepen||[]).forEach(g=>(g.items||[]).forEach(it=>{const e=String(it.eenheid||"").toLowerCase();
      const m2=/m²|m2|vierkante/.test(e),m=!m2&&/strekkend|meter|\bm\b|per m$/.test(e),st=!m&&!m2&&/stuk/.test(e)&&/dakkapel/i.test((g.naam||"")+" "+(it.naam||""));if(!m&&!m2&&!st)return;
      const naam=String(it.naam||"").trim();
      if(st){const n=naam.toLowerCase(),vd=/eerste|\b1e|\b1\b/.test(n)?"1e verd.":/tweede|\b2e|\b2\b/.test(n)?"2e verd.":/derde|\b3e/.test(n)?"3e verd.":(g.items||[]).length>1?naam:"";
        L.push({id:String(it.id),naam:(g.naam||"Dakkapel")+(naam?" · "+naam:""),kort:"Dakkapel"+(vd?" "+vd:""),eenheid:"st",vd:/1e/.test(vd)?1:/2e/.test(vd)?2:/3e/.test(vd)?3:0,prijs:Number(it.prijs)||0});return}
      const een=(g.items||[]).length===1&&g.naam&&!new RegExp(String(g.naam).split(" ")[0],"i").test(naam),kort=een?String(g.naam):(naam.split(/,|\(/)[0].replace(/\s+etc\.?$/i,"").trim()||naam);
      L.push({id:String(it.id),naam:(g.naam&&!new RegExp(g.naam,"i").test(naam)&&(g.items||[]).length>1?g.naam+" · ":"")+naam,kort,eenheid:m2?"m2":"m",prijs:Number(it.prijs)||0})}));
    return L.map((s,i)=>({...s,kleur:KLEUR[i%KLEUR.length]}))}

  /* koppelen aan een foto-element. o = {wrap, foto:()=>foto-object, soorten, host, licht, onChange, model:()=>({laden}|{goten:[m]}|null)}
     Met een 3D-model van de woning (3D BAG) is de schaal de goot: één keer langs de goot slepen en alles klopt. Geen bakstenen tellen. */
  function attach(o){const md=()=>{try{return o.model?o.model():null}catch(e){return null}},goten=()=>{const m=md(),g=m&&m.goten||[];const u=[];g.forEach(v=>{if(v>0.5&&!u.some(x=>Math.abs(x-v)<0.06))u.push(Math.round(v*100)/100)});return u.sort((a,b)=>b-a).slice(0,4)},vlakken=()=>{const m=md();return(m&&m.vlakken||[]).filter(v=>v&&v.w>0&&v.hL>0&&v.hR>0)};
    const heeftSchaal=m=>!!(m&&(m.g&&m.g.pts||schaal(m,asp())));zetCss(o.wrap.getRootNode?o.wrap.getRootNode():document);let aan=false,cur=o.start||"ref",drag=null,sheet=null;
    const f=()=>o.foto(),asp=()=>{const x=f();return x&&x.w&&x.h?x.h/x.w:(o.wrap.clientHeight&&o.wrap.clientWidth?o.wrap.clientHeight/o.wrap.clientWidth:0.75)};
    const meet=()=>{const x=f();if(!x)return null;if(!x.meet)x.meet={maten:[]};if(!x.meet.maten)x.meet.maten=[];return x.meet};
    const so=()=>o.soorten||[];
    const pt=e=>{const b=o.wrap.getBoundingClientRect();return[Math.round(Math.min(1,Math.max(0,(e.clientX-b.left)/b.width))*1e4)/1e4,Math.round(Math.min(1,Math.max(0,(e.clientY-b.top)/b.height))*1e4)/1e4]};
    /* ---- 3D: model van de woning over de foto, en lijnen buiten de gevel (windveer op het dakvlak) in 3D meten ---- */
    const M3=()=>{const m=md();return m&&m.model&&m.model.lijnen?m:null};
    const poseNu=()=>{const m=f()&&f().meet,g=m&&m.g;if(!g||!g.a||!g.b)return null;return pose(g,asp(),m.geo&&m.geo.f35)};
    function vlakkenIn(g){const m=M3();if(!m)return[];const L=[];
      (m.model.daken||[]).forEach(P=>{const Q=P.map(q=>naarVlak(g,q));if(Q.length<3)return;let n=[0,0,0];for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length];n=v3.add(n,[(a[1]-b[1])*(a[2]+b[2]),(a[2]-b[2])*(a[0]+b[0]),(a[0]-b[0])*(a[1]+b[1])])}L.push({Q,n:norm(n),dak:true})});
      (m.vlakken||[]).forEach(v=>{if(!v.a||!v.b)return;const h=Math.max(v.hL,v.hR,v.punt?v.punt.h:0);const Q=[[v.a[0],v.a[1],0],[v.b[0],v.b[1],0],[v.b[0],v.b[1],h],[v.a[0],v.a[1],h]].map(q=>naarVlak(g,q));
        const n=norm(v3.x(v3.sub(Q[1],Q[0]),v3.sub(Q[3],Q[0])));L.push({Q,n})});return L}
    function raak(P,V,q){const st=straal(P,q);let best=null;V.forEach(pl=>{const h=snijVlak(st,pl.Q[0],pl.n);if(h&&(!best||h.k<best.k)&&inPoly(h.p,pl.Q,pl.n))best=h});
      if(!best)best=snijVlak(st,[0,0,0],[0,0,1]);return best&&best.p}
    function herreken3d(){const m=f()&&f().meet;if(!m||!m.maten)return;const P=poseNu(),V=P?vlakkenIn(m.g):[];
      m.maten.forEach(x=>{if(x.r||x.st)return;delete x.m3;if(!P||!V.length)return;const a=raak(P,V,x.a),b=raak(P,V,x.b);if(!a||!b)return;
        if(Math.abs(a[2])>0.15||Math.abs(b[2])>0.15){const d=v3.len(v3.sub(a,b));if(d>0.05&&d<80)x.m3=Math.round(d*1000)/1000}})}
    function tekenModel(){o.wrap.querySelectorAll(".ml-3d").forEach(n=>n.remove());const x=f(),m=x&&x.meet,M=M3();if(!aan||!m||!m.g||!m.g.a||!M)return;const P=poseNu();if(!P)return;
      const H=Math.round(1000*asp());let d="",dk="",gr="";
      M.model.lijnen.forEach(([p1,p2,t])=>{const a=projecteer(P,naarVlak(m.g,p1)),b=projecteer(P,naarVlak(m.g,p2));if(!a||!b)return;if([a,b].some(q=>q[0]<-1||q[0]>2||q[1]<-1||q[1]>2))return;
        const seg=`M${(a[0]*1000).toFixed(1)} ${(a[1]*H).toFixed(1)}L${(b[0]*1000).toFixed(1)} ${(b[1]*H).toFixed(1)}`;if(t==="d")dk+=seg;else if(t==="g")gr+=seg;else d+=seg});
      o.wrap.insertAdjacentHTML("beforeend",`<svg class="ml-3d" viewBox="0 0 1000 ${H}" preserveAspectRatio="none" aria-hidden="true" style="opacity:${cur==="gevel"?1:.5}"><path d="${gr}" stroke="rgba(255,255,255,.55)" stroke-width="1.6" fill="none" stroke-dasharray="4 5"/><path d="${d}${dk}" stroke="rgba(11,15,18,.55)" stroke-width="4.2" fill="none"/><path d="${d}" stroke="#fff" stroke-width="1.8" fill="none"/><path d="${dk}" stroke="#2dd4bf" stroke-width="2.2" fill="none"/></svg>`)}
    /* eerste stand uit GPS + kompas: welke gevel staat op de foto en waar zitten de hoeken ongeveer */
    function gpsStand(){const m=f()&&f().meet,geo=m&&m.geo,M=md();if(!geo||!M||!M.ll)return null;const V=vlakken().filter(v=>v.a&&v.b);if(!V.length)return null;
      const C=geo.lat!=null?[(geo.lng-M.ll[1])*111320*Math.cos(M.ll[0]*Math.PI/180),(geo.lat-M.ll[0])*110540]:null,dir=geo.dir!=null?geo.dir*Math.PI/180:null;
      if(!C&&dir==null)return null;
      const sc=V.map(v=>{const mx=(v.a[0]+v.b[0])/2,my=(v.a[1]+v.b[1])/2,L=Math.hypot(v.b[0]-v.a[0],v.b[1]-v.a[1]),n=[(v.b[1]-v.a[1])/L,-(v.b[0]-v.a[0])/L];let s=0;
        if(C){const dx=C[0]-mx,dy=C[1]-my,dd=Math.hypot(dx,dy)||1;const voor=(dx*n[0]+dy*n[1])/dd;if(voor<0.15)s-=5;s+=voor*2-dd/40}
        if(dir!=null){const kijk=[Math.sin(dir),Math.cos(dir)];s+=-(kijk[0]*n[0]+kijk[1]*n[1])*2}return{v,s}}).sort((a,b)=>b.s-a.s);
      const v=sc[0].v;if(!C||dir==null)return{v};
      const z=1.6,mid=[(v.a[0]+v.b[0])/2,(v.a[1]+v.b[1])/2,Math.max(v.hL,v.hR)/2],afst=Math.hypot(mid[0]-C[0],mid[1]-C[1])||5,pit=geo.pitch!=null?geo.pitch*Math.PI/180:Math.atan2(mid[2]-z,afst);
      const fw=[Math.cos(pit)*Math.sin(dir),Math.cos(pit)*Math.cos(dir),Math.sin(pit)],ri=[Math.cos(dir),-Math.sin(dir),0],dn=v3.x(fw,ri),fpx=f35naarF(geo.f35||26,asp());
      const pr=q=>{const r=v3.sub(q,[C[0],C[1],z]),zc=v3.dot(r,fw);if(zc<0.5)return null;return[Math.max(-.3,Math.min(1.3,fpx*v3.dot(r,ri)/zc+.5)),Math.max(-.3,Math.min(1.3,fpx*v3.dot(r,dn)/zc/asp()+.5))]};
      const pts=[[v.a[0],v.a[1],0],[v.b[0],v.b[1],0],[v.b[0],v.b[1],v.hR],[v.a[0],v.a[1],v.hL]].map(pr);return{v,pts:pts.every(Boolean)?pts:null}}
    const wijzig=()=>{herreken3d();teken();if(o.onChange)o.onChange()};
    function teken(){o.wrap.querySelectorAll(".ml-svg,.ml-lab").forEach(n=>n.remove());const x=f();if(!x)return;const fx=x.w?x:{...x,w:o.wrap.clientWidth,h:o.wrap.clientHeight};
      const r=svgVoor(fx,so());if(r.svg)o.wrap.insertAdjacentHTML("beforeend",r.svg+r.labs);
      o.wrap.querySelectorAll(".ml-lab").forEach(l=>{l.style.pointerEvents=aan?"auto":"none"});
      tekenModel();o.wrap.querySelectorAll(".ml-gh").forEach(n=>n.remove());const gm=x.meet&&x.meet.g;if(aan&&cur==="gevel"&&gm&&gm.pts)gm.pts.forEach((q,i)=>o.wrap.insertAdjacentHTML("beforeend",`<span class="ml-gh" style="left:${q[0]*100}%;top:${q[1]*100}%">${["LO","RO","RB","LB"][i]}</span>`));
      if(o.bar)o.bar()}
    function sluitSheet(){if(sheet){sheet.remove();sheet=null}}
    function maakSheet(html){sluitSheet();sheet=document.createElement("div");sheet.className="ml-sheet";sheet.innerHTML=html;(o.host||o.wrap.parentElement).appendChild(sheet);
      sheet.addEventListener("pointerdown",e=>e.stopPropagation());sheet.addEventListener("click",e=>e.stopPropagation());
      setTimeout(()=>{const i=sheet&&sheet.querySelector("input");if(i){i.focus();i.select&&i.select()}},60);return sheet}
    function refSheet(nieuw){const m=meet(),r=m.ref;let k=r.k||"steen",n=num(r.n)||1,cm=num(r.cm)||21;
      const s=maakSheet(`<h4 style="--c:${REFK}"><i></i>Referentie</h4><p>Wat heeft u opgemeten? Meet bij voorkeur over meerdere stenen of pannen, vlak bij wat u wilt meten.</p>
        <div class="ml-refs">${REFS.map(R=>`<button type="button" data-k="${R.k}" aria-pressed="${R.k===k}">${R.n}<small>${R.sub}${R.k!=="eigen"?" · "+fmt(R.cm,R.cm%1?2:0)+" cm":""}</small></button>`).join("")}</div>
        <div class="ml-row"><label>Aantal<input type="text" inputmode="numeric" data-n value="${n}"></label><span class="x">×</span><label>Maat (cm)<input type="text" inputmode="decimal" data-cm value="${fmt(cm,cm%1?2:0)}"></label></div>
        <div class="ml-uit" data-uit></div><div class="ml-knop">${nieuw?"":`<button type="button" class="weg" data-weg>Wissen</button>`}<button type="button" data-af>Annuleren</button><button type="button" class="ok" data-ok>Gebruiken</button></div>`);
      const nI=s.querySelector("[data-n]"),cI=s.querySelector("[data-cm]"),uit=()=>{const t=num(cI.value)*Math.max(1,num(nI.value)||1);s.querySelector("[data-uit]").innerHTML=`= ${t>=100?fmt(t/100,2)+" m":fmt(t,1)+" cm"} <small>· alle metingen op deze foto rekenen hiermee</small>`};uit();
      s.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{k=b.dataset.k;s.querySelectorAll("[data-k]").forEach(x=>x.setAttribute("aria-pressed",x===b));const R=REFS.find(x=>x.k===k);if(k!=="eigen")cI.value=fmt(R.cm,R.cm%1?2:0);uit();if(k==="eigen")cI.focus()});
      nI.oninput=cI.oninput=uit;
      const ok=()=>{const c=num(cI.value);if(!(c>0)){cI.focus();return}const R0=REFS.find(x=>x.k===k);if(R0&&k!=="eigen"&&Math.abs(R0.cm-c)>0.001)k="eigen";m.ref={...m.ref,k,cm:c,n:Math.max(1,Math.round(num(nI.value)||1))};sluitSheet();if(cur==="ref"&&so().length)cur=so()[0].id;wijzig()};
      s.querySelector("[data-ok]").onclick=ok;s.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();ok()}if(e.key==="Escape"){e.stopPropagation();s.querySelector("[data-af]").click()}});
      s.querySelector("[data-af]").onclick=()=>{if(nieuw)delete m.ref;sluitSheet();teken()};
      const w=s.querySelector("[data-weg]");if(w)w.onclick=()=>{delete m.ref;sluitSheet();cur="ref";wijzig()}}
    /* gevel rechtzetten: kies het vlak uit het 3D-model, AI zoekt de vier hoeken, jij versleept ze als het nodig is */
    const vlakNaam=v=>(v.r||v.richting?((v.r||v.richting)[0].toUpperCase()+(v.r||v.richting).slice(1))+"gevel":"Gevel");
    let zoekt=false;
    function zetVlak(v,start){const m=meet(),oud=m.g&&m.g.pts;m.g={pts:oud||start||[[.18,.86],[.82,.86],[.82,.32],[.18,.32]],w:v.w,hL:v.hL,hR:v.hR,r:v.richting||v.r||"",...(v.a&&v.b?{a:v.a,b:v.b}:{})};cur="gevel";sluitSheet();wijzig();if(!oud)zoekHoeken()}
    function vlakSheet(nieuw){const V=vlakken();if(!V.length)return;const m=meet();
      const s=maakSheet(`<h4 style="--c:#14b8a6"><i></i>Welke gevel staat op de foto?</h4><p>De maten komen uit het 3D-model van de woning. Mansard zet de foto daarmee recht, zodat elke maat op deze gevel klopt, ook als de foto scheef is.</p>
        <div class="ml-refs">${V.map((v,i)=>`<button type="button" data-v="${i}" aria-pressed="${!!(m.g&&m.g.w===v.w&&m.g.r===v.richting)}">${esc(vlakNaam(v))}<small>${fmt(v.w,2)} m breed · ${fmt(Math.max(v.hL,v.hR),2)} m hoog${v.punt?" · puntgevel":""}</small></button>`).join("")}</div>
        <div class="ml-knop">${m.g?`<button type="button" class="weg" data-weg>Wissen</button>`:""}<button type="button" data-af>Annuleren</button></div>`);
      s.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>zetVlak(V[+b.dataset.v]));s.querySelector("[data-af]").onclick=()=>{sluitSheet();teken()};
      const w=s.querySelector("[data-weg]");if(w)w.onclick=()=>{delete m.g;sluitSheet();wijzig()}}
    function startGevel(){const V=vlakken();if(!V.length)return;const gp=gpsStand();if(gp){zetVlak(gp.v,gp.pts);if(o.melding)o.melding(gp.pts?"Gevel gekozen met GPS en kompas van de foto":"Gevel gekozen met de GPS van de foto");return}if(V.length===1||V.every(v=>Math.abs(v.w-V[0].w)<0.05&&Math.abs(Math.max(v.hL,v.hR)-Math.max(V[0].hL,V[0].hR))<0.1))zetVlak(V[0]);else vlakSheet(true)}
    async function zoekHoeken(){if(!o.ai||zoekt)return;const img=o.wrap.querySelector("img");if(!img)return;zoekt=true;
      const z=document.createElement("div");z.className="ml-zoek";z.innerHTML="<span>AI zoekt de hoeken van de gevel…</span>";o.wrap.appendChild(z);
      try{const c=document.createElement("canvas"),W=img.naturalWidth||img.width,H=img.naturalHeight||img.height,k=Math.min(1,1600/Math.max(W,H));c.width=Math.round(W*k);c.height=Math.round(H*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        const r=await o.ai(c.toDataURL("image/jpeg",.85));const m=meet();if(r&&r.hoeken&&r.hoeken.length===4&&m.g){m.g.pts=r.hoeken.map(q=>[q[0],q[1]]);m.g.ai=r.zeker||"ja";
          const DK=so().filter(z=>z.eenheid==="st");if(DK.length&&Array.isArray(r.dakkapellen)&&!m.maten.some(z=>z.st))r.dakkapellen.forEach(d=>{const z=DK.find(k=>k.vd&&k.vd===Number(d.v))||DK[0];if(isFinite(d.x)&&isFinite(d.y))m.maten.push({s:z.id,a:[+d.x,+d.y],b:[+d.x,+d.y],st:1})});
          wijzig()}}
      catch(e){if(o.fout)o.fout(e)}finally{zoekt=false;z.remove()}}
    function zetGoot(v){const m=meet();m.ref={...m.ref,k:"3d",cm:Math.round(v*1000)/10,n:1};sluitSheet();if(cur==="ref"&&so().length)cur=so()[0].id;wijzig()}
    function gootSheet(G,nieuw){const m=meet();const s=maakSheet(`<h4 style="--c:${REFK}"><i></i>Welke goot staat op de foto?</h4><p>Het 3D-model van deze woning heeft goten van verschillende lengte. Kies de goot waar u langs sleepte.</p>
        <div class="ml-refs">${G.map(v=>`<button type="button" data-g="${v}">${fmt(v,2)} m<small>goot · 3D-model</small></button>`).join("")}<button type="button" data-eigen>Andere maat<small>zelf invullen</small></button></div>
        <div class="ml-knop"><button type="button" data-af>Annuleren</button></div>`);
      s.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>zetGoot(+b.dataset.g));
      s.querySelector("[data-eigen]").onclick=()=>{m.ref={...m.ref,k:"eigen",cm:Math.round(G[0]*100),n:1};refSheet(nieuw)};
      s.querySelector("[data-af]").onclick=()=>{if(nieuw)delete m.ref;sluitSheet();teken()}}
    function maatSheet(j,nieuw){const m=meet(),x=m.maten[j];if(!x)return;
      if(x.st){const sx=so().find(s=>s.id===x.s)||{naam:"Dakkapel",kleur:"#9aa1ad"},D=so().filter(z=>z.eenheid==="st");
        const s=maakSheet(`<h4 style="--c:${sx.kleur}"><i></i>${esc(sx.naam)}</h4><p>Elke stip telt als één dakkapel. Kies de verdieping of haal de stip weg.</p>${D.length>1?`<div class="ml-refs">${D.map(z=>`<button type="button" data-s="${esc(z.id)}" aria-pressed="${z.id===x.s}" style="--c:${z.kleur}">${esc(z.kort)}<small>per stuk</small></button>`).join("")}</div>`:""}<div class="ml-knop"><button type="button" class="weg" data-weg>Wissen</button><button type="button" data-af>Sluiten</button></div>`);
        s.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{x.s=b.dataset.s;sluitSheet();wijzig()});s.querySelector("[data-af]").onclick=sluitSheet;s.querySelector("[data-weg]").onclick=()=>{m.maten.splice(j,1);sluitSheet();wijzig()};return}const sx=so().find(s=>s.id===x.s)||{naam:"Meting",kleur:"#9aa1ad",eenheid:x.r?"m2":"m"},w=waarde(x,m,asp()),c=sx.kleur;
      const s=maakSheet(`<h4 style="--c:${c}"><i></i>${esc(sx.naam)}</h4><p>${w.ok?(w.gevel?"Gemeten op de rechtgezette gevel (maten uit het 3D-model). Klopt het niet? Pas de maat aan.":w.schat?(m.ref&&m.ref.k==="3d"?"Berekend met de goot uit het 3D-model. Klopt het niet? Pas de maat aan.":"Geschat met de referentie. Klopt het niet? Pas de maat aan."):"Zelf ingevulde maat."):"Nog geen referentie op deze foto: vul de maat zelf in, of teken eerst een referentie."}</p>
        ${x.r?`<div class="ml-row"><label>Breedte (m)<input type="text" inputmode="decimal" data-bw value="${w.ok?fmt(w.bw,2):""}"></label><span class="x">×</span><label>Hoogte (m)<input type="text" inputmode="decimal" data-hh value="${w.ok?fmt(w.hh,2):""}"></label></div>`
          :`<div class="ml-row"><label>Lengte (m)<input type="text" inputmode="decimal" data-m value="${w.ok?fmt(w.v,2):""}"></label></div>`}
        ${so().length>1?`<div class="ml-refs">${so().filter(z=>(z.eenheid==="m2")===!!x.r).map(z=>`<button type="button" data-s="${esc(z.id)}" aria-pressed="${z.id===x.s}" style="--c:${z.kleur}">${esc(z.kort)}<small>${z.eenheid==="m2"?"per m²":"per meter"}</small></button>`).join("")}</div>`:""}
        <div class="ml-knop"><button type="button" class="weg" data-weg>Wissen</button><button type="button" data-af>${nieuw?"Zo laten":"Annuleren"}</button><button type="button" class="ok" data-ok>Opslaan</button></div>`);
      let ns=x.s;s.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ns=b.dataset.s;s.querySelectorAll("[data-s]").forEach(z=>z.setAttribute("aria-pressed",z===b))});
      const ok=()=>{const y={...x,s:ns};if(x.r){const a=s.querySelector("[data-bw]").value,b=s.querySelector("[data-hh]").value;
          if(a!==(w.ok?fmt(w.bw,2):""))y.bm=num(a);if(b!==(w.ok?fmt(w.hh,2):""))y.hm=num(b)}
        else{const v=s.querySelector("[data-m]").value;if(v!==(w.ok?fmt(w.v,2):""))y.m=num(v)}
        m.maten[j]=y;sluitSheet();wijzig()};
      s.querySelector("[data-ok]").onclick=ok;s.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();ok()}if(e.key==="Escape"){e.stopPropagation();sluitSheet()}});
      s.querySelector("[data-af]").onclick=()=>{sluitSheet();if(nieuw)wijzig()};
      s.querySelector("[data-weg]").onclick=()=>{m.maten.splice(j,1);sluitSheet();wijzig()}}
    /* tekenen met slepen */
    const down=e=>{if(!aan)return;if(e.target.closest(".ml-lab,.ml-sheet"))return;e.preventDefault();e.stopPropagation();sluitSheet();
      if(cur==="gevel"){const m=meet();if(!m.g){startGevel();return}const p=pt(e),W=o.wrap.clientWidth,H=o.wrap.clientHeight;let best=-1,bd=40;m.g.pts.forEach((q,i)=>{const d=Math.hypot((q[0]-p[0])*W,(q[1]-p[1])*H);if(d<bd){bd=d;best=i}});
        if(best<0)return;try{o.wrap.setPointerCapture(e.pointerId)}catch(_){}drag={hoek:best,a:p,b:p};o.wrap.classList.add("ml-drag");toonLoep(m.g.pts[best],"","#14b8a6");return}
      {const sx=so().find(s=>s.id===cur);if(sx&&sx.eenheid==="st"){const m=meet();m.maten.push({s:cur,a:pt(e),b:pt(e),st:1});wijzig();return}}
      try{o.wrap.setPointerCapture(e.pointerId)}catch(_){}const p=pt(e),sx=so().find(s=>s.id===cur),r=cur!=="ref"&&sx&&sx.eenheid==="m2";drag={a:p,b:p,r,ref:cur==="ref"};
      o.wrap.classList.add("ml-drag");toonLoep(p,"",drag.ref?REFK:(sx&&sx.kleur));const x=f();x.meet=x.meet||{maten:[]};const tmp=drag.ref?{...x.meet,ref:{...(x.meet.ref||{k:"steen",cm:21,n:1}),a:p,b:p}}:{...x.meet,maten:[...(x.meet.maten||[]),{s:cur,a:p,b:p,...(r?{r:1}:{})}]};drag.tmp=tmp;drag.orig=x.meet};
    let loep=null;
    function toonLoep(p,txt,c){const img=o.wrap.querySelector("img");if(!img)return;if(!loep){loep=document.createElement("div");loep.className="ml-loep";loep.innerHTML="<b></b>";o.wrap.appendChild(loep)}
      const W=o.wrap.clientWidth,H=o.wrap.clientHeight,Z=3;loep.style.left=p[0]*100+"%";loep.style.top=p[1]*100+"%";loep.classList.toggle("onder",p[1]*H<170);
      loep.style.backgroundImage=`url("${img.currentSrc||img.src}")`;loep.style.backgroundSize=`${W*Z}px ${H*Z}px`;loep.style.backgroundPosition=`${66-p[0]*W*Z}px ${66-p[1]*H*Z}px`;loep.style.setProperty("--c",c||"#ffc53d");
      loep.querySelector("b").textContent=txt||"";loep.querySelector("b").style.display=txt?"":"none"}
    function wegLoep(){if(loep){loep.remove();loep=null}}
    const move=e=>{if(!drag)return;e.preventDefault();drag.b=pt(e);
      if(drag.hoek!=null){const m=meet();m.g.pts[drag.hoek]=[...drag.b];teken();toonLoep(drag.b,["Linksonder","Rechtsonder","Rechtsboven","Linksboven"][drag.hoek],"#14b8a6");return}
      const x=f();if(drag.ref)drag.tmp.ref.b=drag.b;else drag.tmp.maten[drag.tmp.maten.length-1].b=drag.b;x.meet=drag.tmp;teken();
      {const sx=so().find(s=>s.id===cur),c=drag.ref?REFK:(sx&&sx.kleur),m=drag.tmp,j=m.maten.length-1,w=drag.ref?null:waarde(m.maten[j],m,asp());
        toonLoep(drag.b,drag.ref?"Referentie":w&&w.ok?(drag.r?fmt(w.bw,2)+" × "+fmt(w.hh,2)+" m":"≈ "+fmt(w.v,2)+" m"):"",c)}
      x.meet=drag.orig};
    const up=e=>{if(!drag)return;const d=drag;drag=null;o.wrap.classList.remove("ml-drag");wegLoep();const x=f(),lang=dist(d.a,d.b,asp())>0.012;
      if(d.hoek!=null){teken();if(o.onChange)o.onChange();return}
      if(!lang){teken();return}
      if(d.hoek!=null){wijzig();return}
      x.meet=d.tmp;if(d.ref){const G=goten();if(G.length===1)zetGoot(G[0]);else if(G.length){teken();gootSheet(G,!d.orig||!d.orig.ref)}else{teken();refSheet(!d.orig||!d.orig.ref)}}else{const j=x.meet.maten.length-1;teken();if(o.onChange)o.onChange();if(!heeftSchaal(x.meet))maatSheet(j,true)}};
    const klik=e=>{if(!aan)return;const l=e.target.closest(".ml-lab");e.stopPropagation();e.preventDefault();if(!l)return;if(l.hasAttribute("data-mlg")){cur="gevel";vlakSheet(false);if(o.bar)o.bar();return}if(l.hasAttribute("data-mlref")){const G=goten();if(G.length)gootSheet(G,false);else refSheet(false)}else maatSheet(+l.dataset.mlj,false)};
    o.wrap.addEventListener("pointerdown",down,true);o.wrap.addEventListener("pointermove",move,true);o.wrap.addEventListener("pointerup",up,true);o.wrap.addEventListener("pointercancel",up,true);o.wrap.addEventListener("click",klik,true);
    /* knoppenbalk: Referentie + soorten met totalen */
    function barHtml(totaal){const m=f()&&f().meet,VL=vlakken(),gv=VL.length>0,heeftG=!!(m&&m.g&&m.g.pts),heeftRef=!!(m&&m.ref)||heeftG,G=gv?[]:goten(),laadt=!gv&&!G.length&&!!(md()&&md().laden),d3=G.length>0;
      if(gv&&cur==="ref")cur="gevel";
      const fm=G.map(v=>"<b>"+fmt(v,2)+" m</b>").join(" of ");
      const refTxt=gv?(heeftG?"":"Tik op <b>Gevel</b>: Mansard zoekt de vier hoeken van de gevelmuur en zet de foto recht met de maten uit het 3D-model. Daarna klopt elke maat op die gevel."):d3?"Sleep eerst één keer langs de <b>goot</b> op de foto. Volgens het 3D-model van de woning is die "+fm+"; daarmee kloppen alle andere maten.":laadt?"3D-model van de woning laden…":"Begin met een <b>referentie</b>: sleep over iets waarvan u de maat kent, bijvoorbeeld 4 bakstenen of 3 dakpannen.";
      const t=totaal||totalen([f()],so());
      return `<div class="ml-bar${o.licht?" licht":""}" role="radiogroup" aria-label="Wat meet u">
        ${gv?`<button type="button" role="radio" data-mls="gevel" aria-checked="${cur==="gevel"}" style="--c:#14b8a6"><i>${ICL}</i>Gevel${heeftG?`<b>✓</b>`:""}</button>`:`<button type="button" role="radio" data-mls="ref" aria-checked="${cur==="ref"}" style="--c:${REFK}"><i style="color:#1d1a10">${ICL}</i>${d3||laadt?"Schaal: goot":"Referentie"}${d3&&!heeftRef?`<b style='color:#1d1a10'>${fmt(G[0],2)} m</b>`:""}${heeftRef?"<b style='color:#1d1a10'>✓</b>":""}</button>`}
        ${so().map(s=>`<button type="button" role="radio" data-mls="${esc(s.id)}" aria-checked="${cur===s.id}" style="--c:${s.kleur}"><i></i>${esc(s.kort)}${t[s.id]?`<b>${s.eenheid==="st"?Math.round(t[s.id])+" st":fmt(t[s.id],1)+" "+(s.eenheid==="m2"?"m²":"m")}</b>`:""}</button>`).join("")}</div>
        <div class="ml-tip">${so().find(s=>s.id===cur&&s.eenheid==="st")?"Tik op elke dakkapel: elke stip telt als één. Tik op een stip om de verdieping te kiezen of hem te wissen.":cur==="gevel"&&heeftG?"Versleep een hoek als hij niet precies op de hoek van de muur staat. Tik op het groene label voor een andere gevel. Daarna kies je wat je meet.":heeftRef?(cur==="ref"?(d3?"Sleep opnieuw langs de <b>goot</b> om de schaal te verplaatsen.":"Sleep opnieuw om de <b>referentie</b> te verplaatsen."):so().find(s=>s.id===cur&&s.eenheid==="st")?"Tik op elke dakkapel: elke stip telt als één. Tik op een stip om hem te wissen.":so().find(s=>s.id===cur&&s.eenheid==="m2")?"Trek een rechthoek over het vlak. Tik op een label om de maat aan te passen.":"Sleep van begin tot eind langs wat u meet. Tik op een label om de maat aan te passen."):refTxt}</div>`}
    function bindBar(el){el.querySelectorAll("[data-mls]").forEach(b=>b.onclick=()=>{cur=b.dataset.mls;sluitSheet();const m=meet();if(cur==="gevel"&&m&&!m.g)startGevel();else teken()})}
    teken();
    return{aan:v=>{aan=!!v;o.wrap.classList.toggle("ml-on",aan);if(aan&&cur!=="ref"&&cur!=="gevel"&&!so().some(s=>s.id===cur))cur="ref";if(aan&&cur==="gevel"&&f()&&f().meet&&f().meet.g&&so().length)cur=so()[0].id;if(aan&&f()&&f().meet&&f().meet.ref&&cur==="ref"&&so().length)cur=so()[0].id;if(!aan)sluitSheet();teken()},
      teken,barHtml,bindBar,sluit:sluitSheet,
      wis:()=>{const x=f();if(x&&x.meet){delete x.meet;wijzig()}},
      ongedaan:()=>{const m=f()&&f().meet;if(m&&m.maten&&m.maten.length){m.maten.pop();wijzig();return true}return false},
      weg:()=>{sluitSheet();o.wrap.removeEventListener("pointerdown",down,true);o.wrap.removeEventListener("pointermove",move,true);o.wrap.removeEventListener("pointerup",up,true);o.wrap.removeEventListener("pointercancel",up,true);o.wrap.removeEventListener("click",klik,true)}}}
  /* opslaan: alleen wat nodig is, afgerond */
  const r4=v=>Math.round(v*1e4)/1e4;
  function schoon(meet){if(!meet||(!meet.ref&&!meet.g&&!meet.geo&&!(meet.maten||[]).length))return null;const o={};
    if(meet.geo&&typeof meet.geo==="object"){const z={};["lat","lng","acc","dir","pitch","f35","bron"].forEach(k=>{if(meet.geo[k]!=null)z[k]=k==="bron"?String(meet.geo[k]):Math.round(Number(meet.geo[k])*1e7)/1e7});o.geo=z}
    if(meet.ref&&meet.ref.a)o.ref={a:meet.ref.a.map(r4),b:meet.ref.b.map(r4),k:meet.ref.k||"eigen",cm:num(meet.ref.cm),n:Math.max(1,num(meet.ref.n)||1)};
    if(meet.g&&meet.g.pts&&meet.g.pts.length===4)o.g={pts:meet.g.pts.map(q=>q.map(r4)),w:num(meet.g.w),hL:num(meet.g.hL),hR:num(meet.g.hR),r:String(meet.g.r||""),...(meet.g.a&&meet.g.b?{a:meet.g.a.map(num),b:meet.g.b.map(num)}:{})};
    o.maten=(meet.maten||[]).filter(x=>x&&x.a&&x.b).map(x=>({s:String(x.s),a:x.a.map(r4),b:x.b.map(r4),...(x.r?{r:1}:{}),...(x.st?{st:1}:{}),...(typeof x.m3==="number"?{m3:Math.round(x.m3*1000)/1000}:{}),...(x.m!=null?{m:num(x.m)}:{}),...(x.bm!=null?{bm:num(x.bm)}:{}),...(x.hm!=null?{hm:num(x.hm)}:{})}));return o}
  window.Meetlint={attach,totalen,svgVoor,soortenUit,schoon,zetCss,REFS}
})();
