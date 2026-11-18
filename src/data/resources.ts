/** Learning material per lesson. Every URL was opened and its page title checked on 2026-10-31. */
export type ResourceKind = 'docs' | 'repo' | 'blog' | 'course' | 'paper' | 'spec'

export interface Resource {
  title: string
  url: string
  kind: ResourceKind
  why: string
}

const r = (title: string, url: string, kind: ResourceKind, why: string): Resource => ({ title, url, kind, why })

export const RESOURCES: Record<string, Resource[]> = {
  practice: [
    r('NeetCode Roadmap', 'https://neetcode.io/roadmap', 'course', '按主题分层的刷题路线，每题有免费视频讲解'),
    r('LeetCode Top Interview 150', 'https://leetcode.com/studyplan/top-interview-150/', 'course', '经典面试题单，用 Python 计时练'),
    r('Python collections', 'https://docs.python.org/3/library/collections.html', 'docs', 'deque、Counter、defaultdict、OrderedDict：现场写代码最常用的结构'),
    r('ByteByteGoHq/system-design-101', 'https://github.com/ByteByteGoHq/system-design-101', 'repo', '图解系统设计概念，适合快速复习'),
    r('donnemartin/system-design-primer', 'https://github.com/donnemartin/system-design-primer', 'repo', '系统设计面试的自学仓库，带练习题和解答'),
    r('ept/ddia-references', 'https://github.com/ept/ddia-references', 'repo', 'DDIA 每章的参考文献，想深入某一章时用'),
  ],
  agent: [
    r('Building effective agents', 'https://www.anthropic.com/research/building-effective-agents', 'blog', '分清 workflow 和 agent，几种基础模式：链式、路由、编排者-执行者'),
    r('Effective context engineering for AI agents', 'https://www.anthropic.com/research/effective-context-engineering-for-ai-agents', 'blog', '怎么管有限的上下文：压缩、结构化笔记、子 agent'),
    r('Effective harnesses for long-running agents', 'https://www.anthropic.com/research/effective-harnesses-for-long-running-agents', 'blog', '长时间运行的 agent 怎么跨会话保持进度'),
    r('Writing effective tools for AI agents', 'https://www.anthropic.com/research/writing-tools-for-agents', 'blog', '工具接口怎么设计、评估和迭代'),
    r('A practical guide to building agents', 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf', 'docs', 'OpenAI 的视角：模型、工具、指令、编排、护栏'),
    r('The Anatomy of an Agent Harness', 'https://www.langchain.com/blog/the-anatomy-of-an-agent-harness', 'blog', '拆解 harness 的组成：循环、工具、记忆、文件系统'),
    r('Improving Deep Agents with harness engineering', 'https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering', 'blog', '真实案例：不换模型、只改 harness 怎么提分'),
  ],
  langgraph: [
    r('LangGraph overview', 'https://docs.langchain.com/oss/python/langgraph/overview', 'docs', '总览：LangGraph 解决什么问题'),
    r('Graph API', 'https://docs.langchain.com/oss/python/langgraph/graph-api', 'docs', 'StateGraph、reducer、条件边、Send / Command'),
    r('Interrupts', 'https://docs.langchain.com/oss/python/langgraph/interrupts', 'docs', 'interrupt 暂停、Command 恢复：人工审批怎么做'),
    r('Persistence', 'https://docs.langchain.com/oss/python/langgraph/persistence', 'docs', 'checkpointer、thread_id、时间回溯'),
    r('Streaming', 'https://docs.langchain.com/oss/python/langgraph/streaming', 'docs', 'values / updates / messages 几种流式模式'),
    r('langchain-ai/langgraph', 'https://github.com/langchain-ai/langgraph', 'repo', '源码和示例，行为有疑问时直接看实现'),
    r('Introduction to LangGraph（LangChain Academy）', 'https://academy.langchain.com/courses/intro-to-langgraph', 'course', '免费视频课，带 notebook 从零练到人工审批和记忆'),
  ],
  rag: [
    r('pgvector', 'https://github.com/pgvector/pgvector', 'repo', '向量列、距离运算符、HNSW / IVFFlat 索引'),
    r('pgvector-python', 'https://github.com/pgvector/pgvector-python', 'repo', 'Python 用法；examples 里有现成的 hybrid search + RRF'),
    r('Contextual Retrieval', 'https://www.anthropic.com/research/contextual-retrieval', 'blog', '给每块补上下文 + BM25 + rerank，检索失败率怎么降下来'),
    r('Hybrid Queries（Qdrant）', 'https://qdrant.tech/documentation/search/hybrid-queries/', 'docs', '稠密 + 稀疏向量融合查询，RRF 和 DBSF 两种融合'),
    r('Reciprocal Rank Fusion（Cormack et al., 2009）', 'https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf', 'paper', 'RRF 原始论文：1/(k+rank) 和 k=60 的来历'),
    r('PostgreSQL Full Text Search', 'https://www.postgresql.org/docs/current/textsearch-intro.html', 'docs', 'tsvector / tsquery，混合检索的关键词一路'),
    r('Controlling Text Search', 'https://www.postgresql.org/docs/current/textsearch-controls.html', 'docs', 'ts_rank 排序和高亮'),
  ],
  rls: [
    r('Row Security Policies', 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html', 'docs', '官方概念：默认拒绝、owner 绕过、FORCE'),
    r('CREATE POLICY', 'https://www.postgresql.org/docs/current/sql-createpolicy.html', 'docs', 'USING 和 WITH CHECK 的区别，permissive / restrictive'),
    r('Row Level Security（Supabase）', 'https://supabase.com/docs/guides/database/postgres/row-level-security', 'docs', '实战写法和性能技巧：索引、用 select 包一层缓存函数结果'),
    r('Multi-tenant data isolation with PostgreSQL RLS（AWS）', 'https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/', 'blog', '用会话变量做多租户隔离的标准模式'),
    r('Row Level Security for Tenants in Postgres（Crunchy Data）', 'https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres', 'blog', '简洁的多租户示例和常见坑'),
  ],
  sse: [
    r('Using server-sent events（MDN）', 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events', 'docs', 'EventSource 用法，data / event / id / retry 格式'),
    r('Server-sent events（WHATWG）', 'https://html.spec.whatwg.org/multipage/server-sent-events.html', 'spec', '规范：断线重连和 Last-Event-ID 的细节'),
    r('Server-Sent Events（FastAPI）', 'https://fastapi.tiangolo.com/tutorial/server-sent-events/', 'docs', 'FastAPI 官方 SSE 教程'),
    r('StreamingResponse（FastAPI）', 'https://fastapi.tiangolo.com/advanced/custom-response/', 'docs', '用异步生成器逐块输出'),
    r('LangGraph Streaming', 'https://docs.langchain.com/oss/python/langgraph/streaming', 'docs', '把节点更新和 token 流接到 SSE 端点'),
  ],
  evals: [
    r('AI Evals FAQ（Hamel Husain）', 'https://hamel.dev/blog/posts/evals-faq/', 'blog', '错误分析、该测什么、怎么起步'),
    r('Your AI Product Needs Evals', 'https://hamel.dev/blog/posts/evals/', 'blog', '单元测试、人工评审、A/B 三层'),
    r('Using LLM-as-a-Judge', 'https://hamel.dev/blog/posts/llm-judge/', 'blog', '怎么让 LLM 评审和人工标注对齐'),
    r('Demystifying evals for AI agents', 'https://www.anthropic.com/research/demystifying-evals-for-ai-agents', 'blog', '多步 agent 的评测：任务、评分器、指标'),
    r('Working with evals（OpenAI）', 'https://developers.openai.com/api/docs/guides/evals', 'docs', '定义数据集和评分标准，跑评测'),
    r('Langfuse Observability', 'https://langfuse.com/docs/observability/overview', 'docs', '开源追踪平台：trace、span、评分、数据集'),
    r('OpenTelemetry GenAI semantic conventions', 'https://github.com/open-telemetry/semantic-conventions-genai', 'spec', 'GenAI span 和指标的标准属性名'),
  ],
  mcp: [
    r('What is MCP?', 'https://modelcontextprotocol.io/docs/getting-started/intro', 'docs', '解决什么问题，host / client / server 三个角色'),
    r('Architecture overview', 'https://modelcontextprotocol.io/docs/learn/architecture', 'docs', '数据层、传输层，tools / resources / prompts，生命周期'),
    r('Specification', 'https://modelcontextprotocol.io/specification/latest', 'spec', '协议规范最新版'),
    r('Build an MCP server', 'https://modelcontextprotocol.io/docs/develop/build-server', 'docs', '跟着做一个 server 并接到 Claude'),
    r('modelcontextprotocol/python-sdk', 'https://github.com/modelcontextprotocol/python-sdk', 'repo', '官方 Python SDK，FastMCP 写法'),
    r('modelcontextprotocol/servers', 'https://github.com/modelcontextprotocol/servers', 'repo', '官方参考实现，看真实 server 怎么组织工具'),
  ],
  voice: [
    r('LiveKit Agents', 'https://docs.livekit.io/agents/', 'docs', 'STT → LLM → TTS 管线和会话'),
    r('livekit/agents', 'https://github.com/livekit/agents', 'repo', '源码：AgentSession、插件、打断处理'),
    r('livekit/agents examples', 'https://github.com/livekit/agents/tree/main/examples', 'repo', '能直接跑的语音 agent 示例'),
    r('Turns overview（LiveKit）', 'https://docs.livekit.io/agents/logic/turns/', 'docs', 'VAD、打断、轮次检测'),
    r('LiveKit turn detector', 'https://docs.livekit.io/agents/logic/turns/turn-detector/', 'docs', '用语义模型判断"说完了没有"，减少抢话'),
    r('Pipecat', 'https://docs.pipecat.ai/overview/introduction', 'docs', '另一个主流框架：frame / pipeline 架构'),
    r('Speech Input & Turn Detection（Pipecat）', 'https://docs.pipecat.ai/pipecat/learn/speech-input', 'docs', 'VAD、转写、Smart Turn 怎么配合'),
    r('pipecat-ai/pipecat', 'https://github.com/pipecat-ai/pipecat', 'repo', '源码：frame 流动方式，可对照游戏网络管线理解'),
    r('pipecat-ai/smart-turn', 'https://github.com/pipecat-ai/smart-turn', 'repo', '开源轮次检测模型'),
    r('Realtime API（OpenAI）', 'https://developers.openai.com/api/docs/guides/realtime', 'docs', 'speech-to-speech 模型的接入'),
    r('Voice agents（OpenAI）', 'https://developers.openai.com/api/docs/guides/voice-agents', 'docs', 'speech-to-speech 和链式架构的取舍'),
  ],
  durable: [
    r('The definitive guide to Durable Execution', 'https://temporal.io/blog/what-is-durable-execution', 'blog', '什么是 durable execution，为什么适合长流程 agent'),
    r('Understanding Temporal', 'https://docs.temporal.io/evaluate/understanding-temporal', 'docs', 'Workflow、Activity、Worker、重放'),
    r('Temporal Python SDK', 'https://docs.temporal.io/develop/python', 'docs', '写 workflow / activity、重试、signal、query'),
    r('temporalio/samples-python', 'https://github.com/temporalio/samples-python', 'repo', '官方示例，含 OpenAI Agents 等 AI 集成'),
    r('Temporal AI Cookbook', 'https://docs.temporal.io/ai/cookbook', 'docs', '用 Temporal 做 AI agent 的配方'),
    r('temporal-community/temporal-ai-agent', 'https://github.com/temporal-community/temporal-ai-agent', 'repo', '完整的多轮 agent 演示：工具调用怎么持久化'),
  ],
  security: [
    r('OWASP Top 10 for LLM Applications', 'https://genai.owasp.org/llm-top-10/', 'spec', '2025 版十大风险：prompt injection、过度授权等'),
    r('The lethal trifecta for AI agents（Simon Willison）', 'https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/', 'blog', '私有数据 + 不可信内容 + 外发能力，三样凑齐就危险'),
    r('Sandboxing agentic workflows（NVIDIA）', 'https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/', 'blog', '给执行代码的 agent 做沙箱和权限隔离'),
    r('Design Patterns for Securing LLM Agents against Prompt Injections', 'https://arxiv.org/abs/2506.08837', 'paper', '能落地的防注入架构：plan-then-execute、双 LLM 等'),
    r('Mitigating prompt injections in browser use（Anthropic）', 'https://www.anthropic.com/research/prompt-injection-defenses', 'blog', '训练和分类器两层防御思路'),
    r('CaMeL（Simon Willison 解读）', 'https://simonwillison.net/2025/Apr/11/camel/', 'blog', '用能力和数据流控制隔离不可信输入'),
  ],
  aws: [
    r('ECS on Fargate：创建第一个任务', 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-fargate.html', 'docs', '跑通第一个 Fargate 容器服务'),
    r('ECS task IAM role', 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html', 'docs', '容器用 role 访问 Bedrock / S3，不放 key'),
    r('Converse API（Bedrock）', 'https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html', 'docs', '统一的多轮对话、工具调用、流式接口'),
    r('Claude on Bedrock', 'https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-claude.html', 'docs', 'Bedrock 上 Claude 的参数和请求格式'),
    r('IAM security best practices', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html', 'docs', '最小权限、临时凭证、优先用 role'),
    r('RDS PostgreSQL 扩展版本', 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.FeatureSupport.Extensions.html', 'docs', '确认 RDS 上可用的 pgvector 版本'),
    r('pgvector HNSW on RDS（AWS）', 'https://aws.amazon.com/blogs/database/accelerate-hnsw-indexing-and-searching-with-pgvector-on-amazon-aurora-postgresql-compatible-edition-and-amazon-rds-for-postgresql/', 'blog', '在 RDS 上调 HNSW 索引'),
  ],
  // Checked with `gh` on 2026-11-05.
  reach: [
    r('Panniantong/Agent-Reach', 'https://github.com/Panniantong/Agent-Reach', 'repo', '这一课拆的项目，MIT，Python，约 8000 行'),
    r('dispatch.py：run_action', 'https://github.com/Panniantong/Agent-Reach/blob/main/agent_reach/runtime/dispatch.py', 'repo', '换备选、暂停、冷却、最终错误都在这一个函数里'),
    r('SKILL.md', 'https://github.com/Panniantong/Agent-Reach/blob/main/agent_reach/skill/SKILL.md', 'docs', '怎么写一份教 agent "什么时候用、什么时候别用"的说明'),
    r('docs/install.md', 'https://github.com/Panniantong/Agent-Reach/blob/main/docs/install.md', 'docs', '写给 AI 执行的安装文档'),
    r('jackwener/OpenCLI', 'https://github.com/jackwener/OpenCLI', 'repo', '它背后的上游工具：把网站变成 CLI，复用已登录的浏览器'),
    r('Writing effective tools for AI agents', 'https://www.anthropic.com/research/writing-tools-for-agents', 'blog', '工具接口怎么设计，和这一课的思路一致'),
  ],
}
