import {
    ipcMain,
} from 'electron'
const {
    exec
} = require('child_process');
const iconv = require('iconv-lite');
let {
    winSend
} = require('./win')
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
            let wallpaperPath = text[1].trim() + 'wallpaper_engine//wallpaper32.exe'
            winSend('main', 'wallpaperPath', wallpaperPath)
        }
    });
}
// has() 
/**
 * wallpaper打开块
 * @param {*} event 
 * @param {String} path 路径
 * @param {String} wallpaperPath wallpaper.exe 路径
 */
const runWallpaper = (event, path,wallpaperPath) => {
    exec(wallpaperPath + ' -control openWallpaper -file "' + path + '"', (
        err, stdout, stderr) => {
        // if (err) {
        //     console.log('err: ', err);
        //     console.error(iconv.decode(err, 'cp936'));
        //     winSend('main', 'error', err.toString())
        // }
        if (stderr) {
            console.log('stderr: ', stderr);
            console.error(iconv.decode(stderr, 'cp936'));
            winSend('main', 'error', stderr.toString())
        }
    });
}
ipcMain.on('runWallpaper', runWallpaper)
ipcMain.on('wallpaperPath', has)