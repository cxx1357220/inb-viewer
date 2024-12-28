const {
  defineConfig
} = require('@vue/cli-service')
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
  new webpack.DefinePlugin({
    "process.env.FLUENTFFMPEG_COV": false
  })
];
module.exports = defineConfig({
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
          "deleteAppDataOnUninstall":true
        },

        extraFiles: ['shareHtml','watchHtml'],
        // extraResources:['imgCache']
        // extraResources: [{
        //   "from": "node_modules/regedit/vbs",
        //   "to": "vbs",
        //   "filter": ["**/*"]
        // }]
      },
      externals: ["electron-screenshots"]
      // extraResources: [{
      //   "from": "shareHtml",
      //   "to": ""
      // }],
    }
  },
  configureWebpack: {
    plugins,
    resolve: {
      fallback: {
        path: require.resolve("path-browserify")
      },
    },
    target: "electron-renderer",
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
})
// module.exports = {
//   resolve:{
//     fallback: { "path": false }
//   }
// }