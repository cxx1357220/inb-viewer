// 'use strict'
import {
  app,
  protocol,
} from 'electron'
const isDevelopment = process.env.NODE_ENV !== 'production'
if (!isDevelopment) {
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

require('./back/config')

const {
  createWindow,
} = require('./back/win')

require('./back/read')
require('./back/serve')

require('./back/ocrServe')

// require('./back/whisper')
// require('./back/repkg')
require('./back/re')
require('./back/littleFunc')
if (process.platform == 'win32') {
  require('./back/wallpaperWin')
} else {
  require('./back/wallpaperMac')
}

// const {
//   outStream
// }=require('./back/outStream')
//  outStream()

require('./back/watchWs')
// require('./back/screenshots')
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
  // if (BrowserWindow.getAllWindows().length === 0) {
  await createWindow()

  // }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  console.log('ready: ', app.getPath('sessionData'));
  await createWindow()


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