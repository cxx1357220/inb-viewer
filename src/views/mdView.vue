<template>
    <div class="md-view">
        <!-- 123 -->
        <div class="view" id="contentEditor"></div>
    </div>
</template>
<script>
const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');
import Vditor from 'vditor'
import "vditor/dist/index.css"

import myVideo from '@/components/myVideo.vue';
export default {
    name: 'mdView',
    data() {
        return {
            obj: {},
            sustainType: ['mpeg4'],
            cutStateMap: {},
            mdVal: '',
            contentEditor: ''
        }
    },
    components: { myVideo },
    created() {
        this.obj = this.$route.params;
        let that = this
        console.log('this.obj : ', this.obj);
        fs.readFile(this.obj.path, 'utf8', (err, data) => {
            console.log('err,data: ', err, data);
            if (err) {
                this.$message({
                    type: 'error',
                    message: err
                });
            }
            this.mdVal = data
            console.log('this.mdVal: ', this.mdVal);
            this.contentEditor = new Vditor('contentEditor', {
                height: '100vh',
                // toolbar: ['emoji', 'headings', 'bold', 'italic', 'strike','|' , 'line', 'quote', 'list', 'ordered-list', 'check', 'outdent', 'indent', 'code', 'inline-code',' insert-after', 'insert-before', 'undo', 'redo', 'upload', 'link', 'table', 'record', 'edit-mode', 'both', 'preview', 'fullscreen', 'outline', 'code-theme', 'content-theme', 'export', 'devtools', 'info', 'help', 'br'],
                toolbar: ['headings', 'bold', 'italic', 'strike', '|', 'line', 'quote', 'list', 'ordered-list', 'check', 'outdent', 'indent', 'code', 'inline-code', '|', 'undo', 'redo', 'upload', 'link', 'table', 'edit-mode', 'both', 'outline', 'export'],
                toolbarConfig: {
                    pin: true,
                },
                preview: {
                    actions: []
                },
                mode: 'sv',
                upload: {
                    // accept: 'image/*,.mp3, .wav, .rar',
                    // token: 'test',
                    // url: '/api/upload/editor',
                    // linkToImgUrl: '/api/upload/fetch',
                    // filename(name) {
                    //     return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '').replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '').replace('/\\s/g', '')
                    // },
                    handler(files) {
                        console.log('files: ', files);
                        let s = '![' + files[0].name + '](file:///' + files[0].path.replaceAll(' ', '%20') + ')';
                        // that.contentEditor.insertValue(s)
                        return new Promise((resolve, reject) => {
                            resolve(JSON.stringify({
                                "msg": "",
                                "code": 0,
                                "data": {
                                    // "errFiles": ['filename', 'filename2'],
                                    "succMap": {
                                        [files[0].name]: 'file:///' + files[0].path.replaceAll(' ', '%20'),
                                    }
                                }
                            }))
                        })
                        // return JSON.stringify({
                        //     "msg": "",
                        //     "code": 0,
                        //     "data": {
                        //         // "errFiles": ['filename', 'filename2'],
                        //         "succMap": {
                        //             [files[0].name]: 'file:///' + files[0].path.replaceAll(' ', '%20'),
                        //         }
                        //     }
                        // })

                    },
                    format(a, b) {
                        console.log('a,b: ', a, b);

                    }
                },
                cache: {
                    enable: false,
                },
                after: () => {
                    this.contentEditor.setValue('https://user-images.githubusercontent.com/1991296/204038393-2f846eae-c255-4099-a76d-5735c25c49da.mp4')
                },
            })
        })
    },
    mounted() {
    },
    methods: {
    }

}
</script>
<style lang="less" scoped>
.md-view {
    width: 100vw;
    height: 100vh;

    #contentEditor {
        width: 100vw;
        height: 100vh;
    }
}
</style>
