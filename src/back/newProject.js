import {
    ipcMain,
    app
} from 'electron'
const appPath = app.getAppPath();
const fs = require('fs');
const path = require('path');
const {
    spawn,
} = require('child_process');
var bgPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'bg.jpg'
)
const iconv = require('iconv-lite');

let {
    winSend
} = require('./win')
import {
    throttle
} from './utils'

const throttlePercent = throttle((jsonPath, d) => {
    winSend('main', 'newPercent', {
        jsonPath: jsonPath,
        percent: d
    })
})
/**
 * 路径下所有文件的大小总和
 * @param {string} p 路径 
 * @returns {String} 
 */
function pathSize(p) {
    let size = 0

    function finder(p) {
        let files = fs.readdirSync(p);
        files.forEach((val) => {
            let fPath = path.join(p, val);
            let stats = fs.statSync(fPath);
            if (stats.isDirectory()) {
                finder(fPath)
            };
            if (stats.isFile()) {
                size += stats.size
            }
        });
    }
    finder(p);
    return (size / 1024 / 1024).toFixed(2)
}
const newData = {
    state: false,
    list: []
}
/**
 * 新建块
 * @param {*} event 
 * @param {Object} obj 新建的主要信息
 * @returns 
 */
const newProject = (event, obj) => {
    console.log('obj: ', obj);
    if (newData.state) {
        newData.list.push([obj])
        return false
    }
    newData.state = true;
    let dirKey = new Date().getTime().toFixed()
    let jsonPath = path.join(obj.savePath, dirKey, 'project.json')
    let toPath = path.join(obj.savePath, dirKey)
    let json = {
        type: obj.type,
        title: obj.title,
        tags: obj.tags,
        description: obj.description,
        "preview": "preview.jpg"
    }
    try {
        fs.mkdirSync(toPath, {
            recursive: true
        })
    } catch (error) {
        winSend('main', 'callMap', {
            [path.join(toPath, 'project.json')]: {
                allSize: "0.00",
                basePath: toPath,
                date: dirKey,
                file: path.basename(obj.filePath),
                filePath: json.file ? path.join(toPath, json.file) : path.join(toPath, 'project.json'),
                img: path.join(toPath, 'preview.jpg'),
                jsonPath: path.join(toPath, 'project.json'),
                openFolderPath: obj.savePath,
                size: "0.00",
                star: 0,
                title: obj.title,
                type: obj.type,
                tags: obj.tags || [],
                description: obj.description || '',
                waitKey: obj.waitKey
            }
        }, obj.savePath, obj.tags || [])
        winSend('main', 'copyPercent', {
            jsonPath: jsonPath,
            percent: 'error',
        })
        winSend('main', 'error', '系统找不到指定的保存路径。')
        newData.state = false
        if (newData.list.length) {
            newProject('', ...newData.list.shift())
        }
        return false
    }


    if (obj.type == 'video') {
        json.file = path.basename(obj.filePath)
    }
    fs.writeFileSync(jsonPath, JSON.stringify(json))
    fs.writeFileSync(path.join(obj.savePath, dirKey, 'preview.jpg'), fs.readFileSync(bgPath))
    const isMac = process.platform === 'darwin';
    winSend('main', 'newPercent', {
        jsonPath: jsonPath,
        percent: 0.01
    })
    if (isMac) {
        let params = ['--progress', '-av'];
        if (obj.type == 'video') {
            params.push(obj.filePath,toPath)
        } else {
            params.push(obj.dirPath + '/',toPath)
        }
        let ls = spawn('rsync', params)
        console.log('rsync ', params.join(' '));
        ls.stdout.on('data', (data) => {
            var str = iconv.decode(data, 'gbk');
            const match = str.match(/\d+%/);
            if (match) {
                throttlePercent(obj.jsonPath, match[0].split('%')[0])
            }
        });
        ls.stderr.on('data', (err) => {
            console.log('err: ', err);
        });
        ls.on('close', (code) => {
            console.log(`子进程退出: ${code}`);
            if (code >= 8) {
                winSend('main', 'copyPercent', {
                    jsonPath: jsonPath,
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
                        winSend('main', 'error', 'robocopy复制操作期间至少发生了一次失败。')
                        break;
                }
            } else {
                winSend('main', 'newPercent', {
                    jsonPath: jsonPath,
                    percent: ''
                })
            }

            let size = pathSize(toPath)
            winSend('main', 'callMap', {
                [path.join(toPath, 'project.json')]: {
                    allSize: size,
                    basePath: toPath,
                    date: dirKey,
                    file: path.basename(obj.filePath),
                    filePath: json.file ? path.join(toPath, json.file) : path.join(toPath, 'project.json'),
                    img: path.join(toPath, 'preview.jpg'),
                    jsonPath: path.join(toPath, 'project.json'),
                    openFolderPath: obj.savePath,
                    size: size,
                    star: 0,
                    title: obj.title,
                    type: obj.type,
                    tags: obj.tags || [],
                    description: obj.description || ''
                }
            }, obj.savePath, obj.tags || [])
            newData.state = false
            if (newData.list.length) {
                newProject('', ...newData.list.shift())
            }
        });
    } else {
        let from, to, params = ['/tee', '/r:0'];
        if (obj.type == 'video') {
            to = toPath
            from = path.dirname(obj.filePath)
            params.unshift(from, to, path.basename(obj.filePath))
        } else {
            to = path.join(toPath, path.basename(obj.dirPath))
            from = obj.dirPath
            params.unshift(from, to, '/e')
        }
        console.log(' params: ', params);
        let ls = spawn('robocopy', params)
        ls.stdout.on('data', (data) => {
            var str = iconv.decode(data, 'gbk');
            // console.log('str: ', str);
            // if (str.indexOf('磁盘空间不足。') != -1) {
            //     ls.kill()
            // } else {
            let d = str.split('%')[0]
            if (!isNaN(d)) {
                // console.log('d: ', d);
                // winSend('main', 'newPercent', {
                //     jsonPath: jsonPath,
                //     percent: d
                // })
                throttlePercent(jsonPath, d)
            }
            // }
        });
        ls.stderr.on('data', (err) => {
            console.log('err: ', err);
        });
        ls.on('close', (code) => {
            console.log(`子进程退出: ${code}`);

            // if (code == null) {
            //     winSend('main', 'newPercent', {
            //         jsonPath: jsonPath,
            //         percent: 'error',
            //     })
            //     winSend('main', 'error', '磁盘空间不足。')
            // } else
            if (code >= 8) {
                winSend('main', 'copyPercent', {
                    jsonPath: jsonPath,
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
                        winSend('main', 'error', 'robocopy复制操作期间至少发生了一次失败。')
                        break;
                }
            } else {
                winSend('main', 'newPercent', {
                    jsonPath: jsonPath,
                    percent: ''
                })
            }

            let size = pathSize(toPath)
            winSend('main', 'callMap', {
                [path.join(toPath, 'project.json')]: {
                    allSize: size,
                    basePath: toPath,
                    date: dirKey,
                    file: path.basename(obj.filePath),
                    filePath: json.file ? path.join(toPath, json.file) : path.join(toPath, 'project.json'),
                    img: path.join(toPath, 'preview.jpg'),
                    jsonPath: path.join(toPath, 'project.json'),
                    openFolderPath: obj.savePath,
                    size: size,
                    star: 0,
                    title: obj.title,
                    type: obj.type,
                    tags: obj.tags || [],
                    description: obj.description || ''
                }
            }, obj.savePath, obj.tags || [])
            newData.state = false
            if (newData.list.length) {
                newProject('', ...newData.list.shift())
            }
        });
    }

    winSend('main', 'callMap', {
        [path.join(toPath, 'project.json')]: {
            allSize: "0.00",
            basePath: toPath,
            date: dirKey,
            file: path.basename(obj.filePath),
            filePath: json.file ? path.join(toPath, json.file) : path.join(toPath, 'project.json'),
            img: path.join(toPath, 'preview.jpg'),
            jsonPath: path.join(toPath, 'project.json'),
            openFolderPath: obj.savePath,
            size: "0.00",
            star: 0,
            title: obj.title,
            type: obj.type,
            tags: obj.tags || [],
            description: obj.description || '',
            waitKey: obj.waitKey
        }
    }, obj.savePath, obj.tags || [])


}
ipcMain.on('newProject', newProject)
export {
    newData
}