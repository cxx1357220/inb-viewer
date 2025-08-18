<template>
  <div class="notification">
    <p class="copy" @click="copy">{{ text }}</p>
  </div>
</template>

<script>
const { shell } = require('electron');
export default {
  data() {
    return {
      text: "",
    };
  },
  methods: {
    copy() {
      navigator.clipboard.writeText(this.text);
      shell.openExternal(this.text);
    },
  },
  created() {
    this.$route.query.text && (this.text = decodeURIComponent( this.$route.query.text));
  },
};
</script>

<style lang="less" scoped>
.notification{
    padding: 10px;
    background-color: white;
    height: 100vh;
    box-sizing: border-box;
    overflow:hidden;
}
.copy {
  // 限制只显示两行文本
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  // 可选：添加一些基本样式使文本更易读
  line-height: 1.4;
  cursor: pointer;
  word-break: break-all;

  // 可选：添加悬停效果提示用户可以点击
  &:hover {
    background-color: #f0f0f0;
  }
}
</style>