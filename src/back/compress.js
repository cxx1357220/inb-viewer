import {
    ipcMain,
    shell,
} from 'electron'
const path = require('path');
let {
    winSend
} = require('./win')
const {
    hasFfmpeg,
    ffmpeg,
} = require('./config')
import {
    times
} from './utils'



class CompressMedia {
    constructor() {
        this.state = false //ffmpeg压缩视频进行中
        this.list = [] //压缩任务队列
        if (hasFfmpeg) {
            ipcMain.on('compressMedia', this.compress.bind(this))
            ipcMain.on('batchCompressMedia', this.batchCompress.bind(this))
        }
    }

    /**
     * 压缩视频
     * @param {*} event 
     * @param {object} obj 块数据
     * @param {object} set 压缩设置
     * @returns 
     */
    compress (event, obj, set) {
        let that = this 
        
        if (this.state) {
            this.list.push([obj, set])
            return false
        }
        let duration = 1,
            newName = '(new)' + obj.file;
        const options = ['-threads 24', '-preset ultrafast'],
            jsonPath = obj.jsonPath
        set.size && options.push('-s ' + set.size)
        set.type && (newName = newName + set.type)
        set.vcodec && options.push('-vcodec ' + set.vcodec)
        set.fps && options.push('-r ' + set.fps)
        // options.push('-vcodec ' + (set.vcodec || 'copy'))

        ffmpeg(obj.filePath)
            // .inputOptions(['-hwaccel cuvid'])
            .outputOptions(options)
            .on('start', function (commandLine) {
                that.state = true
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('codecData', function (data) {
                duration = times(data.duration)
            })
            .on('progress', function (progress) {
                winSend('main', 'percent', {
                    jsonPath: obj.jsonPath,
                    percent: (times(progress.timemark) / duration * 100).toFixed(2)
                })
            })
            .on('error', function (err) {
                console.log('An error occurred: ' + err.message);
                that.state = false
            })
            .on('end', function () {
                console.log('Processing finished !');
                shell.showItemInFolder(jsonPath)
                winSend('main', 'percent', {
                    jsonPath: obj.jsonPath,
                    percent: 'done'
                })
                that.state = false
                if (that.list.length) {
                    that.compress('', ...that.list.shift())
                }
            }).save(path.join(obj.basePath, newName))
    }
    /**
     * 压缩数组内大文件视频
     * @param {*} event 
     * @param {Array} list [obj] 块数据数组
     * @param {object} set 压缩设置
     */
    batchCompress (event, list, set) {
        console.log('list, set: ', this, list, set);
        let ls = list.map(obj => [obj, set])
        this.list.push(...ls)
        if (!this.state) {
            this.compress('', ...this.list.shift())
        }
    }
}

const compressData = new CompressMedia()





export {
    compressData
}