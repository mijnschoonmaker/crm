/* ---------- complete website (mijnschoonmaker.com) voor Framer: één code component, gegevens en calculator uit het CRM ---------- */
const WEB_CSS=`
.ms{--ink:#0c121c;--muted:#5c6066;--m2:#9a9ea4;--bg:#fff;--grijs:#f2f2f2;--lijn:#dcdcdc;--line:#dcdcdc;--soft:#e3f2f4;--b1:#0f5f6e;--b2:#137a8a;--blauw:linear-gradient(135deg,#1a1f26,#2b323b);--lijnen:none;--ls:.16em;
  font-family:Jost,"Avenir Next","Avenir","Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);background:#fff;-webkit-font-smoothing:antialiased;line-height:1.5;font-size:16px;font-weight:300;text-align:left;width:100%;overflow-x:clip}
.ms *{box-sizing:border-box}.ms a{color:inherit;text-decoration:none}.ms img,.ms svg{display:block;max-width:100%}.ms [hidden]{display:none!important}
.ms h1,.ms h2,.ms h3,.ms p{margin:0}.ms ul,.ms ol{margin:0;padding:0;list-style:none}.ms b,.ms strong{font-weight:500}
.ms .in{width:min(1440px,100% - 80px);margin:0 auto}
.ms p,.ms li{text-wrap:pretty}.ms h1,.ms h2,.ms h3{text-wrap:balance;overflow-wrap:break-word}
/* typografie */
.ms .up{text-transform:uppercase;letter-spacing:var(--ls)}
.ms .k1{font-size:clamp(30px,3.6vw,48px);font-weight:300;line-height:1.12;letter-spacing:.06em;text-transform:uppercase}
.ms .k2{font-size:clamp(22px,2.2vw,30px);font-weight:300;line-height:1.2;letter-spacing:.08em;text-transform:uppercase}
.ms .k3{font-size:15px;font-weight:500;letter-spacing:.16em;text-transform:uppercase}
.ms .tx{font-size:clamp(15px,1.15vw,17px);font-weight:300;line-height:1.6;max-width:52ch}
.ms .vanaf{font-size:14px;letter-spacing:.06em;font-weight:400;margin-top:12px}
/* knoppen */
.ms .kn{display:inline-flex;align-items:center;gap:12px;height:60px;padding:0 30px;font-size:13px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;border:0;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s}
.ms .kn svg{width:20px;height:20px;flex:none;stroke-width:1.6}
.ms .kn.wit{background:#fff;color:var(--ink)}.ms .kn.wit:hover{background:#e6e6e6}
.ms .kn.zw{background:var(--ink);color:#fff}.ms .kn.zw:hover{background:#2b323b}
.ms .kn.lijn{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}.ms .kn.lijn:hover{background:var(--ink);color:#fff}
.ms .kn.tekst{background:transparent;color:#fff;padding:0 10px}.ms .kn.tekst:hover{text-decoration:underline;text-underline-offset:6px}
.ms .kn.tekst.donker{color:var(--ink)}
.ms .knoppen{display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin-top:32px}
.ms .rond{width:70px;height:70px;border-radius:50%;display:grid;place-items:center;border:0;cursor:pointer;color:#fff}
.ms .rond svg{width:24px;height:24px}
/* promo + nav */
.ms .promo{background:var(--ink);color:#fff;text-align:center;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:400;padding:12px 16px}.ms .promo a:hover{text-decoration:underline;text-underline-offset:4px}
.ms .nav{position:sticky;top:0;z-index:40;background:#fff;border-bottom:1px solid var(--lijn)}
.ms .nav .in{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;height:92px;width:min(1920px,100% - 80px)}
.ms .lk{display:flex;gap:28px;align-items:center;font-size:13px;font-weight:500;letter-spacing:.16em;text-transform:uppercase}
.ms .lk a{white-space:nowrap}.ms .lk a:hover{text-decoration:underline;text-underline-offset:6px}.ms .lk .sep{width:1px;height:28px;background:var(--lijn)}.ms .lk .lk-p{display:none}
.ms .merk{font-size:clamp(16px,1.6vw,22px);font-weight:400;letter-spacing:.38em;text-transform:uppercase;padding-left:.38em;text-align:center}.ms .merk img{height:30px;width:auto;margin:0 auto}
.ms .util{display:flex;gap:34px;justify-content:flex-end;align-items:center;font-size:13px;font-weight:500;letter-spacing:.16em;text-transform:uppercase}
.ms .util a{display:inline-flex;align-items:center;gap:12px}.ms .util a:hover{text-decoration:underline;text-underline-offset:6px}.ms .util svg{width:24px;height:24px;stroke-width:1.5}
.ms #msm{display:none}.ms .hb{display:none;width:44px;height:44px;align-items:center;justify-content:center;cursor:pointer;justify-self:end}.ms .hb svg{width:26px}
/* hero + stapelblokken (volle breedte beeld, tekst eroverheen) */
.ms .blok{position:relative;min-height:min(100vh,960px);display:flex;align-items:flex-start;color:#fff;overflow:hidden;background:#2a2f36}
.ms .blok.laag{min-height:min(84vh,820px)}
.ms .bk-bg,.ms .bk-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ms .blok.ken .bk-bg,.ms .blok.ken .bk-img{inset:-3%;width:106%;height:106%;animation:kenb 26s ease-in-out infinite alternate}
@keyframes kenb{to{transform:scale(1.06) translate(-1%,-.6%)}}
.ms .bk-img{display:none;max-width:none}.ms .blok.foto .bk-img{display:block}.ms .blok.foto .bk-bg{display:none}
.ms .bk-scrim{position:absolute;inset:0;background:linear-gradient(90deg,rgb(0 0 0 / .55),rgb(0 0 0 / .15) 55%,transparent),linear-gradient(180deg,rgb(0 0 0 / .25),transparent 30%,transparent 70%,rgb(0 0 0 / .35))}
.ms .bk-ui{position:relative;width:min(1440px,100% - 80px);margin:0 auto;padding:clamp(80px,12vh,140px) 0 110px;display:flex;flex-direction:column;gap:0}
.ms .blok.onder .bk-ui{align-self:flex-end;padding:0 0 110px}
.ms .bk-ui .k1{max-width:16ch;text-shadow:0 1px 20px rgb(0 0 0 / .25)}
.ms .bk-ui .tx{margin-top:22px;color:rgb(255 255 255 / .92);max-width:46ch}
.ms .bk-ui .vanaf{color:rgb(255 255 255 / .9)}
.ms .meer{position:absolute;right:40px;top:40px;background:#0c121c}
.ms .pauze{position:absolute;right:40px;bottom:40px;background:transparent;box-shadow:inset 0 0 0 1.5px #fff;width:58px;height:58px}.ms .pauze svg{width:18px;height:18px}.ms .pauze .sp{display:none}.ms.stil .pauze .sp{display:block}.ms.stil .pauze .pz{display:none}
.ms .pijl{position:absolute;left:50%;bottom:40px;transform:translateX(-50%);background:rgb(0 0 0 / .45);width:58px;height:58px;animation:pijl 2.4s ease-in-out infinite}.ms .pijl svg{width:22px;height:22px}
@keyframes pijl{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)}}
.ms.stil .blok *,.ms.stil .nacht *,.ms.stil .story *{animation-play-state:paused!important}
/* gesplitste blokken: beeld + tekst */
.ms .split{display:grid;grid-template-columns:1fr 1fr;min-height:min(80vh,760px);background:#fff}
.ms .split.grijs{background:var(--grijs)}.ms .split.donker{background:var(--ink);color:#fff}
.ms .split>.beeld{position:relative;overflow:hidden;min-height:420px;background:#e9e9e9;display:grid;place-items:center}
.ms .split>.beeld .bk-bg,.ms .split>.beeld .bk-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ms .split>.tekst{display:flex;flex-direction:column;justify-content:center;padding:clamp(48px,7vw,110px) clamp(32px,7vw,120px)}
.ms .split.rechts>.beeld{order:2}
.ms .split .k2{max-width:18ch}.ms .split .tx{margin-top:22px;color:var(--muted)}.ms .split.donker .tx{color:rgb(255 255 255 / .8)}
.ms .split .knoppen .kn.tekst{color:var(--ink)}.ms .split.donker .knoppen .kn.tekst{color:#fff}
.ms .split>.beeld .mock{position:relative;width:min(520px,86%);margin:60px 0}
.ms .split>.beeld .pp{margin:50px auto;max-width:360px;box-shadow:0 0 0 9px #0f1317,0 0 0 10.5px #3a4448,0 50px 80px -40px rgb(0 0 0 / .5)}
.ms .pp-ond{display:none}
/* mail-/factuurmock, rechthoekig en rustig */
.ms .mail,.ms .fact{background:#fff;color:var(--ink);box-shadow:0 30px 60px -36px rgb(0 0 0 / .35);text-align:left;font-weight:300}
.ms .mail-h{padding:16px 22px;border-bottom:1px solid var(--lijn);display:flex;gap:14px;align-items:center;font-size:13px;color:var(--muted)}
.ms .mail-h .av{width:40px;height:40px;background:var(--ink);color:#fff;display:grid;place-items:center;flex:none;font-size:13px;letter-spacing:.1em;font-weight:500}
.ms .mail-h b{display:block;color:var(--ink);font-size:14px;font-weight:500;letter-spacing:.04em}.ms .mail-h .tijd{margin-left:auto;font-size:12px}
.ms .mail-s{padding:16px 22px 0;font-weight:500;font-size:15px;letter-spacing:.02em}
.ms .mail-b{padding:10px 22px 22px;font-size:14px;line-height:1.55}.ms .mail-b p{margin:0 0 10px}
.ms .mail-b ul{margin:0 0 14px;display:flex;flex-direction:column;gap:6px}.ms .mail-b li{display:flex;gap:10px;align-items:flex-start}.ms .mail-b li svg{width:14px;height:14px;flex:none;margin-top:4px}
.ms .mail-dag{display:flex;gap:14px;align-items:center;background:var(--grijs);padding:14px 16px;margin:0 0 14px}
.ms .mail-dag .d{width:48px;height:48px;background:var(--ink);color:#fff;display:grid;place-items:center;text-align:center;line-height:1;flex:none}.ms .mail-dag .d b{display:block;font-size:20px;font-weight:400}.ms .mail-dag .d small{font-size:9px;letter-spacing:.14em;text-transform:uppercase}
.ms .mail-dag strong{display:block;font-size:14px;font-weight:500}.ms .mail-dag span{font-size:12.5px;color:var(--muted)}
.ms .mail-k{display:flex;gap:10px;flex-wrap:wrap}.ms .mail-k a{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;background:var(--ink);color:#fff}.ms .mail-k a.l{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}.ms .mail-k svg{width:14px;height:14px}
.ms .fact-h{display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid var(--lijn)}.ms .fact-h .av{width:44px;height:44px;background:var(--ink);color:#fff;display:grid;place-items:center;flex:none}.ms .fact-h .av svg{width:20px;height:20px}
.ms .fact-h b{display:block;font-size:14px;font-weight:500;letter-spacing:.06em;text-transform:uppercase}.ms .fact-h small{font-size:13px;color:var(--muted)}.ms .fact-h>div{flex:1}
.ms .fact-r{display:flex;justify-content:space-between;gap:12px;padding:14px 24px;border-top:1px solid #efefef;font-size:15px}.ms .fact-r:nth-of-type(2){border-top:0}.ms .fact-r b{font-weight:500}.ms .fact-r.tot{border-top:1px solid var(--lijn);font-weight:500}
.ms .fact-ok{display:flex;align-items:center;gap:10px;padding:14px 24px;background:var(--ink);color:#fff;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:500}.ms .fact-ok svg{width:16px;height:16px}
.ms .tag{display:inline-flex;align-items:center;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;padding:6px 12px;background:var(--grijs);color:var(--ink)}
/* credits-cijfers in split */
.ms .cijfers{display:grid;grid-template-columns:1fr 1fr;gap:28px 40px;margin-top:34px}
.ms .cf b{display:block;font-size:clamp(40px,4vw,56px);font-weight:200;line-height:1;letter-spacing:.02em}.ms .cf h3{font-size:13px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;margin-top:10px}.ms .cf p{font-size:14px;color:var(--muted);margin-top:6px;font-weight:300}
.ms .split.donker .cf p{color:rgb(255 255 255 / .7)}
/* dienstenwebshop */
.ms .shop{padding:clamp(72px,9vw,120px) 0 clamp(40px,6vw,80px);text-align:center}
.ms .shop .tx{margin:22px auto 0;color:var(--muted)}
.ms #ms-calc{min-height:600px;margin-top:clamp(40px,5vw,64px)}.ms #ms-calc iframe{display:block;width:1px;min-width:100%;border:0;background:transparent}
/* ons werk mozaïek */
.ms .werk{padding:clamp(72px,9vw,120px) 0;background:#fff}
.ms .werk-k{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}
.ms .wk-filter{display:flex;gap:22px;flex-wrap:wrap}.ms .wk-filter button{border:0;background:none;color:var(--ink);font:500 12px Jost,sans-serif;letter-spacing:.16em;text-transform:uppercase;padding:8px 0;cursor:pointer;border-bottom:1.5px solid transparent}.ms .wk-filter button[aria-pressed="true"]{border-bottom-color:var(--ink)}
.ms .wk-grid{columns:3;column-gap:16px;margin-top:clamp(32px,4vw,48px)}
.ms .wk-it{break-inside:avoid;margin:0 0 16px;position:relative;overflow:hidden;background:#e9e9e9;cursor:zoom-in}
.ms .wk-it img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .8s}.ms .wk-it:hover img{transform:scale(1.04)}
.ms .wk-it figcaption{position:absolute;left:0;right:0;bottom:0;padding:40px 20px 18px;color:#fff;background:linear-gradient(180deg,transparent,rgb(0 0 0 / .6));display:flex;flex-direction:column;gap:2px;pointer-events:none}.ms .wk-it figcaption:empty{display:none}
.ms .wk-it b{font-size:13px;font-weight:500;letter-spacing:.14em;text-transform:uppercase}.ms .wk-it span{font-size:13px;opacity:.85}
.wk-lb{position:fixed;inset:0;z-index:99999;background:rgb(0 0 0 / .94);display:none;align-items:center;justify-content:center;padding:20px}.wk-lb.aan{display:flex}
.wk-lb figure{margin:0;max-width:min(1600px,100%);max-height:100%;display:flex;flex-direction:column;align-items:center;gap:12px}.wk-lb img{max-width:100%;max-height:calc(100vh - 90px)}
.wk-lb figcaption{color:#fff;text-align:center;font-family:Jost,sans-serif;font-weight:300}.wk-lb figcaption b{display:block;font-size:13px;letter-spacing:.14em;text-transform:uppercase;font-weight:500}.wk-lb figcaption span{font-size:13px;opacity:.75}
.wk-lb button{position:absolute;background:transparent;color:#fff;border:1px solid rgb(255 255 255 / .5);width:50px;height:50px;border-radius:50%;font-size:26px;line-height:1;cursor:pointer;display:grid;place-items:center}
.wk-lb .wk-x{top:20px;right:20px}.wk-lb .wk-p{left:20px;top:50%;transform:translateY(-50%)}.wk-lb .wk-n{right:20px;top:50%;transform:translateY(-50%)}
/* volgende stap: 4 kaarten */
.ms .stap4{padding:clamp(72px,9vw,120px) 0;background:var(--grijs)}
.ms .kaarten{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:clamp(32px,4vw,48px)}
.ms .kt{background:#fff;display:flex;flex-direction:column;min-height:260px;transition:transform .3s}.ms .kt:hover{transform:translateY(-4px)}
.ms .kt .ki{height:150px;background:var(--ink);color:#fff;display:grid;place-items:center}.ms .kt .ki svg{width:34px;height:34px;stroke-width:1.2}
.ms .kt .kb{padding:24px 26px 26px;display:flex;flex-direction:column;gap:8px;flex:1}
.ms .kt h3{font-size:13px;font-weight:500;letter-spacing:.16em;text-transform:uppercase}.ms .kt p{font-size:14px;color:var(--muted);flex:1}
.ms .kt .ga{font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:500;display:inline-flex;align-items:center;gap:10px;margin-top:8px}.ms .kt .ga::after{content:"";width:8px;height:8px;border-right:1.5px solid currentColor;border-top:1.5px solid currentColor;transform:rotate(45deg)}
/* vragen */
.ms .vragen{padding:clamp(72px,9vw,120px) 0}
.ms .faq{margin-top:clamp(32px,4vw,48px);border-top:1px solid var(--lijn)}
.ms details{border-bottom:1px solid var(--lijn)}
.ms summary{list-style:none;cursor:pointer;padding:24px 0;font-weight:500;font-size:14px;letter-spacing:.14em;text-transform:uppercase;display:flex;justify-content:space-between;gap:16px;align-items:center}
.ms summary::-webkit-details-marker{display:none}
.ms summary::after{content:"";width:10px;height:10px;border-right:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);transform:rotate(45deg);flex:none;margin-right:8px;transition:transform .25s}
.ms details[open] summary::after{transform:rotate(-135deg)}
.ms details p{color:var(--muted);padding:0 0 26px;font-size:16px;max-width:70ch;font-weight:300}
/* contact / nieuwsbriefblok */
.ms .cont{background:var(--grijs);padding:clamp(60px,8vw,100px) 0}
.ms .cont .in{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.ms .cont .tx{color:var(--muted);margin-top:16px}
.ms .cont .knoppen{margin:0;justify-content:flex-end}
/* voet */
.ms footer{background:var(--ink);color:#fff;padding:clamp(56px,7vw,90px) 0 40px;font-weight:300}
.ms .vk{display:grid;grid-template-columns:repeat(4,1fr);gap:40px}
.ms .vk h4{margin:0 0 20px;font-size:12px;font-weight:500;letter-spacing:.18em;text-transform:uppercase}
.ms .vk li{margin:0 0 12px;font-size:14px;color:rgb(255 255 255 / .75)}.ms .vk a:hover{color:#fff;text-decoration:underline;text-underline-offset:5px}
.ms .vmerk{margin-top:70px;padding-top:30px;border-top:1px solid rgb(255 255 255 / .18);display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center}
.ms .vmerk .merk{text-align:left;padding:0;font-size:18px}
.ms .vlegal{display:flex;gap:26px;flex-wrap:wrap;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:rgb(255 255 255 / .7)}.ms .vlegal a:hover{color:#fff}
.ms .vcopy{margin-top:30px;font-size:12px;color:rgb(255 255 255 / .55);line-height:1.7;max-width:90ch}
/* scroll-reveal */
.ms.js .rv{opacity:0;transform:translateY(24px);transition:opacity 1s cubic-bezier(.2,.7,.2,1),transform 1s cubic-bezier(.2,.7,.2,1)}
.ms.js .rv.zicht{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.ms.js .rv{opacity:1;transform:none;transition:none}.ms *{animation:none!important}}
.ms a:focus-visible,.ms button:focus-visible,.ms summary:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
/* responsive */
@media (max-width:1180px){.ms .util a span{display:none}.ms .util{gap:24px}.ms .lk{gap:18px;font-size:12px}}
@media (max-width:980px){.ms .in{width:min(100% - 40px,1440px)}.ms .nav .in{grid-template-columns:auto 1fr auto;width:min(100% - 40px,1920px);height:72px}.ms .lk,.ms .util{display:none}.ms .merk{text-align:left;padding:0;justify-self:start}.ms .hb{display:flex}
  .ms #msm:checked~.nav .lk{display:flex;position:absolute;top:72px;left:0;right:0;flex-direction:column;align-items:stretch;gap:0;background:#fff;border-bottom:1px solid var(--lijn);padding:10px 20px 20px}
  .ms #msm:checked~.nav .lk a{padding:16px 0;border-bottom:1px solid var(--lijn)}.ms #msm:checked~.nav .lk .sep{display:none}.ms #msm:checked~.nav .lk .lk-p{display:block}
  .ms .split{grid-template-columns:1fr}.ms .split.rechts>.beeld{order:0}.ms .split>.beeld{min-height:380px}
  .ms .kaarten{grid-template-columns:1fr 1fr}.ms .vk{grid-template-columns:1fr 1fr}.ms .cont .in{grid-template-columns:1fr}.ms .cont .knoppen{justify-content:flex-start}
  .ms .bk-ui{width:min(100% - 40px,1440px);padding:80px 0 120px}.ms .meer{right:20px;top:20px;width:56px;height:56px}.ms .pauze{right:20px;bottom:24px;width:50px;height:50px}.ms .pijl{bottom:24px;width:50px;height:50px}
  .ms .wk-grid{columns:2}}
@media (max-width:640px){.ms .kaarten{grid-template-columns:1fr}.ms .vk{grid-template-columns:1fr}.ms .wk-grid{columns:1}.ms .cijfers{grid-template-columns:1fr 1fr;gap:22px}
  .ms .knoppen{flex-direction:column;align-items:stretch;gap:12px}.ms .kn{justify-content:center}.ms .kn.tekst{justify-content:flex-start;padding:0}.ms .blok{min-height:min(92vh,760px)}.ms .blok.laag{min-height:min(80vh,640px)}
  .wk-lb .wk-p,.wk-lb .wk-n{top:auto;bottom:16px;transform:none}}
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

/* overrides voor avondroute + fotoverhaal als volle blokken */
.ms .nacht{position:relative;min-height:min(84vh,820px);display:flex;align-items:flex-end;padding:0}
.ms .nacht .n-scene{position:absolute;inset:0;height:auto;margin:0}
.ms .n-tekst{position:relative;z-index:2;width:min(1440px,100% - 80px);margin:0 auto;padding:120px 0 110px;color:#fff}.ms .n-tekst .tx{margin-top:22px;color:rgb(255 255 255 / .85)}
.ms .n-huis{width:clamp(90px,11vw,170px)}
.ms .story{min-height:min(90vh,900px)}.ms .story .bk-ui{align-self:flex-end;padding:0 0 110px}.ms .story .tx{margin-top:22px;color:rgb(255 255 255 / .9)}
.ms .st-cap{margin-top:30px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:rgb(255 255 255 / .8)}.ms .st-cap b{display:block;font-weight:500;color:#fff}
.ms .st-dots i{border-radius:0;width:28px;height:2px}
@media (max-width:980px){.ms .n-tekst{width:min(100% - 40px,1440px);padding:80px 0 90px}}
.ms .pp{font-family:-apple-system,BlinkMacSystemFont,Inter,"Helvetica Neue",Arial,sans-serif;font-weight:400}

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
  const SC={
    glas:'<svg class="bk-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b232c"/><stop offset=".5" stop-color="#2e3a46"/><stop offset="1" stop-color="#0f141a"/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g1)"/><g stroke="#8ea1b3" stroke-opacity=".35" stroke-width="3"><path d="M400 0v900M800 0v900M1200 0v900M0 450h1600"/></g><path d="M300 0 900 900h260L560 0z" fill="url(#g2)"/><path d="M1050 0 1600 760V380L1300 0z" fill="url(#g2)" opacity=".6"/></svg>',
    kozijn:'<svg class="bk-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="k1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e6df"/><stop offset="1" stop-color="#c9c4b8"/></linearGradient></defs><rect width="1600" height="900" fill="url(#k1)"/><rect x="430" y="120" width="740" height="700" fill="#f7f6f2"/><rect x="470" y="160" width="660" height="620" fill="#39434d"/><g fill="#f7f6f2"><rect x="790" y="160" width="20" height="620"/><rect x="470" y="440" width="660" height="20"/></g><rect x="470" y="160" width="660" height="620" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/><path d="M470 160 1130 780" stroke="#fff" stroke-opacity=".12" stroke-width="120"/></svg>',
    zon:'<svg class="bk-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="z1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b86a3"/><stop offset=".6" stop-color="#9fb4c8"/><stop offset="1" stop-color="#3b4852"/></linearGradient><linearGradient id="z2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2a3a"/><stop offset="1" stop-color="#0d1620"/></linearGradient></defs><rect width="1600" height="900" fill="url(#z1)"/><path d="M0 900 300 420h1300v480z" fill="#5a5048"/><g fill="url(#z2)" stroke="#9fb4c8" stroke-opacity=".5" stroke-width="2">'+[0,1,2,3,4,5].map(i=>[0,1,2].map(j=>`<path d="M${330+i*200+j*40} ${440+j*120} h190 l-30 120 h-190z"/>`).join("")).join("")+'</g><circle cx="1350" cy="130" r="70" fill="#fff5d6" opacity=".9"/></svg>',
    gebouw:'<svg class="bk-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="b1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101418"/><stop offset="1" stop-color="#2a3139"/></linearGradient></defs><rect width="1600" height="900" fill="url(#b1)"/><g fill="#8fa6b8" fill-opacity=".22" stroke="#c9d6e0" stroke-opacity=".25">'+[0,1,2,3,4,5,6,7,8,9].map(i=>[0,1,2,3,4].map(j=>`<rect x="${120+i*140}" y="${80+j*160}" width="100" height="120"/>`).join("")).join("")+'</g><path d="M0 0 1600 900" stroke="#fff" stroke-opacity=".08" stroke-width="220"/></svg>'};
  const mapS=(a,f)=>a.map(f).join("");
  return `<input type="checkbox" id="msm" hidden>
