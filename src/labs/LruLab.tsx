import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useMood } from '../mood'
import { Slider } from './kit'

interface Item { k: string; v: number }
const KEYS = ['A', 'B', 'C', 'D', 'E', 'F']

/** Most-recent first. The list is the doubly linked list; `map` below is the hash table pointing into it. */
export function LruLab() {
  const mood = useMood()
  const [cap, setCap] = useState(3)
  const [list, setList] = useState<Item[]>([{ k: 'B', v: 2 }, { k: 'A', v: 1 }])
  const [hot, setHot] = useState<string | null>(null)
  const [out, setOut] = useState<Item | null>(null)
  const [log, setLog] = useState<string[]>(['put(A, 1)', 'put(B, 2)'])
  const [n, setN] = useState(3)

  const say = (s: string) => setLog((l) => [...l.slice(-7), s])
  const get = (k: string) => {
    const i = list.findIndex((x) => x.k === k)
    setOut(null)
    if (i < 0) { setHot(null); say(`get(${k}) → -1   # 哈希表里没有`); mood('error'); return }
    const it = list[i]
    setList([it, ...list.filter((_, j) => j !== i)])
    setHot(k)
    say(`get(${k}) → ${it.v}   # 挪到链表头`)
    mood('done')
  }
  const put = (k: string) => {
    const v = n
    setN(n + 1)
    const rest = list.filter((x) => x.k !== k)
    let next = [{ k, v }, ...rest]
    let ev: Item | null = null
    if (next.length > cap) { ev = next[next.length - 1]; next = next.slice(0, cap) }
    setList(next)
    setHot(k)
    setOut(ev)
    say(`put(${k}, ${v})${rest.length < list.length ? '   # 已存在：更新并挪到头' : ''}${ev ? `   # 满了，淘汰尾部 ${ev.k}` : ''}`)
    mood(ev ? 'working' : 'done')
  }
  const resize = (c: number) => {
    setCap(c)
    if (list.length > c) { setOut(list[list.length - 1]); setList(list.slice(0, c)) }
  }

  return (
    <div className="panel">
      <div className="bh"><h3>双向链表（左 = 最近用过）</h3><span className="kicker num">{list.length} / {cap}</span></div>
      <div className="cache" aria-live="polite">
        <span className="kicker">head</span>
        <AnimatePresence mode="popLayout">
          {list.map((it) => (
            <motion.div key={it.k} layout className={`cell${it.k === hot ? ' hot' : ''}`} initial={{ opacity: 0, scale: 0.6, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, x: 40, scale: 0.8 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
              {it.k}<small>v = {it.v}</small>
            </motion.div>
          ))}
        </AnimatePresence>
        <span className="kicker">tail</span>
        <AnimatePresence>
          {out && <motion.div key={`out-${out.k}-${n}`} className="cell out" initial={{ opacity: 1, x: 0 }} animate={{ opacity: 0.85, x: 12 }} exit={{ opacity: 0 }}>{out.k}<small>被淘汰</small></motion.div>}
        </AnimatePresence>
      </div>
      <div className="bh"><h3>哈希表</h3><span className="kicker">key → 链表节点，O(1) 找到</span></div>
      <pre className="log">{`{ ${list.map((x) => `${x.k}: Node(${x.v})`).join(', ')} }`}</pre>
      <div className="row">
        <span className="kicker">get</span>
        {KEYS.map((k) => <button key={k} className="btn quiet" onClick={() => get(k)}>{k}</button>)}
      </div>
      <div className="row">
        <span className="kicker">put</span>
        {KEYS.map((k) => <button key={k} className="btn" onClick={() => put(k)}>{k}</button>)}
      </div>
      <Slider id="lru-cap" label="容量" value={cap} min={1} max={5} onChange={resize} />
      <pre className="log">{log.join('\n')}</pre>
      <p className="small muted">试试：容量 1 的边界；put 一个已存在的 key（更新值并挪到头，不淘汰）。面试时这三种情况各写一个 assert。</p>
    </div>
  )
}
