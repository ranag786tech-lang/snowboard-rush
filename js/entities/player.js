// player.js — Player entity creation and state
(function() {
    'use strict';

    const PLAYER_X = 140;
    const PLAYER_WIDTH = 28;
    const PLAYER_HEIGHT = 52;

    window.PlayerEntity = {
        create: function() {
            const G = window.Game;
            const groundY = TerrainSystem.getHeight(PLAYER_X);
            G.player = {
                x: PLAYER_X,
                y: groundY - PLAYER_HEIGHT,
                width: PLAYER_WIDTH,
                height: PLAYER_HEIGHT,
                vy: 0,
                grounded: true,
                rotation: 0,
                spinSpeed: 0,
                targetRotation: 0
            };
            return G.player;
        },

        reset: function() {
            const G = window.Game;
            if (!G.player) {
                this.create();
            } else {
                const groundY = TerrainSystem.getHeight(PLAYER_X);
                G.player.y = groundY - PLAYER_HEIGHT;
                G.player.vy = 0;
                G.player.grounded = true;
                G.player.rotation = 0;
                G.player.spinSpeed = 0;
                G.player.x = PLAYER_X;
                G.player.width = PLAYER_WIDTH;
                G.player.height = PLAYER_HEIGHT;
            }
        },

        jump: function() {
            const G = window.Game;
            const p = G.player;
            if (!p) return;

            if (G.state === 'over') {
                G.init();
                G.startGame();
                return;
            }
            if (G.state === 'start') {
                G.startGame();
            }

            // Audio init on first interaction
            if (!G.audioUnlocked) AudioEngine.init();

            if (G.coyoteTimer > 0 && G.state === 'playing') {
                p.vy = G.JUMP_VELOCITY;
                p.grounded = false;
                G.coyoteTimer = 0;
                AudioEngine.playJump();
                TrickSystem.onJump();
                AchievementSystem.check('first_jump');
            }
        },

        setSpin: function(direction) {
            const p = window.Game.player;
            if (!p || window.Game.state !== 'playing') return;
            if (direction === 'left') p.spinSpeed = -9;
            else if (direction === 'right') p.spinSpeed = 9;
            else p.spinSpeed = 0;
        }
    };
})();