<div class="promo"><a href="#credits">Nu: € ${e(String(o.refWelkom||10))} welkomstkorting via een buur, ${e(String(o.refBeloning||15))} credits voor uzelf &rsaquo;</a></div>
<header class="nav"><div class="in">
  <nav class="lk"><a href="#diensten">Diensten</a><a href="#portaal">Portaal</a><a href="#werk">Ontdekken</a><span class="sep"></span><a href="#prijs">Prijs berekenen</a>${portaal?`<a class="lk-p" href="${e(portaal)}">Mijn portaal</a>`:""}</nav>
  <a class="merk" href="#top">${o.logo?`<img src="${o.logo}" alt="${naam}">`:naam}</a>
  <div class="util">${portaal?`<a href="${e(portaal)}">${IC.user}<span>Mijn portaal</span></a>`:""}<a href="#prijs">${IC.cam}<span>Dienstenwebshop</span></a><a href="#vragen">${IC.bel}<span>Ondersteuning</span></a>${wa?`<a href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${IC.wa}</a>`:""}</div>
  <label class="hb" for="msm" aria-label="Menu">${IC.menu}</label></div></header>
<section class="blok ken" id="top" data-blok="0">${HV_SCENE.replace('class="hv-bg"','class="bk-bg"')}<img class="bk-img" alt="" data-bk-img><div class="bk-scrim"></div>
  <div class="bk-ui"><h1 class="k1">Glasbewassing<br>op vaste route</h1><p class="tx">Heldere ramen en kozijnen, elke acht weken. Vaste prijs per beurt, twee dagen vooraf aangekondigd en op de dag zelf live te volgen.</p>
    <div class="knoppen"><a class="kn wit" href="#prijs">${IC.cam}Bereken uw prijs</a>${portaal?`<a class="kn tekst" href="${e(portaal)}">${IC.user}Mijn portaal</a>`:`<a class="kn tekst" href="#portaal">${IC.user}Het klantportaal</a>`}</div></div>
  <button type="button" class="rond meer" aria-label="Meer" data-meer><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>
  <a class="rond pijl" href="#diensten" aria-label="Verder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
  <button type="button" class="rond pauze" data-pauze aria-label="Animatie pauzeren" aria-pressed="false"><svg class="pz" viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2" width="3" height="12"/><rect x="9.5" y="2" width="3" height="12"/></svg><svg class="sp" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg></button>
