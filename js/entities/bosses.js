// bosses.js — Boss system placeholder (ready for expansion)
(function() {
    'use strict';

    // Boss spawns every BOSS_INTERVAL score
    const BOSS_INTERVAL = 3000;
    let nextBossScore = BOSS_INTERVAL;
    let activeBoss = null;

    window.BossSystem = {
        reset: function() {
            activeBoss = null;
            nextBossScore = BOSS_INTERVAL;
        },

        update: function(dt) {
            const G = window.Game;
            if (G.state !== 'playing') return;

            // Check if boss should spawn
            if (G.score >= nextBossScore && !activeBoss) {
                this.spawnBoss(G);
                nextBossScore += BOSS_INTERVAL;
            }

            // Update active boss
            if (activeBoss) {
                activeBoss.worldX -= G.currentSpeed * dt;
                const sx = activeBoss.worldX - G.cameraX;
                if (sx < -200) {
                    activeBoss = null; // boss passed
                }
                // TODO: boss AI, health, attacks, collision
            }
        },

        spawnBoss: function(G) {
            // Placeholder: giant snowman boss
            activeBoss = {
                worldX: G.cameraX + G.W + 100,
                y: TerrainSystem.getHeight(G.cameraX + G.W + 100) - 100,
                width: 80,
                height: 100,
                health: 5,
                type: 'giant_snowman'
            };
            // TODO: boss intro cinematic, warning text
        },

        draw: function(ctx, G) {
            if (!activeBoss) return;
            const sx = activeBoss.worldX - G.cameraX;
            // Placeholder drawing
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(sx, activeBoss.y, activeBoss.width, activeBoss.height);
            ctx.fillStyle = '#fff';
            ctx.font = '14px sans-serif';
            ctx.fillText('BOSS', sx + 10, activeBoss.y + 50);
        },

        isActive: function() { return activeBoss !== null; },
        getBoss: function() { return activeBoss; }
    };
})();
