<template>
  <el-upload
    class="upload-dom"
    drag
    :before-upload="beforeUpload"
    action=""
    accept="image/png, image/jpeg"
    multiple
  >
    <div class="el-upload__text">
      Drop file here or <em>click to upload</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
      </div>
    </template>
  </el-upload>
</template>

<script>
export default {
  name: 'upload',
  props: {
    msg: String
  },
  data() {
    return {
      count: 0
    }
  },
  methods:{
    beforeUpload(rawFile){
      this.$emit('pushList',rawFile)
      return false
    }
  }
}
</script>
<style scoped lang="less">
.upload-dom{
  position: sticky;
    top: 0;   /* 距离视口顶部 10px */
    left: 0; /* 距离视口右侧 10px */
    right: 0;
    color: white;
    z-index: 1000; /* 确保在其他元素上方 */
  & /deep/ .el-upload{
    width: 100%;
  }
  & /deep/.el-upload-dragger{
    width: 100%;
  }
}
</style>