const fs = require('fs')
const path = require('path')
const platform = process.platform
const ffmpeg = require('fluent-ffmpeg')
import {
    app,
} from 'electron'
const appPath = app.getAppPath();

// 用于存储 生成的数据的目录，例如 作为 localStorage、cookies、磁盘缓存、下载的词典、网络 state、devtools 文件。
let newSessionDataPath = path.join(appPath,
    process.env.NODE_ENV == 'production' ? '..' : '',
    '..',
    '..',
    'viewer-sessionData');
if (platform === 'win32') {
    try {
        if (!fs.existsSync(newSessionDataPath)) {
            fs.mkdirSync(newSessionDataPath, { recursive: true });
        }
    } catch (err) {
        console.error('Failed to create directory:', newSessionDataPath, err);
    }
    app.setPath('sessionData', newSessionDataPath)
} else {
    newSessionDataPath = app.getPath('sessionData');
}



// 缓存图片
const imgCachePath = path.join(newSessionDataPath, 'imgCache');
fs.mkdirSync(imgCachePath, {
    recursive: true
});
// 缓存 getDetail js文件
const getJsCachePath = path.join(newSessionDataPath, 'getJsCache');
fs.mkdirSync(getJsCachePath, {
    recursive: true
});
// 最基础的 getDetail
const baseGetDetailPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'baseGetDetail.js'
)
// ffmpeg路径
const ffmpegPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ffmpeg',
    platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
)
// 存在ffmpeg
const hasFfmpeg = fs.existsSync(ffmpegPath)
fs.chmod(ffmpegPath, 0o775, (err) => {
    if (err) {
        hasFfmpeg = false
    }
})
ffmpeg.setFfmpegPath(ffmpegPath);

// mpv路径
const mpvPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'mpv',
    platform === 'win32' ? 'mpv.exe' : 'mpv'
)
// 存在mpv
const hasMpv = fs.existsSync(mpvPath)

// whisper-cpp模型路径
const whisperCppModelPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'whisper-cpp',
    'model'
)
// faster-whisper模型路径
const fasterWhisperModelPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'whisper',
    'model'
)
// 默认block图片路径
const bgPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'bg.jpg'
)

//  ocr路径
const ocrPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'ocr',
    platform == "win32" ? 'ocr.exe' : 'ocr'
);
fs.chmod(ocrPath, 0o775, (err) => { })
// 存在ocr
const hasOcr = fs.existsSync(ocrPath)

// 读取文件js的路径
const readPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'readJson.js'
)

// rePKG路径
const rePKGPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    platform == "win32" ? 'RePKG.exe' : 'RePKG'
)
fs.chmod(rePKGPath, 0o775, (err) => { })
// 存在rePKG
const hasRePKG = fs.existsSync(rePKGPath)

// 分享的html路径
const shareHtmlPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'shareHtml'
)

// 观看的html路径
const watchHtmlPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'watchHtml'
)

// whisper-cpp路径
const whisperCppPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'whisper-cpp',
    'main.exe'
)
fs.chmod(whisperCppPath, 0o775, (err) => { })
// 存在whisper-cpp
const hasWhisperCpp = fs.existsSync(whisperCppPath)

// faster-whisper路径
const fasterWhisperPath = path.join(
    appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '',
    'whisper',
    platform === 'win32' ? 'whisper.exe' : 'whisper'
)
fs.chmod(fasterWhisperPath, 0o775, (err) => { })
// 存在faster-whisper
const hasFasterWhisper = fs.existsSync(fasterWhisperPath)

// 图标路径
const iconPath = path.join(appPath,
    process.env.NODE_ENV !== 'production' ? '../public' : '', platform === 'win32' ? 'icon.ico' : 'icon.png')
// 图标路径
export {
    hasFfmpeg,
    ffmpeg,
    platform,
    hasMpv,
    mpvPath,
    whisperCppModelPath,
    fasterWhisperModelPath,
    bgPath,
    ocrPath,
    hasOcr,
    readPath,
    rePKGPath,
    hasRePKG,
    shareHtmlPath,
    watchHtmlPath,
    hasWhisperCpp,
    whisperCppPath,
    hasFasterWhisper,
    fasterWhisperPath,
    iconPath,
    imgCachePath,
    getJsCachePath,
    baseGetDetailPath
}