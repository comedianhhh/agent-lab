import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LESSONS, practiceIds } from '../data/lessons'
import { PROJECTS, weekIds } from '../data/plan'
import { share, useProgress } from '../progress'
import { lessonHref } from '../route'
import { Glyph } from './Glyph'

const W0 = 120
const WW = 52
const ease = [0.2, 0.7, 0.2, 1] as const

export function Home() {
  const progress = useProgress()
  const [sel, setSel] = useState('p1')
  const [hover, setHover] = useState<string | null>(null)
  const p = PROJECTS.find((x) => x.id === sel)!
  const weekPct = share(progress, weekIds())

  return (
    <div className="stack">
      <section className="lede">
        <p className="kicker">12 周 · 5 个项目 · 12 节课</p>
        <h1>从项目里学 agent 工程</h1>
        <p className="big">方向是实时语音 agent。每节课有概念、一个可以动手玩的动画实验、核对过的学习资料，和要做的事。</p>
        <p className="small"><a href="#/map">先看技能地图：27 项 agent 技能、你现在在哪、每个目标岗位要走哪条路 →</a></p>
      </section>

      <section className="stack" style={{ gap: 14 }}>
        <div className="bh"><h2>12 周怎么走</h2><span className="kicker">点项目，翻开它的牌</span></div>
        <div className="panel">
          <div className="svgwrap">
            <svg viewBox="0 0 760 240" role="img" aria-label="12 周项目甘特图">
              {Array.from({ length: 12 }, (_, i) => (
                <g key={i}>
                  <line x1={W0 + i * WW} x2={W0 + i * WW} y1={18} y2={228} className="axis" />
                  <text x={W0 + i * WW + WW / 2} y={12} className="tick" textAnchor="middle">W{i + 1}</text>
                </g>
              ))}
              <text x={0} y={42} className="lbl">项目</text>
              {PROJECTS.map((pj, i) => {
                const x = W0 + (pj.weeks[0] - 1) * WW + 3
                const w = (pj.weeks[1] - pj.weeks[0] + 1) * WW - 6
                const y = 26 + (i % 2) * 44
                const on = pj.id === sel
                const pct = pj.id === 'p1' ? weekPct * 0.5 : 0
                return (
                  <g key={pj.id} role="button" tabIndex={0} aria-pressed={on} aria-label={pj.name} style={{ cursor: 'pointer' }}
                    onClick={() => setSel(pj.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(pj.id) } }}>
                    <motion.rect x={x} y={y} height={34} rx={6} initial={{ width: 0 }} animate={{ width: w }} transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease }}
                      style={{ fill: on ? 'var(--ink)' : 'var(--bg)', stroke: on ? 'var(--ink)' : 'var(--nav)', transition: 'fill .25s' }} />
                    {pct > 0 && <rect x={x} y={y + 31} width={w * pct} height={3} style={{ fill: 'var(--ember)' }} />}
                    <motion.text x={x + 10} y={y + 22} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.12 }}
                      style={{ fill: on ? 'var(--bg)' : 'var(--ink)', fontSize: 12 }}>{pj.id.toUpperCase()} {pj.short}</motion.text>
                  </g>
                )
              })}
              {PROJECTS.slice(0, -1).map((pj, i) => {
                const n = PROJECTS[i + 1]
                const x = W0 + pj.weeks[1] * WW - 3, y = 26 + (i % 2) * 44 + 17
                const nx = W0 + (n.weeks[0] - 1) * WW + 3, ny = 26 + ((i + 1) % 2) * 44 + 17
                return <motion.path key={pj.id} className="edge" d={`M${x} ${y} C${x + 14} ${y} ${nx - 14} ${ny} ${nx} ${ny}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8 + i * 0.12, duration: 0.4 }} />
              })}
              {([['每天 · Python', 130, 'var(--rule)', '手写 45 分钟，关掉 AI：练结对编程轮'], ['每天 · 英文', 162, 'var(--rule)', '讲一个 STAR 故事 15 分钟：录音 → 回听 → 每次改一处'], ['并行 · AI trainer', 194, 'var(--cool-soft)', '评估 AI 写的代码，顺便练 eval 判断力']] as const).map(([label, y, fill, note], b) => (
                <g key={b}>
                  <text x={0} y={y + 17} className="lbl">{label}</text>
                  {Array.from({ length: 12 }, (_, w) => (
                    <motion.rect key={w} x={W0 + w * WW + 3} y={y + 4} width={WW - 6} height={18} rx={9} style={{ fill, opacity: 0.55 }}
                      initial={{ scaleX: 0.3 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9 + b * 0.1 + w * 0.03 }} />
                  ))}
                  <text x={W0 + 10} y={y + 17} className="lbl">{note}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* the chosen project as a tarot card that turns over when the selection changes */}
        <div style={{ perspective: 1100 }}>
          <AnimatePresence mode="wait">
            <motion.div key={p.id} className="tarot" initial={{ rotateY: -90, opacity: 0.4 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0.4 }} transition={{ duration: 0.32, ease }}>
              <span className="kicker">{p.id.toUpperCase()} · 第 {p.weeks[0]}–{p.weeks[1]} 周</span>
              <h3>{p.name}</h3>
              <p style={{ position: 'relative' }}>{p.goal}</p>
              <p style={{ position: 'relative', opacity: 0.8 }} className="small">产出：{p.out} · 投这些：{p.jd}</p>
              {p.lessons.length > 0 && (
                <div className="row" style={{ position: 'relative' }}>
                  {p.lessons.map((id) => {
                    const l = LESSONS.find((x) => x.id === id)!
                    return <a key={id} href={lessonHref(id)} className="chip" style={{ color: 'var(--bg)', border: '1px solid var(--bg)', textDecoration: 'none' }}>{l.title} →</a>
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="stack" style={{ gap: 14 }}>
        <div className="bh"><h2>课程</h2><span className="kicker">每节课：概念 · 动画实验 · 资料 · 动手</span></div>
        <div className="deck">
          {LESSONS.map((l, i) => {
            const pct = share(progress, practiceIds(l))
            return (
              <motion.a key={l.id} href={lessonHref(l.id)} className="lcard" onMouseEnter={() => setHover(l.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(l.id)} onBlur={() => setHover(null)}
                initial={{ opacity: 0, y: 14, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.05 * i, duration: 0.45, ease }} whileHover={{ y: -6 }}>
                <div className="face">
                  <span className="n">{String(l.n).padStart(2, '0')} · {l.en}</span>
                  <span className="glyph"><Glyph lab={l.lab} on={hover === l.id} /></span>
                  <span className="t">{l.title}</span>
                  {pct > 0 && <span className="pbar"><i style={{ width: `${pct * 100}%` }} /></span>}
                </div>
                <span className="meta"><span>{l.when}</span>{pct === 1 ? <span className="done">完成</span> : <span>{l.project}</span>}</span>
              </motion.a>
            )
          })}
        </div>
      </section>
    </div>
  )
}
