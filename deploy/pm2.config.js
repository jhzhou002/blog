module.exports = {
  apps: [{
    name: 'blog-server',
    script: './server/app.js',
    cwd: '/www/wwwroot/blog',
    instances: 1, // 可以设置为 'max' 使用所有CPU核心
    exec_mode: 'cluster',
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      
      // 数据库配置
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_USER: 'blog_user',
      DB_PASSWORD: 'your_db_password',
      DB_NAME: 'blog_system',
      
      // JWT配置
      JWT_SECRET: 'your_jwt_secret_key_change_this_in_production',
      JWT_EXPIRES_IN: '7d',
      
      // 文件上传配置
      UPLOAD_PATH: './uploads',
      MAX_FILE_SIZE: 10485760, // 10MB
    },
    
    // 开发环境配置
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
    },
    
    // 监控和重启配置
    watch: false, // 生产环境不建议开启
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_memory_restart: '500M',
    
    // 日志配置
    log_file: '/www/wwwroot/blog/logs/pm2.log',
    out_file: '/www/wwwroot/blog/logs/pm2_out.log',
    error_file: '/www/wwwroot/blog/logs/pm2_error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // 自动重启配置
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 集群配置
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000,
  }]
}