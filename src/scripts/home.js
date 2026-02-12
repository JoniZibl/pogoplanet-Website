// Home Page Scripts

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = window.matchMedia('(pointer: coarse)').matches;

// Initial Particles System
(function () {
    if (prefersReduced) return;
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Configuration
    const particleCount = 40;
    const maxDistance = 150;
    const mouse = { x: null, y: null, radius: 100 };

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            // Movement
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Mouse interaction
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = forceDirectionX * force * 2; // Strength
                    const directionY = forceDirectionY * force * 2;
                    this.vx -= directionX;
                    this.vy -= directionY;
                }
            }
        }

        draw() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);

    // Track mouse over hero section only
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        hero.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });
    }

    init();
    animate();
})();

// Countdown (Release: +1 Monat)
(function () {
    const release = new Date();
    release.setMonth(release.getMonth() + 1);

    const elD = $('#d'), elH = $('#h'), elM = $('#m'), elS = $('#s');
    if (!elD || !elH || !elM || !elS) return;

    function tick() {
        const now = new Date();
        let diff = release.getTime() - now.getTime();
        if (diff < 0) diff = 0;

        const d = Math.floor(diff / 86400000); diff -= d * 86400000;
        const h = Math.floor(diff / 3600000); diff -= h * 3600000;
        const m = Math.floor(diff / 60000); diff -= m * 60000;
        const s = Math.floor(diff / 1000);

        elD.textContent = String(d).padStart(2, '0');
        elH.textContent = String(h).padStart(2, '0');
        elM.textContent = String(m).padStart(2, '0');
        elS.textContent = String(s).padStart(2, '0');
    }

    tick();
    setInterval(tick, 1000);
})();

// Planet assets
// Planet assets & Jumper Interaction
(function () {
    const planet = $('.planet'); if (!planet) return;
    const pimg = planet.querySelector('.planet-img');
    const jimg = planet.querySelector('.jumper-img');
    const hasSrc = img => img && img.getAttribute('src') && img.getAttribute('src').trim() !== '';
    if (hasSrc(pimg)) planet.classList.add('has-img');
    if (hasSrc(jimg)) planet.classList.add('has-jumper-img');

    // Spin on click
    if (jimg) {
        jimg.addEventListener('click', () => {
            if (jimg.classList.contains('is-spinning')) return;
            jimg.classList.add('is-spinning');
            jimg.addEventListener('animationend', () => {
                jimg.classList.remove('is-spinning');
            }, { once: true });
        });
    }
})();

// Tabs
(function () {
    const tabs = $$('#tabs [role="tab"]');
    const panels = tabs.map(b => document.getElementById('tab-' + b.dataset.tab));
    if (!tabs.length) return;

    function activate(btn) {
        tabs.forEach((b, i) => {
            const active = (b === btn);
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-selected', active ? 'true' : 'false');
            b.setAttribute('tabindex', active ? '0' : '-1');
            if (panels[i]) panels[i].hidden = !active;
        });
        btn?.focus({ preventScroll: true });
    }

    tabs.forEach((t, idx) => {
        t.addEventListener('click', () => activate(t));
        t.addEventListener('keydown', (e) => {
            const i = tabs.indexOf ? tabs.indexOf(document.activeElement) : idx;
            let next = null;
            if (e.key === 'ArrowRight') { e.preventDefault(); next = tabs[(i + 1) % tabs.length]; }
            if (e.key === 'ArrowLeft') { e.preventDefault(); next = tabs[(i - 1 + tabs.length) % tabs.length]; }
            if (e.key === 'Home') { e.preventDefault(); next = tabs[0]; }
            if (e.key === 'End') { e.preventDefault(); next = tabs[tabs.length - 1]; }
            if (next) activate(next);
        });
    });

    activate(tabs.find(b => b.classList.contains('is-active')) || tabs[0]);
})();

// Scroll FX
(function () {
    const $reveal = $$('.reveal');

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-in');
                    io.unobserve(e.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: .15 });
        $reveal.forEach(el => io.observe(el));
    } else {
        $reveal.forEach(el => el.classList.add('is-in'));
    }

    if (prefersReduced) return;

    const bands = $$('.band');
    let ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
            const vh = window.innerHeight;

            bands.forEach(b => {
                const r = b.getBoundingClientRect();
                const center = r.top + r.height / 2;
                const dist = Math.abs(center - vh / 2);
                const norm = Math.min(1, dist / (vh * 0.6));
                const blur = (1 - norm) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--blur-max'));

                b.querySelectorAll('.blur-scroll').forEach(el => el.style.setProperty('--blur', blur.toFixed(2) + 'px'));

                const py = (center - vh / 2) * 0.08;
                b.querySelectorAll('.parallax').forEach(el => el.style.setProperty('--py', (-py).toFixed(2)));
            });

            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
})();

