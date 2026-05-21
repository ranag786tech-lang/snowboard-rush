// tricks.js — Air rotation, flip detection, combo scoring
(function() {
    'use strict';

    window.TrickSystem = {
        reset: function() {
            const G = window.Game;
            G.comboCount = 0;
            G.trickList = [];
            if (G.player) {
                G.player.rotation = 0;
                G.player.spinSpeed = 0;
            }
        },

        // Called every frame
        update: function(dt) {
            const G = window.Game;
            const p = G.player;
            if (!p || G.state !== 'playing') return;

            if (!p.grounded) {
                p.rotation += (p.spinSpeed || 0) * dt;
            }
        },

        // Called when player lands
        onLanding: function() {
            const G = window.Game;
            const p = G.player;
            if (!p) return;

            const absRot = Math.abs(p.rotation);
            const fullSpins = Math.floor(absRot / (Math.PI * 2));

            if (fullSpins > 0 && p.grounded) {
                G.comboCount++;
                const basePoints = fullSpins * 200;
                const multiplier = 1 + (G.comboCount - 1) * 0.4;
                const totalPoints = Math.floor(basePoints * multiplier);

                G.score += totalPoints;

                // Trick name
                let name = '';
                if (fullSpins === 1) name = '360 Spin!';
                else if (fullSpins === 2) name = '720 Double!';
                else if (fullSpins >= 3) name = `${fullSpins * 360}° Mega!`;

                if (name) {
                    G.trickList.push({
                        text: name,
                        x: p.x + p.width/2,
                        y: p.y - 10,
                        life: 1.5,
                        points: totalPoints
                    });
                }

                AudioEngine.playTrick(fullSpins);
                if (navigator.vibrate) navigator.vibrate(15);

                AchievementSystem.check('tricks', fullSpins);
            } else if (p.grounded) {
                G.comboCount = 0;
            }

            // Always reset rotation on ground
            if (p.grounded) {
                p.rotation = 0;
            }
        },

        // Called when jump is initiated
        onJump: function() {
            const p = window.Game.player;
            if (!p) return;
            p.rotation = 0;
            p.spinSpeed = 0;
        }
    };
})();
