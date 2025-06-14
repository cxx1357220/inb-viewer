<template>
    <div class="view">
        <div :class="['video', isAudio && 'audio']">
            <video ref="videoPlay" :src="videoUrl" class="video-js" controls>
                <!-- <track kind="chapter" default label="vtt" v-vtt="url" /> -->
                <!-- <track v-for="o in srtList" :label="o.name" :src="o.path">
                </track> -->
            </video>
        </div>
        <div class="srt-edit" v-show="drawer">
            <div class="header">
                <span>{{ srtEditSrc.src }}</span>
                <i class="el-icon-close" @click="drawer = false"></i>
            </div>
            <srtEdit v-if="drawer" :srcObj="srtEditSrc" @upSrt="upSrt" @setTime="setTime" @delSrt="delSrt"></srtEdit>
        </div>
        <div class="other" ref="banner" @mouseleave="showButton = false" @mouseenter="showButton = true">
            <i class="el-icon-setting"></i>
            <div class="banner" v-show="showButton">
                <p v-if="!isAudio" @click="setPoster">设置封面</p>
                <p @click="cutTime">剪切视频</p>
                <p v-if="obj.type == 'video'" @click="getCutTime">获取拼接点</p>
                <p @click="openPath">打开路径</p>
                <p @click="inPlayer">mpv内打开</p>
            </div>
        </div>
        <div class="other" ref="srtBanner" v-show="obj.type.toLowerCase() == 'video'"
            @mouseleave="showSrtButton = false" @mouseenter="getSrt">
            <i class="el-icon-sugar"></i>
            <div class="banner banner-vvt" v-show="showSrtButton">
                <el-collapse v-model="activeNames">
                    <el-collapse-item title="本地字幕" name="0">
                        <p v-for="(o, i) in srtList" :class="o.active ? 'active' : ''">
                            <span @click="setSrt(o)"> {{ o.name }}</span>
                            <label>
                                <i @click="editSrt(o)" class="el-icon-edit-outline"></i>
                                <i @click="delSrt(o.path)" class="el-icon-delete"></i>
                            </label>
                        </p>
                        <label v-show="srtList.length == 0">暂无数据</label>
                        <div class="new-srt" @click='newSrt'>
                            <i class="el-icon-circle-plus-outline"></i>
                        </div>
                    </el-collapse-item>
                    <el-collapse-item title="在线字幕" name="1">
                        <p v-for="(o, i) in onlineSrtList" @click="downSrt(o, i)">
                            {{ o.name }}
                            <i
                                :class="[o.state == 3 ? 'el-icon-loading' : '', o.state == 1 ? 'el-icon-circle-check' : '', o.state == 3 ? 'el-icon-circle-close' : '']"></i>
                        </p>
                        <label v-show="onlineSrtList.length == 0">暂无数据</label>
                    </el-collapse-item>
                </el-collapse>
            </div>
        </div>

        <div class="err-banner" v-show="isERR">
            <button @click="cutTime">剪切视频</button>
            <button @click="openPath">打开路径</button>
            <button @click="inPlayer">mpv内打开</button>
        </div>

        <el-dialog :title="'剪切: ' + videoUrl" :visible.sync="showDialog">
            <div class="dialog">
                <div v-for="obj, i in timeList">
                    <el-input style="width: 100px;" size="mini" v-model="obj.v" autocomplete="off"></el-input>
                    <el-button size="mini" @click="delTime(i)">删除</el-button>
                </div>
                <el-button size="mini" @click="newTimeInput">添加</el-button>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-checkbox size="mini" v-model="checked" style="margin-right:30px">libx264</el-checkbox>
                <el-button size="mini" @click="showDialog = false">取消</el-button>
                <el-button size="mini" type="primary" @click="cut">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
