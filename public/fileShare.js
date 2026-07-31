const express = require('express')
const serveIndex = require('serve-index')
const md5 = require('md5');
const path = require('path')
const multiparty = require('multiparty');
const fs = require('fs')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');



const singleName = (basePath, newName, fileExt = '.md', i = 0) => {
    let name = newName + (i ? ('(' + i + ')' + fileExt) : fileExt)
    let s = path.join(basePath, name)
    console.log('s: ', s, i);
    if (fs.existsSync(s)) {
        return singleName(basePath, newName, fileExt, i + 1)

    } else {
        return {
            name,
            path: s
        }
    }

}

class FileShare {
    constructor() {
        this.app = express()
        this.codeMap = {}
        this.useKeyMap = {}
        this.fileList = []
        this.outList = []
        this.init()
    }
    init() {
        const app = this.app
        app.use(cookieParser());
        app.use(bodyParser.urlencoded({
            extended: false
        }))
        app.use(bodyParser.json())

        app.get('/api/list', (req, res) => {

            let pw = req.query.pw || req.cookies.pw
            console.log('/api/list req pw: ', req.query.pw, req.cookies.pw);


            if (pw == this.password) {
                res.cookie('pw', pw, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
                this.outList = this.fileList.map(obj => {
                    return {
                        webBasePath: obj.webBasePath,
                        webFilePath: obj.webFilePath,
                        webImgPath: obj.webImgPath,
                        size: obj.size,
                        star: obj.star,
                        tags: obj.tags,
                        title: obj.title,
                        type: obj.type,
                        videoDuration: obj.videoDuration,
                        visits: obj.visits,
                        allSize: obj.allSize,
                        date: obj.date,
                        description: obj.description,
                        file: obj.file,
                    }
                })
                res.send(this.outList)
            } else {
                res.destroy();
            }
        })
        app.post('/api/*', (req, res, next) => {
            console.log('req: ', req.cookies.pw);
            let pw = req.cookies.pw
            if (pw == this.password) {
                next()
            } else {
                res.destroy();
            }
        })

        app.post('/api/contentList', (req, res) => {
            let webBasePath = req.body.webBasePath
            console.log('webBasePath: ', webBasePath);
            let params = this.useKeyMap[webBasePath]
            let basePath = params.basePath
            let imgs = [],
                videos = [],
                audios = [],
                markdowns = [],
                haveHtml = '',
                imgExtList = ['.jpg', '.gif', '.png', '.jpeg'],
                videoExtList = ['.avi', '.wmv', '.mp4', '.mov', '.mpg', '.mkv', '.rmvb', '.ts', '.flv', '.webm'],
                audioExtList = ['.wav', '.mp3', '.ogg']
            const read = (p) => {
                let ls = fs.readdirSync(p) || []
                for (const o of ls) {
                    // console.log('o: ', o);
                    let nowDir = path.join(p, o)
                    var stat = fs.statSync(nowDir);
                    // console.log('stat: ', stat);
                    if (stat.isDirectory()) {
                        read(nowDir)
                    } else {
                        let ext = path.extname(o).toLowerCase()
                        let dir = (nowDir).replace(basePath, webBasePath)
                        dir = dir.split(path.sep).join('/')
                        if (imgExtList.indexOf(ext) != -1 && (nowDir) !== params.img) {
                            imgs.push(dir)
                        }
                        if (videoExtList.indexOf(ext) != -1) {
                            videos.push(dir)
                        }
                        if (audioExtList.indexOf(ext) != -1) {
                            audios.push(dir)
                        }
                        if (ext == '.md') {
                            let relativeDir = dir.replace(webBasePath, '')
                            markdowns.push(relativeDir)
                        }
                    }
                }
            }
            read(basePath)
            imgs = imgs.sort()
            videos = videos.sort()
            audios = audios.sort()
            markdowns = markdowns.sort()
            if (path.extname(params.filePath).toLowerCase() == '.html') {
                haveHtml = params.filePath.replace(basePath, webBasePath)
            }
            res.send({
                imgs,
                videos,
                audios,
                markdowns,
                haveHtml
            })
        })

        app.post('/api/changeStar', (req, res) => {
            let webBasePath = req.body.webBasePath
            console.log('webBasePath: ', webBasePath);
            let params = this.useKeyMap[webBasePath]
            console.log('req: ', req.body);
            this.changeListContent(params, 'star', params.star)
            let stats = fs.statSync(params.jsonPath)
            fs.readFile(params.jsonPath, 'utf-8', (err, call) => {
                if (err) {
                    return false
                }
                let data = JSON.parse(call)
                data['inb-star'] = params.star
                fs.writeFile(params.jsonPath, JSON.stringify(data), (err) => {
                    if (err) {
                        return false
                    }
                    fs.utimes(
                        params.jsonPath,
                        new Date(stats.atime),
                        new Date(stats.mtime),
                        function (err) {
                            err && (console.log('err: ', err));
                        }
                    );
                })
            })
            res.send({
                code: 200
            })
        })

        app.post('/api/visits', (req, res) => {
            let webBasePath = req.body.webBasePath
            console.log('webBasePath: ', webBasePath);
            let params = this.useKeyMap[webBasePath]
            this.changeListContent(params, 'visits')
            let stats = fs.statSync(params.jsonPath)
            fs.readFile(params.jsonPath, 'utf-8', (err, call) => {
                if (err) {
                    return false
                }
                let data = JSON.parse(call)
                data['inb-visits'] ? data['inb-visits']++ : (data['inb-visits'] = 1)
                fs.writeFile(params.jsonPath, JSON.stringify(data), (err) => {
                    if (err) {
                        return false
                    }
                    fs.utimes(
                        params.jsonPath,
                        new Date(stats.atime),
                        new Date(stats.mtime),
                        function (err) {
                            err && (console.log('err: ', err));
                        }
                    );
                })
            })
            res.send({
                code: 200
            })
        })

        app.post('/api/upload', (req, res) => {
            let webBasePath = decodeURIComponent(req.headers.webbasepath)
            let uploadDir = this.useKeyMap[webBasePath].basePath
            let childDir = decodeURIComponent(req.headers.childpath)
            childDir = childDir.split('/').join(path.sep)
            console.log('childDir: ', childDir);
            if (childDir) {
                let b = path.dirname(childDir)
                console.log('b: ', b);
                uploadDir = path.join(uploadDir, b)
                console.log('uploadDir: ', uploadDir);
            }
            var form = new multiparty.Form({
                uploadDir: uploadDir
            })
            form.parse(req, function (err, fields, files) {
                if (err) {
                    res.send({
                        err
                    })
                }
                console.log('fields, files: ', fields, files);
                if (files.file[0].originalFilename) {
                    let ext = path.extname(files.file[0].originalFilename)
                    let name = path.basename(files.file[0].originalFilename, ext)
                    let newName = singleName(uploadDir, name, ext).name
                    console.log('newName: ', newName);
                    fs.renameSync(files.file[0].path, path.join(uploadDir, newName))
                    res.send({
                        code: 200,
                        name: newName
                    })
                } else {
                    res.send({
                        err: 'no file name'
                    })
                }

            });

        })

        app.post('/api/changeMd', (req, res) => {
            let params = req.body
            console.log('req: ', req.body);
            let webBasePath = params.webBasePath
            let uploadDir = this.useKeyMap[webBasePath].basePath
            let relativeDir = params.file.split('/').join(path.sep)

            console.log('relativeDir: ', uploadDir, relativeDir);
            fs.writeFile(path.join(uploadDir, relativeDir), params.data, (err) => {
                if (err) {
                    return false
                }
            })
            res.send({
                code: 200
            })
        })
        app.post('/api/createMd', (req, res) => {
            let params = req.body
            console.log('params: ', params);
            let webBasePath = params.webBasePath
            let uploadDir = this.useKeyMap[webBasePath].basePath
            console.log('req: ', req.body);
            let name = params.name.split('/').join(path.sep)
            let obj = singleName(uploadDir, name, '.md')
            console.log('obj: ', obj);
            fs.writeFile(obj.path, '', (err) => {
                if (err) {
                    res.send({
                        code: err
                    })
                } else {
                    res.send({
                        code: 200,
                        name: obj.name
                    })
                }
            })

        })

        app.use('/file/*', (req, res, next) => {
            console.log('file req: ', req.baseUrl, req.cookies.pw);
            if (req.cookies.pw !== this.password) {
                return res.destroy();
            }
            if (this.codeMap[req.baseUrl.split('/')[2]] == 1) {
                next()
            } else {
                res.destroy();
                return
            }
        })






    }
    outFileList(fileList) {
        this.codeMap = {}
        this.fileList = fileList

        for (let index = 0; index < this.fileList.length; index++) {
            const obj = this.fileList[index];
            let code = md5(obj.basePath)
            // let code = path.basename(obj.basePath)

            this.codeMap[code] = 1
            let key = '/file/' + code
            obj.webBasePath = key
            obj.webFilePath = obj.filePath.replace(obj.basePath, key).split(path.sep).join('/')
            obj.webImgPath = obj.img.replace(obj.basePath, key).split(path.sep).join('/')
            if (!this.useKeyMap[key]) {
                this.useKeyMap[key] = obj
                this.app.use(key, serveIndex(obj.basePath, {
                    'icons': true
                }), express.static(obj.basePath))
            }






        }

    }

    start(password = '', fileList = [], fileShareHtmlPath, vditorPath, port = 3000) {
        const app = this.app
        this.password = password
        this.outFileList(fileList)

        app.use('/vditor', express.static(vditorPath))
        app.use('/app', (req, res, next) => {
            console.log('req: ', req.url);
            next()
            return
        }, express.static(fileShareHtmlPath))
        this.server = this.app.listen(port, () => {
            console.log('fileShare: ', port);
        })


    }
    stop() {
        this.server.close()
    }


    changeListContent = (obj, key = 'star', val) => {
        for (let index = 0; index < this.fileList.length; index++) {
            const element = this.fileList[index];
            if (element.jsonPath == obj.jsonPath) {
                switch (key) {
                    case 'star':
                        element[key] = val
                        break;
                    case 'visits':
                        element[key] = element[key] ? element[key] + 1 : 1
                        break;
                    default:
                        break;
                }
                break
            }

        }

        // winSend('main', 'changeBlockContent', obj, key, val)
        process.send({
            win: 'main',
            event: 'changeBlockContent',
            obj,
            key,
            val,
        })

    }

}
const fileShare = new FileShare()
process.on('message', (msg) => {
    switch (msg.type) {
        case 'start':
            fileShare.start(msg.password, msg.fileList, msg.htmlPath, msg.vditorPath, msg.port)
            break;
        case 'reServeList':
            fileShare.outFileList(msg.fileList)
            break;
        case 'stop':
            fileShare.stop()
            break;
        default:
            break;
    }
})