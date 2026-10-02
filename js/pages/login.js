// js/pages/login.js - Dang nhap / Dang ky
// Premium asymmetric auth UI wiring on top of real Firebase auth (auth.*).
// Field errors are shown inline (no alert/prompt).

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // Check if already logged in
    if (typeof auth !== 'undefined' && auth.checkAuth()) {
        window.location.href = 'main.html';
        return;
    }

    // Initialise cart icon
    if (typeof cartManager !== 'undefined') {
        cartManager.updateCartIcon();
    }

    /* ────────────────────────────────────────────────────────────────────────
       LOGIN <-> REGISTER SPATIAL TRANSITION
       ──────────────────────────────────────────────────────────────────────── */
    var shell = document.getElementById('authShell');
    var loginTab = document.getElementById('loginTab');
    var registerTab = document.getElementById('registerTab');
    var mode = 'login';
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function switchMode(next) {
        if (next === mode) return;
        mode = next;

        shell.classList.toggle('is-register', next === 'register');

        var showTab = next === 'register' ? registerTab : loginTab;
        var hideTab = next === 'register' ? loginTab : registerTab;
        showTab.setAttribute('aria-hidden', 'false');
        hideTab.setAttribute('aria-hidden', 'true');

        window.setTimeout(function () {
            var first = showTab.querySelector('input');
            if (first) first.focus();
        }, reducedMotion ? 0 : 650);
    }

    document.querySelectorAll('[data-switch]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = btn.getAttribute('data-switch');
            if (target === 'register' && window.history.replaceState) {
                window.history.replaceState(null, '', 'login.html#register');
            }
            switchMode(target);
        });
    });

    // Support login.html#register (open the register tab on load)
    if (window.location.hash === '#register' && registerTab) {
        switchMode('register');
    }

    /* ────────────────────────────────────────────────────────────────────────
       PASSWORD SHOW / HIDE TOGGLE
       ──────────────────────────────────────────────────────────────────────── */
    function bindToggle(btn) {
        btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-toggle');
            var input = document.getElementById(id);
            if (!input) return;
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            var icon = btn.querySelector('i');
            if (icon) icon.className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
            btn.classList.toggle('shown', show);
            btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        });
    }
    document.querySelectorAll('[data-toggle]').forEach(bindToggle);

    /* ────────────────────────────────────────────────────────────────────────
       VALIDATION HELPERS (inline errors, no alert)
       ──────────────────────────────────────────────────────────────────────── */
    function fieldWrap(input) { return input.closest('.field'); }

    function setError(input, message) {
        var wrap = fieldWrap(input), err = wrap.querySelector('.field-error');
        input.classList.remove('is-success');
        input.classList.add('is-error');
        if (err) { err.textContent = message || ''; err.classList.toggle('show', Boolean(message)); }
        return !message;
    }
    function setSuccess(input) {
        var wrap = fieldWrap(input), err = wrap.querySelector('.field-error');
        input.classList.remove('is-error');
        input.classList.add('is-success');
        if (err) err.classList.remove('show');
    }
    function clearState(input) {
        var wrap = fieldWrap(input), err = wrap.querySelector('.field-error');
        input.classList.remove('is-error', 'is-success');
        if (err) err.classList.remove('show');
    }
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Live-clear errors as the user types
    document.querySelectorAll('.field-input').forEach(function (input) {
        input.addEventListener('input', function () { clearState(input); });
    });

    /* ────────────────────────────────────────────────────────────────────────
       BUTTON LOADING STATE + SUCCESS TRANSITION
       ──────────────────────────────────────────────────────────────────────── */
    function setLoading(btn, loading) {
        if (!btn) return;
        btn.classList.toggle('is-loading', loading);
        btn.disabled = loading;
    }

    function goTo(url) {
        window.location.href = url;
    }

    function runSuccessTransition(onDone) {
        // Reuse a tiny inline success overlay for a polished navigation fade.
        var overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;z-index:1000;display:grid;place-items:center;' +
            'background:linear-gradient(160deg,#0F2854,#1C4D8D 55%,#4988C4);' +
            'opacity:0;transition:opacity .55s cubic-bezier(0.22,1,0.36,1);';
        overlay.innerHTML =
            '<div style="text-align:center;color:#fff">' +
            '<div id="succ-check" style="width:88px;height:88px;border-radius:50%;margin:0 auto;' +
            'background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.5);display:grid;' +
            'place-items:center;font-size:38px;transform:scale(.5);opacity:0;' +
            'transition:transform .6s cubic-bezier(0.22,1,0.36,1),opacity .4s">' +
            '<i class="fas fa-check"></i></div>' +
            '<div style="margin-top:20px;font-weight:700;font-size:1.3rem;font-family:Inter,sans-serif">You\'re all set!</div>' +
            '</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(function () {
            overlay.style.opacity = '1';
            var check = overlay.querySelector('#succ-check');
            if (check) { check.style.transform = 'scale(1)'; check.style.opacity = '1'; }
        });
        window.setTimeout(function () {
            onDone();
        }, reducedMotion ? 300 : 1200);
    }

    var banAlert = document.getElementById('loginBanAlert');
    var banAlertText = document.getElementById('loginBanAlertText');

    function showBanNotice(message) {
        if (!banAlert || !banAlertText) return;
        banAlertText.textContent = message;
        banAlert.hidden = false;
    }

    function hideBanNotice() {
        if (banAlert) {
            banAlert.hidden = true;
        }
    }

    var pendingBanMessage = '';
    try {
        pendingBanMessage = sessionStorage.getItem('techsphere_ban_notice') || '';
        sessionStorage.removeItem('techsphere_ban_notice');
    } catch (_) { }

    if (pendingBanMessage) {
        showBanNotice(pendingBanMessage);
    }

    /* ────────────────────────────────────────────────────────────────────────
       LOGIN FORM
       ──────────────────────────────────────────────────────────────────────── */
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            var emailInput = document.getElementById('loginEmail');
            var passInput = document.getElementById('loginPassword');
            var btn = document.getElementById('loginBtn');

            var email = emailInput.value.trim();
            var password = passInput.value;
            var ok = true;

            if (!email) ok = setError(emailInput, 'Email is required.') && ok;
            else if (!EMAIL_RE.test(email)) ok = setError(emailInput, 'Please enter a valid email address.') && ok;
            else setSuccess(emailInput);

            if (!password) ok = setError(passInput, 'Password is required.') && ok;
            else setSuccess(passInput);

            if (!ok) return;

            setLoading(btn, true);

            // ── AUTH API: Firebase login ──
            var result = await auth.login(email, password);
            setLoading(btn, false);

            if (result.success) {
                if (typeof notify !== 'undefined') {
                    notify.success('Welcome back, ' + (result.user && result.user.username ? result.user.username : '') + '!');
                }
                var redirectTo = sessionStorage.getItem('redirectAfterLogin') || 'main.html';
                sessionStorage.removeItem('redirectAfterLogin');
                runSuccessTransition(function () { goTo(redirectTo); });
            } else if (result.banned) {
                showBanNotice(result.message);
                clearState(emailInput);
                clearState(passInput);
            } else {
                hideBanNotice();
                setError(emailInput, result.message || 'Login failed. Please try again.');
                setError(passInput, 'Invalid email or password.');
            }
        });
    }

    /* ────────────────────────────────────────────────────────────────────────
       REGISTER FORM (rules kept from previous implementation)
       ──────────────────────────────────────────────────────────────────────── */
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            var nameInput = document.getElementById('registerName');
            var emailInput = document.getElementById('registerEmail');
            var passInput = document.getElementById('registerPassword');
            var confirmInput = document.getElementById('confirmPassword');
            var termsInput = document.getElementById('registerTerms');
            var btn = document.getElementById('registerBtn');

            var name = nameInput.value.trim();
            var email = emailInput.value.trim();
            var password = passInput.value;
            var confirm = confirmInput.value;
            var ok = true;

            // Full name
            if (!name) ok = setError(nameInput, 'Please enter your full name.') && ok;
            else setSuccess(nameInput);

            // Email
            if (!email) ok = setError(emailInput, 'Email is required.') && ok;
            else if (!EMAIL_RE.test(email)) ok = setError(emailInput, 'Please enter a valid email address.') && ok;
            else setSuccess(emailInput);

            // Password: >=8 chars, letters+numbers, special char
            if (!password) ok = setError(passInput, 'Please choose a password.') && ok;
            else if (password.length < 8) ok = setError(passInput, 'Password must be at least 8 characters long.') && ok;
            else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) ok = setError(passInput, 'Password must contain both letters and numbers.') && ok;
            else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) ok = setError(passInput, 'Password must include a special character.') && ok;
            else setSuccess(passInput);

            // Confirm
            if (!confirm) ok = setError(confirmInput, 'Please confirm your password.') && ok;
            else if (confirm !== password) ok = setError(confirmInput, 'Passwords do not match.') && ok;
            else setSuccess(confirmInput);

            // Terms
            var termsErr = termsInput.closest('.field').querySelector('.field-error');
            if (!termsInput.checked) {
                ok = false;
                termsErr.textContent = 'You must agree to the Terms of Service.';
                termsErr.classList.add('show');
            } else {
                termsErr.classList.remove('show');
            }

            if (!ok) return;

            setLoading(btn, true);

            // ── AUTH API: Firebase register ──
            var result = await auth.register({ username: name, email: email, password: password });
            setLoading(btn, false);

            if (result.success) {
                if (typeof notify !== 'undefined') {
                    notify.success('Account created successfully! Welcome, ' + name + '!');
                }
                runSuccessTransition(function () { goTo('main.html'); });
            } else {
                setError(emailInput, result.message || 'Registration failed. Please try again.');
            }
        });
    }

    /* ────────────────────────────────────────────────────────────────────────
       SOCIAL BUTTONS (placeholder for OAuth)
       ──────────────────────────────────────────────────────────────────────── */
    document.querySelectorAll('[data-social]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof notify !== 'undefined') {
                notify.info('Social login would be implemented with OAuth in production');
            }
        });
    });

    /* ────────────────────────────────────────────────────────────────────────
       FORGOT PASSWORD — inline modal (replaces prompt)
       ──────────────────────────────────────────────────────────────────────── */
    var forgotModal = document.getElementById('forgotModal');
    if (forgotModal) {
        var forgotLink = document.getElementById('forgotLink');
        var resetEmail = document.getElementById('resetEmail');
        var resetBtn = document.getElementById('resetBtn');

        function openModal() {
            resetEmail.value = (document.getElementById('loginEmail') || {}).value || '';
            clearState(resetEmail);
            forgotModal.classList.add('open');
            forgotModal.setAttribute('aria-hidden', 'false');
            window.setTimeout(function () { resetEmail.focus(); }, 60);
        }
        function closeModal() {
            forgotModal.classList.remove('open');
            forgotModal.setAttribute('aria-hidden', 'true');
        }

        if (forgotLink) forgotLink.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
        forgotModal.querySelectorAll('[data-close-modal]').forEach(function (el) {
            el.addEventListener('click', closeModal);
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

        resetBtn.addEventListener('click', function () {
            var email = resetEmail.value.trim();
            var errEl = forgotModal.querySelector('[data-error-for="resetEmail"]');
            clearState(resetEmail);
            if (!email || !EMAIL_RE.test(email)) {
                setError(resetEmail, 'Please enter a valid email address.');
                return;
            }
            setLoading(resetBtn, true);
            // Simulate send (real password-reset would go to Firebase sendPasswordResetEmail here)
            window.setTimeout(function () {
                setLoading(resetBtn, false);
                closeModal();
                if (typeof notify !== 'undefined') {
                    notify.success('Reset instructions sent to ' + email + '!');
                }
            }, 800);
        });
    }

    /* ────────────────────────────────────────────────────────────────────────
       NEWSLETTER FORM (footer) — kept from previous page behaviour
       ──────────────────────────────────────────────────────────────────────── */
    var newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var button = this.querySelector('button');
            var input = this.querySelector('input');
            if (!input.value || !EMAIL_RE.test(input.value.trim())) {
                if (typeof notify !== 'undefined') notify.error('Please enter a valid email address!');
                return;
            }
            var originalText = button.textContent;
            button.textContent = 'Subscribed!';
            button.style.backgroundColor = '#10b981';
            if (typeof notify !== 'undefined') notify.success('Thanks for subscribing!');

            setTimeout(function () {
                button.textContent = originalText;
                button.style.backgroundColor = '';
                input.value = '';
            }, 2000);
        });
    }
});
