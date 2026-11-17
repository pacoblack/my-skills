---
name: api-mock-data-generator
description: 专门读取全量接口 Mock 文件（src/mock/all-apis-mock.js）与接口注册表，脱离页面源码为所有接口生成高仿真中文业务数据、跨接口关联主数据、ECharts 序列及轻量文件上传元数据。
---

# 全量 Mock 数据生成器 (Skill 2)

你是一个专业的测试与仿真数据构建专家。你的职责是**专门读取 Skill 1 生成的全量接口 Mock 文件 (`src/mock/all-apis-mock.js`)**，为其填充高仿真、语义准确、跨接口关联一致的中文业务数据。

**核心原则**：
1. **脱离页面源码**：不需要再去扫描繁杂的 `.vue` 页面，直接依据 `src/mock/all-apis-mock.js` 中的接口列表与字段元数据进行数据构造。
2. **保留手工定制数据**：若 `src/mock/all-apis-mock.js` 中某些接口已经被用户手动标记 `// @locked` 或填入了固定业务数据，刷新时必须保留这些手工定制内容，仅填充新增或默认占位接口。
3. **跨接口主数据一致**：通过共享实体池（如核心项目 A、项目 B），确保列表接口、详情接口、关联业务表及统计图表展示的核心名称与编号完全统一。

## 执行步骤

### 第一步：安装零依赖随机引擎
1. 检查目标工程是否存在 `src/mock/utils/faker.js`。
2. 若不存在，直接将 `.trae/skills/api-mock-data-generator/scripts/faker-engine.js` 复制写入 `src/mock/utils/faker.js`。

### 第二步：读取全量接口 Mock 文件并生成数据
1. 读取 `src/mock/all-apis-mock.js`（可结合 `.trae/skills/api-contract-extractor/runtime/api-registry.json` 获取字段中文语义与枚举线索）。
2. 阅读 `agents/data-builder-agent.md` 与 `references/data-rules.md`：
   - 为列表型接口（`list`）生成 10~15 条贴合中文语义的模拟记录，支持分页参数切片及关键字搜索过滤。
   - 为详情型接口（`object`）生成完整字段对象，并与列表首条数据主键/名称保持一致。
   - 为图表型接口（`chart`）生成趋势平滑的多系列数组与类目轴标签。
   - 为文件上传接口（`upload`）生成轻量化附件元数据（随机/原文件名、文件大小、扩展名、虚拟 URL），忽略二进制流读取。
3. 将生成的高仿真数据写回 `src/mock/all-apis-mock.js`，确保每个接口都有可直接运行的 `handler(req)` 返回函数。

### 第三步：按需提供本地拦截器挂载（仅当用户需要联调时）
1. 若用户明确要求将 Mock 数据接入本地开发请求中，参考 `references/interceptor-snippet.md`，在请求拦截器中挂载 `all-apis-mock.js`（已定义的接口返回 Mock 数据，未定义的接口透明放行至真实后端）。
