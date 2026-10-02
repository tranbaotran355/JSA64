// js/cloudinary.js - Upload ảnh lên Cloudinary (unsigned preset, client-side)
// Cách dùng: nhúng file này TRƯỚC admin.js / profile.js,
// rồi gọi `await window.uploadImageToCloudinary(file)` -> trả về secure_url.
const CLOUDINARY_CONFIG = {
    CLOUD_NAME: "joyyjsxw",
    UPLOAD_PRESET: "my_image"
};

// Upload một file ảnh lên Cloudinary, resolve URL ảnh hoàn chỉnh (secure_url)
function uploadImageToCloudinary(file) {
    return new Promise(function (resolve, reject) {
        if (!file) {
            reject(new Error('No file selected'));
            return;
        }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);

        fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: fd
        })
            .then(function (res) {
                if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
                return res.json();
            })
            .then(function (data) {
                if (data && data.secure_url) {
                    resolve(data.secure_url);
                } else {
                    reject(new Error('Cloudinary did not return an image URL'));
                }
            })
            .catch(reject);
    });
}

// Khởi tạo một "khu vực upload" hỗ trợ click-chọn-file + kéo-thả (drag & drop).
// Tham số:
//   zone        : thẻ chứa vùng upload (sẽ lắng nghe click + drag/drop)
//   fileInput   : <input type="file" accept="image/*" hidden>
//   preview     : <img> hiển thị ảnh đã chọn (ẩn khi chưa có ảnh)
//   urlInput    : <input type="text/url> nhận URL Cloudinary sau khi upload xong
//   status      : (tùy chọn) thẻ hiển thị trạng thái "Đang tải..."
//   onStart/onDone/onError : (tùy chọn) callback
function initCloudinaryUpload(options) {
    if (!options || !options.zone || !options.fileInput) return null;
    var zone = options.zone;
    var fileInput = options.fileInput;
    var preview = options.preview || null;
    var urlInput = options.urlInput || null;
    var statusEl = options.status || null;

    function setDragState(isDragging) {
        zone.classList.toggle('dragover', !!isDragging);
    }

    function setPreview(url) {
        if (!preview) return;
        if (url) {
            preview.src = url;
            preview.style.display = 'block';
            zone.classList.add('has-image');
        } else {
            preview.removeAttribute('src');
            preview.style.display = 'none';
            zone.classList.remove('has-image');
        }
    }

    function setStatus(text) {
        if (statusEl) {
            statusEl.textContent = text || '';
            statusEl.style.display = text ? 'block' : 'none';
        }
    }

    function acceptFile(file) {
        if (!file) return;
        if (!file.type || file.type.indexOf('image/') !== 0) {
            if (options.onError) options.onError(new Error('Please select an image file to upload.'));
            return;
        }
        if (options.onStart) options.onStart(file);
        setStatus('Uploading image...');
        uploadImageToCloudinary(file)
            .then(function (url) {
                setStatus('');
                setPreview(url);
                if (urlInput) urlInput.value = url;
                if (options.onDone) options.onDone(url, file);
            })
            .catch(function (err) {
                setStatus('');
                if (options.onError) options.onError(err);
            });
    }

    zone.addEventListener('click', function (e) {
        if (e.target === fileInput) return;
        e.preventDefault();
        fileInput.click();
    });
    fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files.length) {
            acceptFile(fileInput.files[0]);
            fileInput.value = '';
        }
    });

    // Kéo & thả
    zone.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragState(true);
    });
    zone.addEventListener('dragenter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragState(true);
    });
    zone.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragState(false);
    });
    zone.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragState(false);
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            acceptFile(e.dataTransfer.files[0]);
        }
    });

    return {
        zone: zone,
        fileInput: fileInput,
        setPreview: setPreview,
        setStatus: setStatus,
        setDragState: setDragState
    };
}

window.UPLOAD_PRESET = CLOUDINARY_CONFIG.UPLOAD_PRESET;
window.CLOUD_NAME = CLOUDINARY_CONFIG.CLOUD_NAME;
window.uploadImageToCloudinary = uploadImageToCloudinary;
window.initCloudinaryUpload = initCloudinaryUpload;