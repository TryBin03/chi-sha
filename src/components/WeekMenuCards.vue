<script setup lang="ts">
import { 
  Button as TButton,
} from 'tdesign-mobile-vue'

interface WeekMenuItem {
  id: number
  day: number
  dish_id: number
  name: string
  type: string
  category: string
}

const emit = defineEmits<{
  (e: 'regenerateDay', day: number): void
}>()

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const handleRegenerateDay = (day: number) => {
  emit('regenerateDay', day)
}

const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    meat: '荤菜',
    vegetable: '素菜',
    soup: '汤类'
  }
  return typeMap[type] || type
}

// 为了兼容Vue Router，需要添加默认导出
defineExpose({})
</script>

<template>
  <div class="cards-container">
    <Card
      v-for="(day, index) in weekDays"
      :key="index"
      class="menu-card"
      :title="day"
    >
      <template #actions>
        <TButton
          size="small"
          theme="default"
          @click="handleRegenerateDay(index)"
        >
          换一个
        </TButton>
      </template>
      <div class="dish-info">
        <div class="dish-name">
          {{ weekMenu.find(item => item.day === index)?.name || '未分配' }}
        </div>
        <div class="dish-type">
          {{ getTypeText(weekMenu.find(item => item.day === index)?.type || '') }}
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.cards-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.menu-card {
  margin-bottom: 8px;
}

.dish-info {
  padding: 8px 0;
}

.dish-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.dish-type {
  color: var(--td-text-color-secondary);
  font-size: 14px;
}
</style> 