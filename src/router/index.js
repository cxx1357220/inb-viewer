import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'init',
    component: () => import(  '../views/init.vue')
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView
  },
  {
    path: '/video',
    name: 'video',
    component: () => import(  '../views/VideoView.vue')
  },
  {
    path: '/videoList',
    name: 'videoList',
    component: () => import(  '../views/videoList.vue')
  },
  {
    path: '/content',
    name: 'content',
    component: () => import(  '../views/contentView.vue')
  },
  {
    path: '/help',
    name: 'help',
    component: () => import(  '../views/help.vue')
  },
  {
    path: '/wallpaper',
    name: 'wallpaper',
    component: () => import(  '../views/wallpaper.vue')
  },
  {
    path: '/mdView',
    name: 'mdView',
    component: () => import(  '../views/mdView.vue')
  },
  {
    path: '/outDesc',
    name: 'outDesc',
    component: () => import(  '../views/outDesc.vue')
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router