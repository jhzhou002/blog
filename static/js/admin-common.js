/* 管理后台通用JavaScript工具函数 */

// 通知系统
class NotificationManager {
    constructor() {
        this.createContainer();
    }

    createContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            showClose = true
        } = options;

        const notification = document.createElement('div');
        notification.className = `alert-admin ${type} animate-slide-in`;
        notification.style.cssText = `
            pointer-events: all;
            margin-bottom: 10px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <div>
                ${title ? `<strong>${title}</strong><br>` : ''}
                ${message}
            </div>
            ${showClose ? `<button type="button" class="alert-admin-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>` : ''}
        `;

        document.getElementById('notification-container').appendChild(notification);

        // 触发动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动消失
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            danger: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    hide(notification) {
        if (notification && notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 300);
        }
    }

    success(title, message, duration = 5000) {
        return this.show({ type: 'success', title, message, duration });
    }

    warning(title, message, duration = 5000) {
        return this.show({ type: 'warning', title, message, duration });
    }

    error(title, message, duration = 8000) {
        return this.show({ type: 'danger', title, message, duration });
    }

    info(title, message, duration = 5000) {
        return this.show({ type: 'info', title, message, duration });
    }
}

// 创建全局通知管理器实例
const notify = new NotificationManager();

// 确认对话框增强
function confirmAction(options) {
    const {
        title = '确认操作',
        message = '您确定要执行此操作吗？',
        confirmText = '确认',
        cancelText = '取消',
        type = 'warning',
        onConfirm = () => {},
        onCancel = () => {}
    } = options;

    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'admin-card';
    dialog.style.cssText = `
        max-width: 400px;
        width: 90%;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;

    const typeColors = {
        success: 'success',
        warning: 'warning',
        danger: 'danger',
        info: 'info'
    };

    dialog.innerHTML = `
        <div class="admin-card-header ${typeColors[type]}">
            <i class="fas ${notify.getIcon(type)}"></i>
            ${title}
        </div>
        <div class="admin-card-body">
            <p style="margin: 0; color: var(--gray-700);">${message}</p>
        </div>
        <div class="admin-card-footer">
            <div class="d-flex gap-sm justify-content-end">
                <button type="button" class="btn-admin outline" data-action="cancel">
                    ${cancelText}
                </button>
                <button type="button" class="btn-admin ${type}" data-action="confirm">
                    ${confirmText}
                </button>
            </div>
        </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    // 事件处理
    dialog.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'confirm') {
            hideModal();
            onConfirm();
        } else if (e.target.dataset.action === 'cancel') {
            hideModal();
            onCancel();
        }
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
            onCancel();
        }
    });

    // ESC键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            hideModal();
            onCancel();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);

    function hideModal() {
        modal.style.opacity = '0';
        dialog.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (modal.parentElement) {
                modal.parentElement.removeChild(modal);
            }
        }, 300);
    }

    // 显示动画
    setTimeout(() => {
        modal.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
    }, 100);

    return modal;
}

// 加载状态管理
function setLoadingState(element, isLoading = true) {
    if (!element) return;

    if (isLoading) {
        element.disabled = true;
        element.classList.add('loading');
        const originalText = element.innerHTML;
        element.dataset.originalText = originalText;
        element.innerHTML = `<div class="loading-spinner"></div> 处理中...`;
    } else {
        element.disabled = false;
        element.classList.remove('loading');
        if (element.dataset.originalText) {
            element.innerHTML = element.dataset.originalText;
            delete element.dataset.originalText;
        }
    }
}

// AJAX请求封装
async function ajaxRequest(url, options = {}) {
    const {
        method = 'GET',
        data = null,
        headers = {},
        timeout = 10000
    } = options;

    // 添加CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            signal: controller.signal
        };

        if (data) {
            fetchOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('请求超时');
        }
        throw error;
    }
}

// 表单验证
function validateForm(form) {
    const errors = [];
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        const value = field.value.trim();
        if (!value) {
            errors.push(`${field.dataset.label || field.name} 不能为空`);
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });

    // 邮箱验证
    const emailFields = form.querySelectorAll('[type="email"]');
    emailFields.forEach(field => {
        const value = field.value.trim();
        if (value && !isValidEmail(value)) {
            errors.push('邮箱格式不正确');
            field.classList.add('error');
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 本地存储管理
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('无法保存到本地存储:', e);
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('无法从本地存储读取:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('无法从本地存储删除:', e);
        }
    }
};

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 文件上传处理
function handleFileUpload(input, options = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
        onProgress = () => {},
        onSuccess = () => {},
        onError = () => {}
    } = options;

    const file = input.files[0];
    if (!file) return;

    // 验证文件类型
    if (!allowedTypes.includes(file.type)) {
        onError('不支持的文件类型');
        return;
    }

    // 验证文件大小
    if (file.size > maxSize) {
        onError(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
        }
    });

    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                onSuccess(response);
            } catch (e) {
                onError('响应格式错误');
            }
        } else {
            onError(`上传失败: ${xhr.status}`);
        }
    });

    xhr.addEventListener('error', () => {
        onError('网络错误');
    });

    xhr.open('POST', '/upload/');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    if (csrfToken) {
        xhr.setRequestHeader('X-CSRFToken', csrfToken);
    }
    xhr.send(formData);
}

// DOM就绪后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('管理后台通用组件已加载');
    
    // 自动关闭警告框
    setTimeout(() => {
        document.querySelectorAll('.alert-admin').forEach(alert => {
            if (!alert.querySelector('.alert-admin-close')) {
                notify.hide(alert);
            }
        });
    }, 5000);
    
    // 为所有确认删除按钮添加事件
    document.querySelectorAll('[data-confirm-delete]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const message = this.dataset.confirmDelete || '确定要删除这个项目吗？此操作不可恢复！';
            
            confirmAction({
                title: '确认删除',
                message,
                type: 'danger',
                confirmText: '删除',
                onConfirm: () => {
                    window.location.href = this.href;
                }
            });
        });
    });
});