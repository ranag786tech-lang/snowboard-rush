// main.js — Input handling, game loop, with crash input lock
(function() {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const G = window.Game;

    function handleKeyDown(e) {
        if (G.state === 'over') {
            if (e.key === ' ' || e.key === 'Space' || e.key === 'ArrowUp') {
                e.preventDefault();
                PlayerEntity.jump();
            }
            return;
        }
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
        if (e.key === 'g' || e.key === 'G' || e.key === 'Shift') {
            e.preventDefault();
            TrickSystem.startGrab();
        }
    }

    function handleKeyUp(e) {
        if (G.state === 'over') return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            PlayerEntity.setSpin('stop');
        }
        if (e.key === 'g' || e.key === 'G' || e.key === 'Shift') {
            e.preventDefault();
            TrickSystem.stopGrab();
        }
    }

    function handleTouchStart(e) {
        e.preventDefault();
        if (G.state === 'over') {
            PlayerEntity.jump();
            return;
        }
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        const scaleX = G.W / rect.width;
        const canvasX = tx * scaleX;

        PlayerEntity.jump();
        if (G.player && !G.player.grounded) {
            if (canvasX < G.W * 0.4) PlayerEntity.setSpin('left');
            else if (canvasX > G.W * 0.6) PlayerEntity.setSpin('right');
            if (canvasX > G.W * 0.3 && canvasX < G.W * 0.7) TrickSystem.startGrab();
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        if (G.state !== 'playing') return;
        PlayerEntity.setSpin('stop');
        TrickSystem.stopGrab();
    }

    // Particle update (same)
    function updateParticles(dt) {
        for (let i = G.particles.length - 1; i >= 0; i--) {
            const p = G.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 1100 * dt;
            p.life -= dt * 2.3;
            if (p.life <= 0) G.particles.splice(i,1);
        }
        for (let i = G.landingParticles.length - 1; i >= 0; i--) {
            const p = G.landingParticles[i];
            p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 650 * dt;
            p.life -= dt * 2.1;
            if (p.life <= 0) G.landingParticles.splice(i,1);
        }
        for (const f of G.snowflakes) {
            f.y += f.speed * dt; f.x += f.drift * dt;
            if (f.y > G.H + 8) { f.y = -8; f.x = Math.random()*G.W; }
            if (f.x > G.W + 10) f.x = -10;
            if (f.x < -10) f.x = G.W + 10;
        }
    }

    function update(dt) {
        if (dt > 0.12) dt = 0.12;
        if (G.shakeAmount > 0) G.shakeAmount = Math.max(0, G.shakeAmount - 7 * dt);
        updateParticles(dt);
        if (G.state !== 'playing') return;

        Physics.update(dt); // uses smoothed dt internally
        TrickSystem.update(dt);
        ObstacleManager.update(dt);
        PowerupSystem.update(dt);
        BossSystem.update(dt);
        AchievementSystem.check();
    }

    function gameLoop(timestamp) {
        if (!G.lastTimestamp) G.lastTimestamp = timestamp;
        let rawDt = (timestamp - G.lastTimestamp) / 1000;
        if (rawDt <= 0) rawDt = 0.016;
        G.lastTimestamp = timestamp;
        G.dt = rawDt;
        update(rawDt);
        Renderer.draw();
        requestAnimationFrame(gameLoop);
    }

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
