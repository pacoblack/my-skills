# 离线演示版全环境拦截器挂载参考（兼容 Vue 2 & Vue 3）

为了确保项目在打包（`build`）后依然能够脱离真实网络与后端服务独立运行，必须在 Axios 请求拦截器中挂载全环境生效的 Mock 拦截器（使用标准 ESM `import` 语法，同时兼容 Vite 与 Webpack）：

```javascript
// 1. 在 src/utils/request.js 文件顶部静态引入（兼容 Vite 与 Webpack）
import { matchMockHandler } from '@/mock/all-apis-mock'

// 2. 在 service.interceptors.request.use(config => { ... }) 的最顶部添加：
const handler = matchMockHandler(config)
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
    }, 150)
  })
  return config
}
// 注意：若未命中已生成的 Mock 接口，可根据离线模式决定是否直接返回空成功态，防止断网报错：
// else {
//   config.adapter = () => Promise.resolve({ data: { code: 200, data: null, msg: '离线兜底响应' }, status: 200, config })
//   return config
// }
```
