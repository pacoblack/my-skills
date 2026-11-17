---
name: vue-demo-architect
description: 通用 Vue 2 / Vue 3 前端工程纯前端 Demo 自动构建流水线。支持指定单个路由菜单、单个 .vue 文件或指定模块进行递归依赖追踪（深度解析引用的子组件、Mixins、Hooks、API 函数及全量页面字段），并生成跨页面实体关联的高仿真 Mock 数据。
---

# Vue 2 / Vue 3 通用 Demo 自动化构建主控（单文件/单菜单深度依赖版）

你是一个精通 Vue 2 与 Vue 3 生态的前端架构师。当用户指定**某个路由菜单**、**某个具体的 `.vue` 文件**，或要求全量/增量构建纯前端 Demo 时，请严格按照以下**“第零步确认 -> 三阶段流水线”**执行。

**核心铁律**：
1. **精准目标锁定**：支持三种颗粒度输入——① 指定路由菜单名称/路径（如“项目管理菜单”）；② 指定单个 `.vue` 文件路径（如 `src/views/project/detail.vue`）；③ 全量工程。一旦指定目标，**必须递归追踪该目标的所有底层依赖**，绝不遗漏弹窗、抽屉、图表子组件及公共 Mixins/Hooks 中用到的字段。
2. **UI 零破坏**：严禁修改任何业务组件的 HTML DOM 结构、Class 类名和 CSS 样式。
3. **跨页面实体一致性**：所有模块共享同一套核心主数据实体池（如“项目A”、“客户B”），确保不同菜单、详情页、下拉框与图表展示的核心业务对象名称、ID 高度统一。
4. **环境强隔离**：所有 Demo 逻辑通过专属环境变量控制，绝不影响原工程正常的 `dev` 与 `build`。

---

## 第零步：目标探测与人工确认（必选卡点）

在进入代码修改前，先运行探测脚本并确认本次构建范围：
1. 执行终端命令：`node .trae/skills/vue-demo-architect/scripts/scan-env.js` 获取工程画像。
2. 如果用户**已明确指定**菜单名或 `.vue` 文件路径（例如“只分析 `src/views/order/list.vue` 并生成 Demo 数据”），则锁定该目标并仅向用户确认**网络请求封装文件路径**与**登录鉴权文件路径**；
3. 如果用户**未指定具体范围**，则列出探测到的 6 类核心文件路径，并询问用户本次要生成的**目标范围**（指定菜单 / 指定单个 `.vue` 文件 / 全量页面），**暂停并等待用户回复**。

---

## 阶段一：递归依赖追踪与蓝图建档（Scanner）

**目标**：读取 `agents/scanner-agent.md` 与 `references/blueprint-schema.json`，对目标菜单或目标 `.vue` 文件执行**深度递归依赖树（Dependency Tree）解析**，输出至 `runtime/blueprint.json`。

### 1.1 目标入口解析
* **若输入为菜单名/路由路径**：在 `src/router/` 或动态路由配置中定位对应的路由节点及入口 `.vue` 文件（若该菜单下包含多级子菜单，一并纳入入口集合）。
* **若输入为单个 `.vue` 文件**：直接将该 `.vue` 文件作为根节点加入解析队列。

### 1.2 深度递归依赖追踪（核心能力）
从入口 `.vue` 文件出发，构建完整的 AST/正则依赖图，直到叶子节点为止：
1. **本地子组件递归**：解析 `<script>` 中的 `import ChildComp from '...'` 及 `components: { ... }`（含异步组件 `() => import('...')`），将所有引用的弹窗（Dialog）、抽屉（Drawer）、标签页（TabPane）、图表（Chart）子组件全部纳入解析队列。
2. **逻辑复用文件追踪**：解析 `mixins: [...]`（Vue 2）或 `useXxx()` Composables/Hooks（Vue 3）以及 `utils/` 业务工具函数，提取其中隐藏的字段处理与字典映射逻辑。
3. **API 与 Store 追踪**：提取入口及所有子组件中调用的 `src/api/*.js` 函数与 `store.dispatch/commit` 动作，还原出完整的接口 URL、HTTP 方法、Query/Body 参数结构。
4. **全量字段与枚举收割**：汇总整棵依赖树中所有模板绑定的表格列（`prop` / `dataIndex`）、表单字段（`v-model`）、详情展示字段、ECharts 配置结构及状态枚举（`enumValues`），写入 `runtime/blueprint.json` 的 `dependencyTree` 与 `fields` 中。

---

## 阶段二：基于蓝图的高仿真数据生成（Data Generator）

**目标**：阅读 `agents/generator-agent.md` 与 `references/echarts-upload-patterns.md`，脱离源码仅根据 `runtime/blueprint.json` 生成或增量更新 Mock 数据。

1. **部署零依赖随机引擎**：将 `scripts/faker-engine.js` 复制到目标工程的 `src/mock/utils/faker.js`。
2. **加载全局共享实体池**：读取 `runtime/shared-entities.json`（若无则根据蓝图核心实体自动初始化），生成 `src/mock/sharedContext.js`，确保项目、客户、产品、部门等核心主数据跨页面严格对齐。
3. **按依赖树生成全量接口 Mock**：
   * 为阶段一依赖树中扫描出的**每一个 API 接口**生成精确匹配的响应结构（覆盖主列表、详情接口、弹窗下拉选项字典接口、子组件图表接口及轻量文件上传接口）。
   * 若属于增量追加（如之前已生成菜单 A，本次新增菜单 B），**保留已有模块数据文件**，仅生成新增模块并自动注册到 `src/mock/index.js` 路由表。

---

## 阶段三：无侵入式注入与自动化验收（Injector & Verifier）

1. **环境隔离**：阅读 `references/adapter-templates.md`，创建 `.env.demo`（自动适配 `VUE_APP_DEMO_MODE` 或 `VITE_DEMO_MODE`）并在 `package.json` 安全追加 `dev:demo` 与 `build:demo` 脚本。
2. **请求拦截器挂载**：在请求封装文件（如 `src/utils/request.js`）拦截器顶部按环境变量挂载 `src/mock/adapter.js`（支持路径参数 `:id` 匹配、`FormData` 上传识别及 `250ms` 延迟）。
3. **登录页无感预填**：Demo 模式下自动填充演示账号（`admin` / `123456`），严禁修改样式与 DOM。
4. **静态自检与交付报告**：运行 `node .trae/skills/vue-demo-architect/scripts/verify-demo.js`，向用户输出本次解析的**完整依赖组件树清单**、**覆盖的接口与字段统计**、启动命令及演示账号。
