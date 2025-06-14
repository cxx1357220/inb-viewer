import {
    app,
    ipcMain,
} from 'electron'
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const {
    spawn,
} = require('child_process');
let {
    winSend
} = require('./win')
const appPath = app.getAppPath();
var os = require('os')
var fs = require('fs')
var arch = os.arch()
var platform = os.platform()
//patch for compatibilit with electron-builder, for smart built process.
if (platform == "darwin") {
    platform = "mac";
} else if (platform == "win32") {
    platform = "win";
}

var whisperCppPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'whisper-cpp',
    'main.exe'
)
fs.chmod(whisperCppPath, 0o775, (err) => {})

var ffmpegPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ffmpeg',
    platform === 'win' ? 'ffmpeg.exe' : 'ffmpeg'
)
var fasterWhisperPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'whisper',
    platform === 'win' ? 'whisper.exe' : 'whisper'
)
fs.chmod(fasterWhisperPath, 0o775, (err) => {})
fs.chmod(ffmpegPath, 0o775, (err) => {})
ffmpeg.setFfmpegPath(ffmpegPath);
import {
    times
} from './utils'





// /**
//  * whisper解析字幕
//  * @param {*} event 
//  * @param {Object} obj 
//  * @param {String} language 
//  */
// const whisper = (event, obj, set) => {
//     let l = [obj.filePath, '--no_speech_threshold', '0.5', '--logprob_threshold', 'None', '--compression_ratio_threshold', '2.2', '--fp16', 'False', '--output_format', 'vtt', '--output_dir', obj.basePath]
//     if (set.language) {
//       l.push('--language', set.language)
//     }
//     let ls = spawn('whisper', l)
//     console.log('ls: ', ls.spawnargs.join(' '));
//     ls.stdout.on('data', (data) => {
//       console.log('data: ', data.toString());
//     });
//     ls.stderr.on('data', (err) => {
//       console.log('err: ', err.toString());
//     });
//     ls.on('close', (code) => {
//       console.log(`子进程退出: ${code}`);
//       winSend('main','whisperDone', obj.filePath)
//     });
//   }
const whisperData = {
    state: false,
    list: []
}

/**
 * whisper.cpp解析字幕
 * @param {*} event 
 * @param {Object} obj 
 * @param {String} set 
 */
const whisperCpp = (event, obj, set) => {
    console.log('obj, set: ', obj, set);
    if (whisperData.state) {
        whisperData.list.push([obj, set])
        return
    }
    whisperData.state = true
    let wavPath = path.join(obj.basePath , path.parse(obj.file).name + '.wav'),
        putPath = path.join(obj.basePath , path.parse(obj.file).name);
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
            whisperData.state = false
            if (whisperData.list.length) {
                whisperCpp('', ...whisperData.list.shift())
            }
            console.log(`子进程退出: ${code}`);
        });
    }
    fs.access(wavPath, fs.constants.F_OK, (err) => {
        if (err) {
            ffmpeg(obj.filePath)
                .outputOptions(['-ar 16000', '-ac 1', '-c:a pcm_s16le'])
                .on('start', function (commandLine) {})
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
                    console.log('An error occurred: ' + err.message);
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



/**
 * fasterWhisper解析字幕
 * @param {*} event 
 * @param {Object} obj 
 * @param {String} set 
 */
const fasterWhisper = (event, obj, set) => {
    console.log('obj, set: ', obj, set);
    // return false
    if (whisperData.state) {
        whisperData.list.push([obj, set])
        return
    }
    whisperData.state = true
    let wavPath = path.join(obj.basePath , path.parse(obj.file).name + '.wav')
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
            if(code){
                winSend('main', 'whisperPercent', {
                    jsonPath: obj.jsonPath,
                    percent: 'error',
                })
            }else{
                winSend('main', 'whisperPercent', {
                    jsonPath: obj.jsonPath,
                    percent: 'done'
                })
            }
           
            whisperData.state = false
            if (whisperData.list.length) {
                fasterWhisper('', ...whisperData.list.shift())
            }
            console.log(`子进程退出: ${code}`);
        });
    }
    fs.access(wavPath, fs.constants.F_OK, (err) => {
        if (err) {
            ffmpeg(obj.filePath)
                .outputOptions(['-ar 16000', '-ac 1', '-c:a pcm_s16le'])
                .on('start', function (commandLine) {})
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
                    console.log('An error occurred: ' + err.message);
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


ipcMain.on('fasterWhisper', fasterWhisper)

export {
    whisperData
}