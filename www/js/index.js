/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// ===========================================================================================
// Version
// ===========================================================================================
const APP_VERSION = '1.2.0';
document.getElementById('app-version').textContent = `v${APP_VERSION}`;

// ===========================================================================================
// Game Value Setup
// ===========================================================================================
const allTileValues   = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
const smallMilestones = [8, 16, 32, 64, 128, 256, 512, 1024, 2048];
const bigMilestones   = [8, 16, 32, 64, 128, 256, 512, 1024, 2048];
const finalMilestone  = 2048;

let size;
let tiles    = [];
let gameWon  = false;
// Each tile is { id: number, value: number, isNew?: true, merged?: true } | null
// nextTileId gives every tile a stable identity for FLIP animation tracking
let nextTileId = 0;

const imageMap         = {};
const milestoneImageMap = {};
const milestoneSound   = {};
let reached = {};

// Persist sound preference across sessions; default ON
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

// TODO (have tentative): game app icon: castle lite / glasses with bolt (probably better with castle)
// TODO：game start animation: owl coming with admission letter
// TODO: success animations: purple bus coming or something more tied to success, note:* for the purple bus milestone, better integrate Sirius

// ===========================================================================================
// Assets Setup
// ===========================================================================================
const backgroundMusic = document.getElementById('background-music');

allTileValues.forEach((value) => {
    imageMap[value] = `images/tile-${value}.png`;
});

smallMilestones.forEach((value) => {
    reached[value] = false;
    milestoneImageMap[value] = `images/milestone-${value}.png`;
});
bigMilestones.forEach((value) => {
    milestoneSound[value] = document.getElementById(`milestone-sound-${value}`);
});

// Eagerly warm the browser's image cache so every tile and milestone image is
// decoded before it is first needed — prevents blank-frame flashes on milestone.
(function preloadGameImages() {
    allTileValues.forEach(value => { new Image().src = imageMap[value]; });
    smallMilestones.forEach(value => { new Image().src = milestoneImageMap[value]; });
}());

// ===========================================================================================
// Elements
// ===========================================================================================
const passwordScreen = document.getElementById('password-screen');
const passwordInput  = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const passwordError  = document.getElementById('password-error');

const welcomeScreen = document.getElementById('welcome-screen');
const startButton   = document.getElementById('start-button');

const gameSelectScreen = document.getElementById('game-select');
const mode4 = document.getElementById('mode_4');
const mode5 = document.getElementById('mode_5');
const mode6 = document.getElementById('mode_6');

const gameScreen    = document.getElementById('game-screen');
const gameContainer = document.getElementById('game-container');
const gameButtons   = document.getElementById('game-buttons');
const backToSelect  = document.getElementById('back-to-select');
const restartButton = document.getElementById('restart-button');
const successMessage  = document.getElementById('success-message');
const gameOverElement = document.getElementById('game-over');

const soundToggle  = document.getElementById('sound-toggle');
const soundOnIcon  = document.getElementById('sound-on-icon');
const soundOffIcon = document.getElementById('sound-off-icon');

// ===========================================================================================
// Sound Toggle
// ===========================================================================================
function applySoundState() {
    backgroundMusic.muted = !soundEnabled;
    bigMilestones.forEach(value => {
        if (milestoneSound[value]) milestoneSound[value].muted = !soundEnabled;
    });
    if (soundOnIcon)  soundOnIcon.style.display  = soundEnabled ? 'block' : 'none';
    if (soundOffIcon) soundOffIcon.style.display = soundEnabled ? 'none'  : 'block';
    if (soundToggle)  soundToggle.classList.toggle('muted', !soundEnabled);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    applySoundState();
}

if (soundToggle) soundToggle.addEventListener('click', toggleSound);
// Apply persisted state immediately on load
applySoundState();

// ===========================================================================================
// Event Listeners
// ===========================================================================================
window.addEventListener('keydown', handleKeyPress);

// Password gate
function checkPassword() {
    if (passwordInput.value.toLowerCase() === 'gryffindor') {
        passwordScreen.style.display = 'none';
        welcomeScreen.style.display  = 'block';
    } else {
        passwordError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
}
passwordSubmit.addEventListener('click', checkPassword);
passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPassword(); });

