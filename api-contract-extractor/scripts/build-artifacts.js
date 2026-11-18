const fs = require('fs');
const path = require('path');

// 解析命令行参数：支持 --route=system-user（仅重绘指定路由文档）或全量重绘
const args = process.argv.slice(2);
const routeArg = args.find(a => a.startsWith('--route='));
const targetRouteKey = routeArg ? routeArg.split('=')[1] : null;

const skillDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(skillDir, '../../..'); // 指向项目根目录

const registryDir = path.join(skillDir, 'runtime/registry');
const routesRegDir = path.join(registryDir, 'routes');
const globalApisPath = path.join(registryDir, '_global-apis.json');
const manifestPath = path.join(skillDir, 'runtime/route-manifest.json');

const docsOutDir = path.join(projectRoot, 'docs/api-spec');
const mockDomainsDir = path.join(projectRoot, 'src/mock/domains');
const mockEntryPath = path.join(projectRoot, 'src/mock/all-apis-mock.js');

[docsOutDir, mockDomainsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

if (!fs.existsSync(globalApisPath)) {
  console.error('❌ 未找到全局接口注册表 _global-apis.json，请先执行扫描与 diff-registry.js');
  process.exit(1);
}

const globalStore = JSON.parse(fs.readFileSync(globalApisPath, 'utf-8'));
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  : { routes: {} };

// 1. 生成单路由 Markdown 文档
function buildRouteDoc(routeKey) {
  const routeFile = path.join(routesRegDir, `${routeKey}.json`);
  if (!fs.existsSync(routeFile)) return;

  const routeData = JSON.parse(fs.readFileSync(routeFile, 'utf-8'));
  const apis = routeData.apiKeys
    .map(k => globalStore.apis[k])
    .filter(Boolean);

  const sharedCount = apis.filter(a => (a.usedInRoutes || []).length > 1).length;

  let md = `# 路由模块：${routeData.menuName} (\`${routeData.routePath || routeKey}\`)\n\n`;
  md += `> 本文档由 \`api-contract-extractor\` 自动按路由逆向生成。\n`;
  md += `> 标记 \`🆕\` 为最近一次增量扫描新发现的字段；标记 \`🔁\` 表示该接口在多个路由页面中被复用（字段已跨页面自动聚合）。\n\n`;
  md += `- **路由标识**：\`${routeData.routeKey}\`\n`;
  md += `- **入口文件**：\`${routeData.entryFile || '-'}\`\n`;
  md += `- **接口总数**：\`${apis.length}\` 个（其中跨路由复用接口 \`${sharedCount}\` 个）\n`;

  if (routeData.relations && routeData.relations.length > 0) {
    md += `\n## 跨页面参数传递链路\n`;
    md += `| 来源接口 | 来源字段 | 目标参数 | 目标接口 |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    routeData.relations.forEach(rel => {
      md += `| \`${rel.sourceApi}\` | \`${rel.sourceField}\` | \`${rel.targetParam}\` | \`${rel.targetApi}\` |\n`;
    });
  }

  md += `\n---\n\n`;

  apis.forEach((api, idx) => {
    const isShared = (api.usedInRoutes || []).length > 1;
    const badge = isShared ? ' 🔁' : '';
    const sharedMenus = (api.usedInRoutes || [])
      .map(rk => (manifest.routes[rk] ? manifest.routes[rk].menuName : rk))
      .join('、');

    md += `### ${idx + 1}. ${api.summary}${badge}\n`;
    md += `- **接口地址**：\`${api.method} ${api.url}\`\n`;
    md += `- **接口角色 / 响应模式**：\`${api.role}\` / \`${api.responseType}\`\n`;
    md += `- **归属业务域**：\`${api.domain}\`\n`;
    md += `- **引用页面/组件**：\`${(api.sources || []).join(', ')}\`\n`;
    if (isShared) {
      md += `- **跨路由复用菜单**：${sharedMenus}\n`;
    }

    md += `\n#### 请求参数 (Request)\n`;
    if (!api.requestFields || api.requestFields.length === 0) {
      md += `_无请求参数_\n\n`;
    } else {
      md += `| 参数名 | 位置 | 类型 | 说明 | 必填 |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      api.requestFields.forEach(f => {
        const newTag = f.isNew ? ' 🆕' : '';
        md += `| \`${f.name}\` | \`${f.in || 'query'}\` | \`${f.type || 'string'}\` | ${f.label || '-'}${newTag} | ${f.required ? '是' : '否'} |\n`;
      });
      md += `\n`;
    }

    md += `#### 响应字段 (Response Data)\n`;
    if (!api.responseFields || api.responseFields.length === 0) {
      md += `_无明确响应字段或仅返回操作状态_\n\n`;
    } else {
      md += `| 字段路径 | 类型 | 页面映射说明 | 枚举值线索 |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      api.responseFields.forEach(f => {
        const newTag = f.isNew ? ' 🆕' : '';
        const enums = f.enumValues && f.enumValues.length ? `\`${f.enumValues.join(', ')}\`` : '-';
        md += `| \`${f.name}\` | \`${f.type || 'string'}\` | ${f.label || '-'}${newTag} | ${enums} |\n`;
      });
      md += `\n`;
    }
  });

  fs.writeFileSync(path.join(docsOutDir, `${routeKey}.md`), md, 'utf-8');
}

