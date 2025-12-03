import { createRouter, createWebHistory } from 'vue-router'

// Import dari folder VIEWS sekarang
import DashboardView from '@/views/DashboardView.vue'
import ReportView from '@/views/ReportView.vue'
import EntryView from '@/views/EntryView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/input',
      name: 'input',
      component: EntryView 
    },
    {
      path: '/report',
      name: 'report',
      component: ReportView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }   
  ]
})

export default router