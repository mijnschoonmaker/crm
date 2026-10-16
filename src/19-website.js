/* ---------- complete website (mijnschoonmaker.com) voor Framer: één code component, gegevens en calculator uit het CRM ---------- */
const WEB_CSS=`
.ms{--b1:#0f5f6e;--b2:#137a8a;--b3:#1d5a74;--ink:#0f1f26;--muted:#5d6f76;--line:#dde5e8;--bg:#f3f6f7;--soft:#e3f2f4;--geel:#ebbd4c;
  --blauw:radial-gradient(120% 160% at 100% 0%,#2aa3b3 0%,transparent 55%),linear-gradient(135deg,#0f5f6e,#137a8a 55%,#1d5a74);
  --lijnen:radial-gradient(circle at 18% 140%,rgb(255 255 255 / .14),transparent 45%),repeating-linear-gradient(115deg,rgb(255 255 255 / .035) 0 2px,transparent 2px 26px);
  font-family:Manrope,Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased;line-height:1.5;font-size:16px;text-align:left;width:100%;overflow-x:clip}
.ms *{box-sizing:border-box}.ms a{color:inherit;text-decoration:none}.ms img,.ms svg{display:block;max-width:100%}
.ms h1,.ms h2,.ms h3,.ms p{margin:0}.ms ul,.ms ol{margin:0;padding:0;list-style:none}
.ms .in{width:min(1140px,100% - 32px);margin:0 auto}
.ms .knop{display:inline-flex;align-items:center;justify-content:center;gap:9px;height:52px;padding:0 24px;border-radius:16px;font-weight:800;font-size:15.5px;cursor:pointer;border:0;transition:transform .15s,box-shadow .15s;white-space:nowrap}
.ms .knop:hover{transform:translateY(-2px)}.ms .knop svg{width:19px;height:19px;flex:none}
.ms .k-wit{background:#fff;color:var(--b2);box-shadow:0 14px 28px -14px rgb(0 0 0 / .55)}
.ms .k-glas{background:rgb(255 255 255 / .14);color:#fff;box-shadow:inset 0 0 0 1.5px rgb(255 255 255 / .35)}
.ms .k-teal{background:linear-gradient(135deg,#1590a2,#137a8a 55%,#11677a);color:#fff;box-shadow:0 12px 24px -12px rgb(15 95 110 / .8)}
.ms .blauw{position:relative;isolation:isolate;overflow:hidden;background:var(--blauw);color:#fff;border-radius:32px;box-shadow:0 30px 60px -34px rgb(15 70 85 / .75)}
.ms .blauw::before{content:"";position:absolute;inset:0;background:var(--lijnen);z-index:-1;pointer-events:none}
.ms .oog{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--b2)}
.ms .oog::before{content:"";width:18px;height:2px;border-radius:2px;background:currentColor}
.ms .kop{font-size:clamp(28px,3.4vw,42px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin:10px 0 12px}
.ms .lead{color:var(--muted);font-size:17px;max-width:620px}
.ms section{padding:44px 0;scroll-margin-top:72px}
/* menu */
.ms .nav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid transparent}
.ms .nav .in{display:flex;align-items:center;gap:22px;height:72px}
.ms .logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;letter-spacing:-.02em}.ms .logo img{height:38px;width:auto}
.ms .lk{display:flex;gap:22px;margin-left:auto;font-weight:700;font-size:14.5px;color:var(--muted)}.ms .lk a:hover{color:var(--ink)}.ms .lk .lk-p{display:none}.ms #msm:checked~.nav .lk .lk-p{display:block;color:var(--b2)}
.ms .nav .knop{height:44px;padding:0 18px;font-size:14.5px;border-radius:13px}
.ms .nav .portaal{font-weight:700;font-size:14.5px;color:var(--b2);display:flex;align-items:center;gap:6px}.ms .nav .portaal svg{width:17px}
.ms #msm{display:none}.ms .hb{display:none;margin-left:auto;width:44px;height:44px;border-radius:12px;background:#fff;box-shadow:0 4px 12px -6px rgb(0 0 0 / .3);align-items:center;justify-content:center;cursor:pointer}.ms .hb svg{width:22px}
/* hero */
.ms .hero{padding:18px 0 30px}
.ms .hero .blauw{display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:center;padding:60px 60px 112px}
.ms .hero h1{font-size:clamp(36px,5vw,62px);font-weight:800;letter-spacing:-.035em;line-height:1.02;margin:14px 0 16px}
.ms .hero p.sub{font-size:clamp(17px,1.6vw,20px);color:rgb(255 255 255 / .86);max-width:520px}
.ms .chip{display:inline-flex;align-items:center;gap:8px;background:rgb(255 255 255 / .14);border-radius:99px;padding:6px 14px 6px 8px;font-weight:700;font-size:13.5px}
.ms .chip.ster{padding:6px 14px;gap:7px;transition:background .15s}.ms .chip.ster:hover{background:rgb(255 255 255 / .22)}.ms .chip .st{color:#fbbc05;letter-spacing:1px;font-size:14px}.ms .chip.ster b{font-weight:800}.ms .chip i{width:22px;height:22px;border-radius:50%;background:var(--geel);display:grid;place-items:center;color:var(--b1);font-style:normal;font-size:12px}
.ms .cta{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0 22px}
.ms .vink{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:14px;font-weight:700;color:rgb(255 255 255 / .9)}.ms .vink span{display:flex;align-items:center;gap:7px}.ms .vink svg{width:16px;color:#7ee2b8}
/* nep-iPhone met het klantportaal */
.ms .tel{position:relative;width:262px;margin:0 auto;aspect-ratio:71.9/150;border-radius:44px;padding:3px;background:linear-gradient(140deg,#f2f3f4,#c3c5c8 12%,#fafafa 26%,#a9abaf 46%,#dcdddf 62%,#9a9ca0 80%,#e8e9ea);filter:drop-shadow(0 40px 40px rgb(5 40 50 / .45));transform:rotate(-2deg)}
.ms .tel .sc{position:relative;height:100%;border-radius:41px;background:#000;padding:7px}
.ms .tel .sch{position:relative;height:100%;border-radius:35px;overflow:hidden;background:#f3f6f7;display:flex;flex-direction:column;gap:9px;padding:44px 12px 14px;color:var(--ink)}
.ms .tel .eil{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:84px;height:24px;border-radius:14px;background:#000;z-index:2}
.ms .tel .sb{position:absolute;top:14px;left:26px;right:24px;display:flex;justify-content:space-between;font-size:12px;font-weight:800}
.ms .tel .sch>*{flex-shrink:0}.ms .p-kaart>div{min-width:0;line-height:1.3}.ms .p-kop{font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:0 4px}
.ms .p-hero{position:relative;overflow:hidden;border-radius:18px;background:var(--blauw);color:#fff;padding:14px;display:flex;gap:12px;align-items:center}
.ms .p-ring{width:70px;height:70px;flex:none;position:relative}.ms .p-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.ms .p-ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:22px;font-weight:800;line-height:1}.ms .p-ring b small{display:block;font-size:9px;font-weight:700;opacity:.8}
.ms .p-hero small{display:block;font-size:10px;font-weight:700;opacity:.8}.ms .p-hero strong{display:block;font-size:14px;line-height:1.25}
.ms .p-weg{position:relative;height:40px;margin:2px 4px 0}.ms .p-weg i{position:absolute;left:0;right:0;bottom:6px;height:5px;border-radius:3px;background:#dbe6e9}
.ms .p-weg .hu{position:absolute;right:0;bottom:9px;width:26px;color:var(--b2)}.ms .p-weg .bu{position:absolute;bottom:4px;left:6%;width:44px;animation:msBus 6s ease-in-out infinite alternate}
@keyframes msBus{to{left:58%}}
.ms .p-kaart{background:#fff;border-radius:14px;padding:10px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px -4px rgb(0 0 0 / .15);font-size:12px}
.ms .p-kaart b{display:block;font-size:12.5px}.ms .p-kaart span.s{color:var(--muted);font-size:11px}
.ms .p-ic{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex:none;background:var(--soft);color:var(--b2)}.ms .p-ic svg{width:16px}
.ms .p-ok{margin-left:auto;font-size:10.5px;font-weight:800;color:#1f8a5a;background:#ddf5ea;border-radius:99px;padding:3px 8px}
.ms .zweef{position:absolute;right:-26px;top:36%;background:#fff;color:var(--ink);border-radius:16px;padding:10px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 18px 30px -16px rgb(0 0 0 / .5);font-size:13px;transform:rotate(3deg);animation:msZw 4s ease-in-out infinite alternate}
.ms .zweef b{display:block;font-size:14px}.ms .zweef small{color:var(--muted)}
@keyframes msZw{to{transform:rotate(1deg) translateY(-8px)}}
/* straatje met busje */
.ms .weg{position:absolute;left:0;right:0;bottom:0;height:90px;pointer-events:none;z-index:-1}
.ms .weg .h{position:absolute;bottom:28px;transform:translateX(-50%)}.ms .weg .h svg{fill:rgb(255 255 255 / .1);stroke:rgb(255 255 255 / .22);stroke-width:.8}
.ms .weg .r{position:absolute;left:0;right:0;bottom:18px;height:9px;background:rgb(0 30 40 / .22);border-top:1px solid rgb(255 255 255 / .16)}
.ms .weg .r::after{content:"";position:absolute;left:0;right:0;top:3.5px;height:1.5px;background:repeating-linear-gradient(90deg,rgb(255 255 255 / .5) 0 14px,transparent 14px 28px)}
.ms .weg .bus{position:absolute;bottom:21px;left:-80px;width:64px;animation:msRij 18s linear infinite;animation-delay:var(--d,0s);filter:drop-shadow(0 4px 5px rgb(0 0 0 / .35)) brightness(1.15)}
@keyframes msRij{to{left:calc(100% + 20px)}}
.ms .rv-wiel{transform-box:fill-box;transform-origin:center;animation:msWiel .6s linear infinite}@keyframes msWiel{to{transform:rotate(360deg)}}
/* stappen */
.ms .route{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:30px;position:relative}
.ms .route::before{content:"";position:absolute;left:12%;right:12%;top:31px;border-top:2.5px dashed #b9d3d9}
.ms .stap{position:relative;background:#fff;border-radius:22px;padding:22px;box-shadow:0 14px 34px -26px rgb(15 70 85 / .6)}
.ms .stap .n{width:62px;height:62px;border-radius:20px;background:var(--blauw);color:#fff;display:grid;place-items:center;margin:-2px 0 16px;box-shadow:0 10px 20px -10px rgb(15 95 110 / .8)}.ms .stap .n svg{width:28px}
.ms .stap small{font-size:12px;font-weight:800;color:var(--b2)}.ms .stap h3{font-size:18px;font-weight:800;letter-spacing:-.01em;margin:2px 0 6px}.ms .stap p{color:var(--muted);font-size:14.5px}
/* tegels op blauw */
.ms .band{padding:46px 46px 50px}
.ms .band .kop{color:#fff}.ms .band .lead{color:rgb(255 255 255 / .8)}.ms .band .oog{color:#a5f0f7}
.ms .tegels{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:28px}
.ms .tg{background:rgb(255 255 255 / .1);border:1px solid rgb(255 255 255 / .16);border-radius:20px;padding:20px;backdrop-filter:blur(6px)}
.ms .tg .ic{width:42px;height:42px;border-radius:13px;background:#fff;color:var(--b2);display:grid;place-items:center;margin-bottom:14px}.ms .tg .ic svg{width:21px}
.ms .tg h3{font-size:16.5px;font-weight:800;margin-bottom:4px}.ms .tg p{font-size:14px;color:rgb(255 255 255 / .78)}
/* klantportaal: ticket */
.ms .duo{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.ms .lijst{display:flex;flex-direction:column;gap:12px;margin-top:22px}.ms .lijst li{display:flex;gap:12px;align-items:flex-start;font-size:15.5px}
.ms .lijst li i{width:26px;height:26px;border-radius:50%;background:var(--soft);color:var(--b2);display:grid;place-items:center;flex:none;font-style:normal;margin-top:-1px}.ms .lijst li i svg{width:14px}
.ms .lijst b{display:block}.ms .lijst span{color:var(--muted);font-size:14.5px}
/* calculator */
.ms .calc{background:#fff;border-radius:32px;padding:10px;box-shadow:0 30px 60px -40px rgb(15 70 85 / .6)}
.ms .calc-k{padding:34px 30px 6px;text-align:center}.ms .calc-k .lead{margin:0 auto}
.ms #ms-calc{min-height:600px}.ms #ms-calc iframe{display:block;width:1px;min-width:100%;border:0;background:transparent}
/* zakelijk */
.ms .zak{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:center;background:#fff;border-radius:28px;padding:34px 38px;box-shadow:0 14px 34px -26px rgb(15 70 85 / .6)}
.ms .zak .tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.ms .zak .tags span{background:var(--soft);color:var(--b1);border-radius:99px;padding:6px 12px;font-weight:700;font-size:13.5px}
.ms .zak .r{display:flex;justify-content:flex-end}
/* vragen */
.ms .faq{display:flex;flex-direction:column;gap:10px;margin-top:26px;max-width:820px}
/* ons werk */
.ms .wk-filter{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 0}.ms .wk-filter button{border:1.5px solid var(--line);background:#fff;color:var(--ink);font:700 13.5px Manrope,sans-serif;padding:8px 14px;border-radius:99px;cursor:pointer}.ms .wk-filter button[aria-pressed="true"]{background:var(--b2);border-color:var(--b2);color:#fff}
.ms .wk-grid{columns:3;column-gap:14px;margin-top:22px}
.ms .wk-it{break-inside:avoid;margin:0 0 14px;position:relative;border-radius:18px;overflow:hidden;background:var(--soft);cursor:zoom-in;box-shadow:0 1px 2px rgb(15 31 38 / .05),0 16px 32px -22px rgb(15 50 60 / .45)}
.ms .wk-it img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s}.ms .wk-it:hover img{transform:scale(1.03)}
.ms .wk-it figcaption{position:absolute;left:0;right:0;bottom:0;padding:34px 14px 12px;color:#fff;background:linear-gradient(180deg,transparent,rgb(15 31 38 / .65));display:flex;flex-direction:column;gap:1px;pointer-events:none}.ms .wk-it figcaption:empty{display:none}
.ms .wk-it b{font-size:14.5px}.ms .wk-it span{font-size:12.5px;opacity:.85}
.wk-lb{position:fixed;inset:0;z-index:99999;background:rgb(8 20 24 / .92);display:none;align-items:center;justify-content:center;padding:20px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}.wk-lb.aan{display:flex}
.wk-lb figure{margin:0;max-width:min(1400px,100%);max-height:100%;display:flex;flex-direction:column;align-items:center;gap:10px}.wk-lb img{max-width:100%;max-height:calc(100vh - 90px);border-radius:14px;box-shadow:0 30px 80px -30px rgb(0 0 0 / .8)}
.wk-lb figcaption{color:#fff;text-align:center;font-family:Manrope,sans-serif}.wk-lb figcaption b{display:block;font-size:16px}.wk-lb figcaption span{font-size:13px;opacity:.75}
.wk-lb button{position:absolute;background:rgb(255 255 255 / .12);color:#fff;border:1px solid rgb(255 255 255 / .25);width:46px;height:46px;border-radius:50%;font-size:28px;line-height:1;cursor:pointer;display:grid;place-items:center}
.wk-lb .wk-x{top:16px;right:16px}.wk-lb .wk-p{left:16px;top:50%;transform:translateY(-50%)}.wk-lb .wk-n{right:16px;top:50%;transform:translateY(-50%)}
@media (max-width:900px){.ms .wk-grid{columns:2}}@media (max-width:560px){.ms .wk-grid{columns:1}.wk-lb .wk-p,.wk-lb .wk-n{top:auto;bottom:16px;transform:none}}
/* betalen */
.ms .bt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:28px}
.ms .bt{background:#fff;border-radius:20px;padding:22px;box-shadow:0 1px 2px rgb(15 31 38 / .05),0 16px 32px -22px rgb(15 50 60 / .45)}
.ms .bt .ic{width:42px;height:42px;border-radius:13px;background:var(--soft);color:var(--b2);display:grid;place-items:center;margin-bottom:14px}.ms .bt .ic svg{width:21px;height:21px}
.ms .bt h3{font-size:16.5px;font-weight:800;margin-bottom:4px}.ms .bt p{font-size:14px;color:var(--muted)}
.ms .bt-demo{margin-top:22px;display:flex;justify-content:center}
.ms .bt-f{width:min(520px,100%);background:#fff;border-radius:22px;box-shadow:0 1px 2px rgb(15 31 38 / .05),0 24px 44px -26px rgb(15 50 60 / .55);overflow:hidden}
.ms .bt-fh{display:flex;align-items:center;gap:12px;padding:16px 18px;color:#fff;background:var(--blauw);position:relative}.ms .bt-fh::before{content:"";position:absolute;inset:0;background:var(--lijnen);pointer-events:none}.ms .bt-fh>*{position:relative}
.ms .bt-fh b{display:block;font-size:15.5px}.ms .bt-fh small{font-size:12.5px;opacity:.8}.ms .bt-fh>div{flex:1}
.ms .bt-ic{width:40px;height:40px;border-radius:12px;background:rgb(255 255 255 / .16);border:1px solid rgb(255 255 255 / .25);display:grid;place-items:center}.ms .bt-ic svg{width:19px;height:19px}
.ms .bt-pil{font-size:12px;font-weight:800;padding:5px 11px;border-radius:999px;background:#2bb673;color:#fff}
.ms .bt-r{display:flex;justify-content:space-between;padding:12px 18px;border-top:1px solid var(--line);font-size:14.5px}.ms .bt-r:first-of-type{border-top:0}.ms .bt-r.kort b{color:#1f8a5c}.ms .bt-r.tot{font-weight:800;font-size:16px}
.ms .bt-ok{display:flex;align-items:center;gap:8px;padding:12px 18px;background:#e0f3e9;color:#1b6b48;font-weight:700;font-size:13.5px}.ms .bt-ok svg{width:16px;height:16px}
/* credits */
.ms .cr4{grid-template-columns:repeat(4,1fr)}
.ms .tg{position:relative}.ms .cr-n{position:absolute;top:18px;right:18px;font-style:normal;font-weight:800;font-size:14px;padding:5px 10px;border-radius:999px;background:#fff;color:var(--b2)}.ms .cr-n::after{content:" cr";font-size:11px;opacity:.7}
/* dienstenwebshop-kop */
.ms .ws-kop{margin-bottom:22px}
/* vve */
.ms .vve{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;background:#fff;border-radius:28px;padding:34px 38px;margin-top:16px;box-shadow:0 14px 34px -26px rgb(15 50 60 / .5)}
.ms .vve-k h3{font-size:clamp(22px,2.4vw,28px);font-weight:800;letter-spacing:-.025em;line-height:1.15;margin:10px 0 10px}.ms .vve-k h3 em{font-style:normal;color:var(--b2)}.ms .vve-k p{color:var(--muted);font-size:15.5px}
.ms .vve-l{display:flex;flex-direction:column;gap:12px}.ms .vve-l li{display:flex;gap:12px;align-items:flex-start;font-size:15px}
.ms .vve-l li i{width:38px;height:38px;border-radius:12px;background:var(--soft);color:var(--b2);display:grid;place-items:center;flex:none;font-style:normal}.ms .vve-l li i svg{width:18px;height:18px}
.ms .vve-l b{display:block}.ms .vve-l span{color:var(--muted);font-size:14px}
@media (max-width:900px){.ms .bt-grid{grid-template-columns:1fr}.ms .cr4{grid-template-columns:1fr 1fr}.ms .vve{grid-template-columns:1fr;padding:24px}}
@media (max-width:560px){.ms .cr4{grid-template-columns:1fr}.ms .cr-n{position:static;display:inline-block;margin-bottom:8px}}
.ms details{background:#fff;border-radius:18px;padding:0 20px;box-shadow:0 8px 24px -20px rgb(15 70 85 / .6)}
.ms summary{list-style:none;cursor:pointer;padding:18px 0;font-weight:800;font-size:16px;display:flex;justify-content:space-between;gap:12px;align-items:center}
.ms summary::-webkit-details-marker{display:none}
.ms summary::after{content:"+";width:30px;height:30px;border-radius:50%;background:var(--soft);color:var(--b2);display:grid;place-items:center;font-size:20px;font-weight:600;flex:none;transition:transform .2s}
.ms details[open] summary::after{transform:rotate(45deg)}
.ms details p{color:var(--muted);padding:0 0 18px;font-size:15px;max-width:700px}
/* contact + voet */
.ms .contact{display:grid;grid-template-columns:1.2fr 1fr;gap:26px;align-items:center;padding:48px 50px 120px}
.ms .contact h2{font-size:clamp(28px,3.4vw,40px);font-weight:800;letter-spacing:-.03em;line-height:1.1}
.ms .contact p{color:rgb(255 255 255 / .82);margin-top:10px}
.ms .ck{display:flex;flex-direction:column;gap:10px}
.ms .ck a{display:flex;align-items:center;gap:12px;background:#fff;color:var(--ink);border-radius:16px;padding:12px 14px;font-weight:800;font-size:15px;line-height:1.25;box-shadow:0 12px 24px -14px rgb(0 0 0 / .45);transition:transform .15s}
.ms .ck a:hover{transform:translateY(-2px)}.ms .ck a span.ic{width:36px;height:36px;border-radius:11px;background:var(--soft);color:var(--b2);display:grid;place-items:center;flex:none}.ms .ck a span.ic svg{width:18px}
.ms .ck a small{display:block;color:var(--muted);font-weight:600;font-size:13px;margin-top:2px}.ms .ck a::after{content:"›";margin-left:auto;color:#9fb3ba;font-size:22px;line-height:1}
.ms footer{padding:26px 0 40px;color:var(--muted);font-size:13.5px}.ms footer .in{display:flex;flex-wrap:wrap;gap:10px 22px;justify-content:space-between}.ms footer a{text-decoration:underline}
.ms .wa{position:fixed;right:18px;bottom:18px;z-index:30;width:58px;height:58px;border-radius:50%;background:#25d366;color:#fff;display:grid;place-items:center;box-shadow:0 12px 26px -10px rgb(0 0 0 / .5)}.ms .wa svg{width:30px}
/* nooit breder dan het scherm: lange woorden (e-mail) mogen afbreken */
.ms .hero .blauw>*,.ms .duo>*,.ms .zak>*,.ms .contact>*,.ms .route>*,.ms .tegels>*{min-width:0}
.ms .ck a>div{min-width:0;flex:1}.ms .ck a small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ms h1,.ms h2,.ms h3,.ms p,.ms .lead{overflow-wrap:break-word}
@media (max-width:360px){.ms .ck a::after{display:none}.ms .ck a small{font-size:12px;white-space:normal;overflow-wrap:anywhere}.ms .contact{padding-left:16px!important;padding-right:16px!important}}
@media (prefers-reduced-motion:reduce){.ms *{animation:none!important}}
@media (max-width:980px){.ms .lk,.ms .nav .portaal{display:none}.ms .hb{display:flex;margin-left:0}.ms .nav .knop{margin-left:auto}
  .ms #msm:checked~.nav .lk{display:flex;position:absolute;top:64px;left:16px;right:16px;flex-direction:column;gap:0;background:#fff;border-radius:18px;padding:8px;box-shadow:0 20px 40px -20px rgb(0 0 0 / .4)}
  .ms #msm:checked~.nav .lk a{padding:12px 14px;color:var(--ink)}.ms .route{grid-template-columns:repeat(2,minmax(0,1fr))}.ms .route::before{display:none}.ms .tegels{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:760px){
  .ms .route,.ms .tegels,.ms .duo,.ms .zak,.ms .contact{grid-template-columns:minmax(0,1fr)!important}
  .ms .hero .blauw{grid-template-columns:minmax(0,1fr)!important}
  .ms .nav .in{height:64px}.ms .nav .knop{display:none}.ms .hb{display:flex;margin-left:auto}
  .ms #msm:checked~.nav .lk{display:flex;position:absolute;top:64px;left:16px;right:16px;flex-direction:column;gap:0;background:#fff;border-radius:18px;padding:8px;box-shadow:0 20px 40px -20px rgb(0 0 0 / .4)}
  .ms #msm:checked~.nav .lk a{padding:12px 14px;color:var(--ink)}
  .ms .hero .blauw{grid-template-columns:1fr;padding:34px 22px 110px;border-radius:26px}
  .ms .tel{width:246px}.ms .zweef{right:auto;left:-4px;top:auto;bottom:3%}.ms #ms-calc{margin:0 -16px}
  .ms .blauw{border-radius:26px}.ms section{padding:30px 0}
  .ms .route,.ms .tegels,.ms .duo,.ms .zak,.ms .contact{grid-template-columns:1fr}
  .ms .band{padding:30px 20px 34px}.ms .zak{padding:26px 22px}.ms .zak .r{justify-content:stretch}.ms .zak .r .knop{width:100%}
  .ms .contact{padding:32px 20px 110px}.ms .ck a{font-size:14px;padding:11px 12px;gap:10px}.ms .ck a span.ic{width:32px;height:32px;border-radius:10px}.ms .ck a span.ic svg{width:16px}.ms .ck a small{font-size:12.5px}.ms .calc-k{padding:24px 14px 4px}.ms .calc{border-radius:24px;padding:4px}
  .ms .cta .knop{flex:1}.ms .weg .h:nth-child(even){display:none}
}
/* ---- tekst in CRM-stijl ---- */
.ms{font-size:15.5px;line-height:1.55;letter-spacing:-.003em}
.ms p,.ms .lead,.ms li span{text-wrap:pretty}
.ms .kop,.ms h1,.ms h2,.ms h3{text-wrap:balance}
.ms .oog{gap:7px;font-size:12px;letter-spacing:.09em}
.ms .oog::before{display:none}.ms .oog svg{width:15px;height:15px;flex:none}
.ms .kop{font-size:clamp(28px,3.3vw,40px);letter-spacing:-.035em;line-height:1.08;margin:10px 0 12px}
.ms .kop em,.ms .hero h1 em,.ms .contact h2 em{font-style:normal;color:var(--b2)}
.ms .band .kop em,.ms .hero h1 em,.ms .contact h2 em{color:#a5f0f7}
.ms .hero h1{letter-spacing:-.045em;line-height:1}
.ms .lead{font-size:16.5px;line-height:1.6;color:var(--muted)}
.ms .stap small{font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.04em;text-transform:uppercase}
.ms .stap small b,.ms .chip.ster b,.ms .ck a small,.ms .p-ring b{font-family:"IBM Plex Mono","SF Mono",ui-monospace,Menlo,monospace}
.ms .stap small b{color:var(--b2);font-weight:600}
.ms .stap h3,.ms .tg h3{letter-spacing:-.02em}.ms .stap p,.ms .tg p{line-height:1.55}
.ms summary{letter-spacing:-.01em}.ms details p{line-height:1.6}
.ms .tags span,.ms .vink span{letter-spacing:-.005em}
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
.ms .pp-hk{display:flex;gap:12px;align-items:flex-start}.ms .pp-hk>div:first-child{flex:1;min-width:0}
.ms .pp-k{margin:0;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgb(255 255 255 / .8);display:flex;align-items:center;gap:8px}
.ms .pp-puls{width:8px;height:8px;border-radius:50%;background:#9ff0d2;box-shadow:0 0 0 0 rgb(159 240 210 / .6);animation:ppPuls 1.8s infinite}
@keyframes ppPuls{70%{box-shadow:0 0 0 8px rgb(159 240 210 / 0)}100%{box-shadow:0 0 0 0 rgb(159 240 210 / 0)}}
.ms .pp-adr{display:inline-flex;align-items:center;gap:6px;margin:10px 0 8px;padding:5px 11px 5px 8px;border-radius:999px;background:rgb(255 255 255 / .14);box-shadow:inset 0 0 0 1px rgb(255 255 255 / .22);font-size:13px;font-weight:600;max-width:100%;white-space:nowrap;overflow:hidden}
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
@media (max-width:420px){.ms .pp{border-radius:40px}.ms .pp-hero h3{font-size:21px}}
/* ---- bonnetje met echte scheur ---- */
.ms .tk{--h:13px;position:relative;max-width:470px;margin:0 auto;display:grid;grid-template-columns:1fr 112px;transform:rotate(-2.5deg);filter:drop-shadow(0 24px 28px rgb(15 70 85 / .3));cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
.ms .tk-l,.ms .tk-r{-webkit-mask:radial-gradient(circle var(--h) at var(--mx) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle var(--h) at var(--mx) 100%,#0000 97%,#000) bottom/100% 51% no-repeat;mask:radial-gradient(circle var(--h) at var(--mx) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle var(--h) at var(--mx) 100%,#0000 97%,#000) bottom/100% 51% no-repeat}
.ms .tk-l{--mx:calc(100% - 6px);position:relative;z-index:1;margin-right:-6px;background:linear-gradient(180deg,#fff,#fbfcfc);border-radius:20px 0 0 20px;padding:22px 26px 18px 22px}
.ms .tk-r{--mx:0px;position:relative;z-index:2;overflow:hidden;background:var(--blauw);color:#fff;border-radius:0 20px 20px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:14px 8px;transform-origin:0 0}
.ms .tk-r::before{content:"";position:absolute;inset:0;background:var(--lijnen);pointer-events:none}
.ms .tk-r::after{content:"";position:absolute;left:0;top:var(--h);bottom:var(--h);width:2px;background:radial-gradient(circle,rgb(255 255 255 / .55) 1.2px,transparent 1.6px) 0 0/2px 7px repeat-y}
.ms .tk-r small{position:relative;font-size:10.5px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.1em}
.ms .tk-r b{position:relative;font-family:"IBM Plex Mono","SF Mono",ui-monospace,Menlo,monospace;font-size:38px;font-weight:600;line-height:1.05;letter-spacing:-.02em}
.ms .tk-v{position:absolute;right:6px;top:50%;transform:translateY(-50%) rotate(90deg);transform-origin:center;font-size:8.5px;letter-spacing:.24em;text-transform:uppercase;opacity:.45;white-space:nowrap;right:-18px}
.ms .tk-top{display:flex;gap:12px;align-items:center}
.ms .tk-ic{width:40px;height:40px;border-radius:12px;background:var(--soft);color:var(--b2);display:grid;place-items:center;flex:none}.ms .tk-ic svg{width:20px}
.ms .tk-top small{display:block;font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.09em}
.ms .tk-top b{display:block;font-size:19px;font-weight:800;letter-spacing:-.025em;line-height:1.15}
.ms .tk-dl{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 14px;margin:16px 0 14px;padding:14px 0 0;border-top:1.5px dashed var(--line)}
.ms .tk-dl dt{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em}
.ms .tk-dl dd{margin:2px 0 0;font-family:"IBM Plex Mono","SF Mono",ui-monospace,Menlo,monospace;font-size:14px;font-weight:500;color:var(--ink)}
.ms .tk-bar{display:flex;align-items:center;gap:12px;padding-top:12px;border-top:1.5px dashed var(--line)}
.ms .tk-bar>div{display:flex;flex-direction:column;gap:4px;width:46%;max-width:160px}.ms .tk-bar i{display:block;width:100%;height:30px;background:repeating-linear-gradient(90deg,var(--ink) 0 2px,transparent 2px 4px,var(--ink) 4px 5px,transparent 5px 8px,var(--ink) 8px 11px,transparent 11px 12px,var(--ink) 12px 13px,transparent 13px 16px);opacity:.82;border-radius:2px}
.ms .tk-bar code{font-size:9.5px!important;white-space:nowrap;font-family:"IBM Plex Mono","SF Mono",ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:.14em;color:var(--muted)}
.ms .stempel{position:absolute;right:22px;bottom:18px;display:inline-flex;align-items:center;gap:6px;border:2.5px solid #1f8a5a;color:#1f8a5a;border-radius:10px;padding:4px 11px;font-weight:800;font-size:13px;letter-spacing:.12em;text-transform:uppercase;transform:rotate(-12deg) scale(1.9);opacity:0;mix-blend-mode:multiply;
  -webkit-mask:radial-gradient(circle at 30% 40%,#000 55%,rgb(0 0 0 / .75) 70%,#000 85%);mask:radial-gradient(circle at 30% 40%,#000 55%,rgb(0 0 0 / .75) 70%,#000 85%)}
.ms .stempel svg{width:14px;stroke-width:3}
.ms .tk-hint{text-align:center;font-size:12.5px;color:var(--muted);margin-top:26px;opacity:0;transition:opacity .4s 1.8s}
.ms .tk.af+.tk-hint{opacity:1}
.ms .tk.af .tk-l{animation:tkSchok .55s ease .55s}
@keyframes tkSchok{0%,100%{transform:none}30%{transform:translateX(-5px) rotate(-.8deg)}65%{transform:translateX(2px) rotate(.3deg)}}
.ms .tk.af .stempel{animation:tkStempel .32s cubic-bezier(.2,1.6,.4,1) 1.05s forwards}
@keyframes tkStempel{to{transform:rotate(-12deg) scale(1);opacity:.9}}
.ms .tk-snipper{position:absolute;width:3px;height:3px;border-radius:1px;background:#fff;pointer-events:none;z-index:4;box-shadow:0 0 0 .5px rgb(0 0 0 / .08)}
@media (max-width:760px){.ms .tk{grid-template-columns:1fr 92px}.ms .tk-l{padding:18px 20px 16px 18px}.ms .tk-top b{font-size:17px}.ms .tk-dl dd{font-size:13px}.ms .tk-r b{font-size:30px}.ms .stempel{right:12px;bottom:16px;font-size:10.5px;padding:3px 8px}}
.ms .tk-r{will-change:transform;touch-action:none;cursor:grab}.ms .tk-r:active{cursor:grabbing}
.ms .tk-vz{position:absolute;left:0;top:0;bottom:0;width:9px;z-index:3;background:linear-gradient(90deg,#fff,#eef6f7);filter:blur(.25px);pointer-events:none}
.ms .tk-l{transition:none}.ms .tk.bezig .tk-r::after{opacity:0}.ms .tk-vz{opacity:0}.ms .tk.bezig .tk-vz{opacity:1}
.ms .tk.af .tk-l{animation:tkSchok .5s ease}
.ms .tk.af .stempel{animation:tkStempel .32s cubic-bezier(.2,1.6,.4,1) .35s forwards}
.ms .tk-hint{transition-delay:.8s}
@media (prefers-reduced-motion:reduce){.ms .tk.af .stempel{animation:none;opacity:.9;transform:rotate(-12deg)}}
`;

