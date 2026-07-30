import {
    ipcMain,
} from 'electron'
const path = require('path');
const {
    fork,
} = require('child_process');
const kill = require('tree-kill');

const {
    asrPath
} = require('./config')
let {
    winSend
} = require('./win')
var fs = require('fs')


const { senseVoiceModelPath, senseVoiceTokenPath, hasSenseVoice, sileroVadModelPath, ffmpeg, hasFfmpeg } = require('./config')

function pad(number, length) {
    let str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}
function convertToSRT(name, list) {
    let content = list.map((data, i) => {
        const { start_time, end_time, text } = data;
        const startTime = convertTime(start_time);
        const endTime = convertTime(end_time);
        return `${i + 1}\n${startTime} --> ${endTime}\n${text}`;
    }).join('\n\n');
    fs.writeFile(name + '.srt', content, function (err) {
        if (err) {
            console.log('writeFile err: ', err);
        }
    })

}
function convertToVtt(name, list) {
    let content = list.map((data, i) => {
        const { start_time, end_time, text } = data;
        const startTime = convertTime(start_time, '.');
        const endTime = convertTime(end_time, '.');
        return `${i + 1}\n${startTime} --> ${endTime}\n${text}`;
    }).join('\n\n');
    content = `WEBVTT FILE\n\n${content}`;
    fs.writeFile(name + '.vtt', content, function (err) {
        if (err) {
            console.log('writeFile err: ', err);
        }
    })
}
function convertToTxt(name, list) {
    let text = '';
    list.forEach(item => {
        text += item.text;
    });
    fs.writeFile(name + '.txt', text, function (err) {
        if (err) {
            console.log('writeFile err: ', err);
        }
    })
}

function convertTime(timeInSeconds, format = ',') {
    const totalSeconds = parseFloat(timeInSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
    const seconds = Math.floor(totalSeconds - (hours * 3600) - (minutes * 60));
    const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000);
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}${format}${pad(milliseconds, 3)}`;
}




const writeFile = (name, list) => {
    convertToSRT(name, list)
    convertToVtt(name, list)
    convertToTxt(name, list)
}




class Asr {
    constructor() {
        this.state = false
        this.list = []
        if (hasFfmpeg && hasSenseVoice) {
            ipcMain.on('asr', this.asr.bind(this))
        }
    }
    /**
     * asr解析字幕
     * @param {*} event 
     * @param {Object} obj 
     * @param {String} set 
     */
    asr(event, obj, set) {
        let that = this
        console.log('asr obj: ', obj);
        if (that.state) {
            that.list.push([obj, set])
            return
        }
        that.state = true
        let wavPath = path.join(obj.basePath, path.parse(obj.file).name + '.wav')
        winSend('main', 'asrPercent', {
            jsonPath: obj.jsonPath,
            percent: (0).toFixed(2)
        })
        const asrUsage = () => {
            const forked = fork(asrPath);
            if(set.sileroVadVersion=='none'){
                winSend('main', 'asrPercent', {
                    jsonPath: obj.jsonPath,
                    percent: 'loading'
                })
            }
            forked.on('message', function (forkedRes) {
                winSend('main', 'asrPercent', {
                    jsonPath: obj.jsonPath,
                    percent: forkedRes.percent,
                })
                if (forkedRes.percent == 'done') {
                    // forked.kill()
                    kill(forked.pid)
                    let name = path.join(obj.basePath, path.parse(obj.file).name)
                    if(set.sileroVadVersion=='none'){
                        fs.writeFile(name + '.txt', forkedRes.text, function (err) {
                            if (err) {
                                console.log('writeFile err: ', err);
                            }
                        })
                    }else{
                        writeFile(name, forkedRes.outList)
                    }
                }
                if (forkedRes.percent == 'error') {
                    winSend('main', 'asrPercent', {
                        jsonPath: obj.jsonPath,
                        percent: 'error',
                    })
                    kill(forked.pid)
                }
            })
            forked.on('close', function (code) {
                console.log('子进程已退出，退出码close ' + code);
            });
            forked.on('exit', function (code) {
                console.log('子进程已关闭，退出码exit ' + code);
                if (code) {
                    winSend('main', 'asrPercent', {
                        jsonPath: obj.jsonPath,
                        percent: 'error',
                    })
                }
                that.state = false
                if (that.list.length) {
                    that.asr('', ...that.list.shift())
                }
            });
            forked.send(Object.assign({
                wavPath,
                senseVoiceModelPath,
                senseVoiceTokenPath,
                sileroVadModelPath,
            }, set))
        }
        fs.access(wavPath, fs.constants.F_OK, (err) => {
            if (err||set.formatWav) {
                ffmpeg(obj.filePath)
                    .outputOptions(['-ar 16000', '-ac 1', '-c:a pcm_s16le'])
                    .on('start', function (commandLine) { })
                    .on('codecData', function (data) {
                    })
                    .on('progress', function (progress) {
                        console.log('progress: ', progress);
                        winSend('main', 'asrPercent', {
                            jsonPath: obj.jsonPath,
                            percent: ((progress.percent || 0) / 2).toFixed(2)
                        })
                    })
                    .on('error', function (err) {
                        winSend('main', 'asrPercent', {
                            jsonPath: obj.jsonPath,
                            percent: 'error',
                        })
                        console.log('An error occurred: ' + err.message);
                        that.state = false
                        if (that.list.length) {
                            that.asr('', that.list.shift())
                        }
                    })
                    .on('end', function (data) {
                        console.log('data: ', data);
                        asrUsage()
                    }).save(wavPath)
            } else {
                console.log('wavPath: ', wavPath);
                asrUsage()
            }
        })


    }



}
const asrData = new Asr()


export {
    asrData
}