// MyBlog Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Like post functionality
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const postId = this.dataset.postId;
            likePost(postId, this);
        });
    });
    
    // Favorite post functionality
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const postId = this.dataset.postId;
            favoritePost(postId, this);
        });
    });
    
    // Search form enhancement
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        const searchInput = searchForm.querySelector('input[name="q"]');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.value.trim() === '') {
                    e.preventDefault();
                    this.focus();
                }
            });
        }
    }
});

// Like post function
function likePost(postId, button) {
    console.log('点赞操作:', postId, '用户认证状态:', isAuthenticated());
    
    if (!isAuthenticated()) {
        console.log('用户未登录，显示登录模态框');
        showLoginModal();
        return;
    }
    
    console.log('发送点赞请求到:', `/post/${postId}/like/`);
    fetch(`/post/${postId}/like/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        console.log('点赞响应状态:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('点赞响应数据:', data);
        if (data.success) {
            const countElement = button.querySelector('.like-count');
            const textElement = button.querySelector('.like-text');
            const icon = button.querySelector('i');
            
            if (data.liked) {
                button.classList.add('liked');
                icon.classList.remove('far');
                icon.classList.add('fas');
                if (textElement) textElement.textContent = '已点赞';
            } else {
                button.classList.remove('liked');
                icon.classList.remove('fas');
                icon.classList.add('far');
                if (textElement) textElement.textContent = '点赞';
            }
            
            if (countElement) {
                countElement.textContent = data.count;
            }
        } else {
            console.error('点赞操作失败:', data.message);
            if (data.message && data.message.includes('登录')) {
                showLoginModal();
            } else {
                showAlert('操作失败', 'error');
            }
        }
    })
    .catch(error => {
        console.error('点赞请求错误:', error);
        showAlert('网络错误', 'error');
    });
}

// Favorite post function
function favoritePost(postId, button) {
    console.log('收藏操作:', postId, '用户认证状态:', isAuthenticated());
    
    if (!isAuthenticated()) {
        console.log('用户未登录，显示登录模态框');
        showLoginModal();
        return;
    }
    
    console.log('发送收藏请求到:', `/post/${postId}/favorite/`);
    fetch(`/post/${postId}/favorite/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        console.log('收藏响应状态:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('收藏响应数据:', data);
        if (data.success) {
            const countElement = button.querySelector('.favorite-count');
            const textElement = button.querySelector('.favorite-text');
            const icon = button.querySelector('i');
            
            if (data.favorited) {
                button.classList.add('favorited');
                icon.classList.remove('far');
                icon.classList.add('fas');
                if (textElement) textElement.textContent = '已收藏';
            } else {
                button.classList.remove('favorited');
                icon.classList.remove('fas');
                icon.classList.add('far');
                if (textElement) textElement.textContent = '收藏';
            }
            
            if (countElement) {
                countElement.textContent = data.count;
            }
        } else {
            console.error('收藏操作失败:', data.message);
            if (data.message && data.message.includes('登录')) {
                showLoginModal();
            } else {
                showAlert('操作失败', 'error');
            }
        }
    })
    .catch(error => {
        console.error('收藏请求错误:', error);
        showAlert('网络错误', 'error');
    });
}

// Check if user is authenticated
function isAuthenticated() {
    return document.body.dataset.authenticated === 'true';
}

// Show login modal
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal') || createLoginModal());
    loginModal.show();
}

// Create login modal if it doesn't exist
function createLoginModal() {
    const modalHTML = `
        <div class="modal fade" id="loginModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">登录提醒</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>您需要登录才能进行此操作</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <a href="/login/" class="btn btn-primary">立即登录</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('loginModal');
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertHTML = `
        <div class="alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }
    }, 3000);
}

// Get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Lazy loading for images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
if ('IntersectionObserver' in window) {
    lazyLoadImages();
}

// Back to top button
function initBackToTopButton() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Initialize back to top button
initBackToTopButton();

// Mobile Sidebar functionality
function initMobileSidebar() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');
    
    if (mobileMenuBtn && mobileSidebar && sidebarOverlay && sidebarClose) {
        // Open sidebar
        mobileMenuBtn.addEventListener('click', function() {
            mobileSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Close sidebar
        function closeSidebar() {
            mobileSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        sidebarClose.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
        
        // Close on link click (optional)
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', closeSidebar);
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileSidebar.classList.contains('active')) {
                closeSidebar();
            }
        });
    }
}

// Initialize mobile sidebar
initMobileSidebar();

// Mobile filter functionality
function initMobileFilters() {
    console.log('Initializing mobile filters...');
    
    const primaryTabs = document.querySelectorAll('.primary-tab');
    const allCategories = document.getElementById('allCategories');
    const vipCategories = document.getElementById('vipCategories');
    
    console.log('Found primary tabs:', primaryTabs.length);
    
    primaryTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Tab clicked:', this.dataset.filter);
            
            // 更新第一行按钮状态
            primaryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 根据选择显示对应的分类
            const filter = this.dataset.filter;
            if (filter === 'vip') {
                console.log('Switching to VIP mode');
                // 显示VIP分类
                if (allCategories) allCategories.classList.add('d-none');
                if (vipCategories) vipCategories.classList.remove('d-none');
                
                // 构建VIP筛选URL
                const currentPath = window.location.pathname;
                let targetUrl;
                
                if (currentPath === '/' || currentPath === '/index/') {
                    targetUrl = '/?vip_only=1';
                } else {
                    const url = new URL(window.location.href);
                    url.searchParams.set('vip_only', '1');
                    targetUrl = url.toString();
                }
                
                console.log('Redirecting to:', targetUrl);
                window.location.href = targetUrl;
            } else {
                console.log('Switching to all mode');
                // 显示所有分类
                if (allCategories) allCategories.classList.remove('d-none');
                if (vipCategories) vipCategories.classList.add('d-none');
                
                // 构建普通筛选URL
                const currentPath = window.location.pathname;
                let targetUrl;
                
                if (currentPath === '/') {
                    targetUrl = '/';
                } else {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('vip_only');
                    targetUrl = url.pathname + (url.search ? url.search : '');
                }
                
                console.log('Redirecting to:', targetUrl);
                window.location.href = targetUrl;
            }
        });
    });
}

// Initialize mobile filters
document.addEventListener('DOMContentLoaded', function() {
    if (window.innerWidth <= 767) {
        initMobileFilters();
    }
});