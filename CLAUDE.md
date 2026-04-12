# CLAUDE.md — Magic 2048 (Harry Potter Theme)

## Project Overview

Magic 2048 is a Harry Potter-themed take on the classic 2048 sliding-tile puzzle game. It is a single-page web application built with vanilla HTML/CSS/JavaScript that can also be packaged as an Android APK via Apache Cordova.

- **Play in browser**: open `www/index.html` directly
- **Package for Android**: use Cordova CLI (see Build section)

---

## Repository Structure

```
magic2048/
├── www/                         # All web application code
│   ├── index.html               # Main HTML — screens, audio elements
│   ├── js/index.js              # All game logic (single JS file)
│   ├── css/index.css            # All styles (single CSS file)
│   ├── images/                  # Tile and milestone images
│   │   ├── tile-{value}.png     # Default tile images (2, 4, 8, …, 2048)
│   │   └── milestone-{value}.png # Milestone reveal images (8, 16, …, 2048)
│   ├── audio/                   # Sound effects and background music
│   │   ├── HarryPotterPrologue-soft.mp3  # Looping background music
│   │   └── milestone-{value}-{desc}.mp3  # Per-milestone sound clips
│   └── background-castle-black.png       # Full-screen background image
├── resources/
│   └── logo.png                 # App icon (referenced in config.xml)
├── config.xml                   # Cordova app configuration
├── package.json                 # Node dependencies (cordova-android dev dep)
├── package-lock.json
├── .gitignore                   # Ignores node_modules/, plugins/, platforms/
└── README.md
```

---

## Game Architecture

### Screens (HTML `id`s)

| Element ID       | Purpose                                          |
|-----------------|--------------------------------------------------|
| `welcome-screen` | Initial screen with animated "Start New Game" button |
| `game-select`    | Mode picker: 4×4, 5×5, 6×6 (`mode_4/5/6`)       |
| `game-screen`    | Active game board + Back/Restart buttons         |
| `success-message`| Shown on winning (reaching 2048)                |
| `game-over`      | Shown when no moves remain                      |

### Core State Variables (`www/js/index.js`)

| Variable        | Type      | Purpose                                                  |
|----------------|-----------|----------------------------------------------------------|
| `tiles`         | `number[][]` | 2D array of the current board; `null` = empty cell   |
| `size`          | `number`  | Current grid size (4, 5, or 6)                          |
| `gameWon`       | `boolean` | Locks input once 2048 is reached                        |
| `reached`       | `object`  | Tracks which milestone values have fired this session    |
| `imageMap`      | `object`  | Maps tile value → default tile image URL                |
| `milestoneImageMap` | `object` | Maps milestone value → special reveal image URL    |
| `milestoneSound`| `object`  | Maps milestone value → `<audio>` DOM element            |

### Game Logic Flow

1. `initGame(mode)` — resets `tiles`, `reached`, sizes `gameContainer` via CSS grid, spawns two random tiles, calls `renderTiles()`.
2. `addRandomTile()` — places a new tile (90% chance `2`, 10% `4`) **only on a border cell** of the grid.
3. `renderTiles()` — clears `gameContainer`, iterates `tiles`, creates `.tile` `<div>`s, attaches images, triggers milestone effects.
4. `triggerTileEffect(value)` — fires milestone sound + image swap animation on first reach; sets `gameWon = true` if 2048 reached.
5. `renderNewTiles(newTiles, oldTiles)` — commits a move only if the board changed, then spawns a tile, re-renders, and checks `isGameOver()`.

### Movement Functions

All four direction functions (`moveUp`, `moveDown`, `moveLeft`, `moveRight`) follow the same pattern:
1. Extract non-null values for each row/column in the direction of movement.
2. Call `mergeTiles(row)` — merges adjacent equal values (left-to-right in extracted array).
3. Write values back, padding with `null`.

### Milestone System

Harry Potter narrative milestones fire the first time a tile value is reached:

| Tile Value | Harry Potter Reference         |
|-----------|-------------------------------|
| 8         | Sorted into Gryffindor        |
| 16        | Quidditch player              |
| 32        | Wizard chess checkmate        |
| 64        | Casts a Patronus              |
| 128       | Name in the Goblet of Fire    |
| 256       | The fight                     |
| 512       | The Chosen One                |
| 1024      | Risk their lives              |
| 2048      | Victory cheering (WIN)        |

On first reach: a `milestone` CSS animation plays (scale pulse), the milestone image displays for ~1 second, then `triggerMilestoneTileImageSwap` replaces it with the default tile image via `setTimeout(..., 1000)`.

---

## Asset Naming Conventions

Always follow these naming patterns when adding new assets:

- Default tile image: `www/images/tile-{value}.png`  (e.g. `tile-4096.png`)
- Milestone image: `www/images/milestone-{value}.png` (e.g. `milestone-4096.png`)
- Milestone audio: `www/audio/milestone-{value}-{short-description}.mp3`
- Audio element `id`: `milestone-sound-{value}` (must match HTML and JS)

When adding a new milestone value you must update **all four** of the following locations:
1. `www/index.html` — add `<audio id="milestone-sound-{value}">` element
2. `www/js/index.js` — add value to `smallMilestones` and/or `bigMilestones` arrays
3. `www/images/` — add `milestone-{value}.png` and `tile-{value}.png`
4. `www/audio/` — add `milestone-{value}-{desc}.mp3`

---

## CSS Conventions (`www/css/index.css`)

- **Color palette**: deep blue tones — `#374e73` (primary), `#47628f` (secondary), `#9cb0b6` (game board background)
- **Tile size**: 100×100 px per cell, with 15 px grid gaps
- **Grid container width formula**: `size * 100 + (size - 1) * 15` px (computed in JS)
- **Named keyframe animations**:
  - `fadeIn` — opacity 0→1 (used on game-select, game-container, success-message)
  - `bounce` — vertical translation loop (used on start button)
  - `milestone` — scale 1→1.2→1 pulse (used on first-reach tiles)

---

## Input Handling

- **Keyboard**: `window` `keydown` listener → `handleKeyPress` → arrow keys only
- **Touch (mobile/Cordova)**: registered in `onDeviceReady` on `gameContainer`
  - `touchstart` / `touchmove` (prevents scroll) / `touchend` → `handleSwipe`
  - Swipe direction determined by the larger of `|deltaX|` vs `|deltaY|`

---

## Cordova / Android Build

Prerequisites: Node.js, Cordova CLI (`npm install -g cordova`), Android SDK.

```bash
# Install dev dependencies
npm install

# Add Android platform (only needed once)
cordova platform add android

# Run in Android emulator
cordova emulate android

# Build debug APK
cordova build android
# Output: platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

The `platforms/` and `plugins/` directories are git-ignored and regenerated by Cordova.

App metadata lives in `config.xml`:
- App ID: `com.rainywang.www`
- Display name: `Magic2048`
- Icon: `resources/logo.png`

---

## Development Workflow

There are no automated tests or a build system for the web code. Development cycle:

1. Edit files in `www/`.
2. Open `www/index.html` in a browser to test immediately.
3. For mobile-specific behaviour (touch events, `deviceready`), use `cordova emulate android`.

### Known TODOs (from code comments)

- `www/js/index.js:35-37` — planned animations: owl start animation, success/purple-bus milestone animation
- `www/index.html:62-63` — background music source may need replacing with a milder version

---

## Branch Conventions

- Main branch: `main`
- Feature branches: `claude/<description>-<id>` (as used by automated tooling)

---

## Key Files Quick Reference

| File | Responsibility |
|------|---------------|
| `www/index.html` | DOM structure, audio elements, script tags |
| `www/js/index.js` | All game logic, state, event listeners |
| `www/css/index.css` | All styles and animations |
| `config.xml` | Cordova app metadata and icon |
| `package.json` | `cordova-android` dev dependency |
