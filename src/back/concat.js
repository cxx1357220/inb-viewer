import {
    ipcMain,
    shell,
} from 'electron'
const path = require('path');
const fs = require('fs');
let {
    winSend
} = require('./win')
const {
    hasFfmpeg,
    ffmpeg,
} = require('./config')

import {
    throttle,
    times
} from './utils'


class ConcatMedia {
    constructor() {
        this.state = false;
        this.throttlePercent = throttle((s) => {
            winSend('main', 'concatPercent', s);
        });
        if (hasFfmpeg) {
            ipcMain.on('concatVideo', this.concatVideo.bind(this));
        }
    }

    /**
     * 合并视频
     * @param {*} event 
     * @param {object} obj 合并的信息
     */
    concatVideo(event, obj) {
        let that = this
        that.state = true

        if (obj.unSameType) {
            let saveFile = path.join(obj.savePath, obj.name + '.mp4')
            let ff = ffmpeg()
                .on('start', function (commandLine) {
                    console.log('Spawned Ffmpeg with command: ' + commandLine);
                })
                .on('codecData', function (data) {
                    console.log('data: ', data);
                })
                .on('progress', function (progress) {
                    // console.log('progress: ', progress);
                    if(progress.percent){
                        that.throttlePercent(((progress.percent || 0) / obj.files.length).toFixed(2))
                    }else{
                        that.throttlePercent(progress.timemark)
                    }
                })
                .on('end', function () {
                    console.log('end');
                    shell.showItemInFolder(saveFile)
                    winSend('main', 'concatPercent', 'done')
                    that.state = false
                })
                .on('error', function (err) {
                    console.log('An error occurred: ' + err.message);
                    winSend('main', 'error', err)
                    winSend('main', 'concatPercent', 'error')
                    that.state = false

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
                let saveFile = path.join(obj.savePath, 'inb-' + i + '.ts')
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
            let saveFile = path.join(obj.savePath, obj.name + '.mp4')
            let inp = path.join(obj.savePath, 'inb-concat.txt')
            let txtVal = ''
            res.forEach(s => {
                // 格式离谱，带空格文件夹需要'包裹
                txtVal += "file '" + s.replaceAll('\\', '\\\\') + "'\r\n"
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
                    that.throttlePercent(((times(progress.timemark) / allTime) * 50 + 50).toFixed(2))
                })
                .on('end', function () {
                    console.log('end');
                    shell.showItemInFolder(saveFile)
                    that.state = false
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
                    that.state = false
                })
                .save(saveFile)

            return false
        }).catch(res => {
            console.log('res: ', res);
            winSend('main', 'concatPercent', 'error')
            that.state = false
        })

    }

}
const concatData = new ConcatMedia()




export {
    concatData
}