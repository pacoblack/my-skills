#!/usr/bin/env node
/**
 * 确定性工程画像探测脚本（零依赖）
 * 用法: node .trae/skills/vue-demo-architect/scripts/scan-env.js
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function readJson(relPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
  } catch (e) {
    return null;
  }
}

function walkFiles(dir, maxDepth = 5, currentDepth = 0, result = []) {
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return result;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', 'build', '.trae', '.claude', '.cursor'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walkFiles(fullPath, maxDepth, currentDepth + 1, result);
    } else {
      result.push(relPath);
    }
  }
  return result;
}

const pkg = readJson('package.json');
if (!pkg) {
  console.error(JSON.stringify({ error: '未在当前目录找到 package.json' }, null, 2));
  process.exit(1);
}

const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const vueRaw = allDeps.vue || '';
const vueVersion = vueRaw.includes('3.') ? 3 : 2;

const isVite = exists('vite.config.js') || exists('vite.config.ts') || Boolean(allDeps.vite);
const bundler = isVite ? 'vite' : 'vue-cli';
const envPrefix = isVite ? 'VITE_' : 'VUE_APP_';

let uiLib = 'custom';
if (allDeps['element-ui']) uiLib = 'element-ui';
else if (allDeps['element-plus']) uiLib = 'element-plus';
else if (allDeps['ant-design-vue']) uiLib = 'ant-design-vue';
else if (allDeps.vant) uiLib = 'vant';

let storeLib = 'none';
if (allDeps.pinia) storeLib = 'pinia';
else if (allDeps.vuex) storeLib = 'vuex';

const srcFiles = walkFiles(path.join(root, 'src'), 6);
const envFiles = fs.readdirSync(root).filter(f => f.startsWith('.env'));

const requestCandidates = srcFiles.filter(f => /(request|http|axios|fetch)\.(js|ts)$/i.test(f));
const routerCandidates = srcFiles.filter(f => /(router|permission).*\.(js|ts)$/i.test(f));
const loginCandidates = srcFiles.filter(f => /login.*\.vue$/i.test(f));
const userStoreCandidates = srcFiles.filter(f => /(store|stores).*user.*\.(js|ts)$/i.test(f));
const apiDirs = Array.from(new Set(srcFiles.filter(f => f.startsWith('src/api/')).map(f => f.split('/').slice(0, 2).join('/'))));

const echartsPages = [];
const uploadPages = [];
for (const f of srcFiles) {
  if (!f.endsWith('.vue')) continue;
  try {
    const content = fs.readFileSync(path.join(root, f), 'utf8');
    if (/echarts|setOption|v-chart|Chart/i.test(content)) echartsPages.push(f);
    if (/el-upload|a-upload|multipart\/form-data/i.test(content)) uploadPages.push(f);
  } catch (e) {}
}

const report = {
  projectName: pkg.name || 'vue-project',
  techStack: {
    vueVersion,
    vueRaw,
    bundler,
    envPrefix,
    uiLib,
    storeLib,
    hasAxios: Boolean(allDeps.axios),
    hasMockJs: Boolean(allDeps.mockjs)
  },
  detectedFiles: {
    envFiles,
    requestCandidates,
    routerCandidates,
    loginCandidates,
    userStoreCandidates,
    apiDirs: apiDirs.length ? apiDirs : ['src/api'],
    viewsDir: exists('src/views') ? 'src/views' : (exists('src/pages') ? 'src/pages' : 'src'),
    echartsPages,
    uploadPages
  }
};

console.log(JSON.stringify(report, null, 2));
