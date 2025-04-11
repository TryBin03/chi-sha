<script setup lang="ts">
import { ref, reactive } from 'vue'
import { 
  CellGroup as TCellGroup,
  Cell as TCell,
  Stepper as TStepper,
  Button as TButton,
  Switch as TSwitch,
  Toast,
} from 'tdesign-mobile-vue'

const meatCount = ref(1)
const vegetableCount = ref(1)
const soupCount = ref(0)
const noRepeatInWeek = ref(false)

const recommendations = reactive({
  meat: [] as any[],
  vegetable: [] as any[],
  soup: [] as any[]
})

// 定义 API 基础路径
const apiBaseUrl = '/api'

// 获取推荐
const getRecommendation = async () => {
  try {
    // 只有当至少选择了一个菜品时才发送请求
    if (meatCount.value == 0 && vegetableCount.value == 0 && soupCount.value == 0) {
      Toast({ message: '请至少选择一个菜品' })
      return
    }

    const response = await fetch(`${apiBaseUrl}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meat: meatCount.value,
        vegetable: vegetableCount.value,
        soup: soupCount.value,
        noRepeatInWeek: noRepeatInWeek.value
      })
    })
    const data = await response.json()
    
    // 清空之前的推荐
    recommendations.meat = []
    recommendations.vegetable = []
    recommendations.soup = []
    
    // 只更新有数量的菜品类型
    if (meatCount.value > 0) recommendations.meat = data.meat || []
    if (vegetableCount.value > 0) recommendations.vegetable = data.vegetable || []
    if (soupCount.value > 0) recommendations.soup = data.soup || []
  } catch (error) {
    Toast({ message: '获取推荐失败' })
  }
}
</script>

<template>
  <div class="home-page">
    <t-cell-group>
      <t-cell title="荤菜数量">
        <template #note>
          <t-stepper v-model="meatCount" theme="filled" />
        </template>
      </t-cell>
      <t-cell title="素菜数量">
        <template #note>
          <t-stepper v-model="vegetableCount" theme="filled" />
        </template>
      </t-cell>
      <t-cell title="汤类数量">
        <template #note>
          <t-stepper v-model="soupCount" theme="filled" />
        </template>
      </t-cell>
    </t-cell-group>
    <t-cell-group>
      <t-cell title="一周内不重复">
        <template #note>
          <t-switch v-model="noRepeatInWeek" />
        </template>
      </t-cell>
    </t-cell-group>

    <t-button block theme="primary" @click="getRecommendation" style="margin: 16px 0;">
      推荐
    </t-button>

    <t-cell-group v-if="recommendations.meat.length || recommendations.vegetable.length || recommendations.soup.length" title="推荐菜单">
      <template v-if="recommendations.meat.length">
        <t-cell title="荤菜" :description="recommendations.meat.map(d => d.name).join('、')" />
      </template>
      <template v-if="recommendations.vegetable.length">
        <t-cell title="素菜" :description="recommendations.vegetable.map(d => d.name).join('、')" />
      </template>
      <template v-if="recommendations.soup.length">
        <t-cell title="汤类" :description="recommendations.soup.map(d => d.name).join('、')" />
      </template>
    </t-cell-group>
  </div>
</template>

<style scoped>
.home-page {
  padding: 16px;
}
</style> 