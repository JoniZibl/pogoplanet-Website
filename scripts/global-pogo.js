// Website-wide Global Pogo Mode Logic
(function () {
    const container = document.getElementById('global-pogo-container');
    const canvas = document.getElementById('global-pogo-canvas');
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    const exitBtn = document.getElementById('exit-pogo-mode');
    const bounceCountEl = document.getElementById('global-bounces');

    // --- ASSETS ---
    const jumperImg = new Image();
    jumperImg.src = 'assets/img/PogoMann.png';
    const jumperImg2 = new Image();
    jumperImg2.src = 'assets/img/PogoMann_2.png';

    // --- CONFIG ---
    const GRAVITY = 950;          // Floatier (was 950)
    const BOUNCE_STRENGTH = 700;  // Lower Bounces (was 880)
    const FRICTION = 0.995;       // Less Air Resistance
    const ROTATION_ACCEL = 13000;  // Torque Force (Slower spin up)
    const ROTATION_DRAG = 0.72;   // Angular Drag (Stops spinning faster)
    const PLAYER_WIDTH = 32;
    const PLAYER_HEIGHT = 80;
    const VISUAL_SCALE = 1.8;

    // --- STATE ---
    let isRunning = false;
    let lastTime = 0;
    let isInputActive = false;
    let distance = 0;
    let lastBounceTime = 0;
    let cameraX = 0;
    let obstacles = [];

    // --- DECORATION (Trees) ---
    let trees = [];
    const treeColors = ['#246D55', '#288163', '#2C9673', '#266f57', '#438b73', '#487f65'];

    // --- DECORATION (Floating Images) ---
    let floaters = [];
    const floaterUrls = [
        'assets/minigame_images/RandomPic_2.png',
        'assets/minigame_images/RandomPic_3.png',
        'assets/minigame_images/RandomPic_4.png',
        'assets/minigame_images/RandomPic_5.png',
        'assets/minigame_images/RandomPic_1.png'
    ];
    let loadedFloaters = [];
    // Preload
    floaterUrls.forEach(url => {
        const img = new Image();
        img.src = url;
        loadedFloaters.push(img);
    });

    // --- DECORATION (Floor Items) ---
    let floorItems = [];
    // TODO: Add your image paths here. I'm using a placeholder for now.
    const floorImageUrls = [
        'assets/floor_images/floor_1.png',
        'assets/floor_images/floor_2.png',
        'assets/floor_images/floor_3.png',
        'assets/floor_images/floor_4.png',
        'assets/floor_images/floor_5.png',
        'assets/floor_images/floor_6.png',
        'assets/floor_images/floor_7.png',
        'assets/floor_images/floor_8.png',
        'assets/floor_images/floor_9.png',
        'assets/floor_images/floor_10.png',
    ];
    let loadedFloorImages = [];
    floorImageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
        loadedFloorImages.push(img);
    });

    let lastSpawnX = 0;
    let speedMultiplier = 1;
    let initialX = 0;

    // Track last spawned indices to avoid repetition
    let lastFloaterIndex = -1;
    let lastFloorItemIndex = -1;

    function getRandomIndex(length, lastIndex) {
        if (length <= 1) return 0;
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * length);
        } while (newIndex === lastIndex);
        return newIndex;
    }

    // --- STATE ---
    let players = [];

    function createPlayer(x, y, index) {
        return {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            av: 0,
            angle: 0,
            isInputActive: false,
            id: Math.random(), // Unique ID
            playerIndex: index || 0 // 0 for P1, 1 for P2
        };
    }


    // --- PLATFORM DISCOVERY ---
    function getPlatforms() {
        const platforms = [];
        // The ground in the header - now infinite, so we just return a "floor" rect relative to camera
        const header = document.querySelector('header.hero');
        const headerRect = header ? header.getBoundingClientRect() : { top: 0, bottom: 600, left: 0, right: window.innerWidth };

        // Infinite floor rect
        platforms.push({
            left: cameraX - window.innerWidth, // Huge buffer
            right: cameraX + window.innerWidth * 2,
            top: headerRect.bottom - 48,
            bottom: headerRect.bottom,
            width: window.innerWidth * 3,
            height: 48,
            isCircle: false,
            isGround: true
        });

        // Add procedural obstacles (Blocks)
        obstacles.forEach(obs => {
            platforms.push({
                left: obs.x,
                right: obs.x + obs.w,
                top: obs.y,
                bottom: obs.y + obs.h,
                width: obs.w,
                height: obs.h,
                isCircle: false,
                isBlock: true
            });
        });

        return platforms;
    }

    // --- PROCEDURAL GENERATION ---
    function updateWorld(dt) {
        // Use the "leader" (furthest right player) for generation logic
        if (players.length === 0) return;
        const leader = players.reduce((prev, current) => (prev.x > current.x) ? prev : current);

        // Difficulty scaling (based on distance in meters)
        // const distMeters = Math.max(0, Math.floor((leader.x - initialX) / 50));
        // speedMultiplier = 1 + (distMeters * 0.01);

        // --- SPAWNING ---

        // Ensure lastSpawnX moves ahead of leader.
        if (leader.x + window.innerWidth > lastSpawnX) {

            const header = document.querySelector('header.hero');
            const headerRect = header ? header.getBoundingClientRect() : { bottom: 600 };
            const groundY = headerRect.bottom - 48; // Ground top

            // 40% Chance for a Floating Image
            if (Math.random() < 0.4 && loadedFloaters.length > 0) {
                const idx = getRandomIndex(loadedFloaters.length, lastFloaterIndex);
                lastFloaterIndex = idx;
                const img = loadedFloaters[idx];

                // Calculate size while preserving aspect ratio
                // Max height 400px, Min height 300px (User Request)
                const targetHeight = 300 + Math.random() * 100;
                const ratio = img.naturalWidth / img.naturalHeight;
                const w = targetHeight * ratio;
                const h = targetHeight;

                // Ensure it spawns well above key ground level (Float)
                // groundY is the top of the ground.
                // yPos is the top of the image.
                // We want: yPos + h < groundY - buffer (e.g. 100px)
                const buffer = 150 + Math.random() * 200;
                const yPos = groundY - h - buffer;

                floaters.push({
                    x: leader.x + window.innerWidth + 50,
                    y: yPos,
                    w: w,
                    h: h,
                    img: img
                });

                // Large gap after an image
                // Ensure lastSpawnX accounts for the width (w) of the image so the next item doesn't overlap it.
                lastSpawnX = leader.x + window.innerWidth + w + 300 + Math.random() * 300;

            } else {
                // 40% Chance for a Floor Item (if we have images), otherwise Tree
                let spawnedFloorItem = false;

                if (Math.random() < 0.4 && loadedFloorImages.length > 0) {
                    const idx = getRandomIndex(loadedFloorImages.length, lastFloorItemIndex);
                    lastFloorItemIndex = idx;
                    const img = loadedFloorImages[idx];

                    // CHECK IF LOADED: Use natural size (NO SCALING)
                    if (img.complete && img.naturalWidth > 0) {
                        const w = img.naturalWidth;
                        const h = img.naturalHeight;

                        // Spawn flush with ground
                        // groundY is the top of the floor
                        const yPos = groundY - h;

                        floorItems.push({
                            x: leader.x + window.innerWidth + 50,
                            y: yPos,
                            w: w,
                            h: h,
                            img: img
                        });

                        lastSpawnX = leader.x + window.innerWidth + w + 100 + Math.random() * 200;
                        spawnedFloorItem = true;
                    }
                }

                // Fallback: If we didn't spawn a floor item (chance or not loaded), spawn a Tree
                if (!spawnedFloorItem) {
                    // Spawn a tree
                    const treeWidth = 40 + Math.random() * 60; // 40-100px
                    const treeHeight = 80 + Math.random() * 120; // 80-200px
                    const color = treeColors[Math.floor(Math.random() * treeColors.length)];

                    trees.push({
                        x: leader.x + window.innerWidth + 50, // Slightly offscreen
                        y: groundY,
                        w: treeWidth,
                        h: treeHeight,
                        color: color
                    });

                    // Calculate NEXT spawn distance
                    const isCluster = Math.random() < 0.6;
                    const gap = isCluster
                        ? 40 + Math.random() * 110   // Short gap (Cluster)
                        : 400 + Math.random() * 600; // Long gap (Clearing)

                    lastSpawnX = leader.x + window.innerWidth + gap;
                }
            }
        }

        // Cleanup Trees & Floaters & Floor Items
        // Use leader position for cleanup threshold
        const cleanupThresh = leader.x - window.innerWidth;
        trees = trees.filter(t => t.x + t.w > cleanupThresh);
        floaters = floaters.filter(f => f.x + f.w > cleanupThresh);
        floorItems = floorItems.filter(f => f.x + f.w > cleanupThresh);

        // Cleanup Obstacles (Legacy)
        obstacles = obstacles.filter(obs => obs.x + obs.w > cleanupThresh);
    }

    // --- LIFECYCLE ---
    function activate() {
        if (isRunning) return;
        isRunning = true;
        lastTime = 0;
        container.style.display = 'block';
        document.body.classList.add('pogo-mode-active');
        resize();
        resetPlayer();
        updateHUD();
        requestAnimationFrame(loop);

        document.body.style.pointerEvents = 'auto';
        document.body.style.pointerEvents = 'auto';
        speedMultiplier = 1;

        // Clear trees/floaters on start
        trees = [];
        floaters = [];
        floorItems = [];
        floorItems = [];
        lastSpawnX = -1000;
        lastFloaterIndex = -1;
        lastFloorItemIndex = -1;
    }

    function deactivate() {
        isRunning = false;
        container.style.display = 'none';
        document.body.classList.remove('pogo-mode-active');

        // Reset camera and scroll to top
        cameraX = 0;
        const header = document.querySelector('header.hero');
        if (header) {
            header.style.setProperty('--camera-x', '0px');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Reset translation of header content
        const headerContent = document.querySelectorAll('header.hero > :not(#global-pogo-container):not(.header-ground)');
        headerContent.forEach(el => el.style.transform = '');
    }

    function resetPlayer() {
        // Full Game Reset
        cameraX = 0;
        obstacles = [];
        trees = [];
        floaters = [];
        floorItems = [];
        speedMultiplier = 1;

        // Reset to just Player 1
        players = [];

        const originalJumper = document.querySelector('.jumper-img');
        let startX, startY;

        if (originalJumper) {
            const rect = originalJumper.getBoundingClientRect();
            if (rect.width > 0) {
                startX = rect.left + (rect.width / 2) - (PLAYER_WIDTH / 2);
                startY = rect.top + (rect.height / 2) - (PLAYER_HEIGHT / 2);
            } else {
                startX = window.innerWidth / 2;
                startY = 100;
            }
        } else {
            startX = window.innerWidth / 2;
            startY = 100;
        }

        // Create Player 1
        players.push(createPlayer(startX, startY, 0));

        initialX = startX;
        lastSpawnX = startX;

        // Sync header position
        const header = document.querySelector('header.hero');
        if (header) {
            header.style.setProperty('--camera-x', '0px');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // --- INPUT ---
    // --- INPUT ---
    window.addEventListener('mousedown', (e) => {
        if (!isRunning || e.button !== 0) return;
        if (e.target.closest('button, a, input, [role="button"]')) return;
        // Mouse controls Player 1 (players[0])
        if (players[0]) {
            players[0].isInputActive = true;
        }
    });

    window.addEventListener('mouseup', () => {
        if (players[0]) {
            players[0].isInputActive = false;
        }
    });

    window.addEventListener('keydown', (e) => {
        // Space Controls Player 2 (players[1])
        if (e.code === 'Space' && isRunning) {
            e.preventDefault();

            // If P2 doesn't exist, SPAWN IT
            if (players.length < 2) {
                // Spawn at Player 1's position (or slightly offset)
                const p1 = players[0];
                const p2 = createPlayer(p1.x, p1.y - 10, 1); // Spawn slightly above, index 1

                // Copy some momentum? Maybe not. Start fresh.
                p2.vx = p1.vx;
                p2.vy = p1.vy - 300; // Little pop up

                players.push(p2);
                p2.isInputActive = true; // Start spinning immediately?

            } else {
                // If P2 exists, just control it
                players[1].isInputActive = true;
            }
        }
        if (e.code === 'Escape' && isRunning) deactivate();
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            if (players[1]) {
                players[1].isInputActive = false;
            }
        }
    });

    exitBtn.addEventListener('click', deactivate);

    // --- PHYSICS ---
    function update(dt) {
        if (!isRunning) return;
        if (dt > 0.05) dt = 0.05;

        // Loop through ALL players
        for (let i = 0; i < players.length; i++) {
            const p = players[i];

            // Rotation (Torque + Drag)
            if (p.isInputActive) {
                p.av += ROTATION_ACCEL * dt;
            }
            p.av *= ROTATION_DRAG; // Simulate drag
            p.angle += p.av * dt;

            // Gravity/Friction
            p.vy += GRAVITY * dt;
            p.vx *= FRICTION;

            // Position
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }

        // Infinite movement logic (needs a leader)
        updateWorld(dt);

        // Camera logic: Push (70% Right) and Pull (25% Left)
        // Follow the LEADER (max X)
        if (players.length > 0) {
            const leader = players.reduce((prev, current) => (prev.x > current.x) ? prev : current);

            const screenX = leader.x - cameraX;
            const pushThresholdRight = window.innerWidth * 0.7;
            const pushThresholdLeft = window.innerWidth * 0.25;

            // Move Right
            if (screenX > pushThresholdRight) {
                const targetCamX = leader.x - pushThresholdRight;
                cameraX += (targetCamX - cameraX) * 0.1; // Smooth push
            }
            // Move Left
            else if (screenX < pushThresholdLeft) {
                const targetCamX = leader.x - pushThresholdLeft;
                cameraX += (targetCamX - cameraX) * 0.1; // Smooth pull
            }
        }

        // Parallax / DOM movement
        const header = document.querySelector('header.hero');
        if (header) {
            header.style.setProperty('--camera-x', `${cameraX}px`);
        }

        updateHUD();

        const headerRect = header ? header.getBoundingClientRect() : { top: 0, bottom: 600 };

        // Respawn if ANY player is too high or low
        for (let p of players) {
            if (p.y > headerRect.bottom + 200 || p.y < headerRect.top - 500) {
                resetPlayer(); // Everyone dies
                return;
            }
        }

        // Collisions
        const currentPlatforms = getPlatforms();

        for (let p of players) {
            const rad = p.angle * (Math.PI / 180);

            const px = p.x + PLAYER_WIDTH / 2;
            const py = p.y + PLAYER_HEIGHT / 2;
            const sinA = Math.sin(rad);
            const cosA = Math.cos(rad);

            const halfH = PLAYER_HEIGHT / 2;
            const ax = px - sinA * halfH; // Head
            const ay = py - cosA * halfH;
            const bx = px + sinA * halfH; // Tip
            const by = py + cosA * halfH;

            for (let plat of currentPlatforms) {
                const now = Date.now();

                // 1. Head Collision (Immediate Death)
                if (ax < plat.right && ax > plat.left && ay < plat.bottom && ay > plat.top) {
                    resetPlayer();
                    return;
                }

                // 2. Tip Collision (Bounce)
                if (bx < plat.right && bx > plat.left && by < plat.bottom && by > plat.top) {
                    // Bouncing
                    if (now - lastBounceTime > 50) { // Global bounce timer okay? Or per player?
                        // Ideally per player, but global is probably fine for simplicity if they aren't bouncing same frame
                        p.y = plat.top - PLAYER_HEIGHT;

                        p.vx = sinA * BOUNCE_STRENGTH;
                        p.vy = -Math.abs(cosA * BOUNCE_STRENGTH); // Always bounce up

                        lastBounceTime = now;
                        break;
                    }
                }
            }
        }
    }

    function updateHUD() {
        if (bounceCountEl && players.length > 0) {
            const leader = players.reduce((prev, current) => (prev.x > current.x) ? prev : current);
            const dist = Math.max(0, Math.floor((leader.x - initialX) / 50));
            bounceCountEl.textContent = dist;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-cameraX, 0);

        // --- DRAW TREES (Background) ---
        trees.forEach(t => {
            ctx.fillStyle = t.color;
            ctx.beginPath();
            // Triangle: Bottom-Left, Top-Center, Bottom-Right
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(t.x + t.w / 2, t.y - t.h);
            ctx.lineTo(t.x + t.w, t.y);
            ctx.closePath();
            ctx.fill();
        });

        // --- DRAW FLOOR ITEMS ---
        floorItems.forEach(f => {
            if (!f.img.complete || f.img.naturalWidth === 0) return;
            ctx.drawImage(f.img, f.x, f.y, f.w, f.h);
        });

        // --- DRAW FLOATING IMAGES ---
        floaters.forEach(f => {
            if (!f.img.complete) return;

            ctx.save();
            // Rounded Rect Path
            const r = 15; // Radius
            ctx.beginPath();
            ctx.moveTo(f.x + r, f.y);
            ctx.lineTo(f.x + f.w - r, f.y);
            ctx.quadraticCurveTo(f.x + f.w, f.y, f.x + f.w, f.y + r);
            ctx.lineTo(f.x + f.w, f.y + f.h - r);
            ctx.quadraticCurveTo(f.x + f.w, f.y + f.h, f.x + f.w - r, f.y + f.h);
            ctx.lineTo(f.x + r, f.y + f.h);
            ctx.quadraticCurveTo(f.x, f.y + f.h, f.x, f.y + f.h - r);
            ctx.lineTo(f.x, f.y + r);
            ctx.quadraticCurveTo(f.x, f.y, f.x + r, f.y);
            ctx.closePath();

            // Shadow
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 10;
            ctx.fill(); // Fill to apply shadow

            // Clip & Draw Image
            ctx.shadowColor = 'transparent'; // Reset shadow for image
            ctx.clip();
            ctx.drawImage(f.img, f.x, f.y, f.w, f.h);
            ctx.restore();
        });

        // Procedural Blocks
        obstacles.forEach(obs => {
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

            // Subtle top highlight for depth
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(obs.x, obs.y, obs.w, 4);

            // Shadow on ground if floating
            const header = document.querySelector('header.hero');
            const groundY = header ? header.getBoundingClientRect().bottom - 48 : 0;
            if (obs.y + obs.h < groundY) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(obs.x + 5, groundY - 5, obs.w - 10, 5);
            }
        });


        // Player (Draw ALL)
        players.forEach(p => {
            const imgToUse = (p.playerIndex === 1) ? jumperImg2 : jumperImg;

            ctx.save();
            ctx.translate(p.x + PLAYER_WIDTH / 2, p.y + PLAYER_HEIGHT / 2);
            ctx.rotate(p.angle * (Math.PI / 180));

            if (imgToUse.complete) {
                const ratio = imgToUse.naturalWidth / imgToUse.naturalHeight;
                const h = PLAYER_HEIGHT * VISUAL_SCALE;
                const w = h * ratio;
                ctx.drawImage(imgToUse, -w / 2, -h / 2, w, h);
            } else {
                ctx.fillStyle = (p.playerIndex === 1) ? '#e74c3c' : '#f1c40f';
                ctx.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT);
            }
            ctx.restore();
        });

        ctx.restore();
    }

    function loop(timestamp) {
        if (!isRunning) return;
        if (!lastTime) lastTime = timestamp;
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        update(dt);
        draw();
        requestAnimationFrame(loop);
    }

    // --- TRIGGER ---
    // Make activation available globally
    window.activatePogoMode = activate;

    // Listen for trigger events
    window.addEventListener('DOMContentLoaded', () => {
        const logo = document.querySelector('.brand');
        const triggerBtn = document.getElementById('pogo-mode-trigger');

        // Button trigger
        if (triggerBtn) {
            triggerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                activate();
            });
        }

        // Logo secret trigger (keeping it as an easter egg)
        let clicks = 0;
        if (logo) {
            logo.addEventListener('click', (e) => {
                if (isRunning) return;
                e.preventDefault();
                clicks++;
                if (clicks >= 5) {
                    activate();
                    clicks = 0;
                }
            });
        }
    });

    window.addEventListener('resize', resize);
})();