// Touch events: register via deviceready in Cordova, or immediately in a browser
document.addEventListener('deviceready', onDeviceReady, false);
if (!window.cordova) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDeviceReady);
    } else {
        onDeviceReady();
    }
}
function onDeviceReady() {
    gameContainer.addEventListener('touchstart', handleTouchStart, false);
    gameContainer.addEventListener('touchmove',  handleTouchMove,  false);
    gameContainer.addEventListener('touchend',   handleTouchEnd,   false);
}

startButton.addEventListener('click', () => {
    // Unlock every milestone audio element within this user-gesture context.
    // iOS Safari and some Android browsers require the very first play() on
    // each HTMLAudioElement to be called inside a user-gesture handler.
    bigMilestones.forEach(value => {
        const audio = milestoneSound[value];
        if (audio) {
            audio.volume = 0;
            const p = audio.play();
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;
            if (p !== undefined) p.catch(() => {});
        }
    });
    startButton.style.display   = 'none';
    welcomeScreen.style.display = 'none';
    gameSelectScreen.style.display = 'grid';
    // Always call play(); muted state controls audibility
    backgroundMusic.play().catch(() => {});
});

mode4.addEventListener('click', () => {
    gameScreen.style.display      = 'flex';
    gameSelectScreen.style.display = 'none';
    initGame(4);
});
mode5.addEventListener('click', () => {
    gameScreen.style.display      = 'flex';
    gameSelectScreen.style.display = 'none';
    initGame(5);
});
mode6.addEventListener('click', () => {
    gameScreen.style.display      = 'flex';
    gameSelectScreen.style.display = 'none';
    initGame(6);
});

restartButton.addEventListener('click', () => initGame(size));
backToSelect.addEventListener('click', () => {
    gameScreen.style.display      = 'none';
    gameSelectScreen.style.display = 'grid';
});

// ===========================================================================================
// Effects
// ===========================================================================================
function triggerTileEffect(value) {
    if (smallMilestones.includes(value)) {
        if (!reached[value]) {
            reached[value] = true;
            if (bigMilestones.includes(value) && soundEnabled) {
                const sound = milestoneSound[value];
                if (sound) {
                    sound.currentTime = 0;
                    sound.play().catch(err => console.warn(`Milestone ${value} audio play failed:`, err));
                }
            }
            if (value === finalMilestone) {
                gameWon = true;
                showSuccessMessage();
            }
            return true;
        }
    }
    return false;
}

// After 1 s, swap the milestone splash image back to the regular tile image.
// uniqueId is the tile's stable numeric id (not the value) so we find the right DOM node
// even when multiple tiles share the same value.
function triggerMilestoneTileImageSwap(tileValue, uniqueId) {
    setTimeout(() => {
        const oldTile = document.getElementById(`tile_${uniqueId}`);
        if (!oldTile) return;
        const newTile = document.createElement('div');
        newTile.className = 'tile has-value';
        newTile.id = `tile_${uniqueId}`;
        const newImageUrl = imageMap[tileValue];
        if (newImageUrl) {
            const img = document.createElement('img');
            img.src = newImageUrl;
            newTile.appendChild(img);
            gameContainer.replaceChild(newTile, oldTile);
        }
    }, 1000);
}

function showSuccessMessage() {
    successMessage.style.display = 'block';
}

