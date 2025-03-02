<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { 
  TabBar as TTabBar,
  TabBarItem as TTabBarItem,
  Button as TButton,
  Form as TForm,
  Input as TInput,
  RadioGroup as TRadioGroup,
  Radio as TRadio,
  CellGroup as TCellGroup,
  Cell as TCell,
  Stepper as TStepper,
  Toast,
  Navbar as TNavbar,
  SwipeCell as TSwipeCell,
  Popup as TPopup,
  type FormRule,
  type SubmitContext
} from 'tdesign-mobile-vue'
import { HomeIcon, DeleteIcon, LockOnIcon, LockOffIcon } from 'tdesign-icons-vue-next'

const active = ref('home')
const meatCount = ref(1)
const vegetableCount = ref(1)
const soupCount = ref(1)

const recommendations = reactive({
  meat: [] as any[],
  vegetable: [] as any[],
  soup: [] as any[]
})

const formData = reactive({
  name: '',
  type: 'meat',
  category: ''
})

// 添加表单验证规则
const rules = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }] as FormRule[]
}

// 编辑表单验证规则
const editRules = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }] as FormRule[]
}

// 添加菜品列表数据
const dishes = reactive({
  meat: [] as any[],
  vegetable: [] as any[],
  soup: [] as any[]
})

// 登录相关状态
const isLoggedIn = ref(false)
const showLoginForm = ref(false)
const password = ref('')
const authToken = ref('')

// 验证登录状态
const checkAuth = () => {
  if (!isLoggedIn.value) {
    showLoginForm.value = true
    return false
  }
  return true
}

// 登录
const login = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: password.value }),
    })
    
    if (response.ok) {
      const data = await response.json()
      authToken.value = data.token
      isLoggedIn.value = true
      showLoginForm.value = false
      password.value = ''
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
    await fetch('http://localhost:3000/api/logout', {
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

const getRecommendation = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meat: meatCount.value,
        vegetable: vegetableCount.value,
        soup: soupCount.value
      })
    })
    const data = await response.json()
    recommendations.meat = data.meat
    recommendations.vegetable = data.vegetable
    recommendations.soup = data.soup
  } catch (error) {
    Toast({ message: '获取推荐失败' })
  }
}

// 获取所有菜品
const getAllDishes = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/dishes')
    const data = await response.json()
    dishes.meat = data.filter((d: any) => d.type === 'meat')
    dishes.vegetable = data.filter((d: any) => d.type === 'vegetable')
    dishes.soup = data.filter((d: any) => d.type === 'soup')
  } catch (error) {
    Toast({ message: '获取菜品列表失败' })
  }
}

// 删除菜品
const deleteDish = async (id: number) => {
  if (!checkAuth()) return

  try {
    const response = await fetch(`http://localhost:3000/api/dishes/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': authToken.value,
      },
    })
    
    if (response.ok) {
      Toast({ message: '删除成功' })
      getAllDishes()
    } else {
      Toast({ message: '删除失败' })
    }
  } catch (error) {
    Toast({ message: '删除失败' })
  }
}

// 在组件挂载时获取菜品列表
onMounted(() => {
  getAllDishes()
})

const onSubmit = async (context: SubmitContext<any>) => {
  if (!checkAuth()) return;
  if (context.validateResult === true) {
    try {
      const response = await fetch('http://localhost:3000/api/dishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken.value,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Toast({ message: '添加成功' })
        formData.name = ''
        formData.category = ''
        getAllDishes()
      } else {
        Toast({ message: '添加失败' })
      }
    } catch (error) {
      Toast({ message: '添加失败' })
    }
  } else {
    Toast({ message: context.firstError })
  }
};

// 编辑相关的状态
const showEditForm = ref(false)
const editingDish = reactive({
  id: 0,
  name: '',
  type: 'meat',
  category: ''
})

// 打开编辑表单
const openEditForm = (dish: any) => {
  editingDish.id = dish.id
  editingDish.name = dish.name
  editingDish.type = dish.type
  editingDish.category = dish.category
  showEditForm.value = true
}

// 更新菜品
const updateDish = async (context: SubmitContext<any>) => {
  if (!checkAuth()) return;
  if (context.validateResult === true) {
    try {
      const response = await fetch(`http://localhost:3000/api/dishes/${editingDish.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken.value,
        },
        body: JSON.stringify(editingDish),
      });

      if (response.ok) {
        Toast({ message: '修改成功' })
        showEditForm.value = false;
        getAllDishes();
      } else {
        Toast({ message: '修改失败' })
      }
    } catch (error) {
      Toast({ message: '修改失败' })
    }
  } else {
    Toast({ message: context.firstError })
  }
};
</script>

