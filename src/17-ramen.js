/* ---------- RAMENWAS CALCULATOR: telling per verdieping, foto's met stippen, PDF-overzicht, offerte en klant ---------- */
/* draait in een eigen shadow-DOM, zodat de opmaak los staat van de rest van Mansard en hertekenen de telling niet wist */
const RC_CSS=`
:host{display:block;color:var(--ink);font-family:var(--f-ui);font-size:15px;line-height:1.5;
  --blue:var(--brand);--blue-ink:var(--brand-ink);--blue-soft:var(--brand-soft);
  --wall:var(--surface-2);--glass:color-mix(in srgb,var(--brand) 30%,var(--surface));--roof:var(--ink);
  --navy:#0f1f26;--navy-ink:#ffffff;--navy-muted:#a3b6bb;
  --grad-a:var(--brand);--grad-b:var(--brand-2);--on-grad:#ffffff;
  --note:var(--soon-bg);--note-line:color-mix(in srgb,var(--soon) 30%,transparent);--note-ink:var(--soon);
  --neg:var(--late);--logo-ink:#ffffff;--body:var(--f-ui);--display:var(--f-ui)}
*{box-sizing:border-box}
[hidden]{display:none!important}
.wrap{max-width:760px;display:flex;flex-direction:column;gap:16px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:22px;box-shadow:var(--shadow)}
.head{display:flex;gap:12px;align-items:flex-start;margin-bottom:6px}
.num{flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--grad-a),var(--grad-b));color:var(--on-grad);display:grid;place-items:center;font-weight:700;font-size:14px}
.eyebrow{font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:700}
h2{font-weight:700;font-size:17px;letter-spacing:-.01em;margin:3px 0 0;line-height:1.25}
.intro{margin:4px 0 6px 42px;color:var(--muted);font-size:14px}
.rows{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.ovg{border:1px solid var(--line);border-radius:16px;margin-top:10px;background:var(--surface)}
.ovg>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:12px 14px;font-weight:700}
.ovg>summary::-webkit-details-marker{display:none}
.ovg>summary::before{content:"+";width:24px;height:24px;border-radius:8px;display:grid;place-items:center;background:var(--line);font-weight:800;flex:none}
.ovg[open]>summary::before{content:"−"}
.ovg>summary::after{display:none!important;content:none!important}
.ovg>summary em{margin-left:auto;font-style:normal;font-weight:600;font-size:13px;color:var(--navy-muted)}
.ovg .rows{margin:0;padding:0 10px 10px}
.ovf{display:flex;align-items:center;gap:10px;padding:0 14px 10px}.ovf label{font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted,#5d6f76);font-weight:700}.ovf select{flex:1;max-width:260px}
.ovmeer{margin-top:10px;width:100%;height:46px;border-radius:14px;border:1.5px dashed var(--line);background:transparent;font:700 14px var(--f-ui,inherit);color:var(--navy-muted,#5d6f76);cursor:pointer}
.ovg .row .pic svg{width:26px;height:26px}
.pic:has(>svg[viewBox="0 0 64 60"]){background:none;box-shadow:none}
.swipe{position:relative;border-radius:16px;overflow:hidden;touch-action:pan-y;background:var(--line)}
.under{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding-inline:20px;color:#fff;font-weight:700;font-size:15px}
.under span{display:flex;align-items:center;gap:8px;opacity:0;transition:opacity .15s,transform .15s}
.swipe.dr .under{background:var(--ok)}.swipe.dl .under{background:var(--neg)}
.swipe.dr .u-add,.swipe.dl .u-sub{opacity:.75}
.swipe.armed .u-add,.swipe.armed .u-sub{transform:scale(1.08)}
.swipe.dr.armed .u-add,.swipe.dl.armed .u-sub{opacity:1}
.row{position:relative;display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:14px;align-items:center;padding:10px 12px;background:var(--surface);border:1px solid var(--line);border-radius:16px;user-select:none;-webkit-user-select:none;cursor:grab;will-change:transform}
.row.back{transition:transform .25s cubic-bezier(.2,.9,.3,1.2)}
.stepper input.bump{animation:bump .3s ease}
@keyframes bump{40%{transform:scale(1.35)}}
.hint{display:flex;align-items:center;gap:8px;margin:2px 0 4px 42px;font-size:13px;color:var(--muted)}
.hint i{white-space:nowrap;flex:none;font-style:normal;display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:99px;font-weight:700;font-size:12px}
.hint .h-add{background:var(--ok-bg);color:var(--ok)}
.hint .h-sub{background:var(--late-bg);color:var(--late)}
.pic{width:58px;height:54px;border-radius:14px;background:var(--wall);display:grid;place-items:center;overflow:hidden}
.pic svg{width:100%;height:100%;display:block}
.row.on .pic{background:var(--blue-soft);box-shadow:inset 0 0 0 1.5px var(--blue)}
.name{font-weight:700;font-size:15.5px;line-height:1.25}
.sub{font-size:12.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.stepper{display:flex;align-items:center;gap:4px;padding:3px;border-radius:99px;background:var(--bg);border:1px solid var(--line)}
.stepper button{width:36px;height:36px;border-radius:50%;border:0;background:var(--surface);color:var(--ink);font-size:19px;line-height:1;cursor:pointer;box-shadow:0 1px 2px rgb(0 0 0 / .1);transition:transform .12s,background .12s}
.stepper button:hover{background:var(--blue);color:var(--blue-ink)}
.stepper button:active{transform:scale(.92)}
.stepper input{width:40px;height:36px;border:0;text-align:center;font:700 16px var(--display);background:transparent;color:var(--ink);font-variant-numeric:tabular-nums;-moz-appearance:textfield}
.stepper input::-webkit-inner-spin-button,.stepper input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.row.on .stepper{border-color:var(--blue)}
.floor-actions{display:flex;gap:16px;margin:6px 0 0 70px;flex-wrap:wrap}
.link{border:0;background:none;padding:4px 0;color:var(--blue);font:700 13.5px var(--body);cursor:pointer}
.link:disabled{color:var(--muted);opacity:.5;cursor:not-allowed}
.tip{display:flex;flex-direction:column;gap:3px;margin-top:16px;padding:12px 14px;border-radius:14px;background:var(--note);border:1px solid var(--note-line);font-size:14px;line-height:1.45}
.tip b{font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--note-ink);font-weight:800}
button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 12px;margin-top:16px}
.fld{display:flex;flex-direction:column;gap:7px;min-width:0}
.fld.full{grid-column:1/-1}
.lab{display:flex;align-items:center;gap:6px;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:700}
.lab em{color:var(--neg);font-style:normal}
.in{width:100%;min-width:0;height:48px;border:1px solid var(--line);border-radius:12px;padding:0 14px;background:var(--surface);color:var(--ink);font:500 16px var(--body);transition:border-color .15s,box-shadow .15s}
select.in{padding-right:8px}
textarea.in{height:auto;padding:12px 14px;resize:vertical;line-height:1.45}
.in::placeholder{color:var(--muted);opacity:.65}
.in:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-soft)}
.last{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;border-radius:14px;background:var(--blue-soft);color:var(--ink);font-size:14px}
.last span{flex:1;min-width:180px}
.btn2{height:44px;padding:0 16px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:700 14px var(--body);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
.btn2:hover{border-color:var(--blue);color:var(--blue)}
.btn2:disabled{opacity:.55;cursor:wait}
.btn2 svg{width:16px;height:16px;flex:none}
.btn2.pri{background:linear-gradient(100deg,var(--grad-a),var(--grad-b));color:var(--on-grad);border:0}
.btn2.pri:hover{color:var(--on-grad);opacity:.9}
.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.ph,.addph{position:relative;aspect-ratio:1;max-width:100%;border-radius:14px;overflow:hidden}
.ph{border:1px solid var(--line);background:var(--wall);padding:0;cursor:pointer}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph .cnt{position:absolute;left:6px;bottom:6px;min-width:22px;height:22px;padding:0 6px;border-radius:99px;background:#e5484d;color:#fff;font:700 12px var(--body);display:grid;place-items:center}
.ph .rm{position:absolute;right:5px;top:5px;width:26px;height:26px;border-radius:50%;border:0;background:rgb(0 0 0 / .6);color:#fff;font-size:15px;line-height:1;cursor:pointer;display:grid;place-items:center}
.addph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:1.5px dashed var(--line);color:var(--muted);font-size:12.5px;font-weight:700;cursor:pointer;text-align:center;padding:6px}
.addph.ai{border:1.5px solid transparent;background:linear-gradient(135deg,#137a8a,#1d5a74);color:#fff;font:inherit;font-size:12.5px;font-weight:700}.addph.ai b{font-size:20px;line-height:1}.addph.ai.klaar{background:linear-gradient(135deg,#1b8a5a,#137a8a)}
.addph svg{width:26px;height:26px}
.addph:hover{border-color:var(--blue);color:var(--blue)}
.phhint{font-size:12.5px;color:var(--muted)}
.phsum{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px;color:var(--muted)}
.phsum span{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 5px;border-radius:99px;background:var(--wall);border:1px solid var(--line);color:var(--ink);font-weight:700}
.phsum span i{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 9px var(--body);font-style:normal}
.ed{position:fixed;inset:0;z-index:50;background:#0b0d0e;color:#fff;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px calc(env(safe-area-inset-bottom,0px) + 12px);font-family:var(--f-ui)}
.ed-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 4px 10px}
.ed-top b{font-weight:700;font-size:15px}
.ed-top span{font-size:13px;color:#aab2b8}
.ed-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ed-wrap{position:relative;touch-action:manipulation}
.ed-wrap img{display:block;width:100%;height:100%;border-radius:10px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.dot{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#e5484d;border:1px solid #fff;color:#fff;font:700 5.5px/1 var(--f-ui);letter-spacing:-.02em;display:grid;place-items:center;box-shadow:0 1px 2px rgb(0 0 0 / .45);cursor:pointer;padding:0}
.dot::after{content:"";position:absolute;inset:-7px;border-radius:50%}
.ed-tally{background:linear-gradient(180deg,#f7fafb,#eef4f5);color:#0f1f26;border-radius:16px;padding:12px 12px 10px;margin-top:12px;box-shadow:0 8px 24px -12px rgb(0 0 0 / .6)}
.et-h{display:flex;justify-content:space-between;align-items:baseline;font-size:11px;color:#5d6f76;text-transform:uppercase;letter-spacing:.09em;font-weight:700;padding:0 2px}.et-h b{color:#137a8a;font-size:17px;letter-spacing:0;text-transform:none;font-weight:800}
.et-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px;margin-top:9px}
.et-l span{position:relative;display:flex;flex-direction:column;gap:1px;padding:7px 9px 7px 12px;border-radius:11px;background:#fff;border:1px solid #dde5e8;font-size:11.5px;font-weight:600;color:#5d6f76;overflow:hidden;line-height:1.25}
.et-l span::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--c,#137a8a)}
.et-l i{display:none}
.et-l b{order:-1;font-size:19px;font-weight:800;color:#0f1f26;line-height:1.1}.et-l em{font-style:normal;font-size:10.5px;color:#8a9aa0}
.et-l span.hit{animation:ethit .7s ease-out}@keyframes ethit{0%{background:#ddf0f2;transform:translateY(-2px)}100%{background:#fff;transform:none}}
.et-e{font-size:13px;color:#5d6f76;margin-top:6px;padding:0 2px}.et-n{margin-top:8px;font-size:12px;line-height:1.4;color:#5d6f76;padding:0 2px}.et-w{margin-top:8px;font-size:12.5px;line-height:1.4;color:#a8650a;background:#fdf1dc;border-radius:10px;padding:7px 10px}
.ed-lab{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:#8d979d;font-weight:700;padding:12px 2px 6px}
.ed-types{display:flex;flex-wrap:wrap;gap:6px}
.ed-types button{display:flex;align-items:center;gap:6px;height:36px;padding:0 11px 0 6px;border-radius:99px;border:1.5px solid #2a3136;background:#161b1e;color:#c9d1d6;font:700 13px var(--f-ui);cursor:pointer;white-space:nowrap}
.ed-types button i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 9.5px var(--f-ui);font-style:normal;border:1.5px solid #fff}
.ed-types button b{font-weight:800;color:#8d979d;margin-left:2px}
.ed-types button[aria-checked="true"]{border-color:#fff;color:#0b0d0e;background:#fff}
.ed-types button[aria-checked="true"] b{color:#0b0d0e}
.ed-bar{display:flex;gap:8px;padding-top:12px}
.ed-stage{position:relative}
.ed-mode{display:flex;gap:4px;padding:4px;border-radius:13px;background:#161b1e;border:1px solid #2a3136;margin-top:12px;width:max-content;max-width:100%}

.ed-mode.licht{background:#f2f4f6;border-color:#e4e7ec}.ed-mode.licht button{color:#3a4250}.ed-mode.licht button[aria-pressed="true"]{background:#14181f;color:#fff}
.ed-mode button{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:10px;border:0;background:transparent;color:#c9d1d6;font:700 13px var(--f-ui);cursor:pointer}
.ed-mode button[aria-pressed="true"]{background:#fff;color:#0b0d0e}
.ed-mode i{width:14px;height:14px;border-radius:50%;background:#e5484d;display:grid;place-items:center}.ed-mode i.em-m{border-radius:4px;background:#ffc53d;color:#1d1a10}.ed-mode i svg{width:11px;height:11px}
.ed-mlb{padding-top:12px}.ed-mlb .ml-bar{justify-content:flex-start}.ed-mlb .ml-tip{text-align:left;margin-top:8px}
.ed-bar button{flex:1;height:48px;border-radius:14px;border:1px solid #2a3136;background:#161b1e;color:#fff;font:700 15px var(--f-ui);cursor:pointer}
.ed-bar .done{background:#fff;color:#0b0d0e;border-color:#fff}
.options{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:14px}
.field{display:flex;flex-direction:column;gap:6px}
.field>label,.flabel{font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:700}
.seg{display:flex;gap:4px;padding:4px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)}
.seg input{position:absolute;opacity:0;pointer-events:none}
.seg label{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:14.5px;font-weight:700;color:var(--muted);transition:background .15s,color .15s;white-space:nowrap}
.seg label svg{width:16px;height:16px;flex:none}
.seg input:checked+label{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px rgb(0 0 0 / .1)}
.seg label:hover{color:var(--ink)}
.seg input:focus-visible+label{outline:2px solid var(--blue);outline-offset:-2px}
.seg-fit{width:max-content;max-width:100%}
select{height:46px;border:1px solid var(--line);border-radius:12px;padding:0 12px;background:var(--surface);color:var(--ink);font:600 14.5px var(--body)}
.calc{width:100%;height:54px;border:0;border-radius:16px;background:linear-gradient(100deg,var(--grad-a),var(--grad-b));color:var(--on-grad);box-shadow:0 8px 20px -8px rgb(19 122 138 / .45);font:800 16.5px var(--display);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity .15s,transform .1s}
.calc:hover{opacity:.9}
.calc:active{transform:scale(.99)}
.calc svg{width:18px;height:18px}
.desk-calc{margin-top:18px;display:flex;align-items:center;gap:14px}
.desk-calc .cnt{flex:none;line-height:1.15}
.desk-calc .cnt b{font-size:22px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.desk-calc .cnt small{display:block;color:var(--muted);font-size:12px}
.stale{font-size:13px;color:var(--muted);text-align:center;margin:8px 0 0}
.result{border-radius:var(--r);overflow:hidden;border:1px solid var(--line);background:var(--surface);scroll-margin-top:80px;box-shadow:var(--shadow)}
.result-top{background:var(--navy);color:var(--navy-ink);padding:24px 22px;background-image:radial-gradient(120% 90% at 100% 0%,rgb(63 178 191 / .22),transparent 60%)}
.result-top .eyebrow{color:var(--navy-muted)}
.price{font-weight:800;font-size:clamp(38px,9vw,52px);letter-spacing:-.03em;line-height:1;margin-top:6px;font-variant-numeric:tabular-nums}
.price small{font-size:15px;font-weight:600;color:var(--navy-muted);letter-spacing:0;margin-left:6px}
.perfreq{display:flex;flex-direction:column;gap:3px;margin-top:10px;font-size:13px;color:var(--navy-muted)}.perfreq b{color:#fff;font-weight:700}
.kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid rgb(255 255 255 / .14)}
.kpis div{min-width:0}
.kpis b{display:block;font-weight:700;font-size:20px;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.kpis span{font-size:12px;color:var(--navy-muted)}
.klant{font-size:14px;color:var(--navy-muted);line-height:1.45;margin-bottom:14px}
.klant b{color:var(--navy-ink);font-weight:700}
.result-body{padding:8px 20px 20px}
.empty{padding:22px 20px;color:var(--muted);display:flex;gap:12px;align-items:center}
.empty svg{flex:none;width:28px;height:28px;color:var(--blue)}
.tablewrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:14px;min-width:0}
th,td{padding:9px 3px;text-align:right;border-bottom:1px solid var(--line)}
th:first-child,td:first-child{text-align:left}
th{font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:700}
td small{color:var(--muted);display:block;font-size:12px}
tr.group td{font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--blue);font-weight:800;border-bottom:0;padding-top:16px}
tr.sub td{color:var(--muted);border-bottom:0;padding-block:5px}
tr.tot td{font-weight:800;border-bottom:0;border-top:2px solid var(--ink);padding-top:11px}
.note{font-size:12.5px;color:var(--muted);margin:14px 0 0;line-height:1.5}
.acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:18px}
.acts .wide{grid-column:1/-1}
.msg{min-height:1.3em;margin-top:8px;font-size:13px;color:var(--muted);text-align:center}
.msg.ok{color:var(--ok)}.msg.bad{color:var(--late)}
.offimg{position:relative;margin-top:18px;border-radius:16px;overflow:hidden;border:1px solid var(--line);background:var(--wall);display:flex;flex-direction:column;gap:12px;padding:12px}
.offimg img{display:block;width:100%;height:auto;border-radius:8px;box-shadow:0 2px 10px rgb(0 0 0 / .12)}
.offimg .ph2{color:var(--muted);font-size:13px;text-align:center;padding:40px 0}
details summary{cursor:pointer;font-weight:700;list-style:none;display:flex;justify-content:space-between;align-items:center}
details summary::-webkit-details-marker{display:none}
details summary::after{content:"+";font-size:20px;color:var(--muted);font-weight:400}
details[open] summary::after{content:"−"}
.rates{width:100%;margin-top:12px;min-width:0}
.rates td,.rates th{padding:6px 4px}
.rates input,.extra input{height:38px;border:1px solid var(--line);border-radius:10px;padding:0 10px;background:var(--bg);color:var(--ink);font:600 14.5px var(--body);text-align:right;font-variant-numeric:tabular-nums}
.rates input{width:84px}
.extra{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:12px}
.extra input{width:100%}
.flag{color:var(--blue);font-weight:800;margin-left:3px}
@media (max-width:480px){
  .hint{margin-left:0}.intro{margin-left:0}
  .card{padding:16px}.row{grid-template-columns:48px minmax(0,1fr) auto;gap:10px;padding:9px 10px}
  .pic{width:48px;height:46px}.pic svg{width:100%;height:100%}
  .stepper button{width:31px;height:31px;font-size:17px}.stepper input{width:30px;font-size:15px}.name{font-size:15px}.sub{font-size:12px}
  .floor-actions{margin-left:54px}
  .acts{grid-template-columns:1fr}
  .form{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
:host([data-locked]) .form>.fld:not(.keep){display:none!important}
:host([data-locked]) .form{margin-top:10px}
:host([data-embed]) .form>.fld:not(.phf){display:none!important}
:host([data-embed]) .phf>.lab{display:none}
:host([data-embed]) .form{margin-top:10px}
:host([data-offerte]) #ovCard,:host([data-offerte]) #cFreq,:host([data-offerte]) #cFloors,:host([data-offerte]) #cSpecial,:host([data-offerte]) #cRates,:host([data-offerte]) .kozf,:host([data-offerte]) .desk-calc,:host([data-offerte]) #stale,:host([data-offerte]) #result,:host([data-offerte]) .mbar{display:none!important}
:host([data-offerte]) #cFreq .head h2{font-size:0}:host([data-offerte]) #cFreq .head h2::after{content:"Frequentie";font-size:20px}
:host([data-embed]) .wrap{max-width:none}
.handm{display:none}
:host([data-offerte]) .handm{display:inline-flex;align-self:flex-start;margin-top:8px;background:none;border:0;padding:0;font:inherit;font-size:13px;font-weight:600;color:#0d121b;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
:host([data-offerte][data-handmatig]) #cFloors,:host([data-offerte][data-handmatig]) #cSpecial{display:block!important}
:host([data-offerte][data-handmatig]) #cFloors .hint,:host([data-offerte][data-handmatig]) #cSpecial .hint{display:none}
.acts .b3{grid-column:auto}
.pv-stage{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:14px;padding:6px 0}
.pv-stage img{width:min(100%,760px);height:auto;border-radius:6px;box-shadow:0 4px 18px rgb(0 0 0 / .5);background:#fff}
/* ---- telling-editor in CRM-stijl ---- */
.ed{position:absolute;inset:0;background:#fff;color:#0d121b;padding:22px 24px calc(env(safe-area-inset-bottom,0px) + 20px);font-family:inherit}
.ed-top{padding:0 0 16px;margin-bottom:16px;border-bottom:1px solid #eceef1}
.ed-top b{display:inline-block;font-weight:600;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#0d121b;margin-bottom:6px}
.ed-top span{font-size:13.5px;color:#6b7180;line-height:1.45}
.ed-stage{background:#f4f5f6;border-radius:16px;padding:0}
@media (max-width:640px){.ed{padding:18px 16px calc(env(safe-area-inset-bottom,0px) + 14px)}.ed-bar button{letter-spacing:.14em;font-size:10.5px;padding:0 6px;white-space:nowrap}.ed-bar .done{letter-spacing:.18em}.ed-types button{height:34px;font-size:12px}}
.ed-wrap img{border-radius:8px}
.ed-tally{background:#fff;color:#0d121b;border:1px solid #e3e6ea;border-radius:16px;padding:14px 16px 12px;margin-top:14px;box-shadow:none}
.et-h{color:#6b7180;font-size:10.5px;letter-spacing:.2em;font-weight:600}.et-h b{color:#252c3c;font-size:18px;font-weight:600}
.et-l span{border-color:#e3e6ea;border-radius:10px;color:#6b7180;font-weight:500}.et-l b{color:#0d121b;font-weight:600}
.et-e,.et-n{color:#6b7180}
.ed-lab{font-size:10.5px;letter-spacing:.2em;color:#6b7180;font-weight:600;padding:16px 2px 8px}
.ed-types{gap:8px}
.ed-types button{height:38px;padding:0 14px 0 7px;border-radius:99px;border:1px solid #dfe2e7;background:#fff;color:#252c3c;font:600 12.5px/1 inherit;font-family:inherit;transition:background .15s,border-color .15s}
.ed-types button:hover{border-color:#252c3c}
.ed-types button i{border:0;box-shadow:0 0 0 2px #fff}
.ed-types button b{color:#8a8f99;font-weight:600}
.ed-types button[aria-checked="true"]{background:#252c3c;border-color:#252c3c;color:#fff}
.ed-types button[aria-checked="true"] b{color:#ecd3a3}
.ed-bar{gap:10px;padding-top:16px;margin-top:4px;border-top:1px solid #eceef1}
.ed-bar button{height:46px;border-radius:10px;border:1px solid #d4d7dd;background:#fff;color:#252c3c;font-family:inherit;font-size:11px;line-height:1;font-weight:500;letter-spacing:.24em;text-transform:uppercase;-webkit-font-smoothing:antialiased;transition:background .15s}
.ed-bar .done{font-weight:500;letter-spacing:.28em}
.ed-bar button:hover{background:#f4f5f6}
.ed-bar .done{background:#252c3c;color:#fff;border-color:#252c3c}
.ed-bar .done:hover{background:#323b50}
#pv .pv-stage{background:#f4f5f6;border-radius:16px;padding:16px}
#pv .pv-stage p{color:#6b7180!important}
#pv .pv-stage img{box-shadow:0 6px 20px -8px rgb(13 18 27 / .35)}
/* titels zoals de rest van het CRM */
.head .eyebrow{font-size:10.5px;letter-spacing:.2em;font-weight:600;color:#8a8f99}
.head h2{font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;margin-top:5px}
.num{background:#252c3c;color:#fff;font-weight:600;font-size:13px}
:host{--rr-leisteen:#56616a;--rr-leisteen-d:#4d575f;--rr-zilverwit:#f8f9f9;--rr-wit:#ffffff;--rr-lijn:#dfe0e0;--sv-satijn:linear-gradient(180deg,#efefec 0%,#e7e7e3 45%,#d9d9d6 100%);--sv-satijn-l:linear-gradient(180deg,#f5f5f3 0%,#ececea 60%,#e3e3e0 100%)}
`;
const RC_SVG={
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.6"/></svg>',
  arrow:'<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9h10M10 5l4 4-4 4"/></svg>',
  dl:'<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2.5v9M5 8l4 4 4-4M3 15.5h12"/></svg>',
  copy:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>',
  doc:'<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2.5h6.5L14 6v9.5H4z"/><path d="M10.5 2.5V6H14M6.5 9.5h5M6.5 12.5h5"/></svg>',
  user:'<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="3"/><path d="M3.5 15.5c.7-3 3-4.6 5.5-4.6s4.8 1.6 5.5 4.6"/></svg>',
  pers:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.6"/><path d="M3 14c.6-2.8 2.6-4.2 5-4.2s4.4 1.4 5 4.2"/></svg>',
  bldg:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6 5.5h1M9 5.5h1M6 8h1M9 8h1M7 13.5v-2.5h2v2.5"/></svg>'
};
const RC_HTML=`<div class="wrap">
  <section class="card">
    <div class="head"><span class="num">1</span><div><div class="eyebrow" id="k-eb">Klant</div><h2 id="k-h2">Klantgegevens</h2></div></div>
    <div class="form">
      <div class="fld full"><label class="lab" for="k-sel">Bestaande klant of nieuw</label><select class="in" id="k-sel"><option value="">Nieuwe klant</option></select></div>
      <div class="fld full" id="k-last" hidden></div>
      <div class="fld full">
        <span class="lab" id="l-type">Type klant</span>
        <div class="seg seg-fit" role="radiogroup" aria-labelledby="l-type">
          <input type="radio" name="ktype" id="kt-p" value="p" checked><label for="kt-p">${RC_SVG.pers}Particulier</label>
          <input type="radio" name="ktype" id="kt-z" value="z"><label for="kt-z">${RC_SVG.bldg}Zakelijk</label>
        </div>
      </div>
      <div class="fld full" id="f-bedrijf" hidden><label class="lab" for="k-bedrijf">Bedrijfsnaam <em>*</em></label><input class="in" id="k-bedrijf" autocomplete="organization"></div>
      <div class="fld full"><label class="lab" for="k-naam" id="l-naam">Naam <em>*</em></label><input class="in" id="k-naam" autocomplete="name"></div>
      <div class="fld"><label class="lab" for="k-email">E-mail</label><input class="in" id="k-email" type="email" inputmode="email" autocomplete="email"></div>
      <div class="fld"><label class="lab" for="k-tel">Telefoon</label><input class="in" id="k-tel" type="tel" inputmode="tel" autocomplete="tel"></div>
      <div class="fld full"><label class="lab" for="k-adres">Adres <em>*</em></label><input class="in" id="k-adres" autocomplete="address-line1" placeholder="Straat en huisnummer"></div>
      <div class="fld"><label class="lab" for="k-pc">Postcode</label><input class="in" id="k-pc" autocomplete="postal-code" placeholder="1234 AB" maxlength="7"></div>
      <div class="fld"><label class="lab" for="k-plaats">Plaats</label><input class="in" id="k-plaats" autocomplete="address-level2"></div>
      <div class="fld full keep phf">
        <span class="lab">Foto's van de woning</span>
        <div class="photos" id="photos">
          <label class="addph" for="ph-in">${RC_SVG.cam}<span>Foto toevoegen</span></label>
        </div>
        <input id="ph-in" type="file" accept="image/*" multiple hidden>
        <span class="phhint">Maak foto's van alle zijden. Kies per stip de verdieping of soort raam; de aantallen gaan vanzelf naar de telling. Markeer elk raam op maar één foto.</span>
        <div class="phsum" id="phsum" hidden></div>
        <button type="button" class="handm" id="handm">Geen foto bij de hand? Vul de aantallen zelf in</button>
      </div>
      <div class="fld full keep"><label class="lab" for="k-notitie">Notitie voor op de route</label><textarea class="in" id="k-notitie" rows="2" placeholder="Bijv. sleutel onder bloempot, hond aanwezig"></textarea></div>
    </div>
  </section>
  <section class="card" id="cFloors">
    <div class="head"><span class="num">2</span><div><div class="eyebrow">Glasbewassing</div><h2>Normale ramen</h2></div></div>
    <p class="intro">Hoeveel normale ramen zijn er per verdieping?</p>
    <p class="hint">Loop om de woning en swipe per raam: <i class="h-add">→ +1</i><i class="h-sub">← −1</i></p>
    <div class="rows" id="floors"></div>
    <div class="floor-actions"><button class="link" id="addFloor" type="button">+ Verdieping toevoegen</button><button class="link" id="removeFloor" type="button">Hoogste verdieping verwijderen</button></div>
    <div class="tip"><b>Tip</b><span>Tel elk los glasvlak als één raam. Een raam met een bovenlicht en een onderraam telt dus als twee.</span></div>
  </section>
  <section class="card" id="cSpecial">
    <div class="head"><span class="num">3</span><div><div class="eyebrow">Glasbewassing</div><h2>Bijzondere ramen</h2></div></div>
    <p class="intro">Zijn er ramen die extra aandacht vragen?</p>
    <p class="hint">Swipe per raam: <i class="h-add">→ +1</i><i class="h-sub">← −1</i></p>
    <div class="rows" id="special"></div>
  </section>
  <section class="card" id="ovCard" hidden>
    <div class="head"><span class="num">+</span><div><div class="eyebrow">Extra</div><h2>Overige diensten</h2></div></div>
    <p class="intro">Komen er andere werkzaamheden bij? Open een dienst en vul de aantallen in. Deze tellen los van de glasbewassing.</p>
    <div id="overig"></div>
  </section>
  <section class="card" id="cFreq">
    <div class="head"><span class="num">4</span><div><div class="eyebrow">Afspraken</div><h2>Frequentie glasbewassing en kozijnen</h2></div></div>
    <div class="options">
      <div class="field"><label for="freq">Frequentie</label><select id="freq"></select></div>
      <div class="field kozf"><span class="flabel" id="l-koz">Kozijnreiniging</span>
        <div class="seg" role="radiogroup" aria-labelledby="l-koz"><input type="radio" name="koz" id="koz-no" value="no" checked><label for="koz-no">Nee</label><input type="radio" name="koz" id="koz-yes" value="yes"><label for="koz-yes">Ja, elke keer</label></div></div>
    </div>
    <div class="desk-calc"><div class="cnt"><b id="barCount">0</b><small>ramen geteld</small></div><button class="calc" type="button" id="calcBtn">Berekenen ${RC_SVG.arrow}</button></div>
    <p class="stale" id="stale" hidden>Er is iets gewijzigd. Klik opnieuw op Berekenen.</p>
  </section>
  <section class="result" id="result" aria-live="polite">
    <div id="out"><div class="empty"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="20" height="22" rx="4"/><path d="M9 9h10M9 14h3M16 14h3M9 19h3M16 19h3"/></svg><span>Tel de ramen en klik op <b>Berekenen</b>. Daarna maak je met één tik een offerte of sla je de prijs op bij de klant.</span></div></div>
  </section>
  <section class="card" id="cRates">
    <details>
      <summary>Tijden en tarieven aanpassen</summary>
      <div class="tablewrap"><table class="rates"><thead><tr><th>Soort raam</th><th>Seconden</th><th>Prijs excl.</th></tr></thead><tbody id="rateRows"></tbody></table></div>
      <div class="extra">
        <div class="field"><label for="r-start">Starttarief (€)</label><input id="r-start" type="number" step="0.5" min="0"></div>
        <div class="field"><label for="r-min">Minimum glas excl. (€)</label><input id="r-min" type="number" step="0.01" min="0"></div>
        <div class="field"><label for="r-kozmin">Minimum kozijn excl. (€)</label><input id="r-kozmin" type="number" step="0.01" min="0"></div>
        <div class="field"><label for="r-kozp">Kozijn per raam (€)<span class="flag">*</span></label><input id="r-kozp" type="number" step="0.01" min="0"></div>
        <div class="field"><label for="r-kozs">Kozijn sec per raam<span class="flag">*</span></label><input id="r-kozs" type="number" step="1" min="0"></div>
      </div>
      <div class="field" style="margin-top:16px"><span class="flabel">Staffelkorting normale ramen</span></div>
      <div class="extra" id="tiers"></div>
      <p class="note" style="margin-top:6px">De staffel telt alle normale ramen samen. Elke schijf krijgt zijn eigen korting; de gemiddelde korting geldt voor elke verdieping. Voorbeeld: 64 ramen geeft 25% korting.</p>
      <p class="note">Waarden met <span class="flag">*</span> zijn een schatting. Alle prijzen zijn excl. btw. Wijzigingen worden opgeslagen in Mansard en gelden voor iedereen met wie je Mansard deelt.</p>
    </details>
  </section>
</div>`;
const RC_PV=`<div class="ed" id="pv" hidden role="dialog" aria-modal="true" aria-labelledby="pv-title">
  <div class="ed-top"><div><b id="pv-title">Overzicht (PDF)</b><br><span id="pv-sub">Zo ziet het overzicht eruit dat je kunt downloaden of meesturen.</span></div></div>
  <div class="pv-stage" id="pv-stage"></div>
  <div class="ed-bar"><button type="button" id="pv-dl">Download PDF</button><button type="button" class="done" id="pv-close">Sluiten</button></div>
</div>`;
const RC_ED=`<div class="ed" id="ed" hidden role="dialog" aria-modal="true" aria-labelledby="ed-title">
  <div class="ed-top"><div><b id="ed-title">Markeer de ramen</b><br><span id="ed-msg">Kies hieronder wat je aantikt en tik op elk raam. Tik op een stip om hem weg te halen.</span></div></div>
  <div class="ed-stage"><div class="ed-wrap" id="ed-wrap"><img id="ed-img" alt="Foto van de woning"></div></div>
  <div class="ed-tally" id="ed-tally" aria-live="polite"></div>
  <div class="ed-mode" id="ed-mode" role="group" aria-label="Gereedschap" hidden><button type="button" data-em="ramen" aria-pressed="true"><i class="em-r"></i>Ramen</button><button type="button" data-em="meten" aria-pressed="false"><i class="em-m"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg></i>Meetlint</button></div>
  <div class="ed-mlb" id="ed-mlb" hidden></div>
  <div class="ed-lab">Ik tik nu aan:</div>
  <div class="ed-types" id="ed-types" role="radiogroup" aria-label="Soort raam voor nieuwe stippen"></div>
  <div class="ed-bar"><button type="button" id="ed-undo">Ongedaan</button><button type="button" id="ed-clear">Alles wissen</button><button type="button" class="done" id="ed-done">Klaar</button></div>
</div>`;
let RC=null;
function vRamen(){
  return `<div class="pagehead"><div><p class="kicker">${I.calculator}Calculator</p><h1 class="xl">Ramenwas calculator</h1><p class="lead" style="margin:0">Tel de ramen per verdieping, zet stippen op foto's en maak er direct een offerte van</p></div></div><div id="rcMount"></div>`;
}
function mountRamen(){const m=$("#rcMount");if(!m)return;if(!RC)RC=buildRamen();if(dlg.open&&dlg.contains(RC.host))return;RC.setEmbed(null);RC.setLocked(false);m.appendChild(RC.host);RC.sync()}
/* calculator in de klantkaart: zelfde telling, maar vast aan deze klant */
function openRamenKlant(id){
  const k=state.klanten.find(x=>x.id===id);if(!k)return;if(!RC)RC=buildRamen();
  openDlg(`<div class="dlg-head"><span class="objic big">${I.calculator}</span><div style="flex:1;min-width:0"><h3>Ramen tellen</h3><div class="subt">${esc(cleanName(k.naam))} · ${esc(fullAddr(k))}</div></div><button type="button" class="iconbtn" id="rcBack" aria-label="Terug naar klantkaart">${I.x}</button></div>
  <div id="rcDlgMount"></div>
  <div class="row stickyfoot"><button type="button" id="rcBack2">${I.left}Terug naar klantkaart</button><span class="sp"></span></div>`,{wide:true});
  RC.reset();RC.setLocked(true,kid=>setTimeout(()=>openKlant(kid),80));
  $("#rcDlgMount").appendChild(RC.host);RC.sync();RC.openKlant(id);
  const back=()=>{RC.setLocked(false);RC.reset();openKlant(id)};$("#rcBack").onclick=back;$("#rcBack2").onclick=back;
}
dlg.addEventListener("close",()=>{if(RC&&dlg.contains(RC.host)){RC.setEmbed(null,true);RC.setLocked(false);RC.host.remove();if(state.tab==="calculator")schedule()}});
function buildRamen(){
  const host=document.createElement("div");host.id="rcHost";
  const root=host.attachShadow({mode:"open"});root.innerHTML=`<style>${RC_CSS}</style>${RC_HTML}`;
  const edHost=document.createElement("div");edHost.id="rcEdHost";
  const eroot=edHost.attachShadow({mode:"open"});eroot.innerHTML=`<style>${RC_CSS}</style>${RC_ED}${RC_PV}`;
  const edDlg=document.createElement("dialog");edDlg.className="rc-ed-dlg";edDlg.appendChild(edHost);document.body.appendChild(edDlg);edDlg.addEventListener("cancel",e=>{e.preventDefault();if(!ge("pv").hidden)ge("pv-close").click();else if(!ge("ed").hidden)closeEd()});
  const g=id=>root.getElementById(id),ge=id=>eroot.getElementById(id);

  /* prijzen excl. btw en tijden: BG € 1,75 / 51 s · 1e € 1,90 / 55 s */
  const TYPES=[
    {k:"g0",l:"Raam begane grond",s:51,p:1.75},{k:"g1",l:"Raam 1e verdieping",s:55,p:1.90},
    {k:"g2",l:"Raam 2e verdieping",s:55,p:2.05,pe:true},{k:"g3",l:"Raam 3e verdieping en hoger",s:55,p:2.20,se:true,pe:true},
    {k:"tuimel",l:"Dak- / tuimelraam",s:53,p:1.61},{k:"lood",l:"Glas-in-lood",s:75,p:1.90,se:true,pe:true},
    {k:"koepel",l:"Lichtkoepel",s:60,p:2.20,se:true,pe:true},{k:"mini",l:"Miniraampje",s:13,p:0.40,pe:true}];
  const SPECIAL=[{k:"lood",n:"Glas-in-lood",d:"Bovenlichten met lood"},{k:"mini",n:"Miniraampjes",d:"Tel elk ruitje"},{k:"koepel",n:"Lichtkoepels",d:"Op een plat dak"},{k:"tuimel",n:"Dak- / tuimelramen",d:"Schuin in het dak"}];
  const DEFAULTS={start:0,min:56.20,kozMin:40.63,koz_p:0.65,koz_s:30,tiers:[[10,10],[20,20],[30,30],[40,40]],tb:{},wg:{},fp:{}};
  /* frequentie: [sleutel, label, beurten per jaar, korting %, weken in Mansard] — negatief = toeslag */
  const FREQ_LIST=[["w1","1x per week",52,0,1],["w2","1x per 2 weken",26,0,2],["w4","1x per 4 weken",13,0,4],["mnd","1x per maand",12,0,4],
    ["w6","1x per 6 weken",52/6,0,6],["m8","1x per 8 weken",6.5,5,8],["mnd2","1x per 2 maanden",6,0,8],["w12","1x per 12 weken",52/12,0,12],
    ["mnd3","1x per 3 maanden",4,-150,12],["w16","1x per 16 weken",3.25,0,12],["mnd4","1x per 4 maanden",3,0,12],["w24","1x per 24 weken",52/24,0,26],
    ["mnd6","1x per 6 maanden",2,0,26],["w48","1x per 48 weken",52/48,0,52],["mnd12","1x per 12 maanden",1,0,52],["afroep","Op afroep",1,-25,0],["once","Eenmalig",1,-25,0]];
  const FREQ_BASE=FREQ_LIST.slice(),FREQ={};FREQ_LIST.forEach(([k,,y])=>{window.FREQ_Y=window.FREQ_Y||{};window.FREQ_Y[k]=y});
  /* extra frequenties die in Uitvoering › Frequenties voor de rekentool zijn aangezet (freqCalc[key]={l,w}) */
  const refreshFreq=()=>{const fc=(typeof S==="function"&&S().freqCalc)||{},fw=(typeof S==="function"&&S().freqWeb)||{};FREQ_LIST.length=0;FREQ_BASE.forEach(x=>FREQ_LIST.push(x));
    [...Object.entries(fc),...Object.entries(fw)].forEach(([k,v])=>{if(v&&typeof v==="object"&&Number(v.w)>0&&!FREQ_LIST.some(x=>x[0]===k))FREQ_LIST.push([k,String(v.l||"1x per "+v.w+" weken"),52/Number(v.w),0,Number(v.w)])});
    Object.keys(FREQ).forEach(k=>delete FREQ[k]);FREQ_LIST.forEach(([k,l,y,p,w])=>FREQ[k]={l,y,pct:p,w})};
  refreshFreq();
  /* rekentool: standaardfrequentie aan tenzij uitgezet; extra frequentie alleen als hij voor de rekentool is aangezet. Dienstenwebshop: eigen keuze, anders gelijk aan de rekentool */
  const calcOn=k=>{const fc=(typeof S==="function"&&S().freqCalc)||{};return FREQ_BASE.some(x=>x[0]===k)?fc[k]!==false:!!(fc[k]&&typeof fc[k]==="object")};
  const webOn=k=>{const fw=(typeof S==="function"&&S().freqWeb)||{},v=fw[k];return v===undefined?calcOn(k):!!v};
  const VAT=.21;
  const baseCfg=()=>{const c={};TYPES.forEach(t=>{c[t.k+"_s"]=t.s;c[t.k+"_p"]=t.p});Object.assign(c,JSON.parse(JSON.stringify(DEFAULTS)));return c};
  let cfg=baseCfg(),cfgSrc=null,cfgT=null;
  const loadCfg=()=>{const s=state.ramen;if(s===cfgSrc||cfgT)return false;cfgSrc=s;cfg=baseCfg();if(s&&typeof s==="object")Object.keys(s).forEach(k=>{if(k in cfg)cfg[k]=s[k]});if(!Array.isArray(cfg.tiers))cfg.tiers=JSON.parse(JSON.stringify(DEFAULTS.tiers));return true};
  const saveCfg=()=>{clearTimeout(cfgT);cfgT=setTimeout(async()=>{try{await save("instellingen","ramen",JSON.parse(JSON.stringify(cfg)))}catch(e){err(e)}cfgT=null;cfgSrc=state.ramen},900)};
  loadCfg();

  /* staffelkorting per dienst (Uitvoering › Diensten): eigen staffel per soort raam, aantallen tellen mee met hun wegingsfactor */
  const tierU=(t,n)=>{t=(t||[]).filter(x=>x[0]>0).slice().sort((a,b)=>a[0]-b[0]);let off=0;for(let i=1;i<=n;i++){let d=0;for(const [f,p] of t)if(i>=f)d=p;off+=d/100}return off};
  const tierOf=k=>cfg.tb&&Array.isArray(cfg.tb[k])?cfg.tb[k]:(/^g\d$/.test(k)?cfg.tiers:[]);
  const wgOf=k=>cfg.wg&&cfg.wg[k]!=null&&cfg.wg[k]!==""?Number(cfg.wg[k]):100;
  function staffel(list){const W=Math.round(list.reduce((a,x)=>a+x.n*wgOf(x.k)/100,0)),o={};list.forEach(x=>{o[x.k]=W?tierU(tierOf(x.k),W)/W:0});return o}
  const fpct=(fk,def)=>cfg.fp&&cfg.fp[fk]!=null&&cfg.fp[fk]!==""?Number(cfg.fp[fk]):def;
  function tierUnits(n){const t=cfg.tiers.filter(x=>x[0]>0).slice().sort((a,b)=>a[0]-b[0]);let off=0;for(let i=1;i<=n;i++){let d=0;for(const [from,p] of t){if(i>=from)d=p}off+=d/100}return off}
  const pct=x=>(Math.round(x*10000)/100).toLocaleString("nl-NL")+"%";
  let floors=[0,0,0,0],special={lood:0,mini:0,koepel:0,tuimel:0};
  const floorName=i=>i===0?"Begane grond":i+"e verdieping";
  const winKey=i=>i===0?"g0":i===1?"g1":i===2?"g2":"g3";
  function dur(sec){const m=Math.ceil(Math.round(sec)/60);if(!m)return "0 min";const h=Math.floor(m/60);return h?`${h} u ${String(m%60).padStart(2,"0")}`:`${m} min`}

  /* iconen */
  const LN='stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
  const SH='stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".9"';
  const pane=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="var(--glass)" ${LN}/><path d="M${(x+w*.25).toFixed(1)} ${(y+h*.7).toFixed(1)}L${(x+w*.7).toFixed(1)} ${(y+h*.25).toFixed(1)}" ${SH}/>`;
  const SV=b=>`<svg viewBox="0 0 48 48" aria-hidden="true">${b}</svg>`;
/* ---- iconen rekentool/dienstenwebshop: één stijl met het CRM (teal, rustig, met diepte) ---- */
const IK={roof:"#163e4a",roof2:"#1d5a74",ridge:"#0f2f38",wall:"#f6f1e8",wall2:"#e8e0d3",line:"#0f1f26",frame:"#ffffff",glass:"#cfe9ee",glass2:"#8fcfdb",on:"#2aa3b3",onG:"#dff6f9",door:"#137a8a",ground:"#c9d3d6",sky:"#eef6f8"};
const IV=b=>`<svg viewBox="0 0 64 60" aria-hidden="true"><defs><linearGradient id="kGl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf7fa"/><stop offset="1" stop-color="${IK.glass2}"/></linearGradient><linearGradient id="kGlOn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#7fd4e6"/></linearGradient><linearGradient id="kRoof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${IK.roof2}"/><stop offset="1" stop-color="${IK.roof}"/></linearGradient><linearGradient id="kWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${IK.wall}"/><stop offset="1" stop-color="${IK.wall2}"/></linearGradient></defs>${b}</svg>`;
const kRaam=(x,y,w,h,on)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.4" fill="${IK.frame}" stroke="${on?IK.on:"#b9c6ca"}" stroke-width="${on?1.6:1}"/><rect x="${x+1.6}" y="${y+1.6}" width="${w-3.2}" height="${h-3.2}" rx=".8" fill="url(#${on?"kGlOn":"kGl"})"/><path d="M${x+2.2} ${y+h-3}L${x+w-4} ${y+3}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/><rect x="${x+w/2-.5}" y="${y+1.6}" width="1" height="${h-3.2}" fill="${IK.frame}"/>${on?`<rect x="${x-2}" y="${y-2}" width="${w+4}" height="${h+4}" rx="2.4" fill="none" stroke="${IK.on}" stroke-width="1.2" opacity=".35"/>`:""}`;
function houseIcon(i,n){n=Math.max(2,Math.min(n,4));const lvl=Math.min(i,n-1),rows=n,top=19,bot=55,fh=(bot-top)/rows;
  let b=`<rect width="64" height="60" rx="8" fill="${IK.sky}"/>`;
  b+=`<path d="M4 ${top+1}L32 4l28 ${top-3}v2H4Z" fill="url(#kRoof)"/><path d="M4 ${top+1}L32 4l28 ${top-3}" fill="none" stroke="${IK.ridge}" stroke-width="1.6" stroke-linejoin="round"/>`;
  b+=`<rect x="40" y="7" width="5" height="8" fill="${IK.roof}"/><rect x="39.3" y="6.4" width="6.4" height="1.6" fill="${IK.ridge}"/>`;
  b+=`<rect x="7" y="${top}" width="50" height="${bot-top}" fill="url(#kWall)"/>`;
  for(let r=0;r<rows;r++){const fl=rows-1-r,y=top+r*fh,on=fl===lvl,wh=Math.min(10.5,fh*.6),wy=y+(fh-wh)/2;
    if(on)b+=`<rect x="7" y="${y}" width="50" height="${fh}" fill="${IK.onG}" opacity=".9"/>`;
    if(fl===0){b+=kRaam(11,wy,13,wh,on)+kRaam(40,wy,13,wh,on)+`<rect x="27.5" y="${y+fh*.2}" width="9" height="${bot-(y+fh*.2)}" rx="1.2" fill="${IK.door}"/><circle cx="34.6" cy="${y+fh*.62}" r=".9" fill="#fff"/>`}
    else b+=kRaam(10.5,wy,12,wh,on)+kRaam(26,wy,12,wh,on)+kRaam(41.5,wy,12,wh,on);
    if(r>0)b+=`<path d="M7 ${y}h50" stroke="#0f1f26" stroke-width=".6" opacity=".12"/>`}
  b+=`<rect x="7" y="${top}" width="50" height="${bot-top}" fill="none" stroke="#0f1f26" stroke-width="1.1" opacity=".55" rx=".5"/><rect x="2" y="${bot}" width="60" height="3" rx="1.5" fill="${IK.ground}"/>`;
  return IV(b)}
const ICON={
  tuimel:IV(`<rect width="64" height="60" rx="8" fill="${IK.sky}"/><path d="M0 60V26L64 4v56Z" fill="url(#kRoof)"/>${[0,1,2,3,4,5].map(i=>`<path d="M0 ${31+i*5.2}L64 ${9+i*5.2}" stroke="#fff" stroke-width=".7" opacity=".10"/>`).join("")}<path d="M0 26L64 4" stroke="${IK.ridge}" stroke-width="1.8"/><g transform="translate(32 32) rotate(-19)"><rect x="-15" y="-11" width="30" height="23" rx="2" fill="#000" opacity=".22"/><rect x="-15" y="-12" width="30" height="23" rx="2" fill="${IK.frame}" stroke="${IK.on}" stroke-width="1.4"/><rect x="-12.5" y="-9.5" width="25" height="18" rx="1" fill="url(#kGlOn)"/><path d="M-10 6L8 -7" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".9"/><rect x="-6" y="9.5" width="12" height="2" rx="1" fill="#9fb0b6"/></g>`),
  lood:IV(`<rect width="64" height="60" rx="8" fill="url(#kWall)"/><path d="M15 58V27a17 17 0 0 1 34 0v31Z" fill="#dfe6e9"/><path d="M18 56V27a14 14 0 0 1 28 0v29Z" fill="${IK.frame}" stroke="#b9c6ca" stroke-width="1"/><clipPath id="kArc"><path d="M20.5 54V27a11.5 11.5 0 0 1 23 0v27Z"/></clipPath><g clip-path="url(#kArc)"><rect x="20" y="14" width="24" height="42" fill="url(#kGl)"/><path d="M32 27L20.5 27A11.5 11.5 0 0 1 24 18.6Z" fill="#e3b23c" opacity=".85"/><path d="M32 27L24 18.6A11.5 11.5 0 0 1 32 15.5Z" fill="#2aa3b3" opacity=".85"/><path d="M32 27L32 15.5A11.5 11.5 0 0 1 40 18.6Z" fill="#c0392b" opacity=".75"/><path d="M32 27L40 18.6A11.5 11.5 0 0 1 43.5 27Z" fill="#23845a" opacity=".8"/><g stroke="#3c4a50" stroke-width=".8" opacity=".75"><path d="M12 29l28 28M20 29l28 28M28 29l28 28M4 29l28 28M52 29L24 57M44 29L16 57M36 29L8 57M60 29L32 57M20.5 27h23"/></g><path d="M20.5 52L36 16h5L26 52Z" fill="#fff" opacity=".22"/></g>`),
  koepel:IV(`<rect width="64" height="60" rx="8" fill="${IK.sky}"/><path d="M0 41L7 34h50l7 7Z" fill="#aab6bb"/><rect y="41" width="64" height="4" fill="#8e9ba1"/><rect y="45" width="64" height="15" fill="url(#kWall)"/><rect x="17" y="31" width="30" height="4" rx="1.2" fill="${IK.frame}" stroke="#b9c6ca" stroke-width="1"/><path d="M19.5 31c1-15 24-15 25 0Z" fill="url(#kGlOn)" stroke="${IK.on}" stroke-width="1.4"/><path d="M24 27c1.2-5 5-8 9.5-8.5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".9"/>`),
  mini:IV(`<rect width="64" height="60" rx="8" fill="url(#kWall)"/><rect x="17" y="8" width="30" height="42" rx="2" fill="${IK.frame}" stroke="${IK.on}" stroke-width="1.4"/><rect x="20" y="11" width="24" height="36" rx="1" fill="url(#kGl)"/><g stroke="${IK.frame}" stroke-width="1.6"><path d="M28 11v36M36 11v36M20 20h24M20 29h24M20 38h24"/></g><path d="M22 18l4-5M30 27l4-5M38 36l4-5M22 45l4-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".9"/><rect x="14" y="50" width="36" height="3" rx="1.5" fill="#b9c6ca"/>`)
};
  const stepper=(id,v,label)=>`<div class="stepper"><button type="button" data-t="${id}" data-d="-1" aria-label="Eén minder: ${label}">−</button><input id="${id}" type="number" inputmode="numeric" min="0" max="500" value="${v}" aria-label="${label}"><button type="button" data-t="${id}" data-d="1" aria-label="Eén meer: ${label}">+</button></div>`;
  const swipeWrap=(id,inner)=>`<div class="swipe" data-id="${id}"><div class="under" aria-hidden="true"><span class="u-add">+1 raam</span><span class="u-sub">−1 raam</span></div>${inner}</div>`;
  function renderFloors(){let html="";
    /* begane grond bovenaan, zoals bij de opdracht en op de offerte */
    for(let i=0;i<floors.length;i++){const n=floorName(i),k=winKey(i);
      html+=swipeWrap("f"+i,`<div class="row${floors[i]?" on":""}"><div class="pic">${houseIcon(i,floors.length)}</div><div><div class="name">${n}</div><div class="sub">${cfg[k+"_s"]} sec · ${eur(cfg[k+"_p"])} per raam</div></div>${stepper("f"+i,floors[i],"Ramen "+n)}</div>`)}
    g("floors").innerHTML=html;g("removeFloor").disabled=floors.length<=1;g("addFloor").disabled=floors.length>=8;updateCount()}
  function renderSpecial(){g("special").innerHTML=SPECIAL.map(s=>swipeWrap("s-"+s.k,`<div class="row${special[s.k]?" on":""}"><div class="pic">${ICON[s.k]}</div><div><div class="name">${s.n}</div><div class="sub">${s.d} · ${cfg[s.k+"_s"]} sec</div></div>${stepper("s-"+s.k,special[s.k],s.n)}</div>`)).join("");updateCount()}
  const totalCount=()=>floors.reduce((a,b)=>a+b,0)+Object.values(special).reduce((a,b)=>a+b,0);
  function updateCount(){g("barCount").textContent=totalCount()}
  let hasResult=false;
  let acT=0;
  function setHandm(on){if(on)host.setAttribute("data-handmatig","");else host.removeAttribute("data-handmatig");const b=g("handm");if(b)b.textContent=on?"Handmatige telling verbergen":"Geen foto bij de hand? Vul de aantallen zelf in";if(on){renderFloors();renderSpecial()}}
  function markStale(){if(hasResult)g("stale").hidden=false;if(host.hasAttribute("data-offerte")){clearTimeout(acT);acT=setTimeout(()=>{if(host.isConnected&&host.hasAttribute("data-offerte")){try{calculate(false)}catch(e){}}},150)}}
  /* overige diensten uit Uitvoering › Diensten (alleen groepen die in de calculator aan staan) */
  let ovr={},ovrFreq={};
  const glasW=()=>{const f=FREQ[g("freq").value];return f&&f.w?f.w:8};
  const ovrList=()=>{try{return uDienstLijst().filter(d=>d.items&&d.items.length&&d.groep!=="bijz")}catch(e){return []}};let ovMore=false;
  const OV_IC='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 26l9-9M14 8l10 10-4 4L10 12z"/><path d="M19 5l8 8"/></svg>';
  let ovSig="",ovOpen=new Set();
  function renderOverig(force){const L=ovrList(),card=g("ovCard");if(!card)return;const sig=JSON.stringify(L)+JSON.stringify(ovr)+JSON.stringify(ovrFreq)+g("freq").value;if(!force&&sig===ovSig)return;ovSig=sig;card.hidden=!L.length;
    const zichtbaar=d=>d.inCalc!==false||ovMore||d.items.some(it=>Number(ovr[it.id])>0),verborgen=L.filter(d=>!zichtbaar(d)).length;
    g("overig").innerHTML=L.filter(zichtbaar).map(d=>{const n=d.items.filter(it=>Number(ovr[it.id])>0).length,c0=itemsCalc(d.items.map(it=>({...it,aantal:Number(ovr[it.id])||0}))),c={...c0,ex:r2(c0.ex*(typeof dienstFreqFactor==="function"?dienstFreqFactor(d.groep,Number(ovrFreq[d.groep])||glasW()):1))};
      return `<details class="ovg"${n||ovOpen.has(d.groep)?" open":""} data-g="${esc(d.groep)}"><summary>${esc(d.naam)}<em>${n?eur(c.ex)+" excl. · "+esc(freqLabel(ovrFreq[d.groep]||glasW()).toLowerCase()):""}</em></summary><div class="ovf"><label for="ovf-${esc(d.groep)}">Frequentie</label><select id="ovf-${esc(d.groep)}" data-ovf="${esc(d.groep)}">${(()=>{const cur=ovrFreq[d.groep]||(d.freqAdvies&&(!d.freqs||d.freqs.includes(d.freqAdvies))?d.freqAdvies:0)||glasW();return freqOpts(cur).filter(w=>!d.freqs||d.freqs.includes(w)||w===cur).map(w=>`<option value="${w}" ${w===cur?"selected":""}>${esc(freqLabel(w))}</option>`).join("")})()}</select></div><div class="rows">${d.items.map(it=>`<div class="row${Number(ovr[it.id])?" on":""}"><div class="pic">${OV_IC}</div><div><div class="name">${esc(it.naam)}</div><div class="sub">${eur(it.prijs)} ${esc(it.eenheid)} · ${it.sec} sec</div></div>${stepper("o-"+it.id,Number(ovr[it.id])||0,it.naam)}</div>`).join("")}</div></details>`}).join("")+(verborgen?`<button type="button" class="ovmeer" id="ovMeer">+ Meer diensten (${verborgen})</button>`:"");const mb=g("ovMeer");if(mb)mb.onclick=()=>{ovMore=true;renderOverig(true)}}
  function ovrRows(o){if(!o&&host.hasAttribute("data-offerte"))return [];const src=o||ovr,rows=[];ovrList().forEach(d=>{const items=d.items.map(it=>({...it,aantal:Number(src[it.id])||0})).filter(it=>it.aantal>0);if(!items.length)return;const c=itemsCalc(items);
      const fw=Number(ovrFreq[d.groep])||glasW(),fk=typeof dienstFreqFactor==="function"?dienstFreqFactor(d.groep,fw):1;rows.push({n:d.naam,groep:d.groep,frequentie:fw,d:items.map(it=>it.naam.toLowerCase()+" "+String(it.aantal).replace(".",",")+" "+eenhKort(it.eenheid)).join(", "),c:items.reduce((a,it)=>a+it.aantal,0),sec:c.sec,price:r2(c.ex*fk),items})});return rows}
  function setVal(id,v,dec){v=Math.max(0,Math.min(500,dec?Math.round((Number(v)||0)*10)/10:Math.round(Number(v)||0)));
    if(id.startsWith("o-")){ovr[id.slice(2)]=v;const el=g(id);if(el){el.value=v;el.closest(".row").classList.toggle("on",v>0)}const dd=el&&el.closest(".ovg");if(dd){const L=ovrList().find(x=>x.groep===dd.dataset.g);if(L){const c=itemsCalc(L.items.map(it=>({...it,aantal:Number(ovr[it.id])||0})));dd.querySelector("summary em").textContent=c.ex?eur(c.ex)+" excl.":""}}markStale();return}
    if(id.startsWith("s-"))special[id.slice(2)]=v;else floors[+id.slice(1)]=v;
    const el=g(id);if(el){el.value=v;el.closest(".row").classList.toggle("on",v>0)}updateCount();markStale()}

  /* ---------- foto's met stippen ---------- */
  let photos=[],edIdx=-1,edMode="ramen",edMl=null,mSynced={};
  function loadPhoto(file){
    return new Promise((res,rej)=>{const u=URL.createObjectURL(file);const im=new Image();
      im.onload=()=>{const max=1600,k=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
        const cv=document.createElement("canvas");cv.width=Math.round(im.naturalWidth*k);cv.height=Math.round(im.naturalHeight*k);
        cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(u);
        cv.toBlob(b=>res({cv,blob:b,url:URL.createObjectURL(b),dots:[],assetId:""}),"image/jpeg",0.86)};
      im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error("foto"))};im.src=u});
  }
  function renderPhotos(){const box=g("photos");box.querySelectorAll(".ph").forEach(n=>n.remove());const add=box.querySelector(".addph");
    photos.forEach((p,i)=>{const b=document.createElement("div");b.className="ph";b.setAttribute("role","button");b.tabIndex=0;b.dataset.i=i;
      b.setAttribute("aria-label",`Foto ${i+1}, ${p.dots.length} ramen gemarkeerd. Tik om stippen te zetten.`);
      b.innerHTML=`<img src="${p.url}" alt="">${p.dots.length?`<span class="cnt">${p.dots.length}</span>`:""}<button type="button" class="rm" data-rm="${i}" aria-label="Foto ${i+1} verwijderen">×</button>`;
      box.insertBefore(b,add)})}
  const DT_S={"s-lood":{c:"L",sh:"Lood",n:"Glas-in-lood",col:"#12a594"},"s-mini":{c:"M",sh:"Mini",n:"Miniraampjes",col:"#d6409f"},"s-koepel":{c:"K",sh:"Koepel",n:"Lichtkoepels",col:"#3e63dd"},"s-tuimel":{c:"T",sh:"Tuimel",n:"Tuimel- / dakramen",col:"#0090ff"}};
  const FCOL=["#e5484d","#f76b15","#8e4ec6","#6e56cf","#5b5bd6","#7c66dc","#9a5cd0","#ab4aba"];
  function dt(t){if(DT_S[t])return DT_S[t];const i=+String(t||"f0").slice(1)||0;return {c:i?String(i):"BG",sh:i?i+"e":"BG",n:floorName(i),col:FCOL[Math.min(i,FCOL.length-1)]}}
  let curType="f0",synced={};
  const typeList=()=>[...floors.map((_,i)=>"f"+i),...Object.keys(DT_S).slice().reverse()];
  const chipName=t=>({"s-tuimel":"Tuimelraam","s-lood":"Glas-in-lood","s-koepel":"Lichtkoepel","s-mini":"Miniraampje"})[t]||(t==="f0"?"Begane grond":t.slice(1)+"e verdieping");
  function fitEd(){const p=photos[edIdx];if(!p)return;const st=eroot.querySelector(".ed-stage").getBoundingClientRect();
    const k=Math.min(st.width/p.cv.width,st.height/p.cv.height);const w=ge("ed-wrap");w.style.width=Math.floor(p.cv.width*k)+"px";w.style.height=Math.floor(p.cv.height*k)+"px"}
  window.addEventListener("resize",()=>{if(edIdx>=0)fitEd()});
  let lastTap="";
  function renderTally(){const box=ge("ed-tally");if(!box)return;const all={},cur={};photos.forEach((p,i)=>p.dots.forEach(d=>{all[d.t]=(all[d.t]||0)+1;if(i===edIdx)cur[d.t]=(cur[d.t]||0)+1}));
    const ts=typeList().filter(t=>all[t]),tot=ts.reduce((a,t)=>a+all[t],0);let warn="";const p=photos[edIdx];
    if(p)for(let a=0;a<p.dots.length&&!warn;a++)for(let b=a+1;b<p.dots.length;b++){const A=p.dots[a],B=p.dots[b];if(A.t==="s-mini"&&B.t==="s-mini")continue;if(Math.hypot(A.x-B.x,(A.y-B.y)*(p.cv.height/p.cv.width))<0.02){warn="Twee stippen liggen bijna op dezelfde plek. Is een raam dubbel aangetikt? Tik op een stip om hem weg te halen.";break}}
    if(!warn&&photos.length>1&&edIdx>=0){const dup=Object.keys(cur).filter(t=>photos.some((q,i)=>i!==edIdx&&q.dots.some(d=>d.t===t)));if(dup.length){const t=lastTap&&dup.includes(lastTap)?lastTap:dup[0],on=photos.map((q,i)=>i!==edIdx&&q.dots.some(d=>d.t===t)?i+1:0).filter(Boolean);warn="i:"+chipName(t)+" is ook aangetikt op foto "+on.join(" en ")+". Let op dat u hetzelfde raam niet op twee foto's aantikt."}}
    box.innerHTML=`<div class="et-h"><span>Totaal geteld${photos.length>1?" · "+photos.length+" foto's":""}</span><b>${tot} ${tot===1?"raam":"ramen"}</b></div>${ts.length?`<div class="et-l">${ts.map(t=>{const m=dt(t);return `<span class="${t===lastTap?"hit":""}" style="--c:${m.col}"><i style="background:${m.col}">${m.c}</i>${chipName(t)}<b>${all[t]}</b>${photos.length>1&&cur[t]&&cur[t]!==all[t]?`<em>${cur[t]} op deze foto</em>`:""}</span>`}).join("")}</div>`:`<div class="et-e">Nog niets aangetikt. Kies hieronder wat u aantikt en tik op de ramen.</div>`}${warn?(warn.startsWith("i:")?`<div class="et-n">${warn.slice(2)}</div>`:`<div class="et-w">⚠ ${warn}</div>`):""}`;lastTap=""}
  function renderTypes(){const p=photos[edIdx];if(!typeList().includes(curType))curType="f0";
    ge("ed-types").innerHTML=typeList().map(t=>{const m=dt(t),n=p?p.dots.filter(d=>d.t===t).length:0;
      return `<button type="button" role="radio" aria-checked="${t===curType}" data-t="${t}"><i style="background:${m.col}">${m.c}</i>${chipName(t)}${n?`<b>${n}</b>`:""}</button>`}).join("");renderTally()}
  function renderDots(){const w=ge("ed-wrap");w.querySelectorAll(".dot").forEach(n=>n.remove());const p=photos[edIdx];if(!p)return;
    p.dots.forEach((d,j)=>{const m=dt(d.t);const b=document.createElement("button");b.type="button";b.className="dot";b.dataset.j=j;b.textContent=m.c;
      b.style.background=m.col;if(m.c.length>1)b.style.fontSize="4.2px";b.style.left=(d.x*100)+"%";b.style.top=(d.y*100)+"%";b.setAttribute("aria-label",`${m.n}: stip verwijderen`);w.appendChild(b)});
    renderTypes()}
  function dotSummary(dots){const cnt={};dots.forEach(d=>cnt[d.t]=(cnt[d.t]||0)+1);return typeList().filter(t=>cnt[t]).map(t=>[t,cnt[t]])}
  function renderPhsum(){const all=photos.flatMap(p=>p.dots),box=g("phsum"),sum=dotSummary(all);box.hidden=!sum.length;
    box.innerHTML=sum.length?"Overgenomen in de telling: "+sum.map(([t,n])=>{const m=dt(t);return `<span><i style="background:${m.col}">${m.c}</i>${m.sh} ${n}</span>`}).join(""):""}
  function syncFromPhotos(){const all=photos.flatMap(p=>p.dots);const cnt={};all.forEach(d=>cnt[d.t]=(cnt[d.t]||0)+1);
    let grew=false;Object.keys(cnt).forEach(t=>{if(t[0]==="f"){const i=+t.slice(1);while(floors.length<=i){floors.push(0);grew=true}}});
    if(grew)renderFloors();
    /* tel alle foto's samen op; handmatig getelde ramen (en ramen van foto's die niet geladen konden worden) blijven staan */
    const getV=t=>t.startsWith("s-")?(special[t.slice(2)]||0):(floors[+t.slice(1)]||0);
    new Set([...Object.keys(cnt),...Object.keys(synced)]).forEach(t=>{if(g(t)){const base=Math.max(0,getV(t)-(synced[t]||0));setVal(t,base+(cnt[t]||0))}});
    synced={...cnt};renderPhsum()}
  const edMeet=()=>typeof Meetlint!=="undefined"&&typeof meetAan==="function"&&meetAan("rekentool")?meetSoorten():[];
  function edZetMode(m){edMode=m;const met=m==="meten";ge("ed-mode").querySelectorAll("[data-em]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.em===m));
    ge("ed-types").hidden=met;eroot.querySelector(".ed-lab").hidden=met;ge("ed-mlb").hidden=!met;ge("ed-tally").hidden=met;
    ge("ed-msg").textContent=met?"Sleep eerst een referentie over iets waarvan u de maat kent, daarna meet u goten, windveren of beplating.":"Kies hieronder wat je aantikt en tik op elk raam. Tik op een stip om hem weg te halen.";
    if(edMl){edMl.aan(met);if(met){const b=ge("ed-mlb");b.innerHTML=edMl.barHtml();edMl.bindBar(b)}}requestAnimationFrame(()=>{fitEd();if(edMl)edMl.teken()})}
  function openEd(i){ge("ed-undo").onclick=undo1;ge("ed-msg").textContent="Kies hieronder wat je aantikt en tik op elk raam. Tik op een stip om hem weg te halen.";if(!edDlg.open)edDlg.showModal();edIdx=i;ge("ed-img").src=photos[i].url;ge("ed").hidden=false;document.body.style.overflow="hidden";renderDots();requestAnimationFrame(()=>{fitEd();
      if(edMl){edMl.weg();edMl=null}const MS=edMeet();ge("ed-mode").hidden=!MS.length;ge("ed-mode").classList.toggle("licht",getComputedStyle(ge("ed")).backgroundColor.replace(/[^\d,]/g,"").split(",").slice(0,3).reduce((a,b)=>a+ +b,0)>600);
      if(MS.length||(photos[edIdx]&&photos[edIdx].meet))edMl=Meetlint.attach({licht:getComputedStyle(ge("ed")).backgroundColor.replace(/[^\d,]/g,"").split(",").slice(0,3).reduce((a,b)=>a+ +b,0)>600,wrap:ge("ed-wrap"),foto:()=>{const p=photos[edIdx];if(p&&!p.w){p.w=p.cv.width;p.h=p.cv.height}return p},soorten:MS.length?MS:meetSoorten(),host:eroot.querySelector(".ed-stage"),
        bar:()=>{const b=ge("ed-mlb");if(b&&edMl&&!b.hidden){b.innerHTML=edMl.barHtml(Meetlint.totalen(photos.map(p=>({...p,w:p.cv.width,h:p.cv.height})),MS));edMl.bindBar(b)}}});
      edZetMode(MS.length?edMode:"ramen")})}
  /* gemeten meters en m² in de prijs: bij de diensten met dezelfde naam (Uitvoering › Diensten); zelf ingevulde aantallen blijven staan */
  function syncMeet(){if(typeof Meetlint==="undefined")return;const t=Meetlint.totalen(photos.map(p=>({...p,w:p.cv.width,h:p.cv.height})),edMeet());let veranderd=false;
    new Set([...Object.keys(t),...Object.keys(mSynced)]).forEach(id=>{const nu=Number(ovr[id])||0,base=Math.max(0,nu-(mSynced[id]||0)),nw=Math.round((base+(t[id]||0))*10)/10;if(nw!==nu){setVal("o-"+id,nw,true);veranderd=true}});
    mSynced={...t};return veranderd}
  function closeEd(){if(edMl){edMl.sluit();edMl.aan(false)}syncMeet();ge("ed").hidden=true;if(ge("pv").hidden&&edDlg.open)edDlg.close();document.body.style.overflow="";edIdx=-1;renderPhotos();syncFromPhotos();markStale()}

  /* ---------- klant ---------- */
  const val=id=>g(id).value.trim();
  const isZ=()=>g("kt-z").checked;
  let embed=null;
  function klantForm(){if(embed&&embed.form){const f=embed.form();return {bedrijf:f.zakelijk?f.naam:"",naam:f.zakelijk?"":f.naam,email:f.email,tel:f.tel,adres:f.adres,pc:f.pc,plaats:f.plaats,notitie:f.notitie}}
    return {bedrijf:isZ()?val("k-bedrijf"):"",naam:val("k-naam"),email:val("k-email"),tel:val("k-tel"),adres:val("k-adres"),pc:val("k-pc").toUpperCase(),plaats:val("k-plaats"),notitie:val("k-notitie")}}
  const fullAdres=k=>[k.adres,[k.pc,k.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  let klSig="";
  function fillKlantSelect(){const ks=[...state.klanten].sort((a,b)=>cleanName(a.naam).localeCompare(cleanName(b.naam)));
    const sig=ks.map(k=>k.id+"|"+k.naam+"|"+(k.adres||"")+"|"+(k.ramenTelling?k.ramenTelling.datum:"")).join(";");if(sig===klSig)return;klSig=sig;
    const sel=g("k-sel"),v=sel.value;
    sel.innerHTML=`<option value="">Nieuwe klant</option>`+ks.map(k=>`<option value="${esc(k.id)}">${esc(cleanName(k.naam))}${k.adres?" — "+esc(k.adres):""}</option>`).join("");
    if(v&&!ks.some(k=>k.id===v)){const o=document.createElement("option");o.value=v;o.textContent=(isZ()?val("k-bedrijf"):val("k-naam"))||"Nieuwe klant";sel.appendChild(o)}
    sel.value=v;showLast()}
  function showLast(){const k=state.klanten.find(x=>x.id===g("k-sel").value),box=g("k-last"),t=k&&k.ramenTelling;
    box.hidden=!t;if(!t)return;
    box.innerHTML=`<div class="last"><span><b>Eerdere telling</b> · ${t.ramen} ramen${t.fotos&&t.fotos.length?" · "+t.fotos.length+" foto's":""} · ${esc(fmtL(t.datum))}</span><button type="button" class="btn2" id="loadTel">Telling laden</button></div>`}
  function setKlant(id){const k=state.klanten.find(x=>x.id===id);g("k-sel").value=k?id:"";
    const z=isZak(k);g("kt-z").checked=!!z;g("kt-p").checked=!z;g("f-bedrijf").hidden=!z;
    g("k-bedrijf").value=z?cleanName(k.naam):"";g("k-naam").value=k?(z?(k.contact||""):cleanName(k.naam)):"";
    g("k-email").value=k?k.email||"":"";g("k-tel").value=k?k.telefoon||"":"";g("k-adres").value=k?k.adres||"":"";
    g("k-pc").value=k?k.postcode||"":"";g("k-plaats").value=k?k.plaats||"":"";g("k-notitie").value=k?k.notities||"":"";
    labelNaam();showLast();markStale()}
  function selectKid(kid,name){const sel=g("k-sel");if(![...sel.options].some(o=>o.value===kid)){const o=document.createElement("option");o.value=kid;o.textContent=name;sel.appendChild(o)}sel.value=kid;showLast()}
  const labelNaam=()=>{g("l-naam").innerHTML=isZ()?"Contactpersoon":"Naam <em>*</em>"};
  async function loadTelling(k,quiet){const t=k&&k.ramenTelling;if(!t)return;
    floors=Array.isArray(t.floors)&&t.floors.length?t.floors.map(n=>Number(n)||0):[0,0,0,0];
    special={lood:0,mini:0,koepel:0,tuimel:0,...(t.special||{})};ovr={...(t.overig||{})};ovrFreq={...(t.overigFreq||{})};renderOverig(true);
    if(FREQ[t.freq])g("freq").value=t.freq;g("koz-yes").checked=!!t.koz;g("koz-no").checked=!t.koz;
    photos.forEach(p=>URL.revokeObjectURL(p.url));photos=[];
    for(const f of t.fotos||[]){try{const r=await fetch(BLOB+f.id);if(!r.ok)continue;const p=await loadPhoto(await r.blob());p.dots=(f.dots||[]).map(d=>({...d}));if(f.meet)p.meet=JSON.parse(JSON.stringify(f.meet));p.assetId=f.id;photos.push(p)}catch(e){}}
    mSynced=typeof Meetlint!=="undefined"?Meetlint.totalen(photos.map(p=>({...p,w:p.cv.width,h:p.cv.height})),[]):{};
    synced={};photos.forEach(p=>p.dots.forEach(d=>synced[d.t]=(synced[d.t]||0)+1));
    renderFloors();renderSpecial();renderPhotos();renderPhsum();
    const miss=(t.fotos||[]).length-photos.length;
    if(!quiet||miss>0)toast("Telling van "+fmtL(t.datum)+" geladen"+(miss>0?" · "+plural(miss,"foto kon","foto's konden")+" niet worden geladen":""));
    calculate(false)}

  /* ---------- leegmaken na opslaan ---------- */
  let EMPTY_OUT="";
  function resetAll(){
    photos.forEach(p=>URL.revokeObjectURL(p.url));photos=[];synced={};
    floors=[0,0,0,0];special={lood:0,mini:0,koepel:0,tuimel:0};ovr={};ovrFreq={};
    g("freq").value="m8";g("koz-no").checked=true;g("koz-yes").checked=false;
    hasResult=false;lastQ=null;lastR=null;lastText="";g("stale").hidden=true;if(embed&&embed.onCalc){const _e=embed;setTimeout(()=>{if(embed===_e&&_e.onCalc)_e.onCalc()},0)}
    setKlant("");hasResult=false;g("stale").hidden=true;g("out").innerHTML=EMPTY_OUT;
    renderFloors();renderSpecial();renderOverig(true);renderPhotos();renderPhsum()}
  let onSaved=null;
  /* ---------- rekenen ---------- */
  const FLO=()=>floors,SPE=()=>special;
  function compute(p){
    const koz=p?!!p.koz:g("koz-yes").checked,fk=p?(p.fk||"w4"):g("freq").value,f0=FREQ[fk]||FREQ.w4,floors=p?(p.floors||[]).map(n=>Number(n)||0):FLO(),special=p?{lood:0,mini:0,koepel:0,tuimel:0,...(p.special||{})}:SPE();
    const fRows=[],sRows=[],FD=staffel(floors.map((n,i)=>({k:winKey(i),n})).filter(x=>x.n)),SD=staffel(SPECIAL.map(x=>({k:x.k,n:special[x.k]||0})).filter(x=>x.n));
    const f={...f0,pct:fpct(fk,f0.pct)};
    floors.forEach((n,i)=>{if(!n)return;const k=winKey(i),avgD=FD[k]||0;
      fRows.push({n:floorName(i),d:`${n} × ${eur(cfg[k+"_p"])} · ${cfg[k+"_s"]} sec${avgD>0?` · staffel −${pct(avgD)}`:""}`,c:n,sec:n*cfg[k+"_s"],price:n*cfg[k+"_p"]*(1-avgD)})});
    SPECIAL.forEach(s=>{const n=special[s.k];if(!n)return;const sd=SD[s.k]||0;const fkB=typeof dienstFreqFactor==="function"?dienstFreqFactor("bijz",f0.w):1;sRows.push({n:s.n,d:`${n} × ${eur(cfg[s.k+"_p"])} · ${cfg[s.k+"_s"]} sec${sd>0?` · staffel −${pct(sd)}`:""}${fkB!==1?` · frequentie ${fkB<1?"−":"+"}${Math.round(Math.abs(1-fkB)*100)}%`:""}`,c:n,sec:n*cfg[s.k+"_s"],price:n*cfg[s.k+"_p"]*(1-sd)*fkB})});
    const all=[...fRows,...sRows],count=all.reduce((a,r)=>a+r.c,0),normal=fRows.reduce((a,r)=>a+r.price,0),freqAdj=-normal*f.pct/100;
    /* glasbewassing en bijzondere ramen staan los van elkaar: de minimumprijs geldt voor de gewone glasbewassing (verdiepingen);
       alleen bijzondere ramen zonder gewone ramen krijgen zelf de minimumprijs */
    const spSom=sRows.reduce((a,r)=>a+r.price,0),glasN=normal+freqAdj,glas=glasN+spSom;let glasEx=glas,minGlas=false,minOp="";
    if(fRows.length&&glasN<cfg.min){minGlas=true;minOp="f";glasEx=cfg.min+spSom}else if(!fRows.length&&sRows.length&&spSom<cfg.min){minGlas=true;minOp="s";glasEx=cfg.min}
    const oRows=ovrRows(p?p.ovr||{}:null),oEx=r2(oRows.reduce((a,r)=>a+r.price,0)),oSec=oRows.reduce((a,r)=>a+r.sec,0),startEx=all.length?cfg.start:0;
    let kozEx=0,minKoz=false,kozSec=0;if(koz){kozEx=count*cfg.koz_p;kozSec=count*cfg.koz_s;if(kozEx<cfg.kozMin){minKoz=true;kozEx=cfg.kozMin}}
    const gSec=all.reduce((a,r)=>a+r.sec,0)+kozSec,sec=gSec+oSec,exG=glasEx+kozEx+startEx,ex=exG+oEx,vat=ex*VAT,inc=ex+vat;
    return {fk,f,koz,fRows,sRows,all,count,normal,freqAdj,glas,glasN,spSom,minOp,glasEx,minGlas,kozEx,minKoz,kozSec,sec,gSec,ex,exG,oRows,oEx,startEx,vat,inc,k:p?{}:klantForm()};
  }
  let lastQ=null,lastText="",lastR=null;
  function calculate(scroll){
    if(loadCfg())fillCfg();
    const R=compute(),{f,koz,fRows,sRows,all,count,normal,freqAdj,glas,glasN,spSom,minOp,glasEx,minGlas,kozEx,minKoz,kozSec,sec,ex,vat,inc,k,oRows,startEx}=R,adres=fullAdres(k);
    const out=g("out");hasResult=true;g("stale").hidden=true;
    if(!all.length&&!oRows.length){out.innerHTML='<div class="empty"><span>Vul minstens één raam of een andere dienst in.</span></div>';lastQ=null;return null}
    const tr=r=>`<tr><td>${r.n}<small>${r.d}</small></td><td>${r.c}</td><td>${dur(r.sec)}</td><td>${eur(r.price)}</td></tr>`;
    const subt=(rows,l)=>rows.length>1?`<tr class="sub"><td>Subtotaal ${l}</td><td>${rows.reduce((a,r)=>a+r.c,0)}</td><td>${dur(rows.reduce((a,r)=>a+r.sec,0))}</td><td>${eur(rows.reduce((a,r)=>a+r.price,0))}</td></tr>`:"";
    const who=k.bedrijf||k.naam;
    out.innerHTML=`<div class="result-top">
      ${who?`<div class="klant">Voor <b>${esc(who)}</b>${k.bedrijf&&k.naam?` · t.a.v. ${esc(k.naam)}`:""}${adres?`<br>${esc(adres)}`:""}</div>`:""}
      <div class="eyebrow">${oRows.length&&oRows.some(r=>r.frequentie!==(f.w||0))?"Eerste beurt · alles samen":"Prijs per beurt · "+f.l}</div>
      <div class="price">${eur(ex)}<small>excl. btw</small></div>
      <div style="margin-top:6px;color:var(--navy-muted);font-variant-numeric:tabular-nums">${eur(inc)} incl. btw</div>${oRows.length?`<div class="perfreq">${all.length?`<span><b>Glasbewassing</b> ${eur(R.exG*(1+VAT))} incl. · ${esc(f.l.toLowerCase())}</span>`:""}${oRows.map(r=>`<span><b>${esc(r.n)}</b> ${eur(r.price*(1+VAT))} incl. · ${esc(freqLabel(r.frequentie).toLowerCase())}</span>`).join("")}</div>`:""}
      <div class="kpis"><div><b>${count}</b><span>ramen</span></div><div><b>${dur(sec)}</b><span>werktijd</span></div><div><b>${eur(R.exG*(1+VAT)*f.y+oRows.reduce((a,r)=>a+r.price*(1+VAT)*52/(r.frequentie||52),0)).replace(/,\d\d$/,"")}</b><span>${f.y>1?"per jaar incl.":"totaal incl."}</span></div></div>
    </div>
    <div class="result-body">
      <div class="tablewrap"><table><thead><tr><th>Onderdeel</th><th>Ramen</th><th>Tijd</th><th>Excl. btw</th></tr></thead><tbody>
        ${fRows.length?`<tr class="group"><td colspan="4">Normale ramen</td></tr>${fRows.map(tr).join("")}${subt(fRows,"normale ramen")}`:""}
        ${sRows.length?`<tr class="group"><td colspan="4">Bijzondere ramen</td></tr>${sRows.map(tr).join("")}${subt(sRows,"bijzondere ramen")}`:""}
        ${oRows.length?`<tr class="group"><td colspan="4">Overige diensten</td></tr>${oRows.map(r=>`<tr><td>${esc(r.n)}<small>${esc(r.d)} · ${esc(freqLabel(r.frequentie).toLowerCase())}</small></td><td>${String(r.c).replace(".",",")}</td><td>${dur(r.sec)}</td><td>${eur(r.price)}</td></tr>`).join("")}`:""}
        <tr class="group"><td colspan="4">Totaal</td></tr>
        ${f.pct&&normal?`<tr class="sub"><td colspan="3">${f.pct>0?`Frequentiekorting ${f.pct}%`:`Frequentietoeslag ${-f.pct}%`}<small>${f.l}, over de normale ramen</small></td><td>${freqAdj<0?"−":"+"}${eur(Math.abs(freqAdj))}</td></tr>`:""}
        ${all.length?`<tr class="sub"><td colspan="3">Totaalprijs glasbewassing${minGlas?`<small>minimumprijs toegepast (berekend ${eur(glas)})</small>`:""}</td><td>${eur(glasEx)}</td></tr>`:""}
        ${koz?`<tr class="sub"><td>Totaalprijs kozijnreiniging<small>${count} × ${eur(cfg.koz_p)}${minKoz?` · minimumprijs toegepast (berekend ${eur(count*cfg.koz_p)})`:""}</small></td><td></td><td>${dur(kozSec)}</td><td>${eur(kozEx)}</td></tr>`:""}
        ${startEx?`<tr class="sub"><td colspan="3">Starttarief</td><td>${eur(startEx)}</td></tr>`:""}
        ${oRows.length?`<tr class="sub"><td colspan="3">Totaalprijs overige diensten</td><td>${eur(R.oEx)}</td></tr>`:""}
        <tr class="sub"><td colspan="3">Totaal excl. btw</td><td>${eur(ex)}</td></tr>
        <tr class="sub"><td colspan="3">Btw 21%</td><td>${eur(vat)}</td></tr>
        <tr class="tot"><td colspan="3">Totaal incl. btw<small>${count} ramen · ${dur(sec)} werktijd</small></td><td>${eur(inc)}</td></tr>
      </tbody></table></div>
      <p class="note">Gewone glasbewassing heeft een minimumprijs van ${eur(cfg.min)} excl. btw; bijzondere ramen komen daar los bij${koz?`, kozijnreiniging ${eur(cfg.kozMin)} excl. btw`:""}. Tijden zijn per regel naar boven afgerond op hele minuten.</p>
      <div class="acts">
        <button class="btn2 pri" type="button" id="sendOff">${RC_SVG.arrow}Offerte versturen</button>
        <button class="btn2" type="button" id="viewPdf">${RC_SVG.doc}PDF bekijken</button>
        <button class="btn2" type="button" id="mkOff">${RC_SVG.doc}Offerte maken</button>
        <button class="btn2" type="button" id="toKlant">${RC_SVG.user}${embed?"Prijs opslaan in klantkaart":"Opslaan bij klant"}</button>
        ${state.dl?`<button class="btn2" type="button" id="dlBtn">${RC_SVG.dl}Download PDF</button>`:""}
        <button class="btn2${state.dl?"":" wide"}" type="button" id="copyBtn">${RC_SVG.copy}Kopieer telling</button>
      </div>
      <div class="msg" id="actMsg" role="status"></div>
      <div class="offimg" id="offImg"><span class="ph2">Overzicht maken…</span></div>
    </div>`;
    lastText=["Telling glasbewassing",who?`Klant: ${who}${k.bedrijf&&k.naam?" (t.a.v. "+k.naam+")":""}`:"",adres?`Adres: ${adres}`:"","",`Frequentie: ${f.l}${koz?" · met kozijnreiniging":""}`,
      ...all.map(r=>`${r.n}: ${r.c} st · ${dur(r.sec)} · ${eur(r.price)}`),
      f.pct&&normal?`${f.pct>0?"Frequentiekorting":"Frequentietoeslag"} ${Math.abs(f.pct)}%: ${freqAdj<0?"−":"+"}${eur(Math.abs(freqAdj))}`:"",
      minGlas?"Minimumprijs glasbewassing toegepast":"",koz?`Kozijnreiniging: ${eur(kozEx)}`:"",...oRows.map(r=>`${r.n} (${r.d}, ${freqLabel(r.frequentie).toLowerCase()}): ${eur(r.price)}`),"",
      `Totaal: ${count} ramen · ${dur(sec)}`,`Excl. btw: ${eur(ex)}`,`Btw 21%: ${eur(vat)}`,`Incl. btw: ${eur(inc)}`].filter((l,i,a)=>l!==""||(i>0&&a[i-1]!=="")).join("\n").trim();
    const extra=[];
    if(f.pct&&normal)extra.push({l:`${f.pct>0?"Frequentiekorting":"Frequentietoeslag"} ${Math.abs(f.pct)}%`,v:`${freqAdj<0?"−":"+"} ${eur(Math.abs(freqAdj))}`});
    if(minGlas)extra.push({l:"Minimumprijs glasbewassing",v:eur(glasEx)});
    if(koz)extra.push({l:"Kozijnreiniging",v:eur(kozEx)});
    if(startEx)extra.push({l:"Starttarief",v:eur(startEx)});
    oRows.forEach(r=>extra.push({l:r.n+" · "+r.d+" · "+freqLabel(r.frequentie).toLowerCase(),v:eur(r.price)}));
    lastQ={createdAt:new Date().toISOString(),naam:k.naam,bedrijf:k.bedrijf,email:k.email,tel:k.tel,adres,notitie:k.notitie,frequentie:f.l,kozijn:koz,ramen:count,minuten:Math.ceil(sec/60),
      rows:all.map((r,i)=>({n:r.n,c:r.c,min:Math.ceil(r.sec/60),p:r2(r.price),g:i<fRows.length?"n":"s"})),extra,excl:r2(ex),btw:r2(vat),incl:r2(inc),
      photos:photos.map(p=>({src:p.cv,w:p.cv.width,h:p.cv.height,dots:p.dots.slice()}))};
    const Q=lastQ;
    if(!host.hasAttribute("data-offerte"))drawPages(Q,1).then(pages=>{if(Q!==lastQ)return;g("offImg").innerHTML=pages.map((cv,i)=>`<img src="${cv.toDataURL("image/jpeg",0.9)}" alt="Overzicht pagina ${i+1}">`).join("")})
      .catch(()=>{const b=g("offImg");if(b)b.innerHTML='<span class="ph2">Het voorbeeld kon niet worden gemaakt.</span>'});
    lastR=R;if(embed&&embed.onCalc){const _e=embed;setTimeout(()=>{if(embed===_e&&_e.onCalc)_e.onCalc()},0)}
    g("mkOff").onclick=()=>doOfferte(false);g("sendOff").onclick=()=>doOfferte(true);g("toKlant").onclick=doKlant;g("viewPdf").onclick=viewPdf;
    if(g("dlBtn"))g("dlBtn").onclick=doPdf;
    g("copyBtn").onclick=()=>copy(lastText,g("copyBtn"));
    if(scroll!==false)g("result").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
    return R;
  }
  const say=(t,c)=>{const m=g("actMsg");if(m){m.textContent=t||"";m.className="msg"+(c?" "+c:"")}};

  /* ---------- naar Mansard: klant, telling met foto's, offerte ---------- */
  async function uploadPhotos(){
    if(!photos.length)return {fotos:[],fail:0};
    let fail=0;
    if(state.assets)for(let i=0;i<photos.length;i++){const p=photos[i];if(p.assetId)continue;
      try{const r=await state.assets.upload(new File([p.blob],"woning-foto-"+(i+1)+".jpg",{type:"image/jpeg"}));p.assetId=r.id}catch(e){fail++}}
    else fail=photos.filter(p=>!p.assetId).length;
    return {fotos:photos.filter(p=>p.assetId).map(p=>({id:p.assetId,w:p.cv.width,h:p.cv.height,dots:p.dots.map(d=>({x:r4(d.x),y:r4(d.y),t:d.t})),...(typeof Meetlint!=="undefined"&&Meetlint.schoon(p.meet)?{meet:Meetlint.schoon(p.meet)}:{})})),fail};
  }
  const r4=n=>Math.round(n*10000)/10000;
  async function ensureKlant(){
    const f=klantForm(),id=g("k-sel").value,ex=state.klanten.find(x=>x.id===id),z=isZ();
    const naam=z?f.bedrijf:f.naam;
    if(!naam){g(z?"k-bedrijf":"k-naam").focus();throw {msg:z?"Vul de bedrijfsnaam in.":"Vul de naam van de klant in."}}
    if(!f.adres){g("k-adres").focus();throw {msg:"Vul het adres in."}}
    const pc=f.pc.replace(/\s+/g,""),postcode=/^\d{4}[A-Z]{2}$/.test(pc)?pc.slice(0,4)+" "+pc.slice(4):f.pc;
    const base={naam,adres:f.adres,postcode,plaats:f.plaats,telefoon:f.tel,email:f.email,soort:z?(ex&&ex.soort==="vve"?"vve":"zakelijk"):"particulier",contact:z?f.naam:"",notities:f.notitie};
    if(ex){const k={...strip(ex),...base,id:ex.id};return k}
    const k={...base,klantnr:"",ronde:"",frequentie:4,prijs:0,laatst:"",gepland:"",tijd:"",duur:30,dienst:"Glasbewassing",objectId:"",binnen:false,actief:true,incasso:false,akkoord:false,geenReview:false,opzegReden:"",aangemaakt:iso(today()),log:[],objecten:[],id:newId("k")};
    return k;
  }
  async function tellingFor(R,k){
    const up=await uploadPhotos();
    const t={datum:iso(today()),floors:floors.slice(),special:{...special},overig:{...ovr},overigFreq:{...ovrFreq},freq:R.fk,koz:R.koz,ramen:R.count,minuten:Math.ceil(R.sec/60),excl:r2(R.ex),incl:r2(R.inc),fotos:up.fotos};
    return {t,fail:up.fail};
  }
  const objMet=(k,count)=>{const os=[...(k.objecten||[])];const i=os.findIndex(o=>o.id===k.objectId);const j=i>-1?i:0;
    if(os[j])os[j]={...os[j],ramen:String(count)};else os.push({id:newId("o"),naam:"Woning",adres:"",postcode:"",plaats:"",ramen:String(count),m2:"",toegang:"",alarmcode:"",parkeren:"",materialen:"",notities:""});
    return {objecten:os,objectId:k.objectId==="hoofd"||os.some(o=>o.id===k.objectId)?k.objectId:os[0].id}};
  async function writeKlant(k,extra){const {id,...data}={...k,...extra};await save("klanten",id,data);return id}
  async function busy(btn,fn){const all=root.querySelectorAll(".acts button");all.forEach(b=>b.disabled=true);const t=btn.innerHTML;btn.innerHTML=btn.innerHTML.replace(/[^>]*$/,"Bezig…");
    try{await fn()}catch(e){say(e&&e.msg?e.msg:"Niet opgeslagen: "+(e&&(e.message||e.code)||"onbekende fout"),"bad")}finally{const b2=g(btn.id);if(b2)b2.innerHTML=t;root.querySelectorAll(".acts button").forEach(b=>b.disabled=false)}}
  function extrasFor(R){const mul=S().incl?1+VAT:1;return (R.oRows||[]).map(r=>({id:newId("o"),dienst:r.n,groep:r.groep,items:r.items.map(it=>({...it})),prijs:r2(r.price*mul),frequentie:r.frequentie||R.f.w||8,duur:Math.max(5,Math.ceil(r.sec/60/5)*5),volgende:"",actief:true}))}
  const mergeExtra=(cur,R)=>{const ex=extrasFor(R);if(!ex.length)return cur||[];const gs=new Set(ex.map(e=>e.groep));return [...(cur||[]).filter(o=>!o.groep||!gs.has(o.groep)),...ex]};
  function opdFor(R,t,base){const m=Math.ceil((R.gSec??R.sec)/60);
    return{prijs:S().incl?r2((R.exG??R.ex)*(1+VAT)):r2(R.exG??R.ex),extra:extrasFor(R),frequentie:R.f.w||Number(base&&base.frequentie)||4,duur:[15,30,45,60,90,120,180,240].reduce((a,b)=>Math.abs(b-m)<Math.abs(a-m)?b:a)}}
  function regelsFor(R){
    const rg=[];
    if(R.all.length){const fl=R.f&&R.f.l?R.f.l:"";const gl=[...R.fRows.map(r=>({omschrijving:`Glasbewassing ${r.n.toLowerCase()}, ${r.c} ramen`,aantal:1,prijs:r2(r.price),n:r.c,sec:r.sec,sub:r.n,qty:r.c+" st",fq:fl})),...R.sRows.map(r=>({omschrijving:`${r.n}, ${r.c} st.`,aantal:1,prijs:r2(r.price),n:r.c,sec:r.sec,sub:r.n,qty:r.c+" st",fq:fl}))];
      if(R.minGlas){/* minimumprijs: echte prijzen per regel + een aparte regel met de aanvulling, zodat alles precies optelt */
        rg.push(...gl.slice(0,R.fRows.length));if(R.minOp!=="s"&&R.f.pct&&R.normal)rg.push({omschrijving:`${R.f.pct>0?"Frequentiekorting":"Frequentietoeslag"} ${Math.abs(R.f.pct)}% (${R.f.l.toLowerCase()})`,aantal:1,prijs:r2(R.freqAdj)});
        const aanv=r2(cfg.min-(R.minOp==="s"?R.spSom:R.glasN)),aRg=aanv>0?{omschrijving:"Aanvulling minimumprijs "+(R.minOp==="s"?"bijzondere ramen":"glasbewassing"),aantal:1,prijs:aanv,minAanv:true}:null;
        if(aRg&&R.minOp!=="s")rg.push(aRg);rg.push(...gl.slice(R.fRows.length));if(aRg&&R.minOp==="s")rg.push(aRg)}
      else{rg.push(...gl);if(R.f.pct&&R.normal)rg.push({omschrijving:`${R.f.pct>0?"Frequentiekorting":"Frequentietoeslag"} ${Math.abs(R.f.pct)}% (${R.f.l.toLowerCase()})`,aantal:1,prijs:r2(R.freqAdj)})}}
    if(R.koz)rg.push({omschrijving:`Kozijnreiniging, ${R.count} ramen`,aantal:1,prijs:r2(R.kozEx)});
    if(R.startEx)rg.push({omschrijving:"Starttarief",aantal:1,prijs:r2(R.startEx)});
    (R.oRows||[]).forEach(r=>rg.push({omschrijving:r.n+": "+r.d+" ("+freqLabel(r.frequentie).toLowerCase()+")",aantal:1,prijs:r2(r.price),sec:r.sec}));
    /* afrondingsverschil van een cent naar de grootste regel, zodat de offerte precies op de berekende prijs uitkomt */
    const diff=r2(r2(R.ex)-rg.reduce((a,r)=>a+r.prijs,0));
    if(diff){const big=rg.reduce((a,r)=>r.prijs>a.prijs?r:a,rg[0]);big.prijs=r2(big.prijs+diff)}
    return rg;
  }
  async function doOfferte(send){const R=calculate(false);if(!R)return;say("");
    if(embed&&embed.offerte)return busy(g(send?"sendOff":"mkOff"),()=>embed.offerte(send?"send":"view"));
    await busy(g(send?"sendOff":"mkOff"),async()=>{
      let kid,k,isNew,fail,opd;
      if(embed){const {t,fail:f2}=await tellingFor(R,{});fail=f2;const base=state.klanten.find(x=>x.id===embed.klantId)||embed.base||{};
        isNew=!embed.klantId||!!base.prospect;opd=opdFor(R,t,base);kid=await embed.onSave({ramenTelling:t,...objMet(base,R.count),...(isNew?{...opd,extra:undefined,opdrachten:mergeExtra(base.opdrachten,R),dienst:base.dienst||"Glasbewassing",prospect:true,actief:true}:{})},{stay:true});const f=embed.form();k={naam:f.naam,adres:f.adres,postcode:f.pc,plaats:f.plaats,email:f.email}}
      else{k=await ensureKlant();const ex=state.klanten.find(x=>x.id===k.id);isNew=!ex||!!ex.prospect;const r=await tellingFor(R,k);fail=r.fail;opd=opdFor(R,r.t,k);
        kid=await writeKlant(ex?{...strip(ex),...k}:k,{ramenTelling:r.t,...objMet(k,R.count),...(isNew?{...opd,extra:undefined,opdrachten:mergeExtra(ex&&ex.opdrachten,R),dienst:k.dienst||"Glasbewassing",prospect:true,actief:true,akkoord:false}:{})})}
      const datum=iso(today()),id=newId("f");
      const data={soort:"offerte",nummer:nextNr("offerte",datum),klantId:kid,klantNaam:k.naam,klantAdres:fullAddr(k),klantEmail:k.email||"",datum,verval:iso(addDays(today(),30)),
        regels:regelsFor(R),btw:21,incl:false,status:"concept",
        notitie:`Prijs per beurt bij ${R.f.l.toLowerCase()}${R.koz?", inclusief kozijnreiniging":""}. Geteld: ${R.count} ramen.`,
        betaaldOp:"",vanOfferte:"",gemaakt:new Date().toISOString(),verstuurdOp:"",herinnerdOp:"",herinneringen:0,
        telling:{ramen:R.count,minuten:Math.ceil(R.sec/60),freq:R.f.l},opdracht:opd};
      await save("facturen",id,data);
      toast((isNew?"Klant aangemaakt en offerte ":"Offerte ")+data.nummer+" staat bij Offertes"+(fail?" · "+plural(fail,"foto is","foto's zijn")+" niet opgeslagen":""));
      resetAll();if(!embed)onSaved=null;
      let n=0;const tryOpen=()=>{if(state.facturen.some(x=>x.id===id)){send?sendF(id):openFactuur(id)}else if(++n<30)setTimeout(tryOpen,100)};setTimeout(tryOpen,60);
    })}
  async function viewPdf(){const R=calculate(false);if(!R||!lastQ)return;const Q=lastQ;
    if(!edDlg.open)edDlg.showModal();
    ge("pv-stage").innerHTML='<p style="color:#aab2b8">Overzicht maken…</p>';ge("pv").hidden=false;document.body.style.overflow="hidden";
    try{const pages=await drawPages(Q,1.4);ge("pv-stage").innerHTML=pages.map((cv,i)=>`<img src="${cv.toDataURL("image/jpeg",0.9)}" alt="Pagina ${i+1}">`).join("")}
    catch(e){ge("pv-stage").innerHTML='<p style="color:#aab2b8">Het overzicht kon niet worden gemaakt.</p>'}
    ge("pv-dl").hidden=!state.dl}
  async function doKlant(){const R=calculate(false);if(!R)return;say("");
    if(embed)return busy(g("toKlant"),async()=>{
      const {t,fail}=await tellingFor(R,{});const base=state.klanten.find(x=>x.id===embed.klantId)||embed.base||{};
      const op=opdFor(R,t,base),prijs=op.prijs,duur=op.duur;
      const name=embed.form().naam;await embed.onSave({prijs,frequentie:R.f.w||Number(base.frequentie)||4,duur,ramenTelling:t,opdrachten:mergeExtra(base.opdrachten,R),...objMet(base,R.count)});
      resetAll();toast("Prijs "+eur(prijs)+" en telling opgeslagen in de klantkaart van "+name+(fail?" · "+plural(fail,"foto is","foto's zijn")+" niet opgeslagen":""))});
    await busy(g("toKlant"),async()=>{
      const k=await ensureKlant(),isNew=!state.klanten.some(x=>x.id===k.id);
      const {t,fail}=await tellingFor(R,k);
      const op=opdFor(R,t,k),prijs=op.prijs,duur=op.duur,exK=state.klanten.find(x=>x.id===k.id);
      const kid=await writeKlant(k,{prijs,dienst:k.dienst||"Glasbewassing",frequentie:R.f.w||Number(k.frequentie)||4,duur,ramenTelling:t,opdrachten:mergeExtra(exK&&exK.opdrachten,R),...objMet(k,R.count)});
      selectKid(kid,cleanName(k.naam));
      say(`${isNew?"Nieuwe klant":"Klant"} ${cleanName(k.naam)} opgeslagen · ${eur(prijs)} ${S().incl?"incl.":"excl."} btw per beurt, ${R.f.w?"elke "+R.f.w+" weken":R.f.l.toLowerCase()}`+(fail?" · "+plural(fail,"foto is","foto's zijn")+" niet opgeslagen":""),"ok");
      const cb=onSaved;resetAll();
      if(cb){cb(kid);toast("Telling en prijs opgeslagen op de klantkaart van "+cleanName(k.naam))}
      else toast("Opgeslagen bij "+cleanName(k.naam)+" · calculator is leeggemaakt",[{label:"Open klant",fn:()=>openKlant(kid)}]);
    })}

  /* ---------- PDF-overzicht (A4, pagina 1 telling, daarna 2 foto's per pagina) ---------- */
  const OF={ink:"#0c0d0e",text:"#3f4451",muted:"#6b7280",line:"#eceef1",soft:"#f6f7f8",font:'"Manrope", system-ui, -apple-system, sans-serif'};
  const LOGO_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 1100"><circle cx="550" cy="550" r="520" fill="#0c0d0e"/><circle cx="550" cy="550" r="432" fill="none" stroke="#fff" stroke-width="16"/><g fill="none" stroke="#fff" stroke-width="18"><path d="M326 766 V470 C326 380 380 305 472 262 C565 305 618 380 618 470 V766"/><path d="M468 766 V470 C468 380 520 305 612 262 C705 305 758 380 758 470 V766"/></g></svg>';
  let logoP=null;
  const getLogo=()=>logoP||(logoP=new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(LOGO_SVG)}));
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  const fnt=(c,size,weight)=>{c.font=`${weight||400} ${size}px ${OF.font}`};
  function spaced(c,t,x,y,sp,align){const chars=[...t];const w=chars.reduce((a,ch)=>a+c.measureText(ch).width,0)+sp*(chars.length-1);
    let cx=align==="center"?x-w/2:align==="right"?x-w:x;const a=c.textAlign;c.textAlign="left";chars.forEach(ch=>{c.fillText(ch,cx,y);cx+=c.measureText(ch).width+sp});c.textAlign=a}
  function wrapT(c,t,maxW){const out=[];String(t).split("\n").forEach(par=>{let line="";par.split(" ").forEach(w=>{const tr=line?line+" "+w:w;if(c.measureText(tr).width>maxW&&line){out.push(line);line=w}else line=tr});out.push(line)});return out}
  const longDate=s=>{try{return new Date(s).toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"})}catch(e){return ""}};
  const PW=1080,PH=1527,PM=80;
  const fmtMin=m=>m>=60?`${Math.floor(m/60)} u ${String(m%60).padStart(2,"0")}`:`${m} min`;
  const refNr=s=>{const d=new Date(s);const p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`};
  function pageNew(scale){const cv=document.createElement("canvas");cv.width=Math.round(PW*scale);cv.height=Math.round(PH*scale);const c=cv.getContext("2d");c.scale(scale,scale);c.fillStyle="#ffffff";c.fillRect(0,0,PW,PH);c.textBaseline="alphabetic";return {cv,c}}
  function pageHead(c,logo,Q,title,compact){
    c.fillStyle="#e3e6e9";c.fillRect(0,0,PW,8);const ls=compact?72:104,ly=compact?52:60;
    if(logo)c.drawImage(logo,PM,ly,ls,ls);
    c.fillStyle=OF.ink;fnt(c,compact?24:30,600);spaced(c,title,PW-PM,ly+(compact?32:40),compact?5:6,"right");
    c.textAlign="right";c.fillStyle=OF.text;fnt(c,compact?18:19,400);c.fillText("Glasbewassing · "+longDate(Q.createdAt),PW-PM,ly+(compact?62:74));
    if(compact){const who=[Q.bedrijf||Q.naam,Q.adres].filter(Boolean).join(" · ");if(who){c.fillStyle=OF.muted;fnt(c,16,400);c.fillText(who.length>60?who.slice(0,58)+"…":who,PW-PM,ly+88)}}
    else{c.fillStyle=OF.muted;fnt(c,16,400);c.fillText("Nr. "+refNr(Q.createdAt),PW-PM,ly+102)}
    c.textAlign="left";const yb=ly+ls+(compact?30:40);c.fillStyle=OF.line;c.fillRect(PM,yb,PW-2*PM,2);return yb}
  function pageFoot(c,i,n){c.fillStyle=OF.line;c.fillRect(PM,PH-92,PW-2*PM,1.5);c.textAlign="right";c.fillStyle=OF.muted;fnt(c,14,400);c.fillText(`Pagina ${i} van ${n}`,PW-PM,PH-58);c.textAlign="left"}
  const label=(c,t,x,y)=>{c.fillStyle=OF.muted;fnt(c,15,700);spaced(c,t,x,y,3,"left")};
  function drawMain(c,Q,logo){
    let y=pageHead(c,logo,Q,"OVERZICHT",false)+62;const CW=PW-2*PM,colW=(CW-48)/2,RX=PM+colW+48;
    label(c,"KLANT",PM,y);label(c,"OPDRACHT",RX,y);let yl=y+42,yr=y+42;c.textAlign="left";
    c.fillStyle=OF.ink;fnt(c,21,600);wrapT(c,Q.bedrijf||Q.naam||"—",colW).forEach(l=>{c.fillText(l,PM,yl);yl+=32});
    c.fillStyle=OF.text;fnt(c,18,400);[Q.bedrijf&&Q.naam?"t.a.v. "+Q.naam:"",Q.adres,Q.email,Q.tel].filter(Boolean).forEach(t=>wrapT(c,t,colW).forEach(l=>{c.fillText(l,PM,yl);yl+=28}));
    c.fillStyle=OF.ink;fnt(c,21,600);c.fillText("Glasbewassing",RX,yr);yr+=32;c.fillStyle=OF.text;fnt(c,18,400);
    [["Frequentie",Q.frequentie],["Kozijnreiniging",Q.kozijn?"Ja, elke keer":"Nee"],["Foto's",(Q.photos||[]).length?`${Q.photos.length} bijgevoegd`:""]].filter(r=>r[1]).forEach(([k,v])=>{
      c.fillStyle=OF.muted;c.fillText(k,RX,yr);c.fillStyle=OF.text;c.textAlign="right";c.fillText(v,RX+colW,yr);c.textAlign="left";yr+=28});
    y=Math.max(yl,yr)+8;
    if(Q.notitie){fnt(c,18,400);const lines=wrapT(c,Q.notitie,CW-56);const h=56+lines.length*27;
      rr(c,PM,y,CW,h,18);c.fillStyle="#fffbea";c.fill();c.strokeStyle="#f0e1a4";c.lineWidth=2;c.stroke();
      c.fillStyle="#a06d10";fnt(c,14,700);spaced(c,"NOTITIE",PM+28,y+34,3.5,"left");c.fillStyle=OF.ink;fnt(c,18,400);lines.forEach((l,i)=>c.fillText(l,PM+28,y+62+i*27));y+=h+8}
    y+=28;const tw=(CW-32)/3,th=100;
    [["RAMEN",String(Q.ramen),0],["WERKTIJD",fmtMin(Q.minuten),0],["PER BEURT INCL. BTW",eur(Q.incl),1]].forEach(([l,v,dark],i)=>{
      const x=PM+i*(tw+16);rr(c,x,y,tw,th,20);c.fillStyle=dark?"#e9ecef":OF.soft;c.fill();c.fillStyle=OF.muted;fnt(c,13,700);spaced(c,l,x+24,y+36,2.5,"left");
      c.fillStyle=OF.ink;fnt(c,26,500);c.textAlign="left";c.fillText(v,x+24,y+76)});
    y+=th+64;const xR=PW-PM-330,xT=PW-PM-180,xB=PW-PM;
    label(c,"ONDERDEEL",PM,y);fnt(c,15,700);c.fillStyle=OF.muted;spaced(c,"RAMEN",xR,y,3.5,"right");spaced(c,"TIJD",xT,y,3.5,"right");spaced(c,"BEDRAG",xB,y,3.5,"right");
    y+=20;c.fillStyle="#d5d9de";c.fillRect(PM,y,CW,1.5);
    [["NORMALE RAMEN",(Q.rows||[]).filter(r=>r.g!=="s")],["BIJZONDERE RAMEN",(Q.rows||[]).filter(r=>r.g==="s")]].forEach(([gl,rows])=>{if(!rows.length)return;
      y+=14;c.fillStyle=OF.soft;c.fillRect(PM,y,CW,42);c.fillStyle=OF.muted;fnt(c,13,700);spaced(c,gl,PM+16,y+28,2.5,"left");y+=42;
      rows.forEach(r=>{y+=40;c.textAlign="left";c.fillStyle=OF.text;fnt(c,19,400);c.fillText(r.n,PM+16,y);
        c.textAlign="right";fnt(c,18,400);c.fillStyle=OF.muted;c.fillText(String(r.c),xR,y);c.fillText(fmtMin(r.min),xT,y);c.fillStyle=OF.text;fnt(c,19,600);c.fillText(eur(r.p),xB,y);
        y+=19;c.fillStyle=OF.line;c.fillRect(PM+16,y,CW-16,1.5)})});
    y+=16;const TX=PW/2+40;
    [...(Q.extra||[]).map(e=>[e.l,e.v]),["Totaal excl. btw",eur(Q.excl)],["Btw 21%",eur(Q.btw)]].forEach(([l,v])=>{y+=36;c.textAlign="left";c.fillStyle=OF.text;fnt(c,18,400);c.fillText(l,TX,y);c.textAlign="right";c.fillText(v,xB,y)});
    y+=26;rr(c,TX-20,y,xB-TX+20,72,16);c.fillStyle="#eef0f2";c.fill();
    c.textAlign="left";c.fillStyle=OF.text;fnt(c,18,600);c.fillText("Totaal incl. btw",TX+4,y+44);c.textAlign="right";fnt(c,25,600);c.fillText(eur(Q.incl),xB-22,y+46);
    y+=72+48;c.textAlign="left";c.fillStyle=OF.muted;fnt(c,16,400);
    wrapT(c,"Dit is een richtprijs per beurt. De definitieve prijs volgt na een korte controle van bereikbaarheid en raamformaat. Tijden zijn naar boven afgerond op hele minuten.",CW).forEach(l=>{c.fillText(l,PM,y);y+=25});
  }
  function drawPhotoPage(c,Q,logo,list,start){
    const y=pageHead(c,logo,Q,"FOTO'S VAN DE WONING",true)+48;const CW=PW-2*PM,slot=(PH-96-40-y)/2;
    list.forEach((ph,k)=>{const i=start+k,top=y+k*slot;label(c,`FOTO ${i+1}`,PM,top+4);
      const sum=dotSummary(ph.dots);let rx=PW-PM;c.textAlign="right";fnt(c,16,600);
      if(!sum.length){c.fillStyle=OF.muted;c.fillText("Geen ramen gemarkeerd",rx,top+4)}
      sum.slice().reverse().forEach(([t,n])=>{const m=dt(t),txt=`${m.sh} ${n}`;c.fillStyle=OF.text;c.fillText(txt,rx,top+4);rx-=c.measureText(txt).width+18;c.beginPath();c.arc(rx+4,top-3,9,0,Math.PI*2);c.fillStyle=m.col;c.fill();rx-=26});
      c.textAlign="left";
      const bh=slot-60,s=Math.min(CW/ph.w,bh/ph.h),w=ph.w*s,h=ph.h*s,x=PM+(CW-w)/2,iy=top+24;
      c.save();rr(c,x,iy,w,h,18);c.clip();c.drawImage(ph.src,x,iy,w,h);c.restore();
      ph.dots.forEach(d=>{const dx=x+d.x*w,dy=iy+d.y*h,m=dt(d.t);c.beginPath();c.arc(dx,dy,10,0,Math.PI*2);c.fillStyle=m.col;c.fill();c.lineWidth=2.5;c.strokeStyle="#fff";c.stroke();
        c.fillStyle="#fff";fnt(c,m.c.length>1?7.5:10,700);c.textAlign="center";c.fillText(m.c,dx,dy+(m.c.length>1?2.7:3.6));c.textAlign="left"})});
  }
  async function drawPages(Q,scale){
    try{await Promise.all(["400 28px Manrope","500 28px Manrope","600 28px Manrope","700 28px Manrope"].map(f=>document.fonts.load(f)))}catch(e){}
    const logo=await getLogo(),ph=Q.photos||[],chunks=[];for(let i=0;i<ph.length;i+=2)chunks.push(ph.slice(i,i+2));
    const n=1+chunks.length,out=[];const p=pageNew(scale);drawMain(p.c,Q,logo);pageFoot(p.c,1,n);out.push(p.cv);
    chunks.forEach((ch,k)=>{const q=pageNew(scale);drawPhotoPage(q.c,Q,logo,ch,k*2);pageFoot(q.c,k+2,n);out.push(q.cv)});return out}
  const fileName=Q=>("Overzicht "+(Q.bedrijf||Q.naam||"glasbewassing")+" "+(Q.createdAt||"").slice(0,10)).replace(/[^\p{L}\p{N} _-]/gu,"").trim().replace(/\s+/g," ")+".pdf";
  async function doPdf(){const R=calculate(false);if(!R||!lastQ)return;const Q=lastQ;say("");
    await busy(g("dlBtn"),async()=>{const J=window.jspdf&&window.jspdf.jsPDF;if(!J)throw {msg:"De PDF-module is niet geladen. Vernieuw de pagina."};
      const pages=await drawPages(Q,2);const doc=new J({unit:"mm",format:"a4",orientation:"portrait",compress:true});
      doc.setProperties({title:fileName(Q).replace(/\.pdf$/,"")});pages.forEach((cv,i)=>{if(i)doc.addPage("a4","portrait");doc.addImage(cv.toDataURL("image/jpeg",0.92),"JPEG",0,0,210,297)});
      await saveFile(fileName(Q),doc.output("blob"),"Overzicht opgeslagen")})}

  /* ---------- bediening ---------- */
  g("overig").addEventListener("toggle",e=>{const d=e.target;if(d.dataset&&d.dataset.g){if(d.open)ovOpen.add(d.dataset.g);else ovOpen.delete(d.dataset.g)}},true);
  ["floors","special","overig"].forEach(id=>{const box=g(id);
    box.addEventListener("click",e=>{const b=e.target.closest("button[data-t]");if(!b)return;setVal(b.dataset.t,Number(g(b.dataset.t).value)+ +b.dataset.d)});
    box.addEventListener("change",e=>{if(e.target.dataset&&e.target.dataset.ovf){ovrFreq[e.target.dataset.ovf]=Number(e.target.value);const dd=e.target.closest(".ovg"),em=dd&&dd.querySelector("summary em");if(em&&em.textContent)em.textContent=em.textContent.replace(/ · .*$/,"")+" · "+freqLabel(Number(e.target.value)).toLowerCase();markStale();return}if(e.target.matches("input"))setVal(e.target.id,e.target.value)})});
  g("addFloor").onclick=()=>{floors.push(0);renderFloors();markStale();g("f"+(floors.length-1)).focus()};
  g("removeFloor").onclick=()=>{if(floors.length>1){floors.pop();renderFloors();markStale()}};
  root.querySelectorAll('input[name="koz"]').forEach(el=>el.addEventListener("change",markStale));
  let freqTouched=false;g("freq").addEventListener("change",()=>{freqTouched=true;renderOverig();markStale()});
  g("calcBtn").onclick=()=>calculate();
  const fillFreq=()=>{refreshFreq();const gf=typeof uFreqGroep==="function"?uFreqGroep("glas"):{keuzes:null,advies:null},aan=k=>calcOn(k)&&(!gf.keuzes||gf.keuzes.includes(k)),L=FREQ_LIST.filter(([k])=>aan(k)).sort((a,b)=>(a[4]||999)-(b[4]||999)),cur=g("freq").value,def=freqTouched&&L.some(([k])=>k===cur)?cur:gf.advies&&L.some(([k])=>k===gf.advies)?gf.advies:L.some(([k])=>k===cur)?cur:L.some(([k])=>k==="m8")?"m8":(L[0]||[])[0];
    g("freq").innerHTML=L.map(([k,l,,p0])=>{const p=fpct(k,p0);return `<option value="${k}"${k===def?" selected":""}>${l}${p>0?` (−${p}%)`:p<0?` (+${-p}%)`:""}</option>`}).join("")};fillFreq();
  g("rateRows").innerHTML=TYPES.map(t=>`<tr><td>${t.l}</td><td><input id="cfg-${t.k}_s" data-k="${t.k}_s" type="number" min="0" step="1" aria-label="Seconden ${t.l}">${t.se?'<span class="flag">*</span>':""}</td><td><input id="cfg-${t.k}_p" data-k="${t.k}_p" type="number" min="0" step="0.0001" aria-label="Prijs ${t.l}">${t.pe?'<span class="flag">*</span>':""}</td></tr>`).join("");
  const cfgInputs=[...root.querySelectorAll("#rateRows input")];
  [["r-start","start"],["r-min","min"],["r-kozmin","kozMin"],["r-kozp","koz_p"],["r-kozs","koz_s"]].forEach(([id,k])=>{const el=g(id);el.dataset.k=k;cfgInputs.push(el)});
  const renderTiers=()=>{g("tiers").innerHTML=cfg.tiers.map((t,i)=>`<div class="field"><label for="t-from${i}">Vanaf (ramen)</label><input id="t-from${i}" data-i="${i}" data-j="0" type="number" min="0" step="1" value="${t[0]}"></div><div class="field"><label for="t-pct${i}">Korting (%)</label><input id="t-pct${i}" data-i="${i}" data-j="1" type="number" min="0" max="100" step="1" value="${t[1]}"></div>`).join("")};
  const fillCfg=()=>{cfgInputs.forEach(el=>{if(root.activeElement!==el)el.value=cfg[el.dataset.k]});renderTiers()};
  cfgInputs.forEach(el=>el.addEventListener("input",()=>{cfg[el.dataset.k]=Math.max(0,Number(el.value)||0);saveCfg();renderFloors();renderSpecial();markStale()}));
  g("tiers").addEventListener("input",e=>{const el=e.target;if(!el.dataset.i)return;cfg.tiers[+el.dataset.i][+el.dataset.j]=Math.max(0,Number(el.value)||0);saveCfg();markStale()});
  /* swipe: rechts = +1, links = −1 */
  const TH=64;let sw=null;
  function swDown(e){if(e.button>0||e.target.closest("button,input"))return;const wrap=e.target.closest(".swipe");if(!wrap)return;
    sw={wrap,row:wrap.querySelector(".row"),id:wrap.dataset.id,x:e.clientX,y:e.clientY,dx:0,lock:null,pid:e.pointerId};sw.row.classList.remove("back")}
  function swMove(e){if(!sw||e.pointerId!==sw.pid)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;
    if(!sw.lock){if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){sw=null;return}if(Math.abs(dx)>8){sw.lock="x";try{sw.wrap.setPointerCapture(e.pointerId)}catch(_){}}else return}
    e.preventDefault();const lim=150,d=Math.sign(dx)*Math.min(Math.abs(dx),lim+(Math.abs(dx)-lim>0?(Math.abs(dx)-lim)*.25:0));
    sw.dx=d;sw.row.style.transform=`translateX(${d}px)`;sw.wrap.classList.toggle("dr",d>0);sw.wrap.classList.toggle("dl",d<0);
    const armed=Math.abs(d)>=TH;if(armed&&!sw.wrap.classList.contains("armed")){try{navigator.vibrate&&navigator.vibrate(8)}catch(_){}}sw.wrap.classList.toggle("armed",armed)}
  function swUp(e){if(!sw||e.pointerId!==sw.pid)return;const {wrap,row,id,dx}=sw;sw=null;
    if(Math.abs(dx)>=TH){const el=g(id);setVal(id,Number(el.value)+(dx>0?1:-1));const e2=g(id);e2.classList.remove("bump");void e2.offsetWidth;e2.classList.add("bump")}
    row.classList.add("back");row.style.transform="";setTimeout(()=>wrap.classList.remove("dr","dl","armed"),220)}
  ["floors","special"].forEach(id=>{const box=g(id);box.addEventListener("pointerdown",swDown);box.addEventListener("pointermove",swMove,{passive:false});box.addEventListener("pointerup",swUp);box.addEventListener("pointercancel",swUp)});
  /* klant */
  root.querySelectorAll('input[name="ktype"]').forEach(r=>r.addEventListener("change",()=>{g("f-bedrijf").hidden=!isZ();labelNaam();markStale()}));
  g("k-pc").addEventListener("blur",e=>{const v=e.target.value.replace(/\s+/g,"").toUpperCase();e.target.value=/^\d{4}[A-Z]{2}$/.test(v)?v.slice(0,4)+" "+v.slice(4):e.target.value.toUpperCase()});
  g("k-sel").addEventListener("change",e=>setKlant(e.target.value));
  root.querySelector(".form").addEventListener("input",e=>{if(e.target.id!=="ph-in"&&e.target.id!=="k-sel")markStale()});
  g("k-last").addEventListener("click",e=>{if(e.target.closest("#loadTel")){const k=state.klanten.find(x=>x.id===g("k-sel").value);if(k)loadTelling(k)}});
  /* foto's */
  g("handm").addEventListener("click",()=>{const on=!host.hasAttribute("data-handmatig");setHandm(on);if(on){const c=g("cFloors");if(c)c.scrollIntoView({block:"start",behavior:"smooth"})}});
  g("ph-in").addEventListener("change",async e=>{const files=[...e.target.files];e.target.value="";
    for(const f of files){try{photos.push(await loadPhoto(f))}catch(_){}}renderPhotos();markStale();if(files.length===1&&photos.length)openEd(photos.length-1)});
  /* ramen tellen met AI (zelfde telling als bij de tellingcontrole): de foto's met stippen komen hier binnen en de aantallen gaan naar de telling */
  const aiBtn=g("ph-ai");if(aiBtn)aiBtn.onclick=()=>{if(typeof openFotoTelling!=="function"){toast("AI tellen is hier niet beschikbaar");return}
    const prev=photos.filter(p=>p.ai&&p.rf).map(p=>({...p.rf,dots:p.dots.map(d=>({...d}))}));
    openFotoTelling({naam:(g("k-naam")||{}).value||"",adres:(g("k-adres")||{}).value||""},prev,async res=>{
      const nieuw=[];for(const r of res.fotos||[]){try{const im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=r.url});const cv=document.createElement("canvas");cv.width=im.naturalWidth;cv.height=im.naturalHeight;cv.getContext("2d").drawImage(im,0,0);
        nieuw.push({cv,blob:r.blob,url:r.url,dots:(r.dots||[]).map(d=>({x:d.x,y:d.y,t:d.t})),assetId:"",ai:true,rf:{zijde:r.zijde,blob:r.blob,url:r.url,data:r.data,w:r.w,h:r.h,dub:(r.dub||[]).map(x=>({...x}))}})}catch(_){}}
      photos=[...photos.filter(p=>!p.ai),...nieuw];renderPhotos();syncFromPhotos();markStale();
      aiBtn.classList.add("klaar");aiBtn.querySelector("span").textContent="AI-telling bekijken";
      try{g("cFloors").scrollIntoView({behavior:"smooth",block:"start"})}catch(_){}})};
  g("photos").addEventListener("click",e=>{const rm=e.target.closest("[data-rm]");
    if(rm){const i=+rm.dataset.rm;URL.revokeObjectURL(photos[i].url);photos.splice(i,1);renderPhotos();syncFromPhotos();markStale();return}
    const ph=e.target.closest(".ph");if(ph)openEd(+ph.dataset.i)});
  g("photos").addEventListener("keydown",e=>{const ph=e.target.closest(".ph");if(ph&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openEd(+ph.dataset.i)}});
  ge("ed-wrap").addEventListener("click",e=>{const p=photos[edIdx];if(!p)return;const dot=e.target.closest(".dot");
    if(dot){p.dots.splice(+dot.dataset.j,1);renderDots();return}
    const r=ge("ed-img").getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(x<0||x>1||y<0||y>1)return;
    p.dots.push({x,y,t:curType});lastTap=curType;renderDots()});
  const undo1=()=>{if(edMode==="meten"&&edMl){edMl.ongedaan();return}const p=photos[edIdx];if(p&&p.dots.length){p.dots.pop();renderDots()}};ge("ed-undo").onclick=undo1;
  ge("ed-clear").onclick=()=>{if(edMode==="meten"&&edMl){edMl.wis();return}const p=photos[edIdx];if(p){p.dots=[];renderDots()}};
  ge("ed-mode").addEventListener("click",e=>{const b=e.target.closest("[data-em]");if(b)edZetMode(b.dataset.em)});
  ge("ed-done").onclick=closeEd;
  const closePv=()=>{ge("pv").hidden=true;if(ge("ed").hidden&&edDlg.open)edDlg.close();document.body.style.overflow=""};
  ge("pv-close").onclick=closePv;ge("pv-dl").onclick=()=>{closePv();doPdf()};
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!ge("pv").hidden){e.preventDefault();closePv()}});
  ge("ed-types").addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(!b)return;curType=b.dataset.t;renderTypes()});
  

  fillCfg();renderFloors();renderSpecial();EMPTY_OUT=g("out").innerHTML;
  return {host,
    reset:resetAll,
    /* prijs berekenen zonder het scherm te gebruiken (opdrachtregel glasbewassing) */
    prijs(p){if(loadCfg())fillCfg();return compute(p)},
    regelsVoor(p){if(loadCfg())fillCfg();return regelsFor(compute(p))},
    cfgMin(){return {glas:cfg.min,koz:cfg.kozMin,start:cfg.start}},
    cfgAll(){if(loadCfg())fillCfg();return JSON.parse(JSON.stringify(cfg))},
    freqPct(w){if(loadCfg())fillCfg();const fk=({1:"w1",2:"w2",4:"w4",6:"w6",8:"m8",12:"w12",13:"mnd3",16:"w16",24:"w24",26:"mnd6",48:"w48",52:"mnd12"})[Number(w)]||"w4",f=FREQ[fk];return fpct(fk,f?f.pct:0)},
    staffel(list){if(loadCfg())fillCfg();return staffel(list)},
    isBase:k=>FREQ_BASE.some(x=>x[0]===k),
    /* p = de korting zoals ingesteld in Uitvoering (niet de standaardwaarde), zodat de keuzelijsten in offerte en opdracht kloppen */
    freqList(){if(loadCfg())fillCfg();refreshFreq();const gf=typeof uFreqGroep==="function"?uFreqGroep("glas"):{keuzes:null,advies:null},mag=k=>!gf.keuzes||gf.keuzes.includes(k);return FREQ_LIST.map(([k,l,y,p0,w])=>({k,l,p:fpct(k,p0),pDef:p0,w,calcAan:calcOn(k),aan:calcOn(k)&&mag(k),webAan:webOn(k)&&mag(k),adv:gf.advies===k}))},
    refreshFreq(){refreshFreq()},
    fkVoor(w){return ({1:"w1",2:"w2",4:"w4",6:"w6",8:"m8",12:"w12",13:"mnd3",16:"w16",24:"w24",26:"mnd6",48:"w48",52:"mnd12"})[Number(w)]||"w4"},
    current(){if(!lastR||!lastQ)return null;return {regels:regelsFor(lastR),opd:opdFor(lastR,null,embed&&embed.base),extra:extrasFor(lastR),count:lastR.count,minGlas:!!lastR.minGlas,berekend:r2(lastR.minOp==="s"?lastR.spSom:lastR.glasN??lastR.glas??0),min:cfg.min}},
    refreshOverig(){renderOverig()},
    async telling(){if(!lastR)return {t:null,fail:0};return tellingFor(lastR,{})},
    loadObj(t){if(t)return loadTelling({ramenTelling:t},true)},
    getFreq(){return g("freq").value},setFreq(fk){if(FREQ[fk]){g("freq").value=fk;markStale()}},
    setOfferte(on){if(on)host.setAttribute("data-offerte","");else host.removeAttribute("data-offerte");if(on&&totalCount()>photos.flatMap(p=>p.dots).length)setHandm(true);if(on&&lastQ)calculate(false)},
    /* aantallen zelf invullen (zonder foto's); foto's blijven de voorkeur */
    handmatig(on){setHandm(on)},
    isHandmatig(){return host.hasAttribute("data-handmatig")},
    setEmbed(o,doReset){embed=o||null;host.removeAttribute("data-offerte");host.removeAttribute("data-handmatig");if(o)host.setAttribute("data-embed","");else host.removeAttribute("data-embed");host.removeAttribute("data-locked");onSaved=null;
      g("k-eb").textContent=o?"Woning":"Klant";g("k-h2").textContent=o?"Foto's van de woning":"Klantgegevens";if(doReset)resetAll();if(o&&o.klantId){fillKlantSelect();g("k-sel").value=o.klantId}},
    loadFor(id){const k=state.klanten.find(x=>x.id===id);if(k&&k.ramenTelling)loadTelling(k,true)},
    setLocked(on,cb){if(on)host.setAttribute("data-locked","");else host.removeAttribute("data-locked");onSaved=on?cb:null;g("k-eb").textContent=on?"Woning":"Klant";g("k-h2").textContent=on?"Foto's en notitie":"Klantgegevens"},
    sync(){fillKlantSelect();fillFreq();if(loadCfg()){fillCfg();renderFloors();renderSpecial()}renderOverig()},
    focusState(){const a=root.activeElement;return a&&a.id?{id:a.id,s:a.selectionStart,e:a.selectionEnd}:null},
    restoreFocus(f){const el=g(f.id);if(!el)return;try{el.focus({preventScroll:true})}catch(_){}try{if(f.s!=null)el.setSelectionRange(f.s,f.e)}catch(_){}},
    openKlant(id){fillKlantSelect();setKlant(id);const k=state.klanten.find(x=>x.id===id);if(k&&k.ramenTelling)loadTelling(k)}};
}

