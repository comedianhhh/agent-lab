import { useState } from 'react'
import { motion } from 'motion/react'
import { useMood } from '../mood'
import { Slider, Toggle, useClock } from './kit'

const STAGES = [
  ['eot', '判断说完（VAD + 端点检测）', 500, 100, 1200],
  ['stt', 'STT 出最终文本', 200, 50, 800],
  ['llm', 'LLM 首个 token', 450, 100, 1500],
  ['tts', 'TTS 首段音频', 250, 80, 900],
  ['net', '网络 + 播放缓冲', 150, 20, 600],
] as const
type K = (typeof STAGES)[number][0]
const SCALE = 3000, X0 = 200, XW = 540
const xs = (ms: number) => X0 + (Math.min(ms, SCALE) / SCALE) * XW

export function VoiceLab() {
  const mood = useMood()
  const [v, setV] = useState<Record<K, number>>(Object.fromEntries(STAGES.map(([k, , d]) => [k, d])) as Record<K, number>)
  const [stream, setStream] = useState(true)
  const [filler, setFiller] = useState(false)
  const [s2s, setS2s] = useState(false)

  let segs: [string, string, number][]
  if (s2s) segs = [['eot', '判断说完', v.eot], ['s2s', '端到端模型首段音频', 600], ['net', '网络 + 播放缓冲', v.net]]
  else {
    segs = STAGES.map(([k, l]) => [k, l, v[k]])
    if (!stream) segs.splice(3, 0, ['full', 'LLM 生成完整回复（不流式）', 1200])
  }
  const starts = segs.reduce<number[]>((a, _, i) => [...a, i ? a[i - 1] + segs[i - 1][2] : 0], [])
  const total = segs.reduce((a, s) => a + s[2], 0)

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel">
        <div className="bh"><h3>用户说完 → agent 开口</h3><span className="num">{total} ms</span></div>
        <div className="svgwrap">
          <svg viewBox="0 0 760 250" role="img" aria-label="语音延迟瀑布图">
            {[0, 500, 1000, 1500, 2000, 2500, 3000].map((t) => <g key={t}><line x1={xs(t)} x2={xs(t)} y1={6} y2={206} className="axis" /><text x={xs(t)} y={222} className="tick" textAnchor="middle">{t ? `${t / 1000}s` : '0'}</text></g>)}
            {segs.map(([k, l, ms], i) => {
              const y = 10 + i * 32
              return (
                <g key={k}>
                  <text x={X0 - 8} y={y + 15} className="lbl" textAnchor="end">{l}</text>
                  <motion.rect y={y} height={20} rx={3} initial={false} animate={{ x: xs(starts[i]), width: Math.max(2, xs(starts[i] + ms) - xs(starts[i])) }} transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                    style={{ fill: k === 'full' ? 'var(--bad)' : i % 2 ? 'var(--nav)' : 'var(--ink)' }} />
                  <motion.text y={y + 15} className="tick num" initial={false} animate={{ x: xs(starts[i] + ms) + 6 }}>{ms}ms</motion.text>
                </g>
              )
            })}
            {filler && <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}><rect x={xs(v.eot)} y={190} width={xs(v.eot + 150) - xs(v.eot)} height={10} rx={2} style={{ fill: 'var(--cool)' }} /><text x={xs(v.eot + 150) + 6} y={199} className="tick" style={{ fill: 'var(--cool)' }}>"嗯，我查一下"</text></motion.g>}
            {([[1000, '目标 1s（自己定的）', 'var(--good)'], [2000, '常见水平约 2s', 'var(--warn)']] as const).map(([ms, l, c]) => (
              <g key={ms}><line x1={xs(ms)} x2={xs(ms)} y1={4} y2={206} style={{ stroke: c }} strokeWidth={1.5} strokeDasharray="4 3" /><text x={xs(ms) + 4} y={244} className="tick" style={{ fill: c }}>{l}</text></g>
            ))}
            <motion.line y1={4} y2={206} style={{ stroke: 'var(--ember)' }} strokeWidth={2} initial={false} animate={{ x1: xs(total), x2: xs(total) }} />
          </svg>
        </div>
        <p className="small muted">{filler ? `用户在约 ${v.eot + 150}ms 就听到声音，真正的回答仍在 ${total}ms 到。填充语能掩盖等待，但不能每句都用。` : '瓶颈通常是"判断说完"和"LLM 首个 token"。端点检测太激进会抢话，太保守会慢。默认值是示意，P3 要换成实测的 p50 / p95。'}</p>
      </div>
      <div className="two">
        <div className="col">
          <h3>每一段多久</h3>
          {STAGES.map(([k, l, , min, max]) => <Slider key={k} id={`v-${k}`} label={l} value={v[k]} min={min} max={max} step={10} unit="ms" width="12em" onChange={(n) => { setV({ ...v, [k]: n }); mood('thinking') }} />)}
        </div>
        <div className="col">
          <h3>架构选择</h3>
          <Toggle id="v-stream" label="LLM 流式输出，首句就送进 TTS" checked={stream} onChange={setStream} />
          <Toggle id="v-filler" label="先说一句填充语" checked={filler} onChange={setFiller} />
          <Toggle id="v-s2s" label="换成 speech-to-speech（如 OpenAI Realtime）" checked={s2s} onChange={setS2s} />
          <p className="small muted">级联方案每一段都能观测、能换供应商，工具调用更稳，所以生产上用得多；speech-to-speech 少几跳，但中间过程看不见。</p>
        </div>
      </div>
      <BargeIn />
    </div>
  )
}

