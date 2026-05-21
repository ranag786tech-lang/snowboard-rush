// physics.js — Gravity, collision, ground detection
(function() {
    'use strict';

    window.Physics = {
        update: function(dt) {
            const G = window.Game;
            if (G.state !== 'playing') return;

            const p = G.player;
            const speed = G.currentSpeed;

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

            // Smooth rotation reset when grounded
            if (p.grounded && Math.abs(p.rotation) > 0.01) {
                p.rotation *= 0.82;
                if (Math.abs(p.rotation) < 0.02) p.rotation = 0;
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
})();
