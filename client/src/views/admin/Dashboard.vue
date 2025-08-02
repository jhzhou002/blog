<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>仪表盘</h1>
      <p>欢迎回来，{{ userStore.user?.nickname || userStore.user?.username }}！</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#409eff"><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.posts }}</div>
          <div class="stat-label">文章总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#67c23a"><ChatDotRound /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.comments }}</div>
          <div class="stat-label">评论总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#e6a23c"><View /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.views }}</div>
          <div class="stat-label">总浏览量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#f56c6c"><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.users }}</div>
          <div class="stat-label">注册用户</div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-grid">
      <!-- 最新文章 -->
      <div class="content-card">
        <div class="card-header">
          <h3>最新文章</h3>
          <router-link to="/admin/posts" class="more-link">查看更多</router-link>
        </div>
        <div class="card-content">
          <div v-if="recentPosts.length === 0" class="empty-state">
            暂无文章
          </div>
          <div v-else class="post-list">
            <div 
              v-for="post in recentPosts" 
              :key="post.id"
              class="post-item"
            >
              <div class="post-title">{{ post.title }}</div>
              <div class="post-meta">
                <span>{{ formatDate(post.created_at) }}</span>
                <el-tag :type="getStatusType(post.status)" size="small">
                  {{ getStatusText(post.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 待审核评论 -->
      <div class="content-card">
        <div class="card-header">
          <h3>待审核评论</h3>
          <router-link to="/admin/comments" class="more-link">查看更多</router-link>
        </div>
        <div class="card-content">
          <div v-if="pendingComments.length === 0" class="empty-state">
            暂无待审核评论
          </div>
          <div v-else class="comment-list">
            <div 
              v-for="comment in pendingComments" 
              :key="comment.id"
              class="comment-item"
            >
              <div class="comment-content">{{ comment.content }}</div>
              <div class="comment-meta">
                <span>{{ comment.author_name }}</span>
                <span>{{ formatDate(comment.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h3>快捷操作</h3>
      <div class="action-buttons">
        <el-button type="primary" @click="$router.push('/admin/posts/create')">
          <el-icon><Plus /></el-icon>
          写文章
        </el-button>
        <el-button @click="$router.push('/admin/media')">
          <el-icon><Upload /></el-icon>
          上传文件
        </el-button>
        <el-button @click="$router.push('/admin/categories')">
          <el-icon><Folder /></el-icon>
          管理分类
        </el-button>
        <el-button @click="$router.push('/admin/settings')">
          <el-icon><Setting /></el-icon>
          系统设置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Document, ChatDotRound, View, User, Plus, Upload, Folder, Setting } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import api from '@/api'
import dayjs from 'dayjs'

const userStore = useUserStore()

const stats = ref({
  posts: 0,
  comments: 0,
  views: 0,
  users: 0
})

const recentPosts = ref([])
const pendingComments = ref([])

onMounted(() => {
  loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    // 并行加载数据
    const [postsRes, commentsRes, pendingRes] = await Promise.all([
      api.get('/posts?limit=5'),
      api.get('/comments/stats'),
      api.get('/comments/pending?limit=5')
    ])

    // 设置统计数据
    stats.value.posts = postsRes.data.meta?.pagination?.total_items || 0
    stats.value.comments = commentsRes.data.data?.total || 0
    stats.value.views = Math.floor(Math.random() * 10000) + 5000 // 示例数据
    stats.value.users = Math.floor(Math.random() * 100) + 50 // 示例数据

    // 设置列表数据
    recentPosts.value = postsRes.data.data.slice(0, 5)
    pendingComments.value = pendingRes.data.data.slice(0, 5)

  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  }
}

const formatDate = (date) => {
  return dayjs(date).format('MM-DD HH:mm')
}

const getStatusType = (status) => {
  const statusMap = {
    published: 'success',
    draft: 'warning',
    private: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    published: '已发布',
    draft: '草稿',
    private: '私有'
  }
  return statusMap[status] || status
}
</script>

<style lang="scss" scoped>
.dashboard {
  .dashboard-header {
    margin-bottom: 2rem;

    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
      color: #333;
    }

    p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;

    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;

      .stat-icon {
        font-size: 2.5rem;
      }

      .stat-content {
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }
      }
    }
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;

    .content-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .card-header {
        padding: 1.5rem 1.5rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }

        .more-link {
          color: #409eff;
          text-decoration: none;
          font-size: 0.9rem;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .card-content {
        padding: 1rem 1.5rem 1.5rem;

        .empty-state {
          text-align: center;
          color: #999;
          padding: 2rem 0;
        }

        .post-list, .comment-list {
          .post-item, .comment-item {
            padding: 0.75rem 0;
            border-bottom: 1px solid #eee;

            &:last-child {
              border-bottom: none;
            }
          }

          .post-item {
            .post-title {
              font-weight: 500;
              color: #333;
              margin-bottom: 0.5rem;
              line-height: 1.4;
            }

            .post-meta {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 0.8rem;
              color: #999;
            }
          }

          .comment-item {
            .comment-content {
              color: #333;
              margin-bottom: 0.5rem;
              line-height: 1.4;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .comment-meta {
              display: flex;
              gap: 1rem;
              font-size: 0.8rem;
              color: #999;
            }
          }
        }
      }
    }
  }

  .quick-actions {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
  }
}

@media (max-width: 768px) {
  .dashboard {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .content-grid {
      grid-template-columns: 1fr;
    }

    .quick-actions {
      .action-buttons {
        flex-direction: column;

        .el-button {
          justify-content: flex-start;
        }
      }
    }
  }
}
</style>