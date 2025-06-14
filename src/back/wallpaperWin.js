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


let win, wallpaperPath;



/**
 * wallpaper engine关闭块
 */
const closeWallpaper = () => {
    if (wallpaperPath) {
        exec(wallpaperPath + '  -control closeWallpaper ', (
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
 * electron as wallpaper关闭块
 */
const closePaper = async () => {
    // try {
    //     // win && detach(win)
    // } catch (error) {
    //     console.log('error: ', error);
    // }
    try {
        win && win.close()
    } catch (error) {
        console.log('error: ', error);
    }
    refresh();
    win = ''

}


/**
 * electron as wallpaper 打开块
 * @param {*} event 
 * @param {*} obj 块内容
 */
const newPaper = async (event, obj) => {
    closeWallpaper()
    closePaper()
    console.log('obj: ', obj);
    win = new BrowserWindow({
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
    console.log('1');
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        // if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        console.log('2');
        createProtocol('app')
        await win.loadURL('app://./index.html')

    }
    console.log('3');

    win.webContents.send('wallpaper', obj)
    console.log('4');

    const [display] = screen.getAllDisplays();
    console.log('5');

    if (!display) {
        throw new Error("No enough displays");
    }
    console.log('6');

    // // set the first screen bounds to the first window
    win.setBounds(display.bounds);
    console.log('7');

    // // when display resolution changed
    screen.on("display-metrics-changed", () => {
        console.log('8');

        const [display] = screen.getAllDisplays();
        if (!display) {
            throw new Error("No enough displays");
        }
        win.setBounds(display.bounds);
    });
    console.log('9');

    try {
        console.log('10');

        attach(win, {
            transparent: true,
            forwardKeyboardInput: true,
            forwardMouseInput: true,
        });
        win.show();

    } catch (e) {
        console.log(e);
    }
}







/**
 * 获取wallpaper.exe路径
 * 不太兼容,安装选择库不是steam默认路径，而是安装在别的盘库就这测不到
 */
const has = () => {
    exec('reg query HKLM /s /f wallpaper_engine /d', (
        err, stdout, stderr) => {
        if (err) {
            console.log('err: ', err);
            // winSend('main', 'log', err)
            return false
        }
        if (stderr) {
            console.log('stderr: ', stderr);
            // winSend('main', 'error', stderr)
            return false
        }
        let str = iconv.decode(stdout, 'gbk')
        console.log('str: ', str);
        let text = str.match(/App=(.+?)wallpaper_engine/)
        console.log('text: ', text);

        if (text) {
            wallpaperPath = text[1].trim() + 'wallpaper_engine//wallpaper32.exe'
            winSend('main', 'wallpaperPath', wallpaperPath)
        }
    });
}
/**
 * wallpaper engine打开块
 * @param {*} event 
 * @param {String} path 路径
 * @param {String} exePath wallpaper.exe 路径
 */
const runWallpaper = (event, path, exePath) => {
    wallpaperPath = exePath
    closePaper()
    exec(wallpaperPath + ' -control openWallpaper -file "' + path + '"', (
        err, stdout, stderr) => {
        if (stderr) {
            console.log('stderr: ', stderr);
            console.error(iconv.decode(stderr, 'cp936'));
            winSend('main', 'error', stderr.toString())
        }
    });
}

ipcMain.on('runWallpaper', runWallpaper)
ipcMain.on('wallpaperPath', has)
ipcMain.on('closeWallpaper', closeWallpaper)
ipcMain.on('newPaper', newPaper)
ipcMain.on('closePaper', closePaper)