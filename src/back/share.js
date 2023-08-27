(function () {
    const express = require('express')
    const serveIndex = require('serve-index')
    const path = require('path')
    const multiparty = require('multiparty');
    const app = express()
    let map = {},
        list = []
    const fs = require('fs')
    const bodyParser = require('body-parser')
    app.use(bodyParser.urlencoded({
        txtended: false
    }))
    app.use(bodyParser.json())
    app.get('/api/list', async (req, res) => {
        res.send(list)
    })

    app.post('/api/contentList', async (req, res) => {
        let params = req.body
        let basePath = params.basePath
        let imgs = [],
            videos = [],
            audios = [],
            haveHtml = '',
            imgExtList = ['.jpg', '.gif', '.png', '.jpeg'],
            videoExtList = ['.avi', '.wmv', '.mp4', '.mov', '.mpg','.mkv','.rmvb','.ts','.flv','.webm'],
            audioExtList = ['.wav', '.mp3', '.ogg']
        const read = async (p) => {
            let ls = await fs.readdirSync(p) || []
            for (const o of ls) {
                // console.log('o: ', o);
                var stat = await fs.statSync(p + o);
                // console.log('stat: ', stat);
                if (stat.isDirectory()) {
                    await read(p + o + "\\")
                } else {
                    let ext = path.extname(o).toLowerCase()
                    if (imgExtList.indexOf(ext) != -1 && (p + o) !== params.img) {
                        imgs.push((p + o).replace(basePath, params.newBasePath))
                    }
                    if (videoExtList.indexOf(ext) != -1) {
                        videos.push((p + o).replace(basePath, params.newBasePath))
                    }
                    if (audioExtList.indexOf(ext) != -1) {
                        audios.push((p + o).replace(basePath, params.newBasePath))
                    }
                }
            }
        }
        await read(basePath)
        imgs = imgs.sort()
        videos = videos.sort()
        audios = audios.sort()
        if (path.extname(params.filePath).toLowerCase() == '.html') {
            haveHtml = params.filePath.replace(basePath, params.newBasePath)
        }
        res.send({
            imgs,
            videos,
            audios,
            haveHtml
        })
    })

    app.post('/api/changeStar', async (req, res) => {
        let params = req.body
        console.log('req: ', req.body);
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
                        console.log('err: ', err);
                    }
                );
            })
        })
        res.send({
            code: 200
        })
    })

    app.post('/api/visits', async (req, res) => {
        let params = req.body
        console.log('req: ', req.body);
        let stats = fs.statSync(params.jsonPath)
        fs.readFile(params.jsonPath, 'utf-8', (err, call) => {
            if (err) {
                return false
            }
            let data = JSON.parse(call)
            data['inb-visits'] ?data['inb-visits']++:(data['inb-visits']=1)
            fs.writeFile(params.jsonPath, JSON.stringify(data), (err) => {
                if (err) {
                    return false
                }
                fs.utimes(
                    params.jsonPath,
                    new Date(stats.atime),
                    new Date(stats.mtime),
                    function (err) {
                        console.log('err: ', err);
                    }
                );
            })
        })
        res.send({
            code: 200
        })
    })

    app.post('/api/upload', async (req, res) => {
        let uploadDir = decodeURIComponent(req.headers.basepath)
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
                fs.renameSync(files.file[0].path, path.join(uploadDir, files.file[0].originalFilename))
            }
            res.send({
                code: 200
            })
        });

    })



    app.useArr = (l, m) => {
        console.log('m: ', m);
        map = JSON.parse(JSON.stringify(m))
        list = JSON.parse(JSON.stringify(l))
        list.forEach(obj => {
            let key = '\\' + m[obj.openFolderPath]
            obj.newimg = obj.img.replace(obj.openFolderPath, key)
            obj.newPath = obj.filePath.replace(obj.openFolderPath, key)
            obj.newBasePath = obj.basePath.replace(obj.openFolderPath, key)
        })
        // console.log('list: ', list);
        for (const k in map) {
            app.use('/' + map[k], serveIndex(k, {
                'icons': true
            }), express.static(k))
        }

    }
    module.exports = app;
})()