<template>
    <div class="video" @touchstart="touchstart"
            @touchmove="touchmove" 
            @touchend="touchend">
        <video ref="videoPlay" :src="obj.newPath" class="video-js " controls  >
            <track kind="subtitles" default label="vtt" :src="obj.vtt" />
        </video>
    </div>
</template>

<script>
import videojs from "video.js";
import 'video.js/dist/video-js.css'
import 'video.js/dist/video-js.min.css'
export default {
    name: 'videoP',
    data() {
        return {
            obj: {},
            startPos: {},
            rate: 1,
            player:{}

        }
    },
    created() {
        console.log(this.$route.query.id);
        this.obj = JSON.parse(sessionStorage.getItem(this.$route.query.id) || "{}")
        console.log('this.obj : ', this.obj);
        let l = this.obj.newPath.split('.')
        l.pop()
        this.obj.vtt = l.join('.') + '.vtt'
    },
    mounted() {
        this.player = videojs(this.$refs.videoPlay, {
            controls: true,
            sources: [
                {
                    src: this.obj.newPath.replace('#', '%23'),
                }
            ],
            autoplay: false,
            fluid: true, // 自适应宽高
            language: 'zh-CN', // 设置语言
            muted: false, // 是否静音
            inactivityTimeout: false,
            playbackRates: [0.5, 1, 1.5, 2, 3, 5],
            bigPlayButton: true,
            controlBar: {
                fullscreenToggle: true,
                volumePanel: {
                    inline: false,
                },
            },

        }, function () {
            this.play()
        })
    },
    methods: {
        touchstart(event) {
            // event.preventDefault();//阻止其他事件
            var touch = event.targetTouches[0];     //touches数组对象获得屏幕上所有的touch，取第一个touch
            this.rate = this.player.duration() / window.screen.width
            console.log('this.rate: ', this.rate,this.$refs.videoPlay.duration,window.screen.width,this.player.duration());
            this.startPos = { x: touch.pageX, y: touch.pageY };    //取第一个touch的坐标值
        },
        touchmove(event) {
            if (event.targetTouches.length > 1 || event.scale && event.scale !== 1) return;
            var touch = event.targetTouches[0];
            let endPos = { x: touch.pageX - this.startPos.x, y: touch.pageY - this.startPos.y };
            this.startPos = { x: touch.pageX, y: touch.pageY };
            console.log('this.endPos: ', endPos);
            let isScrolling = Math.abs(endPos.x) < Math.abs(endPos.y) ? 1 : 0;    //isScrolling为1时，表示纵向滑动，0为横向滑动
            if (isScrolling === 0) {
                event.preventDefault();      //阻止触摸事件的默认行为，即阻止滚屏
                this.player.currentTime(this.player.currentTime() + endPos.x * this.rate)
            }
        },
        touchend(event) {
            console.log('touchend: ');
            // event.preventDefault();//阻止其他事件
        },
    }

}
</script>
<style lang="less" scoped>
.video {
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: center;

    & /deep/ .video-js {
        // padding-top: 100vh !important;
        padding-top: 100dvh !important;
    }
}

video {
    width: 100vw;
    height: 100vh !important;
    height: 100dvh !important;
    overflow: hidden;
}
</style>