// ===========================================================================================
// Game Logic
// ===========================================================================================
function renderTiles() {
    gameContainer.innerHTML = '';
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const tileObj = tiles[row][col];
            const tile = document.createElement('div');

            if (tileObj === null) {
                tile.className = 'tile';
                gameContainer.appendChild(tile);
                continue;
            }

            tile.id        = `tile_${tileObj.id}`;
            tile.className = 'tile has-value';

            // Spawn animation — cleared immediately so next copy of tiles is flag-free
            if (tileObj.isNew) {
                tile.classList.add('new-tile');
                tileObj.isNew = false;
            }
            // Merge pop — cleared immediately (delay handled by CSS animation-delay)
            if (tileObj.merged) {
                tile.classList.add('merged-tile');
                tileObj.merged = false;
            }

            // Milestone: first time this value is reached
            const reachedMilestone = triggerTileEffect(tileObj.value);
            let shouldTriggerMilestoneImageSwap = false;

            if (reachedMilestone) {
                shouldTriggerMilestoneImageSwap = true;
                const milestoneUrl = milestoneImageMap[tileObj.value];
                if (milestoneUrl) {
                    const img = document.createElement('img');
                    img.src = milestoneUrl;
                    tile.appendChild(img);
                    // Defer the scale animation until the image is decoded so the tile
                    // never flashes blank before the milestone effect plays.
                    const startAnim = () => {
                        tile.classList.add('milestone');
                        tile.style.animation = 'milestone 0.8s';
                    };
                    if (img.complete && img.naturalWidth > 0) {
                        startAnim();
                    } else if (typeof img.decode === 'function') {
                        img.decode().then(startAnim).catch(startAnim);
                    } else {
                        img.addEventListener('load',  startAnim, { once: true });
                        img.addEventListener('error', startAnim, { once: true });
                    }
                } else {
                    tile.classList.add('milestone');
                    tile.style.animation = 'milestone 0.8s';
                }
            } else {
                const imageUrl = imageMap[tileObj.value];
                if (imageUrl) {
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    tile.appendChild(img);
                }
            }

            gameContainer.appendChild(tile);

            if (shouldTriggerMilestoneImageSwap) {
                triggerMilestoneTileImageSwap(tileObj.value, tileObj.id);
            }
        }
    }
}

// Returns layout constants that scale down for larger grids so that gaps and
// border-radii stay proportional to tile size, preserving the same visual feel
// across 4×4, 5×5, and 6×6 modes.
function getLayoutForSize(gridSize) {
    if (gridSize <= 4) return { gap: 8, padding: 8, borderRadius: 10 };
    if (gridSize === 5) return { gap: 6, padding: 6, borderRadius: 8 };
    return                     { gap: 5, padding: 5, borderRadius: 6 }; // 6×6
}

// Compute the best tile size (px) to fit the grid on the current viewport.
// Caps at 100 px on large screens; floors at 40 px on very small ones.
function computeTileSize(gridSize) {
    const { gap, padding }  = getLayoutForSize(gridSize);
    const containerPad      = padding * 2;
    const screenPadding     = 40;
    const buttonAreaHeight  = 80;

    const availableWidth  = window.innerWidth  - screenPadding - containerPad;
    const availableHeight = window.innerHeight - screenPadding - containerPad - buttonAreaHeight;
    const available = Math.min(availableWidth, availableHeight);

    const tileSize = Math.floor((available - gap * (gridSize - 1)) / gridSize);
    return Math.min(Math.max(tileSize, 40), 100);
}

function initGame(mode) {
    // Called with no argument from the start-button handler (before mode is chosen) — no-op
    if (!mode) return;

    size    = mode;
    gameWon = false;
    reached = {};
    nextTileId = 0;
    tiles = Array.from({ length: size }, () => Array(size).fill(null));

    const { gap, padding, borderRadius } = getLayoutForSize(size);
    const tileSize      = computeTileSize(size);
    const gridDim       = size * tileSize + (size - 1) * gap;
    const containerSize = gridDim + padding * 2;

    gameContainer.style.gridTemplateColumns = `repeat(${size}, ${tileSize}px)`;
    gameContainer.style.gridTemplateRows    = `repeat(${size}, ${tileSize}px)`;
    gameContainer.style.width   = `${containerSize}px`;
    gameContainer.style.height  = `${containerSize}px`;
    gameContainer.style.gap     = `${gap}px`;
    gameContainer.style.padding = `${padding}px`;
    gameContainer.style.setProperty('--tile-font-size',      `${Math.floor(tileSize * 0.7)}px`);
    gameContainer.style.setProperty('--tile-border-radius',  `${borderRadius}px`);
    gameButtons.style.width = `${containerSize}px`;

    gameOverElement.style.display  = 'none';
    successMessage.style.display   = 'none';
    addRandomTile();
    addRandomTile();
    renderTiles();
}

