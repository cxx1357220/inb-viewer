<template>
  <div class="face-api">
    <div class="toolbar">
      <span class="title">Face API</span>
      <el-tag :type="modelsLoaded ? 'success' : 'info'" size="mini">
        {{ modelsLoaded ? '模型已加载' : '模型加载中...' }}
      </el-tag>
      <template v-if="modelsLoaded">
        <span class="threshold-label">识别阈值: {{ threshold.toFixed(2) }}</span>
        <el-slider v-model="threshold" :min="0.3" :max="0.8" :step="0.05" :style="{ width: '150px' }"
          @input="groupFaces"></el-slider>
        <el-button size="mini" icon="el-icon-menu" class="drawer-btn" @click="drawerVisible = true">档案管理</el-button>
      </template>
    </div>

    <div class="main-content" v-loading="loading" :element-loading-text="loadingText">
      <div class="image-list">
        <div v-for="(item, idx) in list" :key="idx" :ref="'imgItem' + idx"
          :class="['image-item', { active: currentIdx === idx }]" @click="selectImage(idx)">
          <img :src="'file://' + (item.img || '').split('?')[0]" @error="onImgError" />
          <div class="image-info">
            <span class="image-title">{{ item.title || '未命名' }}</span>
            <el-badge :value="results[idx] ? results[idx].length : 0"
              :type="results[idx] && results[idx].length ? 'primary' : 'info'" class="face-badge">
            </el-badge>
          </div>
        </div>
      </div>

      <div class="main-panel">
        <div v-if="!loading && faceGroups.length === 0" class="empty-tip">
          未检测到人脸
        </div>
        <div class="groups-grid">
          <el-collapse v-model="activeGroups">
            <el-collapse-item v-for="(group, gi) in faceGroups" :key="gi" :name="gi">
              <template #title>
                <span class="group-title">{{ group.name || '未命名' }}</span>
                <span class="group-count">{{ group.faces.length }}张</span>
              </template>
              <div class="group-faces">
                <div v-for="face in group.faces" :key="face.id" :data-img-idx="face.imgIdx"
                  :class="['group-face', { highlight: face.imgIdx === currentIdx }]">
                  <img :src="face.thumb" @click="selectImage(face.imgIdx)" />
                  <span class="face-age">{{ face.age.toFixed(0) }}岁 {{ face.gender }}</span>
                  <el-button size="mini" type="text" class="save-btn"
                    @click.stop="openSaveFace(face, gi)">录入</el-button>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </div>

    <el-dialog title="录入人脸信息" :visible.sync="saveDialog.visible" width="360px" @keyup.enter.native="confirmSaveFace">
      <el-form label-width="70px">
        <el-form-item label="姓名">
          <el-input v-model="saveDialog.name" placeholder="请输入姓名" ref="saveInput" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="mini" @click="saveDialog.visible = false">取消</el-button>
        <el-button size="mini" type="primary" @click="confirmSaveFace">确定</el-button>
      </span>
    </el-dialog>

    <el-drawer title="档案管理" :visible.sync="drawerVisible" direction="rtl" size="360px">
      <div v-if="baseFaceGroup.length === 0" class="empty-tip">暂无档案</div>
      <div v-for="(entry, idx) in baseFaceGroup" :key="idx" class="base-entry">
        <div class="base-entry-thumb">
          <img v-if="entry.value && entry.value[0] && entry.value[0].thumb" :src="'file://' + entry.value[0].thumb" />
          <div v-else class="thumb-placeholder">无</div>
        </div>
        <div class="base-entry-info">
          <div class="base-entry-name">{{ entry.name }}</div>
          <div class="base-entry-count">{{ entry.value[0].gender }}</div>
        </div>
        <div class="base-entry-actions">
          <el-button size="mini" icon="el-icon-folder-opened"
            @click="openPath(entry.value && entry.value[0] && entry.value[0].thumb)"></el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="deleteBaseGroup(idx)"></el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
// face-api.js 在 Electron 渲染进程（nodeIntegration=true）中，isBrowser() 和 isNodejs()
// 都返回 true，而 isNodejs() 后执行会覆盖 browser env，导致 createCanvasElement 走
// `new HTMLCanvasElement()` → Illegal constructor。
// 官方修复（face-api.js issue #157 / #3）：直接传 createCanvasElement / createImageElement
// 函数给 monkeyPatch，绕过 `new Canvas()` 分支。
const faceapi = require('face-api.js')
const path = require('path')
const fs = require('fs')
const { ipcRenderer } = require('electron')
faceapi.env.monkeyPatch({
  createCanvasElement: () => document.createElement('canvas'),
  createImageElement: () => document.createElement('img'),
})

