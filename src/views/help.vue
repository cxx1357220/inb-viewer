<template><div class="markdown-body"><h2>帮助文档</h2>
<h3>主页</h3>
<h4>选取文件</h4>
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
<li>应用程序（wallpaper里基本上都是病毒，实在不行用沙盒，虽然沙盒也有漏洞，但好过裸奔）</li>
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
<li>视频时长，非视频类型默认为0</li>
</ul>
<h4>过滤</h4>
<ul>
<li>标签</li>
<li>‘选取文件’获取过的文件夹，可刷新和清理单个读取的文件夹</li>
</ul>
<h4>设置</h4>
<ul>
<li>
<p>需要复制去的路径（wallpaper会对本地的订阅他人的文件进行更改和删除，可以复制到别的地方）</p>
</li>
<li>
<p>设置获取更多信息时使用的脚本，可自己编写一新的脚本</p>
</li>
<li>
<p>用<a href="https://github.com/FFmpeg">ffmpeg</a>进行视频刚改的简单配置</p>
<blockquote>
<p>size为视频分辨率，vcodec为解码器，fps为帧率</p>
</blockquote>
</li>
<li>
<p>用whisper.cpp对视频进行语音转文字的简单配置，<a href="https://github.com/ggerganov/whisper.cpp">whisper-cpp</a>虽然没有<a href="https://github.com/openai/whisper">whisper</a>好用，但不用考虑兼容性。。。用显卡倒是比cpu快，但考虑各种显卡的驱动。。。</p>
<blockquote>
<p>慢的让人无语，模型越大质量越好也越慢;<br>
翻译几乎没用，ai模型没有想象中好用，当然也可以自己弄一个ai模型;<br>
ai模型下载地址有墙：<a href="https://huggingface.co/ggerganov/whisper.cpp">https://huggingface.co/ggerganov/whisper.cpp</a>;<br>
可以自己手动下载ai模型到应用文件夹(*\viewer\resources\app\whisper-cpp\model);</p>
<hr>
<p>其实能看到字幕的方式挺多的，手机上挺多这个功能的，window11微软提供实时字幕功能，下载个Potplayer播放器也有实时字幕功能，还带翻译。当然，这些都是边看边翻译的。</p>
</blockquote>
</li>
<li>
<p>wallpaper.exe 的路径，第一次进应用当路径为空时，会自动查询电脑注册表看有没有该路径并设置（很慢）。也可手动设置路径。</p>
</li>
</ul>
<h4>功能</h4>
<ul>
<li>输出读取文件夹内的数据json到读取文件夹的同层路径</li>
<li>批量处理展示的视频</li>
<li>批量解压展示的场景，来源<a href="https://github.com/notscuffed/repkg">repkg</a></li>
<li>批量复制展示的内容到已选好的复制路径</li>
<li>批量删除展示的内容，密码665533，直接删除，不经过回收站</li>
<li>获取展示的视频类型的时长</li>
<li>播放当前显示的视频，➡前进百分之10；⬅ 后退60s； ⬆ 上一个视频； ⬇ 下一个视频；ctrl+d 删除；</li>
<li>清除已经操作完成的状态</li>
<li>合并视频，ffmepg -filter_complex 实现视频concat，相同编码下不进行解码还是蛮快的。解码真太慢了，cpu还吃满</li>
<li>批量获取屏幕信息，默认根据标题从imbd获取视频相关信息，可自己编写js脚本</li>
<li>局域网内服务，局域网内创建一个网站，可在局域网内查看展示的内容，网站密码665533</li>
<li>局域网内ocr服务，局域网内创建一个网站，可在局域网内对图片进行ocr，ocr来源<a href="https://paddlepaddle.github.io/PaddleOCR/main/index.html">paddleocr</a></li>
<li>局域网内分享屏幕，局域网内创建一个网站，可查看电脑当前屏幕</li>
<li>ctrl+alt+a 截图</li>
</ul>
<h4>搜索</h4>
<blockquote>
<p>只搜索‘标题’、‘文件名’、‘描述’，‘视频类型’，‘主演’的内容，会显示总数和总大小</p>
</blockquote>
<h4>新建项目</h4>
<blockquote>
<p>会有默认封面的一个项目，只有两种类型，视频和其他，视频类型只需要一个视频文件路径，其他类型需要保存的文件夹路径</p>
</blockquote>
<h4>内容方块功能</h4>
<ul>
<li>点击图片打开内容详情页</li>
<li>资源管理器内打开文件夹</li>
<li>删除，确认后直接删除，不经过回收站</li>
<li>狗头评级</li>
<li>修改标题，描述，标签</li>
<li>获取更多信息，根据标题从imbd获取视频相关信息</li>
<li>解压场景pkg</li>
<li>压缩视频，仅限视频类型</li>
<li>制作字幕，仅限视频类型</li>
<li>wallpaper内打开项目，只支持场景和视频类型</li>
<li>复制</li>
</ul>
<h3>内容详情页</h3>
<h4>视频</h4>
<blockquote>
<p>右下角设置按钮及不兼容格式时左上的按钮组</p>
</blockquote>
<ul>
<li>设置当前帧为主页预览图片</li>
<li>视频按照时间点切割成几段（ffmpeg并不能精准到秒切割视频），删掉所有时间点勾选libx264可修改视频格式</li>
<li>在资源管理器内打开视频所在路径</li>
<li>在<a href="https://github.com/mpv-player/mpv">mpv</a>播放器内打开视频（格式兼容比纯浏览器多）</li>
</ul>
<h4>图片</h4>
<blockquote>
<p>左上的按钮组</p>
</blockquote>
<ul>
<li>开启ocr服务的时候，可对图片进行ocr</li>
<li>设置当前图片为主页预览图片</li>
<li>在资源管理器内打开图片所在路径</li>
</ul>
</div></template><style scoped src="../assets/markdown.css"></style>            <style scoped >                .markdown-body {                    padding: 20px;                }            </style><script>const { shell } = require('electron');window.onload=()=>{    const links = document.querySelectorAll('a[href]');    console.log(links);    links.forEach(link => {        link.addEventListener('click', e => {            const url = link.getAttribute('href');            e.preventDefault();            shell.openExternal(url);        });    });}</script>