const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { success, error, paginate } = require('../utils/response');
const { validateQuery, schemas } = require('../utils/validation');

const router = express.Router();

// 获取用户列表（管理员功能）
router.get('/', authenticateToken, requireRole(['admin']), validateQuery(schemas.pagination), async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role, status } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        if (search) {
            whereConditions.push('(username LIKE ? OR email LIKE ? OR nickname LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (role) {
            whereConditions.push('role = ?');
            params.push(role);
        }

        if (status) {
            whereConditions.push('status = ?');
            params.push(status);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        const users = await query(`
            SELECT 
                id, username, email, nickname, avatar, role, status, created_at, updated_at
            FROM users
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        const totalResult = await query(`
            SELECT COUNT(*) as total FROM users ${whereClause}
        `, params);

        const total = totalResult[0].total;

        res.json(paginate(users, parseInt(page), parseInt(limit), total));

    } catch (err) {
        console.error('获取用户列表错误:', err);
        res.status(500).json(error('获取用户列表失败'));
    }
});

// 更新用户状态（管理员功能）
router.put('/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'banned'].includes(status)) {
            return res.status(400).json(error('无效的用户状态'));
        }

        const result = await query(
            'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json(error('用户不存在'));
        }

        res.json(success(null, '用户状态更新成功'));

    } catch (err) {
        console.error('更新用户状态错误:', err);
        res.status(500).json(error('更新用户状态失败'));
    }
});

module.exports = router;