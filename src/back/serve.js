import {
    ipcMain,
} from 'electron'
var os = require('os')
const shareJs = require('./share');
const express = require('express');
const { shareHtmlPath } = require('./config')
const {
    winSend
} = require('./win')
class ShareServer {
    constructor() {
        this.server = {
            close: () => { }
        };
        ipcMain.on('share', this.share.bind(this))
        ipcMain.on('reServeList', this.reServeList.bind(this))
    }
    /**
     * share服务
     * @param {*} event 
     * @param {boolean} boolean 是否开启
     * @param {Array} list share的列表
     * @param {object} map 对应的路径修改map
     */
    share(event, boolean, list, map) {
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
            shareJs.useArr(list, map)
            shareJs.use('/app', express.static(shareHtmlPath))
            that.server = shareJs.listen(port, () => {
                console.log(`${add}:${port}/app/#/`)
                winSend('main', 'shareUrl', `${add}:${port}/app/#/`)
            })
        } else {
            that.server.close()
        }
    }
    /**
     * 刷新share服务的数组
     * @param {*} event 
     * @param {Array} list share的列表
     * @param {object} map 对应的路径修改map
     */
    reServeList(event, list, map) {
        shareJs.useArr(list, map)
    }
}
new ShareServer()

