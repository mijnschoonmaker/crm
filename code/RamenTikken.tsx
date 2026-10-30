import { useMemo, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

type Dot = { x: number; y: number; t: number; id: number; s: number; nieuw?: boolean }

const SOORTEN = [
    { k: "BG", naam: "Begane grond", kleur: "#e5484d" },
    { k: "1", naam: "1e verdieping", kleur: "#f76b15" },
    { k: "2", naam: "2e verdieping", kleur: "#8e4ec6" },
    { k: "T", naam: "Tuimelraam", kleur: "#0090ff" },
]

const START: [number, number, number][] = [
    [12.7, 67, 0], [38.3, 70, 0], [45.8, 70, 0], [66, 67, 0], [69.3, 72, 0],
    [72.6, 42, 1], [76.2, 42, 1], [79.6, 42, 1],
    [16, 48, 3], [27.3, 47, 3], [39, 44, 3],
]

interface Props {
    rand?: boolean
    foto?: { src?: string; alt?: string } | string
    g0: number
    g1: number
    g2: number
    tuimel: number
    minimum: number
    korting: number
    kleur: string
    lijn: string
    radius: number
    font: any
    style?: React.CSSProperties
}

const euro = (n: number) => "€ " + n.toFixed(2).replace(".", ",")
const mix = (hex: string, pct: number) => {
    const h = hex.replace("#", ""), r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16), f = pct / 100
    return `rgb(${Math.round(r * f + 255 * (1 - f))},${Math.round(g * f + 255 * (1 - f))},${Math.round(b * f + 255 * (1 - f))})`
}
const rgba = (hex: string, a: number) => {
    const h = hex.replace("#", "")
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

/* staffelkorting zoals in het CRM: vanaf het n-de raam p% korting op dat raam */
const STAFFEL: [number, number][] = [[10, 10], [20, 20], [30, 30], [40, 40]]
const STAFFEL_TUIMEL: [number, number][] = [[5, 10]]
const staffel = (t: [number, number][], n: number) => {
    let off = 0
    for (let i = 1; i <= n; i++) { let d = 0; for (const [v, p] of t) if (i >= v) d = p; off += d / 100 }
    return n ? off / n : 0
}

const ICON = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" }

/**
 * Ramen aantikken op een foto en direct een voorbeeldprijs zien, in dezelfde stijl als de dienstenwebshop.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 560
 */
export default function RamenTikken(props: Props) {
    const { g0 = 1.64, g1 = 1.71, g2 = 2.06, tuimel = 1.83, minimum = 56.2, korting = 5, kleur = "#121212", radius = 0, font, style } = props
    const src = typeof props.foto === "string" ? props.foto : props.foto?.src || "https://app.mansard.nl/site/huis.jpg"
    const alt = (typeof props.foto === "object" && props.foto?.alt) || "Woning om ramen op aan te tikken"
    const idRef = useRef(100)
    const [dots, setDots] = useState<Dot[]>(() => START.map(([x, y, t], i) => ({ x, y, t, id: i, s: 1 })))
    const [cur, setCur] = useState(0)
    const [maat, setMaat] = useState(10)
    const tel = useMemo(() => SOORTEN.map((_, i) => dots.filter((d) => d.t === i).length), [dots])
    const n = dots.length
    /* zelfde berekening als de rekentool in het CRM (prijzen excl. btw, daarna 21% btw).
       De minimumprijs geldt voor de ramen per verdieping; tuimelramen komen er los bij. */
    const nRamen = tel[0] + tel[1] + tel[2]
    const normaal = (tel[0] * g0 + tel[1] * g1 + tel[2] * g2) * (1 - staffel(STAFFEL, nRamen))
    const tuimelPrijs = tel[3] * tuimel * (1 - staffel(STAFFEL_TUIMEL, tel[3]))
    const glas = nRamen ? Math.max(minimum, normaal * (1 - korting / 100)) + tuimelPrijs : Math.max(minimum, tuimelPrijs)
    const prijs = n ? glas * 1.21 : 0
    const ff = font?.fontFamily ? font : { fontFamily: "\"Nunito Sans\", \"Avenir Next\", Avenir, system-ui, sans-serif" }
    const FF = ff.fontFamily || "sans-serif"
    const r = Math.max(0, radius)
    const ds = maat / 10
    const S = SOORTEN[cur], TC = S.kleur
    const maatTxt = ds < 0.8 ? "Klein" : ds < 1.3 ? "Normaal" : ds < 1.8 ? "Groot" : "Extra groot"

    const tik = (e: React.MouseEvent<HTMLDivElement>) => {
        const b = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - b.left) / b.width) * 100
        const y = ((e.clientY - b.top) / b.height) * 100
        setDots((l) => [...l.map((d) => (d.nieuw ? { ...d, nieuw: false } : d)), { x, y, t: cur, id: idRef.current++, s: ds, nieuw: true }])
    }

    const NAVY = kleur && kleur !== "#121212" ? kleur : "#252c3c", INK = "#0d121b", RAND = "#e4e7ec", GRIJS = "#6b7380"
    const kop: React.CSSProperties = { fontSize: 9.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: GRIJS }
    const kaart: React.CSSProperties = { background: "#fff", border: "1px solid " + RAND, borderRadius: 16, boxShadow: "0 10px 26px -18px rgba(13,18,27,.45)" }
    const knop: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, height: 44, padding: "0 10px", borderRadius: 13, border: "1px solid " + RAND, background: "#fff", color: INK, font: "700 10.5px " + FF, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 6px 16px -12px rgba(13,18,27,.4)" }
    const pil: React.CSSProperties = { position: "absolute", zIndex: 2, pointerEvents: "none", display: "flex", alignItems: "center", gap: 6, font: "600 11.5px/1 " + FF, color: "#fff", background: "rgba(13,18,27,.55)", backdropFilter: "blur(10px) saturate(1.4)", WebkitBackdropFilter: "blur(10px) saturate(1.4)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 99, whiteSpace: "nowrap", lineHeight: 1 }
    const stip = (k: string, c: string, w: number): React.CSSProperties => ({ width: w, height: w, borderRadius: "50%", background: c, color: "#fff", display: "grid", placeItems: "center", font: "800 " + (k.length > 1 ? w * 0.36 : w * 0.45) + "px/1 " + FF, fontStyle: "normal", border: "1.5px solid #fff", flex: "none" })

    return (
        <div style={{ ...style, ...ff, width: "100%", background: `radial-gradient(600px 300px at 15% -10%, ${rgba(TC, 0.08)}, transparent 60%), linear-gradient(180deg,#f7f8fa,#eef0f3)`, border: props.rand === false ? "none" : "1px solid " + RAND, borderRadius: props.rand === false ? 0 : Math.max(14, r), padding: 14, boxSizing: "border-box", color: INK, display: "flex", flexDirection: "column", gap: 10, transition: "background .4s" }}>
            <style>{`@keyframes rtDrop{0%{transform:scale(2.4);opacity:0}60%{opacity:1}100%{transform:scale(1);opacity:1}}@keyframes rtPuls{0%{box-shadow:0 0 0 0 ${rgba(TC, 0.5)}}100%{box-shadow:0 0 0 10px rgba(0,0,0,0)}}.rt-sl{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:7px;margin:0;border-radius:99px;outline:none;cursor:pointer}.rt-sl::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:2.5px solid var(--c);box-shadow:0 4px 12px -3px rgba(13,18,27,.4)}.rt-sl::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:2.5px solid var(--c)}@media (prefers-reduced-motion:reduce){.rt-dot{animation:none!important}}`}</style>
            <div style={{ ...kaart, display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: NAVY, display: "grid", placeItems: "center", flex: "none", boxShadow: "0 6px 14px -8px rgba(13,18,27,.6)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="#7ee2a8" strokeWidth="3" {...ICON}><path d="M5 12.5l4.2 4.2L19 7" /></svg>
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, color: GRIJS, fontWeight: 600 }}>Uw prijs per beurt</div>
                    <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{euro(prijs)}</div>
                    <div style={{ fontSize: 11, color: GRIJS }}>{n} {n === 1 ? "raam" : "ramen"} · elke 8 weken · incl. btw</div>
                </div>
            </div>
            <div style={{ padding: 4 }}>
                <div onClick={tik} role="img" aria-label={alt + ". Tik om een raam toe te voegen."}
                    style={{ position: "relative", borderRadius: 14, cursor: "crosshair", userSelect: "none", touchAction: "manipulation", lineHeight: 0, background: "#fff", boxShadow: `0 0 0 5px #fff, 0 0 0 6px ${RAND}, 0 24px 44px -24px rgba(13,18,27,.55)` }}>
                    <img src={src} alt="" draggable={false} style={{ width: "100%", display: "block", pointerEvents: "none", borderRadius: 14 }} />
                    <span style={{ ...pil, top: 10, left: 10, padding: "6px 10px", opacity: n ? 1 : 0, transition: "opacity .25s" }}><b style={{ fontWeight: 800, fontSize: 13 }}>{n}</b>{n === 1 ? "raam" : "ramen"} op deze foto</span>
                    <span style={{ ...pil, bottom: 10, left: 10, padding: "4px 11px 4px 4px" }}>
                        <i style={{ ...stip(S.k, TC, 20), boxShadow: "0 0 0 3px " + rgba(TC, 0.35) }}>{S.k}</i>
                        <span style={{ opacity: 0.85 }}>Nu:</span><b style={{ fontWeight: 700 }}>{S.naam}</b>
                    </span>
                    {dots.map((d) => (
                        <button key={d.id} type="button" className="rt-dot" aria-label={"Verwijder stip " + SOORTEN[d.t].naam}
                            onClick={(e) => { e.stopPropagation(); setDots((l) => l.filter((x) => x.id !== d.id)) }}
                            style={{
                                position: "absolute", left: d.x + "%", top: d.y + "%", width: 15 * d.s, height: 15 * d.s, margin: `${-7.5 * d.s}px 0 0 ${-7.5 * d.s}px`,
                                borderRadius: "50%", border: "1.5px solid #fff", background: SOORTEN[d.t].kleur, color: "#fff",
                                font: "800 " + (SOORTEN[d.t].k.length > 1 ? 5.5 * d.s : 7 * d.s) + "px/1 " + FF, display: "grid", placeItems: "center",
                                boxShadow: "0 1px 3px rgba(0,0,0,.45)", cursor: "pointer", padding: 0, animation: d.nieuw ? "rtDrop .5s cubic-bezier(.34,1.56,.64,1)" : "none",
                            }}>
                            {SOORTEN[d.t].k}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ ...kaart, padding: "12px 14px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={kop}>Totaal geteld</span>
                    <b style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{n} {n === 1 ? "raam" : "ramen"}</b>
                </div>
                {n ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))", gap: 7, marginTop: 10 }}>
                        {SOORTEN.map((s, i) => tel[i] ? (
                            <span key={s.k} style={{ position: "relative", display: "flex", flexDirection: "column", padding: "8px 10px 8px 13px", borderRadius: 11, background: `linear-gradient(135deg, ${mix(s.kleur, 7)}, #fff 70%)`, border: "1px solid " + mix(s.kleur, 24), fontSize: 11, fontWeight: 600, color: GRIJS, overflow: "hidden", lineHeight: 1.25 }}>
                                <i style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3.5, borderRadius: "0 4px 4px 0", background: s.kleur }} />
                                <b style={{ fontSize: 19, fontWeight: 800, color: INK, lineHeight: 1.1 }}>{tel[i]}</b>{s.naam}
                            </span>
                        ) : null)}
                    </div>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, padding: "9px 11px", borderRadius: 11, background: "#f6f7f9", border: "1px dashed #d6dae0", fontSize: 12.5, color: GRIJS }}>
                        <i style={{ width: 9, height: 9, borderRadius: "50%", background: TC, flex: "none", animation: "rtPuls 1.8s infinite" }} />Kies hieronder wat u aantikt en tik op de ramen.
                    </div>
                )}
            </div>
            <div style={{ ...kaart, padding: 12 }}>
                <div style={{ ...kop, margin: "0 3px 9px" }}>Ik tik nu aan</div>
                <div role="radiogroup" aria-label="Soort raam" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 7 }}>
                    {SOORTEN.map((s, i) => {
                        const on = i === cur
                        return (
                            <button key={s.k} type="button" role="radio" aria-checked={on} onClick={() => setCur(i)}
                                style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 10px 0 7px", borderRadius: 12, border: "1.5px solid " + (on ? s.kleur : RAND), boxShadow: on ? `0 0 0 3px ${rgba(s.kleur, 0.18)}, 0 8px 18px -12px ${rgba(s.kleur, 0.8)}` : "none", background: on ? mix(s.kleur, 9) : "#fafbfc", color: INK, font: "700 13px " + FF, cursor: "pointer", transition: "all .2s", minWidth: 0 }}>
                                <i style={{ ...stip(s.k, s.kleur, 24), border: "2px solid #fff", boxShadow: "0 0 0 1px " + rgba(s.kleur, 0.4) }}>{s.k}</i>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.naam}</span>
                                {tel[i] ? <b style={{ marginLeft: "auto", minWidth: 20, height: 20, padding: "0 6px", borderRadius: 99, display: "inline-grid", placeItems: "center", font: "800 11px/1 " + FF, color: on ? "#fff" : s.kleur, background: on ? s.kleur : mix(s.kleur, 12) }}>{tel[i]}</b> : null}
                            </button>
                        )
                    })}
                </div>
            </div>
            <div style={{ ...kaart, display: "flex", alignItems: "center", gap: 12, padding: "8px 16px 8px 8px", ["--c" as any]: TC }}>
                <span aria-hidden="true" style={{ flex: "none", position: "relative", width: 50, height: 50, borderRadius: 13, overflow: "hidden", background: "linear-gradient(165deg,#9cc3e6 0%,#c9dcec 46%,#eef1ec 47%,#dfe7d6 100%)", display: "grid", placeItems: "center" }}>
                    <i style={{ position: "absolute", left: 12, top: 10, width: 26, height: 30, borderRadius: 3, background: "linear-gradient(180deg,#5d6a75,#3d4852)", boxShadow: "inset 0 0 0 2px #f4f6f7" }} />
                    <i style={{ ...stip(S.k, TC, 15 * ds * 1.3), position: "relative", boxShadow: "0 1px 4px rgba(0,0,0,.5)", transition: "all .25s cubic-bezier(.34,1.56,.64,1)" }}>{S.k}</i>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <b style={{ fontSize: 13, fontWeight: 700 }}>Grootte bolletje</b>
                        <span style={{ font: "800 10px/1 " + FF, letterSpacing: "0.06em", textTransform: "uppercase", color: TC, background: mix(TC, 12), padding: "5px 9px", borderRadius: 99 }}>{maatTxt}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <i style={{ width: 6, height: 6, borderRadius: "50%", background: "#cfd4da", flex: "none" }} />
                        <input className="rt-sl" type="range" min={5} max={25} value={maat} aria-label="Grootte van het volgende bolletje" onChange={(e) => setMaat(+e.target.value)}
                            style={{ background: `linear-gradient(90deg, ${TC} ${((maat - 5) / 20) * 100}%, #e8ebef ${((maat - 5) / 20) * 100}%)` }} />
                        <i style={{ width: 14, height: 14, borderRadius: "50%", background: "#cfd4da", flex: "none" }} />
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setDots((l) => l.slice(0, -1))} style={{ ...knop, flex: 1 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...ICON}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>Ongedaan
                </button>
                <button type="button" onClick={() => setDots([])} style={{ ...knop, flex: 1 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...ICON}><path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>Alles wissen
                </button>
            </div>
        </div>
    )
}

