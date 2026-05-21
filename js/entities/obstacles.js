// obstacles.js — Obstacle spawning, management, and drawing
(function() {
    'use strict';

    const OBS_WIDTH = 32, OBS_HEIGHT = 40;
    const MIN_INTERVAL = 1.0, MAX_INTERVAL = 1.8;

    window.ObstacleManager = {
        reset: function() {
            const G = window.Game;
            G.obstacles = [];
            G.obstacleTimer = 0;
            G.spawnDelay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
        },

        update: function(dt) {
            const G = window.Game;
            if (G.state !== 'playing') return;

            G.obstacleTimer += dt;
            if (G.obstacleTimer >= G.spawnDelay) {
                G.obstacleTimer = 0;
                G.spawnDelay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
                this.spawn(G);
            }

            const speed = G.currentSpeed;
            for (let i = G.obstacles.length - 1; i >= 0; i--) {
                const obs = G.obstacles[i];
                obs.worldX -= speed * dt;
                const screenX = obs.worldX - G.cameraX;

                // Score for passing
                if (!obs.passed && screenX + obs.width < G.player.x) {
                    obs.passed = true;
                    G.score += 10;
                }

                // Collision check
                if (G.state === 'playing') {
                    const pr = Physics.getPlayerHitbox();
                    const or = {
                        x: screenX + 5, y: obs.y + 5,
                        w: obs.width - 10, h: obs.height - 8
                    };
                    if (Physics.checkCollision(pr, or)) {
                        G.triggerGameOver();
                    }
                }

                if (screenX < -50) G.obstacles.splice(i, 1);
            }
        },

        spawn: function(G) {
            const r = Math.random();
            let type;
            if (r < 0.38) type = 'rock';
            else if (r < 0.72) type = 'tree';
            else type = 'snowman';

            const worldX = G.cameraX + G.W + 30;
            const groundY = TerrainSystem.getHeight(worldX);
            G.obstacles.push({
                worldX: worldX,
                y: groundY - OBS_HEIGHT,
                width: OBS_WIDTH,
                height: OBS_HEIGHT,
                type: type,
                passed: false
            });
        },

        draw: function(ctx, G) {
            for (const obs of G.obstacles) {
                const sx = obs.worldX - G.cameraX;
                const ox = sx, oy = obs.y, ow = obs.width, oh = obs.height;

                if (obs.type === 'rock') {
                    ctx.fillStyle = '#7a8c8d';
                    ctx.beginPath();
                    ctx.moveTo(ox, oy + oh);
                    ctx.lineTo(ox + ow * 0.5, oy);
                    ctx.lineTo(ox + ow, oy + oh);
                    ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#5d6b6c';
                    ctx.beginPath();
                    ctx.moveTo(ox + 5, oy + oh - 5);
                    ctx.lineTo(ox + ow * 0.5, oy + 8);
                    ctx.lineTo(ox + ow - 5, oy + oh - 5);
                    ctx.closePath(); ctx.fill();
                } else if (obs.type === 'tree') {
                    ctx.fillStyle = '#8b5a2b';
                    ctx.fillRect(ox + ow * 0.35, oy + oh * 0.4, ow * 0.3, oh * 0.6);
                    ctx.fillStyle = '#2d5a27';
                    ctx.beginPath();
                    ctx.moveTo(ox, oy + oh * 0.5);
                    ctx.lineTo(ox + ow * 0.5, oy);
                    ctx.lineTo(ox + ow, oy + oh * 0.5);
                    ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#1e421a';
                    ctx.beginPath();
                    ctx.moveTo(ox + ow * 0.2, oy + oh * 0.5);
                    ctx.lineTo(ox + ow * 0.5, oy + oh * 0.12);
                    ctx.lineTo(ox + ow * 0.8, oy + oh * 0.5);
                    ctx.closePath(); ctx.fill();
                } else if (obs.type === 'snowman') {
                    ctx.fillStyle = '#f0f8ff';
                    ctx.beginPath(); ctx.arc(ox + ow/2, oy + oh - 8, 12, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(ox + ow/2, oy + oh - 24, 9, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#2c3e50';
                    ctx.fillRect(ox + ow/2 - 7, oy + oh - 36, 14, 4);
                    ctx.fillRect(ox + ow/2 - 4, oy + oh - 43, 8, 9);
                    ctx.fillStyle = '#000';
                    ctx.beginPath(); ctx.arc(ox + ow/2 - 3, oy + oh - 27, 1.2, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(ox + ow/2 + 3, oy + oh - 27, 1.2, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#e67e22';
                    ctx.beginPath();
                    ctx.moveTo(ox + ow/2, oy + oh - 25);
                    ctx.lineTo(ox + ow/2 + 5, oy + oh - 23);
                    ctx.lineTo(ox + ow/2, oy + oh - 22);
                    ctx.fill();
                }
            }
        }
    };
})();
