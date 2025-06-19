import {
    ipcMain,
} from 'electron'
const path = require('path');
const {
    spawn,
} = require('child_process');
let {
    winSend
} = require('./win')
var fs = require('fs')
const { whisperCppPath, fasterWhisperPath, hasFasterWhisper, hasWhisperCpp, ffmpeg, hasFfmpeg } = require('./config')




class WhisperCpp {
    constructor() {
        this.state = false
        this.list = []
        if (hasFfmpeg && hasWhisperCpp) {
            ipcMain.on('whisperCpp', this.whisperCpp.bind(this))

        }
    }
    /**
     * whisper.cpp解析字幕
     * @param {*} event 
     * @param {Object} obj 
     * @param {String} set 
     */
    whisperCpp(event, obj, set) {
        let that = this
        console.log('obj, set: ', obj, set);
        if (that.state) {
            that.list.push([obj, set])
            return
        }
        that.state = true
        let wavPath = path.join(obj.basePath, path.parse(obj.file).name + '.wav'),
            putPath = path.join(obj.basePath, path.parse(obj.file).name);
        let paramsList = ['-f', wavPath, '-of', putPath, '-pp', '-t', '8']
        paramsList.unshift('-m', set.model)
        set.translate && paramsList.push('-tr')
        paramsList.push(...set.type)
        paramsList.push('-l', set.language || 'auto')
        const whisperCppUsage = () => {
            let ls = spawn(whisperCppPath, paramsList)
            console.log(whisperCppPath + ' ' + paramsList.join(' '));
            ls.stdout.on('data', (data) => {
                console.log('data: ', data.toString());
            });
            ls.stderr.on('data', (err) => {
                console.log('err: ', err.toString());
                if (err.indexOf('whisper_full: progress') != -1) {
                    let arr = err.toString().match(/[0-9]+/g) || [0]
                    let t = arr[arr.length - 1]
                    if (t) {
                        winSend('main', 'whisperPercent', {
                            jsonPath: obj.jsonPath,
                            percent: (t / 2 + 50).toFixed(2)
                        })
                    }
                }
            });
            ls.on('close', (code) => {
                winSend('main', 'whisperPercent', {
                    jsonPath: obj.jsonPath,
                    percent: 'done'
                })
                that.state = false
                if (that.list.length) {
                    that.whisperCpp('', ...that.list.shift())
                }
                console.log(`子进程退出: ${code}`);
            });
        }
        fs.access(wavPath, fs.constants.F_OK, (err) => {
            if (err) {
                ffmpeg(obj.filePath)
                    .outputOptions(['-ar 16000', '-ac 1', '-c:a pcm_s16le'])
                    .on('start', function (commandLine) { })
                    .on('codecData', function (data) {
                    })
                    .on('progress', function (progress) {
                        console.log('progress: ', progress);
                        winSend('main', 'whisperPercent', {
                            jsonPath: obj.jsonPath,
                            percent: ((progress.percent || 0) / 2).toFixed(2)
                        })
                    })
                    .on('error', function (err) {
                        console.log('err: ', err);
                        console.log('An error occurred: ' + err.message);
                         whisperCppUsage()
                    })
                    .on('end', function (data) {
                        console.log('data: ', data);
                        whisperCppUsage()
                    }).save(wavPath)
            } else {
                whisperCppUsage()
            }
        })

    }
}






class FasterWhisper {
    constructor() {
        this.state = false
        this.list = []
        if (hasFfmpeg && hasFasterWhisper) {
            ipcMain.on('fasterWhisper', this.fasterWhisper.bind(this))
        }
    }
    /**
     * fasterWhisper解析字幕
     * @param {*} event 
     * @param {Object} obj 
     * @param {String} set 
     */
    fasterWhisper(event, obj, set) {
        let that = this
        console.log('obj, set: ', obj, set);
        if (that.state) {
            that.list.push([obj, set])
            return
        }
        that.state = true
        let wavPath = path.join(obj.basePath, path.parse(obj.file).name + '.wav')
        let paramsList = [wavPath]

        paramsList.push('--model_path', set.model)
        paramsList.push('--formats', ...set.type)
        set.language && paramsList.push('--language', set.language)
        winSend('main', 'whisperPercent', {
            jsonPath: obj.jsonPath,
            percent: (0).toFixed(2)
        })
        const fasterWhisperUsage = () => {
            let ls = spawn(fasterWhisperPath, paramsList)
            console.log(fasterWhisperPath + ' ' + paramsList.join(' '));
            ls.stdout.on('data', (data) => {
                console.log('data: ', data.toString());
            });
            ls.stderr.on('data', (err) => {
                console.log('err: ', err.toString());
                if (err.indexOf('Progress:') != -1) {
                    let arr = err.toString().match(/[0-9]+/g) || [0]
                    let t = arr[arr.length - 1]
                    if (t) {
                        winSend('main', 'whisperPercent', {
                            jsonPath: obj.jsonPath,
                            percent: (t / 2 + 50).toFixed(2)
                        })
                    }
                }
            });
            ls.on('close', (code) => {
                if (code) {
                    winSend('main', 'whisperPercent', {
                        jsonPath: obj.jsonPath,
                        percent: 'error',
                    })
                } else {
                    winSend('main', 'whisperPercent', {
                        jsonPath: obj.jsonPath,
                        percent: 'done'
                    })
                }
                that.state = false
                if (that.list.length) {
                    that.fasterWhisper('', ...that.list.shift())
                }
                console.log(`子进程退出: ${code}`);
            });
        }
        fs.access(wavPath, fs.constants.F_OK, (err) => {
            if (err) {
                ffmpeg(obj.filePath)
                    .outputOptions(['-ar 16000', '-ac 1', '-c:a pcm_s16le'])
                    .on('start', function (commandLine) { })
                    .on('codecData', function (data) {
                    })
                    .on('progress', function (progress) {
                        console.log('progress: ', progress);
                        winSend('main', 'whisperPercent', {
                            jsonPath: obj.jsonPath,
                            percent: ((progress.percent || 0) / 2).toFixed(2)
                        })
                    })
                    .on('error', function (err) {
                        winSend('main', 'whisperPercent', {
                            jsonPath: obj.jsonPath,
                            percent: 'error',
                        })
                        console.log('An error occurred: ' + err.message);
                        that.state = false
                        if (that.list.length) {
                            that.fasterWhisper('', ...that.list.shift())
                        }
                    })
                    .on('end', function (data) {
                        console.log('data: ', data);
                        fasterWhisperUsage()
                    }).save(wavPath)
            } else {
                fasterWhisperUsage()
            }
        })


    }



}
const whisperData = new FasterWhisper()


export {
    whisperData
}