addPropertyControls(RamenTikken, {
    foto: { type: ControlType.ResponsiveImage, title: "Foto" },
    rand: { type: ControlType.Boolean, title: "Rand", defaultValue: true },
    g0: { type: ControlType.Number, title: "Begane grond", defaultValue: 1.64, min: 0, step: 0.01, unit: "€", description: "Per raam, excl. btw" },
    g1: { type: ControlType.Number, title: "1e verdieping", defaultValue: 1.71, min: 0, step: 0.01, unit: "€" },
    g2: { type: ControlType.Number, title: "2e verdieping", defaultValue: 2.06, min: 0, step: 0.01, unit: "€" },
    tuimel: { type: ControlType.Number, title: "Tuimelraam", defaultValue: 1.83, min: 0, step: 0.01, unit: "€" },
    minimum: { type: ControlType.Number, title: "Minimum", defaultValue: 56.2, min: 0, step: 0.01, unit: "€", description: "Excl. btw, voor de ramen per verdieping" },
    korting: { type: ControlType.Number, title: "Korting 8 wkn", defaultValue: 5, min: -200, max: 100, step: 1, unit: "%" },
    kleur: { type: ControlType.Color, title: "Kleur", defaultValue: "#121212" },
    lijn: { type: ControlType.Color, title: "Lijnen", defaultValue: "#EDEDED" },
    radius: { type: ControlType.Number, title: "Hoeken", defaultValue: 0, min: 0, max: 32 },
    font: { type: ControlType.Font, title: "Lettertype", controls: "basic" },
})
