/* ---------- complete website (mijnschoonmaker.com) voor Framer: één code component, gegevens en calculator uit het CRM ---------- */
const WEB_CSS=`
.ms{--ink:#1d1d1f;--muted:#6e6e73;--m2:#86868b;--bg:#fff;--bg2:#f5f5f7;--line:#d2d2d7;--acc:#137a8a;--acc2:#0f5f6e;--b1:#0f5f6e;--b2:#137a8a;--soft:#e3f2f4;--r:28px;
  --blauw:radial-gradient(120% 160% at 100% 0%,#2aa3b3 0%,transparent 55%),linear-gradient(135deg,#0f5f6e,#137a8a 55%,#1d5a74);
  --lijnen:radial-gradient(circle at 18% 140%,rgb(255 255 255 / .14),transparent 45%),repeating-linear-gradient(115deg,rgb(255 255 255 / .035) 0 2px,transparent 2px 26px);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",Inter,"Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased;line-height:1.47;font-size:17px;letter-spacing:-.022em;text-align:left;width:100%;overflow-x:clip}
.ms *{box-sizing:border-box}.ms a{color:inherit;text-decoration:none}.ms img,.ms svg{display:block;max-width:100%}
.ms h1,.ms h2,.ms h3,.ms p{margin:0}.ms ul,.ms ol{margin:0;padding:0;list-style:none}
.ms .in{width:min(1024px,100% - 44px);margin:0 auto}.ms .in.w{width:min(1200px,100% - 44px)}
.ms p,.ms li{text-wrap:pretty}.ms h1,.ms h2,.ms h3{text-wrap:balance;overflow-wrap:break-word}
/* type */
.ms .t1{font-size:clamp(44px,7.4vw,80px);font-weight:600;letter-spacing:-.015em;line-height:1.05}
.ms .t2{font-size:clamp(34px,5vw,56px);font-weight:600;letter-spacing:-.015em;line-height:1.07}
.ms .t3{font-size:clamp(24px,2.8vw,32px);font-weight:600;letter-spacing:-.01em;line-height:1.14}
.ms .sub{font-size:clamp(19px,2.3vw,28px);font-weight:400;letter-spacing:-.01em;line-height:1.25;color:var(--ink);margin-top:14px}
.ms .ld{font-size:clamp(17px,1.5vw,21px);line-height:1.38;color:var(--muted);margin-top:14px;max-width:46em}
.ms .mid{text-align:center}.ms .mid .ld,.ms .mid .sub{margin-left:auto;margin-right:auto}
.ms .lnk{display:inline-flex;align-items:center;gap:2px;color:var(--acc);font-size:clamp(17px,1.5vw,21px);font-weight:400;letter-spacing:-.01em}.ms .lnk::after{content:"›";font-size:1.15em;margin-left:3px;transition:transform .2s}.ms .lnk:hover{text-decoration:underline}.ms .lnk:hover::after{transform:translateX(2px)}
.ms .lnks{display:flex;gap:10px 34px;flex-wrap:wrap;justify-content:center;margin-top:22px}
.ms .pil{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;white-space:nowrap;border-radius:980px;background:var(--acc);color:#fff;font-size:17px;font-weight:400;letter-spacing:-.01em;border:0;cursor:pointer;transition:background .2s}.ms .pil:hover{background:#15889a}.ms .pil svg{width:18px;height:18px}
.ms .pil.licht{background:transparent;color:var(--acc);box-shadow:inset 0 0 0 1px var(--acc)}.ms .pil.licht:hover{background:var(--acc);color:#fff}
.ms .pil.wit{background:#fff;color:var(--ink)}.ms .pil.wit:hover{background:#e8e8ed}
/* secties */
.ms section{padding:clamp(72px,11vw,130px) 0;scroll-margin-top:52px}
.ms .grijs{background:var(--bg2)}.ms .zwart{background:#000;color:#f5f5f7}.ms .zwart .ld{color:var(--m2)}.ms .zwart .sub{color:#f5f5f7}
.ms .zwart .lnk{color:#2997ff}.ms .zwart .lnk{color:#5ac8d8}
.ms .kopblok{max-width:820px;margin:0 auto}
/* nav */
.ms .nav{position:sticky;top:0;z-index:40;background:rgb(0 0 0 / .8);-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px);color:#f5f5f7}
.ms .nav .in{display:flex;align-items:center;height:48px;gap:0}
.ms .logo{display:flex;align-items:center;font-size:15px;font-weight:600;letter-spacing:-.01em;color:#f5f5f7;margin-right:auto}.ms .logo img{height:24px;width:auto;filter:brightness(0) invert(1)}
.ms .lk{display:flex;gap:30px;font-size:12px;letter-spacing:-.01em;color:rgb(245 245 247 / .8);margin:0 auto}.ms .lk a:hover{color:#fff}.ms .lk .lk-p{display:none}
.ms .nav .portaal{margin-left:auto;font-size:12px;color:rgb(245 245 247 / .8);display:flex;align-items:center;gap:6px}.ms .nav .portaal svg{width:14px;height:14px}.ms .nav .portaal:hover{color:#fff}
.ms .nav .knop{display:none}
.ms #msm{display:none}.ms .hb{display:none;width:40px;height:40px;align-items:center;justify-content:center;cursor:pointer;color:#f5f5f7;margin-left:12px}.ms .hb svg{width:20px}
@media (max-width:900px){.ms .lk,.ms .nav .portaal{display:none}.ms .hb{display:flex;margin-left:auto}
  .ms #msm:checked~.nav .lk{display:flex;position:absolute;top:48px;left:0;right:0;flex-direction:column;gap:0;background:rgb(0 0 0 / .92);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);padding:10px 22px 22px;font-size:17px}
  .ms #msm:checked~.nav .lk a{padding:13px 0;border-bottom:1px solid rgb(255 255 255 / .12);color:#f5f5f7}.ms #msm:checked~.nav .lk .lk-p{display:block;color:#5ac8d8}}
/* hero */
.ms .hero{background:var(--bg2);padding:clamp(56px,9vw,96px) 0 0;text-align:center;overflow:hidden}
.ms .hero .t1{max-width:14ch;margin:0 auto}
.ms .hero .sub{max-width:30ch;margin-left:auto;margin-right:auto}
.ms .ster{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--muted);margin-bottom:18px}.ms .ster i{font-style:normal;color:#f5a623;letter-spacing:1px;font-size:13px}.ms .ster b{font-weight:600;color:var(--ink)}
.ms .hero-tel{position:relative;margin:clamp(40px,6vw,70px) auto 0;width:min(380px,86%);padding-bottom:0}
.ms .hero-tel .pp{box-shadow:0 0 0 9px #0b0f12,0 0 0 10.5px #2a3236,0 60px 90px -50px rgb(0 0 0 / .5)}
.ms .hero-tel::after{content:"";position:absolute;left:-30%;right:-30%;bottom:0;height:26%;background:linear-gradient(180deg,transparent,var(--bg2) 70%);pointer-events:none}
.ms .hero .pp-ond{display:none}
/* zo werkt het (zwart) */
.ms .stappen{display:grid;grid-template-columns:repeat(4,1fr);gap:40px 28px;margin-top:clamp(48px,7vw,80px);text-align:left}
.ms .stp{display:flex;flex-direction:column;gap:12px}
.ms .stp .n{width:52px;height:52px;border-radius:50%;background:rgb(255 255 255 / .1);display:grid;place-items:center;color:#fff}.ms .stp .n svg{width:24px;height:24px}
.ms .stp h3{font-size:21px;font-weight:600;letter-spacing:-.01em;margin-top:6px}.ms .stp p{font-size:16px;color:var(--m2);line-height:1.45}
/* bento */
.ms .bento{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-top:clamp(40px,6vw,64px)}
.ms .tile{grid-column:span 2;background:#fff;border-radius:var(--r);padding:36px 34px;display:flex;flex-direction:column;gap:10px;min-width:0;overflow:hidden}
.ms .grijs .tile{background:#fff}.ms .wit .tile,.ms section:not(.grijs):not(.zwart) .tile{background:var(--bg2)}
.ms .tile.s3{grid-column:span 3}.ms .tile.s4{grid-column:span 4}.ms .tile.s6{grid-column:span 6}
.ms .tile h3{font-size:24px;font-weight:600;letter-spacing:-.012em;line-height:1.15}.ms .tile>p{font-size:17px;color:var(--muted);line-height:1.4;max-width:40em}
.ms .tile .vis{margin-top:20px}
.ms .zwart .tile{background:#1d1d1f;color:#f5f5f7}.ms .zwart .tile>p{color:var(--m2)}
/* mail-mock */
.ms .mail{background:#fff;border-radius:18px;box-shadow:0 2px 12px rgb(0 0 0 / .06),0 20px 40px -24px rgb(0 0 0 / .18);overflow:hidden;text-align:left}
.ms .zwart .mail,.ms .wit .mail{box-shadow:0 2px 12px rgb(0 0 0 / .06)}
.ms .mail-h{padding:14px 18px;border-bottom:1px solid #e8e8ed;display:flex;gap:12px;align-items:center;font-size:13px;color:var(--muted);letter-spacing:-.01em}
.ms .mail-h .av{width:36px;height:36px;border-radius:10px;background:var(--blauw);color:#fff;display:grid;place-items:center;flex:none}.ms .mail-h .av svg{width:17px;height:17px}
.ms .mail-h b{display:block;color:var(--ink);font-size:14px;font-weight:600}.ms .mail-h .tijd{margin-left:auto;font-size:12px}
.ms .mail-s{padding:14px 18px 0;font-weight:600;font-size:15px;color:var(--ink)}
.ms .mail-b{padding:8px 18px 18px;font-size:14px;line-height:1.5;color:#3a3a3c}.ms .mail-b p{margin:0 0 10px}
.ms .mail-b ul{margin:0 0 12px;display:flex;flex-direction:column;gap:5px}.ms .mail-b li{display:flex;gap:8px;align-items:flex-start}.ms .mail-b li svg{width:14px;height:14px;color:var(--acc);flex:none;margin-top:3px}
.ms .mail-dag{display:flex;gap:12px;align-items:center;background:var(--bg2);border-radius:12px;padding:12px 14px;margin:0 0 12px}
.ms .mail-dag .d{width:46px;height:46px;border-radius:10px;background:#fff;display:grid;place-items:center;text-align:center;line-height:1;flex:none}.ms .mail-dag .d b{display:block;font-size:19px;color:var(--acc);font-weight:600}.ms .mail-dag .d small{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.ms .mail-dag strong{display:block;font-size:14px;font-weight:600;color:var(--ink)}.ms .mail-dag span{font-size:12.5px;color:var(--muted)}
.ms .mail-k{display:flex;gap:8px;flex-wrap:wrap}.ms .mail-k a{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;border-radius:980px;font-size:13px;font-weight:500;background:var(--acc);color:#fff}.ms .mail-k a.l{background:var(--bg2);color:var(--ink)}.ms .mail-k svg{width:14px;height:14px}
/* kleine portaal-mocks in tegels */
.ms .rij{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid rgb(0 0 0 / .08);font-size:14px;text-align:left}.ms .rij:first-child{border-top:0;padding-top:0}
.ms .zwart .rij{border-color:rgb(255 255 255 / .12)}
.ms .rij .ic{width:34px;height:34px;border-radius:10px;background:#fff;color:var(--acc);display:grid;place-items:center;flex:none;box-shadow:0 1px 3px rgb(0 0 0 / .08)}.ms .rij .ic svg{width:16px;height:16px}.ms .rij .ic.goud{color:#b8860b}
.ms .zwart .rij .ic{background:rgb(255 255 255 / .1);color:#5ac8d8;box-shadow:none}
.ms .rij>div{flex:1;min-width:0}.ms .rij b{display:block;font-size:14.5px;font-weight:600}.ms .rij span.s{display:block;color:var(--muted);font-size:12.5px}.ms .zwart .rij span.s{color:var(--m2)}
.ms .rij .pijl{color:#aeaeb2;font-size:20px;line-height:1}.ms .rij .ok{width:22px;height:22px;border-radius:50%;background:#34c759;color:#fff;display:grid;place-items:center;flex:none}.ms .rij .ok svg{width:12px}
.ms .tag{display:inline-flex;align-items:center;font-size:12.5px;font-weight:600;padding:4px 10px;border-radius:980px;background:#e5f6ea;color:#1d7a3e}.ms .tag.wacht{background:#fff4d6;color:#9a6700}.ms .zwart .tag{background:rgb(52 199 89 / .18);color:#4cd964}.ms .zwart .tag.wacht{background:rgb(255 204 0 / .16);color:#ffd60a}
.ms .groot{font-size:clamp(44px,5vw,64px);font-weight:600;letter-spacing:-.03em;line-height:1;color:var(--ink)}.ms .groot small{font-size:17px;font-weight:400;color:var(--muted);letter-spacing:-.01em;margin-left:8px}.ms .zwart .groot{color:#fff}.ms .zwart .groot small{color:var(--m2)}
.ms .ring{display:flex;align-items:center;gap:16px}.ms .ring .rg{position:relative;width:72px;height:72px;flex:none;display:grid;place-items:center}.ms .ring svg{width:72px;height:72px;transform:rotate(-90deg);position:absolute;inset:0}.ms .ring .t{fill:none;stroke:rgb(0 0 0 / .08);stroke-width:8}.ms .ring .v{fill:none;stroke:var(--acc);stroke-width:8;stroke-linecap:round;stroke-dasharray:264}.ms .ring .rg b{position:relative;font-size:14px;font-weight:600}
.ms .ring>div b{display:block;font-size:17px;font-weight:600}.ms .ring>div span{font-size:14px;color:var(--muted)}
.ms .rang{display:flex;align-items:center;gap:12px;margin-top:14px;padding:12px 14px;border-radius:14px;background:#fff}.ms .rang .nr{width:40px;height:40px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:600;font-size:18px;flex:none}.ms .rang b{display:block;font-size:14.5px;font-weight:600}.ms .rang span{font-size:13px;color:var(--muted)}
.ms .tl{position:relative;padding-left:22px;text-align:left}.ms .tl::before{content:"";position:absolute;left:5px;top:10px;bottom:10px;width:2px;background:rgb(0 0 0 / .1);border-radius:2px}
.ms .tl li{position:relative;padding:8px 0}.ms .tl li::before{content:"";position:absolute;left:-21px;top:14px;width:10px;height:10px;border-radius:50%;background:var(--bg2);border:2.5px solid var(--acc)}.ms .tl li.nu::before{background:var(--acc)}
.ms .tl b{display:block;font-size:14.5px;font-weight:600}.ms .tl span.s{display:block;font-size:13px;color:var(--muted)}
.ms .vink2{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.ms .vink2 span{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;background:#fff;padding:4px 10px;border-radius:980px;box-shadow:0 1px 3px rgb(0 0 0 / .08)}.ms .vink2 svg{width:11px;color:var(--acc)}
.ms .sterren{display:flex;gap:6px;color:#f5a623}.ms .sterren svg{width:28px;height:28px}.ms .sterren svg.leeg{color:#d2d2d7}
.ms .live{display:flex;align-items:center;gap:12px;background:#fff;border-radius:14px;padding:12px 14px;text-align:left}.ms .live .pu{width:10px;height:10px;border-radius:50%;background:#34c759;box-shadow:0 0 0 0 rgb(52 199 89 / .5);animation:ms-pu 1.6s infinite;flex:none}@keyframes ms-pu{to{box-shadow:0 0 0 9px rgb(52 199 89 / 0)}}
.ms .live b{display:block;font-size:14.5px;font-weight:600}.ms .live span{font-size:13px;color:var(--muted)}
/* factuur-mock */
.ms .fact{width:min(560px,100%);margin:clamp(40px,6vw,64px) auto 0;background:#fff;border-radius:22px;box-shadow:0 2px 12px rgb(0 0 0 / .05),0 30px 60px -36px rgb(0 0 0 / .25);overflow:hidden;text-align:left}
.ms .fact-h{display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid #e8e8ed}.ms .fact-h .av{width:42px;height:42px;border-radius:12px;background:var(--blauw);color:#fff;display:grid;place-items:center;flex:none}.ms .fact-h .av svg{width:20px;height:20px}
.ms .fact-h b{display:block;font-size:16px;font-weight:600}.ms .fact-h small{font-size:13px;color:var(--muted)}.ms .fact-h>div{flex:1}
.ms .fact-r{display:flex;justify-content:space-between;gap:12px;padding:13px 24px;border-top:1px solid #f0f0f3;font-size:15px}.ms .fact-r:nth-of-type(2){border-top:0}.ms .fact-r.kort b{color:#1d7a3e}.ms .fact-r.tot{font-weight:600;font-size:17px;border-top:1px solid #e8e8ed}
.ms .fact-ok{display:flex;align-items:center;gap:10px;padding:14px 24px;background:#e5f6ea;color:#1d7a3e;font-weight:500;font-size:14px}.ms .fact-ok svg{width:16px;height:16px}
/* credits (zwart) */
.ms .cijfers{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:clamp(48px,7vw,80px);text-align:center}
.ms .cf b{display:block;font-size:clamp(48px,6vw,76px);font-weight:600;letter-spacing:-.03em;line-height:1;background:linear-gradient(135deg,#7fe0ec,#2aa3b3 60%,#5ac8d8);-webkit-background-clip:text;background-clip:text;color:transparent}
.ms .cf h3{font-size:19px;font-weight:600;margin-top:14px}.ms .cf p{font-size:15px;color:var(--m2);margin-top:6px}
/* calculator */
.ms #ms-calc{min-height:600px;margin-top:clamp(36px,5vw,56px)}.ms #ms-calc iframe{display:block;width:1px;min-width:100%;border:0;background:transparent}
/* zakelijk */
.ms .tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}.ms .tags span{background:#fff;border-radius:980px;padding:6px 13px;font-size:14px;box-shadow:0 1px 3px rgb(0 0 0 / .08)}
.ms .lijst{display:flex;flex-direction:column;gap:12px;text-align:left}.ms .lijst li{display:flex;gap:12px;align-items:flex-start;font-size:15px}.ms .lijst li i{width:30px;height:30px;border-radius:9px;background:#fff;color:var(--acc);display:grid;place-items:center;flex:none;font-style:normal;box-shadow:0 1px 3px rgb(0 0 0 / .08)}.ms .lijst li i svg{width:15px}.ms .lijst b{display:block;font-weight:600}.ms .lijst span{color:var(--muted);font-size:14px}
/* faq */
.ms .faq{max-width:760px;margin:clamp(36px,5vw,56px) auto 0;border-top:1px solid var(--line)}
.ms details{border-bottom:1px solid var(--line)}
.ms summary{list-style:none;cursor:pointer;padding:22px 0;font-weight:600;font-size:clamp(17px,1.6vw,21px);letter-spacing:-.01em;display:flex;justify-content:space-between;gap:16px;align-items:center}
.ms summary::-webkit-details-marker{display:none}
.ms summary::after{content:"";width:12px;height:12px;border-right:2px solid var(--ink);border-bottom:2px solid var(--ink);transform:rotate(45deg);flex:none;margin-right:6px;transition:transform .25s}
.ms details[open] summary::after{transform:rotate(-135deg)}
.ms details p{color:var(--muted);padding:0 0 24px;font-size:17px;max-width:62ch}
/* contact + voet */
.ms .ck{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:28px}
.ms footer{padding:20px 0 40px;color:var(--muted);font-size:12px;letter-spacing:-.01em;background:var(--bg2)}
.ms footer .in{display:flex;flex-wrap:wrap;gap:8px 22px;justify-content:space-between;border-top:1px solid var(--line);padding-top:16px}.ms footer a:hover{text-decoration:underline}
/* ons werk (apple-grid) */
.ms .wk-filter{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:26px 0 0}.ms .wk-filter button{border:1px solid var(--line);background:#fff;color:var(--ink);font:400 14px inherit;font-family:inherit;padding:8px 16px;border-radius:980px;cursor:pointer}.ms .wk-filter button[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.ms .wk-grid{columns:3;column-gap:16px;margin-top:clamp(32px,5vw,48px)}
.ms .wk-it{break-inside:avoid;margin:0 0 16px;position:relative;border-radius:18px;overflow:hidden;background:#e8e8ed;cursor:zoom-in}
.ms .wk-it img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s}.ms .wk-it:hover img{transform:scale(1.03)}
.ms .wk-it figcaption{position:absolute;left:0;right:0;bottom:0;padding:34px 16px 14px;color:#fff;background:linear-gradient(180deg,transparent,rgb(0 0 0 / .6));display:flex;flex-direction:column;gap:1px;pointer-events:none}.ms .wk-it figcaption:empty{display:none}
.ms .wk-it b{font-size:15px;font-weight:600}.ms .wk-it span{font-size:13px;opacity:.85}
.wk-lb{position:fixed;inset:0;z-index:99999;background:rgb(0 0 0 / .92);display:none;align-items:center;justify-content:center;padding:20px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}.wk-lb.aan{display:flex}
.wk-lb figure{margin:0;max-width:min(1400px,100%);max-height:100%;display:flex;flex-direction:column;align-items:center;gap:10px}.wk-lb img{max-width:100%;max-height:calc(100vh - 90px);border-radius:14px}
.wk-lb figcaption{color:#fff;text-align:center;font-family:-apple-system,Inter,sans-serif}.wk-lb figcaption b{display:block;font-size:16px}.wk-lb figcaption span{font-size:13px;opacity:.75}
.wk-lb button{position:absolute;background:rgb(255 255 255 / .12);color:#fff;border:0;width:44px;height:44px;border-radius:50%;font-size:26px;line-height:1;cursor:pointer;display:grid;place-items:center}
.wk-lb .wk-x{top:16px;right:16px}.wk-lb .wk-p{left:16px;top:50%;transform:translateY(-50%)}.wk-lb .wk-n{right:16px;top:50%;transform:translateY(-50%)}
/* responsive */
@media (max-width:1000px){.ms .stappen{grid-template-columns:repeat(2,1fr)}.ms .cijfers{grid-template-columns:repeat(2,1fr);gap:40px 24px}.ms .tile,.ms .tile.s3,.ms .tile.s4{grid-column:span 3}.ms .tile.s6{grid-column:span 6}}
@media (max-width:900px){.ms .wk-grid{columns:2}}
@media (max-width:640px){.ms .in,.ms .in.w{width:min(100% - 32px,1024px)}.ms .stappen,.ms .cijfers{grid-template-columns:1fr}.ms .tile,.ms .tile.s3,.ms .tile.s4,.ms .tile.s6{grid-column:span 6}.ms .tile{padding:28px 24px;border-radius:22px}.ms .wk-grid{columns:1}.wk-lb .wk-p,.wk-lb .wk-n{top:auto;bottom:16px;transform:none}.ms .hero-tel{width:min(300px,80%)}.ms .lnks{flex-direction:column;align-items:center;gap:12px}.ms .ck .pil{width:100%}}
@media (prefers-reduced-motion:reduce){.ms *{animation:none!important;transition:none!important}}
.ms a:focus-visible,.ms button:focus-visible,.ms summary:focus-visible{outline:2px solid var(--acc);outline-offset:3px;border-radius:6px}
/* ---- voorbeeld klantportaal (zoals het echt is) met live volgen ---- */
.ms .pp{position:relative;max-width:380px;margin:0 auto;background:#f3f6f7;border-radius:46px;padding:0 0 18px;overflow:hidden;box-shadow:0 0 0 9px #11181c,0 0 0 10.5px #3a4448,0 50px 80px -40px rgb(10 40 50 / .6),0 20px 40px -24px rgb(10 40 50 / .35)}
.ms .pp-sb{display:flex;align-items:center;justify-content:space-between;padding:14px 28px 4px;background:#fff;font-size:14px;color:#11181c}
.ms .pp-sb b{font-weight:700;letter-spacing:-.01em;width:60px}.ms .pp-sb i{width:96px;height:28px;border-radius:20px;background:#11181c}
.ms .pp-sb span{display:flex;gap:6px;align-items:center;width:60px;justify-content:flex-end}.ms .pp-sb svg{height:11px;fill:currentColor}.ms .pp-sb svg:first-child{width:16px}.ms .pp-sb svg:last-child{width:24px}
.ms .pp-top{display:flex;align-items:center;gap:12px;padding:10px 18px 12px;background:#fff;border-bottom:1px solid var(--line);font-size:14.5px;font-weight:500;color:var(--muted)}
.ms .pp-top img,.ms .pp-lg{width:38px;height:38px;border-radius:50%;object-fit:contain;flex:none}
.ms .pp-lg{display:grid;place-items:center;background:var(--soft);color:var(--b2)}.ms .pp-lg svg{width:18px}
.ms .pp-top>svg{width:22px;height:22px;margin-left:auto;color:var(--ink)}
.ms .pp-main{padding:14px 12px 0;display:flex;flex-direction:column;gap:12px}
.ms .pp-hero{position:relative;overflow:hidden;border-radius:22px;padding:18px 18px 18px;color:#fff;background:radial-gradient(120% 140% at 100% 0%,#2aa3b3 0%,transparent 55%),linear-gradient(135deg,#0f5f6e,#137a8a 55%,#1d5a74);box-shadow:0 24px 50px -28px rgb(15 70 85 / .7)}
.ms .pp-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 120%,rgb(255 255 255 / .14),transparent 40%),repeating-linear-gradient(115deg,rgb(255 255 255 / .035) 0 2px,transparent 2px 26px);pointer-events:none}
.ms .pp-hero>*{position:relative}
.ms .pp-hk{display:flex;gap:10px;align-items:flex-start}.ms .pp-hk>div:first-child{flex:1;min-width:0}.ms .pp-hk>div:first-child{flex:1;min-width:0}
.ms .pp-k{margin:0;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgb(255 255 255 / .8);display:flex;align-items:center;gap:8px}
.ms .pp-puls{width:8px;height:8px;border-radius:50%;background:#9ff0d2;box-shadow:0 0 0 0 rgb(159 240 210 / .6);animation:ppPuls 1.8s infinite}
@keyframes ppPuls{70%{box-shadow:0 0 0 8px rgb(159 240 210 / 0)}100%{box-shadow:0 0 0 0 rgb(159 240 210 / 0)}}
.ms .pp-adr{display:inline-flex;align-items:center;gap:6px;margin:10px 0 8px;padding:5px 11px 5px 8px;border-radius:999px;background:rgb(255 255 255 / .14);box-shadow:inset 0 0 0 1px rgb(255 255 255 / .22);font-size:12.5px;font-weight:600;max-width:100%;white-space:nowrap;overflow:hidden}
.ms .pp-adr svg{width:15px;height:15px;flex:none;opacity:.9}.ms .pp-adr>span{overflow:hidden;text-overflow:ellipsis}.ms .pp-adr em{font-style:normal;font-weight:500;opacity:.8}
.ms .pp-hero h3{margin:0;font-size:21px;font-weight:700;letter-spacing:-.03em;line-height:1.1;color:#fff}
.ms .pp-s{margin:8px 0 0;font-size:14px;color:rgb(255 255 255 / .82)}
.ms .pp-ring{position:relative;width:72px;height:72px;flex:none}
.ms .pp-ring svg{width:100%;height:100%;transform:rotate(-90deg)}.ms .pp-ring .t{fill:none;stroke:rgb(255 255 255 / .16);stroke-width:8}.ms .pp-ring .v{fill:none;stroke:#fff;stroke-width:8}
.ms .pp-ring>span{position:absolute;inset:0;display:grid;place-content:center;text-align:center;line-height:1}
.ms .pp-ring b{font-size:24px;font-weight:700;letter-spacing:-.04em}.ms .pp-ring small{font-size:10.5px;color:rgb(255 255 255 / .75);margin-top:2px;font-weight:600}
.ms .pp-lv{position:relative;border-radius:22px;overflow:hidden;background:#fff;border:1px solid var(--line);box-shadow:0 20px 44px -30px rgba(8,40,48,.55)}
.ms .pp-map{position:relative;height:210px;background:#e8eef0 linear-gradient(110deg,#e8eef0 30%,#f3f6f7 50%,#e8eef0 70%);overflow:hidden}
.ms .pp-kaart{position:absolute;inset:0;width:100%;height:100%;display:block}
.ms .pp-ov{position:absolute;inset:0;z-index:500;pointer-events:none}
.ms .pp-lijn{position:absolute;height:0;border-top:3.5px dotted rgb(19 122 138 / .85);transform-origin:0 50%}
.ms .pp-huis{position:absolute;display:grid;place-items:center;width:38px;height:38px;margin:-42px 0 0 -19px;border-radius:14px 14px 14px 4px;transform:rotate(-45deg);background:#fff;box-shadow:0 8px 18px -6px rgba(8,40,48,.45),0 0 0 1px rgba(8,40,48,.06)}
.ms .pp-huis svg{width:19px;height:19px;transform:rotate(45deg);color:#137a8a}
.ms .pp-auto{position:absolute;width:60px;height:60px;margin:-30px 0 0 -30px}
.ms .pp-pl{position:absolute;inset:10px;border-radius:50%;background:rgb(19 122 138 / .22);animation:ppRing 2s ease-out infinite}
@keyframes ppRing{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.7);opacity:0}}
.ms .pp-rot{position:absolute;inset:0;display:grid;place-items:center;transition:transform .6s ease}
.ms .pp-rot svg{width:28px;height:50px;filter:drop-shadow(0 5px 5px rgba(8,40,48,.38)) drop-shadow(0 0 1px rgba(8,40,48,.4))}
.ms .pp-info{display:flex;align-items:center;gap:12px;padding:14px 16px;border-top:1px solid var(--line)}
.ms .pp-car{width:54px;height:44px;flex:none;border-radius:14px;background:linear-gradient(180deg,#eef6f7,#e3f2f4);display:grid;place-items:center}.ms .pp-car svg{width:44px;height:28px}
.ms .pp-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.ms .pp-st{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#178a5e}
.ms .pp-st i{width:8px;height:8px;border-radius:50%;background:#22a46c;animation:ppDot 1.8s ease-out infinite}
@keyframes ppDot{0%{box-shadow:0 0 0 0 rgb(34 164 108 / .5)}80%,100%{box-shadow:0 0 0 7px rgb(34 164 108 / 0)}}
.ms .pp-tx b{font-size:15px;font-weight:600;letter-spacing:-.01em;color:var(--ink);line-height:1.25}
.ms .pp-tx span{font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ms .pp-eta{flex:none;text-align:right;display:flex;flex-direction:column;gap:1px;padding-left:12px;border-left:1px solid var(--line)}
.ms .pp-eta small{font-size:11px;color:var(--muted);font-weight:600}.ms .pp-eta b{font-size:20px;font-weight:600;letter-spacing:-.03em;color:#137a8a;font-variant-numeric:tabular-nums}
.ms .pp-ond{text-align:center;font-size:12.5px;color:var(--muted);margin-top:22px}
@media (max-width:420px){.ms .pp-adr em{display:none}.ms .pp{border-radius:40px}.ms .pp-hero h3{font-size:21px}}

/* ---- cinematische hero: raam dat schoon wordt getrokken ---- */
.ms .hero{position:relative;min-height:min(92vh,900px);padding:0;background:#0b1114;color:#fff;overflow:hidden;display:flex;align-items:flex-end;text-align:left}
.ms .hv{position:absolute;inset:0;overflow:hidden}
.ms .hv-bg,.ms .hv-img{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;animation:hvZoom 24s ease-in-out infinite alternate}
.ms .hv-bg{display:block}.ms .hv-img{display:none}.ms .hv.foto .hv-img{display:block}.ms .hv.foto .hv-bg{display:none}
@keyframes hvZoom{to{transform:scale(1.07) translate(-1%,-.5%)}}
.ms .hv-vuil{position:absolute;inset:0;-webkit-backdrop-filter:blur(7px) saturate(.55) brightness(.9);backdrop-filter:blur(7px) saturate(.55) brightness(.9);background:radial-gradient(60% 50% at 20% 30%,rgb(255 255 255 / .22),transparent 70%),radial-gradient(40% 60% at 75% 60%,rgb(120 130 120 / .28),transparent 70%),radial-gradient(30% 30% at 50% 85%,rgb(255 255 255 / .18),transparent 70%),rgb(190 200 200 / .28);clip-path:inset(0 0 0 0);animation:hvVeeg 11s cubic-bezier(.5,0,.3,1) infinite}
@keyframes hvVeeg{0%{clip-path:inset(0 0 0 0)}8%{clip-path:inset(0 0 0 0)}48%{clip-path:inset(0 0 0 100%)}86%{clip-path:inset(0 0 0 100%);opacity:1}88%{opacity:0}99%{clip-path:inset(0 0 0 0);opacity:0}100%{clip-path:inset(0 0 0 0);opacity:1}}
.ms .hv-trek{position:absolute;top:-6%;bottom:-6%;left:0;width:0;animation:hvTrek 11s cubic-bezier(.5,0,.3,1) infinite}
@keyframes hvTrek{0%,8%{left:0;opacity:0}9%{opacity:1}48%{left:100%;opacity:1}50%{opacity:0}100%{left:100%;opacity:0}}
.ms .hv-trek i{position:absolute;top:0;bottom:0;left:-10px;width:12px;background:linear-gradient(90deg,transparent,rgb(255 255 255 / .55) 40%,rgb(255 255 255 / .9) 55%,rgb(230 240 245 / .3));filter:blur(1px)}
.ms .hv-trek b{position:absolute;top:0;bottom:0;left:-3px;width:5px;background:linear-gradient(180deg,#2b3338,#0e1417);border-radius:3px;box-shadow:0 0 18px rgb(0 0 0 / .4)}
.ms .hv-trek s{position:absolute;left:-26px;top:50%;width:52px;height:120px;margin-top:-60px;border-radius:10px;background:linear-gradient(90deg,#1b2226,#3a444a 50%,#1b2226);box-shadow:0 10px 30px rgb(0 0 0 / .45);text-decoration:none}
.ms .hv-trek s::after{content:"";position:absolute;left:14px;right:14px;top:-14px;height:14px;border-radius:6px 6px 0 0;background:#c9ced1}
.ms .hv-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgb(0 0 0 / .18),transparent 30%,transparent 55%,rgb(0 0 0 / .55) 100%)}
.ms .hv-ui{position:relative;width:min(1200px,100% - 44px);margin:0 auto;padding:0 0 clamp(36px,6vw,64px);display:flex;align-items:flex-end;justify-content:space-between;gap:28px;flex-wrap:wrap}
.ms .hv-ui .t1{color:#fff;max-width:12ch;margin:0;text-shadow:0 2px 24px rgb(0 0 0 / .25)}
.ms .hv-ui .sub{color:rgb(255 255 255 / .92);margin:12px 0 0;max-width:34ch}
.ms .hv-ui .ster{color:rgb(255 255 255 / .8);margin-bottom:14px}.ms .hv-ui .ster b{color:#fff}
.ms .hv-knop{display:flex;gap:12px;flex-wrap:wrap}
.ms .hv-knop .pil{background:#fff;color:#000}.ms .hv-knop .pil:hover{background:#e8e8ed}.ms .hv-knop .pil.glas{background:rgb(255 255 255 / .14);color:#fff;box-shadow:inset 0 0 0 1px rgb(255 255 255 / .55);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.ms .hv-knop .pil.glas:hover{background:rgb(255 255 255 / .26)}
.ms .pauze{position:absolute;right:22px;top:66px;z-index:5;width:40px;height:40px;border-radius:50%;background:rgb(255 255 255 / .18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:0;color:#fff;cursor:pointer;display:grid;place-items:center}.ms .pauze svg{width:16px;height:16px}.ms .pauze .sp{display:none}.ms.stil .pauze .sp{display:block}.ms.stil .pauze .pz{display:none}
.ms.stil .hv *,.ms.stil .nacht *,.ms.stil .story *{animation-play-state:paused!important}
.ms .hero .pp-ond{display:none}
@media (max-width:760px){.ms .hero{min-height:min(88vh,760px)}.ms .hv-ui{padding-bottom:28px}.ms .hv-knop{width:100%}.ms .hv-knop .pil{flex:1}.ms .hv-trek s{height:90px;margin-top:-45px;width:40px;left:-20px}.ms .pauze{top:60px;right:14px}}
/* ---- live (zwart) met telefoon ---- */
.ms .live-sec{padding-bottom:0;overflow:hidden}
.ms .hero-tel{position:relative;margin:clamp(40px,6vw,70px) auto 0;width:min(380px,86%)}
.ms .hero-tel .pp{box-shadow:0 0 0 9px #1a2024,0 0 0 10.5px #3a4448,0 -30px 120px -40px rgb(90 200 216 / .35)}
.ms .hero-tel::after{content:"";position:absolute;left:-30%;right:-30%;bottom:0;height:26%;background:linear-gradient(180deg,transparent,#000 70%);pointer-events:none}
/* ---- scroll-reveal (alleen met JS, nooit zonder) ---- */
.ms.js .rv{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.ms.js .rv.zicht{opacity:1;transform:none}
.ms.js .bento .rv:nth-child(2){transition-delay:.08s}.ms.js .bento .rv:nth-child(3){transition-delay:.16s}.ms.js .bento .rv:nth-child(4){transition-delay:.08s}.ms.js .bento .rv:nth-child(5){transition-delay:.16s}.ms.js .bento .rv:nth-child(6){transition-delay:.24s}
.ms.js .cijfers .rv:nth-child(2){transition-delay:.1s}.ms.js .cijfers .rv:nth-child(3){transition-delay:.2s}.ms.js .cijfers .rv:nth-child(4){transition-delay:.3s}
.ms.js .stappen .rv:nth-child(2){transition-delay:.1s}.ms.js .stappen .rv:nth-child(3){transition-delay:.2s}.ms.js .stappen .rv:nth-child(4){transition-delay:.3s}
@media (prefers-reduced-motion:reduce){.ms.js .rv{opacity:1;transform:none;transition:none}}
/* ---- avondroute: busje rijdt langs de huizen ---- */
.ms .nacht{position:relative;padding:0;background:#000;color:#f5f5f7;overflow:hidden}
.ms .nacht .in{position:relative;z-index:2;padding:clamp(72px,11vw,130px) 0 0}
.ms .n-scene{position:relative;height:clamp(260px,38vw,440px);margin-top:clamp(24px,4vw,48px);background:linear-gradient(180deg,#000 0%,#0a1220 35%,#1a2a44 70%,#2a3e5c 100%)}
.ms .n-ster{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;opacity:.6;animation:nTwink 3s ease-in-out infinite alternate}
@keyframes nTwink{to{opacity:.15}}
.ms .n-maan{position:absolute;right:12%;top:14%;width:44px;height:44px;border-radius:50%;background:#f5f1e3;box-shadow:0 0 40px 10px rgb(245 241 227 / .18)}
.ms .n-grond{position:absolute;left:0;right:0;bottom:0;height:22%;background:#06090d}
.ms .n-weg{position:absolute;left:0;right:0;bottom:8%;height:12%;background:#11161c;border-top:1px solid rgb(255 255 255 / .08)}
.ms .n-weg::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:repeating-linear-gradient(90deg,rgb(255 255 255 / .35) 0 40px,transparent 40px 80px)}
.ms .n-huis{position:absolute;bottom:22%;transform:translateX(-50%);width:clamp(70px,9vw,120px)}
.ms .n-huis svg{width:100%;height:auto;display:block;overflow:visible}
.ms .n-huis .dak{fill:#0d1419}.ms .n-huis .muur{fill:#141c23}.ms .n-huis .raam{fill:#1c2730;transition:fill .4s}
.ms .n-huis .raam{animation:nLicht 16s linear infinite;animation-delay:var(--d)}
@keyframes nLicht{0%,100%{fill:#1c2730}6%{fill:#1c2730}9%{fill:#ffe7a8;filter:drop-shadow(0 0 10px rgb(255 231 168 / .7))}60%{fill:#ffe7a8;filter:drop-shadow(0 0 10px rgb(255 231 168 / .5))}70%{fill:#1c2730;filter:none}}
.ms .n-vink{position:absolute;left:50%;top:-18px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:#34c759;color:#fff;display:grid;place-items:center;opacity:0;transform:scale(.5);animation:nVink 16s linear infinite;animation-delay:var(--d)}.ms .n-vink svg{width:13px}
@keyframes nVink{0%,9%{opacity:0;transform:scale(.5) translateY(6px)}11%{opacity:1;transform:scale(1.1)}13%{transform:scale(1)}60%{opacity:1}68%{opacity:0;transform:scale(.8)}100%{opacity:0}}
.ms .n-bus{position:absolute;bottom:13%;left:-12%;width:clamp(90px,10vw,130px);animation:nRij 16s linear infinite}
@keyframes nRij{0%{left:-12%}100%{left:108%}}
.ms .n-bus svg{width:100%;height:auto;display:block;filter:drop-shadow(0 8px 10px rgb(0 0 0 / .6))}
.ms .n-bus .rv-wiel{transform-box:fill-box;transform-origin:center;animation:msWiel .5s linear infinite}@keyframes msWiel{to{transform:rotate(360deg)}}
.ms .n-licht{position:absolute;right:-180%;top:30%;width:190%;height:70%;background:linear-gradient(90deg,rgb(255 240 200 / .35),transparent 80%);clip-path:polygon(0 35%,100% 0,100% 100%,0 65%);filter:blur(4px);pointer-events:none}
.ms .n-ond{position:absolute;left:0;right:0;bottom:0;height:60px;background:linear-gradient(180deg,transparent,#000);z-index:1}
/* ---- fotoverhaal uit de galerij ---- */
.ms .story{position:relative;padding:0;background:#000;color:#fff;overflow:hidden;min-height:min(86vh,820px);display:flex;align-items:flex-end}
.ms .story .st-img{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;opacity:0;transition:opacity 1.4s ease}.ms .story .st-img.aan{opacity:1;animation:hvZoom 18s ease-in-out infinite alternate}
.ms .story .st-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgb(0 0 0 / .1),transparent 40%,rgb(0 0 0 / .65))}
.ms .story .in{position:relative;padding:0 0 clamp(36px,6vw,64px);display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap}
.ms .story .t2{color:#fff;max-width:16ch;text-shadow:0 2px 24px rgb(0 0 0 / .3)}.ms .story .ld{color:rgb(255 255 255 / .85)}
.ms .st-cap{font-size:14px;color:rgb(255 255 255 / .8)}.ms .st-cap b{display:block;font-size:17px;color:#fff;font-weight:600}
.ms .st-dots{display:flex;gap:8px;margin-top:14px}.ms .st-dots i{width:8px;height:8px;border-radius:50%;background:rgb(255 255 255 / .35)}.ms .st-dots i.aan{background:#fff}

`;

