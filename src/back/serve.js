import {
    ipcMain,
} from 'electron'
var os = require('os')
let shareJs = require('./share');
const express = require('express');
let {
   winSend
} = require('./win')
let server = {
    close: () => {}
};
/**
 * share服务
 * @param {*} event 
 * @param {boolean} boolean 是否开启
 * @param {Array} list share的列表
 * @param {object} map 对应的路径修改map
 */
const share = (event, boolean, list, map) => {
    // console.log('list: ', list);
    // console.log('boolean: ', boolean);
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
        shareJs.use('/app', express.static('./shareHtml'))
        server = shareJs.listen(port, () => {
            console.log(`${add}:${port}/app/#/`)
            winSend('main','shareUrl', `${add}:${port}/app/#/`)
        })
    } else {
        server.close()
    }
}
/**
 * 刷新share服务的数组
 * @param {*} event 
 * @param {Array} list share的列表
 * @param {object} map 对应的路径修改map
 */
const reServeList = (event, list, map) => {
    shareJs.useArr(list, map)
}
ipcMain.on('share', share)
ipcMain.on('reServeList', reServeList)