# 仿真数据构造、全行业泛化与演示主线规则

## 1. 语义映射与全行业泛化规则（核心）
生成字段值时，按以下优先级进行匹配，确保既能精准命中通用字段，又能自适应未知新业务：

1. **枚举值强制优先**：凡是 `api-registry.json` 中提取出 `enumValues` 的字段（如 `status` / `state` / `type`），**只能从 `enumValues` 中抽取合法值**；若无枚举线索则默认使用 `'0'` 或 `'1'`。
2. **自定义行业词库与智能推导（推荐）**：
   - 优先调用 `faker.smartValue(field.name, field.label, field.enumValues)`，它会自动匹配 `CUSTOM_DICTIONARIES` 中的多行业词库（如 `project`、`device`、`order`、`contract`、`customer`、`course`、`patient` 等）。
   - **未知行业自适应**：当遇到 `CUSTOM_DICTIONARIES` 未覆盖的新业务域时，必须根据接口的 `summary`、菜单名及字段中文 `label` 推断业务语境，现场编造贴合该行业的真实中文命名（严禁生搬硬套无关行业词库）。
3. **通用基础字段显式映射**：
   - `id` / `no` / `code`（非状态）：使用 `faker.id()`。
   - `name` / `creator` / `manager`（人员类）：使用 `faker.cname()`；企业/客户类使用 `faker.company()`；部门类使用 `faker.dept()`。
   - `phone` / `mobile`：使用 `faker.phone()`；地址类使用 `faker.address()`。
   - `time` / `date` / `createTime`：使用 `faker.datetime(index)`。
   - `amount` / `price` / `money` / `budget`：使用 `faker.amount()`（保留 2 位小数 `Number` 类型）。
4. **离线图片与富文本安全**：
   - 头像、封面图或二维码字段一律使用轻量级内联 SVG Data URI（如 `data:image/svg+xml;utf8,...`），**严禁生成 `http://` 或 `https://` 外部网络链接**，防止断网演示时出现裂图。

## 2. 演示主线与跨接口关联规则（Golden Storyline）
为保证离线演示时“列表 -> 详情 -> 编辑保存”主线连贯不穿帮，必须遵循以下规范：

1. **同域共享内存数据源（CRUD Store）**：
   - 同一业务域（`domain`）下的 `list`、`detail`、`create`、`update`、`delete` 接口，必须使用 `faker.createCrudStore(anchors, 10, rowFactory, idKeys)` 共用同一份内存数组。
2. **头部锁定 2 条标杆主角 + 尾部确定性填充**：
   - 列表前 2 条必须锁定为高仿真行业标杆主角数据（编号规范如 `PRJ-2026-001`、状态区分主流程），第 3~12 条由确定性伪随机生成（刷新不漂移）。
   - **主从主键双字段兼容**：若存在跨页面 `relation` 关联（如列表传 `id`，详情接 `projectId`），主角对象中必须同时挂载这两个别名字段。
3. **增删改查实时联动与防穿帮兜底**：
   - `detail` 接口优先按传入 ID 查找并返回浅拷贝 `{ ...target }`（防止表单未保存污染列表）；**若未传参或未命中，默认回退返回第 1 条主角数据**，防止详情页白屏。
   - `create`、`update`、`delete` 接口原地更新内存 Store，确保返回列表页后页面状态立刻响应变化。

## 3. 分页列表通用响应格式
- 保持与项目现有响应拦截器及前端表格取值字段完全一致（常见如 `{ code: 200, msg: '操作成功', rows: [...], total: 12 }` 或 `{ code: 200, data: { records: [...], total: 12 } }`）。
- 必须根据 `req.params.pageNum` 与 `req.params.pageSize`（兼容 `req.query`）进行真实切片分页，并支持关键字搜索过滤。

## 4. ECharts 图表数据结构
- 折线/柱状图返回包含类目轴与系列数组的 JSON（如 `{ xAxis: faker.dateLabels(7), series: [{ name: '本期数量', data: faker.trendSeries(7) }] }`）。
- 饼图返回 `faker.pieSeries()` 数组，核心指标与主线主角数据保持逻辑自洽。

## 5. 轻量化文件上传返回
- 忽略二进制文件流，直接调用 `faker.mockFileMeta()` 返回文件名、大小、扩展名、虚拟 URL 等元数据。
