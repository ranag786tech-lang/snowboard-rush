// powerups.js – Spawns, updates, and draws boost powerups
const PowerupSystem = (function() {
    const POWERUP_WIDTH = 28;
    const POWERUP_HEIGHT = 28;
    const BOOST_DURATION = 5.0; // seconds
    const POWERUP_SPAWN_INTERVAL = 15; // seconds (approx)

    let powerups = [];
    let spawnTimer = 0;

    function reset() {
        powerups = [];
        spawnTimer = 0;
        window.game.boostActive = false;
        window.game.boostTimer = 0;
    }

    function update(dt) {
        if (!window.game.started || window.game.over) return;

        const speed = window.game.currentSpeed || 380;

        // Spawn new powerups
        spawnTimer += dt;
        if (spawnTimer >= POWERUP_SPAWN_INTERVAL) {
            spawnTimer = 0;
            powerups.push({
                x: 800 + Math.random() * 200,
                y: 280 + Math.random() * 30, // varied height
                width: POWERUP_WIDTH,
                height: POWERUP_HEIGHT,
                collected: false
            });
        }

        // Move powerups
        for (let i = powerups.length - 1; i >= 0; i--) {
            let p = powerups[i];
            p.x -= speed * dt;

            // Collision with player
            if (!p.collected && !window.game.over) {
                let player = window.game.player;
                let pr = {
                    x: player.x + 4,
                    y: player.y + 6,
                    w: player.width - 8,
                    h: player.height - 12
                };
                let or = {
                    x: p.x,
                    y: p.y,
                    w: p.width,
                    h: p.height
                };
                if (pr.x < or.x + or.w && pr.x + pr.w > or.x &&
                    pr.y < or.y + or.h && pr.y + pr.h > or.y) {
                    p.collected = true;
                    activateBoost();
                }
            }

            // Remove off-screen or collected
            if (p.x + p.width < -20 || p.collected) {
                powerups.splice(i, 1);
            }
        }

        // Update boost timer
        if (window.game.boostActive) {
            window.game.boostTimer -= dt;
            if (window.game.boostTimer <= 0) {
                window.game.boostActive = false;
                window.game.boostTimer = 0;
            }
        }
    }

    function activateBoost() {
        window.game.boostActive = true;
        window.game.boostTimer = BOOST_DURATION;
        AudioEngine.playBoostActivate();
    }

    function draw(ctx) {
        // Draw boost glow trail on player when active
        if (window.game.boostActive && window.game.player) {
            let px = window.game.player.x + window.game.player.width/2;
            let py = window.game.player.y + window.game.player.height/2;
            for (let i = 0; i < 6; i++) {
                let alpha = 0.4 + Math.random() * 0.4;
                let size = 4 + Math.random() * 8;
                let offX = (Math.random() - 0.5) * 20;
                let offY = (Math.random() - 0.5) * 20;
                ctx.fillStyle = `rgba(0, 180, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(px - offX, py - offY, size, 0, Math.PI*2);
                ctx.fill();
            }
        }

        // Draw powerup icons
        for (let p of powerups) {
            if (p.collected) continue;
            // Glowing snowflake icon
            ctx.save();
            ctx.translate(p.x + p.width/2, p.y + p.height/2);
            ctx.fillStyle = '#00c8ff';
            ctx.shadowColor = '#00c8ff';
            ctx.shadowBlur = 10;
            // Snowflake shape (simplified)
            for (let i = 0; i < 6; i++) {
                let angle = (i * Math.PI * 2) / 6;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }
    }

    return {
        reset,
        update,
        draw
    };
})();
