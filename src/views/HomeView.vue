<template>
  <div class="home" v-loading="loading">
    <nav class="layout">
      <div class="left">
        <el-button size="big" type="primary" @click="inputFile">选取文件</el-button>
        <br>
        <el-button size="mini" type="warning" @click="clear">清空</el-button>
      </div>
      <el-form class="right" label-width="50px">
        <el-form-item>
          <span slot="label">类型：</span>
          <el-button size="mini" plain :type="type == 'video' ? 'primary' : ''"
            @click="changeType('video')">视频</el-button>
          <el-button size="mini" plain :type="type == 'scene' ? 'primary' : ''"
            @click="changeType('scene')">场景</el-button>
          <el-button size="mini" plain :type="type == 'application' ? 'primary' : ''"
            @click="changeType('application')">应用</el-button>
          <el-button size="mini" plain :type="type == 'other' ? 'primary' : ''"
            @click="changeType('other')">其他</el-button>
          <el-button size="mini" plain :type="type == 'all' ? 'primary' : ''" @click="changeType('all')">全部</el-button>
        </el-form-item>
        <el-form-item>
          <span slot="label">排序：</span>
          <el-button size="mini" plain
            :icon="key == 'date' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
            :type="key == 'date' ? 'primary' : ''" @click="sort('date')">日期</el-button>
          <el-button size="mini" plain
            :icon="key == 'star' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
            :type="key == 'star' ? 'primary' : ''" @click="sort('star')">星级</el-button>
          <el-button size="mini" plain
            :icon="key == 'allSize' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
            :type="key == 'allSize' ? 'primary' : ''" @click="sort('allSize')">大小</el-button>
          <el-button size="mini" plain
            :icon="key == 'title' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
            :type="key == 'title' ? 'primary' : ''" @click="sort('title')">标题</el-button>
          <el-button size="mini" plain
            :icon="key == 'file' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
            :type="key == 'file' ? 'primary' : ''" @click="sort('file')">文件名</el-button>
          <el-button size="mini" plain
            :icon="key == 'visits' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
            :type="key == 'visits' ? 'primary' : ''" @click="sort('visits')">阅读量</el-button>
          <el-button size="mini" plain
            :icon="key == 'videoDuration' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
            :type="key == 'videoDuration' ? 'primary' : ''" @click="sort('videoDuration')">时长</el-button>
        </el-form-item>
        <el-form-item>
          <span slot="label">过滤：</span>
          <el-button-group>
            <el-select class="filter-select filter-tags" @change="filterList(filterVal)" v-model="filterTag" size="mini"
              filterable default-first-option placeholder="tags">
              <label slot="prefix" class="fix-text" type="">标签:</label>
              <el-option label="全部" value="">
              </el-option>
              <el-option v-for="str in tags" :label="str" :value="str">
              </el-option>
            </el-select>
          </el-button-group>
          <el-button-group>
            <el-select class="filter-select" @change="filterList(filterVal)" v-model="filterFolder" size="mini" filterable
              default-first-option placeholder="tags">
              <label slot="prefix" class="fix-text" type="">文件夹:</label>
              <el-option label="全部" value="">
              </el-option>
              <el-option v-for="v, k of openFolderPathMap" :label="k" :value="k">
              </el-option>
            </el-select>
            <el-button size="mini" v-show="filterFolder" title="reread" icon="el-icon-refresh" circle
              @click="reread"></el-button>
            <el-button size="mini" v-show="filterFolder" title="clear" icon="el-icon-circle-close" circle
              @click="clearFolderRead"></el-button>
          </el-button-group>
        </el-form-item>
        <el-form-item>
          <span slot="label">设置：</span>
          <el-input size="mini" v-model="copyVal" :class="copyVal ? '' : 'warning'"
            style="width: 280px;margin-right: 10px;" placeholder="复制路径"><el-button size="mini" slot="prepend"
              @click="setPath('dir', ['copyVal'])" icon="el-icon-folder">选择复制路径</el-button>
          </el-input>
          <el-button size="mini" plain icon="el-icon-setting" @click="compressDrawer = true">压缩视频设置</el-button>
          <el-button size="mini" plain icon="el-icon-setting" @click="whisperDrawer = true">解析字幕设置</el-button>
          <el-input size="mini" v-model="wallpaperPath" style="width: 280px;margin-right: 10px;"
            placeholder="wallpaper路径"><el-button size="mini" slot="prepend" @click="setPath('file', ['wallpaperPath'])"
              icon="el-icon-folder">选择wallpaper路径</el-button>
          </el-input>
        </el-form-item>
        <el-form-item>
          <span slot="label">功能：</span>
          <el-button size="mini" @click="outList">输出数据列表</el-button>
          <el-button size="mini" @click="compressList">批量压缩视频</el-button>
          <el-button size="mini" @click="repkgList">批量解压pkg</el-button>
          <el-button size="mini" @click="xcopyList">批量复制</el-button>
          <el-button size="mini" @click="rmList">批量删除</el-button>
          <!-- <el-button size="mini" @click="outTitle">输出title</el-button> -->
          <el-button size="mini" :loading="loadingDuration" @click="getInfo"><span v-show="loadingDuration">{{
            rateDuration }}</span>获取视频时长</el-button>
          <el-button size="mini" @click="clearState">清除已操作状态</el-button>
          <!-- <el-button size="mini" @click="dataCount">数据统计</el-button> -->
          <el-button size="mini" @click="showConcat = true">合并视频</el-button>
          <el-popover trigger="hover" :popper-class="!serverState ? 'visibility-pop' : ''" placement="bottom">
            <div class="tip">
              <canvas id="qrCode"></canvas>
              <span>{{ shareUrl }}</span>
            </div>
            <el-button class="button" slot="reference" size="mini" :type="serverState ? 'success' : ''"
              @click="server">局域网内服务</el-button>
          </el-popover>
          <watchMe></watchMe>
        </el-form-item>





      </el-form>
    </nav>
    <div class="search layout">
      <el-input type="text" prefix-icon="el-icon-search" clearable :suffix="showList.length" size="mini"
        placeholder="search" v-model="filterVal" @change="filterList(filterVal)">
        <template slot="append"> {{ showList.length }}(<span v-size="showSize"></span>)</template>
      </el-input>
    </div>
    <div v-loading="showLoading">
      <div class="home-list">
        <div>
          <div class="add-project" @click="showNewProjectDialog = true">
            <i class="el-icon-circle-plus-outline"></i>
          </div>
        </div>
        <div v-for="obj, i in showList" :key="obj.jsonPath" v-loading="newStateMap[obj.jsonPath]"
          :element-loading-text="newStateMap[obj.jsonPath]" element-loading-spinner="el-icon-loading">
          <block :obj="obj" @reDetail="reDetail" @runWallpaper="runWallpaper" @copyDir="copyDir" @repkg="repkg"
            @whisper="whisper" @compress="compress" @changeObj="changeObj" @cacheImg="cacheImg"></block>
        </div>



      </div>
    </div>
    <el-backtop></el-backtop>


    <el-drawer title="字幕解析设置" :size="'50%'" :visible.sync="whisperDrawer">
      <el-form label-width="140px" :model="whisperSet">
        <el-form-item label="字幕文件类型：">
          <el-checkbox-group v-model="whisperSet.type" :min="1">
            <el-checkbox label="-ocsv" name="type">csv</el-checkbox>
            <el-checkbox label="-ovtt" name="type">vtt</el-checkbox>
            <el-checkbox label="-osrt" name="type">srt</el-checkbox>
            <el-checkbox label="-otxt" name="type">text</el-checkbox>
            <el-checkbox label="-owts" name="type">words</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="解析ai模型：">
          <el-select size="mini" style="width:130px" v-model="whisperSet.model" placeholder="">
            <el-option v-for="item in modelList" :label="item.name" :value="item.path"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="翻译：">
          <el-switch v-model="whisperSet.translate"></el-switch>
        </el-form-item>
        <el-form-item label="解析语言：">
          <el-select size="mini" style="width:130px" clearable filterable v-model="whisperSet.language" placeholder="">
            <el-option v-for="o in languageList" :key="o.value" :value="o.value" :label="o.label"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="Object.keys(downModelMap).length" label="ai模型下载：">
          <el-button v-for="(v, k) in downModelMap" size="mini" round @click="downModel(k, v)">
            {{ downPercentMap[k] ? downPercentMap[k] : k }}</el-button>
        </el-form-item>

      </el-form>
    </el-drawer>
    <el-drawer title="压缩视频设置" :size="'50%'" :visible.sync="compressDrawer">
      <el-form label-width="120px" :model="compressSet">
        <el-form-item label="分辨率：">
          <el-autocomplete size="mini" class="inline-input" style="width: 130px;;margin-right: 10px; "
            v-model="compressSet.size" :fetch-suggestions="(query, cb) => querySearch(query, cb, compressSizeList)"
            placeholder="空为不变">
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="解码器：">
          <el-select placeholder="空为不变" size="mini" clearable style="width:130px" v-model="compressSet.vcodec">
            <el-option v-for="item in compressVcodecList" :label="item.value" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="后缀：">
          <el-select placeholder="空为不变" size="mini" clearable style="width:130px" v-model="compressSet.type">
            <el-option v-for="item in compressTypeList" :label="item.value" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="帧率：">
          <el-select placeholder="空为不变" size="mini" clearable style="width:130px" v-model="compressSet.fps">
            <el-option v-for="item in compressFpsList" :label="item.value" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </el-drawer>

    <el-dialog title="新建项目" :visible.sync="showNewProjectDialog">
      <el-form label-width="100px" :model="projectVal">
        <el-form-item label="标题：">
          <el-input type="text" size="mini" v-model="projectVal.title"></el-input>
        </el-form-item>
        <el-form-item label="类型：">
          <el-radio-group v-model="projectVal.type">
            <el-radio label="video">视频</el-radio>
            <el-radio label="">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!projectVal.type" label="文件夹路径：">
          <el-input size="mini" v-model="projectVal.dirPath" style="vertical-align: baseline;"
            :class="projectVal.dirPath ? '' : 'warning'" placeholder="文件夹路径"><el-button size="mini" slot="prepend"
              @click="setPath('dir', ['projectVal', 'dirPath'])" icon="el-icon-folder">选择文件夹路径</el-button>
          </el-input>
        </el-form-item>
        <el-form-item v-else label="文件路径：">
          <el-input size="mini" v-model="projectVal.filePath" style="vertical-align: baseline;"
            :class="projectVal.filePath ? '' : 'warning'" placeholder="文件路径"><el-button size="mini" slot="prepend"
              @click="setPath('file', ['projectVal', 'filePath'])" icon="el-icon-folder">选择文件路径</el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="描述：">
          <el-input type="textarea" size="mini" v-model="projectVal.description"></el-input>
        </el-form-item>
        <el-form-item label="标签：">
          <el-select v-model="projectVal.tags" multiple filterable allow-create default-first-option placeholder="tags">
            <el-option v-for="str in tags" :label="str" :value="str">
            </el-option>
          </el-select>
        </el-form-item>


        <el-form-item label="保存路径：">
          <el-input size="mini" v-model="projectVal.savePath" style="vertical-align: baseline;"
            :class="projectVal.savePath ? '' : 'warning'" placeholder="保存路径"><el-button size="mini" slot="prepend"
              @click="setPath('dir', ['projectVal', 'savePath'])" icon="el-icon-folder">选择保存路径</el-button>
          </el-input>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" @click="showNewProjectDialog = false">取 消</el-button>
        <el-button size="mini" type="primary" @click="newProject">确 定</el-button>
      </div>
    </el-dialog>
    <el-dialog title="详情" :visible.sync="showDetailDialog">
      <el-form label-width="100px" :model="detail">
        <el-form-item label="标题：">
          <el-input type="text" size="mini" v-model="detail.title"></el-input>
        </el-form-item>
        <el-form-item label="描述：">
          <el-input type="textarea" size="mini" v-model="detail.description"></el-input>
        </el-form-item>
        <el-form-item label="标签：">
          <el-select v-model="detail.tags" multiple filterable allow-create default-first-option placeholder="tags">
            <el-option v-for="str in tags" :label="str" :value="str">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" @click="showDetailDialog = false">取 消</el-button>
        <el-button size="mini" type="primary" @click="saveDetail">确 定</el-button>
      </div>
    </el-dialog>
    <concatVideo v-model.sync="showConcat" />
  </div>
