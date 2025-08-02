<template>
  <div class="admin-page">
    <div class="page-header">
      <h1>Settings</h1>
    </div>

    <div class="coming-soon">
      <el-result icon="info" title="功能开发中" sub-title="Settings功能正在开发中，敬请期待！">
        <template #extra>
          <el-button type="primary" @click="$router.push('/admin')">返回仪表盘</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.admin-page {
  .page-header {
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
