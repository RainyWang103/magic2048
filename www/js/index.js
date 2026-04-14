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
const APP_VERSION = '1.0.5';
document.getElementById('app-version').textContent = `v${APP_VERSION}`;

// ===========================================================================================
// Game Value Setup
// ===========================================================================================
const allTileValues  = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
const smallMilestones = [8, 16, 32, 64, 128, 256, 512, 1024, 2048];
const bigMilestones = [8, 16, 32, 64, 128, 256, 512, 1024, 2048];
const finalMilestone = 2048;
let size;
let tiles = [];
let gameWon = false;
const imageMap = {};
const milestoneImageMap = {};
const milestoneSound = {};
let reached = {};

// TODO (have tentative): game app icon: castle lite / glasses with bolt (probably better with castle)
// TODO：game start animation: owl coming with admission letter
// TODO: success animations: purple bus coming or something more tied to success， note:* for the purple bus milestone, better integrete Sirius
// ===========================================================================================
// Assets Setup
// ===========================================================================================
// background Audio
const backgroundMusic = document.getElementById('background-music');

// default tile images
allTileValues.forEach((value) => {
    imageMap[value] = `images/tile-${value}.png`;
})

// milestones setup
smallMilestones.forEach((value) => {
    reached[value] = false;
    milestoneImageMap[value] = `images/milestone-${value}.png`;
})
bigMilestones.forEach((value) => {
    milestoneSound[value] = document.getElementById(`milestone-sound-${value}`);
});

// ===========================================================================================
// Elements
// ===========================================================================================
const passwordScreen = document.getElementById('password-screen');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const passwordError = document.getElementById('password-error');

const welcomeScreen = document.getElementById('welcome-screen');
const startButton = document.getElementById('start-button');

const gameSelectScreen = document.getElementById('game-select');
const mode4 = document.getElementById('mode_4');
const mode5 = document.getElementById('mode_5');
const mode6 = document.getElementById('mode_6');

const gameScreen = document.getElementById('game-screen');
const gameContainer = document.getElementById('game-container');
const gameButtons = document.getElementById('game-buttons');
const backToSelect = document.getElementById('back-to-select');
const restartButton = document.getElementById('restart-button');
const successMessage = document.getElementById('success-message');
const gameOverElement = document.getElementById('game-over');

// ===========================================================================================
// Event listeners
// ===========================================================================================

window.addEventListener('keydown', handleKeyPress);

// Password gate
function checkPassword() {
    if (passwordInput.value.toLowerCase() === 'gryffindor') {
        passwordScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
    } else {
        passwordError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
}
passwordSubmit.addEventListener('click', checkPassword);
passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPassword(); });

// Touch events: register via deviceready in Cordova, or immediately in a browser
document.addEventListener("deviceready", onDeviceReady, false);
if (!window.cordova) {
    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", onDeviceReady);
    } else {
        onDeviceReady();
    }
}
function onDeviceReady() {
    gameContainer.addEventListener('touchstart', handleTouchStart, false);
    gameContainer.addEventListener('touchmove', handleTouchMove, false);
    gameContainer.addEventListener('touchend', handleTouchEnd, false);
}

startButton.addEventListener('click', () => {
    // Unlock every milestone audio element within this user-gesture context.
    // iOS Safari and some Android browsers require the very first play() on
    // each HTMLAudioElement to be called inside a user-gesture handler.
    // We call play() then immediately pause() synchronously so the browser
    // registers the unlock but never produces any audible output.
    // volume is set to 0 as an extra guard; the expected AbortError from
    // interrupting play() with pause() is silenced by .catch(() => {}).
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
    startButton.style.display = 'none';
    welcomeScreen.style.display = 'none';
    gameSelectScreen.style.display = 'grid';
    backgroundMusic.play();
    initGame();
});

mode4.addEventListener('click', () => {
    gameScreen.style.display = 'flex';
    gameSelectScreen.style.display = 'none';
    initGame(4);
});

mode5.addEventListener('click', () => {
    gameScreen.style.display = 'flex';
    gameSelectScreen.style.display = 'none';
    initGame(5);
});

mode6.addEventListener('click', () => {
    gameScreen.style.display = 'flex';
    gameSelectScreen.style.display = 'none';
    initGame(6);
});

