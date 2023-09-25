<template>
  <!-- 切割组件，避免更新数据导致全局渲染 -->
    <lazy-component class="content-detail">
        <div :class="['img-box', obj.type]" @click="open(obj)">
            <img v-urlCache="obj.img" alt="图片丢失" @load="cacheImg" />
            <!-- el没有监听窗口大小变化 -->
            <!-- <el-image :src="obj.img" lazy></el-image> -->
            <i :class="[obj.type == 'video' ? 'el-icon-video-play' : 'el-icon-document']"></i>
            <el-button v-if="obj.visits" type="text" icon="el-icon-view" disabled> {{ obj.visits }}</el-button>
        </div>
        <div class="detail-box">
            <div class="icons">
                <p @click="openPath(obj)" title="资源管理器内打开"><i class="el-icon-folder-opened"></i></p>
                <p @click="rmPath(obj)" title="删除"><i class="el-icon-delete"></i></p>
            </div>
            <div class="stars">
                <b v-for="idx in [0, 1, 2, 3, 4]" :class="idx < obj.star ? 'star' : 'unstar'" @click="reStar(obj, idx)"></b>
            </div>
            <p @click="reDetail" title="detail">{{ obj.title || '-----' }}</p>

            <!-- <p @click="add(obj, 'vip-')">vip-</p> -->

            <label>{{ obj.file }}</label>
            <i v-size="obj.allSize"></i>
            <span v-date="obj"></span>

            <section v-if="obj.type == 'video'">
                <stateButton :path="obj.jsonPath" map="compressStateMap">
                    <el-button size="mini" @click="compress">压缩视频</el-button>
                </stateButton>
            </section>
            <section v-if="obj.type == 'video'">
                <stateButton :path="obj.jsonPath" map="whisperStateMap">
                    <el-button size="mini" @click="whisper">制作字幕</el-button>
                </stateButton>
            </section>
            <section v-if="obj.type == 'scene'">
                <stateButton :path="obj.jsonPath" map="repkgStateMap">
                    <el-button size="mini" @click="repkg">解压pkg</el-button>
                </stateButton>
            </section>
            <section v-if="obj.type == 'scene' || obj.type == 'video'">
                <el-button size="mini" @click="runWallpaper">wallpaper打开</el-button>
            </section>
            <section>
                <stateButton :path="obj.jsonPath" map="copyStateMap">
                    <el-button size="mini" @click="copyDir">复制</el-button>
                </stateButton>
            </section>
        </div>
    </lazy-component>
</template>

