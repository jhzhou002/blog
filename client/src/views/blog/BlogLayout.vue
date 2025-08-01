<template>
  <div class="blog-layout">
    <!-- 顶部导航 -->
    <header class="blog-header">
      <div class="container">
        <nav class="navbar">
          <div class="navbar-brand">
            <router-link to="/" class="brand-link">
              <h1>{{ siteTitle }}</h1>
            </router-link>
          </div>

          <div class="navbar-menu">
            <router-link to="/" class="nav-link">首页</router-link>
            <el-dropdown trigger="hover" class="category-dropdown">
              <span class="nav-link">
                分类
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    v-for="category in categories" 
                    :key="category.id"
                    @click="$router.push(`/category/${category.slug}`)"
                  >
                    {{ category.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <router-link to="/about" class="nav-link">关于</router-link>
          </div>

          <div class="navbar-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索文章..."
              class="search-input"
              @keyup.enter="handleSearch"
            >
              <template #suffix>
                <el-icon @click="handleSearch" class="search-icon">
                  <Search />
                </el-icon>
              </template>
            </el-input>

            <template v-if="userStore.isAuthenticated">
              <el-dropdown>
                <span class="user-avatar">
                  <el-avatar :src="userStore.user.avatar" :size="32">
                    {{ userStore.user.nickname?.[0] || userStore.user.username?.[0] }}
                  </el-avatar>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="$router.push('/admin')">
                      管理后台
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <template v-else>
              <router-link to="/auth/login" class="btn btn-primary">登录</router-link>
            </template>
          </div>
        </nav>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="blog-main">
      <div class="container">
        <div class="blog-content">
          <div class="content-main">
            <router-view />
          </div>
          
          <!-- 侧边栏 -->
          <aside class="sidebar">
            <!-- 关于博客 -->
            <div class="sidebar-widget">
              <h3 class="widget-title">关于博客</h3>
              <div class="widget-content">
                <p>{{ siteDescription }}</p>
              </div>
            </div>

            <!-- 最新文章 -->
            <div class="sidebar-widget">
              <h3 class="widget-title">最新文章</h3>
              <div class="widget-content">
                <div 
                  v-for="post in recentPosts" 
                  :key="post.id"
                  class="recent-post"
                >
                  <router-link 
                    :to="`/post/${post.slug}`" 
                    class="recent-post-title"
                  >
                    {{ post.title }}
                  </router-link>
                  <div class="recent-post-date">
                    {{ formatDate(post.created_at) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 热门标签 -->
            <div class="sidebar-widget">
              <h3 class="widget-title">热门标签</h3>
              <div class="widget-content">
                <div class="tag-cloud">
                  <router-link
                    v-for="tag in popularTags"
                    :key="tag.id"
                    :to="`/tag/${tag.slug}`"
                    class="tag-item"
                    :style="{ fontSize: getTagSize(tag.post_count) + 'px' }"
                  >
                    {{ tag.name }}
                  </router-link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="blog-footer">
      <div class="container">
        <div class="footer-content">
          <p>&copy; 2024 {{ siteTitle }}. All rights reserved.</p>
          <p>基于 Vue.js + Node.js 构建</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import api from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const siteTitle = ref('我的博客')
const siteDescription = ref('分享技术与生活')
const searchKeyword = ref('')
const categories = ref([])
const recentPosts = ref([])
const popularTags = ref([])

onMounted(() => {
  loadInitialData()
})

const loadInitialData = async () => {
  try {
    // 并行加载数据
    const [settingsRes, categoriesRes, postsRes, tagsRes] = await Promise.all([
      api.get('/settings'),
      api.get('/categories'),
      api.get('/posts?limit=5&status=published'),
      api.get('/tags/popular?limit=15')
    ])

    // 设置网站信息
    const settings = settingsRes.data.data
    siteTitle.value = settings.site_title || '我的博客'
    siteDescription.value = settings.site_description || '分享技术与生活'

    // 设置其他数据
    categories.value = categoriesRes.data.data
    recentPosts.value = postsRes.data.data
    popularTags.value = tagsRes.data.data
  } catch (error) {
    console.error('加载初始数据失败:', error)
  }
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      name: 'Home',
      query: { search: searchKeyword.value.trim() }
    })
  }
}

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}

const formatDate = (date) => {
  return dayjs(date).format('MM-DD')
}

const getTagSize = (count) => {
  const minSize = 12
  const maxSize = 18
  const maxCount = Math.max(...popularTags.value.map(tag => tag.post_count))
  return minSize + (count / maxCount) * (maxSize - minSize)
}
</script>

<style lang="scss" scoped>
.blog-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.blog-header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;

  .navbar-brand {
    .brand-link {
      text-decoration: none;
      color: #333;

      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
      }
    }
  }

  .navbar-menu {
    display: flex;
    align-items: center;
    gap: 2rem;

    .nav-link {
      color: #666;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
      cursor: pointer;

      &:hover,
      &.router-link-active {
        color: #409eff;
      }
    }

    .category-dropdown {
      .nav-link {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .navbar-actions {
    display: flex;
    align-items: center;
    gap: 1rem;

    .search-input {
      width: 200px;
    }

    .search-icon {
      cursor: pointer;
      color: #909399;

      &:hover {
        color: #409eff;
      }
    }

    .user-avatar {
      cursor: pointer;
    }
  }
}

.blog-main {
  flex: 1;
  padding: 2rem 0;
}

.blog-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

.content-main {
  min-width: 0;
}

.sidebar {
  .sidebar-widget {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .widget-title {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #409eff;
      padding-bottom: 0.5rem;
    }

    .widget-content {
      .recent-post {
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }

        .recent-post-title {
          display: block;
          color: #333;
          text-decoration: none;
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 0.25rem;

          &:hover {
            color: #409eff;
          }
        }

        .recent-post-date {
          font-size: 0.8rem;
          color: #999;
        }
      }

      .tag-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        .tag-item {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: #f5f5f5;
          color: #666;
          text-decoration: none;
          border-radius: 12px;
          font-size: 0.8rem;
          transition: all 0.3s;

          &:hover {
            background: #409eff;
            color: white;
          }
        }
      }
    }
  }
}

.blog-footer {
  background: #333;
  color: white;
  padding: 2rem 0;
  margin-top: auto;

  .footer-content {
    text-align: center;

    p {
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }
  }
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;

    .navbar-menu {
      gap: 1rem;
    }

    .navbar-actions {
      .search-input {
        width: 150px;
      }
    }
  }

  .blog-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .sidebar {
    order: -1;
  }
}
</style>