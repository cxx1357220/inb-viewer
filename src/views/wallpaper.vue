<template>
    <div class="view">
        <video v-if="obj.type == 'video'" ref="video" :src="obj.filePath" loop />
        <iframe v-else :src="obj.filePath" frameborder="0"></iframe>
    </div>
</template>

<script>
export default {
    name: 'wallpaper',
    data() {
        return {
            obj: {},
        }
    },
    created() {
        this.obj = this.$route.params;
        console.log('this.obj: ', this.obj);
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
    width: 100vw;
    height: 100vh !important;
    overflow: hidden;

    video {
        width: 100vw;
        height: 100vh !important;
        overflow: hidden;
    }
    iframe{
        width: 100vw;
        height: 100vh !important;
    }
}
</style>