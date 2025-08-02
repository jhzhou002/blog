<template>
  <div class="post-management">
    <div class="page-header">
      <h1>文章管理</h1>
      <el-button type="primary" @click="$router.push('/admin/posts/create')">
        <el-icon><Plus /></el-icon>
        新建文章
      </el-button>
    </div>

    <div class="coming-soon">
      <el-result icon="info" title="功能开发中" sub-title="文章管理功能正在开发中，敬请期待！">
        <template #extra>
          <el-button type="primary" @click="$router.push('/admin')">返回仪表盘</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.post-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }
  }

  .coming-soon {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}
</style>