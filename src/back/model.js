import {
    app,
    ipcMain,
} from 'electron'
const fs = require('fs');
const path = require('path');
const {
    spawn,
} = require('child_process');
const appPath = app.getAppPath();
let {
   winSend
} = require('./win')
var whisperModelPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'whisper-cpp',
    'model'
)
/**
 * 读取可用model列表
 */
const setModelList = () => {
    fs.readdir(whisperModelPath, (err, back) => {
        if (err) {
            console.log('err: ', err);
            return false
        }
        let ls = []
        back.forEach(s => {
            if (path.extname(s) == '.bin') {
                ls.push({
                    name: s,
                    path: whisperModelPath + '\\' + s
                })
            }
        })
        winSend('main','modelList', ls)
        console.log('ls: ', ls);
    })
}

/**
 * 下载whisper - model
 * @param {*} event 
 * @param {string} name model名
 * @param {string} url 下载路径
 */
const downModel = (event, name, url) => {
    console.log('curl -L ' + url + ' -o ' + whisperModelPath + '\\' + name);
    let ls = spawn('curl', ['-L', url, '-o', whisperModelPath + '\\' + name])
    winSend('main','downPercent', {
        name: name,
        percent: '0%'
    })
    ls.stdout.on('data', (data) => {
        console.log('data: ', data.toString());
    });
    ls.stderr.on('data', (err) => {
        winSend('main','downPercent', {
            name: name,
            percent: (err.toString().match(/[0-9]+/g) || [0])[0] + "%"
        })
    });
    ls.on('close', (code) => {
        winSend('main','downPercent', {
            name: name,
            percent: 'done'
        })
        setModelList()
    });
}

ipcMain.on('downModel', downModel)
export {
    setModelList
}