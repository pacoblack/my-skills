# 可选本地拦截器挂载参考（未 Mock 接口透明放行）

仅当用户明确要求在本地开发环境中拦截接口时，可参考以下方式在 Axios 请求拦截器中挂载 `all-apis-mock.js`：

```javascript
// 在 src/utils/request.js 的 interceptors.request.use 顶部添加：
if (process.env.NODE_ENV === 'development' && process.env.VUE_APP_USE_MOCK === 'true') {
  const { matchMockHandler } = require('@/mock/all-apis-mock')
  const handler = matchMockHandler(config)
  // 只有命中了已生成的 Mock 接口才拦截，未命中的接口直接透传给真实后端！
  if (handler) {
    config.adapter = () => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: handler(config),
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        })
      }, 200)
    })
    return config
  }
}
```
