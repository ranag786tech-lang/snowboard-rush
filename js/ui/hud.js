// hud.js — HUD with landing quality feedback
// ⚠️ Replace entire file
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

            // Landing quality indicator
            const quality = TrickSystem.getLandingQuality();
            if (quality && G.player && G.player.grounded && G.state === 'playing') {
                const colors = {
                    'perfect': '#ffd700',
                    'good': '#7fff7f',
                    'sloppy': '#ffaa44',
                    'crash': '#ff4444'
                };
                const labels = {
                    'perfect': 'PERFECT',
                    'good': 'GOOD',
                    'sloppy': 'SLOPPY',
                    'crash': 'CRASH'
                };
                ctx.fillStyle = colors[quality] || '#fff';
                ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
                ctx.textAlign = 'center';
                const alpha = Math.min(1, TrickSystem._landingCooldown * 5);
                ctx.globalAlpha = alpha;
                ctx.fillText(labels[quality] || '', G.player.x + G.player.width/2, G.player.y - 12);
                ctx.globalAlpha = 1;
            }

            // Trick & landing popups
            this.drawPopups(ctx, G);

            // Achievement popups
            this.drawAchievementPopups(ctx, G);
        },

        drawPopups: function(ctx, G) {
            if (!G.trickList) return;
            for (let i = G.trickList.length - 1; i >= 0; i--) {
                const t = G.trickList[i];
                t.life -= 0.016;
                if (t.life <= 0) { G.trickList.splice(i, 1); continue; }
                const alpha = Math.min(1, t.life);
                const yOffset = (1.5 - t.life) * 28;
                const color = t.color || '#ffffff';
                ctx.fillStyle = color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
                if (color.startsWith('#')) {
                    ctx.fillStyle = color;
                    ctx.globalAlpha = alpha;
                }
                ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(t.text, t.x, t.y - yOffset);
                if (t.points > 0) {
                    ctx.fillStyle = `rgba(255,215,0,${alpha})`;
                    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
                    ctx.fillText(`+${t.points}`, t.x, t.y - yOffset + 17);
                }
                ctx.globalAlpha = 1;
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
                if (ctx.roundRect) {
                    ctx.roundRect(bx - 120, by - 18, 240, 40, 10);
                } else {
                    ctx.rect(bx - 120, by - 18, 240, 40);
                }
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
})();
