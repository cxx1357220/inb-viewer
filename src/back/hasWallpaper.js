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
let wallpaperPath = ''
const has = () => {
    exec('reg query HKLM\\SOFTWARE\\Microsoft /s /f wallpaper_engine /d', (
        err, stdout, stderr) => {
        if (err) {
            winSend('main', 'error', iconv.decode(err, 'gbk'))
            return false
        }
        if (stderr) {
            winSend('main', 'error', iconv.decode(stderr, 'gbk'))
            return false
        }
        let str = iconv.decode(stdout, 'gbk')
        console.log('str: ', str);
        let text = str.match(/InstallLocation    REG_SZ(.+?)wallpaper_engine/)
        console.log('text: ', text);

        if (text) {
            wallpaperPath = text[1].trim() + 'wallpaper_engine//wallpaper32.exe'
            winSend('main', 'hasWallpaper', true)
        }
    });
}
has()

const runWallpaper = (event, path) => {
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