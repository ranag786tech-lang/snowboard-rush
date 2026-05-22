// terrain.js — Procedural terrain height generation
(function() {
    'use strict';

    const BASE_GROUND = 340;

    window.TerrainSystem = {
        getHeight: function(worldX) {
            let h = BASE_GROUND;
            h += Math.sin(worldX * 0.008) * 22;
            h += Math.sin(worldX * 0.023 + 1.2) * 10;
            h += Math.sin(worldX * 0.055) * 5;
            const ramp = Math.sin(worldX * 0.004 + 2.5);
            if (ramp > 0.7) h += (ramp - 0.7) * 40;
            return h;
        },

        getPlayerGround: function() {
            const G = window.Game;
            const wx = G.cameraX + G.player.x;
            return this.getHeight(wx);
        },

        getScreenGround: function(screenX) {
            const G = window.Game;
            return this.getHeight(G.cameraX + screenX);
        }
    };
})();
