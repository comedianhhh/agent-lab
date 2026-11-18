import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useMood } from '../mood'
import { ArrowDefs, useInterval } from './kit'

/**
 * One `agent-reach <channel> <action>` call through run_action() in
 * agent_reach/runtime/dispatch.py (v1.6.1). Backend names, error codes and
 * pause lengths are the real ones; the scenarios are simplified.
 */
type Where = 'agent' | 'disp' | number
interface Step { at: Where; result?: string; note: string }
interface Scenario { id: string; label: string; cmd: string; rows: string[]; steps: Step[]; out: string }

const RETRY = new Set(['UPSTREAM_BROKEN', 'TIMEOUT', 'NEED_SETUP'])

const SCENARIOS: Scenario[] = [
  {
    id: 'fallback', label: '首选坏了，换备选', cmd: 'agent-reach bilibili read BV1xx',
    rows: ['bili-cli', 'public-api'],
    steps: [
      { at: 'agent', note: 'agent 只跑一条命令，不用知道背后有哪些工具。' },
      { at: 'disp', note: 'run_action：校验参数，查这个渠道有没有限流冷却，拿到 Action 里排好序的 backends。' },
      { at: 0, result: 'UPSTREAM_BROKEN', note: 'bili-cli 报错。UPSTREAM_BROKEN 不在 FINAL_CODES 里，所以继续试下一个；同时 _remember 记下"bili-cli 120 秒内别再试"。' },
      { at: 1, result: 'ok', note: '公开接口成功。成功也会 _remember，清掉这个工具的失败记录。' },
      { at: 'agent', note: '返回一行 JSON。attempts 里留着完整的尝试记录，出问题时能查。' },
    ],
    out: '{"ok": true, "channel": "bilibili", "action": "read",\n "backend": "public-api",\n "items": [{"title": "…", "url": "…", "author": "…", "text": "…"}],\n "meta": {"attempts": [\n   {"backend": "bili-cli", "result": "UPSTREAM_BROKEN"},\n   {"backend": "public-api", "result": "ok"}]},\n "error": null}',
  },
  {
    id: 'paused', label: '30 秒后再查一次', cmd: 'agent-reach bilibili read BV1yy',
    rows: ['bili-cli', 'public-api'],
    steps: [
      { at: 'agent', note: '同一个渠道，紧接着又来一次。' },
      { at: 'disp', note: 'backend_pause 读 state：bili-cli 上次 UPSTREAM_BROKEN，还在 120 秒暂停期里。' },
      { at: 0, result: 'skipped', note: '直接跳过，不浪费时间再撞一次墙。记录里写 skipped + retry_after_seconds。' },
      { at: 1, result: 'ok', note: '直接用备选。' },
      { at: 'agent', note: '比上一次快，因为少了一次注定失败的调用。' },
    ],
    out: '{"ok": true, "backend": "public-api",\n "meta": {"attempts": [\n   {"backend": "bili-cli", "result": "UPSTREAM_BROKEN",\n    "skipped": true, "retry_after_seconds": 90},\n   {"backend": "public-api", "result": "ok"}]}}',
  },
  {
    id: 'login', label: '要登录：立刻停', cmd: 'agent-reach linkedin jobs "video editor"',
    rows: ['opencli'],
    steps: [
      { at: 'agent', note: '你刚才真实跑过的那一条。' },
      { at: 'disp', note: '这是浏览器动作：先排队拿浏览器名额（同站 2 条、全部 4 条），再按 10 秒间隔限速。' },
      { at: 0, result: 'NEED_LOGIN', note: 'NEED_LOGIN 在 FINAL_CODES 里：换工具也没用，所以直接停，不往下试。' },
      { at: 'agent', note: '错误里的 hint 是写给 agent 的下一步：让用户自己登录，绝不替他登录。' },
    ],
    out: '{"ok": false, "channel": "linkedin", "action": "jobs",\n "items": [],\n "error": {"code": "NEED_LOGIN",\n   "message": "LinkedIn search requires an active signed-in\n               LinkedIn browser session",\n   "hint": "Run `agent-reach login linkedin` and ask the user\n            to log in … Never log in for them."}}',
  },
  {
    id: 'public', label: '没加渠道：先走公开网页', cmd: 'agent-reach reddit search "corgi"',
    rows: ['public-web', 'opencli'],
    steps: [
      { at: 'agent', note: 'Reddit 渠道还没 add。' },
      { at: 'disp', note: '_channel_added 返回 false，而这个 Action 声明了 public_web：先试公开网页，最多用一半时间预算。' },
      { at: 0, result: 'ok', note: '公开搜索有结果，直接返回，不装工具、不要登录。' },
      { at: 'agent', note: 'backend 标成 public-web，agent 知道这只是公开摘要，不是站内数据。' },
    ],
    out: '{"ok": true, "channel": "reddit", "backend": "public-web",\n "items": [{"title": "…", "url": "…",\n   "raw": {"access": "public",\n           "completeness_verified": false}}]}',
  },
  {
    id: 'rate', label: '被限流：整个渠道冷却', cmd: 'agent-reach twitter search "LLM"',
    rows: ['opencli'],
    steps: [
      { at: 'agent', note: '实验渠道，平台反爬严。' },
      { at: 'disp', note: '先查 cooldown：这次还没有冷却记录。' },
      { at: 0, result: 'RATE_LIMITED', note: '平台说限流了。RATE_LIMITED 是最终错误，而且写进 cooldowns：整个渠道 3600 秒内所有入口、所有工具都不再请求。' },
      { at: 'agent', note: 'hint 告诉 agent 等多久，不要换工具硬试。这条规则是代码执行的，不靠 agent 自觉。' },
    ],
    out: '{"ok": false, "channel": "twitter",\n "error": {"code": "RATE_LIMITED",\n   "hint": "Reach pauses this channel; respect\n            retry_after_seconds and do not switch backends."}}',
  },
]