// 2. 生成总览目录 docs/api-spec/README.md
function buildReadmeIndex() {
  const allApis = Object.values(globalStore.apis);
  const sharedApis = allApis.filter(a => (a.usedInRoutes || []).length > 1);
  const routeFiles = fs.readdirSync(routesRegDir).filter(f => f.endsWith('.json'));

  let readme = `# 前端逆向接口契约总览\n\n`;
  readme += `- **最后更新时间**：${new Date().toISOString()}\n`;
  readme += `- **全局去重后接口总数**：**${allApis.length}** 个\n`;
  readme += `- **跨路由公共复用接口**：**${sharedApis.length}** 个\n`;
  readme += `- **已扫描完成路由数**：**${routeFiles.length}** 个\n\n`;

  readme += `## 一、 按路由菜单查阅\n\n`;
  readme += `| 路由标识 | 菜单名称 | 路由路径 | 接口数 | 文档链接 |\n`;
  readme += `| :--- | :--- | :--- | :--- | :--- |\n`;

  routeFiles.forEach(file => {
    const r = JSON.parse(fs.readFileSync(path.join(routesRegDir, file), 'utf-8'));
    readme += `| \`${r.routeKey}\` | ${r.menuName} | \`${r.routePath || '-'}\` | ${r.apiKeys.length} | [查看详情](./${r.routeKey}.md) |\n`;
  });

  if (sharedApis.length > 0) {
    readme += `\n## 二、 高频跨路由复用接口清单\n\n`;
    readme += `| 接口地址 | 接口说明 | 复用次数 | 引用路由 |\n`;
    readme += `| :--- | :--- | :--- | :--- |\n`;
    sharedApis
      .sort((a, b) => b.usedInRoutes.length - a.usedInRoutes.length)
      .forEach(api => {
        readme += `| \`${api.method} ${api.url}\` | ${api.summary} | ${api.usedInRoutes.length} | \`${api.usedInRoutes.join(', ')}\` |\n`;
      });
  }

  fs.writeFileSync(path.join(docsOutDir, 'README.md'), readme, 'utf-8');
}

// 3. 按业务域生成全局去重 Mock 文件及总入口 src/mock/all-apis-mock.js
function buildGlobalMocks() {
  const domainGroups = {};

  Object.entries(globalStore.apis).forEach(([key, api]) => {
    const domain = api.domain || 'common';
    if (!domainGroups[domain]) domainGroups[domain] = {};
    domainGroups[domain][key] = {
      method: api.method,
      url: api.url,
      summary: api.summary,
      role: api.role,
      responseType: api.responseType,
      usedInRoutes: api.usedInRoutes,
      requestFields: api.requestFields.map(({ isNew, ...rest }) => rest),
      responseFields: api.responseFields.map(({ isNew, ...rest }) => rest)
    };
  });

  const domains = Object.keys(domainGroups).sort();

  domains.forEach(domain => {
    const content = `// 自动生成的业务域 Mock 契约文件 [${domain}] - 请勿手动修改结构\nmodule.exports = ${JSON.stringify(domainGroups[domain], null, 2)};\n`;
    fs.writeFileSync(path.join(mockDomainsDir, `${domain}.mock.js`), content, 'utf-8');
  });

  // 生成统一汇总入口
  let entryCode = `// 自动生成的全量去重接口 Mock 契约总入口 (共 ${Object.keys(globalStore.apis).length} 个唯一接口)\n`;
  domains.forEach(domain => {
    const safeVar = domain.replace(/[^a-zA-Z0-9_]/g, '_') + 'Mocks';
    entryCode += `const ${safeVar} = require('./domains/${domain}.mock.js');\n`;
  });
  entryCode += `\nmodule.exports = {\n`;
  domains.forEach(domain => {
    const safeVar = domain.replace(/[^a-zA-Z0-9_]/g, '_') + 'Mocks';
    entryCode += `  ...${safeVar},\n`;
  });
  entryCode += `};\n`;

  fs.writeFileSync(mockEntryPath, entryCode, 'utf-8');
}

// 执行构建流程
if (targetRouteKey) {
  buildRouteDoc(targetRouteKey);
} else {
  const allRouteFiles = fs.readdirSync(routesRegDir).filter(f => f.endsWith('.json'));
  allRouteFiles.forEach(f => buildRouteDoc(f.replace(/\.json$/, '')));
}

buildReadmeIndex();
buildGlobalMocks();

console.log(JSON.stringify({
  status: 'success',
  updatedDoc: targetRouteKey ? `docs/api-spec/${targetRouteKey}.md` : 'all-routes',
  totalUniqueMockApis: Object.keys(globalStore.apis).length,
  mockDomains: fs.readdirSync(mockDomainsDir)
}, null, 2));
