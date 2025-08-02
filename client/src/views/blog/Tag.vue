<template>
  <div class="tag-page">
    <div v-if="loading" class="loading-container">
      <el-loading :active="true" />
    </div>

    <div v-else>
      <!-- 标签信息 -->
      <div v-if="tag" class="tag-header card">
        <h1 class="tag-title">
          <el-icon><PriceTag /></el-icon>
          {{ tag.name }}
        </h1>
        <p v-if="tag.description" class="tag-description">
          {{ tag.description }}
        </p>
        <div class="tag-stats">
          共 {{ total }} 篇文章
        </div>
      </div>

      <!-- 文章列表 -->
      <div class="posts-container">
        <div v-if="posts.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p class="empty-text">该标签下暂无文章</p>
        </div>

        <div v-else class="posts-list">
          <article 
            v-for="post in posts" 
            :key="post.id" 
            class="post-card card"
          >
            <div v-if="post.featured_image" class="post-image">
              <img :src="post.featured_image" :alt="post.title" />
            </div>

            <div class="post-content">
              <div class="post-meta">
                <span class="post-date">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(post.published_at || post.created_at) }}
                </span>
                <span v-if="post.category_name" class="post-category">
                  <el-icon><Folder /></el-icon>
                  <router-link :to="`/category/${post.category_slug}`">
                    {{ post.category_name }}
                  </router-link>
                </span>
                <span class="post-views">
                  <el-icon><View /></el-icon>
                  {{ post.view_count }} 阅读
                </span>
                <span class="post-comments">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ post.comment_count }} 评论
                </span>
              </div>

              <h2 class="post-title">
                <router-link :to="`/post/${post.slug}`">
                  {{ post.title }}
                </router-link>
              </h2>

              <p class="post-excerpt">
                {{ post.excerpt || post.content.substring(0, 200) + '...' }}
              </p>

              <div class="post-tags" v-if="post.tags && post.tags.length > 0">
                <el-tag 
                  v-for="postTag in post.tags" 
                  :key="postTag.id"
                  size="small"
                  class="tag-item"
                  :class="{ 'current-tag': postTag.slug === $route.params.slug }"
                  @click="$router.push(`/tag/${postTag.slug}`)"
                >
                  {{ postTag.name }}
                </el-tag>
              </div>

              <div class="post-footer">
                <span class="post-author">
                  <el-icon><User /></el-icon>
                  {{ post.author_nickname || post.author_name }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="total > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next, jumper, total"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Document, Calendar, Folder, View, User, ChatDotRound, PriceTag } from '@element-plus/icons-vue'
import api from '@/api'
import dayjs from 'dayjs'

const route = useRoute()

const loading = ref(false)
const tag = ref(null)
const posts = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

onMounted(() => {
  loadTag()
  loadPosts()
})

watch(() => route.params.slug, () => {
  currentPage.value = 1
  loadTag()
  loadPosts()
})

const loadTag = async () => {
  try {
    const response = await api.get(`/tags/${route.params.slug}`)
    tag.value = response.data.data
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

const loadPosts = async () => {
  try {
    loading.value = true
    
    // 通过标签获取文章
    const response = await api.get('/posts', {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        status: 'published',
        tag: route.params.slug
      }
    })
    
    posts.value = response.data.data
    total.value = response.data.meta.pagination.total_items

  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日')
}
</script>

<style lang="scss" scoped>
.tag-page {
  .tag-header {
    margin-bottom: 2rem;
    padding: 2rem;

    .tag-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      font-size: 2rem;
      font-weight: 700;
      color: #333;
    }

    .tag-description {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .tag-stats {
      color: #999;
      font-size: 0.9rem;
    }
  }

  .posts-container {
    .posts-list {
      .post-card {
        margin-bottom: 2rem;
        overflow: hidden;
        transition: transform 0.2s;

        &:hover {
          transform: translateY(-2px);
        }

        .post-image {
          height: 200px;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
          }

          &:hover img {
            transform: scale(1.05);
          }
        }

        .post-content {
          padding: 1.5rem;

          .post-meta {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            color: #666;

            > span {
              display: flex;
              align-items: center;
              gap: 0.25rem;
            }

            a {
              color: #409eff;
              text-decoration: none;

              &:hover {
                text-decoration: underline;
              }
            }
          }

          .post-title {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
            font-weight: 600;
            line-height: 1.3;

            a {
              color: #333;
              text-decoration: none;
              transition: color 0.3s;

              &:hover {
                color: #409eff;
              }
            }
          }

          .post-excerpt {
            color: #666;
            line-height: 1.6;
            margin-bottom: 1rem;
          }

          .post-tags {
            margin-bottom: 1rem;

            .tag-item {
              margin-right: 0.5rem;
              cursor: pointer;

              &.current-tag {
                background-color: #409eff;
                color: white;
                border-color: #409eff;
              }
            }
          }

          .post-footer {
            display: flex;
            align-items: center;
            font-size: 0.9rem;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 1rem;

            > span {
              display: flex;
              align-items: center;
              gap: 0.25rem;
            }
          }
        }
      }
    }

    .pagination-wrapper {
      display: flex;
      justify-content: center;
      margin-top: 3rem;
      padding: 2rem 0;
    }
  }
}

@media (max-width: 768px) {
  .tag-page {
    .tag-header {
      padding: 1.5rem;

      .tag-title {
        font-size: 1.5rem;
      }
    }

    .posts-container {
      .posts-list {
        .post-card {
          .post-content {
            padding: 1rem;

            .post-meta {
              flex-wrap: wrap;
              gap: 0.5rem;
            }

            .post-title {
              font-size: 1.25rem;
            }
          }
        }
      }
    }
  }
}
</style>