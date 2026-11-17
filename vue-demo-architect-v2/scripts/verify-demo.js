#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const checks = [
  { name: '.env.demo 环境文件', path: '.env.demo' },
  { name: 'Mock 拦截适配器', path: 'src/mock/adapter.js' },
  { name: 'Mock 随机与实体引擎', path: 'src/mock/utils/faker.js' },
  { name: 'Mock 全局共享上下文', path: 'src/mock/sharedContext.js' },
  { name: 'Mock 路由汇总入口', path: 'src/mock/index.js' }
];

let passed = true;
checks.forEach((item) => {
  const exists = fs.existsSync(path.join(rootDir, item.path));
  console.log(`${exists ? '[OK]' : '[MISSING]'} ${item.name} (${item.path})`);
  if (!exists) passed = false;
});

process.exit(passed ? 0 : 1);
