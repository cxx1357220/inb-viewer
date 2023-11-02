import {
    ipcMain,
} from 'electron'
var os = require('os')
const express = require('express');
const expressWs = require('express-ws');
const bodyParser = require('body-parser')
let {
    winSend
} = require('./win')
let app
/**
 * 打开watch，并返回网址，让前端rtc开始推流
 */
const startWs = () => {
    app = express();
    expressWs(app)
    app.use(bodyParser.urlencoded({
        txtended: false
    }))
    app.use(bodyParser.json())

    console.log("WebSocket server is listening on port .")
    // https://www.npmjs.com/package/node-turn turn 服务
    let father = '',
        childMap = {}
    const parseParam = (url) => {
        let p = {}
        url.replace('/?', '').split('&').forEach(e => {
            let a = e.split('=')
            p[a[0]] = a[1]
        });
        return p
    }
    app.use('/app', express.static('./watchHtml'))
    app.ws('/', function (ws, req) {
        let p = parseParam(req.url)
        console.log('p: ', p.user);
        if (p.user == 'father') {
            if (father !== '') {
                return false
            }
            // childMap = {}
            father = ws;
            for (const key in childMap) {
                father.send(JSON.stringify({
                    msgType: 'withMe',
                    key
                })) //连接我速度
            }
            ws.on('message', function incoming(message) {
                console.log('给孩子发消息', message.toString());
                let data = JSON.parse(message)
                // console.log('data: ', data);
                childMap[data.key].send(JSON.stringify(data))
            });
            ws.on('close', function incoming(message) {
                console.log('all-out', message.toString());
                // let data = JSON.parse(message)
                father = ''
                for (const key in childMap) {
                    childMap[key].send(JSON.stringify({
                        msgType: 'closeMe',
                        key
                    })) //关闭webrtc一个
                    // delete childMap[data.key] //算了，不删了，下次再来可以重连
                }
            });
        }
        if (p.user == 'child') {
            let key = new Date().getTime()
            childMap[key] = ws;
            if (father) {
                father.send(JSON.stringify({
                    msgType: 'withMe',
                    key
                })) //连接我速度
            }
            ws.on('message', function incoming(message) {
                console.log('给父亲反馈', message.toString());
                let data = JSON.parse(message)
                father && father.send(JSON.stringify(data))
            });
            ws.on('close', function incoming(message) {
                console.log('out', message.toString());
                delete childMap[key]
                father && father.send(JSON.stringify({
                    msgType: 'closeMe',
                    key
                })) //关闭webrtc一个
            });
        }
    });

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
    const port = 3333
    app.listen(port, () => {
        console.log(`${add}:${port}/app/`)
        winSend('main', 'watchUrl', `${add}:${port}/app/`)
    });
}
/**
 * 关闭watch
 */
const closeWs = () => {
    app.close()
}


ipcMain.on('startWs', startWs)
ipcMain.on('closeWs', closeWs)