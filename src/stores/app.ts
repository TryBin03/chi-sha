import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Toast } from 'tdesign-mobile-vue';

export const useAppStore = defineStore('app', () => {
    // 定义 API 基础路径
    const apiBaseUrl = '/api'
    
    // 登录相关状态
    const authToken = ref('')
    const isLoggedIn = ref(false)
    const showLoginForm = ref(false)
    // 验证登录状态
    const checkAuth = () => {
    if (!isLoggedIn.value) {
        showLoginForm.value = true
        return false
    }
    return true
    }
    // 登录
    const handleLogin = async (password: string) => {

        try {
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password }),
        })
        
        if (response.ok) {
            const data = await response.json()
            authToken.value = data.token
            isLoggedIn.value = true
            showLoginForm.value = false
            Toast({ message: '登录成功' })
        } else {
            Toast({ message: '密码错误' })
        }
        } catch (error) {
        Toast({ message: '登录失败' })
        }
    }
  
    const logout = async () => {
        try {
        await fetch(`${apiBaseUrl}/logout`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken.value,
            },
        })
        authToken.value = ''
        isLoggedIn.value = false
        Toast({ message: '已登出' })
        } catch (error) {
        Toast({ message: '登出失败' })
        }
    }
    
    return {
        authToken,
        isLoggedIn,
        showLoginForm,
        checkAuth,
        handleLogin,
        logout,
    }
})