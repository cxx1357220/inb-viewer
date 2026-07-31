import {
    ipcMain,
} from 'electron'
var os = require('os')
const { randomKey, findFreePort } = require('./utils')
const { fork } = require('child_process')
const kill = require('tree-kill')
let {
    winSend
} = require('./win')
const {
    watchHtmlPath,
    winSharePath,
} = require('./config')
class WatchServer {
    constructor() {
        this.worker = null
        ipcMain.on('startWatchServe', this.startWs.bind(this))
        ipcMain.on('closeWatchServe', this.closeWs.bind(this))
    }
    /**
     * 打开watch，并返回网址，让前端rtc开始推流,
     * 不开这个服务挂这个ws服务也没啥意思
     */
    async startWs() {
        if (this.worker) {
            // this.worker.kill('SIGTERM')
            kill(this.worker.pid, 'SIGTERM')
            this.worker = null

        }



        this.pw = randomKey(3)

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
        let port = 3333
        port = await findFreePort(port)
        if(typeof port !== 'number'){
            winSend('main', 'error', '无可用端口')
            return
        }
        try {
            this.worker = fork(winSharePath)
            this.worker.on('error', (err) => {
                console.log('error: ', err);
            })
            this.worker.on('exit', (code, signal) => {
                console.log('exit: ', code, signal);
            })

            this.worker.on('message', (msg) => {
                console.log('msg: ', msg);
                if (msg === 'start') {
                    winSend('main', 'watchUrl', `${add}:${port}/app/?pw=${this.pw}`)
                }
            })
            this.worker.send({
                type: 'start',
                port,
                password: this.pw,
                watchHtmlPath
            })
        } catch (error) {
            console.log('error: ', error);
        }


    }
    /**
     * 关闭watch
     */
    closeWs() {
        console.log('closeWs');
        if (this.worker) {
            // this.worker.kill('SIGTERM')
            kill(this.worker.pid, 'SIGTERM')
            this.worker = null
        }
    }
}
new WatchServer()



