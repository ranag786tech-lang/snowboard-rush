// hud.js — Heads-up display (score, speed, boost, achievements, trick popups)
(function() {
    'use strict';

    window.HUD = {
        draw: function(ctx, G) {
            ctx.fillStyle = '#1a3b4b';
            ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${Math.floor(G.score)}`, 18, 38);
            ctx.font = '13px "Segoe UI", system-ui, sans-serif';
            ctx.fillText(`Best: ${Math.floor(G.bestScore)}`, 18, 58);
            ctx.fillText(`Speed: ${Math.floor(G.currentSpeed)}`, 18, 76);

            // Boost indicator
            if (G.boostActive) {
                ctx.fillStyle = '#00ccff';
                ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`⚡ BOOST ${G.boostTimer.toFixed(1)}s`, G.W - 18, 34);
            }

            // Combo counter
            if (G.comboCount > 1) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Combo x${G.comboCount}`, G.W/2, 55);
            }

            // Trick popups
            this.drawTrickPopups(ctx, G);

            // Achievement popups
            this.drawAchievementPopups(ctx, G);
        },

        drawTrickPopups: function(ctx, G) {
            if (!G.trickList) return;
            for (let i = G.trickList.length - 1; i >= 0; i--) {
                const t = G.trickList[i];
                t.life -= 0.016;
                if (t.life <= 0) { G.trickList.splice(i, 1); continue; }
                const alpha = Math.min(1, t.life);
                const yOffset = (1.5 - t.life) * 30;
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(t.text, t.x, t.y - yOffset);
                if (t.points) {
                    ctx.fillStyle = `rgba(255,215,0,${alpha})`;
                    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
                    ctx.fillText(`+${t.points}`, t.x, t.y - yOffset + 18);
                }
            }
        },

        drawAchievementPopups: function(ctx, G) {
            if (!G._achPopups) return;
            for (let i = G._achPopups.length - 1; i >= 0; i--) {
                const a = G._achPopups[i];
                a.life -= 0.016;
                if (a.life <= 0) { G._achPopups.splice(i, 1); continue; }
                const alpha = Math.min(1, a.life);
                const yOff = (2.5 - a.life) * 25;
                const bx = G.W/2, by = G.H - 80 - yOff;
                ctx.fillStyle = `rgba(0,0,0,${alpha * 0.7})`;
                ctx.beginPath();
                ctx.roundRect(bx - 120, by - 18, 240, 40, 10);
                ctx.fill();
                ctx.fillStyle = `rgba(255,215,0,${alpha})`;
                ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(a.text, bx, by);
                ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
                ctx.font = '11px "Segoe UI", system-ui, sans-serif';
                ctx.fillText(a.sub, bx, by + 16);
            }
        }
    };

    // Polyfill roundRect if needed
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
            this.beginPath();
            this.moveTo(x + r.tl, y);
            this.lineTo(x + w - r.tr, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
            this.lineTo(x + w, y + h - r.br);
            this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
            this.lineTo(x + r.bl, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
            this.lineTo(x, y + r.tl);
            this.quadraticCurveTo(x, y, x + r.tl, y);
            this.closePath();
        };
    }
})();
