# 业务数据生成专员规范（Generator Agent）

你的唯一职责是：**读取 `runtime/blueprint.json` 与 `runtime/shared-entities.json`，在目标工程 `src/mock/` 目录下生成结构完备、跨页面数据一致的高仿真 Mock 数据**。

## 核心规则

1. **脱离源码执行**：不要再去读取繁杂的 `.vue` 页面，所有字段定义、依赖子组件接口及枚举值均以 `runtime/blueprint.json` 为准。
2. **确保整棵依赖树接口 100% 覆盖**：
   * 不仅要生成主页面的列表接口，还必须为 `dependencyTree` 中扫描出的**详情弹窗接口、子标签页列表接口、编辑表单下拉字典接口、图表统计接口**全部生成对应 Mock 处理器，确保用户在页面上点击“查看详情”、“编辑”、“切换 Tab”时每个请求都有真实响应。
3. **强制跨页面主数据实体关联**：
   * 生成 `src/mock/sharedContext.js`，加载 `runtime/shared-entities.json` 中的核心主数据（如项目 A、项目 B、客户 A 等）。
   * 凡是在蓝图中标记了 `sharedEntityRef` 或字段名/中文标签涉及“项目名称、项目编号、客户名称、所属部门、负责人”的字段，**必须直接从 `sharedContext` 中抽取关联数据**，确保列表页、详情页、关联模块及统计图表中的数据完全对得上号。
4. **内存级 CRUD 状态闭环**：
   * 每个业务模块在内存中维护 `dbList`（初始 12 条贴合中文语义的数据），支持 `GET`（分页 + 关键字筛选）、`POST`（新增并同步写入 `sharedContext` 若为主实体）、`PUT`（修改合并）、`DELETE`（删除过滤）。
5. **增量合并注册表 (`src/mock/index.js`)**：
   * 若工程中已存在 `src/mock/modules/` 下的其他模块文件，**严禁删除或覆盖旧模块**，只需将本次新生成的模块导入并合并到 `src/mock/index.js` 的总路由映射表中。