<template>
  <div class="app-container">
    <t-navbar class="navbar">
      <template #left>{{ active === 'home' ? '今天吃啥' : '菜品管理' }}</template>
      <template #right>
        <t-button 
          variant="text" 
          @click="isLoggedIn ? logout() : showLoginForm = true"
        >
          <template #icon>
            <t-icon :name="isLoggedIn ? 'lock-off' : 'lock-on'" />
          </template>
          {{ isLoggedIn ? '已登录' : '未登录' }}
        </t-button>
      </template>
    </t-navbar>

    <!-- 登录弹窗 -->
    <t-popup v-model:visible="showLoginForm" placement="center">
      <div class="login-form">
        <div class="login-form-header">
          <span class="login-form-title">输入管理密码</span>
        </div>
        <t-form>
          <t-input
            v-model="password"
            type="password"
            placeholder="请输入管理密码"
            clearable
          />
          <div class="login-form-buttons">
            <t-button theme="default" block @click="showLoginForm = false" style="margin-bottom: 12px;">
              取消
            </t-button>
            <t-button theme="primary" block @click="login">
              确认
            </t-button>
          </div>
        </t-form>
      </div>
    </t-popup>

    <div class="content">
      <div v-if="active === 'home'">
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

        <t-button block theme="primary" @click="getRecommendation" style="margin: 16px 0;">
          推荐
        </t-button>

        <t-cell-group v-if="recommendations.meat.length" title="推荐菜单">
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

      <div v-else>
        <t-form ref="form" :data="formData" :rules="rules" @submit="onSubmit" style="margin-bottom: 8px;">
          <t-input
            v-model="formData.name"
            label="菜品名称"
            placeholder="请输入菜品名称"
            required
          />
          <t-radio-group v-model="formData.type">
            <t-radio value="meat">荤菜</t-radio>
            <t-radio value="vegetable">素菜</t-radio>
            <t-radio value="soup">汤类</t-radio>
          </t-radio-group>
          <t-input
            v-model="formData.category"
            label="分类"
            placeholder="请输入菜品分类（如：川菜、粤菜等）"
          />
          <t-button block theme="primary" type="submit">
            添加菜品
          </t-button>
        </t-form>

        <div class="swipe-hint-container">
          <span class="swipe-hint">左滑可删除菜品，点击可编辑</span>
        </div>

        <t-cell-group v-if="dishes.meat.length">
          <template #title>
            <div class="group-title">
              <span>荤菜</span>
            </div>
          </template>
          <t-swipe-cell v-for="dish in dishes.meat" :key="dish.id">
            <t-cell :title="dish.name" :description="dish.category" @click="openEditForm(dish)" hover />
            <template #right>
              <t-button theme="danger" @click="deleteDish(dish.id)" size="large">
                删除
              </t-button>
            </template>
          </t-swipe-cell>
        </t-cell-group>

        <t-cell-group v-if="dishes.vegetable.length">
          <template #title>
            <div class="group-title">
              <span>素菜</span>
            </div>
          </template>
          <t-swipe-cell v-for="dish in dishes.vegetable" :key="dish.id">
            <t-cell :title="dish.name" :description="dish.category" @click="openEditForm(dish)" hover />
            <template #right>
              <t-button theme="danger" @click="deleteDish(dish.id)" size="large">
                删除
              </t-button>
            </template>
          </t-swipe-cell>
        </t-cell-group>

        <t-cell-group v-if="dishes.soup.length">
          <template #title>
            <div class="group-title">
              <span>汤类</span>
            </div>
          </template>
          <t-swipe-cell v-for="dish in dishes.soup" :key="dish.id">
            <t-cell :title="dish.name" :description="dish.category" @click="openEditForm(dish)" hover />
            <template #right>
              <t-button theme="danger" @click="deleteDish(dish.id)" size="large">
                删除
              </t-button>
            </template>
          </t-swipe-cell>
        </t-cell-group>

        <div v-if="!dishes.meat.length && !dishes.vegetable.length && !dishes.soup.length" class="empty-tip">
          暂无菜品，请先添加
        </div>

        <!-- 编辑表单弹窗 -->
        <t-popup v-model:visible="showEditForm" placement="bottom">
          <div class="edit-form">
            <div class="edit-form-header">
              <span class="edit-form-title">修改菜品</span>
            </div>
            <t-form ref="editForm" :data="editingDish" :rules="editRules" @submit="updateDish">
              <t-input
                v-model="editingDish.name"
                label="菜品名称"
                placeholder="请输入菜品名称"
                required
              />
              <t-radio-group v-model="editingDish.type">
                <t-radio value="meat">荤菜</t-radio>
                <t-radio value="vegetable">素菜</t-radio>
                <t-radio value="soup">汤类</t-radio>
              </t-radio-group>
              <t-input
                v-model="editingDish.category"
                label="分类"
                placeholder="请输入菜品分类（如：川菜、粤菜等）"
              />
              <div class="edit-form-buttons">
                <t-button theme="default" block @click="showEditForm = false" style="margin-bottom: 12px;">
                  取消
                </t-button>
                <t-button theme="primary" block type="submit">
                  保存修改
                </t-button>
              </div>
            </t-form>
          </div>
        </t-popup>
      </div>
    </div>

    <t-tab-bar v-model="active" fixed>
      <t-tab-bar-item value="home">
        <template #icon>
          <home-icon />
        </template>
        今天吃啥
      </t-tab-bar-item>
      <t-tab-bar-item value="manage">
        <template #icon>
          <delete-icon />
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
  padding: 16px;
  padding-top: calc(56px + 16px);
  padding-bottom: calc(env(safe-area-inset-bottom) + 80px);
  overflow-y: auto;
  background: var(--td-bg-color-page);
  transition: background-color 0.3s ease;
}