export default {
  name: 'faceApi',
  data() {
    return {
      list: [],
      modelsLoaded: false,
      processing: false,
      processProgress: 0,
      loading: true,
      loadingText: '加载模型中...',
      currentIdx: null,
      results: {},
      allFaces: [],
      faceGroups: [],
      threshold: 0.5,
      activeGroups: [],
      baseFaceGroup: [],
      faceCachePath: '',
      faceGroupJsonPath: '',
      drawerVisible: false,
      saveDialog: {
        visible: false,
        name: '',
        face: null,
        gi: null,
      },
    }
  },
  async created() {
    const baseConfig = JSON.parse(localStorage.getItem('baseConfig') || '{}')
    this.faceCachePath = baseConfig.faceCachePath
    this.faceGroupJsonPath = path.join(baseConfig.faceCachePath, 'faceGroup.json')
    if (fs.existsSync(this.faceGroupJsonPath)) {
      this.baseFaceGroup = JSON.parse(fs.readFileSync(this.faceGroupJsonPath, 'utf8')) || []
    }
    let modelPath = baseConfig.faceApiModelPath
    if (!modelPath) {
      this.$message.error('未找到模型路径配置')
      return
    }
    modelPath = 'file://' + modelPath.replaceAll('\\', '/').replaceAll(' ', '%20')
    try {
      await Promise.all([
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
        faceapi.nets.ageGenderNet.loadFromUri(modelPath),
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath)
      ])
      this.modelsLoaded = true
      let rawList = (this.$route.params && this.$route.params.list) || []
      this.list = rawList.map(item => {
        if (typeof item === 'string') return { img: item, title: path.basename(item) }
        return item
      })
      if (this.list.length) {
        this.processAllImages()
      }
      ipcRenderer.on('faceApiImgList', (e, obj) => {
        console.log('obj: ', obj);
        const rawList = obj.list || []
        if (!rawList.length) return
        this.$confirm('是否执行新的图片列表？', '提示', {
          type: 'warning',
        }).then(() => {
          this.list = rawList.map(item => {
            if (typeof item === 'string') return { img: item, title: path.basename(item) }
            return item
          })
          if (this.modelsLoaded) {
            this.processAllImages()
          }
        }).catch(() => { })
      })
    } catch (err) {
      console.error('模型加载失败:', err)
      this.loading = false
      this.$message.error('模型加载失败: ' + err.message)
    }
  },
  methods: {
    onImgError(e) {
      e.target.style.display = 'none'
    },
    openSaveFace(face, gi) {
      const group = this.faceGroups[gi]
      this.saveDialog = {
        visible: true,
        name: group && group.name ? group.name : '',
        face,
        gi,
      }
      this.$nextTick(() => {
        if (this.$refs.saveInput) this.$refs.saveInput.focus()
      })
    },
    confirmSaveFace() {
      const name = (this.saveDialog.name || '').trim()
      if (!name) {
        this.$message.warning('请输入姓名')
        return
      }
      const { face, gi } = this.saveDialog
      if (!face || !face.descriptor) {
        this.$message.error('人脸数据缺失')
        return
      }
      try {
        const descArr = Array.isArray(face.descriptor)
          ? face.descriptor
          : Array.from(face.descriptor)



        const ext = '.jpg'
        const thumbFile = `${name}${ext}`
        const thumbFullPath = path.join(this.faceCachePath, thumbFile)
        const base64Data = face.thumb.replace(/^data:image\/\w+;base64,/, '')
        fs.writeFileSync(thumbFullPath, base64Data, 'base64')


        const faceEntry = {
          descriptor: descArr,
          age: face.age,
          gender: face.gender,
          thumb: thumbFullPath,
        }
        const foundIdx = this.baseFaceGroup.findIndex(g => g.name === name)
        if (foundIdx !== -1) {
          this.$set(this.baseFaceGroup, foundIdx, { name, value: [faceEntry] })
        } else {
          this.baseFaceGroup.push({ name, value: [faceEntry] })
        }

        fs.writeFileSync(this.faceGroupJsonPath, JSON.stringify(this.baseFaceGroup, null, 2), 'utf8')

        this.saveDialog.visible = false
        this.groupFaces()
        this.$message.success(`已录入: ${name}`)
      } catch (err) {
        console.error('录入失败:', err)
        this.$message.error('录入失败: ' + err.message)
      }
    },
    deleteBaseGroup(idx) {
      const entry = this.baseFaceGroup[idx]
      if (!entry) return
      this.$confirm(`确定删除 "${entry.name}" 的档案？`, '删除确认', {
        type: 'warning',
      }).then(() => {
        const faces = entry.value || []
        faces.forEach(f => {
          if (f.thumb && fs.existsSync(f.thumb)) {
            try { fs.unlinkSync(f.thumb) } catch (e) { }
          }
        })
        this.baseFaceGroup.splice(idx, 1)
        fs.writeFileSync(this.faceGroupJsonPath, JSON.stringify(this.baseFaceGroup, null, 2), 'utf8')
        this.groupFaces()
        this.$message.success('已删除')
      }).catch(() => { })
    },
    openPath(p) {
      if (!p) return
      ipcRenderer.send('openPath', p)
    },
    loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = 'file://' + src.split('?')[0]
      })
    },
    async processAllImages() {
      this.processing = true
      this.loading = true
      this.loadingText = `处理中... 0/${this.list.length}`
      this.processProgress = 0
      this.allFaces = []
      let faceId = 0
      for (let i = 0; i < this.list.length; i++) {
        const item = this.list[i]
        if (!item.img) {
          this.processProgress++
          continue
        }
        this.loadingText = `处理中... ${this.processProgress}/${this.list.length}`
        try {
          const img = await this.loadImage(item.img)
          const detections = await faceapi
            .detectAllFaces(img)
            .withFaceLandmarks()
            .withFaceDescriptors()
            .withAgeAndGender()

          this.$set(this.results, i, detections)
          console.log('detections: ', detections);
          detections.forEach(d => {
            const box = d.detection.box
            const faceCanvas = document.createElement('canvas')
            faceCanvas.width = Math.round(box.width)
            faceCanvas.height = Math.round(box.height)
            faceCanvas.getContext('2d').drawImage(img, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height)
            const faceThumb = faceCanvas.toDataURL('image/jpeg', 0.8)
            this.allFaces.push({
              id: faceId++,
              imgIdx: i,
              descriptor: d.descriptor,
              age: d.age,
              gender: d.gender,
              genderProbability: d.genderProbability,
              detection: d.detection,
              thumb: faceThumb,
            })
          })
        } catch (err) {
          console.error('处理图片失败:', item.img, err)
          this.$set(this.results, i, [])
        }
        this.processProgress++
      }
      this.processing = false
      this.loading = false
      this.groupFaces()
      this.$message.success(`处理完成，共检测到 ${this.allFaces.length} 张人脸`)
    },
    selectImage(idx) {
      if (this.currentIdx === idx) {
        this.currentIdx = null
        this.activeGroups = this.faceGroups.map((_, gi) => gi)
        return
      }
      // 右侧已有对应头像在可视区域内则不滚动
      const alreadyVisible = this.isFaceVisible(idx)
      this.currentIdx = idx
      this.activeGroups = this.faceGroups
        .map((group, gi) => group.faces.some(f => f.imgIdx === idx) ? gi : -1)
        .filter(gi => gi !== -1)
      this.$nextTick(() => {
        const el = this.$refs['imgItem' + idx]
        if (el && el[0]) el[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
      setTimeout(() => {
        if (alreadyVisible) return
        if (this.activeGroups.length > 0) {
          const firstGi = this.activeGroups[0]
          const collapseEl = document.querySelector('.el-collapse-item:nth-child(' + (firstGi + 1) + ')')
          if (collapseEl) collapseEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 400)
    },
    isFaceVisible(idx) {
      const panel = document.querySelector('.main-panel')
      if (!panel) return false
      const rect = panel.getBoundingClientRect()
      const els = document.querySelectorAll('.group-face[data-img-idx="' + idx + '"]')
      for (const el of els) {
        const r = el.getBoundingClientRect()
        if (r.top >= rect.top && r.bottom <= rect.bottom) return true
      }
      return false
    },
    groupFaces() {
      if (this.allFaces.length === 0) {
        this.faceGroups = []
        return
      }

      let baseEntries = []
      if (this.baseFaceGroup && this.baseFaceGroup.length) {
        this.baseFaceGroup.forEach(entry => {
          const name = entry.name || ''
          let faces = entry.value
          if (!faces) return
          if (!Array.isArray(faces)) faces = [faces]
          faces.forEach(f => {
            if (f && f.descriptor) {
              baseEntries.push({ name, descriptor: f.descriptor })
            }
          })
        })
      }

      // 合并 base descriptor 和新检测的人脸，一起做并查集
      const allDescs = baseEntries.map(b => ({ descriptor: b.descriptor, isBase: true, baseName: b.name }))
        .concat(this.allFaces.map(f => ({ ...f, isBase: false, baseName: '' })))

      const parent = allDescs.map((_, i) => i)
      const find = (x) => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]]
          x = parent[x]
        }
        return x
      }
      const union = (a, b) => {
        const ra = find(a)
        const rb = find(b)
        if (ra !== rb) parent[ra] = rb
      }

      for (let i = 0; i < allDescs.length; i++) {
        for (let j = i + 1; j < allDescs.length; j++) {
          const dist = faceapi.euclideanDistance(
            allDescs[i].descriptor,
            allDescs[j].descriptor
          )
          if (dist < this.threshold) {
            union(i, j)
          }
        }
      }

      const groupMap = {}
      allDescs.forEach((face, i) => {
        const root = find(i)
        if (!groupMap[root]) groupMap[root] = []
        groupMap[root].push(face)
      })

      const groups = Object.values(groupMap)
        .filter(g => g.some(f => !f.isBase))
        .sort((a, b) => b.length - a.length)

      this.faceGroups = groups.map(g => {
        const names = [...new Set(g.filter(f => f.isBase && f.baseName).map(f => f.baseName))]
        const cleaned = g.filter(f => !f.isBase).map(({ isBase, baseName, ...face }) => face)
        return {
          name: names.join('、'),
          faces: cleaned,
        }
      })
      this.activeGroups = this.faceGroups.map((_, gi) => gi)
    },
  },
}
</script>

