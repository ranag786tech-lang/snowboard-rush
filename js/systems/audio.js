// audio.js — Retro WebAudio synth engine
(function() {
    'use strict';

    let audioCtx = null;

    function getCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function beep(freq, duration, type, volume, rampTime) {
        try {
            const ctx = getCtx();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || 'square';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(volume || 0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (rampTime || duration));
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch(e) {}
    }

    window.AudioEngine = {
        init: function() {
            try {
                const ctx = getCtx();
                if (ctx.state === 'suspended') ctx.resume();
                window.Game.audioUnlocked = true;
            } catch(e) {}
        },

        playJump: function() { beep(530, 0.09, 'square', 0.10, 0.06); },
        playLand: function() { beep(300, 0.06, 'triangle', 0.06, 0.04); },
        playCrash: function() { beep(65, 0.45, 'sawtooth', 0.14, 0.35); },
        playBoostActivate: function() {
            beep(900, 0.06, 'square', 0.11, 0.04);
            setTimeout(() => beep(1150, 0.07, 'square', 0.10, 0.05), 55);
        },
        playTrick: function(flips) {
            const baseFreq = 440 + flips * 80;
            beep(baseFreq, 0.12, 'square', 0.09, 0.08);
        },
        playAchievement: function() {
            beep(660, 0.08, 'triangle', 0.10, 0.05);
            setTimeout(() => beep(880, 0.10, 'triangle', 0.10, 0.06), 80);
            setTimeout(() => beep(1100, 0.12, 'triangle', 0.10, 0.07), 160);
        }
    };
})();
