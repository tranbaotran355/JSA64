// navigation.js - Centralized navigation and authentication handling

class NavigationManager {
    constructor() {
        this.pages = {
            main: 'main.html',
            smartphones: 'product-category.html',
            laptops: 'laptops.html',
            accessories: 'accessories.html',
            smartDevices: 'smart-devices.html',
            cart: 'cart.html',
            checkout: 'checkout.html',
            login: 'login.html',
            contact: 'contact.html'
        };
        
        this.protectedPages = ['cart.html', 'checkout.html'];
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupActiveMenu();
        this.checkPageProtection();
    }

    setupNavigation() {
        // Logo click handler
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

        // Setup product card clicks
        document.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard && !productCard.hasAttribute('data-listener')) {
                productCard.addEventListener('click', (event) => {
                    // Don't trigger if clicking on add-to-cart button
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

        // Cart icon handler
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

        // Checkout button handler (if exists on page)
        const checkoutButtons = document.querySelectorAll('a[href*="checkout"], button[onclick*="checkout"]');
        checkoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(this.pages.checkout);
            });
        });

        // Login icon handler
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

        // Contact link handler
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

    setupActiveMenu() {
        const currentPage = this.getCurrentPage();
        const navLinks = document.querySelectorAll('nav ul li a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // Check which page this link points to
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

    getCurrentPage() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'main.html';
    }

    generateProductId(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .substring(0, 30);
    }

    navigateTo(page) {
        // Store current page for redirect back after login
        if (this.protectedPages.some(protected => page.includes(protected))) {
            const currentPage = this.getCurrentPage();
            sessionStorage.setItem('redirectAfterLogin', currentPage);
        }
        
        window.location.href = page;
    }

    checkPageProtection() {
        const currentPage = this.getCurrentPage();
        
        if (this.protectedPages.includes(currentPage)) {
            // Check if user is logged in using auth.js
            if (typeof auth !== 'undefined' && !auth.checkAuth()) {
                sessionStorage.setItem('redirectAfterLogin', currentPage);
                this.navigateTo(this.pages.login);
            }
        }
    }

    // Helper for redirecting after successful login
    redirectAfterLogin() {
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || this.pages.main;
        sessionStorage.removeItem('redirectAfterLogin');
        this.navigateTo(redirectTo);
    }
}

// Create global navigation instance
window.navManager = new NavigationManager();