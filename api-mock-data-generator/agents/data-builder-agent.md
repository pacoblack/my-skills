# 全量 Mock 数据构造专员规范

你的输入是 `src/mock/all-apis-mock.js`（以及 `api-registry.json` 中的字段元数据）。

## 执行要求
1. **逐接口填充仿真数据**：遍历 `all-apis-mock.js` 中的每一项接口定义，根据其 `responseType`（`list` / `object` / `chart` / `upload` / `action`）和 `responseFields` 生成贴合中文业务场景的返回数据。
2. **保护人工定制块**：扫描文件中是否存在 `// @locked` 注释标记的接口处理器；若存在，完整保留其内部实现逻辑，禁止覆盖。
3. **内置路由匹配器**：在 `src/mock/all-apis-mock.js` 底部导出标准匹配函数 `matchMockHandler(config)`，支持精确路径与 `:id` 动态路径正则匹配。
