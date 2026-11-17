# 仿真数据构造与跨接口关联规则

1. **语义映射规则**：
   - `projectId` / `projectName` / `合同所属项目`：必须从 `faker.sharedProject()` 中抽取，确保不同接口之间的项目名称与编号一致。
   - `id` / `no` / `code`（非状态）：使用 `faker.id()`。
   - `name` / `creator` / `manager`（人员类）：使用 `faker.cname()`；企业/客户类使用 `faker.company()`。
   - `phone` / `mobile`：使用 `faker.phone()`。
   - `time` / `date` / `createTime`：使用 `faker.datetime(index)`。
   - `status` / `state` / `type`：优先从字段的 `enumValues` 中抽取合法值；若无枚举线索则默认使用 `'0'` 或 `'1'`。
   - `amount` / `price` / `money`：使用 `faker.amount()`。

2. **分页列表通用响应格式**：
   - 保持与项目现有响应拦截器一致（常见如 `{ code: 200, msg: '操作成功', rows: [...], total: 12 }` 或 `{ code: 200, data: { records: [...], total: 12 } }`）。
   - 根据 `req.query.pageNum` 与 `req.query.pageSize` 进行真实切片分页。

3. **ECharts 图表数据结构**：
   - 折线/柱状图返回包含类目轴与系列数组的 JSON（如 `{ xAxis: faker.dateLabels(7), series: [{ name: '本期数量', data: faker.trendSeries(7) }] }`）。
   - 饼图返回 `faker.pieSeries()` 数组。

4. **轻量化文件上传返回**：
   - 忽略二进制文件流，直接调用 `faker.mockFileMeta()` 返回文件名、大小、URL 等元数据。
