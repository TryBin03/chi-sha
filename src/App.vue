<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  TabBar as TTabBar,
  TabBarItem as TTabBarItem,
  Navbar as TNavbar,
} from 'tdesign-mobile-vue'
import { HappyIcon, BroccoliIcon, CalendarIcon } from 'tdesign-icons-vue-next'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 根据当前路由设置导航选中项
const getActiveTab = () => {
  if (route.path === '/') return 'home'
  if (route.path === '/dish-management') return 'manage'
  if (route.path.includes('/week-menu')) return 'week'
  return 'home'
}

const active = ref(getActiveTab())

// 监听路由变化
watch(() => route.path, () => {
  active.value = getActiveTab()
})

// 监听标签切换
watch(active, (newVal) => {
  if (newVal === 'home') {
    router.push('/')
  } else if (newVal === 'manage') {
    router.push('/dish-management')
  } else if (newVal === 'week') {
    router.push('/week-menu')
  }
})
</script>

<template>
  <div class="app-container">
    <t-navbar class="navbar">
      <template #left>
        {{ active === 'home' ? '今天吃啥' : active === 'manage' ? '菜品管理' : '一周菜单' }}
      </template>
    </t-navbar>

    <div class="content">
      <router-view></router-view>
    </div>

    <t-tab-bar v-model="active" fixed>
      <t-tab-bar-item value="home">
        <template #icon>
          <happy-icon />
        </template>
        今天吃啥
      </t-tab-bar-item>
      <t-tab-bar-item value="week">
        <template #icon>
          <calendar-icon />
        </template>
        一周菜单
      </t-tab-bar-item>
      <t-tab-bar-item value="manage">
        <template #icon>
          <broccoli-icon />
        </template>
        菜品管理
      </t-tab-bar-item>
    </t-tab-bar>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  background-color: var(--td-bg-color-page);
  color: var(--td-text-color-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 深色模式优化 */
html[theme-mode="dark"] {
  color-scheme: dark;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--td-bg-color-container);
  transition: background-color 0.3s ease;
}

.navbar-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  transition: color 0.3s ease;
}

.content {
  flex: 1;
  padding-top: calc(56px);
  padding-bottom: calc(env(safe-area-inset-bottom) + 80px);
  overflow-y: auto;
  background: var(--td-bg-color-page);
  transition: background-color 0.3s ease;
}

/* TabBar 样式优化 */
.t-tab-bar {
  border-top: 1px solid var(--td-component-border);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--td-bg-color-container);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.t-navbar {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-component-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* 深色模式优化 */
html[theme-mode="dark"] .t-button--primary {
  opacity: 0.9;
}

html[theme-mode="dark"] .t-cell-group {
  border: 1px solid var(--td-component-border);
}
</style>
