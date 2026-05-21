// tricks.js – Handles airborne rotation and trick scoring
const TrickSystem = (function() {
    // Exposed state on window.game
    window.game = window.game || {};
    window.game.tricks = 0;
    window.game.combo = 0;

    let previousRotation = 0;

    function reset() {
        window.game.tricks = 0;
        window.game.combo = 0;
        previousRotation = 0;
    }

    function update(dt) {
        const player = window.game.player;
        if (!player) return;

        // Spin control only when airborne
        if (!player.grounded && window.game.started && !window.game.over) {
            // Spin speed is set by input (main.js)
            player.rotation += (player.spinSpeed || 0) * dt;
        }
    }

    function onLanding() {
        const player = window.game.player;
        if (!player) return;

        // Detect full rotations (flip count)
        let fullRotations = Math.floor(Math.abs(player.rotation) / (Math.PI * 2));
        if (fullRotations > 0 && player.grounded) {
            // Award points per flip
            let basePoints = fullRotations * 200;
            // Combo multiplier
            window.game.combo++;
            let multiplier = 1 + (window.game.combo - 1) * 0.5;
            let totalPoints = Math.floor(basePoints * multiplier);
            
            window.game.score += totalPoints;
            window.game.tricks++;

            AudioEngine.playLand(); // extra feedback for flip landing

            // Reset rotation for next jump
            player.rotation = 0;
        } else if (player.grounded) {
            // Reset rotation when landing without tricks
            player.rotation = 0;
            window.game.combo = 0;
        }

        previousRotation = player.rotation;
    }

    // Called from main.js when jump is initiated
    function onJump() {
        const player = window.game.player;
        if (!player) return;
        // Reset rotation on new jump
        player.rotation = 0;
        player.spinSpeed = 0;
    }

    return {
        reset,
        update,
        onLanding,
        onJump
    };
})();