const POS = { agent: [80, 150], disp: [270, 150] } as const
const rowY = (i: number, n: number) => 150 + (i - (n - 1) / 2) * 90
const BX = 520

function tone(r?: string) {
  if (!r) return ''
  if (r === 'ok') return ' done'
  if (r === 'skipped') return ''
  return ' bad'
}

export function ReachLab() {
  const mood = useMood()
  const [sid, setSid] = useState(SCENARIOS[0].id)
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const sc = SCENARIOS.find((s) => s.id === sid)!
  const last = sc.steps.length - 1
  const cur = step >= 0 ? sc.steps[step] : null

  const next = () => {
    if (step >= last) { setPlaying(false); return }
    const s = step + 1
    setStep(s)
    const r = sc.steps[s].result
    mood(s === last ? (sc.out.includes('"ok": true') ? 'done' : 'error') : r && r !== 'ok' && r !== 'skipped' ? 'error' : 'working')
  }
  useInterval(next, 1300, playing)
  const pick = (id: string) => { setSid(id); setStep(-1); setPlaying(false) }

  // Latest result per backend row, up to the current step.
  const results: Record<number, string> = {}
  sc.steps.slice(0, step + 1).forEach((s) => { if (typeof s.at === 'number' && s.result) results[s.at] = s.result })
  const at = (w: Where): readonly [number, number] => (typeof w === 'number' ? [BX - 70, rowY(w, sc.rows.length)] : POS[w])
  const [px, py] = cur ? at(cur.at) : POS.agent

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row" role="tablist" aria-label="场景">
        {SCENARIOS.map((s) => (
          <button key={s.id} role="tab" aria-selected={s.id === sid} className={`btn${s.id === sid ? '' : ' quiet'}`} onClick={() => pick(s.id)}>{s.label}</button>
        ))}
      </div>
      <div className="two">
        <div className="panel">
          <p className="kicker" style={{ fontFamily: 'var(--font-mono)' }}>$ {sc.cmd}</p>
          <div className="svgwrap">
            <svg viewBox="0 0 640 300" role="img" aria-label="一次 agent-reach 调用的路径">
              <ArrowDefs />
              <path d={`M${POS.agent[0] + 52} 150H${POS.disp[0] - 62}`} className={`edge${cur?.at === 'disp' ? ' hot' : ''}`} markerEnd={cur?.at === 'disp' ? 'url(#arh)' : 'url(#ar)'} />
              {sc.rows.map((_, i) => {
                const y = rowY(i, sc.rows.length)
                const hot = cur?.at === i
                return <path key={i} d={`M${POS.disp[0] + 62} 150C${POS.disp[0] + 130} 150 ${BX - 150} ${y} ${BX - 72} ${y}`} className={`edge${hot ? ' hot' : results[i] ? ' done' : ''}`} markerEnd={hot ? 'url(#arh)' : 'url(#ar)'} strokeDasharray={results[i] === 'skipped' ? '4 5' : undefined} />
              })}
              <g className={`node${cur?.at === 'agent' ? ' hot' : ''}`}><rect x={28} y={133} width={104} height={34} rx={17} /><text x={80} y={155} textAnchor="middle">Agent</text></g>
              <g className={`node${cur?.at === 'disp' ? ' hot' : ''}`}><rect x={208} y={128} width={124} height={44} rx={6} /><text x={270} y={147} textAnchor="middle">run_action</text><text x={270} y={163} textAnchor="middle" className="tick">dispatch.py</text></g>
              {sc.rows.map((name, i) => {
                const y = rowY(i, sc.rows.length)
                const r = results[i]
                return (
                  <g key={name} className={`node${cur?.at === i && !r ? ' hot' : ''}${tone(r)}`} opacity={r === 'skipped' ? 0.55 : 1}>
                    <rect x={BX - 70} y={y - 20} width={140} height={40} rx={6} />
                    <text x={BX} y={y - 2} textAnchor="middle">{name}</text>
                    <text x={BX} y={y + 13} textAnchor="middle" className="tick">{i === 0 ? '首选' : '备选'}</text>
                    {r && <motion.text key={r} x={BX} y={y + 36} textAnchor="middle" className={`elabel${r === 'ok' ? '' : ' hot'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{r}</motion.text>}
                  </g>
                )
              })}
              {cur && <motion.circle r={7} className="packet" initial={false} animate={{ cx: px + (typeof cur.at === 'number' ? -8 : 0), cy: py - 28 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} />}
              <text x={320} y={290} textAnchor="middle" className="tick">{cur ? `第 ${step + 1} / ${sc.steps.length} 步` : '按"下一步"开始'}</text>
            </svg>
          </div>
          <div className="row">
            <button className="btn" onClick={next} disabled={step >= last}>下一步</button>
            <button className="btn quiet" onClick={() => { if (step >= last) setStep(-1); setPlaying(!playing) }}>{playing ? '暂停' : '自动播放'}</button>
            <button className="btn quiet" onClick={() => { setStep(-1); setPlaying(false) }}>重来</button>
          </div>
        </div>
        <div className="col">
          <h3>这一步发生了什么</h3>
          <AnimatePresence mode="wait">
            <motion.p key={`${sid}-${step}`} className="small" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {cur ? cur.note : '选一个场景，然后一步步走。每个场景对应 run_action() 里的一条分支。'}
            </motion.p>
          </AnimatePresence>
          {cur?.result && <span className={`chip ${cur.result === 'ok' ? 'good' : cur.result === 'skipped' ? 'plain' : RETRY.has(cur.result) ? 'warn' : 'bad'}`}>
            {cur.result === 'ok' ? '成功，返回' : cur.result === 'skipped' ? '暂停中，跳过' : RETRY.has(cur.result) ? '可重试，换下一个' : '最终错误，停止'}
          </span>}
        </div>
      </div>
      <div className="col">
        <h3>agent 收到的 JSON</h3>
        <pre className="log">{step >= last ? sc.out : '…'}</pre>
      </div>
    </div>
  )
}
