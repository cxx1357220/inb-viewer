const {
  defineConfig
} = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '/app',
  outputDir: '../../public/fileShareHtml', 

  // publicPath:'./' //相对路径index.html
  devServer: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000', // 后端接口的地址
        changeOrigin: true, // 允许跨域
        // pathRewrite: {
        //   '^/api': '' // 重写路径，去掉路径中的/api前缀
        // }
      },
      // '/': {
      //   target: 'http://127.0.0.1:3000', // 后端接口的地址
      //   changeOrigin: true, // 允许跨域
      //   // pathRewrite: {
      //   //   '^/api': '' // 重写路径，去掉路径中的/api前缀
      //   // }
      // }
    }
  }
})