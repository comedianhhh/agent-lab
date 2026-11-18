import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useMood } from '../mood'
import { ArrowDefs, Packet, Toggle } from './kit'

/** memory-service on AWS. A request hops box to box; click a box for what it is and why it's there. */
const BOX = {
  user: [20, 120, '客户端', 'Next.js / curl', '发 HTTPS 请求。'],
  alb: [170, 120, 'ALB', '负载均衡', 'Application Load Balancer：TLS 终止、健康检查、把流量分给多个容器。放在公有子网。'],
  ecs: [330, 120, 'ECS Fargate', 'FastAPI 容器', '不用管服务器的容器服务。镜像放 ECR。task role 决定这个容器能调哪些 AWS 服务。放在私有子网。'],
  rds: [520, 40, 'RDS Postgres', 'pgvector + RLS', '托管 Postgres，打开 pgvector 扩展。只允许 ECS 的安全组访问，不放公网。'],
  bedrock: [520, 120, 'Bedrock', 'Claude · Converse', '托管模型 API。用 IAM 鉴权，数据留在自己的账号里。'],
  cw: [520, 200, 'CloudWatch', '日志 + 指标', '容器的 stdout 自动进来；在这里设 p95 延迟和错误率告警。'],
} as const
type B = keyof typeof BOX
const mid = (b: B, side: 'l' | 'r') => [BOX[b][0] + (side === 'r' ? 130 : 0), BOX[b][1] + 26] as const
const link = (a: B, b: B) => { const [x1, y1] = mid(a, 'r'), [x2, y2] = mid(b, 'l'); return `M${x1} ${y1} C${x1 + 30} ${y1} ${x2 - 30} ${y2} ${x2} ${y2}` }
const HOPS: [B, B, string][] = [
  ['user', 'alb', 'POST /users/u_42/memories/search'],
  ['alb', 'ecs', '转发到健康的容器'],
  ['ecs', 'rds', "SET LOCAL app.user_id = 'u_42'; 向量 + 全文检索"],
  ['ecs', 'bedrock', 'converse(): 把检索结果交给 Claude 总结'],
  ['ecs', 'cw', '一行 JSON 日志：耗时、token、成本'],
]

export function AwsLab() {
  const mood = useMood()
  const [hop, setHop] = useState(-1)
  const [pick, setPick] = useState<B>('ecs')
  const [key, setKey] = useState(false)
  const [publicDb, setPublicDb] = useState(false)
  const play = () => {
    setHop(0)
    mood('working')
    HOPS.forEach((_, i) => setTimeout(() => { setHop(i); if (i === HOPS.length - 1) mood('done') }, i * 750))
  }
  const warn = [
    key && '代码里放了 access key：一旦泄漏（日志、镜像、Git 历史），别人就能用你的账号调 Bedrock。改用 ECS task role，代码里不出现任何 key。',
    publicDb && 'RDS 开了公网访问：数据库直接暴露在互联网上。放私有子网，安全组只放行 ECS。',
  ].filter(Boolean) as string[]

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel">
        <div className="svgwrap">
          <svg viewBox="0 0 680 280" role="img" aria-label="AWS 架构与请求路径">
            <ArrowDefs />
            <rect x={150} y={20} width={520} height={250} rx={10} style={{ fill: 'none', stroke: 'var(--rule)' }} strokeDasharray="4 4" />
            <text x={160} y={36} className="tick">VPC</text>
            {HOPS.map(([a, b], i) => <path key={i} d={link(a, b)} className={`edge${i === hop ? ' hot' : i < hop ? ' done' : ''}`} markerEnd={i === hop ? 'url(#arh)' : 'url(#ar)'} />)}
            {(Object.keys(BOX) as B[]).map((b) => {
              const [x, y, t, sub] = BOX[b]
              const bad = (b === 'ecs' && key) || (b === 'rds' && publicDb)
              return (
                <g key={b} className={`node${pick === b ? ' hot' : ''}${bad ? ' bad' : ''}`} role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => setPick(b)} onKeyDown={(e) => { if (e.key === 'Enter') setPick(b) }}>
                  <rect x={x} y={y} width={130} height={52} rx={8} />
                  <text x={x + 65} y={y + 22} textAnchor="middle">{t}</text>
                  <text x={x + 65} y={y + 39} textAnchor="middle" className="tick" style={pick === b ? { fill: 'var(--bg)', opacity: 0.75 } : undefined}>{sub}</text>
                </g>
              )
            })}
            {hop >= 0 && <Packet key={hop} d={link(HOPS[hop][0], HOPS[hop][1])} dur={0.6} />}
            {!key && <text x={395} y={196} textAnchor="middle" className="tick">task role → Bedrock / 日志</text>}
          </svg>
        </div>
        <AnimatePresence mode="wait">
          {hop >= 0 && <motion.p key={hop} className="small" style={{ fontFamily: 'var(--font-mono)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{HOPS[hop][2]}</motion.p>}
        </AnimatePresence>
        <div className="row">
          <button className="btn" onClick={play}>发一个请求</button>
          <Toggle id="a-key" label="代码里放 access key" checked={key} onChange={setKey} />
          <Toggle id="a-db" label="RDS 开公网访问" checked={publicDb} onChange={setPublicDb} />
        </div>
        {warn.map((w) => <div key={w} className="verdict bad">{w}</div>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={pick} className="tarot" initial={{ rotateX: -40, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <span className="kicker">点图里的方块切换</span>
          <h3>{BOX[pick][2]}</h3>
          <p style={{ position: 'relative' }}>{BOX[pick][4]}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
