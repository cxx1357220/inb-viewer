const {
    ipcMain,
    BrowserWindow,
    screen
} = require("electron");


class WallpaperMac {
    constructor() {
        this.win = ''
        ipcMain.on('newPaper', this.newPaper.bind(this))
        ipcMain.on('closePaper', this.closePaper.bind(this))
    }

    /**
     * wallpaper关闭块
     */
    closePaper() {
        try {
            this.win && this.win.close()
        } catch (error) {
            console.log('error: ', error);
        }
        this.win = ''
    }
    /**
     * wallpaper 打开块
     * @param {*} event 
     * @param {*} obj 块内容
     */
    async newPaper(event, obj) {
        this.closePaper()
        const { width, height } = screen.getPrimaryDisplay().bounds;
        this.win = new BrowserWindow({
            enableLargerThanScreen: true,
            autoHideMenuBar: true,
            roundedCorners: false,
            transparen: true,
            acceptFirstMouse: true,
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
            await this.win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        } else {
            await this.win.loadURL('app://./index.html')

        }
        this.win.webContents.send('wallpaper', obj)
        try {
            this.win.show();
            setTimeout(() => {
                this.win.focus()
            }, 5000);
        } catch (e) {
            console.log(e);
        }
    }


}
new WallpaperMac()



















