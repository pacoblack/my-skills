const fs = require('fs');
const path = require('path');

const skillDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(skillDir, '../../..');
const runtimeDir = path.join(skillDir, 'runtime');
const config = JSON.parse(fs.readFileSync(path.join(runtimeDir, 'project-config.json'), 'utf-8'));
const manifest = JSON.parse(fs.readFileSync(path.join(runtimeDir, 'batch-manifest.json'), 'utf-8'));
const graph = JSON.parse(fs.readFileSync(path.join(runtimeDir, 'graph-store.json'), 'utf-8'));
const outDir = path.join(projectRoot, 'docs/audit');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1. 汇总所有子应用的入口文件、路由目录文件、注册路由、全局组件作为可达根节点
const reachableFiles = new Set([
  ...graph.registeredRoutes,
  ...graph.globalComponents
]);

for (const app of (config.apps || [])) {
  if (app.includeInAudit === false) continue;
  for (const ef of (app.entryFiles || [])) reachableFiles.add(ef);
  for (const f of manifest.allSrcFiles) {
    if ((app.routerDirs || []).some(rd => f.startsWith(`${rd}/`))) {
      reachableFiles.add(f);
    }
  }
}

// 2. 全仓库（跨 Monorepo 子包）广度优先可达性染色
const queue = Array.from(reachableFiles);
while (queue.length > 0) {
  const curr = queue.shift();
  for (const next of (graph.edges[curr] || [])) {
    const cleanNext = next.replace(/\/+$/, '');
    const matched = manifest.allSrcFiles.find(
      f =>
        f === cleanNext ||
        f.startsWith(`${cleanNext}.`) ||
        f === `${cleanNext}/index.vue` ||
        f === `${cleanNext}/index.js` ||
        f === `${cleanNext}/index.ts`
    );
    if (matched && !reachableFiles.has(matched)) {
      reachableFiles.add(matched);
      queue.push(matched);
    }
  }
}

// 3. 全局未使用 API 判定（跨包汇总：只要任意应用调用过即安全）
const calledApiSet = new Set(graph.calledApis);
const deadApis = graph.definedApis.filter(
  api => !calledApiSet.has(`${api.filePath}::${api.funcName}`)
);

// 4. 分应用生成报告
let md = `# 存量死代码与孤儿页面审计报告 (Monorepo / qiankun 兼容版)\n\n`;
md += `- **审计时间**：${new Date().toISOString()}\n`;
md += `- **仓库架构**：${config.architecture.isMonorepo ? 'Monorepo 多包仓库' : '单仓库'} | ${config.architecture.hasQiankun ? 'qiankun 微前端' : '常规前端架构'}\n`;
md += `- **扫描文件总数**：${manifest.totalFiles} 个（共 ${manifest.totalBatches} 个微批）\n\n`;

let totalOrphanPages = 0;
const appReports = [];

for (const app of (config.apps || [])) {
  if (app.includeInAudit === false) continue;

  const pagePrefixes = (app.pageDirs || []).map(d => `${d.replace(/\/+$/, '')}/`);
  const appViewPages = manifest.allSrcFiles.filter(
    f => f.endsWith('.vue') && pagePrefixes.some(prefix => f.startsWith(prefix))
  );
  const appOrphans = appViewPages.filter(page => !reachableFiles.has(page));
  const appDeadApis = deadApis.filter(a => a.appId === app.appId || a.filePath.startsWith(`${app.srcRoot}/`));
  const hasDynRouter = (graph.dynamicRouterApps || []).includes(app.appId);

  totalOrphanPages += appOrphans.length;
  appReports.push({ app, appOrphans, appDeadApis, hasDynRouter });
}

md += `## 一、 全局审计总览\n\n`;
md += `- **定义但未使用的 API 函数总数**：**${deadApis.length}** 个\n`;
md += `- **未注册路由且深度不可达的孤儿页面总数**：**${totalOrphanPages}** 个\n\n`;

md += `| 应用 / 包名 | 架构角色 | 框架版本 | 废弃 API 数 | 孤儿页面数 |\n`;
md += `| :--- | :--- | :--- | :--- | :--- |\n`;
for (const item of appReports) {
  md += `| \`${item.app.appId}\` (\`${item.app.rootPath}\`) | ${item.app.qiankunRole} | ${item.app.vueVersion} | ${item.appDeadApis.length} | ${item.appOrphans.length} |\n`;
}
md += `\n---\n\n`;

// 5. 逐个应用输出明细
for (const item of appReports) {
  const { app, appOrphans, appDeadApis, hasDynRouter } = item;
  md += `## 应用明细：\`${app.appId}\` (${app.qiankunRole} / ${app.vueVersion})\n\n`;

  md += `### 1. 未使用的 API 函数 (${appDeadApis.length} 个)\n\n`;
  if (appDeadApis.length === 0) {
    md += `_无废弃 API 函数。_\n\n`;
  } else {
    md += `| 函数名 | 定义文件 | 请求方式 | 接口路径 |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    appDeadApis.forEach(a => {
      md += `| \`${a.funcName}\` | \`${a.filePath}\` | \`${a.method || '-'}\` | \`${a.url || '-'}\` |\n`;
    });
    md += `\n`;
  }

  if (!app.isSharedLib) {
    md += `### 2. 无路由且深度无关联调用的页面 (${appOrphans.length} 个)\n\n`;
    if (appOrphans.length === 0) {
      md += `_无孤儿页面。_\n\n`;
    } else {
      md += `| 页面文件路径 | 审计说明 |\n`;
      md += `| :--- | :--- |\n`;
      appOrphans.forEach(p => {
        const note = hasDynRouter
          ? '静态路由与组件树不可达（⚠️ 该应用存在动态菜单加载，请核对后端菜单表）'
          : '确认未注册路由且在所有父组件/弹窗/Mixin 中无任何引用';
        md += `| \`${p}\` | ${note} |\n`;
      });
      md += `\n`;
    }
  }
}

fs.writeFileSync(path.join(outDir, 'dead-code-report.md'), md, 'utf-8');

console.log(JSON.stringify({
  status: 'audit_completed',
  reportFile: 'docs/audit/dead-code-report.md',
  totalDeadApis: deadApis.length,
  totalOrphanPages
}, null, 2));
