// main.js — Input handling, game loop, initialization
// ⚠️ Replace entire file
(function() {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const G = window.Game;

    // ── Input ──────────────────────────────────
    function handleKeyDown(e) {
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
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        const scaleX = G.W / rect.width;
        const canvasX = tx * scaleX;

        // Jump on any tap
        PlayerEntity.jump();

        // Spin based on touch zone (only if airborne)
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

    // ── Particle Updates ───────────────────────
    function updateParticles(dt) {
        // Crash particles
        for (let i = G.particles.length - 1; i >= 0; i--) {
            const p = G.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 1100 * dt;
            p.life -= dt * 2.3;
            if (p.life <= 0) G.particles.splice(i, 1);
        }
        // Landing particles
        for (let i = G.landingParticles.length - 1; i >= 0; i--) {
            const p = G.landingParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 650 * dt;
            p.life -= dt * 2.1;
            if (p.life <= 0) G.landingParticles.splice(i, 1);
        }
        // Snowflakes
        for (const f of G.snowflakes) {
            f.y += f.speed * dt;
            f.x += f.drift * dt;
            if (f.y > G.H + 8) { f.y = -8; f.x = Math.random() * G.W; }
            if (f.x > G.W + 10) f.x = -10;
            if (f.x < -10) f.x = G.W + 10;
        }
    }

    // ── Main Update ────────────────────────────
    function update(dt) {
        if (dt > 0.12) dt = 0.12;

        // Decay screen shake
        if (G.shakeAmount > 0) {
            G.shakeAmount = Math.max(0, G.shakeAmount - 7 * dt);
        }

        updateParticles(dt);

        if (G.state !== 'playing') return;

        // Physics update (includes landing detection → calls TrickSystem.evaluateLanding)
        Physics.update(dt);

        // Trick update (rotation, spin decay, ground recovery)
        TrickSystem.update(dt);

        // Obstacles (rhythm-based spawning)
        ObstacleManager.update(dt);

        // Powerups
        PowerupSystem.update(dt);

        // Bosses
        BossSystem.update(dt);

        // Check achievements
        AchievementSystem.check();
    }

    // ── Game Loop ──────────────────────────────
    function gameLoop(timestamp) {
        if (!G.lastTimestamp) G.lastTimestamp = timestamp;
        let dt = (timestamp - G.lastTimestamp) / 1000;
        if (dt <= 0) dt = 0.016;
        G.lastTimestamp = timestamp;
        G.dt = dt;

        update(dt);
        Renderer.draw();

        requestAnimationFrame(gameLoop);
    }

    // ── Init ───────────────────────────────────
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
