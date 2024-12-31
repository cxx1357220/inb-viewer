<template>
    <div class="view">
        <el-input @change="changeMapPath" size="mini" v-if="modelZ" v-model="mapPath" autocomplete="off"></el-input>
        <el-container>
            <el-aside style="width: 50vw;">
                <el-image :src="bigImage" id="bigImage" :zoom-rate="1.2" :max-scale="7" :min-scale="0.2"
                    :preview-src-list="[minImage]" fit="cover" />
                <el-button size="mini" @click="save" round>save</el-button>
                <el-button size="mini" @click="savePoster" round>poster</el-button>
            </el-aside>
            <el-main>
                <el-form>
                    <el-form-item label="title:">
                        {{ title }}
                    </el-form-item>
                    <el-form-item label="code:">
                        {{ code }}
                    </el-form-item>
                    <el-form-item label="acts:">
                        <!-- <span v-for="s in acts">{{ s }}</span> -->
                        <el-tag v-for="s in acts">{{ s }}</el-tag>
                    </el-form-item>
                    <el-form-item label="tags:">
                        <el-tag v-for="s in tags">{{ s }}</el-tag>
                    </el-form-item>
                </el-form>
                <el-button size="mini" @click="saveDetail" round>save</el-button>
            </el-main>
        </el-container>

        <footer>
            <el-image v-for="url, i in previewImg" style="width: 100px; height: 100px" :src="url" :zoom-rate="1.2"
                :max-scale="7" :min-scale="0.2" :preview-src-list="previewImg" :initial-index="i" fit="cover" />
        </footer>

    </div>
</template>

<script>
import getDetailD from '../tools/getDetail';
import getDetailZ from '../tools/getDetailZ';
const fs = require('fs');
const ipcRenderer = require('electron').ipcRenderer;

export default {
    name: 'outdesc',
    data() {
        return {
            obj: {},
            code: '',
            title: '',
            tags: [],
            bigImage: '',
            minImage: '',
            acts: [],
            previewImg: [],
            modelZ: false,
            mapPath: ''


        }
    },
    created() {
        this.modelZ = localStorage.getItem('modelZ')
        this.mapPath = localStorage.getItem('mapPath')
        let getDetail = getDetailD
        if (localStorage.getItem('modelZ')&&localStorage.getItem('mapPath')) {
            getDetail = getDetailZ
        } 
        this.obj = this.$route.params;
        getDetail(this.obj, true).then(res => {
            this.code = res.videoCode
            this.title = res.videoTitle
            this.tags = res.videoTags
            this.bigImage = res.videoBigImage
            this.minImage = res.videoMinImage
            this.acts = res.videoActs
            this.previewImg = res.videoPreviewImg
        }).catch((error) => console.error(error));


    },
    mounted() {
    },
    methods: {
        changeMapPath(s) {
            localStorage.setItem('mapPath', s)
        },
        save() {
            let that = this
            let image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
            image.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                var context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, image.width, image.height);
                var url = canvas.toDataURL('image/jpeg');
                let base = new Buffer.from(url.replace(/^data:image\/\w+;base64,/, ''), "base64")
                const souceUrl = that.obj.basePath
                fs.writeFile(souceUrl + that.code + '.jpeg', base, (err) => {
                    if (err) {
                        console.log('err:', err);
                    }
                    ipcRenderer.send('openPath', that.obj.jsonPath)
                })
            }
            image.src = document.getElementById("bigImage").src;
        },
        savePoster() {
            let that = this
            let image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
            image.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                var context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, image.width, image.height);
                var dataURL = canvas.toDataURL('image/jpeg');
                ipcRenderer.send('setPoster', that.obj, dataURL)
            }
            image.src = this.minImage;
        },
        saveDetail() {
            let detail = Object.assign({}, this.obj, {
                videoCode: this.code,
                videoTitle: this.title,
                videoTags: this.tags,
                videoBigImage: this.bigImage,
                videoMinImage: this.minImage,
                videoActs: this.acts,
                videoPreviewImg: this.previewImg
            })
            ipcRenderer.send('reDetail', detail)
        },
    }
}
</script>
<style lang="less" scoped>
.view {
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    overflow-x: hidden;

    .el-aside {
        flex-direction: column;



    }

    .el-aside,
    .el-main {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        position: relative;

        &>button {
            opacity: 0.3;
            position: absolute;
            right: 10px;
            top: 10px;

            &:hover {
                opacity: 1;
            }
        }

        &>button+button {
            right: 80px;
            top: 10px;
        }
    }

    .el-main {
        align-items: flex-start;
    }

    .el-form-item {
        margin-bottom: 0;

    }

    footer {
        padding: 10px;
    }
}
</style>