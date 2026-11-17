# ECharts 图表与轻量化文件上传 Mock 契约指南

## 一、 ECharts 常见数据结构识别与生成规范

在扫描包含 `echarts.init`、`setOption` 或 `<v-chart>`、`<line-chart>`、`<bar-chart>`、`<pie-chart>` 的页面时，严格对齐以下 4 类响应契约：

### 1. 折线图 / 柱状图（单系列或多系列对比）
* **页面常见写法**：
  ```js
  xAxis: { data: res.data.dates }, // 或 res.data.xAxis
  series: [
    { name: '访问量', data: res.data.visits },
    { name: '成交量', data: res.data.orders }
  ]
  ```
* **Generator 生成规则**：
  * 调用 `const labels = faker.dateLabels(7, 'day')`（或 `12, 'month'`）。
  * 每个系列必须调用 `faker.trendSeries(labels.length, min, max)`，**严格保证 `series.data.length === xAxis.data.length`**。

### 2. 饼图 / 环形图 / 漏斗图
* **页面常见写法**：
  ```js
  series: [{ type: 'pie', data: res.data }] // 期望 [{ name: '分类A', value: 335 }, ...]
  ```
* **Generator 生成规则**：
  * 提取图例 `legend.data` 或页面静态分类文案；若无明确分类，默认使用贴合当前业务模块的 4~5 个中文分类，调用 `faker.pieSeries(categories, 80, 1200)`。

### 3. 顶部统计指标卡（KPI Cards / 数字翻牌器）
* **页面常见写法**：`{{ stat.totalUsers }}`、`{{ stat.todayAmount }}`、`{{ stat.growthRate }}`
* **Generator 生成规则**：
  * 金额类使用 `faker.amount(10000, 950000)`；人数/订单数使用 `faker.int(120, 8500)`；增长率使用 `faker.amount(-5.5, 28.8)`。

---

## 二、 轻量化文件上传 Mock 规范

对于 `<el-upload>`、`<a-upload>` 或路径含 `/upload`、`/file` 的接口，**完全忽略二进制流与存储，仅返回元数据**：

### 1. 若依 / 常见 Vue 2 后台平铺结构
```json
{
  "code": 200,
  "msg": "操作成功",
  "url": "/demo-files/2026年度项目汇报材料.pdf",
  "fileName": "/profile/upload/2026/11/17/2026年度项目汇报材料.pdf",
  "newFileName": "2026年度项目汇报材料.pdf",
  "originalFilename": "2026年度项目汇报材料.pdf",
  "size": "2.35 MB"
}
```

### 2. 标准 `data` 包裹结构
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "fileId": "FILE20261117001",
    "fileName": "设备巡检明细表.xlsx",
    "fileSize": 1048576,
    "sizeText": "1.00 MB",
    "fileExt": "xlsx",
    "url": "/demo-files/设备巡检明细表.xlsx",
    "uploadTime": "2026-11-17 14:30:00"
  }
}
```
