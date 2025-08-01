const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validate, validateQuery, schemas } = require('../utils/validation');

const router = express.Router();

// 获取文章评论（公开接口，支持可选认证）
router.get('/post/:post_id', 
    optionalAuth, 
    validateQuery(schemas.pagination), 
    commentController.getComments
);

// 创建评论（公开接口）
router.post('/', 
    validate(schemas.createComment), 
    commentController.createComment
);

// 获取待审核评论（需要管理员权限）
router.get('/pending', 
    authenticateToken, 
    requireRole(['admin', 'editor']),
    validateQuery(schemas.pagination),
    commentController.getPendingComments
);

// 获取评论统计（需要管理员权限）
router.get('/stats', 
    authenticateToken, 
    requireRole(['admin', 'editor']),
    commentController.getCommentStats
);

// 更新评论状态（需要管理员权限）
router.put('/:id/status', 
    authenticateToken, 
    requireRole(['admin', 'editor']),
    commentController.updateCommentStatus
);

// 删除评论（需要管理员权限）
router.delete('/:id', 
    authenticateToken, 
    requireRole(['admin']),
    commentController.deleteComment
);

module.exports = router;