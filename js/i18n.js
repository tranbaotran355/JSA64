// js/i18n.js - Hệ thống đổi ngôn ngữ tiếng Anh <-> tiếng Việt (toàn site)
// Cách hoạt động:
//   - Từ điển phrase-based: khóa là chuỗi tiếng Anh gốc, giá trị là tiếng Việt.
//   - Khi ngôn ngữ là 'vi', quét toàn bộ text node (chuẩn hóa khoảng trắng) và
//     thuộc tính (placeholder/title/aria-label/alt/data-label), thay cụm phrase
//     dài trước (word-boundary). Nội dung tĩnh + JS-generated đều được dịch.
//   - JS code gọi I18n.t('...') (alias I18n.tr) cho chuỗi render động.
//   - Ngôn ngữ được xác định từ cài đặt tài khoản -> localStorage -> mặc định 'en'.
// Cần nhúng SAU auth.js và TRƯỚC các file JS khác.

(function (global) {
    'use strict';

    /* ═══════════════ TỪ ĐIỂN: English (US) -> Tiếng Việt ═══════════════ */
    var VI = {
        // ── Tiêu đề trang ──
        'TechSphere | Modern Electronics Store': 'TechSphere | C\u1eeda h\u00e0ng \u0110i\u1ec7n t\u1eed Hi\u1ec7n \u0111\u1ea1i',
        'Smartphones | TechSphere': '\u0110i\u1ec7n tho\u1ea1i th\u00f4ng minh | TechSphere',
        'Laptops | TechSphere': 'Laptop | TechSphere',
        'Deals & Offers | TechSphere': 'Khuy\u1ebfn m\u00e3i | TechSphere',
        'Shopping Cart | TechSphere': 'Gi\u1ecf h\u00e0ng | TechSphere',
        'Checkout | TechSphere': 'Thanh to\u00e1n | TechSphere',
        'Login / Register | TechSphere': '\u0110\u0103ng nh\u1eadp / \u0110\u0103ng k\u00fd | TechSphere',
        'Contact Us | TechSphere': 'Li\u00ean h\u1ec7 | TechSphere',
        'My Wishlist | TechSphere': 'Danh s\u00e1ch y\u00eau th\u00edch | TechSphere',
        'My Account | TechSphere': 'T\u00e0i kho\u1ea3n c\u1ee7a t\u00f4i | TechSphere',
        'Product Detail | TechSphere': 'Chi ti\u1ebft s\u1ea3n ph\u1ea9m | TechSphere',
        'Admin | TechSphere': 'Qu\u1ea3n tr\u1ecb | TechSphere',
        'Accessories | TechSphere': 'Ph\u1ee5 ki\u1ec7n | TechSphere',
        'Smart Devices | TechSphere': 'Thi\u1ebft b\u1ecb th\u00f4ng minh | TechSphere',
        'Home': 'Trang ch\u1ee7',

        // ── Header / navigation ──
        'Smartphones': '\u0110i\u1ec7n tho\u1ea1i th\u00f4ng minh',
        'Laptops': 'Laptop',
        'Accessories': 'Ph\u1ee5 ki\u1ec7n',
        'Smart Devices': 'Thi\u1ebft b\u1ecb th\u00f4ng minh',
        'Deals': 'Khuy\u1ebfn m\u00e3i',
        'Cart': 'Gi\u1ecf h\u00e0ng',
        'Wishlist': 'Y\u00eau th\u00edch',
        'Login': '\u0110\u0103ng nh\u1eadp',
        'Logout': '\u0110\u0103ng xu\u1ea5t',
        'Sign In': '\u0110\u0103ng nh\u1eadp',
        'Sign Up': '\u0110\u0103ng k\u00fd',
        'Admin': 'Qu\u1ea3n tr\u1ecb',
        'Search': 'T\u00ecm ki\u1ebfm',
        'Toggle navigation menu': 'Chuy\u1ec3n menu \u0111i\u1ec1u h\u01b0\u1edbng',

        // ── Footer ──
        'Shop': 'C\u1eeda h\u00e0ng',
        'Support': 'H\u1ed7 tr\u1ee3',
        'Newsletter': 'B\u1ea3n tin',
        'Shop by Category': 'Mua s\u1eafm theo danh m\u1ee5c',
        'Laptops & Computers': 'Laptop & M\u00e1y t\u00ednh',
        'Tablets': 'M\u00e1y t\u00ednh b\u1ea3ng',
        'Audio & Headphones': '\u00c2m thanh & Tai nghe',
        'Smart Home Devices': 'Thi\u1ebft b\u1ecb nh\u00e0 th\u00f4ng minh',
        'Contact Us': 'Li\u00ean h\u1ec7',
        'My Account': 'T\u00e0i kho\u1ea3n c\u1ee7a t\u00f4i',
        'FAQs': 'C\u00e2u h\u1ecfi th\u01b0\u1eddng g\u1eb7p',
        'Shipping & Returns': 'Giao h\u00e0ng & \u0110\u1ed5i tr\u1ea3',
        'Warranty Information': 'Th\u00f4ng tin b\u1ea3o h\u00e0nh',
        'Terms & Conditions': '\u0110i\u1ec1u kho\u1ea3n & \u0110i\u1ec1u ki\u1ec7n',
        'Subscribe': '\u0110\u0103ng k\u00fd',
        'Your email address': '\u0110\u1ecba ch\u1ec9 email c\u1ee7a b\u1ea1n',
        'Subscribed!': '\u0110\u00e3 \u0111\u0103ng k\u00fd!',
        'Thanks for subscribing!': 'C\u1ea3m \u01a1n b\u1ea1n \u0111\u00e3 \u0111\u0103ng k\u00fd!',
        'Subscribe to get updates on new arrivals, special offers and tech news.': '\u0110\u0103ng k\u00fd nh\u1eadn c\u1eadp nh\u1eadt v\u1ec1 s\u1ea3n ph\u1ea9m m\u1edbi, \u01b0u \u0111\u00e3i \u0111\u1eb7c bi\u1ec7t v\u00e0 tin c\u00f4ng ngh\u1ec7.',
        'Your trusted destination for the latest electronics and smart technology. We bring innovation to your doorstep.': '\u0110i\u1ec3m \u0111\u1ebfn tin c\u1eady c\u1ee7a b\u1ea1n cho c\u00e1c thi\u1ebft b\u1ecb \u0111i\u1ec7n t\u1eed v\u00e0 c\u00f4ng ngh\u1ec7 th\u00f4ng minh m\u1edbi nh\u1ea5t. Ch\u00fang t\u00f4i mang s\u1ef1 \u0111\u1ed5i m\u1edbi \u0111\u1ebfn t\u1eadn nh\u00e0 b\u1ea1n.',

        // ── Hero / banner / main ──
        'NEW ARRIVAL \u2013 Smart Technology for Everyday Life': 'H\u00c0NG M\u1edaI V\u1ec0 \u2013 C\u00f4ng ngh\u1ec7 Th\u00f4ng minh cho Cu\u1ed9c s\u1ed1ng H\u00e0ng ng\u00e0y',
        'SHOP NOW': 'MUA NGAY',
        'VIEW PRODUCTS': 'XEM S\u1ea2N PH\u1ea8M',
        'Featured Products': 'S\u1ea3n ph\u1ea9m n\u1ed5i b\u1eadt',
        'Why Choose TechSphere': 'V\u00ec sao ch\u1ecdn TechSphere',
        'Fast & free': 'Nhanh & mi\u1ec5n ph\u00ed',
        'Fast Delivery': 'Giao h\u00e0ng nhanh',
        'Official Warranty': 'B\u1ea3o h\u00e0nh ch\u00ednh h\u00e3ng',
        'Money Back Guarantee': '\u0110\u1ea3m b\u1ea3o ho\u00e0n ti\u1ec1n',
        '24/7 Support': 'H\u1ed7 tr\u1ee3 24/7',
        'We source only premium products from trusted brands and suppliers.': 'Ch\u00fang t\u00f4i ch\u1ec9 tuy\u1ec3n ch\u1ecdn s\u1ea3n ph\u1ea9m cao c\u1ea5p t\u1eeb c\u00e1c th\u01b0\u01a1ng hi\u1ec7u v\u00e0 nh\u00e0 cung c\u1ea5p \u0111\u00e1ng tin c\u1eady.',
        'All products come with official manufacturer warranty for your peace of mind.': 'T\u1ea5t c\u1ea3 s\u1ea3n ph\u1ea9m \u0111\u1ec1u c\u00f3 b\u1ea3o h\u00e0nh ch\u00ednh h\u00e3ng t\u1eeb nh\u00e0 s\u1ea3n xu\u1ea5t \u0111\u1ec3 b\u1ea1n y\u00ean t\u00e2m s\u1eed d\u1ee5ng.',
        'Free shipping on orders over $50': 'Mi\u1ec5n ph\u00ed v\u1eadn chuy\u1ec3n cho \u0111\u01a1n h\u00e0ng tr\u00ean $50',
        'Free shipping on orders over $50. Delivery within 1-3 business days.': 'Mi\u1ec5n ph\u00ed v\u1eadn chuy\u1ec3n cho \u0111\u01a1n h\u00e0ng tr\u00ean $50. Giao h\u00e0ng trong 1-3 ng\u00e0y l\u00e0m vi\u1ec7c.',
        'Discover the latest smartphones, laptops, and smart devices designed to enhance your daily routine with cutting-edge technology.': 'Kh\u00e1m ph\u00e1 nh\u1eefng chi\u1ebfc \u0111i\u1ec7n tho\u1ea1i th\u00f4ng minh, laptop v\u00e0 thi\u1ebft b\u1ecb th\u00f4ng minh m\u1edbi nh\u1ea5t, \u0111\u01b0\u1ee3c thi\u1ebft k\u1ebf \u0111\u1ec3 n\u00e2ng cao th\u00f3i quen h\u1eb1ng ng\u00e0y c\u1ee7a b\u1ea1n b\u1eb1ng c\u00f4ng ngh\u1ec7 ti\u00ean ti\u1ebfn.',
        'Discover the latest smartphones with cutting-edge technology, powerful cameras, and stunning displays.': 'Kh\u00e1m ph\u00e1 nh\u1eefng m\u1eabu \u0111i\u1ec7n tho\u1ea1i th\u00f4ng minh m\u1edbi nh\u1ea5t v\u1edbi c\u00f4ng ngh\u1ec7 ti\u00ean ti\u1ebfn, camera m\u1ea1nh m\u1ebd v\u00e0 m\u00e0n h\u00ecnh \u1ea5n t\u01b0\u1ee3ng.',
        'Discover powerful, portable, and premium laptops for work, gaming, and creativity. Find the perfect device to match your needs.': 'Kh\u00e1m ph\u00e1 nh\u1eefng chi\u1ebfc laptop m\u1ea1nh m\u1ebd, g\u1ecdn nh\u1eb9 v\u00e0 cao c\u1ea5p cho c\u00f4ng vi\u1ec7c, gi\u1ea3i tr\u00ed v\u00e0 s\u00e1ng t\u1ea1o. T\u00ecm chi\u1ebfc m\u00e1y ho\u00e0n h\u1ea3o ph\u00f9 h\u1ee3p v\u1edbi nhu c\u1ea7u c\u1ee7a b\u1ea1n.',
        'Enhance your devices with premium accessories. From protective cases to powerful chargers, find everything you need to complete your tech setup.': 'N\u00e2ng c\u1ea5p thi\u1ebft b\u1ecb c\u1ee7a b\u1ea1n v\u1edbi ph\u1ee5 ki\u1ec7n cao c\u1ea5p. T\u1eeb \u1ed1p b\u1ea3o v\u1ec7 \u0111\u1ebfn b\u1ed9 s\u1ea1c m\u1ea1nh m\u1ebd, t\u00ecm m\u1ecdi th\u1ee9 b\u1ea1n c\u1ea7n \u0111\u1ec3 ho\u00e0n thi\u1ec7n b\u1ed9 c\u00f4ng ngh\u1ec7 c\u1ee7a m\u00ecnh.',
        'Transform your home and lifestyle with cutting-edge smart technology. From voice-controlled assistants to automated security systems, discover devices that connect, automate, and enhance every aspect of your daily routine.': 'Thay \u0111\u1ed5i ng\u00f4i nh\u00e0 v\u00e0 l\u1ed1i s\u1ed1ng c\u1ee7a b\u1ea1n v\u1edbi c\u00f4ng ngh\u1ec7 th\u00f4ng minh ti\u00ean ti\u1ebfn. T\u1eeb tr\u1ee3 l\u00fd \u0111i\u1ec1u khi\u1ec3n b\u1eb1ng gi\u1ecdng n\u00f3i \u0111\u1ebfn h\u1ec7 th\u1ed1ng an ninh t\u1ef1 \u0111\u1ed9ng, kh\u00e1m ph\u00e1 c\u00e1c thi\u1ebft b\u1ecb k\u1ebft n\u1ed1i, t\u1ef1 \u0111\u1ed9ng h\u00f3a v\u00e0 n\u00e2ng cao m\u1ecdi kh\u00eda c\u1ea1nh trong cu\u1ed9c s\u1ed1ng h\u1eb1ng ng\u00e0y.',
        'Grab the best tech deals before they\'re gone. Limited time offer.': 'Ch\u1edbp l\u1ea5y nh\u1eefng \u01b0u \u0111\u00e3i c\u00f4ng ngh\u1ec7 t\u1ed1t nh\u1ea5t tr\u01b0\u1edbc khi h\u1ebft h\u1ea1n. \u01afu \u0111\u00e3i c\u00f3 gi\u1edbi h\u1ea1n.',
        'FLASH SALE': 'SALE CH\u1eda TH\u1ecc NHO\u00c1NG \u2013 S\u1ed1c',
        'Up to 50% Off': 'Gi\u1ea3m t\u1edbi 50%',
        'Biggest Discount': 'Gi\u1ea3m gi\u00e1 l\u1edbn nh\u1ea5t',
        'Shop Deals': 'Xem \u01b0u \u0111\u00e3i',
        'All-Day Battery': 'Pin c\u1ea3 ng\u00e0y',
        'Automate your life': 'T\u1ef1 \u0111\u1ed9ng h\u00f3a cu\u1ed9c s\u1ed1ng',
        'Track & stay connected': 'Theo d\u00f5i & lu\u00f4n k\u1ebft n\u1ed1i',
        'Work & entertainment': 'L\u00e0m vi\u1ec7c & gi\u1ea3i tr\u00ed',

        // ── Bộ lọc / deals ──
        'All Categories': 'T\u1ea5t c\u1ea3 danh m\u1ee5c',
        'All Deals': 'T\u1ea5t c\u1ea3 \u01b0u \u0111\u00e3i',
        'All Brands': 'T\u1ea5t c\u1ea3 th\u01b0\u01a1ng hi\u1ec7u',
        'All Prices': 'T\u1ea5t c\u1ea3 m\u1ee9c gi\u00e1',
        'All Processors': 'T\u1ea5t c\u1ea3 b\u1ed9 vi x\u1eed l\u00fd',
        'All Memory': 'T\u1ea5t c\u1ea3 b\u1ed9 nh\u1edb',
        'All Storage': 'T\u1ea5t c\u1ea3 dung l\u01b0\u1ee3ng',
        'All Types': 'T\u1ea5t c\u1ea3 lo\u1ea1i',
        'All Connectivity': 'T\u1ea5t c\u1ea3 k\u1ebft n\u1ed1i',
        'All Devices': 'T\u1ea5t c\u1ea3 thi\u1ebft b\u1ecb',
        'Sort By': 'S\u1eafp x\u1ebfp theo',
        'Name: A-Z': 'T\u00ean: A-Z',
        'Price: Low to High': 'Gi\u00e1: Th\u1ea5p \u0111\u1ebfn Cao',
        'Price: High to Low': 'Gi\u00e1: Cao \u0111\u1ebfn Th\u1ea5p',
        'Newest': 'M\u1edbi nh\u1ea5t',
        'Featured': 'N\u1ed5i b\u1eadt',
        'Best Rated': '\u0110\u00e1nh gi\u00e1 cao nh\u1ea5t',
        'Price Range': 'Kho\u1ea3ng gi\u00e1',
        'Under $50': 'D\u01b0\u1edbi $50',
        'Under $100': 'D\u01b0\u1edbi $100',
        'Under $500': 'D\u01b0\u1edbi $500',
        'Over $500': 'Tr\u00ean $500',
        'Over $200': 'Tr\u00ean $200',
        'Over $1500': 'Tr\u00ean $1500',
        'Over $2000': 'Tr\u00ean $2000',
        'Price ($)': 'Gi\u00e1 ($)',
        'Brand': 'Th\u01b0\u01a1ng hi\u1ec7u',
        'Storage': 'Dung l\u01b0\u1ee3ng',
        'RAM': 'RAM',
        'CPU': 'CPU',
        'Connectivity': 'K\u1ebft n\u1ed1i',
        'Compatibility': 'T\u01b0\u01a1ng th\u00edch',
        'Device Type': 'Lo\u1ea1i thi\u1ebft b\u1ecb',
        'Type': 'Lo\u1ea1i',
        'Color': 'M\u00e0u s\u1eafc',
        'Cancel': 'H\u1ee7y',
        'Reset': '\u0110\u1eb7t l\u1ea1i',
        'None': 'Kh\u00f4ng',
        'Search products across all categories...': 'T\u00ecm ki\u1ebfm s\u1ea3n ph\u1ea9m tr\u00ean t\u1ea5t c\u1ea3 danh m\u1ee5c...',
        'Search across all deals...': 'T\u00ecm ki\u1ebfm tr\u00ean t\u1ea5t c\u1ea3 \u01b0u \u0111\u00e3i...',

        // ── Sản phẩm / thẻ sản phẩm ──
        'Products': 'S\u1ea3n ph\u1ea9m',
        'Add to Cart': 'Th\u00eam v\u00e0o gi\u1ecf',
        'Added!': '\u0110\u00e3 th\u00eam!',
        'Add': 'Th\u00eam',
        'Add All To Cart': 'Th\u00eam t\u1ea5t c\u1ea3 v\u00e0o gi\u1ecf',
        'Buy Now': 'Mua ngay',
        'No Image': 'Kh\u00f4ng c\u00f3 \u1ea3nh',
        'No image': 'Kh\u00f4ng c\u00f3 \u1ea3nh',
        'No products found.': 'Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m.',
        'No products match this category.': 'Kh\u00f4ng c\u00f3 s\u1ea3n ph\u1ea9m ph\u00f9 h\u1ee3p v\u1edbi danh m\u1ee5c n\u00e0y.',
        'No products match your criteria.': 'Kh\u00f4ng c\u00f3 s\u1ea3n ph\u1ea9m ph\u00f9 h\u1ee3p v\u1edbi ti\u00eau ch\u00ed c\u1ee7a b\u1ea1n.',
        'Failed to load products.': 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c s\u1ea3n ph\u1ea9m.',
        'Unable to load products. Please try again later.': 'Kh\u00f4ng th\u1ec3 t\u1ea3i s\u1ea3n ph\u1ea9m. Vui l\u00f2ng th\u1eed l\u1ea1i sau.',
        'Unable to load products.': 'Kh\u00f4ng th\u1ec3 t\u1ea3i s\u1ea3n ph\u1ea9m.',
        'Retry': 'Th\u1eed l\u1ea1i',
        'Save $': 'Ti\u1ebft ki\u1ec7m $',
        'Add to wishlist': 'Th\u00eam v\u00e0o danh s\u00e1ch y\u00eau th\u00edch',
        'Remove from wishlist': 'X\u00f3a kh\u1ecfi danh s\u00e1ch y\u00eau th\u00edch',
        'saved to your wishlist!': '\u0111\u00e3 \u0111\u01b0\u1ee3c th\u00eam v\u00e0o danh s\u00e1ch y\u00eau th\u00edch!',
        'removed from your wishlist!': '\u0111\u00e3 b\u1ecb x\u00f3a kh\u1ecfi danh s\u00e1ch y\u00eau th\u00edch!',
        'removed from your wishlist.': '\u0111\u00e3 b\u1ecb x\u00f3a kh\u1ecfi danh s\u00e1ch y\u00eau th\u00edch.',
        'added to cart!': '\u0111\u00e3 th\u00eam v\u00e0o gi\u1ecf h\u00e0ng!',
        'removed from cart!': '\u0111\u00e3 x\u00f3a kh\u1ecfi gi\u1ecf h\u00e0ng!',
        'Failed to add item.': 'Kh\u00f4ng th\u1ec3 th\u00eam s\u1ea3n ph\u1ea9m.',
        'Failed to add item to cart.': 'Kh\u00f4ng th\u1ec3 th\u00eam s\u1ea3n ph\u1ea9m v\u00e0o gi\u1ecf h\u00e0ng.',
        'Unknown Product': 'S\u1ea3n ph\u1ea9m kh\u00f4ng x\u00e1c \u0111\u1ecbnh',
        'Unknown product': 'S\u1ea3n ph\u1ea9m kh\u00f4ng x\u00e1c \u0111\u1ecbnh',
        'Item': 'S\u1ea3n ph\u1ea9m',
        'item': 's\u1ea3n ph\u1ea9m',
        'items': 's\u1ea3n ph\u1ea9m',
        'item(s)': 's\u1ea3n ph\u1ea9m',
        'order(s)': '\u0111\u01a1n h\u00e0ng',
        'Loading...': '\u0110ang t\u1ea3i...',
        'Loading product...': '\u0110ang t\u1ea3i s\u1ea3n ph\u1ea9m...',
        'Loading reviews...': '\u0110ang t\u1ea3i \u0111\u00e1nh gi\u00e1...',
        'Loading your saved items...': '\u0110ang t\u1ea3i c\u00e1c s\u1ea3n ph\u1ea9m \u0111\u00e3 l\u01b0u...',
        'Key Features': '\u0110\u1eb7c \u0111i\u1ec3m n\u1ed5i b\u1eadt',
        'Description': 'M\u00f4 t\u1ea3',
        'Return to Store': 'Quay l\u1ea1i c\u1eeda h\u00e0ng',
        'Customer Rating': '\u0110\u00e1nh gi\u00e1 kh\u00e1ch h\u00e0ng',
        'Rate this product': '\u0110\u00e1nh gi\u00e1 s\u1ea3n ph\u1ea9m n\u00e0y',
        'Reviews': '\u0110\u00e1nh gi\u00e1',
        'Click a star to rate - you can update your rating anytime.': 'Nh\u1ea5p v\u00e0o ng\u00f4i sao \u0111\u1ec3 \u0111\u00e1nh gi\u00e1 - b\u1ea1n c\u00f3 th\u1ec3 c\u1eadp nh\u1eadt b\u1ea5t c\u1ee9 l\u00fac n\u00e0o.',
        'No reviews yet \u2014 be the first to rate this product!': 'Ch\u01b0a c\u00f3 \u0111\u00e1nh gi\u00e1 n\u00e0o \u2014 h\u00e3y l\u00e0 ng\u01b0\u1eddi \u0111\u1ea7u ti\u00ean \u0111\u00e1nh gi\u00e1 s\u1ea3n ph\u1ea9m n\u00e0y!',
        'Could not load reviews.': 'Kh\u00f4ng th\u1ec3 t\u1ea3i \u0111\u00e1nh gi\u00e1.',
        'Please login to rate this product!': 'Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 \u0111\u00e1nh gi\u00e1 s\u1ea3n ph\u1ea9m n\u00e0y!',
        'Failed to save rating. Please try again.': 'Kh\u00f4ng l\u01b0u \u0111\u01b0\u1ee3c \u0111\u00e1nh gi\u00e1. Vui l\u00f2ng th\u1eed l\u1ea1i.',
        '(you)': '(b\u1ea1n)',
        'You rated this product': 'B\u1ea1n \u0111\u00e3 \u0111\u00e1nh gi\u00e1 s\u1ea3n ph\u1ea9m n\u00e0y',
        'star(s)': 'sao',
        'Welcome back, ': 'Ch\u00e0o m\u1eebng tr\u1edf l\u1ea1i, ',
        'Wishlisted': '\u0110\u00e3 l\u01b0u',
        'Could not add items to cart.': 'Kh\u00f4ng th\u1ec3 th\u00eam s\u1ea3n ph\u1ea9m v\u00e0o gi\u1ecf h\u00e0ng.',
        'Unable to add item to cart. Please refresh the page and try again.': 'Kh\u00f4ng th\u1ec3 th\u00eam s\u1ea3n ph\u1ea9m v\u00e0o gi\u1ecf h\u00e0ng. Vui l\u00f2ng l\u00e0m t\u01b0\u01a1i trang v\u00e0 th\u1eed l\u1ea1i.',
        'Reviews)': '\u0110\u00e1nh gi\u00e1)',
        'star': 'sao',
        'stars': 'sao',
        'click to update.': 'nh\u1ea5p \u0111\u1ec3 c\u1eadp nh\u1eadt.',
        'Thanks! Your': 'C\u1ea3m \u01a1n! \u0110\u00e1nh gi\u00e1',
        'rating was saved.': 'c\u1ee7a b\u1ea1n \u0111\u00e3 \u0111\u01b0\u1ee3c l\u01b0u.',

        // ── Cart ──
        'Your cart is empty': 'Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n tr\u1ed1ng',
        'Your Cart is Empty': 'Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n tr\u1ed1ng',
        'Looks like you haven\'t added any products to your cart yet. Start shopping to fill it up!': 'C\u00f3 v\u1ebb b\u1ea1n ch\u01b0a th\u00eam s\u1ea3n ph\u1ea9m n\u00e0o v\u00e0o gi\u1ecf. B\u1eaft \u0111\u1ea7u mua s\u1eafm \u0111\u1ec3 l\u1ea5p \u0111\u1ea7y gi\u1ecf nh\u00e9!',
        'Start Shopping': 'B\u1eaft \u0111\u1ea7u mua s\u1eafm',
        'You have': 'B\u1ea1n c\u00f3',
        'in your cart': 'trong gi\u1ecf h\u00e0ng',
        'Remove': 'X\u00f3a',
        'Your cart is empty. Add items before checkout.': 'Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n \u0111ang tr\u1ed1ng. H\u00e3y th\u00eam s\u1ea3n ph\u1ea9m tr\u01b0\u1edbc khi thanh to\u00e1n.',
        'Your cart is empty!': 'Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n tr\u1ed1ng!',
        'Your cart is empty.': 'Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n tr\u1ed1ng.',
        'Free shipping on your order!': 'Mi\u1ec5n ph\u00ed v\u1eadn chuy\u1ec3n cho \u0111\u01a1n h\u00e0ng c\u1ee7a b\u1ea1n!',
        'Add items to qualify for free shipping': 'Th\u00eam s\u1ea3n ph\u1ea9m \u0111\u1ec3 \u0111\u01b0\u1ee3c mi\u1ec5n ph\u00ed v\u1eadn chuy\u1ec3n',
        'FREE': 'MI\u1ec4N PH\u00cd',
        'Free': 'Mi\u1ec5n ph\u00ed',

        // ── Checkout ──
        'Checkout': 'Thanh to\u00e1n',
        'Complete your purchase with secure payment': 'Ho\u00e0n t\u1ea5t mua h\u00e0ng v\u1edbi thanh to\u00e1n b\u1ea3o m\u1eadt',
        'Contact Information': 'Th\u00f4ng tin li\u00ean h\u1ec7',
        'Email Address': '\u0110\u1ecba ch\u1ec9 email',
        'Email Address *': '\u0110\u1ecba ch\u1ec9 email *',
        'Phone': 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i',
        'Phone Number *': 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i *',
        'Shipping Address': '\u0110\u1ecba ch\u1ec9 giao h\u00e0ng',
        'First Name *': 'T\u00ean *',
        'Last Name *': 'H\u1ecd *',
        'Address *': '\u0110\u1ecba ch\u1ec9 *',
        'City *': 'Th\u00e0nh ph\u1ed1 *',
        'State *': 'Bang *',
        'ZIP Code *': 'M\u00e3 ZIP *',
        'Country *': 'Qu\u1ed1c gia *',
        'Company (Optional)': 'C\u00f4ng ty (T\u00f9y ch\u1ecdn)',
        'Apartment, Suite, etc. (Optional)': 'C\u0103n h\u1ed9, t\u1ea7ng l\u1ea7u, v.v. (T\u00f9y ch\u1ecdn)',
        'Select State': 'Ch\u1ecdn bang',
        'Shipping Method': 'Ph\u01b0\u01a1ng th\u1ee9c v\u1eadn chuy\u1ec3n',
        'Express Shipping': 'V\u1eadn chuy\u1ec3n nhanh',
        'Standard Shipping': 'V\u1eadn chuy\u1ec3n ti\u00eau chu\u1ea9n',
        'Delivery in 1-2 business days \u2022 $9.99': 'Giao trong 1-2 ng\u00e0y l\u00e0m vi\u1ec7c \u2022 $9.99',
        'Delivery in 3-5 business days \u2022 Free': 'Giao trong 3-5 ng\u00e0y l\u00e0m vi\u1ec7c \u2022 Mi\u1ec5n ph\u00ed',
        'Shipping': 'V\u1eadn chuy\u1ec3n',
        'Payment': 'Thanh to\u00e1n',
        'Secure Payment': 'Thanh to\u00e1n b\u1ea3o m\u1eadt',
        'SSL encrypted checkout': 'Thanh to\u00e1n m\u00e3 h\u00f3a SSL',
        '100% protected': 'B\u1ea3o v\u1ec7 100%',
        'Continue to Payment': 'Ti\u1ebfp t\u1ee5c thanh to\u00e1n',
        'Continue shopping': 'Ti\u1ebfp t\u1ee5c mua s\u1eafm',
        'Continue Shopping': 'Ti\u1ebfp t\u1ee5c mua s\u1eafm',
        'Back to Cart': 'Quay l\u1ea1i gi\u1ecf h\u00e0ng',
        'Processing...': '\u0110ang x\u1eed l\u00fd...',
        'Ready': 'S\u1eb5n s\u00e0ng',
        '\u23f3 Thinking...': '\u23f3 \u0110ang suy ngh\u0129...',
        'Error: ': 'L\u1ed7i: ',
        'No response.': 'Kh\u00f4ng c\u00f3 ph\u1ea3n h\u1ed3i.',
        'Processing': '\u0110ang x\u1eed l\u00fd',
        'Shipped': '\u0110\u00e3 g\u1eedi h\u00e0ng',
        'Delivered': '\u0110\u00e3 giao h\u00e0ng',
        'Submit': '\u0110\u00e3 g\u1eedi',
        'Switch language': '\u0110\u1ed5i ng\u00f4n ng\u1eef',
        'Please login to proceed to checkout': 'Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 ti\u1ebfn h\u00e0nh thanh to\u00e1n',
        'Please fill in all required fields!': 'Vui l\u00f2ng \u0111i\u1ec1n \u0111\u1ea7y \u0111\u1ee7 c\u00e1c tr\u01b0\u1eddng b\u1eaft bu\u1ed9c!',
        'Please enter a valid email address!': 'Vui l\u00f2ng nh\u1eadp \u0111\u1ecba ch\u1ec9 email h\u1ee3p l\u1ec7!',
        'Please enter a valid phone number!': 'Vui l\u00f2ng nh\u1eadp s\u1ed1 \u0111i\u1ec7n tho\u1ea1i h\u1ee3p l\u1ec7!',
        'Please enter a valid ZIP code!': 'Vui l\u00f2ng nh\u1eadp m\u00e3 ZIP h\u1ee3p l\u1ec7!',
        'Text': 'Ch\u1eef',
        'Quantity: ': 'S\u1ed1 l\u01b0\u1ee3ng: ',
        'Order placed successfully! \ud83c\udf89': '\u0110\u1eb7t h\u00e0ng th\u00e0nh c\u00f4ng! \ud83c\udf89',
        'Failed to place order: ': 'Kh\u00f4ng \u0111\u1eb7t \u0111\u01b0\u1ee3c h\u00e0ng: ',
        'Please try again.': 'Vui l\u00f2ng th\u1eed l\u1ea1i.',
        'Logged in as ': '\u0110\u00e3 \u0111\u0103ng nh\u1eadp v\u1edbi t\u00e0i kho\u1ea3n ',

        // ── Summary / orders ──
        'Order Summary': 'T\u00f3m t\u1eaft \u0111\u01a1n h\u00e0ng',
        'Subtotal': 'T\u1ea1m t\u00ednh',
        'Tax': 'Thu\u1ebf',
        'Total': 'T\u1ed5ng c\u1ed9ng',
        'Total: $': 'T\u1ed5ng: $',
        'Order': 'M\u00e3 \u0111\u01a1n',
        'Orders': '\u0110\u01a1n h\u00e0ng',
        'History': 'L\u1ecbch s\u1eed',
        'Order History': 'L\u1ecbch s\u1eed \u0111\u01a1n h\u00e0ng',
        'Order Status': 'Tr\u1ea1ng th\u00e1i \u0111\u01a1n h\u00e0ng',
        'Order ID': 'M\u00e3 \u0111\u01a1n h\u00e0ng',
        'Date': 'Ng\u00e0y',
        'Status': 'Tr\u1ea1ng th\u00e1i',
        'Awaiting confirmation': 'Ch\u1edd x\u00e1c nh\u1eadn',
        'Confirm Received': 'X\u00e1c nh\u1eadn \u0111\u00e3 nh\u1eadn h\u00e0ng',
        'Have you received order': 'B\u1ea1n \u0111\u00e3 nh\u1eadn \u0111\u01b0\u1ee3c \u0111\u01a1n h\u00e0ng',
        'Thank you! Your order has been confirmed.': 'C\u1ea3m \u01a1n b\u1ea1n! \u0110\u01a1n h\u00e0ng c\u1ee7a b\u1ea1n \u0111\u00e3 \u0111\u01b0\u1ee3c x\u00e1c nh\u1eadn.',
        'Order not found.': 'Kh\u00f4ng t\u00ecm th\u1ea5y \u0111\u01a1n h\u00e0ng.',
        'Failed to confirm order: ': 'X\u00e1c nh\u1eadn \u0111\u01a1n h\u00e0ng th\u1ea5t b\u1ea1i: ',
        'No orders yet': 'Ch\u01b0a c\u00f3 \u0111\u01a1n h\u00e0ng',
        'No orders yet.': 'Ch\u01b0a c\u00f3 \u0111\u01a1n h\u00e0ng.',
        'No completed orders yet.': 'Ch\u01b0a c\u00f3 \u0111\u01a1n h\u00e0ng ho\u00e0n th\u00e0nh.',
        'Completed ': 'Ho\u00e0n th\u00e0nh ',
        'Your orders will appear here once you complete a purchase.': '\u0110\u01a1n h\u00e0ng c\u1ee7a b\u1ea1n s\u1ebd hi\u1ec3n th\u1ecb \u1edf \u0111\u00e2y sau khi b\u1ea1n ho\u00e0n t\u1ea5t mua h\u00e0ng.',
        'Qty: ': 'SL: ',
        'No items': 'Kh\u00f4ng c\u00f3 s\u1ea3n ph\u1ea9m',
        'Buy Again': 'Mua l\u1ea1i',
        'No purchase history yet': 'Ch\u01b0a c\u00f3 l\u1ecbch s\u1eed mua h\u00e0ng',
        'Loading purchase history...': '\u0110ang t\u1ea3i l\u1ecbch s\u1eed mua h\u00e0ng...',
        'Added': '\u0110\u00e3 th\u00eam',
        'Added to Cart!': '\u0110\u00e3 th\u00eam v\u00e0o gi\u1ecf!',
        'to your cart!': 'v\u00e0o gi\u1ecf h\u00e0ng!',
        'to your cart. Redirecting to checkout...': 'v\u00e0o gi\u1ecf h\u00e0ng. \u0110ang chuy\u1ec3n \u0111\u1ebfn thanh to\u00e1n...',

        // ── Profile / wishlist ──
        'Account Settings': 'C\u00e0i \u0111\u1eb7t t\u00e0i kho\u1ea3n',
        'Language': 'Ng\u00f4n ng\u1eef',
        'Notifications': 'Th\u00f4ng b\u00e1o',
        'Dark mode': 'Ch\u1ebf \u0111\u1ed9 t\u1ed1i',
        'Payment methods': 'Ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n',
        'Security': 'B\u1ea3o m\u1eadt',
        'Password': 'M\u1eadt kh\u1ea9u',
        'Not set yet': 'Ch\u01b0a thi\u1ebft l\u1eadp',
        'Not set': 'Ch\u01b0a thi\u1ebft l\u1eadp',
        'Change': '\u0110\u1ed5i',
        'Edit Profile': 'Ch\u1ec9nh s\u1eeda h\u1ed3 s\u01a1',
        'Not provided': 'Ch\u01b0a cung c\u1ea5p',
        'Joined': 'Tham gia',
        'Your wishlist is empty': 'Danh s\u00e1ch y\u00eau th\u00edch c\u1ee7a b\u1ea1n tr\u1ed1ng',
        'Tap the heart on any product to save it here.': 'Nh\u1ea5n v\u00e0o bi\u1ec3u t\u01b0\u1ee3ng tr\u00e1i tim tr\u00ean s\u1ea3n ph\u1ea9m b\u1ea5t k\u1ef3 \u0111\u1ec3 l\u01b0u v\u00e0o \u0111\u00e2y.',
        'Tap the heart icon on any product to save it here for later.': 'Nh\u1ea5n v\u00e0o bi\u1ec3u t\u01b0\u1ee3ng tr\u00e1i tim tr\u00ean s\u1ea3n ph\u1ea9m b\u1ea5t k\u1ef3 \u0111\u1ec3 l\u01b0u l\u1ea1i sau.',
        'saved item(s)': 's\u1ea3n ph\u1ea9m \u0111\u00e3 l\u01b0u',
        'Username cannot be empty': 'T\u00ean ng\u01b0\u1eddi d\u00f9ng kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng',
        'Uploading...': '\u0110ang t\u1ea3i l\u00ean...',
        'Profile updated successfully!': 'C\u1eadp nh\u1eadt h\u1ed3 s\u01a1 th\u00e0nh c\u00f4ng!',
        'Failed to update profile': 'C\u1eadp nh\u1eadt h\u1ed3 s\u01a1 th\u1ea5t b\u1ea1i',
        'Avatar upload failed. Please try again.': 'T\u1ea3i \u1ea3nh \u0111\u1ea1i di\u1ec7n l\u00ean th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.',
        'View Purchase History': 'Xem l\u1ecbch s\u1eed mua h\u00e0ng',
        'Purchase History': 'L\u1ecbch s\u1eed mua h\u00e0ng',
        'My Wishlist': 'Danh s\u00e1ch y\u00eau th\u00edch',
        'Welcome': 'Ch\u00e0o m\u1eebng',
        'Welcome back': 'Ch\u00e0o m\u1eebng tr\u1edf l\u1ea1i',
        'Welcome, ': 'Ch\u00e0o m\u1eebng, ',
        'Upload a photo to update your avatar.': 'T\u1ea3i \u1ea3nh l\u00ean \u0111\u1ec3 c\u1eadp nh\u1eadt \u1ea3nh \u0111\u1ea1i di\u1ec7n.',
        'Avatar preview': 'Xem tr\u01b0\u1edbc \u1ea3nh \u0111\u1ea1i di\u1ec7n',
        'Image preview': 'Xem tr\u01b0\u1edbc \u1ea3nh',
        'Remove image': 'X\u00f3a \u1ea3nh',

        // ── Login / register ──
        'Create Account': 'T\u1ea1o t\u00e0i kho\u1ea3n',
        'Create your account': 'T\u1ea1o t\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n',
        'Welcome Back': 'Ch\u00e0o m\u1eebng tr\u1edf l\u1ea1i',
        'Hello, Friend!': 'Xin ch\u00e0o, B\u1ea1n!',
        'Let\'s begin': 'B\u1eaft \u0111\u1ea7u th\u00f4i',
        'Full Name': 'H\u1ecd v\u00e0 t\u00ean',
        'Username': 'T\u00ean ng\u01b0\u1eddi d\u00f9ng',
        'Confirm Password': 'X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u',
        'Show password': 'Hi\u1ec7n m\u1eadt kh\u1ea9u',
        'Hide password': '\u1ea8n m\u1eadt kh\u1ea9u',
        'Create a password': 'T\u1ea1o m\u1eadt kh\u1ea9u',
        'Repeat your password': 'Nh\u1eadp l\u1ea1i m\u1eadt kh\u1ea9u',
        'Min. 8 characters with letters, numbers & a symbol': 'T\u1ed1i thi\u1ec3u 8 k\u00fd t\u1ef1 g\u1ed3m ch\u1eef, s\u1ed1 & k\u00fd t\u1ef1 \u0111\u1eb7c bi\u1ec7t',
        'Already have an account?': 'B\u1ea1n \u0111\u00e3 c\u00f3 t\u00e0i kho\u1ea3n?',
        'Don\'t have an account?': 'Ch\u01b0a c\u00f3 t\u00e0i kho\u1ea3n?',
        'or continue with': 'ho\u1eb7c ti\u1ebfp t\u1ee5c v\u1edbi',
        'Continue with Google': 'Ti\u1ebfp t\u1ee5c v\u1edbi Google',
        'Enter your email and we\'ll send you reset instructions.': 'Nh\u1eadp email c\u1ee7a b\u1ea1n v\u00e0 ch\u00fang t\u00f4i s\u1ebd g\u1eedi h\u01b0\u1edbng d\u1eabn \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u.',
        'Reset your password': '\u0110\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u',
        'Send reset link': 'G\u1eedi li\u00ean k\u1ebft \u0111\u1eb7t l\u1ea1i',
        'Forgot password?': 'Qu\u00ean m\u1eadt kh\u1ea9u?',
        'Remember me': 'Ghi nh\u1edb t\u00f4i',
        'I agree to the': 'T\u00f4i \u0111\u1ed3ng \u00fd v\u1edbi',
        'Terms of Service': '\u0110i\u1ec1u kho\u1ea3n d\u1ecbch v\u1ee5',
        'Privacy Policy': 'Ch\u00ednh s\u00e1ch b\u1ea3o m\u1eadt',
        'Sign in to your TechSphere account to continue where you left off.': '\u0110\u0103ng nh\u1eadp v\u00e0o t\u00e0i kho\u1ea3n TechSphere \u0111\u1ec3 ti\u1ebfp t\u1ee5c n\u01a1i b\u1ea1n d\u1eebng l\u1ea1i.',
        'Create an account and start your shopping journey with us today.': 'T\u1ea1o t\u00e0i kho\u1ea3n v\u00e0 b\u1eaft \u0111\u1ea7u h\u00e0nh tr\u00ecnh mua s\u1eafm v\u1edbi ch\u00fang t\u00f4i h\u00f4m nay.',
        'Your TechSphere account is ready. Continue where you left off.': 'T\u00e0i kho\u1ea3n TechSphere c\u1ee7a b\u1ea1n \u0111\u00e3 s\u1eb5n s\u00e0ng. Ti\u1ebfp t\u1ee5c n\u01a1i b\u1ea1n d\u1eebng l\u1ea1i.',
        'You\'re all set!': 'B\u1ea1n \u0111\u00e3 s\u1eb5n s\u00e0ng!',
        'Email is required.': 'Vui l\u00f2ng nh\u1eadp email.',
        'Please enter a valid email address.': 'Vui l\u00f2ng nh\u1eadp \u0111\u1ecba ch\u1ec9 email h\u1ee3p l\u1ec7.',
        'Password is required.': 'Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u.',
        'Login failed. Please try again.': '\u0110\u0103ng nh\u1eadp th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.',
        'Invalid email or password.': 'Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',
        'Please enter your full name.': 'Vui l\u00f2ng nh\u1eadp h\u1ecd v\u00e0 t\u00ean c\u1ee7a b\u1ea1n.',
        'Please choose a password.': 'Vui l\u00f2ng ch\u1ecdn m\u1eadt kh\u1ea9u.',
        'Password must be at least 8 characters long.': 'M\u1eadt kh\u1ea9u ph\u1ea3i d\u00e0i \u00edt nh\u1ea5t 8 k\u00fd t\u1ef1.',
        'Password must contain both letters and numbers.': 'M\u1eadt kh\u1ea9u ph\u1ea3i ch\u1ee9a c\u1ea3 ch\u1eef v\u00e0 s\u1ed1.',
        'Password must include a special character.': 'M\u1eadt kh\u1ea9u ph\u1ea3i ch\u1ee9a k\u00fd t\u1ef1 \u0111\u1eb7c bi\u1ec7t.',
        'Please confirm your password.': 'Vui l\u00f2ng x\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u.',
        'Passwords do not match.': 'M\u1eadt kh\u1ea9u kh\u00f4ng kh\u1edbp.',
        'You must agree to the Terms of Service.': 'B\u1ea1n ph\u1ea3i \u0111\u1ed3ng \u00fd v\u1edbi \u0110i\u1ec1u kho\u1ea3n d\u1ecbch v\u1ee5.',
        'Registration failed. Please try again.': '\u0110\u0103ng k\u00fd th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.',
        'Account created successfully!': 'T\u1ea1o t\u00e0i kho\u1ea3n th\u00e0nh c\u00f4ng!',
        'You are now signed in with Google.': 'B\u1ea1n \u0111\u00e3 \u0111\u0103ng nh\u1eadp b\u1eb1ng Google.',
        'Google sign-in failed. Please try again.': '\u0110\u0103ng nh\u1eadp Google th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.',
        'Reset instructions sent to': 'H\u01b0\u1edbng d\u1eabn \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u \u0111\u00e3 g\u1eedi t\u1edbi',

        // ── Contact ──
        'Please fill in all required fields.': 'Vui l\u00f2ng \u0111i\u1ec1n \u0111\u1ea7y \u0111\u1ee7 c\u00e1c tr\u01b0\u1eddng b\u1eaft bu\u1ed9c.',
        'Sending...': '\u0110ang g\u1eedi...',
        'Thank you for your message! We will respond within 24 hours.': 'C\u1ea3m \u01a1n b\u1ea1n \u0111\u00e3 g\u1eedi tin nh\u1eafn! Ch\u00fang t\u00f4i s\u1ebd ph\u1ea3n h\u1ed3i trong v\u00f2ng 24 gi\u1edd.',
        'Opening directions in Google Maps...': '\u0110ang m\u1edf ch\u1ec9 \u0111\u01b0\u1eddng trong Google Maps...',
        'Connecting...': '\u0110ang k\u1ebft n\u1ed1i...',
        'Connecting you with a live agent...': '\u0110ang k\u1ebft n\u1ed1i b\u1ea1n v\u1edbi nh\u00e2n vi\u00ean h\u1ed7 tr\u1ee3 tr\u1ef1c ti\u1ebfp...',
        'How can we help you?': 'Ch\u00fang t\u00f4i c\u00f3 th\u1ec3 gi\u00fap g\u00ec cho b\u1ea1n?',
        'Send Message': 'G\u1eedi tin nh\u1eafn',
        'Get in Touch': 'Li\u00ean h\u1ec7',
        'We\'re here to help': 'Ch\u00fang t\u00f4i lu\u00f4n s\u1eb5n s\u00e0ng h\u1ed7 tr\u1ee3',
        'Email Support': 'H\u1ed7 tr\u1ee3 qua email',
        'Phone Support': 'H\u1ed7 tr\u1ee3 qua \u0111i\u1ec7n tho\u1ea1i',
        'Live Chat': 'Tr\u00f2 chuy\u1ec7n tr\u1ef1c ti\u1ebfp',
        'Start Live Chat': 'B\u1eaft \u0111\u1ea7u tr\u00f2 chuy\u1ec7n',
        'Technical Support': 'H\u1ed7 tr\u1ee3 k\u1ef9 thu\u1eadt',
        'Business Inquiries': 'C\u00e2u h\u1ecfi kinh doanh',
        'General Inquiry': 'C\u00e2u h\u1ecfi chung',
        'Visit Our Stores': 'Gh\u00e9 th\u0103m c\u1eeda h\u00e0ng',
        'Get Directions': 'Ch\u1ec9 \u0111\u01b0\u1eddng',
        'Send Us a Message': 'G\u1eedi tin nh\u1eafn cho ch\u00fang t\u00f4i',
        'Need help?': 'C\u1ea7n tr\u1ee3 gi\u00fap?',
        'Customer': 'Kh\u00e1ch h\u00e0ng',
        'Send us an email and we\'ll respond within 24 hours': 'G\u1eedi email cho ch\u00fang t\u00f4i v\u00e0 ch\u00fang t\u00f4i s\u1ebd ph\u1ea3n h\u1ed3i trong v\u00f2ng 24 gi\u1edd',
        'Chat with a representative in real-time': 'Tr\u00f2 chuy\u1ec7n tr\u1ef1c ti\u1ebfp v\u1edbi nh\u00e2n vi\u00ean t\u01b0 v\u1ea5n',
        'Speak directly with our customer service team': 'N\u00f3i chuy\u1ec7n tr\u1ef1c ti\u1ebfp v\u1edbi \u0111\u1ed9i ng\u0169 ch\u0103m s\u00f3c kh\u00e1ch h\u00e0ng',
        'Find quick answers to common questions about orders, shipping, returns, and more.': 'T\u00ecm c\u00e2u tr\u1ea3 l\u1eddi nhanh cho c\u00e1c c\u00e2u h\u1ecfi th\u01b0\u1eddng g\u1eb7p v\u1ec1 \u0111\u01a1n h\u00e0ng, v\u1eadn chuy\u1ec3n, \u0111\u1ed5i tr\u1ea3 v\u00e0 h\u01a1n th\u1ebf n\u1eefa.',
        'Frequently Asked Questions': 'C\u00e2u h\u1ecfi th\u01b0\u1eddng g\u1eb7p',
        'Experience our products in person at one of our retail locations.': 'Tr\u1ea3i nghi\u1ec7m s\u1ea3n ph\u1ea9m tr\u1ef1c ti\u1ebfp t\u1ea1i m\u1ed9t trong c\u00e1c c\u1eeda h\u00e0ng c\u1ee7a ch\u00fang t\u00f4i.',
        'Our customer support team is available round the clock to assist you.': '\u0110\u1ed9i ng\u0169 h\u1ed7 tr\u1ee3 kh\u00e1ch h\u00e0ng c\u1ee7a ch\u00fang t\u00f4i lu\u00f4n s\u1eb5n s\u00e0ng h\u1ed7 tr\u1ee3 b\u1ea1n 24/7.',
        'We offer a 30-day return policy for most items in their original condition with packaging.': 'Ch\u00fang t\u00f4i c\u00f3 ch\u00ednh s\u00e1ch \u0111\u1ed5i tr\u1ea3 trong 30 ng\u00e0y cho h\u1ea7u h\u1ebft s\u1ea3n ph\u1ea9m c\u00f2n nguy\u00ean tr\u1ea1ng k\u00e8m bao b\u00ec.',
        '1-800-TECH-SPH': '1-800-TECH-SPH',
        'Available now': 'C\u00f3 s\u1eb5n ngay',

        // ── Chatbot ──
        'Chat with assistant': 'Tr\u00f2 chuy\u1ec7n v\u1edbi tr\u1ee3 l\u00fd',
        'Product Assistant': 'Tr\u1ee3 l\u00fd s\u1ea3n ph\u1ea9m',
        'Close': '\u0110\u00f3ng',
        'Categories?': 'Danh m\u1ee5c?',
        'Cheapest?': 'R\u1ebb nh\u1ea5t?',
        'Good phones': '\u0110i\u1ec7n tho\u1ea1i t\u1ed1t',
        'Top rated': '\u0110\u00e1nh gi\u00e1 cao nh\u1ea5t',
        'Ask about products...': 'H\u1ecfi v\u1ec1 s\u1ea3n ph\u1ea9m...',
        'Ready': 'S\u1eb5n s\u00e0ng',
        'Thinking...': '\u0110ang suy ngh\u0129...',
        'Error: ': 'L\u1ed7i: ',
        'No response.': 'Kh\u00f4ng c\u00f3 ph\u1ea3n h\u1ed3i.',

        // ── Admin ──
        'Dashboard': 'B\u1ea3ng \u0111i\u1ec1u khi\u1ec3n',
        'Product List': 'Danh s\u00e1ch s\u1ea3n ph\u1ea9m',
        'Add Product': 'Th\u00eam s\u1ea3n ph\u1ea9m',
        'Edit Product': 'S\u1eeda s\u1ea3n ph\u1ea9m',
        'Users': 'Ng\u01b0\u1eddi d\u00f9ng',
        'Settings': 'C\u00e0i \u0111\u1eb7t',
        'Index': 'STT',
        'No.': 'STT',
        'Category': 'Danh m\u1ee5c',
        'Image': '\u1ea2nh',
        'Product Name': 'T\u00ean s\u1ea3n ph\u1ea9m',
        'Price': 'Gi\u00e1',
        'Actions': 'Thao t\u00e1c',
        'Edit': 'S\u1eeda',
        'Delete': 'X\u00f3a',
        'Items': 'S\u1ea3n ph\u1ea9m',
        'Loading products...': '\u0110ang t\u1ea3i s\u1ea3n ph\u1ea9m...',
        'Loading history...': '\u0110ang t\u1ea3i l\u1ecbch s\u1eed...',
        'Failed to load products. Check console.': 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c s\u1ea3n ph\u1ea9m. Ki\u1ec3m tra console.',
        'Failed to load orders. Check console / Firestore rules.': 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c \u0111\u01a1n h\u00e0ng. Ki\u1ec3m tra console / quy t\u1eafc Firestore.',
        'Failed to load history. Check console / Firestore rules.': 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c l\u1ecbch s\u1eed. Ki\u1ec3m tra console / quy t\u1eafc Firestore.',
        'Please fill in all fields correctly.': 'Vui l\u00f2ng \u0111i\u1ec1n \u0111\u00fang t\u1ea5t c\u1ea3 c\u00e1c tr\u01b0\u1eddng.',
        'Please enter an image URL.': 'Vui l\u00f2ng nh\u1eadp URL \u1ea3nh.',
        'Please select an image file to upload.': 'Vui l\u00f2ng ch\u1ecdn t\u1ec7p \u1ea3nh \u0111\u1ec3 t\u1ea3i l\u00ean.',
        'Uploading image...': '\u0110ang t\u1ea3i \u1ea3nh l\u00ean...',
        'Failed to upload image: ': 'T\u1ea3i \u1ea3nh l\u00ean th\u1ea5t b\u1ea1i: ',
        'Product added successfully!': '\u0110\u00e3 th\u00eam s\u1ea3n ph\u1ea9m th\u00e0nh c\u00f4ng!',
        'Failed to add product: ': 'Th\u00eam s\u1ea3n ph\u1ea9m th\u1ea5t b\u1ea1i: ',
        'Are you sure you want to delete this product?': 'B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n x\u00f3a s\u1ea3n ph\u1ea9m n\u00e0y?',
        'Product deleted successfully!': '\u0110\u00e3 x\u00f3a s\u1ea3n ph\u1ea9m th\u00e0nh c\u00f4ng!',
        'Failed to delete product: ': 'X\u00f3a s\u1ea3n ph\u1ea9m th\u1ea5t b\u1ea1i: ',
        'Product not found.': 'Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m.',
        'Failed to load product: ': 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c s\u1ea3n ph\u1ea9m: ',
        'Product updated successfully!': '\u0110\u00e3 c\u1eadp nh\u1eadt s\u1ea3n ph\u1ea9m th\u00e0nh c\u00f4ng!',
        'Failed to update product: ': 'C\u1eadp nh\u1eadt s\u1ea3n ph\u1ea9m th\u1ea5t b\u1ea1i: ',
        'Please drop an image file.': 'Vui l\u00f2ng k\u00e9o th\u1ea3 t\u1ec7p \u1ea3nh.',
        'Your browser does not support drag & drop. Please use the Choose File button.': 'Tr\u00ecnh duy\u1ec7t c\u1ee7a b\u1ea1n kh\u00f4ng h\u1ed7 tr\u1ee3 k\u00e9o & th\u1ea3. Vui l\u00f2ng d\u00f9ng n\u00fat Ch\u1ecdn t\u1ec7p.',
        'Ship to: ': 'Giao \u0111\u1ebfn: ',
        'Order status updated to ': '\u0110\u00e3 c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i \u0111\u01a1n h\u00e0ng th\u00e0nh ',
        'Failed to update status: ': 'C\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i th\u1ea5t b\u1ea1i: ',
        'Access denied: Admin only.': 'T\u1eeb ch\u1ed1i truy c\u1eadp: Ch\u1ec9 d\u00e0nh cho qu\u1ea3n tr\u1ecb vi\u00ean.',

        // ── Admin: Quản lý người dùng ──
        'Manage Users': 'Qu\u1ea3n l\u00fd ng\u01b0\u1eddi d\u00f9ng',
        '0 users': '0 ng\u01b0\u1eddi d\u00f9ng',
        'users': 'ng\u01b0\u1eddi d\u00f9ng',
        'banned': 'b\u1ecb c\u1ea5m',
        'No users found.': 'Kh\u00f4ng c\u00f3 ng\u01b0\u1eddi d\u00f9ng n\u00e0o.',
        'Loading users...': '\u0110ang t\u1ea3i ng\u01b0\u1eddi d\u00f9ng...',
        'Failed to load users. Check console / Firestore rules.': 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c ng\u01b0\u1eddi d\u00f9ng. Ki\u1ec3m tra console / quy t\u1eafc Firestore.',
        'Name': 'T\u00ean',
        'Username': 'T\u00ean ng\u01b0\u1eddi d\u00f9ng',
        'Registered': 'Ng\u00e0y \u0111\u0103ng k\u00fd',
        'Unknown': 'Kh\u00f4ng r\u00f5',
        'Status': 'Tr\u1ea1ng th\u00e1i',
        'Active': 'Ho\u1ea1t \u0111\u1ed9ng',
        'Banned': 'B\u1ecb c\u1ea5m',
        'Banned until ': 'B\u1ecb c\u1ea5m \u0111\u1ebfn ',
        'Forever': 'V\u0129nh vi\u1ec5n',
        'Ban': 'C\u1ea5m',
        'Unban': 'G\u1ee1 c\u1ea5m',
        'Ban User': 'C\u1ea5m ng\u01b0\u1eddi d\u00f9ng',
        'Please choose how long this account should be banned:': 'Vui l\u00f2ng ch\u1ecdn th\u1eddi gian c\u1ea5m t\u00e0i kho\u1ea3n n\u00e0y:',
        '1 Day': '1 Ng\u00e0y',
        '1 Week': '1 Tu\u1ea7n',
        '1 Month': '1 Th\u00e1ng',
        '1 Year': '1 N\u0103m',
        '1 day': '1 ng\u00e0y',
        '1 week': '1 tu\u1ea7n',
        '1 month': '1 th\u00e1ng',
        '1 year': '1 n\u0103m',
        'User banned for ': '\u0110\u00e3 c\u1ea5m ng\u01b0\u1eddi d\u00f9ng trong ',
        'Failed to ban user: ': 'C\u1ea5m ng\u01b0\u1eddi d\u00f9ng th\u1ea5t b\u1ea1i: ',
        'User unbanned successfully.': 'G\u1ee1 c\u1ea5m ng\u01b0\u1eddi d\u00f9ng th\u00e0nh c\u00f4ng.',
        'Failed to unban user: ': 'G\u1ee1 c\u1ea5m ng\u01b0\u1eddi d\u00f9ng th\u1ea5t b\u1ea1i: ',
        'User deleted successfully.': 'X\u00f3a ng\u01b0\u1eddi d\u00f9ng th\u00e0nh c\u00f4ng.',
        'Failed to delete user: ': 'X\u00f3a ng\u01b0\u1eddi d\u00f9ng th\u1ea5t b\u1ea1i: ',
        'Are you sure you want to delete this user?': 'B\u1ea1n c\u00f3 ch\u1eafc ch\u1eafn mu\u1ed1n x\u00f3a ng\u01b0\u1eddi d\u00f9ng n\u00e0y?',
        'You cannot ban your own admin account.': 'B\u1ea1n kh\u00f4ng th\u1ec3 c\u1ea5m t\u00e0i kho\u1ea3n admin c\u1ee7a ch\u00ednh m\u00ecnh.',
        'You cannot delete your own admin account.': 'B\u1ea1n kh\u00f4ng th\u1ec3 x\u00f3a t\u00e0i kho\u1ea3n admin c\u1ee7a ch\u00ednh m\u00ecnh.',
        'Your account has been permanently banned.': 'T\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n \u0111\u00e3 b\u1ecb c\u1ea5m v\u0129nh vi\u1ec5n.',
        'Your account has been suspended until ': 'T\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n \u0111\u00e3 b\u1ecb kh\u00f3a cho \u0111\u1ebfn ',
        'Your account has been suspended. Please contact support.': 'T\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n \u0111\u00e3 b\u1ecb kh\u00f3a. Vui l\u00f2ng li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3.',

        // ── Misc ──
        'Address': '\u0110\u1ecba ch\u1ec9',
        'View': 'Xem',
        'Guest': 'Kh\u00e1ch',
        'Not enabled': 'Ch\u01b0a b\u1eadt',
        'Two-factor authentication': 'X\u00e1c th\u1ef1c hai y\u1ebfu t\u1ed1',
        'Login sessions': 'Phi\u00ean \u0111\u0103ng nh\u1eadp',
        'Current device only': 'Ch\u1ec9 thi\u1ebft b\u1ecb hi\u1ec7n t\u1ea1i',
        'Manage': 'Qu\u1ea3n l\u00fd',
        'Save Changes': 'L\u01b0u thay \u0111\u1ed5i',
        'United States': 'Hoa K\u1ef3',
        'United Kingdom': 'V\u01b0\u01a1ng qu\u1ed1c Anh',
        'Australia': '\u00dac',
        'Vietnam': 'Vi\u1ec7t Nam',
        'Filters reset!': '\u0110\u00e3 \u0111\u1eb7t l\u1ea1i b\u1ed9 l\u1ecdc!'
    };

    /* ═══════════════ Tiêu đề trang ═══════════════ */
    var TITLES = {
        'TechSphere | Modern Electronics Store': 'TechSphere | C\u1eeda h\u00e0ng \u0110i\u1ec7n t\u1eed Hi\u1ec7n \u0111\u1ea1i',
        'Smartphones | TechSphere': '\u0110i\u1ec7n tho\u1ea1i th\u00f4ng minh | TechSphere',
        'Laptops | TechSphere': 'Laptop | TechSphere',
        'Deals & Offers | TechSphere': 'Khuy\u1ebfn m\u00e3i | TechSphere',
        'Shopping Cart | TechSphere': 'Gi\u1ecf h\u00e0ng | TechSphere',
        'Checkout | TechSphere': 'Thanh to\u00e1n | TechSphere',
        'Login / Register | TechSphere': '\u0110\u0103ng nh\u1eadp / \u0110\u0103ng k\u00fd | TechSphere',
        'Contact Us | TechSphere': 'Li\u00ean h\u1ec7 | TechSphere',
        'My Wishlist | TechSphere': 'Danh s\u00e1ch y\u00eau th\u00edch | TechSphere',
        'My Account | TechSphere': 'T\u00e0i kho\u1ea3n c\u1ee7a t\u00f4i | TechSphere',
        'Product Detail | TechSphere': 'Chi ti\u1ebft s\u1ea3n ph\u1ea9m | TechSphere',
        'Admin | TechSphere': 'Qu\u1ea3n tr\u1ecb | TechSphere',
        'Accessories | TechSphere': 'Ph\u1ee5 ki\u1ec7n | TechSphere',
        'Smart Devices | TechSphere': 'Thi\u1ebft b\u1ecb th\u00f4ng minh | TechSphere',
        'Home': 'Trang ch\u1ee7'
    };

    /* ═══════════════ State ═══════════════ */
    var STORAGE_KEY = 'techsphere_lang';
    var current = null;

    function normalize(s) {
        return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    }

    function isVi(text) {
        return /vi\u1ec7t|viet/i.test(String(text || ''));
    }

    function detect() {
        // 1) Cài đặt tài khoản (nếu đã đăng nhập, auth.getSettings trả giá trị lưu)
        try {
            if (typeof global.auth !== 'undefined' && typeof global.auth.getSettings === 'function') {
                var saved = global.auth.getSettings().language;
                if (saved && isVi(saved)) return 'vi';
            }
        } catch (_) { /* auth chưa sẵn sàng */ }
        // 2) localStorage
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'vi' || stored === 'en') return stored;
        } catch (_) { /* bỏ qua */ }
        return 'en';
    }

    current = detect();

    /* ═══════════════ Regex (phrase dài trước, word-boundary thông minh) ═══════════════ */
    function regexFor(k) {
        var esc = k.replace(/[.*+?^\u0024{}()|[\]\\]/g, '\\$&');
        var first = k.charAt(0);
        var last = k.charAt(k.length - 1);
        // Chỉ thêm \b ở đầu/cuối nếu ký tự đó là ký tự chữ-số-dấu _; còn lại (dấu câu,
        // khoảng trắng, $, ...) thì đã tự phân tách nên không cần \b.
        var pre = /[A-Za-z0-9_]/.test(first) ? '\\b' : '';
        var post = /[A-Za-z0-9_]/.test(last) ? '\\b' : '';
        return new RegExp(pre + esc + post, 'g');
    }

    var KEYS = Object.keys(VI).sort(function (a, b) { return b.length - a.length; });
    var RULES = KEYS.map(function (k) {
        return { k: k, re: regexFor(k) };
    });

    function translateText(raw) {
        if (!raw) return raw;
        var out = raw;
        for (var i = 0; i < RULES.length; i++) {
            if (out.length <= 1) break;
            var re = RULES[i].re;
            re.lastIndex = 0;
            if (re.test(out)) {
                out = out.replace(re, function () { return VI[RULES[i].k]; });
            }
        }
        return out;
    }

    /* ═══════════════ Public API ═══════════════ */
    var I18n = {
        current: function () { return current; },
        isVi: function () { return current === 'vi'; },
        t: function (text) {
            if (current !== 'vi') return text == null ? '' : String(text);
            if (text != null) {
                var s = String(text);
                if (Object.prototype.hasOwnProperty.call(VI, s)) return VI[s];
                var n = normalize(s);
                if (n !== s && Object.prototype.hasOwnProperty.call(VI, n)) return VI[n];
            }
            return text == null ? '' : String(text);
        },
        tr: function (text) { return I18n.t(text); },
        set: function (lang) {
            current = (lang === 'vi') ? 'vi' : 'en';
            try { localStorage.setItem(STORAGE_KEY, current); } catch (_) { /* bỏ qua */ }
            try {
                if (typeof global.auth !== 'undefined' && typeof global.auth.saveSettings === 'function') {
                    global.auth.saveSettings({ language: current === 'vi' ? 'Ti\u1ebfng Vi\u1ec7t' : 'English (US)' });
                }
            } catch (_) { /* bỏ qua */ }
            try { if (document.documentElement) document.documentElement.lang = current; } catch (_) { /* bỏ qua */ }
            if (typeof window.CustomEvent === 'function') {
                try { window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: current } })); } catch (_) { /* bỏ qua */ }
            }
            window.location.reload();
        },
        toggle: function () { I18n.set(current === 'vi' ? 'en' : 'vi'); }
    };

    /* ═══════════════ Áp dụng vào DOM ═══════════════ */
    var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-label'];
    var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };

    function isSkipped(el) {
        if (el.contentEditable === 'true') return true;
        var t = (el.tagName || '').toUpperCase();
        return !!SKIP_TAGS[t];
    }

    function applyAttributes(root) {
        var els = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (isSkipped(el)) continue;
            for (var a = 0; a < ATTRS.length; a++) {
                var name = ATTRS[a];
                if (el.hasAttribute && el.hasAttribute(name)) {
                    var val = el.getAttribute(name);
                    if (val) {
                        var key = normalize(val);
                        if (key && Object.prototype.hasOwnProperty.call(VI, key)) {
                            el.setAttribute(name, VI[key]);
                        }
                    }
                }
            }
        }
    }

    function applyText(root) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                var p = node.parentElement;
                if (!p || isSkipped(p)) return NodeFilter.FILTER_REJECT;
                var c = normalize(node.nodeValue);
                if (c.length < 2 || !/[A-Za-z]/.test(c)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var nodes = [];
        var n;
        while ((n = walker.nextNode())) nodes.push(n);
        for (var i = 0; i < nodes.length; i++) {
            var out = translateText(nodes[i].nodeValue);
            if (out !== nodes[i].nodeValue) nodes[i].nodeValue = out;
        }
    }

    function applyTitles() {
        try {
            var title = normalize(document.title);
            if (title && Object.prototype.hasOwnProperty.call(TITLES, title)) {
                document.title = TITLES[title];
            }
        } catch (_) { /* bỏ qua */ }
    }

    function boot() {
        try { if (document.documentElement) document.documentElement.lang = current; } catch (_) { /* bỏ qua */ }
        applyTitles();
        if (current === 'vi' && document.body) {
            applyText(document.body);
            applyAttributes(document.body);
        }
    }

    /* Chạy lúc DOMContentLoaded (nội dung tĩnh) và load (nội dung JS render) */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        if (document.readyState === 'interactive') boot();
    }
    window.addEventListener('load', boot);

    global.I18n = I18n;
    global.I18N = I18n;
})(window);