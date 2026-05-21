// main.js — Input handling, game loop, initialization
// ⚠️ Replace entire file
(function() {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const G = window.Game;

    // ── Input Handling (Protected during Wipeout State) ──
    function handleKeyDown(e) {
        // Agar game over ya wipeout ho chuka hai, toh inputs block karein
        if (G.state !== 'playing') return;

        if (e.key === ' ' || e.key === 'Space' || e.key === 'ArrowUp' || e.key === 'Up') {
            e.preventDefault();
            PlayerEntity.jump();
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            PlayerEntity.setSpin('left');
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            PlayerEntity.setSpin('right');
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            PlayerEntity.setSpin('stop');
        }
    }

    function handleTouchStart(e) {
        if (G.state !== 'playing') return;
        e.preventDefault();

        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        const scaleX = G.W / rect.width;
        const canvasX = tx * scaleX;

        // Jump trigger
        PlayerEntity.jump();

        // Spin logic based on exact screen division (Airborne calculation protection)
        if (G.player && !G.player.grounded) {
            if (canvasX < G.W * 0.4) {
                PlayerEntity.setSpin('left');
            } else if (canvasX > G.W * 0.6) {
                PlayerEntity.setSpin('right');
            }
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        PlayerEntity.setSpin('stop');
    }

    // ── Particle Updates (Perfect Frame-Independent Delta Tuning) ──
    function updateParticles(dt) {
        // Crash particles physics
        for (let i = G.particles.length - 1; i >= 0; i--) {
            const p = G.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 1100 * dt;
            p.life -= dt * 2.3;
            if (p.life <= 0) G.particles.splice(i, 1);
        }
        // Landing particles physics
        for (let i = G.landingParticles.length - 1; i >= 0; i--) {
            const p = G.landingParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 650 * dt;
            p.life -= dt * 2.1;
            if (p.life <= 0) G.landingParticles.splice(i, 1);
        }
        // Smooth Snowflakes Vector update (Fixes the high-speed jitter)
        for (const f of G.snowflakes) {
            f.y += f.speed * dt;
            f.x += f.drift * dt;
            if (f.y > G.H + 8) { f.y = -8; f.x = Math.random() * G.W; }
            if (f.x > G.W + 10) f.x = -10;
            if (f.x < -10) f.x = G.W + 10;
        }
    }

    // ── Main Core Update Loop ──
    function update(dt) {
        // Delta time clamping standard for 60Hz-144Hz screen stability
        // Preventions for the "teleportation" bug when the game speeds up to 418+
        if (dt > 0.1) dt = 0.1;

        // Decay screen shake smoothly based on standard timeline
        if (G.shakeAmount > 0) {
            G.shakeAmount = Math.max(0, G.shakeAmount - 7 * dt);
        }

        updateParticles(dt);

        // Core dynamic check: If wipeout triggers, freeze obstacles/world rendering but allow particles
        if (G.state !== 'playing') {
            // Force reset any underlying spin drift lingering after crash
            if (G.player) PlayerEntity.setSpin('stop');
            return;
        }

        // Physics engine processing with structural Y-axis updates
        Physics.update(dt);

        // Rotation & air trick mechanics verification
        TrickSystem.update(dt);

        // Obstacles (Dynamic, rhythm speed adaptive spawning)
        ObstacleManager.update(dt);

        // Powerups, Bosses & Achievements trackers
        PowerupSystem.update(dt);
        BossSystem.update(dt);
        AchievementSystem.check();
    }

    // ── Ultra-Smooth Delta Time Game Loop ──
    function gameLoop(timestamp) {
        if (!G.lastTimestamp) G.lastTimestamp = timestamp;
        
        // Exact frame rate calculation to avoid background jittering at high speeds
        let dt = (timestamp - G.lastTimestamp) / 1000;
        
        // Anti-break protection for lag spikes or minimized tabs
        if (dt <= 0 || dt > 0.1) dt = 0.0166; 
        
        G.lastTimestamp = timestamp;
        G.dt = dt;

        update(dt);
        Renderer.draw();

        requestAnimationFrame(gameLoop);
    }

    // ── Initialization & Event Listeners Cleaner ──
    function init() {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchmove', handleTouchEnd);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        G.init();
        PlayerEntity.create();
        ObstacleManager.reset();
        PowerupSystem.reset();
        TrickSystem.reset();
        BossSystem.reset();
    }

    init();
    requestAnimationFrame(gameLoop);
})();
