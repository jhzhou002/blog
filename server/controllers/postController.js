const { query, transaction } = require('../config/database');
const { success, error, paginate } = require('../utils/response');

class PostController {
    // 创建文章
    async createPost(req, res) {
        try {
            const { title, content, excerpt, status, category_id, tags, featured_image } = req.body;
            const authorId = req.user.id;

            // 生成slug
            const slug = this.generateSlug(title);

            // 检查slug是否已存在
            const existingPost = await query('SELECT id FROM posts WHERE slug = ?', [slug]);
            if (existingPost.length > 0) {
                return res.status(400).json(error('标题已存在，请使用不同的标题'));
            }

            const result = await transaction(async (connection) => {
                // 插入文章
                const [postResult] = await connection.execute(
                    `INSERT INTO posts (title, slug, content, excerpt, featured_image, status, 
                     author_id, category_id, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        title, slug, content, excerpt, featured_image, status,
                        authorId, category_id || null,
                        status === 'published' ? new Date() : null
                    ]
                );

                const postId = postResult.insertId;

                // 处理标签关联
                if (tags && tags.length > 0) {
                    for (const tagId of tags) {
                        await connection.execute(
                            'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
                            [postId, tagId]
                        );
                    }
                }

                return postId;
            });

            // 获取创建的文章详情
            const newPost = await this.getPostById(result);

            res.status(201).json(success(newPost, '文章创建成功'));

        } catch (err) {
            console.error('创建文章错误:', err);
            res.status(500).json(error('创建文章失败'));
        }
    }

    // 获取文章列表
    async getPosts(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status, 
                category_id, 
                author_id, 
                search,
                sort = 'created_at',
                order = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;
            let whereConditions = [];
            let params = [];

            // 构建查询条件
            if (status) {
                whereConditions.push('p.status = ?');
                params.push(status);
            } else if (!req.user || req.user.role !== 'admin') {
                // 非管理员只能看到已发布的文章
                whereConditions.push('p.status = "published"');
            }

            if (category_id) {
                whereConditions.push('p.category_id = ?');
                params.push(category_id);
            }

            if (author_id) {
                whereConditions.push('p.author_id = ?');
                params.push(author_id);
            }

            if (search) {
                whereConditions.push('(p.title LIKE ? OR p.content LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            const whereClause = whereConditions.length > 0 
                ? 'WHERE ' + whereConditions.join(' AND ') 
                : '';

            // 查询文章列表
            const posts = await query(`
                SELECT 
                    p.id, p.title, p.slug, p.excerpt, p.featured_image, p.status,
                    p.view_count, p.comment_count, p.published_at, p.created_at, p.updated_at,
                    u.username as author_name, u.nickname as author_nickname,
                    c.name as category_name, c.slug as category_slug
                FROM posts p
                LEFT JOIN users u ON p.author_id = u.id
                LEFT JOIN categories c ON p.category_id = c.id
                ${whereClause}
                ORDER BY p.${sort} ${order}
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);

            // 查询总数
            const totalResult = await query(`
                SELECT COUNT(*) as total
                FROM posts p
                ${whereClause}
            `, params);

            const total = totalResult[0].total;

            // 为每篇文章获取标签
            for (let post of posts) {
                const tags = await query(`
                    SELECT t.id, t.name, t.slug
                    FROM tags t
                    JOIN post_tags pt ON t.id = pt.tag_id
                    WHERE pt.post_id = ?
                `, [post.id]);
                post.tags = tags;
            }

            res.json(paginate(posts, parseInt(page), parseInt(limit), total));

        } catch (err) {
            console.error('获取文章列表错误:', err);
            res.status(500).json(error('获取文章列表失败'));
        }
    }

    // 获取单篇文章
    async getPost(req, res) {
        try {
            const { slug } = req.params;
            const post = await this.getPostBySlug(slug);

            if (!post) {
                return res.status(404).json(error('文章不存在'));
            }

            // 检查访问权限
            if (post.status !== 'published' && 
                (!req.user || (req.user.id !== post.author_id && req.user.role !== 'admin'))) {
                return res.status(403).json(error('无权访问该文章'));
            }

            // 增加浏览量（仅对已发布的文章）
            if (post.status === 'published') {
                await query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [post.id]);
                post.view_count++;
            }

            res.json(success(post, '获取文章成功'));

        } catch (err) {
            console.error('获取文章错误:', err);
            res.status(500).json(error('获取文章失败'));
        }
    }

    // 更新文章
    async updatePost(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const userId = req.user.id;
            const userRole = req.user.role;

            // 获取原文章信息
            const existingPost = await query(
                'SELECT * FROM posts WHERE id = ?',
                [id]
            );

            if (existingPost.length === 0) {
                return res.status(404).json(error('文章不存在'));
            }

            const post = existingPost[0];

            // 检查权限
            if (post.author_id !== userId && userRole !== 'admin') {
                return res.status(403).json(error('无权修改该文章'));
            }

            const result = await transaction(async (connection) => {
                // 更新基本信息
                const updateFields = [];
                const updateParams = [];

                Object.keys(updates).forEach(key => {
                    if (['title', 'content', 'excerpt', 'status', 'category_id', 'featured_image'].includes(key)) {
                        updateFields.push(`${key} = ?`);
                        updateParams.push(updates[key]);
                    }
                });

                // 如果有标题更新，需要更新slug
                if (updates.title && updates.title !== post.title) {
                    const newSlug = this.generateSlug(updates.title);
                    const existingSlug = await query('SELECT id FROM posts WHERE slug = ? AND id != ?', [newSlug, id]);
                    if (existingSlug.length > 0) {
                        throw new Error('标题已存在，请使用不同的标题');
                    }
                    updateFields.push('slug = ?');
                    updateParams.push(newSlug);
                }

                // 如果状态改为发布，更新发布时间
                if (updates.status === 'published' && post.status !== 'published') {
                    updateFields.push('published_at = ?');
                    updateParams.push(new Date());
                }

                updateFields.push('updated_at = CURRENT_TIMESTAMP');

                if (updateFields.length > 0) {
                    updateParams.push(id);
                    await connection.execute(
                        `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`,
                        updateParams
                    );
                }

                // 处理标签更新
                if (updates.tags !== undefined) {
                    // 删除原有标签关联
                    await connection.execute('DELETE FROM post_tags WHERE post_id = ?', [id]);
                    
                    // 添加新的标签关联
                    if (updates.tags.length > 0) {
                        for (const tagId of updates.tags) {
                            await connection.execute(
                                'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
                                [id, tagId]
                            );
                        }
                    }
                }
            });

            // 获取更新后的文章
            const updatedPost = await this.getPostById(id);

            res.json(success(updatedPost, '文章更新成功'));

        } catch (err) {
            console.error('更新文章错误:', err);
            if (err.message === '标题已存在，请使用不同的标题') {
                res.status(400).json(error(err.message));
            } else {
                res.status(500).json(error('更新文章失败'));
            }
        }
    }