</template>

<script>

window.fs = require('fs')
window.nodePath = require('path')
const ipcRenderer = require('electron').ipcRenderer;
const md5 = require('md5');
import block from '@/components/block.vue';
import concatVideo from '@/components/concatVideo.vue';
import watchMe from '@/components/watchMe.vue';

var QRCode = require('qrcode')
export default {
  name: 'HomeView',
  data() {
    return {
      loading: false,
      allDataMap: {},
      filterVal: '',
      showList: [],
      showSize: 0,
      showLoading: false,
      key: 'date',
      sortT: 1,
      type: 'all',
      serverState: false,
      shareUrl: '',
      copyVal: '',
      compressDrawer: false,
      compressSet: {},
      compressSizeList: [{
        value: '1920*1080'
      }, {
        value: '1080*720'
      }],
      compressFpsList: [{
        value: '30'
      }, {
        value: '25'
      }],
      compressVcodecList: [{
        //   value: 'copy'
        // }, {
        value: 'libx264'
      }, {
        value: 'libx265'
      }],
      compressTypeList: [{
        value: '.mp4'
      }, {
        value: '.avi'
      }, {
        value: '.ts'
      }, {
        value: '.flv'
      }],
      openFolderPathMap: {},
      whisperDrawer: false,
      whisperSet: { type: ['-ovtt'], model: '' },
      modelList: [],
      downModelMap: {
        'ggml-small.bin': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
        'ggml-medium.bin': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
        'ggml-large.bin': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large.bin',
        'ggml-tiny.bin': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin'
      },
      downPercentMap: {},
      languageList: [
        {
          "label": "Arabic",
          "value": "ar"
        },
        {
          "label": "Armenian",
          "value": "hy"
        },
        {
          "label": "Azerbaijani",
          "value": "az"
        },
        {
          "label": "Basque",
          "value": "eu"
        },
        {
          "label": "Belarusian",
          "value": "be"
        },
        {
          "label": "Bengali",
          "value": "bn"
        },
        {
          "label": "Bulgarian",
          "value": "bg"
        },
        {
          "label": "Catalan",
          "value": "ca"
        },
        {
          "label": "Chinese",
          "value": "zh"
        },
        {
          "label": "Croatian",
          "value": "hr"
        },
        {
          "label": "Czech",
          "value": "cs"
        },
        {
          "label": "Danish",
          "value": "da"
        },
        {
          "label": "Dutch",
          "value": "nl"
        },
        {
          "label": "English",
          "value": "en"
        },
        {
          "label": "Estonian",
          "value": "et"
        },
        {
          "label": "Filipino",
          "value": "tl"
        },
        {
          "label": "Finnish",
          "value": "fi"
        },
        {
          "label": "French",
          "value": "fr"
        },
        {
          "label": "Galician",
          "value": "gl"
        },
        {
          "label": "Georgian",
          "value": "ka"
        },
        {
          "label": "German",
          "value": "de"
        },
        {
          "label": "Greek",
          "value": "el"
        },
        {
          "label": "Gujarati",
          "value": "gu"
        },
        {
          "label": "Hebrew",
          "value": "iw"
        },
        {
          "label": "Hindi",
          "value": "hi"
        },
        {
          "label": "Hungarian",
          "value": "hu"
        },
        {
          "label": "Icelandic",
          "value": "is"
        },
        {
          "label": "Indonesian",
          "value": "id"
        },
        {
          "label": "Irish",
          "value": "ga"
        },
        {
          "label": "Italian",
          "value": "it"
        },
        {
          "label": "Japanese",
          "value": "ja"
        },
        {
          "label": "Kannada",
          "value": "kn"
        },
        {
          "label": "Korean",
          "value": "ko"
        },
        {
          "label": "Latin",
          "value": "la"
        },
        {
          "label": "Latvian",
          "value": "lv"
        },
        {
          "label": "Lithuanian",
          "value": "lt"
        },
        {
          "label": "Macedonian",
          "value": "mk"
        },
        {
          "label": "Malay",
          "value": "ms"
        },
        {
          "label": "Maltese",
          "value": "mt"
        },
        {
          "label": "Norwegian",
          "value": "no"
        },
        {
          "label": "Persian",
          "value": "fa"
        },
        {
          "label": "Polish",
          "value": "pl"
        },
        {
          "label": "Portuguese",
          "value": "pt"
        },
        {
          "label": "Romanian",
          "value": "ro"
        },
        {
          "label": "Russian",
          "value": "ru"
        },
        {
          "label": "Serbian",
          "value": "sr"
        },
        {
          "label": "Slovak",
          "value": "sk"
        },
        {
          "label": "Slovenian",
          "value": "sl"
        },
        {
          "label": "Spanish",
          "value": "es"
        },
        {
          "label": "Swahili",
          "value": "sw"
        },
        {
          "label": "Swedish",
          "value": "sv"
        },
        {
          "label": "Tamil",
          "value": "ta"
        },
        {
          "label": "Telugu",
          "value": "te"
        },
        {
          "label": "Thai",
          "value": "th"
        },
        {
          "label": "Turkish",
          "value": "tr"
        },
        {
          "label": "Ukrainian",
          "value": "uk"
        },
        {
          "label": "Urdu",
          "value": "ur"
        },
        {
          "label": "Vietnamese",
          "value": "vi"
        },
        {
          "label": "Welsh",
          "value": "cy"
        },
        {
          "label": "Yiddish",
          "value": "yi"
        }
      ],
      showNewProjectDialog: false,
      newStateMap: {},
      projectVal: {
        type: '',
        title: '',
        savePath: '',
        filePath: '',
        dirPath: '',
        tags: [],
        description: ''
      },
      showDetailDialog: false,
      detail: {
        description: '',
        tags: []
      },
      tags: ['Music'],
      filterTag: '',
      filterFolder: '',
      wallpaperPath: '',
      imgCachePath: '',
      loadingDuration: false,
      rateDuration: '',
      showConcat: false
    }
  },
  components: { block, concatVideo, watchMe },
  directives: {
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
  watch: {
    filterVal(n) {
      if (n == '665533') {
        ipcRenderer.send('openTool')
      }
    },
    copyVal(n) {
      localStorage.setItem('copyVal', n || "")
    },

    wallpaperPath(n) {
      localStorage.setItem('wallpaperPath', n || "")
    },
    showList: {
      deep: true,
      handler(n) {
        if (this.serverState) {
          ipcRenderer.send('reServeList', this.showList, this.openFolderPathMap)
        }
      }
    },
    tags: {
      deep: true,
      handler(n) {
        localStorage.setItem('tags', JSON.stringify(n))
      }
    }
  },
  created() {
    window.onon = () => {

      console.log(this.$store.state);
      this.$store.commit('setRepkgStateMap', ["D:\\Steam\\steamapps\\workshop\\content\\431960\\1350400986\\project.json", Math.random() * 1000])
    }
    sessionStorage.getItem('imgCachePath') && (this.imgCachePath = sessionStorage.getItem('imgCachePath'))
    this.copyVal = localStorage.getItem('copyVal') || ''
    this.wallpaperPath = localStorage.getItem('wallpaperPath') || ''
    if (!this.wallpaperPath) {
      ipcRenderer.send('wallpaperPath')
    }
    this.tags = localStorage.getItem('tags') ? JSON.parse(localStorage.getItem('tags')) : ['Music']
    let old = localStorage.getItem('allDataMap')
    if (old) {
      Object.assign(this.allDataMap, JSON.parse(old))
      this.openFolderPathMap = JSON.parse(localStorage.getItem('openFolderPathMap') || '{}')
      this.filterList(this.filterVal)
    }
    old = ''
    ipcRenderer.on('callMap', (e, map, openFolderPath, tags) => {
      this.loading = false
      if (Object.keys(map).length) {
        this.openFolderPathMap[openFolderPath] = window.btoa(openFolderPath).match(/[0-9a-zA-Z]/g).join('')
        Object.assign(this.allDataMap, map)
        localStorage.setItem('allDataMap', JSON.stringify(this.allDataMap))
        this.filterList(this.filterVal)
        localStorage.setItem('openFolderPathMap', JSON.stringify(this.openFolderPathMap))
        this.tags = [...new Set(this.tags.concat(tags))]
      }
      map = ''
    })

    ipcRenderer.on('percent', (e, obj) => {
      this.$store.commit('setCompressStateMap', [obj.jsonPath, obj.percent])
    })
    ipcRenderer.on('whisperPercent', (e, obj) => {
      this.$store.commit('setWhisperStateMap', [obj.jsonPath, obj.percent])
    })
    ipcRenderer.on('copyPercent', (e, obj) => {
      this.$store.commit('setCopyStateMap', [obj.jsonPath, obj.percent])
    })
    ipcRenderer.on('repkgPercent', (e, obj) => {
      this.$store.commit('setRepkgStateMap', [obj.jsonPath, obj.percent])
    })
    ipcRenderer.on('newPercent', (e, obj) => {
      this.$set(this.newStateMap, obj.jsonPath, obj.percent)
    })


    ipcRenderer.on('modelList', (e, ls) => {
      // console.log('ls: ', ls);
      ls.forEach(obj => {
        delete this.downModelMap[obj.name]
      })
      this.modelList = ls
      this.whisperSet.model = ls[0]?.path
    })
    ipcRenderer.on('downPercent', (e, obj) => {
      if (obj.code) {
        this.$notify({
          title: 'error',
          message: obj.name + '模型下载失败，curl错误码' + obj.code,
          duration: 0
        });
        this.$delete(this.downPercentMap, obj.name)
      } else {
        this.$set(this.downPercentMap, obj.name, obj.percent)
      }
    })

    ipcRenderer.on('shareUrl', (e, str) => {
      this.shareUrl = str
      var canvas = document.getElementById('qrCode')
      QRCode.toCanvas(canvas, str, {
        height: 150,
        width: 150
      }, function (error) {
        if (error) console.error(error)
      })
    })



    ipcRenderer.on('newTitle', (e, obj) => {
      console.log('obj: ', obj);
      this.showList.some((o, i) => {
        if (o.jsonPath == obj.jsonPath) {
          o.title = obj.newTitle
          this.$set(this.showList[i], 'title', o.title)
          return true
        } else {
          return false
        }
      })
      this.allDataMap[obj.jsonPath]['title'] = obj.newTitle
      localStorage.setItem('allDataMap', JSON.stringify(this.allDataMap))
      this.$message({
        type: 'success',
        message: 'new title: ' + obj.newTitle
      });
    })

    ipcRenderer.on('reDetail', (e, obj) => {
      console.log('obj: ', obj);
      this.showList.some((o, i) => {
        if (o.jsonPath == obj.jsonPath) {
          this.$set(this.showList[i], 'title', obj.title)
          this.$set(this.showList[i], 'description', obj.description)
          this.$set(this.showList[i], 'tags', obj.tags)
          return true
        } else {
          return false
        }
      })
      this.allDataMap[obj.jsonPath]['title'] = obj.title
      this.allDataMap[obj.jsonPath]['description'] = obj.description
      this.allDataMap[obj.jsonPath]['tags'] = obj.tags
      localStorage.setItem('allDataMap', JSON.stringify(this.allDataMap))
      this.$message({
        type: 'success',
        message: 'new detail'
      });
    })

    ipcRenderer.on('refreshImg', (e, obj) => {
      const souceUrl = obj.img.split('?')[0]
      let to = nodePath.join(this.imgCachePath, md5(souceUrl))
      fs.copyFile(decodeURIComponent(encodeURIComponent(souceUrl)), decodeURIComponent(to), (err) => {
        if (err) {
          console.log('err: ', err);
        } else {
          localStorage.setItem(souceUrl, to)
        }
        this.showList.some(o => {
          if (o.filePath == obj.filePath) {
            o.img = o.img.split('?')[0] + '?rand=' + Math.random();
            return true
          } else {
            return false
          }
        })
        this.allDataMap[obj.jsonPath]['img'] = this.allDataMap[obj.jsonPath]['img'].split('?rand=')[0] + '?rand=' + Math.random();
      })

    })

    ipcRenderer.on('log', (e, ...msg) => {
      console.warn(...msg);
    })
    ipcRenderer.on('wallpaperPath', (e, str) => {
      this.wallpaperPath = str
    })

    ipcRenderer.on('imgCachePath', (e, string) => {
      console.log('string: ', string);
      this.imgCachePath = string
      sessionStorage.setItem('imgCachePath', string)
    })

    ipcRenderer.on('videoDuration', (e, obj) => {
      Object.keys(obj).forEach(k => {
        Object.assign(this.allDataMap[k], obj[k])
      })
      // this.showList.forEach((ele,i) => {
      //   if(obj[ele.jsonPath]){
      //     // Object.assign(ele,obj[ele.jsonPath])
      //     this.$set(this.showList[i],'videoDuration',obj[ele.jsonPath].videoDuration)
      //   }
      // });
      this.showList.length = 0
      this.showList.splice(0, 0)
      this.filterList(this.filterVal)
      this.loadingDuration = false
      this.rateDuration = ''
      localStorage.setItem('allDataMap', JSON.stringify(this.allDataMap))
    })
    ipcRenderer.on('rateDuration', (e, s) => {
      this.rateDuration = s
    })



  },
  methods: {

    clearState() {
      this.$store.commit('clear')
    },
    inputFile() {
      this.loading = true
      ipcRenderer.send('readJSON')
    },


    cacheImg(url) {
      const souceUrl = url.split('?')[0]
      if (url.indexOf('?cache=true') == -1 && !localStorage.getItem(souceUrl)) {
        let to = nodePath.join(this.imgCachePath, md5(souceUrl))
        fs.copyFile(decodeURIComponent(souceUrl), decodeURIComponent(to), (err) => {
          if (err) {
            console.log('err: ', err);
          } else {
            localStorage.setItem(souceUrl, to)
          }
        })
      }
    },
    async dataCount() {
      ipcRenderer.send('openTool')
      await new Promise(res => {
        setTimeout(res, 3000);
      })
      let newRetSize = {},
        newRetNum = {},
        starToSize = [0, 0, 0, 0, 0, 0],
        starToNum = [0, 0, 0, 0, 0, 0]
      this.showList.forEach(obj => {
        starToSize[obj['star'] || 0] += Number(obj.size)
        starToNum[obj['star'] || 0]++
        let newstr = (obj.title.toLowerCase().match(/^[0-9a-zA-Z\-]+/) || 'null').toString().split('-')[0];
        newRetSize[newstr] = (newRetSize[newstr] || 0) + Number(obj.size)
        newRetNum[newstr] = (newRetNum[newstr] || 0) + 1
      })
      console.log('key的次数--------');
      console.table(newRetNum)
      console.log('key的大小合集（m）---------');
      console.table(newRetSize);
      console.log('评级对应大小: ',);
      console.table(starToSize)
      console.log('评级对应个数: ',);
      console.table(starToNum);

    },
    clear() {
      for (let key in this.allDataMap) {
        delete this.allDataMap[key];
      }
      this.showList.length = 0
      this.showList.splice(0, 0)
      for (let key in this.openFolderPathMap) {
        delete this.openFolderPathMap[key];
      }
      this.filterFolder = ''
      localStorage.clear()
      let dir = nodePath.join(this.imgCachePath)
      let files = fs.readdirSync(dir)
      for (var i = 0; i < files.length; i++) {
        let newPath = nodePath.join(dir, files[i]);
        fs.unlinkSync(newPath);
      }

    },


    changeObj(obj, type) {
      if (type == 'delete') {
        this.showList.some((o, i) => {
          if (o.jsonPath == obj.jsonPath) {
            this.showList.splice(i, 1)
            return true
          } else {
            return false
          }
        })
        delete this.allDataMap[obj.jsonPath]
      } else {
        this.allDataMap[obj.jsonPath] = obj
      }
      localStorage.setItem('allDataMap', JSON.stringify(this.allDataMap))
    },
    reDetail(obj) {
      this.detail = JSON.parse(JSON.stringify(obj));
      this.showDetailDialog = true;
    },
    saveDetail() {
      ipcRenderer.send('reDetail', this.detail)
      this.showDetailDialog = false;
    },
    outList() {
      ipcRenderer.send('outList', this.showList)
    },
    sort(key) {
      if (key) {
        if (this.key == key) {
          this.sortT = this.sortT * -1
        } else {
          this.key = key
        }
      }
      if (this.key == 'title' || this.key == 'file') {
        // this.showList = 
        this.showList.sort((a, b) => {
          if ((b[this.key] || '').toUpperCase() > (a[this.key] || '').toUpperCase()
          ) {
            return this.sortT
          } else {
            return this.sortT * -1
          }
        })
      } else {
        // this.showList = 
        this.showList.sort((a, b) => { return ((b[this.key] || 0) - (a[this.key] || 0)) * this.sortT })
      }
      document.body.scrollTop = document.documentElement.scrollTop = 1
      document.body.scrollTop = document.documentElement.scrollTop = 0

    },
    filterList(n) {
      this.showLoading = true
      let isType = (obj) => {
        if (this.type == 'all') {
          return true
        } else if (this.type == 'other') {
          return obj.type != 'video' && obj.type != 'scene' && obj.type != 'application'
        } else {
          return obj.type == this.type
        }
      }
      let isTag = (obj) => {
        if (this.filterTag == '') {
          return true
        } else {
          return obj.tags.indexOf(this.filterTag) != -1
        }
      }
      let isFolder = (obj) => {
        // console.log('obj: ', obj);
        if (this.filterFolder == '') {
          return true
        } else {
          return obj.openFolderPath == this.filterFolder
        }
      }
      this.showList.length = 0;
      this.showSize = 0
      // this.showList.splice(0, this.showList.length)
      for (const key in this.allDataMap) {
        let obj = this.allDataMap[key]
        if (!n) {
          if (isType(obj) && isTag(obj) && isFolder(obj)) {
            this.showList.push(obj)
            this.showSize += Number(obj.allSize)
          }
        } else {
          let reg = new RegExp(n, 'i');
          if ((reg.test(obj.title) || reg.test(obj.file)) && isType(obj) && isTag(obj) && isFolder(obj)) {
            this.showList.push(obj)
            this.showSize += Number(obj.allSize)
          }
        }

      }

      this.sort()
      // this.$nextTick(() => {
      setTimeout(() => {
        this.showLoading = false
      }, 0);
      // })
    },
    changeType(type) {
      this.type = type;
      this.filterList(this.filterVal)
    },

    repkg(obj) {
      this.$store.commit('setRepkgStateMap', [obj.jsonPath, 'waiting'])
      ipcRenderer.send('repkg', obj)
    },
    repkgList() {
      let filter = [];
      this.showList.forEach(obj => {
        if (obj.type == 'scene') {
          this.$store.commit('setRepkgStateMap', [obj.jsonPath, 'waiting'])
          filter.push(obj)
        }
      })
      ipcRenderer.send('repkgList', filter)
    },
    compress(obj) {
      if (!this.compressSet.type && !this.compressSet.vcodec && !this.compressSet.size && !this.compressSet.fps) {
        this.compressDrawer = true
        this.$message({
          type: 'warning',
          message: '未选择压缩设置'
        });
        return false
      }
      this.$store.commit('setCompressStateMap', [obj.jsonPath, 'waiting'])
      ipcRenderer.send('compress', obj, this.compressSet)
    },
    compressList() {
      if (!this.compressSet.type && !this.compressSet.vcodec && !this.compressSet.size && !this.compressSet.fps) {
        this.compressDrawer = true
        this.$message({
          type: 'warning',
          message: '未选择压缩设置'
        });
        return false
      }
      this.$confirm('', '压缩显示的所有视频', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(({ value }) => {
        let filter = [];
        this.showList.forEach(obj => {
          if (obj.type == 'video') {
            this.$store.commit('setCompressStateMap', [obj.jsonPath, 'waiting'])
            filter.push(obj)
          }
        })
        console.log('filter: ', filter);
        ipcRenderer.send('compressList', filter, this.compressSet)
      }).catch(() => {
      });
    },
    server() {
      this.serverState = !this.serverState
      ipcRenderer.send('share', this.serverState, this.showList, this.openFolderPathMap)
    },
    copyDir(obj) {
      if (!this.copyVal) {
        this.$message({
          type: 'warning',
          message: '未选择路径 '
        });
        return false
      }
      this.$store.commit('setCopyStateMap', [obj.jsonPath, 'waiting'])
      ipcRenderer.send('copyDir', obj, this.copyVal)
    },
    xcopyList() {
      if (!this.copyVal) {
        this.$message({
          type: 'warning',
          message: '未选择路径 '
        });
        return false
      }
      let list = this.showList
      list.forEach(obj => {
        this.$store.commit('setCopyStateMap', [obj.jsonPath, 'waiting'])
      })
      ipcRenderer.send('xcopyList', list, this.copyVal)
    },
    rmList() {
      this.$prompt('', '批量删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: '',
        inputPlaceholder: '665533',
        inputType: 'number'
      }).then(({ value }) => {

        if (value == "665533") {
          console.log('value: ', value);
          this.showList.forEach((obj) => {
            ipcRenderer.send('rmPath', obj)
            delete this.allDataMap[obj.jsonPath]
          })
          this.showList.length = 0;
          this.showList.splice(0, 0)
          localStorage.setItem('allDataMap', JSON.stringify(this.allDataMap))
        } else {
          this.$message({
            type: 'warning',
            message: 'error password'
          });
        }
      }).catch(() => {
        this.$message({
          type: 'info',
          message: 'cancel'
        });
      });
    },
    setPath(type, arr) {
      let properties = type == 'file' ? ['openFile'] : ['openDirectory']
      ipcRenderer.invoke("setPath", {
        properties
      }).then(obj => {
        console.log('obj: ', obj);
        if (!obj.canceled) {
          let s = obj.filePaths[0];
          arr.reduce((a, b, i) => {
            if ((i + 1) == arr.length) {
              a[b] = s
              if (b == 'filePath'&&this.projectVal.title == '') {
                  this.$set(this.projectVal, 'title', nodePath.basename(s))
              }
            }
            return a[b]
          }, this)


        }

      })

    },
    async outTitle() {
      ipcRenderer.send('openTool')
      await new Promise(res => {
        setTimeout(res, 3000);
      })
      let out = {}
      for (const key in this.allDataMap) {
        out[this.allDataMap[key].title] = out[this.allDataMap[key].title] ? out[this.allDataMap[key].title] + 1 : 1
      }
      console.log('out: ', out);
    },
    whisper(obj) {
      this.$store.commit('setWhisperStateMap', [obj.jsonPath, 'waiting'])
      ipcRenderer.send('whisperCpp', obj, this.whisperSet)
    },
    searchTags(q, cb) {
      var r = this.tags;
      var results = q ? r.filter(v => (v.toLowerCase().indexOf(q.toLowerCase()) === 0)) : r;
      let b = results.map(s => {
        return { value: s, label: s }
      })
      b.shift({ value: '', label: 'All' })
      cb(b);
    },
    querySearch(queryString, cb, list) {
      var restaurants = list;
      var results = queryString ? restaurants.filter(this.createFilter(queryString)) : restaurants;
      cb(results);
    },
    createFilter(queryString) {
      return (restaurant) => {
        return (restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0);
      };
    },
    downModel(name, url) {
      if (!this.downPercentMap[name]) {
        ipcRenderer.send('downModel', name, url)
      }
    },
    newProject() {
      if (this.projectVal.type) {
        if (!this.projectVal.filePath) {
          this.$message({
            type: 'warning',
            message: 'empty'
          });
          return
        }
      } else {
        if (!this.projectVal.dirPath) {
          this.$message({
            type: 'warning',
            message: 'empty'
          });
          return
        }
      }
      ipcRenderer.send('newProject', this.projectVal)
      this.showNewProjectDialog = false
      Object.assign(this.projectVal, {
        // type: '',
        title: '',
        // savePath: '',
        filePath: '',
        dirPath: '',
        // tags: [],
        description: ''
      })
    },
    getInfo() {
      if (this.loadingDuration) {
        return false
      }
      this.loadingDuration = true
      let list = [];
      this.showList.forEach((obj) => {
        if (obj.type == 'video' && !obj.videoDuration) {
          list.push({ j: obj.jsonPath, v: obj.filePath })
        }
      })
      console.log('list: ', list);
      if (!list.length) {
        this.loadingDuration = false
        this.rateDuration = ''
        return false
      }
      this.rateDuration = '0/' + list.length
      ipcRenderer.send('getListInfo', list)
    },
    reread() {
      if (this.filterFolder) {
        this.loading = true
        this.showList.length = 0
        for (let key in this.allDataMap) {
          if (this.allDataMap[key].openFolderPath == this.filterFolder) {
            delete this.allDataMap[key];
          }
        }
        ipcRenderer.send('readJSON', this.filterFolder)
      }
    },
    clearFolderRead() {
      if (this.filterFolder) {
        this.showList.length = 0
        this.showList.splice(0, 0)
        for (let key in this.allDataMap) {
          if (this.allDataMap[key].openFolderPath == this.filterFolder) {
            delete this.allDataMap[key];
          }
        }
        delete this.openFolderPathMap[this.filterFolder];
        localStorage.setItem('openFolderPathMap', JSON.stringify(this.openFolderPathMap))
      }
    },
    runWallpaper(path) {
      if (path + '-A' == this.$store.state.runningWallpaper) {
        ipcRenderer.send('closeWallpaper')
        this.$store.commit('setRunningWallpaper', '')
      } else {
        if (!this.wallpaperPath) {
          this.$message({
            type: 'warning',
            message: '请先选择wallpaper32.exe路径'
          });
          return false
        }
        ipcRenderer.send('runWallpaper', path, this.wallpaperPath)
        this.$store.commit('setRunningWallpaper', path + '-A')
      }

    },
    toTop() {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      })
    }
  }

}
</script>
<style lang="less">
.el-notification__content p {
  word-break: break-all;
}