restartButton.addEventListener('click', () => {
    initGame(size);
})

backToSelect.addEventListener('click', () => {
    gameScreen.style.display = 'none';
    gameSelectScreen.style.display = 'grid';
})

// ===========================================================================================
// Effects
// ===========================================================================================
function triggerTileEffect(value) {
    if(smallMilestones.includes(value)) {
        console.log(`DEBUG: ${value} is small milestone`);
        if(!reached[value]) {
            console.log(`DEBUG: ${value} not reached yet, triggering effects`);
            reached[value] = true;
            if(bigMilestones.includes(value)) {
                const sound = milestoneSound[value];
                if (sound) {
                    sound.currentTime = 0;
                    sound.play().catch(err => console.warn(`Milestone ${value} audio play failed:`, err));
                }
            }
            if(value === finalMilestone) {
                gameWon = true;
                showSuccessMessage();
            }
            return true;
        }
    }
    return false;
}

function triggerMilestoneTileImageSwap(tileValue) {
    const tileId = getTileId(tileValue);
    setTimeout(() => {
        const oldTile = document.getElementById(tileId);
        let newTile = createNewTile(tileValue);
        const newImageUrl = imageMap[tileValue];
        if(newImageUrl) {
            newTile = attachImageToTile(newTile, newImageUrl);
            gameContainer.replaceChild(newTile, oldTile);
        }
    }, 1000)
}

function showSuccessMessage() {
    console.log('DEBUG: Game Won!');
    successMessage.style.display = 'block';
}

// ===========================================================================================
// Helpers
// ===========================================================================================

function getTileId(tileValue) {
    return `tile_${tileValue}`;
}

function createNewTile(tileValue) {
    const tile = document.createElement('div');
    const tileId = getTileId(tileValue);
    tile.className = 'tile';
    tile.id = tileId;
    return tile;
}

function attachImageToTile(tile, imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    tile.appendChild(img);
    return tile;
}

// ===========================================================================================
// Game Logic
// ===========================================================================================
function renderTiles() {
    gameContainer.innerHTML = '';
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const tileValue = tiles[row][col];
            let tile = createNewTile(tileValue);

            let shouldTriggerMileStoneImageSwap = false;
            if (tileValue !== null) {
                console.log(`DEBUG: Render tile: ${tileValue}`);

                // milestone moving animation
                const reachedMilestone = triggerTileEffect(tileValue);
                let imageUrl;
                if(reachedMilestone) {
                    tile.classList.add('milestone');
                    tile.style.animation = 'milestone 0.8s';
                    imageUrl = milestoneImageMap[tileValue];
                    shouldTriggerMileStoneImageSwap = true;
                } else {
                    imageUrl = imageMap[tileValue];
                }

                // render image of tile
                tile = attachImageToTile(tile, imageUrl);
            }
            // add tile to game view
            gameContainer.appendChild(tile);
            if(shouldTriggerMileStoneImageSwap) {
                triggerMilestoneTileImageSwap(tileValue);
                shouldTriggerMileStoneImageSwap = false;
            }
        }
    }
}

// Compute the best tile size (px) to fit the grid on the current viewport.
// Caps at 100px on large screens; floors at 40px on very small ones.
function computeTileSize(gridSize) {
    const gap = 15;
    const containerPadding = 30; // 15px each side of game-container
    const screenPadding = 40;    // breathing room from screen edges
    const buttonAreaHeight = 80; // approx height for buttons + gap below grid

    const availableWidth = window.innerWidth - screenPadding - containerPadding;
    const availableHeight = window.innerHeight - screenPadding - containerPadding - buttonAreaHeight;
    const available = Math.min(availableWidth, availableHeight);

    const tileSize = Math.floor((available - gap * (gridSize - 1)) / gridSize);
    return Math.min(Math.max(tileSize, 40), 100);
}

