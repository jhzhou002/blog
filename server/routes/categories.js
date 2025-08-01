const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// 获取所有分类（公开接口）
router.get('/', categoryController.getCategories);

// 获取单个分类（公开接口）
router.get('/:slug', categoryController.getCategory);

// 创建分类（需要管理员权限）
router.post('/', 
    authenticateToken, 
    requireRole(['admin', 'editor']),
    validate(schemas.createCategory), 
    categoryController.createCategory
);

// 更新分类（需要管理员权限）
router.put('/:id', 
    authenticateToken, 
    requireRole(['admin', 'editor']),
    categoryController.updateCategory
);

// 删除分类（需要管理员权限）
router.delete('/:id', 
    authenticateToken, 
    requireRole(['admin']),
    categoryController.deleteCategory
);

module.exports = router;