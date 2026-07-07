<template>
  <div class="app">
    <upload @pushList="pushList" />
    <showImage @delFile="delFile" v-for="obj in fileList" :key="obj.id" :obj="obj" />
  </div>

</template>

<script>
import upload from './components/upload.vue'
import showImage from './components/showImage.vue'

export default {
  name: 'App',
  components: {
    upload,
    showImage
  },
  data() {
    return {
      fileList: []
    }
  },
  methods: {
    pushList(file) {
      console.log('file: ', file);
      this.fileList.unshift({
        file: file,
        id: new Date().getTime()
      })
    },
    delFile(id) {
      this.fileList.some((obj, idx) => {
        if (obj.id == id) {
          this.fileList.splice(idx, 1)
          return true
        }
        return false
      })
    }
  }
}
</script>

<style>
* {
  padding: 0;
  margin: 0
}
.app{
  /* overflow-x: hidden; */
}
</style>