import {
    app,
    ipcMain,
} from 'electron'
const path = require('path');
const {
    exec,
} = require('child_process');
const appPath = app.getAppPath();
const RePKGPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'RePKG.exe'
)
let {
    winSend
} = require('./win')
const repkgData = {
    state: false,
    list: []
}

/**
 * 解压PKG
 * @param {*} event 
 * @param {*} obj 
 */
const repkg = (event, obj) => {
    if (repkgData.state) {
        repkgData.list.push([obj])
        return false
    }
    repkgData.state = true
    // winSend('main','repkgPercent', {
    //     jsonPath: obj.jsonPath,
    //     percent: '12'
    // })
    winSend('main', 'repkgPercent', {
        jsonPath: obj.jsonPath,
        percent: '12'
    })
    console.log(RePKGPath + ' extract ' + obj.filePath + ' -o ' + obj.basePath + 'pkgOutput');
    exec(RePKGPath + ' extract ' + obj.filePath + ' -o ' + obj.basePath + 'pkgOutput', (
        err, stdout, stderr) => {
        if (err) {
            console.error(err);
        }
        if (stderr) {
            console.error(stderr);
        }
        console.log(`WW${stdout}`);
        repkgData.state = false
        winSend('main', 'repkgPercent', {
            jsonPath: obj.jsonPath,
            percent: 'done'
        })
        if (repkgData.list.length) {
            repkg('', ...repkgData.list.shift())
        }
    });

}
ipcMain.on('repkg', repkg)
/**
 * 解压PKGlist
 * @param {*} event 
 * @param {*} list 
 */
const repkgList = (event, list) => {
    let ls = list.map(obj => [obj])
    repkgData.list.push(...ls)
    if (!repkgData.state) {
        repkg('', ...repkgData.list.shift())
    }
}
ipcMain.on('repkgList', repkgList)

export {
    repkgData
}