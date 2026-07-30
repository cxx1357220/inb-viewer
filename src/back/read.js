import {
    ipcMain,
    dialog,
} from 'electron'
const {
    fork
} = require('child_process');
const kill = require('tree-kill');
let {
    winSend
} = require('./win')
const {
    readPath
} = require('./config')
/**
 * (main)读取文件数组
 * @param {*} event 
 * @param {string} folderPath 读取的路径
 * @returns 
 */
const readDirJson = (event, folderPath) => {
    const forked = fork(readPath);
    forked.on('message', function (obj) {
        console.log('obj: ', obj);
        winSend('main', 'callMap', JSON.stringify( obj.map), obj.dirPath, obj.tags)
        // forked.kill()
        kill(forked.pid)
        obj = {}
    })
    forked.on('close', function (code) {
        console.log('子进程已退出，退出码close ' + code);
    });
    forked.on('exit', function (code) {
        console.log('子进程已关闭，退出码exit ' + code);
        if (code == 9999) {
            winSend('main', 'callMap', '', '', [])
            winSend('main', 'error', '9999')
        }
    });
    if (folderPath) {
        forked.send(folderPath)
    } else {
        dialog.showOpenDialog({
                properties: ['openDirectory'],
            })
            .then(files => {
                console.log('files: ', files);
                if (files.filePaths[0]) {
                    forked.send(files.filePaths[0])
                } else {
                    winSend('main', 'callMap', '', '', [])
                    // forked.kill()
                    kill(forked.pid)
                }
            }).catch(err => {
                console.log(err)
                winSend('main', 'callMap', '', '', [])
                // forked.kill()
                kill(forked.pid)
            });
    }
}
ipcMain.on('readDirJson', readDirJson)