.home {
  min-height: 100vh;
}

.search {
  position: sticky;
  top: 0;
  z-index: 999;
  padding: 0 10px;
}

.warning {

  input,
  button,
  div {
    border-color: red;
  }
}

.visibility-pop {
  visibility: hidden
}

.layout {
  display: flex;
  flex-direction: column;
  flex-flow: row;
  padding-top: 5px;

  span {
    font-size: 12px;
  }

  .left,
  .right {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }

  .button {
    margin-right: 10px;
  }

  .left {
    padding: 30px 30px;
  }

  .right {
    align-items: baseline;

    .filter-select {
      .el-input__prefix {
        left: 0;
        box-sizing: border-box;
        border: 1px solid transparent;
        background-color: #c0c4cc45;
        // rgb(0 0 0 / 10%);
        border-radius: 5px 0 0 5px;
      }

      .el-input__inner {
        padding-left: 70px;
      }

      .fix-text {
        display: inline-block;
        // box-sizing: border-box;
        height: 28px;
        line-height: 28px;
        color: #606266;
        width: 40px;
        // border-color: rgb(0 0 0 / 10%);
        padding: 0 10px;
        // background-color: transparent;
      }
    }

    .filter-tags {
      width: 160px;
    }

    .el-form-item {
      margin: 0;
    }

    .el-form-item__label {
      line-height: 2;
    }

    .el-button-group {
      margin-right: 10px;
      margin-bottom: 5px;

      .el-select {
        float: left;
      }
    }

    .el-form-item__content {
      line-height: unset;
    }

    .el-form-item__content>.el-button,
    .el-form-item__content>.el-input,
    .el-form-item__content>.el-autocomplete,
    .el-form-item__content>.el-select {
      margin-right: 10px;
      margin-bottom: 5px;
    }

    .el-button+.el-button {
      margin-left: 0;
    }
  }
}

.tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 160px;

  canvas {
    width: 150px;
    height: 150px;
  }
}

.check-input {
  width: 0;
  visibility: hidden;
  height: 10px;
}





.home-list {
  display: flex;
  flex-wrap: wrap;

  // min-width:  100vw;
  .el-button,
  .el-button.is-round {
    padding: 7px 0;
  }

  .el-loading-spinner {
    flex-direction: column;
  }

  .el-loading-text {
    text-align: center;
  }

  .add-project {
    cursor: pointer;
    position: relative;
    padding-top: 100%;
    width: 100%;
    // background-color: #F5F7FA;
    background-color: white;

    overflow: hidden;
    padding-bottom: 0;
    border: none;
    border-radius: 0px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .3);

    i {
      font-size: 32px;
      position: absolute;
      top: calc(50% - 16px);
      left: calc(50% - 16px);
      cursor: pointer;
    }
  }

  // .content-detail {
  //   width: 100%;
  //     display: flex;
  //     align-items: center;
  //     justify-content: space-between;
  //     flex-direction: column;
  // }

  &>div {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 10%;
    border-radius: 5px;
    padding: 5px;
    text-align: center;
    font-size: 12px;







  }
}

@media screen and (min-width:1200px) {
  .home-list>div {
    width: 10%;
  }
}

@media screen and (max-width:1200px) {
  .home-list>div {
    width: calc(100%/6);
  }
}

@media screen and (max-width:700px) {
  .home-list>div {
    width: calc(100%/3);
  }
}
</style>