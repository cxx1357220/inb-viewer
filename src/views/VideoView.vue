<template>
    <div class="view" v-loading="cutStateMap[obj.filePath]" :element-loading-text="cutStateMap[obj.filePath]">
        <myVideo :fobj="obj" :url="obj.filePath" :isplay="0" />
    </div>
</template>

<script>
const ipcRenderer = require('electron').ipcRenderer;
import myVideo from '@/components/myVideo.vue';
export default {
    name: 'videoP',
    data() {
        return {
            obj: {},
            sustainType: ['mpeg4'],
            cutStateMap: {}
        }
    },
    components: { myVideo },
    created() {
        this.obj = this.$route.params;
        console.log('this.obj : ', this.obj );
        this.cutStateMap = JSON.parse(JSON.stringify(this.obj.cutStateMap))
        ipcRenderer.on('cutPercent', (e, obj) => {
            console.log('obj: ', obj);
            if (obj.percent == 'done') {
                this.$delete(this.cutStateMap,obj.filePath)
            } else {
                this.$set(this.cutStateMap,obj.filePath,obj.percent)
            }
        })
        ipcRenderer.on('refreshImg', (e, str) => {
            this.$message({
                message: 'refreshImg: ' + str
            });
        })
        ipcRenderer.on('codecName', (e, str) => {
            console.log('str: ', str);
            if (this.sustainType.indexOf(str) !== -1) {
                this.$notify({
                    title: '',
                    message: '大部分浏览器不支持' + str + '视频解码',
                    duration: 0
                });
            }
        })
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