import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// 配置NProgress
NProgress.configure({ showSpinner: false })

const routes = [
  {
    path: '/',
    name: 'BlogLayout',
    component: () => import('@/views/blog/BlogLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/blog/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: '/post/:slug',
        name: 'PostDetail',
        component: () => import('@/views/blog/PostDetail.vue'),
        meta: { title: '文章详情' }
      },
      {
        path: '/category/:slug',
        name: 'Category',
        component: () => import('@/views/blog/Category.vue'),
        meta: { title: '分类' }
      },
      {
        path: '/tag/:slug',
        name: 'Tag',
        component: () => import('@/views/blog/Tag.vue'),
        meta: { title: '标签' }
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('@/views/blog/About.vue'),
        meta: { title: '关于' }
      }
    ]
  },
  {
    path: '/auth',
    name: 'AuthLayout',
    component: () => import('@/views/auth/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { title: '登录', guest: true }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: { title: '注册', guest: true }
      }
    ]
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresRole: ['admin', 'editor'] },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'posts',
        name: 'PostManagement',
        component: () => import('@/views/admin/PostManagement.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'posts/create',
        name: 'CreatePost',
        component: () => import('@/views/admin/PostEditor.vue'),
        meta: { title: '创建文章' }
      },
      {
        path: 'posts/edit/:id',
        name: 'EditPost',
        component: () => import('@/views/admin/PostEditor.vue'),
        meta: { title: '编辑文章' }
      },
      {
        path: 'categories',
        name: 'CategoryManagement',
        component: () => import('@/views/admin/CategoryManagement.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'tags',
        name: 'TagManagement',
        component: () => import('@/views/admin/TagManagement.vue'),
        meta: { title: '标签管理' }
      },
      {
        path: 'comments',
        name: 'CommentManagement',
        component: () => import('@/views/admin/CommentManagement.vue'),
        meta: { title: '评论管理' }
      },
      {
        path: 'media',
        name: 'MediaManagement',
        component: () => import('@/views/admin/MediaManagement.vue'),
        meta: { title: '媒体管理' }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/admin/UserManagement.vue'),
        meta: { title: '用户管理', requiresRole: ['admin'] }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/admin/Settings.vue'),
        meta: { title: '系统设置', requiresRole: ['admin'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const userStore = useUserStore()

  // 设置页面标题
  const baseTitle = '我的博客系统'
  document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle

  // 检查是否需要登录
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!userStore.isAuthenticated) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 检查角色权限
    if (to.meta.requiresRole && !to.meta.requiresRole.includes(userStore.user?.role)) {
      next({ name: 'NotFound' })
      return
    }
  }

  // 检查是否为游客页面（已登录用户不能访问）
  if (to.matched.some(record => record.meta.guest) && userStore.isAuthenticated) {
    next({ name: 'Home' })
    return
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router