// Hover Tilt
(function () {
    if (prefersReduced || isCoarse) return;
    const els = $$('.card, .shot');
    const MAX = 8;

    els.forEach(el => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const dx = (e.clientX - cx) / (r.width / 2);
            const dy = (e.clientY - cy) / (r.height / 2);
            el.style.setProperty('--ry', (dx * -MAX).toFixed(2) + 'deg');
            el.style.setProperty('--rx', (dy * MAX).toFixed(2) + 'deg');
        });

        el.addEventListener('pointerleave', () => {
            el.style.setProperty('--ry', '0deg');
            el.style.setProperty('--rx', '0deg');
        });
    });
})();

// Scroll progress bar
(function () {
    const bar = document.createElement('div');
    bar.className = 'scrollbar';
    document.body.append(bar);

    const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (100 * window.scrollY / Math.max(1, max)) + '%';
    };

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();
})();

// Magnetic hover + spotlight follow
(function () {
    if (prefersReduced || isCoarse) return;
    const MAX = 4;

    $$('.btn, .chip, .tab').forEach(el => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();

            const x = ((e.clientX - (r.left + r.width / 2)) / r.width) * MAX;
            const y = ((e.clientY - (r.top + r.height / 2)) / r.height) * MAX;
            el.style.setProperty('--mx', x.toFixed(2) + 'px');
            el.style.setProperty('--my', y.toFixed(2) + 'px');

            const px = ((e.clientX - r.left) / r.width) * 100;
            const py = ((e.clientY - r.top) / r.height) * 100;
            el.style.setProperty('--px', px.toFixed(1) + '%');
            el.style.setProperty('--py', py.toFixed(1) + '%');
        });

        el.addEventListener('pointerleave', () => {
            el.style.setProperty('--mx', '0px');
            el.style.setProperty('--my', '0px');
            el.style.setProperty('--px', '50%');
            el.style.setProperty('--py', '50%');
        });
    });
})();

// Hero pointer parallax (Updated to coexist with float)
(function () {
    if (prefersReduced || isCoarse) return;
    const hero = $('.hero'); if (!hero) return;
    const planet = hero.querySelector('.planet');
    const jumper = hero.querySelector('.jumper');

    hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;

        // Apply translation on top of the float animation
        // Note: CSS Animation 'float' uses transform. JS transform overrides it.
        // Solution: Wrap images in a div for float, or use CSS variables for parallax.
        // Better: Use CSS vars --p-x, --p-y in the CSS transform rule.

        if (planet) {
            planet.style.setProperty('--mx', (dx * 10).toFixed(2) + 'px');
            planet.style.setProperty('--my', (dy * 8).toFixed(2) + 'px');
        }
        if (jumper) {
            jumper.style.setProperty('--mx', (dx * 15).toFixed(2) + 'px');
            jumper.style.setProperty('--my', (dy * 12).toFixed(2) + 'px');
        }
    });

    hero.addEventListener('pointerleave', () => {
        if (planet) {
            planet.style.setProperty('--mx', '0px');
            planet.style.setProperty('--my', '0px');
        }
        if (jumper) {
            jumper.style.setProperty('--mx', '0px');
            jumper.style.setProperty('--my', '0px');
        }
    });
})();

// Spotlight in Features
(function () {
    if (isCoarse) return;
    const features = $('.features'); if (!features) return;

    features.addEventListener('pointermove', (e) => {
        const r = features.getBoundingClientRect();
        features.style.setProperty('--sx', (e.clientX - r.left) + 'px');
        features.style.setProperty('--sy', (e.clientY - r.top) + 'px');
    });

    features.addEventListener('pointerleave', () => {
        features.style.setProperty('--sx', '50%');
        features.style.setProperty('--sy', '50%');
    });
})();

// Hats marquee
(function () {
    const strip = document.querySelector('.hats-strip');
    if (!strip || prefersReduced) return;

    const baseCount = strip.children.length;
    if (!baseCount) return;

    const parentW = strip.parentElement ? strip.parentElement.clientWidth : 0;
    let i = 0;

    while (strip.scrollWidth < parentW * 2 && i < baseCount * 3) {
        strip.appendChild(strip.children[i % baseCount].cloneNode(true));
        i++;
    }
})();

