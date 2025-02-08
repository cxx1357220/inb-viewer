<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
const ipcRenderer = require('electron').ipcRenderer;
export default {
  name: 'App',
  data() {
    return {
    }
  },
  methods: {


  },
  beforeCreate() {
    ipcRenderer.on('blockVal', (e, obj) => {
      console.log(obj);
      if (obj.type == 'video') {
        this.$router.push({
          name: 'video',
          params: obj
        })
      } else {
        this.$router.push({
          name: 'content',
          params: obj
        })
      }
    })
    ipcRenderer.on('mdView', (e, obj) => {
      console.log(obj);
      this.$router.push({
        name: 'mdView',
        params: obj
      })
    })
    ipcRenderer.on('codeView', (e, obj) => {
      this.$router.push({
        name: 'codeView',
        params: obj
      })
    })
    ipcRenderer.on('home', (e) => {
      this.$router.push({
        name: 'home',
      })
    })
    ipcRenderer.on('help', (e) => {
      this.$router.push({
        name: 'help',
      })
    })
    ipcRenderer.on('wallpaper', (e, obj) => {
      this.$router.push({
        name: 'wallpaper',
        params: obj
      })
    })
    ipcRenderer.on('outDesc', (e, obj) => {
      this.$router.push({
        name: 'outDesc',
        params: obj
      })
    })
    ipcRenderer.on('videoList', (e, obj) => {
      this.$router.push({
        name: 'videoList',
        params: obj
      })
    })
    ipcRenderer.on('error', (e, obj) => {
      this.$notify({
        title: 'error',
        message: obj,
        duration: 0
      });
    })
  }
}
</script>

</script>
<style lang="less">
#app {
  background-color: #EEEEEB;
  min-height: 100vh;

}

* {
  margin: 0;
  padding: 0;
}

.el-tag+.el-tag {
  margin-left: 10px;
}
</style>