</section>
<div id="diensten">
<section class="blok laag onder" data-blok="1">${SC.glas}<img class="bk-img" alt="" data-bk-img><div class="bk-scrim"></div>
  <div class="bk-ui rv"><h2 class="k1">Glasbewassing</h2><p class="vanaf">Vanaf € ${e(o.minPrijs)} per beurt</p><p class="tx">Buitenzijde van alle ramen, inclusief kozijnen. Op een vaste route bij u in de buurt.</p>
    <div class="knoppen"><a class="kn wit" href="#prijs">Ontdekken</a><a class="kn tekst" href="#prijs">${IC.cam}Prijs berekenen</a></div></div></section>
<section class="blok laag onder" data-blok="2">${SC.kozijn}<img class="bk-img" alt="" data-bk-img><div class="bk-scrim"></div>
  <div class="bk-ui rv"><h2 class="k1">Kozijnreiniging</h2><p class="vanaf">Vanaf € ${e(o.kozMin)} per beurt</p><p class="tx">Kunststof en geschilderde kozijnen, dorpels en dakkapellen. Los te bestellen of bij elke beurt.</p>
    <div class="knoppen"><a class="kn wit" href="#prijs">Ontdekken</a><a class="kn tekst" href="#prijs">${IC.cam}Prijs berekenen</a></div></div></section>
