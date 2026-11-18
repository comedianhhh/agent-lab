# 混合检索与 RAG

## 学习目标和基础
- 目标：看懂 Agent Lab「03 · Hybrid retrieval」那一课和演示页，能讲清楚自己 `jobs-mcp/rank.py` 为什么用 BM25 + bge-small-en-v1.5 + RRF(k=60)。
- 基础：玩过演示页（三列结果、k 滑块、hit@3 成绩单），已经知道 RRF = Σ 1/(k+排名)，以及 k 越大名次差越平。

## 已掌握的点
- RAG = 先检索再生成；检索错了，模型会忠实地照着错的材料答（Priya 当狗名）。
- BM25 的三个零件：IDF（稀有词更值钱）、TF 饱和（k1≈1.2，重复有上限）、长度归一化（b，短文档占便宜）。
- BM25 认死字：文档里没有 "dog" 就怎么调都找不到。
- 向量 = 分布假设（看一个词周围是什么词），余弦相似度；bge-small 输出 384 维。
- 向量的盲区：否定（love/hate 很近）、数字（1207/1208）、专有名词。
- 综合题全对：编号→BM25，换说法→向量，"not in fintech"→两边都翻车，要靠查询改写 + 元数据过滤。
- 漏斗：BM25 + 向量 + RRF 便宜地多捞（看召回），cross-encoder reranker 贵、准，只精排前 50；reranker 不能提前算好文档那一半。
- hit@k 里的 k 要和下游拿多少条对齐。

## 容易混淆的地方
- love/hate 那题直觉选了"同义改写最近"。这在好模型上没错，但要记住否定句的向量也非常近。
- "多捞"要补全：k 也不能无限大，相似但错误的文档会误导模型（Priya 就是例子）。

## memory-service 实测（11/03–11/05，代码由 Claude 写）
- tsvector 存成生成列（`GENERATED ALWAYS AS ... STORED`），这样才能建 GIN 索引；text 改了它会自动更新。
- RRF 是"合并"步骤，MRR 是"评分"尺子；两者都用 1/名次，但用途完全不同。
- 全文查询要把词用 OR 连起来；`plainto_tsquery` 要求所有词都出现，自然语言问题几乎搜不到。
- 50 条 query 的 recall@5：向量 0.98、全文 0.66、RRF 0.99；RRF 的 MRR 比纯向量还低，加 rerank 后升到 0.957。
- HNSW + RLS 的坑：HNSW 先取全表最近的 40 条，RLS 再过滤，结果 20 条只剩 4–6 条。修复办法是 `hnsw.iterative_scan`。
- 每个用户只有几千条记忆时，按 user_id 精确扫描和 HNSW 一样快，而且召回 100%。
- 切块：每轮单独存一条时 recall@5 只有 0.58，因为答案和问题被拆开了；≤40 词一块时召回满分，送进 LLM 的词数只有 160 词方案的 1/4。块越大 recall 越好看，但那是因为块太少、top 5 几乎覆盖了全部。

## 下次从这里继续
- 自己手写一遍 RRF（用 `memory-service/tests/test_rrf.py` 检查）。
- 能不看代码讲清：RLS 的 `USING` 和 `WITH CHECK` 分别管什么；refresh token 为什么要轮换，被重放时为什么作废整个 session。
- 读 Anthropic "Contextual Retrieval"，然后在 `eval/convo_run.py` 上试一下：给每块加一句上下文，看 recall 会不会变。
