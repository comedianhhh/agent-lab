# Agent Lab

一个 agent 工程学习网站：12 周路线、13 节课，每节课有概念、可以动手玩的动画实验和核对过的学习资料。

线上版：https://comedianhhh.github.io/agent-lab/

```bash
npm install
npm run dev -- --port 5174
```

推到 `main` 会自动用 GitHub Actions 构建并发布到 GitHub Pages。

## 本地私有数据

`src/data/` 下如果有 `plan.private.ts`、`skillmap.private.ts`、`lessons.private.ts`（已 gitignore），本地运行和构建会用它们代替同名的公开文件。公开文件里不放个人信息。

## 结构

- `src/data/lessons.ts`：13 节课的概念、动手清单，以及每节课对应的实验
- `src/data/resources.ts`：学习资料链接，2026-10-31 逐个打开并核对过页面标题
- `src/data/plan.ts`：12 周项目和第 1 周清单
- `src/data/skillmap.ts`：技能地图（`#/map`）：27 项技能、前置关系、当前状态（勾选后变为已会）、4 个方向
- `src/labs/`：每节课一个交互实验（SVG + motion 动画）
- 勾选进度存在浏览器的 localStorage（键名 `agentLabProgress`）
- `notes/`：对话式私教课的学习笔记，按课号命名（如 `03-混合检索与RAG.md`）

加一节课：在 `lessons.ts` 里加一条，在 `resources.ts` 里加同 id 的资料，在 `labs/` 里写实验并注册到 `labs/index.ts`。
