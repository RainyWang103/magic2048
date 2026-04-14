# CLAUDE.md — Magic 2048 (Harry Potter Theme)

## Project Overview

Magic 2048 is a Harry Potter-themed take on the classic 2048 sliding-tile puzzle game. It is a single-page web application built with vanilla HTML/CSS/JavaScript that supports:

- **iPhone / iOS Safari**: installable as a PWA (Add to Home Screen) with full-screen standalone mode
- **Android APK**: packaged via Apache Cordova
- **Browser**: open `www/index.html` directly

---

## Repository Structure

```
magic2048/
├── www/                         # All web application code
│   ├── index.html               # Main HTML — screens, audio elements
│   ├── manifest.json            # PWA web app manifest (icons, theme, display mode)
│   ├── sw.js                    # Service worker — caches all assets for offline play
│   ├── js/index.js              # All game logic (single JS file)
│   ├── css/index.css            # All styles (single CSS file)
│   ├── images/                  # Tile and milestone images
│   │   ├── tile-{value}.png     # Default tile images (2, 4, 8, …, 2048)
│   │   └── milestone-{value}.png # Milestone reveal images (8, 16, …, 2048)
│   ├── icons/                   # PWA / home-screen icons
│   │   ├── icon-180.png         # Apple touch icon (iPhone home screen)
│   │   ├── icon-192.png         # Android / Chrome PWA icon
│   │   └── icon-512.png         # High-res PWA icon (maskable)
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

| Element ID        | Purpose                                                     |
|------------------|-------------------------------------------------------------|
| `password-screen` | Password gate (password: `gryffindor`) — guards the game   |
| `welcome-screen`  | Animated "Start New Game" button                           |
| `game-select`     | Mode picker: 4×4, 5×5, 6×6 (`mode_4/5/6`)                 |
| `game-screen`     | Active game board + Back/Restart buttons                   |
| `success-message` | Shown on winning (reaching 2048)                           |
| `game-over`       | Shown when no moves remain                                 |

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

1. `initGame(mode)` — resets `tiles`, `reached`, computes responsive tile size via `computeTileSize()`, sizes `gameContainer` via CSS grid, syncs `game-buttons` width, spawns two random tiles, calls `renderTiles()`.
2. `computeTileSize(gridSize)` — derives the best tile size in px from the current viewport (`window.innerWidth`/`innerHeight`), capped at 100 px and floored at 40 px.
3. `addRandomTile()` — places a new tile (90% chance `2`, 10% `4`) **only on a border cell** of the grid.
4. `renderTiles()` — clears `gameContainer`, iterates `tiles`, creates `.tile` `<div>`s, attaches images, triggers milestone effects.
5. `triggerTileEffect(value)` — fires milestone sound + image swap animation on first reach; sets `gameWon = true` if 2048 reached.
6. `renderNewTiles(newTiles, oldTiles)` — commits a move only if the board changed, then spawns a tile, re-renders, and checks `isGameOver()`.

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
- **Tile size**: computed dynamically in JS via `computeTileSize()`; capped at 100 px on large screens and floored at 40 px on small ones. The CSS custom property `--tile-font-size` is set on `#game-container` and consumed by `.tile`.
- **Grid container width formula**: `size * tileSize + (size - 1) * 15` px (content area, computed in JS)
- **Responsive widths**: all fixed-width screens use `min(<px>, 88–90vw)` so they never overflow an iPhone viewport
- **iOS safe area**: `body` uses `env(safe-area-inset-*)` padding and `height: 100dvh` to handle the notch and home indicator on iPhone
- **Named keyframe animations**:
  - `fadeIn` — opacity 0→1 (used on game-select, game-container, success-message)
  - `bounce` — vertical translation loop (used on start button)
  - `milestone` — scale 1→1.2→1 pulse (used on first-reach tiles)

---

## iPhone / PWA Support

The app is installable on iPhone via Safari → "Add to Home Screen":

| File | Purpose |
|------|---------|
| `www/manifest.json` | PWA metadata: name, theme color, display `standalone`, portrait orientation |
| `www/sw.js` | Service worker: caches assets on install, network-first for HTML/JS/CSS |
| `www/icons/icon-180.png` | Apple touch icon shown on iPhone home screen |
| `www/icons/icon-192.png` | Chrome / Android PWA icon |
| `www/icons/icon-512.png` | High-res maskable icon |

Relevant `<meta>` tags in `index.html`:
- `apple-mobile-web-app-capable` — enables standalone full-screen mode
- `apple-mobile-web-app-status-bar-style: black-translucent` — status bar overlays the content area
- `viewport-fit=cover` — extends layout under the notch; combined with `env(safe-area-inset-*)` in CSS
- `user-scalable=no` — prevents accidental pinch-zoom during gameplay

