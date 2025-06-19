import {
    ipcMain,
} from 'electron'
const {
    exec,
} = require('child_process');
let {
    winSend
} = require('./win')

const { rePKGPath, platform, hasRePKG } = require('./config')
class Repkg {
    constructor() {
        this.state = false;
        this.list = [];
        if (platform === 'win32' && hasRePKG) {
            ipcMain.on('repkg', this.repkg.bind(this))
            ipcMain.on('repkgList', this.repkgList.bind(this))
        }
    }
    /**
     * 解压PKG
     * @param {*} event 
     * @param {Object} obj 块信息
     */
    repkg(event, obj) {
        let that = this
        if (that.state) {
            that.list.push([obj])
            return false
        }
        that.state = true
        winSend('main', 'repkgPercent', {
            jsonPath: obj.jsonPath,
            percent: '12'
        })
        console.log(rePKGPath + ' extract ' + obj.filePath + ' -o ' + obj.basePath + 'pkgOutput');
        exec(rePKGPath + ' extract ' + obj.filePath + ' -o ' + obj.basePath + 'pkgOutput', (
            err, stdout, stderr) => {
            if (err) {
                console.error(err);
            }
            if (stderr) {
                console.error(stderr);
            }
            console.log(`WW${stdout}`);
            that.state = false
            winSend('main', 'repkgPercent', {
                jsonPath: obj.jsonPath,
                percent: 'done'
            })
            if (that.list.length) {
                repkg('', ...that.list.shift())
            }
        });

    }


    /**
     * 解压PKGlist
     * @param {*} event 
     * @param {Array} list [obj] 块信息数组
     */
    repkgList(event, list) {
        let ls = list.map(obj => [obj])
        this.list.push(...ls)
        if (!this.state) {
            repkg('', ...this.list.shift())
        }
    }
}



const repkgData = new Repkg()
export {
    repkgData
}