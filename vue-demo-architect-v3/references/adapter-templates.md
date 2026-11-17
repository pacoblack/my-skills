# Vue 2 / Vue 3 双栈请求拦截器代码模板

## 1. Vue CLI (Vue 2 / Vue 3 Webpack) 注入模板

在 `src/utils/request.js` 的请求拦截器（`service.interceptors.request.use`）最顶部加入：

```javascript
if (process.env.VUE_APP_DEMO_MODE === 'true') {
  const { demoAdapter } = require('@/mock/adapter')
  config.adapter = demoAdapter
  return config
}
```

## 2. Vite (Vue 3) 注入模板

在 `src/utils/request.js`（或 `.ts`）顶部导入 `demoAdapter`（或使用动态导入），在请求拦截器最顶部加入：

```javascript
import { demoAdapter } from '@/mock/adapter'

// inside service.interceptors.request.use(config => { ... })
if (import.meta.env.VITE_DEMO_MODE === 'true') {
  config.adapter = demoAdapter
  return config
}
```

## 3. 标准 `src/mock/adapter.js` 实现

```javascript
import mockRoutes from './index'

function matchRoute(method, cleanUrl) {
  const upperMethod = (method || 'GET').toUpperCase()
  const exactKey = `${upperMethod}:${cleanUrl}`
  if (mockRoutes[exactKey]) {
    return { handler: mockRoutes[exactKey], pathParams: {} }
  }
  if (mockRoutes[cleanUrl]) {
    return { handler: mockRoutes[cleanUrl], pathParams: {} }
  }

  for (const key of Object.keys(mockRoutes)) {
    let routeMethod = null
    let routePattern = key
    if (key.includes(':')) {
      const idx = key.indexOf(':')
      const prefix = key.slice(0, idx).toUpperCase()
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(prefix)) {
        routeMethod = prefix
        routePattern = key.slice(idx + 1)
      }
    }
    if (routeMethod && routeMethod !== upperMethod) continue

    const paramNames = []
    const regexStr = routePattern.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName)
      return '([^/]+)'
    })
    const regex = new RegExp(`^${regexStr}$`)
    const match = cleanUrl.match(regex)
    if (match) {
      const pathParams = {}
      paramNames.forEach((name, i) => {
        pathParams[name] = match[i + 1]
      })
      return { handler: mockRoutes[key], pathParams }
    }
  }
  return null
}

function parseQuery(url) {
  const query = {}
  const qIndex = url.indexOf('?')
  if (qIndex === -1) return query
  const search = url.slice(qIndex + 1)
  search.split('&').forEach(pair => {
    if (!pair) return
    const [k, v] = pair.split('=')
    query[decodeURIComponent(k)] = decodeURIComponent(v || '')
  })
  return query
}

export function demoAdapter(config) {
  return new Promise((resolve) => {
    let rawUrl = config.url || ''
    if (config.baseURL && rawUrl.startsWith(config.baseURL)) {
      rawUrl = rawUrl.slice(config.baseURL.length)
    }
    if (!rawUrl.startsWith('/')) {
      rawUrl = '/' + rawUrl
    }

    const queryFromUrl = parseQuery(rawUrl)
    const cleanUrl = rawUrl.split('?')[0]
    const query = Object.assign({}, queryFromUrl, config.params || {})

    let body = {}
    let isFormData = false
    let uploadFileName = ''

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      isFormData = true
      const fileEntry = config.data.get('file')
      if (fileEntry && fileEntry.name) {
        uploadFileName = fileEntry.name
      }
    } else if (typeof config.data === 'string') {
      try {
        body = JSON.parse(config.data)
      } catch (e) {
        body = { raw: config.data }
      }
    } else if (config.data && typeof config.data === 'object') {
      body = config.data
    }

    const matched = matchRoute(config.method, cleanUrl)

    setTimeout(() => {
      let responseData
      if (matched) {
        const ctx = { query, body, params: matched.pathParams, isFormData, uploadFileName, url: cleanUrl }
        responseData = typeof matched.handler === 'function' ? matched.handler(ctx) : matched.handler
      } else {
        responseData = {
          code: 200,
          msg: '演示环境操作成功',
          data: {}
        }
      }

      resolve({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json;charset=UTF-8' },
        config
      })
    }, 240)
  })
}
```
