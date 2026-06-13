/**
 * TechSphere Mobile Navigation System
 * Handles hamburger menu toggle, responsive navigation, and device detection
 * 
 * Features:
 * - Hamburger menu animation and toggle
 * - Auto-close menu on navigation link click
 * - Auto-close menu on outside click
 * - Auto-close menu on resize to desktop (768px breakpoint)
 * - Prevent body scroll when menu open
 * - Device detection utilities
 * - Touch-friendly enhancements
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
   * Initialize mobile navigation system
   * Sets up all event listeners and checks initial screen size
   */
  init() {
    // Hamburger menu click
    if (this.hamburgerBtn) {
      this.hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });
    }

    // Navigation link clicks - close menu after navigation
    if (this.navLinks.length > 0) {
      this.navLinks.forEach(link => {
        link.addEventListener('click', () => {
          this.closeMenu();
        });
      });
    }

    // Outside click to close menu
    document.addEventListener('click', (e) => {
      if (this.isOpen && this.navMenu && !this.navMenu.contains(e.target) && 
          (!this.hamburgerBtn || !this.hamburgerBtn.contains(e.target))) {
        this.closeMenu();
      }
    });

    // Touch events for swipe-to-close
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, false);

    // Handle window resize - close menu on desktop
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Check initial screen size
    this.handleResize();
  }

  /**
   * Toggle menu open/closed state
   */
  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Open mobile menu
   * Adds active classes and prevents body scroll
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

    // Prevent body scroll
    this.body.style.overflow = 'hidden';
    this.body.style.position = 'fixed';

    // Add overlay backdrop
    this.addBackdrop();
  }

  /**
   * Close mobile menu
   * Removes active classes and restores body scroll
   */
  closeMenu() {
    this.isOpen = false;

    if (this.hamburgerBtn) {
      this.hamburgerBtn.classList.remove('active');
    }

    if (this.navMenu) {
      this.navMenu.style.display = 'none';
    }

    // Restore body scroll
    this.body.style.overflow = 'auto';
    this.body.style.position = 'static';

    // Remove backdrop
    this.removeBackdrop();
  }

  /**
   * Add semi-transparent backdrop when menu is open
   */
  addBackdrop() {
    if (document.querySelector('.menu-backdrop')) {
      return; // Already exists
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
   * Remove backdrop
   */
  removeBackdrop() {
    const backdrop = document.querySelector('.menu-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  /**
   * Handle window resize - close menu on desktop breakpoint
   */
  handleResize() {
    const currentWidth = window.innerWidth;

    // Close menu if resizing to desktop width
    if (currentWidth >= this.desktopBreakpoint && this.isOpen) {
      this.closeMenu();
    }

    // Show/hide hamburger menu based on breakpoint
    if (this.hamburgerBtn) {
      if (currentWidth < this.desktopBreakpoint) {
        this.hamburgerBtn.style.display = 'flex';
      } else {
        this.hamburgerBtn.style.display = 'none';
        // Make sure nav is visible on desktop
        if (this.navMenu) {
          this.navMenu.style.display = 'flex';
          this.navMenu.style.flexDirection = 'row';
        }
      }
    }
  }

  /**
   * Handle swipe gestures to close menu
   */
  handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    // Swiped left - close menu
    if (diff > swipeThreshold && this.isOpen) {
      this.closeMenu();
    }
  }
}

/**
 * Responsive Utilities
 * Helper functions for responsive design and device detection
 */
const ResponsiveUtils = {
  /**
   * Get current breakpoint
   * Returns the current active breakpoint based on window width
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;

    if (width < 375) return 'xs';      // Extra small
    if (width < 425) return 'sm';      // Small
    if (width < 768) return 'md';      // Medium
    if (width < 1024) return 'lg';     // Large
    if (width < 1440) return 'xl';     // Extra Large
    if (width < 1920) return '2xl';    // 2X Large
    return '3xl';                       // 3X Large (Ultra-wide)
  },

  /**
   * Check if device is mobile
   * Returns true if viewport width is less than 768px
   */
  isMobileDevice() {
    return window.innerWidth < 768;
  },

  /**
   * Check if device supports touch
   * Returns true if device has touch capability
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
   * Enable touch-friendly enhancements
   * Applies touch-specific optimizations to the page
   */
  enableTouchFriendly() {
    if (this.isTouchDevice()) {
      document.body.classList.add('touch-device');

      // Increase touch target sizes
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
   * Debounce function to throttle resize events
   * Prevents excessive function calls during window resize
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
   * Check if element is in viewport
   * Useful for lazy loading
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
   * Get viewport dimensions
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
   * Request animation frame wrapper
   * For smooth animations
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
 * Auto-initialize mobile navigation when DOM is ready
 */
function initMobileNavigation() {
  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new MobileNavigation();
      ResponsiveUtils.enableTouchFriendly();
    });
  } else {
    // DOM is already loaded
    new MobileNavigation();
    ResponsiveUtils.enableTouchFriendly();
  }
}

// Initialize mobile navigation
initMobileNavigation();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.MobileNavigation = MobileNavigation;
  window.ResponsiveUtils = ResponsiveUtils;
}
