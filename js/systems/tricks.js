// tricks.js — Skill-based trick system with landing evaluation
// ⚠️ COMPLETE REWRITE — Replace entire file
(function() {
    'use strict';

    const SPIN_DECAY = 14;        // rad/s² — how fast spin bleeds off
    const MAX_SPIN_SPEED = 10;    // rad/s — spin speed cap

    // Landing quality thresholds (angular distance from 0 or 2π multiple)
    const PERFECT_THRESHOLD = 0.15;   // radians — near-perfect alignment
    const GOOD_THRESHOLD    = 0.50;   // radians — decent landing
    const SLOPPY_THRESHOLD  = 1.10;   // radians — rough but rideable
    // Beyond SLOPPY_THRESHOLD = CRASH landing

    // Decay rates for rotation recovery on ground (higher = faster straighten)
    const RECOVERY_PERFECT = 9.0;    // instant recovery
    const RECOVERY_GOOD    = 5.0;    // quick recovery
    const RECOVERY_SLOPPY  = 2.2;    // slow recovery
    const RECOVERY_CRASH   = 1.0;    // barely recovering

    window.TrickSystem = {
        // Per-player landing state
        _landingQuality: null,    // 'perfect' | 'good' | 'sloppy' | 'crash' | null
        _recoveryRate: 5.0,       // current decay rate
        _landingCooldown: 0,      // brief cooldown after landing

        reset: function() {
            const G = window.Game;
            G.comboCount = 0;
            G.trickList = [];
            this._landingQuality = null;
            this._recoveryRate = 5.0;
            this._landingCooldown = 0;
            if (G.player) {
                G.player.rotation = 0;
                G.player.spinSpeed = 0;
            }
        },

        // ── Called every frame ─────────────────
        update: function(dt) {
            const G = window.Game;
            const p = G.player;
            if (!p || G.state !== 'playing') return;

            // Cooldown tick
            if (this._landingCooldown > 0) {
                this._landingCooldown -= dt;
            }

            if (!p.grounded) {
                // ── AIRBORNE ────────────────────
                // Apply spin input to rotation
                p.rotation += (p.spinSpeed || 0) * dt;

                // Natural spin decay (spin bleeds off over time)
                if (Math.abs(p.spinSpeed) > 0.05) {
                    const decay = SPIN_DECAY * dt;
                    if (Math.abs(p.spinSpeed) <= decay) {
                        p.spinSpeed = 0;
                    } else {
                        p.spinSpeed -= Math.sign(p.spinSpeed) * decay;
                    }
                }

                // Clamp spin speed
                if (Math.abs(p.spinSpeed) > MAX_SPIN_SPEED) {
                    p.spinSpeed = Math.sign(p.spinSpeed) * MAX_SPIN_SPEED;
                }
            } else {
                // ── GROUNDED — recover rotation ──
                if (Math.abs(p.rotation) > 0.005) {
                    p.rotation *= Math.exp(-this._recoveryRate * dt);
                    if (Math.abs(p.rotation) < 0.008) {
                        p.rotation = 0;
                    }
                } else {
                    p.rotation = 0;
                }
            }
        },

        // ── Called when jump initiated ─────────
        onJump: function() {
            const p = window.Game.player;
            if (!p) return;
            p.rotation = 0;
            p.spinSpeed = 0;
            this._landingQuality = null;
            this._landingCooldown = 0;
        },

        // ── Called on ground contact ───────────
        evaluateLanding: function() {
            const G = window.Game;
            const p = G.player;
            if (!p || this._landingCooldown > 0) return;

            this._landingCooldown = 0.15; // prevent double-evaluation

            // Normalize rotation to nearest multiple of 2π
            const TWO_PI = Math.PI * 2;
            let raw = p.rotation;
            // Get remainder in [0, 2π)
            let normalized = ((raw % TWO_PI) + TWO_PI) % TWO_PI;
            // Distance to nearest clean landing (0 or 2π)
            let angularError = Math.min(normalized, TWO_PI - normalized);

            // Determine landing quality
            let quality, recoveryRate, scoreMultiplier, speedEffect, popupText, popupColor;

            if (angularError <= PERFECT_THRESHOLD) {
                quality = 'perfect';
                recoveryRate = RECOVERY_PERFECT;
                scoreMultiplier = 2.0;
                speedEffect = 1.05; // tiny speed bonus
                popupText = '✨ PERFECT!';
                popupColor = '#ffd700';
            } else if (angularError <= GOOD_THRESHOLD) {
                quality = 'good';
                recoveryRate = RECOVERY_GOOD;
                scoreMultiplier = 1.0;
                speedEffect = 1.0;
                popupText = '👍 NICE!';
                popupColor = '#7fff7f';
            } else if (angularError <= SLOPPY_THRESHOLD) {
                quality = 'sloppy';
                recoveryRate = RECOVERY_SLOPPY;
                scoreMultiplier = 0.5;
                speedEffect = 0.85;
                popupText = '😬 SLOPPY';
                popupColor = '#ffaa44';
            } else {
                quality = 'crash';
                recoveryRate = RECOVERY_CRASH;
                scoreMultiplier = 0;
                speedEffect = 0.55;
                popupText = '💥 CRASH!';
                popupColor = '#ff4444';
                // Trigger minor shake + vibration
                G.shakeAmount = Math.max(G.shakeAmount, 7);
                if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
            }

            // Store recovery rate
            this._recoveryRate = recoveryRate;
            this._landingQuality = quality;

            // Count full spins for trick scoring
            const fullSpins = Math.floor(Math.abs(raw) / TWO_PI);

            // Calculate trick points
            let trickPoints = 0;
            if (fullSpins > 0) {
                G.comboCount++;
                const basePoints = fullSpins * 200;
                const comboMultiplier = 1 + (G.comboCount - 1) * 0.4;
                trickPoints = Math.floor(basePoints * comboMultiplier * scoreMultiplier);
                G.score += trickPoints;

                // Trick name
                let name = '';
                if (fullSpins === 1) name = '360';
                else if (fullSpins === 2) name = '720';
                else if (fullSpins >= 3) name = `${fullSpins * 360}°`;

                if (name && quality !== 'crash') {
                    G.trickList.push({
                        text: `${name} ${quality.toUpperCase()}!`,
                        x: p.x + p.width / 2,
                        y: p.y - 10,
                        life: 1.6,
                        points: trickPoints,
                        color: popupColor
                    });
                }

                AudioEngine.playTrick(fullSpins);
                AchievementSystem.check('tricks', fullSpins);
            } else {
                G.comboCount = 0;
            }

            // Landing popup (always show quality)
            G.trickList.push({
                text: popupText,
                x: p.x + p.width / 2,
                y: p.y - 30,
                life: 1.2,
                points: quality === 'perfect' ? 50 : 0,
                color: popupColor
            });

            // Speed effect from landing
            if (speedEffect !== 1.0 && G.state === 'playing') {
                // Apply speed modifier by adjusting camera briefly
                // We use a temporary speed multiplier stored on Game
                G._landingSpeedMod = speedEffect;
                G._landingSpeedTimer = 0.6; // lasts 0.6 seconds
            }

            // Audio feedback
            if (quality === 'perfect') {
                AudioEngine.playLand();
                setTimeout(() => AudioEngine.playTrick(0), 80);
            } else if (quality === 'crash') {
                AudioEngine.playCrash();
            } else {
                AudioEngine.playLand();
            }

            // Vibration for crash landings
            if (quality === 'crash' && navigator.vibrate) {
                navigator.vibrate([25, 15, 25]);
            }
        },

        // ── Getters ─────────────────────────────
        getLandingQuality: function() {
            return this._landingQuality;
        },

        getRecoveryRate: function() {
            return this._recoveryRate;
        }
    };
})();
