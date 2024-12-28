import {
    ipcMain,
} from 'electron'
const fs = require('fs');
let {
    winSend
} = require('./win')

/**
 * 改变json里的title,并且不变动文件的时间戳-不是很想合并到reDetail里
 * @param {*} event 
 * @param {Object} obj 块信息 
 */
const reTitle = (event, obj) => {
    console.log('obj: ', obj);
    try {
        let stats = fs.statSync(obj.jsonPath)
        fs.readFile(obj.jsonPath, 'utf8', (err, call) => {
            if (err) {
                return false
            }
            let data = JSON.parse(call)
            data.title = obj.newTitle
            fs.writeFile(obj.jsonPath, JSON.stringify(data), (err) => {
                if (err) {
                    return false
                }
                fs.utimes(
                    obj.jsonPath,
                    new Date(stats.atime),
                    new Date(stats.mtime),
                    function (err) {
                        winSend('main', 'newTitle', obj)
                    }
                );
            })
        })

    } catch (error) {
        console.log('error: ', error);
        winSend('main', 'error', '系统找不到指定的路径：' + obj.jsonPath)
        return 'error'
    }

}
ipcMain.on('reTitle', reTitle)


/**
 * 改变json里的内容,并且不变动文件的时间戳
 * @param {*} event 
 * @param {Object} obj 块信息 
 */
const reDetail = (event, obj) => {
    console.log('obj: ', obj);
    try {
        let stats = fs.statSync(obj.jsonPath)
        fs.readFile(obj.jsonPath, 'utf8', (err, call) => {
            if (err) {
                return false
            }
            let data = JSON.parse(call)
            data.title = obj.title
            data.tags = obj.tags
            data.description = obj.description

            data.videoCode = obj.videoCode
            data.videoTitle = obj.videoTitle
            data.videoTags = obj.videoTags
            data.videoBigImage = obj.videoBigImage
            data.videoMinImage = obj.videoMinImage
            data.videoActs = obj.videoActs
            data.videoPreviewImg = obj.videoPreviewImg
            
            fs.writeFile(obj.jsonPath, JSON.stringify(data), (err) => {
                if (err) {
                    return false
                }
                fs.utimes(
                    obj.jsonPath,
                    new Date(stats.atime),
                    new Date(stats.mtime),
                    function (err) {
                        winSend('main', 'reDetail', obj)
                    }
                );
            })
        })

    } catch (error) {
        console.log('error: ', error);
        winSend('main', 'error', '系统找不到指定的路径：' + obj.jsonPath)
        return 'error'
    }

}
ipcMain.on('reDetail', reDetail)
/**
 * 星级评级-不是很想合并到reDetail里
 * @param {*} event 
 * @param {Object} obj 块信息 
 */
const reStar = (event, obj) => {
    console.log('obj: ', obj);
    try {
        let stats = fs.statSync(obj.jsonPath)
        fs.readFile(obj.jsonPath, 'utf8', (err, call) => {
            if (err) {
                return false
            }
            let data = JSON.parse(call)
            data['inb-star'] = obj.star
            fs.writeFile(obj.jsonPath, JSON.stringify(data), (err) => {
                if (err) {
                    return false
                }
                fs.utimes(
                    obj.jsonPath,
                    new Date(stats.atime),
                    new Date(stats.mtime),
                    function (err) {
                        err&&(console.log('err: ', err));
                    }
                );
            })
        })
    } catch (error) {
        console.log('error: ', error);
        winSend('main', 'error', '系统找不到指定的路径：' + obj.jsonPath)
        return 'error'
    }
}
ipcMain.on('reStar', reStar)




/**
 * 更新阅读量
 * @param {Object} obj 块信息 
 */
const visits = (obj) => {
    console.log('obj: ', obj);
    try {
        let stats = fs.statSync(obj.jsonPath)
        fs.readFile(obj.jsonPath, 'utf8', (err, call) => {
            if (err) {
                return false
            }
            let data = JSON.parse(call)
            data['inb-visits'] ? data['inb-visits']++ : (data['inb-visits'] = 1)
            fs.writeFile(obj.jsonPath, JSON.stringify(data), (err) => {
                if (err) {
                    return false
                }
                fs.utimes(
                    obj.jsonPath,
                    new Date(stats.atime),
                    new Date(stats.mtime),
                    function (err) {
                        err&&(console.log('err: ', err));
                    }
                );
            })
        })

    } catch (error) {
        console.log('error: ', error);
        winSend('main', 'error', '系统找不到指定的路径：' + obj.jsonPath)
        return 'error'
    }

}
export {
    visits
}