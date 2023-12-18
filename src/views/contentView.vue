<template>
    <el-tabs v-model="activeName" type="border-card">
        <el-tab-pane label="media list" name="list">
            <div class="list">
                <!-- <img v-for=" s in imgs" v-lazy="s" alt=""> -->
                <div class="img" v-for=" s in imgs" :key="s">
                    <div class="banner">
                        <button @click="imgSetPoster(s)">设置封面</button>
                        <button @click="openPath(s)">打开路径</button>
                    </div>
                    <el-image :src="s" lazy :preview-src-list="imgs">
                    </el-image>
                </div>
                <div v-for="( s, i) in audios" :key="s" class="audio" v-loading="cutStateMap[s]"
                    :element-loading-text="cutStateMap[s]">
                    <!-- <audio controls :src="s">
                    </audio> -->
                    <myVideo :fobj="obj" :url="s" :idx="i" :videoList="audios" isAudio="1" />
                </div>
                <div v-for="( s, i) in videos" :key="s" class="video" v-loading="cutStateMap[s]"
                    :element-loading-text="cutStateMap[s]">
                    <myVideo :fobj="obj" :url="s" :idx="i" :videoList="videos" />
                </div>
                <el-empty v-if="!imgs.length && !audios.length && !videos.length" description="nothing"></el-empty>

            </div>
        </el-tab-pane>
        <el-tab-pane label="html" v-if="haveHtml" name="html">
            <iframe :src="obj.filePath" frameborder="0"></iframe>
        </el-tab-pane>

        <el-tab-pane label="markdown" name="md">
            <div class="md-list">
                <el-input placeholder="请输入文件名" v-model="newName">
                    <span slot="prepend">文件名:</span>
                    <el-button :loading="newLoading" @click="newMd" slot="append"
                        icon="el-icon-circle-plus-outline">新建</el-button>
                </el-input>

                <p v-for="o in mdList" :key="o.path">
                    <label @click="open(o)">
                        {{ o.name }}
                    </label>
                    <span>
                        <i @click="openPath(o.path)" class="el-icon-folder-opened"></i>
                        <i @click="delPath(o.path)" class="el-icon-delete"></i>
                    </span>
                </p>
            </div>
        </el-tab-pane>
    </el-tabs>
</template>

