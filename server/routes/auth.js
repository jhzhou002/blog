const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// 用户注册
router.post('/register', validate(schemas.register), authController.register);

// 用户登录
router.post('/login', validate(schemas.login), authController.login);

// 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, authController.getCurrentUser);

// 更新用户信息（需要认证）
router.put('/profile', authenticateToken, authController.updateProfile);

// 修改密码（需要认证）
router.post('/change-password', authenticateToken, authController.changePassword);

// 刷新令牌（需要认证）
router.post('/refresh', authenticateToken, authController.refreshToken);

module.exports = router;