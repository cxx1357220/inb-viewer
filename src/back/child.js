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
var arch = os.arch()
var platform = os.platform()
if (platform == "darwin") {
    platform = "mac";
} else if (platform == "win32") {
    platform = "win";
}
const {
    exec
} = require('child_process');
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

var ffprobePath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ffmpeg',
    'ffprobe.exe'
)
ffmpeg.setFfprobePath(ffprobePath);

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
            cutData.state = false
            if (cutData.list.length) {
                cutTime('', ...cutData.list.shift())
            }
        })
        // .save(obj.basePath + 'del-part-' + obj.file)
        .save(saveFile)
}
ipcMain.on('cutTime', cutTime)


const getData = {
    state: false
}
/**
 * 获取视频时长
 * @param {*} event 
 * @param {Array} list 视频数据数组
 * @returns 
 */
const getListInfo = (event, list) => {
    let callBack = {},
        //     out = {},
        //     outTime = {},
        //     outlist = [],
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
                // fs.writeFileSync('./outTime.json', JSON.stringify(outTime))
                // fs.writeFileSync('./aaaaa.json', JSON.stringify(out))
                // fs.writeFileSync('./zzzzz.json', JSON.stringify(outlist))
            }
        }
        ffmpeg.ffprobe(list[i].v, function (err, metadata) {
            if (err) {
                console.log('err: ', err);
                next()
            } else {
                callBack[list[i].j] = {
                    'videoDuration': metadata.format.duration
                }
                let stats = fs.statSync(list[i].j)
                fs.readFile(list[i].j, 'utf-8', (err, call) => {
                    if (err) {
                        next()
                        return false
                    }
                    let data = JSON.parse(call)
                    data['inb-duration'] = metadata.format.duration
                    fs.writeFile(list[i].j, JSON.stringify(data), (err) => {
                        if (err) {
                            console.log('write-err: ', err);
                            next()
                            return false
                        }
                        fs.utimes(
                            list[i].j,
                            new Date(stats.atime),
                            new Date(stats.mtime),
                            function (err) {
                                next()
                                err && (console.log('err: ', err));
                            }
                        );
                    })
                })
                // metadata.streams.forEach(obj => {
                //     if (obj.codec_type == 'video') {
                //         out[list[i]] = obj.codec_name
                //     }
                // })
                // outTime[list[i]] = metadata.format.duration
                // outlist.push(metadata)
            }


        });
    }
    info(i)

}

// const getInfo = (event, obj) => {
//     let winKey = obj.winKey
//     ffmpeg.ffprobe(obj.filePath, function (err, metadata) {
//         console.log('metadata: ', metadata);
//         if (err) {
//             console.log('err: ', err);
//         } else {
//             metadata.streams.forEach(obj => {
//                 if (obj.codec_type == 'video') {
//                     winSend(winKey, 'codecName', obj.codec_name)
//                 }
//             })

//         }
//     });
// }
// ipcMain.on('getInfo', getInfo)
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
        let s = `${ffmpegPath} -i "${obj.filePath}" -t 00:07:00 -vf "select='eq(pict_type,PICT_TYPE_I)',showinfo" -vsync vfr -f null -`
        console.log('s: ', s);
        console.time('s')
        exec(s, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                resolve()
                return;
            }

            // 输出 ffmpeg 执行的结果
            // console.log(`stdout: ${stdout}`);
            // console.log(`stderr: ${stderr}`);
            // console.log('stderr: ', stderr.split('\n'));
            let list = stderr.split('\n')
            const regex = /pts_time:(\d+\.\d+)/;
            let lastTime, isSEI, isNext, nextTime
            for (let i = list.length - 1; i >= 0; i--) {
                const match = list[i].match(regex);
                if (match) {
                    let prevTime = Number(match[1])
                    let match2 = list[i].match(/duration_time:(\d+\.\d+)/)
                    let duration_time
                    if(match2){
                        duration_time = Number(match2[1]||0)
                    }
                    if (lastTime && (lastTime != duration_time)) {
                        // winSend(obj.winKey, 'ptsTime', [{ v: nextTime }])
                        resolve({ v: nextTime })
                        break
                    }
                    lastTime = duration_time
                    if (isSEI || isNext) {
                        // winSend(obj.winKey, 'ptsTime', [{ v: prevTime }])
                        resolve({ v: prevTime })
                        break
                    }
                    nextTime = prevTime
                } else if (list[i].includes('SEI')) {
                    isSEI = true
                } else if (s.includes('config out time_base')) {
                    isNext = true
                }
            }
            resolve()
            console.timeEnd('s')

        });
    })
    const end = new Promise(resolve => {
        let alltime = `${ffprobePath} -i "${obj.filePath}" -show_entries format=duration -v quiet -of csv="p=0"`
        console.time('e')
        exec(alltime, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                resolve()
                return;
            }

            // 输出 ffmpeg 执行的结果
            // console.log(`stdout: ${stdout}`);
            let ssTime = stdout - 420
            // let ss = `${ffmpegPath} -ss ${ssTime} -i "${obj.filePath}"  -vf "select=\'gt(scene\,0.4)\',showinfo" -vsync vfr -f null -`
            let ss = `${ffmpegPath} -ss ${ssTime} -i "${obj.filePath}"  -vf "select='eq(pict_type,PICT_TYPE_I)',showinfo" -vsync vfr -f null -`
            console.log('ss: ', ss);
            exec(ss, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }

                // 输出 ffmpeg 执行的结果
                // console.log(`stdout: ${stdout}`);
                // console.log(`stderr: ${stderr}`);
                // console.log('stderr: ', stderr.split('\n'));
                let list = stderr.split('\n')
                let prevTime;
                const regex = /pts_time:(\d+\.\d+)/;
                for (let i = 0; i < list.length; i++) {
                    const match = list[i].match(regex);
                    if (match) {
                        prevTime = Number(ssTime) + Number(match[1])
                    }
                    if (list[i].includes('SEI')) {
                        // winSend(obj.winKey, 'ptsTime', [{ v: prevTime }])
                        resolve({ v: prevTime })
                        break
                    }
                }
                resolve()
                console.timeEnd('e')

            });
        });
    })
    console.time('a')
    return Promise.all([start,end]).then(res=>{
        console.log('res: ', res);
        let list = res.filter(o=>o)
        if(list.length){
            winSend(obj.winKey, 'ptsTime', list)
        }
        console.timeEnd('a')
        return res
    })

}
ipcMain.on('getPtsTime', getPtsTime)





export {
    cutData,
    getData
}