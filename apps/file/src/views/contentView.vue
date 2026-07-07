<template>
    <el-tabs v-model="activeName" type="border-card">
        <el-tab-pane label="list" name="list">
            <div class="list">
                <img v-for=" s in imgs" v-lazy="s" alt="">
                <div v-for=" s in audios">
                    <audio controls v-data="s">
                    </audio>
                </div>
                <div v-for=" s in videos">
                    <video controls v-data="s">
                    </video>
                </div>
                <el-empty v-if="!imgs.length && !audios.length && !videos.length" description="nothing"></el-empty>

            </div>
        </el-tab-pane>
        <el-tab-pane label="html" v-if="haveHtml" name="html">
            <iframe :src="haveHtml" frameborder="0"></iframe>
        </el-tab-pane>
        <el-tab-pane label="upload" name="upload">
            <el-upload class="upload-demo" :on-success="onSuccess" :headers="headers" multiple ref="upload"
                action="/api/upload" :on-preview="handlePreview" :on-remove="handleRemove" :file-list="fileList"
                :auto-upload="false">
                <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
                <el-button style="margin-left: 10px;" size="small" type="success"
                    @click="submitUpload">上传到服务器</el-button>
            </el-upload>
        </el-tab-pane>
        <el-tab-pane label="markdown" name="markdown">
            <div class="md-list">
                <el-input placeholder="请输入文件名" v-model="newName">
                    <span slot="prepend">文件名:</span>
                    <el-button :loading="newLoading" @click="newMd" slot="append"
                        icon="el-icon-circle-plus-outline">新建</el-button>
                </el-input>
                <p v-for="o in markdowns" :key="o">
                    <label @click="open(o)">
                        {{ o }}
                    </label>
                </p>
                <el-empty v-if="!markdowns.length" description="nothing"></el-empty>
            </div>
        </el-tab-pane>
    </el-tabs>
</template>

<script>
import axios from 'axios';
export default {
    name: 'contentList',
    data() {
        return {
            activeName: 'list',
            haveHtml: '',
            obj: { filePath: '' },
            headers: {},
            imgs: [],
            videos: [],
            audios: [],
            markdowns: [],
            fileList: [],
            haveUpload: false,
            newName: '',
            newLoading: false
        }
    },
    directives: {
        data: {
            bind(el, binding) {
                try {
                    el.src = binding.value.replace('#', '%23')
                } catch (error) {
                    console.log(binding.value);
                }
            },
            update(el, binding) {
                try {
                    el.src = binding.value.replace('#', '%23')
                } catch (error) {
                    console.log(binding.value);
                }
            },
        },
    },
    watch: {
        activeName(n) {
            if (n == 'list' && this.haveUpload) {
                this.haveUpload = false
                this.getList()
            }
        },
    },
    created() {
        console.log(this.$route.query.id);
        let obj = JSON.parse(sessionStorage.getItem(this.$route.query.id) || "{}")
        console.log('obj: ', obj);
        this.obj = obj
        this.headers = {
            basepath: encodeURIComponent(obj.basePath),
            newbasepath: encodeURIComponent(obj.newBasePath)
        }
        this.getList()
    },
    mounted() {
    },
    methods: {
        getList() {
            axios.post('/api/contentList', this.obj).then((res) => {
                console.log('res: ', res);
                this.imgs = res?.data?.imgs || []
                this.videos = res?.data?.videos || []
                this.audios = res?.data?.audios || []
                this.markdowns = res?.data?.markdowns || []
                this.haveHtml = res?.data?.haveHtml || false
            }).catch((err) => {
                console.log('err: ', err);
                alert(err)
            })
        },
        submitUpload() {
            this.haveUpload = true
            this.$refs.upload.submit();
        },
        handleRemove(file, fileList) {
            console.log(file, fileList);
        },
        handlePreview(file) {
            console.log(file);
        },
        onSuccess() {
            console.log('success');
        },
        open(s) {
            let routeData = this.$router.resolve({
                query: { path: s, id: this.$route.query.id },
                name: 'mdView'
            });
            window.open(routeData.href, '_blank');
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

            let obj = JSON.parse(sessionStorage.getItem(this.$route.query.id) || "{}")
            console.log('obj: ', obj);
            axios.post('/api/createMd', {
                name: this.newName,
            }, {
                headers: {
                    basepath: encodeURIComponent(obj.basePath),
                    newbasepath: encodeURIComponent(obj.newBasePath)
                }
            }).then(response => {
                console.log('response: ', response);
                this.newLoading = false
                if (response?.data?.code == 200) {

                    this.markdowns.unshift(this.$route.query.id + response?.data.name)

                } else {
                    this.$message({
                        type: 'error',
                        message: response?.data.code
                    });
                }
            }).catch(error => {
                this.newLoading = false
                this.$message({
                    type: 'error',
                    message: '上传失败'
                });
            });

        }
    }

}
</script>
<style lang="less">
.list {

    // width:100vw;
    img {
        width: 100%;
        vertical-align: bottom;
    }

    video,
    audio {
        max-width: 100%;
        max-height: 100vh;
    }
}

iframe {
    width: 100%;
    height: 100%;
}

.el-tabs {
    border: 0;
    height: calc(100vh);
    overflow: hidden;
    font-size: 0;

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
    font-size: 24px;
    ;

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