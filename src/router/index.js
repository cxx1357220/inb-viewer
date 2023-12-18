import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'init',
    component: () => import( /* webpackChunkName: "about" */ '../views/init.vue')
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView
  },
  {
    path: '/video',
    name: 'video',
    component: () => import( /* webpackChunkName: "about" */ '../views/VideoView.vue')
  },
  {
    path: '/content',
    name: 'content',
    component: () => import( /* webpackChunkName: "about" */ '../views/contentView.vue')
  },
  {
    path: '/help',
    name: 'help',
    component: () => import( /* webpackChunkName: "about" */ '../views/help.vue')
  },
  {
    path: '/wallpaper',
    name: 'wallpaper',
    component: () => import( /* webpackChunkName: "about" */ '../views/wallpaper.vue')
  },
  {
    path: '/mdView',
    name: 'mdView',
    component: () => import( /* webpackChunkName: "about" */ '../views/mdView.vue')
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router