const HV_SCENE='<svg class="hv-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="hvs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb0cf"/><stop offset=".55" stop-color="#cfe6f0"/><stop offset="1" stop-color="#f3f1ea"/></linearGradient><radialGradient id="hvz" cx=".72" cy=".22" r=".35"><stop offset="0" stop-color="#fff8e0" stop-opacity=".95"/><stop offset=".3" stop-color="#fff2c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="hvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa86a"/><stop offset="1" stop-color="#4f7a44"/></linearGradient><filter id="hvb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter></defs><rect width="1600" height="900" fill="url(#hvs)"/><rect width="1600" height="900" fill="url(#hvz)"/><g fill="#fff" opacity=".75" filter="url(#hvb)"><ellipse cx="300" cy="230" rx="220" ry="60"/><ellipse cx="520" cy="200" rx="160" ry="48"/><ellipse cx="1150" cy="300" rx="260" ry="54"/><ellipse cx="1350" cy="270" rx="140" ry="40"/></g><path d="M0 650C200 600 380 640 560 610S900 560 1100 600s320 10 500 30v270H0z" fill="#9db9a0" opacity=".55"/><g fill="#3c5a66" opacity=".55"><path d="M80 690V560l60-50 60 50v130z"/><path d="M260 690V590l45-40 45 40v100z"/><path d="M1240 690V570l70-55 70 55v120z"/><path d="M1420 690V600l50-42 50 42v90z"/></g><g fill="#2f4a3a" opacity=".6"><circle cx="420" cy="600" r="55"/><rect x="414" y="640" width="12" height="60"/><circle cx="980" cy="590" r="70"/><rect x="972" y="640" width="14" height="70"/><circle cx="1120" cy="620" r="45"/><rect x="1115" y="650" width="10" height="50"/></g><path d="M0 700C300 680 600 720 900 700s500-20 700-10v210H0z" fill="url(#hvg)"/><path d="M0 820h1600v80H0z" fill="#8a8f86" opacity=".6"/></svg>';
const N_HUIS='<svg viewBox="0 0 100 90" aria-hidden="true"><path class="dak" d="M-4 42 50 4l54 38z"/><rect class="muur" x="8" y="40" width="84" height="50"/><rect class="raam" x="20" y="50" width="20" height="20" rx="2"/><rect class="raam" x="60" y="50" width="20" height="20" rx="2"/><rect class="deur" x="44" y="64" width="12" height="26" fill="#0a0f13"/></svg>';
const PP_AUTO='<svg aria-hidden="true" viewBox="0 0 64 40"><defs><linearGradient id="ppzb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26adc2"/><stop offset="1" stop-color="#11778c"/></linearGradient><linearGradient id="ppzg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eafcff"/><stop offset="1" stop-color="#86c9d5"/></linearGradient></defs><g stroke="#9fb3ba" stroke-width="1.4" stroke-linecap="round"><path d="M8 7.5H40"/><path d="M11 7.5V4.8M17 7.5V4.8M23 7.5V4.8M29 7.5V4.8M35 7.5V4.8"/><path d="M8 4.8H40"/></g><path d="M5 12a3.5 3.5 0 0 1 3.5-3.5H40c2 0 3.6.8 4.8 2.3l7.4 9.2 5.6 1.8c1.6.5 2.7 2 2.7 3.7V30a2 2 0 0 1-2 2H5z" fill="url(#ppzb)"/><path d="M42.5 12.5h1.6c.8 0 1.5.4 2 1l5.2 6.8H42.5z" fill="url(#ppzg)" stroke="#0b4552" stroke-width=".8"/><rect x="30" y="12.5" width="9.5" height="7.6" rx="1.4" fill="url(#ppzg)" stroke="#0b4552" stroke-width=".8"/><path d="M5 23.5h55" stroke="#0e6476" stroke-width=".8" opacity=".6"/><path d="M7 20.5h22" stroke="#7fe0ee" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><rect x="57" y="23.5" width="3.2" height="2.2" rx="1" fill="#fffbe0"/><circle cx="16" cy="32" r="5.6" fill="#1d2a30"/><circle cx="16" cy="32" r="2.4" fill="#c8d3d7"/><circle cx="49" cy="32" r="5.6" fill="#1d2a30"/><circle cx="49" cy="32" r="2.4" fill="#c8d3d7"/></svg>',PP_BUS='<svg aria-hidden="true" viewBox="0 0 40 72"><defs><linearGradient id="pplvb" x1="0" x2="1"><stop offset="0" stop-color="#0d5a6b"/><stop offset=".22" stop-color="#1b93a8"/><stop offset=".5" stop-color="#22a6bc"/><stop offset=".78" stop-color="#1b93a8"/><stop offset="1" stop-color="#0d5a6b"/></linearGradient><linearGradient id="pplvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9fbff"/><stop offset="1" stop-color="#7cc3d0"/></linearGradient><linearGradient id="pplvr" x1="0" x2="1"><stop offset="0" stop-color="#1688a0"/><stop offset=".5" stop-color="#2bb3c8"/><stop offset="1" stop-color="#1688a0"/></linearGradient></defs><ellipse cx="5.2" cy="18" rx="2.4" ry="1.6" fill="#0b4552"/><ellipse cx="34.8" cy="18" rx="2.4" ry="1.6" fill="#0b4552"/><rect x="6" y="3" width="28" height="66" rx="9" fill="url(#pplvb)"/><path d="M9 7.5Q20 2.8 31 7.5" stroke="#5fd2e3" stroke-width="1.2" fill="none" opacity=".8"/><rect x="9.5" y="4.2" width="4.5" height="2" rx="1" fill="#fffbe0"/><rect x="26" y="4.2" width="4.5" height="2" rx="1" fill="#fffbe0"/><path d="M9.2 15.5Q20 11.8 30.8 15.5L29.2 25H10.8z" fill="url(#pplvg)" stroke="#0b4552" stroke-width=".9"/><path d="M12 16.6Q16 15 19 14.8L18 18.5Q15 18.7 12.6 19.6z" fill="#fff" opacity=".7"/><rect x="9.8" y="27" width="20.4" height="38" rx="4.2" fill="url(#pplvr)"/><g stroke="#eef4f6" stroke-linecap="round"><path d="M15 29.5V62.5M25 29.5V62.5" stroke-width="1.7"/><path d="M15 33.5H25M15 38.5H25M15 43.5H25M15 48.5H25M15 53.5H25M15 58.5H25" stroke-width="1.2"/></g><rect x="11" y="66" width="18" height="1.6" rx=".8" fill="#ff6b5e" opacity=".9"/></svg>';
const PP_KAART='<svg class="pp-kaart" viewBox="0 0 360 210" preserveAspectRatio="none" aria-hidden="true"><rect width="360" height="210" fill="#eef0ec"/><path d="M262 128H352V202H262z" fill="#d9e8d3"/><circle cx="300" cy="160" r="5" fill="#cfe1c8"/><circle cx="325" cy="182" r="7" fill="#cfe1c8"/><circle cx="285" cy="186" r="4" fill="#cfe1c8"/><path d="M0 62C30 58 50 70 80 64" fill="none" stroke="#cfe0e8" stroke-width="7" stroke-linecap="round"/><g fill="#e2e2dd" stroke="#d3d3cc" stroke-width=".6"><rect x="2.0" y="0.2" width="9" height="8" rx="1"/><rect x="0.2" y="13.5" width="10" height="9" rx="1"/><rect x="0.2" y="24.3" width="11" height="8" rx="1"/><rect x="1.9" y="37.7" width="8" height="7" rx="1"/><rect x="2.9" y="48.1" width="11" height="7" rx="1"/><rect x="0.4" y="72.9" width="9" height="9" rx="1"/><rect x="0.3" y="98.1" width="9" height="8" rx="1"/><rect x="1.7" y="133.6" width="9" height="7" rx="1"/><rect x="2.1" y="205.8" width="10" height="8" rx="1"/><rect x="15.5" y="2.8" width="11" height="7" rx="1"/><rect x="15.2" y="12.9" width="8" height="7" rx="1"/><rect x="15.1" y="26.7" width="11" height="8" rx="1"/><rect x="13.5" y="36.4" width="11" height="8" rx="1"/><rect x="14.2" y="72.8" width="9" height="8" rx="1"/><rect x="13.8" y="85.2" width="11" height="9" rx="1"/><rect x="13.5" y="96.5" width="11" height="7" rx="1"/><rect x="15.6" y="134.9" width="9" height="9" rx="1"/><rect x="15.7" y="146.3" width="8" height="8" rx="1"/><rect x="14.3" y="192.3" width="8" height="7" rx="1"/><rect x="14.7" y="205.6" width="8" height="7" rx="1"/><rect x="27.8" y="12.4" width="8" height="7" rx="1"/><rect x="27.1" y="24.4" width="10" height="9" rx="1"/><rect x="28.5" y="72.5" width="10" height="8" rx="1"/><rect x="28.1" y="86.7" width="10" height="7" rx="1"/><rect x="27.6" y="133.5" width="9" height="9" rx="1"/><rect x="28.5" y="146.2" width="9" height="7" rx="1"/><rect x="28.2" y="159.0" width="11" height="8" rx="1"/><rect x="39.7" y="0.7" width="10" height="7" rx="1"/><rect x="40.9" y="14.7" width="9" height="8" rx="1"/><rect x="39.3" y="38.0" width="10" height="9" rx="1"/><rect x="41.4" y="85.0" width="9" height="8" rx="1"/><rect x="39.5" y="134.7" width="9" height="7" rx="1"/><rect x="41.8" y="156.5" width="11" height="9" rx="1"/><rect x="40.5" y="206.3" width="9" height="8" rx="1"/><rect x="52.2" y="2.2" width="11" height="7" rx="1"/><rect x="52.4" y="24.5" width="11" height="9" rx="1"/><rect x="53.8" y="38.3" width="11" height="7" rx="1"/><rect x="53.5" y="73.7" width="8" height="7" rx="1"/><rect x="53.6" y="134.6" width="9" height="9" rx="1"/><rect x="52.2" y="194.0" width="9" height="8" rx="1"/><rect x="65.8" y="12.4" width="10" height="7" rx="1"/><rect x="67.7" y="24.5" width="8" height="8" rx="1"/><rect x="67.1" y="39.0" width="9" height="7" rx="1"/><rect x="66.1" y="48.3" width="11" height="7" rx="1"/><rect x="67.9" y="72.3" width="10" height="9" rx="1"/><rect x="65.8" y="96.1" width="8" height="7" rx="1"/><rect x="66.0" y="144.8" width="11" height="9" rx="1"/><rect x="65.8" y="192.4" width="9" height="7" rx="1"/><rect x="66.9" y="204.1" width="11" height="8" rx="1"/><rect x="106.0" y="2.1" width="10" height="8" rx="1"/><rect x="105.4" y="13.5" width="9" height="7" rx="1"/><rect x="106.8" y="60.1" width="10" height="7" rx="1"/><rect x="105.2" y="74.7" width="11" height="8" rx="1"/><rect x="106.2" y="96.8" width="8" height="7" rx="1"/><rect x="104.0" y="133.5" width="8" height="7" rx="1"/><rect x="104.4" y="145.0" width="10" height="9" rx="1"/><rect x="105.0" y="157.0" width="10" height="7" rx="1"/><rect x="106.6" y="192.8" width="11" height="8" rx="1"/><rect x="106.8" y="204.7" width="10" height="9" rx="1"/><rect x="119.3" y="2.4" width="10" height="7" rx="1"/><rect x="118.2" y="14.6" width="8" height="9" rx="1"/><rect x="117.2" y="26.8" width="9" height="9" rx="1"/><rect x="118.2" y="60.8" width="9" height="8" rx="1"/><rect x="119.0" y="72.9" width="10" height="8" rx="1"/><rect x="117.5" y="84.5" width="11" height="7" rx="1"/><rect x="117.7" y="98.7" width="11" height="9" rx="1"/><rect x="117.7" y="132.8" width="8" height="8" rx="1"/><rect x="119.6" y="145.1" width="8" height="9" rx="1"/><rect x="131.2" y="1.3" width="9" height="8" rx="1"/><rect x="130.2" y="62.8" width="11" height="7" rx="1"/><rect x="130.7" y="84.3" width="11" height="8" rx="1"/><rect x="132.1" y="98.5" width="8" height="9" rx="1"/><rect x="131.9" y="145.6" width="10" height="7" rx="1"/><rect x="130.2" y="157.6" width="8" height="7" rx="1"/><rect x="130.7" y="206.9" width="9" height="9" rx="1"/><rect x="143.1" y="1.5" width="10" height="7" rx="1"/><rect x="143.8" y="14.0" width="11" height="7" rx="1"/><rect x="145.9" y="60.9" width="9" height="8" rx="1"/><rect x="145.3" y="84.9" width="9" height="8" rx="1"/><rect x="145.1" y="132.6" width="11" height="7" rx="1"/><rect x="143.3" y="144.2" width="10" height="9" rx="1"/><rect x="145.0" y="157.6" width="9" height="7" rx="1"/><rect x="143.2" y="192.2" width="8" height="7" rx="1"/><rect x="145.9" y="204.6" width="8" height="9" rx="1"/><rect x="156.3" y="2.1" width="10" height="8" rx="1"/><rect x="157.0" y="14.2" width="11" height="7" rx="1"/><rect x="158.4" y="26.3" width="11" height="7" rx="1"/><rect x="158.1" y="72.9" width="10" height="9" rx="1"/><rect x="158.3" y="86.7" width="8" height="9" rx="1"/><rect x="158.5" y="96.3" width="8" height="7" rx="1"/><rect x="156.0" y="134.8" width="11" height="7" rx="1"/><rect x="156.7" y="146.6" width="9" height="9" rx="1"/><rect x="157.5" y="194.1" width="8" height="8" rx="1"/><rect x="157.3" y="205.9" width="9" height="7" rx="1"/><rect x="169.9" y="1.7" width="8" height="8" rx="1"/><rect x="170.3" y="12.6" width="10" height="7" rx="1"/><rect x="169.6" y="24.2" width="10" height="9" rx="1"/><rect x="169.4" y="96.6" width="10" height="7" rx="1"/><rect x="170.9" y="134.1" width="8" height="7" rx="1"/><rect x="170.0" y="144.1" width="8" height="8" rx="1"/><rect x="169.3" y="193.2" width="8" height="8" rx="1"/><rect x="169.5" y="206.1" width="8" height="9" rx="1"/><rect x="182.9" y="2.9" width="10" height="9" rx="1"/><rect x="183.2" y="14.6" width="10" height="8" rx="1"/><rect x="184.3" y="60.4" width="10" height="8" rx="1"/><rect x="184.4" y="73.2" width="9" height="9" rx="1"/><rect x="183.5" y="84.4" width="10" height="9" rx="1"/><rect x="182.3" y="97.5" width="9" height="7" rx="1"/><rect x="184.9" y="133.4" width="9" height="7" rx="1"/><rect x="184.7" y="145.9" width="11" height="7" rx="1"/><rect x="183.2" y="193.6" width="9" height="7" rx="1"/><rect x="182.7" y="206.2" width="8" height="7" rx="1"/><rect x="197.5" y="12.4" width="8" height="9" rx="1"/><rect x="196.3" y="25.7" width="10" height="9" rx="1"/><rect x="196.2" y="72.2" width="9" height="8" rx="1"/><rect x="197.4" y="85.5" width="10" height="7" rx="1"/><rect x="195.4" y="98.8" width="8" height="9" rx="1"/><rect x="197.9" y="158.7" width="11" height="8" rx="1"/><rect x="196.8" y="193.8" width="11" height="7" rx="1"/><rect x="195.6" y="205.2" width="10" height="7" rx="1"/><rect x="209.0" y="1.1" width="10" height="9" rx="1"/><rect x="210.6" y="26.9" width="8" height="9" rx="1"/><rect x="209.3" y="60.5" width="10" height="7" rx="1"/><rect x="209.9" y="87.0" width="10" height="8" rx="1"/><rect x="208.0" y="96.1" width="10" height="9" rx="1"/><rect x="208.3" y="133.1" width="10" height="8" rx="1"/><rect x="208.4" y="145.1" width="10" height="9" rx="1"/><rect x="209.9" y="193.7" width="8" height="7" rx="1"/><rect x="210.8" y="206.2" width="11" height="9" rx="1"/><rect x="221.2" y="0.1" width="8" height="7" rx="1"/><rect x="223.7" y="12.3" width="9" height="7" rx="1"/><rect x="222.2" y="25.6" width="9" height="7" rx="1"/><rect x="223.7" y="60.2" width="11" height="9" rx="1"/><rect x="224.0" y="72.8" width="9" height="7" rx="1"/><rect x="223.7" y="86.8" width="8" height="8" rx="1"/><rect x="221.8" y="132.7" width="8" height="7" rx="1"/><rect x="261.0" y="1.9" width="9" height="7" rx="1"/><rect x="260.9" y="14.1" width="9" height="8" rx="1"/><rect x="261.2" y="87.0" width="8" height="7" rx="1"/><rect x="273.5" y="0.4" width="9" height="9" rx="1"/><rect x="275.1" y="14.7" width="10" height="9" rx="1"/><rect x="275.1" y="24.5" width="11" height="9" rx="1"/><rect x="274.0" y="60.0" width="9" height="9" rx="1"/><rect x="273.7" y="98.1" width="10" height="9" rx="1"/><rect x="275.2" y="206.8" width="9" height="8" rx="1"/><rect x="287.4" y="0.5" width="9" height="8" rx="1"/><rect x="287.9" y="26.2" width="9" height="8" rx="1"/><rect x="288.4" y="60.7" width="11" height="8" rx="1"/><rect x="288.0" y="73.4" width="10" height="8" rx="1"/><rect x="301.6" y="1.7" width="11" height="9" rx="1"/><rect x="300.4" y="13.7" width="9" height="7" rx="1"/><rect x="300.5" y="25.5" width="9" height="9" rx="1"/><rect x="300.9" y="72.1" width="10" height="9" rx="1"/><rect x="300.5" y="85.5" width="10" height="7" rx="1"/><rect x="314.3" y="0.2" width="11" height="9" rx="1"/><rect x="312.4" y="14.0" width="11" height="9" rx="1"/><rect x="312.1" y="25.9" width="8" height="7" rx="1"/><rect x="314.1" y="62.6" width="10" height="9" rx="1"/><rect x="312.1" y="73.7" width="8" height="8" rx="1"/><rect x="313.7" y="84.1" width="8" height="8" rx="1"/><rect x="314.1" y="97.2" width="11" height="9" rx="1"/><rect x="327.0" y="2.7" width="11" height="8" rx="1"/><rect x="325.2" y="26.6" width="8" height="7" rx="1"/><rect x="327.0" y="60.4" width="11" height="8" rx="1"/><rect x="327.4" y="85.4" width="9" height="9" rx="1"/><rect x="326.7" y="206.4" width="8" height="9" rx="1"/><rect x="339.8" y="2.0" width="9" height="8" rx="1"/><rect x="339.8" y="12.0" width="9" height="8" rx="1"/><rect x="340.4" y="26.3" width="8" height="9" rx="1"/><rect x="340.3" y="62.6" width="10" height="8" rx="1"/><rect x="340.6" y="73.1" width="11" height="8" rx="1"/><rect x="338.9" y="84.1" width="8" height="7" rx="1"/><rect x="338.1" y="99.0" width="8" height="7" rx="1"/><rect x="353.8" y="12.2" width="8" height="8" rx="1"/><rect x="351.8" y="25.5" width="8" height="7" rx="1"/><rect x="352.0" y="60.0" width="8" height="7" rx="1"/><rect x="352.8" y="74.3" width="10" height="9" rx="1"/><rect x="351.8" y="84.4" width="10" height="8" rx="1"/><rect x="351.7" y="96.4" width="9" height="8" rx="1"/></g><g fill="none" stroke="#d2d6d8" stroke-linecap="square"><path d="M90 0V210" stroke-width="15"/><path d="M250 0V210" stroke-width="13"/><path d="M0 120H360" stroke-width="17"/><path d="M90 45H360" stroke-width="12"/><path d="M0 175H250" stroke-width="12"/></g><g fill="none" stroke="#fff" stroke-linecap="square"><path d="M90 0V210" stroke-width="13"/><path d="M250 0V210" stroke-width="11"/><path d="M0 120H360" stroke-width="15"/><path d="M90 45H360" stroke-width="10"/><path d="M0 175H250" stroke-width="10"/></g><path d="M0 120H360" stroke="#fbf3dc" stroke-width="11" fill="none"/><text x="128" y="122.6" font-family="Inter,Arial,sans-serif" font-size="7.5" fill="#8b979c" font-weight="600" letter-spacing=".2">Molenweg</text><text x="92.6" y="200" font-family="Inter,Arial,sans-serif" font-size="7.5" fill="#8b979c" font-weight="600" letter-spacing=".2" transform="rotate(-90 92.6 200)">Stationsweg</text><text x="252.6" y="100" font-family="Inter,Arial,sans-serif" font-size="7.5" fill="#8b979c" font-weight="600" letter-spacing=".2" transform="rotate(-90 252.6 100)">Lindenlaan</text><text x="300" y="47.5" font-family="Inter,Arial,sans-serif" font-size="7.5" fill="#8b979c" font-weight="600" letter-spacing=".2">Kerkstraat</text><path data-pp-route d="M90 8V120H250V158" fill="none" stroke="none"/></svg>';
function websiteBody(o){const e=esc,IC={
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.6"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
  tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6 9 7 9-7"/></svg>',
  ok:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-6.5"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 10h18M8 2.5v4M16 2.5v4"/></svg>',
  bel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
  euro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M18 6.5A7 7 0 1 0 18 17.5M4 10h9M4 14h9"/></svg>',
  rt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/></svg>',
  kaart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/></svg>',
  gebouw:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15M10.5 21v-3h3v3"/></svg>',
  gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2.5 0-4-1.2-4-2.6S9.3 3 10.5 3c1.3 0 1.5 2.3 1.5 5zm0 0c2.5 0 4-1.2 4-2.6S14.7 3 13.5 3C12.2 3 12 5.3 12 8z"/></svg>',
  ster:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
  qr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v2M17 20h4M14 20h1"/></svg>',
  ideal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/><path d="M6 15h4"/></svg>',
  klok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  foto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 9"/></svg>',
  raam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/></svg>',
  huis:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>'};
  const H='<svg viewBox="0 0 24 24"><path d="M4.5 10.4 12 4.2l7.5 6.2v8.4a1.4 1.4 0 0 1-1.4 1.4h-3.4v-5a1 1 0 0 0-1-1h-3.4a1 1 0 0 0-1 1v5H5.9a1.4 1.4 0 0 1-1.4-1.4z"/></svg>';
  const bus=String(o.bus||"").replace(/id="rv/g,'id="ms').replace(/url\(#rv/g,"url(#ms");
  const wg=(d,st)=>`<div class="weg" aria-hidden="true" style="--d:${d}s;${st||""}">${[[4,40],[13,32],[22,46],[34,36],[46,42],[58,34],[69,44],[81,36],[92,40]].map(([x,w])=>`<span class="h" style="left:${x}%;width:${w}px">${H}</span>`).join("")}<i class="r"></i><span class="bus">${bus}</span></div>`,weg=wg(0);
  const naam=e(o.naam||"mijnschoonmaker"),regio=o.plaats?` in ${e(o.plaats)} en omgeving`:"",tel=String(o.telefoon||"").trim(),telH=tel.replace(/[^\d+]/g,"");
  const wa=o.whatsapp?`https://wa.me/${e(o.whatsapp)}?text=${encodeURIComponent("Hallo, ik heb een vraag over glasbewassing.")}`:"";
  const logo=o.logo?`<img src="${o.logo}" alt="${naam}">`:`<span>${naam}</span>`;
  const portaal=o.portaal||"";
  const faq=[["Moet ik thuis zijn als u komt?","Voor de buitenkant hoeft u niet thuis te zijn. U krijgt 2 dagen vooraf een aankondiging met de dag waarop wij komen, en in uw klantportaal ziet u altijd wanneer de volgende beurt is."],
    ["Hoe komt mijn prijs tot stand?",`U maakt een foto van uw woning en tikt de ramen aan. Op basis daarvan ziet u direct uw vaste prijs per beurt, inclusief kozijnen en btw. Bij de eerste beurt tellen wij ter plekke na; klopt de telling niet, dan passen wij de prijs aan en hoort u dat van ons.`],
    ["Hoe vaak komen jullie?","Dat kiest u zelf in de calculator. Hoe vaker, hoe voordeliger per beurt. Wij plannen u daarna vast in op onze route."],
    ["Hoe betaal ik?",`Na elke beurt ontvangt u de factuur per e-mail${o.mollie?", met een betaallink voor iDEAL":""}. Al uw facturen staan ook in uw klantportaal.`],
    ["Doen jullie ook bedrijven en VvE's?","Zeker. Kies in de calculator voor Bedrijf / VvE en laat uw gegevens achter; wij nemen snel contact met u op voor een prijs op maat."],["Wat zijn credits?","Credits zijn korting die u spaart: 1 credit is € 1. U krijgt ze voor het aanbevelen van een buur, een Google-review, het beoordelen van een beurt of het bestellen van een extra dienst. Ze gaan automatisch van uw volgende factuur af."],["Kan ik een afspraak verzetten of overslaan?","Ja, dat regelt u zelf in uw klantportaal: verzetten, een keer overslaan of uw vakantie doorgeven. Wij passen de planning aan en u krijgt een bevestiging."]];
  return `<input type="checkbox" id="msm" hidden>
<header class="nav"><div class="in w"><a class="logo" href="#top">${logo}</a>
  <nav class="lk"><a href="#werkwijze">Zo werkt het</a><a href="#portaal">Portaal</a><a href="#betalen">Betalen</a><a href="#credits">Credits</a><a href="#prijs">Prijs</a>${o.werkApi?`<a href="#werk">Ons werk</a>`:""}<a href="#zakelijk">Zakelijk</a><a href="#vragen">Vragen</a><a href="#contact">Contact</a>${portaal?`<a class="lk-p" href="${e(portaal)}">Mijn portaal</a>`:""}</nav>
  ${portaal?`<a class="portaal" href="${e(portaal)}">${IC.user}Mijn portaal</a>`:""}
  <label class="hb" for="msm" aria-label="Menu">${IC.menu}</label></div></header>
<section class="hero" id="top"><div class="hv" aria-hidden="true">${HV_SCENE}<img class="hv-img" alt="" data-hero-img><div class="hv-vuil"></div><div class="hv-trek"><i></i><b></b><s></s></div><div class="hv-scrim"></div></div>
  <button type="button" class="pauze" data-pauze aria-label="Animatie pauzeren" aria-pressed="false"><svg class="pz" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg><svg class="sp" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg></button>
  <div class="hv-ui"><div>${o.score?`<a class="ster" href="${e(o.reviewUrl||"#")}" target="_blank" rel="noopener"><i>★★★★★</i><b>${e(o.score)}</b> op Google</a>`:""}
    <h1 class="t1">Heldere ramen.<br>Zonder omkijken.</h1><p class="sub">Vaste route. Vaste prijs. Live te volgen.</p></div>
    <div class="hv-knop"><a class="pil" href="#prijs">Bereken uw prijs</a>${portaal?`<a class="pil glas" href="${e(portaal)}">Mijn portaal</a>`:wa?`<a class="pil glas" href="${wa}" target="_blank" rel="noopener">WhatsApp</a>`:""}</div></div>
</section>
<section id="live" class="zwart live-sec"><div class="in">
  <div class="kopblok mid rv"><h2 class="t2">Live meekijken.</h2><p class="ld">Op de dag zelf ziet u in uw portaal waar het busje is, hoeveel adressen er nog voor u zijn en hoe laat we er zijn.</p></div>
  <div class="hero-tel"><div class="pp" data-pp role="img" aria-label="Zo ziet uw klantportaal eruit op de dag zelf: live zien waar het busje is en hoe laat we er zijn">
    <div class="pp-sb"><b>11:02</b><i></i><span><svg viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" opacity=".4"/><rect x="2.2" y="2.2" width="15" height="7.6" rx="1.8"/><rect x="23.6" y="4" width="1.8" height="4" rx=".9" opacity=".4"/></svg></span></div>
    <div class="pp-top">${o.logo?`<img src="${e(o.logo)}" alt="">`:`<span class="pp-lg">${IC.raam}</span>`}<span>Goedemiddag, Sanne</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></div>
    <div class="pp-main">
      <div class="pp-hero"><div class="pp-hk"><div><p class="pp-k"><span class="pp-puls"></span>Vandaag</p><span class="pp-adr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>Lindenlaan 14<em>, Zuidhorn</em></span></span><h3>Woensdag 14 oktober</h3></div>
        <div class="pp-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="t"/><circle cx="50" cy="50" r="44" class="v"/></svg><span><b>0</b><small>dagen</small></span></div></div>
        <p class="pp-s" data-pp-sub>Rond 11:10 · we zijn onderweg</p></div>
      <div class="pp-lv"><div class="pp-map" data-pp-map>${PP_KAART}<div class="pp-ov"><span class="pp-lijn" data-pp-lijn></span><span class="pp-huis" style="left:73.3%;top:80%"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg></span><span class="pp-auto" data-pp-bus><span class="pp-pl"></span><span class="pp-rot" data-pp-rot>${PP_BUS}</span></span></div></div>
        <div class="pp-info"><span class="pp-car">${PP_AUTO}</span><div class="pp-tx"><small class="pp-st"><i></i>Live</small><b data-pp-t>Nog 2 adressen voor u</b><span data-pp-s2>Robin is in de buurt</span></div><div class="pp-eta"><small>Verwacht</small><b data-pp-eta>± 11:10</b></div></div></div>
    </div></div></div>
</div></section>
<section id="werkwijze"><div class="in">
  <div class="rv kopblok mid"><h2 class="t2">Vier stappen.<br>Geen offertebezoek.</h2><p class="ld">U regelt het in een paar minuten online. Daarna komen wij vanzelf terug.</p></div>
  <ol class="stappen">
    <li class="rv stp"><span class="n">${IC.cam}</span><h3>Foto en prijs</h3><p>Maak een foto van uw woning, tik de ramen aan en zie direct uw prijs per beurt.</p></li>
    <li class="rv stp"><span class="n">${IC.ok}</span><h3>Aanmelden</h3><p>Kies hoe vaak u ons wilt zien en laat uw gegevens achter. U krijgt meteen een bevestiging.</p></li>
    <li class="rv stp"><span class="n">${IC.raam}</span><h3>Eerste beurt</h3><p>Wij wassen uw ramen en kozijnen en tellen ter plekke na of alles klopt.</p></li>
    <li class="rv stp"><span class="n">${IC.rt}</span><h3>Vaste route</h3><p>Daarna staat u vast op onze route. Twee dagen vooraf krijgt u een aankondiging.</p></li></ol>
</div></section>
<section id="portaal" class="grijs"><div class="in w">
  <div class="rv kopblok mid"><h2 class="t2">Uw klantportaal.<br>Alles bij de hand.</h2><p class="ld">Geen wachtwoord, geen app. U logt in met uw e-mailadres en ziet precies wat er komt, wat er is gedaan en wat het kost.</p></div>
  <div class="bento">
    <div class="rv tile s4"><h3>Twee dagen vooraf weet u het.</h3><p>De dag, de richttijd, wat wij komen doen en waar u aan moet denken. Past het niet? Verzetten kan met één tik.</p>
      <div class="vis"><div class="mail" role="img" aria-label="Voorbeeld van de aankondigingsmail"><div class="mail-h"><span class="av">${IC.raam}</span><div><b>${naam}</b>aan Sanne</div><span class="tijd">zondag 26 okt.</span></div>
        <div class="mail-s">Aankondiging: glasbewassing op dinsdag 28 oktober</div>
        <div class="mail-b"><p>Beste Sanne,</p><div class="mail-dag"><span class="d"><b>28</b><small>okt</small></span><div><strong>Dinsdag 28 oktober, rond 11:00 uur</strong><span>Lindenlaan 14, Zuidhorn · buitenzijde, inclusief kozijnen</span></div></div>
          <ul><li>${IC.ok}<span>Ramen en ventilatieroosters gesloten houden</span></li><li>${IC.ok}<span>Horren verwijderen en rolluiken openen</span></li><li>${IC.ok}<span>Poorten en hekwerk toegankelijk maken</span></li></ul>
          <div class="mail-k"><a>${IC.user}Open mijn portaal</a><a class="l">${IC.cal}Past dit niet? Verzetten</a></div></div></div></div></div>
    <div class="rv tile"><h3>Live meekijken.</h3><p>Op de dag zelf ziet u waar het busje is en hoe laat we er zijn.</p>
      <div class="vis"><div class="live"><span class="pu"></span><div><b>Robin is onderweg · nog 2 adressen</b><span>Verwacht rond 11:10</span></div></div>
        <div class="rij" style="margin-top:12px;border-top:0"><span class="ic">${IC.klok}</span><div><b>Richttijd 11:00</b><span class="s">Kan door route of weer ± 45 min verschillen</span></div></div>
        <div class="rij"><span class="ic">${IC.huis}</span><div><b>Poortcode doorgegeven</b><span class="s">Wij hoeven u niet te storen</span></div><span class="ok">${IC.ok}</span></div></div></div>
    <div class="rv tile"><h3>Iets melden? Zo gedaan.</h3><p>Een ticket, toegang tot de tuin of iets extra's laten doen.</p>
      <div class="vis"><div class="rij"><span class="ic">${IC.bel}</span><div><b>Ticket aanmaken</b><span class="s">U volgt de status in het portaal</span></div><span class="pijl">›</span></div>
        <div class="rij"><span class="ic">${IC.huis}</span><div><b>Toegang en instructies</b><span class="s">Poortcode, sleutel bij de buren</span></div><span class="pijl">›</span></div>
        <div class="rij"><span class="ic">${IC.raam}</span><div><b>Iets extra laten doen</b><span class="s">Kozijnen, binnenzijde, zonnepanelen</span></div><span class="pijl">›</span></div>
        <div class="rij"><span class="ic">${IC.cal}</span><div><b>Verzetten of overslaan</b><span class="s">Vakantie? Eén tik</span></div><span class="pijl">›</span></div></div></div>
    <div class="rv tile"><h3>Credits. Korting die vanzelf komt.</h3><p>1 credit is € 1 korting op uw volgende factuur.</p>
      <div class="vis"><div class="groot">16<small>credits</small></div>
        <div class="rij" style="margin-top:14px"><span class="ic goud">${IC.user}</span><div><b>Buurvrouw aangemeld</b><span class="s">Eerste beurt gedaan</span></div><span class="tag">+${e(String(o.refBeloning||15))}</span></div>
        <div class="rij"><span class="ic goud">${IC.ster}</span><div><b>Beurt beoordeeld</b><span class="s">5 sterren · 2 september</span></div><span class="tag">+${e(String(o.crBeurt||1))}</span></div>
        <div class="rij"><span class="ic">${IC.ster}</span><div><b>Google-review</b><span class="s">Nog te verdienen</span></div><span class="tag wacht">+${e(String(o.crReview||5))}</span></div></div></div>
    <div class="rv tile"><h3>Uw betaalgedrag.</h3><p>Zie hoe snel u betaalt en waar u staat bij onze snelste betalers.</p>
      <div class="vis"><div class="ring"><span class="rg"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="t"/><circle cx="50" cy="50" r="42" class="v"/></svg><b>100%</b></span><div><b>Alles op tijd betaald</b><span>Gemiddeld 1 uur en 12 minuten na ontvangst</span></div></div>
        <div class="rang"><span class="nr">2</span><div><b>U staat op nummer 2</b><span>van onze snelste betalers</span></div></div></div></div>
    <div class="rv tile s3"><h3>Wat er is gedaan.</h3><p>Elke beurt op een rij, met wat er precies is schoongemaakt.</p>
      <div class="vis"><ol class="tl"><li class="nu"><b>Dinsdag 28 oktober</b><span class="s">Volgende beurt · over 12 dagen</span></li>
        <li><b>Dinsdag 2 september</b><span class="s">Ramen en kozijnen · 25 min</span><div class="vink2"><span>${IC.ok}Voorzijde</span><span>${IC.ok}Achterzijde</span><span>${IC.ok}Dakkapel</span></div></li>
        <li><b>Dinsdag 8 juli</b><span class="s">Ramen en kozijnen · 23 min</span></li></ol></div></div>
    <div class="rv tile s3"><h3>Beoordeel elke beurt.</h3><p>Geef sterren na elk bezoek. Zo blijven wij scherp, en u verdient er ${e(String(o.crBeurt||1))} credit mee.</p>
      <div class="vis"><div class="sterren">${IC.ster}${IC.ster}${IC.ster}${IC.ster}${IC.ster.replace("<svg",'<svg class="leeg"')}</div>
        <div class="rij" style="margin-top:14px;border-top:0;padding-bottom:0"><span class="ic">${IC.raam}</span><div><b>Beurt van 2 september</b><span class="s">Hoe tevreden bent u?</span></div><span class="pijl">›</span></div></div></div>
  </div>
  ${portaal?`<div class="lnks"><a class="lnk" href="${e(portaal)}">Naar mijn portaal</a></div>`:""}
</div></section>
<section id="route" class="nacht"><div class="in">
  <div class="kopblok mid rv"><h2 class="t2">Elke acht weken.<br>Vanzelf.</h2><p class="ld">U staat vast op onze route. Wij komen langs, u hoeft er niet aan te denken.</p></div></div>
  <div class="n-scene" aria-hidden="true">${[[6,22],[14,38],[22,61],[30,17],[38,80],[46,44],[54,70],[62,29],[70,55],[78,12],[86,66],[94,36]].map(([x,y])=>`<i class="n-ster" style="left:${x}%;top:${y}%;animation-delay:${(x*7)%30/10}s"></i>`).join("")}<span class="n-maan"></span>
    <div class="n-grond"></div><div class="n-weg"></div>
    ${[8,24,40,56,72,88].map(x=>{const d=((x+12)/120*16-1.44).toFixed(2);return `<span class="n-huis" style="left:${x}%;--d:${d}s">${N_HUIS}<span class="n-vink">${IC.ok}</span></span>`}).join("")}
    <span class="n-bus"><span class="n-licht"></span>${bus.replace(/id="ms/g,'id="mn').replace(/url\(#ms/g,"url(#mn")}</span><div class="n-ond"></div></div></section>
<section id="betalen"><div class="in">
  <div class="rv kopblok mid"><h2 class="t2">Betalen in één minuut.</h2><p class="ld">Na elke beurt krijgt u de factuur per e-mail${o.mollie?", met een iDEAL-knop":""}. Credits gaan er automatisch af. Alles staat ook in uw portaal.</p></div>
  <div class="rv fact" role="img" aria-label="Voorbeeld van een factuur die online is betaald"><div class="fact-h"><span class="av">${IC.euro}</span><div><b>Factuur ${new Date().getFullYear()}-0127</b><small>Glasbewassing · Lindenlaan 14, Zuidhorn</small></div><span class="tag">Betaald</span></div>
    <div class="fact-r"><span>Glasbewassing · 14 ramen</span><b>€ 42,50</b></div><div class="fact-r kort"><span>Credits (aanbeveling)</span><b>− € 15,00</b></div><div class="fact-r tot"><span>Te betalen</span><b>€ 27,50</b></div>
    <div class="fact-ok">${IC.ok}<span>Betaald${o.mollie?" met iDEAL":""}, 1 uur na ontvangst. Bedankt!</span></div></div>
</div></section>
<section id="credits" class="zwart"><div class="in">
  <div class="rv kopblok mid"><h2 class="t2">Credits.<br>Zo spaart u korting.</h2><p class="ld">1 credit is € 1 korting op uw volgende factuur. U hoeft er niets voor te doen, behalve dit:</p></div>
  <div class="cijfers">
    <div class="rv cf"><b>+${e(String(o.refBeloning||15))}</b><h3>Beveel een buur aan</h3><p>Uw buur krijgt € ${e(String(o.refWelkom||10))} welkomstkorting, u krijgt ${e(String(o.refBeloning||15))} credits na de eerste beurt.</p></div>
    <div class="rv cf"><b>+${e(String(o.crReview||5))}</b><h3>Google-review</h3><p>Help anderen ons te vinden. Eenmalig.</p></div>
    <div class="rv cf"><b>+${e(String(o.crBeurt||1))}</b><h3>Beoordeel een beurt</h3><p>Na elk bezoek, in uw portaal.</p></div>
    <div class="rv cf"><b>+${e(String(o.crExtra||3))}</b><h3>Bestel iets extra's</h3><p>Kozijnen, binnenzijde, zonnepanelen of dakgoot.</p></div></div>
</div></section>
<section id="prijs" class="grijs"><div class="in w">
  <div class="rv kopblok mid"><h2 class="t2">Bereken uw prijs.<br>Meld u direct aan.</h2><p class="ld">Maak een foto van uw woning, tik de ramen aan en u ziet direct uw vaste prijs per beurt. Aanmelden kan meteen.</p></div>
  <div id="ms-calc"></div></div></section>
<section id="verhaal" class="story" data-story hidden><div data-st-imgs></div><div class="st-scrim"></div><div class="in w"><div><h2 class="t2">Echt werk.<br>Echte ramen.</h2><p class="ld">Gefotografeerd bij onze klanten, na de beurt.</p></div><div><div class="st-cap" data-st-cap></div><div class="st-dots" data-st-dots></div></div></div></section>
<section id="werk" class="grijs" data-werk="${e(o.werkApi||"")}" ${o.werkApi?"":"hidden"}><div class="in w">
  <div class="rv kopblok mid"><h2 class="t2">Zo ziet schoon eruit.</h2><p class="ld">Echte foto's van ons werk bij klanten in de buurt. Geen stockfoto's.</p></div>
  <div class="wk-filter" data-werk-filter hidden></div><div class="wk-grid" data-werk-grid></div></div></section>
<section id="zakelijk"><div class="in w">
  <div class="rv kopblok mid"><h2 class="t2">Ook voor bedrijven en VvE's.</h2><p class="ld">Kantoor, winkel, school of appartementencomplex: een prijs op maat, ingepland wanneer het u uitkomt.</p></div>
  <div class="bento">
    <div class="rv tile s3"><h3>Zakelijk</h3><p>Vaste dagen, een vast gezicht en een factuur die klopt. Voor kantoren, winkels, horeca, scholen en zorg.</p>
      <div class="vis"><div class="tags"><span>Kantoren</span><span>Winkels en horeca</span><span>Scholen en zorg</span><span>VvE's</span></div><div style="margin-top:22px"><a class="lnk" href="#prijs">Vraag een prijs aan</a></div></div></div>
    <div class="rv tile s3"><h3>Speciaal voor VvE's</h3><p>Schoonmaak van trappenhuis en entree, zichtbaar voor alle bewoners.</p>
      <div class="vis"><ul class="lijst"><li><i>${IC.cal}</i><div><b>Vaste weekdagen</b><span>Bijvoorbeeld elke dinsdag en vrijdag, altijd dezelfde schoonmaker.</span></div></li>
        <li><i>${IC.foto}</i><div><b>Logboek met foto's</b><span>Per beurt wat er is gedaan, met opleverfoto en notitie.</span></div></li>
        <li><i>${IC.qr}</i><div><b>Bewonersbord met QR</b><span>Bewoners scannen in de hal en zien wanneer er is schoongemaakt.</span></div></li>
        <li><i>${IC.bel}</i><div><b>Meldingen uit het gebouw</b><span>Kapotte lamp, grofvuil of schade: wij melden het met foto aan het bestuur.</span></div></li></ul></div></div>
  </div></div></section>
<section id="vragen" class="grijs"><div class="in">
  <div class="rv kopblok mid"><h2 class="t2">Goed om te weten.</h2></div>
  <div class="faq">${faq.map(([q,a])=>`<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join("")}</div></div></section>
<section id="contact"><div class="in">
  <div class="rv kopblok mid"><h2 class="t2">Vragen?<br>Wij helpen u graag.</h2><p class="ld">Stuur een berichtje via WhatsApp of mail. Wij reageren meestal dezelfde dag.</p>
  <div class="ck">${wa?`<a class="pil" href="${wa}" target="_blank" rel="noopener">${IC.wa}WhatsApp</a>`:""}${o.email?`<a class="pil licht" href="mailto:${e(o.email)}">${IC.mail}${e(o.email)}</a>`:""}</div></div>
</div></section>
<footer><div class="in w"><span>© ${new Date().getFullYear()} ${naam}${o.adres?` · ${e(o.adres)}${o.postcode?", "+e(o.postcode):""} ${e(o.plaats||"")}`:""}${o.kvk?` · KvK ${e(o.kvk)}`:""}</span>
  <span>${portaal?`<a href="${e(portaal)}">Klantportaal</a> · `:""}${o.voorwaarden?`<a href="${e(o.voorwaarden)}" target="_blank" rel="noopener">Algemene voorwaarden</a>`:""}</span></div></footer>
`}

async function websiteDelen(){const fv=k=>{const el=typeof form!=="undefined"&&form&&form.querySelector(`[data-k="${k}"]`);return el?el.value:null};const s=S(),lg=await loadLogo();const wa=String(s.webWa||waNr(s.telefoon)||"").replace(/\D/g,"");
  const o={naam:s.naam,telefoon:s.telefoon,email:s.email,adres:s.adres,postcode:s.postcode,plaats:s.plaats,kvk:s.kvk,whatsapp:wa,logo:lg?await kleinLogo(lg.url):"",
    portaal:LIVE?location.origin+"/portaal":"",werkApi:LIVE?location.origin+"/api/portaal/werk":"",score:String(fv("webScore")??s.webScore??"4,8").trim(),reviewUrl:String(fv("webReviewUrl")||s.webReviewUrl||"https://www.google.com/search?q=mijnschoonmaker.com+Reviews").trim(),refBeloning:s.refBeloning!=null&&s.refBeloning!==""?Number(s.refBeloning):15,refWelkom:s.refWelkom!=null&&s.refWelkom!==""?Number(s.refWelkom):10,crReview:s.crReview??5,crBeurt:s.crBeurt??1,crExtra:s.crExtra??3,voorwaarden:s.webVoorwaarden||s.voorwaarden||"",mollie:!!s.liveMollie,bus:typeof RV_BUS!=="undefined"?RV_BUS:""};
  return {body:websiteBody(o),calc:await klantCalcHtml(wa),o}}
/* bonnetje: echt afscheuren langs de perforatie, met rafelrand en papiersnippers */
const WEB_JS=`var ms=(root.classList&&root.classList.contains("ms"))?root:(root.querySelector&&root.querySelector(".ms"))||root;if(ms.classList)ms.classList.add("js");function escT(t){return String(t||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var pz=root.querySelector("[data-pauze]");if(pz&&!pz._ms){pz._ms=1;pz.addEventListener("click",function(){var aan=ms.classList.toggle("stil");pz.setAttribute("aria-pressed",aan?"true":"false");pz.setAttribute("aria-label",aan?"Animatie afspelen":"Animatie pauzeren")})}
if(window.IntersectionObserver){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("zicht");io.unobserve(x.target)}})},{rootMargin:"0px 0px -6% 0px",threshold:.1});root.querySelectorAll(".rv").forEach(function(el){if(!el._rv){el._rv=1;io.observe(el)}})}else root.querySelectorAll(".rv").forEach(function(el){el.classList.add("zicht")});
function fotos(items){var hv=root.querySelector(".hv"),hi=hv&&hv.querySelector(".hv-img");if(hi&&items[0]&&!hi.src){hi.onload=function(){hv.classList.add("foto")};hi.src=items[0].url}
  var st=root.querySelector("[data-story]");if(!st||st._ms)return;st._ms=1;var L=items.length>1?items.slice(1,5):items.slice(0,1);if(!L.length)return;st.hidden=false;var box=st.querySelector("[data-st-imgs]"),cap=st.querySelector("[data-st-cap]"),dots=st.querySelector("[data-st-dots]");
  box.innerHTML=L.map(function(x){return '<img class="st-img" src="'+escT(x.url)+'" alt="'+escT(x.titel||"")+'" loading="lazy">'}).join("");dots.innerHTML=L.map(function(){return "<i></i>"}).join("");var i=0;
  function toon(){for(var k=0;k<box.children.length;k++){box.children[k].classList.toggle("aan",k===i);dots.children[k].classList.toggle("aan",k===i)}var x=L[i];cap.innerHTML=(x.titel?'<b>'+escT(x.titel)+'</b>':'')+escT(x.plaats||"")}
  toon();if(L.length>1)setInterval(function(){if(ms.classList&&ms.classList.contains("stil"))return;i=(i+1)%L.length;toon()},6500)}
root.querySelectorAll("[data-pp]").forEach(function(pp){if(pp._ms)return;pp._ms=1;
  var map=pp.querySelector("[data-pp-map]"),bus=pp.querySelector("[data-pp-bus]"),rot=pp.querySelector("[data-pp-rot]"),lijn=pp.querySelector("[data-pp-lijn]"),
    tE=pp.querySelector("[data-pp-t]"),sE=pp.querySelector("[data-pp-s2]"),eE=pp.querySelector("[data-pp-eta]"),hE=pp.querySelector("[data-pp-sub]");
  /* busje rijdt over de straten naar de woning, met twee stops onderweg */
  var R=pp.querySelector("[data-pp-route]"),LT=310;try{LT=R.getTotalLength()}catch(_){}
  var HX=264/360*100,HY=168/210*100,K=[0,.22,.3,.5,.58,.84,1],LK=[0,72,72,192,192,LT-2,LT-2];
  function pt(l){try{var q=R.getPointAtLength(Math.max(0,Math.min(LT,l)));return{x:q.x,y:q.y}}catch(_){return{x:90,y:8}}}
  var D=15000,t0=performance.now(),laatst="",hoek=180;
  function tik(n){var t=((n-t0)%D)/D,l=0,rijdt=false;for(var j=1;j<K.length;j++){if(t<=K[j]){var u=(t-K[j-1])/(K[j]-K[j-1]);u=u<0?0:u;u=u*u*(3-2*u);l=LK[j-1]+(LK[j]-LK[j-1])*u;rijdt=LK[j]!==LK[j-1];break}}
    var p=pt(l),v=pt(l+3);if(rijdt&&(Math.abs(v.x-p.x)+Math.abs(v.y-p.y))>.3)hoek=Math.atan2(v.y-p.y,v.x-p.x)*180/Math.PI+90;
    var w=map.offsetWidth||1,h=map.offsetHeight||1,bx=p.x/360*100,by=p.y/210*100;
    bus.style.left=bx+"%";bus.style.top=by+"%";rot.style.transform="rotate("+hoek.toFixed(1)+"deg)";
    var x1=bx*w/100,y1=by*h/100,x2=HX*w/100,y2=HY*h/100-22,dx=x2-x1,dy=y2-y1,L=Math.sqrt(dx*dx+dy*dy);
    lijn.style.left=x1+"px";lijn.style.top=y1+"px";lijn.style.width=Math.max(0,L-26)+"px";lijn.style.transform="rotate("+Math.atan2(dy,dx)+"rad)";lijn.style.opacity=L>44?1:0;
    var voor=l<72.5?2:l<192.5?1:0,klaar=l>=LT-3,km=Math.max(.1,(LT-l)/LT*1.4),k=voor+"|"+klaar+"|"+(voor===0&&!klaar?km.toFixed(1):"");
    if(k!==laatst){laatst=k;
      tE.textContent=klaar?"We zijn bij u":voor===0?"Robin is onderweg naar u":"Nog "+voor+" "+(voor===1?"adres":"adressen")+" voor u";
      sE.textContent=klaar?"Uw ramen worden nu gewassen":voor===0?(km<.3?"Bijna bij u":"Nog "+km.toFixed(1).replace(".",",")+" km"):"Robin is in de buurt";
      eE.textContent=klaar?"nu":voor===2?"± 11:10":voor===1?"± 11:06":"± 11:0"+Math.min(9,Math.max(2,Math.round(2+km*5)));
      hE.textContent=klaar?"We zijn bij u aan het werk":voor===0?"U bent de volgende":"Rond 11:10 · we zijn onderweg"}
    if(pp.isConnected)requestAnimationFrame(tik)}
  requestAnimationFrame(tik)});
var tks=root.querySelectorAll("[data-tk]");
tks.forEach(function(tk){if(tk._ms)return;tk._ms=1;var l=tk.querySelector(".tk-l"),r=tk.querySelector(".tk-r"),vz=r.querySelector(".tk-vz"),hint=tk.parentNode.querySelector(".tk-hint");
  var N=46,pts=[],raf=0,p=0,staat="heel",lastSnip=0,audio=null;
  function nieuwePunten(){pts=[];var e=3;for(var i=0;i<=N;i++){e+= (Math.random()-.5)*2.6;if(Math.random()<.12)e+=(Math.random()-.5)*3;e=Math.max(.3,Math.min(5.7,e));if(i%3==0)e=e*.6+3*.4;pts.push(e)}}
  function clip(q){/* boven de scheurfront: rafelig; eronder: nog vast op de perforatie */
    var L=[],R=[],V=[],Y=q*100;for(var i=0;i<=N;i++){var y=i/N*100,e=y<=Y+.01?pts[i]:3,ys=y.toFixed(2)+"%";L.push("calc(100% - "+(6-e).toFixed(2)+"px) "+ys);R.push(e.toFixed(2)+"px "+ys);V.push((y<=Y?e+1.4+Math.random()*.8:e).toFixed(2)+"px "+ys)}
    l.style.clipPath="polygon(0 0,"+L.join(",")+",0 100%)";r.style.clipPath="polygon("+R.join(",")+",100% 100%,100% 0)";
    vz.style.clipPath="polygon("+R.join(",")+","+V.reverse().join(",")+")"}
  function zet(q){p=Math.max(0,Math.min(1,q));clip(p);tk.classList.toggle("bezig",p>0);var H=r.offsetHeight,y=p*H,a=Math.pow(p,1.4)*11+Math.sin(p*31)*.35*p;
    r.style.transformOrigin="0px "+y.toFixed(1)+"px";r.style.transform="translate("+(p*3).toFixed(2)+"px,"+(p*2).toFixed(2)+"px) rotate("+a.toFixed(2)+"deg)";
    r.style.filter="drop-shadow("+(2+p*6).toFixed(1)+"px "+(2+p*8).toFixed(1)+"px "+(4+p*8).toFixed(1)+"px rgb(10 40 50 / "+(.15+p*.2).toFixed(2)+"))";
    var nu=performance.now();if(p>0&&p<1&&nu-lastSnip>45){lastSnip=nu;snip(y)}}
  function snip(y){var d=document.createElement("i");d.className="tk-snipper";var w=1.5+Math.random()*2.5;d.style.width=w+"px";d.style.height=(w*(.5+Math.random()*1.3))+"px";
    d.style.left=(l.offsetWidth-4+Math.random()*4)+"px";d.style.top=(y-4+Math.random()*8)+"px";if(Math.random()<.4)d.style.background="#d9eef1";tk.appendChild(d);
    d.animate([{transform:"translate(0,0) rotate(0)",opacity:1},{transform:"translate("+(Math.random()*50-14)+"px,"+(90+Math.random()*170)+"px) rotate("+(Math.random()*900-450)+"deg)",opacity:0}],{duration:1000+Math.random()*900,easing:"cubic-bezier(.25,.5,.45,1)",fill:"forwards"}).onfinish=function(){d.remove()}}
  function geluid(){try{var A=audio||(audio=new (window.AudioContext||window.webkitAudioContext)());if(A.state==="suspended")A.resume();var t=A.currentTime,len=1.0,
    b=A.createBuffer(1,A.sampleRate*len,A.sampleRate),c=b.getChannelData(0),k=0;for(var i=0;i<c.length;i++){if(Math.random()<.004)k=1;k*=.985;c[i]=(Math.random()*2-1)*(.18+k*.9)}
    var src=A.createBufferSource();src.buffer=b;var bp=A.createBiquadFilter();bp.type="bandpass";bp.frequency.setValueAtTime(1800,t);bp.frequency.linearRampToValueAtTime(3600,t+len);bp.Q.value=.8;
    var g=A.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.35,t+.08);g.gain.setValueAtTime(.35,t+len*.75);g.gain.linearRampToValueAtTime(0,t+len);src.connect(bp);bp.connect(g);g.connect(A.destination);src.start(t);return src}catch(e){return null}}
  function val(){staat="valt";var t0=performance.now(),H=r.offsetHeight,vx=40+Math.random()*50,rv=70+Math.random()*60,a0=11;
    tk.classList.add("af");try{navigator.vibrate&&navigator.vibrate([12,30,18])}catch(_){}for(var i=0;i<10;i++)snip(H*Math.random());
    r.style.transformOrigin="0px "+H+"px";
    (function f(n){var s=(n-t0)/1000,x=3+vx*s,y=2+900*s*s,a=a0+rv*s+30*s*s;r.style.transform="translate("+x.toFixed(1)+"px,"+y.toFixed(1)+"px) rotate("+a.toFixed(1)+"deg)";r.style.opacity=Math.max(0,1-Math.max(0,s-.7)*1.8).toFixed(3);
      if(s<1.25)raf=requestAnimationFrame(f);else{staat="weg";r.style.visibility="hidden"}})(t0)}
  function scheurAuto(metGeluid){cancelAnimationFrame(raf);reset();staat="scheurt";if(metGeluid)geluid();var t0=performance.now(),D=1500;
    (function f(n){var t=Math.min(1,(n-t0)/D),q=t<.22?.1*(t/.22):.1+.9*Math.pow((t-.22)/.78,1.5);q+=Math.sin(t*40)*.006;zet(q);if(t<1)raf=requestAnimationFrame(f);else val()})(t0)}
  function reset(){cancelAnimationFrame(raf);tk.classList.remove("af");nieuwePunten();r.style.visibility="";r.style.opacity="";staat="heel";zet(0);r.style.filter=""}
  /* zelf aftrekken */
  var sleep=null;
  r.addEventListener("pointerdown",function(e){if(staat==="scheurt"||staat==="valt")return;if(staat==="weg")reset();sleep={y:e.clientY,x:e.clientX,p0:p,snd:geluid()};try{r.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
  r.addEventListener("pointermove",function(e){if(!sleep)return;var d=Math.max(e.clientY-sleep.y,(e.clientX-sleep.x)*1.3);zet(sleep.p0+d/(r.offsetHeight*.9));if(p>=1){sleep=null;val()}});
  function los(){if(!sleep)return;var s=sleep;sleep=null;if(s.snd)try{s.snd.stop()}catch(_){}
    if(p>.4){var t0=performance.now(),p0=p;geluid();(function f(n){var t=Math.min(1,(n-t0)/300);zet(p0+(1-p0)*t);if(t<1)raf=requestAnimationFrame(f);else val()})(t0)}
    else{var t1=performance.now(),q0=p;(function f(n){var t=Math.min(1,(n-t1)/220);zet(q0*(1-t));if(t<1)raf=requestAnimationFrame(f)})(t1)}}
  r.addEventListener("pointerup",los);r.addEventListener("pointercancel",los);
  l.addEventListener("click",function(){scheurAuto(true)});tk._zet=zet;tk._reset=reset;
  nieuwePunten();zet(0);
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches){tk.classList.add("af");r.style.visibility="hidden";staat="weg";return}
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting&&x.intersectionRatio>.7){io.disconnect();setTimeout(function(){if(staat==="heel")scheurAuto(false)},700)}})},{threshold:[.7]});io.observe(tk)}else scheurAuto(false)});
/* ons werk: foto's live uit het CRM */
root.querySelectorAll("[data-werk]").forEach(function(sec){if(sec._ms)return;sec._ms=1;var api=sec.getAttribute("data-werk"),grid=sec.querySelector("[data-werk-grid]"),fil=sec.querySelector("[data-werk-filter]");if(!api||!grid)return;
  var CAT={woning:"Woningen",zakelijk:"Zakelijk",vve:"VvE",detail:"Details"},items=[],cur="";
  function esc(t){return String(t||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function teken(){var L=cur?items.filter(function(x){return x.cat===cur}):items;grid.innerHTML=L.map(function(x,i){return '<figure class="wk-it" data-wi="'+items.indexOf(x)+'" style="aspect-ratio:'+(x.w||4)+'/'+(x.h||3)+'"><img src="'+esc(x.thumb)+'" alt="'+esc(x.titel||"Glasbewassing")+'" loading="lazy"><figcaption>'+(x.titel?'<b>'+esc(x.titel)+'</b>':'')+(x.plaats?'<span>'+esc(x.plaats)+'</span>':'')+'</figcaption></figure>'}).join("")}
  function filters(){var cs=[];items.forEach(function(x){if(cs.indexOf(x.cat)<0)cs.push(x.cat)});if(cs.length<2||!fil){if(fil)fil.hidden=true;return}fil.hidden=false;fil.innerHTML='<button type="button" data-wc="" aria-pressed="true">Alles</button>'+cs.map(function(c){return '<button type="button" data-wc="'+c+'">'+(CAT[c]||c)+'</button>'}).join("");
    fil.addEventListener("click",function(e){var b=e.target.closest("[data-wc]");if(!b)return;cur=b.getAttribute("data-wc");fil.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});teken()})}
  var lb=null,li=0;function open(i){li=i;var x=items[i];if(!x)return;if(!lb){lb=document.createElement("div");lb.className="wk-lb";lb.innerHTML='<button type="button" class="wk-x" aria-label="Sluiten">&times;</button><button type="button" class="wk-p" aria-label="Vorige">&lsaquo;</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="wk-n" aria-label="Volgende">&rsaquo;</button>';document.body.appendChild(lb);
      lb.addEventListener("click",function(e){if(e.target===lb||e.target.closest(".wk-x"))sluit();else if(e.target.closest(".wk-p"))open((li-1+items.length)%items.length);else if(e.target.closest(".wk-n"))open((li+1)%items.length)});
      document.addEventListener("keydown",function(e){if(!lb||!lb.classList.contains("aan"))return;if(e.key==="Escape")sluit();if(e.key==="ArrowLeft")open((li-1+items.length)%items.length);if(e.key==="ArrowRight")open((li+1)%items.length)})}
    var img=lb.querySelector("img");img.src=x.url;img.alt=x.titel||"";lb.querySelector("figcaption").innerHTML=(x.titel?'<b>'+esc(x.titel)+'</b>':'')+(x.plaats?'<span>'+esc(x.plaats)+'</span>':'');lb.classList.add("aan");document.documentElement.style.overflow="hidden"}
  function sluit(){if(lb){lb.classList.remove("aan");document.documentElement.style.overflow=""}}
  grid.addEventListener("click",function(e){var f=e.target.closest("[data-wi]");if(f)open(+f.getAttribute("data-wi"))});
  fetch(api).then(function(r){return r.json()}).then(function(j){items=(j&&j.items)||[];if(!items.length){sec.hidden=true;return}sec.hidden=false;filters();teken();try{fotos(items)}catch(e){}}).catch(function(){sec.hidden=true})});`;
const WEB_FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">';
/* losse pagina: voor de voorbeeldweergave en voor wie geen Framer gebruikt */
function websiteHtml(p,crm){const calc=crm?p.calc.replace(/<head([^>]*)>/i,m=>m+"<script>window.ZEEM_CRM=1<\/script>"):p.calc;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.o.naam||"mijnschoonmaker")} · Glasbewassing</title>
<meta name="description" content="Glasbewassing${p.o.plaats?" in "+esc(p.o.plaats)+" en omgeving":""}. Bereken direct uw prijs met een foto van uw woning.">${WEB_FONTS}<style>html,body{margin:0;background:#fff;scroll-behavior:smooth;overflow-x:hidden;max-width:100%}${WEB_CSS}</style></head>
<body><div class="ms">${p.body}</div><script>(function(root){${WEB_JS}})(document)<\/script><script>/* interne links: zelf scrollen (in een voorbeeldvenster zou de browser anders naar het CRM gaan) */
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href^='#']");if(!a)return;e.preventDefault();var id=a.getAttribute("href").slice(1),d=id==="top"?document.body:document.getElementById(id);var m=document.getElementById("msm");if(m)m.checked=false;if(d)d.scrollIntoView({behavior:"smooth",block:"start"})});
<\/script><script>(function(){var C=${JSON.stringify(calc).replace(/<\//g,"<\\/")};var box=document.getElementById("ms-calc"),f=document.createElement("iframe");f.title="Prijscalculator";f.setAttribute("allow","camera; web-share; clipboard-write");f.srcdoc=C;f.style.height="900px";f.style.border="0";f.style.width="1px";f.style.minWidth="100%";box.appendChild(f);
window.addEventListener("message",function(e){if(e.source!==f.contentWindow||!e.data)return;if(e.data.type==="zeem-calc-height")f.style.height=e.data.h+"px";if(e.data.type==="zeem-calc-full"){var on=!!e.data.on;f.style.cssText=on?"position:fixed;inset:0;width:100vw;height:100dvh;z-index:2147483647;border:0;background:#fff":"display:block;width:1px;min-width:100%;border:0;height:"+f.style.height;document.documentElement.style.overflow=on?"hidden":""}});
if(window.parent!==window){window.addEventListener("message",function(e){if(!e.data||!/^zeem-aanvraag/.test(e.data.type||""))return;if(e.source===f.contentWindow)parent.postMessage(e.data,"*");else if(e.source===parent)f.contentWindow.postMessage(e.data,"*")});var post=function(){parent.postMessage({type:"zeem-calc-height",h:document.documentElement.scrollHeight},"*")};new ResizeObserver(post).observe(document.body)}})()<\/script></body></html>`}
/* Framer: één code component met alles erin */
function websiteFramer(p){return `// Website ${String(p.o.naam||"mijnschoonmaker").replace(/\n/g," ")} — Framer code component (gemaakt in het CRM)
// Zo zet u hem online (ongeveer 20 minuten):
// 1. Maak een gratis account op framer.com en kies "New project" › "Blank".
// 2. Links bij Assets › Code: klik op + › "New code file" (component). Noem hem Website.
// 3. Selecteer alle voorbeeldcode (Cmd/Ctrl+A), plak dit hele bestand erover en sla op (Cmd/Ctrl+S).
// 4. Ga terug naar de pagina (Home). Sleep "Website" vanuit Assets › Code op het canvas.
// 5. Rechts bij het component: Position = Absolute uit (gewoon in de layout), Width = Fill (1fr), Height = Fit content.
//    Zet de pagina zelf op Width 1200 (Desktop) en voeg via het breakpoint-icoon Tablet en Phone toe: het component past zich aan.
// 6. Klik rechtsboven op Preview om te testen (foto maken, prijs berekenen, aanmelden).
// 7. Publish (rechtsboven). U krijgt een framer.app-adres; de site staat direct online.
// 8. Eigen domein: Site Settings › Domains › "Connect a domain you own" › vul uw domein in.
//    Zet bij uw domeinbeheerder (bijv. TransIP, Hostnet, Cloudflare) de DNS-records die Framer toont:
//    @  A      31.43.160.6        @  A      31.43.161.6        www  CNAME  sites.framer.app
//    Verwijder andere A/AAAA-records op @. Binnen een uur (soms een dag) is het domein actief, met gratis SSL.
// 9. Framer › Site Settings › General: vul Title en Description in; bij SEO & Analytics zet u Google Search Console aan.
// Verandert u later uw logo, tarieven, teksten of credits in het CRM? Download dan opnieuw en vervang de code (stap 3). Een eigen domein vereist een betaald Framer-plan (Mini/Basic).
import { useEffect, useRef } from "react"

const CSS = ${JSON.stringify(WEB_FONTS+"<style>"+WEB_CSS+"</style>")}
const BODY = ${JSON.stringify(p.body)}
const CALC = ${JSON.stringify(p.calc)}
const WEB_JS = ${JSON.stringify(WEB_JS)}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 4000
 */
export default function Website(props) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const root = ref.current
        if (!root) return
        const box = root.querySelector("#ms-calc") as HTMLDivElement
        if (!box) return
        const f = document.createElement("iframe")
        f.title = "Prijscalculator"
        f.setAttribute("allow", "camera; web-share; clipboard-write")
        f.srcdoc = CALC
        f.style.cssText = "display:block;width:1px;min-width:100%;border:0;height:900px"
        box.appendChild(f)
        let h = 900
        const on = (e: MessageEvent) => {
            if (e.source !== f.contentWindow || !e.data) return
            if (e.data.type === "zeem-calc-height") { h = e.data.h; if (!f.dataset.full) f.style.height = h + "px" }
            if (e.data.type === "zeem-calc-full") {
                const v = !!e.data.on
                f.dataset.full = v ? "1" : ""
                f.style.cssText = v
                    ? "position:fixed;inset:0;width:100vw;height:100dvh;z-index:2147483647;border:0;background:#fff"
                    : "display:block;width:1px;min-width:100%;border:0;height:" + h + "px"
                document.documentElement.style.overflow = v ? "hidden" : ""
            }
        }
        window.addEventListener("message", on)
        const klik = (e: MouseEvent) => {
            const a = (e.target as HTMLElement).closest("a[href^='#']") as HTMLAnchorElement
            if (!a) return
            const id = a.getAttribute("href")!.slice(1)
            const doel = id === "top" ? root : root.querySelector("#" + id)
            if (!doel) return
            e.preventDefault()
            const m = root.querySelector("#msm") as HTMLInputElement
            if (m) m.checked = false
            doel.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        root.addEventListener("click", klik)
        try { new Function("root", WEB_JS)(root) } catch (e) { console.warn(e) }
        return () => { window.removeEventListener("message", on); root.removeEventListener("click", klik); f.remove() }
    }, [])
    return (
        <div ref={ref} style={{ ...props.style, width: "100%" }}>
            <div dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="ms" dangerouslySetInnerHTML={{ __html: BODY }} />
        </div>
    )
}
`}
