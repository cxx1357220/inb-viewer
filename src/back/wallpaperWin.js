const {
    attach,
    detach,
    refresh
} = require("electron-as-wallpaper");
const {
    ipcMain,
    BrowserWindow,
    screen
} = require("electron");
import {
    createProtocol
} from 'vue-cli-plugin-electron-builder/lib'
const {
    exec
} = require('child_process');
const iconv = require('iconv-lite');
let {
    winSend
} = require('./win')



class WallpaperWin {
    constructor() {
        this.win = null;
        this.wallpaperPath = null;
        ipcMain.on('runWallpaper', this.runWallpaper.bind(this))
        ipcMain.on('wallpaperPath', this.getWallpaperPath.bind(this))
        ipcMain.on('closeWallpaper', this.closeWallpaper.bind(this))
    }

    /**
     * wallpaper engine关闭块
     */
    closeWallpaper() {
        if (this.wallpaperPath) {
            exec(this.wallpaperPath + '  -control closeWallpaper ', (
                err, stdout, stderr) => {
                if (stderr) {
                    console.log('stderr: ', stderr);
                    console.error(iconv.decode(stderr, 'cp936'));
                    winSend('main', 'error', stderr.toString())
                }
            });
        }
    }
    /**
     * wallpaper engine打开块
     * @param {*} event 
     * @param {String} path 路径
     * @param {String} exePath wallpaper.exe 路径
     */
    runWallpaper(event, path, exePath) {
        this.wallpaperPath = exePath
        electronAsWallpaperWin.closePaper()
        exec(this.wallpaperPath + ' -control openWallpaper -file "' + path + '"', (
            err, stdout, stderr) => {
            if (stderr) {
                console.log('stderr: ', stderr);
                console.error(iconv.decode(stderr, 'cp936'));
                winSend('main', 'error', stderr.toString())
            }
        });
    }
    /**
     * 获取wallpaper.exe路径
     * 不太兼容,安装选择库不是steam默认路径，而是安装在别的盘库就这测不到
     */
    getWallpaperPath() {
        exec('reg query HKLM /s /f wallpaper_engine /d', (
            err, stdout, stderr) => {
            if (err) {
                console.log('err: ', err);
                return false
            }
            if (stderr) {
                console.log('stderr: ', stderr);
                return false
            }
            let str = iconv.decode(stdout, 'gbk')
            console.log('str: ', str);
            let text = str.match(/App=(.+?)wallpaper_engine/)
            console.log('text: ', text);
            if (text) {
                this.wallpaperPath = text[1].trim() + 'wallpaper_engine//wallpaper32.exe'
                winSend('main', 'wallpaperPath', this.wallpaperPath)
            }
        });
    }
}
var wallpaperWin = new WallpaperWin()


class ElectronAsWallpaperWin {
    constructor() {
        this.win = ''
        ipcMain.on('newPaper', this.newPaper.bind(this))
        ipcMain.on('closePaper', this.closePaper.bind(this))
    }

    /**
     * electron as wallpaper关闭块
     */
    closePaper() {
        try {
            this.win && this.win.close()
        } catch (error) {
            console.log('error: ', error);
        }
        refresh();
        this.win = ''
    }


    /**
     * electron as wallpaper 打开块
     * @param {*} event 
     * @param {*} obj 块内容
     */
    async newPaper(event, obj) {
        wallpaperWin.closeWallpaper()
        this.closePaper()
        console.log('obj: ', obj);
        this.win = new BrowserWindow({
            enableLargerThanScreen: true,
            autoHideMenuBar: true,
            frame: false,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                webSecurity: false,
                backgroundThrottling: false,
            }
        });
        if (process.env.WEBPACK_DEV_SERVER_URL) {
            await this.win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
            // if (!process.env.IS_TEST) win.webContents.openDevTools()
        } else {
            createProtocol('app')
            await this.win.loadURL('app://./index.html')

        }

        this.win.webContents.send('wallpaper', obj)

        const [display] = screen.getAllDisplays();

        if (!display) {
            throw new Error("No enough displays");
        }

        // // set the first screen bounds to the first window
        this.win.setBounds(display.bounds);

        // // when display resolution changed
        screen.on("display-metrics-changed", () => {

            const [display] = screen.getAllDisplays();
            if (!display) {
                throw new Error("No enough displays");
            }
            this.win.setBounds(display.bounds);
        });

        try {

            attach(this.win, {
                transparent: true,
                forwardKeyboardInput: true,
                forwardMouseInput: true,
            });
            this.win.show();

        } catch (e) {
            console.log(e);
        }
    }

}
var electronAsWallpaperWin = new ElectronAsWallpaperWin()









