import {
    ipcMain,
    shell,
    dialog,
} from 'electron'
const fs = require('fs');
const path = require('path');
let {
    winMap,
    winSend
} = require('./win')
/**
 * 文件管理器内打开文件夹
 * @param {*} event 
 * @param {string} s 路径
 */
const openPath = (event, s) => {
    console.log('s: ', s);
    fs.access(s, fs.constants.F_OK, (err) => {
        if (err) {
            console.log('file not exists', err)
            winSend('main', 'error', '系统找不到指定的路径：'+s)
            return false
        }
        shell.showItemInFolder(s)

    });
}
ipcMain.on('openPath', openPath)


/**
 * 删除文件夹
 * @param {*} event 
 * @param {object} obj 块信息
 */
const rmPath = (event, obj) => {
    // shell.trashItem(obj.basePath).then(obj => console.log(obj)).catch(err => {
    //     console.log('err: ', err);
    // })
    fs.rm(obj.basePath, {
        recursive: true
    }, (err) => {
        console.log('err: ', err);

    })
}
ipcMain.on('rmPath', rmPath)
/**
 * 输出文件数组成json文件-树莓派
 * @param {*} event 
 * @param {Array} list [obj] 块信息
 */
const outList = (event, list) => {
    let fileMap = {}
    list.forEach(obj => {
        if (!fileMap[obj.openFolderPath]) {
            fileMap[obj.openFolderPath] = []
        }
        fileMap[obj.openFolderPath].push(obj)
    });
    for (const key in fileMap) {
        let base = path.dirname(key)
        console.log('base: ', base);
        if (base[base.length - 1] == '\\') {
            base = base.slice(0, base.length - 1)
            console.log('base: ', base);
        }
        fs.writeFileSync(base + "\\list.json", JSON.stringify(fileMap[key]))
        openPath({},base + "\\list.json")
    }
}
ipcMain.on('outList', outList)

/**
 * 右侧打开tool
 * @param {*} event 
 */
const openTool = (event) => {
    winMap['main'].webContents.openDevTools({
        mode: 'right'
    })
}
ipcMain.on('openTool', openTool)



/**
 * 设置路径
 * @param {*} event 
 * @param {object} obj 设置按钮的信息（key）
 */
const setPath = (event, obj) => {
    console.log('obj: ', obj);
    let properties = obj.type == 'file' ? ['openFile'] : ['openDirectory']
    dialog.showOpenDialog({
            properties: properties
        })
        .then(files => {
            if (files) {
                winSend('main', 'setPath', {
                    key: obj.key,
                    path: files.filePaths[0]
                });
            }
        }).catch(err => {
            console.log(err)
        });
}
ipcMain.on('setPath', setPath)