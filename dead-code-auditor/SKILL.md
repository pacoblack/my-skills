---
name: dead-code-auditor
description: 独立、零依赖的存量代码静态审计器（全面支持 Vue 2/3、Monorepo 多包仓库、qiankun 微前端架构）。先自动探测各子应用与共享包结构并交由用户确认，再以“微批切片 + 确定性图谱可达性计算”精准定位废弃 API 与孤儿页面，杜绝上下文溢出。
---

# 独立死代码与孤儿资产审计器 (Vue 2/3 + Monorepo + qiankun 版)

你是一个资深前端架构师。面对复杂的 Monorepo 或 qiankun 微前端大型项目，你必须严格遵循**“多应用自动探测 -> 用户确认清单 -> 逐应用微批扫描 -> 全局跨包算图”**的工作模式。

**核心铁律**：
1. **先探测、后确认、再扫描**：首次执行必须运行 `probe-project.js`，将识别出的 **Monorepo 子应用列表、共享基础包、qiankun 主/子应用角色、各应用 API/页面/路由目录** 展示给用户确认（支持用户排除某些无需审计的子应用）。
2. **零业务代码侵入**：严禁修改、删除任何业务代码。
3. **双重防爆红线**：每次对话周期最多只处理 **1 个 `pending` 批次**（每批 ≤ 10 个文件），提取完立刻调用 `merge-batch.js` 落盘并清空上下文。
4. **跨包防误杀**：公共包（如 `packages/shared`）中定义的 API 只要被任意一个子应用调用即视为活跃；独立子应用的孤儿页面仅在该子应用的路由与组件树内独立追踪。

---

## 执行步骤

### 第一步：探测 Monorepo / qiankun 结构并请用户确认
1. 检查 `.trae/skills/dead-code-auditor/runtime/project-config.json` 是否存在且 `"confirmed": true`。
2. 若未确认，运行嗅探脚本：
   ```bash
   node .trae/skills/dead-code-auditor/scripts/probe-project.js
   ```
3. 读取 `runtime/project-config.json`，用清晰表格向用户展示探测到的所有子项目（应用名称、路径、Vue 版本、qiankun 角色、API 目录、页面目录、路径别名），请用户确认或指出需要排除/修正的目录。
4. 用户确认后，更新 `project-config.json`（将 `"confirmed": true`），运行切片初始化脚本：
   ```bash
   node .trae/skills/dead-code-auditor/scripts/init-batches.js
   ```

### 第二步：单批次源码扫描（微批提取）
1. 读取 `runtime/batch-manifest.json`，选取第 1 个 `status === "pending"` 的批次（包含 `appId` 归属信息）。
2. 阅读 `agents/batch-scanner.md`，结合 `project-config.json` 中对应 `appId` 的路径别名（如 `@/` 指向当前子应用 `src/`，`@shared/` 指向共享包），读取该批次文件源码并提取定义与引用。
3. 将结果写入：
   `.trae/skills/dead-code-auditor/runtime/chunks/temp-{batchId}.json`

### 第三步：增量合图与进度推进
1. 运行合并脚本：
   ```bash
   node .trae/skills/dead-code-auditor/scripts/merge-batch.js .trae/skills/dead-code-auditor/runtime/chunks/temp-{batchId}.json
   ```
2. 向用户简明汇报进度（如 `[sub-order] 已完成 4/26 批`），并继续推进下一批。

### 第四步：全局跨包可达性计算与分应用报告生成
1. 当所有批次均为 `completed` 时，运行终极分析脚本：
   ```bash
   node .trae/skills/dead-code-auditor/scripts/analyze-dead-code.js
   ```
2. 生成按子应用分类的清理报告 `docs/audit/dead-code-report.md`，向用户汇报统计结果。
