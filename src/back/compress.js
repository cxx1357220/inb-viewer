import {
    app,
    ipcMain,
    shell,
} from 'electron'
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const appPath = app.getAppPath();
var os = require('os')
var arch = os.arch()
const {
    exec,
} = require('child_process');
var platform = os.platform()
if (platform == "darwin") {
    platform = "mac";
} else if (platform == "win32") {
    platform = "win";
}
let {
    winSend
} = require('./win')
// var ffmpegPath = path.join(
//     appPath,
//     process.env.NODE_ENV !== 'production' ? '../public' : '',
//     'ffmpeg',
//     platform,
//     arch,
//     platform === 'win' ? 'ffmpeg.exe' : 'ffmpeg'
// )
var ffmpegPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ffmpeg',
    'ffmpeg.exe'
)
ffmpeg.setFfmpegPath(ffmpegPath);
import {
    times
} from './utils'

const compressData = {
    state: false, //ffmpeg压缩视频进行中
    list: [] //压缩任务队列
}


/**
 * 压缩视频
 * @param {*} event 
 * @param {object} obj 块数据
 * @param {object} set 压缩设置
 * @returns 
 */
const compress = (event, obj, set) => {
    if (compressData.state) {
        compressData.list.push([obj, set])
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
            compressData.state = true
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
            compressData.state = false
        })
        .on('end', function () {
            console.log('Processing finished !');
            shell.showItemInFolder(jsonPath)
            winSend('main', 'percent', {
                jsonPath: obj.jsonPath,
                percent: 'done'
            })
            compressData.state = false
            if (compressData.list.length) {
                compress('', ...compressData.list.shift())
            }
        }).save(obj.basePath + newName)
}
/**
 * 压缩数组内大文件视频
 * @param {*} event 
 * @param {Array} list [obj] 块数据数组
 * @param {object} set 压缩设置
 */
const compressList = (event, list, set) => {
    let ls = list.map(obj => [obj, set])
    compressData.list.push(...ls)
    if (!compressData.state) {
        compress('', ...compressData.list.shift())
    }
}
ipcMain.on('compress', compress)
ipcMain.on('compressList', compressList)


// var ffplayPath = path.join(
//     appPath,
//     process.env.NODE_ENV !== 'production' ? '../public' : '',
//     'player',
//     'VideoPlayer.exe'
// )
// const ffplay = (e, p, i = 0) => {
//     let str = ffplayPath + ' -i ' + i;
//     p.forEach(s => {
//         str += ' -u "' + s + '"'
//     });
//     console.log('str: ', str);

//     exec(str, (
//         err, stdout, stderr) => {
//         if (err) {
//             console.error(err);
//         }
//         if (stderr) {
//             console.error(stderr);
//         }

//     });
// }
// ipcMain.on('ffplay', ffplay)

var mpvPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'mpv',
    'mpv.exe'
)
/**
 * mpv内打开视频
 * @param {*} e 
 * @param {Array} p 视频路径列表
 * @param {Number} i 当前视频在列表中index
 */
const mpv = (e, p, i = 0) => {
    let str = mpvPath

    str += ' --playlist-start=' + i
    str += ' --player-operation-mode=pseudo-gui'
    str += ' --keep-open --autofit=70% --auto-window-resize=no --idle=once '
    str += ' --script-opts=playlistmanager-loadfiles_on_start=no '
    // str += ' --playlist=' + p.join(' ')
    str += p.map(s => '"' + s + '"').join(' ')

    console.log('str: ', str);

    exec(str, (
        err, stdout, stderr) => {
        if (err) {
            console.error(err);
        }
        if (stderr) {
            console.error(stderr);
        }

    });
}
ipcMain.on('inPlayer', mpv)


export {
    compressData
}