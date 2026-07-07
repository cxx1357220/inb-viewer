import {
    app,
    ipcMain,
} from 'electron'
var os = require('os')

const path = require('path')
const { fork } = require('child_process')
const {
    winSend
} = require('./win')
const express = require('express')
const multiparty = require('multiparty');
const fs = require('fs')
const bodyParser = require('body-parser')
const { SimpleOcrProcessor } = require('./ocr/index')
// build 成dmg后fork无法正常引入jimp等包
const { ocrHtmlPath, ocrModelPath } = require('./config');


const ocr = new SimpleOcrProcessor(ocrModelPath)


class OcrServe {
    constructor() {
        this.server = {
            close: () => { }
        };
        // this.session = null
        // this.ocrWorker = null
        // this.taskId = 0
        // this.pendingTasks = new Map()

        ipcMain.on('startOcr', this.startOcr.bind(this))
        ipcMain.on('closeOcr', this.closeOcr.bind(this))
        let that = this
        app.on('before-quit', (event, commandLine, workingDirectory) => {
            console.log('before-quit');
            that.closeOcr()
        })
    }
    // async recognizeWithWorker(imagePath) {
    //     this.taskId++
    //     const id = this.taskId
    //     return new Promise((resolve, reject) => {
    //         pendingTasks.set(id, { resolve, reject })
    //         this.ocrWorker.send({ taskId: id, imagePath })
    //     })
    // }
    /**
     * 启动OCR服务
     */
    async startOcr() {
        // build 成dmg后fork无法正常引入jimp等包
        // this.ocrWorker = fork(ocrServerPath,[],{
        //       execPath: process.execPath, // 👈 关键：使用当前 Electron 的 Node.js？
        // })
        // this.ocrWorker.on('message', (payload) => {
        //     const { taskId, success, data, error } = payload
        //     const task = pendingTasks.get(taskId)
        //     if (task) {
        //     pendingTasks.delete(taskId)
        //     if (success) task.resolve(data)
        //     else task.reject(new Error(error))
        //     }
        // })


        // const ocr = new SimpleOcrProcessor()
        // this.session = ocr
        // await ocr.initialize()



        const serve = express()

        serve.use(bodyParser.urlencoded({
            extended: false
        }))
        serve.use(bodyParser.json())
        // serve.use('/api/ocr', express.raw({ type: 'application/octet-stream' }))
        serve.post('/api/ocr', async (req, res) => {
            try {
                var form = new multiparty.Form({})
                form.parse(req);


                form.on('file', async (name, file) => {
                    console.log('文件', name, file);
                    // const forked = fork(ocrPath);
                    // forked.on('message', function (output) {
                    //     console.log('output: ', output);
                    //     const resValue = output.items.map(o => {
                    //         return {
                    //             value: o.text,
                    //             points: o.poly,
                    //             score: o.score
                    //         }
                    //     })

                    //     fs.unlink(file.path, (err) => {
                    //         if (err) throw err;
                    //         console.log('文件已被删除');
                    //     });
                    //     res.json({ res: resValue });
                    //     forked.kill()

                    // })
                    // forked.on('close', function (code) {
                    //     console.log('子进程已退出，退出码close ' + code);
                    // });
                    // forked.on('exit', function (code) {
                    //     console.log('子进程已关闭，退出码exit ' + code);
                    //     if (code) {
                    //         res.status(500).send('服务器内部错误');
                    //     }
                    // });
                    // forked.send({ filePath: file.path, ocrModelPath })
                    try {
                        const output = await ocr.predictSingle(file.path)
                        console.log('output: ', output);
                        const resValue = output.items.map(o => {
                            return {
                                value: o.text,
                                points: o.poly,
                                score: o.score
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



        let ifaces = os.networkInterfaces()
        let add = '',
            port = 5000
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
        serve.use('/', express.static(ocrHtmlPath))
        this.serve = serve.listen(port, () => {
            console.log(`${add}:${port}/#/`)
            winSend('main', 'ocrUrl', `${add}:${port}/#/`)
        })
    }

    /**
     * 关闭OCR服务
     */
    async closeOcr() {
        if (this.serve && this.serve.close) {
            this.serve.close()
        }
        
        // await this.session.dispose()
        // this.ocrWorker.kill()
    }
}
new OcrServe()


const getOcr = async (event, args) => {

    return new Promise(async (resolve, reject) => {
        try {
            const output = await ocr.predictSingle(args.filePath)
            console.log('output: ', output);
            const resValue = output.items.map(o => {
                return {
                    value: o.text,
                    points: o.poly,
                    score: o.score
                }
            })
            resolve({ res: resValue })
        } catch (error) {
            console.log('error: ', error);
            reject('ocr服务内部错误')
        }
        // const forked = fork(ocrPath, ['child'], {
        //     execPath: process.execPath,
        // });
        // forked.on('message', function (output) {
        //     console.log('output: ', output);
        //     const resValue = output.items.map(o => {
        //         return {
        //             value: o.text,
        //             points: o.poly,
        //             score: o.score
        //         }
        //     })
        //     resolve({ res: resValue })
        //     forked.kill()

        // })
        // forked.on('uncaughtException', (err) => {
        //     console.log('捕获到未捕获的异常:', err);
        // });
        // forked.on('error', (err) => {
        //     console.log('子进程发送错误:', err);
        // });
        // forked.on('close', function (code) {
        //     console.log('子进程已退出，退出码close ' + code);
        // });
        // forked.on('exit', function (code) {
        //     console.log('子进程已关闭，退出码exit ' + code);
        //     if (code) {
        //         reject('ocr服务内部错误')
        //     }
        // });
        // forked.send({ filePath: args.filePath, ocrModelPath })
    })

}
ipcMain.handle('getOcr', getOcr)


