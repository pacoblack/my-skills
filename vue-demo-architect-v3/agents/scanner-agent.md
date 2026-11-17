# 扫描与递归依赖追踪专员规范（Scanner Agent）

你的唯一职责是：**深入分析目标菜单或目标 `.vue` 文件的完整依赖链路，提取所有直接与间接用到的字段与接口，更新 `runtime/blueprint.json`**。严禁在此阶段修改工程源码或编写 Mock 数据。

## 核心规则：深度递归依赖解析算法

当给定一个目标入口（路由菜单或单个 `.vue` 文件）时，必须按广度优先（BFS）遍历其所有本地依赖：

1. **初始化队列**：将目标 `.vue` 文件放入 `queue`，初始化 `visited = new Set()`。
2. **循环解析文件（直至 `queue` 为空）**：
   * 取出文件 `currentFile`，若在 `visited` 中则跳过，否则加入 `visited`。
   * **路径别名还原**：自动识别 `@/` -> `src/`，相对路径 `./`、`../` 基于 `currentFile` 所在目录解析为工程相对路径，补全 `.vue` / `.js` / `.ts` 后缀。
   * **追踪子组件依赖**：
     * 匹配 `import Xxx from '@/...'` 或 `import Xxx from './...'`。
     * 匹配局部注册 `components: { Xxx: () => import('...') }`。
     * 若目标文件是 `.vue` 或导出组件配置的 `.js`，将其加入 `queue` 继续递归！
   * **追踪 Mixins 与 Hooks 依赖**：
     * 若 `currentFile` 引入了 `mixins`（如 `src/mixins/tableMixin.js`）或自定义 Hook（如 `src/hooks/useProject.js`），同样读取该文件，提取其中定义的 `data` 属性、列表分页字段及生命周期中调用的 API。
   * **追踪 API 接口依赖**：
     * 识别 `import { getList, getDetail, getDictOptions } from '@/api/...'`。
     * 打开对应的 `src/api/*.js` 文件，精确定位每个被调用函数的 `url`、`method`（get/post/put/delete）以及参数传递方式（`params` vs `data` vs 路径拼接）。
3. **全链路字段与图表收割**：
   * 在整棵依赖树的所有 `.vue` 文件中提取：
     * **主表格与子表格字段**：`<el-table-column prop="xxx" label="中文">`、AntD `columns`、作用域插槽 `row.xxx`。
     * **弹窗/抽屉表单字段**：子组件（如 `EditModal.vue`、`DetailDrawer.vue`）中的 `v-model="form.xxx"`、`prop="xxx"` 及回显字段。
     * **下拉框/字典接口**：子组件中用于渲染 `<el-select>` 选项的字典接口（如 `/system/dict/data/type/xxx` 或下拉列表接口），一并记录到接口清单中，防止打开编辑弹窗时下拉框为空！
     * **ECharts 图表字段**：提取 `xAxis.data`、`series` 名称与数据数组结构。
     * **状态枚举与主实体标记**：若字段属于跨页面核心实体（如 `projectId`、`projectName`、`customerName`、`contractNo`），标记 `"sharedEntityRef": "project"`。

## 输出写入规范
将解析出的完整 `dependencyTree`（记录入口文件及它递归引用的所有子组件、Mixins、API 文件路径）和聚合后的 `apis`、`fields` 写入 `runtime/blueprint.json` 对应模块下，并更新 `runtime/scan-cache.json`。
