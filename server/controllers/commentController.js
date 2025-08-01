const { query } = require('../config/database');
const { success, error, paginate } = require('../utils/response');

class CommentController {
    // 获取文章评论
    async getComments(req, res) {
        try {
            const { post_id } = req.params;
            const { page = 1, limit = 20, status = 'approved' } = req.query;
            const offset = (page - 1) * limit;

            // 检查文章是否存在
            const post = await query('SELECT id, status FROM posts WHERE id = ?', [post_id]);
            if (post.length === 0) {
                return res.status(404).json(error('文章不存在'));
            }

            // 构建查询条件
            let whereConditions = ['post_id = ?'];
            let params = [post_id];

            // 非管理员只能看到已审核的评论
            if (!req.user || req.user.role !== 'admin') {
                whereConditions.push('status = "approved"');
            } else if (status) {
                whereConditions.push('status = ?');
                params.push(status);
            }

            const whereClause = 'WHERE ' + whereConditions.join(' AND ');

            // 获取评论列表
            const comments = await query(`
                SELECT 
                    id, post_id, parent_id, author_name, author_email, author_url,
                    content, status, created_at
                FROM comments
                ${whereClause}
                ORDER BY created_at ASC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);

            // 获取总数
            const totalResult = await query(`
                SELECT COUNT(*) as total
                FROM comments
                ${whereClause}
            `, params);

            const total = totalResult[0].total;

            // 构建评论树形结构
            const commentTree = this.buildCommentTree(comments);

            res.json(paginate(commentTree, parseInt(page), parseInt(limit), total));

        } catch (err) {
            console.error('获取评论错误:', err);
            res.status(500).json(error('获取评论失败'));
        }
    }

    // 创建评论
    async createComment(req, res) {
        try {
            const { post_id, parent_id, author_name, author_email, author_url, content } = req.body;

            // 检查文章是否存在且已发布
            const post = await query('SELECT id, status FROM posts WHERE id = ? AND status = "published"', [post_id]);
            if (post.length === 0) {
                return res.status(404).json(error('文章不存在或未发布'));
            }

            // 如果是回复评论，检查父评论是否存在
            if (parent_id) {
                const parentComment = await query('SELECT id FROM comments WHERE id = ? AND post_id = ?', [parent_id, post_id]);
                if (parentComment.length === 0) {
                    return res.status(400).json(error('回复的评论不存在'));
                }
            }

            // 获取评论审核设置
            const moderationSetting = await query(
                'SELECT setting_value FROM settings WHERE setting_key = "comment_moderation"'
            );
            const needModeration = moderationSetting.length > 0 && moderationSetting[0].setting_value === '1';

            // 获取客户端IP
            const author_ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

            // 创建评论
            const result = await query(
                `INSERT INTO comments 
                 (post_id, parent_id, author_name, author_email, author_url, content, author_ip, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    post_id, parent_id || null, author_name, author_email, 
                    author_url || null, content, author_ip,
                    needModeration ? 'pending' : 'approved'
                ]
            );

            // 更新文章评论数量
            await query(
                'UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ? AND status = "approved") WHERE id = ?',
                [post_id, post_id]
            );

            // 获取创建的评论
            const newComment = await query(
                'SELECT id, post_id, parent_id, author_name, author_email, author_url, content, status, created_at FROM comments WHERE id = ?',
                [result.insertId]
            );

            const message = needModeration ? '评论已提交，等待审核' : '评论发表成功';
            res.status(201).json(success(newComment[0], message));

        } catch (err) {
            console.error('创建评论错误:', err);
            res.status(500).json(error('评论发表失败'));
        }
    }

    // 更新评论状态（管理员功能）
    async updateCommentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // 检查评论是否存在
            const comment = await query('SELECT * FROM comments WHERE id = ?', [id]);
            if (comment.length === 0) {
                return res.status(404).json(error('评论不存在'));
            }

