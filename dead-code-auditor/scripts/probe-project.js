const fs = require('fs');
const path = require('path');

const skillDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(skillDir, '../../..');
const runtimeDir = path.join(skillDir, 'runtime');
if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

// 1. 探测是否为 Monorepo 架构
const rootPkg = readJsonSafe(path.join(projectRoot, 'package.json')) || {};
const workspaceGlobs = [];

if (Array.isArray(rootPkg.workspaces)) {
  workspaceGlobs.push(...rootPkg.workspaces);
} else if (rootPkg.workspaces && Array.isArray(rootPkg.workspaces.packages)) {
  workspaceGlobs.push(...rootPkg.workspaces.packages);
}

const pnpmWsPath = path.join(projectRoot, 'pnpm-workspace.yaml');
if (fs.existsSync(pnpmWsPath)) {
  const yamlText = fs.readFileSync(pnpmWsPath, 'utf-8');
  const matches = yamlText.match(/-\s*['"]?([^'"\n]+)['"]?/g) || [];
  matches.forEach(m => workspaceGlobs.push(m.replace(/^-\s*['"]?|['"]?$/g, '').trim()));
}

// 展开候选子包目录（兼容常见目录名）
const candidatePkgDirs = new Set();
const defaultContainers = ['packages', 'apps', 'sub-apps', 'micro-apps', 'projects'];

for (const g of workspaceGlobs) {
  const cleanDir = g.replace(/\/\*+$/, '').replace(/\/+$/, '');
  const absContainer = path.join(projectRoot, cleanDir);
  if (fs.existsSync(absContainer) && fs.statSync(absContainer).isDirectory()) {
    if (fs.existsSync(path.join(absContainer, 'package.json'))) {
      candidatePkgDirs.add(cleanDir);
    } else {
      for (const sub of fs.readdirSync(absContainer, { withFileTypes: true })) {
        if (sub.isDirectory() && fs.existsSync(path.join(absContainer, sub.name, 'package.json'))) {
          candidatePkgDirs.add(`${cleanDir}/${sub.name}`);
        }
      }
    }
  }
}

// 兜底检查常见容器目录
if (candidatePkgDirs.size === 0) {
  for (const container of defaultContainers) {
    const absContainer = path.join(projectRoot, container);
    if (fs.existsSync(absContainer) && fs.statSync(absContainer).isDirectory()) {
      for (const sub of fs.readdirSync(absContainer, { withFileTypes: true })) {
        if (sub.isDirectory() && fs.existsSync(path.join(absContainer, sub.name, 'package.json'))) {
          candidatePkgDirs.add(`${container}/${sub.name}`);
        }
      }
    }
  }
}

const isMonorepo = candidatePkgDirs.size > 0;
const appRoots = isMonorepo ? Array.from(candidatePkgDirs) : ['.'];

// 2. 分析每个应用/子包的技术栈与目录结构
function inspectApp(relRoot) {
  const absRoot = path.join(projectRoot, relRoot);
  const pkg = readJsonSafe(path.join(absRoot, 'package.json')) || {};
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(rootPkg.dependencies || {}), ...(rootPkg.devDependencies || {}) };

  let vueVersion = 'none';
  if (deps.vue) {
    vueVersion = /3/.test(deps.vue) ? 'Vue 3' : 'Vue 2';
  }

  // 检测 qiankun 角色
  let qiankunRole = 'standalone';
  const srcRoot = fs.existsSync(path.join(absRoot, 'src')) ? `${relRoot === '.' ? '' : relRoot + '/'}src` : (relRoot === '.' ? '.' : relRoot);
  const absSrc = path.join(projectRoot, srcRoot);

  if (deps.qiankun) {
    qiankunRole = 'qiankun-master (主应用)';
  }
  // 检查入口文件是否导出 qiankun 生命周期
  for (const entryName of ['main.js', 'main.ts', 'public-path.js', 'public-path.ts']) {
    const entryFile = path.join(absSrc, entryName);
    if (fs.existsSync(entryFile)) {
      const content = fs.readFileSync(entryFile, 'utf-8');
      if (content.includes('registerMicroApps') || content.includes('loadMicroApp')) {
        qiankunRole = 'qiankun-master (主应用)';
      } else if (content.includes('__POWERED_BY_QIANKUN__') || (content.includes('bootstrap') && content.includes('mount') && content.includes('unmount'))) {
        qiankunRole = 'qiankun-micro-app (微应用)';
      }
    }
  }

  function detectSubDirs(names) {
    return names
      .map(n => `${srcRoot}/${n}`.replace(/^\.\//, '').replace(/\/+/g, '/'))
      .filter(rel => fs.existsSync(path.join(projectRoot, rel)));
  }

  const apiDirs = detectSubDirs(['api', 'apis', 'services', 'service', 'request', 'http']);
  const pageDirs = detectSubDirs(['views', 'pages', 'modules', 'screens']);
  const routerDirs = detectSubDirs(['router', 'routes']);
  const entryFiles = ['main.js', 'main.ts', 'App.vue', 'permission.js', 'permission.ts']
    .map(f => `${srcRoot}/${f}`.replace(/^\.\//, '').replace(/\/+/g, '/'))
    .filter(rel => fs.existsSync(path.join(projectRoot, rel)));

  // 提取当前子应用别名
  const cleanSrc = srcRoot.replace(/^\.\//, '');
  const aliases = { '@/': `${cleanSrc}/` };
  for (const cfgName of ['tsconfig.json', 'jsconfig.json']) {
    const cfg = readJsonSafe(path.join(absRoot, cfgName));
    const paths = cfg?.compilerOptions?.paths || {};
    for (const [k, v] of Object.entries(paths)) {
      if (Array.isArray(v) && v) {
        const target = v.replace(/\*$/, '').replace(/^\.\//, '');
        aliases[k.replace(/\*$/, '')] = relRoot === '.' ? target : `${relRoot}/${target}`.replace(/\/+/g, '/');
      }
    }
  }

  const appId = pkg.name ? pkg.name.replace(/^@[^/]+\//, '') : (relRoot === '.' ? 'main-app' : path.basename(relRoot));
  const isSharedLib = vueVersion === 'none' || (pageDirs.length === 0 && apiDirs.length > 0);

  return {
    appId,
    packageName: pkg.name || appId,
    rootPath: relRoot,
    srcRoot: cleanSrc,
    isSharedLib,
    vueVersion,
    qiankunRole,
    apiDirs,
    pageDirs,
    routerDirs,
    entryFiles,
    aliases,
    includeInAudit: true
  };
}

const apps = appRoots.map(inspectApp);

// 建立全局包名到路径的映射（方便解析 Monorepo 跨包 import，如 @company/shared -> packages/shared/src）
const workspacePackageMap = {};
for (const app of apps) {
  if (app.packageName) {
    workspacePackageMap[app.packageName] = app.srcRoot;
  }
}

const config = {
  confirmed: false,
  architecture: {
    isMonorepo,
    hasQiankun: apps.some(a => a.qiankunRole !== 'standalone')
  },
  workspacePackageMap,
  apps,
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'assets', 'styles', 'icons', 'mock', '__tests__', 'coverage'],
  maxFilesPerBatch: 10
};

const outPath = path.join(runtimeDir, 'project-config.json');
fs.writeFileSync(outPath, JSON.stringify(config, null, 2), 'utf-8');

console.log(JSON.stringify({
  status: 'probed_waiting_confirmation',
  configPath: '.trae/skills/dead-code-auditor/runtime/project-config.json',
  summary: {
    isMonorepo: config.architecture.isMonorepo,
    hasQiankun: config.architecture.hasQiankun,
    detectedAppsCount: apps.length
  },
  apps: apps.map(a => ({
    appId: a.appId,
    rootPath: a.rootPath,
    vueVersion: a.vueVersion,
    qiankunRole: a.qiankunRole,
    isSharedLib: a.isSharedLib,
    apiDirs: a.apiDirs,
    pageDirs: a.pageDirs,
    routerDirs: a.routerDirs
  }))
}, null, 2));
