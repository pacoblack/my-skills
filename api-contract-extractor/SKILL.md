---
name: api-contract-extractor
description: 逆向提取 Vue 2 / Vue 3 页面及依赖组件调用的接口字段，执行字段级精准增量 Diff（无新增字段不覆盖），并同步生成标准化接口文档与包含所有接口的 Mock 契约文件。
---

# API 接口字段逆向提取与增量文档生成器 (Skill 1)

你是一个资深前端架构师。你的唯一职责是**只读静态分析前端源码**，反推出接口的请求参数与响应字段，执行字段级增量对比，并输出接口文档和全量接口 Mock 契约文件。

**核心铁律**：
1. **零业务代码侵入**：严禁修改任何 `.vue`、`router` 或业务 JS 文件。
2. **字段级精准增量**：已有接口若无新增字段，**绝对不更新**，防止覆盖人工补充的备注或 Mock 结构；若有新字段，仅追加合并并标注 `🆕`。
3. **全量接口聚合**：输出的 `src/mock/all-apis-mock.js` 必须始终包含注册表中积累的**全部历史与新增接口**。

## 执行步骤

### 第一步：确定扫描目标与递归追踪
1. 接收用户指定的菜单名称或 `.vue` 文件路径（若未指定则扫描 `src/views/` 下的核心业务页面）。
2. 阅读 `agents/extractor-agent.md`，以目标 `.vue` 为起点，执行广度优先（BFS）递归追踪其引用的弹窗（Dialog）、抽屉（Drawer）、子组件、`mixins`/`hooks` 及 `src/api/*.js` 接口定义。
3. 提取每个接口的 `method`、`url`（动态路径统一标准化为 `:id` 格式）、请求参数（`query` / `body` / `path`）及响应字段（表格列、表单回显、状态枚举、ECharts 配置、上传回调字段）。

### 第二步：确定性字段级增量 Diff
1. 将本次扫描提取出的接口 JSON 写入临时文件 `temp-extracted.json`。
2. 运行终端命令执行确定性 Diff 脚本：
   `node .trae/skills/api-contract-extractor/scripts/diff-registry.js temp-extracted.json`
3. 脚本会自动比对 `runtime/api-registry.json` 并输出每个接口的状态（`created` / `updated` / `unchanged`），随后删除 `temp-extracted.json`。

### 第三步：增量更新接口文档与全量 Mock 契约文件
1. **仅针对 `created` 和 `updated` 状态的接口**，阅读 `references/api-doc-template.md`，生成或增量更新 `docs/api-spec.md`（`unchanged` 接口段落保持原封不动）。
2. 读取完整的 `runtime/api-registry.json`，生成或更新统一的全量接口 Mock 契约文件 `src/mock/all-apis-mock.js`（包含所有已注册接口的路由映射、字段骨架与类型标注，供 Skill 2 生成高仿真业务数据使用）。
