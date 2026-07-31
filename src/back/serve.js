import {
    ipcMain,
    app
} from 'electron'
var os = require('os')
const {
    fork,
} = require('child_process');
const kill = require('tree-kill');

const { fileShareHtmlPath, vditorPath, fileSharePath } = require('./config')
const {
    winSend
} = require('./win')
const { randomKey, findFreePort } = require('./utils')
class ShareServer {
    constructor() {
        this.server = {
            close: () => { }
        };
        this.forked = null
        ipcMain.on('fileShare', this.fileShare.bind(this))
        ipcMain.on('reServeList', this.reServeList.bind(this))
        let that = this
        app.on('before-quit', (event, commandLine, workingDirectory) => {
            console.log('before-quit');
            that.close()
        })
    }
    /**
     * fileShare服务
     * @param {*} event 
     * @param {boolean} boolean 是否开启
     * @param {Array} list fileShare的列表
     */
    async fileShare(event, boolean, list) {
        let that = this
        if (that.forked) {
            // that.forked.kill('SIGKILL')
            kill(that.forked.pid, 'SIGKILL')
            that.forked = null
        }
        if (boolean) {
            let port = 3000
            port = await findFreePort(port)
            if(typeof port !== 'number'){
                winSend('main', 'error', '无可用端口')
                winSend('main', 'fileShareUrl', ``)
                return
            }

            const pw = randomKey(2)
            // const pw = 'aa'
            let ifaces = os.networkInterfaces()
            let add = ''
            for (let dev in ifaces) {
                let iface = ifaces[dev]
                for (let i = 0; i < iface.length; i++) {
                    let {
                        family,
                        address,
                        internal
                    } = iface[i]
                    if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
                        add = address
                    }
                }
            }
            console.log('net: ', add);
            that.forked = fork(fileSharePath)
            that.forked.on('error', (err) => {
                console.log('error: ', err);
            })
            that.forked.on('exit', (code, signal) => {
                console.log('exit: ', code, signal);
            })
            
            that.forked.send({
                type: 'start',
                fileList: list,
                password: pw,
                htmlPath: fileShareHtmlPath,
                vditorPath: vditorPath,
                port: port,

            })
            that.forked.on('message', (msg) => {
                winSend(msg.win, msg.event, msg.obj, msg.key, msg.val)
            })
            winSend('main', 'fileShareUrl', `${add}:${port}/app/#/?pw=${pw}`)
            
        }
    }
    /**
     * 刷新fileShare服务的数组
     * @param {*} event 
     * @param {Array} list fileShare的列表
     * @param {object} map 对应的路径修改map
     */
    reServeList(event, list, map) {
        // fileShareJs.useArr(list, map)
        if (this.forked) {
            this.forked.send({
                type: 'reServeList',
                fileList: list,
            })
        }
    }
    close() {
        if (this.forked) {
            // this.forked.kill('SIGKILL')
            kill(this.forked.pid, 'SIGKILL')
            this.forked = null
        }
    }
}
new ShareServer()

