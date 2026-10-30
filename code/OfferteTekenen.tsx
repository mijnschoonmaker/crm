import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

type Dienst = { naam: string; uitleg: string; prijs: string }
type Img = { src?: string; alt?: string } | string | undefined

interface Props {
    klant: string
    adres: string
    nummer: string
    geldig: string
    diensten: Dienst[]
    logo?: Img
    merk?: Img
    bedrijf: string
    style?: React.CSSProperties
}

const STANDAARD: Dienst[] = [
    { naam: "Glasbewassing", uitleg: "14 ramen · elke 8 weken", prijs: "€ 54,68" },
    { naam: "Dakramen", uitleg: "3 tuimelramen · elke 8 weken", prijs: "€ 13,32" },
]

const GB = "#252c3c", GB_DEEP = "#1a2030", GB_LIFT = "#323b50"
const INK = "#0d121b", MUTED = "#646b7a", LINE = "#e2e5ea", PAPER = "#f4f5f7"
const BODY = '"Nunito Sans","Avenir Next","Avenir","Segoe UI",system-ui,sans-serif'
const DISPLAY = '"Avenir Next","Avenir","Nunito Sans","Segoe UI",system-ui,sans-serif'
const src = (i: Img) => (typeof i === "string" ? i : i?.src) || ""

/* de halve uitsparingen links en rechts bij de perforatie */
const maskTop = "radial-gradient(circle 13px at 0 100%,#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 98%,#000) right/51% 100% no-repeat"
const maskStub = "radial-gradient(circle 13px at 0 0,#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 0,#0000 98%,#000) right/51% 100% no-repeat"

/**
 * Voorbeeldofferte (ticket) waarop bezoekers met vinger of muis hun handtekening zetten.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 520
 */
