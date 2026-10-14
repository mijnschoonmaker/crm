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
.ms .tk{position:relative;max-width:440px;margin:0 auto;display:grid;grid-template-columns:1fr 118px;filter:drop-shadow(0 26px 34px rgb(15 70 85 / .35));transform:rotate(-2deg)}
.ms .tk-l{background:#fff;border-radius:22px 0 0 22px;padding:22px 22px 20px;-webkit-mask:radial-gradient(circle 12px at 100% 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 12px at 100% 100%,#0000 98%,#000) bottom/100% 51% no-repeat;mask:radial-gradient(circle 12px at 100% 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 12px at 100% 100%,#0000 98%,#000) bottom/100% 51% no-repeat}
.ms .tk-r{position:relative;overflow:hidden;background:var(--blauw);color:#fff;border-radius:0 22px 22px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-left:2px dashed rgb(255 255 255 / .5);-webkit-mask:radial-gradient(circle 12px at 0 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 12px at 0 100%,#0000 98%,#000) bottom/100% 51% no-repeat;mask:radial-gradient(circle 12px at 0 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 12px at 0 100%,#0000 98%,#000) bottom/100% 51% no-repeat}
.ms .tk-r b{font-size:34px;font-weight:800;line-height:1}.ms .tk-r small{font-size:11px;font-weight:700;opacity:.85;text-transform:uppercase;letter-spacing:.06em}
.ms .tk-l small{font-size:11.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.ms .tk-l h3{font-size:20px;font-weight:800;margin:4px 0 12px;letter-spacing:-.01em}
.ms .tk-rij{display:flex;justify-content:space-between;font-size:14px;padding:7px 0;border-top:1px dashed var(--line)}.ms .tk-rij span{color:var(--muted)}
.ms .stempel{position:absolute;right:120px;top:16px;transform:rotate(-12deg);border:2.5px solid #1f8a5a;color:#1f8a5a;border-radius:10px;padding:3px 10px;font-weight:800;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.85}
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
  .ms .tel{width:246px}.ms .zweef{right:auto;left:-4px;top:auto;bottom:3%}.ms #ms-calc{margin:0 -16px}.ms .stempel{top:-14px;right:126px}.ms .tk-r small{font-size:9.5px}
  .ms .blauw{border-radius:26px}.ms section{padding:30px 0}
  .ms .route,.ms .tegels,.ms .duo,.ms .zak,.ms .contact{grid-template-columns:1fr}
  .ms .band{padding:30px 20px 34px}.ms .zak{padding:26px 22px}.ms .zak .r{justify-content:stretch}.ms .zak .r .knop{width:100%}
  .ms .contact{padding:32px 20px 110px}.ms .ck a{font-size:14px;padding:11px 12px;gap:10px}.ms .ck a span.ic{width:32px;height:32px;border-radius:10px}.ms .ck a span.ic svg{width:16px}.ms .ck a small{font-size:12.5px}.ms .calc-k{padding:24px 14px 4px}.ms .calc{border-radius:24px;padding:4px}
  .ms .cta .knop{flex:1}.ms .weg .h:nth-child(even){display:none}
}`;

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
    ["Doen jullie ook bedrijven en VvE's?","Zeker. Kies in de calculator voor Bedrijf / VvE en laat uw gegevens achter; wij nemen snel contact met u op voor een prijs op maat."]];
  return `<input type="checkbox" id="msm" hidden>
<header class="nav"><div class="in"><a class="logo" href="#top">${logo}</a>
  <nav class="lk"><a href="#werkwijze">Werkwijze</a><a href="#voordelen">Voordelen</a><a href="#prijs">Prijs berekenen</a><a href="#vragen">Vragen</a><a href="#contact">Contact</a>${portaal?`<a class="lk-p" href="${e(portaal)}">Mijn portaal</a>`:""}</nav>
  ${portaal?`<a class="portaal" href="${e(portaal)}">${IC.user}Mijn portaal</a>`:""}<a class="knop k-teal" href="#prijs">Bereken uw prijs</a>
  <label class="hb" for="msm" aria-label="Menu">${IC.menu}</label></div></header>
<section class="hero" id="top"><div class="in"><div class="blauw">
  <div>${o.score?`<a class="chip ster" href="${e(o.reviewUrl||"#")}" target="_blank" rel="noopener"><span class="st">★★★★★</span><b>${e(o.score)}</b> op Google</a>`:`<span class="chip"><i>✦</i>Glasbewassing${regio}</span>`}
    <h1>Heldere ramen,<br>zonder omkijken.</h1>
    <p class="sub">Wij wassen uw ramen en kozijnen op een vaste route. Maak een foto van uw woning en zie direct wat het kost per beurt.</p>
    <div class="cta"><a class="knop k-wit" href="#prijs">${IC.cam}Bereken uw prijs</a>${wa?`<a class="knop k-glas" href="${wa}" target="_blank" rel="noopener">${IC.wa}WhatsApp ons</a>`:tel?`<a class="knop k-glas" href="tel:${e(telH)}">${IC.tel}Bel ons</a>`:""}</div>
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
<section id="werkwijze"><div class="in"><span class="oog">Zo werkt het</span><h2 class="kop">In vier stappen schone ramen</h2><p class="lead">Geen offertebezoek, geen gedoe. U regelt het in een paar minuten online.</p>
  <ol class="route">
    <li class="stap"><span class="n">${IC.cam}</span><small>Stap 1</small><h3>Foto en prijs</h3><p>Maak een foto van uw woning, tik de ramen aan en zie direct uw prijs per beurt.</p></li>
    <li class="stap"><span class="n">${IC.ok}</span><small>Stap 2</small><h3>Aanmelden</h3><p>Kies hoe vaak u wilt en laat uw gegevens achter. U krijgt meteen een bevestiging.</p></li>
    <li class="stap"><span class="n">${IC.raam}</span><small>Stap 3</small><h3>Eerste beurt</h3><p>Wij wassen uw ramen en tellen ter plekke na of alles klopt.</p></li>
    <li class="stap"><span class="n">${IC.rt}</span><small>Stap 4</small><h3>Vaste route</h3><p>Daarna komen wij vanzelf terug. U krijgt steeds 3 dagen vooraf een planningsmail.</p></li></ol></div></section>
<section id="voordelen"><div class="in"><div class="blauw band"><span class="oog">Waarom ${naam}</span><h2 class="kop">Alles geregeld, u hoeft niets te doen</h2><p class="lead">Wij nemen het werk uit handen, van de planning tot de factuur.</p>
  <div class="tegels">
    <div class="tg"><span class="ic">${IC.euro}</span><h3>Vaste prijs per beurt</h3><p>U weet vooraf precies wat het kost. Kozijnen en btw zitten erbij in.</p></div>
    <div class="tg"><span class="ic">${IC.bel}</span><h3>Planningsmail vooraf</h3><p>U krijgt altijd 3 dagen vooraf een mail met de dag waarop wij langskomen.</p></div>
    <div class="tg"><span class="ic">${IC.user}</span><h3>Eigen klantportaal</h3><p>Bekijk uw volgende beurt, facturen en gegevens wanneer u wilt.</p></div>
    <div class="tg"><span class="ic">${IC.cal}</span><h3>U kiest hoe vaak</h3><p>Hoe vaker wij komen, hoe voordeliger per beurt.</p></div>
    <div class="tg"><span class="ic">${IC.kaart}</span><h3>Makkelijk betalen</h3><p>Factuur per e-mail${o.mollie?" en direct betalen met iDEAL":", alles terug te vinden in uw portaal"}.</p></div>
    <div class="tg"><span class="ic">${IC.gebouw}</span><h3>Particulier en zakelijk</h3><p>Van rijtjeshuis tot kantoorpand of VvE.</p></div></div>
  ${wg(-7,"opacity:.6")}<div style="height:40px"></div></div></div></section>
<section><div class="in duo"><div><span class="oog">Uw klantportaal</span><h2 class="kop">Altijd weten waar u aan toe bent</h2><p class="lead">Na uw aanmelding krijgt u een eigen portaal. Zonder wachtwoord, gewoon met uw e-mailadres.</p>
  <ul class="lijst"><li><i>${IC.ok}</i><div><b>Wanneer komen jullie?</b><span>Uw volgende beurt, met aftellen tot de dag.</span></div></li>
    <li><i>${IC.ok}</i><div><b>Wat is er gedaan?</b><span>Alle eerdere beurten op een rij.</span></div></li>
    <li><i>${IC.ok}</i><div><b>Facturen en betalen</b><span>Al uw facturen bij elkaar${o.mollie?", direct te betalen":""}.</span></div></li></ul>
  ${portaal?`<div style="margin-top:24px"><a class="knop k-teal" href="${e(portaal)}">${IC.user}Naar mijn portaal</a></div>`:""}</div>
  <div><div class="tk" aria-hidden="true"><div class="tk-l"><small>Glasbewassing</small><h3>Uw ramen zijn gewassen</h3>
    <div class="tk-rij"><span>Datum</span><b>Dinsdag 14 oktober</b></div><div class="tk-rij"><span>Ramen</span><b>Ramen en kozijnen</b></div><div class="tk-rij"><span>Volgende beurt</span><b>Over 8 weken</b></div></div>
    <div class="tk-r"><small>Klaar</small><b>✓</b><small>Tot de volgende</small></div><span class="stempel">Gewassen</span></div></div></div></section>
<section id="prijs"><div class="in"><div id="ms-calc"></div></div></section>
<section id="zakelijk"><div class="in"><div class="zak"><div><span class="oog">Zakelijk</span><h2 class="kop">Ook voor bedrijven en VvE's</h2><p class="lead">Kantoor, winkel, school of appartementencomplex: wij maken een prijs op maat en plannen het werk in wanneer het u uitkomt.</p>
  <div class="tags"><span>Kantoren</span><span>Winkels en horeca</span><span>VvE's</span><span>Scholen en zorg</span></div></div>
  <div class="r"><a class="knop k-teal" href="#prijs">${IC.gebouw}Vraag een prijs aan</a></div></div></div></section>
<section id="vragen"><div class="in"><span class="oog">Veelgestelde vragen</span><h2 class="kop">Goed om te weten</h2>
  <div class="faq">${faq.map(([q,a])=>`<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join("")}</div></div></section>
<section id="contact"><div class="in"><div class="blauw contact"><div><h2>Vragen? Wij helpen u graag.</h2><p>Stuur een berichtje, bel of mail. Wij reageren meestal dezelfde dag.</p></div>
  <div class="ck">${wa?`<a href="${wa}" target="_blank" rel="noopener"><span class="ic">${IC.wa}</span><div>WhatsApp<small>Stel snel een vraag</small></div></a>`:""}${tel?`<a href="tel:${e(telH)}"><span class="ic">${IC.tel}</span><div>Bellen<small>${e(tel)}</small></div></a>`:""}${o.email?`<a href="mailto:${e(o.email)}"><span class="ic">${IC.mail}</span><div>E-mail<small>${e(o.email)}</small></div></a>`:""}</div>
  ${wg(-12)}</div></div></section>
<footer><div class="in"><span>© ${new Date().getFullYear()} ${naam}${o.adres?` · ${e(o.adres)}${o.postcode?", "+e(o.postcode):""} ${e(o.plaats||"")}`:""}${o.kvk?` · KvK ${e(o.kvk)}`:""}</span>
  <span>${portaal?`<a href="${e(portaal)}">Klantportaal</a> · `:""}${o.voorwaarden?`<a href="${e(o.voorwaarden)}" target="_blank" rel="noopener">Algemene voorwaarden</a>`:""}</span></div></footer>
${wa?`<a class="wa" href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${IC.wa}</a>`:""}`}

async function websiteDelen(){const fv=k=>{const el=typeof form!=="undefined"&&form&&form.querySelector(`[data-k="${k}"]`);return el?el.value:null};const s=S(),lg=await loadLogo();const wa=String(s.webWa||waNr(s.telefoon)||"").replace(/\D/g,"");
  const o={naam:s.naam,telefoon:s.telefoon,email:s.email,adres:s.adres,postcode:s.postcode,plaats:s.plaats,kvk:s.kvk,whatsapp:wa,logo:lg?await kleinLogo(lg.url):"",
    portaal:LIVE?location.origin+"/portaal":"",score:String(fv("webScore")??s.webScore??"4,8").trim(),reviewUrl:String(fv("webReviewUrl")||s.webReviewUrl||"https://www.google.com/search?q=mijnschoonmaker.com+Reviews").trim(),voorwaarden:s.webVoorwaarden||s.voorwaarden||"",mollie:!!s.liveMollie,bus:typeof RV_BUS!=="undefined"?RV_BUS:""};
  return {body:websiteBody(o),calc:await klantCalcHtml(wa),o}}
const WEB_FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap">';
/* losse pagina: voor de voorbeeldweergave en voor wie geen Framer gebruikt */
function websiteHtml(p,crm){const calc=crm?p.calc.replace(/<head([^>]*)>/i,m=>m+"<script>window.ZEEM_CRM=1<\/script>"):p.calc;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.o.naam||"mijnschoonmaker")} · Glasbewassing</title>
<meta name="description" content="Glasbewassing${p.o.plaats?" in "+esc(p.o.plaats)+" en omgeving":""}. Bereken direct uw prijs met een foto van uw woning.">${WEB_FONTS}<style>html,body{margin:0;background:#f3f6f7;scroll-behavior:smooth;overflow-x:hidden;max-width:100%}${WEB_CSS}</style></head>
<body><div class="ms">${p.body}</div><script>/* interne links: zelf scrollen (in een voorbeeldvenster zou de browser anders naar het CRM gaan) */
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href^='#']");if(!a)return;e.preventDefault();var id=a.getAttribute("href").slice(1),d=id==="top"?document.body:document.getElementById(id);var m=document.getElementById("msm");if(m)m.checked=false;if(d)d.scrollIntoView({behavior:"smooth",block:"start"})});
<\/script><script>(function(){var C=${JSON.stringify(calc).replace(/<\//g,"<\\/")};var box=document.getElementById("ms-calc"),f=document.createElement("iframe");f.title="Prijscalculator";f.setAttribute("allow","camera; web-share; clipboard-write");f.srcdoc=C;f.style.height="900px";f.style.width="1px";f.style.minWidth="100%";box.appendChild(f);
window.addEventListener("message",function(e){if(e.source!==f.contentWindow||!e.data)return;if(e.data.type==="zeem-calc-height")f.style.height=e.data.h+"px";if(e.data.type==="zeem-calc-full"){var on=!!e.data.on;f.style.cssText=on?"position:fixed;inset:0;width:100vw;height:100dvh;z-index:2147483647;border:0;background:#fff":"display:block;width:1px;min-width:100%;border:0;height:"+f.style.height;document.documentElement.style.overflow=on?"hidden":""}});
if(window.parent!==window){window.addEventListener("message",function(e){if(!e.data||!/^zeem-aanvraag/.test(e.data.type||""))return;if(e.source===f.contentWindow)parent.postMessage(e.data,"*");else if(e.source===parent)f.contentWindow.postMessage(e.data,"*")});var post=function(){parent.postMessage({type:"zeem-calc-height",h:document.documentElement.scrollHeight},"*")};new ResizeObserver(post).observe(document.body)}})()<\/script></body></html>`}
/* Framer: één code component met alles erin */
function websiteFramer(p){return `// Website ${String(p.o.naam||"mijnschoonmaker").replace(/\n/g," ")} — Framer code component (gemaakt in het CRM)
// Zo plaatst u hem:
// 1. Framer › Assets (links) › Code › + › New component.
// 2. Selecteer alle voorbeeldcode, vervang door dit hele bestand en sla op (Cmd/Ctrl+S).
// 3. Sleep "Website" op een lege pagina. Zet rechts Width op Fill en Height op Fit.
// 4. Publish. Uw domein koppelt u bij Site Settings › Domains.
// Verandert u later uw logo, tarieven of gegevens in het CRM? Download dan opnieuw en vervang de code.
import { useEffect, useRef } from "react"

const CSS = ${JSON.stringify(WEB_FONTS+"<style>"+WEB_CSS+"</style>")}
const BODY = ${JSON.stringify(p.body)}
const CALC = ${JSON.stringify(p.calc)}

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
