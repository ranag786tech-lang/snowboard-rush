// engine.js — Central game state, timing, and lifecycle
(function() {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const W = canvas.width;   // 800
    const H = canvas.height;  // 400

    window.Game = {
        canvas, W, H,
        ctx: canvas.getContext('2d'),
        lastTimestamp: 0,
        dt: 0.016,

        state: 'start',
        score: 0,
        distance: 0,
        bestScore: 0,
        cameraX: 0,

        player: null,
        obstacles: [],
        snowflakes: [],
        particles: [],
        landingParticles: [],

        boostActive: false,
        boostTimer: 0,
        shakeAmount: 0,
        comboCount: 0,
        trickList: [],

        audioUnlocked: false,
        achievementsEarned: [],

        obstacleTimer: 0,
        spawnDelay: 0,

        GRAVITY: 1800,
        BASE_SPEED: 380,
        JUMP_VELOCITY: -650,
        COYOTE_TIME: 0.12,
        coyoteTimer: 0,
        wasGrounded: true,

        mountainOffset1: 0,
        mountainOffset2: 0,
        terrainOffset: 0,

        _landingSpeedMod: 1.0,
        _landingSpeedTimer: 0,
        _achPopups: [],

        init: function() {
            this.state = 'start';
            this.score = 0;
            this.distance = 0;
            this.cameraX = 0;
            this.obstacles = [];
            this.particles = [];
            this.landingParticles = [];
            this.boostActive = false;
            this.boostTimer = 0;
            this.shakeAmount = 0;
            this.comboCount = 0;
            this.trickList = [];
            this.terrainOffset = 0;
            this.obstacleTimer = 0;
            this.spawnDelay = 1.2 + Math.random() * 1.0;
            this.coyoteTimer = 0;
            this.wasGrounded = true;
            this.mountainOffset1 = 0;
            this.mountainOffset2 = 0;
            this.achievementsEarned = [];
            this.currentSpeed = this.BASE_SPEED;
            this._landingSpeedMod = 1.0;
            this._landingSpeedTimer = 0;
            this._achPopups = [];

            PlayerEntity.reset();
            ObstacleManager.reset();
            PowerupSystem.reset();
            TrickSystem.reset();
            AchievementSystem.reset();
            this.initSnowflakes();

            if (this.player) this.player.crashed = false;

            try {
                this.bestScore = parseInt(localStorage.getItem('snowBest')) || 0;
            } catch(e) { this.bestScore = 0; }
            try {
                this.achievementsEarned = JSON.parse(localStorage.getItem('snowAchievements') || '[]');
            } catch(e) { this.achievementsEarned = []; }
        },

        initSnowflakes: function() {
            this.snowflakes = [];
            for (let i = 0; i < 60; i++) {
                this.snowflakes.push({
                    x: Math.random() * this.W,
                    y: Math.random() * this.H,
                    radius: Math.random() * 3 + 1,
                    speed: Math.random() * 30 + 15,
                    drift: Math.random() * 20 - 10,
                    opacity: Math.random() * 0.7 + 0.3
                });
            }
        },

        startGame: function() {
            this.state = 'playing';
        },

        triggerGameOver: function() {
            if (this.state !== 'playing') return;
            this.state = 'over';
            this.shakeAmount = 14;
            if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 80]);

            if (this.player) {
                this.player.crashed = true;
                this.player.rotation = 0;
                this.player.spinSpeed = 0;
                TrickSystem.stopGrab && TrickSystem.stopGrab();
            }

            const p = this.player;
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    x: p.x + p.width/2, y: p.y + p.height/2,
                    vx: Math.random() * 400 - 200,
                    vy: Math.random() * -350 - 60,
                    life: 1.0, size: Math.random() * 4 + 2
                });
            }

            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                try { localStorage.setItem('snowBest', this.bestScore); } catch(e) {}
            }
            try {
                localStorage.setItem('snowAchievements', JSON.stringify(this.achievementsEarned));
            } catch(e) {}
            AchievementSystem.checkAll();
        },

        get currentSpeed() {
            return this._currentSpeed || this.BASE_SPEED;
        },
        set currentSpeed(v) {
            this._currentSpeed = v;
        }
    };

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
})();
