<template>
    <div class="view">
        <myVideo ref="myVideo" :fobj="obj" :url="obj.filePath" :isplay="1" />
        <div class="title-list" :style="hideStyle">
            <span>{{ idx + 1 }}/{{ list.length }}</span>
            <ul>
                <li v-for="o in titleList" :class="o.jsonPath == obj.jsonPath ? 'active' : ''">{{ o.title }}</li>
            </ul>
        </div>
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
            idx: 0,
            hideStyle: {},
            titleList: []
        }
    },
    components: { myVideo },
    watch: {
        obj: {
            deep: true,
            immediate: true,
            handler() {
                this.hideStyle = ''
                this.titleList = this.list.slice(Math.max(this.idx - 3, 0), this.idx + 8)
                setTimeout(() => {
                    this.hideStyle = { animation: 'hide 5s forwards' }
                }, 1000);
            }
        }
    },
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
            if (e.keyCode === 39) {
                this.$refs.myVideo.forward()
            }
            if (e.keyCode === 37) {
                this.$refs.myVideo.forward(-60)
            }
            if (e.keyCode === 38) {
                if (this.list[this.idx - 1]) {
                    this.idx = this.idx - 1
                    this.obj = this.list[this.idx]
                    document.title = this.obj.title
                }
            }
            if (e.keyCode === 40) {
                if (this.list[this.idx + 1]) {
                    this.idx = this.idx + 1
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
.view {
    position: relative;

    .title-list {
        position: absolute;
        top: 10px;
        left: 10px;
        bottom: 30px;
        overflow: hidden;
        color: #fff;
        text-shadow: 2px 0 #333, -2px 0 #333, 0 2px #333, 0 -2px #333, 1.4px 1.4px #333, 1.4px -1.4px #333, -1.4px 1.4px #333, -1.4px -1.4px #333;

        li.active {
            text-shadow: 2px 0 red, -2px 0 red, 0 2px red, 0 -2px red, 1.4px 1.4px red, 1.4px -1.4px red, -1.4px 1.4px red, -1.4px -1.4px red;
        }
    }
}

.view /deep/ video {
    width: 100vw;
    height: 100vh !important;
    overflow: hidden;

}

.view /deep/ .video-js {
    padding-top: 100vh !important;
}
</style>
<style>
@keyframes hide {
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}
</style>