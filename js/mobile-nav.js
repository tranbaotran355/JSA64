/**
 * mobile-nav.js - Hệ thống menu di động cho TechSphere
 * Xử lý nút hamburger, điều hướng responsive, phát hiện thiết bị
 * 
 * Tính năng:
 * - Hiệu ứng và bật/tắt menu hamburger
 * - Tự động đóng menu khi click vào link
 * - Tự động đóng menu khi click ra ngoài
 * - Tự động đóng menu khi resize lên desktop (768px)
 * - Chặn scroll body khi menu mở
 * - Phát hiện thiết bị cảm ứng
 * - Hỗ trợ swipe để đóng menu
 */

class MobileNavigation {
  constructor() {
    this.hamburgerBtn = document.querySelector('.hamburger-menu');
    this.navMenu = document.querySelector('nav ul');
    this.navLinks = document.querySelectorAll('nav ul li a');
    this.body = document.body;
    this.isOpen = false;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.desktopBreakpoint = 768;

    // Initialize if elements exist
    if (this.hamburgerBtn || this.navMenu) {
      this.init();
    }
  }

    /**
     * Khởi tạo hệ thống menu di động
     * Gắn tất cả event listeners và kiểm tra kích thước màn hình
     */
    init() {
      // Click vào nút hamburger
      if (this.hamburgerBtn) {
      this.hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });
    }

      // Click vào link trong menu - đóng menu sau khi điều hướng
      if (this.navLinks.length > 0) {
      this.navLinks.forEach(link => {
        link.addEventListener('click', () => {
          this.closeMenu();
        });
      });
    }

      // Click ra ngoài menu - đóng menu
      document.addEventListener('click', (e) => {
      if (this.isOpen && this.navMenu && !this.navMenu.contains(e.target) && 
          (!this.hamburgerBtn || !this.hamburgerBtn.contains(e.target))) {
        this.closeMenu();
      }
    });

      // Xử lý swipe để đóng menu (kéo ngang)
      document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, false);

      // Đóng menu khi resize lên desktop
      window.addEventListener('resize', () => {
      this.handleResize();
    });

      // Kiểm tra kích thước màn hình ban đầu
      this.handleResize();
    }

    /**
     * Bật/tắt menu (mở/đóng)
     */
    toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

    /**
     * Mở menu di động
     * Thêm class active và chặn scroll body
     */
    openMenu() {
    this.isOpen = true;

    if (this.hamburgerBtn) {
      this.hamburgerBtn.classList.add('active');
    }

    if (this.navMenu) {
      this.navMenu.style.display = 'flex';
      this.navMenu.style.flexDirection = 'column';
    }

    // Chặn scroll body khi menu mở
    this.body.style.overflow = 'hidden';
    this.body.style.position = 'fixed';

    // Thêm lớp phủ mờ phía sau menu
    this.addBackdrop();
  }

  /**
   * Đóng menu di động
   * Xoá class active và khôi phục scroll body
   */
  closeMenu() {
    this.isOpen = false;

    if (this.hamburgerBtn) {
      this.hamburgerBtn.classList.remove('active');
    }

    if (this.navMenu) {
      this.navMenu.style.display = 'none';
    }

    // Khôi phục scroll body
    this.body.style.overflow = 'auto';
    this.body.style.position = 'static';

    // Xoá lớp phủ
    this.removeBackdrop();
  }

  /**
   * Thêm lớp phủ mờ khi menu mở
   */
  addBackdrop() {
    if (document.querySelector('.menu-backdrop')) {
      return; // Đã tồn tại
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 99;
    `;

    backdrop.addEventListener('click', () => {
      this.closeMenu();
    });

    document.body.insertBefore(backdrop, document.body.firstChild);
  }

  /**
   * Xoá lớp phủ
   */
  removeBackdrop() {
    const backdrop = document.querySelector('.menu-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  /**
   * Xử lý resize - đóng menu khi chuyển lên desktop
   */
  handleResize() {
    const currentWidth = window.innerWidth;

    // Đóng menu nếu resize lên kích thước desktop
    if (currentWidth >= this.desktopBreakpoint && this.isOpen) {
      this.closeMenu();
    }

    // Ẩn/hiện nút hamburger dựa trên kích thước màn hình
    if (this.hamburgerBtn) {
      if (currentWidth < this.desktopBreakpoint) {
        this.hamburgerBtn.style.display = 'flex';
      } else {
        this.hamburgerBtn.style.display = 'none';
        // Hiển thị menu ngang trên desktop
        if (this.navMenu) {
          this.navMenu.style.display = 'flex';
          this.navMenu.style.flexDirection = 'row';
        }
      }
    }
  }

  /**
   * Xử lý swipe để đóng menu
   */
  handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    // Swipe sang trái - đóng menu
    if (diff > swipeThreshold && this.isOpen) {
      this.closeMenu();
    }
  }
}

/**
 * ResponsiveUtils - Tiện ích responsive
 * Các hàm hỗ trợ thiết kế đáp ứng và phát hiện thiết bị
 */
const ResponsiveUtils = {
  /**
   * Get current breakpoint
   * Returns the current active breakpoint based on window width
   */
    getCurrentBreakpoint() {
      const width = window.innerWidth;

      if (width < 375) return 'xs';      // Cực nhỏ
      if (width < 425) return 'sm';      // Nhỏ
      if (width < 768) return 'md';      // Trung bình
      if (width < 1024) return 'lg';     // Lớn
      if (width < 1440) return 'xl';     // Rất lớn
      if (width < 1920) return '2xl';    // 2X Lớn
      return '3xl';                       // Siêu rộng
    },

    /**
     * Kiểm tra có phải thiết bị di động không (width < 768px)
     */
    isMobileDevice() {
      return window.innerWidth < 768;
    },

    /**
     * Kiểm tra thiết bị có hỗ trợ cảm ứng không
     */
    isTouchDevice() {
    return (
      (typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          (window.DocumentTouch &&
            typeof window.DocumentTouch !== 'undefined'))) ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  },

    /**
     * Kích hoạt tối ưu cho thiết bị cảm ứng
     * Tăng kích thước nút bấm cho dễ chạm
     */
    enableTouchFriendly() {
      if (this.isTouchDevice()) {
        document.body.classList.add('touch-device');

        // Tăng kích thước vùng chạm
        const style = document.createElement('style');
        style.textContent = `
          button, .btn, input[type="button"], input[type="submit"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          a {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
          }
        `;
        document.head.appendChild(style);
      }
    },

    /**
     * Debounce - hạn chế gọi hàm liên tục khi resize
     */
    debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

    /**
     * Kiểm tra element có nằm trong viewport không (dùng cho lazy loading)
     */
    isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

    /**
     * Lấy kích thước viewport (chiều rộng, chiều cao)
     */
    getViewportDimensions() {
    return {
      width: Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
      ),
      height: Math.max(
        document.documentElement.clientHeight,
        window.innerHeight || 0
      )
    };
  },

    /**
     * requestAnimationFrame wrapper (cho animation mượt)
     */
    requestAnimationFrame(callback) {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      }
    )(callback);
  }
};

/**
 * Tự động khởi tạo menu di động khi DOM sẵn sàng
 */
function initMobileNavigation() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new MobileNavigation();
      ResponsiveUtils.enableTouchFriendly();
    });
  } else {
    new MobileNavigation();
    ResponsiveUtils.enableTouchFriendly();
  }
}

// Khởi chạy menu di động
initMobileNavigation();

// Export ra window để dùng trong các script khác
if (typeof window !== 'undefined') {
  window.MobileNavigation = MobileNavigation;
  window.ResponsiveUtils = ResponsiveUtils;
}
