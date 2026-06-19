// products.js - Dữ liệu sản phẩm mẫu (dùng khi chưa có API)
// Lưu trữ danh sách sản phẩm theo danh mục trên window
window.products = {
    smartphones: [
        {
            id: 'phone_1',
            name: 'UltraPhone X Pro 256GB',
            price: 899.99,
            category: 'Smartphones',
            image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1228&q=80',
            rating: 4.5
        },
        {
            id: 'phone_2',
            name: 'Galaxy S24 Ultra 512GB',
            price: 1199.99,
            category: 'Smartphones',
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=880&q=80',
            rating: 4.0
        },
        {
            id: 'phone_3',
            name: 'Pixel 8 Pro 256GB',
            price: 999.99,
            category: 'Smartphones',
            image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=880&q=80',
            rating: 4.5
        },
        {
            id: 'phone_4',
            name: 'OnePlus 12 256GB',
            price: 849.99,
            category: 'Smartphones',
            image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=880&q=80',
            rating: 5.0
        }
    ],
    laptops: [
        {
            id: 'laptop_1',
            name: 'ProBook 15" Performance Laptop',
            price: 1299.99,
            category: 'Laptops',
            image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80',
            rating: 4.0
        }
    ],
    accessories: [
        {
            id: 'accessory_1',
            name: 'Noise-Cancelling Wireless Headphones',
            price: 199.99,
            category: 'Accessories',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
            rating: 5.0
        }
    ],
    smartDevices: [
        {
            id: 'smart_1',
            name: 'Smart Watch Series 5 - Fitness Tracker',
            price: 249.99,
            category: 'Smart Devices',
            image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
            rating: 4.5
        }
    ]
};