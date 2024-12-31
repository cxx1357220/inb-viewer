<template>
    <el-dialog title="详情" :visible.sync="showDetailDialog">
        <el-form label-width="100px" :model="detail">
            <el-form-item label="标题：">
                <el-input type="text" size="mini" v-model="detail.title"></el-input>
            </el-form-item>
            <el-form-item label="描述：">
                <el-input type="textarea" size="mini" v-model="detail.description"></el-input>
            </el-form-item>
            <el-form-item label="标签：">
                <el-select v-model="detail.tags" multiple filterable allow-create default-first-option
                    placeholder="tags">
                    <el-option v-for="str in tags" :label="str" :value="str">
                    </el-option>
                </el-select>
            </el-form-item>

            <el-form-item v-if="detail.videoCode" label="片码：">
                {{ detail.videoCode }}
            </el-form-item>
            <el-form-item v-if="detail.videoTitle" label="片名：">
                {{ detail.videoTitle }}
            </el-form-item>
            <el-form-item v-if="detail.type == 'video'||(detail.videoTags && detail.videoTags.length)" label="视频类型：">
                <template v-if="detail.videoTags">
                    <el-tag v-for="s in detail.videoTags " closable @close="handleTagClose(s)">{{ s }}</el-tag>
                </template>
                <el-input class="input-new-tag" v-if="inputTagVisible" v-model="inputTagValue" ref="saveTagInput"
                    size="small" @keyup.enter.native="handleInputTagConfirm" @blur="handleInputTagConfirm">
                </el-input>
                <el-button v-else class="button-new-tag" size="small" @click="showTagInput">+ New Tag</el-button>
            </el-form-item>
            <el-form-item v-if="detail.type == 'video'||(detail.videoActs && detail.videoActs.length)" label="主演：">
                <template v-if="detail.videoActs">
                    <el-tag v-for="s in detail.videoActs " closable @close="handleActClose(s)">{{ s }}</el-tag>
                </template>
                <el-input class="input-new-tag" v-if="inputActVisible" v-model="inputActValue" ref="saveActInput"
                    size="small" @keyup.enter.native="handleInputActConfirm" @blur="handleInputActConfirm">
                </el-input>
                <el-button v-else class="button-new-tag" size="small" @click="showActInput">+ New Act</el-button>
            </el-form-item>

            <el-form-item v-if="detail.videoPreviewImg && detail.videoPreviewImg.length" label="预览图：">
                <el-image v-for="url, i in detail.videoPreviewImg" style="width: 100px; height: 100px" :src="url"
                    :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" :preview-src-list="detail.videoPreviewImg"
                    :initial-index="i" fit="cover" />
            </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
            <el-button size="mini" @click="showDetailDialog = false">取 消</el-button>
            <el-button size="mini" type="primary" @click="saveDetail">确 定</el-button>
        </div>
    </el-dialog>
</template>

<script>
const ipcRenderer = require('electron').ipcRenderer;


export default {
    name: 'concat',
    data() {
        return {
            showDetailDialog: false,
            inputTagVisible: false,
            inputTagValue: '',
            inputActVisible: false,
            inputActValue: ''
        }
    },

    props: ['value', 'detail', 'tags'],
    watch: {
        showDetailDialog(n) {
            this.$emit('input', n)
        },
        value(n) {
            this.showDetailDialog = n
        }
    },



    created() {
        this.showDetailDialog = this.value

    },
    mounted() {
        // this.concat()
    },
    methods: {
        saveDetail() {
            ipcRenderer.send('reDetail', this.detail)
            this.showDetailDialog = false;
        },
        handleTagClose(tag) {
            this.detail?.videoTags.splice(this.detail?.videoTags.indexOf(tag), 1);
        },

        showTagInput() {
            this.inputTagVisible = true;
            this.$nextTick(_ => {
                console.log('this.$refs.saveTagInput: ', this.$refs);

                this.$refs.saveTagInput.$refs.input.focus();
            });
        },

        handleInputTagConfirm() {
            let inputTagValue = this.inputTagValue;
            if (!this.detail?.videoTags) {
                this.detail.videoTags = []
            }
            if (inputTagValue) {
                this.detail?.videoTags.push(inputTagValue);
            }
            this.inputTagVisible = false;
            this.inputTagValue = '';
        },

        handleActClose(tag) {
            this.detail?.videoActs.splice(this.detail?.videoActs.indexOf(tag), 1);
        },

        showActInput() {
            this.inputActVisible = true;
            this.$nextTick(_ => {
                this.$refs.saveActInput.$refs.input.focus();
            });
        },

        handleInputActConfirm() {
            console.log('detail: ', detail);
            let inputActValue = this.inputActValue;
            if (!this.detail?.videoActs) {
                this.detail.videoActs = []
            }
            if (inputActValue) {
                this.detail?.videoActs.push(inputActValue);
            }
            this.inputActVisible = false;
            this.inputActValue = '';
        }
    }

}
</script>
<style lang="less" scoped>
.el-tag+.el-tag {
    margin-left: 10px;
}

.button-new-tag {
    margin-left: 10px;
    height: 32px;
    line-height: 30px;
    padding-top: 0;
    padding-bottom: 0;
}

.input-new-tag {
    width: 90px;
    margin-left: 10px;
    vertical-align: bottom;
}
</style>