/* 表单样式优化 */
.t-form {
  background: var(--td-bg-color-container);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: background-color 0.3s ease;
}

.t-radio-group {
  margin: 16px 0;
  display: flex;
  justify-content: space-between;
  background-color: var(--bg-color-demo, #fff);
}

.t-cell-group {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  background: var(--td-bg-color-container);
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

/* 推荐菜单样式 */
.t-cell-group[title="推荐菜单"] {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式优化 */
html[theme-mode="dark"] .t-button--primary {
  opacity: 0.9;
}

html[theme-mode="dark"] .t-cell-group {
  border: 1px solid var(--td-component-border);
}

.empty-tip {
  text-align: center;
  color: var(--td-text-color-secondary);
  padding: 32px 16px;
}

/* SwipeCell 样式优化 */
.t-swipe-cell {
  margin-bottom: 1px;
}

.t-swipe-cell .t-button {
  height: 100%;
}

/* 分组标题样式 */
.group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 16px;
}

.swipe-hint-container {
  text-align: center;
}

.swipe-hint {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  font-weight: normal;
  opacity: 0.7;
}

/* 编辑表单样式 */
.edit-form {
  background: var(--td-bg-color-container);
  padding: 16px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-form-header {
  margin-bottom: 24px;
  text-align: center;
}

.edit-form-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.edit-form-buttons {
  margin-top: 24px;
  padding: 0 16px;
}

/* 添加点击态效果 */
.t-cell:active {
  background-color: var(--td-bg-color-secondarycontainer);
}

/* 登录表单样式 */
.login-form {
  background: var(--td-bg-color-container);
  padding: 24px;
  border-radius: 16px;
  width: 300px;
  max-width: 90vw;
}

.login-form-header {
  margin-bottom: 24px;
  text-align: center;
}

.login-form-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.login-form-buttons {
  margin-top: 24px;
}
</style>