// Add a random tile (2 or 4) to an empty border spot in the grid.
// The tile is given a stable unique id for FLIP animation tracking.
function addRandomTile() {
    const emptyBorderTiles = [];
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (tiles[row][col] === null &&
                (row === 0 || row === size - 1 || col === 0 || col === size - 1)) {
                emptyBorderTiles.push({ row, col });
            }
        }
    }
    if (emptyBorderTiles.length === 0) return;

    const { row, col } = emptyBorderTiles[Math.floor(Math.random() * emptyBorderTiles.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    tiles[row][col] = { id: nextTileId++, value, isNew: true };
}

// Check if no moves remain
function isGameOver() {
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (tiles[row][col] === null) return false;
            const v = tiles[row][col].value;
            if (row > 0        && tiles[row-1][col] !== null && v === tiles[row-1][col].value) return false;
            if (row < size - 1 && tiles[row+1][col] !== null && v === tiles[row+1][col].value) return false;
            if (col > 0        && tiles[row][col-1] !== null && v === tiles[row][col-1].value) return false;
            if (col < size - 1 && tiles[row][col+1] !== null && v === tiles[row][col+1].value) return false;
        }
    }
    return true;
}

// Merge adjacent equal-value tiles in a compacted row/column array.
// The surviving tile keeps the first tile's id; the absorbed tile disappears.
function mergeTiles(row) {
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i].value === row[i + 1].value) {
            // Keep first tile's id so FLIP can track the surviving tile
            row[i] = { id: row[i].id, value: row[i].value * 2, merged: true };
            row.splice(i + 1, 1);
        }
    }
    return row;
}

// ===========================================================================================
// Touch Control
// ===========================================================================================
let startX, startY, endX, endY;

function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
}

function handleTouchMove(event) {
    event.preventDefault(); // Prevent page scroll while swiping
}

function handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    endX = touch.clientX;
    endY = touch.clientY;
    handleSwipe();
}

function handleSwipe() {
    if (gameWon) return;

    const deltaX    = endX - startX;
    const deltaY    = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    const oldValBoard = JSON.stringify(tiles.map(row => row.map(t => t ? t.value : null)));
    let newTiles = JSON.parse(JSON.stringify(tiles));

    if (absDeltaX > absDeltaY) {
        deltaX > 0 ? moveRight(newTiles) : moveLeft(newTiles);
    } else {
        deltaY > 0 ? moveDown(newTiles) : moveUp(newTiles);
    }
    renderNewTiles(newTiles, oldValBoard);
}

// ===========================================================================================
// Keyboard Control
// ===========================================================================================
function handleKeyPress(event) {
    if (gameWon) return;

    const oldValBoard = JSON.stringify(tiles.map(row => row.map(t => t ? t.value : null)));
    let newTiles = JSON.parse(JSON.stringify(tiles));

    switch (event.key) {
        case 'ArrowUp':    newTiles = moveUp(newTiles);    break;
        case 'ArrowDown':  newTiles = moveDown(newTiles);  break;
        case 'ArrowLeft':  newTiles = moveLeft(newTiles);  break;
        case 'ArrowRight': newTiles = moveRight(newTiles); break;
        default: return;
    }
    renderNewTiles(newTiles, oldValBoard);
}

