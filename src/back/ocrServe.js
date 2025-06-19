import {
    app,
    ipcMain,
} from 'electron'
const {
    exec
} = require('child_process');
const kill = require('tree-kill');
var os = require('os')

const {
    ocrPath,
    hasOcr
} = require('./config')



let {
    winSend
} = require('./win')

class OcrServe {
    constructor() {
        this.serve = null
        if (hasOcr) {
            ipcMain.on('startOcr', this.startOcr.bind(this))
            ipcMain.on('closeOcr', this.closeOcr.bind(this))
        }
        let that = this
        app.on('before-quit', (event, commandLine, workingDirectory) => {
            console.log('before-quit');
            that.closeOcr()
        })
    }
    /**
     * 启动OCR服务
     */
    startOcr() {
        this.serve = exec(ocrPath)
        this.serve.stdout.on('data', (data) => {
            console.log('data: ', data.toString());
        });
        this.serve.stderr.on('data', (err) => {
            console.log('err data: ', err);
        });
        this.serve.on('close', (code) => {
            console.log('close: ', code);
        });
        this.serve.on('exit', (code) => {
            console.log('exit: ', code);
        });

        let ifaces = os.networkInterfaces()
        let add = '',
            port = 5000
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
        winSend('main', 'ocrUrl', `${add}:${port}/`)
    }

    /**
     * 关闭OCR服务
     */
    closeOcr() {
        // serve.kill('SIGTERM');
        // serve.kill('SIGKILL')
        if (this.serve && this.serve.pid) {
            kill(this.serve.pid, 'SIGKILL', (err) => {
                if (err) {
                    console.error('无法终止进程:', err);
                } else {
                    console.log('进程已终止');
                    this.serve = null
                }
            });
        }

    }
}
new OcrServe()

