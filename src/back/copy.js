import {
    ipcMain,
} from 'electron'
const {
    spawn,
} = require('child_process');
const iconv = require('iconv-lite');
const path = require('path');
const { platform } = require('./config')
let {
    winSend
} = require('./win')

import { throttle } from './utils'

class Copy {
    constructor() {
        this.state = false
        this.list = []
        this.throttlePercent = throttle((jsonPath, d) => {
            winSend('main', 'copyPercent', {
                jsonPath: jsonPath,
                percent: d
            })
        })
        ipcMain.on('copyDir', this.copyDir.bind(this))
        ipcMain.on('copyList', this.copyList.bind(this))
    }


    /**
     * 复制文件夹
     * @param {*} event 
     * @param {object} obj 复制的块
     * @param {String} copyVal 复制到的路径
     */
    copyDir(event, obj, copyVal) {
        let that = this
        if (this.state) {
            this.list.push([obj, copyVal])
            return false
        }
        this.state = true
        if (platform !== 'win32') {
            console.log('rsync -av --progress' + obj.basePath + ' ' + copyVal);
            let ls = spawn('rsync', ['-av', '--progress', obj.basePath, copyVal])
            ls.stdout.on('data', (data, o) => {
                var str = iconv.decode(data, 'gbk');
                console.log('str: ', str);
                const match = str.match(/\d+%/);
                if (match) {
                    that.throttlePercent(obj.jsonPath, match[0].split('%')[0])
                }
            });
            ls.stderr.on('data', (err) => {
                var err = iconv.decode(err, 'gbk');
                console.log('err: ', err);
            });
            ls.on('close', (code, signal) => {
                console.log(`子进程退出: ${code}${signal}`);
                if (code) {
                    winSend('main', 'copyPercent', {
                        jsonPath: obj.jsonPath,
                        percent: 'error',
                    })
                    winSend('main', 'error', '复制操作期间至少发生了一次失败。')
                } else {
                    winSend('main', 'copyPercent', {
                        jsonPath: obj.jsonPath,
                        percent: 'done'
                    })
                }

                that.state = false
                if (that.list.length) {
                    that.copyDir('', ...that.list.shift())
                }
            });
        } else {
            let newPath = path.join(copyVal, path.parse(obj.basePath).name)
            console.log('robocopy ' + obj.basePath + ' ' + newPath + ' /E /tee');
            let ls = spawn('robocopy', [obj.basePath, newPath, '/e', '/tee', '/r:0'])
            // let ls = spawn('xcopy', [obj.basePath, newPath+'\\', '/e','/y','/Z'])
            ls.stdout.on('data', (data, o) => {
                var str = iconv.decode(data, 'gbk');
                let d = str.split('%')[0]
                if (!isNaN(d)) {
                    that.throttlePercent(obj.jsonPath, d)
                }
            });
            ls.stderr.on('data', (err) => {
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
                            winSend('main', 'error', '复制操作期间至少发生了一次失败。')
                            break;
                    }

                } else {
                    winSend('main', 'copyPercent', {
                        jsonPath: obj.jsonPath,
                        percent: 'done'
                    })
                }

                that.state = false
                if (that.list.length) {
                    that.copyDir('', ...that.list.shift())
                }
            });
        }


    }

    /**
     * 批量复制文件夹
     * @param {*} event 
     * @param {Array} list [obj] 复制的块数组
     * @param {String} copyVal 复制到的路径
     * @returns 
     */
    copyList(event, list, copyVal) {
        let ls = list.map(obj => [obj, copyVal])
        this.list.push(...ls)
        if (!this.state) {
            this.copyDir('', ...this.list.shift())
        }
    }

}



const copyData = new Copy()
export {
    copyData
}