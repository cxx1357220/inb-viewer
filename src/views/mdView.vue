<template>
    <div class="md-view">
        <!-- 123 -->
        <div class="view" id="contentEditor"></div>
    </div>
</template>
<script>
const { shell } = require('electron');

const fs = require('fs');
const path = require('path')
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
        let linkBase = path.dirname(this.obj.path)
        fs.readFile(this.obj.path, 'utf8', (err, data) => {
            if (err) {
                this.$message({
                    type: 'error',
                    message: err
                });
            }
            this.mdVal = data
            this.contentEditor = new Vditor('contentEditor', {
                value: data,
                height: '100vh',
                // toolbar: ['emoji', 'headings', 'bold', 'italic', 'strike','|' , 'line', 'quote', 'list', 'ordered-list', 'check', 'outdent', 'indent', 'code', 'inline-code',' insert-after', 'insert-before', 'undo', 'redo', 'upload', 'link', 'table', 'record', 'edit-mode', 'both', 'preview', 'fullscreen', 'outline', 'code-theme', 'content-theme', 'export', 'devtools', 'info', 'help', 'br'],
                toolbar: [{
                    name: 'save',
                    tipPosition: 'se',
                    tip: 'save',
                    className: 'left',
                    icon: '<svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3521"><path d="M608 320C625.664 320 640 305.696 640 288L640 160C640 142.304 625.664 128 608 128 590.336 128 576 142.304 576 160L576 288C576 305.696 590.336 320 608 320L608 320ZM960 896C960 931.328 931.328 960 896 960L128 960C92.672 960 64 931.328 64 896L64 128C64 92.672 92.672 64 128 64L192 64 192 384C192 419.328 220.672 448 256 448L768 448C803.328 448 832 419.328 832 384L832 64 896 64C931.328 64 960 92.672 960 128L960 896 960 896ZM256 64 768 64 768 352C768 369.696 753.664 384 736 384L288 384C270.336 384 256 369.696 256 352L256 64 256 64ZM896 0 128 0C57.312 0 0 57.312 0 128L0 896C0 966.688 57.312 1024 128 1024L896 1024C966.688 1024 1024 966.688 1024 896L1024 128C1024 57.312 966.688 0 896 0L896 0Z" fill="#000000" p-id="3522"></path></svg>',
                    click() {
                        let val = that.contentEditor.getValue()
                        // fs.writeFileSync(that.obj.path, val)
                        fs.writeFile(
                            that.obj.path,
                            val,
                            function (err) {
                                if (err) {
                                    console.log('err: ', err);
                                    that.$message({
                                        type: 'error',
                                        message: '保存失败'
                                    });
                                    return false
                                }
                                that.$message({
                                    type: 'success',
                                    message: '保存成功'
                                });
                            }
                        )

                    },
                }, 'headings', 'bold', 'italic', 'strike', '|', 'line', 'quote', 'list', 'ordered-list', 'check', 'outdent', 'indent', 'code', 'inline-code', '|', 'undo', 'redo', 'upload', 'link', 'table', 'edit-mode', 'both', 'outline'],
                toolbarConfig: {
                    pin: true,
                },
                cdn: location.origin+'/vditor',
                preview: {
                    actions: [],
                    markdown:{
                        linkBase: 'file:///'+linkBase
                    }
                },
                link: {
                    isOpen: true,
                    click(link) {
                        console.log('link: ', link);
                        const url = link.getAttribute('href');
                        // shell.openExternal(url);
                    }
                },
                mode: 'sv',
                upload: {
                    accept: 'image/*',
                    handler(files) {
                        let ext = path.extname(files[0].name)
                        console.log('ext: ', ext);
                        let name = path.basename(files[0].name,ext)
                        console.log('name: ', name);
                        let newName = that.singleName(path.dirname(that.obj.path),name,ext).name
                        console.log('newName: ', newName);
                        let to = path.join(path.dirname(that.obj.path), newName)
                        fs.copyFile(decodeURIComponent(encodeURIComponent(files[0].path)), decodeURIComponent(to), (err) => {
                            if (err) {
                                console.log('err: ', err);
                                return false
                            }

                            let s = '![' + files[0].name + '](./' + newName.replaceAll(' ', '%20') + ')';
                            that.contentEditor.insertValue(s)
                            // return new Promise((resolve, reject) => {
                            //     resolve(JSON.stringify({
                            //         "msg": "",
                            //         "code": 0,
                            //         "data": {
                            //             // "errFiles": ['filename', 'filename2'],
                            //             "succMap": {
                            //                 [files[0].name]: 'file:///' + to.replaceAll(' ', '%20'),
                            //             }
                            //         }
                            //     }))
                            // })
                            // ret
                        })

                    },
                    format(a, b) {
                        console.log('a,b: ', a, b);

                    }
                },
                cache: {
                    enable: false,
                },
                after: () => {
                    console.log('after: ');
                    document.getElementsByClassName('vditor-content')[0].addEventListener('click', function () {
                        event.preventDefault();
                        // 兼容处理
                        var target = event.target || event.srcElement;
                        // 判断是否匹配目标元素
                        if (target.nodeName.toLocaleLowerCase() === 'a') {
                            event.preventDefault();
                            const url = target.getAttribute('href');
                            shell.openExternal(url);
                        }
                    });
                    // this.contentEditor.setValue('https://user-images.githubusercontent.com/1991296/204038393-2f846eae-c255-4099-a76d-5735c25c49da.mp4')
                },
            })
        })
    },
    methods: { 
        singleName(basePath, newName,  fileExt = '.md',i = 0) {
            console.log('basePath: ', basePath);
            let name = newName + (i ? ('(' + i + ')'+fileExt) : fileExt)
            let s = path.join(basePath, name)
            console.log('s: ', s, i);
            if (fs.existsSync(s)) {
                return this.singleName(basePath, newName, fileExt,i + 1)
            } else {
                return {
                    name,
                    path: s
                }
            }

        },
    },

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
