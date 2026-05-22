// renderer.js — All drawing routines, with crashed pose
(function() {
    'use strict';

    window.Renderer = {
        draw: function() {
            const G = window.Game;
            const ctx = G.ctx;
            ctx.clearRect(0, 0, G.W, G.H);

            ctx.save();
            if (G.shakeAmount > 0) {
                const sx = (Math.random() - 0.5) * G.shakeAmount;
                const sy = (Math.random() - 0.5) * G.shakeAmount;
                ctx.translate(sx, sy);
            }

            this.drawSky(ctx, G);
            this.drawMountains(ctx, G);
            this.drawGround(ctx, G);
            ObstacleManager.draw(ctx, G);
            PowerupSystem.draw(ctx, G);
            this.drawLandingParticles(ctx, G);
            this.drawPlayer(ctx, G);
            this.drawCrashParticles(ctx, G);
            this.drawSnowflakes(ctx, G);
            BossSystem.draw(ctx, G);

            ctx.restore();

            HUD.draw(ctx, G);
            Overlays.draw(ctx, G);
        },

        drawSky: function(ctx, G) {
            const grad = ctx.createLinearGradient(0, 0, 0, G.H);
            grad.addColorStop(0, '#b3e0f2');
            grad.addColorStop(0.7, '#d9f0f8');
            grad.addColorStop(1, '#f0f7fa');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, G.W, G.H);
        },

        drawMountains: function(ctx, G) {
            ctx.fillStyle = '#c1dde8';
            ctx.beginPath();
            ctx.moveTo(0, 280);
            for (let x = 0; x <= G.W + 60; x += 50) {
                ctx.lineTo(x, 165 + Math.sin((x + G.mountainOffset1) * 0.014) * 32);
            }
            ctx.lineTo(G.W, 310); ctx.lineTo(0, 310); ctx.fill();

            ctx.fillStyle = '#b0d0dc';
            ctx.beginPath();
            ctx.moveTo(0, 305);
            for (let x = 0; x <= G.W + 60; x += 50) {
                ctx.lineTo(x, 215 + Math.sin((x + G.mountainOffset2) * 0.022) * 28);
            }
            ctx.lineTo(G.W, 340); ctx.lineTo(0, 340); ctx.fill();
        },

        drawGround: function(ctx, G) {
            const baseY = 340;
            ctx.fillStyle = '#f5faff';
            ctx.beginPath();
            ctx.moveTo(0, baseY + 10);
            for (let x = 0; x <= G.W; x += 30) {
                const wx = G.cameraX + x;
                const h = TerrainSystem.getHeight(wx);
                ctx.lineTo(x, h + 3);
            }
            ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();

            ctx.strokeStyle = '#dce8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x <= G.W; x += 30) {
                const wx = G.cameraX + x;
                const h = TerrainSystem.getHeight(wx);
                if (x === 0) ctx.moveTo(x, h);
                else ctx.lineTo(x, h);
            }
            ctx.stroke();
        },

        drawPlayer: function(ctx, G) {
            const p = G.player;
            if (!p) return;
            ctx.save();
            const cx = p.x + p.width/2;
            const cy = p.y + p.height/2;
            ctx.translate(cx, cy);

            if (p.crashed) {
                ctx.rotate(1.2);
                ctx.fillStyle = '#5c3a20';
                ctx.fillRect(-p.width/2 - 10, -5, p.width + 20, 8);
                ctx.fillStyle = '#8b5a2b';
                ctx.fillRect(-p.width/2 - 5, -4, p.width + 10, 4);
                ctx.fillStyle = '#1a3350';
                ctx.fillRect(-10, -20, 6, 15);
                ctx.fillRect(2, -22, 6, 15);
                ctx.fillStyle = '#2a5f8a';
                ctx.fillRect(-12, -10, 20, 16);
                ctx.fillStyle = '#f7d9aa';
                ctx.beginPath();
                ctx.arc(4, -16, 8, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
                return;
            }

            const tilt = p.grounded ? 0 : -0.12;
            ctx.rotate(p.rotation + tilt);
            const sx = p.grounded ? 1 : 1.04;
            const sy = p.grounded ? 1 : 0.90;
            ctx.scale(sx, sy);
            ctx.translate(-cx, -cy);

            const px = p.x, py = p.y, pw = p.width, ph = p.height;

            // Board
            ctx.fillStyle = '#5c3a20';
            ctx.fillRect(px - 5, py + ph - 8, pw + 10, 8);
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(px - 2, py + ph - 6, pw + 4, 4);
            // Legs
            ctx.fillStyle = '#1a3350';
            ctx.fillRect(px + 6, py + 26, 8, 18);
            ctx.fillRect(px + 16, py + 26, 8, 18);
            // Body
            ctx.fillStyle = '#2a5f8a';
            ctx.fillRect(px + 4, py + 8, 20, 20);
            // Arms
            const isGrabbing = typeof TrickSystem.isGrabbing === 'function' && TrickSystem.isGrabbing();
            ctx.fillStyle = '#1a3350';
            if (isGrabbing) {
                ctx.beginPath();
                ctx.moveTo(px + 4, py + 18);
                ctx.lineTo(px + pw/2, py + ph - 4);
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#1a3350';
                ctx.stroke();
                ctx.lineWidth = 1;
            } else {
                ctx.fillRect(px - 3, py + 12, 8, 6);
                ctx.fillRect(px + 23, py + 12, 8, 6);
            }
            // Head
            ctx.fillStyle = '#f7d9aa';
            ctx.beginPath();
            ctx.arc(px + 14, py + 4, 10, 0, Math.PI*2);
            ctx.fill();
            // Goggles
            ctx.fillStyle = '#1c1c1c';
            ctx.fillRect(px + 5, py - 1, 18, 5);
            ctx.fillStyle = '#4a90e2';
            ctx.fillRect(px + 7, py, 7, 3);
            ctx.fillRect(px + 16, py, 7, 3);
            // Beanie
            ctx.fillStyle = '#d94040';
            ctx.beginPath();
            ctx.ellipse(px + 14, py - 1, 11, 7, 0, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(px + 7, py - 9, 14, 6);

            if (G.boostActive) {
                ctx.shadowColor = '#00c8ff';
                ctx.shadowBlur = 16;
                ctx.fillStyle = 'rgba(0,200,255,0.25)';
                ctx.fillRect(px - 6, py - 4, pw + 12, ph + 8);
                ctx.shadowBlur = 0;
            }
            ctx.restore();
        },

        drawLandingParticles: function(ctx, G) {
            for (const p of G.landingParticles) {
                ctx.fillStyle = `rgba(255,255,255,${p.life * 0.85})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
        },

        drawCrashParticles: function(ctx, G) {
            for (const p of G.particles) {
                ctx.fillStyle = `rgba(255,255,255,${p.life * 0.7})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
        },

        drawSnowflakes: function(ctx, G) {
            for (const f of G.snowflakes) {
                ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
                ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();
            }
        }
    };
})();
