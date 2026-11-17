# 前端逆向接口契约文档

> 本文档由 `api-contract-extractor` 自动分析前端页面与 API 调用逆向生成。
> 标记 `🆕` 为最近一次增量扫描新发现的字段；未发生字段变更的接口不会重复覆盖。

## 模块：{模块中文名} (`{module}`)

### {序号}. {接口功能描述}
- **接口地址**：`{METHOD} {URL}`
- **响应模式**：`{list | object | chart | upload | action}`
- **引用页面/组件**：`{sources}`

#### 请求参数 (Request)
| 参数名 | 位置 | 类型 | 说明 | 必填 |
| :--- | :--- | :--- | :--- | :--- |
| `{name}` | `{query/body/path}` | `{type}` | {label} {🆕} | {是/否} |

#### 响应字段 (Response Data)
| 字段路径 | 类型 | 页面映射说明 | 枚举值线索 |
| :--- | :--- | :--- | :--- |
| `{name}` | `{type}` | {label} {🆕} | `{enumValues}` |
