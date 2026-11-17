# Axios / Fetch 双栈拦截适配器标准代码模板

## 1. 环境变量文件 (`.env.demo`)

### Vue CLI (Vue 2 / Vue 3 Webpack)
```env
NODE_ENV = 'production'
VUE_APP_DEMO_MODE = 'true'
VUE_APP_BASE_API = '/demo-api'
```

### Vite (Vue 3)
```env
NODE_ENV = 'production'
VITE_DEMO_MODE = 'true'
VITE_APP_BASE_API = '/demo-api'
```

---

## 2. `package.json` 脚本追加规范
在 `scripts` 中安全追加（保留原有所有命令）：
- **Vue CLI**：
  ```json
  "dev:demo": "vue-cli-service serve --mode demo",
  "build:demo": "vue-cli-service build --mode demo"
  ```
- **Vite**：
  ```json
  "dev:demo": "vite --mode demo",
  "build:demo": "vite build --mode demo"
  ```

---

## 3. 核心拦截适配器 (`src/mock/adapter.js`)

```javascript
import authRoutes from './modules/auth'
import businessRoutes from './modules/index'
import faker from './utils/faker'

const allRoutes = [...authRoutes, ...businessRoutes]

function parseQuery(url) {
  const query = {}
  const idx = url.indexOf('?')
  if (idx === -1) return query
  const search = url.slice(idx + 1)
  search.split('&').forEach(pair => {
    if (!pair) return
    const [k, v] = pair.split('=')
    query[decodeURIComponent(k)] = decodeURIComponent(v || '')
  })
  return query
}

function matchRoute(method, cleanPath) {
  const m = (method || 'GET').toUpperCase()
  for (const route of allRoutes) {
    if (route.method.toUpperCase() !== m) continue
    if (route.url === cleanPath) {
      return { handler: route.handler, pathParams: {} }
    }
    if (route.url.includes(':')) {
      const paramNames = []
      const regexStr = '^' + route.url.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name)
        return '([^/]+)'
      }) + '$'
      const match = cleanPath.match(new RegExp(regexStr))
      if (match) {
        const pathParams = {}
        paramNames.forEach((name, i) => { pathParams[name] = match[i + 1] })
        return { handler: route.handler, pathParams }
      }
    }
  }
  return null
}

export function demoAdapter(config) {
  return new Promise((resolve) => {
    const rawUrl = config.url || ''
    const baseURL = config.baseURL || ''
    const withoutBase = rawUrl.startsWith(baseURL) ? rawUrl.slice(baseURL.length) : rawUrl
    const cleanPath = ('/' + withoutBase.split('?')[0]).replace(/\/+/g, '/')
    const query = Object.assign({}, parseQuery(rawUrl), config.params || {})

    let body = {}
    let uploadFileName = ''
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      for (const [k, v] of config.data.entries()) {
        if (v && typeof v === 'object' && v.name) {
          uploadFileName = v.name
        } else {
          body[k] = v
        }
      }
    } else if (typeof config.data === 'string') {
      try { body = JSON.parse(config.data) } catch (e) { body = {} }
    } else if (config.data && typeof config.data === 'object') {
      body = config.data
    }

    const matched = matchRoute(config.method, cleanPath)

    setTimeout(() => {
      let responseData
      if (matched) {
        responseData = matched.handler({ query, body, params: matched.pathParams, uploadFileName })
      } else if (cleanPath.includes('upload')) {
        const meta = faker.mockFileMeta(uploadFileName)
        responseData = { code: 200, msg: '演示上传成功', ...meta, data: meta }
      } else {
        responseData = { code: 200, msg: '演示操作成功', data: {} }
      }

      resolve({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json;charset=UTF-8' },
        config
      })
    }, 260)
  })
}
```

---

## 4. 业务请求文件注入示例 (`src/utils/request.js`)

### Vue CLI 写法
```javascript
service.interceptors.request.use(config => {
  if (process.env.VUE_APP_DEMO_MODE === 'true') {
    const { demoAdapter } = require('@/mock/adapter')
    config.adapter = demoAdapter
    return config
  }
  // ... 原有逻辑
  return config
})
```

### Vite 写法
```javascript
import { demoAdapter } from '@/mock/adapter'

service.interceptors.request.use(config => {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    config.adapter = demoAdapter
    return config
  }
  // ... 原有逻辑
  return config
})
```
