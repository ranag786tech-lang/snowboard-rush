// audio.js – Retro beep sounds using Web Audio API
const AudioEngine = (function() {
    let ctx = null;

    function getContext() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctx;
    }

    function beep(freq, duration, type = 'square', volume = 0.12) {
        const c = getContext();
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(c.destination);

        gain.gain.setValueAtTime(volume, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

        osc.start();
        osc.stop(c.currentTime + duration);
    }

    return {
        playJump: () => beep(520, 0.08, 'square', 0.1),
        playLand: () => beep(320, 0.05, 'triangle', 0.07),
        playCrash: () => beep(70, 0.4, 'sawtooth', 0.15),
        playBoostActivate: () => {
            beep(880, 0.06, 'square', 0.12);
            setTimeout(() => beep(1100, 0.07, 'square', 0.1), 60);
        },
        // Optional: wind ambience could be added later as a continuous oscillator
    };
})();
