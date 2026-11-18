import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LESSONS } from '../data/lessons'
import { EVIDENCE_LABEL, GOALS, NODES, STATUS, TIERS, type SkillNode, type Status } from '../data/skillmap'
import { useMood } from '../mood'
import { setDone, useProgress } from '../progress'
import { lessonHref } from '../route'

const X0 = 16, TX = 158, W = 138, H = 32, Y0 = 50, RY = 52
const pos = (n: SkillNode) => [X0 + n.tier * TX, Y0 + n.row * RY] as const
const BY = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, SkillNode>
const EDGES = NODES.flatMap((n) => n.deps.map((d) => [d, n.id] as const))
const edgePath = (a: string, b: string) => {
  const [x1, y1] = pos(BY[a]), [x2, y2] = pos(BY[b])
  const sx = x1 + W, sy = y1 + H / 2, ex = x2, ey = y2 + H / 2
  if (BY[a].tier === BY[b].tier) return `M${x1 + W / 2} ${y1 + H} V${y2}` // same tier: straight down
  return `M${sx} ${sy} C${sx + 30} ${sy} ${ex - 30} ${ey} ${ex} ${ey}`
}
const walk = (id: string, next: (n: string) => string[]) => {
  const seen = new Set<string>()
  const go = (x: string) => next(x).forEach((y) => { if (!seen.has(y)) { seen.add(y); go(y) } })
  go(id)
  return seen
}
const ancestors = (id: string) => walk(id, (x) => BY[x].deps)
const descendants = (id: string) => walk(id, (x) => NODES.filter((n) => n.deps.includes(x)).map((n) => n.id))
const TONE: Record<Status, string> = { have: 'var(--good)', thin: 'var(--warn)', learn: 'var(--cool)', later: 'var(--nav)' }

