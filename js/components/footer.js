// js/components/footer.js - Footer dùng chung cho mọi trang TechSphere
// Cách dùng: đặt <div id="site-footer"></div> trước các thẻ <script>, rồi nhúng file này.
(function () {
    function buildFooter() {
        return `
        <div class="container">
            <div class="footer-content">
                <div class="footer-column">
                    <h3>TechSphere</h3>
                    <p>Your trusted destination for the latest electronics and smart technology. We bring innovation to
                        your doorstep.</p>
                    <div class="social-icons">
                        <a href="#"><i class="fab fa-facebook-f"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>

                <div class="footer-column">
                    <h3>Shop</h3>
                    <ul class="footer-links">
                        <li><a href="product-category.html">Smartphones</a></li>
                        <li><a href="laptops.html">Laptops & Computers</a></li>
                        <li><a href="#">Tablets</a></li>
                        <li><a href="accessories.html">Audio & Headphones</a></li>
                        <li><a href="smart-devices.html">Smart Home Devices</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3>Support</h3>
                    <ul class="footer-links">
                        <li><a href="contact.html">Contact Us</a></li>
                        <li><a href="profile.html">My Account</a></li>
                        <li><a href="#">FAQs</a></li>
                        <li><a href="#">Shipping & Returns</a></li>
                        <li><a href="#">Warranty Information</a></li>
                        <li><a href="#">Terms & Conditions</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3>Newsletter</h3>
                    <p>Subscribe to get updates on new arrivals, special offers and tech news.</p>
                    <form class="newsletter-form">
                        <input type="email" placeholder="Your email address" required>
                        <button type="submit">Subscribe</button>
                    </form>
                </div>
            </div>

            <div class="copyright">
                <p>&copy; 2023 TechSphere. All rights reserved.</p>
            </div>
        </div>`;
    }

    function mount() {
        const host = document.getElementById('site-footer');
        const footer = document.createElement('footer');
        footer.innerHTML = buildFooter();

        if (host) {
            host.replaceWith(footer);
        } else {
            // Không có placeholder -> chèn cuối body (trước các thẻ script)
            const firstScript = document.querySelector('script');
            document.body.insertBefore(footer, firstScript);
        }
        bindNewsletter();
    }

    function bindNewsletter() {
        const form = document.querySelector('.newsletter-form');
        if (!form || form.dataset.bound) return;
        form.dataset.bound = '1';
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const button = this.querySelector('button');
            const originalText = button.textContent;
            button.textContent = 'Subscribed!';
            button.style.backgroundColor = '#4CAF50';
            if (window.notify && typeof notify.success === 'function') notify.success('Thanks for subscribing!');
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
                this.querySelector('input').value = '';
            }, 2000);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
