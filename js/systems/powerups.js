// powerups.js — Boost pickups with speed surge and glow
(function() {
    'use strict';

    const PW_WIDTH = 28, PW_HEIGHT = 28;
    const BASE_SPAWN_INTERVAL = 8; // seconds
    const BOOST_DURATION = 5.0;

    let powerups = [];
    let spawnTimer = 0;

    window.PowerupSystem = {
        reset: function() {
            powerups = [];
            spawnTimer = 0;
            const G = window.Game;
            G.boostActive = false;
            G.boostTimer = 0;
        },

        update: function(dt) {
            const G = window.Game;
            if (G.state !== 'playing') return;

            const speed = G.currentSpeed;

            // Dynamic spawn interval: more frequent at higher speeds
            const effectiveInterval = Math.max(4, BASE_SPAWN_INTERVAL * (G.BASE_SPEED / Math.max(speed, G.BASE_SPEED)));

            spawnTimer += dt;
            if (spawnTimer >= effectiveInterval) {
                spawnTimer = 0;
                const wx = G.cameraX + G.W + 50 + Math.random() * 300;
                const gy = TerrainSystem.getHeight(wx);
                powerups.push({
                    worldX: wx,
                    y: gy - 80 - Math.random() * 40,
                    width: PW_WIDTH,
                    height: PW_HEIGHT,
                    collected: false
                });
            }

            // Update boost timer
            if (G.boostActive) {
                G.boostTimer -= dt;
                if (G.boostTimer <= 0) {
                    G.boostActive = false;
                    G.boostTimer = 0;
                }
            }

            // Move and check powerups
            for (let i = powerups.length - 1; i >= 0; i--) {
                const pw = powerups[i];
                const screenX = pw.worldX - G.cameraX;

                if (!pw.collected && G.state === 'playing') {
                    const pr = Physics.getPlayerHitbox();
                    const or = { x: screenX + 4, y: pw.y + 4, w: pw.width - 8, h: pw.height - 8 };
                    if (Physics.checkCollision(pr, or)) {
                        pw.collected = true;
                        G.boostActive = true;
                        G.boostTimer = BOOST_DURATION;
                        AudioEngine.playBoostActivate();
                        if (navigator.vibrate) navigator.vibrate(40);
                    }
                }

                if (pw.collected || screenX < -40) {
                    powerups.splice(i, 1);
                }
            }
        },

        draw: function(ctx, G) {
            // Boost glow trail on player
            if (G.boostActive && G.player) {
                const px = G.player.x + G.player.width/2;
                const py = G.player.y + G.player.height/2;
                for (let i = 0; i < 5; i++) {
                    const alpha = 0.35 + Math.random() * 0.4;
                    const size = 5 + Math.random() * 7;
                    const offX = (Math.random() - 0.5) * 22;
                    const offY = (Math.random() - 0.5) * 22;
                    ctx.fillStyle = `rgba(0,180,255,${alpha})`;
                    ctx.beginPath(); ctx.arc(px - offX, py - offY, size, 0, Math.PI * 2); ctx.fill();
                }
            }

            // Draw powerup icons
            for (const pw of powerups) {
                if (pw.collected) continue;
                const sx = pw.worldX - G.cameraX;
                ctx.save();
                ctx.translate(sx + pw.width/2, pw.y + pw.height/2);
                // Glow
                ctx.shadowColor = '#00ccff'; ctx.shadowBlur = 14;
                ctx.fillStyle = '#00ccff';
                ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                // Lightning bolt shape
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(2, -8); ctx.lineTo(-4, 1); ctx.lineTo(1, 1);
                ctx.lineTo(-3, 8); ctx.lineTo(5, -1); ctx.lineTo(-1, -1); ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    };
})();
