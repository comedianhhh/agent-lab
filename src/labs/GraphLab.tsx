import { useState } from 'react'
import { useMood } from '../mood'
import { ArrowDefs, Packet, Toggle } from './kit'

/** A step-through model of job-agent-skills/graph/apply_graph/graph.py (same nodes, edges and MAX_DRAFTS). */
type N = 'START' | 'match' | 'draft' | 'trace_check' | 'approve' | 'record' | 'END'
const NODES: Record<N, [number, number]> = { START: [40, 120], match: [140, 120], draft: [300, 120], trace_check: [460, 120], approve: [630, 120], record: [460, 240], END: [460, 310] }
const EDGES: [N, N, string, string, number, number][] = [
  ['START', 'match', 'M58 120 H85', '', 0, 0],
  ['match', 'draft', 'M195 120 H245', 'APPLY', 220, 112],
  ['match', 'record', 'M140 137 V240 H405', 'SKIP', 150, 200],
  ['draft', 'trace_check', 'M355 120 H405', '', 0, 0],
  ['trace_check', 'approve', 'M515 120 H575', '干净', 545, 112],
  ['trace_check', 'draft', 'M460 103 C460 58 315 58 315 103', '有编造 · 重写', 388, 66],
  ['approve', 'draft', 'M630 103 C630 18 288 18 288 103', '人工打回', 460, 30],
  ['trace_check', 'record', 'M470 137 V223', '3 次用完', 478, 185],
  ['approve', 'record', 'M630 137 V215 Q630 240 600 240 H515', '批准 / 拒绝', 640, 200],
  ['record', 'END', 'M460 257 V292', '', 0, 0],
]
const MAX = 3

interface S { match: string | null; draft: string | null; findings: string[]; attempts: number; feedback: string | null; status: string | null; log: string[] }
interface Snap { node: N; st: S; wait?: boolean }
const fresh = (): S => ({ match: null, draft: null, findings: [], attempts: 0, feedback: null, status: null, log: [] })

