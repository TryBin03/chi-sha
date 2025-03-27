<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  Form as TForm,
  FormItem as TFormItem,
  Input as TInput,
  RadioGroup as TRadioGroup,
  Radio as TRadio,
  Button as TButton,
  type FormRule,
} from 'tdesign-mobile-vue'

interface FormData {
  name: string
  type: string
  category: string
}

interface Dish {
  id: number
  name: string
  type: string
  category: string
}

const props = defineProps<{
  initialData?: FormData
  submitText?: string
  allDishes?: Dish[]
  currentId?: number
}>()

const emit = defineEmits<{
  (e: 'submit', data: FormData): void
  (e: 'cancel'): void
}>()

const formData = ref<FormData>({
  name: props.initialData?.name || '',
  type: props.initialData?.type || 'meat',
  category: props.initialData?.category || ''
})

// 监听 initialData 的变化
watch(() => props.initialData, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal }
  }
}, { deep: true })

const rules = {
  name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' }
  ] as FormRule[]
}

const onSubmit = () => {
  emit('submit', formData.value)
  // 重置表单数据
  formData.value = {
    name: '',
    type: 'meat',
    category: ''
  }
}

const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <t-form ref="form" 
    :data="formData" 
    :rules="rules"
    :requiredMark="false"
    :labelWidth="0" 
    @submit="onSubmit">
    <t-form-item name="name">
      <t-input
        v-model="formData.name"
        placeholder="菜品名称"
        required
        borderless
      />
    </t-form-item>
    <t-radio-group v-model="formData.type" borderless>
      <t-radio value="meat">荤菜</t-radio>
      <t-radio value="vegetable">素菜</t-radio>
      <t-radio value="soup">汤类</t-radio>
    </t-radio-group>
    <!-- <t-form-item name="category">
    <t-input
      v-model="formData.category"
      placeholder="请输入菜品分类（如：川菜、粤菜等）"
      borderless
    />
    </t-form-item> -->
    <div class="form-buttons">
      <t-button theme="default" @click="onCancel">
        取消
      </t-button>
      <t-button theme="primary" type="submit">
        {{ submitText || '确认' }}
      </t-button>
    </div>
  </t-form>
</template>

<style scoped>
/* 表单样式优化 */
.t-form {
  background: var(--td-bg-color-container);
  border-radius: 8px;
  margin-bottom: 16px;
  transition: background-color 0.3s ease;
}
.t-form .t-form__item {
  padding: 0
}
.t-form .t-form__item:not(:last-child)::after{
  left: 0
}

.t-radio-group {
  margin: 16px 0;
  display: flex;
  justify-content: space-between;
  background-color: var(--bg-color-demo, #fff);
}


.form-buttons {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
}
.form-buttons .t-button {
    flex: 1;
}
.form-buttons .t-button:not(:last-child) {
    flex: 1;
    margin-right: 16px;
}
</style> 