<script setup lang="ts">
// 不再需要引入ref和dishStore，因为我们直接使用WeekMenuView组件
</script>

<template>
  <div class="week-menu-page">
    <h2>本周菜单</h2>
    <p class="page-desc">每周菜单安排，不会有重复的菜</p>
    <router-view></router-view>
  </div>
</template>

<style scoped>
.week-menu-page {
  padding: 16px;
}

h2 {
  margin-bottom: 8px;
  text-align: center;
}

.page-desc {
  text-align: center;
  color: var(--td-text-color-secondary);
  margin-bottom: 16px;
}
</style> 