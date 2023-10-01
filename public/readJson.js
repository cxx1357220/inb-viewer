const fs = require('fs');
// const tree = require('tree-node-cli');
const join = require('path').join;
const dirname = require('path').dirname;
let sizePathMap = {}
// let filesMap = {}
let list = []
/**
 * 读取文件夹
 * @param startPath  起始目录文件夹路径
 * @returns {Array}
 */
function findSync(startPath) {
    function finder(p) {
        let files = fs.readdirSync(p);
        files.forEach((val, index) => {
            let fPath = join(p, val);
            let stats = fs.statSync(fPath);
            if (stats.isDirectory()) {
                finder(fPath)
            };
            if (stats.isFile()) {
                // filesMap[p] = (filesMap[p] || 0) + 1
                // filesMap[fPath] = 1
                sizePathMap[p] = (sizePathMap[p] || 0) + (stats.size / 1024 / 1024)
                sizePathMap[fPath] = stats.size / 1024 / 1024
                if (val == 'project.json') {
                    list.push({
                        date: stats.mtimeMs,
                        name: val,
                        path: fPath,
                        basePath: p
                    });
                }
            }
        });
        let fp = dirname(p)
        sizePathMap[fp] = (sizePathMap[fp] || 0) + (sizePathMap[p] || 0)

        // filesMap[fp] = (filesMap[fp] || 0) + (filesMap[p] || 0)
    }
    finder(startPath);
}
process.on('message', function (dirPath) {
    console.log('dirPath: ', dirPath);
    try {
        findSync(dirPath)
        if (list.length == 0) {
            process.send({
                map: {},
                dirPath
            });
            return false
        }
        let callMap = {},
            tags = [];
        const read = (i) => {
            if (i >= list.length) {
                return
            }
            try {
                JSON.parse(fs.readFileSync(list[i].path, 'utf-8') || '{}')
            } catch (error) {
                console.log('list[i].path: ', list[i].path);
                console.log('error: ', error);
            }
            let data = JSON.parse(fs.readFileSync(list[i].path, 'utf-8') || '{}')
            let basePath = list[i].basePath + '\\'
            if (data.file == 'scene.json') {
                data.file = 'scene.pkg'
            }
            callMap[list[i].path] = {
                allSize: (sizePathMap[list[i].basePath] || 0).toFixed(2),
                // files:filesMap[list[i].basePath] || 0,
                jsonPath: list[i].path,
                basePath: basePath,
                title: data.title,
                file: data.file,
                filePath: basePath + (data.file || 'project.json'),
                size: (sizePathMap[basePath + (data.file || 'project.json')] || 0).toFixed(2),
                img: basePath + data.preview,
                star: data['inb-star'] || 0,
                visits: data['inb-visits'] || 0,
                videoDuration: data['inb-duration'] || 0,
                type: data.type ? data.type.toLowerCase() : '',
                openFolderPath: dirPath,
                date: list[i].date,
                tags: data.tags || [],
                description: data.description || ''
            }
            tags = tags.concat(data.tags || [])
            read(i + 1)
        }
        read(0)
        process.send({
            map: callMap,
            dirPath,
            tags
        });
    } catch (error) {
        console.log('error: ', error);
        process.exit(9999);
    }

})