export function SkillMap() {
  const mood = useMood()
  const progress = useProgress()
  const [goal, setGoal] = useState<string | null>('voice')
  const [hover, setHover] = useState<string | null>(null)
  const [sel, setSel] = useState('voice')
  const statusOf = (n: SkillNode): Status => (progress[`map-${n.id}`] ? 'have' : n.status)

  // a goal always includes every prerequisite of its nodes
  const goalSet = useMemo(() => {
    const g = GOALS.find((x) => x.id === goal)
    if (!g) return null
    const s = new Set(g.nodes)
    g.nodes.forEach((id) => ancestors(id).forEach((a) => s.add(a)))
    return s
  }, [goal])
  const chain = useMemo(() => (hover ? new Set([hover, ...ancestors(hover), ...descendants(hover)]) : null), [hover])
  const lit = (id: string) => (chain ? chain.has(id) : goalSet ? goalSet.has(id) : true)

  const inGoal = goalSet ? NODES.filter((n) => goalSet.has(n.id)) : NODES
  const count = (s: Status) => inGoal.filter((n) => statusOf(n) === s).length
  // next up: not yet solid, and every prerequisite already has evidence
  const nextUp = inGoal.filter((n) => statusOf(n) !== 'have' && n.deps.every((d) => statusOf(BY[d]) !== 'learn' && statusOf(BY[d]) !== 'later'))
    .sort((a, b) => a.tier - b.tier || a.row - b.row).slice(0, 4)
  const s = BY[sel]
  const lesson = s.lesson && LESSONS.find((l) => l.id === s.lesson)

  return (
    <div className="stack">
      <section className="lede">
        <p className="kicker">27 项技能 · 6 层 · 箭头 = 前置</p>
        <h1>Agent 工程技能地图</h1>
        <p className="big">从左到右是从基础到细分方向。颜色是你现在的位置（学会一项就点它标记）；选一个目标岗位，地图会点亮要走的那条路。鼠标停在一项上，看它的前置和它解锁的东西。</p>
      </section>

      <div className="col" style={{ gap: 10 }}>
        <div className="pills" role="group" aria-label="目标岗位">
          {GOALS.map((g) => <button key={g.id} className={goal === g.id ? 'on' : ''} onClick={() => { setGoal(g.id); mood('thinking') }}>{g.name}</button>)}
          <button className={goal === null ? 'on' : ''} onClick={() => setGoal(null)}>全部</button>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={goal ?? 'all'} className="small muted" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {goal ? GOALS.find((g) => g.id === goal)!.blurb : '整张地图。'} · 共 {inGoal.length} 项：
            <span className="chip good">已有 {count('have')}</span> <span className="chip warn">薄 {count('thin')}</span> <span className="chip cool">要学 {count('learn')}</span>{count('later') > 0 && <> <span className="chip plain">以后 {count('later')}</span></>}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="panel">
        <div className="svgwrap">
          <svg viewBox="0 0 960 330" role="img" aria-label="agent 工程技能地图" style={{ minWidth: 820 }}>
            <defs>
              <marker id="sm-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="mk" /></marker>
              <marker id="sm-arh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="mk hot" /></marker>
            </defs>
            {TIERS.map((t, i) => (
              <g key={t}>
                <text x={X0 + i * TX} y={22} className="tick" style={{ letterSpacing: '0.06em' }}>{String(i).padStart(2, '0')} · {t}</text>
                <line x1={X0 + i * TX} x2={X0 + i * TX + W} y1={30} y2={30} className="axis" />
              </g>
            ))}
            {EDGES.map(([a, b]) => {
              const on = lit(a) && lit(b)
              const hot = !!chain && on
              return (
                <motion.path key={`${goal}-${a}-${b}`} d={edgePath(a, b)} className={`edge${hot ? ' hot' : on && goalSet ? ' done' : ''}`} markerEnd={hot ? 'url(#sm-arh)' : 'url(#sm-ar)'}
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: on ? 1 : 0.18 }} transition={{ duration: 0.5, delay: on ? 0.15 + BY[b].tier * 0.16 : 0 }} />
              )
            })}
            {NODES.map((n) => {
              const [x, y] = pos(n)
              const st = statusOf(n)
              const on = lit(n.id)
              const chosen = n.id === sel
              return (
                <motion.g key={`${goal}-${n.id}`} role="button" tabIndex={0} aria-label={`${n.label}：${STATUS[st].label}`} aria-pressed={chosen} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}
                  onClick={() => setSel(n.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(n.id) } }}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: on ? 1 : 0.22, y: 0 }} transition={{ duration: 0.35, delay: on ? n.tier * 0.16 + n.row * 0.04 : 0 }}>
                  <rect x={x} y={y} width={W} height={H} rx={H / 2}
                    style={{ fill: chosen ? 'var(--ink)' : 'var(--bg)', stroke: TONE[st], strokeWidth: chosen ? 0 : 1.6, strokeDasharray: st === 'later' ? '4 3' : undefined, transition: 'fill .25s' }} />
                  <circle cx={x + 14} cy={y + H / 2} r={4} style={{ fill: TONE[st] }} />
                  <text x={x + 25} y={y + H / 2 + 4} style={{ fill: chosen ? 'var(--bg)' : 'var(--ink)', fontSize: 12 }}>{n.label}</text>
                </motion.g>
              )
            })}
          </svg>
        </div>
        <div className="legend" style={{ display: 'flex', gap: '6px 14px', flexWrap: 'wrap', fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--nav)' }}>
          {(Object.keys(STATUS) as Status[]).map((k) => <span key={k}><span style={{ color: TONE[k] }}>●</span> {STATUS[k].label}</span>)}
          <span>· 点一项看细节</span>
        </div>
      </div>

      <div className="two">
        <div style={{ perspective: 1000 }}>
          <AnimatePresence mode="wait">
            <motion.div key={sel} className="tarot" initial={{ rotateY: -80, opacity: 0.3 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 80, opacity: 0.3 }} transition={{ duration: 0.28 }}>
              <span className="kicker">{String(s.tier).padStart(2, '0')} · {TIERS[s.tier]} · {STATUS[statusOf(s)].label}</span>
              <h3>{s.label}</h3>
              <p style={{ position: 'relative' }}>{s.what}</p>
              <p style={{ position: 'relative', opacity: 0.8 }} className="small">{EVIDENCE_LABEL}：{s.evidence}</p>
              {s.deps.length > 0 && <p style={{ position: 'relative', opacity: 0.8 }} className="small">前置：{s.deps.map((d) => BY[d].label).join('、')}</p>}
              <div className="row" style={{ position: 'relative' }}>
                {lesson && <a href={lessonHref(lesson.id)} className="chip" style={{ color: 'var(--bg)', border: '1px solid var(--bg)', textDecoration: 'none' }}>去上课：{lesson.title} →</a>}
                <label className="ctl" htmlFor={`map-${s.id}`} style={{ color: 'var(--bg)' }}>
                  <input type="checkbox" id={`map-${s.id}`} checked={!!progress[`map-${s.id}`]} onChange={(e) => { setDone(`map-${s.id}`, e.target.checked); if (e.target.checked) mood('done') }} />
                  我已经掌握了
                </label>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="col">
          <h3>下一步该学</h3>
          <p className="small muted">在这个目标里还不扎实、而且前置已经有了的技能：</p>
          <div className="col" style={{ gap: 6 }}>
            {nextUp.length ? nextUp.map((n, i) => (
              <motion.button key={`${goal}-${n.id}`} className="hit" style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', fontSize: 14 }} onClick={() => setSel(n.id)}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.08 }}>
                <span className="r">{i + 1}</span><span>{n.label}</span><span className={`chip ${STATUS[statusOf(n)].tone}`}>{STATUS[statusOf(n)].label}</span>
              </motion.button>
            )) : <p className="small muted">这条路上的技能都标为已掌握了。</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
