// notifications.js - Hệ thống thông báo toast (thành công/lỗi/thông tin)
// Hiển thị thông báo dạng popup ở góc phải màn hình

class NotificationManager {
    constructor() {
        this.container = this.createContainer(); // Tạo container chứa các thông báo
    }

    // Tạo container để chứa các toast notification
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    // Hiển thị thông báo (message: nội dung, type: loại, duration: thời gian hiển thị)
    show(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

        notification.style.cssText = `
            background-color: ${bgColor};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
            word-break: break-word;
        `;

        notification.innerHTML = `<span style="font-size: 18px;">${icon}</span><span>${message}</span>`;

        this.container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

        return notification;
    }

    // Hiển thị thông báo thành công
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    // Hiển thị thông báo lỗi
    error(message, duration = 3000) {
        return this.show(message, 'error', duration);
    }

    // Hiển thị thông báo thông tin
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Thêm CSS animation cho toast notification
if (!document.querySelector('style[data-notifications]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notifications', 'true');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        @media (max-width: 768px) {
            #notification-container {
                left: 10px !important;
                right: 10px !important;
                max-width: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Tạo instance thông báo toàn cục, dùng được ở mọi trang
window.notify = new NotificationManager();
