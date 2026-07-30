const {
  defineConfig
} = require('@vue/cli-service')
const { watch } = require('fs')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

const utils = {
  assetsPath: function (_path) {
    const assetsSubDirectory = process.env.NODE_ENV === 'production' ?
      'static' :
      'static'

    return path.posix.join(assetsSubDirectory, _path)
  },
  resolve: function (dir) {
    return path.join(__dirname, '..', dir)
  }
}



const path = require("path");
const webpack = require("webpack");
// const CopyWebpackPlugin = require("copy-webpack-plugin");
// const PermissionsOutputPlugin = require("webpack-permissions-plugin");

const {
  platform,
  arch
} = process;

let plugins = [
  new MonacoWebpackPlugin({
    languages: ['javascript', 'typescript', 'css', 'html', 'json'],
    features: ['!gotoSymbol'],
  })
];

const configureWebpack = {
  plugins,
  output: {
    globalObject: 'self', // 为 Web Worker 配置
  },
  resolve: {
    fallback: {
      path: require.resolve("path-browserify")
    },
  },
  watch: false,
  watchOptions: {
    ignored: /public/
  },
  target: "electron-renderer",
  // module: {
  //   rules: [
  //     {
  //       test: /\.js$/,
  //       include: /node_modules\/monaco-editor/,
  //       use: {
  //         loader: 'babel-loader',
  //         options: {
  //           presets: ['@babel/preset-env'],
  //         },
  //       },
  //     },
  //     // 其他规则...
  //   ],
  // },
  // module:{
  //   rules: [{
  //     test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
  //     loader: 'url-loader',
  //     options: {
  //       name: './fonts/[name].[hash:7].[ext]'
  //     }
  //   }]
  // }

  // externals:{
  //   'ffmpeg-static-electron':'commonjs2 ffmpeg-static-electron'
  // }
}
// if (process.platform === 'win32') {
//   configureWebpack['ProvidePlugin'] = {
//     electronAsWallpaper: require.resolve("electron-as-wallpaper"),
//   }
// }
module.exports = defineConfig({
  productionSourceMap: false,
  devServer: {
    client: {
      overlay: false
    }
  },
  transpileDependencies: true,
  css: {
    extract: false
  },
  // 打包后css中引入font会有路径问题。。。
  // resolve:{
  //   fallback: { "path": false }
  // }

  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        mac: {
          "icon": "./icon.png"
        },
        asar: false,
        "nsis": {
          "oneClick": false, // 是否一键安装
          // "allowElevation": true, // 允许请求提升。若为false，则用户必须使用提升的权限重新启动安装程序。
          "allowToChangeInstallationDirectory": true, //是否允许修改安装目录
          "installerIcon": "./icon.ico", // 安装时图标
          "uninstallerIcon": "./icon.ico", //卸载时图标
          "installerHeaderIcon": "./icon.ico", // 安装时头部图标
          "createDesktopShortcut": true, // 是否创建桌面图标
          "createStartMenuShortcut": true, // 是否创建开始菜单图标
          // "shortcutName": "all-electron", // 快捷方式名称
          "runAfterFinish": true, //是否安装完成后运行
          "deleteAppDataOnUninstall": true
        },

        // extraFiles: ['shareHtml', 'watchHtml'],
        // extraResources:['imgCache']
        // extraResources: [{
        //   "from": "node_modules/regedit/vbs",
        //   "to": "vbs",
        //   "filter": ["**/*"]
        // }]
      },
      // externals: ["electron-screenshots"],

      // 子进程的引用第三方，如果项目没使用到，build的时候不会被打进去，需要在这写一下
      externals: ["electron-screenshots", "onnxruntime-node", "sherpa-onnx", "md5", "express-ws", "@techstark/opencv-js", "jimp", "js-yaml", "clipper-lib"],
      // extraResources: [{
      //   "from": "node_modules/onnxruntime-node/bin",
      //   "to": "node_modules/onnxruntime-node/bin"
      // }],
      // files:[
      //   "node_modules/onnxruntime-node/**/*"
      // ]
    }
  },
  configureWebpack,
  chainWebpack: (config) => {
    config.resolve.alias.set(
      'monaco-editor',
      path.resolve(__dirname, 'node_modules/monaco-editor')
    );
  },
})
// module.exports = {
//   resolve:{
//     fallback: { "path": false }
//   }
// }