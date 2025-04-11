import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

interface Dish {
  id: number
  name: string
  type: string
  category: string
}

interface WeekMenuItem {
  id: number
  day: number
  dish_id: number
  name: string
  type: string
  category: string
}

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const useDishStore = defineStore('dish', () => {
  const dishes = ref<Dish[]>([])
  const weekMenu = ref<WeekMenuItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 加载所有菜品
  const loadDishes = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`${API_BASE_URL}/dishes`)
      dishes.value = response.data
    } catch (err) {
      console.error('加载菜品失败:', err)
      error.value = '加载菜品失败'
    } finally {
      loading.value = false
    }
  }

  // 添加菜品
  const addDish = async (dish: Omit<Dish, 'id'>) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post(`${API_BASE_URL}/dishes`, dish)
      const newDish = response.data
      dishes.value.push(newDish)
      return newDish
    } catch (err) {
      console.error('添加菜品失败:', err)
      error.value = '添加菜品失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除菜品
  const removeDish = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await axios.delete(`${API_BASE_URL}/dishes/${id}`)
      const index = dishes.value.findIndex(dish => dish.id === id)
      if (index !== -1) {
        dishes.value.splice(index, 1)
      }
    } catch (err) {
      console.error('删除菜品失败:', err)
      error.value = '删除菜品失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取周菜单
  const loadWeekMenu = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`${API_BASE_URL}/week-menu`)
      weekMenu.value = response.data
    } catch (err) {
      console.error('加载周菜单失败:', err)
      error.value = '加载周菜单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 生成新的周菜单
  const generateWeekMenu = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post(`${API_BASE_URL}/week-menu/generate`)
      weekMenu.value = response.data
    } catch (err) {
      console.error('生成周菜单失败:', err)
      error.value = '生成周菜单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 重新生成特定日期的菜单
  const regenerateDay = async (day: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.put(`${API_BASE_URL}/week-menu/day/${day}`)
      const updatedDish = response.data
      
      // 更新本地状态
      const index = weekMenu.value.findIndex(item => item.day === day)
      if (index !== -1) {
        weekMenu.value[index] = {
          ...weekMenu.value[index],
          dish_id: updatedDish.dish_id,
          name: updatedDish.name,
          type: updatedDish.type,
          category: updatedDish.category
        }
      } else {
        weekMenu.value.push({
          id: Date.now(), // 临时ID，实际ID会在下次加载时更新
          day,
          dish_id: updatedDish.dish_id,
          name: updatedDish.name,
          type: updatedDish.type,
          category: updatedDish.category
        })
        // 确保按日期排序
        weekMenu.value.sort((a, b) => a.day - b.day)
      }
    } catch (err) {
      console.error('更新菜单失败:', err)
      error.value = '更新菜单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 初始化时加载数据
  loadDishes()
  loadWeekMenu()

  return {
    dishes,
    weekMenu,
    loading,
    error,
    loadDishes,
    addDish,
    removeDish,
    loadWeekMenu,
    generateWeekMenu,
    regenerateDay
  }
}) 