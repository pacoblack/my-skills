# Vue 2 / Vue 3 双栈请求拦截器与环境配置模板

## 1. `.env.demo` 环境变量模板
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

## 2. `src/mock/adapter.js` 核心拦截器模板
```javascript
import { matchMockRoute } from './index'

export function demoAdapter(config) {
  return new Promise((resolve) => {
    const baseURL = config.baseURL || ''
    let rawUrl = config.url || ''
    if (baseURL && rawUrl.startsWith(baseURL)) {
      rawUrl = rawUrl.slice(baseURL.length)
    }
    const [cleanPath, queryString] = rawUrl.split('?')
    const method = (config.method || 'get').toUpperCase()

    const query = Object.assign({}, config.params || {})
    if (queryString) {
      queryString.split('&').forEach((pair) => {
        const [k, v] = pair.split('=')
        if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '')
      })
    }

    let body = {}
    let isFormData = false
    let uploadFileName = ''
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      isFormData = true
      const fileObj = config.data.get('file')
      uploadFileName = fileObj && fileObj.name ? fileObj.name : ''
    } else if (typeof config.data === 'string') {
      try { body = JSON.parse(config.data) } catch (e) { body = { raw: config.data } }
    } else if (config.data && typeof config.data === 'object') {
      body = config.data
    }

    const delay = Math.floor(Math.random() * 150) + 200
    setTimeout(() => {
      const responseData = matchMockRoute({
        url: cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath,
        method,
        query,
        body,
        isFormData,
        uploadFileName,
        headers: config.headers || {}
      })

      resolve({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json;charset=UTF-8' },
        config
      })
    }, delay)
  })
}
```
