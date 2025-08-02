<template>
  <div class="login-form">
    <h2 class="form-title">用户登录</h2>
    <p class="form-subtitle">请输入您的账号和密码</p>

    <el-form 
      :model="loginForm" 
      :rules="rules" 
      ref="formRef"
      @submit.prevent="handleLogin"
    >
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          size="large"
          placeholder="用户名或邮箱"
          :prefix-icon="User"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          placeholder="密码"
          :prefix-icon="Lock"
          show-password
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <el-form-item>
        <div class="form-options">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码？</el-link>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button 
          type="primary" 
          size="large" 
          :loading="loading"
          @click="handleLogin"
          style="width: 100%"
        >
          {{ loading ? '登录中...' : '登录' }}
        </el-button>
      </el-form-item>
    </el-form>

    <div class="form-footer">
      <p>
        还没有账号？
        <router-link to="/auth/register" class="link">立即注册</router-link>
      </p>
    </div>

    <!-- 社交登录 -->
    <div class="social-login">
      <div class="divider">
        <span>或使用以下方式登录</span>
      </div>
      <div class="social-buttons">
        <el-button size="large" style="width: 48%">
          <el-icon><Platform /></el-icon>
          GitHub
        </el-button>
        <el-button size="large" style="width: 48%">
          <el-icon><Message /></el-icon>
          微信
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Platform, Message } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref()

const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

onMounted(() => {
  // 如果有记住的登录信息，自动填充
  const savedUsername = localStorage.getItem('saved_username')
  if (savedUsername) {
    loginForm.username = savedUsername
    rememberMe.value = true
  }
})

const handleLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const loginData = {
      username: loginForm.username,
      password: loginForm.password
    }

    await userStore.login(loginData)

    // 记住用户名
    if (rememberMe.value) {
      localStorage.setItem('saved_username', loginForm.username)
    } else {
      localStorage.removeItem('saved_username')
    }

    ElMessage.success('登录成功')

    // 跳转到原来要访问的页面，或默认到首页
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)

  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-form {
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

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
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

  .social-login {
    margin-top: 1.5rem;

    .divider {
      position: relative;
      text-align: center;
      margin-bottom: 1rem;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #eee;
      }

      span {
        background: white;
        padding: 0 1rem;
        color: #999;
        font-size: 0.8rem;
      }
    }

    .social-buttons {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
    }
  }
}

:deep(.el-form-item) {
  margin-bottom: 1.5rem;
}

:deep(.el-input__wrapper) {
  padding: 12px 16px;
}
</style>