<script>
import stateButton from '@/components/stateButton.vue';
window.fs = require('fs')
window.nodePath = require('path')
const ipcRenderer = require('electron').ipcRenderer;
const md5 = require('md5');
export default {
    name: 'state',
    data() {
        return {
        }
    },
    components: { stateButton },

    props: ['obj', 'map'],
    directives: {
        urlCache: {
            bind(el, binding) {
                try {
                    let cache = localStorage.getItem(binding.value.split('?')[0])
                    if (cache) {
                        el.src = cache + '?cache=true&rand=' + Math.random();
                    } else {
                        el.src = binding.value
                    }

                } catch (error) {
                    // console.log(binding.value);
                }
            },
            update(el, binding) {
                let cache = localStorage.getItem(binding.value.split('?')[0])
                if (cache) {
                    el.src = cache + '?cache=true&rand=' + Math.random();
                } else {
                    el.src = binding.value
                }
            },
        }, date: {
            bind(el, binding) {
                try {
                    el.innerHTML = new Date(binding.value.date).toISOString().split('T')[0];
                } catch (error) {
                    console.log(binding.value);
                }
            },
            update(el, binding) {
                try {
                    el.innerHTML = new Date(binding.value.date).toISOString().split('T')[0];
                } catch (error) {
                    console.log(binding.value);
                }
            },
        },
        size: {
            bind(el, binding) {
                try {
                    if (binding.value > 1024) {
                        el.innerHTML = (binding.value / 1024).toFixed(2) + 'GB'
                    } else {
                        el.innerHTML = Number(binding.value).toFixed(2) + 'MB'
                    }
                } catch (error) {
                    // console.log(binding.value);
                }
            },
            update(el, binding) {
                try {
                    if (binding.value > 1024) {
                        el.innerHTML = (binding.value / 1024).toFixed(2) + 'GB'
                    } else {
                        el.innerHTML = Number(binding.value).toFixed(2) + 'MB'
                    }
                } catch (error) {
                    // console.log(binding.value);
                }
            },
        },
    },
    computed: {

    },

    created() {
    },
    mounted() {
    },
    methods: {
        open(obj) {
            obj.visits ? obj.visits++ : (obj.visits = 1)
            this.$emit('changeObj', this.obj)
            ipcRenderer.send('open', obj)
        },
        cacheImg(){
            this.$emit('cacheImg',this.obj.img)
        },  
        openPath(obj) {
            ipcRenderer.send('openPath', obj.jsonPath)
        },
        rmPath(obj) {
            this.$confirm('rm path：' + obj.title + '?')
                .then(_ => {
                    ipcRenderer.send('rmPath', obj)
                    this.$emit('changeObj', this.obj,'delete')
                })
                .catch(_ => { });
        },

        reStar(obj, idx) {
            obj.star = idx + 1
            this.$emit('changeObj', this.obj)
            ipcRenderer.send('reStar', obj)
        },
        reDetail() {
            this.$emit('reDetail', this.obj)
        },
        add(obj, value) {
            obj.newTitle = value + obj.title
            ipcRenderer.send('reTitle', obj)
        },
        runWallpaper() {
            this.$emit('runWallpaper', this.obj.jsonPath)
        },
        copyDir(){
            this.$emit('copyDir', this.obj)
        },
        repkg(){
            this.$emit('repkg', this.obj)
        },
        whisper(){
            this.$emit('whisper', this.obj)
        },
        compress(){
            this.$emit('compress', this.obj)
        }


    }

}
</script>
<style lang="less" scoped>
    .content-detail:empty {
      min-height: 200px;
    }

    .content-detail {

      // padding: 5px;
      background: white;
      border: none;
      border-radius: 0px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
      -moz-box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
      -webkit-box-shadow: 0 1px 3px rgba(0, 0, 0, .3);

      // border-radius: 10px;

    }



    .img-box {
      position: relative;
      padding-top: 100%;
      width: 100%;
      background-color: #F5F7FA;
      overflow: hidden;
      padding-bottom: 0;
      // border-radius: 10px;

      .el-image {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;

        img {
          // position: absolute;
          // top: 0;
          // left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .6s;
        }
      }

      img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform .6s;
      }

      &>i {
        display: none;
        font-size: 32px;
        position: absolute;
        top: calc(50% - 16px);
        left: calc(50% - 16px);
        cursor: pointer;
        color: white;
      }

      &>.el-button {
        padding: 0;
        font-size: 10px;
        z-index: 9;
        position: absolute;
        bottom: 5px;
        left: 5px;

        // color: #606266;
        span {
          margin: 0;
          // color: #606266;
          font-weight: 100;
        }
      }

      &:hover {
        img {
          filter: brightness(0.5);
          transform: scale(1.2);
        }

        &>i {
          display: block;
        }
      }
    }

    .detail-box {
      padding: 0 5px 5px;

      &>div {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-direction: row;
      }

      &>i {
        display: block;
        text-align: right;
      }

      &>span {
        color: gray;
        display: block;
        word-break: break-word;
        text-align: right;
      }

      section button {
        width: 100%;
      }

      section+section {
        padding-top: 2px;
      }

      label {
        display: block;
        color: gray;
        word-break: break-word;
        text-align: left;
      }





      p {
        color: #67c23a;
        cursor: pointer;
        word-break: break-word;
        font-size: 12px;
        text-align: left;
      }

      p+p {
        color: #f56c6c;
      }

      .icons {
        margin-top: 5px;

        &>p:last-child {
          padding: 2px 7px;
          border: 1px solid #f56c6c;
          border-radius: 70% 0 50% 0;

          &:hover {
            // border-color: #f56c6c;
            background-color: #f56c6c;
            color: white;
          }
        }

        &>p:first-child {
          padding: 2px 7px;
          border: 1px solid #67c23a;
          border-radius: 0 70% 0 50%;

          &:hover {
            // border-color: #67c23a;
            background-color: #67c23a;
            color: white;
          }
        }
      }

      .stars {
        margin: 5px 0;

        b {
          display: block;
          background-size: cover;
          width: 15%;
          height: 0;
          padding-top: 15%;
          border-radius: 50%;
          cursor: pointer;
          transition: transform .3s;
          background-image: url(../assets/3.png);

          &:hover {
            transform: scale(0.8);
          }
        }

        .star {
          // background-color: #e6a23c;


        }

        .unstar {
          // background-color: #F5F7FA;
          filter: grayscale(1);
          // background-image: url(../assets/unstar.png);
          // background-image: url(../assets/3.png);


        }
      }
    }
</style>