            // 更新评论状态
            await query('UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

            // 更新文章评论数量
            await query(
                'UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ? AND status = "approved") WHERE id = ?',
                [comment[0].post_id, comment[0].post_id]
            );

            // 获取更新后的评论
            const updatedComment = await query(
                'SELECT id, post_id, parent_id, author_name, author_email, author_url, content, status, created_at FROM comments WHERE id = ?',
                [id]
            );

            res.json(success(updatedComment[0], '评论状态更新成功'));

        } catch (err) {
            console.error('更新评论状态错误:', err);
            res.status(500).json(error('更新评论状态失败'));
        }
    }

    // 删除评论（管理员功能）
    async deleteComment(req, res) {
        try {
            const { id } = req.params;

            // 检查评论是否存在
            const comment = await query('SELECT post_id FROM comments WHERE id = ?', [id]);
            if (comment.length === 0) {
                return res.status(404).json(error('评论不存在'));
            }

            // 删除评论及其子评论
            await this.deleteCommentAndChildren(id);

            // 更新文章评论数量
            await query(
                'UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ? AND status = "approved") WHERE id = ?',
                [comment[0].post_id, comment[0].post_id]
            );

            res.json(success(null, '评论删除成功'));

        } catch (err) {
            console.error('删除评论错误:', err);
            res.status(500).json(error('删除评论失败'));
        }
    }

    // 获取待审核评论（管理员功能）
    async getPendingComments(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            // 获取待审核评论
            const comments = await query(`
                SELECT 
                    c.id, c.post_id, c.parent_id, c.author_name, c.author_email, 
                    c.author_url, c.content, c.status, c.created_at,
                    p.title as post_title, p.slug as post_slug
                FROM comments c
                LEFT JOIN posts p ON c.post_id = p.id
                WHERE c.status = 'pending'
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?
            `, [parseInt(limit), parseInt(offset)]);

            // 获取总数
            const totalResult = await query(
                'SELECT COUNT(*) as total FROM comments WHERE status = "pending"'
            );

            const total = totalResult[0].total;

            res.json(paginate(comments, parseInt(page), parseInt(limit), total));

        } catch (err) {
            console.error('获取待审核评论错误:', err);
            res.status(500).json(error('获取待审核评论失败'));
        }
    }

    // 获取评论统计（管理员功能）
    async getCommentStats(req, res) {
        try {
            const stats = await query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM comments
                GROUP BY status
            `);

            const result = {
                total: 0,
                approved: 0,
                pending: 0,
                spam: 0,
                rejected: 0
            };

            stats.forEach(stat => {
                result.total += stat.count;
                result[stat.status] = stat.count;
            });

            res.json(success(result, '获取评论统计成功'));

        } catch (err) {
            console.error('获取评论统计错误:', err);
            res.status(500).json(error('获取评论统计失败'));
        }
    }

    // 辅助方法：构建评论树形结构
    buildCommentTree(comments) {
        const commentMap = new Map();
        const rootComments = [];

        // 第一遍：创建所有评论的映射
        comments.forEach(comment => {
            comment.replies = [];
            commentMap.set(comment.id, comment);
        });

        // 第二遍：构建树形结构
        comments.forEach(comment => {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies.push(comment);
                } else {
                    // 父评论不在当前页面，作为根评论处理
                    rootComments.push(comment);
                }
            } else {
                rootComments.push(comment);
            }
        });

        return rootComments;
    }

    // 辅助方法：递归删除评论及其子评论
    async deleteCommentAndChildren(commentId) {
        // 获取子评论
        const children = await query('SELECT id FROM comments WHERE parent_id = ?', [commentId]);
        
        // 递归删除子评论
        for (const child of children) {
            await this.deleteCommentAndChildren(child.id);
        }

        // 删除当前评论
        await query('DELETE FROM comments WHERE id = ?', [commentId]);
    }
}

module.exports = new CommentController();