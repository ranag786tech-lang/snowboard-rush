// terrain.js — Procedural terrain height generation
(function() {
    'use strict';

    const BASE_GROUND = 340;

    window.TerrainSystem = {
        // Returns ground Y at a given world X coordinate
        getHeight: function(worldX) {
            let h = BASE_GROUND;
            // Primary rolling hills
            h += Math.sin(worldX * 0.008) * 22;
            // Secondary variation
            h += Math.sin(worldX * 0.023 + 1.2) * 10;
            // Small detail
            h += Math.sin(worldX * 0.055) * 5;
            // Occasional ramps (sharper peaks)
            const ramp = Math.sin(worldX * 0.004 + 2.5);
            if (ramp > 0.7) h += (ramp - 0.7) * 40;
            return h;
        },

        // Returns ground Y at player's current world position
        getPlayerGround: function() {
            const G = window.Game;
            const wx = G.cameraX + G.player.x;
            return this.getHeight(wx);
        },

        // Get ground Y for a screen X position
        getScreenGround: function(screenX) {
            const G = window.Game;
            return this.getHeight(G.cameraX + screenX);
        }
    };
})();
