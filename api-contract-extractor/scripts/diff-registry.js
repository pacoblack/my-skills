const fs = require('fs');
const path = require('path');

const registryPath = path.resolve(__dirname, '../runtime/api-registry.json');
const inputPath = process.argv[2];

if (!inputPath || !fs.existsSync(inputPath)) {
  console.error('请提供有效的临时提取文件路径，例如: node diff-registry.js temp-extracted.json');
  process.exit(1);
}

const registry = fs.existsSync(registryPath)
  ? JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
  : { updatedAt: '', apis: {} };

const extracted = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const report = { created: [], updated: [], unchanged: [] };

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

for (const item of extracted) {
  const key = `${item.method.toUpperCase()} ${item.url}`;
  const existing = registry.apis[key];

  if (!existing) {
    registry.apis[key] = {
      ...item,
      method: item.method.toUpperCase(),
      requestFields: (item.requestFields || []).map(f => ({ ...f, isNew: true })),
      responseFields: (item.responseFields || []).map(f => ({ ...f, isNew: true })),
      lastUpdated: new Date().toISOString()
    };
    report.created.push(key);
  } else {
    const reqDiff = mergeFields(existing.requestFields, item.requestFields);
    const resDiff = mergeFields(existing.responseFields, item.responseFields);

    if (reqDiff.hasNew || resDiff.hasNew) {
      existing.requestFields = reqDiff.merged;
      existing.responseFields = resDiff.merged;
      existing.sources = Array.from(new Set([...(existing.sources || []), ...(item.sources || [])]));
      existing.lastUpdated = new Date().toISOString();
      report.updated.push(key);
    } else {
      report.unchanged.push(key);
    }
  }
}

registry.updatedAt = new Date().toISOString();
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

console.log(JSON.stringify({
  summary: {
    created: report.created.length,
    updated: report.updated.length,
    unchanged: report.unchanged.length,
    totalInRegistry: Object.keys(registry.apis).length
  },
  details: report
}, null, 2));
