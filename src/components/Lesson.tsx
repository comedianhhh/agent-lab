import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LESSONS, practiceIds, type Lesson } from '../data/lessons'
import type { ResourceKind } from '../data/resources'
import { LABS } from '../labs'
import { setDone, share, useProgress } from '../progress'
import { lessonHref } from '../route'

const KIND: Record<ResourceKind, string> = { docs: '文档', repo: 'GitHub', blog: '文章', course: '课程', paper: '论文', spec: '规范' }

export function LessonPage({ id }: { id: string }) {
  const i = LESSONS.findIndex((l) => l.id === id)
  const l = LESSONS[i]
  if (!l) {
    return (
      <div className="stack">
        <p className="crumbs"><a href="#/">← 路线</a></p>
        <p>没有这节课。</p>
      </div>
    )
  }
  const prev = LESSONS[(i - 1 + LESSONS.length) % LESSONS.length]
  const next = LESSONS[(i + 1) % LESSONS.length]
  const Lab = LABS[l.lab]
  return (
    <article className="stack">
      <p className="crumbs"><a href="#/">← 路线</a></p>
      <section className="lede">
        <p className="kicker">{String(l.n).padStart(2, '0')} · {l.en} · {l.when} · {l.project}</p>
        <h1>{l.title}</h1>
        <p className="big">{l.summary}</p>
      </section>

      <section className="stack" style={{ gap: 14 }}>
        <div className="bh"><h2>动手玩</h2><span className="kicker">{l.labTitle}</span></div>
        <Lab />
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <h2>概念</h2>
        <Concepts l={l} />
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <div className="bh"><h2>学习资料</h2><span className="kicker">{l.resources.length} 份 · 链接已核对</span></div>
        <ul className="res">
          {l.resources.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
              <span className="chip plain">{KIND[r.kind]}</span>
              <span className="why">{r.why}</span>
              <span className="host">{new URL(r.url).host.replace(/^www\./, '')}</span>
            </li>
          ))}
        </ul>
      </section>

      <Practice l={l} />

      <nav className="pager" aria-label="上一节 / 下一节">
        <a href={lessonHref(prev.id)}><span className="kicker">← 上一节</span><h3>{prev.title}</h3></a>
        <a href={lessonHref(next.id)} className="next"><span className="kicker">下一节 →</span><h3>{next.title}</h3></a>
      </nav>
    </article>
  )
}

function Concepts({ l }: { l: Lesson }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="concepts">
      {l.concepts.map((c, i) => (
        <div key={c.h} className={`concept${open === i ? ' open' : ''}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span className="i">{String(i + 1).padStart(2, '0')}</span>
            <span className="h">{c.h}</span>
            <span className="tw" aria-hidden="true">+</span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div className="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}>
                <div>
                  {c.body.map((p, j) => <p key={j}>{p}</p>)}
                  {c.code && <pre><code>{c.code}</code></pre>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function Practice({ l }: { l: Lesson }) {
  const progress = useProgress()
  const ids = practiceIds(l)
  const pct = share(progress, ids)
  return (
    <section className="stack" style={{ gap: 10 }}>
      <div className="bh"><h2>动手做</h2><span className="kicker num">{Math.round(pct * 100)}%</span></div>
      <div className="bar"><i style={{ width: `${pct * 100}%` }} /></div>
      <div>
        {l.practice.map((t, i) => (
          <label key={ids[i]} className={`task${progress[ids[i]] ? ' done' : ''}`} htmlFor={ids[i]}>
            <input type="checkbox" id={ids[i]} checked={!!progress[ids[i]]} onChange={(e) => setDone(ids[i], e.target.checked)} />
            <span>{t}</span>
          </label>
        ))}
      </div>
    </section>
  )
}
