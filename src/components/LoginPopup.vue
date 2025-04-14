<script setup lang="ts">
import { ref } from 'vue'
import { 
  Popup as TPopup,
  Form as TForm,
  Input as TInput,
  Button as TButton,
} from 'tdesign-mobile-vue'
import { useAppStore } from '../stores/app';

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const password = ref('')

const appStore = useAppStore();
const handleLogin = () => {
  appStore.handleLogin(password.value).then(() => {
    password.value = ''
  })
}

const handleClose = () => {
  emit('update:visible', false)
}

</script>

<template>
  <t-popup 
    :visible="props.visible" 
    placement="center" 
    :z-index="7000"
    @update:visible="(val) => emit('update:visible', val)"
  >
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
          <t-button theme="default" block @click="handleClose" style="margin-bottom: 12px;">
            取消
          </t-button>
          <t-button theme="primary" block @click="handleLogin">
            确认
          </t-button>
        </div>
      </t-form>
    </div>
  </t-popup>
</template>

<style scoped>
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