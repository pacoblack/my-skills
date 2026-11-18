# 全量 Mock 数据构造专员规范

你的输入是 `src/mock/all-apis-mock.js`（以及 `api-registry.json` 中的字段元数据）。

## 执行要求
1. **构建演示主线闭环（CRUD 共享数据源）**：
   - 按 `api-registry.json` 中的 `domain` 对接口分组；若同一业务域存在 `list` / `detail` / `create` / `update` / `delete` 接口，必须使用 `faker.createCrudStore(anchors, 10, rowFactory, idKeys)` 创建模块级共享 Store。
   - **头部锁定**：`anchors` 数组放置 2 条固定标杆主角数据（优先复用 `PROJECTS` 与 `DEMO_USER`），并在对象中同时挂载 `relation` 标注的主键别名字段（如同时包含 `id` 与 `projectId`）。
   - **联动响应**：`list` 调用 `store.query(...)`，`detail` 调用 `store.detail(id)`（自动支持无参回退第 1 条主角），`create`/`update`/`delete` 调用对应变更方法，确保列表点击进入详情及修改保存实时同步。
2. **非 CRUD 接口仿真填充**：
   - `chart` 类型使用 `faker.dateLabels`、`faker.trendSeries`、`faker.pieSeries` 生成确定性趋势数据；`upload` 类型使用 `faker.mockFileMeta` 生成附件元数据。
3. **保护人工定制块**：扫描文件中是否存在 `// @locked` 注释标记的接口处理器；若存在，完整保留其内部实现逻辑，禁止覆盖。
4. **内置路由匹配器**：在 `src/mock/all-apis-mock.js` 底部导出标准匹配函数 `matchMockHandler(config)`，同时支持精确路径与 `:id` 动态路径正则匹配（如 `/api/project/:id`）。
