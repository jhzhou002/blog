<template>
  <div class="register-form">
    <h2 class="form-title">用户注册</h2>
    <p class="form-subtitle">创建您的新账号</p>

    <el-form 
      :model="registerForm" 
      :rules="rules" 
      ref="formRef"
      @submit.prevent="handleRegister"
    >
      <el-form-item prop="username">
        <el-input
          v-model="registerForm.username"
          size="large"
          placeholder="用户名"
          :prefix-icon="User"
        />
      </el-form-item>

      <el-form-item prop="email">
        <el-input
          v-model="registerForm.email"
          size="large"
          placeholder="邮箱地址"
          :prefix-icon="Message"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          size="large"
          placeholder="密码"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          size="large"
          placeholder="确认密码"
          :prefix-icon="Lock"
          show-password
          @keyup.enter="handleRegister"
        />
      </el-form-item>

      <el-form-item prop="nickname">
        <el-input
          v-model="registerForm.nickname"
          size="large"
          placeholder="昵称（可选）"
          :prefix-icon="Avatar"
        />
      </el-form-item>

      <el-form-item prop="agreement">
        <el-checkbox v-model="registerForm.agreement">
          我已阅读并同意
          <el-link type="primary" :underline="false">《用户协议》</el-link>
          和
          <el-link type="primary" :underline="false">《隐私政策》</el-link>
        </el-checkbox>
      </el-form-item>

      <el-form-item>
        <el-button 
          type="primary" 
          size="large" 
          :loading="loading"
          @click="handleRegister"
          style="width: 100%"
        >
          {{ loading ? '注册中...' : '注册' }}
        </el-button>
      </el-form-item>
    </el-form>

    <div class="form-footer">
      <p>
        已有账号？
        <router-link to="/auth/login" class="link">立即登录</router-link>
      </p>
    </div>

    <!-- 密码强度指示器 -->
    <div class="password-strength" v-if="registerForm.password">
      <div class="strength-label">密码强度：</div>
      <div class="strength-bar">
        <div 
          class="strength-fill" 
          :class="passwordStrengthClass"
          :style="{ width: passwordStrengthWidth }"
        ></div>
      </div>
      <div class="strength-text">{{ passwordStrengthText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Avatar } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()

const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  agreement: false
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateAgreement = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请阅读并同意用户协议'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6到20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: '昵称最多20个字符', trigger: 'blur' }
  ],
  agreement: [
    { validator: validateAgreement, trigger: 'change' }
  ]
}

// 密码强度计算
const passwordStrength = computed(() => {
  const password = registerForm.password
  if (!password) return 0

  let score = 0
  
  // 长度检查
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  
  // 包含数字
  if (/\d/.test(password)) score += 1
  
  // 包含小写字母
  if (/[a-z]/.test(password)) score += 1
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) score += 1
  
  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  return score
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
})

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 6) * 100}%`
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return '弱'
  if (strength <= 4) return '中等'
  return '强'
})

const handleRegister = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const registerData = {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
      nickname: registerForm.nickname || registerForm.username
    }

    await userStore.register(registerData)

    ElMessage.success('注册成功，欢迎加入！')
    router.push('/')

  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.register-form {
  .form-title {
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .form-subtitle {
    text-align: center;
    color: #666;
    margin: 0 0 2rem 0;
    font-size: 0.9rem;
  }

  .form-footer {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;

    p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .link {
      color: #409eff;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .password-strength {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;

    .strength-label {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .strength-bar {
      height: 4px;
      background: #eee;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 0.5rem;

      .strength-fill {
        height: 100%;
        transition: all 0.3s;

        &.weak {
          background: #f56c6c;
        }

        &.medium {
          background: #e6a23c;
        }

        &.strong {
          background: #67c23a;
        }
      }
    }

    .strength-text {
      font-size: 0.8rem;
      text-align: right;

      &.weak {
        color: #f56c6c;
      }

      &.medium {
        color: #e6a23c;
      }

      &.strong {
        color: #67c23a;
      }
    }
  }
}

:deep(.el-form-item) {
  margin-bottom: 1.2rem;
}

:deep(.el-input__wrapper) {
  padding: 12px 16px;
}

:deep(.el-checkbox) {
  .el-checkbox__label {
    font-size: 0.9rem;
    line-height: 1.4;
  }
}
</style>