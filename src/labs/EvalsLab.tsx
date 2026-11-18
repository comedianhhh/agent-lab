import { useState } from 'react'
import { motion } from 'motion/react'
import { useMood } from '../mood'

/** 30 regression cases. Each round lists which cases pass afterwards; numbers are illustrative. */
const pass = (n: number, broken: number[] = []) => new Set(Array.from({ length: n + broken.length }, (_, i) => i).filter((i) => !broken.includes(i)))
const ROUNDS: { fix: string; pass: Set<number>; note: string }[] = [
  { fix: '基线：只有 prompt', pass: pass(18), note: '读 trace，把 12 个失败分类：参数错 4、上下文爆 3、编造日期 3、限流 2。' },
  { fix: '加 strict schema + repair retry', pass: pass(22), note: '参数错的 4 个全过了。' },
  { fix: '大块工具输出写文件', pass: pass(25), note: '上下文爆掉的 3 个过了。' },
  { fix: '结束前加确定性自检', pass: pass(26, [3, 7]), note: '编造日期的修好了，但 #4 #8 回归：自检太严，把正确回答也拦下了。这就是要跑全部用例的原因。' },
  { fix: '放宽自检规则', pass: pass(28), note: '回归修复。' },
  { fix: '429 退避重试', pass: pass(30), note: '全部通过。下一步：从新的线上 trace 里补用例。' },
]

export function EvalsLab() {
  const mood = useMood()
  const [it, setIt] = useState(0)
  const r = ROUNDS[it]
  const prev = it > 0 ? ROUNDS[it - 1].pass : null
  const pts = ROUNDS.slice(0, it + 1).map((x, i) => [60 + i * 100, 120 - (x.pass.size / 30) * 100] as const)
  const go = (n: number) => {
    setIt(n)
    const p = ROUNDS[n - 1]?.pass
    mood(p && [...p].some((i) => !ROUNDS[n].pass.has(i)) ? 'error' : n === ROUNDS.length - 1 ? 'done' : 'working')
  }
  return (
    <div className="panel">
      <div className="bh"><h3>30 个回归用例</h3><span className="chip warn">示意数字</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gap: 6, maxWidth: 520 }}>
        {Array.from({ length: 30 }, (_, i) => {
          const ok = r.pass.has(i)
          const flipped = prev && prev.has(i) !== ok
          return (
            <motion.div key={i} title={`#${i + 1}`} animate={{ backgroundColor: ok ? 'var(--good)' : 'var(--bad)', scale: flipped ? [1, 1.35, 1] : 1, rotateY: flipped ? [0, 180, 360] : 0 }}
              transition={{ duration: 0.5, delay: flipped ? (i % 15) * 0.02 : 0 }} style={{ aspectRatio: '1', borderRadius: 4, opacity: 0.85 }} />
          )
        })}
      </div>
      <div className="svgwrap">
        <svg viewBox="0 0 600 150" role="img" aria-label="每一轮的通过数">
          {[0, 10, 20, 30].map((t) => {
            const y = 120 - (t / 30) * 100
            return <g key={t}><line x1={40} x2={590} y1={y} y2={y} className="axis" /><text x={32} y={y + 4} className="tick" textAnchor="end">{t}</text></g>
          })}
          <motion.polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" style={{ stroke: 'var(--ink)' }} strokeWidth={2} initial={false} animate={{ points: pts.map((p) => p.join(',')).join(' ') }} />
          {pts.map(([x, y], i) => (
            <g key={i}>
              <motion.circle cx={x} cy={y} r={i === it ? 5 : 3.5} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fill: i === it ? 'var(--ember)' : 'var(--ink)' }} />
              <text x={x} y={y - 10} className="tick num" textAnchor="middle">{ROUNDS[i].pass.size}/30</text>
              <text x={x} y={142} className="tick" textAnchor="middle">第 {i} 轮</text>
            </g>
          ))}
        </svg>
      </div>
      <p><b>{r.fix}</b> <span className="muted small">{r.note}</span></p>
      <div className="row">
        <button className="btn" onClick={() => go(it + 1)} disabled={it >= ROUNDS.length - 1}>改 harness → 重跑全部用例</button>
        <button className="btn quiet" onClick={() => setIt(0)}>重来</button>
      </div>
    </div>
  )
}
