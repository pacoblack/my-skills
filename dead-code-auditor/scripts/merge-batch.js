const fs = require('fs');
const path = require('path');

const skillDir = path.resolve(__dirname, '..');
const runtimeDir = path.join(skillDir, 'runtime');
const manifestPath = path.join(runtimeDir, 'batch-manifest.json');
const graphPath = path.join(runtimeDir, 'graph-store.json');

const chunkPath = process.argv;
if (!chunkPath || !fs.existsSync(chunkPath)) {
  console.error('❌ 请提供有效的批次碎片路径');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const chunk = JSON.parse(fs.readFileSync(chunkPath, 'utf-8'));

const graph = fs.existsSync(graphPath)
  ? JSON.parse(fs.readFileSync(graphPath, 'utf-8'))
  : {
      dynamicRouterApps: [],
      definedApis: [],
      registeredRoutes: [],
      globalComponents: [],
      edges: {},
      calledApis: []
    };

if (chunk.hasDynamicRouter && chunk.appId) {
  graph.dynamicRouterApps = Array.from(new Set([...graph.dynamicRouterApps, chunk.appId]));
}

// 补充 appId 归属
const apisWithApp = (chunk.definedApis || []).map(a => ({
  ...a,
  appId: a.appId || chunk.appId || 'default'
}));
graph.definedApis.push(...apisWithApp);

graph.registeredRoutes = Array.from(new Set([...graph.registeredRoutes, ...(chunk.registeredRoutes || [])]));
graph.globalComponents = Array.from(new Set([...graph.globalComponents, ...(chunk.globalComponents || [])]));

const calledSet = new Set(graph.calledApis);
for (const ref of (chunk.fileReferences || [])) {
  graph.edges[ref.sourceFile] = Array.from(new Set([
    ...(graph.edges[ref.sourceFile] || []),
    ...(ref.importedFiles || [])
  ]));
  for (const call of (ref.calledApiFuncs || [])) {
    calledSet.add(`${call.apiFile}::${call.funcName}`);
  }
}
graph.calledApis = Array.from(calledSet);

fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf-8');

const targetBatch = manifest.batches.find(b => b.batchId === chunk.batchId);
if (targetBatch) targetBatch.status = 'completed';
manifest.completedBatches = manifest.batches.filter(b => b.status === 'completed').length;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

fs.unlinkSync(chunkPath);

const nextPending = manifest.batches.find(b => b.status === 'pending');
console.log(JSON.stringify({
  batchCompleted: chunk.batchId,
  appId: chunk.appId,
  progress: `${manifest.completedBatches}/${manifest.totalBatches}`,
  nextPendingBatch: nextPending ? nextPending.batchId : 'ALL_DONE'
}, null, 2));