<section class="blok laag onder" data-blok="3">${SC.zon}<img class="bk-img" alt="" data-bk-img><div class="bk-scrim"></div>
  <div class="bk-ui rv"><h2 class="k1">Zonnepanelen<br>en dakgoot</h2><p class="vanaf">Extra dienst, ${e(String(o.crExtra||3))} credits per bestelling</p><p class="tx">Meer opbrengst uit schone panelen en een dakgoot die het water weer kwijt kan. Eén tik in uw portaal.</p>
    <div class="knoppen"><a class="kn wit" href="#prijs">Ontdekken</a><a class="kn tekst" href="#portaal">${IC.user}Via het portaal</a></div></div></section>
<section class="blok laag onder" data-blok="4">${SC.gebouw}<img class="bk-img" alt="" data-bk-img><div class="bk-scrim"></div>
  <div class="bk-ui rv"><h2 class="k1">Zakelijk en VvE</h2><p class="vanaf">Prijs op maat</p><p class="tx">Kantoor, winkel, school of appartementencomplex. Vaste weekdagen, logboek met foto's en een bewonersbord met QR-code in de hal.</p>
    <div class="knoppen"><a class="kn wit" href="#prijs">Ontdekken</a><a class="kn tekst" href="#contact">${IC.mail}Contact opnemen</a></div></div></section>
