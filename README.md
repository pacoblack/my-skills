# Vue 前端接口逆向分析与全量 Mock 双 Skill 套件

本套件专为 **Vue 2 / Vue 3** 前端工程设计，在完全不侵入原有业务页面代码、不依赖额外第三方库的前提下，通过**职责解耦的两个独立 Skill** 实现：
1. 从前端页面与 API 源码中**逆向反推请求与响应字段**；
2. 基于字段级精准 Diff 自动维护**增量接口文档**与**全量接口 Mock 契约文件**；
3. 脱离源码专职为全量 Mock 文件生成**高仿真中文业务数据**。

---

## 一、 目录结构

将解压后的两个文件夹放入项目根目录的 `.trae/skills/`（或全局 Skills 目录）中：

```text
.trae/skills/
├── README.md                             # 本说明文档
├── api-contract-extractor/               # 【Skill 1】逆向提取字段 + 增量文档 + 全量接口契约文件
│   ├── SKILL.md                          # 主控入口（零代码侵入 + 字段级 Diff 决策树）
│   ├── scripts/
│   │   └── diff-registry.js              # 确定性字段级对比脚本（严格判定 created / updated / unchanged）
│   ├── references/
│   │   ├── registry-schema.json          # 接口注册中心标准 Schema
│   │   └── api-doc-template.md           # 标准化 Markdown 接口文档模板
│   ├── agents/
│   │   └── extractor-agent.md            # 广度优先递归追踪页面/弹窗/子组件的提取规范
│   └── runtime/
│       └── api-registry.json             # 历史接口与字段注册中心（用于增量比对）
│
└── api-mock-data-generator/              # 【Skill 2】专门读取全量 Mock 文件生成高仿真数据
    ├── SKILL.md                          # 主控入口（脱离源码，专注为 all-apis-mock.js 填充数据）
    ├── scripts/
    │   └── faker-engine.js               # 零依赖原生随机工具库（含 ECharts 与附件元数据）
    ├── references/
    │   ├── data-rules.md                 # 列表分页、图表、轻量化文件上传的数据规范
    │   └── interceptor-snippet.md        # 可选的本地请求拦截器挂载代码（未 Mock 接口透明放行）
    └── agents/
        └── data-builder-agent.md         # 跨接口主数据联动与仿真数据构造规范
```

---

## 二、 核心工作流

```text
[Vue 2 / Vue 3 页面、子组件与 API 源码]
                  │
                  ▼  调用 Skill 1：api-contract-extractor
        ┌─────────┴─────────┐
        │ 1. 递归追踪页面依赖，反推请求与响应字段
        │ 2. 字段级 Diff（无新增字段不覆盖，新增字段标 🆕）
        │ 3. 生成/更新接口文档：docs/api-spec.md
        │ 4. 生成/更新全量契约：src/mock/all-apis-mock.js
        └─────────┬─────────┘
                  │
                  ▼  调用 Skill 2：api-mock-data-generator
        ┌─────────┴─────────┐
        │ 1. 脱离繁杂源码，仅读取 src/mock/all-apis-mock.js
        │ 2. 生成中文业务数据、跨接口共享实体（如项目A/B）
        │ 3. 生成 ECharts 平滑趋势序列与轻量文件上传元数据
        └───────────────────┘
```

---

## 三、 在 Trae 中的快速使用指南

### 1. 提取接口字段并生成接口文档（调用 Skill 1）

* **针对单个菜单或单个 `.vue` 页面进行深度提取**（自动追踪其引用的弹窗、抽屉、Tab 子组件和 API 文件）：
  > “使用 `api-contract-extractor` 分析 `src/views/project/index.vue` 的接口调用字段，更新接口文档和全量 Mock 文件。”

* **当页面新增了字段，需要增量更新时**：
  > “我刚在 `src/views/project/index.vue` 里加了几个新字段，请运行 `api-contract-extractor` 增量扫描并更新文档。”

### 2. 为全量 Mock 文件生成仿真数据（调用 Skill 2）

* **读取已汇总的全量接口文件并填充逼真数据**：
  > “使用 `api-mock-data-generator` 读取 `src/mock/all-apis-mock.js`，为里面的所有接口生成高仿真中文业务数据。”

* **开启本地接口拦截进行联调（可选）**：
  > “参考 `api-mock-data-generator` 中的 `interceptor-snippet.md`，帮我把 `src/mock/all-apis-mock.js` 挂载到请求拦截器上（未生成 Mock 的接口自动透传给真实后端）。”

---

## 四、 增量更新与数据保护规则

1. **无新增字段零覆盖（`unchanged`）**：
   每次扫描都会通过 `diff-registry.js` 与 `runtime/api-registry.json` 逐字段比对。若某接口已存在且未发现任何新字段，**严格跳过不更新**，绝不破坏你手工调优过的文档备注。
2. **新增字段精准追加（`updated`）**：
   当已有接口出现新字段时，仅在接口文档（`docs/api-spec.md`）中追加该字段并自动标注 `🆕`，同时在 `src/mock/all-apis-mock.js` 中补齐对应字段结构。
3. **跨接口主数据关联（Entity Linking）**：
   不同接口若涉及相同的核心业务对象（如项目名称、项目编号、客户名称），Skill 2 会优先复用同一套共享实体池，保证列表、详情、统计图表之间的数据逻辑高度统一。
4. **手动锁定字段值（`locked: true`）**：
   在 `src/mock/all-apis-mock.js` 中手动写死或标记为 `locked: true` 的字段值，后续重新生成数据时会被自动保留，不会被随机值覆盖。