<script>
const ipcRenderer = require('electron').ipcRenderer;
const path = require('path');
const fs = require('fs');
import myVideo from '@/components/myVideo.vue';
export default {
    name: 'imgList',
    data() {
        return {
            activeName: 'list',
            haveHtml: false,
            obj: {},
            imgs: [],
            videos: [],
            audios: [],
            cutStateMap: {},
            mdList: [],
            newName: '',
            newLoading: false
        }
    },
    components: { myVideo },
    created() {
        console.log(this.$route.params);
        this.obj = this.$route.params;
        console.log('this.obj : ', this.obj);
        this.cutStateMap = JSON.parse(JSON.stringify(this.obj.cutStateMap))
        let basePath = this.obj.basePath
        let imgs = [],
            videos = [],
            audios = [],
            mdList = [],
            imgExtList = ['.jpg', '.gif', '.png', '.jpeg'],
            videoExtList = ['.avi', '.wmv', '.mp4', '.mov', '.mpg', '.mkv', '.rmvb', '.ts', '.flv', '.webm'],
            audioExtList = ['.wav', '.mp3', '.ogg'],
            mdExt = '.md'
        const read = (p) => {
            let ls = fs.readdirSync(p) || []
            for (const o of ls) {
                console.log('o: ', o);
                var stat = fs.statSync(p + o);
                if (stat.isDirectory()) {
                    read(p + o + "\\")
                } else {
                    let ext = path.extname(o).toLowerCase()
                    if (imgExtList.indexOf(ext) != -1 && (p + o) != this.obj.img.split('?rand=')[0]) {
                        imgs.push(p + o)
                    } else if (videoExtList.indexOf(ext) != -1) {
                        videos.push(p + o)
                    } else if (audioExtList.indexOf(ext) != -1) {
                        audios.push(p + o)
                        // videos.push(p + o)
                    } else if (mdExt == ext) {
                        mdList.push({ path: p + o, name: o })
                    }
                }
            }
        }
        read(basePath)
        this.imgs = imgs.sort()
        this.videos = videos.sort()
        this.audios = audios.sort()
        this.mdList = mdList
        // this.plays = [].concat(this.videos, this.audios)
        if (path.extname(this.obj.filePath).toLowerCase() == '.html') {
            this.haveHtml = true
        }
        ipcRenderer.on('cutPercent', (e, obj) => {
            console.log('obj: ', obj);
            if (obj.percent == 'done') {
                this.$delete(this.cutStateMap, obj.filePath)
            } else {
                this.$set(this.cutStateMap, obj.filePath, obj.percent)
            }
        })
        ipcRenderer.on('refreshImg', (e, str) => {
            this.$message({
                message: 'refreshImg: ' + str
            });
        })
    },
    mounted() {
    },
    methods: {
        imgSetPoster(s) {
            ipcRenderer.send('imgSetPoster', this.obj, s)
        },
        openPath(s) {
            ipcRenderer.send('openPath', s)
        },
        open(obj){
            ipcRenderer.send('open', obj, 'mdView')
        },
        delPath(s) {
            fs.unlink(s, (err) => {
                if (err) {
                    this.$message({
                        type: 'error',
                        message: err
                    });
                } else {
                    this.mdList = this.mdList.filter(o => o.path !== s)
                }
            });
        },
        singleName(i=0){
            let name =  this.newName + (i?('('+i+').md'):'.md')
            let s = path.join(this.obj.basePath,name)
            console.log('s: ', s,i);
            let has  = this.mdList.some(o=>o.path==s)
            if(has){
                return this.singleName(i+1)
            }else{
                return {
                    name,
                    path:s
                }
            }
        },
        newMd() {
            if (this.newLoading) {
                return false
            }
            if (!this.newName) {
                this.$message({
                    type: 'warning',
                    message: '请先输入新建的文件名'
                });
                return false
            }
            this.newLoading = true
            let obj = this.singleName()
            fs.writeFile(obj.path,'', (err) => {
                this.newLoading = false
                if (err) {
                    this.$message({
                        type: 'error',
                        message: err
                    });
                } else {
                    this.mdList.unshift(obj)
                }
            })

        }
    }

}
</script>
<style lang="less">
.list {
    overflow: auto;
    height: 100%;

    // // width:100vw;
    // button {
    //     display: block;
    // }

    img {
        width: 100%;
        vertical-align: bottom;
    }

    .el-image {
        width: 100%;
        vertical-align: bottom;
    }

    .img {
        position: relative;

        .banner {
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 8;
            opacity: 0.1;
            cursor: pointer;
            position: absolute;
            top: 0;
            left: 0;

            &:hover {
                opacity: 1;
            }

            button {
                cursor: pointer;
            }
        }
    }

    .video,
    .audio {
        max-width: 100%;
        border-top: 1px solid white;
    }

    // .audio {
    //     .vjs-text-track-cue {
    //         top: 0!important;
    //         font: 28px sans-serif !important;

    //     }

    //     .video-js {
    //         padding-top: 120px !important;
    //     }
    // }

}

iframe {
    width: 100%;
    height: 100%;
}

.el-tabs {
    border: 0;
    height: calc(100vh);
    overflow: hidden;

    .el-tab-pane {
        overflow: auto;
    }

    .el-tabs__content {
        padding: 0;
        height: calc(100vh - 40px);
        overflow-y: auto;

        &>div {
            height: 100%;
        }
    }
}

.md-list {
    padding: 8px;

    p {
        padding: 5px 16px;
        background-color: #f4f4f5;
        color: #909399;
        border-radius: 3px;
        margin-top: 3px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all;
        cursor: pointer;

        label {
            flex: 1;
            overflow: hidden;
            word-break: break-all;
            cursor: pointer;



        }

        span {
            i {
                margin: 0 5px;
            }
        }

        &:hover {
            color: #333;
            color: #67c23a;
            background: #f0f9eb;
            border-color: #c2e7b0;
        }

    }
}
</style>