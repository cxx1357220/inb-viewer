import {
    ipcMain,
} from 'electron'
const {
    spawn,
    exec
} = require('child_process');
const iconv = require('iconv-lite');
let {
    winSend
} = require('./win')
const copyData = {
    state: false, //复制进行中
    list: [] //复制任务队列
}
import {throttle} from './utils'

const throttlePercent=throttle((jsonPath,d)=>{
    winSend('main', 'copyPercent', {
        jsonPath: jsonPath,
        percent: d
    })
})

/**
 * 复制文件夹
 * @param {*} event 
 * @param {Array} obj 
 * @param {String} copyVal 
 */
const copyDir = (event, obj, copyVal) => {
    if (copyData.state) {
        copyData.list.push([obj, copyVal])
        return false
    }
    copyData.state = true
    let li = obj.basePath.split('\\')
    let newPath = copyVal + '\\' + li[li.length - 2]
    console.log('robocopy ' + obj.basePath + ' ' + newPath + ' /E /tee');
    // let ls = spawn('robocopy', [obj.basePath, newPath, '/e', '/tee','/nfl','/ndl','/njh','/njs','/ns','/nc','/r:0'])
    let ls = spawn('robocopy', [obj.basePath, newPath, '/e', '/tee', '/r:0'])

    // let ls = spawn('xcopy', [obj.basePath, newPath+'\\', '/e','/y','/Z'])
    ls.stdout.on('data', (data, o) => {
        var str = iconv.decode(data, 'gbk');
        // console.log('str: ', str);
        // if (str.indexOf('磁盘空间不足。') != -1) {
        //     console.log('磁盘空间不足。');
        //     ls.kill()
        // } else {
        let d = str.split('%')[0]
        if (!isNaN(d)) {
            // console.log('d: ', d);
            // winSend('main', 'copyPercent', {
            //     jsonPath: obj.jsonPath,
            //     percent: d
            // })
            throttlePercent(obj.jsonPath,d)
        }
        // }
    });
    ls.stderr.on('data', (err) => {
        // console.log('copy err: ', err);
        var str = iconv.decode(err, 'gbk');
        console.log('err: ', str);
    });
    ls.on('close', (code, signal) => {
        console.log(`子进程退出: ${code}${signal}`);
        if (code >= 8) {
            winSend('main', 'copyPercent', {
                jsonPath: obj.jsonPath,
                percent: 'error',
            })
            switch (code) {
                case 8:
                    winSend('main', 'error', '磁盘空间不足。')
                    break;
                case 16:
                    winSend('main', 'error', '系统找不到指定的路径。')
                    break;
                default:
                    winSend('main', 'error', 'robocopy复制操作期间至少发生了一次失败。')
                    break;
            }

        } else {
            winSend('main', 'copyPercent', {
                jsonPath: obj.jsonPath,
                percent: 'done'
            })
        }

        copyData.state = false
        if (copyData.list.length) {
            copyDir('', ...copyData.list.shift())
        }
    });
}

/**
 * 批量复制文件夹
 * @param {*} event 
 * @param {Array} list 
 * @param {String} copyVal 
 * @returns 
 */
const xcopyList = (event, list, copyVal) => {
    let ls = list.map(obj => [obj, copyVal])
    copyData.list.push(...ls)
    if (!copyData.state) {
        copyDir('', ...copyData.list.shift())
    }
}


ipcMain.on('copyDir', copyDir)
ipcMain.on('xcopyList', xcopyList)
export {
    copyData
}