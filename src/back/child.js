import {
    app,
    ipcMain,
    shell,
} from 'electron'
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const appPath = app.getAppPath();
var os = require('os')
var platform = os.platform()
if (platform == "darwin") {
    platform = "mac";
} else if (platform == "win32") {
    platform = "win";
}
const {
    exec
} = require('child_process');
var ffmpegPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ffmpeg',
    platform === 'win' ? 'ffmpeg.exe' : 'ffmpeg'
)


fs.chmod(ffmpegPath, 0o775, (err) => { })
ffmpeg.setFfmpegPath(ffmpegPath);


let {
    winMap,
    winSend
} = require('./win')

/**
 * 设置帧为预览图文件
 * @param {*} event 
 * @param {object} obj 块数据
 * @param {string} data 图片信息
 */
const setPoster = (event, obj, data) => {
    let base = new Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), "base64")
    const souceUrl = obj.img.split('?')[0]
    fs.writeFile(souceUrl, base, (err) => {
        if (err) {
            console.log('err:', err);
        }
        winSend('main', 'refreshImg', obj)
        winSend(obj.winKey, 'refreshImg', 'done')
    })
}
ipcMain.on('setPoster', setPoster)

import {
    times
} from './utils'
// 状态
const cutData = {
    state: false,
    list: []
}
/**
 * 剪视频
 * @param {*} event 
 * @param {Object} obj 视频信息
 * @param {boolean} isCode 是否编码
 */
const cutTime = (event, obj, isCode) => {
    winSend(obj.winKey, 'cutPercent', {
        filePath: obj.filePath,
        percent: 'waiting'
    })
    if (cutData.state) {
        cutData.list.push([obj, isCode])
        return false
    }
    // console.log('obj: ', obj);
    let duration = 1,
        segment_times = obj.currentTime,
        winKey = obj.winKey,
        filePath = obj.filePath,
        basePath = path.dirname(filePath),
        file = path.basename(filePath),
        saveFile = path.join(basePath, 'cut-' + file),
        options = ['-y', '-threads 24', '-preset ultrafast']
    if (segment_times) {
        let len = segment_times.split(',').length.toString().length
        saveFile = path.join(basePath, 'cut-part-%' + len + 'd-' + file)
        options.push('-f segment', '-force_key_frames ' + segment_times, '-segment_times ' + segment_times, '-reset_timestamps 1', '-segment_time_delta 0.05', '-map 0')
    }
    if (isCode) {
        saveFile += '.mp4'
        // options.push('-vcodec libx264')
    } else {
        options.push('-c copy')
    }
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            // .inputOptions(['-ss ' + start, '-to ' + obj.duration, '-accurate_seek'])
            // .outputOptions(['-y', '-c copy', '-avoid_negative_ts 1'])
            .outputOptions(options)
            .on('start', function (commandLine) {
                cutData.state = true
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('codecData', function (data) {
                duration = times(data.duration)
            })
            .on('progress', function (progress) {
                winSend(winKey, 'cutPercent', {
                    filePath: filePath,
                    percent: (times(progress.timemark) / duration * 100).toFixed(2)
                })
            })
            .on('end', function () {
                console.log('Processing finished !');
                shell.showItemInFolder(filePath)
                winSend(winKey, 'cutPercent', {
                    filePath: filePath,
                    percent: 'done'
                })
                resolve(filePath)
                cutData.state = false
                if (cutData.list.length) {
                    cutTime('', ...cutData.list.shift())
                }
            })
            .on('error', function (err) {
                console.log('An error occurred: ' + err.message);
                winSend(winKey, 'error', err)
                winSend(winKey, 'cutPercent', {
                    filePath: filePath,
                    percent: 'error'
                })
                reject(filePath)
                cutData.state = false
                if (cutData.list.length) {
                    cutTime('', ...cutData.list.shift())
                }
            })
            // .save(obj.basePath + 'del-part-' + obj.file)
            .save(saveFile)
    })

}
ipcMain.on('cutTime', cutTime)
ipcMain.handle('cutTime', cutTime)


