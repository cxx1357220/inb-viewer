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
    ipcRenderer.on('newWindow', (e, obj) => {
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
</style>
