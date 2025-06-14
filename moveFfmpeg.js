const path = require('path');
const fs = require('fs');
const os = require('os');
let sourcePath = path.resolve(__dirname, 'node_modules/ffmpeg-static/'),
    destinationPath = path.resolve(__dirname, 'public/ffmpeg'),
    fileName = 'ffmpeg';
if (os.platform() === 'win32') {
    fileName = 'ffmpeg.exe'
}
fs.rename(path.join(sourcePath, fileName), path.join(destinationPath, fileName), (err) => {
    if (err) return console.error(err);
    console.log('FFmpeg moved successfully to public/ffmpeg');
});