export function GraphLab() {
  const mood = useMood()
  const [decision, setDecision] = useState<'APPLY' | 'SKIP'>('APPLY')
  const [bad, setBad] = useState([true, false, false])
  const [hist, setHist] = useState<Snap[]>([{ node: 'START', st: fresh() }])
  const [edge, setEdge] = useState<string | null>(null)
  const [view, setView] = useState<number | null>(null)
  const last = hist[hist.length - 1]
  const waiting = !!last.wait
  const done = last.node === 'END'

  const reset = (d = decision, b = bad) => { setDecision(d); setBad(b); setHist([{ node: 'START', st: fresh() }]); setEdge(null); setView(null) }
  const push = (node: N, st: S, e: string, wait = false) => { setHist([...hist, { node, st, wait }]); setEdge(e); setView(null) }
  const draft = (s: S): S => ({ ...s, attempts: s.attempts + 1, draft: `cover letter v${s.attempts + 1}`, feedback: null, log: [...s.log, `draft: attempt ${s.attempts + 1}`] })
  const record = (s: S): S => { const status = s.status ?? (s.match === 'SKIP' ? 'SKIPPED' : 'BLOCKED'); return { ...s, status, log: [...s.log, `record: ${status}`] } }

  const step = () => {
    if (waiting || done) return
    const s = last.st
    switch (last.node) {
      case 'START': push('match', { ...s, match: decision, attempts: 0, log: [...s.log, `match: ${decision}`] }, 'START>match'); break
      case 'match': if (s.match === 'APPLY') push('draft', draft(s), 'match>draft'); else push('record', record(s), 'match>record'); break
      case 'draft': {
        const f = bad[s.attempts - 1] ? ['"40% faster"'] : []
        push('trace_check', { ...s, findings: f, feedback: f.length ? 'These are not in facts.md: "40% faster"' : null, log: [...s.log, `trace_check: ${f.length} finding(s)`] }, 'draft>trace_check')
        break
      }
      case 'trace_check':
        if (!s.findings.length) { push('approve', s, 'trace_check>approve', true); mood('needs-input') }
        else if (s.attempts < MAX) push('draft', draft(s), 'trace_check>draft')
        else push('record', record(s), 'trace_check>record')
        break
      case 'record': push('END', s, 'record>END'); mood('done'); break
    }
  }
  const resume = (kind: 'yes' | 'note' | 'no') => {
    const s = last.st
    if (kind === 'yes') push('record', record({ ...s, status: 'READY', log: [...s.log, 'approve: yes'] }), 'approve>record')
    else if (kind === 'note') push('draft', draft({ ...s, feedback: '第二段太长', log: [...s.log, 'approve: redraft (第二段太长)'] }), 'approve>draft')
    else push('record', record({ ...s, status: 'REJECTED', log: [...s.log, 'approve: no'] }), 'approve>record')
  }

  const used = new Set(hist.slice(1).map((h, i) => `${hist[i].node}>${h.node}`))
  const shown = hist[view ?? hist.length - 1]
  const hotD = EDGES.find(([a, b]) => `${a}>${b}` === edge)?.[2]

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel">
        <div className="svgwrap">
          <svg viewBox="0 0 720 330" role="img" aria-label="apply-graph 状态图">
            <ArrowDefs />
            {EDGES.map(([a, b, d, l, lx, ly]) => {
              const k = `${a}>${b}`, hot = k === edge
              return (
                <g key={k}>
                  <path className={`edge${hot ? ' hot' : used.has(k) ? ' done' : ''}`} d={d} markerEnd={hot ? 'url(#arh)' : 'url(#ar)'} />
                  {l && <text x={lx} y={ly} className={`elabel${hot ? ' hot' : ''}`} textAnchor={a === 'match' && b === 'record' ? 'start' : 'middle'}>{l}</text>}
                </g>
              )
            })}
            {(Object.entries(NODES) as [N, [number, number]][]).map(([id, [x, y]]) => {
              const cls = `node${id === last.node ? ' hot' : hist.some((h) => h.node === id) ? ' done' : ''}`
              return (
                <g key={id} className={cls}>
                  {id === 'START' || id === 'END'
                    ? <><circle cx={x} cy={y} r={17} /><text x={x} y={y + 4} textAnchor="middle" style={{ fontSize: 10 }}>{id}</text></>
                    : <><rect x={x - 55} y={y - 17} width={110} height={34} rx={6} /><text x={x} y={y + 5} textAnchor="middle">{id}</text></>}
                </g>
              )
            })}
            {hotD && <Packet key={hist.length} d={hotD} dur={0.55} />}
          </svg>
        </div>
      </div>
      <div className="two">
        <div className="col">
          <h3>条件</h3>
          <label className="ctl" htmlFor="g-dec">match 的结论
            <select id="g-dec" value={decision} onChange={(e) => reset(e.target.value as 'APPLY' | 'SKIP')}>
              <option value="APPLY">APPLY</option>
              <option value="SKIP">SKIP（硬性条件不符）</option>
            </select>
          </label>
          <div className="row">
            {bad.map((b, i) => <Toggle key={i} id={`g-b${i}`} label={`第 ${i + 1} 版有编造数字`} checked={b} onChange={(v) => reset(decision, bad.map((x, j) => (j === i ? v : x)))} />)}
          </div>
          <div className="row">
            <button className="btn" onClick={step} disabled={waiting || done}>下一步</button>
            <button className="btn quiet" onClick={() => reset()}>重来</button>
          </div>
          {waiting && (
            <div className="banner">
              <p><b>interrupt()：图停在 approve。</b> 这时进程可以退出，SqliteSaver 已按 thread_id 存档。你回复后 approve 节点会<b>从头重跑</b>，所以 interrupt 上面不能有副作用。</p>
              <div className="row">
                <button className="btn" onClick={() => resume('yes')}>批准</button>
                <button className="btn quiet" onClick={() => resume('note')} disabled={last.st.attempts >= MAX}>打回：第二段太长</button>
                <button className="btn quiet" onClick={() => resume('no')}>拒绝</button>
              </div>
            </div>
          )}
          {done && <p className="small muted">运行结束：status = {last.st.status}，共写了 {last.st.attempts} 版草稿。点下面的快照，就是 get_state_history()。</p>}
          <h3>快照历史（checkpointer）</h3>
          <div className="pills">
            {hist.map((h, i) => <button key={i} className={view === i ? 'on' : ''} onClick={() => setView(i)}>{i}·{h.node}{h.wait ? ' ⏸' : ''}</button>)}
          </div>
        </div>
        <div className="col">
          <div className="bh"><h3>State</h3><span className="kicker">log 用 reducer 追加，不覆盖</span></div>
          <pre className="log">{JSON.stringify({ node: shown.node, ...shown.st }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
