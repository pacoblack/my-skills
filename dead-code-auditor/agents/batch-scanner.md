# Vue 2/3 + Monorepo + qiankun 单批次提取规范

你只负责分析当前 `batchId` 所属子应用（`appId`）的少量文件，并严格基于 `project-config.json` 中该 `appId` 的路径别名进行路径标准化。

## 提取规则

### 1. 路径标准化（Monorepo 关键）
- **应用内别名**：如 `@/views/order/list.vue` 必须还原为带子应用前缀的仓库根相对路径，例如 `apps/sub-order/src/views/order/list.vue`（严禁丢失 `apps/sub-order/` 前缀，否则多应用同名的 `src/views/index.vue` 会发生冲突！）。
- **跨包工作区引用**：如 `import { getUserInfo } from '@company/shared/api/user'` 或 `../../shared/src/api/user`，必须还原为真实的仓库根相对路径 `packages/shared/src/api/user.js`。

### 2. qiankun 微前端特征提取
- **主应用 (Master/Host)**：识别 `registerMicroApps([{ name, entry, activeRule, ... }])` 或 `loadMicroApp`，记录微应用配置信息。
- **子应用 (Micro-App)**：识别 `export async function bootstrap`、`export async function mount`、`export async function unmount` 生命周期钩子；同时追踪 `mount(props)` 中渲染的根组件（如 `new Vue({ router, render: h => h(App) })` 或 `createApp(App).use(router)`）作为该子应用的活跃入口根节点。

### 3. API 定义、路由注册与实际调用
- **API 定义**：提取 `export function`、`export const`、`export default { ... }` 导出的接口函数，标注所属 `appId`（或 `shared`）。
- **路由注册**：提取 Vue Router 3/4 静态路由及异步懒加载组件路径；若发现后端动态菜单拼接（如 ``@/views/${view}`` 或 `import.meta.glob`），标记 `"hasDynamicRouter": true`。
- **实际调用校验**：只有当某文件 `import` 了 API 函数并在代码逻辑中**实际调用**时，才写入 `calledApiFuncs`（仅 `import` 未使用不计入）。

## 临时分片输出格式 (`runtime/chunks/temp-{batchId}.json`)
```json
{
  "batchId": "batch-004-sub-order-views",
  "appId": "sub-order",
  "hasDynamicRouter": false,
  "definedApis": [
    { "appId": "sub-order", "funcName": "getOrderDetail", "filePath": "apps/sub-order/src/api/order.js", "method": "GET", "url": "/order/detail" }
  ],
  "registeredRoutes": [
    "apps/sub-order/src/views/order/list.vue"
  ],
  "globalComponents": [],
  "fileReferences": [
    {
      "sourceFile": "apps/sub-order/src/views/order/list.vue",
      "importedFiles": [
        "apps/sub-order/src/views/order/components/DetailDrawer.vue",
        "packages/shared/src/api/common.js"
      ],
      "calledApiFuncs": [
        { "apiFile": "packages/shared/src/api/common.js", "funcName": "getDictList" }
      ]
    }
  ]
}
```
