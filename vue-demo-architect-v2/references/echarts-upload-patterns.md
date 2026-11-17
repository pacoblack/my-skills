# ECharts 图表与轻量化文件上传模拟规范

## 1. ECharts 图表结构映射规则
* **折线图 / 柱状图**：返回结构需保证 `xAxis` 类目数组与 `series` 数值数组长度严格一致。若图表统计“各项目进度/预算”，优先从 `sharedContext.projects` 中提取项目名称作为类目轴标签，确保与表格中的项目名称一致。
* **饼图 / 环形图**：返回 `[{ name: '类别名称', value: 数值 }]` 格式。

## 2. 轻量化文件上传模拟规则
* 遇到 `<el-upload>`、`<a-upload>` 或 `FormData` 上传请求时，不读取文件二进制流。
* 优先提取 `uploadFileName`（前端上传的原文件名），调用 `faker.mockFileMeta(uploadFileName)` 生成随机文件大小（如 `1.45 MB`）、后缀及静态占位 URL（`/demo-files/sample.pdf`）并按原工程接口字段返回。
