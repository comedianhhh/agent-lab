import { useEffect, useRef, type ReactNode } from 'react'

/** Arrowheads for SVG edges: grey and ember. */
export function ArrowDefs() {
  return (
    <defs>
      <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="mk" /></marker>
      <marker id="arh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="mk hot" /></marker>
    </defs>
  )
}

/** A dot that travels one SVG path. Remount it (new `key`) to send it again. */
export function Packet({ d, dur = 0.6, r = 5 }: { d: string; dur?: number; r?: number }) {
  return (
    <circle r={r} className="packet">
      <animateMotion dur={`${dur}s`} fill="freeze" path={d} calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
    </circle>
  )
}

export function Toggle({ id, label, checked, onChange }: { id: string; label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ctl" htmlFor={id}>
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function Slider({ id, label, value, min, max, step = 1, unit = '', onChange, width }: {
  id: string; label: ReactNode; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; width?: string
}) {
  return (
    <label className="ctl" htmlFor={id}>
      <span style={width ? { minWidth: width } : undefined}>{label}</span>
      <input type="range" id={id} min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <span className="num">{value}{unit}</span>
    </label>
  )
}

/** Calls `fn` every `ms` while `on`; stops on unmount. */
export function useInterval(fn: () => void, ms: number, on: boolean) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => ref.current(), ms)
    return () => clearInterval(t)
  }, [ms, on])
}

/** requestAnimationFrame clock in seconds since `start` became non-null. */
export function useClock(running: boolean, onFrame: (t: number) => void) {
  const ref = useRef(onFrame)
  ref.current = onFrame
  useEffect(() => {
    if (!running) return
    let raf = 0
    const t0 = performance.now()
    const loop = (now: number) => {
      ref.current((now - t0) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running])
}
