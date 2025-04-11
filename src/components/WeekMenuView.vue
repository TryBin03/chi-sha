<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  TabBar as TTabBar,
  TabBarItem as TTabBarItem,
  Button as TButton,
  Icon as TIcon,
} from 'tdesign-mobile-vue'
import WeekMenuTable from './WeekMenuTable.vue'
import WeekMenuCards from './WeekMenuCards.vue'
import { useDishStore } from '../stores/dish'

// 使用dish store
const dishStore = useDishStore()
const { weekMenu, generateWeekMenu, regenerateDay } = dishStore

const activeTab = ref('table')

// 重新生成整周菜单
const handleRegenerate = async () => {
  try {
    await generateWeekMenu()
  } catch (error) {
    console.error('生成菜单失败:', error)
  }
}

// 重新生成某天菜单
const handleRegenerateDay = async (day: number) => {
  try {
    await regenerateDay(day)
  } catch (error) {
    console.error('更新菜单失败:', error)
  }
}

// 确保有数据
onMounted(async () => {
  if (weekMenu.value.length === 0) {
    try {
      await generateWeekMenu()
    } catch (error) {
      console.error('初始化菜单失败:', error)
    }
  }
})

// 为了兼容Vue Router，需要添加默认导出
defineExpose({})
</script>

<template>
  <div class="week-menu-container">
    <t-tab-bar v-model="activeTab" class="view-switcher">
      <t-tab-bar-item value="table">
        <template #icon>
          <t-icon name="view-list" />
        </template>
        表格视图
      </t-tab-bar-item>
      <t-tab-bar-item value="cards">
        <template #icon>
          <t-icon name="view-module" />
        </template>
        卡片视图
      </t-tab-bar-item>
    </t-tab-bar>

    <div class="menu-content">
      <week-menu-table 
        v-if="activeTab === 'table'"
        :week-menu="weekMenu"
        @regenerate-day="handleRegenerateDay"
      />
      <week-menu-cards 
        v-else
        :week-menu="weekMenu"
        @regenerate-day="handleRegenerateDay"
      />
    </div>

    <div class="action-buttons">
      <t-button theme="primary" @click="handleRegenerate">
        重新生成本周菜单
      </t-button>
    </div>
  </div>
</template>

<style scoped>
.week-menu-container {
  padding: 16px;
}

.view-switcher {
  margin-bottom: 16px;
}

.menu-content {
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
}
</style> 