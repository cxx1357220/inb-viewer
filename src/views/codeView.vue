<template>
    <div class="code-view">

        <el-tabs v-model="activeName" type="border-card" addable @tab-add="tabAdd" @tab-remove="tabRemove">
            <el-tab-pane label="base" name="base">
                <div ref="codeEditor" id="codeEditor"></div>
                <el-button @click="use('base', baseGetDetailPath)" size="mini"
                    :type="usePath == baseGetDetailPath ? 'success' : ''" round>use</el-button>
            </el-tab-pane>

            <el-tab-pane v-for="(path, key) in editTabs" :key="key" :label="key" :name="key" closable>
                <div :ref="'codeEditor-' + key" :id="'codeEditor-' + key"></div>
                <el-button @click="save(key, path)" size="mini" round>save</el-button>
                <el-button @click="use(key, path)" size="mini" :type="usePath == path ? 'success' : ''"
                    round>use</el-button>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>
<script>
const { shell } = require('electron');

const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');
const nodePath = require('path')
const md5 = require('md5');
import * as monaco from 'monaco-editor';
import 'monaco-editor/min/vs/editor/editor.main.css';  // 引入 Monaco 编辑器的样式

export default {
    name: 'codeView',
    data() {
        return {
            editTabs: {},
            editMap: {},
            activeName: 'base',
            jsCachePath: '',
            baseGetDetailPath: '',
            usePath: ''
        }
    },
    components: {},
    created() {
        this.jsCachePath = nodePath.join(localStorage.getItem('imgCachePath'), '..', 'getJsCache')
        this.baseGetDetailPath = localStorage.getItem('baseGetDetailPath')
        this.usePath = localStorage.getItem('useGetJsPath') || this.baseGetDetailPath
        let fileList = fs.readdirSync(this.jsCachePath)
        fileList.forEach(s => {
            s = nodePath.join(this.jsCachePath, s)
            let name = nodePath.parse(s).name
            fs.readFile(s, 'utf8', (err, data) => {
                if (err) {
                    this.$message({
                        type: 'error',
                        message: err
                    });
                }
                this.$set(this.editTabs, name, s)
                setTimeout(() => {
                    this.$nextTick(_ => {
                        this.editMap['codeEditor-' + name] = monaco.editor.create(document.getElementById('codeEditor-' + name), {
                            value: data,
                            language: "javascript",
                            automaticLayout: true,
                        });
                    });
                }, 0);
            })
        });
        fs.readFile(this.baseGetDetailPath, 'utf8', (err, data) => {
            if (err) {
                this.$message({
                    type: 'error',
                    message: err
                });
            }

            // Hover on each property to see its docs!
            this.editMap['base'] = monaco.editor.create(this.$refs.codeEditor, {
                value: data,
                language: "javascript",
                automaticLayout: true,
                readOnly: true
            });
        })
    },
    mounted() {

    },
    methods: {
        singleName(name, i = 0) {
            name = name + (i ? ('(' + i + ')') : '')
            if (this.editTabs[name] || name == 'base') {
                return this.singleName(name, i + 1)
            } else {
                return name
            }
        },
        tabRemove(name) {
            this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                console.log('name: ', name);
                let s = this.editTabs[name]
                fs.unlink(s, (err) => {
                    if (this.usePath == s) {
                        localStorage.removeItem('useGetJsPath')
                        this.usePath = this.baseGetDetailPath
                    }
                    this.$delete(this.editTabs, name)
                    this.editMap['codeEditor-' + name].dispose();
                });
            }).catch(() => {
            });
        },
        tabAdd() {
            let data = `
var getDetailFunc = (function () { //别改这一行
    // 记得点击右上角保存和使用按钮。
    const run = async (obj) => {
        return Promise.resolve({
            videoCode: '',
            videoTitle: '',
            videoTags: [],
            videoBigImage: '',
            videoMinImage: '',
            videoActs: [],
            videoPreviewImgs: []
        })
    }
    return run
})() //别改这一行
            `
            this.$prompt('请输入名称', '', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputPattern: /^[A-Za-z]+$/,
                inputErrorMessage: '只允许字母大小写'
            }).then(({ value }) => {
                value = value.trim()
                if (value) {
                    let name = this.singleName(value)
                    this.$set(this.editTabs, name, nodePath.join(this.jsCachePath, name + '.js'))
                    this.activeName = name
                    setTimeout(() => {
                        this.$nextTick(_ => {
                            this.editMap['codeEditor-' + name] = monaco.editor.create(document.getElementById('codeEditor-' + name), {
                                value: data,
                                language: "javascript",
                                automaticLayout: true,
                            });
                        });
                    }, 0);


                }

            }).catch((e) => {
            });
        },
        save(name, path) {
            let value = this.editMap['codeEditor-' + name].getValue()
            fs.writeFile(path, value, (err) => {
                this.newLoading = false
                if (err) {
                    this.$message({
                        type: 'error',
                        message: err
                    });
                } else {
                    this.$message({
                        type: 'success',
                        message: 'save success'
                    });
                }
            })
        },
        use(name, path) {
            localStorage.setItem('useGetJsPath', path)
            this.usePath = path
            this.$message({
                type: '',
                message: 'use this code'
            });
        }
    }

}
</script>
<style lang="less" scoped>
.code-view {
    width: 100vw;
    height: 100vh;

    #codeEditor {
        // width: 100vw;

    }

    /deep/ .el-tabs {
        border: 0;
        height: calc(100vh);
        overflow: hidden;

        .el-tabs__header {
            padding: 0 10px;
        }

        .el-tab-pane {
            overflow: auto;

            button {
                position: absolute;
                right: 0;
                top: 20px;
                z-index: 99;
            }

            button+button {
                right: 80px;
            }
        }

        .el-tabs__content {
            padding: 0;
            height: calc(100vh - 40px);
            overflow-y: auto;

            .el-tab-pane {
                height: 100%;
            }

            .el-tab-pane>div {
                height: 100%;
            }
        }
    }
}
</style>
