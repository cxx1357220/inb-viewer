const express = require('express')
const bodyParser = require('body-parser')
const expressWs = require('express-ws');


process.send(process.version)


class WinShare {
    constructor() {
        this.app = express()
        this.password = ''
        this.init()

    }
    init() {
        const app = this.app
        this.wsInstance = expressWs(app)
        app.use(bodyParser.urlencoded({
            txtended: false
        }))
        app.use(bodyParser.json())

        console.log("WebSocket server is listening on port .")
        // https://www.npmjs.com/package/node-turn turn 服务
        let father = '',
            childMap = {}
        let that = this
        const parseParam = (url) => {
            console.log('url: ', url);
            let p = {}
            url.split('?')[1].split('&').forEach(e => {
                let a = e.split('=')
                p[a[0]] = a[1]
            });
            return p
        }
        app.ws('/', function (ws, req) {
            let p = parseParam(req.url)
            console.log('p: ', p.user);
            if (p.user == 'father') {
                if (father !== '') {
                    return false
                }
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
                    childMap[data.key].send(JSON.stringify(data))
                });
                ws.on('close', function incoming(message) {
                    console.log('all-out', message.toString());
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

                console.log('p.pw: ', p.pw, p);
                console.log('this.pw: ', that.password);
                if (that.password !== p.pw) {
                    req.destroy()
                    return false
                }
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
    }



    start(password = '', port = 3333, watchHtmlPath) {
        console.log('watchHtmlPath: ', watchHtmlPath);
        process.send(watchHtmlPath)

        this.password = password
        this.app.use('/app', express.static(watchHtmlPath))
        this.server = this.app.listen(port, () => {
            console.log('winShare: ', port);
            process.send('start')
        })
    }
    async close() {
        this.server.close()
        const wss = this.wsInstance.getWss()
        for (const ws of wss.clients) {

            if(ws.readyState === ws.OPEN){
                ws.terminate()
            }

        }
        // await new Promise((resolve,reject) => {
        //     console.log(123)
        //     this.server.close(e=>e?reject(e) :resolve)
        // })
        console.log('winShare close');

    }

}
const winShare = new WinShare()
process.on('message', (msg) => {
    console.log('msg: ', msg);
    if(msg.type === 'start'){
        winShare.start(msg.password, msg.port, msg.watchHtmlPath)
    }

})
process.on('SIGTERM', function () {
    winShare.close()
})
