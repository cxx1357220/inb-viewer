import {
    app,
    ipcMain,
} from 'electron'
const path = require('path');
const {
    spawn,
    exec
} = require('child_process');
const kill = require('tree-kill');

const appPath = app.getAppPath();
var os = require('os')
var platform = os.platform()
if (platform == "darwin") {
    platform = "mac";
} else if (platform == "win32") {
    platform = "win";
}

var ocrPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ocr',
    'ocr.exe'
)
let {
    winSend
} = require('./win')
let serve;

const startOcr = () => {
    serve = exec(ocrPath)
    serve.stdout.on('data', (data) => {
        // console.log('data: ', data.toString());
    });
    serve.stderr.on('data', (err) => {
        // console.log('err: ', err);
    });
    serve.on('close', (code) => {
        console.log('close: ', code);
    });
    serve.on('exit', (code) => {
        console.log('exit: ', code);
    });
    console.log('ocrPath: ', ocrPath);
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

const closeOcr = () => {
    // serve.kill('SIGTERM');
    // serve.kill('SIGKILL')
    kill(serve.pid, 'SIGKILL', (err) => {
        if (err) {
            console.error('无法终止进程:', err);
        } else {
            console.log('进程已终止');
        }
    });
}


ipcMain.on('startOcr', startOcr)
ipcMain.on('closeOcr', closeOcr)