import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: App,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/Home.vue')
        },
        {
          path: '/dish-management',
          name: 'dish-management',
          component: () => import('../views/DishManagement.vue')
        },
        {
          path: '/week-menu',
          name: 'week-menu',
          component: () => import('../views/WeekMenu.vue'),
          children: [
            {
              path: '',
              component: () => import('../components/WeekMenuView.vue')
            }
          ]
        }
      ]
    }
  ]
})

export default router 