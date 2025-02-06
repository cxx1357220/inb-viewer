<template>
    <div class="view">
        <myVideo :fobj="obj" :url="obj.filePath" :isplay="1" />
    </div>
</template>

<script>
const ipcRenderer = require('electron').ipcRenderer;
import myVideo from '@/components/myVideo.vue';
const { shell } = require('electron');
const fs = require('fs');

export default {
    name: 'videoPre',
    data() {
        return {
            obj: {},
            sustainType: ['mpeg4'],
            list: [],
            idx: 0
        }
    },
    components: { myVideo },
    created() {
        let params = this.$route.params;
        console.log('this.obj : ', params);
        this.list = params.list
        this.obj = this.list[this.idx]
        console.log('this.obj: ', this.obj);
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.keyCode === 68) {
                console.log('Ctrl+D', this.idx);
                let obj = JSON.parse(JSON.stringify(this.obj))
                this.list.splice(this.idx, 1)
                if (this.list[this.idx]) {
                    this.obj = this.list[this.idx]
                    document.title = this.obj.title
                }
                ipcRenderer.send('rmPath', obj)



            }
            if (e.ctrlKey && e.keyCode === 39) {
                console.log('Ctrl+->', this.idx, this.obj.title);
                if (this.list[this.idx + 1]) {
                    this.idx = this.idx + 1
                    this.obj = this.list[this.idx]
                    document.title = this.obj.title
                }
            }
            if (e.ctrlKey && e.keyCode === 37) {
                console.log('Ctrl+<-', this.idx, this.obj.title);
                if (this.list[this.idx - 1]) {
                    this.idx = this.idx - 1
                    this.obj = this.list[this.idx]
                    document.title = this.obj.title
                }
            }
        });
    },
    mounted() {
    },
    methods: {
    }

}
</script>
<style lang="less" scoped>
.view /deep/ video {
    width: 100vw;
    height: 100vh !important;
    overflow: hidden;

}

.view /deep/ .video-js {
    padding-top: 100vh !important;
}
</style>