</div>
<section class="split grijs" id="portaal"><div class="beeld"><div class="pp" data-pp role="img" aria-label="Zo ziet uw klantportaal eruit op de dag zelf: live zien waar het busje is en hoe laat we er zijn">
    <div class="pp-sb"><b>11:02</b><i></i><span><svg viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" opacity=".4"/><rect x="2.2" y="2.2" width="15" height="7.6" rx="1.8"/><rect x="23.6" y="4" width="1.8" height="4" rx=".9" opacity=".4"/></svg></span></div>
    <div class="pp-top">${o.logo?`<img src="${e(o.logo)}" alt="">`:`<span class="pp-lg">${IC.raam}</span>`}<span>Goedemiddag, Sanne</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></div>
    <div class="pp-main">
      <div class="pp-hero"><div class="pp-hk"><div><p class="pp-k"><span class="pp-puls"></span>Vandaag</p><span class="pp-adr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>Lindenlaan 14<em>, Zuidhorn</em></span></span><h3>Woensdag 14 oktober</h3></div>
        <div class="pp-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="t"/><circle cx="50" cy="50" r="44" class="v"/></svg><span><b>0</b><small>dagen</small></span></div></div>
        <p class="pp-s" data-pp-sub>Rond 11:10 · we zijn onderweg</p></div>
      <div class="pp-lv"><div class="pp-map" data-pp-map>${PP_KAART}<div class="pp-ov"><span class="pp-lijn" data-pp-lijn></span><span class="pp-huis" style="left:73.3%;top:80%"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg></span><span class="pp-auto" data-pp-bus><span class="pp-pl"></span><span class="pp-rot" data-pp-rot>${PP_BUS}</span></span></div></div>
        <div class="pp-info"><span class="pp-car">${PP_AUTO}</span><div class="pp-tx"><small class="pp-st"><i></i>Live</small><b data-pp-t>Nog 2 adressen voor u</b><span data-pp-s2>Robin is in de buurt</span></div><div class="pp-eta"><small>Verwacht</small><b data-pp-eta>± 11:10</b></div></div></div>
    </div></div></div>
  <div class="tekst rv"><h2 class="k2">Het klantportaal</h2><p class="tx">Zonder wachtwoord, gewoon met uw e-mailadres. U ziet wanneer wij komen, volgt op de dag zelf live waar het busje is, bekijkt eerdere beurten en facturen, en regelt zelf verzetten, toegang of iets extra's.</p>
    <div class="knoppen">${portaal?`<a class="kn zw" href="${e(portaal)}">${IC.user}Mijn portaal</a>`:""}<a class="kn tekst donker" href="#aankondiging">Ontdekken</a></div></div></section>
