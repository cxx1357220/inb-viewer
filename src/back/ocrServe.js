import {
    app,
    ipcMain,
} from 'electron'
var os = require('os')
const { fork } = require('child_process')
const md5 = require('md5')
const {
    winSend
} = require('./win')
const express = require('express')
const kill = require('tree-kill')
const multiparty = require('multiparty');
const fs = require('fs')
const bodyParser = require('body-parser')
const { ocrHtmlPath, ocrModelPath, tempPath, ocrServerPath } = require('./config');
const { randomKey, findFreePort } = require('./utils')
console.log('tempPath: ', tempPath);




class OcrServe {
    constructor() {
        this.server = {
            close: () => { }
        };
        this.express = null
        this.pw = ''
        this.ocrWorker = null
        this.pendingTasks = new Map()
        this.disposeTimeout = null

        ipcMain.on('startOcr', this.startOcr.bind(this))
        ipcMain.on('closeOcr', this.closeOcr.bind(this))
        let that = this
        app.on('before-quit', (event, commandLine, workingDirectory) => {
            console.log('before-quit');
            that.closeOcr()
            that.closeWorker()
        })
    }

    closeWorker(){
        console.log('closeWorker');
        if(this.ocrWorker){
            kill(this.ocrWorker.pid)
            this.ocrWorker = null
        }
    }
    async recognizeWithWorker(imagePath) {
        console.log('imagePath: ', imagePath);
        let that = this
        that.disposeTimeout&& clearTimeout(that.disposeTimeout)
        const id = md5(imagePath)
        if(this.ocrWorker==null){
            this.ocrWorker = fork(ocrServerPath)
            this.ocrWorker.on('exit', (code) => {
                console.log('ocrWorker exit: ', code);
                that.closeWorker()
            })
            this.ocrWorker.on('message', (callback) => { 
                that.disposeTimeout&& clearTimeout(that.disposeTimeout)
                that.disposeTimeout = setTimeout(()=>{
                    that.closeWorker()
                }, 1000 * 60 * 5)

                let id = md5(callback.imagePath)
                if (callback.res) {
                    that.pendingTasks.get(id).resolve(callback.res)
                } else {
                    that.pendingTasks.get(id).reject(new Error(callback))
                }

            })
        }
        return new Promise((resolve, reject) => {
            this.pendingTasks.set(id, { resolve, reject })
            this.ocrWorker.send({  imagePath , ocrModelPath  })
        })
    }
    /**
     * 启动OCR服务
     */
    async startOcr() {
        this.closeOcr()
        const that = this

        if (!this.express) {
            this.express = express()

            this.express.use(bodyParser.urlencoded({
                extended: false
            }))
            this.express.use(bodyParser.json())
            // this.express.use('/api/ocr', express.raw({ type: 'application/octet-stream' }))
            this.express.post('/api/ocr', async (req, res) => {
                console.log('req.body: ', req.body);
                let query = req.query
                if (query.pw !== this.pw) {
                    res.destroy();
                    return
                }
                try {
                    var form = new multiparty.Form({
                        uploadDir: tempPath
                    })
                    form.parse(req);


                    form.on('file', async (name, file) => {
                        console.log('文件', name, file);
                        
                        try {
                            const output = await that.recognizeWithWorker(file.path)
                            console.log('output: ', output);
                            const resValue = []
                            output.items.forEach(o => {
                                if (o.score > 0.8) {
                                    resValue.push({
                                        value: o.text,
                                        points: o.poly,
                                        score: o.score
                                    })
                                }
                            })

                            fs.unlink(file.path, (err) => {
                                if (err) throw err;
                                console.log('文件已被删除');
                            });
                            res.json({ res: resValue });
                        } catch (error) {
                            res.status(500).send('服务器内部错误');
                        }


                    });




                } catch (err) {
                    console.error(err);
                    res.status(500).json({ error: err.message });
                }

            })
            this.express.use('/', express.static(ocrHtmlPath))

        }



        this.pw = randomKey(3)
        // this.pw = 'aaa'

        let ifaces = os.networkInterfaces()
        let add = '',
            port = 5000
        port = await findFreePort(port)
        if(typeof port !== 'number'){
            winSend('main', 'error', '无可用端口')
            winSend('main', 'ocrUrl', ``)
            return
        }
        
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
        this.serve = this.express.listen(port, () => {
            console.log(`${add}:${port}/?pw=${this.pw}`)
            winSend('main', 'ocrUrl', `${add}:${port}/?pw=${this.pw}`)
        })
    }

    /**
     * 关闭OCR服务
     */
    async closeOcr() {
        console.log('closeOcr');
        if (this.serve && this.serve.close) {
            this.serve.close()
        }

        // await this.session.dispose()
        // this.ocrWorker.kill()
    }
}
const ocr = new OcrServe()


const getOcr = async (event, args) => {

    return new Promise(async (resolve, reject) => {
        try {
            const output = await ocr.recognizeWithWorker(args.filePath)
            console.log('output: ', output);
            const resValue = []
            output.items.forEach(o => {
                if (o.score > 0.8) {
                    resValue.push({
                        value: o.text,
                        points: o.poly,
                        score: o.score
                    })
                }
            })
            resolve({ res: resValue })
        } catch (error) {
            console.log('error: ', error);
            reject('ocr服务内部错误')
        }
    })

}
ipcMain.handle('getOcr', getOcr)


