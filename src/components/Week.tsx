import { motion } from 'motion/react'
import { LESSONS } from '../data/lessons'
import { WEEK1, weekIds } from '../data/plan'
import { useMood } from '../mood'
import { setDone, share, useProgress } from '../progress'
import { lessonHref } from '../route'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function Week() {
  const progress = useProgress()
  const mood = useMood()
  const pct = share(progress, weekIds())
  const now = today()

  const tick = (id: string, on: boolean) => {
    setDone(id, on)
    if (on) mood('done')
  }
  const item = (id: string, text: string, fixed = false) => (
    <label key={id} className={`task${fixed ? ' fixed' : ''}${progress[id] ? ' done' : ''}`} htmlFor={id}>
      <input type="checkbox" id={id} checked={!!progress[id]} onChange={(e) => tick(id, e.target.checked)} />
      <span>{text}</span>
    </label>
  )

  return (
    <div className="stack">
      <section className="lede">
        <p className="kicker">P1 · 11/02 → 11/08</p>
        <h1>第 1 周</h1>
        <p className="big">讲清 apply-graph 的每条边，并能用 SSE 推出每一步；新仓库 memory-service 做到多租户 + 混合检索 + 第一个 recall@5。代码自己写，卡住 20 分钟以上只问 AI "为什么"。</p>
      </section>
      <section className="stack" style={{ gap: 8 }}>
        <div className="bh"><h3>本周完成度</h3><span className="num">{Math.round(pct * 100)}%</span></div>
        <div className="bar"><i style={{ width: `${pct * 100}%` }} /></div>
      </section>
      <div className="days">
        {WEEK1.map((d, i) => {
          const l = d.lesson && LESSONS.find((x) => x.id === d.lesson)
          return (
            <motion.article key={d.date} className={`day${d.date === now ? ' today' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bh"><h3>{d.name} · {d.title}</h3><span className="kicker">{d.date.slice(5).replace('-', '/')}{d.date === now ? ' · 今天' : ''}</span></div>
              {d.tasks.map((t, j) => item(`w1-${i}-${j}`, t))}
              {d.py && item(`w1-${i}-py`, `手写 Python：${d.py}`, true)}
              {d.story && item(`w1-${i}-st`, `英文故事：${d.story}`, true)}
              {l && <a href={lessonHref(l.id)} className="small" style={{ marginTop: 6, fontFamily: 'var(--font-ui)' }}>今天的课：{l.title} →</a>}
            </motion.article>
          )
        })}
      </div>
    </div>
  )
}
