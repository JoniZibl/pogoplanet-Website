// PogoPlanet Mini-Game V5
// - 50% lower jump
// - Smooth rotation while holding mouse/space
// - Ground only, full width
// - Start Button implementation

(function () {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const restartBtn = document.getElementById('restartBtn');
    const startOverlay = document.getElementById('startOverlay');
    const startBtn = document.getElementById('startBtn');
    // --- ASSETS ---
    const jumperImg = new Image();
    jumperImg.src = 'assets/img/PogoMann.png';

    // --- GEOMETRY & RESIZING ---
    function resizeCanvas() {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial call

    // --- GAME CONSTANTS ---
    const GRAVITY = 950;         // Reduced slightly for more control
    const BOUNCE_STRENGTH = 600;   // Reduced height as requested (50% less than previous ~1000)
    const FRICTION = 0.99;        // Air friction
    const ROTATION_SPEED = 520;   // Degrees per second (fast but smooth)
    const PLAYER_WIDTH = 25;      // Physics hitbox width
    const PLAYER_HEIGHT = 60;     // Physics hitbox height
    const VISUAL_SCALE = 1.6;     // Image will be 60% larger than hitbox

    // --- GAME STATE ---
    let lastTime = 0;
    let isPlaying = false;
    let gameStarted = false;
    let isInputActive = false;

    const player = {
        x: 0,
        y: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        vx: 0,
        vy: 0,
        angle: 15, // Start tilted
        color: '#ebd263'
    };

    // --- INPUT HANDLING ---
    function startGame() {
        if (startOverlay) startOverlay.style.display = 'none';
        restartGame();
        gameStarted = true;
        isPlaying = true;

        // Hide overlay once started
        if (!lastTime) {
            requestAnimationFrame(gameLoop);
        }
    }

    function restartGame() {
        player.x = canvas.width / 2 - player.width / 2;
        player.y = 100;
        player.vx = 0;
        player.vy = 0;
        player.angle = 15;
        isPlaying = true;
    }

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (restartBtn) restartBtn.addEventListener('click', restartGame);

    // Mouse
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) isInputActive = true;
    });
    window.addEventListener('mouseup', () => isInputActive = false);

    // Touch
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isInputActive = true; }, { passive: false });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); isInputActive = false; }, { passive: false });

    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            isInputActive = true;
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') isInputActive = false;
    });

    // --- PHYSICS & LOGIC ---
    function toRadians(deg) {
        return deg * (Math.PI / 180);
    }

    function update(dt) {
        if (!isPlaying) return;
        if (dt > 0.05) dt = 0.05; // Safety cap

        // Smooth Rotation
        if (isInputActive) {
            player.angle += ROTATION_SPEED * dt;
        }

        // Apply Gravity
        player.vy += GRAVITY * dt;
        player.vx *= FRICTION;

        // Apply Movement
        player.x += player.vx * dt;
        player.y += player.vy * dt;

        // Ground Collision
        const groundLevel = canvas.height - 40;
        if (player.y + player.height > groundLevel) {
            if (player.vy > 0) {
                // Land precisely on top
                player.y = groundLevel - player.height;

                // --- HEAD COLLISION CHECK ---
                // Angle 0 = Up, 180 = Down. 
                // If cos(angle) < 0, the head is pointing downwards.
                const rad = toRadians(player.angle);
                if (Math.cos(rad) < 0) {
                    restartGame();
                    return;
                }

                // Bounce away from red tip (tip is bottom, head is top)
                player.vx = Math.sin(rad) * BOUNCE_STRENGTH;
                player.vy = -Math.cos(rad) * BOUNCE_STRENGTH;
            }
        }

        // Wall Respawn on Head Hit
        if (player.x <= 0 || player.x + player.width >= canvas.width) {
            const rad = toRadians(player.angle);
            // If leaning into the wall with head (horizontal check)
            // Left wall: angle -90ish. Right wall: angle 90ish.
            if (player.x <= 0 && Math.sin(rad) < -0.5) {
                restartGame();
                return;
            }
            if (player.x + player.width >= canvas.width && Math.sin(rad) > 0.5) {
                restartGame();
                return;
            }

            // Normal bounce if not head hit
            if (player.x <= 0) {
                player.x = 0;
                player.vx *= -0.5;
            } else {
                player.x = canvas.width - player.width;
                player.vx *= -0.5;
            }
        }

        // Safety Respawn
        if (player.y > canvas.height + 200) {
            restartGame();
        }
    }

    function draw() {
        // --- BACKGROUND DESIGN (Matches Header) ---
        // 1. Gradient Background
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#889868');
        grad.addColorStop(0.6, '#5F7A6A');
        grad.addColorStop(1, '#4a6358');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. The Sun
        const sunX = canvas.width * 0.1;
        const sunY = canvas.height * 0.2;
        const sunRadius = Math.min(canvas.width, canvas.height) * 0.08;

        // Sun Glow
        const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3);
        glow.addColorStop(0, 'rgba(235, 210, 99, 0.25)');
        glow.addColorStop(1, 'rgba(235, 210, 99, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Sun Body
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#daba5c';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw Ground
        const groundLevel = canvas.height - 40;
        ctx.fillStyle = '#16222E';
        ctx.fillRect(0, groundLevel, canvas.width, 40);
        ctx.fillStyle = '#3498db'; // Ground highlight
        ctx.fillRect(0, groundLevel, canvas.width, 2);

        if (!gameStarted) return;

        // Draw Player (Image) - NO DISTORTION
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(toRadians(player.angle));

        if (jumperImg.complete && jumperImg.naturalWidth > 0) {
            // Calculate aspect ratio
            const ratio = jumperImg.naturalWidth / jumperImg.naturalHeight;

            // Scaled dimensions (larger than hitbox)
            const drawHeight = player.height * VISUAL_SCALE;
            const drawWidth = drawHeight * ratio;

            ctx.drawImage(jumperImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        } else {
            // Fallback while loading
            ctx.fillStyle = player.color;
            ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        }

        ctx.restore();
    }

    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        update(dt);
        draw();

        requestAnimationFrame(gameLoop);
    }

    // Initialize with background draw
    resizeCanvas();
    draw();

})();