---

### Service Worker Update Behaviour

The SW is registered with `{ updateViaCache: 'none' }` and `registration.update()` is called on every page load. This means the browser **always fetches `sw.js` fresh from the network** and detects any content change immediately — no HTTP caching delay.

**Cache name (`CACHE_NAME` in `sw.js`) does NOT need to be bumped on routine changes.** When a new SW installs, `cache.addAll(ASSETS)` overwrites all cached entries with fresh copies regardless of the cache name. The name only matters for cleaning up orphaned entries.

| Change type | Action required |
|---|---|
| HTML / JS / CSS change | Bump `APP_VERSION` only — no `sw.js` change needed (those files are network-first) |
| Adding a new image or audio asset | Add entry to `ASSETS` in `sw.js` + bump `APP_VERSION` (the `sw.js` content change triggers reinstall automatically) |
| Removing an asset | Remove from `ASSETS`, bump `CACHE_NAME` (e.g. `v4` → `v5`) to purge the orphaned cache entry, bump `APP_VERSION` |

---

## Input Handling

- **Keyboard**: `window` `keydown` listener → `handleKeyPress` → arrow keys only
- **Touch (mobile/Cordova/PWA)**: registered in `onDeviceReady` on `gameContainer`
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

## Versioning

`APP_VERSION` in `www/js/index.js` is the single source of truth; the version label on the home screen reads from it directly.

Use **semantic versioning** (`MAJOR.MINOR.PATCH`). Determine the increment by the nature of the change:

| Bump | When to use | Examples |
|------|-------------|---------|
| `PATCH` (x.x.**1**) | Bug fixes, copy/text tweaks, style corrections, performance improvements, internal refactors with no visible behaviour change | Fix tile overflow, fix layout bug, tweak font size, fix audio not playing |
| `MINOR` (x.**1**.0) | New user-facing features that are backward-compatible | New grid mode, new milestone, new sound, new animation, new screen |
| `MAJOR` (**2**.0.0) | Fundamental redesigns or breaking changes to how the game works | Complete UI overhaul, change to core game rules, password change |

When in doubt, prefer `MINOR` over `PATCH` for anything the user will notice, and `PATCH` for anything purely internal.

### Per-branch versioning rule

- **First commit on a branch**: bump `APP_VERSION` based on the nature of the change (PATCH / MINOR / MAJOR as above). Include the bump in the same commit as the change.
- **Subsequent commits on the same branch**: re-evaluate the semantic level of the *entire branch* (all changes accumulated so far, not just the latest commit).
  - If the level is unchanged (e.g., the branch is still a collection of bug fixes → still PATCH), keep the version set by the first commit — do **not** bump again.
  - If the accumulated changes now warrant a higher level (e.g., what started as a PATCH fix grew to include a new user-visible feature → upgrade to MINOR), update `APP_VERSION` to reflect the new level in that commit.
- Never downgrade the version mid-branch (e.g., do not go from MINOR back to PATCH).

## Development Workflow

There are no automated tests or a build system for the web code. Development cycle:

1. Edit files in `www/`.
2. On the **first commit of a branch**, bump `APP_VERSION` in `www/js/index.js` following the versioning rules above. On subsequent commits, re-evaluate the semantic level and only update the version if the level has changed (see **Per-branch versioning rule** above).
3. Open `www/index.html` in a browser to test immediately.
4. For mobile-specific behaviour (touch events, `deviceready`), use `cordova emulate android`.
5. For iPhone PWA testing, deploy to GitHub Pages and open the URL in Safari on an iPhone.

### Known TODOs (from code comments)

- `www/js/index.js:35-37` — planned animations: owl start animation, success/purple-bus milestone animation
- `www/index.html:76` — background music source may need replacing with a milder version

---

## Branch Conventions

- Main branch: `main`
- Feature branches: `claude/<description>-<id>` (as used by automated tooling)

---

## Key Files Quick Reference

| File | Responsibility |
|------|---------------|
| `www/index.html` | DOM structure, audio elements, PWA meta tags, script tags |
| `www/manifest.json` | PWA web app manifest |
| `www/sw.js` | Service worker for offline caching |
| `www/js/index.js` | All game logic, state, event listeners, responsive sizing |
| `www/css/index.css` | All styles, animations, iOS safe-area handling |
| `config.xml` | Cordova app metadata and icon |
| `package.json` | `cordova-android` dev dependency |
