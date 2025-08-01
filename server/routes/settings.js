const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const router = express.Router();

// 获取所有设置（公开接口，但敏感信息需要权限）
router.get('/', async (req, res) => {
    try {
        const settings = await query('SELECT setting_key, setting_value, description FROM settings');
        
        const settingsMap = {};
        settings.forEach(setting => {
            // 公开的设置项
            const publicSettings = [
                'site_title', 'site_description', 'site_keywords', 
                'posts_per_page', 'site_logo'
            ];
            
            if (publicSettings.includes(setting.setting_key)) {
                settingsMap[setting.setting_key] = setting.setting_value;
            }
        });

        res.json(success(settingsMap, '获取设置成功'));

    } catch (err) {
        console.error('获取设置错误:', err);
        res.status(500).json(error('获取设置失败'));
    }
});

// 获取所有设置（管理员功能）
router.get('/admin', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const settings = await query('SELECT * FROM settings ORDER BY setting_key');
        
        const settingsMap = {};
        settings.forEach(setting => {
            settingsMap[setting.setting_key] = {
                value: setting.setting_value,
                description: setting.description
            };
        });

        res.json(success(settingsMap, '获取所有设置成功'));

    } catch (err) {
        console.error('获取所有设置错误:', err);
        res.status(500).json(error('获取所有设置失败'));
    }
});

// 更新设置（管理员功能）
router.put('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const settings = req.body;

        for (const [key, value] of Object.entries(settings)) {
            // 检查设置是否存在
            const existingSetting = await query(
                'SELECT id FROM settings WHERE setting_key = ?',
                [key]
            );

            if (existingSetting.length > 0) {
                // 更新现有设置
                await query(
                    'UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
                    [value, key]
                );
            } else {
                // 创建新设置
                await query(
                    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
                    [key, value]
                );
            }
        }

        res.json(success(null, '设置更新成功'));

    } catch (err) {
        console.error('更新设置错误:', err);
        res.status(500).json(error('更新设置失败'));
    }
});

// 获取单个设置
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;

        const setting = await query(
            'SELECT setting_value FROM settings WHERE setting_key = ?',
            [key]
        );

        if (setting.length === 0) {
            return res.status(404).json(error('设置不存在'));
        }

        res.json(success({
            key,
            value: setting[0].setting_value
        }, '获取设置成功'));

    } catch (err) {
        console.error('获取设置错误:', err);
        res.status(500).json(error('获取设置失败'));
    }
});

module.exports = router;