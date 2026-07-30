<template>
    <div class="view">
        <video v-if="obj.type == 'video'" ref="video" :src="'file://' + obj.filePath" loop />
        <iframe v-else :src="'file://' + obj.filePath" frameborder="0"></iframe>
    </div>
</template>

<script>
// const ipcRenderer = require('electron').ipcRenderer;
export default {
    name: 'wallpaper',
    data() {
        return {
            obj: {},
        }
    },
    created() {
        // document.addEventListener('keydown', function(event) {
        //     console.log('Key down:', event.key); // event.key 返回按键的值
        // });
        this.obj = this.$route.params;
        console.log('this.obj: ', this.obj);
        // ipcRenderer.on('listen', (event, arg) => {
        //     // console.log('arg: ', arg);
        //     let e = arg.event
        //     e.isTrusted = true
        //     Object.assign(e, {
        //         bubbles: true,
        //         cancelable: true,
        //         view: window,
        //     })
        //     let evt;
        //     switch (arg.type) {
        //         case "mousedown":
        //         case 'mouseup':
        //         case "mousemove":
        //         case "click":
        //             e.clientX = e.x
        //             e.clientY = e.y
        //             e.screenX = e.x
        //             e.screenY = e.y
        //             e.offsetX = e.x
        //             e.offsetY = e.y


        //             evt = new MouseEvent(arg.type, e)
        //             // console.log('e: ', JSON.stringify(e));
        //             break
        //         case "keydown":
        //         case "keyup":
        //             evt = new KeyboardEvent(arg.type, e)
        //             break
        //         case "wheel":
        //             evt = new WheelEvent(arg.type, e)
        //             break
        //     }
        //     evt && document.dispatchEvent(evt)


        // })

    },
    mounted() {
        this.obj.type == 'video' && this.$refs.video.play()
    },
    methods: {
    }

}
</script>
<style lang="less" scoped>
.view {
    background: #000;
    width: 100vw;
    height: 100vh !important;
    overflow: hidden;

    video {
        width: 100vw;
        height: 100vh !important;
        overflow: hidden;
    }
    iframe {
        width: 100vw;
        height: 100vh !important;
    }
}
</style>