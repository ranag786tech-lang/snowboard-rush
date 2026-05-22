// bosses.js — Giant snowman boss with stomp and snowball attacks
(function() {
    'use strict';

    const BOSS_SCORE_INTERVAL = 3000;
    const BOSS_WIDTH = 90, BOSS_HEIGHT = 110;
    const BOSS_HEALTH = 5;
    const BOSS_SPEED = 80;
    const ATTACK_COOLDOWN = 1.8;
    const SNOWBALL_SPEED = 220;
    const SNOWBALL_WIDTH = 16, SNOWBALL_HEIGHT = 16;

    let activeBoss = null;
    let nextBossScore = BOSS_SCORE_INTERVAL;
    let snowballs = [];
    let attackTimer = 0;

    window.BossSystem = {
        reset: function() {
            activeBoss = null;
            nextBossScore = BOSS_SCORE_INTERVAL;
            snowballs = [];
            attackTimer = 0;
        },

        update: function(dt) {
            const G = window.Game;
            if (G.state !== 'playing') return;

            if (!activeBoss && G.score >= nextBossScore) {
                this.spawnBoss(G);
                nextBossScore = G.score + BOSS_SCORE_INTERVAL;
            }

            if (!activeBoss) return;

            const boss = activeBoss;
            boss.worldX -= (G.currentSpeed - BOSS_SPEED) * dt;
            const screenX = boss.worldX - G.cameraX;

            if (screenX < -150) {
                this.despawnBoss();
                return;
            }

            attackTimer += dt;
            if (attackTimer >= ATTACK_COOLDOWN && boss.health > 0) {
                attackTimer = 0;
                this.fireSnowball(G, boss);
            }

            for (let i = snowballs.length - 1; i >= 0; i--) {
                const sb = snowballs[i];
                sb.worldX -= (G.currentSpeed + SNOWBALL_SPEED) * dt;
                const sbScreenX = sb.worldX - G.cameraX;

                if (G.state === 'playing') {
                    const pCircle = Physics.getPlayerCircle();
                    const sr = Physics.getObstacleRect({x: sbScreenX, y: sb.y, width: sb.width, height: sb.height});
                    if (Physics.checkCircleCollision(pCircle.x, pCircle.y, pCircle.radius, sr)) {
                        G.triggerGameOver();
                        return;
                    }
                }

                if (sbScreenX < -30) snowballs.splice(i, 1);
            }

            if (G.player && G.player.vy > 0 && !G.player.grounded) {
                const p = G.player;
                const bossTopY = boss.y;
                const bossLeftX = screenX;
                const bossRightX = screenX + BOSS_WIDTH;

                const playerFeetY = p.y + p.height;
                if (p.x + p.width > bossLeftX + 10 && p.x < bossRightX - 10 &&
                    playerFeetY >= bossTopY && playerFeetY <= bossTopY + 25) {
                    boss.health--;
                    p.vy = -500;
                    p.grounded = false;
                    G.score += 500;
                    G.shakeAmount = 6;
                    if (navigator.vibrate) navigator.vibrate(40);
                    AudioEngine.playJump();

                    if (boss.health <= 0) {
                        this.defeatBoss(G);
                    }
                }
            }

            if (G.state === 'playing') {
                const pCircle = Physics.getPlayerCircle();
                const br = Physics.getObstacleRect({x: screenX + 10, y: boss.y + 30, width: BOSS_WIDTH - 20, height: BOSS_HEIGHT - 30});
                if (Physics.checkCircleCollision(pCircle.x, pCircle.y, pCircle.radius, br)) {
                    G.triggerGameOver();
                }
            }
        },

        spawnBoss: function(G) {
            const worldX = G.cameraX + G.W + 50;
            const groundY = TerrainSystem.getHeight(worldX);
            activeBoss = {
                worldX: worldX,
                y: groundY - BOSS_HEIGHT,
                width: BOSS_WIDTH,
                height: BOSS_HEIGHT,
                health: BOSS_HEALTH,
                type: 'giant_snowman'
            };
            attackTimer = 0;
            snowballs = [];
            G.trickList.push({
                text: '⚠️ BOSS!',
                x: G.W/2,
                y: G.H/2 - 40,
                life: 2.0,
                points: 0,
                color: '#ff4444'
            });
        },

        despawnBoss: function() {
            activeBoss = null;
            snowballs = [];
        },

        defeatBoss: function(G) {
            G.score += 2000;
            G.trickList.push({
                text: '🏆 BOSS DEFEATED!',
                x: G.W/2,
                y: G.H/2 - 40,
                life: 2.5,
                points: 2000,
                color: '#ffd700'
            });
            AudioEngine.playAchievement();
            activeBoss = null;
            snowballs = [];
        },

        fireSnowball: function(G, boss) {
            snowballs.push({
                worldX: boss.worldX - 30,
                y: boss.y + 40 + Math.random() * 30,
                width: SNOWBALL_WIDTH,
                height: SNOWBALL_HEIGHT
            });
        },

        draw: function(ctx, G) {
            if (!activeBoss) return;
            const boss = activeBoss;
            const sx = boss.worldX - G.cameraX;

            ctx.fillStyle = '#f0f8ff';
            ctx.beginPath();
            ctx.arc(sx + BOSS_WIDTH/2, boss.y + BOSS_HEIGHT - 30, 35, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(sx + BOSS_WIDTH/2, boss.y + BOSS_HEIGHT - 70, 25, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(sx + BOSS_WIDTH/2, boss.y + 20, 18, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(sx + BOSS_WIDTH/2 - 6, boss.y + 15, 3, 0, Math.PI*2);
            ctx.arc(sx + BOSS_WIDTH/2 + 6, boss.y + 15, 3, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.moveTo(sx + BOSS_WIDTH/2, boss.y + 22);
            ctx.lineTo(sx + BOSS_WIDTH/2 + 8, boss.y + 27);
            ctx.lineTo(sx + BOSS_WIDTH/2, boss.y + 30);
            ctx.fill();
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(sx + BOSS_WIDTH/2 - 15, boss.y - 5, 30, 6);
            ctx.fillRect(sx + BOSS_WIDTH/2 - 9, boss.y - 20, 18, 18);
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(sx + 5, boss.y + BOSS_HEIGHT - 80, 8, 35);
            ctx.fillRect(sx + BOSS_WIDTH - 13, boss.y + BOSS_HEIGHT - 80, 8, 35);

            const barWidth = 80, barHeight = 8;
            const barX = sx + (BOSS_WIDTH - barWidth)/2, barY = boss.y - 30;
            ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barWidth, barHeight);
            const healthPercent = boss.health / BOSS_HEALTH;
            const healthColor = healthPercent > 0.5 ? '#4caf50' : (healthPercent > 0.25 ? '#ff9800' : '#f44336');
            ctx.fillStyle = healthColor;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, barHeight);

            for (const sb of snowballs) {
                const sbx = sb.worldX - G.cameraX;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(sbx + sb.width/2, sb.y + sb.height/2, sb.width/2, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = '#a0d8ef';
                ctx.stroke();
            }
        },

        isActive: function() { return activeBoss !== null; },
        getBoss: function() { return activeBoss; }
    };
})();
