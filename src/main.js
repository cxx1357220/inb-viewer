import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './vuex'

Vue.config.productionTip = false
import VueLazyload from 'vue-lazyload'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);


Vue.use(VueLazyload, {
  lazyComponent: true
});
new Vue({
  router,
  render: h => h(App),
  store
}).$mount('#app')