<section class="split rechts" id="aankondiging"><div class="beeld" style="background:#e4e4e4"><div class="mock mail" role="img" aria-label="Voorbeeld van de aankondigingsmail"><div class="mail-h"><span class="av">MS</span><div><b>${naam}</b>aan Sanne</div><span class="tijd">zondag 26 okt.</span></div>
    <div class="mail-s">Aankondiging: glasbewassing op dinsdag 28 oktober</div>
    <div class="mail-b"><p>Beste Sanne,</p><div class="mail-dag"><span class="d"><b>28</b><small>okt</small></span><div><strong>Dinsdag 28 oktober, rond 11:00 uur</strong><span>Lindenlaan 14, Zuidhorn · buitenzijde, inclusief kozijnen</span></div></div>
      <ul><li>${IC.ok}<span>Ramen en ventilatieroosters gesloten houden</span></li><li>${IC.ok}<span>Horren verwijderen en rolluiken openen</span></li><li>${IC.ok}<span>Poorten en hekwerk toegankelijk maken</span></li></ul>
      <div class="mail-k"><a>Open mijn portaal</a><a class="l">Verzetten</a></div></div></div></div>
  <div class="tekst rv"><h2 class="k2">Twee dagen vooraf weet u het</h2><p class="tx">Direct na uw aanmelding krijgt u een bevestiging met bestellingsoverzicht. Twee dagen voor elke beurt volgt de aankondiging: dag, richttijd, wat wij komen doen en waar u even aan moet denken. Past het niet? Verzetten kan met één tik.</p>
    <div class="knoppen"><a class="kn zw" href="#prijs">Aanmelden</a><a class="kn tekst donker" href="#vragen">Veelgestelde vragen</a></div></div></section>
