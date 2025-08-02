<template>
  <div class="about-page">
    <div class="about-container card">
      <header class="about-header">
        <h1 class="about-title">关于我们</h1>
        <p class="about-subtitle">分享技术与生活的点点滴滴</p>
      </header>

      <div class="about-content">
        <section class="intro-section">
          <h2>欢迎来到我的博客</h2>
          <p>
            这里是一个分享技术知识、生活感悟和思考的地方。我们致力于创造有价值的内容，
            希望能够帮助更多的人学习成长，也期待与大家交流互动。
          </p>
        </section>

        <section class="tech-section">
          <h2>技术栈</h2>
          <p>本博客系统采用现代化的技术栈构建：</p>
          <div class="tech-grid">
            <div class="tech-item">
              <div class="tech-icon">🎨</div>
              <h3>前端技术</h3>
              <ul>
                <li>Vue.js 3 - 渐进式框架</li>
                <li>Element Plus - UI组件库</li>
                <li>Vite - 构建工具</li>
                <li>Pinia - 状态管理</li>
              </ul>
            </div>
            <div class="tech-item">
              <div class="tech-icon">⚙️</div>
              <h3>后端技术</h3>
              <ul>
                <li>Node.js - 运行时环境</li>
                <li>Express.js - Web框架</li>
                <li>MySQL - 数据库</li>
                <li>JWT - 身份认证</li>
              </ul>
            </div>
            <div class="tech-item">
              <div class="tech-icon">🚀</div>
              <h3>部署运维</h3>
              <ul>
                <li>宝塔面板 - 服务器管理</li>
                <li>Nginx - 反向代理</li>
                <li>PM2 - 进程管理</li>
                <li>SSL - 安全证书</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="features-section">
          <h2>功能特性</h2>
          <div class="features-grid">
            <div class="feature-item">
              <el-icon class="feature-icon" color="#409eff"><Document /></el-icon>
              <h3>文章管理</h3>
              <p>支持Markdown编辑，草稿发布，分类标签</p>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon" color="#67c23a"><ChatDotRound /></el-icon>
              <h3>评论系统</h3>
              <p>嵌套回复，评论审核，垃圾过滤</p>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon" color="#e6a23c"><User /></el-icon>
              <h3>用户管理</h3>
              <p>多角色权限，安全认证，个人资料</p>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon" color="#f56c6c"><Setting /></el-icon>
              <h3>系统设置</h3>
              <p>灵活配置，SEO优化，性能监控</p>
            </div>
          </div>
        </section>

        <section class="contact-section">
          <h2>联系方式</h2>
          <div class="contact-info">
            <div class="contact-item">
              <el-icon><Message /></el-icon>
              <span>邮箱：contact@myblog.com</span>
            </div>
            <div class="contact-item">
              <el-icon><Link /></el-icon>
              <span>GitHub：https://github.com/myblog</span>
            </div>
            <div class="contact-item">
              <el-icon><Location /></el-icon>
              <span>地址：中国·北京</span>
            </div>
          </div>
        </section>

        <section class="stats-section">
          <h2>网站统计</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ stats.posts }}</div>
              <div class="stat-label">文章数量</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ stats.comments }}</div>
              <div class="stat-label">评论数量</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ stats.views }}</div>
              <div class="stat-label">总访问量</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ daysSinceStart }}</div>
              <div class="stat-label">运行天数</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Document, ChatDotRound, User, Setting, Message, Link, Location } from '@element-plus/icons-vue'
import api from '@/api'
import dayjs from 'dayjs'

const stats = ref({
  posts: 0,
  comments: 0,
  views: 0
})

const startDate = '2024-01-01' // 网站开始日期

const daysSinceStart = computed(() => {
  return dayjs().diff(dayjs(startDate), 'day')
})

onMounted(() => {
  loadStats()
})

const loadStats = async () => {
  try {
    // 加载网站统计数据
    const [postsRes, commentsRes] = await Promise.all([
      api.get('/posts?limit=1'),
      api.get('/comments/stats')
    ])

    stats.value.posts = postsRes.data.meta?.pagination?.total_items || 0
    stats.value.comments = commentsRes.data.data?.total || 0
    stats.value.views = Math.floor(Math.random() * 10000) + 5000 // 示例数据
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.about-page {
  .about-container {
    max-width: 800px;
    margin: 0 auto;

    .about-header {
      text-align: center;
      padding: 3rem 2rem 2rem;
      border-bottom: 1px solid #eee;

      .about-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
        color: #333;
      }

      .about-subtitle {
        font-size: 1.1rem;
        color: #666;
        margin: 0;
      }
    }

    .about-content {
      padding: 2rem;

      section {
        margin-bottom: 3rem;

        h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 1.5rem 0;
          color: #333;
          position: relative;
          padding-left: 1rem;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0.2rem;
            width: 4px;
            height: 1.2rem;
            background: #409eff;
            border-radius: 2px;
          }
        }

        p {
          color: #666;
          line-height: 1.8;
          margin-bottom: 1rem;
        }
      }

      .tech-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;

        .tech-item {
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;

          .tech-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
          }

          h3 {
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            color: #333;
          }

          ul {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
              padding: 0.25rem 0;
              color: #666;
              font-size: 0.9rem;
            }
          }
        }
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;

        .feature-item {
          text-align: center;
          padding: 1.5rem;

          .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }

          h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
            color: #333;
          }

          p {
            color: #666;
            font-size: 0.9rem;
            margin: 0;
          }
        }
      }

      .contact-info {
        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #666;

          .el-icon {
            color: #409eff;
          }
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1.5rem;

        .stat-item {
          text-align: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #409eff, #66b1ff);
          color: white;
          border-radius: 8px;

          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .about-page {
    .about-container {
      .about-header {
        padding: 2rem 1.5rem 1.5rem;

        .about-title {
          font-size: 2rem;
        }

        .about-subtitle {
          font-size: 1rem;
        }
      }

      .about-content {
        padding: 1.5rem;

        .tech-grid,
        .features-grid {
          grid-template-columns: 1fr;
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }
  }
}
</style>