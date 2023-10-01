<template>
    <el-drawer :direction="'ltr'" :size="'50%'" title="合并视频" :visible.sync="show">
        <el-form label-width="100px" class="drawer" v-loading="loading" :element-loading-text="percent">
            <el-form-item label="名称：">
                <el-input :class="name ? '' : 'warning'" type="text" size="mini" v-model.trim="name"></el-input>
            </el-form-item>
            <el-form-item label="合并文件：">
                <transition-group name="drag" class="list" tag="ul">
                    <div class="file" v-for="(file, i) in files" :key="file.k" @dragenter="dragenter($event, i)"
                        @dragover="dragover($event, i)" @dragstart="dragstart(i)" draggable>
                        <el-input size="mini" v-model="file.p" style="vertical-align: baseline;"
                            :class="file.p ? '' : 'warning'" placeholder="文件路径"><el-button size="mini" slot="prepend"
                                @click="setPaths(file)" icon="el-icon-folder">选择文件路径</el-button>


                                <el-button slot="append" size="mini" @click="del(i)">移除</el-button>

                        </el-input>
                    </div>
                </transition-group>

                <el-button size="mini" @click="add">添加</el-button>

            </el-form-item>
            <el-form-item label="保存路径：">
                <el-input size="mini" v-model="savePath" style="vertical-align: baseline;"
                    :class="savePath ? '' : 'warning'" placeholder="保存路径"><el-button size="mini" slot="prepend"
                        @click="setPath('dir', 'savePath')" icon="el-icon-folder">选择保存路径</el-button>
                </el-input>
            </el-form-item>
            <el-form-item label="解码：">
                <el-switch v-model="unSameType" active-text="非相同编码"></el-switch>
                <div v-show="unSameType">
                    <div>
                        <el-checkbox v-model="unSameScale">非相同分辨率</el-checkbox>
                        <el-form ref="form" v-show="unSameScale" label-width="120px">
                            <el-form-item label="设置分辨率：">
                                <el-input placeholder="请输入分辨率(*:*)" size="mini" v-model="scale"></el-input>
                            </el-form-item>
                        </el-form>
                    </div>
                    <div>
                        <el-checkbox v-model="unSameFps">非相同的帧率</el-checkbox>
                        <el-form ref="form" v-show="unSameFps" label-width="120px">
                            <el-form-item label="设置帧率：">
                                <el-input placeholder="请输入帧率" size="mini" v-model.number="fps"> </el-input>
                            </el-form-item>
                        </el-form>
                    </div>
                </div>
            </el-form-item>

            <el-form-item>
                <el-button size="mini" type="primary" @click="concat">确 定</el-button>
            </el-form-item>
        </el-form>

    </el-drawer>
</template>

<script>
const ipcRenderer = require('electron').ipcRenderer;


const path = require('path')
export default {
    name: 'concat',
    data() {
        return {
            show: false,
            savePath: '',
            files: [{ k: 1, p: '' }],
            name: '',
            loading: false,
            unSameType: false,
            dragIndex: '',
            enterIndex: '',
            scale: '1920:1080',
            unSameScale: true,
            percent: '',
            unSameFps: true,
            fps: 30
        }
    },

    props: ['value'],
    watch: {
        show(n) {
            this.$emit('input', n)
        },
        value(n) {
            this.show = n
        }
    },


    directives: {
        vtt: {
            bind(el, binding) {
                try {
                    let o = path.parse(binding.show)
                    el.src = o.dir + '/' + o.name + '.vtt'
                } catch (error) {
                    console.log(binding.value);
                }
            },
            update(el, binding) {
                try {
                    let o = path.parse(binding.value)
                    el.src = o.dir + '/' + o.name + '.vtt'
                } catch (error) {
                    console.log(binding.value);
                }
            },
        },
    },
    created() {
        this.show = this.value
        ipcRenderer.on('setConcatPaths', (e, obj) => {
            console.log('obj: ', obj);
            let i = this.files.findIndex(item => {
                return obj.k == item.k
            })
            if (i != -1) {
                let li = obj.files.map((o, idx) => {
                    return {
                        p: o,
                        k: obj.k + '-' + idx
                    }
                })
                console.log('li: ', li);
                this.files[i].p = li.shift().p
                this.files.splice(i + 1, 0, ...li)
                console.log('this.files: ', this.files);
            }
        })
        ipcRenderer.on('setConcatPath', (e, str) => {
            this.savePath = str
        })

        ipcRenderer.on('concatPercent', (e, str) => {
            switch (str) {
                case 'error':
                    this.loading = false
                    break;
                case 'done':
                    this.loading = false
                    this.$message({
                        type: 'success',
                        message: '合并视频完成'
                    });
                    break;
                default:
                    this.percent = str
                    break;
            }
        })
    },
    mounted() {
        // this.concat()
    },
    methods: {
        concat() {
            let ls = this.files.filter(o => o.p).map(o => o.p)
            if (ls.length == 0 || this.name == '' || this.savePath == '') {
                this.$message({
                    type: 'warning',
                    message: '请填写完整'
                });
                return false
            }
            this.loading = true;
            this.percent = ''
            ipcRenderer.send("concatVideo", {
                savePath: this.savePath,
                files: ls,
                name: this.name,
                unSameType: this.unSameType,
                scale: this.scale,
                unSameScale: this.unSameScale,
                fps: this.fps,
                unSameFps: this.unSameFps
            });
        },
        setPaths(obj) {
            ipcRenderer.send("setConcatPaths", obj);
        },
        setPath() {
            ipcRenderer.send("setConcatPath");
        },
        add() {
            this.files.push({ k: Date.now(), p: '' })
        },
        del(i) {
            this.files.splice(i, 1)
        },
        dragstart(index) {
            this.dragIndex = index;
        },
        dragenter(e, index) {
            e.preventDefault();
            // 避免源对象触发自身的dragenter事件
            if (this.dragIndex !== index) {
                const moving = this.files[this.dragIndex];
                this.files.splice(this.dragIndex, 1);
                this.files.splice(index, 0, moving);
                // 排序变化后目标对象的索引变成源对象的索引
                this.dragIndex = index;
            }
        },
        dragover(e, index) {
            e.preventDefault();
        },
    }

}
</script>
<style lang="less" scoped>
.drawer {
    padding: 20px;

    .file {
        cursor: move;

        display: flex;
        padding-top: 5px;
    }

    .list {
        max-height: 50vh;
        overflow: auto;

    }

    .drag-move {
        transition: transform .3s;
    }
}
</style>