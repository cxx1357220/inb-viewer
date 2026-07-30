# demo

只支持window系统 64位

## Project setup

node -v
v16.17.1

mac里实在装不了electron-as-wallpaper包，可以先把package.json里的 electron-as-wallpaper删了，再install完之后再加回来。
```bash
# export FFMPEG_BINARIES_URL=https://cdn.npmmirror.com/binaries/ffmpeg-static
# echo FFMPEG_BINARIES_URL=https://cdn.npmmirror.com/binaries/ffmpeg-static

npm install
# or
yarn install
```
move ffmpeg
```bash
node moveFfmpeg.js
```

help page

```
npm run mdToHtml
```

去
https://www.modelscope.cn/models/xiaowangge/sherpa-onnx-sense-voice-small/summary
下载 model_q8.onnx 和 tokens.txt 到
public/asrModel/sherpa-onnx-sense-voice-small 目录下


<!-- whisper 和 ocr需要从inb-whisper/inb-ocr项目编译好再move过来 -->



serve

```
npm run electron:serve
```


局域网内ocr的html调试可通过
```
npm run serve --workspace=ocr-html
```

局域网内文件分享的html调试可通过
```
npm run serve --workspace=file-share-html
```


build

```
npm run build --workspaces
npm run electron:build
```

> 这个build版本只支持python2.7，如果不是的话，可以创建一个环境，不会conda可以去学一下。。。
```bash
conda create --name py27 python=2.7
conda activate py27
```
> 要是 Error: Exit code: ENOENT. spawn /usr/bin/python ENOENT
看一下当前python路径
```bash
which python
```
指定路径 
```bash
export PYTHON_PATH=/Users/cxx/miniconda3/envs/py27/bin/python
```

> 要是 process.env.FLUENTFFMPEG_COV 报错，狠心点直接把
module.exports = process.env.FLUENTFFMPEG_COV ? require('./lib-cov/fluent-ffmpeg') : require('./lib/fluent-ffmpeg');
这语句改了
<https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/573>

### 功能实现过程 
- 视频查看

- 排序，查找

- 类型分类

- 图片查看

- 视频压缩，说实话ffmpeg有点慢

- 视频设置封面preview

- 修改title，不改变json文件最后修改时间

- 数据统计

- 一刀两断视频

- 局域网服务

- 美化ui

- 解压PKG文件

- ~~（future） 集成 whisper， 这个python的东西搞成exe还真有难度~~

- ~~（future） 集成 deepspeech 可惜语言只有中英文~~

- ~~集成whisper.cpp~~

- upload

- 谷歌内核104版本以后支持h265解码,升级electron版本支持h265

- （future） 减少使用ipcMain.on，方法弄到web去，降低内存占用

- ~~qt封装ffplay加上gui~~ 作为一个c小白，bug太多了，功能还没mpv强大，文件大小却跟mpv差不多，不能忍

- ~~引入vlc~~引入mpv播放器，支持更多视频格式

- 标签tags

- 注册表获取wallpaper命令行启动wallpaper

- 更改缓存路径到当前项目同级文件夹下，加入封面图片缓存

- 右下角托盘

- 帮助页

- 首页显示视频类型的时长

- ~~rtmp直播屏幕~~,ffmpeg rtmp desktop 不如webrtc延迟低

- webrtc分享屏幕

- electron-as-wallpaper

- ocr，paddle ocr

- ctrl+alt+a 截图

- 根据名字获取视频信息 

- 播放当前显示的视频，➡前进百分之10；⬅ 后退60s； ⬆ 上一个视频； ⬇ 下一个视频ctrl+d 删除；

- 尝试支持mac

- ~~faster-whisper替换掉whisper-cpp~~

- video类型可从网上下载srt/vtt，并可编辑

- 不再使用whisper，用sherpa-onnx-sense-voice-small



