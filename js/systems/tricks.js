// tricks.js — Advanced trick system: spins, grabs, landing evaluation
(function() {
    'use strict';

    const SPIN_DECAY = 14;
    const MAX_SPIN_SPEED = 10;
    const PERFECT_THRESHOLD = 0.15;
    const GOOD_THRESHOLD    = 0.50;
    const SLOPPY_THRESHOLD  = 1.10;
    const RECOVERY_PERFECT = 9.0;
    const RECOVERY_GOOD    = 5.0;
    const RECOVERY_SLOPPY  = 2.2;
    const RECOVERY_CRASH   = 1.0;

    const GRAB_TYPES = {
        indy:    { name: 'Indy Grab',    multiplier: 1.3 },
        melon:   { name: 'Melon Grab',   multiplier: 1.5 },
        stalefish: { name: 'Stalefish',  multiplier: 1.8 }
    };
    const DEFAULT_GRAB = 'indy';

    window.TrickSystem = {
        _landingQuality: null,
        _recoveryRate: 5.0,
        _landingCooldown: 0,
        _currentGrab: null,
        _grabHeld: false,

        reset: function() {
            const G = window.Game;
            G.comboCount = 0;
            G.trickList = [];
            this._landingQuality = null;
            this._recoveryRate = 5.0;
            this._landingCooldown = 0;
            this._currentGrab = null;
            this._grabHeld = false;
            if (G.player) {
                G.player.rotation = 0;
                G.player.spinSpeed = 0;
            }
        },

        startGrab: function() {
            const p = window.Game.player;
            if (!p || p.grounded) return;
            if (!this._grabHeld) {
                this._grabHeld = true;
                this._currentGrab = DEFAULT_GRAB;
                p.spinSpeed *= 0.5;
            }
        },

        stopGrab: function() {
            this._grabHeld = false;
        },

        isGrabbing: function() {
            return this._grabHeld;
        },

        getGrabType: function() {
            return this._currentGrab;
        },

        update: function(dt) {
            const G = window.Game;
            const p = G.player;
            if (!p || G.state !== 'playing') return;

            if (this._landingCooldown > 0) {
                this._landingCooldown -= dt;
            }

            if (!p.grounded) {
                p.rotation += (p.spinSpeed || 0) * dt;
                const decayMultiplier = this._grabHeld ? 0.6 : 1.0;
                if (Math.abs(p.spinSpeed) > 0.05) {
                    const decay = SPIN_DECAY * dt * decayMultiplier;
                    if (Math.abs(p.spinSpeed) <= decay) {
                        p.spinSpeed = 0;
                    } else {
                        p.spinSpeed -= Math.sign(p.spinSpeed) * decay;
                    }
                }
                if (Math.abs(p.spinSpeed) > MAX_SPIN_SPEED) {
                    p.spinSpeed = Math.sign(p.spinSpeed) * MAX_SPIN_SPEED;
                }
            } else {
                if (Math.abs(p.rotation) > 0.005) {
                    p.rotation *= Math.exp(-this._recoveryRate * dt);
                    if (Math.abs(p.rotation) < 0.008) p.rotation = 0;
                } else {
                    p.rotation = 0;
                }
            }
        },

        onJump: function() {
            const p = window.Game.player;
            if (!p) return;
            p.rotation = 0;
            p.spinSpeed = 0;
            this._landingQuality = null;
            this._landingCooldown = 0;
            this._currentGrab = null;
            this._grabHeld = false;
        },

        evaluateLanding: function() {
            const G = window.Game;
            const p = G.player;
            if (!p || this._landingCooldown > 0) return;

            this._landingCooldown = 0.15;
            const TWO_PI = Math.PI * 2;
            let raw = p.rotation;
            let normalized = ((raw % TWO_PI) + TWO_PI) % TWO_PI;
            let angularError = Math.min(normalized, TWO_PI - normalized);

            let quality, recoveryRate, scoreMultiplier, speedEffect, popupText, popupColor;

            if (angularError <= PERFECT_THRESHOLD) {
                quality = 'perfect'; recoveryRate = RECOVERY_PERFECT; scoreMultiplier = 2.0; speedEffect = 1.05;
                popupText = '✨ PERFECT!'; popupColor = '#ffd700';
            } else if (angularError <= GOOD_THRESHOLD) {
                quality = 'good'; recoveryRate = RECOVERY_GOOD; scoreMultiplier = 1.0; speedEffect = 1.0;
                popupText = '👍 NICE!'; popupColor = '#7fff7f';
            } else if (angularError <= SLOPPY_THRESHOLD) {
                quality = 'sloppy'; recoveryRate = RECOVERY_SLOPPY; scoreMultiplier = 0.5; speedEffect = 0.85;
                popupText = '😬 SLOPPY'; popupColor = '#ffaa44';
            } else {
                quality = 'crash'; recoveryRate = RECOVERY_CRASH; scoreMultiplier = 0; speedEffect = 0.55;
                popupText = '💥 CRASH!'; popupColor = '#ff4444';
                G.shakeAmount = Math.max(G.shakeAmount, 7);
                if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
            }

            this._recoveryRate = recoveryRate;
            this._landingQuality = quality;

            let grabMultiplier = 1.0;
            let grabName = '';
            if (this._grabHeld && this._currentGrab) {
                const grabDef = GRAB_TYPES[this._currentGrab];
                if (grabDef) { grabMultiplier = grabDef.multiplier; grabName = grabDef.name; }
            }

            const fullSpins = Math.floor(Math.abs(raw) / TWO_PI);
            let trickPoints = 0;

            if (fullSpins > 0) {
                G.comboCount++;
                const basePoints = fullSpins * 200;
                const comboMultiplier = 1 + (G.comboCount - 1) * 0.4;
                trickPoints = Math.floor(basePoints * comboMultiplier * scoreMultiplier * grabMultiplier);
                G.score += trickPoints;

                let spinName = '';
                if (fullSpins === 1) spinName = '360';
                else if (fullSpins === 2) spinName = '720';
                else if (fullSpins >= 3) spinName = `${fullSpins * 360}°`;

                let fullTrickName = spinName;
                if (grabName) fullTrickName += ' ' + grabName;
                if (quality !== 'crash' && fullTrickName) {
                    G.trickList.push({
                        text: fullTrickName + ' ' + quality.toUpperCase() + '!',
                        x: p.x + p.width/2, y: p.y - 10,
                        life: 1.6, points: trickPoints, color: popupColor
                    });
                }
                AudioEngine.playTrick(fullSpins);
                AchievementSystem.check('tricks', fullSpins);
            } else {
                G.comboCount = 0;
            }

            G.trickList.push({
                text: popupText,
                x: p.x + p.width/2, y: p.y - 30,
                life: 1.2, points: quality === 'perfect' ? 50 : 0, color: popupColor
            });

            if (speedEffect !== 1.0 && G.state === 'playing') {
                G._landingSpeedMod = speedEffect;
                G._landingSpeedTimer = 0.6;
            }

            if (quality === 'perfect') {
                AudioEngine.playLand();
                setTimeout(() => AudioEngine.playTrick(0), 80);
            } else if (quality === 'crash') {
                AudioEngine.playCrash();
            } else {
                AudioEngine.playLand();
            }

            if (quality === 'crash' && navigator.vibrate) {
                navigator.vibrate([25, 15, 25]);
            }

            this._grabHeld = false;
            this._currentGrab = null;
        },

        getLandingQuality: function() { return this._landingQuality; },
        getRecoveryRate: function() { return this._recoveryRate; }
    };
})();
