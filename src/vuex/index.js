import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    repkgStateMap:{},
    whisperStateMap:{},
    copyStateMap:{},
    compressStateMap:{},
    runningWallpaper:'',
  },
  mutations: {
    setRunningWallpaper (state,val) {
      state.runningWallpaper = val
    },
    setRepkgStateMap (state,[key,val]) {
      Vue.set(state.repkgStateMap,key ,val)
    },
    setWhisperStateMap (state,[key,val]) {
      Vue.set(state.whisperStateMap,key ,val)
    },
    setCopyStateMap (state,[key,val]) {
      Vue.set(state.copyStateMap,key ,val)
    },
    setCompressStateMap (state,[key,val]) {
      Vue.set(state.compressStateMap,key ,val)
    },
    clear(state){
      for (const key in state.copyStateMap) {
        if (state.copyStateMap[key] == 'done' || state.copyStateMap[key] == 'error') {
          Vue.set(state.copyStateMap, key, '')
        }
      }
      for (const key in state.repkgStateMap) {
        if (state.repkgStateMap[key] == 'done' || state.repkgStateMap[key] == 'error') {
          Vue.set(state.repkgStateMap, key, '')
        }
      }
      for (const key in state.whisperStateMap) {
        if (state.whisperStateMap[key] == 'done' || state.whisperStateMap[key] == 'error') {
          Vue.set(state.whisperStateMap, key, '')
        }
      }
      for (const key in state.compressStateMap) {
        if (state.compressStateMap[key] == 'done' || state.compressStateMap[key] == 'error') {
          Vue.set(state.compressStateMap, key, '')
        }
      }

      for (const key in state.newStateMap) {
        if (state.newStateMap[key] == 'done' || state.newStateMap[key] == 'error') {
          Vue.set(state.newStateMap, key, '')
        }
      }
    }
  }
})
export  default store