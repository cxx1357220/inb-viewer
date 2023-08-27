// 'use strict'
import {
  app,
  protocol,
  BrowserWindow,
  Menu
} from 'electron'
const fs = require('fs');
const path = require('path');
const appPath = app.getAppPath();

var os = require('os')
var platform = os.platform()
//patch for compatibilit with electron-builder, for smart built process.
if (platform == "darwin") {
  platform = "mac";
} else if (platform == "win32") {
  platform = "win";
}
//adding browser, for use case when module is bundled using browserify. and added to html using src.
if (platform !== 'linux' && platform !== 'mac' && platform !== 'win' && platform !== "browser") {
  console.error('Unsupported platform.', platform);
  process.exit(1)
}
var arch = os.arch()
if (platform === 'mac' && (arch !== 'x64' && arch !== 'arm64')) {
  console.error('Unsupported architecture.')
  process.exit(1)
}
const isDevelopment = process.env.NODE_ENV !== 'production'
if (!isDevelopment) {
  Menu.setApplicationMenu(null)
  require('./back/log')
}
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    secure: true,
    standard: true
  }
}])
const newSessionDataPath = path.join(appPath,
  process.env.NODE_ENV == 'production' ? '..' : '',
  '..',
  '..',
  'viewer-sessionData');
fs.mkdirSync(newSessionDataPath, {
  recursive: true
});
app.setPath('sessionData', newSessionDataPath)
const imgCachePath = path.join(newSessionDataPath, 'imgCache');

fs.mkdirSync(imgCachePath, {
  recursive: true
});


const {
  createWindow,
  winSend
} = require('./back/win')
const {
  setModelList
} = require('./back/model')
require('./back/read')
require('./back/serve')
// require('./back/whisper')
// require('./back/repkg')
require('./back/re')
require('./back/littleFunc')
require('./back/hasWallpaper')

// require('./back/copy')
// require('./back/compress')
// require('./back/child')
// require('./back/newProject')


// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  console.log('activate: ');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow()
    setModelList()
    winSend('main', 'imgCachePath', imgCachePath)
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  console.log('ready: ', app.getPath('sessionData'));
  await createWindow()
  setModelList()
  winSend('main', 'imgCachePath', imgCachePath)


  // console.log('protocol: ', session.defaultSession.webRequest);
  // session.defaultSession.webRequest.onCompleted({
  //   urls: ['file:///*']
  // }, (data, callback) => {
  //   if ((data.resourceType === 'image')) {
  //     // 获取请求地址
  //     const souceUrl = data.url.split('file:///')[1].split('?')[0]
  //     console.log('souceUrl: ', souceUrl);

  //     fs.copyFile(souceUrl, path.join(appPath, '..', 'imgCache', encodeURIComponent(souceUrl)), (err) => {
  //       console.log('err: ', err);
  //     })
  //   }
  // })

})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}