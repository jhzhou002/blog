const express = require('express');
const postController = require('../controllers/postController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validate, validateQuery, schemas } = require('../utils/validation');

const router = express.Router();

// 获取文章列表（公开接口，支持可选认证）
router.get('/', optionalAuth, validateQuery(schemas.postQuery), postController.getPosts);

// 获取单篇文章（公开接口，支持可选认证）
router.get('/:slug', optionalAuth, postController.getPost);

// 创建文章（需要认证）
router.post('/', 
    authenticateToken, 
    validate(schemas.createPost), 
    postController.createPost
);

// 更新文章（需要认证，只能作者或管理员操作）
router.put('/:id', 
    authenticateToken, 
    validate(schemas.updatePost), 
    postController.updatePost
);

// 删除文章（需要认证，只能作者或管理员操作）
router.delete('/:id', 
    authenticateToken, 
    postController.deletePost
);

module.exports = router;