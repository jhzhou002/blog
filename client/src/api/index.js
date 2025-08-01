import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/store/user'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { success, message } = response.data
    
    // 如果是成功的操作，显示成功消息（排除GET请求）
    if (success && response.config.method !== 'get' && message !== '获取成功') {
      ElMessage.success(message)
    }
    
    return response
  },
  (error) => {
    const { response } = error
    const userStore = useUserStore()

    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 401:
          // 未认证，清除本地存储并跳转到登录页
          userStore.clearAuth()
          router.push({ name: 'Login' })
          ElMessage.error(data.message || '登录已过期，请重新登录')
          break
        case 403:
          ElMessage.error(data.message || '权限不足')
          break
        case 404:
          ElMessage.error(data.message || '请求的资源不存在')
          break
        case 422:
          // 表单验证错误
          if (data.details && Array.isArray(data.details)) {
            const errorMsg = data.details.map(detail => detail.message).join(', ')
            ElMessage.error(errorMsg)
          } else {
            ElMessage.error(data.message || '数据验证失败')
          }
          break
        case 429:
          ElMessage.error('请求过于频繁，请稍后再试')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data.message || '网络错误')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络连接失败')
    }

    return Promise.reject(error)
  }
)

export default api