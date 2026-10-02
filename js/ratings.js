/**
 * ratings.js - Chức năng đánh giá sản phẩm bằng sao (lưu Firestore)
 *
 * MÔ HÌNH DỮ LIỆU:
 *   products/{productId}
 *     ├─ rating: 4.5            - điểm trung bình (tự tính lại)
 *     ├─ ratingCount: 12        - tổng số lượt đánh giá
 *     └─ reviews/{autoId}       - subcollection đánh giá
 *          { userId, userName, stars: 1-5, createdAt }
 *
 * Quy tắc:
 *   - Chỉ người dùng đã đăng nhập mới được chấm điểm.
 *   - Mỗi user 1 đánh giá / sản phẩm; chấm lại = cập nhật (ghi đè).
 */
(function () {
  'use strict';

  /* ── CSS cho widget sao + danh sách review ── */
  const style = document.createElement('style');
  style.textContent = `
.rate-product{margin-top:22px;padding:18px 20px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}
.rate-product h3{margin:0 0 4px;font-size:15px;color:#0f172a}
.rate-hint{font-size:13px;color:#64748b;margin:0 0 10px}
.star-input{display:flex;gap:6px;font-size:26px;cursor:pointer}
.star-input i{color:#cbd5e1;transition:transform .12s ease,color .12s ease}
.star-input i:hover{transform:scale(1.18)}
.star-input i.lit{color:#f59e0b}
.star-input.locked{cursor:default;pointer-events:none;opacity:.75}
.rating-feedback{display:block;margin-top:8px;font-size:13px;color:#059669;min-height:18px}
.reviews-section{padding:60px 0;background:#fff}
.reviews-section h2{font-size:28px;margin-bottom:24px;color:#0f172a}
.review-card{border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-bottom:14px;background:#fafbfc}
.review-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.review-name{font-weight:600;color:#0f172a;font-size:15px}
.review-stars{color:#f59e0b;font-size:14px;display:flex;gap:2px}
.review-date{font-size:12px;color:#94a3b8}
.reviews-empty{color:#94a3b8;font-size:15px;padding:24px 0;text-align:center}
.reviews-loading{color:#94a3b8;text-align:center;padding:24px 0}
`;
  document.head.appendChild(style);

  const esc = s => String(s ?? '').replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function requireLogin() {
    if (typeof auth !== 'undefined' && auth.isLoggedIn) return true;
    if (window.notify && typeof notify.error === 'function') {
      notify.error('Please login to rate this product!');
    }
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    return false;
  }

  /* ── Lấy danh sách reviews của sản phẩm (mới nhất lên đầu) ── */
  async function loadReviews(productId) {
    if (typeof db === 'undefined') return [];
    const snap = await db.collection('products').doc(productId)
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();
    const reviews = [];
    snap.forEach(d => reviews.push({ id: d.id, ...d.data() }));
    return reviews;
  }

  /* ── Đánh giá hiện có của user cho sản phẩm (null nếu chưa) ── */
  async function getMyRating(productId) {
    if (typeof db === 'undefined' || typeof auth === 'undefined' || !auth.isLoggedIn) return null;
    const uid = auth.getCurrentUser().id;
    const snap = await db.collection('products').doc(productId)
      .collection('reviews').where('userId', '==', uid).get();
    let mine = null;
    snap.forEach(d => { mine = { id: d.id, ...d.data() }; });
    return mine;
  }

  /* ── Ghi/cập nhật đánh giá + tính lại avg & count trên product ── */
  async function submitRating(productId, stars) {
    if (!requireLogin()) return null;
    stars = Math.min(5, Math.max(1, Math.round(Number(stars))));
    const user = auth.getCurrentUser();
    const productRef = db.collection('products').doc(productId);
    const reviewsRef = productRef.collection('reviews');

    // Review cũ của chính user này? Có thì ghi đè (sửa), không thì thêm mới
    const mineSnap = await reviewsRef.where('userId', '==', user.id).get();
    let oldRef = null;
    mineSnap.forEach(d => { oldRef = d.ref; });

    const data = {
      userId: user.id,
      userName: user.username || 'User',
      stars: stars,
      createdAt: new Date().toISOString()
    };
    await (oldRef ? oldRef.update(data) : reviewsRef.add(data));

    // Tính lại điểm trung bình + số lượt từ toàn bộ reviews
    const all = await reviewsRef.get();
    let sum = 0, count = 0;
    all.forEach(d => { sum += Number(d.data().stars) || 0; count++; });
    const avg = count ? +(sum / count).toFixed(1) : 0;
    await productRef.update({ rating: avg, ratingCount: count });
    return { average: avg, count: count };
  }

  /* ── Render danh sách reviews vào #reviewsList ── */
  async function renderList(productId) {
    const box = document.getElementById('reviewsList');
    if (!box) return;
    try {
      const reviews = await loadReviews(productId);
      if (!reviews.length) {
        box.innerHTML = '<div class="reviews-empty"><i class="far fa-comment-dots"></i> No reviews yet — be the first to rate this product!</div>';
        return;
      }
      box.innerHTML = reviews.map(r => {
        const d = new Date(r.createdAt);
        const dateTxt = Number.isNaN(d.valueOf()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) starsHtml += `<i class="${i <= r.stars ? 'fas' : 'far'} fa-star"></i>`;
        const isMine = (typeof auth !== 'undefined' && auth.isLoggedIn && auth.getCurrentUser().id === r.userId);
        return `<div class="review-card">
          <div class="review-head">
            <span class="review-name">${esc(r.userName)}${isMine ? ' <span style="color:#94a3b8;font-weight:400">(you)</span>' : ''}</span>
            <span class="review-stars">${starsHtml}</span>
          </div>
          ${dateTxt ? `<div class="review-date">${dateTxt}</div>` : ''}
        </div>`;
      }).join('');
    } catch (err) {
      console.error('ratings: load reviews failed', err);
      box.innerHTML = '<div class="reviews-empty">Could not load reviews.</div>';
    }
  }

  /* ── Gắn widget sao vào #starInput và nạp dữ liệu ── */
  async function mount(productId) {
    const wrap = document.getElementById('starInput');
    const msg = document.getElementById('ratingFeedback');
    if (!wrap || !productId || typeof db === 'undefined') return;

    wrap.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('i');
      star.className = 'far fa-star';
      star.dataset.star = i;
      wrap.appendChild(star);
    }
    const stars = wrap.querySelectorAll('i');
    const paint = upto => stars.forEach(s => s.classList.toggle('lit', Number(s.dataset.star) <= upto));

    // Hiển thị sẵn đánh giá cũ của user (nếu có)
    try {
      const mine = await getMyRating(productId);
      if (mine) {
        paint(mine.stars);
        if (msg) msg.textContent = `You rated this product ${mine.stars} star${mine.stars > 1 ? 's' : ''} — click to update.`;
      }
    } catch (_) { /* bỏ qua */ }

    stars.forEach(star => star.addEventListener('click', async () => {
      const val = Number(star.dataset.star);
      paint(val);
      if (msg) msg.textContent = '';
      try {
        const res = await submitRating(productId, val);
        if (res && msg) {
          msg.textContent = `Thanks! Your ${val}-star rating was saved.`;
          setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
        }
        // Cập nhật điểm TB ở header
        const sumEl = document.getElementById('ratingSummary');
        if (sumEl && res) sumEl.textContent = `${res.average.toFixed(1)} (${res.count} Reviews)`;
        await renderList(productId);   // nạp lại danh sách review
      } catch (err) {
        console.error('ratings: submit failed', err);
        if (msg) msg.textContent = 'Failed to save rating. Please try again.';
      }
    }));

    await renderList(productId);
  }

  window.Ratings = { mount, submitRating, getMyRating, loadReviews };
})();
