---
name: api-mock-data-generator
description: 专门读取全量接口 Mock 文件（src/mock/all-apis-mock.js）与接口注册表，生成高仿真中文业务数据，并自动配置全环境（含生产打包后）可用的离线数据拦截与单文件打包引导。
---

# 全量 Mock 数据生成器 (Skill 2 - 离线交付增强版)

你是一个专业的测试与离线演示工程构建专家。你的职责是**专门读取 Skill 1 生成的全量接口 Mock 文件 (`src/mock/all-apis-mock.js`)**，为其填充高仿真、语义准确、跨接口关联一致的中文业务数据，并确保工程打包后可作为**不依赖网络的离线应用**独立运行。

**核心原则**：
1. **脱离页面源码**：直接依据 `src/mock/all-apis-mock.js` 中的接口列表与字段元数据进行数据构造，无需扫描 `.vue` 页面。
2. **保留手工定制数据**：若 `src/mock/all-apis-mock.js` 中某些接口已标记 `// @locked` 或填入了固定业务数据，刷新时必须保留，仅填充新增或默认占位接口。
3. **跨接口主数据一致**：通过共享实体池，确保列表、详情、关联业务表及统计图表展示的核心名称与编号完全统一。
4. **生产构建强制生效**：生成的 Mock 拦截逻辑绝不能限制在 `NODE_ENV === 'development'` 中，必须保证 `npm run build` 打包后依然生效。

## 执行步骤

### 第一步：安装零依赖随机引擎
1. 检查目标工程是否存在 `src/mock/utils/faker.js`。
2. 若不存在，直接将 `.trae/skills/api-mock-data-generator/scripts/faker-engine.js` 复制写入 `src/mock/utils/faker.js`。

### 第二步：读取全量接口 Mock 文件并生成数据
1. 读取 `src/mock/all-apis-mock.js`（结合 `.trae/skills/api-contract-extractor/runtime/api-registry.json` 获取字段中文语义与枚举线索）。
2. 阅读 `agents/data-builder-agent.md` 与 `references/data-rules.md`：
   - **列表型接口（`list`）**：生成 10~15 条贴合中文语义的模拟记录，支持分页参数切片及关键字搜索过滤。
   - **详情型接口（`object`）**：生成完整字段对象，并与列表首条数据主键/名称保持一致。
   - **图表型接口（`chart`）**：生成趋势平滑的多系列数组与类目轴标签。
   - **文件上传接口（`upload`）**：生成轻量化附件元数据（文件名、大小、扩展名、虚拟 URL），忽略二进制流读取。
3. 将生成的高仿真数据写回 `src/mock/all-apis-mock.js`，确保每个接口都有可直接运行的 `handler(req)` 返回函数，且仅使用相对路径或本地安全引用（禁止引入外部网络图片/CDN链接）。

### 第三步：自动挂载全环境离线拦截器（必须执行）
1. 定位项目中的 Axios 封装文件（通常为 `src/utils/request.js` 或 `src/api/request.js`）。
2. 参考 `references/interceptor-snippet.md`，使用顶部静态 `import` 方式引入 `matchMockHandler` 并挂载到请求拦截器最顶部。
3. **关键检查**：确保拦截器外层**没有任何** `process.env.NODE_ENV === 'development'` 判断条件，确保打包后的生产代码在断网环境下直接返回 Mock 数据。

### 第四步：离线单文件 HTML 打包自动化改造（兼容 Vue 2 / Vue 3）
若用户明确需要生成可脱离网络、直接双击运行的单文件 HTML，请读取 `references/offline-build-guide.md` 并执行以下操作：
1. **自动改造路由**：读取 `src/router/index.js`（或 `.ts`），将路由模式修改为 `hash` 模式（`createWebHashHistory()` 或 `mode: 'hash'`）。
2. **自动改造构建配置**：
   - 识别项目 `package.json` 中的框架类型（Vite 或 Vue CLI）。
   - 安装对应的单文件内联插件（`vite-plugin-singlefile` 或 `html-webpack-inline-source-plugin`）。
   - 参考 `references/offline-build-guide.md` 更新 `vite.config.js` 或 `vue.config.js`，确保所有 JS、CSS、图片及字体资源在 `npm run build` 后全部内联至单个 `dist/index.html` 中。
3. **外链巡检**：检查 `public/index.html` 或根目录 `index.html`，确保没有引入任何外部 `http://` 或 `https://` 在线 CDN 脚本或样式表。

