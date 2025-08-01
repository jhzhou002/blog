import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEditor = computed(() => ['admin', 'editor'].includes(user.value?.role))

  // 设置认证信息
  const setAuth = (userData, tokenValue) => {
    user.value = userData
    token.value = tokenValue
    localStorage.setItem('token', tokenValue)
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  // 登录
  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const { user: userData, token: tokenValue } = response.data.data
      setAuth(userData, tokenValue)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      const { user: newUser, token: tokenValue } = response.data.data
      setAuth(newUser, tokenValue)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 登出
  const logout = () => {
    clearAuth()
  }

  // 检查认证状态
  const checkAuth = async () => {
    if (!token.value) {
      return false
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const response = await api.get('/auth/me')
      user.value = response.data.data
      return true
    } catch (error) {
      clearAuth()
      return false
    }
  }

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData)
      user.value = response.data.data
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 修改密码
  const changePassword = async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isEditor,
    setAuth,
    clearAuth,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    changePassword
  }
})