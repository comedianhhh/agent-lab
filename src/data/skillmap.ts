/**
 * The agent-engineering skill map: six tiers from foundations to specialisations, with prerequisite edges.
 * Public version: every node starts as 'learn'; ticking a node in the map marks it done.
 * A local, gitignored skillmap.private.ts (personal status and evidence) overrides this file when present.
 */
export type Status = 'have' | 'thin' | 'learn' | 'later'

export interface SkillNode {
  id: string
  label: string
  tier: number
  row: number
  deps: string[]
  status: Status
  what: string
  evidence: string
  lesson?: string
}

export const EVIDENCE_LABEL = '学会的标志'

export const TIERS = ['基础', 'LLM 基础', 'Agent 核心', '编排与协议', '质量与生产', '方向与交付']

export const STATUS: Record<Status, { label: string; tone: string }> = {
  have: { label: '已有证据', tone: 'good' },
  thin: { label: '证据薄', tone: 'warn' },
  learn: { label: '要学', tone: 'cool' },
  later: { label: '以后再说', tone: 'plain' },
}

export const NODES: SkillNode[] = [
  { id: 'python', label: 'Python', tier: 0, row: 0, deps: [], status: 'learn', what: '能现场手写：数据结构、asyncio、pytest。', evidence: '不查资料，30 分钟手写 LRU 并自己写 assert。', lesson: 'practice' },
  { id: 'http', label: 'HTTP / 异步服务', tier: 0, row: 1, deps: [], status: 'learn', what: 'REST、FastAPI、超时、重试、幂等。', evidence: '写一个带超时、重试、幂等键的 FastAPI 服务并有测试。' },
  { id: 'sql', label: 'SQL / Postgres', tier: 0, row: 2, deps: [], status: 'learn', what: '建模、索引、事务、EXPLAIN。', evidence: '能看懂 EXPLAIN ANALYZE，并用索引把一条慢查询提速。' },
  { id: 'ts', label: 'TypeScript / React', tier: 0, row: 3, deps: [], status: 'learn', what: '组件、状态、和后端的流式接口对接。', evidence: '前端能消费一个流式接口，边收边渲染。' },

  { id: 'llmapi', label: 'LLM API', tier: 1, row: 0, deps: ['python', 'http'], status: 'learn', what: '消息格式、流式输出、token 和成本、限流。', evidence: '能算出一次调用的 token 和成本，并处理 429。' },
  { id: 'prompt', label: 'Prompt 设计', tier: 1, row: 1, deps: ['llmapi'], status: 'learn', what: '角色、长度、语气；把约束写清楚。', evidence: '改一处 prompt，能用 eval 数字说明变好还是变坏。' },
  { id: 'structured', label: '结构化输出', tier: 1, row: 2, deps: ['llmapi'], status: 'learn', what: 'JSON schema、strict 模式、校验和修复重试。', evidence: '输出过 schema 校验，失败时自动带错误重试。', lesson: 'agent' },
  { id: 'embed', label: 'Embedding', tier: 1, row: 3, deps: ['llmapi'], status: 'learn', what: '向量、相似度、维度、模型选择。', evidence: '能解释为什么选这个 embedding 模型和维度。', lesson: 'rag' },

  { id: 'tools', label: '工具调用', tier: 2, row: 0, deps: ['structured'], status: 'learn', what: 'tool_use / tool_result 循环、参数 schema。', evidence: 'agent 能连续调用多个工具并处理工具报错。', lesson: 'agent' },
  { id: 'loop', label: 'Agent 循环', tier: 2, row: 1, deps: ['tools', 'prompt'], status: 'learn', what: '超时、预算、自检、何时停：模型以外的一切。', evidence: '不用框架写出带预算、超时和停止条件的 agent 循环。', lesson: 'agent' },
  { id: 'context', label: 'Context engineering', tier: 2, row: 2, deps: ['loop'], status: 'learn', what: '上下文预算、压缩、大输出写文件、子 agent。', evidence: '长任务里上下文不爆：会压缩、会把大输出写文件。', lesson: 'agent' },
  { id: 'rag', label: '检索 / RAG', tier: 2, row: 3, deps: ['embed', 'sql'], status: 'learn', what: 'BM25 + 向量 + RRF、chunk、rerank、检索评测。', evidence: '有一张"纯向量 / 纯全文 / RRF"的 recall 对比表。', lesson: 'rag' },
  { id: 'memory', label: '长期记忆', tier: 2, row: 4, deps: ['rag'], status: 'learn', what: '写什么、什么时候取、怎么遗忘。', evidence: '说清楚什么该记、什么时候取、什么时候忘。', lesson: 'rag' },

  { id: 'langgraph', label: 'LangGraph', tier: 3, row: 0, deps: ['loop'], status: 'learn', what: '节点、条件边、interrupt、checkpointer。', evidence: '画得出一张图的节点、条件边和 interrupt 位置。', lesson: 'langgraph' },
  { id: 'mcp', label: 'MCP', tier: 3, row: 1, deps: ['tools'], status: 'learn', what: '握手、tools/list、tools/call、stdio 和 HTTP 传输。', evidence: '自己写过一个 MCP server 并被客户端调用。', lesson: 'mcp' },
  { id: 'sse', label: '流式推送', tier: 3, row: 2, deps: ['http'], status: 'learn', what: 'SSE、WebSocket、WebRTC 怎么选。', evidence: '用 curl -N 看到服务端一步一步推出来的事件。', lesson: 'sse' },
  { id: 'multi', label: '多 agent', tier: 3, row: 3, deps: ['langgraph', 'context'], status: 'later', what: '编排者-执行者、分工、结果汇总。', evidence: '先把单 agent 做扎实，再考虑拆分。' },
  { id: 'a2a', label: 'A2A 协议', tier: 3, row: 4, deps: ['mcp', 'multi'], status: 'later', what: 'agent 之间的协作协议，2026 年发布 v1.0。', evidence: '了解概念即可。' },

  { id: 'evals', label: 'Evals', tier: 4, row: 0, deps: ['loop'], status: 'learn', what: '回归集、确定性检查、LLM-as-judge 校准。', evidence: '有回归集，改代码前后能跑出对比分数。', lesson: 'evals' },
  { id: 'obs', label: 'Tracing', tier: 4, row: 1, deps: ['evals'], status: 'learn', what: 'trace 和 span、token、成本、p95、告警。', evidence: '能在 trace 里看到每一步的 token、耗时和成本。', lesson: 'evals' },
  { id: 'durable', label: 'Durable execution', tier: 4, row: 2, deps: ['langgraph'], status: 'learn', what: 'Temporal：activity 重试、事件历史重放。', evidence: '杀掉 worker 后任务能从断点继续。', lesson: 'durable' },
  { id: 'security', label: 'Agent 安全', tier: 4, row: 3, deps: ['tools', 'rag'], status: 'learn', what: '间接注入、致命三件套、沙箱、人工确认。', evidence: '有一张"加防护前 vs 后"的注入成功率表。', lesson: 'security' },
  { id: 'rls', label: '多租户 / RLS', tier: 4, row: 4, deps: ['sql'], status: 'learn', what: 'Postgres policy、角色、SET LOCAL。', evidence: '测试证明 A 写的数据 B 查不到。', lesson: 'rls' },

  { id: 'voice', label: '实时语音 agent', tier: 5, row: 0, deps: ['sse', 'loop', 'obs'], status: 'learn', what: 'STT → LLM → TTS、判断说完、打断、分段延迟。', evidence: '能报出 STT / LLM / TTS 各段的 p50 和 p95 延迟。', lesson: 'voice' },
  { id: 'coding', label: 'Coding agent', tier: 5, row: 1, deps: ['loop'], status: 'learn', what: '拆任务、定验收标准、验证 AI 写的代码。', evidence: '能给 coding agent 写清验收标准并验证它的代码。' },
  { id: 'computer', label: 'Browser use', tier: 5, row: 2, deps: ['loop', 'security'], status: 'later', what: '让 agent 操作浏览器和桌面。', evidence: '暂不需要。' },
  { id: 'deploy', label: '云部署（AWS）', tier: 5, row: 3, deps: ['http'], status: 'learn', what: 'ECS、RDS、IAM role、Bedrock、CloudWatch。', evidence: '把一个服务真的跑在 AWS 上，并讲清每个组件。', lesson: 'aws' },
  { id: 'fde', label: '面向客户交付', tier: 5, row: 4, deps: ['deploy', 'evals'], status: 'learn', what: '访谈、拆需求、交付、用数字说明效果。', evidence: '有一页"需求 → 方案 → 结果"的案例。' },
]

