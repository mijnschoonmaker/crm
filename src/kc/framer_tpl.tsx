// Prijscalculator glasbewassing — Framer code component (gemaakt door Zeem)
// Plaatsen: Assets › Code › + › New component › alles vervangen door dit bestand › Save.
// Sleep "PrijsCalculator" op je pagina en zet Width op Fill (1fr) en Height op Fit.
import { useEffect, useRef, useState } from "react"

const HTML = __HTML__

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 1200
 */
export default function PrijsCalculator(props) {
    const ref = useRef<HTMLIFrameElement>(null)
    const [h, setH] = useState(1200)
    const [full, setFull] = useState(false)
    useEffect(() => {
        const on = (e: MessageEvent) => {
            if (!ref.current || e.source !== ref.current.contentWindow || !e.data) return
            if (e.data.type === "zeem-calc-height") setH(e.data.h)
            if (e.data.type === "zeem-calc-full") setFull(!!e.data.on)
        }
        window.addEventListener("message", on)
        return () => window.removeEventListener("message", on)
    }, [])
    const box: any = full
        ? { position: "fixed", inset: 0, width: "100vw", height: "100dvh", zIndex: 2147483647 }
        : { width: "100%", height: h }
    return (
        <div style={{ ...props.style, width: "100%", height: h, position: "relative" }}>
            <iframe
                ref={ref}
                data-zeem="1"
                srcDoc={HTML}
                title="Prijscalculator glasbewassing"
                allow="camera; web-share; clipboard-write"
                style={{ ...box, border: 0, display: "block", background: "transparent" }}
            />
        </div>
    )
}
