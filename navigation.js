// navigation.js - Điều hướng tập trung và kiểm soát truy cập
// Quản lý chuyển trang, bảo vệ trang yêu cầu đăng nhập, đánh dấu menu active

class NavigationManager {
    constructor() {
        this.pages = {
            main: 'main.html',                 // Trang chủ
            smartphones: 'product-category.html', // Điện thoại
            laptops: 'laptops.html',              // Laptop
            accessories: 'accessories.html',      // Phụ kiện
            smartDevices: 'smart-devices.html',   // Thiết bị thông minh
            cart: 'cart.html',                    // Giỏ hàng
            checkout: 'checkout.html',            // Thanh toán
            login: 'login.html',                  // Đăng nhập
            contact: 'contact.html'               // Liên hệ
        };
        
        this.protectedPages = ['cart.html', 'checkout.html']; // Trang yêu cầu đăng nhập
        this.init();
    }

    init() {
        this.setupNavigation();     // Gắn sự kiện cho các nút điều hướng
        this.setupActiveMenu();     // Đánh dấu menu đang active
        this.checkPageProtection(); // Kiểm tra quyền truy cập trang
    }

    setupNavigation() {
        // Xử lý click vào logo - về trang chủ
        const logos = document.querySelectorAll('.logo');
        logos.forEach(logo => {
            if (!logo.hasAttribute('data-listener')) {
                logo.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo(this.pages.main);
                });
                logo.setAttribute('data-listener', 'true');
            }
        });

        // Xử lý click vào thẻ sản phẩm - xem chi tiết
        document.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard && !productCard.hasAttribute('data-listener')) {
                productCard.addEventListener('click', (event) => {
                    // Không điều hướng nếu click vào nút thêm giỏ hàng
                    if (event.target.closest('.add-to-cart')) return;
                    
                    const productTitle = productCard.querySelector('.product-title')?.textContent;
                    if (productTitle) {
                        const productId = this.generateProductId(productTitle);
                        this.navigateTo(`product-detail.html?id=${encodeURIComponent(productId)}`);
                    }
                });
                productCard.setAttribute('data-listener', 'true');
            }
        });

        // Xử lý click vào icon giỏ hàng
        const cartIcons = document.querySelectorAll('.cart-icon a');
        cartIcons.forEach(icon => {
            if (!icon.hasAttribute('data-listener')) {
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo(this.pages.cart);
                });
                icon.setAttribute('data-listener', 'true');
            }
        });

        // Xử lý nút thanh toán (nếu có trên trang)
        const checkoutButtons = document.querySelectorAll('a[href*="checkout"], button[onclick*="checkout"]');
        checkoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(this.pages.checkout);
            });
        });

        // Xử lý click vào icon đăng nhập
        const loginIcons = document.querySelectorAll('.fa-user');
        loginIcons.forEach(icon => {
            const parentLink = icon.closest('a');
            if (parentLink && !parentLink.hasAttribute('data-listener')) {
                parentLink.addEventListener('click', (e) => {
                    if (parentLink.href.includes('login.html')) {
                        e.preventDefault();
                        this.navigateTo(this.pages.login);
                    }
                });
                parentLink.setAttribute('data-listener', 'true');
            }
        });

        // Xử lý click vào link liên hệ
        const contactLinks = document.querySelectorAll('a[href*="contact"]');
        contactLinks.forEach(link => {
            if (!link.hasAttribute('data-listener')) {
                link.addEventListener('click', (e) => {
                    if (link.href.includes('contact.html')) {
                        e.preventDefault();
                        this.navigateTo(this.pages.contact);
                    }
                });
                link.setAttribute('data-listener', 'true');
            }
        });
    }

    // Đánh dấu menu item đang active dựa trên trang hiện tại
    setupActiveMenu() {
        const currentPage = this.getCurrentPage();
        const navLinks = document.querySelectorAll('nav ul li a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // So sánh href của link với trang hiện tại
            const href = link.getAttribute('href');
            if (href) {
                if (href === currentPage || 
                    (currentPage.includes('product-category') && href.includes('product-category')) ||
                    (currentPage.includes('laptops') && href.includes('laptops')) ||
                    (currentPage.includes('accessories') && href.includes('accessories')) ||
                    (currentPage.includes('smart-devices') && href.includes('smart-devices'))) {
                    link.classList.add('active');
                }
            }
        });
    }

    // Lấy tên file trang hiện tại từ URL
    getCurrentPage() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'main.html';
    }

    // Tạo ID sản phẩm từ tên (dùng cho URL)
    generateProductId(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .substring(0, 30);
    }

    // Chuyển hướng đến trang chỉ định
    navigateTo(page) {
        // Lưu trang hiện tại để chuyển hướng lại sau khi đăng nhập
        if (this.protectedPages.some(protected => page.includes(protected))) {
            const currentPage = this.getCurrentPage();
            sessionStorage.setItem('redirectAfterLogin', currentPage);
        }
        
        window.location.href = page;
    }

    // Kiểm tra quyền truy cập trang (yêu cầu đăng nhập)
    checkPageProtection() {
        const currentPage = this.getCurrentPage();
        
        if (this.protectedPages.includes(currentPage)) {
            // Nếu chưa đăng nhập, chuyển đến trang login và lưu trang để redirect lại
            if (typeof auth !== 'undefined' && !auth.checkAuth()) {
                sessionStorage.setItem('redirectAfterLogin', currentPage);
                this.navigateTo(this.pages.login);
            }
        }
    }

    // Chuyển hướng về trang đã định sau khi đăng nhập thành công
    redirectAfterLogin() {
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || this.pages.main;
        sessionStorage.removeItem('redirectAfterLogin');
        this.navigateTo(redirectTo);
    }
}

// Tạo instance điều hướng toàn cục, dùng được ở mọi trang
window.navManager = new NavigationManager();