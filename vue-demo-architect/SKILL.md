---
name: vue-demo-architect
description: 通用 Vue 2 / Vue 3 纯前端 Demo 自动构建流水线（支持人机确认、增量蓝图、ECharts 图表与轻量化文件上传模拟）。
---

# Vue 2 / Vue 3 通用 Demo 自动化构建主控

你是一个精通 Vue 2 与 Vue 3 生态的前端架构师，请严格调度本 Skill 目录下的 `scripts/`、`references/` 和 `agents/` 完成纯前端演示 Demo 构建。

**核心铁律**：
1. **先确认再动手**：执行扫描和代码生成前，必须先运行探测脚本并**暂停请求用户确认核心文件路径**。
2. **UI 零破坏**：严禁修改任何业务组件的 HTML DOM 结构、Class 类名和 CSS 样式。
3. **环境强隔离**：所有 Demo 逻辑通过专属环境变量开关控制，绝不影响原工程的 `dev` 和 `build`。

---

## 第零步：运行环境探测脚本并人工确认（必选卡点）
1. 执行终端命令 `node .trae/skills/vue-demo-architect/scripts/scan-env.js` 获取工程画像。
2. 阅读输出 JSON，向用户展示探测到的 **6 类核心文件路径**（项目配置、请求封装、路由守卫、登录与Store、API目录、业务视图及包含 ECharts 的页面），**暂停并等待用户确认或指正**。
   *(注：若用户明确指令“跳过确认”或 `runtime/blueprint.json` 已存在且执行增量更新，可直接进入阶段一。)*

---

## 阶段一：调用扫描规范生成蓝图（Scanner）
1. 阅读 `agents/scanner-agent.md` 与 `references/blueprint-schema.json`。
2. 对比 `runtime/scan-cache.json` 执行全量或增量代码扫描，提取表格字段、状态枚举、ECharts 数据结构及上传接口契约。
3. 将结果严格按 Schema 写入 `runtime/blueprint.json`，并更新 `runtime/scan-cache.json` 文件指纹缓存。

---

## 阶段二：按蓝图生成 Mock 数据仓库（Data Generator）
1. 阅读 `agents/generator-agent.md` 与 `references/echarts-upload-patterns.md`。
2. 直接将 `scripts/faker-engine.js` 复制到目标工程的 `src/mock/utils/faker.js`。
3. 严格依据 `runtime/blueprint.json` 生成 `src/mock/modules/auth.js` 及各业务模块数据文件（包含内存级 CRUD 状态机、平滑图表数据及轻量附件元数据）。

---

## 阶段三：注入适配器与自动化验收（Injector & Verifier）
1. 阅读 `references/adapter-templates.md`，根据蓝图中的构建工具（`vue-cli` 或 `vite`）创建 `.env.demo`、更新 `package.json` 脚本并注入 `src/mock/adapter.js`。
2. 仅在 Demo 环境变量激活时预填登录页账号（`admin` / `123456`）并放行验证码，严禁改动任何 DOM 与样式。
3. 运行 `node .trae/skills/vue-demo-architect/scripts/verify-demo.js` 进行覆盖率静态校验，再运行 `npm run dev:demo` 验证编译与浏览器渲染，最后输出结构化交付报告。
