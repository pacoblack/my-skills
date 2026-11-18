# 离线单文件 HTML 打包改造参考（兼容 Vue 2 & Vue 3）

当用户需要将项目打包为**不依赖网络、可直接双击 `index.html` 运行的离线单文件**时，必须执行以下两项工程检查与配置改造：

---

## 一、路由模式强制检查（必做）

定位路由配置文件（通常为 `src/router/index.js` 或 `src/router/index.ts`），确保使用 **Hash 模式**，严禁使用 `history` 模式（否则本地 `file://` 协议打开会白屏）：

* **Vue 3**：确认使用 `history: createWebHashHistory()`
* **Vue 2**：确认使用 `mode: 'hash'`

---

## 二、单文件内联打包配置（按框架二选一）

### 1. Vue 3 + Vite 项目
* **依赖检查**：检查 `package.json` 是否包含 `vite-plugin-singlefile`，若无则提示或执行 `npm install vite-plugin-singlefile -D`。
* **配置模板 (`vite.config.js` / `vite.config.ts`)**：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    viteSingleFile({ removeViteModuleLoader: true })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false
  }
})
```

### 2. Vue 2 + Vue CLI (Webpack) 项目
* **依赖检查**：检查 `package.json` 是否包含 `html-webpack-inline-source-plugin`，若无则提示或执行 `npm install html-webpack-inline-source-plugin@beta -D`。
* **配置模板 (`vue.config.js`)**：

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')

module.exports = {
  publicPath: './',
  productionSourceMap: false,
  css: {
    extract: false
  },
  configureWebpack: {
    optimization: {
      splitChunks: false
    },
    plugins: [
      new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin)
    ]
  },
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args.inlineSource = '.(js|css)\$'
      return args
    })
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => Object.assign(options || {}, { limit: 1024 * 1024 * 10 }))
    config.module
      .rule('fonts')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => Object.assign(options || {}, { limit: 1024 * 1024 * 10 }))
  }
}
```
