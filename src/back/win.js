import {
    BrowserWindow,
    ipcMain,
    nativeImage,
    dialog,
    Tray,
    Menu,
    app
} from 'electron'
const config = require('./config');
const { createScreenshots } = require('./screenshots')
import {
    createProtocol
} from 'vue-cli-plugin-electron-builder/lib'
let tray = null // 在外面创建tray变量，防止被自动删除，导致图标自动消失


/**
 * 创建托盘图标
 */
const setTray = (screenshots) => {
    if (config.platform == 'win32') {
        tray = new Tray(config.iconPath)
    } else {
        let icon = nativeImage.createFromPath(config.iconPath)
        icon = icon.resize({ width: 16, height: 16, quality: 'best' })
        tray = new Tray(icon)
    }
    // 自定义托盘图标的内容菜单
    const contextMenu = Menu.buildFromTemplate([{
        label: '打开',
        click: function () {
            winMap['main'].show();
        }
    }, {
        label: '帮助',
        click: function () {
            createWindow('help')
        }
    }, {
        label: '截图',
        click: function () {
            screenshots.startCapture()
        }
    }, {
        label: '退出',
        click: function () {
            app.quit()
        }
    }])

    tray.setToolTip('viewer') // 设置鼠标指针在托盘图标上悬停时显示的文本
    tray.setContextMenu(contextMenu) // 设置图标的内容菜单
    // 点击托盘图标，显示主窗口
    tray.on("click", () => {
        try {
            winMap['main'].setSkipTaskbar(false)
        } catch (error) {
            console.log('error: ', error);

        }
    })
    tray.on('double-click', () => {
        // 双击托盘图标时执行的操作，例如显示主窗口
        if (winMap['main']) {
            winMap['main'].show();
            winMap['main'].focus();
        }
    });
}

app.whenReady().then(() => {
    let screenshots = createScreenshots()
    setTray(screenshots)
    if (config.platform == 'win32') {
        Menu.setApplicationMenu(null)
    } else {
        app.dock.setIcon(config.iconPath)
        const template = [
            {
                label: 'inb-viewer', // macOS自动显示应用名
                submenu: [{ role: 'quit' }]
            },
            { role: 'editMenu' }, // 修复复制粘贴的核心项
        ]

        // 设置应用菜单
        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    }
})

let winMap = {} //新窗口对象

/**
 * 给窗口发消息
 * @param {string} win 窗口map的id
 * @param {string} key 
 * @param  {...any} params 
 */
const winSend = (win, key, ...params) => {
    try {
        if (winMap[win]) {
            winMap[win].webContents.send(key, ...params)
        }
    } catch (error) {
        // console.log('error: ', error);
    }
}

const {
    getModelList
} = require('./model')
const {
    cutData,
    getData
} = require('./child')
const {
    compressData
} = require('./compress')
const {
    copyData
} = require('./copy')
const {
    repkgData
} = require('./repkg')
// const {
//     whisperData
// } = require('./whisper')

const {
    asrData
} = require('./asr')
const {
    newData
} = require('./newProject')
const {
    concatData
} = require('./concat')
const {
    visits
} = require('./re')


/**
 * 创建窗口
 * @param {string} winType 窗口类型
 * @param {object} obj 传的数据
 * @returns 
 */