// =========================
// Custom Media Player
// =========================
(function () {
    const video = document.getElementById('demoVideo');
    const player = document.querySelector('.media-player');
    const playBtn = document.getElementById('mediaPlay');
    const muteBtn = document.getElementById('mediaMute');
    const fsBtn = document.getElementById('mediaFullscreen');
    const seek = document.getElementById('mediaSeek');
    const volume = document.getElementById('mediaVolume');
    const currentEl = document.getElementById('mediaCurrent');
    const durationEl = document.getElementById('mediaDuration');

    if (!video || !player || !playBtn || !seek || !volume || !muteBtn || !fsBtn || !currentEl || !durationEl) return;

    let lastVolume = 0.5;

    // Start stumm
    video.muted = true;
    video.volume = 0;
    volume.value = 0;
    muteBtn.textContent = '🔇';
    muteBtn.setAttribute('aria-label', 'Stummschaltung aufheben');

    function formatTime(sec) {
        if (!isFinite(sec)) return '0:00';
        const s = Math.floor(sec % 60);
        const m = Math.floor(sec / 60);
        return m + ':' + String(s).padStart(2, '0');
    }

    function updatePlayState() {
        const playing = !video.paused && !video.ended;
        player.dataset.state = playing ? 'playing' : 'paused';
        playBtn.textContent = playing ? '❚❚' : '▶';
        playBtn.setAttribute('aria-label', playing ? 'Pausieren' : 'Abspielen');
    }

    // Autoplay versuchen
    function tryAutoplay() {
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => { });
    }

    window.addEventListener('load', tryAutoplay, { once: true });
    player.addEventListener('pointerdown', tryAutoplay, { once: true });

    // Play/Pause Button
    playBtn.addEventListener('click', () => {
        if (video.paused || video.ended) {
            video.play();
        } else {
            video.pause();
        }
    });

    // Zeit + Dauer
    video.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(video.duration);
    });

    let isSeeking = false;

    video.addEventListener('timeupdate', () => {
        if (!isSeeking) {
            currentEl.textContent = formatTime(video.currentTime);
            if (video.duration) {
                const percent = (video.currentTime / video.duration) * 100;
                seek.value = String(percent);
            }
        }
    });

    seek.addEventListener('pointerdown', () => { isSeeking = true; });
    seek.addEventListener('mousedown', () => { isSeeking = true; });

    seek.addEventListener('input', () => {
        if (!video.duration) return;
        const percent = Number(seek.value) / 100;
        const target = percent * video.duration;
        currentEl.textContent = formatTime(target);
    });

    function finishSeek() {
        if (!video.duration) return;
        const percent = Number(seek.value) / 100;
        video.currentTime = percent * video.duration;
        isSeeking = false;
    }

    seek.addEventListener('pointerup', finishSeek);
    seek.addEventListener('mouseup', finishSeek);
    seek.addEventListener('change', finishSeek);

    // Volume Slider
    volume.addEventListener('input', () => {
        const v = Number(volume.value) / 100;
        if (v > 0) lastVolume = v;

        video.volume = v;
        video.muted = (v === 0);

        muteBtn.textContent = (video.muted || v === 0) ? '🔇' : '🔈';
        muteBtn.setAttribute('aria-label', (video.muted || v === 0) ? 'Stummschaltung aufheben' : 'Stumm schalten');
    });

    // Mute Button
    muteBtn.addEventListener('click', () => {
        if (video.muted || video.volume === 0) {
            video.muted = false;
            video.volume = Math.max(0.05, lastVolume);
            volume.value = Math.round(video.volume * 100);
        } else {
            lastVolume = video.volume;
            video.muted = true;
            video.volume = 0;
            volume.value = 0;
        }

        muteBtn.textContent = (video.muted || video.volume === 0) ? '🔇' : '🔈';
        muteBtn.setAttribute('aria-label', (video.muted || video.volume === 0) ? 'Stummschaltung aufheben' : 'Stumm schalten');
    });

    // Fullscreen Helpers
    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function updateFsButton() {
        fsBtn.textContent = isFullscreen() ? '🡼' : '⛶';
    }

    fsBtn.addEventListener('click', () => {
        if (video.webkitEnterFullscreen && !document.fullscreenElement) {
            video.webkitEnterFullscreen();
            return;
        }

        const elem = player;
        if (!isFullscreen()) {
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', updateFsButton);
    document.addEventListener('webkitfullscreenchange', updateFsButton);

    // Sync Play/Pause
    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);
    video.addEventListener('ended', updatePlayState);

    // Keyboard Shortcuts
    player.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                if (video.paused || video.ended) video.play();
                else video.pause();
                break;
            case 'm':
                e.preventDefault();
                muteBtn.click();
                break;
            case 'ArrowRight':
                video.currentTime = Math.min((video.duration || 0), video.currentTime + 5);
                break;
            case 'ArrowLeft':
                video.currentTime = Math.max(0, video.currentTime - 5);
                break;
        }
    });

    updatePlayState();
    currentEl.textContent = '0:00';
    durationEl.textContent = '0:00';
})();
