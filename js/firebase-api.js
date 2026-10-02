// firebase-api.js - Lấy dữ liệu sản phẩm từ Firestore qua Firebase SDK (giống Buoi3)
// Dữ liệu sản phẩm nằm trong collection 'products', trường phân loại là 'category'.
// Cần nhúng Firebase SDK + js/configFirebase.js trước file này.

(function () {
  // Chuyển 1 document Firestore (SDK) thành sản phẩm phẳng
  // { id, name, price, image, category, rating, ratingCount, original_price }
  function docToProduct(doc) {
    const d = doc.data() || {};
    const id = doc.id;
    let price = Number(d.price) || 0;
    if (price > 10000) {
      price = +(price / 23000).toFixed(2); // VND -> USD
    }
    return {
      id: id,
      name: d.name != null ? String(d.name) : 'Unknown Product',
      price: price,
      image: d.image || d.imageUrl || '',
      category: String(d.category != null ? d.category : 'other').toLowerCase(),
      rating: Number(d.rating) || 0,
      ratingCount: d.ratingCount != null ? Number(d.ratingCount) : null,
      original_price: d.original_price != null ? Number(d.original_price) : null
    };
  }

  // Lấy toàn bộ sản phẩm từ Firestore bằng Firebase SDK (kiểu Buoi3)
  // Trả về Promise<Array<product>>
  window.getAllProducts = function () {
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
      return Promise.reject(new Error('Firebase SDK chưa được tải (thiếu configFirebase.js?)'));
    }
    return db.collection('products')
      .get()
      .then(function (querySnapshot) {
        const products = [];
        querySnapshot.forEach(function (doc) {
          products.push(docToProduct(doc));
        });
        return products;
      });
  };

  // Tương thích ngược: các code cũ gọi parseFirestoreProducts(data) với data REST
  // giờ có thể gọi getAllProducts() trực tiếp; hàm dưới đây trả về mảng rỗng an toàn.
  window.parseFirestoreProducts = function () {
    console.warn('parseFirestoreProducts đã lỗi thời, hãy dùng window.getAllProducts()');
    return [];
  };
})();
