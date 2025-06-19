import {
    ipcMain,
} from 'electron'
const fs = require('fs');
const path = require('path');
const {
    spawn,
} = require('child_process');
let {
    winMap,
    winSend
} = require('./win')
let {
    fasterWhisperModelPath,
    whisperCppModelPath,
} = require('./config')

/**
 * cpp读取可用model列表
 */
const getCppModelList = () => {
    fs.readdir(whisperCppModelPath, (err, back) => {
        if (err) {
            console.log('err: ', err);
            return false
        }
        let ls = []
        back.forEach(s => {
            if (path.extname(s) == '.bin') {
                ls.push({
                    name: s,
                    path: path.join(whisperCppModelPath, s)
                })
            }
        })
        winSend('main', 'modelList', ls)
        console.log('ls: ', ls);
    })
}
/**
 * 读取可用model列表
 */
const getFasterModelList = () => {
    fs.readdir(fasterWhisperModelPath, (err, back) => {
        if (err) {
            console.log('err: ', err);
            return false
        }
        let ls = []
        back.forEach(s => {
            if (fs.existsSync(path.join(fasterWhisperModelPath, s, 'model.bin'))) {
                ls.push({
                    name: s,
                    path: path.join(fasterWhisperModelPath, s)
                })
            }

        })
        winSend('main', 'modelList', ls)
        console.log('ls: ', ls);
    })
}

/**
 * 下载whisper cpp - model
 * @param {*} event 
 * @param {string} name model名
 * @param {string} url 下载路径
 */
const downCppModel = (event, name, url) => {
    let ls = spawn('curl', ['-L', url, '-o', path.join(whisperCppModelPath, name)])
    winSend('main', 'downPercent', {
        name: name,
        percent: '0%'
    })
    ls.stdout.on('data', (data) => {
        console.log('data: ', data.toString());
    });
    ls.stderr.on('data', (err) => {
        winSend('main', 'downPercent', {
            name: name,
            percent: (err.toString().match(/[0-9]+/g) || [0])[0] + "%"
        })
    });
    ls.on('close', (code) => {
        if (code) {
            winSend('main', 'downPercent', {
                name: name,
                percent: 'error',
                code: code
            })
            return false
        }
        winSend('main', 'downPercent', {
            name: name,
            percent: 'done'
        })
        getCppModelList()
    });
}
/**
 * 下载faster-whisper model
 * @param {*} event 
 * @param {string} name model名
 * @param {Array} urlList
 */
const downFasterModel = (event, name, urlList) => {
    const mainWindow = winMap['main']
    const basePath = path.join(fasterWhisperModelPath, name)
    fs.mkdirSync(basePath, {
        recursive: true
    })
    winSend('main', 'downPercent', {
        name: name,
        percent: '0'
    })
    let idx = 0
    const downFile = (url) => {
        if (!url) {
            winSend('main', 'downPercent', {
                name: name,
                percent: "done"
            })
            getFasterModelList()
            return
        }

        mainWindow.webContents.session.once('will-download', (event, item) => {
            const fileName = path.basename(url).split('?')[0]
            const filePath = path.join(basePath, fileName)
            item.setSavePath(filePath);
            console.log('filePath: ', filePath, fileName, url);
            item.on('updated', (event, state) => {
                if (state === 'interrupted') {
                    console.log('Download is interrupted but can be resumed');
                } else if (state === 'progressing') {
                    winSend('main', 'downPercent', {
                        name: name,
                        percent: ((item.getReceivedBytes() || 0) / (item.getTotalBytes() || 1) * 100).toFixed(2) + "%"
                    })
                }
            })
            item.once('done', (event, state) => {
                if (state === 'completed') {
                    console.log('Download successfully')
                    idx++
                    downFile(urlList[idx])
                } else {
                    console.log(`Download failed: ${state}`)
                    winSend('main', 'downPercent', {
                        name: name,
                        percent: "error"
                    })
                }

            })
            //...
        })
        mainWindow.webContents.downloadURL(url);
    }
    downFile(urlList[idx])
    // for (let i = 0; i < urlList.length; i++) {
    //     downFile(urlList[i])
    // }
}

ipcMain.on('downModel', downFasterModel)
export {
    getFasterModelList as getModelList
}