export interface Goal {
  id: string
  name: string
  blurb: string
  nodes: string[]
}

export const GOALS: Goal[] = [
  { id: 'voice', name: '实时语音 agent 工程师', blurb: '语音 agent 平台和创业公司', nodes: ['python', 'http', 'llmapi', 'prompt', 'structured', 'tools', 'loop', 'context', 'mcp', 'sse', 'evals', 'obs', 'memory', 'rag', 'embed', 'sql', 'deploy', 'voice'] },
  { id: 'applied', name: 'Applied AI 全栈', blurb: '把 agent 做进 SaaS 产品', nodes: ['python', 'http', 'sql', 'ts', 'llmapi', 'prompt', 'structured', 'embed', 'tools', 'loop', 'rag', 'langgraph', 'sse', 'evals', 'obs', 'rls', 'deploy'] },
  { id: 'fde', name: 'Forward-deployed', blurb: '驻场给客户落地 agent', nodes: ['python', 'http', 'sql', 'llmapi', 'prompt', 'structured', 'embed', 'tools', 'loop', 'rag', 'mcp', 'evals', 'security', 'deploy', 'fde'] },
  { id: 'platform', name: 'Agent 平台 / 基础设施', blurb: 'agent runtime / 平台团队', nodes: ['python', 'http', 'sql', 'llmapi', 'structured', 'tools', 'loop', 'context', 'langgraph', 'multi', 'mcp', 'a2a', 'evals', 'obs', 'durable', 'security', 'rls', 'deploy'] },
]
