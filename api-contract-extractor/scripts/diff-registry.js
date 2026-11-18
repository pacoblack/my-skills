const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const registryDir = path.join(baseDir, 'runtime/registry');
const routesRegDir = path.join(registryDir, 'routes');
const globalApisPath = path.join(registryDir, '_global-apis.json');
const manifestPath = path.join(baseDir, 'runtime/route-manifest.json');

// 确保目录存在
[registryDir, routesRegDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const inputPath = process.argv[2];
if (!inputPath || !fs.existsSync(inputPath)) {
  console.error('❌ 请提供有效的临时提取碎片文件路径，例如: node diff-registry.js runtime/chunks/temp-system-user.json');
  process.exit(1);
}

// 加载全局唯一接口池
const globalStore = fs.existsSync(globalApisPath)
  ? JSON.parse(fs.readFileSync(globalApisPath, 'utf-8'))
  : { updatedAt: '', apis: {} };

// 加载路由任务清单
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  : { updatedAt: '', stats: {}, routes: {} };

const chunk = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const { routeKey, menuName, routePath, entryFile, relations = [], apis = [] } = chunk;

if (!routeKey) {
  console.error('❌ 临时碎片文件缺少 routeKey 字段');
  process.exit(1);
}

const report = {
  routeKey,
  created: [],
  updated: [],
  unchanged: [],
  sharedAcrossRoutes: []
};

// 字段级精准增量合并（不覆盖已有备注，仅追加新字段并标 isNew: true）
function mergeFields(oldFields = [], newFields = []) {
  const map = new Map();
  oldFields.forEach(f => map.set(f.name, { ...f, isNew: false }));
  let hasNew = false;

  newFields.forEach(f => {
    if (!map.has(f.name)) {
      map.set(f.name, { ...f, isNew: true });
      hasNew = true;
    } else {
      const existing = map.get(f.name);
      if (!existing.label && f.label) existing.label = f.label;
      if (f.enumValues && f.enumValues.length) {
        existing.enumValues = Array.from(new Set([...(existing.enumValues || []), ...f.enumValues]));
      }
    }
  });

  return { merged: Array.from(map.values()), hasNew };
}

// 推断 URL 业务域前缀（如 /system/user/list -> system）
function inferDomain(url, explicitDomain) {
  if (explicitDomain) return explicitDomain;
  const clean = url.replace(/^\/+/, '');
  const firstSeg = clean.split('/')[0] || 'common';
  return firstSeg.replace(/[^a-zA-Z0-9_-]/g, '') || 'common';
}

const routeApiKeys = [];

for (const item of apis) {
  const method = item.method.toUpperCase();
  const key = `${method} ${item.url}`;
  routeApiKeys.push(key);

  const existing = globalStore.apis[key];
  const domain = inferDomain(item.url, item.domain);

  if (!existing) {
    // 全新接口写入全局池
    globalStore.apis[key] = {
      method,
      url: item.url,
      summary: item.summary || `${method} ${item.url}`,
      domain,
      role: item.role || 'other',
      responseType: item.responseType || 'object',
      sources: Array.from(new Set(item.sources || [])),
      usedInRoutes: [routeKey],
      requestFields: (item.requestFields || []).map(f => ({ ...f, isNew: true })),
      responseFields: (item.responseFields || []).map(f => ({ ...f, isNew: true })),
      lastUpdated: new Date().toISOString()
    };
    report.created.push(key);
  } else {
    // 已存在接口：记录跨路由引用 + 合并增量字段
    const prevRoutes = new Set(existing.usedInRoutes || []);
    const isNewRouteRef = !prevRoutes.has(routeKey);
    prevRoutes.add(routeKey);
    existing.usedInRoutes = Array.from(prevRoutes);

    if (existing.usedInRoutes.length > 1) {
      report.sharedAcrossRoutes.push(key);
    }

    const reqDiff = mergeFields(existing.requestFields, item.requestFields);
    const resDiff = mergeFields(existing.responseFields, item.responseFields);

    existing.sources = Array.from(new Set([...(existing.sources || []), ...(item.sources || [])]));
    if (!existing.summary && item.summary) existing.summary = item.summary;

    if (reqDiff.hasNew || resDiff.hasNew) {
      existing.requestFields = reqDiff.merged;
      existing.responseFields = resDiff.merged;
      existing.lastUpdated = new Date().toISOString();
      report.updated.push(key);
    } else {
      // 若无新字段，保持原字段结构不变，仅更新路由引用关系
      if (isNewRouteRef) {
        existing.requestFields = reqDiff.merged;
        existing.responseFields = resDiff.merged;
      }
      report.unchanged.push(key);
    }
  }
}

// 1. 保存全局唯一接口池
globalStore.updatedAt = new Date().toISOString();
fs.writeFileSync(globalApisPath, JSON.stringify(globalStore, null, 2), 'utf-8');

// 2. 保存当前路由的轻量引用映射表（隔离跨页面跳转传参 relations）
const routeRecord = {
  routeKey,
  menuName: menuName || routeKey,
  routePath: routePath || '',
  entryFile: entryFile || '',
  relations,
  apiKeys: Array.from(new Set(routeApiKeys)),
  lastScanned: new Date().toISOString()
};
fs.writeFileSync(path.join(routesRegDir, `${routeKey}.json`), JSON.stringify(routeRecord, null, 2), 'utf-8');

// 3. 更新路由任务清单状态
manifest.routes[routeKey] = {
  ...(manifest.routes[routeKey] || {}),
  menuName: routeRecord.menuName,
  routePath: routeRecord.routePath,
  entryFile: routeRecord.entryFile,
  status: 'completed',
  apiCount: routeRecord.apiKeys.length,
  lastScanned: routeRecord.lastScanned
};

const allRoutes = Object.values(manifest.routes);
manifest.updatedAt = new Date().toISOString();
manifest.stats = {
  totalRoutes: allRoutes.length,
  completedRoutes: allRoutes.filter(r => r.status === 'completed').length,
  pendingRoutes: allRoutes.filter(r => r.status !== 'completed').length,
  totalUniqueApis: Object.keys(globalStore.apis).length
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

// 4. 清理临时碎片文件
fs.unlinkSync(inputPath);

console.log(JSON.stringify({
  summary: {
    routeKey,
    created: report.created.length,
    updated: report.updated.length,
    unchanged: report.unchanged.length,
    sharedAcrossRoutes: report.sharedAcrossRoutes.length,
    totalUniqueApisInPool: Object.keys(globalStore.apis).length,
    routeProgress: `${manifest.stats.completedRoutes}/${manifest.stats.totalRoutes}`
  },
  details: report
}, null, 2));
