import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useMood } from '../mood'
import { ArrowDefs, Toggle, useInterval } from './kit'

type NodeId = 'ctx' | 'model' | 'tool' | 'obs' | 'check'
const NODES: [NodeId, string][] = [['ctx', '组装上下文'], ['model', '调用模型'], ['tool', '执行工具'], ['obs', '观察结果'], ['check', '结束前自检']]
const CX = 300, CY = 170, R = 125
const POS = Object.fromEntries(NODES.map(([id], i) => {
  const a = -Math.PI / 2 + (i / NODES.length) * Math.PI * 2
  return [id, [CX + R * Math.cos(a), CY + R * Math.sin(a)]]
})) as Record<NodeId, [number, number]>

type Ev = [NodeId, string, string]
function script(f: { rate: boolean; json: boolean; big: boolean }): Ev[] {
  const ev: Ev[] = [
    ['ctx', 'system + 用户问题 + 检索到的 3 条记忆', '只放这一步需要的东西；token 预算 8k'],
    ['model', '→ tool_call: search_memory("Biscuit 的生日")', '用 strict JSON schema 约束工具参数'],
  ]
  if (f.json) ev.push(['model', '× 参数不符合 schema：缺 user_id', 'Pydantic 校验失败 → 把错误回喂给模型，重试一次（repair）'], ['model', '→ tool_call: search_memory(user_id, "Biscuit 的生日")', '修好了，继续'])
  if (f.rate) ev.push(['tool', '× 上游返回 429', '退避 0.5s → 1s，最多重试 2 次；记进 trace'], ['tool', '✓ 第 2 次重试成功', ''])
  else ev.push(['tool', '✓ search_memory 返回结果', ''])
  ev.push(f.big ? ['obs', '工具输出 48k token，超出预算', '写进文件 /tmp/r1.json，上下文里只留路径和摘要'] : ['obs', '工具输出 1.2k token，直接放进上下文', ''])
  ev.push(['ctx', '追加工具结果，再组装一次', '旧的工具结果压缩成一行摘要'], ['model', '→ 最终回答草稿', ''], ['check', '自检：回答里每个日期都来自工具结果吗？', '确定性代码检查，不让模型自己判断'], ['check', '✓ 通过 → 结束', '记录：步数、耗时、token、成本'])
  return ev
}

export function LoopLab() {
  const mood = useMood()
  const [f, setF] = useState({ rate: false, json: false, big: false })
  const ev = useMemo(() => script(f), [f])
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const cur = step >= 0 ? ev[step] : null
  const prev = step > 0 ? ev[step - 1][0] : null

  const next = () => {
    if (step >= ev.length - 1) { setPlaying(false); return }
    const s = step + 1
    setStep(s)
    mood(s === ev.length - 1 ? 'done' : ev[s][1].startsWith('×') ? 'error' : 'thinking')
  }
  useInterval(next, 1100, playing)
  const setFault = (k: keyof typeof f, v: boolean) => { setF({ ...f, [k]: v }); setStep(-1); setPlaying(false) }
  const [dx, dy] = cur ? POS[cur[0]] : POS.ctx

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="two">
        <div className="panel">
          <div className="svgwrap">
            <svg viewBox="0 0 600 340" role="img" aria-label="agent 循环">
              <ArrowDefs />
              <circle cx={CX} cy={CY} r={R} className="edge" strokeDasharray="3 5" />
              {NODES.slice(0, -1).map(([id], i) => {
                const [x1, y1] = POS[id], [x2, y2] = POS[NODES[i + 1][0]]
                const isHot = prev === id && cur?.[0] !== id
                return <path key={id} className={`edge${isHot ? ' hot' : ''}`} d={`M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}`} markerEnd={isHot ? 'url(#arh)' : 'url(#ar)'} />
              })}
              {NODES.map(([id, label]) => {
                const [x, y] = POS[id]
                return (
                  <g key={id} className={`node${cur?.[0] === id ? ' hot' : ''}${cur?.[0] === id && cur[1].startsWith('×') ? ' bad' : ''}`}>
                    <rect x={x - 52} y={y - 17} width={104} height={34} rx={17} />
                    <text x={x} y={y + 5} textAnchor="middle">{label}</text>
                  </g>
                )
              })}
              {cur && <motion.circle r={7} className="packet" animate={{ cx: dx, cy: dy - 26 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} initial={false} />}
              <text x={CX} y={CY - 6} textAnchor="middle" className="lbl" style={{ fontSize: 13 }}>{cur ? (cur[1].length > 30 ? cur[1].slice(0, 29) + '…' : cur[1]) : '按"下一步"开始'}</text>
              <text x={CX} y={CY + 16} textAnchor="middle" className="tick">{cur ? `第 ${step + 1} / ${ev.length} 步` : ''}</text>
            </svg>
          </div>
        </div>
        <div className="col">
          <h3>故障开关</h3>
          <Toggle id="f-rate" label="工具返回 429（限流）" checked={f.rate} onChange={(v) => setFault('rate', v)} />
          <Toggle id="f-json" label="模型参数不符合 schema" checked={f.json} onChange={(v) => setFault('json', v)} />
          <Toggle id="f-big" label="工具输出太大" checked={f.big} onChange={(v) => setFault('big', v)} />
          <div className="row">
            <button className="btn" onClick={next} disabled={step >= ev.length - 1}>下一步</button>
            <button className="btn quiet" onClick={() => { if (step >= ev.length - 1) setStep(-1); setPlaying(!playing) }}>{playing ? '暂停' : '自动播放'}</button>
            <button className="btn quiet" onClick={() => { setStep(-1); setPlaying(false) }}>重来</button>
          </div>
          {cur?.[2] && <motion.p key={step} className="small muted" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>harness 做了什么：{cur[2]}</motion.p>}
        </div>
      </div>
      <div className="col">
        <h3>Trace</h3>
        <pre className="log">{ev.slice(0, step + 1).map(([id, t], i) => `${String(i + 1).padStart(2, '0')}  ${id.padEnd(5)}  ${t}`).join('\n')}</pre>
      </div>
    </div>
  )
}
