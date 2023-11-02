// const { BrowserWindow, desktopCapturer } = require('electron')
// 利用NodeMediaServer推流rtmp
const http = require('http')
const fs = require('fs')
const stream = require('stream');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');



const NodeMediaServer = require('node-media-server');

const config = {
    rtmp: {
        port: 1935,
        chunk_size: 1000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*'
    }
};

var nms = new NodeMediaServer(config)

import {
    app
} from 'electron'
const appPath = app.getAppPath();

var ffmpegPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ffmpeg',
    'ffmpeg.exe'
)
ffmpeg.setFfmpegPath(ffmpegPath);

function outStream() {
    nms.run();

    let instance = ffmpeg()
        .input('desktop') // 输入设备的名称，下面是windows独有的dshow功能。如果是mac或者linux平台，只需要输入/dev/video*之类的地址
        .inputOption('-f', 'gdigrab')
        // .videoCodec('copy') // 直接将视频输出的流保存下来
        .addOptions(['-vcodec libx264', '-preset ultrafast'])
        .format('flv')
        .output('rtmp://localhost:1935/live/STREAM_NAME', {
            end: true
        })
        .on('start', function (commandLine) {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('progress', function (progress) {
            //程序进行时的回调
            console.log('time: ' + progress.timemark);
        })
        .on('error', function (err) {
            //ffmpeg出错时的回调
            console.log('An error occurred: ' + err);
        })
        .on('end', function () {
            //ffmpeg收到停止信号并安全退出时的回调
            console.log('Processing finished !');
        })
        nms.on('preConnect',(a)=>{
            console.log(a);
        })
        setTimeout(() => {
            instance.run()

        }, 5000);
}

export {
    outStream
}