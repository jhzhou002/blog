<template>
  <div class="post-detail">
    <div v-if="loading" class="loading-container">
      <el-loading :active="true" />
    </div>

    <div v-else-if="post" class="post-container">
      <!-- 文章头部 -->
      <header class="post-header">
        <h1 class="post-title">{{ post.title }}</h1>
        
        <div class="post-meta">
          <div class="meta-left">
            <span class="post-author">
              <el-icon><User /></el-icon>
              {{ post.author_nickname || post.author_name }}
            </span>
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
          </div>
          <div class="meta-right">
            <span class="post-views">
              <el-icon><View /></el-icon>
              {{ post.view_count }} 阅读
            </span>
            <span class="post-comments">
              <el-icon><ChatDotRound /></el-icon>
              {{ post.comment_count }} 评论
            </span>
          </div>
        </div>

        <div v-if="post.tags && post.tags.length > 0" class="post-tags">
          <el-tag 
            v-for="tag in post.tags" 
            :key="tag.id"
            size="small"
            class="tag-item"
            @click="$router.push(`/tag/${tag.slug}`)"
          >
            {{ tag.name }}
          </el-tag>
        </div>
      </header>

      <!-- 特色图片 -->
      <div v-if="post.featured_image" class="post-featured-image">
        <img :src="post.featured_image" :alt="post.title" />
      </div>

      <!-- 文章内容 -->
      <article class="post-content">
        <div class="article-content" v-html="renderContent(post.content)"></div>
      </article>

      <!-- 文章导航 -->
      <nav class="post-navigation" v-if="prevPost || nextPost">
        <div class="nav-item prev" v-if="prevPost">
          <span class="nav-label">上一篇</span>
          <router-link :to="`/post/${prevPost.slug}`" class="nav-title">
            {{ prevPost.title }}
          </router-link>
        </div>
        <div class="nav-item next" v-if="nextPost">
          <span class="nav-label">下一篇</span>
          <router-link :to="`/post/${nextPost.slug}`" class="nav-title">
            {{ nextPost.title }}
          </router-link>
        </div>
      </nav>

      <!-- 评论区域 -->
      <section class="comments-section">
        <h3 class="comments-title">
          评论 ({{ comments.length }})
        </h3>

        <!-- 评论表单 -->
        <div class="comment-form card">
          <el-form :model="commentForm" @submit.prevent="submitComment">
            <div class="form-row">
              <el-form-item label="姓名" required>
                <el-input v-model="commentForm.author_name" placeholder="请输入您的姓名" />
              </el-form-item>
              <el-form-item label="邮箱" required>
                <el-input v-model="commentForm.author_email" type="email" placeholder="请输入您的邮箱" />
              </el-form-item>
            </div>
            <el-form-item label="网站" class="full-width">
              <el-input v-model="commentForm.author_url" placeholder="您的网站地址（可选）" />
            </el-form-item>
            <el-form-item label="评论内容" required class="full-width">
              <el-input 
                v-model="commentForm.content" 
                type="textarea" 
                :rows="4"
                placeholder="请输入评论内容..."
              />
            </el-form-item>
            <el-form-item class="submit-btn">
              <el-button type="primary" @click="submitComment" :loading="submitting">
                发表评论
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 评论列表 -->
        <div class="comments-list">
          <div v-if="comments.length === 0" class="empty-comments">
            <el-icon class="empty-icon"><ChatDotRound /></el-icon>
            <p>暂无评论，来抢沙发吧！</p>
          </div>
          <div v-else>
            <CommentItem 
              v-for="comment in comments" 
              :key="comment.id"
              :comment="comment"
              @reply="handleReply"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-else class="error-state">
      <el-result icon="warning" title="文章不存在" sub-title="您访问的文章可能已被删除或不存在">
        <template #extra>
          <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Calendar, Folder, View, ChatDotRound } from '@element-plus/icons-vue'
import api from '@/api'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// 初始化Markdown解析器
const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return ''
  }
})

const route = useRoute()

const loading = ref(false)
const submitting = ref(false)
const post = ref(null)
const comments = ref([])
const prevPost = ref(null)
const nextPost = ref(null)

const commentForm = ref({
  author_name: '',
  author_email: '',
  author_url: '',
  content: '',
  parent_id: null
})

onMounted(() => {
  loadPost()
  loadComments()
})

const loadPost = async () => {
  try {
    loading.value = true
    const response = await api.get(`/posts/${route.params.slug}`)
    post.value = response.data.data
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  if (!post.value) return
  
  try {
    const response = await api.get(`/comments/post/${post.value.id}`)
    comments.value = response.data.data
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

const submitComment = async () => {
  if (!commentForm.value.author_name || !commentForm.value.author_email || !commentForm.value.content) {
    ElMessage.warning('请填写必填字段')
    return
  }

  try {
    submitting.value = true
    const data = {
      ...commentForm.value,
      post_id: post.value.id
    }

    await api.post('/comments', data)
    ElMessage.success('评论发表成功')
    
    // 重置表单
    commentForm.value = {
      author_name: '',
      author_email: '',
      author_url: '',
      content: '',
      parent_id: null
    }

    // 重新加载评论
    loadComments()
  } catch (error) {
    console.error('发表评论失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleReply = (comment) => {
  commentForm.value.parent_id = comment.id
  // 滚动到评论表单
  document.querySelector('.comment-form').scrollIntoView({ behavior: 'smooth' })
}

const renderContent = (content) => {
  return md.render(content)
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日 HH:mm')
}
</script>

<style lang="scss" scoped>
.post-detail {
  .post-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .post-header {
      padding: 2rem;
      border-bottom: 1px solid #eee;

      .post-title {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
        line-height: 1.3;
        color: #333;
      }

      .post-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        color: #666;

        .meta-left, .meta-right {
          display: flex;
          gap: 1rem;
        }

        > div > span {
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

      .post-tags {
        .tag-item {
          margin-right: 0.5rem;
          cursor: pointer;
        }
      }
    }

    .post-featured-image {
      width: 100%;
      max-height: 400px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .post-content {
      padding: 2rem;
    }

    .post-navigation {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      padding: 2rem;
      border-top: 1px solid #eee;

      .nav-item {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;

        &.prev {
          text-align: left;
        }

        &.next {
          text-align: right;
        }

        .nav-label {
          display: block;
          font-size: 0.8rem;
          color: #999;
          margin-bottom: 0.5rem;
        }

        .nav-title {
          color: #333;
          text-decoration: none;
          font-weight: 500;
          line-height: 1.4;

          &:hover {
            color: #409eff;
          }
        }
      }
    }

    .comments-section {
      padding: 2rem;
      border-top: 1px solid #eee;

      .comments-title {
        margin: 0 0 2rem 0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .comment-form {
        margin-bottom: 2rem;
        padding: 1.5rem;

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .submit-btn {
          text-align: right;
        }
      }

      .empty-comments {
        text-align: center;
        padding: 3rem;
        color: #999;

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .post-detail {
    .post-container {
      .post-header {
        padding: 1.5rem;

        .post-title {
          font-size: 1.5rem;
        }

        .post-meta {
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;

          .meta-left, .meta-right {
            flex-wrap: wrap;
          }
        }
      }

      .post-content {
        padding: 1.5rem;
      }

      .post-navigation {
        grid-template-columns: 1fr;
        padding: 1.5rem;
      }

      .comments-section {
        padding: 1.5rem;

        .comment-form {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  }
}
</style>