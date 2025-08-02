<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-header">
        <router-link to="/" class="brand-link">
          <h1>{{ siteTitle }}</h1>
        </router-link>
        <p class="brand-subtitle">{{ siteDescription }}</p>
      </div>

      <div class="auth-content">
        <router-view />
      </div>

      <div class="auth-footer">
        <p>&copy; 2024 {{ siteTitle }}. All rights reserved.</p>
        <div class="auth-links">
          <router-link to="/">返回首页</router-link>
          <span class="divider">|</span>
          <router-link to="/about">关于我们</router-link>
        </div>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="auth-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const siteTitle = ref('我的博客')
const siteDescription = ref('分享技术与生活')

onMounted(async () => {
  try {
    const response = await api.get('/settings')
    const settings = response.data.data
    siteTitle.value = settings.site_title || '我的博客'
    siteDescription.value = settings.site_description || '分享技术与生活'
  } catch (error) {
    console.error('加载网站设置失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;

  .auth-container {
    width: 100%;
    max-width: 400px;
    margin: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    position: relative;
    z-index: 10;

    .auth-header {
      padding: 2rem 2rem 1rem;
      text-align: center;
      background: linear-gradient(135deg, #409eff, #66b1ff);
      color: white;

      .brand-link {
        text-decoration: none;
        color: inherit;

        h1 {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
          font-weight: 700;
        }
      }

      .brand-subtitle {
        margin: 0;
        opacity: 0.9;
        font-size: 0.9rem;
      }
    }

    .auth-content {
      padding: 2rem;
    }

    .auth-footer {
      padding: 1.5rem;
      text-align: center;
      background: #f8f9fa;
      border-top: 1px solid #eee;

      p {
        margin: 0 0 1rem 0;
        font-size: 0.8rem;
        color: #999;
      }

      .auth-links {
        font-size: 0.9rem;

        a {
          color: #409eff;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        .divider {
          margin: 0 0.5rem;
          color: #ccc;
        }
      }
    }
  }

  .auth-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    .bg-shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 6s ease-in-out infinite;

      &.shape-1 {
        width: 200px;
        height: 200px;
        top: 10%;
        left: 10%;
        animation-delay: 0s;
      }

      &.shape-2 {
        width: 150px;
        height: 150px;
        top: 60%;
        right: 15%;
        animation-delay: 2s;
      }

      &.shape-3 {
        width: 100px;
        height: 100px;
        bottom: 20%;
        left: 60%;
        animation-delay: 4s;
      }
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@media (max-width: 480px) {
  .auth-layout {
    padding: 1rem;

    .auth-container {
      margin: 0;
      border-radius: 8px;

      .auth-header {
        padding: 1.5rem 1.5rem 1rem;

        h1 {
          font-size: 1.5rem;
        }
      }

      .auth-content {
        padding: 1.5rem;
      }

      .auth-footer {
        padding: 1rem;
      }
    }
  }
}
</style>