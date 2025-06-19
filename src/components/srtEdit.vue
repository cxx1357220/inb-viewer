<template>
    <div class="edit">

        <el-tabs>
            <el-tab-pane label="时间偏移">
                <div class="control">
                    <el-input-number size="mini" style="width:calc(100% - 104px)" v-model="num"
                        controls-position="right"></el-input-number>
                    <el-button size="mini" @click="move">时间偏移(ms)</el-button>
                </div>
            </el-tab-pane>
            <el-tab-pane label="文本替换">
                <div class="control">
                    <el-input size="mini" v-model="findVal" placeholder="内容">
                        <el-button @click="searchVal" slot="append" icon="el-icon-search"></el-button>
                    </el-input>
                    <el-input size="mini" style="width:calc(100% - 136px)" v-model="replaceVal"
                        placeholder="替换为"></el-input>
                    <el-button size="mini" @click="replace(0)">替换</el-button>
                    <el-button size="mini" @click="replace(1)">全部替换</el-button>
                </div>
            </el-tab-pane>
            <el-tab-pane label="解码方式">
                <div class="control">
                    <el-select size="mini" style="width:calc(100%)" @change="decode" v-model="decodeValue"
                        placeholder="请选择">
                        <el-option v-for="s in decodeOptions" :key="s" :label="s" :value="s">
                        </el-option>
                    </el-select>
                </div>
            </el-tab-pane>
        </el-tabs>

        <div class="list" style="overflow:auto">
            <div v-for="(o, i) in dataList" v-if="o.type == 'cue'" ref="scroll" :data-idx="i">
                <div v-if="o.show" class="new-srt-text" @click='newSrtText(i, o)'>
                    <i class="el-icon-circle-plus-outline"></i>
                </div>
                <div v-if="o.show" class="time-tip">
                    <!-- {{ i }}: -->
                    <i @click="setTime(o.data.start)" title="play" class="el-icon-video-play"></i>
                    <span>{{ formatTime(o.data.start) }}</span>>
                    <span>{{ formatTime(o.data.end) }}</span>
                    <i @click="delSrtText(i)" class="el-icon-circle-close"></i>
                </div>
                <div v-if="o.show" class="time">
                    <el-input size="mini" v-model="o.data.start"></el-input>>
                    <el-input size="mini" v-model="o.data.end"></el-input>
                </div>
                <el-input v-if="o.show" type="textarea" :autosize="{ minRows: 2, maxRows: 2 }" placeholder="请输入内容"
                    v-model="o.data.text" :data-input="i">
                </el-input>

                <div v-show="!o.show" class="empty"></div>
            </div>
            <div class="new-srt-text" @click='newSrtText()'>
                <i class="el-icon-circle-plus-outline"></i>
            </div>

        </div>
        <el-checkbox v-model="checked">同步为视频同名vtt</el-checkbox>
        <div class="button-list">
            <el-button @click="save" size="mini" type="primary">保存</el-button>
            <el-button @click="del" size="mini" type="danger">删除</el-button>
        </div>


    </div>
</template>

