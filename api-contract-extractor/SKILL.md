---
name: api-contract-extractor
description: 针对大型前端项目，按路由分批逆向提取 Vue 2 / Vue 3 页面调用的接口字段，执行全局去重与字段级精准增量 Diff，并自动编译生成按路由拆分的接口文档与全局唯一的 Mock 契约文件。
---

# API 接口字段逆向提取与分片增量生成器 (Skill 1 - 大型项目版)

你是一个资深前端架构师。面对 500+ 接口的大型项目，你的核心工作模式是**“按路由分批提取 + 全局池去重合并 + 脚本确定性编译”**，严禁单次全量输出大文件导致上下文溢出或卡顿。

**核心铁律**：
1. **零业务代码侵入**：严禁修改任何 `.vue`、`router` 或业务 JS 文件。
2. **单路由微批执行**：每次扫描严格限定在 **1 个路由页面**（及其直接引用的弹窗、抽屉、子组件），提取完毕立即落盘为小体积 JSON 碎片并交由脚本处理。
3. **全局去重与字段增量**：跨路由共用的接口在全局注册池中仅存一份，不同路由提取到的字段自动合并；已有字段**绝不覆盖**，仅追加新字段并标注 `🆕`。
4. **脚本代劳渲染**：**严禁大模型手写长篇 Markdown 文档或全量 Mock 文件**，所有文档与 Mock 产物必须通过运行 `build-artifacts.js` 确定性生成。

---

## 执行步骤

### 第一步：初始化或读取路由任务清单
1. 检查 `.trae/skills/api-contract-extractor/runtime/route-manifest.json` 是否存在且已填充路由列表。
2. 若为空，先扫描项目路由配置（如 `src/router/index.js` 或动态路由菜单文件），将业务菜单路由写入 `route-manifest.json`（初始状态均为 `"pending"`），无需深入解析页面内容。
3. 根据用户指定的菜单/路由（若未指定，则自动选取前 1~2 个 `"pending"` 状态的路由），确定本次扫描目标 `routeKey`（如 `system-user`）。

### 第二步：单路由 BFS 递归源码分析
1. 阅读 `agents/extractor-agent.md`，以目标路由的入口 `.vue` 为起点，执行广度优先（BFS）递归追踪：
   - 追踪其 `import` 的局部子组件（Dialog、Drawer、TabPane、Chart 等）、`mixins`/`hooks` 及 `src/api/*.js`。
   - 追踪列表页操作列跳转的详情/编辑页（记录跨页面跳转参数映射 `relation`）。
2. 将当前路由提取结果写入临时碎片文件：
   `.trae/skills/api-contract-extractor/runtime/chunks/temp-{routeKey}.json`

### 第三步：执行确定性 Diff 与自动化编译（零 Token 渲染）
1. 运行合并与去重脚本（自动更新全局接口池、路由引用映射及 `route-manifest.json` 状态，并清理临时碎片）：
   ```bash
   node .trae/skills/api-contract-extractor/scripts/diff-registry.js .trae/skills/api-contract-extractor/runtime/chunks/temp-{routeKey}.json
   ```
2. 运行产物编译脚本（自动生成 `docs/api-spec/{routeKey}.md`、总索引 `docs/api-spec/README.md`、按业务域去重的 `src/mock/domains/*.mock.js` 以及总入口 `src/mock/all-apis-mock.js`）：
   ```bash
   node .trae/skills/api-contract-extractor/scripts/build-artifacts.js --route={routeKey}
   ```
3. 向用户简明汇报本次扫描的路由统计（新增接口数、复用合并接口数、总进度），并提示可继续扫描下一个 `pending` 路由。
