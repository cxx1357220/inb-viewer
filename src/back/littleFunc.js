import {
    ipcMain,
    shell,
    dialog,
    desktopCapturer
} from 'electron'
const fs = require('fs');
const path = require('path');
let {
    winSend,
    winMap
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
            winSend('main', 'error', '系统找不到指定的路径：' + s)
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
        if (err) {
            fs.chmod(obj.basePath, 0o775, (err) => {
                if (err) {
                    console.log('chmod err: ', err);
                } else {
                    fs.rmdir(obj.basePath, {
                        recursive: true
                    }, (err) => {
                        if (err) {
                            console.log('rmdir err: ', err);
                            setTimeout(() => {
                                fs.rmdir(obj.basePath, {
                                    recursive: true
                                }, (err) => {
                                    if (err) {
                                        console.log('timeout rmdir err: ', err);

                                    } else {
                                        winSend('main', 'rmPath', obj)
                                    }
                                })
                            }, 5000);
                        } else {
                            winSend('main', 'rmPath', obj)
                        }
                    })
                };

            })
        } else {
            winSend('main', 'rmPath', obj)
        }

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
    let time = new Date().getTime()
    for (const key in fileMap) {
        let base = path.dirname(key)
        try {
            fs.renameSync(path.join(base , "list.json"), path.join(base , "list-old-" + time + ".json"));
        } catch (error) {
            console.log('error: ', error);
        }

        fs.writeFileSync(path.join(base , "list.json"), JSON.stringify(fileMap[key]))
        openPath({}, path.join(base , "list.json"))
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
 * @param {object} opt 设置按钮的信息（key）
 */
const setPath = async (event, opt) => {
    return await dialog.showOpenDialog(opt)
}
ipcMain.handle('setPath', setPath)


/**
 * 获取可分享屏幕list
 * @param {*} event 
 */
const getScreen = async (event) => {
    return await desktopCapturer.getSources({
        types: ['window', 'screen'], thumbnailSize: {
            height: 600,
            width: 600
        }, fetchWindowIcons: true
    })
}
ipcMain.handle('getScreen', getScreen)