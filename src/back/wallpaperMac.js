const {
    ipcMain,
    BrowserWindow,
    screen
} = require("electron");


let win;




/**
 * wallpaper关闭块
 */
const closePaper = async () => {
    try {
        win && win.close()
    } catch (error) {
        console.log('error: ', error);
    }
    win = ''
}


/**
 * wallpaper 打开块
 * @param {*} event 
 * @param {*} obj 块内容
 */
const newPaper = async (event, obj) => {
    closePaper()
    console.log('obj: ', obj);
    const { width, height } = screen.getPrimaryDisplay().bounds;
    console.log(' screen.getPrimaryDisplay(): ',  screen.getPrimaryDisplay());

    win = new BrowserWindow({
        enableLargerThanScreen: true,
        autoHideMenuBar: true,
        roundedCorners:false,
        transparen:true,
        acceptFirstMouse:true,
        frame: false,
        width: width,
        height: height,
        show: false,
        type: 'desktop', //desktop 类型将窗口置于桌面背景窗口层级（kCGDesktopWindowLevel - 1）。 请注意，桌面窗口将无法被聚焦、无法接收键盘或鼠标事件，你仅可以使用 globalShortcut 来接收输入。
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            backgroundThrottling: false,
        }
    });
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    } else {
        await win.loadURL('app://./index.html')

    }
    win.webContents.send('wallpaper', obj)
    try {
        win.show();
        console.log('win: ', win);
        setTimeout(() => {
            win.focus()
        }, 5000);
    } catch (e) {
        console.log(e);
    }
}












ipcMain.on('newPaper', newPaper)
ipcMain.on('closePaper', closePaper)