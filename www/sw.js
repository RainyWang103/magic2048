const CACHE_NAME = 'magic2048-v4';

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/index.css',
    './js/index.js',
    './background-castle-black.png',
    './images/tile-2.png',
    './images/tile-4.png',
    './images/tile-8.png',
    './images/tile-16.png',
    './images/tile-32.png',
    './images/tile-64.png',
    './images/tile-128.png',
    './images/tile-256.png',
    './images/tile-512.png',
    './images/tile-1024.png',
    './images/tile-2048.png',
    './images/milestone-8.png',
    './images/milestone-16.png',
    './images/milestone-32.png',
    './images/milestone-64.png',
    './images/milestone-128.png',
    './images/milestone-256.png',
    './images/milestone-512.png',
    './images/milestone-1024.png',
    './images/milestone-2048.png',
    './audio/HarryPotterPrologue-soft.mp3',
    './audio/milestone-8-gryffindor.mp3',
    './audio/milestone-16-quidditch-player.mp3',
    './audio/milestone-32-checkmate.mp3',
    './audio/milestone-64-patronus.mp3',
    './audio/milestone-128-name-in-cup.mp3',
    './audio/milestone-256-fight.mp3',
    './audio/milestone-512-chosen-one.mp3',
    './audio/milestone-1024-risk-their-lives.mp3',
    './audio/milestone-2048-cheering.mp3'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Network-first for HTML navigation — always serve the freshest page when online,
    // fall back to cache only when offline.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Network-first for JS and CSS — always fetch the latest code when online so
    // any deploy is reflected immediately without bumping the SW cache version.
    // Falls back to cache when offline.
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Cache-first for everything else (images, audio) — large assets that rarely change.
    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request))
    );
});
