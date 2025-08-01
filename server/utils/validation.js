const Joi = require('joi');

const schemas = {
    // 用户相关验证
    register: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required()
            .messages({
                'string.alphanum': '用户名只能包含字母和数字',
                'string.min': '用户名至少3个字符',
                'string.max': '用户名最多30个字符',
                'any.required': '用户名不能为空'
            }),
        email: Joi.string().email().required()
            .messages({
                'string.email': '邮箱格式不正确',
                'any.required': '邮箱不能为空'
            }),
        password: Joi.string().min(6).max(128).required()
            .messages({
                'string.min': '密码至少6个字符',
                'string.max': '密码最多128个字符',
                'any.required': '密码不能为空'
            }),
        nickname: Joi.string().max(50).optional()
    }),

    login: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }),

    // 文章相关验证
    createPost: Joi.object({
        title: Joi.string().min(1).max(200).required()
            .messages({
                'string.min': '文章标题不能为空',
                'string.max': '文章标题最多200个字符',
                'any.required': '文章标题不能为空'
            }),
        content: Joi.string().min(1).required()
            .messages({
                'string.min': '文章内容不能为空',
                'any.required': '文章内容不能为空'
            }),
        excerpt: Joi.string().max(500).optional(),
        status: Joi.string().valid('draft', 'published', 'private').default('draft'),
        category_id: Joi.number().integer().positive().optional(),
        tags: Joi.array().items(Joi.number().integer().positive()).optional(),
        featured_image: Joi.string().uri().optional()
    }),

    updatePost: Joi.object({
        title: Joi.string().min(1).max(200).optional(),
        content: Joi.string().min(1).optional(),
        excerpt: Joi.string().max(500).optional(),
        status: Joi.string().valid('draft', 'published', 'private').optional(),
        category_id: Joi.number().integer().positive().allow(null).optional(),
        tags: Joi.array().items(Joi.number().integer().positive()).optional(),
        featured_image: Joi.string().uri().allow('').optional()
    }),

    // 分类相关验证
    createCategory: Joi.object({
        name: Joi.string().min(1).max(50).required(),
        description: Joi.string().max(500).optional(),
        parent_id: Joi.number().integer().positive().optional()
    }),

    // 标签相关验证
    createTag: Joi.object({
        name: Joi.string().min(1).max(50).required(),
        description: Joi.string().max(500).optional()
    }),

    // 评论相关验证
    createComment: Joi.object({
        post_id: Joi.number().integer().positive().required(),
        parent_id: Joi.number().integer().positive().optional(),
        author_name: Joi.string().min(1).max(50).required(),
        author_email: Joi.string().email().required(),
        author_url: Joi.string().uri().optional(),
        content: Joi.string().min(1).max(1000).required()
    }),

    // 分页验证
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    })
};

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: '数据验证失败',
                details
            });
        }

        req.body = value;
        next();
    };
};

const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, { abortEarly: false });
        
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: '查询参数验证失败',
                details
            });
        }

        req.query = value;
        next();
    };
};

module.exports = {
    schemas,
    validate,
    validateQuery
};