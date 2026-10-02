// admin.js - Quản lý sản phẩm qua Firestore SDK (chỉ dành cho admin)
// Dùng chung cấu hình với js/configFirebase.js (collection 'products').
(function () {
    'use strict';

    // Chỉ admin mới được sử dụng trang quản trị
    if (typeof auth === 'undefined' || !auth.isAdmin()) {
        console.warn('Access denied: admin only.');
        return;
    }

    /* ── DOM ── */
    const tableBody = document.getElementById('product-table-body');
    const addForm = document.getElementById('add-product-form');
    const inpName = document.getElementById('inp-name');
    const inpPrice = document.getElementById('inp-price');
    const inpImage = document.getElementById('inp-image');
    const inpCategory = document.getElementById('inp-category');

    const addArea = document.getElementById('add-product-area');
    const addHeader = document.getElementById('add-header');
    const editArea = document.getElementById('edit-product-area');
    const editForm = document.getElementById('edit-product-form');
    const editInpId = document.getElementById('edit-inp-id');
    const editInpName = document.getElementById('edit-inp-name');
    const editInpPrice = document.getElementById('edit-inp-price');
    const editInpImage = document.getElementById('edit-inp-image');
    const editInpCategory = document.getElementById('edit-inp-category');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    /* ── Upload zone (Cloudinary: click-chọn-file + kéo-thả) ── */
    const addUploadZone = document.getElementById('add-upload-zone');
    const addFileInput = document.getElementById('add-file-input');
    const addUploadPreview = document.getElementById('add-upload-preview');
    const addUploadStatus = document.getElementById('add-upload-status');
    const addUploadRemove = document.getElementById('add-upload-remove');

    const editUploadZone = document.getElementById('edit-upload-zone');
    const editFileInput = document.getElementById('edit-file-input');
    const editUploadPreview = document.getElementById('edit-upload-preview');
    const editUploadStatus = document.getElementById('edit-upload-status');
    const editUploadRemove = document.getElementById('edit-upload-remove');

    const uploadZones = {};

    function setupUploadZone(key, zone, fileInput, preview, statusEl, removeBtn, urlInput) {
        if (!zone || !fileInput) return;
        uploadZones[key] = initCloudinaryUpload({
            zone: zone,
            fileInput: fileInput,
            preview: preview,
            statusEl: statusEl,
            urlInput: urlInput,
            onError: function (err) {
                alert(err && err.message ? err.message : 'Failed to upload image.');
            }
        });
        if (removeBtn) {
            removeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (uploadZones[key]) uploadZones[key].setPreview('');
                if (urlInput) urlInput.value = '';
            });
        }
    }

    setupUploadZone('add', addUploadZone, addFileInput, addUploadPreview, addUploadStatus, addUploadRemove, inpImage);
    setupUploadZone('edit', editUploadZone, editFileInput, editUploadPreview, editUploadStatus, editUploadRemove, editInpImage);

    /* ── Hàm hỗ trợ ── */
    function swapForms(showEdit) {
        var outEl = showEdit ? addArea : editArea;
        var outHeader = showEdit ? addHeader : null;
        var inEl = showEdit ? editArea : addArea;
        var inHeader = showEdit ? null : addHeader;

        if (outHeader) outHeader.classList.add('swapping');
        outEl.classList.add('swapping');

        setTimeout(function () {
            outEl.style.display = 'none';
            outEl.classList.remove('swapping');
            if (outHeader) {
                outHeader.style.display = 'none';
                outHeader.classList.remove('swapping');
            }
            inEl.style.display = 'block';
            if (inHeader) inHeader.style.display = 'block';
        }, 200);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    function formatPrice(val) {
        const n = Number(val) || 0;
        return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* ── Đọc danh sách sản phẩm (Firestore SDK - kiểu Buoi3) ── */
    async function loadProducts() {
        if (!tableBody || typeof db === 'undefined') return;
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">Loading products...</td></tr>';

        try {
            const querySnapshot = await db.collection('products').get();

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">No products found.</td></tr>';
                return;
            }

            let html = '';
            let index = 0;
            querySnapshot.forEach(function (doc) {
                index++;
                const product = doc.data() || {};
                product.id = doc.id;
                const img = product.imageUrl
                    ? '<img src="' + product.imageUrl + '" alt="' + escapeHtml(product.name || '') + '" class="product-thumb" onerror="this.style.display=\'none\'">'
                    : '<span style="color:#6b7280">No image</span>';
                html += `
                    <tr>
                        <td data-label="STT">${index}</td>
                        <td data-label="Danh mục">${escapeHtml(product.category || 'other')}</td>
                        <td data-label="Hình ảnh">${img}</td>
                        <td data-label="Tên sản phẩm">${escapeHtml(product.name || 'Unknown Product')}</td>
                        <td data-label="Giá">${formatPrice(product.price)}</td>
                        <td data-label="Thao tác">
                            <div class="table-actions">
                                <button class="btn-edit" onclick="editProduct('${doc.id}')">Edit</button>
                                <button class="btn-delete" onclick="deleteProduct('${doc.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        } catch (error) {
            console.error('Error loading products: ', error);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">Failed to load products. Check console.</td></tr>';
        }
    }

    /* ── Thêm sản phẩm mới ── */
    async function addProduct(product) {
        await db.collection('products').add({
            name: product.name,
            price: Number(product.price) || 0,
            imageUrl: product.image,
            category: product.category,
            rating: 4,
            createdAt: new Date().toISOString()
        });
    }

    if (addForm) {
        addForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const name = inpName.value.trim();
            const price = parseFloat(inpPrice.value);
            const image = inpImage.value.trim();
            const category = inpCategory.value.trim();

            if (!name || isNaN(price) || !image || !category) {
                alert('Please fill in all fields correctly.');
                return;
            }
            if (price < 0) {
                alert('Price must be a positive number.');
                return;
            }

            try {
                await addProduct({ name: name, price: price, image: image, category: category });
                alert('Product added successfully!');
                addForm.reset();
                if (uploadZones.add) uploadZones.add.setPreview('');
                await loadProducts();
            } catch (error) {
                console.error('Error adding product: ', error);
                alert('Failed to add product: ' + error.message);
            }
        });
    }

    /* ── Xoá sản phẩm ── */
    window.deleteProduct = async function (productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await db.collection('products').doc(productId).delete();
            alert('Product deleted successfully!');
            await loadProducts();
        } catch (error) {
            console.error('Error deleting product: ', error);
            alert('Failed to delete product: ' + error.message);
        }
    };

    /* ── Sửa sản phẩm (dùng edit form) ── */
    window.editProduct = async function (productId) {
        try {
            const doc = await db.collection('products').doc(productId).get();
            if (!doc.exists) {
                alert('Product not found.');
                return;
            }
            const product = doc.data();

            editInpId.value = productId;
            editInpName.value = product.name || '';
            editInpPrice.value = product.price || '';
            editInpImage.value = product.imageUrl || '';
            editInpCategory.value = product.category || '';
            if (uploadZones.edit) uploadZones.edit.setPreview(product.imageUrl || '');

            swapForms(true);
        } catch (error) {
            console.error('Error loading product for edit: ', error);
            alert('Failed to load product: ' + error.message);
        }
    };

    if (editForm) {
        editForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const productId = editInpId.value;
            const name = editInpName.value.trim();
            const price = parseFloat(editInpPrice.value);
            const imageUrl = editInpImage.value.trim();
            const category = editInpCategory.value.trim();

            if (!name || isNaN(price) || !imageUrl || !category) {
                alert('Please fill in all fields correctly.');
                return;
            }
            if (price < 0) {
                alert('Price must be a positive number.');
                return;
            }

            try {
                await db.collection('products').doc(productId).update({
                    name: name,
                    price: Number(price),
                    imageUrl: imageUrl,
                    category: category
                });
                alert('Product updated successfully!');
                swapForms(false);
                editForm.reset();
                if (uploadZones.edit) uploadZones.edit.setPreview('');
                await loadProducts();
            } catch (error) {
                console.error('Error updating product: ', error);
                alert('Failed to update product: ' + error.message);
            }
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function () {
            swapForms(false);
            editForm.reset();
            if (uploadZones.edit) uploadZones.edit.setPreview('');
        });
    }

    /* ── Khởi tạo ── */
    loadProducts();
})();
