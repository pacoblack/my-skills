#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const pkgPath = path.join(rootDir, 'package.json');

if (!fs.existsSync(pkgPath)) {
  console.error(JSON.stringify({ error: '未找到 package.json' }));
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});

const vueRaw = allDeps.vue || '';
const vueVersion = vueRaw.includes('3.') || vueRaw.startsWith('^3') ? 3 : 2;
const isVite = Boolean(allDeps.vite) || fs.existsSync(path.join(rootDir, 'vite.config.js')) || fs.existsSync(path.join(rootDir, 'vite.config.ts'));

function findFiles(dir, maxDepth = 4, currentDepth = 0, result = []) {
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return result;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', '.trae', '.claude'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      findFiles(fullPath, maxDepth, currentDepth + 1, result);
    } else {
      result.push(relPath);
    }
  }
  return result;
}

const srcFiles = findFiles(path.join(rootDir, 'src'), 5);
const viewModules = srcFiles.filter(f => f.startsWith('src/views/') && f.endsWith('.vue'));

const report = {
  techStack: {
    vueVersion,
    bundler: isVite ? 'vite' : 'vue-cli',
    envPrefix: isVite ? 'VITE_' : 'VUE_APP_',
    hasAxios: Boolean(allDeps.axios),
    hasEcharts: Boolean(allDeps.echarts)
  },
  candidateFiles: {
    requestFiles: srcFiles.filter(f => /request|http|axios/i.test(f)),
    routerFiles: srcFiles.filter(f => /router|permission/i.test(f)),
    loginFiles: srcFiles.filter(f => /login/i.test(f)),
    apiDirs: [...new Set(srcFiles.filter(f => f.startsWith('src/api/')).map(f => path.dirname(f)))],
    viewModules
  }
};

console.log(JSON.stringify(report, null, 2));
