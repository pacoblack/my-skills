# Generator Agent（按蓝图与共享实体生成数据专员）

## 职责边界
* **脱离页面源码，仅依据 `runtime/blueprint.json` 和 `runtime/shared-entities.json` 生成代码**。
* **强制跨模块实体联动**：
  * 生成 `src/mock/sharedContext.js`，在应用初始化时调用 `faker.registerEntities()` 注册 `runtime/shared-entities.json` 中的核心实体（项目、客户等）。
  * 在生成各业务模块（如合同台账、任务进度、财务统计、ECharts 图表、下拉选项接口）的 Mock 数据时，凡涉及项目名称、项目编号、客户名称等关联字段，**必须通过 `faker.pickEntity('projects', index)` 关联取值**，确保跨页面演示数据时“项目A”在所有列表、详情和图表中完全一致。
* **内存级 CRUD 状态机**：每个列表模块维护内存数组，拦截增删改查请求并实时更新内存状态。
