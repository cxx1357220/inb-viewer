<template>
  <div class="home">
    <div class="search">
      <div class="button-list">
        <el-button size="mini" plain
          :icon="key == 'date' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
          :type="key == 'date' ? 'primary' : ''" @click="sort('date')">日期</el-button>
        <el-button size="mini" plain
          :icon="key == 'star' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
          :type="key == 'star' ? 'primary' : ''" @click="sort('star')">星级</el-button>
        <el-button size="mini" plain
          :icon="key == 'visits' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
          :type="key == 'visits' ? 'primary' : ''" @click="sort('visits')">阅量</el-button>
        <el-button size="mini" plain
          :icon="key == 'allSize' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
          :type="key == 'allSize' ? 'primary' : ''" @click="sort('allSize')">大小</el-button>
        <el-button size="mini" plain
          :icon="key == 'title' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
          :type="key == 'title' ? 'primary' : ''" @click="sort('title')">标题</el-button>
        <el-button size="mini" plain
          :icon="key == 'videoDuration' ? (sortT == 1 ? 'el-icon-caret-bottom' : 'el-icon-caret-top') : ''"
          :type="key == 'videoDuration' ? 'primary' : ''" @click="sort('videoDuration')">时长</el-button>
      </div>
      <div class="button-list">
        <el-button size="mini" plain :type="type == 'video' ? 'primary' : ''"
          @click="changeType('video')">视频</el-button>
        <el-button size="mini" plain :type="type == 'other' ? 'primary' : ''"
          @click="changeType('other')">其他</el-button>
        <el-button size="mini" plain :type="type == 'all' ? 'primary' : ''" @click="changeType('all')">全部</el-button>
      </div>
      <!-- search:<input type="text" v-model="filterVal">{{ showList.length }} -->
      <el-input type="text" prefix-icon="el-icon-search" :suffix="showList.length" size="mini" placeholder="search"
        v-model="filterVal">
        <template slot="append"> {{ showList.length }}</template>
      </el-input>

    </div>
    <div class="home-list">
      <div v-for="obj in showList" :key="obj.jsonPath">
        <div class="img-box" @click="open(obj)">
          <img v-lazy="obj.newimg" alt="" />
          <div class="visits" v-if="obj.visits">
            <i class="el-icon-view"></i>
            <span>{{ obj.visits }}</span>
          </div>
          <div class="video-duration" v-if="obj.videoDuration">
            <i class="el-icon-time"></i>
            <span v-time="obj.videoDuration"></span>
          </div>
          <i :class="['type-icon', obj.type == 'video' ? 'el-icon-video-play' : 'el-icon-document']"></i>

        </div>
        <div class="stars">
          <b v-for="idx in [0, 1, 2, 3, 4]" @click="changeStar(idx, obj)"
            :style="{ 'background-color': idx < obj.star ? 'red' : 'darkgray' }"></b>
        </div>
        <label>{{ obj.title }}</label>
        <p @click="openPath(obj)">打开路径</p>
        <span>{{ obj.file }}</span>
        <i>{{ obj.allSize || 0 }}MB</i>
        <span v-date="obj.date"></span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'HomeView',
  data() {
    return {
      list: [],
      showList: [],
      filterVal: '',
      key: 'date',
      sortT: 1,
      type: 'all'
    }
  },
  directives: {
    date: {
      bind(el, binding) {
        try {
          el.innerHTML = new Date(binding.value).toISOString().split('T')[0];
        } catch (error) {
          console.log(binding.value);
        }
      },
      update(el, binding) {
        try {
          el.innerHTML = new Date(binding.value).toISOString().split('T')[0];
        } catch (error) {
          console.log(binding.value);
        }
      },
    }, time: {
      bind(el, binding) {
        try {
          let result = parseInt(binding.value)
          let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600)
          let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60))
          let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60))
          result = `${h}:${m}:${s}`
          el.innerHTML = result
        } catch (error) {
          console.log(binding.value);
        }
      },
      update(el, binding) {
        try {
          let result = parseInt(binding.value)
          let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600)
          let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60))
          let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60))
          result = `${h}:${m}:${s}`
          el.innerHTML = result
        } catch (error) {
          console.log(binding.value);
        }
      },
    },
  },
  watch: {
    filterVal(n) {
      this.filterList(n)
    }
  },
  async created() {
    if (this.$route.params.value || sessionStorage.getItem('old')) {
      let list = []
      // if (sessionStorage.getItem('list')) {
      //   list = JSON.parse(sessionStorage.getItem('list'))
      // } else {
      await axios.get('/api/list').then((item) => {
        list = item?.data
        console.log('item: ', item);
        sessionStorage.setItem('list', JSON.stringify(list))
      }).catch((err) => {
        console.log('err: ', err);
      })
      // }
      this.list = list
      this.showList = JSON.parse(JSON.stringify(list))
      sessionStorage.setItem('old', 1)
      let pageData = sessionStorage.getItem('pageData')
      if (pageData) {
        let obj = JSON.parse(pageData)
        this.sortT = obj.sortT;
        this.key = obj.key;
        this.type = obj.type;
        this.filterVal = obj.filterVal;
        this.filterList(this.filterVal)
        // this.sort()
        document.body.scrollTop = document.documentElement.scrollTop = obj.scrollTop;

      }
    }
  },
  methods: {
    open(obj) {
      let pageData = JSON.stringify({
        filterVal: this.filterVal,
        type: this.type,
        key: this.key,
        sortT: this.sortT,
        scrollTop: document.body.scrollTop || document.documentElement.scrollTop
      })
      sessionStorage.setItem('pageData', pageData)
      obj.visits ? obj.visits++ : (obj.visits = 1);
      for (let i = 0; i < this.list.length; i++) {
        if (this.list[i].filePath == obj.filePath) {
          this.list[i].visits = obj.visits
          break;
        }
      }
      sessionStorage.setItem('list', JSON.stringify(this.list))
      axios.post('/api/visits', obj).then((item) => {
        console.log('item: ', item);
      }).catch((err) => {
        console.log('err: ', err);
      })

      sessionStorage.setItem(obj.newBasePath, JSON.stringify(obj))
      // if (obj.type == 'video') {
      //   this.$router.push({
      //     name: 'video',
      //     params: obj
      //   })
      // } else {
      //   this.$router.push({
      //     name: 'content',
      //     params: obj
      //   })
      // }
      let routeData = this.$router.resolve({
        query: { id: obj.newBasePath },
        name: obj.type == 'video' ? 'video' : 'content'
      });
      window.open(routeData.href, '_blank');

    },
    openPath(obj) {
      console.log('obj: ', obj);
      window.open(location.origin + obj.newBasePath, '_blank');
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
        this.showList.sort((a, b) => {
          if ((b[this.key] || '').toUpperCase() > (a[this.key] || '').toUpperCase()
          ) {
            return this.sortT
          } else {
            return this.sortT * -1
          }
        })
      } else {
        this.showList.sort((a, b) => { return ((b[this.key] || 0) - (a[this.key] || 0)) * this.sortT })
      }
      document.body.scrollTop = document.documentElement.scrollTop = 1
      document.body.scrollTop = document.documentElement.scrollTop = 0
    },
    changeStar(i, obj) {
      obj.star = i + 1;
      for (let i = 0; i < this.list.length; i++) {
        if (this.list[i].filePath == obj.filePath) {
          this.list[i].star = obj.star
          break;
        }
      }
      sessionStorage.setItem('list', JSON.stringify(this.list))
      axios.post('/api/changeStar', obj).then((item) => {
        console.log('item: ', item);
      }).catch((err) => {
        console.log('err: ', err);
      })
    },

    filterList(n) {
      let isType = (obj) => {
        if (this.type == 'all') {
          return true
        } else if (this.type == 'other') {
          return obj.type != 'video'
        } else {
          return obj.type == this.type
        }
      }
      let isDesc = (obj) => {
        let ls = [].concat(obj?.videoActs, obj?.videoTags)
        if (ls.join('').indexOf(n) != -1) {
          console.log('ls: ', ls);
          return true

        } else {
          return false
        }
      }
      this.showList = this.list.filter(obj => {
        if (!n) { return isType(obj) }
        let reg = new RegExp(n, 'i');
        return (reg.test(obj.title) || reg.test(obj.file)||isDesc(obj)) && isType(obj)
      })
      this.sort()
    },
    changeType(type) {
      this.type = type;
      this.filterList(this.filterVal)
    },
  }

}
</script>
<style lang="less">
.home {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.search {
  box-sizing: border-box;
  padding: 10px 10px;
  // background-color: wheat;
  position: sticky;
  top: 0;
  z-index: 9;
  width: 100vw;
}

.button-list {
  display: flex;
  align-items: center;
  justify-content: left;
  padding-bottom: 10px;

  .el-button {
    flex: 1;
    padding: 5px 0 !important;
  }
}



.button-list /deep/ .el-button {
  flex: 1;
  padding: 5px 0 !important;
}

.home-list {
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  flex: 1;
  overflow-y: auto;

  &>div {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 33%;
    border-radius: 5px;
    padding: 5px;
    padding-bottom: 20px;
    text-align: center;

    .img-box {
      position: relative;
      padding-top: 100%;
      width: 100%;
      cursor: pointer;
      background-color: beige;

      & .visits,
      .video-duration {
        padding: 0;
        font-size: 10px;
        z-index: 10;
        position: absolute;
        bottom: 3px;
        left: 3px;
        // background: rgba(0, 0, 0, .5);
        text-shadow: 1px 1px 0px black;
        color: white;

        i {
          padding: 0;
        }

        span {
          margin: 0;
          color: white;
          font-weight: 100;
        }
      }

      &>.video-duration {
        // position: absolute;
        // bottom: 3px;
        right: 3px;
        left: unset;
      }

      .type-icon {
        padding: 0;
        font-size: 24px;
        z-index: 10;
        position: absolute;
        top: 10px;
        right: 10px;
        // background: rgba(0, 0, 0, .5);
        text-shadow: 1px 1px 0px black;
        color: white;
      }
    }

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    label {
      color: black;
      padding-bottom: 5px;
      word-break: break-word;
    }

    span {
      color: gray;
      word-break: break-word;
    }

    p {
      color: darkgreen;
      cursor: pointer;
    }

    p+p {
      color: red;
    }

    // i {
    //   padding-top: 12px;
    // }

    .stars {
      box-sizing: border-box;
      padding: 10px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-direction: row;

      b {
        display: block;
        width: 15%;
        height: 0;
        padding-top: 15%;
        border-radius: 50%;
      }
    }


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