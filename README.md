# demo

只支持window系统 64位

## Project setup

node -v
v16.17.1

```
npm install
```

help page

```
npm run mdToHtml
```

serve

```
npm run electron:serve
```

build

```
npm run electron:build
```

要是 process.env.FLUENTFFMPEG_COV 报错，狠心点直接把
module.exports = process.env.FLUENTFFMPEG_COV ? require('./lib-cov/fluent-ffmpeg') : require('./lib/fluent-ffmpeg');
这语句改了
<https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/573>

功能实现过程 
# 视频查看

# 排序，查找

# 类型分类

# 图片查看

# 视频压缩，说实话ffmpeg有点慢

# 视频设置封面preview

# 修改title，不改变json文件最后修改时间

# 数据统计

# 一刀两断视频

# 局域网服务

# 美化ui

# 解压PKG文件

# ~~（future） 集成 whisper， 这个python的东西搞成exe还真有难度~~

# ~~（future） 集成 deepspeech 可惜语言只有中英文~~

# 集成whisper.cpp

# upload

# 谷歌内核104版本以后支持h265解码,升级electron版本支持h265

# （future） 减少使用ipcMain.on，方法弄到web去，降低内存占用

# ~~qt封装ffplay加上gui ~~ 作为一个c小白，bug太多了，功能还没mpv强大，文件大小却跟mpv差不多，不能忍

# ~~引入vlc~~引入mpv播放器，支持更多视频格式

# 标签tags

# 注册表获取wallpaper命令行启动wallpaper

# 更改缓存路径到当前项目同级文件夹下，加入封面图片缓存

# 右下角托盘

# 帮助页
