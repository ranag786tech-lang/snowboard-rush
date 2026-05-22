// obstacles.js — Rhythm-based obstacles with circular collision
(function() {
    'use strict';

    const OBS_WIDTH = 32, OBS_HEIGHT = 40;
    const RHYTHM_PATTERN = [
        'single','single','double','single',
        'gap','single','double','single',
        'single','gap','single','double'
    ];
    const INTERVAL_MULTIPLIERS = {
        'single': 1.0,
        'double': 0.35,
        'gap': 2.0
    };
    const BASE_INTERVAL = 1.15;

    window.ObstacleManager = {
        _patternIndex: 0,
        _doublePending: false,

        reset: function() {
            const G = window.Game;
            G.obstacles = [];
            G.obstacleTimer = 0;
            G.spawnDelay = BASE_INTERVAL;
            this._patternIndex = 0;
            this._doublePending = false;
        },

        update: function(dt) {
            const G = window.Game;
            if (G.state !== 'playing') return;

            const speedFactor = Math.max(0.5, G.BASE_SPEED / Math.max(G.currentSpeed, G.BASE_SPEED));
            const effectiveInterval = BASE_INTERVAL * speedFactor;

            G.obstacleTimer += dt;
            if (G.obstacleTimer >= G.spawnDelay) {
                G.obstacleTimer = 0;
                if (this._doublePending) {
                    this.spawnObstacle(G);
                    this._doublePending = false;
                    this.advancePattern();
                    G.spawnDelay = effectiveInterval * INTERVAL_MULTIPLIERS['single'];
                } else {
                    const instruction = RHYTHM_PATTERN[this._patternIndex];
                    if (instruction === 'gap') {
                        this.advancePattern();
                        G.spawnDelay = effectiveInterval * INTERVAL_MULTIPLIERS['gap'];
                    } else if (instruction === 'double') {
                        this.spawnObstacle(G);
                        this._doublePending = true;
                        G.spawnDelay = effectiveInterval * INTERVAL_MULTIPLIERS['double'];
                    } else {
                        this.spawnObstacle(G);
                        this.advancePattern();
                        G.spawnDelay = effectiveInterval * INTERVAL_MULTIPLIERS['single'];
                    }
                }
                G.spawnDelay += (Math.random() - 0.5) * 0.25;
                G.spawnDelay = Math.max(0.35, G.spawnDelay);
            }

            const speed = G.currentSpeed;
            for (let i = G.obstacles.length - 1; i >= 0; i--) {
                const obs = G.obstacles[i];
                obs.worldX -= speed * dt;
                const screenX = obs.worldX - G.cameraX;

                if (!obs.passed && screenX + obs.width < G.player.x) {
                    obs.passed = true;
                    G.score += 10;
                }

                if (G.state === 'playing') {
                    const pCircle = Physics.getPlayerCircle();
                    const oRect = Physics.getObstacleRect({x: screenX, y: obs.y, width: obs.width, height: obs.height});
                    const playerFeetY = G.player.y + G.player.height - 4;
                    const obstacleTopY = obs.y + 8;

                    if (playerFeetY > obstacleTopY) {
                        if (Physics.checkCircleCollision(pCircle.x, pCircle.y, pCircle.radius, oRect)) {
                            G.triggerGameOver();
                        }
                    }
                }

                if (screenX < -50) G.obstacles.splice(i, 1);
            }
        },

        advancePattern: function() {
            this._patternIndex = (this._patternIndex + 1) % RHYTHM_PATTERN.length;
        },

        spawnObstacle: function(G) {
            const r = Math.random();
            let type = r < 0.38 ? 'rock' : (r < 0.72 ? 'tree' : 'snowman');
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
                    ctx.beginPath(); ctx.moveTo(ox, oy+oh); ctx.lineTo(ox+ow*0.5, oy); ctx.lineTo(ox+ow, oy+oh); ctx.fill();
                    ctx.fillStyle = '#5d6b6c';
                    ctx.beginPath(); ctx.moveTo(ox+5, oy+oh-5); ctx.lineTo(ox+ow*0.5, oy+8); ctx.lineTo(ox+ow-5, oy+oh-5); ctx.fill();
                } else if (obs.type === 'tree') {
                    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(ox+ow*0.35, oy+oh*0.4, ow*0.3, oh*0.6);
                    ctx.fillStyle = '#2d5a27';
                    ctx.beginPath(); ctx.moveTo(ox, oy+oh*0.5); ctx.lineTo(ox+ow*0.5, oy); ctx.lineTo(ox+ow, oy+oh*0.5); ctx.fill();
                    ctx.fillStyle = '#1e421a';
                    ctx.beginPath(); ctx.moveTo(ox+ow*0.2, oy+oh*0.5); ctx.lineTo(ox+ow*0.5, oy+oh*0.12); ctx.lineTo(ox+ow*0.8, oy+oh*0.5); ctx.fill();
                } else if (obs.type === 'snowman') {
                    ctx.fillStyle = '#f0f8ff';
                    ctx.beginPath(); ctx.arc(ox+ow/2, oy+oh-8, 12, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(ox+ow/2, oy+oh-24, 9, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#2c3e50'; ctx.fillRect(ox+ow/2-7, oy+oh-36, 14, 4); ctx.fillRect(ox+ow/2-4, oy+oh-43, 8, 9);
                    ctx.fillStyle = '#000';
                    ctx.beginPath(); ctx.arc(ox+ow/2-3, oy+oh-27, 1.2, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(ox+ow/2+3, oy+oh-27, 1.2, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#e67e22';
                    ctx.beginPath(); ctx.moveTo(ox+ow/2, oy+oh-25); ctx.lineTo(ox+ow/2+5, oy+oh-23); ctx.lineTo(ox+ow/2, oy+oh-22); ctx.fill();
                }
            }
        }
    };
})();