const PP_AUTO='<svg aria-hidden="true" viewBox="0 0 64 40"><defs><linearGradient id="ppzb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26adc2"/><stop offset="1" stop-color="#11778c"/></linearGradient><linearGradient id="ppzg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eafcff"/><stop offset="1" stop-color="#86c9d5"/></linearGradient></defs><g stroke="#9fb3ba" stroke-width="1.4" stroke-linecap="round"><path d="M8 7.5H40"/><path d="M11 7.5V4.8M17 7.5V4.8M23 7.5V4.8M29 7.5V4.8M35 7.5V4.8"/><path d="M8 4.8H40"/></g><path d="M5 12a3.5 3.5 0 0 1 3.5-3.5H40c2 0 3.6.8 4.8 2.3l7.4 9.2 5.6 1.8c1.6.5 2.7 2 2.7 3.7V30a2 2 0 0 1-2 2H5z" fill="url(#ppzb)"/><path d="M42.5 12.5h1.6c.8 0 1.5.4 2 1l5.2 6.8H42.5z" fill="url(#ppzg)" stroke="#0b4552" stroke-width=".8"/><rect x="30" y="12.5" width="9.5" height="7.6" rx="1.4" fill="url(#ppzg)" stroke="#0b4552" stroke-width=".8"/><path d="M5 23.5h55" stroke="#0e6476" stroke-width=".8" opacity=".6"/><path d="M7 20.5h22" stroke="#7fe0ee" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><rect x="57" y="23.5" width="3.2" height="2.2" rx="1" fill="#fffbe0"/><circle cx="16" cy="32" r="5.6" fill="#1d2a30"/><circle cx="16" cy="32" r="2.4" fill="#c8d3d7"/><circle cx="49" cy="32" r="5.6" fill="#1d2a30"/><circle cx="49" cy="32" r="2.4" fill="#c8d3d7"/></svg>',PP_BUS='<svg aria-hidden="true" viewBox="0 0 40 72"><defs><linearGradient id="pplvb" x1="0" x2="1"><stop offset="0" stop-color="#0d5a6b"/><stop offset=".22" stop-color="#1b93a8"/><stop offset=".5" stop-color="#22a6bc"/><stop offset=".78" stop-color="#1b93a8"/><stop offset="1" stop-color="#0d5a6b"/></linearGradient><linearGradient id="pplvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9fbff"/><stop offset="1" stop-color="#7cc3d0"/></linearGradient><linearGradient id="pplvr" x1="0" x2="1"><stop offset="0" stop-color="#1688a0"/><stop offset=".5" stop-color="#2bb3c8"/><stop offset="1" stop-color="#1688a0"/></linearGradient></defs><ellipse cx="5.2" cy="18" rx="2.4" ry="1.6" fill="#0b4552"/><ellipse cx="34.8" cy="18" rx="2.4" ry="1.6" fill="#0b4552"/><rect x="6" y="3" width="28" height="66" rx="9" fill="url(#pplvb)"/><path d="M9 7.5Q20 2.8 31 7.5" stroke="#5fd2e3" stroke-width="1.2" fill="none" opacity=".8"/><rect x="9.5" y="4.2" width="4.5" height="2" rx="1" fill="#fffbe0"/><rect x="26" y="4.2" width="4.5" height="2" rx="1" fill="#fffbe0"/><path d="M9.2 15.5Q20 11.8 30.8 15.5L29.2 25H10.8z" fill="url(#pplvg)" stroke="#0b4552" stroke-width=".9"/><path d="M12 16.6Q16 15 19 14.8L18 18.5Q15 18.7 12.6 19.6z" fill="#fff" opacity=".7"/><rect x="9.8" y="27" width="20.4" height="38" rx="4.2" fill="url(#pplvr)"/><g stroke="#eef4f6" stroke-linecap="round"><path d="M15 29.5V62.5M25 29.5V62.5" stroke-width="1.7"/><path d="M15 33.5H25M15 38.5H25M15 43.5H25M15 48.5H25M15 53.5H25M15 58.5H25" stroke-width="1.2"/></g><rect x="11" y="66" width="18" height="1.6" rx=".8" fill="#ff6b5e" opacity=".9"/></svg>';
const PP_KAART='<svg class="pp-kaart" viewBox="0 0 360 210" preserveAspectRatio="none" aria-hidden="true"><rect width="360" height="210" fill="#eef0ec"/><path d="M262 128H352V202H262z" fill="#d9e8d3"/><circle cx="300" cy="160" r="5" fill="#cfe1c8"/><circle cx="325" cy="182" r="7" fill="#cfe1c8"/><circle cx="285" cy="186" r="4" fill="#cfe1c8"/><path d="M0 62C30 58 50 70 80 64" fill="none" stroke="#cfe0e8" stroke-width="7" stroke-linecap="round"/><g fill="#e2e2dd" stroke="#d3d3cc" stroke-width=".6"><rect x="2.0" y="0.2" width="9" height="8" rx="1"/><rect x="0.2" y="13.5" width="10" height="9" rx="1"/><rect x="0.2" y="24.3" width="11" height="8" rx="1"/><rect x="1.9" y="37.7" width="8" height="7" rx="1"/><rect x="2.9" y="48.1" width="11" height="7" rx="1"/><rect x="0.4" y="72.9" width="9" height="9" rx="1"/><rect x="0.3" y="98.1" width="9" height="8" rx="1"/><rect x="1.7" y="133.6" width="9" height="7" rx="1"/><rect x="2.1" y="205.8" width="10" height="8" rx="1"/><rect x="15.5" y="2.8" width="11" height="7" rx="1"/><rect x="15.2" y="12.9" width="8" height="7" rx="1"/><rect x="15.1" y="26.7" width="11" height="8" rx="1"/><rect x="13.5" y="36.4" width="11" height="8" rx="1"/><rect x="14.2" y="72.8" width="9" height="8" rx="1"/><rect x="13.8" y="85.2" width="11" height="9" rx="1"/><rect x="13.5" y="96.5" width="11" height="7" rx="1"/><rect x="15.6" y="134.9" width="9" height="9" rx="1"/><rect x="15.7" y="146.3" width="8" height="8" rx="1"/><rect x="14.3" y="192.3" width="8" height="7" rx="1"/><rect x="14.7" y="205.6" width="8" height="7" rx="1"/><rect x="27.8" y="12.4" width="8" height="7" rx="1"/><rect x="27.1" y="24.4" width="10" height="9" rx="1"/><rect x="28.5" y="72.5" width="10" height="8" rx="1"/><rect x="28.1" y="86.7" width="10" height="7" rx="1"/><rect x="27.6" y="133.5" width="9" height="9" rx="1"/><rect x="28.5" y="146.2" width="9" height="7" rx="1"/><rect x="28.2" y="159.0" width="11" height="8" rx="1"/><rect x="39.7" y="0.7" width="10" height="7" rx="1"/><rect x="40.9" y="14.7" width="9" height="8" rx="1"/><rect x="39.3" y="38.0" width="10" height="9" rx="1"/><rect x="41.4" y="85.0" width="9" height="8" rx="1"/><rect x="39.5" y="134.7" width="9" height="7" rx="1"/><rect x="41.8" y="156.5" width="11" height="9" rx="1"/><rect x="40.5" y="206.3" width="9" height="8" rx="1"/><rect x="52.2" y="2.2" width="11" height="7" rx="1"/><rect x="52.4" y="24.5" width="11" height="9" rx="1"/><rect x="53.8" y="38.3" width="11" height="7" rx="1"/><rect x="53.5" y="73.7" width="8" height="7" rx="1"/><rect x="53.6" y="134.6" width="9" height="9" rx="1"/><rect x="52.2" y="194.0" width="9" height="8" rx="1"/><rect x="65.8" y="12.4" width="10" height="7" rx="1"/><rect x="67.7" y="24.5" width="8" height="8" rx="1"/><rect x="67.1" y="39.0" width="9" height="7" rx="1"/><rect x="66.1" y="48.3" width="11" height="7" rx="1"/><rect x="67.9" y="72.3" width="10" height="9" rx="1"/><rect x="65.8" y="96.1" width="8" height="7" rx="1"/><rect x="66.0" y="144.8" width="11" height="9" rx="1"/><rect x="65.8" y="192.4" width="9" height="7" rx="1"/><rect x="66.9" y="204.1" width="11" height="8" rx="1"/><rect x="106.0" y="2.1" width="10" height="8" rx="1"/><rect x="105.4" y="13.5" width="9" height="7" rx="1"/><rect x="106.8" y="60.1" width="10" height="7" rx="1"/><rect x="105.2" y="74.7" width="11" height="8" rx="1"/><rect x="106.2" y="96.8" width="8" height="7" rx="1"/><rect x="104.0" y="133.5" width="8" height="7" rx="1"/><rect x="104.4" y="145.0" width="10" height="9" rx="1"/><rect x="105.0" y="157.0" width="10" height="7" rx="1"/><rect x="106.6" y="192.8" width="11" height="8" rx="1"/><rect x="106.8" y="204.7" width="10" height="9" rx="1"/><rect x="119.3" y="2.4" width="10" height="7" rx="1"/><rect x="118.2" y="14.6" width="8" height="9" rx="1"/><rect x="117.2" y="26.8" width="9" height="9" rx="1"/><rect x="118.2" y="60.8" width="9" height="8" rx="1"/><rect x="119.0" y="72.9" width="10" height="8" rx="1"/><rect x="117.5" y="84.5" width="11" height="7" rx="1"/><rect x="117.7" y="98.7" width="11" height="9" rx="1"/><rect x="117.7" y="132.8" width="8" height="8" rx="1"/><rect x="119.6" y="145.1" width="8" height="9" rx="1"/><rect x="131.2" y="1.3" width="9" height="8" rx="1"/><rect x="130.2" y="62.8" width="11" height="7" rx="1"/><rect x="130.7" y="84.3" width="11" height="8" rx="1"/><rect x="132.1" y="98.5" width="8" height="9" rx="1"/><rect x="131.9" y="145.6" width="10" height="7" rx="1"/><rect x="130.2" y="157.6" width="8" height="7" rx="1"/><rect x="130.7" y="206.9" width="9" height="9" rx="1"/><rect x="143.1" y="1.5" width="10" height="7" rx="1"/><rect x="143.8" y="14.0" width="11" height="7" rx="1"/><rect x="145.9" y="60.9" width="9" height="8" rx="1"/><rect x="145.3" y="84.9" width="9" height="8" rx="1"/><rect x="145.1" y="132.6" width="11" height="7" rx="1"/><rect x="143.3" y="144.2" width="10" height="9" rx="1"/><rect x="145.0" y="157.6" width="9" height="7" rx="1"/><rect x="143.2" y="192.2" width="8" height="7" rx="1"/><rect x="145.9" y="204.6" width="8" height="9" rx="1"/><rect x="156.3" y="2.1" width="10" height="8" rx="1"/><rect x="157.0" y="14.2" width="11" height="7" rx="1"/><rect x="158.4" y="26.3" width="11" height="7" rx="1"/><rect x="158.1" y="72.9" width="10" height="9" rx="1"/><rect x="158.3" y="86.7" width="8" height="9" rx="1"/><rect x="158.5" y="96.3" width="8" height="7" rx="1"/><rect x="156.0" y="134.8" width="11" height="7" rx="1"/><rect x="156.7" y="146.6" width="9" height="9" rx="1"/><rect x="157.5" y="194.1" width="8" height="8" rx="1"/><rect x="157.3" y="205.9" width="9" height="7" rx="1"/><rect x="169.9" y="1.7" width="8" height="8" rx="1"/><rect x="170.3" y="12.6" width="10" height="7" rx="1"/><rect x="169.6" y="24.2" width="10" height="9" rx="1"/><rect x="169.4" y="96.6" width="10" height="7" rx="1"/><rect x="170.9" y="134.1" width="8" height="7" rx="1"/><rect x="170.0" y="144.1" width="8" height="8" rx="1"/><rect x="169.3" y="193.2" width="8" height="8" rx="1"/><rect x="169.5" y="206.1" width="8" height="9" rx="1"/><rect x="182.9" y="2.9" width="10" height="9" rx="1"/><rect x="183.2" y="14.6" width="10" height="8" rx="1"/><rect x="184.3" y="60.4" width="10" height="8" rx="1"/><rect x="184.4" y="73.2" width="9" height="9" rx="1"/><rect x="183.5" y="84.4" width="10" height="9" rx="1"/><rect x="182.3" y="97.5" width="9" height="7" rx="1"/><rect x="184.9" y="133.4" width="9" height="7" rx="1"/><rect x="184.7" y="145.9" width="11" height="7" rx="1"/><rect x="183.2" y="193.6" width="9" height="7" rx="1"/><rect x="182.7" y="206.2" width="8" height="7" rx="1"/><rect x="197.5" y="12.4" width="8" height="9" rx="1"/><rect x="196.3" y="25.7" width="10" height="9" rx="1"/><rect x="196.2" y="72.2" width="9" height="8" rx="1"/><rect x="197.4" y="85.5" width="10" height="7" rx="1"/><rect x="195.4" y="98.8" width="8" height="9" rx="1"/><rect x="197.9" y="158.7" width="11" height="8" rx="1"/><rect x="196.8" y="193.8" width="11" height="7" rx="1"/><rect x="195.6" y="205.2" width="10" height="7" rx="1"/><rect x="209.0" y="1.1" width="10" height="9" rx="1"/><rect x="210.6" y="26.9" width="8" height="9" rx="1"/><rect x="209.3" y="60.5" width="10" height="7" rx="1"/><rect x="209.9" y="87.0" width="10" height="8" rx="1"/><rect x="208.0" y="96.1" width="10" height="9" rx="1"/><rect x="208.3" y="133.1" width="10" height="8" rx="1"/><rect x="208.4" y="145.1" width="10" height="9" rx="1"/><rect x="209.9" y="193.7" width="8" height="7" rx="1"/><rect x="210.8" y="206.2" width="11" height="9" rx="1"/><rect x="221.2" y="0.1" width="8" height="7" rx="1"/><rect x="223.7" y="12.3" width="9" height="7" rx="1"/><rect x="222.2" y="25.6" width="9" height="7" rx="1"/><rect x="223.7" y="60.2" width="11" height="9" rx="1"/><rect x="224.0" y="72.8" width="9" height="7" rx="1"/><rect x="223.7" y="86.8" width="8" height="8" rx="1"/><rect x="221.8" y="132.7" width="8" height="7" rx="1"/><rect x="261.0" y="1.9" width="9" height="7" rx="1"/><rect x="260.9" y="14.1" width="9" height="8" rx="1"/><rect x="261.2" y="87.0" width="8" height="7" rx="1"/><rect x="273.5" y="0.4" width="9" height="9" rx="1"/><rect x="275.1" y="14.7" width="10" height="9" rx="1"/><rect x="275.1" y="24.5" width="11" height="9" rx="1"/><rect x="274.0" y="60.0" width="9" height="9" rx="1"/><rect x="273.7" y="98.1" width="10" height="9" rx="1"/><rect x="275.2" y="206.8" width="9" height="8" rx="1"/><rect x="287.4" y="0.5" width="9" height="8" rx="1"/><rect x="287.9" y="26.2" width="9" height="8" rx="1"/><rect x="288.4" y="60.7" width="11" height="8" rx="1"/><rect x="288.0" y="73.4" width="10" height="8" rx="1"/><rect x="301.6" y="1.7" width="11" height="9" rx="1"/><rect x="300.4" y="13.7" width="9" height="7" rx="1"/><rect x="300.5" y="25.5" width="9" height="9" rx="1"/><rect x="300.9" y="72.1" width="10" height="9" rx="1"/><rect x="300.5" y="85.5" width="10" height="7" rx="1"/><rect x="314.3" y="0.2" width="11" height="9" rx="1"/><rect x="312.4" y="14.0" width="11" height="9" rx="1"/><rect x="312.1" y="25.9" width="8" height="7" rx="1"/><rect x="314.1" y="62.6" width="10" height="9" rx="1"/><rect x="312.1" y="73.7" width="8" height="8" rx="1"/><rect x="313.7" y="84.1" width="8" height="8" rx="1"/><rect x="314.1" y="97.2" width="11" height="9" rx="1"/><rect x="327.0" y="2.7" width="11" height="8" rx="1"/><rect x="325.2" y="26.6" width="8" height="7" rx="1"/><rect x="327.0" y="60.4" width="11" height="8" rx="1"/><rect x="327.4" y="85.4" width="9" height="9" rx="1"/><rect x="326.7" y="206.4" width="8" height="9" rx="1"/><rect x="339.8" y="2.0" width="9" height="8" rx="1"/><rect x="339.8" y="12.0" width="9" height="8" rx="1"/><rect x="340.4" y="26.3" width="8" height="9" rx="1"/><rect x="340.3" y="62.6" width="10" height="8" rx="1"/><rect x="340.6" y="73.1" width="11" height="8" rx="1"/><rect x="338.9" y="84.1" width="8" height="7" rx="1"/><rect x="338.1" y="99.0" width="8" height="7" rx="1"/><rect x="353.8" y="12.2" width="8" height="8" rx="1"/><rect x="351.8" y="25.5" width="8" height="7" rx="1"/><rect x="352.0" y="60.0" width="8" height="7" rx="1"/><rect x="352.8" y="74.3" width="10" height="9" rx="1"/><rect x="351.8" y="84.4" width="10" height="8" rx="1"/><rect x="351.7" y="96.4" width="9" height="8" rx="1"/></g><g fill="none" stroke="#d2d6d8" stroke-linecap="square"><path d="M90 0V210" stroke-width="15"/><path d="M250 0V210" stroke-width="13"/><path d="M0 120H360" stroke-width="17"/><path d="M90 45H360" stroke-width="12"/><path d="M0 175H250" stroke-width="12"/></g><g fill="none" stroke="#fff" stroke-linecap="square"><path d="M90 0V210" stroke-width="13"/><path d="M250 0V210" stroke-width="11"/><path d="M0 120H360" stroke-width="15"/><path d="M90 45H360" stroke-width="10"/><path d="M0 175H250" stroke-width="10"/></g><path d="M0 120H360" stroke="#fbf3dc" stroke-width="11" fill="none"/><text x="128" y="122.6" font-family="Inter,Arial,sans-serif" font-size="7.5" fill="#8b979c" font-weight="600" letter-spacing=".2">Hoofdstraat</text><text x="92.6" y="200" font-family="Inter,Arial,sans-serif" font-size="7.5" fill="#8b979c" font-weight="600" letter-spacing=".2" transform="rotate(-90 92.6 200)">Stationsweg</text><text x="252.6" y="100" font-family="Inter,Arial,sans-serif" font-size="7.5" fill="#8b979c" font-weight="600" letter-spacing=".2" transform="rotate(-90 252.6 100)">Parklaan</text><text x="300" y="47.5" font-family="Inter,Arial,sans-serif" font-size="7.5" fill="#8b979c" font-weight="600" letter-spacing=".2">Kerkstraat</text><path data-pp-route d="M90 8V120H250V158" fill="none" stroke="none"/></svg>';
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
  const faq=[["Moet ik thuis zijn als u komt?","Voor de buitenkant hoeft u niet thuis te zijn. U krijgt 3 dagen vooraf een planningsmail met de dag waarop wij komen, en in uw klantportaal ziet u altijd wanneer de volgende beurt is."],
    ["Hoe komt mijn prijs tot stand?",`U maakt een foto van uw woning en tikt de ramen aan. Op basis daarvan ziet u direct uw vaste prijs per beurt, inclusief kozijnen en btw. Bij de eerste beurt tellen wij ter plekke na; klopt de telling niet, dan passen wij de prijs aan en hoort u dat van ons.`],
    ["Hoe vaak komen jullie?","Dat kiest u zelf in de calculator. Hoe vaker, hoe voordeliger per beurt. Wij plannen u daarna vast in op onze route."],
    ["Hoe betaal ik?",`Na elke beurt ontvangt u de factuur per e-mail${o.mollie?", met een betaallink voor iDEAL":""}. Al uw facturen staan ook in uw klantportaal.`],
    ["Doen jullie ook bedrijven en VvE's?","Zeker. Kies in de calculator voor Bedrijf / VvE en laat uw gegevens achter; wij nemen snel contact met u op voor een prijs op maat."],["Wat zijn credits?","Credits zijn korting die u spaart: 1 credit is € 1. U krijgt ze voor het aanbevelen van een buur, een Google-review, het beoordelen van een beurt of het bestellen van een extra dienst. Ze gaan automatisch van uw volgende factuur af."],["Kan ik een afspraak verzetten of overslaan?","Ja, dat regelt u zelf in uw klantportaal: verzetten, een keer overslaan of uw vakantie doorgeven. Wij passen de planning aan en u krijgt een bevestiging."]];
  return `<input type="checkbox" id="msm" hidden>
<header class="nav"><div class="in"><a class="logo" href="#top">${logo}</a>
  <nav class="lk"><a href="#werkwijze">Werkwijze</a><a href="#voordelen">Voordelen</a><a href="#betalen">Betalen</a><a href="#prijs">Prijs berekenen</a>${o.werkApi?`<a href="#werk">Ons werk</a>`:""}<a href="#vragen">Vragen</a><a href="#contact">Contact</a>${portaal?`<a class="lk-p" href="${e(portaal)}">Mijn portaal</a>`:""}</nav>
  ${portaal?`<a class="portaal" href="${e(portaal)}">${IC.user}Mijn portaal</a>`:""}<a class="knop k-teal" href="#prijs">Bereken uw prijs</a>
  <label class="hb" for="msm" aria-label="Menu">${IC.menu}</label></div></header>
<section class="hero" id="top"><div class="in"><div class="blauw">
  <div>${o.score?`<a class="chip ster" href="${e(o.reviewUrl||"#")}" target="_blank" rel="noopener"><span class="st">★★★★★</span><b>${e(o.score)}</b> op Google</a>`:`<span class="chip"><i>✦</i>Glasbewassing${regio}</span>`}
    <h1>Heldere ramen,<br><em>zonder omkijken.</em></h1>
    <p class="sub">Wij wassen uw ramen en kozijnen op een vaste route. Maak een foto van uw woning en zie direct wat het kost per beurt.</p>
    <div class="cta"><a class="knop k-wit" href="#prijs">${IC.cam}Bereken uw prijs</a>${wa?`<a class="knop k-glas" href="${wa}" target="_blank" rel="noopener">${IC.wa}WhatsApp ons</a>`:""}</div>
    <div class="vink"><span>${IC.ok}Vaste prijs per beurt</span><span>${IC.ok}Inclusief kozijnen</span><span>${IC.ok}Planningsmail vooraf</span></div></div>
  <div style="position:relative"><div class="tel" aria-hidden="true"><div class="sc"><div class="sch"><span class="eil"></span><div class="sb"><span>9:41</span><span>●●●</span></div>
    <div class="p-kop">Uw klantportaal</div>
    <div class="p-hero"><div class="p-ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="33" fill="none" stroke="rgb(255 255 255 / .2)" stroke-width="8"/><circle cx="40" cy="40" r="33" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="207" stroke-dashoffset="62"/></svg><b>12<small>dagen</small></b></div><div><small>Volgende beurt</small><strong>Dinsdag<br>28 oktober</strong></div></div>
    <div class="p-weg"><i></i><span class="bu">${bus.replace(/id="ms/g,'id="mp').replace(/url\(#ms/g,"url(#mp")}</span><span class="hu">${IC.huis}</span></div>
    <div class="p-kaart"><span class="p-ic">${IC.bel}</span><div><b>Planningsmail</b><span class="s">Wij komen dinsdag</span></div><span class="p-ok">Nieuw</span></div>
    <div class="p-kaart"><span class="p-ic">${IC.kaart}</span><div><b>Factuur september</b><span class="s">Online betaald</span></div><span class="p-ok">✓</span></div>
    <div class="p-kop" style="margin-top:4px">Eerdere beurten</div>
    <div class="p-kaart"><span class="p-ic">${IC.cal}</span><div><b>2 sept.</b><span class="s">Ramen en kozijnen</span></div><span class="p-ok">✓</span></div>
  </div></div></div>
  <div class="zweef" aria-hidden="true"><span class="p-ic">${IC.bel}</span><div><b>Dinsdag komen wij</b><small>Planningsmail, altijd 3 dagen vooraf</small></div></div></div>
  ${weg}</div></div></section>
<section id="werkwijze"><div class="in"><span class="oog">${IC.rt}Zo werkt het</span><h2 class="kop">In vier stappen <em>schone ramen</em></h2><p class="lead">Geen offertebezoek, geen gedoe. U regelt het in een paar minuten online.</p>
  <ol class="route">
    <li class="stap"><span class="n">${IC.cam}</span><small>Stap <b>01</b></small><h3>Foto en prijs</h3><p>Maak een foto van uw woning, tik de ramen aan en zie direct uw prijs per beurt.</p></li>
    <li class="stap"><span class="n">${IC.ok}</span><small>Stap <b>02</b></small><h3>Aanmelden</h3><p>Kies hoe vaak u wilt en laat uw gegevens achter. U krijgt meteen een bevestiging.</p></li>
    <li class="stap"><span class="n">${IC.raam}</span><small>Stap <b>03</b></small><h3>Eerste beurt</h3><p>Wij wassen uw ramen en tellen ter plekke na of alles klopt.</p></li>
    <li class="stap"><span class="n">${IC.rt}</span><small>Stap <b>04</b></small><h3>Vaste route</h3><p>Daarna komen wij vanzelf terug. U krijgt steeds 3 dagen vooraf een planningsmail.</p></li></ol></div></section>
<section id="voordelen"><div class="in"><div class="blauw band"><span class="oog">${IC.ok}Waarom ${naam}</span><h2 class="kop">Alles geregeld, <em>u hoeft niets te doen</em></h2><p class="lead">Wij nemen het werk uit handen, van de planning tot de factuur.</p>
  <div class="tegels">
    <div class="tg"><span class="ic">${IC.euro}</span><h3>Vaste prijs per beurt</h3><p>U weet vooraf precies wat het kost. Kozijnen en btw zitten erbij in.</p></div>
    <div class="tg"><span class="ic">${IC.bel}</span><h3>Planningsmail vooraf</h3><p>U krijgt altijd 3 dagen vooraf een mail met de dag waarop wij langskomen.</p></div>
    <div class="tg"><span class="ic">${IC.user}</span><h3>Eigen klantportaal</h3><p>Bekijk uw volgende beurt, facturen en gegevens wanneer u wilt.</p></div>
    <div class="tg"><span class="ic">${IC.cal}</span><h3>U kiest hoe vaak</h3><p>Hoe vaker wij komen, hoe voordeliger per beurt.</p></div>
    <div class="tg"><span class="ic">${IC.kaart}</span><h3>Makkelijk betalen</h3><p>Factuur per e-mail${o.mollie?" en direct betalen met iDEAL":", alles terug te vinden in uw portaal"}.</p></div>
    <div class="tg"><span class="ic">${IC.gebouw}</span><h3>Particulier en zakelijk</h3><p>Van rijtjeshuis tot kantoorpand of VvE.</p></div></div>
  ${wg(-7,"opacity:.6")}<div style="height:40px"></div></div></div></section>
<section><div class="in duo"><div><span class="oog">${IC.user}Uw klantportaal</span><h2 class="kop">Altijd weten <em>waar u aan toe bent</em></h2><p class="lead">Na uw aanmelding krijgt u een eigen portaal. Zonder wachtwoord, gewoon met uw e-mailadres.</p>
  <ul class="lijst"><li><i>${IC.ok}</i><div><b>Wanneer komen jullie?</b><span>Uw volgende beurt, met aftellen tot de dag.</span></div></li>
    <li><i>${IC.ok}</i><div><b>Live meekijken</b><span>Op de dag zelf ziet u waar het busje is, hoe laat we er zijn en hoeveel woningen er nog voor u zijn.</span></div></li>
    <li><i>${IC.ok}</i><div><b>Wat is er gedaan?</b><span>Alle eerdere beurten op een rij.</span></div></li>
    <li><i>${IC.ok}</i><div><b>Facturen en betalen</b><span>Al uw facturen bij elkaar${o.mollie?", direct te betalen":""}.</span></div></li></ul>
  ${portaal?`<div style="margin-top:24px"><a class="knop k-teal" href="${e(portaal)}">${IC.user}Naar mijn portaal</a></div>`:""}</div>
  <div><div class="pp" data-pp role="img" aria-label="Zo ziet uw klantportaal eruit op de dag zelf: live zien waar het busje is en hoe laat we er zijn">
    <div class="pp-sb"><b>11:02</b><i></i><span><svg viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" opacity=".4"/><rect x="2.2" y="2.2" width="15" height="7.6" rx="1.8"/><rect x="23.6" y="4" width="1.8" height="4" rx=".9" opacity=".4"/></svg></span></div>
    <div class="pp-top">${o.logo?`<img src="${e(o.logo)}" alt="">`:`<span class="pp-lg">${IC.raam}</span>`}<span>Goedemiddag, Ashley</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></div>
    <div class="pp-main">
      <div class="pp-hero"><div class="pp-hk"><div><p class="pp-k"><span class="pp-puls"></span>Vandaag</p><span class="pp-adr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>Parklaan 7<em>, Grootegast</em></span></span><h3>Woensdag 14 oktober</h3></div>
        <div class="pp-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="t"/><circle cx="50" cy="50" r="44" class="v"/></svg><span><b>0</b><small>dagen</small></span></div></div>
        <p class="pp-s" data-pp-sub>Rond 11:10 · we zijn onderweg</p></div>
      <div class="pp-lv"><div class="pp-map" data-pp-map>${PP_KAART}<div class="pp-ov"><span class="pp-lijn" data-pp-lijn></span><span class="pp-huis" style="left:73.3%;top:80%"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg></span><span class="pp-auto" data-pp-bus><span class="pp-pl"></span><span class="pp-rot" data-pp-rot>${PP_BUS}</span></span></div></div>
        <div class="pp-info"><span class="pp-car">${PP_AUTO}</span><div class="pp-tx"><small class="pp-st"><i></i>Live</small><b data-pp-t>Nog 2 adressen voor u</b><span data-pp-s2>Robin is in de buurt</span></div><div class="pp-eta"><small>Verwacht</small><b data-pp-eta>± 11:10</b></div></div></div>
    </div>
  </div><p class="pp-ond">Zo ziet uw portaal eruit op de dag zelf.</p></div></div></section>
<section id="betalen"><div class="in"><span class="oog">${IC.kaart}Makkelijk betalen</span><h2 class="kop">Betalen in <em>één minuut</em></h2><p class="lead">Na elke beurt krijgt u de factuur per e-mail. Geen gedoe met overschrijven: betaal direct${o.mollie?" met iDEAL":""} vanuit de mail of uw portaal.</p>
  <div class="bt-grid">
    <div class="bt"><span class="ic">${IC.ideal}</span><h3>${o.mollie?"iDEAL in één tik":"Factuur per e-mail"}</h3><p>${o.mollie?"Elke factuur heeft een betaalknop. Betaald binnen een minuut, bevestiging meteen in uw portaal.":"Duidelijke factuur met alle gegevens, direct na de beurt in uw mailbox en in uw portaal."}</p></div>
    <div class="bt"><span class="ic">${IC.gift}</span><h3>Korting gaat er vanzelf af</h3><p>Credits die u spaart, worden automatisch van uw volgende factuur afgetrokken. U hoeft niets te doen.</p></div>
    <div class="bt"><span class="ic">${IC.klok}</span><h3>Alles op een rij</h3><p>Openstaand, betaald, uw betaalgedrag en uw plek bij onze snelste betalers: u ziet het in uw portaal.</p></div>
  </div>
  <div class="bt-demo" role="img" aria-label="Voorbeeld van een factuur die online is betaald"><div class="bt-f"><div class="bt-fh"><span class="bt-ic">${IC.euro}</span><div><b>Factuur ${new Date().getFullYear()}-0127</b><small>Glasbewassing · ${e(o.plaats||"uw woning")}</small></div><span class="bt-pil">Betaald</span></div>
    <div class="bt-r"><span>Glasbewassing · 14 ramen</span><b>€ 42,50</b></div><div class="bt-r kort"><span>Credits (aanbeveling)</span><b>− € 15,00</b></div><div class="bt-r tot"><span>Te betalen</span><b>€ 27,50</b></div>
    <div class="bt-ok">${IC.ok}<span>Betaald${o.mollie?" met iDEAL":""} · 1 uur na ontvangst · bedankt!</span></div></div></div></div></section>
<section id="credits"><div class="in"><div class="blauw band cr-band"><span class="oog">${IC.gift}Credits sparen</span><h2 class="kop">Korting <em>verdienen is makkelijk</em></h2><p class="lead">1 credit is € 1 korting op uw volgende factuur. Zo spaart u ze:</p>
  <div class="tegels cr4">
    <div class="tg"><span class="ic">${IC.user}</span><em class="cr-n">+${e(String(o.refBeloning||15))}</em><h3>Beveel een buur aan</h3><p>Uw buur krijgt ${e(String(o.refWelkom||10))} euro welkomstkorting, u krijgt ${e(String(o.refBeloning||15))} credits na de eerste beurt.</p></div>
    <div class="tg"><span class="ic">${IC.ster}</span><em class="cr-n">+${e(String(o.crReview||5))}</em><h3>Google-review</h3><p>Help anderen ons te vinden. Eenmalig ${e(String(o.crReview||5))} credits.</p></div>
    <div class="tg"><span class="ic">${IC.ok}</span><em class="cr-n">+${e(String(o.crBeurt||1))}</em><h3>Beoordeel elke beurt</h3><p>Geef sterren na elk bezoek. Zo blijven wij scherp, u verdient er credits mee.</p></div>
    <div class="tg"><span class="ic">${IC.euro}</span><em class="cr-n">+${e(String(o.crExtra||3))}</em><h3>Bestel iets extra's</h3><p>Kozijnen, binnenzijde, zonnepanelen of dakgoot: credits per extra dienst.</p></div></div>
  ${wg(-7,"opacity:.6")}<div style="height:40px"></div></div></div></section>
<section id="prijs"><div class="in"><div class="ws-kop"><span class="oog">${IC.cam}Dienstenwebshop</span><h2 class="kop">Bereken uw prijs en <em>meld u direct aan</em></h2><p class="lead">Geen offertebezoek nodig. Maak een foto van uw woning, tik de ramen aan en u ziet direct uw vaste prijs per beurt. Aanmelden kan meteen, u krijgt binnen een minuut een bevestiging.</p></div><div id="ms-calc"></div></div></section>
<section id="werk" data-werk="${e(o.werkApi||"")}" ${o.werkApi?"":"hidden"}><div class="in"><span class="oog">${IC.foto}Ons werk</span><h2 class="kop">Zo ziet <em>schoon</em> eruit</h2><p class="lead">Echte foto's van ons werk bij klanten in de buurt. Geen stockfoto's.</p>
  <div class="wk-filter" data-werk-filter hidden></div><div class="wk-grid" data-werk-grid></div></div></section>
<section id="zakelijk"><div class="in"><div class="zak"><div><span class="oog">${IC.gebouw}Zakelijk</span><h2 class="kop">Ook voor <em>bedrijven en VvE's</em></h2><p class="lead">Kantoor, winkel, school of appartementencomplex: wij maken een prijs op maat en plannen het werk in wanneer het u uitkomt.</p>
  <div class="tags"><span>Kantoren</span><span>Winkels en horeca</span><span>VvE's</span><span>Scholen en zorg</span></div></div>
  <div class="r"><a class="knop k-teal" href="#prijs">${IC.gebouw}Vraag een prijs aan</a></div></div>
  <div class="vve"><div class="vve-k"><span class="oog">${IC.qr}Speciaal voor VvE's</span><h3>Schoonmaak van trappenhuis en entree, <em>zichtbaar voor alle bewoners</em></h3><p>Vaste dagen in de week, een checklist per beurt en een digitaal bewonersbord in de hal: bewoners scannen de QR-code en zien wanneer er is schoongemaakt. Dat scheelt het bestuur telefoontjes.</p></div>
    <ul class="vve-l"><li><i>${IC.cal}</i><div><b>Vaste weekdagen</b><span>Bijvoorbeeld elke dinsdag en vrijdag, altijd dezelfde schoonmaker.</span></div></li>
      <li><i>${IC.foto}</i><div><b>Logboek met foto's</b><span>Per beurt wat er is gedaan, met opleverfoto en notitie.</span></div></li>
      <li><i>${IC.qr}</i><div><b>Bewonersbord met QR</b><span>Een poster in de hal; bewoners zien live wanneer wij er zijn geweest.</span></div></li>
      <li><i>${IC.bel}</i><div><b>Meldingen uit het gebouw</b><span>Kapotte lamp, grofvuil of schade: wij melden het met foto aan het bestuur.</span></div></li></ul></div></div></section>
<section id="vragen"><div class="in"><span class="oog">${IC.bel}Veelgestelde vragen</span><h2 class="kop">Goed om <em>te weten</em></h2>
  <div class="faq">${faq.map(([q,a])=>`<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join("")}</div></div></section>
<section id="contact"><div class="in"><div class="blauw contact"><div><h2>Vragen? <em>Wij helpen u graag.</em></h2><p>Stuur een berichtje via WhatsApp of mail. Wij reageren meestal dezelfde dag.</p></div>
  <div class="ck">${wa?`<a href="${wa}" target="_blank" rel="noopener"><span class="ic">${IC.wa}</span><div>WhatsApp<small>Stel snel een vraag</small></div></a>`:""}${o.email?`<a href="mailto:${e(o.email)}"><span class="ic">${IC.mail}</span><div>E-mail<small>${e(o.email)}</small></div></a>`:""}</div>
  ${wg(-12)}</div></div></section>
<footer><div class="in"><span>© ${new Date().getFullYear()} ${naam}${o.adres?` · ${e(o.adres)}${o.postcode?", "+e(o.postcode):""} ${e(o.plaats||"")}`:""}${o.kvk?` · KvK ${e(o.kvk)}`:""}</span>
  <span>${portaal?`<a href="${e(portaal)}">Klantportaal</a> · `:""}${o.voorwaarden?`<a href="${e(o.voorwaarden)}" target="_blank" rel="noopener">Algemene voorwaarden</a>`:""}</span></div></footer>
`}

async function websiteDelen(){const fv=k=>{const el=typeof form!=="undefined"&&form&&form.querySelector(`[data-k="${k}"]`);return el?el.value:null};const s=S(),lg=await loadLogo();const wa=String(s.webWa||waNr(s.telefoon)||"").replace(/\D/g,"");
  const o={naam:s.naam,telefoon:s.telefoon,email:s.email,adres:s.adres,postcode:s.postcode,plaats:s.plaats,kvk:s.kvk,whatsapp:wa,logo:lg?await kleinLogo(lg.url):"",
    portaal:LIVE?location.origin+"/portaal":"",werkApi:LIVE?location.origin+"/api/portaal/werk":"",score:String(fv("webScore")??s.webScore??"4,8").trim(),reviewUrl:String(fv("webReviewUrl")||s.webReviewUrl||"https://www.google.com/search?q=mijnschoonmaker.com+Reviews").trim(),refBeloning:s.refBeloning!=null&&s.refBeloning!==""?Number(s.refBeloning):15,refWelkom:s.refWelkom!=null&&s.refWelkom!==""?Number(s.refWelkom):10,crReview:s.crReview??5,crBeurt:s.crBeurt??1,crExtra:s.crExtra??3,voorwaarden:s.webVoorwaarden||s.voorwaarden||"",mollie:!!s.liveMollie,bus:typeof RV_BUS!=="undefined"?RV_BUS:""};
  return {body:websiteBody(o),calc:await klantCalcHtml(wa),o}}
/* bonnetje: echt afscheuren langs de perforatie, met rafelrand en papiersnippers */
const WEB_JS=`root.querySelectorAll("[data-pp]").forEach(function(pp){if(pp._ms)return;pp._ms=1;
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
  fetch(api).then(function(r){return r.json()}).then(function(j){items=(j&&j.items)||[];if(!items.length){sec.hidden=true;return}sec.hidden=false;filters();teken()}).catch(function(){sec.hidden=true})});`;
const WEB_FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap">';
/* losse pagina: voor de voorbeeldweergave en voor wie geen Framer gebruikt */
function websiteHtml(p,crm){const calc=crm?p.calc.replace(/<head([^>]*)>/i,m=>m+"<script>window.ZEEM_CRM=1<\/script>"):p.calc;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.o.naam||"mijnschoonmaker")} · Glasbewassing</title>
<meta name="description" content="Glasbewassing${p.o.plaats?" in "+esc(p.o.plaats)+" en omgeving":""}. Bereken direct uw prijs met een foto van uw woning.">${WEB_FONTS}<style>html,body{margin:0;background:#f3f6f7;scroll-behavior:smooth;overflow-x:hidden;max-width:100%}${WEB_CSS}</style></head>
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
