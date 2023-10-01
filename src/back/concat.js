import {
    app,
    ipcMain,
    shell,
    dialog,
} from 'electron'
let {
    winSend
} = require('./win')



/**
 * 设置合并视频保存路径
 * @param {*} event 
 */
const setConcatPath = (event) => {
    dialog.showOpenDialog({
            properties: ['openDirectory'],
        })
        .then(files => {
            if (files.filePaths.length) {
                winSend('main', 'setConcatPath', files.filePaths[0]);
            }
        }).catch(err => {
            console.log(err)
        });
}
ipcMain.on('setConcatPath', setConcatPath)



/**
 * 设置多个路径-合并的视频路径
 * @param {*} event 
 * @param {object} obj 按钮的信息（key）
 */
const setConcatPaths = (event, obj) => {
    console.log('obj: ', obj);
    dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [{
                name: 'Movies',
                extensions: ['mkv', 'avi', 'mp4', 'webm', 'ts']
            }]
        })
        .then(files => {
            if (files.filePaths.length) {
                console.log('files: ', files);
                winSend('main', 'setConcatPaths', {
                    k: obj.k,
                    files: files.filePaths
                });
            }
        }).catch(err => {
            console.log(err)
        });
}
ipcMain.on('setConcatPaths', setConcatPaths)






const path = require('path');
const fs = require('fs');

const ffmpeg = require('fluent-ffmpeg');
const appPath = app.getAppPath();
var ffmpegPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ffmpeg',
    'ffmpeg.exe'
)
ffmpeg.setFfmpegPath(ffmpegPath);
import {
    throttle,
    times
} from './utils'
const throttlePercent = throttle((s) => {
    winSend('main', 'concatPercent', s)
})


const concatData = {
    state: false
}
/**
 * 合并视频
 * @param {*} event 
 * @param {object} obj 合并的信息
 */
const concatVideo = (event, obj) => {
    concatData.state = true
    if (obj.unSameType) {
        let saveFile = obj.savePath + '\\' + obj.name + '.mp4'
        let ff = ffmpeg()
            .on('start', function (commandLine) {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('codecData', function (data) {
                console.log('data: ', data);
            })
            .on('progress', function (progress) {
                console.log('progress: ', progress);
                throttlePercent(((progress.percent || 0) / obj.files.length).toFixed(2))
            })
            .on('end', function () {
                console.log('end');
                shell.showItemInFolder(saveFile)
                winSend('main', 'concatPercent', 'done')
                concatData.state = false
            })
            .on('error', function (err) {
                console.log('An error occurred: ' + err.message);
                winSend('main', 'error', err)
                winSend('main', 'concatPercent', 'error')
                concatData.state = false

            })
        let option = '-filter_complex '
        let arr = []
        if (obj.unSameScale && obj.scale) {
            arr.push('scale=' + obj.scale)
        }
        if (obj.unSameFps && obj.fps) {
            arr.push('fps=' + obj.fps)
        }
        let ss = arr.join(',')

        let left = '',
            right = ''
        obj.files.forEach((s, i) => {
            if (ss) {
                left += '[' + i + ':v]' + ss + '[v' + i + '];'
                right += '[v' + i + '][' + i + ':1]'
            } else {
                right += '[' + i + ':0][' + i + ':1]'
            }

            ff.input(s)
        })
        option += left
        option += right

        option += 'concat=unsafe=1:n=' + obj.files.length + ':v=1:a=1[outv][outa]'
        ff.outputOptions([option, '-map [outv]', '-map [outa]'])
        ff.save(saveFile)
        return false
    }




    let allTime = 0,
        prev = 0
    let promiseList = obj.files.map((s, i) => {
        return new Promise((resolve, reject) => {
            let saveFile = obj.savePath + '\\inb-' + i + '.ts'
            ffmpeg(s)
                .outputOption('-c copy')
                .on('start', function (commandLine) {
                    console.log('Spawned Ffmpeg with command: ' + commandLine);
                })
                .on('codecData', function (data) {
                    console.log('data-promise: ', data);
                    allTime += times(data.duration)
                })
                .on('progress', function (progress) {
                    console.log('progress-promise: ', progress);
                })
                .on('end', function () {
                    prev += 1
                    winSend('main', 'concatPercent', (prev / 2 / obj.files.length * 100).toFixed(2))
                    resolve(saveFile)
                })
                .on('error', function (err) {
                    console.log('An error occurred: ' + err.message);
                    winSend('main', 'error', err)
                    reject(saveFile)
                })
                .save(saveFile)

        })
    })
    Promise.all(promiseList).then(res => {
        let saveFile = obj.savePath + '\\' + obj.name + '.mp4'
        let inp = obj.savePath + '\\inb-concat.txt'
        let txtVal = ''
        res.forEach(s => {
            txtVal += 'file ' + s.replaceAll('\\', '\\\\') + '\r\n'
        })
        fs.writeFileSync(inp, txtVal)
        ffmpeg()
            .input(inp)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions('-c copy')
            .on('start', function (commandLine) {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('codecData', function (data) {
                console.log('data: ', data);
                // duration = times(data.duration)
            })
            .on('progress', function (progress) {
                console.log('progress: ', progress);
                throttlePercent(((times(progress.timemark) / allTime) * 50 + 50).toFixed(2))
            })
            .on('end', function () {
                console.log('end');
                shell.showItemInFolder(saveFile)
                concatData.state = false
                winSend('main', 'concatPercent', 'done')
                fs.rm(inp, {
                    recursive: true
                }, (err) => {
                    console.log('err: ', err);
                })
                res.forEach(s => {
                    fs.rm(s, {
                        recursive: true
                    }, (err) => {
                        console.log('err: ', err);
                    })
                })
            })
            .on('error', function (err) {
                console.log('An error occurred: ' + err.message);
                winSend('main', 'error', err)
                winSend('main', 'concatPercent', 'error')
                concatData.state = false
            })
            .save(saveFile)

        return false
    }).catch(res => {
        console.log('res: ', res);
        winSend('main', 'concatPercent', 'error')
        concatData.state = false
    })







}
ipcMain.on('concatVideo', concatVideo)

export {
    concatData
}