const ipcRenderer = require('electron').ipcRenderer;
const path = require('path');
const fs = require('fs')
const request = require("request")
// const iconv = require('iconv-lite');
import srtEdit from '@/components/srtEdit.vue';
// import { parse, stringify } from 'subtitle'
import videojs from "video.js";
import 'video.js/dist/video-js.css'
import 'video.js/dist/video-js.min.css'
export default {
    name: 'videoP',
    components: { srtEdit },
    data() {
        return {
            obj: {},
            isERR: false,
            checked: false,
            timeList: [],
            showDialog: false,
            player: {},
            sustainType: ['mpeg4'],
            showButton: false,
            showSrtButton: false,
            srtList: [],
            onlineSrtList: [],
            activeNames: ['0','1'],
            drawer: false,
            srtEditSrc: ''
        }
    },
    props: ['fobj', 'videoList', 'url', 'idx', 'isplay', 'isAudio'],
    watch: {
        fobj: {
            deep: true,
            immediate: true,
            handler(n) {
                // console.log('n: ', n);
                Object.assign(this.obj, n)
                this.onlineSrtList.length = 0
                this.drawer = false
                this.getLocalSrt()
                // setTimeout(() => {
                //     this.player.currentTime(this.player.currentTime()+1200)
                //     setTimeout(() => {
                //         this.player.currentTime(this.player.currentTime()+1200)

                //     }, 2000);
                // }, 1000);
            }
        }
    },

    computed: {
        // 一个计算属性的 getter
        videoUrl() {
            // `this` 指向当前组件实例
            return this.url.replaceAll('#', '%23')
        }
    },
    directives: {
        vtt: {
            bind(el, binding) {
                try {
                    let o = path.parse(binding.value)
                    el.src = 'file://'+path.join(o.dir  , o.name + '.vtt')
                    console.log('el.src : ', el.src );
                    // el.innerHTML = new Date(binding.value.date).toISOString().split('T')[0];
                } catch (error) {
                    console.log(binding.value);
                }
            },
            update(el, binding) {
                try {
                    let o = path.parse(binding.value)
                    el.src = 'file://'+path.join(o.dir  , o.name + '.vtt')
                    console.log('el.src : ', el.src );
                } catch (error) {
                    console.log(binding.value);
                }
            },
        },
    },
    created() {

        ipcRenderer.on('ptsTime', (e, arr) => {
            console.log('arr: ', arr);
            this.timeList.push(...arr)
            this.showDialog = true
        })

    },
    mounted() {
        let that = this
        this.player = videojs(this.$refs.videoPlay, {
            controls: true,
            aspectRatio: '16:9',
            // audioOnlyMode:true,
            // audioPosterMode:true,
            // poster:that.obj.img.toString(),
            sources: [
                {
                    src: 'file://'+this.videoUrl,
                }
            ],
            preload: 'metadata',
            autoplay: that.isplay,
            fluid: true, // 自适应宽高
            // language: 'zh-CN', // 设置语言
            muted: false, // 是否静音
            inactivityTimeout: false,
            playbackRates: [0.5, 1, 1.5, 2, 3, 5],
            bigPlayButton: false,
            controlBar: {
                fullscreenToggle: !that.isAudio,
                subsCapsButton: false,
                volumePanel: {
                    inline: false,
                }
            },

        }, function (error) {
            console.log('error: ', error);
            if (that.isplay) {
                this.play()
            }
            var baseComponent = videojs.getComponent('Component')
            var myComponent = videojs.extend(baseComponent, {
                constructor: function (player, options) {
                    baseComponent.apply(this, arguments)
                    // this.on('mouseenter', () => { that.showButton = true })
                    // this.on('mouseleave', () => { that.showButton = false })
                },
                createEl: function () {
                    // var divObj = videojs.dom.createEl('i', {
                    //     // Prefixing classes of elements within a player with "vjs-"
                    //     // is a convention used in Video.js.
                    //     // 给元素加vjs-开头的样式名，是videojs内置样式约定俗成的做法
                    //     className: 'el-icon-setting',
                    // })
                    // return 
                    return that.$refs.banner
                },
                // clickIcon: function () {
                //     console.log('你点击了图片')
                // }
            })
            var srtComponent = videojs.extend(baseComponent, {
                constructor: function (player, options) {
                    baseComponent.apply(this, arguments)
                },
                createEl: function () {
                    return that.$refs.srtBanner
                }
            })
            videojs.registerComponent('srtComponent', srtComponent)
            videojs.registerComponent('myComponent', myComponent)
            that.player.getChild('controlBar').addChild('myComponent')
            that.player.getChild('controlBar').addChild('srtComponent')
            that.setSrt()
        })
        this.player.on('error', (err) => {
            console.log('err: ', err);
            this.isERR = true
        })
        this.$refs.videoPlay.addEventListener('canplay', e => {
            this.obj.width = e.target.videoWidth
            this.obj.height = e.target.videoHeight
            this.obj.duration = e.target.duration
        })
    },
    methods: {
        setTime(n) {
            this.player.currentTime(n / 1000)
        },
        newSrt() {
            let parse = path.parse(this.url)
            parse.ext = '.vtt'
            parse.base = ''
            parse.name += '_' + new Date().getTime()
            let url = path.format(parse)
            fs.writeFileSync(url, 'WEBVTT')
            this.srtList.push({
                name: path.parse(url).base,
                path: url,
            })
        },
        delSrt(s) {
            this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                fs.rmSync(s)
                for (let index = 0; index < this.srtList.length; index++) {
                    const element = this.srtList[index];
                    if (element.path == s) {
                        this.srtList.splice(index, 1)
                        break
                    }
                }
                var tracks = this.player.textTracks();
                for (let i = 0; i < tracks.length; i++) {
                    console.log('tracks[i]: ', tracks[i], path.parse(s));
                    if (tracks[i].mode == 'showing' && path.parse(s).base == tracks[i].label) {
                        tracks[i].mode = 'disabled';
                        break
                    }
                }
                this.drawer = false
            }).catch(() => {
            });

        },
        upSrt(s) {
            let isHave = false
            for (let i = 0; i < this.srtList.length; i++) {
                const element = this.srtList[i];
                if (element.path == s) {
                    this.setSrt(element)
                    isHave = true
                    break
                }
            }
            if (!isHave) {
                this.srtList.push({
                    name: path.parse(s).base,
                    path: s,
                });
            }
        },
        editSrt(o) {
            this.srtEditSrc = { src: o.path, from: this.url }
            this.drawer = true
        },
        setSrt(o) {
            let that = this
            if (!that.player?.textTracks) {
                return
            }
            if (!o) {
                for (let i = 0; i < this.srtList.length; i++) {
                    if (path.parse(this.srtList[i].path).ext == '.vtt') {
                        o = this.srtList[i]
                        break
                    }
                }
            }
            if (!o || path.parse(o.path).ext !== '.vtt') {
                return
            }
            var tracks = that.player.textTracks();
            console.log('tracks: ', tracks);
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = 'disabled';
            }
            // var track = that.player.addTextTrack('subtitles', o.path, 'China_No.1');
            // track.mode = 'showing'; // 设置为显示模式
            // fs.createReadStream(o.path)
            //     .pipe(parse())
            //     .on('data', node => {
            //         if (node.type == "cue") {
            //             track.addCue(new VTTCue(node.data.start / 1000, node.data.end / 1000, node.data.text));
            //         }
            //     }).on('end', function (err) {

            //     }).on('finish', () => console.log('parser has finished'))
            that.srtList.forEach((element, idx) => {
                if (element.path == o.path) {
                    that.$set(that.srtList[idx], 'active', true)
                } else {
                    that.$set(that.srtList[idx], 'active', false)
                }
            })
            const trackEl = that.player.addRemoteTextTrack({ src: 'file://' + o.path + '?time=' + new Date().getTime(), label: o.name }, false);
            trackEl.track.mode = 'showing';

        },
        downSrt(o, idx) {
            if (o.state == 1 || o.state == 2) {
                return
            }
            let that = this
            this.$set(this.onlineSrtList[idx], 'state', 2)
            // let name = path.parse(o.name).name + '_' + new Date().getTime() + '.vtt'
            let name = path.parse(o.name).base
            let pObj = path.parse(this.url), p = path.join(pObj.dir, name)
            request(o.url)
                // .pipe(iconv.decodeStream('gbk'))
                // .pipe(parse())
                // .pipe(stringify({ format: 'WebVTT' }))
                .pipe(fs.createWriteStream(p))
                .on('close', function (err) {
                    if (err) {
                        that.$set(that.onlineSrtList?.[idx], 'state', 3)
                        console.log(`下载失败: ${err}`);
                    } else {
                        that.onlineSrtList[idx].state = 1
                        that.$set(that.onlineSrtList?.[idx], 'state', 1)
                        console.log(`文件 ${o.name} 下载完毕`);
                        that.srtList.push({
                            name: name,
                            path: p
                        })
                        that.setSrt({
                            name: name,
                            path: p
                        })
                    }
                })
        },
        getLocalSrt() {
            this.srtList.length = 0
            if (this.player.textTracks) {
                let tracks = this.player.textTracks() || [];
                for (let i = 0; i < tracks.length; i++) {
                    tracks[i].mode = 'disabled';
                }
            }

            let pObj = path.parse(this.url)
            console.log('pObj: ', pObj);
            let files = fs.readdirSync(pObj.dir);
            files.forEach((val, index) => {
                let fPath = path.join(pObj.dir, val);
                let child = path.parse(fPath)
                if (['.vtt', '.srt'].includes(child.ext)) {
                    this.srtList.push({
                        name: val,
                        path: fPath,
                    })
                }
            })
            this.setSrt()
        },
        getSrt() {
            this.showSrtButton = true
            if (this.onlineSrtList.length) {
                return false
            }
            fetch('https://api-shoulei-ssl.xunlei.com/oracle/subtitle?name=' + this.obj.title)
                .then(response => response.json())
                .then(async res => {
                    console.log('res: ', res);
                    res?.data.forEach(o => {
                        if (['srt', 'vtt'].includes(o.ext)) {
                            this.onlineSrtList.push(o);
                        }
                    })

                }).catch(err => {
                    console.log('err: ', err);

                })
        },
        newTimeInput() {
            this.timeList.push({ v: '' })
        },
        delTime(i) {
            this.timeList.splice(i, 1)
        },
        setPoster() {
            console.log(this.obj);
            // console.log(this.player.children_,this.$refs.videoPlay.currentTime);
            // ipcRenderer.send('setPoster',this.obj,this.$refs.videoPlay.currentTime)
            this.$refs.videoPlay.setAttribute("crossOrigin", "anonymous");  //添加srossOrigin属性，解决跨域问题
            var canvas = document.createElement("canvas");
            canvas.width = this.obj.width;
            canvas.height = this.obj.height;
            canvas.getContext("2d").drawImage(this.$refs.videoPlay, 0, 0, canvas.width, canvas.height);//截
            var dataURL = canvas.toDataURL("image/png");  //将图片转成base64格式
            ipcRenderer.send('setPoster', this.obj, dataURL)
        },
        getCutTime() {
            ipcRenderer.send('getPtsTime', this.obj)

        },
        cutTime() {
            try {
                this.player.pause()
                // this.player.exitFullscreen()
            } catch (error) {
                console.log('error: ', error);
            }
            let time = this.player.currentTime()
            this.timeList.push({ v: Math.floor(time * 10) / 10 })
            this.showDialog = true
        },
        cut() {
            let l = this.timeList.filter(s => s.v).map(s => s.v)
            if (l.length) {
                this.showDialog = false
                // l = l.map(s => Math.floor(s.v))
                l = l.sort((a, b) => a - b)
                console.log('l: ', l);
                this.obj.currentTime = l.join(',')
                this.obj.filePath = this.url
                ipcRenderer.send('cutTime', this.obj, this.checked)
            } else {
                this.obj.currentTime = ''
                this.showDialog = false
                this.obj.filePath = this.url
                ipcRenderer.send('cutTime', this.obj, this.checked)
                // this.$message({
                //     type: 'warning',
                //     message: 'no set time'
                // });
            }
        },
        inPlayer() {
            let list = this.videoList ? this.videoList : [this.url]
            ipcRenderer.send('inPlayer', list, this.idx || 0)
        },
        openPath() {
            ipcRenderer.send('openPath', this.url)
        },
        forward(s) {
            s = s || this.player.duration() / 10;
            this.player.currentTime(this.player.currentTime() + s)
        },
    }

}
</script>
<style lang="less" scoped>
.view {
    position: relative;
    display: flex;
    flex-direction: row;

    .other {
        position: relative;

        .banner {
            // display: none;
            justify-content: right;
            align-items: initial;
            // opacity: 0.2;
            position: absolute;
            bottom: 30px;
            right: 0;
            width: max-content;
            max-width: 100vw;
            word-break: break-all;
            z-index: 999;
            flex-direction: column;
            background-color: rgba(43, 51, 63, .7);
            // &:hover {
            //     opacity: 1;
            // }

            p {
                display: flex;
                align-items: center;
                cursor: pointer;
                color: white;
                text-align: left;
                padding: 0.2em 0.5em;
                line-height: 1.4em;
                font-size: 1.2em;
                justify-content: space-between;
            }

            label {
                display: block;
                color: white;
                text-align: center;
            }

            p.active>span {
                color: #67C23A;
            }

            i {
                cursor: pointer;
                flex-shrink: 0;
            }

            i:hover {
                color: #409EFF;
            }

            p:hover {
                background-color: rgb(115, 133, 159, 0.5);
                // color: black;
            }

            .new-srt {
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 20px;
                padding: 2px 10px;
                border-radius: 10px;
                border: 1px solid #fff;
                color: #fff;
            }

            .new-srt:hover {
                border: 1px solid #409EFF;
                color: #409EFF;
            }
        }

        .banner-vvt {
            & /deep/ .el-collapse-item__wrap {
                background-color: unset;
                color: white;
            }

            & /deep/ .el-collapse-item__content {
                max-height: 50vh;
                overflow: auto;
            }

            & /deep/.el-collapse-item__header {
                background-color: unset;
                color: white;
                padding-left: 16px;
            }
        }


    }


    .srt-edit {
        display: flex;
        flex-direction: column;
        width: 30vw;
        min-width: 300px;
        height: 100vh;
        overflow: auto;

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            word-break: break-all;
            padding: 10px;

            i {
                cursor: pointer;
                padding-left: 20px;
            }
        }
    }
}

.err-banner {
    // display: none;
    justify-content: right;
    align-items: initial;
    opacity: 0.2;
    position: absolute;
    top: 0px;
    left: 0;
    z-index: 999;
    flex-direction: column;
    background-color: rgba(43, 51, 63, .7);
    cursor: pointer;

    &:hover {
        opacity: 1;
    }
}

.video {
    flex: 1;
    overflow: hidden;
    // width: 100vw;
    // height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;

    & /deep/ .video-js {

        // padding-top: 100vh !important;
        i {
            font-size: 16px;
            line-height: 30px;
            width: 40px;
            text-align: center;
            cursor: pointer;
        }
    }
}

video {
    // width: 100vw;
    // height: 100vh !important;
    overflow: hidden;
}

.audio /deep/ .vjs-text-track-cue {
    top: 0 !important;
    font: 24px sans-serif !important;

}

.audio /deep/.video-js {
    padding-top: 120px !important;
}


.dialog {
    max-height: 200px;
    overflow: auto;

    &>div {
        margin-bottom: 5px;
    }
}
</style>