const getData = {
    state: false
}
/**
 * 时间转成秒数
 * @param {string} durationStr 
 * @returns {number} 秒数
 */
function durationToSeconds(durationStr) {
    const [hms, ms] = durationStr.split('.');
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600 + m * 60 + s + Number(ms) / 100;
}
/**
 * 获取视频时长
 * @param {*} event 
 * @param {Array} list 视频数据数组
 * @returns 
 */
const getListInfo = (event, list) => {
    let callBack = {},
        i = 0,
        len = list.length;
    if (!len) {
        return false
    }
    getData.state = true

    const info = (i) => {
        const next = () => {
            if (i < len - 1) {
                console.log(i + '/' + (len - 1));
                winSend('main', 'rateDuration', i + 1 + '/' + len)
                i++
                info(i)
            } else {
                console.log("callBack", callBack);
                getData.state = false
                winSend('main', 'videoDuration', callBack)
            }
        }
        ffmpeg(list[i].v).output('-').outputFormat('null').on('error',(r)=>{
            console.log('r: ', r);
        }).on('stderr', (stderr) => {
            const durationMatch = stderr.match(/Duration:\s(\d{2}:\d{2}:\d{2}\.\d{2})/);
            let duration = durationMatch ? durationMatch[1] : null;
            if (duration) {
                duration = durationToSeconds(duration)
                callBack[list[i].j] = {
                    'videoDuration': duration
                }
                let stats = fs.statSync(list[i].j)
                fs.readFile(list[i].j, 'utf-8', (err, call) => {
                    if (err) {
                        return false
                    }
                    let data = JSON.parse(call)
                    data['inb-duration'] = duration
                    fs.writeFile(list[i].j, JSON.stringify(data), (err) => {
                        if (err) {
                            console.log('write-err: ', err);
                            return false
                        }
                        fs.utimes(
                            list[i].j,
                            new Date(stats.atime),
                            new Date(stats.mtime),
                            function (err) {
                                err && (console.log('err: ', err));
                            }
                        );
                    })
                })
            }
        }).on('end',()=>{
            next()
        }).run()
    }
    info(i)

}
ipcMain.on('getListInfo', getListInfo)



/**
 * 设置图片文件为预览图文件
 * @param {*} event 
 * @param {object} obj 块数据
 * @param {string} s 图片路径
 */
const imgSetPoster = (event, obj, s) => {
    fs.copyFile(s, obj.img.split('?rand=')[0], (err) => {
        if (err) {
            console.log('err:', err);
        }
        winSend('main', 'refreshImg', obj)
        winSend(obj.winKey, 'refreshImg', 'done')
    })
}
ipcMain.on('imgSetPoster', imgSetPoster)


/**
 * 获取前后几分钟带sei信息的时间戳
 * @param {*} event 
 * @param {object} obj 块数据
 * @returns Promise
 */
