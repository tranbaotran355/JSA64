// js/pages/main-hero.js - Slide Hero + Navbar (tham khảo new_hero)
// Chỉ chạy trên trang chủ (có .hero) khi GSAP đã được nạp xong.
// Nếu GSAP không tải được, trang vẫn hiển thị bình thường (slide đầu tiên).
(function () {
    'use strict';

    if (typeof window.gsap === 'undefined') return;
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;

    /* =========================================================
       NAVBAR — kết hợp hiệu ứng giữa final + new_hero
       (header trắng sticky + underline gradient + scroll state)
       ========================================================= */
    function initNavbar() {
        var bar = document.querySelector('#site-header, header');

        if (bar && !reduced) {
            gsap.from(bar, { y: -60, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.1 });
        }

        var updateScroll = function () {
            var y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            var scrolled = y > 8;
            document.querySelectorAll('#site-header, header').forEach(function (el) {
                el.classList.toggle('header-scrolled', scrolled);
            });
        };

        /* Scroll có thể diễn ra trên body (do overflow-x:hidden ở html/body),
           nên lắng nghe cả window lẫn document để chắc chắn bắt được. */
        window.addEventListener('scroll', updateScroll, { passive: true });
        document.addEventListener('scroll', updateScroll, { capture: true, passive: true });
        updateScroll();
    }

    /* =========================================================
       SLIDE HERO — crossfade + entrance + autoplay + backdrop
       ========================================================= */
    var AUTOPLAY_DELAY = 5;
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var total = slides.length;
    var sliderEl = document.querySelector('.hero-slider');
    var dotsRoot = document.getElementById('heroDots');
    var counterCur = document.getElementById('heroCounterCurrent');
    var counterTotal = document.getElementById('heroCounterTotal');
    var counterFill = document.getElementById('heroCounterFill');
    var prevBtn = document.getElementById('heroPrev');
    var nextBtn = document.getElementById('heroNext');

    var current = 0;
    var busy = false;
    var autoTl = null;

    /* ---------- cố định chiều cao slider = slide cao nhất ---------- */
    function lockHeroHeight() {
        if (reduced || !sliderEl || !total) return;
        var max = 0;
        slides.forEach(function (s) {
            max = Math.max(max, s.offsetHeight);
        });
        if (!max) return;
        sliderEl.style.height = max + 'px';
        sliderEl.classList.add('hero-locked');
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
        if (reduced) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(lockHeroHeight, 200);
    });
    window.addEventListener('load', lockHeroHeight);

    if (total) counterTotal.textContent = String(total).padStart(2, '0');

    /* ---------- split tiêu đề thành từ ---------- */
    function splitWords(el) {
        if (!el) return [];
        var words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        for (var i = 0; i < words.length; i++) {
            var span = document.createElement('span');
            span.className = 'hero-word';
            if (i < words.length - 1) span.style.marginRight = '0.28em';
            span.textContent = words[i];
            el.appendChild(span);
        }
        return el.querySelectorAll('.hero-word');
    }

    slides.forEach(function (s) {
        splitWords(s.querySelector('.hero-text h1'));
    });

    /* ---------- backdrop (ảnh slide hiện tại, blur làm màu nền) ---------- */
    var backdropRoot = hero.querySelector('.hero-backdrop');
    var backdropImgs = slides.map(function (s) {
        var src = s.querySelector('.hero-image img').getAttribute('src');
        var im = document.createElement('img');
        im.src = src;
        im.alt = '';
        im.draggable = false;
        backdropRoot.appendChild(im);
        return im;
    });
    var bCurrent = 0;

    function setBackdrop(next) {
        if (!backdropImgs.length || next === bCurrent) return;
        var out = backdropImgs[bCurrent];
        var inn = backdropImgs[next];
        bCurrent = next;

        gsap.set(inn, { opacity: 0, scale: 1.25 });
        inn.classList.add('is-active');
        gsap.to(inn, { opacity: 0.88, scale: 1.05, duration: 1.1, ease: 'power2.out' }, 0);
        gsap.to(out, {
            opacity: 0,
            scale: 1.4,
            duration: 0.9,
            ease: 'power2.out',
            onComplete: function () { out.classList.remove('is-active'); }
        }, 0);
    }

    /* ---------- entrance của 1 slide ---------- */
    function entrance(i) {
        var s = slides[i];
        var words = s.querySelectorAll('.hero-word');
        var desc = s.querySelector('.hero-desc');
        var buttons = s.querySelector('.hero-buttons');
        var image = s.querySelector('.hero-image');

        if (reduced) {
            gsap.set([words, desc, buttons, image], { clearProps: 'all' });
            return null;
        }

        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(words,
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05 }, 0.05)
            .fromTo(desc,
                { opacity: 0, y: 18, filter: 'blur(8px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7 }, 0.45)
            .fromTo(buttons,
                { opacity: 0, y: 26 },
                { opacity: 1, y: 0, duration: 0.6 }, 0.65)
            .fromTo(image,
                { opacity: 0, scale: 1.1, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 0.85, ease: 'power4.out' }, 0.15);
        return tl;
    }

    /* ---------- điều hướng ---------- */
    function updateDots() {
        var dots = dotsRoot.children;
        for (var i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('is-active', i === current);
        }
    }

    function updateCounter() {
        if (reduced || !counterCur) return;
        gsap.timeline()
            .to(counterCur, { y: -14, opacity: 0, duration: 0.22, ease: 'power2.in' })
            .add(function () {
                counterCur.textContent = String(current + 1).padStart(2, '0');
            })
            .to(counterCur, { y: 0, opacity: 1, duration: 0.32, ease: 'power2.out' });
    }

    function goTo(next, dir) {
        if (busy || total <= 1) return;
        next = (next + total) % total;
        if (next === current) return;

        busy = true;
        stopAutoplay();

        var outSlide = slides[current];
        var inSlide = slides[next];

        outSlide.classList.remove('is-active');
        inSlide.classList.add('is-active');

        var tin = entrance(next);
        if (tin) tin.play(0);

        setBackdrop(next);

        gsap.set(counterFill, { scaleX: 0 });

        current = next;
        updateDots();
        updateCounter();

        gsap.delayedCall(0.8, function () {
            setupParallax();
            busy = false;
            startAutoplay();
        });
    }

    /* ---------- autoplay ---------- */
    function startAutoplay() {
        if (total <= 1 || reduced) return;
        stopAutoplay();
        autoTl = gsap.timeline({ onComplete: function () { goTo(current + 1, 1); } });
        autoTl.fromTo(counterFill, { scaleX: 0 }, { scaleX: 1, duration: AUTOPLAY_DELAY, ease: 'none' });
    }

    function stopAutoplay() {
        if (autoTl) { autoTl.kill(); autoTl = null; }
    }

    hero.addEventListener('mouseenter', function () { if (autoTl) autoTl.pause(); });
    hero.addEventListener('mouseleave', function () { if (autoTl && !busy && !reduced) autoTl.resume(); });

    /* ---------- controls ---------- */
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1, 1); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1, -1); });

    window.addEventListener('keydown', function (e) {
        var tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (reduced) return;
        if (e.key === 'ArrowRight') goTo(current + 1, 1);
        if (e.key === 'ArrowLeft') goTo(current - 1, -1);
    });

    var touchX = 0;
    hero.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) {
            if (dx < 0) goTo(current + 1, 1);
            else goTo(current - 1, -1);
        }
    }, { passive: true });

    /* ---------- parallax chuột cho ảnh slide active ---------- */
    var imgQ = null;

    function setupParallax() {
        var img = slides[current].querySelector('.hero-image');
        if (!img) return;
        imgQ = {
            x: gsap.quickTo(img, 'x', { duration: 1.1, ease: 'power3.out' }),
            y: gsap.quickTo(img, 'y', { duration: 1.1, ease: 'power3.out' })
        };
    }

    if (!isTouch && !reduced) {
        hero.addEventListener('pointermove', function (e) {
            if (!imgQ || busy) return;
            var r = hero.getBoundingClientRect();
            var nx = (e.clientX - r.left) / r.width - 0.5;
            var ny = (e.clientY - r.top) / r.height - 0.5;
            imgQ.x(-nx * 16);
            imgQ.y(-ny * 12);
        });
    }

    /* ---------- boot ---------- */
    function init() {
        initNavbar();
        lockHeroHeight();

        if (!total) return;

        /* dots */
        slides.forEach(function (_, i) {
            var b = document.createElement('button');
            b.className = 'hero-dot' + (i === 0 ? ' is-active' : '');
            b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            b.addEventListener('click', function () { goTo(i); });
            dotsRoot.appendChild(b);
        });

        /* backdrop slide đầu */
        backdropImgs[0].classList.add('is-active');
        if (!reduced) {
            gsap.fromTo(backdropImgs[0],
                { opacity: 0, scale: 1.4 },
                { opacity: 0.88, scale: 1.05, duration: 2.2, ease: 'power2.out', delay: 0.15 });
        } else {
            gsap.set(backdropImgs[0], { opacity: 0.8, scale: 1.05 });
        }

        gsap.delayedCall(0.8, function () {
            setupParallax();
            busy = false;
            startAutoplay();
        });

        var e0 = entrance(0);
        gsap.delayedCall(0.05, function () { if (e0) e0.play(0); });

        if (counterCur) counterCur.textContent = '01';
        startAutoplay();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();