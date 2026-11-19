const fs = require('fs');
const path = require('path');

const skillDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(skillDir, '../../..');
const runtimeDir = path.join(skillDir, 'runtime');
const chunksDir = path.join(runtimeDir, 'chunks');
const configPath = path.join(runtimeDir, 'project-config.json');

if (!fs.existsSync(configPath)) {
  console.error('❌ 请先运行 probe-project.js 探测项目结构并确认配置');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir, { recursive: true });

const TARGET_EXTS = new Set(['.vue', '.js', '.ts', '.jsx', '.tsx']);
const IGNORE_DIRS = new Set(config.ignoreDirs || ['node_modules', '.git', 'dist']);
const MAX_FILES = config.maxFilesPerBatch || 10;

function walkFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, fileList);
    } else if (TARGET_EXTS.has(path.extname(entry.name))) {
      fileList.push(path.relative(projectRoot, fullPath).replace(/\\/g, '/'));
    }
  }
  return fileList;
}

const batches = [];
const allSrcFiles = [];
let batchIdx = 1;

for (const app of (config.apps || [])) {
  if (app.includeInAudit === false) continue;

  const absSrc = path.join(projectRoot, app.srcRoot);
  const appFiles = walkFiles(absSrc);
  allSrcFiles.push(...appFiles);

  // 在当前子应用内部按目录模块分组
  const groupMap = new Map();
  for (const file of appFiles) {
    const relToSrc = path.relative(app.srcRoot, file).replace(/\\/g, '/');
    const parts = relToSrc.split('/');
    const groupKey = parts.length >= 2 ? `${parts}-${parts}` : parts;
    if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
    groupMap.get(groupKey).push(file);
  }

  for (const [groupKey, files] of groupMap.entries()) {
    for (let i = 0; i < files.length; i += MAX_FILES) {
      const slice = files.slice(i, i + MAX_FILES);
      const safeApp = app.appId.replace(/[^a-zA-Z0-9_-]/g, '');
      const safeGroup = groupKey.replace(/[^a-zA-Z0-9_-]/g, '');
      batches.push({
        batchId: `batch-${String(batchIdx).padStart(3, '0')}-${safeApp}-${safeGroup}`,
        appId: app.appId,
        status: 'pending',
        fileCount: slice.length,
        files: slice
      });
      batchIdx++;
    }
  }
}

const manifest = {
  createdAt: new Date().toISOString(),
  totalFiles: allSrcFiles.length,
  totalBatches: batches.length,
  completedBatches: 0,
  allSrcFiles,
  batches
};

fs.writeFileSync(path.join(runtimeDir, 'batch-manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

console.log(JSON.stringify({
  status: 'batches_ready',
  totalFiles: allSrcFiles.length,
  totalBatches: batches.length,
  firstBatch: batches ? batches.batchId : null
}, null, 2));