const getPtsTime = (event, obj) => {

    const start = new Promise((resolve, reject) => {
        // let s = `${ffmpegPath} -i "${obj.filePath}" -t 00:07:00 -vf "select=\'gt(scene\,0.4)\',showinfo" -vsync vfr -f null -`
        // let s = `${ffmpegPath} -i "${obj.filePath}" -t 00:07:00 -vf "select='eq(pict_type,PICT_TYPE_I)',showinfo" -vsync vfr -f null -`
        // console.log('s: ', s);
        // console.time('s')
        // ffmpeg(obj.filePath).inputOptions(['-t 00:07:00', `-vf "select='eq(pict_type,PICT_TYPE_I)',showinfo"`, '-vsync vfr']).output('-').outputFormat('null').on('start', function (commandLine) {
        const regex = /pts_time:(\d+\.\d+)/;
        let lastDuration_time, isSEI, isNext, lastPts_time, lastRange
        ffmpeg(obj.filePath).inputOptions(['-t 00:07:00'])
            .videoFilters("select='eq(pict_type,PICT_TYPE_I)',showinfo")
            .outputOptions(['-vsync vfr', '-f null'])
            .output('-')
            .on('start', function (commandLine) {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            }).on('error', (error) => {
                console.log('error: ', error);
            }).on('stderr', (stderr) => {
                const match = stderr.match(regex);
                if (match) {
                    let pts_time = Number(match[1])
                    let match2 = stderr.match(/duration_time:(\d+\.\d+)/)
                    let duration_time
                    if (match2) {
                        duration_time = Number(match2[1] || 0)
                    }
                    if (lastDuration_time && (lastDuration_time != duration_time)) {
                        resolve({ v: lastPts_time })
                    }
                    if (lastRange && lastPts_time && Math.abs(lastPts_time - pts_time - lastRange > 1)) {
                        console.log(lastPts_time, pts_time, lastRange, lastPts_time - pts_time - lastRange);
                        resolve({ v: lastPts_time })
                    }
                    if (lastPts_time) {
                        lastRange = lastPts_time - pts_time
                    }
                    lastDuration_time = duration_time
                    if (isSEI || isNext) {
                        // winSend(obj.winKey, 'ptsTime', [{ v: pts_time }])
                        resolve({ v: pts_time })
                    }
                    lastPts_time = pts_time
                } else if (stderr.includes('SEI')) {
                    isSEI = true
                } else if (stderr.includes('config out time_base')) {
                    isNext = true
                }


            }).on('end', (str) => {
                resolve()
            }).run();
    })
    const end = new Promise((resolve, reject) => {
        console.log(888, obj.filePath);

        // console.time('e')
        ffmpeg(obj.filePath).output('-').outputFormat('null').on('error', error => {
            console.log('error: ', error);
            resolve()
        }).on('stderr', (stderr) => {
            const durationMatch = stderr.toString().match(/Duration:\s(\d{2}:\d{2}:\d{2}\.\d{2})/);
            let duration = durationMatch ? durationMatch[1] : null;
            if (!duration) {
                return;
            }
            duration = durationToSeconds(duration)
            let ssTime = duration - 420
            console.log('ssTime: ', ssTime);
            // let ss = `${ffmpegPath} -ss ${ssTime} -i "${obj.filePath}"  -vf "select=\'gt(scene\,0.4)\',showinfo" -vsync vfr -f null -`
            // let ss = `${ffmpegPath} -ss ${ssTime} -i "${obj.filePath}"  -vf "select='eq(pict_type,PICT_TYPE_I)',showinfo" -vsync vfr -f null -`
            let pts_time, lastPts_time, lastRange;
            const regex = /pts_time:(\d+\.\d+)/;
            ffmpeg(obj.filePath).inputOptions(['-ss ' + ssTime]).videoFilters("select='eq(pict_type,PICT_TYPE_I)',showinfo").outputOptions(['-vsync vfr', '-f null']).output('-').on('start', function (commandLine) {
                console.log('Spawned Ffmpeg end with command: ' + commandLine);
            }).on('stderr', (stderr) => {
                // console.log('stderr: ', stderr);
                const match = stderr.match(regex);
                if (match) {
                    pts_time = Number(ssTime) + Number(match[1])
                    if (lastRange && lastPts_time && Math.abs(pts_time - lastPts_time - lastRange) > 1) {
                        resolve({ v: lastPts_time })
                    }
                    if (lastPts_time) {
                        lastRange = pts_time - lastPts_time
                    }
                    lastPts_time = pts_time
                }
                if (stderr.includes('SEI')) {
                    resolve({ v: pts_time })
                }
            }).on('end', () => {
                resolve()

            }).run()

        }).on('end', () => {
            console.log('end: ', 1);
        }).run();
    })
    return Promise.all([start,end]).then(res => {
        console.log('res: ', res);

        let list = res.filter(o => o)
        if (list.length) {
            winSend(obj.winKey, 'ptsTime', list)
        }
        // console.timeEnd('a')
        return res
    })

}
ipcMain.on('getPtsTime', getPtsTime)
ipcMain.handle('getPtsTime', getPtsTime)




export {
    cutData,
    getData
}