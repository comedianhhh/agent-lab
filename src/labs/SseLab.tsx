import { useMemo, useState } from 'react'
import { useMood } from '../mood'
import { Slider, useClock } from './kit'

/** Server events (seconds) over a 10 s run; each lane computes when the client actually sees them. */
const EVENTS = [0.7, 1.9, 2.2, 4.8, 6.1, 6.3, 8.4]
const T = 10
const RTT = 0.1

interface Lane { name: string; sub: string; deliver: number[]; requests: number[]; note: string }

function lanes(poll: number): Lane[] {
  // polling: the client asks every `poll` seconds; an event waits for the next ask
  const asks = Array.from({ length: Math.floor(T / poll) }, (_, i) => (i + 1) * poll)
  const pollD = EVENTS.map((e) => (asks.find((a) => a >= e) ?? T + 1) + RTT)
  // long polling: a request is held open; the reply carries the event, then the client reconnects
  const lpD: number[] = []
  const lpReq = [0]
  let open = 0
  for (const e of EVENTS) {
    const at = Math.max(e, open)
    lpD.push(at + RTT / 2)
    open = at + RTT
    lpReq.push(open)
  }
  return [
    { name: '轮询', sub: `每 ${poll}s 问一次`, deliver: pollD, requests: asks, note: '请求多，大部分是空的；平均延迟约半个间隔' },
    { name: '长轮询', sub: '有消息才回，回完再连', deliver: lpD, requests: lpReq, note: '延迟低，但每条消息都要重新建一次请求' },
    { name: 'SSE', sub: '一条连接，服务器单向推', deliver: EVENTS.map((e) => e + RTT / 2), requests: [0], note: '一条 HTTP 连接；断线自动重连（Last-Event-ID）' },
    { name: 'WebSocket', sub: '一条连接，双向', deliver: EVENTS.map((e) => e + RTT / 2), requests: [0], note: '双向；适合语音、协作这类两边都频繁发的场景' },
  ]
}

const X0 = 130, XW = 600
const x = (t: number) => X0 + (Math.min(t, T) / T) * XW

export function SseLab() {
  const mood = useMood()
  const [poll, setPoll] = useState(1.5)
  const [now, setNow] = useState(T)
  const [running, setRunning] = useState(false)
  const L = useMemo(() => lanes(poll), [poll])
  useClock(running, (t) => {
    const s = t * 1.4
    if (s >= T) { setNow(T); setRunning(false); mood('done') } else setNow(s)
  })
  const play = () => { setNow(0); setRunning(true); mood('working') }

  return (
    <div className="panel">
      <div className="svgwrap">
        <svg viewBox="0 0 760 330" role="img" aria-label="四种实时推送方式的时间线">
          {[0, 2, 4, 6, 8, 10].map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1={24} y2={312} className="axis" /><text x={x(t)} y={326} className="tick" textAnchor="middle">{t}s</text></g>)}
          <text x={0} y={18} className="lbl">服务器产生消息</text>
          {EVENTS.map((e, i) => <g key={i} opacity={now >= e ? 1 : 0.25}><line x1={x(e)} x2={x(e)} y1={10} y2={22} style={{ stroke: 'var(--ink)' }} strokeWidth={2} /></g>)}
          {L.map((l, li) => {
            const y = 40 + li * 70
            const seen = l.deliver.filter((d) => d <= now)
            const lag = seen.length ? seen.reduce((a, d, i) => a + d - EVENTS[i], 0) / seen.length : 0
            return (
              <g key={l.name}>
                <text x={0} y={y + 20} className="lbl" style={{ fontWeight: 600 }}>{l.name}</text>
                <text x={0} y={y + 36} className="tick">{l.sub}</text>
                <line x1={X0} x2={X0 + XW} y1={y + 30} y2={y + 30} className="axis" />
                {l.requests.filter((r) => r <= now).map((r, i) => <rect key={`r${i}`} x={x(r) - 1.5} y={y + 34} width={3} height={8} style={{ fill: 'var(--nav)' }} />)}
                {l.deliver.map((d, i) => {
                  const e = EVENTS[i]
                  if (now < e) return null
                  const arrived = now >= d
                  const tx = arrived ? x(d) : x(Math.min(now, d))
                  return (
                    <g key={i}>
                      <line x1={x(e)} y1={y + 6} x2={tx} y2={arrived ? y + 30 : y + 6 + ((Math.min(now, d) - e) / Math.max(d - e, 0.01)) * 24} style={{ stroke: arrived ? 'var(--ember)' : 'var(--rule)' }} strokeWidth={1.4} />
                      <circle cx={tx} cy={arrived ? y + 30 : y + 6} r={arrived ? 4.5 : 3} className="packet" opacity={arrived ? 1 : 0.5} />
                    </g>
                  )
                })}
                <text x={X0 + XW} y={y + 56} className="tick num" textAnchor="end">平均延迟 {lag.toFixed(2)}s · 请求 {l.requests.filter((r) => r <= now).length} 次</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="row">
        <button className="btn" onClick={play} disabled={running}>播放 10 秒</button>
        <Slider id="sse-poll" label="轮询间隔" value={poll} min={0.5} max={3} step={0.5} unit="s" onChange={(v) => { setPoll(v); setNow(T) }} />
      </div>
      <ul className="small muted" style={{ margin: 0, paddingLeft: '1.1em' }}>
        {L.map((l) => <li key={l.name}><b>{l.name}</b>：{l.note}</li>)}
      </ul>
      <p className="small muted">agent 的进度和 LLM 的 token 只需要服务器往外推，用 SSE 最省事；语音这种双向实时流才需要 WebSocket（或 WebRTC）。网络往返按 0.1s 算，是示意。</p>
    </div>
  )
}
