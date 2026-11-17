#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const rootDir = process.cwd()

function exists(relPath) {
  return fs.existsSync(path.join(rootDir, relPath))
}

function readJson(relPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(rootDir, relPath), 'utf-8'))
  } catch (e) {
    return null
  }
}

function walkDir(dir, extFilter, maxDepth = 5, currentDepth = 0) {
  const results = []
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', '.trae', '.claude', '.cursor'].includes(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, extFilter, maxDepth, currentDepth + 1))
    } else if (!extFilter || extFilter.some(ext => entry.name.endsWith(ext))) {
      results.push(path.relative(rootDir, fullPath).replace(/\\/g, '/'))
    }
  }
  return results
}

const pkg = readJson('package.json') || {}
const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {})

const vueVersionRaw = allDeps.vue || ''
const vueVersion = vueVersionRaw.includes('3.') || vueVersionRaw.startsWith('^3') || vueVersionRaw.startsWith('~3') ? 3 : 2

let bundler = 'vue-cli'
if (exists('vite.config.js') || exists('vite.config.ts') || allDeps.vite) {
  bundler = 'vite'
}

const uiLibraries = ['element-ui', 'element-plus', 'ant-design-vue', 'vant', '@arco-design/web-vue', 'naive-ui']
  .filter(lib => Boolean(allDeps[lib]))

const srcFiles = walkDir(path.join(rootDir, 'src'), ['.js', '.ts', '.vue'])

const requestCandidates = srcFiles.filter(f => /(request|http|axios|fetch)\.(js|ts)$/i.test(f))
const routerCandidates = srcFiles.filter(f => /(router\/index|permission|guard)\.(js|ts)$/i.test(f))
const loginCandidates = srcFiles.filter(f => /login.*\.vue$/i.test(f))
const storeCandidates = srcFiles.filter(f => /store\/.*(user|auth|app)\.(js|ts)$/i.test(f))
const apiFiles = srcFiles.filter(f => /^src\/api\//.test(f))
const viewFiles = srcFiles.filter(f => /^src\/views\//.test(f) && f.endsWith('.vue'))

const echartsFiles = []
const uploadFiles = []

for (const f of viewFiles) {
  try {
    const content = fs.readFileSync(path.join(rootDir, f), 'utf-8')
    if (/echarts|setOption|v-chart/i.test(content)) {
      echartsFiles.push(f)
    }
    if (/el-upload|a-upload|FormData/i.test(content)) {
      uploadFiles.push(f)
    }
  } catch (e) {}
}

const report = {
  techStack: {
    vueVersion,
    vueVersionRaw,
    bundler,
    envPrefix: bundler === 'vite' ? 'VITE_' : 'VUE_APP_',
    uiLibraries,
    hasEchartsDep: Boolean(allDeps.echarts || allDeps['vue-echarts']),
    scripts: pkg.scripts || {}
  },
  candidates: {
    requestFiles: requestCandidates,
    routerFiles: routerCandidates,
    loginFiles: loginCandidates,
    storeFiles: storeCandidates,
    apiDirCount: apiFiles.length,
    sampleApiFiles: apiFiles.slice(0, 10),
    viewFilesCount: viewFiles.length,
    echartsFiles,
    uploadFiles
  }
}

console.log(JSON.stringify(report, null, 2))
