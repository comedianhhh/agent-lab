import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useMood } from '../mood'
import { ArrowDefs, useInterval } from './kit'

/** One session between a host's client, an MCP server, and the database behind it (JSON-RPC 2.0). */
const LANES = [['host', 'Host + Client', 'Claude Desktop'], ['server', 'MCP Server', 'memory-mcp'], ['db', '数据库', 'Postgres']] as const
type Lane = (typeof LANES)[number][0]
interface Msg { from: Lane; to: Lane; label: string; body: string; note: string }

const MSGS: Msg[] = [
  { from: 'host', to: 'server', label: 'initialize', body: '{"jsonrpc":"2.0","id":1,"method":"initialize",\n "params":{"protocolVersion":"…","capabilities":{},\n           "clientInfo":{"name":"claude-desktop"}}}', note: '握手第一步：告诉 server 自己支持的协议版本和能力。' },
  { from: 'server', to: 'host', label: 'result: capabilities', body: '{"jsonrpc":"2.0","id":1,"result":{\n  "capabilities":{"tools":{}},\n  "serverInfo":{"name":"memory-mcp"}}}', note: 'server 声明自己有 tools。没声明的能力，client 不会去调。' },
  { from: 'host', to: 'server', label: 'notifications/initialized', body: '{"jsonrpc":"2.0","method":"notifications/initialized"}', note: '通知没有 id，不需要回复。握手结束。' },
  { from: 'host', to: 'server', label: 'tools/list', body: '{"jsonrpc":"2.0","id":2,"method":"tools/list"}', note: 'host 拿到工具清单，把名字、描述、参数 schema 放进模型的上下文。' },
  { from: 'server', to: 'host', label: 'result: [search_memory, write_memory]', body: '{"tools":[{"name":"search_memory",\n  "description":"Search a user\'s saved memories.",\n  "inputSchema":{"type":"object","properties":{\n    "user_id":{"type":"string"},"query":{"type":"string"}}}}, …]}', note: '描述写得好不好，直接决定模型会不会用、用得对不对。' },
  { from: 'host', to: 'server', label: 'tools/call search_memory', body: '{"jsonrpc":"2.0","id":3,"method":"tools/call",\n "params":{"name":"search_memory",\n  "arguments":{"user_id":"u_42","query":"Biscuit 的生日"}}}', note: '模型决定调用工具；host 可以在这里弹出确认框。' },
  { from: 'server', to: 'db', label: 'SELECT … ORDER BY embedding <=> $1', body: "SET LOCAL app.user_id = 'u_42';\nSELECT text FROM memories\nORDER BY embedding <=> $1 LIMIT 5;", note: 'server 内部怎么实现，协议不管。这里接上第 1 周的 memory-service（带 RLS）。' },
  { from: 'db', to: 'server', label: '5 rows', body: '[{"text":"Mia adopted a corgi puppy named Biscuit in March."}, …]', note: '' },
  { from: 'server', to: 'host', label: 'result: content', body: '{"jsonrpc":"2.0","id":3,"result":{"content":[\n  {"type":"text","text":"Biscuit — adopted in March …"}]}}', note: '结果作为 tool_result 回到模型的上下文。结果要小而结构化。' },
]
const LX: Record<Lane, number> = { host: 110, server: 380, db: 640 }
const Y0 = 70, DY = 34

export function McpLab() {
  const mood = useMood()
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [http, setHttp] = useState(false)
  const next = () => {
    if (step >= MSGS.length - 1) { setPlaying(false); mood('done'); return }
    setStep(step + 1)
    mood('working')
  }
  useInterval(next, 1000, playing)
  const cur = step >= 0 ? MSGS[step] : null
  const H = Y0 + MSGS.length * DY + 20

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel">
        <div className="svgwrap">
          <svg viewBox={`0 0 760 ${H}`} role="img" aria-label="MCP 会话时序图">
            <ArrowDefs />
            {LANES.map(([id, name, sub]) => (
              <g key={id}>
                <g className="node"><rect x={LX[id] - 70} y={8} width={140} height={40} rx={6} /><text x={LX[id]} y={26} textAnchor="middle">{name}</text><text x={LX[id]} y={41} textAnchor="middle" className="tick">{sub}</text></g>
                <line x1={LX[id]} x2={LX[id]} y1={48} y2={H - 6} className="axis" strokeDasharray="3 4" />
              </g>
            ))}
            <text x={(LX.host + LX.server) / 2} y={62} textAnchor="middle" className="tick">{http ? 'Streamable HTTP（远程，需要 OAuth）' : 'stdio（host 启动子进程）'}</text>
            {MSGS.map((m, i) => {
              if (i > step) return null
              const y = Y0 + i * DY + 14
              const x1 = LX[m.from], x2 = LX[m.to]
              const dir = x2 > x1 ? 1 : -1
              const hot = i === step
              return (
                <g key={i}>
                  <motion.line x1={x1} y1={y} y2={y} className={`edge${hot ? ' hot' : ' done'}`} markerEnd={hot ? 'url(#arh)' : 'url(#ar)'}
                    initial={{ x2: x1 }} animate={{ x2: x2 - dir * 4 }} transition={{ duration: 0.45, ease: 'easeOut' }} />
                  <motion.text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" className={`elabel${hot ? ' hot' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>{m.label}</motion.text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="row">
          <button className="btn" onClick={next} disabled={step >= MSGS.length - 1}>下一条消息</button>
          <button className="btn quiet" onClick={() => { if (step >= MSGS.length - 1) setStep(-1); setPlaying(!playing) }}>{playing ? '暂停' : '自动播放'}</button>
          <button className="btn quiet" onClick={() => { setStep(-1); setPlaying(false) }}>重来</button>
          <label className="ctl" htmlFor="mcp-http"><input type="checkbox" id="mcp-http" checked={http} onChange={(e) => setHttp(e.target.checked)} />远程 server</label>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {cur && (
          <motion.div key={step} className="col" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bh"><h3>{cur.label}</h3><span className="kicker">{cur.from} → {cur.to}</span></div>
            <pre className="log">{cur.body}</pre>
            {cur.note && <p className="small muted">{cur.note}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
