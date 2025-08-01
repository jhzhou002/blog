<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onMounted(() => {
  // 应用启动时检查用户登录状态
  userStore.checkAuth()
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>