<style lang="less" scoped>
.face-api {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;

  .title {
    font-size: 16px;
    font-weight: bold;
  }

  .threshold-label {
    font-size: 12px;
    white-space: nowrap;
  }

  .drawer-btn {
    margin-left: auto;
  }
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// 左侧图片列表
.image-list {
  width: 300px;
  overflow-y: auto;
  border-right: 1px solid #eee;
  background: #fafafa;
  flex-shrink: 0;

  .image-item {
    margin: 8px;
    padding: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 6px;
    transition: all 0.2s;
    background: #fff;

    &:hover {
      background: #f5f5f5;
    }

    &.active {
      border-color: #409eff;
      background: #ecf5ff;
    }

    img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
    }

    .image-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 4px;

      .image-title {
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 220px;
      }
    }
  }
}

// 右侧主区域
.main-panel {
  flex: 1;
  overflow-y: auto;
  background: #fff;

  .empty-tip {
    text-align: center;
    color: #999;
    padding: 40px;
    font-size: 14px;
  }
}

// 人脸分组网格
.groups-grid {
  padding: 12px;

  .group-title {
    font-weight: bold;
  }

  .group-count {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }

  .group-faces {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .group-face {
      width: 72px;
      cursor: pointer;
      text-align: center;

      img {
        width: 72px;
        height: 72px;
        object-fit: cover;
        border-radius: 4px;
        border: 2px solid #eee;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      &.highlight img {
        border-color: #409eff;
        box-shadow: 0 0 6px rgba(64, 158, 255, 0.6);
      }

      .face-age {
        font-size: 11px;
        display: block;
        margin-top: 2px;
        color: #666;
      }

      .save-btn {
        padding: 0;
        height: 18px;
        font-size: 11px;
        line-height: 18px;
        color: #409eff;
      }
    }
  }
}

.base-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;

  .base-entry-thumb {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f5f5f5;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #999;
    }
  }

  .base-entry-info {
    flex: 1;
    min-width: 0;

    .base-entry-name {
      font-size: 14px;
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .base-entry-count {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .base-entry-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
}
</style>
