const {
    ipcMain,
    BrowserWindow,
    screen
} = require("electron");
const { uIOhook, UiohookKey } = require('uiohook-napi')

const { CDP } = require('./cdp.js');



class WallpaperMac {
    constructor() {
        this.win = ''
        this.topArea = 0
        this.hasListen = false
        ipcMain.on('newPaper', this.newPaper.bind(this))
        ipcMain.on('closePaper', this.closePaper.bind(this))
    }

    /**
     * wallpaper关闭块
     */
    closePaper() {
        try {
            this.cdp && this.cdp.release()
            // this.win && this.win.close()
            this.win && this.win.destroy()
            uIOhook.stop()

        } catch (error) {
            console.log('error: ', error);
        }
        this.win = ''
        this.cdp = ''
    }
    /**
     * 监听键盘鼠标
     */
    listen() {
        if (!this.hasListen) {
            const listenTypes = [
                // 'input',
                'keydown',
                'keyup',
                'mousedown',
                'mouseup',
                'mousemove',
                // 'click',
                'wheel'
            ]
            listenTypes.forEach(type => {
                uIOhook.on(type, e => {
                    if (e.keycode) {
                        for (const name in UiohookKey) {
                            if (e.keycode === UiohookKey[name]) {
                                e.keyName = name
                                break
                            }
                        }
                    }
                    // this.win&&this.win.webContents.send('listen', message)
                    // this.win && this.win.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
                    //     type: 'mousePressed',
                    //     x: e.x,
                    //     y: e.y,
                    //     button: 'left',
                    //     clickCount: 1,
                    // });

                    if (this.win && this.cdp) {
                        try {
                            this.cdp.send(type, e)
                        } catch (error) {
                            console.log('error: ', error);
                        }
                    }
                })
            })
            this.hasListen = true
        }

        try {
            uIOhook.start()
        } catch (error) {
            console.log('error: ', error);
        }

    }
    /**
     * wallpaper 打开块
     * @param {*} event 
     * @param {*} obj 块内容
     */
    async newPaper(event, obj) {
        this.closePaper()
        this.listen()
        const { width, height } = screen.getPrimaryDisplay().bounds;
        this.topArea = screen.getPrimaryDisplay().workArea.y
        this.win = new BrowserWindow({
            enableLargerThanScreen: true,
            autoHideMenuBar: true,
            roundedCorners: false,
            transparen: true,
            acceptFirstMouse: true,
            frame: false,
            width: width,
            height: height - this.topArea,
            show: false,
            type: 'desktop', //desktop 类型将窗口置于桌面背景窗口层级（kCGDesktopWindowLevel - 1）。 请注意，桌面窗口将无法被聚焦、无法接收键盘或鼠标事件，你仅可以使用 globalShortcut 来接收输入。
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                webSecurity: false,
                backgroundThrottling: false,
            }
        });
        // this.win.webContents.openDevTools({
        //     mode: 'right'
        // })
        this.cdp = new CDP(this.win, this.topArea);
        this.cdp.attach()
        if (process.env.WEBPACK_DEV_SERVER_URL) {
            await this.win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        } else {
            await this.win.loadURL('app://./index.html')

        }
        this.win.webContents.send('wallpaper', obj)
        try {
            this.win.show();
            // setTimeout(() => {
            //     try {
            //         this.win.focus()
            //     } catch (error) {
            //         console.log('error: ', error);
            //     }
            // }, 5000);
        } catch (e) {
            console.log(e);
        }
    }


}
new WallpaperMac()



















