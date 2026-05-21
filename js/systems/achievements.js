// achievements.js — Achievement tracking with localStorage persistence
(function() {
    'use strict';

    const ACHIEVEMENTS = [
        { id: 'first_jump',    name: 'First Air',        desc: 'Perform your first jump',         check: (G) => G.distance > 50 },
        { id: 'first_flip',    name: 'Spin Doctor',      desc: 'Land a flip trick',                check: (G) => (G.trickList && G.trickList.length > 0) || G.comboCount > 0 },
        { id: 'score_1000',    name: 'Point Rider',      desc: 'Reach 1000 points',                check: (G) => G.score >= 1000 },
        { id: 'score_5000',    name: 'Slope Legend',     desc: 'Reach 5000 points',                check: (G) => G.score >= 5000 },
        { id: 'boost_collect', name: 'Power Surge',      desc: 'Collect a boost powerup',          check: (G) => G.boostActive || G.boostTimer > 0 },
        { id: 'combo_3',       name: 'Trick Master',     desc: 'Get a 3x trick combo',             check: (G) => G.comboCount >= 3 },
        { id: 'distance_500',  name: 'Mountain Goat',    desc: 'Travel 500 distance',              check: (G) => G.distance >= 500 },
        { id: 'triple_flip',   name: 'Triple Threat',    desc: 'Land a triple flip (1080°)',       check: (G) => G.trickList && G.trickList.some(t => t.text.includes('1080')) },
    ];

    window.AchievementSystem = {
        reset: function() {
            // achievementsEarned persists from engine init
        },

        check: function(trigger, value) {
            const G = window.Game;
            if (G.state !== 'playing') return;
            for (const ach of ACHIEVEMENTS) {
                if (G.achievementsEarned.includes(ach.id)) continue;
                if (ach.check(G)) {
                    G.achievementsEarned.push(ach.id);
                    this.showPopup(ach);
                    AudioEngine.playAchievement();
                    try {
                        localStorage.setItem('snowAchievements', JSON.stringify(G.achievementsEarned));
                    } catch(e) {}
                }
            }
        },

        checkAll: function() {
            // Called on game over to catch any missed
            this.check();
        },

        showPopup: function(ach) {
            const G = window.Game;
            // Add to HUD popup queue
            if (!G._achPopups) G._achPopups = [];
            G._achPopups.push({
                text: `🏆 ${ach.name}`,
                sub: ach.desc,
                life: 2.5
            });
        },

        getList: function() {
            return ACHIEVEMENTS;
        }
    };
})();
