const express = require('express');
const tagController = require('../controllers/tagController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, validateQuery, schemas } = require('../utils/validation');

const router = express.Router();

// 获取所有标签（公开接口）
router.get('/', validateQuery(schemas.pagination), tagController.getTags);

// 获取热门标签（公开接口）
router.get('/popular', tagController.getPopularTags);

// 获取单个标签（公开接口）
router.get('/:slug', tagController.getTag);

// 创建标签（需要编辑器权限）
router.post('/', 
    authenticateToken, 
    requireRole(['admin', 'editor']),
    validate(schemas.createTag), 
    tagController.createTag
);

// 更新标签（需要编辑器权限）
router.put('/:id', 
    authenticateToken, 
    requireRole(['admin', 'editor']),
    tagController.updateTag
);

// 删除标签（需要管理员权限）
router.delete('/:id', 
    authenticateToken, 
    requireRole(['admin']),
    tagController.deleteTag
);

module.exports = router;