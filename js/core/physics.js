// physics.js — Gravity, collision, ground detection, circular hitzone
(function() {
    'use strict';

    window.Physics = {
        // Smoothed delta time
        smoothedDt: 0.016,

        update: function(rawDt) {
            const G = window.Game;
            if (G.state !== 'playing') return;

            // Smooth dt for physics (avoid jitter)
            this.smoothedDt = this.smoothedDt * 0.85 + Math.min(rawDt, 0.05) * 0.15;
            const dt = this.smoothedDt;

            const p = G.player;
            let speed = G.currentSpeed;

            // Landing speed modifier
            if (G._landingSpeedTimer && G._landingSpeedTimer > 0) {
                G._landingSpeedTimer -= dt;
                speed *= G._landingSpeedMod || 1.0;
                if (G._landingSpeedTimer <= 0) {
                    G._landingSpeedMod = 1.0;
                    G._landingSpeedTimer = 0;
                }
            }

            // Gravity
            p.vy += G.GRAVITY * dt;
            p.y += p.vy * dt;

            const worldX = G.cameraX + p.x;
            const groundY = TerrainSystem.getHeight(worldX) - p.height;

            // Ground collision
            G.wasGrounded = p.grounded;
            if (p.y >= groundY) {
                p.y = groundY;
                p.vy = 0;
                if (!p.grounded) {
                    p.grounded = true;
                    TrickSystem.evaluateLanding();
                    spawnLandingParticles();
                    AudioEngine.playLand();
                    AchievementSystem.check('landing');
                }
                p.grounded = true;
            } else {
                p.grounded = false;
            }

            // Coyote time
            if (p.grounded) {
                G.coyoteTimer = G.COYOTE_TIME;
            } else {
                G.coyoteTimer -= dt;
            }

            // Update camera & distance
            G.cameraX += speed * dt;
            G.distance += speed * dt;
            G.score = Math.floor(G.distance * 0.08);

            G.terrainOffset = G.cameraX;
            G.mountainOffset1 = G.cameraX * 0.3;
            G.mountainOffset2 = G.cameraX * 0.5;

            // Speed scaling
            G.currentSpeed = G.BASE_SPEED + G.score * 0.12;
            if (G.boostActive) G.currentSpeed *= 1.7;
            if (G._landingSpeedTimer && G._landingSpeedTimer > 0) {
                G.currentSpeed *= G._landingSpeedMod || 1.0;
            }

            return groundY;
        },

        // Circular collision detection (radius-based)
        checkCircleCollision: function(cx, cy, radius, rect) {
            // Closest point on rectangle to circle center
            const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
            const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
            const dx = cx - closestX;
            const dy = cy - closestY;
            return (dx * dx + dy * dy) < (radius * radius);
        },

        // Player hitbox as circle (center of body, radius ~14)
        getPlayerCircle: function() {
            const p = window.Game.player;
            return {
                x: p.x + p.width/2,
                y: p.y + p.height/2 - 2, // slightly higher center
                radius: 13
            };
        },

        // Obstacle hitbox slightly shrunk
        getObstacleRect: function(obs) {
            return {
                x: obs.x + 6,
                y: obs.y + 6,
                w: obs.width - 12,
                h: obs.height - 10
            };
        },

        checkCollision: function(playerRect, obsRect) {
            // Fallback AABB collision (used elsewhere if needed)
            return (
                playerRect.x < obsRect.x + obsRect.w &&
                playerRect.x + playerRect.w > obsRect.x &&
                playerRect.y < obsRect.y + obsRect.h &&
                playerRect.y + playerRect.h > obsRect.y
            );
        }
    };

    function spawnLandingParticles() {
        const G = window.Game, p = G.player;
        for (let i = 0; i < 7; i++) {
            G.landingParticles.push({
                x: p.x + p.width/2 + (Math.random()-0.5)*18,
                y: p.y + p.height - 3,
                vx: (Math.random()-0.5)*70,
                vy: Math.random()*-80 - 40,
                life: 0.7,
                size: Math.random()*3+2
            });
        }
    }
})();
