# ECharts 图表与轻量化文件上传 Mock 规范

## 1. ECharts 常见数据结构对照

### 1.1 折线图 / 柱状图（趋势类）
确保 `xAxis` 数组长度与每个 `series` 的 `data` 数组长度完全一致：
```javascript
{
  code: 200,
  data: {
    xAxis: faker.dateLabels(7, 'day'), // ['11-11', '11-12', ..., '11-17']
    series: [
      { name: '计划完成数', data: faker.trendSeries(7, 80, 150) },
      { name: '实际完成数', data: faker.trendSeries(7, 70, 145) }
    ]
  }
}
```

### 1.2 饼图 / 环形图（分布占比类）
返回 `{ name, value }` 对象数组：
```javascript
{
  code: 200,
  data: faker.pieSeries(['智慧园区', '数据中心', '政务云平台', '智慧交通'], 20, 120)
}
```

### 1.3 关联核心实体的统计数据
若图表展示各项目的统计对比，必须从 `sharedContext.projects` 中提取真实项目名称作为维度标签：
```javascript
const projectNames = sharedContext.projects.map(p => p.projectName)
const data = faker.pieSeries(projectNames, 100, 500)
```

## 2. 轻量化文件上传 Mock 规范

拦截到 `<el-upload>` / `<a-upload>` 或 `FormData` 上传请求时，忽略二进制文件流读取，直接利用 `ctx.uploadFileName` 返回标准附件元数据：

```javascript
'POST:/common/upload': (ctx) => {
  const meta = faker.mockFileMeta(ctx.uploadFileName)
  return {
    code: 200,
    msg: '上传成功',
    url: meta.url,
    fileName: meta.fileName,
    newFileName: meta.fileName,
    originalFilename: meta.fileName,
    size: meta.size,
    data: meta
  }
}
```
