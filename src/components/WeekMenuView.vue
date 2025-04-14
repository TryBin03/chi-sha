<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button as TButton } from 'tdesign-mobile-vue'
import WeekMenuTable from './WeekMenuTable.vue'
import WeekMenuCards from './WeekMenuCards.vue'
import { useDishStore } from '../stores/dish'
import { storeToRefs } from 'pinia'

// 使用dish store 
const dishStore = useDishStore()
const { weekMenu } =  storeToRefs(dishStore)

const activeTab = ref('table')

// 重新生成整周菜单
const handleRegenerate = async () => {
  try {
    await dishStore.generateWeekMenu()
  } catch (error) {
    console.error('生成菜单失败:', error)
  }
}

// 重新生成某天菜单
const handleRegenerateDay = async (day: number) => {
  try {
    await dishStore.regenerateDay(day)
  } catch (error) {
    console.error('更新菜单失败:', error)
  }
}

// 确保有数据
onMounted(async () => {
})

// 为了兼容Vue Router，需要添加默认导出
defineExpose({})
</script>

<template>
  <div class="week-menu-container">
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