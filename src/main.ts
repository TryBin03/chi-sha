import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import TDesign from 'tdesign-mobile-vue'
import 'tdesign-mobile-vue/es/style/index.css'
import router from './router/index'
import {createPinia} from 'pinia'

// 配置主题
const app = createApp(App)
app.use(TDesign, {
  theme: {
    mode: 'auto', // 自动跟随系统主题
    darkMode: 'media', // 使用媒体查询来检测深色模式
  },
})
app.use(router)
app.use(createPinia())
app.mount('#app')
