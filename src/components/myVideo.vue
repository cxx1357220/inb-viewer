<template>
    <div class="view">
        <div :class="['video', isAudio && 'audio']">
            <video ref="videoPlay" :src="videoUrl" class="video-js" controls>
                <track kind="chapter" default label="vtt" v-vtt="url" />
            </video>
        </div>
        <div class="other" ref="banner" @mouseleave="showButton = false" @mouseenter="showButton = true">
            <i class="el-icon-setting"></i>
            <div class="banner" v-show="showButton">
                <p v-if="!isAudio" @click="setPoster">设置封面</p>
                <p @click="cutTime">剪切视频</p>
                <p v-if="obj.type=='video'" @click="getCutTime">获取拼接点</p>
                <p @click="openPath">打开路径</p>
                <p @click="inPlayer">mpv内打开</p>
            </div>
        </div>

        <div class="err-banner" v-show="isERR">
            <button @click="cutTime">剪切视频</button>
            <button @click="openPath">打开路径</button>
            <button @click="inPlayer">mpv内打开</button>
        </div>

        <el-dialog :title="'剪切: ' + obj.file" :visible.sync="showDialog">
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
import videojs from "video.js";
import 'video.js/dist/video-js.css'
import 'video.js/dist/video-js.min.css'
export default {
    name: 'videoP',
    data() {
        return {
            obj: {},
            isERR: false,
            checked: false,
            timeList: [],
            showDialog: false,
            player: {},
            sustainType: ['mpeg4'],
            showButton: false
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
                    el.src = o.dir + '/' + o.name + '.vtt'
                    // el.innerHTML = new Date(binding.value.date).toISOString().split('T')[0];
                } catch (error) {
                    console.log(binding.value);
                }
            },
            update(el, binding) {
                try {
                    let o = path.parse(binding.value)
                    el.src = o.dir + '/' + o.name + '.vtt'
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
                    src: this.videoUrl,
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
            videojs.registerComponent('myComponent', myComponent)
            that.player.getChild('controlBar').addChild('myComponent')
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
                this.player.exitFullscreen()
            } catch (error) {

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
        forward(s){
            s =s|| this.player.duration()/10;
            this.player.currentTime(this.player.currentTime()+s)
        },
    }

}
</script>
<style lang="less" scoped>
.view {
    position: relative;

    .other {

        .banner {
            // display: none;
            justify-content: right;
            align-items: initial;
            // opacity: 0.2;
            position: absolute;
            bottom: 30px;
            right: 0;
            z-index: 9999;
            flex-direction: column;
            background-color: rgba(43, 51, 63, .7);
            // &:hover {
            //     opacity: 1;
            // }

            p {
                display: block;
                cursor: pointer;
                color: white;
                text-align: center;
                padding: 0.2em 0.5em;
                line-height: 1.4em;
                font-size: 1.2em;
            }

            p:hover {
                background-color: rgb(115, 133, 159, 0.5);
                // color: black;
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