const { query } = require('../config/database');
const { success, error, paginate } = require('../utils/response');

class TagController {
    // 获取所有标签
    async getTags(req, res) {
        try {
            const { page = 1, limit = 50, search } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = '';
            let params = [];

            if (search) {
                whereClause = 'WHERE t.name LIKE ?';
                params.push(`%${search}%`);
            }

            // 获取标签列表，包含文章数量
            const tags = await query(`
                SELECT 
                    t.*,
                    COUNT(pt.post_id) as post_count
                FROM tags t
                LEFT JOIN post_tags pt ON t.id = pt.tag_id
                LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
                ${whereClause}
                GROUP BY t.id
                ORDER BY post_count DESC, t.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);

            // 获取总数
            const totalResult = await query(`
                SELECT COUNT(DISTINCT t.id) as total
                FROM tags t
                ${whereClause}
            `, params);

            const total = totalResult[0].total;

            res.json(paginate(tags, parseInt(page), parseInt(limit), total));

        } catch (err) {
            console.error('获取标签错误:', err);
            res.status(500).json(error('获取标签失败'));
        }
    }

    // 获取单个标签
    async getTag(req, res) {
        try {
            const { slug } = req.params;

            const tags = await query(`
                SELECT 
                    t.*,
                    COUNT(pt.post_id) as post_count
                FROM tags t
                LEFT JOIN post_tags pt ON t.id = pt.tag_id
                LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
                WHERE t.slug = ?
                GROUP BY t.id
            `, [slug]);

            if (tags.length === 0) {
                return res.status(404).json(error('标签不存在'));
            }

            res.json(success(tags[0], '获取标签成功'));

        } catch (err) {
            console.error('获取标签错误:', err);
            res.status(500).json(error('获取标签失败'));
        }
    }

    // 创建标签
    async createTag(req, res) {
        try {
            const { name, description } = req.body;

            // 生成slug
            const slug = this.generateSlug(name);

            // 检查slug是否已存在
            const existingTag = await query('SELECT id FROM tags WHERE slug = ?', [slug]);
            if (existingTag.length > 0) {
                return res.status(400).json(error('标签名称已存在'));
            }

            const result = await query(
                'INSERT INTO tags (name, slug, description) VALUES (?, ?, ?)',
                [name, slug, description]
            );

            // 获取创建的标签
            const newTag = await query(
                'SELECT * FROM tags WHERE id = ?',
                [result.insertId]
            );

            res.status(201).json(success(newTag[0], '标签创建成功'));

        } catch (err) {
            console.error('创建标签错误:', err);
            res.status(500).json(error('创建标签失败'));
        }
    }

    // 更新标签
    async updateTag(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            // 检查标签是否存在
            const existingTag = await query('SELECT * FROM tags WHERE id = ?', [id]);
            if (existingTag.length === 0) {
                return res.status(404).json(error('标签不存在'));
            }

            let slug = existingTag[0].slug;

            // 如果名称改变，重新生成slug
            if (name && name !== existingTag[0].name) {
                slug = this.generateSlug(name);
                
                // 检查新slug是否已存在
                const duplicateSlug = await query('SELECT id FROM tags WHERE slug = ? AND id != ?', [slug, id]);
                if (duplicateSlug.length > 0) {
                    return res.status(400).json(error('标签名称已存在'));
                }
            }

            // 更新标签
            await query(
                `UPDATE tags SET 
                 name = COALESCE(?, name),
                 slug = ?, 
                 description = COALESCE(?, description),
                 updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [name, slug, description, id]
            );

            // 获取更新后的标签
            const updatedTag = await query('SELECT * FROM tags WHERE id = ?', [id]);

            res.json(success(updatedTag[0], '标签更新成功'));

        } catch (err) {
            console.error('更新标签错误:', err);
            res.status(500).json(error('更新标签失败'));
        }
    }

    // 删除标签
    async deleteTag(req, res) {
        try {
            const { id } = req.params;

            // 检查标签是否存在
            const existingTag = await query('SELECT * FROM tags WHERE id = ?', [id]);
            if (existingTag.length === 0) {
                return res.status(404).json(error('标签不存在'));
            }

            // 删除标签（会自动删除post_tags关联）
            await query('DELETE FROM tags WHERE id = ?', [id]);

            res.json(success(null, '标签删除成功'));

        } catch (err) {
            console.error('删除标签错误:', err);
            res.status(500).json(error('删除标签失败'));
        }
    }

    // 获取热门标签
    async getPopularTags(req, res) {
        try {
            const { limit = 20 } = req.query;
            const limitNum = parseInt(limit);

            const tags = await query(`
                SELECT 
                    t.*,
                    COUNT(pt.post_id) as post_count
                FROM tags t
                LEFT JOIN post_tags pt ON t.id = pt.tag_id
                LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
                GROUP BY t.id
                HAVING post_count > 0
                ORDER BY post_count DESC, t.created_at DESC
                LIMIT ?
            `, [limitNum]);

            res.json(success(tags, '获取热门标签成功'));

        } catch (err) {
            console.error('获取热门标签错误:', err);
            res.status(500).json(error('获取热门标签失败'));
        }
    }

    // 辅助方法：生成slug
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}

module.exports = new TagController();