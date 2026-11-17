#!/usr/bin/env node
/**
 * Demo 构建静态完整性自检脚本
 * 用法: node .trae/skills/vue-demo-architect/scripts/verify-demo.js
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const skillDir = path.join(root, '.trae/skills/vue-demo-architect');
const blueprintPath = path.join(skillDir, 'runtime/blueprint.json');

const checks = [];
function record(ok, title, detail = '') {
  checks.push({ status: ok ? 'PASS' : 'FAIL', title, detail });
}

// 1. 检查环境变量文件
const hasEnvDemo = fs.existsSync(path.join(root, '.env.demo'));
record(hasEnvDemo, '检查 .env.demo 环境隔离文件', hasEnvDemo ? '已创建' : '缺失 .env.demo');

// 2. 检查 package.json 脚本
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const hasScripts = Boolean(pkg.scripts && pkg.scripts['dev:demo'] && pkg.scripts['build:demo']);
  record(hasScripts, '检查 package.json 演示脚本', hasScripts ? 'dev:demo 与 build:demo 已配置' : '缺少演示启动脚本');
} catch (e) {
  record(false, '读取 package.json', e.message);
}

// 3. 检查 src/mock 核心文件
const requiredMockFiles = [
  'src/mock/adapter.js',
  'src/mock/utils/faker.js',
  'src/mock/modules/auth.js',
  'src/mock/modules/index.js'
];
for (const rel of requiredMockFiles) {
  const ok = fs.existsSync(path.join(root, rel));
  record(ok, `检查核心 Mock 文件: ${rel}`, ok ? '存在' : '缺失');
}

// 4. 校验 blueprint.json 路由覆盖率
if (fs.existsSync(blueprintPath)) {
  try {
    const bp = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    const modCount = Array.isArray(bp.modules) ? bp.modules.length : 0;
    let apiCount = 0;
    (bp.modules || []).forEach(m => { apiCount += (m.apis || []).length; });
    record(modCount > 0, '校验 runtime/blueprint.json 蓝图数据', `已收录 ${modCount} 个业务模块，共 ${apiCount} 个接口`);
  } catch (e) {
    record(false, '解析 runtime/blueprint.json', e.message);
  }
} else {
  record(false, '检查 runtime/blueprint.json', '文件不存在，请先执行阶段一扫描');
}

const failed = checks.filter(c => c.status === 'FAIL');
console.log(JSON.stringify({
  summary: failed.length === 0 ? 'ALL_PASSED' : 'HAS_WARNINGS',
  passedCount: checks.length - failed.length,
  failedCount: failed.length,
  checks
}, null, 2));

if (failed.length > 0) process.exit(1);
