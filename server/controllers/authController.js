const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { success, error } = require('../utils/response');

class AuthController {
    // 用户注册
    async register(req, res) {
        try {
            const { username, email, password, nickname } = req.body;

            // 检查用户名是否已存在
            const existingUser = await query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existingUser.length > 0) {
                return res.status(400).json(error('用户名或邮箱已存在'));
            }

            // 加密密码
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 创建用户
            const result = await query(
                'INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, nickname || username]
            );

            // 生成JWT令牌
            const token = jwt.sign(
                { userId: result.insertId, username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // 获取用户信息（不包含密码）
            const newUser = await query(
                'SELECT id, username, email, nickname, role, created_at FROM users WHERE id = ?',
                [result.insertId]
            );

            res.status(201).json(success({
                user: newUser[0],
                token
            }, '注册成功'));

        } catch (err) {
            console.error('注册错误:', err);
            res.status(500).json(error('注册失败'));
        }
    }

    // 用户登录
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // 查找用户
            const users = await query(
                'SELECT id, username, email, nickname, password, role, status FROM users WHERE username = ? OR email = ?',
                [username, username]
            );

            if (users.length === 0) {
                return res.status(401).json(error('用户名或密码错误'));
            }

            const user = users[0];

            // 检查用户状态
            if (user.status !== 'active') {
                return res.status(401).json(error('账户已被禁用'));
            }

            // 验证密码
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json(error('用户名或密码错误'));
            }

            // 生成JWT令牌
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // 删除密码字段
            delete user.password;

            res.json(success({
                user,
                token
            }, '登录成功'));

        } catch (err) {
            console.error('登录错误:', err);
            res.status(500).json(error('登录失败'));
        }
    }

    // 获取当前用户信息
    async getCurrentUser(req, res) {
        try {
            const user = await query(
                'SELECT id, username, email, nickname, avatar, role, created_at FROM users WHERE id = ?',
                [req.user.id]
            );

            if (user.length === 0) {
                return res.status(404).json(error('用户不存在'));
            }

            res.json(success(user[0], '获取用户信息成功'));

        } catch (err) {
            console.error('获取用户信息错误:', err);
            res.status(500).json(error('获取用户信息失败'));
        }
    }

    // 更新用户信息
    async updateProfile(req, res) {
        try {
            const { nickname, avatar } = req.body;
            const userId = req.user.id;

            const result = await query(
                'UPDATE users SET nickname = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [nickname, avatar, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json(error('用户不存在'));
            }

            // 获取更新后的用户信息
            const updatedUser = await query(
                'SELECT id, username, email, nickname, avatar, role, created_at FROM users WHERE id = ?',
                [userId]
            );

            res.json(success(updatedUser[0], '更新成功'));

        } catch (err) {
            console.error('更新用户信息错误:', err);
            res.status(500).json(error('更新失败'));
        }
    }

    // 修改密码
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            // 获取当前密码
            const users = await query(
                'SELECT password FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json(error('用户不存在'));
            }

            // 验证当前密码
            const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
            if (!isValidPassword) {
                return res.status(400).json(error('当前密码错误'));
            }

            // 加密新密码
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // 更新密码
            await query(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedNewPassword, userId]
            );

            res.json(success(null, '密码修改成功'));

        } catch (err) {
            console.error('修改密码错误:', err);
            res.status(500).json(error('密码修改失败'));
        }
    }

    // 刷新令牌
    async refreshToken(req, res) {
        try {
            const userId = req.user.id;
            const username = req.user.username;

            // 生成新的JWT令牌
            const token = jwt.sign(
                { userId, username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json(success({ token }, '令牌刷新成功'));

        } catch (err) {
            console.error('刷新令牌错误:', err);
            res.status(500).json(error('令牌刷新失败'));
        }
    }
}

module.exports = new AuthController();