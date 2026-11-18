import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Slider } from './kit'

const MEM = [
  'Mia adopted a corgi puppy named Biscuit in March.',
  'Mia is allergic to peanuts.',
  "Mia's sister Lena lives in Vancouver.",
  'Mia prefers oat milk lattes, no sugar.',
  "Mia's flight to Tokyo is on 2026-12-14.",
  'Mia started learning Korean on Duolingo.',
  'Mia hates horror movies but loves Studio Ghibli.',
  "Mia's apartment is on Bloor Street, unit 1207.",
  'Mia runs 5 km every Sunday morning.',
  'Her manager is called Priya; weekly 1:1 on Thursdays.',
  'Mia broke her phone screen last week.',
  'Mia wants a birthday dinner at a sushi place.',
]
const PRE: [string, number, string][] = [
  ['What is her dog called?', 0, '同义词：dog ≈ corgi / puppy。BM25 只看字面，还会被 "called" 带偏'],
  ['unit 1207', 7, '精确编号：BM25 的强项，语义向量几乎没信号'],
  ['coffee order', 3, '同义词：coffee ≈ latte'],
  ['When does she fly to Japan?', 4, 'fly ≈ flight，Japan ≈ Tokyo'],
  ['Priya', 9, '人名：BM25 稳，语义向量帮不上'],
  ['food she should avoid', 1, '两边都难：考验融合'],
]
const STOP = new Set('a an the is are was to of in on at her his she he mia mias what when does do every no but s'.split(' '))
const tok = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w))
/** Stand-in for embeddings: a small synonym table maps words to concepts, then cosine over concept counts. */
const CONCEPT: Record<string, string> = {
  dog: 'pet', puppy: 'pet', corgi: 'pet', pet: 'pet', coffee: 'coffee', latte: 'coffee', lattes: 'coffee', espresso: 'coffee', milk: 'coffee',
  fly: 'travel', flight: 'travel', trip: 'travel', travel: 'travel', japan: 'japan', tokyo: 'japan', food: 'food', eat: 'food', avoid: 'food', allergic: 'food', peanuts: 'food', sushi: 'food', dinner: 'food',
  called: 'name', named: 'name', name: 'name', sister: 'family', family: 'family', run: 'exercise', runs: 'exercise', km: 'exercise',
  phone: 'phone', screen: 'phone', movies: 'movie', movie: 'movie', manager: 'work', boss: 'work', apartment: 'home', home: 'home', address: 'home', lives: 'home',
}
const docs = MEM.map(tok)
const avg = docs.reduce((a, d) => a + d.length, 0) / docs.length
function bm25(q: string) {
  const qt = tok(q)
  return docs.map((d) => qt.reduce((sum, t) => {
    const df = docs.filter((x) => x.includes(t)).length
    if (!df) return sum
    const tf = d.filter((x) => x === t).length
    const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5))
    return sum + (idf * tf * 2.5) / (tf + 1.5 * (1 - 0.75 + (0.75 * d.length) / avg))
  }, 0))
}
const cvec = (ts: string[]) => ts.reduce<Record<string, number>>((v, t) => (CONCEPT[t] ? { ...v, [CONCEPT[t]]: (v[CONCEPT[t]] || 0) + 1 } : v), {})
const cos = (a: Record<string, number>, b: Record<string, number>) => {
  let d = 0, na = 0, nb = 0
  for (const k in a) { na += a[k] ** 2; if (b[k]) d += a[k] * b[k] }
  for (const k in b) nb += b[k] ** 2
  return na && nb ? d / Math.sqrt(na * nb) : 0
}
const dvecs = docs.map(cvec)
const dense = (q: string) => { const qv = cvec(tok(q)); return dvecs.map((v) => cos(qv, v)) }
type Ranked = [number, number][]
const rank = (s: number[]): Ranked => s.map((x, i) => [i, x] as [number, number]).filter(([, x]) => x > 0).sort((a, b) => b[1] - a[1] || a[0] - b[0])
const rrf = (lists: Ranked[], k: number): Ranked => {
  const sc = new Map<number, number>()
  lists.forEach((l) => l.forEach(([i], r) => sc.set(i, (sc.get(i) || 0) + 1 / (k + r + 1))))
  return [...sc.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
}

function Column({ title, sub, list, gold, fmt }: { title: string; sub: string; list: Ranked; gold: number; fmt: (x: number) => string }) {
  return (
    <div className="col">
      <div className="bh"><h3>{title}</h3><span className="kicker">{sub}</span></div>
      <div className="hits">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.length ? list.slice(0, 5).map(([i, sc], r) => (
            <motion.div key={i} layout className={`hit${i === gold ? ' gold' : ''}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
              <span className="r">#{r + 1}</span><span>{MEM[i]}</span><span className="s">{fmt(sc)}</span>
            </motion.div>
          )) : <motion.div key="none" className="hit empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>没有命中</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function HybridLab() {
  const [q, setQ] = useState(PRE[0][0])
  const [k, setK] = useState(60)
  const p = PRE.find((x) => x[0] === q)
  const gold = p ? p[1] : -1
  const b = useMemo(() => rank(bm25(q)), [q]), d = useMemo(() => rank(dense(q)), [q])
  const f = useMemo(() => rrf([b, d], k), [b, d, k])
  const rows = useMemo(() => PRE.map(([pq, g]) => {
    const bb = rank(bm25(pq)), dd = rank(dense(pq)), ff = rrf([bb, dd], k)
    const at = (l: Ranked) => l.findIndex(([i]) => i === g)
    return { pq, r: [at(bb), at(dd), at(ff)] }
  }), [k])
  const hit3 = (j: number) => rows.filter((r) => r.r[j] >= 0 && r.r[j] < 3).length

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel">
        <div className="pills">{PRE.map(([pq]) => <button key={pq} className={pq === q ? 'on' : ''} onClick={() => setQ(pq)}>{pq}</button>)}</div>
        <div className="row">
          <label className="ctl" htmlFor="rag-q">问题 <input type="text" id="rag-q" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <Slider id="rag-k" label="RRF k" value={k} min={1} max={100} onChange={setK} />
        </div>
        <p className="small muted">{p ? p[2] : '自己写的问题没有标注答案，所以不标绿。'}</p>
      </div>
      <div className="cols3">
        <Column title="BM25" sub="关键词" list={b} gold={gold} fmt={(x) => x.toFixed(2)} />
        <Column title="语义向量" sub="示意" list={d} gold={gold} fmt={(x) => x.toFixed(2)} />
        <Column title="RRF 融合" sub={`k = ${k}`} list={f} gold={gold} fmt={(x) => x.toFixed(4)} />
      </div>
      <div className="col">
        <div className="bh"><h3>6 个预设问题的正确答案排第几</h3><span className="kicker">第 1 周周六评测的缩小版</span></div>
        <div className="tablewrap">
          <table className="t">
            <thead><tr><th>预设问题</th><th>BM25</th><th>语义向量</th><th>RRF</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.pq}><td>{r.pq}</td>{r.r.map((x, j) => <td key={j}><span className={`chip ${x >= 0 && x < 3 ? 'good' : 'bad'}`}>{x < 0 ? '—' : `#${x + 1}`}</span></td>)}</tr>
              ))}
              <tr><td><b>hit@3</b></td>{[0, 1, 2].map((j) => <td key={j}><b className="num">{hit3(j)}/6</b></td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">"语义向量"在这里用一个小同义词表代替真正的 embedding（你的 rank.py 用的是 bge-small-en-v1.5）；BM25 是真实公式。k 越小，排第一的那条权重越大；rank.py 也用 k = 60。</p>
      </div>
    </div>
  )
}
