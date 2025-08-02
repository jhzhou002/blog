const { query } = require('../config/database');
const { success, error } = require('../utils/response');

// 辅助函数：生成slug
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// 辅助函数：构建分类树
const buildCategoryTree = (categories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // 第一遍：创建所有分类的映射
    categories.forEach(category => {
        category.children = [];
        categoryMap.set(category.id, category);
    });

    // 第二遍：构建树形结构
    categories.forEach(category => {
        if (category.parent_id) {
            const parent = categoryMap.get(category.parent_id);
            if (parent) {
                parent.children.push(category);
            }
        } else {
            rootCategories.push(category);
        }
    });

    return rootCategories;
};

// 辅助函数：检查是否会造成循环引用
const checkCategoryLoop = async (categoryId, parentId) => {
    if (categoryId == parentId) {
        return true;
    }

    const parent = await query('SELECT parent_id FROM categories WHERE id = ?', [parentId]);
    if (parent.length === 0 || !parent[0].parent_id) {
        return false;
    }

    return await checkCategoryLoop(categoryId, parent[0].parent_id);
};

class CategoryController {
    // 获取所有分类
    async getCategories(req, res) {
        try {
            const categories = await query(`
                SELECT 
                    c.*,
                    COUNT(p.id) as post_count,
                    parent.name as parent_name
                FROM categories c
                LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
                LEFT JOIN categories parent ON c.parent_id = parent.id
                GROUP BY c.id
                ORDER BY c.parent_id IS NULL DESC, c.sort_order ASC, c.created_at ASC
            `);

            // 构建树形结构
            const categoryTree = buildCategoryTree(categories);

            res.json(success(categoryTree, '获取分类成功'));

        } catch (err) {
            console.error('获取分类错误:', err);
            res.status(500).json(error('获取分类失败'));
        }
    }

    // 获取单个分类
    async getCategory(req, res) {
        try {
            const { slug } = req.params;

            const categories = await query(`
                SELECT 
                    c.*,
                    COUNT(p.id) as post_count,
                    parent.name as parent_name
                FROM categories c
                LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
                LEFT JOIN categories parent ON c.parent_id = parent.id
                WHERE c.slug = ?
                GROUP BY c.id
            `, [slug]);

            if (categories.length === 0) {
                return res.status(404).json(error('分类不存在'));
            }

            res.json(success(categories[0], '获取分类成功'));

        } catch (err) {
            console.error('获取分类错误:', err);
            res.status(500).json(error('获取分类失败'));
        }
    }

    // 创建分类
    async createCategory(req, res) {
        try {
            const { name, description, parent_id } = req.body;

            // 生成slug
            const slug = generateSlug(name);

            // 检查slug是否已存在
            const existingCategory = await query('SELECT id FROM categories WHERE slug = ?', [slug]);
            if (existingCategory.length > 0) {
                return res.status(400).json(error('分类名称已存在'));
            }

            // 如果有父分类，检查父分类是否存在
            if (parent_id) {
                const parentCategory = await query('SELECT id FROM categories WHERE id = ?', [parent_id]);
                if (parentCategory.length === 0) {
                    return res.status(400).json(error('父分类不存在'));
                }
            }

            const result = await query(
                'INSERT INTO categories (name, slug, description, parent_id) VALUES (?, ?, ?, ?)',
                [name, slug, description, parent_id || null]
            );

            // 获取创建的分类
            const newCategory = await query(
                'SELECT * FROM categories WHERE id = ?',
                [result.insertId]
            );

            res.status(201).json(success(newCategory[0], '分类创建成功'));

        } catch (err) {
            console.error('创建分类错误:', err);
            res.status(500).json(error('创建分类失败'));
        }
    }

    // 更新分类
    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, description, parent_id, sort_order } = req.body;

            // 检查分类是否存在
            const existingCategory = await query('SELECT * FROM categories WHERE id = ?', [id]);
            if (existingCategory.length === 0) {
                return res.status(404).json(error('分类不存在'));
            }

            let slug = existingCategory[0].slug;

            // 如果名称改变，重新生成slug
            if (name && name !== existingCategory[0].name) {
                slug = generateSlug(name);
                
                // 检查新slug是否已存在
                const duplicateSlug = await query('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug, id]);
                if (duplicateSlug.length > 0) {
                    return res.status(400).json(error('分类名称已存在'));
                }
            }

            // 如果设置了父分类，检查是否会造成循环引用
            if (parent_id && parent_id != existingCategory[0].parent_id) {
                const wouldCreateCycle = await checkCategoryLoop(id, parent_id);
                if (wouldCreateCycle) {
                    return res.status(400).json(error('不能设置子分类为父分类'));
                }
            }

            // 更新分类
            await query(
                `UPDATE categories SET 
                 name = COALESCE(?, name),
                 slug = ?, 
                 description = COALESCE(?, description),
                 parent_id = ?,
                 sort_order = COALESCE(?, sort_order),
                 updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [name, slug, description, parent_id, sort_order, id]
            );

            // 获取更新后的分类
            const updatedCategory = await query('SELECT * FROM categories WHERE id = ?', [id]);

            res.json(success(updatedCategory[0], '分类更新成功'));

        } catch (err) {
            console.error('更新分类错误:', err);
            res.status(500).json(error('更新分类失败'));
        }
    }

    // 删除分类
    async deleteCategory(req, res) {
        try {
            const { id } = req.params;

            // 检查分类是否存在
            const existingCategory = await query('SELECT * FROM categories WHERE id = ?', [id]);
            if (existingCategory.length === 0) {
                return res.status(404).json(error('分类不存在'));
            }

            // 检查是否有子分类
            const childCategories = await query('SELECT id FROM categories WHERE parent_id = ?', [id]);
            if (childCategories.length > 0) {
                return res.status(400).json(error('存在子分类，无法删除'));
            }

            // 检查是否有文章使用此分类
            const postsUsingCategory = await query('SELECT id FROM posts WHERE category_id = ?', [id]);
            if (postsUsingCategory.length > 0) {
                // 将使用此分类的文章的分类设为null
                await query('UPDATE posts SET category_id = NULL WHERE category_id = ?', [id]);
            }

            // 删除分类
            await query('DELETE FROM categories WHERE id = ?', [id]);

            res.json(success(null, '分类删除成功'));

        } catch (err) {
            console.error('删除分类错误:', err);
            res.status(500).json(error('删除分类失败'));
        }
    }
}

module.exports = new CategoryController();