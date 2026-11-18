import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useMood } from '../mood'
import { Toggle, useInterval } from './kit'

/** Five activities; each "runs" for a few ticks. With Temporal, finished ones come back from history on replay. */
const ACTS = [
  ['make_plan', '调 LLM 拆计划', 4],
  ['search_memory', '查记忆', 3],
  ['web_research', '查公司信息（慢）', 6],
  ['draft_letter', '调 LLM 写草稿', 5],
  ['trace_check', '确定性检查', 2],
] as const

interface Hist { kind: string; act?: string; worker: number }

export function DurableLab() {
  const mood = useMood()
  const [temporal, setTemporal] = useState(true)
  const [done, setDone] = useState<number>(0)
  const [tick, setTick] = useState(0)
  const [worker, setWorker] = useState(1)
  const [running, setRunning] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const [calls, setCalls] = useState(0)
  const [hist, setHist] = useState<Hist[]>([])
  const replayAt = useRef(0)

  const finished = done >= ACTS.length
  useInterval(() => {
    if (replaying) {
      // replay: walk history fast; completed activities are not executed again
      replayAt.current += 1
      if (replayAt.current >= done) setReplaying(false)
      return
    }
    if (finished) { setRunning(false); mood('done'); return }
    const [name, , len] = ACTS[done]
    if (tick === 0) { setHist((h) => [...h, { kind: 'ActivityTaskScheduled', act: name, worker }]); if (name.startsWith('make') || name.startsWith('draft')) setCalls((c) => c + 1) }
    if (tick + 1 >= len) {
      setHist((h) => [...h, { kind: 'ActivityTaskCompleted', act: name, worker }])
      setDone(done + 1)
      setTick(0)
    } else setTick(tick + 1)
  }, replaying ? 160 : 420, running)

  const start = () => { setDone(0); setTick(0); setWorker(1); setCalls(0); setHist([{ kind: 'WorkflowExecutionStarted', worker: 1 }]); setRunning(true); mood('working') }
  const kill = () => {
    if (!running || finished) return
    mood('error')
    const w = worker + 1
    setWorker(w)
    setTick(0)
    if (temporal) {
      setHist((h) => [...h, { kind: `WorkerCrashed · worker ${w} 接手，重放历史`, worker: w }])
      replayAt.current = 0
      setReplaying(done > 0)
    } else {
      setHist((h) => [...h, { kind: `进程崩溃 · 从头再来（worker ${w}）`, worker: w }])
      setDone(0)
    }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel">
        <div className="bh"><h3>AgentRun workflow</h3><span className="kicker num">worker {worker} · LLM 调用 {calls} 次</span></div>
        <div className="col" style={{ gap: 8 }}>
          {ACTS.map(([name, label, len], i) => {
            const state = i < done ? (replaying && i >= replayAt.current ? 'replay' : 'done') : i === done && running ? 'run' : 'wait'
            const pct = state === 'done' || state === 'replay' ? 1 : state === 'run' ? (tick + (replaying ? 0 : 0.5)) / len : 0
            return (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px', gap: 12, alignItems: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>
                <code>{name}</code>
                <div className="bar" style={{ height: 10 }}>
                  <motion.i animate={{ width: `${pct * 100}%`, backgroundColor: state === 'replay' ? 'var(--cool)' : state === 'run' ? 'var(--ember)' : 'var(--ink)' }} transition={{ duration: 0.35 }} style={{ width: 0 }} />
                </div>
                <span className="small muted">{state === 'done' ? (temporal && worker > 1 && i < done ? '已完成（历史）' : '已完成') : state === 'replay' ? '从历史读取' : state === 'run' ? label : '等待'}</span>
              </div>
            )
          })}
        </div>
        <div className="row">
          <button className="btn" onClick={start} disabled={running && !finished}>开始运行</button>
          <button className="btn quiet" onClick={kill} disabled={!running || finished}>杀掉 worker</button>
          <Toggle id="d-temporal" label="用 Temporal（关掉 = 普通脚本）" checked={temporal} onChange={(v) => { setTemporal(v); setRunning(false); setDone(0); setHist([]); setCalls(0) }} />
        </div>
        <p className="small muted">{temporal ? '杀掉 worker 后，新的 worker 读事件历史，把 workflow 代码重跑一遍；已完成的 activity 直接用历史里的结果，LLM 不会被重复调用。' : '普通脚本挂了只能从头来：已经花掉的 LLM 调用全部重来，而且第二次的输出不一定和第一次一样。'}</p>
      </div>
      <div className="col">
        <div className="bh"><h3>事件历史</h3><span className="kicker">Temporal 存下来的就是这张表</span></div>
        <div className="log" style={{ whiteSpace: 'normal', display: 'grid', gap: 2, maxHeight: 220, overflowY: 'auto' }}>
          <AnimatePresence initial={false}>
            {hist.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ color: h.kind.includes('崩溃') || h.kind.includes('Crashed') ? 'var(--bad)' : undefined }}>
                {String(i + 1).padStart(2, '0')}  {h.kind}{h.act ? `  ${h.act}` : ''}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <p className="small muted">和游戏帧同步是同一件事：确定性模拟 + 输入日志 = 能重放。所以 workflow 代码必须是确定性的，副作用都放进 activity。</p>
      </div>
    </div>
  )
}
