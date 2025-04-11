<script setup lang="ts">
import { computed } from 'vue'
import { 
  Table as TTable,
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

const props = defineProps<{
  weekMenu: WeekMenuItem[]
}>()

const emit = defineEmits<{
  (e: 'regenerateDay', day: number): void
}>()

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const columns = [
  {
    colKey: 'day',
    title: '星期',
    width: 80,
  },
  {
    colKey: 'dish',
    title: '菜品',
    width: 120,
  },
  {
    colKey: 'type',
    title: '类型',
    width: 80,
  },
  {
    colKey: 'action',
    title: '操作',
    width: 100,
  },
]

const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    meat: '荤菜',
    vegetable: '素菜',
    soup: '汤类'
  }
  return typeMap[type] || type
}

const data = computed(() => {
  return weekDays.map((dayName, index) => {
    const menuItem = props.weekMenu.find(item => item.day === index)
    return {
      day: dayName,
      dish: menuItem?.name || '-',
      type: menuItem ? getTypeText(menuItem.type) : '-',
      action: index,
    }
  })
})

const handleRegenerateDay = (day: number) => {
  emit('regenerateDay', day)
}

// 为了兼容Vue Router，需要添加默认导出
defineExpose({})
</script>

<template>
  <t-table
    :columns="columns"
    :data="data"
    :stripe="true"
    :hover="true"
  >
    <template #action="{ row }">
      <t-button
        size="small"
        theme="default"
        @click="handleRegenerateDay(row.action)"
      >
        换一个
      </t-button>
    </template>
  </t-table>
</template>

<style scoped>
.t-table {
  margin-bottom: 16px;
}
</style> 