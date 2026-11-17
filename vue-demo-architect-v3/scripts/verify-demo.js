#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const rootDir = process.cwd()
const blueprintPath = path.join(rootDir, '.trae/skills/vue-demo-architect/runtime/blueprint.json')

console.log('=== Vue Demo 静态完整性自检 ===')

if (!fs.existsSync(blueprintPath)) {
  console.error('[错误] 未找到 runtime/blueprint.json，请先执行阶段一扫描。')
  process.exit(1)
}

const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'))
const requiredFiles = [
  '.env.demo',
  'src/mock/utils/faker.js',
  'src/mock/adapter.js',
  'src/mock/index.js'
]

let hasError = false

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(rootDir, file))) {
    console.error(`[缺失] 核心文件不存在: ${file}`)
    hasError = true
  } else {
    console.log(`[正常] 已就绪: ${file}`)
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'))
if (!pkg.scripts || !pkg.scripts['dev:demo'] || !pkg.scripts['build:demo']) {
  console.error('[缺失] package.json 中缺少 dev:demo 或 build:demo 脚本')
  hasError = true
} else {
  console.log('[正常] package.json 脚本配置完整')
}

const mockIndexContent = fs.existsSync(path.join(rootDir, 'src/mock/index.js'))
  ? fs.readFileSync(path.join(rootDir, 'src/mock/index.js'), 'utf-8')
  : ''

let totalApis = 0
let coveredApis = 0

for (const mod of (blueprint.modules || [])) {
  for (const api of (mod.apis || [])) {
    totalApis++
    const cleanUrl = api.url.split('?')[0]
    if (mockIndexContent.includes(cleanUrl)) {
      coveredApis++
    } else {
      console.warn(`[警告] 蓝图接口可能未在 src/mock/index.js 中显式注册: ${api.method || 'GET'} ${cleanUrl}`)
    }
  }
}

console.log(`[统计] 蓝图模块数: ${(blueprint.modules || []).length}, 扫描接口数: ${totalApis}, 显式匹配数: ${coveredApis}`)

if (hasError) {
  process.exit(1)
} else {
  console.log('=== 自检通过，可运行 npm run dev:demo 进行预览 ===')
}
