import { RESOURCES, type Resource } from './resources'

export type LabId =
  | 'loop' | 'graph' | 'hybrid' | 'rls' | 'sse' | 'evals'
  | 'mcp' | 'voice' | 'durable' | 'injection' | 'aws' | 'lru' | 'reach'

export interface Concept {
  h: string
  body: string[]
  code?: string
}

export interface Lesson {
  id: string
  n: number
  title: string
  en: string
  when: string
  project: string
  summary: string
  concepts: Concept[]
  practice: string[]
  lab: LabId
  labTitle: string
  resources: Resource[]
}

const L: Omit<Lesson, 'resources'>[] = [
  {
    id: 'practice', n: 0, title: '手写 Python', en: 'Live coding', when: '每天 45 分钟', project: '全程',
    summary: '结对编程轮考的不是框架知识。每天关掉 AI 手写一道实用题，练的是拆题、边写边说、自己测。',
    lab: 'lru', labTitle: 'LRU cache：哈希表 + 双向链表',
    concepts: [
      { h: '先说思路，再写代码', body: ['面试官评的是你怎么想。开写前用一两句话说清楚数据结构和复杂度，再问一句"这样可以吗"。', '卡住时把卡点说出来，比沉默好得多。'] },
      { h: 'LRU 为什么要两个结构', body: ['哈希表负责 O(1) 找到节点，双向链表负责 O(1) 把节点挪到最前、从尾部淘汰。只用其中一个，总有一个操作变成 O(n)。', 'Python 里 OrderedDict 的 move_to_end 和 popitem(last=False) 能一行做到，但面试常要求手写一遍。'],
        code: 'class Node:\n    __slots__ = ("k", "v", "prev", "next")\n\nclass LRU:\n    def __init__(self, cap):\n        self.cap, self.map = cap, {}\n        self.head, self.tail = Node(), Node()   # 哨兵节点，省掉判空\n        self.head.next, self.tail.prev = self.tail, self.head' },
      { h: '自己写测试', body: ['写完先跑三个用例：正常、边界（容量 1）、淘汰顺序。面试里主动写 assert 会加分。'] },
      { h: '时间盒', body: ['LeetCode medium 计时 35 分钟；超时就看题解，第二天再闭卷重写一遍。'] },
    ],
    practice: ['周一：日志统计（状态码计数 + 最慢 5 个请求）', '周二：从零写 LRU cache', '周三：token bucket 限流器（时钟可注入）', '周四：asyncio 并发抓取 + 超时 + 重试', '周五：计时做 1 道 LeetCode medium'],
  },
  {
    id: 'agent', n: 1, title: 'Agent 循环与 harness', en: 'Agent loop', when: '第 3–5 周', project: 'P2',
    summary: '模型只负责"下一步做什么"。harness 是模型以外的一切：组装上下文、执行工具、处理失败、决定何时结束。2026 年大家优化的主要是 harness。',
    lab: 'loop', labTitle: '一次 agent 运行，打开故障开关看 harness 怎么接',
    concepts: [
      { h: 'Workflow 还是 agent', body: ['流程固定就写成 workflow（代码决定路径）；只有路径事先说不清时才让模型决定下一步。能用 workflow 的地方不要用 agent。'] },
      { h: '工具调用循环', body: ['循环很短：发消息 → 模型返回 tool_use → 你执行工具 → 把 tool_result 追加回去 → 再调模型，直到模型不再要工具。', '难点在循环外面：超时、重试、token 预算、什么时候强制停。'],
        code: 'while True:\n    resp = client.messages.create(model=M, tools=TOOLS, messages=msgs)\n    msgs.append({"role": "assistant", "content": resp.content})\n    calls = [b for b in resp.content if b.type == "tool_use"]\n    if not calls:\n        break\n    msgs.append({"role": "user", "content": [run(c) for c in calls]})' },
      { h: 'Context engineering', body: ['上下文是有限预算。大块工具输出写进文件、只留路径和摘要；旧的工具结果压缩成一行；子任务交给子 agent，只拿回结论。'] },
      { h: '结构化输出要校验', body: ['用 strict JSON schema 约束输出，后端再用 Pydantic 校验；失败时把错误回喂给模型重试一次（repair）。重试放在客户端的话，每次多一个移动网络往返，所以放在后端。'] },
      { h: '结束前自检', body: ['退出前用确定性代码检查结果（数字有没有来源、格式对不对），不要让模型自己说"我检查过了"。'] },
    ],
    practice: ['不用框架，用官方 SDK 写出工具调用循环', '加 strict schema + Pydantic 校验 + 一次 repair 重试', '工具输出超过 4k token 就写文件，只留路径', '每一步记 token、耗时、成本'],
  },
  {
    id: 'langgraph', n: 2, title: 'LangGraph', en: 'State graphs', when: '第 1 周 周一–周二', project: 'P1',
    summary: '把 agent 写成状态图：节点是函数，边由代码决定，框架负责存档、断点续跑和人工审批。你的 apply-graph 已经是一张这样的图。',
    lab: 'graph', labTitle: 'apply-graph 单步运行',
    concepts: [
      { h: 'StateGraph 和 reducer', body: ['state 是一个 TypedDict，每个节点只返回要改的字段。字段默认覆盖；用 Annotated[list, operator.add] 声明 reducer 就变成追加。apply-graph 的 log 就是这样。'],
        code: 'class ApplyState(TypedDict, total=False):\n    draft: str\n    attempts: int\n    log: Annotated[list[str], operator.add]   # 追加，不覆盖' },
      { h: '条件边', body: ['add_conditional_edges(node, fn)：fn(state) 返回下一个节点名。循环（重写 → 再检查）就是条件边指回前面的节点。', 'apply-graph 的边全由确定性代码决定，模型只填节点。'] },
      { h: 'interrupt 和恢复', body: ['节点里调用 interrupt(payload)，图会暂停并存档；之后用 Command(resume=...) 恢复。恢复时这个节点从头重跑，所以 interrupt 上面不能有副作用。'] },
      { h: 'Checkpointer 和 thread_id', body: ['每一步都存快照（InMemorySaver / SqliteSaver / Postgres），按 thread_id 恢复，换个进程也能接着跑。get_state_history() 列出所有快照，这就是"调试多轮 tool trace"。'] },
      { h: 'Streaming', body: ['graph.stream(..., stream_mode="updates") 每走一步吐出一个节点的输出，接到 SSE 上前端就能看到进度。'] },
    ],
    practice: ['手画 apply-graph 并讲清每条边', '加一个 research_company 节点', '用 get_state_history 找出 state 在哪一步变了', 'FastAPI + SSE 把每一步推给前端'],
  },
  {
    id: 'rag', n: 3, title: '混合检索与 RAG', en: 'Hybrid retrieval', when: '第 1–2 周', project: 'P1',
    summary: '关键词检索擅长精确的名字和编号，向量检索擅长同义改写。两边各排一次名，用 RRF 按名次合并，分数不用校准。你的 jobs-mcp/rank.py 已经这么做了。',
    lab: 'hybrid', labTitle: 'BM25 + 语义向量 + RRF',
    concepts: [
      { h: 'BM25', body: ['词频越高分越高，但有饱和（k1）；越罕见的词权重越大（IDF）；长文档会被惩罚（b）。精确匹配编号、人名时很稳。'] },
      { h: '向量检索', body: ['把文本变成 embedding，按余弦相似度找最近的。"dog" 能找到 "corgi"，但对 "unit 1207" 这种编号基本没信号。', 'pgvector 的 HNSW 索引查得快但是近似结果；用 EXPLAIN ANALYZE 确认走了索引。'] },
      { h: 'Reciprocal Rank Fusion', body: ['每条结果得分 = Σ 1 / (k + 名次)。只看名次，所以 BM25 分数和余弦相似度不用放到同一个尺度。k 通常取 60。'],
        code: 'def rrf(*rankings, k=60):\n    score = defaultdict(float)\n    for ranking in rankings:\n        for rank, doc_id in enumerate(ranking, start=1):\n            score[doc_id] += 1 / (k + rank)\n    return sorted(score, key=score.get, reverse=True)' },
      { h: '先有评测再调参', body: ['标 50 条 query → 正确答案，算 recall@5 和 MRR。没有这张表，改 chunk 大小、加 rerank 都只是凭感觉。'] },
      { h: 'Contextual retrieval', body: ['切块前给每块加一句"这块在整篇文档里讲什么"，embedding 和 BM25 都用加了上下文的版本，检索失败率会明显下降。'] },
    ],
    practice: ['memory-service：pgvector + tsvector 全文检索', '自己重写一遍 RRF（不复制 rank.py）', '标 20 条 query，比较三种方式的 recall@5', '下周补齐 50 条，再试 rerank'],
  },
  {
    id: 'rls', n: 4, title: 'Postgres 行级安全', en: 'Row-level security', when: '第 1 周 周四', project: 'P1',
    summary: '多租户 agent 平台里，生成的 SQL 或检索代码少写一个 WHERE 就会漏出别人的数据。RLS 在数据库层兜底。',
    lab: 'rls', labTitle: '切开关，看哪些行会漏',
    concepts: [
      { h: 'Policy', body: ['开启 RLS 后，每条查询都会被自动加上 policy 的条件。USING 管读，WITH CHECK 管写。'],
        code: "ALTER TABLE memories ENABLE ROW LEVEL SECURITY;\nCREATE POLICY own_rows ON memories\n  USING (user_id = current_setting('app.user_id', true)::uuid);" },
      { h: '谁会绕过', body: ['表的 owner 和有 BYPASSRLS 属性的角色默认不受 RLS 限制（除非 FORCE ROW LEVEL SECURITY）。应用要用一个单独的、权限最小的角色连接。'] },
      { h: 'SET LOCAL', body: ['连接池里的连接会被复用，所以在事务里用 SET LOCAL，事务结束就失效；用 SET 的话，上一个用户的值会留给下一个请求。'] },
      { h: '测试要两头都测', body: ['A 写入的 B 查不到；忘了 SET 时一行都查不到（安全但功能坏了），测试也要能抓到。'] },
    ],
    practice: ['给 memories 表加 policy', '建一个非 owner 的 app_user 角色', 'pytest：A 写入的记忆 B 查不到'],
  },
  {
    id: 'sse', n: 5, title: '流式输出与 SSE', en: 'Streaming', when: '第 1 周 周二', project: 'P1 · P3',
    summary: 'LLM 逐 token 输出、agent 每一步的进度，都要实时推给前端。选轮询、长轮询、SSE 还是 WebSocket，取决于方向和频率。',
    lab: 'sse', labTitle: '四种方式同时跑，看消息什么时候到',
    concepts: [
      { h: '四种方式', body: ['轮询：客户端定时问，简单但有延迟和空请求。长轮询：服务器有消息才回，回完马上再连。SSE：一条 HTTP 长连接，服务器单向推。WebSocket：双向，适合语音、协作这类两边都频繁发的场景。'] },
      { h: 'SSE 的格式', body: ['Content-Type: text/event-stream；每条消息是 "data: ...\\n\\n"；浏览器 EventSource 断线会自动重连，并带上 Last-Event-ID。'],
        code: 'async def events():\n    for chunk in graph.stream(inputs, stream_mode="updates"):\n        yield f"data: {json.dumps(chunk)}\\n\\n"\n\n@app.post("/runs")\nasync def runs():\n    return StreamingResponse(events(), media_type="text/event-stream")' },
      { h: '注意代理缓冲', body: ['Nginx 之类的反向代理会攒一批再发，流式就变成一次性。要关掉缓冲（X-Accel-Buffering: no）。'] },
    ],
    practice: ['给 apply-graph 加 POST /runs，用 SSE 推每一步', '用 curl -N 验证是逐条到达的', '写 5 行笔记：四种方式各在什么时候用'],
  },
  {
    id: 'evals', n: 6, title: 'Evals 与可观测性', en: 'Evals & tracing', when: '贯穿全程', project: 'P1–P5',
    summary: '你的最强项。从 trace 里找失败，做成回归用例，每次改 prompt 或 harness 都重跑。生产上再加上成本、延迟、失败率的监控。',
    lab: 'evals', labTitle: '改 harness → 重跑 eval 的循环',
    concepts: [
      { h: '先看数据', body: ['先读 50 条真实 trace，把失败分类，再决定写什么 eval。不要一上来就套通用指标。'] },
      { h: '确定性检查优先', body: ['能用代码判断的（格式、数字是否有来源、是否调用了正确的工具）就用代码；只有主观的部分才用 LLM-as-judge，而且 judge 自己也要用人工标注校准。'] },
      { h: 'Trace 和 span', body: ['一次运行是一条 trace，每次模型调用、工具调用是一个 span。每个 span 记输入输出 token、耗时、成本、模型名。OpenTelemetry 有 GenAI 的语义约定，Langfuse 等工具能直接接。'] },
      { h: '要监控什么', body: ['成本、p95 延迟、失败率、拒答率、每个用例的 token 趋势。没有这些，回归和成本失控都发现不了。'] },
    ],
    practice: ['从 trace 里挑 30 个失败做成回归集', '每次改动后出一张分数表', '每个节点记 token 和耗时'],
  },
  {
    id: 'mcp', n: 7, title: 'MCP', en: 'Model Context Protocol', when: '第 2 周', project: 'P1',
    summary: 'MCP 是 agent 接工具和数据的标准接口，已经是很多 JD 的基础要求。你有 jobs-mcp 和两个已合并的 PR，这一课补的是协议层的细节。',
    lab: 'mcp', labTitle: '一次 MCP 会话的消息顺序',
    concepts: [
      { h: '三种角色', body: ['Host（比如 Claude Desktop）里有 client，client 连 server；server 暴露 tools、resources、prompts。'] },
      { h: '握手', body: ['client 发 initialize（协议版本 + 能力），server 回自己的能力，client 再发 initialized 通知。之后才能 tools/list、tools/call。底层是 JSON-RPC 2.0。'] },
      { h: '传输方式', body: ['本地用 stdio（host 启动子进程）；远程用 Streamable HTTP。远程 server 要做认证（OAuth）。'] },
      { h: '工具设计', body: ['工具名和描述就是给模型看的文档。参数少而明确，返回小而结构化；大结果给分页或摘要。'],
        code: '@mcp.tool()\ndef search_memory(user_id: str, query: str, k: int = 5) -> list[dict]:\n    """Search a user\'s saved memories. Returns at most k items."""' },
    ],
    practice: ['把 memory-service 包成 MCP server（search_memory / write_memory）', '用 MCP Inspector 调一次', '在 Claude Desktop 里接上试用'],
  },
  {
    id: 'voice', n: 8, title: '实时语音 agent', en: 'Voice agents', when: '第 6–8 周', project: 'P3 · 招牌项目',
    summary: '细分方向。这一课讲服务端：LiveKit 级联管线、判断说完、打断、延迟实测。',
    lab: 'voice', labTitle: '延迟预算 + 打断时间线',
    concepts: [
      { h: '级联 vs 端到端', body: ['级联：STT → LLM → TTS，每段都能观测、能换供应商，工具调用更稳，生产上用得多。端到端 speech-to-speech（如 OpenAI Realtime）少几跳，但中间过程看不见。'] },
      { h: '判断说完', body: ['只靠 VAD 静音时长会在用户停顿时抢话；turn detection 模型结合语义判断"这句话说完了没有"。这一段往往是延迟大头。'] },
      { h: '打断', body: ['用户开口时：停掉 TTS、丢掉没播的音频、记下播到哪一句（上下文里只保留真正说出口的部分）。最简单的做法是播放时锁麦克风，P3 要做成能打断。'] },
      { h: '按段测延迟', body: ['分别记：说完 → STT 最终文本 → LLM 首 token → TTS 首段音频 → 播放。报 p50 / p95，不报平均值。'] },
    ],
    practice: ['跑通 LiveKit Agents 的 voice pipeline 示例', '接上 ElevenLabs TTS 和你的记忆 MCP', '实测各段 p50 / p95', '录 90 秒演示视频'],
  },
  {
    id: 'durable', n: 9, title: 'Durable execution', en: 'Long-running agents', when: '第 9–10 周', project: 'P4',
    summary: '跑几十分钟的 agent 中途挂一次，从头重跑既费 token 又不可重现。Temporal 把每一步的结果记进事件历史，进程挂了换一个继续。',
    lab: 'durable', labTitle: '杀掉 worker，看它从哪里接着跑',
    concepts: [
      { h: 'Workflow 和 Activity', body: ['Workflow 是编排逻辑，必须是确定性的（不能直接调网络、取当前时间、用随机数）。所有副作用（调 LLM、调工具）放进 Activity，Activity 可以配置重试和超时。'] },
      { h: '重放', body: ['worker 挂了，新 worker 读事件历史把 workflow 代码重跑一遍；已经完成的 activity 直接用历史里的结果，不会再调一次。'], code: '@workflow.defn\nclass AgentRun:\n    @workflow.run\n    async def run(self, task: str) -> str:\n        plan = await workflow.execute_activity(make_plan, task, start_to_close_timeout=timedelta(minutes=2))\n        for step in plan.steps:\n            await workflow.execute_activity(run_tool, step, retry_policy=RetryPolicy(maximum_attempts=3))' },
      { h: '一个类比', body: ['游戏的帧同步（lockstep）也是这个思路：确定性模拟 + 输入日志 = 可重放。Workflow 必须确定性，和 lockstep 要求逐位一致是同一个道理。'] },
    ],
    practice: ['跑通 samples-python 的 hello activity', '把 P2 的 agent 改成 workflow + activities', '中途 kill worker，确认从断点继续'],
  },
  {
    id: 'security', n: 10, title: 'Agent 安全', en: 'Prompt injection', when: '第 9–10 周', project: 'P4',
    summary: 'agent 读到的网页、邮件、工具结果里都可能藏着指令。光靠 prompt 防不住；要让注入成功了也做不成坏事。',
    lab: 'injection', labTitle: '注入怎么一路走到数据外泄',
    concepts: [
      { h: '致命三件套', body: ['同时具备三样就危险：能读私密数据、会接触不可信内容、能向外发送。三样里拿掉任何一样，外泄这条路就断了。'] },
      { h: '间接注入', body: ['攻击者不用和你的 agent 对话，只要把指令放进 agent 会读的东西里：网页、PR、邮件、MCP 工具返回值。'] },
      { h: '限制爆炸半径', body: ['沙箱跑代码（不能出网、没有凭证）；工具按权限分级；不可逆操作要人工确认；出网走白名单。'] },
      { h: '用测试量化', body: ['写 15 条注入用例，测加防护前后的成功率，做成表。这比"我做了安全"有说服力得多。'] },
    ],
    practice: ['在记忆和工具返回里埋 15 条注入', '加防护：权限分级 + 人工确认 + 出网白名单', '出一张前后成功率对比表'],
  },
  {
    id: 'aws', n: 11, title: 'AWS 上线', en: 'Deploy on AWS', when: '第 2 周', project: 'P1',
    summary: '目标不是考证，是能把 memory-service 真的跑在 AWS 上，并讲清每个组件为什么在那。',
    lab: 'aws', labTitle: '一次请求在 AWS 里怎么走',
    concepts: [
      { h: '最小集合', body: ['ECS Fargate 跑容器（FastAPI）；RDS for PostgreSQL（支持 pgvector）；IAM role 管权限；CloudWatch 收日志；S3 放文件；SQS 做异步任务。'] },
      { h: 'IAM role，不放 key', body: ['服务之间靠 role 授权：ECS task role 允许调 Bedrock 和读 S3，代码里不出现任何 access key。'] },
      { h: 'Bedrock 调 Claude', body: ['用 Converse API，IAM 鉴权，数据留在自己的 AWS 账号里。金融等受监管行业通常只能这样调模型。'],
        code: 'brt = boto3.client("bedrock-runtime")\nresp = brt.converse(\n    modelId=MODEL_ID,   # 在 Bedrock 控制台里查当前可用的 Claude 模型 ID\n    messages=[{"role": "user", "content": [{"text": "hi"}]}],\n)' },
      { h: '控制成本', body: ['先设预算告警；RDS 用最小规格；不用的时候把 ECS 服务缩到 0。'] },
    ],
    practice: ['设预算告警', 'Docker 镜像推到 ECR，跑在 ECS Fargate', 'RDS Postgres + pgvector', '用 Bedrock 调一次 Claude', '写一页"架构上云"说明'],
  },
  {
    id: 'reach', n: 12, title: '给 agent 用的 CLI', en: 'Agent-facing tools', when: '随时', project: '案例 · Agent Reach',
    summary: '拆一个 10 万 star 的真实项目 Agent Reach。它把爬取都交给上游工具，自己只管"agent 怎么用才不出错"：统一 JSON、错误码附带下一步、首选失败自动换备选、限流写进代码、用 skill 告诉 agent 什么时候别用它。',
    lab: 'reach', labTitle: '一次 agent-reach 调用怎么走：换备选、跳过、停下',
    concepts: [
      { h: '输出就是 prompt', body: ['每条命令只打印一个 JSON：{ok, channel, action, backend, items, meta, error}。agent 只看 ok 和 error.code 分支，不用解析上游工具五花八门的输出。', 'schema_version 只在形状不兼容时才加一，agent 写好的解析逻辑不会悄悄坏掉。'],
        code: '{"ok": false, "channel": "linkedin", "action": "jobs", "items": [],\n "error": {"code": "NEED_LOGIN",\n           "message": "LinkedIn search requires a signed-in session",\n           "hint": "Run `agent-reach login linkedin` and ask the user\n                    to log in. Never log in for them."}}' },
      { h: '错误码分两类', body: ['可重试：UPSTREAM_BROKEN、TIMEOUT、NEED_SETUP。换下一个工具可能就好了。', '最终错误（FINAL_CODES）：NEED_LOGIN、RATE_LIMITED、PLATFORM_BLOCKED、NOT_FOUND、BAD_INPUT、BUSY。换工具也没用，立刻停下，把 hint 交给 agent。每个码都有一句默认 hint，写的是下一步做什么、不做什么，比如 "do not retry in a loop"。'] },
      { h: '声明式渠道 + 有序后端', body: ['每个平台是一个类，Action 里写好参数、按顺序尝试的 backends、超时和自测参数 live_test。整个 LinkedIn 渠道只有约 60 行，加一个平台就是加一个类。', '平台改版时只改这个列表，agent 的用法完全不变。'],
        code: 'Action("jobs", "Search LinkedIn jobs",\n    (Param("query", "job keywords"),\n     Param("limit", "max results", required=False, type=int, default=5)),\n    (("opencli", "_jobs"),),      # 按顺序尝试的后端\n    live_test={"query": "python", "limit": 2},\n    timeout=120,\n    public_web=("linkedin.com/jobs/view/",))' },
      { h: '失败要记住', body: ['_remember 把每个后端的失败写进本地 state（只存错误码和时间，不存查询内容和 Cookie）。下次调用时 backend_pause 直接跳过它：TIMEOUT 暂停 60 秒，UPSTREAM_BROKEN 暂停 120 秒。', '被平台限流（RATE_LIMITED）更严：整个渠道冷却 3600 秒，所有入口、所有工具都不再发请求。'] },
      { h: '护栏写在代码里', body: ['浏览器查询同一平台最多 2 条并行、全部合计 4 条，多出来的排队，最多等 2 分钟才返回 BUSY；同一平台两次搜索至少隔 10 秒。', '这些都是 dispatch.py 强制执行的，不是写在 prompt 里请 agent 自觉遵守。和第 10 课一样：能用代码限制的，就不要靠模型听话。'] },
      { h: 'Skill 教 agent 什么时候别用它', body: ['SKILL.md 第一条：公开内容先用 agent 自带的搜索和读取，Reach 只补缺口。对话里出现平台名，不等于要安装或登录。', '安装文档 install.md 开头就写着 "For the AI doing the work"：用户只发一个链接，agent 自己装完。连分发方式都是为 agent 设计的。'] },
      { h: '安全边界', body: ['只读：不发帖、不评论、不私信。用专用浏览器配置，和日常 Chrome 分开；第一次用某站时只复制这一站的 Cookie，不碰密码库；用户 logout 之后不再自动复制，避免登录"复活"。', '对照第 10 课的致命三件套：它能读私密数据、会接触不可信内容，但拿掉了"能向外发送"这一条。'] },
    ],
    practice: ['读 runtime/dispatch.py 的 run_action，画出所有返回分支', '给 jobs-mcp 的工具返回加上 ok / error.code / hint 三个字段', '给 jobs-mcp 加一个备选后端：LinkedIn guest search 失败时换 Agent Reach', '写 5 行笔记：哪些错误该停、哪些该换工具，为什么'],
  },
]

export const LESSONS: Lesson[] = L.map((l) => ({ ...l, resources: RESOURCES[l.id] ?? [] }))
export const practiceIds = (l: Lesson) => l.practice.map((_, i) => `${l.id}-p${i}`)
