<template>
    <div class="md-view">
        <div class="view" id="contentEditor"></div>
    </div>
</template>
<script>

import Vditor from 'vditor'
import "vditor/dist/index.css"
import axios from 'axios';

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
    async created() {
        this.obj = this.$route.query;
        let that = this
        console.log('this.obj : ', this.obj);
        axios.get(this.obj.path).then((res) => {
            console.log('item: ', res);
            let data = this.filterPath(res.data)
            this.contentEditor = new Vditor('contentEditor', {
                value: data,
                // cdn:"",
                height: '100vh',
                // toolbar: ['emoji', 'headings', 'bold', 'italic', 'strike','|' , 'line', 'quote', 'list', 'ordered-list', 'check', 'outdent', 'indent', 'code', 'inline-code',' insert-after', 'insert-before', 'undo', 'redo', 'upload', 'link', 'table', 'record', 'edit-mode', 'both', 'preview', 'fullscreen', 'outline', 'code-theme', 'content-theme', 'export', 'devtools', 'info', 'help', 'br'],
                toolbar: [{
                    hotkey: '⇧⌘S',
                    name: 'save',
                    tipPosition: 'se',
                    tip: 'save',
                    className: 'left',
                    icon: '<svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3521"><path d="M608 320C625.664 320 640 305.696 640 288L640 160C640 142.304 625.664 128 608 128 590.336 128 576 142.304 576 160L576 288C576 305.696 590.336 320 608 320L608 320ZM960 896C960 931.328 931.328 960 896 960L128 960C92.672 960 64 931.328 64 896L64 128C64 92.672 92.672 64 128 64L192 64 192 384C192 419.328 220.672 448 256 448L768 448C803.328 448 832 419.328 832 384L832 64 896 64C931.328 64 960 92.672 960 128L960 896 960 896ZM256 64 768 64 768 352C768 369.696 753.664 384 736 384L288 384C270.336 384 256 369.696 256 352L256 64 256 64ZM896 0 128 0C57.312 0 0 57.312 0 128L0 896C0 966.688 57.312 1024 128 1024L896 1024C966.688 1024 1024 966.688 1024 896L1024 128C1024 57.312 966.688 0 896 0L896 0Z" fill="#000000" p-id="3522"></path></svg>',
                    click() {
                        let val = that.contentEditor.getValue()
                        let obj = JSON.parse(sessionStorage.getItem(that.$route.query.id) || "{}")
                        axios.post('/api/changeMd', {
                            name:that.obj.path,
                            data:val
                        }, {
                            headers: {
                                basepath: encodeURIComponent(obj.basePath),
                                newbasepath: encodeURIComponent(obj.newBasePath)
                            }
                        }).then(response => {
                            console.log('save成功', response.data);
                        }).catch(error => {
                            console.error('上传失败', error);
                        });
                    },
                }, 'headings', 'bold', 'italic', 'strike', '|', 'line', 'quote', 'list', 'ordered-list', 'check', 'outdent', 'indent', 'code', 'inline-code', '|', 'undo', 'redo', 'upload', 'link', 'table', 'edit-mode', 'both', 'outline'],
                toolbarConfig: {
                    pin: true,
                },
                preview: {
                    actions: []
                },
                mode: 'sv',
                upload: {
                    accept: 'image/*',
                    handler(files) {
                        const file = files[0];

                        const formData = new FormData();
                        formData.append('file', file);
                        let obj = JSON.parse(sessionStorage.getItem(that.$route.query.id) || "{}")
                        axios.post('/api/upload', formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                                basepath: encodeURIComponent(obj.basePath),
                                newbasepath: encodeURIComponent(obj.newBasePath)
                            }
                        }).then(response => {
                            console.log('上传成功', response.data);
                            let ls1 = that.obj.path.split('\\')
                            ls1[ls1.length - 1] = file.name
                            let s = '![' + file.name + '](' + ls1.join('\\').replaceAll(' ', '%20') + ')';
                            that.contentEditor.insertValue(s)
                        }).catch(error => {
                            console.error('上传失败', error);
                        });

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
                        console.log('target.nodeName: ', target.nodeName);
                        // 兼容处理
                        var target = event.target || event.srcElement;
                        // 判断是否匹配目标元素
                        if (target.nodeName.toLocaleLowerCase() === 'a') {
                            event.preventDefault();
                            const url = target.getAttribute('href');
                            window.open(url, '_blank');
                        }
                    });
                },
            })
        }).catch((err) => {
            console.log('err: ', err);
        })
    },
    mounted() {

    },
    methods: {
        filterPath(str) {
            const pattern = /!\[(.*?)\]\((.*?)\)/mg;
            const result = [];
            let matcher;
            while ((matcher = pattern.exec(str)) !== null) {
                result.push({
                    alt: matcher[1],
                    url: matcher[2]
                });
            }
            result.forEach(obj => {
                if (obj.url.indexOf('http') !== 0) {
                    let ls0 = obj.url.split('\\')
                    console.log('ls0: ', ls0);
                    let ls1 = this.obj.path.split('\\')
                    console.log('ls1: ', ls1);
                    ls1[ls1.length - 1] = ls0[ls0.length - 1]
                    str = str.replace(obj.url, ls1.join('\\'))
                }
            })
            return str

        }
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