export default function OfferteTekenen(props: Props) {
    const { klant = "Sanne de Vries", adres = "Lindenlaan 14", nummer = "OFF-2026-014", geldig = "19 nov 2026", bedrijf = "", style } = props
    const diensten = props.diensten && props.diensten.length ? props.diensten : STANDAARD
    const logo = src(props.logo) || "https://app.mansard.nl/site/logo-wit.png"
    const merk = src(props.merk) || "https://app.mansard.nl/site/mansard.png"

    const cv = useRef<HTMLCanvasElement>(null)
    const tekent = useRef(false)
    const vorige = useRef<[number, number] | null>(null)
    const heeftRef = useRef(false)
    const [heeft, setHeeft] = useState(false)
    const [akkoord, setAkkoord] = useState(false)
    const [klaar, setKlaar] = useState(false)
    const [smal, setSmal] = useState(false)
    const doos = useRef<HTMLDivElement>(null)
    heeftRef.current = heeft

    const maat = () => {
        const c = cv.current
        if (!c) return
        const b = c.getBoundingClientRect()
        const dpr = Math.max(1, window.devicePixelRatio || 1)
        c.width = Math.max(1, b.width * dpr)
        c.height = Math.max(1, b.height * dpr)
        const ctx = c.getContext("2d")
        if (!ctx) return
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.lineWidth = 2.2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = GB_DEEP
    }
    useEffect(() => {
        const meet = () => {
            if (doos.current) setSmal(doos.current.getBoundingClientRect().width < 440)
            if (!heeftRef.current) maat()
        }
        meet()
        window.addEventListener("resize", meet)
        return () => window.removeEventListener("resize", meet)
    }, [klaar])

    const punt = (e: React.PointerEvent): [number, number] => {
        const b = cv.current!.getBoundingClientRect()
        return [e.clientX - b.left, e.clientY - b.top]
    }
    const neer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        tekent.current = true
        vorige.current = punt(e)
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    const beweeg = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!tekent.current || !vorige.current) return
        const ctx = cv.current?.getContext("2d")
        if (!ctx) return
        const p = punt(e), l = vorige.current
        ctx.beginPath()
        ctx.moveTo(l[0], l[1])
        ctx.quadraticCurveTo(l[0], l[1], (l[0] + p[0]) / 2, (l[1] + p[1]) / 2)
        ctx.lineTo(p[0], p[1])
        ctx.stroke()
        vorige.current = p
        if (!heeft) setHeeft(true)
    }
    const op = () => { tekent.current = false }
    const wis = () => {
        const c = cv.current
        c?.getContext("2d")?.clearRect(0, 0, c.width, c.height)
        setHeeft(false)
    }

    const px = smal ? 18 : 26
    const lbl: React.CSSProperties = { fontFamily: DISPLAY, fontSize: smal ? 8.5 : 9.5, letterSpacing: smal ? "0.12em" : "0.18em", textTransform: "uppercase", color: MUTED, display: "block" }
    const kan = heeft && akkoord
    const door = (
        <div style={{ textAlign: "center", marginTop: 18, opacity: 0.55 }}>
            <small style={{ display: "block", fontFamily: DISPLAY, fontSize: 8.5, letterSpacing: "0.2em", textTransform: "uppercase", color: INK }}>Deze service wordt mogelijk gemaakt door</small>
            <img src={merk} alt="Mansard" style={{ height: 10, width: "auto", margin: "7px auto 0", display: "block", filter: "invert(1)" }} />
        </div>
    )

    return (
        <div ref={doos} style={{ ...style, width: "100%", fontFamily: BODY, color: INK, filter: "drop-shadow(0 40px 50px rgba(26,32,48,.22))", WebkitFontSmoothing: "antialiased" }}>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&display=swap" />
            <div style={{ background: "#fff", borderRadius: "22px 22px 0 0", overflow: "hidden", WebkitMask: maskTop, mask: maskTop } as any}>
                <div style={{ background: `linear-gradient(150deg,${GB_LIFT},${GB} 60%,${GB_DEEP})`, padding: 26, display: "grid", placeItems: "center", position: "relative" }}>
                    <img src={logo} alt={bedrijf || "Logo"} style={{ width: 46, height: 46, display: "block", objectFit: "contain" }} />
                    <span style={{ position: "absolute", right: 18, top: 18, fontFamily: DISPLAY, fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "#fff", border: "1px solid rgba(255,255,255,.3)", padding: "5px 10px", borderRadius: 99 }}>
                        Probeer het
                    </span>
                </div>
                <div style={{ padding: `24px ${px}px 26px` }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>{klant}</div>
                    <div style={{ color: MUTED, fontSize: 14 }}>{adres}</div>
                    <div style={{ display: "grid", gridTemplateColumns: smal ? "1.3fr 1.1fr .7fr" : "repeat(3,minmax(0,1fr))", gap: smal ? 6 : 10, marginTop: 20 }}>
                        {[["Offerte", nummer], ["Geldig tot", geldig], ["Diensten", String(diensten.length)]].map(([l, w]) => (
                            <div key={l} style={{ background: PAPER, borderRadius: 12, padding: smal ? "9px 9px" : "10px 12px", minWidth: 0 }}>
                                <span style={lbl}>{l}</span>
                                <b style={{ display: "block", fontSize: smal ? 12.5 : 14, fontWeight: 700, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w}</b>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ height: 0, position: "relative", zIndex: 1 }}>
                <div style={{ position: "absolute", left: 26, right: 26, top: -1, borderTop: "2px dashed #d5d9e0" }} />
            </div>

            <div style={{ background: "#fff", borderRadius: "0 0 22px 22px", padding: `20px ${px}px 26px`, WebkitMask: maskStub, mask: maskStub } as any}>
                {klaar ? (
                    <div style={{ textAlign: "center", padding: "18px 6px 6px" }}>
                        <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#e6f4ec", color: "#2f7a52", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                        </div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 17, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}>Uw akkoord is ontvangen</div>
                        <p style={{ color: MUTED, fontSize: 14, margin: "10px 0 0", lineHeight: 1.6 }}>
                            U ontvangt het definitieve bestellingsoverzicht per e-mail. Binnen 2 tot 8 weken volgt een planningsmail; wij zoeken de meest efficiënte route.
                        </p>
                        <button type="button" onClick={() => { setKlaar(false); setHeeft(false); setAkkoord(false) }} style={{ ...lbl, display: "inline-block", background: "none", border: 0, cursor: "pointer", marginTop: 14 }}>
                            Nog een keer proberen
                        </button>
                        {door}
                    </div>
                ) : (
                    <>
                        {diensten.map((d, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < diensten.length - 1 ? `1px solid ${LINE}` : "0" }}>
                                <div>
                                    <b style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{d.naam}</b>
                                    <small style={{ color: MUTED, fontSize: 12.5 }}>{d.uitleg}</small>
                                </div>
                                <div style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                                    {d.prijs}
                                    <small style={{ display: "block", fontWeight: 400, fontSize: 10.5, letterSpacing: "0.06em", color: MUTED }}>incl. btw</small>
                                </div>
                            </div>
                        ))}

                        <div style={{ marginTop: 14, border: "1px dashed #c9ced7", borderRadius: 14, position: "relative", background: PAPER }}>
                            <canvas
                                ref={cv}
                                aria-label="Handtekeningveld: teken met uw vinger of muis"
                                onPointerDown={neer}
                                onPointerMove={beweeg}
                                onPointerUp={op}
                                onPointerCancel={op}
                                onPointerLeave={op}
                                style={{ display: "block", width: "100%", height: 130, touchAction: "none", cursor: "crosshair", borderRadius: 14 }}
                            />
                            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", color: "#a2a8b3", fontFamily: DISPLAY, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", textAlign: "center", opacity: heeft ? 0 : 1, transition: "opacity .2s" }}>
                                <div>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 6px" }}><path d="M4 17c3-1 4-6 7-6s2 5 5 5 3-3 4-4" /><path d="M3 21h18" /></svg>
                                    Teken hier uw handtekening
                                </div>
                            </div>
                            {heeft && (
                                <button type="button" onClick={wis} style={{ position: "absolute", right: 8, top: 8, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 11, padding: "4px 9px", cursor: "pointer", color: MUTED, fontFamily: BODY }}>
                                    Wissen
                                </button>
                            )}
                        </div>

                        <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "16px 0", fontSize: 13.5, color: MUTED, cursor: "pointer" }}>
                            <input type="checkbox" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} style={{ width: 18, height: 18, accentColor: GB, flex: "none", margin: 0 }} />
                            Ik ga akkoord met de offerte en de voorwaarden
                        </label>
                        <p style={{ margin: "-6px 0 12px", fontSize: 11, color: MUTED, textAlign: "center" }}>Voorbeeld: deze offerte is niet echt en er wordt niets opgeslagen.</p>
                        <button
                            type="button"
                            disabled={!kan}
                            onClick={() => setKlaar(true)}
                            style={{
                                width: "100%", height: 48, border: `1px solid ${GB}`, borderRadius: 6, background: GB, color: "#fff",
                                fontFamily: '"Nunito Sans", system-ui, sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
                                boxShadow: "0 14px 30px -18px rgba(26,32,48,.9)", cursor: kan ? "pointer" : "not-allowed", opacity: kan ? 1 : 0.45, transition: "opacity .2s",
                            }}
                        >
                            Akkoord geven
                        </button>
                        {door}
                    </>
                )}
            </div>
        </div>
    )
}

addPropertyControls(OfferteTekenen, {
    klant: { type: ControlType.String, title: "Klant", defaultValue: "Sanne de Vries" },
    adres: { type: ControlType.String, title: "Adres", defaultValue: "Lindenlaan 14" },
    nummer: { type: ControlType.String, title: "Offerte", defaultValue: "OFF-2026-014" },
    geldig: { type: ControlType.String, title: "Geldig tot", defaultValue: "19 nov 2026" },
    diensten: {
        type: ControlType.Array,
        title: "Diensten",
        control: {
            type: ControlType.Object,
            controls: {
                naam: { type: ControlType.String, title: "Dienst", defaultValue: "Glasbewassing" },
                uitleg: { type: ControlType.String, title: "Uitleg", defaultValue: "elke 8 weken" },
                prijs: { type: ControlType.String, title: "Prijs", defaultValue: "€ 40,00" },
            },
        },
        defaultValue: STANDAARD,
    },
    logo: { type: ControlType.ResponsiveImage, title: "Logo" },
    merk: { type: ControlType.ResponsiveImage, title: "Mansard-logo" },
    bedrijf: { type: ControlType.String, title: "Bedrijfsnaam", defaultValue: "Voorbeeld Glazenwasserij" },
})