async function createWindow(winType = 'main', obj = {}) {
    let winKey
    switch (winType) {
        case 'content':
            let r = visits(obj)
            if (r == 'error') {
                return false
            }
            winKey = obj.basePath
            obj.winKey = winKey
            break;
        case 'mdView':
            winKey = obj.path
            obj.winKey = winKey
            break;
        case 'codeView':
            winKey = 'codeView'
            obj.winKey = winKey
            break;
        case 'outDesc':
            winKey = obj.basePath + 'Desc'
            obj.winKey = winKey
            break;
        case 'videoList':
            winKey = 'videoList'
            obj.winKey = winKey
            break;
        default:
            winKey = winType
            break;
    }

    if (winMap[winKey]) {
        winMap[winKey].show()
        winMap[winKey].focus()
        return false
    }
    // Create the browser window.
    let win = new BrowserWindow({
        width: winType == 'main' ? 1000 : 800,
        height: winType == 'main' ? 750 : 600,
        title: (obj.title || winKey) + ' - viewer',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            requestedExecutionLevel: 'requireAdministrator' // 或者 'highestAvailable'
        }
    })


    //url.format hash,query去取local并没那么理想
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        // if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        await win.loadURL('app://./index.html')
    }
    win.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key.toLowerCase() === 'i') {
            console.log('Pressed Control+I')
            win.webContents.openDevTools({
                mode: 'right'
            })
            event.preventDefault()
        }
    })

    switch (winType) {
        case 'main':
            win.webContents.send('home')
            // getModelList()
            win.webContents.send('baseConfig', JSON.parse(JSON.stringify(config)))
            console.log('JSON.parse(JSON.stringify(config)): ', JSON.parse(JSON.stringify(config)));
            win.on('close', (e) => {
                e.preventDefault(); // 阻止退出程序
                win.setSkipTaskbar(true) // 取消任务栏显示
                win.hide(); // 隐藏主程序窗口
            })
            break;
        case 'help':
            win.webContents.send('help')
            win.on('close', (e) => {
                delete winMap[winKey]
            })
            break;
        case 'videoList':
            const videoPathMap = {}
            obj.list.forEach(o => {
                o.winKey = 'videoList'
                videoPathMap[o.filePath] = 1
            })
            let videoListCutStateMap = {}
            cutData.list.forEach(list => {
                if (videoPathMap[list[0].filePath]) {
                    videoListCutStateMap[list[0].filePath] = 'waiting'
                }
            })
            obj.cutStateMap = videoListCutStateMap
            win.webContents.send('videoList', obj)
            win.on('close', (e) => {
                delete winMap[winKey]
            })
            break;
        case 'outDesc':
            win.webContents.send('outDesc', obj)
            win.on('close', (e) => {
                delete winMap[winKey]
            })
            break;
        case 'mdView':
            win.webContents.send('mdView', obj)
            win.on('close', (e) => {
                delete winMap[winKey]
            })
            break;
        case 'codeView':
            win.webContents.send('codeView', obj)
            win.on('close', (e) => {
                delete winMap[winKey]
            })
            break;
        default:
            let cutStateMap = {}
            cutData.list.forEach(list => {
                if (winKey == list[0].basePath) {
                    cutStateMap[list[0].filePath] = 'waiting'
                }
            })
            obj.cutStateMap = cutStateMap
            win.webContents.send('blockVal', obj)

            win.on('close', (e) => {
                delete winMap[winKey]
            })

            break;
    }
    winMap[winKey] = win

}

/**
 * 新窗口打开文件(视频,图片)
 * @param {*} event 
 * @param {object} obj 块数据
 * @param {string} wintype 类型
 */
const open = (event, obj, type = 'content') => {
    createWindow(type, obj)
}
ipcMain.on('open', open)
app.on('before-quit', (e) => {
    if (asrData.state || repkgData.state || copyData.state || compressData.state || cutData.state || newData.state || getData.state || concatData.state) {
        let str = '任务'
        // whisperData.state && (str += ' 字幕解析 ')
        asrData.state && (str += ' 字幕解析 ')
        repkgData.state && (str += ' pkg解压 ')
        copyData.state && (str += ' 复制 ')
        compressData.state && (str += ' 视频压缩 ')
        cutData.state && (str += ' 视频剪切 ')
        newData.state && (str += ' 新建项目 ')
        getData.state && (str += ' 获取视频时长 ')
        concatData.state && (str += ' 合并视频 ')
        str += '正在进行中，是否终止'
        let a = dialog.showMessageBoxSync({
            title: "exit", //信息提示框标题
            message: str, //信息提示框内容
            buttons: ["是", "否"], //下方显示的按钮
            noLink: true, //win下的样式
            type: "warning", //图标类型
            cancelId: 1 //点击x号关闭返回值
        });
        if (a == 0) {
            app.exit()
        } else {
            e.preventDefault()
        }
    } else {
        app.exit()
    }
})

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.exit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 当运行第二个实例时,将会聚焦到main这个窗口
        try {
            winMap['main'].show();
            winMap['main'].setSkipTaskbar(false)
        } catch (error) {
            console.log('error: ', error);
        }
    })
}


export {
    winMap,
    winSend,
    createWindow
}