<section id="route" class="nacht"><div class="n-scene" aria-hidden="true">${mapS([[6,22],[14,38],[22,61],[30,17],[38,80],[46,44],[54,70],[62,29],[70,55],[78,12],[86,66],[94,36]],([x,y])=>`<i class="n-ster" style="left:${x}%;top:${y}%;animation-delay:${(x*7)%30/10}s"></i>`)}<span class="n-maan"></span>
    <div class="n-grond"></div><div class="n-weg"></div>
    ${mapS([8,24,40,56,72,88],x=>{const d=((x+12)/120*16-1.44).toFixed(2);return `<span class="n-huis" style="left:${x}%;--d:${d}s">${N_HUIS}<span class="n-vink">${IC.ok}</span></span>`})}
    <span class="n-bus"><span class="n-licht"></span>${bus.replace(/id="ms/g,'id="mn').replace(/url\(#ms/g,"url(#mn")}</span></div>
  <div class="n-tekst rv"><h2 class="k1">Elke acht weken.<br>Vanzelf.</h2><p class="tx">U staat vast op onze route. Wij komen langs, u hoeft er niet aan te denken.</p><div class="knoppen"><a class="kn wit" href="#prijs">Aanmelden</a></div></div></section>
<section class="split" id="betalen"><div class="beeld" style="background:#ececec"><div class="mock fact" role="img" aria-label="Voorbeeld van een online betaalde factuur"><div class="fact-h"><span class="av">${IC.euro}</span><div><b>Factuur ${new Date().getFullYear()}-0127</b><small>Glasbewassing · Lindenlaan 14, Zuidhorn</small></div><span class="tag">Betaald</span></div>
    <div class="fact-r"><span>Glasbewassing · 14 ramen</span><b>€ 42,50</b></div><div class="fact-r"><span>Credits (aanbeveling)</span><b>− € 15,00</b></div><div class="fact-r tot"><span>Te betalen</span><b>€ 27,50</b></div>
    <div class="fact-ok">${IC.ok}<span>Betaald${o.mollie?" met iDEAL":""} · 1 uur na ontvangst</span></div></div></div>
  <div class="tekst rv"><h2 class="k2">Betalen in één minuut</h2><p class="tx">Na elke beurt krijgt u de factuur per e-mail${o.mollie?", met een iDEAL-knop":""}. Credits gaan er automatisch af. In uw portaal ziet u uw betaalgedrag en uw plek bij onze snelste betalers.</p>
    <div class="knoppen"><a class="kn tekst donker" href="#credits">Over credits</a></div></div></section>
<section class="split rechts donker" id="credits"><div class="beeld" style="background:#1a2028"><div style="padding:60px 40px;width:min(560px,90%)"><div class="cijfers">
      <div class="cf"><b>+${e(String(o.refBeloning||15))}</b><h3>Buur aanbevelen</h3><p>Uw buur krijgt € ${e(String(o.refWelkom||10))} korting, u ${e(String(o.refBeloning||15))} credits na de eerste beurt.</p></div>
      <div class="cf"><b>+${e(String(o.crReview||5))}</b><h3>Google-review</h3><p>Eenmalig, als dank.</p></div>
      <div class="cf"><b>+${e(String(o.crBeurt||1))}</b><h3>Beurt beoordelen</h3><p>Na elk bezoek in uw portaal.</p></div>
      <div class="cf"><b>+${e(String(o.crExtra||3))}</b><h3>Extra dienst</h3><p>Kozijnen, binnenzijde, zonnepanelen of dakgoot.</p></div></div></div></div>
  <div class="tekst rv"><h2 class="k2">Credits. Korting die vanzelf komt</h2><p class="tx">1 credit is € 1 korting op uw volgende factuur. U spaart ze door een buur aan te bevelen, een review te geven, een beurt te beoordelen of iets extra's te bestellen.</p>
    <div class="knoppen"><a class="kn wit" href="#prijs">Aanmelden</a>${portaal?`<a class="kn tekst" href="${e(portaal)}">Mijn credits</a>`:""}</div></div></section>
<section class="shop" id="prijs"><div class="in"><div class="rv"><h2 class="k1">Bereken uw prijs</h2><p class="tx">Maak een foto van uw woning, tik de ramen aan en zie direct uw vaste prijs per beurt. Aanmelden kan meteen.</p></div><div id="ms-calc"></div></div></section>
<section id="verhaal" class="story" data-story hidden><div data-st-imgs></div><div class="st-scrim"></div><div class="bk-ui onder"><h2 class="k1">Ons werk</h2><p class="tx">Gefotografeerd bij onze klanten, na de beurt.</p><div class="st-cap" data-st-cap></div><div class="st-dots" data-st-dots></div></div></section>
<section id="werk" class="werk" data-werk="${e(o.werkApi||"")}" ${o.werkApi?"":"hidden"}><div class="in"><div class="werk-k rv"><div><h2 class="k2">Ontdekken</h2><p class="tx" style="margin-top:10px">Echte foto's van ons werk in de buurt. Geen stockfoto's.</p></div><div class="wk-filter" data-werk-filter hidden></div></div><div class="wk-grid" data-werk-grid></div></div></section>
<section class="stap4" id="volgende"><div class="in"><h2 class="k2 rv">Zet de volgende stap</h2><div class="kaarten">
  <a class="kt rv" href="#prijs"><span class="ki">${IC.cam}</span><span class="kb"><h3>Prijs berekenen</h3><p>Met een foto van uw woning, in een minuut.</p><span class="ga">Dienstenwebshop</span></span></a>
  <a class="kt rv" href="${portaal?e(portaal):"#portaal"}"><span class="ki">${IC.user}</span><span class="kb"><h3>Mijn portaal</h3><p>Inloggen met uw e-mailadres, zonder wachtwoord.</p><span class="ga">Naar het portaal</span></span></a>
  <a class="kt rv" href="#contact"><span class="ki">${IC.gebouw}</span><span class="kb"><h3>Zakelijk en VvE</h3><p>Een prijs op maat voor uw pand of complex.</p><span class="ga">Aanvragen</span></span></a>
  <a class="kt rv" href="#credits"><span class="ki">${IC.gift}</span><span class="kb"><h3>Buur aanbevelen</h3><p>€ ${e(String(o.refWelkom||10))} voor uw buur, ${e(String(o.refBeloning||15))} credits voor u.</p><span class="ga">Zo werkt het</span></span></a>
</div></div></section>
<section class="vragen" id="vragen"><div class="in"><h2 class="k2 rv">Veelgestelde vragen</h2><div class="faq">${faq.map(([q,a])=>`<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join("")}</div></div></section>
<section class="cont" id="contact"><div class="in"><div class="rv"><h2 class="k2">Altijd bereikbaar</h2><p class="tx">Stuur een berichtje via WhatsApp of mail. Wij reageren meestal dezelfde dag.</p></div>
  <div class="knoppen">${wa?`<a class="kn zw" href="${wa}" target="_blank" rel="noopener">${IC.wa}WhatsApp</a>`:""}${o.email?`<a class="kn lijn" href="mailto:${e(o.email)}">${IC.mail}E-mail</a>`:""}</div></div></section>
<footer><div class="in"><div class="vk">
  <div><h4>Diensten</h4><ul><li><a href="#diensten">Glasbewassing</a></li><li><a href="#diensten">Kozijnreiniging</a></li><li><a href="#diensten">Zonnepanelen en dakgoot</a></li><li><a href="#diensten">Zakelijk en VvE</a></li></ul></div>
  <div><h4>Klanten</h4><ul>${portaal?`<li><a href="${e(portaal)}">Mijn portaal</a></li>`:""}<li><a href="#aankondiging">Aankondiging en verzetten</a></li><li><a href="#betalen">Betalen</a></li><li><a href="#credits">Credits</a></li></ul></div>
  <div><h4>Ontdekken</h4><ul><li><a href="#werk">Ons werk</a></li><li><a href="#route">Vaste route</a></li><li><a href="#vragen">Veelgestelde vragen</a></li></ul></div>
  <div><h4>Contact</h4><ul>${o.email?`<li><a href="mailto:${e(o.email)}">${e(o.email)}</a></li>`:""}${tel?`<li><a href="tel:${e(telH)}">${e(tel)}</a></li>`:""}${wa?`<li><a href="${wa}" target="_blank" rel="noopener">WhatsApp</a></li>`:""}${o.adres?`<li>${e(o.adres)}${o.postcode?", "+e(o.postcode):""} ${e(o.plaats||"")}</li>`:""}</ul></div></div>
  <div class="vmerk"><span class="merk">${naam}</span><div class="vlegal">${o.voorwaarden?`<a href="${e(o.voorwaarden)}" target="_blank" rel="noopener">Algemene voorwaarden</a>`:""}${portaal?`<a href="${e(portaal)}">Klantportaal</a>`:""}<a href="#top">Naar boven</a></div></div>
  <p class="vcopy">© ${new Date().getFullYear()} ${naam}${o.kvk?` · KvK ${e(o.kvk)}`:""}. Prijzen zijn per beurt, inclusief btw, en gelden na controle van de telling bij het eerste bezoek. Twee dagen voor elke afspraak ontvangt u een aankondiging; het genoemde tijdstip is een richttijd.</p></div></footer>
`}

async function websiteDelen(){const fv=k=>{const el=typeof form!=="undefined"&&form&&form.querySelector(`[data-k="${k}"]`);return el?el.value:null};const s=S(),lg=await loadLogo();const wa=String(s.webWa||waNr(s.telefoon)||"").replace(/\D/g,"");
  const o={naam:s.naam,telefoon:s.telefoon,email:s.email,adres:s.adres,postcode:s.postcode,plaats:s.plaats,kvk:s.kvk,whatsapp:wa,logo:lg?await kleinLogo(lg.url):"",
    portaal:LIVE?location.origin+"/portaal":"",werkApi:LIVE?location.origin+"/api/portaal/werk":"",score:String(fv("webScore")??s.webScore??"4,8").trim(),reviewUrl:String(fv("webReviewUrl")||s.webReviewUrl||"https://www.google.com/search?q=mijnschoonmaker.com+Reviews").trim(),refBeloning:s.refBeloning!=null&&s.refBeloning!==""?Number(s.refBeloning):15,refWelkom:s.refWelkom!=null&&s.refWelkom!==""?Number(s.refWelkom):10,crReview:s.crReview??5,crBeurt:s.crBeurt??1,crExtra:s.crExtra??3,voorwaarden:s.webVoorwaarden||s.voorwaarden||"",minPrijs:(Number((state.ramen&&state.ramen.min)??56.2)).toFixed(2).replace('.',','),kozMin:(Number((state.ramen&&state.ramen.kozMin)??40.63)).toFixed(2).replace('.',','),mollie:!!s.liveMollie,bus:typeof RV_BUS!=="undefined"?RV_BUS:""};
  return {body:websiteBody(o),calc:await klantCalcHtml(wa),o}}
/* bonnetje: echt afscheuren langs de perforatie, met rafelrand en papiersnippers */
const WEB_JS=`var ms=(root.classList&&root.classList.contains("ms"))?root:(root.querySelector&&root.querySelector(".ms"))||root;if(ms.classList)ms.classList.add("js");function escT(t){return String(t||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var mr=root.querySelector("[data-meer]");if(mr&&!mr._ms){mr._ms=1;mr.addEventListener("click",function(){var d=root.querySelector("#volgende");if(d)d.scrollIntoView({behavior:"smooth"})})}
var pz=root.querySelector("[data-pauze]");if(pz&&!pz._ms){pz._ms=1;pz.addEventListener("click",function(){var aan=ms.classList.toggle("stil");pz.setAttribute("aria-pressed",aan?"true":"false");pz.setAttribute("aria-label",aan?"Animatie afspelen":"Animatie pauzeren")})}
if(window.IntersectionObserver){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("zicht");io.unobserve(x.target)}})},{rootMargin:"0px 0px -4% 0px",threshold:0});root.querySelectorAll(".rv").forEach(function(el){if(!el._rv){el._rv=1;io.observe(el)}})}else root.querySelectorAll(".rv").forEach(function(el){el.classList.add("zicht")});
function fotos(items){var n=0;root.querySelectorAll("[data-blok]").forEach(function(bk){var im=bk.querySelector("[data-bk-img]"),x=items[n];if(!im||!x||im.src)return;n++;im.onload=function(){bk.classList.add("foto")};im.src=x.url});
  var st=root.querySelector("[data-story]");if(!st||st._ms)return;st._ms=1;var L=items.slice(n,n+4);if(!L.length)L=items.slice(0,4);if(!L.length)return;st.hidden=false;var box=st.querySelector("[data-st-imgs]"),cap=st.querySelector("[data-st-cap]"),dots=st.querySelector("[data-st-dots]");
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
const WEB_FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500&family=Inter:wght@400;500;600&display=swap">';
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
