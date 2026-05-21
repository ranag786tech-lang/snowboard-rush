const CACHE_NAME = 'snowboard-rush-v1';
const ASSETS = [
    '.',
    'index.html',
    'manifest.json',
    'js/core/engine.js',
    'js/core/physics.js',
    'js/core/renderer.js',
    'js/systems/audio.js',
    'js/systems/terrain.js',
    'js/systems/tricks.js',
    'js/systems/powerups.js',
    'js/systems/achievements.js',
    'js/entities/player.js',
    'js/entities/obstacles.js',
    'js/entities/bosses.js',
    'js/ui/hud.js',
    'js/ui/overlays.js',
    'js/main.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached =>
            cached || fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
        )
    );
});
