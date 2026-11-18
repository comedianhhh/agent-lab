/** The 12-week plan and the week-1 list. A local, gitignored plan.private.ts overrides this file when present. */
export interface Project {
  id: string
  name: string
  short: string
  weeks: [number, number]
  goal: string
  out: string
  jd: string
  lessons: string[]
}

export const PROJECTS: Project[] = [
  { id: 'p1', name: '记忆服务', short: '记忆服务', weeks: [1, 2], goal: '多租户、持久化的记忆检索服务，部署到 AWS，包成 MCP server', out: '三种检索方式的 recall 对比表', jd: 'agent 平台、企业 AI 平台', lessons: ['langgraph', 'rag', 'rls', 'sse', 'mcp', 'aws'] },
  { id: 'p2', name: '手写 agent loop', short: '手写 agent loop', weeks: [3, 5], goal: '不用框架写出 harness，再和 apply-graph 对比', out: 'eval 分数随 harness 改动的变化表', jd: 'Applied AI、agent 基础设施', lessons: ['agent', 'evals'] },
  { id: 'p3', name: '实时语音 agent', short: '实时语音 agent', weeks: [6, 8], goal: 'LiveKit 级联管线：STT → LLM → TTS，接上记忆 MCP', out: '分段延迟 p50 / p95 + 90 秒演示视频 + 博客', jd: '语音 agent 平台和创业公司', lessons: ['voice'] },
  { id: 'p4', name: '长任务 + 安全', short: '长任务+安全', weeks: [9, 10], goal: '用 Temporal 跑能断点续跑的 agent，加沙箱和红队测试', out: '注入成功率：加防护前 vs 加防护后', jd: 'agent 平台 / 基础设施岗、AI security tester', lessons: ['durable', 'security'] },
  { id: 'p5', name: '给真实用户做', short: '真实用户', weeks: [11, 12], goal: '访谈一个真实用户，用 P1–P4 的积木做一个能用的 agent', out: '一页"需求 → 方案 → 结果"案例', jd: 'Forward-deployed engineer', lessons: [] },
]

export interface Day {
  date: string
  name: string
  title: string
  tasks: string[]
  py?: string
  story?: string
  lesson?: string
}

export const WEEK1: Day[] = [
  { date: '2026-11-02', name: '周一', title: 'LangGraph：走读 apply-graph', lesson: 'langgraph', tasks: ['手画 apply-graph：节点、条件边、interrupt 的位置', '写下三个问题的答案：reducer、确定性 trace 检查、interrupt 会重跑', '加一个 research_company 节点，用真实岗位跑一次'], py: '统计 web 日志：状态码计数 + 最慢 5 个请求' },
  { date: '2026-11-03', name: '周二', title: 'LangGraph 进阶 + SSE', lesson: 'sse', tasks: ['用 get_state_history 打印每一步快照', 'FastAPI /runs：graph.stream → SSE，用 curl -N 验证', '5 行笔记：SSE / WebSocket / 轮询怎么选'], py: '从零实现 LRU cache' },
  { date: '2026-11-04', name: '周三', title: '轻量日：读文档', lesson: 'rag', tasks: ['读 pgvector 和 Qdrant 文档，写笔记', '写 3 行笔记：两者怎么选'], py: 'token bucket 限流器（可注入时钟）' },
  { date: '2026-11-05', name: '周四', title: 'memory-service：建库 + RLS', lesson: 'rls', tasks: ['新仓库：docker compose（pgvector/pg16）+ /health + pytest', '建 memories 表（vector(384)）+ Alembic', 'RLS policy + 非 owner 角色 + SET LOCAL app.user_id', '测试：A 写入的记忆 B 查不到'], py: 'asyncio：20 个 URL、并发 5、超时、重试一次' },
  { date: '2026-11-06', name: '周五', title: '写入 + 混合检索', lesson: 'rag', tasks: ['POST messages：切块 → embedding → 写入（FakeEmbedder）', '向量 top-k + tsvector 全文检索 + 自己重写 RRF', 'HNSW 索引 + EXPLAIN ANALYZE 确认', '每次调用记录耗时和 token（JSON 日志）'], py: '计时 35 分钟：1 道 LeetCode medium' },
  { date: '2026-11-07', name: '周六', title: '第一版评测', lesson: 'evals', tasks: ['写 5 段合成对话并导入', '标注 20 条 query → 正确 memory id', 'eval/run.py：纯向量 / 纯全文 / RRF 的 recall@5 和 MRR', '记下这三个数字'], py: '给周四、周五的代码补 pytest fixture' },
  { date: '2026-11-08', name: '周日', title: '收尾 + 复盘', tasks: ['README：架构、怎么跑、RLS 设计、recall 对比表', 'push，仓库保持 public', '复盘 3 行', '读 Anthropic "Contextual Retrieval"'] },
]

export const weekIds = () =>
  WEEK1.flatMap((d, i) => [...d.tasks.map((_, j) => `w1-${i}-${j}`), ...(d.py ? [`w1-${i}-py`] : []), ...(d.story ? [`w1-${i}-st`] : [])])
