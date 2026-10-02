// js/pages/contact.js - Trang lien he: FAQ, form, nut store
document.addEventListener('DOMContentLoaded', function () {
    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(function (question) {
        question.addEventListener('click', function () {
            var faqItem = question.parentElement;
            var isActive = faqItem.classList.contains('active');

            document.querySelectorAll('.faq-item').forEach(function (item) {
                item.classList.remove('active');
            });

            if (!isActive) faqItem.classList.add('active');
        });
    });

    // Form lien he
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var firstName = document.getElementById('firstName').value;
            var lastName = document.getElementById('lastName').value;
            var email = document.getElementById('email').value;
            var subject = document.getElementById('subject').value;
            var message = document.getElementById('message').value;

            if (!firstName || !lastName || !email || !subject || !message) {
                notify.error('Please fill in all required fields.');
                return;
            }

            var submitButton = this.querySelector('.contact-button');
            var originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitButton.disabled = true;

            setTimeout(function () {
                notify.success('Thank you for your message! We will respond within 24 hours.');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                contactForm.reset();
            }, 1500);
        });
    }

    // Nut store (huong dan / live chat)
    document.querySelectorAll('.store-button').forEach(function (button) {
        if (button.textContent.includes('Directions')) {
            button.addEventListener('click', function () {
                notify.info('Opening directions in Google Maps...');
            });
        } else if (button.textContent.includes('Chat')) {
            button.addEventListener('click', function () {
                var originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
                button.disabled = true;

                setTimeout(function () {
                    notify.info('Connecting you with a live agent...');
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 1500);
            });
        }
    });
});
