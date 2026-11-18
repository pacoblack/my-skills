# 逆向接口与字段提取专员规范（单路由分片版）

你负责从指定的 **单个路由页面** 出发，完整追踪其调用的所有后端接口、跨页面唯一标识传递链路及使用到的每一个字段，并输出标准化的路由提取碎片 JSON。

## 扫描步骤
1. **入口定位**：根据 `route-manifest.json` 中的 `entryFile` 定位对应的 `.vue` 主页面路径。
2. **局部 BFS 递归依赖追踪**：
   - 解析主页面 `import` 的局部子组件（如新增/编辑弹窗 `Dialog.vue`、详情抽屉 `Drawer.vue`、标签页 `TabPane`、图表子组件）。
   - 解析页面引入的 `mixins`、`composables/hooks` 文件。
   - **跨页面跳转追踪**：扫描列表操作列中的 `router.push` / `$router.push` 跳转目标路径，追踪并一并解析对应的详情页或编辑页 `.vue` 源码。
   - 收集所有调用的 `src/api/*.js` 函数，提取其 `url`、`method`（模板字符串参数如 `${id}` 或加号拼接参数统一转为 `:id`）。
3. **业务域与角色标注**：
   - **业务域 (`domain`)**：提取 URL 的第一级业务模块前缀（如 `/system/user/list` -> `system`；`/common/upload` -> `common`），用于全局 Mock 分文件聚合。
   - **接口角色 (`role`)**：标注 `list` / `detail` / `create` / `update` / `delete` / `chart` / `upload` / `other`。
4. **跨页面参数链路提取 (`relations`)**：
   - 追踪列表页点击进入详情/编辑页时传递的唯一标识字段（如 `row.id` -> `query.projectId`），以及目标页面接收该参数后传入详情/修改接口的字段名。
   - 注意：此类关联线索挂在当前路由的 `relations` 数组中，避免污染全局复用接口。
5. **请求与响应字段反推**：
   - **请求参数**：检查调用 API 时传入的 `queryParams`、`form`、路径参数，结合 `<el-form-item label="xxx">` 补充中文说明。
   - **表格与详情响应**：提取 `<el-table-column prop="xxx" label="中文">`、作用域插槽 `row.xxx`、`detail.xxx`、`form.xxx`。
   - **状态枚举**：提取 `v-if="row.status == '0'"`、字典 `dict.type.xxx` 或三元表达式中的合法枚举值。
   - **ECharts 与上传**：识别图表 `xAxis.data` / `series.data`（标记 `responseType: "chart"`）及 `<el-upload>` 回调字段（标记 `responseType: "upload"`）。

## 临时碎片输出格式 (`chunks/temp-{routeKey}.json`)
必须严格输出以下 JSON 结构供 `diff-registry.js` 消费：
```json
{
  "routeKey": "system-user",
  "menuName": "系统管理 / 用户管理",
  "routePath": "/system/user",
  "entryFile": "src/views/system/user/index.vue",
  "relations": [
    {
      "sourceApi": "GET /system/user/list",
      "sourceField": "userId",
      "targetParam": "userId",
      "targetApi": "GET /system/user/:userId"
    }
  ],
  "apis": [
    {
      "method": "GET",
      "url": "/system/user/list",
      "summary": "查询用户列表",
      "domain": "system",
      "role": "list",
      "responseType": "list",
      "sources": ["src/views/system/user/index.vue"],
      "requestFields": [
        { "name": "userName", "in": "query", "type": "string", "label": "用户名称", "required": false }
      ],
      "responseFields": [
        { "name": "userId", "type": "number", "label": "用户ID", "enumValues": [] },
        { "name": "status", "type": "string", "label": "帐号状态", "enumValues": ["0", "1"] }
      ]
    }
  ]
}
```