<script>
import { stringifySync, formatTimestamp, parse} from 'subtitle'
const path = require('path')
const fs = require('fs')
const iconv = require('iconv-lite');
import { debounce } from '../back/utils'
export default {
    name: 'srtEdit',
    props: ['srcObj'],
    watch: {
        srcObj: {
            deep: true,
            immediate: true,
            handler(n) {
                this.from = n.from
                this.src = n.src
                this.getData()
            }
        }
    },
    data() {
        return {
            src: '',
            from: '',
            dataList: [],
            num: 0,
            scrollId: '',
            scrollValIdx: '',
            replaceVal: '',
            findVal: '',
            isFindAfter: false,
            checked: true,
            observer: null,
            decodeValue: 'utf8',
            decodeOptions: [
                'utf8',
                'gbk',
                'GB2312',
                'Shift_JIS',
                'Big5'
            ]
        }
    },
    created() {
    },
    mounted() {
        let that = this
        this.observer = new IntersectionObserver((entries, observer) => {
            let base = 0;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    that.scrollId = entry.target.dataset.idx - base
                    base += 1
                    console.log('that.scrollId: ', that.scrollId);
                    that.$set(this.dataList[entry.target.dataset.idx], 'show', true)
                    that.scrollValIdx = 0
                    that.isFindAfter = false
                } else {
                    that.$set(this.dataList[entry.target.dataset.idx], 'show', false)
                }
            });
        });
    },
    beforeDestroy(){
        this.observer.disconnect();
    },
    destroyed() {
        this.observer.disconnect();
    },
    methods: {
        focusVal: debounce(function (idx, i) {
            let input = document.querySelector('[data-input="' + i + '"]')
            console.log('input: ', input, i);
            input.focus()
            input.setSelectionRange(idx, idx + this.findVal.length)
            this.scrollId = i
            this.scrollValIdx = idx + this.findVal.length
            this.isFindAfter = true
        }, 300),
        searchVal() {
            if (!this.findVal) {
                return
            }
            let idx = this.dataList[this.scrollId]?.data?.text?.indexOf(this.findVal, this.scrollValIdx) || -1
            if (idx > -1) {
                let input = document.querySelector('[data-input="' + this.scrollId + '"]')
                input.focus()
                input.setSelectionRange(idx, idx + this.findVal.length)
                this.scrollValIdx = idx + this.findVal.length
                return
            }
            for (let i = this.scrollId + 1; i < this.dataList.length; i++) {
                const element = this.dataList[i];
                let idx = element?.data?.text?.indexOf(this.findVal) || -1
                if (idx > -1) {
                    document.querySelector('[data-idx="' + i + '"]').scrollIntoView(true)
                    this.scrollId = i
                    this.scrollValIdx = idx + this.findVal.length
                    this.isFindAfter = true
                    this.focusVal(idx, i)
                    return
                }
            }
            for (let i = 0; i < this.scrollId + 1; i++) {
                const element = this.dataList[i];
                let idx = element?.data?.text?.indexOf(this.findVal) || -1
                if (idx > -1) {
                    document.querySelector('[data-idx="' + i + '"]').scrollIntoView(true)
                    this.scrollId = i
                    this.scrollValIdx = idx + this.findVal.length
                    this.isFindAfter = true
                    this.focusVal(idx, i)
                    return
                }
            }

        },
        replace(isAll = false) {
            if (!this.findVal) {
                return
            }
            if (isAll) {
                for (let i = 0; i < this.dataList.length; i++) {
                    const element = this.dataList[i];
                    if (element?.data?.text?.includes(this.findVal)) {
                        this.$set(this.dataList[i].data, 'text', this.dataList[i].data.text.replaceAll(this.findVal, this.replaceVal))
                    }
                }
            } else {
                if (!this.isFindAfter) {
                    this.searchVal()
                    return
                }
                for (let i = this.scrollId; i < this.dataList.length; i++) {
                    const element = this.dataList[i];
                    if (element?.data?.text?.includes(this.findVal)) {
                        let text = this.dataList[i].data.text.slice(0, this.scrollValIdx - 1) + this.dataList[i].data.text.slice(this.scrollValIdx - 1).replace(this.findVal, this.replaceVal)
                        console.log('text: ', text, this.dataList[i].data.text.slice(this.scrollValIdx));
                        this.$set(this.dataList[i].data, 'text', text)
                        this.scrollValIdx += this.replaceVal.length - this.findVal.length
                        this.isFindAfter = false
                        return
                    }
                }
                for (let i = 0; i < this.scrollId + 1; i++) {
                    const element = this.dataList[i];
                    if (element?.data?.text?.includes(this.findVal)) {
                        let text = this.dataList[i].data.text.slice(0, this.scrollValIdx - 1) + this.dataList[i].data.text.slice(this.scrollValIdx - 1).replace(this.findVal, this.replaceVal)
                        console.log('text: ', text, this.dataList[i].data.text.slice(this.scrollValIdx));
                        this.$set(this.dataList[i].data, 'text', text)
                        this.scrollValIdx += this.replaceVal.length - this.findVal.length
                        this.isFindAfter = false
                        return
                    }
                }
            }
        },
        decode() {
            this.getData()
        },
        newSrtText(i, o) {
            console.log('this.dataList: ', o);

            if (o) {
                this.dataList.splice(i, 0, {
                    "type": "cue",
                    "data": {
                        "start": this.dataList?.[i - 1]?.type == 'cue' ? this.dataList[i - 1].data.end : 0,
                        "end": o.data.start,
                        "text": ""
                    },
                    "show": true
                })
            } else {
                this.dataList.push({
                    "type": "cue",
                    "data": {
                        "start": this.dataList?.length > 1 ? this.dataList[this.dataList.length - 1].data.end : 0,
                        "end": 0,
                        "text": ""
                    },
                    "show": true
                })
            }
        },
        delSrtText(i) {
            this.dataList.splice(i, 1)
        },
        setTime(n) {
            this.$emit('setTime', n)
        },
        del() {
            this.$emit('delSrt', this.src)
        },
        save() {
            fs.writeFileSync(this.src, stringifySync(this.dataList, { format: 'WebVTT' }))
            if (this.checked) {
                let parse = path.parse(this.from)
                parse.ext = '.vtt'
                parse.base = ''
                fs.writeFileSync(path.format(parse), stringifySync(this.dataList, { format: 'WebVTT' }))
                this.$emit('upSrt', path.format(parse))
            }
            this.decodeValue = 'utf8'
            this.$emit('upSrt', this.src)
        },
        move() {
            this.dataList?.forEach((_, idx) => {
                if (_.type == 'cue') {
                    this.$set(this.dataList[idx].data, 'start', this.dataList[idx].data.start += this.num)
                    this.$set(this.dataList[idx].data, 'end', this.dataList[idx].data.end += this.num)
                }
            })
        },
        formatTime(n) {
            return formatTimestamp(n)
        },
        getData() {
            this.dataList.length = 0
            this.observer?.disconnect();
            if (!this.src) {
                return
            }
            let that = this
            fs.createReadStream(this.src)
                .pipe(iconv.decodeStream(this.decodeValue))
                .pipe(parse())
                .on('data', node => {
                    this.dataList.push(node)
                }).on('end', function (err) {
                    console.log('close');

                    if (err) {
                        console.log(`读取失败: ${err}`);
                    } else {
                        that.$nextTick(_ => {
                            that.$refs.scroll?.forEach(D => {
                                that.observer.observe(D)
                            })
                        })
                    }
                }).on('finish', () => console.log('parser has finished'))
        }

    }

}
</script>
<style lang="less" scoped>
.edit {
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &/deep/.el-tabs__item {
        height: 24px;
        line-height: 24px;
    }

    .control {
        .el-button+.el-button {
            margin-left: 0;
        }
    }

    .list {
        flex: 1;
        margin: 10px 0;
        font-size: 16px;

        i {
            cursor: pointer;
        }

        i:hover {
            color: #409EFF;
        }

        // &>div {
        //     border: 1px solid darkgray;
        //     border-radius: 10px 0 0 0;
        // }


        .new-srt-text {
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 20px;
            padding: 2px 10px;
            border-radius: 10px;
            border: 1px solid gray;
            color: gray;
        }

        .new-srt-text:hover {
            border: 1px solid #409EFF;
            color: #409EFF;
        }

        .time-tip {
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: gray;

            span {
                flex: 1;
                text-align: center;
            }

            i {
                font-size: 16px;
            }
        }

        .time {
            display: flex;
            justify-content: space-between;
            align-items: center;
            // padding-top: 18px;
        }

        .empty {
            height: 120px;
        }
    }

    .button-list {
        display: flex;

        button {
            flex: 1
        }
    }

}
</style>