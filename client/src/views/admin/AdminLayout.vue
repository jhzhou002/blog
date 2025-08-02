<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside width="250px" class="admin-sidebar">
      <div class="sidebar-header">
        <router-link to="/" class="brand-link">
          <h2>{{ siteTitle }}</h2>
          <p>管理后台</p>
        </router-link>
      </div>

      <el-menu
        :default-active="$route.path"
        class="admin-menu"
        router
        unique-opened
      >
        <el-menu-item index="/admin">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-sub-menu index="posts">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>文章管理</span>
          </template>
          <el-menu-item index="/admin/posts">所有文章</el-menu-item>
          <el-menu-item index="/admin/posts/create">创建文章</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/categories">
          <el-icon><Folder /></el-icon>
          <span>分类管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/tags">
          <el-icon><PriceTag /></el-icon>
          <span>标签管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/comments">
          <el-icon><ChatDotRound /></el-icon>
          <span>评论管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/media">
          <el-icon><Picture /></el-icon>
          <span>媒体管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/users" v-if="userStore.isAdmin">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/settings" v-if="userStore.isAdmin">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主要内容区域 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header height="60px" class="admin-header">
        <div class="header-left">
          <el-button 
            :icon="Expand" 
            text 
            @click="toggleSidebar"
            class="sidebar-toggle"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-badge :value="unreadCount" class="notification-badge">
            <el-button :icon="Bell" text />
          </el-badge>
          
          <el-dropdown>
            <span class="user-avatar">
              <el-avatar :size="32" :src="userStore.user?.avatar">
                {{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] }}
              </el-avatar>
              <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/')">
                  <el-icon><House /></el-icon>
                  前台首页
                </el-dropdown-item>
                <el-dropdown-item @click="handleProfile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Odometer, Document, Folder, PriceTag, ChatDotRound, Picture,
  User, Setting, Expand, Bell, House, SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const siteTitle = ref('我的博客')
const unreadCount = ref(0)

const breadcrumbs = computed(() => {
  const path = route.path
  const breadcrumbMap = {
    '/admin': [],
    '/admin/posts': [{ name: '文章管理', path: '/admin/posts' }],
    '/admin/posts/create': [
      { name: '文章管理', path: '/admin/posts' },
      { name: '创建文章', path: '/admin/posts/create' }
    ],
    '/admin/categories': [{ name: '分类管理', path: '/admin/categories' }],
    '/admin/tags': [{ name: '标签管理', path: '/admin/tags' }],
    '/admin/comments': [{ name: '评论管理', path: '/admin/comments' }],
    '/admin/media': [{ name: '媒体管理', path: '/admin/media' }],
    '/admin/users': [{ name: '用户管理', path: '/admin/users' }],
    '/admin/settings': [{ name: '系统设置', path: '/admin/settings' }]
  }
  
  return breadcrumbMap[path] || []
})

onMounted(async () => {
  try {
    // 加载网站设置
    const settingsRes = await api.get('/settings')
    siteTitle.value = settingsRes.data.data.site_title || '我的博客'

    // 加载未读通知数量
    loadUnreadCount()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})

const loadUnreadCount = async () => {
  try {
    const response = await api.get('/comments/pending')
    unreadCount.value = response.data.meta?.pagination?.total_items || 0
  } catch (error) {
    console.error('加载未读数量失败:', error)
  }
}

const toggleSidebar = () => {
  // 侧边栏切换逻辑
  console.log('切换侧边栏')
}

const handleProfile = () => {
  ElMessage.info('个人资料功能开发中')
}

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/auth/login')
}
</script>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;

  .admin-sidebar {
    background: #001529;
    
    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid #162332;

      .brand-link {
        color: white;
        text-decoration: none;
        display: block;

        h2 {
          margin: 0 0 0.25rem 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        p {
          margin: 0;
          font-size: 0.8rem;
          opacity: 0.7;
        }
      }
    }

    :deep(.el-menu) {
      border-right: none;
      background: #001529;

      .el-menu-item,
      .el-sub-menu__title {
        color: rgba(255, 255, 255, 0.8);

        &:hover {
          background: #1890ff;
          color: white;
        }

        &.is-active {
          background: #1890ff;
          color: white;
        }
      }

      .el-sub-menu {
        .el-menu-item {
          background: #000c17;

          &:hover {
            background: #1890ff;
          }

          &.is-active {
            background: #1890ff;
          }
        }
      }
    }
  }

  .admin-header {
    background: white;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;

      .sidebar-toggle {
        font-size: 1.2rem;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;

      .notification-badge {
        .el-button {
          font-size: 1.1rem;
        }
      }

      .user-avatar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;

        .username {
          font-size: 0.9rem;
          color: #666;
        }
      }
    }
  }

  .admin-main {
    background: #f5f5f5;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .admin-layout {
    .admin-sidebar {
      width: 200px !important;
    }

    .admin-header {
      padding: 0 1rem;

      .header-left {
        .sidebar-toggle {
          display: block;
        }
      }

      .header-right {
        .user-avatar {
          .username {
            display: none;
          }
        }
      }
    }

    .admin-main {
      padding: 1rem;
    }
  }
}
</style>