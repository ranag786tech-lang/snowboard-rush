// physics.js — Gravity, collision, ground detection with landing speed mod
// ⚠️ Replace entire file
(function() {
    'use strict';

    window.Physics = {
        update: function(dt) {
            const G = window.Game;
            if (G.state !== 'playing') return;

            const p = G.player;
            let speed = G.currentSpeed;

            // Apply landing speed modifier if active
            if (G._landingSpeedTimer && G._landingSpeedTimer > 0) {
                G._landingSpeedTimer -= dt;
                speed *= G._landingSpeedMod || 1.0;
                if (G._landingSpeedTimer <= 0) {
                    G._landingSpeedMod = 1.0;
                    G._landingSpeedTimer = 0;
                }
            }

            // Apply gravity
            p.vy += G.GRAVITY * dt;
            p.y += p.vy * dt;

            // Get terrain height at player position
            const worldX = G.cameraX + p.x;
            const groundY = TerrainSystem.getHeight(worldX) - p.height;

            // Ground collision
            G.wasGrounded = p.grounded;
            if (p.y >= groundY) {
                p.y = groundY;
                p.vy = 0;
                if (!p.grounded) {
                    // Just landed — evaluate landing quality
                    p.grounded = true;
                    TrickSystem.evaluateLanding();
                    // Spawn landing particles
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

            // Update camera and distance
            G.cameraX += speed * dt;
            G.distance += speed * dt;
            G.score = Math.floor(G.distance * 0.08);

            // Update terrain offset for rendering
            G.terrainOffset = G.cameraX;
            G.mountainOffset1 = G.cameraX * 0.3;
            G.mountainOffset2 = G.cameraX * 0.5;

            // Speed ramps with score
            G.currentSpeed = G.BASE_SPEED + G.score * 0.12;

            // Boost speed multiplier
            if (G.boostActive) {
                G.currentSpeed *= 1.7;
            }

            // Apply landing speed modifier to current speed display
            if (G._landingSpeedTimer && G._landingSpeedTimer > 0) {
                G.currentSpeed *= G._landingSpeedMod || 1.0;
            }

            return groundY;
        },

        checkCollision: function(playerRect, obsRect) {
            return (
                playerRect.x < obsRect.x + obsRect.w &&
                playerRect.x + playerRect.w > obsRect.x &&
                playerRect.y < obsRect.y + obsRect.h &&
                playerRect.y + playerRect.h > obsRect.y
            );
        },

        getPlayerHitbox: function() {
            const p = window.Game.player;
            return {
                x: p.x + 5, y: p.y + 7,
                w: p.width - 10, h: p.height - 14
            };
        }
    };

    // Helper: spawn landing snow puffs
    function spawnLandingParticles() {
        const G = window.Game;
        const p = G.player;
        if (!p) return;
        for (let i = 0; i < 7; i++) {
            G.landingParticles.push({
                x: p.x + p.width / 2 + (Math.random() - 0.5) * 18,
                y: p.y + p.height - 3,
                vx: (Math.random() - 0.5) * 70,
                vy: Math.random() * -80 - 40,
                life: 0.7,
                size: Math.random() * 3 + 2
            });
        }
    }
})();
