// Main JS

// Remove no-js class
document.documentElement.classList.replace('no-js', 'js');

// Footer Year
(function () {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();

// Sticky topbar
(function () {
    const topbar = document.querySelector('.hero .topbar');
    if (!topbar) return;
    const onScroll = () => topbar.classList.toggle('is-sticky', window.scrollY > 10);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();
})();

// Mobile Menu
(function () {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isActive = nav.classList.toggle('is-active');
        toggle.classList.toggle('is-active');
        toggle.setAttribute('aria-expanded', isActive);
        if (isActive) {
            document.body.style.overflow = 'hidden';
            nav.style.transform = 'translateX(0)';
        } else {
            document.body.style.overflow = '';
            nav.style.transform = '';
        }
    });

    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('is-active');
            toggle.classList.remove('is-active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            nav.style.transform = '';
        });
    });
})();