// Apply a move result: run FLIP slide animation, spawn a new tile, check game over.
function renderNewTiles(newTiles, oldValBoard) {
    const newValBoard = JSON.stringify(newTiles.map(row => row.map(t => t ? t.value : null)));
    if (oldValBoard === newValBoard) return; // board didn't change — ignore

    // 1. Snapshot current DOM positions of every tile by its unique id
    const oldPositions = new Map();
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const tileObj = tiles[row][col];
            if (tileObj) {
                const el = document.getElementById(`tile_${tileObj.id}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    oldPositions.set(tileObj.id, { left: rect.left, top: rect.top });
                }
            }
        }
    }

    // 2. Commit new board state and spawn one random tile
    tiles = newTiles;
    addRandomTile();

    // 3. Record which tile ids are freshly spawned (before renderTiles clears isNew)
    const newTileIds = new Set();
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const t = tiles[row][col];
            if (t && t.isNew) newTileIds.add(t.id);
        }
    }

    // 4. Re-render the DOM (clears isNew / merged flags on tile objects)
    renderTiles();

    // 5. FLIP: for each moved tile, apply an inverse transform so it visually
    //    appears at its old position, then transition to its real (new) position.
    const movedEls = [];
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const tileObj = tiles[row][col];
            if (!tileObj || newTileIds.has(tileObj.id)) continue; // skip new tiles

            const oldPos = oldPositions.get(tileObj.id);
            if (!oldPos) continue; // tile had no prior position (shouldn't happen)

            const el = document.getElementById(`tile_${tileObj.id}`);
            if (!el) continue;

            const newRect = el.getBoundingClientRect();
            const dx = oldPos.left - newRect.left;
            const dy = oldPos.top  - newRect.top;
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue; // didn't move

            el.style.transition = 'none';
            el.style.transform  = `translate(${dx}px, ${dy}px)`;
            movedEls.push(el);
        }
    }

    // 6. Force reflow so the browser registers the starting transform,
    //    then release each tile to animate to its true position.
    if (movedEls.length > 0) {
        gameContainer.offsetHeight; // eslint-disable-line no-unused-expressions
        movedEls.forEach(el => {
            el.style.transition = 'transform 0.12s ease-out';
            el.style.transform  = '';
        });
    }

    // 7. Check for game over
    if (isGameOver()) {
        gameOverElement.style.display = 'block';
    }
}

// ===========================================================================================
// Move Functions
// ===========================================================================================
function moveUp(newTiles) {
    for (let col = 0; col < size; col++) {
        let newRow = [];
        for (let row = 0; row < size; row++) {
            if (newTiles[row][col] !== null) newRow.push(newTiles[row][col]);
        }
        newRow = mergeTiles(newRow);
        for (let row = 0; row < size; row++) {
            newTiles[row][col] = newRow[row] ?? null;
        }
    }
    return newTiles;
}

function moveDown(newTiles) {
    for (let col = 0; col < size; col++) {
        let newRow = [];
        for (let row = size - 1; row >= 0; row--) {
            if (newTiles[row][col] !== null) newRow.push(newTiles[row][col]);
        }
        newRow = mergeTiles(newRow);
        for (let row = size - 1; row >= 0; row--) {
            newTiles[row][col] = newRow[size - 1 - row] ?? null;
        }
    }
    return newTiles;
}

function moveLeft(newTiles) {
    for (let row = 0; row < size; row++) {
        let newCol = [];
        for (let col = 0; col < size; col++) {
            if (newTiles[row][col] !== null) newCol.push(newTiles[row][col]);
        }
        newCol = mergeTiles(newCol);
        for (let col = 0; col < size; col++) {
            newTiles[row][col] = newCol[col] ?? null;
        }
    }
    return newTiles;
}

function moveRight(newTiles) {
    for (let row = 0; row < size; row++) {
        let newCol = [];
        for (let col = size - 1; col >= 0; col--) {
            if (newTiles[row][col] !== null) newCol.push(newTiles[row][col]);
        }
        newCol = mergeTiles(newCol);
        for (let col = size - 1; col >= 0; col--) {
            newTiles[row][col] = newCol[size - 1 - col] ?? null;
        }
    }
    return newTiles;
}

// ===========================================================================================
// Service Worker Registration (PWA offline support)
// ===========================================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // updateViaCache: 'none' forces the browser to always fetch sw.js from the network,
        // bypassing the HTTP cache. Without this, Safari can serve a stale sw.js for up to
        // its cache TTL and never detect that a new version was deployed.
        navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
            .then((registration) => {
                // Explicitly trigger an update check on every page load so new deployments
                // are picked up immediately rather than waiting for the browser's own schedule.
                registration.update();
            });
    });

    // When a new service worker takes control (i.e. an update was deployed), reload the page
    // so the fresh HTML/JS/CSS is applied automatically — no manual cache clearing needed.
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController) return;
        window.location.reload();
    });
}
