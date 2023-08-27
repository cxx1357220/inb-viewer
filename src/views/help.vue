<template><div class="markdown-body"><h2>帮助文档</h2>
<h3>主页</h3>
<h4>选择文件</h4>
<blockquote>
<p>选择文件夹进行读取，wallpaper创意工坊文件夹路径一般为*\steam\steamapps\workshop\content\431960</p>
</blockquote>
<h4>清空</h4>
<blockquote>
<p>只清理缓存，不对读取的文件做操作</p>
</blockquote>
<h4>类型</h4>
<ul>
<li>视频</li>
<li>场景</li>
<li>应用程序（wallpaper里基本上都是病毒，实在不行用沙盒玩，虽然沙盒也有漏洞，但好过裸奔）</li>
<li>其他（网页以及未标注类型的，wallpaper里的网页引入的js也是很多莫名的代码，挖矿以及请求莫名其妙的节点，如果只要里边的图片和视频，先把里边的html，js，css文件删了）</li>
</ul>
<h4>排序</h4>
<ul>
<li>日期</li>
<li>评级</li>
<li>文件大小</li>
<li>标题</li>
<li>文件名</li>
<li>阅读量</li>
</ul>
<h4>过滤</h4>
<ul>
<li>tag标签</li>
<li>folder ‘读取文件’获取过的文件夹，可刷新和清理单个读取的文件夹</li>
</ul>
<h4>设置</h4>
<ul>
<li>需要复制去的路径（wallpaper会对本地的订阅他人的文件进行更改和删除，可以复制到别的地方）</li>
<li>用<a href="https://github.com/FFmpeg">ffmpeg</a>进行视频刚改的简单配置</li>
<li>用whisper.cpp对视频进行语音转文字的简单配置，<a href="https://github.com/ggerganov/whisper.cpp">whisper-cpp</a>虽然没有<a href="https://github.com/openai/whisper">whisper</a>好用，但不用考虑兼容性。。。用显卡倒是比cpu快，但考虑各种显卡的驱动。。。</li>
</ul>
<h4>功能</h4>
<ul>
<li>输出读取文件夹内的数据json到读取文件夹的同层路径</li>
<li>批量处理展示的视频</li>
<li>批量解压展示的场景，来源<a href="https://github.com/notscuffed/repkg">repkg</a></li>
<li>批量复制展示的内容到已选好的复制路径</li>
<li>批量删除展示的内容，密码665533，直接删除，不经过回收站</li>
<li>清除已经操作的状态</li>
<li>局域网内服务，局域网内创建一个网站，可在局域网内查看展示的内容，网站密码665533</li>
</ul>
<h4>搜索</h4>
<blockquote>
<p>只搜索title，file，desc的内容，会显示总数和总大小</p>
</blockquote>
<h4>新建项目</h4>
<blockquote>
<p>会有默认封面的一个项目，只有两种类型，video和other，filePath和dirPath分别为video和other需要保存的内容路径，savePath为新建项目需要保存到的路径</p>
</blockquote>
<h4>内容方块功能</h4>
<ul>
<li>点击图片打开内容详情页</li>
<li>资源管理器内打开文件夹</li>
<li>删除，确认后直接删除，不经过回收站</li>
<li>狗头评级</li>
<li>修改title，desc，tags</li>
<li>解压场景pkg</li>
<li>压缩视频，仅限video类型</li>
<li>制作字幕，仅限video类型</li>
<li>wallpaper内打开项目，只支持场景和视频类型</li>
<li>复制</li>
</ul>
<h3>内容详情页</h3>
<h4>视频</h4>
<blockquote>
<p>右下角设置按钮及不兼容格式时左上的按钮组</p>
</blockquote>
<ul>
<li>set poster 设置当前帧为主页预览图片</li>
<li>cut time 视频按照时间点切割成几段（ffmpeg并不能精准到秒切割视频），删掉所有时间点勾选libx264可修改视频格式</li>
<li>open path 在资源管理器内打开视频所在路径</li>
<li>in player 在<a href="https://github.com/mpv-player/mpv">mpv</a>播放器内打开视频（格式兼容比纯浏览器多）</li>
</ul>
<h4>图片</h4>
<blockquote>
<p>左上的按钮组</p>
</blockquote>
<ul>
<li>set poster 设置当前图片为主页预览图片</li>
<li>open path 在资源管理器内打开图片所在路径</li>
</ul>
</div></template><style scoped src="../assets/markdown.css"></style>            <style scoped >                .markdown-body {                    padding: 20px;                }            </style><script>const { shell } = require('electron');window.onload=()=>{    const links = document.querySelectorAll('a[href]');    console.log(links);    links.forEach(link => {        link.addEventListener('click', e => {            const url = link.getAttribute('href');            e.preventDefault();            shell.openExternal(url);        });    });}</script>