// main.js – Central game loop, state, input, and rendering
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Constants (same as before)
    const W = 800, H = 400;
    const GROUND_Y = 340;
    const PLAYER_WIDTH = 28, PLAYER_HEIGHT = 52, PLAYER_X = 140;
    const GRAVITY = 1800, JUMP_VELOCITY = -650;
    const BASE_SCROLL_SPEED = 380;
    const MIN_OBS_INTERVAL = 1.1, MAX_OBS_INTERVAL = 2.0;
    const OBSTACLE_WIDTH = 32, OBSTACLE_HEIGHT = 40;
    const OBSTACLE_Y = GROUND_Y - OBSTACLE_HEIGHT;
    const COYOTE_TIME = 0.12;

    // Global game object accessible by all modules
    window.game = {
        player: {
            x: PLAYER_X,
            y: GROUND_Y - PLAYER_HEIGHT,
            vy: 0,
            grounded: true,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            rotation: 0,
            spinSpeed: 0
        },
        obstacles: [],
        snowflakes: [],
        particles: [],
        landingParticles: [],
        score: 0,
        bestScore: 0,
        over: false,
        started: false,
        obstacleTimer: 0,
        spawnDelay: 0,
        coyoteTimer: 0,
        terrainOffset: 0,
        currentSpeed: BASE_SCROLL_SPEED,
        shakeAmount: 0,
        mountainOffset1: 0,
        mountainOffset2: 0,
        boostActive: false,
        boostTimer: 0,
        wasGrounded: true
    };

    const game = window.game;
    const player = game.player;

    // High score
    try {
        game.bestScore = parseInt(localStorage.getItem('snowBest')) || 0;
    } catch(e) {}

    // Snowflakes
    function initSnowflakes() {
        game.snowflakes = [];
        for (let i = 0; i < 60; i++) {
            game.snowflakes.push({
                x: Math.random() * W,
                y: Math.random() * H,
                radius: Math.random() * 3 + 1,
                speed: Math.random() * 30 + 15,
                drift: Math.random() * 20 - 10,
                opacity: Math.random() * 0.7 + 0.3
            });
        }
    }
    initSnowflakes();

    // Restart
    function restartGame() {
        player.y = GROUND_Y - PLAYER_HEIGHT;
        player.vy = 0;
        player.grounded = true;
        game.wasGrounded = true;
        game.coyoteTimer = 0;
        game.obstacles = [];
        game.particles = [];
        game.landingParticles = [];
        game.score = 0;
        game.over = false;
        game.started = true;
        game.obstacleTimer = 0;
        game.spawnDelay = randomInterval();
        game.terrainOffset = 0;
        game.currentSpeed = BASE_SCROLL_SPEED;
        game.shakeAmount = 0;
        game.mountainOffset1 = 0;
        game.mountainOffset2 = 0;
        game.boostActive = false;
        game.boostTimer = 0;
        player.rotation = 0;
        player.spinSpeed = 0;
        TrickSystem.reset();
        PowerupSystem.reset();
    }

    function randomInterval() {
        return MIN_OBS_INTERVAL + Math.random() * (MAX_OBS_INTERVAL - MIN_OBS_INTERVAL);
    }

    function spawnObstacle() {
        const r = Math.random();
        let type = r < 0.4 ? 'rock' : (r < 0.75 ? 'tree' : 'snowman');
        game.obstacles.push({
            x: W + 20,
            y: OBSTACLE_Y,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
            type: type,
            passed: false
        });
    }

    function explodeCrashParticles() {
        for (let i = 0; i < 20; i++) {
            game.particles.push({
                x: player.x + PLAYER_WIDTH/2,
                y: player.y + PLAYER_HEIGHT/2,
                vx: Math.random() * 400 - 200,
                vy: Math.random() * -300 - 50,
                life: 1.0,
                size: Math.random() * 4 + 2,
            });
        }
    }

    function spawnLandingParticles() {
        for (let i = 0; i < 6; i++) {
            game.landingParticles.push({
                x: player.x + PLAYER_WIDTH/2 + (Math.random()-0.5)*15,
                y: player.y + PLAYER_HEIGHT - 4,
                vx: (Math.random()-0.5)*70,
                vy: Math.random()*-80-40,
                life: 0.7,
                size: Math.random()*3+2,
            });
        }
    }

    function jump() {
        if (game.over) {
            restartGame();
            return;
        }
        if (!game.started) {
            game.started = true;
            game.spawnDelay = randomInterval();
            game.obstacleTimer = 0;
            return;
        }
        if (game.coyoteTimer > 0) {
            player.vy = JUMP_VELOCITY;
            player.grounded = false;
            game.coyoteTimer = 0;
            AudioEngine.playJump();
            TrickSystem.onJump();
        }
    }

    // Input
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Space' || e.key === 'ArrowUp' || e.key === 'Up') {
            e.preventDefault();
            jump();
        }
        // Spin controls for tricks
        if (e.key === 'ArrowRight') {
            player.spinSpeed = 8;
        }
        if (e.key === 'ArrowLeft') {
            player.spinSpeed = -8;
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchend', (e) => e.preventDefault());

    function update(dt) {
        if (dt > 0.1) dt = 0.1;

        // Screen shake decay
        if (game.shakeAmount > 0) {
            game.shakeAmount = Math.max(0, game.shakeAmount - 6.0 * dt);
        }

        // Update particles
        for (let i = game.particles.length-1; i >= 0; i--) {
            let p = game.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 1200 * dt;
            p.life -= dt * 2.2;
            if (p.life <= 0) game.particles.splice(i,1);
        }
        for (let i = game.landingParticles.length-1; i >= 0; i--) {
            let p = game.landingParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 700 * dt;
            p.life -= dt * 2.0;
            if (p.life <= 0) game.landingParticles.splice(i,1);
        }

        if (!game.started || game.over) return;

        // Boost affects speed
        game.currentSpeed = BASE_SCROLL_SPEED + game.score * 0.15;
        if (game.boostActive) {
            game.currentSpeed *= 1.8;
        }

        // Player physics
        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;

        // Trick update
        TrickSystem.update(dt);

        // Ground collision
        game.wasGrounded = player.grounded;
        if (player.y + player.height >= GROUND_Y) {
            player.y = GROUND_Y - player.height;
            player.vy = 0;
            player.grounded = true;
        } else {
            player.grounded = false;
        }

        // Landing detection
        if (player.grounded && !game.wasGrounded) {
            spawnLandingParticles();
            TrickSystem.onLanding();
            AudioEngine.playLand();
        }

        // Coyote time
        if (player.grounded) {
            game.coyoteTimer = COYOTE_TIME;
        } else {
            game.coyoteTimer -= dt;
        }

        // Terrain & parallax
        game.terrainOffset += game.currentSpeed * dt * 0.02;
        game.mountainOffset1 += game.currentSpeed * dt * 0.005;
        game.mountainOffset2 += game.currentSpeed * dt * 0.008;

        // Obstacle spawning
        game.obstacleTimer += dt;
        if (game.obstacleTimer >= game.spawnDelay) {
            spawnObstacle();
            game.obstacleTimer = 0;
            game.spawnDelay = randomInterval();
        }

        // Move obstacles & collision
        for (let i = game.obstacles.length-1; i >= 0; i--) {
            let obs = game.obstacles[i];
            obs.x -= game.currentSpeed * dt;

            if (!obs.passed && obs.x + obs.width < player.x) {
                obs.passed = true;
                game.score += 10;
            }

            if (!game.over) {
                let pr = { x: player.x+4, y: player.y+6, w: player.width-8, h: player.height-12 };
                let or = { x: obs.x+4, y: obs.y+4, w: obs.width-8, h: obs.height-6 };
                if (pr.x < or.x+or.w && pr.x+pr.w > or.x && pr.y < or.y+or.h && pr.y+pr.h > or.y) {
                    game.over = true;
                    explodeCrashParticles();
                    game.shakeAmount = 12;
                    AudioEngine.playCrash();
                    if (game.score > game.bestScore) {
                        game.bestScore = game.score;
                        try { localStorage.setItem('snowBest', game.bestScore); } catch(e) {}
                    }
                    break;
                }
            }

            if (obs.x + obs.width < -20) game.obstacles.splice(i,1);
        }

        // Update powerups
        PowerupSystem.update(dt);

        // Score over time
        game.score += Math.floor(game.currentSpeed * dt * 0.1);

        // Snowflakes
        for (let flake of game.snowflakes) {
            flake.y += flake.speed * dt;
            flake.x += flake.drift * dt;
            if (flake.y > H+5) { flake.y = -10; flake.x = Math.random()*W; }
            if (flake.x > W+10) flake.x = -10;
            if (flake.x < -10) flake.x = W+10;
        }
    }

    function draw() {
        ctx.clearRect(0,0,W,H);
        ctx.save();
        if (game.shakeAmount > 0) {
            let sx = (Math.random()-0.5) * game.shakeAmount;
            let sy = (Math.random()-0.5) * game.shakeAmount;
            ctx.translate(sx, sy);
        }

        // Sky
        let grad = ctx.createLinearGradient(0,0,0,H);
        grad.addColorStop(0,'#b3e0f2'); grad.addColorStop(0.7,'#d9f0f8'); grad.addColorStop(1,'#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,W,H);

        // Parallax mountains
        ctx.fillStyle = '#c1dde8';
        ctx.beginPath(); ctx.moveTo(0,280);
        for (let x=0; x<=W+50; x+=50) ctx.lineTo(x, 170+Math.sin((x+game.mountainOffset1)*0.015)*30);
        ctx.lineTo(W,300); ctx.lineTo(0,300); ctx.fill();
        ctx.fillStyle = '#b0d0dc';
        ctx.beginPath(); ctx.moveTo(0,310);
        for (let x=0; x<=W+50; x+=50) ctx.lineTo(x, 220+Math.sin((x+game.mountainOffset2)*0.02)*25);
        ctx.lineTo(W,330); ctx.lineTo(0,330); ctx.fill();

        // Animated ground
        ctx.fillStyle = '#f5faff';
        ctx.beginPath(); ctx.moveTo(0,GROUND_Y+5);
        for (let x=0; x<=W; x+=40) ctx.lineTo(x, GROUND_Y + Math.sin((x+game.terrainOffset)*0.02)*5);
        ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
        ctx.strokeStyle = '#dfeef5'; ctx.lineWidth=2;
        ctx.beginPath();
        for (let x=0; x<=W; x+=40) { let y = GROUND_Y+Math.sin((x+game.terrainOffset)*0.02)*5; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }
        ctx.stroke();

        // Obstacles (same drawing as before, include snowman)
        for (let obs of game.obstacles) {
            if (obs.type==='rock') {
                ctx.fillStyle='#7a8c8d';
                ctx.beginPath(); ctx.moveTo(obs.x,obs.y+obs.height); ctx.lineTo(obs.x+obs.width/2,obs.y); ctx.lineTo(obs.x+obs.width,obs.y+obs.height); ctx.fill();
                ctx.fillStyle='#5d6b6c';
                ctx.beginPath(); ctx.moveTo(obs.x+4,obs.y+obs.height-4); ctx.lineTo(obs.x+obs.width/2,obs.y+6); ctx.lineTo(obs.x+obs.width-4,obs.y+obs.height-4); ctx.fill();
            } else if (obs.type==='tree') {
                ctx.fillStyle='#8b5a2b'; ctx.fillRect(obs.x+obs.width*0.35, obs.y+obs.height*0.4, obs.width*0.3, obs.height*0.6);
                ctx.fillStyle='#2d5a27'; ctx.beginPath(); ctx.moveTo(obs.x,obs.y+obs.height*0.5); ctx.lineTo(obs.x+obs.width/2,obs.y); ctx.lineTo(obs.x+obs.width,obs.y+obs.height*0.5); ctx.fill();
                ctx.fillStyle='#1e421a'; ctx.beginPath(); ctx.moveTo(obs.x+obs.width*0.2,obs.y+obs.height*0.5); ctx.lineTo(obs.x+obs.width/2,obs.y+obs.height*0.15); ctx.lineTo(obs.x+obs.width*0.8,obs.y+obs.height*0.5); ctx.fill();
            } else if (obs.type==='snowman') {
                ctx.fillStyle='#f0f8ff'; ctx.beginPath(); ctx.arc(obs.x+obs.width/2,obs.y+obs.height-8,12,0,Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(obs.x+obs.width/2,obs.y+obs.height-24,9,0,Math.PI*2); ctx.fill();
                ctx.fillStyle='#2c3e50'; ctx.fillRect(obs.x+obs.width/2-7,obs.y+obs.height-36,14,4); ctx.fillRect(obs.x+obs.width/2-4,obs.y+obs.height-42,8,8);
                ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(obs.x+obs.width/2-3,obs.y+obs.height-27,1.2,0,Math.PI*2); ctx.arc(obs.x+obs.width/2+3,obs.y+obs.height-27,1.2,0,Math.PI*2); ctx.fill();
                ctx.fillStyle='#e67e22'; ctx.beginPath(); ctx.moveTo(obs.x+obs.width/2,obs.y+obs.height-25); ctx.lineTo(obs.x+obs.width/2+5,obs.y+obs.height-23); ctx.lineTo(obs.x+obs.width/2,obs.y+obs.height-22); ctx.fill();
            }
        }

        // Draw powerups
        PowerupSystem.draw(ctx);

        // Landing particles
        for (let p of game.landingParticles) {
            ctx.fillStyle=`rgba(255,255,255,${p.life*0.9})`; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
        }

        // Draw player with rotation (tricks)
        ctx.save();
        let px=player.x, py=player.y;
        let tilt = player.grounded ? 0 : -0.15;
        let scaleY = player.grounded ? 1 : 0.92;
        let scaleX = player.grounded ? 1 : 1.03;
        ctx.translate(px+PLAYER_WIDTH/2, py+PLAYER_HEIGHT/2);
        ctx.scale(scaleX, scaleY);
        ctx.rotate(player.rotation + tilt);
        ctx.translate(-(px+PLAYER_WIDTH/2), -(py+PLAYER_HEIGHT/2));
        // Board, body, head, etc. (same as before)
        ctx.fillStyle='#5c4033'; ctx.fillRect(px-4,py+PLAYER_HEIGHT-8,PLAYER_WIDTH+8,8);
        ctx.fillStyle='#8b5a2b'; ctx.fillRect(px-2,py+PLAYER_HEIGHT-7,PLAYER_WIDTH+4,4);
        ctx.fillStyle='#1e3a5f'; ctx.fillRect(px+6,py+26,8,18); ctx.fillRect(px+16,py+26,8,18);
        ctx.fillStyle='#2a5f8a'; ctx.fillRect(px+4,py+8,20,20);
        ctx.fillStyle='#1e3a5f'; ctx.fillRect(px-2,py+12,8,6); ctx.fillRect(px+22,py+12,8,6);
        ctx.fillStyle='#f7d9aa'; ctx.beginPath(); ctx.arc(px+14,py+4,10,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#1c1c1c'; ctx.fillRect(px+6,py-1,16,5);
        ctx.fillStyle='#4a90e2'; ctx.fillRect(px+8,py,6,3); ctx.fillRect(px+15,py,6,3);
        ctx.fillStyle='#c93c3c'; ctx.beginPath(); ctx.ellipse(px+14,py-2,11,7,0,Math.PI,0); ctx.fill(); ctx.fillRect(px+8,py-9,12,6);
        ctx.restore();

        // Crash particles
        for (let p of game.particles) {
            ctx.fillStyle=`rgba(255,255,255,${p.life*0.8})`; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
        }

        // Snowflakes
        for (let flake of game.snowflakes) {
            ctx.fillStyle=`rgba(255,255,255,${flake.opacity})`; ctx.beginPath(); ctx.arc(flake.x,flake.y,flake.radius,0,Math.PI*2); ctx.fill();
        }

        ctx.restore(); // end shake

        // UI
        ctx.fillStyle='#1a3b4b'; ctx.font='bold 22px "Segoe UI", sans-serif'; ctx.textAlign='left';
        ctx.fillText(`Score: ${Math.floor(game.score)}`,20,45);
        ctx.font='14px "Segoe UI", sans-serif';
        ctx.fillText(`Best: ${Math.floor(game.bestScore)}`,20,70);
        ctx.fillText(`Speed: ${Math.floor(game.currentSpeed)}`,20,92);
        if (game.boostActive) {
            ctx.fillStyle='#00c8ff'; ctx.font='bold 16px "Segoe UI"';
            ctx.fillText(`⚡ BOOST ${game.boostTimer.toFixed(1)}s`, W-160, 35);
        }

        // Overlays
        if (!game.started && !game.over) {
            ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);
            ctx.fillStyle='white'; ctx.font='bold 28px "Segoe UI"'; ctx.textAlign='center';
            ctx.fillText('🏂 Snowboard Rush', W/2, H/2-30);
            ctx.font='18px "Segoe UI"'; ctx.fillText('Press Space / Up Arrow or Tap to Start', W/2, H/2+30);
        }
        if (game.over) {
            ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(0,0,W,H);
            ctx.fillStyle='white'; ctx.font='bold 32px "Segoe UI"'; ctx.textAlign='center';
            ctx.fillText('💥 Wipeout!', W/2, H/2-35);
            ctx.font='22px "Segoe UI"'; ctx.fillText(`Score: ${Math.floor(game.score)}`, W/2, H/2+15);
            if (game.score >= game.bestScore && game.score>0) { ctx.fillStyle='#ffd700'; ctx.fillText('🏆 New Best!', W/2, H/2+45); }
            ctx.fillStyle='white'; ctx.font='16px "Segoe UI"'; ctx.fillText('Tap or press Space to ride again', W/2, H/2+75);
        }
    }

    function gameLoop(ts) {
        if (!gameLoop.last) gameLoop.last = ts;
        let dt = (ts - gameLoop.last)/1000;
        if (dt<=0) dt=0.016;
        gameLoop.last = ts;
        update(dt);
        draw();
        requestAnimationFrame(gameLoop);
    }
    gameLoop.last = 0;
    requestAnimationFrame(gameLoop);
})();