const SPEAK = 4
const bx = (s: number) => 50 + (s / SPEAK) * 690

function BargeIn() {
  const mood = useMood()
  const [now, setNow] = useState(0)
  const [running, setRunning] = useState(false)
  const [cut, setCut] = useState<number | null>(null)
  const [det, setDet] = useState(200)
  useClock(running, (t) => { if (t >= SPEAK) { setNow(SPEAK); setRunning(false) } else setNow(t) })
  const stop = cut != null ? Math.min(SPEAK, cut + det / 1000) : SPEAK
  return (
    <div className="col">
      <h3>打断（barge-in）</h3>
      <p className="small muted">点"播放"，agent 开始说话；中途点"我要插话"。重叠多久取决于多快检测到用户开口。最简单的做法是 TTS 播放时锁麦克风；P3 要做成能打断。</p>
      <div className="panel">
        <div className="svgwrap">
          <svg viewBox="0 0 760 120" role="img" aria-label="打断时间线">
            <text x={0} y={30} className="lbl">agent</text>
            <text x={0} y={80} className="lbl">用户</text>
            <rect x={bx(0)} y={16} width={bx(SPEAK) - bx(0)} height={20} rx={3} style={{ fill: 'var(--surface)', stroke: 'var(--rule)' }} />
            <rect x={bx(0)} y={16} width={Math.max(0, bx(Math.min(now, stop)) - bx(0))} height={20} rx={3} style={{ fill: 'var(--ink)' }} />
            {cut != null && <rect x={bx(cut)} y={66} width={Math.max(0, bx(Math.min(now, SPEAK)) - bx(cut))} height={20} rx={3} style={{ fill: 'var(--cool)' }} />}
            {cut != null && now >= stop && (
              <g><rect x={bx(cut)} y={40} width={bx(stop) - bx(cut)} height={22} style={{ fill: 'var(--bad-soft)' }} /><text x={bx(stop) + 6} y={56} className="tick" style={{ fill: 'var(--bad)' }}>重叠 {det}ms：停掉 TTS，丢掉没播的音频，记下播到哪一句</text></g>
            )}
            <line x1={bx(now)} x2={bx(now)} y1={8} y2={96} style={{ stroke: 'var(--ember)' }} strokeWidth={1.5} />
            <text x={bx(0)} y={112} className="tick">0s</text><text x={bx(SPEAK)} y={112} className="tick" textAnchor="end">4s</text>
          </svg>
        </div>
        <div className="row">
          <button className="btn" onClick={() => { setCut(null); setNow(0); setRunning(true) }}>播放</button>
          <button className="btn quiet" onClick={() => { if (running && cut == null) { setCut(Math.min(SPEAK - 0.3, now)); mood('needs-input') } }}>我要插话</button>
          <Slider id="v-det" label="检测到开口要多久" value={det} min={50} max={800} step={10} unit="ms" onChange={setDet} />
        </div>
      </div>
    </div>
  )
}
