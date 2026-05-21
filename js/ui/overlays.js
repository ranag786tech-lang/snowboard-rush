// overlays.js — Start screen and game over overlay
(function() {
    'use strict';

    window.Overlays = {
        draw: function(ctx, G) {
            if (G.state === 'start') this.drawStart(ctx, G);
            if (G.state === 'over') this.drawGameOver(ctx, G);
        },

        drawStart: function(ctx, G) {
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, G.W, G.H);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏂 Snowboard Rush', G.W/2, G.H/2 - 40);
            ctx.font = '16px "Segoe UI", system-ui, sans-serif';
            ctx.fillText('Press Space / Tap to Jump', G.W/2, G.H/2 + 5);
            ctx.fillText('← → or Touch Sides to Spin', G.W/2, G.H/2 + 28);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '12px "Segoe UI", system-ui, sans-serif';
            ctx.fillText('Collect ⚡ for speed boost | Land tricks for bonus', G.W/2, G.H/2 + 55);
        },

        drawGameOver: function(ctx, G) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, G.W, G.H);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💥 Wipeout!', G.W/2, G.H/2 - 45);
            ctx.font = '22px "Segoe UI", system-ui, sans-serif';
            ctx.fillText(`Score: ${Math.floor(G.score)}`, G.W/2, G.H/2);
            if (G.score >= G.bestScore && G.score > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
                ctx.fillText('🏆 New Best!', G.W/2, G.H/2 + 28);
                ctx.fillStyle = '#fff';
            }
            ctx.font = '14px "Segoe UI", system-ui, sans-serif';
            ctx.fillText('Tap or press Space to ride again', G.W/2, G.H/2 + 55);

            // Show earned achievements this run
            if (G.achievementsEarned && G.achievementsEarned.length > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '11px "Segoe UI", system-ui, sans-serif';
                ctx.fillText(`Achievements: ${G.achievementsEarned.length} unlocked`, G.W/2, G.H/2 + 78);
            }
        }
    };
})();
