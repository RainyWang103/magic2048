const CACHE_NAME = 'magic2048-v1';

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
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