function initGame(mode) {
    size = mode;
    reached = {};
    tiles = Array.from({ length: size }, () => Array(size).fill(null)); // two dimentional array

    const gap = 15;
    const tileSize = computeTileSize(size);
    const gridDim = size * tileSize + (size - 1) * gap;

    // containerSize = grid content (gridDim) + 15px padding on each side.
    // box-sizing: border-box means width includes padding, so content area = containerSize - 30.
    const containerSize = gridDim + 30;
    gameContainer.style.gridTemplateColumns = `repeat(${size}, ${tileSize}px)`;
    gameContainer.style.gridTemplateRows = `repeat(${size}, ${tileSize}px)`;
    gameContainer.style.width = `${containerSize}px`;
    gameContainer.style.height = `${containerSize}px`;
    // Scale tile font proportionally (tiles mostly show images; this is fallback text)
    gameContainer.style.setProperty('--tile-font-size', `${Math.floor(tileSize * 0.7)}px`);
    // Align buttons to container width
    gameButtons.style.width = `${containerSize}px`;

    gameOverElement.style.display = 'none';
    successMessage.style.play = 'none';
    addRandomTile();
    addRandomTile();
    renderTiles();
}

// Add a random tile (2 or 4) to an empty border spot in the grid
function addRandomTile() {
    let emptyBorderTiles = [];
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (tiles[row][col] === null && (row === 0 || row === size - 1 || col === 0 || col === size - 1)) {
                emptyBorderTiles.push({ row, col });
            }
        }
    }

    if (emptyBorderTiles.length === 0) return;

    let { row, col } = emptyBorderTiles[Math.floor(Math.random() * emptyBorderTiles.length)];
    // 90% chance 2, 10% chance 4
    tiles[row][col] = Math.random() < 0.9 ? 2 : 4;
}

// Check if the game is over
function isGameOver() {
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (tiles[row][col] === null) {
                return false; // There's at least one empty tile
            }
            if (row > 0 && tiles[row][col] === tiles[row - 1][col]) {
                return false; // Can merge with tile above
            }
            if (row < size - 1 && tiles[row][col] === tiles[row + 1][col]) {
                return false; // Can merge with tile below
            }
            if (col > 0 && tiles[row][col] === tiles[row][col - 1]) {
                return false; // Can merge with tile to the left
            }
            if (col < size - 1 && tiles[row][col] === tiles[row][col + 1]) {
                return false; // Can merge with tile to the right
            }
        }
    }
    return true; // No moves left
}

// Merge tiles with the same value
function mergeTiles(row) {
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
            row[i] *= 2;
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
    console.log("startX ", startX);
}

function handleTouchMove(event) {
    event.preventDefault(); // Prevent scrolling
}

function handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    endX = touch.clientX;
    endY = touch.clientY;
    console.log("endX ", endX);
    handleSwipe();
}

function handleSwipe() {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    const oldTiles = JSON.stringify(tiles); // Save current state
    let newTiles = JSON.parse(oldTiles);

    if(!gameWon) {
        if (absDeltaX > absDeltaY) {
            if (deltaX > 0) {
                moveRight(newTiles);
            } else {
                moveLeft(newTiles);
            }
        } else {
            if (deltaY > 0) {
                moveDown(newTiles);
            } else {
                moveUp(newTiles);
            }
        }
        renderNewTiles(newTiles, oldTiles);
    }
}

// ===========================================================================================
// Game Move Controls
// ===========================================================================================
function handleKeyPress(event) {
    const oldTiles = JSON.stringify(tiles); // Save current state
    let newTiles = JSON.parse(oldTiles);
    if(!gameWon) {
        switch (event.key) {
            case 'ArrowUp':
                newTiles = moveUp(newTiles);
                break;
            case 'ArrowDown':
                newTiles = moveDown(newTiles);
                break;
            case 'ArrowLeft':
                newTiles = moveLeft(newTiles);
                break;
            case 'ArrowRight':
                newTiles = moveRight(newTiles);
                break;
            default:
                return;
        }
        renderNewTiles(newTiles, oldTiles);
    }
}

function renderNewTiles(newTiles, oldTiles) {
    if (oldTiles !== JSON.stringify(newTiles)) {
        tiles = newTiles;
        addRandomTile();
        renderTiles();
        if (isGameOver()) {
            gameOverElement.style.display = 'block';
        }
    }
}

// Game logic for moving tiles
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
    // The `hadController` guard skips the very first SW install so we don't reload on a
    // brand-new visit.
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController) return;
        window.location.reload();
    });
}