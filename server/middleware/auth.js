const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌缺失'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 验证用户是否存在且状态正常
        const user = await query(
            'SELECT id, username, email, nickname, role, status FROM users WHERE id = ? AND status = "active"',
            [decoded.userId]
        );

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }

        req.user = user[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的访问令牌'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '访问令牌已过期'
            });
        }

        console.error('认证中间件错误:', error);
        res.status(500).json({
            success: false,
            message: '认证失败'
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证的用户'
            });
        }

        const userRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!userRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        next();
    };
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await query(
                'SELECT id, username, email, nickname, role, status FROM users WHERE id = ? AND status = "active"',
                [decoded.userId]
            );

            if (user.length > 0) {
                req.user = user[0];
            }
        }

        next();
    } catch (error) {
        // 可选认证失败时不阻止请求继续
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    optionalAuth
};