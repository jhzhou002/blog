const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件 (JPEG, JPG, PNG, GIF, WebP)'));
        }
    }
});

// 上传文件
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(error('请选择要上传的文件'));
        }

        const { filename, originalname, mimetype, size } = req.file;
        const filePath = `/uploads/${filename}`;
        const altText = req.body.alt_text || '';

        // 保存文件信息到数据库
        const result = await query(
            `INSERT INTO media 
             (filename, original_name, mime_type, file_size, file_path, alt_text, uploader_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [filename, originalname, mimetype, size, filePath, altText, req.user.id]
        );

        // 获取保存的媒体信息
        const media = await query(
            'SELECT * FROM media WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(success(media[0], '文件上传成功'));

    } catch (err) {
        console.error('文件上传错误:', err);
        res.status(500).json(error('文件上传失败'));
    }
});

// 获取媒体列表
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const media = await query(`
            SELECT 
                m.*,
                u.username as uploader_name
            FROM media m
            LEFT JOIN users u ON m.uploader_id = u.id
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        const totalResult = await query('SELECT COUNT(*) as total FROM media');
        const total = totalResult[0].total;

        res.json({
            success: true,
            data: media,
            meta: {
                pagination: {
                    current_page: parseInt(page),
                    per_page: parseInt(limit),
                    total_items: total,
                    total_pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (err) {
        console.error('获取媒体列表错误:', err);
        res.status(500).json(error('获取媒体列表失败'));
    }
});

// 删除媒体文件
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 获取文件信息
        const media = await query('SELECT * FROM media WHERE id = ?', [id]);
        
        if (media.length === 0) {
            return res.status(404).json(error('文件不存在'));
        }

        const file = media[0];

        // 检查权限（只有上传者或管理员可以删除）
        if (file.uploader_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json(error('无权删除该文件'));
        }

        // 删除物理文件
        const filePath = path.join(__dirname, '..', file.file_path);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.error('删除物理文件失败:', err);
        }

        // 删除数据库记录
        await query('DELETE FROM media WHERE id = ?', [id]);

        res.json(success(null, '文件删除成功'));

    } catch (err) {
        console.error('删除媒体文件错误:', err);
        res.status(500).json(error('删除文件失败'));
    }
});

module.exports = router;