    // 删除文章
    async deletePost(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            // 检查文章是否存在
            const existingPost = await query(
                'SELECT author_id FROM posts WHERE id = ?',
                [id]
            );

            if (existingPost.length === 0) {
                return res.status(404).json(error('文章不存在'));
            }

            // 检查权限
            if (existingPost[0].author_id !== userId && userRole !== 'admin') {
                return res.status(403).json(error('无权删除该文章'));
            }

            // 删除文章（级联删除标签关联和评论）
            await query('DELETE FROM posts WHERE id = ?', [id]);

            res.json(success(null, '文章删除成功'));

        } catch (err) {
            console.error('删除文章错误:', err);
            res.status(500).json(error('删除文章失败'));
        }
    }

    // 辅助方法：生成slug
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            + '-' + Date.now();
    }

    // 辅助方法：根据ID获取文章详情
    async getPostById(id) {
        const posts = await query(`
            SELECT 
                p.*, 
                u.username as author_name, u.nickname as author_nickname,
                c.name as category_name, c.slug as category_slug
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);

        if (posts.length === 0) return null;

        const post = posts[0];

        // 获取标签
        const tags = await query(`
            SELECT t.id, t.name, t.slug
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ?
        `, [id]);

        post.tags = tags;
        return post;
    }

    // 辅助方法：根据slug获取文章详情
    async getPostBySlug(slug) {
        const posts = await query(`
            SELECT 
                p.*, 
                u.username as author_name, u.nickname as author_nickname,
                c.name as category_name, c.slug as category_slug
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ?
        `, [slug]);

        if (posts.length === 0) return null;

        const post = posts[0];

        // 获取标签
        const tags = await query(`
            SELECT t.id, t.name, t.slug
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ?
        `, [post.id]);

        post.tags = tags;
        return post;
    }
}

module.exports = new PostController();