const success = (data = null, message = '操作成功', meta = {}) => {
    const response = {
        success: true,
        message,
        data
    };

    if (Object.keys(meta).length > 0) {
        response.meta = meta;
    }

    return response;
};

const error = (message = '操作失败', code = 500, details = null) => {
    const response = {
        success: false,
        message,
        code
    };

    if (details) {
        response.details = details;
    }

    return response;
};

const paginate = (data, page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return success(data, '获取成功', {
        pagination: {
            current_page: page,
            per_page: limit,
            total_items: total,
            total_pages: totalPages,
            has_next: hasNext,
            has_prev: hasPrev
        }
    });
};

module.exports = {
    success,
    error,
    paginate
};