import { createRouter, createWebHistory } from 'vue-router'
import TeamRanking from '../components/TeamRanking.vue'
import TeamMatches from '../components/TeamMatches.vue'
import TeamStats from '../components/TeamStats.vue'
import HeadToHead from '../components/HeadToHead.vue'

const routes = [
  { path: '/', name: 'TeamRanking', component: TeamRanking },
  { path: '/matches', name: 'TeamMatches', component: TeamMatches },
  { path: '/stats', name: 'TeamStats', component: TeamStats },
  { path: '/head-to-head', name: 'HeadToHead', component: HeadToHead }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
