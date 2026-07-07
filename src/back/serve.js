import {
    ipcMain,
} from 'electron'
var os = require('os')
const fileShareJs = require('./fileShare');
const express = require('express');
const { fileShareHtmlPath } = require('./config')
const {
    winSend
} = require('./win')
class ShareServer {
    constructor() {
        this.server = {
            close: () => { }
        };
        ipcMain.on('fileShare', this.fileShare.bind(this))
        ipcMain.on('reServeList', this.reServeList.bind(this))
    }
    /**
     * fileShare服务
     * @param {*} event 
     * @param {boolean} boolean 是否开启
     * @param {Array} list fileShare的列表
     * @param {object} map 对应的路径修改map
     */
    fileShare(event, boolean, list, map) {
        let that = this
        const port = 3000
        if (boolean) {
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
            fileShareJs.useArr(list, map)
            fileShareJs.use('/app', express.static(fileShareHtmlPath))
            that.server = fileShareJs.listen(port, () => {
                console.log(`${add}:${port}/app/#/`)
                winSend('main', 'fileShareUrl', `${add}:${port}/app/#/`)
            })
        } else {
            if (that.serve && that.serve.close) {
                that.serve.close()
            }
        }
    }
    /**
     * 刷新fileShare服务的数组
     * @param {*} event 
     * @param {Array} list fileShare的列表
     * @param {object} map 对应的路径修改map
     */
    reServeList(event, list, map) {
        fileShareJs.useArr(list, map)
    }
}
new ShareServer()

